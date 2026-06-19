import type { ReportEntry, Season } from '../types';

export type WindDirection = 'east' | 'south' | 'west' | 'north' | 'calm';
export type WeatherKind = 'clear' | 'rain' | 'snow' | 'wind' | 'drought';

export interface Weather {
  kind: WeatherKind;
  wind: WindDirection;
  /** Wind strength 0-3. Strong wind (≥2) needed for serious fire attacks. */
  windPower: number;
}

export const WEATHER_LABEL: Record<WeatherKind, { en: string; zh: string }> = {
  clear:   { en: 'Clear',   zh: '晴'   },
  rain:    { en: 'Rain',    zh: '雨'   },
  snow:    { en: 'Snow',    zh: '雪'   },
  wind:    { en: 'Wind',    zh: '風'   },
  drought: { en: 'Drought', zh: '旱'   },
};

export const WIND_LABEL: Record<WindDirection, { en: string; zh: string }> = {
  east:  { en: 'E wind', zh: '東風' },
  south: { en: 'S wind', zh: '南風' },
  west:  { en: 'W wind', zh: '西風' },
  north: { en: 'N wind', zh: '北風' },
  calm:  { en: 'calm',   zh: '無風' },
};

/**
 * Roll weather for the season. Distribution reflects historical Three Kingdoms
 * geography: winter is northerly + cold, summer southerly + wet, autumn east
 * wind common (赤壁 conditions), spring variable.
 */
export function rollWeather(season: Season, rng: () => number): Weather {
  const r = rng();
  if (season === 'winter') {
    if (r < 0.25) return { kind: 'snow', wind: 'north', windPower: 2 };
    if (r < 0.45) return { kind: 'wind', wind: 'north', windPower: 3 };
    if (r < 0.55) return { kind: 'drought', wind: 'calm', windPower: 0 };
    return { kind: 'clear', wind: pickWind(rng, ['north', 'west']), windPower: 1 };
  }
  if (season === 'summer') {
    if (r < 0.30) return { kind: 'rain', wind: 'south', windPower: 1 };
    if (r < 0.40) return { kind: 'drought', wind: 'calm', windPower: 0 };
    if (r < 0.50) return { kind: 'wind', wind: 'south', windPower: 3 };
    return { kind: 'clear', wind: pickWind(rng, ['south', 'east']), windPower: 1 };
  }
  if (season === 'autumn') {
    // Classic 赤壁 conditions: east wind in autumn.
    if (r < 0.20) return { kind: 'wind', wind: 'east', windPower: 3 };
    if (r < 0.30) return { kind: 'rain', wind: 'east', windPower: 1 };
    return { kind: 'clear', wind: pickWind(rng, ['east', 'north']), windPower: 1 };
  }
  // spring
  if (r < 0.20) return { kind: 'rain', wind: 'east', windPower: 1 };
  if (r < 0.30) return { kind: 'wind', wind: pickWind(rng, ['east', 'south']), windPower: 2 };
  return { kind: 'clear', wind: pickWind(rng, ['east', 'south']), windPower: 1 };
}

function pickWind(rng: () => number, opts: WindDirection[]): WindDirection {
  return opts[Math.floor(rng() * opts.length)];
}

/**
 * Combat power multiplier from weather. Fire-attack capable troops (with a
 * "fire-tactic" formation or a flammable target) gain bonus when wind is
 * strong AND direction matches attack direction. Returned multiplier is
 * applied to attacker's power.
 */
export function fireAttackMultiplier(
  weather: Weather,
  attackerHasFireTactic: boolean,
): number {
  if (!attackerHasFireTactic) return 1;
  if (weather.kind === 'rain' || weather.kind === 'snow') return 0.7; // wet, fire fails
  if (weather.windPower >= 3) return 1.35; // strong wind — major bonus
  if (weather.windPower >= 2) return 1.18; // moderate
  return 1.05;
}

/**
 * March speed modifier. Rain + snow slow troops; strong wind hurries them.
 * Returns multiplier on march resolution speed (higher = faster).
 */
export function marchSpeedMultiplier(weather: Weather): number {
  if (weather.kind === 'snow') return 0.7;
  if (weather.kind === 'rain') return 0.85;
  if (weather.kind === 'wind' && weather.windPower >= 3) return 1.05;
  return 1.0;
}

/**
 * Add a weather report entry to the season report.
 */
export function describeWeather(weather: Weather): ReportEntry {
  const kindZh = WEATHER_LABEL[weather.kind].zh;
  const windZh = WIND_LABEL[weather.wind].zh;
  const powerMark = weather.windPower >= 3 ? '甚強' : weather.windPower >= 2 ? '勁' : '微';
  const text =
    weather.kind === 'clear' && weather.wind === 'calm'
      ? `天朗氣清 · ${kindZh}`
      : `${kindZh} · ${windZh}（${powerMark}）`;
  return {
    cityId: null,
    kind: 'note',
    text,
  };
}
