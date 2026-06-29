import type { Officer } from '../types';
import { canDuel } from './duel';

/**
 * 宿敵 — historical and emergent single-combat rivalries. When a rival of one of
 * your generals is present on the field and hostile, they ride out to settle the
 * score in a duel. Famous pairings are hand-listed; any cross-force pair with a
 * deep mutual grudge (very low 好感) also qualifies, so rivalries can emerge in
 * play as well as from the romance.
 */

/** Hand-listed famous rivalries (unordered pairs of officer ids). */
export const RIVAL_PAIRS: Array<[string, string]> = [
  ['guan-yu', 'huang-zhong'],
  ['zhang-fei', 'ma-chao'],
  ['sun-ce', 'taishi-ci'],
  ['xu-chu', 'ma-chao'],
  ['zhao-yun', 'wen-chou'],
  ['guan-yu', 'pang-de'],
  ['zhang-liao', 'taishi-ci'],
  ['lu-bu', 'guan-yu'],
  ['gan-ning', 'ling-tong'],
];

export interface RivalryChallenge {
  /** Your officer being called out. */
  championId: string;
  /** The hostile rival riding out to fight them. */
  rivalId: string;
  /** True for a hand-listed famous rivalry (vs an emergent grudge). */
  famous: boolean;
  lineZh: string;
  lineEn: string;
}

const TAUNTS: Array<{ zh: string; en: string }> = [
  { zh: '舊帳未清,今日當有了斷!', en: 'Old scores stand unsettled — today we end them!' },
  { zh: '我尋你多時,出來一決生死!', en: 'I have sought you long — come, to the death!' },
  { zh: '昔日之仇,正好今朝得報!', en: 'The grudge of years — I repay it now!' },
];

/**
 * Find a rivalry challenge for the player, deterministically (so the same one
 * waits when you return). `rng` defaults to a fixed pick of the first match.
 * Returns null if no rival of any of your duel-capable generals is present.
 */
export function findRivalryChallenge(
  officers: Record<string, Officer>,
  playerForceId: string | null,
  rapport: Record<string, number> = {},
  rng: () => number = () => 0,
  history: RivalryMap = {},
): RivalryChallenge | null {
  if (!playerForceId) return null;
  const mine = Object.values(officers).filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && canDuel(o).ok);
  const present = (id: string): Officer | null => {
    const o = officers[id];
    return o && o.forceId !== playerForceId && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && canDuel(o).ok ? o : null;
  };

  const candidates: Array<{ championId: string; rivalId: string; famous: boolean }> = [];
  // Famous pairings first.
  for (const [x, y] of RIVAL_PAIRS) {
    const xMine = mine.find((o) => o.id === x);
    const yMine = mine.find((o) => o.id === y);
    if (xMine && present(y)) candidates.push({ championId: x, rivalId: y, famous: true });
    if (yMine && present(x)) candidates.push({ championId: y, rivalId: x, famous: true });
  }
  // Emergent grudges: a cross-force pair with very low mutual 好感 (≤ -40), OR a
  // sworn 宿敵 forged in play — a pair who have crossed blades enough times that
  // the score itself demands a reckoning (恩怨簿).
  if (candidates.length === 0) {
    for (const champ of mine) {
      for (const o of Object.values(officers)) {
        const rival = present(o.id);
        if (!rival) continue;
        const key = [champ.id, rival.id].sort().join(':');
        const grudge = (rapport[key] ?? 0) <= -40;
        const sworn = isNemesis(history, champ.id, rival.id);
        if (grudge || sworn) candidates.push({ championId: champ.id, rivalId: rival.id, famous: false });
      }
    }
  }
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const line = TAUNTS[Math.floor(rng() * TAUNTS.length) % TAUNTS.length];
  return { ...pick, lineZh: line.zh, lineEn: line.en };
}

// ─── 恩怨簿 — head-to-head history of single combat ──────────────────────────
// The triggers above bring rivals together; this remembers the score. Every
// duel between the same pair accrues a record, and once they've crossed blades
// {@link NEMESIS_THRESHOLD} times they're sworn 宿敵: they read each other better
// on the next meeting (知己知彼), and the kill that finally settles it weighs
// heavy. A rivalry closed in blood (one slays the other) is over for good.

