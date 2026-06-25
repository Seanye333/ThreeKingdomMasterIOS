import type {
  City,
  EntityId,
  Officer,
  ReportEntry,
  GameDate,
} from '../types';
import { getDeathPoem } from '../data/deathPoems';
import { plagueDeathTraitMul } from './traitEffects';

// ── Court intrigue: court factions auto-derived from officer profile ──
//
// reformer: high politics, age < 40 (younger reform-minded literati)
// eunuch:   leadership < 50 AND politics > 70 (palace intriguer)
// gentry:   politics > 75 AND charisma > 70 (established clan)
// military: war > 75 (battle commanders)
//
// Officers may bear multiple labels but we pick the strongest.

export type Faction = 'reformer' | 'eunuch' | 'gentry' | 'military';

export interface FactionAssignment {
  officerId: EntityId;
  faction: Faction;
}

export function deriveFaction(o: Officer, age: number): Faction {
  if (o.stats.war > 80) return 'military';
  if (o.stats.politics > 75 && o.stats.charisma > 70) return 'gentry';
  if (o.stats.leadership < 50 && o.stats.politics > 70) return 'eunuch';
  if (o.stats.politics > 70 && age < 40) return 'reformer';
  if (o.stats.war > 70) return 'military';
  return 'gentry';
}

export function deriveCourtFactions(
  officers: Officer[],
  forceId: EntityId,
  currentYear: number,
): FactionAssignment[] {
  return officers
    .filter((o) => o.forceId === forceId && o.status === 'idle')
    .map((o) => ({
      officerId: o.id,
      faction: deriveFaction(o, currentYear - o.birthYear),
    }));
}

/**
 * Intrigue tick. Each season, opposing factions roll for a plot.
 *  - Eunuch vs Gentry → smear-and-demote (loyalty −5 for target)
 *  - Reformer vs Eunuch → impeachment (loyalty −5)
 *  - Military vs Eunuch → assassination attempt (rare, INT-roll)
 * Returns updated officers (with loyalty changes) and report entries.
 */
export function rollIntrigue(input: {
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, { id: EntityId; name: { zh: string; en: string } }>;
  date: GameDate;
  rng: () => number;
}): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...input.officers };
  const entries: ReportEntry[] = [];
  const forceIds = Object.keys(input.forces);

  for (const forceId of forceIds) {
    const courtiers = Object.values(out).filter(
      (o) => o.forceId === forceId && o.status === 'idle',
    );
    if (courtiers.length < 4) continue; // need a court

    if (input.rng() > 0.18) continue; // 18% per force per season

    // Pick a faction pair at random with weighted preference.
    const factions: Record<Faction, Officer[]> = {
      reformer: [],
      eunuch:   [],
      gentry:   [],
      military: [],
    };
    for (const c of courtiers) {
      const age = input.date.year - c.birthYear;
      factions[deriveFaction(c, age)].push(c);
    }

    // Need ≥2 factions populated to plot.
    const populated = (Object.entries(factions) as Array<[Faction, Officer[]]>)
      .filter(([_, arr]) => arr.length > 0);
    if (populated.length < 2) continue;

    const [aFaction, aList] = populated[Math.floor(input.rng() * populated.length)];
    const remaining = populated.filter(([k]) => k !== aFaction);
    const [bFaction, bList] = remaining[Math.floor(input.rng() * remaining.length)];

    const plotter = aList[Math.floor(input.rng() * aList.length)];
    const target  = bList[Math.floor(input.rng() * bList.length)];

    // Assassination only if military plots vs eunuch and roll high.
    const assassination =
      aFaction === 'military' && bFaction === 'eunuch' && input.rng() < 0.35;

    if (assassination) {
      // Target dies; plotter suffers loyalty hit too.
      out[target.id] = { ...target, status: 'dead', task: null };
      out[plotter.id] = {
        ...out[plotter.id],
        loyalty: Math.max(0, out[plotter.id].loyalty - 10),
      };
      const poem = getDeathPoem(target.id);
      const poemTail = poem ? ` — 絕命詩：「${poem.zh}」` : '';
      entries.push({
        cityId: target.locationCityId,
        kind: 'death',
        text: `謀殺事件 — ${target.name.zh} assassinated at court by ${plotter.name.zh} (${input.forces[forceId].name.zh}).${poemTail}`,
        textZh: `謀殺事件 — ${target.name.zh}於朝堂遭${plotter.name.zh}（${input.forces[forceId].name.zh}）所暗殺。${poemTail}`,
      });
      continue;
    }

    // Smear / impeachment. Target loyalty −5, plotter no penalty but other
    // members of target's faction also lose −2 (cascade).
    const newLoy = Math.max(0, target.loyalty - 5);
    out[target.id] = { ...target, loyalty: newLoy };
    for (const ally of bList) {
      if (ally.id === target.id) continue;
      out[ally.id] = {
        ...out[ally.id],
        loyalty: Math.max(0, out[ally.id].loyalty - 2),
      };
    }
    entries.push({
      cityId: target.locationCityId,
      kind: 'note',
      text: `朝堂黨爭 — ${plotter.name.zh}（${factionLabelZh(aFaction)}派） impeaches ${target.name.zh}（${factionLabelZh(bFaction)}派） in ${input.forces[forceId].name.zh}. Loyalty −5.`,
      textZh: `朝堂黨爭 — ${plotter.name.zh}（${factionLabelZh(aFaction)}派）於${input.forces[forceId].name.zh}彈劾${target.name.zh}（${factionLabelZh(bFaction)}派）。忠誠 −5。`,
    });
  }

  return { officers: out, entries };
}

