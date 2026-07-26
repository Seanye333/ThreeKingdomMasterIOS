/* 城中景物的資料 — palettes, terrain sets and the seasonal lighting table used
 * by Scenery3D and by the city screen.
 *
 * Split out of Scenery3D so that file exports components ONLY: React Fast
 * Refresh cannot hot-swap a module that mixes components with plain values, so
 * every constant living beside a component silently costs a full reload on
 * edit (react-refresh/only-export-components). */
import type { SeasonKey } from './Folk3D';

export function dwellingHash(col: number, row: number): number {
  let h = (col * 73856093) ^ (row * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}
export const HOUSE_WALL = ['#c8b48a', '#bfa980', '#cdbb95', '#b8a276', '#d0bd97'];
export const HOUSE_ROOF = ['#3a2818', '#46342a', '#2f4a55', '#403020', '#34404a'];
export const NO_BUILD_TERRAIN = new Set(['river', 'water', 'lake', 'sea', 'mountain', 'deep-water']);
export const WILDERNESS_TERRAIN = new Set(['mountain', 'hill', 'forest', 'wetland', 'river', 'marsh', 'rocky']);
export const ROBE = ['#b8442e', '#3a6a98', '#5a8a3a', '#8a6a40', '#7a4a8a', '#c2a23a', '#4a6a6a', '#a85838'];
export const FLOWER = ['#d24a6a', '#e0a83a', '#c85ad0', '#e85a3a', '#f0d040', '#e86aa0'];
export const SEASON_LIGHT: Record<SeasonKey, { ambient: number; ambientColor: string; sun: string; sunI: number; sunPos: [number, number, number]; fog: string; sky: string; nightGlow: number }> = {
  spring: { ambient: 0.62, ambientColor: '#fdf3e0', sun: '#fff0d8', sunI: 1.2, sunPos: [10, 17, 8], fog: '#bcd2e4', sky: 'linear-gradient(180deg, #6f9fd8 0%, #a8c8e0 100%)', nightGlow: 0.25 },
  summer: { ambient: 0.72, ambientColor: '#fffaf0', sun: '#fff8e8', sunI: 1.5, sunPos: [6, 23, 4], fog: '#c8dcec', sky: 'linear-gradient(180deg, #4f93d8 0%, #9fc8ee 100%)', nightGlow: 0.1 },
  autumn: { ambient: 0.55, ambientColor: '#f6e6c4', sun: '#ffd49a', sunI: 1.08, sunPos: [15, 10, 6], fog: '#d8c6a4', sky: 'linear-gradient(180deg, #b8946a 0%, #e0c89a 100%)', nightGlow: 0.55 },
  winter: { ambient: 0.5, ambientColor: '#e8f0f8', sun: '#e8eef8', sunI: 0.82, sunPos: [12, 9, -4], fog: '#cdd8e6', sky: 'linear-gradient(180deg, #8aa6c0 0%, #cdd9e6 100%)', nightGlow: 0.7 },
};
