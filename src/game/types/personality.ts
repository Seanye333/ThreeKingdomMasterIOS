import type { BilingualName } from './common';

/**
 * Per-officer personality traits — flavor + light gameplay effects.
 * An officer has 0–3 traits. Many traits push the AI's tendency in some
 * direction (e.g. 嗜酒 = prone to brawl events; 多疑 = harder to defect).
 */
export type PersonalityTrait =
  | 'drunkard'      // 嗜酒 — prone to drunkenness; lower defense vs assassination
  | 'suspicious'    // 多疑 — harder to defect to (negative espionage modifier)
  | 'benevolent'    // 仁慈 — refuses to execute captives; +loyalty aura
  | 'stubborn'      // 剛愎 — refuses retreats, ignores some wishes
  | 'cowardly'      // 怯懦 — flees easily, more likely to surrender
  | 'ambitious'     // 野心 — more likely to defect when low loyalty
  | 'loyal'         // 忠義 — never defects, +loyalty regen
  | 'lustful'       // 好色 — vulnerable to femme-fatale plots
  | 'greedy'        // 貪欲 — accepts bribes easily, defects for gold
  | 'reckless'      // 魯莽 — picks duels, takes risks in battle
  | 'cautious'      // 慎重 — refuses risky stratagems
  | 'arrogant'      // 傲慢 — clashes with peers; harder to recruit
  | 'cunning'       // 老謀 — extra success on espionage / stratagem
  | 'pious'         // 虔誠 — temples / oaths matter more
  | 'wrathful'      // 暴怒 — fly into rage in battle (charge bonus, defense penalty)
  // ─── Phase 31b additions ───────────────────────────────────────
  | 'chivalrous'    // 義俠 — rescues allies; refuses to ambush from cover
  | 'compassionate' // 慈悲 — never executes captives; gentle in war
  | 'martial-valor' // 武勇 — actively seeks duels (+15% duel-init chance)
  | 'composed'      // 沈着 — calm in crisis; resists confusion / fear
  | 'impatient'     // 急躁 — fast but error-prone (more crit / more miss)
  | 'taciturn'      // 寡黙 — speaks rarely; immune to slander/frame
  | 'cheerful'      // 開朗 — boosts adjacent ally morale in tactical battles
  | 'noble'         // 高潔 — refuses gold bribes; harder to corrupt
  | 'sickly'        // 病弱 — ages faster, dies younger
  | 'long-lived'    // 寿福 — ages slower, lives long
  | 'refined'       // 風流 — poet/scholar; +charisma during diplomacy events
  | 'cruel'         // 残忍 — terrifies enemies in tactical battle but lowers own loyalty
  | 'precognitive'  // 神算 — sees through enemy plots (espionage immunity)
  | 'matchless'     // 一騎当千 — peerless duelist; massive duel bonus
  | 'frail'         // 文弱 — physically weak; cannot duel
  | 'one-eyed'      // 独眼 — combat veterans (Xiahou Dun) — bonus when wounded
  | 'gluttonous'    // 食道楽 — eats well; lowers food supply effects
  // ─── Phase 36 additions — 15 more flavorful traits ─────────────
  | 'generous'      // 慷慨 — Sun Ce / Liu Bei: gives gold freely, +loyalty in own force
  | 'jealous'       // 嫉妒 — Zhou Yu / Yuan Shu: hates being outshone; conflicts with peer talents
  | 'diligent'      // 勤勉 — Sun Quan / Zhuge Liang: works tirelessly; +internal affairs output
  | 'lazy'          // 懶惰 — slow to act; tasks complete slower
  | 'lenient'       // 寬厚 — Lu Su: forgives captives; +loyalty among subordinates
  | 'stern'         // 嚴峻 — Sima Yi later years: harsh discipline; -loyalty among troops, +march speed
  | 'eloquent'      // 雄辯 — Zhuge Liang at Wu, Lu Su: silver-tongued; +diplomacy success
  | 'filial'        // 仁孝 — Liu Bei, Sun Ce: strong family/clan bonds; +bond effects
  | 'mystical'      // 神秘 — Zhang Jiao, Yu Ji, Zuo Ci: prophets and ritualists; +rare event chance
  | 'vengeful'      // 復仇 — Sun Ce after father's death: carries grudges; +damage vs old foe forces
  | 'vainglorious'  // 好名 — Yuan Shao, Cao Pi: loves flattery; vulnerable to praise-based plots
  | 'bloodthirsty'  // 嗜殺 — Dong Zhuo, Hua Xiong: relishes execution; +morale by fear, -loyalty
  | 'ironhearted'   // 鐵血 — Pang De: refuses surrender; +duel when wounded, never accepts captivity
  | 'graceful'      // 風雅 — Zhou Yu, Cao Zhi: poet/musician; +charisma in court & literati events
  | 'versatile'     // 文武 — Lu Xun, Yang Hu: balanced gifts; small bonus to multiple stats
  // ─── Phase 37 additions — bulk expansion to 200 total ─────────
  | 'sharpshooter'         // 神射 — archer bonus
  | 'spear-master'         // 神槍 — spear unit bonus
  | 'cavalryman'           // 騎將 — cavalry bonus
  | 'navy-master'          // 水將 — naval bonus
  | 'siege-expert'         // 攻城 — siege engine bonus
  | 'fortress-keeper'      // 善守 — defensive garrison bonus
  | 'veteran'              // 老兵 — battle experience bonus
  | 'stoic-brave'          // 沉勇 — calm courage
  | 'explosive'            // 暴烈 — burst damage but risky
  | 'strategist'           // 韜略 — battle planning
  | 'field-tactician'      // 野戰 — open-field bonus
  | 'ambush-master'        // 善伏 — ambush bonus
  | 'raid-style'           // 急襲 — quick strike
  | 'pikeman'              // 持戟 — pike formation
  | 'crossbow-adept'       // 弩匠 — crossbow bonus
  | 'shield-bearer'        // 持盾 — shield wall
  | 'hill-fighter'         // 山戰 — mountain terrain
  | 'forest-fighter'       // 林戰 — forest terrain
  | 'desert-rider'         // 漠騎 — desert terrain
  | 'river-warden'         // 河防 — river defense
  | 'night-raider'         // 夜襲 — night attacks
  | 'rear-guard'           // 殿軍 — retreat protection
  | 'vanguard'             // 先鋒 — leads charges
  | 'duelist'              // 鬥將 — duel-seeker
  | 'berserker'            // 狂戰 — frenzied warrior
  | 'fire-tactician'       // 火攻 — fire attack bonus
  | 'water-tactician'      // 水攻 — water attack bonus
  | 'iron-discipline'      // 鐵律 — march & morale
  | 'tireless-march'       // 健行 — long march
  | 'banner-master'        // 旗令 — morale via flags
  | 'approachable'         // 平易 — easy to recruit
  | 'haughty'              // 高傲 — repels lesser men
  | 'cold'                 // 寡情 — emotionless
  | 'amorous'              // 多情 — love-prone
  | 'frank'                // 直率 — blunt speech
  | 'smooth'               // 圓滑 — diplomatic finesse
  | 'quick-witted'         // 機智 — fast comeback
  | 'humorous'             // 風趣 — wit & charm
  | 'solemn'               // 嚴肅 — gravitas
  | 'reserved'             // 含蓄 — subtle
  | 'unrestrained'         // 豪放 — uninhibited
  | 'introverted'          // 內向 — shy
  | 'smiling-tiger'        // 笑面虎 — deceptive smiler
  | 'gossipy'              // 多嘴 — leaks secrets
  | 'charming'             // 嫵媚 — seductive
  | 'sociable'             // 善交 — networks
  | 'aloof'                // 孤高 — distant
  | 'persuasive'           // 善說 — convincing
  | 'rumor-monger'         // 流言 — spreads tales
  | 'cordial-host'         // 好客 — entertains nobles
  | 'crowd-pleaser'        // 媚眾 — populist
  | 'court-favorite'       // 寵臣 — palace favorite
  | 'awkward'              // 拙朴 — socially awkward
  | 'theatrical'           // 戲謔 — dramatic
  | 'gallant'              // 翩翩 — knightly grace
  | 'erudite'              // 博學 — broad learning
  | 'poetic-genius'        // 詩才 — poet
  | 'adaptable'            // 機變 — flexible
  | 'wise'                 // 多智 — wisdom
  | 'honest-to-fault'      // 愚直 — blunt-honest
  | 'short-sighted'        // 短視 — poor planner
  | 'visionary'            // 遠見 — long-term planner
  | 'pedantic'             // 學究 — bookish
  | 'forgetful'            // 健忘 — forgets details
  | 'photographic-memory'  // 過目不忘 — perfect memory
  | 'mathematical'         // 算學 — calculation
  | 'astronomer'           // 知天 — reads the sky
  | 'historian'            // 通史 — knows precedent
  | 'classics-scholar'     // 經學 — confucian classic
  | 'legalist'             // 法家 — strict law
  | 'philosophical'        // 玄學 — daoist musings
  | 'pragmatic'            // 務實 — practical mind
  | 'dreamer'              // 幻想 — unrealistic
  | 'inventive'            // 巧思 — invention
  | 'curious'              // 好奇 — questing mind
  | 'analytical'           // 細析 — analytical
  | 'naive'                // 純真 — innocent
  | 'incorruptible'        // 廉潔 — refuses bribes
  | 'honor-bound'          // 重義 — duty above all
  | 'stand-for-justice'    // 仗義 — defends weak
  | 'grateful'             // 報恩 — repays kindness
  | 'nostalgic'            // 念舊 — old loyalties
  | 'hates-evil'           // 嫉惡 — purges traitors
  | 'ascetic'              // 寡欲 — denies self
  | 'self-disciplined'     // 自律 — strict on self
  | 'strict-fair'          // 嚴明 — fair but firm
  | 'keeps-word'           // 守信 — keeps promises
  | 'humble'               // 謙遜 — modest
  | 'modest-dress'         // 儉樸 — frugal
  | 'tolerant'             // 寛容 — forgives errors
  | 'principled'           // 守節 — holds principles
  | 'frugal'               // 儉嗇 — saves coin
  | 'meritocratic'         // 任賢 — promotes by skill
  | 'patriotic'            // 愛國 — devoted to dynasty
  | 'gambler'              // 賭徒 — bets it all
  | 'sleepy'               // 嗜睡 — slow to wake
  | 'paranoid'             // 偏執 — obsessive fear
  | 'mercurial'            // 善變 — mood swings
  | 'ruthless'             // 心狠 — pitiless
  | 'envious'              // 心妒 — envious
  | 'dark-political'       // 厚黑 — cynical politico
  | 'opium-user'           // 嗜煙 — addiction
  | 'self-pitying'         // 自憐 — wallows
  | 'spendthrift'          // 浪費 — wastes coin
  | 'oath-breaker'         // 失信 — breaks promises
  | 'sycophant'            // 諂媚 — flatters power
  | 'robust'               // 強健 — strong body
  | 'beautiful'            // 美貌 — strikingly fair
  | 'ugly'                 // 醜陋 — repulsive looks
  | 'tall'                 // 高大 — towering
  | 'hunchback'            // 駝背 — bent spine
  | 'mighty-strength'      // 巨力 — immense strength
  | 'nimble'               // 靈巧 — agile
  | 'ponderous'            // 鈍重 — heavy & slow
  | 'weathered'            // 蒼勁 — battle-aged
  | 'lithe'                // 矯捷 — supple
  | 'thunder-voice'        // 雷聲 — booming voice
  | 'piercing-eyes'        // 銳目 — gaze of hawk
  | 'red-faced'            // 赤面 — fierce flush
  | 'pale-skinned'         // 白面 — scholar pallor
  | 'quick-verse'          // 七步成詩 — Cao Zhi
  | 'hawkeye'              // 千里目 — perfect sight
  | 'handsome-noble'       // 風神俊朗 — Sun Ce
  | 'sharp-tongue'         // 寡言鋒 — biting words
  | 'demon-face'           // 鬼面 — terror visage
  | 'unfathomable'         // 神鬼莫測 — Sima Yi
  | 'smiling-blade'        // 笑里藏刀 — hidden malice
  | 'mountain-tiger'       // 鎮山虎 — territorial lord
  | 'fire-eyes'            // 火眼金睛 — sees through lies
  | 'deep-schemer'         // 老謀深算 — long-game plotter
  | 'iron-bones'           // 鐵骨 — never bends
  | 'phoenix-mind'         // 鳳雛 — Pang Tong style
  | 'sleeping-dragon'      // 卧龍 — hidden brilliance
  | 'crane-step'           // 鶴步 — unhurried elegance
  | 'wild-stallion'        // 野駒 — untamed
  | 'frost-blade'          // 霜刃 — cold killer
  | 'borrowed-wind'        // 借風 — luck-bender
  | 'celestial-pen'        // 天筆 — flawless writing
  | 'silver-armor'         // 銀甲 — gleaming knight
  | 'jade-face'            // 美如玉 — jade beauty
  | 'wolf-eyes'            // 狼目 — predator gaze
  | 'ox-shoulder'          // 牛肩 — burden-bearer
  | 'crane-longevity'      // 鶴壽 — sage's longevity
  | 'wandering-spirit'     // 浪人 — drifter
  | 'demon-slayer'         // 斬妖 — slays mystics
  | 'serpent-strike'       // 蛇擊 — sudden strike
  | 'mountain-still'       // 如山 — unshaken
  | 'lightning-spear'      // 雷槍 — fast spear
  | 'tiger-roar'           // 虎吼 — battle cry
  | 'phoenix-rebirth'      // 鳳生 — recovers from defeat
  | 'shadow-walker'        // 影行 — scout master
  | 'star-reader'          // 觀星 — astronomy
  | 'jade-heart'           // 玉心 — gentle of soul
  // ─── §2.4 additions — the medical axis ─────────────────────────
  | 'physician'            // 醫術 — heals wounds faster; resists plague
  | 'herbalist';           // 採藥 — gathers medicine; blunts plague

