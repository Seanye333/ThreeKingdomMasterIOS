import { describe, it, expect, afterEach } from 'vitest';
import {
  commandTokenMultiplier, hasFullCommandStaff, COMMAND_TOKEN_IDS,
  evolvedResonanceMul, setEvolvedRegistry, ITEMS_BY_ID,
} from './items';

const TOKENS = [...COMMAND_TOKEN_IDS];
const eq = (equipment: string[]) => ({ equipment });

describe('六軍歸心 — command-token set bonus (N2)', () => {
  it('per-bearer bonus caps at +8%; three DIFFERENT tokens add a further +6%', () => {
    expect(commandTokenMultiplier([eq(['plain'])])).toBe(1);
    expect(commandTokenMultiplier([eq([TOKENS[0]])])).toBeCloseTo(1.04, 5);
    expect(commandTokenMultiplier([eq([TOKENS[0]]), eq([TOKENS[0]])])).toBeCloseTo(1.08, 5); // 2 bearers, same token
    // Three DISTINCT tokens: bearers cap (1.08) × 六軍歸心 1.06.
    const staff = [eq([TOKENS[0]]), eq([TOKENS[1]]), eq([TOKENS[2]])];
    expect(hasFullCommandStaff(staff)).toBe(true);
    expect(commandTokenMultiplier(staff)).toBeCloseTo(1.08 * 1.06, 5);
    // Two distinct is not yet the full staff.
    expect(hasFullCommandStaff([eq([TOKENS[0]]), eq([TOKENS[1]])])).toBe(false);
  });
});

describe('器魂共鳴 — awakened-arms resonance (N3)', () => {
  const W1 = Object.values(ITEMS_BY_ID).filter((i) => i.kind === 'weapon')[0].id;
  const W2 = Object.values(ITEMS_BY_ID).filter((i) => i.kind === 'weapon')[1].id;
  const W3 = Object.values(ITEMS_BY_ID).filter((i) => i.kind === 'weapon')[2].id;
  afterEach(() => setEvolvedRegistry([]));

  it('needs ≥2 awakened weapons; +3% each beyond the first, capped +6%', () => {
    setEvolvedRegistry([W1]);
    expect(evolvedResonanceMul([eq([W1])])).toBe(1); // one awakened → no resonance
    setEvolvedRegistry([W1, W2]);
    expect(evolvedResonanceMul([eq([W1]), eq([W2])])).toBeCloseTo(1.03, 5);
    setEvolvedRegistry([W1, W2, W3]);
    expect(evolvedResonanceMul([eq([W1]), eq([W2]), eq([W3])])).toBeCloseTo(1.06, 5);
    // A non-awakened weapon does not resonate.
    setEvolvedRegistry([W1]);
    expect(evolvedResonanceMul([eq([W1]), eq([W2])])).toBe(1);
  });
});
