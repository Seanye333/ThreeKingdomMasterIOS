import { useEffect, useMemo, useRef, useState } from 'react';
import type { TeamDuelResult, TeamFighter } from '../../../game/systems/teamDuel';
import { pickName, useLanguage, useT } from '../../i18n';
import { DuelArena3D, type ArenaExtra, type DuelArenaEvent } from './DuelArena3D';

/**
 * 團戰同場 (§6.11) — plays a resolved {@link TeamDuelResult} back as a staged
 * melee with EVERY champion in the ring at once: the two captains fight
 * centre-stage while teammates hold the flank slots, trade blows on the beat,
 * and fall (or bolt) on the round the engine downed them. When a captain goes
 * down, the next teammate steps up into the centre (挺身而出). Pure playback —
 * the caller resolves the melee first and applies its consequences after.
 */

const ROUND_MS = 1500;
// Every entry is both a DuelMove (for the event) and a DuelAnim (for extras).
const STRIKES = ['slash', 'cleave', 'thrust', 'sweep', 'combo'] as const;

interface SideState {
  /** ids in engine order; index 0 of the ALIVE list is the current captain. */
  fighters: TeamFighter[];
}

function aliveAt(side: TeamFighter[], round: number): TeamFighter[] {
  return side.filter((f) => !f.downed || (f.downedRound ?? Infinity) > round);
}

