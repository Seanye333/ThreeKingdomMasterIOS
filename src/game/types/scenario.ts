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
  /**
   * 這張盤的**前提人物** —— 史書上死了,而這張盤的假設正是「他沒有」。
   *
   * 為什麼需要它:事件的守衛問的是「此人還活著嗎」(`officer-alive` /
   * `officer-active`),而假想盤的前提**恰恰就是他還活著** —— 於是那條殺他的
   * 事件在這張盤上不但不會被擋,還是必然成立的。實測(3 輪全中):
   *
   *   關羽守住荊州   關羽第 1 旬死於「關羽,麥城死」
   *   若關羽威震華夏 關羽第 1–2 旬死於「白衣渡江」
   *   若周瑜不死     周瑜第 1–5 旬死於「周瑜歸天」
   *   若董卓未亡     董卓第 3–6 旬死於「呂布弒董」
   *   若孫策不死     孫策第 3–6 旬死於「孫策死於刺客」
   *   若郭嘉不死     郭嘉第 9–12 旬死於「郭嘉遺計定遼東」(窗口 207–208
   *                  正壓在開局年上)
   *
   * 也就是說這六張盤的賣點在開局頭幾旬就被自己的事件表取消掉了。
   *
   * 列在這裡的人,**任何會把他設成 dead 的歷史事件在這張盤上都不會演**
   * (見 `findFiringEventIn`)。不是攔效果 —— 攔效果會演出「關羽死於麥城」
   * 而人沒死,比不演更荒謬。整條讓路。
   *
   * 只寫**盤的前提**,不是「我想保誰不死」:能不能守住荊州、能不能贏赤壁,
   * 那是玩家的事,盤只負責讓那個假設在第 1 旬還站得住。
   */
  premiseOfficerIds?: EntityId[];
  /**
   * 這張盤**不演**的歷史事件 —— 因為它們已經在盤的前提裡演過了,或者被改寫了。
   *
   * `premiseOfficerIds` 只擋得住「殺前提人物」的那一類,而更常見的一類矛盾
   * 不死人:**盤會把它自己已經改寫掉的那一戰再演一次**。
   *
   *   曹操贏赤壁(208)   整套赤壁還會演一遍 —— 草船借箭、借東風、苦肉計、
   *                      龐統獻連環、火燒赤壁、華容道。而這張盤的前提是
   *                      「東南風終是不至,周郎殞於亂軍」。
   *   若袁紹勝官渡(201) 再演一次官渡與許攸夜獻烏巢 —— 那一仗的結果正是
   *                      這張盤的開局盤面。
   *   若呂布割據徐州(198) 「決泗沂之水灌下邳」,而前提是「泗水未潰下邳之牆」。
   *   若董卓未亡(192)   王允獻貂蟬、鳳儀亭 —— 連環計「事泄而敗」是前提。
   *
   * 不用 `flag-unset` 表達,是因為那要求每一條事件都預先寫好對應的旗標;
   * 這裡要的是**盤單方面宣告不演**,事件表不必知道有這回事。
   */
  blockedEventIds?: string[];
  cities: City[];
  forces: Force[];
  officers: Officer[];
}
