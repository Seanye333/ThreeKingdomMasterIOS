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
    reflections: onOff(p.reflections, hi && !IS_COARSE),
  };
}

/** Frozen at module load, like RENDER_HI. */
export const GFX: GfxFlags = resolveGfx(getGfxPrefs(), RENDER_HI);
