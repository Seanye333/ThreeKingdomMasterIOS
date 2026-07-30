import { test, expect } from '@playwright/test';
import { startCampaign, clearOverlays, openMenu } from './helpers';

/**
 * 對話框與選單的可及性 — the keyboard-and-reader contract, pinned.
 *
 * Two shapes of dialog exist in this app: the shared `<Modal>` shell, and ~26
 * panels that predate it and hand-roll `styles.backdrop` + `styles.modal`. The
 * hand-rolled half had none of the dialog contract — no `role`, no `aria-modal`,
 * Tab walked straight out into the map behind, and closing dropped focus on
 * <body>. Both halves now share `useDialogFocus`, and this asserts the result
 * rather than the implementation, so a new panel that forgets it fails here.
 *
 * The six top-bar dropdowns were mouse-only in the same way: the trigger
 * announced nothing, the list had no menu semantics, Escape did not close it,
 * and arrow keys did nothing.
 */

test.describe('可及性', () => {
  test('頂欄下拉是一個真正的選單:狀態、角色、Esc、方向鍵', async ({ page }) => {
    test.setTimeout(120_000);
    await startCampaign(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    await page.mouse.move(720, 300);
    await page.mouse.move(720, 30);
    await page.waitForTimeout(400);
    const trigger = page.getByRole('button', { name: '內政', exact: false }).first();

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger, '收合時 aria-expanded 應為 false').toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger, '展開時 aria-expanded 應為 true').toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();
    expect(await menu.getByRole('menuitem').count(), '選單裡一個 menuitem 都沒有').toBeGreaterThan(2);

    // Esc 關閉並把焦點還給觸發鈕 —— 不還的話鍵盤使用者會掉回文件開頭。
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden({ timeout: 5000 });
    await expect(trigger).toBeFocused();

    // 方向鍵開啟並在項目間走動。
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu').first()).toBeVisible({ timeout: 5000 });
    const first = await page.evaluate(() => (document.activeElement as HTMLElement)?.innerText?.trim() ?? '');
    await page.keyboard.press('ArrowDown');
    const second = await page.evaluate(() => (document.activeElement as HTMLElement)?.innerText?.trim() ?? '');
    expect(first, '方向鍵沒有把焦點帶進選單').not.toBe('');
    expect(second, 'ArrowDown 沒有移動焦點').not.toBe(first);
  });

  test('手寫 backdrop 的面板也有完整的對話框語意', async ({ page }) => {
    test.setTimeout(120_000);
    await startCampaign(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    // 武將 — the largest of the hand-rolled panels, and one of the two that
    // reached neither the escape stack nor any focus handling.
    await page.mouse.move(720, 300);
    await page.mouse.move(720, 30);
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /^武將/ }).first().click();

    const dialog = page.getByRole('dialog', { name: /武將|Officers/ }).first();
    await expect(dialog, '武將面板沒有 role=dialog').toBeVisible({ timeout: 20_000 });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // 焦點必須已經進到面板裡,否則 Tab 第一下就跑到後面的地圖上。
    const inside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return !!d && !!document.activeElement && d.contains(document.activeElement);
    });
    expect(inside, '開啟後焦點沒有進到對話框內').toBe(true);

    // Tab 收束 —— 連按之後仍須留在面板內。
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return !!d && !!document.activeElement && d.contains(document.activeElement);
    });
    expect(stillInside, 'Tab 走出了對話框 —— 焦點跑到後面的地圖上了').toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});
