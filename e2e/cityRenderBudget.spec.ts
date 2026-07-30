import { test, expect } from '@playwright/test';
import { startCampaign } from './helpers';

/**
 * 城邑地圖的兩道防線 — both of these shipped broken, and the existing
 * cityScene spec was green through all of it: it asserts that the scene
 * *mounts*, and a scene can mount perfectly while drawing nothing at all.
 *
 * 1. 著色器連結 — drei's <SoftShadows> rewrites three's shadowmap chunk with
 *    PCSS that calls `unpackRGBAToDepth(texture2D(shadowMap, uv))`. three
 *    0.184 declares shadow maps as `sampler2DShadow`, so that overload does
 *    not exist, the fragment shader fails to link, and 27 programs died with
 *    it. Entering a city showed an empty sky with the build plots floating in
 *    it — the walls, the ground and every building were simply not drawn.
 *    The assertion is on LINK_STATUS rather than on pixels because a dead
 *    program is unambiguous, where "the picture looks wrong" is not.
 *
 * 2. 背景空轉 — the 城邑地圖 covers the screen, but StrategicMap3D's Canvas
 *    kept rendering behind it at 5,019 draw calls a frame, against the city's
 *    own ~4,100. More than half the cost of standing in a city was the world
 *    map redrawing into a buffer nobody could see, and it is why the city view
 *    sat at 25 FPS. The battle screen avoids this by unmounting the map; the
 *    city parks its frameloop instead, so the camera survives the round trip.
 */

const PROBE = `
(function () {
  var s = { bad: 0, total: 0 };
  window.__link = s;
  var ctxs = [];
  window.__ctx = ctxs;
  var gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type) {
    var c = gc.apply(this, arguments);
    if (c && /webgl/.test(String(type)) && !c.__tagged) {
      c.__tagged = true;
      var rec = { draws: 0 };
      ctxs.push(rec);
      var lp = c.linkProgram;
      c.linkProgram = function (p) {
        var r = lp.call(c, p);
        try { s.total++; if (!c.getProgramParameter(p, c.LINK_STATUS)) s.bad++; } catch (e) {}
        return r;
      };
      ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced'].forEach(function (n) {
        var orig = c[n];
        if (!orig) return;
        c[n] = function () { rec.draws++; return orig.apply(c, arguments); };
      });
    }
    return c;
  };
  var f = { n: 0 };
  window.__frames = f;
  (function loop() { f.n++; requestAnimationFrame(loop); })();
})();
`;

test('the city scene links every shader, and parks the world map behind it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(PROBE);

  await startCampaign(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(3000);

  await page.getByRole('button', { name: /回都|🏯/ }).first().click().catch(() => undefined);
  const enter = page.getByText('進城', { exact: false }).first();
  await expect(enter).toBeVisible({ timeout: 30_000 });
  await enter.click();
  await expect(page.getByRole('button', { name: '離開城內' })).toBeVisible({ timeout: 60_000 });
  // The scene builds its props over several frames; measure once it settles.
  await page.waitForTimeout(8000);

  type Sample = { frames: number; draws: number[] };
  const read = () => page.evaluate((): Sample => ({
    frames: (window as unknown as { __frames: { n: number } }).__frames.n,
    draws: (window as unknown as { __ctx: { draws: number }[] }).__ctx.map((c) => c.draws),
  }));

  /**
   * Sample a fixed number of FRAMES, not a fixed number of seconds.
   *
   * The first cut waited 3s and asserted 20 frames had passed, which is a
   * statement about how fast the machine is, not about the build: five
   * Playwright workers sharing one SwiftShader box drop under 7 FPS and the
   * spec went red on a perfectly good bundle. Waiting for the frames to
   * arrive measures the same per-frame ratios on any machine.
   */
  const sampleFrames = async (want: number, budgetMs = 30_000): Promise<{ frames: number; before: Sample; after: Sample }> => {
    const before = await read();
    const deadline = Date.now() + budgetMs;
    let after = before;
    while (Date.now() < deadline) {
      await page.waitForTimeout(500);
      after = await read();
      if (after.frames - before.frames >= want) break;
    }
    return { frames: after.frames - before.frames, before, after };
  };

  const { frames, before, after } = await sampleFrames(20);
  expect(frames, '城內一幀都沒畫 —— 場景根本沒在跑').toBeGreaterThan(0);

  const link = await page.evaluate(() => ({ ...(window as unknown as { __link: Record<string, number> }).__link }));
  expect(
    link.bad,
    `${link.bad}/${link.total} 個著色器程式連結失敗 —— 城內會有整批物件畫不出來` +
    `(上一次是 drei SoftShadows 撞上 three 的 sampler2DShadow)`,
  ).toBe(0);

  // Canvas #0 is the world map (created first, at campaign start); anything
  // after it belongs to the city. The map's share must be flat zero.
  const mapPerFrame = Math.round(((after.draws[0] ?? 0) - (before.draws[0] ?? 0)) / frames);
  const cityPerFrame = Math.round(((after.draws[1] ?? 0) - (before.draws[1] ?? 0)) / frames);
  console.log(`城內每幀 draw call — 大地圖 ${mapPerFrame}(應為 0),城邑 ${cityPerFrame}`);

  expect(
    mapPerFrame,
    `大地圖在城景後面每幀還畫 ${mapPerFrame} 次 —— frameloop 沒有停`,
  ).toBe(0);
  expect(cityPerFrame, '城邑地圖沒有在畫 —— 進城後是空的').toBeGreaterThan(100);

  // 靜態合批的守門 — StaticBatch 把 ~2,500 個標記 mesh 摺成 ~28 個 draw,實測
  // 城內 4,144 → 1,598/幀。合批**設計上**靜默降級(merge 失敗就回退原樣,畫面
  // 不會壞),所以必須有數字鎖著,否則它哪天壞了沒有任何測試會叫。上限 3,500
  // 給足環境浮動(並行 worker 會觸發 FrameRateWatch 降級,單跑不會 —— 見
  // mapDrawCalls.spec 的教訓),但擋得住「合批整個沒生效」的 4,144。
  expect(cityPerFrame, `城內每幀 ${cityPerFrame} 次 draw call —— 靜態合批(StaticBatch)大概失效了`).toBeLessThan(3500);

  // 出城要復原 — parking is only safe if it un-parks.
  await page.getByRole('button', { name: '離開城內' }).click();
  await expect(page.getByRole('button', { name: '離開城內' })).toBeHidden({ timeout: 20_000 });
  await page.waitForTimeout(2000);
  const back = await sampleFrames(20);
  expect(back.frames, '出城後一幀都沒畫').toBeGreaterThan(0);
  const mapBack = Math.round(((back.after.draws[0] ?? 0) - (back.before.draws[0] ?? 0)) / back.frames);
  expect(mapBack, '出城後大地圖沒有恢復繪製 —— 玩家會卡在一張凍結的地圖上').toBeGreaterThan(100);
});
