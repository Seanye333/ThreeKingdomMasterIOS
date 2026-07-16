/** 批 A 回合內臨場感 — 膽氣怯戰 · 環境借勢 · 部位打擊. */
import { describe, it, expect } from 'vitest';
import {
  duelValor, duelDeathFate, checkDuelBreak,
  applyDuelExploit, TERRAIN_EXPLOIT,
  applyAimedStrike,
  resolveDuel, initDuelBout,
  type DuelFate,
} from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 60, politics: 50, charisma: 60 });

describe('膽氣 (duelValor) — nerve read from temperament & might', () => {
  it('a 忠勇 warrior towers over a craven', () => {
    const brave = mkOfficer({ id: 'brave', stats: W(95), traits: ['martial-valor', 'ironhearted', 'loyal'] });
    const craven = mkOfficer({ id: 'craven', stats: W(60), traits: ['cowardly'] });
    expect(duelValor(brave)).toBeGreaterThan(duelValor(craven) + 30);
    expect(duelValor(craven)).toBeLessThan(40);
    expect(duelValor(brave)).toBeGreaterThan(75);
  });
  it('is clamped to 4..100', () => {
    const god = mkOfficer({ id: 'g', stats: W(100), traits: ['matchless', 'martial-valor', 'berserker', 'duelist', 'bloodthirsty'] });
    const wretch = mkOfficer({ id: 'w', stats: W(50), traits: ['cowardly', 'frail', 'sickly', 'cunning'] });
    expect(duelValor(god)).toBeLessThanOrEqual(100);
    expect(duelValor(wretch)).toBeGreaterThanOrEqual(4);
  });
});

describe('膽氣 (duelDeathFate) — how a loser meets defeat', () => {
  const tally = (o: ReturnType<typeof mkOfficer>) => {
    const rng = seededRng(7);
    const c: Record<DuelFate, number> = { slain: 0, yield: 0, flee: 0 };
    for (let i = 0; i < 600; i++) c[duelDeathFate(o, rng)]++;
    return c;
  };
  it('the brave overwhelmingly fight to the death', () => {
    const brave = mkOfficer({ id: 'b', stats: W(95), traits: ['martial-valor', 'ironhearted', 'matchless'] });
    const c = tally(brave);
    expect(c.slain).toBeGreaterThan(c.yield + c.flee);
    expect(c.flee).toBe(0); // the steadfast never run
  });
  it('the craven mostly break, and are apt to flee', () => {
    const craven = mkOfficer({ id: 'c', stats: W(58), traits: ['cowardly'] });
    const c = tally(craven);
    expect(c.slain).toBeLessThan(300); // a minority die where they stand
    expect(c.flee).toBeGreaterThan(0);
    expect(c.yield + c.flee).toBeGreaterThan(c.slain);
  });
});

describe('膽氣 in resolveDuel — a beaten craven need not die', () => {
  it('a decisively-beaten craven yields/flees far more than a hero', () => {
    const champ = mkOfficer({ id: 'champ', stats: W(99), traits: ['matchless'] });
    const craven = mkOfficer({ id: 'craven', stats: W(52), traits: ['cowardly'] });
    const hero = mkOfficer({ id: 'hero', stats: W(52), traits: ['martial-valor', 'ironhearted'] });
    const spared = (loser: ReturnType<typeof mkOfficer>) => {
      const rng = seededRng(3);
      let kills = 0, fates = 0, wins = 0;
      for (let i = 0; i < 300; i++) {
        const r = resolveDuel({ attacker: champ, defender: loser, rng });
        if (r.winner === 'attacker') {
          wins++;
          if (r.killedId === loser.id) kills++;
          if (r.fate) fates++;
        }
      }
      return { kills, fates, wins };
    };
    const cr = spared(craven);
    const hr = spared(hero);
    // Both lose most bouts to a demigod, but the craven survives (fate) far oftener.
    expect(cr.fates).toBeGreaterThan(0);
    expect(cr.fates / Math.max(1, cr.wins)).toBeGreaterThan(hr.fates / Math.max(1, hr.wins));
    // When fate spares them, no kill is recorded.
    expect(cr.kills + cr.fates).toBeLessThanOrEqual(cr.wins);
  });
});

