import { describe, it, expect } from 'vitest';
import { fillRetinues } from './retinues';
import type { Officer, Force } from '../types';

const mkO = (over: Partial<Officer> & { id: string }): Officer =>
  ({ forceId: null, status: 'unsearched', birthYear: 150, deathYear: undefined,
     locationCityId: null, loyalty: 0, ...over } as unknown as Officer);

const liuBiao = { id: 'LB', rulerOfficerId: 'liu-biao', capitalCityId: 'xiangyang' } as unknown as Force;

describe('fillRetinues', () => {
  it('enlists a ruler\'s unassigned, living retinue into the force', () => {
    const officers = [
      mkO({ id: 'cai-mao', birthYear: 160 }),       // alive, free → enlist
      mkO({ id: 'liu-biao', forceId: 'LB' }),       // the ruler (already in)
    ];
    const after = fillRetinues(officers, [liuBiao], 200).find((o) => o.id === 'cai-mao')!;
    expect(after.forceId).toBe('LB');
    expect(after.status).toBe('idle');
    expect(after.locationCityId).toBe('xiangyang');
    expect(after.retinueOfLordId).toBe('liu-biao'); // 部曲故主 stamped
  });

  it('skips the dead, the not-yet-born, and officers already serving someone', () => {
    const officers = [
      mkO({ id: 'huang-zu', status: 'dead' }),            // dead
      mkO({ id: 'wen-pin', birthYear: 230 }),             // not born by 200
      mkO({ id: 'kuai-yue', forceId: 'OTHER' }),          // serving a rival
    ];
    const out = fillRetinues(officers, [liuBiao], 200);
    expect(out.find((o) => o.id === 'huang-zu')!.forceId).toBeNull();
    expect(out.find((o) => o.id === 'wen-pin')!.forceId).toBeNull();
    expect(out.find((o) => o.id === 'kuai-yue')!.forceId).toBe('OTHER');
  });

  it('is a no-op for a force with no retinue entry', () => {
    const noName = { id: 'X', rulerOfficerId: 'nobody', capitalCityId: 'c' } as unknown as Force;
    const officers = [mkO({ id: 'cai-mao' })];
    expect(fillRetinues(officers, [noName], 200)[0].forceId).toBeNull();
  });
});
