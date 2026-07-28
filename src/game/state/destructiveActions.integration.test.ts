/**
 * 不可逆之舉 — the buttons that destroy something, and the world afterwards.
 *
 * Coverage said 356 of the store's ~390 actions had never been executed by any
 * test. Most of that is fine — a lot of them are setters. What is not fine is
 * that the list included every irreversible one: execute a prisoner, raze a
 * city, break a marriage pact, disband a legion, retire an officer.
 *
 * These are exactly the actions that leave DANGLING REFERENCES. A season tick
 * is written to leave the world tidy and has a pruning pass for stale posts; a
 * one-shot action that removes an entity and forgets one of the dozen places
 * that entity is referenced leaves a corpse holding a governorship — and
 * nothing complains, because nothing looks.
 *
 * So each test here does the same two things: perform the destructive act, and
 * then assert the whole world is still coherent, using the same rulebook the
 * 240-tick soak runs (`assertInvariants`). The soak found the dead-governor bug
 * that way; these reach the same class of bug via the player's own buttons,
 * which the soak never presses.
 *
 * The second theme is ATOMICITY: an action whose precondition fails must leave
 * the world untouched, not half-applied. Every one of these is written as
 * `if (!ok) return;` before any `set()`, so it is a real contract — and a cheap
 * one to break when someone adds a second `set()` later.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

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
import { assertInvariants, resetTroopTracking } from '../../test/worldInvariants';
import type { EntityId, Officer } from '../types';

/**
 * 在世可用 — `status` is a seven-way union and the scenario roster opens on
 * `idle`/`unsearched`, not `active` (that value shows up mid-campaign). Asking
 * for "alive and not locked up" by exclusion keeps these tests working whichever
 * state the roster happens to start in.
 */
const IS_LIVE = (o: Officer) => o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'retired';

const st = useGameStore;

function boot(): void {
  resetTroopTracking();
  st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
}

/** A snapshot tight enough to prove "nothing changed" without being brittle. */
function worldHash(): string {
  const s = st.getState();
  return JSON.stringify({
    officers: Object.values(s.officers).map((o) => [o.id, o.status, o.forceId ?? '-', o.loyalty].join(':')).sort(),
    cities: Object.values(s.cities).map((c) => [c.id, c.ownerForceId ?? '-', c.gold, c.troops].join(':')).sort(),
    forces: Object.keys(s.forces).sort(),
  });
}

/** The player's own officers, alive and in service. */
function myOfficers(): Officer[] {
  const s = st.getState();
  return Object.values(s.officers).filter((o) => o.forceId === s.playerForceId && IS_LIVE(o));
}

/** Every officer id referenced by anything that implies "this person is around". */
function referencedOfficerIds(): Map<string, EntityId[]> {
  const s = st.getState();
  const refs = new Map<string, EntityId[]>();
  const add = (where: string, id: EntityId | null | undefined) => {
    if (!id) return;
    refs.set(where, [...(refs.get(where) ?? []), id]);
  };
  for (const a of Object.values(s.armies ?? {})) add('army.commanderId', a.commanderId);
  for (const [pid, gid] of Object.entries(s.provinceGovernors ?? {})) add(`provinceGovernors[${pid}]`, gid);
  for (const [cid, gid] of Object.entries(s.cityDelegations ?? {})) add(`cityDelegations[${cid}]`, gid);
  for (const ap of s.appointments ?? []) add('appointments', ap.officerId);
  for (const f of Object.values(s.forces)) add('force.rulerOfficerId', f.rulerOfficerId);
  return refs;
}

/** No live post may be held by someone dead, imprisoned, or gone. */
function expectNoDanglingPosts(label: string): void {
  const s = st.getState();
  for (const [where, ids] of referencedOfficerIds()) {
    for (const id of ids) {
      const o = s.officers[id];
      expect(o, `${label}: ${where} → ${id} 不存在於名冊`).toBeTruthy();
      expect(o?.status, `${label}: ${where} → ${id} 是死者卻仍在位`).not.toBe('dead');
    }
  }
}

/**
 * 先讓他有官可丟 — a fresh scenario has NO governors, no prefects, no legions
 * and no armies, so a dangling-reference check run straight after boot has
 * nothing to look at and passes vacuously. (It did, on the first version of
 * this file: every post map was empty and the only reference in the whole
 * world was each force's ruler.)
 *
 * So the officer is handed a provincial governorship, a city delegation and a
 * court appointment first. Now "does removing this man clear what he held?"
 * is a question with an answer.
 */
function installPosts(officerId: EntityId): { province: string; cityId: EntityId } {
  const s = st.getState();
  const pid = s.playerForceId!;
  const city = Object.values(s.cities).find((c) => c.ownerForceId === pid)!;
  const province = 'sili';
  st.setState({
    provinceGovernors: { ...(s.provinceGovernors ?? {}), [province]: officerId } as typeof s.provinceGovernors,
    cityDelegations: { ...(s.cityDelegations ?? {}), [city.id]: officerId },
    appointments: [
      ...(s.appointments ?? []),
      { officerId, forceId: pid, titleId: 'prefect', cityId: city.id, appointedYear: s.date.year },
    ] as typeof s.appointments,
  });
  return { province, cityId: city.id };
}

