import { test, expect } from '@playwright/test';

/**
 * 國政 — the panel that consolidates §1.11–§1.15 + §3.6. A lazy modal full of
 * store-driven selects is exactly the sort of thing that renders fine in a unit
 * test and explodes in a browser, so this walks it for real: open it, flip a
 * lever, and assert the realm ledger drew.
 */
test('statecraft panel opens, sets a legal code, and lists the realm ledger', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.getByText('下一步：選擇勢力', { exact: false }).click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: '內政', exact: false }).first().click();
  await page.getByRole('button', { name: '國政', exact: true }).first().click();

  // The four institution blocks and the ledger header.
  await expect(page.getByText('律令', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('徭役', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('選官之制', { exact: false })).toBeVisible();
  await expect(page.getByText('大工', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('全境民政', { exact: false })).toBeVisible();

  // Flipping to 峻法 must survive a re-render and show its badge.
  await page.getByRole('button', { name: '峻法', exact: true }).click();
  await expect(page.getByText('獄訟大增', { exact: false })).toBeVisible();

  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
});
