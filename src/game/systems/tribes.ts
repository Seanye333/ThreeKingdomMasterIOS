import type {
  City,
  EntityId,
  GameDate,
  Officer,
  ReportEntry,
  Tribe,
  TribeId,
  TribeState,
} from '../types';
import { TRIBES } from '../data/tribes';
import {
  buildTribalFounding,
  FOUNDING_CHANCE,
  FOUNDING_DEFENSE_RATIO,
  FOUNDING_MIN_AGGRESSION,
  HEQIN_BETRAYAL_AGGRESSION,
  type TribalFounding,
  type TribeDiplomacyState,
} from './tribesDiplomacy';

export interface TribeContext {
  state: TribeState;
  cities: Record<EntityId, City>;
  date: GameDate;
  rng: () => number;
  /** §8.3-deep — pacts/incitements/submissions; omit for legacy callers. */
  diplo?: TribeDiplomacyState;
  playerForceId?: EntityId | null;
  /** Needed for 入主建國 (chieftain lookup). Omit → no foundings. */
  officers?: Record<EntityId, Officer>;
}

export interface TribeOutput {
  state: TribeState;
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
  /** 入主建國 — tribes that settled a broken city this season. */
  foundings: TribalFounding[];
  /** 背盟 — marriages the tribe shattered by raiding anyway. */
  brokenMarriages: TribeId[];
  /** 以夷制夷 — incitements consumed/fizzled this season (store decrements). */
  incitementRaids: TribeId[];
}

/**
 * Per-season tribe check. Each tribe with aggression high enough may launch
 * a raid on one of its raidable cities. Raid impact:
 *   - Damages city troops (battle resolves abstractly)
 *   - Loots gold / food
 *   - If city's defenders lose, city loyalty crashes; troops crater
 *   - Tribe aggression drops after a raid (cool-down)
 */
