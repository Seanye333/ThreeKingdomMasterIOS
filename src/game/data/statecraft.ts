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
    perCity: { cityLoyalty: 0, gold: 60, food: 0, troops: 0, orderFloor: 40 },
    recruitBonus: 0,
  },
  {
    id: 'confucian',
    name: { zh: '儒家', en: 'Confucianism' },
    creed: { zh: '仁政教化・以德服人', en: 'Benevolent rule, win hearts through virtue' },
    favoredDoctrines: ['royal', 'ritual'],
    perCity: { cityLoyalty: 2, gold: 0, food: 0, troops: 0 },
    recruitBonus: 0.08,
  },
  {
    id: 'daoist',
    name: { zh: '道家(黃老)', en: 'Daoism (Huang-Lao)' },
    creed: { zh: '無為而治・與民休息', en: 'Rule by non-action, let the people rest' },
    favoredDoctrines: ['reclusion'],
    perCity: { cityLoyalty: 1, gold: 0, food: 80, troops: 0 },
    recruitBonus: 0.03,
  },
  {
    id: 'militarist',
    name: { zh: '兵家', en: 'Militarism' },
    creed: { zh: '耕戰立國・以武為本', en: 'Build the state on farm and war' },
    favoredDoctrines: ['hegemonic'],
    perCity: { cityLoyalty: -1, gold: 0, food: 0, troops: 250 },
    recruitBonus: 0,
  },
];

export const STATECRAFT_BY_ID: Record<StatecraftSchool, StatecraftDef> =
  Object.fromEntries(STATECRAFT.map((s) => [s.id, s])) as Record<StatecraftSchool, StatecraftDef>;

export function statecraftById(id: StatecraftSchool | undefined | null): StatecraftDef | null {
  return id ? STATECRAFT_BY_ID[id] ?? null : null;
}
