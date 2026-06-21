import type {
  City,
  EntityId,
  Force,
  Officer,
  ReportEntry,
} from '../types';
import { grantPosthumousName } from './posthumous';
import { getDeathPoem } from '../data/deathPoems';
import { deathChanceMultiplier, rollAgeDrift } from './traitEffects';
import { TRAIT_DEFS_BY_ID } from '../data/personality';
import { griefOnDeath } from './relationshipEffects';
import type { FamilyRelation } from '../types/family';

export interface AgingInput {
  year: number;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  rng: () => number;
  family?: FamilyRelation[];
}

export interface AgingOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  entries: ReportEntry[];
}

/**
 * 年歲 — an officer's life-stage band from their age. Prime years (巔峰) are
 * the window to use a great officer; past 遲暮 their martial edge wanes (see the
 * decline in processAging). Pure helper, also used by the UI / 名將榜.
 */
export interface AgeBand { id: string; zh: string; en: string; color: string; declining: boolean; }
export function ageBand(age: number): AgeBand {
  if (age < 22) return { id: 'youth', zh: '少年', en: 'Youth', color: '#9ed8b8', declining: false };
  if (age < 30) return { id: 'young', zh: '青年', en: 'Young', color: '#88b7e8', declining: false };
  if (age < 45) return { id: 'prime', zh: '巔峰', en: 'Prime', color: '#e6c473', declining: false };
  if (age < 55) return { id: 'seasoned', zh: '老練', en: 'Seasoned', color: '#cfd8e0', declining: false };
  if (age < 65) return { id: 'twilight', zh: '遲暮', en: 'Twilight', color: '#c8884e', declining: true };
  return { id: 'venerable', zh: '耄耋', en: 'Venerable', color: '#9a7a6a', declining: true };
}

/** Run yearly aging — call this once per year, at end of winter. */
export function processAging(input: AgingInput): AgingOutput {
  const cities = { ...input.cities };
  let officers = { ...input.officers };
  let forces = { ...input.forces };
  const entries: ReportEntry[] = [];

  for (const officer of Object.values(officers)) {
    if (officer.status === 'dead' || officer.status === 'unsearched') continue;
    const age = input.year - officer.birthYear;
    // G — Age-driven trait drift: 60+ officers may shed hot traits or
    // gain sage ones. Independent of death roll.
    const drift = rollAgeDrift(officer, age, input.rng);
    if (drift) {
      const cur = (officer.traits ?? []) as string[];
      let next = cur;
      if (drift.remove) next = next.filter((t) => t !== drift.remove);
      if (drift.add && !next.includes(drift.add)) next = [...next, drift.add];
      if (next !== cur) {
        officers = {
          ...officers,
          [officer.id]: { ...officer, traits: next as Officer['traits'] },
        };
        const isPlayer = officer.forceId !== null;
        if (isPlayer) {
          if (drift.remove) {
            const def = TRAIT_DEFS_BY_ID[drift.remove];
            entries.push({
              cityId: officer.locationCityId,
              kind: 'note',
              text: `${officer.name.en} mellowed with age — lost ${def?.name.en ?? drift.remove}.`,
              textZh: `${officer.name.zh}年歲漸長,棄「${def?.name.zh ?? drift.remove}」之性。`,
            });
          }
          if (drift.add) {
            const def = TRAIT_DEFS_BY_ID[drift.add];
            entries.push({
              cityId: officer.locationCityId,
              kind: 'note',
              text: `${officer.name.en} grew sage with age — gained ${def?.name.en ?? drift.add}.`,
              textZh: `${officer.name.zh}飽經滄桑,習得「${def?.name.zh ?? drift.add}」之性。`,
            });
          }
        }
      }
    }
    // 遲暮 — past their prime an officer's body wanes: 武力 slips from ~50, and
    // 統率 later. Gentle, permanent, floored — a reason to use elites while young.
    if (age >= 50) {
      const cur = officers[officer.id] ?? officer;
      let s = cur.stats;
      let changed = false;
      if (s.war > 55 && input.rng() < 0.5) { s = { ...s, war: s.war - 1 }; changed = true; }
      if (age >= 62 && s.leadership > 50 && input.rng() < 0.4) { s = { ...s, leadership: s.leadership - 1 }; changed = true; }
      if (changed) officers = { ...officers, [officer.id]: { ...cur, stats: s } };
    }

    // T8 — trait-based hardiness / fragility
    const chance = deathChance(officer, input.year, age) * deathChanceMultiplier(officer);
    if (input.rng() >= chance) continue;

    // Officer dies — and their court, if they had one, grants the 諡號.
    const posthumous = grantPosthumousName(officer);
    officers = {
      ...officers,
      [officer.id]: {
        ...officer,
        status: 'dead',
        forceId: null,
        locationCityId: null,
        task: null,
        ...(posthumous ? { posthumousName: posthumous } : {}),
      },
    };
    const poem = getDeathPoem(officer.id);
    const poemTail = poem ? ` — 絕命詩：「${poem.zh}」` : '';
    const shiTail = posthumous ? `朝廷追諡曰「${posthumous}」。` : '';
    entries.push({
      cityId: officer.locationCityId,
      kind: 'death',
      text: `${officer.name.en} (${officer.name.zh}) has died, aged ${age}.${posthumous ? ` Posthumously honored as ${posthumous}.` : ''}${poemTail}`,
      textZh: `${officer.name.zh}卒，享年 ${age} 歲。${shiTail}${poemTail}`,
    });

    // R10 — Grief: apply loyalty hits to bonded officers + report
    const grief = griefOnDeath(officer.id, officer.name.zh, officer.name.en, input.family ?? []);
    for (const g of grief) {
      const target = officers[g.targetId];
      if (!target || target.status === 'dead' || !target.forceId) continue;
      officers = {
        ...officers,
        [g.targetId]: { ...target, loyalty: Math.max(0, target.loyalty + g.delta) },
      };
      entries.push({
        cityId: target.locationCityId,
        kind: 'note',
        text: `${target.name.en}: ${g.reasonEn} (loyalty ${g.delta}).`,
        textZh: `${target.name.zh}:${g.reasonZh} (忠誠 ${g.delta})。`,
      });
    }

    // Was this officer the ruler of any force?
    const ruledForce = Object.values(forces).find(
      (f) => f.rulerOfficerId === officer.id,
    );
    if (ruledForce) {
      const succession = succeedRuler(
        ruledForce,
        officers,
        cities,
        forces,
        entries,
      );
      forces = succession.forces;
      officers = succession.officers;
      Object.assign(cities, succession.cities);
    }
  }

  return { cities, officers, forces, entries };
}

