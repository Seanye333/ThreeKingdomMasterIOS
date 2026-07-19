import { useMemo, useRef, useState } from 'react';
import type { Officer } from '../../../game/types';
import {
  initTeamDuelState, stepTeamDuel, teamStateResult,
  type TeamDuelResult, type TeamDuelState, type TeamFighter, type TeamMember,
} from '../../../game/systems/teamDuel';
import { pickName, useLanguage, useT } from '../../i18n';
import { DuelArena3D, type ArenaExtra, type DuelArenaEvent } from './DuelArena3D';

/**
 * 親督團戰 (§6.11 互動) — the player COMMANDS the champion melee round by round:
 * pick 集火 (which foe the knot presses) and 死守 (which of yours fights
 * defensively), then sound the drum. Every fighter stands in the 3D ring — the
 * captains centre-stage, the rest at the flank slots — and each ordered round
 * plays out through the arena's own strike/kill beats. When it ends, the same
 * {@link TeamDuelResult} the auto-resolver produces goes to `onComplete`, so
 * downstream consequences (斬/擒/逃/士氣) are identical either way.
 */

const STRIKES = ['slash', 'cleave', 'thrust', 'sweep', 'combo'] as const;

const alive = (arr: TeamFighter[]) => arr.filter((f) => !f.downed);

