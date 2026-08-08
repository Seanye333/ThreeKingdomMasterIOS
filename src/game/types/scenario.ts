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
  /**
   * 開局外交 — relations this board starts with, applied after the global
   * 初始外交 mode (亂世死敵 / 群雄結盟) so a scenario can state its own facts.
   *
   * 為什麼需要它:黃巾之亂裡漢室、皇甫嵩軍、朱儁軍**是同一邊** —— 他們是朝廷
   * 的三路討賊軍,不是三個諸侯。沒有這張表,AI 會讓他們互相吃城:體檢腳本跑
   * 五輪,漢室從 39 城掉到 27,而朱儁從 12 長到 16,平黃巾的戰爭反而被稀釋掉。
   * 反董卓聯軍同理 —— 那是一個「聯軍」,開局卻誰都不認識誰。
   */
  openingRelations?: Array<{
    a: EntityId;
    b: EntityId;
    score: number;
    status: import('./diplomacy').RelationStatus;
    /**
     * 這一紙互不侵犯永不期滿。**預設會期滿**(見 `SCENARIO_NAP_SEASONS`)——
     * 局中簽的互不侵犯是八季,而劇本開局那些原本是永久的,沒有人是故意寫成
     * 這樣的:`rel()` 只是沒有帶期限這個欄位。後果是史書上撕得最快的那幾紙
     * 盟約在盤上撕不掉,官渡在 195/197 兩張盤都打不起來。
     *
     * 只有**確實不該期滿**的才設(如三路討賊軍那種同一邊的關係)。
     */
    permanent?: boolean;
  }>;
  cities: City[];
  forces: Force[];
  officers: Officer[];
}
