import type { Officer } from '../types';
import { debateProwess, debatePersona, type DebatePersona } from './wordWar';
import { debateArtsBonus } from './debateArts';
import { areBonded } from './tactical';
import { areSwornBrothers } from './relationshipEffects';
import { lineageBond, type LineageLedger } from './lineage';

/**
 * 朝堂合辯 (§6.17) — a real N-vs-M war of words, beyond the 群儒 relay (where the
 * champion answers ONE at a time). Every voice on both benches presses at once:
 * an outnumbered debater turns aside only the sharpest thrust a round (圍攻),
 * like-schooled partners land compounding arguments (同派合辯), and a voice
 * argued to 語塞 (composure 0) retires from the hall in shame. The 舌戰 mirror
 * of §6.11's team melee. Auto-resolved and pure given the rng.
 */

const MAX_TEAM_ROUNDS = 10;

export interface TeamVoice {
  id: string;
  officer: Officer;
  composure: number;
  prowess: number;
  persona: DebatePersona;
  side: 'a' | 'b';
  /** 語塞 — argued down and out of the hall. */
  downed: boolean;
  /** Round the voice fell silent (for the log / afflictions). */
  downedRound?: number;
}

export interface TeamDebateResult {
  winner: 'a' | 'b' | 'draw';
  rounds: number;
  a: TeamVoice[];
  b: TeamVoice[];
  log: { zh: string; en: string }[];
}

/** 流派相剋 — the persona ring (智者→奸雄→猛士→智者) lends a small edge. */
const PERSONA_BEATS: Record<DebatePersona, DebatePersona> = { sage: 'sly', sly: 'fierce', fierce: 'sage' };

/** 同派合辯 — bonded pairs, same-school partners, and 同門/師徒 of one teacher
 *  compound their arguments. The lineage ledger is passed in, keeping this pure. */
function synergy(x: Officer, y: Officer, lineage: LineageLedger): boolean {
  return areBonded(x.id, y.id) || areSwornBrothers(x.id, y.id) || debatePersona(x) === debatePersona(y)
    || lineageBond(lineage, x.id, y.id, 'debate') !== null;
}

export function resolveTeamDebate(sideA: Officer[], sideB: Officer[], rng: () => number = Math.random, lineage: LineageLedger = []): TeamDebateResult {
  const mk = (o: Officer, side: 'a' | 'b'): TeamVoice => ({
    id: o.id, officer: o, side,
    prowess: debateProwess(o) + debateArtsBonus(o).prowess,
    composure: 100 + debateArtsBonus(o).composure,
    persona: debatePersona(o),
    downed: false,
  });
  const A = sideA.map((o) => mk(o, 'a'));
  const B = sideB.map((o) => mk(o, 'b'));
  const log: { zh: string; en: string }[] = [];
  const alive = (arr: TeamVoice[]) => arr.filter((f) => !f.downed);
  const nm = (f: TeamVoice) => f.officer.name;

  let rounds = 0;
  for (let r = 1; r <= MAX_TEAM_ROUNDS; r++) {
    const av = alive(A), bv = alive(B);
    if (!av.length || !bv.length) break;
    rounds = r;

    // Targeting — press the foe already closest to 語塞.
    const pickTarget = (foes: TeamVoice[]) =>
      foes.reduce((m, f) => (f.composure < m.composure ? f : m), foes[0]);
    const incoming = new Map<string, { atk: TeamVoice; dmg: number }[]>();
    const queue = (atk: TeamVoice, foes: TeamVoice[]) => {
      if (!foes.length) return;
      const tgt = pickTarget(foes);
      const edge = Math.max(-6, Math.min(14, (atk.prowess - tgt.prowess) * 0.25));
      let dmg = 11 + Math.floor(rng() * 9) + edge;
      // 流派相剋 — holding the favourable school matchup bites a touch deeper.
      if (PERSONA_BEATS[atk.persona] === tgt.persona) dmg += 4;
      const arr = incoming.get(tgt.id) ?? [];
      // 同派合辯 — an argument lands harder on a foe a partner is already pressing.
      if (arr.some((x) => synergy(x.atk.officer, atk.officer, lineage))) dmg += 6;
      arr.push({ atk, dmg: Math.max(4, Math.round(dmg)) });
      incoming.set(tgt.id, arr);
    };
    for (const atk of av) queue(atk, bv);
    for (const atk of bv) queue(atk, av);

    // Apply — 圍攻: a voice turns aside only the single sharpest thrust (−40%);
    // every other barb lands clean. Being double-teamed at the lectern is brutal.
    const applyTo = (arr: TeamVoice[]) => {
      for (const d of arr) {
        const inc = incoming.get(d.id);
        if (!inc?.length) continue;
        inc.sort((x, y) => y.dmg - x.dmg);
        let total = 0;
        inc.forEach((h, i) => { total += i === 0 ? Math.round(h.dmg * 0.6) : h.dmg; });
        d.composure -= total;
      }
    };
    applyTo(A); applyTo(B);

    // 語塞 — anyone argued to 0 composure retires from the hall.
    for (const f of [...A, ...B]) {
      if (!f.downed && f.composure <= 0) {
        f.composure = 0; f.downed = true; f.downedRound = r;
        log.push({ zh: `第${r}回:${nm(f).zh} 語塞理屈,掩面而退!`, en: `R${r}: ${nm(f).en} is argued speechless and retires!` });
      }
    }
  }

  const aAlive = alive(A), bAlive = alive(B);
  let winner: 'a' | 'b' | 'draw';
  if (aAlive.length && !bAlive.length) winner = 'a';
  else if (bAlive.length && !aAlive.length) winner = 'b';
  else {
    const aC = aAlive.reduce((s, f) => s + f.composure, 0);
    const bC = bAlive.reduce((s, f) => s + f.composure, 0);
    winner = Math.abs(aC - bC) < 20 ? 'draw' : aC > bC ? 'a' : 'b';
  }
  return { winner, rounds, a: A, b: B, log };
}

/** The voices a hall melee argued down (for shame afflictions / deeds). */
export function teamDebateDowned(result: TeamDebateResult): string[] {
  return [...result.a, ...result.b].filter((f) => f.downed).map((f) => f.id);
}
