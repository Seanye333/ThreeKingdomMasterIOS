/**
 * 舌戰 — the war of words. Two minds face off; composure (氣勢) is hit
 * points, arguments are the weapons, and the四張牌 counter each other
 * in a cycle:
 *
 *   大義 righteous ─beats→ 激將 taunt ─beats→ 折服 logic ─beats→
 *   詭辯 sophistry ─beats→ 大義 … (and so around)
 *
 * Damage scales with the speaker's 口才 (INT-weighted eloquence);
 * landing the counter multiplies it, walking into one halves yours.
 * Drive a man's composure below zero and he yields — drive it deep
 * below while his blood runs hot, and history remembers a 罵死.
 */
import type { Officer } from '../types';
import { gradeCombatBonus } from './gradeCombat';

export type DebateCard = 'righteous' | 'taunt' | 'logic' | 'sophistry';

export const DEBATE_CARDS: Array<{ id: DebateCard; zh: string; en: string; line: string }> = [
  { id: 'righteous', zh: '曉以大義', en: 'Righteousness', line: '汝既為漢臣,當思匡扶社稷!' },
  { id: 'taunt', zh: '激將罵陣', en: 'Taunt', line: '我從未見過有如此厚顏無恥之人!' },
  { id: 'logic', zh: '據理折服', en: 'Cold Logic', line: '此言謬矣 — 請觀其勢,聽其數。' },
  { id: 'sophistry', zh: '詭辯機鋒', en: 'Sophistry', line: '此一時,彼一時也。' },
];

/** card → the card it counters. */
const COUNTERS: Record<DebateCard, DebateCard> = {
  righteous: 'taunt',
  taunt: 'logic',
  logic: 'sophistry',
  sophistry: 'righteous',
};

export interface DebateState {
  a: { officer: Officer; composure: number };
  b: { officer: Officer; composure: number };
  round: number;
  winner: 'a' | 'b' | null;
  /** 罵死 — the loser collapsed from sheer fury. */
  collapse: boolean;
  log: string[];
}

export function eloquence(o: Officer): number {
  return o.stats.intelligence * 0.7 + o.stats.charisma * 0.3;
}

export function createDebate(a: Officer, b: Officer): DebateState {
  // 品階威儀 — a renowned mind enters the 舌戰 with steadier 氣勢 (composure).
  return {
    a: { officer: a, composure: 100 + gradeCombatBonus(a).debatePoise },
    b: { officer: b, composure: 100 + gradeCombatBonus(b).debatePoise },
    round: 1,
    winner: null,
    collapse: false,
    log: [`${a.name.zh}與${b.name.zh}對坐論辯,舌戰開場。`],
  };
}

/** The opposing mind picks its card — sharper minds counter more often. */
export function pickAiCard(state: DebateState, lastPlayerCard: DebateCard | null, rng: () => number): DebateCard {
  const iq = state.b.officer.stats.intelligence;
  // A sharp debater anticipates: with p ∝ INT they play the counter to
  // your LAST card (gamblers repeat themselves); otherwise random.
  if (lastPlayerCard && rng() < iq / 200) {
    const counterToLast = (Object.keys(COUNTERS) as DebateCard[]).find((c) => COUNTERS[c] === lastPlayerCard);
    if (counterToLast) return counterToLast;
  }
  return DEBATE_CARDS[Math.floor(rng() * DEBATE_CARDS.length)].id;
}

export function playRound(
  state: DebateState,
  cardA: DebateCard,
  cardB: DebateCard,
  rng: () => number,
): DebateState {
  if (state.winner) return state;
  const dmg = (attacker: Officer, my: DebateCard, theirs: DebateCard): number => {
    let d = (14 + rng() * 8) * (eloquence(attacker) / 70);
    if (COUNTERS[my] === theirs) d *= 1.6;       // landed the counter
    else if (COUNTERS[theirs] === my) d *= 0.5;  // walked into one
    return Math.round(d);
  };
  const dA = dmg(state.a.officer, cardA, cardB);
  const dB = dmg(state.b.officer, cardB, cardA);
  const nextB = state.b.composure - dA;
  const nextA = state.a.composure - dB;
  const zhA = DEBATE_CARDS.find((c) => c.id === cardA)!;
  const zhB = DEBATE_CARDS.find((c) => c.id === cardB)!;
  const log = [
    ...state.log,
    `第${state.round}回:${state.a.officer.name.zh}出「${zhA.zh}」(−${dA}),${state.b.officer.name.zh}出「${zhB.zh}」(−${dB})。`,
  ];

  // Simultaneous reveal — if both break, the deeper wound yields first.
  let winner: 'a' | 'b' | null = null;
  if (nextA <= 0 && nextB <= 0) winner = nextA < nextB ? 'b' : 'a';
  else if (nextB <= 0) winner = 'a';
  else if (nextA <= 0) winner = 'b';

  const loser = winner === 'a' ? { c: nextB, o: state.b.officer } : winner === 'b' ? { c: nextA, o: state.a.officer } : null;
  const collapse = !!loser && loser.c <= -15 && (loser.o.traits as string[] | undefined ?? []).some((t) => ['hot-tempered', 'arrogant', 'vainglorious', 'stubborn'].includes(t));
  if (winner) {
    const wName = winner === 'a' ? state.a.officer.name.zh : state.b.officer.name.zh;
    const lName = winner === 'a' ? state.b.officer.name.zh : state.a.officer.name.zh;
    log.push(collapse ? `${lName}氣血上湧,一口氣沒接上來 — ${wName}舌戰罵倒之!` : `${lName}語塞,拂袖認負。${wName}勝。`);
  }

  return {
    ...state,
    a: { ...state.a, composure: nextA },
    b: { ...state.b, composure: nextB },
    round: state.round + 1,
    winner,
    collapse,
    log,
  };
}
