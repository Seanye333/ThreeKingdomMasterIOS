/**
 * 目標與開局外交自相矛盾 —— **不必模擬就查得出來的一種死目標。**
 *
 * 189 盤的描述自己寫著「董卓抵洛陽,少帝已落其手」,而 `openingRelations` 把
 * 董卓對漢廷寫成 `non-aggression`。`isHostilePermitted` 只在 `neutral` 時放行,
 * 於是他**永遠**打不進洛陽 —— 那張盤他的主目標就叫「提兵入洛」。
 *
 * 寫盤的人用 `non-aggression` 表達的是「此刻還沒開打」,而引擎讀成「永不交兵」。
 * 兩者差在:`neutral` 是「還沒開打,但可以打」。**premise 要的是後者。**
 *
 * 判準:某家的主目標要拿下 X 城(或滅掉 X 家),而對方與他開局是
 * `non-aggression` 或 `allied` → 這條目標從第 0 旬就是死的。
 * `aiBetrayal` 給了一條撕約的路,但那是 8% 的機率門檻,不能當成 premise 的載體。
 *
 * 第一次跑撈到 33 條,散在 26 張盤 —— 官渡兩家、湘水劃界、白衣渡江、
 * 竊符救趙、劉備入蜀,全庫最有名的幾手都在裡面。
 *
 * Run: node --import tsx scripts/objective-diplomacy-audit.ts
 */

import { SCENARIOS } from '../src/game/data/scenarios';
import { SCENARIO_OBJECTIVES } from '../src/game/data/objectives';

/**
 * 次要目標的判準跟主目標**不一樣**,而這是數出來的,不是想出來的。
 *
 * 2026-08-23 把這支從只看 `primary` 擴到次要目標,一跑多出 44 條。逐條看過:
 *   `allied` 9 條裡只有 **4 條**是真的 —— 那四條標題就寫著「救」而 goal 卻是
 *   「去取那一家的城」(救蜀 / 救齊之師 / 救趙救齊 / 毋赴虎牢),
 *   正是 `protect-force` 當初被造出來要裝的那個形狀。
 *   另外五條不是錯:首霸中原 / 袁紹討伐 / 南向許都 **背叛就是題目本身**
 *   (反董卓聯軍散夥、袁曹決裂,史書上就是這麼走的,而玩家撕得了約);
 *   烏桓那兩條指的是袁紹的鄴與北平,而**那兩座城到期限之前多半已經易主**
 *   —— 這支只看**開局**歸屬,長窗口的取得型目標它判不了。
 *   `non-aggression` 35 條一律不算:開局的互不侵犯 20 季就期滿。
 *
 * 所以硬性歸零只管主目標;次要目標印出來當診斷。
 * 判準跟護欄那一課同型:**先數它會叫幾次、其中幾次是真的,再決定要不要歸零。**
 */
export interface DiploConflict {
  scenarioId: string;
  scenarioZh: string;
  forceId: string;
  title: string;
  victimId: string;
  status: string;
  /** 次要目標的那一條 —— 測試只歸零主目標,見上面的檔頭。 */
  secondary?: boolean;
}

type Rel = { a: string; b: string; score: number; status: string };

export function auditObjectiveDiplomacy(): DiploConflict[] {
  const out: DiploConflict[] = [];

  for (const scenario of SCENARIOS) {
    const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
      forceId: string;
      primary: { title: { zh: string }; goal: { kind: string; cityIds?: string[]; forceId?: string } };
      secondary?: Array<{ title: { zh: string }; goal: { kind: string; cityIds?: string[]; forceId?: string } }>;
    }>>)[scenario.id] ?? [];
    if (!objs.length) continue;

    const rels = (scenario as unknown as { openingRelations?: Rel[] }).openingRelations ?? [];
    const statusOf = (a: string, b: string): string | null => {
      const r = rels.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      return r ? r.status : null;
    };
    const own: Record<string, string | null> = {};
    for (const c of scenario.cities) own[c.id] = c.ownerForceId ?? null;

    for (const o of objs) {
      /*
       * 主目標與**次要目標**一起查(2026-08-23 才擴到次要)。
       * 「要玩家去打一個開局同盟/互不侵犯的對象」這件事,是次目標也一樣矛盾 ——
       * `isHostilePermitted` 只放行 `neutral`,所以那條從第 0 旬就走不動。
       */
      const slots = [
        { tag: '', g: o.primary.goal, title: o.primary.title.zh },
        ...(o.secondary ?? []).map((x) => ({ tag: '次', g: x.goal, title: x.title.zh })),
      ];
      for (const slot of slots) {
        const g = slot.g;
        /** 這條目標要他去打誰。取得型是缺的那幾座城之主,滅型是那一家。 */
        const victims = new Set<string>();
        if (g.kind === 'hold-cities' && g.cityIds) {
          for (const cid of g.cityIds) {
            const owner = own[cid];
            if (owner && owner !== o.forceId) victims.add(owner);
          }
        } else if ((g.kind === 'defeat-force' || g.kind === 'break-force') && g.forceId) {
          victims.add(g.forceId);
        }
        for (const victimId of victims) {
          const status = statusOf(o.forceId, victimId);
          if (status === 'non-aggression' || status === 'allied') {
            out.push({
              scenarioId: scenario.id, scenarioZh: scenario.name.zh,
              forceId: o.forceId, title: `${slot.tag}${slot.title}`, victimId, status,
              secondary: slot.tag !== '',
            });
          }
        }
      }
    }
  }
  return out;
}

export const describeConflict = (c: DiploConflict) =>
  `${c.scenarioZh}(${c.scenarioId}) / ${c.forceId} 「${c.title}」 要打 ${c.victimId},而開局是 ${c.status}`;

/** 直接執行時才印;被測試 import 時保持安靜。 */
if (process.argv[1]?.includes('objective-diplomacy-audit')) {
  const found = auditObjectiveDiplomacy();
  let last = '';
  for (const c of found) {
    if (c.scenarioId !== last) { console.log(`✗ ${c.scenarioZh}(${c.scenarioId})`); last = c.scenarioId; }
    console.log(`    ${c.forceId} 「${c.title}」 要打 ${c.victimId},而開局是 ${c.status}`);
  }
  const boards = new Set(found.map((c) => c.scenarioId)).size;
  console.log(`\n${found.length} 條主目標與自家開局外交相矛盾,散在 ${boards} 張盤。`);
  if (found.length) console.log('修法:把該對關係改成 neutral(「還沒開打,但可以打」),或改寫目標。');
}
