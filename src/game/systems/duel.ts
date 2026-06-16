import type { Officer } from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { SKILLS_BY_ID } from '../data/skills';
import { effectivePrestigeEffects } from '../data/prestige';

/**
 * One-on-one duel resolution between two officers — a multi-round 氣力 bout.
 *
 * Each officer's static prowess (war + weapon bonus + skill duelChanceBonus×30
 * + trait bonus) is fixed for the bout; every round both add a fresh die and
 * the loser of the exchange takes 氣力 (stamina) damage scaled by the margin.
 * Drop an opponent to 0 stamina and you cut them down. A bout that goes the
 * full distance is decided on remaining stamina — a clear lead still kills, a
 * close finish is a draw (both wounded, neither slain).
 */

export interface DuelInput {
  attacker: Officer;
  defender: Officer;
  rng?: () => number;
}

export interface DuelRoll {
  officerId: string;
  base: number;        // war stat
  itemBonus: number;
  skillBonus: number;  // from skill duelChanceBonus
  traitBonus: number;
  diceRoll: number;
  total: number;
}

/** One exchange of blows within a bout. */
export interface DuelExchange {
  round: number;
  attackerScore: number;
  defenderScore: number;
  roundWinner: 'attacker' | 'defender' | 'draw';
  /** Stamina remaining AFTER this exchange. */
  attackerStamina: number;
  defenderStamina: number;
  text: { zh: string; en: string };
}

export interface DuelResult {
  attackerRoll: DuelRoll;
  defenderRoll: DuelRoll;
  /** Final stamina gap (or the winner's remaining stamina on a knockout). */
  margin: number;
  /** Who won the duel, or 'draw' (both wounded). */
  winner: 'attacker' | 'defender' | 'draw';
  /** Set to the loser's officer id when the bout was decisive (a kill). */
  killedId?: string;
  /** Round-by-round exchanges of the bout. */
  rounds: DuelExchange[];
  /** Final 氣力 of each side (0 = cut down). */
  attackerStamina: number;
  defenderStamina: number;
  /** True if the bout ended in a knockout (stamina hit 0) rather than on points. */
  knockout: boolean;
}

const MAX_ROUNDS = 8;

const ROUND_LINES_WIN: Array<{ zh: string; en: string }> = [
  { zh: '一招搶得先機!', en: 'A telling blow lands first!' },
  { zh: '槍來戟往,佔得上風!', en: 'Spear meets halberd — and gains the upper hand!' },
  { zh: '這一合,壓住了對手!', en: 'This exchange goes decisively his way!' },
];
const ROUND_LINES_DRAW: Array<{ zh: string; en: string }> = [
  { zh: '棋逢對手,難分軒輊!', en: 'Evenly matched — neither gives ground!' },
  { zh: '刀光交錯,各退半步!', en: 'Blades cross in a shower of sparks; both step back!' },
];

export function canDuel(o: Officer): { ok: boolean; reason?: string } {
  if (o.status === 'dead' || o.status === 'imprisoned')
    return { ok: false, reason: 'unavailable' };
  if (o.stats.war < 60) return { ok: false, reason: 'war stat too low' };
  if (o.traits?.includes('frail')) return { ok: false, reason: 'too frail' };
  return { ok: true };
}

