import { describe, it, expect } from 'vitest';
import type { City, Force, GameDate, Officer, WarCoalition } from '../types';
import { getRelation, isHostilePermitted } from '../types/diplomacy';
import { canExactTribute } from "./diplomacyPacts";
import {
  evaluateSubjugation,
  evaluateProtection,
  evaluateDemand,
  evaluateCoalitionJoin,
  sealVassalage,
  dissolveVassalage,
  tickVassalRevolt,
  formCoalition,
  tickCoalitions,
  coalitionTargetFor,
  tickAIDemands,
  tickAICoalitionVsPlayer,
  tickAllyRally,
  tickHostages,
  evaluateMediation,
  evaluatePassage,
  passageActive,
  passageReachableTarget,
  passageTargets,
  tickPassageGrants,
  PASSAGE_DURATION_SEASONS,
  evaluatePeaceOffer,
  tickAIPeaceOffers,
  tickCredibilityCascade,
  VASSAL_RELATION_FLOOR,
} from './diplomacyPacts';
import type { PassageGrant } from '../types';

function mkHostage(id: string, forceId: string, hostageOfForceId: string): Officer {
  return {
    id, name: { zh: id, en: id }, forceId,
    stats: { leadership: 50, war: 50, intelligence: 50, politics: 50, charisma: 50 },
    loyalty: 70, status: 'imprisoned', locationCityId: `${hostageOfForceId}-cap`, task: null,
    equipment: [], skills: [], rank: 'soldier', hostageOfForceId,
  } as unknown as Officer;
}

function mkForce(id: string, extra: Partial<Force> = {}): Force {
  return {
    id, name: { zh: id, en: id }, rulerOfficerId: `${id}-ruler`,
    capitalCityId: `${id}-cap`, color: '#fff', isPlayer: false, ...extra,
  } as Force;
}

function mkCity(id: string, ownerForceId: string | null, troops: number, adjacentCityIds: string[] = []): City {
  return { id, name: { zh: id, en: id }, ownerForceId, troops, adjacentCityIds } as City;
}

const DATE: GameDate = { year: 200, season: 'spring' };

describe('evaluateSubjugation (招撫稱臣)', () => {
  it('a crushing power gap + a meek lord makes submission near-certain', () => {
    const r = evaluateSubjugation({
      suzerainTroops: 30000, vassalTroops: 4000, relationScore: 40,
      vassalPersonality: 'cautious', rng: () => 0.5,
    });
    expect(r.accepted).toBe(true);
    expect(r.chance).toBeGreaterThan(0.6);
  });

  it('an even match + a proud tyrant almost never bows', () => {
    const r = evaluateSubjugation({
      suzerainTroops: 9000, vassalTroops: 9000, relationScore: -20,
      vassalPersonality: 'tyrant', grudge: 60, rng: () => 0.5,
    });
    expect(r.accepted).toBe(false);
    expect(r.chance).toBeLessThan(0.2);
  });
});

describe('evaluateProtection (納款稱臣)', () => {
  it('a clear protector pockets a free vassal', () => {
    const r = evaluateProtection({
      protectorTroops: 20000, supplicantTroops: 5000, relationScore: 30, rng: () => 0.5,
    });
    expect(r.accepted).toBe(true);
  });
  it('a bitter grudge makes the strong prefer conquest', () => {
    const r = evaluateProtection({
      protectorTroops: 20000, supplicantTroops: 5000, relationScore: 0, grudge: 95, rng: () => 0.5,
    });
    expect(r.accepted).toBe(false);
  });
});

