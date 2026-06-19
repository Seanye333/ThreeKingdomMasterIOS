/** 勢力消長 — locks the snapshot math and the cap. */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { POWER_HISTORY_CAP, appendPowerHistory, forcePower, takePowerSnapshot } from './powerHistory';

const cities: Record<string, City> = {
  a: { id: 'a', ownerForceId: 'wei', troops: 8000, gold: 2000 } as City,
  b: { id: 'b', ownerForceId: 'wei', troops: 4000, gold: 400 } as City,
  c: { id: 'c', ownerForceId: null, troops: 9999, gold: 9999 } as City,
};

describe('powerHistory', () => {
  it('power = cities anchor + troops + gold/4; the masterless count for no one', () => {
    expect(forcePower(cities, 'wei')).toBe(5000 + 8000 + 500 + 5000 + 4000 + 100);
    const snap = takePowerSnapshot(cities, 200, 'spring');
    expect(snap.byForce.wei).toBe(forcePower(cities, 'wei'));
    expect(Object.keys(snap.byForce)).toEqual(['wei']);
  });
  it('history stays capped', () => {
    let h = [] as ReturnType<typeof takePowerSnapshot>[];
    for (let i = 0; i < POWER_HISTORY_CAP + 10; i++) h = appendPowerHistory(h, takePowerSnapshot(cities, 200 + i, 'spring'));
    expect(h).toHaveLength(POWER_HISTORY_CAP);
    expect(h[h.length - 1].year).toBe(200 + POWER_HISTORY_CAP + 9);
  });
});
