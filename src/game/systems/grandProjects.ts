/**
 * 大工 — the multi-year public works (§1.15).
 *
 * 都江堰 took years and made 蜀 a granary for eight centuries. 鄭國渠 was begun
 * as a plot to exhaust 秦's manpower and ended up feeding the army that
 * conquered the world. The 馳道 and the walls were the same bargain in a
 * harsher form: a decade of drafted labour for something no season of ordinary
 * administration could ever buy.
 *
 * That bargain is what this file adds, and it is the reason 重役 (§1.12) exists:
 * heavy corvée wrecks your loyalty, your harvest and your tax registers — and it
 * is the only way to raise a great work before the war reaches you. A project
 * is a bet that you will still be standing when it finishes.
 *
 * Pure: the store holds `grandProjects`; this file defines them, prices them,
 * advances them, and says what they leave behind.
 */

import type { EntityId } from '../types';
import type { CorveeLevel } from './household';

export type GrandProjectId = 'great-weir' | 'grand-canal' | 'long-wall' | 'imperial-road';

export interface GrandProjectDef {
  id: GrandProjectId;
  name: { zh: string; en: string };
  /** Historical anchor, shown in the panel. */
  flavourZh: string;
  flavourEn: string;
  /** Gold paid up front. */
  goldCost: number;
  /** Seasons of work at 息役 (no levy). Corvée cuts this — see projectSeasons. */
  baseSeasons: number;
  /** Loyalty paid in the host city each season the work is under way. */
  loyaltyPerSeason: number;
  effectZh: string;
  effectEn: string;
}

export const GRAND_PROJECTS: GrandProjectDef[] = [
  {
    id: 'great-weir',
    name: { zh: '大堰', en: 'Great Weir' },
    flavourZh: '都江堰之制 —— 分水以灌,水旱從人,不知饑饉。',
    flavourEn: 'After 都江堰: split the river, and flood and drought alike bow to the plough.',
    goldCost: 3200,
    baseSeasons: 12,
    loyaltyPerSeason: -1,
    effectZh: '本城及所有鄰城 農業 +30、治水之功 +3(近乎免疫水患)',
    effectEn: 'This city and every neighbour: agriculture +30, flood works +3 (near-immune to floods)',
  },
  {
    id: 'grand-canal',
    name: { zh: '運渠', en: 'Grand Canal' },
    flavourZh: '鑿渠通漕 —— 千里饋糧,不待車轅。',
    flavourEn: 'Cut a canal and grain moves a thousand li without a cart.',
    goldCost: 3800,
    baseSeasons: 14,
    loyaltyPerSeason: -1,
    effectZh: '本城及鄰城 商業 +25;全境輜重折損 −30%(漕運之利)',
    effectEn: 'This city and neighbours: commerce +25; realm-wide convoy losses −30%',
  },
  {
    id: 'long-wall',
    name: { zh: '長城', en: 'Long Wall' },
    flavourZh: '因邊山險,築長城 —— 胡馬不敢南牧。',
    flavourEn: 'Raise a wall along the frontier hills, and the horsemen graze elsewhere.',
    goldCost: 4200,
    baseSeasons: 16,
    loyaltyPerSeason: -2,
    effectZh: '本城及鄰城 守備 +25;異族寇邊機率大減',
    effectEn: 'This city and neighbours: defense +25; far fewer tribal raids',
  },
  {
    id: 'imperial-road',
    name: { zh: '馳道', en: 'Imperial Road' },
    flavourZh: '為馳道於天下 —— 道廣五十步,三丈而樹。',
    flavourEn: 'A post road across the realm: fifty paces wide, a tree every three zhang.',
    goldCost: 2800,
    baseSeasons: 10,
    loyaltyPerSeason: -1,
    effectZh: '全境行軍與輜重各快一分(行軍疲勞 −25%、輜重折損 −20%)',
    effectEn: 'Realm-wide: march fatigue −25%, convoy losses −20%',
  },
];

