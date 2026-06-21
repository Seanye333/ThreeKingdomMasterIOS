import { useMemo, useState } from 'react';
import { CIVIC_TITLES, CIVIC_TITLES_BY_ID, MILITARY_RANKS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Appointment, CivicTitleId, EntityId, MilitaryRankId, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import styles from './TitlesModal.module.css';
import { useDesc, useLanguage } from '../i18n';
import { Name } from './Name';
import { officerGrade, gradeRank, gradeMeta } from '../../game/systems/officerGrade';

function pickBestFit(
  officers: Officer[],
  stat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma',
  appointments: Appointment[],
): Officer | null {
  const heldIds = new Set(appointments.map((a) => a.officerId));
  let best: Officer | null = null;
  for (const o of officers) {
    if (heldIds.has(o.id)) continue;
    if (!best || o.stats[stat] > best.stats[stat]) best = o;
  }
  return best;
}

interface Props {
  onClose: () => void;
}

type Tab = 'civic' | 'military' | 'history';

export function TitlesModal({ onClose }: Props) {
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const appointments = useGameStore((s) => s.appointments);
  const appointmentHistory = useGameStore((s) => s.appointmentHistory);
  const appointTitle = useGameStore((s) => s.appointTitle);
  const revokeTitle = useGameStore((s) => s.revokeTitle);
  const promoteOfficer = useGameStore((s) => s.promoteOfficer);
  const currentYear = useGameStore((s) => s.date.year);
  const allForces = useGameStore((s) => s.forces);

  const [tab, setTab] = useState<Tab>('civic');
  const [pickingTitle, setPickingTitle] = useState<CivicTitleId | null>(null);
  const [prefectCityId, setPrefectCityId] = useState<EntityId | null>(null);

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

  const titleHolderAppts = useMemo(() => {
    // Same keying as titleHolders but stores the appointment row (for
    // tenure year display).
    const map: Record<string, Appointment> = {};
    for (const a of appointments) {
      if (a.forceId !== playerForceId) continue;
      const key = a.titleId === 'prefect' ? `prefect-${a.cityId}` : a.titleId;
      map[key] = a;
    }
    return map;
  }, [appointments, playerForceId]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>任官</div>}
            {lang !== 'zh' && <div className={styles.titleEn}>Titles &amp; Appointments</div>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className={styles.appointBtn}
              title={lang === 'en' ? 'Auto-appoint — fill vacant posts and max promotions with the best eligible officers' : '一鍵任官 — 以最佳適任武將補滿空缺並盡量晉升'}
              onClick={() => {
                let appointed = 0;
                let promoted = 0;
                // Fill vacant civic posts.
                for (const titleDef of CIVIC_TITLES) {
                  if (titleDef.id === 'prefect') {
                    for (const c of ownCities) {
                      if (titleHolders[`prefect-${c.id}`]) continue;
                      const best = pickBestFit(ownOfficers, titleDef.primaryStat, appointments);
                      if (!best) continue;
                      const r = appointTitle(best.id, 'prefect', c.id);
                      if (r.ok) appointed++;
                    }
                    continue;
                  }
                  if (titleHolders[titleDef.id]) continue;
                  const best = pickBestFit(ownOfficers, titleDef.primaryStat, appointments);
                  if (!best) continue;
                  if (best.stats[titleDef.primaryStat] < 60) continue;
                  const r = appointTitle(best.id, titleDef.id);
                  if (r.ok) appointed++;
                }
                // Max promotions.
                for (const o of ownOfficers) {
                  const curTier = MILITARY_RANKS.find((r) => r.id === o.rank)?.tier ?? 0;
                  const best = Math.max(o.stats.war, o.stats.leadership);
                  const top = [...MILITARY_RANKS]
                    .sort((a, b) => b.tier - a.tier)
                    .find((r) => r.tier > curTier && best >= r.minStat);
                  if (!top) continue;
                  const r = promoteOfficer(o.id, top.id);
                  if (r.ok) promoted++;
                }
                alert(lang === 'en' ? `Auto-appoint: appointed ${appointed}, promoted ${promoted}.` : `一鍵任官:已任 ${appointed}、晉 ${promoted}。`);
              }}
            >
              {lang === 'en' ? 'Auto-appoint' : '一鍵任官'}
            </button>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
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
          <button
            className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setTab('history')}
          >
            歷任 History
          </button>
        </div>

        <div className={styles.body}>
          {tab === 'civic' && (
            <CivicTab
              titleHolders={titleHolders}
              titleHolderAppts={titleHolderAppts}
              ownOfficers={ownOfficers}
              ownCities={ownCities}
              appointments={appointments}
              currentYear={currentYear}
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
          )}
          {tab === 'military' && (
            <MilitaryTab
              ownOfficers={ownOfficers}
              onPromote={(officerId, rankId) => {
                const r = promoteOfficer(officerId, rankId);
                if (!r.ok) alert(r.reason ?? 'Failed');
              }}
            />
          )}
          {tab === 'history' && (
            <HistoryTab
              history={appointmentHistory}
              officers={officers}
              forces={allForces}
              playerForceId={playerForceId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CivicTab({
  titleHolders,
  titleHolderAppts,
  ownOfficers,
  ownCities,
  appointments,
  currentYear,
  pickingTitle,
  setPickingTitle,
  prefectCityId,
  setPrefectCityId,
  onAppoint,
  onRevoke,
}: {
  titleHolders: Record<string, Officer>;
  titleHolderAppts: Record<string, Appointment>;
  ownOfficers: Officer[];
  ownCities: Array<{ id: EntityId; name: { en: string; zh: string } }>;
  appointments: Appointment[];
  currentYear: number;
  pickingTitle: CivicTitleId | null;
  setPickingTitle: (t: CivicTitleId | null) => void;
  prefectCityId: EntityId | null;
  setPrefectCityId: (c: EntityId | null) => void;
  onAppoint: (officerId: EntityId, titleId: CivicTitleId, cityId?: EntityId) => void;
  onRevoke: (officerId: EntityId) => void;
}) {
  const desc = useDesc();
  const lang = useLanguage();
  /** Sort ownOfficers by stat fit desc with recommendation flag for top fit. */
  const officersSortedFor = (stat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma'): Array<{ o: Officer; recommended: boolean }> => {
    const heldIds = new Set(appointments.map((a) => a.officerId));
    const sorted = [...ownOfficers]
      .filter((o) => !heldIds.has(o.id))
      .sort((a, b) => b.stats[stat] - a.stats[stat]);
    return sorted.map((o, i) => ({ o, recommended: i === 0 }));
  };
  const tenureLabel = (a: Appointment) => {
    const years = currentYear - a.appointedYear;
    return years <= 0
      ? `自 ${a.appointedYear}`
      : `自 ${a.appointedYear} (${years} 年)`;
  };
  return (
    <div className={styles.titleGrid}>
      {CIVIC_TITLES.map((t) => {
        if (t.id === 'prefect') {
          return (
            <div key={t.id} className={styles.titleCard}>
              <div className={styles.titleNameRow}>
                <div>
                  <span className={styles.titleName}><Name pair={t.name} /></span>
                </div>
                <span className={styles.officerStats}>{t.primaryStat.slice(0, 3).toUpperCase()}</span>
              </div>
              <div className={styles.titleDesc}>{desc(t)}</div>
              <div className={styles.pickerLabel}>{lang === 'en' ? 'Prefects of your cities' : '太守任命'}</div>
              {ownCities.map((c) => {
                const holder = titleHolders[`prefect-${c.id}`];
                const picking = pickingTitle === 'prefect' && prefectCityId === c.id;
                return (
                  <div key={c.id}>
                    <div className={styles.holderRow}>
                      <span className={styles.holder}>
                        <strong><Name pair={c.name} /></strong>
                        {' — '}
                        {holder ? (
                          <span>
                            <Name pair={holder.name} />
                            {titleHolderAppts[`prefect-${c.id}`] && (
                              <span className={styles.officerStats} style={{ marginLeft: '0.5rem' }}>
                                {tenureLabel(titleHolderAppts[`prefect-${c.id}`])}
                              </span>
                            )}
                          </span>
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
                        {officersSortedFor('politics').map(({ o, recommended }) => (
                          <button
                            key={o.id}
                            className={styles.officerOption}
                            onClick={() => onAppoint(o.id, 'prefect', c.id)}
                          >
                            <span>
                              {recommended && <span style={{ color: '#e6c473' }}>★ </span>}
                              <Name pair={o.name} />
                            </span>
                            <span className={styles.officerStats}>
                              <OfficerStats officer={o} keys={['politics', 'intelligence']} />
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
                <span className={styles.titleName}><Name pair={t.name} /></span>
                {t.minGrade && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.62rem', color: gradeMeta(t.minGrade).color, border: `1px solid ${gradeMeta(t.minGrade).color}`, borderRadius: 2, padding: '0 0.3rem' }}>
                    需{gradeMeta(t.minGrade).name.zh}
                  </span>
                )}
              </div>
              <span className={styles.officerStats}>{t.primaryStat.slice(0, 3).toUpperCase()}</span>
            </div>
            <div className={styles.titleDesc}>{desc(t)}</div>
            <div className={styles.holderRow}>
              <span className={styles.holder}>
                {holder ? (
                  <>
                    <Name pair={holder.name} />
                    {titleHolderAppts[t.id] && (
                      <span className={styles.officerStats} style={{ marginLeft: '0.5rem' }}>
                        {tenureLabel(titleHolderAppts[t.id])}
                      </span>
                    )}
                  </>
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
                {officersSortedFor(t.primaryStat).map(({ o, recommended }) => {
                  const g = officerGrade(o);
                  const meets = !t.minGrade || gradeRank(g.grade) >= gradeRank(t.minGrade);
                  return (
                    <button
                      key={o.id}
                      className={styles.officerOption}
                      disabled={!meets}
                      title={meets ? undefined : `品階不足：需${gradeMeta(t.minGrade!).name.zh}以上（現為${g.name.zh}）`}
                      style={meets ? undefined : { opacity: 0.45, cursor: 'not-allowed' }}
                      onClick={() => meets && onAppoint(o.id, t.id)}
                    >
                      <span>
                        {recommended && meets && <span style={{ color: '#e6c473' }}>★ </span>}
                        <Name pair={o.name} />
                        <span style={{ marginLeft: '0.35rem', fontSize: '0.62rem', color: g.color }}>{g.name.zh}</span>
                      </span>
                      <span className={styles.officerStats}>
                        {t.primaryStat.slice(0, 3).toUpperCase()} {o.stats[t.primaryStat]}
                      </span>
                    </button>
                  );
                })}
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

  const lang = useLanguage();
  return (
    <div>
      <div className={styles.pickerLabel}>{lang === 'en' ? 'Select officer' : '選擇武將'}</div>
      <div className={styles.picker} style={{ marginBottom: '1rem' }}>
        {ownOfficers.map((o) => (
          <button
            key={o.id}
            className={styles.officerOption}
            onClick={() => setSelectedId(o.id === selectedId ? null : o.id)}
            style={o.id === selectedId ? { borderColor: '#e6c473', background: '#1b2531' } : undefined}
          >
            <span>
              <Name pair={o.name} /> — <span className={styles.rankName}>{o.rank}</span>
            </span>
            <span className={styles.officerStats}>
              <OfficerStats officer={o} keys={['war', 'leadership']} />
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <div>
          <div className={styles.pickerLabel}>
            {lang === 'en' ? 'Promote ' : '冊封 '}<Name pair={selected.name} />
          </div>
          {MILITARY_RANKS.map((r) => {
            const eligible =
              Math.max(selected.stats.war, selected.stats.leadership) >= r.minStat;
            const current = selected.rank === r.id;
            return (
              <div key={r.id} className={styles.rankRow}>
                <div>
                  <span className={styles.rankName}><Name pair={r.name} /></span>
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
        <div className={styles.empty}>{lang === 'en' ? 'Pick an officer to promote.' : '選一名武將授銜。'}</div>
      )}
    </div>
  );
}

function HistoryTab({
  history,
  officers,
  forces,
  playerForceId,
}: {
  history: import('../../game/types').AppointmentHistoryEntry[];
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, { id: EntityId; name: { en: string; zh: string } }>;
  playerForceId: EntityId | null;
}) {
  const [filter, setFilter] = useState<'mine' | 'all'>('mine');
  const rows = useMemo(() => {
    const filtered = filter === 'mine'
      ? history.filter((h) => h.forceId === playerForceId)
      : history;
    return [...filtered].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const order = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
      return order[b.season] - order[a.season];
    });
  }, [history, filter, playerForceId]);
  const SEASON_ZH = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' } as const;
  const REASON_ZH: Record<NonNullable<import('../../game/types').AppointmentHistoryEntry['reason']>, string> = {
    'dead': '薨', 'imprisoned': '被擒', 'defected': '叛去',
    'lost-city': '失城', 'missing': '不知所終', 'replaced': '罷免',
    'manual': '罷免',
  };
  const lang = useLanguage();
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          className={`${styles.tab} ${filter === 'mine' ? styles.tabActive : ''}`}
          onClick={() => setFilter('mine')}
        >{lang === 'en' ? 'Mine' : '我軍'}</button>
        <button
          className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`}
          onClick={() => setFilter('all')}
        >{lang === 'en' ? 'All' : '全部'}</button>
      </div>
      {rows.length === 0 ? (
        <div className={styles.empty}>{lang === 'en' ? 'No appointment records yet.' : '尚無任官紀錄。'}</div>
      ) : (
        <div>
          {rows.map((h, i) => {
            const o = officers[h.officerId];
            const f = forces[h.forceId];
            const def = CIVIC_TITLES_BY_ID[h.titleId];
            if (!o || !def) return null;
            const yearLabel = `${h.year} 年${SEASON_ZH[h.season]}`;
            return (
              <div key={i} className={styles.holderRow}
                style={{ borderBottom: '1px solid #1b2531', padding: '0.35rem 0' }}>
                <span className={styles.holder}>
                  <span className={styles.officerStats} style={{ marginRight: '0.6rem' }}>{yearLabel}</span>
                  {filter === 'all' && f && (
                    <span style={{ marginRight: '0.5rem' }}>
                      {f.name.zh}
                    </span>
                  )}
                  {h.kind === 'appoint' ? '拜' : '罷'}{' '}
                  <strong><Name pair={o.name} /></strong>
                  {' 為 '}
                  <span style={{ color: '#e6c473' }}>{def.name.zh}</span>
                  {h.reason && h.kind === 'revoke' && (
                    <span className={styles.officerStats} style={{ marginLeft: '0.5rem' }}>
                      ({REASON_ZH[h.reason]})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
