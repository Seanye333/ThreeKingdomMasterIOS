import type { EntityId, InternalAffairsType, Officer, OfficerStats, ReportEntry } from '../types';
import { SKILLS, SKILLS_BY_ID } from '../data/skills';
import { rollLevelUpTrait } from './traitEffects';
import { TRAIT_DEFS_BY_ID } from '../data/personality';
import { officerGrade, gradeScore, gradeFromScore, gradeRank } from './officerGrade';

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
  // 偏向成長 — combine any per-call steering with the officer's standing
  // 練兵/拜師 focus, so *every* XP source (battle, civic, spar) respects the
  // player's chosen direction once it's set.
  const focusList: Array<keyof OfficerStats> = [];
  if (favored) focusList.push(...(Array.isArray(favored) ? favored : [favored]));
  if (officer.trainingFocus && !focusList.includes(officer.trainingFocus)) focusList.push(officer.trainingFocus);
  const favoredKeys = focusList.length > 0 ? focusList : null;
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
  // 晉牌封賞 — a 品階 promotion (鐵→銅→銀→金) is a milestone, not just a silent
  // number creep. Fire once per tier reached (tracked by peakGrade so a stat
  // wobble around the threshold can't farm it), with a one-time morale/loyalty
  // lift as the court takes notice.
  let peakGrade = officer.peakGrade;
  let loyalty = officer.loyalty;
  const probe: Officer = { ...officer, stats, traits };
  const newGrade = gradeFromScore(gradeScore(probe));
  const basePeak = peakGrade ?? gradeFromScore(gradeScore(officer));
  if (gradeRank(newGrade) > gradeRank(basePeak)) {
    peakGrade = newGrade;
    loyalty = Math.min(100, loyalty + 2);
    const gi = officerGrade(probe);
    entries.push({
      cityId: officer.locationCityId,
      kind: 'talent',
      text: `${officer.name.en} has been promoted to ${gi.name.en} grade (${gi.rank.en}).`,
      textZh: `${officer.name.zh}晉升${gi.name.zh}（${gi.rank.zh}），名動一時。`,
    });
  }

  return {
    officer: { ...officer, xp: newXp, stats, latentStats: latent, skills, traits, peakGrade, loyalty },
    leveled: newLevel > oldLevel,
    entries,
  };
}

/**
 * 可習之技 — the innate skills an officer could plausibly grow into at their
 * current stat spread (the same filter the level-up roll draws from). Surfaced
 * in the officer sheet so growth has a visible horizon instead of being a black
 * box. Pure read — does not mutate or roll.
 */
