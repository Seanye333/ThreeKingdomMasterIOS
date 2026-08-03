import type { BilingualName, EntityId } from './common';

/**
 * Foreign tribes sitting on the edges of the Han realm. They aren't full
 * forces with cities of their own — they are dormant pressure-sources that
 * periodically launch raids into specific border cities.
 */
export type TribeId =
  | 'nanban'    // 南蠻 — south (Meng Huo)
  | 'wuhuan'    // 烏桓 — north-east
  | 'xianbei'   // 鮮卑 — far north
  | 'qiang'     // 羌 — north-west
  | 'shanyue'   // 山越 — south-east mountains
  // ── D-set additions ──
  | 'di'        // 氐 — north-west highlands, 白馬氐 / 楊千萬
  | 'xiongnu'   // 南匈奴 — 并州 residual, 於夫羅 → 呼廚泉
  | 'goguryeo'  // 高句麗 — Korean peninsula
  | 'buyeo'     // 扶餘 — Manchuria, north of Liaodong
  | 'linyi';    // 林邑 — Champa, south of 日南

export interface Tribe {
  id: TribeId;
  name: BilingualName;
  /** Lore — short description shown when raid event fires. */
  description: string;
  descriptionZh?: string;
  /** Color stripe used in raid notification. */
  color: string;
  /** Cities the tribe can raid (border cities adjacent to their lands). */
  raidableCityIds: EntityId[];
  /** Base aggression — chance per season of a raid (capped). */
  baseAggression: number;
  /** Strength multiplier on raid troop counts. */
  strengthMul: number;
  /** Real (lon, lat) of the tribe's homeland 部落 — a frontier site rendered
   *  on the strategic map, just beyond the Han cities they raid. */
  homeland: { lon: number; lat: number };
  /** The tribe's famous chieftain (officer id). A successful 征討 may win him
   *  over (招降) if he's still a free agent. Omitted = no named chief. */
  chieftainId?: string;
  /**
   * 立國之年 — the year this people first appears as an organised polity on the
   * frontier. Every board opens in game year 178 (see isLaterHanBoard), so this
   * cannot be checked against the calendar: it is compared against the BOARD's
   * era instead. Omitted = ancient, present on every board.
   *
   * Without it the Warring States board grows a Linyi state — a kingdom whose
   * own description says it was founded in 192 AD — some four centuries early.
   */
  foundedYear?: number;
}

export interface TribeState {
  /** Current aggression level for each tribe — drifts up over time, drops after a beating. */
  aggression: Record<TribeId, number>;
  /** Year of last raid by each tribe (for cooldown calculation). */
  lastRaidYear: Partial<Record<TribeId, number>>;
}
