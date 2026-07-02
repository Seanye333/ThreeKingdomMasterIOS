/** §8.3-deep 異族內交 — 和親/互市/質子/以夷制夷/入主建國/七擒. */
import { describe, expect, it } from 'vitest';
import type { City, Officer, Force } from '../types';
import { TRIBES_BY_ID } from '../data/tribes';
import { resolveTribeRaids, tickTribeMercenaries } from './tribes';
import {
  emptyTribeDiplomacy,
  canHeqin,
  canRequestHostage,
  canIncite,
  makeHostagePrince,
  tribesShareFrontier,
  resolveTribeClash,
  buildTribalFounding,
  tickTribeMarkets,
  tickTribeHostages,
  rollAITribeIncitement,
  nanmanCaptureText,
  HEQIN_YEARS,
  HOSTAGE_AGGRESSION_CAP,
  type TribeDiplomacyState,
} from './tribesDiplomacy';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 6000, gold: 1000, food: 20000,
    loyalty: 60, population: 80_000, agriculture: 50, commerce: 50, defense: 50,
    adjacentCityIds: [], name: { zh: over.id, en: over.id }, terrain: 'plain',
    ...over,
  } as unknown as City);

const mkOfficer = (id: string, over: Partial<Officer> = {}): Officer =>
  ({
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: 70, war: 80, intelligence: 50, politics: 40, charisma: 60 },
    loyalty: 50, locationCityId: null, forceId: null, status: 'idle',
    task: null, equipment: [], skills: [], rank: 'general',
    ...over,
  } as unknown as Officer);

const qiang = TRIBES_BY_ID['qiang'];
const di = TRIBES_BY_ID['di'];
const nanban = TRIBES_BY_ID['nanban'];

const diplo = (over: Partial<TribeDiplomacyState> = {}): TribeDiplomacyState => ({
  ...emptyTribeDiplomacy(),
  ...over,
});

describe('canHeqin / canRequestHostage / canIncite', () => {
  it('和親 blocks while a marriage still holds, reopens after a generation', () => {
    expect(canHeqin(undefined, 200).ok).toBe(true);
    expect(canHeqin({ marriageYear: 195 }, 200).ok).toBe(false);
    expect(canHeqin({ marriageYear: 200 - HEQIN_YEARS }, 200).ok).toBe(true);
  });

  it('質子 needs a subdued tribe and no living prince already at court', () => {
    expect(canRequestHostage(undefined, 0.3, {}).ok).toBe(false); // too fierce
    expect(canRequestHostage(undefined, 0.1, {}).ok).toBe(true);
    const prince = mkOfficer('p1', { forceId: 'player' });
    expect(canRequestHostage({ hostageOfficerId: 'p1' }, 0.05, { p1: prince }).ok).toBe(false);
    // A dead prince no longer blocks a new request.
    const dead = mkOfficer('p1', { status: 'dead' });
    expect(canRequestHostage({ hostageOfficerId: 'p1' }, 0.05, { p1: dead }).ok).toBe(true);
  });

  it('以夷制夷 needs the target to actually hold the tribe frontier', () => {
    const cities = { jincheng: mkCity({ id: 'jincheng', ownerForceId: 'liang' }) };
    expect(canIncite(qiang, 'liang', cities, 'player').ok).toBe(true);
    expect(canIncite(qiang, 'wu', cities, 'player').ok).toBe(false);
    expect(canIncite(qiang, 'player', cities, 'player').ok).toBe(false);
  });
});

describe('makeHostagePrince', () => {
  it('synthesizes a serving fighter prince', () => {
    const p = makeHostagePrince(qiang, 'luoyang', 'player', 200, () => 0.5);
    expect(p.forceId).toBe('player');
    expect(p.locationCityId).toBe('luoyang');
    expect(p.stats.war).toBeGreaterThanOrEqual(62);
    expect(p.name.zh).toContain('羌');
  });
});

describe('tribesShareFrontier / resolveTribeClash', () => {
  it('羌 and 氐 contest the same frontier; 羌 and 南蠻 do not', () => {
    expect(tribesShareFrontier(qiang, di)).toBe(true);
    expect(tribesShareFrontier(qiang, nanban)).toBe(false);
  });
  it('a clash bleeds both tribes', () => {
    const r = resolveTribeClash(qiang, di, () => 0.5);
    expect(r.dropA).toBeGreaterThan(0.1);
    expect(r.dropB).toBeGreaterThan(0.1);
  });
});

