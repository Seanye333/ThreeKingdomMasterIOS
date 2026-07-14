import { describe, it, expect } from 'vitest';
import { accrueMountBond, mountBondMul, activeMountBondSeasons, heldMountId, MOUNT_BOND_CAP } from './mountBond';
import { ITEMS_BY_ID } from '../data/items';
import type { Officer } from '../types';

// A real horse id + a real non-horse id from the registry.
const HORSE = Object.values(ITEMS_BY_ID).find((i) => i.kind === 'horse')!.id;
const HORSE2 = Object.values(ITEMS_BY_ID).filter((i) => i.kind === 'horse')[1]!.id;
const WEAPON = Object.values(ITEMS_BY_ID).find((i) => i.kind === 'weapon')!.id;

const mk = (equipment: string[], mountBond?: Officer['mountBond']): Officer => ({
  id: 'o', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: null, forceId: 'f', status: 'idle', task: null,
  equipment, skills: [], rank: 'general', mountBond,
} as Officer);

describe('人馬合一 — mount bond', () => {
  it('finds the held mount and ignores the horseless', () => {
    expect(heldMountId(mk([WEAPON, HORSE]))).toBe(HORSE);
    expect(heldMountId(mk([WEAPON]))).toBeNull();
  });

  it('deepens on the same steed and resets on a new one', () => {
    let o = mk([HORSE]);
    o = accrueMountBond(o);
    expect(o.mountBond).toEqual({ itemId: HORSE, seasons: 0 });
    o = accrueMountBond(o);
    expect(o.mountBond!.seasons).toBe(1);
    // Swap to a different horse — the bond starts over.
    o = { ...o, equipment: [HORSE2] };
    o = accrueMountBond(o);
    expect(o.mountBond).toEqual({ itemId: HORSE2, seasons: 0 });
  });

  it('the bonus grows with the bond and only while still riding that horse', () => {
    const bonded = mk([HORSE], { itemId: HORSE, seasons: 4 });
    expect(activeMountBondSeasons(bonded)).toBe(4);
    expect(mountBondMul(bonded)).toBeCloseTo(1 + 4 * 0.008, 5);
    // A stale bond to a horse they no longer hold gives nothing.
    const swapped = mk([HORSE2], { itemId: HORSE, seasons: 9 });
    expect(activeMountBondSeasons(swapped)).toBe(0);
    expect(mountBondMul(swapped)).toBe(1);
    // The bonus is capped.
    const veteran = mk([HORSE], { itemId: HORSE, seasons: 999 });
    expect(mountBondMul(veteran)).toBeCloseTo(1 + MOUNT_BOND_CAP, 5);
  });
});
