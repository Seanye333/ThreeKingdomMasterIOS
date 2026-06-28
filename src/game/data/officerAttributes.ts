import type { OfficerStats } from '../types';
import {
  HISTORICAL_DOCTRINES,
  HISTORICAL_FORMATIONS,
  HISTORICAL_TACTICS,
  HISTORICAL_POLICIES,
} from './historicalAttributes';

// ──────────────────────────────────────────────────────────────────────
// 主義 (Doctrine / Ideology)
// ──────────────────────────────────────────────────────────────────────

export type Doctrine =
  | 'royal'      // 王道 — benevolent rule, win hearts
  | 'hegemonic'  // 覇道 — rule by force
  | 'ritual'     // 礼教 — Confucian rite-based order
  | 'fame'       // 名利 — opportunist, fame & profit
  | 'separatist' // 割據 — independent warlord
  | 'reclusion'; // 在野 — recluse / sage

export const DOCTRINE_DEFS: Record<Doctrine, { zh: string; en: string; color: string }> = {
  royal:      { zh: '王道',  en: 'Royal Way',   color: '#d4a84a' },
  hegemonic:  { zh: '覇道',  en: 'Hegemony',    color: '#b8442e' },
  ritual:     { zh: '礼教',  en: 'Confucian',   color: '#88b7e8' },
  fame:       { zh: '名利',  en: 'Fame',        color: '#c19a3b' },
  separatist: { zh: '割據',  en: 'Separatist',  color: '#7a5a3a' },
  reclusion:  { zh: '在野',  en: 'Reclusion',   color: '#7a9a5a' },
};

/** Explicit doctrine for famous officers. Unlisted → derived from stats. */
export const OFFICER_DOCTRINES: Record<string, Doctrine> = {
  'cao-cao':       'hegemonic',
  'liu-bei':       'royal',
  'sun-quan':      'separatist',
  'sun-ce':        'hegemonic',
  'sun-jian':      'hegemonic',
  'dong-zhuo':     'hegemonic',
  'lu-bu':         'hegemonic',
  'yuan-shao':     'separatist',
  'yuan-shu':      'fame',
  'liu-biao':      'separatist',
  'liu-zhang':     'separatist',
  'liu-yu':        'royal',
  'gongsun-zan':   'separatist',
  'ma-teng':       'separatist',
  'han-sui':       'separatist',
  'meng-huo':      'separatist',
  'zhang-jiao':    'fame',
  'guan-yu':       'ritual',
  'zhang-fei':     'hegemonic',
  'zhao-yun':      'royal',
  'huang-zhong':   'ritual',
  'ma-chao':       'hegemonic',
  'zhuge-liang':   'royal',
  'pang-tong':     'fame',
  'fa-zheng':      'fame',
  'jiang-wei':     'royal',
  'wei-yan':       'hegemonic',
  'xun-yu':        'ritual',
  'xun-you':       'ritual',
  'jia-xu':        'fame',
  'guo-jia':       'fame',
  'sima-yi':       'fame',
  'sima-shi':      'fame',
  'sima-zhao':     'hegemonic',
  'sima-yan':      'hegemonic',
  'chen-gong':     'ritual',
  'xu-shu':        'reclusion',
  'sima-hui':      'reclusion',
  'pang-degong':   'reclusion',
  'huang-chengyan':'reclusion',
  'cui-zhouping':  'reclusion',
  'guan-lu':       'reclusion',
  'zuo-ci':        'reclusion',
  'yu-ji':         'reclusion',
  'hua-tuo':       'reclusion',
  'zheng-xuan':    'ritual',
  'cai-yong':      'ritual',
  'kong-rong':     'ritual',
  'chen-shou':     'ritual',
  'lu-su':         'royal',
  'zhou-yu':       'fame',
  'lu-meng':       'hegemonic',
  'lu-xun':        'fame',
  'zhang-zhao':    'ritual',
  'zhuge-jin':     'ritual',
  'gan-ning':      'hegemonic',
  'tai-shi-ci':    'hegemonic',
  'huang-gai':     'ritual',
  'cao-pi':        'fame',
  'cao-rui':       'fame',
  'cao-fang':      'fame',
  'liu-shan':      'fame',
  'liu-xie':       'royal',
  'xu-shao':       'reclusion',
  'sun-shao':      'reclusion',
  // ─── 歷代名將 ───
  ...HISTORICAL_DOCTRINES,
};

export function deriveDoctrine(stats: OfficerStats, id?: string): Doctrine {
  if (id && OFFICER_DOCTRINES[id]) return OFFICER_DOCTRINES[id];
  const { leadership, war, intelligence, politics, charisma } = stats;
  // High politics + high charisma + balanced morality → royal
  if (charisma >= 85 && politics >= 75) return 'royal';
  // High intelligence + politics + low war → ritual (Confucian)
  if (intelligence >= 80 && politics >= 75 && war < 65) return 'ritual';
  // Very high intelligence + low politics → reclusion (sage outside court)
  if (intelligence >= 85 && politics < 60) return 'reclusion';
  // High war + leadership → hegemonic
  if (war >= 80 && leadership >= 75) return 'hegemonic';
  // High leadership only → separatist
  if (leadership >= 80) return 'separatist';
  // Default for opportunists & journeymen
  return 'fame';
}

// ──────────────────────────────────────────────────────────────────────
// 陣形 (Battle Formations)
// ──────────────────────────────────────────────────────────────────────

export type OfficerFormationId =
  | 'crane-wing'   // 鶴翼 — flanking encirclement
  | 'fish-scale'   // 魚鱗 — dense infantry
  | 'arrow-tip'    // 鋒矢 — wedge charge
  | 'square'       // 方圓 — defensive square
  | 'wild-goose'   // 雁行 — ranged echelon
  | 'yoke'         // 衡軛 — anti-cavalry pikes
  | 'crescent'     // 偃月 — siege crescent
  | 'long-snake';  // 長蛇 — line march

export const FORMATION_DEFS: Record<OfficerFormationId, { zh: string; en: string }> = {
  'crane-wing': { zh: '鶴翼', en: 'Crane-Wing' },
  'fish-scale': { zh: '魚鱗', en: 'Fish-Scale' },
  'arrow-tip':  { zh: '鋒矢', en: 'Arrow-Tip' },
  'square':     { zh: '方圓', en: 'Square' },
  'wild-goose': { zh: '雁行', en: 'Wild-Goose' },
  'yoke':       { zh: '衡軛', en: 'Yoke' },
  'crescent':   { zh: '偃月', en: 'Crescent' },
  'long-snake': { zh: '長蛇', en: 'Long-Snake' },
};

/** Explicit formation pools for famous officers. */
export const OFFICER_FORMATIONS: Record<string, OfficerFormationId[]> = {
  'cao-cao':      ['arrow-tip', 'fish-scale', 'crane-wing', 'wild-goose'],
  'zhuge-liang':  ['crane-wing', 'square', 'wild-goose', 'long-snake'],
  'sima-yi':      ['fish-scale', 'square', 'yoke', 'crane-wing'],
  'lu-bu':        ['arrow-tip', 'long-snake'],
  'guan-yu':      ['arrow-tip', 'crescent', 'long-snake'],
  'zhang-fei':    ['arrow-tip', 'long-snake'],
  'zhao-yun':     ['arrow-tip', 'crane-wing', 'long-snake'],
  'ma-chao':      ['arrow-tip', 'long-snake'],
  'huang-zhong':  ['wild-goose', 'crescent'],
  'wei-yan':      ['arrow-tip', 'fish-scale'],
  'zhang-liao':   ['arrow-tip', 'fish-scale', 'long-snake'],
  'xu-chu':       ['arrow-tip', 'fish-scale'],
  'xiahou-dun':   ['arrow-tip', 'fish-scale', 'long-snake'],
  'xiahou-yuan':  ['arrow-tip', 'crescent', 'long-snake'],
  'zhou-yu':      ['crane-wing', 'fish-scale', 'wild-goose'],
  'lu-meng':      ['fish-scale', 'crane-wing', 'square'],
  'lu-xun':       ['crane-wing', 'fish-scale', 'square', 'wild-goose'],
  'gan-ning':     ['arrow-tip', 'long-snake'],
  'tai-shi-ci':   ['arrow-tip', 'wild-goose'],
  'sun-ce':       ['arrow-tip', 'long-snake'],
  'sun-jian':     ['arrow-tip', 'long-snake'],
  'jiang-wei':    ['crane-wing', 'fish-scale', 'long-snake', 'square'],
  'deng-ai':      ['fish-scale', 'crane-wing', 'long-snake'],
  'zhong-hui':    ['fish-scale', 'long-snake', 'crane-wing'],
  'jiang-wan':    ['square', 'long-snake'],
  'fei-yi':       ['square', 'crane-wing'],
  'pang-tong':    ['arrow-tip', 'crane-wing'],
  'fa-zheng':     ['crane-wing', 'square'],
  'guo-jia':      ['arrow-tip', 'fish-scale'],
  'jia-xu':       ['fish-scale', 'square'],
  'cao-ren':      ['square', 'fish-scale', 'long-snake'],
  'hao-zhao':     ['square', 'fish-scale'],
  'tian-yu':      ['wild-goose', 'long-snake'],
  // ─── 歷代名將 ───
  ...HISTORICAL_FORMATIONS,
};

export function deriveFormations(stats: OfficerStats, id?: string): OfficerFormationId[] {
  if (id && OFFICER_FORMATIONS[id]) return OFFICER_FORMATIONS[id];
  const { leadership, war, intelligence } = stats;
  const list: OfficerFormationId[] = [];
  // Everyone gets long-snake (the basic line march)
  list.push('long-snake');
  if (war >= 75) list.push('arrow-tip');
  if (leadership >= 75) list.push('fish-scale');
  if (intelligence >= 75) list.push('crane-wing');
  if (leadership >= 80 && intelligence >= 70) list.push('square');
  if (intelligence >= 80) list.push('wild-goose');
  if (leadership >= 85 && war >= 75) list.push('crescent');
  if (leadership >= 70 && war < 65) list.push('yoke');
  return Array.from(new Set(list)).slice(0, 4);
}

// ──────────────────────────────────────────────────────────────────────
// 戰法 (Battle Tactics)
// ──────────────────────────────────────────────────────────────────────

export type TacticId =
  | 'charge'      // 突擊
  | 'volley'      // 斉射
  | 'fire-attack' // 火計
  | 'water-attack'// 水計
  | 'rouse'       // 鼓舞
  | 'ruse'        // 偽計
  | 'crossbow'    // 連弩
  | 'catapult'    // 投石
  | 'disorder'    // 撹乱
  | 'pitfall'     // 落穴
  | 'ambush'      // 急襲
  | 'curse'       // 罵声
  // ── Phase 54 expansion ──
  | 'last-stand'  // 死戰 — low-HP rage
  | 'iron-wall'   // 鐵壁 — anti-melee bulwark
  | 'rush'        // 突進 — cavalry surge
  | 'fire-arrow'  // 火矢 — incendiary archery
  | 'meteor'      // 流星 — splash stone-throw
  | 'thunder'     // 雷震 — Daoist stun
  | 'borrow-wind' // 借東風 — summon east wind 2 turns
  | 'eight-gates' // 八門遁甲 — confuse + dispel
  | 'beauty'      // 美人計 — defection roll
  | 'chain'       // 連環計 — daisy-chained debuffs
  | 'self-injury' // 苦肉計 — sacrifice for huge enemy debuff
  | 'retreat'     // 走為上 — safe withdraw
  // ── Phase 55: 三十六計 expansion ──
  | 'feint'       // 聲東擊西
  | 'besiege-wei' // 圍魏救趙
  | 'wait-tired'  // 以逸待勞
  | 'sneak-cross' // 暗渡陳倉
  | 'probe-snake' // 打草驚蛇
  | 'lure-tiger'  // 調虎離山
  | 'loose-catch' // 欲擒故縱
  | 'kill-king'   // 擒賊擒王
  | 'cut-supply'  // 釜底抽薪
  | 'cicada'      // 金蟬脫殼
  | 'far-near'    // 遠交近攻
  | 'borrow-arrow' // 草船借箭
  // ── Phase 56: more 36-stratagems + 三國奇計 ──
  | 'deceive-sky' // 瞞天過海
  | 'loot-fire'   // 趁火打劫
  | 'from-nothing'// 無中生有
  | 'watch-fire'  // 隔岸觀火
  | 'hide-knife'  // 笑裡藏刀
  | 'brick-jade'  // 拋磚引玉
  | 'muddy-fish'  // 渾水摸魚
  | 'door-thief'  // 關門捉賊
  | 'tree-flower' // 樹上開花
  | 'guest-host'  // 反客為主
  | 'feign-mad'   // 假癡不癲
  | 'pull-ladder' // 上屋抽梯
  // ── Phase 57: remaining 36-stratagems + 三國奇計 ──
  | 'borrow-knife'// 借刀殺人
  | 'lead-sheep'  // 順手牽羊
  | 'borrow-corpse'// 借屍還魂
  | 'plum-peach'  // 李代桃僵
  | 'borrow-road' // 假途伐虢
  | 'switch-beam' // 偷梁換柱
  | 'point-curse' // 指桑罵槐
  | 'plum-thirst' // 望梅止渴 (Cao Cao)
  | 'seven-lamp'  // 七星燈 (Zhuge Liang)
  | 'chu-songs'   // 四面楚歌 (Han Xin)
  | 'burn-bowang' // 火燒博望 (Zhuge Liang)
  | 'wooden-ox'   // 木牛流馬 (Zhuge Liang's logistics device)
  // ── Phase 58: 三國名場面 + 孫子兵法 ──
  | 'hair-head'   // 割髮代首 (Cao Cao discipline)
  | 'white-robe'  // 白衣渡江 (Lü Meng surprise raid)
  | 'song-map'    // 張松獻圖 (Zhang Song's map)
  | 'seven-grab'  // 七擒孟獲 (Zhuge pacifies Nanman)
  | 'tongue-war'  // 舌戰群儒 (Zhuge at Wu court)
  | 'changban'    // 長坂單騎 (Zhao Yun's lone ride)
  | 'zhuge-bow'   // 諸葛弩 (repeating crossbow)
  | 'chain-ship'  // 連環船 (Pang Tong's chained fleet)
  | 'burn-yiling' // 火燒連營 (Lu Xun at Yiling)
  | 'know-self'   // 知己知彼 (Sun Tzu)
  | 'fast-strike' // 兵貴神速 (Sun Tzu — speed)
  | 'deception'   // 兵不厭詐 (Sun Tzu — deception is permitted)
  // ── Phase 59: 100 grand tactics edition ──
  // 孫子兵法 / 兵書
  | 'attack-plans'   // 上兵伐謀
  | 'attack-heart'   // 攻心為上
  | 'surround-three' // 圍三闕一
  | 'subdue-no-fight'// 不戰而屈人之兵
  | 'hide-light'     // 韜光養晦
  | 'total-victory'  // 全勝之道
  | 'water-form'     // 兵形象水
  | 'ortho-extra'    // 以正合奇勝
  // 道家奇術
  | 'qimen-dunjia'   // 奇門遁甲 (vs 八門遁甲 which is military)
  | 'star-prayer'    // 諸葛禳星 (life-extending ritual)
  | 'he-luo-tu'      // 河圖洛書
  | 'five-thunder'   // 五雷正法
  // 三國後期
  | 'sneak-yinping'  // 鄧艾偷渡陰平
  | 'nine-campaigns' // 姜維九伐中原
  | 'xiling-stand'   // 陸抗西陵
  | 'feign-illness'  // 司馬懿裝病奪權
  | 'iron-chain'     // 王濬鐵索橫江
  | 'two-tigers'     // 二虎競食 (Cao Cao)
  | 'lure-tiger-wolf'// 驅虎吞狼 (Cao Cao)
  | 'sow-discord-2'  // 離間挑撥
  // 名場面
  | 'thousand-ride'  // 千里走單騎 (Guan Yu)
  | 'lone-blade'     // 單刀赴會 (Guan Yu)
  | 'pass-six'       // 過五關斬六將
  | 'burn-xinye'     // 火燒新野
  // 戰國 & 古典
  | 'solid-camp'     // 結硬寨打呆仗 (Zeng Guofan, late Qing)
  | 'death-ground'   // 置之死地而後生
  | 'siege-relief'   // 圍點打援
  | 'bloodless'      // 兵不血刃
  // ── Phase 60: 150 grand edition (百戰奇法 + 戰國奇計 + 名場面 + 古典) ──
  // 百戰奇法
  | 'plan-war' | 'cavalry-war' | 'naval-war' | 'trust-war' | 'many-war'
  | 'few-war' | 'mountain-war' | 'night-war' | 'supply-war' | 'defend-war'
  // 戰國 & 漢
  | 'fire-ox' | 'sand-dam' | 'ban-chao' | 'mass-burial' | 'long-ride'
  // 孫子兵法
  | 'surprise' | 'unguarded' | 'wind-forest' | 'quick-decision' | 'protracted'
  // 三國名場面
  | 'warm-wine' | 'three-fight-lubu' | 'plum-wine' | 'longzhong' | 'burn-chibi'
  | 'lose-jingzhou' | 'flee-maicheng' | 'white-emperor' | 'tearful-ma'
  | 'wuzhang-star' | 'memorial' | 'edict-belt' | 'borrow-jingzhou' | 'diaochan'
  | 'liu-bei-share-meat' // 推食食人
  // 古典 & 軍略
  | 'no-clash' | 'mind-might' | 'reverse-encircle' | 'flower-bloom'
  | 'annihilate' | 'attrition' | 'scorched-earth' | 'siege-starve'
  | 'break-encircle' | 'bait-trap' | 'encircle-no-attack' | 'heart-war'
  | 'counter-plot' | 'press-pursuit' | 'still-vs-motion'
  // ── Phase 61: 200-tactic edition ──
  // 吳起兵法 / 吳子六篇
  | 'plan-state' | 'assess-enemy' | 'govern-troops' | 'on-generalship'
  | 'adapt-change' | 'inspire-soldiers'
  // 司馬法
  | 'benevolence-root' | 'emperor-duty' | 'set-ranks' | 'strict-position' | 'use-many'
  // 諸葛將苑 / 心書
  | 'five-virtues' | 'authority-war' | 'know-nature' | 'when-not-fight' | 'observe-general'
  // 獸形戰術
  | 'eagle-strike' | 'tiger-crouch' | 'leopard-wolf' | 'crane-chickens'
  | 'snake-rat' | 'bee-swarm' | 'ant-siege' | 'whale-silk'
  // 戰術細節
  | 'half-cross' | 'array-wait' | 'conserve-strength' | 'high-ground' | 'mountain-back'
  | 'intercept-relief' | 'rush-supply' | 'feign-defeat' | 'set-ambush-path' | 'quick-night'
  // 道家占卜
  | 'star-reading' | 'tortoise-shell' | 'elements-counter' | 'talisman' | 'summon-spirits'
  // 名戰
  | 'julu-battle' | 'muye-battle' | 'chengpu-battle' | 'hanzhong-battle' | 'lose-jieting'
  | 'zhao-yun-baby' | 'huang-zhong-dingjun' | 'zhou-yu-plan' | 'seek-talent' | 'he-jin-blunder'
  // ── Phase 62: 300-tactic grand collection ──
  | 'form-squads' | 'drill-troops' | 'march-camp' | 'field-camp'
  | 'inspect-army' | 'train-officers' | 'use-blade' | 'short-long'
  | 'firearm-tactics' | 'banner-signals' | 'cart-camp' | 'wolf-claw'
  | 'combat-awe' | 'attack-authority' | 'defense-authority' | 'general-command' | 'soldier-command'
  | 'upper-strategy' | 'middle-strategy' | 'lower-strategy'
  | 'orth-extra-use' | 'tang-li-arts'
  | 'fan-lihua' | 'mu-guiying' | 'mulan' | 'sun-shangxiang'
  | 'huang-yueying' | 'lu-lingqi' | 'ma-yunlu' | 'lady-zhurong-tac'
  | 'beans-to-soldiers' | 'ride-clouds' | 'wind-walk' | 'mist-shroud'
  | 'jade-edict' | 'summon-gods' | 'multi-body' | 'gate-of-life'
  | 'royal-way' | 'daoist-wuwei' | 'legalist-strict' | 'mohist-defense'
  | 'diplomat-debate' | 'yinyang-divine' | 'confucian-rite' | 'strategist-way'
  | 'qi-cart-camp' | 'yu-wolf-claw' | 'yuan-ningyuan' | 'sun-guanning'
  | 'zheng-taiwan' | 'dorgon-pass' | 'zuo-xinjiang' | 'lin-anti-opium'
  | 'nian-rebellion' | 'wu-sangui'
  | 'retreat-no-block' | 'desperate-no-pursue' | 'siege-leave-gap'
  | 'no-uphill-attack' | 'no-hillback-fight' | 'no-bait-take'
  | 'no-elite-attack' | 'half-formed-no-strike' | 'avoid-strong-strike-weak'
  | 'silent-killer' | 'feign-coward' | 'lone-wolf'
  | 'peach-garden-tac' | 'whip-postman' | 'protect-people' | 'sun-quan-bow'
  | 'mi-fang-betray' | 'wei-yan-back' | 'guan-yu-pardon' | 'zhang-fei-poker'
  | 'eight-immortals' | 'phoenix-rise' | 'dragon-claw' | 'turtle-shell'
  | 'xiongnu-raid' | 'qiang-horse' | 'wuhuan-mounted-tac' | 'shanyue-mountain' | 'wuge-rattan-tac'
  | 'yellow-turban-mob' | 'black-mountain-bandit' | 'water-bandit' | 'sworn-brothers' | 'rebel-uprising'
  // ── Phase 63: 400-tactic edition ──
  | 'twin-spear' | 'long-halberd' | 'twin-axe' | 'short-blade' | 'long-whip'
  | 'meteor-hammer' | 'hidden-weapon' | 'bagua-palm' | 'whip-13' | 'iron-sand-palm'
  | 'flying-knife' | 'duck-axe' | 'crescent-shovel' | 'hand-hook' | 'iron-pipa'
  | 'yi-jin-jing' | 'xi-sui-jing' | 'nine-yin' | 'nine-yang' | 'turtle-breath'
  | 'iron-shirt' | 'golden-bell' | 'vajra-finger' | 'crane-stance' | 'child-kungfu'
  | 'caesar-cross' | 'napoleon-flank' | 'hannibal-cannae' | 'macedonian-phalanx'
  | 'mongol-whirlwind' | 'viking-raid' | 'roman-legion' | 'english-longbow'
  | 'greek-fire' | 'spartan-300'
  | 'heavy-cav' | 'light-cav' | 'sniper-bow' | 'repeat-crossbow-cart'
  | 'siege-tower' | 'fire-boat' | 'heavy-foot' | 'three-stage'
  | 'wandering-knight' | 'death-squad' | 'honor-guard' | 'mountain-militia'
  | 'mixed-barbarian' | 'boy-soldier' | 'veteran-cohort'
  | 'burn-talisman' | 'five-thunder-roof' | 'soul-snatch' | 'gu-poison'
  | 'wood-puppet' | 'reverse-soul' | 'long-sound' | 'mind-link'
  | 'geomancy-formation' | 'maoshan-rite'
  | 'faction-manipulate' | 'regent-power' | 'depose-elder' | 'imperial-inlaw'
  | 'eunuch-power' | 'false-edict' | 'court-debate' | 'petition-campaign'
  | 'rumor-spread' | 'smear-opponent'
  | 'wang-lang-cursed' | 'pang-de-coffin' | 'six-expeditions' | 'sima-eight'
  | 'le-jin-raid' | 'zhang-liao-xiaoyao' | 'gan-ning-100' | 'taishi-ci-vs-sunce'
  | 'zhao-yun-courage' | 'ma-chao-han-sui' | 'huang-gai-fake' | 'zhou-cang-blade'
  | 'wuchao-grain' | 'cao-cao-mengjin' | 'lu-bu-yuan-gate'
  | 'iron-guard' | 'ballista-emplace' | 'feather-arrow' | 'chain-mail-foot'
  | 'wooden-ox-mk2' | 'zhuge-bow-mk2' | 'thousand-arrows' | 'chain-machines'
  | 'fire-crow' | 'one-nest-bees' | 'sky-fire-crow' | 'cannon-man-slayer'
  | 'red-cannon' | 'iron-cart-train' | 'flame-thrower'
  // ── Phase 64: 600-tactic megabatch ──
  // 真實歷史戰役 (40)
  | 'zhuolu' | 'dazexiang' | 'chu-han' | 'mobei-battle' | 'feishui'
  | 'sui-chen' | 'xuanwumen' | 'anshi' | 'huangchao' | 'chanyuan'
  | 'jingkang' | 'fishing-castle' | 'mongol-song' | 'poyang-lake' | 'tumu'
  | 'beijing-defense' | 'wanli-three' | 'sarhu' | 'ningjin' | 'yangzhou-ten'
  | 'jiading-three' | 'three-feudatories' | 'yaksa' | 'ulan-butong' | 'mengjin-cross'
  | 'mawei-slope' | 'dingjun-mtn' | 'jieting-loss' | 'wuzhang-fall' | 'jincheng-defend'
  | 'shangfang-valley' | 'yiling-fire' | 'hefei-defense' | 'jiameng-pass' | 'xiapi-flood'
  | 'jingzhou-fall' | 'fancheng-flood' | 'changban-bridge' | 'guandu-grain' | 'red-cliffs-wind'
  // 中外名將絕招 (40)
  | 'han-xin-count' | 'xiang-yu-horse' | 'fan-li-retire' | 'lian-po-thorn'
  | 'zhao-she-vs-zhao' | 'wang-jian-six' | 'zhou-yafu' | 'wei-qing-north'
  | 'ban-chao-far' | 'ma-yuan-coffin' | 'deng-yu-zhongxing' | 'kou-xun-henei'
  | 'feng-yi-cart' | 'du-yu-bamboo' | 'xie-xuan-8k' | 'liu-yu-north'
  | 'wei-rui-liang' | 'yang-su-chen' | 'han-qinhu-cross' | 'li-jing-turk'
  | 'guo-ziyi-lone' | 'yue-fei-yan' | 'han-shizhong-water' | 'wu-jie-mtn'
  | 'meng-gong-defend' | 'zhang-shijie-naval' | 'qi-jiguang-wokou' | 'yu-dayou-fujian'
  | 'li-rusong-korea' | 'song-yingchang-korea' | 'mao-wenlong-pidao' | 'lu-xiangsheng'
  | 'sun-chuanting-tang' | 'shi-kefa-yangzhou' | 'zheng-zhilong-sea' | 'liu-mingchuan-taiwan'
  | 'feng-zicai-zhennan' | 'nie-shicheng-tianjin' | 'duan-qirui-anhui' | 'feng-yuxiang-xian'
  // 各國流派 (20)
  | 'jin-school' | 'han-school' | 'wu-school' | 'shu-school' | 'wei-school'
  | 'yue-school' | 'qin-school' | 'chu-school' | 'qi-school' | 'yan-school'
  | 'mongol-school' | 'persian-school' | 'japan-school' | 'korean-school' | 'india-school'
  | 'tibet-school' | 'manchu-school' | 'tangut-school' | 'jurchen-school' | 'khitan-school'
  // 角色專屬絕招 (40)
  | 'lubu-flying' | 'guanyu-greendragon' | 'zhangfei-yelling' | 'zhaoyun-shadow'
  | 'machao-spear' | 'huangzhong-bow' | 'weiyan-charge' | 'jiangwei-disciple'
  | 'caocao-poetry' | 'xiahoudun-eye' | 'dianwei-double-axe' | 'xuchu-iron-fist'
  | 'zhanghe-mobility' | 'zhanglao-ambush' | 'panghong-sleep' | 'simayi-tortoise'
  | 'sunce-blade' | 'sunquan-blue-eye' | 'zhouyu-music' | 'lumeng-study'
  | 'luxun-fire' | 'taishici-arch' | 'huanggai-old' | 'gan-ning-bell'
  | 'zhuge-fan' | 'pang-tong-chain' | 'fazheng-strategy' | 'huangzhong-old-bow'
  | 'jiang-ji-loyalty' | 'wenping-shield' | 'yuejin-light' | 'lidian-scholar'
  | 'liu-bei-tears' | 'sun-jian-tiger' | 'yuan-shao-noble' | 'yuan-shu-jade'
  | 'gongsun-zan-white' | 'dong-zhuo-tyrant' | 'wang-yun-plot' | 'cao-zhi-poem'
  // 軍事工程 (15)
  | 'tunnel-warfare' | 'pontoon-bridge' | 'mining-walls' | 'gate-tower'
  | 'arrow-tower' | 'wall-corner' | 'moat-deep' | 'caltrops'
  | 'ballista-tower' | 'fire-arrow-tower' | 'cauldron-oil' | 'rolling-logs'
  | 'spike-pit' | 'iron-stakes' | 'observation-tower'
  // 心理戰 (15)
  | 'fake-letter' | 'planted-spy' | 'reverse-spy' | 'turn-defector'
  | 'morale-collapse' | 'banner-burn' | 'name-call' | 'mass-execution'
  | 'mercy-show' | 'hostage-display' | 'public-feast' | 'rumor-defection'
  | 'shame-disgrace' | 'ancestor-mock' | 'family-threat'
  // 經濟戰 (10)
  | 'salt-monopoly' | 'iron-monopoly' | 'tea-trade' | 'silk-road'
  | 'mint-coin' | 'tax-cut' | 'land-reform' | 'merchant-tax'
  | 'tribute-system' | 'forge-currency'
  // 諜報細分 (10)
  | 'spy-network' | 'double-agent' | 'sleeper-cell' | 'dead-drop'
  | 'fake-defector' | 'court-bribery' | 'maid-spy' | 'letter-intercept'
  | 'signal-flag' | 'carrier-pigeon'
  // 罕見名場面 (10)
  | 'sun-ce-mirror' | 'cao-rui-vase' | 'liu-shan-stupid' | 'da-qiao-marriage'
  | 'dong-zhuo-fat' | 'lu-zhi-master' | 'cai-yong-lute' | 'mi-heng-drum'
  | 'zhang-jiao-yellow' | 'zhang-lu-rice';

