import { describe, it, expect } from 'vitest';
import {
  buildRelayNetwork, relayEffects, relayTier, RELAY_RANGE, RELAY_BUILDINGS,
  type RelayNode,
} from './postalRelay';

/** A line of cities c0—c1—c2—…, all owned unless said otherwise. */
const line = (n: number, relays: number[] = [], unowned: number[] = []): {
  nodes: RelayNode[];
  neighborsOf: (id: string) => string[];
} => ({
  nodes: Array.from({ length: n }, (_, i) => ({
    cityId: `c${i}`,
    owned: !unowned.includes(i),
    hasRelay: relays.includes(i),
  })),
  neighborsOf: (id: string) => {
    const i = Number(id.slice(1));
    return [i - 1, i + 1].filter((k) => k >= 0 && k < n).map((k) => `c${k}`);
  },
});

describe('驛傳網絡', () => {
  it('a dispatch rides its range and no further', () => {
    const net = buildRelayNetwork({ ...line(8), capitalCityId: 'c0' });
    for (let i = 0; i <= RELAY_RANGE; i++) {
      expect(net.get(`c${i}`)?.connected).toBe(true);
    }
    expect(net.get(`c${RELAY_RANGE + 1}`)?.connected).toBe(false);
  });

  it('a station remounts the rider and the chain continues', () => {
    const net = buildRelayNetwork({ ...line(9, [3, 6]), capitalCityId: 'c0' });
    expect(net.get('c8')?.connected).toBe(true);
    expect(net.get('c8')?.hops).toBe(8);
  });

  it('a station just out of reach rescues nothing', () => {
    const net = buildRelayNetwork({ ...line(9, [6]), capitalCityId: 'c0' });
    expect(net.get('c6')?.connected).toBe(false);
    expect(net.get('c8')?.connected).toBe(false);
  });

  it('a lost city breaks the chain behind it', () => {
    const net = buildRelayNetwork({ ...line(9, [3, 6], [2]), capitalCityId: 'c0' });
    expect(net.get('c1')?.connected).toBe(true);
    expect(net.get('c3')?.connected).toBe(false);
    expect(net.get('c8')?.connected).toBe(false);
  });

  it('no capital, no network', () => {
    const net = buildRelayNetwork({ ...line(4, [1, 2, 3]), capitalCityId: null });
    expect([...net.values()].every((r) => !r.connected)).toBe(true);
  });

  it('a capital you no longer hold carries no writ', () => {
    const net = buildRelayNetwork({ ...line(4, [1], [0]), capitalCityId: 'c0' });
    expect([...net.values()].every((r) => !r.connected)).toBe(true);
  });

  it('takes the better of two routes to the same city', () => {
    // A diamond: c0 —(bare)— c1 —— c3, and c0 —— c2(station) —— c3.
    const nodes: RelayNode[] = [
      { cityId: 'c0', owned: true, hasRelay: false },
      { cityId: 'c1', owned: true, hasRelay: false },
      { cityId: 'c2', owned: true, hasRelay: true },
      { cityId: 'c3', owned: true, hasRelay: false },
      { cityId: 'c4', owned: true, hasRelay: false },
      { cityId: 'c5', owned: true, hasRelay: false },
    ];
    const adj: Record<string, string[]> = {
      c0: ['c1', 'c2'], c1: ['c0', 'c3'], c2: ['c0', 'c3'],
      c3: ['c1', 'c2', 'c4'], c4: ['c3', 'c5'], c5: ['c4'],
    };
    const net = buildRelayNetwork({ nodes, neighborsOf: (id) => adj[id] ?? [], capitalCityId: 'c0' });
    // Routed through the station at c2, the rider still has range left at c3,
    // so it reaches c5 — which the bare c1 route could never do.
    expect(net.get('c5')?.connected).toBe(true);
  });

  it('is deterministic', () => {
    const a = buildRelayNetwork({ ...line(9, [3, 6]), capitalCityId: 'c0' });
    const b = buildRelayNetwork({ ...line(9, [3, 6]), capitalCityId: 'c0' });
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});

describe('政令所及之效', () => {
  it('斷驛 is where it bites', () => {
    const cut = relayEffects(undefined);
    expect(cut.corruptionMul).toBeGreaterThan(1.3);
    expect(cut.loyaltyDelta).toBeLessThan(0);
    expect(cut.hiddenDelta).toBeGreaterThan(0);
    expect(relayTier(undefined).zh).toBe('斷驛');
  });

  it('the capital ring is genuinely well governed', () => {
    const near = relayEffects({ hops: 1, connected: true });
    expect(near.corruptionMul).toBeLessThan(1);
    expect(near.loyaltyDelta).toBeGreaterThan(0);
    expect(relayTier({ hops: 0, connected: true }).zh).toBe('輦轂之下');
  });

  it('a long but intact chain is merely normal', () => {
    const mid = relayEffects({ hops: 4, connected: true });
    expect(mid.loyaltyDelta).toBe(0);
    expect(Math.abs(mid.corruptionMul - 1)).toBeLessThan(0.1);
  });

  it('the far end of a very long road drifts a little', () => {
    const far = relayEffects({ hops: 9, connected: true });
    expect(far.corruptionMul).toBeGreaterThan(1);
    expect(far.corruptionMul).toBeLessThan(relayEffects(undefined).corruptionMul);
    expect(relayTier({ hops: 9, connected: true }).zh).toBe('驛路迢遙');
  });

  it('both relay buildings count', () => {
    expect(RELAY_BUILDINGS.has('relay')).toBe(true);
    expect(RELAY_BUILDINGS.has('supplydepot')).toBe(true);
    expect(RELAY_BUILDINGS.has('arsenal')).toBe(false);
  });
});
