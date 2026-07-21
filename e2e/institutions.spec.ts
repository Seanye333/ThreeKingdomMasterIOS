import { test, expect } from '@playwright/test';

/**
 * 2026-07-21 制度批 — the four new realm-level levers (糴政 / 錢法 / 兵制 /
 * 流民之政) plus the 驛傳 readout all live in the 國政 panel. Each is a store
 * setter feeding a derived badge, which is exactly the shape that unit-tests
 * green and then throws in a browser, so this walks all of them for real.
 */
test('the new institutions all set, and their consequences read back', async ({ page }) => {
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
  await expect(page.getByText('律令', { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  // 糴政 (§1.16) — opening the roads must state the duty and the risk.
  await expect(page.getByText('糴政・米市', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '通糴', exact: true }).click();
  await expect(page.getByText('商稅', { exact: false }).first()).toBeVisible();

  // 錢法 (§1.17) — 大錢 must own up to the inflation it buys.
  await expect(page.getByText('錢法・物價', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '大錢', exact: true }).click();
  await expect(page.getByText('通脹', { exact: false }).first()).toBeVisible();

  // 兵制 (§4.8) — 募兵 must show the wage bill before you commit to it.
  await expect(page.getByText('兵制', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: '募兵', exact: true }).click();
  await expect(page.getByText('軍餉', { exact: false }).first()).toBeVisible();

  // 流民之政 (§8.6)
  await expect(page.getByText('流民之政', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '閉關', exact: true }).click();
  await expect(page.getByText('寸粟不出城', { exact: false }).or(page.getByText('民心', { exact: false }).first())).toBeVisible();

  // 驛傳 (§1.19) — the readout is derived, so it must exist from turn one.
  await expect(page.getByTestId('relay-summary')).toBeVisible();
  await expect(page.getByTestId('relay-summary')).toContainText('政令通達');

  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
});
