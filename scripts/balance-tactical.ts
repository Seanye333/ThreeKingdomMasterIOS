/**
 * 戰術平衡跑分 — headless AI-vs-AI tactical battles to surface §5.1 balance.
 *
 * Runs many automated battles across controlled configs (mirror, counter-
 * triangle, force-ratio, terrain/weather) and reports:
 *   - attacker vs defender win% (is the engine side-neutral?)
 *   - arm-matchup win% (does the spear>cav>arch>spear triangle hold, sanely?)
 *   - turn distribution + % hitting the 30-turn cap (snowbally? grindy?)
 *   - how the day was decided (commander killed / army broken / cap)
 *   - per-battle mechanic firing rates (rout/charge/encircle/duel/…)
 *
 * Run:  node --import tsx scripts/balance-tactical.ts [battlesPerConfig]
 */
import { pickAiFormation } from '../src/game/systems/tactical';
import { aiTakeTurn } from '../src/game/systems/tacticalAi';
import { setupTacticalBattle } from '../src/game/systems/tacticalSetup';
import type { Officer, UnitType, TacticalBattle, FormationId, Weather } from '../src/game/types';

const N = Number(process.argv[2] ?? 240);

// ── seeded RNG (LCG) so runs are reproducible ──
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

let oc = 0;
function mkOfficer(war: number, lead: number, intel: number): Officer {
  const id = `o${oc++}`;
  return {
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: lead, war, intelligence: intel, politics: 50, charisma: 60 },
    loyalty: 100, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  } as Officer;
}

interface Config {
  label: string;
  aArms: UnitType[]; dArms: UnitType[];
  aTroops: number; dTroops: number;
  aForm?: FormationId; dForm?: FormationId;
  weather?: Weather; terrainHint?: 'plain' | 'mountain' | 'forest';
}

interface Outcome {
  winner: 'attacker' | 'defender' | 'none';
  turns: number; aLoss: number; dLoss: number; momentum: number;
  decidedBy: 'commander' | 'broken' | 'cap' | 'wipe';
  fired: Record<string, number>;
}

const MECH: Record<string, RegExp> = {
  rout: /潰走|軍心崩潰/, pursuit: /銜尾|甕中/, charge: /衝鋒陷陣|衝勢/, brace: /立防/,
  encircle: /困獸|腹背受敵/, duel: /單挑|挑落|搦戰/, succession: /接掌帥旗/,
  volley: /矢雨/, fire: /烈焰|火勢|焚/, feign: /佯敗|詐敗/, reform: /臨陣變陣/,
};

function runBattle(cfg: Config, seed: number): Outcome {
  const rng = lcg(seed + 1);
  const officers: Record<string, Officer> = {};
  const mk = (arms: UnitType[], troops: number) => arms.map((unitType, i) => {
    const o = mkOfficer(i === 0 ? 80 : 74, i === 0 ? 78 : 70, 66);
    officers[o.id] = o;
    return { officer: o, troops: Math.floor(troops / arms.length), unitType };
  });
  const attackers = mk(cfg.aArms, cfg.aTroops);
  const defenders = mk(cfg.dArms, cfg.dTroops);

  // Mirror the store: each side draws up a formation (the defender first, the
  // attacker countering it) unless the config pins one — so the run exercises
  // the real §5.2 system, not formation-less armies.
  const dForm = cfg.dForm ?? pickAiFormation(cfg.dArms, defenders[0].officer.stats.intelligence, { defensive: true });
  const aForm = cfg.aForm ?? pickAiFormation(cfg.aArms, attackers[0].officer.stats.intelligence, { counter: dForm });
  let b: TacticalBattle = setupTacticalBattle({
    cityId: 'demo', width: 14, height: 10,
    attackerForceId: 'A', defenderForceId: 'D',
    attackers, defenders,
    attackerFormation: aForm, defenderFormation: dForm,
    weather: cfg.weather, field: true,
    terrainHint: cfg.terrainHint ? { category: cfg.terrainHint } as never : undefined,
  });

  let guard = 120;
  while (!b.winner && b.turn <= 30 && guard-- > 0) {
    b = aiTakeTurn(b, officers, rng, { skill: 1, autoDuel: true }).battle;
  }

  const text = (b.log ?? []).map((e) => e.text).join('\n');
  const fired: Record<string, number> = {};
  for (const [k, re] of Object.entries(MECH)) fired[k] = re.test(text) ? 1 : 0;

  let decidedBy: Outcome['decidedBy'] = 'cap';
  if (/陣亡 — 全軍動搖/.test(text) && b.turn <= 30) decidedBy = 'commander';
  else if (/三軍|盡潰/.test(text)) decidedBy = 'broken';
  if (b.turn <= 30 && b.winner && decidedBy === 'cap') decidedBy = 'wipe';

  return {
    winner: b.winner ?? 'none',
    turns: b.turn, aLoss: b.attackerLosses, dLoss: b.defenderLosses,
    momentum: b.momentum ?? 0, decidedBy, fired,
  };
}

