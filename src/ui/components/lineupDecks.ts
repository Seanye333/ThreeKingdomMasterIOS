import type { EntityId } from '../../game/types';

/**
 * 出陣卡組 — saved lineup presets (lead + companions), the card game's
 * "deck" applied to real marches. Persisted in localStorage across
 * campaigns; applying one filters to whoever is actually present and idle
 * in the mustering city, so a deck is a wish-list, not a hard bind.
 */
export interface LineupDeck {
  name: string;
  /** ids[0] = the lead; the rest ride as companions. */
  ids: EntityId[];
}

const DECKS_KEY = 'tkm-lineup-decks';
export const MAX_DECKS = 6;

export function loadDecks(): LineupDeck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as LineupDeck[];
    return Array.isArray(p) ? p.filter((d) => d && typeof d.name === 'string' && Array.isArray(d.ids)) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: LineupDeck[]): void {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks.slice(0, MAX_DECKS)));
  } catch { /* quota — decks can wait */ }
}
