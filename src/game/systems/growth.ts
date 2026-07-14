import type { EntityId, InternalAffairsType, Officer, OfficerStats, ReportEntry } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { SKILLS, SKILLS_BY_ID } from '../data/skills';
import { FORMATION_DEFS, TACTIC_DEFS } from '../data/officerAttributes';
import { rollLevelUpTrait } from './traitEffects';
import { TRAIT_DEFS_BY_ID } from '../data/personality';
import { officerGrade, gradeScore, gradeFromScore, gradeRank } from './officerGrade';
import { withAffliction, duelWound } from './afflictions';

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

// 歷練曲線 — the old curve topped out at level 6 (2500 XP) and an officer hit
// it inside a campaign's first stretch, after which leveling went quiet until
// 轉生/突破. Three veteran tiers extend the climb so a long-serving officer keeps
// earning growth (and the per-level 歷練 passive below) well into the late game.
const XP_LEVELS = [100, 250, 500, 900, 1500, 2500, 3800, 5500, 8000];

export function totalLevel(xp: number): number {
  let lvl = 0;
  for (const t of XP_LEVELS) if (xp >= t) lvl++;
  return lvl;
}

/**
 * 歷練之威 — a gentle per-growth-level combat passive so the *level number*
 * itself, not only the stat gains it rolls, is worth climbing. +0.6% combat
 * power per level (≈ +5.4% at the level-9 ceiling). Stacks multiplicatively
 * with 品階威儀 / 威名 / items; deliberately small so seasoning tilts a fight
 * without eclipsing raw stats.
 */
/** 戰意 — the hot/cold streak from fought battles: 勢如破竹 lends fire
 * (+0.6%/win, cap +3%), 心灰意冷 dulls the arm (−0.6%/loss, floor −1.8%). */
export function streakPowerMul(o: Officer): number {
  const s = Math.max(-3, Math.min(5, o.streak ?? 0));
  return 1 + s * 0.006;
}

export function growthPowerMul(officer: Officer): number {
  return 1 + 0.006 * totalLevel(officer.xp ?? 0);
}

// ─── 成長資質 / 年齡軸 / 戰績驅動 — soft modifiers on WHICH stat a level-up grows ──
// These never override an explicit 練兵/拜師 focus (that stays a hard pool filter
// in grantXp); they only weight the roll within whatever pool is in play, so two
// officers with the same stats still develop along different arcs.

/** 成長資質 — a per-stat talent grade read from the latent ceiling. A high ceiling
 *  (a 呂布's 武力, a 諸葛's 智力) reads as 天/上 aptitude: that stat grows in bigger
 *  steps (better +2 odds) and wins the level-up roll more often, so officers
 *  specialise toward what they're gifted at. Stable across a campaign — latent
 *  only moves on 突破/頓悟 — so it reads as the officer's nature, not a moving bar. */
export type AptitudeGrade = 'S' | 'A' | 'B' | 'C';
const APT_LABEL: Record<AptitudeGrade, { zh: string; en: string }> = {
  S: { zh: '天資', en: 'S' },
  A: { zh: '上資', en: 'A' },
  B: { zh: '中資', en: 'B' },
  C: { zh: '常資', en: 'C' },
};
export function aptitudeLabel(g: AptitudeGrade): { zh: string; en: string } { return APT_LABEL[g]; }

export function statAptitude(latentVal: number): AptitudeGrade {
  if (latentVal >= 115) return 'S';
  if (latentVal >= 98) return 'A';
  if (latentVal >= 82) return 'B';
  return 'C';
}
/** Aptitude per stat, read from the officer's latent ceilings. */
export function growthAptitude(officer: Officer): Record<keyof OfficerStats, AptitudeGrade> {
  const latent = officer.latentStats ?? defaultLatent(officer.stats);
  return {
    leadership: statAptitude(latent.leadership),
    war: statAptitude(latent.war),
    intelligence: statAptitude(latent.intelligence),
    politics: statAptitude(latent.politics),
    charisma: statAptitude(latent.charisma),
  };
}
/** +2 (vs +1) growth odds by aptitude — gifted stats sharpen in bigger leaps. */
const APT_PLUS2: Record<AptitudeGrade, number> = { S: 0.45, A: 0.34, B: 0.25, C: 0.15 };
/** Pick-weight multiplier by aptitude — gifted stats win the level-up roll more. */
const APT_WEIGHT: Record<AptitudeGrade, number> = { S: 1.7, A: 1.3, B: 1.0, C: 0.7 };

