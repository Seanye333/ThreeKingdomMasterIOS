import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';
import { RaidDispatchModal } from './RaidDispatchModal';

/**
 * 輜重一覽 — every supply convoy in transit: where from, where to, what it
 * carries and how many seasons until it arrives. Recall any of them and the
 * cargo turns around for its origin city. Spotted enemy supply columns are
 * listed below, each with the chance to send a raiding party after it (劫糧道).
 */
export function ConvoyModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const convoys = useGameStore((s) => s.convoys);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const recallConvoy = useGameStore((s) => s.recallConvoy);
  const spottedFn = useGameStore((s) => s.spottedEnemyConvoys);
  const [raidTarget, setRaidTarget] = useState<{ convoyId: string; fromCityId: string } | null>(null);

  const rows = useMemo(
    () => Object.values(convoys)
      .filter((c) => c.forceId === playerForceId)
      .sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [convoys, playerForceId],
  );

  // 敵糧道 — enemy columns our territory can run down (recomputed as they move).
  const spotted = useMemo(() => spottedFn(), [spottedFn, convoys, cities]);

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
                      {c.toArmyId && <span style={{ color: '#d8a85a', fontSize: '0.72rem' }}> {t('⚔前軍', '⚔front')}</span>}
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

        {/* 敵糧道 — spotted enemy supply columns we can raid (劫糧道). */}
        {spotted.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ color: '#e0a070', fontSize: '0.76rem', letterSpacing: '0.08rem', marginBottom: 6, borderTop: '1px solid #243240', paddingTop: '0.7rem' }}>
              {t('敵糧道 · 可截劫', 'Enemy supply lines · raidable')} ({spotted.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {spotted.map(({ convoy: c, fromCityId }) => {
                const enemy = forces[c.forceId]?.name;
                const from = cities[c.fromCityId];
                const to = cities[c.toCityId];
                const launch = cities[fromCityId];
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#1c1614', border: '1px solid #3a2a24', borderRadius: 5 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f0d2c4', fontSize: '0.84rem' }}>
                        {(lang === 'en' ? enemy?.en : enemy?.zh) ?? '?'} · {from?.name.zh ?? '?'} <span style={{ color: '#7a8893' }}>→</span> {to?.name.zh ?? '?'}
                      </div>
                      <div style={{ color: '#b0a098', fontSize: '0.74rem', fontFamily: 'ui-monospace, monospace' }}>
                        {[c.food > 0 ? `糧${c.food.toLocaleString()}` : '', c.gold > 0 ? `金${c.gold.toLocaleString()}` : '', `護${c.troops.toLocaleString()}`].filter(Boolean).join(' · ')}
                        <span style={{ color: '#7a8893' }}> · {t(`自 ${launch?.name.zh ?? ''} 出擊`, `from ${launch?.name.en ?? ''}`)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setRaidTarget({ convoyId: c.id, fromCityId })}
                      title={t('遣輕騎截劫此糧道', 'Send a raiding column after this convoy')}
                      style={{ background: 'rgba(184,68,46,0.22)', border: '1px solid #b8442e', color: '#f0b9a4', padding: '0.2rem 0.6rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', whiteSpace: 'nowrap' }}
                    >🐎 {t('劫', 'Raid')}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {raidTarget && (
          <RaidDispatchModal targetConvoyId={raidTarget.convoyId} fromCityId={raidTarget.fromCityId} onClose={() => setRaidTarget(null)} />
        )}
    </Modal>
  );
}
