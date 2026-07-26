import { expect, type Page } from '@playwright/test';

/**
 * 開局 — walk the title wizard into a live campaign.
 *
 * Every panel spec needs the same four clicks, and each one that open-codes
 * them is a spec that breaks the next time the opening flow gains a step.
 * That has already happened once: the 序章 prologue page landed between
 * "start" and the map, and its modal backdrop silently swallowed the first
 * click of five specs.
 *
 * So the flow lives here, prologue dismissal included. Boards without a
 * prologue fall straight through.
 */
export async function startCampaign(page: Page): Promise<void> {
  await page.goto('/');

  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await next1.click();

  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  await dismissPrologue(page);
}

/**
 * 序章 — dismiss the campaign's opening page if this board carries one.
 *
 * `locator.isVisible()` is instantaneous, so it must be preceded by a wait or
 * it reports false while the modal is still mounting. The wait is allowed to
 * time out: scenarios with no prologue simply never show it.
 */
export async function dismissPrologue(page: Page): Promise<void> {
  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
}

/**
 * 過旬 — advance one half-month and clear whatever the tick puts on screen.
 *
 * Ticking twice in a row does not work naively: the season report drops a
 * backdrop that swallows the next click on the end-turn button, Escape does not
 * close it (it has an explicit 繼續 button), and one tick can queue several
 * overlays behind it (report → event → popups). Clicking through them is slow
 * and open-ended — a spec that only wants to reach turn five spent three
 * minutes in the queue and timed out.
 *
 * So the queue is cleared through the store. Specs that are ABOUT those
 * overlays should click them properly; specs that merely need the clock to move
 * want this.
 */
export async function advanceTurn(page: Page): Promise<void> {
  const endBtn = page.locator('button', { hasText: /[上下]旬|End/ }).last();
  await endBtn.click();
  // A tick can open the 日流 day-by-day animation; the clock does not settle
  // until it finishes, and clicking again mid-flow does nothing useful.
  for (let i = 0; i < 30; i++) {
    const busy = await page.evaluate(() => {
      const s = (window as unknown as { __tkm?: { getState: () => { dayFlow?: unknown } } })
        .__tkm?.getState();
      return !!s?.dayFlow;
    }).catch(() => false);
    if (!busy) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(1_200);
  await clearOverlays(page);
}

/** Drop the report/event/popup queue straight through the store. */
export async function clearOverlays(page: Page): Promise<void> {
  await page.evaluate(() => {
    const st = (window as unknown as {
      __tkm?: { setState: (p: Record<string, unknown>) => void };
    }).__tkm;
    st?.setState({ lastReport: null, popupQueue: [], pendingEvent: null, pendingBattleTheaters: [] });
  });
  await page.waitForTimeout(300);
}
