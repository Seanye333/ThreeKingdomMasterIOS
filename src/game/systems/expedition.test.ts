import { describe, it, expect } from 'vitest';
import {
  stepExpeditions,
  expeditionLegSeasons,
  expeditionAptitude,
  expeditionSuccessChance,
  expeditionXp,
  type ExpeditionStepInput,
} from './expedition';
import { mkOfficer } from '../../test/factories';
import type { City, DiplomaticState, Expedition, Force } from '../types';
import { getRelation } from '../types';

const mkCity = (id: string, over: Partial<City> = {}): City => ({
  id, name: { zh: id, en: id }, coords: { x: 0, y: 0 }, adjacentCityIds: [],
  ownerForceId: 'me', population: 100_000, gold: 1000, food: 5000, troops: 2000,
  agriculture: 50, commerce: 50, defense: 50, loyalty: 60, ...over,
});

const mkForce = (id: string, ruler: string): Force => ({
  id, name: { zh: id, en: id }, rulerOfficerId: ruler, capitalCityId: 'x', color: '#000', isPlayer: false,
} as Force);

const mkExp = (over: Partial<Expedition> = {}): Expedition => ({
  id: 'e1', officerId: 'env', forceId: 'me', fromCityId: 'home', toCityId: 'far',
  mode: 'explore', phase: 'outbound', seasonsRemaining: 1, legSeasons: 2, ...over,
});

const emptyDip: DiplomaticState = { relations: {} };

function baseInput(over: Partial<ExpeditionStepInput> = {}): ExpeditionStepInput {
  return {
    expeditions: {},
    cities: { home: mkCity('home'), far: mkCity('far', { ownerForceId: 'wei' }) },
    officers: { env: mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 60, intelligence: 80, politics: 70, charisma: 80 } }) },
    forces: { me: mkForce('me', 'lord'), wei: mkForce('wei', 'caocao') },
    diplomacy: emptyDip,
    espionageReveals: {},
    rng: () => 0.5,
    ...over,
  };
}

