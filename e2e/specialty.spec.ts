import { test, expect } from '@playwright/test';

/**
 * 名產名物 overhaul — confirm the new UI mounts in a real browser without a
 * React runtime crash: start a campaign, open the 度支簿, and assert the new
 * 名產版圖 (Specialty Dominion) panel renders inside it. A pageerror listener
 * fails the test on any uncaught exception along the way.
 */
test('treasury shows the Specialty Dominion panel', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  // Title wizard → scenario → force → start (mirrors the smoke journey).
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await next1.click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  // In the realm — the top bar mounts.
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible({ timeout: 30_000 });

  // Open the 記錄 (Records) menu → 度支 (Treasury), then assert the new 名產版圖
  // (Specialty Dominion) panel is present inside the ledger.
  await page.getByRole('button', { name: '記錄', exact: false }).first().click();
  await page.getByText('度支', { exact: false }).first().click();
  await expect(page.getByText('名產版圖', { exact: false })).toBeVisible({ timeout: 10_000 });

  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
});
