import type { BilingualName, EntityId } from './common';

/**
 * Military ranks: an ordered ladder. Higher rank gives stat caps, loyalty
 * boost, and unlocks command of larger armies. One officer carries exactly
 * one military rank at a time.
 */
export type MilitaryRankId =
  | 'soldier'           // 兵卒
  | 'captain'           // 都尉
  | 'colonel'           // 校尉
  | 'palace-general'    // 中郎將 (五官/左/右中郎將 — above 校尉, below 將軍)
  | 'lt-general'        // 偏将軍
  | 'vice-general'      // 裨将軍
  | 'general'           // 雜號将軍 (討逆/盪寇… — the general 将軍 tier)
  | 'frontier-general'  // 四安四平将軍 (安東/平南…)
  | 'campaign-general'  // 四征四鎮将軍 (征西/鎮北…)
  | 'cardinal-general'  // 四方将軍 (前/後/左/右将軍)
  | 'guard-general'     // 衛将軍
  | 'chariot-general'   // 車騎将軍
  | 'cavalry-general'   // 驃騎将軍
  | 'grand-general'     // 大将軍
  | 'chancellor';       // 丞相・大司馬 (top tier)

/**
 * 爵位 — the hereditary peerage ladder, granted by enfeoffment (封爵), distinct
 * from the appointed military rank and civic post. A peerage yields 食邑 (fief
 * income paid into the realm treasury each season), a standing loyalty bonus,
 * and prestige — but enfeoffing 公/王 onto a powerful non-sovereign retainer
 * feeds their 野心 (see systems/ambition.ts): the 曹操封魏公 tension. One officer
 * holds exactly one peerage (the highest granted) at a time.
 */
export type PeerageId =
  | 'wudafu'    // 五大夫 — 民爵, the lowest rung
  | 'guanzhong' // 關中侯 — 曹魏名爵, no fief town
  | 'guannei'   // 關內侯 — entry列侯, no fief town
  | 'duting'    // 都亭侯
  | 'ting'      // 亭侯   — 漢壽亭侯 (關羽)
  | 'duxiang'   // 都鄉侯
  | 'xiang'     // 鄉侯   — 武鄉侯 (諸葛亮)
  | 'xian'      // 縣侯   — 舞陽侯 (司馬懿)
  | 'jungong'   // 郡公   (requires a 稱王/稱帝 sovereign to grant)
  | 'gong'      // 公     — 魏公 (sovereign-only)
  | 'wang';     // 王     — 魏王 (sovereign-only; pinnacle short of the throne)

export interface Peerage {
  id: PeerageId;
  name: BilingualName;
  /** Sort order; higher = more senior (1..6). */
  tier: number;
  /** 食邑 — gold the fief yields into the realm capital each season. */
  fiefGold: number;
  /** 食邑 — grain the fief yields into the realm capital each season. */
  fiefGrain: number;
  /** Standing loyalty bonus while the peerage is held (folded into drift). */
  loyaltyBonus: number;
  /** One-shot loyalty bump on enfeoffment. */
  loyaltyOnGrant: number;
  /** Prestige weight — feeds 威望/fame and combat morale. */
  prestige: number;
  /** Merit gate (功勳積分: stat + deeds composite) required to be enfeoffed. */
  minMerit: number;
  /** 野心 pressure added per season to a non-sovereign holder of this peerage —
   *  great fiefs make over-mighty subjects restless. */
  ambitionPressure: number;
  /** 公/王 may only be conferred by a sovereign who has 稱王/稱帝. */
  requiresSovereign?: boolean;
}

export interface MilitaryRank {
  id: MilitaryRankId;
  name: BilingualName;
  /** Sort order; higher = more senior. */
  tier: number;
  /** Bonus added to officer loyalty toward their force per season (capped). */
  loyaltyBonus: number;
  /** Multiplier on max troops a single commander can lead in march. */
  troopCapMultiplier: number;
  /** Stipend in gold per season (paid from treasury). */
  stipend: number;
  /** Required minimum war or leadership to be promoted to this rank. */
  minStat: number;
}

/**
 * Civic / appointed posts. Each post is unique within a force — only one
 * officer can hold it at a time.
 */
