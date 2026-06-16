import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { OfficerPortrait } from './OfficerPortrait';
import { useT, useLanguage } from '../i18n';

export function DialogueModal() {
  const dlg = useGameStore((s) => s.pendingDialogue);
  const accept = useGameStore((s) => s.acceptDialogue);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const year = useGameStore((s) => s.date.year);
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [choseIdx, setChoseIdx] = useState<number | null>(null);
  // Typewriter reveal — characters fade in over ~1s for narrative gravitas.
  const [revealedChars, setRevealedChars] = useState(0);
  const t = useT();
  const lang = useLanguage();
  useEffect(() => {
    if (!dlg) return;
    setRevealedChars(0);
    const fullText = lang === 'en' ? dlg.text.en : dlg.text.zh;
    const total = fullText.length;
    const start = Date.now();
    const duration = Math.min(1400, 40 * total); // ~40ms per char, capped
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(1, elapsed / duration);
      setRevealedChars(Math.floor(total * pct));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dlg, lang]);
  if (!dlg) return null;
  const displayText = (lang === 'en' ? dlg.text.en : dlg.text.zh).slice(0, revealedChars);
  const isFullyRevealed = revealedChars >= (lang === 'en' ? dlg.text.en.length : dlg.text.zh.length);
  const speaker = dlg.speakerOfficerId ? officers[dlg.speakerOfficerId] : null;
  const speakerForce = speaker?.forceId ? forces[speaker.forceId] : null;
  const speakerName = speaker
    ? { zh: speaker.name.zh, en: speaker.name.en }
    : dlg.speaker ?? { zh: '?', en: '?' };
  const chosen = choseIdx != null ? dlg.choices[choseIdx] : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        display: 'grid', placeItems: 'center',
        zIndex: 940, padding: '1rem',
      }}
    >
      <div
        onClick={(e) => {
          // Click to skip to fully revealed text.
          e.stopPropagation();
          if (!isFullyRevealed) {
            setRevealedChars(lang === 'en' ? dlg.text.en.length : dlg.text.zh.length);
          }
        }}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '2px solid #e6c473',
          width: 'min(560px,100%)',
          padding: '2rem',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
          animation: 'tkmScrollUnfurl 0.7s cubic-bezier(0.16,1,0.3,1) both',
          transformOrigin: 'top center',
          position: 'relative',
          boxShadow: '0 0 32px rgba(212,168,74,0.25), 0 4px 16px rgba(0,0,0,0.6)',
        }}
      >
        {/* Scroll rod decoration at top + bottom edges */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: -2, height: 4,
          background: 'linear-gradient(90deg, #6a4828 0%, #e6c473 50%, #6a4828 100%)',
          borderRadius: 2, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -2, height: 4,
          background: 'linear-gradient(90deg, #6a4828 0%, #e6c473 50%, #6a4828 100%)',
          borderRadius: 2, pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: '0.65rem',
          letterSpacing: '0.1rem',
          color: '#c9a64e',
          textTransform: 'uppercase',
          marginBottom: '0.7rem',
          textAlign: 'center',
        }}>
          {t('書信', 'Court Event')}
        </div>
        {/* 說話者立繪 — the speaker rises into a soft accent glow above their name. */}
        {speaker && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
            <div style={{
              borderRadius: '50%',
              border: `2px solid ${speakerForce?.color ?? '#e6c473'}`,
              boxShadow: `0 0 20px ${speakerForce?.color ?? '#e6c473'}88`,
              animation: reduced ? undefined : 'tkmPortraitRise 0.7s cubic-bezier(0.2,0.9,0.3,1) both',
            }}>
              <OfficerPortrait officer={speaker} size={84} forceColor={speakerForce?.color} year={year} />
            </div>
          </div>
        )}
        <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.07rem', textAlign: 'center' }}>
          {lang === 'en' ? speakerName.en : speakerName.zh}
        </div>
        {lang === 'both' && (
          <div style={{ fontSize: '0.78rem', color: '#7a8893', fontStyle: 'italic', textAlign: 'center', marginBottom: '1rem' }}>
            {speakerName.en}
          </div>
        )}
        <hr style={{
          border: 'none', height: 1,
          background: 'linear-gradient(90deg, transparent, #e6c473, transparent)',
          margin: '1rem 0',
        }} />
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.8,
          color: '#e6c473',
          textAlign: 'justify',
          fontStyle: 'italic',
          margin: 0,
          minHeight: '2.5em',
        }}>
          {displayText}
          {!isFullyRevealed && <span style={{ opacity: 0.6 }}>▎</span>}
        </p>
        {lang === 'both' && isFullyRevealed && (
          <p style={{ fontSize: '0.85rem', color: '#aab6c0', textAlign: 'justify', marginTop: '0.5rem' }}>
            {dlg.text.en}
          </p>
        )}

        {!chosen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1.5rem' }}>
            {dlg.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => setChoseIdx(i)}
                style={{
                  background: '#26323e',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                  color: '#e6c473',
                  padding: '0.6rem 1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  letterSpacing: '0.1rem',
                }}
              >
                {lang === 'en' ? c.label.en : c.label.zh}
                {lang === 'both' && <> <span style={{ color: '#7a8893', fontSize: '0.75rem', fontStyle: 'italic' }}>{c.label.en}</span></>}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            {chosen.outcome && (
              <>
                <p style={{ fontSize: '0.95rem', color: '#e6c473' }}>{lang === 'en' ? chosen.outcome.en : chosen.outcome.zh}</p>
                {lang === 'both' && <p style={{ fontSize: '0.8rem', color: '#aab6c0', fontStyle: 'italic' }}>{chosen.outcome.en}</p>}
              </>
            )}
            <button
              onClick={() => { accept(choseIdx!); setChoseIdx(null); }}
              style={{
                background: 'linear-gradient(180deg, #364654, #26323e)',
                border: '1px solid #e6c473',
                color: '#e6c473',
                padding: '0.5rem 2rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.07rem',
                marginTop: '0.5rem',
              }}
            >
              {t('續行', 'Continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