describe('sealVassalage / dissolveVassalage', () => {
  it('seals the bond, floors the relation to allied, and blocks hostility both ways', () => {
    const forces = { lord: mkForce('lord'), vassal: mkForce('vassal') };
    const { forces: f2, diplomacy } = sealVassalage({
      suzerainId: 'lord', vassalId: 'vassal', forces, diplomacy: { relations: {} },
    });
    expect(f2.vassal.vassalOfForceId).toBe('lord');
    const rel = getRelation(diplomacy, 'lord', 'vassal');
    expect(rel.status).toBe('allied');
    expect(rel.score).toBeGreaterThanOrEqual(VASSAL_RELATION_FLOOR);
    expect(isHostilePermitted(diplomacy, 'lord', 'vassal')).toBe(false);
    expect(isHostilePermitted(diplomacy, 'vassal', 'lord')).toBe(false);
  });

  it('a hostile dissolution clears the bond and craters the relation (war re-opens)', () => {
    const forces = { lord: mkForce('lord'), vassal: mkForce('vassal', { vassalOfForceId: 'lord' }) };
    const { forces: f2, diplomacy } = dissolveVassalage({
      suzerainId: 'lord', vassalId: 'vassal', forces,
      diplomacy: { relations: { lord__vassal: { forceA: 'lord', forceB: 'vassal', score: 70, status: 'allied' } } },
      hostile: true,
    });
    expect(f2.vassal.vassalOfForceId).toBeUndefined();
    expect(isHostilePermitted(diplomacy, 'lord', 'vassal')).toBe(true);
    expect(getRelation(diplomacy, 'lord', 'vassal').score).toBeLessThan(0);
  });
});

describe('tickVassalRevolt (叛附)', () => {
  it('a vassal that has outgrown its lord throws off the yoke', () => {
    const forces = { lord: mkForce('lord'), vassal: mkForce('vassal', { vassalOfForceId: 'lord' }) };
    const cities = {
      lc: mkCity('lc', 'lord', 3000),
      vc: mkCity('vc', 'vassal', 12000), // vassal far stronger now
    };
    const out = tickVassalRevolt({
      forces, cities,
      diplomacy: { relations: { lord__vassal: { forceA: 'lord', forceB: 'vassal', score: 65, status: 'allied' } } },
      discontent: { vassal: 80 },
      rng: () => 0.01, // force the roll through
    });
    expect(out.forces.vassal.vassalOfForceId).toBeUndefined();
    expect(out.grudgeBumps.lord).toBeGreaterThan(0);
    expect(out.entries.length).toBe(1);
  });

  it('a weak, content vassal stays loyal', () => {
    const forces = { lord: mkForce('lord'), vassal: mkForce('vassal', { vassalOfForceId: 'lord' }) };
    const cities = { lc: mkCity('lc', 'lord', 20000), vc: mkCity('vc', 'vassal', 2000) };
    const out = tickVassalRevolt({
      forces, cities, diplomacy: { relations: {} }, discontent: { vassal: 0 }, rng: () => 0.0001,
    });
    expect(out.forces.vassal.vassalOfForceId).toBe('lord');
  });
});

describe('evaluateDemand (最後通牒)', () => {
  it('the weak accede to a silver demand from a giant', () => {
    const r = evaluateDemand({
      demanderTroops: 25000, targetTroops: 5000, relationScore: 0,
      targetPersonality: 'cautious', kind: 'gold', rng: () => 0.5,
    });
    expect(r.accede).toBe(true);
  });
  it('demanding outright submission is far harder than demanding gold', () => {
    const gold = evaluateDemand({ demanderTroops: 18000, targetTroops: 9000, relationScore: 0, kind: 'gold', rng: () => 0.5 });
    const submit = evaluateDemand({ demanderTroops: 18000, targetTroops: 9000, relationScore: 0, kind: 'submit', rng: () => 0.5 });
    expect(submit.chance).toBeLessThan(gold.chance);
  });
});

describe('evaluateCoalitionJoin (會盟)', () => {
  it('a realm that loathes the foe and loves the leader joins eagerly', () => {
    const r = evaluateCoalitionJoin({
      relationToLeader: 70, relationToTarget: -60, grudgeToTarget: 50,
      coalitionTroops: 30000, targetTroops: 12000, rng: () => 0.5,
    });
    expect(r.join).toBe(true);
  });
  it('nobody joins a hopeless siege of a friend', () => {
    const r = evaluateCoalitionJoin({
      relationToLeader: 10, relationToTarget: 40, coalitionTroops: 5000, targetTroops: 40000, rng: () => 0.5,
    });
    expect(r.join).toBe(false);
  });
});

