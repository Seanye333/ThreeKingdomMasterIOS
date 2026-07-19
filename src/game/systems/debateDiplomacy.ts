import type { Officer, City } from '../types';
import { debateDread } from './wordWar';
import { moonScore, canOrate } from './scholarRank';

/**
 * 折衝樽俎 (§6.16) — the war of words carried to the strategic map: where §H's
 * 決鬥定和 sends a champion's arm, these send a champion's tongue. Three tables:
 *
 *  · 會盟修好 (concord)  — the two realms' keenest voices argue the quarrel out;
 *    either way both swear non-aggression, the bout decides who pays for the
 *    banquet and how warmly it ends. 樽俎之間,折衝千里.
 *  · 責讓索貢 (tribute)  — an envoy reads the neighbour their sins; out-argue
 *    their court and they pay to make the lecture stop (at a cost in warmth).
 *  · 舌戰說降 (persuade) — a lone voice at a weakly-held enemy wall: rout the
 *    keeper of the gate in argument and the city opens without a corpse.
 *
 * Pure logic; the store applies stakes and the interactive bout runs on the
 * shared 舌戰 engine.
 */

export const CONCORD_COST = 250;  // envoy + the banquet 樽俎
export const TRIBUNE_COST = 150;  // the letter of remonstrance rides cheaper
export const PERSUADE_COST = 200; // the lone envoy's escort to a hostile wall

/** The voice a realm sends to the table — its keenest eligible tongue (清議分). */
export function pickCourtVoice(officers: Record<string, Officer>, forceId: string): Officer | null {
  let best: Officer | null = null;
  let bestP = -Infinity;
  for (const o of Object.values(officers)) {
    if (o.forceId !== forceId) continue;
    if (!canOrate(o)) continue;
    const p = moonScore(o);
    if (p > bestP) { bestP = p; best = o; }
  }
  return best;
}

/**
 * 赴會與否 — whether the foe's court sits down to argue at all. Pride answers
 * when their voice looks the keener; warm relations smooth the table; but a
 * dreaded envoy's name (文名威懾) thins the resolve to face him.
 */
export function willAcceptParley(foeVoice: Officer, myVoice: Officer, relationScore: number, rng: () => number = Math.random): boolean {
  const edge = moonScore(foeVoice) - moonScore(myVoice);
  const p = Math.max(0.15, Math.min(0.9,
    0.5 + edge * 0.006 + relationScore * 0.002 - debateDread(myVoice) * 0.4));
  return rng() < p;
}

export type ParleyOutcome = 'win' | 'loss' | 'draw';

/** 辯金 — the indemnity a beaten voice's realm pays, scaled by the tongue felled. */
export function debateTribute(beaten: Officer): number {
  return Math.round(120 + Math.max(0, moonScore(beaten)) * 1.5);
}

export interface ConcordStakes {
  napSeasons: number;
  /** Gold the LOSER's realm pays the winner's (0 on a draw). */
  indemnity: number;
  scoreDelta: number;
  grudgeEase: number;
}

/** 會盟修好 terms, from the PLAYER's view. Either way the pact holds — the bout
 *  only decides who pays for the banquet and how warmly it ends. */
export function concordStakes(outcome: ParleyOutcome, beatenVoice: Officer | null): ConcordStakes {
  const indemnity = beatenVoice ? debateTribute(beatenVoice) * 2 : 0;
  switch (outcome) {
    case 'win':  return { napSeasons: 8, indemnity, scoreDelta: 16, grudgeEase: 12 };
    case 'loss': return { napSeasons: 8, indemnity, scoreDelta: 9, grudgeEase: 7 };
    default:     return { napSeasons: 4, indemnity: 0, scoreDelta: 7, grudgeEase: 5 };
  }
}

export interface TributeStakes {
  /** Gold their court pays to end the lecture (0 unless you win). */
  gold: number;
  /** Relations always cool when you shake a neighbour down. */
  scoreDelta: number;
  /** 積怨 the humiliation breeds on their side. */
  grudgeGrow: number;
}

/** 責讓索貢 terms: a 罵倒 squeezes half again as much; losing the exchange costs
 *  face and warmth for nothing. */
export function tributeStakes(outcome: ParleyOutcome, routed: boolean, foeVoice: Officer): TributeStakes {
  if (outcome === 'win') {
    const gold = Math.round((180 + moonScore(foeVoice) * 2) * (routed ? 1.5 : 1));
    return { gold, scoreDelta: -8, grudgeGrow: routed ? 12 : 8 };
  }
  if (outcome === 'loss') return { gold: 0, scoreDelta: -6, grudgeGrow: 0 };
  return { gold: 0, scoreDelta: -2, grudgeGrow: 2 };
}

/** 說降門檻 — only a weakly-held, non-capital wall will even hear the argument. */
export const PERSUADE_MAX_GARRISON = 2500;
export function canPersuadeCity(city: City, isCapital: boolean): { ok: boolean; reason?: string } {
  if (isCapital) return { ok: false, reason: 'capital' };       // 國都不可說
  if (city.troops > PERSUADE_MAX_GARRISON) return { ok: false, reason: 'garrison' }; // 兵多城固
  return { ok: true };
}

/** The voice that answers at the wall — the keenest tongue garrisoned there,
 *  falling back to the force's court voice if the wall stands empty of talkers. */
export function pickGateKeeper(officers: Record<string, Officer>, cityId: string, ownerForceId: string): Officer | null {
  let best: Officer | null = null;
  let bestP = -Infinity;
  for (const o of Object.values(officers)) {
    if (o.forceId !== ownerForceId || o.locationCityId !== cityId) continue;
    if (!canOrate(o)) continue;
    const p = moonScore(o);
    if (p > bestP) { bestP = p; best = o; }
  }
  return best ?? pickCourtVoice(officers, ownerForceId);
}

export interface PersuadeStakes {
  /** The gates open — the city comes over without a corpse (rout only). */
  cityFalls: boolean;
  /** 軍心離散 — the fraction of the garrison that melts away on a points win. */
  garrisonExodus: number;
  /** Relations shift with the wall's owner. */
  scoreDelta: number;
}

/** 舌戰說降 terms: only a 罵倒 opens the gates outright; a clear win still bleeds
 *  the wall (a quarter of the garrison slips away); a loss stiffens them. */
export function persuadeStakes(outcome: ParleyOutcome, routed: boolean): PersuadeStakes {
  if (outcome === 'win' && routed) return { cityFalls: true, garrisonExodus: 0, scoreDelta: -15 };
  if (outcome === 'win') return { cityFalls: false, garrisonExodus: 0.25, scoreDelta: -8 };
  if (outcome === 'loss') return { cityFalls: false, garrisonExodus: 0, scoreDelta: -4 };
  return { cityFalls: false, garrisonExodus: 0.1, scoreDelta: -2 };
}
