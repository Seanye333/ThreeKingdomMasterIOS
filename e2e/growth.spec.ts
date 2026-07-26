import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * 武將成長 UI — confirm the new growth controls mount in a real browser without
 * a React crash: start a campaign, open the 武將 roster, open one of your own
 * officers, and assert the officer sheet shows 成長資質 (aptitude), 師承 (mentor)
 * and the 特訓 (train) button. A pageerror listener fails on any uncaught throw.
 */
test('officer sheet shows the new growth UI (aptitude / mentor / training)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await startCampaign(page);

  // In the realm — the top bar mounts.
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible({ timeout: 30_000 });

  // Open the 武將 roster, filter to your own officers, open the first one.
  await page.getByText('武將', { exact: false }).first().click();
  await page.getByRole('button', { name: 'Mine', exact: true }).click();
  await page.locator('li[style*="cursor: pointer"]').first().click();

  // OfficerDetail — the new growth UI must render.
  await expect(page.getByText('成長資質', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('師承', { exact: false })).toBeVisible();
  await expect(page.getByText('特訓', { exact: false }).first()).toBeVisible();

  await page.screenshot({ path: 'e2e/__screens__/officer-growth.png' });
  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
});

/**
 * 特訓 command + 山長 panel — confirm the city panel's new controls mount. Select
 * the capital (Tab, per the tutorial hint) to open the CityPanel, then assert the
 * 特訓 internal-affairs command button renders in the command menu.
 */
test('city panel shows the 特訓 command', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await startCampaign(page);
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible({ timeout: 30_000 });

  // Select the capital → the CityPanel (with its command menu) opens.
  await page.locator('canvas').first().click().catch(() => {});
  await page.keyboard.press('Tab');

  // 特訓 lives on the 軍務 tab of the (now tabbed) city sidebar — open it first.
  // Before the tabbed rewrite the command menu was one long list; this spec was
  // silently red from then until 2026-07-20.
  // Scope to the sidebar's own tab strip: the top bar ALSO has a 軍務 menu.
  const milTab = page.locator('nav button', { hasText: /^軍務/ }).first();
  await expect(milTab).toBeVisible({ timeout: 15_000 });
  await milTab.click();

  // The 特訓 command button must render in the city's order menu.
  await expect(page.getByText('特訓', { exact: false }).first()).toBeVisible({ timeout: 10_000 });

  await page.screenshot({ path: 'e2e/__screens__/city-training.png' });
  expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
});
