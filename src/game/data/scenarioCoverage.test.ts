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
 * **棘輪已經收完,現在是硬性歸零。**
 *
 *  2026-08-01  271 → 263 → 247 → 237 → 227(赤壁,56 個盤還有洞)
 *  2026-08-07  補完 147 家缺目標、80 家缺序章 → 0
 *  2026-08-08  預算拆掉:540 家全覆蓋,新加的盤沒寫齊會立刻紅
 *
 * 收掉預算是有代價的 —— 加一張新盤就得同時寫齊每一家的序章與目標,
 * 而那正是這條測試的用途:一個新戰役要跟已有的 86 個一樣完整,才進得來。
 */
describe('戰役覆蓋率(序章 / 目標)', () => {
  it('每一家都有自己的序章與目標', () => {
    const holes = findHoles();
    expect(
      holes.map((h) => `${h.scenario} / ${h.force} 缺${h.kind === 'prologue' ? '序章' : '目標'}`),
      '選了這幾家開局會掉進空洞:沒有開場白,或目標卡是空的。',
    ).toEqual([]);
  });

  /** 已經補齊的盤不可以再退回去 —— 逐盤鎖定,補一個加一個。 */
  const COMPLETE = ['scn-184-yellow-turban', 'scn-190-anti-dong-zhuo', 'scn-195-jiangdong', 'scn-200-guandu', 'scn-208-chibi'];
  it.each(COMPLETE)('%s covers every force with both a prologue and an objective', (id) => {
    const holes = findHoles().filter((h) => h.scenario === id);
    expect(holes, `${id} 有空洞:${holes.map((h) => `${h.force}/${h.kind}`).join(', ')}`).toEqual([]);
  });
});
