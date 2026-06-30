import { describe, it, expect } from 'vitest';
import type { City, Force, Officer } from '../types';
import { clanOf, isCommoner, isAristocrat, CLANS_BY_ID } from '../data/clans';
import { tickClans, clanInfluence, effectiveStance, stanceRecruitModifier, clanScions, clanCohesion, clanLevyTarget, clanDefectionChance, clanSubvertChance } from './clans';

function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id,
    name: { zh: id, en: id },
    forceId: 'wei',
    stats: { leadership: 70, war: 60, intelligence: 85, politics: 85, charisma: 70 },
    loyalty: 60,
    status: 'idle',
    locationCityId: 'luoyang',
    task: null,
    equipment: {} as Officer['equipment'],
    skills: [],
    rank: 'soldier',
    ...over,
  } as Officer;
}

function mkForce(over: Partial<Force> = {}): Force {
  return {
    id: 'wei',
    name: { zh: '魏', en: 'Wei' },
    rulerOfficerId: 'cao-cao',
    capitalCityId: 'luoyang',
    color: '#00f',
    isPlayer: false,
    ...over,
  } as Force;
}

const city: Record<string, City> = { luoyang: { id: 'luoyang' } as City };

describe('clan data', () => {
  it('maps scions to clans and spots commoners', () => {
    expect(clanOf(mkOfficer('sima-yi'))).toBe('sima');
    expect(clanOf(mkOfficer('xun-yu'))).toBe('xun');
    expect(clanOf(mkOfficer('cao-cao'))).toBeNull();
    expect(isCommoner(mkOfficer('commoner-li-ping'))).toBe(true);
    expect(isCommoner(mkOfficer('sima-yi'))).toBe(false);
    expect(isAristocrat(mkOfficer('zhuge-liang'))).toBe(true);
  });
});

describe('effectiveStance', () => {
  it('player realm is opt-in (balanced by default)', () => {
    const f = mkForce({ id: 'wei', isPlayer: true });
    expect(effectiveStance(f, {}, true)).toBe('balanced');
  });
  it('AI realm with clan scions drifts aristocratic', () => {
    const officers = {
      'sima-yi': mkOfficer('sima-yi'),
      'sima-zhao': mkOfficer('sima-zhao'),
    };
    expect(effectiveStance(mkForce(), officers, false)).toBe('aristocratic');
  });
});

describe('tickClans loyalty tug', () => {
  it('aristocratic lifts scions and saps commoners', () => {
    const officers = {
      'sima-yi': mkOfficer('sima-yi', { loyalty: 60 }),
      'commoner-li-ping': mkOfficer('commoner-li-ping', { loyalty: 60 }),
    };
    const r = tickClans({
      officers,
      forces: { wei: mkForce({ recruitmentStance: 'aristocratic' }) },
      cities: city,
      playerForceId: 'player',
      seed: 1,
    });
    expect(r.officers['sima-yi'].loyalty).toBeGreaterThan(60);
    expect(r.officers['commoner-li-ping'].loyalty).toBeLessThan(60);
  });

  it('meritocratic lifts commoners and saps scions', () => {
    const officers = {
      'sima-yi': mkOfficer('sima-yi', { loyalty: 60 }),
      'commoner-li-ping': mkOfficer('commoner-li-ping', { loyalty: 60 }),
    };
    const r = tickClans({
      officers,
      forces: { wei: mkForce({ recruitmentStance: 'meritocratic' }) },
      cities: city,
      playerForceId: 'player',
      seed: 1,
    });
    expect(r.officers['commoner-li-ping'].loyalty).toBeGreaterThan(60);
    expect(r.officers['sima-yi'].loyalty).toBeLessThan(60);
  });

  it('an over-mighty clan lends its low-loyalty strongman a usurpation push', () => {
    // Stack Wei with the whole Sima clan, all disaffected → over-mighty.
    const officers: Record<string, Officer> = {};
    for (const id of CLANS_BY_ID.sima.members) {
      officers[id] = mkOfficer(id, { loyalty: 30, stats: { leadership: 95, war: 80, intelligence: 98, politics: 95, charisma: 80 } });
    }
    const r = tickClans({
      officers,
      forces: { wei: mkForce({ recruitmentStance: 'aristocratic' }) },
      cities: city,
      playerForceId: 'player',
      seed: 7,
    });
    const boosted = Object.values(r.factionBoost).some((v) => v > 0);
    expect(boosted).toBe(true);
  });
});

