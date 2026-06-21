import type { Officer, TacticalBattle, TacticalUnit } from '../types';
import { liveItemById } from '../data/items';
import { itemMasteryMul } from './gradeCombat';

/**
 * Quick deterministic damage range estimate for a unit-vs-unit attack.
 * Mirrors `attackUnits` math without applying any actual side effects;
 * returns min/max damage that the hit could deal (excluding crits and
 * skill triggers). Used by the targeting-mode hover tooltip.
 */
export function predictAttackDamage(
  battle: TacticalBattle,
  attacker: TacticalUnit,
  defender: TacticalUnit,
  officers: Record<string, Officer>,
): { min: number; max: number; counterMin: number; counterMax: number } {
  const ao = officers[attacker.officerId];
  const To = officers[defender.officerId];
  const aWar = (ao?.stats.war ?? 50) + sumItemWar(ao);
  const dLead = (To?.stats.leadership ?? 50) + sumItemLead(To);

  // The damage formula uses (0.85 + rng()*0.3) as the variance band.
  // So min-side multiplier is 0.85, max-side is 1.15.
  const lo = 0.85;
  const hi = 1.15;
  const base = (attacker.troops * (aWar + 30)) / (dLead + 50);
  let dmgLo = base * lo;
  let dmgHi = base * hi;
  if (defender.effects.some((e) => e.kind === 'defending')) {
    dmgLo *= 0.5;
    dmgHi *= 0.5;
  }
  if (attacker.effects.some((e) => e.kind === 'burning')) {
    dmgLo *= 0.9;
    dmgHi *= 0.9;
  }

  // Counter-attack ≈ 40% of forward damage from defender to attacker.
  const dWar = (To?.stats.war ?? 50) + sumItemWar(To);
  const aLead = (ao?.stats.leadership ?? 50) + sumItemLead(ao);
  const counterBase = (defender.troops * (dWar + 30) * 0.4) / (aLead + 50);
  let cLo = counterBase * lo;
  let cHi = counterBase * hi;

  // Floors and rounding.
  dmgLo = Math.max(0, Math.floor(dmgLo));
  dmgHi = Math.max(0, Math.floor(dmgHi));
  cLo = Math.max(0, Math.floor(cLo));
  cHi = Math.max(0, Math.floor(cHi));
  void battle;
  return { min: dmgLo, max: dmgHi, counterMin: cLo, counterMax: cHi };
}

function sumItemWar(o: Officer | undefined): number {
  if (!o) return 0;
  let n = 0;
  for (const id of o.equipment) {
    const it = liveItemById(id);
    if (it) n += (it.effects.war ?? 0) * itemMasteryMul(o, it);
  }
  return n;
}

function sumItemLead(o: Officer | undefined): number {
  if (!o) return 0;
  let n = 0;
  for (const id of o.equipment) {
    const it = liveItemById(id);
    if (it) n += (it.effects.leadership ?? 0) * itemMasteryMul(o, it);
  }
  return n;
}
