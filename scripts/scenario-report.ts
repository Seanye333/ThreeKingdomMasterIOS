/**
 * 戰役體檢 — let the AI play a given board and report what actually happens to
 * every force on it.
 *
 * ## 為什麼需要它
 *
 * 一個戰役的序章與目標,是**照史書寫的假設**。「劉琮:撐到 210 年仍據有襄陽」
 * 讀起來很對,但沒有人知道在這個模擬裡,曹操會不會第三回合就把襄陽拿走 ——
 * 那條目標就成了一句永遠達不到的空話。
 *
 * `balance-campaign.ts` 已經有一套「AI 自走真 store」的骨架,但它跑死
 * `SCENARIOS[0]` 並且只數戰鬥機制的觸發次數。這支換一個問法:**這張盤上的
 * 每一家,在無人干預的情況下,會活成什麼樣子。**
 *
 * 印出來的東西都是為了回答具體的設計問題:
 *  - 誰在第幾回合死光 → 那家的目標若是「撐到 N 年」就是空話
 *  - 城數曲線 → 誰在滾雪球、誰被夾死;開局差異化要照這個調
 *  - 每家主目標的達成/失敗 → 直接告訴你目標寫得對不對
 *  - 事件觸發清單 → 這張盤的「名場面」到底有沒有演到
 *
 * Run:
 *   node --import tsx scripts/scenario-report.ts <scenarioId> [turns] [runs]
 *   node --import tsx scripts/scenario-report.ts scn-184-yellow-turban 150 5
 *
 * ⚠ **一次不算數。** 這個模擬有隨機源,同一份資料連跑兩次,董卓可能收在 5 城
 * 也可能收在 10 城。所以預設跑五輪並印出區間與中位數 —— 拿單跑的數字去調
 * 平衡,調的是雜訊。
 *
 * ⚠ 一回合是一旬,而一年十二個月、每月三旬 —— **36 回合 = 1 年**。目標多半
 * 以「年」計,所以要驗一條 187 年的期限,從 184 年起要跑約 110 回合。我第一次
 * 跑 40 回合只走了一年多,五條目標有四條根本還沒到期就被判「未達成」。
 */

// endSeason's autosave touches localStorage; stub it for the node env.
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

interface Track {
  id: string;
  nameZh: string;
  cities: number[];        // city count per turn
  troops: number[];
  /* 金/糧/天命也要看 —— 城數只說了「打得贏嗎」,說不了「活得下去嗎」。
     黃巾的開局姿態把府庫壓到 0.35、糧到 0.40,而在加這三條之前,沒有人知道
     那樣的一家會不會第十回合就發不出糧。 */
  gold: number[];
  food: number[];
  mandate: number[];
  diedTurn: number | null;
  peakCities: number;
}

