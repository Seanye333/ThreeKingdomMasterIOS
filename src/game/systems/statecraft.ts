import type { City, EntityId, Force, Officer } from '../types';
import { statecraftById, type StatecraftSchool } from '../data/statecraft';
import { deriveDoctrine, type Doctrine } from '../data/officerAttributes';

/**
 * 治國理念 loop — once a season each realm that has chosen a school of statecraft
 * applies its slant to every city it holds (民心 / 稅入 / 倉廩 / 耕戰), and the
 * scholars whose 主義 aligns with the creed grow more loyal. Pure.
 */
function doctrineOf(o: Officer): Doctrine {
  return o.doctrine ?? deriveDoctrine(o.stats, o.id);
}

export interface StatecraftTickResult {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
}

export function tickStatecraft(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
}): StatecraftTickResult {
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const entries: StatecraftTickResult['entries'] = [];

  for (const force of Object.values(input.forces)) {
    const def = statecraftById(force.statecraft);
    if (!def) continue;
    const pc = def.perCity;

    for (const c of Object.values(cities)) {
      if (c.ownerForceId !== force.id) continue;
      let loyalty = c.loyalty;
      if (pc.cityLoyalty !== 0) loyalty = Math.max(0, Math.min(100, loyalty + pc.cityLoyalty));
      if (pc.orderFloor && loyalty < pc.orderFloor) loyalty = Math.min(pc.orderFloor, loyalty + 2);
      cities[c.id] = {
        ...c,
        loyalty,
        gold: c.gold + pc.gold,
        food: c.food + pc.food,
        troops: c.troops + pc.troops,
      };
    }

    // Doctrine-matched scholars rally to a congenial creed.
    const favored = new Set(def.favoredDoctrines);
    for (const o of Object.values(officers)) {
      if (o.forceId !== force.id) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      if (!favored.has(doctrineOf(o))) continue;
      officers[o.id] = { ...o, loyalty: Math.max(0, Math.min(100, o.loyalty + 1)) };
    }
  }

  return { cities, officers, entries };
}

/** Recruit-success bonus a realm's school of statecraft lends. Pure. */
export function statecraftRecruitBonus(school: StatecraftSchool | undefined | null): number {
  return statecraftById(school)?.recruitBonus ?? 0;
}
