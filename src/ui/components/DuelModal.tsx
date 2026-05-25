import { useEffect, useState } from 'react';
import type { DuelResult } from '../../game/systems/duel';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';

interface Props {
  result: DuelResult;
  onClose: () => void;
}

/**
 * Cinematic single-combat modal. Three phases:
 *   1. Stand-off — both portraits shown with names
 *   2. Strike — flash overlay
 *   3. Result — show roll breakdown and outcome
 */
export function DuelModal({ result, onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const [phase, setPhase] = useState<'standoff' | 'strike' | 'reveal'>('standoff');
  const t = useT();
  const lang = useLanguage();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('strike'), 1500);
    const t2 = setTimeout(() => setPhase('reveal'), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const a = officers[result.attackerRoll.officerId];
  const d = officers[result.defenderRoll.officerId];

  const nameStr = (o: typeof a) => o ? (lang === 'en' ? o.name.en : lang === 'both' ? `${o.name.zh} ${o.name.en}` : o.name.zh) : '?';
  const winnerLabel =
    result.winner === 'attacker' ? nameStr(a) :
    result.winner === 'defender' ? nameStr(d) :
    t('互不相讓', 'a stalemate');

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'grid', placeItems: 'center',
        zIndex: 980,
        animation: 'duelBg 0.6s ease-out',
      }}
    >
      <style>{`
        @keyframes duelBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes duelFlash { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes duelClash {
          0%   { transform: translateX(-40px) scale(0.92); opacity: 0; }
          80%  { transform: translateX(0) scale(1.05); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes duelClashRight {
          0%   { transform: translateX(40px) scale(0.92); opacity: 0; }
          80%  { transform: translateX(0) scale(1.05); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes blade {
          0%   { transform: rotate(-30deg) scale(0.5); opacity: 0; }
          40%  { transform: rotate(0deg) scale(2.5); opacity: 1; }
          100% { transform: rotate(30deg) scale(2.5); opacity: 0; }
        }
        .duel-name { font-family: "Songti SC","Noto Serif SC",serif; }
      `}</style>

      <div
        style={{
          width: 'min(820px,96vw)',
          background: 'linear-gradient(160deg,#1a1410,#0a0805)',
          border: '2px solid #d4a84a',
          padding: '2rem',
          color: '#e8d9b0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.45rem',
            color: '#c19a3b',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {t('一騎打', 'Single Combat')}
        </div>

        {/* Stand-off */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1.5rem',
            alignItems: 'center',
            position: 'relative',
            minHeight: 220,
          }}
        >
          {/* Attacker side */}
          <div
            style={{
              textAlign: 'right',
              animation: phase !== 'standoff' ? 'duelClash 0.6s ease-out' : undefined,
            }}
          >
            <DuelPortrait zh={a?.name.zh ?? '?'} color="#b8442e" side="attacker" />
            <div className="duel-name" style={{ fontSize: '1.6rem', color: '#d4a84a', letterSpacing: '0.3rem', marginTop: '0.5rem' }}>
              {lang === 'en' ? a?.name.en : a?.name.zh}
            </div>
            {lang === 'both' && <div style={{ fontSize: '0.8rem', color: '#8a7050', fontStyle: 'italic' }}>{a?.name.en}</div>}
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', color: '#c0a878', marginTop: '0.3rem' }}>
              {t('武力', 'War')} {a?.stats.war}
            </div>
          </div>

          {/* Middle — clash glyph */}
          <div
            style={{
              fontSize: '4rem',
              color: '#d4a84a',
              fontFamily: '"Songti SC", serif',
              textShadow: '0 0 14px rgba(212,168,74,0.6)',
              position: 'relative',
            }}
          >
            {phase === 'strike' ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.7)',
                  animation: 'duelFlash 0.6s ease-out',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span style={{ color: '#1a1410', fontSize: '5rem' }}>×</span>
              </div>
            ) : phase === 'standoff' ? (
              '⚔'
            ) : (
              <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.3rem' }}>
                {result.winner === 'attacker' && t('攻方勝', 'Attacker')}
                {result.winner === 'defender' && t('守方勝', 'Defender')}
                {result.winner === 'draw' && t('平手', 'Draw')}
              </div>
            )}
          </div>

          {/* Defender side */}
          <div
            style={{
              textAlign: 'left',
              animation: phase !== 'standoff' ? 'duelClashRight 0.6s ease-out' : undefined,
            }}
          >
            <DuelPortrait zh={d?.name.zh ?? '?'} color="#3a7dd9" side="defender" />
            <div className="duel-name" style={{ fontSize: '1.6rem', color: '#d4a84a', letterSpacing: '0.3rem', marginTop: '0.5rem' }}>
              {lang === 'en' ? d?.name.en : d?.name.zh}
            </div>
            {lang === 'both' && <div style={{ fontSize: '0.8rem', color: '#8a7050', fontStyle: 'italic' }}>{d?.name.en}</div>}
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', color: '#c0a878', marginTop: '0.3rem' }}>
              {t('武力', 'War')} {d?.stats.war}
            </div>
          </div>
        </div>

        {phase === 'reveal' && (
          <>
            <hr style={{ border: 'none', height: 1, background: 'linear-gradient(90deg, transparent, #d4a84a, transparent)', margin: '1.5rem 0' }} />
            <div
              style={{
                fontSize: '2rem',
                textAlign: 'center',
                color: result.winner === 'draw' ? '#c19a3b' : '#d4a84a',
                letterSpacing: '0.4rem',
                textShadow: '0 0 14px rgba(212,168,74,0.4)',
              }}
            >
              {result.winner === 'draw' ? t('勢均力敵', 'Stalemate') : t('勝!', 'Victory!')}
            </div>
            <div style={{ textAlign: 'center', color: '#c0a878', fontStyle: 'italic', marginTop: '0.5rem' }}>
              {result.winner === 'draw'
                ? t('兩將皆負傷而退,本場一騎打不分勝負。', 'Both warriors retreat, wounded and bloodied. The duel is a draw.')
                : t(`${winnerLabel} 力斬對手,敗者倒於沙場。`, `${winnerLabel} prevails. The loser falls on the field.`)}
            </div>

            {/* Roll breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', fontSize: '0.78rem' }}>
              <RollBox label={lang === 'en' ? (a?.name.en ?? '?') : (a?.name.zh ?? '?')} roll={result.attackerRoll} winner={result.winner === 'attacker'} />
              <RollBox label={lang === 'en' ? (d?.name.en ?? '?') : (d?.name.zh ?? '?')} roll={result.defenderRoll} winner={result.winner === 'defender'} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(180deg, #5a4530, #3a2d20)',
                  border: '1px solid #d4a84a',
                  color: '#d4a84a',
                  padding: '0.5rem 2rem',
                  fontFamily: '"Songti SC", serif',
                  letterSpacing: '0.3rem',
                  cursor: 'pointer',
                }}
              >
                {t('續行', 'Continue')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RollBox({ label, roll, winner }: { label: string; roll: import('../../game/systems/duel').DuelRoll; winner: boolean }) {
  const t = useT();
  return (
    <div
      style={{
        background: '#0a0805',
        border: `1px solid ${winner ? '#d4a84a' : '#4a3520'}`,
        padding: '0.6rem 0.85rem',
        fontFamily: 'ui-monospace, monospace',
        boxShadow: winner ? '0 0 10px rgba(212,168,74,0.3)' : undefined,
      }}
    >
      <div style={{ color: '#d4a84a', fontSize: '0.95rem', fontFamily: '"Songti SC", serif', marginBottom: '0.3rem' }}>
        {label}
      </div>
      <div style={{ color: '#c0a878' }}>{t('武力', 'War')}: {roll.base}</div>
      {roll.itemBonus > 0 && <div style={{ color: '#88b7e8' }}>{t('寶物', 'Items')}: +{roll.itemBonus}</div>}
      {roll.skillBonus !== 0 && <div style={{ color: '#3a7dd9' }}>{t('特技', 'Skills')}: +{roll.skillBonus}</div>}
      {roll.traitBonus !== 0 && (
        <div style={{ color: roll.traitBonus > 0 ? '#7ed68a' : '#b8442e' }}>
          {t('性格', 'Traits')}: {roll.traitBonus > 0 ? '+' : ''}{roll.traitBonus}
        </div>
      )}
      <div style={{ color: '#8a7050' }}>d30: {roll.diceRoll}</div>
      <div style={{ borderTop: '1px solid #3a2d20', marginTop: '0.3rem', paddingTop: '0.3rem', color: '#d4a84a' }}>
        {t('總計', 'Total')}: <strong>{roll.total}</strong>
      </div>
    </div>
  );
}

function DuelPortrait({ zh, color, side }: { zh: string; color: string; side: 'attacker' | 'defender' }) {
  const s = zh.charAt(0);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'inline-block' }}>
      <defs>
        <radialGradient id={`duel-grad-${side}-${zh.charCodeAt(0)}`} cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="70%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0a0805" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill={`url(#duel-grad-${side}-${zh.charCodeAt(0)})`} stroke="#d4a84a" strokeWidth="2" />
      <text
        x="60" y="78"
        textAnchor="middle"
        fontSize="60"
        fontFamily='"Songti SC","Noto Serif SC",serif'
        fontWeight="bold"
        fill="#e8d9b0"
        stroke="#1a1410"
        strokeWidth="1"
      >
        {s}
      </text>
    </svg>
  );
}
