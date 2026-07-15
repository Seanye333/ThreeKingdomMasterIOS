import { describe, it, expect } from 'vitest';
import { isBattleSpoil, ITEMS_BY_ID, itemRarity } from './items';

describe('戰場繳獲 — what a victor may loot from the fallen', () => {
  it('storied arms (神兵/寶器) and command tokens qualify; common gear and unknowns do not', () => {
    expect(isBattleSpoil('imperial-seal')).toBe(true);       // gold treasure
    expect(isBattleSpoil('hufu-tiger-tally')).toBe(true);    // command token
    expect(isBattleSpoil('dragon-gut')).toBe(false);         // bronze weapon
    expect(isBattleSpoil('no-such-item')).toBe(false);       // unknown
  });

  it('every gold/silver piece is lootable, every bronze/common one is not', () => {
    for (const it of Object.values(ITEMS_BY_ID)) {
      const r = itemRarity(it);
      if (r === 'gold' || r === 'silver') expect(isBattleSpoil(it.id), it.id).toBe(true);
    }
  });
});
