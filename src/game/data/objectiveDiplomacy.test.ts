import { describe, it, expect } from 'vitest';
import { auditObjectiveDiplomacy, describeConflict } from '../../../scripts/objective-diplomacy-audit';

/**
 * 主目標不能與自家開局外交打架 —— **硬性歸零。**
 *
 * `isHostilePermitted` 只在關係為 `neutral` 時放行。所以一條「取下某城」的主目標,
 * 若那座城的開局之主與他是 `non-aggression` 或 `allied`,這條目標從第 0 旬就是死的:
 * 不必模擬也知道,而模擬要跑一個鐘頭才看得出來。
 *
 * 第一次跑撈到 33 條。最刺眼的是 189 盤 —— 那張盤的描述自己寫著
 * 「董卓抵洛陽,少帝已落其手」,而董卓對漢廷寫的是 non-aggression。
 * 同型的還有官渡兩家(195/197 盤 cao-yuan-shao 是 allied)、湘水劃界、
 * 白衣渡江、劉備入蜀 —— 全庫最有名的幾手,機制上一手也出不來。
 *
 * ⚠ 寫盤的人用 `non-aggression` 表達「此刻還沒開打」,而引擎讀成「永不交兵」。
 * 要的幾乎總是 `neutral`:**還沒開打,但可以打。**
 */
describe('主目標與開局外交', () => {
  it('沒有任何一條主目標要求去打一個結了約的鄰居', () => {
    const found = auditObjectiveDiplomacy();
    expect(
      found.map(describeConflict),
      '這些目標從第 0 旬就是死的。修法:把該對關係改成 neutral,或改寫目標。'
      + '\n明細:node --import tsx scripts/objective-diplomacy-audit.ts',
    ).toEqual([]);
  });
});
