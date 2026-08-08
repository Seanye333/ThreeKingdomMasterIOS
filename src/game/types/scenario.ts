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
  /**
   * 這張盤要演哪幾條**戰役專屬**事件鏈 —— 開局就種進 `state.eventFlags`。
   *
   * 為什麼需要它:事件只有年份窗口,而**同一條外傳線的盤共用一個曆法軸**
   * (戰國/楚漢/隋唐一律 `startDate.year = 178`)。於是大澤鄉起義那張盤會把
   * 垓下之戰、濰水之戰整套演一遍,而且順序是亂的 —— 十面埋伏演在魚腹丹書
   * 之前。年份錯不開:垓下那條鏈要在垓下盤上**早早**演,在大澤鄉盤上**很晚**
   * 演,同一個窗口做不到兩件事。
   *
   * 所以改由盤自己宣告。鏈上每一條事件都 `requires: flag-set`,不只開頭那條
   * —— 開頭鎖住而後續不鎖,等於留了一條可以從中間插進來的路。
   */
  eventFlags?: string[];
  cities: City[];
  forces: Force[];
  officers: Officer[];
}
