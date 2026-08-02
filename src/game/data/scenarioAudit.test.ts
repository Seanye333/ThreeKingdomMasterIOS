import { describe, it, expect } from 'vitest';
import { auditAll, RULES } from '../../../scripts/scenario-audit';

/**
 * 86 個盤的盤面一致性 —— 硬性歸零,不是棘輪。
 *
 * 這條測試存在的理由,是深挖第一個戰役(黃巾之亂)時發現的每一個毛病幾乎都
 * 不是那一盤特有的,而是**一類**問題,而一類問題靠人一盤一盤看是看不完的:
 *
 *  - 朱儁的主目標是「攻取並據守宛城」,盤上卻開局就把宛城給了他;
 *  - 名叫「三顧茅廬」的那張盤,把諸葛亮編進了劉表軍 —— 而 `evt-maolu-1` 要求
 *    他在野,於是那條鏈在自己的主場盤上永遠不會觸發;
 *  - 赤壁盤的劉琮勢力,rulerOfficerId 指向已經死了的劉表。
 *
 * 規則與例外都在 `scripts/scenario-audit.ts`。**加新盤時這裡會先紅**,那正是
 * 它的用途 —— 一個新戰役要跟已有的 86 個一樣完整,才進得來。
 *
 * 例外必須具名並寫理由(見該檔 EXCEPTIONS)。沒有理由的例外等於把規則關掉。
 */
describe('戰役盤面一致性', () => {
  it('has no errors on any board', async () => {
    const errors = (await auditAll()).filter((f) => f.severity === 'error');
    expect(
      errors,
      `盤面 error ${errors.length} 條:\n`
      + errors.map((f) => `  [${f.rule}] ${f.scenarioZh}: ${f.message}`).join('\n')
      + `\n\n規則說明見 scripts/scenario-audit.ts;單盤明細:`
      + `node --import tsx scripts/scenario-audit.ts <scenarioId>`,
    ).toEqual([]);
  });

  it('has no warnings on any board', async () => {
    const warns = (await auditAll()).filter((f) => f.severity === 'warn');
    expect(
      warns,
      `盤面 warn ${warns.length} 條(設計如此的請進 EXCEPTIONS 並寫理由):\n`
      + warns.map((f) => `  [${f.rule}] ${f.scenarioZh}: ${f.message}`).join('\n'),
    ).toEqual([]);
  });

  /** 規則表本身要跟實作同步 —— 少一條說明,報告就會印出空白的理由。 */
  it('every rule the audit can emit has a description', async () => {
    const emitted = new Set((await auditAll()).map((f) => f.rule));
    for (const r of emitted) expect(RULES[r], `規則 ${r} 沒有說明`).toBeTruthy();
    expect(Object.keys(RULES).length).toBeGreaterThan(8);
  });
});
