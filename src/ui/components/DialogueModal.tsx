import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';

export function DialogueModal() {
  const dlg = useGameStore((s) => s.pendingDialogue);
  const accept = useGameStore((s) => s.acceptDialogue);
  const officers = useGameStore((s) => s.officers);
  const [choseIdx, setChoseIdx] = useState<number | null>(null);
  const t = useT();
  const lang = useLanguage();
  if (!dlg) return null;
  const speaker = dlg.speakerOfficerId ? officers[dlg.speakerOfficerId] : null;
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
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '2px solid #d4a84a',
          width: 'min(560px,100%)',
          padding: '2rem',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
      >
        <div style={{
          fontSize: '0.65rem',
          letterSpacing: '0.3rem',
          color: '#c19a3b',
          textTransform: 'uppercase',
          marginBottom: '0.7rem',
          textAlign: 'center',
        }}>
          {t('書信', 'Court Event')}
        </div>
        <div style={{ fontSize: '1.2rem', color: '#d4a84a', letterSpacing: '0.2rem', textAlign: 'center' }}>
          {lang === 'en' ? speakerName.en : speakerName.zh}
        </div>
        {lang === 'both' && (
          <div style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic', textAlign: 'center', marginBottom: '1rem' }}>
            {speakerName.en}
          </div>
        )}
        <hr style={{
          border: 'none', height: 1,
          background: 'linear-gradient(90deg, transparent, #d4a84a, transparent)',
          margin: '1rem 0',
        }} />
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.8,
          color: '#d4a84a',
          textAlign: 'justify',
          fontStyle: 'italic',
          margin: 0,
        }}>{lang === 'en' ? dlg.text.en : dlg.text.zh}</p>
        {lang === 'both' && (
          <p style={{ fontSize: '0.85rem', color: '#c0a878', textAlign: 'justify', marginTop: '0.5rem' }}>
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
                  background: '#3a2d20',
                  border: '1px solid #5a4530',
                  color: '#d4a84a',
                  padding: '0.6rem 1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  letterSpacing: '0.1rem',
                }}
              >
                {lang === 'en' ? c.label.en : c.label.zh}
                {lang === 'both' && <> <span style={{ color: '#8a7050', fontSize: '0.75rem', fontStyle: 'italic' }}>{c.label.en}</span></>}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            {chosen.outcome && (
              <>
                <p style={{ fontSize: '0.95rem', color: '#d4a84a' }}>{lang === 'en' ? chosen.outcome.en : chosen.outcome.zh}</p>
                {lang === 'both' && <p style={{ fontSize: '0.8rem', color: '#c0a878', fontStyle: 'italic' }}>{chosen.outcome.en}</p>}
              </>
            )}
            <button
              onClick={() => { accept(choseIdx!); setChoseIdx(null); }}
              style={{
                background: 'linear-gradient(180deg, #5a4530, #3a2d20)',
                border: '1px solid #d4a84a',
                color: '#d4a84a',
                padding: '0.5rem 2rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.2rem',
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
