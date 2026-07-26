import { test, expect } from '@playwright/test';

/**
 * WebGL 上下文丟失恢復 — the guard that keeps a dropped GL context from
 * leaving a permanently black scene.
 *
 * Under memory pressure iOS WKWebView drops the context and sometimes never
 * fires 'webglcontextrestored'. three.js alone cannot recover from that: the
 * canvas just stays black until the app is killed. useGLRecovery remounts the
 * <Canvas> with a fresh context after a grace window.
 *
 * This forces the exact failure with WEBGL_lose_context and asserts the map
 * comes back — the one bug class that is invisible to unit tests and
 * catastrophic in the player's hands.
 */
test('the world map recovers from a lost WebGL context', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('pageerror', (err) => { throw new Error(`page crashed: ${err.message}`); });

  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await next1.click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.locator('ul li button').first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible()) {
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

  // Kill the context the way the OS would, and never restore it.
  const lost = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no-canvas';
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return 'no-gl';
    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    if (!ext) return 'no-ext';
    ext.loseContext();
    return 'lost';
  });
  // SwiftShader exposes the extension; if a runner ever doesn't, don't fail
  // the suite over an environment gap — the guard is still compiled in.
  test.skip(lost !== 'lost', `cannot force context loss here (${lost})`);

  // The grace window is 1.8s; allow for the remount and a first paint after.
  await expect
    .poll(() => warnings.some((w) => w.includes('WebGL context not restored')), { timeout: 15_000 })
    .toBe(true);

  // A live canvas is back and the app is still interactive.
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => {
    const box = await canvas.boundingBox();
    return box ? box.width > 0 && box.height > 0 : false;
  }, { timeout: 10_000 }).toBe(true);
  await expect(page.getByText('武將', { exact: false }).first()).toBeVisible();
});
