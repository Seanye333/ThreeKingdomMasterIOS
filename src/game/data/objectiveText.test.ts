import { describe, it, expect } from 'vitest';
import { auditObjectiveText } from '../../../scripts/objective-text-audit';

/**
 * 目標的**句子**與目標的**資料**不能對不上。
 *
 * 玩家讀的是 `descriptionZh`,判定跑的是 `goal`。這兩邊分開改就會分岔,
 * 而分岔了**掃描抓不到、模擬也抓不到** —— `objective-sweep` 只看 goal,
 * 目標照樣報成功,壞的是玩家看到的那句話。
 *
 * 2026-08-23 第一次跑就抓到 **47 條**,全是前幾批自己造的:
 * 把期限往回壓、把城的清單縮短的時候,只改了 `goal`。
 *
 *   隋末·夏  「至191年仍據鄴、渤海、平原」 → cityIds 只有鄴、渤海;byYear 181
 *   五丈原·魏「至240年仍據長安、安定、隴西」 → cityIds 只有長安
 *   七雄·韓  「存續至202年」                → year 205
 *
 * 判準:**改 goal 一定連兩段文案一起改**;句子裡明寫的年份與城數是硬指標。
 * 不查「句子提到而 goal 沒有的城」—— 文案本來就會提旁邊的城當背景。
 */
describe('主目標文案與 goal', () => {
  it('句子裡的年份與城數,跟 goal 對得上', () => {
    const { findings } = auditObjectiveText();
    expect(
      findings.map((f) => `[${f.tag}] ${f.line}`),
      '玩家讀到的期限/城數與實際判定不一致。'
      + '\n明細:node --import tsx scripts/objective-text-audit.ts',
    ).toEqual([]);
  });
});
