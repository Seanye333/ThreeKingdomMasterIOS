import { describe, it, expect } from 'vitest';
import { auditObjectiveLifespans, describeLifespan } from '../../../scripts/objective-lifespan-audit';

/**
 * 小勢力的主目標不能要求一個死人繼續守城 —— **硬性歸零。**
 *
 * 199 易京盤的袁術主目標是守壽春到 205 年,而袁術 199 年嘔血死於江亭;
 * 198 下邳盤的公孫瓚要守到 204,而他 199 年自焚於易京樓。這種目標在盤上
 * 不是難,是**期限比那個人的命還長** —— 而掃描只會告訴你「這條 0/3」,
 * 看不出來是為什麼。第一次跑撈到 49 條,張魯佔四條、韓遂三條、公孫瓚三條。
 *
 * ⚠ 只查**小勢力**(開局 ≤8 城)。大國有真正的繼統 —— 曹操卒於 220 而魏
 * 繼續、劉備卒於 223 而蜀繼續,期限跨過君主的卒年沒有問題。不收這一刀,
 * 這條規則會報出 118 條而其中一百條是無害的。
 *
 * 另一個具名豁免:君主的卒年**早於開局年**時跳過 —— 那張盤已經改寫了他的
 * 下場(「曹操贏赤壁」由孫翊當家,而史書上他 204 年就死了)。
 */
describe('主目標的期限與君主的壽命', () => {
  it('沒有任何小勢力的主目標活過自家君主', () => {
    const found = auditObjectiveLifespans();
    expect(
      found.map(describeLifespan),
      '把期限壓回卒年那一年 —— 那正是「他活著的時候守住了」。'
      + '\n明細:node --import tsx scripts/objective-lifespan-audit.ts',
    ).toEqual([]);
  });
});
