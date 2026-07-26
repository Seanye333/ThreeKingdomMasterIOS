/**
 * 演義觀測 — run a scenario with every force under AI control and report what
 * the AI actually did.
 *
 * Unit tests assert that a system *can* fire; this asks whether it *does*,
 * over a campaign's worth of turns. That gap is where the 長圍 bug lived: the
 * conversion had tests and a report line, but the camp evaporated on the turn
 * it was pitched, so in 1,100 observed turns no siege ever reached 開城 —
 * a number no unit test was looking at.
 *
 * Usage:
 *   npx tsx scripts/ai-watch.ts [scenarioId] [turns]
 *   npx tsx scripts/ai-watch.ts scn-220-declaration 300
 *
 * Read it as a smell test, not a spec: a counter stuck at 0 means either the
 * system never triggers on this board, or it is broken. Both are worth a look.
 */

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

const scenarioId = process.argv[2] ?? 'scn-220-declaration';
const TURNS = Number(process.argv[3] ?? 300);
const scn = SCENARIOS.find((s) => s.id === scenarioId);
if (!scn) {
  console.error(`unknown scenario ${scenarioId}. Try one of:`);
  console.error(SCENARIOS.slice(0, 12).map((s) => `  ${s.id}  ${s.name.zh}`).join('\n'));
  process.exit(1);
}

const st = useGameStore;
st.getState().observeScenario(scn, 'normal');   // 演義模擬器 — no player force

/**
 * Only phrases that are reliably emitted. Conquest is deliberately NOT here:
 * a city changing hands has no single wording, and `城池易主` below counts it
 * exactly. A keyword that under-matches reads as a dead system and sends the
 * next reader hunting a bug that isn't there.
 *
 * `rare` marks conditions that are genuinely narrow — 0 there is weak
 * evidence on its own (AI bridge-burning needs a camp pitched beside a river
 * with a hostile column closing, then a 25% roll).
 */
const PHRASES: Array<[string, RegExp, 'common' | 'rare']> = [
  ['長圍紮營', /長圍|坐待糧盡/, 'common'],
  ['開城/突圍', /開城|突圍/, 'common'],
  ['設伏/伏擊', /設伏|伏兵|中伏/, 'common'],
  ['計略', /離間|流言|疑兵|詐降|反間/, 'common'],
  ['諜報', /細作|間諜|諜報|刺探/, 'common'],
  ['外交', /結盟|和睦|絕交|稱臣|歲幣/, 'common'],
  ['災異', /蝗|大水|地動|疫|旱/, 'common'],
  ['民變/教亂', /起義|信眾蔓延|太平道|黃天|流民作亂|饑荒蔓延/, 'common'],
  ['焚橋/攔江', /焚橋|斷渡|攔江|鐵鎖/, 'rare'],
  ['劫糧道', /劫了.*糧道/, 'rare'],
];

const counts: Record<string, number> = Object.fromEntries(PHRASES.map(([k]) => [k, 0]));
const seenArmies = new Set<string>();
let flips = 0, siegeTurns = 0, maxArmies = 0, facilitiesMax = 0;

const owners: Record<string, string | null> = {};
for (const c of Object.values(st.getState().cities)) owners[c.id] = c.ownerForceId;

for (let t = 0; t < TURNS; t++) {
  st.getState().endSeason();
  const s = st.getState();
  for (const c of Object.values(s.cities)) {
    if (c.ownerForceId !== owners[c.id]) { flips++; owners[c.id] = c.ownerForceId; }
  }
  const armies = Object.values(s.armies);
  maxArmies = Math.max(maxArmies, armies.length);
  for (const a of armies) {
    seenArmies.add(a.id);
    if ((a as { besieging?: string }).besieging) siegeTurns++;
  }
  facilitiesMax = Math.max(facilitiesMax, Object.keys(s.forts ?? {}).length);
  for (const e of s.lastReport?.entries ?? []) {
    const zh = String(e.textZh ?? '');
    for (const [key, re] of PHRASES) if (re.test(zh)) counts[key]++;
  }
}

const s = st.getState();
const byForce: Record<string, number> = {};
for (const c of Object.values(s.cities)) {
  if (c.ownerForceId) byForce[c.ownerForceId] = (byForce[c.ownerForceId] ?? 0) + 1;
}

console.log(`\n=== ${scn.name.zh} (${scn.id}) · ${TURNS} 旬 ≈ ${(TURNS / 24).toFixed(1)} 年 · 全 AI ===`);
console.log(`城池易主 ${flips}   出過的軍隊 ${seenArmies.size}   同時在野最多 ${maxArmies}   圍城旬次 ${siegeTurns}   施設峰值 ${facilitiesMax}`);
console.log('\n報告關鍵詞出現次數:');
for (const [k, , freq] of PHRASES) {
  const n = counts[k];
  // Only flag a silent COMMON system — a rare one at 0 proves little.
  const flag = n === 0 && freq === 'common' ? '⚠ ' : '  ';
  console.log(`  ${flag}${k.padEnd(10, '　')} ${String(n).padStart(4)}${n === 0 && freq === 'rare' ? '   (條件苛刻,0 未必是問題)' : ''}`);
}
console.log('  (城池陷落沒有單一文案,見上方「城池易主」計數)');
console.log(`\n開局勢力 ${scn.forces.length} → 存活 ${Object.keys(byForce).length}`);
console.log('城數:', Object.entries(byForce).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => `${f}:${n}`).join('  '));
console.log('終局:', s.date, '\n');
