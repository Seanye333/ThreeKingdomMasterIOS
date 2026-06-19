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
  'mountain-splitter-axe':'sword',

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

/** Derive the officer's primary weapon class. */
export function deriveWeaponType(officer: Pick<Officer, 'equipment' | 'stats'>): WeaponType {
  for (const itemId of officer.equipment) {
    const wt = ITEM_WEAPON_TYPE[itemId];
    if (wt) return wt;
  }
  // No specific weapon — pick class from stats
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
