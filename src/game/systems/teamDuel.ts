import type { Officer } from '../types';
import { staticProwess, duelDeathFate, weaponClassFor, type DuelFate } from './duel';
import { areBonded } from './tactical';
import { areSwornBrothers } from './relationshipEffects';
import { lineageBond, type LineageLedger } from './lineage';
import { gradeCombatBonus } from './gradeCombat';

/**
 * 團戰單挑 — a real N-vs-M melee of champions, beyond the 援護 tag-in (where allies
 * fight ONE at a time). Every fighter on both sides trades blows at once: an
 * outnumbered champion is ganged (圍攻 — you can only turn one blade aside a round),
 * sworn brothers who focus the same foe strike as one (合擊), and a downed fighter's
 * 膽氣 decides whether they fall, yield or flee (reuses duelDeathFate — §6.2c).
 *
 * This is the 三英戰呂布 engine: three heroes CAN wear a demigod down, but he cuts
 * one of them badly first. Auto-resolved and pure given the rng.
 */

const MAX_TEAM_ROUNDS = 12;

/** 站位 — 前鋒 (van) screens the 後衛 (rear). Melee can only reach the rear once
 *  every van of that side is down; a 弓手 shoots over the screen from the start. */
export type TeamStation = 'van' | 'rear';
export interface TeamMember { officer: Officer; station?: TeamStation }

export interface TeamFighter {
  id: string;
  officer: Officer;
  stamina: number;
  prowess: number;
  side: 'a' | 'b';
  /** 站位 — van screens; rear is screened (and a rear melee arm pokes at ×0.55). */
  station: TeamStation;
  /** 弓手 — shoots over the enemy screen, and at full power from the rear. */
  ranged: boolean;
  downed: boolean;
  /** Set once downed: 斬 (slain) / 請降 (yield) / 落荒 (flee), per 膽氣. */
  fate?: DuelFate;
  /** Round the fighter went down (for the log / replay). */
  downedRound?: number;
}

export interface TeamDuelResult {
  winner: 'a' | 'b' | 'draw';
  rounds: number;
  a: TeamFighter[];
  b: TeamFighter[];
  log: { zh: string; en: string }[];
}

/** 合擊 — sworn brothers, bonded pairs, and 同門/師徒 of one school strike as
 *  one when they gang a foe. The lineage ledger is passed in (empty = the
 *  original bonded/sworn reading), so this stays pure. */
function synergy(x: Officer, y: Officer, lineage: LineageLedger): boolean {
  return areBonded(x.id, y.id) || areSwornBrothers(x.id, y.id)
    || lineageBond(lineage, x.id, y.id, 'martial') !== null;
}

/** 親督軍令 (§6.11 互動) — the player's per-round orders for side A. */
export interface TeamOrders {
  /** 集火 — the enemy id side A's melee presses (unset/unreachable = default weakest). */
  focusId?: string;
  /** 死守 — an A fighter who fights defensively this round: their own blow lands
   *  at half force, but they turn aside their TWO sharpest attackers (not one). */
  guardId?: string;
}

const alive = (arr: TeamFighter[]) => arr.filter((f) => !f.downed);
const nm = (f: TeamFighter) => f.officer.name;

/** One melee round, mutating A/B in place. Returns the fighters downed this
 *  round. `orders` (if any) steer side A — the engine's own instincts otherwise. */
