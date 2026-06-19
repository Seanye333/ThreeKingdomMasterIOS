import type { Appointment, AppointmentHistoryEntry, CivicTitle, CivicTitleId, EntityId, Officer } from '../types';
import { CIVIC_TITLES_BY_ID, MILITARY_RANKS_BY_ID } from '../data/titles';

/**
 * Some traits make an officer refuse a post. Returns a refusal reason in
 * both languages, or null if accepted.
 */
export function traitRefusal(
  officer: Officer,
  titleDef: CivicTitle,
): { en: string; zh: string } | null {
  const traits = officer.traits ?? [];
  if (titleDef.id === 'prefect' && traits.includes('arrogant')) {
    return {
      en: `${officer.name.en} considers a prefecture beneath his standing.`,
      zh: `${officer.name.zh}以太守之位為屈身,謝不就。`,
    };
  }
  if (titleDef.id === 'chancellor' && traits.includes('humble')) {
    return {
      en: `${officer.name.en} declines the chancellorship — too great an honor.`,
      zh: `${officer.name.zh}謙辭丞相之位,以為德薄。`,
    };
  }
  if (
    traits.includes('lazy') &&
    (titleDef.id === 'chancellor' || titleDef.id === 'minister' || titleDef.id === 'strategist')
  ) {
    return {
      en: `${officer.name.en} pleads infirmity to dodge the workload.`,
      zh: `${officer.name.zh}託病避煩,謝不就。`,
    };
  }
  return null;
}

const COOLDOWN_SEASONS = 4;
const SEASON_INDEX: Record<NonNullable<Appointment['appointedSeason']>, number> = {
  spring: 0, summer: 1, autumn: 2, winter: 3,
};

function seasonsBetween(
  fromYear: number,
  fromSeason: NonNullable<Appointment['appointedSeason']>,
  toYear: number,
  toSeason: NonNullable<Appointment['appointedSeason']>,
): number {
  return (toYear - fromYear) * 4 + (SEASON_INDEX[toSeason] - SEASON_INDEX[fromSeason]);
}

/**
 * Returns true if the (officerId, titleId) pair is still in its 4-season
 * cooldown after a prior revocation. Prevents loyalty-bump farming.
 */
export function isOnCooldown(
  history: AppointmentHistoryEntry[],
  officerId: EntityId,
  titleId: CivicTitleId,
  currentYear: number,
  currentSeason: NonNullable<Appointment['appointedSeason']>,
): { onCooldown: boolean; seasonsLeft: number } {
  let lastRevokeYear = -Infinity;
  let lastRevokeSeason: NonNullable<Appointment['appointedSeason']> = 'spring';
  for (const h of history) {
    if (h.kind !== 'revoke') continue;
    if (h.officerId !== officerId || h.titleId !== titleId) continue;
    const distance = seasonsBetween(h.year, h.season, lastRevokeYear === -Infinity ? h.year : lastRevokeYear, lastRevokeSeason);
    if (lastRevokeYear === -Infinity || distance < 0 || (h.year > lastRevokeYear) || (h.year === lastRevokeYear && SEASON_INDEX[h.season] > SEASON_INDEX[lastRevokeSeason])) {
      lastRevokeYear = h.year;
      lastRevokeSeason = h.season;
    }
  }
  if (lastRevokeYear === -Infinity) return { onCooldown: false, seasonsLeft: 0 };
  const elapsed = seasonsBetween(lastRevokeYear, lastRevokeSeason, currentYear, currentSeason);
  if (elapsed >= COOLDOWN_SEASONS) return { onCooldown: false, seasonsLeft: 0 };
  return { onCooldown: true, seasonsLeft: COOLDOWN_SEASONS - elapsed };
}

export interface AppointmentBonus {
  internalMultiplier: number;
  recruitBonus: number;
  powerMultiplier: number;
  diplomacyMultiplier: number;
  loyaltyDriftPerSeason: number;
  advisorMultiplier: number;
}

