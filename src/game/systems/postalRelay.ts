/**
 * 驛傳・政令所及 (§1.19) — how far the court's writ actually reaches.
 *
 * 驛站 and 驛傳 already existed as buildings that improved commerce, troop caps
 * and convoy capacity — each a local bonus, each blind to the thing relay
 * stations were *for*. A relay chain is not a building; it is a **network**, and
 * what it carries is the difference between a province you govern and a
 * province you merely own.
 *
 * The model: dispatches ride out from the capital with a fixed range. Every
 * hop into another of your cities burns range; arriving at a city that keeps a
 * relay station **remounts the rider** and restores it. So a far province is
 * governable exactly when there is a chain of stations leading to it — which is
 * why 南中 was a problem for Shu and why the Qin built post roads before they
 * built anything else.
 *
 *   在驛 (on the network)   — the writ arrives. Clerks are watched (graft slows),
 *                             the people see a magistrate who answers to someone.
 *   斷驛 (off the network)  — 天高皇帝遠. Graft compounds, households slip off
 *                             the registers, loyalty drifts, and the man you
 *                             posted there starts to think of himself as a lord.
 *
 * Pure. resolution.ts folds the multipliers into the civic tick.
 */
import type { EntityId } from '../types';

/** Hops a dispatch can ride before it needs a fresh mount. */
export const RELAY_RANGE = 3;

export interface RelayNode {
  cityId: EntityId;
  /** Owned by the realm whose network this is. */
  owned: boolean;
  /** This city keeps a 驛站/驛傳 — riders remount here. */
  hasRelay: boolean;
}

export interface RelayReach {
  /** Hops from the capital along the shortest riding route (Infinity if cut off). */
  hops: number;
  /** Whether the writ reaches at all. */
  connected: boolean;
}

/**
 * Walk the realm's relay network out from the capital.
 *
 * Deterministic BFS on remaining range: a city is reached with the *best*
 * remaining range found so far, and only re-expanded when a better route
 * reaches it (a station two hops away can rescue a chain a bare road cannot).
 */
export function buildRelayNetwork(args: {
  nodes: RelayNode[];
  neighborsOf: (cityId: EntityId) => EntityId[];
  capitalCityId: EntityId | null | undefined;
  /** Range a fresh rider carries (default {@link RELAY_RANGE}). */
  range?: number;
}): Map<EntityId, RelayReach> {
  const out = new Map<EntityId, RelayReach>();
  const byId = new Map<EntityId, RelayNode>();
  for (const n of args.nodes) byId.set(n.cityId, n);
  for (const n of args.nodes) out.set(n.cityId, { hops: Infinity, connected: false });

  const cap = args.capitalCityId ? byId.get(args.capitalCityId) : undefined;
  if (!cap || !cap.owned) return out;

  const range = args.range ?? RELAY_RANGE;
  const bestRange = new Map<EntityId, number>();
  // The capital is always its own relay — the court is where the riders start.
  bestRange.set(cap.cityId, range);
  out.set(cap.cityId, { hops: 0, connected: true });

  let frontier: Array<{ id: EntityId; left: number; hops: number }> = [
    { id: cap.cityId, left: range, hops: 0 },
  ];
  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const cur of frontier) {
      if (cur.left <= 0) continue;
      for (const nid of args.neighborsOf(cur.id)) {
        const node = byId.get(nid);
        if (!node || !node.owned) continue;
        const left = node.hasRelay ? range : cur.left - 1;
        const prev = bestRange.get(nid);
        if (prev !== undefined && prev >= left) continue;   // no better route
        bestRange.set(nid, left);
        const known = out.get(nid);
        const hops = cur.hops + 1;
        out.set(nid, { hops: Math.min(known?.hops ?? Infinity, hops), connected: true });
        next.push({ id: nid, left, hops });
      }
    }
    frontier = next;
  }
  return out;
}

export interface RelayEffects {
  /** Multiplier on this city's 貪腐 accrual. */
  corruptionMul: number;
  /** Per-season loyalty drift. */
  loyaltyDelta: number;
  /** Added drift on 隱戶 (§1.12) — nobody is checking the registers out here. */
  hiddenDelta: number;
  badgeZh: string;
  badgeEn: string;
}

/**
 * What the reach (or the lack of it) does to a city each season.
 * The capital's own ring is genuinely well-governed; the far end of a long but
 * intact chain is merely normal; cut off is where it bites.
 */
export function relayEffects(reach: RelayReach | undefined): RelayEffects {
  if (!reach || !reach.connected) {
    return {
      corruptionMul: 1.35, loyaltyDelta: -1, hiddenDelta: 0.5,
      badgeZh: '斷驛 — 天高皇帝遠:貪腐 +35%、民心 −1/季、隱戶漸增',
      badgeEn: 'Off the relay network — graft +35%, loyalty −1/season, households slip away',
    };
  }
  if (reach.hops <= 1) {
    return {
      corruptionMul: 0.8, loyaltyDelta: 0.5, hiddenDelta: -0.2,
      badgeZh: '輦轂之下 — 貪腐 −20%、民心 +0.5/季',
      badgeEn: 'Under the court\'s eye — graft −20%, loyalty +0.5/season',
    };
  }
  if (reach.hops <= 4) {
    return {
      corruptionMul: 0.95, loyaltyDelta: 0, hiddenDelta: 0,
      badgeZh: '政令通達',
      badgeEn: 'On the relay network',
    };
  }
  return {
    corruptionMul: 1.1, loyaltyDelta: 0, hiddenDelta: 0.15,
    badgeZh: '驛路迢遙 — 文書往返費時,貪腐 +10%',
    badgeEn: 'Far down the road — dispatches are slow, graft +10%',
  };
}

export function relayTier(reach: RelayReach | undefined): { zh: string; en: string } {
  if (!reach || !reach.connected) return { zh: '斷驛', en: 'Cut Off' };
  if (reach.hops <= 1) return { zh: '輦轂之下', en: 'By the Court' };
  if (reach.hops <= 4) return { zh: '政令通達', en: 'Connected' };
  return { zh: '驛路迢遙', en: 'Distant' };
}

/** Building ids that remount a rider. */
export const RELAY_BUILDINGS = new Set(['relay', 'supplydepot']);