describe('formCoalition / tickCoalitions (聯軍 resolution)', () => {
  it('forming a league opens war with the foe for every member', () => {
    const { coalition, diplomacy } = formCoalition({
      leaderId: 'p', targetId: 'foe', memberIds: ['p', 'ally'],
      diplomacy: { relations: { p__foe: { forceA: 'foe', forceB: 'p', score: 30, status: 'non-aggression' } } },
      date: DATE, year: 200,
    });
    expect(coalition.memberForceIds).toContain('ally');
    expect(isHostilePermitted(diplomacy, 'p', 'foe')).toBe(true);
    expect(isHostilePermitted(diplomacy, 'ally', 'foe')).toBe(true);
  });

  it('the foe falling crowns the 盟主 (credibility + mandate); the league disbands', () => {
    const coalition: WarCoalition = {
      leaderForceId: 'p', targetForceId: 'foe', memberForceIds: ['p', 'ally'],
      startedYear: 200, expiresAt: { year: 202, season: 'spring' },
    };
    const out = tickCoalitions({
      coalitions: [coalition], forces: { p: mkForce('p') } as Record<string, Force>,
      cities: { c: mkCity('c', 'p', 5000) }, // foe holds no cities → wiped
      date: DATE,
    });
    expect(out.coalitions).toHaveLength(0);
    expect(out.credibilityDelta.p).toBeGreaterThan(0);
    expect(out.mandateDelta.p).toBeGreaterThan(0);
  });

  it('expiry with the foe alive shames the 盟主 and disbands the league', () => {
    const coalition: WarCoalition = {
      leaderForceId: 'p', targetForceId: 'foe', memberForceIds: ['p'],
      startedYear: 200, expiresAt: { year: 200, season: 'spring' }, // already due
    };
    const out = tickCoalitions({
      coalitions: [coalition], forces: { p: mkForce('p'), foe: mkForce('foe') },
      cities: { fc: mkCity('fc', 'foe', 5000) }, // foe still alive
      date: { year: 201, season: 'spring' },
    });
    expect(out.coalitions).toHaveLength(0);
    expect(out.credibilityDelta.p).toBeLessThan(0);
  });

  it('coalitionTargetFor finds a member’s sworn foe', () => {
    const coalition: WarCoalition = {
      leaderForceId: 'p', targetForceId: 'foe', memberForceIds: ['p', 'ally'],
      startedYear: 200, expiresAt: DATE,
    };
    expect(coalitionTargetFor('ally', [coalition])).toBe('foe');
    expect(coalitionTargetFor('stranger', [coalition])).toBeNull();
  });
});