describe('怯戰 (checkDuelBreak) — a cornered foe may break', () => {
  it('never breaks while healthy', () => {
    const foe = mkOfficer({ id: 'f', stats: W(60), traits: ['cowardly'] });
    const bout = initDuelBout(mkOfficer({ id: 'me', stats: W(90) }), foe);
    const rng = seededRng(1);
    for (let i = 0; i < 50; i++) expect(checkDuelBreak(bout, 'defender', foe, rng)).toBeNull();
  });
  it('a cornered craven breaks; a cornered hero holds', () => {
    const me = mkOfficer({ id: 'me', stats: W(95) });
    const craven = mkOfficer({ id: 'c', stats: W(55), traits: ['cowardly'] });
    const hero = mkOfficer({ id: 'h', stats: W(55), traits: ['martial-valor', 'ironhearted'] });
    const breaks = (foe: ReturnType<typeof mkOfficer>) => {
      const rng = seededRng(5);
      let n = 0;
      for (let i = 0; i < 400; i++) {
        const bout = { ...initDuelBout(me, foe), dStamina: 10 };
        if (checkDuelBreak(bout, 'defender', foe, rng)) n++;
      }
      return n;
    };
    expect(breaks(craven)).toBeGreaterThan(breaks(hero));
    expect(breaks(craven)).toBeGreaterThan(0);
  });
});

describe('環境借勢 (applyDuelExploit) — the ground as a weapon', () => {
  const me = mkOfficer({ id: 'me', stats: W(88) });
  const foe = mkOfficer({ id: 'foe', stats: W(80) });
  it('every terrain has a labelled exploit and chips the foe', () => {
    for (const terr of Object.keys(TERRAIN_EXPLOIT) as Array<keyof typeof TERRAIN_EXPLOIT>) {
      const bout = initDuelBout(me, foe, 0, 0, 'veteran', terr);
      const r = applyDuelExploit(bout, 'attacker', seededRng(9));
      expect(r.textZh.length).toBeGreaterThan(1);
      expect(r.dmgToFoe).toBeGreaterThan(0);
      expect(r.bout.dStamina).toBeLessThan(bout.dStamina); // foe took the hit
      expect(r.bout.dFlaw).toBeGreaterThanOrEqual(bout.dFlaw); // …and is opened up
    }
  });
  it('據橋斷喝 unhorses a mounted foe (bridge)', () => {
    const rider = mkOfficer({ id: 'rider', stats: W(80), equipment: ['red-hare'] });
    const bout = initDuelBout(me, rider, 0, 0, 'veteran', 'bridge');
    // only meaningful if the foe actually entered mounted
    if (bout.dMounted) {
      const r = applyDuelExploit(bout, 'attacker', seededRng(2));
      expect(r.unhorsed === 'defender' || r.bout.dUnhorsed).toBe(true);
    }
  });
  it('火海 exploit singes the exploiter a little (self cost)', () => {
    const bout = initDuelBout(me, foe, 0, 0, 'veteran', 'fire');
    const r = applyDuelExploit(bout, 'attacker', seededRng(4));
    expect(r.dmgToSelf).toBeGreaterThan(0);
    expect(r.bout.aStamina).toBeLessThan(bout.aStamina);
  });
  it('never kills — floors the foe at 1 氣力', () => {
    const bout = { ...initDuelBout(me, foe, 0, 0, 'veteran', 'fire'), dStamina: 3 };
    const r = applyDuelExploit(bout, 'attacker', seededRng(6));
    expect(r.bout.dStamina).toBeGreaterThanOrEqual(1);
  });
});

describe('部位打擊 (applyAimedStrike) — a called shot', () => {
  const strong = mkOfficer({ id: 'strong', stats: W(98), traits: ['matchless'] });
  const weak = mkOfficer({ id: 'weak', stats: W(62) });
  it('擊械 disarms often for a far stronger arm', () => {
    let ok = 0;
    const rng = seededRng(8);
    for (let i = 0; i < 200; i++) {
      const bout = initDuelBout(strong, weak);
      const r = applyAimedStrike(bout, 'attacker', 'disarm', rng);
      if (r.ok) { ok++; expect(r.disarm).toBe('defender'); expect(r.bout.dGuard).toBe(0); }
    }
    expect(ok).toBeGreaterThan(100); // clear majority land for a demigod vs a weakling
  });
  it('斬馬 against a foot fighter is wasted breath', () => {
    const bout = initDuelBout(strong, weak); // weak has no mount
    const r = applyAimedStrike(bout, 'attacker', 'unhorse', seededRng(1));
    expect(r.ok).toBe(false);
    expect(r.bout.aFlaw).toBeGreaterThan(bout.aFlaw); // and it left the aimer open
  });
  it('a whiff opens the aimer up (破綻)', () => {
    // a weakling aiming at a demigod mostly misses → self flaw rises
    let opened = 0;
    const rng = seededRng(2);
    for (let i = 0; i < 100; i++) {
      const bout = initDuelBout(weak, strong);
      const r = applyAimedStrike(bout, 'attacker', 'disarm', rng);
      if (!r.ok) { opened++; expect(r.bout.aFlaw).toBeGreaterThan(bout.aFlaw); }
    }
    expect(opened).toBeGreaterThan(0);
  });
});
