/** 季候光照預設 — season / time-of-day / weather lighting tables for the
 * strategic map, extracted verbatim from StrategicMap3D.tsx. Data-only. */
import type { Season } from '../../../game/types';
import type { WeatherKind } from '../../../game/systems/weather';

/* ─── Season lighting presets — light/color only, no overlay planes ─
 *  Re-introduced after the overlay-plane bug. These ONLY change the
 *  three lights and the fog tint — no big planes that can occlude. */
interface SeasonPreset {
  ambient: number; ambientColor: string;
  sun: { color: string; intensity: number };
  fillColor: string; hemiSky: string; hemiGround: string; hemiIntensity: number;
  fogColor: string;
}
export const SEASON_PRESETS: Record<Season, SeasonPreset> = {
  spring: {
    ambient: 0.80, ambientColor: '#fff5e0',
    sun: { color: '#fff5d8', intensity: 1.45 },
    fillColor: '#c8e0c8', hemiSky: '#a8d0e8', hemiGround: '#6a8a4a',
    hemiIntensity: 0.55, fogColor: '#c8c898',
  },
  summer: {
    ambient: 0.90, ambientColor: '#ffffff',
    sun: { color: '#ffffe8', intensity: 1.60 },
    fillColor: '#d0d0c0', hemiSky: '#a0c0e8', hemiGround: '#5a4530',
    hemiIntensity: 0.45, fogColor: '#c8b890',
  },
  autumn: {
    ambient: 0.72, ambientColor: '#ffe8c8',
    sun: { color: '#ffd8a0', intensity: 1.30 },
    fillColor: '#e0b888', hemiSky: '#c8a880', hemiGround: '#7a5530',
    hemiIntensity: 0.55, fogColor: '#c0a070',
  },
  winter: {
    ambient: 0.58, ambientColor: '#c8d8e8',
    sun: { color: '#e0e8f5', intensity: 1.15 },
    fillColor: '#8098c0', hemiSky: '#a0c0e8', hemiGround: '#607080',
    hemiIntensity: 0.5, fogColor: '#a8b8c8',
  },
};

/* ─── 晝夜 — time of day, read off the 旬 (third of the month) ────────
   上旬 = day, 中旬 = dusk (golden hour), 下旬 = a moonlit night. Each tints
   the sky dome, swaps sun⇄moon, recolours fog/ambient and decides whether
   the settlements light their lamps and the stars come out — so a full
   month visibly rolls noon → sunset → night and back. */
export type TimeOfDay = 'day' | 'dusk' | 'night';
export function phaseToTOD(phase: string | undefined): TimeOfDay {
  return phase === 'lower' ? 'night' : phase === 'middle' ? 'dusk' : 'day';
}
interface TODPreset {
  ambientMul: number; ambientColor: string | null;   // null = keep the season's colour
  sunMul: number; sunColor: string | null;
  sunPos: [number, number, number];
  skyTop: string; horizon: string | null; fog: string | null;
  celestial: 'sun' | 'moon'; celestialColor: string;
  lights: boolean;    // settlements light their lamps
  stars: boolean;
}
export const TOD_PRESETS: Record<TimeOfDay, TODPreset> = {
  day: {
    ambientMul: 1, ambientColor: null, sunMul: 1, sunColor: null,
    sunPos: [8, 16, 6], skyTop: '#5f8ec8', horizon: null, fog: null,
    celestial: 'sun', celestialColor: '#fff2c8', lights: false, stars: false,
  },
  dusk: {
    ambientMul: 0.72, ambientColor: '#d8b890', sunMul: 0.8, sunColor: '#ffb070',
    sunPos: [12, 7, 10], skyTop: '#1f2a52', horizon: '#caa37e', fog: '#caa37e',
    celestial: 'sun', celestialColor: '#ff9848', lights: true, stars: false,
  },
  night: {
    ambientMul: 0.42, ambientColor: '#5a6a92', sunMul: 0.26, sunColor: '#9fb6e0',
    sunPos: [10, 9, 12], skyTop: '#070b1c', horizon: '#1a2440', fog: '#141d33',
    celestial: 'moon', celestialColor: '#dfe8ff', lights: true, stars: true,
  },
};

/* ─── Weather presets ──────────────────────────────────────────── */
interface WeatherPreset {
  particles: 'none' | 'rain' | 'snow';
}
export const WEATHER_PRESETS: Record<WeatherKind, WeatherPreset> = {
  clear:   { particles: 'none' },
  rain:    { particles: 'rain' },
  snow:    { particles: 'snow' },
  wind:    { particles: 'none' },
  drought: { particles: 'none' },
};
