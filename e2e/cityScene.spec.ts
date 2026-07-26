import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * 城邑地圖 — entering a city mounts a second, separate 3D scene (its own
 * Canvas, its own ~40 prop components, its own lighting and season/night
 * contexts).
 *
 * Nothing covered this path before, which made CityMapScreen3D the largest
 * file in the UI with no runtime check at all: every split, prop rename or
 * context move was verified by `tsc` alone, and `tsc` cannot see a component
 * that throws on first render.
 */
test('entering a city mounts the city scene and returns to the map', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await startCampaign(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

  // Select the capital, then take the panel's 進城 action.
  await page.getByRole('button', { name: /回都|🏯/ }).first().click().catch(() => {});
  const enter = page.getByText('進城', { exact: false }).first();
  await expect(enter).toBeVisible({ timeout: 20_000 });
  await enter.click();

  // The city scene: its own canvas plus the header controls that only it has.
  await expect(page.getByRole('button', { name: '離開城內' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: '戰術疊加' })).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();

  // The tactical overlay toggle reports its state to assistive tech.
  const overlay = page.getByRole('button', { name: '戰術疊加' });
  const before = await overlay.getAttribute('aria-pressed');
  await overlay.click();
  await expect.poll(() => overlay.getAttribute('aria-pressed')).not.toBe(before);

  // Back out to the world map.
  await page.getByRole('button', { name: '離開城內' }).click();
  await expect(page.getByRole('button', { name: '離開城內' })).toBeHidden({ timeout: 15_000 });
  await expect(page.locator('canvas').first()).toBeVisible();

  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});
