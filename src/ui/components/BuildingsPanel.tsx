import { BUILDING_DEFS } from '../../game/data';
import { buildingBonuses } from '../../game/systems/buildings';
import { citySpecialty } from '../../game/data/specialties';
import { useGameStore } from '../../game/state/store';
import type { BuildingId, EntityId } from '../../game/types';
import { useT, useLanguage, useDesc } from '../i18n';

// Stable reference for the "no queue" case — avoids returning a fresh []
// from the selector each render (which would loop-detect in React 19's
// useSyncExternalStore).
const EMPTY_QUEUE: BuildingId[] = [];

interface Props {
  cityId: EntityId;
}

export function BuildingsPanel({ cityId }: Props) {
  const buildings = useGameStore((s) => s.buildings);
  const cities = useGameStore((s) => s.cities);
  const startBuilding = useGameStore((s) => s.startBuilding);
  const autoQueueRaw = useGameStore((s) => s.autoBuildQueues[cityId]);
  const autoQueue = autoQueueRaw ?? EMPTY_QUEUE;
  const setAutoBuildQueue = useGameStore((s) => s.setAutoBuildQueue);
  const city = cities[cityId];
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  if (!city) return null;
  const bonuses = buildingBonuses(cityId, buildings);
  const specialty = citySpecialty(cityId);

  return (
    <div style={{ background: '#1a1410', border: '1px solid #4a3520', padding: '0.6rem', marginTop: '0.6rem' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.2rem', color: '#8a7050', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {t('建設', 'Buildings')}
      </div>
      {specialty && (
        <div style={{ fontSize: '0.72rem', color: '#e0c070', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '1.25rem', height: '1.25rem', borderRadius: 3,
            background: '#3a2c14', border: '1px solid #c9a23c',
            fontFamily: '"Songti SC", serif', fontSize: '0.8rem',
          }}>{specialty.glyph}</span>
          <span>{t('特產', 'Specialty')}：{specialty.zh}</span>
          <span style={{ color: '#9a8a60', fontSize: '0.66rem' }}>{specialty.noteZh}</span>
        </div>
      )}
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', color: '#c0a878', marginBottom: '0.5rem' }}>
        {t('徵兵', 'Recruit')} ×{bonuses.recruitMul.toFixed(2)} · {t('商業', 'Commerce')} ×{bonuses.commerceMul.toFixed(2)} · {t('糧草', 'Food')} ×{bonuses.agricultureMul.toFixed(2)} · {t('民忠', 'Loyalty')} +{bonuses.loyaltyPerSeason}/{t('季', 'season')} · {t('守備', 'Defense')} +{bonuses.defenseAdd}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.3rem' }}>
        {BUILDING_DEFS.map((d) => {
          const b = buildings.find((x) => x.cityId === cityId && x.id === d.id);
          const lvl = b?.level ?? 0;
          const inProgress = (b?.progress ?? 0) > 0 && lvl < d.maxLevel;
          const canBuild =
            city.ownerForceId !== null &&
            !inProgress &&
            lvl < d.maxLevel &&
            city.gold >= d.goldPerLevel;
          return (
            <button
              key={d.id}
              onClick={() => startBuilding(cityId, d.id as BuildingId)}
              disabled={!canBuild}
              style={{
                background: '#0a0805',
                border: '1px solid ' + (canBuild ? '#d4a84a' : '#3a2d20'),
                color: canBuild ? '#d4a84a' : '#8a7050',
                padding: '0.4rem 0.5rem',
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: canBuild ? 'pointer' : 'not-allowed',
                opacity: canBuild ? 1 : 0.6,
              }}
              title={desc(d)}
            >
              <div style={{ fontSize: '0.78rem' }}>
                {lang === 'en' ? d.name.en : lang === 'both' ? `${d.name.zh} ${d.name.en}` : d.name.zh} {lvl > 0 && `Lv.${lvl}`}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#8a7050' }}>
                {inProgress
                  ? t(`建造中 (${b?.progress ?? 0}/${d.seasonsPerLevel}季)`, `building (${b?.progress ?? 0}/${d.seasonsPerLevel}s)`)
                  : lvl >= d.maxLevel
                    ? t('已達上限', 'max')
                    : `${d.goldPerLevel}g · ${d.seasonsPerLevel}${t('季', 's')}`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Auto-build queue */}
      <div style={{ marginTop: '0.5rem', borderTop: '1px dotted #3a2d20', paddingTop: '0.4rem' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.2rem', color: '#8a7050', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
          {t('自動建造佇列', 'Auto-Build Queue')} {autoQueue.length > 0 && `(${autoQueue.length})`}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
          {autoQueue.map((bid, i) => {
            const def = BUILDING_DEFS.find((b) => b.id === bid);
            const label = def ? (lang === 'en' ? def.name.en : def.name.zh) : bid;
            return (
              <span
                key={i}
                onClick={() => setAutoBuildQueue(cityId, autoQueue.filter((_, j) => j !== i))}
                style={{
                  background: '#0a0805',
                  border: '1px solid #3a2d20',
                  color: '#c0a878',
                  padding: '0.15rem 0.4rem',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
                title={t('點擊移除', 'Click to remove')}
              >
                {i + 1}. {label} ×
              </span>
            );
          })}
          {/* Add buttons for each building type */}
          {BUILDING_DEFS.map((d) => (
            <button
              key={d.id}
              onClick={() => setAutoBuildQueue(cityId, [...autoQueue, d.id as BuildingId])}
              style={{
                background: 'transparent',
                border: '1px dashed #3a2d20',
                color: '#8a7050',
                padding: '0.15rem 0.4rem',
                fontSize: '0.65rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title={t(`加入 ${d.name.zh} 至佇列`, `Queue ${d.name.en}`)}
            >
              + {lang === 'en' ? d.name.en : d.name.zh}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