export const PROJECTS_BY_ID: Record<GrandProjectId, GrandProjectDef> =
  Object.fromEntries(GRAND_PROJECTS.map((p) => [p.id, p])) as Record<GrandProjectId, GrandProjectDef>;

export interface GrandProject {
  id: GrandProjectId;
  cityId: EntityId;
  forceId: EntityId;
  /** Seasons of work still owed. */
  seasonsLeft: number;
  /** Year begun — for the annals line. */
  startedYear: number;
  /** Set when the work is finished and its effects have been applied. */
  done?: boolean;
}

/**
 * 役夫幾何 — how fast the work actually goes. Drafted labour is the whole
 * point: 重役 nearly halves the calendar, 息役 means it creeps along on paid
 * hands. Hidden households cannot be conscripted (they answer to a great
 * house, not to you), so a realm whose registers have rotted builds slower —
 * the §1.12 loop closing from the other side.
 */
export function projectSeasonProgress(args: {
  corvee: CorveeLevel | undefined;
  /** Percent of the host city off the registers (§1.12). */
  hiddenPercent?: number;
}): number {
  const levy = args.corvee === 'heavy' ? 2.2 : args.corvee === 'light' ? 1.4 : 1;
  const registers = 1 - Math.min(0.35, (args.hiddenPercent ?? 0) / 100 * 0.8);
  return Math.round(levy * registers * 100) / 100;
}

/** Seasons remaining at the current levy, for the UI's estimate. */
export function projectEta(seasonsLeft: number, progressPerSeason: number): number {
  return Math.max(1, Math.ceil(seasonsLeft / Math.max(0.2, progressPerSeason)));
}

/** 一國一大工 — a realm raises one great work at a time. Everything else is a building. */
export function canStartProject(
  projects: ReadonlyArray<GrandProject>,
  forceId: EntityId,
  id: GrandProjectId,
): { ok: boolean; reasonZh?: string; reasonEn?: string } {
  if (projects.some((p) => p.forceId === forceId && !p.done)) {
    return { ok: false, reasonZh: '國中已有大工在興,不可並舉。', reasonEn: 'A great work is already under way.' };
  }
  if (projects.some((p) => p.forceId === forceId && p.done && p.id === id)) {
    return { ok: false, reasonZh: '此工已成,無須再築。', reasonEn: 'That work already stands.' };
  }
  return { ok: true };
}

/** Realm-wide multipliers granted by the works a force has finished. */
export function projectRealmEffects(
  projects: ReadonlyArray<GrandProject>,
  forceId: EntityId,
): { convoyLossMul: number; marchFatigueMul: number; tribeRaidMul: number } {
  const done = new Set(projects.filter((p) => p.forceId === forceId && p.done).map((p) => p.id));
  return {
    convoyLossMul: (done.has('grand-canal') ? 0.7 : 1) * (done.has('imperial-road') ? 0.8 : 1),
    marchFatigueMul: done.has('imperial-road') ? 0.75 : 1,
    tribeRaidMul: done.has('long-wall') ? 0.55 : 1,
  };
}

/** The permanent city grants a finished work leaves on its host and neighbours. */
export function projectCityGrants(id: GrandProjectId): {
  self: { agriculture?: number; commerce?: number; defense?: number; floodWorks?: number };
  neighbour: { agriculture?: number; commerce?: number; defense?: number; floodWorks?: number };
} {
  switch (id) {
    case 'great-weir':
      return {
        self: { agriculture: 30, floodWorks: 3 },
        neighbour: { agriculture: 30, floodWorks: 3 },
      };
    case 'grand-canal':
      return { self: { commerce: 25 }, neighbour: { commerce: 25 } };
    case 'long-wall':
      return { self: { defense: 25 }, neighbour: { defense: 25 } };
    case 'imperial-road':
    default:
      return { self: {}, neighbour: {} };
  }
}
