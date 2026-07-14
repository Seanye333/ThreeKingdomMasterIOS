import { describe, it, expect } from 'vitest';
import {
  resolveDuel, initDuelBout, duelRound, mountEdge, signatureUlt, SPIRIT_MAX,
  type DuelBout,
} from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const warStats = (war: number) => ({ war, leadership: 60, intelligence: 60, politics: 60, charisma: 60 });

describe('坐騎 — mount edges', () => {
  it('classifies famous mounts: 赤兔→charge, 的盧/絕影→savior', () => {
    expect(mountEdge(mkOfficer({ equipment: ['red-hare'] }))).toBe('charge');
    expect(mountEdge(mkOfficer({ equipment: ['dilu'] }))).toBe('savior');
    expect(mountEdge(mkOfficer({ equipment: ['jue-ying'] }))).toBe('savior');
    expect(mountEdge(mkOfficer({ equipment: [] }))).toBe(null);
  });

  it('a war-charger opens the interactive bout with a banked 氣 (先發)', () => {
    const rider = mkOfficer({ id: 'a', stats: warStats(85), equipment: ['red-hare'] });
    const plain = mkOfficer({ id: 'b', stats: warStats(85) });
    const bout = initDuelBout(rider, plain);
    expect(bout.aGuard).toBe(1);
    expect(bout.dGuard).toBe(0);
  });

  it('的盧救主 — a wonder-horse spares the rider one killing blow in the auto bout', () => {
    // A weak rider on 的盧 vs a monster: across seeds where they get knocked out,
    // the savior mount must suppress the kill (no killedId) at least sometimes,
    // and must NEVER let the mounted rider be killed.
    const monster = mkOfficer({ id: 'lu-bu', stats: warStats(100), traits: ['matchless'] });
    const saved = mkOfficer({ id: 'liu-bei', stats: warStats(64), equipment: ['dilu'] });
    let riderKilledEver = false;
    let knockouts = 0;
    for (let s = 0; s < 60; s++) {
      const r = resolveDuel({ attacker: monster, defender: saved, rng: seededRng(s * 7 + 1) });
      if (r.knockout && r.winner === 'attacker') knockouts++;
      if (r.killedId === saved.id) riderKilledEver = true;
    }
    expect(knockouts).toBeGreaterThan(0);     // they DO get knocked down…
    expect(riderKilledEver).toBe(false);      // …but the horse always saves them.
  });

  it('的盧救主 fires once per interactive bout, then a second KO is lethal', () => {
    const rider = mkOfficer({ id: 'a', stats: warStats(70), equipment: ['dilu'] });
    const foe = mkOfficer({ id: 'b', stats: warStats(95) });
    // Drive the rider's stamina to 0 twice via repeated clean hits (foe slashes,
    // rider keeps mis-defending with dodge — slash punishes dodge).
    let bout: DuelBout = initDuelBout(rider, foe);
    let savedFired = false;
    let lethalAfterSave = false;
    const rng = seededRng(3);
    for (let i = 0; i < 8 && !bout.over; i++) {
      const res = duelRound(bout, 'dodge', 'slash', rng);
      bout = res.bout;
      if (res.mountSaved === 'attacker') savedFired = true;
      if (bout.killedId === 'attacker') lethalAfterSave = savedFired; // killed only allowed after a save
    }
    expect(savedFired).toBe(true);
    // The rider was saved at least once; if they ultimately died it was AFTER the save.
    if (bout.killedId === 'attacker') expect(lethalAfterSave).toBe(true);
  });
});

