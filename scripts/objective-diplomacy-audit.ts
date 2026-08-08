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

export interface DiploConflict {
  scenarioId: string;
  scenarioZh: string;
  forceId: string;
  title: string;
  victimId: string;
  status: string;
}

type Rel = { a: string; b: string; score: number; status: string };

export function auditObjectiveDiplomacy(): DiploConflict[] {
  const out: DiploConflict[] = [];

  for (const scenario of SCENARIOS) {
    const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
      forceId: string;
      primary: { title: { zh: string }; goal: { kind: string; cityIds?: string[]; forceId?: string } };
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
      const g = o.primary.goal;
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
            forceId: o.forceId, title: o.primary.title.zh, victimId, status,
          });
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
