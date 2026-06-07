import type { Officer } from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { SKILLS_BY_ID } from '../data/skills';

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
    if (margin >= 25) killedId = winner === 'attacker' ? input.defender.id : input.attacker.id;
  }
  return {
    attackerRoll: a, defenderRoll: d, margin, winner, killedId, rounds,
    attackerStamina: aSt, defenderStamina: dSt, knockout: false,
  };
}

function rollOne(o: Officer, rng: () => number): DuelRoll {
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
