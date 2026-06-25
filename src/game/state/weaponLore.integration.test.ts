/**
 * Integration test for 名器養成 on the STRATEGIC map: a weapon-bearing officer
 * marched into a weak enemy city fights an auto-resolved battle in the season
 * engine, and his blade's 威名 (itemLore) grows from it — proving the endSeason
 * harvest hook (not just the tactical-battle hook) seasons weapons.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';

const s = () => useGameStore.getState();
const pid = () => s().playerForceId!;

describe('名器養成 — strategic battles season weapons', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('a weapon carried through an auto-resolved march battle gains 威名', () => {
    // Player capital — give it a strong garrison + a champion bearing a famed blade.
    const capital = Object.values(s().cities).find((c) => c.ownerForceId === pid())!;
    const target = Object.values(s().cities).find(
      (c) => capital.adjacentCityIds.includes(c.id),
    )!;
    expect(target).toBeTruthy();

    const champion = Object.values(s().officers).find((o) => o.forceId === pid())!;
    useGameStore.setState({
      cities: {
        ...s().cities,
        [capital.id]: { ...capital, ownerForceId: pid(), troops: 12000, gold: 5000, food: 30000 },
        // Make the target a weak ENEMY holding so a battle is guaranteed.
        [target.id]: { ...s().cities[target.id], ownerForceId: 'rival-force', troops: 300, defense: 0, food: 2000 },
      },
      officers: {
        ...s().officers,
        [champion.id]: {
          ...champion, forceId: pid(), locationCityId: capital.id, status: 'idle', task: null,
          stats: { ...champion.stats, war: 95, leadership: 90 },
          equipment: ['green-dragon'],
        },
      },
      // No prior renown on the blade.
      itemLore: {},
    });

    const r = s().issueMarch(capital.id, target.id, champion.id, 8000);
    expect(r.ok, `march should dispatch: ${r.reason ?? ''}`).toBe(true);

    // Advance seasons until the column arrives and the battle resolves.
    let fought = false;
    for (let i = 0; i < 10 && !fought; i++) {
      useGameStore.setState({ date: { ...s().date, month: 3, phase: 'lower' } });
      s().endSeason();
      if ((s().itemLore['green-dragon'] ?? 0) > 0) fought = true;
    }
    expect(fought, 'the blade should have earned 威名 from a strategic battle').toBe(true);
    expect(s().itemLore['green-dragon']).toBeGreaterThan(0);
  });
});