export const TACTIC_DEFS: Record<TacticId, { zh: string; en: string }> = {
  charge:        { zh: '突擊', en: 'Charge' },
  volley:        { zh: '斉射', en: 'Volley' },
  'fire-attack': { zh: '火計', en: 'Fire' },
  'water-attack':{ zh: '水計', en: 'Water' },
  rouse:         { zh: '鼓舞', en: 'Rouse' },
  ruse:          { zh: '偽計', en: 'Ruse' },
  crossbow:      { zh: '連弩', en: 'Crossbow' },
  catapult:      { zh: '投石', en: 'Catapult' },
  disorder:      { zh: '撹乱', en: 'Disorder' },
  pitfall:       { zh: '落穴', en: 'Pitfall' },
  ambush:        { zh: '急襲', en: 'Ambush' },
  curse:         { zh: '罵声', en: 'Curse' },
  'last-stand':  { zh: '死戰', en: 'Last Stand' },
  'iron-wall':   { zh: '鐵壁', en: 'Iron Wall' },
  rush:          { zh: '突進', en: 'Surge' },
  'fire-arrow':  { zh: '火矢', en: 'Fire Arrow' },
  meteor:        { zh: '流星', en: 'Meteor' },
  thunder:       { zh: '雷震', en: 'Thunder' },
  'borrow-wind': { zh: '借東風', en: 'Borrow East Wind' },
  'eight-gates': { zh: '八門遁甲', en: 'Eight Gates' },
  beauty:        { zh: '美人計', en: 'Beauty Plot' },
  chain:         { zh: '連環計', en: 'Chain Stratagem' },
  'self-injury': { zh: '苦肉計', en: 'Self-Injury' },
  retreat:       { zh: '走為上', en: 'Strategic Retreat' },
  feint:         { zh: '聲東擊西', en: 'Feint East Strike West' },
  'besiege-wei': { zh: '圍魏救趙', en: 'Besiege Wei to Save Zhao' },
  'wait-tired':  { zh: '以逸待勞', en: 'Wait for the Exhausted' },
  'sneak-cross': { zh: '暗渡陳倉', en: 'Sneak Across Chen Cang' },
  'probe-snake': { zh: '打草驚蛇', en: 'Beat Grass, Startle Snake' },
  'lure-tiger':  { zh: '調虎離山', en: 'Lure the Tiger Down' },
  'loose-catch': { zh: '欲擒故縱', en: 'Catch by Releasing' },
  'kill-king':   { zh: '擒賊擒王', en: 'Capture the Ringleader' },
  'cut-supply':  { zh: '釜底抽薪', en: 'Pull Wood From Under the Pot' },
  cicada:        { zh: '金蟬脫殼', en: "Cicada's Empty Shell" },
  'far-near':    { zh: '遠交近攻', en: 'Befriend Distant, Attack Near' },
  'borrow-arrow':{ zh: '草船借箭', en: 'Borrow Arrows with Straw Boats' },
  'deceive-sky': { zh: '瞞天過海', en: 'Deceive Heaven to Cross the Sea' },
  'loot-fire':   { zh: '趁火打劫', en: 'Loot a Burning House' },
  'from-nothing':{ zh: '無中生有', en: 'Create Something from Nothing' },
  'watch-fire':  { zh: '隔岸觀火', en: 'Watch Fires Burn from Across the River' },
  'hide-knife':  { zh: '笑裡藏刀', en: 'A Knife Behind a Smile' },
  'brick-jade':  { zh: '拋磚引玉', en: 'Toss a Brick to Attract Jade' },
  'muddy-fish':  { zh: '渾水摸魚', en: 'Fish in Troubled Waters' },
  'door-thief':  { zh: '關門捉賊', en: 'Shut the Door to Catch the Thief' },
  'tree-flower': { zh: '樹上開花', en: 'Deck the Tree with False Blossoms' },
  'guest-host':  { zh: '反客為主', en: 'Turn the Guest into the Host' },
  'feign-mad':   { zh: '假癡不癲', en: 'Feign Madness but Keep Your Wits' },
  'pull-ladder': { zh: '上屋抽梯', en: 'Lure to the Roof, Pull the Ladder' },
  'borrow-knife':{ zh: '借刀殺人', en: 'Kill with a Borrowed Knife' },
  'lead-sheep':  { zh: '順手牽羊', en: 'Lead Away the Sheep in Passing' },
  'borrow-corpse':{ zh: '借屍還魂', en: 'Borrow a Corpse to Return the Soul' },
  'plum-peach':  { zh: '李代桃僵', en: 'Plum Tree Withers for the Peach' },
  'borrow-road': { zh: '假途伐虢', en: 'Borrow a Path to Conquer Guo' },
  'switch-beam': { zh: '偷梁換柱', en: 'Replace the Beams with Rotten Timbers' },
  'point-curse': { zh: '指桑罵槐', en: 'Point at Mulberry, Curse the Locust' },
  'plum-thirst': { zh: '望梅止渴', en: 'Quench Thirst by Hoping for Plums' },
  'seven-lamp':  { zh: '七星燈', en: 'Seven-Star Lamps' },
  'chu-songs':   { zh: '四面楚歌', en: 'Songs of Chu from All Sides' },
  'burn-bowang': { zh: '火燒博望', en: 'Burn Bowang' },
  'wooden-ox':   { zh: '木牛流馬', en: 'Wooden Ox & Flowing Horse' },
  'hair-head':   { zh: '割髮代首', en: 'Hair in Lieu of Head' },
  'white-robe':  { zh: '白衣渡江', en: 'Cross the River in White Robes' },
  'song-map':    { zh: '張松獻圖', en: 'Zhang Song Presents the Map' },
  'seven-grab':  { zh: '七擒孟獲', en: 'Seven Captures of Meng Huo' },
  'tongue-war':  { zh: '舌戰群儒', en: 'Tongue-Battle with the Scholars' },
  changban:      { zh: '長坂單騎', en: 'Single Rider at Changban' },
  'zhuge-bow':   { zh: '諸葛連弩', en: "Zhuge's Repeating Crossbow" },
  'chain-ship':  { zh: '連環船', en: 'Chain the Ships' },
  'burn-yiling': { zh: '火燒連營', en: 'Burn the Camps at Yiling' },
  'know-self':   { zh: '知己知彼', en: 'Know Yourself, Know the Enemy' },
  'fast-strike': { zh: '兵貴神速', en: 'Speed is the Soul of War' },
  deception:     { zh: '兵不厭詐', en: 'In War, Deception Is Welcome' },
  'attack-plans':   { zh: '上兵伐謀',     en: "Defeat the Enemy's Plans First" },
  'attack-heart':   { zh: '攻心為上',     en: 'Attack the Enemy Mind, Above All' },
  'surround-three': { zh: '圍三闕一',     en: 'Surround Three Sides, Leave One Open' },
  'subdue-no-fight':{ zh: '不戰而屈人之兵', en: 'Subdue the Enemy Without Fighting' },
  'hide-light':     { zh: '韜光養晦',     en: 'Hide the Light, Bide the Time' },
  'total-victory':  { zh: '全勝之道',     en: 'The Way of Total Victory' },
  'water-form':     { zh: '兵形象水',     en: 'War Takes Shape Like Water' },
  'ortho-extra':    { zh: '以正合奇勝',   en: 'Orthodox to Engage, Extraordinary to Win' },
  'qimen-dunjia':   { zh: '奇門遁甲',     en: 'Strange Gates, Hidden Stems' },
  'star-prayer':    { zh: '諸葛禳星',     en: "Zhuge's Star Ritual" },
  'he-luo-tu':      { zh: '河圖洛書',     en: 'River Chart and Luo Writing' },
  'five-thunder':   { zh: '五雷正法',     en: 'Five-Thunder Orthodox Rite' },
  'sneak-yinping':  { zh: '偷渡陰平',     en: 'Sneak Across Yinping (Deng Ai)' },
  'nine-campaigns': { zh: '九伐中原',     en: 'Nine Campaigns Against the Plain (Jiang Wei)' },
  'xiling-stand':   { zh: '西陵之戰',     en: 'The Stand at Xiling (Lu Kang)' },
  'feign-illness':  { zh: '裝病奪權',     en: 'Feign Illness to Seize Power (Sima Yi)' },
  'iron-chain':     { zh: '鐵索橫江',     en: 'Iron Chains Across the River' },
  'two-tigers':     { zh: '二虎競食',     en: 'Two Tigers Fight Over Meat' },
  'lure-tiger-wolf':{ zh: '驅虎吞狼',     en: 'Drive the Tiger to Devour the Wolf' },
  'sow-discord-2':  { zh: '離間挑撥',     en: 'Sow Discord Between Allies' },
  'thousand-ride':  { zh: '千里走單騎',   en: 'Ride a Thousand Li Alone' },
  'lone-blade':     { zh: '單刀赴會',     en: 'Attend the Banquet with a Single Blade' },
  'pass-six':       { zh: '過五關斬六將', en: 'Pass Five Forts, Slay Six Captains' },
  'burn-xinye':     { zh: '火燒新野',     en: 'Burn Xinye' },
  'solid-camp':     { zh: '結硬寨打呆仗', en: 'Build Solid Camps, Fight Stupid Battles' },
  'death-ground':   { zh: '置之死地而後生', en: 'Place on Death-Ground, Then Survive' },
  'siege-relief':   { zh: '圍點打援',     en: 'Besiege a Point to Strike the Relief' },
  bloodless:        { zh: '兵不血刃',     en: 'A Sword that Draws No Blood' },
  // ── Phase 60 ──
  'plan-war':       { zh: '計戰', en: 'War of Plans' },
  'cavalry-war':    { zh: '騎戰', en: 'Cavalry War' },
  'naval-war':      { zh: '舟戰', en: 'Naval War' },
  'trust-war':      { zh: '信戰', en: 'War of Trust' },
  'many-war':       { zh: '眾戰', en: 'War with Numbers' },
  'few-war':        { zh: '寡戰', en: 'War with Few' },
  'mountain-war':   { zh: '山戰', en: 'Mountain War' },
  'night-war':      { zh: '夜戰', en: 'Night War' },
  'supply-war':     { zh: '糧戰', en: 'Supply War' },
  'defend-war':     { zh: '守戰', en: 'War of Defense' },
  'fire-ox':        { zh: '火牛陣', en: "Tian Dan's Fire-Oxen" },
  'sand-dam':       { zh: '韓信囊沙', en: "Han Xin's Sand-Dam" },
  'ban-chao':       { zh: '班超三十六', en: "Ban Chao's Thirty-Six" },
  'mass-burial':    { zh: '白起坑卒', en: "Bai Qi's Mass Burial" },
  'long-ride':      { zh: '霍去病千里', en: "Huo Qubing's Thousand-Li Ride" },
  surprise:         { zh: '出其不意', en: 'Strike When Unexpected' },
  unguarded:        { zh: '攻其無備', en: "Attack Where They're Unguarded" },
  'wind-forest':    { zh: '風林火山', en: 'Swift, Silent, Fierce, Immovable' },
  'quick-decision': { zh: '速戰速決', en: 'Quick War, Quick End' },
  protracted:       { zh: '持久戰', en: 'Protracted War' },
  'warm-wine':      { zh: '溫酒斬華雄', en: 'Slay Hua Xiong with Wine Still Warm' },
  'three-fight-lubu':{ zh: '三英戰呂布', en: 'Three Heroes Battle Lü Bu' },
  'plum-wine':      { zh: '煮酒論英雄', en: 'Brewed Wine, Heroes Discussed' },
  longzhong:        { zh: '隆中對', en: 'The Longzhong Plan' },
  'burn-chibi':     { zh: '火燒赤壁', en: 'Burn the Red Cliffs' },
  'lose-jingzhou':  { zh: '大意失荊州', en: 'Lose Jingzhou to Carelessness' },
  'flee-maicheng':  { zh: '走麥城', en: 'Flee to Maicheng' },
  'white-emperor':  { zh: '白帝託孤', en: 'Entrust the Orphan at White Emperor City' },
  'tearful-ma':     { zh: '揮淚斬馬謖', en: 'Execute Ma Su with Tears' },
  'wuzhang-star':   { zh: '五丈原星隕', en: 'A Star Falls at Wuzhang Plain' },
  memorial:         { zh: '出師表', en: 'Memorial Before the Campaign' },
  'edict-belt':     { zh: '衣帶詔', en: 'Edict in the Sash' },
  'borrow-jingzhou':{ zh: '借荊州', en: 'Borrow Jingzhou' },
  diaochan:         { zh: '貂蟬連環', en: "Diaochan's Chain Plot" },
  'liu-bei-share-meat': { zh: '推食食人', en: 'Share Your Meat with the Soldiers' },
  'no-clash':       { zh: '兵不接刃', en: 'Victory Without Crossing Blades' },
  'mind-might':     { zh: '將謀重於兵勇', en: 'A Mind Worth More Than Brave Soldiers' },
  'reverse-encircle':{ zh: '反包圍', en: 'Reverse Encirclement' },
  'flower-bloom':   { zh: '中心開花', en: 'Bloom from the Center' },
  annihilate:       { zh: '殲滅戰', en: 'War of Annihilation' },
  attrition:        { zh: '消耗戰', en: 'War of Attrition' },
  'scorched-earth': { zh: '焦土戰術', en: 'Scorched-Earth Strategy' },
  'siege-starve':   { zh: '圍困飢戰', en: 'Siege by Starvation' },
  'break-encircle': { zh: '突圍戰', en: 'Break the Encirclement' },
  'bait-trap':      { zh: '釣餌戰術', en: 'Bait-and-Trap' },
  'encircle-no-attack':{ zh: '圍而不攻', en: 'Encircle Without Engaging' },
  'heart-war':      { zh: '心戰為上', en: 'War of the Heart Above All' },
  'counter-plot':   { zh: '將計就計', en: "Counter-Stratagem on Their Stratagem" },
  'press-pursuit':  { zh: '趁勢追擊', en: 'Press the Advantage in Pursuit' },
  'still-vs-motion':{ zh: '以靜制動', en: 'Stillness Defeats Motion' },
  // ── Phase 61 ──
  'plan-state':         { zh: '圖國',     en: 'Plan for the State (Wuzi)' },
  'assess-enemy':       { zh: '料敵',     en: "Assess the Enemy" },
  'govern-troops':      { zh: '治兵',     en: 'Govern the Troops' },
  'on-generalship':     { zh: '論將',     en: 'On Generalship' },
  'adapt-change':       { zh: '應變',     en: 'Adapt to Change' },
  'inspire-soldiers':   { zh: '勵士',     en: 'Inspire the Soldiers' },
  'benevolence-root':   { zh: '仁本',     en: 'Benevolence as the Root (Sima Fa)' },
  'emperor-duty':       { zh: '天子之義', en: "The Emperor's Duty" },
  'set-ranks':          { zh: '定爵',     en: 'Set the Ranks' },
  'strict-position':    { zh: '嚴位',     en: 'Strict Discipline of Position' },
  'use-many':           { zh: '用眾',     en: 'Wield the Multitude' },
  'five-virtues':       { zh: '將之五善', en: "General's Five Virtues (Zhuge)" },
  'authority-war':      { zh: '兵權',     en: 'Authority Over Soldiers' },
  'know-nature':        { zh: '知人性',   en: 'Know Human Nature' },
  'when-not-fight':     { zh: '不戰之機', en: 'Know When Not to Fight' },
  'observe-general':    { zh: '觀將',     en: 'Observe Generals (Zhuge)' },
  'eagle-strike':       { zh: '鷹擊長空', en: 'Eagle Strikes the Sky' },
  'tiger-crouch':       { zh: '虎踞龍盤', en: 'Tiger Crouches, Dragon Coils' },
  'leopard-wolf':       { zh: '豹突狼奔', en: 'Leopard Lunges, Wolf Runs' },
  'crane-chickens':     { zh: '鶴立雞群', en: 'Crane Stands Among Chickens' },
  'snake-rat':          { zh: '蛇行鼠竄', en: 'Snake Slithers, Rat Scurries' },
  'bee-swarm':          { zh: '蜂擁而上', en: 'Swarm Like Bees' },
  'ant-siege':          { zh: '蟻附攻城', en: 'Ants Swarm the Walls' },
  'whale-silk':         { zh: '鯨吞蠶食', en: 'Whale-Swallow, Silkworm-Nibble' },
  'half-cross':         { zh: '半渡而擊', en: 'Strike When They Are Half-Crossed' },
  'array-wait':         { zh: '列陣以待', en: 'Array Lines and Wait' },
  'conserve-strength':  { zh: '養精蓄銳', en: 'Conserve Spirit, Store Strength' },
  'high-ground':        { zh: '居高臨下', en: 'Hold the High Ground' },
  'mountain-back':      { zh: '背山臨水', en: 'Mountain at Back, River in Front' },
  'intercept-relief':   { zh: '截擊援軍', en: 'Intercept the Relief Army' },
  'rush-supply':        { zh: '急襲糧道', en: 'Rush the Supply Road' },
  'feign-defeat':       { zh: '詐敗誘敵', en: 'Feign Defeat to Lure the Enemy' },
  'set-ambush-path':    { zh: '設伏要道', en: 'Set Ambush on the Vital Road' },
  'quick-night':        { zh: '速戰夜襲', en: 'Quick Strike Night Raid' },
  'star-reading':       { zh: '占星望氣', en: 'Read the Stars and Vital Airs' },
  'tortoise-shell':     { zh: '卜筮龜甲', en: 'Tortoise-Shell Divination' },
  'elements-counter':   { zh: '五行相剋', en: 'Five-Elements Counter' },
  talisman:             { zh: '護身符',   en: 'Talisman of Protection' },
  'summon-spirits':     { zh: '招神召將', en: 'Summon Spirits and Generals' },
  'julu-battle':        { zh: '鉅鹿之戰', en: 'Battle of Julu (Xiang Yu)' },
  'muye-battle':        { zh: '牧野之戰', en: 'Battle of Muye' },
  'chengpu-battle':     { zh: '城濮之戰', en: 'Battle of Chengpu' },
  'hanzhong-battle':    { zh: '漢中之戰', en: 'Battle of Hanzhong' },
  'lose-jieting':       { zh: '街亭失守', en: 'Lose Jieting (Ma Su)' },
  'zhao-yun-baby':      { zh: '趙雲懷主', en: "Zhao Yun Carries the Heir" },
  'huang-zhong-dingjun':{ zh: '黃忠定軍山', en: 'Huang Zhong at Dingjun Mountain' },
  'zhou-yu-plan':       { zh: '周郎妙計', en: "Zhou Yu's Brilliant Plan" },
  'seek-talent':        { zh: '求賢令',   en: 'Edict to Seek Talent (Cao Cao)' },
  'he-jin-blunder':     { zh: '何進召董', en: "He Jin Summons Dong Zhuo" },
  // ── Phase 62 ──
  'form-squads':        { zh: '束伍篇', en: 'Form Squads (Qi Jiguang)' },
  'drill-troops':       { zh: '操練篇', en: 'Drill the Troops' },
  'march-camp':         { zh: '行營篇', en: 'March-Camp Doctrine' },
  'field-camp':         { zh: '野營篇', en: 'Field-Camp Doctrine' },
  'inspect-army':       { zh: '校閱篇', en: 'Army Inspection' },
  'train-officers':     { zh: '練將篇', en: 'Train the Officers' },
  'use-blade':          { zh: '用刃篇', en: 'Bladework Doctrine' },
  'short-long':         { zh: '短器長用', en: 'Short Weapons Used Long' },
  'firearm-tactics':    { zh: '鳥銃篇', en: 'Firearm Tactics' },
  'banner-signals':     { zh: '揭旗篇', en: 'Banner Signals' },
  'cart-camp':          { zh: '車營制', en: "Cart-Camp System (Qi)" },
  'wolf-claw':          { zh: '狼筅陣', en: "Wolf-Claw Spear (Yu Dayou)" },
  'combat-awe':         { zh: '戰威', en: 'Combat Awe (Weiliaozi)' },
  'attack-authority':   { zh: '攻權', en: 'Authority in Attack' },
  'defense-authority':  { zh: '守權', en: 'Authority in Defense' },
  'general-command':    { zh: '將令', en: "General's Decree" },
  'soldier-command':    { zh: '兵令', en: "Soldier's Decree" },
  'upper-strategy':     { zh: '上略', en: 'Upper Strategy (Huang Shigong)' },
  'middle-strategy':    { zh: '中略', en: 'Middle Strategy' },
  'lower-strategy':     { zh: '下略', en: 'Lower Strategy' },
  'orth-extra-use':     { zh: '奇正之用', en: 'Use of Orthodox and Extraordinary' },
  'tang-li-arts':       { zh: '太宗武略', en: "Tang Taizong's Martial Arts" },
  'fan-lihua':          { zh: '樊梨花術', en: "Fan Lihua's Sorcery" },
  'mu-guiying':         { zh: '穆桂英陣', en: "Mu Guiying's Heavenly Door" },
  mulan:                { zh: '木蘭從軍', en: 'Mulan Joins the Army' },
  'sun-shangxiang':     { zh: '尚香擲戟', en: "Sun Shangxiang's Spear-Toss" },
  'huang-yueying':      { zh: '黃月英巧器', en: "Huang Yueying's Devices" },
  'lu-lingqi':          { zh: '呂玲綺斷流', en: "Lu Lingqi's Severing Stroke" },
  'ma-yunlu':           { zh: '馬雲祿夜襲', en: "Ma Yunlu's Night Raid" },
  'lady-zhurong-tac':   { zh: '祝融飛刀', en: "Lady Zhurong's Flying Knives" },
  'beans-to-soldiers':  { zh: '撒豆成兵', en: 'Scatter Beans, Summon Soldiers' },
  'ride-clouds':        { zh: '騰雲駕霧', en: 'Ride Clouds and Mist' },
  'wind-walk':          { zh: '御風行走', en: 'Walk on the Wind' },
  'mist-shroud':        { zh: '變幻雲霧', en: 'Conjure a Mist' },
  'jade-edict':         { zh: '玉皇敕令', en: "Jade Emperor's Decree" },
  'summon-gods':        { zh: '招神召將', en: 'Summon Gods and Generals' },
  'multi-body':         { zh: '化身百出', en: 'A Hundred Manifestations' },
  'gate-of-life':       { zh: '生門開啟', en: 'Open the Gate of Life' },
  'royal-way':          { zh: '王道征伐', en: 'Conquest by the Royal Way (Confucian)' },
  'daoist-wuwei':       { zh: '道家無為', en: 'Daoist Non-Action' },
  'legalist-strict':    { zh: '法家峻法', en: "Legalist Severity" },
  'mohist-defense':     { zh: '墨家非攻', en: 'Mohist Defense, Anti-Aggression' },
  'diplomat-debate':    { zh: '縱橫家辯', en: 'Diplomat-Strategist Debate' },
  'yinyang-divine':     { zh: '陰陽家占', en: 'Yin-Yang Divination' },
  'confucian-rite':     { zh: '儒家禮治', en: 'Confucian Rule by Rites' },
  'strategist-way':     { zh: '兵家詭道', en: 'Strategist Way of Deception' },
  'qi-cart-camp':       { zh: '戚家車營', en: "Qi Jiguang's Cart Camp" },
  'yu-wolf-claw':       { zh: '俞家狼筅', en: "Yu Dayou's Wolf-Claw" },
  'yuan-ningyuan':      { zh: '袁崇煥寧遠', en: "Yuan Chonghuan at Ningyuan" },
  'sun-guanning':       { zh: '孫承宗關寧', en: "Sun Chengzong's Guanning Line" },
  'zheng-taiwan':       { zh: '鄭成功收台', en: 'Zheng Chenggong Retakes Taiwan' },
  'dorgon-pass':        { zh: '多爾袞入關', en: 'Dorgon Enters the Pass' },
  'zuo-xinjiang':       { zh: '左宗棠新疆', en: "Zuo Zongtang's Xinjiang Campaign" },
  'lin-anti-opium':     { zh: '林則徐禁煙', en: "Lin Zexu's Anti-Opium Blockade" },
  'nian-rebellion':     { zh: '捻軍騎襲', en: 'Nian Rebel Mounted Raid' },
  'wu-sangui':          { zh: '吳三桂引清', en: 'Wu Sangui Opens the Pass' },
  'retreat-no-block':   { zh: '歸師勿遏', en: "Don't Block a Retreating Army" },
  'desperate-no-pursue':{ zh: '窮寇勿追', en: "Don't Pursue a Desperate Foe" },
  'siege-leave-gap':    { zh: '圍師必闕', en: 'Encircling, Always Leave a Gap' },
  'no-uphill-attack':   { zh: '高陵勿向', en: "Don't Attack Uphill" },
  'no-hillback-fight':  { zh: '背丘勿逆', en: "Don't Fight with a Hill at Your Back" },
  'no-bait-take':       { zh: '餌兵勿食', en: "Don't Take the Bait" },
  'no-elite-attack':    { zh: '銳卒勿攻', en: "Don't Attack the Elite Vanguard" },
  'half-formed-no-strike':{ zh: '半成勿擊', en: "Don't Strike a Half-Formed Army" },
  'avoid-strong-strike-weak':{ zh: '避實擊虛', en: 'Avoid Strength, Strike the Weak' },
  'silent-killer':      { zh: '靜中取勝', en: 'Victory in Stillness' },
  'feign-coward':       { zh: '示弱誘敵', en: 'Show Weakness to Lure' },
  'lone-wolf':          { zh: '孤狼戰術', en: 'Lone-Wolf Tactic' },
  'peach-garden-tac':   { zh: '桃園結義之力', en: 'Power of the Peach Garden Oath' },
  'whip-postman':       { zh: '怒鞭督郵', en: 'Whip the Inspector (Zhang Fei)' },
  'protect-people':     { zh: '攜民渡江', en: 'Liu Bei Brings the People Across' },
  'sun-quan-bow':       { zh: '孫權射虎', en: 'Sun Quan Shoots the Tiger' },
  'mi-fang-betray':     { zh: '糜芳投吳', en: 'Mi Fang Defects to Wu' },
  'wei-yan-back':       { zh: '魏延反骨', en: "Wei Yan's Bone of Treason" },
  'guan-yu-pardon':     { zh: '華容道義', en: 'Guan Yu Releases Cao at Huarong' },
  'zhang-fei-poker':    { zh: '張飛粗中有細', en: "Zhang Fei's Cunning Within Roughness" },
  'eight-immortals':    { zh: '八仙過海', en: 'Eight Immortals Cross the Sea' },
  'phoenix-rise':       { zh: '鳳凰涅槃', en: 'Phoenix Reborn from Ashes' },
  'dragon-claw':        { zh: '神龍擺尾', en: "Divine Dragon's Tail Sweep" },
  'turtle-shell':       { zh: '玄武龜甲', en: 'Black-Turtle Shell Defense' },
  'xiongnu-raid':       { zh: '匈奴突騎', en: 'Xiongnu Mounted Raid' },
  'qiang-horse':        { zh: '羌人騎射', en: 'Qiang Horse-Archery' },
  'wuhuan-mounted-tac': { zh: '烏丸突騎陣', en: 'Wuhuan Mounted Vanguard Tactic' },
  'shanyue-mountain':   { zh: '山越伏擊', en: 'Shanyue Mountain Ambush' },
  'wuge-rattan-tac':    { zh: '烏戈藤甲陣', en: 'Wuge Rattan-Armor Tactic' },
  'yellow-turban-mob':  { zh: '黃巾人海', en: 'Yellow-Turban Human Wave' },
  'black-mountain-bandit':{ zh: '黑山賊蜂起', en: 'Black-Mountain Bandit Swarm' },
  'water-bandit':       { zh: '水寇橫行', en: 'River Pirates Run Amok' },
  'sworn-brothers':     { zh: '結拜兄弟', en: 'Sworn-Brother Pact' },
  'rebel-uprising':     { zh: '揭竿而起', en: 'Raise the Banner of Rebellion' },
  // ── Phase 63 (100 new) ──
  'twin-spear':     { zh: '雙槍流', en: 'Twin-Spear School' },
  'long-halberd':   { zh: '長戟術', en: 'Long Halberd Art' },
  'twin-axe':       { zh: '雙斧法', en: 'Twin-Axe Style' },
  'short-blade':    { zh: '短刀絕技', en: 'Short-Blade Mastery' },
  'long-whip':      { zh: '長鞭舞', en: 'Long-Whip Dance' },
  'meteor-hammer':  { zh: '流星錘', en: 'Meteor Hammer' },
  'hidden-weapon':  { zh: '暗器手裡劍', en: 'Hidden Weapons' },
  'bagua-palm':     { zh: '八卦掌', en: 'Eight-Trigram Palm' },
  'whip-13':        { zh: '鞭法十三式', en: 'Thirteen Whip Forms' },
  'iron-sand-palm': { zh: '鐵砂掌', en: 'Iron-Sand Palm' },
  'flying-knife':   { zh: '飛刀術', en: 'Flying Knife' },
  'duck-axe':       { zh: '鴛鴦鉞', en: 'Mandarin-Duck Axes' },
  'crescent-shovel':{ zh: '月牙鏟', en: 'Crescent-Moon Shovel' },
  'hand-hook':      { zh: '護手鉤', en: 'Hand-Guard Hooks' },
  'iron-pipa':      { zh: '鐵琵琶', en: 'Iron Pipa (concealed weapon)' },
  'yi-jin-jing':    { zh: '易筋經', en: 'Yi Jin Jing' },
  'xi-sui-jing':    { zh: '洗髓經', en: 'Xi Sui Jing' },
  'nine-yin':       { zh: '九陰真經', en: 'Nine Yin Manual' },
  'nine-yang':      { zh: '九陽神功', en: 'Nine Yang Divine Skill' },
  'turtle-breath':  { zh: '龜息神功', en: 'Turtle-Breath Mastery' },
  'iron-shirt':     { zh: '鐵布衫', en: 'Iron Shirt' },
  'golden-bell':    { zh: '金鐘罩', en: 'Golden Bell' },
  'vajra-finger':   { zh: '大力金剛指', en: 'Vajra Finger' },
  'crane-stance':   { zh: '鶴翔樁', en: 'Crane Stance' },
  'child-kungfu':   { zh: '童子功', en: 'Child Body Mastery' },
  'caesar-cross':   { zh: '凱撒越境', en: 'Caesar Crosses the Rubicon' },
  'napoleon-flank': { zh: '拿破崙包抄', en: 'Napoleonic Encirclement' },
  'hannibal-cannae':{ zh: '漢尼拔坎尼', en: 'Hannibal at Cannae' },
  'macedonian-phalanx':{ zh: '馬其頓方陣', en: 'Macedonian Phalanx' },
  'mongol-whirlwind':{ zh: '蒙古旋風', en: 'Mongol Whirlwind' },
  'viking-raid':    { zh: '維京突襲', en: 'Viking Raid' },
  'roman-legion':   { zh: '羅馬軍團', en: 'Roman Legion' },
  'english-longbow':{ zh: '英格蘭長弓', en: 'English Longbow' },
  'greek-fire':     { zh: '希臘火', en: 'Greek Fire' },
  'spartan-300':    { zh: '斯巴達三百', en: 'Spartan 300' },
  'heavy-cav':      { zh: '重甲鐵騎', en: 'Heavy Armored Cavalry' },
  'light-cav':      { zh: '輕騎突擊', en: 'Light Cavalry Charge' },
  'sniper-bow':     { zh: '神弓隊', en: 'Sniper-Bow Squad' },
  'repeat-crossbow-cart':{ zh: '連弩車', en: 'Repeating-Crossbow Cart' },
  'siege-tower':    { zh: '攻城塔陣', en: 'Siege-Tower Formation' },
  'fire-boat':      { zh: '火攻船陣', en: 'Fire-Boat Fleet' },
  'heavy-foot':     { zh: '鐵塔重步', en: 'Iron-Tower Heavy Infantry' },
  'three-stage':    { zh: '弓馬槍三段', en: 'Three-Stage Bow-Cav-Spear' },
  'wandering-knight':{ zh: '浪人遊俠', en: 'Wandering Swordsmen' },
  'death-squad':    { zh: '死士隊', en: 'Death Squad' },
  'honor-guard':    { zh: '親衛精銳', en: 'Honor Guard Elite' },
  'mountain-militia':{ zh: '山民兵', en: 'Mountain Militia' },
  'mixed-barbarian':{ zh: '蕃漢兵', en: 'Mixed Han-Barbarian Force' },
  'boy-soldier':    { zh: '童子軍', en: 'Boy Soldiers' },
  'veteran-cohort': { zh: '老兵團', en: 'Veteran Cohort' },
  'burn-talisman':  { zh: '燒符引神', en: 'Burn Talisman, Summon Spirit' },
  'five-thunder-roof':{ zh: '五雷轟頂', en: 'Five Thunder Strikes the Roof' },
  'soul-snatch':    { zh: '攝魂奪魄', en: 'Soul-Snatching' },
  'gu-poison':      { zh: '蠱毒之術', en: 'Gu Poison' },
  'wood-puppet':    { zh: '木甲傀儡', en: 'Wooden Armor Puppet' },
  'reverse-soul':   { zh: '反魂香', en: 'Reverse-Soul Incense' },
  'long-sound':     { zh: '千里傳音', en: 'Thousand-Li Voice' },
  'mind-link':      { zh: '心電感應', en: 'Telepathic Bond' },
  'geomancy-formation':{ zh: '風水佈陣', en: 'Geomantic Formation' },
  'maoshan-rite':   { zh: '茅山道術', en: 'Maoshan Daoist Rite' },
  'faction-manipulate':{ zh: '黨爭操控', en: 'Faction Manipulation' },
  'regent-power':   { zh: '攝政專權', en: 'Regent Seizes Power' },
  'depose-elder':   { zh: '廢長立幼', en: 'Depose the Elder, Install the Young' },
  'imperial-inlaw': { zh: '外戚干政', en: 'Imperial In-Laws Meddle' },
  'eunuch-power':   { zh: '宦官弄權', en: 'Eunuchs Hold the Power' },
  'false-edict':    { zh: '矯詔行事', en: 'Forge an Imperial Edict' },
  'court-debate':   { zh: '廷議辯論', en: 'Court Debate' },
  'petition-campaign':{ zh: '民眾請願', en: 'Popular Petition' },
  'rumor-spread':   { zh: '流言惑眾', en: 'Spread Rumors' },
  'smear-opponent': { zh: '抹黑對手', en: 'Smear the Opponent' },
  'wang-lang-cursed':{ zh: '王朗罵死諸葛', en: 'Zhuge Curses Wang Lang to Death' },
  'pang-de-coffin': { zh: '龐德抬棺', en: 'Pang De Brings His Own Coffin' },
  'six-expeditions':{ zh: '諸葛六出祁山', en: 'Zhuge Six Times to Mount Qi' },
  'sima-eight':     { zh: '司馬八陣', en: "Sima Yi's Eight-Array Counter" },
  'le-jin-raid':    { zh: '樂進偷襲', en: 'Le Jin Night Raid' },
  'zhang-liao-xiaoyao':{ zh: '張遼威震逍遙津', en: 'Zhang Liao Shakes Xiaoyao Crossing' },
  'gan-ning-100':   { zh: '甘寧百騎劫營', en: "Gan Ning's 100-Horse Raid" },
  'taishi-ci-vs-sunce':{ zh: '太史慈鬥孫策', en: 'Tai Shi Ci Duels Sun Ce' },
  'zhao-yun-courage':{ zh: '趙雲一身是膽', en: 'Zhao Yun Is Made of Courage' },
  'ma-chao-han-sui':{ zh: '錦袍韓遂', en: 'Ma Chao Brocade Robe vs Han Sui' },
  'huang-gai-fake': { zh: '黃蓋詐降', en: "Huang Gai's False Surrender" },
  'zhou-cang-blade':{ zh: '周倉扛刀', en: 'Zhou Cang Bears the Blade' },
  'wuchao-grain':   { zh: '烏巢糧倉', en: 'Burn the Wuchao Granary' },
  'cao-cao-mengjin':{ zh: '曹操過孟津', en: 'Cao Cao Crosses Mengjin' },
  'lu-bu-yuan-gate':{ zh: '呂布轅門射戟', en: 'Lu Bu Splits a Halberd at the Gate' },
  'iron-guard':     { zh: '親軍鐵衛', en: 'Iron-Sworn Personal Guard' },
  'ballista-emplace':{ zh: '弩砲陣地', en: 'Ballista Emplacement' },
  'feather-arrow':  { zh: '鳥羽箭隊', en: 'Feathered-Arrow Squad' },
  'chain-mail-foot':{ zh: '鎖子甲步兵', en: 'Chain-Mail Infantry' },
  'wooden-ox-mk2':  { zh: '木牛流馬改', en: 'Wooden-Ox Mk II' },
  'zhuge-bow-mk2':  { zh: '諸葛弩改', en: 'Zhuge Crossbow Mk II' },
  'thousand-arrows':{ zh: '連弩萬箭', en: 'Ten-Thousand Arrows' },
  'chain-machines': { zh: '連環機關', en: 'Chained War Machines' },
  'fire-crow':      { zh: '神火飛鴉', en: 'Divine Fire Crow' },
  'one-nest-bees':  { zh: '一窩蜂', en: "Hornet's Nest Rocket Battery" },
  'sky-fire-crow':  { zh: '神火鴉', en: 'Sky-Fire Crow Rocket' },
  'cannon-man-slayer':{ zh: '萬人敵', en: 'Ten-Thousand-Man Slayer Cannon' },
  'red-cannon':     { zh: '紅夷大炮', en: 'Red-Barbarian Cannon' },
  'iron-cart-train':{ zh: '鐵車連營', en: 'Iron-Cart Linked Camp' },
  'flame-thrower':  { zh: '猛火油櫃', en: 'Naphtha Flame-Thrower' },
  // ── Phase 64 (200 new) ──
  zhuolu:{zh:'涿鹿之戰',en:'Battle of Zhuolu'}, dazexiang:{zh:'大澤鄉起義',en:'Daze Uprising'},
  'chu-han':{zh:'楚漢相爭',en:'Chu-Han Contention'}, 'mobei-battle':{zh:'漠北之戰',en:'Battle of Mobei'},
  feishui:{zh:'淝水之戰',en:'Battle of Feishui'}, 'sui-chen':{zh:'隋滅陳',en:'Sui Conquers Chen'},
  xuanwumen:{zh:'玄武門之變',en:'Xuanwumen Incident'}, anshi:{zh:'安史之亂',en:'An-Shi Rebellion'},
  huangchao:{zh:'黃巢之亂',en:'Huang Chao Rebellion'}, chanyuan:{zh:'澶淵之盟',en:'Treaty of Chanyuan'},
  jingkang:{zh:'靖康之恥',en:'Jingkang Incident'}, 'fishing-castle':{zh:'釣魚城',en:'Diaoyu Castle'},
  'mongol-song':{zh:'蒙古滅宋',en:'Mongol Destroys Song'}, 'poyang-lake':{zh:'鄱陽湖',en:'Battle of Lake Poyang'},
  tumu:{zh:'土木堡',en:'Tumu Crisis'}, 'beijing-defense':{zh:'北京保衛戰',en:'Defense of Beijing'},
  'wanli-three':{zh:'萬曆三大征',en:"Wanli's Three Campaigns"}, sarhu:{zh:'薩爾滸',en:'Battle of Sarhu'},
  ningjin:{zh:'寧錦大捷',en:'Ningjin Victory'}, 'yangzhou-ten':{zh:'揚州十日',en:'Yangzhou Ten Days'},
  'jiading-three':{zh:'嘉定三屠',en:'Three Massacres at Jiading'}, 'three-feudatories':{zh:'平定三藩',en:'Pacify Three Feudatories'},
  yaksa:{zh:'雅克薩',en:'Battle of Yaksa'}, 'ulan-butong':{zh:'烏蘭布通',en:'Battle of Ulan Butong'},
  'mengjin-cross':{zh:'孟津渡',en:'Cross at Mengjin'}, 'mawei-slope':{zh:'馬尾坡',en:"Slope at Mawei"},
  'dingjun-mtn':{zh:'定軍山',en:'Mount Dingjun'}, 'jieting-loss':{zh:'街亭之失',en:'Loss of Jieting'},
  'wuzhang-fall':{zh:'五丈原',en:'Wuzhang Plain'}, 'jincheng-defend':{zh:'金城守',en:'Defense of Jincheng'},
  'shangfang-valley':{zh:'上方谷',en:'Shangfang Valley'}, 'yiling-fire':{zh:'夷陵火',en:'Yiling Fire'},
  'hefei-defense':{zh:'合肥守',en:'Defense of Hefei'}, 'jiameng-pass':{zh:'葭萌關',en:'Jiameng Pass'},
  'xiapi-flood':{zh:'下邳水淹',en:'Flood Xiapi'}, 'jingzhou-fall':{zh:'荊州失',en:'Fall of Jingzhou'},
  'fancheng-flood':{zh:'樊城水淹',en:'Flood Fancheng'}, 'changban-bridge':{zh:'長坂橋',en:'Changban Bridge'},
  'guandu-grain':{zh:'官渡糧',en:'Guandu Granary'}, 'red-cliffs-wind':{zh:'赤壁東風',en:'Red Cliffs East Wind'},
  'han-xin-count':{zh:'韓信點兵',en:'Han Xin Counts the Troops'},
  'xiang-yu-horse':{zh:'項羽烏騅',en:"Xiang Yu's Wuzhui Horse"},
  'fan-li-retire':{zh:'范蠡退隱',en:'Fan Li Retires'}, 'lian-po-thorn':{zh:'廉頗負荊',en:'Lian Po Bears Thorns'},
  'zhao-she-vs-zhao':{zh:'趙奢戰韓',en:'Zhao She vs Han'}, 'wang-jian-six':{zh:'王翦掃六合',en:'Wang Jian Sweeps Six States'},
  'zhou-yafu':{zh:'周亞夫細柳',en:'Zhou Yafu at Xiliu'}, 'wei-qing-north':{zh:'衛青漠北',en:'Wei Qing North'},
  'ban-chao-far':{zh:'班超遠征',en:'Ban Chao Far West'}, 'ma-yuan-coffin':{zh:'馬援裹屍',en:'Ma Yuan Wrapped in Horse-Hide'},
  'deng-yu-zhongxing':{zh:'鄧禹中興',en:'Deng Yu Restores Han'}, 'kou-xun-henei':{zh:'寇恂河內',en:'Kou Xun at Henei'},
  'feng-yi-cart':{zh:'馮異車戰',en:'Feng Yi Cart War'}, 'du-yu-bamboo':{zh:'杜預破竹',en:'Du Yu Splits Bamboo'},
  'xie-xuan-8k':{zh:'謝玄八千',en:"Xie Xuan's 8000"}, 'liu-yu-north':{zh:'劉裕北伐',en:'Liu Yu Northern Campaign'},
  'wei-rui-liang':{zh:'韋叡梁將',en:'Wei Rui of Liang'}, 'yang-su-chen':{zh:'楊素破陳',en:'Yang Su Breaks Chen'},
  'han-qinhu-cross':{zh:'韓擒虎渡江',en:'Han Qinhu Crosses the River'}, 'li-jing-turk':{zh:'李靖破突厥',en:'Li Jing Crushes Turks'},
  'guo-ziyi-lone':{zh:'郭子儀單騎',en:'Guo Ziyi Rides Alone'}, 'yue-fei-yan':{zh:'岳飛槍法',en:"Yue Fei's Spear Art"},
  'han-shizhong-water':{zh:'韓世忠水戰',en:'Han Shizhong Naval Victory'}, 'wu-jie-mtn':{zh:'吳玠和尚原',en:'Wu Jie at Heshangyuan'},
  'meng-gong-defend':{zh:'孟珙守城',en:'Meng Gong Defends'}, 'zhang-shijie-naval':{zh:'張世傑海戰',en:'Zhang Shijie Naval'},
  'qi-jiguang-wokou':{zh:'戚繼光抗倭',en:'Qi Jiguang vs Wokou'}, 'yu-dayou-fujian':{zh:'俞大猷福建',en:'Yu Dayou Fujian'},
  'li-rusong-korea':{zh:'李如松援朝',en:'Li Rusong Aids Korea'}, 'song-yingchang-korea':{zh:'宋應昌朝鮮',en:'Song Yingchang in Korea'},
  'mao-wenlong-pidao':{zh:'毛文龍皮島',en:'Mao Wenlong at Pidao'}, 'lu-xiangsheng':{zh:'盧象升戰清',en:'Lu Xiangsheng vs Qing'},
  'sun-chuanting-tang':{zh:'孫傳庭潼關',en:'Sun Chuanting at Tongguan'}, 'shi-kefa-yangzhou':{zh:'史可法揚州',en:'Shi Kefa Yangzhou'},
  'zheng-zhilong-sea':{zh:'鄭芝龍海',en:'Zheng Zhilong Sea Lord'}, 'liu-mingchuan-taiwan':{zh:'劉銘傳台灣',en:'Liu Mingchuan Taiwan'},
  'feng-zicai-zhennan':{zh:'馮子材鎮南關',en:'Feng Zicai at Zhennan'}, 'nie-shicheng-tianjin':{zh:'聶士成天津',en:'Nie Shicheng Tianjin'},
  'duan-qirui-anhui':{zh:'段祺瑞皖派',en:'Duan Qirui Anhui Clique'}, 'feng-yuxiang-xian':{zh:'馮玉祥西安',en:"Feng Yuxiang's Xi'an"},
  'jin-school':{zh:'晉派兵法',en:'Jin School of War'}, 'han-school':{zh:'漢派兵法',en:'Han School'},
  'wu-school':{zh:'吳派兵法',en:'Wu School'}, 'shu-school':{zh:'蜀派兵法',en:'Shu School'},
  'wei-school':{zh:'魏派兵法',en:'Wei School'}, 'yue-school':{zh:'越派兵法',en:'Yue School'},
  'qin-school':{zh:'秦派兵法',en:'Qin School'}, 'chu-school':{zh:'楚派兵法',en:'Chu School'},
  'qi-school':{zh:'齊派兵法',en:'Qi School'}, 'yan-school':{zh:'燕派兵法',en:'Yan School'},
  'mongol-school':{zh:'蒙古派',en:'Mongol School'}, 'persian-school':{zh:'波斯派',en:'Persian School'},
  'japan-school':{zh:'日本派',en:'Japanese School'}, 'korean-school':{zh:'朝鮮派',en:'Korean School'},
  'india-school':{zh:'天竺派',en:'Indian School'}, 'tibet-school':{zh:'吐蕃派',en:'Tibetan School'},
  'manchu-school':{zh:'滿洲派',en:'Manchu School'}, 'tangut-school':{zh:'西夏派',en:'Tangut School'},
  'jurchen-school':{zh:'女真派',en:'Jurchen School'}, 'khitan-school':{zh:'契丹派',en:'Khitan School'},
  'lubu-flying':{zh:'呂布飛將',en:'Lu Bu Flying General'}, 'guanyu-greendragon':{zh:'關羽青龍',en:"Guan Yu's Green Dragon"},
  'zhangfei-yelling':{zh:'張飛吼喝',en:"Zhang Fei's Roar"}, 'zhaoyun-shadow':{zh:'趙雲幻影',en:"Zhao Yun's Shadow"},
  'machao-spear':{zh:'馬超銀槍',en:"Ma Chao's Silver Spear"}, 'huangzhong-bow':{zh:'黃忠寶弓',en:"Huang Zhong's Treasured Bow"},
  'weiyan-charge':{zh:'魏延突進',en:"Wei Yan's Charge"}, 'jiangwei-disciple':{zh:'姜維傳人',en:"Jiang Wei the Disciple"},
  'caocao-poetry':{zh:'曹操詩才',en:"Cao Cao's Poetry"}, 'xiahoudun-eye':{zh:'夏侯惇獨眼',en:"Xiahou Dun's Eye"},
  'dianwei-double-axe':{zh:'典韋雙戟',en:"Dian Wei's Twin Halberds"}, 'xuchu-iron-fist':{zh:'許褚虎癡',en:"Xu Chu the Tiger"},
  'zhanghe-mobility':{zh:'張郃機動',en:"Zhang He's Mobility"}, 'zhanglao-ambush':{zh:'張遼伏擊',en:"Zhang Liao Ambush"},
  'panghong-sleep':{zh:'龐統假寐',en:'Pang Tong Plays Drunk'}, 'simayi-tortoise':{zh:'司馬龜縮',en:'Sima Yi Turtles'},
  'sunce-blade':{zh:'孫策小霸王',en:'Sun Ce Little Conqueror'}, 'sunquan-blue-eye':{zh:'孫權碧眼',en:"Sun Quan Blue-Eyed"},
  'zhouyu-music':{zh:'周郎曲誤',en:"Zhou Yu's Music"}, 'lumeng-study':{zh:'呂蒙刮目',en:'Lu Meng Studies'},
  'luxun-fire':{zh:'陸遜火攻',en:"Lu Xun's Fire"}, 'taishici-arch':{zh:'太史慈射箭',en:'Tai Shi Ci Archer'},
  'huanggai-old':{zh:'黃蓋老將',en:'Huang Gai Old General'}, 'gan-ning-bell':{zh:'甘寧鈴聲',en:"Gan Ning's Bell"},
  'zhuge-fan':{zh:'諸葛羽扇',en:"Zhuge's Feather Fan"}, 'pang-tong-chain':{zh:'龐統連環',en:"Pang Tong's Chain"},
  'fazheng-strategy':{zh:'法正謀略',en:"Fa Zheng's Strategy"}, 'huangzhong-old-bow':{zh:'黃忠老當益壯',en:'Huang Zhong Stronger With Age'},
  'jiang-ji-loyalty':{zh:'蔣濟忠誠',en:"Jiang Ji's Loyalty"}, 'wenping-shield':{zh:'文聘盾陣',en:"Wen Pin's Shield"},
  'yuejin-light':{zh:'樂進輕兵',en:"Le Jin Light Infantry"}, 'lidian-scholar':{zh:'李典儒將',en:'Li Dian Scholar-General'},
  'liu-bei-tears':{zh:'劉備淚水',en:"Liu Bei's Tears"}, 'sun-jian-tiger':{zh:'孫堅猛虎',en:'Sun Jian the Tiger'},
  'yuan-shao-noble':{zh:'袁紹貴族',en:'Yuan Shao Aristocrat'}, 'yuan-shu-jade':{zh:'袁術玉璽',en:'Yuan Shu Imperial Seal'},
  'gongsun-zan-white':{zh:'公孫瓚白馬',en:'Gongsun Zan White Horse'}, 'dong-zhuo-tyrant':{zh:'董卓暴政',en:'Dong Zhuo Tyrant'},
  'wang-yun-plot':{zh:'王允連環',en:"Wang Yun's Plot"}, 'cao-zhi-poem':{zh:'曹植七步',en:'Cao Zhi Seven Steps'},
  'tunnel-warfare':{zh:'地道戰',en:'Tunnel Warfare'}, 'pontoon-bridge':{zh:'浮橋',en:'Pontoon Bridge'},
  'mining-walls':{zh:'挖牆',en:'Mining Walls'}, 'gate-tower':{zh:'城門樓',en:'Gate Tower'},
  'arrow-tower':{zh:'箭樓',en:'Arrow Tower'}, 'wall-corner':{zh:'敵樓',en:'Wall-Corner Bastion'},
  'moat-deep':{zh:'深溝',en:'Deep Moat'}, caltrops:{zh:'蒺藜',en:'Caltrops'},
  'ballista-tower':{zh:'弩樓',en:'Ballista Tower'}, 'fire-arrow-tower':{zh:'火箭樓',en:'Fire-Arrow Tower'},
  'cauldron-oil':{zh:'熱油鍋',en:'Boiling Oil'}, 'rolling-logs':{zh:'滾木',en:'Rolling Logs'},
  'spike-pit':{zh:'刺穴',en:'Spike Pit'}, 'iron-stakes':{zh:'鐵蒺藜',en:'Iron Stakes'},
  'observation-tower':{zh:'望樓',en:'Observation Tower'},
  'fake-letter':{zh:'偽書信',en:'Forged Letter'}, 'planted-spy':{zh:'潛伏間諜',en:'Planted Spy'},
  'reverse-spy':{zh:'反間之計',en:'Reverse-Spy Plot'}, 'turn-defector':{zh:'策反',en:'Turn the Defector'},
  'morale-collapse':{zh:'士氣崩潰',en:'Morale Collapse'}, 'banner-burn':{zh:'焚旗',en:'Burn the Banner'},
  'name-call':{zh:'指名點殺',en:'Call Names to Demoralize'}, 'mass-execution':{zh:'處決恐嚇',en:'Mass Execution'},
  'mercy-show':{zh:'示恩懷柔',en:'Show Mercy'}, 'hostage-display':{zh:'懸首示眾',en:'Display Hostage'},
  'public-feast':{zh:'設宴款軍',en:'Public Feast'}, 'rumor-defection':{zh:'謠言叛亂',en:'Rumor of Defection'},
  'shame-disgrace':{zh:'羞辱降將',en:'Shame the Defeated'}, 'ancestor-mock':{zh:'辱其先祖',en:'Mock Their Ancestors'},
  'family-threat':{zh:'家眷威脅',en:'Threaten the Family'},
  'salt-monopoly':{zh:'鹽鐵專營',en:'Salt Monopoly'}, 'iron-monopoly':{zh:'鐵專營',en:'Iron Monopoly'},
  'tea-trade':{zh:'茶馬貿易',en:'Tea-Horse Trade'}, 'silk-road':{zh:'絲綢之路',en:'Silk Road'},
  'mint-coin':{zh:'鑄幣',en:'Mint Coinage'}, 'tax-cut':{zh:'輕徭薄賦',en:'Tax Cut'},
  'land-reform':{zh:'均田',en:'Land Equalization'}, 'merchant-tax':{zh:'商稅',en:'Merchant Tax'},
  'tribute-system':{zh:'朝貢',en:'Tribute System'}, 'forge-currency':{zh:'偽造錢幣',en:'Forge Currency'},
  'spy-network':{zh:'間諜網',en:'Spy Network'}, 'double-agent':{zh:'雙面間諜',en:'Double Agent'},
  'sleeper-cell':{zh:'潛伏細胞',en:'Sleeper Cell'}, 'dead-drop':{zh:'死信箱',en:'Dead Drop'},
  'fake-defector':{zh:'假降',en:'Fake Defector'}, 'court-bribery':{zh:'宮廷賄賂',en:'Court Bribery'},
  'maid-spy':{zh:'侍女間諜',en:'Maid Spy'}, 'letter-intercept':{zh:'截獲書信',en:'Intercept Letters'},
  'signal-flag':{zh:'信號旗',en:'Signal Flags'}, 'carrier-pigeon':{zh:'信鴿',en:'Carrier Pigeon'},
  'sun-ce-mirror':{zh:'孫策鏡破',en:'Sun Ce Mirror Break'}, 'cao-rui-vase':{zh:'曹叡奢華',en:'Cao Rui Luxury'},
  'liu-shan-stupid':{zh:'劉禪庸主',en:'Liu Shan Mediocre Lord'}, 'da-qiao-marriage':{zh:'大喬聯姻',en:'Da Qiao Marriage'},
  'dong-zhuo-fat':{zh:'董卓肥油',en:"Dong Zhuo's Fat"}, 'lu-zhi-master':{zh:'盧植師教',en:'Lu Zhi Teaches'},
  'cai-yong-lute':{zh:'蔡邕焦尾',en:"Cai Yong's Burnt-Tail Lute"}, 'mi-heng-drum':{zh:'禰衡擊鼓',en:'Mi Heng Drums'},
  'zhang-jiao-yellow':{zh:'張角黃天',en:'Zhang Jiao Yellow Heaven'}, 'zhang-lu-rice':{zh:'張魯五斗',en:'Zhang Lu Five Pecks'},
};

