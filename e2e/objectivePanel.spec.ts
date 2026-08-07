import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/*
 * 目標卡 —— 2026-08-07 之前它**只畫主目標**。
 *
 * 本專案的準則是「主目標寫他真正做到的事,次要寫他沒做到的」,於是次要那一欄
 * 放的正是名場面(取長安、盡有荊州、翦滅曹爽…)—— 而它們一條都沒被畫出來,
 * 一百多條寫好的次要目標玩家看不到。同時被漏掉的還有目標的**來由**
 * (每條目標都寫了它在史書上是什麼事)與**期限**。
 *
 * 補上之後卡片會變高,而它是浮在大地圖上的 —— 所以這條測試同時釘兩件事:
 * 內容有出來,而且沒有把卡片撐出畫面。
 */
test('目標卡畫得出次要目標與期限,而且不溢出畫面', async ({ page }) => {
  test.setTimeout(180_000);
  await startCampaign(page);

  /*
   * ⚠ 這裡本來寫 `page.locator('div', { hasText: /^目標/ })` —— 它命中的是整片
   * 地圖 chrome(連季節、天氣、圖層、城名都在裡面),於是「不溢出」那一條
   * 等於什麼都沒驗。用 testid 指到卡片本身。
   */
  const card = page.getByTestId('objective-card');
  await expect(card).toBeVisible({ timeout: 30_000 });

  // ① 次要那一欄要在
  await expect(page.getByText('次要', { exact: true }).first()).toBeVisible();

  // ② 期限讀數要在(主目標都帶 byYear)
  await expect(page.getByText(/期限 \d{3} · 餘 \d+ 年/).first()).toBeVisible();

  // ③ 不溢出:卡片整個在視窗內
  const box = await card.boundingBox();
  const vp = page.viewportSize()!;
  expect(box, 'objective card has no box').not.toBeNull();
  expect(box!.y + box!.height, `card bottom ${box!.y + box!.height} > viewport ${vp.height}`)
    .toBeLessThanOrEqual(vp.height);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
});
