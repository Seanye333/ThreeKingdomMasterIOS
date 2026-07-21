import { describe, it, expect } from 'vitest';
import {
  campSicknessRisk, rollCampPlague, campSicknessTier, CAMP_GRACE_SEASONS,
} from './campDisease';

const base = { seasonsInField: 6, troops: 30000, season: 'summer' as const };

describe('軍中疫疾之險', () => {
  it('a column that just arrived is not sick', () => {
    expect(campSicknessRisk({ ...base, seasonsInField: CAMP_GRACE_SEASONS })).toBe(0);
    expect(campSicknessRisk({ ...base, seasonsInField: 0 })).toBe(0);
  });

  it('sitting still is what does it', () => {
    const short = campSicknessRisk({ ...base, seasonsInField: 3 });
    const long = campSicknessRisk({ ...base, seasonsInField: 10 });
    expect(long).toBeGreaterThan(short);
  });

  it('summer is the worst season, autumn the kindest', () => {
    expect(campSicknessRisk({ ...base, season: 'summer' }))
      .toBeGreaterThan(campSicknessRisk({ ...base, season: 'autumn' }));
    expect(campSicknessRisk({ ...base, season: 'winter' }))
      .toBeGreaterThan(campSicknessRisk({ ...base, season: 'autumn' }));
  });

  it('a camp of eighty thousand is not four camps of twenty', () => {
    expect(campSicknessRisk({ ...base, troops: 80000 }))
      .toBeGreaterThan(campSicknessRisk({ ...base, troops: 20000 }));
  });

  it('赤壁 — wet ground and an alien climate compound', () => {
    const plain = campSicknessRisk({ ...base, seasonsInField: 3 });
    const chibi = campSicknessRisk({ ...base, seasonsInField: 3, wetGround: true, alienClimate: true });
    expect(chibi).toBeGreaterThan(plain * 1.7);
  });

  it('hunger and sickness compound', () => {
    expect(campSicknessRisk({ ...base, starving: true })).toBeGreaterThan(campSicknessRisk(base));
  });

  it('a physician and a stock of medicine cut it down hard', () => {
    const bare = campSicknessRisk(base);
    const tended = campSicknessRisk({ ...base, physicianIntellect: 95, medicine: 30000 });
    expect(tended).toBeLessThan(bare * 0.45);
  });

  it('never exceeds the ceiling however bad it gets', () => {
    const worst = campSicknessRisk({
      seasonsInField: 40, troops: 300000, season: 'summer',
      wetGround: true, alienClimate: true, starving: true,
    });
    expect(worst).toBeLessThanOrEqual(0.4);
  });
});

describe('疫作', () => {
  const always = () => 0;   // rng below any risk → always strikes
  const never = () => 0.999;

  it('a healthy camp is never struck', () => {
    expect(rollCampPlague({ ...base, seasonsInField: 1 }, always).struck).toBe(false);
  });

  it('a strike costs a real slice of the army', () => {
    const r = rollCampPlague(base, always);
    expect(r.struck).toBe(true);
    expect(r.lost).toBeGreaterThan(base.troops * 0.1);
    expect(r.fatigue).toBeGreaterThan(0);
  });

  it('medicine halves the toll — and is spent either way', () => {
    const dosed = rollCampPlague({ ...base, medicine: 99999 }, always);
    const bare = rollCampPlague(base, always);
    expect(dosed.lost).toBeLessThan(bare.lost * 0.6);
    expect(dosed.medicineUsed).toBe(Math.round(base.troops * 0.05));
    expect(bare.medicineUsed).toBe(0);
  });

  it('never draws more medicine than the train carries', () => {
    const r = rollCampPlague({ ...base, medicine: 100 }, always);
    expect(r.medicineUsed).toBeLessThanOrEqual(100);
  });

  it('a lucky roll passes', () => {
    expect(rollCampPlague(base, never).struck).toBe(false);
  });

  it('tiers read the camp at a glance', () => {
    expect(campSicknessTier(0).zh).toBe('營中無恙');
    expect(campSicknessTier(0.05).zh).toBe('略有病卒');
    expect(campSicknessTier(0.15).zh).toBe('營中多病');
    expect(campSicknessTier(0.3).zh).toBe('疫氣大作');
  });
});
