import { test, expect } from '@playwright/test';

/**
 * 序章 — picking a scenario that has an opening page must show it before the
 * map is playable, and dismissing it must not leave the campaign stuck.
 *
 * Guards the wiring rather than the prose: the flag is set inside loadScenario,
 * so a scenario silently losing its prologue entry (or the modal failing to
 * mount) is exactly the kind of break nothing else would catch.
 */
test('a scenario with a prologue opens on its opening page', async ({ page }) => {
  page.on('pageerror', (err) => { throw new Error(`page crashed: ${err.message}`); });
  await page.goto('/');

  // Step 1 — pick 黃巾之亂 (184), which carries a prologue.
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /黃巾之亂/ }).first().click();
  await next1.click();

  // Step 2 — first force on the board.
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();

  // Step 3 — launch.
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  // The prologue takes the screen before anything else.
  const dialog = page.getByRole('dialog', { name: '序章' });
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(dialog).toContainText('黃巾');
  // 所圖 — the objectives block is the reason this screen exists.
  await expect(dialog).toContainText('所圖');

  // Dismiss — the realm underneath must be live.
  await dialog.getByRole('button', { name: '入局' }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
});
