/**
 * 俘虜的下場 — consequences for what you do with a prisoner (§3.3). The capture
 * → persuade/release/execute loop existed, but execution was consequence-free and
 * the AI never decided its own captives' fates. This module adds the weight:
 *   • 寧死不降 — the ironhearted (鐵血龐德, 鐵骨) will NEVER defect; only release or
 *     the sword. Persuasion is wasted on them.
 *   • 殺降不祥 — executing a prisoner costs the executing lord 威望 (the more so a
 *     man of honour or renown), and sows 宿怨: the slain man's kin and sworn
 *     brothers mark the killer's house (near-unrecruitable thereafter), and his
 *     old lord's court sours toward you.
 *   • AI verdicts — a captor lord now recruits the turncoats, frees the worthy
 *     (the benevolent), or puts the dangerous to the sword (the cruel) — bearing
 *     the same costs you would.
 *
 * Pure functions; the store / season loop thread them onto live state.
 */
import type { EntityId, FamilyRelation, Officer } from '../types';
import type { OathBond } from '../data/bonds';
import { parentsOf, childrenOf, spousesOf, siblingsOf, allSwornBrothersOf } from './relationshipEffects';

const has = (o: Officer, t: string) => (o.traits as string[] | undefined ?? []).includes(t);
const peakStat = (o: Officer) =>
  Math.max(o.stats.war, o.stats.leadership, o.stats.intelligence, o.stats.politics, o.stats.charisma);

/** 寧死不降 — officers who refuse captivity outright; persuasion cannot turn them
 *  (the trait descriptions literally say "至死不降" / "受刑不降"). Only release or
 *  execution remain. Kept narrow so most captives stay winnable. */
export function isMartyr(o: Officer): boolean {
  return has(o, 'ironhearted') || has(o, 'iron-bones');
}

const HONOUR_TRAITS = ['loyal', 'noble', 'honor-bound', 'patriotic', 'chivalrous', 'righteous'];

/** 殺降之累 — renown the executing lord forfeits for putting this captive to the
 *  sword. Killing a man of honour, fame, or one who chose death over surrender
 *  weighs far heavier than dispatching a nobody. */
export function executionRenownCost(victim: Officer): number {
  let cost = 3;
  cost += Math.min(8, Math.round((victim.renown ?? 0) / 8)); // stature of the fallen
  const peak = peakStat(victim);
  cost += peak >= 90 ? 3 : peak >= 78 ? 1 : 0;
  if (isMartyr(victim)) cost += 5;                                  // 殺身成仁,天下震動
  if (HONOUR_TRAITS.some((t) => has(victim, t))) cost += 3;         // 殺忠義,不德
  return Math.min(20, cost);
}

/** 宿怨種子 — mark the slain man's surviving kin and sworn brothers with the
 *  killer's force, so they bear a grudge (near-unrecruitable, +combat vs them).
 *  Mirrors the battle-kill vendetta in combat.ts. Returns a patched officers map
 *  (only the touched officers are new objects). */
export function markSlainVendetta(
  officers: Record<EntityId, Officer>,
  victimId: EntityId,
  killerForceId: EntityId,
  family: FamilyRelation[],
  runtimeBonds: OathBond[] = [],
): Record<EntityId, Officer> {
  const next = { ...officers };
  const kin = [...parentsOf(victimId, family), ...childrenOf(victimId, family), ...spousesOf(victimId, family), ...siblingsOf(victimId, family)];
  for (const relId of kin) {
    const rel = next[relId];
    if (!rel || rel.status === 'dead') continue;
    next[relId] = { ...rel, killedRelativesBy: { ...(rel.killedRelativesBy ?? {}), [victimId]: killerForceId } };
  }
  for (const swornId of allSwornBrothersOf(victimId, runtimeBonds)) {
    const sw = next[swornId];
    if (!sw || sw.status === 'dead') continue;
    next[swornId] = { ...sw, killedSwornBy: { ...(sw.killedSwornBy ?? {}), [victimId]: killerForceId } };
  }
  return next;
}

const CRUEL_TRAITS = ['cruel', 'ruthless', 'merciless', 'sadistic', 'ambitious', 'paranoid'];
const MERCIFUL_TRAITS = ['benevolent', 'compassionate', 'noble', 'chivalrous', 'magnanimous'];

export type CaptiveVerdict = 'recruit' | 'execute' | 'release' | 'hold';

/** A captor lord's verdict on a prisoner. Persuadable men are recruited; of the
 *  rest, a merciful lord frees them (報恩 seeds a future ally), a cruel lord cuts
 *  down the dangerous, and the undecided are simply held (for the ransom market).
 *  `recruitChance` is the captor's odds of turning them (0 if 寧死不降 / kin-killer). */
export function aiCaptiveVerdict(args: {
  ruler: Officer;
  victim: EntityId | Officer;
  recruitChance: number;
  rng: () => number;
}): CaptiveVerdict {
  const { ruler, recruitChance, rng } = args;
  const victim = typeof args.victim === 'string' ? null : args.victim;
  if (recruitChance > 0 && rng() < recruitChance) return 'recruit';
  const merciful = MERCIFUL_TRAITS.some((t) => has(ruler, t));
  const cruel = CRUEL_TRAITS.some((t) => has(ruler, t));
  const dangerous = !!victim && (peakStat(victim) >= 82 || isMartyr(victim));
  if (merciful && !cruel) return 'release';        // 義釋 — wins a name, seeds 報恩
  if (cruel && dangerous && rng() < 0.6) return 'execute'; // 除大患
  return 'hold';                                   // leave to the ransom market
}

/** The captor's rough odds of turning a prisoner — a light read for AI verdicts
 *  (the full player-facing math lives in officerFate's estimateRecruitChance). */
export function aiRecruitChance(ruler: Officer, victim: Officer, captorForceId: EntityId): number {
  if (isMartyr(victim)) return 0;                  // 寧死不降
  const killers = new Set<string>([...Object.values(victim.killedRelativesBy ?? {}), ...Object.values(victim.killedSwornBy ?? {})]);
  if (killers.has(captorForceId)) return 0;        // 誓不事仇
  let c = (ruler.stats.charisma - victim.loyalty + 35) / 100;
  if (has(victim, 'greedy') || has(victim, 'ambitious')) c += 0.15;
  if (HONOUR_TRAITS.some((t) => has(victim, t))) c -= 0.25;
  return Math.max(0, Math.min(0.8, c));
}
