/**
 * 委任太守 — a delegated city runs itself: at the start of each season
 * tick its governor issues one internal command through the ordinary
 * pipeline (same gold costs, same officer assignment, same report
 * entries), chosen by simple magistrate logic with a nudge from the
 * governor's own talents.
 */
import type { City, InternalAffairsType, Officer } from '../types';
import { COMMAND_DEFS } from './commands';

/** What the governor would order this tick — or null if the treasury
 *  can't fund anything useful. */
export function planGovernorCommand(city: City, governor: Officer): InternalAffairsType | null {
  const affordable = (type: InternalAffairsType) =>
    city.gold >= COMMAND_DEFS[type].goldCost;

  // Unrest first — nothing else sticks in a city about to revolt.
  if (city.loyalty < 55 && affordable('improve-loyalty')) return 'improve-loyalty';

  // A martial governor keeps the garrison manned before tending fields.
  const martial = governor.stats.war > governor.stats.politics + 15;
  const thinGarrison = city.troops < city.population * 0.04;
  if (martial && thinGarrison && affordable('recruit-troops')) return 'recruit-troops';

  // Develop whichever pillar lags furthest (defense only counts while
  // it's actually low — walls don't need to race the economy).
  const pillars: Array<{ type: InternalAffairsType; value: number }> = [
    { type: 'develop-agriculture', value: city.agriculture },
    { type: 'develop-commerce', value: city.commerce },
  ];
  if (city.defense < 60) pillars.push({ type: 'build-defense', value: city.defense });
  pillars.sort((a, b) => a.value - b.value);
  for (const p of pillars) {
    if (affordable(p.type)) return p.type;
  }

  // Civil governor still tops up a thin garrison as a last resort.
  if (thinGarrison && affordable('recruit-troops')) return 'recruit-troops';
  return null;
}
