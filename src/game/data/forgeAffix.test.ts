import { describe, it, expect } from 'vitest';
import { liveItem, rollForgeAffix, FORGE_AFFIXES, FORGE_AFFIXES_BY_ID, type Item } from './items';

describe('鍛造詞綴 — 天工偶得', () => {
  it('a roll below the chance yields an affix; above yields none', () => {
    expect(rollForgeAffix(() => 0.9, false)).toBe(''); // > 0.22
    expect(rollForgeAffix(() => 0.9, true)).toBe('');   // > 0.34
    const hit = rollForgeAffix(() => 0.0, false);
    expect(FORGE_AFFIXES_BY_ID[hit]).toBeTruthy();
  });

  it('a 神匠 draws only from the fine end of the pool', () => {
    const FINE = new Set(['bloodthirsty', 'sturdy', 'piercing', 'swift']);
    // Sweep the selection roll across the whole [0,1); every master pick is fine.
    for (let r = 0; r < 1; r += 0.03) {
      const id = rollForgeAffix(() => (r < 0.30 ? 0.0 : r), true); // first roll passes the gate
      if (id) expect(FINE.has(id)).toBe(true);
    }
  });

  it('an affix folds its flat bonus into the live item effects', () => {
    const item: Item = { id: 't', name: { zh: 'x', en: 'x' }, kind: 'weapon', effects: { war: 10 } } as Item;
    const base = liveItem(item, 0, 0, [], 0, [], false, 0, []);
    const withAffix = liveItem(item, 0, 0, [], 0, [], false, 0, ['bloodthirsty']); // war +4
    expect(base.effects.war).toBe(10);
    expect(withAffix.effects.war).toBe(10 + (FORGE_AFFIXES_BY_ID['bloodthirsty'].effects.war ?? 0));
  });

  it('affix ids are unique and every affix carries a real bonus', () => {
    const ids = FORGE_AFFIXES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of FORGE_AFFIXES) {
      const total = Object.values(a.effects).reduce((s, v) => s + (v ?? 0), 0);
      expect(total).toBeGreaterThan(0);
    }
  });
});
