import { describe, it, expect, afterEach } from 'vitest';
import {
  ITEMS_BY_ID, liveItem, liveItemById,
  setRefineRegistry, setBreakthroughRegistry, setGemRegistry,
  socketsFor, breakthroughCost, BREAKTHROUGH_MAX, GEMS_BY_ID,
} from '../data/items';

const sword = ITEMS_BY_ID['green-dragon']; // war 10, leadership 3

afterEach(() => {
  setRefineRegistry({});
  setBreakthroughRegistry({});
  setGemRegistry({});
});

describe('liveItem — 精煉 → 突破 → 鑲嵌 bake in order', () => {
  it('breakthrough stars raise effects above the refine-only magnitude', () => {
    const refinedOnly = liveItem(sword, 5).effects.war ?? 0;
    const withStars = liveItem(sword, 5, 3).effects.war ?? 0;
    expect(withStars).toBeGreaterThan(refinedOnly);
  });

  it('gems add their flat stats on top', () => {
    const base = liveItem(sword, 0, 0).effects.war ?? 0;
    const withGem = liveItem(sword, 0, 0, ['gem-war']).effects.war ?? 0;
    expect(withGem).toBe(base + (GEMS_BY_ID['gem-war'].effects.war ?? 0));
  });

  it('a gem can add a brand-new stat the item never had', () => {
    expect(sword.effects.charisma ?? 0).toBe(0);
    const withCha = liveItem(sword, 0, 0, ['gem-cha']).effects.charisma ?? 0;
    expect(withCha).toBe(GEMS_BY_ID['gem-cha'].effects.charisma);
  });

  it('liveItemById resolves refine + breakthrough + gems from the registries', () => {
    setRefineRegistry({ 'green-dragon': 5 });
    setBreakthroughRegistry({ 'green-dragon': 2 });
    setGemRegistry({ 'green-dragon': ['gem-war', 'gem-lead'] });
    const live = liveItemById('green-dragon')!;
    const plain = sword.effects.war ?? 0;
    expect(live.effects.war).toBeGreaterThan(plain + 4); // refine+stars+gem all stacked
    expect(live.effects.leadership).toBeGreaterThan(sword.effects.leadership ?? 0);
  });
});

describe('sockets + breakthrough cost', () => {
  it('socketsFor scales with rarity (神兵 3 / 寶器 2 / 良具 1)', () => {
    expect(socketsFor({ ...sword, rarity: 'gold' })).toBe(3);
    expect(socketsFor({ ...sword, rarity: 'silver' })).toBe(2);
    expect(socketsFor({ ...sword, rarity: 'bronze' })).toBe(1);
  });

  it('breakthroughCost charges gold + iron and escalates per star', () => {
    const c0 = breakthroughCost(sword, 0);
    const c4 = breakthroughCost(sword, BREAKTHROUGH_MAX - 1);
    expect(c0.gold).toBeGreaterThan(0);
    expect(c0.iron).toBeGreaterThan(0);
    expect(c4.gold).toBeGreaterThan(c0.gold);
    expect(c4.iron).toBeGreaterThan(c0.iron);
  });
});

describe('armor reclassification', () => {
  it('genuine 甲/鎧/盔 are armor, divination/bribe pieces stay treasure', () => {
    expect(ITEMS_BY_ID['xuanjia'].kind).toBe('armor');
    expect(ITEMS_BY_ID['longlin-kai'].kind).toBe('armor');
    expect(ITEMS_BY_ID['tortoiseshell-divination'].kind).toBe('treasure');
    expect(ITEMS_BY_ID['ma-yuan-yiyi-jia'].kind).toBe('treasure');
  });
});
