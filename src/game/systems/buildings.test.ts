import { describe, it, expect } from 'vitest';
import type { Building, BuildingId, City, Officer } from '../types';
import { buildingBonuses } from './buildings';
import { buildingGroupSynergy, statecraftCategoryMul } from '../data/buildings';
import { cityAffinity } from '../data/specialties';
import { tickBuildingEvents } from './buildingEvents';
import { tickCityEconomy } from './economy';
import { tickAfflictions } from './afflictions';

const mk = (id: BuildingId, level: number): Building => ({
  id,
  cityId: 'c1',
  level,
  progress: 0,
});

describe('buildingBonuses — new buildings are wired in', () => {
  it('驛站 relay: +8% commerce & +4% troop cap per level', () => {
    const b = buildingBonuses('c1', [mk('relay', 2)]);
    expect(b.commerceMul).toBeCloseTo(1.16);
    expect(b.troopCapMul).toBeCloseTo(1.08);
  });

  it('太學 grandacademy: +12% xp & +1 loyalty/season per level', () => {
    const b = buildingBonuses('c1', [mk('grandacademy', 3)]);
    expect(b.xpMul).toBeCloseTo(1.36);
    expect(b.loyaltyPerSeason).toBe(3);
  });

  it('甕城 barbican: +12 defense & +0.2 instigate resistance per level', () => {
    const b = buildingBonuses('c1', [mk('barbican', 4)]);
    expect(b.defenseAdd).toBe(48);
    expect(b.instigateResistance).toBeCloseTo(0.8);
  });

  it('常平倉 evernormal: +10% food & +5% commerce per level', () => {
    const b = buildingBonuses('c1', [mk('evernormal', 2)]);
    expect(b.agricultureMul).toBeCloseTo(1.2);
    expect(b.commerceMul).toBeCloseTo(1.1);
  });

  it('演武場 drillground: +6% recruit & +8% xp per level', () => {
    const b = buildingBonuses('c1', [mk('drillground', 2)]);
    expect(b.recruitMul).toBeCloseTo(1.12);
    expect(b.xpMul).toBeCloseTo(1.16);
  });

  it('level-0 (under construction) buildings give no bonus', () => {
    const b = buildingBonuses('c1', [mk('relay', 0)]);
    expect(b.commerceMul).toBe(1);
    expect(b.troopCapMul).toBe(1);
  });
});

describe('buildingBonuses — second batch (9 new dimensions)', () => {
  it('水利 irrigation: +8% food & drought mitigation (clamped ≤0.75)', () => {
    const b = buildingBonuses('c1', [mk('irrigation', 3)]);
    expect(b.agricultureMul).toBeCloseTo(1.24);
    expect(b.droughtMitigation).toBeCloseTo(0.75); // 0.25*3 = 0.75
  });
  it('招賢館 recruithall: +recruit-officer chance & +XP', () => {
    const b = buildingBonuses('c1', [mk('recruithall', 2)]);
    expect(b.recruitOfficerBonus).toBeCloseTo(0.16);
    expect(b.xpMul).toBeCloseTo(1.12);
  });
  it('諜報司 spyoffice: scheme resist (clamped ≤0.6) & instigate resist', () => {
    const b = buildingBonuses('c1', [mk('spyoffice', 3)]);
    expect(b.schemeResist).toBeCloseTo(0.45);
    expect(b.instigateResistance).toBeCloseTo(0.6);
  });
  it('驛傳 supplydepot: +convoy & +troop cap', () => {
    const b = buildingBonuses('c1', [mk('supplydepot', 2)]);
    expect(b.convoyMul).toBeCloseTo(1.3);
    expect(b.troopCapMul).toBeCloseTo(1.06);
  });
  it('安民坊 civicoffice: +pop growth & +loyalty', () => {
    const b = buildingBonuses('c1', [mk('civicoffice', 2)]);
    expect(b.popGrowthAdd).toBeCloseTo(0.008);
    expect(b.loyaltyPerSeason).toBe(2);
  });
  it('市舶司 tradeoffice: +trade & +commerce', () => {
    const b = buildingBonuses('c1', [mk('tradeoffice', 2)]);
    expect(b.tradeMul).toBeCloseTo(1.2);
    expect(b.commerceMul).toBeCloseTo(1.08);
  });
  it('武學堂 warschool / 糧倉署 quartermaster / 譙樓 signaltower', () => {
    expect(buildingBonuses('c1', [mk('warschool', 2)]).xpMul).toBeCloseTo(1.3);
    expect(buildingBonuses('c1', [mk('quartermaster', 2)]).troopCapMul).toBeCloseTo(1.12);
    expect(buildingBonuses('c1', [mk('signaltower', 3)]).defenseAdd).toBe(30);
  });
});