/** 年齡軸 — the stats a level-up leans toward at each life-stage. 武勇 belongs to
 *  youth; the 巔峰 years are balanced; age then redirects growth into 統御 and 智政,
 *  so a hot-blooded 猛將 naturally matures into a 統帥 / 老謀的謀臣 (pairs with aging's
 *  martial decline + the hot→sage trait drift). Empty = no tilt. */
export function ageGrowthBias(age: number): Array<keyof OfficerStats> {
  if (!Number.isFinite(age)) return [];
  if (age < 30) return ['war', 'leadership'];
  if (age < 45) return [];
  if (age < 55) return ['leadership', 'intelligence'];
  return ['intelligence', 'politics'];
}

/** 戰績驅動 — the single stat an officer's track record most exercises, so growth
 *  drifts toward what they actually spend their seasons doing (a knife-fighter
 *  hones 武力, a spymaster 智力). Returns null for a blank/unremarkable record. */
export function deedFavoredStats(deeds: HeroicDeeds | undefined): keyof OfficerStats | null {
  if (!deeds) return null;
  const score: Record<keyof OfficerStats, number> = {
    war: (deeds.killsTroops ?? 0) / 2500 + (deeds.duelsWon ?? 0) * 1.5,
    intelligence: (deeds.espionageSuccess ?? 0) * 1.2 + (deeds.debatesWon ?? 0),
    leadership: (deeds.citiesTaken ?? 0) * 1.5 + (deeds.battlesWon ?? 0) * 0.4,
    politics: (deeds.civicWorks ?? 0) * 0.6,
    charisma: (deeds.childrenSired ?? 0) * 0.5,
  };
  let best: keyof OfficerStats | null = null;
  let bestV = 0.75; // a floor so a near-blank record yields no bias
  for (const k of Object.keys(score) as Array<keyof OfficerStats>) {
    if (score[k] > bestV) { bestV = score[k]; best = k; }
  }
  return best;
}

/** Combine the soft tilts (年齡 + 戰績) into a per-stat weight multiplier applied
 *  inside grantXp's level-up roll. Aptitude is folded in separately (APT_WEIGHT). */
function softBiasWeights(
  officer: Officer,
  year: number | undefined,
  deeds: HeroicDeeds | undefined,
): Record<keyof OfficerStats, number> {
  const w: Record<keyof OfficerStats, number> = { leadership: 1, war: 1, intelligence: 1, politics: 1, charisma: 1 };
  if (year != null && Number.isFinite(officer.birthYear)) {
    for (const k of ageGrowthBias(year - officer.birthYear)) w[k] *= 1.5;
  }
  const ds = deedFavoredStats(deeds);
  if (ds) w[ds] *= 1.4;
  return w;
}

/** 頓悟門檻 — overflow XP (past the level-9 ceiling) needed for one 頓悟. */
export const EPIPHANY_THRESHOLD = 600;

/** Roll one 頓悟 for a maxed officer: usually deepen a latent ceiling (and nudge
 *  the stat with it), occasionally a flash of insight teaches a skill. Pure;
 *  returns null only when there's genuinely nothing left to give. */
