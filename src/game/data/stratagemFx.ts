/**
 * 戰法可視化 — every battle stratagem (戰法/計略 actually cast in combat) maps
 * to its own signature visual kind, so 火計 raises a smoke column, 落雷 drops a
 * bolt, 龍威 coils an azure dragon, 撞角 throws a water crown, etc. — no two
 * share a look. Pure data: the kind string + colour + lifetime. The renderer
 * (StratagemFXNode in the tactical battle) turns each kind into meshes, and the
 * big-map diorama reuses the same renderer, so both maps show the same effect.
 */
import type { StratagemId } from '../types';

export type StratagemFxKind =
  | 'fire' | 'lightning' | 'arrows' | 'aura' | 'swirl' | 'shockwave' | 'shield' | 'chain'
  | 'grain' | 'rune' | 'feint' | 'streak' | 'dragon' | 'splash' | 'grapple' | 'shipfire'
  | 'scatter' | 'rocks';

/** The signature visual for a battle stratagem, or null if it has no cast FX. */
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

export const FX_COLOR: Record<StratagemFxKind, string> = {
  fire:      '#ff6020',
  lightning: '#a8d4ff',
  arrows:    '#d8c898',
  aura:      '#ffd060',
  swirl:     '#c178e8',
  shockwave: '#ff8040',
  shield:    '#ffd060',
  chain:     '#888888',
  grain:     '#caa45a',
  rune:      '#7ec8ff',
  feint:     '#b3a6c8',
  streak:    '#cdb084',
  dragon:    '#3a7dd9',
  splash:    '#bfe6f2',
  grapple:   '#c8c2b4',
  shipfire:  '#ff6824',
  scatter:   '#b58446',
  rocks:     '#8f877b',
};

/** Per-FX lifetime in seconds. */
export const FX_DURATION: Record<StratagemFxKind, number> = {
  fire: 2.0, lightning: 0.6, arrows: 1.2, aura: 1.6,
  swirl: 1.6, shockwave: 1.0, shield: 1.6, chain: 1.2,
  grain: 1.8, rune: 1.6, feint: 1.2, streak: 0.9, dragon: 1.6,
  splash: 1.0, grapple: 1.1, shipfire: 2.2, scatter: 1.2, rocks: 1.1,
};
