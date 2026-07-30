import { test, expect } from '@playwright/test';
import { startCampaign, clearOverlays } from './helpers';

/**
 * 大地圖陰影 — the guard for a bug that hid behind another bug for months.
 *
 * The world map's shadow camera used to span the entire world (±MAP_W ×
 * ±MAP_D ≈ 416 × 300 world units) squeezed into one 2,048² shadow map: 0.2
 * units per texel against hex prisms about one unit wide. The depth test was
 * wrong nearly everywhere and whole hexes rendered PURE BLACK. Nobody saw it
 * for a long time because drei's <SoftShadows> was failing to link its shader
 * and suppressing the shadow pass entirely; when that was removed the map's
 * first genuinely-rendered shadows turned the ground into a checkerboard of
 * black holes, and shadows were switched off on this map altogether.
 *
 * MapSunShadow re-aims a tight frustum at the camera's ground point each
 * frame, which is what makes shadows usable here at all — so this spec exists
 * to notice the day someone widens the box again ("to cover more"), because
 * the failure mode is not subtle but it IS silent in every other test: the
 * scene mounts, every shader links, the draw-call budget is fine, and the map
 * is simply covered in black tiles.
 *
 * 量法 — count near-black pixels in the middle of the canvas (the HUD lives at
 * the edges). Reference points, all measured at a pinned camera:
 *   • shadows off entirely (the state this replaces): 0.15%
 *   • world-sized frustum, shadows on (the bug):      4.01%
 * Real shadows are never pure black here — ambient + hemisphere fill lift
 * them well clear of the threshold — so anything approaching the bug's number
 * means the acne is back.
 */
test('the world map renders shadows without the black-hex acne', async ({ page }) => {
  test.setTimeout(180_000);
  const rig: string[] = [];
  page.on('console', (m) => { if (m.text().includes('[MapSunShadow]')) rig.push(m.text()); });
  await startCampaign(page);
  await clearOverlays(page);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 60_000 });

  // 釘死鏡頭 — zoom to the near tier, where castShadow is on. The zoom buttons
  // are the only camera control that does not depend on where the campaign
  // happened to start.
  // The near tier starts below camera.y = 39 (LOD_MID_DIST 45 with hysteresis),
  // and each press multiplies the distance by 0.78 — from the opening height
  // that takes a good dozen presses, not the four I first guessed. Keep
  // pressing until the rig reports it is actually casting, so the spec cannot
  // quietly pass by never reaching the tier it means to test.
  for (let i = 0; i < 24 && !rig.some((l) => l.endsWith('casting=true') || l.includes('casting=true')); i++) {
    await page.getByRole('button', { name: '放大' }).first().click({ timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(320);
  }
  await page.waitForTimeout(4000);

  const shot = await canvas.screenshot();
  const ratio = await page.evaluate(async (bytes) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
    const bmp = await createImageBitmap(blob);
    // Sample the middle half of the frame: the HUD chrome (dark panels, the
    // minimap) hugs the edges and would swamp the count.
    const w = Math.floor(bmp.width / 2), h = Math.floor(bmp.height / 2);
    const cv = new OffscreenCanvas(w, h);
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(bmp, bmp.width / 4, bmp.height / 4, w, h, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let dark = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 24 && data[i + 1] < 24 && data[i + 2] < 24) dark++;
    }
    return dark / (data.length / 4);
  }, Array.from(new Uint8Array(shot)));

  console.log(`大地圖近黑像素:${(ratio * 100).toFixed(2)}%(無陰影基準 0.15%,壞掉時 4.01%)`);
  expect(
    ratio,
    `近黑像素 ${(ratio * 100).toFixed(2)}% —— 陰影痤瘡回來了(多半是有人把 shadow frustum 放大了,見 MapSunShadow)`,
  ).toBeLessThan(0.015);

  /* 「乾淨」有兩種可能:痤瘡修好了,或是陰影根本沒開 —— 像素數分不出來,
     所以同時斷言 rig 自己報的狀態。 */
  console.log(`陰影相機:${rig.at(-1) ?? '(無)'}`);
  expect(rig.length, 'MapSunShadow 一次都沒設定陰影相機 —— 這張圖又變回沒有陰影了').toBeGreaterThan(0);
  // Must be casting AT THE MOMENT OF MEASUREMENT — `some()` would be satisfied
  // by the mount-time frame before the LOD tracker settles, which is exactly
  // how the first cut of this spec passed while measuring a shadowless map.
  expect(rig.at(-1), `量測時並沒有在投影(${rig.at(-1)})—— 鏡頭沒到 near 檔`).toContain('casting=true');
  const extents = rig.map((l) => Number(/extent=([\d.]+)/.exec(l)?.[1] ?? NaN));
  const worst = Math.max(...extents);
  expect(
    worst,
    `陰影相機半徑最大 ${worst} 世界單位 —— 上限 26,再大 texel 就粗到重現黑格`,
  ).toBeLessThanOrEqual(26);
});
