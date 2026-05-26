import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { cityPolicyEffects, lockedPolicies } from '../../game/systems/policyEffects';
import { POLICY_DEFS } from '../../game/data/officerAttributes';
import { citySize, nextTierPop } from '../../game/systems/citySize';
import type { EntityId, Officer } from '../../game/types';
import { CityMapScreen } from '../screens/CityMapScreen';
import { CityMapScreen3D } from '../screens/CityMapScreen3D';
import { BuildingsPanel } from './BuildingsPanel';
import { CaptivesSection } from './CaptivesSection';
import { CommandMenu } from './CommandMenu';
import { FreeAgentsSection } from './FreeAgentsSection';
import { OfficerHoverCard } from './OfficerHoverCard';
import { TERRAIN_DEFS } from '../../game/data/cities';
import { PROVINCE_BY_CITY, PROVINCES_BY_ID } from '../../game/data';
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

  const [showCityMap, setShowCityMap] = useState(false);
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
              <span style={{ background: '#1a1410', border: `1px solid ${terrain.color}`, color: terrain.color, padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                {lang === 'en' ? terrain.en : terrain.zh}
                {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#8a7050', fontStyle: 'italic' }}>{terrain.en}</span></>}
              </span>
              {city.port && (
                <span style={{ background: '#1a1410', border: '1px solid #88b7e8', color: '#88b7e8', padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? 'Port' : '港'}
                  {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#5a7090', fontStyle: 'italic' }}>Port</span></>}
                </span>
              )}
              {province && (
                <span style={{ background: '#1a1410', border: `1px solid ${province.color}`, color: province.color, padding: '0.15rem 0.4rem', letterSpacing: '0.1rem' }}>
                  {lang === 'en' ? province.name.en : province.name.zh}
                  {lang === 'both' && <> <span style={{ fontSize: '0.6rem', color: '#8a7050', fontStyle: 'italic' }}>{province.name.en}</span></>}
                </span>
              )}
            </div>
          );
        })()}
      </header>

      {/* City size badge — derived from population */}
      <CitySizeBadge city={city} />

      {/* Inline mini-map preview — clicking opens the full screen.
          Shows the city walls + 8 build slots so the player can see at a
          glance what's built and what's not. */}
      <CityMiniMap city={city} onClick={() => setShowCityMap(true)} />

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('資源', 'Resources')}</h3>
        <Stat label="Population" zh="人口" value={city.population.toLocaleString()} />
        <Stat label="Gold" zh="金" value={city.gold.toLocaleString()} />
        <Stat label="Food" zh="兵糧" value={city.food.toLocaleString()} />
        <Stat label="Troops" zh="兵士" value={`${city.troops.toLocaleString()} / ${citySize(city).troopCap.toLocaleString()}`} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('內政', 'Development')}</h3>
        <Bar label="Agriculture" zh="農業" value={city.agriculture} cap={citySize(city).statCap} />
        <Bar label="Commerce" zh="商業" value={city.commerce} cap={citySize(city).statCap} />
        <Bar label="Defense" zh="守備" value={city.defense} cap={citySize(city).statCap} />
        <Bar label="Loyalty" zh="民忠" value={city.loyalty} cap={100} />
      </section>

      {/* Active policy effects from resident officers — REAL gameplay impact */}
      <PolicyEffectsSection city={city} cityOfficers={officers} />

      {isPlayerCity && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('命令', 'Orders')}</h3>
          <CommandMenu cityId={city.id} onOpenCityMap={() => setShowCityMap(true)} />
        </section>
      )}

      {isPlayerCity && <BuildingsPanel cityId={city.id} />}

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
              border: '1px solid #4a3520',
              color: cityGold >= 50 ? '#d4a84a' : '#5a4530',
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
          `W${o.stats.war} I${o.stats.intelligence} P${o.stats.politics} C${o.stats.charisma}`
        )}
      </span>
      {transferOpen && canTransfer && (
        <div
          style={{
            gridColumn: '1 / -1',
            marginTop: '0.25rem',
            padding: '0.3rem',
            background: '#1a1410',
            border: '1px solid #4a3520',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}
        >
          {adjacent.length === 0 ? (
            <span
              style={{
                color: '#8a7050',
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
                  background: '#2a1f15',
                  border: '1px solid #3a2d20',
                  color: '#d4a84a',
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

function Stat({ label, zh, value }: { label: string; zh: string; value: string }) {
  const lang = useLanguage();
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>
        {lang === 'en' ? label : zh}
        {lang === 'both' && <> <span className={styles.statZh}>{label}</span></>}
      </span>
      <span className={styles.statValue}>{value}</span>
    </div>
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
        background: 'linear-gradient(180deg, #2a1f15, #1a1408)',
        border: '1px solid #d4a84a',
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
        <rect x="62" y="62" width="36" height="36" fill="#5a4530" stroke="#d4a84a" strokeWidth="2" rx="2" />
        <text x="80" y="86" textAnchor="middle" fontSize="14" fill="#f0e0b0" fontFamily="Songti SC, serif">
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
                fill={built ? '#d4a84a' : 'none'}
                stroke={built ? '#f0e0b0' : '#5a4530'}
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
        color: '#d4a84a', fontSize: '0.85rem',
        letterSpacing: '0.2rem', fontWeight: 'bold',
        fontFamily: 'var(--tkm-font-zh)',
      }}>
        ★ {t('城邑地圖', 'City Map')}
      </div>
      <div style={{ color: '#c0a878', fontSize: '0.68rem', letterSpacing: '0.1rem' }}>
        {builtCount}/8 {t('建築', 'buildings')} · {t('城壁', 'Wall')} Tier {wallTier}
      </div>
      <div style={{ color: '#8a7050', fontSize: '0.6rem', marginTop: '0.15rem' }}>
        {t('點擊建造 箭樓 / 拒馬 / 鐵索 / 落石…', 'Click to build towers / caltrops / chains / boulders…')}
      </div>
    </div>
  );
}

function Bar({ label, zh, value, cap = 100 }: { label: string; zh: string; value: number; cap?: number }) {
  const lang = useLanguage();
  const atCap = value >= cap;
  return (
    <div className={styles.barRow}>
      <div className={styles.barHeader}>
        <span className={styles.statLabel}>
          {lang === 'en' ? label : zh}
          {lang === 'both' && <> <span className={styles.statZh}>{label}</span></>}
        </span>
        <span className={styles.barValue}>
          {value} / {cap}
          {atCap && <span style={{ marginLeft: 4, color: '#d4a84a' }}>★</span>}
        </span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{
            width: `${Math.min(100, (value / cap) * 100)}%`,
            background: atCap ? 'linear-gradient(90deg, #d4a84a, #f0e0b0)' : undefined,
          }}
        />
      </div>
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
          letterSpacing: '0.25rem',
          padding: '0.15rem 0.55rem',
          border: `1px solid ${size.color}`,
          borderRadius: 2,
          background: 'rgba(212, 168, 74, 0.08)',
        }}>
          {lang === 'en' ? size.name.en : size.name.zh}
        </span>
        <div style={{ fontSize: '0.7rem', color: '#8a7050', letterSpacing: '0.1rem' }}>
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
          color: '#8a7050',
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
              color: '#d4a84a',
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
                color: '#8a7050',
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
        marginTop: '0.4rem', fontSize: '0.65rem', color: '#8a7050',
        letterSpacing: '0.1rem',
      }}>
        {cityOfficers.length} {t('武將在城 · 政策由其個人專業聚合而成', 'officers stationed · policies emerge from their personal specialties')}
        {locked.length > 0 && ` · ${locked.length} ${t('政策待解鎖', 'policies need prereqs')}`}
      </div>
    </section>
  );
}
