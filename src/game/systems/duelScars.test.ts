/** 傷殘 — permanent maims that narrow a fighter's repertoire and prowess. */
import { describe, it, expect } from 'vitest';
import {
  duelScars, staticProwess, isDuelMoveUnlocked, unlockedDuelMoves, initDuelBout, rollDuelScar, DUEL_SCAR_INFO,
} from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 70, politics: 50, charisma: 60 });

describe('傷殘 — scars narrow the repertoire', () => {
  it('斷臂 bars 連擊 and saps prowess', () => {
    const whole = mkOfficer({ id: 'a', stats: W(90), level: 20 });
    const armless = mkOfficer({ id: 'a', stats: W(90), level: 20, duelScars: ['maimed-arm'] });
    expect(isDuelMoveUnlocked(whole, 'combo')).toBe(true);
    expect(isDuelMoveUnlocked(armless, 'combo')).toBe(false);
    expect(unlockedDuelMoves(armless)).not.toContain('combo');
    expect(staticProwess(armless)).toBe(staticProwess(whole) - 8);
  });

  it('跛足 bars 閃 dodge', () => {
    const lamed = mkOfficer({ id: 'b', stats: W(90), level: 20, duelScars: ['maimed-leg'] });
    expect(isDuelMoveUnlocked(lamed, 'dodge')).toBe(false);
    expect(unlockedDuelMoves(lamed)).not.toContain('dodge');
  });

  it('目眇 cripples the fighter\'s foe-reading (lower duel INT)', () => {
    const oneEyed = mkOfficer({ id: 'c', stats: W(90), duelScars: ['maimed-eye'] });
    const foe = mkOfficer({ id: 'd', stats: W(85) });
    const bout = initDuelBout(oneEyed, foe);
    expect(bout.aInt).toBe(70 - 25); // intelligence 70, reads the foe far worse
  });

  it('scars stack their prowess penalties', () => {
    const whole = mkOfficer({ id: 'e', stats: W(95) });
    const wrecked = mkOfficer({ id: 'e', stats: W(95), duelScars: ['maimed-arm', 'maimed-leg', 'maimed-eye'] });
    expect(staticProwess(wrecked)).toBe(staticProwess(whole) - (8 + 5 + 6));
    expect(duelScars(wrecked).length).toBe(3);
  });
});

describe('rollDuelScar — only sometimes, kind varies', () => {
  it('returns null most of the time, a maim sometimes', () => {
    const rng = seededRng(11);
    let maims = 0, total = 400;
    const kinds = new Set<string>();
    for (let i = 0; i < total; i++) { const s = rollDuelScar(rng); if (s) { maims++; kinds.add(s); } }
    expect(maims).toBeGreaterThan(40);            // ~22% → clearly some
    expect(maims).toBeLessThan(total * 0.5);      // …but a minority
    expect(kinds.size).toBeGreaterThanOrEqual(2); // more than one kind appears
    for (const k of kinds) expect(DUEL_SCAR_INFO[k as keyof typeof DUEL_SCAR_INFO]).toBeTruthy();
  });
});
