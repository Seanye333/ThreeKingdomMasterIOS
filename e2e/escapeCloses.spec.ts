import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * Esc 關閉面板 — two separate faults met here, and the second one is why this
 * spec asserts on a panel that ALREADY had its escape handler.
 *
 * 1. 武將 (OfficersTab) and 群雄 (ForcesOverview) were the only two of the 53
 *    panels MapScreen/CityPanel hand an `onClose` to that never registered on
 *    the escape stack at all — they predate the shared <Modal> wrapper and
 *    hand-roll their own backdrop, so neither route reached `useEscapeKey`.
 *
 * 2. Adding the hook did not fix them, because `YearbookModal` — which is
 *    mounted for the whole game and renders null until a year closes — was
 *    registering `chronicle ? dismiss : () => {}`. With no chronicle pending
 *    that is a NO-OP on the escape stack, and since `() => {}` is a fresh
 *    identity every render, its effect re-ran and pushed the no-op back to the
 *    TOP on every render. Escape only calls the topmost handler, so whatever
 *    the player had open sat underneath a handler that did nothing. Measured
 *    stack with the roster open: `["onClose", "()=>{}"]`.
 *
 * That second fault is invisible in `npm run dev`: StrictMode double-invokes
 * effects, which reorders the stack enough that the panel lands on top anyway.
 * It only reproduces in a production build — so this spec, which runs against
 * `vite preview`, is the only place it can be caught.
 */

async function openTopBarPanel(page: import('@playwright/test').Page, name: string) {
  // 沉浸 chrome 會自動收起頂欄;先把滑鼠移上去喚醒它。
  await page.mouse.move(720, 300);
  await page.mouse.move(720, 30);
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).first().click({ timeout: 15_000 });
}

/** Hand-rolled backdrops and the shared <Modal> both use a `backdrop` class. */
const backdrops = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    let n = 0;
    document.querySelectorAll('*').forEach((e) => {
      if (/backdrop/i.test(String(e.className || ''))) n++;
    });
    return n;
  });

test.describe('Esc 關閉面板', () => {
  for (const name of ['武將', '群雄']) {
    test(`${name} 面板按 Esc 會關閉`, async ({ page }) => {
      test.setTimeout(120_000);
      await startCampaign(page);
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(2500);
      await page.evaluate(() => {
        const st = (window as unknown as {
          __tkm?: { setState: (p: Record<string, unknown>) => void };
        }).__tkm;
        st?.setState({ lastReport: null, popupQueue: [], pendingEvent: null, pendingBattleTheaters: [] });
      });

      const base = await backdrops(page);
      await openTopBarPanel(page, name);
      await expect.poll(() => backdrops(page), {
        message: `${name} 面板沒有開啟`, timeout: 20_000,
      }).toBeGreaterThan(base);

      await page.keyboard.press('Escape');
      await expect.poll(() => backdrops(page), {
        message:
          `${name} 面板按 Esc 沒有關閉 —— 不是這個面板忘了註冊,` +
          `就是有人在 escape stack 頂端塞了一個不關任何東西的處理器`,
        timeout: 10_000,
      }).toBe(base);
    });
  }
});
