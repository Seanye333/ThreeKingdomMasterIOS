/**
 * 車輪戰 — a lone champion against a queue of challengers, one after the
 * next, WITHOUT recovering between bouts. Each bout reuses the real
 * duel resolver; the champion carries their dwindling 氣力 (and a
 * fatigue penalty) into the next. The classic 三英戰呂布 fantasy: throw
 * your best three at a monster and pray they wear him down before the
 * third falls.
 */
import type { Officer } from '../types';
import { resolveDuel, staticProwess } from './duel';

export interface GauntletBout {
  challengerId: string;
  challengerName: string;
  championStaminaBefore: number;
  championStaminaAfter: number;
  result: 'champion' | 'challenger'; // who walked away standing
  killed: boolean;
}

export interface GauntletResult {
  championId: string;
  bouts: GauntletBout[];
  championSurvived: boolean;
  /** challengers that died trying. */
  fallenChallengerIds: string[];
}

/** Each prior bout leaves the champion winded — prowess sags with
 *  cumulative fatigue. */
function fatiguedClone(champion: Officer, boutsFought: number): Officer {
  const penalty = Math.min(30, boutsFought * 8);
  return { ...champion, stats: { ...champion.stats, war: Math.max(1, champion.stats.war - penalty) } };
}

export function resolveGauntlet(
  champion: Officer,
  challengers: Officer[],
  rng: () => number = Math.random,
): GauntletResult {
  const bouts: GauntletBout[] = [];
  const fallen: string[] = [];
  let championStamina = 100;
  let survived = true;

  for (let i = 0; i < challengers.length; i++) {
    const challenger = challengers[i];
    const winded = fatiguedClone(champion, i);
    const r = resolveDuel({ attacker: challenger, defender: winded, rng });
    // The duel runs fresh-vs-fresh; fold the champion's carried wound in
    // by capping their result stamina at what they had coming in.
    const championOut = Math.min(championStamina, r.defenderStamina);
    const championDown = championOut <= 0 || r.killedId === champion.id;
    const challengerDown = r.killedId === challenger.id || r.defenderStamina > r.attackerStamina && r.winner === 'defender';

    bouts.push({
      challengerId: challenger.id,
      challengerName: challenger.name.zh,
      championStaminaBefore: championStamina,
      championStaminaAfter: Math.max(0, championOut),
      result: championDown ? 'challenger' : 'champion',
      killed: championDown ? false : !!r.killedId && r.killedId === challenger.id,
    });

    if (r.killedId === challenger.id || (r.winner === 'defender' && challengerDown)) fallen.push(challenger.id);

    championStamina = Math.max(0, championOut);
    if (championDown) { survived = false; break; }
  }

  return { championId: champion.id, bouts, championSurvived: survived, fallenChallengerIds: fallen };
}

/** Sort a roster strongest-last so the gauntlet softens the champion up
 *  before the ace swings — the optimal 車輪戰 ordering. */
export function orderForGauntlet(officers: Officer[]): Officer[] {
  return [...officers].sort((a, b) => staticProwess(a) - staticProwess(b));
}
