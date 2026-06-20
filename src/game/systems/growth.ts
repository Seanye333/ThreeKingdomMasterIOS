import type { EntityId, InternalAffairsType, Officer, OfficerStats, ReportEntry } from '../types';
import { SKILLS, SKILLS_BY_ID } from '../data/skills';
import { rollLevelUpTrait } from './traitEffects';
import { TRAIT_DEFS_BY_ID } from '../data/personality';

const STAT_NAME_ZH: Record<keyof OfficerStats, string> = {
  leadership: '統率',
  war: '武力',
  intelligence: '知力',
  politics: '政治',
  charisma: '魅力',
};

/**
 * Officer leveling: officers gain XP from battles and (slowly) from being
 * stationed in a city with an academy. At XP thresholds they roll one
 * random stat (from their latent gap) for a +1 increase.
 */

const XP_LEVELS = [100, 250, 500, 900, 1500, 2500];

export function totalLevel(xp: number): number {
  let lvl = 0;
  for (const t of XP_LEVELS) if (xp >= t) lvl++;
  return lvl;
}

export function xpForNextLevel(xp: number): number {
  for (const t of XP_LEVELS) if (xp < t) return t;
  return XP_LEVELS[XP_LEVELS.length - 1];
}

/** Top growth level — an officer at this level has crossed every threshold. */
export const MAX_GROWTH_LEVEL = XP_LEVELS.length;

/**
 * Progress within the current growth level, for UI bars. `intoLevel/levelSpan`
 * gives the fill ratio; `toNext` is XP remaining to the next level (0 at max).
 */
export function xpProgress(xp: number | undefined): {
  level: number;
  intoLevel: number;
  levelSpan: number;
  toNext: number;
  atMax: boolean;
} {
  const x = Math.max(0, xp ?? 0);
  const level = totalLevel(x);
  const atMax = level >= XP_LEVELS.length;
  const floor = level === 0 ? 0 : XP_LEVELS[level - 1];
  const ceil = atMax ? XP_LEVELS[XP_LEVELS.length - 1] : XP_LEVELS[level];
  return {
    level,
    intoLevel: x - floor,
    levelSpan: Math.max(1, ceil - floor),
    toNext: atMax ? 0 : ceil - x,
    atMax,
  };
}

/**
 * Award XP and roll stat growth when thresholds are crossed. Latent stats
 * cap the growth; we never grow a stat above its latent value (default
 * latent = stat + 10).
 */
