/**
 * 約戰 — a formal challenge carried to an enemy champion. Where 致師 (§6) opens a
 * battle and 陣前單挑 happens mid-fight, a 約戰 is a strategic-layer affair: you
 * send word to a named foe in another force and call them out to a contest of
 * skill (點到為止 — a matter of face, not assassination). They may accept and
 * settle it blade to blade, or duck the challenge and wear the shame of it.
 *
 * The stakes are 威名 and 忠誠: best a foe before the realm and your champion's
 * name soars while theirs sinks (a humiliated officer's loyalty wavers); duck a
 * challenge and the coward loses face. Pure logic; the store applies the stakes
 * and the interactive bout runs on the shared 單挑 engine.
 */
import type { Officer, EntityId } from '../types';
import { canDuel, duelPersona, staticProwess } from './duel';
import { isNemesis, type RivalryMap } from './rivalries';

/** Default 武力 floor for a foe worth a formal 約戰 (a champion, not a clerk). */
export const CHALLENGE_MIN_WAR = 70;

/**
 * Enemy champions the player may 約戰: hostile-force, alive, free, duel-capable,
 * and of some martial standing. Sorted strongest first (optionally capped).
 */
export function duelChallengeTargets(
  officers: Record<EntityId, Officer>,
  myForceId: string | null,
  opts: { minWar?: number; limit?: number } = {},
): Officer[] {
  const minWar = opts.minWar ?? CHALLENGE_MIN_WAR;
  const list = Object.values(officers)
    .filter((o) =>
      o.forceId && o.forceId !== myForceId &&
      o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' &&
      o.stats.war >= minWar && canDuel(o).ok)
    .sort((a, b) => staticProwess(b) - staticProwess(a));
  return opts.limit ? list.slice(0, opts.limit) : list;
}

/**
 * 接戰與否 — whether a challenged officer accepts. A 鬥將 never ducks; a coward /
 * cautious / sickly soul often does, taking the field only when clearly stronger.
 * Everyone else weighs their own prowess against the challenger's (you don't ride
 * out to lose) with a dash of pride — a renowned name can't easily refuse.
 */
export function willAcceptChallenge(target: Officer, challenger: Officer, rng: () => number = Math.random): boolean {
  const persona = duelPersona(target);
  const traits = target.traits ?? [];
  if (persona === 'aggressive' || traits.includes('matchless') || traits.includes('duelist')) return true; // 鬥將不避戰
  const edge = staticProwess(target) - staticProwess(challenger); // >0 = target is stronger
  const timid = persona === 'cautious' || traits.includes('cowardly') || traits.includes('sickly') || traits.includes('cautious');
  if (timid) return edge > 12 && rng() < 0.5; // a craven only fights a sure thing
  // 量力而戰 — accept unless badly outmatched; pride (renown) stiffens the spine.
  const pride = Math.min(0.25, (target.renown ?? 0) / 400);
  const base = 0.55 + Math.max(-0.45, Math.min(0.35, edge * 0.02)) + pride;
  return rng() < base;
}

export type ChallengeOutcome = 'win' | 'loss' | 'draw' | 'refused';

/** Renown/loyalty deltas of a settled (or ducked) 約戰, from the challenger's view. */
export interface ChallengeStakes {
  challengerRenown: number;
  targetRenown: number;
  targetLoyalty: number;
}

export function challengeStakes(outcome: ChallengeOutcome): ChallengeStakes {
  switch (outcome) {
    case 'win':     return { challengerRenown: 6, targetRenown: -5, targetLoyalty: -4 }; // 折服敵將,辱其威名
    case 'loss':    return { challengerRenown: -3, targetRenown: 5, targetLoyalty: 1 };  // 反失威風
    case 'draw':    return { challengerRenown: 2, targetRenown: 1, targetLoyalty: 0 };   // 棋逢敵手
    case 'refused': return { challengerRenown: 2, targetRenown: -3, targetLoyalty: -2 }; // 避戰者失人望
  }
}

// ─── 敵將約戰 — the enemy calls YOU out ──────────────────────────────────────
// The mirror of the player's 約戰: an enemy champion sends word to one of your
// generals. A sworn 宿敵 (恩怨簿) always has cause; an aggressive, confident foe
// will too. Surfaced deterministically (rng→0) so the same challenge waits when
// you return — answer it (a real bout) or duck it and wear the shame.

export interface IncomingChallenge {
  /** The enemy champion calling you out. */
  foeId: EntityId;
  /** Your general being called out. */
  championId: EntityId;
  /** True when the pair are sworn 宿敵 (a grudge forged in play). */
  sworn: boolean;
  lineZh: string;
  lineEn: string;
}

