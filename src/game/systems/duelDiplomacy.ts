import type { Officer } from '../types';
import { staticProwess, canDuel } from './duel';
import { duelDread, duelTribute } from './duelChallenge';

/**
 * 決鬥定和 (§6.13) — two realms settle a quarrel by champions instead of armies:
 * 以戰止戰. If the foe accepts, ONE non-lethal bout (點到為止) is fought and the
 * settlement binds BOTH ways — a non-aggression pact either way; the duel only
 * decides who pays the indemnity and who wins face. The civilized alternative to
 * a field campaign: no corpses, one afternoon, and the realm talks of it for years.
 */

export const PEACE_DUEL_COST = 300; // envoy + stakes ceremony

/** The champion a realm sends to a 決鬥定和 — its strongest duel-able officer. */
export function pickPeaceChampion(officers: Record<string, Officer>, forceId: string): Officer | null {
  let best: Officer | null = null;
  let bestP = -Infinity;
  for (const o of Object.values(officers)) {
    if (o.forceId !== forceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    if (!canDuel(o).ok) continue;
    const p = staticProwess(o);
    if (p > bestP) { bestP = p; best = o; }
  }
  return best;
}

/**
 * 應戰與否 — whether the foe's court accepts the challenge. Pride answers when
 * their champion looks the stronger; a deep 積怨 wants the satisfaction; but a
 * dreaded challenger's name (威名威懾) thins the resolve to meet him.
 */
export function willAcceptPeaceDuel(foeChamp: Officer, myChamp: Officer, foeGrudge: number, rng: () => number = Math.random): boolean {
  const edge = staticProwess(foeChamp) - staticProwess(myChamp);
  const p = Math.max(0.15, Math.min(0.9,
    0.5 + edge * 0.008 + Math.min(0.2, foeGrudge / 250) - duelDread(myChamp) * 0.4));
  return rng() < p;
}

export type PeaceDuelOutcome = 'win' | 'loss' | 'draw';

export interface PeaceDuelStakes {
  /** Seasons the sworn non-aggression binds. */
  napSeasons: number;
  /** Gold the LOSER's realm pays the winner's (0 on a draw). */
  indemnity: number;
  /** Relation score shift (always positive — the quarrel was settled with honour). */
  scoreDelta: number;
  /** How much of the foe's 積怨 the settlement washes away. */
  grudgeEase: number;
}

/** The terms a settled 決鬥定和 binds, from the PLAYER's view. Either way the
 *  pact holds — the bout only decides who pays and how warmly it ends. */
export function peaceDuelStakes(outcome: PeaceDuelOutcome, beatenChampion: Officer | null): PeaceDuelStakes {
  const indemnity = beatenChampion ? duelTribute(beatenChampion) * 2 : 0;
  switch (outcome) {
    case 'win':  return { napSeasons: 8, indemnity, scoreDelta: 18, grudgeEase: 15 };
    case 'loss': return { napSeasons: 8, indemnity, scoreDelta: 10, grudgeEase: 8 };
    default:     return { napSeasons: 4, indemnity: 0, scoreDelta: 8, grudgeEase: 6 };
  }
}
