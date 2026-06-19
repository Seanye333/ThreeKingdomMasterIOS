import type {
  EntityId,
  FamilyRelation,
  GameDate,
  Officer,
  PendingHeir,
  ReportEntry,
} from '../types';
import { STAT_CAP } from './growth';

/**
 * Family system: married officers may produce a child each year (rolls each
 * spring). When a pending heir reaches age 14, they activate as a new officer
 * in their parent's force.
 *
 * Parent inheritance: child stats are average(parent stats) ± up to 8 random
 * variation; latent stats follow the higher parent.
 */

const COMING_OF_AGE = 14;

const FIRST_NAMES_M_ZH = ['偉', '昭', '武', '誠', '安', '允', '寧', '猛', '彦', '徳', '景', '思', '勇', '楓', '玄', '弘', '欣', '謙'];
const FIRST_NAMES_F_ZH = ['霊', '雯', '麗', '蘭', '芳', '蓮', '玉', '珺', '清', '婉', '彤', '婷', '宛', '艶'];
const FIRST_NAMES_M_EN = ['Wei', 'Zhao', 'Wu', 'Cheng', 'An', 'Yun', 'Ning', 'Meng', 'Yan', 'De', 'Jing', 'Si', 'Yong', 'Feng', 'Xuan', 'Hong', 'Xin', 'Qian'];
const FIRST_NAMES_F_EN = ['Ling', 'Wen', 'Li', 'Lan', 'Fang', 'Lian', 'Yu', 'Jun', 'Qing', 'Wan', 'Tong', 'Ting', 'Wan', 'Yan'];

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
 * Per-year family tick: process births (spring only) and activations.
 */
export function tickFamily(ctx: FamilyTickContext): FamilyTickOutput {
  const officers = { ...ctx.officers };
  const family = [...ctx.family];
  let pendingHeirs = [...ctx.pendingHeirs];
  const entries: ReportEntry[] = [];

  // Activations.
  pendingHeirs = pendingHeirs.filter((h) => {
    const age = ctx.date.year - h.birthYear;
    if (age < COMING_OF_AGE) return true;
    // Activate as a new officer in parent A's force.
    const parent = officers[h.parentAId] ?? officers[h.parentBId];
    if (!parent) return false; // both parents gone — drop
    const newOfficer: Officer = {
      id: h.id,
      name: h.name,
      birthYear: h.birthYear,
      stats: h.baseStats,
      loyalty: 95,
      locationCityId: parent.locationCityId,
      forceId: parent.forceId,
      status: 'idle',
      task: null,
      equipment: [],
      skills: [],
      rank: 'soldier',
      xp: 0,
      female: h.female,
      latentStats: {
        leadership: Math.min(STAT_CAP, h.baseStats.leadership + 25),
        war: Math.min(STAT_CAP, h.baseStats.war + 25),
        intelligence: Math.min(STAT_CAP, h.baseStats.intelligence + 25),
        politics: Math.min(STAT_CAP, h.baseStats.politics + 25),
        charisma: Math.min(STAT_CAP, h.baseStats.charisma + 25),
      },
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

  // Births: spring only.
  if (ctx.date.season === 'spring') {
    const spouses = family.filter((r) => r.kind === 'spouse');
    for (const m of spouses) {
      const a = officers[m.officerA];
      const b = officers[m.officerB];
      if (!a || !b) continue;
      if (a.status === 'dead' || b.status === 'dead') continue;
      const ageA = ctx.date.year - a.birthYear;
      const ageB = ctx.date.year - b.birthYear;
      // Only fertile if both parents are 16–45 in the woman's case;
      // assume one of them is female if marked or if charisma is high.
      const motherAge = a.female ? ageA : b.female ? ageB : Math.min(ageA, ageB);
      if (motherAge < 16 || motherAge > 45) continue;
      if (ctx.rng() < 0.18) {
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
        pendingHeirs.push({
          id,
          parentAId: a.id,
          parentBId: b.id,
          birthYear: ctx.date.year,
          baseStats: stats,
          name: { zh: surname + firstZh, en: `${surnameEn} ${firstEn}` },
          female,
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

function rollStat(a: number, b: number, rng: () => number): number {
  // Slight chance for a child to exceed either parent's stat (legendary heir).
  const mid = (a + b) / 2;
  const noise = (rng() - 0.5) * 16;
  let v = mid + noise;
  // 5% chance of a "prodigy" roll: +10 to +30
  if (rng() < 0.05) v += 10 + rng() * 20;
  return Math.max(20, Math.min(STAT_CAP, Math.round(v)));
}

export function addSpouse(family: FamilyRelation[], a: EntityId, b: EntityId): FamilyRelation[] {
  if (family.some((r) => r.kind === 'spouse' && ((r.officerA === a && r.officerB === b) || (r.officerA === b && r.officerB === a)))) {
    return family;
  }
  return [...family, { officerA: a, officerB: b, kind: 'spouse' }];
}
