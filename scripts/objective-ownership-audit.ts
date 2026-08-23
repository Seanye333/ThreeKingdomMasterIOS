/**
 * 目標 × 開局盤面的靜態對照 —— 一分鐘跑完,抓「題目跟盤面對不上」那一整類。
 *
 * ## 為什麼要有它
 *
 * `objective-sweep.ts` 要跑一個鐘頭才說得出「這一條是死的」,而其中有一整類
 * **靜態就看得出來**:把主目標寫的每一座城,逐一標上**開局歸誰**。
 * 2026-08-09 用手動對照抓到九條,做法簡單到不該只做一次:
 *
 *  - **盤面是戰後,目標照戰前寫**。伊闕盤洛陽已入秦,而韓/魏/趙三家的主目標
 *    全指著它 —— 四條一起 0。
 *  - **開局就成立**。鄢郢盤秦的主目標是「取襄陽、江陵」,而兩座開局都是秦的:
 *    第 0 旬達成,那不是目標是擺設。
 *  - **兩家指著同一座城,而小的那家搶不過**。閼與盤四城的韓與十三城的趙都要上黨。
 *
 * ## 它跟另外兩支的分工
 *
 *  - 這一支:**目標指的城在誰手上**(開局歸屬)。
 *  - `reachability-audit.ts`:在別人手上,而他**打不打得到**(相鄰壓力)。
 *  - `objective-sweep.ts`:實際自走跑一遍(唯一的判決,但要一小時)。
 *
 * 前兩支是診斷,只提示;**要下結論仍然看第三支**。
 *
 * Run:
 *   node --import tsx scripts/objective-ownership-audit.ts
 *   node --import tsx scripts/objective-ownership-audit.ts scn-ws   # 只看戰國線
 */

import { SCENARIOS } from '../src/game/data/scenarios';
import { SCENARIO_OBJECTIVES } from '../src/game/data/objectives';
import { PROVINCE_BY_CITY } from '../src/game/data/provinces';
import type { ObjectiveGoal, ScenarioObjective } from '../src/game/types/objectives';

export type OwnershipFinding = {
  /** 越小越可疑 —— 排序用。 */
  rank: number;
  tag: string;
  line: string;
};

/**
 * 這幾類**不是診斷,是錯**,而且錯得沒有可辯的餘地:
 * 目標指著一座不在這張盤上的城、開局第 0 旬就達成、要滅一家開局就沒有城的
 * 勢力、要救的那一家開局就已經低於門檻。全庫現況是 0,`objectiveOwnership.test.ts`
 * 把它釘住。**其餘的(全取得/搶城/在野可招)是提示,不歸零** —— 那些要跑
 * `objective-sweep.ts` 才判得了死活。
 */
export const HARD_TAGS = [
  '城不在此盤', '第0旬就成立', '對象開局無城', '救援門檻高於開局', '人不在此盤',
  '守成寫了別人的城',
];

/**
 * 文案說「仍據/仍保/Still hold」的,判準是**開局就據有**。
 *
 * 2026-08-16 撞到一條靜態就看得出來卻跑了一小時掃描才發現的:諸葛亮活到八十
 * 那張盤,魏的主目標寫「至255年仍保長安、天水」——**兩座都不在魏手上**,
 * 一個檢查點都沒有過。這不是難不難的問題,是題目寫了別人家的城,
 * 而玩家看到的字面是「守住你已有的」。
 *
 * `evaluateGoal` 對這種寫法不會報錯:全部不據有時它退回「取得」語意,
 * 機制上照樣跑得動 —— 所以只有文案與資料對讀才抓得到。
 */
const HOLD_WORDING = /仍據|仍保|Still hold/i;
/**
 * 例外:文案自己已經說明白「其中一座要打下來」的,不算錯。
 *
 * 「至213年仍據建業**並取**江夏」是正確的寫法 —— 它沒有騙玩家。
 * 第一版沒有這道例外,於是把兩條寫對的也報成錯。
 */
const TAKE_WORDING = /並取|而取|and take|then take/i;

/** 這張盤上,每一家開局據幾座城。 */
function cityCounts(cities: Array<{ ownerForceId?: string | null }>): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of cities) {
    const o = c.ownerForceId ?? null;
    if (o) m.set(o, (m.get(o) ?? 0) + 1);
  }
  return m;
}