function rollEpiphany(
  officer: Officer,
  rng: () => number,
): { stats: OfficerStats; latentStats: OfficerStats; skills: EntityId[]; entry: ReportEntry } | null {
  let stats = { ...officer.stats };
  let latent = { ...(officer.latentStats ?? defaultLatent(officer.stats)) };
  let skills = officer.skills;
  // 30% — a flash of insight teaches a fitting innate skill (if any is learnable).
  if (rng() < 0.3) {
    const learned = pickLearnableSkill(stats, skills, rng);
    if (learned) {
      skills = [...skills, learned.id];
      return {
        stats, latentStats: latent, skills,
        entry: {
          cityId: officer.locationCityId, kind: 'talent',
          text: `${officer.name.en} broke a plateau — a flash of insight taught the ${learned.name.en} (${learned.name.zh}) skill.`,
          textZh: `${officer.name.zh}久練臨瓶頸而頓悟,豁然習得「${learned.name.zh}」之技。`,
        },
      };
    }
  }
  // Otherwise lift a latent ceiling — prefer the 練兵 focus, else the strongest
  // stat not already at the hard cap — and sharpen that stat by +1.
  const order: Array<keyof OfficerStats> = [];
  if (officer.trainingFocus) order.push(officer.trainingFocus);
  for (const k of (Object.keys(stats) as Array<keyof OfficerStats>).sort((a, b) => stats[b] - stats[a])) {
    if (!order.includes(k)) order.push(k);
  }
  const k = order.find((s) => latent[s] < STAT_CAP);
  if (!k) return null; // every latent already at the hard cap — nothing to give
  latent = { ...latent, [k]: Math.min(STAT_CAP, latent[k] + 2) };
  stats = { ...stats, [k]: Math.min(latent[k], stats[k] + 1) };
  return {
    stats, latentStats: latent, skills,
    entry: {
      cityId: officer.locationCityId, kind: 'talent',
      text: `${officer.name.en} broke through a plateau — ${STAT_NAME_ZH[k]} potential deepened.`,
      textZh: `${officer.name.zh}臨瓶頸而頓悟,${STAT_NAME_ZH[k]}之資益進。`,
    },
  };
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
  // 年齡軸 / 戰績驅動 — soft tilts that weight (never gate) the level-up roll.
  // Pass the current `year` so age can shape growth, and the officer's `deeds`
  // so their track record nudges it. Both optional and backward-compatible.
  opts?: { year?: number; deeds?: HeroicDeeds },
): {
  officer: Officer;
  leveled: boolean;
  entries: ReportEntry[];
} {
  // 偏向成長 — combine any per-call steering with the officer's standing
  // 練兵/拜師 focus, so *every* XP source (battle, civic, spar) respects the
  // player's chosen direction once it's set. This is a HARD pool filter.
  const focusList: Array<keyof OfficerStats> = [];
  if (favored) focusList.push(...(Array.isArray(favored) ? favored : [favored]));
  if (officer.trainingFocus && !focusList.includes(officer.trainingFocus)) focusList.push(officer.trainingFocus);
  const favoredKeys = focusList.length > 0 ? focusList : null;
  // 資質 + 年齡 + 戰績 — SOFT weights applied within whatever pool is in play.
  const apt = growthAptitude(officer);
  const soft = softBiasWeights(officer, opts?.year, opts?.deeds);
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
    // Weight each candidate by its latent gap, its 資質, and the soft 年齡/戰績
    // tilt — so within the pool, gifted + age-appropriate + practised stats win
    // the roll more often. Top-3 weighted random keeps it from being deterministic.
    const weighted: Array<[keyof OfficerStats, number]> = pool.map(([k, gap]) =>
      [k, gap * APT_WEIGHT[apt[k]] * soft[k]] as [keyof OfficerStats, number]);
    weighted.sort((a, b) => b[1] - a[1]);
    const top = weighted.slice(0, 3);
    const sumW = top.reduce((s, [, wv]) => s + wv, 0);
    let r = rng() * sumW;
    let chosen: keyof OfficerStats = top[0][0];
    for (const [k, wv] of top) {
      r -= wv;
      if (r <= 0) { chosen = k; break; }
    }
    // 資質 raises the odds of a +2 leap on the chosen stat.
    const inc = 1 + (rng() < APT_PLUS2[apt[chosen]] ? 1 : 0);
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
  // 瓶頸 → 頓悟 — past the level-9 XP ceiling, experience no longer buys levels,
  // so it would simply be wasted until the officer can afford a 突破. Instead the
  // overflow pools into 頓悟: each time the gauge fills, the officer breaks a 瓶頸
  // and lifts one latent ceiling (or, rarely, learns a skill) — a slow mini-
  // breakthrough that keeps a maxed veteran inching forward between 突破s.
  let epiphany = officer.epiphany ?? 0;
  let latentOut = latent;
  const xpCeil = XP_LEVELS[XP_LEVELS.length - 1];
  if (newXp > xpCeil) {
    epiphany += newXp - Math.max(oldXp, xpCeil); // the portion of this grant past the ceiling
    let guard = 0;
    while (epiphany >= EPIPHANY_THRESHOLD && guard++ < 8) {
      epiphany -= EPIPHANY_THRESHOLD;
      const ep = rollEpiphany({ ...officer, stats, latentStats: latentOut, skills, traits }, rng);
      if (!ep) { epiphany = 0; break; } // nothing left to give — stop banking
      stats = ep.stats; latentOut = ep.latentStats; skills = ep.skills;
      entries.push(ep.entry);
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
      // 金牌+ crossings earn a 封賞 ceremony for the player's own officers.
      ...(gradeRank(newGrade) >= gradeRank('gold') ? { promotion: { officerId: officer.id, grade: newGrade } } : {}),
    });
  }

  return {
    officer: {
      ...officer, xp: newXp, stats, latentStats: latentOut, skills, traits, peakGrade, loyalty,
      ...(epiphany > 0 || officer.epiphany != null ? { epiphany } : {}),
    },
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

/** 淬鍊之鐵 — iron a breakthrough also consumes (besides gold), tying 突破 to the
 *  forging economy: a force must control 鐵 to keep ascending its legends. Scales
 *  with breakthroughs already taken. */
export function breakthroughIronCost(officer: Officer): number {
  return 80 * (1 + (officer.breakthroughs ?? 0));
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

/** 突破之道的招牌性格 — distinct signature per chosen 道 (so 將道≠王道 even though
 *  both touch 統率). Falls back to BREAKTHROUGH_TRAITS (by stat) when no path. */
const PATH_SIGNATURE_TRAITS: Record<BreakthroughPath, { mid: string; high: string }> = {
  martial:    { mid: 'martial-valor', high: 'matchless' },
  command:    { mid: 'iron-discipline', high: 'fortress-keeper' },
  strategy:   { mid: 'strategist', high: 'precognitive' },
  governance: { mid: 'diligent', high: 'honor-bound' },
  kingly:     { mid: 'charming', high: 'noble' },
};

/** 突破之道 — the path a 突破 takes, biasing which two 圍 sharpen (+2) and which
 *  signature trait awakens. The player chooses each time; the AI picks by strength. */
export type BreakthroughPath = 'martial' | 'command' | 'strategy' | 'governance' | 'kingly';
export const BREAKTHROUGH_PATHS: Record<BreakthroughPath, { zh: string; en: string; stats: [keyof OfficerStats, keyof OfficerStats] }> = {
  martial:    { zh: '武道', en: 'Martial',    stats: ['war', 'leadership'] },
  command:    { zh: '將道', en: 'Command',    stats: ['leadership', 'intelligence'] },
  strategy:   { zh: '謀道', en: 'Strategy',   stats: ['intelligence', 'politics'] },
  governance: { zh: '治道', en: 'Governance', stats: ['politics', 'charisma'] },
  kingly:     { zh: '王道', en: 'Kingly',     stats: ['charisma', 'leadership'] },
};
/** The path an AI (or a defaulting caller) picks for an officer — by their strongest 圍. */
export function defaultBreakthroughPath(officer: Officer): BreakthroughPath {
  const t = topStat(officer);
  return t === 'war' ? 'martial' : t === 'leadership' ? 'command' : t === 'intelligence' ? 'strategy' : t === 'politics' ? 'governance' : 'kingly';
}

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
  // 突破之道 — when given, the chosen path forces its two 圍 (plus the highest
  // remaining) to sharpen and steers the milestone trait. Omitted = play to the
  // officer's current strengths (legacy/auto behaviour).
  path?: BreakthroughPath,
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
  // Sharpen three signature 圍: the path's two (if chosen) plus the highest of the
  // rest, else simply the officer's three best (a breakthrough plays to strengths).
  const ranked: Array<keyof OfficerStats> = path
    ? (() => {
        const ps = BREAKTHROUGH_PATHS[path].stats;
        const rest = (Object.keys(stats) as Array<keyof OfficerStats>)
          .filter((k) => !ps.includes(k)).sort((a, b) => stats[b] - stats[a]);
        return [ps[0], ps[1], rest[0]];
      })()
    : (Object.keys(stats) as Array<keyof OfficerStats>).sort((a, b) => stats[b] - stats[a]).slice(0, 3);
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

  // 突破覺醒 — milestone breakthroughs awaken a signature trait fitting the chosen
  // 道 (or the officer's strongest stat when no path) — 3rd → signature, 5th → legendary.
  let traits = (officer.traits ?? []) as string[];
  const traitStat = path
    ? BREAKTHROUGH_PATHS[path].stats[0]
    : (Object.keys(stats) as Array<keyof OfficerStats>).reduce((best, k) => (stats[k] > stats[best] ? k : best), 'war' as keyof OfficerStats);
  const tier = breakthroughs === 3 ? 'mid' : breakthroughs === 5 ? 'high' : null;
  if (tier) {
    const traitId = path
      ? PATH_SIGNATURE_TRAITS[path][tier]
      : BREAKTHROUGH_TRAITS[traitStat][tier];
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

  // 神品覺醒 — the absolute capstone: a 鑽石 officer reaching their FINAL (5th)
  // breakthrough transcends — every 圍 sharpens once more (+2, within latent) and a
  // last flash of insight masters a legendary skill. The endgame summit; only the
  // very greatest, fully-broken-through legends ever see it.
  let skills = officer.skills;
  if (breakthroughs === MAX_BREAKTHROUGHS) {
    const probe: Officer = { ...officer, stats, traits: traits as Officer['traits'] };
    if (gradeFromScore(gradeScore(probe)) === 'diamond') {
      for (const k of Object.keys(stats) as Array<keyof OfficerStats>) {
        stats = { ...stats, [k]: Math.min(latent[k], stats[k] + 2) };
      }
      const learned = pickLearnableSkill(stats, skills, () => 0); // deterministic capstone pick
      if (learned && !skills.includes(learned.id)) skills = [...skills, learned.id];
      entries.push({
        cityId: officer.locationCityId,
        kind: 'talent',
        text: `${officer.name.en} attained 神品覺醒 — transcendent on every axis${learned ? `, mastering ${learned.name.en}` : ''}.`,
        textZh: `${officer.name.zh}臻於神品覺醒,五圍俱進${learned ? `,悟得「${learned.name.zh}」絕技` : ''},古今無雙。`,
      });
    }
  }

  return { officer: { ...officer, stats, latentStats: latent, breakthroughs, traits: traits as Officer['traits'], skills }, entries };
}

// ─── 師徒衣缽 — explicit 拜師 bonds ───────────────────────────────────────────
// The passive 名將帶新兵 trickle (any 金牌+ elder seasons juniors in their city)
// stays in resolution. This is the *chosen* bond: a disciple apprenticed to a
// specific master grows faster, toward the master's strongest suit, and slowly
// inherits the master's craft (衣缽相傳) — then a 遺志 boost when the master dies.

/** XP a disciple earns each season their master teaches from the same city —
 *  richer than the passive MENTOR_XP, since the bond is deliberate. */
const MENTOR_BOND_XP = 14;
/** 名師高徒 — canonical (historical) master/student teaching, between the
 *  deliberate 拜師 bond (14) and the generic 名將帶新兵 trickle (8). */
const MENTOR_CANON_XP = 10;
/** Per-season chance a disciple inherits one of the master's abilities. Low, so
 *  衣缽相傳 takes years of shared service rather than a season. */
const MENTOR_INHERIT_CHANCE = 0.08;

type Inheritance = { kind: 'skill' | 'tactic' | 'formation'; id: string; label: { zh: string; en: string } };

/** The strongest of an officer's five stats (ties resolve to the earlier key). */
function topStat(o: Officer): keyof OfficerStats {
  return (Object.keys(o.stats) as Array<keyof OfficerStats>)
    .reduce((b, k) => (o.stats[k] > o.stats[b] ? k : b), 'war' as keyof OfficerStats);
}

/** One ability the master has and the disciple lacks (skill / 戰法 / 陣形), or null. */
function pickInheritance(master: Officer, pupil: Officer, rng: () => number): Inheritance | null {
  const cands: Inheritance[] = [];
  for (const id of master.skills) {
    if (!pupil.skills.includes(id)) {
      const def = SKILLS_BY_ID[id];
      if (def) cands.push({ kind: 'skill', id, label: { zh: def.name.zh, en: def.name.en } });
    }
  }
  for (const id of master.tactics ?? []) {
    if (!(pupil.tactics ?? []).includes(id)) {
      const def = TACTIC_DEFS[id];
      if (def) cands.push({ kind: 'tactic', id, label: def });
    }
  }
  for (const id of master.formations ?? []) {
    if (!(pupil.formations ?? []).includes(id)) {
      const def = FORMATION_DEFS[id];
      if (def) cands.push({ kind: 'formation', id, label: def });
    }
  }
  if (cands.length === 0) return null;
  return cands[Math.floor(rng() * cands.length)];
}

function applyInheritance(pupil: Officer, inh: Inheritance): Officer {
  if (inh.kind === 'skill') return { ...pupil, skills: [...pupil.skills, inh.id] };
  if (inh.kind === 'tactic') return { ...pupil, tactics: [...(pupil.tactics ?? []), inh.id] as unknown as Officer['tactics'] };
  return { ...pupil, formations: [...(pupil.formations ?? []), inh.id] as unknown as Officer['formations'] };
}

/**
 * Tick every explicit 拜師 bond: for each disciple whose master is alive and
 * teaching from the same city, grant the richer mentor XP (steered toward the
 * master's strongest suit) and roll the slow 衣缽相傳 inheritance. Returns the
 * updated officers, report entries, and the set of disciple ids that got the
 * bond XP (so the caller's passive loop can skip them — no double-dipping).
 */
export function tickMentorBonds(
  officers: Record<EntityId, Officer>,
  rng: () => number = Math.random,
  /** 名師高徒 — canonical 師徒 lookup (relationshipEffects.mentorsOf). When
   *  given, a historical master serving alongside their historical student
   *  teaches automatically — no explicit 拜師 needed — at a strength between
   *  the deliberate bond and the generic 名將帶新兵 trickle. */
  canonicalMentorsOf?: (id: EntityId) => EntityId[],
): { officers: Record<EntityId, Officer>; entries: ReportEntry[]; bonded: Set<EntityId> } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
  const bonded = new Set<EntityId>();
  const inService = (m: Officer | undefined): m is Officer =>
    !!m && m.status !== 'dead' && m.status !== 'imprisoned' && m.status !== 'unsearched' && m.status !== 'retired';
  for (const st of Object.values(out)) {
    if (!st.mentorId) continue;
    if (st.status !== 'idle' && st.status !== 'active') continue;
    const master = out[st.mentorId];
    if (!master) continue;
    if (!inService(master)) continue;
    if (master.locationCityId == null || master.locationCityId !== st.locationCityId) continue;
    if (master.forceId == null || master.forceId !== st.forceId) continue;
    bonded.add(st.id);
    // 傳其所長 — the disciple grows toward whatever the master is best at.
    const r = grantXp(out[st.id], MENTOR_BOND_XP, rng, topStat(master));
    let pupil = r.officer;
    entries.push(...r.entries);
    // 衣缽相傳 — a slow chance to inherit one of the master's abilities.
    if (rng() < MENTOR_INHERIT_CHANCE) {
      const inh = pickInheritance(master, pupil, rng);
      if (inh) {
        pupil = applyInheritance(pupil, inh);
        entries.push({
          cityId: pupil.locationCityId, kind: 'talent',
          text: `${pupil.name.en} received the mantle of master ${master.name.en} — learned ${inh.label.en}.`,
          textZh: `${pupil.name.zh}承${master.name.zh}之衣缽,習得「${inh.label.zh}」。`,
        });
      }
    }
    out[st.id] = pupil;
  }
  // 名師高徒 — canonical master/student pairs teach automatically when serving
  // together (one canonical master per student; skip those already fed by an
  // explicit bond above so there is no double-dip).
  if (canonicalMentorsOf) {
    for (const st of Object.values(out)) {
      if (bonded.has(st.id)) continue;
      if (st.status !== 'idle' && st.status !== 'active') continue;
      if (st.forceId == null || st.locationCityId == null) continue;
      const master = canonicalMentorsOf(st.id)
        .map((mid) => out[mid])
        .find((m) => inService(m) && m.forceId === st.forceId && m.locationCityId === st.locationCityId);
      if (!master) continue;
      bonded.add(st.id);
      const r = grantXp(out[st.id], MENTOR_CANON_XP, rng, topStat(master));
      let pupil = r.officer;
      entries.push(...r.entries);
      if (rng() < MENTOR_INHERIT_CHANCE / 2) {
        const inh = pickInheritance(master, pupil, rng);
        if (inh) {
          pupil = applyInheritance(pupil, inh);
          entries.push({
            cityId: pupil.locationCityId, kind: 'talent',
            text: `${pupil.name.en} studied under ${master.name.en} — learned ${inh.label.en}.`,
            textZh: `${pupil.name.zh}從學於${master.name.zh},習得「${inh.label.zh}」。`,
          });
        }
      }
      out[st.id] = pupil;
    }
  }
  return { officers: out, entries, bonded };
}

/**
 * 繼承遺志 — when a master dies, each living disciple present in their force
 * channels the loss into resolve: a one-time lift to the stat the master was
 * strongest in (within latent), a loyalty steadying, and their bond is cleared.
 * Pure — the caller (aging) supplies the dead master and the officer pool.
 */
export function inheritLegacyOnDeath(
  master: Officer,
  officers: Record<EntityId, Officer>,
): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
  const k = topStat(master);
  for (const st of Object.values(out)) {
    if (st.mentorId !== master.id) continue;
    if (st.status === 'dead' || st.status === 'unsearched') continue;
    const latent = st.latentStats ?? defaultLatent(st.stats);
    const grown = Math.min(latent[k], st.stats[k] + 2);
    // 衣鉢相傳 — the disciple also receives one skill the master knew but they
    // did not, so a teacher's art outlives them. (Deterministic: first such.)
    const heirSkill = (master.skills ?? []).find((sid) => !(st.skills ?? []).includes(sid));
    const next: Officer = {
      ...st,
      stats: { ...st.stats, [k]: grown },
      loyalty: Math.min(100, st.loyalty + 3),
      ...(heirSkill ? { skills: [...(st.skills ?? []), heirSkill] } : {}),
    };
    delete next.mentorId; // the bond ends with the master
    out[st.id] = next;
    const skillDef = heirSkill ? SKILLS_BY_ID[heirSkill] : null;
    const skillTailZh = skillDef ? `,並承師技「${skillDef.name.zh}」` : '';
    const skillTailEn = skillDef ? `, and inherits the art ${skillDef.name.en}` : '';
    entries.push({
      cityId: st.locationCityId, kind: 'talent',
      text: `${st.name.en} inherits the will of fallen master ${master.name.en} — ${STAT_NAME_ZH[k]} +${grown - st.stats[k]}${skillTailEn}.`,
      textZh: `${st.name.zh}繼${master.name.zh}之遺志,化悲憤為力,${STAT_NAME_ZH[k]}+${grown - st.stats[k]}${skillTailZh}。`,
    });
  }
  return { officers: out, entries };
}