function runTeamRound(A: TeamFighter[], B: TeamFighter[], r: number, rng: () => number, log: { zh: string; en: string }[], orders?: TeamOrders, lineage: LineageLedger = []): TeamFighter[] {
  const av = alive(A), bv = alive(B);
  // 站位 — the van screens the rear: melee reaches the rear only once every
  // van of that side is down; a 弓手 shoots over the screen from round one.
  const screened = (foes: TeamFighter[]) => foes.some((f) => f.station === 'van');
  const reachable = (atk: TeamFighter, foes: TeamFighter[]) =>
    atk.ranged || !screened(foes) ? foes : foes.filter((f) => f.station === 'van');
  // Targeting — focus fire the reachable enemy on the least 氣力.
  const pickTarget = (foes: TeamFighter[]) =>
    foes.reduce((m, f) => (f.stamina < m.stamina ? f : m), foes[0]);
  const incoming = new Map<string, { atk: TeamFighter; dmg: number }[]>();
  const queue = (atk: TeamFighter, foesAll: TeamFighter[], ownSide: TeamFighter[]) => {
    const foes = reachable(atk, foesAll);
    if (!foes.length) return;
    // 集火令 — side A presses the ordered foe when they can be reached.
    const ordered = orders?.focusId && atk.side === 'a' ? foes.find((f) => f.id === orders.focusId) : undefined;
    const tgt = ordered ?? pickTarget(foes);
    const edge = Math.max(-8, Math.min(16, (atk.prowess - tgt.prowess) * 0.25));
    let dmg = 12 + Math.floor(rng() * 10) + edge;
    // 掠陣 — a rear MELEE arm only pokes past its own screen (×0.55) while that
    // screen stands; once the van falls they step up and strike full.
    if (!atk.ranged && atk.station === 'rear' && ownSide.some((f) => f.station === 'van')) dmg *= 0.55;
    // 死守 — a guarding fighter spends the round on defense; their blow glances.
    if (orders?.guardId === atk.id && atk.side === 'a') dmg *= 0.5;
    const arr = incoming.get(tgt.id) ?? [];
    // 合擊 — a blow lands harder if a bonded ally is already pressing this foe.
    if (arr.some((x) => synergy(x.atk.officer, atk.officer, lineage))) dmg += 8;
    arr.push({ atk, dmg: Math.max(4, Math.round(dmg)) });
    incoming.set(tgt.id, arr);
  };
  for (const atk of av) queue(atk, bv, av);
  for (const atk of bv) queue(atk, av, bv);

  // Apply — 圍攻: a fighter turns aside only their single deadliest attacker (−40%);
  // every other blow lands clean. A 死守 order turns aside the two deadliest.
  const applyTo = (arr: TeamFighter[]) => {
    for (const d of arr) {
      const inc = incoming.get(d.id);
      if (!inc?.length) continue;
      inc.sort((x, y) => y.dmg - x.dmg);
      const parries = orders?.guardId === d.id && d.side === 'a' ? 2 : 1;
      let total = 0;
      inc.forEach((h, i) => { total += i < parries ? Math.round(h.dmg * 0.6) : h.dmg; });
      d.stamina -= total;
    }
  };
  applyTo(A); applyTo(B);

  // Down anyone at 0 氣力 — their 膽氣 decides slain / yield / flee.
  const downs: TeamFighter[] = [];
  for (const f of [...A, ...B]) {
    if (!f.downed && f.stamina <= 0) {
      f.stamina = 0; f.downed = true; f.downedRound = r;
      f.fate = duelDeathFate(f.officer, rng);
      const verbZh = f.fate === 'slain' ? '被斬於陣中' : f.fate === 'yield' ? '力盡請降' : '落荒而逃';
      const verbEn = f.fate === 'slain' ? 'is cut down in the melee' : f.fate === 'yield' ? 'is beaten and yields' : 'breaks and flees';
      log.push({ zh: `第${r}合:${nm(f).zh} ${verbZh}!`, en: `R${r}: ${nm(f).en} ${verbEn}!` });
      downs.push(f);
    }
  }
  return downs;
}

function mkFighter(m: TeamMember, side: 'a' | 'b'): TeamFighter {
  const o = m.officer;
  const ranged = weaponClassFor(o) === 'bow';
  return {
    id: o.id, officer: o, side,
    prowess: staticProwess(o),
    stamina: 100 + gradeCombatBonus(o).duelStamina,
    // Default stations: archers hang back, everyone else takes the van.
    station: m.station ?? (ranged ? 'rear' : 'van'),
    ranged,
    downed: false,
  };
}
const norm = (x: Officer | TeamMember): TeamMember => ('officer' in x ? x : { officer: x });

/** Decide the melee from the current fighter arrays (empty side or points). */
function teamVerdict(A: TeamFighter[], B: TeamFighter[]): 'a' | 'b' | 'draw' {
  const aAlive = alive(A), bAlive = alive(B);
  if (aAlive.length && !bAlive.length) return 'a';
  if (bAlive.length && !aAlive.length) return 'b';
  const aSt = aAlive.reduce((s, f) => s + f.stamina, 0);
  const bSt = bAlive.reduce((s, f) => s + f.stamina, 0);
  return Math.abs(aSt - bSt) < 20 ? 'draw' : aSt > bSt ? 'a' : 'b';
}

export function resolveTeamDuel(sideA: Array<Officer | TeamMember>, sideB: Array<Officer | TeamMember>, rng: () => number = Math.random, lineage: LineageLedger = []): TeamDuelResult {
  const A = sideA.map((x) => mkFighter(norm(x), 'a'));
  const B = sideB.map((x) => mkFighter(norm(x), 'b'));
  const log: { zh: string; en: string }[] = [];

  let rounds = 0;
  for (let r = 1; r <= MAX_TEAM_ROUNDS; r++) {
    if (!alive(A).length || !alive(B).length) break;
    rounds = r;
    runTeamRound(A, B, r, rng, log, undefined, lineage);
  }
  return { winner: teamVerdict(A, B), rounds, a: A, b: B, log };
}