export function grantXp(
  officer: Officer,
  amount: number,
  rng: () => number = Math.random,
  // 偏向成長 — when set, level-up stat gains are steered toward these stats
  // (e.g. a 舌戰 grows 知力/魅力). Falls back to the normal spread only when
  // none of the favoured stats can still grow.
  favored?: keyof OfficerStats | Array<keyof OfficerStats>,
): {
  officer: Officer;
  leveled: boolean;
  entries: ReportEntry[];
} {
  const favoredKeys = favored ? (Array.isArray(favored) ? favored : [favored]) : null;
  const oldXp = officer.xp ?? 0;
  const newXp = oldXp + amount;
  const oldLevel = totalLevel(oldXp);
  const newLevel = totalLevel(newXp);
  const entries: ReportEntry[] = [];
  let stats = { ...officer.stats };
  let skills = officer.skills;
  let traits = officer.traits ?? [];
  const latent = officer.latentStats ?? defaultLatent(officer.stats);
  for (let i = oldLevel; i < newLevel; i++) {
    // Pick the stat with the largest gap from its latent cap and grow it.
    const gaps: Array<[keyof OfficerStats, number]> = (Object.keys(stats) as Array<keyof OfficerStats>)
      .map((k) => [k, latent[k] - stats[k]] as [keyof OfficerStats, number])
      .filter(([, gap]) => gap > 0);
    if (gaps.length === 0) break;
    // 偏向成長 — if the grant favours certain stats and any can still grow,
    // draw only from those; otherwise fall back to the full spread.
    const favoredGaps = favoredKeys ? gaps.filter(([k]) => favoredKeys.includes(k)) : [];
    const pool = favoredGaps.length > 0 ? favoredGaps : gaps;
    pool.sort((a, b) => b[1] - a[1]);
    // Bias toward the top 3 by gap (weighted random).
    const top = pool.slice(0, 3);
    const sumW = top.reduce((s, [, g]) => s + g, 0);
    let r = rng() * sumW;
    let chosen: keyof OfficerStats = top[0][0];
    for (const [k, g] of top) {
      r -= g;
      if (r <= 0) { chosen = k; break; }
    }
    const inc = 1 + (rng() < 0.25 ? 1 : 0);
    stats = { ...stats, [chosen]: Math.min(latent[chosen], stats[chosen] + inc) };
    entries.push({
      cityId: officer.locationCityId,
      kind: 'note',
      text: `${officer.name.en} grew in ${String(chosen)} (+${inc}) reaching level ${i + 1}.`,
      textZh: `${officer.name.zh}之${STAT_NAME_ZH[chosen]}增益（+${inc}），晉升至 ${i + 1} 級。`,
    });

    // Skill learning: at every odd level (1, 3, 5), there's a chance to learn
    // a new innate skill the officer doesn't already have. Higher stats =
    // higher chance.
    if ((i + 1) % 2 === 1) {
      const candidates = pickLearnableSkill(stats, skills, rng);
      if (candidates && rng() < 0.5) {
        skills = [...skills, candidates.id];
        entries.push({
          cityId: officer.locationCityId,
          kind: 'note',
          text: `${officer.name.en} has learned the ${candidates.name.en} (${candidates.name.zh}) skill!`,
          textZh: `${officer.name.zh}習得「${candidates.name.zh}」之技！`,
        });
      }
    }

    // A — Trait milestone: at lv3, lv5, lv6 there's a chance to earn a
    // new personality trait drawn from a stat-weighted pool.
    const targetLevel = i + 1;
    const probeOfficer: Officer = { ...officer, stats, traits };
    const gained = rollLevelUpTrait(probeOfficer, targetLevel, rng);
    if (gained) {
      traits = [...traits, gained as Officer['traits'] extends (infer U)[] | undefined ? U : never];
      const def = TRAIT_DEFS_BY_ID[gained];
      entries.push({
        cityId: officer.locationCityId,
        kind: 'talent',
        text: `${officer.name.en} grew into the ${def?.name.en ?? gained} trait through experience.`,
        textZh: `${officer.name.zh}閱歷漸深,習得「${def?.name.zh ?? gained}」之性。`,
      });
    }
  }
  return {
    officer: { ...officer, xp: newXp, stats, latentStats: latent, skills, traits },
    leveled: newLevel > oldLevel,
    entries,
  };
}

/**
 * Pick a skill the officer could plausibly learn at their current stat
 * spread — combat skills favor war, wisdom skills favor intelligence, etc.
 */
function pickLearnableSkill(
  stats: OfficerStats,
  currentSkills: EntityId[],
  rng: () => number,
): { id: EntityId; name: { en: string; zh: string } } | null {
  const owned = new Set(currentSkills);
  // Filter to skills the officer doesn't have and that "fit" their stat profile.
  const pool = SKILLS.filter((s) => {
    if (owned.has(s.id)) return false;
    if (s.category === 'combat' && stats.war < 65) return false;
    if (s.category === 'wisdom' && stats.intelligence < 65) return false;
    if (s.category === 'command' && stats.leadership < 65) return false;
    if (s.category === 'civil' && stats.politics < 60) return false;
    return true;
  });
  if (pool.length === 0) return null;
  const picked = pool[Math.floor(rng() * pool.length)];
  return { id: picked.id, name: { en: picked.name.en, zh: picked.name.zh } };
}

