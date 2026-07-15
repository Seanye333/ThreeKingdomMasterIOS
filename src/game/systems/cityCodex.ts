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
  /** 名城功勳 — collection milestones already claimed (cross-campaign, once). */
  milestones: string[];
}

export function loadCityCodex(): CityCodex {
  try {
    const raw = localStorage.getItem(CITY_CODEX_KEY);
    if (!raw) return { earned: {}, milestones: [] };
    const p = JSON.parse(raw) as Partial<CityCodex>;
    return {
      earned: p.earned && typeof p.earned === 'object' ? p.earned : {},
      milestones: Array.isArray(p.milestones) ? p.milestones : [],
    };
  } catch {
    return { earned: {}, milestones: [] };
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
  if (fresh.length > 0) save({ ...codex, earned });
  return fresh;
}

/** Total distinct (city, achievement) pairs ever recorded — the collection size. */
export function cityCodexCount(codex: CityCodex): number {
  return Object.values(codex.earned).reduce((sum, list) => sum + list.length, 0);
}

/* ─── 名城功勳 — collection milestones (city-side twin of 圖鑑功勳/藏珍功勳) ─── */
export interface CityCodexMilestone {
  id: string;
  zh: string; en: string;
  /** Distinct city-honour pairs required across all your campaigns. */
  need: number;
  /** Boons paid into the campaign you claim from. */
  gold: number;
  /** Realm-wide loyalty lift — the people honour a famed builder of cities. */
  loyalty: number;
}

/**
 * 名城功勳 — reaching a tier of the 名城錄 is a claimable, once-ever boon paid
 * into the campaign you claim from: a treasury grant plus a realm-wide lift in
 * the people's regard. The city-side mirror of 圖鑑功勳 / 藏珍功勳.
 */
export const CITY_CODEX_MILESTONES: CityCodexMilestone[] = [
  { id: 'cm-5', zh: '一方之望', en: 'Regional Renown', need: 5, gold: 600, loyalty: 2 },
  { id: 'cm-15', zh: '牧民有方', en: 'A Shepherd of Cities', need: 15, gold: 1400, loyalty: 3 },
  { id: 'cm-30', zh: '德被四境', en: 'Virtue Across the Realm', need: 30, gold: 2600, loyalty: 4 },
  { id: 'cm-50', zh: '萬世治功', en: 'A Governance for the Ages', need: 50, gold: 4000, loyalty: 6 },
];

export function cityCodexMilestoneReached(codex: CityCodex, m: CityCodexMilestone): boolean {
  return cityCodexCount(codex) >= m.need;
}

export function cityCodexMilestoneClaimed(codex: CityCodex, id: string): boolean {
  return codex.milestones.includes(id);
}

/** Mark a milestone claimed (cross-campaign). Returns false if already claimed
 *  or not yet reached — the store owns paying out the boon. */
export function cityCodexClaimMilestone(id: string): boolean {
  const c = loadCityCodex();
  const m = CITY_CODEX_MILESTONES.find((x) => x.id === id);
  if (!m) return false;
  if (c.milestones.includes(id)) return false;
  if (!cityCodexMilestoneReached(c, m)) return false;
  save({ ...c, milestones: [...c.milestones, id] });
  return true;
}
