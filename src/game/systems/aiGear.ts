import type { Officer } from '../types';
import {
  ITEMS_BY_ID, itemRarity, REFINE_MAX, BREAKTHROUGH_MAX, GEMS, socketsFor,
} from '../data/items';
import type { Difficulty } from '../state/gameState';

/**
 * 敵軍軍備 — give AI-held gear a baseline of 精煉 / 突破 / 鑲嵌 scaled by
 * difficulty and the wielder's strength, so late-game enemies wield upgraded
 * arms instead of white items. Mirrors the player's own 裝備養成 spine, applied
 * to every non-player officer.
 *
 * Returns the three registries with AI entries merged in (player items and any
 * pre-existing entries are preserved). Pure — RNG is injectable for tests.
 */
export function assignAiGear(input: {
  officers: Record<string, Officer>;
  playerForceId: string | null;
  difficulty: Difficulty;
  aiStrength?: number; // 1..5
  refine: Record<string, number>;
  breakthrough: Record<string, number>;
  gems: Record<string, string[]>;
  rng?: () => number;
}): { refine: Record<string, number>; breakthrough: Record<string, number>; gems: Record<string, string[]> } {
  const rng = input.rng ?? Math.random;
  const refine = { ...input.refine };
  const breakthrough = { ...input.breakthrough };
  const gems = { ...input.gems };
  const diffMul = input.difficulty === 'hard' ? 1 : input.difficulty === 'normal' ? 0.6 : 0.3;
  const strength = (input.aiStrength ?? 3) / 3;

  for (const o of Object.values(input.officers)) {
    if (!o || o.forceId == null || o.forceId === input.playerForceId || o.status === 'dead') continue;
    // 武將分量 — stronger commanders keep finer-kept gear.
    const stat = (o.stats.war + o.stats.leadership) / 2;
    const tier = (stat / 100) * diffMul * strength; // ~0 … 1.1
    for (const id of o.equipment) {
      const base = ITEMS_BY_ID[id];
      if (!base) continue;
      // 精煉 — raise to a tier-scaled cap (never lowers an existing level).
      const rCap = Math.min(REFINE_MAX, Math.round(tier * REFINE_MAX));
      if ((refine[id] ?? 0) < rCap) refine[id] = rCap;
      // 突破 — only top 神兵, fully refined, on hard.
      if (rCap >= REFINE_MAX && input.difficulty === 'hard' && itemRarity(base) === 'gold') {
        const bCap = Math.min(BREAKTHROUGH_MAX, Math.round((tier - 0.8) * 10));
        if (bCap > 0 && (breakthrough[id] ?? 0) < bCap) breakthrough[id] = bCap;
      }
      // 鑲嵌 — a basic gem for strong wielders with an open socket.
      if (tier > 0.7 && (gems[id]?.length ?? 0) === 0 && socketsFor(base) > 0 && rng() < tier) {
        const g = GEMS[Math.floor(rng() * 6)]; // one of the 6 basic gems
        gems[id] = [g.id];
      }
    }
  }
  return { refine, breakthrough, gems };
}
