import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * 試玩的**畫面**那一半 —— 專門把大地圖抓下來看。
 *
 * `page.screenshot()` 在 headed 下等一個穩定影格,而視窗一被別的視窗蓋住
 * 瀏覽器就停掉 rAF,於是它一路等到逾時(playtest190 那支跑完只留下三張,
 * 進地圖之後全部落空)。這裡改用 `canvas.toDataURL()` 直接把繪圖緩衝讀出來
 * —— 大地圖的 <Canvas> 開著 preserveDrawingBuffer(📷 天下大勢那顆鈕要用),
 * 所以讀得到,而且不必等任何影格。
 */

const SHOTS = 'e2e/__playtest__/190';

async function dumpCanvas(page: import('@playwright/test').Page, name: string): Promise<boolean> {
  const url = await page.evaluate(() => {
    const cs = Array.from(document.querySelectorAll('canvas'));
    const c = cs.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!c || !c.width) return null;
    try { return c.toDataURL('image/png'); } catch { return null; }
  });
  if (!url) return false;
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
  return true;
}

test('曹操的大地圖', async ({ page }) => {
  test.setTimeout(600_000);
  mkdirSync(SHOTS, { recursive: true });

  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /反董卓聯軍/ }).first().click();
  await next1.click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /曹操/ }).first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 40_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    // 序章那一屏是 DOM,不是 canvas —— 這一張還是得用 page.screenshot,給短逾時。
    await page.screenshot({ path: `${SHOTS}/p1-prologue.png`, timeout: 6000 }).catch(() => {});
    const txt = await prologue.innerText().catch(() => '');
    console.log('\n=== 序章全文 ===\n' + txt.slice(0, 1400));
    await prologue.getByRole('button', { name: '入局' }).click();
  }
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(4000);
  console.log('開局地圖:', await dumpCanvas(page, 'm0-turn0') ? '已擷取' : '擷取失敗');

  const tick = async (n: number) => {
    for (let i = 0; i < n; i++) {
      await page.evaluate(() => {
        const s = (window as unknown as { __tkm?: { getState: () => {
          endSeason: () => void;
          pendingEvent?: { awaitingChoice?: boolean; event: { choices?: Array<{ id: string }> } } | null;
          resolveEventChoice?: (id: string) => void; dismissEvent?: () => void;
          popupQueue?: unknown[]; dismissPopup?: () => void;
        } } }).__tkm;
        s?.getState().endSeason();
        const st = s?.getState();
        const p = st?.pendingEvent;
        if (p) {
          const first = p.event.choices?.[0];
          if (p.awaitingChoice && first) st?.resolveEventChoice?.(first.id);
          else st?.dismissEvent?.();
        }
        for (let k = 0; k < 8; k++) {
          const q = s?.getState();
          if (!q?.popupQueue?.length) break;
          q.dismissPopup?.();
        }
      });
      await page.waitForTimeout(220);
    }
  };

  await tick(18);
  await page.waitForTimeout(2500);
  console.log('第18回合地圖:', await dumpCanvas(page, 'm1-turn18') ? '已擷取' : '擷取失敗');

  await tick(18);
  await page.waitForTimeout(2500);
  console.log('第36回合地圖:', await dumpCanvas(page, 'm2-turn36') ? '已擷取' : '擷取失敗');

  const l = await page.evaluate(() => {
    const s = (window as unknown as { __tkm?: { getState: () => Record<string, unknown> } }).__tkm?.getState() as unknown as {
      playerForceId: string; date: { year: number; season: string };
      cities: Record<string, { name: { zh: string }; ownerForceId: string | null; gold: number; food: number; troops: number; loyalty: number }>;
      forces: Record<string, { name: { zh: string } }>;
      diplomacy?: { relations?: Record<string, { forceA: string; forceB: string; status: string; score: number }> };
    };
    const mine = Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId);
    const rel = Object.values(s.diplomacy?.relations ?? {})
      .filter((r) => r.forceA === s.playerForceId || r.forceB === s.playerForceId)
      .map((r) => `${s.forces[r.forceA === s.playerForceId ? r.forceB : r.forceA]?.name.zh}:${r.status}(${Math.round(r.score)})`);
    const byForce: Record<string, number> = {};
    for (const c of Object.values(s.cities)) if (c.ownerForceId) byForce[s.forces[c.ownerForceId]?.name.zh ?? c.ownerForceId] = (byForce[s.forces[c.ownerForceId]?.name.zh ?? c.ownerForceId] ?? 0) + 1;
    return {
      when: `${s.date.year} ${s.date.season}`,
      mine: mine.map((c) => `${c.name.zh}(兵${Math.round(c.troops)} 忠${Math.round(c.loyalty)})`),
      gold: mine.reduce((n, c) => n + c.gold, 0), food: mine.reduce((n, c) => n + c.food, 0),
      rel, board: byForce,
    };
  });
  console.log('\n=== 第36回合家底 ===\n' + JSON.stringify(l, null, 1));
});