void SKILLS_BY_ID;

/** Hard cap for officer stats after growth — was 100, now 150. */
export const STAT_CAP = 150;

function defaultLatent(stats: OfficerStats): OfficerStats {
  // Latent gap = current stat + 20% of remaining headroom (up to STAT_CAP).
  // A young officer at 70 has latent ≈ 70 + 16 = 86; a peak officer at 99
  // has latent ≈ 99 + 10 = 109; a legendary officer at 130 reaches 134.
  const grow = (v: number) => Math.min(STAT_CAP, v + Math.max(8, Math.floor((STAT_CAP - v) * 0.25)));
  return {
    leadership: grow(stats.leadership),
    war: grow(stats.war),
    intelligence: grow(stats.intelligence),
    politics: grow(stats.politics),
    charisma: grow(stats.charisma),
  };
}

/**
 * Aggregate XP from a tactical battle: commander +50, companions +25, victors
 * get an extra +25. Returns updated officers and growth report entries.
 */
export function awardBattleXp(
  officers: Record<EntityId, Officer>,
  participantIds: EntityId[],
  victorIds: EntityId[],
  rng: () => number = Math.random,
): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
  for (const id of participantIds) {
    const o = out[id];
    if (!o) continue;
    let amt = 25;
    if (victorIds.includes(id)) amt += 25;
    const res = grantXp(o, amt, rng);
    out[id] = res.officer;
    entries.push(...res.entries);
  }
  return { officers: out, entries };
}

/**
 * 內政經驗 — the stat each internal-affairs command exercises. An officer kept
 * on civic duty slowly specialises in the relevant stat (政治 for development,
 * 魅力 for people work, 統率 for garrison). Kept local to avoid a
 * growth→commands import; mirrors COMMAND_DEFS[type].stat.
 */
const INTERNAL_AFFAIRS_FAVORED: Record<InternalAffairsType, keyof OfficerStats> = {
  'develop-agriculture': 'politics',
  'develop-commerce': 'politics',
  'build-defense': 'politics',
  'recruit-troops': 'charisma',
  'improve-loyalty': 'charisma',
  search: 'charisma',
  'major-agriculture': 'politics',
  'major-commerce': 'politics',
  'major-defense': 'politics',
  'encourage-migration': 'charisma',
  'upgrade-wall': 'politics',
  garrison: 'leadership',
};

/** Heavier projects grant a bit more of the trickle. */
const INTERNAL_AFFAIRS_MAJOR = new Set<InternalAffairsType>([
  'major-agriculture',
  'major-commerce',
  'major-defense',
  'encourage-migration',
  'upgrade-wall',
]);

/** Base XP from one season of civic work — far below battle XP (25–50) so
 *  growth from internal affairs is a slow burn (~10 seasons to level 1). */
export const INTERNAL_AFFAIRS_XP = 10;
export const INTERNAL_AFFAIRS_XP_MAJOR = 16;

/**
 * Award the slow internal-affairs XP trickle to the officer who carried out a
 * command, steered toward the stat that command exercises. `success === false`
 * (a capped or no-op command) scales the grant down to 40% — the officer still
 * spent the season, but produced little. Returns the updated officer and any
 * level-up report entries (empty on the common no-threshold-crossed season).
 */
export function awardInternalAffairsXp(
  officer: Officer,
  type: InternalAffairsType,
  success: boolean,
  rng: () => number = Math.random,
): { officer: Officer; entries: ReportEntry[] } {
  const base = INTERNAL_AFFAIRS_MAJOR.has(type) ? INTERNAL_AFFAIRS_XP_MAJOR : INTERNAL_AFFAIRS_XP;
  const amount = success ? base : Math.max(3, Math.round(base * 0.4));
  const res = grantXp(officer, amount, rng, INTERNAL_AFFAIRS_FAVORED[type]);
  return { officer: res.officer, entries: res.entries };
}