export function resolveTribeRaids(ctx: TribeContext): TribeOutput {
  const cities = { ...ctx.cities };
  const aggression = { ...ctx.state.aggression };
  const lastRaidYear = { ...ctx.state.lastRaidYear };
  const entries: ReportEntry[] = [];
  const foundings: TribalFounding[] = [];
  const brokenMarriages: TribeId[] = [];
  const incitementRaids: TribeId[] = [];
  const diplo = ctx.diplo;

  for (const tribe of TRIBES) {
    // 七擒之服 — a submitted tribe never raids again; its fire is out.
    if (diplo?.submitted[tribe.id]) {
      aggression[tribe.id] = 0.02;
      continue;
    }
    // 入主建國 — a settled tribe fights as a force now, not as raiders.
    if (diplo?.foundedStates[tribe.id]) {
      aggression[tribe.id] = Math.max(0.05, (aggression[tribe.id] ?? tribe.baseAggression) - 0.01);
      continue;
    }

    const ag = aggression[tribe.id] ?? tribe.baseAggression;
    // Aggression drift up over time.
    aggression[tribe.id] = Math.min(1, ag + 0.015);

    const incite = diplo?.incitements[tribe.id];

    const last = lastRaidYear[tribe.id] ?? 0;
    // At most one raid per year per tribe — unless someone is paying them.
    if (!incite && ctx.date.year - last < 1) continue;

    // 以夷制夷 — a bribed tribe rides eagerly (min 55% per season).
    const raidChance = incite ? Math.max(ag, 0.55) : ag;
    const roll = ctx.rng();
    if (roll > raidChance) continue;

    // 和親 — the marriage stays their hand against the player's cities...
    // unless war-fever runs past the betrayal point (背盟).
    const pact = diplo?.pacts[tribe.id];
    const marriageHolds =
      !!pact?.marriageYear && ctx.date.year - pact.marriageYear < 12;

    // Pick a raidable city this tribe still owns/can reach.
    let excludeForceId: EntityId | null = null;
    let onlyForceId: EntityId | null = null;
    if (incite) {
      onlyForceId = incite.targetForceId;
      excludeForceId = incite.byForceId;
    } else if (marriageHolds && ag <= HEQIN_BETRAYAL_AGGRESSION) {
      excludeForceId = ctx.playerForceId ?? null;
    }
    const target = pickTarget(tribe, cities, ctx.rng, { excludeForceId, onlyForceId });
    if (!target) {
      if (incite) incitementRaids.push(tribe.id); // paid but no valid target — fizzles
      continue;
    }
    if (incite) incitementRaids.push(tribe.id);
    // 背盟 — the raid lands on the player's city despite the marriage.
    if (marriageHolds && cities[target]?.ownerForceId === ctx.playerForceId) {
      brokenMarriages.push(tribe.id);
      entries.push({
        cityId: target,
        kind: 'tribe-raid',
        text: `The ${tribe.name.en} break the marriage pact — war fever wins over kinship.`,
        textZh: `${tribe.name.zh}背和親之盟而入寇 — 兵鋒既熾,姻好不能羈也。`,
      });
    }

    const c = cities[target];
    if (!c) continue;

    const raidTroops = Math.floor(
      (1500 + ctx.rng() * 4500) * tribe.strengthMul,
    );
    const defenseTroops = c.troops;

    // Simple resolution: defender wins if defender > raidTroops × 0.7, else raid breaks through.
    const defWins = defenseTroops > raidTroops * 0.7;
    const defLoss = Math.floor(raidTroops * (defWins ? 0.4 : 0.7));
    const raidLoss = Math.floor(raidTroops * (defWins ? 0.7 : 0.3));

    if (defWins) {
      cities[target] = {
        ...c,
        troops: Math.max(0, c.troops - defLoss),
        loyalty: Math.min(100, c.loyalty + 3),
      };
      entries.push({
        cityId: target,
        kind: 'tribe-raid',
        text: `${tribe.name.en} raiders attacked ${c.name.en} but were repulsed. ${defLoss.toLocaleString()} defenders lost.`,
        textZh: `${tribe.name.zh}入寇${c.name.zh}，為守軍所卻。折守兵 ${defLoss.toLocaleString()}。`,
      });
    } else if (
      // 入主建國 — a war-fevered horde that crushes a hollow garrison plants
      // its banner instead of riding home with the loot.
      diplo && ctx.officers &&
      ag >= FOUNDING_MIN_AGGRESSION &&
      defenseTroops < raidTroops * FOUNDING_DEFENSE_RATIO &&
      !diplo.foundedStates[tribe.id] &&
      ctx.rng() < FOUNDING_CHANCE
    ) {
      const founding = buildTribalFounding({
        tribe,
        city: c,
        troops: Math.max(0, raidTroops - raidLoss),
        officers: ctx.officers,
        year: ctx.date.year,
      });
      cities[target] = {
        ...c,
        ownerForceId: founding.force.id,
        loyalty: 45,
        troops: Math.max(2_500, raidTroops - raidLoss + 1_500),
        population: Math.max(15_000, Math.floor(c.population * 0.9)),
      };
      foundings.push(founding);
      entries.push(founding.entry);
      // The horde has settled — its steppe fire banks down.
      aggression[tribe.id] = tribe.baseAggression * 0.5;
    } else {
      const goldLoot = Math.floor(c.gold * (0.2 + ctx.rng() * 0.3));
      const foodLoot = Math.floor(c.food * (0.2 + ctx.rng() * 0.3));
      cities[target] = {
        ...c,
        troops: Math.max(0, c.troops - defLoss),
        gold: Math.max(0, c.gold - goldLoot),
        food: Math.max(0, c.food - foodLoot),
        loyalty: Math.max(0, c.loyalty - 15),
      };
      entries.push({
        cityId: target,
        kind: 'tribe-raid',
        text: `${tribe.name.en} raiders sacked ${c.name.en}! ${defLoss.toLocaleString()} troops, ${goldLoot} gold, ${foodLoot.toLocaleString()} food lost.`,
        textZh: `${tribe.name.zh}襲掠${c.name.zh}，城破！折兵 ${defLoss.toLocaleString()}、失金 ${goldLoot}、糧 ${foodLoot.toLocaleString()}。`,
      });
    }

    // Aggression cool-down regardless of outcome (they retreated).
    aggression[tribe.id] = Math.max(
      tribe.baseAggression * 0.5,
      (aggression[tribe.id] ?? tribe.baseAggression) - 0.15 - raidLoss / 30000,
    );
    lastRaidYear[tribe.id] = ctx.date.year;
  }

  return {
    state: {
      aggression: aggression as Record<TribeId, number>,
      lastRaidYear,
    },
    cities,
    entries,
    foundings,
    brokenMarriages,
    incitementRaids,
  };
}

function pickTarget(
  tribe: Tribe,
  cities: Record<EntityId, City>,
  rng: () => number,
  filter?: { excludeForceId?: EntityId | null; onlyForceId?: EntityId | null },
): EntityId | null {
  const valid = tribe.raidableCityIds.filter((id) => {
    const c = cities[id];
    if (!c || c.ownerForceId === null) return false;
    if (filter?.onlyForceId && c.ownerForceId !== filter.onlyForceId) return false;
    if (filter?.excludeForceId && c.ownerForceId === filter.excludeForceId) return false;
    return true;
  });
  if (valid.length === 0) return null;
  return valid[Math.floor(rng() * valid.length)];
}

export function createInitialTribeState(): TribeState {
  const aggression: Record<TribeId, number> = {} as Record<TribeId, number>;
  for (const t of TRIBES) aggression[t.id] = t.baseAggression;
  return { aggression, lastRaidYear: {} };
}

/** Whether the player can mount a frontier campaign / embassy against a
 *  tribe — needs to own or border one of its raidable cities. */
