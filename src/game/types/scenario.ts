import type { BilingualName, EntityId } from './common';
import type { City } from './city';
import type { Force } from './force';
import type { Officer } from './officer';
import type { GameDate } from './common';

export type ScenarioKind = 'historical' | 'whatif';

export interface Scenario {
  id: EntityId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** 'historical' (default) — a real moment in Three Kingdoms history.
   *  'whatif' — an alternate-timeline / fantasy scenario. */
  kind?: ScenarioKind;
  startDate: GameDate;
  /**
   * 天子所在 — where the Han emperor sits at start (`null` = no Han emperor on
   * this board). Omitted → derived from the start year (洛陽 → 長安 192+ →
   * 許都 196+, see scenarioEmperorCity); set it only to override history.
   */
  emperorCityId?: EntityId | null;
  cities: City[];
  forces: Force[];
  officers: Officer[];
}
