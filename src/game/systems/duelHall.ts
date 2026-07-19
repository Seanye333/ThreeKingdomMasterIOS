import type { DuelMove } from './duel';
import type { DebateMove } from './wordWar';

/**
 * 名局廊 (Hall of Famous Bouts) — compact, replayable records of notable duels
 * and debates. Each record carries the exchange-by-exchange feedback the 3D
 * arena needs to re-stage the bout, so a memorable fight can be relived from the
 * gallery long after it was fought. Records are small (a dozen tiny objects), so
 * unlike battle replay trails they're safe to persist in full.
 */

/** One duel exchange's feedback — mirrors the arena's live `DuelRoundFx`. */
export interface DuelReplayFx {
  hit: 'a' | 'd' | 'both';
  killed: boolean;
  aMove?: DuelMove;
  dMove?: DuelMove;
  over?: boolean;
  winner?: 'attacker' | 'defender' | 'draw';
  disarm?: 'attacker' | 'defender';
  combo?: { side: 'attacker' | 'defender'; length: number; named: boolean };
}

/** One debate exchange's feedback — mirrors the hall's live `DebateRoundFx`. */
export interface DebateReplayFx {
  hit: 'a' | 'd' | 'both';
  aMove: DebateMove;
  dMove: DebateMove;
  dmg: number;
  over: boolean;
  routed: boolean;
  winner?: 'a' | 'd' | 'draw';
}

interface BoutRecordBase {
  id: string;
  aId: string;
  dId: string;
  year: number;
  season: number;
}

/**
 * 團戰名局 — one champion's part in a recorded melee. Only ids and outcome are
 * kept; the live `officers` map rehydrates the fighters at replay time, so the
 * record stays tiny and never pins a stale copy of an officer.
 */
export interface MeleeReplayFighter {
  id: string;
  side: 'a' | 'b';
  station: 'van' | 'rear';
  /** Round they were downed (absent = still standing at the end). */
  downedRound?: number;
  /** 斬 / 請降 / 落荒 — what became of them when they fell. */
  fate?: 'slain' | 'yield' | 'flee';
}

export type BoutRecord =
  | (BoutRecordBase & { kind: 'duel'; winner: 'attacker' | 'defender' | 'draw'; killed: boolean; fx: DuelReplayFx[] })
  | (BoutRecord_Debate)
  | (BoutRecord_Melee);

type BoutRecord_Debate = BoutRecordBase & { kind: 'debate'; winner: 'a' | 'd' | 'draw'; routed: boolean; fx: DebateReplayFx[] };

/** 團戰名局 (§6.11) — a whole champion melee, replayable through the 3D ring.
 *  `aId`/`dId` are the two sides' captains so the shared gallery row still reads. */
type BoutRecord_Melee = BoutRecordBase & {
  kind: 'melee';
  winner: 'a' | 'b' | 'draw';
  rounds: number;
  fighters: MeleeReplayFighter[];
  log: { zh: string; en: string }[];
};

/** How many famous bouts the hall keeps (newest first). */
export const DUEL_HALL_CAP = 24;

/** Prepend a record, drop any older record of the identical bout, and cap. */
export function pushBoutRecord(hall: BoutRecord[], rec: BoutRecord): BoutRecord[] {
  return [rec, ...hall.filter((r) => r.id !== rec.id)].slice(0, DUEL_HALL_CAP);
}

/** A bout worth remembering: a kill / a 罵死 rout, or a long, hard-fought match.
 *  A melee earns its place if anyone actually went down, or it ran long. */
export function isNotableBout(rec: BoutRecord): boolean {
  if (rec.kind === 'duel') return rec.killed || rec.fx.length >= 5;
  if (rec.kind === 'melee') return rec.fighters.some((f) => f.downedRound !== undefined) || rec.rounds >= 6;
  return rec.routed || rec.fx.length >= 5;
}
