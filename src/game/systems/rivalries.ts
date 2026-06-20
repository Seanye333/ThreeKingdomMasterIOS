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
  // Emergent grudges: a cross-force pair with very low mutual 好感 (≤ -40).
  if (candidates.length === 0) {
    for (const champ of mine) {
      for (const o of Object.values(officers)) {
        const rival = present(o.id);
        if (!rival) continue;
        const key = [champ.id, rival.id].sort().join(':');
        if ((rapport[key] ?? 0) <= -40) candidates.push({ championId: champ.id, rivalId: rival.id, famous: false });
      }
    }
  }
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const line = TAUNTS[Math.floor(rng() * TAUNTS.length) % TAUNTS.length];
  return { ...pick, lineZh: line.zh, lineEn: line.en };
}
