import type {
  EntityId,
  FamilyRelation,
  GameDate,
  MilitaryRankId,
  Officer,
  OfficerStats,
  PendingHeir,
  ReportEntry,
} from '../types';
import type { PersonalityTrait } from '../types/personality';
import { STAT_CAP, ageGrowthBias } from './growth';
import { effectiveStats, isWiredTrait, maritalCompatibility } from './traitEffects';
import { TRAIT_DEFS } from '../data/personality';
import { gradeScore } from './officerGrade';
import { clanOf } from '../data/clans';
import { peerageTier } from '../data/peerage';

/**
 * Family system. Married officers in the same force may produce a child each
 * year (rolls each spring, modified by marital harmony). A child inherits stats
 * AND traits from its parents, and can be raised by a 西席/家學 tutor before it
 * comes of age (教養), nudging its growth. At age 14 it活躍 as a new officer in
 * its parent's force, joining the family 家門 (clan), inheriting one parent
 * skill and a 蔭補 starting rank befitting the parent's standing. See §2.5.
 */

const COMING_OF_AGE = 14;
/** Upbringing starts once a child is old enough to be schooled. */
const UPBRINGING_FROM = 5;

// ── Balance constants ─────────────────────────────────────────────────────────
/** Base per-spring birth chance for an eligible couple. */
const BIRTH_CHANCE = 0.18;
/** Birth-chance multipliers by marital compatibility. */
const HARMONY_MUL = 1.3;
const DISCORD_MUL = 0.7;
/** Each schooled year nudges the favored stat by this much (folded in at 出仕). */
const UPBRINGING_NUDGE = 2;
/** Per-schooled-year chance the child surfaces as a 神童 (extra latent). */
const PRODIGY_REVEAL_CHANCE = 0.03;
/** Per-schooled-year chance the child picks up a trait from its tutor. */
const TUTOR_TRAIT_CHANCE = 0.06;
/** Extra latent granted to a child revealed as a 神童 during upbringing. */
const PRODIGY_LATENT = 15;
/** Standard latent runway over base stats for an heir. */
const HEIR_LATENT = 25;

const FIRST_NAMES_M_ZH = ['偉', '昭', '武', '誠', '安', '允', '寧', '猛', '彦', '徳', '景', '思', '勇', '楓', '玄', '弘', '欣', '謙'];
const FIRST_NAMES_F_ZH = ['霊', '雯', '麗', '蘭', '芳', '蓮', '玉', '珺', '清', '婉', '彤', '婷', '宛', '艶'];
const FIRST_NAMES_M_EN = ['Wei', 'Zhao', 'Wu', 'Cheng', 'An', 'Yun', 'Ning', 'Meng', 'Yan', 'De', 'Jing', 'Si', 'Yong', 'Feng', 'Xuan', 'Hong', 'Xin', 'Qian'];
const FIRST_NAMES_F_EN = ['Ling', 'Wen', 'Li', 'Lan', 'Fang', 'Lian', 'Yu', 'Jun', 'Qing', 'Wan', 'Tong', 'Ting', 'Wan', 'Yan'];

/** Wired, non-legendary traits a child can inherit/learn (mirrors officerGen). */
const INHERITABLE_TRAIT_DEFS = TRAIT_DEFS.filter((d) => isWiredTrait(d.id) && d.tier !== 'legendary');
const INHERITABLE_TRAIT_IDS = new Set(INHERITABLE_TRAIT_DEFS.map((d) => d.id));

const STAT_KEYS: Array<keyof OfficerStats> = ['leadership', 'war', 'intelligence', 'politics', 'charisma'];

export interface FamilyTickContext {
  date: GameDate;
  officers: Record<EntityId, Officer>;
  family: FamilyRelation[];
  pendingHeirs: PendingHeir[];
  rng: () => number;
}

export interface FamilyTickOutput {
  officers: Record<EntityId, Officer>;
  family: FamilyRelation[];
  pendingHeirs: PendingHeir[];
  entries: ReportEntry[];
}