function summarize(label: string, outs: Outcome[]) {
  const n = outs.length;
  const aw = outs.filter((o) => o.winner === 'attacker').length;
  const dw = outs.filter((o) => o.winner === 'defender').length;
  const none = outs.filter((o) => o.winner === 'none').length;
  const turns = outs.map((o) => o.turns).sort((a, b) => a - b);
  const med = turns[Math.floor(n / 2)];
  const cap = outs.filter((o) => o.turns > 30).length;
  const dec: Record<string, number> = {};
  for (const o of outs) dec[o.decidedBy] = (dec[o.decidedBy] ?? 0) + 1;
  const fired: Record<string, number> = {};
  for (const o of outs) for (const [k, v] of Object.entries(o.fired)) fired[k] = (fired[k] ?? 0) + v;
  const pc = (x: number) => `${Math.round((100 * x) / n)}%`;
  console.log(`\n■ ${label}  (n=${n})`);
  console.log(`  win:  ATK ${pc(aw)}  DEF ${pc(dw)}  unresolved ${pc(none)}`);
  console.log(`  turns: median ${med}  cap-hit ${pc(cap)}   decided: ${Object.entries(dec).map(([k, v]) => `${k} ${pc(v)}`).join(' · ')}`);
  console.log(`  mech fired (≥1×/battle): ${Object.entries(fired).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${pc(v)}`).join(' · ')}`);
}

const inf: UnitType = 'infantry', spe: UnitType = 'spearmen', cav: UnitType = 'cavalry', arc: UnitType = 'archers';
const ARMS: Array<[string, UnitType]> = [['inf', inf], ['spear', spe], ['cav', cav], ['arch', arc]];
const run = (cfg: Config) => { const outs: Outcome[] = []; for (let s = 0; s < N; s++) outs.push(runBattle(cfg, s + cfg.label.length * 1000)); summarize(cfg.label, outs); return outs; };

// Side-bias for a mirror config = ATK win% (50 is neutral).
function sideBias(name: string, arm: UnitType): number {
  let aw = 0, n = 0;
  for (let s = 0; s < N; s++) {
    const o = runBattle({ label: name, aArms: [arm, arm, arm], dArms: [arm, arm, arm], aTroops: 18000, dTroops: 18000 }, s + 100);
    if (o.winner === 'attacker') aw++; if (o.winner !== 'none') n++;
  }
  return Math.round((100 * aw) / n);
}

// Arm X vs Y BOTH ways (side cancels) → X win%.
function armEdge(x: UnitType, y: UnitType): number {
  let xWins = 0, n = 0;
  for (let s = 0; s < N; s++) {
    const a = runBattle({ label: 'a', aArms: [x, x, x], dArms: [y, y, y], aTroops: 18000, dTroops: 18000 }, s + 7000);
    if (a.winner === 'attacker') xWins++; if (a.winner !== 'none') n++;
    const b = runBattle({ label: 'b', aArms: [y, y, y], dArms: [x, x, x], aTroops: 18000, dTroops: 18000 }, s + 9000);
    if (b.winner === 'defender') xWins++; if (b.winner !== 'none') n++;
  }
  return Math.round((100 * xWins) / n);
}

// ── 單場追蹤 — print one battle turn-by-turn to SEE why a side wins ──
function trace(cfg: Config, seed: number) {
  const rng = lcg(seed + 1);
  const officers: Record<string, Officer> = {};
  const mk = (arms: UnitType[], troops: number, side: string) => arms.map((unitType, i) => {
    const o = mkOfficer(i === 0 ? 80 : 74, i === 0 ? 78 : 70, 66); o.id = `${side}${i}`; officers[o.id] = o;
    return { officer: o, troops: Math.floor(troops / arms.length), unitType };
  });
  let b = setupTacticalBattle({
    cityId: 'demo', width: 14, height: 10, attackerForceId: 'A', defenderForceId: 'D',
    attackers: mk(cfg.aArms, cfg.aTroops, 'A'), defenders: mk(cfg.dArms, cfg.dTroops, 'D'), field: true,
  });
  const tot = (s: string) => b.units.filter((u) => u.side === s && u.troops > 0).reduce((a, u) => a + u.troops, 0);
  const cnt = (s: string) => b.units.filter((u) => u.side === s && u.troops > 0).length;
  console.log(`\n══ TRACE ${cfg.label} seed=${seed} ══`);
  let prevLog = 0;
  while (!b.winner && b.turn <= 30) {
    const before = b.turn, side = b.activeSide;
    b = aiTakeTurn(b, officers, rng, { skill: 1, autoDuel: true }).battle;
    const events = (b.log ?? []).slice(prevLog).filter((e) => e.kind === 'event').map((e) => e.text);
    prevLog = (b.log ?? []).length;
    console.log(`T${before} ${side.slice(0, 3)} → ATK ${cnt('attacker')}u/${tot('attacker')}  DEF ${cnt('defender')}u/${tot('defender')}  mom ${b.momentum ?? 0}${events.length ? '  | ' + events.slice(0, 3).join(' ; ') : ''}`);
  }
  console.log(`  winner: ${b.winner ?? 'none'} @T${b.turn}`);
}

if (process.argv[2] === 'trace') {
  const A: Record<string, UnitType> = { inf, spear: spe, cav, arch: arc };
  const ax = A[process.argv[4] ?? 'inf'], dx = A[process.argv[5] ?? process.argv[4] ?? 'inf'];
  trace({ label: `${process.argv[4] ?? 'inf'} vs ${process.argv[5] ?? process.argv[4] ?? 'inf'}`, aArms: [ax, ax, ax], dArms: [dx, dx, dx], aTroops: 18000, dTroops: 18000 }, Number(process.argv[3] ?? 0));
  process.exit(0);
}

console.log(`tactical balance — ${N} battles/config, seeded`);

// ── 1) side neutrality per arm (mirror, equal). 50 = neutral; want ~50–62 ──
console.log('\n▶ side bias (mirror, equal — ATK win%, 50=neutral):');
for (const [nm, arm] of ARMS) console.log(`  ${nm}: ${sideBias('m', arm)}%`);

// ── 2) full arm-power matrix (side-decoupled). Each cell = row beats col % ──
console.log('\n▶ arm matrix (row beats col %, side-decoupled):');
console.log('         ' + ARMS.map(([n]) => n.padStart(5)).join(' '));
const power: Record<string, number[]> = {};
for (const [rn, r] of ARMS) {
  const row = ARMS.map(([cn, c]) => (rn === cn ? 50 : armEdge(r, c)));
  power[rn] = row;
  console.log(`  ${rn.padStart(6)} ` + row.map((v) => `${v}`.padStart(5)).join(' '));
}
console.log('  arm power (avg vs others): ' + ARMS.map(([n]) => `${n} ${Math.round(power[n].reduce((a, b) => a + b, 0) / 4)}`).join(' · '));

// ── 3) terrain & weather (mirror inf; does the defender benefit from ground?) ──
console.log('\n▶ terrain/weather (mirror inf — ATK win%):');
for (const t of ['plain', 'forest', 'mountain'] as const) {
  let aw = 0, n = 0;
  for (let s = 0; s < N; s++) { const o = runBattle({ label: t, aArms: [inf, inf, inf], dArms: [inf, inf, inf], aTroops: 18000, dTroops: 18000, terrainHint: t }, s + 200); if (o.winner === 'attacker') aw++; if (o.winner !== 'none') n++; }
  console.log(`  ${t}: ATK ${Math.round((100 * aw) / n)}%`);
}
for (const w of ['rain', 'snow'] as const) {
  let aw = 0, n = 0;
  for (let s = 0; s < N; s++) { const o = runBattle({ label: w, aArms: [inf, inf, inf], dArms: [inf, inf, inf], aTroops: 18000, dTroops: 18000, weather: w }, s + 300); if (o.winner === 'attacker') aw++; if (o.winner !== 'none') n++; }
  console.log(`  ${w}: ATK ${Math.round((100 * aw) / n)}%`);
}

// ── 4) force-ratio sweep (mirror inf; how much do numbers decide?) ──
console.log('\n▶ force ratio (mirror inf, ATK troops × — ATK win%):');
for (const r of [1.0, 1.15, 1.3, 1.5, 2.0]) {
  let aw = 0, n = 0;
  for (let s = 0; s < N; s++) { const o = runBattle({ label: `r${r}`, aArms: [inf, inf, inf], dArms: [inf, inf, inf], aTroops: Math.round(18000 * r), dTroops: 18000 }, s + 400); if (o.winner === 'attacker') aw++; if (o.winner !== 'none') n++; }
  console.log(`  ×${r}: ATK ${Math.round((100 * aw) / n)}%`);
}

// ── 5) grind / combined arms ──
run({ label: 'combined arms (cap-hit = grind)', aArms: [spe, cav, arc], dArms: [spe, cav, arc], aTroops: 18000, dTroops: 18000 });
