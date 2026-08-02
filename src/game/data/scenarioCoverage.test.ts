import { describe, it, expect } from 'vitest';
import { SCENARIOS } from './scenarios';
import { SCENARIO_PROLOGUES } from './scenarioPrologues';
import { SCENARIO_OBJECTIVES } from './objectives';

/**
 * 戰役覆蓋率 — 每個盤的**每個可選勢力**都該有自己的序章與目標。
 *
 * 骨架早就齊了(86 個盤全有序章、封面、目標),缺的是深度:選了非主角的勢力
 * 就掉進空洞。黃巾之亂五家只寫了兩家,反董卓聯軍十一家只寫了五家 —— 玩家選
 * 皇甫嵩開局,沒有開場白,也沒有目標。
 *
 * ## 為什麼是棘輪而不是硬性全綠
 *
 * 一次補完一百多段序章不是一個 commit 該做的事,而「先讓測試全紅、慢慢修」
 * 等於整套測試長期是紅的,那條線很快就沒人看。所以這裡鎖的是**空洞數不得
 * 增加**:補一個就把預算調低一個,新加的盤如果沒寫齊會立刻頂破預算。
 *
 * 補完之後把預算降到 0,再把這條改成硬性斷言。
 */

interface Hole { scenario: string; force: string; kind: 'prologue' | 'objective' }

function findHoles(): Hole[] {
  const holes: Hole[] = [];
  const prologues = SCENARIO_PROLOGUES as Record<string, { forces?: Record<string, unknown> }>;
  const objectives = SCENARIO_OBJECTIVES as Record<string, Array<{ forceId: string }>>;
  for (const s of SCENARIOS) {
    const pf = prologues[s.id]?.forces ?? {};
    const of = new Set((objectives[s.id] ?? []).map((o) => o.forceId));
    for (const f of s.forces) {
      if (!pf[f.id]) holes.push({ scenario: s.id, force: f.id, kind: 'prologue' });
      if (!of.has(f.id)) holes.push({ scenario: s.id, force: f.id, kind: 'objective' });
    }
  }
  return holes;
}

/**
 * 目前的空洞數。**只准往下改。**
 *
 *  2026-08-01  黃巾之亂 271 → 反董卓聯軍 263 → 孫策定江東 247(58 個盤還有洞)
 *
 * 最大的幾個:孫策定江東 16、徐州牧 10、官渡之戰 10、白狼山 10、赤壁之戰 10。
 * 形狀很一致 —— 缺的都是**周邊勢力**(劉表、劉焉/劉璋、馬騰、公孫、孔融、
 * 士燮、烏桓),也就是「地圖上存在、但沒人替它寫過一句話」的那些家。
 */
const HOLE_BUDGET = 247;

describe('戰役覆蓋率(序章 / 目標)', () => {
  it('never grows the number of uncovered forces', () => {
    const holes = findHoles();
    const byScenario = new Map<string, number>();
    for (const h of holes) byScenario.set(h.scenario, (byScenario.get(h.scenario) ?? 0) + 1);
    const worst = [...byScenario.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    expect(
      holes.length,
      `空洞 ${holes.length} 個(預算 ${HOLE_BUDGET})。補了就把 HOLE_BUDGET 調低;`
      + `新增的話這裡會告訴你是誰:\n`
      + worst.map(([id, n]) => `  ${id}: ${n}`).join('\n'),
    ).toBeLessThanOrEqual(HOLE_BUDGET);
  });

  /** 已經補齊的盤不可以再退回去 —— 逐盤鎖定,補一個加一個。 */
  const COMPLETE = ['scn-184-yellow-turban', 'scn-190-anti-dong-zhuo', 'scn-195-jiangdong'];
  it.each(COMPLETE)('%s covers every force with both a prologue and an objective', (id) => {
    const holes = findHoles().filter((h) => h.scenario === id);
    expect(holes, `${id} 有空洞:${holes.map((h) => `${h.force}/${h.kind}`).join(', ')}`).toEqual([]);
  });
});
