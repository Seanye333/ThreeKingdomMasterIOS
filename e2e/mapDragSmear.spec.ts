import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * 重現「拖曳大地圖時畫面一層層疊上去」的回報(2026-08-03)。
 *
 * 必須 headed —— SwiftShader 下大地圖的後處理與陰影都不是真的在跑,而這正是
 * 嫌疑最大的兩層。截圖一律給短超時(視窗被蓋住時 rAF 會停,screenshot 等不到
 * 穩定影格會一路等到逾時)。
 */
const SHOTS = `e2e/__playtest__/drag${process.env.TKM_GFX ? '-' + process.env.TKM_GFX : ''}${process.env.TKM_TAG ? '-' + process.env.TKM_TAG : ''}`;

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 8000 }).catch(() => {});
}

test('拖曳大地圖不該留下殘影', async ({ page }) => {
  test.setTimeout(300_000);
  mkdirSync(SHOTS, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // WebGL 的抱怨多半只出現在 console(warning 等級),不會變成 pageerror。
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') errors.push(`${t}: ${m.text().slice(0, 300)}`);
  });

  // 執行期二分:TKM_GFX=low 走無後處理/無陰影的低畫質管線。
  // 用字串而非函式 —— addInitScript 傳函式會被 tsx 的 __name 注入弄壞(舊坑)。
  if (process.env.TKM_GFX) {
    await page.addInitScript({ content: `localStorage.setItem('tkm-render-quality', '${process.env.TKM_GFX}')` });
  }
  if (process.env.TKM_GFXFLAGS) {
    await page.addInitScript({ content: `localStorage.setItem('tkm-gfx', '${process.env.TKM_GFXFLAGS}')` });
  }
  await page.goto('/');
  const next1 = page.getByText('下一步：選擇勢力', { exact: false });
  await expect(next1).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /黃巾之亂/ }).first().click();
  await next1.click();
  await expect(page.getByText('君主選擇', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /漢室|盧植/ }).first().click();
  await page.getByText('下一步：開局設定', { exact: false }).click();
  await page.getByText('▶ 開始遊戲', { exact: false }).click();

  const prologue = page.getByRole('dialog', { name: '序章' });
  await prologue.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
  if (await prologue.isVisible().catch(() => false)) {
    await prologue.getByRole('button', { name: '入局' }).click();
    await expect(prologue).toBeHidden({ timeout: 10_000 });
  }
  // 過場與教學讓開,免得蓋住地圖
  await page.evaluate(() => {
    const s = (window as unknown as { __tkm?: { getState: () => Record<string, unknown> } }).__tkm;
    const st = s?.getState() as { dismissPopup?: () => void; setTutorialStep?: (n: null) => void } | undefined;
    for (let i = 0; i < 8; i++) st?.dismissPopup?.();
    st?.setTutorialStep?.(null);
  });

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const measure = () => page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return -1;
    const W = 256, H = 256;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const ctx = off.getContext('2d')!;
    ctx.drawImage(c, Math.round(c.width * 0.1), Math.round(c.height * 0.55),
                  Math.round(c.width * 0.6), Math.round(c.height * 0.4), 0, 0, W, H);
    const d = ctx.getImageData(0, 0, W, H).data;
    let acc = 0, n = 0;
    for (let y = 1; y < H; y++) {
      for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4, j = ((y - 1) * W + x) * 4;
        acc += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
        n++;
      }
    }
    return +(acc / n).toFixed(2);
  });
  const before0 = await measure();
  await shot(page, '00-before');

  const probe = async (tag: string) => {
    const r = await page.evaluate(() => {
      const c = document.querySelector('canvas') as (HTMLCanvasElement & { __r3f?: { root?: { getState?: () => Record<string, unknown> } } }) | null;
      const st = c?.__r3f?.root?.getState?.() as {
        gl?: { autoClear?: boolean; getPixelRatio?: () => number; domElement?: HTMLCanvasElement; info?: { render?: { calls?: number; triangles?: number } } };
        camera?: { position?: { x: number; y: number; z: number } };
        size?: { width: number; height: number };
        controls?: { target?: { x: number; y: number; z: number } };
      } | undefined;
      if (!c) return 'no canvas';
      if (!st) return `no r3f state; buffer=${c.width}x${c.height} css=${c.clientWidth}x${c.clientHeight}`;
      const p = st.camera?.position, t = st.controls?.target;
      return {
        buffer: `${c.width}x${c.height}`, css: `${c.clientWidth}x${c.clientHeight}`,
        r3fSize: st.size ? `${Math.round(st.size.width)}x${Math.round(st.size.height)}` : '?',
        dpr: st.gl?.getPixelRatio?.(), autoClear: st.gl?.autoClear,
        cam: p ? `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}` : '?',
        target: t ? `${t.x.toFixed(0)},${t.y.toFixed(0)},${t.z.toFixed(0)}` : '?',
        calls: st.gl?.info?.render?.calls,
      };
    });
    console.log(tag, JSON.stringify(r));
  };
  await probe('開始前 ');

  const box = (await canvas.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  /* 左鍵拖曳 = 平移(地圖上的提示寫著「左拖平移・右拖旋轉」)。
     分成多小步,模擬真人拖動而不是瞬移。 */
  await page.mouse.move(cx, cy - 120);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(cx, cy - 120 + i * 20, { steps: 2 });
    await page.waitForTimeout(40);
    if (i === 6) await shot(page, '01-mid-drag');
  }
  await shot(page, '02-end-drag');
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await shot(page, '03-after-release');
  await probe('一次拖後');
  const after1 = await measure();

  // 再拖一次,看殘影是否累積
  await page.mouse.move(cx - 200, cy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(cx - 200 + i * 30, cy + i * 12, { steps: 2 });
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await shot(page, '04-after-second-drag');
  await probe('二次拖後');

  // 決定性測試:按「復位」看畫面是否恢復 —— 恢復 = 相機被拖出界,不恢復 = 畫面損毀
  await page.getByRole('button', { name: /復位/ }).click();
  await page.waitForTimeout(1800);
  await shot(page, '05-after-recenter');

  /*
   * 客觀判準 —— 條紋化的畫面在**相鄰列之間**的差異極大,乾淨的地形則平滑。
   * 取地圖下半部一塊,算逐列平均絕對差。眼睛看十二張截圖不是方法,尤其這個
   * bug 是間歇的(基準跑三次有兩次乾淨)。
   * canvas 開了 preserveDrawingBuffer,所以讀得回來。
   */
  const streak = await measure();
  // 把條紋區裁一小塊出來 —— 全屏截圖看不清它究竟是什麼。
  // 條紋度寫進檔名:這個 bug 是間歇的,不然好壞兩跑會互相覆蓋。
  const cb = (await canvas.boundingBox())!;
  await page.screenshot({
    path: `${SHOTS}/06-zoom-${Math.round(streak)}.png`, timeout: 8000,
    clip: { x: cb.x + cb.width * 0.15, y: cb.y + cb.height * 0.62, width: 340, height: 230 },
  }).catch(() => {});
  // 最近鄰放大 8 倍 —— 原生像素的裁切太小,看不出碎塊是什麼。
  // 沿螢幕高度取四塊,看 corruption 是否隨距離(越上面越遠)加劇
  const bands = await page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return null;
    const W = 200, H = 60;
    const out: Array<{ at: string; d: number }> = [];
    for (const f of [0.30, 0.50, 0.70, 0.90]) {
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const ctx = off.getContext('2d')!;
      ctx.drawImage(c, Math.round(c.width * 0.25), Math.round(c.height * f), W, H, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      let acc = 0, n = 0;
      for (let y = 1; y < H; y++) for (let x = 0; x < W; x += 2) {
        const i = (y * W + x) * 4, j = ((y - 1) * W + x) * 4;
        acc += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]);
        n++;
      }
      out.push({ at: `y${Math.round(f * 100)}%`, d: +(acc / n).toFixed(1) });
    }
    return out;
  });
  console.log('  分帶', JSON.stringify(bands));

  // 時間穩定性 —— 相機不動,連拍三張比對。每幀都變 = 雜訊/未初始化;不變 = 幾何/貼圖。
  const sig = () => page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return '';
    const off = document.createElement('canvas');
    off.width = 64; off.height = 64;
    const ctx = off.getContext('2d')!;
    ctx.drawImage(c, Math.round(c.width * 0.3), Math.round(c.height * 0.8), 64, 64, 0, 0, 64, 64);
    const d = ctx.getImageData(0, 0, 64, 64).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) >>> 0;
    return String(h);
  });
  const s1 = await sig(); await page.waitForTimeout(400);
  const s2 = await sig(); await page.waitForTimeout(400);
  const s3 = await sig();
  // 強制整幀重畫(改視窗大小 → canvas resize → 全清全畫)。
  // 若 corruption 是「舊像素沒被清掉」,這一步就會把它抹掉。
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: vp.width - 40, height: vp.height - 30 });
  await page.waitForTimeout(1200);
  const afterResize = await measure();
  await page.setViewportSize(vp);
  await page.waitForTimeout(1200);
  console.log(`  改尺寸後條紋度 ${afterResize}`);

  console.log('  三幀指紋', s1 === s2 && s2 === s3 ? '相同(靜態)' : `不同(逐幀變)${s1}/${s2}/${s3}`);

  const micro = await page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return null;
    const SW = 96, SH = 64, K = 8;
    const off = document.createElement('canvas');
    off.width = SW * K; off.height = SH * K;
    const ctx = off.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(c.width * 0.28), Math.round(c.height * 0.72), SW, SH,
                  0, 0, SW * K, SH * K);
    return off.toDataURL('image/png');
  });
  if (micro) {
    writeFileSync(`${SHOTS}/07-micro-${Math.round(streak)}.png`,
      Buffer.from(micro.split(',')[1], 'base64'));
  }
  console.log(`條紋度 拖前=${before0} 一拖=${after1} 二拖=${streak}  (gfx=${process.env.TKM_GFX ?? 'default'} flags=${process.env.TKM_GFXFLAGS ?? '-'})`);

  /*
   * 守衛 —— 乾淨的地形逐列差異穩定在 13~16,壞掉時是 55~67,中間沒有灰帶。
   * 門檻取 30,離兩邊都遠。
   */
  // 只在**預設設定**下斷言 —— 查因時會用 TKM_GFXFLAGS 把後處理強制開回來重現。
  if (!process.env.TKM_GFXFLAGS) {
    expect(streak, `拖曳後地圖畫壞了(條紋度 ${streak},乾淨應 <30)—— 見 ${SHOTS}/06-zoom-*.png`)
      .toBeLessThan(30);
  }

  console.log('主控台:', errors.length ? `\n  ${[...new Set(errors)].slice(0, 20).join('\n  ')}` : '(無)');
});
