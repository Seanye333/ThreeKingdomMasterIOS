import type { OfficerStats } from '../types';

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
  | 'wild-geese'   // 雁行 — ranged echelon
  | 'yoke'         // 衡軛 — anti-cavalry pikes
  | 'crescent'     // 偃月 — siege crescent
  | 'long-snake';  // 長蛇 — line march

export const FORMATION_DEFS: Record<OfficerFormationId, { zh: string; en: string }> = {
  'crane-wing': { zh: '鶴翼', en: 'Crane-Wing' },
  'fish-scale': { zh: '魚鱗', en: 'Fish-Scale' },
  'arrow-tip':  { zh: '鋒矢', en: 'Arrow-Tip' },
  'square':     { zh: '方圓', en: 'Square' },
  'wild-geese': { zh: '雁行', en: 'Wild-Geese' },
  'yoke':       { zh: '衡軛', en: 'Yoke' },
  'crescent':   { zh: '偃月', en: 'Crescent' },
  'long-snake': { zh: '長蛇', en: 'Long-Snake' },
};

/** Explicit formation pools for famous officers. */
export const OFFICER_FORMATIONS: Record<string, OfficerFormationId[]> = {
  'cao-cao':      ['arrow-tip', 'fish-scale', 'crane-wing', 'wild-geese'],
  'zhuge-liang':  ['crane-wing', 'square', 'wild-geese', 'long-snake'],
  'sima-yi':      ['fish-scale', 'square', 'yoke', 'crane-wing'],
  'lu-bu':        ['arrow-tip', 'long-snake'],
  'guan-yu':      ['arrow-tip', 'crescent', 'long-snake'],
  'zhang-fei':    ['arrow-tip', 'long-snake'],
  'zhao-yun':     ['arrow-tip', 'crane-wing', 'long-snake'],
  'ma-chao':      ['arrow-tip', 'long-snake'],
  'huang-zhong':  ['wild-geese', 'crescent'],
  'wei-yan':      ['arrow-tip', 'fish-scale'],
  'zhang-liao':   ['arrow-tip', 'fish-scale', 'long-snake'],
  'xu-chu':       ['arrow-tip', 'fish-scale'],
  'xiahou-dun':   ['arrow-tip', 'fish-scale', 'long-snake'],
  'xiahou-yuan':  ['arrow-tip', 'crescent', 'long-snake'],
  'zhou-yu':      ['crane-wing', 'fish-scale', 'wild-geese'],
  'lu-meng':      ['fish-scale', 'crane-wing', 'square'],
  'lu-xun':       ['crane-wing', 'fish-scale', 'square', 'wild-geese'],
  'gan-ning':     ['arrow-tip', 'long-snake'],
  'tai-shi-ci':   ['arrow-tip', 'wild-geese'],
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
  'tian-yu':      ['wild-geese', 'long-snake'],
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
  if (intelligence >= 80) list.push('wild-geese');
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
  | 'zhao-yun-baby' | 'huang-zhong-dingjun' | 'zhou-yu-plan' | 'seek-talent' | 'he-jin-blunder';

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
};

export const OFFICER_TACTICS: Record<string, TacticId[]> = {
  'cao-cao':     ['fire-attack', 'rouse', 'ambush'],
  'zhuge-liang': ['fire-attack', 'water-attack', 'ruse', 'pitfall'],
  'sima-yi':     ['ruse', 'pitfall', 'rouse'],
  'guo-jia':     ['fire-attack', 'ambush', 'ruse'],
  'jia-xu':      ['ruse', 'ambush', 'fire-attack'],
  'zhou-yu':     ['fire-attack', 'water-attack', 'rouse'],
  'lu-xun':      ['fire-attack', 'ruse', 'pitfall'],
  'lu-meng':     ['ruse', 'rouse'],
  'pang-tong':   ['fire-attack', 'ruse'],
  'fa-zheng':    ['ruse', 'pitfall'],
  'jiang-wei':   ['ruse', 'pitfall', 'fire-attack'],
  'deng-ai':     ['ruse', 'ambush'],
  'lu-bu':       ['charge', 'rouse'],
  'guan-yu':     ['charge', 'volley'],
  'zhang-fei':   ['charge', 'curse', 'rouse'],
  'zhao-yun':    ['charge', 'rouse'],
  'ma-chao':     ['charge', 'rouse'],
  'huang-zhong': ['volley', 'charge'],
  'zhang-liao':  ['charge', 'ambush', 'rouse'],
  'xu-chu':      ['charge', 'curse'],
  'dian-wei':    ['charge', 'curse'],
  'gan-ning':    ['charge', 'ambush'],
  'tai-shi-ci':  ['charge', 'volley'],
  'wei-yan':     ['charge', 'ambush'],
  'wen-chou':    ['charge'],
  'yan-liang':   ['charge'],
  'pang-de':     ['charge', 'volley'],
  'xu-huang':    ['charge', 'ambush'],
  'zhang-he':    ['charge', 'ambush'],
  'sun-ce':      ['charge', 'rouse'],
  'sun-jian':    ['charge', 'rouse'],
  'cao-ren':     ['rouse', 'volley'],
  'hao-zhao':    ['volley', 'catapult'],
  'huang-gai':   ['fire-attack', 'charge'],
  'cheng-pu':    ['charge', 'rouse'],
  'tian-feng':   ['ruse', 'pitfall'],
  'ju-shou':     ['ruse', 'rouse'],
  'shen-pei':    ['volley', 'catapult'],
  'guan-lu':     ['ruse'],
  'yu-ji':       ['curse', 'ruse'],
  'zuo-ci':      ['ruse', 'disorder'],
};

