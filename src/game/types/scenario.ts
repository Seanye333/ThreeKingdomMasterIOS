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
  cities: City[];
  forces: Force[];
  officers: Officer[];
}