export interface RivalryRecord {
  /** Canonical ordering: aId < bId (string compare), so the key is stable. */
  aId: string;
  bId: string;
  bouts: number;   // total bouts fought between the pair
  aWins: number;   // bouts won by aId
  bWins: number;   // bouts won by bId
  draws: number;
  /** Set when one finally cut the other down — the rivalry is closed in blood. */
  killerId?: string;
  victimId?: string;
  lastYear: number;
  lastSeason: number; // 0..3
}

export type RivalryMap = Record<string, RivalryRecord>;

/** Order-independent key for a pair of fighters. */
export function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
}

/** Bouts before two fighters are reckoned 宿敵 (sworn rivals). */
export const NEMESIS_THRESHOLD = 3;

/**
 * Fold one finished bout into the rivalry map. `winner` is from the CALLER'S
 * order: 'a' = id1 won, 'b' = id2 won, 'draw' = neither. `killed` marks that the
 * winner cut the loser down (closing the rivalry). Returns a new map.
 */
export function recordRivalryBout(
  map: RivalryMap,
  id1: string,
  id2: string,
  winner: 'a' | 'b' | 'draw',
  killed: boolean,
  year: number,
  season: number,
): RivalryMap {
  if (id1 === id2) return map;
  const key = pairKey(id1, id2);
  const id1IsA = id1 < id2; // is id1 the canonical aId?
  const prev: RivalryRecord = map[key] ?? {
    aId: id1IsA ? id1 : id2, bId: id1IsA ? id2 : id1,
    bouts: 0, aWins: 0, bWins: 0, draws: 0, lastYear: year, lastSeason: season,
  };
  const rec: RivalryRecord = { ...prev, bouts: prev.bouts + 1, lastYear: year, lastSeason: season };
  // Translate the caller's winner into the canonical a/b sides.
  const canon: 'a' | 'b' | 'draw' = winner === 'draw' ? 'draw'
    : winner === 'a' ? (id1IsA ? 'a' : 'b')
    : (id1IsA ? 'b' : 'a');
  if (canon === 'a') rec.aWins += 1;
  else if (canon === 'b') rec.bWins += 1;
  else rec.draws += 1;
  if (killed && winner !== 'draw') {
    rec.killerId = winner === 'a' ? id1 : id2;
    rec.victimId = winner === 'a' ? id2 : id1;
  }
  return { ...map, [key]: rec };
}

/** The rivalry record between two fighters, if they have ever dueled. */
export function rivalryBetween(map: RivalryMap, id1: string, id2: string): RivalryRecord | undefined {
  return map[pairKey(id1, id2)];
}

/** Whether two fighters are sworn rivals (enough bouts, not yet ended in blood). */
export function isNemesis(map: RivalryMap, id1: string, id2: string): boolean {
  const r = map[pairKey(id1, id2)];
  return !!r && r.bouts >= NEMESIS_THRESHOLD && !r.killerId;
}

/**
 * 知己知彼 — how well two rivals read each other (0..1), rising with each bout
 * and capping at 5. A rivalry closed in blood is over and reads 0.
 */
export function familiarity(rec: RivalryRecord | undefined): number {
  if (!rec || rec.killerId) return 0;
  return Math.min(1, rec.bouts / 5);
}

/** All rivalries involving an officer, most-fought first (closed ones included). */
export function rivalriesOf(map: RivalryMap, id: string): RivalryRecord[] {
  return Object.values(map)
    .filter((r) => r.aId === id || r.bId === id)
    .sort((x, y) => y.bouts - x.bouts);
}

/** Head-to-head tally from one fighter's perspective. */
export function headToHead(rec: RivalryRecord, fromId: string): { mine: number; theirs: number; draws: number } {
  const mineIsA = rec.aId === fromId;
  return { mine: mineIsA ? rec.aWins : rec.bWins, theirs: mineIsA ? rec.bWins : rec.aWins, draws: rec.draws };
}