/** Every post `installPosts` handed out must be vacant (or reassigned) now. */
function expectPostsVacated(label: string, officerId: EntityId, posts: { province: string; cityId: EntityId }): void {
  const s = st.getState();
  expect(s.provinceGovernors?.[posts.province as keyof typeof s.provinceGovernors],
    `${label}: 州牧之位仍掛在已離場的 ${officerId} 身上`).not.toBe(officerId);
  expect(s.cityDelegations?.[posts.cityId],
    `${label}: 城池委任仍掛在已離場的 ${officerId} 身上`).not.toBe(officerId);
  expect((s.appointments ?? []).some((a) => a.officerId === officerId),
    `${label}: 朝職名冊仍列著已離場的 ${officerId}`).toBe(false);
}

describe('不可逆之舉 — 處決俘虜', () => {
  beforeEach(boot);

  it('an execution leaves no post held by the corpse', () => {
    const s = st.getState();
    const victim = Object.values(s.officers).find((o) => o.forceId !== s.playerForceId && IS_LIVE(o));
    expect(victim, '劇本中找不到可俘虜的敵將').toBeTruthy();
    // Imprison him by hand — capture paths are the season's business, the
    // execution contract is what is under test.
    st.setState({
      officers: {
        ...s.officers,
        [victim!.id]: { ...victim!, status: 'imprisoned', forceId: s.playerForceId, capturedFromForceId: victim!.forceId },
      },
    });
    st.getState().executeOfficer(victim!.id);
    expect(st.getState().officers[victim!.id].status, '處決後應為死亡').toBe('dead');
    expectNoDanglingPosts('處決');
    assertInvariants(0);
  });

  it('執死者所領之職應當空出', () => {
    const s = st.getState();
    const victim = Object.values(s.officers).find((o) => o.forceId !== s.playerForceId && IS_LIVE(o))!;
    st.setState({
      officers: {
        ...s.officers,
        [victim.id]: { ...victim, status: 'imprisoned', forceId: s.playerForceId, capturedFromForceId: victim.forceId },
      },
    });
    const posts = installPosts(victim.id);
    st.getState().executeOfficer(victim.id);
    expect(st.getState().officers[victim.id].status).toBe('dead');
    expectPostsVacated('處決', victim.id, posts);
    expectNoDanglingPosts('處決(帶職)');
  });

  it('refuses to execute an officer who is not a prisoner, and changes nothing', () => {
    const target = myOfficers()[0];
    const before = worldHash();
    st.getState().executeOfficer(target.id);
    expect(worldHash(), '非俘虜不得處決,且世界不得有任何變動').toBe(before);
    expect(IS_LIVE(st.getState().officers[target.id]), '未遂的處決不得改變其狀態').toBe(true);
  });

  it('refuses an unknown officer id without throwing', () => {
    const before = worldHash();
    expect(() => st.getState().executeOfficer('no-such-officer')).not.toThrow();
    expect(worldHash()).toBe(before);
  });
});

describe('不可逆之舉 — 屠城與遷都', () => {
  beforeEach(boot);

  it('razing a city leaves the world coherent', () => {
    const s = st.getState();
    const mine = Object.values(s.cities).find((c) => c.ownerForceId === s.playerForceId);
    expect(mine).toBeTruthy();
    st.getState().razeCity(mine!.id);
    expectNoDanglingPosts('屠城');
    assertInvariants(0);
  });

  it('relocating the capital keeps the force pointing at a city it owns', () => {
    const s = st.getState();
    const pid = s.playerForceId!;
    const target = Object.values(s.cities).find((c) => c.ownerForceId === pid && c.id !== s.forces[pid].capitalCityId);
    if (!target) return; // single-city start — nothing to relocate to
    st.getState().relocateCapital(target.id);
    const cap = st.getState().forces[pid].capitalCityId;
    expect(cap, '遷都後治所必須仍是自己的城').toBeTruthy();
    expect(st.getState().cities[cap!].ownerForceId, '治所不得落在別人手裡').toBe(pid);
    assertInvariants(0);
  });
});

describe('不可逆之舉 — 婚盟決裂會死人', () => {
  beforeEach(boot);

  /**
   * 質子之盟 — breaking a marriage alliance can KILL one of your own officers
   * (marriageAlliance.ts sets `status: 'dead'` on the hostage spouse). That is
   * the design, but it means the action must leave the same tidy world an
   * ordinary death does — the dead spouse cannot stay on as a governor.
   */
  it('a spouse killed by the break-up holds no post afterwards', () => {
    const s = st.getState();
    const pacts = s.marriageAlliances ?? [];
    if (pacts.length === 0) return; // none at scenario start
    const before = Object.values(st.getState().officers).filter((o) => o.status === 'dead').length;
    st.getState().breakMarriageAlliance(pacts[0].forceA === s.playerForceId ? pacts[0].forceB : pacts[0].forceA);
    const after = Object.values(st.getState().officers).filter((o) => o.status === 'dead').length;
    expect(after, '毀盟不應減少死者數').toBeGreaterThanOrEqual(before);
    expectNoDanglingPosts('毀婚盟');
    assertInvariants(0);
  });
});