/**
 * Per-year family tick: activations, upbringing (spring), and births (spring).
 */
export function tickFamily(ctx: FamilyTickContext): FamilyTickOutput {
  const officers = { ...ctx.officers };
  const family = [...ctx.family];
  let pendingHeirs = [...ctx.pendingHeirs];
  const entries: ReportEntry[] = [];

  // 1. Activations — a child reaches age 14 and enters service.
  pendingHeirs = pendingHeirs.filter((h) => {
    const age = ctx.date.year - h.birthYear;
    if (age < COMING_OF_AGE) return true;
    const parentA = officers[h.parentAId];
    const parentB = officers[h.parentBId];
    const parent = parentA ?? parentB;
    if (!parent) return false; // both parents gone — the line lapses

    // Fold upbringing into the starting stats, then build the latent ceiling.
    const stats = h.upbringing ? addStats(h.baseStats, h.upbringing.statBias) : h.baseStats;
    const latentBonus = HEIR_LATENT + (h.upbringing?.prodigyRevealed ? PRODIGY_LATENT : 0);
    const latentStats: OfficerStats = {
      leadership: Math.min(STAT_CAP, stats.leadership + latentBonus),
      war: Math.min(STAT_CAP, stats.war + latentBonus),
      intelligence: Math.min(STAT_CAP, stats.intelligence + latentBonus),
      politics: Math.min(STAT_CAP, stats.politics + latentBonus),
      charisma: Math.min(STAT_CAP, stats.charisma + latentBonus),
    };

    // 衣鉢 — the heir carries on one of its parents' arts.
    const inheritedSkill = (parentA?.skills ?? [])[0] ?? (parentB?.skills ?? [])[0];
    // 蔭補 — a distinguished parent's child enters above the common soldier.
    const { rank, renown } = shadowRankFor(parent);

    // 家門 — join the patriline's clan; if it has none, the parent founds a house.
    const father = parentA && !parentA.female ? parentA : parentB && !parentB.female ? parentB : parent;
    let clanId = clanOf(father) ?? clanOf(parentA) ?? clanOf(parentB) ?? undefined;
    if (!clanId) {
      clanId = `house-${father.id}`;
      officers[father.id] = { ...officers[father.id], clanId };
    }

    const newOfficer: Officer = {
      id: h.id,
      name: h.name,
      birthYear: h.birthYear,
      stats,
      loyalty: 95,
      locationCityId: parent.locationCityId,
      forceId: parent.forceId,
      status: 'idle',
      task: null,
      equipment: [],
      skills: inheritedSkill ? [inheritedSkill] : [],
      rank,
      xp: 0,
      female: h.female,
      latentStats,
      clanId,
      ...(renown > 0 ? { renown } : {}),
      ...(h.designatedHeir ? { designatedHeir: true } : {}),
      ...(h.traits && h.traits.length > 0 ? { traits: [...h.traits] } : {}),
    };
    officers[h.id] = newOfficer;
    family.push({ officerA: h.id, officerB: h.parentAId, kind: 'parent-child' });
    family.push({ officerA: h.id, officerB: h.parentBId, kind: 'parent-child' });
    entries.push({
      cityId: parent.locationCityId,
      kind: 'talent',
      text: `${h.name.en} (${h.name.zh}), child of ${officers[h.parentAId]?.name.en ?? '?'}, has come of age and enters service.`,
      textZh: `${officers[h.parentAId]?.name.zh ?? '?'}之子嗣${h.name.zh}已及冠，今入仕效力。`,
    });
    return false;
  });

  // 2. Upbringing — spring only; raise children aged 5–13 toward their tutor.
  if (ctx.date.season === 'spring') {
    pendingHeirs = pendingHeirs.map((h) => applyUpbringing(h, officers, ctx.date.year, ctx.rng));
  }

  // 3. Births — spring only.
  if (ctx.date.season === 'spring') {
    const spouses = family.filter((r) => r.kind === 'spouse');
    for (const m of spouses) {
      const a = officers[m.officerA];
      const b = officers[m.officerB];
      if (!a || !b) continue;
      if (a.status === 'dead' || b.status === 'dead') continue;
      // 同籍 — a couple split across realms (e.g. a 聯姻 marriage) doesn't breed.
      if (a.forceId !== b.forceId) continue;
      const ageA = ctx.date.year - a.birthYear;
      const ageB = ctx.date.year - b.birthYear;
      const motherAge = a.female ? ageA : b.female ? ageB : Math.min(ageA, ageB);
      if (motherAge < 16 || motherAge > 45) continue;
      if (ctx.rng() < birthChanceFor(a, b)) {
        const id = `heir-${a.id}-${b.id}-${ctx.date.year}`;
        if (pendingHeirs.some((h) => h.id === id)) continue;
        const female = ctx.rng() < 0.5;
        const father = a.female ? b : a;
        const mother = a.female ? a : b;
        const surname = father.name.zh.charAt(0);
        const surnameEn = father.name.en.split(' ')[0];
        const firstZh = female
          ? FIRST_NAMES_F_ZH[Math.floor(ctx.rng() * FIRST_NAMES_F_ZH.length)]
          : FIRST_NAMES_M_ZH[Math.floor(ctx.rng() * FIRST_NAMES_M_ZH.length)];
        const firstEn = female
          ? FIRST_NAMES_F_EN[Math.floor(ctx.rng() * FIRST_NAMES_F_EN.length)]
          : FIRST_NAMES_M_EN[Math.floor(ctx.rng() * FIRST_NAMES_M_EN.length)];
        const stats = {
          leadership: rollStat(a.stats.leadership, b.stats.leadership, ctx.rng),
          war: rollStat(a.stats.war, b.stats.war, ctx.rng),
          intelligence: rollStat(a.stats.intelligence, b.stats.intelligence, ctx.rng),
          politics: rollStat(a.stats.politics, b.stats.politics, ctx.rng),
          charisma: rollStat(a.stats.charisma, b.stats.charisma, ctx.rng),
        };
        const traits = rollHeirTraits(father, mother, ctx.rng);
        pendingHeirs.push({
          id,
          parentAId: a.id,
          parentBId: b.id,
          birthYear: ctx.date.year,
          baseStats: stats,
          name: { zh: surname + firstZh, en: `${surnameEn} ${firstEn}` },
          female,
          ...(traits.length > 0 ? { traits } : {}),
        });
        entries.push({
          cityId: mother.locationCityId,
          kind: 'talent',
          text: `${a.name.en} and ${b.name.en} welcome a child, ${surnameEn} ${firstEn}.`,
          textZh: `${a.name.zh}與${b.name.zh}喜得子嗣${surname}${firstZh}。`,
        });
      }
    }
  }

  return { officers, family, pendingHeirs, entries };
}