// ─── 親督團戰 (§6.11 互動) — the same melee, stepped a round at a time ────────
// The player issues 集火/死守 orders each round and the engine runs ONE round;
// the host animates the exchange, then asks for the next orders. Ends exactly
// like resolveTeamDuel (empty side or points at MAX_TEAM_ROUNDS).

export interface TeamDuelState {
  a: TeamFighter[];
  b: TeamFighter[];
  round: number;
  over: boolean;
  winner?: 'a' | 'b' | 'draw';
  log: { zh: string; en: string }[];
}

export function initTeamDuelState(sideA: Array<Officer | TeamMember>, sideB: Array<Officer | TeamMember>): TeamDuelState {
  return {
    a: sideA.map((x) => mkFighter(norm(x), 'a')),
    b: sideB.map((x) => mkFighter(norm(x), 'b')),
    round: 0, over: false, log: [],
  };
}

export interface TeamStepResult {
  state: TeamDuelState;
  /** Fighters downed THIS round (for the host's kill/flee beats). */
  downs: TeamFighter[];
}

/** Run one ordered round (mutates nothing — returns a fresh state). */
export function stepTeamDuel(state: TeamDuelState, orders: TeamOrders, rng: () => number = Math.random, lineage: LineageLedger = []): TeamStepResult {
  if (state.over) return { state, downs: [] };
  // Deep-ish copy the fighters so React state stays immutable for the host.
  const A = state.a.map((f) => ({ ...f }));
  const B = state.b.map((f) => ({ ...f }));
  const log = [...state.log];
  const r = state.round + 1;
  const downs = runTeamRound(A, B, r, rng, log, orders, lineage);
  const finished = !alive(A).length || !alive(B).length || r >= MAX_TEAM_ROUNDS;
  const next: TeamDuelState = {
    a: A, b: B, round: r, log,
    over: finished,
    winner: finished ? teamVerdict(A, B) : undefined,
  };
  return { state: next, downs };
}

/** Fold a finished stepped melee into the shared result shape (consequence code
 *  downstream — 斬/擒/逃/士氣 — consumes TeamDuelResult either way). */
export function teamStateResult(state: TeamDuelState): TeamDuelResult {
  return { winner: state.winner ?? 'draw', rounds: state.round, a: state.a, b: state.b, log: state.log };
}

/** All fighters a team melee actually felled (fate 'slain') — the caller removes
 *  them; the yielded/fled are out of the fight but alive (capture/escape). */
export function teamDuelSlain(result: TeamDuelResult): string[] {
  return [...result.a, ...result.b].filter((f) => f.downed && f.fate === 'slain').map((f) => f.id);
}

// ─── 團戰名局廊 (§6.11) — melees, archived and replayable ────────────────────
// The gallery keeps ids and outcomes only; the live roster rehydrates the
// fighters at replay time, so an archived melee never pins a stale officer.

/** Flatten a finished melee into the compact shape the 名局廊 persists. */
export function meleeReplayFighters(result: TeamDuelResult): Array<{
  id: string; side: 'a' | 'b'; station: TeamStation; downedRound?: number; fate?: DuelFate;
}> {
  return [...result.a, ...result.b].map((f) => ({
    id: f.id, side: f.side, station: f.station,
    ...(f.downedRound !== undefined ? { downedRound: f.downedRound } : {}),
    ...(f.fate ? { fate: f.fate } : {}),
  }));
}

/**
 * Rebuild a playable {@link TeamDuelResult} from an archived melee. Fighters
 * whose officers have since left the world are dropped; returns null if either
 * side ends up empty (nothing left to stage).
 */
export function meleeResultFromRecord(
  rec: {
    winner: 'a' | 'b' | 'draw';
    rounds: number;
    fighters: Array<{ id: string; side: 'a' | 'b'; station: TeamStation; downedRound?: number; fate?: DuelFate }>;
    log: { zh: string; en: string }[];
  },
  officers: Record<string, Officer>,
): TeamDuelResult | null {
  const build = (side: 'a' | 'b'): TeamFighter[] =>
    rec.fighters.filter((f) => f.side === side).flatMap((f) => {
      const o = officers[f.id];
      if (!o) return [];
      const ranged = weaponClassFor(o) === 'bow';
      return [{
        id: f.id, officer: o, side,
        prowess: staticProwess(o),
        // Replay is a re-enactment, not a re-simulation: 氣力 only needs to read
        // "standing" vs "down" for the staging code.
        stamina: f.downedRound !== undefined ? 0 : 100,
        station: f.station, ranged,
        downed: f.downedRound !== undefined,
        ...(f.downedRound !== undefined ? { downedRound: f.downedRound } : {}),
        ...(f.fate ? { fate: f.fate } : {}),
      }];
    });
  const a = build('a');
  const b = build('b');
  if (!a.length || !b.length) return null;
  return { winner: rec.winner, rounds: rec.rounds, a, b, log: rec.log };
}