describe('buildingBonuses — third batch (8 more dimensions)', () => {
  it('傷兵營 fieldhospital: wound recovery + loyalty', () => {
    const b = buildingBonuses('c1', [mk('fieldhospital', 2)]);
    expect(b.woundRecovery).toBe(2);
    expect(b.loyaltyPerSeason).toBe(2);
  });
  it('道觀 daotemple: cult resist (clamp ≤0.75) + loyalty', () => {
    const b = buildingBonuses('c1', [mk('daotemple', 3)]);
    expect(b.cultResist).toBeCloseTo(0.75); // 0.3*3 clamped
    expect(b.loyaltyPerSeason).toBe(3);
  });
  it('將作監 worksbureau: build discount (clamp ≤0.4) + speed', () => {
    const b = buildingBonuses('c1', [mk('worksbureau', 3)]);
    expect(b.buildDiscount).toBeCloseTo(0.3);
    expect(b.buildSpeed).toBe(3);
  });
  it('酒肆 tavern: rapport mul + loyalty + commerce', () => {
    const b = buildingBonuses('c1', [mk('tavern', 2)]);
    expect(b.rapportMul).toBeCloseTo(2); // 1 + 0.5*2
    expect(b.loyaltyPerSeason).toBe(2);
    expect(b.commerceMul).toBeCloseTo(1.06);
  });
  it('牢城 prison: defection resist + instigate resist', () => {
    const b = buildingBonuses('c1', [mk('prison', 3)]);
    expect(b.defectionResist).toBeCloseTo(0.6); // 0.2*3
    expect(b.instigateResistance).toBeCloseTo(0.3);
  });
  it('牧苑 pasture / 藏書閣 library / 烽燧 beacon', () => {
    expect(buildingBonuses('c1', [mk('pasture', 2)]).troopCapMul).toBeCloseTo(1.1);
    expect(buildingBonuses('c1', [mk('pasture', 2)]).recruitMul).toBeCloseTo(1.1);
    expect(buildingBonuses('c1', [mk('library', 3)]).xpMul).toBeCloseTo(1.3);
    expect(buildingBonuses('c1', [mk('beacon', 4)]).defenseAdd).toBe(32);
    expect(buildingBonuses('c1', [mk('beacon', 4)]).schemeResist).toBeCloseTo(0.4);
  });
});

describe('buildingBonuses — fourth batch (5 niche-system hooks)', () => {
  it('軍器監 armsbureau: refine discount (≤0.5) + +2 chance (≤0.6)', () => {
    const b = buildingBonuses('c1', [mk('armsbureau', 3)]);
    expect(b.refineDiscount).toBeCloseTo(0.3);
    expect(b.refineUpgradeChance).toBeCloseTo(0.36);
  });
  it('平準署 pricebureau: inflation relief + commerce', () => {
    const b = buildingBonuses('c1', [mk('pricebureau', 3)]);
    expect(b.inflationRelief).toBe(6);
    expect(b.commerceMul).toBeCloseTo(1.09);
  });
  it('鴻臚館 heraldhall: diplo mul + commerce', () => {
    const b = buildingBonuses('c1', [mk('heraldhall', 2)]);
    expect(b.diploRelMul).toBeCloseTo(0.3);
    expect(b.commerceMul).toBeCloseTo(1.06);
  });
  it('樓船署 navalyard: naval power + recruit', () => {
    const b = buildingBonuses('c1', [mk('navalyard', 4)]);
    expect(b.navalPower).toBe(40);
    expect(b.recruitMul).toBeCloseTo(1.12);
  });
  it('斥候營 scoutcamp: espionage power + instigate resist', () => {
    const b = buildingBonuses('c1', [mk('scoutcamp', 3)]);
    expect(b.espionagePower).toBeCloseTo(0.3);
    expect(b.instigateResistance).toBeCloseTo(0.3);
  });
});

describe('建築群方略 — same-category set bonus', () => {
  it('synergy curve: +6%/extra, capped at +36%', () => {
    expect(buildingGroupSynergy(1)).toBeCloseTo(1);
    expect(buildingGroupSynergy(2)).toBeCloseTo(1.06);
    expect(buildingGroupSynergy(3)).toBeCloseTo(1.12);
    expect(buildingGroupSynergy(7)).toBeCloseTo(1.36);
    expect(buildingGroupSynergy(99)).toBeCloseTo(1.36); // capped
  });

  it('clustering same-category buildings boosts their output', () => {
    // 3 defense buildings (all lv1): raw 10+8+12 = 30, ×1.12 synergy = 33.6
    const cluster = buildingBonuses('c1', [mk('wall', 1), mk('arsenal', 1), mk('barbican', 1)]);
    expect(cluster.defenseAdd).toBeCloseTo(33.6);
    // a lone wall gets no synergy
    expect(buildingBonuses('c1', [mk('wall', 1)]).defenseAdd).toBe(10);
  });

  it('different categories do NOT synergize', () => {
    // wall (defense) + market (economy): each alone in its category → no bonus
    const mixed = buildingBonuses('c1', [mk('wall', 1), mk('market', 1)]);
    expect(mixed.defenseAdd).toBe(10);
    expect(mixed.commerceMul).toBeCloseTo(1.12); // market alone, no synergy
  });

  it('level-0 (under construction) does not count toward the group', () => {
    const b = buildingBonuses('c1', [mk('wall', 1), mk('arsenal', 0), mk('barbican', 0)]);
    expect(b.defenseAdd).toBe(10); // only the finished wall counts → no synergy
  });
});

