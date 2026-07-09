import { Fragment, useState } from 'react';
import { BUILDING_DEFS } from '../../game/data';
import { BUILDING_CATEGORY, BUILDING_CATEGORY_LABEL } from '../../game/data/buildings';
import { citySize } from '../../game/systems/citySize';
import { buildingBonuses, SCHOOL_BUILDINGS } from '../../game/systems/buildings';
import { citySpecialty, cityRole, ROLE_ZH, SPECIALTY_DEV_MAX, SPECIALTY_DEV_GAIN } from '../../game/data/specialties';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import type { BuildingCategory, BuildingId, EntityId } from '../../game/types';
import { useT, useLanguage, useDesc } from '../i18n';
import { Modal } from './Modal';

// Stable reference for the "no queue" case — avoids returning a fresh []
// from the selector each render (which would loop-detect in React 19's
// useSyncExternalStore).
const EMPTY_QUEUE: BuildingId[] = [];

// 圖冊分類 — the modal's grid groups buildings by trade so 40+ entries scan.
const CATEGORY_ORDER: BuildingCategory[] = ['economy', 'agriculture', 'military', 'defense', 'culture', 'civic', 'intel'];

interface Props {
  cityId: EntityId;
}

export function BuildingsPanel({ cityId }: Props) {
  const buildings = useGameStore((s) => s.buildings);
  const cities = useGameStore((s) => s.cities);
  const startBuilding = useGameStore((s) => s.startBuilding);
  const repairBuilding = useGameStore((s) => s.repairBuilding);
  const developSpecialty = useGameStore((s) => s.developSpecialty);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const autoQueueRaw = useGameStore((s) => s.autoBuildQueues[cityId]);
  const autoQueue = autoQueueRaw ?? EMPTY_QUEUE;
  const setAutoBuildQueue = useGameStore((s) => s.setAutoBuildQueue);
  const officers = useGameStore((s) => s.officers);
  const assignHeadmaster = useGameStore((s) => s.assignHeadmaster);
  const city = cities[cityId];
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  // 營造圖冊 — the full building list lives in a popup so the city panel
  // stays short; inline we keep only the bonus summary + launcher.
  const [open, setOpen] = useState(false);
  if (!city) return null;
  const bonuses = buildingBonuses(cityId, buildings);
  const specialty = citySpecialty(cityId);

  const mine = buildings.filter((b) => b.cityId === cityId);
  const inProgressCount = mine.filter((b) => (b.progress ?? 0) > 0).length;
  const damagedCount = mine.filter((b) => b.damaged).length;
  // 建設位 — the same cap the store enforces (and the 3D city screen shows),
  // so both build entries tell one story.
  const slotsUsed = mine.length;
  const slotsCap = citySize(city).buildingSlots;
  const atSlotCap = slotsUsed >= slotsCap;

  const summaryLine = (margin: string) => (
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', color: '#aab6c0', marginBottom: margin }}>
      {t('徵兵', 'Recruit')} ×{bonuses.recruitMul.toFixed(2)} · {t('商業', 'Commerce')} ×{bonuses.commerceMul.toFixed(2)} · {t('糧草', 'Food')} ×{bonuses.agricultureMul.toFixed(2)} · {t('民忠', 'Loyalty')} +{bonuses.loyaltyPerSeason}/{t('季', 'season')} · {t('守備', 'Defense')} +{bonuses.defenseAdd}
    </div>
  );

  return (
    <div style={{ background: '#10161e', border: '1px solid #2b3845', padding: '0.6rem', marginTop: '0.6rem' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        {t('建設', 'Buildings')}
      </div>
      {summaryLine('0.4rem')}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', background: '#080b0e', border: '1px solid #e6c473', color: '#e6c473',
          padding: '0.4rem 0.5rem', fontFamily: 'inherit', fontSize: '0.75rem',
          textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem',
        }}
      >
        <span>⚒ {t('營造 · 建設圖冊', 'Construction')}</span>
        <span style={{ fontSize: '0.68rem', color: '#aab6c0' }}>
          <span style={{ color: atSlotCap ? '#e05a3a' : undefined }}>
            {t(`建設位 ${slotsUsed}/${slotsCap}`, `slots ${slotsUsed}/${slotsCap}`)}
          </span>
          {inProgressCount > 0 && ` · ${t(`建造中 ${inProgressCount}`, `in progress ${inProgressCount}`)}`}
          {autoQueue.length > 0 && ` · ${t(`佇列 ${autoQueue.length}`, `queued ${autoQueue.length}`)}`}
          {damagedCount > 0 && <span style={{ color: '#e05a3a' }}> · {t(`損毀 ${damagedCount}`, `wrecked ${damagedCount}`)}</span>}
        </span>
      </button>
      {open && (
        <Modal
          onClose={() => setOpen(false)}
          title={t('營造 · 建設', 'Construction')}
          icon="⚒"
          badge={`${lang !== 'en' ? city.name.zh : city.name.en} · ${t(`建設位 ${slotsUsed}/${slotsCap}`, `slots ${slotsUsed}/${slotsCap}`)}`}
          scrollBody
          width="min(640px, 100%)"
          ariaLabel={t('建設', 'Buildings')}
        >
          {specialty && (() => {
            const dev = city.specialtyDev ?? 0;
            const role = cityRole(cityId);
            const maxed = dev >= SPECIALTY_DEV_MAX;
            const cost = Math.round((600 + 600 * dev) * (1 - Math.min(0.3, city.commerce / 400)));
            const owned = city.ownerForceId === playerForceId;
            const canDev = owned && !maxed && city.loyalty >= 40 && city.gold >= cost;
            const edgePct = Math.round(dev * SPECIALTY_DEV_GAIN * 100);
            return (
              <div style={{ marginBottom: '0.45rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#e0c070', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '1.25rem', height: '1.25rem', borderRadius: 'var(--tkm-radius-xs)',
                    background: '#3a2c14', border: '1px solid #c9a23c',
                    fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem',
                  }}>{specialty.glyph}</span>
                  <span>{t('特產', 'Specialty')}：{specialty.zh}</span>
                  <span style={{ color: '#c9a23c', letterSpacing: '0.05rem' }} title={t(`發展度 ${dev}/${SPECIALTY_DEV_MAX}`, `Development ${dev}/${SPECIALTY_DEV_MAX}`)}>
                    {'★'.repeat(dev)}{'☆'.repeat(SPECIALTY_DEV_MAX - dev)}
                  </span>
                  {role && <span style={{ color: '#7a9ac0', fontSize: '0.64rem' }}>{t('戰略物資', 'Strategic')}：{ROLE_ZH[role]}</span>}
                </div>
                <div style={{ fontSize: '0.66rem', color: '#9a8a60', marginTop: '0.2rem' }}>
                  {specialty.noteZh}{dev > 0 && `(名產作坊 +${edgePct}%)`}
                  {role === 'medicine' && (city.medicine ?? 0) > 0 && ` · ${t('藥材', 'Medicine')} ${(city.medicine ?? 0).toLocaleString()}`}
                </div>
                {owned && (
                  <button
                    onClick={() => { const r = developSpecialty(cityId); if (r.ok) playSfx('coin'); else alert(r.message); }}
                    disabled={!canDev}
                    title={maxed ? t('名產已臻極盛', 'Specialty fully developed') : city.loyalty < 40 ? t('民心未附(需民忠 ≥ 40)', 'needs loyalty ≥ 40') : `${cost}g`}
                    style={{
                      marginTop: '0.3rem', background: '#080b0e',
                      border: '1px solid ' + (canDev ? '#c9a23c' : '#26323e'),
                      color: canDev ? '#e6c473' : '#7a8893',
                      padding: '0.25rem 0.5rem', fontSize: '0.68rem', fontFamily: 'inherit',
                      cursor: canDev ? 'pointer' : 'not-allowed', opacity: canDev ? 1 : 0.6,
                    }}
                  >
                    {maxed ? t('名產作坊 · 極盛', 'Workshop · Max') : t(`興名產作坊 (${cost}g → ★${dev + 1})`, `Develop specialty (${cost}g → ★${dev + 1})`)}
                  </button>
                )}
              </div>
            );
          })()}
          {summaryLine('0.5rem')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.3rem' }}>
            {CATEGORY_ORDER.map((cat) => {
            const defs = BUILDING_DEFS.filter((d) => BUILDING_CATEGORY[d.id] === cat);
            if (defs.length === 0) return null;
            const catLabel = BUILDING_CATEGORY_LABEL[cat];
            return (
            <Fragment key={cat}>
            <div style={{
              gridColumn: '1 / -1', fontSize: '0.64rem', letterSpacing: '0.14rem', color: '#8a98a4',
              borderBottom: '1px solid #1d2731', paddingBottom: 3, marginTop: cat === CATEGORY_ORDER[0] ? 0 : 8,
            }}>
              {lang === 'en' ? catLabel.en : catLabel.zh}
            </div>
            {defs.map((d) => {
              const b = buildings.find((x) => x.cityId === cityId && x.id === d.id);
              const lvl = b?.level ?? 0;
              const inProgress = (b?.progress ?? 0) > 0 && lvl < d.maxLevel;
              // 戰損 — a siege-wrecked building repairs instead of upgrading.
              const damaged = !!b?.damaged;
              const repairCost = Math.max(50, Math.round(d.goldPerLevel * 0.4 * Math.max(1, lvl)));
              // 滿位 — a NEW building needs a free slot (the store rejects it
              // anyway; disabling here keeps the click from failing silently).
              const slotBlocked = !b && atSlotCap;
              const canBuild =
                city.ownerForceId !== null &&
                !inProgress &&
                !slotBlocked &&
                (damaged ? city.gold >= repairCost : lvl < d.maxLevel && city.gold >= d.goldPerLevel);
              return (
                <button
                  key={d.id}
                  className="tkm-lift"
                  onClick={() => { playSfx('thud'); return damaged
                    ? repairBuilding(cityId, d.id as BuildingId)
                    : startBuilding(cityId, d.id as BuildingId); }}
                  disabled={!canBuild}
                  style={{
                    background: damaged ? '#170b08' : '#080b0e',
                    border: '1px solid ' + (damaged ? '#b8442e' : canBuild ? '#e6c473' : '#26323e'),
                    color: damaged ? '#e8a07a' : canBuild ? '#e6c473' : '#7a8893',
                    padding: '0.4rem 0.5rem',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    cursor: canBuild ? 'pointer' : 'not-allowed',
                    opacity: canBuild ? 1 : 0.6,
                  }}
                  title={damaged
                ? t('毀於兵燹 — 修繕前不供加成', 'Wrecked in a siege — no bonus until repaired')
                : slotBlocked
                  ? t('建設位已滿 — 城市升級可增加建設位', 'No free build slot — a bigger city unlocks more')
                  : desc(d)}
                >
                  <div style={{ fontSize: '0.78rem' }}>
                    {lang === 'en' ? d.name.en : lang === 'both' ? `${d.name.zh} ${d.name.en}` : d.name.zh} {lvl > 0 && `Lv.${lvl}`}
                    {damaged && <span style={{ color: '#e05a3a', marginLeft: 4 }}>✦{t('損毀', 'wrecked')}</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
                    {damaged
                      ? t(`修繕 ${repairCost}g`, `repair ${repairCost}g`)
                      : inProgress
                        ? t(`建造中 (${b?.progress ?? 0}/${d.seasonsPerLevel}季)`, `building (${b?.progress ?? 0}/${d.seasonsPerLevel}s)`)
                        : lvl >= d.maxLevel
                          ? t('已達上限', 'max')
                          : `${d.goldPerLevel}g · ${d.seasonsPerLevel}${t('季', 's')}`}
                  </div>
                </button>
              );
            })}
            </Fragment>
            );
            })}
          </div>

          {/* 山長 — assign an officer to head each school; their 智力 boosts the
              school's XP and their strongest 圍 tilts what 講學 teaches. */}
          {city.ownerForceId === playerForceId && (() => {
            const schools = buildings.filter((b) => b.cityId === cityId && b.level > 0 && SCHOOL_BUILDINGS.has(b.id));
            if (schools.length === 0) return null;
            const here = Object.values(officers).filter((o) =>
              o.forceId === playerForceId && o.locationCityId === cityId &&
              o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned');
            return (
              <div style={{ marginTop: '0.5rem', borderTop: '1px dotted #26323e', paddingTop: '0.4rem' }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  {t('山長 · 學館主事', 'Headmasters')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {schools.map((b) => {
                    const def = BUILDING_DEFS.find((d) => d.id === b.id);
                    const label = def ? (lang === 'en' ? def.name.en : def.name.zh) : b.id;
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                        <span style={{ color: '#aab6c0', minWidth: 64 }}>{label}</span>
                        <select
                          value={b.headmasterId ?? ''}
                          onChange={(e) => assignHeadmaster(cityId, b.id, e.target.value || null)}
                          style={{ background: '#080b0e', border: '1px solid #26323e', color: '#cdd6df', fontSize: '0.7rem', padding: '0.1rem 0.3rem', flex: 1 }}
                        >
                          <option value="">{t('(空缺)', '(vacant)')}</option>
                          {here.map((o) => (
                            <option key={o.id} value={o.id}>{(lang === 'en' ? o.name.en : o.name.zh)}（{t('智', 'INT')}{o.stats.intelligence}）</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#7a8893', marginTop: '0.2rem' }}>
                  {t('山長以智力放大學館歷練,並以所長偏導講學', "A headmaster's Intellect boosts the school's XP; their strongest stat tilts what 講學 teaches")}
                </div>
              </div>
            );
          })()}

          {/* Auto-build queue */}
          <div style={{ marginTop: '0.5rem', borderTop: '1px dotted #26323e', paddingTop: '0.4rem' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              {t('自動建造佇列', 'Auto-Build Queue')} {autoQueue.length > 0 && `(${autoQueue.length})`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {autoQueue.map((bid, i) => {
                const def = BUILDING_DEFS.find((b) => b.id === bid);
                const label = def ? (lang === 'en' ? def.name.en : def.name.zh) : bid;
                return (
                  // 佇列項 — the label is NOT a remove trigger any more; only the
                  // dedicated × button removes it (was a whole-chip tap = easy
                  // accidental deletion on touch).
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: '#080b0e', border: '1px solid #26323e',
                      color: '#aab6c0', paddingLeft: '0.45rem', fontSize: '0.72rem',
                    }}
                  >
                    {i + 1}. {label}
                    <button
                      onClick={() => setAutoBuildQueue(cityId, autoQueue.filter((_, j) => j !== i))}
                      title={t('自佇列移除', 'Remove from queue')}
                      aria-label={t('自佇列移除', 'Remove from queue')}
                      style={{
                        background: 'transparent', border: 'none', color: '#7a8893',
                        cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1,
                        minWidth: 28, height: 28, padding: 0,
                      }}
                    >×</button>
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
                    border: '1px dashed #26323e',
                    color: '#7a8893',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.72rem',
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
        </Modal>
      )}
    </div>
  );
}
