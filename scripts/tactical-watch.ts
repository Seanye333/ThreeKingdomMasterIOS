/**
 * 戰術觀測 — run AI-vs-AI tactical battles and report what the battlefield AI
 * actually does.
 *
 * `ai-watch.ts` does this for the strategic layer and it is how the 長圍 bug was
 * caught: the conversion had tests and a report line, yet in 1,100 observed
 * turns no siege ever reached 開城. The tactical layer had no equivalent — a
 * battlefield behaviour could be dead on every board and nothing would say so,
 * because every unit test only proves the behaviour *can* fire.
 *
 * Read it as a smell test, not a spec. A counter stuck at 0 means either the
 * behaviour cannot arise on these setups, or it is broken; both are worth a
 * look. Setups are varied deliberately (arm matchups, field vs walled town,
 * weather, night) so a behaviour gated on one of those still gets a chance.
 *
 * Usage:
 *   npx tsx scripts/tactical-watch.ts [battles] [maxTurns]
 *   npx tsx scripts/tactical-watch.ts 120 40
 */

import { setupTacticalBattle } from '../src/game/systems/tacticalSetup';
import { aiTakeTurn } from '../src/game/systems/tacticalAi';
import { resolveBattleEnd, pickAiFormation } from '../src/game/systems/tactical';
import type { Officer, TacticalBattle, UnitType } from '../src/game/types';

const BATTLES = Number(process.argv[2] ?? 80);
const MAX_TURNS = Number(process.argv[3] ?? 40);

/** Seeded LCG — the whole point is a run you can repeat and compare. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

let oc = 0;
function mkOfficer(war: number, lead: number, int: number): Officer {
  const id = `tw${oc++}`;
  return {
    id, name: { zh: id, en: id }, birthYear: 160,
    stats: { leadership: lead, war, intelligence: int, politics: 55, charisma: 65 },
    loyalty: 100, locationCityId: null, forceId: null, status: 'active',
    task: null, equipment: [], skills: [], rank: 'soldier',
  } as Officer;
}

const ARMS: UnitType[] = ['infantry', 'spearmen', 'cavalry', 'archers', 'siege'];

/**
 * Phrases the AI's own battle log emits, tiered by how often they should show
 * up. `common` at 0 is a warning; `rare` at 0 proves little on its own.
 */
const PHRASES: Array<[string, RegExp, 'common' | 'rare']> = [
  ['移動', /行(?:軍|進)|移動|逼近/, 'common'],
  ['近戰', /斬|殺|擊潰|力戰|交鋒|白刃/, 'common'],
  ['矢雨', /矢雨|齊射|箭雨|放箭/, 'common'],
  ['士氣潰', /潰|奔逃|奪氣|軍心/, 'common'],
  ['追擊', /掩殺|銜尾|追擊/, 'common'],
  ['據守', /據守|立防|嚴陣/, 'common'],
  ['陣形', /陣$|改陣|變陣|布陣/, 'rare'],
  ['計略', /計|謀|火攻|亂/, 'common'],
  ['衝鋒', /衝鋒|蓄勢|突陣/, 'common'],
  ['單挑', /搦戰|單挑|挑落|一騎/, 'rare'],
  ['車輪戰', /車輪戰/, 'rare'],
  ['築壘', /築壘|工事|鹿砦/, 'rare'],
  ['破城', /攻城槌|投石|城門告破|城牆崩塌/, 'rare'],
  ['搶修', /搶修/, 'rare'],
  ['雲梯', /雲梯/, 'rare'],
  ['伏兵', /伏兵|埋伏|現形/, 'rare'],
  ['夜戰', /日暮|入夜|夜/, 'rare'],
  ['天候', /雨|風|雪|霧/, 'rare'],
  ['糧盡', /糧盡|斷糧|補給/, 'rare'],
  ['異象', /流星|疫疾|鼓舞/, 'rare'],
];

const counts: Record<string, number> = {};
for (const [k] of PHRASES) counts[k] = 0;

let decided = 0;
let capped = 0;
let totalTurns = 0;
let attackerWins = 0;
let capturedTotal = 0;
let deadTotal = 0;
let siegeBoards = 0;
let breaches = 0;

