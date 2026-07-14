import type { Officer } from '../types';
import { ITEMS_BY_ID } from '../data/items';

/**
 * 人馬合一 — a rider and their steed grow into one. Carried through battle after
 * battle, a mount learns its rider's hand: a small, growing edge for an officer
 * on the horse they've long ridden. Switch horses and the bond starts over — a
 * borrowed mount is not a trusted one. Stored on the officer (mountBond), so no
 * registry threading; the bonus applies only while they still hold that horse.
 */

/** +0.8% power per season bonded, capped — a polish on a fixed pairing. */
export const MOUNT_BOND_CAP = 0.05;
export const MOUNT_BOND_PER_SEASON = 0.008;

/** The officer's currently-held horse item id, or null. */
export function heldMountId(o: Officer): string | null {
  for (const id of o.equipment) {
    if (ITEMS_BY_ID[id]?.kind === 'horse') return id;
  }
  return null;
}

/** Bond seasons the officer has with the horse they are RIGHT NOW riding (0 if
 *  none, or if they've swapped to a different mount than the bond records). */
export function activeMountBondSeasons(o: Officer): number {
  const held = heldMountId(o);
  if (!held || !o.mountBond || o.mountBond.itemId !== held) return 0;
  return Math.max(0, o.mountBond.seasons);
}

/** Power multiplier from the officer's bond with their current mount (1 if none). */
export function mountBondMul(o: Officer | undefined | null): number {
  if (!o) return 1;
  return 1 + Math.min(MOUNT_BOND_CAP, activeMountBondSeasons(o) * MOUNT_BOND_PER_SEASON);
}

/**
 * Update one officer's mount bond after a battle they rode in: if still on the
 * bonded horse, the bond deepens; a new horse resets the count. Returns the
 * officer (unchanged if they carry no mount).
 */
export function accrueMountBond(o: Officer): Officer {
  const held = heldMountId(o);
  if (!held) return o; // no horse — nothing to bond with
  if (o.mountBond?.itemId === held) {
    return { ...o, mountBond: { itemId: held, seasons: Math.min(999, o.mountBond.seasons + 1) } };
  }
  return { ...o, mountBond: { itemId: held, seasons: 0 } }; // new steed — fresh bond
}