export type CivicTitleId =
  | 'prefect'    // 太守 — governor of a specific city (one per city)
  | 'strategist' // 軍師 — chief strategist
  | 'chancellor' // 丞相 — chief minister (cao-cao, zhuge-liang, etc.)
  // 上公 — above the Three Dukes
  | 'grand-tutor'  // 太傅 — grand tutor, senior elder statesman
  | 'da-sima'      // 大司馬 — supreme military commander (supersedes 太尉)
  // 尚書台 — the inner secretariat, the real engine of Han government
  | 'shangshu-ling' // 尚書令 — head of the secretariat (錄尚書事)
  | 'shizhong'      // 侍中 — inner-court attendant / imperial counselor
  | 'sili'          // 司隸校尉 — colonel-director of the capital region
  | 'governor'   // 州牧 — provincial governor (outranks 刺史)
  | 'inspector'  // 刺史 — inspector general
  | 'minister'   // 司徒 — general civil minister
  | 'works-minister' // 司空 — minister of works (the third of the 三公)
  | 'grand-marshal' // 太尉 — chief defense minister
  // 九卿 — the nine ministers
  | 'taichang'   // 太常 — minister of rites
  | 'guanglu'    // 光祿勳 — minister of the household / court selection
  | 'weiwei'     // 衛尉 — minister of the guards
  | 'taipu'      // 太僕 — minister of stables (horses & transport)
  | 'tingwei'    // 廷尉 — minister of justice
  | 'zongzheng'  // 宗正 — minister of the imperial clan
  | 'dasinong'   // 大司農 — minister of agriculture / state finance
  | 'shaofu'     // 少府 — minister of the privy treasury
  | 'foreign-affairs' // 大鴻臚 — head of foreign relations (one of the 九卿)
  | 'censor'     // 御史中丞 — censor-general (anti-corruption)
  | 'advisor'    // 諫議大夫 — court remonstrator / counselor
  // 佐官 — minor staff offices, cheap and early-game accessible
  | 'deputy-magistrate' // 郡丞 — deputy to the prefect
  | 'registrar'  // 主簿 — records secretary
  | 'merit-officer' // 功曹 — personnel / merit officer
  | 'chief-clerk'; // 別駕 — chief mounted clerk of a province

export interface CivicTitle {
  id: CivicTitleId;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Unique per force (true) or per city (false — prefect is per-city). */
  uniquePerForce: boolean;
  /** Stat focus for bonuses. */
  primaryStat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
  /** Force-wide bonus this title grants while held by a competent officer. */
  forceBonus: {
    /** Multiplier on internal-affairs effects. */
    internalMultiplier?: number;
    /** Bonus to recruit success. */
    recruitBonus?: number;
    /** Multiplier on power for the entire force in battle. */
    powerMultiplier?: number;
    /** Multiplier on diplomatic relation gain/loss for the force. */
    diplomacyMultiplier?: number;
    /** Per-season force-wide loyalty drift bonus (anti-corruption). */
    loyaltyDrift?: number;
    /** Multiplier on wish/dialogue-grant loyalty rewards. */
    advisorMultiplier?: number;
    /** 財政 — gold paid into the realm capital each season (大司農/少府). */
    goldPerSeason?: number;
    /** 倉廩 — grain paid into the realm capital each season (大司農). */
    foodPerSeason?: number;
    /** 治安 — 民心 added to every owned city each season (廷尉/司隸/太常…). */
    cityLoyaltyPerSeason?: number;
    /** 禁軍 — standing troops added to the capital each season (衛尉). */
    capitalGarrisonPerSeason?: number;
  };
  /** One-shot loyalty bump granted to the appointee on appointment. */
  loyaltyOnAppoint?: number;
  /** Other civic titles in this force that get auto-vacated when this
   *  one is appointed. 丞相 supersedes 太尉/司徒/大鴻臚 historically. */
  excludes?: CivicTitleId[];
  /** 品階門檻 — minimum 品階 an officer must hold to take this post. A great
   *  office demands a proven officer; below it the appointment is refused. */
  minGrade?: import('../systems/officerGrade').OfficerGrade;
}

/**
 * Held appointment: which officer holds which post in which force,
 * and for prefect, which city.
 */
export interface Appointment {
  officerId: EntityId;
  forceId: EntityId;
  titleId: CivicTitleId;
  /** Only set when titleId === 'prefect'. */
  cityId?: EntityId;
  appointedYear: number;
  /** Optional season for finer-grained tenure tracking. */
  appointedSeason?: 'spring' | 'summer' | 'autumn' | 'winter';
}

/**
 * Audit log of appointments + revocations. Used for the 歷任 tab and for
 * the 4-season re-appoint cooldown.
 */
export interface AppointmentHistoryEntry {
  kind: 'appoint' | 'revoke';
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  officerId: EntityId;
  forceId: EntityId;
  titleId: CivicTitleId;
  cityId?: EntityId;
  /** For revokes/pruning: dead/imprisoned/defected/lost-city/missing/replaced/考課罷免. */
  reason?: 'dead' | 'imprisoned' | 'defected' | 'lost-city' | 'missing' | 'replaced' | 'manual' | 'kaoke';
}
