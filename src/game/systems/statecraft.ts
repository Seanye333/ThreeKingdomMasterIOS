import type { City, EntityId, Force, Officer } from '../types';
import { statecraftById, statecraftScale, STATECRAFT_MASTERY_MAX, type StatecraftSchool } from '../data/statecraft';
import { deriveDoctrine, type Doctrine } from '../data/officerAttributes';

/**
 * 治國理念 loop — once a season each realm that has chosen a school of statecraft
 * applies its slant to every city it holds (民心 / 稅入 / 倉廩 / 耕戰), and the
 * scholars whose 主義 aligns with the creed grow more loyal — while those whose
 * 主義 it offends cool toward it (§7.9-deep J). A realm's 造詣 (mastery) climbs
 * each season it keeps the faith, scaling every effect (§7.9-deep I). Pure.
 */
export function doctrineOf(o: Officer): Doctrine {
  return o.doctrine ?? deriveDoctrine(o.stats, o.id);
}

export interface StatecraftTickResult {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** §7.9-deep I — updated 造詣 per realm that holds a school (forceId → mastery). */
  mastery: Record<EntityId, number>;
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
}

export function tickStatecraft(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** §7.9-deep K — forces that hold a 太學/書院 (mastery climbs faster). */
  academyForces?: Set<EntityId>;
}): StatecraftTickResult {
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const mastery: Record<EntityId, number> = {};
  const entries: StatecraftTickResult['entries'] = [];

  for (const force of Object.values(input.forces)) {
    const def = statecraftById(force.statecraft);
    if (!def) continue;

    // §7.9-deep I 造詣 — climb this season, then scale the school's effects by it.
    const prev = force.statecraftMastery ?? 0;
    const climb = (input.academyForces?.has(force.id) ? 6 : 3) * (prev < 60 ? 1 : 0.5);
    const m = Math.max(0, Math.min(STATECRAFT_MASTERY_MAX, prev + climb));
    mastery[force.id] = m;
    const scale = statecraftScale(m);
    const pc = def.perCity;
    const sGold = Math.round(pc.gold * scale);
    const sFood = Math.round(pc.food * scale);
    const sTroops = Math.round(pc.troops * scale);
    const sLoyalty = pc.cityLoyalty; // a flat ±1–2 drift; mastery shapes the floor instead

    for (const c of Object.values(cities)) {
      if (c.ownerForceId !== force.id) continue;
      let loyalty = c.loyalty;
      if (sLoyalty !== 0) loyalty = Math.max(0, Math.min(100, loyalty + sLoyalty));
      // 嚴明法度 — the order floor rises with mastery (a green legalism barely holds).
      const floor = pc.orderFloor ? Math.round(pc.orderFloor * scale) : 0;
      if (floor && loyalty < floor) loyalty = Math.min(floor, loyalty + 2);
      cities[c.id] = {
        ...c,
        loyalty,
        gold: c.gold + sGold,
        food: c.food + sFood,
        troops: c.troops + sTroops,
      };
    }

    // 主義之向背 — congenial scholars rally; offended ones cool (§7.9-deep J).
    const favored = new Set(def.favoredDoctrines);
    const opposed = new Set(def.opposedDoctrines);
    const clashDrain = m >= 60 ? 2 : 1; // a deeply-committed creed alienates harder
    for (const o of Object.values(officers)) {
      if (o.forceId !== force.id) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      const doc = doctrineOf(o);
      if (favored.has(doc)) officers[o.id] = { ...o, loyalty: Math.max(0, Math.min(100, o.loyalty + 1)) };
      else if (opposed.has(doc)) officers[o.id] = { ...o, loyalty: Math.max(0, Math.min(100, o.loyalty - clashDrain)) };
    }
  }

  return { cities, officers, mastery, entries };
}

/** Recruit-success bonus a realm's school of statecraft lends, scaled by 造詣. */
export function statecraftRecruitBonus(school: StatecraftSchool | undefined | null, mastery?: number): number {
  const base = statecraftById(school)?.recruitBonus ?? 0;
  return base * statecraftScale(mastery);
}
