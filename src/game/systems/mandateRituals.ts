import type { City, EntityId, Officer } from '../types';
import type { WeatherKind } from './weather';

/**
 * §8.5 祭天禮 — the first ACTIVE mandate levers. Until now 天命 only moved by
 * omen and event; these let a court spend treasure to bend it.
 *
 *  郊祀 — the great suburban sacrifice. Once a year, gold + grain buy a real
 *    mandate bump; holding the Son of Heaven makes the rite ring louder
 *    (奉天子以祭天). At 95+ the rite is empty theater — Heaven already smiles.
 *  祈雨 — in a drought season, a rain-prayer led by your best civil mind may
 *    break the drought outright (the weather flips to rain), delighting the
 *    realm. Fail, and the silver is spent and the sky stays brass.
 *
 * Pure math; the store applies deltas and swaps the weather.
 */

export const SUBURBAN_RITE_GOLD = 800;
export const SUBURBAN_RITE_FOOD = 500;
export const RAIN_RITE_GOLD = 300;

export interface SuburbanRiteResult {
  ok: boolean;
  mandateDelta: number;
  messageZh: string;
}

export function performSuburbanRite(args: {
  mandate: number;
  holdsEmperor: boolean;
  lastRiteYear: number | null;
  year: number;
  rng: () => number;
}): SuburbanRiteResult {
  if (args.lastRiteYear === args.year) {
    return { ok: false, mandateDelta: 0, messageZh: '郊祀歲行一次,今年已畢。' };
  }
  if (args.mandate >= 95) {
    return { ok: false, mandateDelta: 0, messageZh: '天命已極,郊祀不過具文。' };
  }
  const delta = 6 + Math.floor(args.rng() * 5) + (args.holdsEmperor ? 4 : 0);
  return {
    ok: true,
    mandateDelta: delta,
    messageZh: args.holdsEmperor
      ? `奉天子郊祀於南郊,燔柴告天,四方觀禮 — 天命 +${delta}。`
      : `築壇於南郊,燔柴祭天 — 天命 +${delta}。`,
  };
}

export interface RainRiteResult {
  ok: boolean;
  success: boolean;
  mandateDelta: number;
  /** Loyalty bump for every player city when the sky breaks. */
  loyaltyDelta: number;
  messageZh: string;
}

/** 祈雨 — chance rides the presiding officer's POLITICS (禮官之才). */
export function performRainRite(args: {
  weatherKind: WeatherKind;
  presiderPolitics: number;
  rng: () => number;
}): RainRiteResult {
  if (args.weatherKind !== 'drought') {
    return { ok: false, success: false, mandateDelta: 0, loyaltyDelta: 0, messageZh: '非旱之年,無雨可祈。' };
  }
  const chance = Math.min(0.7, 0.35 + args.presiderPolitics / 400);
  if (args.rng() < chance) {
    return {
      ok: true,
      success: true,
      mandateDelta: 3,
      loyaltyDelta: 4,
      messageZh: '築壇祈雨,三日而甘霖大澍!旱象頓解,萬民稱頌 — 天命 +3。',
    };
  }
  return {
    ok: true,
    success: false,
    mandateDelta: 0,
    loyaltyDelta: 0,
    messageZh: '祭壇三禱而天不雨,禮官惶恐 — 金帛虛擲,旱魃如故。',
  };
}

/** Pick the realm's best rite-presider (highest politics). */
export function bestRitePresider(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
): Officer | null {
  let best: Officer | null = null;
  for (const o of Object.values(officers)) {
    if (o.forceId !== forceId || o.status === 'dead' || o.status === 'imprisoned') continue;
    if (!best || o.stats.politics > best.stats.politics) best = o;
  }
  return best;
}

/** Sum a force's ready gold/food across its cities (rites draw on the realm,
 *  not one granary). Returns the capital first so costs deduct there. */
export function forceTreasury(
  cities: Record<EntityId, City>,
  forceId: EntityId,
): { gold: number; food: number } {
  let gold = 0;
  let food = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId) continue;
    gold += c.gold;
    food += c.food;
  }
  return { gold, food };
}
