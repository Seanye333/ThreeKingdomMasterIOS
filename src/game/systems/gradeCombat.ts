import type { Officer } from '../types';
import { officerGrade, gradeRank, type OfficerGrade } from './officerGrade';
import { officerStars, starCombatDelta } from './stars';
import { itemRarity, itemLoreLevel, type Item, type ItemRarity } from '../data/items';
import { isSignaturePair } from '../data/signatureItems';

/**
 * 品階威儀 — the combat passive an officer projects from their 品階. Until now a
 * 金牌/銀牌/銅牌 grade was pure flavour on the roster card; here it earns its keep.
 * A graded commander lifts the whole formation (power + morale), a graded
 * champion strikes harder in 單挑, and a graded orator presses harder in 舌戰.
 * 鐵牌 grants nothing — the tier has to mean something at the top to read as a
 * reward. Numbers are deliberately gentle so grade *tilts* a fight without
 * deciding it on its own (it stacks multiplicatively with traits/威名/items).
 */
export interface GradeCombatBonus {
  /** Multiplier on raw combat power / unit damage from a graded officer. */
  powerMul: number;
  /** Flat morale lent to the formation a graded commander leads (0–100 scale). */
  morale: number;
  /** Flat bonus to a duel roll / static prowess. */
  duelBonus: number;
  /** Flat 氣勢 (composure) a graded orator opens a 舌戰 with — poise, not extra
   *  damage, so it doesn't shorten bouts or suppress the 罵死 mechanic. */
  debatePoise: number;
  /** 氣力 — extra starting stamina a graded champion carries into 單挑, so an
   *  elite simply outlasts a lesser foe even on an even exchange. */
  duelStamina: number;
  /** 威儀 — fraction (0–1) of incoming unit damage a graded commander's
   *  formation shrugs off; a 神品 host is hard to break. */
  damageResist: number;
}

// 品階威儀 — each tier carries a named signature so grade is *felt*, not just a
// roster colour. Numbers stay gentle (grade tilts a fight, traits/威名/items
// still decide it) but the perks now span offence, endurance, and toughness:
//   銅 三流 — 初陣        : a whisper of presence.
//   銀 二流 — 沙場老將    : steadier formation, a touch more 氣力.
//   金 一流 — 萬軍辟易    : the line rallies to them and bends blows aside.
//   白金 超一流 — 不動如山: a host that barely breaks; long-wind in single combat.
//   鑽石 神品 — 萬人敵    : peerless on every axis.
const GRADE_COMBAT: Record<OfficerGrade, GradeCombatBonus> = {
  diamond:  { powerMul: 1.16, morale: 12, duelBonus: 18, debatePoise: 20, duelStamina: 30, damageResist: 0.12 },
  platinum: { powerMul: 1.12, morale: 9,  duelBonus: 14, debatePoise: 16, duelStamina: 22, damageResist: 0.09 },
  gold:     { powerMul: 1.08, morale: 6,  duelBonus: 10, debatePoise: 12, duelStamina: 15, damageResist: 0.06 },
  silver:   { powerMul: 1.04, morale: 3,  duelBonus: 5,  debatePoise: 6,  duelStamina: 8,  damageResist: 0.03 },
  bronze:   { powerMul: 1.01, morale: 1,  duelBonus: 2,  debatePoise: 2,  duelStamina: 3,  damageResist: 0.01 },
  iron:     { powerMul: 1.0,  morale: 0,  duelBonus: 0,  debatePoise: 0,  duelStamina: 0,  damageResist: 0 },
};

/** The combat passive for a single officer, keyed off their current 品階,
 *  amplified by their 星級 (stars.ts) — a 6★ ace projects a touch more of
 *  everything. Folding stars in here wires them into every consumer at once
 *  (strategic aura, tactical damage, 單挑, 舌戰). */
export function gradeCombatBonus(officer: Officer): GradeCombatBonus {
  const base = GRADE_COMBAT[officerGrade(officer).grade];
  const s = officerStars(officer);
  if (s === 0) return base;
  const d = starCombatDelta(s);
  return {
    powerMul: base.powerMul + d.powerMul,
    morale: base.morale + d.morale,
    duelBonus: base.duelBonus + d.duelBonus,
    debatePoise: base.debatePoise + d.debatePoise,
    duelStamina: base.duelStamina + d.duelStamina,
    damageResist: Math.min(0.2, base.damageResist + d.damageResist),
  };
}

export function gradeCombatBonusFor(grade: OfficerGrade): GradeCombatBonus {
  return GRADE_COMBAT[grade];
}