// ─── 特訓 / 試煉 — a player-driven season of focused growth, with risk ──────────
// Unlike the passive XP trickle, 特訓 spends a whole season (and gold) to push one
// officer hard along a chosen track. Bigger XP than civic work, plus real chances
// at a skill / 性格 / a latent bump — but the martial tracks (演武/狩獵) carry a
// 養傷 risk, so it isn't free power.

export interface TrainingMode {
  id: string;
  zh: string; en: string;
  /** Primary (and optional secondary) 圍 the drill exercises. */
  stat: keyof OfficerStats;
  stat2?: keyof OfficerStats;
  xp: number;
  skillChance: number;
  traitChance: number;
  /** Chance to deepen the primary stat's latent ceiling (+1, within STAT_CAP). */
  latentChance: number;
  /** Chance the drill leaves a 養傷 wound (martial tracks only). */
  injuryChance: number;
}

export const TRAINING_MODES: TrainingMode[] = [
  { id: 'seclusion', zh: '閉關',  en: 'Seclusion',     stat: 'intelligence',                    xp: 60, skillChance: 0.25, traitChance: 0.10, latentChance: 0.14, injuryChance: 0 },
  { id: 'sparring',  zh: '演武',  en: 'Sparring',      stat: 'war',          stat2: 'leadership', xp: 58, skillChance: 0.22, traitChance: 0.08, latentChance: 0.12, injuryChance: 0.25 },
  { id: 'travel',    zh: '遊學',  en: 'Travel Study',  stat: 'charisma',     stat2: 'intelligence', xp: 54, skillChance: 0.30, traitChance: 0.12, latentChance: 0.10, injuryChance: 0.04 },
  { id: 'hunt',      zh: '狩獵',  en: 'Hunt',          stat: 'war',          stat2: 'leadership', xp: 52, skillChance: 0.18, traitChance: 0.10, latentChance: 0.10, injuryChance: 0.18 },
  { id: 'discourse', zh: '論道',  en: 'Discourse',     stat: 'intelligence', stat2: 'politics',   xp: 56, skillChance: 0.20, traitChance: 0.20, latentChance: 0.12, injuryChance: 0 },
];
const TRAINING_MODES_BY_ID: Record<string, TrainingMode> = Object.fromEntries(TRAINING_MODES.map((m) => [m.id, m]));

