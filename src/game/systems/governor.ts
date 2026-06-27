/**
 * 委任太守 — a delegated city runs itself: at the start of each season
 * tick its governor issues one internal command through the ordinary
 * pipeline (same gold costs, same officer assignment, same report
 * entries), chosen by simple magistrate logic with a nudge from the
 * governor's own talents.
 *
 * The magistrate now reaches the full internal-affairs toolbox (賑濟/肅貪/
 * 屯田/練兵/招撫流民/城壁強化/大政) rather than the five basic pushes it used
 * to — a delegated city develops as deeply as the enemy AI's own cities do.
 */
import type { City, InternalAffairsType, Officer } from '../types';
import { COMMAND_DEFS, meetsMinSize } from './commands';
import { citySize, cityEconCap, cityStatCap } from './citySize';

/** 施政重點 — the focus the player sets a governor; reweights the cascade. */
export type GovernorStance = 'balanced' | 'economy' | 'military' | 'walls' | 'loyalty';

const has = (o: Officer, t: string) => (o.traits as string[] | undefined ?? []).includes(t);

/** What the governor would order this tick — or null if the treasury can't fund
 *  anything useful. The governor's own talents now shape it (能吏 develops harder
 *  & reaches for 大政 sooner; 撫民之才 acts on unrest earlier; 智者 sweeps graft &
 *  tends works sooner), and the `stance` steers the focus. */
export function planGovernorCommand(city: City, governor: Officer, stance: GovernorStance = 'balanced'): InternalAffairsType | null {
  const affordable = (type: InternalAffairsType) =>
    city.gold >= COMMAND_DEFS[type].goldCost;
  const reliefFood = Math.max(500, Math.round(city.population * 0.02));
  const { politics: pol, charisma: cha, intelligence: int } = governor.stats;
  // 太守做活 — talents move the thresholds.
  const unrestAt = 55 + Math.min(10, Math.max(0, cha - 70) * 0.3);   // 撫民之才 acts sooner
  const graftAt = 40 - Math.min(14, Math.max(0, int - 70) * 0.4);    // 明察 sweeps graft sooner
  const devCap = Math.min(0.98, 0.9 + Math.max(0, pol - 70) * 0.002); // 能吏 develops closer to the cap
  const majorMul = Math.max(1.9, 2.5 - Math.max(0, pol - 70) * 0.012); // …and reaches for 大政 sooner

  const econCap = cityEconCap(city);
  const defCap = cityStatCap(city);
  const thinGarrison = city.troops < city.population * 0.04;
  // 大政 or the basic push for a lagging pillar (talent-scaled thresholds).
  const developPillar = (p: { type: InternalAffairsType; value: number; cap: number }): InternalAffairsType | null => {
    const major = (p.type === 'develop-agriculture' ? 'major-agriculture' : p.type === 'develop-commerce' ? 'major-commerce' : 'major-defense') as InternalAffairsType;
    if (meetsMinSize(citySize(city).id, COMMAND_DEFS[major].minSize) && city.gold >= COMMAND_DEFS[major].goldCost * majorMul) return major;
    if (affordable(p.type)) return p.type;
    return null;
  };

  // ① Unrest first — nothing else sticks in a city about to revolt.
  if (city.loyalty < unrestAt) {
    if (affordable('improve-loyalty')) return 'improve-loyalty';
    if (city.food >= reliefFood * 2) return 'relief';
  }

  // ② 巡查肅貪 — claw back graft (recovers gold AND loyalty).
  if ((city.corruption ?? 0) >= graftAt && affordable('anti-corruption')) {
    return 'anti-corruption';
  }

  // ②.5 施政重點 — the player's focus pre-empts the default cascade.
  const econPillars = ([
    { type: 'develop-agriculture' as InternalAffairsType, value: city.agriculture, cap: econCap },
    { type: 'develop-commerce' as InternalAffairsType, value: city.commerce, cap: econCap },
  ]).filter((p) => p.value < p.cap * devCap).sort((a, b) => a.value - b.value);
  if (stance === 'military') {
    if (thinGarrison && affordable('recruit-troops')) return 'recruit-troops';
    if (city.troops >= 3000 && (city.drill ?? 0) < 60 && affordable('drill-troops')) return 'drill-troops';
    if (city.troops >= 2000 && (city.food ?? 0) < city.troops * 3 && affordable('military-farming')) return 'military-farming';
  } else if (stance === 'walls') {
    if ((city.wallTier ?? 1) < 3 && meetsMinSize(citySize(city).id, COMMAND_DEFS['upgrade-wall'].minSize) && city.gold >= COMMAND_DEFS['upgrade-wall'].goldCost * 1.6 && city.loyalty >= 50) return 'upgrade-wall';
    if (city.defense < defCap * devCap) { const o = developPillar({ type: 'build-defense', value: city.defense, cap: defCap }); if (o) return o; }
  } else if (stance === 'economy') {
    if (econPillars.length > 0) { const o = developPillar(econPillars[0]); if (o) return o; }
  } else if (stance === 'loyalty') {
    if (city.loyalty < 90 && affordable('improve-loyalty')) return 'improve-loyalty';
    if ((city.corruption ?? 0) >= graftAt * 0.6 && affordable('anti-corruption')) return 'anti-corruption';
    if (city.loyalty >= 55 && affordable('encourage-migration')) return 'encourage-migration';
  }

  // ③ A martial governor keeps the garrison manned before tending fields.
  const martial = governor.stats.war > governor.stats.politics + 15;
  if (martial && thinGarrison && affordable('recruit-troops')) return 'recruit-troops';

  // ④ 屯田 — a hungry garrison tills state land to feed itself.
  if (
    city.troops >= 2000 &&
    city.food !== undefined &&
    city.food < city.troops * 3 &&
    affordable('military-farming')
  ) {
    return 'military-farming';
  }

  // ⑤ Develop whichever pillar still lags below the (talent-scaled) cap fraction.
  const pillars: Array<{ type: InternalAffairsType; value: number; cap: number }> = [
    { type: 'develop-agriculture' as InternalAffairsType, value: city.agriculture, cap: econCap },
    { type: 'develop-commerce' as InternalAffairsType, value: city.commerce, cap: econCap },
    { type: 'build-defense' as InternalAffairsType, value: city.defense, cap: defCap },
  ].filter((p) => p.value < p.cap * devCap);
  pillars.sort((a, b) => a.value - b.value);
  for (const p of pillars) {
    const o = developPillar(p);
    if (o) return o;
  }

  // ── Economy built out: the advanced works the magistrate used to ignore. ──

  // ⑥ 城壁強化 — a 城-tier city with stone to spare raises its wall tier (→3),
  // keeping a reserve so it doesn't beggar itself.
  if (
    (city.wallTier ?? 1) < 3 &&
    meetsMinSize(citySize(city).id, COMMAND_DEFS['upgrade-wall'].minSize) &&
    city.gold >= COMMAND_DEFS['upgrade-wall'].goldCost * 1.6 &&
    city.loyalty >= 50
  ) {
    return 'upgrade-wall';
  }

  // ⑦ 練兵 — a real garrison whose drill has lapsed sharpens up (defensive power
  // in a siege).
  if (city.troops >= 3000 && (city.drill ?? 0) < 60 && affordable('drill-troops')) {
    return 'drill-troops';
  }

  // ⑧ 招撫流民 — economy maxed and loyalty steady: pull in migrants to drive the
  // population toward the next size tier (which raises the caps again).
  if (city.loyalty >= 55 && affordable('encourage-migration')) {
    return 'encourage-migration';
  }

  // ⑨ 治水 — cheap flood insurance while the works are still short of the cap.
  if ((city.floodWorks ?? 0) < 2 && affordable('flood-control')) {
    return 'flood-control';
  }

  // ⑩ Top up the last of the loyalty if we comfortably can.
  if (city.loyalty < 90 && affordable('improve-loyalty')) return 'improve-loyalty';

  // Civil governor still tops up a thin garrison as a last resort.
  if (thinGarrison && affordable('recruit-troops')) return 'recruit-troops';
  return null;
}

