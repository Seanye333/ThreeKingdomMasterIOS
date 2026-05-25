import type { BilingualName, EntityId } from './common';

/**
 * Imperial titles: granted by whichever force "holds" the emperor (Cao's
 * Wei, then later self-declared rivals). They are above military rank and
 * apply to entire forces.
 *
 * The hierarchy is loosely: 侯 (Marquis) → 公 (Duke) → 王 (King) → 帝 (Emperor).
 * Only one Emperor at a time (the Han emperor, or whoever declares).
 */
export type ImperialRank =
  | 'commoner'  // 庶民 — no rank, no edicts
  | 'marquis'   // 侯
  | 'duke'      // 公
  | 'king'      // 王
  | 'emperor';  // 帝

export interface ImperialRankDef {
  id: ImperialRank;
  name: BilingualName;
  tier: number;
  /** Bonus to recruit success when this force has the rank. */
  recruitBonus: number;
  /** Multiplier on internal-affairs effects in this force. */
  internalMultiplier: number;
}

/**
 * Edicts: declarations a force with imperial standing can make.
 * Each can be issued once per N seasons.
 */
export type EdictKind =
  | 'denounce'         // 討伐令 — denounce a rival; cost diplomatic relation, gain casus belli
  | 'tax-amnesty'      // 大赦 — +10 loyalty in every city you own, costs gold
  | 'levy-tribute'     // 朝貢 — demand tribute from a vassal/lesser force
  | 'declare-vassal'   // 冊封 — recognize a force as your vassal (mutual)
  | 'enthronement';    // 即位 — declare yourself Emperor (huge stakes)

export interface EdictDef {
  kind: EdictKind;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Minimum imperial rank required to issue. */
  minRank: ImperialRank;
  /** Gold cost paid by the issuing force's capital. */
  goldCost: number;
  /** Cooldown in seasons. */
  cooldownSeasons: number;
}

export interface IssuedEdict {
  id: EntityId;
  kind: EdictKind;
  issuingForceId: EntityId;
  targetForceId?: EntityId;
  issuedYear: number;
  issuedSeason: 'spring' | 'summer' | 'autumn' | 'winter';
}
