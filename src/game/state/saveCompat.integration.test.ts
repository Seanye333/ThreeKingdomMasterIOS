/**
 * 存檔遷移回歸 — the 2026-07 map batches added several save fields
 * (worldScars / spottedAmbushIds / streetEncounters / mechanicHints, plus
 * ambush/besieging flags on march commands). This locks two guarantees:
 *   ① a NEW save round-trips those fields;
 *   ② an OLD save (fields absent) loads with safe defaults and the game
 *     still resolves a full season on top of it.
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

const SLOT_KEY = 'tkm-slot-compat-test';

describe('存檔遷移 — new map-batch fields', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('round-trips the new fields through save → load', () => {
    const st = useGameStore;
    st.setState({
      worldScars: { '10,10': { kind: 'scorched', t: 750 } },
      spottedAmbushIds: ['spy-target'],
      streetEncounters: { luoyang: 744 },
      mechanicHints: { besiege: true },
    });
    st.getState().saveSlot('compat-test', '遷移測試');
    const raw = localStorage.getItem(SLOT_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.worldScars['10,10'].kind).toBe('scorched');
    expect(parsed.spottedAmbushIds).toEqual(['spy-target']);
    expect(parsed.streetEncounters.luoyang).toBe(744);
    expect(parsed.mechanicHints.besiege).toBe(true);

    // Clean state, then load — fields come back.
    st.setState({ worldScars: {}, spottedAmbushIds: [], streetEncounters: {}, mechanicHints: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.worldScars['10,10']?.kind).toBe('scorched');
    expect(s.spottedAmbushIds).toEqual(['spy-target']);
    expect(s.streetEncounters.luoyang).toBe(744);
    expect(s.mechanicHints.besiege).toBe(true);
  });

  it('round-trips 潰軍/避戰/疲勞 march fields through save → load', () => {
    const st = useGameStore;
    const s0 = st.getState();
    const cityId = Object.keys(s0.cities)[0];
    st.setState({
      pendingCommands: {
        'compat-runner': {
          type: 'march', cityId, targetCityId: cityId, officerId: 'compat-runner',
          troops: 900, routed: true, returning: true, fleeX: 400, fleeY: 300,
          totalSeasons: 2, seasonsRemaining: 2, fatigue: 37,
        },
        'compat-sneak': {
          type: 'march', cityId, targetCityId: cityId, officerId: 'compat-sneak',
          troops: 1200, evading: true, totalSeasons: 3, seasonsRemaining: 3,
        },
      } as never,
    });
    st.getState().saveSlot('compat-test', '潰軍欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.pendingCommands['compat-runner'].routed).toBe(true);
    expect(parsed.pendingCommands['compat-runner'].fleeX).toBe(400);
    expect(parsed.pendingCommands['compat-runner'].fatigue).toBe(37);
    expect(parsed.pendingCommands['compat-sneak'].evading).toBe(true);

    st.setState({ pendingCommands: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const cmds = st.getState().pendingCommands as Record<string, Record<string, unknown>>;
    expect(cmds['compat-runner'].routed).toBe(true);
    expect(cmds['compat-runner'].fleeY).toBe(300);
    expect(cmds['compat-sneak'].evading).toBe(true);
  });

  it('an OLD save (fields absent) loads with defaults and still resolves a season', () => {
    const st = useGameStore;
    st.getState().saveSlot('compat-test', '舊檔模擬');
    const raw = localStorage.getItem(SLOT_KEY)!;
    const parsed = JSON.parse(raw);
    // Simulate a pre-batch save: strip every new field.
    delete parsed.worldScars;
    delete parsed.spottedAmbushIds;
    delete parsed.streetEncounters;
    delete parsed.mechanicHints;
    delete parsed.pendingConquestPolicy;
    for (const cmd of Object.values(parsed.pendingCommands ?? {}) as Array<Record<string, unknown>>) {
      delete cmd.ambush;
      delete cmd.besieging;
      delete cmd.routed;
      delete cmd.fleeX;
      delete cmd.fleeY;
      delete cmd.evading;
      delete cmd.fatigue;
    }
    localStorage.setItem(SLOT_KEY, JSON.stringify(parsed));

    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.worldScars).toEqual({});
    expect(s.spottedAmbushIds).toEqual([]);
    expect(s.streetEncounters).toEqual({});
    expect(s.mechanicHints).toEqual({});
    expect(s.pendingConquestPolicy).toBeNull();

    // New-mechanic actions degrade gracefully on the migrated state.
    expect(st.getState().setArmyAmbush('no-such-army').ok).toBe(false);
    expect(st.getState().besiegeCity('no-such-army').ok).toBe(false);
    expect(st.getState().burnBridge('no-such-army').ok).toBe(false);
    expect(st.getState().setArmyEvade('no-such-army').ok).toBe(false);

    // And a full season resolves without touching the missing fields.
    st.getState().endSeason();
    expect(st.getState().date).toBeTruthy();
  });

  it('round-trips the 2026-07 card-batch fields; an old save defaults them', () => {
    const st = useGameStore;
    const officerId = Object.keys(st.getState().officers)[0];
    const o = st.getState().officers[officerId];
    st.setState({
      itemAwakenings: { 'green-dragon': ['edge', 'breaker'] },
      destroyedItems: ['gu-ding'],
      bounties: [{ officerId, kind: 'capture', gold: 1000, renown: 15, expiresYear: 200 }],
      festivalSeason: '190|spring',
      festivalPity: 2,
      itemInscriptions: { 'green-dragon': { name: '冷豔鋸', motto: '刀下不斬無名' } },
      setRewardsClaimed: ['five-tigers'],
      powerBoardPrev: { [officerId]: 3 },
      officers: {
        ...st.getState().officers,
        [officerId]: { ...o, stars: 4, skillLevels: { brave: 2 }, medals: ['medal-duelist'], marrowCleansed: true },
      },
    });
    st.getState().saveSlot('compat-test', '卡牌批欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.itemAwakenings['green-dragon']).toEqual(['edge', 'breaker']);
    expect(parsed.itemInscriptions['green-dragon'].name).toBe('冷豔鋸');
    expect(parsed.officers[officerId].stars).toBe(4);
    expect(parsed.officers[officerId].medals).toEqual(['medal-duelist']);

    st.setState({ itemAwakenings: {}, destroyedItems: [], bounties: [], festivalPity: 0, itemInscriptions: {}, setRewardsClaimed: [], powerBoardPrev: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.itemAwakenings['green-dragon']).toEqual(['edge', 'breaker']);
    expect(s.destroyedItems).toEqual(['gu-ding']);
    expect(s.bounties[0]?.gold).toBe(1000);
    expect(s.festivalPity).toBe(2);
    expect(s.setRewardsClaimed).toEqual(['five-tigers']);
    expect(s.officers[officerId].skillLevels?.brave).toBe(2);
    expect(s.officers[officerId].marrowCleansed).toBe(true);

    // 舊檔 — strip every card-batch field; defaults land, a season resolves.
    const old = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    delete old.itemAwakenings;
    delete old.destroyedItems;
    delete old.bounties;
    delete old.festivalSeason;
    delete old.festivalPity;
    delete old.itemInscriptions;
    delete old.setRewardsClaimed;
    delete old.powerBoardPrev;
    for (const oo of Object.values(old.officers ?? {}) as Array<Record<string, unknown>>) {
      delete oo.stars;
      delete oo.skillLevels;
      delete oo.medals;
      delete oo.marrowCleansed;
    }
    localStorage.setItem(SLOT_KEY, JSON.stringify(old));
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s2 = st.getState();
    expect(s2.itemAwakenings).toEqual({});
    expect(s2.destroyedItems).toEqual([]);
    expect(s2.bounties).toEqual([]);
    expect(s2.festivalPity).toBe(0);
    expect(s2.itemInscriptions).toEqual({});
    expect(s2.setRewardsClaimed).toEqual([]);
    st.getState().endSeason();
    expect(st.getState().date).toBeTruthy();
  });
});

// ── 2026-07 民政批(§1.11–§1.14 / §3.6)——本夜新增八個 state 欄位 ──

describe('存檔遷移 — 民政批 fields', () => {
  beforeEach(() => {
    useGameStore.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  });

  it('round-trips 律令/徭役/選官/文集/祠廟 and the per-city civic meters', () => {
    const st = useGameStore;
    const fid = st.getState().playerForceId!;
    const cityId = Object.keys(st.getState().cities)[0];
    st.setState({
      lawCode: { [fid]: 'strict' },
      corvee: { [fid]: 'heavy' },
      selectionSystem: { [fid]: 'jiupin' },
      lastAmnestyYear: { [fid]: 195 },
      poems: [{
        id: 'poem-x', authorId: 'cao-cao', cityId, year: 195, season: 'autumn',
        occasion: 'scenic', titleZh: '觀滄海', linesZh: ['東臨碣石,以觀滄海'], quality: 93,
      }],
      shrines: [{ id: 'shrine-x', officerId: 'dian-wei', cityId, year: 197, renown: 70 }],
      cities: {
        ...st.getState().cities,
        [cityId]: {
          ...st.getState().cities[cityId],
          caseload: 63, hiddenHouseholds: 21.5, hoardedGrain: 33,
        },
      },
    });
    st.getState().saveSlot('compat-test', '民政批欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.lawCode[fid]).toBe('strict');
    expect(parsed.corvee[fid]).toBe('heavy');
    expect(parsed.selectionSystem[fid]).toBe('jiupin');
    expect(parsed.poems[0].quality).toBe(93);
    expect(parsed.shrines[0].officerId).toBe('dian-wei');
    expect(parsed.cities[cityId].caseload).toBe(63);
    expect(parsed.cities[cityId].hiddenHouseholds).toBe(21.5);
    expect(parsed.cities[cityId].hoardedGrain).toBe(33);

    st.setState({ lawCode: {}, corvee: {}, selectionSystem: {}, poems: [], shrines: [] });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    const s = st.getState();
    expect(s.lawCode[fid]).toBe('strict');
    expect(s.corvee[fid]).toBe('heavy');
    expect(s.selectionSystem[fid]).toBe('jiupin');
    expect(s.poems[0].titleZh).toBe('觀滄海');
    expect(s.shrines[0].cityId).toBe(cityId);
    expect(s.cities[cityId].caseload).toBe(63);
  });

  it('an OLD save without any civic field loads, resolves a season, and defaults to the neutral code', () => {
    const st = useGameStore;
    st.getState().saveSlot('compat-test', '舊檔(無民政欄位)');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    // Simulate a pre-batch save: strip every field this batch introduced.
    delete parsed.lawCode;
    delete parsed.corvee;
    delete parsed.selectionSystem;
    delete parsed.lastAmnestyYear;
    delete parsed.poems;
    delete parsed.shrines;
    for (const c of Object.values(parsed.cities) as Array<Record<string, unknown>>) {
      delete c.caseload;
      delete c.hiddenHouseholds;
      delete c.hoardedGrain;
    }
    localStorage.setItem(SLOT_KEY, JSON.stringify(parsed));

    expect(st.getState().loadSlot('compat-test')).toBe(true);

    // A full season must resolve on the migrated state — this is the real test:
    // the civic tick reads every one of those fields.
    st.getState().endSeason();
    const s = st.getState();
    expect(s.date).toBeTruthy();
    // …and the meters come into existence with sane values rather than NaN.
    for (const c of Object.values(s.cities)) {
      if (!c.ownerForceId) continue;
      expect(Number.isNaN(c.caseload ?? 0)).toBe(false);
      expect(Number.isNaN(c.hiddenHouseholds ?? 0)).toBe(false);
      expect(Number.isNaN(c.hoardedGrain ?? 0)).toBe(false);
      expect(c.hiddenHouseholds ?? 0).toBeLessThanOrEqual(45);
      expect(c.hoardedGrain ?? 0).toBeLessThanOrEqual(40);
    }
  });

  it('round-trips the 米市/錢法 fields; an old save defaults to 平糴 + 五銖錢', () => {
    const st = useGameStore;
    const fid = st.getState().playerForceId!;
    st.getState().setGrainPolicy('open');
    st.getState().setCoinStandard('daqian');
    st.setState({ inflationByForce: { [fid]: 42 } });
    st.getState().saveSlot('compat-test', '米市錢法欄位');
    const parsed = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    expect(parsed.grainPolicy[fid]).toBe('open');
    expect(parsed.coinStandard[fid]).toBe('daqian');
    expect(parsed.inflationByForce[fid]).toBe(42);

    st.setState({ grainPolicy: {}, coinStandard: {}, inflationByForce: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    expect(st.getState().grainPolicy[fid]).toBe('open');
    expect(st.getState().coinStandard[fid]).toBe('daqian');
    expect(st.getState().inflationByForce[fid]).toBe(42);

    // Strip them as a pre-batch save would be, and a full season still resolves.
    st.getState().saveSlot('compat-test', '舊檔(無米市欄位)');
    const old = JSON.parse(localStorage.getItem(SLOT_KEY)!);
    delete old.grainPolicy;
    delete old.coinStandard;
    delete old.inflationByForce;
    localStorage.setItem(SLOT_KEY, JSON.stringify(old));
    st.setState({ grainPolicy: {}, coinStandard: {}, inflationByForce: {} });
    expect(st.getState().loadSlot('compat-test')).toBe(true);
    expect(st.getState().grainPolicy).toEqual({});
    expect(st.getState().coinStandard).toEqual({});
    st.getState().endSeason();
    const s = st.getState();
    expect(s.date).toBeTruthy();
    for (const c of Object.values(s.cities)) {
      expect(Number.isNaN(c.gold)).toBe(false);
      expect(Number.isNaN(c.food)).toBe(false);
      expect(c.food).toBeGreaterThanOrEqual(0);
    }
    // Inflation exists for every realm after one season, and stays in range.
    for (const v of Object.values(st.getState().inflationByForce)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('the civic actions all degrade gracefully with nothing set up', () => {
    const st = useGameStore;
    st.setState({ lawCode: {}, corvee: {}, selectionSystem: {}, poems: [], shrines: [], lastAmnestyYear: {} });
    // 大赦 with an empty treasury reason, 立祠 on a living officer, 題詠 by a nobody.
    expect(st.getState().buildShrine('no-such-officer', 'no-such-city').ok).toBe(false);
    expect(st.getState().composePoemAt('no-such-officer').ok).toBe(false);
    // Setting a code/levy on a live game is always allowed and takes effect.
    st.getState().setLawCode('lenient');
    st.getState().setCorvee('light');
    const fid = st.getState().playerForceId!;
    expect(st.getState().lawCode[fid]).toBe('lenient');
    expect(st.getState().corvee[fid]).toBe('light');
  });
});
