import { describe, it, expect } from 'vitest';
import {
  dilute, diluteDelta, mergeQuality, dilutionNote,
  CONSCRIPT_QUALITY, RECOVERED_QUALITY,
} from './reorganization';

describe('新兵稀釋', () => {
  it('no recruits, no change', () => {
    expect(dilute({ current: 80, existing: 10000, added: 0 })).toBe(80);
    expect(diluteDelta({ current: 80, existing: 10000, added: 0 })).toBe(0);
  });

  it('raw conscripts pull the average down in proportion', () => {
    // 10k at 80 + 10k at 0 → 40.
    expect(dilute({ current: 80, existing: 10000, added: 10000, addedQuality: CONSCRIPT_QUALITY })).toBe(40);
    expect(diluteDelta({ current: 80, existing: 10000, added: 10000 })).toBe(-40);
  });

  it('a trickle barely moves it', () => {
    expect(dilute({ current: 80, existing: 50000, added: 500 })).toBeGreaterThan(78);
  });

  it('傷癒歸伍 raises a raw garrison rather than diluting it', () => {
    const raw = dilute({ current: 20, existing: 10000, added: 2000, addedQuality: RECOVERED_QUALITY });
    expect(raw).toBeGreaterThan(20);
  });

  it('an empty garrison takes the incoming quality outright', () => {
    expect(dilute({ current: 90, existing: 0, added: 5000, addedQuality: 30 })).toBe(30);
  });

  it('stays inside 0–100', () => {
    expect(dilute({ current: 100, existing: 1, added: 1, addedQuality: 100 })).toBe(100);
    expect(dilute({ current: 0, existing: 1, added: 1, addedQuality: 0 })).toBe(0);
  });
});

describe('併軍', () => {
  it('weights by headcount', () => {
    expect(mergeQuality({ troopsA: 9000, qualityA: 90, troopsB: 1000, qualityB: 0 })).toBe(81);
  });

  it('two empty columns are nothing', () => {
    expect(mergeQuality({ troopsA: 0, qualityA: 90, troopsB: 0, qualityB: 90 })).toBe(0);
  });
});

describe('整編之報', () => {
  it('only reports a dilution worth mentioning', () => {
    expect(dilutionNote(80, 79)).toBeNull();
    const note = dilutionNote(80, 40);
    expect(note?.zh).toContain('稀釋');
  });
});
