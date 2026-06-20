import type { Officer } from '../types';
import { afflictionDelta } from './afflictions';

/**
 * 舌戰 — pre-battle war of words. Each side may field a strategist; the
 * one with higher intelligence + charisma wins. The loser's side starts
 * the upcoming tactical battle demoralized (−10 morale on all units).
 */
export interface WordWarLine {
  speakerId: string;
  text: { zh: string; en: string };
}

/** One exchange of the war of words. */
export interface WordWarRound {
  round: number;
  attackerScore: number;
  defenderScore: number;
  winner: 'attacker' | 'defender' | 'draw';
  /** Running totals after this exchange. */
  attackerTotal: number;
  defenderTotal: number;
}

export interface WordWarResult {
  winnerSide: 'attacker' | 'defender' | 'draw';
  attackerStrategistId?: string;
  defenderStrategistId?: string;
  lines: WordWarLine[];
  /** Morale modifier (−10/0/+10) to be applied at battle start. */
  attackerMoraleDelta: number;
  defenderMoraleDelta: number;
  /** Round-by-round exchanges. */
  rounds: WordWarRound[];
}

// Generic taunts and ripostes — picked randomly to give variety.
const BARBS_ATTACKER: Array<{ zh: string; en: string }> = [
  { zh: '汝主庸碌,何敢與我爭鋒?', en: 'Your lord is a mediocrity — how dare you contend with me?' },
  { zh: '不識天命,猶作螳臂!', en: 'You do not know heaven\'s mandate — yet you raise a praying mantis\'s arm!' },
  { zh: '此役不勝,枉為人臣!', en: 'If we do not win today, we are not worthy of being subjects of any lord!' },
];
const BARBS_DEFENDER: Array<{ zh: string; en: string }> = [
  { zh: '小兒之言,何足懼也?', en: 'A child\'s words — why should I fear them?' },
  { zh: '逆天而動,終必自敗!', en: 'You move against heaven — your defeat is already written!' },
  { zh: '此地堅城,豈是汝可破?', en: 'This city stands fast — what makes you think you can break it?' },
];
const RIPOSTES: Array<{ zh: string; en: string }> = [
  { zh: '誇誇其談,毫無實據!', en: 'Empty boasting, with no proof behind it!' },
  { zh: '汝之計,我已盡知!', en: 'Your every stratagem — I already know!' },
  { zh: '今日讓你見識真功夫!', en: 'Today I show you what real skill looks like!' },
  { zh: '巧言令色,難掩敗象!', en: 'Honeyed words cannot hide the rout to come!' },
  { zh: '黃口小兒,也敢論兵?', en: 'A milk-toothed boy — and you presume to speak of war?' },
  { zh: '强詞奪理,徒亂軍心!', en: 'Twisting reason only unsettles your own ranks!' },
];

export function resolveWordWar(
  attackerCommander: Officer,
  defenderCommander: Officer,
  attackerCompanions: Officer[],
  defenderCompanions: Officer[],
  rng: () => number = Math.random,
): WordWarResult {
  const pickStrategist = (cmd: Officer, companions: Officer[]) => {
    const pool = [cmd, ...companions];
    pool.sort((a, b) => (b.stats.intelligence + b.stats.charisma) - (a.stats.intelligence + a.stats.charisma));
    return pool[0];
  };
  const a = pickStrategist(attackerCommander, attackerCompanions);
  const d = pickStrategist(defenderCommander, defenderCompanions);
  const aProwess = a.stats.intelligence + a.stats.charisma * 0.5;
  const dProwess = d.stats.intelligence + d.stats.charisma * 0.5;

  const lines: WordWarLine[] = [];
  const rounds: WordWarRound[] = [];
  let aTotal = 0;
  let dTotal = 0;
  // Momentum: winning an exchange lends a small edge in the next (氣勢).
  let momentum = 0; // >0 favours attacker, <0 defender
  const ROUNDS = 3;
  for (let i = 0; i < ROUNDS; i++) {
    const aScore = aProwess + rng() * 20 + Math.max(0, momentum);
    const dScore = dProwess + rng() * 20 + Math.max(0, -momentum);
    aTotal += aScore;
    dTotal += dScore;
    const winner = aScore > dScore ? 'attacker' : dScore > aScore ? 'defender' : 'draw';
    momentum += winner === 'attacker' ? 5 : winner === 'defender' ? -5 : 0;
    rounds.push({
      round: i + 1,
      attackerScore: Math.round(aScore),
      defenderScore: Math.round(dScore),
      winner,
      attackerTotal: Math.round(aTotal),
      defenderTotal: Math.round(dTotal),
    });
    // Attacker opens; the side that lost the previous exchange ripostes.
    lines.push({ speakerId: a.id, text: BARBS_ATTACKER[Math.floor(rng() * BARBS_ATTACKER.length)] });
    const dPool = i === 0 ? BARBS_DEFENDER : RIPOSTES;
    lines.push({ speakerId: d.id, text: dPool[Math.floor(rng() * dPool.length)] });
  }

  const margin = Math.abs(aTotal - dTotal);
  const base = {
    attackerStrategistId: a.id,
    defenderStrategistId: d.id,
    lines,
    rounds,
  };
  if (margin < 12) {
    return { ...base, winnerSide: 'draw', attackerMoraleDelta: 0, defenderMoraleDelta: 0 };
  }
  if (aTotal > dTotal) {
    return { ...base, winnerSide: 'attacker', attackerMoraleDelta: 0, defenderMoraleDelta: -10 };
  }
  return { ...base, winnerSide: 'defender', attackerMoraleDelta: -10, defenderMoraleDelta: 0 };
}

