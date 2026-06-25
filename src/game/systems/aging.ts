import type {
  City,
  EntityId,
  Force,
  Officer,
  ReportEntry,
} from '../types';
import { grantPosthumousName } from './posthumous';
import { inheritLegacyOnDeath } from './growth';
import { ITEMS_BY_ID, itemLoreLevel, itemLoreTitle } from '../data/items';
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
  /** 武將壽命 — old-age death rule. Defaults to 'historical'. */
  lifespanMode?: 'historical' | 'fictionalImmortal' | 'immortal';
  /** 武將壽命長短 — multiplier on the death chance. Defaults to 'historical'. */
  lifespanLength?: 'short' | 'historical' | 'long';
  /** 起死回生 — when true, dead officers may return to life this year. */
  reviveDeadOfficers?: boolean;
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
      // 智政晚成 — the body wanes but judgement ripens. Past their prime an
      // officer's 智力/政治 may still deepen (within their latent ceiling), so a
      // veteran drifts from 猛將 toward 老謀的謀臣 even while idle — the mirror of
      // the martial decline above, and the same 武→智 arc the age-tilt gives to
      // those still earning XP (see growth.ageGrowthBias).
      const lat = cur.latentStats;
      if (s.intelligence < (lat ? lat.intelligence : 100) && input.rng() < 0.35) { s = { ...s, intelligence: s.intelligence + 1 }; changed = true; }
      if (age >= 55 && s.politics < (lat ? lat.politics : 100) && input.rng() < 0.3) { s = { ...s, politics: s.politics + 1 }; changed = true; }
      if (changed) officers = { ...officers, [officer.id]: { ...cur, stats: s } };
    }

    // T8 — trait-based hardiness / fragility, plus the 壽命長短 dial.
    const lengthMul =
      input.lifespanLength === 'short' ? 1.6 :
      input.lifespanLength === 'long' ? 0.5 : 1.0;
    const chance = deathChance(officer, input.year, age, input.lifespanMode ?? 'historical')
      * deathChanceMultiplier(officer) * lengthMul;
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

    // 名器傳承 — a fallen master's STORIED weapon (a 名器, earned through battle)
    // is not buried with him: it passes to a living disciple first, else a living
    // kin, carrying its 威名. Done before 繼承遺志 (which clears the 師承 bond) so
    // the disciple is still findable — they inherit both the will and the blade.
    {
      const dead = officers[officer.id];
      const storied = (dead?.equipment ?? []).filter((id) => {
        const it = ITEMS_BY_ID[id];
        return it && it.kind === 'weapon' && itemLoreTitle(itemLoreLevel(id)) !== null;
      });
      if (storied.length > 0) {
        const heirloom = storied.reduce((b, id) => (itemLoreLevel(id) > itemLoreLevel(b) ? id : b), storied[0]);
        const isAlive = (o?: Officer) => !!o && o.status !== 'dead' && o.status !== 'unsearched';
        let heir = Object.values(officers).find((o) => o.mentorId === officer.id && isAlive(o)) ?? null;
        if (!heir && input.family) {
          for (const f of input.family) {
            if (f.kind !== 'parent-child') continue;
            const otherId = f.officerA === officer.id ? f.officerB : f.officerB === officer.id ? f.officerA : null;
            if (otherId && isAlive(officers[otherId])) { heir = officers[otherId]; break; }
          }
        }
        if (heir) {
          officers = {
            ...officers,
            [officer.id]: { ...dead, equipment: dead.equipment.filter((id) => id !== heirloom) },
            [heir.id]: { ...officers[heir.id], equipment: [...officers[heir.id].equipment, heirloom] },
          };
          const it = ITEMS_BY_ID[heirloom];
          const title = itemLoreTitle(itemLoreLevel(heirloom));
          entries.push({
            cityId: heir.locationCityId,
            kind: 'talent',
            text: `${heir.name.en} inherits ${officer.name.en}'s storied ${it?.name.en ?? heirloom}${title ? ` (${title.en})` : ''} — its renown lives on.`,
            textZh: `${heir.name.zh}繼承${officer.name.zh}之名器「${it?.name.zh ?? heirloom}」${title ? `·${title.zh}` : ''},威名不墜。`,
          });
        }
      }
    }

    // 繼承遺志 — disciples apprenticed to the fallen master channel the loss into
    // resolve: a one-time lift in the master's strongest suit, and the bond ends.
    const legacy = inheritLegacyOnDeath(officer, officers);
    officers = legacy.officers;
    entries.push(...legacy.entries);

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

  // 起死回生 — with revival enabled, the dead may return. Each fallen officer
  // (whether they died this campaign or before it began) has a small yearly
  // chance to walk the earth again as a free agent at their hometown, restored
  // to their prime and no longer bound to a historical death year. Capped so a
  // late-era roster full of the dead doesn't all flood back at once.
  if (input.reviveDeadOfficers) {
    const REVIVE_CAP = 2;
    let revived = 0;
    for (const officer of Object.values(officers)) {
      if (revived >= REVIVE_CAP) break;
      if (officer.status !== 'dead') continue;
      if (input.rng() >= 0.05) continue;
      const homeId = officer.hometownCityId ?? null;
      officers = {
        ...officers,
        [officer.id]: {
          ...officer,
          status: 'unsearched',
          forceId: null,
          locationCityId: homeId,
          // Restored to their prime; shed the historical death sentence so they
          // don't simply perish again next winter.
          birthYear: input.year - 24,
          deathYear: undefined,
          task: null,
          loyalty: 0,
          posthumousName: undefined,
          woundSeverity: undefined,
          woundedSeasons: undefined,
        },
      };
      revived += 1;
      const city = homeId ? cities[homeId] : undefined;
      const whereEn = city ? ` near ${city.name.en}` : '';
      const whereZh = city ? `，現身${city.name.zh}` : '';
      entries.push({
        cityId: homeId,
        kind: 'note',
        text: `起死回生 — ${officer.name.en} (${officer.name.zh}) has returned to the living${whereEn}.`,
        textZh: `起死回生 — ${officer.name.zh}重返人世${whereZh}。`,
      });
    }
  }

  return { cities, officers, forces, entries };
}

function deathChance(
  officer: Officer,
  year: number,
  age: number,
  lifespanMode: 'historical' | 'fictionalImmortal' | 'immortal',
): number {
  // 武將壽命 settings — short-circuit before any roll.
  if (lifespanMode === 'immortal') return 0;
  // A "fictional" officer is anyone with no 史實 death year (self-created,
  // mod, or otherwise non-historical). They never age out in this mode.
  if (lifespanMode === 'fictionalImmortal' && officer.deathYear === undefined) return 0;

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
