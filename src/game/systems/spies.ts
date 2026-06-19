import type { City, EmbeddedSpy, EntityId, Officer, ReportEntry } from '../types';
import { espionageBonus } from './traitEffects';

/**
 * 潛伏細作 — persistent undercover agents (the multi-season layer over one-shot
 * espionage). Each season an embedded spy keeps their city revealed, quietly
 * erodes its loyalty, and accrues exposure (target vigilance − agent stealth).
 * At exposure ≥ 100 the agent is caught (imprisoned in the enemy city, and the
 * lord's resentment rises); recall extracts them safely beforehand. If the city
 * stops being hostile (you took it, it fell neutral), the agent slips home.
 */

export const PLANT_SPY_COST = 300;
export const SPY_REVEAL_TICKS = 2;

export interface SpyTickContext {
  spies: EmbeddedSpy[];
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  playerForceId: EntityId | null | undefined;
  rng: () => number;
}

export interface SpyTickOutput {
  spies: EmbeddedSpy[];
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  /** Intel reveals to merge into state.espionageReveals (cityId → ticks). */
  reveals: Record<EntityId, number>;
  /** Resentment to add per force on a discovery (forceId → delta). */
  grudgeBumps: Record<EntityId, number>;
  entries: ReportEntry[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** A friendly city to slip a recalled/blown-cover agent back to. */
function homeCity(spy: EmbeddedSpy, cities: Record<EntityId, City>, playerForceId: EntityId | null | undefined): EntityId | null {
  const origin = cities[spy.originCityId];
  if (origin && origin.ownerForceId === playerForceId) return spy.originCityId;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId === playerForceId) return c.id;
  }
  return null;
}

export function tickEmbeddedSpies(ctx: SpyTickContext): SpyTickOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const reveals: Record<EntityId, number> = {};
  const grudgeBumps: Record<EntityId, number> = {};
  const entries: ReportEntry[] = [];
  const survivors: EmbeddedSpy[] = [];

  for (const spy of ctx.spies) {
    const agent = officers[spy.agentOfficerId];
    const city = cities[spy.targetCityId];

    // Agent already lost (killed/captured elsewhere) → the spy lapses.
    if (!agent || agent.status === 'dead' || agent.status === 'imprisoned') continue;

    // City no longer hostile → the mission is moot; slip the agent home.
    if (!city || !city.ownerForceId || city.ownerForceId === ctx.playerForceId) {
      const home = homeCity(spy, cities, ctx.playerForceId);
      officers[agent.id] = { ...agent, status: 'idle', task: null, locationCityId: home ?? agent.locationCityId };
      entries.push({
        cityId: spy.targetCityId,
        kind: 'espionage',
        text: `${agent.name.en}'s cover is no longer needed — the agent slips back home.`,
        textZh: `${agent.name.zh}潛伏之地已非敵手,細作悄然歸來。`,
      });
      continue;
    }

    // 1) Intel — keep the city lit for the fog of war.
    reveals[spy.targetCityId] = Math.max(reveals[spy.targetCityId] ?? 0, SPY_REVEAL_TICKS);

    // 2) Erosion — quietly sow discontent.
    const erode = 1 + Math.floor(ctx.rng() * 2); // 1–2 / season
    cities[spy.targetCityId] = { ...city, loyalty: clamp(city.loyalty - erode, 0, 100) };

    // 3) Exposure — target vigilance (garrison INT) vs agent stealth.
    const garrison = Object.values(officers).filter(
      (o) => o.forceId === city.ownerForceId && o.locationCityId === city.id && o.status !== 'dead',
    );
    const vigilance = garrison.length > 0
      ? garrison.reduce((s, o) => s + o.stats.intelligence, 0) / garrison.length
      : 55;
    const stealth = agent.stats.intelligence + espionageBonus(agent) * 80;
    const dExp = clamp(Math.round(6 + (vigilance - stealth) * 0.12), 2, 14);
    const exposure = spy.exposure + dExp;

    if (exposure >= 100) {
      // 4) Discovered — seized and held; the lord resents the intrusion.
      officers[agent.id] = { ...agent, status: 'imprisoned', task: null, locationCityId: spy.targetCityId };
      grudgeBumps[city.ownerForceId] = (grudgeBumps[city.ownerForceId] ?? 0) + 15;
      entries.push({
        cityId: spy.targetCityId,
        kind: 'espionage',
        text: `${agent.name.en} is unmasked in ${city.name.en} and seized — your spy is lost.`,
        textZh: `${agent.name.zh}潛伏${city.name.zh}事泄被擒,細作折矣!`,
      });
      continue;
    }

    survivors.push({ ...spy, exposure });
  }

  return { spies: survivors, officers, cities, reveals, grudgeBumps, entries };
}