// ─── Interactive debate (player-played 論/諷/駁/詰/引/哂 round game) ──────────
//
// Mirrors the duel minigame for the war of words. The three base ripostes form
// a ring — 論>諷, 諷>駁, 駁>論 — and a successful 駁 (retort) banks 氣勢. Three
// "loaded" arguments spend that 氣勢:
//   詰 Press   (2勢): 壓 — beats 論/諷/引, turned aside by 駁/哂
//   引 Cite    (2勢): 引經據典 — beats 論/諷/駁, undone by 詰/哂
//   哂 Scorn   (1勢): 哂笑不屑 — beats 駁/引/詰, but bare 論/諷 see through it
// Prowess = INT + CHA/2; drain a foe's 沉著 (composure) to 0 to rout them, else
// win on points. The loser's side starts the battle demoralized.

// Six universal arguments + three 流派 (school) signatures, each gated to a
// debating persona: 喻 analogy (智者/sage), 叱 rebuke (猛士/fierce), 詐 deceive
// (奸雄/sly). A strategist may only play the signature of their own school.
export type DebateMove =
  | 'assert' | 'provoke' | 'retort' | 'press' | 'cite' | 'scorn'
  | 'analogy' | 'rebuke' | 'deceive';

// 難度 — how sharply the AI debater reads your argument and plays the counter.
// Mirrors the duel's DuelDifficulty: a 學徒 barely anticipates, a 名士 reads a
// high-INT foe well, a 宗師 almost always springs the right rebuttal.
export type DebateDifficulty = 'rookie' | 'veteran' | 'peerless';

export interface DebateBout {
  aComposure: number;
  dComposure: number;
  aMomentum: number; // banked retorts toward the loaded arguments
  dMomentum: number;
  aProwess: number;
  dProwess: number;
  aPersona: DebatePersona; // 流派 — which school signature each side may play
  dPersona: DebatePersona;
  aLastMove?: DebateMove;   // 連辯 — last argument, for chain synergies
  dLastMove?: DebateMove;
  audience: number;  // 民心 — −100..100; + sways to a (me), − to d (foe)
  aRally: boolean;   // 全場附和 — next argument lands clean (spent on use)
  dRally: boolean;
  difficulty: DebateDifficulty; // AI skill tier for the foe (side 'd')
  round: number;
  over: boolean;
  winner?: 'a' | 'd' | 'draw';
}

/** 民心 — the hall sways this far toward a side before it rallies behind them. */
export const AUDIENCE_RALLY = 80;

export const PRESS_MOMENTUM_COST = 2;
export const CITE_MOMENTUM_COST = 2;
export const SCORN_MOMENTUM_COST = 1;
/** 氣勢 a loaded argument spends. */
export function debateMoveCost(m: DebateMove): number {
  if (m === 'press' || m === 'cite' || m === 'deceive') return 2;
  if (m === 'scorn' || m === 'analogy' || m === 'rebuke') return 1;
  return 0;
}
const DEBATE_ROUNDS = 6;

export function debateProwess(o: Officer): number {
  // 羞憤 — a shamed mind argues less keenly (folds in 智力/魅力 penalties).
  const int = o.stats.intelligence + afflictionDelta(o, 'intelligence');
  const cha = o.stats.charisma + afflictionDelta(o, 'charisma');
  return Math.round(int + cha * 0.5);
}

