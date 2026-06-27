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
import { setupTacticalBattle, aiTakeTurn } from '../src/game/systems/tactical';
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

  let b: TacticalBattle = setupTacticalBattle({
    cityId: 'demo', width: 14, height: 10,
    attackerForceId: 'A', defenderForceId: 'D',
    attackers, defenders,
    attackerFormation: cfg.aForm, defenderFormation: cfg.dForm,
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
const run = (cfg: Config) => { const outs: Outcome[] = []; for (let s = 0; s < N; s++) outs.push(runBattle(cfg, s + cfg.label.length * 1000)); summarize(cfg.label, outs); };

// Run an arm matchup BOTH ways (X-atk / X-def) so the side bias cancels and we
// see the true arm edge: how often arm X beats arm Y regardless of side.
function armEdge(xName: string, x: UnitType, yName: string, y: UnitType) {
  let xWins = 0, n = 0;
  for (let s = 0; s < N; s++) {
    const a = runBattle({ label: `${xName}v${yName}A`, aArms: [x, x, x], dArms: [y, y, y], aTroops: 18000, dTroops: 18000 }, s + 7000);
    if (a.winner === 'attacker') xWins++; if (a.winner !== 'none') n++;
    const b = runBattle({ label: `${xName}v${yName}B`, aArms: [y, y, y], dArms: [x, x, x], aTroops: 18000, dTroops: 18000 }, s + 9000);
    if (b.winner === 'defender') xWins++; if (b.winner !== 'none') n++;
  }
  console.log(`  ${xName} vs ${yName}: ${xName} wins ${Math.round((100 * xWins) / n)}%  (both sides, n=${n})`);
}

console.log(`tactical balance — ${N} battles/config, seeded`);

// 1) side neutrality — mirror, equal forces (ATK% should be ~50–60, not 80+)
run({ label: 'mirror inf (equal)', aArms: [inf, inf, inf], dArms: [inf, inf, inf], aTroops: 18000, dTroops: 18000 });
run({ label: 'mirror cav (equal)', aArms: [cav, cav, cav], dArms: [cav, cav, cav], aTroops: 18000, dTroops: 18000 });
// 2) counter triangle — measured BOTH ways (decoupled from side). Want winner ~62–72%.
console.log('\n▶ arm triangle (side-decoupled):');
armEdge('spear', spe, 'cav', cav);   // spear should beat cav
armEdge('cav', cav, 'arch', arc);    // cav should beat arch
armEdge('arch', arc, 'spear', spe);  // arch should beat spear
armEdge('spear', spe, 'arch', arc);  // off-triangle: arch should beat spear-ish? (spear loses to arch)
// 3) force ratio — attacker +30% (should be a clear but not total edge)
run({ label: 'inf +30% atk', aArms: [inf, inf, inf], dArms: [inf, inf, inf], aTroops: 23400, dTroops: 18000 });
// 4) combined arms mirror (watch cap-hit% = grind)
run({ label: 'combined arms', aArms: [spe, cav, arc], dArms: [spe, cav, arc], aTroops: 18000, dTroops: 18000 });
