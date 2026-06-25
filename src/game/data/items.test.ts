import { describe, it, expect } from 'vitest';
import { liveItem, itemLoreTitle, itemLoreAuraMul, accrueWeaponLore, itemGrowthGoldSpent, type Item } from './items';

const base = { id: 'tw', name: { en: '', zh: '' }, kind: 'weapon', description: '', effects: { war: 10 }, rarity: 'gold' } as Item;

describe('寶石共鳴 — same-gem resonance', () => {
  it('2 same gems add +25%, 3 same add +50% of the gem on top of the flat inlays', () => {
    const one = liveItem(base, 0, 0, ['gem-war']).effects.war!;                       // 10 + 4
    const two = liveItem(base, 0, 0, ['gem-war', 'gem-war']).effects.war!;             // 10 + 8 + 25% reso
    const three = liveItem(base, 0, 0, ['gem-war', 'gem-war', 'gem-war']).effects.war!; // 10 + 12 + 50% reso
    expect(two).toBeGreaterThan(one + 4);   // beyond just the second flat gem
    expect(three).toBeGreaterThan(two);
  });
  it('mixed gems do not resonate', () => {
    expect(liveItem(base, 0, 0, ['gem-war', 'gem-lead']).effects.war!).toBe(14); // 10 base + 4 war gem, no resonance
  });
});

describe('名器養成 — lore aura + titles', () => {
  it('aura lifts effects, scales with renown, and caps at +8%', () => {
    expect(itemLoreAuraMul(0)).toBe(1);
    expect(itemLoreAuraMul(40)).toBeCloseTo(1.08);
    expect(itemLoreAuraMul(1000)).toBeCloseTo(1.08); // still capped
    expect(liveItem(base, 0, 0, [], 60).effects.war!).toBeGreaterThan(liveItem(base, 0, 0, [], 0).effects.war!);
  });
  it('earns titles at renown thresholds', () => {
    expect(itemLoreTitle(0)).toBeNull();
    expect(itemLoreTitle(11)).toBeNull();
    expect(itemLoreTitle(12)?.zh).toBe('飲血');
    expect(itemLoreTitle(30)?.zh).toBe('百戰');
    expect(itemLoreTitle(60)?.zh).toBe('名器');
  });
  it('accrueWeaponLore: +1 per battle to weapons/armour/mounts; books + unknowns ignored', () => {
    const after = accrueWeaponLore({}, [['green-dragon', 'sunzi-bingfa', 'no-such-item']]);
    expect(after['green-dragon']).toBe(1);          // weapon → seasoned
    expect(after['sunzi-bingfa']).toBeUndefined();  // 兵書 (book) → not a 名器
    expect(after['no-such-item']).toBeUndefined();
  });
  it('accrueWeaponLore: an officer in two battles seasons the same gear twice', () => {
    const after = accrueWeaponLore({ 'green-dragon': 5 }, [['green-dragon'], ['green-dragon']]);
    expect(after['green-dragon']).toBe(7);
  });
});

describe('洗點退養 — itemGrowthGoldSpent', () => {
  it('sums refine + breakthrough gold and rises with investment', () => {
    expect(itemGrowthGoldSpent(base, 0, 0)).toBe(0);
    const refined = itemGrowthGoldSpent(base, 3, 0);
    const maxed = itemGrowthGoldSpent(base, 5, 2);
    expect(refined).toBeGreaterThan(0);
    expect(maxed).toBeGreaterThan(refined);
  });
});