async function main() {
  const { useGameStore } = await import('../src/game/state/store');
  const { SCENARIOS } = await import('../src/game/data/scenarios');
  const { SCENARIO_OBJECTIVES } = await import('../src/game/data/objectives');
  const { formatScenarioYear } = await import('../src/game/data/era');

  const scenarioId = process.argv[2] ?? 'scn-184-yellow-turban';
  const TURNS = Number(process.argv[3] ?? 150);
  const RUNS = Number(process.argv[4] ?? 5);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    console.error(`no such scenario: ${scenarioId}`);
    console.error('ids:', SCENARIOS.map((s) => s.id).join(' '));
    process.exit(1);
  }

  const st = useGameStore;

  /** 一輪的結果。多輪之後才敢下結論。 */
  interface RunResult {
    finalCities: Record<string, number>;
    finalTroops: Record<string, number>;
    /** 撐不撐得住 —— 破產(金<0)與斷糧(糧<兵)第一次發生在第幾回合。 */
    brokeTurn: Record<string, number | null>;
    starveTurn: Record<string, number | null>;
    finalMandate: Record<string, number>;
    minGold: Record<string, number>;
    diedTurn: Record<string, number | null>;
    objectiveMet: Record<string, boolean>;
    events: Array<{ turn: number; zh: string }>;
    endYear: number;
  }
  const runs: RunResult[] = [];

  for (let run = 0; run < RUNS; run++) {
  // 觀戰 — the player force is nominally the first one, but we never issue an
  // order, so every side is AI-driven. That is the point: this measures the
  // board's own dynamics, not a strategy.
  st.getState().loadScenario(scenario, scenario.forces[0].id, 'normal');

  const tracks = new Map<string, Track>();
  for (const f of scenario.forces) {
    tracks.set(f.id, {
      id: f.id, nameZh: f.name.zh, cities: [], troops: [],
      gold: [], food: [], mandate: [], diedTurn: null, peakCities: 0,
    });
  }
  const eventsSeen: Array<{ turn: number; zh: string }> = [];

  const snapshot = (turn: number) => {
    const s = st.getState();
    for (const [fid, tr] of tracks) {
      const cities = Object.values(s.cities).filter((c) => c.ownerForceId === fid);
      const troops = cities.reduce((n, c) => n + (c.troops ?? 0), 0);
      tr.cities.push(cities.length);
      tr.troops.push(troops);
      tr.gold.push(cities.reduce((n, c) => n + (c.gold ?? 0), 0));
      tr.food.push(cities.reduce((n, c) => n + (c.food ?? 0), 0));
      tr.mandate.push(
        (s as unknown as { mandate?: { byForce?: Record<string, number> } })
          .mandate?.byForce?.[fid] ?? 0,
      );
      if (cities.length > tr.peakCities) tr.peakCities = cities.length;
      if (cities.length === 0 && tr.diedTurn === null && turn > 0) tr.diedTurn = turn;
    }
  };

  snapshot(0);
  for (let t = 1; t <= TURNS; t++) {
    st.getState().endSeason();
    const s = st.getState();
    const pending = s.pendingEvent;
    if (pending) {
      eventsSeen.push({ turn: t, zh: pending.event.name.zh });
      /*
       * 別讓事件卡住模擬。`resolveEventChoice` 吃的是**選項 id 字串**,不是
       * 索引 —— 我第一版傳了 0,等於沒選中任何一項,事件於是卡在 pending,
       * 之後每一回合重新觸發同一個(報告裡「甲兵不修」連續出現 37 次)。
       * 選第一項:那是各事件裡的史實路線(見 events.ts 的 choices 約定)。
       */
      const first = (pending.event as { choices?: Array<{ id: string }> }).choices?.[0];
      if (pending.awaitingChoice && first) s.resolveEventChoice?.(first.id);
      else s.dismissEvent?.();
    }
    snapshot(t);
  }

  // ── 這一輪收尾:把結果收進 runs[],然後回到迴圈頂端重跑 ──
  const s = st.getState();
  const objectives = (SCENARIO_OBJECTIVES as Record<string, Array<{
    forceId: string;
    primary: { title: { zh: string }; goal: Record<string, unknown> };
  }>>)[scenario.id] ?? [];
  const res: RunResult = {
    finalCities: {}, finalTroops: {}, diedTurn: {}, objectiveMet: {},
    brokeTurn: {}, starveTurn: {}, finalMandate: {}, minGold: {},
    events: eventsSeen, endYear: s.date.year,
  };
  for (const f of scenario.forces) {
    const tr = tracks.get(f.id)!;
    res.finalCities[f.id] = tr.cities[tr.cities.length - 1];
    res.finalTroops[f.id] = tr.troops[tr.troops.length - 1];
    res.finalMandate[f.id] = tr.mandate[tr.mandate.length - 1];
    /* 「破產」抓的是府庫見底(遊戲把金夾在 0,所以 <0 永遠抓不到)。
       同時記最低點 —— 一家從沒歸零但一路貼著 200 過活,跟一家常年三萬,
       在體感上是兩種遊戲。 */
    const broke = tr.gold.findIndex((g, i) => tr.cities[i] > 0 && g <= 0);
    res.brokeTurn[f.id] = broke < 0 ? null : broke;
    res.minGold[f.id] = Math.min(...tr.gold.filter((_, i) => tr.cities[i] > 0));
    const st = tr.food.findIndex((fd, i) => tr.cities[i] > 0 && fd < tr.troops[i]);
    res.starveTurn[f.id] = st < 0 ? null : st;
    res.diedTurn[f.id] = tr.diedTurn;
    const obj = objectives.find((o) => o.forceId === f.id);
    if (!obj) { res.objectiveMet[f.id] = false; continue; }
    const goal = obj.primary.goal as { kind: string; cityIds?: string[]; forceId?: string; year?: number };
    let met = false;
    if (tr.diedTurn !== null) met = false;
    else if (goal.kind === 'hold-cities' && goal.cityIds) {
      met = goal.cityIds.every((c) => s.cities[c]?.ownerForceId === f.id);
    } else if (goal.kind === 'defeat-force' && goal.forceId) {
      met = !Object.values(s.cities).some((c) => c.ownerForceId === goal.forceId);
    } else if (goal.kind === 'survive-until') {
      met = s.date.year >= (goal.year ?? 0);
    }
    res.objectiveMet[f.id] = met;
  }
  runs.push(res);
  }  // ← end of the run loop

  /* ── 聚合報告 ─────────────────────────────────────────────────────── */
  const startYear = scenario.startDate.year;
  const yr = (y: number) => formatScenarioYear(y, scenario.id, 'zh');
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const rng = (xs: number[]) => `${Math.min(...xs)}–${Math.max(...xs)}`;
  const startCities = (fid: string) => scenario.cities.filter((c) => c.ownerForceId === fid).length;

  console.log(`\n=== ${scenario.name.zh} (${scenario.id}) ===`);
  console.log(`${RUNS} 輪 × ${TURNS} 回合:${yr(startYear)} → ${yr(runs[0].endYear)}\n`);

  console.log('勢力            開局城  終局城(中位/區間)   終局兵(中位)  覆滅 主目標  天命  府庫最低  見底  斷糧');
  for (const f of scenario.forces) {
    const cities = runs.map((r) => r.finalCities[f.id]);
    const troops = runs.map((r) => r.finalTroops[f.id]);
    const died = runs.filter((r) => r.diedTurn[f.id] !== null).length;
    const met = runs.filter((r) => r.objectiveMet[f.id]).length;
    console.log(
      `${f.name.zh.padEnd(14)}${String(startCities(f.id)).padStart(5)}`
      + `${String(med(cities)).padStart(8)} (${rng(cities)})`.padEnd(20)
      + `${String(med(troops)).padStart(12)}`
      + `${String(died + '/' + RUNS).padStart(7)}`
      + `${String(met + '/' + RUNS).padStart(7)}`
      + `${String(Math.round(med(runs.map((r) => r.finalMandate[f.id])))).padStart(6)}`
      + `${String(Math.round(med(runs.map((r) => r.minGold[f.id])))).padStart(9)}`
      + `${String(runs.filter((r) => r.brokeTurn[f.id] !== null).length + '/' + RUNS).padStart(6)}`
      + `${String(runs.filter((r) => r.starveTurn[f.id] !== null).length + '/' + RUNS).padStart(6)}`,
    );
  }

  /* 事件觸發率 — 一條鏈若只在五輪裡演到一輪,那條鏈等於不存在。 */
  console.log('\n事件觸發(輪數 / 首次觸發回合中位數):');
  const evNames = new Set(runs.flatMap((r) => r.events.map((e) => e.zh)));
  const rows = [...evNames].map((zh) => {
    const hit = runs.filter((r) => r.events.some((e) => e.zh === zh));
    const firsts = hit.map((r) => r.events.find((e) => e.zh === zh)!.turn);
    return { zh, n: hit.length, turn: med(firsts) };
  }).sort((a, b) => a.turn - b.turn);
  for (const r of rows) {
    console.log(`  ${String(r.n + '/' + RUNS).padStart(5)}  第 ${String(r.turn).padStart(3)} 回合  ${r.zh}`);
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
