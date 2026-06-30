import { useMemo, useState } from 'react';
import { CIVIC_TITLES, CIVIC_TITLES_BY_ID, MILITARY_RANKS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Appointment, CivicTitleId, EntityId, MilitaryRankId, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import styles from './TitlesModal.module.css';
import { useDesc, useLanguage } from '../i18n';
import { Name } from './Name';
import { officerGrade, gradeRank, gradeMeta } from '../../game/systems/officerGrade';
import { PEERAGES, peerageById, peerageTier, meritScore } from '../../game/data/peerage';
import { STATECRAFT, statecraftById, STATECRAFT_DECREE_THRESHOLD } from '../../game/data/statecraft';
import { DYNASTY_TITLES, ERA_NAMES } from '../../game/data/foundingNames';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { HONORIFICS, honorificById, honorificTier, HONORIFIC_THEME_ZH, bestFitHonorific, honorificThemeFit } from '../../game/data/honorifics';
import { CLANS } from '../../game/data/clans';
import { clanScions, clanCohesion, clanDefectionChance } from '../../game/systems/clans';

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

type Tab = 'civic' | 'military' | 'peerage' | 'honorific' | 'history';

export function TitlesModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const appointments = useGameStore((s) => s.appointments);
  const appointmentHistory = useGameStore((s) => s.appointmentHistory);
  const appointTitle = useGameStore((s) => s.appointTitle);
  const revokeTitle = useGameStore((s) => s.revokeTitle);
  const promoteOfficer = useGameStore((s) => s.promoteOfficer);
  const grantPeerage = useGameStore((s) => s.grantPeerage);
  const revokePeerage = useGameStore((s) => s.revokePeerage);
  const grantHonorific = useGameStore((s) => s.grantHonorific);
  const revokeHonorific = useGameStore((s) => s.revokeHonorific);
  const setRecruitmentStance = useGameStore((s) => s.setRecruitmentStance);
  const setStatecraft = useGameStore((s) => s.setStatecraft);
  const enactStatecraftDecree = useGameStore((s) => s.enactStatecraftDecree);
  const clanBonds = useGameStore((s) => s.clanBonds);
  const clanLevies = useGameStore((s) => s.clanLevies);
  const cultivateClan = useGameStore((s) => s.cultivateClan);
  const subvertClan = useGameStore((s) => s.subvertClan);
  const [showClans, setShowClans] = useState(false);
  const holdFoundingCeremony = useGameStore((s) => s.holdFoundingCeremony);
  const deeds = useGameStore((s) => s.deeds);
  const playerForce = useGameStore((s) => (s.playerForceId ? s.forces[s.playerForceId] : undefined));
  const stance = playerForce?.recruitmentStance ?? 'balanced';
  const statecraft = playerForce?.statecraft ?? null;
  const currentYear = useGameStore((s) => s.date.year);
  const allForces = useGameStore((s) => s.forces);
  const sovereign = playerForce?.imperialRank === 'king' || playerForce?.imperialRank === 'emperor';

  const [tab, setTab] = useState<Tab>('civic');
  const [pickingTitle, setPickingTitle] = useState<CivicTitleId | null>(null);
  const [prefectCityId, setPrefectCityId] = useState<EntityId | null>(null);
  const founded = playerForce?.foundingYear !== undefined;
  const canFound = sovereign && !founded;
  const [showCeremony, setShowCeremony] = useState(false);
  const [dynastyTitle, setDynastyTitle] = useState(DYNASTY_TITLES[0].zh);
  const [eraName, setEraName] = useState(ERA_NAMES[0].zh);

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
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', padding: '0 1rem 0.4rem', flexWrap: 'wrap' }}>
          <span className={styles.officerStats}>{lang === 'en' ? 'Talent policy 門第政策:' : '門第政策:'}</span>
          {([
            ['aristocratic', '重門第', 'Aristocratic'],
            ['balanced', '並用', 'Balanced'],
            ['meritocratic', '唯才是舉', 'Meritocratic'],
          ] as const).map(([id, zh, en]) => (
            <button
              key={id}
              className={`${styles.tab} ${stance === id ? styles.tabActive : ''}`}
              title={
                id === 'aristocratic'
                  ? (lang === 'en' ? 'Lean on the great clans: recruit bonus + clan loyalty, but commoners chafe and clans grow over-mighty.' : '倚重世族:招攬加成、世族忠誠↑,但寒門離心、門閥易坐大。')
                  : id === 'meritocratic'
                  ? (lang === 'en' ? 'Promote by ability: commoners thrive, clans grow disaffected.' : '唯才是舉:寒門奮起忠誠↑,世族心懷怨望。')
                  : (lang === 'en' ? 'Neutral middle road.' : '世族寒門並用,無偏。')
              }
              onClick={() => setRecruitmentStance(id)}
            >
              {lang === 'en' ? en : zh}
            </button>
          ))}
          <button
            className={`${styles.tab} ${showClans ? styles.tabActive : ''}`}
            style={{ marginLeft: 'auto' }}
            title={lang === 'en' ? 'Manage the great clans: bind by marriage, raise their levies, subvert a rival\'s house.' : '經營門閥世族:聯姻厚結、坐收部曲、策反敵族。'}
            onClick={() => setShowClans((v) => !v)}
          >
            {lang === 'en' ? '🏛 Great Clans' : '🏛 世族經營'}
          </button>
        </div>
        {showClans && (
          <div style={{ padding: '0 1rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '13rem', overflowY: 'auto' }}>
            {CLANS.map((clan) => {
              const mine = playerForceId ? clanScions(officers, playerForceId, clan.id) : [];
              const rivalScions = Object.values(officers).filter((o) => clan.members.includes(o.id) && o.forceId != null && o.forceId !== playerForceId && o.status !== 'dead' && o.status !== 'imprisoned');
              if (mine.length === 0 && rivalScions.length === 0) return null;
              const bound = playerForceId ? clanBonds?.[clan.id] === playerForceId : false;
              const avg = Math.round(clanCohesion(mine));
              const levy = clanLevies?.[clan.id]?.troops ?? 0;
              const defRisk = clanDefectionChance(mine, bound) > 0;
              return (
                <div key={clan.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', borderBottom: '1px solid #1c2530', paddingBottom: '0.25rem', flexWrap: 'wrap' }}>
                  <span style={{ minWidth: '5.5rem', color: '#cdd8e0' }}>{bound ? '★ ' : ''}{lang === 'en' ? clan.name.en : clan.name.zh}<span style={{ color: '#5d6b76' }}> · {lang === 'en' ? clan.seat.en : clan.seat.zh}</span></span>
                  {mine.length > 0 && (
                    <span style={{ color: avg >= 55 ? '#9ad6a8' : avg >= 35 ? '#e6c473' : '#e0707a' }}>
                      {lang === 'en' ? `serving ${mine.length} · loy ${avg}` : `仕你 ${mine.length} 人 · 忠 ${avg}`}
                    </span>
                  )}
                  {levy > 0 && <span style={{ color: '#9fb2c0' }}>{lang === 'en' ? `部曲 ${levy.toLocaleString()}` : `部曲 ${levy.toLocaleString()}`}</span>}
                  {defRisk && <span style={{ color: '#e0707a' }}>{lang === 'en' ? '⚠ defection risk' : '⚠ 叛附之虞'}</span>}
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                    {mine.length > 0 && !bound && (
                      <button className={styles.tab} onClick={() => { const r = cultivateClan(clan.id); if (!r.ok && r.reason) alert(r.reason); }}>
                        {lang === 'en' ? 'Marry (聯姻)' : '聯姻厚結'}
                      </button>
                    )}
                    {bound && <span style={{ color: '#caa53d' }}>{lang === 'en' ? 'bound' : '已聯姻'}</span>}
                    {rivalScions.length > 0 && (
                      <button className={styles.tab} onClick={() => { const r = subvertClan(clan.id); if (!r.ok && r.reason) alert(r.reason); }}>
                        {lang === 'en' ? `Subvert (${rivalScions.length})` : `策反 (${rivalScions.length})`}
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
            <div style={{ fontSize: '0.64rem', color: '#5d6b76', lineHeight: 1.5 }}>
              {lang === 'en'
                ? '聯姻 binds a serving clan: +loyalty, a loyalty floor, and no usurpation. Content clans field 部曲 retainers at their seat; aggrieved ones defect. 策反 turns a rival\'s whole house.'
                : '聯姻厚結:提忠誠、守忠誠底線、不再簒奪。滿意之族為你屯部曲私兵;懷怨之族則舉族叛附。策反可奪敵國一整族。'}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', padding: '0 1rem 0.5rem', flexWrap: 'wrap' }}>
          <span className={styles.officerStats}>{lang === 'en' ? 'Statecraft 治國理念:' : '治國理念:'}</span>
          <button
            className={`${styles.tab} ${statecraft === null ? styles.tabActive : ''}`}
            onClick={() => setStatecraft(null)}
            title={lang === 'en' ? 'No slant.' : '雜糅,無偏。'}
          >
            {lang === 'en' ? 'None' : '雜糅'}
          </button>
          {STATECRAFT.map((s) => (
            <button
              key={s.id}
              className={`${styles.tab} ${statecraft === s.id ? styles.tabActive : ''}`}
              title={lang === 'en' ? s.creed.en : s.creed.zh}
              onClick={() => setStatecraft(s.id)}
            >
              {lang === 'en' ? s.name.en : s.name.zh}
            </button>
          ))}
          {(canFound || founded) && (
            <button
              className={`${styles.tab} ${showCeremony ? styles.tabActive : ''}`}
              style={{ marginLeft: 'auto', borderColor: '#caa53d', color: founded ? '#7a8893' : '#e6c473' }}
              disabled={founded}
              title={founded
                ? (lang === 'en' ? `Founded ${playerForce?.dynastyTitle} · ${playerForce?.eraName}` : `已建國:${playerForce?.dynastyTitle}・${playerForce?.eraName}`)
                : (lang === 'en' ? 'Hold the founding ceremony: proclaim a dynasty, amnesty, and mass-enfeoff your officers.' : '行建國大典:定國號年號、大赦天下、封賞百官。')}
              onClick={() => setShowCeremony((v) => !v)}
            >
              {founded
                ? (lang === 'en' ? `👑 ${playerForce?.dynastyTitle}` : `👑 ${playerForce?.dynastyTitle}`)
                : (lang === 'en' ? '👑 Found Dynasty' : '👑 建國大典')}
            </button>
          )}
        </div>
        {/* §7.9-deep 治國理念深化 — 造詣 bar + 大政 decree */}
        {statecraft && (() => {
          const def = statecraftById(statecraft);
          const mastery = Math.round(playerForce?.statecraftMastery ?? 0);
          const ready = mastery >= STATECRAFT_DECREE_THRESHOLD;
          return (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0 1rem 0.55rem', flexWrap: 'wrap', fontSize: '0.74rem' }}>
              <span className={styles.officerStats}>{lang === 'en' ? '造詣 Mastery' : '學派造詣'}</span>
              <span style={{ width: 120, height: 8, background: '#0e1318', border: '1px solid #2b3845', borderRadius: 4, overflow: 'hidden' }}>
                <span style={{ display: 'block', width: `${mastery}%`, height: '100%', background: ready ? '#caa53d' : '#4a6a8a' }} />
              </span>
              <span style={{ color: ready ? '#e6c473' : '#9fb2c0' }}>{mastery}/100</span>
              <span style={{ color: '#5d6b76' }}>{lang === 'en' ? '· effects scale with mastery; switching resets it' : '· 效果隨造詣放大;改弦更張則歸零'}</span>
              {def && (
                <button
                  className={styles.tab}
                  style={{ marginLeft: 'auto', borderColor: ready ? '#caa53d' : undefined, color: ready ? '#e6c473' : '#5d6b76' }}
                  disabled={!ready}
                  title={lang === 'en' ? `Enact the signature decree of ${def.name.en} (needs mastery ≥ ${STATECRAFT_DECREE_THRESHOLD}).` : `行${def.name.zh}之國策大政(造詣須 ≥ ${STATECRAFT_DECREE_THRESHOLD})。`}
                  onClick={() => { const r = enactStatecraftDecree(); if (!r.ok && r.reason) alert(r.reason); }}
                >
                  📜 {lang === 'en' ? def.decree.en : def.decree.zh}
                </button>
              )}
            </div>
          );
        })()}
        {showCeremony && canFound && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0 1rem 0.6rem', flexWrap: 'wrap' }}>
            <span className={styles.officerStats}>{lang === 'en' ? 'Dynasty 國號' : '國號'}</span>
            <select value={dynastyTitle} onChange={(e) => setDynastyTitle(e.target.value)}>
              {DYNASTY_TITLES.map((d) => (
                <option key={d.zh} value={d.zh}>{lang === 'en' ? `${d.en} (${d.zh})` : d.zh}</option>
              ))}
            </select>
            <span className={styles.officerStats}>{lang === 'en' ? 'Era 年號' : '年號'}</span>
            <select value={eraName} onChange={(e) => setEraName(e.target.value)}>
              {ERA_NAMES.map((d) => (
                <option key={d.zh} value={d.zh}>{lang === 'en' ? `${d.en} (${d.zh})` : d.zh}</option>
              ))}
            </select>
            <button
              className={styles.appointBtn}
              onClick={() => {
                const r = holdFoundingCeremony(dynastyTitle, eraName);
                alert(r.message);
                if (r.ok) setShowCeremony(false);
              }}
            >
              {lang === 'en' ? 'Proclaim 即位告天' : '即位告天'}
            </button>
          </div>
        )}
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
            className={`${styles.tab} ${tab === 'peerage' ? styles.tabActive : ''}`}
            onClick={() => setTab('peerage')}
          >
            爵位 Peerage
          </button>
          <button
            className={`${styles.tab} ${tab === 'honorific' ? styles.tabActive : ''}`}
            onClick={() => setTab('honorific')}
          >
            名號 Honorifics
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
          {tab === 'peerage' && (
            <PeerageTab
              ownOfficers={ownOfficers}
              deeds={deeds}
              sovereign={sovereign}
              onGrant={(officerId, peerageId) => {
                const r = grantPeerage(officerId, peerageId);
                if (!r.ok) alert(r.reason ?? 'Failed');
              }}
              onRevoke={(officerId) => {
                const r = revokePeerage(officerId);
                if (!r.ok) alert(r.reason ?? 'Failed');
              }}
            />
          )}
          {tab === 'honorific' && (
            <HonorificTab
              ownOfficers={ownOfficers}
              deeds={deeds}
              onGrant={(officerId, honorificId) => {
                const r = grantHonorific(officerId, honorificId);
                if (!r.ok) alert(r.reason ?? 'Failed');
              }}
              onRevoke={(officerId) => {
                const r = revokeHonorific(officerId);
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

function PeerageTab({
  ownOfficers,
  deeds,
  sovereign,
  onGrant,
  onRevoke,
}: {
  ownOfficers: Officer[];
  deeds: Record<EntityId, import('../../game/types').HeroicDeeds>;
  sovereign: boolean;
  onGrant: (officerId: EntityId, peerageId: import('../../game/types').PeerageId) => void;
  onRevoke: (officerId: EntityId) => void;
}) {
  const lang = useLanguage();
  const [selectedId, setSelectedId] = useState<EntityId | null>(null);
  const selected = selectedId ? ownOfficers.find((o) => o.id === selectedId) : null;
  // Sort officers by merit desc so the most-deserving sit at the top.
  const sorted = useMemo(
    () => [...ownOfficers].sort((a, b) => meritScore(b, deeds[b.id]) - meritScore(a, deeds[a.id])),
    [ownOfficers, deeds],
  );
  // 本朝封爵 — everyone who currently holds a fief, grandest first.
  const peers = useMemo(
    () => ownOfficers.filter((o) => o.peerageId).sort((a, b) => peerageTier(b.peerageId) - peerageTier(a.peerageId)),
    [ownOfficers],
  );
  const totalFief = peers.reduce((s, o) => {
    const p = peerageById(o.peerageId);
    return { gold: s.gold + (p?.fiefGold ?? 0), grain: s.grain + (p?.fiefGrain ?? 0) };
  }, { gold: 0, grain: 0 });
  return (
    <div>
      {peers.length > 0 && (
        <div style={{ marginBottom: '0.9rem', border: '1px solid #2b3845', background: '#10161e', padding: '0.5rem 0.7rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            {lang === 'en' ? `Peerage of the realm (${peers.length}) · fiefs +${totalFief.gold}g +${totalFief.grain} grain/s` : `本朝封爵(${peers.length})· 食邑合計每季 +${totalFief.gold}金 +${totalFief.grain}糧`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {peers.map((o) => {
              const p = peerageById(o.peerageId);
              return (
                <span key={o.id} style={{ fontSize: '0.76rem', color: '#caa53d', border: '1px solid #5a4a2a', borderRadius: 3, padding: '0.05rem 0.4rem' }}>
                  <Name pair={o.name} /> · {p ? (lang === 'en' ? p.name.en : p.name.zh) : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className={styles.pickerLabel}>
        {sovereign
          ? (lang === 'en' ? 'Select officer (公/王 unlocked)' : '選擇武將(已可封公/王)')
          : (lang === 'en' ? 'Select officer — 公/王 need 稱王/稱帝' : '選擇武將(公/王需稱王稱帝)')}
      </div>
      <div className={styles.picker} style={{ marginBottom: '1rem' }}>
        {sorted.map((o) => {
          const peer = peerageById(o.peerageId);
          return (
            <button
              key={o.id}
              className={styles.officerOption}
              onClick={() => setSelectedId(o.id === selectedId ? null : o.id)}
              style={o.id === selectedId ? { borderColor: '#e6c473', background: '#1b2531' } : undefined}
            >
              <span>
                <Name pair={o.name} />
                {peer && <span style={{ color: '#caa53d', marginLeft: '0.4rem' }}><Name pair={peer.name} /></span>}
              </span>
              <span className={styles.officerStats}>
                {lang === 'en' ? 'merit' : '功勳'} {meritScore(o, deeds[o.id])}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div>
          <div className={styles.pickerLabel}>
            {lang === 'en' ? 'Enfeoff ' : '封爵 '}<Name pair={selected.name} />
            <span className={styles.officerStats} style={{ marginLeft: '0.5rem' }}>
              {lang === 'en' ? 'merit' : '功勳'} {meritScore(selected, deeds[selected.id])}
            </span>
            {selected.peerageId && (
              <button
                onClick={() => {
                  const peer = peerageById(selected.peerageId);
                  const name = peer ? (lang === 'en' ? peer.name.en : peer.name.zh) : '';
                  if (confirm(lang === 'en'
                    ? `Strip ${selected.name.en} of ${name}? Their loyalty will fall sharply.`
                    : `削去${selected.name.zh}的${name}?其忠誠將大跌。`)) onRevoke(selected.id);
                }}
                style={{
                  marginLeft: '0.6rem', fontSize: '0.72rem', cursor: 'pointer',
                  background: 'none', border: '1px solid #7a3a2a', color: '#c97a5a',
                  borderRadius: 3, padding: '0.1rem 0.45rem', fontFamily: 'inherit',
                }}
              >{lang === 'en' ? 'Strip title' : '削爵'}</button>
            )}
          </div>
          {PEERAGES.map((p) => {
            const merit = meritScore(selected, deeds[selected.id]);
            const held = peerageTier(selected.peerageId);
            const current = selected.peerageId === p.id;
            const lockedSovereign = p.requiresSovereign && !sovereign;
            const eligible = merit >= p.minMerit && p.tier > held && !lockedSovereign;
            return (
              <div key={p.id} className={styles.rankRow}>
                <div>
                  <span className={styles.rankName}><Name pair={p.name} /></span>
                </div>
                <div className={styles.rankReq}>
                  {lang === 'en' ? 'merit' : '功勳'} ≥ {p.minMerit}{p.requiresSovereign ? ' · 王/帝' : ''}
                </div>
                <div className={styles.rankStipend}>+{p.fiefGold}g +{p.fiefGrain}{lang === 'en' ? ' grain' : '糧'}/season</div>
                <div className={styles.rankCap}>{lang === 'en' ? 'loy' : '忠'}+{p.loyaltyBonus}/s</div>
                <div className={styles.rankAction}>
                  {current ? (
                    <span className={styles.muted}>{lang === 'en' ? 'current' : '現爵'}</span>
                  ) : eligible ? (
                    <button className={styles.appointBtn} onClick={() => onGrant(selected.id, p.id)}>
                      {lang === 'en' ? 'Enfeoff' : '封'}
                    </button>
                  ) : (
                    <span className={styles.muted}>{lockedSovereign ? '🔒' : '—'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!selected && (
        <div className={styles.empty}>{lang === 'en' ? 'Pick an officer to enfeoff.' : '選一名武將封爵。'}</div>
      )}
    </div>
  );
}

function HonorificTab({
  ownOfficers,
  deeds,
  onGrant,
  onRevoke,
}: {
  ownOfficers: Officer[];
  deeds: Record<EntityId, import('../../game/types').HeroicDeeds>;
  onGrant: (officerId: EntityId, honorificId: string) => void;
  onRevoke: (officerId: EntityId) => void;
}) {
  const lang = useLanguage();
  const [selectedId, setSelectedId] = useState<EntityId | null>(null);
  const selected = selectedId ? ownOfficers.find((o) => o.id === selectedId) : null;
  const sorted = useMemo(
    () => [...ownOfficers].sort((a, b) => meritScore(b, deeds[b.id]) - meritScore(a, deeds[a.id])),
    [ownOfficers, deeds],
  );
  // 本朝名號 — everyone bearing a martial honorific, grandest first.
  const bearers = useMemo(
    () => ownOfficers.filter((o) => o.honorificId).sort((a, b) => honorificTier(b.honorificId) - honorificTier(a.honorificId)),
    [ownOfficers],
  );
  // 宜授 — the title we'd recommend for the selected officer (適才適號).
  const rec = selected ? bestFitHonorific(selected, deeds[selected.id]) : null;
  return (
    <div>
      {bearers.length > 0 && (
        <div style={{ marginBottom: '0.9rem', border: '1px solid #2b3845', background: '#10161e', padding: '0.5rem 0.7rem' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            {lang === 'en' ? `Honorifics of the realm (${bearers.length})` : `本朝名號(${bearers.length})`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {bearers.map((o) => {
              const hon = honorificById(o.honorificId);
              return (
                <span key={o.id} style={{ fontSize: '0.76rem', color: '#e08a6a', border: '1px solid #5a3a2a', borderRadius: 3, padding: '0.05rem 0.4rem' }}>
                  <Name pair={o.name} /> · {hon ? (lang === 'en' ? hon.name.en : hon.name.zh) : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className={styles.pickerLabel}>
        {lang === 'en' ? 'Select officer — martial honorifics (雜號將軍)' : '選擇武將 — 名號將軍(雜號將軍)'}
      </div>
      <div className={styles.picker} style={{ marginBottom: '1rem' }}>
        {sorted.map((o) => {
          const hon = honorificById(o.honorificId);
          return (
            <button
              key={o.id}
              className={styles.officerOption}
              onClick={() => setSelectedId(o.id === selectedId ? null : o.id)}
              style={o.id === selectedId ? { borderColor: '#e6c473', background: '#1b2531' } : undefined}
            >
              <span>
                <Name pair={o.name} />
                {hon && <span style={{ color: '#e08a6a', marginLeft: '0.4rem' }}><Name pair={hon.name} /></span>}
              </span>
              <span className={styles.officerStats}>
                {lang === 'en' ? 'merit' : '功勳'} {meritScore(o, deeds[o.id])}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div>
          <div className={styles.pickerLabel}>
            {lang === 'en' ? 'Bestow on ' : '賜名號 · '}<Name pair={selected.name} />
            <span className={styles.officerStats} style={{ marginLeft: '0.5rem' }}>
              {lang === 'en' ? 'merit' : '功勳'} {meritScore(selected, deeds[selected.id])}
            </span>
            {selected.honorificId && (
              <button
                onClick={() => {
                  const hon = honorificById(selected.honorificId);
                  const name = hon ? (lang === 'en' ? hon.name.en : hon.name.zh) : '';
                  if (confirm(lang === 'en'
                    ? `Strip ${selected.name.en} of ${name}? Their loyalty will fall.`
                    : `奪去${selected.name.zh}的${name}?其忠誠將下降。`)) onRevoke(selected.id);
                }}
                style={{
                  marginLeft: '0.6rem', fontSize: '0.72rem', cursor: 'pointer',
                  background: 'none', border: '1px solid #7a3a2a', color: '#c97a5a',
                  borderRadius: 3, padding: '0.1rem 0.45rem', fontFamily: 'inherit',
                }}
              >{lang === 'en' ? 'Strip honorific' : '奪號'}</button>
            )}
          </div>
          {rec && (
            <div style={{ fontSize: '0.76rem', color: '#7ed6a0', margin: '0 0 0.4rem' }}>
              {lang === 'en' ? `Recommended (suits them): ${rec.name.en}` : `宜授(適才適號):${rec.name.zh} · ${HONORIFIC_THEME_ZH[rec.theme]}`}
            </div>
          )}
          {HONORIFICS.map((h) => {
            const merit = meritScore(selected, deeds[selected.id]);
            const held = honorificTier(selected.honorificId);
            const current = selected.honorificId === h.id;
            const eligible = merit >= h.minMerit && h.tier > held;
            const fits = honorificThemeFit(selected, deeds[selected.id], h.theme) > 0;
            return (
              <div key={h.id} className={styles.rankRow} title={h.deedHintZh}>
                <div>
                  <span className={styles.rankName}><Name pair={h.name} /></span>
                  <span className={styles.officerStats} style={{ marginLeft: '0.4rem', color: fits ? '#7ed6a0' : undefined }}>·{HONORIFIC_THEME_ZH[h.theme]}{fits ? ' ✦' : ''}</span>
                </div>
                <div className={styles.rankReq}>{lang === 'en' ? 'merit' : '功勳'} ≥ {h.minMerit}</div>
                <div className={styles.rankStipend}>{lang === 'en' ? 'loy' : '忠'}+{h.loyaltyBonus}/s · 威望+{h.renownOnGrant}</div>
                <div className={styles.rankCap}>{h.combatPowerMul ? `戰×${h.combatPowerMul}` : '—'}</div>
                <div className={styles.rankAction}>
                  {current ? (
                    <span className={styles.muted}>{lang === 'en' ? 'current' : '現號'}</span>
                  ) : eligible ? (
                    <button className={styles.appointBtn} onClick={() => onGrant(selected.id, h.id)}>
                      {lang === 'en' ? 'Bestow' : '賜'}
                    </button>
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
        <div className={styles.empty}>{lang === 'en' ? 'Pick an officer to honor.' : '選一名武將賜名號。'}</div>
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
    'manual': '罷免', 'kaoke': '考課黜免',
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
