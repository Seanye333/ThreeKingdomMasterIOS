import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS, meetsMinSize } from '../../game/systems/commands';
import { citySize, CITY_SIZES_BY_ID } from '../../game/systems/citySize';
import type { EntityId, InternalAffairsType } from '../../game/types';
import { MarchPicker } from './MarchPicker';
import { TrainingPicker } from './TrainingPicker';
import { cityHasAcademy, cityHasMentors } from '../../game/systems/training';
import { OfficerPicker } from './OfficerPicker';
import styles from './CommandMenu.module.css';
import { useT, useLanguage, useDesc } from '../i18n';

interface Props {
  cityId: EntityId;
}

const INTERNAL_ORDER: InternalAffairsType[] = [
  // ── Basic (always available) ──
  'develop-agriculture',
  'develop-commerce',
  'build-defense',
  'recruit-troops',
  'improve-loyalty',
  'garrison',
  'search',
  'encourage-migration',
  // ── Tier-2 (requires 城 tier+) ──
  'major-agriculture',
  'major-commerce',
  'major-defense',
  'upgrade-wall',
];

type ModalState =
  | { kind: 'closed' }
  | { kind: 'internal'; type: InternalAffairsType }
  | { kind: 'march' }
  | { kind: 'training' };

export function CommandMenu({ cityId }: Props) {
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const city = useGameStore((s) => s.cities[cityId]);
  // Select the map by reference (stable) — filter inside useMemo to avoid creating
  // a new array on every render (which would trigger an infinite re-render loop).
  const allPending = useGameStore((s) => s.pendingCommands);
  const pendingInCity = useMemo(
    () => Object.values(allPending).filter((c) => c.cityId === cityId),
    [allPending, cityId],
  );
  const officersMap = useGameStore((s) => s.officers);
  const citiesMap = useGameStore((s) => s.cities);
  const cancelCommand = useGameStore((s) => s.cancelCommand);
  const buildings = useGameStore((s) => s.buildings);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const startPracticeBattle = useGameStore((s) => s.startPracticeBattle);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  // 演習 — needs at least one stationed officer to take the field.
  const garrisonCount = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === playerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned',
    ).length,
    [officersMap, cityId, playerForceId],
  );

  if (!city) return null;

  const marchDef = COMMAND_DEFS['march'];
  const canMarch = city.gold >= marchDef.goldCost && city.troops > 0;

  return (
    <>
      {/* Currently pending commands in this city — one per assigned officer */}
      {pendingInCity.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {pendingInCity.map((cmd) => {
            const officer = officersMap[cmd.officerId];
            if (!officer) return null;
            const def = COMMAND_DEFS[cmd.type];
            const targetCity = cmd.type === 'march' ? citiesMap[cmd.targetCityId] : null;
            return (
              <div key={cmd.officerId} className={styles.activeCmd}>
                <div className={styles.activeRow}>
                  <div className={styles.activeText}>
                    <span className={styles.activeLabel}>
                      {lang === 'en' ? def.label.en : lang === 'both' ? `${def.label.zh} · ${def.label.en}` : def.label.zh}
                    </span>
                    <span className={styles.activeOfficer}>
                      {t('由', 'by')} {lang === 'en' ? officer.name.en : officer.name.zh}
                      {cmd.type === 'march' && targetCity && (
                        <>
                          {' → '}
                          <strong>{lang === 'en' ? targetCity.name.en : targetCity.name.zh}</strong>
                          {' '}{t('率', 'with')}{' '}
                          {cmd.troops.toLocaleString()} {t('兵', 'troops')}
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    className={styles.cancelButton}
                    onClick={() => cancelCommand(cmd.officerId)}
                    title={t('取消命令 (退還金錢)', 'Cancel command (refund gold)')}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.menu}>
        {INTERNAL_ORDER.map((type) => {
          const def = COMMAND_DEFS[type];
          const canAfford = city.gold >= def.goldCost;
          const currentSize = citySize(city);
          const tierOk = meetsMinSize(currentSize.id, def.minSize);
          const minSizeDef = def.minSize ? CITY_SIZES_BY_ID[def.minSize] : null;
          const lockedReason = !tierOk && minSizeDef
            ? t(`需要 ${minSizeDef.name.zh}+ 級城市`, `Requires ${minSizeDef.name.en}+ tier`)
            : null;
          const reason = lockedReason ?? (!canAfford ? t('金錢不足', 'Not enough gold') : desc(def));
          if (!tierOk) return null;
          return (
            <button
              key={type}
              className={styles.cmdButton}
              onClick={() => setModal({ kind: 'internal', type })}
              disabled={!canAfford}
              title={reason}
            >
              <span className={styles.cmdLabelZh}>
                {lang === 'en' ? def.label.en : def.label.zh}
                {def.minSize && <span style={{ fontSize: '0.55rem', color: '#8a7050', marginLeft: 4 }}>★{lang === 'en' ? minSizeDef?.name.en : minSizeDef?.name.zh}+</span>}
              </span>
              {lang === 'both' && <span className={styles.cmdLabelEn}>{def.label.en}</span>}
              <span className={styles.cmdCost}>{def.goldCost}g</span>
            </button>
          );
        })}
        <button
          className={`${styles.cmdButton} ${styles.marchButton}`}
          onClick={() => setModal({ kind: 'march' })}
          disabled={!canMarch}
          title={
            !canMarch
              ? city.troops === 0
                ? t('無兵可出', 'No troops to march')
                : t('金錢不足', 'Not enough gold')
              : desc(marchDef)
          }
        >
          <span className={styles.cmdLabelZh}>{lang === 'en' ? marchDef.label.en : marchDef.label.zh}</span>
          {lang === 'both' && <span className={styles.cmdLabelEn}>{marchDef.label.en}</span>}
          <span className={styles.cmdCost}>{marchDef.goldCost}g</span>
        </button>
        <button
          className={styles.cmdButton}
          onClick={() => startPracticeBattle(cityId)}
          disabled={garrisonCount === 0}
          title={
            garrisonCount === 0
              ? t('需有武將駐城方可演習', 'Need a stationed officer to drill')
              : t('演習 — 在城邑戰場上操演佈陣,不損兵將,純為練習戰術', 'Drill — rehearse tactics on the city battlefield. No losses; practice only.')
          }
          style={{ borderColor: '#7ed68a' }}
        >
          <span className={styles.cmdLabelZh}>{t('演習', 'Drill')}</span>
          {lang === 'both' && <span className={styles.cmdLabelEn}>Drill</span>}
          <span className={styles.cmdCost}>{t('練', 'free')}</span>
        </button>
        {(cityHasAcademy(city, buildings) || cityHasMentors(city, officersMap, pendingTrainings)) && (() => {
          const hasAcad = cityHasAcademy(city, buildings);
          const label = hasAcad ? t('書院培訓', 'Academy Training') : t('師徒傳授', 'Mentor Teaching');
          const labelEn = hasAcad ? 'Academy' : 'Mentor';
          const tip = hasAcad
            ? t('書院培訓 — 武將學一個新政策(費用視政策難度而定)', 'Academy training — train an officer in a new policy (cost varies by tier)')
            : t('師徒傳授 — 同城武將傳授其已通政策,無需書院,免費但較慢', 'Mentor teaching — a senior officer teaches a policy they know, no academy needed, free but slower');
          return (
            <button
              className={styles.cmdButton}
              onClick={() => setModal({ kind: 'training' })}
              title={tip}
              style={{ borderColor: hasAcad ? '#88b7e8' : '#7ed68a' }}
            >
              <span className={styles.cmdLabelZh}>{lang === 'en' ? labelEn : label}</span>
              {lang === 'both' && <span className={styles.cmdLabelEn}>{labelEn}</span>}
              <span className={styles.cmdCost}>{t('政', 'policy')}</span>
            </button>
          );
        })()}
      </div>

      {modal.kind === 'internal' && (
        <OfficerPicker
          cityId={cityId}
          commandType={modal.type}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'march' && (
        <MarchPicker
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'training' && (
        <TrainingPicker
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </>
  );
}
