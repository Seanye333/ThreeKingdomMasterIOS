/** 陣斬 — a non-battlefield duel (約戰/劇情) that kills for real + seeds 復仇. */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './store';
import { mkOfficer } from '../../test/factories';
import type { Officer } from '../types';
import type { FamilyRelation } from '../types/family';

const s = () => useGameStore.getState();

const W = (war: number) => ({ war, leadership: 60, intelligence: 50, politics: 50, charisma: 60 });

beforeEach(() => {
  const officers: Record<string, Officer> = {
    slayer: mkOfficer({ id: 'slayer', forceId: 'WEI', stats: W(95) }),
    victim: mkOfficer({ id: 'victim', forceId: 'SHU', stats: W(88) }),
    son:    mkOfficer({ id: 'son', forceId: 'SHU', stats: W(80) }),    // victim's child
    brother: mkOfficer({ id: 'brother', forceId: 'WU', stats: W(85) }), // unrelated by blood
  };
  // victim → son (officerA is the parent, officerB the child)
  const family: FamilyRelation[] = [{ officerA: 'victim', officerB: 'son', kind: 'parent-child' }];
  useGameStore.setState({ officers, family, runtimeBonds: [] });
});

describe('slayOfficerInDuel', () => {
  it('marks the victim dead and strips their force', () => {
    s().slayOfficerInDuel('slayer', 'victim');
    const v = s().officers.victim;
    expect(v.status).toBe('dead');
    expect(v.forceId).toBeNull();
  });

  it('seeds 復仇 on a surviving relative against the slayer\'s force', () => {
    s().slayOfficerInDuel('slayer', 'victim');
    const son = s().officers.son;
    expect(son.status).not.toBe('dead');
    expect(son.killedRelativesBy?.victim).toBe('WEI'); // the slayer's force
  });

  it('is a no-op on self, the dead, or an unknown victim', () => {
    s().slayOfficerInDuel('slayer', 'slayer');
    expect(s().officers.slayer.status).not.toBe('dead');
    s().slayOfficerInDuel('slayer', 'nobody');
    expect(s().officers.slayer.status).not.toBe('dead');
    // already dead → unchanged
    s().slayOfficerInDuel('slayer', 'victim');
    const before = s().officers.victim;
    s().slayOfficerInDuel('slayer', 'victim');
    expect(s().officers.victim).toBe(before);
  });
});

describe('recruitViaDuel', () => {
  it('a bested foe comes over to the player force, posted to the capital', () => {
    useGameStore.setState({
      playerForceId: 'WEI',
      forces: { WEI: { id: 'WEI', name: { zh: '魏', en: 'Wei' }, capitalCityId: 'xuchang' } } as never,
      officers: { foe: mkOfficer({ id: 'foe', forceId: 'SHU', stats: W(85), loyalty: 30 }) },
    });
    const ok = s().recruitViaDuel('foe');
    expect(ok).toBe(true);
    const o = s().officers.foe;
    expect(o.forceId).toBe('WEI');
    expect(o.status).toBe('idle');
    expect(o.loyalty).toBeGreaterThanOrEqual(55);
  });
  it('refuses an officer already on the player side / dead', () => {
    useGameStore.setState({ playerForceId: 'WEI', officers: { mine: mkOfficer({ id: 'mine', forceId: 'WEI', stats: W(80) }) } });
    expect(s().recruitViaDuel('mine')).toBe(false);
  });
});

import { ratingOf } from '../systems/warRanking';
describe('awardTournamentChampion', () => {
  it('climbs the champion steeply once a year; a repeat is mere practice', () => {
    useGameStore.setState({
      date: { ...s().date, year: 205 }, lastTournamentYear: 0, warRatings: {},
      officers: { champ: mkOfficer({ id: 'champ', forceId: 'WEI', stats: W(90) }), run: mkOfficer({ id: 'run', forceId: 'WEI', stats: W(85) }) },
    });
    const base = ratingOf(s().warRatings, s().officers.champ);
    expect(s().awardTournamentChampion('champ', ['champ', 'run'])).toBe(true);
    const afterAnnual = ratingOf(s().warRatings, s().officers.champ);
    expect(afterAnnual).toBe(base + 80);
    expect(s().lastTournamentYear).toBe(205);
    // A second tournament the SAME year → no steep climb (practice only).
    expect(s().awardTournamentChampion('champ', ['champ', 'run'])).toBe(false);
    expect(ratingOf(s().warRatings, s().officers.champ)).toBe(afterAnnual + 12);
  });
});

describe('adjustForceFavor', () => {
  it('shifts the 好感 between two forces, creating the relation if absent, clamped', () => {
    useGameStore.setState({ diplomacy: { relations: {} } as never });
    s().adjustForceFavor('WEI', 'SHU', -8);
    const rels = s().diplomacy.relations;
    const rel = rels['WEI|SHU'] ?? rels['SHU|WEI'] ?? Object.values(rels)[0];
    expect(rel.score).toBe(-8);
    s().adjustForceFavor('WEI', 'SHU', 4);
    const rel2 = Object.values(s().diplomacy.relations)[0];
    expect(rel2.score).toBe(-4);
    // clamp + no-op on self / zero delta
    s().adjustForceFavor('WEI', 'WEI', -50);
    s().adjustForceFavor('WEI', 'SHU', -500);
    expect(Object.values(s().diplomacy.relations)[0].score).toBe(-100);
  });
});
