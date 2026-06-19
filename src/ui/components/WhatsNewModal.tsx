import { useEffect, useState } from 'react';
import { CHANGELOG, GAME_VERSION } from '../../game/data/changelog';
import { useT } from '../i18n';

/**
 * 本次更新 — shows the newest changelog entry once per version bump
 * (tracked in localStorage), plus a full history view on demand.
 */
const SEEN_KEY = 'tkm-seen-version';

export function WhatsNewModal() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      // First-ever visitors skip the popup (everything is "new" to them);
      // returning players see what changed.
      if (seen && seen !== GAME_VERSION) setOpen(true);
      if (!seen) localStorage.setItem(SEEN_KEY, GAME_VERSION);
    } catch { /* private mode */ }
  }, []);

  if (!open) return null;

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, GAME_VERSION); } catch { /* quota */ }
    setOpen(false);
  };

  const entries = showAll ? CHANGELOG : CHANGELOG.slice(0, 1);

  return (
    <div
      onClick={dismiss}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 960, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid #e6c473',
          width: 'min(560px,100%)', maxHeight: '82vh', overflowY: 'auto',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1.1rem 1.4rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.07rem' }}>
            📯 {t('本次更新', "What's new")} <span style={{ fontSize: '0.75rem', color: '#7a8893' }}>v{GAME_VERSION}</span>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
        </div>
        {entries.map((e) => (
          <div key={e.version} style={{ marginTop: '0.8rem' }}>
            <div style={{ color: '#f2dd9a', fontSize: '0.95rem' }}>
              v{e.version} · {e.title}
              <span style={{ color: '#7a8893', fontSize: '0.7rem', marginLeft: 8 }}>{e.date}</span>
            </div>
            <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.8, color: '#cdb88f' }}>
              {e.items.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
          {!showAll && CHANGELOG.length > 1 && (
            <button
              onClick={() => setShowAll(true)}
              style={{ background: 'transparent', border: '1px solid #2b3845', color: '#7a8893', padding: '0.35rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
            >{t('看全部歷史', 'Full history')}</button>
          )}
          <button
            onClick={dismiss}
            style={{ flex: 1, background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: '1px solid #e6c473', color: '#f2dd9a', padding: '0.4rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem' }}
          >{t('知道了', 'Got it')}</button>
        </div>
      </div>
    </div>
  );
}
