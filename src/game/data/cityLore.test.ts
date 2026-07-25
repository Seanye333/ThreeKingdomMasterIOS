import { describe, expect, it } from 'vitest';
import { CITY_LORE, cityLore } from './cityLore';
import { CITY_IDS } from './cities';

/**
 * The gazetteer is keyed by city id and rendered straight into the City
 * panel. A typo'd key is simply never displayed — no error, no blank, just a
 * city that quietly has no note. These pin it down.
 */
describe('地方風物志 CITY_LORE', () => {
  const known = new Set(CITY_IDS);

  it('every key is a real city id', () => {
    for (const id of Object.keys(CITY_LORE)) {
      expect(known.has(id), `unknown city id ${id}`).toBe(true);
    }
  });

  it('covers every city on the map', () => {
    const missing = CITY_IDS.filter((id) => !CITY_LORE[id]);
    expect(missing, `cities without a note: ${missing.join(', ')}`).toEqual([]);
  });

  it('every note carries both languages and reads as prose', () => {
    for (const [id, note] of Object.entries(CITY_LORE)) {
      expect(note.zh.trim().length, `${id}: empty zh`).toBeGreaterThan(20);
      expect(note.en.trim().length, `${id}: empty en`).toBeGreaterThan(20);
    }
  });

  it('cityLore() returns null for an unknown city rather than throwing', () => {
    expect(cityLore('no-such-city')).toBeNull();
    expect(cityLore('luoyang')).not.toBeNull();
  });
});
