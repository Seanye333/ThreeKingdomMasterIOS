import { describe, it, expect } from 'vitest';
import { resolveDuel, canDuel, initDuelBout, duelRound, staticProwess, aiDuelMove, weaponArtFor, type DuelMove } from './duel';
import { resolveWordWar, initDebate, debateRound, aiDebateMove } from './wordWar';
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

describe('interactive duel engine', () => {
  const mk = (war: number) => mkOfficer({ stats: { war, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
  const fixed = () => 0.5;

  it('respects the counter matrix (defenses stop two attacks, the blind spot is punished)', () => {
    const b = initDuelBout(mk(80), mk(80));
    // 格 guard stops 斬 slash (and banks 氣); 閃 dodge is slash's blind spot.
    expect(duelRound(b, 'slash', 'guard', fixed).roundWinner).toBe('defender');
    expect(duelRound(b, 'slash', 'dodge', fixed).roundWinner).toBe('attacker'); // 斬 punishes 閃
    expect(duelRound(b, 'cleave', 'parry', fixed).roundWinner).toBe('attacker'); // 劈 punishes 架
    expect(duelRound(b, 'sweep', 'guard', fixed).roundWinner).toBe('attacker');  // 掃 punishes 格
    // Attack-vs-attack mini ring: 斬 > 劈.
    expect(duelRound(b, 'slash', 'cleave', fixed).roundWinner).toBe('attacker');
    // 奮 power: only 格 guard stops it.
    expect(duelRound(b, 'power', 'guard', fixed).roundWinner).toBe('defender');
    expect(duelRound(b, 'power', 'slash', fixed).roundWinner).toBe('attacker');
    expect(duelRound(b, 'slash', 'slash', fixed).roundWinner).toBe('draw'); // mirror clash
  });

  it('a guard that holds banks 氣 and takes no damage; a parry ripostes', () => {
    const b = initDuelBout(mk(80), mk(80));
    const blocked = duelRound(b, 'slash', 'guard', fixed); // 格 stops 斬
    expect(blocked.dmgToDefender).toBe(0);
    expect(blocked.dmgToAttacker).toBe(0);
    expect(blocked.bout.dGuard).toBe(1);
    const parried = duelRound(b, 'slash', 'parry', fixed); // 架 stops 斬, ripostes
    expect(parried.dmgToDefender).toBe(0);
    expect(parried.bout.dGuard).toBe(2);
    expect(parried.dmgToAttacker).toBeGreaterThan(0);
  });

  it('initDuelBout seeds static prowess; the bout ends and names a winner', () => {
    const atk = mk(95), def = mk(60);
    const b = initDuelBout(atk, def);
    expect(b.aStatic).toBe(staticProwess(atk));
    let cur = b;
    for (let i = 0; i < 12 && !cur.over; i++) cur = duelRound(cur, 'sweep', 'guard', fixed).bout; // 掃 punishes 格 every round
    expect(cur.over).toBe(true);
    expect(cur.winner).toBe('attacker');
  });

  it('aiDuelMove spends 奮 when guard is banked', () => {
    const b = { ...initDuelBout(mk(80), mk(80)), aGuard: 2 };
    expect(aiDuelMove(b, 'attacker', () => 0.1)).toBe('power');
  });
});

describe('interactive debate engine', () => {
  const mk = (intel: number) => mkOfficer({ stats: { war: 50, leadership: 60, intelligence: intel, politics: 60, charisma: 60 } });
  const fixed = () => 0.5;

  it('respects the debate cycle (論>諷, 諷>駁, 駁>論, 詰>論, 駁>詰)', () => {
    const b = initDebate(mk(80), mk(80));
    expect(debateRound(b, 'assert', 'provoke', fixed).roundWinner).toBe('a');
    expect(debateRound(b, 'provoke', 'retort', fixed).roundWinner).toBe('a');
    expect(debateRound(b, 'retort', 'assert', fixed).roundWinner).toBe('a');
    expect(debateRound(b, 'press', 'assert', fixed).roundWinner).toBe('a');
    expect(debateRound(b, 'press', 'retort', fixed).roundWinner).toBe('d'); // 駁 turns aside 詰
  });

  it('a successful 駁 banks 氣勢 and takes no damage', () => {
    const b = initDebate(mk(80), mk(80));
    const r = debateRound(b, 'provoke', 'retort', fixed); // defender retorts a provoke? provoke>retort so attacker wins...
    // Use a clean case: defender retorts an assert (駁>論 is false; 論>諷>駁>論 → assert beats... ) -> instead test retort beating press:
    const r2 = debateRound(b, 'press', 'retort', fixed);
    expect(r2.dmgToD).toBe(0);
    expect(r2.bout.dMomentum).toBe(1);
    void r;
  });

  it('the bout ends and names a winner', () => {
    let cur = initDebate(mk(95), mk(55));
    for (let i = 0; i < 10 && !cur.over; i++) cur = debateRound(cur, 'assert', 'provoke', fixed).bout;
    expect(cur.over).toBe(true);
    expect(cur.winner).toBe('a');
  });

  it('aiDebateMove spends 詰 when 氣勢 is banked', () => {
    const b = { ...initDebate(mk(80), mk(80)), aMomentum: 2 };
    expect(aiDebateMove(b, 'a', () => 0.1)).toBe('press');
  });
});

describe('prestige folds into duel prowess', () => {
  it('a 虎將 (war 90) carries their 威名 duel bonus into static prowess', () => {
    const tiger = mkOfficer({ stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    // 90 war + 12 虎將 duel bonus, no items/skills/traits.
    expect(staticProwess(tiger)).toBe(102);
  });
});

describe('兵器絕技 (weapon arts)', () => {
  const fixed = () => 0.5;
  it('detects a legendary weapon and seeds the bout with its art', () => {
    const luBu = mkOfficer({ equipment: ['sky-piercer'], stats: { war: 100, leadership: 70, intelligence: 40, politics: 30, charisma: 60 } });
    expect(weaponArtFor(luBu)?.kind).toBe('power');
    const plain = mkOfficer({ stats: { war: 80, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    expect(weaponArtFor(plain)).toBeNull();
    const b = initDuelBout(luBu, plain);
    expect(b.aArt?.weaponZh).toBe('方天畫戟');
    expect(b.dArt).toBeNull();
  });

  it('蛇矛破守 — a snake-spear chips a 格-guarding foe (9) even when turned aside', () => {
    const zhangFei = mkOfficer({ equipment: ['snake-spear'], stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    const mook = mkOfficer({ stats: { war: 70, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });
    const b = initDuelBout(zhangFei, mook);
    // 斬 into 格 normally deals 0 to the blocker; the snake-spear chips 9.
    const res = duelRound(b, 'slash', 'guard', fixed);
    expect(res.dmgToDefender).toBe(9);
  });
});

describe('aiDuelMove — 料敵 (intelligence reads the foe)', () => {
  const mkO = (intel: number) => mkOfficer({ stats: { war: 80, leadership: 60, intelligence: intel, politics: 60, charisma: 60 } });
  const habit = ['slash', 'slash', 'slash'] as DuelMove[];

  it('a sharp mind counters a predictable attacker; a bruiser fights on instinct', () => {
    const base = initDuelBout(mkO(80), mkO(110));
    // Defender INT 110 → reads ~70%; the foe always slashes, so it parries.
    const sharp = { ...base, aMoves: habit, dInt: 110, aGuard: 0, dGuard: 0 };
    expect(aiDuelMove(sharp, 'defender', () => 0.1)).toBe('parry');

    // Defender INT 40 → never reads; falls back to instinct (slash on rng 0.1).
    const dull = { ...base, aMoves: habit, dInt: 40, aGuard: 0, dGuard: 0 };
    expect(aiDuelMove(dull, 'defender', () => 0.1)).toBe('slash');
  });

  it('車輪戰 — fatigue penalties open the bout winded (clamped to 30)', () => {
    const fresh = initDuelBout(mkO(80), mkO(80));
    expect(fresh.aStamina).toBe(100);
    expect(fresh.dStamina).toBe(100);
    const worn = initDuelBout(mkO(80), mkO(80), 24, 48);
    expect(worn.aStamina).toBe(76);
    expect(worn.dStamina).toBe(52);
    // A foe who has fought many bouts can't drop below a fighting floor of 30.
    expect(initDuelBout(mkO(80), mkO(80), 0, 200).dStamina).toBe(30);
  });

  it('a sharp mind guards against a foe loaded for an Overpower', () => {
    const base = initDuelBout(mkO(80), mkO(110));
    // Foe (attacker) has 2 guard banked → threatens 奮; the reader plays 守.
    const bout = { ...base, dInt: 110, aGuard: 2, dGuard: 0, aMoves: [] as DuelMove[] };
    expect(aiDuelMove(bout, 'defender', () => 0.1)).toBe('guard');
  });
});

describe('兵器特性 (weapon-class traits)', () => {
  const fixed = () => 0.5;
  const mk = (war: number) => mkOfficer({ stats: { war, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });

  it('斧·破甲 — an axe chips a 格-guarding foe that fully blocks a sword', () => {
    const base = initDuelBout(mk(80), mk(80));
    expect(duelRound(base, 'slash', 'guard', fixed).dmgToDefender).toBe(0); // sword: blocked clean
    expect(duelRound({ ...base, aClass: 'axe' }, 'slash', 'guard', fixed).dmgToDefender).toBeGreaterThan(0);
  });

  it('矛·一寸長 — a spear wins a mirrored clash instead of trading blows', () => {
    const base = initDuelBout(mk(80), mk(80));
    const r = duelRound({ ...base, aClass: 'spear', dClass: 'sword' }, 'slash', 'slash', fixed);
    expect(r.roundWinner).toBe('attacker');
    expect(r.dmgToAttacker).toBe(0);
    expect(r.dmgToDefender).toBeGreaterThan(0);
  });

  it('雙劍·追擊 — a landed twin-blade strike deals 6 more than a plain sword', () => {
    const base = initDuelBout(mk(80), mk(80));
    const sword = duelRound({ ...base, aClass: 'sword' }, 'slash', 'dodge', fixed).dmgToDefender;
    const twin = duelRound({ ...base, aClass: 'twinblade' }, 'slash', 'dodge', fixed).dmgToDefender;
    expect(twin).toBe(sword + 6);
  });

  it('重兵器·震懾 — a greatsword hit jars a banked 氣 point loose', () => {
    const base = { ...initDuelBout(mk(80), mk(80)), aClass: 'greatsword' as const, dGuard: 2 };
    const r = duelRound(base, 'slash', 'dodge', fixed); // 斬 punishes 閃 → it lands
    expect(r.dmgToDefender).toBeGreaterThan(0);
    expect(r.bout.dGuard).toBe(1);
  });

  it('奮·壓制 — a landed Overpower knocks all the victim\'s 氣 loose', () => {
    const base = { ...initDuelBout(mk(80), mk(80)), aGuard: 2, dGuard: 2 };
    const r = duelRound(base, 'power', 'slash', fixed); // only 格 stops 奮 — it lands
    expect(r.dmgToDefender).toBeGreaterThan(0);
    expect(r.bout.dGuard).toBe(0);
  });
});

describe('難度分檔 (AI difficulty)', () => {
  const mkO = (intel: number) => mkOfficer({ stats: { war: 80, leadership: 60, intelligence: intel, politics: 60, charisma: 60 } });
  const habit = ['slash', 'slash', 'slash'] as DuelMove[];

  it('a peerless foe reads & counters where a rookie fights blind', () => {
    const base = { ...initDuelBout(mkO(80), mkO(110)), aMoves: habit, dInt: 110, aGuard: 0, dGuard: 0 };
    expect(aiDuelMove({ ...base, difficulty: 'veteran' }, 'defender', () => 0.5)).toBe('parry');
    expect(aiDuelMove({ ...base, difficulty: 'peerless' }, 'defender', () => 0.5)).toBe('parry');
    expect(aiDuelMove({ ...base, difficulty: 'rookie' }, 'defender', () => 0.5)).not.toBe('parry');
  });
});
