import { useRef, useState } from 'react';
import type { Officer } from '../../game/types';
import {
  initDebate, debateRound, aiDebateMove, debateMoraleDeltas, PRESS_MOMENTUM_COST, debateMoveCost,
  type DebateMove, type DebateBout,
} from '../../game/systems/wordWar';
import { OfficerPortrait } from './OfficerPortrait';
import { useT, useLanguage } from '../i18n';

/** Per-exchange feedback emitted by {@link DebateGameModal} so a host (the 3D
 *  debate hall) can drive declamation / recoil / rout animations. `hit` is which
 *  mind lost composure; `winner` is the round (or, when `over`, the bout) victor;
 *  `routed` means a mind's 沉著 actually hit 0 (a 罵倒, not a points finish). */
export interface DebateRoundFx {
  hit: 'a' | 'd' | 'both';
  aMove: DebateMove;
  dMove: DebateMove;
  dmg: number;
  over: boolean;
  routed: boolean;
  winner?: 'a' | 'd' | 'draw';
}

/**
 * Interactive 舌戰 (war of words) — the player commits 論/諷/駁/詰 each round vs
 * the AI. 論>諷, 諷>駁, 駁>論; a successful 駁 banks 氣勢, and 詰 (Press, 2 氣勢)
 * beats 論 and 諷 but is turned aside by 駁. Drain the foe's 沉著 to 0 to rout
 * them; the loser's side opens the battle demoralized.
 */
const MOVES: Array<{ id: DebateMove; zh: string; en: string; cost?: number; hint: { zh: string; en: string } }> = [
  { id: 'assert',  zh: '論', en: 'Assert',  hint: { zh: '勝諷·哂、負駁詰引', en: 'beats Provoke/Scorn, loses to Retort/Press/Cite' } },
  { id: 'retort',  zh: '駁', en: 'Retort',  hint: { zh: '勝論·詰、攢勢', en: 'beats Assert/Press, banks momentum' } },
  { id: 'provoke', zh: '諷', en: 'Provoke', hint: { zh: '勝駁·哂、負論詰引', en: 'beats Retort/Scorn, loses to Assert/Press/Cite' } },
  { id: 'press',   zh: '詰', en: 'Press',   cost: PRESS_MOMENTUM_COST, hint: { zh: '耗2勢，勝論諷引；負駁哂', en: '2勢 — beats Assert/Provoke/Cite; loses to Retort/Scorn' } },
  { id: 'cite',    zh: '引', en: 'Cite',    cost: 2, hint: { zh: '耗2勢，引經據典壓三式；負詰哂', en: '2勢 — authority over the 3 base; loses to Press/Scorn' } },
  { id: 'scorn',   zh: '哂', en: 'Scorn',   cost: 1, hint: { zh: '耗1勢，哂笑破駁·引·詰；負論諷', en: '1勢 — deflates Retort/Cite/Press; loses to Assert/Provoke' } },
];

