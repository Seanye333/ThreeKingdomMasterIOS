/** AI 折衝樽俎 (§6.16 對稱) — AI 說降來使 + 月旦來辯 writ ticks. */
import { describe, it, expect } from 'vitest';
import { tickAIPersuasions, tickMoonWrit, AI_PERSUADE_MIN_SCORE } from './aiParley';
import { mkOfficer, seededRng } from '../../test/factories';
import type { City, Force, GameDate } from '../types';

const S = (int: number, cha = 60) => ({ war: 50, leadership: 60, intelligence: int, politics: 60, charisma: cha });
const DATE: GameDate = { year: 200, season: 'spring' } as GameDate;
const mkCity = (over: Partial<City> = {}): City => ({ id: 'c1', name: { zh: '小城', en: 'Town' }, ownerForceId: 'me', troops: 1000, food: 10000, loyalty: 50, ...over } as City);
const mkForce = (id: string, over: Partial<Force> = {}): Force => ({ id, name: { zh: id, en: id }, rulerOfficerId: 'r', capitalCityId: 'cap', color: '#fff', isPlayer: id === 'me', imperialRank: 'commoner', personality: 'aggressive', ...over } as Force);
const neutralDip = { relations: {} } as never;

describe('AI 舌戰說降 (tickAIPersuasions)', () => {
  const base = {
    forces: { me: mkForce('me', { capitalCityId: 'cap' }), wei: mkForce('wei') },
    cities: {
      cap: mkCity({ id: 'cap', ownerForceId: 'me', troops: 9000 }),
      c1: mkCity({ id: 'c1', ownerForceId: 'me', troops: 1000 }),
    },
    officers: {
      talker: mkOfficer({ id: 'talker', forceId: 'wei', stats: S(96, 92), debateXiuwei: 80, renown: 60 }),
      keeper: mkOfficer({ id: 'keeper', forceId: 'me', stats: S(70), locationCityId: 'c1' }),
    },
    diplomacy: neutralDip,
    playerForceId: 'me',
    existing: [],
    expiresAt: DATE,
  };
  it('sends a famous tongue to a weakly-held player wall', () => {
    const p = tickAIPersuasions({ ...base, rng: () => 0 });
    expect(p).not.toBeNull();
    expect(p!.fromForceId).toBe('wei');
    expect(p!.cityId).toBe('c1'); // never the capital
    expect(p!.envoyId).toBe('talker');
    expect(p!.defenderId).toBe('keeper');
  });
  it('stands down when an affair is already pending, or no weak wall / famous tongue exists', () => {
    expect(tickAIPersuasions({ ...base, existing: [{ fromForceId: 'wei', envoyId: 'talker', cityId: 'c1', defenderId: 'keeper', expiresAt: DATE }], rng: () => 0 })).toBeNull();
    const strongWalls = { ...base, cities: { cap: base.cities.cap, c1: mkCity({ id: 'c1', ownerForceId: 'me', troops: 9000 }) } };
    expect(tickAIPersuasions({ ...strongWalls, rng: () => 0 })).toBeNull();
    const mumbling = { ...base, officers: { ...base.officers, talker: mkOfficer({ id: 'talker', forceId: 'wei', stats: S(40, 30) }) } };
    expect(tickAIPersuasions({ ...mumbling, rng: () => 0 })).toBeNull();
    expect(AI_PERSUADE_MIN_SCORE).toBeGreaterThan(0);
  });
});

describe('月旦來辯 (tickMoonWrit)', () => {
  const officers = {
    mine: mkOfficer({ id: 'mine', forceId: 'me', stats: S(92, 88), debateXiuwei: 80 }),
    rival: mkOfficer({ id: 'rival', forceId: 'wei', stats: S(90, 85) }),
  };
  it('a rival scholar writs the player-held laurel', () => {
    const w = tickMoonWrit({ officers, holderId: 'mine', playerForceId: 'me', existing: undefined, expiresAt: DATE, rng: seededRng(1) });
    expect(w).not.toBeNull();
    expect(w!.challengerId).toBe('rival');
  });
  it('no writ when the laurel is not the player\'s, or one already stands', () => {
    expect(tickMoonWrit({ officers, holderId: 'rival', playerForceId: 'me', existing: undefined, expiresAt: DATE, rng: () => 0 })).toBeNull();
    expect(tickMoonWrit({ officers, holderId: 'mine', playerForceId: 'me', existing: { challengerId: 'rival', expiresAt: DATE }, expiresAt: DATE, rng: () => 0 })).toBeNull();
  });
});