export const OFFICER_TACTICS: Record<string, TacticId[]> = {
  // ─── 蜀 Shu ───
  'liu-bei':        ['peach-garden-tac', 'sworn-brothers', 'protect-people', 'liu-bei-tears', 'liu-bei-share-meat', 'seek-talent', 'rouse'],
  'guan-yu':        ['guanyu-greendragon', 'warm-wine', 'lone-blade', 'guan-yu-pardon', 'thousand-ride', 'pass-six', 'charge', 'volley'],
  'zhang-fei':      ['zhangfei-yelling', 'changban-bridge', 'whip-postman', 'three-fight-lubu', 'long-halberd', 'charge', 'rouse', 'curse'],  // 丈八蛇矛 + 大粗哥粗暴
  'zhao-yun':       ['changban', 'zhaoyun-shadow', 'zhao-yun-courage', 'zhao-yun-baby', 'twin-spear', 'iron-shirt', 'charge', 'rouse', 'ambush'],  // 龍膽槍 + 一身是膽
  'ma-chao':        ['machao-spear', 'twin-spear', 'charge', 'rouse', 'ambush'],
  'huang-zhong':    ['huangzhong-bow', 'huangzhong-old-bow', 'dingjun-mtn', 'volley', 'charge', 'fire-arrow'],
  'zhuge-liang':    ['seven-grab', 'borrow-wind', 'borrow-arrow', 'star-prayer', 'seven-lamp', 'longzhong', 'zhuge-bow', 'burn-bowang', 'burn-xinye', 'six-expeditions', 'wooden-ox', 'memorial', 'tearful-ma', 'eight-gates', 'fire-attack'],
  'pang-tong':      ['pang-tong-chain', 'chain-ship', 'fire-attack', 'ruse', 'pitfall', 'attack-plans', 'panghong-sleep'],
  'fa-zheng':       ['attack-plans', 'ruse', 'pitfall', 'ambush'],
  'jiang-wei':      ['six-expeditions', 'ruse', 'pitfall', 'fire-attack', 'ambush', 'charge'],
  'wei-yan':        ['charge', 'ambush', 'rouse', 'twin-spear'],
  'ma-su':          ['attack-heart', 'ruse', 'attack-plans'],
  'liu-shan':       ['liu-shan-stupid'],
  'guan-ping':      ['charge', 'volley', 'rouse'],
  'guan-xing':      ['charge', 'volley'],
  'zhang-bao':      ['charge', 'rouse'],
  'lady-huang':     ['huang-yueying', 'catapult', 'zhuge-bow'],
  'lady-sun':       ['sun-shangxiang', 'charge', 'volley'],
  'ma-liang':       ['attack-plans', 'protect-people', 'court-debate'],
  'liao-hua':       ['charge', 'rouse', 'volley'],
  'jiang-wan':      ['attack-plans', 'court-debate', 'seek-talent'],
  'fei-yi':         ['court-debate', 'tongue-war', 'attack-plans'],
  'dong-yun':       ['court-debate', 'attack-plans'],
  'jian-yong':      ['tongue-war', 'court-debate'],
  'sun-qian':       ['tongue-war', 'court-debate'],
  'mi-zhu':         ['salt-monopoly', 'tea-trade', 'silk-road'],
  'xu-shu':         ['ruse', 'pitfall', 'attack-plans', 'ambush'],
  'huo-jun':        ['charge', 'iron-wall', 'last-stand', 'rouse'],  // 葭萌關死守

  // ─── 魏 Wei ───
  'cao-cao':        ['caocao-poetry', 'plum-wine', 'plum-thirst', 'seek-talent', 'wuchao-grain', 'two-tigers', 'lure-tiger-wolf', 'fire-attack', 'ambush', 'rouse'],
  'guo-jia':        ['two-tigers', 'lure-tiger-wolf', 'fire-attack', 'ambush', 'ruse', 'attack-plans'],
  'jia-xu':         ['ruse', 'ambush', 'fire-attack', 'pitfall', 'two-tigers'],
  'xun-yu':         ['seek-talent', 'attack-plans', 'attack-heart', 'ruse'],
  'xun-you':        ['ruse', 'ambush', 'pitfall', 'attack-plans'],
  'sima-yi':        ['simayi-tortoise', 'feign-illness', 'sima-eight', 'ruse', 'pitfall', 'attack-plans', 'lure-tiger-wolf', 'fire-attack'],
  'sima-shi':       ['ruse', 'ambush', 'attack-plans', 'rouse'],
  'sima-zhao':      ['ruse', 'ambush', 'attack-plans', 'fire-attack'],
  'deng-ai':        ['attack-plans', 'ambush', 'charge', 'ruse'],
  'zhang-liao':     ['zhang-liao-xiaoyao', 'charge', 'ambush', 'rouse', 'volley'],
  'dian-wei':       ['dianwei-double-axe', 'twin-axe', 'charge', 'rouse'],
  'xu-chu':         ['xuchu-iron-fist', 'iron-sand-palm', 'charge', 'rouse'],
  'cao-ren':        ['rouse', 'volley', 'charge', 'iron-wall'],
  'cao-hong':       ['charge', 'rouse'],
  'cao-zhang':      ['charge', 'rouse', 'twin-axe'],
  'cao-pi':         ['seek-talent', 'court-debate', 'faction-manipulate'],
  'cao-zhi':        ['cao-zhi-poem', 'court-debate'],
  'cao-rui':        ['cao-rui-vase', 'court-debate', 'faction-manipulate'],
  'hao-zhao':       ['volley', 'catapult', 'iron-wall', 'last-stand'],
  'xu-huang':       ['charge', 'ambush', 'attack-plans'],
  'zhang-he':       ['charge', 'ambush', 'volley'],
  'pang-de':        ['charge', 'volley', 'self-injury'],
  'yu-jin':         ['charge', 'rouse'],
  'cheng-yu':       ['ruse', 'ambush', 'attack-plans'],
  'man-chong':      ['charge', 'attack-plans'],
  'liu-ye':         ['ruse', 'attack-plans'],
  // ─── Wei generals (Xiahou clan + Five Generals + later officers) ──
  'xiahou-dun':     ['charge', 'rouse', 'lone-blade', 'self-injury', 'iron-shirt'],  // 拔矢啖睛
  'xiahou-yuan':    ['charge', 'volley', 'thousand-ride', 'huangzhong-bow'],          // killed at Mt Dingjun
  'xiahou-ba':      ['charge', 'rouse', 'ambush'],
  'xiahou-shang':   ['charge', 'volley'],
  'le-jin':         ['charge', 'le-jin-raid', 'ambush'],
  'li-dian':        ['charge', 'rouse', 'ambush'],
  'zang-ba':        ['charge', 'volley'],
  'cao-xiu':        ['charge', 'rouse'],
  'cao-zhen':       ['charge', 'rouse', 'iron-wall'],
  'cao-chun':       ['charge', 'thousand-ride'],  // 虎豹騎
  'guo-huai':       ['charge', 'attack-plans', 'iron-wall'],
  'wen-pin':        ['charge', 'rouse', 'iron-wall'],
  'tian-yu':        ['charge', 'ambush', 'wind-forest'],
  'wang-lang':      ['tongue-war', 'court-debate', 'faction-manipulate'],
  'hua-xin':        ['court-debate', 'faction-manipulate'],
  'chen-qun':       ['court-debate', 'attack-plans', 'faction-manipulate'],  // 九品中正
  'yang-xiu':       ['ruse', 'attack-plans', 'court-debate'],
  'zhong-hui':      ['attack-plans', 'ambush', 'ruse', 'fire-attack'],
  'mao-jie':        ['attack-plans', 'court-debate'],

  // ─── 吳 Wu ───
  'sun-jian':       ['sun-jian-tiger', 'charge', 'rouse', 'ambush'],
  'sun-ce':         ['sunce-blade', 'sun-ce-mirror', 'charge', 'rouse', 'twin-spear', 'thousand-ride'],  // 江東小霸王 + 鏡破
  'sun-quan':       ['sunquan-blue-eye', 'sun-quan-bow', 'seek-talent', 'court-debate', 'protect-people', 'tongue-war'],
  'zhou-yu':        ['burn-chibi', 'zhou-yu-plan', 'zhouyu-music', 'chain-ship', 'fire-attack', 'rouse', 'attack-plans', 'tongue-war'],  // 智激孫權出兵
  'lu-xun':         ['luxun-fire', 'burn-yiling', 'fire-attack', 'ruse', 'ambush', 'pitfall'],
  'lu-meng':        ['white-robe', 'lumeng-study', 'ambush', 'ruse', 'charge', 'attack-plans'],
  'lu-su':          ['attack-plans', 'tongue-war', 'seek-talent'],
  'zhang-zhao':     ['court-debate', 'tongue-war', 'faction-manipulate'],
  'gan-ning':       ['gan-ning-100', 'gan-ning-bell', 'charge', 'ambush', 'water-bandit'],
  'huang-gai':      ['self-injury', 'fire-attack', 'charge', 'rouse'],
  'cheng-pu':       ['charge', 'rouse', 'attack-plans'],
  'han-dang':       ['charge', 'volley'],
  'ling-tong':      ['charge', 'rouse'],
  'zhou-tai':       ['charge', 'last-stand', 'iron-shirt'],
  'da-qiao':        ['da-qiao-marriage', 'court-debate'],
  'xiao-qiao':      ['da-qiao-marriage'],
  'zhurong':        ['lady-zhurong-tac', 'charge', 'ambush'],
  'meng-huo':       ['charge', 'rouse', 'water-bandit'],
  'shamoke':        ['charge', 'fire-arrow'],
  // ─── More Wu officers ──
  'taishi-ci':      ['taishi-ci-vs-sunce', 'charge', 'volley', 'rouse'],
  'jiang-qin':      ['charge', 'volley'],
  'zhu-ran':        ['charge', 'ambush', 'rouse'],
  'ding-feng':      ['charge', 'volley', 'iron-shirt'],
  'pan-zhang':      ['charge', 'ambush'],
  'zhu-zhi':        ['charge', 'rouse'],
  'zhu-huan':       ['charge', 'attack-plans'],
  'zhang-hong':     ['court-debate', 'attack-plans'],
  'gu-yong':        ['court-debate', 'attack-plans', 'tongue-war'],
  'bu-zhi':         ['court-debate'],
  'zhuge-jin':      ['tongue-war', 'court-debate', 'attack-plans'],
  'zhuge-ke':       ['ruse', 'ambush', 'attack-plans'],
  'sun-jun':        ['charge', 'ambush', 'faction-manipulate'],
  'sun-shao':       ['charge', 'volley'],
  'lu-kang':        ['attack-plans', 'iron-wall', 'rouse'],     // Lu Xun's son
  'lu-ji':          ['attack-plans', 'court-debate'],

  // ─── 群雄 Other Warlords ───
  'yuan-shao':      ['yuan-shao-noble', 'rouse', 'charge', 'court-debate'],
  'yuan-shu':       ['yuan-shu-jade', 'imperial-inlaw'],
  'gongsun-zan':    ['gongsun-zan-white', 'charge', 'volley', 'rouse'],
  'liu-biao':       ['rouse', 'protect-people', 'court-debate'],
  'liu-zhang':      ['court-debate'],
  'wang-yun':       ['wang-yun-plot', 'diaochan', 'faction-manipulate', 'court-debate'],
  'dong-zhuo':      ['dong-zhuo-fat', 'dong-zhuo-tyrant', 'charge', 'eunuch-power'],
  'lu-bu':          ['lubu-flying', 'lu-bu-yuan-gate', 'three-fight-lubu', 'long-halberd', 'thousand-ride', 'charge', 'rouse', 'ambush'],  // 方天畫戟 + 赤兔馬
  'diaochan':       ['diaochan', 'beauty', 'two-tigers'],   // 連環美人計
  'cai-yong':       ['cai-yong-lute', 'court-debate', 'memorial', 'seek-talent'],   // 飛白書 + 焦尾琴 + 漢史
  'cai-wenji':      ['cai-yong-lute', 'chu-songs', 'mi-heng-drum', 'attack-heart'],  // 悲憤詩 + 胡笳十八拍
  'mi-heng':        ['mi-heng-drum', 'tongue-war', 'court-debate'],                  // 擊鼓罵曹
  'tian-feng':      ['ruse', 'pitfall', 'attack-plans'],
  'ju-shou':        ['ruse', 'rouse', 'attack-plans'],
  'shen-pei':       ['volley', 'catapult', 'iron-wall'],
  'wen-chou':       ['charge', 'twin-spear'],
  'yan-liang':      ['charge', 'long-halberd'],
  'gao-shun':       ['charge', 'iron-wall', 'last-stand'],
  'chen-gong':      ['ruse', 'pitfall', 'attack-plans'],
  // ─── Yuan clan & their advisors ──
  'yuan-tan':       ['charge', 'rouse', 'court-debate'],
  'yuan-shang':     ['charge', 'rouse'],
  'yuan-xi':        ['charge'],
  'guo-tu':         ['ruse', 'attack-plans', 'faction-manipulate'],
  'feng-ji':        ['ruse', 'attack-plans'],
  'gao-lan':        ['charge'],
  'ma-teng':        ['charge', 'rouse', 'thousand-ride'],
  'ma-dai':         ['charge', 'ambush'],
  // ─── Early warlords (pre-coalition) ──
  'ji-ling':        ['charge', 'long-halberd'],
  'li-ru':          ['ruse', 'attack-plans', 'pitfall'],
  'liu-yan':        ['protect-people', 'court-debate'],
  'tao-qian':       ['protect-people', 'court-debate'],
  'kong-rong':      ['court-debate', 'tongue-war', 'protect-people'],
  'zhang-yang':     ['charge', 'rouse'],
  'ze-rong':        ['ride-clouds', 'gu-poison'],
  'qiao-mao':       ['court-debate'],
  // ─── Late era / Sima Wei ──
  'wang-jun':       ['attack-plans', 'water-bandit'],   // 王濬 navy admiral
  'du-yu':          ['attack-plans', 'wind-forest', 'ruse'],
  'jia-chong':      ['ruse', 'faction-manipulate', 'eunuch-power'],
  'shi-bao':        ['charge', 'rouse'],
  'chen-tai':       ['attack-plans', 'iron-wall'],
  'zhuge-dan':      ['charge', 'rouse', 'iron-wall'],
  'wu-jing':        ['charge'],
  'zhou-fang':      ['ruse', 'pitfall', 'ambush'],      // 周魴 cut hair & defected
  // ─── Shu cont'd & Nanman ──
  'zhang-ren':      ['volley', 'ambush', 'pitfall'],    // killed Pang Tong at Luofeng
  'yan-yan':        ['charge', 'iron-wall', 'last-stand'],
  'wu-yi':          ['charge', 'attack-plans'],
  'wang-ping':      ['charge', 'ambush', 'iron-wall'],
  'zhang-yi':       ['charge', 'rouse'],
  'meng-da':        ['ruse', 'faction-manipulate'],
  // ─── Cao officers more ──
  'mi-fang':        ['protect-people'],
  // ─── Cao subordinates (more) ──
  'cao-shuang':     ['faction-manipulate', 'court-debate'],
  'cao-fang':       ['liu-shan-stupid'],
  'cao-mao':        ['charge', 'last-stand'],
  // ─── More Wu generals ──
  'sun-yi':         ['charge'],
  // ─── Ten Eunuchs / Han dynasty rotten power ──
  'zhang-rang':     ['eunuch-power', 'faction-manipulate'],
  'jian-shuo':      ['eunuch-power'],
  // ─── Famous craftsmen / doctors ──
  'hua-tuo':        ['protect-people', 'court-debate'],
  'zhang-ji':       ['protect-people', 'court-debate'],
  // ─── Dongwu late ──
  'lu-dai':         ['charge', 'water-bandit'],
  'sun-hao':        ['eunuch-power', 'liu-shan-stupid'],
  'sun-xiu':        ['court-debate'],
  // ─── Sages, recluses, historians, scholars ──
  'sima-hui':       ['seek-talent', 'attack-plans', 'know-self', 'wind-forest'],     // 水鏡先生 — recommended Sleeping Dragon/Fledgling Phoenix
  'pang-degong':    ['attack-plans', 'attack-heart', 'seek-talent', 'know-self'],    // 龐德公 — named 諸葛亮 "Sleeping Dragon"
  'cui-zhouping':   ['attack-plans', 'attack-heart', 'court-debate'],                // Zhuge Liang's friend, recluse scholar
  'huang-chengyan': ['attack-plans', 'court-debate', 'seek-talent'],                 // Huang Yueying's father
  'zheng-xuan':     ['court-debate', 'attack-heart', 'seek-talent'],                 // Han classicist scholar
  'xu-shao':        ['attack-heart', 'court-debate', 'tongue-war'],                  // 月旦評 — coined 治世之能臣亂世之奸雄 about Cao Cao
  'chen-shou':      ['memorial', 'court-debate', 'attack-heart'],                    // 三國志 historian
  // ─── Han royalty / late-era emperors ──
  'liu-xie':        ['protect-people', 'court-debate'],                              // Emperor Xian — puppet
  'liu-yu':         ['protect-people', 'court-debate', 'tax-cut'],                   // Han loyalist warlord, killed by Gongsun Zan
  'han-sui':        ['charge', 'thousand-ride', 'rouse', 'ambush'],                  // 涼州十年叛 — Liang warlord, Ma Chao's ally
  'sima-yan':       ['seek-talent', 'court-debate', 'faction-manipulate', 'attack-plans'], // founded Jin, ended Three Kingdoms

  // ─── 黃巾 / 妖道 Yellow Turbans & Mystics ───
  'zhang-jiao':     ['zhang-jiao-yellow', 'yellow-turban-mob', 'summon-gods', 'beans-to-soldiers', 'ride-clouds'],
  'zhang-bao-yt':   ['yellow-turban-mob', 'maoshan-rite', 'gu-poison'],
  'zhang-liang-yt': ['yellow-turban-mob', 'summon-gods'],
  'zhang-lu':       ['zhang-lu-rice', 'maoshan-rite'],
  'yu-ji':          ['ride-clouds', 'summon-gods', 'gu-poison', 'borrow-wind'],         // 方士祭風,呼風喚雨
  'zuo-ci':         ['ride-clouds', 'summon-gods', 'maoshan-rite', 'feign-mad', 'borrow-wind'], // 左慈擲杯戲風

  'guan-lu':        ['ruse', 'attack-plans'],
  'nanhua-laoxian': ['ride-clouds', 'summon-gods', 'maoshan-rite'],

  // ─── 漢室 Han Court ───
  'lu-zhi':         ['lu-zhi-master', 'attack-plans', 'court-debate'],
  'huangfu-song':   ['charge', 'rouse', 'attack-plans'],
  'zhu-jun':        ['charge', 'rouse'],
  'he-jin':         ['eunuch-power', 'imperial-inlaw'],

  // (Note: Sun Tzu 孫武, Han Xin, Caesar, Napoleon etc. are historical figures
  //  whose signature tactics live in TACTIC_SIGNATURE for stat bonuses but
  //  who are not in the playable roster, so they don't appear here.)
  'sun-zi':         ['attack-plans', 'court-debate'],  // 孫資 — Wei official, not Sun Tzu
  // ─── 歷代名將 ───
  ...HISTORICAL_TACTICS,
};