/** Choose a drill: honour the officer's 練兵 focus, else play to their strongest
 *  suit, else a roll for variety. */
function pickTrainingMode(officer: Officer, rng: () => number): TrainingMode {
  const want = officer.trainingFocus ?? topStat(officer);
  const fits = TRAINING_MODES.filter((m) => m.stat === want || m.stat2 === want);
  const pool = fits.length > 0 ? fits : TRAINING_MODES;
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Run one season of 特訓 for an officer. Pure (save for the injected rng): returns
 * the grown officer (XP applied, possibly a new skill / trait / latent / 養傷) and
 * the report entries. `forceMode` pins the drill (UI choice); otherwise it's
 * picked from the officer's focus.
 */
export function specialTraining(
  officer: Officer,
  rng: () => number = Math.random,
  year?: number,
  forceMode?: string,
): { officer: Officer; entries: ReportEntry[] } {
  const mode = (forceMode && TRAINING_MODES_BY_ID[forceMode]) || pickTrainingMode(officer, rng);
  const favored = mode.stat2 ? [mode.stat, mode.stat2] : mode.stat;
  const res = grantXp(officer, mode.xp, rng, favored, { year });
  let o = res.officer;
  const entries: ReportEntry[] = [{
    cityId: o.locationCityId, kind: 'note',
    text: `${officer.name.en} undertook ${mode.en} (特訓), drilling hard for a season.`,
    textZh: `${officer.name.zh}行「${mode.zh}」特訓,苦練一季。`,
  }, ...res.entries];

  // A fitting skill.
  if (rng() < mode.skillChance) {
    const learned = pickLearnableSkill(o.stats, o.skills, rng);
    if (learned) {
      o = { ...o, skills: [...o.skills, learned.id] };
      entries.push({
        cityId: o.locationCityId, kind: 'talent',
        text: `${o.name.en} learned the ${learned.name.en} (${learned.name.zh}) skill in training.`,
        textZh: `${o.name.zh}於特訓中習得「${learned.name.zh}」之技。`,
      });
    }
  }
  // A 性格 forged by the regimen.
  if (rng() < mode.traitChance) {
    const gained = rollLevelUpTrait(o, totalLevel(o.xp ?? 0) + 1, rng);
    if (gained && !(o.traits as string[] | undefined ?? []).includes(gained)) {
      o = { ...o, traits: [...((o.traits as string[] | undefined) ?? []), gained] as Officer['traits'] };
      const def = TRAIT_DEFS_BY_ID[gained];
      entries.push({
        cityId: o.locationCityId, kind: 'talent',
        text: `${o.name.en} hardened into the ${def?.name.en ?? gained} trait through training.`,
        textZh: `${o.name.zh}於特訓中磨出「${def?.name.zh ?? gained}」之性。`,
      });
    }
  }
  // A breakthrough in potential — lift the primary stat's latent ceiling.
  if (rng() < mode.latentChance) {
    const latent = { ...(o.latentStats ?? defaultLatent(o.stats)) };
    if (latent[mode.stat] < STAT_CAP) {
      latent[mode.stat] = Math.min(STAT_CAP, latent[mode.stat] + 1);
      o = { ...o, latentStats: latent };
      entries.push({
        cityId: o.locationCityId, kind: 'talent',
        text: `${o.name.en}'s ${STAT_NAME_ZH[mode.stat]} potential deepened through hard training.`,
        textZh: `${o.name.zh}苦訓不輟,${STAT_NAME_ZH[mode.stat]}之資益進。`,
      });
    }
  }
  // The martial tracks can leave a mark.
  if (mode.injuryChance > 0 && rng() < mode.injuryChance) {
    o = withAffliction(o, duelWound(false));
    entries.push({
      cityId: o.locationCityId, kind: 'note',
      text: `${o.name.en} was hurt during ${mode.en} and needs time to recover (養傷).`,
      textZh: `${o.name.zh}於「${mode.zh}」中受了傷,需靜養數季。`,
    });
  }
  return { officer: o, entries };
}

export function defaultLatent(stats: OfficerStats): OfficerStats {
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
  // 年齡軸 / 戰績驅動 — pass the current year (so age shapes the arc) and each
  // officer's deeds (so a knife-fighter hones 武力, a conqueror 統率). Battle XP
  // deliberately carries NO hard favoured stat, so an aging commander can still
  // mature into 智/政 from the field. Both optional + backward-compatible.
  ctx?: { year?: number; deedsById?: Record<EntityId, HeroicDeeds> },
): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const out = { ...officers };
  const entries: ReportEntry[] = [];
  // 指揮歷練 — the officer who led the engagement (first participant) carries the
  // heavier lesson, win or lose.
  const commanderId = participantIds[0];
  for (const id of participantIds) {
    const o = out[id];
    if (!o) continue;
    let amt = 30;
    const won = victorIds.includes(id);
    if (won) amt += 30;
    if (id === commanderId) amt += 20;
    const res = grantXp(o, amt, rng, undefined, { year: ctx?.year, deeds: ctx?.deedsById?.[id] });
    // 戰功威望 — victory earns lasting renown (the commander a little more),
    // which feeds gradeScore toward 晉品. A defeat teaches but earns no glory.
    const renownGain = won ? (id === commanderId ? 3 : 2) : 0;
    out[id] = renownGain ? { ...res.officer, renown: (res.officer.renown ?? 0) + renownGain } : res.officer;
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
  relief: 'charisma',
  search: 'charisma',
  'major-agriculture': 'politics',
  'major-commerce': 'politics',
  'major-defense': 'politics',
  'encourage-migration': 'charisma',
  'upgrade-wall': 'politics',
  'promote-learning': 'intelligence',
  'anti-corruption': 'politics',
  'flood-control': 'politics',
  'military-farming': 'leadership',
  'drill-troops': 'leadership',
  garrison: 'leadership',
  // 特訓 is handled specially (see specialTraining); it never flows through
  // awardInternalAffairsXp, but the Record must list every InternalAffairsType.
  'special-training': 'war',
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
  xpMul = 1,
  // 年齡軸 — pass the current year so an aging clerk's growth still tilts toward
  // 智/政 on top of the command's own favoured 圍. Optional/backward-compatible.
  year?: number,
): { officer: Officer; entries: ReportEntry[] } {
  const base = INTERNAL_AFFAIRS_MAJOR.has(type) ? INTERNAL_AFFAIRS_XP_MAJOR : INTERNAL_AFFAIRS_XP;
  // 書院/太學/武學堂/招賢館 — schooling multiplies the experience the work yields.
  const amount = Math.round((success ? base : Math.max(3, Math.round(base * 0.4))) * xpMul);
  const res = grantXp(officer, amount, rng, INTERNAL_AFFAIRS_FAVORED[type], { year });
  return { officer: res.officer, entries: res.entries };
}