export function resolveDuel(input: DuelInput): DuelResult {
  const rng = input.rng ?? Math.random;
  // rollOne gives the display breakdown; subtract its die for the fixed prowess.
  const a = rollOne(input.attacker, rng);
  const d = rollOne(input.defender, rng);
  const aStatic = a.total - a.diceRoll;
  const dStatic = d.total - d.diceRoll;

  let aSt = 100;
  let dSt = 100;
  const rounds: DuelExchange[] = [];
  let knockout: 'attacker' | 'defender' | null = null;

  for (let r = 1; r <= MAX_ROUNDS; r++) {
    const aScore = aStatic + Math.floor(rng() * 20);
    const dScore = dStatic + Math.floor(rng() * 20);
    const diff = aScore - dScore;
    const roundWinner = diff > 0 ? 'attacker' : diff < 0 ? 'defender' : 'draw';
    const dmg = 14 + Math.min(28, Math.floor(Math.abs(diff) * 0.8));
    if (roundWinner === 'attacker') dSt -= dmg;
    else if (roundWinner === 'defender') aSt -= dmg;
    aSt = Math.max(0, aSt);
    dSt = Math.max(0, dSt);
    const pool = roundWinner === 'draw' ? ROUND_LINES_DRAW : ROUND_LINES_WIN;
    rounds.push({
      round: r,
      attackerScore: aScore,
      defenderScore: dScore,
      roundWinner,
      attackerStamina: aSt,
      defenderStamina: dSt,
      text: pool[Math.floor(rng() * pool.length)],
    });
    if (aSt <= 0) { knockout = 'defender'; break; }
    if (dSt <= 0) { knockout = 'attacker'; break; }
  }

  if (knockout) {
    const killedId = knockout === 'attacker' ? input.defender.id : input.attacker.id;
    return {
      attackerRoll: a, defenderRoll: d,
      margin: knockout === 'attacker' ? aSt : dSt,
      winner: knockout, killedId, rounds,
      attackerStamina: aSt, defenderStamina: dSt, knockout: true,
    };
  }

  // Went the distance — decide on remaining stamina.
  const margin = Math.abs(aSt - dSt);
  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  let killedId: string | undefined;
  if (margin >= 15) {
    winner = aSt > dSt ? 'attacker' : 'defender';
    // A decisive stamina gap can be lethal, but reserve most kills for actual
    // knockouts — a points win shouldn't kill officers as freely as it did at 25.
    if (margin >= 40) killedId = winner === 'attacker' ? input.defender.id : input.attacker.id;
  }
  return {
    attackerRoll: a, defenderRoll: d, margin, winner, killedId, rounds,
    attackerStamina: aSt, defenderStamina: dSt, knockout: false,
  };
}

/** Fixed prowess breakdown (war + item + skill + trait), no dice. */
function prowessParts(o: Officer): { itemBonus: number; skillBonus: number; traitBonus: number } {
  let itemBonus = 0;
  for (const id of o.equipment) {
    const it = ITEMS_BY_ID[id];
    if (it?.effects.war) itemBonus += it.effects.war;
  }
  let skillBonus = 0;
  for (const sid of o.skills) {
    const s = SKILLS_BY_ID[sid];
    if (s?.combat?.duelChanceBonus) skillBonus += s.combat.duelChanceBonus * 30;
    if (s?.combat?.warBonus) skillBonus += (s.combat.warBonus ?? 0) * 0.5;
  }
  let traitBonus = 0;
  for (const t of o.traits ?? []) {
    if (t === 'matchless') traitBonus += 25;
    else if (t === 'martial-valor') traitBonus += 12;
    else if (t === 'wrathful') traitBonus += 8;
    else if (t === 'reckless') traitBonus += 6;
    else if (t === 'one-eyed') traitBonus += 6;
    else if (t === 'cowardly') traitBonus -= 15;
    else if (t === 'frail') traitBonus -= 30;
    else if (t === 'sickly') traitBonus -= 5;
    else if (t === 'cautious') traitBonus -= 4;
  }
  return { itemBonus, skillBonus, traitBonus };
}

/** Static prowess (war + bonuses, no dice) — drives interactive-duel damage. */
export function staticProwess(o: Officer): number {
  const p = prowessParts(o);
  return Math.round(o.stats.war + p.itemBonus + p.skillBonus + p.traitBonus + effectivePrestigeEffects(o).duelBonus);
}

