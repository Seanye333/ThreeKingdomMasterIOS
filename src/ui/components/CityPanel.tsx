import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cityEconCap } from '../../game/systems/citySize';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { cityPolicyEffects, lockedPolicies } from '../../game/systems/policyEffects';
import { POLICY_DEFS } from '../../game/data/officerAttributes';
import { citySize, nextTierPop, cityCarryingCapacity } from '../../game/systems/citySize';
import { buildingBonuses } from '../../game/systems/buildings';
import { tickCityEconomy } from '../../game/systems/economy';
import { caseloadTier } from '../../game/systems/law';
import { hiddenTier, registryYieldMul } from '../../game/systems/household';
import { hoardTier } from '../../game/systems/hoarding';
import { armamentTier, armamentEffects } from '../../game/systems/workshops';
import { woundedTier } from '../../game/systems/veterans';
import type { City, EntityId, Officer } from '../../game/types';
import { lazy, Suspense } from 'react';
// 啟動提速 — the city 3D scene (≈175KB) loads when a city is first entered.
const CityMapScreen3D = lazy(() => import('../screens/CityMapScreen3D').then(m => ({ default: m.CityMapScreen3D })));
// 列傳詳情 — heavy, and only needed once a row is tapped.
const OfficerDetail = lazy(() => import('./OfficerDetail').then(m => ({ default: m.OfficerDetail })));
import { playSfx } from '../../game/systems/sound';
import { requestMapFocus } from './mapFocusBus';
import { BuildingsPanel } from './BuildingsPanel';
import { AnimatedNumber } from './AnimatedNumber';
import { CaptivesSection } from './CaptivesSection';
import { CommandMenu } from './CommandMenu';
import { EmptyState } from './EmptyState';
import { ConvoyDispatchModal } from './ConvoyDispatchModal';
import { ExpeditionModal } from './ExpeditionModal';
import { getEmbassyTarget } from '../../game/systems/foreignRealm';
import { FreeAgentsSection } from './FreeAgentsSection';
import { Icon, type IconName } from './Icon';
import { OfficerStats } from './OfficerStats';
import { OfficerHoverCard } from './OfficerHoverCard';
import { OfficerPortrait } from './OfficerPortrait';
import { TERRAIN_DEFS } from '../../game/data/cities';
import { PROVINCE_BY_CITY, PROVINCES_BY_ID } from '../../game/data';
import { rebuildCost } from '../../game/systems/cityRuin';
import styles from './CityPanel.module.css';
import { useT, useLanguage } from '../i18n';

// 巡城箭頭 — compact ghost buttons beside the city name.
const cyclerBtnStyle: CSSProperties = {
  background: 'transparent', border: '1px solid #2b3845', color: '#aab6c0',
  borderRadius: 'var(--tkm-radius-sm)', width: 26, height: 24, padding: 0,
  cursor: 'pointer', fontSize: '0.68rem', lineHeight: 1,
};

// 分頁 — the panel's sections live under four tabs so the sidebar never
// becomes one long scroll. Non-player cities only show 總覽/武將.
type CityTab = 'overview' | 'domestic' | 'military' | 'officers';
const CITY_TABS: { id: CityTab; zh: string; en: string; playerOnly?: boolean }[] = [
  { id: 'overview', zh: '總覽', en: 'City' },
  { id: 'domestic', zh: '內政', en: 'Domestic', playerOnly: true },
  { id: 'military', zh: '軍務', en: 'Military', playerOnly: true },
  { id: 'officers', zh: '武將', en: 'Officers' },
];

