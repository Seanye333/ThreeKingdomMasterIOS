import type { BilingualName } from './common';

/**
 * 異域遠邦 — distant lands beyond the Han frontier that a 遠使 (long-range
 * embassy) can reach, all historically attested in the late-Han / Three
 * Kingdoms era: the Silk Road oasis states of the 西域 (Cao Wei's 戊己校尉 kept
 * them in hand), the eastern seas (倭's 卑彌呼 received the 親魏倭王 seal from Wei
 * in 238, the 三韓), the southern reaches (扶南, reached by Sun Quan's envoys 朱應
 * and 康泰), and the truly far west (大秦/Rome, whose embassy reached Han in 166;
 * 天竺; 安息/Parthia).
 *
 * These are NOT cities on the playable map — they're abstract off-map
 * destinations reached via the expedition machinery (a lone officer rides out
 * and, if he survives, rides home with what he found). Border 異族 (tribes) are
 * embassy targets too, but they reuse the existing tribes.ts data.
 */
export type RealmRegion =
  | 'xiyu' // 西域 — Silk Road oasis states
  | 'dongyi' // 東夷海外 — Korea & the isles of Wa
  | 'nanhai' // 南方海外 — the southern seas
  | 'jiyuan'; // 極遠 — Rome, India, Parthia

/** A reward roll's range [min, max]; the resolver picks within it. */
export type Range = [number, number];

export interface RealmReward {
  /** 通商 — coin/grain tribute hauled home. */
  gold?: Range;
  food?: Range;
  /** 奇珍 — exotic item ids (one is rolled if the errand goes well). */
  itemIds?: string[];
  /** 異域兵種 — auxiliaries (象兵/突騎/汗血騎) delivered to the home city. */
  auxTroops?: Range;
  /** 邦交 — prestige/天命 gained (e.g. 受封親魏倭王). */
  prestige?: number;
}

export interface ForeignRealm {
  id: string;
  name: BilingualName;
  region: RealmRegion;
  /** Short flavour shown in the picker / report. */
  blurb: string;
  blurbZh: string;
  /** Real (lon, lat) of the realm — used for a far-flung map marker and to
   *  hint the journey's length. */
  homeland: { lon: number; lat: number };
  /** Seasons one leg of the journey takes for an average envoy (long: the
   *  far west runs a year-plus each way). Scaled by the officer's pace. */
  baseSeasons: number;
  /** 0–1 base peril — the desert/sea/bandits that can cost the envoy his
   *  haul, his health, or (for the farthest) his life. Tempered by his skill. */
  danger: number;
  /** Earliest year the realm will receive an embassy (historical gating;
   *  omitted = always reachable). */
  minYear?: number;
  reward: RealmReward;
}
