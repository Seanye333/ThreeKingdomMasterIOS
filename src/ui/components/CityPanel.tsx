import { useMemo, useState, type ReactNode } from 'react';
import { cityEconCap } from '../../game/systems/citySize';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { cityPolicyEffects, lockedPolicies } from '../../game/systems/policyEffects';
import { POLICY_DEFS } from '../../game/data/officerAttributes';
import { citySize, nextTierPop } from '../../game/systems/citySize';
import { tickCityEconomy } from '../../game/systems/economy';
import type { City, EntityId, Officer } from '../../game/types';
import { CityMapScreen } from '../screens/CityMapScreen';
import { CityMapScreen3D } from '../screens/CityMapScreen3D';
import { BuildingsPanel } from './BuildingsPanel';
import { AnimatedNumber } from './AnimatedNumber';
import { CaptivesSection } from './CaptivesSection';
import { CommandMenu } from './CommandMenu';
import { ConvoyDispatchModal } from './ConvoyDispatchModal';
import { FreeAgentsSection } from './FreeAgentsSection';
import { Icon, type IconName } from './Icon';
import { OfficerStats } from './OfficerStats';
import { OfficerHoverCard } from './OfficerHoverCard';
import { TERRAIN_DEFS } from '../../game/data/cities';
import { PROVINCE_BY_CITY, PROVINCES_BY_ID } from '../../game/data';
import { rebuildCost } from '../../game/systems/cityRuin';
import styles from './CityPanel.module.css';
import { useT, useLanguage } from '../i18n';

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
  const setShowCityMap = (open: boolean) => (open ? openCityMap() : closeCityMap());
  // Default to 3D city map; user can switch to 2D inside the modal.
  const [use3DCityMap, setUse3DCityMap] = useState(true);
  const t = useT();
  const lang = useLanguage();

  if (!city) {
    return (
      <aside className={styles.root}>
        <div className={styles.empty}>{t('於地圖選擇城市', 'Select a city on the map')}</div>
      </aside>
    );
  }

  const isPlayerCity = city.ownerForceId === playerForceId;

  return (
    <aside className={styles.root}>
      <header className={styles.header}>
        {lang !== 'en' && <div className={styles.nameZh}>{city.name.zh}</div>}
        {lang !== 'zh' && <div className={styles.nameEn}>{city.name.en}</div>}
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
                {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#7a8893', fontStyle: 'italic' }}>{terrain.en}</span></>}
              </span>
              {city.port && (
                <span style={{ background: '#10161e', border: '1px solid #88b7e8', color: '#88b7e8', padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? 'Port' : '港'}
                  {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#5a7090', fontStyle: 'italic' }}>Port</span></>}
                </span>
              )}
              {province && (
                <span style={{ background: '#10161e', border: `1px solid ${province.color}`, color: province.color, padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? province.name.en : province.name.zh}
                  {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#7a8893', fontStyle: 'italic' }}>{province.name.en}</span></>}
                </span>
              )}
            </div>
          );
        })()}
      </header>

      {/* City size badge — derived from population */}
      <CitySizeBadge city={city} />

      {/* Inline mini-map preview — the single "enter city" entry. Clicking
          opens the full 3D city map; it also shows walls + 8 build slots so
          the player sees at a glance what's built. Reliable tap target on
          mobile (the re-click-to-enter gesture only works with a mouse). */}
      <CityMiniMap city={city} onClick={() => setShowCityMap(true)} />

      <ResourcesSection city={city} cityOfficers={officers} isPlayerCity={isPlayerCity} />

      <GrainTransferSection cityId={city.id} isPlayerCity={isPlayerCity} />

      <DevelopmentSection city={city} isPlayerCity={isPlayerCity} />

      {/* Active policy effects from resident officers — REAL gameplay impact */}
      <PolicyEffectsSection city={city} cityOfficers={officers} />

      {isPlayerCity && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('命令', 'Orders')}</h3>
          <CommandMenu cityId={city.id} />
        </section>
      )}

      {isPlayerCity && <BuildingsPanel cityId={city.id} />}

      {isPlayerCity && <RuinControls cityId={city.id} />}

      <FreeAgentsSection cityId={city.id} isPlayerCity={isPlayerCity} />

      {isPlayerCity && <CaptivesSection cityId={city.id} />}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t('武將', 'Officers')} ({officers.length})
        </h3>
        {officers.length === 0 ? (
          <div className={styles.muted}>{t('無武將駐紮。', 'No officers stationed.')}</div>
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
      {showCityMap && (use3DCityMap ? (
        <CityMapScreen3D
          cityId={city.id}
          onClose={() => setShowCityMap(false)}
          onSwitch2D={() => setUse3DCityMap(false)}
        />
      ) : (
        <CityMapScreen
          cityId={city.id}
          onClose={() => setShowCityMap(false)}
          onSwitch3D={() => setUse3DCityMap(true)}
        />
      ))}
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
            cursor: escortCount === 0 ? 'not-allowed' : 'pointer', borderRadius: 4, letterSpacing: '0.05rem',
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
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#aab6c0', background: '#10161e', border: '1px solid #1d2731', borderRadius: 3, padding: '0.18rem 0.45rem' }}>
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
  const taskDef = o.task ? COMMAND_DEFS[o.task] : null;
  const canTransfer = isPlayerCity && !o.task && o.status === 'idle';
  const t = useT();
  const lang = useLanguage();

  return (
    <li className={styles.officerRow}>
      <OfficerHoverCard officer={o}>
        {lang !== 'en' && <span className={styles.officerNameZh}>{o.name.zh}</span>}
        {lang !== 'zh' && <span className={styles.officerNameEn}>{o.name.en}</span>}
      </OfficerHoverCard>
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
              fontSize: '0.65rem',
              cursor: cityGold >= 50 ? 'pointer' : 'not-allowed',
              letterSpacing: '0.05rem',
            }}
            disabled={cityGold < 50}
          >
            {t('移送', 'Transfer')} ⇨
          </button>
        ) : (
          <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} lang={lang === 'en' ? 'en' : 'zh'} />
        )}
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
  const size = citySize(city);

  // Mirror the resolution tick so the quoted numbers match what actually lands.
  const proj = useMemo(() => {
    if (!isPlayerCity) return null;
    const tax = taxPolicy?.[city.ownerForceId ?? ''] ?? 'normal';
    const now = tickCityEconomy(city, season, cityOfficers, tax, inflation);
    const harvest = season === 'autumn' ? now.foodIncome : tickCityEconomy(city, 'autumn', cityOfficers, tax, inflation).foodIncome;
    return { now, harvest };
  }, [city, cityOfficers, season, taxPolicy, inflation, isPlayerCity]);

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

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('資源', 'Resources')}</h3>
      {row('city', '人口', 'Population', city.population, proj && season === 'autumn' && proj.now.populationDelta !== 0
        ? { delta: `${proj.now.populationDelta > 0 ? '+' : ''}${proj.now.populationDelta.toLocaleString()}`, tone: proj.now.populationDelta > 0 ? '#7ed68a' : '#e0707a' }
        : undefined)}
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
      {/* 缺糧警示 — a real, imminent problem the player should act on */}
      {proj && desertion > 0 && (
        <div style={{ marginTop: 4, fontSize: '0.7rem', color: '#f0a0a0', background: 'rgba(180,60,50,0.12)', border: '1px solid #7a3030', borderRadius: 3, padding: '0.2rem 0.45rem' }}>
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
      <div style={{ color: '#7a8893', fontSize: '0.6rem', marginTop: '0.15rem' }}>
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
    const w = { agriculture: false, commerce: false, defense: false, loyalty: false };
    if (!isPlayerCity) return w;
    for (const c of Object.values(allPending)) {
      if (c.cityId !== city.id) continue;
      if (c.type === 'develop-agriculture' || c.type === 'major-agriculture') w.agriculture = true;
      else if (c.type === 'develop-commerce' || c.type === 'major-commerce') w.commerce = true;
      else if (c.type === 'build-defense' || c.type === 'major-defense' || c.type === 'upgrade-wall') w.defense = true;
      else if (c.type === 'improve-loyalty') w.loyalty = true;
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
          {working && <span style={{ fontSize: '0.6rem', color: '#7ed68a', letterSpacing: '0.05rem' }}>▸ {t('施政中', 'in progress')}</span>}
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
          fontSize: '1.4rem',
          color: size.color,
          letterSpacing: '0.08rem',
          padding: '0.15rem 0.55rem',
          border: `1px solid ${size.color}`,
          borderRadius: 2,
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
          fontSize: '0.65rem',
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
              borderRadius: '2px',
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
                borderRadius: '2px',
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
        marginTop: '0.4rem', fontSize: '0.65rem', color: '#7a8893',
        letterSpacing: '0.1rem',
      }}>
        {cityOfficers.length} {t('武將在城 · 政策由其個人專業聚合而成', 'officers stationed · policies emerge from their personal specialties')}
        {locked.length > 0 && ` · ${locked.length} ${t('政策待解鎖', 'policies need prereqs')}`}
      </div>
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
              background: 'transparent', color: '#97a4ae', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
            }}
          >{t('取消', 'Cancel')}</button>
        </div>
      )}
      {msg && <div className={styles.muted} style={{ marginTop: '0.4rem', color: '#d98a6a' }}>{msg}</div>}
    </section>
  );
}
