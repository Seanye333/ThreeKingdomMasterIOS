/**
 * Integration test for the 名產名物 strategic-goods overhaul, driven through the
 * REAL store + season engine: development investment, medicine production &
 * convoy, monopoly/embargo gating, the capital entrepôt, and a multi-season
 * "playthrough" sanity sweep (no NaN / runaway values leak out of resolution).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

// endSeason's autosave touches localStorage; stub it for the node env.
beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  if (!g.localStorage) {
    const mem = new Map<string, string>();
    g.localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: (i: number) => [...mem.keys()][i] ?? null,
      get length() { return mem.size; },
    };
  }
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import { CITY_SPECIALTY, SPECIALTY_DEV_MAX } from '../data/specialties';
import { ITEMS_BY_ID } from '../data/items';
import type { City } from '../types';

const s = () => useGameStore.getState();
const pid = () => s().playerForceId!;
const idsOfSpecialty = (sid: string) => Object.keys(CITY_SPECIALTY).filter((id) => CITY_SPECIALTY[id] === sid);

/** Force-assign a city to the player with healthy defaults, returning its id. */
function giveCity(cityId: string, patch: Partial<City> = {}) {
  const st = s();
  const c = st.cities[cityId];
  if (!c) throw new Error(`no city ${cityId}`);
  useGameStore.setState({
    cities: {
      ...st.cities,
      [cityId]: { ...c, ownerForceId: pid(), ruined: false, loyalty: 90, gold: 5000, food: 20000, troops: 2000, ...patch },
    },
  });
  return cityId;
}

/** Park the calendar on a season boundary so the next endSeason() crosses it. */
function parkOnSeasonBoundary() {
  useGameStore.setState({ date: { ...s().date, month: 3, phase: 'lower' } });
}