describe('AI reciprocity', () => {
  // A bordered pair: player 'p' and a much stronger bully 'b'.
  const reciprocityWorld = () => ({
    forces: {
      p: mkForce('p', { isPlayer: true }),
      b: mkForce('b', { personality: 'tyrant' }),
    } as Record<string, Force>,
    cities: {
      pc: mkCity('pc', 'p', 4000, ['bc']),
      bc: mkCity('bc', 'b', 16000, ['pc']),
    },
  });

  it('tickAIDemands: a far stronger warlike neighbour presses an ultimatum on the player', () => {
    const w = reciprocityWorld();
    const out = tickAIDemands({
      forces: w.forces, cities: w.cities, diplomacy: { relations: {} },
      playerForceId: 'p', existing: [], date: DATE, rng: () => 0.01,
    });
    expect(out).toHaveLength(1);
    expect(out[0].fromForceId).toBe('b');
  });

  it('tickAIDemands: a peace-courting neighbour does NOT extort, and a bound one is exempt', () => {
    const w = reciprocityWorld();
    w.forces.b = mkForce('b', { personality: 'cautious' }); // courts peace
    const peaceful = tickAIDemands({ forces: w.forces, cities: w.cities, diplomacy: { relations: {} }, playerForceId: 'p', existing: [], date: DATE, rng: () => 0.01 });
    expect(peaceful).toHaveLength(0);
    // Already at NAP → no extortion either.
    const w2 = reciprocityWorld();
    const napped = tickAIDemands({
      forces: w2.forces, cities: w2.cities,
      diplomacy: { relations: { b__p: { forceA: 'b', forceB: 'p', score: 0, status: 'non-aggression' } } },
      playerForceId: 'p', existing: [], date: DATE, rng: () => 0.01,
    });
    expect(napped).toHaveLength(0);
  });

  it('tickAICoalitionVsPlayer: a dominant player draws a league led by the strongest free rival', () => {
    const forces = {
      p: mkForce('p', { isPlayer: true }),
      a: mkForce('a', { personality: 'aggressive' }),
      c: mkForce('c', { personality: 'opportunist' }),
    } as Record<string, Force>;
    const cities = {
      pc: mkCity('pc', 'p', 30000, ['ac', 'cc']),
      ac: mkCity('ac', 'a', 12000, ['pc', 'cc']),
      cc: mkCity('cc', 'c', 9000, ['pc', 'ac']),
    };
    const out = tickAICoalitionVsPlayer({
      forces, cities, diplomacy: { relations: {} }, grudges: { a: 40, c: 30 },
      coalitions: [], playerForceId: 'p', date: DATE, year: 200, rng: () => 0.01,
    });
    expect(out).not.toBeNull();
    expect(out!.coalition.targetForceId).toBe('p');
    expect(out!.coalition.memberForceIds.length).toBeGreaterThanOrEqual(2);
  });

  it('tickAICoalitionVsPlayer: no league when the player is not the front-runner', () => {
    const forces = { p: mkForce('p', { isPlayer: true }), a: mkForce('a') } as Record<string, Force>;
    const cities = { pc: mkCity('pc', 'p', 8000, ['ac']), ac: mkCity('ac', 'a', 20000, ['pc']) };
    const out = tickAICoalitionVsPlayer({ forces, cities, diplomacy: { relations: {} }, coalitions: [], playerForceId: 'p', date: DATE, year: 200, rng: () => 0.01 });
    expect(out).toBeNull();
  });

  it('tickAllyRally: an AI ally bordering the player’s stronger foe marches to relieve them', () => {
    const forces = {
      p: mkForce('p', { isPlayer: true }),
      ally: mkForce('ally'),
      foe: mkForce('foe'),
    } as Record<string, Force>;
    const cities = {
      pc: mkCity('pc', 'p', 5000, ['fc']),
      fc: mkCity('fc', 'foe', 14000, ['pc', 'ac']),
      ac: mkCity('ac', 'ally', 8000, ['fc']),
    };
    const out = tickAllyRally({
      forces, cities,
      diplomacy: { relations: { ally__p: { forceA: 'ally', forceB: 'p', score: 70, status: 'allied' } } },
      playerForceId: 'p', rng: () => 0.01,
    });
    expect(out.entries.length).toBe(1);
    // The ally is now at war with the foe.
    expect(isHostilePermitted(out.diplomacy, 'ally', 'foe')).toBe(true);
  });
});

describe('evaluateMediation (調停斡旋)', () => {
  it('a weighty broker the foe respects brokers a thaw', () => {
    const r = evaluateMediation({
      brokerTroops: 20000, foeTroops: 8000, brokerRelationToFoe: 50,
      foeGrudge: 10, foeRelationToPlayer: 0, rng: () => 0.5,
    });
    expect(r.success).toBe(true);
  });
  it('a slight broker fails against an implacable foe', () => {
    const r = evaluateMediation({
      brokerTroops: 3000, foeTroops: 12000, brokerRelationToFoe: -10,
      foeGrudge: 90, foeRelationToPlayer: -40, rng: () => 0.5,
    });
    expect(r.success).toBe(false);
  });
});

