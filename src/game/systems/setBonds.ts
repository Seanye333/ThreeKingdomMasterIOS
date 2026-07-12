import type { EntityId, Officer } from '../types';
import { CODEX_SETS } from './codex';
import { OATH_BONDS, isFeudKind } from '../data/bonds';

/**
 * 名將成套羈絆 — the card game's team-synergy layer, played on the real
 * battlefield. Field two or more members of a famous roster (五虎上將,
 * 桃園三結義, 八虎騎…) in the SAME battle pool and the legend stirs:
 * +1% power per member beyond the first, +2% extra when the whole set
 * stands together, capped at +8% a side. Sworn enemies (宿怨) pressed into
 * the same ranks grate instead: −1% per feuding pair, floored at −3%.
 * Gentle by design — the synergy tilts a fight, the troops still decide it.
 */

export interface SetBondNote {
  setId: string;
  zh: string;
  en: string;
  have: number;
  total: number;
  full: boolean;
}

const FEUD_PAIRS: Array<[string, string]> = OATH_BONDS
  .filter((b) => isFeudKind(b.kind))
  .map((b) => [b.officerA, b.officerB]);

export function setBondPowerMul(pool: Array<Officer | undefined | null>): {
  mul: number;
  notes: SetBondNote[];
  feudPairs: number;
} {
  const ids = new Set(pool.filter(Boolean).map((o) => (o as Officer).id));
  const notes: SetBondNote[] = [];
  let bonus = 0;
  for (const set of CODEX_SETS) {
    const have = set.members.filter((m) => ids.has(m)).length;
    if (have < 2) continue;
    const full = have === set.members.length;
    bonus += (have - 1) * 0.01 + (full ? 0.02 : 0);
    notes.push({ setId: set.id, zh: set.zh, en: set.en, have, total: set.members.length, full });
  }
  bonus = Math.min(0.08, bonus);
  let feudPairs = 0;
  for (const [a, b] of FEUD_PAIRS) {
    if (ids.has(a) && ids.has(b)) feudPairs += 1;
  }
  const penalty = Math.min(0.03, feudPairs * 0.01);
  return { mul: 1 + bonus - penalty, notes, feudPairs };
}

/**
 * 成套之禮 — the collection loop's in-campaign payoff: the first time a
 * famous set stands complete under the player's banner (all members alive,
 * serving, this campaign), the court celebrates — once per set per campaign
 * (`setRewardsClaimed`). Returns the sets that just completed; the store
 * grants the gold/loyalty and records the claim.
 */
export function pendingSetRewards(
  officers: Record<EntityId, Officer>,
  playerForceId: EntityId | null,
  claimed: string[],
): Array<{ setId: string; zh: string; en: string; memberIds: EntityId[] }> {
  if (!playerForceId) return [];
  const done = new Set(claimed);
  const out: Array<{ setId: string; zh: string; en: string; memberIds: EntityId[] }> = [];
  for (const set of CODEX_SETS) {
    if (done.has(set.id)) continue;
    const members = set.members.map((m) => officers[m]);
    if (members.every((o) => o && o.status !== 'dead' && o.forceId === playerForceId)) {
      out.push({ setId: set.id, zh: set.zh, en: set.en, memberIds: set.members });
    }
  }
  return out;
}

/** 成套之禮 constants — one purse per set, plus hearts lifted all round. */
export const SET_REWARD_GOLD = 800;
export const SET_REWARD_LOYALTY = 5;
