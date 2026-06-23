/** 徵兵 — conscription draws population and dents loyalty (民怨). */
import { describe, expect, it } from 'vitest';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { resolveInternalAffairs } from './commands';

const mkCity = (over: Partial<City> & { id: string }): City =>
  ({
    ownerForceId: 'wei', troops: 4000, gold: 5000, food: 40000,
    loyalty: 80, agriculture: 60, commerce: 60, defense: 60, population: 200000,
    adjacentCityIds: [], name: { zh: over.id, en: over.id },
    ...over,
  } as unknown as City);

describe('徵兵 — conscription costs population and loyalty', () => {
  it('raises troops, draws ~1.4× as many people, and dents loyalty', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 80 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'ye', population: 200000, loyalty: 80 }), () => 0.5);
    expect(res.success).toBe(true);
    expect(res.delta?.troops).toBeGreaterThan(0);
    expect(res.delta?.population).toBe(-Math.round(res.delta!.troops! * 1.4));
    expect(res.delta?.loyalty).toBeLessThan(0); // 民怨
    expect(res.delta?.loyalty).toBeGreaterThanOrEqual(-8);
  });

  it('every successful levy stings loyalty by at least 1', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 80 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'big', population: 400000 }), () => 0.5);
    expect(res.success).toBe(true);
    expect(res.delta!.loyalty!).toBeLessThanOrEqual(-1);
  });

  it('a near-empty city cannot levy and pays no loyalty', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 60 } });
    const res = resolveInternalAffairs('recruit-troops', o, mkCity({ id: 'hamlet', population: 50, loyalty: 80 }), () => 0.5);
    expect(res.success).toBe(false);
    expect(res.delta?.loyalty ?? 0).toBe(0);
  });
});

/** Plays back a fixed sequence of rng draws (cycling) so multi-roll commands
 *  are deterministic. developmentGain draws [variance, crit] per call. */
const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

describe('勸農/興商 — talent reads, with a 良吏豐政 crit', () => {
  it('a 政治95 名臣 out-develops a 政治60 庸吏 on the same roll', () => {
    const city = mkCity({ id: 'ye', agriculture: 60, population: 200000 });
    const elite = mkOfficer({ id: 'xun', stats: { politics: 95 } });
    const plain = mkOfficer({ id: 'hack', stats: { politics: 60 } });
    const eliteGain = resolveInternalAffairs('develop-agriculture', elite, city, () => 0.5).delta!.agriculture!;
    const plainGain = resolveInternalAffairs('develop-agriculture', plain, city, () => 0.5).delta!.agriculture!;
    expect(eliteGain).toBeGreaterThan(plainGain);
  });

  it('良吏豐政 crit boosts the increment over the same no-crit roll', () => {
    const city = mkCity({ id: 'ye', commerce: 60, population: 200000 });
    const o = mkOfficer({ id: 'gov', stats: { politics: 60 } });
    // Draw order for a develop command: [mishap, variance, crit]. 0.9 dodges
    // the mishap; variance 0; final 0 triggers the crit, 0.9 does not.
    const crit = resolveInternalAffairs('develop-commerce', o, city, seq([0.9, 0, 0])).delta!.commerce!;
    const noCrit = resolveInternalAffairs('develop-commerce', o, city, seq([0.9, 0, 0.9])).delta!.commerce!;
    expect(crit).toBeGreaterThan(noCrit);
  });
});

describe('災異 — restive cities can suffer a setback instead of progress', () => {
  it('a low-loyalty city + an unlucky roll loses ground (negative delta, failure)', () => {
    const city = mkCity({ id: 'restive', agriculture: 60, loyalty: 10, population: 200000 });
    const o = mkOfficer({ id: 'gov', stats: { politics: 60 } });
    // loyalty 10 → risk ≈ 0.12; first draw 0 triggers it, second sizes the −1..−3.
    const res = resolveInternalAffairs('develop-agriculture', o, city, seq([0, 0]));
    expect(res.success).toBe(false);
    expect(res.delta!.agriculture!).toBeLessThan(0);
  });

  it('a contented, well-run city is safe on the same lucky roll', () => {
    const city = mkCity({ id: 'calm', agriculture: 60, loyalty: 100, population: 200000 });
    const o = mkOfficer({ id: 'gov', stats: { politics: 90 } });
    const res = resolveInternalAffairs('develop-agriculture', o, city, () => 0.9);
    expect(res.success).toBe(true);
    expect(res.delta!.agriculture!).toBeGreaterThan(0);
  });
});

describe('撫民 — diminishing returns near the loyalty cap', () => {
  it('a near-capped city gains less than an unsettled one on the same roll', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 60 } });
    const low = resolveInternalAffairs('improve-loyalty', o, mkCity({ id: 'a', loyalty: 30 }), () => 0.5);
    const high = resolveInternalAffairs('improve-loyalty', o, mkCity({ id: 'b', loyalty: 90 }), () => 0.5);
    expect(low.delta!.loyalty!).toBeGreaterThan(high.delta!.loyalty!);
    expect(high.delta!.loyalty!).toBeGreaterThanOrEqual(1); // still never a wasted action below cap
  });
});

