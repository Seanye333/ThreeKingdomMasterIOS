import type { Officer } from '../types';
import { ITEMS_BY_ID } from './items';

/**
 * 兵装 (Weapon class) — RTK14-style officer combat type.
 * Derived from the officer's primary equipped weapon. Pure-display today,
 * with hooks for future combat modifiers.
 */
export type WeaponType =
  | 'spear'    // 槍
  | 'halberd'  // 戟
  | 'sabre'    // 刀
  | 'sword'    // 劍
  | 'bow'      // 弓
  | 'crossbow' // 弩
  | 'cavalry'  // 騎 (mounted, weapon-agnostic but the horse is the class)
  | 'siege'    // 兵器 (siege engineer / artillery)
  | 'fan'      // 羽扇 (strategist)
  | 'none';    // 徒手

export const WEAPON_TYPE_DEFS: Record<WeaponType, { zh: string; en: string; color: string }> = {
  spear:    { zh: '槍兵',   en: 'Spear',     color: '#a8c87a' },
  halberd:  { zh: '戟兵',   en: 'Halberd',   color: '#b8442e' },
  sabre:    { zh: '刀兵',   en: 'Sabre',     color: '#c19a3b' },
  sword:    { zh: '劍士',   en: 'Sword',     color: '#88b7e8' },
  bow:      { zh: '弓兵',   en: 'Bow',       color: '#7a9a5a' },
  crossbow: { zh: '弩兵',   en: 'Crossbow',  color: '#5a7a8a' },
  cavalry:  { zh: '騎兵',   en: 'Cavalry',   color: '#d4a84a' },
  siege:    { zh: '兵器',   en: 'Siege',     color: '#7a5a3a' },
  fan:      { zh: '軍師',   en: 'Strategist',color: '#c178c7' },
  none:     { zh: '徒手',   en: 'Unarmed',   color: '#5a4530' },
};

/** Map a specific item id → weapon class. */
export const ITEM_WEAPON_TYPE: Record<string, WeaponType> = {
  // Spears
  'snake-spear':       'spear',
  'dragon-gut':        'spear',
  'gilt-spear':        'spear',
  'twin-edge-pike':    'spear',
  'jade-tip-spear':    'spear',
  'silver-tassel-spear':'spear',
  'rolling-thunder-pike':'spear',
  'ironbone-pike':     'spear',
  'shadow-spear':      'spear',
  'azure-coiling-spear':'spear',
  'piercing-snake-halberd':'spear',
  'dragon-roar-spear': 'spear',

  // Halberds
  'sky-piercer':       'halberd',
  'wargod-trident':    'halberd',

  // Sabres
  'green-dragon':      'sabre',  // Guan Yu's halberd-shaped sabre
  'tiger-tooth-saber': 'sabre',
  'crescent-glaive':   'sabre',
  'wolf-fang-mace':    'sabre',
  'bing-zhou-cleaver': 'sabre',
  'tiger-thigh-saber': 'sabre',
  'crimson-saber':     'sabre',
  'eclipse-saber':     'sabre',
  'frostfire-saber':   'sabre',
  'phoenix-tail-saber':'sabre',
  'rain-blade':        'sabre',
  'mandarin-duck-blades':'sabre',
  'glaive-of-han':     'sabre',

  // Swords (lighter cutting)
  'seven-star':        'sword',
  'yitian':            'sword',
  'qing-gang':         'sword',
  'twin-swords':       'sword',
  'cangshu-jian':      'sword',
  'broken-mountain-sword':'sword',
  'demon-cleaver':     'sword',
  'jade-hilt-knife':   'sword',
  'sevenstar-saber':   'sword',
  'serpent-tongue-dagger':'sword',

  // Bows
  'rhinoceros-bow':    'bow',
  'meng-qi-bow':       'bow',
  'phoenix-bow':       'bow',
  'wolf-howl-bow':     'bow',
  'iron-bone-bow':     'bow',
  'arrowstorm-bow':    'bow',

  // Crossbows
  'thunderclap-crossbow':'crossbow',

  // Cavalry (the horse is the class)
  // — handled separately below since these are 'horse' kind

  // Strategist (fan)
  'wind-feather-fan':  'fan',

  // Maces / war hammers
  'gu-ding':           'sabre',
  'wugou':             'sabre',
  'antler-mace':       'siege',
  'splitfang-hammer':  'siege',
  'turtle-back-axe':   'siege',
  'gilt-mace':         'siege',
};

/**
 * 名物識兵 — classify a weapon by the keywords in its NAME, for the hundreds of
 * forged blades the hand-written ITEM_WEAPON_TYPE map never enumerated (a 連弩
 * should read as 弩, an 開山斧 as 兵器 — not be guessed from a war stat). Order
 * matters: the more specific class wins (弩 before 弓, 戟 before 槍/刀). Returns
 * null when the name carries no weapon signal (so the stat heuristic still runs).
 */
export function classifyWeaponByName(name: { zh: string; en: string }): WeaponType | null {
  const s = `${name.zh} ${name.en.toLowerCase()}`;
  if (/弩|crossbow/.test(s)) return 'crossbow';
  if (/弓|bow/.test(s)) return 'bow';
  if (/戟|halberd|trident|方天/.test(s)) return 'halberd';
  if (/斧|鉞|錘|鎚|鐧|鞭|鐗|鏈|流星|連枷|椎|殳|棒|杵|棍|杖|mace|hammer|axe|flail|club|maul|staff|quarterstaff|war.?pick/.test(s)) return 'siege';
  if (/扇|麈|fan|whisk/.test(s)) return 'fan';
  if (/槍|矛|矟|槊|稍|pike|spear|lance|halberd-spear/.test(s)) return 'spear';
  if (/刀|鎌|鐮|saber|sabre|glaive|cleaver|falchion|sickle|scythe|偃月|blade(?!.*sword)/.test(s)) return 'sabre';
  if (/劍|剑|爪|鉤|鈎|sword|rapier|dagger|knife|claw|hook|talon/.test(s)) return 'sword';
  return null;
}

/** Derive the officer's primary weapon class. */
export function deriveWeaponType(officer: Pick<Officer, 'equipment' | 'stats'>): WeaponType {
  // 1) An explicit hand-map entry, then 2) the weapon's own NAME — so a forged
  //    blade declares its true class instead of falling through to a stat guess.
  for (const itemId of officer.equipment) {
    const wt = ITEM_WEAPON_TYPE[itemId];
    if (wt) return wt;
    const item = ITEMS_BY_ID[itemId];
    if (item?.kind === 'weapon') {
      const byName = classifyWeaponByName(item.name);
      if (byName) return byName;
    }
  }
  // No weapon to read — pick class from stats.
  const { war, intelligence } = officer.stats;
  if (intelligence >= 88 && war < 70) return 'fan';
  // Find any horse in equipment → cavalry
  for (const itemId of officer.equipment) {
    if (ITEMS_BY_ID[itemId]?.kind === 'horse') return 'cavalry';
  }
  if (war >= 80) return 'spear';
  if (war >= 70) return 'sabre';
  if (war >= 60) return 'bow';
  return 'none';
}
