import type { EntityId, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';

/**
 * 威名 (Prestige) — a reputation "class" an officer earns from their talents and
 * record, separate from civic rank. It confers passive perks: martial prestige
 * sharpens single combat and battlefield power; civil prestige fattens a city's
 * coffers. (RTK13's command-changing / private-force layer belongs with the
 * officer-career RPG and is deliberately left out here.)
 */
export type PrestigePath = 'military' | 'strategist' | 'official' | 'merchant';

export interface PrestigeEffects {
  duelBonus: number;      // flat prowess added in single combat
  combatPowerMul: number; // multiplier on the officer's battle power
  incomeMul: number;      // multiplier on their city's gold income
}

export interface PrestigeTitle {
  id: string;
  name: { zh: string; en: string };
  path: PrestigePath;
  effects: PrestigeEffects;
  qualifies: (o: Officer, deeds?: HeroicDeeds) => boolean;
}

const eff = (over: Partial<PrestigeEffects>): PrestigeEffects =>
  ({ duelBonus: 0, combatPowerMul: 1, incomeMul: 1, ...over });

/**
 * Each title has an INNATE bar (raw talent alone) and a lower EARNED bar that
 * a merely-strong officer clears once their record of deeds proves them. This
 * is what lets 威名 grow with play — a war-86 captain rises to 虎將 after
 * enough duels won or enemies slain, not only the war-90 prodigies.
 */
export const REQ: Record<string, { zh: string; en: string }> = {
  'tiger-general':  { zh: '武 ≥ 90,或 武 ≥ 85 且(一騎討勝 ≥ 10 或 殲敵 ≥ 80000)', en: 'War ≥ 90, or War ≥ 85 with 10 duels won / 80k slain' },
  'royal-aide':     { zh: '智 ≥ 92,或 智 ≥ 88 且 謀略成功 ≥ 6', en: 'Int ≥ 92, or Int ≥ 88 with 6 schemes' },
  'able-minister':  { zh: '政 ≥ 88,或 政 ≥ 82 且 內政功 ≥ 20', en: 'Pol ≥ 88, or Pol ≥ 82 with 20 civic works' },
  'famed-general':  { zh: '武 ≥ 84 且 勝戰 ≥ 8', en: 'War ≥ 84 with 8 battles won' },
  'fierce-general': { zh: '武 ≥ 82,或 武 ≥ 78 且 一騎討勝 ≥ 5', en: 'War ≥ 82, or War ≥ 78 with 5 duels won' },
  'strategist':     { zh: '智 ≥ 85,或 智 ≥ 80 且 謀略成功 ≥ 3', en: 'Int ≥ 85, or Int ≥ 80 with 3 schemes' },
  'steward':        { zh: '政 ≥ 80,或 政 ≥ 74 且 內政功 ≥ 10', en: 'Pol ≥ 80, or Pol ≥ 74 with 10 civic works' },
  'great-merchant': { zh: '政 ≥ 72 且 魅 ≥ 75', en: 'Pol ≥ 72 and Cha ≥ 75' },
};

// Priority order — the FIRST title an officer qualifies for is their prestige,
// so the most impressive titles are listed first.
export const PRESTIGE_TITLES: PrestigeTitle[] = [
  { id: 'tiger-general', name: { zh: '虎將', en: 'Tiger General' }, path: 'military',
    effects: eff({ duelBonus: 12, combatPowerMul: 1.08 }),
    qualifies: (o, d) => o.stats.war >= 90 || (o.stats.war >= 85 && ((d?.duelsWon ?? 0) >= 10 || (d?.killsTroops ?? 0) >= 80000)) },
  { id: 'royal-aide', name: { zh: '王佐之才', en: 'Royal Aide' }, path: 'strategist',
    effects: eff({ combatPowerMul: 1.06, incomeMul: 1.06 }),
    qualifies: (o, d) => o.stats.intelligence >= 92 || (o.stats.intelligence >= 88 && (d?.espionageSuccess ?? 0) >= 6) },
  { id: 'able-minister', name: { zh: '能臣', en: 'Able Minister' }, path: 'official',
    effects: eff({ incomeMul: 1.15 }),
    qualifies: (o, d) => o.stats.politics >= 88 || (o.stats.politics >= 82 && (d?.civicWorks ?? 0) >= 20) },
  { id: 'famed-general', name: { zh: '名將', en: 'Famed General' }, path: 'military',
    effects: eff({ duelBonus: 9, combatPowerMul: 1.05 }),
    qualifies: (o, d) => o.stats.war >= 84 && (d?.battlesWon ?? 0) >= 8 },
  { id: 'fierce-general', name: { zh: '猛將', en: 'Fierce General' }, path: 'military',
    effects: eff({ duelBonus: 7, combatPowerMul: 1.04 }),
    qualifies: (o, d) => o.stats.war >= 82 || (o.stats.war >= 78 && (d?.duelsWon ?? 0) >= 5) },
  { id: 'strategist', name: { zh: '軍師', en: 'Strategist' }, path: 'strategist',
    effects: eff({ combatPowerMul: 1.03, incomeMul: 1.03 }),
    qualifies: (o, d) => o.stats.intelligence >= 85 || (o.stats.intelligence >= 80 && (d?.espionageSuccess ?? 0) >= 3) },
  { id: 'steward', name: { zh: '良吏', en: 'Steward' }, path: 'official',
    effects: eff({ incomeMul: 1.07 }),
    qualifies: (o, d) => o.stats.politics >= 80 || (o.stats.politics >= 74 && (d?.civicWorks ?? 0) >= 10) },
  { id: 'great-merchant', name: { zh: '巨賈', en: 'Great Merchant' }, path: 'merchant',
    effects: eff({ incomeMul: 1.10 }), qualifies: (o) => o.stats.politics >= 72 && o.stats.charisma >= 75 },
];

const TITLE_BY_ID: Record<string, PrestigeTitle> = Object.fromEntries(
  PRESTIGE_TITLES.map((t) => [t.id, t]),
);

/** The most prestigious tier — a rise to one of these is ceremony-worthy. */
export const TOP_PRESTIGE_IDS = ['tiger-general', 'royal-aide', 'able-minister', 'famed-general'];

/** The single most prestigious title an officer holds, or null. */
export function bestPrestige(o: Officer, deeds?: HeroicDeeds): PrestigeTitle | null {
  for (const title of PRESTIGE_TITLES) if (title.qualifies(o, deeds)) return title;
  return null;
}

export function prestigeTitleById(id: string | undefined | null): PrestigeTitle | null {
  return id ? TITLE_BY_ID[id] ?? null : null;
}

const NO_EFFECTS = eff({});
/** An officer's prestige effects (neutral defaults when they hold no title). */
export function prestigeEffects(o: Officer | undefined, deeds?: HeroicDeeds): PrestigeEffects {
  if (!o) return NO_EFFECTS;
  return bestPrestige(o, deeds)?.effects ?? NO_EFFECTS;
}

/** Effects from a cached title id (no deeds lookup needed). */
export function prestigeEffectsFromId(id: string | undefined | null): PrestigeEffects {
  return prestigeTitleById(id)?.effects ?? NO_EFFECTS;
}

/**
 * Effects for an officer, preferring the deeds-aware title cached on the
 * officer (`prestigeTitleId`, refreshed each season) and falling back to the
 * innate-only computation before the first season tick. This is what combat /
 * duel / economy read so earned titles take effect without threading deeds.
 */
export function effectivePrestigeEffects(o: Officer | undefined): PrestigeEffects {
  if (!o) return NO_EFFECTS;
  const id = o.prestigeTitleId ?? bestPrestige(o)?.id;
  return prestigeEffectsFromId(id);
}

/** The officer's current title, preferring the cached deeds-aware id. */
export function effectivePrestige(o: Officer | undefined): PrestigeTitle | null {
  if (!o) return null;
  return prestigeTitleById(o.prestigeTitleId) ?? bestPrestige(o);
}

const RANK_OF: Record<string, number> = Object.fromEntries(
  PRESTIGE_TITLES.map((t, i) => [t.id, i]),
);

export interface PrestigeAward {
  officerId: EntityId;
  titleId: string;
}

/**
 * Recompute every officer's cached prestige title from current stats + deeds,
 * returning the updated officer map plus the list of officers who newly rose
 * to a title (first attainment or a promotion to a more prestigious one) — the
 * caller turns those into a report entry + toast. Pure.
 */
export function refreshPrestige(
  officers: Record<EntityId, Officer>,
  deeds: Record<EntityId, HeroicDeeds>,
): { officers: Record<EntityId, Officer>; awards: PrestigeAward[] } {
  const next: Record<EntityId, Officer> = {};
  const awards: PrestigeAward[] = [];
  for (const [id, o] of Object.entries(officers)) {
    // Skip the dead and any malformed officer missing its stat block — a single
    // bad entry must never crash the whole season's prestige pass.
    if (o.status === 'dead' || !o.stats) { next[id] = o; continue; }
    const title = bestPrestige(o, deeds[id]);
    const newId = title?.id;
    if (newId !== o.prestigeTitleId) {
      next[id] = { ...o, prestigeTitleId: newId };
      // Fanfare only on a rise: first title, or a more prestigious one
      // (lower index = higher rank). Demotions update silently.
      const oldRank = o.prestigeTitleId ? RANK_OF[o.prestigeTitleId] ?? 99 : 99;
      const newRank = newId ? RANK_OF[newId] ?? 99 : 99;
      if (newId && newRank < oldRank) awards.push({ officerId: id, titleId: newId });
    } else {
      next[id] = o;
    }
  }
  return { officers: next, awards };
}
