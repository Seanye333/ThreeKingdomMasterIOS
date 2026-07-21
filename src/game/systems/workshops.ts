/**
 * 工官・軍器 (§1.18) — the third thing an army needs, after men and grain.
 *
 * The game has always tracked soldiers and the food to feed them. It has never
 * tracked what they were holding. 鐵 was a trade good and a forging input; a
 * city could recruit twenty thousand men in a province with no smithy and no
 * iron and they arrived fully equipped out of nowhere.
 *
 * 軍器 (`City.armaments`, 0–100) is that stock: how well this city's armoury can
 * kit out the men who muster here. It fills from iron worked by the 匠戶
 * (artisan households) at the 武庫/工官, faster in an iron province and under a
 * heavier levy; it drains as the garrison grows and as gear wears out. What it
 * changes:
 *
 *   — 徵兵 with an empty armoury yields far fewer usable soldiers (無甲不成軍);
 *   — a well-stocked armoury stiffens the city in a siege and drills better;
 *   — and it gives 鐵 — until now a forging currency and a trade good — a
 *     standing military purpose, so an iron province is worth holding for what
 *     it arms rather than what it sells.
 *
 * The 督造軍器 command is the deliberate version: spend coin and iron, get a
 * jump. Pure functions; resolution.ts drifts it and commands.ts spends it.
 */

export const ARM_CEILING = 100;
/** Iron consumed per point of 軍器 raised. */
export const IRON_PER_ARM_POINT = 14;
/** Below this the season report says something about it. */
export const ARM_LOW = 30;

export interface ArmamentEffects {
  /** Multiplier on the city's effective defence in a siege. */
  defenseMul: number;
  /** Multiplier on 徵兵 yield — 無甲不成軍. */
  recruitMul: number;
  /** Per-season drift added to the garrison's 練度. */
  drillDelta: number;
  badgeZh: string;
  badgeEn: string;
}

export function armamentEffects(armaments: number | undefined): ArmamentEffects {
  const a = Math.max(0, Math.min(ARM_CEILING, armaments ?? 0));
  // 50 is the neutral point: everything above is a bonus, below a penalty.
  const t = (a - 50) / 50; // −1 … +1
  const defenseMul = 1 + t * (t >= 0 ? 0.08 : 0.12);
  const recruitMul = 1 + t * (t >= 0 ? 0.12 : 0.22);
  const drillDelta = a >= 75 ? 1 : a < ARM_LOW ? -1 : 0;
  return {
    defenseMul: Math.round(defenseMul * 1000) / 1000,
    recruitMul: Math.round(recruitMul * 1000) / 1000,
    drillDelta,
    badgeZh: a >= 75 ? '甲堅兵利 — 守城 +8%,徵兵 +12%,練度漸長'
      : a < ARM_LOW ? '無甲不成軍 — 守城 −12%,徵兵 −22%,練度漸弛'
        : '軍器堪用',
    badgeEn: a >= 75 ? 'Well armed — defence +8%, recruits +12%, drill climbs'
      : a < ARM_LOW ? 'Ill armed — defence −12%, recruits −22%, drill slips'
        : 'Adequately armed',
  };
}

export function armamentTier(armaments: number | undefined): { zh: string; en: string } {
  const a = armaments ?? 0;
  if (a >= 80) return { zh: '甲堅兵利', en: 'Well Armed' };
  if (a >= 50) return { zh: '軍器足用', en: 'Adequate' };
  if (a >= ARM_LOW) return { zh: '器械不齊', en: 'Short of Arms' };
  return { zh: '無甲不成軍', en: 'Ill Armed' };
}

/**
 * What this city's workshops can *sustain* — the ceiling its own 匠戶 and works
 * hold it at. Without an armoury, a modest militia level; with a full 武庫 in an
 * iron province under a capable administrator, near the top.
 */
export function armamentCapacity(args: {
  arsenalLevel?: number;
  ironProducer?: boolean;
  politics?: number;
  population?: number;
}): number {
  const cap = 26
    + (args.arsenalLevel ?? 0) * 13
    + (args.ironProducer ? 12 : 0)
    + Math.min(12, (args.politics ?? 0) / 8)
    + Math.min(10, (args.population ?? 0) / 40000);
  return Math.max(0, Math.min(ARM_CEILING, Math.round(cap)));
}

export interface ArmamentTick {
  armaments: number;
  /** Iron drawn from the city's stockpile this season. */
  ironUsed: number;
}

/**
 * Move the armoury one season. Production is limited by three separate things —
 * the artisans' hands, the iron in the yard, and the ceiling the works sustain —
 * and set against the wear of arming a growing garrison.
 */
export function armamentsTick(args: {
  current?: number;
  iron?: number;
  troops: number;
  population?: number;
  arsenalLevel?: number;
  ironProducer?: boolean;
  /** 徭役 — more hands pressed into the workshops (息役/薄役/重役). */
  corvee?: string;
  politics?: number;
}): ArmamentTick {
  const current = Math.max(0, Math.min(ARM_CEILING, args.current ?? 0));
  const capacity = armamentCapacity(args);
  // 匠戶之力 — how many points of gear the workshops can turn out at all.
  const hands = 1.4 + (args.arsenalLevel ?? 0) * 1.6
    + (args.corvee === 'heavy' ? 1.2 : args.corvee === 'light' ? 0.5 : 0);
  // 甲胄之耗 — a garrison to keep armed, and iron that rusts.
  const wear = 0.6 + args.troops / 9000;
  const room = Math.max(0, capacity - current);
  const wanted = Math.min(hands, room + wear);
  const ironHave = Math.max(0, args.iron ?? 0);
  const affordable = ironHave / IRON_PER_ARM_POINT;
  const made = Math.max(0, Math.min(wanted, affordable));
  const next = Math.max(0, Math.min(ARM_CEILING, current + made - wear));
  return {
    armaments: Math.round(next * 10) / 10,
    ironUsed: Math.round(made * IRON_PER_ARM_POINT),
  };
}

/**
 * 督造軍器 — put the workshops on a war footing for a season. Coin buys the
 * charcoal, the hands and the overtime; iron is still the hard constraint.
 */
export function armWorksResult(args: {
  armaments?: number;
  iron?: number;
  politics: number;
  arsenalLevel?: number;
}): { gained: number; ironUsed: number } {
  const room = Math.max(0, ARM_CEILING - (args.armaments ?? 0));
  const byHand = 6 + args.politics / 9 + (args.arsenalLevel ?? 0) * 2.5;
  const byIron = Math.max(0, args.iron ?? 0) / IRON_PER_ARM_POINT;
  const gained = Math.round(Math.min(room, byHand, byIron) * 10) / 10;
  return { gained, ironUsed: Math.round(gained * IRON_PER_ARM_POINT) };
}
