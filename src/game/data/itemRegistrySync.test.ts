import { describe, expect, it } from 'vitest';
import {
  setRefineRegistry, itemRefineLevel,
  setLoreRegistry, itemLoreLevel,
} from './items';

/*
 * 名器登記是 store 的**模組級鏡像** —— combat / duel / 傷害預估 這些純函數
 * 靠它讀出裝備的 live 效果,不必把整張表穿進每一層簽名。代價是:
 * **任何繞過 `set*Registry` 的 setState,鏡像就會停在上一次的值。**
 *
 * 這條坑是 2026-08-07 追「同種子重播從第 1 旬分歧」時挖出來的:
 * 重播測試用 `st.setState({ ...snapshot })` 還原世界,而第一次重播裡 AI 鍛出來
 * 的精煉留在模組變數裡,第二次重播從頭就用著上一輪的裝備數值。症狀是野戰的
 * `blendedStat` 對不上(134.1 vs 135),而最終 officers 一致 —— 變的不是裝備 id,
 * 是它的 live 效果。查了半天不是隨機源:patch 掉 `Math.random` 計數,
 * endSeason 期間裸呼叫是 0。
 *
 * 修法是 `endSeason` 開頭每旬對齊一次。這條測試釘的是**鏡像本身會殘留**這件事 ——
 * 它是那個修法存在的理由,砍掉修法之前先看這裡。
 */
describe('名器登記是模組級鏡像 — 會跨 setState 殘留', () => {
  it('沒有人推,它就停在上一次的值', () => {
    setRefineRegistry({ 'qinglong-yanyue-dao': 3 });
    expect(itemRefineLevel('qinglong-yanyue-dao')).toBe(3);

    // 模擬「繞過 set*Registry 的還原」:狀態換了,而鏡像沒人通知。
    expect(itemRefineLevel('qinglong-yanyue-dao'), '這正是那個洞').toBe(3);

    setRefineRegistry({});           // ← endSeason 每旬做的那一步
    expect(itemRefineLevel('qinglong-yanyue-dao')).toBe(0);
  });

  it('同一族的其他登記也一樣(典故只是抽一個作代表)', () => {
    setLoreRegistry({ 'qinglong-yanyue-dao': 2 });
    expect(itemLoreLevel('qinglong-yanyue-dao')).toBe(2);
    setLoreRegistry({});
    expect(itemLoreLevel('qinglong-yanyue-dao')).toBe(0);
  });
});