export function InteractiveTeamDuel3D({ sideA, sideB, onComplete }: {
  sideA: Array<Officer | TeamMember>;
  sideB: Array<Officer | TeamMember>;
  onComplete: (result: TeamDuelResult) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const [st, setSt] = useState<TeamDuelState>(() => initTeamDuelState(sideA, sideB));
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  const [guardId, setGuardId] = useState<string | undefined>(undefined);
  const [event, setEvent] = useState<DuelArenaEvent | null>(null);
  const keyRef = useRef(0);
  const doneRef = useRef(false);

  const capA = alive(st.a)[0] ?? st.a[st.a.length - 1];
  const capB = alive(st.b)[0] ?? st.b[st.b.length - 1];

  // Flanking teammates — HP-driven presence; the fallen empty their slots.
  const extrasFor = (side: TeamFighter[], cap: TeamFighter): ArenaExtra[] =>
    side.filter((f) => f.id !== cap.id).map((f) => ({
      officer: f.officer,
      name: `${pickName(f.officer.name, lang)} ${f.downed ? '✕' : f.stamina}`,
      anim: f.downed ? ((f.fate === 'slain' ? 'death' : 'dodge')) : st.round > 0 && !st.over ? STRIKES[(st.round + f.id.length) % STRIKES.length] : 'idle',
      stamp: st.round,
      gone: f.downed && f.fate !== 'slain' && (f.downedRound ?? 0) < st.round,
    }));
  const leftExtras = useMemo(() => extrasFor(st.a, capA), [st, capA, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const rightExtras = useMemo(() => extrasFor(st.b, capB), [st, capB, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const sound = () => {
    if (st.over) return;
    const capABefore = capA.id;
    const capBBefore = capB.id;
    const { state: next, downs } = stepTeamDuel(st, { focusId, guardId });
    // Stale orders die with their targets.
    if (focusId && next.b.find((f) => f.id === focusId)?.downed) setFocusId(undefined);
    if (guardId && next.a.find((f) => f.id === guardId)?.downed) setGuardId(undefined);
    // Drive the arena: downs decide the beat; else alternate the telling blow.
    const downsA = downs.some((f) => f.side === 'a');
    const downsB = downs.some((f) => f.side === 'b');
    const capDown = downs.find((f) => f.id === capABefore || f.id === capBBefore);
    keyRef.current += 1;
    setEvent({
      key: keyRef.current,
      hit: downsA && downsB ? 'both' : downsA ? 'a' : downsB ? 'd' : next.round % 2 ? 'd' : 'a',
      aMove: STRIKES[next.round % STRIKES.length], dMove: STRIKES[(next.round + 2) % STRIKES.length],
      over: next.over,
      winner: next.over ? (next.winner === 'a' ? 'attacker' : next.winner === 'b' ? 'defender' : 'draw')
        : downsA ? 'defender' : downsB ? 'attacker' : undefined,
      killed: !!capDown && capDown.fate === 'slain',
      fate: capDown && capDown.fate !== 'slain' ? capDown.fate : undefined,
    } as DuelArenaEvent);
    setSt(next);
  };

  const chip = (on: boolean, color: string): React.CSSProperties => ({
    padding: '0.22rem 0.5rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem',
    background: on ? `${color}33` : '#10161e', border: `1px solid ${on ? color : '#26323e'}`, color: on ? '#fff' : '#8a96a0',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <DuelArena3D
        attacker={capA.officer}
        defender={capB.officer}
        leftName={`${pickName(capA.officer.name, lang)} ${capA.downed ? '✕' : capA.stamina}`}
        rightName={`${pickName(capB.officer.name, lang)} ${capB.downed ? '✕' : capB.stamina}`}
        event={event}
        leftExtras={leftExtras}
        rightExtras={rightExtras}
      />
      {/* 軍令台 — orders + the drum, over the ring. */}
      <div style={{ position: 'fixed', left: '50%', bottom: 14, transform: 'translateX(-50%)', width: 620, maxWidth: '96vw', background: 'rgba(18,16,11,0.94)', border: '1px solid #e0846a', borderRadius: 'var(--tkm-radius)', padding: '0.6rem 0.8rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', zIndex: 132, boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
        {!st.over ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: '0.74rem', color: '#e0846a', letterSpacing: '0.05rem' }}>{t('集火', 'Focus')}</span>
              {alive(st.b).map((f) => (
                <button key={f.id} onClick={() => setFocusId(focusId === f.id ? undefined : f.id)} style={chip(focusId === f.id, '#e0846a')}
                  title={t('全隊近戰優先攻此將(射程可及時)', 'Your melee presses this foe when reachable')}>
                  🎯 {pickName(f.officer.name, lang)} · {f.stamina}
                </button>
              ))}
              {alive(st.b).length === 0 && <span style={{ fontSize: '0.74rem', color: '#7a8893' }}>{t('敵陣已空', 'None standing')}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#8ec8a0', letterSpacing: '0.05rem' }}>{t('死守', 'Guard')}</span>
              {alive(st.a).map((f) => (
                <button key={f.id} onClick={() => setGuardId(guardId === f.id ? undefined : f.id)} style={chip(guardId === f.id, '#8ec8a0')}
                  title={t('此將本合力守:出手減半,但可架開兩記最凶之擊', 'Fights defensively: half force out, parries the TWO sharpest blows in')}>
                  🛡 {pickName(f.officer.name, lang)} · {f.stamina}
                </button>
              ))}
            </div>
            <button
              onClick={sound}
              style={{ width: '100%', padding: '0.5rem', background: 'linear-gradient(180deg,#5a2a20,#3a1810)', border: '1px solid #e0846a', borderRadius: 'var(--tkm-radius-sm)', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', letterSpacing: '0.1rem' }}
            >🥁 {t(`擂鼓進擊!(第 ${st.round + 1} 合)`, `Sound the drum! (round ${st.round + 1})`)}</button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <span style={{ color: '#f2dd9a', fontSize: '0.92rem' }}>
              {st.winner === 'a' ? t('我方群英並擊,大獲全勝!', 'Your champions carry the melee!')
                : st.winner === 'b' ? t('敵陣群英勢盛,我方敗退。', 'The enemy champions carry the day.')
                : t('兩陣皆疲,鳴金收兵 — 平手。', 'Both knots tire — a draw.')}
            </span>
            <button
              onClick={() => { if (!doneRef.current) { doneRef.current = true; onComplete(teamStateResult(st)); } }}
              style={{ padding: '0.35rem 0.9rem', background: 'linear-gradient(180deg,#4a3a1a,#2a2010)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius-sm)', color: '#f0d890', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
            >{t('收場', 'Done')}</button>
          </div>
        )}
        {st.log.length > 0 && (
          <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#94a2ae', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lang === 'en' ? st.log[st.log.length - 1].en : st.log[st.log.length - 1].zh}
          </div>
        )}
      </div>
    </>
  );
}