// 風格 — a strategist's debating persona drives which gestures / win poses the
// 3D hall plays: 智者 (measured), 猛士 (blunt & forceful), 奸雄 (sly & mocking).
export type DebatePersona = 'sage' | 'fierce' | 'sly';
export function debatePersona(o: Officer): DebatePersona {
  const { intelligence: int, charisma: cha, war } = o.stats;
  if (o.traits?.includes('ambitious') || o.traits?.includes('cunning') || o.traits?.includes('arrogant') || (cha >= 80 && int >= 70 && cha > int)) return 'sly';
  if (war >= 78 && war > int) return 'fierce';
  return 'sage';
}

/** 流派絕學 — the signature argument a debating school may field (or null). */
const SCHOOL_MOVE: Record<DebatePersona, DebateMove> = { sage: 'analogy', fierce: 'rebuke', sly: 'deceive' };
export function schoolMoveFor(o: Officer | DebatePersona): DebateMove {
  return SCHOOL_MOVE[typeof o === 'string' ? o : debatePersona(o)];
}
/** 流派招式 — moves that are only available to a matching school. */
export const SCHOOL_MOVES: DebateMove[] = ['analogy', 'rebuke', 'deceive'];

export function initDebate(me: Officer, foe: Officer, difficulty: DebateDifficulty = 'veteran'): DebateBout {
  return {
    aComposure: 100, dComposure: 100, aMomentum: 0, dMomentum: 0,
    aProwess: debateProwess(me), dProwess: debateProwess(foe),
    aPersona: debatePersona(me), dPersona: debatePersona(foe),
    audience: 0, aRally: false, dRally: false,
    difficulty,
    round: 0, over: false,
  };
}

// Each move's win set. The base ring (論>諷>駁>論) and 詰's relationships are
// unchanged from the 4-move game; 引/哂 extend it. No pair has two winners.
// The base ring (論>諷>駁>論) is unchanged; 引/哂 and the three 流派 signatures
// extend it. Invariant (verified by a property test): no pair has two winners.
//   喻 analogy — a vivid parable defuses 諷/哂/詰; undone by 論/引/叱
//   叱 rebuke  — a thunderous reprimand shouts down 論/駁/喻; deflated by 諷/哂/詰/詐
//   詐 deceive — a rhetorical trap springs on 論/引/叱; sprung by 詰/諷/駁
const DEBATE_BEATS: Record<DebateMove, DebateMove[]> = {
  assert:  ['provoke', 'scorn', 'analogy'],          // 論 — also sees through a parable
  provoke: ['retort', 'scorn', 'rebuke', 'deceive'], // 諷 — mockery deflates bluster & cunning
  retort:  ['assert', 'press', 'deceive'],           // 駁 — turns aside 詰 and springs the trap
  press:   ['assert', 'provoke', 'cite', 'rebuke', 'deceive'], // 詰 — relentless questioning
  cite:    ['assert', 'provoke', 'retort', 'analogy'], // 引 — authority over the base & a parable
  scorn:   ['retort', 'cite', 'press', 'rebuke'],    // 哂 — also laughs off bluster
  analogy: ['provoke', 'scorn', 'press'],            // 喻 — parable over mockery, scorn & pressure
  rebuke:  ['assert', 'retort', 'analogy'],          // 叱 — force over reason, retort & parable
  deceive: ['assert', 'cite', 'rebuke'],             // 詐 — trap over assertion, authority & bluster
};
function debateMoveBeats(x: DebateMove, y: DebateMove): boolean {
  return DEBATE_BEATS[x].includes(y);
}

// 料敵 — the cheapest (base-ring) argument that answers a foe's last move, for
// a reading AI to spring. 引 (cite) has no base counter (only loaded moves
// answer authority), so a foe who cited last is left to the random fallback.
const DEBATE_BASE_COUNTER: Partial<Record<DebateMove, DebateMove>> = {
  assert: 'retort', provoke: 'assert', retort: 'provoke',
  press: 'retort', scorn: 'assert', analogy: 'assert',
  rebuke: 'provoke', deceive: 'provoke',
};

export interface DebateRoundResult {
  bout: DebateBout;
  roundWinner: 'a' | 'd' | 'draw';
  dmgToA: number;
  dmgToD: number;
  /** 連辯 — set when a side completes a recognised argument chain this round. */
  chain?: { side: 'a' | 'd'; kind: 'assert-cite' | 'retort-press' };
  /** 民心 — the new audience value after this exchange (−100..100, + toward a). */
  audience: number;
  /** 全場附和 — set to the side the hall just rallied behind this round. */
  rally?: 'a' | 'd';
}

