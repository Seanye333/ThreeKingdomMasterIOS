/**
 * 地形標示 — the one place terrain gets its human name and its minimap glyph.
 *
 * Typed as full `Record<TerrainKind, …>` on purpose: adding a TerrainKind then
 * becomes a compile error here instead of a raw id ('shallows') leaking onto
 * the battle HUD. That is exactly what happened when 淺灘/蘆葦蕩 were added —
 * the typed colour/height maps failed the build, the untyped label maps did not.
 */
import type { TerrainKind } from '../../../game/types';

export const TERRAIN_LABEL: Record<TerrainKind, { zh: string; en: string }> = {
  plain:      { zh: '平原', en: 'Plain' },
  forest:     { zh: '森林', en: 'Forest' },
  mountain:   { zh: '山地', en: 'Mountain' },
  river:      { zh: '大河', en: 'River' },
  road:       { zh: '道路', en: 'Road' },
  ice:        { zh: '冰面', en: 'Ice' },
  hill:       { zh: '高地', en: 'Hill' },
  marsh:      { zh: '沼澤', en: 'Marsh' },
  shallows:   { zh: '淺灘', en: 'Shallows' },
  reeds:      { zh: '蘆葦蕩', en: 'Reed Bank' },
  desert:     { zh: '沙磧', en: 'Desert' },
  chokepoint: { zh: '隘口', en: 'Defile' },
  bridge:     { zh: '橋樑', en: 'Bridge' },
  gate:       { zh: '城門', en: 'Gate' },
  wall:       { zh: '城牆', en: 'Wall' },
  watchtower: { zh: '瞭望台', en: 'Watchtower' },
  fieldworks: { zh: '築壘', en: 'Fieldworks' },
};

/** One-character glyph for the tiny battle-prep minimap. */
export const TERRAIN_GLYPH: Record<TerrainKind, string> = {
  plain: '', forest: '林', mountain: '山', river: '水', ice: '冰',
  road: '道', hill: '高地', marsh: '沼', shallows: '淺', reeds: '葦',
  desert: '沙', chokepoint: '隘', bridge: '橋', gate: '門', wall: '牆',
  watchtower: '樓', fieldworks: '壘',
};
