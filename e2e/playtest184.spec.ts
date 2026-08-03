import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

/**
 * 試玩 —— 親自扮黃巾打二十回合,看**人手裡**的感覺。
 *
 * 這不是回歸測試,是一支**探測**:到這裡為止,黃巾之亂的每一個結論都來自
 * `scenario-report.ts` 的 AI 自走。自走能回答「打得贏嗎」「活得下去嗎」,
 * 回答不了:
 *
 *   - 指令選單裡有沒有這一家真正該做的事(黃巾沒有官署,還能徵兵嗎?)
 *   - 開局那一屏,玩家看不看得懂自己是誰、要幹什麼
 *   - 府庫貼著三千過活,在人手裡是「緊張」還是「難受」
 *   - 事件彈出來時,選項讀不讀得懂
 *
 * 跑法(**必須 headed** —— React.lazy 的彈窗在 headless 下永遠 resolve 不了,
 * 而城內畫面在 SwiftShader 下也看不見):
 *
 *   npx playwright test e2e/playtest184.spec.ts --headed
 *
 * 截圖落在 e2e/__playtest__/,是給人看的,不做像素比對。
 *
 * ⚠ **headed 下的截圖會卡住。** 視窗一旦被別的視窗蓋住,瀏覽器就停掉 rAF,
 * 而 `page.screenshot()` 在等一個穩定影格 —— 於是它一路等到測試逾時
 * (實測卡了整整十分鐘,log 停在「fonts loaded」)。所以每張截圖都給短超時
 * 並吞掉失敗:截不到是小事,把整跑拖死不是。
 */

const SHOTS = 'e2e/__playtest__';

/** 截圖 —— 截不到就算了(見檔頭關於 rAF 停擺的說明)。 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 8000 }).catch(() => {});
}

/** 每回合從 store 撈一次家底 —— 螢幕上看到的數字要跟這裡對得上。 */
async function ledger(page: Page) {
  return page.evaluate(() => {
    const st = (window as unknown as { __tkm?: { getState: () => Record<string, unknown> } })
      .__tkm?.getState();
    if (!st) return null;
    const s = st as unknown as {
      playerForceId: string;
      date: { year: number; month: number };
      cities: Record<string, { ownerForceId: string | null; gold: number; food: number; troops: number; loyalty: number }>;
      mandate?: { byForce?: Record<string, number> };
      pendingEvent?: { event: { name: { zh: string } }; awaitingChoice?: boolean } | null;
    };
    const mine = Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId);
    const sum = (k: 'gold' | 'food' | 'troops') => mine.reduce((n, c) => n + (c[k] ?? 0), 0);
    return {
      year: s.date.year, month: s.date.month,
      cities: mine.length, gold: sum('gold'), food: sum('food'), troops: sum('troops'),
      loyalty: mine.length ? Math.round(mine.reduce((n, c) => n + c.loyalty, 0) / mine.length) : 0,
      mandate: Math.round(s.mandate?.byForce?.[s.playerForceId] ?? 0),
      pending: s.pendingEvent?.event.name.zh ?? null,
      awaiting: !!s.pendingEvent?.awaitingChoice,
    };
  });
}

test('扮黃巾打二十回合', async ({ page }) => {
  // 二十回合 + 截圖遠超設定檔的 90 秒;這是探測不是回歸,慢是可以的。
  test.setTimeout(600_000);
  mkdirSync(SHOTS, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /黃巾之亂/ }).first().click();
  await shot(page, `01-scenario`);
  await next1.click();

  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await shot(page, `02-forces`);
  await page.getByRole('button', { name: /黃巾|張角/ }).first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  // 序章 —— 玩家看到的第一屏
  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    await shot(page, `03-prologue`);
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await shot(page, `04-map-turn0`);

  const log: string[] = [];
  const start = await ledger(page);
  log.push(`開局  ${JSON.stringify(start)}`);

  /* 二十回合。事件照史實線(第一選項)走,並記下每一次彈窗。 */
  const seen: string[] = [];
  for (let t = 1; t <= 20; t++) {
    await page.evaluate(() => {
      const st = (window as unknown as { __tkm?: { getState: () => { endSeason: () => void } } }).__tkm;
      st?.getState().endSeason();
    });
    await page.waitForTimeout(320);
    const l = await ledger(page);
    if (l?.pending) {
      seen.push(`第${t}回合 ${l.pending}${l.awaiting ? '(要選)' : ''}`);
      if (seen.length <= 4) await shot(page, `ev-${t}-${seen.length}`);
      await page.evaluate(() => {
        const s = (window as unknown as {
          __tkm?: { getState: () => {
            pendingEvent?: { awaitingChoice?: boolean; event: { choices?: Array<{ id: string }> } } | null;
            resolveEventChoice?: (id: string) => void; dismissEvent?: () => void;
          } };
        }).__tkm?.getState();
        const p = s?.pendingEvent;
        const first = p?.event.choices?.[0];
        if (p?.awaitingChoice && first) s?.resolveEventChoice?.(first.id);
        else s?.dismissEvent?.();
      });
      await page.waitForTimeout(200);
    }
    /*
     * 彈窗佇列要另外清 —— `pendingEvent`(事件)與 `popupQueue`(大圖過場)
     * 是兩套東西,各有各的關法。第一版只清了前者,於是第 9 回合張角晉品階的
     * 大圖一路蓋在畫面上到第 20 回合,之後每一張「地圖」截圖其實都是那張彈窗
     * ——而且季節字是即時渲染的,同一個彈窗在夏、秋各拍到一次,看起來像是
     * 同一個人晉了兩次品階。差點把它當成遊戲的 bug 去修。
     */
    const drained = await page.evaluate(() => {
      const s = (window as unknown as {
        __tkm?: { getState: () => { popupQueue?: unknown[]; dismissPopup?: () => void } };
      }).__tkm;
      const titles: string[] = [];
      for (let i = 0; i < 8; i++) {
        const st = s?.getState();
        if (!st?.popupQueue?.length) break;
        titles.push((st.popupQueue[0] as { titleZh?: string }).titleZh ?? '?');
        st.dismissPopup?.();
      }
      return titles;
    });
    for (const d of drained) seen.push(`第${t}回合 [過場] ${d}`);
    if (t % 5 === 0) {
      log.push(`第${String(t).padStart(2)}回合 ${JSON.stringify(await ledger(page))}`);
      await shot(page, `turn-${t}`);
    }
  }

  /* 城內 —— 指令選單是玩家每回合真正要面對的東西。 */
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, `05-map-turn20`);

  console.log('\n=== 二十回合家底 ===');
  for (const line of log) console.log(line);
  console.log('\n=== 期間事件 ===');
  for (const s of seen) console.log('  ' + s);
  console.log('\n=== 頁面錯誤 ===');
  console.log(errors.length ? errors.slice(0, 10).join('\n') : '(無)');

  expect(errors.filter((e) => !/favicon|404/i.test(e)), errors.join('\n')).toEqual([]);
});
