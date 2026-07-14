import { describe, it, expect } from 'vitest';
import { commandAuraMul, COMMAND_AURA_RADIUS } from './tactical';
import { mkUnit, mkBattle, mkOfficer } from '../../test/factories';
import type { Officer } from '../types';

const TOKEN = 'hufu-tiger-tally';

describe('統御指揮 — tactical command aura (E1)', () => {
  const bearer = mkUnit({ id: 'B', officerId: 'ob', side: 'attacker', coord: { col: 0, row: 0 } });
  const near = mkUnit({ id: 'N', officerId: 'on', side: 'attacker', coord: { col: COMMAND_AURA_RADIUS, row: 0 } });
  const far = mkUnit({ id: 'F', officerId: 'of', side: 'attacker', coord: { col: COMMAND_AURA_RADIUS + 3, row: 0 } });
  const foe = mkUnit({ id: 'E', officerId: 'oe', side: 'defender', coord: { col: 1, row: 0 } });
  const battle = mkBattle({ units: [bearer, near, far, foe] });
  const officers: Record<string, Officer> = {
    ob: mkOfficer({ id: 'ob', equipment: [TOKEN] }),
    on: mkOfficer({ id: 'on' }),
    of: mkOfficer({ id: 'of' }),
    oe: mkOfficer({ id: 'oe', equipment: [TOKEN] }), // enemy token — different side, no help to us
  };

  it('marshals units within the radius (including the bearer), not those beyond', () => {
    expect(commandAuraMul(battle, bearer, officers)).toBeCloseTo(1.06, 5); // the bearer itself
    expect(commandAuraMul(battle, near, officers)).toBeCloseTo(1.06, 5);   // within radius
    expect(commandAuraMul(battle, far, officers)).toBe(1);                 // out of radius
  });

  it('an enemy token-bearer lends nothing to our side', () => {
    // `far` is out of OUR bearer's radius; the enemy bearer (foe) is close but
    // on the other side, so it must not buff us.
    expect(commandAuraMul(battle, far, officers)).toBe(1);
  });
});