const ZERO: AppointmentBonus = {
  internalMultiplier: 1,
  recruitBonus: 0,
  powerMultiplier: 1,
  diplomacyMultiplier: 1,
  loyaltyDriftPerSeason: 0,
  advisorMultiplier: 1,
};

/**
 * Aggregate civic-title force bonuses for a force, optionally scoped to a
 * single city (prefect bonuses only apply at their seat). Skips titles
 * whose holder is dead or imprisoned.
 */
export function appointmentBonusFor(
  forceId: EntityId | null,
  appointments: Appointment[],
  officers: Record<EntityId, Officer>,
  cityId?: EntityId,
): AppointmentBonus {
  if (!forceId) return { ...ZERO };
  const out: AppointmentBonus = { ...ZERO };
  for (const a of appointments) {
    if (a.forceId !== forceId) continue;
    const o = officers[a.officerId];
    if (!o || o.status === 'dead' || o.status === 'imprisoned') continue;
    const def = CIVIC_TITLES_BY_ID[a.titleId];
    if (!def) continue;
    // Prefect: only contributes when the city matches its seat.
    if (a.titleId === 'prefect') {
      if (cityId && a.cityId !== cityId) continue;
      if (!cityId && !a.cityId) continue;
    }
    const fb = def.forceBonus;
    if (fb.internalMultiplier)  out.internalMultiplier  *= fb.internalMultiplier;
    if (fb.recruitBonus)        out.recruitBonus        += fb.recruitBonus;
    if (fb.powerMultiplier)     out.powerMultiplier     *= fb.powerMultiplier;
    if (fb.diplomacyMultiplier) out.diplomacyMultiplier *= fb.diplomacyMultiplier;
    if (fb.loyaltyDrift)        out.loyaltyDriftPerSeason += fb.loyaltyDrift;
    if (fb.advisorMultiplier)   out.advisorMultiplier   *= fb.advisorMultiplier;
  }
  return out;
}

/**
 * Total military stipend owed per season by a force — sum of all officers'
 * rank stipends. Deducted from the force's capital at season-end.
 */
export function totalStipendForForce(
  forceId: EntityId | null,
  officers: Record<EntityId, Officer>,
): number {
  if (!forceId) return 0;
  let sum = 0;
  for (const o of Object.values(officers)) {
    if (o.forceId !== forceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    const rank = MILITARY_RANKS_BY_ID[o.rank];
    if (rank) sum += rank.stipend;
  }
  return sum;
}

/**
 * Drop appointments whose preconditions no longer hold: officer is dead /
 * imprisoned / unsearched, officer left the force, prefect's city changed
 * owner, etc. Returns the surviving list plus a description of each drop.
 */
export function pruneStaleAppointments(
  appointments: Appointment[],
  officers: Record<EntityId, Officer>,
  cities: Record<EntityId, { ownerForceId: EntityId | null }>,
): {
  appointments: Appointment[];
  dropped: Array<{ appointment: Appointment; reason: 'dead' | 'imprisoned' | 'defected' | 'lost-city' | 'missing' }>;
} {
  const kept: Appointment[] = [];
  const dropped: Array<{ appointment: Appointment; reason: 'dead' | 'imprisoned' | 'defected' | 'lost-city' | 'missing' }> = [];
  for (const a of appointments) {
    const o = officers[a.officerId];
    if (!o) { dropped.push({ appointment: a, reason: 'missing' }); continue; }
    if (o.status === 'dead') { dropped.push({ appointment: a, reason: 'dead' }); continue; }
    if (o.status === 'imprisoned') { dropped.push({ appointment: a, reason: 'imprisoned' }); continue; }
    if (o.forceId !== a.forceId) { dropped.push({ appointment: a, reason: 'defected' }); continue; }
    if (a.titleId === 'prefect' && a.cityId) {
      const c = cities[a.cityId];
      if (!c || c.ownerForceId !== a.forceId) {
        dropped.push({ appointment: a, reason: 'lost-city' });
        continue;
      }
    }
    kept.push(a);
  }
  return { appointments: kept, dropped };
}