export function CityPanel() {
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const city = useGameStore((s) =>
    selectedCityId ? s.cities[selectedCityId] : null,
  );
  const force = useGameStore((s) =>
    city?.ownerForceId ? s.forces[city.ownerForceId] : null,
  );
  const officersMap = useGameStore((s) => s.officers);
  const officers = useMemo(
    () =>
      Object.values(officersMap).filter(
        (o) =>
          o.locationCityId === selectedCityId &&
          o.forceId === city?.ownerForceId &&
          o.status !== 'imprisoned' &&
          o.status !== 'dead',
      ),
    [officersMap, selectedCityId, city?.ownerForceId],
  );

  // City-interior map open-state lives in the store so the strategic map can
  // trigger it (re-click a selected city to enter).
  const showCityMap = useGameStore((s) => s.cityMapOpen);
  const openCityMap = useGameStore((s) => s.openCityMap);
  const closeCityMap = useGameStore((s) => s.closeCityMap);
  // 進出城墨幕 — choreographs world map ↔ city interior: veil closes while
  // the world camera dives at the gate, the city mounts beneath, veil lifts.
  const [cityVeil, setCityVeil] = useState<'idle' | 'closed' | 'lifting'>('idle');
  const veilTimers = useRef<number[]>([]);
  const queueVeil = (fn: () => void, ms: number) => { veilTimers.current.push(window.setTimeout(fn, ms)); };
  const playVeil = () => {
    veilTimers.current.forEach(clearTimeout); veilTimers.current = [];
    setCityVeil('closed');
    queueVeil(() => setCityVeil('lifting'), 430);
    queueVeil(() => setCityVeil('idle'), 900);
  };
  const enterCity = () => {
    veilTimers.current.forEach(clearTimeout); veilTimers.current = [];
    if (city) requestMapFocus(city.id);   // camera dives at the gate under the veil
    setCityVeil('closed');
    queueVeil(() => {
      openCityMap();
      queueVeil(() => setCityVeil('lifting'), 140);
      queueVeil(() => setCityVeil('idle'), 600);
    }, 430);
  };
  const exitCity = () => {
    veilTimers.current.forEach(clearTimeout); veilTimers.current = [];
    setCityVeil('closed');
    queueVeil(() => {
      closeCityMap();
      queueVeil(() => setCityVeil('lifting'), 140);
      queueVeil(() => setCityVeil('idle'), 600);
    }, 380);
  };
  useEffect(() => () => { veilTimers.current.forEach(clearTimeout); }, []);
  // External opens (re-clicking a selected city on the strategic map flips
  // the store flag directly) still get the veil, reactively.
  const prevCityOpen = useRef(showCityMap);
  useEffect(() => {
    if (showCityMap !== prevCityOpen.current) {
      prevCityOpen.current = showCityMap;
      if (cityVeil === 'idle') playVeil();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCityMap]);
  const t = useT();
  const lang = useLanguage();

  const [tab, setTab] = useState<CityTab>('overview');
  const isPlayerCity = !!city && city.ownerForceId === playerForceId;
  // 情報點 — per-city chores surface on the tab strip itself: a warm dot on
  // 內政 while stationed officers sit idle, a red count on 軍務 for captives
  // awaiting a verdict. You see where you're needed without opening the tab.
  const hasPendingHere = useGameStore((s) =>
    Object.values(s.pendingCommands).some((c) => c.cityId === selectedCityId));
  const idleHere = isPlayerCity && !hasPendingHere && officers.some((o) => !o.task && o.status === 'idle');
  const captiveCount = useGameStore((s) =>
    Object.values(s.officers).filter((o) => o.locationCityId === selectedCityId && o.status === 'imprisoned').length);
  // 巡城 — how many cities the player owns (arrows only make sense for ≥2).
  const ownCityCount = useGameStore((s) =>
    Object.values(s.cities).filter((c) => c.ownerForceId === s.playerForceId).length);
  const cycleCity = (dir: 1 | -1) => {
    const s = useGameStore.getState();
    const own = Object.values(s.cities)
      .filter((c) => c.ownerForceId === s.playerForceId)
      .sort((a, b) => a.name.zh.localeCompare(b.name.zh));
    if (own.length === 0) return;
    const idx = own.findIndex((c) => c.id === s.selectedCityId);
    const next = own[(idx + dir + own.length) % own.length];
    s.selectCity(next.id);
    requestMapFocus(next.id);   // camera glides along
  };
  // 記住分頁 — the chosen tab persists; on an enemy/neutral city the player-only
  // tabs simply render as 總覽 (via effectiveTab) WITHOUT clobbering the memory,
  // so scouting a foe mid-turn and returning to an own city restores 內政/軍務.
  const effectiveTab: CityTab = (!isPlayerCity && (tab === 'domestic' || tab === 'military')) ? 'overview' : tab;

  if (!city) {
    return (
      <aside className={styles.root}>
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <EmptyState
            icon="🗺"
            title={t('於地圖選擇城市', 'Select a city')}
            hint={t('點地圖上的城池,查看內政、軍務與武將。', 'Tap a city on the map to see its affairs, forces and officers.')}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.root}>
      <div className={styles.panelTop}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {lang !== 'en' && <div className={styles.nameZh}>{city.name.zh}</div>}
            {lang !== 'zh' && <div className={styles.nameEn}>{city.name.en}</div>}
          </div>
          {/* 巡城 — ◀▶ cycle through own cities (the Tab hotkey, but tappable). */}
          {ownCityCount > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <button onClick={() => cycleCity(-1)} title={t('上一座自城', 'Previous own city')} style={cyclerBtnStyle}>◀</button>
              <button onClick={() => cycleCity(1)} title={t('下一座自城(Tab)', 'Next own city (Tab)')} style={cyclerBtnStyle}>▶</button>
            </div>
          )}
        </div>
        <div className={styles.owner}>
          {force ? (
            <>
              <span
                className={styles.colorDot}
                style={{ background: force.color }}
              />
              {lang === 'en' ? force.name.en : force.name.zh}
              {lang === 'both' && <span className={styles.ownerEn}>· {force.name.en}</span>}
              {isPlayerCity && <span className={styles.playerTag}>{t('我方', 'YOU')}</span>}
              {force.capitalCityId === city.id && (
                <span
                  style={{
                    marginLeft: '0.4rem', background: '#2a2410', border: '1px solid #c8a23a',
                    color: '#e6c473', padding: '0.05rem 0.4rem', borderRadius: 'var(--tkm-radius-sm)',
                    fontSize: '0.7rem', letterSpacing: '0.08rem',
                  }}
                >{t('★治所', '★ Capital')}</span>
              )}
            </>
          ) : (
            <span className={styles.neutral}>{t('中立', 'Neutral')}</span>
          )}
        </div>
        {(() => {
          const terrainKey = city.terrain ?? 'plain';
          const terrain = TERRAIN_DEFS[terrainKey];
          const provinceId = PROVINCE_BY_CITY[city.id];
          const province = provinceId ? PROVINCES_BY_ID[provinceId] : null;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.72rem' }}>
              <span style={{ background: '#10161e', border: `1px solid ${terrain.color}`, color: terrain.color, padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                {lang === 'en' ? terrain.en : terrain.zh}
                {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>{terrain.en}</span></>}
              </span>
              {city.port && (
                <span style={{ background: '#10161e', border: '1px solid #88b7e8', color: '#88b7e8', padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? 'Port' : '港'}
                  {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#5a7090', fontStyle: 'italic' }}>Port</span></>}
                </span>
              )}
              {province && (
                <span style={{ background: '#10161e', border: `1px solid ${province.color}`, color: province.color, padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? province.name.en : province.name.zh}
                  {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>{province.name.en}</span></>}
                </span>
              )}
            </div>
          );
        })()}
      </header>

      <nav className={styles.tabs}>
        {CITY_TABS.filter((tb) => !tb.playerOnly || isPlayerCity).map((tb) => (
          <button
            key={tb.id}
            className={effectiveTab === tb.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => { if (tab !== tb.id) { playSfx('click'); setTab(tb.id); } }}
            title={tb.id === 'domestic' && idleHere
              ? t('有武將閒置 — 可下內政令', 'Idle officers here — issue an order')
              : tb.id === 'military' && captiveCount > 0
                ? t(`俘虜 ${captiveCount} 人待處置`, `${captiveCount} captive(s) await a verdict`)
                : undefined}
          >
            {lang === 'en' ? tb.en : tb.zh}
            {tb.id === 'officers' && officers.length > 0 && (
              <span className={styles.tabBadge}>{officers.length}</span>
            )}
            {tb.id === 'domestic' && idleHere && <span className={styles.tabDot} />}
            {tb.id === 'military' && captiveCount > 0 && (
              <span className={styles.tabBadge} style={{ color: '#e08070' }}>{captiveCount}</span>
            )}
          </button>
        ))}
      </nav>
      </div>

      <div className={styles.tabBody}>
      {/* keyed by tab — remounting the wrapper plays the entrance fade */}
      <div key={tab} className={styles.tabFade}>
      {effectiveTab === 'overview' && (
        <>
          {/* City size badge — derived from population */}
          <CitySizeBadge city={city} />

          {/* Inline mini-map preview — the single "enter city" entry. Clicking
              opens the full 3D city map; it also shows walls + 8 build slots so
              the player sees at a glance what's built. Reliable tap target on
              mobile (the re-click-to-enter gesture only works with a mouse). */}
          <CityMiniMap city={city} onClick={enterCity} />

          <ResourcesSection city={city} cityOfficers={officers} isPlayerCity={isPlayerCity} />

          <DevelopmentSection city={city} isPlayerCity={isPlayerCity} />

          {/* Active policy effects from resident officers — REAL gameplay impact */}
          <PolicyEffectsSection city={city} cityOfficers={officers} />
        </>
      )}

      {effectiveTab === 'domestic' && isPlayerCity && (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('內政令', 'Civil Orders')}</h3>
            <CommandMenu cityId={city.id} section="civil" />
          </section>

          <BuildingsPanel cityId={city.id} />

          <CapitalControls cityId={city.id} />
          <RuinControls cityId={city.id} />
        </>
      )}

      {effectiveTab === 'military' && isPlayerCity && (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('軍令', 'Military Orders')}</h3>
            <CommandMenu cityId={city.id} section="military" />
          </section>

          <GrainTransferSection cityId={city.id} isPlayerCity={isPlayerCity} />
          <CaptivesSection cityId={city.id} />
        </>
      )}

      {effectiveTab === 'officers' && (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t('武將', 'Officers')} ({officers.length})
            </h3>
            {officers.length === 0 ? (
              <EmptyState compact icon="👤" title={t('無武將駐紮', 'No officers stationed')}
                hint={isPlayerCity ? t('自鄰城移送武將前來,或招攬在野之士。', 'Transfer officers from a neighbor, or recruit free agents.') : undefined} />
            ) : (
              <ul className={styles.officerList}>
                {officers.map((o) => (
                  <OfficerListItem
                    key={o.id}
                    officer={o}
                    cityId={city.id}
                    isPlayerCity={isPlayerCity}
                  />
                ))}
              </ul>
            )}
          </section>

          {isPlayerCity && <CommandMenu cityId={city.id} section="training" />}
          {isPlayerCity && <ExpeditionSection cityId={city.id} isPlayerCity={isPlayerCity} />}

          <FreeAgentsSection cityId={city.id} isPlayerCity={isPlayerCity} />
        </>
      )}
      </div>
      </div>
      {showCityMap && (
        <Suspense fallback={null}>
          <CityMapScreen3D
            cityId={city.id}
            onClose={exitCity}
          />
        </Suspense>
      )}
      {/* 進出城墨幕 — the ink veil that stitches world map ↔ city interior:
          entering dives the world camera at the gate while the veil closes,
          the city mounts under it, then it lifts. Exiting mirrors it. */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1600, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, #0a0c10 40%, #05060a 100%)',
        opacity: cityVeil === 'closed' ? 1 : 0,
        transition: 'opacity 0.4s ease',
        visibility: cityVeil === 'idle' ? 'hidden' : 'visible',
      }} />
    </aside>
  );
}