function rollOne(o: Officer, rng: () => number): DuelRoll {
  const { itemBonus, skillBonus, traitBonus } = prowessParts(o);
  const diceRoll = Math.floor(rng() * 30);
  const total = o.stats.war + itemBonus + skillBonus + traitBonus + diceRoll;
  return {
    officerId: o.id,
    base: o.stats.war,
    itemBonus,
    skillBonus: Math.round(skillBonus),
    traitBonus: Math.round(traitBonus),
    diceRoll,
    total: Math.round(total),
  };
}

// ─── Interactive duel (player-played 攻/守/計/奮 round game) ───────────────

export type DuelMove = 'attack' | 'defend' | 'scheme' | 'power';

export interface DuelBout {
  aStamina: number;
  dStamina: number;
  aGuard: number;   // successful blocks banked toward 奮 (Overpower)
  dGuard: number;
  aStatic: number;  // fixed prowess
  dStatic: number;
  aInt: number;     // intelligence — drives how well each side reads the foe
  dInt: number;
  aMoves: DuelMove[]; // move history, so a sharp mind can read a habit
  dMoves: DuelMove[];
  round: number;    // rounds played
  over: boolean;
  winner?: 'attacker' | 'defender' | 'draw';
  killedId?: string;
}

export const POWER_GUARD_COST = 2;

export function initDuelBout(attacker: Officer, defender: Officer): DuelBout {
  return {
    aStamina: 100, dStamina: 100, aGuard: 0, dGuard: 0,
    aStatic: staticProwess(attacker), dStatic: staticProwess(defender),
    aInt: attacker.stats.intelligence, dInt: defender.stats.intelligence,
    aMoves: [], dMoves: [],
    round: 0, over: false,
  };
}

// x defeats y? 守>攻, 攻>計, 計>守; 奮 beats 攻 and 計 but loses to 守.
const BEATS: Record<Exclude<DuelMove, 'power'>, DuelMove> = {
  defend: 'attack', attack: 'scheme', scheme: 'defend',
};
function moveBeats(x: DuelMove, y: DuelMove): boolean {
  if (x === 'power') return y === 'attack' || y === 'scheme';
  if (y === 'power') return x === 'defend';
  return BEATS[x] === y;
}

export interface DuelRoundResult {
  bout: DuelBout;
  roundWinner: 'attacker' | 'defender' | 'draw';
  dmgToAttacker: number;
  dmgToDefender: number;
}

/** Resolve one exchange. attacker/defender each commit a move. */
export function duelRound(
  bout: DuelBout,
  aMove: DuelMove,
  dMove: DuelMove,
  rng: () => number = Math.random,
): DuelRoundResult {
  const b: DuelBout = { ...bout };
  if (b.over) return { bout: b, roundWinner: 'draw', dmgToAttacker: 0, dmgToDefender: 0 };
  // Record the exchange so a reading mind has a habit to exploit next round.
  b.aMoves = [...bout.aMoves, aMove];
  b.dMoves = [...bout.dMoves, dMove];
  if (aMove === 'power') b.aGuard = Math.max(0, b.aGuard - POWER_GUARD_COST);
  if (dMove === 'power') b.dGuard = Math.max(0, b.dGuard - POWER_GUARD_COST);

  const dmgFrom = (move: DuelMove, winP: number, loseP: number): number => {
    const base = move === 'defend' ? 10 : move === 'power' ? 30 : 18;
    const adv = Math.max(-6, Math.min(20, (winP - loseP) * 0.4));
    return Math.max(6, Math.round(base + adv + rng() * 8));
  };

  let roundWinner: 'attacker' | 'defender' | 'draw' = 'draw';
  let dmgToAttacker = 0, dmgToDefender = 0;
  if (moveBeats(aMove, dMove)) {
    roundWinner = 'attacker';
    dmgToDefender = dmgFrom(aMove, b.aStatic, b.dStatic);
    if (aMove === 'defend') b.aGuard += 1; // a successful block banks guard
  } else if (moveBeats(dMove, aMove)) {
    roundWinner = 'defender';
    dmgToAttacker = dmgFrom(dMove, b.dStatic, b.aStatic);
    if (dMove === 'defend') b.dGuard += 1;
  } else if (aMove === 'defend' && dMove === 'defend') {
    b.aGuard += 1; b.dGuard += 1; // wary circling — both bank a little
  }
  b.aStamina = Math.max(0, b.aStamina - dmgToAttacker);
  b.dStamina = Math.max(0, b.dStamina - dmgToDefender);
  b.round += 1;

  if (b.aStamina <= 0 || b.dStamina <= 0 || b.round >= MAX_ROUNDS) {
    b.over = true;
    if (b.aStamina <= 0 && b.dStamina <= 0) b.winner = 'draw';
    else if (b.aStamina <= 0) { b.winner = 'defender'; }
    else if (b.dStamina <= 0) { b.winner = 'attacker'; }
    else {
      const gap = Math.abs(b.aStamina - b.dStamina);
      b.winner = gap < 15 ? 'draw' : b.aStamina > b.dStamina ? 'attacker' : 'defender';
    }
    // A knockout (stamina to 0) is lethal; a points win is not.
    if (b.aStamina <= 0 && b.winner === 'defender') b.killedId = 'attacker';
    if (b.dStamina <= 0 && b.winner === 'attacker') b.killedId = 'defender';
  }
  return { bout: b, roundWinner, dmgToAttacker, dmgToDefender };
}

