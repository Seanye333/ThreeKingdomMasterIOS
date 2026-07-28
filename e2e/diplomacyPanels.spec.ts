import { test, expect } from '@playwright/test';
import { startCampaign, clearOverlays } from './helpers';

/**
 * 外交面板 — the panel specs that were missing.
 *
 * Last session a spec for the free-agent recruit odds could not find its
 * section and was deleted rather than committed red; the suspicion at the time
 * was that immersive chrome had collapsed the sidebar. That turned out to be
 * wrong — `uiPrefs` defaults every chrome flag to false, so nothing is hidden.
 * The real constraint is simpler and worth writing down:
 *
 *   **Most modals are React.lazy; DiplomacyModal is a plain import.**
 *
 * A lazy modal's chunk resolution is unreliable under headless (a previously
 * recorded gotcha), so a panel spec that must run in CI should target a
 * statically-imported panel. That is what this file does.
 *
 * What it guards: the 討伐會盟 block added when war leagues were surfaced. The
 * engine formed, ticked and expired leagues with no UI at all — a player could
 * be the sworn target of one and read nothing about it anywhere.
 */

test.describe('外交面板', () => {
  test('opens and lists the realms', async ({ page }) => {
    await startCampaign(page);
    await clearOverlays(page);

    await page.getByRole('button', { name: '外交', exact: false }).first().click();
    await page.getByRole('button', { name: '邦交', exact: true }).first().click();

    // 信譽 is in the panel header (國庫金 · 信譽 N) and appears nowhere in the menu.
    await expect(page.getByText('信譽', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('a war league the player is targeted by is announced', async ({ page }) => {
    await startCampaign(page);
    await clearOverlays(page);

    // Plant a league sworn against the player. Reaching one through play would
    // take dozens of turns and depend on AI mood; the panel's job is to render
    // whatever the engine holds, and that is what is under test.
    const planted = await page.evaluate(() => {
      const st = (window as unknown as {
        __tkm?: {
          getState: () => {
            playerForceId: string | null;
            forces: Record<string, unknown>;
            date: { year: number; season: string; month: number; phase: string };
          };
          setState: (p: Record<string, unknown>) => void;
        };
      }).__tkm;
      if (!st) return null;
      const s = st.getState();
      const me = s.playerForceId;
      if (!me) return null;
      const others = Object.keys(s.forces).filter((f) => f !== me);
      if (others.length < 2) return null;
      st.setState({
        warCoalitions: [{
          leaderForceId: others[0],
          targetForceId: me,
          memberForceIds: [others[0], others[1]],
          startedYear: s.date.year,
          expiresAt: { ...s.date, year: s.date.year + 3 },
        }],
      });
      return { leader: others[0], expires: s.date.year + 3 };
    });
    expect(planted, 'could not plant a coalition — store shape changed?').not.toBeNull();

    await page.getByRole('button', { name: '外交', exact: false }).first().click();
    await page.getByRole('button', { name: '邦交', exact: true }).first().click();

    // The section header, then the warning line naming the league's size.
    await expect(page.getByText('討伐會盟', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('共討於你', { exact: false })).toBeVisible();
  });

  test('a league the player leads reads as theirs, not as a threat', async ({ page }) => {
    await startCampaign(page);
    await clearOverlays(page);

    const planted = await page.evaluate(() => {
      const st = (window as unknown as {
        __tkm?: {
          getState: () => {
            playerForceId: string | null;
            forces: Record<string, unknown>;
            date: { year: number; season: string; month: number; phase: string };
          };
          setState: (p: Record<string, unknown>) => void;
        };
      }).__tkm;
      if (!st) return false;
      const s = st.getState();
      const me = s.playerForceId;
      if (!me) return false;
      const others = Object.keys(s.forces).filter((f) => f !== me);
      if (others.length < 2) return false;
      st.setState({
        warCoalitions: [{
          leaderForceId: me,
          targetForceId: others[0],
          memberForceIds: [me, others[1]],
          startedYear: s.date.year,
          expiresAt: { ...s.date, year: s.date.year + 3 },
        }],
      });
      return true;
    });
    expect(planted).toBe(true);

    await page.getByRole('button', { name: '外交', exact: false }).first().click();
    await page.getByRole('button', { name: '邦交', exact: true }).first().click();

    await expect(page.getByText('討伐會盟', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('你為盟主', { exact: false })).toBeVisible();
    // …and it must NOT be dressed as an attack on the player.
    await expect(page.getByText('共討於你', { exact: false })).toHaveCount(0);
  });

  test('no league means no section at all', async ({ page }) => {
    await startCampaign(page);
    await clearOverlays(page);
    await page.evaluate(() => {
      (window as unknown as { __tkm?: { setState: (p: Record<string, unknown>) => void } })
        .__tkm?.setState({ warCoalitions: [] });
    });

    await page.getByRole('button', { name: '外交', exact: false }).first().click();
    await page.getByRole('button', { name: '邦交', exact: true }).first().click();

    await expect(page.getByText('信譽', { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('討伐會盟', { exact: false })).toHaveCount(0);
  });
});
