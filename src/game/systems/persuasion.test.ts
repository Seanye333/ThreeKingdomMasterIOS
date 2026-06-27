/** 勸降三策 (officerFate) + 说客 envoy (persuasion) — recruitment-by-words tests. */
import { describe, expect, it } from 'vitest';
import type { City, DiplomaticState, Force } from '../types';
import { mkOfficer } from '../../test/factories';
import { estimateRecruitChance, recruitCostFor } from './officerFate';
import { reachableRivalCities, persuasionTargets, buildPersuasionScenario } from './persuasion';

const city = { id: 'xuchang', gold: 5000 } as City;
const force = { id: 'cao', name: { zh: '曹', en: 'Cao' } } as Force;
const ruler = mkOfficer({ id: 'cao-cao', stats: { charisma: 80 } });

const base = (officer: ReturnType<typeof mkOfficer>, approach?: 'righteous' | 'riches' | 'feeling', rapport = 0) =>
  estimateRecruitChance({
    officer, city, recruiterForce: force, recruiterRuler: ruler,
    approach, bestRapportWithCaptors: rapport,
  });

describe('勸降三策', () => {
  it('曉以大義 halves a loyal resistance and lifts the noble cap', () => {
    const zealot = mkOfficer({ status: 'imprisoned', loyalty: 80, traits: ['loyal', 'noble'] as never });
    expect(base(zealot, 'righteous')).toBeGreaterThan(base(zealot));
    expect(base(zealot, 'righteous')).toBeLessThanOrEqual(0.35);
    expect(base(zealot)).toBeLessThanOrEqual(0.15); // gold-flavored cap holds
  });

  it('許以重利 sways the greedy, insults the incorruptible, costs double', () => {
    const venal = mkOfficer({ status: 'imprisoned', loyalty: 60, traits: ['greedy'] as never });
    expect(base(venal, 'riches')).toBeGreaterThan(base(venal));
    const monk = mkOfficer({ status: 'imprisoned', loyalty: 60, traits: ['incorruptible'] as never });
    expect(base(monk, 'riches')).toBeLessThan(base(monk));
    expect(recruitCostFor('riches')).toBe(recruitCostFor() * 2);
  });

  it('以情動人 converts rapport into odds', () => {
    const friend = mkOfficer({ status: 'imprisoned', loyalty: 70 });
    expect(base(friend, 'feeling', 90)).toBeGreaterThan(base(friend, 'feeling', 0));
  });
});

// ─── 说客 (live envoy debate, §3.4) ──────────────────────────────────────────
const mkCity = (id: string, owner: string | null, adj: string[]): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId: owner, adjacentCityIds: adj, gold: 1000 } as unknown as City);
const mkForce = (id: string, rulerId: string): Force =>
  ({ id, name: { zh: id, en: id }, rulerOfficerId: rulerId, capitalCityId: `${id}-cap` } as unknown as Force);
const emptyDiplo: DiplomaticState = { relations: {} };

// Player 'me' holds 'home'; rival 'wei' holds 'near' (borders home) and 'far' (does not).
const sk_cities: Record<string, City> = {
  home: mkCity('home', 'me', ['near']),
  near: mkCity('near', 'wei', ['home', 'far']),
  far: mkCity('far', 'wei', ['near']),
};
const sk_forces: Record<string, Force> = { me: mkForce('me', 'lord-me'), wei: mkForce('wei', 'cao-cao') };

describe('说客 — targets', () => {
  it('reach is only rival cities bordering one of yours', () => {
    const reach = reachableRivalCities(sk_cities, 'me');
    expect(reach.has('near')).toBe(true);
    expect(reach.has('far')).toBe(false);
    expect(reach.has('home')).toBe(false);
  });

  it('lists disgruntled reachable enemy officers (说降) and reachable rival lords (结盟)', () => {
    const officers = {
      'cao-cao': mkOfficer({ id: 'cao-cao', forceId: 'wei', status: 'active', locationCityId: 'near', loyalty: 100, stats: { intelligence: 90, charisma: 90 } as never }),
      grumbler: mkOfficer({ id: 'grumbler', forceId: 'wei', status: 'idle', locationCityId: 'near', loyalty: 40 }),
      content: mkOfficer({ id: 'content', forceId: 'wei', status: 'idle', locationCityId: 'near', loyalty: 90 }),
      deep: mkOfficer({ id: 'deep', forceId: 'wei', status: 'idle', locationCityId: 'far', loyalty: 30 }),
      mine: mkOfficer({ id: 'mine', forceId: 'me', status: 'idle', locationCityId: 'home', loyalty: 20 }),
    };
    const ids = persuasionTargets({ officers, cities: sk_cities, forces: sk_forces, diplomacy: emptyDiplo, playerForceId: 'me' })
      .map((tg) => `${tg.kind}:${tg.officerId}`);
    expect(ids).toContain('defect:grumbler');
    expect(ids).toContain('ally:cao-cao');
    expect(ids).not.toContain('defect:content'); // too loyal
    expect(ids).not.toContain('defect:deep');    // unreachable
    expect(ids).not.toContain('defect:mine');    // your own
    expect(ids).not.toContain('defect:cao-cao'); // a lord allies, isn't 说降'd
  });

  it('skips a force you are already allied with', () => {
    const officers = { 'cao-cao': mkOfficer({ id: 'cao-cao', forceId: 'wei', status: 'active', locationCityId: 'near', loyalty: 100 }) };
    const allied: DiplomaticState = { relations: { 'me|wei': { forceA: 'me', forceB: 'wei', score: 60, status: 'allied' } as never } };
    const targets = persuasionTargets({ officers, cities: sk_cities, forces: sk_forces, diplomacy: allied, playerForceId: 'me' });
    expect(targets.some((tg) => tg.kind === 'ally')).toBe(false);
  });
});

describe('说客 — dynamic scenarios', () => {
  it('a defect scenario recruits on a win', () => {
    const sc = buildPersuasionScenario({ kind: 'defect', officerId: 'grumbler', officerName: { zh: '甲', en: 'A' }, forceId: 'wei', forceName: { zh: '魏', en: 'Wei' }, cityId: 'near', cityName: { zh: '近', en: 'Near' }, loyalty: 40, topic: 'interest', difficulty: 'veteran' });
    expect(sc.winEffects.some((e) => e.kind === 'recruit' && e.targetId === 'grumbler')).toBe(true);
  });

  it('an ally scenario seals the alliance on a win and sours on a loss', () => {
    const sc = buildPersuasionScenario({ kind: 'ally', officerId: 'cao-cao', officerName: { zh: '操', en: 'Cao' }, forceId: 'wei', forceName: { zh: '魏', en: 'Wei' }, cityId: 'near', cityName: { zh: '近', en: 'Near' }, topic: 'strategy', difficulty: 'peerless' });
    const win = sc.winEffects.find((e) => e.kind === 'ally');
    expect(win?.targetId).toBe('wei');
    expect(win?.amount ?? 0).toBeGreaterThanOrEqual(20);
    expect(sc.loseEffects.some((e) => e.kind === 'ally' && (e.amount ?? 0) < 0)).toBe(true);
  });
});
