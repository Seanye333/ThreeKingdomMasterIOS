/**
 * 整編 (§4.12) — quality is a *ratio*, and the game has been treating it as a
 * property.
 *
 * A city's 練度 and 老兵度 sit on the city, not on the men. So a fortress whose
 * garrison had been drilled to 80 could take on twenty thousand fresh conscripts
 * and remain, on paper, drilled to 80. Every account of the period says the
 * opposite: 新兵 dilute. It is the reason a beaten army rebuilt in a season was
 * never the army that was beaten, and the reason Cao Cao's 青州兵 mattered — a
 * body of men who had already fought, folded in whole.
 *
 * The arithmetic is a weighted average and nothing more, but it changes how the
 * game plays: mass conscription buys numbers at the cost of quality, while men
 * who come back from the infirmary (§4.11) *raise* the average, because they are
 * the ones who have already been shot at.
 *
 * Pure.
 */

/**
 * Fold `added` men of quality `addedQuality` into `existing` men of quality
 * `current`. Returns the new quality.
 */
export function dilute(args: {
  current: number;
  existing: number;
  added: number;
  /** Quality of the incoming men (raw conscripts = 0). */
  addedQuality?: number;
}): number {
  const existing = Math.max(0, args.existing);
  const added = Math.max(0, args.added);
  if (added <= 0) return args.current;
  const total = existing + added;
  if (total <= 0) return 0;
  const q = (args.current * existing + (args.addedQuality ?? 0) * added) / total;
  return Math.max(0, Math.min(100, Math.round(q * 10) / 10));
}

/**
 * The signed change to apply as a delta (the command pipeline adds deltas
 * rather than assigning values).
 */
export function diluteDelta(args: {
  current: number;
  existing: number;
  added: number;
  addedQuality?: number;
}): number {
  return Math.round((dilute(args) - args.current) * 10) / 10;
}

/** Quality raw conscripts bring with them: none at all. */
export const CONSCRIPT_QUALITY = 0;
/**
 * 傷癒歸伍 — men back from the infirmary have already been in a battle line.
 * They come back *better* than the average garrison, which is why a well-run
 * infirmary is worth more than the headcount suggests.
 */
export const RECOVERED_QUALITY = 70;

export interface MergeInput {
  troopsA: number;
  qualityA: number;
  troopsB: number;
  qualityB: number;
}

/** 併軍 — fold two bodies of men together; quality follows the weights. */
export function mergeQuality(input: MergeInput): number {
  const total = Math.max(0, input.troopsA) + Math.max(0, input.troopsB);
  if (total <= 0) return 0;
  const q = (input.qualityA * Math.max(0, input.troopsA) + input.qualityB * Math.max(0, input.troopsB)) / total;
  return Math.max(0, Math.min(100, Math.round(q * 10) / 10));
}

export function dilutionNote(before: number, after: number): { zh: string; en: string } | null {
  const drop = Math.round((before - after) * 10) / 10;
  if (drop < 2) return null;
  return {
    zh: `新兵入伍,練度自 ${before.toFixed(0)} 稀釋為 ${after.toFixed(0)}`,
    en: `Fresh conscripts dilute drill from ${before.toFixed(0)} to ${after.toFixed(0)}`,
  };
}
