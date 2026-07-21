import { describe, it, expect } from 'vitest';
import { rollBehaviorEvent, BEHAVIOR_CHOICE_FLAGS, type BehaviorEventContext } from './behaviorEvents';
import type { City, Force, Officer, TaxRate } from '../types';

const ruler = (id: string, forceId: string): Officer => ({
  id, forceId, status: 'active',
  name: { zh: '君', en: 'Ruler' },
  stats: { leadership: 80, war: 80, intelligence: 80, politics: 80, charisma: 80 },
} as unknown as Officer);

const idleOfficer = (id: string, forceId: string, stat: number): Officer => ({
  id, forceId, status: 'idle',
  name: { zh: id, en: id },
  stats: { leadership: stat, war: stat, intelligence: stat, politics: stat, charisma: stat },
} as unknown as Officer);

const city = (id: string, forceId: string, gold: number, loyalty: number): City =>
  ({ id, ownerForceId: forceId, gold, loyalty } as unknown as City);

const force = (id: string, rulerOfficerId: string): Force =>
  ({ id, rulerOfficerId, name: { zh: id, en: id } } as unknown as Force);

function ctx(over: Partial<BehaviorEventContext> = {}): BehaviorEventContext {
  return {
    date: { year: 200, season: 'spring' } as BehaviorEventContext['date'],
    cities: { c1: city('c1', 'p', 1000, 70), c2: city('c2', 'p', 1000, 70) },
    officers: { r: ruler('r', 'p') },
    forces: { p: force('p', 'r') },
    taxPolicy: { p: 'normal' as TaxRate },
    playerForceId: 'p',
    firedEventIds: [],
    rng: () => 0, // always pass the per-season roll
    ...over,
  };
}

describe('rollBehaviorEvent', () => {
  it('returns null with no player force', () => {
    expect(rollBehaviorEvent(ctx({ playerForceId: null }))).toBeNull();
  });

  it('returns null when no threshold is crossed', () => {
    expect(rollBehaviorEvent(ctx())).toBeNull();
  });

  it('fires the treasury event on a surplus, as a player choice', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: { c1: city('c1', 'p', 5000, 70), c2: city('c2', 'p', 5000, 70) },
    }));
    expect(ev?.id).toBe('behavior-treasury');
    // The player's ruler is the chooser, so the modal will offer the decision.
    expect(ev?.chooserRulerId).toBe('r');
    expect(ev?.choices?.length).toBe(3);
    expect(ev?.mood).toBe('auspicious');
    // No immediate effect — all consequence rides on the choice.
    expect(ev?.effects).toEqual([]);
  });

  it('does not re-fire an event already in firedEventIds', () => {
    const surplus = { c1: city('c1', 'p', 5000, 70), c2: city('c2', 'p', 5000, 70) };
    expect(rollBehaviorEvent(ctx({ cities: surplus, firedEventIds: ['behavior-treasury'] }))).toBeNull();
  });

  it('fires the heavy-tax event when taxes are heavy and cities are sullen', () => {
    const ev = rollBehaviorEvent(ctx({
      taxPolicy: { p: 'heavy' },
      cities: { c1: city('c1', 'p', 1000, 30), c2: city('c2', 'p', 1000, 35) },
    }));
    expect(ev?.id).toBe('behavior-heavy-tax');
    expect(ev?.mood).toBe('ominous');
    // Easing taxes lifts every owned city's loyalty.
    const ease = ev?.choices?.find((c) => c.id === 'ease');
    expect(ease?.effects.length).toBe(2);
    expect(ease?.effects.every((e) => e.kind === 'city-loyalty')).toBe(true);
  });

  it('fires the treasury-crisis event when the coffers run dry', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: { c1: city('c1', 'p', 200, 60), c2: city('c2', 'p', 200, 60) },
    }));
    expect(ev?.id).toBe('behavior-treasury-empty');
    expect(ev?.mood).toBe('ominous');
    expect(ev?.choices?.length).toBe(3);
  });

  it('fires the popular-rule event when cities are devoted', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: {
        c1: city('c1', 'p', 1000, 90),
        c2: city('c2', 'p', 1000, 88),
        c3: city('c3', 'p', 1000, 92),
      },
    }));
    expect(ev?.id).toBe('behavior-popular');
    expect(ev?.mood).toBe('auspicious');
  });

  it('fires the restless-officers event when loyalty rots (excluding the ruler)', () => {
    const lowLoyal = (id: string): Officer => ({
      ...idleOfficer(id, 'p', 60), loyalty: 20,
    } as unknown as Officer);
    const ev = rollBehaviorEvent(ctx({
      officers: { r: ruler('r', 'p'), a: lowLoyal('a'), b: lowLoyal('b') },
    }));
    expect(ev?.id).toBe('behavior-restless');
    expect(ev?.mood).toBe('ominous');
    const appease = ev?.choices?.find((c) => c.id === 'appease');
    expect(appease?.effects.some((e) => e.kind === 'officer-loyalty')).toBe(true);
  });

  it('fires the idle-talent event with 3+ idle high-stat officers', () => {
    const ev = rollBehaviorEvent(ctx({
      officers: {
        r: ruler('r', 'p'),
        a: idleOfficer('a', 'p', 75),
        b: idleOfficer('b', 'p', 80),
        d: idleOfficer('d', 'p', 72),
      },
    }));
    expect(ev?.id).toBe('behavior-idle-talent');
  });

  it('respects the per-season roll (no fire when the roll fails)', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: { c1: city('c1', 'p', 5000, 70), c2: city('c2', 'p', 5000, 70) },
      rng: () => 0.9, // fails the < 0.5 gate
    }));
    expect(ev).toBeNull();
  });
});

