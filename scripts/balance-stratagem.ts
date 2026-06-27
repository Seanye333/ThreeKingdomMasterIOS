/**
 * 計謀平衡跑分 — headless resolveBattle() sweeps to check the abstract-combat
 * scheme system (§5.3): is scheming (high INT) worth too much? is 連環 (INT≥90)
 * a runaway? does a wise defender (看破 + 守城計) hold? Reports attacker win%
 * and scheme-firing rates across INT matchups, terrain & weather.
 *
 * Run:  node --import tsx scripts/balance-stratagem.ts [N]
 */
import { resolveBattle, type BattleSide } from '../src/game/systems/combat';
import type { City, Officer, Weather } from '../src/game/types';

const N = Number(process.argv[2] ?? 400);

function lcg(seed: number): () => number {
  // Scramble the seed (Knuth multiplicative) + warm up, else consecutive small
  // seeds give correlated EARLY outputs — which skews a single early rng() call
  // like the 看破 check. (The game itself uses Math.random, so it's unaffected.)
  let s = ((seed ^ 0x9e3779b9) * 2654435761) >>> 0;
  for (let i = 0; i < 8; i++) s = (s * 1664525 + 1013904223) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

let oc = 0;
const off = (intelligence: number): Officer => ({
  id: `o${oc++}`, name: { zh: 'x', en: 'x' }, birthYear: 160,
  stats: { leadership: 75, war: 75, intelligence, politics: 50, charisma: 60 },
  loyalty: 100, locationCityId: null, forceId: null, status: 'active', task: null,
  equipment: [], skills: [], rank: 'soldier',
} as Officer);

const cityOf = (terrain: string): City => ({ id: 'c', name: { zh: '城', en: 'City' }, terrain, port: terrain === 'water' } as unknown as City);
const weatherOf = (kind: string, windPower: number): Weather => ({ kind, windPower, wind: 'east' } as unknown as Weather);

interface Row { aw: number; n: number; aSucc: number; aSeen: number; chain: number; dSucc: number; }

function sweep(label: string, aInt: number, dInt: number, terrain: string, weather: Weather): Row {
  const r: Row = { aw: 0, n: 0, aSucc: 0, aSeen: 0, chain: 0, dSucc: 0 };
  for (let s = 0; s < N; s++) {
    const a: BattleSide = { troops: 20000, commander: off(aInt), companions: [off(aInt - 5)] };
    const d: BattleSide = { troops: 20000, commander: off(dInt), companions: [off(dInt - 5)] };
    const res = resolveBattle(a, d, 22, lcg(s + label.length * 131 + 1), { city: cityOf(terrain), weather, allowPursuit: true });
    r.n++;
    if (res.attackerWins) r.aw++;
    if (res.stratagem?.succeeded) r.aSucc++;
    if (res.stratagem?.seenThrough) r.aSeen++;
    if (res.stratagemChain) r.chain++;
    if (res.defenderStratagem?.succeeded) r.dSucc++;
  }
  return r;
}

const pc = (x: number, n: number) => `${Math.round((100 * x) / Math.max(1, n))}%`;
const show = (label: string, r: Row) =>
  console.log(`  ${label.padEnd(22)} ATK ${pc(r.aw, r.n).padStart(4)}  | 攻計成 ${pc(r.aSucc, r.n)} 看破 ${pc(r.aSeen, r.n)} 連環 ${pc(r.chain, r.n)} · 守計成 ${pc(r.dSucc, r.n)}`);

const wind = weatherOf('wind', 3), clear = weatherOf('clear', 0), rain = weatherOf('rain', 1);

console.log(`stratagem balance — ${N} battles/cell, equal 20k forces, cityDef 22\n`);

console.log('▶ attacker INT sweep (vs DEF int 70, mountain+wind) — watch the 90 連環 jump:');
for (const ai of [50, 70, 80, 85, 88, 90, 95]) show(`aINT ${ai}`, sweep(`a${ai}`, ai, 70, 'mountain', wind));

console.log('\n▶ defender INT sweep (vs ATK int 90, mountain+wind) — 看破 + 守城計:');
for (const di of [50, 70, 80, 85, 90, 95]) show(`dINT ${di}`, sweep(`d${di}`, 90, di, 'mountain', wind));

console.log('\n▶ mirror (both equal INT, mountain+wind) — should hover ~50%:');
for (const i of [60, 75, 90, 95]) show(`${i} vs ${i}`, sweep(`m${i}`, i, i, 'mountain', wind));

console.log('\n▶ terrain/weather (aINT 90 vs dINT 70) — where do schemes even fire?:');
show('mountain+wind', sweep('tw1', 90, 70, 'mountain', wind));
show('plain+clear', sweep('tw2', 90, 70, 'plain', clear));
show('plain+rain', sweep('tw3', 90, 70, 'plain', rain));
show('water+wind', sweep('tw4', 90, 70, 'water', wind));
