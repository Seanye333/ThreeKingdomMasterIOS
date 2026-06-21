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
