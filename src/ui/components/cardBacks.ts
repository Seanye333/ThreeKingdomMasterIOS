import { loadAchievementProgress } from '../../game/systems/achievements';

/**
 * 卡背收藏 — collectible ornamental card backs, the reverse a card shows as it
 * drops and flips in during a 得將/求賢祭/覺醒 reveal. Cosmetic only, chosen in
 * the codex and gated by cross-campaign achievements (same pattern as
 * cardFrames.ts). The default rune back is always available.
 */
export interface CardBack {
  id: string;
  zh: string;
  en: string;
  /** Achievement id gating it; undefined = always available. */
  requires?: string;
  /** The back's field gradient. */
  bg: string;
  /** Border + emblem colour. */
  accent: string;
  /** Large central emblem glyph. */
  glyph: string;
}

export const CARD_BACKS: CardBack[] = [
  { id: 'rune', zh: '符文', en: 'Rune', bg: 'radial-gradient(ellipse at 50% 34%, #1b2531 0%, #0a0e14 80%)', accent: '', glyph: '' },
  { id: 'brocade', zh: '織錦', en: 'Brocade', requires: 'ach-10-recruits', bg: 'repeating-conic-gradient(from 0deg at 50% 50%, #24140c 0deg 12deg, #17100a 12deg 24deg)', accent: '#c88a4e', glyph: '錦' },
  { id: 'cloud-dragon', zh: '雲龍', en: 'Cloud Dragon', requires: 'ach-unify', bg: 'radial-gradient(ellipse at 50% 30%, #14283a 0%, #070d16 82%)', accent: '#6fb0d8', glyph: '龍' },
  { id: 'black-iron', zh: '玄鐵', en: 'Black Iron', requires: 'ach-100-battles', bg: 'linear-gradient(150deg, #1a1e24 0%, #0a0c10 60%, #202630 100%)', accent: '#9aa6b0', glyph: '鐵' },
  { id: 'vermilion', zh: '朱雀', en: 'Vermilion Bird', requires: 'ach-hegemon', bg: 'radial-gradient(ellipse at 50% 32%, #2a1010 0%, #0e0605 82%)', accent: '#e0574a', glyph: '朱' },
  { id: 'imperial-jade', zh: '傳國玉璽', en: 'Imperial Jade', requires: 'ach-emperor', bg: 'radial-gradient(ellipse at 50% 30%, #10241a 0%, #05100a 82%)', accent: '#8fe3b0', glyph: '璽' },
];

const KEY = 'tkm-card-back';

export function loadCardBack(): CardBack {
  try {
    const id = localStorage.getItem(KEY) ?? 'rune';
    const back = CARD_BACKS.find((b) => b.id === id);
    if (back && (!back.requires || loadAchievementProgress().completed[back.requires])) return back;
  } catch { /* headless */ }
  return CARD_BACKS[0];
}

export function saveCardBack(id: string): void {
  try { localStorage.setItem(KEY, id); } catch { /* quota */ }
}

export function unlockedCardBacks(): CardBack[] {
  const done = loadAchievementProgress().completed;
  return CARD_BACKS.filter((b) => !b.requires || done[b.requires]);
}
