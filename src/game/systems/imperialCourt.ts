import type { EntityId, Force, Officer } from '../types';
import type { MandateState } from './mandate';

/**
 * §7.4 再深化 — 帝室朝政 (imperial court politics): the machinery of a Han court
 * beyond who holds the seal — 太后臨朝/幼主輔政 (regency), 外戚干政 (consort-kin),
 * 學官專權 (the inner court), and 正統之爭 (the contest of legitimacy between
 * rival emperors). Pure helpers; the store wires them into the season tick.
 */

/** A minor takes the throne below this age → a 輔政 regency forms. 親政 at it. */
export const COMING_OF_AGE = 18;

export function officerAge(o: Officer | undefined, year: number): number {
  if (!o || o.birthYear == null) return 99;
  return Math.max(0, year - o.birthYear);
}

/** 幼主 — is a realm's sitting ruler under age? */
export function isMinorRuler(force: Force, officers: Record<EntityId, Officer>, year: number): boolean {
  const ruler = officers[force.rulerOfficerId];
  if (!ruler || ruler.status === 'dead') return false;
  return officerAge(ruler, year) < COMING_OF_AGE;
}

/**
 * 託孤 — pick the regent for a minor ruler: the ablest senior statesman who
 * serves the realm (not the child ruler himself). Prefers age + wits + standing.
 * Returns null if there's no grown official to steady the throne.
 */
export function pickRegent(force: Force, officers: Record<EntityId, Officer>, year: number): Officer | null {
  let best: Officer | null = null;
  let bestScore = -1;
  for (const o of Object.values(officers)) {
    if (o.forceId !== force.id || o.id === force.rulerOfficerId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
    if (officerAge(o, year) < COMING_OF_AGE) continue; // a regent must be grown
    const score = o.stats.politics + o.stats.intelligence + o.stats.leadership * 0.5;
    if (score > bestScore) { bestScore = score; best = o; }
  }
  return best;
}

/**
 * 權臣坐大 — how much a regent's grip feeds his ambition each season. A regent
 * who is able but disloyal is the 董卓/司馬懿 danger; a devoted one (託孤之臣,
 * 諸葛亮) adds almost nothing. Returns a small betrayal-chance bonus (0..~0.05).
 */
export function regentAmbitionBoost(regent: Officer | undefined): number {
  if (!regent) return 0;
  const power = (regent.stats.leadership + regent.stats.politics) / 2; // 0..100
  const disloyal = Math.max(0, 60 - regent.loyalty) / 60; // loyalty 60+ → 0
  return Math.min(0.05, (power / 100) * disloyal * 0.06);
}

/**
 * 外戚之勢 — an over-mighty consort-kinsman (大將軍 何進/梁冀) also strains the
 * throne when he is able and cool toward it. Same shape as the regent's.
 */
export function consortAmbitionBoost(anchor: Officer | undefined): number {
  if (!anchor) return 0;
  const power = (anchor.stats.leadership + anchor.stats.war + anchor.stats.politics) / 3;
  const disloyal = Math.max(0, 55 - anchor.loyalty) / 55;
  return Math.min(0.045, (power / 100) * disloyal * 0.055);
}

/**
 * 正統 — a claimant-emperor's legitimacy score, for the contest when more than
 * one realm proclaims 帝. Built from the mandate of heaven it holds, whether it
 * keeps the Han 天子 (挾天子), the age of its dynasty, and its sheer weight.
 */
export function orthodoxyScore(args: {
  force: Force;
  mandate: MandateState;
  holdsEmperor: boolean;
  cityCount: number;
  year: number;
}): number {
  const { force, mandate, holdsEmperor, cityCount, year } = args;
  let s = (mandate.byForce[force.id] ?? 50); // 天命 is the spine
  if (holdsEmperor) s += 25; // 挾天子以令諸侯
  if (force.foundingYear != null) s += Math.min(20, (year - force.foundingYear) * 2); // 積年正朔
  s += Math.min(15, cityCount); // the realm's weight
  return s;
}

/** Whether a realm is a proclaimed emperor (its own Son of Heaven). */
export function isProclaimed(force: Force): boolean {
  return force.imperialRank === 'emperor';
}
