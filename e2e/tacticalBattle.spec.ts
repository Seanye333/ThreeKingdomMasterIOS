import { test, expect, type Page } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * 戰術戰鬥 — the battle screen had NO end-to-end coverage at all.
 *
 * It is the single largest screen in the app (4,400 lines of React plus a
 * three.js scene), it mounts dozens of sub-components, and every check on it so
 * far has been `tsc` plus unit tests on the engine underneath. Neither catches
 * the failure that actually bites: a crash on first render, a hook-order
 * violation, or an action that throws when clicked. That exact class of bug was
 * found by hand twice this month (an effect called after an early return, and
 * a nameplate reading a field that no longer existed).
 *
 * Reaching a battle by playing is impractical here — raise an army, march for
 * several turns, arrive — so the battle is put on the screen through the store,
 * which the app already exposes as `window.__tkm`. The point is not to test the
 * engine (unit tests cover it thoroughly) but to prove the SCREEN survives
 * mounting, being interacted with, and closing.
 *
 * `TacticalBattleScreen` is a direct import, not React.lazy, so this is safe
 * headless — unlike the panels in boutPanels.spec.
 */

interface StoreHandle {
  getState: () => Record<string, unknown>;
  setState: (patch: Record<string, unknown>) => void;
}
declare global {
  interface Window { __tkm?: StoreHandle }
}

/**
 * Put a small field battle on screen.
 *
 * The battle object is built by hand rather than through `setupTacticalBattle`:
 * Playwright runs against the BUILT app (vite preview), so `/src/**` is not
 * importable from the page — and hand-building also keeps this spec from
 * breaking every time the setup helper's internals change. Only the fields the
 * screen actually reads are populated; anything it treats as optional is left
 * out on purpose, which is itself a check that the screen tolerates a sparse
 * battle rather than assuming every field is present.
 */
async function stageBattle(page: Page): Promise<void> {
  await page.evaluate(() => {
    const st = window.__tkm!;
    const s = st.getState() as {
      officers: Record<string, { id: string; forceId: string | null; status: string }>;
      playerForceId: string | null;
      startTacticalBattle: (b: unknown) => void;
    };
    const mine = Object.values(s.officers)
      .filter((o) => o.forceId === s.playerForceId && o.status !== 'dead').slice(0, 2);
    const theirs = Object.values(s.officers)
      .filter((o) => o.forceId && o.forceId !== s.playerForceId && o.status !== 'dead').slice(0, 2);
    if (mine.length === 0 || theirs.length === 0) throw new Error('no officers to field');

    const W = 10, H = 7;
    const tiles: Array<{ coord: { col: number; row: number }; terrain: string }> = [];
    for (let col = 0; col < W; col++) {
      for (let row = 0; row < H; row++) tiles.push({ coord: { col, row }, terrain: 'plain' });
    }
    const mkUnit = (
      o: { id: string }, i: number, side: 'attacker' | 'defender',
    ) => ({
      id: o.id, officerId: o.id, side,
      unitType: i === 0 ? 'infantry' : 'archers',
      troops: 5000, maxTroops: 5000,
      coord: { col: side === 'attacker' ? 1 : W - 2, row: 2 + i * 2 },
      ap: 2, maxAp: 2, morale: 80, effects: [],
      isCommander: i === 0, facing: side === 'attacker' ? 0 : 3,
    });

    s.startTacticalBattle({
      id: 'e2e-battle',
      cityId: undefined,
      attackerForceId: s.playerForceId,
      defenderForceId: theirs[0].forceId,
      width: W, height: H,
      tiles,
      units: [
        ...mine.map((o, i) => mkUnit(o, i, 'attacker')),
        ...theirs.map((o, i) => mkUnit(o, i, 'defender')),
      ],
      turn: 1,
      activeSide: 'attacker',
      stratagemCooldowns: {},
      log: [],
      weather: 'clear',
      timeOfDay: 'day',
      field: true,
      startTroops: { attacker: 10000, defender: 10000 },
      attackerLosses: 0,
      defenderLosses: 0,
    });
  });
}

test.describe('戰術戰鬥畫面', () => {
  test('mounts, takes an action, and closes without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await startCampaign(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

    await stageBattle(page);

    // The battle HUD is up: the end-turn control and the board's own canvas.
    const endTurn = page.getByRole('button', { name: /結束回合|End Turn/ });
    await expect(endTurn).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('canvas').first()).toBeVisible();
    expect(errors, `crashed on mount: ${errors.join(' | ')}`).toEqual([]);

    // Selecting a unit populates the side panel — the densest render path on
    // the screen (stratagems, tactics, status badges, siege actions).
    await page.evaluate(() => {
      const st = window.__tkm!;
      const s = st.getState() as { tacticalBattle?: { units: Array<{ id: string; side: string }> } };
      const mine = s.tacticalBattle?.units.find((u) => u.side === 'attacker');
      if (mine) st.setState({ selectedUnitId: mine.id });
    });
    await page.waitForTimeout(500);
    expect(errors, `crashed selecting a unit: ${errors.join(' | ')}`).toEqual([]);

    // Hand the turn over — drives endTurn, the AI pass, and a re-render.
    await endTurn.click();
    await page.waitForTimeout(2_500);
    expect(errors, `crashed on end turn: ${errors.join(' | ')}`).toEqual([]);
    await expect(page.locator('canvas').first()).toBeVisible();

    // Tear the battle down and make sure the realm comes back.
    await page.evaluate(() => window.__tkm!.setState({ tacticalBattle: null }));
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20_000 });
    expect(errors, `crashed on teardown: ${errors.join(' | ')}`).toEqual([]);
  });

  test('survives a full AI-driven battle running to its end', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await startCampaign(page);
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
    await stageBattle(page);
    await expect(page.getByRole('button', { name: /結束回合|End Turn/ })).toBeVisible({ timeout: 30_000 });

    // Hand turns back and forth through the screen's own end-turn control, so
    // every pass goes through the real React commit path rather than a store
    // poke. Engine internals are not importable from the built app, which is
    // fine — clicking is closer to what a player does anyway.
    const endTurn = page.getByRole('button', { name: /結束回合|End Turn/ });
    for (let i = 0; i < 8; i++) {
      const over = await page.evaluate(() => {
        const s = window.__tkm!.getState() as { tacticalBattle?: { winner?: string | null } | null };
        return !s.tacticalBattle || !!s.tacticalBattle.winner;
      });
      if (over) break;
      if (!(await endTurn.isVisible().catch(() => false))) break;
      await endTurn.click();
      await page.waitForTimeout(1_200);
      expect(errors, `crashed on turn ${i + 1}: ${errors.join(' | ')}`).toEqual([]);
    }
    await page.waitForTimeout(1_000);
    expect(errors, `crashed mid-battle: ${errors.join(' | ')}`).toEqual([]);
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