/** Per-spring birth chance, modified by the couple's 和睦 (marital harmony). */
export function birthChanceFor(a: Officer, b: Officer): number {
  const compat = maritalCompatibility(a, b);
  const mul = compat === 'harmonious' ? HARMONY_MUL : compat === 'discordant' ? DISCORD_MUL : 1;
  return BIRTH_CHANCE * mul;
}

/** 資質遺傳 — roll 0–2 traits for a newborn, weighted toward the parents' own. */
export function rollHeirTraits(father: Officer, mother: Officer, rng: () => number): PersonalityTrait[] {
  const fromParents = [...(father.traits ?? []), ...(mother.traits ?? [])].filter((t) => INHERITABLE_TRAIT_IDS.has(t));
  const out: PersonalityTrait[] = [];
  const roll = rng();
  const count = roll < 0.45 ? 1 : roll < 0.6 ? 2 : 0;
  for (let i = 0; i < count; i++) {
    let pick: PersonalityTrait | undefined;
    // 70% inherit a parent trait if any; else a fresh wired trait.
    if (fromParents.length > 0 && rng() < 0.7) {
      pick = fromParents[Math.floor(rng() * fromParents.length)];
    } else {
      pick = INHERITABLE_TRAIT_DEFS[Math.floor(rng() * INHERITABLE_TRAIT_DEFS.length)].id as PersonalityTrait;
    }
    if (pick && !out.includes(pick)) out.push(pick);
  }
  return out;
}

