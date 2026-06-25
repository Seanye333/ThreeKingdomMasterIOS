import { describe, it, expect } from 'vitest';
import type { DiplomaticState, MarriageAlliance, Officer } from '../types';
import { getRelation, isHostilePermitted } from '../types/diplomacy';
import {
  allianceBetween,
  tickMarriageAlliances,
  breakAlliance,
  ALLIANCE_RELATION_FLOOR,
} from './marriageAlliance';

function mkOfficer(id: string, forceId: string, loyalty = 80): Officer {
  return {
    id, name: { zh: id, en: id }, forceId,
    stats: { leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60 },
    loyalty, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier',
  } as Officer;
}

const alliance: MarriageAlliance = {
  forceA: 'shu', forceB: 'wu', officerA: 'guan-yu', officerB: 'sun-shangxiang', sinceYear: 209,
};

describe('allianceBetween', () => {
  it('finds the pact regardless of argument order', () => {
    expect(allianceBetween([alliance], 'shu', 'wu')).toBe(alliance);
    expect(allianceBetween([alliance], 'wu', 'shu')).toBe(alliance);
    expect(allianceBetween([alliance], 'shu', 'wei')).toBeNull();
  });
});

describe('tickMarriageAlliances', () => {
  it('holds a standing alliance at the relation floor and marks it allied', () => {
    const diplomacy: DiplomaticState = {
      relations: { shu__wu: { forceA: 'shu', forceB: 'wu', score: 10, status: 'neutral' } },
    };
    const r = tickMarriageAlliances({
      alliances: [alliance],
      diplomacy,
      livingForceIds: new Set(['shu', 'wu']),
    });
    const rel = getRelation(r.diplomacy, 'shu', 'wu');
    expect(rel.score).toBeGreaterThanOrEqual(ALLIANCE_RELATION_FLOOR);
    expect(rel.status).toBe('allied');
    // And hostility is now forbidden between the two.
    expect(isHostilePermitted(r.diplomacy, 'shu', 'wu')).toBe(false);
  });

  it('prunes an alliance whose partner realm has fallen', () => {
    const r = tickMarriageAlliances({
      alliances: [alliance],
      diplomacy: { relations: {} },
      livingForceIds: new Set(['shu']), // wu wiped out
    });
    expect(r.alliances).toHaveLength(0);
  });
});

describe('breakAlliance (oathbreaker)', () => {
  it('craters the spurned relation, dings all others, shames the spouse, and removes the pact + bond', () => {
    const diplomacy: DiplomaticState = {
      relations: {
        shu__wu: { forceA: 'shu', forceB: 'wu', score: 80, status: 'allied' },
        shu__wei: { forceA: 'shu', forceB: 'wei', score: 0, status: 'neutral' },
      },
    };
    const officers = { 'guan-yu': mkOfficer('guan-yu', 'shu', 90) };
    const bond = { officerA: 'guan-yu', officerB: 'sun-shangxiang', floor: 80, kind: 'oath' as const, label: 'wed' };
    const r = breakAlliance({
      breakerForceId: 'shu',
      targetForceId: 'wu',
      alliances: [alliance],
      diplomacy,
      officers,
      runtimeBonds: [bond],
      livingForceIds: new Set(['shu', 'wu', 'wei']),
    });
    // Spurned realm cratered + war re-enabled.
    const spurned = getRelation(r.diplomacy, 'shu', 'wu');
    expect(spurned.score).toBeLessThan(0);
    expect(spurned.status).toBe('neutral');
    expect(isHostilePermitted(r.diplomacy, 'shu', 'wu')).toBe(true);
    // Third party soured.
    expect(getRelation(r.diplomacy, 'shu', 'wei').score).toBeLessThan(0);
    // Spouse shamed.
    expect(r.officers['guan-yu'].loyalty).toBeLessThan(90);
    // Pact + bond gone.
    expect(r.alliances).toHaveLength(0);
    expect(r.runtimeBonds).toHaveLength(0);
  });

  it('betraying a 質子 union executes the hostage rather than merely shaming them', () => {
    const diplomacy: DiplomaticState = {
      relations: { shu__wu: { forceA: 'shu', forceB: 'wu', score: 80, status: 'allied' } },
    };
    const hostageAlliance: MarriageAlliance = { ...alliance, hostage: true };
    const officers = { 'guan-yu': mkOfficer('guan-yu', 'shu', 90) };
    const r = breakAlliance({
      breakerForceId: 'shu',
      targetForceId: 'wu',
      alliances: [hostageAlliance],
      diplomacy,
      officers,
      runtimeBonds: [],
      livingForceIds: new Set(['shu', 'wu']),
      year: 215,
    });
    expect(r.officers['guan-yu'].status).toBe('dead');
    expect(r.officers['guan-yu'].deathYear).toBe(215);
  });
});
