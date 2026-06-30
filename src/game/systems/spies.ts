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

/** A friendly city to slip a recalled/blown-cover agent back to (owner-relative). */
function homeCity(spy: EmbeddedSpy, cities: Record<EntityId, City>, ownerForceId: EntityId | null | undefined): EntityId | null {
  const origin = cities[spy.originCityId];
  if (origin && origin.ownerForceId === ownerForceId) return spy.originCityId;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId === ownerForceId) return c.id;
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
    // 細作之主 — owner-relative so an AI's spy in a *player* city ticks too (§7.3 ①).
    const owner = spy.ownerForceId ?? ctx.playerForceId;
    const isPlayerSpy = owner === ctx.playerForceId;

    // Agent already lost (killed/captured elsewhere) → the spy lapses.
    if (!agent || agent.status === 'dead' || agent.status === 'imprisoned') continue;

    // City no longer hostile to the agent's master → mission moot; slip home.
    if (!city || !city.ownerForceId || city.ownerForceId === owner) {
      const home = homeCity(spy, cities, owner);
      officers[agent.id] = { ...agent, status: 'idle', task: null, locationCityId: home ?? agent.locationCityId };
      if (isPlayerSpy) {
        entries.push({
          cityId: spy.targetCityId, kind: 'espionage',
          text: `${agent.name.en}'s cover is no longer needed — the agent slips back home.`,
          textZh: `${agent.name.zh}潛伏之地已非敵手,細作悄然歸來。`,
        });
      }
      continue;
    }

    // 1) Intel — a player spy keeps the city lit for the fog of war.
    if (isPlayerSpy) reveals[spy.targetCityId] = Math.max(reveals[spy.targetCityId] ?? 0, SPY_REVEAL_TICKS);

    // 2) Erosion — quietly sow discontent in the host city (harms its owner).
    const erode = 1 + Math.floor(ctx.rng() * 2); // 1–2 / season
    cities[spy.targetCityId] = { ...city, loyalty: clamp(city.loyalty - erode, 0, 100) };

    // 3) Exposure — host-city vigilance (garrison INT) vs agent stealth.
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
      // 4) Discovered — the agent is seized and held in the host city.
      officers[agent.id] = {
        ...agent, status: 'imprisoned', task: null, locationCityId: spy.targetCityId,
        ...(isPlayerSpy ? {} : { capturedFromForceId: owner ?? agent.forceId ?? undefined }),
      };
      if (isPlayerSpy) {
        // Your spy in an enemy city — the lord resents the intrusion.
        grudgeBumps[city.ownerForceId] = (grudgeBumps[city.ownerForceId] ?? 0) + 15;
        entries.push({
          cityId: spy.targetCityId, kind: 'espionage',
          text: `${agent.name.en} is unmasked in ${city.name.en} and seized — your spy is lost.`,
          textZh: `${agent.name.zh}潛伏${city.name.zh}事泄被擒,細作折矣!`,
        });
      } else {
        // An enemy spy in YOUR city — you unmask and seize them (a captive to deal with).
        entries.push({
          cityId: spy.targetCityId, kind: 'espionage',
          text: `An enemy spy, ${agent.name.en}, is unmasked in ${city.name.en} and seized!`,
          textZh: `${city.name.zh}揪出敵細作${agent.name.zh},當場拿下!`,
        });
      }
      continue;
    }

    survivors.push({ ...spy, exposure });
  }

  return { spies: survivors, officers, cities, reveals, grudgeBumps, entries };
}
