import { describe, it, expect } from 'vitest';
import { NAMED_BATTLE_MAPS, NAMED_MAPS_BY_ID } from './namedMaps';

describe('戰役腳本 — scripted historical battles', () => {
  it('every named map is well-formed (size, weather, terrain)', () => {
    for (const m of NAMED_BATTLE_MAPS) {
      expect(m.width).toBeGreaterThan(4);
      expect(m.height).toBeGreaterThan(4);
      expect(m.weather).toBeTruthy();
      expect(typeof m.terrainOverrides).toBe('object');
    }
  });

  it('Guandu tasks the aggressor with seizing the Wuchao granary', () => {
    const guandu = NAMED_MAPS_BY_ID['map-guandu'];
    expect(guandu?.attackerObjective?.kind).toBe('capture-supply');
    // the objective tile must coincide with a tagged supply hex
    const sup = guandu?.specialTiles?.find((s) => s.role === 'supply');
    expect(guandu?.attackerObjective?.tileCoord).toEqual(sup?.coord);
    expect(guandu?.introZh).toBeTruthy();
  });

  it('Hulao Pass and Red Cliffs are hold-the-line scripts with intros', () => {
    for (const id of ['map-hulao-pass', 'map-red-cliffs']) {
      const m = NAMED_MAPS_BY_ID[id];
      expect(m?.defenderObjective?.kind, `${id}`).toBe('survive-turns');
      expect((m?.defenderObjective?.turnsRequired ?? 0)).toBeGreaterThan(0);
      expect(m?.introZh, `${id} intro`).toBeTruthy();
      expect(m?.introEn, `${id} intro en`).toBeTruthy();
    }
  });
});
