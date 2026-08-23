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
    /*
     * 只歸零**主目標**。2026-08-23 把掃描擴到次要目標,一跑多出 44 條,
     * 而逐條看過之後只有 4 條是真的:標題寫著「救」而 goal 卻是
     * 「去取那一家的城」。另外五條不是錯 —— 三條是「背叛就是題目本身」,
     * 兩條(烏桓)指的城到期限前多半已經易主,而這支只看開局歸屬。
     * non-aggression 那 35 條則因為互不侵犯 20 季就期滿而根本不算。
     * 判準同護欄那一課:先數它會叫幾次、其中幾次是真的,再決定要不要歸零。
     */
    const found = auditObjectiveDiplomacy().filter((c) => !c.secondary);
    expect(
      found.map(describeConflict),
      '這些目標從第 0 旬就是死的。修法:把該對關係改成 neutral,或改寫目標。'
      + '\n明細:node --import tsx scripts/objective-diplomacy-audit.ts',
    ).toEqual([]);
  });
});
