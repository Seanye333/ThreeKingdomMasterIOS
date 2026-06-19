import { describe, it, expect } from 'vitest';
import { forecastAttack, matchupLabel } from './tactical';
import { mkUnit, mkBattle, officerMap } from '../../test/factories';

describe('戰鬥預判 — forecastAttack', () => {
  it('reflects the unit-type counter: 槍克騎 reads "strong", 騎打槍 reads "weak"', () => {
    const spear = mkUnit({ id: 'u1', officerId: 'o1', unitType: 'spearmen', side: 'attacker', coord: { col: 2, row: 2 } });
    const horse = mkUnit({ id: 'u2', officerId: 'o2', unitType: 'cavalry', side: 'defender', coord: { col: 3, row: 2 } });
    const battle = mkBattle({ units: [spear, horse] });
    const officers = officerMap([spear, horse]);

    const spearHitsHorse = forecastAttack(battle, spear, horse, officers);
    const horseHitsSpear = forecastAttack(battle, horse, spear, officers);

    expect(spearHitsHorse.matchup, '槍 should counter 騎').toBe('strong');
    expect(spearHitsHorse.counterMult).toBeGreaterThan(1);
    expect(horseHitsSpear.matchup, '騎 into 槍 is the bad matchup').toBe('weak');
    expect(horseHitsSpear.counterMult).toBeLessThan(1);
  });

  it('flags a lethal blow and then zeroes the counter-attack', () => {
    const big = mkUnit({ id: 'a', officerId: 'oa', unitType: 'cavalry', troops: 20000, side: 'attacker', coord: { col: 1, row: 1 } });
    const tiny = mkUnit({ id: 'b', officerId: 'ob', unitType: 'archers', troops: 80, side: 'defender', coord: { col: 2, row: 1 } });
    const battle = mkBattle({ units: [big, tiny] });
    const officers = officerMap([big, tiny]);

    const f = forecastAttack(battle, big, tiny, officers);
    expect(f.willKill, 'a huge cavalry charge wipes 80 archers').toBe(true);
    expect(f.counterMax, 'a dead unit cannot counter').toBe(0);
    expect(f.dmgMax).toBeGreaterThanOrEqual(tiny.troops);
  });

  it('damage range is ordered and non-negative', () => {
    const a = mkUnit({ id: 'a', officerId: 'oa', unitType: 'infantry', side: 'attacker', coord: { col: 1, row: 1 } });
    const d = mkUnit({ id: 'd', officerId: 'od', unitType: 'infantry', side: 'defender', coord: { col: 2, row: 1 } });
    const f = forecastAttack(mkBattle({ units: [a, d] }), a, d, officerMap([a, d]));
    expect(f.dmgMin).toBeGreaterThanOrEqual(0);
    expect(f.dmgMax).toBeGreaterThanOrEqual(f.dmgMin);
  });
});

describe('matchupLabel', () => {
  it('names the winning edges and stays silent on neutral/losing ones', () => {
    expect(matchupLabel('spearmen', 'cavalry')).toEqual({ zh: '槍克騎', en: 'spearmen>cavalry' });
    expect(matchupLabel('cavalry', 'archers')).toEqual({ zh: '騎克弓', en: 'cavalry>archers' });
    expect(matchupLabel('archers', 'spearmen')).toEqual({ zh: '弓克槍', en: 'archers>spearmen' });
    expect(matchupLabel('cavalry', 'spearmen'), 'the losing side gets no badge').toBeNull();
    expect(matchupLabel('infantry', 'infantry')).toBeNull();
  });
});
