import { describe, it, expect } from 'vitest';
import {
  TRAIN_PER_SEASON,
  trainKey,
  trainsUsed,
  trainsLeft,
  canTrain,
  recordTrain,
  type TrainUsage,
} from './sparLimit';

const SPRING = { year: 200, season: 'spring' };
const SUMMER = { year: 200, season: 'summer' };

describe('sparLimit', () => {
  it('starts everyone with a full allowance', () => {
    const usage: TrainUsage = {};
    const key = trainKey(SPRING);
    expect(trainsUsed(usage, 'guan-yu', key)).toBe(0);
    expect(trainsLeft(usage, 'guan-yu', key)).toBe(TRAIN_PER_SEASON);
    expect(canTrain(usage, 'guan-yu', key)).toBe(true);
  });

  it('logs a spar for both participants', () => {
    const key = trainKey(SPRING);
    const usage = recordTrain({}, ['guan-yu', 'zhang-fei'], key);
    expect(trainsUsed(usage, 'guan-yu', key)).toBe(1);
    expect(trainsUsed(usage, 'zhang-fei', key)).toBe(1);
    expect(trainsLeft(usage, 'guan-yu', key)).toBe(TRAIN_PER_SEASON - 1);
  });

  it('runs an officer out of spars and blocks further ones', () => {
    const key = trainKey(SPRING);
    let usage: TrainUsage = {};
    for (let i = 0; i < TRAIN_PER_SEASON; i++) {
      usage = recordTrain(usage, ['guan-yu', 'zhang-fei'], key);
    }
    expect(trainsLeft(usage, 'guan-yu', key)).toBe(0);
    expect(canTrain(usage, 'guan-yu', key)).toBe(false);
  });

  it('lazily resets when the season rolls over', () => {
    const spring = trainKey(SPRING);
    const summer = trainKey(SUMMER);
    let usage = recordTrain({}, ['guan-yu'], spring);
    usage = recordTrain(usage, ['guan-yu'], spring);
    expect(canTrain(usage, 'guan-yu', spring)).toBe(false);
    // New season — the old stamp no longer matches, so the count reads as 0.
    expect(trainsUsed(usage, 'guan-yu', summer)).toBe(0);
    expect(canTrain(usage, 'guan-yu', summer)).toBe(true);
  });

  it('re-stamps stale usage to the current season on the next spar', () => {
    const spring = trainKey(SPRING);
    const summer = trainKey(SUMMER);
    let usage = recordTrain({}, ['guan-yu'], spring);
    usage = recordTrain(usage, ['guan-yu'], summer);
    expect(usage['guan-yu']).toEqual({ key: summer, count: 1 });
  });
});