describe('假途・借道 (passage, §7.1 B)', () => {
  // p(player) — a(ally grantor) — e(enemy beyond the ally). p borders a; a borders e.
  const world = {
    pc: mkCity('pc', 'p', 5000, ['ac']),
    ac: mkCity('ac', 'a', 6000, ['pc', 'ec']),
    ec: mkCity('ec', 'e', 4000, ['ac']),
  } as Record<string, ReturnType<typeof mkCity>>;
  const grant: PassageGrant = { grantorForceId: 'a', granteeForceId: 'p', expiresAt: { year: 205, season: 'spring' } };

  it('evaluatePassage: an ally lends the road readily; a neutral never does', () => {
    expect(evaluatePassage({ relStatus: 'allied', relScore: 60, rng: () => 0.5 }).granted).toBe(true);
    expect(evaluatePassage({ relStatus: 'neutral', relScore: 90, rng: () => 0.01 }).granted).toBe(false);
  });

  it('passageReachableTarget: a foe bordering the grantor is a transit target; the grantor itself is a betrayal target', () => {
    const transit = passageReachableTarget([grant], 'p', 'ec', world);
    expect(transit.reachable).toBe(true);
    expect(transit.betrayal).toBe(false);
    const betray = passageReachableTarget([grant], 'p', 'ac', world);
    expect(betray.reachable).toBe(true);
    expect(betray.betrayal).toBe(true);
  });

  it('passageReachableTarget: no grant → nothing reachable', () => {
    expect(passageReachableTarget([], 'p', 'ec', world).reachable).toBe(false);
  });

  it('passageTargets: lists the foe (借道) and the host border city (假途) from the corridor source', () => {
    const targets = passageTargets([grant], 'p', 'pc', world);
    const ids = targets.map((x) => x.cityId).sort();
    expect(ids).toEqual(['ac', 'ec']);
    expect(targets.find((x) => x.cityId === 'ec')?.betrayal).toBe(false);
    expect(targets.find((x) => x.cityId === 'ac')?.betrayal).toBe(true);
  });

  it('passageActive / tickPassageGrants: a grant lapses past its term', () => {
    expect(passageActive([grant], 'p', 'a')).toBe(true);
    const kept = tickPassageGrants({ grants: [grant], cities: world, forces: { a: mkForce('a'), p: mkForce('p') }, date: { year: 204, season: 'winter' } });
    expect(kept).toHaveLength(1); // before expiry
    const lapsed = tickPassageGrants({ grants: [grant], cities: world, forces: { a: mkForce('a'), p: mkForce('p') }, date: { year: 205, season: 'summer' } });
    expect(lapsed).toHaveLength(0); // past expiry
    expect(PASSAGE_DURATION_SEASONS).toBe(8);
  });
});

describe('① 天子敕令 (imperial sanction)', () => {
  it('imperial sanction lifts a demand/subjugation that would otherwise just fail', () => {
    const base = { demanderTroops: 9000, targetTroops: 9000, relationScore: 0, kind: 'gold' as const, rng: () => 0.5 };
    const plain = evaluateDemand(base);
    const sanctioned = evaluateDemand({ ...base, imperialSanction: 0.25 });
    expect(sanctioned.chance).toBeGreaterThan(plain.chance);
    const subPlain = evaluateSubjugation({ suzerainTroops: 12000, vassalTroops: 8000, relationScore: 10, rng: () => 0.5 });
    const subImp = evaluateSubjugation({ suzerainTroops: 12000, vassalTroops: 8000, relationScore: 10, imperialSanction: 0.25, rng: () => 0.5 });
    expect(subImp.chance).toBeGreaterThan(subPlain.chance);
  });
});

describe('④ 信譽連鎖 (credibility cascade)', () => {
  it('a low-credibility realm cools its allies and stirs its vassals', () => {
    const forces = { p: mkForce('p'), ally: mkForce('ally'), vas: mkForce('vas', { vassalOfForceId: 'p' }) } as Record<string, Force>;
    const out = tickCredibilityCascade({
      credibility: { p: 15 },
      diplomacy: { relations: { ally__p: { forceA: 'ally', forceB: 'p', score: 70, status: 'allied' } } },
      forces, discontent: {}, playerForceId: 'p',
    });
    expect(getRelation(out.diplomacy, 'ally', 'p').score).toBeLessThan(70);
    expect(out.discontent.vas).toBeGreaterThan(0);
    expect(out.entries.length).toBe(1);
  });
  it('a trusted realm (high credibility) suffers no cascade', () => {
    const out = tickCredibilityCascade({ credibility: { p: 90 }, diplomacy: { relations: {} }, forces: { p: mkForce('p') }, discontent: {}, playerForceId: 'p' });
    expect(out.entries.length).toBe(0);
  });
});