export function TeamDuel3DStage({ result, onDone }: { result: TeamDuelResult; onDone: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const [round, setRound] = useState(0); // 0 = opening tableau; 1..rounds play out
  const [event, setEvent] = useState<DuelArenaEvent | null>(null);
  const [finished, setFinished] = useState(false);
  const keyRef = useRef(0);
  const doneRef = useRef(false);

  const sides = useMemo<{ a: SideState; b: SideState }>(() => ({
    a: { fighters: result.a },
    b: { fighters: result.b },
  }), [result]);

  // Current captains — the first still-standing fighter of each side; a downed
  // captain's place is taken next beat (挺身而出).
  const capA = aliveAt(sides.a.fighters, round)[0] ?? sides.a.fighters[sides.a.fighters.length - 1];
  const capB = aliveAt(sides.b.fighters, round)[0] ?? sides.b.fighters[sides.b.fighters.length - 1];

  // Teammates beyond the captains, with anim state driven by the played round:
  // fresh voices guard, the newly-downed play their fall, the long-downed empty out.
  const extrasFor = (side: TeamFighter[], cap: TeamFighter): ArenaExtra[] =>
    side.filter((f) => f.id !== cap.id).map((f) => {
      const downedNow = f.downed && (f.downedRound ?? 0) === round;
      const goneAlready = f.downed && (f.downedRound ?? 0) < round;
      const fled = f.fate === 'flee' || f.fate === 'yield';
      return {
        officer: f.officer,
        name: pickName(f.officer.name, lang),
        // The newly-fallen play death (a fled/yielded fighter just leaves); alive
        // teammates trade blows on the beat once the melee is under way.
        anim: downedNow ? (fled ? 'dodge' : 'death')
          : !f.downed && round > 0 && !finished ? STRIKES[(round + f.id.length) % STRIKES.length]
          : 'idle',
        stamp: round,
        gone: goneAlready || (downedNow && fled),
      };
    });
  const leftExtras = extrasFor(sides.a.fighters, capA);
  const rightExtras = extrasFor(sides.b.fighters, capB);

  // The beat — one engine round per tick; captains trade strikes via the arena's
  // own event pipeline (sparks, sfx, camera), downs land as kill beats.
  useEffect(() => {
    if (round > result.rounds) return;
    const tid = window.setTimeout(() => {
      const r = round + 1;
      if (r > result.rounds) {
        // 收場 — the winning side strikes a victory pose; the beaten captain falls
        // or yields per their engine fate.
        keyRef.current += 1;
        const winnerA = result.winner === 'a';
        const loserCap = winnerA ? capB : capA;
        setEvent({
          key: keyRef.current,
          hit: result.winner === 'draw' ? 'both' : winnerA ? 'd' : 'a',
          aMove: winnerA ? 'power' : 'guard', dMove: winnerA ? 'guard' : 'power',
          over: true,
          winner: result.winner === 'draw' ? 'draw' : winnerA ? 'attacker' : 'defender',
          killed: result.winner !== 'draw' && !!loserCap?.downed && loserCap.fate === 'slain',
          fate: result.winner !== 'draw' && loserCap?.downed && loserCap.fate !== 'slain' ? loserCap.fate : undefined,
        } as DuelArenaEvent);
        setFinished(true);
        setRound(r);
        return;
      }
      // Who takes this round's telling blow? A down decides it; else alternate.
      const downsA = sides.a.fighters.some((f) => f.downed && f.downedRound === r);
      const downsB = sides.b.fighters.some((f) => f.downed && f.downedRound === r);
      const capADown = capA.downed && capA.downedRound === r;
      const capBDown = capB.downed && capB.downedRound === r;
      keyRef.current += 1;
      setEvent({
        key: keyRef.current,
        hit: downsA && downsB ? 'both' : downsA ? 'a' : downsB ? 'd' : r % 2 ? 'd' : 'a',
        aMove: STRIKES[r % STRIKES.length], dMove: STRIKES[(r + 2) % STRIKES.length],
        over: false,
        winner: downsA ? 'defender' : downsB ? 'attacker' : undefined,
        // A captain cut down mid-melee gets the full kill beat in the centre.
        killed: (capADown && capA.fate === 'slain') || (capBDown && capB.fate === 'slain'),
      } as DuelArenaEvent);
      setRound(r);
    }, round === 0 ? 900 : ROUND_MS);
    return () => window.clearTimeout(tid);
  }, [round, result, sides, capA, capB]);

  const line = result.winner === 'draw'
    ? t('兩陣皆疲,鳴金收兵 — 平手。', 'Both knots of champions tire — a draw.')
    : result.winner === 'a'
      ? t('我方群英並擊,大獲全勝!', 'Your champions carry the melee!')
      : t('敵陣群英勢盛,我方敗退。', 'The enemy champions carry the day.');

  return (
    <>
      <DuelArena3D
        attacker={capA.officer}
        defender={capB.officer}
        leftName={pickName(capA.officer.name, lang)}
        rightName={pickName(capB.officer.name, lang)}
        event={event}
        leftExtras={leftExtras}
        rightExtras={rightExtras}
      />
      {/* 戰報 — the engine log scrolls under the melee as it plays. */}
      <div style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', width: 'min(520px, 92vw)', zIndex: 131, pointerEvents: 'none', display: 'grid', gap: 3 }}>
        {result.log.filter((_, i) => i < Math.max(0, round)).slice(-3).map((l, i) => (
          <div key={i} style={{ background: 'rgba(10,14,20,0.82)', border: '1px solid #3a4754', borderRadius: 'var(--tkm-radius-sm)', padding: '0.25rem 0.6rem', color: '#e8d8b0', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', textAlign: 'center' }}>
            {lang === 'en' ? l.en : l.zh}
          </div>
        ))}
      </div>
      {/* 收場 — result + close, once the playback runs out. */}
      {finished && (
        <div style={{ position: 'fixed', left: '50%', bottom: 40, transform: 'translateX(-50%)', zIndex: 132, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,14,20,0.92)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.9rem' }}>
          <span style={{ color: '#f2dd9a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.9rem' }}>{line}</span>
          <button
            onClick={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
            style={{ padding: '0.35rem 0.9rem', background: 'linear-gradient(180deg,#4a3a1a,#2a2010)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius-sm)', color: '#f0d890', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >{t('收場', 'Done')}</button>
        </div>
      )}
    </>
  );
}
