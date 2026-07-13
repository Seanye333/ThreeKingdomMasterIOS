import { useGameStore } from '../../game/state/store';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useT } from '../i18n';

/**
 * 史官年鑑 — the historian's page for the year just closed, presented each
 * spring as a parchment leaf: 大勢 / 兵事 / 災異 / 武評 and a closing word to
 * the lord. Dismiss to file it away (ChronicleModal keeps the raw scroll).
 */
export function YearbookModal() {
  const t = useT();
  const chronicle = useGameStore((s) => s.pendingChronicle);
  const dismiss = () => useGameStore.setState({ pendingChronicle: null });
  useEscapeKey(chronicle ? dismiss : () => {});
  if (!chronicle) return null;
  return (
    <div
      onClick={dismiss}
      role="dialog"
      aria-label={t('史官年鑑', 'The Historian\'s Yearbook')}
      style={{
        position: 'fixed', inset: 0, zIndex: 1150, background: 'rgba(6,4,2,0.78)',
        display: 'grid', placeItems: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 94vw)', maxHeight: '82vh', overflowY: 'auto',
          background: 'linear-gradient(175deg, #241a0e 0%, #171007 100%)',
          border: '1px solid #6a5230', borderRadius: 'var(--tkm-radius-lg)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.8), inset 0 0 60px rgba(120,90,40,0.08)',
          padding: '1.4rem 1.6rem', color: '#d8c4a0', fontFamily: 'var(--tkm-font-body)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.5rem', color: '#a08050' }}>{t('史 官 曰', 'THE HISTORIAN WRITES')}</div>
          <div style={{ fontSize: '1.3rem', color: '#e8cf9a', letterSpacing: '0.2rem', fontFamily: '"Ma Shan Zheng", "Songti SC", serif', marginTop: 4 }}>
            {chronicle.titleZh}
          </div>
          <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #8a6a2a, transparent)', margin: '0.6rem auto 0' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.92rem', lineHeight: 2 }}>
          {chronicle.paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0, textIndent: '2em' }}>{p}</p>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.1rem' }}>
          <button
            onClick={dismiss}
            style={{
              background: 'rgba(212,168,74,0.14)', border: '1px solid #8a6a2a', borderRadius: 'var(--tkm-radius-sm)',
              color: '#e8cf9a', padding: '0.4rem 1.6rem', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.85rem', letterSpacing: '0.2rem',
            }}
          >{t('閱畢歸檔', 'File it away')}</button>
        </div>
      </div>
    </div>
  );
}