describe('§8.5 天命 beats — 勸進 & 眾叛親離', () => {
  const eightCities = Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [`c${i}`, city(`c${i}`, 'p', 500, 70)]),
  );

  it('at 天命所歸 with a broad realm the court urges the throne', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: eightCities,
      officers: { r: ruler('r', 'p'), a: idleOfficer('a', 'p', 70) },
      mandateByForce: { p: 92 },
    }));
    expect(ev?.id).toBe('behavior-mandate-urge');
    expect(ev?.chooserRulerId).toBe('r');
    expect(ev?.choices?.some((c) => c.effects.some((e) => e.kind === 'mandate-ruler'))).toBe(true);
  });

  it('needs both the mandate and the realm — 90 mandate with 2 cities stays quiet', () => {
    const ev = rollBehaviorEvent(ctx({ mandateByForce: { p: 92 } }));
    expect(ev?.id).not.toBe('behavior-mandate-urge');
  });

  it('a mandate in ashes brings 眾叛親離', () => {
    const ev = rollBehaviorEvent(ctx({ mandateByForce: { p: 5 } }));
    expect(ev?.id).toBe('behavior-mandate-collapse');
    // The penance path lifts the mandate back.
    const penance = ev?.choices?.find((c) => c.id === 'penance');
    expect(penance?.effects.some((e) => e.kind === 'mandate-ruler' && e.delta > 0)).toBe(true);
  });
});

// ── 2026-07 民政抉擇(§1.11–§1.15)──

const civicCity = (id: string, over: Partial<City>): City =>
  ({ id, ownerForceId: 'p', gold: 1000, loyalty: 70, ...over } as unknown as City);

const fourCities = (over: Partial<City>) => ({
  c1: civicCity('c1', over), c2: civicCity('c2', over),
  c3: civicCity('c3', over), c4: civicCity('c4', over),
});