const CALL_LINES: Array<{ zh: string; en: string }> = [
  { zh: '聞汝麾下有勇將,特來討教 — 敢應戰否?', en: 'I hear you keep a champion — come, let us measure them!' },
  { zh: '兩軍對壘,何不遣將出陣,與我一決?', en: 'Our hosts face off — send your best, and settle it with me!' },
  { zh: '久聞大名,今日特來領教高招!', en: 'Your name precedes you — today I will test it myself!' },
];

/**
 * Find an enemy champion who would call out one of the player's generals: a
 * sworn 宿敵 always will; an aggressive foe who likes its odds will too. Returns
 * the first such pairing (sworn-rivalries first), or null.
 */
export function findIncomingChallenge(
  officers: Record<EntityId, Officer>,
  playerForceId: string | null,
  rivalries: RivalryMap = {},
  rng: () => number = () => 0,
  opts: { minWar?: number } = {},
): IncomingChallenge | null {
  if (!playerForceId) return null;
  const minWar = opts.minWar ?? CHALLENGE_MIN_WAR;
  const usable = (o: Officer) => o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && o.stats.war >= minWar && canDuel(o).ok;
  const mine = Object.values(officers).filter((o) => o.forceId === playerForceId && usable(o));
  const foes = Object.values(officers).filter((o) => o.forceId && o.forceId !== playerForceId && usable(o));

  const candidates: Array<{ foeId: EntityId; championId: EntityId; sworn: boolean }> = [];
  for (const foe of foes) {
    const aggressive = duelPersona(foe) === 'aggressive';
    for (const champ of mine) {
      const sworn = isNemesis(rivalries, foe.id, champ.id);
      const confident = staticProwess(foe) >= staticProwess(champ) - 4;
      if (sworn || (aggressive && confident)) candidates.push({ foeId: foe.id, championId: champ.id, sworn });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Number(b.sworn) - Number(a.sworn)); // a sworn 宿敵 takes precedence
  const pick = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const line = CALL_LINES[Math.floor(rng() * CALL_LINES.length) % CALL_LINES.length];
  return { ...pick, lineZh: line.zh, lineEn: line.en };
}

// ─── 折服來投 — to best a champion may win their heart, not just their loyalty ─
// 英雄惜英雄: a foe bested (but spared) in a 約戰 — already shaken in his lord's
// service — may be so moved by the victor's might that he comes over. A 死忠
// (loyal/principled) never turns from a single duel; a wavering or ambitious one
// well might, the more so the mightier the hand that bested him.

/**
 * The chance a bested-and-spared foe defects to the victor's side. Driven by how
 * shaky the foe's loyalty already is, how decisively they were beaten, and their
 * temperament. 0 for the unswervingly loyal. Capped at 0.5.
 */
export function duelRecruitChance(foe: Officer, champion: Officer): number {
  const traits = foe.traits ?? [];
  if (traits.includes('loyal') || traits.includes('principled')) return 0; // 死忠不二
  const base = foe.loyalty <= 25 ? 0.32 : foe.loyalty <= 45 ? 0.20 : foe.loyalty <= 65 ? 0.10 : 0.03;
  const gap = staticProwess(champion) - staticProwess(foe);
  const awe = gap >= 15 ? 1.4 : gap >= 5 ? 1.15 : 1.0; // bested by a far mightier hand → more swayed
  const greedy = traits.includes('ambitious') || traits.includes('cunning') ? 1.5 : 1;
  return Math.min(0.5, base * awe * greedy);
}

/** A short headline for the 約戰 result banner. */
export function challengeResultLine(outcome: ChallengeOutcome, champName: string, foeName: string): { zh: string; en: string } {
  switch (outcome) {
    case 'win':     return { zh: `${champName} 約戰折服 ${foeName} — 威名遠播!`, en: `${champName} bests ${foeName} in a called duel — fame spreads far!` };
    case 'loss':    return { zh: `${champName} 約戰不敵 ${foeName},失了威風。`, en: `${champName} is bested by ${foeName} — a humbling day.` };
    case 'draw':    return { zh: `${champName} 與 ${foeName} 約戰平手,英雄相惜。`, en: `${champName} and ${foeName} fight to a draw — worthy foes.` };
    case 'refused': return { zh: `${foeName} 避而不戰 — 為天下所輕!`, en: `${foeName} ducks the challenge — and is scorned for it!` };
  }
}
