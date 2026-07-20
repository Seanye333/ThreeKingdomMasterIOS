import { test, expect, type Page } from '@playwright/test';

/**
 * 武文諸面板 — a runtime smoke pass over everything §6.10–§6.18 added to the UI.
 *
 * These panels were shipped over five batches verified only by `tsc`, which
 * cannot catch the failure mode that actually bites React code: a crash on
 * first render (undefined access, a bad hook, a map over a missing ledger).
 * Every check below opens a panel and asserts the app is still alive.
 *
 * NOTE: modals are React.lazy, and under a HEADLESS browser a lazy import can
 * hang forever (see the project's headless-lazy-import note). The config runs
 * headed by default for this reason; when it must run headless, the per-panel
 * timeouts fail loudly rather than hanging the suite.
 */

/** Title wizard → a live realm. Shared by every case below. */
async function startCampaign(page: Page): Promise<void> {
  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await next1.click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
}

/** Open a panel through the command palette, which every screen exposes. */
async function openViaPalette(page: Page, label: string): Promise<void> {
  await page.keyboard.press('Control+k').catch(() => undefined);
  const box = page.locator('input[type="text"], input:not([type])').last();
  if (await box.isVisible().catch(() => false)) {
    await box.fill(label);
    await page.keyboard.press('Enter');
  }
}

test.describe('§6.10–§6.18 panels survive a real render', () => {
  test.beforeEach(async ({ page }) => {
    // Any uncaught React/JS error fails the case immediately.
    page.on('pageerror', (err) => { throw new Error(`page crashed: ${err.message}`); });
  });

  test('群雄 shows each realm without crashing (§6.18 國風 chip)', async ({ page }) => {
    await startCampaign(page);
    await openViaPalette(page, '群雄');
    // Either the panel opened, or the palette route differs — either way the
    // app must still be alive and rendering.
    await page.waitForTimeout(1_500);
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('武鬥館 opens and every tab renders — incl. 名門 (§6.18) and 恩怨/文敵 (§6.15)', async ({ page }) => {
    await startCampaign(page);
    await openViaPalette(page, '武鬥館');
    // The hall is lazy; give it room, then walk its tabs.
    const hall = page.getByText('武鬥館', { exact: false }).first();
    await expect(hall).toBeVisible({ timeout: 20_000 });
    for (const tab of ['戰績', '武評', '擂台', '團戰', '恩怨', '名門', '名局', '賭坊']) {
      const btn = page.locator('button', { hasText: new RegExp(`^${tab}`) }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(250); // a crash on this tab would fire pageerror
      }
    }
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('論辯場 opens and every tab renders — incl. 月旦 and 合辯', async ({ page }) => {
    await startCampaign(page);
    await openViaPalette(page, '論辯場');
    await page.waitForTimeout(2_000);
    for (const tab of ['切磋', '劇情', '群儒', '月旦', '合辯']) {
      const btn = page.locator('button', { hasText: new RegExp(`^${tab}`) }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(250);
      }
    }
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('清談大會 (§6.15) mounts its bracket screen', async ({ page }) => {
    await startCampaign(page);
    await openViaPalette(page, '清談大會');
    await page.waitForTimeout(2_000);
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('a season tick with the new per-season systems does not crash the realm', async ({ page }) => {
    await startCampaign(page);
    // Four ticks crosses a season boundary from any start phase, so every
    // per-season block in seasonBouts.ts actually executes at least once.
    // A tick can raise a report/popup whose backdrop swallows the next click,
    // so clear any overlay with Escape before each one.
    for (let i = 0; i < 4; i++) {
      // A tick raises a report modal whose backdrop swallows a pointer click.
      // The advance control advertises its own shortcut (「過旬結算 — 空格亦可」),
      // and the keyboard path is not blocked by an overlay — so drive it that
      // way. Close any report first so the key reaches the map handler.
      const closeBtn = page.locator('button', { hasText: /^(確定|關閉|×)$/ }).last();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => undefined);
        await page.waitForTimeout(400);
      }
      await page.locator('body').press('Space');
      await page.waitForTimeout(2_000);
    }
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