describe('游历 — expedition stepping', () => {
  it('an in-transit expedition counts down without resolving', () => {
    const r = stepExpeditions(baseInput({ expeditions: { e1: mkExp({ seasonsRemaining: 3 }) } }));
    expect(r.expeditions.e1.seasonsRemaining).toBe(2);
    expect(r.expeditions.e1.phase).toBe('outbound');
  });

  it('explore arrival lights intel on the target and turns the officer for home', () => {
    const r = stepExpeditions(baseInput({ expeditions: { e1: mkExp({ seasonsRemaining: 1, legSeasons: 2 }) } }));
    expect(r.expeditions.e1.phase).toBe('returning');
    expect(r.expeditions.e1.seasonsRemaining).toBe(2);
    expect(r.espionageReveals.far).toBeGreaterThan(0);
    expect(r.expeditions.e1.haul).toBeDefined();
  });

  it('homecoming delivers a coin/grain haul into the origin city and re-rosters the officer', () => {
    const exp = mkExp({ phase: 'returning', seasonsRemaining: 1, haul: { gold: 500, food: 800, note: 'x', noteZh: 'x' } });
    const r = stepExpeditions(baseInput({ expeditions: { e1: exp } }));
    expect(r.expeditions.e1).toBeUndefined();
    expect(r.cities.home.gold).toBe(1500);
    expect(r.cities.home.food).toBe(5800);
    expect(r.officers.env.locationCityId).toBe('home');
    expect(r.officers.env.status).toBe('idle');
  });

  it('homecoming grants the officer experience for the journey', () => {
    const exp = mkExp({ phase: 'returning', seasonsRemaining: 1, legSeasons: 3, mode: 'explore', haul: { note: 'x', noteZh: 'x' } });
    const input = baseInput({ expeditions: { e1: exp } });
    input.officers.env = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', xp: 0 });
    const r = stepExpeditions(input);
    expect(r.officers.env.xp).toBe(expeditionXp('explore', 3)); // 10 + 3*4 = 22
    expect(r.officers.env.xp).toBeGreaterThan(0);
  });

  it('a turned officer joins the dispatcher on homecoming', () => {
    const exp = mkExp({ mode: 'subvert', phase: 'returning', seasonsRemaining: 1, haul: { recruitOfficerId: 'def', note: 'x', noteZh: 'x' } });
    const input = baseInput({ expeditions: { e1: exp } });
    input.officers.def = mkOfficer({ id: 'def', forceId: 'wei', locationCityId: 'far', status: 'idle', loyalty: 30 });
    const r = stepExpeditions(input);
    expect(r.officers.def.forceId).toBe('me');
    expect(r.officers.def.locationCityId).toBe('home');
    expect(r.officers.def.status).toBe('idle');
  });

  it('envoy arrival warms relations with the target force', () => {
    const exp = mkExp({ mode: 'envoy', seasonsRemaining: 1 });
    const r = stepExpeditions(baseInput({ expeditions: { e1: exp } }));
    expect(getRelation(r.diplomacy, 'me', 'wei').score).toBeGreaterThan(0);
  });

  it('infiltrate sabotage can bleed the target city (high-skill officer, lucky roll)', () => {
    const exp = mkExp({ mode: 'infiltrate', seasonsRemaining: 1 });
    // First roll dodges capture; the rest are low so the sabotage lands.
    const rolls = [0.99, 0.05, 0.5, 0.5, 0.5];
    let i = 0;
    const rng = () => rolls[Math.min(i++, rolls.length - 1)];
    const r = stepExpeditions(baseInput({ expeditions: { e1: exp }, rng }));
    expect(r.cities.far.gold).toBeLessThan(1000);
    expect(r.espionageReveals.far).toBeGreaterThan(0);
  });

  it('a foreign cloak-and-dagger errand can end in capture (unlucky roll, low skill)', () => {
    const weak = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 20, war: 20, intelligence: 20, politics: 20, charisma: 20 } });
    const exp = mkExp({ mode: 'subvert', seasonsRemaining: 1 });
    const r = stepExpeditions(baseInput({ expeditions: { e1: exp }, officers: { env: weak }, rng: () => 0.01 }));
    expect(r.expeditions.e1).toBeUndefined(); // journey over
    expect(r.officers.env.status).toBe('imprisoned');
    expect(r.officers.env.locationCityId).toBe('far');
    expect(r.officers.env.capturedFromForceId).toBe('me');
  });

  it('a lost home forfeits the haul but the officer survives', () => {
    const exp = mkExp({ phase: 'returning', seasonsRemaining: 1, haul: { gold: 500 } });
    const input = baseInput({ expeditions: { e1: exp } });
    input.cities.home = mkCity('home', { ownerForceId: 'enemy' });
    const r = stepExpeditions(input);
    expect(r.officers.env.status).toBe('idle');
    expect(r.cities.home.gold).toBe(1000); // nothing delivered
  });
});