function factionLabelZh(f: Faction): string {
  switch (f) {
    case 'reformer': return '改革';
    case 'eunuch':   return '宦官';
    case 'gentry':   return '士族';
    case 'military': return '軍將';
  }
}

// ── Enhanced plague outbreak: spreads to neighbor cities + may kill old officers ──

export interface PlagueInput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  currentYear: number;
  rng: () => number;
  /** 採藥備疫 — per-force 0..0.6 fraction of a plague's toll shrugged off by a
   *  herb-rich realm (population/troop loss, loyalty hit, officer deaths). */
  plagueResist?: Record<EntityId, number>;
}

export interface PlagueOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
}

/**
 * Rolls a single seasonal plague chain. Picks a seed city (weighted by
 * population × current-season heat), spreads to 0–2 adjacent cities, and
 * kills 0–3 officers (older + lower-charisma = more vulnerable). Matches
 * the 192–218 Han plague's historical pattern that killed Cao Chong and
 * most of the Jian'an Seven Scholars in winter.
 */
export function rollPlagueOutbreak(input: PlagueInput): PlagueOutput {
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const entries: ReportEntry[] = [];

  if (input.rng() > 0.07) return { cities, officers, entries };

  // Pick seed weighted by population (only cities > 80k).
  const candidates = Object.values(cities).filter((c) => c.population > 80_000);
  if (candidates.length === 0) return { cities, officers, entries };

  const totalPop = candidates.reduce((s, c) => s + c.population, 0);
  let pick = input.rng() * totalPop;
  const seed = candidates.find((c) => {
    pick -= c.population;
    return pick <= 0;
  }) ?? candidates[0];

  const struck: City[] = [seed];
  // Spread to 0–2 adjacent.
  const adj = seed.adjacentCityIds
    .map((id) => cities[id])
    .filter((c) => c && c.population > 30_000);
  const spreadCount = Math.floor(input.rng() * 3);
  for (let i = 0; i < spreadCount && i < adj.length; i++) {
    struck.push(adj[i]);
  }

  for (const c of struck) {
    // 採藥備疫 — the owner's herb stockpile/infrastructure blunts the toll.
    const resist = (c.ownerForceId && input.plagueResist?.[c.ownerForceId]) || 0;
    const keep = 1 - resist;
    const popLost = Math.floor(c.population * (0.06 + input.rng() * 0.08) * keep);
    const troopLost = Math.floor(c.troops * 0.07 * keep);
    const loyaltyHit = resist >= 0.4 ? 2 : 4;
    cities[c.id] = {
      ...cities[c.id],
      population: Math.max(0, c.population - popLost),
      troops: Math.max(0, c.troops - troopLost),
      loyalty: Math.max(0, c.loyalty - loyaltyHit),
    };
    const relief = resist > 0 ? `(藥材備疫 −${Math.round(resist * 100)}%)` : '';
    entries.push({
      cityId: c.id,
      kind: 'plague',
      text: `瘟疫蔓延 ${c.name.zh}. −${popLost.toLocaleString()} 民, −${troopLost.toLocaleString()} 兵, 民心 −${loyaltyHit}. ${relief}`,
      textZh: `瘟疫蔓延於${c.name.zh}。民 −${popLost.toLocaleString()}、兵 −${troopLost.toLocaleString()}、民心 −${loyaltyHit}。${relief}`,
    });
  }

  // Officer fatalities — vulnerable: age > 55 OR charisma < 50.
  const struckIds = new Set(struck.map((c) => c.id));
  // 醫者坐鎮 — a physician/herbalist stationed in a stricken city saves lives there.
  const healerCities = new Set<EntityId>();
  for (const o of Object.values(officers)) {
    if (o.status === 'dead' || !o.locationCityId || !struckIds.has(o.locationCityId)) continue;
    const tr = o.traits as string[] | undefined ?? [];
    if (tr.includes('physician') || tr.includes('herbalist')) healerCities.add(o.locationCityId);
  }
  const exposed = Object.values(officers).filter(
    (o) =>
      o.locationCityId &&
      struckIds.has(o.locationCityId) &&
      o.status !== 'dead' &&
      o.status !== 'unsearched',
  );
  for (const o of exposed) {
    const age = input.currentYear - o.birthYear;
    // Base 4% chance; +1% per year over 55; +1% per CHA point below 50.
    let chance = 0.04;
    if (age > 55) chance += (age - 55) * 0.01;
    if (o.stats.charisma < 50) chance += (50 - o.stats.charisma) * 0.005;
    // 良醫救治 — a herb-rich realm's physicians pull more of the stricken through.
    const cityResist = (o.locationCityId && cities[o.locationCityId]?.ownerForceId
      && input.plagueResist?.[cities[o.locationCityId].ownerForceId!]) || 0;
    chance *= 1 - cityResist;
    // 性格體質 — frail bodies succumb; the hale / well-doctored endure.
    chance *= plagueDeathTraitMul(o);
    // a resident healer tends the sick (−15% deaths in that city).
    if (o.locationCityId && healerCities.has(o.locationCityId)) chance *= 0.85;
    if (input.rng() < chance) {
      officers[o.id] = { ...o, status: 'dead', task: null };
      const poem = getDeathPoem(o.id);
      const poemTail = poem ? ` — 絕命詩：「${poem.zh}」` : '';
      entries.push({
        cityId: o.locationCityId,
        kind: 'death',
        text: `病亡 — ${o.name.zh}（${o.name.en}） died of plague at age ${age}.${poemTail}`,
        textZh: `病亡 — ${o.name.zh}染疫而卒，享年 ${age} 歲。${poemTail}`,
      });
    }
  }

  return { cities, officers, entries };
}
