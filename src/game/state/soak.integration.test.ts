/**
 * 長跑浸泡 — a passive (spectator-style) campaign ground through 48 turns
 * (~2 years) on the REAL store, asserting state invariants every turn. The
 * seven 2026-07 map batches added many interacting systems (sieges, ambushes,
 * depots, booms, scars, weather, converging battles); this is the test that
 * shakes out cross-system NaNs, negative stocks and stuck states that
 * single-feature tests can't reach.
 */
import { describe, it, expect, beforeAll } from 'vitest';

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
import { getRelation } from '../types/diplomacy';
import { ITEMS_BY_ID } from '../data/items';
import { CIVIC_TITLES_BY_ID } from '../data/titles';

const TURNS = 48;
/**
 * 長程 — 48 turns only reaches 179 AD with seven forces still standing and two
 * sieges ever seen: the whole late game (consolidation, succession, mass
 * defection, the imperial court, 承平之亂) is never touched by the short soak.
 * Ten years of turns gets there. Kept as a separate case so its cost is visible
 * and the fast one still guards every commit.
 */
const LONG_TURNS = 240;

function assertInvariants(turn: number): void {
  const s = useGameStore.getState();
  // ── Cities ──
  for (const c of Object.values(s.cities)) {
    expect(Number.isFinite(c.gold), `t${turn} ${c.id} gold finite`).toBe(true);
    expect(Number.isFinite(c.food), `t${turn} ${c.id} food finite`).toBe(true);
    expect(c.troops, `t${turn} ${c.id} troops ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.food, `t${turn} ${c.id} food ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.population, `t${turn} ${c.id} population > 0`).toBeGreaterThan(0);
    expect(c.loyalty, `t${turn} ${c.id} loyalty ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(c.loyalty, `t${turn} ${c.id} loyalty ≤ 100`).toBeLessThanOrEqual(100);
    // 府庫不為負 — every unclamped subtraction in the store sits behind an
    // affordability check, so this is a real contract rather than a hope.
    expect(c.gold, `t${turn} ${c.id} gold ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(c.population), `t${turn} ${c.id} population finite`).toBe(true);
    if (c.corruption != null) {
      expect(c.corruption, `t${turn} ${c.id} corruption ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(c.corruption, `t${turn} ${c.id} corruption ≤ 100`).toBeLessThanOrEqual(100);
    }
    if (c.ownerForceId) {
      expect(s.forces[c.ownerForceId], `t${turn} ${c.id} owned by a live force`).toBeTruthy();
    }
  }
  // ── Armies ──
  for (const a of Object.values(s.armies)) {
    expect(a.troops, `t${turn} army ${a.id} troops > 0`).toBeGreaterThan(0);
    expect(Number.isFinite(a.x) && Number.isFinite(a.y), `t${turn} army ${a.id} position finite`).toBe(true);
    if (a.food != null) expect(Number.isFinite(a.food), `t${turn} army ${a.id} food finite`).toBe(true);
    // A besieging army must be holding, and its target must exist.
    if (a.besieging) {
      expect(a.holding, `t${turn} army ${a.id} besieging ⇒ holding`).toBe(true);
      expect(s.cities[a.besieging], `t${turn} army ${a.id} besieging a real city`).toBeTruthy();
    }
    // 潰軍 — a rout is always streaming home with a flee anchor, never dug in.
    if (a.routed) {
      expect(a.returning, `t${turn} army ${a.id} routed ⇒ returning`).toBe(true);
      expect(a.holding ?? false, `t${turn} army ${a.id} routed ⇒ not holding`).toBe(false);
      expect(Number.isFinite(a.fleeX ?? 0) && Number.isFinite(a.fleeY ?? 0),
        `t${turn} army ${a.id} flee anchor finite`).toBe(true);
    }
    // 避戰 — only meaningful on the move.
    if (a.evading) expect(a.holding ?? false, `t${turn} army ${a.id} evading ⇒ not holding`).toBe(false);
    // 師老兵疲 — clamped 0..100.
    if (a.fatigue != null) {
      expect(a.fatigue, `t${turn} army ${a.id} fatigue ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(a.fatigue, `t${turn} army ${a.id} fatigue ≤ 100`).toBeLessThanOrEqual(100);
    }
  }
  // ── Armies, cross-referenced ──
  // 一將一營 — a commander leads at most one column. A duplicate here is the
  // exact shape of the 2026-07-26 siege bug (a column counted twice because the
  // invest conversion mutated a shared command object), and nothing asserted it.
  const byCommander = new Map<string, string>();
  for (const a of Object.values(s.armies)) {
    const prev = byCommander.get(a.commanderId);
    expect(prev, `t${turn} 一將一營 — ${a.commanderId} leads both ${prev} and ${a.id}`).toBeUndefined();
    byCommander.set(a.commanderId, a.id);
    // 統帥須在世 — a column led by a corpse keeps marching and fighting.
    const cmdr = s.officers[a.commanderId];
    expect(cmdr, `t${turn} army ${a.id} commander ${a.commanderId} exists`).toBeTruthy();
    expect(cmdr?.status, `t${turn} army ${a.id} commander alive`).not.toBe('dead');
    expect(s.forces[a.forceId], `t${turn} army ${a.id} belongs to a live force`).toBeTruthy();
    // 歸師不圍城 — a column streaming home is not also investing a city.
    if (a.returning) {
      expect(a.besieging ?? null, `t${turn} army ${a.id} returning ⇒ not besieging`).toBeNull();
    }
    // 追擊之的須存在 — a hunter chasing a vanished army never gives up.
    if (a.pursueTargetId) {
      expect(s.armies[a.pursueTargetId], `t${turn} army ${a.id} pursues a real army`).toBeTruthy();
    }
  }

  // ── Officers ──
  for (const o of Object.values(s.officers)) {
    expect(['active', 'idle', 'imprisoned', 'dead', 'unsearched', 'wounded', 'retired'],
      `t${turn} officer ${o.id} status valid`).toContain(o.status);
    // 忠誠有界 — checked nowhere before, though a dozen systems nudge it.
    expect(Number.isFinite(o.loyalty), `t${turn} officer ${o.id} loyalty finite`).toBe(true);
    expect(o.loyalty, `t${turn} officer ${o.id} loyalty ≥ 0`).toBeGreaterThanOrEqual(0);
    expect(o.loyalty, `t${turn} officer ${o.id} loyalty ≤ 100`).toBeLessThanOrEqual(100);
    // 五圍為數 — a NaN stat poisons every multiplier downstream in silence.
    for (const [k, v] of Object.entries(o.stats)) {
      expect(Number.isFinite(v), `t${turn} officer ${o.id} stat ${k} finite`).toBe(true);
    }
    // 死者不仕 — the contract every death path writes (forceId: null).
    if (o.status === 'dead') {
      expect(o.forceId ?? null, `t${turn} dead officer ${o.id} serves nobody`).toBeNull();
    } else if (o.forceId) {
      expect(s.forces[o.forceId], `t${turn} officer ${o.id} serves a live force`).toBeTruthy();
    }
  }

  // ── Forces ──
  for (const f of Object.values(s.forces)) {
    const ruler = s.officers[f.rulerOfficerId];
    if (!ruler) continue;
    // 君不可為屍 — succession runs every season, and a late-tick sweep promotes
    // a survivor after it. The one case left alone is a force whose ENTIRE
    // roster is dead or captive: there is genuinely nobody to raise, and that
    // is a realm out of people rather than a bookkeeping slip.
    const hasSomeone = Object.values(s.officers).some(
      (o) => o.forceId === f.id && o.status !== 'dead' && o.status !== 'imprisoned');
    if (!hasSomeone) continue;
    expect(ruler.status, `t${turn} force ${f.id} ruled by a corpse (${ruler.id})`).not.toBe('dead');
  }
  // ── World scars / paint keys parse as "col,row" ──
  for (const k of Object.keys(s.worldScars ?? {})) {
    expect(/^-?\d+,-?\d+$/.test(k), `t${turn} scar key ${k}`).toBe(true);
  }
  // ── Forts ──
  for (const f of Object.values(s.forts)) {
    expect(f.hp, `t${turn} fort ${f.id} hp ≥ 0`).toBeGreaterThanOrEqual(0);
    // A fort belongs to somebody who exists, and guards cities that exist —
    // a fort left guarding a city id that no longer resolves is how
    // siegeFacilityAid ends up crediting defence to nobody.
    if (f.ownerForceId) {
      expect(s.forces[f.ownerForceId], `t${turn} fort ${f.id} owned by a live force`).toBeTruthy();
    }
    for (const g of f.guards ?? []) {
      expect(s.cities[g], `t${turn} fort ${f.id} guards a real city (${g})`).toBeTruthy();
    }
  }

  // ── 外交對稱 ── Relations are stored per unordered pair; if the two
  // directions can disagree, one side thinks it is at war while the other
  // thinks it is allied, and every AI decision downstream reads whichever it
  // happened to look up first. Nothing in the engine checks this.
  for (const a of Object.keys(s.forces)) {
    for (const b of Object.keys(s.forces)) {
      if (a >= b) continue;
      const ab = getRelation(s.diplomacy, a, b);
      const ba = getRelation(s.diplomacy, b, a);
      expect(ab.status, `t${turn} diplomacy ${a}/${b} status asymmetric`).toBe(ba.status);
      expect(ab.score, `t${turn} diplomacy ${a}/${b} score asymmetric`).toBe(ba.score);
    }
  }

  // ── 名品不生分身 ── One named treasure, one holder. Equipment and the
  // unclaimed hoard are separate stores that hand items to each other
  // (奪寶/繳獲/賞賜/義釋/遠使); a copy left behind in the source is how a
  // 神兵 quietly becomes two. This invariant caught exactly that: errand
  // rewards minted a second 于闐美玉 while the first still lay in a city.
  //
  // 研讀秘笈 are deliberately exempt — legacyManual.ts states outright that a
  // dead master's notes reuse the shared 秘籍 catalogue rather than minting a
  // per-instance item, so two officers may each carry a copy of the same
  // manual. They are consumed on study, so they are stock, not treasure.
  const uniqueOnly = (id: string) => !ITEMS_BY_ID[id]?.consumable;
  const itemHolder = new Map<string, string>();
  for (const o of Object.values(s.officers)) {
    for (const it of o.equipment ?? []) {
      if (!uniqueOnly(it)) continue;
      const prev = itemHolder.get(it);
      expect(prev, `t${turn} item ${it} held by both ${prev} and officer ${o.id}`).toBeUndefined();
      itemHolder.set(it, `officer:${o.id}`);
    }
  }
  for (const li of s.lostItems ?? []) {
    if (!uniqueOnly(li.itemId)) continue;
    const prev = itemHolder.get(li.itemId);
    expect(prev, `t${turn} item ${li.itemId} both unclaimed and held by ${prev}`).toBeUndefined();
    itemHolder.set(li.itemId, `lost:${li.cityId}`);
  }

  // ── 城池與勢力互相認得 ── A force with a capital it does not own, or with
  // no cities at all while still being alive, is a realm that exists only in
  // the bookkeeping — the map shows nothing but the AI keeps taking turns.
  const cityCount = new Map<string, number>();
  for (const c of Object.values(s.cities)) {
    if (c.ownerForceId) cityCount.set(c.ownerForceId, (cityCount.get(c.ownerForceId) ?? 0) + 1);
  }
  for (const f of Object.values(s.forces)) {
    const cap = s.cities[f.capitalCityId];
    if (cap && (cityCount.get(f.id) ?? 0) > 0) {
      expect(cap.ownerForceId, `t${turn} force ${f.id} capital ${f.capitalCityId} is held by ${cap.ownerForceId}`).toBe(f.id);
    }
  }

  // ── 俘虜必有俘主 ── An imprisoned officer sits in somebody's gaol. If the
  // city fell and nobody re-homed them, they are frozen out of every path
  // (ransom, recruit, execute, release) with no way for the player to reach
  // them and no way for the engine to tick them.
  for (const o of Object.values(s.officers)) {
    if (o.status !== 'imprisoned') continue;
    if (!o.locationCityId) continue;
    expect(s.cities[o.locationCityId], `t${turn} captive ${o.id} held in a real city`).toBeTruthy();
  }

  // ── 死者了無牽掛 ── A dead officer must hold no office and command no
  // troops. The engine removes them from most paths on death, but a corpse
  // left holding a governorship or a legion command is a slot the living can
  // never be given — the city keeps "having" an administrator forever. (A
  // previous soak round found a corpse still leading an army; this pins the
  // wider class.) Equipment and location deliberately survive death: that is
  // how a fallen officer's 神兵 stays findable and how burial reads.
  //
  // ⚠ COVERAGE: measured over 240 ticks of the passive soak, `deadIds` stays
  // EMPTY, so these three assertions do not currently bite. That is correct
  // behaviour, not a gap in the soak: every scenario opens at game year 178
  // and deathChance() returns 0 for an officer before their historical 卒年,
  // so 178–188 genuinely buries almost nobody. The assertions are here for
  // the campaigns that DO reach the death years (the long soak's later half,
  // and every real player save). Do not "fix" them by loosening — check
  // whether the run reaches a year where anyone dies.
  const deadIds = new Set(Object.values(s.officers).filter((o) => o.status === 'dead').map((o) => o.id));
  for (const [cityId, govId] of Object.entries(s.cityDelegations ?? {})) {
    expect(deadIds.has(govId), `t${turn} city ${cityId} delegated to dead officer ${govId}`).toBe(false);
  }
  for (const [pid, govId] of Object.entries(s.provinceGovernors ?? {})) {
    expect(deadIds.has(govId), `t${turn} province ${pid} governed by dead officer ${govId}`).toBe(false);
  }
  for (const lg of s.legions ?? []) {
    if (lg.commanderId) {
      expect(deadIds.has(lg.commanderId), `t${turn} legion ${lg.id} commanded by dead officer ${lg.commanderId}`).toBe(false);
    }
  }

  // ── 官爵不相沖 ── A CivicTitle declares `excludes`: posts that cannot be
  // held at once (you are not both 丞相 and 大將軍). Nothing in the grant path
  // re-checks it after the fact, so a title handed out by one system while
  // another had already granted its exclusion goes unnoticed — and the UI
  // shows a rank nobody can explain.
  //
  // COVERAGE: the passive soak reaches 76 live appointments and 5 province
  // governors, so this one and 一職一人 below are genuinely exercised.
  // (cityDelegations and legions stay empty — a spectator never delegates or
  // raises a legion — so the two assertions above that read them are, like
  // the death checks, waiting for a campaign that uses them.)
  const titlesByOfficer = new Map<string, string[]>();
  for (const ap of s.appointments ?? []) {
    titlesByOfficer.set(ap.officerId, [...(titlesByOfficer.get(ap.officerId) ?? []), ap.titleId]);
  }
  for (const [officerId, titles] of titlesByOfficer) {
    for (const titleId of titles) {
      const def = CIVIC_TITLES_BY_ID[titleId];
      if (!def?.excludes) continue;
      const clashing = def.excludes.filter((x) => titles.includes(x));
      expect(clashing, `t${turn} officer ${officerId} holds ${titleId} plus its exclusion(s) ${clashing.join(',')}`).toEqual([]);
    }
    // 一人一職 — the same post twice on one officer is a bookkeeping leak.
    expect(new Set(titles).size, `t${turn} officer ${officerId} holds a duplicated post: ${titles.join(',')}`).toBe(titles.length);
  }
  // 一職一人 — and a non-prefect post is held by at most one officer per force
  // (a realm does not have two 丞相). Prefect is per-city, so it is exempt.
  const seatHolders = new Map<string, string[]>();
  for (const ap of s.appointments ?? []) {
    if (ap.titleId === 'prefect') continue;
    const key = `${ap.forceId}|${ap.titleId}`;
    seatHolders.set(key, [...(seatHolders.get(key) ?? []), ap.officerId]);
  }
  for (const [key, holders] of seatHolders) {
    expect(holders.length, `t${turn} ${key} held by ${holders.length} officers: ${holders.join(',')}`).toBe(1);
  }

  // ── 兵籍不憑空生滅 ── Troops are the single most-moved number in the game
  // (recruit, march, garrison, rout, disband, siege losses), and several
  // systems write them independently. A total that leaps between adjacent
  // ticks means somebody is adding troops without paying, or losing an army
  // into the void — both invisible in play until a battle goes strangely.
  // A band rather than exact conservation: recruitment and casualties are
  // legitimate, mass teleportation is not.
  const troopTotal = Object.values(s.cities).reduce((n, c) => n + c.troops, 0)
    + Object.values(s.armies ?? {}).reduce((n, a) => n + (a.troops ?? 0), 0);
  expect(Number.isFinite(troopTotal), `t${turn} troop total finite`).toBe(true);
  if (lastTroopTotal != null && lastTroopTotal > 0) {
    const ratio = troopTotal / lastTroopTotal;
    expect(ratio, `t${turn} troop total leapt ${lastTroopTotal}→${troopTotal}`).toBeGreaterThan(0.5);
    expect(ratio, `t${turn} troop total leapt ${lastTroopTotal}→${troopTotal}`).toBeLessThan(2);
  }
  lastTroopTotal = troopTotal;
}

/**
 * Previous tick's army total — see the 兵籍 invariant above.
 *
 * Module-level, so it MUST be reset by each test that starts a fresh campaign
 * (resetTroopTracking below). Without that, the second soak compares its opening
 * muster against the first soak's final one and reports a bogus leap — which is
 * exactly what it did on the first run of this invariant.
 */
let lastTroopTotal: number | null = null;

/** Call at the top of any test that boots a new campaign. */
function resetTroopTracking(): void {
  lastTroopTotal = null;
}

describe('長跑浸泡 — 48 旬被動戰役', () => {
  it('grinds 48 turns without breaking a single invariant, and save/load round-trips', () => {
    resetTroopTracking();
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

    const siegesSeen = new Set<string>();
    let facilitiesBuilt = 0;
    for (let t = 1; t <= TURNS; t++) {
      st.getState().endSeason();
      assertInvariants(t);
      const s = st.getState();
      for (const a of Object.values(s.armies)) if (a.besieging) siegesSeen.add(`${a.id}→${a.besieging}`);
      facilitiesBuilt = Math.max(facilitiesBuilt,
        Object.values(s.forts).filter((f) => f.facility).length);
      // 存檔輪轉 — every 12 turns the whole state must survive a round-trip.
      if (t % 12 === 0) {
        st.getState().saveSlot('soak-test', `soak t${t}`);
        expect(st.getState().loadSlot('soak-test'), `t${t} save/load round-trip`).toBe(true);
        assertInvariants(t);
      }
    }

    // 軟訊號 — not hard requirements, but log the emergent activity so a
    // silent regression (AI never building, sieges never happening) shows
    // up in the test output for a human eye.
    console.log(`soak: ${TURNS} turns · AI sieges seen: ${siegesSeen.size} · facilities on map: ${facilitiesBuilt}`);
    console.log('soak: final date', st.getState().date, '· living forces:',
      new Set(Object.values(st.getState().cities).map((c) => c.ownerForceId).filter(Boolean)).size);
    expect(true).toBe(true);
  }, 120_000);

  /**
   * 長程浸泡 — ten years, to reach the states the short soak never sees:
   * forces being swallowed, rulers dying and being succeeded, the court filling
   * up, and (if the AI gets there) a realm consolidating toward one banner.
   * Late-game systems are otherwise exercised only by their own unit tests,
   * which cannot produce the cross-system states that break invariants.
   */
  it('grinds 240 turns of the late game without breaking an invariant', () => {
    resetTroopTracking();
    const st = useGameStore;
    st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

    let ended = 0;
    for (let t = 1; t <= LONG_TURNS; t++) {
      const before = st.getState().victoryStatus;
      st.getState().endSeason();
      assertInvariants(t);
      // Victory/defeat latches the campaign; note where it happened and play
      // on through 承平之亂 so the post-victory pressure is exercised too.
      const after = st.getState().victoryStatus;
      if (before === 'playing' && after !== 'playing') {
        ended = t;
        st.getState().continueAfterVictory();
        assertInvariants(t);
      }
    }

    const s = st.getState();
    const forcesLeft = new Set(
      Object.values(s.cities).map((c) => c.ownerForceId).filter(Boolean)).size;
    const dead = Object.values(s.officers).filter((o) => o.status === 'dead').length;
    console.log(`soak-long: ${LONG_TURNS} turns · final`, s.date,
      `· forces left: ${forcesLeft} · officers dead: ${dead}`,
      ended ? `· campaign latched at t${ended}` : '· never latched');
    // 長程仍須有人在場 — a world that quietly empties itself would pass every
    // per-entity invariant above while being completely broken.
    expect(forcesLeft, 'someone must still hold the map').toBeGreaterThan(0);
    expect(Object.keys(s.cities).length, 'cities must not vanish').toBeGreaterThan(0);
  }, 300_000);
});
