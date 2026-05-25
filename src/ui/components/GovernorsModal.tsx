import { useMemo, useState } from 'react';
import { PROVINCES } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Officer } from '../../game/types';
import { useT, useLanguage, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

/**
 * Province-governor (州牧) appointment modal — RTK14-style.
 * Lists each province the player controls (any city in it is yours) and
 * lets you appoint one of your idle officers as its governor.
 */
export function GovernorsModal({ onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const provinceGovernors = useGameStore((s) => s.provinceGovernors);
  const appointGovernor = useGameStore((s) => s.appointGovernor);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  const [pickerForProvince, setPickerForProvince] = useState<string | null>(null);

  // Provinces where player owns at least one city.
  const playerProvinces = useMemo(() => {
    if (!playerForceId) return [];
    return PROVINCES.filter((p) =>
      p.cityIds.some((cid) => cities[cid]?.ownerForceId === playerForceId),
    );
  }, [playerForceId, cities]);

  const idleOfficers = useMemo<Officer[]>(() => {
    if (!playerForceId) return [];
    return Object.values(officers).filter(
      (o) => o.forceId === playerForceId && o.status === 'idle' && !o.task,
    );
  }, [officers, playerForceId]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'grid', placeItems: 'center',
        zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '1px solid #5a4530',
          width: 'min(880px,100%)',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #4a3520', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.3rem' }}>州牧</div>
            <div style={{ fontSize: '0.8rem', color: '#8a7050', fontStyle: 'italic' }}>
              Provincial Governors · appoint trusted officers to oversee a province
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {playerProvinces.length === 0 ? (
            <div style={{ color: '#8a7050', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
              You hold no provinces yet. Conquer some cities first.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
              {playerProvinces.map((p) => {
                const ownedCount = p.cityIds.filter((cid) => cities[cid]?.ownerForceId === playerForceId).length;
                const govId = provinceGovernors[p.id as keyof typeof provinceGovernors];
                const governor = govId ? officers[govId] : null;
                return (
                  <li key={p.id} style={{ background: '#1a1410', border: `1px solid ${p.color}`, padding: '0.7rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '1rem', color: p.color, letterSpacing: '0.2rem' }}>{lang === 'en' ? p.name.en : p.name.zh}</span>
                        {lang === 'both' && <span style={{ fontSize: '0.72rem', color: '#8a7050', fontStyle: 'italic', marginLeft: '0.6rem' }}>{p.name.en}</span>}
                        <span style={{ fontSize: '0.7rem', color: '#c0a878', marginLeft: '0.6rem' }}>
                          ({ownedCount} / {p.cityIds.length} cities held)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {governor ? (
                          <span style={{ fontSize: '0.85rem', color: '#d4a84a' }}>
                            {governor.name.zh}{' '}
                            <span style={{ fontSize: '0.65rem', color: '#8a7050', fontStyle: 'italic' }}>{governor.name.en}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#5a4530', fontStyle: 'italic' }}>未任命 unassigned</span>
                        )}
                        <button
                          onClick={() => setPickerForProvince(pickerForProvince === p.id ? null : p.id)}
                          style={{
                            background: 'transparent', border: '1px solid #4a3520',
                            color: '#d4a84a', padding: '0.25rem 0.6rem',
                            fontFamily: 'inherit', fontSize: '0.7rem', cursor: 'pointer',
                          }}
                        >
                          {pickerForProvince === p.id ? t('取消', 'Cancel') : (governor ? t('改任', 'Reassign') : t('任命', 'Appoint'))}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#8a7050', margin: '0.4rem 0 0 0', lineHeight: 1.5 }}>
                      {desc(p)}
                    </p>
                    {pickerForProvince === p.id && (
                      <div style={{ marginTop: '0.6rem', padding: '0.6rem', background: '#2a1f15', border: '1px solid #4a3520' }}>
                        <div style={{ fontSize: '0.7rem', color: '#8a7050', marginBottom: '0.4rem', letterSpacing: '0.1rem' }}>
                          {t('閒置武將', 'Idle officers')} ({idleOfficers.length}):
                        </div>
                        {idleOfficers.length === 0 ? (
                          <div style={{ fontSize: '0.78rem', color: '#5a4530', fontStyle: 'italic' }}>
                            {t('無閒置武將——請先從城內職務召回。', 'No idle officers — recall some from city duties first.')}
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.3rem' }}>
                            {idleOfficers
                              .sort((a, b) => (b.stats.politics + b.stats.intelligence) - (a.stats.politics + a.stats.intelligence))
                              .map((o) => (
                                <button
                                  key={o.id}
                                  onClick={() => {
                                    appointGovernor(p.id, o.id);
                                    setPickerForProvince(null);
                                  }}
                                  style={{
                                    background: '#1a1410', border: '1px solid #3a2d20',
                                    color: '#c0a878', padding: '0.3rem 0.5rem',
                                    fontFamily: 'inherit', fontSize: '0.75rem',
                                    cursor: 'pointer', textAlign: 'left',
                                  }}
                                >
                                  <div style={{ color: '#d4a84a' }}>
                                    {o.name.zh} <span style={{ fontSize: '0.65rem', color: '#8a7050' }}>{o.name.en}</span>
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#8a7050', fontFamily: 'ui-monospace, monospace' }}>
                                    政 {o.stats.politics} · 知 {o.stats.intelligence} · 魅 {o.stats.charisma}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
