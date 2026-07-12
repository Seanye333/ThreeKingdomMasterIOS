import type { EntityId, Officer } from '../types';
import { combatBP } from './battlePower';

/**
 * 天下武評榜 — the realm-wide power board, ranked by the card game's
 * composite BP (battlePower.ts). Pure presentation math: the board never
 * feeds combat. It exists so 呂布第一 is a fact you can point at — and so
 * your own ace climbing into the top ten is an event (endSeason notifies).
 */
export interface PowerBoardRow {
  officer: Officer;
  bp: number;
  rank: number; // 1-based
}

/** Living, revealed officers ranked by BP (ties broken by war, then id for
 *  stability). `limit` trims the tail; 0 = everyone. */
export function bpLeaderboard(
  officers: Record<EntityId, Officer> | Officer[],
  limit = 20,
): PowerBoardRow[] {
  const pool = (Array.isArray(officers) ? officers : Object.values(officers))
    .filter((o) => o.status !== 'dead' && o.status !== 'unsearched');
  const rows = pool
    .map((officer) => ({ officer, bp: combatBP(officer).bp }))
    .sort((a, b) => b.bp - a.bp || b.officer.stats.war - a.officer.stats.war || (a.officer.id < b.officer.id ? -1 : 1))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return limit > 0 ? rows.slice(0, limit) : rows;
}

/** The board's top-N ids — the "who's famous" set for season notifications. */
export function topBoardIds(officers: Record<EntityId, Officer>, n = 10): Map<EntityId, number> {
  return new Map(bpLeaderboard(officers, n).map((r) => [r.officer.id, r.rank]));
}
