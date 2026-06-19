import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import type { EntityId, InternalAffairsType } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import { Name } from './Name';
import styles from './OfficerPicker.module.css';
import { useT, useLanguage, useDesc } from '../i18n';
import { commandFitMultiplier } from '../../game/systems/traitEffects';

interface Props {
  cityId: EntityId;
  commandType: InternalAffairsType;
  onClose: () => void;
}

export function OfficerPicker({ cityId, commandType, onClose }: Props) {
  const def = COMMAND_DEFS[commandType];
  const issueCommand = useGameStore((s) => s.issueCommand);
  const city = useGameStore((s) => s.cities[cityId]);
  const officersMap = useGameStore((s) => s.officers);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  // 多選 — check several officers, dispatch them all in one go.
  const [picked, setPicked] = useState<Set<EntityId>>(new Set());

  const trainingIds = useMemo(
    () => new Set(pendingTrainings.map((tr) => tr.officerId)),
    [pendingTrainings],
  );
  const officers = useMemo(
    () =>
      Object.values(officersMap)
        .filter(
          (o) =>
            o.locationCityId === cityId &&
            o.forceId === city?.ownerForceId &&
            o.status === 'idle' &&
            !o.task,
        )
        .sort((a, b) => {
          const aT = trainingIds.has(a.id) ? 1 : 0;
          const bT = trainingIds.has(b.id) ? 1 : 0;
          if (aT !== bT) return aT - bT;
          return (b.stats[def.stat] * commandFitMultiplier(b, commandType)) -
                 (a.stats[def.stat] * commandFitMultiplier(a, commandType));
        }),
    [officersMap, cityId, city?.ownerForceId, def.stat, trainingIds, commandType],
  );

  const gold = city?.gold ?? 0;
  const totalCost = picked.size * def.goldCost;
  // How many MORE officers the treasury can still fund (free commands: no cap).
  const affordableMore = def.goldCost > 0 ? Math.max(0, Math.floor((gold - totalCost) / def.goldCost)) : Infinity;

  const toggle = (officerId: EntityId) => {
    if (trainingIds.has(officerId)) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(officerId)) next.delete(officerId);
      else if (affordableMore > 0) next.add(officerId);
      return next;
    });
  };

  const dispatch = () => {
    let dispatched = 0;
    for (const id of picked) {
      const r = issueCommand(cityId, commandType, id);
      if (r.ok) dispatched++;
    }
    if (dispatched > 0) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>{def.label.zh}</div>}
            {lang !== 'zh' && <div className={styles.titleEn}>{def.label.en}</div>}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.meta}>
          <span>
            {t('每員耗費', 'Cost each')}: <strong>{def.goldCost} {t('金', 'gold')}</strong>
          </span>
          <span>
            {t('使用屬性', 'Stat used')}: <strong>{def.stat}</strong>
          </span>
        </div>

        <p className={styles.desc}>{desc(def)}</p>

        <h3 className={styles.sectionTitle}>
          {t('選擇武將(可多選)', 'Select officers (multiple)')}
          {picked.size > 0 && (
            <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#e6c473' }}>
              {t(`已選 ${picked.size}`, `${picked.size} picked`)}
              {def.goldCost > 0 ? t(` · 共 ${totalCost}金`, ` · ${totalCost}g`) : ''}
            </span>
          )}
        </h3>
        {officers.length === 0 ? (
          <div className={styles.empty}>
            {t('此城無可用武將。', 'No available officers in this city.')}
          </div>
        ) : (
          <ul className={styles.officerList}>
            {officers.map((o) => {
              const isTraining = trainingIds.has(o.id);
              const isPicked = picked.has(o.id);
              const fit = commandFitMultiplier(o, commandType);
              const recommended = fit >= 1.15;
              const liability = fit <= 0.85;
              const unaffordable = !isPicked && affordableMore <= 0;
              const blocked = isTraining || unaffordable;
              return (
                <li key={o.id}>
                  <OfficerHoverCard officer={o}>
                    <button
                      className={styles.officerButton}
                      onClick={() => toggle(o.id)}
                      disabled={blocked}
                      title={
                        isTraining
                          ? t('武將正在書院培訓中,無法指派。', 'Officer is training at the academy — unavailable.')
                          : unaffordable
                            ? t('國庫不足以再派一員。', "Treasury can't fund another.")
                            : recommended
                              ? t('個性與此命令相宜 — 效果加成', 'Personality fits this command — bonus effect')
                              : liability
                                ? t('個性與此命令相剋 — 效果折扣', 'Personality clashes — reduced effect')
                                : undefined
                      }
                      style={{
                        ...(blocked ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.4)' } : {}),
                        ...(isPicked ? { outline: '2px solid #e6c473', background: 'rgba(212,168,74,0.14)' } : {}),
                      }}
                    >
                      <span className={styles.officerNameZh}>
                        <span style={{ marginRight: 5, color: isPicked ? '#e6c473' : '#6a5a40' }}>{isPicked ? '☑' : '☐'}</span>
                        {recommended && <span style={{ color: '#e6c473', marginRight: 4 }}>⭐</span>}
                        {liability && <span style={{ color: '#b8442e', marginRight: 4 }}>⚠</span>}
                        <Name pair={o.name} />
                        {isTraining && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#88b7e8', fontStyle: 'italic' }}>⏳ {t('培訓中', 'training')}</span>}
                      </span>
                      <span className={styles.officerStat}>
                        {def.stat.toUpperCase().slice(0, 3)}{' '}
                        <strong>{o.stats[def.stat]}</strong>
                      </span>
                    </button>
                  </OfficerHoverCard>
                </li>
              );
            })}
          </ul>
        )}

        {officers.length > 0 && (
          <button
            onClick={dispatch}
            disabled={picked.size === 0}
            style={{
              marginTop: '0.8rem', width: '100%', padding: '0.55rem',
              background: picked.size > 0 ? 'linear-gradient(180deg,#3a2d18,#2a1f10)' : 'transparent',
              border: `1px solid ${picked.size > 0 ? '#e6c473' : '#26323e'}`,
              color: picked.size > 0 ? '#f2dd9a' : '#5a4a35',
              cursor: picked.size > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', letterSpacing: '0.07rem', fontSize: '0.9rem',
            }}
          >
            {picked.size === 0
              ? t('選擇武將', 'Select officers')
              : t(`委派 ${picked.size} 員${def.goldCost > 0 ? ` · 共 ${totalCost}金` : ''}`,
                  `Dispatch ${picked.size}${def.goldCost > 0 ? ` · ${totalCost}g` : ''}`)}
          </button>
        )}
      </div>
    </div>
  );
}
