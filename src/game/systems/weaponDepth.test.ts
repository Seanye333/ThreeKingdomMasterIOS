import { describe, it, expect } from 'vitest';
import { classifyWeaponByName, deriveWeaponType } from '../data/weaponTypes';
import { weaponMatchupMul, weaponTerrainMul, weaponMasterySkill } from './tactical';
import type { Officer } from '../types';

const stats = (war: number, int: number) => ({ leadership: 70, war, intelligence: int, politics: 50, charisma: 50 });
const off = (equipment: string[], war = 85, int = 60): Pick<Officer, 'equipment' | 'stats'> => ({ equipment, stats: stats(war, int) });

// ───────────────────── Batch A — name-keyword classification ─────────────────

describe('§5.9 名物識兵 — classify a weapon by the keywords in its name', () => {
  it('reads the specific class, most-specific first (弩 before 弓, 戟 before 槍/刀)', () => {
    expect(classifyWeaponByName({ zh: '諸葛連弩', en: 'Zhuge Repeating Crossbow' })).toBe('crossbow');
    expect(classifyWeaponByName({ zh: '開山斧', en: 'Mountain-Splitting Axe' })).toBe('siege');
    expect(classifyWeaponByName({ zh: '方天畫戟', en: 'Sky Halberd' })).toBe('halberd');
    expect(classifyWeaponByName({ zh: '丈八蛇矛', en: 'Serpent Spear' })).toBe('spear');
    expect(classifyWeaponByName({ zh: '羽扇', en: 'Feather Fan' })).toBe('fan');
    expect(classifyWeaponByName({ zh: '七星寶劍', en: 'Seven-Star Sword' })).toBe('sword');
    expect(classifyWeaponByName({ zh: '蟠龍棍', en: 'Coiled-Dragon Staff' })).toBe('siege');
    expect(classifyWeaponByName({ zh: '錦囊', en: 'Brocade Pouch' })).toBeNull(); // not a weapon name
  });

  it('deriveWeaponType reads a forged weapon’s name before falling to a stat guess', () => {
    // 諸葛連弩 is a real item never listed in ITEM_WEAPON_TYPE — it used to be
    // mis-guessed from the war stat; now it reads as a crossbow.
    expect(deriveWeaponType(off(['zhuge-crossbow']) as Officer)).toBe('crossbow');
    // A bare officer still falls back to the stat heuristic.
    expect(deriveWeaponType(off([], 85, 60) as Officer)).toBe('spear');
    expect(deriveWeaponType(off([], 50, 95) as Officer)).toBe('fan');
  });
});

// ───────────────────── Batch B — the completed matchup web ───────────────────

describe('§5.9 相剋網補全 — every class now has an offensive identity', () => {
  it('兵器破甲 (siege crushes heavy) and 弓襲輕 (bow picks off the soft)', () => {
    expect(weaponMatchupMul('siege', 'cavalry', 'cavalry', false).mul).toBeGreaterThan(1);
    expect(weaponMatchupMul('siege', 'cavalry', 'cavalry', false).tag).toBe('兵器破甲');
    expect(weaponMatchupMul('bow', 'fan', 'archers', false).mul).toBeGreaterThan(1);
  });

  it('劍難破重 — a light blade bites poorly into heavy armour', () => {
    expect(weaponMatchupMul('sword', 'cavalry', 'cavalry', false).mul).toBeLessThan(1);
    expect(weaponMatchupMul('sword', 'cavalry', 'cavalry', false).tag).toBe('劍難破重');
    // but the swordsman still wins on an exposed flank.
    expect(weaponMatchupMul('sword', 'sword', 'infantry', true).mul).toBeGreaterThan(1);
  });
});

// ───────────────────── Batch C — 兵裝精通 (mastery amplifies) ─────────────────

describe('§5.9 兵裝精通 — a master sharpens the edge, not a bad matchup', () => {
  it('amplifies a favourable matchup by half again', () => {
    const plain = weaponMatchupMul('halberd', 'cavalry', 'cavalry', false, false).mul;
    const mastered = weaponMatchupMul('halberd', 'cavalry', 'cavalry', false, true).mul;
    expect(mastered).toBeGreaterThan(plain); // 戟制騎 hits harder in a master's hands
  });

  it('does not rescue an unfavourable matchup (penalties stand)', () => {
    const plain = weaponMatchupMul('sword', 'cavalry', 'cavalry', false, false).mul;
    const mastered = weaponMatchupMul('sword', 'cavalry', 'cavalry', false, true).mul;
    expect(mastered).toBe(plain); // 劍難破重 is unchanged by mastery
  });

  it('maps each weapon class to its mastery skill', () => {
    expect(weaponMasterySkill('crossbow')).toBe('archer-master');
    expect(weaponMasterySkill('cavalry')).toBe('cavalry-master');
    expect(weaponMasterySkill('siege')).toBe('siegemaster');
    expect(weaponMasterySkill('spear')).toBe('god-of-war');
    expect(weaponMasterySkill('fan')).toBeNull();
  });
});

// ───────────────────── Batch D — weapon × terrain ────────────────────────────

describe('§5.9 兵裝得地 — the ground rewards the right weapon', () => {
  it('長兵扼隘 (spear/halberd in a chokepoint) and 弓弩居高 (bows on the heights)', () => {
    expect(weaponTerrainMul('spear', 'chokepoint')).toBeGreaterThan(1);
    expect(weaponTerrainMul('halberd', 'chokepoint')).toBeGreaterThan(1);
    expect(weaponTerrainMul('crossbow', 'hill')).toBeGreaterThan(1);
    expect(weaponTerrainMul('bow', 'mountain')).toBeGreaterThan(1);
    // wrong weapon / wrong ground → nothing
    expect(weaponTerrainMul('sword', 'chokepoint')).toBe(1);
    expect(weaponTerrainMul('spear', 'plain')).toBe(1);
    expect(weaponTerrainMul('bow', 'plain')).toBe(1);
  });
});