/**
 * 輜重 — a compact launcher for the supply-convoy composer. Shows what is
 * presently rolling out of this city (and any standing routes) and offers a
 * single 派車 button that opens the full dispatch modal (destination + escort +
 * cargo sliders + live ETA). Replaces the old cramped inline preset-button rows.
 */
function GrainTransferSection({ cityId, isPlayerCity }: { cityId: EntityId; isPlayerCity: boolean }) {
  const t = useT();
  const lang = useLanguage();
  const allCities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const officers = useGameStore((s) => s.officers);
  const convoys = useGameStore((s) => s.convoys);
  const standingRoutes = useGameStore((s) => s.standingRoutes);
  const [open, setOpen] = useState(false);
  const city = allCities[cityId];

  const destCount = useMemo(
    () => Object.values(allCities).filter((c) => c.ownerForceId === playerForceId && c.id !== cityId).length,
    [allCities, playerForceId, cityId],
  );
  // 押運武将 — idle officers in this city who could escort a column.
  const escortCount = useMemo(
    () => Object.values(officers).filter((o) => o.forceId === playerForceId && o.locationCityId === cityId && (o.status === 'idle' || o.status === 'active') && !o.task).length,
    [officers, playerForceId, cityId],
  );
  // 在途 — columns presently rolling out of this city.
  const outbound = useMemo(
    () => Object.values(convoys ?? {})
      .filter((c) => c.fromCityId === cityId && c.forceId === playerForceId)
      .sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [convoys, cityId, playerForceId],
  );
  const standing = useMemo(
    () => (standingRoutes ?? []).filter((r) => r.fromCityId === cityId),
    [standingRoutes, cityId],
  );

  if (!isPlayerCity || !city || destCount === 0) return null;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>{t('輜重', 'Convoy')}</span>
        <button
          onClick={() => setOpen(true)}
          disabled={escortCount === 0}
          title={escortCount === 0 ? t('需一名駐城閒置武將押運', 'needs an idle officer here to escort') : t('派遣輜重隊', 'compose a supply column')}
          style={{
            background: escortCount === 0 ? '#161c24' : 'linear-gradient(180deg, rgba(230,196,115,0.2), rgba(230,196,115,0.06))',
            border: `1px solid ${escortCount === 0 ? '#26323e' : '#e6c473'}`,
            color: escortCount === 0 ? '#4a5660' : '#f2dd9a',
            padding: '0.2rem 0.7rem', fontFamily: 'inherit', fontSize: '0.72rem',
            cursor: escortCount === 0 ? 'not-allowed' : 'pointer', borderRadius: 'var(--tkm-radius-sm)', letterSpacing: '0.05rem',
          }}
        >
          {t('派車 ⇨', 'Dispatch ⇨')}
        </button>
      </h3>

      {/* 在途輜重 — columns currently leaving this city */}
      {outbound.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: '0.3rem' }}>
          {outbound.map((c) => {
            const to = allCities[c.toCityId];
            const esc = c.officerId ? officers[c.officerId] : null;
            const cargo = [
              c.food ? `糧${Math.round(c.food / 1000)}k` : '',
              c.gold ? `金${Math.round(c.gold / 1000)}k` : '',
              c.troops ? `兵${Math.round(c.troops / 1000)}k` : '',
            ].filter(Boolean).join(' ');
            return (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#aab6c0', background: '#10161e', border: '1px solid #1d2731', borderRadius: 'var(--tkm-radius-xs)', padding: '0.18rem 0.45rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.naval ? '🚢' : '🐂'} → {to ? (lang === 'en' ? to.name.en : to.name.zh) : '?'}
                  {esc && <span style={{ color: '#7a8893' }}> · {lang === 'en' ? esc.name.en : esc.name.zh}</span>}
                </span>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: '#7a8893', whiteSpace: 'nowrap' }}>
                  {cargo}{cargo && ' · '}{t(`${c.seasonsRemaining}旬`, `${c.seasonsRemaining}s`)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: '#7a8893' }}>
        {escortCount > 0
          ? t(`${escortCount} 將可押運 · ${destCount} 友城可達`, `${escortCount} officer(s) free · ${destCount} destination(s)`)
          : t('此城無閒置武將押運輜重', 'no idle officer here to escort a column')}
        {standing.length > 0 && t(` · ↻ ${standing.length} 常運糧道`, ` · ↻ ${standing.length} standing`)}
      </div>

      {open && <ConvoyDispatchModal fromCityId={cityId} onClose={() => setOpen(false)} />}
    </section>
  );
}

/**
 * 游历 — a compact launcher for sending a lone officer roaming (探索/出使/策反/
 * 刺探). Shows who is presently abroad out of this city (with a recall button)
 * and a 遣行 button opening the full composer.
 */
