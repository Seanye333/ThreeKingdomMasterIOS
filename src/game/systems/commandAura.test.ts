import { describe, it, expect } from 'vitest';
import { commandAuraMul, COMMAND_AURA_RADIUS } from './tactical';
import { mkUnit, mkBattle, mkOfficer } from '../../test/factories';
import type { Officer } from '../types';

const TIGER = 'hufu-tiger-tally';   // 虎符 → cavalry
const MUSTER = 'bingfu-command-tally'; // 兵符 → all arms

describe('統御指揮 — tactical command aura (E1/F1)', () => {
  // 虎符 borne by a cavalry commander; a cavalry unit near it, a foot unit near
  // it, and a foot unit out of range.
  const bearer = mkUnit({ id: 'B', officerId: 'ob', side: 'attacker', coord: { col: 0, row: 0 }, unitType: 'cavalry' });
  const horseNear = mkUnit({ id: 'H', officerId: 'oh', side: 'attacker', coord: { col: COMMAND_AURA_RADIUS, row: 0 }, unitType: 'cavalry' });
  const footNear = mkUnit({ id: 'I', officerId: 'oi', side: 'attacker', coord: { col: 1, row: 0 }, unitType: 'infantry' });
  const far = mkUnit({ id: 'F', officerId: 'of', side: 'attacker', coord: { col: COMMAND_AURA_RADIUS + 3, row: 0 }, unitType: 'cavalry' });
  const battle = mkBattle({ units: [bearer, horseNear, footNear, far] });
  const officers: Record<string, Officer> = {
    ob: mkOfficer({ id: 'ob', equipment: [TIGER] }),
    oh: mkOfficer({ id: 'oh' }), oi: mkOfficer({ id: 'oi' }), of: mkOfficer({ id: 'of' }),
  };

  it('兵科專屬 — the matching arm gets the fuller aura; others the base', () => {
    expect(commandAuraMul(battle, horseNear, officers)).toBeCloseTo(1.10, 5); // 虎符 favours cavalry
    expect(commandAuraMul(battle, footNear, officers)).toBeCloseTo(1.06, 5);  // foot still gets base
    expect(commandAuraMul(battle, far, officers)).toBe(1);                    // out of range
  });

  it('兵符 (all) gives everyone the even-handed base', () => {
    const muster = { ...officers, ob: mkOfficer({ id: 'ob', equipment: [MUSTER] }) };
    expect(commandAuraMul(battle, horseNear, muster)).toBeCloseTo(1.06, 5);
    expect(commandAuraMul(battle, footNear, muster)).toBeCloseTo(1.06, 5);
  });

  it('an enemy token-bearer lends nothing to our side', () => {
    const withFoe = { ...officers, oe: mkOfficer({ id: 'oe', equipment: [TIGER] }) };
    const foe = mkUnit({ id: 'E', officerId: 'oe', side: 'defender', coord: { col: 1, row: 0 } });
    const b2 = mkBattle({ units: [footNear, foe] });
    expect(commandAuraMul(b2, footNear, withFoe)).toBe(1); // no friendly bearer near footNear
  });
});