// To BEAT a predicted move, play its counter (守>攻, 攻>計, 計>守, 守>奮).
const COUNTER: Record<DuelMove, DuelMove> = {
  attack: 'defend',
  scheme: 'attack',
  defend: 'scheme',
  power: 'defend',
};

/** The foe's prevailing habit over their last few moves (random among ties). */
function readHabit(moves: DuelMove[], rng: () => number): DuelMove | null {
  const recent = moves.slice(-4);
  if (recent.length === 0) return null;
  const counts: Partial<Record<DuelMove, number>> = {};
  for (const m of recent) counts[m] = (counts[m] ?? 0) + 1;
  let best: DuelMove[] = [];
  let max = 0;
  for (const m of recent) {
    const c = counts[m] ?? 0;
    if (c > max) { max = c; best = [m]; }
    else if (c === max && !best.includes(m)) best.push(m);
  }
  return best[Math.floor(rng() * best.length)] ?? null;
}

/** AI picks a move. 料敵 — a sharp mind (high 智力) reads the foe's habit (or a
 *  loaded guard threatening 奮) and plays the counter; a 武夫 just fights on
 *  instinct: spend 奮 when banked, otherwise favour attack, guard when battered. */
export function aiDuelMove(bout: DuelBout, side: 'attacker' | 'defender', rng: () => number = Math.random): DuelMove {
  const guard = side === 'attacker' ? bout.aGuard : bout.dGuard;
  const stamina = side === 'attacker' ? bout.aStamina : bout.dStamina;
  const myInt = side === 'attacker' ? bout.aInt : bout.dInt;
  const foeMoves = side === 'attacker' ? bout.dMoves : bout.aMoves;
  const foeGuard = side === 'attacker' ? bout.dGuard : bout.aGuard;

  // Reading the foe scales with intelligence: a 40-INT bruiser never reads;
  // a 110-INT strategist counters ~70% of the time (still beatable by varying).
  const readChance = Math.min(0.72, Math.max(0, (myInt - 40) / 100));
  if (rng() < readChance) {
    let predicted: DuelMove | null = null;
    if (foeGuard >= POWER_GUARD_COST && rng() < 0.45) predicted = 'power';
    else predicted = readHabit(foeMoves, rng);
    if (predicted) return COUNTER[predicted];
  }

  if (guard >= POWER_GUARD_COST && rng() < 0.55) return 'power';
  const r = rng();
  if (stamina < 35) return r < 0.5 ? 'defend' : r < 0.78 ? 'scheme' : 'attack';
  return r < 0.45 ? 'attack' : r < 0.72 ? 'scheme' : 'defend';
}
