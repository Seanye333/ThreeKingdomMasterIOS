import type { City, EntityId, Officer } from '../types';
import { officerGrade, gradeRank } from './officerGrade';

/**
 * 天下懸賞榜 — every spring the court posts 2-3 wanted notices: capture a
 * named enemy champion, or bring a famous free agent under your banner,
 * within two years, for gold and renown. The collection game gets a
 * season-scale goal; the fulfillment sweep runs at season commit.
 */

export interface Bounty {
  officerId: EntityId;
  kind: 'capture' | 'recruit';
  gold: number;
  renown: number;
  /** Inclusive last year the notice stands. */
  expiresYear: number;
}

/** Roll the spring notices: keep live unexpired ones, top up to three. */
export function rollBounties(
  officers: Record<EntityId, Officer>,
  playerForceId: EntityId | null,
  year: number,
  rng: () => number,
  existing: Bounty[],
): Bounty[] {
  if (!playerForceId) return [];
  const stillLive = existing.filter((b) => {
    const o = officers[b.officerId];
    return b.expiresYear >= year && o && o.status !== 'dead' && o.forceId !== playerForceId;
  });
  const taken = new Set(stillLive.map((b) => b.officerId));
  const goldPlus = (o: Officer) => gradeRank(officerGrade(o).grade) >= gradeRank('gold');
  const enemies = Object.values(officers).filter((o) =>
    o.status !== 'dead' && o.status !== 'unsearched' && o.forceId && o.forceId !== playerForceId
    && goldPlus(o) && !taken.has(o.id));
  const agents = Object.values(officers).filter((o) =>
    (o.status === 'idle' || o.status === 'active') && !o.forceId && goldPlus(o) && !taken.has(o.id));
  const out = [...stillLive];
  const pick = <T,>(arr: T[]): T | null => (arr.length > 0 ? arr[Math.floor(rng() * arr.length)] : null);
  while (out.length < 3) {
    // Lean toward capture notices (the war is the game); recruit ones spice it.
    const wantRecruit = rng() < 0.35;
    const src = wantRecruit ? agents : enemies;
    const o = pick(src) ?? pick(wantRecruit ? enemies : agents);
    if (!o) break;
    const idx1 = enemies.indexOf(o); if (idx1 >= 0) enemies.splice(idx1, 1);
    const idx2 = agents.indexOf(o); if (idx2 >= 0) agents.splice(idx2, 1);
    const isCapture = !!o.forceId;
    out.push({
      officerId: o.id,
      kind: isCapture ? 'capture' : 'recruit',
      gold: isCapture ? 1000 : 600,
      renown: isCapture ? 15 : 10,
      expiresYear: year + 1,
    });
  }
  return out;
}

/** Which notices the player has fulfilled this commit. */
export function fulfilledBounties(
  bounties: Bounty[],
  officers: Record<EntityId, Officer>,
  cities: Record<EntityId, City>,
  playerForceId: EntityId | null,
): Bounty[] {
  if (!playerForceId) return [];
  return bounties.filter((b) => {
    const o = officers[b.officerId];
    if (!o || o.status === 'dead') return false;
    if (b.kind === 'recruit') return o.forceId === playerForceId;
    // capture — the mark sits imprisoned inside one of YOUR cities.
    return o.status === 'imprisoned' && !!o.locationCityId
      && cities[o.locationCityId]?.ownerForceId === playerForceId;
  });
}