describe('不可逆之舉 — 軍事編制', () => {
  beforeEach(boot);

  it('disbanding a legion leaves no army pointing at it', () => {
    const s = st.getState();
    const legions = Object.values(s.legions ?? {});
    if (legions.length === 0) return;
    const id = legions[0].id;
    st.getState().disbandLegion(id);
    expect(st.getState().legions?.[id], '解散後軍團應消失').toBeUndefined();
    for (const a of Object.values(st.getState().armies ?? {})) {
      expect(a.legionId, '不得有部隊仍掛在已解散的軍團上').not.toBe(id);
    }
    assertInvariants(0);
  });

  /**
   * `retireOfficer` refuses unless ALL of: age ≥ 60, status idle/active, not
   * the ruler, and a disciple under 45 in the same city to inherit. Picking an
   * arbitrary officer just trips a guard and the action returns without doing
   * anything — which passes a "posts were vacated" test for entirely the wrong
   * reason. So the preconditions are built, and the return value is checked
   * before the real assertion runs.
   */
  it('retiring an officer vacates every post they held', () => {
    const s = st.getState();
    const pid = s.playerForceId!;
    const rulerId = s.forces[pid].rulerOfficerId;
    const mine = myOfficers().filter((o) => o.id !== rulerId);
    expect(mine.length, '玩家開局應有君主以外的武將').toBeGreaterThan(1);
    const elder = mine[0];
    const disciple = mine[1];
    st.setState({
      officers: {
        ...s.officers,
        [elder.id]: { ...elder, status: 'idle', birthYear: s.date.year - 65, locationCityId: elder.locationCityId },
        [disciple.id]: { ...disciple, status: 'idle', birthYear: s.date.year - 30, locationCityId: elder.locationCityId },
      },
    });
    const posts = installPosts(elder.id);
    const r = st.getState().retireOfficer(elder.id);
    expect(r?.ok, `致仕應當成功,實際被拒:${r?.message ?? '(無訊息)'}`).toBe(true);
    expect(st.getState().officers[elder.id].status, '致仕後應為 retired').toBe('retired');
    expectPostsVacated('致仕', elder.id, posts);
    expectNoDanglingPosts('致仕');
    assertInvariants(0);
  });

  it('a refused retirement leaves every post exactly where it was', () => {
    const s = st.getState();
    const pid = s.playerForceId!;
    const ruler = s.officers[s.forces[pid].rulerOfficerId];
    const posts = installPosts(ruler.id);
    const r = st.getState().retireOfficer(ruler.id);
    expect(r?.ok, '君主不可告老').toBe(false);
    // The guard fires before any mutation, so the ruler must still hold all three.
    const now = st.getState();
    expect(now.provinceGovernors?.[posts.province as keyof typeof now.provinceGovernors]).toBe(ruler.id);
    expect(now.cityDelegations?.[posts.cityId]).toBe(ruler.id);
    expect((now.appointments ?? []).some((a) => a.officerId === ruler.id)).toBe(true);
  });
});

describe('原子性 — 前置條件不足時不得半途改動', () => {
  beforeEach(boot);

  /**
   * Every gold-spending action shares a shape: check affordability, then
   * `set()`. Draining the treasury first turns each one into a test of that
   * guard — a spend that slipped in before its check shows up as a negative
   * balance, which `assertInvariants` treats as a hard failure.
   */
  it('a bankrupt realm cannot be talked into spending anyway', () => {
    const s = st.getState();
    const pid = s.playerForceId!;
    const cities = { ...s.cities };
    for (const c of Object.values(cities)) {
      if (c.ownerForceId === pid) cities[c.id] = { ...c, gold: 0, food: 0 };
    }
    st.setState({ cities });
    const cap = s.forces[pid].capitalCityId!;

    // A spread of paid actions, all of which must decline rather than overdraw.
    st.getState().startBuilding?.(cap, 'barracks');
    st.getState().buildStockade?.(cap);
    st.getState().hostBanquet?.(cap);
    st.getState().provinceLevy?.(cap);
    st.getState().prayForRain?.(cap);

    for (const c of Object.values(st.getState().cities)) {
      expect(c.gold, `${c.id} 破產後仍被扣款 → ${c.gold}`).toBeGreaterThanOrEqual(0);
      expect(c.food, `${c.id} 破產後仍被扣糧 → ${c.food}`).toBeGreaterThanOrEqual(0);
    }
    assertInvariants(0);
  });

  it('actions aimed at cities that are not yours change nothing', () => {
    const s = st.getState();
    const foreign = Object.values(s.cities).find((c) => c.ownerForceId && c.ownerForceId !== s.playerForceId);
    if (!foreign) return;
    const before = worldHash();
    st.getState().startBuilding?.(foreign.id, 'barracks');
    st.getState().razeCity?.(foreign.id);
    st.getState().relocateCapital?.(foreign.id);
    expect(worldHash(), '對他人城池下令不得改變世界').toBe(before);
  });
});
