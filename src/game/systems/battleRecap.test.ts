/** 戰後復盤 — locks the derived recap stats. */
import { describe, expect, it } from 'vitest';
import { mkBattle, mkUnit, officerMap } from '../../test/factories';
import { mkOfficer } from '../../test/factories';
import { battleRecap } from './battleRecap';

describe('battleRecap', () => {
  it('finds the toughest and pillar units on the winning side', () => {
    const a1 = mkUnit({ id: 'a1', officerId: 'guan', side: 'attacker', troops: 9000, maxTroops: 10000 });
    const a2 = mkUnit({ id: 'a2', officerId: 'zhang', side: 'attacker', troops: 3000, maxTroops: 10000 });
    const d1 = mkUnit({ id: 'd1', officerId: 'foe', side: 'defender', troops: 0, maxTroops: 8000 });
    const battle = {
      ...mkBattle({ units: [a1, a2, d1] }),
      winner: 'attacker' as const, attackerLosses: 8000, defenderLosses: 8000, turn: 6,
      log: [{ turn: 3, text: '火燒連營!', kind: 'event' as const }, { turn: 4, text: '移動', kind: 'event' as const }],
    };
    const officers = officerMap([], [mkOfficer({ id: 'guan', name: { zh: '關羽', en: 'Guan' } }), mkOfficer({ id: 'zhang', name: { zh: '張飛', en: 'Zhang' } }), mkOfficer({ id: 'foe' })]);
    const r = battleRecap(battle, officers);
    expect(r.toughest?.officerId).toBe('guan');   // kept 90%
    expect(r.pillar?.officerId).toBe('guan');      // 9000 standing
    expect(r.exchangeRatio).toBe(1);               // equal losses
    expect(r.schemesCast).toBe(1);                 // only the fire line matches
  });

  it('a draw yields no MVP and no ratio', () => {
    const battle = { ...mkBattle({ units: [mkUnit({ id: 'x', officerId: 'o' })] }), winner: undefined };
    const r = battleRecap(battle, officerMap([], [mkOfficer({ id: 'o' })]));
    expect(r.toughest).toBeNull();
    expect(r.exchangeRatio).toBeNull();
  });
});
