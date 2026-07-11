/**
 * 大地圖戰役平衡跑分 — an instrumented spectator soak over the REAL store.
 *
 * Lets the AI play N passive turns and counts how often each world-map
 * combat mechanic actually fires (潰軍成形/掩殺/追亡逐北/收降/陣擒/繳獲/
 * 避戰在途/疲勞水位/潰軍歸城 vs 散盡), so rout/pursuit/fatigue constants
 * can be judged against real AI-vs-AI play instead of gut feel.
 *
 * NOTE: winter frost / snow-stall / evade-slip REPORT LINES are player-
 * scoped by design (no AI spam), so they read 0 here even though the
 * mechanics fire — their exact behaviour is locked by unit tests
 * (campaignMarch.test.ts). What this script measures is the emergent
 * ecosystem: do routs form, get hunted, and sometimes make it home?
 *
 * Run:  node --import tsx scripts/balance-campaign.ts [turns]
 * Baseline (2026-07-11, 96 turns, scenario[0]): 29 clashes → 22 routs,
 * 20 hunts, 5 annihilated, ~3.9k absorbed, 15 reached shelter, 2 melted.
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

async function main() {
  const { useGameStore } = await import('../src/game/state/store');
  const { SCENARIOS } = await import('../src/game/data/scenarios');

  const TURNS = Number(process.argv[2] ?? 96);
  const st = useGameStore;
  st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');

  const stats = {
    turns: 0,
    fieldClashes: 0,
    routsFormed: 0,
    routHunts: 0,
    routsDestroyed: 0,
    absorbedTotal: 0,
    fieldCaptures: 0,
    spoilsEvents: 0,
    routsReachedShelter: 0,
    routsMeltedAway: 0,
    routsAliveMax: 0,
    evadersAliveMax: 0,
    fatigueMax: 0,
    fatigue60ArmyTurns: 0,
  };

  for (let t = 1; t <= TURNS; t++) {
    st.getState().endSeason();
    stats.turns = t;
    const s = st.getState();
    for (const e of s.lastReport?.entries ?? []) {
      const zh = e.textZh ?? '';
      if (e.battle?.field && !e.battle.routHunt) stats.fieldClashes++;
      if (zh.includes('潰走,奔')) stats.routsFormed++;
      if (e.battle?.routHunt) stats.routHunts++;
      if (e.battle?.routDestroyed) stats.routsDestroyed++;
      const absorbed = zh.match(/收降 (\d+)/);
      if (absorbed) stats.absorbedTotal += Number(absorbed[1]);
      if (zh.includes('陣擒')) stats.fieldCaptures++;
      if (zh.includes('繳獲糧秣')) stats.spoilsEvents++;
      if (zh.includes('收容殘卒')) stats.routsReachedShelter++;
      if (zh.includes('散盡於途') || zh.includes('殘部星散')) stats.routsMeltedAway++;
    }
    let routsAlive = 0, evadersAlive = 0;
    for (const a of Object.values(s.armies)) {
      if (a.routed) routsAlive++;
      if (a.evading) evadersAlive++;
      if ((a.fatigue ?? 0) > stats.fatigueMax) stats.fatigueMax = a.fatigue ?? 0;
      if ((a.fatigue ?? 0) >= 60) stats.fatigue60ArmyTurns++;
    }
    stats.routsAliveMax = Math.max(stats.routsAliveMax, routsAlive);
    stats.evadersAliveMax = Math.max(stats.evadersAliveMax, evadersAlive);
  }

  const s = st.getState();
  console.log(JSON.stringify(stats, null, 2));
  console.log('final date', s.date, '· living forces',
    new Set(Object.values(s.cities).map((c) => c.ownerForceId).filter(Boolean)).size);
}

main();