describe('賑濟 — feed the people from the granary (food → loyalty)', () => {
  it('spends food and raises loyalty when the granary can cover it', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 70 } });
    const res = resolveInternalAffairs('relief', o, mkCity({ id: 'fed', population: 100000, food: 40000, loyalty: 70 }), () => 0.5);
    expect(res.success).toBe(true);
    expect(res.delta!.loyalty!).toBeGreaterThan(0);
    expect(res.delta!.food!).toBeLessThan(0);
  });

  it('a starving city has nothing to give', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 70 } });
    const res = resolveInternalAffairs('relief', o, mkCity({ id: 'starving', population: 100000, food: 100 }), () => 0.5);
    expect(res.success).toBe(false);
    expect(res.delta!.food ?? 0).toBe(0);
  });
});

describe('天時 × 内政 — weather bends the outcome', () => {
  it('賑濟 in a drought wins more goodwill for the same grain', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 70 } });
    const city = mkCity({ id: 'parched', population: 100000, food: 40000, loyalty: 50 });
    const clear = resolveInternalAffairs('relief', o, city, () => 0.5, undefined, 'clear');
    const drought = resolveInternalAffairs('relief', o, city, () => 0.5, undefined, 'drought');
    expect(drought.delta!.loyalty!).toBeGreaterThan(clear.delta!.loyalty!);
    expect(drought.delta!.food).toBe(clear.delta!.food); // same grain spent
  });

  it('drought raises 災異 risk — the same roll blights in a drought but is safe when clear', () => {
    const o = mkOfficer({ id: 'gov', stats: { politics: 60 } });
    const city = mkCity({ id: 'ye', agriculture: 60, loyalty: 80, population: 200000 });
    // risk ≈ 0.04 clear vs 0.10 drought; a 0.07 first-draw lands between them.
    const clear = resolveInternalAffairs('develop-agriculture', o, city, seq([0.07, 0.5, 0.9]), undefined, 'clear');
    const drought = resolveInternalAffairs('develop-agriculture', o, city, seq([0.07, 0]), undefined, 'drought');
    expect(clear.success).toBe(true);
    expect(clear.delta!.agriculture!).toBeGreaterThan(0);
    expect(drought.success).toBe(false);
    expect(drought.delta!.agriculture!).toBeLessThan(0);
  });
});

describe('巡查肅貪 — claw back graft (gold) + restore faith (loyalty)', () => {
  it('recovers gold scaling with commerce and lifts loyalty', () => {
    const o = mkOfficer({ id: 'gov', stats: { politics: 80 } });
    const rich = resolveInternalAffairs('anti-corruption', o, mkCity({ id: 'rich', commerce: 150, loyalty: 70 }), () => 0.5);
    const poor = resolveInternalAffairs('anti-corruption', o, mkCity({ id: 'poor', commerce: 30, loyalty: 70 }), () => 0.5);
    expect(rich.success).toBe(true);
    expect(rich.delta!.gold!).toBeGreaterThan(poor.delta!.gold!); // richer city → more graft
    expect(rich.delta!.loyalty!).toBeGreaterThan(0);
  });
});

describe('治水 — flood works (+ irrigation), capped at 3', () => {
  it('raises flood works and nudges agriculture', () => {
    const o = mkOfficer({ id: 'gov', stats: { politics: 60 } });
    const res = resolveInternalAffairs('flood-control', o, mkCity({ id: 'riverside', agriculture: 60, population: 200000 }), () => 0.5);
    expect(res.delta!.floodWorks).toBe(1);
    expect(res.delta!.agriculture!).toBeGreaterThan(0);
  });

  it('once works are maxed it only irrigates', () => {
    const o = mkOfficer({ id: 'gov', stats: { politics: 60 } });
    const res = resolveInternalAffairs('flood-control', o, mkCity({ id: 'maxed', agriculture: 60, floodWorks: 3, population: 200000 }), () => 0.5);
    expect(res.delta!.floodWorks).toBeUndefined();
    expect(res.delta!.agriculture!).toBeGreaterThan(0);
  });
});

describe('招撫流民 — diminishing pull and settling friction', () => {
  it('a crowded large city draws fewer refugees than a hamlet on the same roll', () => {
    const o = mkOfficer({ id: 'gov', stats: { charisma: 70 } });
    const hamlet = resolveInternalAffairs('encourage-migration', o, mkCity({ id: 'sml', population: 5000 }), () => 0.5);
    const large = resolveInternalAffairs('encourage-migration', o, mkCity({ id: 'big', population: 200000 }), () => 0.5);
    expect(hamlet.delta!.population!).toBeGreaterThan(large.delta!.population!);
  });

  it('low-charisma governors pay a settling-loyalty dip; charismatic ones (≥80) avoid it', () => {
    const city = mkCity({ id: 'ye', population: 100000 });
    const plain = mkOfficer({ id: 'a', stats: { charisma: 60 } });
    const charming = mkOfficer({ id: 'b', stats: { charisma: 85 } });
    expect(resolveInternalAffairs('encourage-migration', plain, city, () => 0.5).delta!.loyalty).toBe(-1);
    expect(resolveInternalAffairs('encourage-migration', charming, city, () => 0.5).delta!.loyalty).toBe(0);
  });
});
