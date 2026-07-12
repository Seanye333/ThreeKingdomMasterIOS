import { describe, it, expect } from 'vitest';
import { pickAiFormation } from './tactical';
import { aiTakeTurn } from './tacticalAi';
import { setupTacticalBattle } from './tacticalSetup';
import type { Officer, UnitType } from '../types';

/**
 * 平衡基線鎖 — a seeded mini-matrix of AI-vs-AI battles asserting the §5.1
 * arm triangle stays healthy. The cavalry case (2026-07) burned three
 * generations of constant tuning because the shock/volley stratagems bypassed
 * the combat model entirely — this guard makes the NEXT regression scream in
 * CI instead of hiding in play-feel. Seeded LCG → fully deterministic, but the
 * bands carry slack so honest rebalancing doesn't trip it.
 */

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

let oc = 0;
function mkOfficer(war: number, lead: number): Officer {
  const id = `bal${oc++}`;
  return {
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: lead, war, intelligence: 66, politics: 50, charisma: 60 },
    loyalty: 100, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  } as Officer;
}

/** One 3v3 18k-vs-18k field battle; returns the winner (or none at the cap). */
function runBattle(aArm: UnitType, dArm: UnitType, seed: number): 'attacker' | 'defender' | 'none' {
  const rng = lcg(seed + 1);
  const officers: Record<string, Officer> = {};
  const mk = (arm: UnitType) => [0, 1, 2].map((i) => {
    const o = mkOfficer(i === 0 ? 80 : 74, i === 0 ? 78 : 70);
    officers[o.id] = o;
    return { officer: o, troops: 6000, unitType: arm };
  });
  const dForm = pickAiFormation([dArm, dArm, dArm], 66, { defensive: true });
  const aForm = pickAiFormation([aArm, aArm, aArm], 66, { counter: dForm });
  let b = setupTacticalBattle({
    cityId: 'demo', width: 14, height: 10,
    attackerForceId: 'A', defenderForceId: 'D',
    attackers: mk(aArm), defenders: mk(dArm),
    attackerFormation: aForm, defenderFormation: dForm, field: true,
  });
  let guard = 120;
  while (!b.winner && b.turn <= 30 && guard-- > 0) {
    b = aiTakeTurn(b, officers, rng, { skill: 1, autoDuel: true }).battle;
  }
  return b.winner ?? 'none';
}

/** Win rate of `arm` against `foe` across both orientations (2×N battles). */
function winRate(arm: UnitType, foe: UnitType, n = 12): number {
  let wins = 0, decided = 0;
  for (let i = 0; i < n; i++) {
    const w1 = runBattle(arm, foe, 1000 + i * 7);
    if (w1 !== 'none') { decided++; if (w1 === 'attacker') wins++; }
    const w2 = runBattle(foe, arm, 5000 + i * 7);
    if (w2 !== 'none') { decided++; if (w2 === 'defender') wins++; }
  }
  return decided > 0 ? wins / decided : 0.5;
}

describe('§5.1 兵種三角基線 — seeded regression guard', () => {
  it('槍剋騎 — the spear-wall turns the horse (≥50%)', () => {
    expect(winRate('spearmen', 'cavalry')).toBeGreaterThanOrEqual(0.5);
  });

  it('騎不再統治 — cavalry stays under 65% vs every foot arm', () => {
    expect(winRate('cavalry', 'spearmen')).toBeLessThanOrEqual(0.65);
    expect(winRate('cavalry', 'infantry')).toBeLessThanOrEqual(0.7);
  });

  it('弓剋步成立但不再屠殺 (35–92%)', () => {
    const r = winRate('archers', 'spearmen');
    expect(r).toBeGreaterThanOrEqual(0.35);
    expect(r).toBeLessThanOrEqual(0.92);
  });

  it('騎弓相持 — neither side dominates the horse-vs-bow axis (25–75%)', () => {
    const r = winRate('cavalry', 'archers');
    expect(r).toBeGreaterThanOrEqual(0.25);
    expect(r).toBeLessThanOrEqual(0.75);
  });

  it('鏡像先手 — first move must not decide an equal fight (≤85%)', () => {
    let atkWins = 0, decided = 0;
    for (let i = 0; i < 16; i++) {
      const w = runBattle('infantry', 'infantry', 9000 + i * 11);
      if (w !== 'none') { decided++; if (w === 'attacker') atkWins++; }
    }
    expect(decided).toBeGreaterThan(0);
    expect(atkWins / decided).toBeLessThanOrEqual(0.85);
  });
});