// 連辯 — recognised two-move argument chains. The opener sets up the follow-up,
// which then bites ~30% deeper (and 駁→詰 refunds a 氣勢, deflect-then-press).
const CHAINS: Array<{ prev: DebateMove; now: DebateMove; kind: 'assert-cite' | 'retort-press'; refund: number }> = [
  { prev: 'assert', now: 'cite',  kind: 'assert-cite',  refund: 0 }, // 論→引 — the claim, then the authority behind it
  { prev: 'retort', now: 'press', kind: 'retort-press', refund: 1 }, // 駁→詰 — turn it aside, then press the opening
];

export function debateRound(
  bout: DebateBout,
  aMove: DebateMove,
  dMove: DebateMove,
  rng: () => number = Math.random,
): DebateRoundResult {
  const b: DebateBout = { ...bout };
  if (b.over) return { bout: b, roundWinner: 'draw', dmgToA: 0, dmgToD: 0, audience: b.audience };
  b.aMomentum = Math.max(0, b.aMomentum - debateMoveCost(aMove));
  b.dMomentum = Math.max(0, b.dMomentum - debateMoveCost(dMove));

  const DMG_BASE: Record<DebateMove, number> = {
    retort: 10, assert: 18, provoke: 18, press: 30, cite: 26, scorn: 22,
    analogy: 22, rebuke: 26, deceive: 30,
  };
  // 連辯 — does this move complete a chain off the side's previous argument?
  const chainFor = (last: DebateMove | undefined, now: DebateMove) =>
    last ? CHAINS.find((c) => c.prev === last && c.now === now) : undefined;
  const aChain = chainFor(bout.aLastMove, aMove);
  const dChain = chainFor(bout.dLastMove, dMove);
  const chainMul = (side: 'a' | 'd') => ((side === 'a' ? aChain : dChain) ? 1.3 : 1);
  const dmgFrom = (move: DebateMove, winP: number, loseP: number): number => {
    const adv = Math.max(-6, Math.min(20, (winP - loseP) * 0.4));
    return Math.max(6, Math.round((DMG_BASE[move] ?? 18) + adv + rng() * 8));
  };

  let roundWinner: 'a' | 'd' | 'draw' = 'draw';
  let dmgToA = 0, dmgToD = 0;
  if (debateMoveBeats(aMove, dMove)) {
    roundWinner = 'a';
    dmgToD = Math.round(dmgFrom(aMove, b.aProwess, b.dProwess) * chainMul('a'));
    if (aMove === 'retort') b.aMomentum += 1;
  } else if (debateMoveBeats(dMove, aMove)) {
    roundWinner = 'd';
    dmgToA = Math.round(dmgFrom(dMove, b.dProwess, b.aProwess) * chainMul('d'));
    if (dMove === 'retort') b.dMomentum += 1;
  } else if (aMove === 'retort' && dMove === 'retort') {
    b.aMomentum += 1; b.dMomentum += 1;
  }
  // 全場附和 — a rally banked from the 民心 meter makes this argument land clean,
  // overriding a walk-into-a-counter. Spent on use.
  if (b.aRally && roundWinner !== 'a') { roundWinner = 'a'; dmgToD = Math.round(dmgFrom(aMove, b.aProwess, b.dProwess) * chainMul('a')); dmgToA = 0; }
  if (b.dRally && roundWinner !== 'd') { roundWinner = 'd'; dmgToA = Math.round(dmgFrom(dMove, b.dProwess, b.aProwess) * chainMul('d')); dmgToD = 0; }
  b.aRally = false; b.dRally = false;

  // 連辯 — a completed chain refunds the follow-up's cost where the chain says so
  // (駁→詰), and is reported so the hall can flash the link.
  let chain: DebateRoundResult['chain'];
  if (aChain) { b.aMomentum += aChain.refund; chain = { side: 'a', kind: aChain.kind }; }
  if (dChain) { b.dMomentum += dChain.refund; chain = { side: 'd', kind: dChain.kind }; }
  b.aLastMove = aMove;
  b.dLastMove = dMove;

  // 民心 — the hall sways toward whoever pressed home, by how decisively. When it
  // tips past AUDIENCE_RALLY, that side rallies: bank a 氣勢 and their next
  // argument is guaranteed to land (全場附和); the meter eases back off the edge.
  // A win always sways the hall a little (even-matched debates still build), more
  // so when it lands hard — so 民心 can crest before composure runs out.
  const swing = Math.round(16 + Math.max(dmgToA, dmgToD) * 0.4);
  if (roundWinner === 'a') b.audience = Math.min(100, b.audience + swing);
  else if (roundWinner === 'd') b.audience = Math.max(-100, b.audience - swing);
  let rally: DebateRoundResult['rally'];
  if (b.audience >= AUDIENCE_RALLY) { b.aRally = true; b.aMomentum += 1; b.audience = 40; rally = 'a'; }
  else if (b.audience <= -AUDIENCE_RALLY) { b.dRally = true; b.dMomentum += 1; b.audience = -40; rally = 'd'; }

  b.aComposure = Math.max(0, b.aComposure - dmgToA);
  b.dComposure = Math.max(0, b.dComposure - dmgToD);
  b.round += 1;

  if (b.aComposure <= 0 || b.dComposure <= 0 || b.round >= DEBATE_ROUNDS) {
    b.over = true;
    if (b.aComposure <= 0 && b.dComposure <= 0) b.winner = 'draw';
    else if (b.aComposure <= 0) b.winner = 'd';
    else if (b.dComposure <= 0) b.winner = 'a';
    else {
      const gap = Math.abs(b.aComposure - b.dComposure);
      b.winner = gap < 12 ? 'draw' : b.aComposure > b.dComposure ? 'a' : 'd';
    }
  }
  return { bout: b, roundWinner, dmgToA, dmgToD, chain, audience: b.audience, rally };
}