/** 教養 — one year of upbringing for a child aged 5–13, biased by its tutor. */
export function applyUpbringing(
  heir: PendingHeir,
  officers: Record<EntityId, Officer>,
  year: number,
  rng: () => number,
): PendingHeir {
  const age = year - heir.birthYear;
  if (age < UPBRINGING_FROM || age >= COMING_OF_AGE) return heir;

  const isLive = (o: Officer | undefined): o is Officer => !!o && o.status !== 'dead' && o.status !== 'unsearched';
  const tutor = heir.tutorId ? officers[heir.tutorId] : undefined;
  const mentor = isLive(tutor) ? tutor : isLive(officers[heir.parentAId]) ? officers[heir.parentAId] : isLive(officers[heir.parentBId]) ? officers[heir.parentBId] : undefined;

  const up = heir.upbringing ?? { years: 0, statBias: zeroStats() };
  const statBias = { ...up.statBias };
  let prodigyRevealed = up.prodigyRevealed ?? false;
  const traits = heir.traits ? [...heir.traits] : [];

  if (mentor) {
    // Favor the tutor's strongest suit, leaning on the youth growth axis.
    const es = effectiveStats(mentor);
    const youthBias = new Set(ageGrowthBias(age)); // war / leadership for the young
    const ranked = [...STAT_KEYS].sort((x, y) => (es[y] + (youthBias.has(y) ? 8 : 0)) - (es[x] + (youthBias.has(x) ? 8 : 0)));
    const primary = ranked[0];
    statBias[primary] += UPBRINGING_NUDGE;
    if (rng() < 0.4) statBias[ranked[1]] += 1;

    // 神童 — a chance the schooling surfaces a prodigy.
    if (!prodigyRevealed && rng() < PRODIGY_REVEAL_CHANCE) prodigyRevealed = true;

    // 言傳身教 — a chance to pick up one of the tutor's traits.
    if (traits.length < 3 && rng() < TUTOR_TRAIT_CHANCE) {
      const teach = (mentor.traits ?? []).filter((t) => INHERITABLE_TRAIT_IDS.has(t) && !traits.includes(t));
      if (teach.length > 0) traits.push(teach[Math.floor(rng() * teach.length)]);
    }
  }

  return {
    ...heir,
    upbringing: { years: up.years + 1, statBias, prodigyRevealed },
    ...(traits.length > 0 ? { traits } : {}),
  };
}

/** 蔭補 — a starting rank + renown seed reflecting the parent's standing. */
export function shadowRankFor(parent: Officer): { rank: MilitaryRankId; renown: number } {
  const g = gradeScore(parent);
  const peer = peerageTier(parent.peerageId);
  if (peer >= 6 || g >= 95) return { rank: 'colonel', renown: 8 };
  if (peer >= 3 || g >= 82) return { rank: 'captain', renown: 4 };
  return { rank: 'soldier', renown: 0 };
}

function rollStat(a: number, b: number, rng: () => number): number {
  // Slight chance for a child to exceed either parent's stat (legendary heir).
  const mid = (a + b) / 2;
  const noise = (rng() - 0.5) * 16;
  let v = mid + noise;
  // 5% chance of a "prodigy" roll: +10 to +30
  if (rng() < 0.05) v += 10 + rng() * 20;
  return Math.max(20, Math.min(STAT_CAP, Math.round(v)));
}

function zeroStats(): OfficerStats {
  return { leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 };
}

function addStats(base: OfficerStats, bias: OfficerStats): OfficerStats {
  return {
    leadership: clampStat(base.leadership + bias.leadership),
    war: clampStat(base.war + bias.war),
    intelligence: clampStat(base.intelligence + bias.intelligence),
    politics: clampStat(base.politics + bias.politics),
    charisma: clampStat(base.charisma + bias.charisma),
  };
}

