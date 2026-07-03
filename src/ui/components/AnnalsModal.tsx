import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import type { AnnalsEntry } from '../../game/types/event';
import { useT } from '../i18n';

const KIND_META: Record<AnnalsEntry['kind'], { zh: string; icon: string; color: string }> = {
  event:    { zh: '史事', icon: '📜', color: '#e6c473' },
  omen:     { zh: '天象', icon: '☄', color: '#9aa8e8' },
  disaster: { zh: '災異', icon: '🌊', color: '#e88a70' },
  frontier: { zh: '邊患', icon: '🏹', color: '#c98a4e' },
  unrest:   { zh: '亂事', icon: '🔥', color: '#e87a7a' },
  rite:     { zh: '祭禮', icon: '⛩', color: '#8ad6a0' },
};

const SEASON_ZH: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

/** §8.1-deep 災異志 — the browsable annals of events, omens, disasters,
 *  frontier alarms, risings and rites, newest first. */
export function AnnalsModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const t = useT();
  const annals = useGameStore((s) => s.annals ?? []);
  const [filter, setFilter] = useState<AnnalsEntry['kind'] | 'all'>('all');

  const shown = useMemo(() => {
    const list = filter === 'all' ? annals : annals.filter((e) => e.kind === filter);
    return [...list].reverse();
  }, [annals, filter]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          width: 'min(620px,100%)', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.08rem' }}>☄ {t('災異志', 'Annals of Portents')}</div>
            <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>
              {t('本朝史事・天象・災異・邊患・亂事・祭禮之編年', 'Events, omens, disasters, frontier alarms, risings & rites')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {(['all', 'event', 'omen', 'disaster', 'frontier', 'unrest', 'rite'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
                background: filter === k ? 'rgba(212,168,74,0.18)' : 'transparent',
                border: `1px solid ${filter === k ? '#e6c473' : '#26323e'}`,
                color: filter === k ? '#f2dd9a' : '#a08a60',
              }}
            >{k === 'all' ? t('全部', 'All') : `${KIND_META[k].icon} ${KIND_META[k].zh}`}</button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {shown.length === 0 && (
            <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem 0' }}>
              {t('尚無記載 — 史官持筆以待。', 'Nothing recorded yet — the historians wait, brush in hand.')}
            </div>
          )}
          {shown.map((e, i) => {
            const meta = KIND_META[e.kind];
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ minWidth: 86, color: '#7a8893', fontSize: '0.75rem', paddingTop: 2 }}>
                  {e.year}年{SEASON_ZH[e.season] ?? e.season}
                </div>
                <div style={{ minWidth: 58, color: meta.color, fontSize: '0.78rem', paddingTop: 1 }}>
                  {meta.icon} {e.titleZh}
                </div>
                <div style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.45 }}>{e.textZh}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
