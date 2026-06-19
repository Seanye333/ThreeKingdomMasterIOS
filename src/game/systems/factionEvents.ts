import type { City, EntityId, Force, Officer, ReportEntry } from '../types';
import { deriveCourtFactions, type FactionId } from './courtFactions';

export interface FactionEventInput {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  mandate: { byForce: Record<EntityId, number> };
  rng: () => number;
}

export interface FactionEventOutput {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  mandate: { byForce: Record<EntityId, number> };
  entries: ReportEntry[];
}

/**
 * Per-season faction-imbalance check. When one faction holds > 55% of a
 * force's classified officers, a flavorful incident fires with mechanical
 * consequence. Fires at most one event per force per tick.
 *
 *  軍方 dominant → 「武人干政」: drop force-wide loyalty −3; mandate −2
 *  門閥 dominant → 「九品官人法」: low-charisma officers −5 loyalty
 *  宦黨 dominant → 「黨錮之禍」: one random reformer/gentry officer −15
 *  革新 dominant → 「新政」: all owned cities +5 loyalty (positive event)
 */
export function rollFactionEvents(input: FactionEventInput): FactionEventOutput {
  const officers = { ...input.officers };
  const cities = { ...input.cities };
  let mandate = input.mandate;
  const entries: ReportEntry[] = [];

  const factionsByForce = deriveCourtFactions(officers);
  for (const force of Object.values(input.forces)) {
    const list = factionsByForce[force.id];
    if (!list || list.length < 5) continue; // too few classified officers to matter
    const counts: Record<FactionId, number> = {
      reformer: 0, eunuch: 0, gentry: 0, military: 0,
    };
    for (const f of list) counts[f.faction]++;
    const total = list.length;
    let dominant: FactionId | null = null;
    let dominantShare = 0;
    for (const fid of Object.keys(counts) as FactionId[]) {
      const share = counts[fid] / total;
      if (share > dominantShare) { dominantShare = share; dominant = fid; }
    }
    if (!dominant || dominantShare <= 0.55) continue;
    // 25% fire chance per season when imbalanced.
    if (input.rng() > 0.25) continue;
    const ownCities = Object.values(cities).filter((c) => c.ownerForceId === force.id);
    if (dominant === 'military') {
      // 武人干政: militarists overstep. All force officers −3 loyalty,
      // mandate −2.
      for (const o of Object.values(officers)) {
        if (o.forceId !== force.id || o.status === 'dead' || o.status === 'imprisoned') continue;
        officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 3) };
      }
      const m = mandate.byForce[force.id] ?? 50;
      mandate = { ...mandate, byForce: { ...mandate.byForce, [force.id]: Math.max(0, m - 2) } };
      entries.push({
        cityId: ownCities[0]?.id ?? null, kind: 'note',
        text: `${force.name.en}: 武人干政 — generals overshadow the court (loyalty −3, mandate −2).`,
        textZh: `${force.name.zh}：武人干政 — 諸將跋扈，文官側目（忠誠 −3，天命 −2）。`,
      });
    } else if (dominant === 'gentry') {
      // 九品官人法: gentry entrench. Low-charisma officers (< 60) feel slighted.
      let hit = 0;
      for (const o of Object.values(officers)) {
        if (o.forceId !== force.id || o.status === 'dead' || o.status === 'imprisoned') continue;
        if (o.stats.charisma >= 60) continue;
        officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 5) };
        hit++;
      }
      entries.push({
        cityId: ownCities[0]?.id ?? null, kind: 'note',
        text: `${force.name.en}: 九品官人法 — gentry consolidate (${hit} low-charisma officers −5 loyalty).`,
        textZh: `${force.name.zh}：行九品官人法 — 寒門寒心（${hit} 名低聲望武將 −5 忠誠）。`,
      });
    } else if (dominant === 'eunuch') {
      // 黨錮之禍: inner court purges a high-stat critic. Picks one
      // reformer/gentry officer, drops their loyalty by 15.
      const factions = factionsByForce[force.id] ?? [];
      const targets = factions
        .filter((f) => f.faction === 'reformer' || f.faction === 'gentry')
        .map((f) => officers[f.officerId])
        .filter((o): o is Officer => !!o && o.status !== 'dead' && o.status !== 'imprisoned');
      if (targets.length > 0) {
        const victim = targets[Math.floor(input.rng() * targets.length)];
        officers[victim.id] = { ...victim, loyalty: Math.max(0, victim.loyalty - 15) };
        entries.push({
          cityId: victim.locationCityId, kind: 'note',
          text: `${force.name.en}: 黨錮之禍 — ${victim.name.en} purged by the inner court (loyalty −15).`,
          textZh: `${force.name.zh}：黨錮之禍 — ${victim.name.zh}為宦黨所譖（忠誠 −15）。`,
        });
      }
    } else if (dominant === 'reformer') {
      // 新政: a virtuous administration — all cities +5 loyalty.
      for (const c of ownCities) {
        cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 5) };
      }
      entries.push({
        cityId: ownCities[0]?.id ?? null, kind: 'note',
        text: `${force.name.en}: 新政 — reforms restore confidence (cities +5 loyalty).`,
        textZh: `${force.name.zh}：行新政 — 上下歸心（各城 +5 民忠）。`,
      });
    }
  }

  return { officers, cities, mandate, entries };
}
