import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * 地圖繪製預算 — the map became unplayable once, and this is the number that
 * said why.
 *
 * Profiled at rest on the DEFAULT camera view: 5,633 scene drawables turning
 * into **17,279 draw calls a frame** (×3.07, the shadow pass re-drawing every
 * caster) at ~19 FPS, with the CPU sitting in renderBufferDirect and
 * uniformMatrix4fv. Draw-call count, not triangle count — the whole map is
 * only ~1.3M triangles, which is nothing.
 *
 * Two fixes brought it to ~5,000 calls and 47-60 FPS: city detail meshes drop
 * past the `near` zoom tier (a city is under four pixels across at the default
 * height), and the shadow pass turns off with them.
 *
 * The ceiling below is the regression guard. Draw-call count is deterministic
 * in a way FPS is not — a loaded CI box changes the frame rate but not how
 * many times the renderer is asked to draw — so that is what gets asserted.
 */
test('the default map view stays inside its draw-call budget', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const s = { draws: 0, frames: 0 };
    w.__gl = s;
    const patch = (proto: { [k: string]: unknown }) => {
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
        const orig = proto[name] as ((...a: unknown[]) => unknown) | undefined;
        if (!orig) continue;
        proto[name] = function (this: unknown, ...a: unknown[]) { s.draws++; return orig.apply(this, a); };
      }
    };
    patch(WebGLRenderingContext.prototype as unknown as { [k: string]: unknown });
    if (typeof WebGL2RenderingContext !== 'undefined') {
      patch(WebGL2RenderingContext.prototype as unknown as { [k: string]: unknown });
    }
    const loop = () => { s.frames++; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });

  await startCampaign(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(4000);

  const before = await page.evaluate(() => ({ ...(window as unknown as { __gl: Record<string, number> }).__gl }));
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({ ...(window as unknown as { __gl: Record<string, number> }).__gl }));

  const frames = after.frames - before.frames;
  expect(frames, 'no frames rendered — the map never started drawing').toBeGreaterThan(20);
  const perFrame = Math.round((after.draws - before.draws) / frames);

  console.log(`預設視角每幀 draw call: ${perFrame}(修復前 17,279,上限 9,000)`);
  // Generous headroom over the measured ~5,000 so this fails on a real
  // regression (a new always-on layer, or shadows creeping back into the
  // default view) rather than on scene-content drift.
  expect(perFrame, `每幀 draw call ${perFrame} 超出預算 —— 大地圖預設視角會掉幀`).toBeLessThan(9000);
});