function ExpeditionSection({ cityId, isPlayerCity }: { cityId: EntityId; isPlayerCity: boolean }) {
  const t = useT();
  const lang = useLanguage();
  const allCities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const officers = useGameStore((s) => s.officers);
  const expeditions = useGameStore((s) => s.expeditions);
  const recallExpedition = useGameStore((s) => s.recallExpedition);
  const [open, setOpen] = useState(false);
  const city = allCities[cityId];

  const roamerCount = useMemo(
    () => Object.values(officers).filter((o) => o.forceId === playerForceId && o.locationCityId === cityId && (o.status === 'idle' || o.status === 'active') && !o.task).length,
    [officers, playerForceId, cityId],
  );
  const outbound = useMemo(
    () => Object.values(expeditions ?? {})
      .filter((e) => e.fromCityId === cityId && e.forceId === playerForceId)
      .sort((a, b) => a.seasonsRemaining - b.seasonsRemaining),
    [expeditions, cityId, playerForceId],
  );

  if (!isPlayerCity || !city) return null;

  const MODE_LABEL: Record<string, { zh: string; en: string; icon: string }> = {
    explore: { zh: '探索', en: 'explore', icon: '🧭' },
    envoy: { zh: '出使', en: 'envoy', icon: '🕊️' },
    subvert: { zh: '策反', en: 'subvert', icon: '🎭' },
    infiltrate: { zh: '刺探', en: 'infiltrate', icon: '🕵️' },
    embassy: { zh: '遠使', en: 'embassy', icon: '🐫' },
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>{t('游历', 'Expedition')}</span>
        <button
          onClick={() => setOpen(true)}
          disabled={roamerCount === 0}
          title={roamerCount === 0 ? t('需一名駐城閒置武將', 'needs an idle officer here') : t('遣將游历', 'send an officer roaming')}
          style={{
            background: roamerCount === 0 ? '#161c24' : 'linear-gradient(180deg, rgba(230,196,115,0.2), rgba(230,196,115,0.06))',
            border: `1px solid ${roamerCount === 0 ? '#26323e' : '#e6c473'}`,
            color: roamerCount === 0 ? '#4a5660' : '#f2dd9a',
            padding: '0.2rem 0.7rem', fontFamily: 'inherit', fontSize: '0.72rem',
            cursor: roamerCount === 0 ? 'not-allowed' : 'pointer', borderRadius: 'var(--tkm-radius-sm)', letterSpacing: '0.05rem',
          }}
        >
          {t('遣行 ⇨', 'Send ⇨')}
        </button>
      </h3>

      {outbound.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: '0.3rem' }}>
          {outbound.map((e) => {
            const realm = e.mode === 'embassy' && e.toRealmId ? getEmbassyTarget(e.toRealmId) : null;
            const to = realm ? null : allCities[e.toCityId];
            const destName = realm ? (lang === 'en' ? realm.name.en : realm.name.zh) : (to ? (lang === 'en' ? to.name.en : to.name.zh) : '?');
            const o = officers[e.officerId];
            const m = MODE_LABEL[e.mode] ?? { zh: e.mode, en: e.mode, icon: '•' };
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#aab6c0', background: '#10161e', border: '1px solid #1d2731', borderRadius: 'var(--tkm-radius-xs)', padding: '0.18rem 0.45rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.icon} {o ? (lang === 'en' ? o.name.en : o.name.zh) : '?'}
                  <span style={{ color: '#7a8893' }}> {e.phase === 'returning' ? t('歸途', 'homeward') : `→ ${destName}`} · {lang === 'en' ? m.en : m.zh}</span>
                </span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', color: '#7a8893' }}>{t(`${e.seasonsRemaining}旬`, `${e.seasonsRemaining}s`)}</span>
                  {e.phase === 'outbound' && (
                    <button
                      onClick={() => recallExpedition(e.id)}
                      title={t('召回', 'recall')}
                      style={{ background: 'none', border: '1px solid #3a4651', color: '#9aa6b0', borderRadius: 'var(--tkm-radius-xs)', fontSize: '0.7rem', padding: '0 0.3rem', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {t('召回', 'recall')}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: '#7a8893' }}>
        {roamerCount > 0
          ? t(`${roamerCount} 將可遣 · 探索/出使/策反/刺探`, `${roamerCount} officer(s) free · scout / envoy / subvert / spy`)
          : t('此城無閒置武將可遣', 'no idle officer here to send')}
      </div>

      {open && <ExpeditionModal fromCityId={cityId} onClose={() => setOpen(false)} />}
    </section>
  );
}

function OfficerListItem({
  officer: o,
  cityId,
  isPlayerCity,
}: {
  officer: Officer;
  cityId: EntityId;
  isPlayerCity: boolean;
}) {
  const [transferOpen, setTransferOpen] = useState(false);
  // 點開列傳 — hover 卡是速覽,點一下才進完整詳情(手機沒有 hover)。
  const [detailOpen, setDetailOpen] = useState(false);
  const allCities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const adjacent = useMemo(() => {
    const city = allCities[cityId];
    if (!city) return [];
    return city.adjacentCityIds
      .map((id) => allCities[id])
      .filter((c) => c?.ownerForceId === playerForceId);
  }, [allCities, cityId, playerForceId]);
  const transferOfficer = useGameStore((s) => s.transferOfficer);
  const cityGold = useGameStore((s) => s.cities[cityId]?.gold ?? 0);
  const forceColor = useGameStore((s) => (o.forceId ? s.forces[o.forceId]?.color : undefined));
  const taskDef = o.task ? COMMAND_DEFS[o.task] : null;
  const canTransfer = isPlayerCity && !o.task && o.status === 'idle';
  const t = useT();
  const lang = useLanguage();

  return (
    <li className={`${styles.officerRow} tkm-lift tkm-row-in`}>
      <span onClick={() => setDetailOpen(true)} style={{ cursor: 'pointer', display: 'contents' }}>
        <OfficerPortrait officer={o} size={34} forceColor={forceColor} />
        <OfficerHoverCard officer={o}>
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, cursor: 'pointer' }} title={t('點擊看列傳', 'Tap for full biography')}>
            <span>
              {lang !== 'en' && <span className={styles.officerNameZh}>{o.name.zh}</span>}
              {lang !== 'zh' && <span className={styles.officerNameEn}>{o.name.en}</span>}
            </span>
            <span className={styles.officerStats}>
              <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} lang={lang === 'en' ? 'en' : 'zh'} />
            </span>
          </span>
        </OfficerHoverCard>
      </span>
      <span className={styles.officerStats}>
        {taskDef ? (
          <span className={styles.officerTask}>▸ {lang === 'en' ? taskDef.label.en : taskDef.label.zh}</span>
        ) : canTransfer ? (
          <button
            onClick={() => setTransferOpen((v) => !v)}
            title={t('移送至相鄰城池 (50金)', 'Transfer to adjacent city (50g)')}
            style={{
              background: 'transparent',
              border: '1px solid #2b3845',
              color: cityGold >= 50 ? '#e6c473' : '#364654',
              padding: '0.05rem 0.4rem',
              fontFamily: 'inherit',
              fontSize: '0.72rem',
              cursor: cityGold >= 50 ? 'pointer' : 'not-allowed',
              letterSpacing: '0.05rem',
            }}
            disabled={cityGold < 50}
          >
            {t('移送', 'Transfer')} ⇨
          </button>
        ) : null}
      </span>
      {transferOpen && canTransfer && (
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: '0.25rem',
            padding: '0.3rem',
            background: '#10161e',
            border: '1px solid #2b3845',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}
        >
          {adjacent.length === 0 ? (
            <span
              style={{
                color: '#7a8893',
                fontSize: '0.7rem',
                fontStyle: 'italic',
              }}
            >
              {t('無相鄰友城', 'No adjacent friendly cities')}
            </span>
          ) : (
            adjacent.map((dest) => (
              <button
                key={dest.id}
                onClick={() => {
                  transferOfficer(o.id, dest.id);
                  setTransferOpen(false);
                }}
                style={{
                  background: '#1b2531',
                  border: '1px solid #26323e',
                  color: '#e6c473',
                  padding: '0.2rem 0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                → {lang === 'en' ? dest.name.en : dest.name.zh}
              </button>
            ))
          )}
        </div>
      )}
      {detailOpen && (
        <Suspense fallback={null}>
          <OfficerDetail officer={o} onClose={() => setDetailOpen(false)} />
        </Suspense>
      )}
    </li>
  );
}

/**
 * 資源 — gold/food/troops/population with a per-season projection, so the player
 * reads what each tick adds or drains (稅入 tax income, 兵糧 grain upkeep, 秋收
 * harvest, 逃亡 desertion) at a glance, not just the static stockpile. Enemy
 * cities show the bare figures.
 */
function ResourcesSection({ city, cityOfficers, isPlayerCity }: { city: City; cityOfficers: Officer[]; isPlayerCity: boolean }) {
  const t = useT();
  const lang = useLanguage();
  const season = useGameStore((s) => s.date.season);
  const taxPolicy = useGameStore((s) => s.taxPolicy);
  const inflation = useGameStore((s) => s.inflation ?? 0);
  const allBuildings = useGameStore((s) => s.buildings);
  const size = citySize(city);

  // Mirror the resolution tick so the quoted numbers match what actually lands.
  const proj = useMemo(() => {
    if (!isPlayerCity) return null;
    const tax = taxPolicy?.[city.ownerForceId ?? ''] ?? 'normal';
    const now = tickCityEconomy(city, season, cityOfficers, tax, inflation, 'clear', allBuildings);
    const harvest = season === 'autumn' ? now.foodIncome : tickCityEconomy(city, 'autumn', cityOfficers, tax, inflation, 'clear', allBuildings).foodIncome;
    return { now, harvest };
  }, [city, cityOfficers, season, taxPolicy, inflation, isPlayerCity, allBuildings]);

  const row = (icon: IconName, zh: string, en: string, num: number, opts?: {
    suffix?: string; delta?: string; tone?: string; sub?: ReactNode;
  }) => (
    <div className={styles.statRow} style={opts?.sub ? { alignItems: 'flex-start' } : undefined}>
      <span className={styles.statLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={13} color="#8a98a4" />
        {lang === 'en' ? en : zh}
        {lang === 'both' && <span className={styles.statZh}>{en}</span>}
      </span>
      <span className={styles.statValue} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        <span>
          <AnimatedNumber value={num} flash />{opts?.suffix}
          {opts?.delta && <span style={{ marginLeft: 7, fontSize: '0.72rem', color: opts.tone ?? '#7a8893' }}>{opts.delta}</span>}
        </span>
        {opts?.sub}
      </span>
    </div>
  );

  const upkeep = proj?.now.foodUpkeep ?? 0;
  const netFoodNow = proj ? proj.now.foodIncome - proj.now.foodUpkeep : 0;
  const desertion = proj?.now.desertion ?? 0;
  // 旬糧 — seasons of grain left if no harvest comes first (only when consuming).
  const seasonsLeft = upkeep > 0 ? Math.floor(city.food / upkeep) : Infinity;

  // 承載力 — how many people the city's farmland + civic works can sustain. Make
  // the population ceiling visible so the player knows when to raise 農業.
  const growthAdd = buildingBonuses(city.id, allBuildings).popGrowthAdd;
  const capacity = cityCarryingCapacity(city, growthAdd);
  const fill = capacity > 0 ? city.population / capacity : 1;
  const capPct = Math.min(150, Math.round(fill * 100));
  const capTone = fill >= 1 ? '#e0707a' : fill >= 0.85 ? '#e0c060' : '#7ed68a';
  const capBar = (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginTop: 2 }}>
      <span style={{ fontSize: '0.64rem', color: '#8a98a4' }}>
        {t('承載力', 'Capacity')} {capacity.toLocaleString()} ({capPct}%)
      </span>
      <span style={{ width: 88, height: 4, background: '#10161e', borderRadius: 'var(--tkm-radius-xs)', overflow: 'hidden' }}>
        <span style={{ display: 'block', width: `${Math.min(100, capPct)}%`, height: '100%', background: capTone }} />
      </span>
      {fill >= 0.92 && (
        <span style={{ fontSize: '0.7rem', color: capTone }}>
          {fill >= 1 ? t('已飽和 — 升農業擴容', 'At capacity — raise 農業') : t('近飽和 — 升農業擴容', 'Near cap — raise 農業')}
        </span>
      )}
    </span>
  );

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('資源', 'Resources')}</h3>
      {row('city', '人口', 'Population', city.population, {
        ...(proj && season === 'autumn' && proj.now.populationDelta !== 0
          ? { delta: `${proj.now.populationDelta > 0 ? '+' : ''}${proj.now.populationDelta.toLocaleString()}`, tone: proj.now.populationDelta > 0 ? '#7ed68a' : '#e0707a' }
          : {}),
        sub: capBar,
      })}
      {row('gold', '金', 'Gold', city.gold, proj
        ? { delta: t(`稅入 +${proj.now.goldIncome.toLocaleString()}/季`, `+${proj.now.goldIncome.toLocaleString()}/qtr`), tone: '#7ed68a' }
        : undefined)}
      {row('grain', '兵糧', 'Food', city.food, proj
        ? (season === 'autumn'
            ? { delta: `${netFoodNow >= 0 ? '+' : ''}${netFoodNow.toLocaleString()}/季`, tone: netFoodNow >= 0 ? '#7ed68a' : '#e0707a' }
            : {
                delta: upkeep > 0 ? `−${upkeep.toLocaleString()}/季` : t('無耗', 'no upkeep'),
                tone: upkeep > 0 ? '#e0a070' : '#7a8893',
                sub: proj.harvest > 0
                  ? <span style={{ fontSize: '0.66rem', color: '#7a8893' }}>{t(`秋收 +${proj.harvest.toLocaleString()}`, `harvest +${proj.harvest.toLocaleString()}`)}</span>
                  : undefined,
              })
        : undefined)}
      {row('war', '兵士', 'Troops', city.troops, {
        suffix: ` / ${size.troopCap.toLocaleString()}`,
        delta: desertion > 0 ? t(`逃亡 −${desertion.toLocaleString()}`, `−${desertion.toLocaleString()} desert`) : undefined,
        tone: '#e0707a',
      })}
      {/* 異域義從 — foreign auxiliaries stationed here lift the city's defence */}
      {(city.foreignAux ?? 0) > 0 && (
        <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#c9a86a' }}>
          {t(`異域義從 ${(city.foreignAux ?? 0).toLocaleString()} — 守備戰力 +${Math.round(Math.min(0.15, (city.foreignAux ?? 0) / 20000) * 100)}%`,
             `${(city.foreignAux ?? 0).toLocaleString()} foreign auxiliaries — +${Math.round(Math.min(0.15, (city.foreignAux ?? 0) / 20000) * 100)}% defence`)}
        </div>
      )}
      {/* 缺糧警示 — a real, imminent problem the player should act on */}
      {proj && desertion > 0 && (
        <div style={{ marginTop: 4, fontSize: '0.7rem', color: '#f0a0a0', background: 'rgba(180,60,50,0.12)', border: '1px solid #7a3030', borderRadius: 'var(--tkm-radius-xs)', padding: '0.2rem 0.45rem' }}>
          {t('⚠ 兵糧不足 — 本季缺糧,士卒逃亡!速運糧或裁軍', '⚠ Out of grain — troops desert this season! Ship food or disband.')}
        </div>
      )}
      {proj && desertion === 0 && upkeep > 0 && season !== 'autumn' && seasonsLeft <= 3 && (
        <div style={{ marginTop: 4, fontSize: '0.68rem', color: '#e0a070' }}>
          {t(`存糧約可支 ${seasonsLeft} 季,秋收前留意接濟`, `~${seasonsLeft} season(s) of grain left — resupply before autumn`)}
        </div>
      )}
    </section>
  );
}