describe('resolveTribeRaids with pacts', () => {
  const raidCity = qiang.raidableCityIds[0];

  it('和親 spares the player cities (raid retargets or stands down)', () => {
    const cities: Record<string, City> = {};
    for (const id of qiang.raidableCityIds) cities[id] = mkCity({ id, ownerForceId: 'player' });
    const out = resolveTribeRaids({
      state: { aggression: { qiang: 0.5 } as never, lastRaidYear: {} },
      cities,
      date: { year: 210, season: 'spring' } as never,
      rng: () => 0.01, // raid always triggers
      diplo: diplo({ pacts: { qiang: { marriageYear: 209 } } }),
      playerForceId: 'player',
      officers: {},
    });
    // Every frontier city is the player's and the marriage holds at 0.5 —
    // the QIANG stand down (other tribes sharing the frontier may still probe
    // and be repulsed, which only RAISES loyalty). No sack, no betrayal.
    for (const id of qiang.raidableCityIds) {
      expect(out.cities[id].ownerForceId).toBe('player');
      expect(out.cities[id].loyalty).toBeGreaterThanOrEqual(60);
    }
    expect(out.brokenMarriages).toHaveLength(0);
  });

  it('submitted tribes never raid and their aggression pins low', () => {
    const cities = { [raidCity]: mkCity({ id: raidCity, ownerForceId: 'player', troops: 100 }) };
    const out = resolveTribeRaids({
      state: { aggression: { qiang: 0.9 } as never, lastRaidYear: {} },
      cities,
      date: { year: 210, season: 'spring' } as never,
      rng: () => 0.01,
      diplo: diplo({ submitted: { qiang: 'player' } }),
      playerForceId: 'player',
      officers: {},
    });
    expect(out.state.aggression.qiang).toBe(0.02);
    expect(out.cities[raidCity].troops).toBe(100);
  });

  it('an incited tribe raids ONLY the paid-for target force', () => {
    const cities: Record<string, City> = {};
    qiang.raidableCityIds.forEach((id, i) => {
      cities[id] = mkCity({ id, ownerForceId: i === 0 ? 'liang' : 'player', troops: 50_000 });
    });
    const out = resolveTribeRaids({
      state: { aggression: { qiang: 0.05 } as never, lastRaidYear: { qiang: 210 } }, // cooldown ignored when incited
      cities,
      date: { year: 210, season: 'summer' } as never,
      rng: () => 0.5, // below the 0.55 incited raid chance
      diplo: diplo({ incitements: { qiang: { byForceId: 'player', targetForceId: 'liang', seasonsLeft: 2 } } }),
      playerForceId: 'player',
      officers: {},
    });
    expect(out.incitementRaids).toContain('qiang');
    // Only the liang-owned frontier city was hit.
    const hit = qiang.raidableCityIds.filter((id) => out.cities[id].troops !== 50_000);
    expect(hit).toEqual([qiang.raidableCityIds[0]]);
  });

  it('a war-fevered horde that crushes a hollow garrison founds a STATE', () => {
    const cities = { [raidCity]: mkCity({ id: raidCity, ownerForceId: 'wei', troops: 10 }) };
    const out = resolveTribeRaids({
      state: { aggression: { qiang: 0.8 } as never, lastRaidYear: {} },
      cities,
      date: { year: 210, season: 'spring' } as never,
      rng: () => 0.01,
      diplo: diplo(),
      playerForceId: 'player',
      officers: {},
    });
    expect(out.foundings).toHaveLength(1);
    expect(out.cities[raidCity].ownerForceId).toBe('tribe-state-qiang');
    expect(out.state.aggression.qiang).toBeCloseTo(qiang.baseAggression * 0.5, 5);
  });
});

describe('buildTribalFounding', () => {
  it('re-purposes a free historical chieftain as the state ruler', () => {
    const chief = mkOfficer('meng-huo');
    const f = buildTribalFounding({
      tribe: nanban,
      city: mkCity({ id: 'jianning' }),
      troops: 4000,
      officers: { 'meng-huo': chief },
      year: 200,
    });
    expect(f.rulerIsExisting).toBe(true);
    expect(f.ruler.id).toBe('meng-huo');
    expect(f.force.id).toBe('tribe-state-nanban');
    expect(f.force.rulerOfficerId).toBe('meng-huo');
  });
  it('synthesizes a king when the chieftain already serves a lord', () => {
    const chief = mkOfficer('meng-huo', { forceId: 'shu' });
    const f = buildTribalFounding({
      tribe: nanban,
      city: mkCity({ id: 'jianning' }),
      troops: 4000,
      officers: { 'meng-huo': chief },
      year: 200,
    });
    expect(f.rulerIsExisting).toBe(false);
    expect(f.ruler.id).toContain('tribe-king-nanban');
  });
});

