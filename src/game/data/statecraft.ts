import type { BilingualName } from '../types';
import type { Doctrine } from './officerAttributes';

/**
 * 治國理念 — the school of statecraft a realm adopts as its guiding ideology,
 * an axis above the individual 政策 (policies). Each school bends the realm's
 * character a different way and rewards officers whose 主義 (doctrine) aligns.
 * A realm picks one (or none → 雜糅, no slant). See systems/statecraft.ts.
 */
export type StatecraftSchool = 'legalist' | 'confucian' | 'daoist' | 'militarist';

export interface StatecraftDef {
  id: StatecraftSchool;
  name: BilingualName;
  /** One-line creed for the UI. */
  creed: BilingualName;
  /** Officer doctrines this school favours — matched officers grow loyal. */
  favoredDoctrines: Doctrine[];
  /** §7.9-deep J 學派相違 — doctrines this school alienates: their holders lose
   *  loyalty each season, and a deeply-aggrieved 名士 may quit in disgust. */
  opposedDoctrines: Doctrine[];
  /** §7.9-deep K 興學養士 — the stat an academy's 講學 drills officers toward. */
  trainStat: 'war' | 'leadership' | 'intelligence' | 'politics' | 'charisma';
  /** §7.9-deep L 國策大政 — the school's signature decree (mastery-gated). */
  decree: BilingualName;
  /** Per-season, per-owned-city effects (applied in tickStatecraft). */
  perCity: {
    /** Loyalty drift added to each owned city's 民心. */
    cityLoyalty: number;
    /** Gold the realm's discipline/tax efficiency adds (flat per city). */
    gold: number;
    /** Grain 休養生息 adds (flat per city). */
    food: number;
    /** 耕戰 conscript trickle added to each city's garrison. */
    troops: number;
    /** If set, lift a city below this loyalty toward it (嚴明法度 floor). */
    orderFloor?: number;
  };
  /** Recruit-success bonus the school's repute lends 访贤/劝降. */
  recruitBonus: number;
}

export const STATECRAFT: StatecraftDef[] = [
  {
    id: 'legalist',
    name: { zh: '法家', en: 'Legalism' },
    creed: { zh: '富國強兵・信賞必罰', en: 'Strong state, strict law, sure reward and punishment' },
    favoredDoctrines: ['hegemonic'],
    opposedDoctrines: ['royal', 'reclusion'],
    trainStat: 'politics',
    decree: { zh: '變法強國', en: 'Reform the State' },
    perCity: { cityLoyalty: 0, gold: 60, food: 0, troops: 0, orderFloor: 40 },
    recruitBonus: 0,
  },
  {
    id: 'confucian',
    name: { zh: '儒家', en: 'Confucianism' },
    creed: { zh: '仁政教化・以德服人', en: 'Benevolent rule, win hearts through virtue' },
    favoredDoctrines: ['royal', 'ritual'],
    opposedDoctrines: ['hegemonic', 'fame'],
    trainStat: 'charisma',
    decree: { zh: '興太學・舉孝廉', en: 'Found the Academy & Recommend the Worthy' },
    perCity: { cityLoyalty: 2, gold: 0, food: 0, troops: 0 },
    recruitBonus: 0.08,
  },
  {
    id: 'daoist',
    name: { zh: '道家(黃老)', en: 'Daoism (Huang-Lao)' },
    creed: { zh: '無為而治・與民休息', en: 'Rule by non-action, let the people rest' },
    favoredDoctrines: ['reclusion'],
    opposedDoctrines: ['hegemonic', 'ritual'],
    trainStat: 'intelligence',
    decree: { zh: '輕徭薄賦・與民休息', en: 'Lighten Levies, Let the People Rest' },
    perCity: { cityLoyalty: 1, gold: 0, food: 80, troops: 0 },
    recruitBonus: 0.03,
  },
  {
    id: 'militarist',
    name: { zh: '兵家', en: 'Militarism' },
    creed: { zh: '耕戰立國・以武為本', en: 'Build the state on farm and war' },
    favoredDoctrines: ['hegemonic'],
    opposedDoctrines: ['reclusion', 'royal'],
    trainStat: 'war',
    decree: { zh: '屯田耕戰', en: 'Military Colonies (Tuntian)' },
    perCity: { cityLoyalty: -1, gold: 0, food: 0, troops: 250 },
    recruitBonus: 0,
  },
];

/** §7.9-deep I 學派造詣 — mastery climbs while a school is held (faster with a
 *  屯學/書院); effects scale with it. */
export const STATECRAFT_MASTERY_MAX = 100;
/** Mastery a realm needs before it may enact the school's signature 大政. */
export const STATECRAFT_DECREE_THRESHOLD = 50;
/** Seasons between 大政 enactments. */
export const STATECRAFT_DECREE_COOLDOWN = 12;

/** §7.9-deep I — how strongly a school's effects land at a given mastery: a
 *  freshly-adopted creed runs at 40%, a fully-mastered one at full strength. */
export function statecraftScale(mastery: number | undefined): number {
  const m = Math.max(0, Math.min(STATECRAFT_MASTERY_MAX, mastery ?? 0));
  return 0.4 + 0.6 * (m / STATECRAFT_MASTERY_MAX);
}

export const STATECRAFT_BY_ID: Record<StatecraftSchool, StatecraftDef> =
  Object.fromEntries(STATECRAFT.map((s) => [s.id, s])) as Record<StatecraftSchool, StatecraftDef>;

export function statecraftById(id: StatecraftSchool | undefined | null): StatecraftDef | null {
  return id ? STATECRAFT_BY_ID[id] ?? null : null;
}
