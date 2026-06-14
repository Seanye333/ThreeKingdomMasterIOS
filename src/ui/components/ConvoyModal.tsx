import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';

/**
 * 輜重一覽 — every supply convoy in transit: where from, where to, what it
 * carries and how many seasons until it arrives. Recall any of them and the
 * cargo turns around for its origin city.
 */
export function ConvoyModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const convoys = useGameStore((s) => s.convoys);
  const cities = useGameStore((s) => s.cities);
  const recallConvoy = useGameStore((s) => s.recallConvoy);

  const rows = useMemo(
    () => Object.values(convoys).sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [convoys],
  );

  const cargoText = (c: typeof rows[number]) =>
    [c.food > 0 ? `糧 ${c.food.toLocaleString()}` : '', c.gold > 0 ? `金 ${c.gold.toLocaleString()}` : '', c.troops > 0 ? `兵 ${c.troops.toLocaleString()}` : '']
      .filter(Boolean).join(' · ') || '—';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #5a4530',
        width: 'min(560px,100%)', maxHeight: '86vh', overflowY: 'auto', color: '#e8d9b0',
        fontFamily: '"Songti SC","Noto Serif SC",serif', padding: '1rem 1.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div style={{ fontSize: '1.15rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>🐂 {t('輜重', 'Convoys')} <span style={{ color: '#8a7050', fontSize: '0.8rem' }}>({rows.length})</span></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>
        {rows.length === 0 ? (
          <div style={{ color: '#8a7050', fontSize: '0.85rem', padding: '1.4rem 0', textAlign: 'center' }}>
            {t('途中並無輜重車隊。', 'No convoys in transit.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((c) => {
              const from = cities[c.fromCityId];
              const to = cities[c.toCityId];
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#1a140d', border: '1px solid #3a2c1c', borderRadius: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f0e0b0', fontSize: '0.88rem' }}>
                      {from?.name.zh ?? '?'} <span style={{ color: '#8a7050' }}>→</span> {to?.name.zh ?? '?'}
                      <span style={{ color: '#8a7050', fontSize: '0.74rem' }}> · {t(`${c.seasonsRemaining}/${c.totalSeasons} 季`, `${c.seasonsRemaining}/${c.totalSeasons}s`)}</span>
                    </div>
                    <div style={{ color: '#c0a878', fontSize: '0.76rem', fontFamily: 'ui-monospace, monospace' }}>{cargoText(c)}</div>
                  </div>
                  <button
                    onClick={() => recallConvoy(c.id)}
                    title={t('召回 — 貨物返回出發城', 'Recall — cargo returns to the origin city')}
                    style={{ background: 'rgba(184,68,46,0.16)', border: '1px solid #b8442e', color: '#e8a890', padding: '0.2rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                  >{t('召回', 'Recall')}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
