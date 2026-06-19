/**
 * Device-level UI / accessibility preferences — kept out of the game store on
 * purpose: these describe the screen in front of you, not the campaign. Mirrors
 * theme.ts: localStorage-backed, applied to <html> so a reload keeps them, and
 * applied before React mounts so there's no flash of the wrong setting.
 *
 *  - reduceMotion : kills the pulsing/flashing CSS FX (blood vignette, threat
 *                   pulse, screen flash, toasts) for motion-sensitive players.
 *  - uiScale      : root font-size, scaling all rem-based text together.
 *  - gore         : hides the on-damage blood vignette for the squeamish.
 */

export type UiScale = 'sm' | 'md' | 'lg';

export interface UiPrefs {
  reduceMotion: boolean;
  uiScale: UiScale;
  gore: boolean;
}

const DEFAULTS: UiPrefs = { reduceMotion: false, uiScale: 'md', gore: true };
const SCALE_PX: Record<UiScale, string> = { sm: '14px', md: '16px', lg: '18px' };
const STORAGE_KEY = 'tkm-ui-prefs';

export function getStoredUiPrefs(): UiPrefs {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      reduceMotion: typeof p.reduceMotion === 'boolean' ? p.reduceMotion : DEFAULTS.reduceMotion,
      uiScale: p.uiScale === 'sm' || p.uiScale === 'lg' ? p.uiScale : 'md',
      gore: typeof p.gore === 'boolean' ? p.gore : DEFAULTS.gore,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyUiPrefs(prefs: UiPrefs): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('data-tkm-reduce-motion', prefs.reduceMotion ? '1' : '0');
  el.setAttribute('data-tkm-gore', prefs.gore ? 'on' : 'off');
  el.style.fontSize = SCALE_PX[prefs.uiScale];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage may be unavailable */
  }
}

/** Live read for non-React code (e.g. the WAAPI screen-shake) to honour the toggle. */
export function isReduceMotion(): boolean {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-tkm-reduce-motion') === '1';
  }
  return false;
}
