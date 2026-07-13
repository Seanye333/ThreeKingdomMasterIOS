import { loadAchievementProgress } from '../../game/systems/achievements';

/**
 * 卡框皮膚 — cosmetic card-frame styles unlocked by cross-campaign
 * achievements and picked in the codex tab. Pure chrome: an accent ring +
 * corner glyphs layered over the grade frame, zero mechanics.
 */
export interface FrameSkin {
  id: string;
  zh: string;
  en: string;
  /** Achievement id gating it; undefined = always available. */
  requires?: string;
  /** Ring + glyph colour, and the corner glyph itself. */
  color: string;
  glyph: string;
}

export const FRAME_SKINS: FrameSkin[] = [
  { id: 'default', zh: '素框', en: 'Plain', color: '', glyph: '' },
  { id: 'dragon', zh: '龍紋', en: 'Dragon', requires: 'ach-codex-all-sets', color: '#7ec8c0', glyph: '龍' },
  { id: 'tiger', zh: '虎紋', en: 'Tiger', requires: 'ach-codex-five-tigers', color: '#e8a040', glyph: '虎' },
  { id: 'stars', zh: '將星', en: 'Star-field', requires: 'ach-codex-300', color: '#b7a8ff', glyph: '星' },
];

const KEY = 'tkm-card-frame';

export function loadFrameSkin(): FrameSkin {
  try {
    const id = localStorage.getItem(KEY) ?? 'default';
    const skin = FRAME_SKINS.find((s) => s.id === id);
    if (skin && (!skin.requires || loadAchievementProgress().completed[skin.requires])) return skin;
  } catch { /* headless */ }
  return FRAME_SKINS[0];
}

export function saveFrameSkin(id: string): void {
  try { localStorage.setItem(KEY, id); } catch { /* quota */ }
}

export function unlockedFrameSkins(): FrameSkin[] {
  const done = loadAchievementProgress().completed;
  return FRAME_SKINS.filter((s) => !s.requires || done[s.requires]);
}
