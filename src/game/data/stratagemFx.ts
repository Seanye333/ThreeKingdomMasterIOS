/**
 * 戰法可視化 — battle stratagems/tactics each get a signature cast effect.
 *
 * Two layers:
 *  1. The 18 directly-castable battle stratagems (STRATAGEMS / StratagemId) →
 *     a distinct base kind each (fire / lightning / arrows / …).
 *  2. The 589 strategic 戰法 (TacticId) route through personalTactics.ts onto an
 *     *underlying* StratagemId, so every tactic inherits that base effect — and
 *     the famous named ones (借東風 / 八門遁甲 / 空城計 / 七星燈 / 七擒 / 美人計
 *     / 五雷) override it with their OWN signature visual via tacticFxKind().
 *
 * Pure data: the kind string + colour + lifetime. The renderer (StratagemFXNode
 * in the tactical battle) turns each kind into meshes, and the big-map diorama
 * reuses the same renderer, so both maps show the same effect.
 */
import type { StratagemId } from '../types';

export type StratagemFxKind =
  // ── base kinds (one per castable stratagem) ──
  | 'fire' | 'lightning' | 'arrows' | 'aura' | 'swirl' | 'shockwave' | 'shield' | 'chain'
  | 'grain' | 'rune' | 'feint' | 'streak' | 'dragon' | 'splash' | 'grapple' | 'shipfire'
  | 'scatter' | 'rocks'
  // ── signature kinds (legendary named 戰法 only) ──
  | 'wind' | 'gate' | 'empty' | 'lamp' | 'net' | 'charm' | 'thunderstorm';

/** The signature visual for a directly-castable battle stratagem, or null. */
export function stratagemFxKind(id: StratagemId): StratagemFxKind | null {
  switch (id) {
    case 'fire-attack':      return 'fire';      // 火計 — 烈焰濃煙柱
    case 'lightning':        return 'lightning'; // 落雷 — 天雷直劈
    case 'rain-of-arrows':   return 'arrows';    // 矢雨齊發 — 箭矢從天而降
    case 'rally':            return 'aura';      // 鼓舞 — 金色士氣光暈
    case 'precognition':     return 'rune';      // 神算 — 八卦符陣
    case 'confusion':        return 'swirl';     // 計略 — 紫色迷亂漩渦
    case 'dragon-veil':      return 'dragon';    // 龍威 — 青龍盤旋升騰
    case 'defend':           return 'shield';    // 防御 — 護盾罩
    case 'chain-ships':      return 'chain';     // 連環 — 鐵索連環
    case 'charge':           return 'shockwave'; // 突撃 — 衝鋒波
    case 'gallop':           return 'streak';    // 飛将 — 疾馳殘影
    case 'supply-strike':    return 'grain';     // 兵糧攻 — 焚燒糧秣
    case 'false-retreat':    return 'feint';     // 偽計 — 詐退虛影
    case 'ram':              return 'splash';    // 撞角 — 破浪撞擊
    case 'board':            return 'grapple';   // 接舷 — 飛鉤接舷
    case 'fire-ship':        return 'shipfire';  // 火船 — 火船焚江
    case 'raid-supply':      return 'scatter';   // 劫糧道 — 糧車四散
    case 'rockslide':        return 'rocks';     // 落石 — 滾石崩落
    default:                 return null;
  }
}

/**
 * Legendary named 戰法 (TacticId) that earn their OWN cast visual instead of
 * inheriting the underlying stratagem's. Everything else falls back.
 */
const TACTIC_FX: Record<string, StratagemFxKind> = {
  'borrow-wind':     'wind',         // 借東風 — 諸葛祭壇喚東風
  'eight-gates':     'gate',         // 八門遁甲 — 八門困敵
  'qimen-dunjia':    'gate',         // 奇門遁甲
  'empty-fort':      'empty',        // 空城計 — 城門大開撫琴退兵
  'seven-lamp':      'lamp',         // 七星燈 — 北斗祈壽
  'star-prayer':     'lamp',         // 祭星
  'seven-grab':      'net',          // 七擒孟獲 — 擒縱之網
  'beauty':          'charm',        // 美人計
  'diaochan':        'charm',        // 貂蟬連環
  'chain-stratagem': 'charm',        // 連環計
  'thunder':         'thunderstorm', // 五雷正法
  'five-thunder':    'thunderstorm',
  'meteor':          'thunderstorm', // 流星 — 多雷齊落
};

/**
 * Pick the cast FX for a tactic: its signature visual if it's a legendary named
 * one, else the effect of whatever stratagem it routes through. `tacticId` may
 * be undefined (a plain stratagem button) — then it's purely the fallback.
 */
export function tacticFxKind(tacticId: string | undefined, fallback: StratagemId): StratagemFxKind | null {
  if (tacticId && TACTIC_FX[tacticId]) return TACTIC_FX[tacticId];
  return stratagemFxKind(fallback);
}

export const FX_COLOR: Record<StratagemFxKind, string> = {
  fire:        '#ff6020',
  lightning:   '#a8d4ff',
  arrows:      '#d8c898',
  aura:        '#ffd060',
  swirl:       '#c178e8',
  shockwave:   '#ff8040',
  shield:      '#ffd060',
  chain:       '#888888',
  grain:       '#caa45a',
  rune:        '#7ec8ff',
  feint:       '#b3a6c8',
  streak:      '#cdb084',
  dragon:      '#3a7dd9',
  splash:      '#bfe6f2',
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
};

/** Per-FX lifetime in seconds. */
export const FX_DURATION: Record<StratagemFxKind, number> = {
  fire: 2.0, lightning: 0.6, arrows: 1.2, aura: 1.6,
  swirl: 1.6, shockwave: 1.0, shield: 1.6, chain: 1.2,
  grain: 1.8, rune: 1.6, feint: 1.2, streak: 0.9, dragon: 1.6,
  splash: 1.0, grapple: 1.1, shipfire: 2.2, scatter: 1.2, rocks: 1.1,
  wind: 1.6, gate: 2.0, empty: 2.2, lamp: 2.2, net: 1.4, charm: 1.8, thunderstorm: 1.0,
};
