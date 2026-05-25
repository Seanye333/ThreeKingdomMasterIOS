import type { BilingualName, EntityId } from './common';

/**
 * Foreign tribes sitting on the edges of the Han realm. They aren't full
 * forces with cities of their own — they are dormant pressure-sources that
 * periodically launch raids into specific border cities.
 */
export type TribeId =
  | 'nanban'   // 南蛮 — south (Meng Huo)
  | 'wuhuan'   // 烏桓 — north-east
  | 'xianbei'  // 鮮卑 — far north
  | 'qiang'   // 羌 — north-west
  | 'shanyue'; // 山越 — south-east mountains

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
}

export interface TribeState {
  /** Current aggression level for each tribe — drifts up over time, drops after a beating. */
  aggression: Record<TribeId, number>;
  /** Year of last raid by each tribe (for cooldown calculation). */
  lastRaidYear: Partial<Record<TribeId, number>>;
}
