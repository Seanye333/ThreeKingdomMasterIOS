import { describe, expect, it } from 'vitest';
import { CITY_LORE, cityLore, cityLoreBrief } from './cityLore';
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

/**
 * The world map's hover card has room for one line, so it takes the opening
 * sentence. That fragment must still read as a complete thought.
 */
describe('cityLoreBrief — the one-line form for the map hover card', () => {
  it('cuts at the first full stop and keeps it', () => {
    const zh = cityLoreBrief('chibi', 'zh')!;
    expect(zh.endsWith('。') || zh.endsWith('…')).toBe(true);
    expect(zh.length).toBeLessThanOrEqual(64);
    const en = cityLoreBrief('chibi', 'en')!;
    expect(en.endsWith('.') || en.endsWith('…')).toBe(true);
  });

  it('never returns the whole note when the note is long', () => {
    for (const id of ['luoyang', 'changan', 'chibi', 'jieting']) {
      const full = CITY_LORE[id].zh;
      const brief = cityLoreBrief(id, 'zh')!;
      expect(brief.length).toBeLessThan(full.length);
    }
  });

  it('respects the character cap even without a full stop', () => {
    expect(cityLoreBrief('luoyang', 'zh', 12)!.length).toBeLessThanOrEqual(13); // cap + ellipsis
  });

  it('returns null for a city with no note', () => {
    expect(cityLoreBrief('no-such-city', 'zh')).toBeNull();
  });

  it('produces a usable line for every city on the map', () => {
    for (const id of CITY_IDS) {
      for (const lang of ['zh', 'en'] as const) {
        const brief = cityLoreBrief(id, lang);
        expect(brief, `${id}/${lang}`).toBeTruthy();
        expect(brief!.trim().length, `${id}/${lang} too short`).toBeGreaterThan(4);
      }
    }
  });
});
