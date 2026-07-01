import { describe, it, expect } from 'vitest';
import type { City, Force, Officer } from '../types';
import {
  overmightyMinister, ladderAdvanceChance, cabalCandidates,
  righteousReason, capability, LADDER_STAGES, LADDER_TOP,
} from './usurpation';

function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id, name: { zh: id, en: id }, forceId: 'wei', birthYear: 180,
    stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
    loyalty: 70, status: 'idle', locationCityId: 'c1', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier', traits: [], ...over,
  } as Officer;
}
function mkForce(over: Partial<Force> = {}): Force {
  return { id: 'wei', name: { zh: '魏', en: 'Wei' }, rulerOfficerId: 'ruler', capitalCityId: 'c1', color: '#00f', isPlayer: true, ...over } as Force;
}
const mkCity = (id: string, over: Partial<City> = {}): City => ({ id, name: { zh: id, en: id }, ownerForceId: 'wei', loyalty: 60, ...over } as City);

describe('§7.5 禪代之階 — the over-mighty minister', () => {
  const weakRuler = mkOfficer('ruler', { stats: { leadership: 40, war: 40, intelligence: 40, politics: 40, charisma: 40 } });
  const strongDisloyal = mkOfficer('sima', { loyalty: 25, stats: { leadership: 95, war: 85, intelligence: 98, politics: 95, charisma: 80 } });

  it('spots a strong, disaffected minister who eclipses a weak lord', () => {
    const officers = { ruler: weakRuler, sima: strongDisloyal, loyalGuy: mkOfficer('loyalGuy', { loyalty: 90 }) };
    expect(overmightyMinister(mkForce(), officers, 220)?.id).toBe('sima');
  });

  it('a content or 忠 minister never climbs; a loyal-trait one is immune', () => {
    const content = mkOfficer('sima', { loyalty: 80, stats: { leadership: 95, war: 85, intelligence: 98, politics: 95, charisma: 80 } });
    const sworn = mkOfficer('sima', { loyalty: 20, traits: ['loyal'], stats: { leadership: 95, war: 85, intelligence: 98, politics: 95, charisma: 80 } });
    expect(overmightyMinister(mkForce(), { ruler: weakRuler, sima: content }, 220)).toBeNull();
    expect(overmightyMinister(mkForce(), { ruler: weakRuler, sima: sworn }, 220)).toBeNull();
  });

  it('a minister who does not eclipse the lord is no threat', () => {
    const strongRuler = mkOfficer('ruler', { stats: { leadership: 99, war: 99, intelligence: 99, politics: 99, charisma: 99 } });
    const midMinister = mkOfficer('m', { loyalty: 20, stats: { leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60 } });
    expect(overmightyMinister(mkForce(), { ruler: strongRuler, m: midMinister }, 220)).toBeNull();
  });

  it('the climb quickens with a bigger cabal and a weaker throne', () => {
    const lone = ladderAdvanceChance(strongDisloyal, weakRuler, 0);
    const backed = ladderAdvanceChance(strongDisloyal, weakRuler, 4);
    expect(backed).toBeGreaterThan(lone);
    expect(LADDER_TOP).toBe(LADDER_STAGES.length - 1);
  });

  it('cabal candidates are same-realm malcontents, not the loyal', () => {
    const officers = {
      sima: mkOfficer('sima', { loyalty: 20 }),
      a: mkOfficer('a', { loyalty: 30 }),
      loyal: mkOfficer('loyal', { loyalty: 20, traits: ['loyal'] }),
      content: mkOfficer('content', { loyalty: 90 }),
      other: mkOfficer('other', { loyalty: 20, forceId: 'shu' }),
    };
    const cabal = cabalCandidates(officers.sima, officers, 4);
    expect(cabal).toContain('a');
    expect(cabal).not.toContain('loyal');
    expect(cabal).not.toContain('content');
    expect(cabal).not.toContain('other');
  });

  it('capability weights war/leadership over the civil stats', () => {
    const warrior = mkOfficer('w', { stats: { leadership: 90, war: 90, intelligence: 30, politics: 30, charisma: 50 } });
    const clerk = mkOfficer('c', { stats: { leadership: 30, war: 30, intelligence: 90, politics: 90, charisma: 50 } });
    expect(capability(warrior)).toBeGreaterThan(capability(clerk));
  });
});

describe('§7.5 清君側 — righteous-war targets', () => {
  it('a runaway inner court or a grinding tyranny invites the banner; a settled realm does not', () => {
    const f = mkForce({ id: 'wei' });
    const settled = { c1: mkCity('c1', { loyalty: 70 }) };
    const tyranny = { c1: mkCity('c1', { loyalty: 20 }) };
    expect(righteousReason({ force: f, cities: settled, eunuchPower: 10, usurperRuler: false })).toBeNull();
    expect(righteousReason({ force: f, cities: settled, eunuchPower: 70, usurperRuler: false })).not.toBeNull(); // 學官亂政
    expect(righteousReason({ force: f, cities: tyranny, eunuchPower: 10, usurperRuler: false })).not.toBeNull(); // 苛政
    expect(righteousReason({ force: f, cities: settled, eunuchPower: 10, usurperRuler: true })).not.toBeNull();  // 篡逆
  });
});
