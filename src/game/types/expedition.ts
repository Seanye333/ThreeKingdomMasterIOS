import type { EntityId } from './common';

/**
 * 游历 — a single officer sent out from his city to roam, NOT an army on the
 * march. He travels alone to a target city, does his errand there, and (if he
 * isn't killed or taken) rides home with whatever he found. Models like a
 * convoy (see systems/convoy.ts): off the rosters while away, back on arrival.
 */
export type ExpeditionMode =
  | 'explore' // 探索 — any city: intel + a chance at a hidden talent, a 奇遇 windfall, or local goodwill
  | 'envoy' // 出使 — foreign force: warm relations with that power
  | 'subvert' // 策反 — foreign force: try to turn one of its officers to your side
  | 'infiltrate' // 刺探 — foreign force: deep intel + a chance to sabotage; risk of capture
  | 'embassy' // 遠使異域 — a long journey to a distant land / border tribe (see foreignRealm.ts)
  | 'recruit' // 訪賢 — 三顧茅廬: court a specific known wanderer (legends need repeated visits)
  | 'tour' // 巡視 — tour one of YOUR cities: lift its loyalty + sniff out disaffection
  | 'befriend' // 結交 — befriend a rival's officer: warm them toward you (eases a later turn)
  | 'levy' // 募兵 — raise a body of troops from a far/frontier city, brought home
  | 'treasure' // 尋寶 — 訪古探幽: hunt an old battlefield / tomb / holy peak for 神兵寶馬 (real peril)
  | 'study' // 游學 — 訪師問道: study at a famed academy/master — the officer grows in skill
  | 'incognito'; // 微服 — 明察暗訪: travel in disguise to hear the ground truth (own land or a rival's)

/** Outbound to the target, or homeward after the errand is done. */
export type ExpeditionPhase = 'outbound' | 'returning';

/**
 * 收获 — what the roaming officer is carrying home, banked at the destination
 * and delivered when he arrives back at `fromCityId`. Effects that act on the
 * TARGET (intel lit, relations warmed, a city sabotaged) are applied the moment
 * he reaches it (outbound complete); only the things he physically brings back
 * wait for the homecoming.
 */
export interface ExpeditionHaul {
  /** Coin/grain hauled home into the origin city. */
  gold?: number;
  food?: number;
  /** 奇物 — an item id picked up, handed to the officer on return. */
  itemId?: EntityId;
  /** 攜才歸 — a talent found (探索) or an officer turned (策反) who joins the
   *  dispatcher's force at the home city on arrival. */
  recruitOfficerId?: EntityId;
  /** 民心 — goodwill brought home: loyalty added to the origin city. */
  homeLoyaltyDelta?: number;
  /** 異域兵種 — auxiliaries (象兵/突騎/汗血騎) added to the home city's garrison. */
  auxTroops?: number;
  /** 邦交 — prestige/天命 the dispatching force gains on the envoy's return. */
  prestige?: number;
  /** 風霜 — the long road battered the envoy; he returns wounded. */
  wounded?: boolean;
  /** 歷練所得 — a stat the journey honed (游學/劍客奇遇, §7.6-2): applied to the
   *  officer on homecoming. */
  statGain?: { stat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma'; amount: number };
  /** One-line summary of what was found, for the homecoming report. */
  note?: string;
  noteZh?: string;
}

export interface Expedition {
  id: EntityId;
  /** The roaming officer (off the city rosters until he returns). */
  officerId: EntityId;
  /** The force that dispatched him. */
  forceId: EntityId;
  /** Home city — where he set out and where he returns. */
  fromCityId: EntityId;
  /** The city he is bound for. Empty string for an 'embassy' (its destination
   *  is a distant realm/tribe, not a map city — see `toRealmId`). */
  toCityId: EntityId;
  /** 遠使 — for mode 'embassy', the distant realm (FOREIGN_REALMS) or border
   *  tribe (TribeId) the envoy is bound for. */
  toRealmId?: EntityId;
  mode: ExpeditionMode;
  /** 護衛 — an optional guard riding along (§7.6): lowers capture peril and is
   *  seasoned alongside the envoy; shares his fate (taken/stranded) if it turns ill.
   *  For an 'embassy' this is the 副使 (deputy envoy) — §7.7 ② 遠使團. */
  companionId?: EntityId;
  /** 厚禮 — gold sent abroad as a gift with an 'embassy' (§7.7 ② 進貢厚禮):
   *  spent up front from the home city, it warms the realm (richer reward, a
   *  safer road, and a bigger jump in standing). */
  giftGold?: number;
  phase: ExpeditionPhase;
  /** Seasons left until the current leg finishes (arrival, then homecoming). */
  seasonsRemaining: number;
  /** Seasons one leg of the journey takes — reused to set the return leg. */
  legSeasons: number;
  /** Banked findings, delivered on homecoming. Set when the errand resolves. */
  haul?: ExpeditionHaul;
}
