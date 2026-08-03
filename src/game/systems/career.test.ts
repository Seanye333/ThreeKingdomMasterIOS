import { describe, it, expect } from 'vitest';
import { careerStanding, meritFromDeeds, rankForMerit, canInheritForce, careerPrivileges,
         careerGuardCap, RANK_COMMONER } from './career';

const deeds = (over: Partial<import('../types/deeds').HeroicDeeds>) =>
  ({ officerId: 'x', killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0,
     espionageSuccess: 0, civicWorks: 0, battlesWon: 0, battlesLost: 0, trainingsCompleted: 0 } as never) && over as never;

describe('career standing (一代記 ladder)', () => {
  it('starts a fresh career as 白身 — below the nine ranks of office', () => {
    const s = careerStanding(undefined);
    expect(s.merit).toBe(0);
    expect(s.rank).toBe(RANK_COMMONER);
    expect(s.status.en).toBe('Commoner');
    expect(s.commoner).toBe(true);
  });

  it('merit accrues from deeds and lifts the rank', () => {
    const m = meritFromDeeds({ citiesTaken: 5, battlesWon: 10, killsTroops: 5000 } as never);
    // 5*30 + 10*5 + floor(5000/100)=50 → 250
    expect(m).toBe(250);
    expect(rankForMerit(250)).toBe(5); // ≥210 floor → rank 5 (太守)
    expect(careerStanding({ citiesTaken: 5, battlesWon: 10, killsTroops: 5000 } as never).status.en).toBe('Governor');
  });

  it('reaches Grand Marshal (rank 1) at high merit, and may then inherit a force', () => {
    const s = careerStanding({ citiesTaken: 28 } as never); // 840 merit ≥ 820
    expect(s.rank).toBe(1);
    expect(s.nextRankMerit).toBeNull();
    expect(canInheritForce(s)).toBe(true);
  });

  it('reports the merit needed for the next rank', () => {
    const s = careerStanding({ battlesWon: 3 } as never); // 15 merit → 部曲(10, floor 6), next is 18
    expect(s.rank).toBe(10);
    expect(s.nextRankMerit).toBe(18);
  });
});

describe('career rank privileges (品階特權)', () => {
  it('unlocks more perks as the hero rises', () => {
    const rookie = careerPrivileges(careerStanding(undefined)); // 白身
    const viceroy = careerPrivileges(careerStanding({ citiesTaken: 16 } as never)); // 480 → rank 3
    const rookieOn = rookie.filter((p) => p.unlocked).length;
    const viceroyOn = viceroy.filter((p) => p.unlocked).length;
    expect(rookieOn).toBeGreaterThanOrEqual(1);
    expect(viceroyOn).toBeGreaterThan(rookieOn);
    // The Viceroy 都督 inherit-perk is unlocked; the Grand-Marshal one is not.
    expect(viceroy.find((p) => /Viceroy/.test(p.en))?.unlocked).toBe(true);
    expect(viceroy.find((p) => /Grand Marshal/.test(p.en))?.unlocked).toBe(false);
  });

  it('私兵上限 is capped by rank, not by leadership alone', () => {
    // 白身只養得起幾個賓客
    expect(careerGuardCap(careerStanding(undefined), 95)).toBe(10);
    // 部曲五十;九品一百
    expect(careerGuardCap(careerStanding({ battlesWon: 2 } as never), 95)).toBe(50);
    expect(careerGuardCap(careerStanding({ battlesWon: 5 } as never), 95)).toBe(100);
    // 都督起才吃統率
    expect(careerGuardCap(careerStanding({ citiesTaken: 16 } as never), 80)).toBe(80 * 100 + 6000);
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
      careerOfficerId: 'c', deeds: { c: { citiesTaken: 28 } as never },
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
