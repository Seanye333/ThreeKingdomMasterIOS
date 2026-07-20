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
import { demotedPeerage, peerageById, peerageTier } from '../data/peerage';
import type { FamilyRelation } from '../types/family';
import { legacyManualDrops, type LegacyDrop } from './legacyManual';
import { inheritedXiuwei } from './lineage';

export interface AgingInput {
  year: number;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  rng: () => number;
  family?: FamilyRelation[];
  /** Runtime oath/feud bonds — drive 殉義 grief and a foe's cold relief on death. */
  runtimeBonds?: import('../data/bonds').OathBond[];
  /** 武將壽命 — old-age death rule. Defaults to 'historical'. */
  lifespanMode?: 'historical' | 'fictionalImmortal' | 'immortal';
  /** 武將壽命長短 — multiplier on the death chance. Defaults to 'historical'. */
  lifespanLength?: 'short' | 'historical' | 'long';
  /** 變老不影響屬性 — when true, skip the age-driven five-圍 drift entirely
   *  (no 遲暮 decline, no 智政晚成 growth). Officers still age/die. Default false. */
  agingStatLock?: boolean;
  /** 起死回生 — when true, dead officers may return to life this year. */
  reviveDeadOfficers?: boolean;
}

export interface AgingOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  entries: ReportEntry[];
  /** 遺譜傳世 — manuals left behind by masters who died this year (§6.10/§6.14). */
  legacyDrops: LegacyDrop[];
  /** 衣缽傳承 — heirs who inherited a dead master's craft this year (§6.18). */
  artInheritances: Array<{ masterId: EntityId; heirId: EntityId; art: 'martial' | 'debate' }>;
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
  // 遺譜傳世 — manuals gathered where a master fell (see legacyManual.ts).
  const legacyDrops: LegacyDrop[] = [];
  // 衣缽傳人 — a named heir takes up the craft the moment the master falls.
  const artInheritances: AgingOutput['artInheritances'] = [];

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
    // 變老不影響屬性 — the setting freezes all age-driven 圍 drift (decline AND
    // late-bloom), so a maxed general never decays with the years.
    if (age >= 50 && !input.agingStatLock) {
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

    // 高齡里程碑 — a long life is its own honour. At 60/70/80 a serving officer
    // earns a milestone beat (fires once, since age increments by 1 each year):
    // 元老 steadies them, 國士 inspires a young colleague, 期頤 marvels the court.
    if (officer.forceId && (age === 60 || age === 70 || age === 80)) {
      const cur = officers[officer.id] ?? officer;
      if (age === 60) {
        officers = { ...officers, [officer.id]: { ...cur, loyalty: Math.min(100, cur.loyalty + 3) } };
        entries.push({ cityId: cur.locationCityId, kind: 'talent',
          text: `${officer.name.en} is honored as an Elder Statesman at 60 (loyalty +3).`,
          textZh: `${officer.name.zh}花甲之年,眾推為元老,德高望重(忠誠 +3)。` });
      } else if (age === 70) {
        officers = { ...officers, [officer.id]: { ...cur, loyalty: Math.min(100, cur.loyalty + 3) } };
        const youth = Object.values(officers).find((o) => o.forceId === officer.forceId
          && o.locationCityId === cur.locationCityId && o.id !== officer.id
          && o.status !== 'dead' && o.status !== 'unsearched' && (input.year - o.birthYear) < 30);
        if (youth) officers = { ...officers, [youth.id]: { ...youth, loyalty: Math.min(100, youth.loyalty + 2) } };
        entries.push({ cityId: cur.locationCityId, kind: 'talent',
          text: `${officer.name.en}, a living legend at 70, inspires the young${youth ? ` ${youth.name.en}` : ''} (loyalty +3).`,
          textZh: `${officer.name.zh}古稀之壽,世稱國士${youth ? `,後進${youth.name.zh}景仰` : ''}(忠誠 +3)。` });
      } else { // 80
        officers = { ...officers, [officer.id]: { ...cur, loyalty: Math.min(100, cur.loyalty + 5) } };
        entries.push({ cityId: cur.locationCityId, kind: 'talent',
          text: `${officer.name.en} reaches the rare age of 80 — a marvel that heartens the realm (loyalty +5).`,
          textZh: `${officer.name.zh}耄耋八十,期頤之壽,舉國稱奇(忠誠 +5)。` });
      }
    }

    // T8 — trait-based hardiness / fragility, plus the 壽命長短 dial.
    const lengthMul =
      input.lifespanLength === 'short' ? 1.6 :
      input.lifespanLength === 'long' ? 0.5 : 1.0;
    const chance = deathChance(officer, input.year, age, input.lifespanMode ?? 'historical')
      * deathChanceMultiplier(officer) * lengthMul;
    if (input.rng() >= chance) continue;

    // Officer dies — and their court, if they had one, grants the 諡號.
    // 遺譜傳世 — a master's notes are gathered where they fell (before the
    // dead officer's posting is cleared below).
    legacyDrops.push(...legacyManualDrops(officer, officer.locationCityId));
    // 衣缽傳人 (§6.18) — a named heir is lifted toward the master's mastery. An
    // apprenticeship carries further than the書 a stranger might find (遺譜).
    for (const art of ['martial', 'debate'] as const) {
      const heirId = art === 'martial' ? officer.martialHeirId : officer.debateHeirId;
      const heir = heirId ? officers[heirId] : undefined;
      if (!heir || heir.status === 'dead') continue;
      const masterXw = (art === 'martial' ? officer.martialXiuwei : officer.debateXiuwei) ?? 0;
      const heirXw = (art === 'martial' ? heir.martialXiuwei : heir.debateXiuwei) ?? 0;
      const next = inheritedXiuwei(heirXw, masterXw);
      if (next <= heirXw) continue;
      officers = { ...officers, [heir.id]: { ...heir, ...(art === 'martial' ? { martialXiuwei: next } : { debateXiuwei: next }) } };
      artInheritances.push({ masterId: officer.id, heirId: heir.id, art });
      entries.push({
        cityId: heir.locationCityId,
        kind: 'note',
        text: `${heir.name.en} inherits ${officer.name.en}'s ${art === 'martial' ? 'martial craft' : 'learning'} — the lineage holds.`,
        textZh: `${heir.name.zh} 承 ${officer.name.zh} 之衣缽,${art === 'martial' ? '武學' : '文辯'}修為驟進 — 薪火相傳。`,
      });
    }
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
    const grief = griefOnDeath(officer.id, officer.name.zh, officer.name.en, input.family ?? [], input.runtimeBonds ?? [], officers);
    for (const g of grief) {
      const target = officers[g.targetId];
      if (!target || target.status === 'dead' || !target.forceId) continue;
      officers = {
        ...officers,
        [g.targetId]: { ...target, loyalty: Math.max(0, Math.min(100, target.loyalty + g.delta)) },
      };
      const sign = g.delta >= 0 ? `+${g.delta}` : `${g.delta}`;
      entries.push({
        cityId: target.locationCityId,
        kind: 'note',
        text: `${target.name.en}: ${g.reasonEn} (loyalty ${sign}).`,
        textZh: `${target.name.zh}:${g.reasonZh} (忠誠 ${sign})。`,
      });
      // 殉義 — for a deep sworn bond (義結金蘭+), the bereaved may follow their
      // brother out of the world's affairs. Not for a ruler (would orphan succession).
      if (g.mournDepth && g.mournDepth >= 2) {
        const force = target.forceId ? forces[target.forceId] : undefined;
        const isRuler = force?.rulerOfficerId === target.id;
        const chance = g.mournDepth >= 3 ? 0.25 : 0.10;
        if (!isRuler && input.rng() < chance) {
          officers = { ...officers, [g.targetId]: { ...officers[g.targetId], status: 'retired', task: null } };
          entries.push({
            cityId: target.locationCityId,
            kind: 'note',
            text: `${target.name.en} lays down their arms to mourn ${officer.name.en} — 殉義, withdrawing from service.`,
            textZh: `${target.name.zh}痛失義兄弟${officer.name.zh},心如死灰,自此殉義歸隱。`,
          });
        }
      }
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

    // 遞降襲爵 — a fallen noble's fief passes to a living same-force heir, demoted
    // one tier (世子 preferred; 五大夫 has nothing below it, so that line ends).
    if (officer.peerageId) {
      const inheritedId = demotedPeerage(officer.peerageId);
      if (inheritedId) {
        const eligible = (o?: Officer): o is Officer =>
          !!o && o.status !== 'dead' && o.status !== 'unsearched'
          && o.forceId === officer.forceId
          && peerageTier(o.peerageId) < peerageTier(inheritedId);
        const childIds: EntityId[] = [];
        for (const f of input.family ?? []) {
          if (f.kind === 'parent-child' && f.officerA === officer.id) childIds.push(f.officerB);
        }
        const children = childIds.map((id) => officers[id]).filter(eligible);
        const heir = children.find((o) => o.designatedHeir) ?? children[0];
        if (heir) {
          officers = { ...officers, [heir.id]: { ...officers[heir.id], peerageId: inheritedId } };
          const pd = peerageById(inheritedId);
          entries.push({
            cityId: heir.locationCityId,
            kind: 'talent',
            text: `${heir.name.en} succeeds to ${officer.name.en}'s title, demoted one rank to ${pd?.name.en ?? inheritedId}.`,
            textZh: `${heir.name.zh}遞降襲${officer.name.zh}之爵,封${pd?.name.zh ?? inheritedId}。`,
          });
        }
      }
    }

    // 繼承遺志 — disciples apprenticed to the fallen master channel the loss into
    // resolve: a one-time lift in the master's strongest suit, and the bond ends.
    const legacy = inheritLegacyOnDeath(officer, officers);
    officers = legacy.officers;
    entries.push(...legacy.entries);

    // 託孤 — a venerable elder (70+) on their deathbed entrusts their unfinished
    // cause to the worthiest junior still serving their force: that officer is
    // steadied (+6 loyalty), resolved to carry the torch. (Separate from the
    // ruler-succession path below; fires for any storied elder.)
    if (age >= 70 && officer.forceId) {
      const heir = Object.values(officers)
        .filter((o) => o.forceId === officer.forceId && o.id !== officer.id
          && o.status !== 'dead' && o.status !== 'unsearched')
        .sort((a, b) => b.loyalty - a.loyalty)[0];
      if (heir) {
        officers = { ...officers, [heir.id]: { ...heir, loyalty: Math.min(100, heir.loyalty + 6) } };
        entries.push({
          cityId: heir.locationCityId,
          kind: 'talent',
          text: `On their deathbed, ${officer.name.en} entrusted their cause to ${heir.name.en} (loyalty +6).`,
          textZh: `${officer.name.zh}臨終託孤,以後事相付${heir.name.zh},${heir.name.zh}感而效死(忠誠 +6)。`,
        });
      }
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

  return { cities, officers, forces, entries, legacyDrops, artInheritances };
}

export function deathChance(
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

/** 壽算 — the officer's full yearly death probability (base × trait hardiness ×
 *  壽命長短), exactly as the winter roll computes it. Pure; for UI read-out (D1). */
export function annualDeathChance(
  officer: Officer,
  year: number,
  lifespanMode: 'historical' | 'fictionalImmortal' | 'immortal',
  lifespanLength: 'short' | 'historical' | 'long',
): number {
  const age = year - officer.birthYear;
  const lengthMul = lifespanLength === 'short' ? 1.6 : lifespanLength === 'long' ? 0.5 : 1.0;
  return Math.min(1, deathChance(officer, year, age, lifespanMode) * deathChanceMultiplier(officer) * lengthMul);
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
