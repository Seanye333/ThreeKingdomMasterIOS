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
  const spottedColumnsFn = useGameStore((s) => s.spottedEnemyColumns);
  const interceptColumn = useGameStore((s) => s.interceptColumn);
  const officers = useGameStore((s) => s.officers);
  const [raidTarget, setRaidTarget] = useState<{ convoyId: string; fromCityId: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rows = useMemo(
    () => Object.values(convoys)
      .filter((c) => c.forceId === playerForceId)
      .sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [convoys, playerForceId],
  );

  // 敵糧道 — enemy columns our territory can run down (recomputed as they move).
  const spotted = useMemo(() => spottedFn(), [spottedFn, convoys, cities]);
  // 敵軍縱隊 — spotted enemy field columns we can sortie out to intercept (邀擊).
  const spottedColumns = useMemo(() => spottedColumnsFn(), [spottedColumnsFn, cities]);

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
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#141c25', border: '1px solid #243240', borderRadius: 'var(--tkm-radius-sm)' }}>
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
                    style={{ background: 'rgba(184,68,46,0.16)', border: '1px solid #b8442e', color: '#e8a890', padding: '0.2rem 0.55rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
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
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#1c1614', border: '1px solid #3a2a24', borderRadius: 'var(--tkm-radius-sm)' }}>
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
                      style={{ background: 'rgba(184,68,46,0.22)', border: '1px solid #b8442e', color: '#f0b9a4', padding: '0.2rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', whiteSpace: 'nowrap' }}
                    >🐎 {t('劫', 'Raid')}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 敵軍縱隊 — spotted enemy field columns; sortie a captain to run them down. */}
        {spottedColumns.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ color: '#d88', fontSize: '0.76rem', letterSpacing: '0.08rem', marginBottom: 6, borderTop: '1px solid #243240', paddingTop: '0.7rem' }}>
              {t('敵軍縱隊 · 可邀擊', 'Enemy columns · interceptable')} ({spottedColumns.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {spottedColumns.map((col) => {
                const launch = cities[col.fromCityId];
                // 邀擊 — sortie the launch city's strongest idle officer with ~60% of its garrison.
                const captain = Object.values(officers)
                  .filter((o) => o.forceId === playerForceId && o.locationCityId === col.fromCityId && (o.status === 'idle' || o.status === 'active') && !o.task)
                  .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4))[0];
                const send = launch ? Math.floor((launch.troops - 100) * 0.6) : 0;
                const can = !!captain && send >= 1 && (launch?.gold ?? 0) >= 100;
                return (
                  <div key={col.armyId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.7rem', background: '#1c1614', border: '1px solid #3a2a24', borderRadius: 'var(--tkm-radius-sm)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#f0d2c4', fontSize: '0.84rem' }}>{lang === 'en' ? col.commanderName.en : col.commanderName.zh} · {col.troops.toLocaleString()}{t('兵', 't')}</div>
                      <div style={{ color: '#b0a098', fontSize: '0.74rem' }}>
                        {can ? t(`自 ${launch?.name.zh ?? ''} 遣 ${captain!.name.zh} 領 ${send.toLocaleString()} 邀擊（費100金·急行）`, `from ${launch?.name.en ?? ''}: ${captain!.name.en} leads ${send.toLocaleString()} (100g, forced)`)
                          : t(`自 ${launch?.name.zh ?? ''} — 無閒將或兵金不足`, `from ${launch?.name.en ?? ''} — no captain / not enough troops or gold`)}
                      </div>
                    </div>
                    <button
                      disabled={!can}
                      onClick={() => {
                        const r = interceptColumn(col.armyId, col.fromCityId, captain!.id, send);
                        setFeedback(r.ok ? t('已遣軍邀擊 — 將於途中接戰', 'Column dispatched — it clashes on the road') : t('邀擊未成', 'Could not intercept'));
                      }}
                      title={t('遣將出城截擊此敵軍縱隊(急行軍,途中接戰)', 'Sortie a captain to run down this column (forced march; clashes en route)')}
                      style={{ background: can ? 'rgba(184,68,46,0.22)' : '#1e2832', border: `1px solid ${can ? '#b8442e' : '#2b3845'}`, color: can ? '#f0b9a4' : '#5f6c76', padding: '0.2rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)', cursor: can ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: '0.76rem', whiteSpace: 'nowrap' }}
                    >⚔ {t('邀擊', 'Intercept')}</button>
                  </div>
                );
              })}
            </div>
            {feedback && <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#9ed68a' }}>{feedback}</div>}
          </div>
        )}

        {raidTarget && (
          <RaidDispatchModal targetConvoyId={raidTarget.convoyId} fromCityId={raidTarget.fromCityId} onClose={() => setRaidTarget(null)} />
        )}
    </Modal>
  );
}
