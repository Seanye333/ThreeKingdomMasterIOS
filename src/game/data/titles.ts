import type { CivicTitle, MilitaryRank } from '../types';

export const MILITARY_RANKS: MilitaryRank[] = [
  {
    id: 'soldier',
    name: { en: 'Soldier', zh: '兵卒' },
    tier: 0,
    loyaltyBonus: 0,
    troopCapMultiplier: 1.0,
    stipend: 0,
    minStat: 0,
  },
  {
    id: 'captain',
    name: { en: 'Captain', zh: '都尉' },
    tier: 1,
    loyaltyBonus: 1,
    troopCapMultiplier: 1.0,
    stipend: 50,
    minStat: 50,
  },
  {
    id: 'colonel',
    name: { en: 'Colonel', zh: '校尉' },
    tier: 2,
    loyaltyBonus: 2,
    troopCapMultiplier: 1.1,
    stipend: 100,
    minStat: 60,
  },
  {
    id: 'lt-general',
    name: { en: 'Lt. General', zh: '偏将軍' },
    tier: 3,
    loyaltyBonus: 3,
    troopCapMultiplier: 1.15,
    stipend: 200,
    minStat: 70,
  },
  {
    id: 'general',
    name: { en: 'General', zh: '将軍' },
    tier: 4,
    loyaltyBonus: 4,
    troopCapMultiplier: 1.25,
    stipend: 350,
    minStat: 80,
  },
  {
    id: 'grand-general',
    name: { en: 'Grand General', zh: '大将軍' },
    tier: 5,
    loyaltyBonus: 6,
    troopCapMultiplier: 1.4,
    stipend: 600,
    minStat: 90,
  },
  {
    id: 'chancellor',
    name: { en: 'Chancellor', zh: '丞相' },
    tier: 6,
    loyaltyBonus: 8,
    troopCapMultiplier: 1.5,
    stipend: 1000,
    minStat: 95,
  },
];

export const MILITARY_RANKS_BY_ID: Record<string, MilitaryRank> =
  Object.fromEntries(MILITARY_RANKS.map((r) => [r.id, r]));

export const CIVIC_TITLES: CivicTitle[] = [
  {
    id: 'prefect',
    name: { en: 'Prefect', zh: '太守' },
    description:
      'Governor of a single city. Boosts internal-affairs effects in their seat and +3 loyalty aura.',
    descriptionZh: "一城之長。提升所在城池之內政效果,並有+3忠誠光環。",
    uniquePerForce: false,
    primaryStat: 'politics',
    forceBonus: { internalMultiplier: 1.15 },
  },
  {
    id: 'strategist',
    name: { en: 'Strategist', zh: '軍師' },
    description:
      'Chief strategist of the force. +10% army power and helps in stratagems.',
    descriptionZh: "勢力首席軍師。軍力+10%,並助謀略之施行。",
    uniquePerForce: true,
    primaryStat: 'intelligence',
    forceBonus: { powerMultiplier: 1.1 },
  },
  {
    id: 'chancellor',
    name: { en: 'Chancellor', zh: '丞相' },
    description:
      'Head of the civil and military government. All internal-affairs effects ×1.25 and +15% recruit chance.',
    uniquePerForce: true,
    primaryStat: 'politics',
    forceBonus: { internalMultiplier: 1.25, recruitBonus: 0.15 },
  },
  {
    id: 'inspector',
    name: { en: 'Inspector', zh: '刺史' },
    description: 'Inspector general. +10% recruit chance, +1 loyalty aura everywhere.',
    descriptionZh: "監察使。+10%招攬機率,各城+1忠誠光環。",
    uniquePerForce: true,
    primaryStat: 'politics',
    forceBonus: { recruitBonus: 0.1 },
  },
  {
    id: 'minister',
    name: { en: 'Minister', zh: '司徒' },
    description: 'Senior civil minister. +15% internal-affairs effect.',
    descriptionZh: "高位文臣。內政效果+15%。",
    uniquePerForce: true,
    primaryStat: 'politics',
    forceBonus: { internalMultiplier: 1.15 },
  },
];

export const CIVIC_TITLES_BY_ID: Record<string, CivicTitle> = Object.fromEntries(
  CIVIC_TITLES.map((t) => [t.id, t]),
);