export function learnableSkills(officer: Officer): Array<{ id: EntityId; name: { en: string; zh: string } }> {
  const owned = new Set(officer.skills);
  const s = officer.stats;
  return SKILLS.filter((sk) => {
    if (owned.has(sk.id)) return false;
    if (sk.category === 'combat' && s.war < 65) return false;
    if (sk.category === 'wisdom' && s.intelligence < 65) return false;
    if (sk.category === 'command' && s.leadership < 65) return false;
    if (sk.category === 'civil' && s.politics < 60) return false;
    return true;
  }).map((sk) => ({ id: sk.id, name: { en: sk.name.en, zh: sk.name.zh } }));
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

// ─── 轉生/突破 — renewed growth past the XP ceiling ─────────────────────────
/** How many times an officer may break through (keeps stats from running to 150). */
export const MAX_BREAKTHROUGHS = 5;
/** Each breakthrough lifts every latent cap by this much (up to STAT_CAP). */
const BREAKTHROUGH_LATENT_GAIN = 6;
/** Base gold cost; rises with each breakthrough already taken. */
const BREAKTHROUGH_BASE_COST = 800;

/** Gold cost of this officer's next breakthrough (escalates per breakthrough taken). */
export function breakthroughCost(officer: Officer): number {
  return BREAKTHROUGH_BASE_COST * (1 + (officer.breakthroughs ?? 0));
}

/** Whether an officer is eligible to break through right now (max growth level, under the cap). */
export function canBreakthrough(officer: Officer): { ok: boolean; reason?: 'not-max-level' | 'capped' } {
  if (totalLevel(officer.xp ?? 0) < MAX_GROWTH_LEVEL) return { ok: false, reason: 'not-max-level' };
  if ((officer.breakthroughs ?? 0) >= MAX_BREAKTHROUGHS) return { ok: false, reason: 'capped' };
  return { ok: true };
}

/** 轉生稱號 — a flavour rank that climbs with each breakthrough. */
const BREAKTHROUGH_TITLES: Array<{ zh: string; en: string }> = [
  { zh: '初成', en: 'Awakened' },
  { zh: '小成', en: 'Tempered' },
  { zh: '大成', en: 'Ascendant' },
  { zh: '化境', en: 'Transcendent' },
  { zh: '通神', en: 'Divine' },
];
export function breakthroughTitle(count: number | undefined): { zh: string; en: string } | null {
  if (!count || count < 1) return null;
  return BREAKTHROUGH_TITLES[Math.min(count, BREAKTHROUGH_TITLES.length) - 1];
}

/** Milestone traits granted at the 3rd (signature) and 5th (legendary) breakthrough,
 *  keyed off the officer's strongest stat so the perk fits who they are. */
const BREAKTHROUGH_TRAITS: Record<keyof OfficerStats, { mid: string; high: string }> = {
  war:          { mid: 'martial-valor', high: 'matchless' },
  leadership:   { mid: 'field-tactician', high: 'fortress-keeper' },
  intelligence: { mid: 'strategist', high: 'precognitive' },
  politics:     { mid: 'diligent', high: 'honor-bound' },
  charisma:     { mid: 'charming', high: 'noble' },
};

/**
 * 突破 — a fully-seasoned officer (max growth level) channels their experience
 * into a fresh leap: every latent cap rises, and their three signature stats
 * sharpen by +2 (within the new caps). At the 3rd and 5th breakthrough they also
 * awaken a signature trait fitting their strongest stat. This is the only growth
 * past the XP ceiling, so it's the long-game goal for veteran officers. Pure —
 * the caller (store) is responsible for the gold cost and eligibility gate.
 */
export function applyBreakthrough(
  officer: Officer,
): { officer: Officer; entries: ReportEntry[] } {
  const base = officer.latentStats ?? defaultLatent(officer.stats);
  const latent: OfficerStats = {
    leadership: Math.min(STAT_CAP, base.leadership + BREAKTHROUGH_LATENT_GAIN),
    war: Math.min(STAT_CAP, base.war + BREAKTHROUGH_LATENT_GAIN),
    intelligence: Math.min(STAT_CAP, base.intelligence + BREAKTHROUGH_LATENT_GAIN),
    politics: Math.min(STAT_CAP, base.politics + BREAKTHROUGH_LATENT_GAIN),
    charisma: Math.min(STAT_CAP, base.charisma + BREAKTHROUGH_LATENT_GAIN),
  };
  let stats = { ...officer.stats };
  // Sharpen the three signature stats (a breakthrough plays to strengths).
  const ranked = (Object.keys(stats) as Array<keyof OfficerStats>)
    .sort((a, b) => stats[b] - stats[a])
    .slice(0, 3);
  const grown: string[] = [];
  for (const k of ranked) {
    const next = Math.min(latent[k], stats[k] + 2);
    if (next > stats[k]) grown.push(`${STAT_NAME_ZH[k]}+${next - stats[k]}`);
    stats = { ...stats, [k]: next };
  }
  const breakthroughs = (officer.breakthroughs ?? 0) + 1;
  const title = breakthroughTitle(breakthroughs);
  const entries: ReportEntry[] = [{
    cityId: officer.locationCityId,
    kind: 'talent',
    text: `${officer.name.en} achieved a breakthrough (#${breakthroughs}${title ? `, ${title.en}` : ''}), reaching new heights.`,
    textZh: `${officer.name.zh}突破第${breakthroughs}重${title ? `·${title.zh}` : ''}，潛力大進（${grown.join('、') || '臻於化境'}）。`,
  }];

  // 突破覺醒 — milestone breakthroughs awaken a signature trait fitting the
  // officer's strongest stat (3rd → signature, 5th → legendary).
  let traits = (officer.traits ?? []) as string[];
  const topStat = (Object.keys(stats) as Array<keyof OfficerStats>)
    .reduce((best, k) => (stats[k] > stats[best] ? k : best), 'war' as keyof OfficerStats);
  const tier = breakthroughs === 3 ? 'mid' : breakthroughs === 5 ? 'high' : null;
  if (tier) {
    const traitId = BREAKTHROUGH_TRAITS[topStat][tier];
    if (!traits.includes(traitId)) {
      traits = [...traits, traitId];
      const def = TRAIT_DEFS_BY_ID[traitId];
      entries.push({
        cityId: officer.locationCityId,
        kind: 'talent',
        text: `${officer.name.en} awakened the ${def?.name.en ?? traitId} trait through breakthrough.`,
        textZh: `${officer.name.zh}突破之際,覺醒「${def?.name.zh ?? traitId}」之性。`,
      });
    }
  }

  return { officer: { ...officer, stats, latentStats: latent, breakthroughs, traits: traits as Officer['traits'] }, entries };
}

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
