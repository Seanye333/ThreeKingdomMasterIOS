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
  // StaticBatch reports its own census on every bake — the only FPS-independent
  // handle on whether batching actually happened (see the assertion below).
  const batchLogs: string[] = [];
  page.on('console', (msg) => { if (msg.text().includes('[StaticBatch]')) batchLogs.push(msg.text()); });

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

  /**
   * 靜態合批的守門 —— 斷言在**合批自己報的數**上,不在每幀 draw call 上。
   *
   * 這條我先寫成 `cityPerFrame < 3500` 然後自己踩了 mapDrawCalls.spec 早就
   * 記過的坑:城內每幀 draw call 會落在兩個相差一倍的穩定值上,取決於
   * FrameRateWatch 有沒有降級 —— 降級時後處理整棧卸掉(~1,600),沒降級時
   * N8AO 還在(~2,300)。而「合批失效 + 已降級」是 4,147,「合批生效 +
   * 未降級」是 2,296:任何單一門檻都同時被兩種狀態橫跨,收緊就是穩定誤報。
   *
   * StaticBatch 的那行 log 沒有這個問題:它報的是「藏了幾個 mesh、產出幾個
   * 合併 draw」,與畫質檔、幀率、降級都無關。合批**設計上**靜默回退(merge
   * 失敗就當沒合過,畫面不壞),所以它壞掉時只有這條會叫。
   */
  const batchLine = batchLogs.at(-1);
  expect(batchLine, 'StaticBatch 一次都沒跑 —— 城內合批沒有掛上去').toBeTruthy();
  const m = /\[StaticBatch\] (\d+) meshes → (\d+) draws/.exec(batchLine!);
  expect(m, `StaticBatch 的量測行格式變了:${batchLine}`).not.toBeNull();
  const [swallowed, mergedDraws] = [Number(m![1]), Number(m![2])];
  console.log(`靜態合批:${swallowed} 個 mesh → ${mergedDraws} 個 draw`);
  expect(swallowed, `合批只吃到 ${swallowed} 個 mesh —— 標記(batchStatic)大概掉了`).toBeGreaterThan(1500);
  expect(mergedDraws, `合批產出 ${mergedDraws} 個 draw —— 材質分組炸開了`).toBeLessThan(60);

  // 粗放的煙霧測試:兩種降級狀態、合批生效時都遠低於此;純粹擋「整個場景
  // 重新變成每個 mesh 一次 draw」這種災難級回歸。
  expect(cityPerFrame, `城內每幀 ${cityPerFrame} 次 draw call —— 遠超任何正常狀態`).toBeLessThan(5000);

  // 出城要復原 — parking is only safe if it un-parks.
  await page.getByRole('button', { name: '離開城內' }).click();
  await expect(page.getByRole('button', { name: '離開城內' })).toBeHidden({ timeout: 20_000 });
  await page.waitForTimeout(2000);
  const back = await sampleFrames(20);
  expect(back.frames, '出城後一幀都沒畫').toBeGreaterThan(0);
  const mapBack = Math.round(((back.after.draws[0] ?? 0) - (back.before.draws[0] ?? 0)) / back.frames);
  expect(mapBack, '出城後大地圖沒有恢復繪製 —— 玩家會卡在一張凍結的地圖上').toBeGreaterThan(100);
});
