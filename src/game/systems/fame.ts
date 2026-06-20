import type { Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';

/**
 * 名聲榜 — a martial/rhetorical renown ladder built on the deeds the game already
 * tracks. Winning 單挑 and 舌戰 (and taking cities / captives) raises an officer's
 * 名望; crossing a tier draws ambitious NPC challengers who ride out to test the
 * famous — beat them for a bounty (and a chance at a bond). Pure functions, so it
 * stays easy to test and reuse.
 */

/** 名望 — weighted renown from an officer's deeds (duels & debates count most). */
export function renownFromDeeds(deeds: HeroicDeeds | undefined): number {
  if (!deeds) return 0;
  return Math.round(
    (deeds.duelsWon ?? 0) * 5 +
    (deeds.debatesWon ?? 0) * 4 +
    (deeds.captured ?? 0) * 6 +
    (deeds.citiesTaken ?? 0) * 8 +
    (deeds.battlesWon ?? 0) * 3 +
    (deeds.killsTroops ?? 0) * 0.01 +
    (deeds.titles?.length ?? 0) * 10,
  );
}

export interface FameTier { id: string; zh: string; en: string; min: number; }

// Ascending; the highest tier whose `min` is ≤ renown wins.
export const FAME_TIERS: FameTier[] = [
  { id: 'unknown',   zh: '無名',     en: 'Unknown',    min: 0 },
  { id: 'rising',    zh: '嶄露頭角', en: 'Rising',     min: 20 },
  { id: 'known',     zh: '小有名氣', en: 'Known',      min: 50 },
  { id: 'renowned',  zh: '名將',     en: 'Renowned',   min: 100 },
  { id: 'formidable',zh: '威震一方', en: 'Formidable', min: 200 },
  { id: 'legendary', zh: '天下聞名', en: 'Legendary',  min: 400 },
];

export function fameTier(renown: number): FameTier {
  let cur = FAME_TIERS[0];
  for (const tier of FAME_TIERS) if (renown >= tier.min) cur = tier;
  return cur;
}

/** Renown needed to reach the next tier, or null at the top. */
export function nextTierThreshold(renown: number): number | null {
  for (const tier of FAME_TIERS) if (renown < tier.min) return tier.min;
  return null;
}

/**
 * 名望牌 — a gold/silver/bronze medal for an officer's earned renown (their
 * battlefield/rhetorical deeds, via renownFromDeeds). Distinct from 品階, which
 * reflects raw ability: a 名望牌 must be *won* through famous deeds. Returns
 * null below the 銅牌 threshold so unremarkable officers carry no medal.
 */
export type FameMedalTier = 'gold' | 'silver' | 'bronze';
export interface FameMedal {
  tier: FameMedalTier;
  glyph: string;
  name: { zh: string; en: string };
  color: string;
}

export function fameMedal(renown: number): FameMedal | null {
  if (renown >= 200) return { tier: 'gold',   glyph: '🥇', name: { zh: '金牌名將', en: 'Gold' },   color: '#e6c473' };
  if (renown >= 100) return { tier: 'silver', glyph: '🥈', name: { zh: '銀牌宿將', en: 'Silver' }, color: '#cfd8e0' };
  if (renown >= 50)  return { tier: 'bronze', glyph: '🥉', name: { zh: '銅牌健兒', en: 'Bronze' }, color: '#c8884e' };
  return null;
}

export interface Challenger {
  challengerId: string;
  kind: 'duel' | 'debate';
  /** Gold bounty for besting the challenger. */
  bounty: number;
  lineZh: string;
  lineEn: string;
}

/**
 * 踢館 — once an officer is renowned enough, an ambitious outsider may ride out to
 * challenge them. `candidates` are officers NOT in the player's force; we pick one
 * whose strength makes a fair test (a duel for a warrior, a 舌戰 for a strategist).
 * Returns null when no one bites (low renown, no suitable candidate, or rng).
 */
export function rollChallenger(
  champion: Officer,
  renown: number,
  candidates: Officer[],
  rng: () => number = Math.random,
): Challenger | null {
  const tier = fameTier(renown);
  // Below 'known' nobody bothers seeking you out.
  if (tier.min < 50) return null;
  // The more famous, the likelier a challenger appears.
  const chance = Math.min(0.6, 0.15 + (renown - 50) / 600);
  if (rng() >= chance) return null;

  // A strategist (高智) draws debaters; a warrior (高武) draws duelists.
  const kind: 'duel' | 'debate' = champion.stats.war >= champion.stats.intelligence ? 'duel' : 'debate';
  const key = kind === 'duel' ? 'war' as const : 'intelligence' as const;
  const pool = candidates
    .filter((o) => o.status !== 'dead' && o.status !== 'imprisoned')
    // Within ~18 points of the champion's relevant stat — a worthy test.
    .filter((o) => Math.abs(o.stats[key] - champion.stats[key]) <= 18)
    .sort((a, b) => b.stats[key] - a.stats[key]);
  if (pool.length === 0) return null;
  const challenger = pool[Math.floor(rng() * Math.min(pool.length, 5))];
  const bounty = Math.round(200 + tier.min * 2);
  return kind === 'duel'
    ? { challengerId: challenger.id, kind, bounty, lineZh: `久聞${champion.name.zh}武名,特來討教!`, lineEn: `Your name precedes you — face me in single combat!` }
    : { challengerId: challenger.id, kind, bounty, lineZh: `${champion.name.zh}之才,我倒要當面領教!`, lineEn: `They say you have a silver tongue — let us put it to the test!` };
}
