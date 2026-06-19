/**
 * 戰法可視化 — every one of the 589 戰法 (TacticId) gets its OWN cast effect.
 *
 * Hand-authoring 589 bespoke meshes is neither feasible nor legible, so each
 * tactic resolves to a *spec*: a thematically-correct shape family (fire / 雷 /
 * 弩 / 騎 / 毒 / 冰 …, 37 of them) PLUS a colour, density, spin, scale and shape
 * variant deterministically hashed from the tactic id. Same id → same look;
 * different id → a different colour (and often a different variant), so no two
 * of the 589 share an effect. The legendary named tactics keep a fixed,
 * recognisable signature on top (借東風 / 八門遁甲 / 空城計 / 七星燈 / 七擒 /
 * 美人計 / 五雷).
 *
 * Pure data. The renderer (StratagemFXNode) turns a spec into meshes; the
 * big-map diorama reuses the same renderer, so both maps show the same effect.
 */
import type { HexCoord, StratagemId } from '../types';

export type StratagemFxKind =
  // ── base kinds (one per castable stratagem) ──
  | 'fire' | 'lightning' | 'arrows' | 'aura' | 'swirl' | 'shockwave' | 'shield' | 'chain'
  | 'grain' | 'rune' | 'feint' | 'streak' | 'dragon' | 'splash' | 'grapple' | 'shipfire'
  | 'scatter' | 'rocks'
  // ── signature kinds (legendary named 戰法) ──
  | 'wind' | 'gate' | 'empty' | 'lamp' | 'net' | 'charm' | 'thunderstorm'
  // ── thematic kinds (give the 589 their variety) ──
  | 'poison' | 'ice' | 'blades' | 'spears' | 'caltrops' | 'beast' | 'drum'
  | 'cannon' | 'smoke' | 'vortex' | 'oil' | 'curse';

/** The signature visual for a directly-castable battle stratagem, or null. */
export function stratagemFxKind(id: StratagemId): StratagemFxKind | null {
  switch (id) {
    case 'fire-attack':      return 'fire';      // 火計
    case 'lightning':        return 'lightning'; // 落雷
    case 'rain-of-arrows':   return 'arrows';    // 矢雨齊發
    case 'rally':            return 'aura';      // 鼓舞
    case 'precognition':     return 'rune';      // 神算
    case 'confusion':        return 'swirl';     // 計略
    case 'dragon-veil':      return 'dragon';    // 龍威
    case 'defend':           return 'shield';    // 防御
    case 'chain-ships':      return 'chain';     // 連環
    case 'charge':           return 'shockwave'; // 突撃
    case 'gallop':           return 'streak';    // 飛将
    case 'supply-strike':    return 'grain';     // 兵糧攻
    case 'false-retreat':    return 'feint';     // 偽計
    case 'ram':              return 'splash';    // 撞角
    case 'board':            return 'grapple';   // 接舷
    case 'fire-ship':        return 'shipfire';  // 火船
    case 'raid-supply':      return 'scatter';   // 劫糧道
    case 'rockslide':        return 'rocks';     // 落石
    default:                 return null;
  }
}

/**
 * Legendary named 戰法 → a fixed signature visual (recognisable, not hashed).
 */
const SIGNATURE: Record<string, StratagemFxKind> = {
  'borrow-wind':     'wind',         // 借東風
  'eight-gates':     'gate',         // 八門遁甲
  'qimen-dunjia':    'gate',         // 奇門遁甲
  'gate-of-life':    'gate',
  'empty-fort':      'empty',        // 空城計
  'seven-lamp':      'lamp',         // 七星燈
  'star-prayer':     'lamp',         // 祭星
  'wuzhang-star':    'lamp',         // 五丈原禳星
  'seven-grab':      'net',          // 七擒孟獲
  'beauty':          'charm',        // 美人計
  'diaochan':        'charm',        // 貂蟬連環
  'chain-stratagem': 'charm',        // 連環計
  'thunder':         'thunderstorm', // 五雷正法
  'five-thunder':    'thunderstorm',
  'five-thunder-roof':'thunderstorm',
  'meteor':          'thunderstorm', // 流星 — 多雷齊落
};

/**
 * Theme classifier: scan the tactic id for a keyword and map to a shape family.
 * Ordered specific → generic; the first match wins. Misses fall to the category
 * default. Theme accuracy is flavour only — colour keeps every tactic distinct
 * regardless — so the buckets stay broad and cheap.
 */
