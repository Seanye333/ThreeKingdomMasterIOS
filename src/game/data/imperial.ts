import type { EdictDef, ImperialRankDef } from '../types';

export const IMPERIAL_RANKS: ImperialRankDef[] = [
  {
    id: 'commoner',
    name: { en: 'Commoner', zh: '庶民' },
    tier: 0,
    recruitBonus: 0,
    internalMultiplier: 1.0,
  },
  {
    id: 'marquis',
    name: { en: 'Marquis', zh: '侯' },
    tier: 1,
    recruitBonus: 0.05,
    internalMultiplier: 1.05,
    requirements: { minCities: 3 },
  },
  {
    id: 'duke',
    name: { en: 'Duke', zh: '公' },
    tier: 2,
    recruitBonus: 0.1,
    internalMultiplier: 1.1,
    requirements: { minCities: 10, requiresChancellor: true },
  },
  {
    id: 'king',
    name: { en: 'King', zh: '王' },
    tier: 3,
    recruitBonus: 0.15,
    internalMultiplier: 1.2,
    requirements: { minCities: 20, minYear: 215 },
  },
  {
    id: 'emperor',
    name: { en: 'Emperor', zh: '帝' },
    tier: 4,
    recruitBonus: 0.25,
    internalMultiplier: 1.35,
    requirements: { requiresEnthronement: true },
  },
];

export const IMPERIAL_RANKS_BY_ID: Record<string, ImperialRankDef> =
  Object.fromEntries(IMPERIAL_RANKS.map((r) => [r.id, r]));

export const EDICTS: EdictDef[] = [
  {
    kind: 'tax-amnesty',
    name: { en: 'Grand Amnesty', zh: '大赦' },
    description: '+10 loyalty in every city you own. Costs 1000 gold.',
    descriptionZh: "所轄各城民心+10。耗費黃金1000。",
    minRank: 'duke',
    goldCost: 1000,
    cooldownSeasons: 8,
  },
  {
    kind: 'denounce',
    name: { en: 'Denounce Rival', zh: '討伐令' },
    description: 'Publicly brand a rival a traitor. Damages their officer loyalty; you gain casus belli.',
    descriptionZh: "公開斥對手為叛賊。降低其麾下武將忠誠,並為己方取得開戰之名。",
    minRank: 'duke',
    goldCost: 500,
    cooldownSeasons: 4,
  },
  {
    kind: 'levy-tribute',
    name: { en: 'Levy Tribute', zh: '朝貢' },
    description: 'Demand tribute from a vassal or weaker force. Yields gold if they comply.',
    descriptionZh: "向附庸或弱小勢力索取貢品。若對方屈從則獲黃金。",
    minRank: 'king',
    goldCost: 200,
    cooldownSeasons: 4,
  },
  {
    kind: 'declare-vassal',
    name: { en: 'Bestow Vassalage', zh: '冊封' },
    description: 'Recognize a force as your vassal — establishes legal subordination.',
    descriptionZh: "冊封某勢力為附庸——確立其法理上之臣屬關係。",
    minRank: 'king',
    goldCost: 0,
    cooldownSeasons: 12,
  },
  {
    kind: 'enthronement',
    name: { en: 'Proclaim Emperor', zh: '即位' },
    description: 'Declare yourself Emperor. All non-vassal forces lose loyalty toward you. Permanent.',
    descriptionZh: "自立為帝。所有非附庸勢力對己方之忠誠皆下降。此舉永久不可逆轉。",
    minRank: 'king',
    goldCost: 5000,
    cooldownSeasons: 99,
  },
  {
    kind: 'era-change',
    name: { en: 'Change Era', zh: '改元' },
    description: 'Proclaim a new era. +5 loyalty in every city you own and all edict cooldowns reset.',
    descriptionZh: "宣告新元。所轄各城民心 +5，所有詔令冷卻清零。",
    minRank: 'emperor',
    goldCost: 2000,
    cooldownSeasons: 16,
  },
  {
    kind: 'reward-merit',
    name: { en: 'Reward Merit', zh: '賞功' },
    description: 'Honor the highest-deeds officer. They gain a court epithet and +15 loyalty.',
    descriptionZh: "下詔嘉勉武功榜首之將。賜稱號並 +15 忠誠。",
    minRank: 'duke',
    goldCost: 800,
    cooldownSeasons: 6,
  },
  {
    kind: 'call-for-talent',
    name: { en: 'Call for Talent', zh: '求賢令' },
    description: 'Open the court to wandering sages. Next-season recruit chance ×1.5 for your force.',
    descriptionZh: "廣納天下賢士。次季招攬機率 ×1.5。",
    minRank: 'marquis',
    goldCost: 600,
    cooldownSeasons: 6,
  },
  {
    kind: 'self-deprecation',
    name: { en: 'Edict of Self-Reproach', zh: '罪己詔' },
    description: 'Take public blame. Mandate −5; every city you own gains +15 loyalty.',
    descriptionZh: "下詔自責。天命 −5，所轄各城民心 +15。",
    minRank: 'duke',
    goldCost: 0,
    cooldownSeasons: 12,
  },
];

export const EDICTS_BY_KIND: Record<string, EdictDef> = Object.fromEntries(
  EDICTS.map((e) => [e.kind, e]),
);