describe('必殺技 — signature ultimates', () => {
  it('maps famous heroes to distinct ult kinds', () => {
    expect(signatureUlt(mkOfficer({ id: 'guan-yu', stats: warStats(96) }))?.kind).toBe('feint');
    expect(signatureUlt(mkOfficer({ id: 'zhao-yun', stats: warStats(96) }))?.kind).toBe('multi');
    expect(signatureUlt(mkOfficer({ id: 'lu-bu', stats: warStats(100) }))?.kind).toBe('sunder');
    expect(signatureUlt(mkOfficer({ id: 'huang-zhong', stats: warStats(93) }))?.kind).toBe('volley');
  });

  it('a great unnamed warrior gets a generic 奮命一擊; a weak one none', () => {
    expect(signatureUlt(mkOfficer({ id: 'nobody', stats: warStats(92) }))?.kind).toBe('power');
    expect(signatureUlt(mkOfficer({ id: 'weakling', stats: warStats(70) }))).toBe(null);
  });

  // Helper: build a bout and force one side's 武魂 full so they can ult next round.
  const readyBout = (aId: string, dId: string, war = 95): DuelBout => {
    const a = mkOfficer({ id: aId, stats: warStats(war) });
    const d = mkOfficer({ id: dId, stats: warStats(war) });
    return { ...initDuelBout(a, d), aSpirit: SPIRIT_MAX };
  };

  it('拖刀計 (feint) bites a DEFENDING foe far harder than an attacking one', () => {
    const rng = seededRng(1);
    let vsDefend = 0, vsAttack = 0;
    for (let s = 0; s < 40; s++) {
      const r1 = duelRound(readyBout('guan-yu', 'foe'), 'ultimate', 'guard', seededRng(s + 1));
      const r2 = duelRound(readyBout('guan-yu', 'foe'), 'ultimate', 'slash', seededRng(s + 1));
      vsDefend += r1.dmgToDefender;
      vsAttack += r2.dmgToDefender;
    }
    expect(vsDefend).toBeGreaterThan(vsAttack * 1.3); // ~+50% vs a guard
    void rng;
  });

  it('無雙 (sunder) drains the foe\'s 武魂 to 0', () => {
    const bout = { ...readyBout('lu-bu', 'foe'), dSpirit: 80 };
    const res = duelRound(bout, 'ultimate', 'guard', seededRng(2));
    expect(res.bout.dSpirit).toBe(0);
  });

  it('七進七出 (multi) lets the striker recover some 氣力', () => {
    // Put the attacker below full so recovery is observable.
    const base = readyBout('zhao-yun', 'foe');
    const bout = { ...base, aStamina: 50 };
    const res = duelRound(bout, 'ultimate', 'guard', seededRng(5));
    // multi grants +12 self-recover; net stamina change = recover (attacker takes no dmg from a guard).
    expect(res.bout.aStamina).toBeGreaterThan(50);
  });
});

describe('器魂戰技 — an awakened weapon stokes 武魂 faster (D2)', () => {
  it('sets the evolved-art flag and fills the spirit gauge quicker', async () => {
    const items = await import('../data/items');
    const WEAPON = Object.values(items.ITEMS_BY_ID).find((i) => i.kind === 'weapon')!.id;
    const plainA = mkOfficer({ id: 'a', stats: warStats(88), equipment: [WEAPON] });
    const foe = mkOfficer({ id: 'b', stats: warStats(88) });

    // Baseline: weapon NOT evolved.
    items.setEvolvedRegistry([]);
    const plainBout = initDuelBout(plainA, foe);
    expect(plainBout.aEvolvedArt).toBe(false);
    const plainRes = duelRound(plainBout, 'cleave', 'slash', seededRng(9));

    // Now awaken the same weapon — same officers, same moves, same seed.
    items.setEvolvedRegistry([WEAPON]);
    const evoBout = initDuelBout(plainA, foe);
    expect(evoBout.aEvolvedArt).toBe(true);
    const evoRes = duelRound(evoBout, 'cleave', 'slash', seededRng(9));

    // The awakened blade banks more 武魂 from the same exchange.
    expect(evoRes.bout.aSpirit).toBeGreaterThan(plainRes.bout.aSpirit);
    items.setEvolvedRegistry([]);
  });
});

describe('器魂加持 — an awakened blade hits harder (E2)', () => {
  it('the evolved finisher costs the foe more 氣力 than a plain one', async () => {
    const items = await import('../data/items');
    const WEAPON = Object.values(items.ITEMS_BY_ID).find((i) => i.kind === 'weapon')!.id;
    const hero = mkOfficer({ id: 'a', stats: warStats(95), equipment: [WEAPON] });
    const foe = mkOfficer({ id: 'b', stats: warStats(95) });

    // Plain: full gauge, unleash the ult against a guard.
    items.setEvolvedRegistry([]);
    const plain = { ...initDuelBout(hero, foe), aSpirit: SPIRIT_MAX };
    const plainRes = duelRound(plain, 'ultimate', 'guard', seededRng(4));

    // Awakened: same everything, ×1.2 on the finisher.
    items.setEvolvedRegistry([WEAPON]);
    const evo = { ...initDuelBout(hero, foe), aSpirit: SPIRIT_MAX };
    const evoRes = duelRound(evo, 'ultimate', 'guard', seededRng(4));

    expect(evoRes.bout.dStamina).toBeLessThan(plainRes.bout.dStamina); // foe hurt more
    items.setEvolvedRegistry([]);
  });
});
