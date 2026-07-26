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