export function aiDebateMove(bout: DebateBout, side: 'a' | 'd', rng: () => number = Math.random): DebateMove {
  const momentum = side === 'a' ? bout.aMomentum : bout.dMomentum;
  const composure = side === 'a' ? bout.aComposure : bout.dComposure;
  const persona = side === 'a' ? bout.aPersona : bout.dPersona;
  const school = SCHOOL_MOVE[persona];
  if (momentum >= PRESS_MOMENTUM_COST && rng() < 0.55) return 'press';
  // 引經據典 — an alternative heavy spender to the press.
  if (momentum >= CITE_MOMENTUM_COST && rng() < 0.5) return 'cite';
  // 流派絕學 — a strategist leans on their own school's signature when the 氣勢
  // is there for it (the sly 詐 costs 2勢; the parable/rebuke only 1).
  if (debateMoveCost(school) <= momentum && rng() < 0.5) return school;
  // 哂笑 — a cheap loaded mock when even a little 氣勢 is banked.
  if (momentum >= SCORN_MOMENTUM_COST && rng() < 0.32) return 'scorn';

  // 料敵 — a sharp, well-drilled debater reads the foe's last argument and
  // springs the base-ring counter. Reading scales with prowess (INT+CHA/2) AND
  // the difficulty tier — a 學徒 rarely anticipates, a 宗師 almost always does.
  const foeLast = side === 'a' ? bout.dLastMove : bout.aLastMove;
  const myProwess = side === 'a' ? bout.aProwess : bout.dProwess;
  const DIFF: Record<DebateDifficulty, { read: number; cap: number }> = {
    rookie:   { read: 0.45, cap: 0.40 },
    veteran:  { read: 1.00, cap: 0.72 },
    peerless: { read: 1.40, cap: 0.92 },
  };
  const d = DIFF[bout.difficulty];
  const readChance = Math.min(d.cap, Math.max(0, (myProwess - 50) / 110) * d.read);
  if (foeLast && rng() < readChance) {
    const counter = DEBATE_BASE_COUNTER[foeLast];
    if (counter) return counter;
  }

  const r = rng();
  if (composure < 35) return r < 0.5 ? 'retort' : r < 0.78 ? 'provoke' : 'assert';
  return r < 0.45 ? 'assert' : r < 0.72 ? 'provoke' : 'retort';
}

/** Morale deltas from a finished debate, from the player ('a' = me) viewpoint. */
export function debateMoraleDeltas(bout: DebateBout): { meDelta: number; foeDelta: number } {
  if (!bout.over || bout.winner === 'draw') return { meDelta: 0, foeDelta: 0 };
  return bout.winner === 'a' ? { meDelta: 5, foeDelta: -10 } : { meDelta: -10, foeDelta: 5 };
}
