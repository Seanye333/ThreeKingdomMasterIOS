import { describe, it, expect } from 'vitest';
import { ITEMS_BY_ID, COMMAND_TOKEN_IDS, isCommandToken, commandTokenMultiplier } from './items';

describe('統御信物 — command tokens', () => {
  it('every token id is a real treasure with a hefty 統率', () => {
    for (const id of COMMAND_TOKEN_IDS) {
      const it = ITEMS_BY_ID[id];
      expect(it, id).toBeTruthy();
      expect(it.kind).toBe('treasure');
      expect(it.effects.leadership ?? 0).toBeGreaterThanOrEqual(6);
    }
    expect(isCommandToken('hufu-tiger-tally')).toBe(true);
    expect(isCommandToken('some-random-sword')).toBe(false);
  });

  it('the command aura scales with bearers and is capped', () => {
    const tokenId = [...COMMAND_TOKEN_IDS][0];
    const tokenId2 = [...COMMAND_TOKEN_IDS][1];
    expect(commandTokenMultiplier([{ equipment: ['plain-sword'] }])).toBe(1); // no token
    expect(commandTokenMultiplier([{ equipment: [tokenId] }])).toBeCloseTo(1.04, 5);
    expect(commandTokenMultiplier([{ equipment: [tokenId] }, { equipment: [tokenId2] }])).toBeCloseTo(1.08, 5);
    // Capped at +8% even with more bearers.
    expect(commandTokenMultiplier([{ equipment: [tokenId] }, { equipment: [tokenId2] }, { equipment: [tokenId] }])).toBeCloseTo(1.08, 5);
    expect(commandTokenMultiplier([null, undefined])).toBe(1);
  });
});
