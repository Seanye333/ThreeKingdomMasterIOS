import type { Appointment, City, EntityId, Force, ImperialRank } from '../types';
import { IMPERIAL_RANKS, IMPERIAL_RANKS_BY_ID } from '../data/imperial';

/**
 * Check whether a force qualifies to be promoted into `target` imperial rank.
 * Returns a refusal reason if it doesn't, null if eligible.
 */
export function canPromoteToRank(
  target: ImperialRank,
  force: Force,
  cities: Record<EntityId, City>,
  appointments: Appointment[],
  currentYear: number,
  eventFlags: Record<string, boolean>,
): { ok: true } | { ok: false; reason: string } {
  const def = IMPERIAL_RANKS_BY_ID[target];
  if (!def) return { ok: false, reason: 'invalid rank' };
  const currentTier = IMPERIAL_RANKS_BY_ID[force.imperialRank ?? 'commoner']?.tier ?? 0;
  // Must climb one tier at a time.
  if (def.tier !== currentTier + 1) {
    if (def.tier <= currentTier) return { ok: false, reason: '不可降爵' };
    return { ok: false, reason: '須循序進爵' };
  }
  const req = def.requirements ?? {};
  if (req.minCities) {
    const owned = Object.values(cities).filter((c) => c.ownerForceId === force.id).length;
    if (owned < req.minCities) {
      return { ok: false, reason: `需領 ${req.minCities} 城（現 ${owned}）` };
    }
  }
  if (req.minYear && currentYear < req.minYear) {
    return { ok: false, reason: `需至 ${req.minYear} 年方可（現 ${currentYear}）` };
  }
  if (req.requiresChancellor) {
    const hasChancellor = appointments.some(
      (a) => a.forceId === force.id && a.titleId === 'chancellor',
    );
    if (!hasChancellor) return { ok: false, reason: '需先拜丞相' };
  }
  if (req.requiresEnthronement) {
    if (!eventFlags['enthroned-' + force.id]) {
      return { ok: false, reason: '須先頒「即位」詔令' };
    }
  }
  return { ok: true };
}

export function nextImperialRank(current: ImperialRank): ImperialRank | null {
  const cur = IMPERIAL_RANKS_BY_ID[current];
  if (!cur) return null;
  const next = IMPERIAL_RANKS.find((r) => r.tier === cur.tier + 1);
  return next?.id ?? null;
}
