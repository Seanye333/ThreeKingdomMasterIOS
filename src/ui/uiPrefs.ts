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
 *  - hideNav      : 沉浸模式 — collapse the top bar so only the map shows
 *                   (great on a landscape phone). Remembered.
 *  - hideDock     : 沉浸模式 — collapse the phone bottom thumb dock on its own.
 *  - hideSidePanel: 沉浸模式 — slide the city side panel away for a wider map.
 *  - autoHideChrome: 沉浸模式 — after a few idle seconds, fade the bar/dock/panel
 *                   away on their own; a tap on the map brings them back.
 */

export type UiScale = 'sm' | 'md' | 'lg' | 'xl';

export interface UiPrefs {
  reduceMotion: boolean;
  uiScale: UiScale;
  gore: boolean;
  hideNav: boolean;
  hideDock: boolean;
  hideSidePanel: boolean;
  autoHideChrome: boolean;
}

const DEFAULTS: UiPrefs = {
  reduceMotion: false, uiScale: 'md', gore: true,
  hideNav: false, hideDock: false, hideSidePanel: false, autoHideChrome: false,
};
const SCALE_PX: Record<UiScale, string> = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
const STORAGE_KEY = 'tkm-ui-prefs';

export function getStoredUiPrefs(): UiPrefs {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      reduceMotion: typeof p.reduceMotion === 'boolean' ? p.reduceMotion : DEFAULTS.reduceMotion,
      uiScale: p.uiScale === 'sm' || p.uiScale === 'lg' || p.uiScale === 'xl' ? p.uiScale : 'md',
      gore: typeof p.gore === 'boolean' ? p.gore : DEFAULTS.gore,
      hideNav: typeof p.hideNav === 'boolean' ? p.hideNav : DEFAULTS.hideNav,
      hideDock: typeof p.hideDock === 'boolean' ? p.hideDock : DEFAULTS.hideDock,
      hideSidePanel: typeof p.hideSidePanel === 'boolean' ? p.hideSidePanel : DEFAULTS.hideSidePanel,
      autoHideChrome: typeof p.autoHideChrome === 'boolean' ? p.autoHideChrome : DEFAULTS.autoHideChrome,
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

/** Merge a partial update into the stored prefs, persist, and return the result. */
export function patchUiPrefs(patch: Partial<UiPrefs>): UiPrefs {
  const next: UiPrefs = { ...getStoredUiPrefs(), ...patch };
  applyUiPrefs(next);
  return next;
}

/** Live read for non-React code (e.g. the WAAPI screen-shake) to honour the toggle. */
export function isReduceMotion(): boolean {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-tkm-reduce-motion') === '1';
  }
  return false;
}
