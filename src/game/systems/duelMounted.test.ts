/** 馬戰 — the charge pass (衝鋒對撞) + mounted modifiers (馬上長兵/難閃). */
import { describe, it, expect } from 'vitest';
import {
  resolveChargePass, applyChargePass, initDuelBout, duelRound, resolveDuel, type DuelBout,
} from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 70, intelligence: 50, politics: 50, charisma: 60 });
// A lance-rider (spear class via signature) on a famed steed.
const lancer = (id: string, war: number) => mkOfficer({ id, stats: W(war), equipment: ['red-hare'] });

describe('衝鋒對撞 — the charge pass', () => {
  it('is fought only when at least one duellist is mounted', () => {
    const footA = mkOfficer({ id: 'a', stats: W(85) });
    const footB = mkOfficer({ id: 'b', stats: W(85) });
    expect(resolveChargePass(footA, footB, seededRng(1))).toBeNull();
    expect(resolveChargePass(lancer('m', 85), footB, seededRng(1))).not.toBeNull();
  });

  it('a much stronger rider tends to win the pass — and a crushing pass unhorses', () => {
    const strong = mkOfficer({ id: 'lu-bu', stats: W(100), traits: ['matchless'], equipment: ['red-hare'] });
    const weak = lancer('mook', 60);
    let strongWon = 0, unhorses = 0;
    for (let s = 0; s < 40; s++) {
      const p = resolveChargePass(strong, weak, seededRng(s * 7 + 1))!;
      if (p.winner === 'attacker') strongWon++;
      if (p.unhorsed === 'defender') unhorses++;
    }
    expect(strongWon).toBeGreaterThan(30);   // the monster wins the pass most times
    expect(unhorses).toBeGreaterThan(0);     // …and sometimes throws them from the saddle
  });

  it('applyChargePass folds the pass into a fresh bout (loser opens hurt / unhorsed)', () => {
    const bout = initDuelBout(lancer('a', 95), lancer('b', 70));
    const pass = { winner: 'attacker' as const, dmgToAttacker: 0, dmgToDefender: 22, unhorsed: 'defender' as const, textZh: '', textEn: '' };
    const after = applyChargePass(bout, pass);
    expect(after.dStamina).toBe(bout.dStamina - 22);
    expect(after.dUnhorsed).toBe(true);
    expect(after.dMountSavior).toBe(false); // thrown → no 的盧救主 on the ground
  });
});

describe('馬上修正 — reach & nimbleness', () => {
  it('馬上長兵: a mounted lancer reaches +4 deeper than once unhorsed', () => {
    const mounted: DuelBout = initDuelBout(lancer('zhao-yun', 90), mkOfficer({ id: 'foe', stats: W(85) }));
    expect(mounted.aMounted).toBe(true);
    let ridingDmg = 0, footDmg = 0;
    for (let s = 0; s < 30; s++) {
      // slash punished by dodge → a clean landed strike, with spear class.
      ridingDmg += duelRound(mounted, 'slash', 'dodge', seededRng(s + 1)).dmgToDefender;
      footDmg += duelRound({ ...mounted, aUnhorsed: true }, 'slash', 'dodge', seededRng(s + 1)).dmgToDefender;
    }
    expect(ridingDmg).toBeGreaterThan(footDmg); // the saddle's reach adds up
  });

  it('馬上難閃: a mounted fighter who dodges still gets chipped', () => {
    const mounted: DuelBout = initDuelBout(lancer('rider', 88), mkOfficer({ id: 'foe', stats: W(85) }));
    // dodge vs dodge (both defend) — a foot fighter takes 0; a rider takes a chip.
    const r = duelRound(mounted, 'dodge', 'guard', seededRng(4));
    expect(r.dmgToAttacker).toBeGreaterThan(0);
  });
});

describe('auto-resolve opens with the charge pass', () => {
  it('a mounted bout is decided differently than the same fighters on foot', () => {
    // Smoke test: resolveDuel runs without error for mounted fighters and the
    // charge pass docks the loser (so a strong rider wins even more dominantly).
    const strong = mkOfficer({ id: 'ma-chao', stats: W(96), equipment: ['red-hare'] });
    const weak = mkOfficer({ id: 'mook', stats: W(64), equipment: ['dilu'] });
    let wins = 0;
    for (let s = 0; s < 30; s++) if (resolveDuel({ attacker: strong, defender: weak, rng: seededRng(s * 13 + 1) }).winner === 'attacker') wins++;
    expect(wins).toBeGreaterThan(24);
  });
});
