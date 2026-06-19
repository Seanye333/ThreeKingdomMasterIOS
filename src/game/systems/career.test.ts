import { describe, it, expect } from 'vitest';
import { careerStanding, meritFromDeeds, rankForMerit, canInheritForce, careerPrivileges, careerGuardCapBonus } from './career';

const deeds = (over: Partial<import('../types/deeds').HeroicDeeds>) =>
  ({ officerId: 'x', killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0,
     espionageSuccess: 0, civicWorks: 0, battlesWon: 0, battlesLost: 0, trainingsCompleted: 0 } as never) && over as never;

describe('career standing (一代記 ladder)', () => {
  it('starts a fresh officer at the lowest rank (9, 武官)', () => {
    const s = careerStanding(undefined);
    expect(s.merit).toBe(0);
    expect(s.rank).toBe(9);
    expect(s.status.en).toBe('Officer');
  });

  it('merit accrues from deeds and lifts the rank', () => {
    const m = meritFromDeeds({ citiesTaken: 5, battlesWon: 10, killsTroops: 5000 } as never);
    // 5*30 + 10*5 + floor(5000/100)=50 → 250
    expect(m).toBe(250);
    expect(rankForMerit(250)).toBe(4); // ≥240 floor → rank 4 (太守)
    expect(careerStanding({ citiesTaken: 5, battlesWon: 10, killsTroops: 5000 } as never).status.en).toBe('Governor');
  });

  it('reaches Grand Marshal (rank 1) at high merit, and may then inherit a force', () => {
    const s = careerStanding({ citiesTaken: 20 } as never); // 600 merit ≥ 480
    expect(s.rank).toBe(1);
    expect(s.nextRankMerit).toBeNull();
    expect(canInheritForce(s)).toBe(true);
  });

  it('reports the merit needed for the next rank', () => {
    const s = careerStanding({ battlesWon: 3 } as never); // 15 merit → rank 8 (floor 10), next is 30
    expect(s.rank).toBe(8);
    expect(s.nextRankMerit).toBe(30);
  });
});

describe('career rank privileges (品階特權)', () => {
  it('unlocks more perks as the hero rises', () => {
    const rookie = careerPrivileges(careerStanding(undefined)); // rank 9
    const viceroy = careerPrivileges(careerStanding({ citiesTaken: 12 } as never)); // 360 → rank 3
    const rookieOn = rookie.filter((p) => p.unlocked).length;
    const viceroyOn = viceroy.filter((p) => p.unlocked).length;
    expect(rookieOn).toBeGreaterThanOrEqual(1);
    expect(viceroyOn).toBeGreaterThan(rookieOn);
    // The Viceroy 都督 inherit-perk is unlocked; the Grand-Marshal one is not.
    expect(viceroy.find((p) => /Viceroy/.test(p.en))?.unlocked).toBe(true);
    expect(viceroy.find((p) => /Grand Marshal/.test(p.en))?.unlocked).toBe(false);
  });

  it('grants a 私兵 cap bonus that scales with rank', () => {
    expect(careerGuardCapBonus(careerStanding(undefined))).toBe(0);          // 武官 (rank 9)
    expect(careerGuardCapBonus(careerStanding({ battlesWon: 6 } as never))).toBe(1000); // 30 merit → rank 7 大臣
    expect(careerGuardCapBonus(careerStanding({ citiesTaken: 5, battlesWon: 10, killsTroops: 5000 } as never))).toBe(3000); // rank 4 太守
    expect(careerGuardCapBonus(careerStanding({ citiesTaken: 20 } as never))).toBe(6000); // rank 1
  });
});

import { applySuccession } from './succession';
import { mkOfficer } from '../../test/factories';

describe('career officer inherits a force when senior enough', () => {
  const force = { id: 'F', rulerOfficerId: 'r', name: { zh: '勢', en: 'Force' }, color: '#fff', capitalCityId: 'c1' } as never;
  const ruler = mkOfficer({ id: 'r', status: 'dead' });
  const career = mkOfficer({ id: 'c', forceId: 'F' });
  const other = mkOfficer({ id: 'f', forceId: 'F', stats: { war: 50, leadership: 50, intelligence: 50, politics: 99, charisma: 50 } });
  (ruler as { forceId?: string }).forceId = 'F';

  it('a 都督+ chronicle officer takes the throne', () => {
    const out = applySuccession({
      forces: { F: force }, officers: { r: ruler, c: career, f: other }, family: [],
      careerOfficerId: 'c', deeds: { c: { citiesTaken: 20 } as never },
    });
    expect(out.forces.F.rulerOfficerId).toBe('c');
  });

  it('a junior chronicle officer does not — the usual heir succeeds', () => {
    const out = applySuccession({
      forces: { F: force }, officers: { r: ruler, c: career, f: other }, family: [],
      careerOfficerId: 'c', deeds: { c: { battlesWon: 1 } as never }, // tiny merit
    });
    expect(out.forces.F.rulerOfficerId).toBe('f'); // highest loyalty+politics fallback
  });
});
