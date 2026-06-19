/**
 * 水戰火攻 — when a clash falls on open water, the cannier admiral can loose
 * fire-ships and break the enemy fleet (赤壁). Pure: returns power multipliers
 * the clash resolver folds into each side's strength, plus a recap line.
 *
 * Rain/snow douse the flames; strong wind feeds them. A dull commander rarely
 * pulls it off; a 周瑜/陸遜-grade mind on a windy day is devastating.
 */
export interface NavalModifier {
  aMul: number;
  bMul: number;
  fire: 'a' | 'b' | null;
  recapZh?: string;
  recapEn?: string;
}

export function navalEngagement(args: {
  aIntel: number;
  bIntel: number;
  aName: string;
  bName: string;
  weatherKind: string;   // 'clear' | 'rain' | 'wind' | 'fog' | 'snow'
  windPower: number;     // 0–3
  rng: () => number;
}): NavalModifier {
  const aLead = args.aIntel >= args.bIntel;
  const attackerIntel = aLead ? args.aIntel : args.bIntel;
  // Water douses fire; a gale fans it.
  const doused = args.weatherKind === 'rain' || args.weatherKind === 'snow';
  const chance = doused
    ? 0
    : Math.min(0.85, Math.max(0, (attackerIntel - 60) / 60) * 0.6 + args.windPower * 0.12);
  if (chance > 0 && args.rng() < chance) {
    const power = 1.5 + args.windPower * 0.15;   // up to ~1.95 in a strong wind
    if (aLead) {
      return { aMul: power, bMul: 1, fire: 'a',
        recapZh: `${args.aName}縱火焚船,大破${args.bName}水師`,
        recapEn: `${args.aName} loosed fire-ships and shattered ${args.bName}'s fleet` };
    }
    return { aMul: 1, bMul: power, fire: 'b',
      recapZh: `${args.bName}縱火焚船,大破${args.aName}水師`,
      recapEn: `${args.bName} loosed fire-ships and shattered ${args.aName}'s fleet` };
  }
  return { aMul: 1, bMul: 1, fire: null };
}
