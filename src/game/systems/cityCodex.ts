/**
 * 名城錄 — the atlas of great cities, the city-side cousin of the 武將圖鑑 /
 * 名品圖鑑. Across all your campaigns it remembers every city you ever raised
 * to greatness — a 文化名城, a 百戰雄城, a 巨城 of a million souls — and which
 * distinctions each earned. Purely a keepsake ledger (localStorage), recorded
 * each spring from the cities you hold; it never resets.
 */
import type { City, EntityId } from '../types';

const CITY_CODEX_KEY = 'tkm-city-codex-v1';

export interface CityAchievement {
  id: string;
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
  glyph: string;
  /** True when the city currently qualifies for this distinction. */
  test: (c: City) => boolean;
}

export const CITY_ACHIEVEMENTS: CityAchievement[] = [
  { id: 'cultural-jewel', zh: '文化名城', en: 'Cultural Jewel', glyph: '文', descZh: '文教 ≥ 60', descEn: 'Culture ≥ 60', test: (c) => (c.culture ?? 0) >= 60 },
  { id: 'battle-worn', zh: '百戰雄城', en: 'Battle-Worn Bastion', glyph: '戰', descZh: '老兵度 ≥ 80', descEn: 'Veterancy ≥ 80', test: (c) => (c.veterancy ?? 0) >= 80 },
  { id: 'metropolis', zh: '億兆生民', en: 'Great Metropolis', glyph: '民', descZh: '人口 ≥ 40 萬', descEn: 'Population ≥ 400k', test: (c) => c.population >= 400_000 },
  { id: 'prosperous', zh: '富甲天下', en: 'Wealth of the Realm', glyph: '富', descZh: '商業 ≥ 180', descEn: 'Commerce ≥ 180', test: (c) => c.commerce >= 180 },
  { id: 'granary', zh: '天府之土', en: 'Granary of Heaven', glyph: '農', descZh: '農業 ≥ 180', descEn: 'Agriculture ≥ 180', test: (c) => c.agriculture >= 180 },
  { id: 'fortress', zh: '金城湯池', en: 'Impregnable Fortress', glyph: '城', descZh: '守備 ≥ 180 且三重城垣', descEn: 'Defense ≥ 180 & tier-3 walls', test: (c) => c.defense >= 180 && (c.wallTier ?? 1) >= 3 },
  { id: 'incorrupt', zh: '政清人和', en: 'Clean & Content', glyph: '清', descZh: '貪腐 ≤ 2 且民忠 ≥ 90', descEn: 'Corruption ≤ 2 & loyalty ≥ 90', test: (c) => (c.corruption ?? 0) <= 2 && c.loyalty >= 90 },
];

export const CITY_ACHIEVEMENTS_BY_ID: Record<string, CityAchievement> =
  Object.fromEntries(CITY_ACHIEVEMENTS.map((a) => [a.id, a]));

/** cityId → set of achievement ids ever earned by that city (any campaign). */
export interface CityCodex {
  earned: Record<string, string[]>;
}

export function loadCityCodex(): CityCodex {
  try {
    const raw = localStorage.getItem(CITY_CODEX_KEY);
    if (!raw) return { earned: {} };
    const p = JSON.parse(raw) as Partial<CityCodex>;
    return { earned: p.earned && typeof p.earned === 'object' ? p.earned : {} };
  } catch {
    return { earned: {} };
  }
}

function save(c: CityCodex): void {
  try { localStorage.setItem(CITY_CODEX_KEY, JSON.stringify(c)); } catch { /* quota — the atlas can wait */ }
}

/** The distinctions a city qualifies for right now. */
export function cityAchievementsNow(c: City): string[] {
  return CITY_ACHIEVEMENTS.filter((a) => a.test(c)).map((a) => a.id);
}

/**
 * Record the distinctions your held cities have earned. Returns the ids that are
 * NEWLY earned this call (for a herald), or [] if nothing new.
 */
export function cityCodexRecord(cities: City[]): Array<{ cityId: EntityId; achId: string }> {
  const codex = loadCityCodex();
  const earned = { ...codex.earned };
  const fresh: Array<{ cityId: EntityId; achId: string }> = [];
  for (const c of cities) {
    for (const achId of cityAchievementsNow(c)) {
      const list = earned[c.id] ?? [];
      if (!list.includes(achId)) {
        earned[c.id] = [...list, achId];
        fresh.push({ cityId: c.id, achId });
      }
    }
  }
  if (fresh.length > 0) save({ earned });
  return fresh;
}

/** Total distinct (city, achievement) pairs ever recorded — the collection size. */
export function cityCodexCount(codex: CityCodex): number {
  return Object.values(codex.earned).reduce((sum, list) => sum + list.length, 0);
}