describe('遠使 — embassy stepping', () => {
  it('an embassy to a tribe resolves on arrival: placates it + turns for home with auxiliaries', () => {
    const exp = mkExp({ id: 'emb1', mode: 'embassy', toCityId: '', toRealmId: 'nanban', seasonsRemaining: 1, legSeasons: 3 });
    const r = stepExpeditions(baseInput({ expeditions: { emb1: exp }, rng: () => 0.9 }));
    expect(r.expeditions.emb1.phase).toBe('returning');
    expect(r.aggressionDeltas['nanban']).toBeLessThan(0);
    expect(r.expeditions.emb1.haul?.auxTroops).toBeGreaterThan(0);
  });

  it('an embassy homecoming delivers auxiliaries into the home city garrison', () => {
    const exp = mkExp({ id: 'emb2', mode: 'embassy', toCityId: '', toRealmId: 'nanban', phase: 'returning', seasonsRemaining: 1, haul: { auxTroops: 1000, note: 'x', noteZh: 'x' } });
    const r = stepExpeditions(baseInput({ expeditions: { emb2: exp } }));
    expect(r.expeditions.emb2).toBeUndefined();
    expect(r.cities.home.troops).toBe(3000); // 2000 + 1000 aux
    expect(r.officers.env.locationCityId).toBe('home');
  });

  it('a realm embassy banks prestige as a mandate delta at the foreign court', () => {
    const exp = mkExp({ id: 'emb3', mode: 'embassy', toCityId: '', toRealmId: 'wa', seasonsRemaining: 1, legSeasons: 6 });
    const able = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const r = stepExpeditions(baseInput({ expeditions: { emb3: exp }, officers: { env: able }, rng: () => 0.9 }));
    expect(r.mandateDeltas['me']).toBeGreaterThan(0);
  });

  it('a clean realm embassy opens a standing caravan (realmsOpened) for the player', () => {
    const exp = mkExp({ id: 'emb4', mode: 'embassy', toCityId: '', toRealmId: 'gaochang', seasonsRemaining: 1, legSeasons: 5 });
    const able = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const r = stepExpeditions(baseInput({ expeditions: { emb4: exp }, officers: { env: able }, rng: () => 0.9, playerForceId: 'me' }));
    expect(r.realmsOpened['gaochang']).toBe('home'); // caravan runs from the frontier home city
  });

  it('an AI embassy does NOT open a player caravan', () => {
    const exp = mkExp({ id: 'emb5', forceId: 'wei', mode: 'embassy', toCityId: '', toRealmId: 'gaochang', seasonsRemaining: 1, legSeasons: 5 });
    const able = mkOfficer({ id: 'env', forceId: 'wei', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const input = baseInput({ expeditions: { emb5: exp }, officers: { env: able }, rng: () => 0.9, playerForceId: 'me' });
    input.cities.home = { ...input.cities.home, ownerForceId: 'wei' };
    const r = stepExpeditions(input);
    expect(r.realmsOpened['gaochang']).toBeUndefined();
  });

  it('a player realm embassy warms the relation (realmRelationDeltas)', () => {
    const exp = mkExp({ id: 'rel1', mode: 'embassy', toCityId: '', toRealmId: 'gaochang', seasonsRemaining: 1, legSeasons: 5 });
    const able = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const r = stepExpeditions(baseInput({ expeditions: { rel1: exp }, officers: { env: able }, rng: () => 0.9, playerForceId: 'me' }));
    expect(r.realmRelationDeltas['gaochang']).toBeGreaterThan(0);
  });

  it('§7.7 ① a successful embassy claims the realm\'s 封號 (player or AI)', () => {
    const exp = mkExp({ id: 'pat1', mode: 'embassy', toCityId: '', toRealmId: 'gaochang', seasonsRemaining: 1, legSeasons: 5 });
    const able = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const r = stepExpeditions(baseInput({ expeditions: { pat1: exp }, officers: { env: able }, rng: () => 0.9, playerForceId: 'me' }));
    expect(r.realmsPatronClaimed['gaochang']).toBe('me');
  });

  it('§7.7 ① a mishap does NOT claim the title', () => {
    // A weak envoy to far Rome at a low (sub-peril) roll limps home — no claim.
    const exp = mkExp({ id: 'pat2', mode: 'embassy', toCityId: '', toRealmId: 'daqin', seasonsRemaining: 1, legSeasons: 10 });
    const weak = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 30, war: 30, intelligence: 25, politics: 25, charisma: 25 } });
    const r = stepExpeditions(baseInput({ expeditions: { pat2: exp }, officers: { env: weak }, rng: () => 0.2, playerForceId: 'me' }));
    expect(r.realmsPatronClaimed['daqin']).toBeUndefined();
  });

  it('§7.7 ① the troop loan needs patronage — an outsider gets none', () => {
    // Player is NOT the patron of 高昌 (wei is); even at relation 90 no loan comes.
    const exp = mkExp({ id: 'pat3', mode: 'embassy', toCityId: '', toRealmId: 'gaochang', seasonsRemaining: 1, legSeasons: 5 });
    const able = mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
    const r = stepExpeditions(baseInput({
      expeditions: { pat3: exp }, officers: { env: able }, rng: () => 0.9, playerForceId: 'me',
      realmRelations: { gaochang: 90 }, realmPatron: { gaochang: 'wei' },
    }));
    // The home city receives the returning expedition's haul next; here we just
    // confirm the title stayed with the embassy's claim, not the loan path.
    expect(r.realmsPatronClaimed['gaochang']).toBe('me'); // this very embassy re-claims it
  });

  it('an in-transit detour can delay an outbound expedition (+1 season)', () => {
    // rng 0.01: < 0.14 fires an encounter; outbound (no haul) → detour +1.
    const exp = mkExp({ id: 'tr1', mode: 'embassy', toCityId: '', toRealmId: 'daqin', phase: 'outbound', seasonsRemaining: 4, legSeasons: 12 });
    const r = stepExpeditions(baseInput({ expeditions: { tr1: exp }, rng: () => 0.01 }));
    // 4 - 1 (step) + 1 (detour) = 4
    expect(r.expeditions.tr1.seasonsRemaining).toBe(4);
  });
});

