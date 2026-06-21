import type {
  Appointment,
  City,
  CivicTitle,
  CivicTitleId,
  EntityId,
  Force,
  MilitaryRankId,
  Officer,
} from '../types';
import { CIVIC_TITLES, CIVIC_TITLES_BY_ID, MILITARY_RANKS, MILITARY_RANKS_BY_ID } from '../data/titles';
import { traitRefusal } from './appointmentEffects';
import { officerGrade, gradeRank } from './officerGrade';

export interface AIAppointmentsContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  appointments: Appointment[];
  playerForceId: EntityId | null;
  year: number;
}

export interface AIAppointmentsOutput {
  appointments: Appointment[];
  officers: Record<EntityId, Officer>;
  /** Force-id keyed labels for surfaced changes (used by season-report logging). */
  changes: Array<{
    forceId: EntityId;
    kind: 'appoint' | 'promote';
    officerId: EntityId;
    titleId?: CivicTitleId;
    rankId?: MilitaryRankId;
  }>;
}

/**
 * Each AI force tries to fill any vacant civic posts (highest-stat eligible
 * officer wins) and promote officers who clear the next rank threshold.
 * Runs season-bounded so we don't thrash mid-period.
 */
export function planAIAppointments(ctx: AIAppointmentsContext): AIAppointmentsOutput {
  const officers = { ...ctx.officers };
  let appointments = [...ctx.appointments];
  const changes: AIAppointmentsOutput['changes'] = [];

  const aiForces = Object.values(ctx.forces).filter((f) => f.id !== ctx.playerForceId);

  for (const force of aiForces) {
    const forceOfficers = Object.values(officers).filter(
      (o) =>
        o.forceId === force.id &&
        o.status !== 'dead' &&
        o.status !== 'imprisoned' &&
        o.status !== 'unsearched',
    );
    if (forceOfficers.length === 0) continue;
    const heldTitles = new Set(
      appointments.filter((a) => a.forceId === force.id).map((a) =>
        a.titleId === 'prefect' ? `prefect-${a.cityId}` : a.titleId,
      ),
    );
    const heldByOfficer = new Set(
      appointments.filter((a) => a.forceId === force.id).map((a) => a.officerId),
    );

    // Civic title pass.
    for (const titleDef of CIVIC_TITLES as CivicTitle[]) {
      if (titleDef.id === 'prefect') {
        // One prefect per owned city.
        const ownCities = Object.values(ctx.cities).filter((c) => c.ownerForceId === force.id);
        for (const city of ownCities) {
          const key = `prefect-${city.id}`;
          if (heldTitles.has(key)) continue;
          const candidate = pickBestOfficer(forceOfficers, titleDef.primaryStat, heldByOfficer);
          if (!candidate) continue;
          appointments.push({
            officerId: candidate.id,
            forceId: force.id,
            titleId: 'prefect',
            cityId: city.id,
            appointedYear: ctx.year,
          });
          heldTitles.add(key);
          heldByOfficer.add(candidate.id);
          officers[candidate.id] = applyLoyaltyBump(candidate, titleDef.loyaltyOnAppoint ?? 0);
          changes.push({ forceId: force.id, kind: 'appoint', officerId: candidate.id, titleId: 'prefect' });
        }
        continue;
      }
      if (heldTitles.has(titleDef.id)) continue;
      // Skip if another existing appointment for this force excludes this title
      // (e.g. an existing 丞相 supersedes 太尉/司徒/大鴻臚).
      const excludedByExisting = appointments.some((a) => {
        if (a.forceId !== force.id) return false;
        const existingDef = CIVIC_TITLES_BY_ID[a.titleId];
        return existingDef?.excludes?.includes(titleDef.id) ?? false;
      });
      if (excludedByExisting) continue;
      // Find a candidate, skipping those who'd refuse on personality grounds.
      const candidates = forceOfficers
        .filter((o) => !heldByOfficer.has(o.id))
        .filter((o) => !traitRefusal(o, titleDef))
        // 品階門檻 — the AI also can't seat an under-grade officer in a high post.
        .filter((o) => !titleDef.minGrade || gradeRank(officerGrade(o).grade) >= gradeRank(titleDef.minGrade))
        .sort((a, b) => b.stats[titleDef.primaryStat] - a.stats[titleDef.primaryStat]);
      const candidate = candidates[0];
      if (!candidate) continue;
      // Sanity: only appoint someone with at least 60 in the primary stat.
      if (candidate.stats[titleDef.primaryStat] < 60) continue;
      appointments.push({
        officerId: candidate.id,
        forceId: force.id,
        titleId: titleDef.id,
        appointedYear: ctx.year,
      });
      heldTitles.add(titleDef.id);
      heldByOfficer.add(candidate.id);
      officers[candidate.id] = applyLoyaltyBump(candidate, titleDef.loyaltyOnAppoint ?? 0);
      changes.push({ forceId: force.id, kind: 'appoint', officerId: candidate.id, titleId: titleDef.id });
    }

    // Promotion pass — bump anyone who clears the next tier.
    for (const o of forceOfficers) {
      const currentTier = MILITARY_RANKS_BY_ID[o.rank]?.tier ?? 0;
      const best = Math.max(o.stats.war, o.stats.leadership);
      // Find the highest rank they qualify for.
      const nextRank = [...MILITARY_RANKS]
        .sort((a, b) => b.tier - a.tier)
        .find((r) => r.tier > currentTier && best >= r.minStat);
      if (!nextRank) continue;
      officers[o.id] = {
        ...o,
        rank: nextRank.id,
        loyalty: Math.min(100, o.loyalty + nextRank.loyaltyBonus),
      };
      changes.push({ forceId: force.id, kind: 'promote', officerId: o.id, rankId: nextRank.id });
    }
  }

  return { appointments, officers, changes };
}

function pickBestOfficer(
  candidates: Officer[],
  stat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma',
  excludeIds: Set<EntityId>,
): Officer | null {
  let best: Officer | null = null;
  let bestVal = -1;
  for (const o of candidates) {
    if (excludeIds.has(o.id)) continue;
    const v = o.stats[stat];
    if (v > bestVal) { best = o; bestVal = v; }
  }
  return best;
}

function applyLoyaltyBump(o: Officer, bump: number): Officer {
  if (bump <= 0) return o;
  return { ...o, loyalty: Math.min(100, o.loyalty + bump) };
}
