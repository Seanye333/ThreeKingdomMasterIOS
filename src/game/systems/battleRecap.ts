/**
 * 戰後復盤 — battle stats derived from the final board, no new
 * per-turn bookkeeping required. Honest numbers the end-screen can show:
 * the exchange ratio, the toughest unit (kept the most of its men), the
 * pillar still standing strongest, and how many schemes were thrown.
 */
import type { Officer, TacticalBattle, TacticalUnit } from '../types';

export interface BattleRecap {
  attackerLosses: number;
  defenderLosses: number;
  /** Winner losses : loser losses, as "1 : N" (loser per winner). */
  exchangeRatio: number | null;
  turns: number;
  schemesCast: number;
  /** Winning-side unit that retained the largest share of its troops. */
  toughest: { officerId: string; name: string; keptPct: number } | null;
  /** Winning-side unit with the most troops still standing. */
  pillar: { officerId: string; name: string; troops: number } | null;
}

function unitName(u: TacticalUnit, officers: Record<string, Officer>): string {
  return officers[u.officerId]?.name.zh ?? u.officerId;
}

export function battleRecap(battle: TacticalBattle, officers: Record<string, Officer>): BattleRecap {
  const winner = battle.winner;
  const winners = winner ? battle.units.filter((u) => u.side === winner) : [];

  let toughest: BattleRecap['toughest'] = null;
  let pillar: BattleRecap['pillar'] = null;
  for (const u of winners) {
    if (u.troops <= 0) continue;
    const keptPct = u.maxTroops > 0 ? u.troops / u.maxTroops : 0;
    if (!toughest || keptPct > toughest.keptPct) {
      toughest = { officerId: u.officerId, name: unitName(u, officers), keptPct };
    }
    if (!pillar || u.troops > pillar.troops) {
      pillar = { officerId: u.officerId, name: unitName(u, officers), troops: u.troops };
    }
  }

  const wLoss = winner === 'attacker' ? battle.attackerLosses : battle.defenderLosses;
  const lLoss = winner === 'attacker' ? battle.defenderLosses : battle.attackerLosses;
  const exchangeRatio = winner && wLoss > 0
    ? Math.round((lLoss / wLoss) * 10) / 10
    : null;

  const schemesCast = (battle.log ?? []).filter((e) => e.kind === 'event'
    && /計|焚|火|風|霧|伏|謀|策/.test(e.text)).length;

  return {
    attackerLosses: battle.attackerLosses,
    defenderLosses: battle.defenderLosses,
    exchangeRatio,
    turns: battle.turn,
    schemesCast,
    toughest,
    pillar,
  };
}
