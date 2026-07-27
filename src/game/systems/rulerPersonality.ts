/**
 * 君主性格 — force-level AI personality knobs.
 *
 * RulerPersonalityDef already carries marchWeight/diplomacyWeight/etc., but those
 * were largely unplugged. These small, bounded multipliers give the 8 personalities
 * a visibly distinct strategic temperament without touching save state (all are
 * read-only lookups keyed off `force.personality`, defaulting to 'opportunist').
 */
import type { RulerPersonality } from '../types';

/** Multiplier on a force's attack-feasibility threshold — higher = attacks on
 *  thinner margins (more aggressive); lower = only very safe strikes. */
export const PERSONALITY_ATTACK_MUL: Record<RulerPersonality, number> = {
  aggressive: 1.25,
  tyrant: 1.35,
  expansionist: 1.15,
  opportunist: 1.10,
  scholar: 0.90,
  hesitant: 0.85,
  defensive: 0.75,
  cautious: 0.65,
};

/** Appetite for seeking diplomacy (NAP/alliance). >1 = courts peace readily;
 *  <1 = scorns it (warmongers). */
export const PERSONALITY_DIPLOMACY_APPETITE: Record<RulerPersonality, number> = {
  cautious: 1.4,
  defensive: 1.3,
  opportunist: 1.2,
  hesitant: 1.1,
  scholar: 1.0,
  expansionist: 0.6,
  aggressive: 0.5,
  tyrant: 0.3,
};

/**
 * 品性之名 — the label and the tell, for the screen. The eight temperaments
 * decide whether a neighbour strikes at thin margins or courts peace, and the
 * player negotiated with them blind: `force.personality` was read in 34 places
 * in the engine and drawn in none. The tell quotes the two multipliers above
 * in words, so "who dares attack me" is readable off the diplomacy list.
 */
export const PERSONALITY_LABEL: Record<RulerPersonality, { zh: string; en: string; tellZh: string; tellEn: string }> = {
  aggressive:   { zh: '攻擊', en: 'Aggressive',   tellZh: '好戰,薄利亦攻',       tellEn: 'strikes on thin margins' },
  tyrant:       { zh: '暴虐', en: 'Tyrant',       tellZh: '暴虐,幾不與人議和',   tellEn: 'brutal; scorns diplomacy' },
  expansionist: { zh: '擴張', en: 'Expansionist', tellZh: '好開疆,兵力常分散',   tellEn: 'expands fast, spreads thin' },
  opportunist:  { zh: '機會', en: 'Opportunist',  tellZh: '伺隙而動,見弱則噬',   tellEn: 'strikes at weakness' },
  scholar:      { zh: '學者', en: 'Scholar',      tellZh: '重內政,不輕啟釁',     tellEn: 'builds rather than fights' },
  hesitant:     { zh: '慎重', en: 'Hesitant',     tellZh: '遲疑,出兵每失其時',   tellEn: 'slow to commit' },
  defensive:    { zh: '守勢', en: 'Defensive',    tellZh: '守成,樂於結好',       tellEn: 'holds ground, courts peace' },
  cautious:     { zh: '守備', en: 'Cautious',     tellZh: '極慎,非萬全不動',     tellEn: 'moves only when certain' },
};

export function personalityLabel(p: RulerPersonality | undefined) {
  return PERSONALITY_LABEL[p ?? 'opportunist'];
}

export function personalityAttackMul(p: RulerPersonality | undefined): number {
  return PERSONALITY_ATTACK_MUL[p ?? 'opportunist'] ?? 1.0;
}

export function personalityDiplomacyAppetite(p: RulerPersonality | undefined): number {
  return PERSONALITY_DIPLOMACY_APPETITE[p ?? 'opportunist'] ?? 1.0;
}
