/**
 * Soak test for the internal-affairs systems:
 *   貪腐 (corruption) · 練度 (drill) · 屯田 (military-farming) · 練兵 (drill-troops)
 *   訟獄積案 (§1.11) · 隱戶 (§1.12) · 囤積 (§1.14) — added 2026-07, with the AI's
 *   own 決獄/括戶/抑兼併 counter-moves; the point of soaking them is to prove the
 *   three new meters find an equilibrium instead of pegging at their ceilings.
 *
 * Drives the REAL game loop headlessly in observe mode (every realm AI-run) for
 * N years, then reports:
 *   - corruption distribution over time (does it run away? does AI audit it?)
 *   - drill distribution (does AI 練兵 / does decay keep it sane?)
 *   - command usage tallied from the season reports (屯田/練兵/肅貪/賑濟…)
 *   - macro health (cities/troops/gold/food) so we'd notice a balance blowup.
 *
 * Run:  node --import tsx scripts/soak-internal-affairs.ts [years]
 */

// ── Minimal browser-global stubs so the zustand store runs under node ──
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

import { useGameStore } from '../src/game/state/store';
import { SCENARIOS } from '../src/game/data/scenarios';
import type { City } from '../src/game/types';

const YEARS = Number(process.argv[2] ?? 30);
const SEASONS = YEARS * 4;
const scenario = SCENARIOS[0];

const store = useGameStore;
store.getState().observeScenario(scenario, 'normal');

const ownedCities = (): City[] =>
  Object.values(store.getState().cities).filter((c) => c.ownerForceId);

const pct = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r = (n: number, d = 0) => Number(n.toFixed(d));

// Tally command usage from season-report zh text (resolveSeason writes these).
const cmdTally: Record<string, number> = {
  屯田: 0, 練兵: 0, 巡查肅貪: 0, 賑濟: 0, 招撫流民: 0, 城壁強化: 0, 兵怨逃屯: 0,
  // civic events (civicEvents.ts):
  貪腐醜聞: 0, 校場揚威: 0, 屯田大熟: 0,
  // §1.11–§1.14 民政三患 + AI 的對應手
  決獄: 0, 括戶: 0, 抑兼併: 0, 獄有冤死: 0,
};
const warns = { corruption: 0 };

console.log(`\n=== Soak: ${scenario.name?.zh ?? scenario.id} · ${YEARS}y (${SEASONS} seasons), observe mode ===\n`);
console.log('year  cities  corr(mean/p90/max)   docket(mean/max)  hidden(mean/max)  hoard(mean/max)   Σtroops    Σgold');

for (let s = 1; s <= SEASONS; s++) {
  store.getState().endSeason();

  // Tally this season's report.
  const rep = store.getState().lastReport;
  if (rep) {
    for (const e of rep.entries) {
      const txt = e.textZh ?? e.text ?? '';
      for (const key of Object.keys(cmdTally)) if (txt.includes(key)) cmdTally[key]++;
      if (txt.includes('貪腐已達')) warns.corruption++;
    }
  }

  if (s % 4 === 0) {
    const cs = ownedCities();
    const corr = cs.map((c) => c.corruption ?? 0);
    const docket = cs.map((c) => c.caseload ?? 0);
    const hidden = cs.map((c) => c.hiddenHouseholds ?? 0);
    const hoard = cs.map((c) => c.hoardedGrain ?? 0);
    const Σt = cs.reduce((a, c) => a + c.troops, 0);
    const Σg = cs.reduce((a, c) => a + c.gold, 0);
    const yr = s / 4;
    if (yr % 5 === 0 || yr === 1) {
      console.log(
        `${String(yr).padStart(4)}  ${String(cs.length).padStart(6)}  ` +
        `${String(r(mean(corr))).padStart(4)}/${String(pct(corr, 90)).padStart(3)}/${String(Math.max(0, ...corr)).padStart(3)}` +
        `         ${String(r(mean(docket))).padStart(4)}/${String(r(Math.max(0, ...docket))).padStart(4)}` +
        `        ${String(r(mean(hidden), 1)).padStart(5)}/${String(r(Math.max(0, ...hidden), 1)).padStart(5)}` +
        `      ${String(r(mean(hoard), 1)).padStart(5)}/${String(r(Math.max(0, ...hoard), 1)).padStart(5)}` +
        `   ${String(Math.round(Σt)).padStart(8)}  ${String(Math.round(Σg)).padStart(8)}`,
      );
    }
  }
}

console.log('\n=== Command usage (report-entry hits over the run) ===');
for (const [k, v] of Object.entries(cmdTally)) console.log(`  ${k.padEnd(10)} ${v}`);
console.log(`  貪腐警告(玩家城,觀戰下通常0)  ${warns.corruption}`);

const finalCs = ownedCities();
const finalCorr = finalCs.map((c) => c.corruption ?? 0);
const finalDocket = finalCs.map((c) => c.caseload ?? 0);
const finalHidden = finalCs.map((c) => c.hiddenHouseholds ?? 0);
const finalHoard = finalCs.map((c) => c.hoardedGrain ?? 0);
console.log('\n=== 民政三患 final ===');
console.log(`  docket: mean ${r(mean(finalDocket), 1)}, p90 ${r(pct(finalDocket, 90), 1)}, pegged@100 ${finalDocket.filter((x) => x >= 99).length}`);
console.log(`  hidden: mean ${r(mean(finalHidden), 1)}, p90 ${r(pct(finalHidden, 90), 1)}, pegged@45 ${finalHidden.filter((x) => x >= 44.5).length}`);
console.log(`  hoard : mean ${r(mean(finalHoard), 1)}, p90 ${r(pct(finalHoard, 90), 1)}, pegged@40 ${finalHoard.filter((x) => x >= 39.5).length}`);
console.log('\n=== Final sanity ===');
console.log(`  cities alive: ${finalCs.length}`);
console.log(`  corruption  : mean ${r(mean(finalCorr), 1)}, p90 ${pct(finalCorr, 90)}, max ${Math.max(0, ...finalCorr)}`);
console.log(`  cities at corruption 100 (pegged): ${finalCorr.filter((c) => c >= 100).length}`);
console.log(`  any NaN city stat: ${finalCs.some((c) => [c.gold, c.food, c.troops, c.corruption ?? 0, c.drill ?? 0].some(Number.isNaN))}`);
console.log('');

// ── 大工 §1.15 — did any realm actually raise one over the run? ──
const projects = store.getState().grandProjects ?? [];
console.log('=== 大工 ===');
console.log(`  started: ${projects.length}, finished: ${projects.filter((p) => p.done).length}`);
for (const p of projects.slice(0, 6)) {
  const city = store.getState().cities[p.cityId];
  console.log(`  ${p.id} @ ${city?.name.zh ?? p.cityId} (${p.startedYear}) ${p.done ? '成' : `餘 ${p.seasonsLeft}`}`);
}
console.log('');