describe('地利 affinity × 理念 statecraft — category slants', () => {
  const mkAt = (id: BuildingId, level: number, cityId: string): Building => ({ id, cityId, level, progress: 0 });
  it('specialty affinity gives matching-category buildings +10%', () => {
    // chengdu = brocade → economy affinity
    expect(cityAffinity('chengdu')).toBe('economy');
    const affine = buildingBonuses('chengdu', [mkAt('market', 1, 'chengdu')]).commerceMul;
    const plain = buildingBonuses('nowhere-city', [mkAt('market', 1, 'nowhere-city')]).commerceMul;
    expect(affine).toBeCloseTo(1.132); // 1 + 0.12*1.1
    expect(plain).toBeCloseTo(1.12);
    expect(affine).toBeGreaterThan(plain);
  });

  it('statecraftCategoryMul favours the right categories', () => {
    expect(statecraftCategoryMul('legalist', 'economy')).toBeCloseTo(1.1);
    expect(statecraftCategoryMul('legalist', 'military')).toBe(1);
    expect(statecraftCategoryMul('militarist', 'military')).toBeCloseTo(1.1);
    expect(statecraftCategoryMul(null, 'economy')).toBe(1);
  });

  it('statecraft school boosts favoured-category buildings via opts', () => {
    const base = buildingBonuses('nowhere-city', [mkAt('market', 1, 'nowhere-city')]).commerceMul;
    const legalist = buildingBonuses('nowhere-city', [mkAt('market', 1, 'nowhere-city')], { statecraft: 'legalist' }).commerceMul;
    expect(legalist).toBeGreaterThan(base);
  });
});

describe('城建興廢 — building events', () => {
  const city = (id: string): City => ({
    id, name: { en: id, zh: id }, ownerForceId: 'p1',
  } as unknown as City);

  it('a mishap (rng→0) knocks a building down a level', () => {
    const out = tickBuildingEvents({
      buildings: [{ id: 'market', cityId: 'c1', level: 2, progress: 0 }],
      cities: { c1: city('c1') },
      playerForceId: 'p1',
      rng: () => 0,
    });
    expect(out.buildings[0].level).toBe(1);
    expect(out.entries.length).toBe(1);
  });

  it('quiet season (rng→0.99) leaves buildings untouched', () => {
    const out = tickBuildingEvents({
      buildings: [{ id: 'market', cityId: 'c1', level: 2, progress: 0 }],
      cities: { c1: city('c1') },
      playerForceId: 'p1',
      rng: () => 0.99,
    });
    expect(out.buildings[0].level).toBe(2);
    expect(out.entries.length).toBe(0);
  });
});

// Integration: the bonuses are no longer display-only — they reach the sim.
describe('building bonuses reach the economy tick', () => {
  const baseCity = (): City => ({
    id: 'c1', name: { en: 'C', zh: '城' },
    ownerForceId: 'f1',
    population: 100_000, commerce: 100, agriculture: 100, loyalty: 70,
    defense: 50, troops: 1000, gold: 0, food: 100_000,
    coords: { x: 0, y: 0 }, adjacentCityIds: [],
  } as unknown as City);

  it('a market multiplies gold income vs none', () => {
    const none = tickCityEconomy(baseCity(), 'spring', [], 'normal', 0, 'clear', []);
    const withMkt = tickCityEconomy(baseCity(), 'spring', [], 'normal', 0, 'clear', [mk('market', 3)]);
    expect(withMkt.goldIncome).toBeGreaterThan(none.goldIncome);
  });

  it('irrigation softens a drought harvest', () => {
    const bare = tickCityEconomy(baseCity(), 'autumn', [], 'normal', 0, 'drought', []);
    const irrig = tickCityEconomy(baseCity(), 'autumn', [], 'normal', 0, 'drought', [mk('irrigation', 3)]);
    expect(irrig.foodIncome).toBeGreaterThan(bare.foodIncome);
  });

  it('field-hospital wound bonus speeds tickAfflictions recovery', () => {
    const wounded = { id: 'o1', afflictions: [{ kind: 'wound', seasons: 3, war: -8 }] } as unknown as Officer;
    const normal = tickAfflictions(wounded);              // 3 → 2
    const healed = tickAfflictions(wounded, 2);           // 3 → 0 (cleared)
    expect((normal.afflictions ?? []).length).toBe(1);
    expect(healed.afflictions ?? []).toHaveLength(0);
  });
});
