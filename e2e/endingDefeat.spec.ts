import { test, expect } from '@playwright/test';

/**
 * 敗亡落幕 — 亡國時玩家必須真的讀到那段輓歌。
 *
 * ## 為什麼有這條
 *
 * `systems/endings.ts` 裡五段敗亡輓歌(社稷為墟/階下之囚/奉璽出降/流亡天涯/
 * 敗亡)寫好之後躺了很久 —— **一次也沒被玩家看過**。MapScreen 只在
 * `victoryStatus === 'victory'` 掛 EndingsModal,亡國時畫面上只有 VictoryModal
 * 硬寫死的一行「爾之霸業,就此而止」。寫那批文字的 commit 自述「不動 UI」,
 * 於是就沒有人再回頭接。
 *
 * 這種洞單元測試抓不到:`checkEndings()` 回傳的東西完全正確,錯的是沒有人去
 * 呼叫它。所以要一條真的把遊戲打到亡國、再看畫面上有什麼的測試。
 *
 * 順帶釘住兩件同一批修的事:
 *  - 分勢力落幕文本(黃巾讀到的是「蒼天未死,黃天不立」,不是通用的流亡天涯)
 *  - 彈窗關得掉(敗亡時它由 victoryStatus 掛載,onClose 若只設 showEnding
 *    就關不掉 —— 條件式照樣為真)
 */
test('a landless player reads the board-specific elegy, and can close it', async ({ page }) => {
  page.on('pageerror', (err) => { throw new Error(`page crashed: ${err.message}`); });
  await page.goto('/');

  // 黃巾之亂,扮黃巾 —— 這張盤五家各有專屬敗亡變體。
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /黃巾之亂/ }).first().click();
  await next1.click();

  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /黃巾|張角/ }).first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

  /*
   * 亡國 — 把玩家的城全部劃給別人。不直接寫 victoryStatus:那樣測到的只是
   * 「條件式會不會渲染」,而 EndingsModal 是自己重算 checkEndings 的,城不歸零
   * 就選不到 defeat 那一支。要測的是這條完整的路。
   */
  const player = await page.evaluate(() => {
    const w = window as unknown as {
      __tkm?: {
        getState: () => {
          playerForceId: string | null;
          cities: Record<string, { id: string; ownerForceId: string | null }>;
        };
        setState: (p: Record<string, unknown>) => void;
      };
    };
    const st = w.__tkm;
    if (!st) return null;
    const s = st.getState();
    const me = s.playerForceId;
    const other = Object.values(s.cities).find((c) => c.ownerForceId && c.ownerForceId !== me);
    if (!me || !other) return null;
    const cities = Object.fromEntries(
      Object.entries(s.cities).map(([id, c]) => [
        id,
        c.ownerForceId === me ? { ...c, ownerForceId: other.ownerForceId } : c,
      ]),
    );
    st.setState({ cities, victoryStatus: 'defeat' });
    return me;
  });
  expect(player, '拿不到 __tkm store handle').toBe('yellow-turban');

  // 輓歌:黃巾專屬那一段,不是通用的「流亡天涯」。
  const ending = page.getByText('蒼天未死，黃天不立').first()
    .or(page.getByText('蒼天未死,黃天不立').first());
  await expect(ending).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('三十六方', { exact: false }).first()).toBeVisible();
  // 史官論曰 — 附在正文之後的那一段。
  await expect(page.getByText('論曰', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('流亡天涯')).toHaveCount(0);

  await page.screenshot({ path: 'e2e/__screens__/ending-defeat.png' });

  // 關得掉 —— 底下應該是 VictoryModal 的本局戰史。
  await page.getByRole('button', { name: '落幕' }).click();
  await expect(ending).toBeHidden({ timeout: 10_000 });
});
