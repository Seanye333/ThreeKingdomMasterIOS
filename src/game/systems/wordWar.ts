import type { Officer } from '../types';

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