const THEME: Array<[RegExp, StratagemFxKind]> = [
  [/poison|venom|gu-poison|toxic|plague|miasma|snake-venom|chan-poison/, 'poison'],
  [/ice|snow|frost|cold|winter|blizzard|hailan/, 'ice'],
  [/oil|cauldron-oil|greek-fire|tar|pitch/, 'oil'],
  [/cannon|gun|firearm|musket|greek|flame-thrower|hongyi|red-barbarian/, 'cannon'],
  [/smoke|mist|fog|screen|conceal|dust-screen|hide-light/, 'smoke'],
  [/caltrop|stake|iron-stake|spike|thorn|bramble|tetsubishi/, 'caltrops'],
  [/spear|halberd|pike|lance|long-halberd|phalanx|spike-wall/, 'spears'],
  [/blade|sword|sabre|saber|dao|knife|slash|cleave|iron-sand-palm|palm|fist|bell|pipa/, 'blades'],
  [/tiger|wolf|leopard|eagle|beast|fierce|lion|bear|crane|raptor|hawk|lubu-flying|lu-bu/, 'beast'],
  [/drum|banner|signal|gong|horn|long-sound|war-cry|inspire|morale|oath|five-virtues|benevolence|govern|loyal/, 'drum'],
  [/ship|fleet|navy|boat|fire-boat|fire-crow|water-village|naval/, 'shipfire'],
  [/board|grapple|hook|hand-hook|boarding/, 'grapple'],
  [/ram|collide|crash-gate|batter/, 'splash'],
  [/water|flood|tide|river|drown|dam|wave|fancheng-flood|han-shizhong-water|liu-yu-north|cross|ford|half-cross|half-formed/, 'splash'],
  [/thunder|lightning|bolt|five-thunder|sky-fire|heaven-fire/, 'thunderstorm'],
  [/fire|burn|chibi|blaze|scorch|flame|inferno|incendiary|loot-fire/, 'fire'],
  [/wind|gale|typhoon|storm-wind|borrow-wind/, 'wind'],
  [/arrow|bow|crossbow|ballista|volley|zhuge-bow|longbow|feather|projectile|sniper|hidden-weapon|flying-knife|english-longbow/, 'arrows'],
  [/rock|stone|boulder|mountain|landslide|avalanche|rockslide|catapult|trebuchet|throw-stone/, 'rocks'],
  [/net|snare|capture|grab|seven-grab|lasso|entangle/, 'net'],
  [/chain|iron-chain|link|connected/, 'chain'],
  [/grain|food|provision|supply|granary|guandu-grain|beans-to-soldiers/, 'grain'],
  [/loot|plunder|raid|scatter|pillage|le-jin-raid|gan-ning-100/, 'scatter'],
  [/dragon|serpent|coil|azure-dragon|guanyu-greendragon|green-dragon/, 'dragon'],
  [/charm|beauty|lady|seduce|love|maid|huang-yueying|lady-zhurong|fan-lihua|lu-lingqi/, 'charm'],
  [/cav|cavalry|ride|gallop|horse|trample|heavy-cav|light-cav|long-ride|white-horse|gongsun-zan-white/, 'streak'],
  [/charge|rush|breakthrough|break-encircle|vanguard|fast-strike|assault|annihilate|julu|cannae|blitz/, 'shockwave'],
  [/wall|fort|defend|guard|iron-wall|turtle|bulwark|last-stand|rampart|stockade|defense|defend-city|hold|garrison|golden-bell|iron-shirt/, 'shield'],
  [/ambush|feint|false|retreat|lure|decoy|feign|hide-knife|flee|withdraw|bait|trap|pitfall|lure-tiger/, 'feint'],
  [/spy|defector|discord|rumor|smear|sleeper|bribe|forge|fake|letter|edict|deception|disorder|disrupt|sow|intercept|manipulate|family-threat|hostage|eunuch/, 'swirl'],
  [/curse|hex|sigil|dark-talisman|point-curse|reverse-soul|borrow-corpse|maoshan|nine-yin|soul/, 'curse'],
  [/rune|divine|talisman|spirit|summon|alchemy|geomancy|he-luo-tu|bagua-palm|qi|prophecy|astrolog|star-chart|yinyang|omen|five-elements/, 'rune'],
  [/vortex|whirl|spiral|cyclone|maelstrom|swirl/, 'vortex'],
];

/**
 * When no keyword theme matches, the tactic's category picks from a POOL of
 * shape families (hashed by id), so the long tail spreads across many
 * silhouettes instead of all collapsing onto one — every category still reads
 * right (melee = blades/spears/charge, strategy = banners/runes/drums, …).
 */
