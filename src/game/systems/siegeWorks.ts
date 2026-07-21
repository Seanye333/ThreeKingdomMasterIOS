/**
 * 攻城器械營造 (§5.16) — the engines have to be built, and they burn.
 *
 * 攻城器 (siegeEngines.ts) already exists: bring the right officer with the
 * right gear and a 衝車 appears out of nowhere, permanent, free, indestructible.
 * That is exactly the half of a siege the sources never stop talking about and
 * the game had skipped. 陳倉: 郝昭 burned Zhuge Liang's ladders with fire arrows,
 * broke his rams with millstones, and a siege of twenty days ended in nothing.
 *
 * So: a camp that sits before a city **builds** its park of engines, season by
 * season, out of timber and skilled hands. The park makes the assault easier in
 * proportion to its size. And the defenders spend the whole siege trying to
 * burn it — the cleverer the man on the wall, the faster it goes up in smoke.
 *
 * This is what makes a long siege a *decision* rather than a wait: every season
 * you stand there you are building engines, losing men to sickness (§5.15) and
 * eating your rations (§4.9). The question is which curve wins.
 *
 * Pure. resolution.ts builds and burns; combat.ts reads the park's strength.
 */

/** Most engines one camp ever has standing. */
export const ENGINE_PARK_CAP = 12;

export interface EngineBuildInput {
  /** Engines already standing in the park. */
  standing: number;
  /** Best 智力 among the besieging officers — the man who knows the joinery. */
  engineerIntellect: number;
  /** Besieging troops — hands to swing the adzes. */
  troops: number;
  /** Timber country: a wooded/木 province next door builds far faster. */
  timberRich?: boolean;
}

/** Engines completed this season. */
export function engineBuildRate(input: EngineBuildInput): number {
  if (input.standing >= ENGINE_PARK_CAP) return 0;
  const hands = Math.min(2, input.troops / 12000);
  const skill = 0.4 + Math.max(0, input.engineerIntellect - 55) / 90;
  const timber = input.timberRich ? 1.5 : 1;
  const made = hands * skill * timber;
  return Math.max(0, Math.min(ENGINE_PARK_CAP - input.standing, Math.round(made * 10) / 10));
}

/**
 * 器械之利 — the multiplier a park of engines puts on the defender's factor.
 * Diminishing: the first few engines matter most, and a park can never make a
 * wall irrelevant (floor 0.62, on top of the single-engine bonus that already
 * exists).
 */
export function enginePartyMul(standing: number): number {
  const n = Math.max(0, Math.min(ENGINE_PARK_CAP, standing));
  return Math.round((1 - 0.38 * (1 - Math.exp(-n / 4.5))) * 1000) / 1000;
}

export interface EngineLossInput {
  standing: number;
  /** Best 智力 on the wall — 郝昭 is why you cannot leave a park unguarded. */
  defenderIntellect: number;
  /** A garrison with nobody left cannot sortie. */
  defenderTroops: number;
  /** Rain damps the fire arrows. */
  wet?: boolean;
}

export interface EngineLossResult {
  /** Engines lost to fire and sorties. */
  burned: number;
  /** True when the loss is worth a line in the report. */
  notable: boolean;
}

/**
 * What the defenders do about it. Wear alone takes a slow toll; a clever,
 * still-fighting garrison takes a much faster one.
 */
export function burnEngines(input: EngineLossInput, rng: () => number): EngineLossResult {
  const standing = Math.max(0, input.standing);
  if (standing <= 0) return { burned: 0, notable: false };
  if (input.defenderTroops <= 0) return { burned: 0, notable: false };
  // 火箭焚梯 — chance the garrison gets a real fire away this season.
  let chance = 0.18 + Math.max(0, input.defenderIntellect - 60) / 220;
  if (input.wet) chance *= 0.5;
  if (rng() >= Math.min(0.6, chance)) {
    // Ordinary wear: timber sags, ropes rot.
    const wear = standing >= 6 ? 1 : 0;
    return { burned: wear, notable: false };
  }
  const burned = Math.max(1, Math.round(standing * (0.3 + Math.max(0, input.defenderIntellect - 60) / 300)));
  return { burned: Math.min(standing, burned), notable: true };
}

export function enginePartyTier(standing: number): { zh: string; en: string } {
  if (standing >= 9) return { zh: '器械如林', en: 'A forest of engines' };
  if (standing >= 5) return { zh: '攻具略備', en: 'Engines ready' };
  if (standing >= 1) return { zh: '始造攻具', en: 'Building engines' };
  return { zh: '無攻城之具', en: 'No siege engines' };
}