/** 太守之弊 — delegation is no longer pure upside. A greedy or disloyal governor
 *  lets graft fester (and skims a little); a long-seated one of ambition grows a
 *  power base (尾大不掉,忠誠漸蝕), while a long-trusted loyal hand is heartened.
 *  `tenureYears` is how long they've held the seat; `annual` gates the tenure
 *  loyalty drift to once a year. Pure. */
export function governorMisruleEffect(
  governor: Officer,
  tenureYears: number,
  annual: boolean,
): { corruption: number; skim: number; govLoyaltyDelta: number } {
  const greedy = has(governor, 'greedy') || has(governor, 'corrupt');
  const disloyal = governor.loyalty < 50;
  let corruption = 0, skim = 0, govLoyaltyDelta = 0;
  // 縱腐貪墨 — each season the city's graft creeps up and a little gold goes missing.
  if (greedy) { corruption += 2; skim += 60; }
  else if (disloyal) { corruption += 1; skim += 30; }
  // 久任 — yearly: an ambitious long-seated governor drifts disloyal; a loyal one
  // is reassured by the lasting trust.
  if (annual && tenureYears >= 4) {
    if (has(governor, 'ambitious') || has(governor, 'arrogant')) govLoyaltyDelta -= 1;
    else if (governor.loyalty >= 75) govLoyaltyDelta += 1;
  }
  return { corruption, skim, govLoyaltyDelta };
}
