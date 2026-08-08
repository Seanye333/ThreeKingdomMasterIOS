/**
 * 目標期限比那個人的壽命還長 —— **又一種不必模擬就查得出來的死目標。**
 *
 * 199 易京盤的袁術主目標是「淮南之主」,守壽春到 205 年;而袁術 199 年
 * 嘔血死於江亭。198 下邳盤的公孫瓚要守到 204;他 199 年自焚於易京樓。
 * 這種目標在盤上不是難,是**要求一個死人繼續守城** —— 君主一死,勢力在
 * AI 手裡通常撐不了幾年,而掃描只會告訴你「這條 0/3」。
 *
 * 判準:主目標的 `byYear` 晚於該勢力**君主的卒年**。史書上的卒年寫在
 * `officers.ts` 的 `deathYear`,盤上照樣會用它來安排自然死亡。
 *
 * 兩種修法,選哪一種要看那張盤問的是什麼:
 *  - 那張盤本來就是要玩家**改寫**他的下場 → 進 `objective-sweep.ts` 的
 *    BY_DESIGN 並寫理由(呂布白門樓、公孫瓚易京樓都在裡面)。
 *  - 只是期限順手寫長了 → 壓回卒年之前那一兩年。
 *
 * Run: node --import tsx scripts/objective-lifespan-audit.ts
 */

import { SCENARIOS } from '../src/game/data/scenarios';
import { SCENARIO_OBJECTIVES } from '../src/game/data/objectives';

export interface LifespanConflict {
  scenarioId: string;
  scenarioZh: string;
  forceId: string;
  rulerZh: string;
  title: string;
  byYear: number;
  deathYear: number;
  cities: number;
}

export function auditObjectiveLifespans(): LifespanConflict[] {
  const out: LifespanConflict[] = [];
  for (const scenario of SCENARIOS) {
    const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
      forceId: string;
      primary: { title: { zh: string }; goal: { kind: string; byYear?: number; year?: number } };
    }>>)[scenario.id] ?? [];
    if (!objs.length) continue;
    const officer = new Map(scenario.officers.map((o) => [o.id, o]));
    const cityCount: Record<string, number> = {};
    for (const c of scenario.cities) if (c.ownerForceId) cityCount[c.ownerForceId] = (cityCount[c.ownerForceId] ?? 0) + 1;
    for (const o of objs) {
      const force = scenario.forces.find((f) => f.id === o.forceId);
      const ruler = force?.rulerOfficerId ? officer.get(force.rulerOfficerId) : undefined;
      const death = (ruler as { deathYear?: number } | undefined)?.deathYear;
      const g = o.primary.goal;
      const by = g.byYear ?? g.year;
      if (!ruler || !death || !by) continue;
      /*
       * 君主的卒年**早於開局年**時跳過 —— 那張盤已經改寫了他的下場。
       * 「曹操贏赤壁」是 208 年的架空盤,而孫氏由孫翊當家(史書上他 204 年
       * 死於左右所害):盤既然讓他活著,就不該再拿史書的卒年去卡他的目標。
       *
       * **開局那一年就死的也跳過** —— 那張盤講的往往正是那場死:189 盤的
       * 何進在開場第一句就被斬於嘉德殿前,而他的主目標是「盡誅閹豎」。
       * 把期限壓到 189 等於給他一個零長度的窗口,那不是修正,是換一種壞法。
       */
      if (death <= (scenario.startDate?.year ?? 0)) continue;
      /*
       * 只報**小勢力**。大國有真正的繼統(曹操卒於 220 而魏繼續、劉備卒於
       * 223 而蜀繼續),期限跨過君主的卒年沒有問題;小勢力沒有 ——
       * 呂布死而徐州散、公孫瓚死而幽州入袁、張魯降而漢中入曹。
       * 不收這一刀,這條規則會報出 118 條而其中一百條是無害的。
       */
      const SMALL = 8;
      if (by > death && (cityCount[o.forceId] ?? 0) <= SMALL) {
        out.push({
          scenarioId: scenario.id, scenarioZh: scenario.name.zh, forceId: o.forceId,
          rulerZh: ruler.name.zh, title: o.primary.title.zh, byYear: by, deathYear: death, cities: cityCount[o.forceId] ?? 0,
        });
      }
    }
  }
  return out;
}

export const describeLifespan = (c: LifespanConflict) =>
  `${c.scenarioZh}(${c.scenarioId}) / ${c.forceId} 「${c.title}」 要到 ${c.byYear} 年,`
  + `而${c.rulerZh}卒於 ${c.deathYear}(差 ${c.byYear - c.deathYear} 年)`;

if (process.argv[1]?.includes('objective-lifespan-audit')) {
  const found = auditObjectiveLifespans().sort((a, b) => (b.byYear - b.deathYear) - (a.byYear - a.deathYear));
  if (process.env.JSON) console.log(JSON.stringify(found));
  else for (const c of found) console.log(`  ${describeLifespan(c)}`);
  console.log(`\n${found.length} 條主目標的期限晚於自家君主的卒年。`);
}
