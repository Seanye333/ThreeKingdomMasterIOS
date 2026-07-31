/**
 * Render-quality tier for the 3D scenes.
 *
 * The scenes were originally a hard binary: desktop = full quality, any
 * touch device = stripped down (no shadows, no bloom, low DPR). Modern
 * iPhones handle the full pipeline fine, so this adds a tier the player can
 * pick — defaulting to an auto-detect that turns the good stuff back on for
 * capable devices.
 *
 * Resolved ONCE at module load (like the old IS_MOBILE constant) so the heavy
 * 3D files just read a boolean. Changing the preference takes effect on the
 * next app launch / reload — see applyRenderQualityPref().
 */

export type RenderQualityPref = 'auto' | 'low' | 'high';

const STORAGE_KEY = 'tkm-render-quality';

const IS_COARSE =
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(pointer: coarse)')?.matches;

/** Best guess for whether this device can afford the full pipeline. */
function autoIsHigh(): boolean {
  if (typeof window === 'undefined') return true;
  if (!IS_COARSE) return true; // desktop / mouse → full quality
  // On touch devices, treat recent phones as capable: a Retina @3x screen or
  // a 6+ core CPU is a good proxy for an A-series iPhone that runs this well.
  const cores = navigator.hardwareConcurrency ?? 2;
  const dpr = window.devicePixelRatio ?? 1;
  return cores >= 6 || dpr >= 3;
}

export function getRenderQualityPref(): RenderQualityPref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'low' || v === 'high' || v === 'auto') return v;
  } catch {
    /* private mode / no storage */
  }
  return 'auto';
}

export function setRenderQualityPref(pref: RenderQualityPref): void {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
}

function resolve(pref: RenderQualityPref): boolean {
  if (pref === 'high') return true;
  if (pref === 'low') return false;
  return autoIsHigh();
}

/**
 * RENDER_HI — true when the high-quality pipeline (shadows, bloom, higher DPR,
 * antialiasing) should run. Frozen at module load; the 3D Canvas configs read
 * this directly.
 */
export const RENDER_HI: boolean = resolve(getRenderQualityPref());

/* ─── 畫質細項 — the tier split into its four real costs ────────────────
 *
 * 流暢/精緻 was a single lever, but the four things it toggles have wildly
 * different price tags (shadow maps ≫ post stack ≫ reflections ≫ particles)
 * and different tastes attached — one player wants 60fps but keeps the rain,
 * another tolerates 40fps if the water gleams. Each cost gets its own
 * auto/on/off pref; `auto` defers to the tier exactly as before, so an
 * untouched install behaves identically to the old binary.
 *
 * Same contract as RENDER_HI: resolved ONCE at module load into `GFX`, heavy
 * files read plain values, changing a pref applies on next launch/reload.
 * (The FrameRateWatch runtime degrade sits on top of — and can only lower —
 * whatever is enabled here.)
 */

export type GfxToggle = 'auto' | 'on' | 'off';
export interface GfxPrefs {
  shadows: GfxToggle;
  postfx: GfxToggle;
  /** Weather particle density — auto | full | reduced. */
  particles: 'auto' | 'full' | 'reduced';
  reflections: GfxToggle;
}
export interface GfxFlags {
  shadows: boolean;
  postfx: boolean;
  /** Multiplier applied to weather particle counts (rain/snow/streaks). */
  particles: number;
  reflections: boolean;
}

const GFX_KEY = 'tkm-gfx';

export function getGfxPrefs(): GfxPrefs {
  const d: GfxPrefs = { shadows: 'auto', postfx: 'auto', particles: 'auto', reflections: 'auto' };
  try {
    const raw = localStorage.getItem(GFX_KEY);
    if (!raw) return d;
    const p = JSON.parse(raw) as Partial<GfxPrefs>;
    return { ...d, ...p };
  } catch {
    return d;
  }
}

export function setGfxPref<K extends keyof GfxPrefs>(key: K, value: GfxPrefs[K]): void {
  try {
    const next = { ...getGfxPrefs(), [key]: value };
    localStorage.setItem(GFX_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function resolveGfx(p: GfxPrefs, hi: boolean): GfxFlags {
  const onOff = (v: GfxToggle, auto: boolean) => (v === 'auto' ? auto : v === 'on');
  return {
    shadows: onOff(p.shadows, hi),
    postfx: onOff(p.postfx, hi),
    particles: p.particles === 'auto' ? (hi ? 1 : 0.35) : p.particles === 'full' ? 1 : 0.35,
    /*
     * ⚠ 水面鏡面與大地圖的後處理**互斥**,而且目前刻意維持「鏡面優先」。
     *
     * 大地圖唯一的鏡面是海面的 drei `<MeshReflectorMaterial>`,它每幀自己
     * 呼叫 `renderer.render()`。實測(2026-07-30,headed 真 GPU):只要它
     * 掛著,`<EffectComposer>` 的輸出**整片不會出現在畫面上** —— 在最後一個
     * pass 之後把預設 framebuffer 清成紅色都蓋不掉;把反射關掉,同一份程式
     * 立刻整片變紅。也就是說這張圖的 Bloom / AgX 色調映射 / 四時之色 / 暗角 /
     * SMAA **從來沒有真正顯示過**,這正是「往大地圖加任何後處理都沒反應」的
     * 原因(效果有掛上、shader 有進 pass、update() 有跑,就是不上畫面)。
     *
     * 那為什麼不乾脆把鏡面關掉、把整個後處理棧換回來?因為**換回來會露出另一
     * 個瑕疵**:後處理一旦可見,地圖上會出現成片純黑的六角格。已逐項排除
     * N8AO(關掉仍在)、陰影(關掉仍在)、戰霧疊層(關掉仍在),成因未明。
     * 在查清楚之前,寧可維持玩家現在看到的畫面,也不要為了換上分級而讓地圖
     * 冒黑格 —— 所以 auto 維持原本的行為(桌機開鏡面)。
     *
     * 城內與戰場沒有鏡面,它們的後處理一直是正常的。
     */
    reflections: onOff(p.reflections, hi && !IS_COARSE),
  };
}

/** Frozen at module load, like RENDER_HI. */
export const GFX: GfxFlags = resolveGfx(getGfxPrefs(), RENDER_HI);

/* ─── 畫風 — 寫實 / 絹本設色 ────────────────────────────────────────────
 *
 * Unlike the cost prefs above this one is NOT frozen at load: it changes how
 * the game looks, not what it costs, and asking for a relaunch to preview a
 * filter would be silly. The 3D screens read it through `useArtStyle()`.
 */
export type ArtStyle = 'realistic' | 'silk';
const ART_KEY = 'tkm-art-style';
const artListeners = new Set<(s: ArtStyle) => void>();
let artStyle: ArtStyle = (() => {
  try { return localStorage.getItem(ART_KEY) === 'silk' ? 'silk' : 'realistic'; } catch { return 'realistic'; }
})();

export function getArtStyle(): ArtStyle { return artStyle; }
export function setArtStyle(v: ArtStyle): void {
  if (v === artStyle) return;
  artStyle = v;
  try { localStorage.setItem(ART_KEY, v); } catch { /* ignore */ }
  artListeners.forEach((fn) => fn(v));
}
export function subscribeArtStyle(fn: (s: ArtStyle) => void): () => void {
  artListeners.add(fn);
  return () => { artListeners.delete(fn); };
}