function deathChance(officer: Officer, year: number, age: number): number {
  if (officer.deathYear !== undefined) {
    // Cluster death around historical year.
    if (year < officer.deathYear) return 0;
    return Math.min(1, 0.3 + (year - officer.deathYear) * 0.15);
  }
  // Age-based fallback for fictional officers.
  if (age < 60) return 0;
  return Math.min(1, (age - 60) * 0.05);
}

interface SuccessionResult {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
}

function succeedRuler(
  force: Force,
  officersIn: Record<EntityId, Officer>,
  citiesIn: Record<EntityId, City>,
  forcesIn: Record<EntityId, Force>,
  entries: ReportEntry[],
): SuccessionResult {
  const candidates = Object.values(officersIn).filter(
    (o) =>
      o.forceId === force.id &&
      o.status !== 'dead' &&
      o.status !== 'imprisoned' &&
      o.status !== 'unsearched',
  );

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.stats.charisma - a.stats.charisma);
    const successor = candidates[0];
    const newName = {
      en: successor.name.en,
      zh: `${successor.name.zh}軍`,
    };
    entries.push({
      cityId: null,
      kind: 'succession',
      text: `${successor.name.en} succeeds as ruler of ${force.name.en}. The force is now known as ${newName.en}.`,
      textZh: `${successor.name.zh}繼${force.name.zh}之主位，自此號為${newName.zh}。`,
    });
    return {
      cities: citiesIn,
      officers: officersIn,
      forces: {
        ...forcesIn,
        [force.id]: {
          ...force,
          rulerOfficerId: successor.id,
          name: newName,
        },
      },
    };
  }

  // Force dissolves — cities become neutral, remaining officers go free.
  const newCities: Record<EntityId, City> = { ...citiesIn };
  const newOfficers: Record<EntityId, Officer> = { ...officersIn };
  for (const c of Object.values(newCities)) {
    if (c.ownerForceId === force.id) {
      newCities[c.id] = { ...c, ownerForceId: null, loyalty: 30 };
    }
  }
  for (const o of Object.values(newOfficers)) {
    if (o.forceId === force.id && o.status !== 'dead') {
      newOfficers[o.id] = { ...o, forceId: null, task: null };
    }
  }
  entries.push({
    cityId: null,
    kind: 'dissolution',
    text: `${force.name.en} (${force.name.zh}) has dissolved — no successor remains.`,
    textZh: `${force.name.zh}既無後嗣可繼，遂分崩離析。`,
  });
  return {
    cities: newCities,
    officers: newOfficers,
    forces: {
      ...forcesIn,
      [force.id]: { ...force, rulerOfficerId: '' },
    },
  };
}
