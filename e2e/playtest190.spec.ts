import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

/**
 * 試玩 —— 親自扮曹操打 190 反董卓聯軍,看**人手裡**的感覺。
 *
 * 與 playtest184 同一個用意:自走體檢回答得了「打得贏嗎」「活得下去嗎」,
 * 回答不了「開局那一屏看不看得懂」「指令選單裡有沒有這一家該做的事」。
 * 這一支特別要看的是這一批改動有沒有真的到玩家眼前:
 *
 *   - 開局外交:曹操與袁紹、袁術、孫堅是同盟,盤面上看得出來嗎
 *   - 十一家的序章與目標:曹操那條剛從「取洛陽」改成「守住核心」
 *   - 事件鏈:討董 → 溫酒斬華雄 → 三英戰呂布 → 焚洛陽 → 玉璽,順序對不對
 *   - 董卓帳下十七將:虎牢關前有沒有守將
 *
 * 跑法(**必須 headed** —— React.lazy 的彈窗在 headless 下永遠 resolve 不了):
 *
 *   npx playwright test e2e/playtest190.spec.ts --headed
 *
 * 截圖落在 e2e/__playtest__/190/,是給人看的,不做像素比對。
 */

const SHOTS = 'e2e/__playtest__/190';

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 8000 }).catch(() => {});
}

async function ledger(page: Page) {
  return page.evaluate(() => {
    const st = (window as unknown as { __tkm?: { getState: () => Record<string, unknown> } })
      .__tkm?.getState();
    if (!st) return null;
    const s = st as unknown as {
      playerForceId: string;
      date: { year: number; season: string };
      cities: Record<string, { name: { zh: string }; ownerForceId: string | null; gold: number; food: number; troops: number; loyalty: number }>;
      officers: Record<string, { forceId: string | null; status: string }>;
      mandate?: { byForce?: Record<string, number> };
      diplomacy?: { relations?: Record<string, { forceA: string; forceB: string; status: string; score: number }> };
      pendingEvent?: { event: { name: { zh: string } }; awaitingChoice?: boolean } | null;
    };
    const mine = Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId);
    const sum = (k: 'gold' | 'food' | 'troops') => mine.reduce((n, c) => n + (c[k] ?? 0), 0);
    const allies = Object.values(s.diplomacy?.relations ?? {})
      .filter((r) => (r.forceA === s.playerForceId || r.forceB === s.playerForceId) && r.status === 'allied')
      .map((r) => (r.forceA === s.playerForceId ? r.forceB : r.forceA));
    return {
      year: s.date.year, season: s.date.season,
      cities: mine.map((c) => `${c.name.zh}(忠${Math.round(c.loyalty)})`).join(' '),
      n: mine.length, gold: sum('gold'), food: sum('food'), troops: sum('troops'),
      officers: Object.values(s.officers).filter((o) => o.forceId === s.playerForceId && o.status !== 'dead').length,
      mandate: Math.round(s.mandate?.byForce?.[s.playerForceId] ?? 0),
      allies,
      pending: s.pendingEvent?.event.name.zh ?? null,
      awaiting: !!s.pendingEvent?.awaitingChoice,
    };
  });
}

test('扮曹操打反董卓聯軍', async ({ page }) => {
  test.setTimeout(900_000);
  mkdirSync(SHOTS, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /反董卓聯軍/ }).first().click();
  await shot(page, '01-scenario');
  await next1.click();

  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await shot(page, '02-forces');
  await page.getByRole('button', { name: /曹操/ }).first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    await shot(page, '03-prologue');
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await shot(page, '04-map-turn0');

  const log: string[] = [];
  log.push(`開局  ${JSON.stringify(await ledger(page))}`);

  // 目標面板 —— 玩家第一件想知道的事:我要幹什麼
  await page.mouse.move(720, 300);
  await page.mouse.move(720, 30);
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /記錄/, exact: false }).first().click({ timeout: 10_000 }).catch(() => {});
  await page.getByRole('menuitem', { name: '戰役目標', exact: true }).first().click({ timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(900);
  await shot(page, '05-objectives');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  const seen: string[] = [];
  for (let t = 1; t <= 40; t++) {
    await page.evaluate(() => {
      const st = (window as unknown as { __tkm?: { getState: () => { endSeason: () => void } } }).__tkm;
      st?.getState().endSeason();
    });
    await page.waitForTimeout(260);
    const l = await ledger(page);
    if (l?.pending) {
      seen.push(`第${t}回合 ${l.pending}${l.awaiting ? '(要選)' : ''}`);
      if (seen.length <= 6) await shot(page, `ev-${String(t).padStart(2, '0')}`);
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
      await page.waitForTimeout(180);
    }
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
    if (t % 10 === 0) {
      log.push(`第${String(t).padStart(2)}回合 ${JSON.stringify(await ledger(page))}`);
      await shot(page, `turn-${String(t).padStart(2, '0')}`);
    }
  }

  console.log('\n=== 家底 ===');
  for (const l of log) console.log(l);
  console.log('\n=== 事件 ===');
  for (const s of seen) console.log('  ' + s);
  console.log('\n=== 主控台錯誤 ===');
  console.log(errors.length ? errors.slice(0, 12).join('\n') : '(無)');
});
