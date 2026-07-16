/** 批 B 真團戰 — N-vs-M champion melee (圍攻/合擊/膽氣). */
import { describe, it, expect } from 'vitest';
import { resolveTeamDuel, teamDuelSlain } from './teamDuel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 55, politics: 50, charisma: 55 });

describe('resolveTeamDuel', () => {
  it('a 1v1 resolves to a winner or draw with rounds recorded', () => {
    const a = mkOfficer({ id: 'a', stats: W(88) });
    const b = mkOfficer({ id: 'b', stats: W(80) });
    const r = resolveTeamDuel([a], [b], seededRng(1));
    expect(['a', 'b', 'draw']).toContain(r.winner);
    expect(r.rounds).toBeGreaterThan(0);
    expect(r.a).toHaveLength(1);
    expect(r.b).toHaveLength(1);
  });

  it('the far stronger team wins the great majority of melees', () => {
    const strong = [mkOfficer({ id: 's1', stats: W(96) }), mkOfficer({ id: 's2', stats: W(92) })];
    const weak = [mkOfficer({ id: 'w1', stats: W(66) }), mkOfficer({ id: 'w2', stats: W(62) })];
    let wins = 0;
    for (let s = 0; s < 40; s++) {
      const r = resolveTeamDuel(strong, weak, seededRng(s * 9 + 1));
      if (r.winner === 'a') wins++;
    }
    expect(wins).toBeGreaterThan(30);
  });

  it('三英戰呂布 — three heroes gang the demigod, who cuts some down first', () => {
    const lubu = mkOfficer({ id: 'lu-bu', stats: W(100), traits: ['matchless', 'martial-valor'] });
    const three = [
      mkOfficer({ id: 'liu-bei', stats: W(74) }),
      mkOfficer({ id: 'guan-yu', stats: W(90) }),
      mkOfficer({ id: 'zhang-fei', stats: W(90) }),
    ];
    let trioWins = 0, bloodied = 0;
    for (let s = 0; s < 40; s++) {
      const r = resolveTeamDuel([lubu], three, seededRng(s * 7 + 3));
      if (r.winner === 'b') trioWins++;
      // the demigod cuts the trio up on his way down — at least one ends wounded.
      if (Math.min(...r.b.map((f) => f.stamina)) < 75) bloodied++;
    }
    // The trio should usually prevail by weight of numbers (圍攻)…
    expect(trioWins).toBeGreaterThan(20);
    // …but pay for it — a lone demigod bloodies the pack (three heroes ≠ a free win).
    expect(bloodied).toBeGreaterThan(20);
  });

  it('站位 — the van screens the rear from melee until it falls', () => {
    // one huge melee attacker vs a van screen + a weak rear fighter
    const bruiser = mkOfficer({ id: 'bruiser', stats: W(99), traits: ['matchless'] });
    const van = mkOfficer({ id: 'van', stats: W(70) });
    const rear = mkOfficer({ id: 'rear', stats: W(55) });
    const r = resolveTeamDuel([bruiser], [{ officer: van, station: 'van' }, { officer: rear, station: 'rear' }], seededRng(3));
    const vanF = r.b.find((f) => f.id === 'van')!;
    const rearF = r.b.find((f) => f.id === 'rear')!;
    // the rear fighter is untouched (or barely) until the van goes down
    if (vanF.downed && rearF.downed) {
      expect(rearF.downedRound!).toBeGreaterThan(vanF.downedRound!);
    } else if (!vanF.downed) {
      expect(rearF.downed).toBe(false); // screen held the whole bout
    }
  });

  it('站位 — an archer shoots over the screen from round one', () => {
    const archer = mkOfficer({ id: 'huang-zhong', stats: W(93) }); // bow via WEAPON_CLASS_BY_OFFICER
    const van = mkOfficer({ id: 'wall', stats: W(85) });
    const rear = mkOfficer({ id: 'squish', stats: W(50) });
    const r = resolveTeamDuel([archer], [{ officer: van, station: 'van' }, { officer: rear, station: 'rear' }], seededRng(6));
    const rearF = r.b.find((f) => f.id === 'squish')!;
    // the archer focuses the weakest (the rear) despite the screen — it takes hits
    expect(rearF.stamina).toBeLessThan(100);
  });

  it('teamDuelSlain lists only the truly killed (yielded/fled survive)', () => {
    const strong = [mkOfficer({ id: 'x', stats: W(99), traits: ['matchless'] })];
    const cravens = [mkOfficer({ id: 'c1', stats: W(55), traits: ['cowardly'] }), mkOfficer({ id: 'c2', stats: W(54), traits: ['cowardly'] })];
    let anyDowned = 0, everSlain = 0, everSpared = 0;
    for (let s = 0; s < 60; s++) {
      const r = resolveTeamDuel(strong, cravens, seededRng(s * 5 + 2));
      const downed = [...r.a, ...r.b].filter((f) => f.downed);
      if (downed.length) anyDowned++;
      const slain = teamDuelSlain(r);
      for (const f of downed) {
        expect(['slain', 'yield', 'flee']).toContain(f.fate);
        if (f.fate === 'slain') { everSlain++; expect(slain).toContain(f.id); }
        else { everSpared++; expect(slain).not.toContain(f.id); }
      }
    }
    expect(anyDowned).toBeGreaterThan(0);
    // cravens should be spared (yield/flee) at least sometimes, not always slain
    expect(everSpared).toBeGreaterThan(0);
    expect(everSlain + everSpared).toBeGreaterThan(0);
  });
});
