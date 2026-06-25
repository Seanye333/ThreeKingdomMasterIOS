/**
 * 名品圖鑑 — the treasures' album, the item-side twin of the 武將圖鑑.
 *
 * One ledger persists in localStorage across campaigns:
 *  - carried 藏 — an item one of your officers has equipped, however briefly.
 *
 * Famous sets (神兵譜, 寶馬譜…) complete when every member has been in your
 * armoury at some point. Like the officer codex, it never resets.
 */
import type { EntityId } from '../types';

const ITEM_CODEX_KEY = 'tkm-item-codex-v1';

export interface ItemCodex {
  carried: string[];
}

export function loadItemCodex(): ItemCodex {
  try {
    const raw = localStorage.getItem(ITEM_CODEX_KEY);
    if (!raw) return { carried: [] };
    const p = JSON.parse(raw) as Partial<ItemCodex>;
    return { carried: Array.isArray(p.carried) ? p.carried : [] };
  } catch {
    return { carried: [] };
  }
}

function save(c: ItemCodex): void {
  try {
    localStorage.setItem(ITEM_CODEX_KEY, JSON.stringify(c));
  } catch { /* quota — the album can wait */ }
}

export function itemCodexMarkCarried(id: EntityId): void {
  const c = loadItemCodex();
  if (c.carried.includes(id)) return;
  save({ carried: [...c.carried, id] });
}

export function itemCodexMarkCarriedMany(ids: Iterable<EntityId>): void {
  const c = loadItemCodex();
  const set = new Set(c.carried);
  let changed = false;
  for (const id of ids) {
    if (!set.has(id)) { set.add(id); changed = true; }
  }
  if (changed) save({ carried: [...set] });
}

/* ─── 成套 — the famous treasures ─── */
export const ITEM_CODEX_SETS: Array<{ id: string; zh: string; en: string; members: string[] }> = [
  // 神兵譜 — the legendary arms of the Three Kingdoms.
  { id: 'divine-arms', zh: '神兵譜', en: 'Legendary Arms', members: ['green-dragon', 'sky-piercer', 'snake-spear', 'twin-swords', 'gu-ding', 'seven-star', 'yitian'] },
  // 寶馬譜 — the famous war-horses.
  { id: 'famous-steeds', zh: '寶馬譜', en: 'Famous Steeds', members: ['red-hare', 'dilu', 'jue-ying', 'zhuahuang-feidian', 'dawan'] },
];

/** How many of a set have ever entered your armoury. */
export function itemCodexSetProgress(codex: ItemCodex, setId: string): { have: number; total: number } {
  const def = ITEM_CODEX_SETS.find((s) => s.id === setId);
  if (!def) return { have: 0, total: 0 };
  const have = new Set(codex.carried);
  return { have: def.members.filter((m) => have.has(m)).length, total: def.members.length };
}
