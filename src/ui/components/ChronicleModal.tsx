import { useMemo } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';

/**
 * 國史 — the campaign chronicle as a scroll painting: every conquest, siege
 * work, famous event, rebellion and defence the史官 recorded, grouped by year
 * down a vertical timeline. The data has been quietly accumulating in
 * state.chronicle all along; this is the scroll it was always meant for.
 */

const KIND_STYLE: Record<string, { glyph: string; color: string; zh: string; en: string }> = {
  conquest:  { glyph: '⚔', color: '#d4604a', zh: '攻略', en: 'Conquest' },
  defense:   { glyph: '🛡', color: '#5a8ad6', zh: '守禦', en: 'Defense' },
  works:     { glyph: '🏗', color: '#c9a64e', zh: '工事', en: 'Works' },
  event:     { glyph: '✦', color: '#9a7ad0', zh: '大事', en: 'Event' },
  rebellion: { glyph: '🔥', color: '#d0823a', zh: '亂事', en: 'Rebellion' },
};
const SEASON_ZH: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
const SEASON_ORDER: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };

export function ChronicleModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const chronicle = useGameStore((s) => s.chronicle ?? []);
  const date = useGameStore((s) => s.date);
  const playerForce = useGameStore((s) => (s.playerForceId ? s.forces[s.playerForceId] : null));
  const t = useT();
  const lang = useLanguage();

  // Group by year, chronological.
  const years = useMemo(() => {
    const sorted = [...chronicle].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : (SEASON_ORDER[a.season] ?? 0) - (SEASON_ORDER[b.season] ?? 0));
    const map = new Map<number, typeof sorted>();
    for (const e of sorted) {
      const arr = map.get(e.year) ?? [];
      arr.push(e);
      map.set(e.year, arr);
    }
    return [...map.entries()];
  }, [chronicle]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8, 6, 4, 0.82)',
        display: 'grid', placeItems: 'center', zIndex: 260,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 94vw)', maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #221a10 0%, #1a140c 100%)',
          border: '1px solid #8a6f3a',
          boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(20,12,4,0.6)',
          fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
        }}
      >
        {/* Scroll header — title seal style */}
        <header style={{
          padding: '0.9rem 1.4rem 0.7rem',
          borderBottom: '1px solid #2b3845',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(60,42,20,0.5), transparent)',
        }}>
          <div>
            <span style={{ fontSize: '1.45rem', letterSpacing: '0.5rem', color: '#f2dd9a' }}>
              {t('國 史', 'Chronicle')}
            </span>
            <span style={{ marginLeft: '0.9rem', fontSize: '0.75rem', color: '#7a8893', letterSpacing: '0.1rem' }}>
              {playerForce ? (lang === 'en' ? playerForce.name.en : playerForce.name.zh) : ''}
              {' · '}{t(`至 ${date.year} 年`, `through ${date.year} AD`)}
              {' · '}{chronicle.length} {t('條', 'entries')}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#97a4ae',
            fontSize: '1.5rem', cursor: 'pointer',
          }}>×</button>
        </header>

        {/* The scroll body */}
        <div style={{ overflowY: 'auto', padding: '1rem 1.6rem 1.6rem' }}>
          {years.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#7a8893', padding: '3rem 1rem',
              fontStyle: 'italic', letterSpacing: '0.05rem',
            }}>
              {t('史官尚未動筆 — 去攻下一座城,或守住一場圍攻。', 'The historian\'s brush is dry — take a city, or hold one.')}
            </div>
          ) : (
            years.map(([year, entries]) => (
              <section key={year} style={{ marginBottom: '1.2rem' }}>
                {/* Year rule — like a chapter heading on the scroll */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '0.4rem 0 0.6rem',
                }}>
                  <span style={{
                    fontSize: '1.05rem', color: '#e6c473', letterSpacing: '0.08rem',
                    border: '1px solid #8a6f3a', padding: '0.1rem 0.6rem', borderRadius: 'var(--tkm-radius-xs)',
                    background: 'rgba(212, 168, 74, 0.07)',
                  }}>{year}{t('年', ' AD')}</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #364654, transparent)' }} />
                </div>
                {entries.map((e, i) => {
                  const ks = KIND_STYLE[e.kind] ?? KIND_STYLE.event;
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '0.6rem', alignItems: 'baseline',
                      padding: '0.3rem 0 0.3rem 0.4rem',
                      borderLeft: `2px solid ${ks.color}44`,
                      marginBottom: '0.15rem',
                    }}>
                      <span style={{ color: '#7a8893', fontSize: '0.7rem', flexShrink: 0, width: 18, textAlign: 'center' }}>
                        {SEASON_ZH[e.season] ?? ''}
                      </span>
                      <span style={{ color: ks.color, fontSize: '0.72rem', flexShrink: 0, letterSpacing: '0.05rem' }}>
                        {ks.glyph} {lang === 'en' ? ks.en : ks.zh}
                      </span>
                      <span style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                        {lang === 'en' ? e.en : e.zh}
                      </span>
                    </div>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