export function DebateGameModal({
  me, foe, onComplete, staged = false, onRound,
}: {
  me: Officer;
  foe: Officer;
  onComplete: (outcome: { meDelta: number; foeDelta: number; winner: 'me' | 'foe' | 'draw' }) => void;
  /** When staged, render as a slim bottom control panel over the 3D hall. */
  staged?: boolean;
  /** Fires after each exchange so the 3D debate hall can animate the minds. */
  onRound?: (fx: DebateRoundFx) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [bout, setBout] = useState<DebateBout>(() => initDebate(me, foe));
  const [log, setLog] = useState<string[]>([]);
  // 佔理演出 — per-round retort feedback: who lost composure, by how much, with
  // a key so the glint / shake / float replay even on a repeat hit.
  const [fx, setFx] = useState<{ key: number; hit: 'a' | 'd' | 'both'; dmg: number; routed: boolean } | null>(null);
  const fxKey = useRef(0);
  const nm = (o: Officer) => (lang === 'en' ? o.name.en : o.name.zh);
  const moveZh = (m: DebateMove) => MOVES.find((x) => x.id === m)!.zh;

  const play = (move: DebateMove) => {
    if (bout.over) return;
    if (bout.aMomentum < debateMoveCost(move)) return; // not enough 氣勢 to spend
    const foeMove = aiDebateMove(bout, 'd', Math.random);
    const res = debateRound(bout, move, foeMove, Math.random);
    const who = res.roundWinner === 'a' ? nm(me) : res.roundWinner === 'd' ? nm(foe) : t('各執', 'Stalemate');
    const line = res.roundWinner === 'draw'
      ? `${t('第', 'R')}${res.bout.round}: ${nm(me)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(foe)} — ${t('相持', 'no ground')}`
      : `${t('第', 'R')}${res.bout.round}: ${nm(me)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(foe)} — ${who}${t(' 佔理', ' presses home')} (−${Math.max(res.dmgToA, res.dmgToD)})`;
    setLog((l) => [line, ...l].slice(0, 7));
    setBout(res.bout);

    // Fire the retort feedback: the round loser loses composure.
    const hit: 'a' | 'd' | 'both' =
      res.dmgToA > res.dmgToD ? 'a'
      : res.dmgToD > res.dmgToA ? 'd'
      : 'both';
    fxKey.current += 1;
    setFx({ key: fxKey.current, hit, dmg: Math.max(res.dmgToA, res.dmgToD), routed: !!res.bout.over });

    // 演武 — hand the exchange to the 3D hall (if any) so the minds animate.
    // `routed` = composure actually broke (a 罵倒), as opposed to a points finish.
    const broke = res.bout.aComposure <= 0 || res.bout.dComposure <= 0;
    onRound?.({
      hit, aMove: move, dMove: foeMove,
      dmg: Math.max(res.dmgToA, res.dmgToD),
      over: !!res.bout.over, routed: broke,
      winner: res.bout.over ? res.bout.winner : res.roundWinner,
    });
  };

  const bar = (val: number, color: string) => (
    <div style={{ height: 14, background: '#1b2531', border: '1px solid #2b3845', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
  const pips = (n: number) => (
    <div style={{ fontSize: '0.7rem', color: n >= PRESS_MOMENTUM_COST ? '#e6c473' : '#6a5238', letterSpacing: '0.05rem' }}>
      {t('勢', 'MO')} {'◆'.repeat(n)}{'◇'.repeat(Math.max(0, PRESS_MOMENTUM_COST - n))}
    </div>
  );

  const resultText = !bout.over ? '' :
    bout.winner === 'draw' ? t('各執一詞 — 不分勝負', 'A stalemate of words')
    : bout.winner === 'a' ? `${nm(me)} ${t('辯勝', 'wins the exchange')}!`
    : `${nm(foe)} ${t('辯勝', 'wins the exchange')}!`;

  // ── Staged mode — a slim control panel over the 3D debate hall ──────────────
  if (staged) {
    const side = (o: Officer, mo: number, color: string, hitSide: 'a' | 'd', align: 'left' | 'right') => (
      <div
        key={fx && (fx.hit === hitSide || fx.hit === 'both') && !reduced ? `${hitSide}${fx.key}` : hitSide}
        className={fx && (fx.hit === hitSide || fx.hit === 'both') && !reduced ? 'tkm-shake' : undefined}
        style={{ flex: 1, position: 'relative', textAlign: align }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
          <OfficerPortrait officer={o} size={30} forceColor={color} />
          <div style={{ color: '#e6c473', fontSize: '0.82rem' }}>{nm(o)}</div>
        </div>
        <div style={{ marginTop: 3 }}>{bar(hitSide === 'a' ? bout.aComposure : bout.dComposure, color)}</div>
        {pips(mo)}
        {fx && fx.dmg > 0 && (fx.hit === hitSide || fx.hit === 'both') && (
          <span key={`d${hitSide}${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', [align === 'right' ? 'left' : 'right']: 8, top: -2, fontSize: '1.05rem' }}>−{fx.dmg}</span>
        )}
      </div>
    );
    return (
      <div style={{ position: 'fixed', left: '50%', bottom: 14, transform: 'translateX(-50%)', width: 560, maxWidth: '96vw', background: 'rgba(18,16,11,0.92)', border: '1px solid #88b7e8', borderRadius: 8, padding: '0.7rem 0.9rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', zIndex: 130, boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          {side(me, bout.aMomentum, '#6abf6a', 'a', 'left')}
          <div style={{ alignSelf: 'center', color: '#88b7e8', letterSpacing: '0.1rem', fontSize: '0.95rem' }}>舌{t('戰', '')}</div>
          {side(foe, bout.dMomentum, '#c178c7', 'd', 'right')}
        </div>
        {!bout.over ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {MOVES.map((m) => {
              const cost = m.cost ?? 0;
              const disabled = cost > bout.aMomentum;
              return (
                <button
                  key={m.id}
                  onClick={() => play(m.id)}
                  disabled={disabled}
                  style={{ padding: '0.35rem 0.2rem', background: disabled ? '#1a1810' : '#26221a', border: `1px solid ${disabled ? '#2c281c' : cost ? '#7a6a3a' : '#4a5530'}`, color: disabled ? '#5a4a36' : '#e6edf3', cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
                  title={lang === 'en' ? m.hint.en : m.hint.zh}
                >
                  <div style={{ fontSize: '1.1rem', color: disabled ? '#5a4a36' : cost ? '#e6c473' : '#88b7e8' }}>{m.zh}{cost ? ` ${'◆'.repeat(cost)}` : ''}</div>
                  <div style={{ fontSize: '0.54rem', color: '#7a8893' }}>{m.en}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className={reduced ? undefined : 'tkm-victory-slam'} style={{ color: '#88b7e8', fontSize: '1.05rem', letterSpacing: '0.06rem', marginBottom: '0.4rem', textShadow: '0 0 12px rgba(136,183,232,0.5)' }}>{resultText}</div>
            <button
              onClick={() => {
                const { meDelta, foeDelta } = debateMoraleDeltas(bout);
                const winner = bout.winner === 'a' ? 'me' : bout.winner === 'd' ? 'foe' : 'draw';
                onComplete({ meDelta, foeDelta, winner });
              }}
              style={{ padding: '0.4rem 1.4rem', background: '#26221a', border: '1px solid #88b7e8', color: '#88b7e8', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.06rem' }}
            >{t('確定', 'Continue')}</button>
          </div>
        )}
        {log[0] && <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: '#94a2ae', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log[0]}</div>}
      </div>
    );
  }

  return (
    // Above the 3D battle screen (z-1000) — at its old z-130 it was silently
    // buried whenever the 3D view was up.
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'grid', placeItems: 'center', zIndex: 1100 }}>
      <div style={{ width: 560, maxWidth: '95vw', background: '#16140f', border: '1px solid #88b7e8', padding: '1.25rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3' }}>
        <div style={{ textAlign: 'center', color: '#88b7e8', letterSpacing: '0.14rem', fontSize: '1.2rem', marginBottom: '0.8rem' }}>
          舌 {t('戰', 'War of Words')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', position: 'relative' }}>
          <div
            key={fx && (fx.hit === 'a' || fx.hit === 'both') && !reduced ? `a${fx.key}` : 'a'}
            className={fx && (fx.hit === 'a' || fx.hit === 'both') && !reduced ? 'tkm-shake' : undefined}
            style={{ position: 'relative' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <OfficerPortrait officer={me} size={44} forceColor="#6abf6a" />
              <div><div style={{ color: '#e6c473' }}>{nm(me)}</div><div style={{ fontSize: '0.72rem', color: '#aab6c0' }}>{t('智', 'INT')} {me.stats.intelligence}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.aComposure, '#6abf6a')}</div>
            {pips(bout.aMomentum)}
            {fx && fx.dmg > 0 && (fx.hit === 'a' || fx.hit === 'both') && (
              <span key={`da${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', left: 8, top: 4, fontSize: '1.1rem' }}>−{fx.dmg}</span>
            )}
          </div>

          {/* 唇槍 — a verbal jab flashes over the centre each exchange. */}
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center', minWidth: '2.2rem' }}>
            <div style={{ fontSize: '1.4rem', color: '#7a8893' }}>⟷</div>
            {fx && !reduced && (
              <span key={`c${fx.key}`} className="tkm-clash" style={{ position: 'absolute', color: fx.routed ? '#a9c8e2' : '#88b7e8' }}>
                {fx.routed ? '✸' : '⚡'}
              </span>
            )}
          </div>

          <div
            key={fx && fx.hit === 'd' && !reduced ? `d${fx.key}` : 'd'}
            className={fx && fx.hit === 'd' && !reduced ? 'tkm-shake' : undefined}
            style={{ textAlign: 'right', position: 'relative' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: 'row-reverse' }}>
              <OfficerPortrait officer={foe} size={44} forceColor="#c178c7" />
              <div><div style={{ color: '#e6c473' }}>{nm(foe)}</div><div style={{ fontSize: '0.72rem', color: '#aab6c0' }}>{t('智', 'INT')} {foe.stats.intelligence}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.dComposure, '#c178c7')}</div>
            {pips(bout.dMomentum)}
            {fx && fx.dmg > 0 && (fx.hit === 'd' || fx.hit === 'both') && (
              <span key={`dd${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', right: 8, top: 4, fontSize: '1.1rem' }}>−{fx.dmg}</span>
            )}
          </div>
        </div>

        {!bout.over && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            {MOVES.map((m) => {
              const cost = m.cost ?? 0;
              const disabled = cost > bout.aMomentum;
              return (
                <button
                  key={m.id}
                  onClick={() => play(m.id)}
                  disabled={disabled}
                  style={{
                    padding: '0.5rem 0.3rem', background: disabled ? '#1a1810' : '#26221a',
                    border: `1px solid ${disabled ? '#2c281c' : cost ? '#7a6a3a' : '#4a5530'}`,
                    color: disabled ? '#5a4a36' : '#e6edf3', cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}
                  title={lang === 'en' ? m.hint.en : m.hint.zh}
                >
                  <div style={{ fontSize: '1.25rem', color: disabled ? '#5a4a36' : cost ? '#e6c473' : '#88b7e8' }}>{m.zh}{cost ? ` ${'◆'.repeat(cost)}` : ''}</div>
                  <div style={{ fontSize: '0.6rem', color: '#7a8893' }}>{lang === 'en' ? m.en : m.hint.zh}</div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '0.8rem', minHeight: 96, maxHeight: 96, overflow: 'hidden', fontSize: '0.74rem', color: '#aab6c0', lineHeight: 1.6 }}>
          {log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.12 }}>{l}</div>)}
        </div>

        {bout.over && (
          <div style={{ marginTop: '0.6rem', textAlign: 'center' }}>
            <div className={reduced ? undefined : 'tkm-victory-slam'} style={{ color: '#88b7e8', fontSize: '1.15rem', letterSpacing: '0.07rem', marginBottom: '0.6rem', textShadow: '0 0 12px rgba(136,183,232,0.5)' }}>{resultText}</div>
            <button
              onClick={() => {
                const { meDelta, foeDelta } = debateMoraleDeltas(bout);
                const winner = bout.winner === 'a' ? 'me' : bout.winner === 'd' ? 'foe' : 'draw';
                onComplete({ meDelta, foeDelta, winner });
              }}
              style={{ padding: '0.45rem 1.6rem', background: '#26221a', border: '1px solid #88b7e8', color: '#88b7e8', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem' }}
            >
              {t('確定', 'Continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
