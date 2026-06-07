import { describe, it, expect } from 'vitest';
import { resolveDuel, canDuel } from './duel';
import { resolveWordWar } from './wordWar';
import { mkOfficer, seededRng } from '../../test/factories';

describe('canDuel', () => {
  it('rejects the dead, the weak and the frail', () => {
    expect(canDuel(mkOfficer({ status: 'dead' })).ok).toBe(false);
    expect(canDuel(mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } })).ok).toBe(false);
    expect(canDuel(mkOfficer({ stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 }, traits: ['frail'] })).ok).toBe(false);
    expect(canDuel(mkOfficer({ stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } })).ok).toBe(true);
  });
});

describe('resolveDuel — multi-round bout', () => {
  const strong = mkOfficer({ id: 'lu-bu', stats: { war: 100, leadership: 70, intelligence: 40, politics: 30, charisma: 60 }, traits: ['matchless'] });
  const weak = mkOfficer({ id: 'mook', stats: { war: 62, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } });

  it('produces a sequence of exchanges with decreasing stamina', () => {
    const r = resolveDuel({ attacker: strong, defender: weak, rng: seededRng(1) });
    expect(r.rounds.length).toBeGreaterThan(0);
    expect(r.rounds.length).toBeLessThanOrEqual(8);
    // Stamina never goes below 0 and ends matching the final fields.
    for (const ex of r.rounds) {
      expect(ex.attackerStamina).toBeGreaterThanOrEqual(0);
      expect(ex.defenderStamina).toBeGreaterThanOrEqual(0);
    }
    const last = r.rounds[r.rounds.length - 1];
    expect(last.attackerStamina).toBe(r.attackerStamina);
    expect(last.defenderStamina).toBe(r.defenderStamina);
  });

  it('a far stronger fighter reliably wins across seeds', () => {
    let strongWins = 0;
    for (let s = 0; s < 30; s++) {
      const r = resolveDuel({ attacker: strong, defender: weak, rng: seededRng(s * 13 + 1) });
      if (r.winner === 'attacker') strongWins++;
    }
    expect(strongWins).toBeGreaterThan(22); // dominant, not necessarily perfect
  });

  it('a knockout cuts the loser down (killedId set, stamina 0)', () => {
    // Find a seed that yields a knockout for the strong attacker.
    let found = false;
    for (let s = 0; s < 50 && !found; s++) {
      const r = resolveDuel({ attacker: strong, defender: weak, rng: seededRng(s * 7 + 3) });
      if (r.knockout) {
        found = true;
        expect(r.winner).not.toBe('draw');
        expect(r.killedId).toBeTruthy();
        const loserStamina = r.winner === 'attacker' ? r.defenderStamina : r.attackerStamina;
        expect(loserStamina).toBe(0);
      }
    }
    expect(found).toBe(true);
  });

  it('evenly matched fighters can draw (both survive)', () => {
    const a = mkOfficer({ id: 'a', stats: { war: 80, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    const b = mkOfficer({ id: 'b', stats: { war: 80, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    let draws = 0;
    for (let s = 0; s < 40; s++) {
      const r = resolveDuel({ attacker: a, defender: b, rng: seededRng(s * 5 + 2) });
      if (r.winner === 'draw') {
        draws++;
        expect(r.killedId).toBeUndefined();
      }
    }
    expect(draws).toBeGreaterThan(0);
  });
});

describe('resolveWordWar — momentum contest', () => {
  const make = (int: number, cha: number, id: string) =>
    mkOfficer({ id, stats: { war: 50, leadership: 50, intelligence: int, politics: 60, charisma: cha } });

  it('runs three exchanges with running totals', () => {
    const r = resolveWordWar(make(95, 90, 'zhuge'), make(60, 50, 'foe'), [], [], seededRng(1));
    expect(r.rounds.length).toBe(3);
    expect(r.lines.length).toBe(6); // two lines per exchange
    // running totals are monotonic non-decreasing
    for (let i = 1; i < r.rounds.length; i++) {
      expect(r.rounds[i].attackerTotal).toBeGreaterThanOrEqual(r.rounds[i - 1].attackerTotal);
      expect(r.rounds[i].defenderTotal).toBeGreaterThanOrEqual(r.rounds[i - 1].defenderTotal);
    }
  });

  it('the silver tongue usually wins and demoralizes the loser', () => {
    let aWins = 0;
    for (let s = 0; s < 25; s++) {
      const r = resolveWordWar(make(98, 95, 'zhuge'), make(55, 45, 'foe'), [], [], seededRng(s * 11 + 1));
      if (r.winnerSide === 'attacker') {
        aWins++;
        expect(r.defenderMoraleDelta).toBe(-10);
        expect(r.attackerMoraleDelta).toBe(0);
      }
    }
    expect(aWins).toBeGreaterThan(18);
  });

  it('picks the highest INT+charisma orator from each side', () => {
    const cmd = make(50, 50, 'cmd');
    const genius = make(99, 99, 'genius');
    const r = resolveWordWar(cmd, make(60, 60, 'dcmd'), [genius], [], seededRng(1));
    expect(r.attackerStrategistId).toBe('genius');
  });
});
