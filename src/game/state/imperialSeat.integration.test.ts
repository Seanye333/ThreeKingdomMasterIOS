/**
 * 京師 — the emperor's city ranks as 京 regardless of census (許都), the seat
 * is derived from the scenario's era (洛陽 → 長安 192+ → 許都 196+, none on
 * non-Han boards), and the 都 rank travels with the emperor on 奉迎天子.
 */
import { describe, it, expect, beforeAll } from 'vitest';

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
import { citySize } from '../systems/citySize';

const byId = (id: string) => SCENARIOS.find((s) => s.id === id)!;

describe('京師 — emperor seat derivation on scenario load', () => {
  it('200 官渡: the emperor sits at 許昌 and it ranks 京 despite its census', () => {
    const scn = byId('scn-200-guandu');
    useGameStore.getState().loadScenario(scn, scn.forces[0].id, 'normal');
    const s = useGameStore.getState();
    expect(s.emperorCityId).toBe('xuchang');
    const xuchang = s.cities['xuchang'];
    expect(xuchang.imperialSeat).toBe(true);
    expect(xuchang.population).toBeLessThan(280_000); // not a capital by census…
    expect(citySize(xuchang).id).toBe('capital');     // …but 京師 outranks it
  });

  it('190 討董: the emperor still sits at 洛陽', () => {
    const scn = byId('scn-190-anti-dong-zhuo');
    useGameStore.getState().loadScenario(scn, scn.forces[0].id, 'normal');
    const s = useGameStore.getState();
    expect(s.emperorCityId).toBe('luoyang');
    expect(s.cities['luoyang']?.imperialSeat).toBe(true);
  });

  it('194 徐州: the court is captive at 長安', () => {
    const scn = byId('scn-194-xuzhou');
    useGameStore.getState().loadScenario(scn, scn.forces[0].id, 'normal');
    const s = useGameStore.getState();
    expect(s.emperorCityId).toBe('changan');
    expect(s.cities['changan']?.imperialSeat).toBe(true);
  });

  it('戰國盤 has no Han emperor at all', () => {
    const scn = byId('scn-ws-changping');
    useGameStore.getState().loadScenario(scn, scn.forces[0].id, 'normal');
    const s = useGameStore.getState();
    expect(s.emperorCityId).toBeNull();
    expect(Object.values(s.cities).some((c) => c.imperialSeat)).toBe(false);
  });
});
