import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 輜重一覽 — every supply convoy in transit: where from, where to, what it
 * carries and how many seasons until it arrives. Recall any of them and the
 * cargo turns around for its origin city.
 */
export function ConvoyModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const convoys = useGameStore((s) => s.convoys);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const recallConvoy = useGameStore((s) => s.recallConvoy);

  const rows = useMemo(
    () => Object.values(convoys)
      .filter((c) => c.forceId === playerForceId)
      .sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [convoys, playerForceId],
  );

  const cargoText = (c: typeof rows[number]) =>
    [c.food > 0 ? `糧 ${c.food.toLocaleString()}` : '', c.gold > 0 ? `金 ${c.gold.toLocaleString()}` : '', c.troops > 0 ? `兵 ${c.troops.toLocaleString()}` : '', (c.warhorses ?? 0) > 0 ? `馬 ${(c.warhorses ?? 0).toLocaleString()}` : '', (c.iron ?? 0) > 0 ? `鐵 ${(c.iron ?? 0).toLocaleString()}` : '', (c.medicine ?? 0) > 0 ? `藥 ${(c.medicine ?? 0).toLocaleString()}` : '']
      .filter(Boolean).join(' · ') || '—';

  return (
    <Modal onClose={onClose} icon="🐂" title={t('輜重', 'Convoys')} badge={`(${rows.length})`}>
        {rows.length === 0 ? (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1.4rem 0', textAlign: 'center' }}>
            {t('途中並無輜重車隊。', 'No convoys in transit.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((c) => {
              const from = cities[c.fromCityId];
              const to = cities[c.toCityId];
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#141c25', border: '1px solid #243240', borderRadius: 5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#eef4f8', fontSize: '0.88rem' }}>
                      {from?.name.zh ?? '?'} <span style={{ color: '#7a8893' }}>→</span> {to?.name.zh ?? '?'}
                      <span style={{ color: '#7a8893', fontSize: '0.74rem' }}> · {t(`${c.seasonsRemaining}/${c.totalSeasons} 季`, `${c.seasonsRemaining}/${c.totalSeasons}s`)}</span>
                    </div>
                    <div style={{ color: '#aab6c0', fontSize: '0.76rem', fontFamily: 'ui-monospace, monospace' }}>{cargoText(c)}</div>
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
    </Modal>
  );
}
