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
 * Returns multiplier on march resolution speed (higher = faster). Folded into
 * a column's overall speed (with the officer 健行/驛站 bonuses) so a winter
 * march genuinely drags and a spring downpour mires the baggage train.
 */
export function marchSpeedMultiplier(weather: Weather | undefined): number {
  if (!weather) return 1.0;
  if (weather.kind === 'snow') return 0.7;
  if (weather.kind === 'rain') return 0.85;
  if (weather.kind === 'wind' && weather.windPower >= 3) return 1.05;
  return 1.0;
}

/**
 * 天候災異 — a season of extreme weather can tip a city into outright disaster,
 * not just a soft harvest modifier. A drought may bring 蝗災 (locusts strip the
 * fields) or 流民 (famine drives the people onto the roads); prolonged rain may
 * burst the dikes (水患/河決), drowning crops and washing out earthworks. Well
 * irrigation/flood-works blunt it. Returns null when the heavens are merciful.
 * 一場大旱可能比一場敗仗更傷國本.
 */
export interface WeatherDisaster {
  kind: 'locust' | 'refugees' | 'flood';
  /** Fraction of the city's stored grain destroyed (0–1). */
  foodLossFrac: number;
  /** Fraction of population lost to flight or drowning (0–1). */
  popLossFrac: number;
  loyaltyDelta: number;
  /** Lasting hit to farmland / city defence works. */
  agricultureDelta: number;
  defenseDelta: number;
  textZh: string;
  textEn: string;
}

export function rollWeatherDisaster(
  weather: Weather,
  season: Season,
  city: { agriculture: number; floodWorks?: number; irrigationLevel?: number },
  rng: () => number,
): WeatherDisaster | null {
  if (weather.kind === 'drought') {
    // Summer/autumn droughts are the killers (a withered crop in the heat);
    // a winter "drought" is just a dry cold snap. Irrigation greatly mitigates.
    const seasonRisk = season === 'summer' ? 0.16 : season === 'autumn' ? 0.13 : season === 'spring' ? 0.08 : 0.04;
    const mit = Math.min(0.7, (city.irrigationLevel ?? 0) * 0.18);
    if (rng() >= seasonRisk * (1 - mit)) return null;
    // Locusts breed in drought-cracked earth; or the starving take to the road.
    if (rng() < 0.5) {
      return {
        kind: 'locust', foodLossFrac: 0.22, popLossFrac: 0, loyaltyDelta: -3,
        agricultureDelta: -4, defenseDelta: 0,
        textZh: '旱蝗為災 — 蝗群蔽日,禾稼一空,倉廩告罄。',
        textEn: 'Drought-born locusts strip the fields bare; the granaries empty.',
      };
    }
    return {
      kind: 'refugees', foodLossFrac: 0.10, popLossFrac: 0.05, loyaltyDelta: -5,
      agricultureDelta: -2, defenseDelta: 0,
      textZh: '大旱絕收,民不聊生 — 流民載道,棄城而徙。',
      textEn: 'The great drought drives the starving onto the roads as refugees.',
    };
  }
  if (weather.kind === 'rain') {
    // Prolonged rain bursts the dikes — flood-works (堤防/治水) hold them back.
    const seasonRisk = season === 'summer' ? 0.12 : season === 'spring' ? 0.09 : 0.05;
    const mit = Math.min(0.8, (city.floodWorks ?? 0) * 0.22);
    if (rng() >= seasonRisk * (1 - mit)) return null;
    return {
      kind: 'flood', foodLossFrac: 0.15, popLossFrac: 0.03, loyaltyDelta: -4,
      agricultureDelta: -3, defenseDelta: -3,
      textZh: '久雨成澇,河決堤潰 — 田廬盡沒,城防亦圮。',
      textEn: 'Endless rain bursts the dikes; fields, homes and ramparts wash away.',
    };
  }
  return null;
}

/**
 * 天候前瞻 — the seasonal outlook a court astronomer would read off the almanac:
 * what weather the COMING season tends to bring (the same historical bias
 * rollWeather samples), so a commander can plan a campaign around it the way the
 * 知天候 AI now does — 萬事俱備,只待天時.
 */
export function seasonWeatherOutlook(season: Season): { zh: string; en: string } {
  switch (season) {
    case 'winter': return { zh: '入冬:多北風大雪,行軍維艱,慎防旱寒。', en: 'Winter: northerly gales & snow — marching is hard.' };
    case 'summer': return { zh: '入夏:南風時雨,亦有暑旱蝗災之虞。', en: 'Summer: southerly rains, but heat-drought & locusts loom.' };
    case 'autumn': return { zh: '入秋:東風常作,天乾物燥 — 最利火攻(赤壁之時)。', en: 'Autumn: east winds, dry air — prime fire-attack weather (Red Cliffs).' };
    default:       return { zh: '入春:東南風和,間有春雨,河漲須防澇。', en: 'Spring: mild SE winds & rains — watch for flooding.' };
  }
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
