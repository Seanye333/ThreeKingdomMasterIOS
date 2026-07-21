import type { BilingualName, EntityId } from './common';
import type { CommandType } from './command';
import type { PersonalityTrait } from './personality';
import type { MilitaryRankId } from './title';

// Re-exports so consumers can `import type { Doctrine, OfficerFormationId, TacticId, PolicyId } from '../types'`
export type { Doctrine, OfficerFormationId, TacticId, PolicyId } from '../data/officerAttributes';

export interface OfficerStats {
  leadership: number;
  war: number;
  intelligence: number;
  politics: number;
  charisma: number;
}

/** Item kinds — used for UI grouping only. No longer caps the per-officer count. */
export type EquipSlot = 'weapon' | 'horse' | 'treasure' | 'book' | 'armor';

/**
 * Equipment is an unbounded list of item IDs an officer carries.
 * Items are still globally unique (one officer at a time), but each officer
 * can carry as many as you give them.
 */
export type Equipment = EntityId[];

export interface Officer {
  id: EntityId;
  name: BilingualName;
  courtesyName?: BilingualName;
  birthYear: number;
  deathYear?: number;
  stats: OfficerStats;
  loyalty: number;
  locationCityId: EntityId | null;
  forceId: EntityId | null;
  status: 'active' | 'idle' | 'imprisoned' | 'dead' | 'unsearched' | 'wounded' | 'retired';
  /** 諡號 — granted by their court on a natural death (壯繆侯, 忠武侯…). */
  posthumousName?: string;
  /** 星級 0–6 — the card-game ascension track (stars.ts). Bought with gold,
   *  gated by growth level; amplifies 品階威儀 and 覺醒s at six. */
  stars?: number;
  /** 技能等級 — mastery 1–3 per known skill (missing = 1; skillMastery.ts).
   *  Deepened by 特訓; amplifies the skill's numeric combat effects. */
  skillLevels?: Record<string, number>;
  /** 歷戰勳章 — deed-milestone medal ids (medals.ts); each minted a +1 stat. */
  medals?: string[];
  /** 洗髓 — the one-per-lifetime marrow cleanse has been performed. */
  marrowCleansed?: boolean;
  /** 戰意 — hot/cold streak from FOUGHT battles (+5 勢如破竹 … −3 心灰意冷).
   *  Gently scales combat contribution (streakPowerMul). */
  streak?: number;
  /** 開包閃度 — a foil tier rolled once, the first time this card is revealed
   *  through a pull (得將/求賢祭/覺醒). Pure collectible variance, no mechanics.
   *  'plain' locks in a non-shiny result so it never re-rolls; missing = never
   *  pulled. See cardFoil.ts. */
  foil?: 'plain' | 'silver' | 'gold' | 'rainbow';
  /** 兵種熟練 — 0–100 proficiency per arm (infantry/cavalry/archers/spearmen/
   *  navy), earned by fighting on the field as that arm. Small power edge when
   *  leading a mastered arm. See armProficiency.ts. */
  armProficiency?: Record<string, number>;
  /** 人馬合一 — the bond this officer has built with a specific mount, ridden
   *  battle after battle. Switching horses resets it. A small power edge for a
   *  rider on their trusted steed. See mountBond.ts. */
  mountBond?: { itemId: EntityId; seasons: number };
  /** 醫術 — a physician/herbalist's accumulated healing skill, 0–100. Grows
   *  each season they practise (faster on a cure); raises wound recovery and
   *  the chance to mend a lasting 宿疾. See medicalSkill.ts. */
  medicalSkill?: number;
  /** Historical hometown — fixed at scenario load from the template. Doesn't
   *  change as the officer moves around. Used by UI + search bonuses. */
  hometownCityId?: EntityId;
  /** Seasons remaining before a wounded officer recovers to idle. */
  woundedSeasons?: number;
  /** 傷勢 — how grave the current wound is. A 瀕死 (critical) wound recovers
   *  slowly, fights far weaker, and can still prove mortal. Set with status
   *  'wounded'; cleared on recovery. */
  woundSeverity?: 'minor' | 'serious' | 'critical';
  /** 故主 — the force this officer served when captured. Set on imprisonment so
   *  that force can later ransom (贖回) them back. Cleared on release/recruit. */
  capturedFromForceId?: EntityId;
  /** 質子 — when this officer lives at another realm's court as a diplomatic
   *  hostage (§7.1), the holder's force id. Distinguishes a peace surety (who
   *  can be recalled, may escape, and is slain if their home betrays the pact)
   *  from a war captive. Status is 'imprisoned'; cleared on return/death. */
  hostageOfForceId?: EntityId;
  /** 三顧之誠 — for a rootless sage, how many times a 訪賢 expedition (§7.6) has
   *  courted them; each visit raises the odds they finally agree to serve. */
  courtVisits?: number;
  /** 後遺 — short-lived afflictions (養傷 from a duel, 羞憤 from a lost debate)
   *  that sap effective stats for a few seasons. Optional; ticks down each
   *  season. See systems/afflictions.ts. */
  afflictions?: import('../systems/afflictions').Affliction[];
  /** 傷殘 — PERMANENT maims from a brutal single combat (斷臂 / 目眇 / 跛足).
   *  Unlike 養傷 these never heal: they narrow the officer's duel move-pool and
   *  sap their prowess for good. See systems/duel.ts (duelScars). */
  duelScars?: import('../systems/duel').DuelScar[];
  /** 武學修為 — mastery (0–100) of the officer's weapon 流派, a duel-only growth
   *  track separate from 歷練 level. Deepened via 演武 修煉 (spending 心得) and
   *  苦戰頓悟. High 修為 unlocks moves sooner + lends prowess/opening 氣. See
   *  systems/martialArts.ts. */
  martialXiuwei?: number;
  /** 武學心得 — spendable insight earned in the arena; buys 修為, and once 修為
   *  caps, 悟招 / 改換門庭 (see systems/martialArts.ts). */
  martialInsight?: number;
  /** 悟招 — duel moves grasped by spending 心得 ahead of the 歷練 that would
   *  grant them. Additive to the level/修為 gate, never subtractive. */
  duelMovesLearned?: import('../systems/duel').DuelMove[];
  /** 改換門庭 — an explicitly chosen 武學流派, overriding the one derived from
   *  the officer's weapon. Set only by a deliberate school change. */
  martialSchool?: import('../systems/duel').WeaponClass;
  /** 衣缽傳人 (§6.18) — the pupil this master has named to carry their craft on.
   *  On the master's death the heir is lifted toward 70% of the master's 修為
   *  in that art. Set by a living 宗師 (martial) / 名士 (debate). */
  martialHeirId?: EntityId;
  debateHeirId?: EntityId;
  /** 文辯修為 — scholarship (0–100) of the officer's debating 學派, the war of
   *  words' mirror of 武學. Deepened via 講席 (spending 心得) and 論戰頓悟. High
   *  修為 lends 口才/opening 氣勢/沉著 in every 舌戰. See systems/debateArts.ts. */
  debateXiuwei?: number;
  /** 文辯心得 — spendable insight earned at the lectern; buys 修為. */
  debateInsight?: number;
  /** 月旦品題 — the standing verdict the realm's critique pronounced on this
   *  officer when they first took the 月旦評 laurel (§6.15). Once given it
   *  keeps — 一語定品,終身隨之. */
  moonEpithet?: { zh: string; en: string };
  task: CommandType | null;
  equipment: Equipment;
  /** Innate skill IDs (referencing SKILLS_BY_ID). 0–4 per officer. */
  skills: EntityId[];
  /** Military rank — defaults to 'soldier' for an unranked officer. */
  rank: MilitaryRankId;
  /** Accumulated experience points. Officers level up at 100/250/500/1000/2000. */
  xp?: number;
  /** Latent talent caps — each stat can grow up to here via XP. */
  latentStats?: OfficerStats;
  /** True for female officers; affects portrait + recruit defaults. */
  female?: boolean;
  /** Personality traits — 0–3 entries. Drive AI tendencies and event hooks. */
  traits?: PersonalityTrait[];
  /** 主義 — ideological alignment that shapes how the officer judges sovereigns and events. */
  doctrine?: import('../data/officerAttributes').Doctrine;
  /** 陣形 — battle formations this officer can deploy (typically 2–4). */
  formations?: import('../data/officerAttributes').OfficerFormationId[];
  /** 戰法 — battle tactics available to this officer (typically 1–3). */
  tactics?: import('../data/officerAttributes').TacticId[];
  /** 政策 — civic policies this officer specializes in (typically 0–3). */
  policies?: import('../data/officerAttributes').PolicyId[];
  /** Lv. — officer level (1–100), derived from total stats. */
  level?: number;
  /** Number of wishes this officer has had rejected. Escalates penalty +
   *  triggers defection risk at threshold. */
  grievanceCount?: number;
  /** Historical dynasty tag — undefined / omitted for the default
   *  Three-Kingdoms roster; set for officers from other eras pulled in via
   *  the "Historical Officers" toggles on the title screen. */
  dynasty?: import('../data/dynasties').Dynasty;
  /** 私兵 / 部曲 — a gold-funded personal guard corps. Strengthens whatever
   *  army this officer commands (attack or defend). Capped at leadership×100;
   *  disperses if the officer dies. Default/omitted = 0. */
  privateTroops?: number;
  /** 威名 — cached prestige title id (id from PRESTIGE_TITLES), refreshed each
   *  season from stats + deeds. Lets earned-from-deeds titles drive combat /
   *  duel / income without threading deeds to every call site. */
  prestigeTitleId?: string;
  /** 練兵/拜師 — a player-chosen stat to steer level-up growth toward. When set,
   *  every XP source biases stat gains here (see growth.grantXp). */
  trainingFocus?: keyof OfficerStats;
  /** 頓悟槽 — XP earned past the level-9 ceiling pools here instead of being
   *  wasted; each time it fills, the officer breaks a 瓶頸 and lifts one latent
   *  cap (a mini-breakthrough between 突破s). See growth.grantXp. Default 0. */
  epiphany?: number;
  /** 師承 — the officer this one is apprenticed to (拜師). While both are
   *  garrisoned together the disciple grows toward the master's strongest suit,
   *  may inherit one of their skills, and inherits a 遺志 boost on the master's
   *  death. See systems/growth + resolution's mentor loop. */
  mentorId?: EntityId;
  /** Highest 品階 ever reached — drives one-shot 晉牌封賞 rewards so a promotion
   *  fires once and a stat wobble around the threshold can't re-trigger it. */
  peakGrade?: import('../systems/officerGrade').OfficerGrade;
  /** 轉生/突破 — times this officer has broken through at max growth level. Each
   *  one lifts their latent caps and grants fresh stat growth. Default 0. */
  breakthroughs?: number;
  /** 戰功威望 — accumulated battlefield renown. Folds into gradeScore so a
   *  battle-proven veteran can earn a higher 品階 than a higher-statted but
   *  untested rival (晉品評定). Earned on victories, DOCKED on humiliation
   *  (罵死/被俘) — a living, two-way reputation (揚威/失威). Default 0. */
  renown?: number;
  /** 失威 — seasons of disgrace after a humiliating 罵死 / 被俘. While >0 the
   *  officer's 品階招牌 (萬軍辟易/不動如山/萬人敵) is suppressed — their aura is
   *  shaken until they win it back. Ticks down each season. Default/omitted = 0. */
  disgrace?: number;
  /** 軍功已賞 (§4.10) — merit points already paid out to this officer. What his
   *  deeds are worth MINUS this is what he is still owed; an open ledger erodes
   *  his loyalty every season (賞不逾時). Default/omitted = 0. */
  meritRewarded?: number;
  /** 軍過已罰 (§4.10) — fault points already answered for. Default/omitted = 0. */
  faultPunished?: number;
  /** 爵位 — held peerage id (封爵), the highest layer of 官爵 above 軍階/官職.
   *  Yields 食邑 income + loyalty + prestige; great fiefs feed 野心. Default/
   *  omitted = no peerage. See data/peerage.ts. */
  peerageId?: import('./title').PeerageId;
  /** 復仇 — which force killed each of this officer's close relatives
   *  (relativeOfficerId → killerForceId). Read by the `vengeful` trait for a
   *  combat bonus vs that force. Additive/optional — safe for old saves. */
  killedRelativesBy?: Record<EntityId, EntityId>;
  /** 為兄弟復仇 — which force slew each fallen sworn brother (義兄弟Id → killerForceId).
   *  Grants a combat bonus vs that force (no trait required). Optional/safe. */
  killedSwornBy?: Record<EntityId, EntityId>;
  /** 名號將軍 — a conferred martial honorific (雜號將軍). Standing loyalty +
   *  a signature battle perk; one per officer. See data/honorifics.ts. */
  honorificId?: string;
  /** 家門 — the clan house this officer belongs to (key into state.clans, =
   *  zh surname). Set on heir 出仕 / 收養; lazily backfilled for historical
   *  officers by deriveInitialClans. Optional — safe for old saves. */
  clanId?: string;
  /** 世子 — the player named this officer the designated heir of their line;
   *  succession prefers them over birth order. Carried from a PendingHeir on
   *  coming-of-age, or set directly on a grown child. */
  designatedHeir?: boolean;
  /** 部曲故主 — the lord whose historical retinue this officer belongs to (set
   *  once by fillRetinues at scenario start, never cleared). Drives a loyalty
   *  floor while serving that lord, grief if the lord falls, and an eager
   *  re-recruit ("舊部歸心") if the old lord calls them back. Optional/safe. */
  retinueOfLordId?: EntityId;
  /** 舉薦待延 — a serving officer recently put this in-the-wild talent forward
   *  (§3.1 舉薦); they're easier to recruit while flagged. Cleared on joining. */
  recommended?: boolean;
  /** 舉主 (§3.8) — the officer who recommended this man into service. A lifelong
   *  tie: a disaffected patron sours his clients' loyalty, and when he breaks
   *  away his 故吏 in the same city go with him. Default/omitted = none. */
  patronId?: EntityId;
  /** 義釋報恩 — a force that once freed this officer honourably (§3.3 義釋);
   *  they remember the kindness and are far easier for that force to recruit. */
  freedByForceId?: EntityId;
  /** 月旦評 — a famed appraiser's verdict on this officer (§3.5). An ACCURATE
   *  read reveals their 成長資質 and reads as a permanent epithet; a 走眼 (misread)
   *  one keeps the 資質 hidden until a sharper eye (higher `byInt`) looks again. */
  appraisal?: { zh: string; en: string; grade: 'upper' | 'middle' | 'lower'; misread?: boolean; byInt?: number };
  /** 知遇之恩 — a force whose 名士 gave this in-the-wild talent a glowing 月旦評;
   *  flattered to be recognized, they incline to that house (§3.5 recruit bonus). */
  recognizedByForceId?: EntityId;
}
