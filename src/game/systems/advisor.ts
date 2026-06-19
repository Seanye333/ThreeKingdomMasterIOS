/**
 * 軍師錦囊 — your best mind reads the board and hands you three moves.
 *
 * Each tick the advisor (highest-INT officer in your service) scans for
 * the loudest problems and opportunities; every tip carries a one-tap
 * action that routes through the ordinary order pipeline. The advice is
 * deliberately conservative — the 軍師 never spends what the treasury
 * can't afford and never orders an officer who's already busy.
 */
import type { Army, City, EntityId, InternalAffairsType, Officer, Season } from '../types';
import { COMMAND_DEFS } from './commands';
import { foodRate } from './market';

export interface AdvisorTip {
  id: string;
  /** The advice, in the advisor's voice. */
  zh: string;
  en: string;
  priority: number;
  action:
    | { kind: 'command'; cityId: EntityId; type: InternalAffairsType; officerId: EntityId }
    | { kind: 'trade'; cityId: EntityId; trade: 'buy' | 'sell'; amount: number }
    | { kind: 'none' };
}

export interface AdvisorInput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  armies: Record<EntityId, Army>;
  busyOfficerIds: ReadonlySet<EntityId>;
  playerForceId: EntityId;
  season: Season;
}

/** The voice of the tips — your sharpest mind, or a nameless aide. */
export function pickAdvisor(officers: Record<EntityId, Officer>, playerForceId: EntityId): Officer | null {
  return Object.values(officers)
    .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched')
    .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0] ?? null;
}

function idleIn(input: AdvisorInput, cityId: EntityId): Officer | null {
  return Object.values(input.officers)
    .filter((o) => o.forceId === input.playerForceId
      && o.locationCityId === cityId
      && !o.task
      && (o.status === 'active' || o.status === 'idle')
      && !input.busyOfficerIds.has(o.id))
    .sort((a, b) => b.stats.politics - a.stats.politics)[0] ?? null;
}