for (let n = 0; n < BATTLES; n++) {
  const rng = lcg(7919 + n * 131);
  // Spread the setups so behaviours gated on terrain / arm / walls get a turn.
  const aArm = ARMS[n % ARMS.length];
  const dArm = ARMS[(n * 3 + 1) % ARMS.length];
  const walled = n % 3 === 0;              // every third battle is a siege
  const officers: Record<string, Officer> = {};
  /**
   * Mixed arms, not three of a kind. A single-arm column makes several
   * behaviours structurally impossible — 雲梯登城 needs foot AND an engine
   * braced on the same wall, so an all-siege attacker has nobody to climb and
   * an all-foot one has no ladder. The first version of this script reported
   * 雲梯 = 0 for exactly that reason, which was a flaw in the harness rather
   * than a finding about the AI.
   */
  const side = (arm: UnitType, siegeFirst: boolean) => [0, 1, 2].map((i) => {
    const o = mkOfficer(i === 0 ? 84 : 72, i === 0 ? 80 : 68, i === 1 ? 88 : 62);
    officers[o.id] = o;
    const unitType: UnitType = siegeFirst && i === 0 ? 'siege'
      : i === 2 ? 'infantry'
      : arm;
    return { officer: o, troops: 6000, unitType };
  });

  const dForm = pickAiFormation([dArm, dArm, dArm], 66, { defensive: true });
  const aForm = pickAiFormation([aArm, aArm, aArm], 66, { counter: dForm });
  let b: TacticalBattle = setupTacticalBattle({
    cityId: walled ? `tw-town-${n}` : `tw-field-${n}`,
    width: 14, height: 10,
    attackerForceId: 'A', defenderForceId: 'D',
    attackers: side(aArm, walled), defenders: side(dArm, false),
    attackerFormation: aForm, defenderFormation: dForm,
    field: !walled,
  });
  if (walled) siegeBoards++;
  const wallsAtStart = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate').length;

  let guard = MAX_TURNS * 4;
  while (!b.winner && b.turn <= MAX_TURNS && guard-- > 0) {
    b = aiTakeTurn(b, officers, rng, { skill: 1, autoDuel: true }).battle;
  }
  totalTurns += b.turn;
  if (b.winner) { decided++; if (b.winner === 'attacker') attackerWins++; } else capped++;

  if (walled) {
    const wallsLeft = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate').length;
    if (wallsLeft < wallsAtStart) breaches++;
  }

  for (const line of b.log ?? []) {
    const zh = String(line.text ?? '');
    for (const [key, re] of PHRASES) if (re.test(zh)) counts[key]++;
  }

  const res = resolveBattleEnd(b, officers);
  capturedTotal += res.capturedOfficerIds.length;
  deadTotal += res.attackerDead.length + res.defenderDead.length;
}

console.log(`\n=== 戰術觀測 · ${BATTLES} 場 AI 對 AI · 每場至多 ${MAX_TURNS} 回合 ===`);
console.log(`分出勝負 ${decided}   打到回合上限 ${capped}   平均 ${(totalTurns / BATTLES).toFixed(1)} 回合`);
console.log(`攻方勝率 ${decided ? ((attackerWins / decided) * 100).toFixed(0) : '—'}%   生擒 ${capturedTotal}   陣亡 ${deadTotal}`);
console.log(`攻城棋盤 ${siegeBoards} 場,其中曾破牆/破門 ${breaches} 場`);
console.log('\n戰報關鍵詞出現次數:');
for (const [k, , freq] of PHRASES) {
  const v = counts[k];
  const flag = v === 0 && freq === 'common' ? '⚠ ' : '  ';
  console.log(`  ${flag}${k.padEnd(6, '　')} ${String(v).padStart(5)}${v === 0 && freq === 'rare' ? '   (條件苛刻,0 未必是問題)' : ''}`);
}
// 打到上限 = 兩邊都不肯決戰,通常表示 AI 陷入某種對峙迴圈。
if (capped / BATTLES > 0.35) {
  console.log(`\n⚠ 逾三成的場次打到回合上限(${capped}/${BATTLES}) — AI 可能陷入對峙不肯接戰。`);
}
if (siegeBoards > 0 && breaches === 0) {
  console.log('\n⚠ 攻城棋盤一場都沒破牆 — 攻城 AI 可能不會用攻城械。');
}
console.log('');
