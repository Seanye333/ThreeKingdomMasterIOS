/**
 * 兵制 (§4.8) — where the soldiers come from, and what that costs you.
 *
 * Every army in this game has been raised the same way: 徵兵 draws men out of
 * the population, they eat grain, and that is the whole relationship. The three
 * kingdoms did not agree on any part of that. The single sharpest institutional
 * difference between Wei, Wu and Shu is *how they manned the army*, and it
 * decided what each of them could afford to do with it.
 *
 *   更卒 (levy)      — the Han militia: every household owes service. Cheap,
 *                      universal, resented, and mediocre. The default.
 *   世兵 (hereditary) — 士家制, Wei's answer: military households, hereditary,
 *                      farming their own land between campaigns. They cost
 *                      almost nothing to keep and they do not run — but they are
 *                      a closed pool (a levy can only be as big as the caste),
 *                      and the caste is subtracted from your taxpayers forever.
 *   募兵 (paid)       — hire them. Money finds men in a way conscription never
 *                      does: drifters, 流民, other people's deserters. They
 *                      drill well and the countryside barely notices the levy.
 *                      They are also paid every season, and an army that is not
 *                      paid does not stay.
 *
 * The interesting failure is 募兵 in a war that outlasts the treasury: pay
 * arrears turn straight into desertion, which is exactly how it went. Pure
 * functions; resolution.ts pays the wages and commands.ts raises the men.
 */

export type ServiceSystem = 'levy' | 'hereditary' | 'paid';

export const SERVICE_SYSTEMS: ServiceSystem[] = ['levy', 'hereditary', 'paid'];

export const SERVICE_NAMES: Record<ServiceSystem, { zh: string; en: string; motto: string }> = {
  levy:       { zh: '更卒', en: 'Militia Levy',        motto: '編戶皆兵' },
  hereditary: { zh: '世兵', en: 'Hereditary Soldiers', motto: '士家世襲' },
  paid:       { zh: '募兵', en: 'Paid Volunteers',     motto: '重賞之下' },
};

export interface ServiceEffects {
  /** Multiplier on 徵兵 yield. */
  recruitMul: number;
  /** Multiplier on civilians consumed per soldier raised. */
  popDrawMul: number;
  /** Multiplier on the loyalty hit conscription causes. */
  loyaltyHitMul: number;
  /** 軍餉 — gold per 1,000 standing troops per season. */
  payPerThousand: number;
  /** Multiplier on the grain a garrison eats. */
  foodUpkeepMul: number;
  /** Per-season drift on the garrison's 練度. */
  drillDelta: number;
  /** Multiplier on desertion when grain or pay runs short. */
  desertionMul: number;
  badgeZh: string;
  badgeEn: string;
}

const EFFECTS: Record<ServiceSystem, ServiceEffects> = {
  levy: {
    recruitMul: 1, popDrawMul: 1, loyaltyHitMul: 1, payPerThousand: 0,
    foodUpkeepMul: 1, drillDelta: 0, desertionMul: 1,
    badgeZh: '漢家舊制 —— 無餉可發,亦無所長。徵兵傷民,兵去復為農',
    badgeEn: 'The Han militia — no wages, no edge; conscription bites the people',
  },
  hereditary: {
    recruitMul: 0.82, popDrawMul: 0.55, loyaltyHitMul: 0.5, payPerThousand: 0,
    foodUpkeepMul: 0.85, drillDelta: 0.5, desertionMul: 0.6,
    badgeZh: '士家世襲 —— 耗糧 −15%、逃亡 −40%、練度漸長;然兵源受限(徵兵 −18%),士家不入民籍',
    badgeEn: 'Military households — food −15%, desertion −40%, drill climbs; but a closed pool (recruits −18%)',
  },
  paid: {
    recruitMul: 1.28, popDrawMul: 0.35, loyaltyHitMul: 0.3, payPerThousand: 14,
    foodUpkeepMul: 1, drillDelta: 1, desertionMul: 2.4,
    badgeZh: '重賞之下 —— 徵兵 +28%、幾不擾民、練度 +1/季;然月有軍餉(每千兵 14 金/季),欠餉則潰',
    badgeEn: 'Paid volunteers — recruits +28%, barely touches the countryside, drill +1; but wages every season (14g/1,000), and arrears mean desertion',
  },
};

export function serviceEffects(system: ServiceSystem | undefined): ServiceEffects {
  return EFFECTS[system ?? 'levy'];
}

/** 軍餉 owed by one city this season. */
export function seasonPay(troops: number, system: ServiceSystem | undefined): number {
  return Math.round((Math.max(0, troops) / 1000) * serviceEffects(system).payPerThousand);
}

export interface PayResult {
  /** Gold actually handed out. */
  paid: number;
  /** Gold owed and not found. */
  arrears: number;
  /** Soldiers who walked away over unpaid wages. */
  deserted: number;
  /** Loyalty hit in the city that watched them go. */
  loyaltyDelta: number;
}

/**
 * Pay the garrison out of the city's own treasury. What is not paid is not
 * forgiven: about a tenth of the unpaid share walks off each season, and the
 * town notices.
 */
export function payGarrison(args: {
  troops: number;
  gold: number;
  system?: ServiceSystem;
}): PayResult {
  const owed = seasonPay(args.troops, args.system);
  if (owed <= 0) return { paid: 0, arrears: 0, deserted: 0, loyaltyDelta: 0 };
  const paid = Math.min(owed, Math.max(0, args.gold));
  const arrears = owed - paid;
  if (arrears <= 0) return { paid, arrears: 0, deserted: 0, loyaltyDelta: 0 };
  const unpaidShare = arrears / owed;
  const eff = serviceEffects(args.system);
  const deserted = Math.min(
    args.troops,
    Math.round(args.troops * unpaidShare * 0.1 * (eff.desertionMul / 2.4)),
  );
  return {
    paid,
    arrears,
    deserted,
    loyaltyDelta: unpaidShare >= 0.5 ? -2 : -1,
  };
}

/**
 * An AI lord's service system. A rich merchant realm hires; a hard-pressed
 * warlord with land but no coin settles military households on it; everyone
 * else runs the Han levy.
 */
export function aiServiceSystem(personality: string | undefined, goldPerCity: number): ServiceSystem {
  if (goldPerCity >= 2200 && (personality === 'merchant' || personality === 'aggressive')) return 'paid';
  if (goldPerCity < 700 && (personality === 'defensive' || personality === 'tyrant')) return 'hereditary';
  return 'levy';
}
