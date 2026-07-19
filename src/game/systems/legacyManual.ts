import type { Officer } from '../types';
import { martialTier } from './martialArts';
import { debateArtsTier } from './debateArts';

/**
 * 遺譜傳世 (§6.10/§6.14) — a master's art outlives the master. When a 宗師+
 * (武學修為 ≥82) or 名士+ (文辯修為 ≥82) dies, the notes and commentaries of a
 * lifetime are gathered where they fell: a manual drops into that city's
 * treasure pool (lostItems) for whoever comes looking. 人亡而藝不絕 — the
 * loss of a great officer now seeds the next generation's growth instead of
 * simply deleting the investment you poured into them.
 *
 * The drop reuses the existing 秘籍/辯經 catalogue (no per-instance items):
 * the deeper the master's 修為, the weightier the volume left behind.
 */

/** 武學遺譜 by mastery tier — the peerless leave the richest notes. */
const MARTIAL_LEGACY: Record<number, string> = {
  4: 'jianjing-manual',  // 宗師 → 越女劍經 (silver)
  5: 'wuwu-mijue',       // 武神 → 五兵秘訣 (gold)
};
/** 文辯遺集 by scholarship tier. */
const DEBATE_LEGACY: Record<number, string> = {
  4: 'gongyang-zhuan',   // 名士 → 春秋公羊傳 (silver)
  5: 'guiguzi-canon',    // 辯聖 → 鬼谷子 (gold)
};

export interface LegacyDrop {
  itemId: string;
  cityId: string;
  /** Which art the volume preserves — drives the chronicle line. */
  kind: 'martial' | 'debate';
  /** The master whose hand wrote it. */
  officerId: string;
}

/**
 * The manual(s) a dying officer leaves behind, dropped in `cityId` (their last
 * posting — callers must pass it BEFORE clearing the dead officer's location).
 * A rare soul mastered both arts and leaves two volumes. Empty when they were
 * no master of either. Pure.
 */
export function legacyManualDrops(officer: Officer, cityId: string | null | undefined): LegacyDrop[] {
  if (!cityId) return []; // died landless / in the field — nothing is gathered
  const out: LegacyDrop[] = [];
  const mt = martialTier(officer).tier;
  const dt = debateArtsTier(officer).tier;
  const martial = MARTIAL_LEGACY[mt];
  if (martial) out.push({ itemId: martial, cityId, kind: 'martial', officerId: officer.id });
  const debate = DEBATE_LEGACY[dt];
  if (debate) out.push({ itemId: debate, cityId, kind: 'debate', officerId: officer.id });
  return out;
}

/** The chronicle line for a legacy volume coming to rest. */
export function legacyDropLine(drop: LegacyDrop, officerNameZh: string, cityNameZh: string): { titleZh: string; textZh: string } {
  return drop.kind === 'martial'
    ? { titleZh: '遺譜傳世', textZh: `${officerNameZh} 既歿,其畢生武學手稿為門人所輯,藏於 ${cityNameZh} — 後之來者,可尋而習之。` }
    : { titleZh: '遺集傳世', textZh: `${officerNameZh} 既歿,其論辯文稿為弟子所輯,藏於 ${cityNameZh} — 後之來者,可尋而讀之。` };
}
