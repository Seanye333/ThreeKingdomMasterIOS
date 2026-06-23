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

/** What the governor would order this tick — or null if the treasury
 *  can't fund anything useful. */
export function planGovernorCommand(city: City, governor: Officer): InternalAffairsType | null {
  const affordable = (type: InternalAffairsType) =>
    city.gold >= COMMAND_DEFS[type].goldCost;
  const reliefFood = Math.max(500, Math.round(city.population * 0.02));

  // ① Unrest first — nothing else sticks in a city about to revolt. 撫民 if we
  // can pay for it; otherwise open the granaries (賑濟) when they're full enough.
  if (city.loyalty < 55) {
    if (affordable('improve-loyalty')) return 'improve-loyalty';
    if (city.food >= reliefFood * 2) return 'relief';
  }

  // ② 巡查肅貪 — graft has piled up in a wealthy city: claw it back (recovers
  // gold AND tops up loyalty). Worth doing well before it strangles income.
  if ((city.corruption ?? 0) >= 40 && affordable('anti-corruption')) {
    return 'anti-corruption';
  }

  // ③ A martial governor keeps the garrison manned before tending fields.
  const martial = governor.stats.war > governor.stats.politics + 15;
  const thinGarrison = city.troops < city.population * 0.04;
  if (martial && thinGarrison && affordable('recruit-troops')) return 'recruit-troops';

  // ④ 屯田 — a hungry garrison (thin larder, real troops) tills state land to
  // feed itself without spending population. Guard on a defined, low food store.
  if (
    city.troops >= 2000 &&
    city.food !== undefined &&
    city.food < city.troops * 3 &&
    affordable('military-farming')
  ) {
    return 'military-farming';
  }

  // ⑤ Develop whichever pillar still lags below ~90% of its tier cap. While any
  // pillar is genuinely low this fires before the advanced works below — so a
  // young city builds its economy first (and the tests stay green).
  const econCap = cityEconCap(city);
  const defCap = cityStatCap(city);
  const pillars: Array<{ type: InternalAffairsType; value: number; cap: number }> = [
    { type: 'develop-agriculture' as InternalAffairsType, value: city.agriculture, cap: econCap },
    { type: 'develop-commerce' as InternalAffairsType, value: city.commerce, cap: econCap },
    { type: 'build-defense' as InternalAffairsType, value: city.defense, cap: defCap },
  ].filter((p) => p.value < p.cap * 0.9);
  pillars.sort((a, b) => a.value - b.value);
  for (const p of pillars) {
    // 大政 — once 城-tier and the treasury is fat (keeps a reserve), push the
    // lagging pillar triple-strength in one season instead of three.
    const major = (
      p.type === 'develop-agriculture' ? 'major-agriculture'
      : p.type === 'develop-commerce' ? 'major-commerce'
      : 'major-defense'
    ) as InternalAffairsType;
    if (
      meetsMinSize(citySize(city).id, COMMAND_DEFS[major].minSize) &&
      city.gold >= COMMAND_DEFS[major].goldCost * 2.5
    ) {
      return major;
    }
    if (affordable(p.type)) return p.type;
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