describe('名產 strategic-goods — store integration', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('興名產作坊 raises development, deducts gold, and caps out', () => {
    const id = giveCity(idsOfSpecialty('brocade')[0], { gold: 100000, loyalty: 90 });
    const before = s().cities[id].gold;
    const r = s().developSpecialty(id);
    expect(r.ok).toBe(true);
    expect(s().cities[id].specialtyDev).toBe(1);
    expect(s().cities[id].gold).toBeLessThan(before);
    // Drive it to the cap, then it should refuse.
    for (let i = 0; i < SPECIALTY_DEV_MAX + 2; i++) s().developSpecialty(id);
    expect(s().cities[id].specialtyDev).toBe(SPECIALTY_DEV_MAX);
    expect(s().developSpecialty(id).ok).toBe(false);
  });

  it('興名產作坊 refuses a restless populace (loyalty < 40)', () => {
    const id = giveCity(idsOfSpecialty('salt')[0], { loyalty: 20, gold: 100000 });
    expect(s().developSpecialty(id).ok).toBe(false);
    expect(s().cities[id].specialtyDev ?? 0).toBe(0);
  });

  it('a herb city gathers medicine at the season boundary', () => {
    const id = giveCity(idsOfSpecialty('herb')[0], { medicine: 0, loyalty: 90 });
    expect(s().cities[id].medicine ?? 0).toBe(0);
    parkOnSeasonBoundary();
    s().endSeason();
    expect(s().cities[id].medicine ?? 0).toBeGreaterThan(0);
  });

  it('禁運 requires a 專營 monopoly, then can be imposed and lifted', () => {
    const salt = idsOfSpecialty('salt');
    // Own just one salt city — not a monopoly → embargo refused.
    giveCity(salt[0]);
    const rivalId = s().forces[Object.keys(s().forces).find((f) => f !== pid())!]?.id;
    expect(rivalId).toBeTruthy();
    expect(s().setEmbargo(rivalId!, 'rations', true).ok).toBe(false);
    // Own every salt city → full monopoly → embargo allowed, then liftable.
    salt.forEach((id) => giveCity(id));
    expect(s().setEmbargo(rivalId!, 'rations', true).ok).toBe(true);
    expect((s().embargoes ?? []).some((e) => e.against === rivalId && e.role === 'rations')).toBe(true);
    expect(s().setEmbargo(rivalId!, 'rations', false).ok).toBe(true);
    expect((s().embargoes ?? []).some((e) => e.against === rivalId && e.role === 'rations')).toBe(false);
  });

  it('輜重 can carry medicine: it leaves the source and rides in the convoy', () => {
    const src = giveCity(idsOfSpecialty('herb')[0], { medicine: 1000 });
    // A second owned, ADJACENT city to ship to (convoy needs a valid route).
    const adj = s().cities[src].adjacentCityIds.find((a) => s().cities[a]);
    const dst = giveCity(adj!);
    // Place an idle officer in the source city to escort the column.
    const officer = Object.values(s().officers).find((o) => o.forceId === pid() && o.status !== 'dead');
    expect(officer).toBeTruthy();
    useGameStore.setState({
      officers: { ...s().officers, [officer!.id]: { ...officer!, locationCityId: src, status: 'idle', task: null } },
    });
    const medBefore = s().cities[src].medicine ?? 0;
    const r = s().dispatchConvoy(src, dst, 0, 0, 0, officer!.id, false, 0, 0, 500);
    expect(r.ok).toBe(true);
    expect(s().cities[src].medicine ?? 0).toBeLessThan(medBefore);     // drawn from source
    const convoy = Object.values(s().convoys ?? {}).find((c) => (c.medicine ?? 0) > 0);
    expect(convoy, 'a convoy carrying medicine should exist').toBeTruthy();
  });

  it('the capital draws 名物萃京 entrepôt income from a diverse empire', () => {
    // Own one city of several DIFFERENT specialties + the capital.
    ['brocade', 'salt', 'herb', 'horse', 'iron'].forEach((sid) => giveCity(idsOfSpecialty(sid)[0]));
    const cap = s().cities[s().forces[pid()].capitalCityId];
    giveCity(cap.id, { gold: 1000, troops: 5000, food: 50000 });
    const goldBefore = s().cities[cap.id].gold;
    parkOnSeasonBoundary();
    s().endSeason();
    // Capital gold should have risen (tax + entrepôt) — and never go NaN.
    expect(Number.isFinite(s().cities[cap.id].gold)).toBe(true);
    expect(s().cities[cap.id].gold).toBeGreaterThan(goldBefore);
  });

  it('名駒入廄: a developed horse city eventually foals a famous mount', () => {
    const horseId = idsOfSpecialty('horse')[0];
    let foaled = false;
    // Re-assert ownership + max development each season (so the run survives the
    // live AI/battle churn), park on a boundary, and watch the 藏寶池 for a mount.
    for (let i = 0; i < 40 && !foaled; i++) {
      giveCity(horseId, { specialtyDev: 5, loyalty: 95, troops: 8000, food: 60000 });
      parkOnSeasonBoundary();
      s().endSeason();
      foaled = s().lostItems.some((li) => li.cityId === horseId && (ITEMS_BY_ID[li.itemId] as { kind?: string })?.kind === 'horse');
    }
    expect(foaled, 'a max-dev 名馬 city should foal a named mount within 40 seasons').toBe(true);
  });

  it('a multi-season playthrough keeps every city stat finite (no NaN leak)', () => {
    // Seed the player with a spread of strategic goods, then run several seasons.
    ['brocade', 'salt', 'herb', 'horse', 'iron', 'timber', 'copper'].forEach((sid) => giveCity(idsOfSpecialty(sid)[0], { specialtyDev: 3 }));
    for (let i = 0; i < 6; i++) s().endSeason();
    for (const c of Object.values(s().cities)) {
      expect(Number.isFinite(c.gold), `gold finite @ ${c.id}`).toBe(true);
      expect(Number.isFinite(c.food), `food finite @ ${c.id}`).toBe(true);
      expect(Number.isFinite(c.medicine ?? 0), `medicine finite @ ${c.id}`).toBe(true);
      expect(Number.isFinite(c.warhorses ?? 0), `warhorses finite @ ${c.id}`).toBe(true);
      expect((c.specialtyDev ?? 0) <= SPECIALTY_DEV_MAX).toBe(true);
    }
    // Inflation (touched by copper relief) stays in band.
    expect(s().inflation).toBeGreaterThanOrEqual(0);
    expect(s().inflation).toBeLessThanOrEqual(100);
  });
});