const POOL: Record<string, StratagemFxKind[]> = {
  melee:    ['shockwave', 'blades', 'spears', 'beast', 'streak', 'drum'],
  ranged:   ['arrows', 'cannon', 'caltrops', 'splash'],
  mystic:   ['rune', 'curse', 'vortex', 'swirl', 'lamp', 'gate', 'poison', 'wind'],
  disrupt:  ['swirl', 'curse', 'feint', 'vortex', 'smoke', 'net'],
  strategy: ['aura', 'drum', 'rune', 'swirl', 'vortex', 'gate', 'lamp', 'shield'],
};

/** 32-bit FNV-1a — deterministic, well-spread; distinct ids ⇒ distinct hashes. */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function hslToHex(hDeg: number, s: number, l: number): string {
  const h = ((hDeg % 360) + 360) % 360 / 360;
  const sat = s / 100, lig = l / 100;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Thematic hue centre per archetype (degrees) + how grey it is. */
const HUE: Record<StratagemFxKind, [hue: number, span: number, gray: boolean]> = {
  fire: [18, 26, false], shipfire: [16, 22, false], oil: [26, 18, false],
  lightning: [212, 30, false], thunderstorm: [208, 30, false],
  arrows: [44, 28, false], cannon: [32, 22, false],
  aura: [46, 30, false], drum: [42, 26, false],
  swirl: [284, 34, false], vortex: [276, 30, false], curse: [266, 30, false],
  shockwave: [26, 26, false], streak: [34, 22, false], beast: [30, 26, false],
  shield: [210, 30, false], spears: [206, 24, false], blades: [205, 22, false],
  chain: [30, 10, true], smoke: [30, 8, true], rocks: [28, 14, true],
  caltrops: [30, 14, true], net: [34, 14, true], grapple: [38, 14, true],
  feint: [272, 20, false], grain: [38, 22, false], scatter: [36, 24, false],
  rune: [262, 34, false], dragon: [214, 28, false], splash: [196, 30, false],
  ice: [192, 26, false], poison: [108, 34, false], wind: [128, 30, false],
  gate: [40, 24, false], empty: [210, 20, false], lamp: [42, 26, false], charm: [330, 30, false],
};

export interface TacticFxSpec {
  kind: StratagemFxKind;
  color: string;
  /** Particle-count multiplier (~0.8–1.4). */
  density: number;
  /** Signed rotation multiplier (~±0.7–1.3). */
  spin: number;
  /** Overall size (~0.85–1.2). */
  scale: number;
  /** Shape sub-variant 0–3 (big families switch silhouette on it). */
  variant: number;
}

/** A live cast-FX instance on the battlefield (carried in component state). */
export interface StratagemFxInstance {
  id: number;
  coord: HexCoord;
  spec: TacticFxSpec;
  spawnedAt: number;
}

/**
 * Resolve a tactic's full cast spec. `tacticId` may be undefined (a plain
 * stratagem button) — then it's the stratagem's canonical effect. With a
 * tacticId, the shape comes from its signature/theme/category and the colour +
 * motion are hashed from the id so every one of the 589 looks distinct.
 *
 * @param categoryOf optional `categoryOfTactic` (injected to avoid a data-layer
 *                   import cycle); used only when no keyword theme matches.
 */
export function tacticFxSpec(
  tacticId: string | undefined,
  fallback: StratagemId,
  categoryOf?: (id: string) => string,
): TacticFxSpec | null {
  // Plain stratagem: canonical, no per-id variation.
  if (!tacticId) {
    const k = stratagemFxKind(fallback);
    if (!k) return null;
    return { kind: k, color: FX_COLOR[k], density: 1, spin: 1, scale: 1, variant: 0 };
  }

  // Legendary signature: fixed, recognisable COLOUR, but motion still varies per
  // id so synonymous signatures (八門遁甲/奇門遁甲, 五雷/流星…) aren't identical.
  const sig = SIGNATURE[tacticId];
  const h = hashStr(tacticId);
  if (sig) {
    return {
      kind: sig,
      color: FX_COLOR[sig],
      density: 0.9 + ((h >>> 2) % 5) / 10,
      spin: (((h >>> 5) & 1) ? 1 : -1) * (0.8 + ((h >>> 6) % 5) / 10),
      scale: 0.92 + ((h >>> 11) % 5) / 20,
      variant: (h >>> 19) % 4,
    };
  }

  // Theme by keyword, else a hash-picked archetype from the category's pool,
  // else the stratagem fallback, else aura.
  let kind: StratagemFxKind | undefined;
  for (const [re, k] of THEME) { if (re.test(tacticId)) { kind = k; break; } }
  if (!kind) {
    const pool = POOL[categoryOf ? categoryOf(tacticId) : 'strategy'] ?? POOL.strategy;
    kind = pool[h % pool.length];
  }
  if (!kind) kind = stratagemFxKind(fallback) ?? 'aura';

  const [base, span, gray] = HUE[kind];
  const hue = base - span / 2 + ((h % 997) / 997) * span;
  const sat = gray ? 8 + ((h >>> 7) % 10) : 52 + ((h >>> 7) % 34);
  const lig = (gray ? 50 : 46) + ((h >>> 15) % 16);
  const color = hslToHex(hue, sat, lig);
  const density = 0.8 + ((h >>> 2) % 7) / 10;        // 0.8 .. 1.4
  const spin = (((h >>> 5) & 1) ? 1 : -1) * (0.7 + ((h >>> 6) % 7) / 10); // ±0.7 .. ±1.3
  const scale = 0.85 + ((h >>> 11) % 8) / 20;        // 0.85 .. 1.2
  const variant = (h >>> 19) % 4;                    // 0 .. 3
  return { kind, color, density, spin, scale, variant };
}

/** Just the FX kind for a tactic/stratagem (legacy callers / quick checks). */
export function tacticFxKind(
  tacticId: string | undefined,
  fallback: StratagemId,
  categoryOf?: (id: string) => string,
): StratagemFxKind | null {
  return tacticFxSpec(tacticId, fallback, categoryOf)?.kind ?? null;
}

export const FX_COLOR: Record<StratagemFxKind, string> = {
  fire:        '#ff6020',
  lightning:   '#a8d4ff',
  arrows:      '#d8c898',
  aura:        '#ffd060',
  swirl:       '#c178e8',
  shockwave:   '#ff8040',
  shield:      '#90b4d8',
  chain:       '#888888',
  grain:       '#caa45a',
  rune:        '#9a7ce8',
  feint:       '#b3a6c8',
  streak:      '#cdb084',
  dragon:      '#3a7dd9',
  splash:      '#7ec8e6',
  grapple:     '#c8c2b4',
  shipfire:    '#ff6824',
  scatter:     '#b58446',
  rocks:       '#8f877b',
  wind:        '#bfe8c8',
  gate:        '#caa24a',
  empty:       '#dfe6ee',
  lamp:        '#ffd98a',
  net:         '#9a8a6a',
  charm:       '#ff9ec4',
  thunderstorm:'#b8d8ff',
  poison:      '#86c83a',
  ice:         '#b8e8f4',
  blades:      '#c4d2e0',
  spears:      '#aebccc',
  caltrops:    '#9a8f7e',
  beast:       '#d8a060',
  drum:        '#e6c440',
  cannon:      '#d89050',
  smoke:       '#9a9690',
  vortex:      '#a878e0',
  oil:         '#5a4a36',
  curse:       '#9a5ad0',
};

/**
 * Cinematic impact weight per FX archetype — drives the battle camera's
 * reaction when a tactic is cast: 0 = none (soft auras/calm計), 1 = a small
 * shake + flash, 2 = heavy shake + flash + a zoom-punch (天雷/落石/火계/砲).
 */
export const FX_IMPACT: Record<StratagemFxKind, 0 | 1 | 2> = {
  fire: 2, shipfire: 2, oil: 2, lightning: 2, thunderstorm: 2, cannon: 2,
  rocks: 2, shockwave: 2, dragon: 2, gate: 2,
  arrows: 1, caltrops: 1, beast: 1, spears: 1, blades: 1, splash: 1, grain: 1,
  scatter: 1, grapple: 1, net: 1, wind: 1, drum: 1, poison: 1,
  aura: 0, swirl: 0, rune: 0, lamp: 0, empty: 0, charm: 0, feint: 0, smoke: 0,
  ice: 0, vortex: 0, curse: 0, chain: 0, shield: 0, streak: 0,
};

/** Per-FX lifetime in seconds. */
export const FX_DURATION: Record<StratagemFxKind, number> = {
  fire: 2.0, lightning: 0.6, arrows: 1.2, aura: 1.6,
  swirl: 1.6, shockwave: 1.0, shield: 1.6, chain: 1.2,
  grain: 1.8, rune: 1.6, feint: 1.2, streak: 0.9, dragon: 1.6,
  splash: 1.0, grapple: 1.1, shipfire: 2.2, scatter: 1.2, rocks: 1.1,
  wind: 1.6, gate: 2.0, empty: 2.2, lamp: 2.2, net: 1.4, charm: 1.8, thunderstorm: 1.0,
  poison: 2.0, ice: 1.4, blades: 1.0, spears: 1.2, caltrops: 1.4, beast: 1.0, drum: 1.6,
  cannon: 0.9, smoke: 2.0, vortex: 1.4, oil: 1.8, curse: 1.8,
};
