import type { City, EntityId, Officer } from '../types';
import { cityPos } from '../data/cityGeo';

/**
 * 潰軍 — shared constants + helpers for the world-map rout system.
 *
 * A beaten field army no longer evaporates into its source city's books:
 * it becomes a ROUT — a fragile column that physically flees toward its
 * nearest friendly city, sheds stragglers every season on the run, and is
 * cut down (掩殺) rather than fought when a hostile army or garrison
 * catches it. Cutting one down yields surrendered men (收降) and a chance
 * to take its officers. A 殿軍 (rear-guard) officer on the routed side
 * blunts every stage of the slaughter — and always cuts his own way out.
 *
 * Created in three places: field-clash loser, sally loser (both in
 * resolution.ts), and a repulsed city assault (combat.ts handleMarch).
 */

/** Fewer survivors than this simply scatter — no rout forms. */
export const ROUT_MIN_TROOPS = 400;
/** A hunted rout cut below this is wiped out (追亡逐北). */
export const ROUT_DISSOLVE_BELOW = 300;
/** 掩殺 — base kill fraction when a pursuit strike lands. */
export const PURSUIT_KILL_BASE = 0.55;
/** 追撃 skill on the hunting side sharpens the strike. */
export const PURSUIT_SKILL_BONUS = 0.15;
/** 斷後 — a rear-guard officer on the routed side blunts the slaughter. */
export const REAR_GUARD_MUL = 0.6;
/** 收降 — fraction of the cut-down men who join the victor. */
export const PURSUIT_ABSORB_FRAC = 0.3;
/** Per-officer capture roll when a rout is annihilated. */
export const ROUT_CAPTURE_CHANCE = 0.35;
/** 潰散 — stragglers shed per season a rout stays on the run. */
export const ROUT_SHED_FRAC = 0.08;

/** The rear-guard officer among an army's officers (skill or 性格), if any. */
export function rearGuardOfficer(
  officerIds: EntityId[],
  officers: Record<EntityId, Officer>,
): Officer | undefined {
  return officerIds
    .map((id) => officers[id])
    .find((o): o is Officer =>
      !!o && (o.skills.includes('rear-guard') || (o.traits ?? []).includes('rear-guard')));
}

/** Nearest un-ruined city still held by `forceId` — where a rout runs to. */
export function nearestShelterCity(
  x: number,
  y: number,
  forceId: EntityId,
  cities: Record<EntityId, City>,
): City | null {
  let best: City | null = null;
  let bestD = Infinity;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId || c.ruined) continue;
    const cp = cityPos(c);
    const d = Math.hypot(cp.x - x, cp.y - y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
