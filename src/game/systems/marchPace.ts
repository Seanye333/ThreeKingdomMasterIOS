/**
 * 行軍節奏 — the pace a column marches at, and what speeds or slows it (§4.1).
 * Until now 出陣 had a single fixed speed (distance → 旬). Now the player picks:
 *   • 急行軍 (forced): −1 旬, but men fall out on the road (累毙) and the column
 *     opens its arrival battle weary (疲勞 — 以逸待勞);
 *   • 常行 (normal): the baseline;
 *   • 緩進 (cautious): +1 旬, but rested & foraging — its 孤軍深入 toll is halved.
 * And march-speed traits/policies that were flavour-only now bite: 健行/嚴峻/騎將/
 * 鐵律 + 驛站 speed a column, 鈍重 drags it.
 *
 * Pure functions; the store/resolution/combat thread them onto live state.
 */
import type { Officer } from '../types';

export type MarchPace = 'forced' | 'normal' | 'cautious';
export const MARCH_PACES: MarchPace[] = ['forced', 'normal', 'cautious'];
export const PACE_LABEL: Record<MarchPace, { zh: string; en: string }> = {
  forced:   { zh: '急行軍', en: 'Forced' },
  normal:   { zh: '常行',   en: 'Normal' },
  cautious: { zh: '緩進',   en: 'Cautious' },
};

const has = (o: Officer, t: string) => (o.traits as string[] | undefined ?? []).includes(t);
const hasPolicy = (o: Officer, p: string) => (o.policies as string[] | undefined ?? []).includes(p);

/** 行軍捷疾 — column speed vs a base march, from the officers' traits & 驛站.
 *  >1 faster, <1 slower. Takes the best single facilitator (no stacking), but a
 *  鈍重 commander at the head drags the whole host. */
export function marchSpeedMul(officers: Officer[]): number {
  let bonus = 0;
  for (const o of officers) {
    if (has(o, 'tireless-march')) bonus = Math.max(bonus, 0.15); // 健行
    if (has(o, 'stern')) bonus = Math.max(bonus, 0.10);          // 嚴峻治軍
    if (has(o, 'cavalryman')) bonus = Math.max(bonus, 0.10);     // 騎將
    if (has(o, 'iron-discipline')) bonus = Math.max(bonus, 0.05);// 鐵律
    if (hasPolicy(o, 'post-roads')) bonus = Math.max(bonus, 0.10);// 驛站
  }
  let mul = 1 + bonus;
  if (officers[0] && has(officers[0], 'ponderous')) mul -= 0.10; // 鈍重 lead
  return mul;
}

/** 行程旬數 — fold pace + speed into the base season count (旬-granular). A forced
 *  march shaves a 旬, a cautious one adds one; a fleet/驛站 column shaves one on a
 *  real road, a 鈍重 one adds. Never below 1. */
export function adjustMarchSeasons(base: number, pace: MarchPace, speedMul: number): number {
  let s = base;
  if (pace === 'forced') s -= 1;
  else if (pace === 'cautious') s += 1;
  if (speedMul >= 1.12 && base >= 2) s -= 1; // a fast column on a real road
  if (speedMul <= 0.92) s += 1;              // plodders
  return Math.max(1, s);
}

/** 累毙 — extra fraction a forced-marched column sheds each season (hard driving
 *  outruns its stragglers). 0 for normal/cautious. */
export function forcedMarchAttrition(pace: MarchPace | undefined): number {
  return pace === 'forced' ? 0.03 : 0;
}
/** 緩進 — a cautious column forages and rests; its 孤軍深入 toll is halved. */
export function cautiousAttritionMul(pace: MarchPace | undefined): number {
  return pace === 'cautious' ? 0.5 : 1;
}
/** 疲勞 — morale the column opens its arrival battle down by, if it force-marched
 *  to get there (以逸待勞). Applied to the arrival battle (auto + interactive). */
export function arrivalFatigueMorale(pace: MarchPace | undefined): number {
  return pace === 'forced' ? 12 : 0;
}
/** 行軍暴露 — a forced march strings the column out and is caught at longer range
 *  (interception / 守軍出擊); a cautious one keeps tight & screened. Multiplies the
 *  catch radius. */
export function paceExposureMul(pace: MarchPace | undefined): number {
  return pace === 'forced' ? 1.25 : pace === 'cautious' ? 0.8 : 1;
}

// ── 師老兵疲 — cumulative campaign fatigue (0..100) a column carries across
// seasons. Marching wears it up (harder at a forced pace), camping rests it
// off — but a siege camp is itself grinding work. Fatigue saps field power
// and opens battles with lower morale, so deep multi-season campaigns need
// rest stops, not just supply.
export const FATIGUE_MAX = 100;
/** Per-season fatigue change. Returns the new value, clamped 0..100. */
export function accrueFatigue(
  fatigue: number | undefined,
  opts: { pace?: MarchPace; holding?: boolean; besieging?: boolean },
): number {
  const f = fatigue ?? 0;
  const delta = opts.holding
    ? (opts.besieging ? 4 : -8)                      // siege camps grind; rest camps recover
    : opts.pace === 'forced' ? 14
    : opts.pace === 'cautious' ? 4
    : 8;
  return Math.max(0, Math.min(FATIGUE_MAX, f + delta));
}
/** 疲兵之弱 — field-power multiplier from fatigue (100 疲 → ×0.75). */
export function fatiguePowerMul(fatigue: number | undefined): number {
  return 1 - Math.min(0.25, (fatigue ?? 0) / 400);
}
/** 疲兵之靡 — extra opening-morale malus in an arrival/field battle (cap 15). */
export function fatigueMoraleMalus(fatigue: number | undefined): number {
  return Math.min(15, Math.round((fatigue ?? 0) / 8));
}

// ── 避戰迂迴 — an evading column takes back roads and screens its movement,
// trying to SLIP a contact instead of fighting it. Wits decide: the evader's
// best intelligence against the hunter's. A cautious pace helps, a forced
// march (strung-out files) hurts. Caught anyway = fighting strung out.
export function evadeSlipChance(
  evaderIntel: number,
  hunterIntel: number,
  pace: MarchPace | undefined,
): number {
  const paceAdj = pace === 'cautious' ? 0.15 : pace === 'forced' ? -0.1 : 0;
  return Math.max(0.2, Math.min(0.85, 0.4 + (evaderIntel - hunterIntel) * 0.004 + paceAdj));
}
/** 倉皇接戰 — power multiplier on an evader caught mid-slip. */
export const EVADE_CAUGHT_MUL = 0.85;