describe('②′ 求和乞降 (sue for peace)', () => {
  it('a foe that is losing accepts terms; one winning big fights on', () => {
    const losing = evaluatePeaceOffer({ suerTroops: 18000, foeTroops: 7000, foeRelation: 0, foeGrudge: 10, reparations: 800, rng: () => 0.5 });
    expect(losing.accepted).toBe(true);
    const winning = evaluatePeaceOffer({ suerTroops: 5000, foeTroops: 20000, foeRelation: -30, foeGrudge: 70, rng: () => 0.5 });
    expect(winning.accepted).toBe(false);
  });

  it('tickAIPeaceOffers: a beaten, embittered, much-weaker neighbour sues — desperate ones offer submission', () => {
    const forces = { p: mkForce('p', { isPlayer: true }), f: mkForce('f') } as Record<string, Force>;
    const cities = { pc: mkCity('pc', 'p', 20000, ['fc']), fc: mkCity('fc', 'f', 3000, ['pc']) };
    const out = tickAIPeaceOffers({ forces, cities, diplomacy: { relations: {} }, grudges: { f: 70 }, playerForceId: 'p', existing: [], date: DATE, rng: () => 0.01 });
    expect(out).toHaveLength(1);
    expect(out[0].fromForceId).toBe('f');
    expect(out[0].kind).toBe('vassal'); // very weak + high grudge → desperate
  });

  it('tickAIPeaceOffers: a strong, ungrieved neighbour does not sue', () => {
    const forces = { p: mkForce('p', { isPlayer: true }), f: mkForce('f') } as Record<string, Force>;
    const cities = { pc: mkCity('pc', 'p', 9000, ['fc']), fc: mkCity('fc', 'f', 9000, ['pc']) };
    const out = tickAIPeaceOffers({ forces, cities, diplomacy: { relations: {} }, grudges: { f: 5 }, playerForceId: 'p', existing: [], date: DATE, rng: () => 0.01 });
    expect(out).toHaveLength(0);
  });
});

describe('tickHostages (質子 upkeep)', () => {
  const world = () => ({
    forces: { home: mkForce('home'), holder: mkForce('holder') } as Record<string, Force>,
    cities: { 'home-cap': mkCity('home-cap', 'home', 5000), 'holder-cap': mkCity('holder-cap', 'holder', 5000) },
  });

  it('frees the hostage when the keeper realm falls', () => {
    const w = world();
    const officers = { h: mkHostage('h', 'home', 'holder') };
    const out = tickHostages({ officers, forces: w.forces, cities: { 'home-cap': w.cities['home-cap'] }, rng: () => 0.99 });
    expect(out.officers.h.hostageOfForceId).toBeUndefined();
    expect(out.officers.h.status).toBe('idle');
    expect(out.entries.length).toBe(1);
  });

  it('lets a hostage escape home on a low roll', () => {
    const w = world();
    const officers = { h: mkHostage('h', 'home', 'holder') };
    const out = tickHostages({ officers, forces: w.forces, cities: w.cities, rng: () => 0.01 });
    expect(out.officers.h.hostageOfForceId).toBeUndefined();
    expect(out.officers.h.locationCityId).toBe('home-cap');
  });

  it('keeps a content hostage in place on a high roll', () => {
    const w = world();
    const officers = { h: mkHostage('h', 'home', 'holder') };
    const out = tickHostages({ officers, forces: w.forces, cities: w.cities, rng: () => 0.99 });
    expect(out.officers.h.hostageOfForceId).toBe('holder');
    expect(out.entries.length).toBe(0);
  });
});

describe('§7.1-deep AC canExactTribute — 勒索歲貢 needs leverage', () => {
  it('a decisive troop edge OR a casus belli lets you extort; parity does not', () => {
    expect(canExactTribute(20000, 10000, false)).toBe(true);   // ~2× troops
    expect(canExactTribute(9000, 10000, true)).toBe(true);     // war-marked (討伐令)
    expect(canExactTribute(11000, 10000, false)).toBe(false);  // near parity, no CB
    expect(canExactTribute(5000, 10000, false)).toBe(false);   // weaker
  });
});
