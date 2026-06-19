/**
 * 戰法情境 — situational effectiveness for the damage-dealing stratagems, so the
 * RIGHT tactic for the weather and terrain actually hits harder (and the wrong
 * one fizzles). Pure data: given the stratagem + a small context, returns a
 * multiplier and a short bilingual note. applyStratagem multiplies it into the
 * blow; the UI shows the note live on the tactic button so the player can plan.
 *
 *   突撃/騎  — 開闊馳騁 ×1.25, 林山阻馬 ×0.65
 *   矢雨    — 居高臨下 ×1.2, 順風 ×1.1, 雨潤弓弦 ×0.7
 *   落雷    — 雷雨相召 ×1.35, 霧雪稍減
 *   火計    — 風助火勢, 水濕/雨阻 (descriptive; the burn-duration already scales)
 */
import type { StratagemId, TerrainKind, Weather } from '../types';

export interface Situation {
  mult: number;
  note: { zh: string; en: string } | null;
}

const NEUTRAL: Situation = { mult: 1, note: null };

const OPEN = new Set<TerrainKind>(['plain', 'road', 'hill', 'bridge']);
const ROUGH = new Set<TerrainKind>(['forest', 'mountain', 'marsh', 'chokepoint']);
const HIGH = new Set<TerrainKind>(['hill', 'mountain', 'watchtower']);
const WET = new Set<TerrainKind>(['river', 'marsh', 'bridge']);

export interface SituationCtx {
  weather: Weather;
  casterTerrain: TerrainKind;
  targetTerrain: TerrainKind;
}

export function stratagemSituation(stratagem: StratagemId, ctx: SituationCtx): Situation {
  const { weather, casterTerrain, targetTerrain } = ctx;
  switch (stratagem) {
    case 'charge': {
      if (ROUGH.has(casterTerrain) || ROUGH.has(targetTerrain))
        return { mult: 0.65, note: { zh: '地形阻馬 ×0.65', en: 'rough ground ×0.65' } };
      if (OPEN.has(casterTerrain))
        return { mult: 1.25, note: { zh: '馳騁開闊 ×1.25', en: 'open charge ×1.25' } };
      return NEUTRAL;
    }
    case 'rain-of-arrows': {
      if (weather === 'rain')
        return { mult: 0.7, note: { zh: '雨潤弓弦 ×0.7', en: 'rain-soaked ×0.7' } };
      if (HIGH.has(casterTerrain))
        return { mult: 1.2, note: { zh: '居高臨下 ×1.2', en: 'high ground ×1.2' } };
      if (weather === 'wind')
        return { mult: 1.1, note: { zh: '順風遠射 ×1.1', en: 'tailwind ×1.1' } };
      return NEUTRAL;
    }
    case 'lightning': {
      if (weather === 'rain')
        return { mult: 1.35, note: { zh: '雷雨相召 ×1.35', en: 'storm-fed ×1.35' } };
      if (weather === 'snow' || weather === 'fog')
        return { mult: 0.85, note: { zh: '霧雪稍減 ×0.85', en: 'damped ×0.85' } };
      return NEUTRAL;
    }
    case 'fire-attack': {
      // Burn DURATION already scales by weather inside applyStratagem; these are
      // the extra terrain rule + a descriptive note for the preview.
      if (WET.has(targetTerrain))
        return { mult: 0.5, note: { zh: '水濕難燃 ×0.5', en: 'too wet ×0.5' } };
      if (weather === 'wind')
        return { mult: 1, note: { zh: '風助火勢', en: 'wind-fanned' } };
      if (weather === 'rain')
        return { mult: 1, note: { zh: '雨阻火攻', en: 'rain-doused' } };
      return NEUTRAL;
    }
    default:
      return NEUTRAL;
  }
}
