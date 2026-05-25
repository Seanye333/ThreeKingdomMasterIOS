import { useMemo, useState } from 'react';
import { CIVIC_TITLES, MILITARY_RANKS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { CivicTitleId, EntityId, MilitaryRankId, Officer } from '../../game/types';
import styles from './TitlesModal.module.css';
import { useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type Tab = 'civic' | 'military';

export function TitlesModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const appointments = useGameStore((s) => s.appointments);
  const appointTitle = useGameStore((s) => s.appointTitle);
  const revokeTitle = useGameStore((s) => s.revokeTitle);
  const promoteOfficer = useGameStore((s) => s.promoteOfficer);

  const [tab, setTab] = useState<Tab>('civic');
  const [pickingTitle, setPickingTitle] = useState<CivicTitleId | null>(null);
  const [prefectCityId, setPrefectCityId] = useState<EntityId | null>(null);
  const desc = useDesc();

  const ownOfficers = useMemo(
    () =>
      Object.values(officers)
        .filter(
          (o) =>
            o.forceId === playerForceId &&
            o.status !== 'dead' &&
            o.status !== 'imprisoned',
        )
        .sort(
          (a, b) =>
            b.stats.politics + b.stats.intelligence -
            (a.stats.politics + a.stats.intelligence),
        ),
    [officers, playerForceId],
  );

  const ownCities = useMemo(
    () =>
      Object.values(cities).filter((c) => c.ownerForceId === playerForceId),
    [cities, playerForceId],
  );

  const titleHolders = useMemo(() => {
    // Map (titleId, optional cityId) → officer
    const map: Record<string, Officer> = {};
    for (const a of appointments) {
      if (a.forceId !== playerForceId) continue;
      const key = a.titleId === 'prefect' ? `prefect-${a.cityId}` : a.titleId;
      const o = officers[a.officerId];
      if (o) map[key] = o;
    }
    return map;
  }, [appointments, officers, playerForceId]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>任官</div>
            <div className={styles.titleEn}>Titles &amp; Appointments</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'civic' ? styles.tabActive : ''}`}
            onClick={() => setTab('civic')}
          >
            文官 Civic Posts
          </button>
          <button
            className={`${styles.tab} ${tab === 'military' ? styles.tabActive : ''}`}
            onClick={() => setTab('military')}
          >
            武官 Military Ranks
          </button>
        </div>

        <div className={styles.body}>
          {tab === 'civic' ? (
            <CivicTab
              titleHolders={titleHolders}
              ownOfficers={ownOfficers}
              ownCities={ownCities}
              pickingTitle={pickingTitle}
              setPickingTitle={setPickingTitle}
              prefectCityId={prefectCityId}
              setPrefectCityId={setPrefectCityId}
              onAppoint={(officerId, titleId, cityId) => {
                const r = appointTitle(officerId, titleId, cityId);
                if (r.ok) {
                  setPickingTitle(null);
                  setPrefectCityId(null);
                } else {
                  alert(r.reason ?? 'Failed');
                }
              }}
              onRevoke={(officerId) => revokeTitle(officerId)}
            />
          ) : (
            <MilitaryTab
              ownOfficers={ownOfficers}
              onPromote={(officerId, rankId) => {
                const r = promoteOfficer(officerId, rankId);
                if (!r.ok) alert(r.reason ?? 'Failed');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CivicTab({
  titleHolders,
  ownOfficers,
  ownCities,
  pickingTitle,
  setPickingTitle,
  prefectCityId,
  setPrefectCityId,
  onAppoint,
  onRevoke,
}: {
  titleHolders: Record<string, Officer>;
  ownOfficers: Officer[];
  ownCities: Array<{ id: EntityId; name: { en: string; zh: string } }>;
  pickingTitle: CivicTitleId | null;
  setPickingTitle: (t: CivicTitleId | null) => void;
  prefectCityId: EntityId | null;
  setPrefectCityId: (c: EntityId | null) => void;
  onAppoint: (officerId: EntityId, titleId: CivicTitleId, cityId?: EntityId) => void;
  onRevoke: (officerId: EntityId) => void;
}) {
  return (
    <div className={styles.titleGrid}>
      {CIVIC_TITLES.map((t) => {
        if (t.id === 'prefect') {
          return (
            <div key={t.id} className={styles.titleCard}>
              <div className={styles.titleNameRow}>
                <div>
                  <span className={styles.titleName}>{t.name.zh}</span>
                  <span className={styles.titleNameEn}> {t.name.en}</span>
                </div>
                <span className={styles.officerStats}>{t.primaryStat.slice(0, 3).toUpperCase()}</span>
              </div>
              <div className={styles.titleDesc}>{desc(t)}</div>
              <div className={styles.pickerLabel}>Prefects of your cities</div>
              {ownCities.map((c) => {
                const holder = titleHolders[`prefect-${c.id}`];
                const picking = pickingTitle === 'prefect' && prefectCityId === c.id;
                return (
                  <div key={c.id}>
                    <div className={styles.holderRow}>
                      <span className={styles.holder}>
                        <strong>{c.name.zh}</strong>{' '}
                        <span className={styles.officerStats}>{c.name.en}</span>
                        {' — '}
                        {holder ? (
                          <span>{holder.name.zh} {holder.name.en}</span>
                        ) : (
                          <span className={styles.holderNone}>(vacant)</span>
                        )}
                      </span>
                      <span>
                        {holder ? (
                          <button
                            className={styles.revokeBtn}
                            onClick={() => onRevoke(holder.id)}
                          >Revoke</button>
                        ) : (
                          <button
                            className={styles.appointBtn}
                            onClick={() => {
                              setPickingTitle('prefect');
                              setPrefectCityId(c.id);
                            }}
                          >Appoint</button>
                        )}
                      </span>
                    </div>
                    {picking && (
                      <div className={styles.picker}>
                        <div className={styles.pickerLabel}>Choose officer</div>
                        {ownOfficers.map((o) => (
                          <button
                            key={o.id}
                            className={styles.officerOption}
                            onClick={() => onAppoint(o.id, 'prefect', c.id)}
                          >
                            <span>{o.name.zh} {o.name.en}</span>
                            <span className={styles.officerStats}>
                              POL {o.stats.politics} · INT {o.stats.intelligence}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {ownCities.length === 0 && (
                <div className={styles.muted}>No cities held.</div>
              )}
            </div>
          );
        }
        const holder = titleHolders[t.id];
        const picking = pickingTitle === t.id;
        return (
          <div key={t.id} className={styles.titleCard}>
            <div className={styles.titleNameRow}>
              <div>
                <span className={styles.titleName}>{t.name.zh}</span>
                <span className={styles.titleNameEn}> {t.name.en}</span>
              </div>
              <span className={styles.officerStats}>{t.primaryStat.slice(0, 3).toUpperCase()}</span>
            </div>
            <div className={styles.titleDesc}>{desc(t)}</div>
            <div className={styles.holderRow}>
              <span className={styles.holder}>
                {holder ? (
                  <>{holder.name.zh} <span className={styles.officerStats}>{holder.name.en}</span></>
                ) : (
                  <span className={styles.holderNone}>(vacant)</span>
                )}
              </span>
              {holder ? (
                <button className={styles.revokeBtn} onClick={() => onRevoke(holder.id)}>
                  Revoke
                </button>
              ) : (
                <button
                  className={styles.appointBtn}
                  onClick={() => setPickingTitle(picking ? null : t.id)}
                >Appoint</button>
              )}
            </div>
            {picking && !holder && (
              <div className={styles.picker}>
                <div className={styles.pickerLabel}>Choose officer</div>
                {ownOfficers.map((o) => (
                  <button
                    key={o.id}
                    className={styles.officerOption}
                    onClick={() => onAppoint(o.id, t.id)}
                  >
                    <span>{o.name.zh} {o.name.en}</span>
                    <span className={styles.officerStats}>
                      {t.primaryStat.slice(0, 3).toUpperCase()} {o.stats[t.primaryStat]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MilitaryTab({
  ownOfficers,
  onPromote,
}: {
  ownOfficers: Officer[];
  onPromote: (officerId: EntityId, rankId: MilitaryRankId) => void;
}) {
  const [selectedId, setSelectedId] = useState<EntityId | null>(null);
  const selected = selectedId ? ownOfficers.find((o) => o.id === selectedId) : null;

  return (
    <div>
      <div className={styles.pickerLabel}>Select officer</div>
      <div className={styles.picker} style={{ marginBottom: '1rem' }}>
        {ownOfficers.map((o) => (
          <button
            key={o.id}
            className={styles.officerOption}
            onClick={() => setSelectedId(o.id === selectedId ? null : o.id)}
            style={o.id === selectedId ? { borderColor: '#d4a84a', background: '#2a1f15' } : undefined}
          >
            <span>
              {o.name.zh} {o.name.en} — <span className={styles.rankName}>{o.rank}</span>
            </span>
            <span className={styles.officerStats}>
              W{o.stats.war} L{o.stats.leadership}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <div>
          <div className={styles.pickerLabel}>
            Promote {selected.name.zh} {selected.name.en} (W{selected.stats.war} L{selected.stats.leadership})
          </div>
          {MILITARY_RANKS.map((r) => {
            const eligible =
              Math.max(selected.stats.war, selected.stats.leadership) >= r.minStat;
            const current = selected.rank === r.id;
            return (
              <div key={r.id} className={styles.rankRow}>
                <div>
                  <span className={styles.rankName}>{r.name.zh}</span>
                  <span className={styles.rankNameEn}>{r.name.en}</span>
                </div>
                <div className={styles.rankReq}>
                  req W/L ≥ {r.minStat}
                </div>
                <div className={styles.rankStipend}>{r.stipend}g/season</div>
                <div className={styles.rankCap}>×{r.troopCapMultiplier} troops</div>
                <div className={styles.rankAction}>
                  {current ? (
                    <span className={styles.muted}>current</span>
                  ) : eligible ? (
                    <button
                      className={styles.appointBtn}
                      onClick={() => onPromote(selected.id, r.id)}
                    >Promote</button>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!selected && (
        <div className={styles.empty}>Pick an officer to promote.</div>
      )}
    </div>
  );
}