/** Hash an officer id into a small bucket for deterministic per-officer variance. */
function tacticBucket(id: string | undefined, mod: number): number {
  if (!id) return 0;
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function deriveTactics(stats: OfficerStats, id?: string): TacticId[] {
  if (id && OFFICER_TACTICS[id]) return OFFICER_TACTICS[id];
  const { war, leadership, intelligence, politics, charisma } = stats;
  const list: TacticId[] = [];
  const b = tacticBucket(id, 8); // 0-7, used to pick among equally-good options

  // ── Melee (high war) ──
  if (war >= 90) list.push('charge', (['twin-spear', 'long-halberd', 'twin-axe', 'meteor-hammer'] as const)[b % 4]);
  else if (war >= 80) list.push('charge', (['ambush', 'rouse', 'twin-spear'] as const)[b % 3]);
  else if (war >= 70) list.push((['volley', 'charge'] as const)[b % 2], 'rouse');
  else if (war >= 60) list.push('volley');

  // ── Ranged (war + some int) ──
  if (war >= 75 && intelligence >= 60 && intelligence < 85) {
    list.push((['volley', 'fire-arrow', 'crossbow'] as const)[b % 3]);
  }
  if (intelligence >= 70 && war < 60) {
    list.push((['catapult', 'zhuge-bow'] as const)[b % 2]);
  }

  // ── Mystic / Intelligence ──
  if (intelligence >= 95) list.push('fire-attack', (['ruse', 'attack-plans', 'eight-gates'] as const)[b % 3]);
  else if (intelligence >= 85) list.push('fire-attack', (['ruse', 'pitfall', 'attack-plans'] as const)[b % 3]);
  else if (intelligence >= 75) list.push((['ruse', 'pitfall', 'ambush'] as const)[b % 3]);
  else if (intelligence >= 65) list.push((['pitfall', 'disorder', 'ambush'] as const)[b % 3]);
  else if (intelligence >= 55) list.push('disorder');

  // ── Leadership / Strategy ──
  if (leadership >= 85) list.push((['rouse', 'iron-wall', 'wind-forest'] as const)[b % 3]);
  else if (leadership >= 75) list.push(b % 2 === 0 ? 'rouse' : 'iron-wall');

  // ── Politics / civil-focused ──
  if (politics >= 85 && war < 60) list.push((['court-debate', 'tongue-war', 'faction-manipulate'] as const)[b % 3]);
  else if (politics >= 70 && war < 50) list.push('court-debate');

  // ── Charisma ──
  if (charisma >= 90 && intelligence >= 60) list.push((['protect-people', 'tongue-war'] as const)[b % 2]);
  else if (charisma >= 80) list.push('rouse');

  // ── Low-stat / mystic edge cases ──
  if (war < 50 && intelligence < 50 && charisma >= 70) list.push('curse');
  if (war < 40 && intelligence >= 80) list.push((['ride-clouds', 'gu-poison', 'maoshan-rite'] as const)[b % 3]);

  // Defaults if still empty (very weak officers)
  if (list.length === 0) list.push('charge');

  // Dedupe, cap at 5 to keep the panel tidy.
  return Array.from(new Set(list)).slice(0, 5);
}

// ──────────────────────────────────────────────────────────────────────
// Tactic bonuses — each tactic an officer knows gives a small stat buff
// applied during combat (combat.ts reads via tacticsTotalBonus).
// ──────────────────────────────────────────────────────────────────────

export type TacticCategory = 'melee' | 'ranged' | 'mystic' | 'disrupt' | 'strategy';

export interface TacticBonus {
  war: number;
  leadership: number;
  intelligence: number;
  politics: number;
  charisma: number;
}

const ZERO_BONUS: TacticBonus = { war: 0, leadership: 0, intelligence: 0, politics: 0, charisma: 0 };

/** Category-based default bonus — applied to every tactic by category. */
export const CATEGORY_BONUS: Record<TacticCategory, TacticBonus> = {
  melee:    { war: 2, leadership: 1, intelligence: 0, politics: 0, charisma: 0 },
  ranged:   { war: 1, leadership: 1, intelligence: 1, politics: 0, charisma: 0 },
  mystic:   { war: 0, leadership: 0, intelligence: 3, politics: 0, charisma: 1 },
  disrupt:  { war: 0, leadership: 0, intelligence: 2, politics: 1, charisma: 1 },
  strategy: { war: 0, leadership: 2, intelligence: 1, politics: 1, charisma: 0 },
};

/**
 * Heuristic categorizer — for the 600+ TacticIds. Most have keywords that
 * map cleanly to a category. Falls back to 'strategy'.
 */
export function categoryOfTactic(id: string): TacticCategory {
  // Explicit overrides for tactics whose name doesn't match a pattern.
  const EXPLICIT: Record<string, TacticCategory> = {
    charge: 'melee', rouse: 'melee', ambush: 'melee', 'last-stand': 'melee',
    'iron-wall': 'melee', rush: 'melee', changban: 'melee', 'pass-six': 'melee',
    'lone-blade': 'melee', 'thousand-ride': 'melee',
    volley: 'ranged', crossbow: 'ranged', catapult: 'ranged', 'fire-arrow': 'ranged',
    meteor: 'ranged', 'borrow-arrow': 'ranged', 'zhuge-bow': 'ranged',
    'fire-attack': 'mystic', 'water-attack': 'mystic', thunder: 'mystic',
    'borrow-wind': 'mystic', 'eight-gates': 'mystic', 'burn-yiling': 'mystic',
    'burn-bowang': 'mystic', 'star-prayer': 'mystic', 'he-luo-tu': 'mystic',
    'five-thunder': 'mystic', 'qimen-dunjia': 'mystic', 'seven-lamp': 'mystic',
    'wuzhang-star': 'mystic',
    ruse: 'disrupt', disorder: 'disrupt', pitfall: 'disrupt', curse: 'disrupt',
    beauty: 'disrupt', chain: 'disrupt', 'self-injury': 'disrupt', retreat: 'disrupt',
    'hide-knife': 'disrupt', 'tree-flower': 'disrupt', 'feign-mad': 'disrupt',
    'borrow-knife': 'disrupt', 'switch-beam': 'disrupt', 'point-curse': 'disrupt',
    'white-robe': 'disrupt', 'edict-belt': 'disrupt', diaochan: 'disrupt',
    'chu-songs': 'disrupt', deception: 'disrupt',
  };
  if (EXPLICIT[id]) return EXPLICIT[id];

  // Keyword-based fallback.
  if (/fire|burn|chibi|wind|thunder|star|spirit|gate-of|jade|summon|talisman|mist|clouds|reverse-soul|gu-poison|maoshan|wood-puppet|five-thunder|alchemy|divine|crow|nine-yin|nine-yang|easi-jing|sui-jing|yinyang|geomancy|sun-ce-mirror/.test(id)) return 'mystic';
  if (/arrow|bow|crossbow|ballista|cannon|gun|firearm|sniper|longbow|projectile|ranged|hidden-weapon|flying-knife/.test(id)) return 'ranged';
  if (/spy|defector|smear|rumor|discord|spread|intercept|maid|sleeper|bribe|false|forge|edict|hide-knife|chu-songs|silent|coward|fake|deception|disrupt|pang-de-coffin|le-jin-raid|gan-ning-100/.test(id)) return 'disrupt';
  if (/charge|cav|melee|strike|blade|spear|halberd|axe|whip|sword|hammer|fist|palm|kungfu|stance|legion|phalanx|cohort|guard|infantry|foot|knight|squad|raid|attack-h|pursue|press|battle|fight|warrior|brave|courage|tiger|wolf|eagle|leopard|crane|shadow|guardian|champion|hero|valor|fury|berserker/.test(id)) return 'melee';

  return 'strategy';
}

/**
 * Signature bonuses — famous named tactics get larger, often unique buffs.
 * These override the category default in tacticBonus().
 */
export const TACTIC_SIGNATURE: Partial<Record<string, TacticBonus>> = {
  // ── 諸葛 ──
  'seven-grab':      { war: 5, leadership: 10, intelligence: 8, politics: 5, charisma: 10 },
  'borrow-wind':     { war: 0, leadership: 5, intelligence: 20, politics: 0, charisma: 0 },
  'borrow-arrow':    { war: 3, leadership: 5, intelligence: 15, politics: 0, charisma: 5 },
  'star-prayer':     { war: 0, leadership: 0, intelligence: 18, politics: 0, charisma: 5 },
  'seven-lamp':      { war: 0, leadership: 0, intelligence: 18, politics: 0, charisma: 5 },
  'six-expeditions': { war: 5, leadership: 12, intelligence: 10, politics: 5, charisma: 8 },
  'wooden-ox':       { war: 0, leadership: 8, intelligence: 10, politics: 8, charisma: 0 },
  'zhuge-bow':       { war: 5, leadership: 5, intelligence: 10, politics: 0, charisma: 0 },
  'burn-bowang':     { war: 5, leadership: 5, intelligence: 12, politics: 0, charisma: 5 },
  'burn-xinye':      { war: 5, leadership: 5, intelligence: 12, politics: 0, charisma: 5 },
  'longzhong':       { war: 0, leadership: 10, intelligence: 15, politics: 10, charisma: 5 },
  memorial:          { war: 0, leadership: 8, intelligence: 8, politics: 12, charisma: 10 },
  'tearful-ma':      { war: 0, leadership: 10, intelligence: 5, politics: 8, charisma: 5 },
  'tongue-war':      { war: 0, leadership: 0, intelligence: 12, politics: 10, charisma: 12 },
  'empty-fort-tac':  { war: 0, leadership: 5, intelligence: 20, politics: 0, charisma: 8 },

  // ── 陸遜 / 周瑜 / 東吳 ──
  'luxun-fire':      { war: 5, leadership: 8, intelligence: 15, politics: 0, charisma: 5 },
  'burn-yiling':     { war: 5, leadership: 8, intelligence: 15, politics: 0, charisma: 5 },
  'burn-chibi':      { war: 5, leadership: 10, intelligence: 15, politics: 0, charisma: 8 },
  'zhou-yu-plan':    { war: 5, leadership: 10, intelligence: 12, politics: 0, charisma: 10 },
  'zhouyu-music':    { war: 0, leadership: 8, intelligence: 12, politics: 5, charisma: 15 },
  'chain-ship':      { war: 3, leadership: 5, intelligence: 12, politics: 0, charisma: 0 },
  'pang-tong-chain': { war: 0, leadership: 5, intelligence: 18, politics: 5, charisma: 0 },
  'white-robe':      { war: 8, leadership: 8, intelligence: 12, politics: 0, charisma: 0 },
  'lumeng-study':    { war: 5, leadership: 10, intelligence: 15, politics: 0, charisma: 0 },

  // ── 曹操 / 司馬 ──
  'caocao-poetry':   { war: 5, leadership: 10, intelligence: 10, politics: 5, charisma: 15 },
  'plum-wine':       { war: 5, leadership: 8, intelligence: 10, politics: 8, charisma: 10 },
  'plum-thirst':     { war: 5, leadership: 12, intelligence: 5, politics: 0, charisma: 10 },
  'seek-talent':     { war: 0, leadership: 5, intelligence: 10, politics: 15, charisma: 10 },
  'wuchao-grain':    { war: 5, leadership: 10, intelligence: 15, politics: 0, charisma: 0 },
  'simayi-tortoise': { war: 0, leadership: 12, intelligence: 15, politics: 5, charisma: 0 },
  'feign-illness':   { war: 0, leadership: 5, intelligence: 18, politics: 8, charisma: 0 },
  'sima-eight':      { war: 5, leadership: 10, intelligence: 15, politics: 0, charisma: 0 },
  'two-tigers':      { war: 0, leadership: 5, intelligence: 12, politics: 8, charisma: 0 },
  'lure-tiger-wolf': { war: 0, leadership: 5, intelligence: 12, politics: 8, charisma: 0 },

  // ── 關羽 / 張飛 / 趙雲 / 馬超 / 黃忠 ──
  'guanyu-greendragon':{ war: 18, leadership: 8, intelligence: 0, politics: 0, charisma: 5 },
  'warm-wine':       { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 8 },
  'lone-blade':      { war: 15, leadership: 8, intelligence: 0, politics: 0, charisma: 5 },
  'guan-yu-pardon':  { war: 10, leadership: 5, intelligence: 0, politics: 0, charisma: 12 },
  'thousand-ride':   { war: 12, leadership: 8, intelligence: 0, politics: 0, charisma: 8 },
  'pass-six':        { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'zhangfei-yelling':{ war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 0 },
  'whip-postman':    { war: 10, leadership: 0, intelligence: 0, politics: 0, charisma: 8 },
  'three-fight-lubu':{ war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'changban':        { war: 18, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'zhaoyun-shadow':  { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'zhao-yun-courage':{ war: 15, leadership: 8, intelligence: 0, politics: 0, charisma: 5 },
  'zhao-yun-baby':   { war: 15, leadership: 8, intelligence: 0, politics: 0, charisma: 8 },
  'changban-bridge': { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'machao-spear':    { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'huangzhong-bow':  { war: 12, leadership: 5, intelligence: 5, politics: 0, charisma: 0 },
  'huangzhong-old-bow':{ war: 12, leadership: 5, intelligence: 5, politics: 0, charisma: 0 },
  'dingjun-mtn':     { war: 12, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },

  // ── 呂布 / 典韋 / 許褚 ──
  'lubu-flying':     { war: 20, leadership: 5, intelligence: 0, politics: 0, charisma: 0 },
  'lu-bu-yuan-gate': { war: 18, leadership: 0, intelligence: 5, politics: 0, charisma: 0 },
  'dianwei-double-axe':{ war: 15, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  'xuchu-iron-fist': { war: 15, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  'gan-ning-100':    { war: 12, leadership: 8, intelligence: 0, politics: 0, charisma: 5 },
  'gan-ning-bell':   { war: 12, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },
  'zhang-liao-xiaoyao':{ war: 15, leadership: 12, intelligence: 0, politics: 0, charisma: 5 },
  'taishi-ci-vs-sunce':{ war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 5 },

  // ── 韓信 / 古名將 ──
  'han-xin-count':   { war: 5, leadership: 15, intelligence: 18, politics: 0, charisma: 5 },
  'sand-dam':        { war: 0, leadership: 10, intelligence: 15, politics: 0, charisma: 0 },
  'chu-songs':       { war: 0, leadership: 8, intelligence: 15, politics: 0, charisma: 10 },
  'fire-ox':         { war: 8, leadership: 10, intelligence: 12, politics: 0, charisma: 0 },
  'xiang-yu-horse':  { war: 18, leadership: 10, intelligence: 0, politics: 0, charisma: 8 },
  'julu-battle':     { war: 12, leadership: 12, intelligence: 0, politics: 0, charisma: 10 },

  // ── 孫子 ──
  'know-self':       { war: 0, leadership: 10, intelligence: 18, politics: 5, charisma: 0 },
  'wind-forest':     { war: 5, leadership: 12, intelligence: 12, politics: 0, charisma: 0 },
  'attack-plans':    { war: 0, leadership: 8, intelligence: 15, politics: 0, charisma: 0 },
  'attack-heart':    { war: 0, leadership: 8, intelligence: 15, politics: 0, charisma: 5 },
  'subdue-no-fight': { war: 0, leadership: 12, intelligence: 18, politics: 0, charisma: 5 },
  // ── Phase 66: more named signatures ──
  'cao-rui-vase':    { war: 0, leadership: 5, intelligence: 8, politics: 12, charisma: 12 },
  'liu-shan-stupid': { war: 0, leadership: 0, intelligence: 3, politics: 8, charisma: 8 },
  'da-qiao-marriage':{ war: 0, leadership: 5, intelligence: 5, politics: 10, charisma: 15 },
  'dong-zhuo-fat':   { war: 12, leadership: 5, intelligence: 0, politics: 5, charisma: 0 },
  'dong-zhuo-tyrant':{ war: 15, leadership: 10, intelligence: 0, politics: 8, charisma: 0 },
  'lu-zhi-master':   { war: 5, leadership: 8, intelligence: 15, politics: 10, charisma: 5 },
  'cai-yong-lute':   { war: 0, leadership: 0, intelligence: 12, politics: 5, charisma: 15 },
  'mi-heng-drum':    { war: 0, leadership: 0, intelligence: 10, politics: 0, charisma: 15 },
  'zhang-jiao-yellow':{ war: 5, leadership: 10, intelligence: 12, politics: 0, charisma: 15 },
  'zhang-lu-rice':   { war: 3, leadership: 8, intelligence: 10, politics: 12, charisma: 10 },
  // 三国 more (60+ here)
  'peach-garden-tac':{ war: 12, leadership: 15, intelligence: 5, politics: 5, charisma: 12 },
  'sworn-brothers':  { war: 8, leadership: 12, intelligence: 0, politics: 0, charisma: 12 },
  'protect-people':  { war: 0, leadership: 10, intelligence: 5, politics: 12, charisma: 18 },
  'liu-bei-tears':   { war: 0, leadership: 8, intelligence: 5, politics: 8, charisma: 18 },
  'liu-bei-share-meat':{ war: 0, leadership: 10, intelligence: 0, politics: 5, charisma: 15 },
  'sun-jian-tiger':  { war: 18, leadership: 12, intelligence: 5, politics: 0, charisma: 8 },
  'sunce-blade':     { war: 18, leadership: 10, intelligence: 5, politics: 0, charisma: 8 },
  'sunquan-blue-eye':{ war: 5, leadership: 15, intelligence: 10, politics: 12, charisma: 12 },
  'sun-quan-bow':    { war: 10, leadership: 10, intelligence: 0, politics: 0, charisma: 8 },
  'sun-shangxiang':  { war: 12, leadership: 5, intelligence: 0, politics: 0, charisma: 12 },
  'yuan-shao-noble': { war: 5, leadership: 12, intelligence: 5, politics: 12, charisma: 15 },
  'yuan-shu-jade':   { war: 5, leadership: 5, intelligence: 0, politics: 12, charisma: 5 },
  'gongsun-zan-white':{ war: 12, leadership: 10, intelligence: 0, politics: 5, charisma: 5 },
  'wang-yun-plot':   { war: 0, leadership: 5, intelligence: 18, politics: 12, charisma: 8 },
  'diaochan':        { war: 0, leadership: 0, intelligence: 15, politics: 5, charisma: 20 },
  'cao-zhi-poem':    { war: 0, leadership: 0, intelligence: 15, politics: 0, charisma: 18 },
  'huang-yueying':   { war: 0, leadership: 5, intelligence: 18, politics: 8, charisma: 5 },
  'lu-lingqi':       { war: 15, leadership: 5, intelligence: 0, politics: 0, charisma: 8 },
  'ma-yunlu':        { war: 12, leadership: 5, intelligence: 0, politics: 0, charisma: 8 },
  'lady-zhurong-tac':{ war: 12, leadership: 8, intelligence: 0, politics: 0, charisma: 10 },
  'fan-lihua':       { war: 8, leadership: 5, intelligence: 18, politics: 0, charisma: 12 },
  'mu-guiying':      { war: 12, leadership: 12, intelligence: 8, politics: 0, charisma: 10 },
  mulan:             { war: 12, leadership: 10, intelligence: 5, politics: 0, charisma: 12 },
  // 武器名家 — 武力专属
  'twin-spear':      { war: 10, leadership: 3, intelligence: 0, politics: 0, charisma: 0 },
  'long-halberd':    { war: 12, leadership: 3, intelligence: 0, politics: 0, charisma: 0 },
  'twin-axe':        { war: 10, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  'meteor-hammer':   { war: 10, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  'flying-knife':    { war: 8, leadership: 0, intelligence: 5, politics: 0, charisma: 0 },
  'iron-sand-palm':  { war: 12, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  'vajra-finger':    { war: 12, leadership: 0, intelligence: 0, politics: 0, charisma: 0 },
  // 内功
  'yi-jin-jing':     { war: 12, leadership: 5, intelligence: 8, politics: 0, charisma: 0 },
  'xi-sui-jing':     { war: 5, leadership: 0, intelligence: 15, politics: 0, charisma: 0 },
  'nine-yin':        { war: 8, leadership: 0, intelligence: 12, politics: 0, charisma: 0 },
  'nine-yang':       { war: 12, leadership: 5, intelligence: 8, politics: 0, charisma: 0 },
  'iron-shirt':      { war: 8, leadership: 5, intelligence: 0, politics: 0, charisma: 0 },
  'golden-bell':     { war: 8, leadership: 5, intelligence: 0, politics: 0, charisma: 0 },
  // 西方
  'caesar-cross':    { war: 10, leadership: 15, intelligence: 8, politics: 5, charisma: 8 },
  'napoleon-flank':  { war: 5, leadership: 12, intelligence: 15, politics: 0, charisma: 0 },
  'hannibal-cannae': { war: 8, leadership: 15, intelligence: 12, politics: 0, charisma: 0 },
  'spartan-300':     { war: 18, leadership: 15, intelligence: 0, politics: 0, charisma: 0 },
  'mongol-whirlwind':{ war: 15, leadership: 8, intelligence: 0, politics: 0, charisma: 0 },
  // 邪教 / 妖术 — mystic 强
  'yellow-turban-mob':{ war: 8, leadership: 10, intelligence: 5, politics: 0, charisma: 12 },
  'water-bandit':    { war: 8, leadership: 8, intelligence: 0, politics: 0, charisma: 0 },
  'black-mountain-bandit':{ war: 10, leadership: 8, intelligence: 0, politics: 0, charisma: 0 },
  'rebel-uprising':  { war: 5, leadership: 10, intelligence: 0, politics: 8, charisma: 12 },
  'beans-to-soldiers':{ war: 5, leadership: 5, intelligence: 15, politics: 0, charisma: 5 },
  'ride-clouds':     { war: 0, leadership: 0, intelligence: 15, politics: 0, charisma: 5 },
  'maoshan-rite':    { war: 0, leadership: 0, intelligence: 18, politics: 0, charisma: 5 },
  'summon-gods':     { war: 5, leadership: 0, intelligence: 18, politics: 0, charisma: 8 },
  'gu-poison':       { war: 0, leadership: 0, intelligence: 15, politics: 0, charisma: 0 },
  // 政治
  'eunuch-power':    { war: 0, leadership: 0, intelligence: 12, politics: 18, charisma: 5 },
  'imperial-inlaw':  { war: 0, leadership: 5, intelligence: 10, politics: 15, charisma: 10 },
  'court-debate':    { war: 0, leadership: 5, intelligence: 12, politics: 12, charisma: 12 },
  'faction-manipulate':{ war: 0, leadership: 5, intelligence: 15, politics: 12, charisma: 5 },
  // 经济
  'salt-monopoly':   { war: 0, leadership: 5, intelligence: 8, politics: 15, charisma: 0 },
  'tea-trade':       { war: 0, leadership: 0, intelligence: 5, politics: 12, charisma: 5 },
  'silk-road':       { war: 5, leadership: 5, intelligence: 8, politics: 15, charisma: 8 },
  'tax-cut':         { war: 0, leadership: 5, intelligence: 5, politics: 15, charisma: 12 },
};

/**
 * Deterministic per-id variance — every non-signature tactic gets a small,
 * unique stat sprinkle on top of the category default so no two cards look
 * identical even within the same category.
 */
function idVariance(id: string): TacticBonus {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  }
  // 30 distinct patterns derived from the hash. Each adds 2-3 stat points.
  const pattern = h % 30;
  const a = Math.floor(h / 30) % 5; // primary stat
  const b = (a + 1 + (Math.floor(h / 150) % 4)) % 5; // secondary stat
  const v: TacticBonus = { war: 0, leadership: 0, intelligence: 0, politics: 0, charisma: 0 };
  const stats: Array<keyof TacticBonus> = ['war', 'leadership', 'intelligence', 'politics', 'charisma'];
  v[stats[a]] += pattern < 15 ? 2 : 1;
  v[stats[b]] += pattern < 15 ? 1 : 2;
  return v;
}

function addBonus(a: TacticBonus, b: TacticBonus): TacticBonus {
  return {
    war: a.war + b.war,
    leadership: a.leadership + b.leadership,
    intelligence: a.intelligence + b.intelligence,
    politics: a.politics + b.politics,
    charisma: a.charisma + b.charisma,
  };
}

/** Bonus from a single tactic id (signature takes priority, else category + variance). */
export function tacticBonus(id: string): TacticBonus {
  if (TACTIC_SIGNATURE[id]) return TACTIC_SIGNATURE[id]!;
  return addBonus(CATEGORY_BONUS[categoryOfTactic(id)], idVariance(id));
}

/** Whether a tactic has a signature (named) bonus rather than category default. */
export function isTacticSignature(id: string): boolean {
  return id in TACTIC_SIGNATURE;
}

/** T7 — Mastery multiplier from total tactic count: officers who've
 *  amassed a deep repertoire wield each one more effectively. */
function masteryMultiplier(n: number): number {
  if (n >= 12) return 1.10; // grandmaster
  if (n >= 8) return 1.06;  // veteran
  if (n >= 4) return 1.03;  // adept
  return 1.0;               // novice
}

/** Sum bonuses across all tactics an officer knows, scaled by mastery. */
export function tacticsTotalBonus(ids: ReadonlyArray<string>): TacticBonus {
  const sum = { ...ZERO_BONUS };
  for (const id of ids) {
    const b = tacticBonus(id);
    sum.war += b.war;
    sum.leadership += b.leadership;
    sum.intelligence += b.intelligence;
    sum.politics += b.politics;
    sum.charisma += b.charisma;
  }
  const m = masteryMultiplier(ids.length);
  return {
    war: Math.round(sum.war * m),
    leadership: Math.round(sum.leadership * m),
    intelligence: Math.round(sum.intelligence * m),
    politics: Math.round(sum.politics * m),
    charisma: Math.round(sum.charisma * m),
  };
}

/**
 * T8 — Famous tactic combos. When a side's collected tactic pool contains
 * every member of a combo, that side's battle power gets the combo bonus.
 */
export interface TacticCombo {
  id: string;
  nameZh: string;
  nameEn: string;
  tactics: string[];      // all must be present in pool
  powerMul: number;       // multiplier on side's combat power
  textZh: string;         // report flavor when triggered (player-side only)
  textEn: string;
}

export const TACTIC_COMBOS: TacticCombo[] = [
  {
    id: 'chibi',
    nameZh: '赤壁火攻',
    nameEn: 'Red Cliffs Fire-Chain',
    tactics: ['fire-attack', 'borrow-wind', 'chain-ship'],
    powerMul: 1.40,
    textZh: '赤壁火攻陣陣相連 — 戰力 +40%!',
    textEn: 'Red Cliffs fire-chain ignited — power +40%!',
  },
  {
    id: 'yiling',
    nameZh: '火燒連營',
    nameEn: 'Yiling Fire-Camp',
    tactics: ['fire-attack', 'burn-yiling'],
    powerMul: 1.25,
    textZh: '火燒連營,蜀軍崩潰 — 戰力 +25%!',
    textEn: 'Yiling fire-camp — power +25%!',
  },
  {
    id: 'eight-gates-trap',
    nameZh: '八門奇陣',
    nameEn: 'Eight Gates Trap',
    tactics: ['eight-gates', 'ruse'],
    powerMul: 1.20,
    textZh: '八門奇陣困敵 — 戰力 +20%!',
    textEn: 'Eight Gates trap — power +20%!',
  },
  {
    id: 'cao-discipline',
    nameZh: '挾天子以令諸侯',
    nameEn: "Hold the Emperor",
    tactics: ['borrow-knife', 'hide-knife', 'kill-king'],
    powerMul: 1.30,
    textZh: '借勢殺君 — 戰力 +30%!',
    textEn: 'Three-step regicide combo — power +30%!',
  },
  {
    id: 'sun-tzu-trinity',
    nameZh: '兵聖三訣',
    nameEn: 'Sun Tzu Trinity',
    tactics: ['know-self', 'fast-strike', 'deception'],
    powerMul: 1.25,
    textZh: '知己知彼 · 兵貴神速 · 兵不厭詐 — 戰力 +25%!',
    textEn: 'Sun Tzu trinity — power +25%!',
  },
  {
    id: 'border-stratagem',
    nameZh: '緩兵之計',
    nameEn: 'Stalling Strategy',
    tactics: ['wait-tired', 'iron-wall'],
    powerMul: 1.18,
    textZh: '以逸待勞,鐵壁固守 — 戰力 +18%!',
    textEn: 'Wait-tired + iron-wall — power +18%!',
  },
];

/** Find all combos that fire for a given pool of tactics. */
export function findActiveCombos(pool: ReadonlyArray<string>): TacticCombo[] {
  const set = new Set(pool);
  return TACTIC_COMBOS.filter((c) => c.tactics.every((t) => set.has(t)));
}

/** Multiplier from all active combos (stacks multiplicatively, compressed). */
export function combosPowerMultiplier(pool: ReadonlyArray<string>): number {
  const active = findActiveCombos(pool);
  if (active.length === 0) return 1.0;
  let mul = 1.0;
  for (const c of active) mul *= c.powerMul;
  // Compress so multiple combos don't compound to absurd numbers.
  return 1 + (mul - 1) * 0.8;
}

/** Public helper to get an officer's mastery tier (1-4). */
export function tacticMasteryTier(tacticCount: number): { tier: 1 | 2 | 3 | 4; multiplier: number; labelZh: string; labelEn: string } {
  if (tacticCount >= 12) return { tier: 4, multiplier: 1.10, labelZh: '宗師', labelEn: 'Grandmaster' };
  if (tacticCount >= 8) return { tier: 3, multiplier: 1.06, labelZh: '老練', labelEn: 'Veteran' };
  if (tacticCount >= 4) return { tier: 2, multiplier: 1.03, labelZh: '熟練', labelEn: 'Adept' };
  return { tier: 1, multiplier: 1.0, labelZh: '初窺', labelEn: 'Novice' };
}

// ──────────────────────────────────────────────────────────────────────
// 政策 (Civil Policies)
// ──────────────────────────────────────────────────────────────────────

export type PolicyId =
  // ── Original 12 ──
  | 'tuntian'    // 屯田 — military farms
  | 'hydraulics' // 治水 — water works
  | 'engineering'// 工兵 — siege engineering
  | 'commerce'   // 商業 — trade
  | 'scholarship'// 学問 — learning
  | 'legalism'   // 法治 — rule by law
  | 'rites'      // 礼楽 — rituals & music
  | 'recruitment'// 養兵 — troop training
  | 'smithing'   // 鍛造 — weapon forging
  | 'horse-stewardship' // 馬政 — cavalry breeding
  | 'medicine'   // 医術 — medicine
  | 'military-theory'   // 軍学 — military academy
  // ── Economic (5) ──
  | 'salt-monopoly'     // 鹽政 — state salt monopoly (Han classic)
  | 'iron-monopoly'     // 鐵政 — state iron monopoly
  | 'coinage'           // 鑄幣 — minting copper cash, anti-inflation
  | 'silk-trade'        // 絲綢之路 — silk export & trade routes
  | 'tea-trade'         // 茶馬貿易 — tea-horse exchange
  // ── Military extensions (4) ──
  | 'naval-academy'     // 水軍 — train marines for river/lake war
  | 'crossbow-corps'    // 弩兵 — crossbow batteries (Zhuge Liang's specialty)
  | 'border-garrison'   // 邊防 — frontier permanent garrisons
  | 'siege-school'      // 攻城 — formal siege engineering
  // ── Civil / Administrative (4) ──
  | 'nine-grade'        // 九品中正 — Chen Qun's Wei talent grading
  | 'land-reform'       // 均田 — equal-field land redistribution
  | 'poor-relief'       // 賑災 — famine relief, granary stockpile
  | 'inspection'        // 監察 — censorate, audit of officials
  // ── Cultural / Spiritual (3) ──
  | 'ancestor-rites'    // 宗廟祭祀 — imperial ancestor cult
  | 'astronomy'         // 天文 — observing heavens, omens
  | 'calendar-reform'   // 曆法 — official calendar
  // ── Diplomacy (2) ──
  | 'alliance-marriage' // 和親 — political marriages with neighbors
  | 'tribute-system'    // 朝貢 — vassal tribute hierarchy
  // ── Intelligence / Frontier (3) ──
  | 'spy-network'       // 細作 — espionage corps
  | 'propaganda'        // 檄文 — written denunciations & manifestos
  | 'frontier-pacification' // 撫夷 — pacify southern/western tribes (Zhuge's 攻心)
  // ── More economy (5) ──
  | 'granary'           // 倉廩 — state grain reserves & price stabilization
  | 'maritime-trade'    // 海貿 — coastal sea trade (Wu strength)
  | 'silk-loom'         // 蠶桑 — silkworm cultivation
  | 'ox-plowing'        // 牛耕 — heavy-plow agriculture
  | 'fish-salt'         // 漁鹽 — coastal fishery + salt panning
  // ── More military (6) ──
  | 'fortifications'    // 城防 — wall upgrade and tower construction
  | 'ambush-corps'      // 伏兵營 — guerrilla training (forest/mountain)
  | 'mountain-warfare'  // 山戰 — mountain combat doctrine (Wu's Shanyue, Shu's Hanzhong)
  | 'conscription'      // 徵兵 — mass conscription (boosts numbers, hurts loyalty)
  | 'elite-guards'      // 親衛 — bodyguard regiment (Cao's 虎豹騎, Yuan's 大戟士)
  | 'arsenal'           // 軍械庫 — central arsenal for distribution
  // ── More civil (4) ──
  | 'imperial-academy'  // 太學 — Imperial University (Han classic)
  | 'post-roads'        // 驛站 — postal road system
  | 'community-granary' // 義倉 — village charity granaries
  | 'court-music'       // 雅樂 — courtly ceremonial music
  // ── Cultural / Religious (3) ──
  | 'buddhism'          // 佛教 — Buddhist temple patronage
  | 'taoism'            // 道教 — Taoist temple patronage (late Han uprisings)
  | 'divination'        // 卜筮 — official divination
  // ── More diplomacy / intel (4) ──
  | 'hostage-system'    // 質子 — keep enemy princes hostage
  | 'assassins'         // 刺客 — assassination programs
  | 'counter-intel'     // 反間 — counter-espionage / planting false info
  | 'defector-reward'   // 招降 — pay enemy officers to defect
  // ── Phase 3 economy (10) ──
  | 'iron-tools'        // 鐵具 — distribute iron farm tools (huge ag boost)
  | 'caravan-protection'// 護商 — escort trade caravans, anti-bandit patrols
  | 'horse-trade'       // 馬市 — frontier horse markets (Tea-Horse alternative)
  | 'copper-mining'     // 銅礦 — bronze ore mining for cash + bronze
  | 'iron-mining'       // 鐵礦 — iron ore mining (feeds smithing)
  | 'timber'            // 林業 — timber forestry (for ships + siege)
  | 'pearl-trade'       // 珍珠貿 — Wu coastal pearl harvest
  | 'jade-trade'        // 玉貿 — Western Region jade trade
  | 'corvee'            // 力役 — labor draft for public works
  | 'tax-light'         // 輕徭薄賦 — light taxes, popular Han classic
  // ── Phase 3 military (8) ──
  | 'watch-towers'      // 烽燧 — beacon towers for early warning
  | 'garrison-rotation' // 番上 — rotate garrison troops (fresh soldiers)
  | 'chariot-corps'     // 戰車 — war chariot units
  | 'shield-wall'       // 盾陣 — shield wall doctrine
  | 'naval-fireships'   // 火船 — fire-ship doctrine (Red Cliffs)
  | 'naval-rams'        // 衝角 — ramming naval doctrine
  | 'horse-armor'       // 馬鎧 — armored cavalry (Cao Cao's 鐵騎)
  | 'mountain-stronghold' // 山寨 — fortified mountain camps
  // ── Phase 3 civil (7) ──
  | 'household-register'// 戶籍 — household registration (taxation base)
  | 'examination'       // 察舉 — Han recommendation system for officials
  | 'mourning-rites'    // 喪禮 — funeral rites for nobles
  | 'library'           // 圖書 — Imperial library
  | 'music-bureau'      // 樂府 — court music bureau (collecting folk songs)
  | 'school-village'    // 鄉學 — rural schools
  | 'imperial-edict'    // 詔書 — formal imperial proclamations
  // ── Phase 3 religion (3) ──
  | 'five-emperors'     // 五帝祭 — five-emperor cult (legitimacy)
  | 'mountain-spirit'   // 山神祭 — mountain spirit rites (frontier loyalty)
  | 'river-god'         // 河神祭 — river god rites (flood + naval blessing)
  // ── Phase 3 diplomacy (3) ──
  | 'envoy-bureau'      // 鴻臚寺 — bureau of foreign envoys
  | 'frontier-market'   // 邊市 — official trading posts at borders
  | 'captives-ransom'   // 贖俘 — ransom captured officers/troops
  // ── Phase 4 economy (10) ──
  | 'gold-mining'       // 金礦 — gold ore mining (high value, scarce)
  | 'forest-conservation' // 護林 — woodland conservation
  | 'pottery'           // 陶器 — pottery industry (everyday commerce)
  | 'lacquerware'       // 漆器 — lacquerware (luxury export)
  | 'merchant-guild'    // 行會 — formal merchant guilds
  | 'river-customs'     // 関稅 — river toll/customs
  | 'pawn-bureau'       // 質庫 — government-backed pawnshops
  | 'court-treasury'    // 內庫 — palace treasury (vs state treasury)
  | 'bamboo-craft'      // 竹器 — bamboo crafts (light industry)
  | 'sericulture-tax'   // 桑稅 — silk-tax (specialty levy on mulberry farms)
  // ── Phase 4 military (10) ──
  | 'archery-school'    // 射禮 — formal archery instruction
  | 'military-drill'    // 演武 — regular drills + military exercises
  | 'supply-train'      // 輜重 — baggage trains, logistics corps
  | 'siege-tower'       // 樓車 — siege towers
  | 'engineer-corps'    // 工程營 — corps of military engineers
  | 'frontier-cavalry'  // 邊騎 — frontier cavalry (lighter than horse-armor)
  | 'mountain-passes'   // 關隘 — fortified mountain passes
  | 'watchnight'        // 夜禁 — night curfew enforcement
  | 'spear-corps'       // 槍隊 — pikeman regiments
  | 'assault-troops'    // 突擊隊 — shock troopers (forlorn-hope style)
  // ── Phase 4 civil (8) ──
  | 'noble-titles'      // 封爵 — grant peerages
  | 'imperial-tour'     // 巡幸 — emperor's progress tour
  | 'charity-house'     // 養濟院 — orphanages + charity houses
  | 'mediation'         // 鄉約 — village mediation councils
  | 'standardize-weights' // 度量衡 — standardize measures (Qin classic)
  | 'standardize-script'  // 文字 — standardize script
  | 'map-survey'        // 圖經 — formal cartography
  | 'crime-amnesty'     // 大赦 — mass amnesty (popular but risky)
  // ── Phase 4 religion (4) ──
  | 'temple-building'   // 寺廟 — religious temple construction
  | 'new-year-rites'    // 元正 — New Year court rituals
  | 'alchemy'           // 煉丹 — Daoist alchemy (immortality-seeking)
  | 'soul-prayer'       // 招魂 — souls-of-the-fallen rites
  // ── Phase 4 diplomacy (3) ──
  | 'bribery'           // 收買 — bribe enemy officials
  | 'propaganda-songs'  // 童謠 — politically-charged children's songs
  | 'nanman-tribute'    // 南蠻朝貢 — formal tribute from Nanman
  // ── Phase 5 economy (12) ──
  | 'ironworks'         // 鐵冶 — state ironworks (separate from iron-mining)
  | 'shipyard'          // 造船廠 — dedicated shipyard (specific from naval-academy)
  | 'canal'             // 運河 — canal construction
  | 'water-mill'        // 水車 — water-powered mills
  | 'weaving'           // 紡織 — state weaving workshops
  | 'silver-mining'     // 銀礦 — silver mining
  | 'tea-cultivation'   // 茶園 — tea plantations (south, Wu/Shu)
  | 'bridges'           // 修橋 — bridges across rivers
  | 'caravansary'       // 驛館 — postal lodges for travellers
  | 'river-dredging'    // 浚河 — dredge canals, prevent flooding
  | 'horse-breeding'    // 牧苑 — state stud farms (more specific than horse-stewardship)
  | 'famine-loans'      // 借糧 — emergency famine relief loans
  // ── Phase 5 military (10) ──
  | 'skirmish-corps'    // 散兵 — light infantry skirmishers
  | 'light-cavalry'     // 輕騎 — light cavalry scouts
  | 'bandit-suppression' // 剿匪 — internal bandit suppression
  | 'pirate-suppression' // 剿海寇 — anti-pirate naval ops
  | 'veteran-pension'   // 退伍 — veteran care + pension
  | 'military-academy'  // 武備學堂 — officer training academy
  | 'moat-construction' // 護城河 — moats around city walls
  | 'camp-discipline'   // 軍紀 — strict military discipline code
  | 'river-watchtower'  // 江樓 — river bank watchtowers
  | 'coastal-fortress'  // 海防 — coastal defense forts
  // ── Phase 5 civil (8) ──
  | 'six-ministers'     // 六部 (here as 三公九卿 Han system) — central ministry reform
  | 'protocol'          // 朝儀 — court protocol
  | 'royal-physicians'  // 太醫 — palace physicians
  | 'imperial-guard'    // 禁衛 — palace guard
  | 'official-promotion' // 升遷 — formal promotion track
  | 'royal-park'        // 苑囿 — imperial parks/gardens (Wu's 華林園, etc.)
  | 'prefecture-reform' // 郡縣改革 — restructure prefectures
  | 'land-survey'       // 計畝 — land survey for taxation
  // ── Phase 5 religion (4) ──
  | 'sky-altar'         // 圜丘 — round altar of heaven
  | 'earth-altar'       // 方丘 — square altar of earth
  | 'mountain-pilgrimage' // 朝山 — sacred mountain pilgrimages
  | 'ancestral-temple'  // 太廟 — imperial ancestor temple (highest cult)
  // ── Phase 5 frontier diplomacy (6) ──
  | 'xianbei-buffer'    // 鮮卑緩衝 — manage Xianbei pressure on N frontier
  | 'xiongnu-tribute'   // 匈奴朝貢 — Xiongnu vassal tribute
  | 'qiang-pacification' // 羌族安撫 — pacify Qiang (NW)
  | 'wuhuan-buffer'     // 烏桓緩衝 — manage Wuhuan
  | 'jiao-pacification' // 交州安撫 — pacify Jiaozhou (deep south)
  | 'liaodong-buffer';  // 遼東緩衝 — manage Gongsun clan in Liaodong

export const POLICY_DEFS: Record<PolicyId, { zh: string; en: string }> = {
  tuntian:             { zh: '屯田', en: 'Tuntian' },
  hydraulics:          { zh: '治水', en: 'Hydraulics' },
  engineering:         { zh: '工兵', en: 'Engineering' },
  commerce:            { zh: '商業', en: 'Commerce' },
  scholarship:         { zh: '学問', en: 'Scholarship' },
  legalism:            { zh: '法治', en: 'Legalism' },
  rites:               { zh: '礼楽', en: 'Rites' },
  recruitment:         { zh: '養兵', en: 'Recruitment' },
  smithing:            { zh: '鍛造', en: 'Smithing' },
  'horse-stewardship': { zh: '馬政', en: 'Horse Stewardship' },
  medicine:            { zh: '医術', en: 'Medicine' },
  'military-theory':   { zh: '軍学', en: 'Military Theory' },
  'salt-monopoly':     { zh: '鹽政', en: 'Salt Monopoly' },
  'iron-monopoly':     { zh: '鐵政', en: 'Iron Monopoly' },
  coinage:             { zh: '鑄幣', en: 'Coinage' },
  'silk-trade':        { zh: '絲綢之路', en: 'Silk Road Trade' },
  'tea-trade':         { zh: '茶馬貿易', en: 'Tea-Horse Trade' },
  'naval-academy':     { zh: '水軍', en: 'Naval Academy' },
  'crossbow-corps':    { zh: '弩兵', en: 'Crossbow Corps' },
  'border-garrison':   { zh: '邊防', en: 'Border Garrison' },
  'siege-school':      { zh: '攻城', en: 'Siege School' },
  'nine-grade':        { zh: '九品中正', en: 'Nine-Grade Rectifier' },
  'land-reform':       { zh: '均田', en: 'Equal-Field Reform' },
  'poor-relief':       { zh: '賑災', en: 'Famine Relief' },
  inspection:          { zh: '監察', en: 'Censorate' },
  'ancestor-rites':    { zh: '宗廟祭祀', en: 'Ancestor Rites' },
  astronomy:           { zh: '天文', en: 'Astronomy' },
  'calendar-reform':   { zh: '曆法', en: 'Calendar Reform' },
  'alliance-marriage': { zh: '和親', en: 'Marriage Alliance' },
  'tribute-system':    { zh: '朝貢', en: 'Tribute System' },
  'spy-network':       { zh: '細作', en: 'Spy Network' },
  propaganda:          { zh: '檄文', en: 'Proclamations' },
  'frontier-pacification': { zh: '撫夷', en: 'Frontier Pacification' },
  granary:             { zh: '倉廩', en: 'State Granaries' },
  'maritime-trade':    { zh: '海貿', en: 'Maritime Trade' },
  'silk-loom':         { zh: '蠶桑', en: 'Silk Weaving' },
  'ox-plowing':        { zh: '牛耕', en: 'Ox Plowing' },
  'fish-salt':         { zh: '漁鹽', en: 'Fishery & Salt' },
  fortifications:      { zh: '城防', en: 'Fortifications' },
  'ambush-corps':      { zh: '伏兵營', en: 'Ambush Corps' },
  'mountain-warfare':  { zh: '山戰', en: 'Mountain Warfare' },
  conscription:        { zh: '徵兵', en: 'Mass Conscription' },
  'elite-guards':      { zh: '親衛', en: 'Elite Guards' },
  arsenal:             { zh: '軍械庫', en: 'Arsenal' },
  'imperial-academy':  { zh: '太學', en: 'Imperial Academy' },
  'post-roads':        { zh: '驛站', en: 'Postal Roads' },
  'community-granary': { zh: '義倉', en: 'Community Granary' },
  'court-music':       { zh: '雅樂', en: 'Court Music' },
  buddhism:            { zh: '佛教', en: 'Buddhism' },
  taoism:              { zh: '道教', en: 'Taoism' },
  divination:          { zh: '卜筮', en: 'Divination' },
  'hostage-system':    { zh: '質子', en: 'Hostage System' },
  assassins:           { zh: '刺客', en: 'Assassins' },
  'counter-intel':     { zh: '反間', en: 'Counter-Intel' },
  'defector-reward':   { zh: '招降', en: 'Defector Reward' },
  'iron-tools':        { zh: '鐵具', en: 'Iron Tools' },
  'caravan-protection':{ zh: '護商', en: 'Caravan Protection' },
  'horse-trade':       { zh: '馬市', en: 'Horse Market' },
  'copper-mining':     { zh: '銅礦', en: 'Copper Mining' },
  'iron-mining':       { zh: '鐵礦', en: 'Iron Mining' },
  timber:              { zh: '林業', en: 'Timber Forestry' },
  'pearl-trade':       { zh: '珍珠貿', en: 'Pearl Trade' },
  'jade-trade':        { zh: '玉貿', en: 'Jade Trade' },
  corvee:              { zh: '力役', en: 'Corvée Labor' },
  'tax-light':         { zh: '輕徭薄賦', en: 'Light Taxes' },
  'watch-towers':      { zh: '烽燧', en: 'Beacon Towers' },
  'garrison-rotation': { zh: '番上', en: 'Garrison Rotation' },
  'chariot-corps':     { zh: '戰車', en: 'Chariot Corps' },
  'shield-wall':       { zh: '盾陣', en: 'Shield Wall' },
  'naval-fireships':   { zh: '火船', en: 'Naval Fireships' },
  'naval-rams':        { zh: '衝角', en: 'Naval Rams' },
  'horse-armor':       { zh: '馬鎧', en: 'Horse Armor' },
  'mountain-stronghold': { zh: '山寨', en: 'Mountain Stronghold' },
  'household-register':{ zh: '戶籍', en: 'Household Register' },
  examination:         { zh: '察舉', en: 'Examination System' },
  'mourning-rites':    { zh: '喪禮', en: 'Mourning Rites' },
  library:             { zh: '圖書', en: 'Imperial Library' },
  'music-bureau':      { zh: '樂府', en: 'Music Bureau' },
  'school-village':    { zh: '鄉學', en: 'Village Schools' },
  'imperial-edict':    { zh: '詔書', en: 'Imperial Edict' },
  'five-emperors':     { zh: '五帝祭', en: 'Five-Emperor Cult' },
  'mountain-spirit':   { zh: '山神祭', en: 'Mountain Spirit Rites' },
  'river-god':         { zh: '河神祭', en: 'River God Rites' },
  'envoy-bureau':      { zh: '鴻臚寺', en: 'Envoy Bureau' },
  'frontier-market':   { zh: '邊市', en: 'Frontier Market' },
  'captives-ransom':   { zh: '贖俘', en: 'Ransom Captives' },
  'gold-mining':       { zh: '金礦', en: 'Gold Mining' },
  'forest-conservation': { zh: '護林', en: 'Forest Conservation' },
  pottery:             { zh: '陶器', en: 'Pottery' },
  lacquerware:         { zh: '漆器', en: 'Lacquerware' },
  'merchant-guild':    { zh: '行會', en: 'Merchant Guild' },
  'river-customs':     { zh: '関稅', en: 'River Tolls' },
  'pawn-bureau':       { zh: '質庫', en: 'Pawn Bureau' },
  'court-treasury':    { zh: '內庫', en: 'Palace Treasury' },
  'bamboo-craft':      { zh: '竹器', en: 'Bamboo Crafts' },
  'sericulture-tax':   { zh: '桑稅', en: 'Silk Tax' },
  'archery-school':    { zh: '射禮', en: 'Archery School' },
  'military-drill':    { zh: '演武', en: 'Military Drill' },
  'supply-train':      { zh: '輜重', en: 'Supply Train' },
  'siege-tower':       { zh: '樓車', en: 'Siege Tower' },
  'engineer-corps':    { zh: '工程營', en: 'Engineer Corps' },
  'frontier-cavalry':  { zh: '邊騎', en: 'Frontier Cavalry' },
  'mountain-passes':   { zh: '關隘', en: 'Fortified Passes' },
  watchnight:          { zh: '夜禁', en: 'Night Curfew' },
  'spear-corps':       { zh: '槍隊', en: 'Pikeman Corps' },
  'assault-troops':    { zh: '突擊隊', en: 'Shock Troopers' },
  'noble-titles':      { zh: '封爵', en: 'Peerage Grants' },
  'imperial-tour':     { zh: '巡幸', en: 'Imperial Tour' },
  'charity-house':     { zh: '養濟院', en: 'Charity House' },
  mediation:           { zh: '鄉約', en: 'Village Mediation' },
  'standardize-weights': { zh: '度量衡', en: 'Standard Measures' },
  'standardize-script':  { zh: '文字', en: 'Standard Script' },
  'map-survey':        { zh: '圖經', en: 'Cartography' },
  'crime-amnesty':     { zh: '大赦', en: 'Mass Amnesty' },
  'temple-building':   { zh: '寺廟', en: 'Temple Construction' },
  'new-year-rites':    { zh: '元正', en: 'New Year Rites' },
  alchemy:             { zh: '煉丹', en: 'Daoist Alchemy' },
  'soul-prayer':       { zh: '招魂', en: 'Soul-Calling Rites' },
  bribery:             { zh: '收買', en: 'Bribery' },
  'propaganda-songs':  { zh: '童謠', en: 'Political Songs' },
  'nanman-tribute':    { zh: '南蠻朝貢', en: 'Nanman Tribute' },
  ironworks:           { zh: '鐵冶', en: 'State Ironworks' },
  shipyard:            { zh: '造船廠', en: 'Shipyard' },
  canal:               { zh: '運河', en: 'Canal' },
  'water-mill':        { zh: '水車', en: 'Water Mill' },
  weaving:             { zh: '紡織', en: 'Weaving Workshop' },
  'silver-mining':     { zh: '銀礦', en: 'Silver Mining' },
  'tea-cultivation':   { zh: '茶園', en: 'Tea Plantation' },
  bridges:             { zh: '修橋', en: 'Bridge Building' },
  caravansary:         { zh: '驛館', en: 'Caravansary' },
  'river-dredging':    { zh: '浚河', en: 'River Dredging' },
  'horse-breeding':    { zh: '牧苑', en: 'State Stud Farm' },
  'famine-loans':      { zh: '借糧', en: 'Famine Loans' },
  'skirmish-corps':    { zh: '散兵', en: 'Skirmishers' },
  'light-cavalry':     { zh: '輕騎', en: 'Light Cavalry' },
  'bandit-suppression':{ zh: '剿匪', en: 'Bandit Suppression' },
  'pirate-suppression':{ zh: '剿海寇', en: 'Pirate Suppression' },
  'veteran-pension':   { zh: '退伍', en: 'Veteran Pension' },
  'military-academy':  { zh: '武備學堂', en: 'Military Academy' },
  'moat-construction': { zh: '護城河', en: 'Moats' },
  'camp-discipline':   { zh: '軍紀', en: 'Camp Discipline' },
  'river-watchtower':  { zh: '江樓', en: 'River Watchtower' },
  'coastal-fortress':  { zh: '海防', en: 'Coastal Fortress' },
  'six-ministers':     { zh: '三公九卿', en: 'Central Ministries' },
  protocol:            { zh: '朝儀', en: 'Court Protocol' },
  'royal-physicians':  { zh: '太醫', en: 'Royal Physicians' },
  'imperial-guard':    { zh: '禁衛', en: 'Imperial Guard' },
  'official-promotion':{ zh: '升遷', en: 'Promotion Track' },
  'royal-park':        { zh: '苑囿', en: 'Royal Park' },
  'prefecture-reform': { zh: '郡縣改革', en: 'Prefecture Reform' },
  'land-survey':       { zh: '計畝', en: 'Land Survey' },
  'sky-altar':         { zh: '圜丘', en: 'Altar of Heaven' },
  'earth-altar':       { zh: '方丘', en: 'Altar of Earth' },
  'mountain-pilgrimage': { zh: '朝山', en: 'Mountain Pilgrimage' },
  'ancestral-temple':  { zh: '太廟', en: 'Ancestral Temple' },
  'xianbei-buffer':    { zh: '鮮卑緩衝', en: 'Xianbei Buffer' },
  'xiongnu-tribute':   { zh: '匈奴朝貢', en: 'Xiongnu Tribute' },
  'qiang-pacification':{ zh: '羌族安撫', en: 'Qiang Pacification' },
  'wuhuan-buffer':     { zh: '烏桓緩衝', en: 'Wuhuan Buffer' },
  'jiao-pacification': { zh: '交州安撫', en: 'Jiao Pacification' },
  'liaodong-buffer':   { zh: '遼東緩衝', en: 'Liaodong Buffer' },
};

/**
 * Policy prerequisites — RTK 14-style research tree.
 *
 * Each entry's policy only takes effect in a city if ALL prerequisites are
 * also held by some officer stationed there. Lets us model "advanced civic
 * art that builds on basics" — e.g. you need 屯田 (agriculture basics) in
 * the city before 大農政 (mass farming) does anything.
 *
 * Policies not in this map have no prereqs (unlocked from the start).
 * UI: see PoliciesModal — locked policies render with a 🔒 chip and the
 * prereq listed in the tooltip.
 */
/**
 * Tactic prerequisites — advanced/signature tactics require an officer
 * to first know foundational tactics. Mirrors POLICY_PREREQ but for the
 * battle-tactics tree. Most basic tactics (charge, volley, fire-attack
 * etc.) have NO prereq — they're entry-level. Famous named tactics
 * (借東風, 八門遁甲) gate on the underlying ideas.
 */
export const TACTIC_PREREQ: Partial<Record<TacticId, TacticId[]>> = {
  // Fire chain
  'borrow-wind':  ['fire-attack'],
  'burn-bowang':  ['fire-attack', 'borrow-wind'],
  'burn-xinye':   ['burn-bowang'],
  'burn-chibi':   ['fire-attack', 'borrow-wind'],
  'burn-yiling':  ['fire-attack'],
  'luxun-fire':   ['fire-attack'],
  'loot-fire':    ['fire-attack'],
  'watch-fire':   ['fire-attack'],
  // Water chain
  'water-attack': [],
  'chain-ship':   ['water-attack'],
  // Mystic / Daoist
  'thunder':      ['fire-attack'],
  'eight-gates':  ['ruse', 'disorder'],
  'star-prayer':  ['eight-gates'],
  'seven-lamp':   ['star-prayer'],
  // Stratagem chain (deception)
  'ruse':         [],
  'deception':    ['ruse'],
  'feint':        ['ruse'],
  'hide-knife':   ['ruse', 'deception'],
  'beauty':       ['ruse', 'disorder'],
  'self-injury':  ['ruse'],
  'borrow-arrow': ['ruse'],
  'feign-mad':    ['ruse'],
  'chain':        ['ruse', 'disorder'],
  // Cavalry surge
  'rush':         ['charge'],
  'changban':     ['charge', 'rush'],
  // Archery
  'zhuge-bow':    ['crossbow', 'volley'],
  'fire-arrow':   ['volley', 'fire-attack'],
  // Defense / endurance
  'iron-wall':    [],
  'last-stand':   [],
  'wait-tired':   ['iron-wall'],
  // Ambush / surprise
  'ambush':       [],
  'white-robe':   ['ambush'],
  'sneak-cross':  ['ambush', 'feint'],
  // Logistics
  'cut-supply':   ['ambush'],
  'wooden-ox':    [],
  // Diplomacy / verbal
  'curse':        [],
  'tongue-war':   ['curse'],
  'chu-songs':    ['curse', 'disorder'],
  // Signature high-tier
  'seven-grab':   ['eight-gates'],
  'six-expeditions': ['seven-grab'],
  'longzhong':    ['eight-gates', 'wait-tired'],
  'kill-king':    ['ambush', 'feint'],
  'borrow-knife': ['ruse', 'hide-knife'],
  'borrow-corpse': ['ruse'],
  'borrow-road':  ['ruse', 'feint'],
  'switch-beam':  ['ruse', 'deception'],
  'pull-ladder':  ['ruse'],
  'door-thief':   ['ambush'],
  'lure-tiger':   ['ruse', 'feint'],
  'loose-catch':  ['ruse'],
  'muddy-fish':   ['disorder'],
  'cicada':       ['ruse', 'deception'],
  'tree-flower':  ['deception', 'feint'],
  'guest-host':   ['ruse', 'feign-mad'],
};

export const POLICY_PREREQ: Partial<Record<PolicyId, PolicyId[]>> = {
  // ── Agriculture tree ──
  'ox-plowing':          ['tuntian'],
  'iron-tools':          ['tuntian', 'smithing'],
  'water-mill':          ['hydraulics'],
  'community-granary':   ['tuntian'],
  // ── Commerce tree ──
  'silk-trade':          ['commerce'],
  'tea-trade':           ['commerce'],
  'maritime-trade':      ['commerce', 'naval-academy'],
  'pearl-trade':         ['maritime-trade'],
  'jade-trade':          ['silk-trade'],
  'river-customs':       ['commerce'],
  // ── Monopoly / industry tree ──
  'iron-monopoly':       ['iron-tools'],
  'salt-monopoly':       ['legalism'],
  'coinage':             ['commerce', 'legalism'],
  'gold-mining':         ['engineering'],
  'silver-mining':       ['engineering'],
  'copper-mining':       ['engineering'],
  // ── Military tree ──
  'crossbow-corps':      ['military-theory'],
  'archery-school':      ['military-theory'],
  'military-academy':    ['military-theory', 'scholarship'],
  'camp-discipline':     ['recruitment'],
  'horse-armor':         ['smithing', 'horse-stewardship'],
  'horse-breeding':      ['horse-stewardship'],
  'shield-wall':         ['smithing'],
  'elite-guards':        ['recruitment', 'camp-discipline'],
  'imperial-guard':      ['rites', 'elite-guards'],
  // ── Defense tree ──
  'moat-construction':   ['engineering'],
  'watch-towers':        ['engineering'],
  'fortifications':      ['engineering', 'corvee'],
  'mountain-passes':     ['fortifications'],
  'coastal-fortress':    ['fortifications', 'naval-academy'],
  // ── Naval tree ──
  // 'naval-academy' is a base policy
  // ── Social / loyalty tree ──
  'poor-relief':         ['rites'],
  'charity-house':       ['poor-relief'],
  'mediation':           ['rites'],
  'tax-light':           ['legalism'],
  'frontier-pacification':['rites'],
  // ── Frontier / tribal tree ──
  'xianbei-buffer':      ['frontier-pacification'],
  'xiongnu-tribute':     ['frontier-pacification'],
  'qiang-pacification':  ['frontier-pacification'],
  'wuhuan-buffer':       ['frontier-pacification'],
  'jiao-pacification':   ['frontier-pacification'],
  'liaodong-buffer':     ['frontier-pacification'],
};

export const OFFICER_POLICIES: Record<string, PolicyId[]> = {
  // ─── 魏 Wei — central court ─────────────────────────
  'cao-cao':      ['tuntian', 'legalism', 'recruitment', 'military-theory', 'salt-monopoly', 'iron-monopoly', 'spy-network', 'propaganda', 'elite-guards', 'arsenal', 'counter-intel', 'examination', 'household-register', 'horse-armor', 'iron-mining', 'imperial-edict', 'noble-titles', 'military-drill', 'crime-amnesty', 'standardize-weights', 'bribery', 'soul-prayer', 'ironworks', 'military-academy', 'camp-discipline', 'protocol', 'six-ministers', 'land-survey', 'wuhuan-buffer', 'xianbei-buffer'],
  'sima-yi':      ['legalism', 'recruitment', 'military-theory', 'spy-network', 'border-garrison', 'counter-intel', 'ambush-corps', 'fortifications', 'watch-towers', 'garrison-rotation', 'mountain-passes', 'supply-train', 'bribery', 'military-academy', 'camp-discipline', 'liaodong-buffer', 'wuhuan-buffer'],
  'sima-shi':     ['legalism', 'inspection', 'nine-grade'],
  'sima-zhao':    ['legalism', 'inspection', 'spy-network'],
  'xun-you':      ['legalism', 'scholarship', 'spy-network'],
  'guo-jia':      ['military-theory', 'legalism', 'spy-network'],
  'zao-zhi':      ['tuntian', 'hydraulics', 'poor-relief'],
  'ren-jun':      ['tuntian', 'hydraulics'],
  'wang-lang':    ['scholarship', 'rites', 'ancestor-rites'],
  'hua-xin':      ['rites', 'scholarship', 'inspection'],
  'mao-jie':      ['legalism', 'tuntian', 'inspection'],
  // ─── 蜀 Shu ─────────────────────────────────────────
  'zhuge-liang':  ['legalism', 'tuntian', 'engineering', 'military-theory', 'crossbow-corps', 'frontier-pacification', 'astronomy', 'calendar-reform', 'fortifications', 'mountain-warfare', 'divination', 'post-roads', 'iron-tools', 'school-village', 'watch-towers', 'shield-wall', 'mountain-stronghold', 'supply-train', 'engineer-corps', 'map-survey', 'mountain-passes', 'standardize-weights', 'water-mill', 'bridges', 'camp-discipline', 'land-survey', 'jiao-pacification'],
  'pang-tong':    ['military-theory', 'legalism', 'land-reform'],
  'fa-zheng':     ['legalism', 'military-theory', 'spy-network'],
  'dong-yun':     ['legalism', 'rites', 'inspection'],
  'jian-yong':    ['rites', 'commerce'],
  'sun-qian':     ['rites', 'commerce', 'tribute-system'],
  'ma-su':        ['military-theory', 'scholarship', 'frontier-pacification'],
  'liao-hua':     ['border-garrison', 'recruitment'],
  'ma-liang':     ['scholarship', 'rites', 'frontier-pacification'],
  // ─── 吳 Wu ──────────────────────────────────────────
  'sun-quan':     ['commerce', 'recruitment', 'legalism', 'naval-academy', 'salt-monopoly', 'silk-trade', 'tribute-system', 'maritime-trade', 'fish-salt', 'pearl-trade', 'naval-fireships', 'naval-rams', 'timber', 'envoy-bureau', 'merchant-guild', 'river-customs', 'lacquerware', 'noble-titles', 'shipyard', 'tea-cultivation', 'pirate-suppression', 'coastal-fortress', 'river-watchtower', 'jiao-pacification', 'royal-park'],
  'sun-ce':       ['recruitment', 'naval-academy', 'border-garrison', 'maritime-trade'],
  'zhang-zhao':   ['rites', 'scholarship', 'legalism', 'nine-grade', 'ancestor-rites'],
  'zhang-hong':   ['rites', 'scholarship'],
  'gu-yong':      ['legalism', 'rites', 'scholarship', 'inspection'],
  'zhuge-ke':     ['military-theory', 'legalism', 'recruitment'],
  'lu-kang':      ['military-theory', 'border-garrison', 'naval-academy'],
  'bu-zhi':       ['rites', 'scholarship', 'frontier-pacification'],
  'lu-dai':       ['naval-academy', 'border-garrison', 'frontier-pacification'],
  // ─── 群雄 / early warlords ─────────────────────────
  'liu-zhang':    ['rites', 'commerce'],
  'yuan-shao':    ['rites', 'scholarship', 'recruitment'],
  'yuan-shu':     ['ancestor-rites'],
  'huangfu-song': ['military-theory', 'recruitment'],
  'zhu-jun':      ['military-theory', 'recruitment'],
  'dong-zhuo':    ['recruitment', 'horse-stewardship', 'propaganda'],
  'li-ru':        ['legalism', 'spy-network'],
  // ─── 黃巾 / 妖道 ────────────────────────────────────
  // ─── 學者 Scholars ──────────────────────────────────
  'hua-tuo':      ['medicine', 'scholarship'],
  'zhang-zhongjing': ['medicine', 'scholarship', 'poor-relief'],
  'sima-hui':     ['scholarship', 'rites'],
  'pang-degong':  ['scholarship', 'rites'],
  'cui-zhouping': ['scholarship', 'rites'],
  'huang-chengyan':['scholarship', 'engineering'],
  'xu-shao':      ['scholarship', 'rites', 'inspection'],
  'chen-shou':    ['scholarship', 'rites'],
  // (craftsmen ma-jun, pu-yuan, huo-zhi aren't in the playable roster)

  // ─── Officers known for SPECIFIC specialties ─────────────────────────
  // ── Defense / fortifications ──
  'hao-zhao':     ['fortifications', 'arsenal', 'recruitment'],         // 陳倉死守
  'huo-jun':      ['fortifications', 'mountain-warfare', 'recruitment'],// 葭萌死守
  'yan-yan':      ['fortifications', 'mountain-warfare'],
  // ── Elite-guard commanders ──
  'cao-chun':     ['elite-guards', 'horse-stewardship'],                // 虎豹騎統領
  'dian-wei':     ['elite-guards', 'recruitment'],                      // 曹操親衛
  'xu-chu':       ['elite-guards', 'recruitment'],                      // 曹操親衛
  'zhou-tai':     ['elite-guards', 'recruitment'],                      // 孫權親衛
  // ── Ambush / guerrilla specialists ──
  'wei-yan':      ['ambush-corps', 'mountain-warfare', 'recruitment'],  // 子午谷計
  'jiang-wei':    ['military-theory', 'tuntian', 'border-garrison', 'crossbow-corps', 'ambush-corps', 'mountain-warfare'],
  'zhou-fang':    ['counter-intel', 'spy-network'],                     // 斷髮詐降
  // ── Assassins / intel ──
  'wang-yun':     ['legalism', 'rites', 'spy-network', 'assassins', 'counter-intel'],  // 連環美人計
  'jia-chong':    ['legalism', 'inspection', 'spy-network', 'assassins'],              // 弒高貴鄉公
  'guo-tu':       ['spy-network', 'counter-intel'],
  'cheng-yu':     ['legalism', 'military-theory', 'spy-network', 'ambush-corps'],
  'liu-ye':       ['military-theory', 'spy-network', 'propaganda', 'counter-intel'],
  // ── Conscription / recruitment specialists ──
  'sun-jian':     ['recruitment', 'naval-academy', 'maritime-trade', 'conscription'],
  'lu-xun':       ['military-theory', 'tuntian', 'naval-academy', 'frontier-pacification', 'mountain-warfare'],
  // (Wei Wen and Zhuge Zhi who sailed to 夷洲 aren't in the playable roster)
  // ── Agricultural pioneers ──
  // ── Imperial Academy ──
  'liu-xie':      ['ancestor-rites', 'rites', 'imperial-academy', 'court-music'],
  'zheng-xuan':   ['scholarship', 'rites', 'ancestor-rites', 'imperial-academy'],
  // ── Buddhism / Taoism patrons ──
  // ── Defector-reward (recruitment via clemency) ──
  'liu-bei':      ['rites', 'recruitment', 'ancestor-rites', 'poor-relief', 'defector-reward'],
  'guan-yu':      ['defector-reward'],                                  // famously 義釋華容
  // ── Post-roads / logistics ──
  'jiang-wan':    ['legalism', 'scholarship', 'tuntian', 'poor-relief', 'post-roads', 'granary', 'household-register', 'corvee'],
  'fei-yi':       ['legalism', 'rites', 'scholarship', 'poor-relief', 'post-roads', 'examination'],

  // ─── Phase 3: more famous lore-policy associations ──────────────────
  // ── Naval doctrine specialists ──
  'huang-gai':    ['naval-fireships', 'naval-academy'],                 // 黃蓋火攻
  'zhou-yu':      ['military-theory', 'naval-academy', 'recruitment', 'naval-fireships'],   // 赤壁主將
  'lu-meng':      ['military-theory', 'naval-academy', 'spy-network', 'mountain-warfare', 'shield-wall'],  // 山越討伐
  // ── Frontier / horse-trade specialists ──
  'ma-teng':      ['horse-stewardship', 'recruitment', 'border-garrison', 'horse-trade', 'tea-trade'],
  'han-sui':      ['horse-stewardship', 'border-garrison', 'horse-trade'],
  'gongsun-zan':  ['horse-stewardship', 'recruitment', 'border-garrison', 'horse-armor', 'watch-towers'],  // 白馬義從 — armored cavalry
  // ── Examination / talent system ──
  'lu-zhi':       ['scholarship', 'rites', 'military-theory', 'examination', 'imperial-edict'],  // mentor of Liu Bei
  'chen-qun':     ['nine-grade', 'legalism', 'scholarship', 'rites', 'examination'],
  // ── Pearls / coastal Wu ──
  // ── Music bureau / poets ──
  'cao-zhi':      ['music-bureau', 'court-music', 'library'],
  // ── Library / scholars ──
  'cai-yong':     ['scholarship', 'rites', 'calendar-reform', 'astronomy', 'imperial-academy', 'court-music', 'library', 'music-bureau', 'mourning-rites'],
  'wang-can':     ['scholarship', 'rites', 'imperial-academy', 'library'],
  // ── Mountain / forest war specialists ──
  'shamoke':      ['mountain-warfare', 'mountain-stronghold'],
  // ── Watch-tower / border specialists ──
  'tian-yu':      ['border-garrison', 'watch-towers', 'horse-stewardship'],   // Wei's NE border defender
  'man-chong':    ['legalism', 'border-garrison', 'inspection', 'watch-towers', 'fortifications'],  // 合肥新城
  'guo-huai':     ['border-garrison', 'watch-towers', 'horse-stewardship'],
  // ── Light-tax / popular governors ──
  'liu-yan':      ['legalism', 'rites', 'frontier-pacification', 'tax-light', 'household-register'],
  'liu-biao':     ['rites', 'scholarship', 'commerce', 'tax-light', 'poor-relief'],
  // ── Diplomats ──
  'zhuge-jin':    ['rites', 'scholarship', 'legalism', 'tribute-system', 'envoy-bureau', 'hostage-system'],
  'deng-zhi':     ['envoy-bureau', 'tribute-system'],  // 鄧芝 — Shu-Wu reconciler
  // ── Engineering / works ──
  // ── Imperial mints / minting reform ──
  // ── Captives ransom / mercy ──
  // ── Religious / divinatory ──
  // ── Frontier markets ──
  'wen-pin':      ['border-garrison', 'frontier-market', 'fortifications'],
  // ── Shield-wall / heavy infantry ──
  // ── Imperial-edict / Han loyalists ──
  'dong-cheng':   ['imperial-edict', 'ancestor-rites', 'noble-titles'],

  // ─── Phase 4 specializations ───────────────────────────────────────
  // ── Cavalry / armored cavalry ──
  'lu-bu':        ['horse-armor', 'recruitment', 'horse-stewardship', 'frontier-cavalry'],
  // ── Daoist alchemy / soul-prayer ──
  'nanhua-laoxian':['taoism', 'divination', 'alchemy'],
  'guan-lu':      ['divination', 'taoism', 'astronomy', 'alchemy'],
  // ── Mountain pass / pass defenders ──
  'wang-ping':    ['ambush-corps', 'mountain-warfare', 'mountain-passes'],   // 街亭 ambush
  'deng-ai':      ['ambush-corps', 'mountain-warfare', 'border-garrison', 'mountain-passes', 'supply-train'],  // 偷渡陰平
  'zhang-he':     ['ambush-corps', 'mountain-warfare', 'mountain-passes'],   // 木門道 ambush victim
  // ── Charity / poor-relief / mediation governors ──
  'tao-qian':     ['rites', 'poor-relief', 'charity-house', 'mediation'],
  'kong-rong':    ['rites', 'scholarship', 'poor-relief', 'charity-house', 'mediation'],
  // ── Pawn / merchant / treasury specialists ──
  'mi-zhu':       ['commerce', 'rites', 'salt-monopoly', 'silk-trade', 'merchant-guild', 'pawn-bureau', 'sericulture-tax'],   // mega-merchant
  // ── Engineering / siege ──
  'liu-fu':       ['tuntian', 'hydraulics', 'commerce', 'poor-relief', 'ox-plowing', 'silk-loom', 'iron-tools', 'corvee', 'engineer-corps', 'siege-tower'],
  // ── Bow / archery school ──
  'huang-zhong':  ['archery-school', 'recruitment'],   // 老將射神
  // ── Drill / training ──
  'gao-shun':     ['shield-wall', 'elite-guards', 'recruitment', 'military-drill', 'assault-troops'],   // 陷陣營 was elite shock troops
  // ── Maps / surveying ──
  'du-yu':        ['scholarship', 'military-theory', 'calendar-reform', 'naval-academy', 'map-survey'],   // also 春秋集解
  // ── Imperial tours ──
  'cao-pi':       ['nine-grade', 'legalism', 'rites', 'ancestor-rites', 'music-bureau', 'library', 'examination', 'imperial-edict', 'imperial-tour', 'noble-titles'],
  'cao-rui':      ['rites', 'ancestor-rites', 'astronomy', 'imperial-tour', 'temple-building'],   // famed temple-builder
  'sima-yan':     ['land-reform', 'nine-grade', 'rites', 'ancestor-rites', 'imperial-tour', 'noble-titles', 'crime-amnesty', 'inspection', 'household-register'],
  // ── Daoist mystics + alchemists ──
  'zhang-jiao':   ['poor-relief', 'propaganda', 'ancestor-rites', 'taoism', 'divination', 'community-granary', 'soul-prayer', 'propaganda-songs', 'alchemy'],
  'zhang-lu':     ['poor-relief', 'rites', 'ancestor-rites', 'taoism', 'community-granary', 'charity-house', 'mediation'],
  // ── Buddhism patrons ──
  'ze-rong':      ['buddhism', 'commerce', 'temple-building'],   // built first major Buddhist temple
  // ── Pikeman / spear specialists ──
  'zhang-fei':    ['spear-corps', 'shield-wall', 'recruitment'],  // 丈八蛇矛
  'ma-chao':      ['horse-stewardship', 'recruitment', 'spear-corps', 'frontier-cavalry', 'horse-trade'],
  // ── Bribery / agents ──
  'jia-xu':       ['military-theory', 'legalism', 'spy-network', 'bribery', 'counter-intel'],
  // (Chen Fan 陳蕃 — anti-eunuch reformer — isn't in the roster yet)
  // ── Nanman tribute ──
  'meng-huo':     ['mountain-warfare', 'mountain-stronghold', 'frontier-pacification', 'nanman-tribute'],
  // ── Forest conservation (peaceful Wu governance) ──
  'lu-su':        ['commerce', 'rites', 'recruitment', 'naval-academy', 'tea-trade', 'envoy-bureau', 'captives-ransom', 'forest-conservation', 'merchant-guild', 'shipyard', 'tea-cultivation'],

  // ─── Phase 5 specializations ────────────────────────────────────────
  // ── Canal / water-works specialists ──
  'wang-jun':     ['naval-academy', 'engineering', 'siege-school', 'shipyard', 'timber', 'river-dredging'],  // 王濬樓船下益州
  // ── Pirate / coastal Wu ──
  'gan-ning':     ['naval-rams', 'maritime-trade', 'naval-academy', 'caravan-protection', 'pirate-suppression', 'coastal-fortress'],   // ex-pirate himself
  'ling-tong':    ['naval-academy', 'pirate-suppression'],
  // ── Frontier officers ──
  'gongsun-du':   ['liaodong-buffer', 'border-garrison', 'horse-stewardship'],   // ruler of 遼東
  'gongsun-yuan': ['liaodong-buffer', 'border-garrison'],
  // ── Wuhuan / Xianbei front ──
  'tian-chou':    ['wuhuan-buffer', 'xianbei-buffer', 'border-garrison'],   // Cao's NE specialist
  'qian-zhao':    ['wuhuan-buffer', 'xianbei-buffer', 'border-garrison'],   // similar
  // ── Qiang / NW frontier (Cao Wei) ──
  'su-ze':        ['qiang-pacification', 'frontier-pacification'],
  // ── Light cavalry / scout ──
  'xiahou-yuan':  ['horse-stewardship', 'light-cavalry', 'recruitment'],   // famed for rapid marches
  // ── Camp discipline / iron-handed leaders ──
  'zhang-liao':   ['camp-discipline', 'recruitment', 'elite-guards'],
  // ── Imperial guard commanders ──
  'cao-zhen':     ['imperial-guard', 'recruitment', 'border-garrison'],
  // ── Royal parks (Wu's 華林園) ──
  'sun-hao':      ['royal-park', 'temple-building', 'crime-amnesty'],   // notorious for extravagance
  // ── Pottery / lacquerware specialists ──
  // (mostly anonymous artisans; no famous officer)
  // ── Three-Lords-Nine-Ministers reform ──
  'zhong-yao':    ['scholarship', 'rites', 'hydraulics', 'calendar-reform', 'coinage', 'copper-mining', 'six-ministers', 'protocol'],
  // ── Bandit suppression ──
  'cao-ren':      ['fortifications', 'recruitment', 'elite-guards', 'bandit-suppression'],
  // ── Land survey ──
  'cui-yan':      ['rites', 'scholarship', 'nine-grade', 'inspection', 'land-survey'],
  // ── Veteran care ──
  'wu-yi':        ['recruitment', 'veteran-pension'],
  // ── Ancestral temple / sky altar ──
  'liu-yu':       ['poor-relief', 'tribute-system', 'rites', 'mediation', 'tax-light', 'charity-house', 'sky-altar', 'ancestral-temple'],
  // ── Mountain pilgrimage / Daoist saints ──
  'zuo-ci':       ['taoism', 'divination', 'alchemy', 'soul-prayer', 'mountain-pilgrimage'],
  'yu-ji':        ['taoism', 'divination', 'alchemy', 'soul-prayer', 'mountain-pilgrimage'],
  // ── Xiongnu tribute (Cao Cao's Xiongnu chanyu reception) ──
  'cai-wenji':    ['scholarship', 'rites', 'xiongnu-tribute'],   // famously taken to Xiongnu
  // ── Jiao pacification ──
  'shi-xie':      ['pearl-trade', 'maritime-trade', 'tribute-system', 'jiao-pacification'],   // governor of Jiaozhou
  // ── Liu Yan in Shu had jiao-pacification too (later expanded by Zhuge southern campaign) ──
  // ── Military academy ──
  'xun-yu':       ['legalism', 'scholarship', 'rites', 'ancestor-rites', 'nine-grade', 'military-academy', 'examination'],
  // ─── 歷代名將 ───
  ...HISTORICAL_POLICIES,
};

function policyBucket(id: string | undefined, mod: number): number {
  if (!id) return 0;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = ((h ^ id.charCodeAt(i)) * 16777619) >>> 0;
  return h % mod;
}

export function derivePolicies(stats: OfficerStats, id?: string): PolicyId[] {
  if (id && OFFICER_POLICIES[id]) return OFFICER_POLICIES[id];
  const { war, intelligence, politics, charisma, leadership } = stats;
  const list: PolicyId[] = [];
  const b = policyBucket(id, 8);

  // ── Top-tier statesman ──
  if (politics >= 90) list.push('legalism', (['nine-grade', 'inspection', 'ancestor-rites'] as const)[b % 3]);
  else if (politics >= 80) list.push('legalism', (['inspection', 'rites'] as const)[b % 2]);

  // ── Scholar / classicist ──
  if (intelligence >= 85 && politics >= 70) list.push('scholarship', (['calendar-reform', 'astronomy'] as const)[b % 2]);
  else if (intelligence >= 75 && politics >= 60) list.push('scholarship');

  // ── Civil ritual / propriety ──
  if (politics >= 75 && charisma >= 75) list.push((['rites', 'ancestor-rites'] as const)[b % 2]);

  // ── Agricultural / land ──
  if (politics >= 70 && intelligence >= 70) list.push((['tuntian', 'land-reform', 'poor-relief'] as const)[b % 3]);
  else if (politics >= 65) list.push('tuntian');

  // ── Military prep ──
  if (politics >= 70 && war >= 70) list.push('recruitment');
  if (war >= 80 && leadership >= 80) list.push((['border-garrison', 'military-theory'] as const)[b % 2]);
  if (intelligence >= 80 && war >= 60) list.push((['military-theory', 'crossbow-corps'] as const)[b % 2]);

  // ── Trade / commerce ──
  if (charisma >= 80 && politics >= 60) list.push((['commerce', 'silk-trade', 'tea-trade'] as const)[b % 3]);
  if (politics >= 75 && intelligence >= 70 && war < 60) list.push((['salt-monopoly', 'iron-monopoly', 'coinage'] as const)[b % 3]);

  // ── Engineering / hydraulics ──
  if (intelligence >= 75 && war < 60) list.push((['hydraulics', 'engineering', 'siege-school'] as const)[b % 3]);
  if (intelligence >= 70 && politics >= 65 && war < 50) list.push((['engineering', 'smithing'] as const)[b % 2]);

  // ── Naval (water-stat heuristic: high LED + medium WAR + low cavalry stat) ──
  if (leadership >= 80 && war >= 60 && war < 90) list.push('naval-academy');

  // ── Cavalry / horse ──
  if (war >= 85 && leadership >= 70) list.push('horse-stewardship');

  // ── Intelligence / espionage ──
  if (intelligence >= 85 && politics >= 70) list.push((['spy-network', 'propaganda'] as const)[b % 2]);

  // ── Diplomacy ──
  if (charisma >= 85 && politics >= 70) list.push((['alliance-marriage', 'tribute-system'] as const)[b % 2]);

  // ── Medicine / spiritual (low war, high charisma sage type) ──
  if (war < 40 && charisma >= 80) list.push((['medicine', 'ancestor-rites'] as const)[b % 2]);

  // Cap at 4 to keep panel tidy.
  return Array.from(new Set(list)).slice(0, 4);
}

// ──────────────────────────────────────────────────────────────────────
// Lv. (Officer Level)
// Computed from total stats — average stat rounded.
// ──────────────────────────────────────────────────────────────────────

export function deriveLevel(stats: OfficerStats): number {
  const sum =
    stats.leadership + stats.war + stats.intelligence +
    stats.politics + stats.charisma;
  // Average stat rounded to nearest integer = level (1-100 range).
  return Math.max(1, Math.min(100, Math.round(sum / 5)));
}
