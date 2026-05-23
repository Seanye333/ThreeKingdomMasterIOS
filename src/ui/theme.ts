/**
 * UI theme — chooses which `--tkm-*` palette is active on <html>.
 * Persisted in localStorage so it survives reloads.
 */

export type ThemeId = 'parchment' | 'ink' | 'vermilion' | 'bamboo' | 'moonlight';

export const THEMES: Array<{
  id: ThemeId;
  zh: string;
  en: string;
  /** Small palette swatch [bg, accent, text] */
  swatch: [string, string, string];
}> = [
  { id: 'parchment', zh: '古樸棕', en: 'Parchment',  swatch: ['#1a1410', '#d4a84a', '#c9b89a'] },
  { id: 'ink',       zh: '靑墨',   en: 'Ink Wash',   swatch: ['#0e1419', '#88c8e8', '#a8c0d0'] },
  { id: 'vermilion', zh: '赤焰',   en: 'Vermilion',  swatch: ['#1a0c0c', '#e8a060', '#d4a888'] },
  { id: 'bamboo',    zh: '竹林',   en: 'Bamboo',     swatch: ['#0e160e', '#b8d878', '#a8c098'] },
  { id: 'moonlight', zh: '月華',   en: 'Moonlight',  swatch: ['#14141a', '#c0a8e0', '#b8b8c8'] },
];

const STORAGE_KEY = 'tkm-theme';

export function getStoredTheme(): ThemeId {
  if (typeof localStorage === 'undefined') return 'parchment';
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && THEMES.some((t) => t.id === v)) return v as ThemeId;
  return 'parchment';
}

export function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* localStorage may be unavailable */
  }
}

export function nextTheme(current: ThemeId): ThemeId {
  const idx = THEMES.findIndex((t) => t.id === current);
  return THEMES[(idx + 1) % THEMES.length].id;
}