function clampStat(v: number): number {
  return Math.max(20, Math.min(STAT_CAP, Math.round(v)));
}

export function addSpouse(family: FamilyRelation[], a: EntityId, b: EntityId): FamilyRelation[] {
  if (family.some((r) => r.kind === 'spouse' && ((r.officerA === a && r.officerB === b) || (r.officerA === b && r.officerB === a)))) {
    return family;
  }
  return [...family, { officerA: a, officerB: b, kind: 'spouse' }];
}

/** 收養 — add a parent-child bond (adoption). Idempotent. */
export function addParentChild(family: FamilyRelation[], parent: EntityId, child: EntityId): FamilyRelation[] {
  if (family.some((r) => r.kind === 'parent-child' && ((r.officerA === child && r.officerB === parent) || (r.officerA === parent && r.officerB === child)))) {
    return family;
  }
  return [...family, { officerA: child, officerB: parent, kind: 'parent-child' }];
}

// ─── AI 養世家 — AI realms arrange marriages so their lines grow heirs too ─────
/** Per-AI-force annual chance to arrange one marriage among its officers. */
const AI_MARRIAGE_CHANCE = 0.4;

function areKin(aId: EntityId, bId: EntityId, family: FamilyRelation[]): boolean {
  return family.some((r) =>
    (r.officerA === aId && r.officerB === bId) || (r.officerA === bId && r.officerB === aId));
}

export interface AiMarriageContext {
  officers: Record<EntityId, Officer>;
  family: FamilyRelation[];
  playerForceId: EntityId | null;
  year: number;
  rng: () => number;
}

/**
 * Each spring, AI realms may wed two of their unmarried officers so their houses
 * raise heirs over the decades (mirrors the player's 府內結親). Conservative:
 * at most one new union per AI force per year, no incest, partners aged 16–40,
 * opposite sex preferred. Returns the augmented family + report entries.
 */
export function aiArrangeMarriages(ctx: AiMarriageContext): {
  family: FamilyRelation[];
  entries: ReportEntry[];
} {
  const family = [...ctx.family];
  const entries: ReportEntry[] = [];
  const married = new Set<EntityId>();
  for (const r of family) {
    if (r.kind === 'spouse') { married.add(r.officerA); married.add(r.officerB); }
  }

  // Group eligible unmarried officers by AI force.
  const byForce: Record<EntityId, Officer[]> = {};
  for (const o of Object.values(ctx.officers)) {
    if (!o.forceId || o.forceId === ctx.playerForceId) continue;
    if (o.status !== 'idle' && o.status !== 'active') continue;
    if (married.has(o.id)) continue;
    const age = ctx.year - o.birthYear;
    if (age < 16 || age > 40) continue;
    (byForce[o.forceId] ??= []).push(o);
  }

  for (const pool of Object.values(byForce)) {
    if (pool.length < 2) continue;
    if (ctx.rng() >= AI_MARRIAGE_CHANCE) continue;
    // The ablest unmarried officer weds the best available partner.
    pool.sort((a, b) => gradeScore(b) - gradeScore(a));
    const a = pool[0];
    const candidates = pool.slice(1).filter((b) => !areKin(a.id, b.id, family));
    if (candidates.length === 0) continue;
    const opposite = candidates.filter((b) => !!b.female !== !!a.female);
    const partnerPool = opposite.length > 0 ? opposite : candidates;
    partnerPool.sort((x, y) => y.stats.charisma - x.stats.charisma);
    const b = partnerPool[0];
    family.push({ officerA: a.id, officerB: b.id, kind: 'spouse' });
    married.add(a.id); married.add(b.id);
    entries.push({
      cityId: a.locationCityId,
      kind: 'talent',
      text: `${a.name.en} weds ${b.name.en} — a new union to carry on the house.`,
      textZh: `${a.name.zh}與${b.name.zh}結為連理,以延家門。`,
    });
  }

  return { family, entries };
}