describe('clanInfluence + recruit modifier', () => {
  it('influence rises with more scions and aristocratic stance', () => {
    const one = { 'sima-yi': mkOfficer('sima-yi') };
    const many = {
      'sima-yi': mkOfficer('sima-yi'),
      'sima-shi': mkOfficer('sima-shi'),
      'sima-zhao': mkOfficer('sima-zhao'),
    };
    expect(clanInfluence(many, 'wei', 'sima', 'aristocratic')).toBeGreaterThan(
      clanInfluence(one, 'wei', 'sima', 'aristocratic'),
    );
    expect(clanInfluence(many, 'wei', 'sima', 'aristocratic')).toBeGreaterThan(
      clanInfluence(many, 'wei', 'sima', 'meritocratic'),
    );
  });

  it('aristocratic stance with content clans lends a recruit bonus', () => {
    const officers = { 'sima-yi': mkOfficer('sima-yi', { loyalty: 80 }) };
    expect(stanceRecruitModifier(officers, 'wei', 'aristocratic')).toBeGreaterThan(0);
    expect(stanceRecruitModifier(officers, 'wei', 'meritocratic')).toBe(0);
  });
});

describe('§7.8-deep E 門第聯姻 — a bound clan keeps faith', () => {
  it('a bound clan holds a loyalty floor and is spared the usurpation push', () => {
    const officers: Record<string, Officer> = {};
    for (const id of CLANS_BY_ID.sima.members) {
      officers[id] = mkOfficer(id, { loyalty: 30, stats: { leadership: 95, war: 80, intelligence: 98, politics: 95, charisma: 80 } });
    }
    const r = tickClans({
      officers,
      forces: { wei: mkForce({ recruitmentStance: 'aristocratic' }) },
      cities: city,
      playerForceId: 'player',
      clanBonds: { sima: 'wei' },
      seed: 7,
    });
    // No strongman gets a usurpation boost…
    expect(Object.values(r.factionBoost).some((v) => v > 0)).toBe(false);
    // …and their loyalty is pulled up toward the floor, not down.
    expect(r.officers['sima-yi'].loyalty).toBeGreaterThan(30);
  });
});

describe('§7.8-deep G/H — levies, defection & subversion', () => {
  const scions = (loy: number, n = 3) =>
    CLANS_BY_ID.sima.members.slice(0, n).map((id) => mkOfficer(id, { loyalty: loy, forceId: 'wei' }));

  it('clanScions/clanCohesion read serving members', () => {
    const officers = { 'sima-yi': mkOfficer('sima-yi', { loyalty: 70 }), 'sima-shi': mkOfficer('sima-shi', { loyalty: 50 }) };
    const s = clanScions(officers, 'wei', 'sima');
    expect(s.length).toBe(2);
    expect(clanCohesion(s)).toBe(60);
  });

  it('content clans field 部曲; disaffected ones field none', () => {
    expect(clanLevyTarget(scions(80))).toBeGreaterThan(0);
    expect(clanLevyTarget(scions(40))).toBe(0); // below the content floor
    expect(clanLevyTarget([])).toBe(0);
  });

  it('deep disaffection breeds defection; a bond prevents it', () => {
    expect(clanDefectionChance(scions(15), false)).toBeGreaterThan(0);
    expect(clanDefectionChance(scions(15), true)).toBe(0); // bound → never
    expect(clanDefectionChance(scions(60), false)).toBe(0); // loyal → never
    expect(clanDefectionChance(scions(15, 1), false)).toBe(0); // a lone scion isn't a clan
  });

  it('subversion odds rise with disaffection, prestige & coin', () => {
    const cold = clanSubvertChance({ scions: scions(30), myStandingTier: 'humble', spend: 0 });
    const rich = clanSubvertChance({ scions: scions(30), myStandingTier: 'great', spend: 4000 });
    expect(rich).toBeGreaterThan(cold);
    expect(clanSubvertChance({ scions: scions(80), myStandingTier: 'humble', spend: 0 })).toBe(0); // a loyal clan won't turn
  });
});
