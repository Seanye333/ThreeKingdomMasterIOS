import { describe, it, expect } from 'vitest';
import { rollBehaviorEvent, type BehaviorEventContext } from './behaviorEvents';
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