/**
 * Army-wide power aura for a side. The renowned commander sets the tone, so we
 * take the *best* graded officer present rather than averaging — but soften any
 * surplus from a stacked roster so four 金牌 don't run the number away.
 */
export function gradeAuraPowerMul(pool: Array<Officer | undefined | null>): number {
  let best = 1.0;
  let extra = 0;
  for (const o of pool) {
    if (!o) continue;
    const m = gradeCombatBonus(o).powerMul;
    if (m > best) {
      extra += best - 1; // demote the previous best into the "supporting" pile
      best = m;
    } else {
      extra += m - 1;
    }
  }
  // The lead grade applies in full; supporting graded officers add a damped share.
  return best + extra * 0.25;
}

// ─── 兵器駕馭 — 金裝配金將 ──────────────────────────────────────────────────
/** The 品階 an officer wants to fully master gear of a given rarity. */
const RARITY_REQUIRED_GRADE: Record<ItemRarity, OfficerGrade> = {
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
};

/**
 * 兵器駕馭 — how much of an item's stat bonus an officer actually draws out.
 * A 神兵 in unworthy hands is wasted: each 品階 the wielder falls short of the
 * item's rarity shaves 12% off its effect (floored at 64%). Match or exceed the
 * rarity and you get the full bonus — so legendary gear belongs on your elites.
 */
export function itemMasteryMul(officer: Officer, item: Item): number {
  // 神兵共鳴 — 本命神兵 in its rightful hero's hands answers beyond full
  // effect (青龍偃月刀之於關羽), overriding any grade shortfall.
  if (isSignaturePair(officer.id, item.id)) return 1.15;
  const need = gradeRank(RARITY_REQUIRED_GRADE[itemRarity(item)]);
  const have = gradeRank(officerGrade(officer).grade);
  const shortfall = Math.max(0, need - have);
  // 人器合一 — a storied weapon "remembers": its battle-renown gives back up to
  // one full grade-step (+0.12) of the 兵器駕馭 penalty, so a blade long-carried by
  // a lesser hand still tells. Never exceeds full effect.
  const familiarity = Math.min(0.12, itemLoreLevel(item.id) * 0.003);
  return Math.max(0.64, Math.min(1, 1 - 0.12 * shortfall + familiarity));
}

/** Best (highest) morale bonus among a pool's officers — the formation rallies to its finest. */
export function gradeAuraMorale(pool: Array<Officer | undefined | null>): number {
  let best = 0;
  for (const o of pool) {
    if (!o) continue;
    best = Math.max(best, gradeCombatBonus(o).morale);
  }
  return best;
}

// ─── 品階招牌 — discrete signature perks at the top tiers ────────────────────
// Beyond the scaling numbers above, the upper grades carry QUALITATIVE perks so
// crossing a tier reads as an unlock, not mere inflation:
//   金 一流 「萬軍辟易」 — facing this commander shakes the enemy line (−morale).
//   白金 超一流 「不動如山」 — their formation breaks in good order (far fewer rout losses).
//   鑽石 神品 「萬人敵」 — peerless; also opens a 單挑 with a first-strike edge.

/** 萬軍辟易 — flat morale the ENEMY opens a battle down by, from facing this pool's
 *  finest 金牌+ commander (金 −4 / 白金 −6 / 鑽石 −8). 0 if none qualify. */
// 失威 — a disgraced officer (lost a 罵戰/被俘 recently) projects no 招牌 aura until
// they recover their name; all three signature perks check this.
const disgraced = (o: Officer): boolean => (o.disgrace ?? 0) > 0;

export function enemyMoraleShock(pool: Array<Officer | undefined | null>): number {
  let best = 0;
  for (const o of pool) {
    if (!o || disgraced(o)) continue;
    const r = gradeRank(officerGrade(o).grade);
    const shock = r >= 5 ? 8 : r >= 4 ? 6 : r >= 3 ? 4 : 0;
    if (shock > best) best = shock;
  }
  return best;
}

/** 不動如山 — true if the pool's best (non-disgraced) officer is 白金+; their line
 *  breaks in good order, so a rout costs far fewer extra casualties. */
export function holdsTheLine(pool: Array<Officer | undefined | null>): boolean {
  for (const o of pool) {
    if (o && !disgraced(o) && gradeRank(officerGrade(o).grade) >= 4) return true;
  }
  return false;
}

/** 萬人敵 — the first-round 單挑 edge a 鑽石 champion presses (先手氣勢); none while disgraced. */
export function duelFirstStrike(officer: Officer): number {
  return !disgraced(officer) && gradeRank(officerGrade(officer).grade) >= 5 ? 8 : 0;
}
