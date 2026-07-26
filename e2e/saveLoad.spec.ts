import { test, expect } from '@playwright/test';
import { startCampaign, advanceTurn, clearOverlays } from './helpers';

/**
 * 存讀檔 — save/load had no end-to-end coverage, only the round-trip assertion
 * buried in the soak integration test (which runs headless against the store,
 * not against a real browser with real localStorage and a mounted UI).
 *
 * That leaves the failure mode nobody was watching: a slice of state that the
 * UI depends on but the serializer drops. It survives every unit test — the
 * store round-trips fine — and only shows up as a blank panel or a crash after
 * the player loads. This walks the whole path in the browser: play, save,
 * change the world, load, and check the world came back.
 */

interface StoreHandle {
  getState: () => Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
}
declare global {
  interface Window { __tkm?: StoreHandle }
}

/** A compact fingerprint of the things a player would notice going missing. */
async function fingerprint(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const s = window.__tkm!.getState() as {
      date: { year: number; month: number; season: string; phase?: string };
      playerForceId: string | null;
      cities: Record<string, { ownerForceId: string | null; gold: number; troops: number }>;
      officers: Record<string, { status: string }>;
      scenarioId?: string;
    };
    const mine = Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId);
    return {
      year: s.date.year,
      month: s.date.month,
      // A tick moves the PHASE (上旬→中旬→下旬); several are needed to turn the
      // month over, so a divergence check on year/month alone proves nothing.
      phase: (s.date as { phase?: string }).phase ?? null,
      season: s.date.season,
      force: s.playerForceId,
      scenario: s.scenarioId ?? null,
      myCities: mine.length,
      gold: mine.reduce((a, c) => a + c.gold, 0),
      troops: mine.reduce((a, c) => a + c.troops, 0),
      officers: Object.keys(s.officers).length,
      living: Object.values(s.officers).filter((o) => o.status !== 'dead').length,
    };
  });
}

// Five ticks plus the opening wizard runs past the 90s default.
test.setTimeout(180_000);

test('a campaign survives a save, a divergence, and a load', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await startCampaign(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

  // Play a couple of ticks so the save holds something other than turn one.
  await advanceTurn(page);
  expect(errors, `crashed while playing: ${errors.join(' | ')}`).toEqual([]);

  const saved = await fingerprint(page);
  const ok = await page.evaluate(() => {
    const s = window.__tkm!.getState() as { saveSlot: (id: string, label: string) => void };
    s.saveSlot('e2e-slot', 'e2e');
    return true;
  });
  expect(ok).toBe(true);

  // Diverge hard: several more ticks, so a load that silently no-ops is caught.
  for (let i = 0; i < 2; i++) await advanceTurn(page);
  const diverged = await fingerprint(page);
  expect(
    diverged.year !== saved.year || diverged.month !== saved.month
      || diverged.phase !== saved.phase,
    'the campaign must actually have moved on, or the test proves nothing',
  ).toBe(true);

  // Load it back.
  const loaded = await page.evaluate(() => {
    const s = window.__tkm!.getState() as { loadSlot: (id: string) => boolean };
    return s.loadSlot('e2e-slot');
  });
  expect(loaded, 'loadSlot reported failure').toBe(true);
  await page.waitForTimeout(1_500);

  const after = await fingerprint(page);
  expect(after, 'the loaded campaign must match what was saved').toEqual(saved);
  expect(errors, `crashed on load: ${errors.join(' | ')}`).toEqual([]);

  // The realm must still be interactive afterwards — a load that restores the
  // data but leaves the UI wedged is still a broken load.
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20_000 });
  await clearOverlays(page);
  await advanceTurn(page);
  expect(errors, `crashed after resuming a loaded game: ${errors.join(' | ')}`).toEqual([]);
});
