import { test, expect } from '@playwright/test';

/**
 * 冒煙 — the one journey that must always work: title → pick scenario →
 * pick force → start → the 3D realm renders → a season tick resolves.
 * DOM-level assertions only (no pixel checks), so it stays robust across
 * art changes and headless GL quirks.
 */
test('start a campaign and resolve a season tick', async ({ page }) => {
  page.on('pageerror', (err) => { throw new Error(`page crashed: ${err.message}`); });
  await page.goto('/');

  // Title wizard — step 1: scenario list with a Next button.
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await next1.click();

  // Step 2: pick the first force in the list.
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();

  // Step 3: launch.
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  // The realm: top bar appears (officers menu) and the WebGL canvas mounts.
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

  // Resolve one half-month tick — the end-turn button reads 「下旬 N月…」 or
  // 「上旬 …」 depending on phase; match the arrow suffix it always carries.
  const endBtn = page.locator('button', { hasText: /[上下]旬|End/ }).last();
  await endBtn.click();

  // A season report or simply the next phase label — assert the app is still
  // alive and interactive (no crash, canvas still mounted).
  await page.waitForTimeout(2_500);
  await expect(page.locator('canvas').first()).toBeVisible();
});