export function adviseTips(input: AdvisorInput, max = 3): AdvisorTip[] {
  const tips: AdvisorTip[] = [];
  const own = Object.values(input.cities).filter((c) => c.ownerForceId === input.playerForceId);
  const hostiles = Object.values(input.armies).filter((a) => a.forceId !== input.playerForceId);

  for (const city of own) {
    // ① 兵臨城下 — hostile columns already marching here outnumber the walls.
    const inbound = hostiles.filter((a) => a.targetCityId === city.id && !a.holding)
      .reduce((sum, a) => sum + a.troops, 0);
    if (inbound > city.troops) {
      const officer = idleIn(input, city.id);
      const canAct = officer && city.gold >= COMMAND_DEFS['recruit-troops'].goldCost;
      tips.push({
        id: `threat-${city.id}`,
        zh: `敵軍${Math.round(inbound / 1000)}千之眾正撲${city.name.zh},守軍恐難支 — 宜速徵兵固守。`,
        en: `~${Math.round(inbound / 1000)}k hostiles march on ${city.name.en}; the garrison won't hold. Recruit now.`,
        priority: 100 + inbound / 1000,
        action: canAct
          ? { kind: 'command', cityId: city.id, type: 'recruit-troops', officerId: officer.id }
          : { kind: 'none' },
      });
    }

    // ② 民心浮動 — unrest brewing.
    if (city.loyalty < 50) {
      const officer = idleIn(input, city.id);
      const canAct = officer && city.gold >= COMMAND_DEFS['improve-loyalty'].goldCost;
      tips.push({
        id: `unrest-${city.id}`,
        zh: `${city.name.zh}民忠僅${city.loyalty},恐生民變 — 宜行安撫。`,
        en: `${city.name.en} loyalty is ${city.loyalty}; revolt brews. Soothe it.`,
        priority: 80 + (50 - city.loyalty),
        action: canAct
          ? { kind: 'command', cityId: city.id, type: 'improve-loyalty', officerId: officer.id }
          : { kind: 'none' },
      });
    }

    // ③ 糧將盡 — the granary won't feed the garrison much longer.
    if (city.food < city.troops * 2 && city.gold >= 500) {
      tips.push({
        id: `hunger-${city.id}`,
        zh: `${city.name.zh}存糧不繼(${city.food.toLocaleString()}糧養${(city.troops / 1000).toFixed(1)}千兵)— 宜市易購糧。`,
        en: `${city.name.en} is eating through its stores — buy grain.`,
        priority: 75,
        action: { kind: 'trade', cityId: city.id, trade: 'buy', amount: 500 },
      });
    }

    // ④ 穀賤傷農反着來 — autumn glut + thin purse: sell high stock.
    if (city.gold < 300 && city.food > city.troops * 8 && foodRate(city, input.season) > 0) {
      tips.push({
        id: `glut-${city.id}`,
        zh: `${city.name.zh}倉廩盈而府庫虛 — 宜糶糧充金。`,
        en: `${city.name.en} is grain-rich and gold-poor — sell stock.`,
        priority: 60,
        action: { kind: 'trade', cityId: city.id, trade: 'sell', amount: 5000 },
      });
    }

    // ⑤ 賢才蒙塵 — unsearched officers wait in an own city.
    const hidden = Object.values(input.officers)
      .filter((o) => o.status === 'unsearched' && o.locationCityId === city.id).length;
    if (hidden > 0) {
      const officer = idleIn(input, city.id);
      const canAct = officer && city.gold >= COMMAND_DEFS['search'].goldCost;
      tips.push({
        id: `talent-${city.id}`,
        zh: `聞${city.name.zh}有在野賢士 — 宜遣人尋訪。`,
        en: `Word of hidden talent at ${city.name.en} — send a search.`,
        priority: 50 + hidden * 3,
        action: canAct
          ? { kind: 'command', cityId: city.id, type: 'search', officerId: officer.id }
          : { kind: 'none' },
      });
    }

    // ⑥ 良將閒置 — three or more idle officers in one city is wasted salt.
    const idleCount = Object.values(input.officers)
      .filter((o) => o.forceId === input.playerForceId
        && o.locationCityId === city.id && !o.task
        && (o.status === 'active' || o.status === 'idle')
        && !input.busyOfficerIds.has(o.id)).length;
    if (idleCount >= 3) {
      const officer = idleIn(input, city.id);
      const weakest: InternalAffairsType = city.agriculture <= city.commerce ? 'develop-agriculture' : 'develop-commerce';
      const canAct = officer && city.gold >= COMMAND_DEFS[weakest].goldCost;
      tips.push({
        id: `idle-${city.id}`,
        zh: `${city.name.zh}有${idleCount}員良將賦閒 — 養兵千日,宜遣其勸${weakest === 'develop-agriculture' ? '農' : '商'}。`,
        en: `${idleCount} officers idle at ${city.name.en} — put one to work.`,
        priority: 30,
        action: canAct
          ? { kind: 'command', cityId: city.id, type: weakest, officerId: officer.id }
          : { kind: 'none' },
      });
    }
  }

  // ⑦ 敵城空虛 — a weak neighbour invites ambition (informational).
  const strongest = Math.max(0, ...own.map((c) => c.troops));
  for (const city of own) {
    for (const adjId of city.adjacentCityIds ?? []) {
      const nb = input.cities[adjId];
      if (!nb || !nb.ownerForceId || nb.ownerForceId === input.playerForceId) continue;
      if (nb.troops < strongest * 0.35 && city.troops > nb.troops * 2) {
        tips.push({
          id: `weak-${adjId}`,
          zh: `${nb.name.zh}兵微將寡(僅${(nb.troops / 1000).toFixed(1)}千)而${city.name.zh}兵鋒正盛 — 天予不取,反受其咎。`,
          en: `${nb.name.en} is thinly held; ${city.name.en} could take it.`,
          priority: 40,
          action: { kind: 'none' },
        });
        break;
      }
    }
  }

  // Dedupe by id, sort loudest first, hand over the top N.
  const seen = new Set<string>();
  return tips
    .filter((t2) => (seen.has(t2.id) ? false : (seen.add(t2.id), true)))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max);
}
