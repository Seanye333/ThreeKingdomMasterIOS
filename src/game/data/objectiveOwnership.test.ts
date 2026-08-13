import { describe, it, expect } from 'vitest';
import { auditObjectiveOwnership, HARD_TAGS } from '../../../scripts/objective-ownership-audit';

/**
 * 主目標不能跟自己那張盤的**開局盤面**對不上 —— 這幾類**硬性歸零**。
 *
 * 全庫 540 條主目標裡有一整類死法,靜態就看得出來:把目標寫的每一座城逐一
 * 標上開局歸誰。2026-08-09 手動對照抓到九條(伊闕四家一起指著已經入秦的洛陽、
 * 鄢郢的秦要「取襄陽、江陵」而兩座開局都是秦的),而那次是用手抓的 ——
 * 這支測試把其中**無可辯解**的那幾類釘住:
 *
 *   城不在此盤        目標指著一座這張盤沒有的城,永遠判不成。
 *   第0旬就成立      開局全據且不設期限 / 要招的人開局就在麾下 /
 *                    要壓到 ≤N 城而對方開局就只有 N 城。目標成了擺設。
 *   對象開局無城      要滅(或要救)的那一家開局就沒有城。
 *   救援門檻高於開局  `protect-force` 的 `minCities` 大於那一家開局的城數 ——
 *                    等於要求玩家先幫他打下幾座才能談「保住」。
 *   人不在此盤        `recruit-officer` 指著一個不在這張盤武將表裡的人。
 *
 * **剩下的類別是診斷,不歸零**:「全取得」「搶城」「在野可招」多半正是題目
 * 本來的樣子(赤壁的劉備本來就要去借江陵)。那幾類的死活要跑
 * `objective-sweep.ts`,一個鐘頭,不能寫進單元測試。
 */
describe('主目標與開局盤面', () => {
  it('沒有任何一條主目標指著不存在的城/人,或開局第 0 旬就成立', () => {
    const { findings } = auditObjectiveOwnership();
    const hard = findings.filter((f) => HARD_TAGS.includes(f.tag));
    expect(
      hard.map((f) => `[${f.tag}] ${f.line}`),
      '這些目標不必模擬也知道是壞的。'
      + '\n明細:node --import tsx scripts/objective-ownership-audit.ts',
    ).toEqual([]);
  });
});