/** Inline 8-slot mini map shown at the top of the CityPanel. Click to open full City Map. */
function CityMiniMap({
  city, onClick,
}: { city: import('../../game/types').City; onClick: () => void }) {
  // Dynamic import-style require would break SSR; import names at top of file are
  // fine here since we already import DEFENSE_BUILDINGS in CityMapScreen.
  // Use this lightweight reference for the slots.
  const slots = city.buildSlots ?? [];
  // Positions on a 160×160 mini grid (matches compass-rose layout).
  const POS = [
    { x: 80, y: 18  }, // N
    { x: 130, y: 38 }, // NE
    { x: 142, y: 80 }, // E
    { x: 130, y: 122 }, // SE
    { x: 80, y: 142 }, // S
    { x: 30, y: 122 }, // SW
    { x: 18, y: 80  }, // W
    { x: 30, y: 38  }, // NW
  ];
  const slotMap = new Map(slots.map((s) => [s.slot, s]));
  const builtCount = slots.filter((s) => s.buildingId).length;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'linear-gradient(180deg, #1b2531, #1a1408)',
        border: '1px solid #e6c473',
        padding: '0.5rem',
        margin: '0 0 0.5rem 0',
        cursor: 'pointer',
        display: 'flex',
        gap: '0.6rem',
        alignItems: 'center',
        fontFamily: 'inherit',
      }}
      title="Click to open full city map — build outer defenses"
    >
      <svg width="80" height="80" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {/* City walls in center */}
        <rect x="62" y="62" width="36" height="36" fill="#364654" stroke="#e6c473" strokeWidth="2" rx="2" />
        <text x="80" y="86" textAnchor="middle" fontSize="14" fill="#eef4f8" fontFamily="Songti SC, serif">
          {city.name.zh[0]}
        </text>
        {/* 8 slot dots */}
        {POS.map((p, idx) => {
          const slot = slotMap.get(idx);
          const built = !!slot?.buildingId;
          return (
            <g key={idx}>
              <circle
                cx={p.x} cy={p.y} r="9"
                fill={built ? '#e6c473' : 'none'}
                stroke={built ? '#eef4f8' : '#364654'}
                strokeWidth="1.2"
                strokeDasharray={built ? undefined : '2 2'}
              />
              {built && (
                <text x={p.x} y={p.y + 1} textAnchor="middle" fontSize="8" fill="#1a1408" fontWeight="bold">
                  {slot.level}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <CityMiniMapText builtCount={builtCount} wallTier={city.wallTier ?? 1} />
    </button>
  );
}

function CityMiniMapText({ builtCount, wallTier }: { builtCount: number; wallTier: number }) {
  const t = useT();
  return (
    <div style={{ textAlign: 'left', flex: 1 }}>
      <div style={{
        color: '#f2dd9a', fontSize: '0.95rem',
        letterSpacing: '0.07rem', fontWeight: 'bold',
        fontFamily: 'var(--tkm-font-zh)',
      }}>
        ⛩ {t('進城 · 城邑地圖', 'Enter City · City Map')}
      </div>
      <div style={{ color: '#aab6c0', fontSize: '0.68rem', letterSpacing: '0.1rem', marginTop: '0.15rem' }}>
        {builtCount}/8 {t('建築', 'buildings')} · {t('城壁', 'Wall')} Tier {wallTier}
      </div>
      <div style={{ color: '#7a8893', fontSize: '0.7rem', marginTop: '0.15rem' }}>
        {t('點擊進城建造 箭樓 / 拒馬 / 鐵索 …', 'Tap to enter — build towers / caltrops / chains …')}
      </div>
    </div>
  );
}

/**
 * 內政 — the four development bars, colour-coded by stat with at-a-glance
 * context: a ★ + "升城可破" hint when a stat is pinned at its size cap, an
 * amber/red loyalty warning when the populace grows restive (revolt risk),
 * and a "▸ 施政中" marker on whichever stat an officer is working this tick.
 */
function DevelopmentSection({ city, isPlayerCity }: { city: City; isPlayerCity: boolean }) {
  const t = useT();
  const econCap = cityEconCap(city);
  const statCap = citySize(city).statCap;
  const allPending = useGameStore((s) => s.pendingCommands);
  // Which dev stats have an order queued in this city this tick.
  const working = useMemo(() => {
    const w = { agriculture: false, commerce: false, defense: false, loyalty: false, caseload: false, hiddenHouseholds: false, hoardedGrain: false, armaments: false };
    if (!isPlayerCity) return w;
    for (const c of Object.values(allPending)) {
      if (c.cityId !== city.id) continue;
      if (c.type === 'develop-agriculture' || c.type === 'major-agriculture') w.agriculture = true;
      else if (c.type === 'develop-commerce' || c.type === 'major-commerce') w.commerce = true;
      else if (c.type === 'build-defense' || c.type === 'major-defense' || c.type === 'upgrade-wall' || c.type === 'drill-troops') w.defense = true;
      else if (c.type === 'improve-loyalty' || c.type === 'relief' || c.type === 'anti-corruption') w.loyalty = true;
      else if (c.type === 'adjudicate') { w.caseload = true; w.loyalty = true; }
      else if (c.type === 'household-audit') w.hiddenHouseholds = true;
      else if (c.type === 'curb-hoarding') { w.hoardedGrain = true; w.loyalty = true; }
      else if (c.type === 'arm-works') { w.armaments = true; }
      else if (c.type === 'military-farming') w.agriculture = true;
    }
    return w;
  }, [allPending, city.id, isPlayerCity]);

  const atCapNote = t('已達上限 · 升城可破', 'at cap · grow the city to raise it');
  const loyaltyNote = city.loyalty < 25
    ? t('民心離散 — 隨時生變,速安民!', 'populace in revolt — riots imminent, restore order!')
    : city.loyalty < 45
      ? t('民心浮動 — 謹防叛亂', 'restive — guard against revolt')
      : undefined;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('內政', 'Development')}</h3>
      <Bar icon="grain" label="Agriculture" zh="農業" value={city.agriculture} cap={econCap} tone="#7ed68a"
        working={working.agriculture} note={city.agriculture >= econCap ? atCapNote : undefined} />
      <Bar icon="gold" label="Commerce" zh="商業" value={city.commerce} cap={econCap} tone="#e6c473"
        working={working.commerce} note={city.commerce >= econCap ? atCapNote : undefined} />
      <Bar icon="shield" label="Defense" zh="守備" value={city.defense} cap={statCap} tone="#88b7e8"
        working={working.defense} note={city.defense >= statCap ? atCapNote : undefined} />
      {/* 老兵度 — only a garrison that has held a siege shows one. */}
      {(city.veterancy ?? 0) > 0 && (
        <Bar icon="shield" label="Veterancy" zh="老兵" value={city.veterancy ?? 0} cap={100} tone="#c9a24e"
          note={`守備 +${Math.round((city.veterancy ?? 0) * 0.12)}%`} />
      )}
      {/* 文教 — cultural renown; a 文化名城 at 60+ curbs graft & steadies loyalty. */}
      {(city.culture ?? 0) > 0 && (
        <Bar icon="flag" label="Culture" zh="文教" value={city.culture ?? 0} cap={100} tone="#a08fd0"
          note={(city.culture ?? 0) >= 60 ? '文化名城 · 息貪安民' : `息貪 −${Math.round((city.culture ?? 0) / 100 * 35)}%`} />
      )}
      {/* 囤積 (§1.14) — grain that exists but cannot be bought. */}
      {/* 傷兵 §4.11 — only while there are any. */}
      {(city.wounded ?? 0) > 0 && (
        <Bar icon="shield" label="Wounded" zh="傷兵" value={Math.round(city.wounded ?? 0)}
          cap={Math.max(1, Math.round((city.wounded ?? 0) * 1.4))} tone="#c07a7a"
          warn={(city.wounded ?? 0) >= city.troops * 0.08}
          note={t(`${woundedTier(city.wounded ?? 0, city.troops).zh} · 醫館/傷兵營、藥材與坐鎮智將決定幾人歸伍`,
                  `${woundedTier(city.wounded ?? 0, city.troops).en} · an infirmary, medicine and a physician decide how many return`)} />
      )}

      {/* 軍器 §1.18 — only worth surfacing where there is a garrison to arm. */}
      {city.troops >= 1000 && (
        <Bar icon="war" label="Armaments" zh="軍器" value={Math.round(city.armaments ?? 0)} cap={100} tone="#8fa6c0"
          warn={(city.armaments ?? 0) < 30}
          working={working.armaments}
          note={t(`${armamentTier(city.armaments).zh} · ${armamentEffects(city.armaments).badgeZh}`,
                  `${armamentTier(city.armaments).en} · ${armamentEffects(city.armaments).badgeEn}`)} />
      )}
      {(city.hoardedGrain ?? 0) >= 8 && (
        <Bar icon="grain" label="Hoarded" zh="囤積" value={Math.round(city.hoardedGrain ?? 0)} cap={40} tone="#c08a5a"
          warn={(city.hoardedGrain ?? 0) >= 20}
          working={working.hoardedGrain}
          note={t(`${hoardTier(city.hoardedGrain ?? 0).zh} · 遣吏「抑兼併」或建常平倉`,
                  `${hoardTier(city.hoardedGrain ?? 0).en} · assign 抑兼併 or build an ever-normal granary`)} />
      )}
      {/* 隱戶 (§1.12) — what the registers cannot see, the treasury cannot tax. */}
      {(city.hiddenHouseholds ?? 0) >= 6 && (
        <Bar icon="city" label="Off-books" zh="隱戶" value={Math.round(city.hiddenHouseholds ?? 0)} cap={45} tone="#8a9a7a"
          warn={(city.hiddenHouseholds ?? 0) >= 18}
          working={working.hiddenHouseholds}
          note={t(`${hiddenTier(city.hiddenHouseholds ?? 0).zh} · 租賦僅收 ${(registryYieldMul(city.hiddenHouseholds ?? 0) * 100).toFixed(0)}%`,
                  `${hiddenTier(city.hiddenHouseholds ?? 0).en} · only ${(registryYieldMul(city.hiddenHouseholds ?? 0) * 100).toFixed(0)}% taxed`)} />
      )}
      {/* 訟獄積案 (§1.11) — an unheard docket bleeds loyalty and breeds 冤獄. */}
      {(city.caseload ?? 0) >= 10 && (
        <Bar icon="scroll" label="Docket" zh="獄訟" value={Math.round(city.caseload ?? 0)} cap={100} tone="#b08a6a"
          warn={(city.caseload ?? 0) >= 55}
          working={working.caseload}
          note={t(`${caseloadTier(city.caseload ?? 0).zh} · 遣能吏「決獄」`, `${caseloadTier(city.caseload ?? 0).en} · assign 決獄`)} />
      )}
      <Bar icon="flag" label="Loyalty" zh="民忠" value={city.loyalty} cap={100} tone="#e08aa0"
        warn={city.loyalty < 45} working={working.loyalty} note={loyaltyNote} />
    </section>
  );
}

function Bar({ icon, label, zh, value, cap = 100, tone = '#9fb0bd', warn = false, working = false, note }: {
  icon?: IconName; label: string; zh: string; value: number; cap?: number;
  tone?: string; warn?: boolean; working?: boolean; note?: ReactNode;
}) {
  const lang = useLanguage();
  const t = useT();
  const atCap = value >= cap;
  const fill = warn
    ? 'linear-gradient(90deg, #8a2e22, #e0707a)'
    : atCap
      ? 'linear-gradient(90deg, #e6c473, #eef4f8)'
      : `linear-gradient(90deg, ${tone}55, ${tone})`;
  return (
    <div className={styles.barRow}>
      <div className={styles.barHeader}>
        <span className={styles.statLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {icon && <Icon name={icon} size={12} color={warn ? '#e0707a' : '#8a98a4'} />}
          {lang === 'en' ? label : zh}
          {lang === 'both' && <span className={styles.statZh}>{label}</span>}
          {working && <span style={{ fontSize: '0.7rem', color: '#7ed68a', letterSpacing: '0.05rem' }}>▸ {t('施政中', 'in progress')}</span>}
        </span>
        <span className={styles.barValue}>
          <AnimatedNumber value={value} flash /> / {cap}
          {atCap && <span style={{ marginLeft: 4, color: '#e6c473' }}>★</span>}
        </span>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${Math.min(100, (value / cap) * 100)}%`, background: fill }} />
      </div>
      {note && <div style={{ fontSize: '0.66rem', marginTop: 2, color: warn ? '#e0a0a0' : '#7a8893' }}>{note}</div>}
    </div>
  );
}

function CitySizeBadge({ city }: { city: import('../../game/types').City }) {
  const size = citySize(city);
  const next = nextTierPop(city);
  const t = useT();
  const lang = useLanguage();
  return (
    <section className={styles.section}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--tkm-font-zh)',
          // 矮屏(手機橫屏)經 .root 上的 --tkm-size-badge-fs 縮小徽章
          fontSize: 'var(--tkm-size-badge-fs, 1.4rem)',
          color: size.color,
          letterSpacing: '0.08rem',
          padding: '0.15rem 0.55rem',
          border: `1px solid ${size.color}`,
          borderRadius: 'var(--tkm-radius-xs)',
          background: 'rgba(212, 168, 74, 0.08)',
        }}>
          {lang === 'en' ? size.name.en : size.name.zh}
        </span>
        <div style={{ fontSize: '0.7rem', color: '#7a8893', letterSpacing: '0.1rem' }}>
          {lang === 'both' && <div>{size.name.en}</div>}
          <div>
            {t('上限', 'Cap')} {size.statCap} · {t('建設位', 'Slots')} {size.buildingSlots} · {size.troopCap.toLocaleString()} {t('兵', 'troops')}
          </div>
        </div>
      </div>
      {next && (
        <div style={{
          marginTop: '0.4rem',
          fontSize: '0.72rem',
          color: '#7a8893',
          letterSpacing: '0.05rem',
        }}>
          → <span style={{ color: next.def.color }}>{lang === 'en' ? next.def.name.en : next.def.name.zh}</span>
          {' '}{t('於', 'at')} {next.def.popMin.toLocaleString()} {t('人口', 'pop')}
          {' '}({next.popNeeded > 0 ? t(`尚需 ${next.popNeeded.toLocaleString()}`, `${next.popNeeded.toLocaleString()} more needed`) : t('已達成', 'ready')})
        </div>
      )}
    </section>
  );
}

function PolicyEffectsSection({
  city, cityOfficers,
}: { city: import('../../game/types').City; cityOfficers: Officer[] }) {
  const eff = cityPolicyEffects(city, cityOfficers);
  const locked = lockedPolicies(cityOfficers);
  const t = useT();
  if (eff.badges.length === 0 && locked.length === 0) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>★ {t('政策效果', 'Policy Effects')}</h3>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.3rem',
        fontSize: '0.7rem',
      }}>
        {eff.badges.map((b, i) => (
          <span
            key={i}
            style={{
              padding: '0.18rem 0.45rem',
              background: 'rgba(212, 168, 74, 0.12)',
              border: '1px solid rgba(212, 168, 74, 0.4)',
              color: '#e6c473',
              borderRadius: 'var(--tkm-radius-xs)',
              letterSpacing: '0.05rem',
              fontFamily: 'var(--tkm-font-zh)',
            }}
          >
            {b}
          </span>
        ))}
        {locked.map(({ id, missing }) => {
          const me = POLICY_DEFS[id];
          const missLabel = missing.map((m) => POLICY_DEFS[m]?.zh ?? m).join('、');
          return (
            <span
              key={`locked-${id}`}
              title={`${me?.zh ?? id} ${t('需要', 'requires')}: ${missLabel}`}
              style={{
                padding: '0.18rem 0.45rem',
                background: 'rgba(90, 70, 60, 0.4)',
                border: '1px dashed rgba(138, 112, 80, 0.6)',
                color: '#7a8893',
                borderRadius: 'var(--tkm-radius-xs)',
                letterSpacing: '0.05rem',
                fontFamily: 'var(--tkm-font-zh)',
                textDecoration: 'line-through',
              }}
            >
              🔒 {me?.zh ?? id}
            </span>
          );
        })}
      </div>
      <div style={{
        marginTop: '0.4rem', fontSize: '0.72rem', color: '#7a8893',
        letterSpacing: '0.1rem',
      }}>
        {cityOfficers.length} {t('武將在城 · 政策由其個人專業聚合而成', 'officers stationed · policies emerge from their personal specialties')}
        {locked.length > 0 && ` · ${locked.length} ${t('政策待解鎖', 'policies need prereqs')}`}
      </div>
    </section>
  );
}

/** 遷都 — designate this owned city as the realm's seat (治所). The current
 *  capital shows a badge; other owned cities offer a relocate button. */
function CapitalControls({ cityId }: { cityId: EntityId }) {
  const city = useGameStore((s) => s.cities[cityId]);
  const isCapital = useGameStore((s) => {
    const f = city?.ownerForceId ? s.forces[city.ownerForceId] : null;
    return f?.capitalCityId === cityId;
  });
  const relocateCapital = useGameStore((s) => s.relocateCapital);
  const capitalMoveUsed = useGameStore((s) => s.capitalMoveUsed);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const t = useT();
  if (!city || city.ruined) return null;

  if (isCapital) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('治所', 'Capital')}</h3>
        <div className={styles.muted}>
          {t('★ 本軍治所 — 政令外交所出,每季 +3 民忠;若失守,全境民心動搖。',
             '★ The realm\'s seat — edicts & diplomacy issue here, +3 loyalty/season. If it falls, the whole realm reels.')}
        </div>
      </section>
    );
  }

  const free = !capitalMoveUsed;
  const cost = free ? 0 : 800;
  const afford = city.gold >= cost;
  const costLabel = free ? t('首遷免費', 'first move free') : `−${cost}g`;
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('遷都', 'Relocate Capital')}</h3>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={!afford}
          style={{
            background: '#14202a', color: afford ? '#7ec0d6' : '#7a8893',
            border: '1px solid ' + (afford ? '#3a6a7a' : '#26323e'),
            padding: '0.4rem 0.8rem', cursor: afford ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: '0.82rem', opacity: afford ? 1 : 0.6,
          }}
        >{t('遷都至此', 'Make this the capital')} ({costLabel})</button>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#7ec0d6', fontSize: '0.78rem' }}>
            {t('遷治所至此城?', 'Move the seat of power here?')}
          </span>
          <button
            onClick={() => { const r = relocateCapital(cityId); setMsg(r.message); setConfirming(false); }}
            style={{
              background: '#1a2a3a', color: '#7ec0d6', border: '1px solid #3a6a7a',
              padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
            }}
          >{t('確認遷都', 'Confirm')}</button>
          <button
            onClick={() => setConfirming(false)}
            style={{
              background: 'transparent', color: '#97a4ae', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
              padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
            }}
          >{t('取消', 'Cancel')}</button>
        </div>
      )}
      {msg && <div className={styles.muted} style={{ marginTop: '0.4rem', color: '#7ec0d6' }}>{msg}</div>}
    </section>
  );
}

/** 焦土／重建 — scorched-earth denial of an owned city, and reconstruction of
 *  a ruined one. Razing is destructive + irreversible, so it asks twice. */
function RuinControls({ cityId }: { cityId: EntityId }) {
  const city = useGameStore((s) => s.cities[cityId]);
  const isCapital = useGameStore((s) => {
    const f = city?.ownerForceId ? s.forces[city.ownerForceId] : null;
    return f?.capitalCityId === cityId;
  });
  const razeCity = useGameStore((s) => s.razeCity);
  const rebuildCity = useGameStore((s) => s.rebuildCity);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const t = useT();
  if (!city) return null;

  if (city.ruined) {
    const cost = rebuildCost(city);
    const afford = city.gold >= cost;
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('廢墟', 'Ruins')}</h3>
        <div className={styles.muted} style={{ marginBottom: '0.4rem' }}>
          {t('此城已成焦土,生產凋敝。重建可興復流民。', 'Razed to ruins — production gutted. Rebuild to recover.')}
        </div>
        <button
          onClick={() => { const r = rebuildCity(cityId); setMsg(r.message); }}
          disabled={!afford}
          style={{
            background: '#1a2a1a', color: afford ? '#7ed68a' : '#7a8893',
            border: '1px solid ' + (afford ? '#5a7a3a' : '#26323e'),
            padding: '0.4rem 0.8rem', cursor: afford ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: '0.82rem', opacity: afford ? 1 : 0.6,
          }}
        >{t('重建', 'Rebuild')} (−{cost}g)</button>
        {msg && <div className={styles.muted} style={{ marginTop: '0.4rem', color: '#7ed68a' }}>{msg}</div>}
      </section>
    );
  }

  if (isCapital) return null; // never raze your own seat

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('焦土', 'Scorched Earth')}</h3>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{
            background: '#2a1410', color: '#d98a6a', border: '1px solid #6a3520',
            padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
          }}
        >{t('焚城焦土…', 'Raze to ruins…')}</button>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#ff8060', fontSize: '0.78rem' }}>
            {t('堅壁清野?不可逆!', 'Deny it to the enemy? Irreversible!')}
          </span>
          <button
            onClick={() => { const r = razeCity(cityId); setMsg(r.message); setConfirming(false); }}
            style={{
              background: '#3a1a1a', color: '#ff8060', border: '1px solid #b8442e',
              padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
            }}
          >{t('確認焚城', 'Confirm')}</button>
          <button
            onClick={() => setConfirming(false)}
            style={{
              background: 'transparent', color: '#97a4ae', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
              padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
            }}
          >{t('取消', 'Cancel')}</button>
        </div>
      )}
      {msg && <div className={styles.muted} style={{ marginTop: '0.4rem', color: '#d98a6a' }}>{msg}</div>}
    </section>
  );
}