export interface PersonalityTraitDef {
  id: PersonalityTrait;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** Visual tint for the trait chip. */
  color: string;
  /** Whether this trait is generally a "positive" personality. */
  positive: boolean;
  /** 'common' (default) / 'signature' / 'legendary'. Legendary traits are iconic
   *  and **curated-only** — never handed out by procedural officer generation
   *  (they can still be assigned by rosters or earned via breakthrough/deeds). */
  tier?: 'common' | 'signature' | 'legendary';
}

/**
 * Force-level AI personality. Determines how this force's AI ruler
 * approaches the strategic map.
 */
export type RulerPersonality =
  | 'aggressive'     // 攻撃型 — Cao Cao, Sun Ce: marches aggressively, prefers conquest
  | 'defensive'     // 守勢型 — Liu Bei, Liu Biao: fortifies, defends
  | 'opportunist'   // 機会型 — Sun Quan: strikes when others weaken
  | 'hesitant'      // 慎重型 — Yuan Shao: builds large but slow to act
  | 'tyrant'        // 暴虐型 — Dong Zhuo: aggressive, ignores diplomacy
  | 'scholar'       // 学者型 — Kong Rong, Liu Yan: defensive, prefers internal affairs
  | 'expansionist'  // 拡張型 — Yuan Shu, Ma Teng: spreads thin
  | 'cautious';     // 守備型 — Tao Qian: minimal action

export interface RulerPersonalityDef {
  id: RulerPersonality;
  name: BilingualName;
  description: string;
  descriptionZh?: string;
  /** AI tuning weights. */
  marchWeight: number;     // chance to attack each season
  developWeight: number;   // chance to do internal affairs
  recruitWeight: number;   // chance to recruit
  diplomacyWeight: number; // chance to send diplomacy
  retreatThreshold: number; // troop ratio at which they retreat/avoid combat
}
