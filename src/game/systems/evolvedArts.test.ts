import { describe, it, expect, afterEach } from 'vitest';
import { evolvedWeaponArt, evolvedArtDuelBonus, artForItem, EVOLVED_ART_DUEL_BONUS } from './evolvedArts';
import { setEvolvedRegistry, ITEMS_BY_ID } from '../data/items';
import type { Officer } from '../types';

const WEAPON = Object.values(ITEMS_BY_ID).find((i) => i.kind === 'weapon')!.id;
const HORSE = Object.values(ITEMS_BY_ID).find((i) => i.kind === 'horse')!.id;

const mk = (equipment: string[]): Officer => ({
  id: 'o', name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: null, forceId: 'f', status: 'idle', task: null,
  equipment, skills: [], rank: 'general',
} as Officer);

afterEach(() => setEvolvedRegistry([]));

describe('器魂戰技 — evolved weapon arts', () => {
  it('an awakened weapon grants its bearer an art + duel prowess; a plain one gives none', () => {
    // No evolved weapon → no art.
    expect(evolvedWeaponArt(mk([WEAPON]))).toBeNull();
    expect(evolvedArtDuelBonus(mk([WEAPON]))).toBe(0);
    // Awaken the weapon → the bearer gains the art.
    setEvolvedRegistry([WEAPON]);
    const art = evolvedWeaponArt(mk([WEAPON]));
    expect(art).toBeTruthy();
    expect(art!.duelBonus).toBe(EVOLVED_ART_DUEL_BONUS);
    expect(evolvedArtDuelBonus(mk([WEAPON]))).toBe(EVOLVED_ART_DUEL_BONUS);
  });

  it('the art follows the blade, not the horse', () => {
    setEvolvedRegistry([HORSE]); // an evolved *horse* grants no weapon art
    expect(evolvedWeaponArt(mk([HORSE]))).toBeNull();
    // artForItem is null for non-weapons regardless of evolution.
    expect(artForItem(HORSE)).toBeNull();
    expect(artForItem(WEAPON)).toBeTruthy();
  });
});