describe('tickTribeMarkets', () => {
  it('pays the strongest owned frontier city and cools the tribe', () => {
    const host = qiang.raidableCityIds[0];
    const out = tickTribeMarkets({
      diplomacyState: diplo({ pacts: { qiang: { marketOpen: true } } }),
      aggression: { qiang: 0.2 },
      cities: { [host]: mkCity({ id: host, ownerForceId: 'player', gold: 100 }) },
      playerForceId: 'player',
      rng: () => 0.5,
    });
    expect(out.cities[host].gold).toBeGreaterThan(100);
    expect(out.aggression.qiang).toBeLessThan(0.2);
    expect(out.closedTribeIds).toHaveLength(0);
  });
  it('closes itself when the frontier burns', () => {
    const host = qiang.raidableCityIds[0];
    const out = tickTribeMarkets({
      diplomacyState: diplo({ pacts: { qiang: { marketOpen: true } } }),
      aggression: { qiang: 0.7 },
      cities: { [host]: mkCity({ id: host, ownerForceId: 'player' }) },
      playerForceId: 'player',
      rng: () => 0.5,
    });
    expect(out.closedTribeIds).toContain('qiang');
  });
});

describe('tickTribeHostages', () => {
  it('caps aggression while the prince serves', () => {
    const prince = mkOfficer('prince', { forceId: 'player' });
    const out = tickTribeHostages({
      diplomacyState: diplo({ pacts: { qiang: { hostageOfficerId: 'prince' } } }),
      aggression: { qiang: 0.25 },
      officers: { prince },
      playerForceId: 'player',
      rng: () => 0.99,
    });
    expect(out.aggression.qiang).toBe(HOSTAGE_AGGRESSION_CAP);
    expect(out.fledOfficerIds).toHaveLength(0);
  });
  it('a restive tribe calls the prince home', () => {
    const prince = mkOfficer('prince', { forceId: 'player' });
    const out = tickTribeHostages({
      diplomacyState: diplo({ pacts: { qiang: { hostageOfficerId: 'prince' } } }),
      aggression: { qiang: 0.5 },
      officers: { prince },
      playerForceId: 'player',
      rng: () => 0.01, // flee roll passes
    });
    expect(out.fledOfficerIds).toContain('prince');
    expect(out.endedTribeIds).toContain('qiang');
  });
  it('ends the pact quietly when the prince has died', () => {
    const prince = mkOfficer('prince', { forceId: 'player', status: 'dead' });
    const out = tickTribeHostages({
      diplomacyState: diplo({ pacts: { qiang: { hostageOfficerId: 'prince' } } }),
      aggression: { qiang: 0.25 },
      officers: { prince },
      playerForceId: 'player',
      rng: () => 0.99,
    });
    expect(out.endedTribeIds).toContain('qiang');
    expect(out.aggression.qiang).toBe(0.25); // no cap without a living prince
  });
});

describe('rollAITribeIncitement', () => {
  const forces: Record<string, Force> = {
    wei: { id: 'wei', name: { zh: '魏', en: 'Wei' }, color: '#888', capitalCityId: 'x', rulerOfficerId: 'r', isPlayer: false } as Force,
    player: { id: 'player', name: { zh: '我', en: 'Me' }, color: '#fff', capitalCityId: 'y', rulerOfficerId: 'p', isPlayer: true } as Force,
  };
  it('a hostile AI court can sic a tribe on the player frontier', () => {
    const host = qiang.raidableCityIds[0];
    const out = rollAITribeIncitement({
      diplomacyState: diplo(),
      aggression: { qiang: 0.2 },
      cities: { [host]: mkCity({ id: host, ownerForceId: 'player' }) },
      forces,
      playerForceId: 'player',
      relationOf: () => -50,
      rng: () => 0.01,
    });
    expect(out.incitement?.byForceId).toBe('wei');
    expect(out.incitement?.targetForceId).toBe('player');
    expect(out.entry?.textZh).toContain('寇我邊');
  });
  it('friendly relations stay the AI hand', () => {
    const host = qiang.raidableCityIds[0];
    const out = rollAITribeIncitement({
      diplomacyState: diplo(),
      aggression: { qiang: 0.2 },
      cities: { [host]: mkCity({ id: host, ownerForceId: 'player' }) },
      forces,
      playerForceId: 'player',
      relationOf: () => 30,
      rng: () => 0.01,
    });
    expect(out.incitement).toBeNull();
  });
});

describe('tickTribeMercenaries with submission', () => {
  it('a submitted tribe sends doubled auxiliaries regardless of drift', () => {
    const host = nanban.raidableCityIds[0];
    const out = tickTribeMercenaries({
      aggression: { nanban: 0.3 }, // way above the vassal threshold
      cities: { [host]: mkCity({ id: host, ownerForceId: 'player', troops: 1000 }) },
      rng: () => 0.5,
      submitted: { nanban: 'player' },
    });
    expect(out.cities[host].troops).toBeGreaterThan(1000);
    expect(out.entries[0].textZh).toContain('傾心臣服');
  });
});

describe('nanmanCaptureText', () => {
  it('walks the 七擒 arc from defiance to submission', () => {
    expect(nanmanCaptureText(1).zh).toContain('一擒');
    expect(nanmanCaptureText(7).zh).toContain('南人不復反');
  });
});
