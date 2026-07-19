import { useEffect, useMemo, useRef, useState } from 'react';
import type { TeamDebateResult, TeamVoice } from '../../../game/systems/teamDebate';
import { pickName, useLanguage, useT } from '../../i18n';
import { DebateArena3D, type DebateArenaEvent, type HallExtra } from './DebateArena3D';
import type { DebateAnim } from './debateAssets';

/**
 * 合辯同場 (§6.17) — plays a resolved {@link TeamDebateResult} back as a staged
 * joint debate with EVERY voice in the hall at once: the two lead voices argue
 * centre-stage while their seconds hold the flank seats, declaim on the beat,
 * and retire (掩面而退) on the round the engine argued them down. A silenced
 * lead's second steps up to the centre. Pure playback — the caller resolves
 * the debate first and applies its consequences after.
 */

const ROUND_MS = 1400;
// Every entry is both a DebateMove-ish event move and a DebateAnim for extras.
const ARGUMENTS = ['assert', 'retort', 'provoke', 'press', 'cite'] as const;

function aliveAt(side: TeamVoice[], round: number): TeamVoice[] {
  return side.filter((v) => !v.downed || (v.downedRound ?? Infinity) > round);
}

export function TeamDebate3DStage({ result, onDone }: { result: TeamDebateResult; onDone: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const [round, setRound] = useState(0);
  const [event, setEvent] = useState<DebateArenaEvent | null>(null);
  const [finished, setFinished] = useState(false);
  const keyRef = useRef(0);
  const doneRef = useRef(false);

  const sides = useMemo(() => ({ a: result.a, b: result.b }), [result]);
  const capA = aliveAt(sides.a, round)[0] ?? sides.a[sides.a.length - 1];
  const capB = aliveAt(sides.b, round)[0] ?? sides.b[sides.b.length - 1];

  const extrasFor = (side: TeamVoice[], cap: TeamVoice): HallExtra[] =>
    side.filter((v) => v.id !== cap.id).map((v, i) => {
      const downedNow = v.downed && (v.downedRound ?? 0) === round;
      const goneAlready = v.downed && (v.downedRound ?? 0) < round;
      const anim: DebateAnim = downedNow ? 'rout'
        : !v.downed && round > 0 && !finished ? ARGUMENTS[(round + i + v.id.length) % ARGUMENTS.length]
        : 'idle';
      return {
        name: pickName(v.officer.name, lang),
        anim,
        stamp: round,
        gone: goneAlready,
      };
    });
  const leftExtras = extrasFor(sides.a, capA);
  const rightExtras = extrasFor(sides.b, capB);

  useEffect(() => {
    if (round > result.rounds) return;
    const tid = window.setTimeout(() => {
      const r = round + 1;
      if (r > result.rounds) {
        keyRef.current += 1;
        const winnerA = result.winner === 'a';
        const loserCap = winnerA ? capB : capA;
        setEvent({
          key: keyRef.current,
          hit: result.winner === 'draw' ? 'both' : winnerA ? 'd' : 'a',
          aMove: winnerA ? 'press' : 'retort', dMove: winnerA ? 'retort' : 'press',
          dmg: 0, over: true,
          winner: result.winner === 'draw' ? 'draw' : winnerA ? 'a' : 'd',
          routed: result.winner !== 'draw' && !!loserCap?.downed,
        } as DebateArenaEvent);
        setFinished(true);
        setRound(r);
        return;
      }
      const downsA = sides.a.some((v) => v.downed && v.downedRound === r);
      const downsB = sides.b.some((v) => v.downed && v.downedRound === r);
      const capADown = capA.downed && capA.downedRound === r;
      const capBDown = capB.downed && capB.downedRound === r;
      keyRef.current += 1;
      setEvent({
        key: keyRef.current,
        hit: downsA && downsB ? 'both' : downsA ? 'a' : downsB ? 'd' : r % 2 ? 'd' : 'a',
        aMove: ARGUMENTS[r % ARGUMENTS.length], dMove: ARGUMENTS[(r + 2) % ARGUMENTS.length],
        dmg: 18, over: false,
        winner: downsA ? 'd' : downsB ? 'a' : undefined,
        // A lead argued down mid-hall gets the full rout beat in the centre.
        routed: capADown || capBDown,
      } as DebateArenaEvent);
      setRound(r);
    }, round === 0 ? 800 : ROUND_MS);
    return () => window.clearTimeout(tid);
  }, [round, result, sides, capA, capB]);

  const line = result.winner === 'draw'
    ? t('兩造各執一詞,殿上不了了之。', 'The hall adjourns undecided.')
    : result.winner === 'a'
      ? t('我方合辯得理 — 滿殿折服!', 'Your pair carries the hall!')
      : t('彼方伶牙俐齒,我方合辯失利。', 'Their pair out-argues yours.');

  return (
    <>
      <DebateArena3D
        me={capA.officer}
        foe={capB.officer}
        leftName={pickName(capA.officer.name, lang)}
        rightName={pickName(capB.officer.name, lang)}
        event={event}
        leftExtras={leftExtras}
        rightExtras={rightExtras}
      />
      {/* 辯報 — the engine log scrolls under the hall as it plays. */}
      <div style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', width: 'min(520px, 92vw)', zIndex: 131, pointerEvents: 'none', display: 'grid', gap: 3 }}>
        {result.log.filter((_, i) => i < Math.max(0, round)).slice(-3).map((l, i) => (
          <div key={i} style={{ background: 'rgba(10,14,20,0.82)', border: '1px solid #3a4754', borderRadius: 'var(--tkm-radius-sm)', padding: '0.25rem 0.6rem', color: '#cfe0ff', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', textAlign: 'center' }}>
            {lang === 'en' ? l.en : l.zh}
          </div>
        ))}
      </div>
      {finished && (
        <div style={{ position: 'fixed', left: '50%', bottom: 40, transform: 'translateX(-50%)', zIndex: 132, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(10,14,20,0.92)', border: '1px solid #88b7e8', borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.9rem' }}>
          <span style={{ color: '#d8ecff', fontFamily: 'var(--tkm-font-body)', fontSize: '0.9rem' }}>{line}</span>
          <button
            onClick={() => { if (!doneRef.current) { doneRef.current = true; onDone(); } }}
            style={{ padding: '0.35rem 0.9rem', background: 'linear-gradient(180deg,#1a2c4a,#101a2a)', border: '1px solid #88b7e8', borderRadius: 'var(--tkm-radius-sm)', color: '#b8d8f0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >{t('收場', 'Done')}</button>
        </div>
      )}
    </>
  );
}