describe('民政抉擇事件', () => {
  it('刑名之議 fires on a choked docket and offers three roads', () => {
    const ev = rollBehaviorEvent(ctx({ cities: fourCities({ caseload: 60 }) }));
    expect(ev?.id).toBe('behavior-law-debate');
    expect(ev?.choices?.map((c) => c.id)).toEqual(['strict', 'lenient', 'judges']);
    expect(ev?.effects).toEqual([]);          // all consequence rides on the choice
  });

  it('刑名之議 stays quiet while the courts keep up', () => {
    expect(rollBehaviorEvent(ctx({ cities: fourCities({ caseload: 10 }) }))).toBeNull();
  });

  it('豪右抗命 fires when the registers have been swallowed, and the audit costs a clan lord', () => {
    const ev = rollBehaviorEvent(ctx({
      cities: fourCities({ hiddenHouseholds: 30 }),
      officers: { r: ruler('r', 'p'), a: idleOfficer('a', 'p', 80) },
    }));
    expect(ev?.id).toBe('behavior-gentry-defiance');
    const audit = ev?.choices?.find((c) => c.id === 'audit');
    expect(audit?.effects.some((e) => e.kind === 'officer-loyalty' && e.delta < 0)).toBe(true);
  });

  it('米貴如珠 fires on ONE cornered city, not a realm average', () => {
    const cities = { ...fourCities({ hoardedGrain: 0 }) };
    cities.c3 = civicCity('c3', { hoardedGrain: 35 });
    const ev = rollBehaviorEvent(ctx({ cities }));
    expect(ev?.id).toBe('behavior-grain-corner');
    // Letting them profit pays well and costs loyalty everywhere.
    const tax = ev?.choices?.find((c) => c.id === 'tax');
    expect(tax?.effects.some((e) => e.kind === 'force-gold' && e.delta > 0)).toBe(true);
    expect(tax?.effects.filter((e) => e.kind === 'city-loyalty').length).toBe(4);
  });

  it('民力已竭 needs BOTH heavy corvée and a resentful realm', () => {
    const worn = fourCities({ loyalty: 40 });
    expect(rollBehaviorEvent(ctx({ cities: worn }))).toBeNull();                       // no levy
    expect(rollBehaviorEvent(ctx({ cities: fourCities({ loyalty: 80 }), corvee: { p: 'heavy' } })))
      .toBeNull();                                                                     // levy but content
    const ev = rollBehaviorEvent(ctx({ cities: worn, corvee: { p: 'heavy' } }));
    expect(ev?.id).toBe('behavior-corvee-strain');
    expect(ev?.choices?.map((c) => c.id)).toEqual(['rest', 'press', 'pay']);
  });

  it('each civic beat fires at most once per campaign', () => {
    const cities = fourCities({ caseload: 60 });
    expect(rollBehaviorEvent(ctx({ cities, firedEventIds: ['behavior-law-debate'] })))
      .not.toMatchObject({ id: 'behavior-law-debate' });
  });
});

/** Every behavioural beat that predates the 2026-07-21 institution batch.
 *  Suppressing them isolates one new candidate at a time — candidates are
 *  evaluated in order and only the first eligible one fires. */
const OLDER_BEATS = [
  'behavior-law-debate', 'behavior-gentry-defiance', 'behavior-grain-corner',
  'behavior-corvee-strain', 'behavior-mandate-urge', 'behavior-mandate-collapse',
  'behavior-treasury', 'behavior-heavy-tax', 'behavior-treasury-empty',
  'behavior-popular', 'behavior-restless', 'behavior-idle-talent',
];

