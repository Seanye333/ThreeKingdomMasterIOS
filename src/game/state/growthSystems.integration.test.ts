/**
 * Integration test for the 武將成長 overhaul, driven through the REAL store +
 * season engine: the 拜師 (assignMentor), 研讀兵書 (studyManual) and 山長
 * (assignHeadmaster) actions, plus the 特訓 (special-training) command flowing
 * end-to-end through issueCommand → resolveSeason.
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
import type { City, Officer } from '../types';

const s = () => useGameStore.getState();
const pid = () => s().playerForceId!;

function giveCity(cityId: string, patch: Partial<City> = {}) {
  const st = s();
  const c = st.cities[cityId];
  if (!c) throw new Error(`no city ${cityId}`);
  useGameStore.setState({
    cities: { ...st.cities, [cityId]: { ...c, ownerForceId: pid(), ruined: false, loyalty: 90, gold: 5000, food: 20000, ...patch } },
  });
  return cityId;
}

/** Place a player officer in a city, idle and free to act. Returns the officer id. */
function placeOfficer(officerId: string, cityId: string, patch: Partial<Officer> = {}) {
  const o = s().officers[officerId];
  useGameStore.setState({
    officers: { ...s().officers, [officerId]: { ...o, forceId: pid(), locationCityId: cityId, status: 'idle', task: null, ...patch } },
  });
  return officerId;
}

function myOfficers(): Officer[] {
  return Object.values(s().officers).filter((o) => o.forceId === pid() && o.status !== 'dead' && o.status !== 'unsearched');
}

function myCity(): string {
  const owned = Object.values(s().cities).find((c) => c.ownerForceId === pid());
  return owned!.id;
}

function parkOnSeasonBoundary() {
  useGameStore.setState({ date: { ...s().date, month: 3, phase: 'lower' } });
}

describe('武將成長 — store integration', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('拜師 — assignMentor sets/clears the bond and rejects bad bonds', () => {
    const city = myCity();
    const [a, b] = myOfficers();
    placeOfficer(a.id, city);
    placeOfficer(b.id, city);
    expect(s().assignMentor(a.id, b.id).ok).toBe(true);
    expect(s().officers[a.id].mentorId).toBe(b.id);
    // Clear.
    expect(s().assignMentor(a.id, null).ok).toBe(true);
    expect(s().officers[a.id].mentorId).toBeUndefined();
    // Can't apprentice to yourself.
    expect(s().assignMentor(a.id, a.id).ok).toBe(false);
  });

  it('研讀兵書 — studyManual grants growth, lifts latent, and destroys the book', () => {
    const o = myOfficers()[0];
    placeOfficer(o.id, myCity(), { equipment: ['sunzi-bingfa'], xp: 0 });
    const before = s().officers[o.id];
    const latentBefore = before.latentStats?.war;
    const r = s().studyManual(o.id, 'sunzi-bingfa');
    expect(r.ok).toBe(true);
    const after = s().officers[o.id];
    expect((after.xp ?? 0)).toBeGreaterThan(0);                       // 歷練 +200
    expect(after.latentStats!.war).toBeGreaterThan(latentBefore ?? 0); // 武力潛能 +2
    expect(after.equipment).not.toContain('sunzi-bingfa');            // consumed
    // The book is gone — studying again is refused.
    expect(s().studyManual(o.id, 'sunzi-bingfa').ok).toBe(false);
  });

  it('山長 — assignHeadmaster binds an officer to a school (and rejects non-schools)', () => {
    const city = giveCity(myCity());
    const o = placeOfficer(myOfficers()[0].id, city);
    // Drop an academy into this city.
    useGameStore.setState({ buildings: [...s().buildings, { id: 'academy', cityId: city, level: 2, progress: 0 }] });
    expect(s().assignHeadmaster(city, 'academy', o).ok).toBe(true);
    const school = s().buildings.find((bd) => bd.cityId === city && bd.id === 'academy');
    expect(school?.headmasterId).toBe(o);
    // A market is not a school.
    expect(s().assignHeadmaster(city, 'market', o).ok).toBe(false);
    // Clearing works.
    expect(s().assignHeadmaster(city, 'academy', null).ok).toBe(true);
    expect(s().buildings.find((bd) => bd.cityId === city && bd.id === 'academy')?.headmasterId).toBeUndefined();
  });

  it('特訓 — issues for 400g and grows the officer through a full season', () => {
    const city = giveCity(myCity(), { gold: 5000 });
    const o = placeOfficer(myOfficers()[0].id, city, { xp: 0 });
    const goldBefore = s().cities[city].gold;
    const issue = s().issueCommand(city, 'special-training', o);
    expect(issue.ok).toBe(true);
    expect(s().cities[city].gold).toBe(goldBefore - 400);   // cost paid at issue
    const xpBefore = s().officers[o].xp ?? 0;
    parkOnSeasonBoundary();
    s().endSeason();
    expect((s().officers[o].xp ?? 0)).toBeGreaterThan(xpBefore); // 特訓 歷練 burst landed
  });
});
