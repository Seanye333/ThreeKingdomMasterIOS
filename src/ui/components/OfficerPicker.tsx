import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS, previewCommandGain } from '../../game/systems/commands';
import type { EntityId, InternalAffairsType } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import { Name } from './Name';
import styles from './OfficerPicker.module.css';
import { useT, useLanguage, useDesc } from '../i18n';
import { commandFitMultiplier } from '../../game/systems/traitEffects';
import { appointmentBonusFor } from '../../game/systems/appointmentEffects';
import { playSfx } from '../../game/systems/sound';

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
  const appointments = useGameStore((s) => s.appointments);
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

  // Civic-title multiplier for this force/city — same for every officer, so
  // compute once and fold into each per-officer 施政預覽.
  const apptBonus = useMemo(
    () => appointmentBonusFor(city?.ownerForceId ?? null, appointments, officersMap, cityId),
    [city?.ownerForceId, appointments, officersMap, cityId],
  );

  const gold = city?.gold ?? 0;
  const totalCost = picked.size * def.goldCost;
  // How many MORE officers the treasury can still fund for SEPARATE dispatch
  // (free commands: no cap).
  const affordableMore = def.goldCost > 0 ? Math.max(0, Math.floor((gold - totalCost) / def.goldCost)) : Infinity;
  // How many of the picked officers the treasury can actually fund for SEPARATE
  // dispatch right now (each separate command pays its own cost). May be < picked
  // when extra officers were picked for the single-cost 協同 path — keeps the
  // dispatch button's count/cost honest instead of promising an unaffordable total.
  const fundableSeparate = def.goldCost > 0 ? Math.min(picked.size, Math.floor(gold / def.goldCost)) : picked.size;
  // 協同施政 needs only ONE cost regardless of party size — so always allow
  // picking up to 3 (1 lead + 2 assists) as long as that single cost is funded,
  // even when separate dispatch of that many wouldn't be affordable.
  const canPickMore = def.goldCost === 0 || (gold >= def.goldCost && (affordableMore > 0 || picked.size < 3));

  const toggle = (officerId: EntityId) => {
    if (trainingIds.has(officerId)) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(officerId)) next.delete(officerId);
      else if (canPickMore) next.add(officerId);
      return next;
    });
  };

  // Order the picked officers by command fit (best = lead for 協同施政).
  const pickedByFit = officers.filter((o) => picked.has(o.id));
  const canCooperate = picked.size >= 2 && picked.size <= 3 && gold >= def.goldCost;

  // 委派之聲 — recruit musters to the 鐘, paid civil works ring the 錢, a free
  // errand a soft 擊.
  const dispatchSfx = () =>
    playSfx(commandType === 'recruit-troops' ? 'bell' : def.goldCost > 0 ? 'coin' : 'click');

  const dispatch = () => {
    let dispatched = 0;
    for (const id of picked) {
      const r = issueCommand(cityId, commandType, id);
      if (r.ok) dispatched++;
    }
    if (dispatched > 0) { dispatchSfx(); onClose(); }
  };

  // 協同施政 — the best-fit pick leads; the rest assist (max 2). One gold cost.
  const dispatchCooperative = () => {
    if (pickedByFit.length < 2) return;
    const [lead, ...rest] = pickedByFit;
    const r = issueCommand(cityId, commandType, lead.id, rest.slice(0, 2).map((o) => o.id));
    if (r.ok) { dispatchSfx(); onClose(); }
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
          {t('選擇武將(可多選 · 2–3 員可協同)', 'Select officers (multi · 2–3 can cooperate)')}
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
              const preview = city
                ? previewCommandGain(commandType, o, city, {
                    internalMultiplier: apptBonus.internalMultiplier,
                    recruitBonus: apptBonus.recruitBonus,
                  })
                : null;
              const recommended = fit >= 1.15;
              const liability = fit <= 0.85;
              const unaffordable = !isPicked && !canPickMore;
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
                        {preview && preview.delta > 0 && (
                          <span style={{ marginRight: 8, color: recommended ? '#8fdc8f' : '#c8b683' }}>
                            ≈ {preview.zh} +{preview.delta.toLocaleString()}
                          </span>
                        )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.8rem' }}>
            <button
              onClick={dispatch}
              disabled={picked.size === 0}
              style={{
                width: '100%', padding: '0.55rem',
                background: picked.size > 0 ? 'linear-gradient(180deg,#3a2d18,#2a1f10)' : 'transparent',
                border: `1px solid ${picked.size > 0 ? '#e6c473' : '#26323e'}`,
                color: picked.size > 0 ? '#f2dd9a' : '#5a4a35',
                cursor: picked.size > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', letterSpacing: '0.07rem', fontSize: '0.9rem',
              }}
            >
              {picked.size === 0
                ? t('選擇武將', 'Select officers')
                : picked.size === 1
                  ? t(`委派${def.goldCost > 0 ? ` · ${def.goldCost}金` : ''}`, `Dispatch${def.goldCost > 0 ? ` · ${def.goldCost}g` : ''}`)
                  : fundableSeparate < picked.size
                    ? t(`分別委派 ${fundableSeparate}/${picked.size} 員(餘者國庫不足)${def.goldCost > 0 ? ` · ${fundableSeparate * def.goldCost}金` : ''}`,
                        `Dispatch ${fundableSeparate}/${picked.size} (rest unfunded)${def.goldCost > 0 ? ` · ${fundableSeparate * def.goldCost}g` : ''}`)
                    : t(`分別委派 ${picked.size} 員${def.goldCost > 0 ? ` · 共 ${totalCost}金` : ''}`,
                        `Dispatch ${picked.size} separately${def.goldCost > 0 ? ` · ${totalCost}g` : ''}`)}
            </button>
            {canCooperate && (
              <button
                onClick={dispatchCooperative}
                style={{
                  width: '100%', padding: '0.55rem',
                  background: 'linear-gradient(180deg,#1d2f1a,#162313)',
                  border: '1px solid #7ed68a', color: '#bfeebf',
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05rem', fontSize: '0.86rem',
                }}
                title={t(
                  '協同施政 — 首席主政,餘者襄助(遞減 0.5×/0.3×),只付一份費用,襄助者亦得歷練。',
                  'Cooperate — best-fit officer leads, the rest assist (0.5×/0.3× diminishing). One cost only; assistants gain XP too.',
                )}
              >
                {t(`協同施政:${pickedByFit.length} 員合力${def.goldCost > 0 ? ` · 僅 ${def.goldCost}金` : ''}`,
                   `Cooperate · ${pickedByFit.length} on one task${def.goldCost > 0 ? ` · ${def.goldCost}g only` : ''}`)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