export function deriveTactics(stats: OfficerStats, id?: string): TacticId[] {
  if (id && OFFICER_TACTICS[id]) return OFFICER_TACTICS[id];
  const { war, intelligence } = stats;
  const list: TacticId[] = [];
  if (war >= 80) list.push('charge');
  if (war >= 70 && war < 80) list.push('volley');
  if (intelligence >= 85) list.push('fire-attack');
  if (intelligence >= 80) list.push('ruse');
  if (intelligence >= 75 && intelligence < 80) list.push('pitfall');
  if (intelligence >= 70 && intelligence < 75) list.push('disorder');
  if (war >= 70 && war < 80 && intelligence < 70) list.push('rouse');
  if (war < 60 && intelligence < 60) list.push('curse');
  return Array.from(new Set(list)).slice(0, 3);
}

// ──────────────────────────────────────────────────────────────────────
// 政策 (Civil Policies)
// ──────────────────────────────────────────────────────────────────────

export type PolicyId =
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
  | 'military-theory'; // 軍学 — military academy

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
};

export const OFFICER_POLICIES: Record<string, PolicyId[]> = {
  'cao-cao':      ['tuntian', 'legalism', 'recruitment', 'military-theory'],
  'zhuge-liang':  ['legalism', 'tuntian', 'engineering', 'military-theory'],
  'sima-yi':      ['legalism', 'recruitment', 'military-theory'],
  'liu-bei':      ['rites', 'recruitment'],
  'sun-quan':     ['commerce', 'recruitment', 'legalism'],
  'xun-yu':       ['legalism', 'scholarship', 'rites'],
  'xun-you':      ['legalism', 'scholarship'],
  'cheng-yu':     ['legalism', 'military-theory'],
  'guo-jia':      ['military-theory', 'legalism'],
  'jia-xu':       ['military-theory', 'legalism'],
  'zao-zhi':      ['tuntian', 'hydraulics'],  // founded Cao Wei's tuntian system
  'ren-jun':      ['tuntian', 'hydraulics'],
  'liu-fu':       ['tuntian', 'hydraulics', 'commerce'],
  'cui-yan':      ['rites', 'scholarship'],
  'chen-qun':     ['legalism', 'scholarship', 'rites'],
  'zhong-yao':    ['scholarship', 'rites', 'hydraulics'],
  'wang-lang':    ['scholarship', 'rites'],
  'hua-xin':      ['rites', 'scholarship'],
  'jiang-wan':    ['legalism', 'scholarship', 'tuntian'],
  'fei-yi':       ['legalism', 'rites', 'scholarship'],
  'dong-yun':     ['legalism', 'rites'],
  'fa-zheng':     ['legalism', 'military-theory'],
  'mi-zhu':       ['commerce', 'rites'],
  'jian-yong':    ['rites', 'commerce'],
  'sun-qian':     ['rites', 'commerce'],
  'zhang-zhao':   ['rites', 'scholarship', 'legalism'],
  'gu-yong':      ['legalism', 'rites', 'scholarship'],
  'zhuge-jin':    ['rites', 'scholarship', 'legalism'],
  'lu-su':        ['commerce', 'rites', 'recruitment'],
  'lu-xun':       ['military-theory', 'tuntian'],
  'pang-tong':    ['military-theory', 'legalism'],
  'hua-tuo':      ['medicine', 'scholarship'],
  'zhang-zhongjing': ['medicine', 'scholarship'],
  'cai-yong':     ['scholarship', 'rites'],
  'zheng-xuan':   ['scholarship', 'rites'],
  'kong-rong':    ['rites', 'scholarship'],
  'wang-can':     ['scholarship', 'rites'],
  'ma-jun':       ['engineering', 'smithing'],
  'pu-yuan':      ['smithing', 'engineering'],
  'ma-teng':      ['horse-stewardship', 'recruitment'],
  'ma-chao':      ['horse-stewardship', 'recruitment'],
  'gongsun-zan':  ['horse-stewardship', 'recruitment'],
  'huo-zhi':      ['hydraulics', 'tuntian'],
  'liu-yan':      ['legalism', 'rites'],
  'zhuge-ke':     ['military-theory', 'legalism'],
};

export function derivePolicies(stats: OfficerStats, id?: string): PolicyId[] {
  if (id && OFFICER_POLICIES[id]) return OFFICER_POLICIES[id];
  const { war, intelligence, politics, charisma } = stats;
  const list: PolicyId[] = [];
  if (politics >= 85) list.push('legalism');
  if (politics >= 80 && intelligence >= 70) list.push('scholarship');
  if (politics >= 75 && charisma >= 75) list.push('rites');
  if (politics >= 70 && intelligence >= 70) list.push('tuntian');
  if (politics >= 70 && war >= 70) list.push('recruitment');
  if (intelligence >= 75 && war < 60) list.push('hydraulics');
  if (charisma >= 80 && politics >= 60) list.push('commerce');
  if (war >= 75 && intelligence >= 70) list.push('military-theory');
  return Array.from(new Set(list)).slice(0, 3);
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