describe('制度抉擇事件 (§1.16–§4.11)', () => {
  const bigCities = (over: Partial<City> = {}) => Object.fromEntries(
    ['c1', 'c2', 'c3', 'c4'].map((id) => [id, {
      id, ownerForceId: 'p', gold: 300, loyalty: 70, troops: 9000, commerce: 40,
      name: { zh: id, en: id }, armaments: 40, wounded: 0,
      ...over,
    } as unknown as City]),
  );

  const only = (over: Partial<BehaviorEventContext>, alsoFired: string[] = []) =>
    ctx({ firedEventIds: [...OLDER_BEATS, ...alsoFired], ...over });

  it('大錢之議 only when the treasury actually bites', () => {
    const rich = only({ cities: bigCities({ gold: 9000 }), coinStandard: { p: 'wuzhu' } });
    expect(rollBehaviorEvent(rich)?.id).not.toBe('behavior-debase-coin');
    const broke = only({ cities: bigCities({ gold: 100 }), coinStandard: { p: 'wuzhu' } });
    const fired = rollBehaviorEvent(broke);
    expect(fired?.id).toBe('behavior-debase-coin');
    // Three real answers, and the historical one is the trap.
    expect(fired?.choices?.map((c) => c.id)).toEqual(['debase', 'refuse', 'grain-cloth']);
  });

  it('…and never while the realm is already on 大錢 or 穀帛', () => {
    expect(rollBehaviorEvent(only({
      cities: bigCities({ gold: 100 }), coinStandard: { p: 'daqian' },
    }))?.id).not.toBe('behavior-debase-coin');
  });

  it('欠餉 needs a PAID army and a thin treasury', () => {
    const levied = only({ cities: bigCities({ gold: 100 }), serviceSystem: { p: 'levy' } });
    expect(rollBehaviorEvent(levied)?.id).not.toBe('behavior-wage-arrears');
    const hired = only({
      cities: bigCities({ gold: 100 }), serviceSystem: { p: 'paid' },
      coinStandard: { p: 'daqian' },   // keep the debasement beat out of the way
    });
    expect(rollBehaviorEvent(hired)?.id).toBe('behavior-wage-arrears');
  });

  it('商賈請榷 needs a real merchant city and the 平糴 default', () => {
    const quiet = only({ cities: bigCities({ gold: 9000, commerce: 20 }) });
    expect(rollBehaviorEvent(quiet)?.id).not.toBe('behavior-merchant-petition');
    const busy = only({ cities: bigCities({ gold: 9000, commerce: 80 }) });
    expect(rollBehaviorEvent(busy)?.id).toBe('behavior-merchant-petition');
    // …and not once the roads are already open or shut.
    expect(rollBehaviorEvent(only({
      cities: bigCities({ gold: 9000, commerce: 80 }), grainPolicy: { p: 'open' },
    }))?.id).not.toBe('behavior-merchant-petition');
  });

  it('傷卒滿營 needs wounded actually in the camps', () => {
    expect(rollBehaviorEvent(only({ cities: bigCities({ gold: 9000, commerce: 20 }) }))?.id)
      .not.toBe('behavior-wounded-overflow');
    expect(rollBehaviorEvent(only({
      cities: bigCities({ gold: 9000, commerce: 20, wounded: 3000 }),
    }))?.id).toBe('behavior-wounded-overflow');
  });

  it('甲兵不修 needs a real army and an empty armoury', () => {
    expect(rollBehaviorEvent(only({ cities: bigCities({ gold: 9000, commerce: 20, armaments: 60 }) }))?.id)
      .not.toBe('behavior-arms-shortage');
    expect(rollBehaviorEvent(only({
      cities: bigCities({ gold: 9000, commerce: 20, armaments: 2 }),
    }))?.id).toBe('behavior-arms-shortage');
  });

  it('every new beat fires at most once per campaign', () => {
    const ids = [
      'behavior-debase-coin', 'behavior-wage-arrears', 'behavior-merchant-petition',
      'behavior-wounded-overflow', 'behavior-arms-shortage',
    ];
    const c = ctx({
      cities: bigCities({ gold: 100, commerce: 80, wounded: 4000, armaments: 2 }),
      serviceSystem: { p: 'paid' },
      firedEventIds: [...OLDER_BEATS, ...ids],
    });
    const fired = rollBehaviorEvent(c);
    expect(fired && ids.includes(fired.id)).toBeFalsy();
  });
});

describe('BEHAVIOR_CHOICE_FLAGS', () => {
  it('lists every flag a player-pickable choice in this file can set', () => {
    // Build every candidate under maximally-permissive conditions and collect
    // the flags their choices set, so the declared list cannot silently drift
    // from the code (a stale list = a dead achievement reference).
    const seen = new Set<string>();
    const wide = () => ctx({
      cities: Object.fromEntries(['c1', 'c2', 'c3', 'c4', 'c5'].map((id) => [id, {
        id, ownerForceId: 'p', gold: 100, loyalty: 20, troops: 9000, commerce: 80,
        name: { zh: id, en: id }, armaments: 1, wounded: 5000,
        caseload: 90, hiddenHouseholds: 40, hoardedGrain: 35, culture: 0,
      } as unknown as City])),
      officers: { r: ruler('r', 'p'), a: idleOfficer('a', 'p', 85) },
      taxPolicy: { p: 'heavy' as TaxRate },
      corvee: { p: 'heavy' },
      serviceSystem: { p: 'paid' },
      mandateByForce: { p: 10 },
    });
    // Fire them one at a time by marking each previous winner as already fired.
    const firedSoFar: string[] = [];
    for (let i = 0; i < 40; i++) {
      const ev = rollBehaviorEvent(ctx({ ...wide(), firedEventIds: firedSoFar }));
      if (!ev) break;
      firedSoFar.push(ev.id);
      for (const c of ev.choices ?? []) {
        for (const eff of c.effects) if (eff.kind === 'flag') seen.add(eff.key);
      }
    }
    expect(seen.size).toBeGreaterThan(0);
    for (const key of seen) {
      expect(BEHAVIOR_CHOICE_FLAGS, `flag "${key}" is set by a choice but undeclared`).toContain(key);
    }
  });
});
