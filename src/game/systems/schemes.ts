/**
 * 大局計略 — the named schemes that move FORCES, not officers (officer-
 * level 離間 already lives in espionage):
 *
 *  驅虎吞狼 — goad force A into war with force B: their relation craters
 *    and A receives a 討伐 mark against B (+10% combat power toward
 *    them while it lasts). Easiest when they already despise each other.
 *  二虎競食 — set two neighbouring rivals at each other's throats: both
 *    relations drop, both get marks. Costlier, blunter.
 *  遠交近攻 — court the distant power: relations warm with a force that
 *    shares no border with you (distance makes friends cheap).
 *
 * Success rides your best mind. Pure planning here; the store applies.
 */
import type { City, EntityId, Officer } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { getRelation } from '../types/diplomacy';

export type SchemeId = 'tiger-wolf' | 'two-tigers' | 'far-friend';

export interface SchemeDef {
  id: SchemeId;
  zh: string;
  en: string;
  hintZh: string;
  hintEn: string;
  goldCost: number;
  /** Two targets (A vs B) or one (the distant friend). */
  targets: 1 | 2;
}

export const SCHEME_DEFS: SchemeDef[] = [
  { id: 'tiger-wolf', zh: '驅虎吞狼', en: 'Drive the Tiger', hintZh: '挑動甲勢力攻伐乙 — 兩家本有嫌隙則事半功倍', hintEn: 'Goad force A into war with B — easiest when they already despise each other.', goldCost: 600, targets: 2 },
  { id: 'two-tigers', zh: '二虎競食', en: 'Two Tigers, One Prey', hintZh: '使相鄰兩強互啄 — 雙方交惡並互相得討伐之名', hintEn: 'Set two bordering rivals at each other — both sour, both gain a casus belli.', goldCost: 800, targets: 2 },
  { id: 'far-friend', zh: '遠交近攻', en: 'Befriend the Far', hintZh: '結好無接壤之國 — 遠人之好,近敵之憂', hintEn: 'Warm relations with a power that shares no border with you.', goldCost: 300, targets: 1 },
];

/** Do two forces share a border (any adjacent city pair)? */
export function forcesAdjacent(cities: Record<EntityId, City>, a: EntityId, b: EntityId): boolean {
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== a) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      if (cities[adj]?.ownerForceId === b) return true;
    }
  }
  return false;
}

export function schemeOdds(
  scheme: SchemeId,
  diplomacy: DiplomaticState,
  strategist: Officer | null,
  a: EntityId,
  b?: EntityId,
): number {
  const iq = strategist?.stats.intelligence ?? 50;
  if (scheme === 'far-friend') return Math.min(0.95, 0.55 + iq / 300);
  const rel = b ? getRelation(diplomacy, a, b).score : 0;
  // The worse they get along, the easier the push.
  const base = scheme === 'tiger-wolf' ? 0.35 : 0.28;
  return Math.max(0.05, Math.min(0.9, base + iq / 280 - rel / 180));
}

const ZH_EN = {
  self: '不可以己方為目標',
  adjacent: '遠交者不可接壤',
  twoDistinct: '需選兩個不同目標',
  notAdjacent: '兩家無接壤,驅之不動',
};

export function validateScheme(
  scheme: SchemeId,
  cities: Record<EntityId, City>,
  playerForceId: EntityId,
  a: EntityId,
  b?: EntityId,
): string | null {
  if (a === playerForceId || b === playerForceId) return ZH_EN.self;
  if (scheme === 'far-friend') {
    if (forcesAdjacent(cities, playerForceId, a)) return ZH_EN.adjacent;
    return null;
  }
  if (!b || a === b) return ZH_EN.twoDistinct;
  if (!forcesAdjacent(cities, a, b)) return ZH_EN.notAdjacent;
  return null;
}
