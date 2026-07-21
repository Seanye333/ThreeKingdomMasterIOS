/**
 * 傷兵與撫恤 (§4.11) — the men who did not die.
 *
 * Casualties in this game have always been a single number that leaves the
 * board. Every account of these wars says otherwise: the larger part of a
 * defeated army's "losses" were wounded, stragglers and men who came back in a
 * fortnight, and what a commander did about them decided how fast he could
 * fight again. 傷兵營 has existed as a building since the first build; it
 * healed *officers* and did nothing whatever for the army.
 *
 * Now a share of a garrison's losses lands in `City.wounded` instead of
 * vanishing. Each season some walk back into the ranks, some are invalided home
 * (they rejoin the population — 屯戶), and some die of their wounds. Which
 * proportion is entirely down to care: a 醫館/傷兵營, a physician of some
 * competence stationed there, and 藥材 in the stores.
 *
 * The effect on play is that a defensive war becomes an *investment* question
 * rather than pure attrition — and that 藥材, until now a trade good, is
 * something you want in the city you expect to be besieged.
 *
 * Pure. resolution.ts and the tactical aftermath split the casualties; the
 * civic tick recovers them.
 */

/** Share of a beaten force's losses that are wounded rather than dead. */
export const BASE_WOUNDED_SHARE = 0.3;
/** …raised when the side held the field and could gather its own. */
export const HELD_FIELD_BONUS = 0.12;
/** 藥材 consumed per wounded man treated in a season. */
export const MEDICINE_PER_WOUNDED = 0.4;

export interface CasualtySplit {
  dead: number;
  wounded: number;
}

/**
 * Split a body count into the dead and the wounded. Holding the ground is what
 * decides it: an army that keeps the field carries its wounded off, an army
 * that runs leaves them where they fell.
 */
export function splitCasualties(losses: number, opts: {
  heldField?: boolean;
  hasHospital?: boolean;
} = {}): CasualtySplit {
  const l = Math.max(0, Math.round(losses));
  if (l <= 0) return { dead: 0, wounded: 0 };
  let share = BASE_WOUNDED_SHARE;
  if (opts.heldField) share += HELD_FIELD_BONUS;
  if (opts.hasHospital) share += 0.08;
  const wounded = Math.round(l * Math.min(0.55, share));
  return { dead: l - wounded, wounded };
}

export interface RecoveryResult {
  /** Men who walk back into the ranks. */
  recovered: number;
  /** Invalided home — they rejoin the city's population, not its garrison. */
  invalided: number;
  /** Died of their wounds. */
  died: number;
  /** Wounded still under care next season. */
  remaining: number;
  /** 藥材 drawn from the city's stores. */
  medicineUsed: number;
}

/**
 * Work the infirmary for one season.
 *
 * With no care at all roughly a third recover anyway, a fifth die and the rest
 * go home crippled. A full 傷兵營 with medicine and a capable physician turns
 * that around entirely: most of them come back.
 */
export function recoverWounded(args: {
  wounded: number;
  /** 醫館 = 1, 傷兵營 = 2+ (the building's level). */
  hospitalLevel?: number;
  /** Best 智力 among officers stationed here — the physician. */
  physicianIntellect?: number;
  /** 藥材 in the city's stores. */
  medicine?: number;
}): RecoveryResult {
  const wounded = Math.max(0, Math.round(args.wounded));
  if (wounded <= 0) return { recovered: 0, invalided: 0, died: 0, remaining: 0, medicineUsed: 0 };

  const hospital = Math.max(0, Math.min(3, args.hospitalLevel ?? 0));
  // Medicine only helps as far as it goes round.
  const need = wounded * MEDICINE_PER_WOUNDED;
  const medicineUsed = Math.min(Math.max(0, args.medicine ?? 0), need);
  const dosed = need > 0 ? medicineUsed / need : 0;

  const care = hospital * 0.09
    + Math.min(0.12, (args.physicianIntellect ?? 0) / 700)
    + dosed * 0.14;

  const recoverRate = Math.min(0.82, 0.34 + care);
  const deathRate = Math.max(0.03, 0.2 - care * 0.8);
  const recovered = Math.round(wounded * recoverRate);
  const died = Math.round(wounded * deathRate);
  const invalided = Math.round((wounded - recovered - died) * 0.6);
  const remaining = Math.max(0, wounded - recovered - died - invalided);
  return { recovered, invalided, died, remaining, medicineUsed: Math.round(medicineUsed) };
}

export function woundedTier(wounded: number, troops: number): { zh: string; en: string } {
  const ratio = troops > 0 ? wounded / troops : wounded > 0 ? 1 : 0;
  if (wounded <= 0) return { zh: '營中無傷', en: 'No wounded' };
  if (ratio >= 0.25) return { zh: '傷卒滿營', en: 'Overflowing' };
  if (ratio >= 0.08) return { zh: '傷者頗眾', en: 'Many wounded' };
  return { zh: '略有傷卒', en: 'Some wounded' };
}
