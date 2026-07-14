import type { Officer } from '../types';
import { itemIsEvolved, ITEMS_BY_ID } from '../data/items';

/**
 * 器魂戰技 — a weapon whose 器魂 has awakened (·神 form, see W3/evolveItem) lends
 * its bearer a signature art in single combat: not just +18% stats, but a named
 * technique that sharpens their prowess. Iconic gold-rarity arms carry their own
 * named art; any other awakened weapon grants the generic 器魂之威. Folds into
 * duel prowess (prowessParts). The bonus follows the blade — pass it to another
 * champion and the art goes with it.
 */

export interface EvolvedArt {
  zh: string; en: string;
  descZh: string; descEn: string;
  /** Flat prowess added in single combat while the weapon is borne. */
  duelBonus: number;
}

const NAMED_ARTS: Record<string, Omit<EvolvedArt, 'duelBonus'>> = {
  'xuanyuan-jian': { zh: '軒轅一斬', en: 'Stroke of Xuanyuan', descZh: '上古神劍出鞘,天地為之變色', descEn: 'The primordial sword unsheathed' },
  'chixiao-jian': { zh: '斬白蛇', en: 'Slaying the White Serpent', descZh: '赤霄斬蛇,王氣所鍾', descEn: 'The blade that founded a dynasty' },
  'machao-yinlong-qiang': { zh: '銀龍出海', en: 'The Silver Dragon Surfaces', descZh: '槍出如龍,錦馬超之絕技', descEn: 'The lance strikes like a dragon' },
  'bai-qi-shen-qiang': { zh: '人屠之威', en: 'Terror of the Butcher', descZh: '殺神之槍,所向披靡', descEn: "The war-god's own spear" },
  'qin-qiong-shuang-jian': { zh: '撒手鐧', en: 'The Surprise Mace', descZh: '秦叔寶絕命一鐧,例不虛發', descEn: "Qin Qiong's finishing blow" },
  'bagua-ji': { zh: '八卦連環', en: 'Eight-Trigram Chain', descZh: '戟走八方,環環相扣', descEn: 'The halberd weaves the eight directions' },
};

const GENERIC_ART: Omit<EvolvedArt, 'duelBonus'> = {
  zh: '器魂之威', en: 'Might of the Awakened Spirit',
  descZh: '醒了器魂的神兵,自有懾人之威', descEn: 'An awakened arm carries its own dread',
};

/** Flat prowess an awakened weapon's art lends in single combat. */
export const EVOLVED_ART_DUEL_BONUS = 8;

/**
 * The 器魂戰技 an officer wields, from the first awakened weapon they bear (or
 * null if none of their arms has awakened its spirit).
 */
export function evolvedWeaponArt(o: Officer | undefined | null): EvolvedArt | null {
  if (!o) return null;
  for (const id of o.equipment) {
    const base = ITEMS_BY_ID[id];
    if (base?.kind !== 'weapon') continue;
    if (!itemIsEvolved(id)) continue;
    const named = NAMED_ARTS[id] ?? GENERIC_ART;
    return { ...named, duelBonus: EVOLVED_ART_DUEL_BONUS };
  }
  return null;
}

/** The prowess an officer's 器魂戰技 adds in single combat (0 if none). */
export function evolvedArtDuelBonus(o: Officer | undefined | null): number {
  return evolvedWeaponArt(o)?.duelBonus ?? 0;
}

/** The named art a specific weapon carries (for card display) — named for
 *  iconic arms, generic otherwise. Returns null for non-weapons. */
export function artForItem(itemId: string): EvolvedArt | null {
  if (ITEMS_BY_ID[itemId]?.kind !== 'weapon') return null;
  const named = NAMED_ARTS[itemId] ?? GENERIC_ART;
  return { ...named, duelBonus: EVOLVED_ART_DUEL_BONUS };
}