export function canCampaignTribe(
  tribe: Tribe,
  cities: Record<EntityId, City>,
  playerForceId: string,
): { ok: boolean; reason?: string } {
  for (const cid of tribe.raidableCityIds) {
    const c = cities[cid];
    if (!c) continue;
    if (c.ownerForceId === playerForceId) return { ok: true };
    for (const adjId of c.adjacentCityIds ?? []) {
      if (cities[adjId]?.ownerForceId === playerForceId) return { ok: true };
    }
  }
  return {
    ok: false,
    reason: `Need to own or border one of: ${tribe.raidableCityIds
      .map((g) => cities[g]?.name.zh ?? g)
      .join(', ')}.`,
  };
}

/**
 * 征討 — a punitive expedition. The officer leads troops out against the
 * tribe; on victory aggression collapses (years of quiet) and grateful/
 * cowed clans send tribute (gold) + a band of auxiliary cavalry. A bloody
 * nose only dents their aggression. Pure math; the store applies it.
 */
export function resolveTribePunitive(args: {
  tribe: Tribe;
  aggression: number;
  troops: number;
  officerWar: number;
  officerLeadership: number;
  rng: () => number;
}): {
  win: boolean;
  attackerLosses: number;
  aggressionDelta: number;
  tributeGold: number;
  auxTroops: number;
} {
  const { tribe, troops, officerWar, officerLeadership, rng } = args;
  // Leadership swells the effective host; a high-WAR general fights the
  // tribes harder (Ma Chao against the Qiang, Zhuge Ke against the Shanyue).
  const effective = troops * (1 + officerLeadership / 200) * (1 + (officerWar - 50) / 300);
  // Tribe defenders scale with their strength multiplier.
  const defense = 3000 * tribe.strengthMul * (0.85 + rng() * 0.4);
  const ratio = effective / Math.max(1, defense);
  const win = ratio > 1;
  const attackerLosses = Math.floor(
    troops * Math.min(0.85, (win ? 0.10 : 0.30) + (defense / 30000) + rng() * 0.08),
  );
  const aggressionDelta = win
    ? -(0.12 + 0.06 * Math.min(2, ratio - 1))   // crushing wins quiet them for years
    : -0.03;
  const tributeGold = win ? Math.floor(300 + 500 * tribe.strengthMul + rng() * 400) : 0;
  // 異族騎兵 — submitting clans furnish auxiliaries (horse tribes give more).
  const auxTroops = win ? Math.floor((tribe.strengthMul >= 1.0 ? 800 : 400) * (0.7 + rng() * 0.6)) : 0;
  return { win, attackerLosses, aggressionDelta, tributeGold, auxTroops };
}

/** 招撫 — buy a season's peace with gifts. Always works, costs gold,
 *  and the calm is shallower & shorter-lived than a military victory. */
export const TRIBE_PLACATE_COST = 400;
export const TRIBE_PLACATE_AGGRESSION_DROP = 0.08;

/** Below this aggression a tribe is genuinely subdued/friendly and will
 *  furnish auxiliaries to the frontier power. */
export const TRIBE_VASSAL_AGGRESSION = 0.06;

/**
 * 異族雇傭 — a thoroughly pacified tribe (aggression beaten low by 征討 or
 * repeated 招撫) sends auxiliary cavalry/levies each season to whichever
 * power garrisons the border city nearest its lands. Rewards keeping the
 * frontier quiet rather than merely surviving raids. Pure.
 */
export function tickTribeMercenaries(args: {
  aggression: Record<string, number>;
  cities: Record<EntityId, City>;
  rng: () => number;
  /** 七擒之服 — submitted tribes send doubled auxiliaries regardless of drift. */
  submitted?: Partial<Record<TribeId, EntityId>>;
}): { cities: Record<EntityId, City>; entries: ReportEntry[] } {
  const cities = { ...args.cities };
  const entries: ReportEntry[] = [];
  for (const tribe of TRIBES) {
    const isSubmitted = !!args.submitted?.[tribe.id];
    const agg = args.aggression[tribe.id] ?? tribe.baseAggression;
    if (!isSubmitted && agg > TRIBE_VASSAL_AGGRESSION) continue;
    // Levy flows to an owned raidable (border) city — prefer the strongest.
    const owned = tribe.raidableCityIds
      .map((id) => cities[id])
      .filter((c): c is City => !!c && c.ownerForceId !== null)
      .sort((a, b) => b.troops - a.troops);
    if (owned.length === 0) continue;
    const target = owned[0];
    const aux = Math.floor(
      (120 + args.rng() * 80) * tribe.strengthMul * (isSubmitted ? 2 : 1),
    );
    cities[target.id] = { ...target, troops: target.troops + aux };
    entries.push({
      cityId: target.id,
      kind: 'income',
      text: `${tribe.name.en} auxiliaries (${aux}) joined ${target.name.en}.`,
      textZh: isSubmitted
        ? `${tribe.name.zh}傾心臣服,舉部發兵 ${aux} 助${target.name.zh}。`
        : `${tribe.name.zh}附庸發兵 ${aux} 助${target.name.zh}。`,
    });
  }
  return { cities, entries };
}