export function auditObjectiveOwnership(prefix = ''): {
  findings: OwnershipFinding[]; goalsChecked: number;
} {
const PREFIX = prefix;
const findings: OwnershipFinding[] = [];
let goalsChecked = 0;

for (const scenario of SCENARIOS) {
  if (PREFIX && !scenario.id.startsWith(PREFIX)) continue;
  const objs = (SCENARIO_OBJECTIVES as Record<string, ScenarioObjective[]>)[scenario.id] ?? [];
  if (!objs.length) continue;

  const owner = new Map<string, string | null>(
    scenario.cities.map((c) => [c.id, c.ownerForceId ?? null]),
  );
  const counts = cityCounts(scenario.cities);
  const forceName = new Map(scenario.forces.map((f) => [f.id, f.name.zh ?? f.id]));
  const cityName = new Map(scenario.cities.map((c) => [c.id, c.name.zh ?? c.id]));
  const label = (fid: string | null) => (fid ? (forceName.get(fid) ?? fid) : '無主');
  const where = `${scenario.name.zh}(${scenario.id})`;

  /*
   * 「這座城有幾家的主目標指著它」 —— 兩家搶同一座城那一型,要先掃一遍才知道。
   * 只算取得型(開局不在自己手上);開局就據有的那一家算「守方」,分開記。
   */
  const wantedBy = new Map<string, string[]>();
  for (const o of objs) {
    const g = o.primary.goal;
    if (g.kind !== 'hold-cities') continue;
    for (const cid of g.cityIds) {
      if (owner.get(cid) === o.forceId) continue;
      wantedBy.set(cid, [...(wantedBy.get(cid) ?? []), o.forceId]);
    }
  }

  for (const o of objs) {
    const goal: ObjectiveGoal = o.primary.goal;
    const title = o.primary.title.zh;
    const who = `${where} / ${label(o.forceId)} 「${title}」`;
    goalsChecked++;

    switch (goal.kind) {
      case 'hold-cities': {
        const marks = goal.cityIds.map((cid) => {
          const ow = owner.get(cid);
          if (ow === undefined) return `${cid}=不在此盤`;
          return `${cityName.get(cid) ?? cid}=${ow === o.forceId ? '己' : label(ow)}`;
        });
        const missing = goal.cityIds.filter((cid) => !owner.has(cid));
        const own = goal.cityIds.filter((cid) => owner.get(cid) === o.forceId);
        if (missing.length) {
          findings.push({ rank: 0, tag: '城不在此盤', line: `${who} — ${marks.join(' ')}` });
          break;
        }
        if (own.length === goal.cityIds.length && goal.byYear === undefined) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — 開局全據且無期限:${marks.join(' ')}`,
          });
          break;
        }
        /*
         * 文案說「仍據」而**不是每一座都是他的** —— 題目寫了別人家的城。
         *
         * ⚠ 第一版只在「一座都不是他的」時才報,於是漏掉了更常見的一半:
         * 英雄集結的公孫瓚寫「至202年仍據薊、北平」而北平不在他手上(薊在),
         * 掃描要跑一小時才看得出來。判準必須是 **`defending` 的判準** ——
         * `evaluateGoal` 要求 `cityIds.every(初始擁有)` 才走守成語意,
         * 缺一座就整條退回「取得」,而文案還寫著「仍據」。
         */
        const saysHold = HOLD_WORDING.test(o.primary.descriptionZh ?? '')
          || HOLD_WORDING.test(o.primary.description ?? '');
        const saysTake = TAKE_WORDING.test(o.primary.descriptionZh ?? '')
          || TAKE_WORDING.test(o.primary.description ?? '');
        if (own.length < goal.cityIds.length && goal.cityIds.length > 0 && saysHold && !saysTake) {
          const notMine = goal.cityIds.filter((cid) => owner.get(cid) !== o.forceId)
            .map((cid) => `${cityName.get(cid) ?? cid}=${label(owner.get(cid) ?? null)}`);
          findings.push({
            rank: 0, tag: '守成寫了別人的城',
            line: `${who} — 文案寫「仍據/仍保」而這幾座開局不是他的:${notMine.join(' ')}`,
          });
          break;
        }
        if (own.length === 0 && goal.cityIds.length > 0) {
          const contested = goal.cityIds
            .filter((cid) => (wantedBy.get(cid)?.length ?? 0) > 1)
            .map((cid) => `${cityName.get(cid) ?? cid}(${(wantedBy.get(cid) ?? [])
              .map((f) => label(f)).join('/')} 都要)`);
          findings.push({
            rank: contested.length ? 2 : 4,
            tag: contested.length ? '全取得+搶城' : '全取得',
            line: `${who} — ${marks.join(' ')}${contested.length ? ` ⚠ ${contested.join(' ')}` : ''}`
              + `(己方開局 ${counts.get(o.forceId) ?? 0} 城)`,
          });
          break;
        }
        const contested = goal.cityIds
          .filter((cid) => owner.get(cid) !== o.forceId && (wantedBy.get(cid)?.length ?? 0) > 1)
          .map((cid) => `${cityName.get(cid) ?? cid}(${(wantedBy.get(cid) ?? [])
            .map((f) => label(f)).join('/')} 都要)`);
        if (contested.length) {
          findings.push({
            rank: 3, tag: '搶城',
            line: `${who} — ${marks.join(' ')} ⚠ ${contested.join(' ')}`,
          });
        }
        break;
      }
      case 'control-province': {
        const cids = Object.entries(PROVINCE_BY_CITY)
          .filter(([, pid]) => pid === goal.provinceId)
          .map(([cid]) => cid)
          .filter((cid) => owner.has(cid));
        const own = cids.filter((cid) => owner.get(cid) === o.forceId);
        /*
         * 董卓那條 `control-province: liang` 是這一型的樣板:涼州從九城長到
         * 十二城之後,等於要求 AI 走到敦煌、張掖、酒泉,五輪峰值一律 9/12。
         * 州的城數會隨地圖長大,而目標寫的時候沒有人回頭看 —— 所以印出來。
         */
        if (own.length === cids.length && goal.byYear === undefined) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — 開局全據 ${goal.provinceId} 州 ${cids.length} 城且無期限`,
          });
        } else if (cids.length - own.length >= 4) {
          findings.push({
            rank: 5, tag: '整州要打',
            line: `${who} — ${goal.provinceId} 州 ${cids.length} 城,開局據 ${own.length},`
              + `要再取 ${cids.length - own.length} 座`,
          });
        }
        break;
      }
      case 'defeat-force':
      case 'break-force': {
        const mine = counts.get(o.forceId) ?? 0;
        const theirs = counts.get(goal.forceId) ?? 0;
        if (theirs === 0) {
          findings.push({
            rank: 0, tag: '對象開局無城',
            line: `${who} — ${label(goal.forceId)} 開局 0 城`,
          });
        } else if (goal.kind === 'defeat-force' && theirs > mine) {
          findings.push({
            rank: 6, tag: '要滅比自己大的',
            line: `${who} — 己 ${mine} 城 vs ${label(goal.forceId)} ${theirs} 城`,
          });
        } else if (goal.kind === 'break-force' && theirs <= goal.maxCities) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — ${label(goal.forceId)} 開局只有 ${theirs} 城(要壓到 ≤${goal.maxCities})`,
          });
        }
        break;
      }
      case 'protect-force': {
        const theirs = counts.get(goal.forceId) ?? 0;
        const need = goal.minCities ?? 1;
        if (theirs === 0) {
          findings.push({
            rank: 0, tag: '對象開局無城',
            line: `${who} — 要保的 ${label(goal.forceId)} 開局 0 城`,
          });
        } else if (need > theirs) {
          findings.push({
            rank: 2, tag: '救援門檻高於開局',
            line: `${who} — ${label(goal.forceId)} 開局 ${theirs} 城,而要求 ≥${need}`,
          });
        }
        break;
      }
      case 'recruit-officer': {
        const off = scenario.officers.find((x) => x.id === goal.officerId);
        if (!off) {
          findings.push({ rank: 0, tag: '人不在此盤', line: `${who} — ${goal.officerId}` });
        } else if (off.forceId === o.forceId) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — ${off.name.zh} 開局就在麾下`,
          });
        } else if (off.forceId) {
          /*
           * 在別家麾下的人要「招得」,靠的是策反或俘虜,而 AI 幾乎不做這件事。
           * 在野的才是三顧茅廬那一型 —— 那一型另外看落點(見 8f1c3a89)。
           */
          findings.push({
            rank: 5, tag: '要招的人在別家麾下',
            line: `${who} — ${off.name.zh} 開局屬 ${label(off.forceId)}`,
          });
        } else {
          const at = off.locationCityId;
          const holder = at ? owner.get(at) ?? null : null;
          findings.push({
            rank: 7, tag: '在野可招',
            line: `${who} — ${off.name.zh} 在 ${at ? (cityName.get(at) ?? at) : '無落點(流落型)'}`
              + `${at ? `(${label(holder)}的城)` : ''}`,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  /*
   * ── 次要目標:只跑硬性那幾類(2026-08-23 補)────────────────────────
   *
   * 上面那一圈只看 `primary`,而全庫 972 條目標裡有 432 條是次要的 ——
   * 它們從來沒被這支掃過。診斷類(全取得/搶城/在野可招)對次要目標沒有意義:
   * 次要目標本來就常常是「去打一座別人的城」。
   * 所以這裡**只查無可辯解的那幾類**:城/人不在此盤、對象開局無城、
   * 第 0 旬就成立、救援門檻高於開局。
   */
  for (const o of objs) {
    for (const sec of o.secondary ?? []) {
      const g: ObjectiveGoal = sec.goal;
      const who = `${where} / ${label(o.forceId)} 次「${sec.title.zh}」`;
      goalsChecked++;
      if (g.kind === 'hold-cities') {
        const missing = g.cityIds.filter((cid) => !owner.has(cid));
        if (missing.length) {
          findings.push({ rank: 0, tag: '城不在此盤', line: `${who} — ${missing.join('、')}` });
          continue;
        }
        const own = g.cityIds.filter((cid) => owner.get(cid) === o.forceId);
        if (own.length === g.cityIds.length && g.byYear === undefined) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — 開局全據且無期限:${g.cityIds.map((c) => cityName.get(c) ?? c).join('、')}`,
          });
        }
      } else if (g.kind === 'defeat-force' || g.kind === 'break-force') {
        const theirs = counts.get(g.forceId) ?? 0;
        if (theirs === 0) {
          findings.push({ rank: 0, tag: '對象開局無城', line: `${who} — ${label(g.forceId)} 開局 0 城` });
        } else if (g.kind === 'break-force' && theirs <= g.maxCities) {
          findings.push({
            rank: 1, tag: '第0旬就成立',
            line: `${who} — ${label(g.forceId)} 開局只有 ${theirs} 城(要壓到 ≤${g.maxCities})`,
          });
        }
      } else if (g.kind === 'protect-force') {
        const theirs = counts.get(g.forceId) ?? 0;
        const need = g.minCities ?? 1;
        if (theirs === 0) {
          findings.push({ rank: 0, tag: '對象開局無城', line: `${who} — 要保的 ${label(g.forceId)} 開局 0 城` });
        } else if (need > theirs) {
          findings.push({
            rank: 2, tag: '救援門檻高於開局',
            line: `${who} — ${label(g.forceId)} 開局 ${theirs} 城,而要求 ≥${need}`,
          });
        }
      } else if (g.kind === 'recruit-officer') {
        const off = scenario.officers.find((x) => x.id === g.officerId);
        if (!off) {
          findings.push({ rank: 0, tag: '人不在此盤', line: `${who} — ${g.officerId}` });
        } else if (off.forceId === o.forceId) {
          findings.push({ rank: 1, tag: '第0旬就成立', line: `${who} — ${off.name.zh} 開局就在麾下` });
        }
      }
    }
  }
}

findings.sort((a, b) => a.rank - b.rank || a.line.localeCompare(b.line));
return { findings, goalsChecked };
}

/** 直接執行時才印;被測試 import 時保持安靜。 */
if (process.argv[1]?.includes('objective-ownership-audit')) {
  const { findings, goalsChecked } = auditObjectiveOwnership(process.argv[2] ?? '');
  console.log('=== 主目標 × 開局盤面對照 ===\n');
  let lastTag = '';
  for (const f of findings) {
    if (f.tag !== lastTag) {
      console.log(`\n--- ${f.tag}${HARD_TAGS.includes(f.tag) ? '(硬性歸零)' : ''} ---`);
      lastTag = f.tag;
    }
    console.log(`  ${f.line}`);
  }
  console.log(`\n檢查了 ${goalsChecked} 條主目標,提示 ${findings.length} 條。`);
  console.log('提示不等於錯 —— 「全取得」「在野可招」多半是正常的題目,');
  console.log('要判死仍然要跑 objective-sweep.ts。');
}
