import type { BilingualName, EntityId } from './common';

/**
 * Province IDs follow the nine ancient Han provinces (九州) plus a few
 * minor ones added during the late Han / Three Kingdoms (Yi was split off
 * from Liang, etc).
 */
export type ProvinceId =
  | 'sili'      // 司隷 — capital region (Luoyang, Chang'an)
  | 'yu'        // 豫州 — central plain
  | 'ji'        // 冀州 — north (Yuan Shao's base)
  | 'qing'      // 青州 — east coast
  | 'yan'       // 兗州 — Cao Cao's early base
  | 'xu'        // 徐州 — east (Tao Qian, Lü Bu, Liu Bei)
  | 'yang'      // 揚州 — south (Sun family)
  | 'jing'      // 荊州 — central south (Liu Biao)
  | 'liang'     // 涼州 — northwest (Ma family)
  | 'bing'      // 并州 — north (Lü Bu's birthplace)
  | 'you'       // 幽州 — far north (Gongsun Zan)
  | 'yi'        // 益州 — Shu (Liu Yan, Liu Zhang, Liu Bei)
  | 'jiao';     // 交州 — far south (Shi Xie)

export interface Province {
  id: ProvinceId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Color stripe used for province overlays. */
  color: string;
  /** City IDs that belong to this province. */
  cityIds: EntityId[];
}

/**
 * Trade route between two cities in the same province (or via a shared
 * border). Each route generates a small per-season income for both ends
 * if both are owned by the same force OR by allied forces.
 */
export interface TradeRoute {
  id: EntityId;
  cityAId: EntityId;
  cityBId: EntityId;
  /** Gold per season produced (already net of any war/banditry throttle). */
  baseIncome: number;
  /** 兵燹/盜匪 — a war-soured neighbour or a lawless district is skimming this
   *  road's takings this season (income already reduced). Default/omitted = safe. */
  threatened?: boolean;
}