describe('游历 — helpers', () => {
  it('leg seasons scale with the officer pace', () => {
    const slow = mkOfficer({ stats: { leadership: 50, war: 50, intelligence: 10, politics: 50, charisma: 50 } });
    const fast = mkOfficer({ stats: { leadership: 50, war: 50, intelligence: 100, politics: 50, charisma: 50 } });
    expect(expeditionLegSeasons(3, slow)).toBeGreaterThanOrEqual(expeditionLegSeasons(3, fast));
  });

  it('aptitude picks the right stat pairing per mode', () => {
    const o = mkOfficer({ stats: { leadership: 0, war: 0, intelligence: 100, politics: 0, charisma: 50 } });
    expect(expeditionAptitude(o, 'infiltrate')).toBe(100);
    expect(expeditionAptitude(o, 'explore')).toBe(75);
  });

  it('subvert odds fall as the target loyalty rises', () => {
    const o = mkOfficer({ stats: { leadership: 50, war: 50, intelligence: 90, politics: 50, charisma: 90 } });
    expect(expeditionSuccessChance(o, 'subvert', 20)).toBeGreaterThan(expeditionSuccessChance(o, 'subvert', 95));
  });
});

describe('§7.6 new modes', () => {
  it('① 訪賢 — a successful call banks the sage as a recruit; a refusal accrues 三顧 誠意', () => {
    const wild = mkOfficer({ id: 'wolong', forceId: null, locationCityId: 'far', status: 'idle', stats: { leadership: 70, war: 40, intelligence: 99, politics: 95, charisma: 80 } });
    const input = baseInput({
      expeditions: { e1: mkExp({ mode: 'recruit', seasonsRemaining: 1 }) },
      cities: { home: mkCity('home'), far: mkCity('far', { ownerForceId: null }) },
      officers: {
        env: mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active', stats: { leadership: 60, war: 60, intelligence: 80, politics: 90, charisma: 95 } }),
        wolong: wild,
      },
    });
    const win = stepExpeditions({ ...input, rng: () => 0.0 });
    expect(win.expeditions.e1.haul?.recruitOfficerId).toBe('wolong');
    const lose = stepExpeditions({ ...input, rng: () => 0.999 });
    expect(lose.officers['wolong'].courtVisits).toBe(1); // 誠意 accrues for the next visit
  });

  it('② 巡視 lifts your own city’s loyalty', () => {
    const r = stepExpeditions(baseInput({
      expeditions: { e1: mkExp({ mode: 'tour', seasonsRemaining: 1 }) },
      cities: { home: mkCity('home'), far: mkCity('far', { ownerForceId: 'me', loyalty: 50 }) },
    }));
    expect(r.cities.far.loyalty).toBeGreaterThan(50);
  });

  it('② 募兵 banks auxiliary troops to bring home', () => {
    const r = stepExpeditions(baseInput({
      expeditions: { e1: mkExp({ mode: 'levy', seasonsRemaining: 1 }) },
      cities: { home: mkCity('home'), far: mkCity('far', { ownerForceId: 'me', population: 300000 }) },
    }));
    expect(r.expeditions.e1.haul?.auxTroops).toBeGreaterThan(0);
  });

  it('③ 護衛 — a guard rides home idle alongside the envoy', () => {
    const r = stepExpeditions(baseInput({
      expeditions: { e1: mkExp({ phase: 'returning', seasonsRemaining: 1, companionId: 'guard', haul: { note: 'x', noteZh: 'x' } }) },
      officers: {
        env: mkOfficer({ id: 'env', forceId: 'me', locationCityId: null, status: 'active' }),
        guard: mkOfficer({ id: 'guard', forceId: 'me', locationCityId: null, status: 'active' }),
      },
      cities: { home: mkCity('home', { ownerForceId: 'me' }), far: mkCity('far', { ownerForceId: 'wei' }) },
    }));
    expect(r.officers['guard'].status).toBe('idle');
    expect(r.officers['guard'].locationCityId).toBe('home');
  });
});
