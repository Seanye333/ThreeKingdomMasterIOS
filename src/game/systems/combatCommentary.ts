import type { DuelMove } from './duel';
import type { DebateMove } from './wordWar';

/**
 * 實況解說 — a ringside announcer for the 3D arena. Given an exchange's outcome
 * it returns a vivid one-liner ("好一招架隔,兵器脫手!"), picked from a pool by a
 * caller-supplied index (the round number) so the call is pure and the line
 * varies bout to bout without touching the blocked Math.random in scripts.
 */

const pick = <T,>(pool: T[], idx: number): T => pool[((idx % pool.length) + pool.length) % pool.length];

export interface DuelCommentaryInput {
  aName: string;
  dName: string;
  winner?: 'attacker' | 'defender' | 'draw';
  hit: 'a' | 'd' | 'both';
  killed?: boolean;
  disarm?: 'attacker' | 'defender';
  combo?: { side: 'attacker' | 'defender'; length: number; named: boolean };
  ultimate?: 'attacker' | 'defender';
  aMove?: DuelMove;
  dMove?: DuelMove;
}

const heavyMove = (m?: DuelMove) => m === 'power' || m === 'combo' || m === 'thrust';

/** A ringside line for a duel exchange, or null for an unremarkable clash. */
export function duelCommentary(ev: DuelCommentaryInput, idx = 0): { zh: string; en: string } | null {
  const win = ev.winner === 'attacker' ? ev.aName : ev.winner === 'defender' ? ev.dName : null;
  const lose = ev.winner === 'attacker' ? ev.dName : ev.winner === 'defender' ? ev.aName : null;
  if (ev.killed && win && lose) {
    return pick([
      { zh: `${win}一擊斃命 — ${lose}應聲落馬!`, en: `${win} lands a killing blow — ${lose} falls!` },
      { zh: `勝負已分!${win}取${lose}首級!`, en: `It's over! ${win} takes ${lose}'s head!` },
    ], idx);
  }
  if (ev.ultimate) {
    const u = ev.ultimate === 'attacker' ? ev.aName : ev.dName;
    return { zh: `武魂爆發 — ${u}使出必殺技!`, en: `Spirit unleashed — ${u} looses a finisher!` };
  }
  if (ev.disarm) {
    const victim = ev.disarm === 'attacker' ? ev.aName : ev.dName;
    return pick([
      { zh: `好一招架隔 — ${victim}兵器脫手!`, en: `A masterful parry — ${victim} is disarmed!` },
      { zh: `${victim}虎口震裂,長兵墜地!`, en: `${victim}'s grip fails — the weapon clatters away!` },
    ], idx);
  }
  if (ev.combo && win) {
    if (ev.combo.named) return { zh: `斬·突·奮 — ${win}使出連段必殺!`, en: `Slash-Thrust-Power — ${win} chains a finisher!` };
    return pick([
      { zh: `連擊如潮 — ${win}連下${ev.combo.length}手!`, en: `A relentless flurry — ${win} strings ${ev.combo.length} blows!` },
      { zh: `${win}攻勢凌厲,破其防備!`, en: `${win} batters the guard wide open!` },
    ], idx);
  }
  if ((heavyMove(ev.aMove) || heavyMove(ev.dMove)) && win && lose && ev.hit !== 'both') {
    return pick([
      { zh: `奮力一擊 — ${lose}踉蹌欲倒!`, en: `A crushing strike — ${lose} reels!` },
      { zh: `${win}全力傾出,${lose}險象環生!`, en: `${win} commits everything — ${lose} is in peril!` },
    ], idx);
  }
  if (win && ev.hit !== 'both') {
    return pick([
      { zh: `這一合 — ${win}佔盡上風!`, en: `This exchange goes to ${win}!` },
      { zh: `${win}搶得先機,壓住對手!`, en: `${win} seizes the initiative!` },
    ], idx);
  }
  if (ev.hit === 'both') {
    return pick([
      { zh: '刀光劍影 — 難分難解!', en: 'Steel meets steel — neither yields!' },
      { zh: '針鋒相對,各退半步!', en: 'Blow for blow — both give half a step!' },
    ], idx);
  }
  return null;
}

export interface DebateCommentaryInput {
  aName: string;
  dName: string;
  winner?: 'a' | 'd' | 'draw';
  hit: 'a' | 'd' | 'both';
  routed?: boolean;
  dmg: number;
  aMove?: DebateMove;
  dMove?: DebateMove;
}

const loadedArg = (m?: DebateMove) => m === 'press' || m === 'cite' || m === 'deceive';

/** A ringside line for a debate exchange, or null for a quiet round. */
export function debateCommentary(ev: DebateCommentaryInput, idx = 0): { zh: string; en: string } | null {
  const win = ev.winner === 'a' ? ev.aName : ev.winner === 'd' ? ev.dName : null;
  const lose = ev.winner === 'a' ? ev.dName : ev.winner === 'd' ? ev.aName : null;
  if (ev.routed && win && lose) {
    return pick([
      { zh: `${win}一席話如雷貫耳 — ${lose}張口結舌,潰不成言!`, en: `${win}'s words land like thunder — ${lose} is struck dumb!` },
      { zh: `滿堂震動!${win}罵倒${lose}!`, en: `The hall erupts — ${win} shouts ${lose} down!` },
    ], idx);
  }
  if ((loadedArg(ev.aMove) || loadedArg(ev.dMove)) && win && lose) {
    return pick([
      { zh: `引經據典 — ${win}一語中的,${lose}語塞!`, en: `Citing the classics — ${win} pins ${lose} fast!` },
      { zh: `${win}步步進逼,${lose}節節敗退!`, en: `${win} presses home; ${lose} gives ground!` },
    ], idx);
  }
  if (win && ev.dmg > 0) {
    return pick([
      { zh: `${win}辭鋒銳利,佔得上風!`, en: `${win}'s rhetoric cuts — the round is theirs!` },
      { zh: `這一辯 — ${win}略勝一籌!`, en: `This exchange edges to ${win}!` },
    ], idx);
  }
  if (ev.hit === 'both') return { zh: '唇槍舌劍 — 各執一詞!', en: 'Tongues like spears — neither concedes!' };
  return null;
}
