import type { HeroicDeeds } from '../types/deeds';
import type { Officer } from '../types';

/**
 * 歷戰勳章 — deed-ledger milestones minted into permanent, tiny stat gains
 * (+1, clamped at 150) and a medal wall on the card's career face. One tier
 * each, granted automatically at season commit for EVERY living officer
 * (AI included — symmetric), so a life of pursuits literally shapes the man.
 */
export interface MedalDef {
  id: string;
  name: { zh: string; en: string };
  descriptionZh: string;
  description: string;
  deed: keyof Omit<HeroicDeeds, 'officerId' | 'titles'>;
  threshold: number;
  stat: keyof Officer['stats'];
}

export const MEDALS: MedalDef[] = [
  { id: 'medal-slayer', name: { zh: '萬人屠', en: 'Slayer of Hosts' }, deed: 'killsTroops', threshold: 50000,
    descriptionZh: '累斬敵軍五萬 — 武力 +1', description: '50,000 foes cut down — War +1.', stat: 'war' },
  { id: 'medal-duelist', name: { zh: '鬥將', en: 'Duelist' }, deed: 'duelsWon', threshold: 10,
    descriptionZh: '單挑十勝 — 武力 +1', description: 'Ten duels won — War +1.', stat: 'war' },
  { id: 'medal-conqueror', name: { zh: '拔城將', en: 'City-Taker' }, deed: 'citiesTaken', threshold: 5,
    descriptionZh: '親拔五城 — 統率 +1', description: 'Five cities taken — Leadership +1.', stat: 'leadership' },
  { id: 'medal-veteran', name: { zh: '百戰宿將', en: 'Hundred-Battle Veteran' }, deed: 'battlesWon', threshold: 20,
    descriptionZh: '會戰二十勝 — 統率 +1', description: 'Twenty battles won — Leadership +1.', stat: 'leadership' },
  { id: 'medal-orator', name: { zh: '舌燦蓮花', en: 'Silver Tongue' }, deed: 'debatesWon', threshold: 15,
    descriptionZh: '舌戰十五勝 — 魅力 +1', description: 'Fifteen debates won — Charisma +1.', stat: 'charisma' },
  { id: 'medal-shadow', name: { zh: '暗棋', en: 'Hidden Piece' }, deed: 'espionageSuccess', threshold: 10,
    descriptionZh: '用間十成 — 智力 +1', description: 'Ten missions of shadow-work — Intelligence +1.', stat: 'intelligence' },
  { id: 'medal-steward', name: { zh: '能吏', en: 'Able Steward' }, deed: 'civicWorks', threshold: 30,
    descriptionZh: '政績三十件 — 政治 +1', description: 'Thirty works of governance — Politics +1.', stat: 'politics' },
  { id: 'medal-warden', name: { zh: '擒龍手', en: 'Taker of Captives' }, deed: 'captured', threshold: 8,
    descriptionZh: '陣擒八將 — 武力 +1', description: 'Eight officers taken alive — War +1.', stat: 'war' },
];

export const MEDALS_BY_ID: Record<string, MedalDef> = Object.fromEntries(MEDALS.map((m) => [m.id, m]));

/** Medals this officer has EARNED but not yet been granted. Pure. */
export function dueMedals(officer: Officer, deeds: HeroicDeeds | undefined): MedalDef[] {
  if (!deeds) return [];
  const have = new Set(officer.medals ?? []);
  return MEDALS.filter((m) => !have.has(m.id) && ((deeds[m.deed] as number | undefined) ?? 0) >= m.threshold);
}

/** Grant a batch of medals immutably: records + the +1 stat each (cap 150). */
export function grantMedals(officer: Officer, medals: MedalDef[]): Officer {
  if (medals.length === 0) return officer;
  const stats = { ...officer.stats };
  for (const m of medals) stats[m.stat] = Math.min(150, stats[m.stat] + 1);
  return { ...officer, stats, medals: [...(officer.medals ?? []), ...medals.map((m) => m.id)] };
}
