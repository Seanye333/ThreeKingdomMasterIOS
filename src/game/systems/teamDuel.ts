import type { Officer } from '../types';
import { staticProwess, duelDeathFate, weaponClassFor, type DuelFate } from './duel';
import { areBonded } from './tactical';
import { areSwornBrothers } from './relationshipEffects';
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

/** 合擊 — sworn brothers / bonded pairs strike as one when they gang a foe. */
function synergy(x: Officer, y: Officer): boolean {
  return areBonded(x.id, y.id) || areSwornBrothers(x.id, y.id);
}

export function resolveTeamDuel(sideA: Array<Officer | TeamMember>, sideB: Array<Officer | TeamMember>, rng: () => number = Math.random): TeamDuelResult {
  const norm = (x: Officer | TeamMember): TeamMember => ('officer' in x ? x : { officer: x });
  const mk = (m: TeamMember, side: 'a' | 'b'): TeamFighter => {
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
  };
  const A = sideA.map((x) => mk(norm(x), 'a'));
  const B = sideB.map((x) => mk(norm(x), 'b'));
  const log: { zh: string; en: string }[] = [];
  const alive = (arr: TeamFighter[]) => arr.filter((f) => !f.downed);
  const nm = (f: TeamFighter) => f.officer.name;

  let rounds = 0;
  for (let r = 1; r <= MAX_TEAM_ROUNDS; r++) {
    const av = alive(A), bv = alive(B);
    if (!av.length || !bv.length) break;
    rounds = r;

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
      const tgt = pickTarget(foes);
      const edge = Math.max(-8, Math.min(16, (atk.prowess - tgt.prowess) * 0.25));
      let dmg = 12 + Math.floor(rng() * 10) + edge;
      // 掠陣 — a rear MELEE arm only pokes past its own screen (×0.55) while that
      // screen stands; once the van falls they step up and strike full.
      if (!atk.ranged && atk.station === 'rear' && ownSide.some((f) => f.station === 'van')) dmg *= 0.55;
      const arr = incoming.get(tgt.id) ?? [];
      // 合擊 — a blow lands harder if a bonded ally is already pressing this foe.
      if (arr.some((x) => synergy(x.atk.officer, atk.officer))) dmg += 8;
      arr.push({ atk, dmg: Math.max(4, Math.round(dmg)) });
      incoming.set(tgt.id, arr);
    };
    for (const atk of av) queue(atk, bv, av);
    for (const atk of bv) queue(atk, av, bv);

    // Apply — 圍攻: a fighter turns aside only their single deadliest attacker (−40%);
    // every other blow lands clean. Being ganged is punishing.
    const applyTo = (arr: TeamFighter[]) => {
      for (const d of arr) {
        const inc = incoming.get(d.id);
        if (!inc?.length) continue;
        inc.sort((x, y) => y.dmg - x.dmg);
        let total = 0;
        inc.forEach((h, i) => { total += i === 0 ? Math.round(h.dmg * 0.6) : h.dmg; });
        d.stamina -= total;
      }
    };
    applyTo(A); applyTo(B);

    // Down anyone at 0 氣力 — their 膽氣 decides slain / yield / flee.
    for (const f of [...A, ...B]) {
      if (!f.downed && f.stamina <= 0) {
        f.stamina = 0; f.downed = true; f.downedRound = r;
        f.fate = duelDeathFate(f.officer, rng);
        const verbZh = f.fate === 'slain' ? '被斬於陣中' : f.fate === 'yield' ? '力盡請降' : '落荒而逃';
        const verbEn = f.fate === 'slain' ? 'is cut down in the melee' : f.fate === 'yield' ? 'is beaten and yields' : 'breaks and flees';
        log.push({ zh: `第${r}合:${nm(f).zh} ${verbZh}!`, en: `R${r}: ${nm(f).en} ${verbEn}!` });
      }
    }
  }

  const aAlive = alive(A), bAlive = alive(B);
  let winner: 'a' | 'b' | 'draw';
  if (aAlive.length && !bAlive.length) winner = 'a';
  else if (bAlive.length && !aAlive.length) winner = 'b';
  else {
    const aSt = aAlive.reduce((s, f) => s + f.stamina, 0);
    const bSt = bAlive.reduce((s, f) => s + f.stamina, 0);
    winner = Math.abs(aSt - bSt) < 20 ? 'draw' : aSt > bSt ? 'a' : 'b';
  }
  return { winner, rounds, a: A, b: B, log };
}

/** All fighters a team melee actually felled (fate 'slain') — the caller removes
 *  them; the yielded/fled are out of the fight but alive (capture/escape). */
export function teamDuelSlain(result: TeamDuelResult): string[] {
  return [...result.a, ...result.b].filter((f) => f.downed && f.fate === 'slain').map((f) => f.id);
}
