/** 車輪戰 — locks fatigue carry-over and ordering. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { orderForGauntlet, resolveGauntlet } from './gauntlet';

const lubu = mkOfficer({ id: 'lu-bu', name: { zh: '呂布', en: 'Lu Bu' }, stats: { war: 100 } });

describe('resolveGauntlet', () => {
  it('runs every challenger in order until the champion falls', () => {
    const challengers = [
      mkOfficer({ id: 'a', name: { zh: '甲', en: 'A' }, stats: { war: 60 } }),
      mkOfficer({ id: 'b', name: { zh: '乙', en: 'B' }, stats: { war: 70 } }),
      mkOfficer({ id: 'c', name: { zh: '丙', en: 'C' }, stats: { war: 80 } }),
    ];
    const r = resolveGauntlet(lubu, challengers, () => 0.5);
    expect(r.bouts.length).toBeGreaterThanOrEqual(1);
    expect(r.bouts.length).toBeLessThanOrEqual(3);
    // Champion stamina never increases across bouts (no rest).
    for (let i = 1; i < r.bouts.length; i++) {
      expect(r.bouts[i].championStaminaBefore).toBeLessThanOrEqual(r.bouts[i - 1].championStaminaBefore);
    }
  });

  it('three strong challengers wear down even Lu Bu (fatigue bites)', () => {
    const trio = ['guan', 'zhang', 'liu'].map((id, i) =>
      mkOfficer({ id, name: { zh: id, en: id }, stats: { war: 88 + i } }));
    const r = resolveGauntlet(lubu, trio, () => 0.55);
    // Either he falls, or he's badly bled by the last bout.
    const last = r.bouts[r.bouts.length - 1];
    expect(last.championStaminaAfter).toBeLessThan(100);
  });

  it('orders the roster strongest-last', () => {
    const ordered = orderForGauntlet([
      mkOfficer({ id: 'strong', stats: { war: 95 } }),
      mkOfficer({ id: 'weak', stats: { war: 40 } }),
    ]);
    expect(ordered[ordered.length - 1].id).toBe('strong');
  });
});
