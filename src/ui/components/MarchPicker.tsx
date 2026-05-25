import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { navalReachableCityIds } from '../../game/data/ports';
import { useT } from '../i18n';
import { BattlePrepModal } from './BattlePrepModal';
import type { EntityId } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import styles from './MarchPicker.module.css';

interface Props {
  cityId: EntityId;
  onClose: () => void;
}

const MAX_COMPANIONS = 5;

export function MarchPicker({ cityId, onClose }: Props) {
  const def = COMMAND_DEFS['march'];
  const issueMarch = useGameStore((s) => s.issueMarch);
  const source = useGameStore((s) => s.cities[cityId]);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officersMap = useGameStore((s) => s.officers);
  const [showPrep, setShowPrep] = useState(false);

  const officers = useMemo(
    () =>
      Object.values(officersMap)
        .filter(
          (o) =>
            o.locationCityId === cityId &&
            o.forceId === source?.ownerForceId &&
            o.status === 'idle' &&
            !o.task,
        )
        .sort((a, b) => b.stats.leadership - a.stats.leadership),
    [officersMap, cityId, source?.ownerForceId],
  );

  const ports = useGameStore((s) => s.ports);

  const adjacentCities = useMemo(
    () =>
      (source?.adjacentCityIds ?? [])
        .map((id) => cities[id])
        .filter((c) => !!c),
    [source?.adjacentCityIds, cities],
  );

  /** Cities reachable from `cityId` by sea via the port graph. Each comes
   *  with isNaval=true so the dropdown can mark them with 🚢. */
  const navalCities = useMemo(() => {
    const navalIds = navalReachableCityIds(cityId, ports);
    const adjacentSet = new Set(adjacentCities.map((c) => c.id));
    return [...navalIds]
      .filter((id) => !adjacentSet.has(id))   // don't double-list
      .map((id) => cities[id])
      .filter((c) => !!c);
  }, [cityId, ports, adjacentCities, cities]);

  /** Combined target candidates (land + sea). */
  const targetCandidates = useMemo(
    () => [
      ...adjacentCities.map((c) => ({ city: c, naval: false })),
      ...navalCities.map((c) => ({ city: c, naval: true })),
    ],
    [adjacentCities, navalCities],
  );

  const [targetId, setTargetId] = useState<EntityId | null>(
    adjacentCities[0]?.id ?? null,
  );
  const [officerId, setOfficerId] = useState<EntityId | null>(
    officers[0]?.id ?? null,
  );
  const [additionalIds, setAdditionalIds] = useState<EntityId[]>([]);
  const [troops, setTroops] = useState<number>(
    Math.min(2000, source?.troops ?? 0),
  );

  const toggleAdditional = (id: EntityId) => {
    setAdditionalIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPANIONS) return prev;
      return [...prev, id];
    });
  };

  if (!source) return null;
  const target = targetId ? cities[targetId] : null;
  const targetForce = target?.ownerForceId
    ? forces[target.ownerForceId]
    : null;
  const isHostile =
    !!target && target.ownerForceId !== source.ownerForceId;
  const officer = officerId ? officersMap[officerId] : null;
  const maxTroops = source.troops;
  const canAfford = source.gold >= def.goldCost;
  const valid =
    !!targetId &&
    !!officerId &&
    troops > 0 &&
    troops <= maxTroops &&
    canAfford;

  const handleConfirm = () => {
    if (!valid || !targetId || !officerId) return;
    const extras = additionalIds.filter((id) => id !== officerId);
    const r = issueMarch(cityId, targetId, officerId, troops, extras);
    if (r.ok) onClose();
  };

  const handleTactical = () => {
    if (!valid || !targetId || !officerId || !target) return;
    setShowPrep(true);
  };

  const t = useT();
  const adjustTroops = (delta: number) => {
    setTroops((t) => Math.max(0, Math.min(maxTroops, t + delta)));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{def.label.zh}</div>
            <div className={styles.titleEn}>{def.label.en}</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('出兵自', 'From')}</span>
          <span className={styles.rowValue}>
            {source.name.zh}
            <span className={styles.muted}>
              {' '}· {source.troops.toLocaleString()} {t('兵', 'troops')} · {source.gold.toLocaleString()} {t('金', 'gold')}
            </span>
          </span>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('目標', 'Target')}</h3>
          {targetCandidates.length === 0 ? (
            <div className={styles.empty}>{t('無相鄰或海路可達之城。', 'No adjacent or sea-reachable cities.')}</div>
          ) : (
            <ul className={styles.targetList}>
              {targetCandidates.map(({ city: c, naval }) => {
                const f = c.ownerForceId ? forces[c.ownerForceId] : null;
                const hostile = c.ownerForceId !== source.ownerForceId;
                return (
                  <li key={c.id}>
                    <button
                      className={`${styles.targetButton} ${targetId === c.id ? styles.targetSelected : ''}`}
                      onClick={() => setTargetId(c.id)}
                    >
                      <span
                        className={styles.colorDot}
                        style={{ background: f?.color ?? '#5a4530' }}
                      />
                      <span className={styles.targetText}>
                        <span className={styles.targetNameZh}>
                          {naval && <span style={{ color: '#5a9bc8', marginRight: 4 }}>🚢</span>}
                          {c.name.zh}
                        </span>
                        <span className={styles.targetNameEn}>
                          {t(f?.name.zh ?? '無主', `${c.name.en} · ${f?.name.en ?? 'Neutral'}`)}
                          {naval && <span style={{ color: '#5a9bc8', marginLeft: 6 }}>{t('海路', 'by sea')}</span>}
                        </span>
                      </span>
                      <span className={styles.targetMeta}>
                        {hostile ? (
                          <span className={styles.hostile}>{t('攻', 'ATK')}</span>
                        ) : (
                          <span className={styles.friendly}>{t('移', 'MOVE')}</span>
                        )}
                        <span className={styles.muted}>
                          {c.troops.toLocaleString()}t · D{c.defense}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('大將', 'Commander')}</h3>
          {officers.length === 0 ? (
            <div className={styles.empty}>{t('無可用武將。', 'No available officers.')}</div>
          ) : (
            <div className={styles.officerGrid}>
              {officers.map((o) => (
                <OfficerHoverCard key={o.id} officer={o}>
                  <button
                    className={`${styles.officerButton} ${officerId === o.id ? styles.officerSelected : ''}`}
                    onClick={() => setOfficerId(o.id)}
                  >
                    <span className={styles.officerNameZh}>{o.name.zh}</span>
                    <span className={styles.officerNameEn}>{o.name.en}</span>
                    <span className={styles.officerWar}>
                      LED <strong>{o.stats.leadership}</strong> · WAR{' '}
                      <strong>{o.stats.war}</strong>
                    </span>
                  </button>
                </OfficerHoverCard>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t('副將', 'Accompanying Officers')} — {additionalIds.length} / {MAX_COMPANIONS}
          </h3>
          <div className={styles.officerGrid}>
            {officers
              .filter((o) => o.id !== officerId)
              .map((o) => {
                const picked = additionalIds.includes(o.id);
                const disabled = !picked && additionalIds.length >= MAX_COMPANIONS;
                return (
                  <OfficerHoverCard key={o.id} officer={o}>
                    <button
                      className={`${styles.officerButton} ${picked ? styles.officerSelected : ''}`}
                      onClick={() => toggleAdditional(o.id)}
                      disabled={disabled}
                      style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                    >
                      <span className={styles.officerNameZh}>
                        {picked ? '✓ ' : ''}
                        {o.name.zh}
                      </span>
                      <span className={styles.officerNameEn}>{o.name.en}</span>
                      <span className={styles.officerWar}>
                        LED <strong>{o.stats.leadership}</strong> · WAR{' '}
                        <strong>{o.stats.war}</strong>
                      </span>
                    </button>
                  </OfficerHoverCard>
                );
              })}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t('兵力', 'Troops')} — {troops.toLocaleString()} / {maxTroops.toLocaleString()}
          </h3>
          <div className={styles.troopRow}>
            <button onClick={() => adjustTroops(-1000)}>−1k</button>
            <button onClick={() => adjustTroops(-100)}>−100</button>
            <input
              type="range"
              min={0}
              max={maxTroops}
              step={100}
              value={troops}
              onChange={(e) => setTroops(Number(e.target.value))}
              className={styles.slider}
            />
            <button onClick={() => adjustTroops(100)}>+100</button>
            <button onClick={() => adjustTroops(1000)}>+1k</button>
            <button
              className={styles.allButton}
              onClick={() => setTroops(maxTroops)}
            >
              {t('全部', 'ALL')}
            </button>
          </div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerMeta}>
            {t('費用', 'Cost')}: <strong>{def.goldCost}{t('金', 'g')}</strong>
            {target && officer && (
              <>
                {' '}· {isHostile ? t('攻擊', 'Attack') : t('移防', 'Transfer')}{' '}
                <strong>{target.name.zh}</strong>
                {targetForce && (
                  <span className={styles.muted}>
                    {' '}({targetForce.name.zh})
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isHostile && (
              <button
                className={styles.confirmButton}
                onClick={handleTactical}
                disabled={!valid}
                style={{ background: '#3a2d20', borderColor: '#88b7e8', color: '#88b7e8' }}
                title={t('以回合制戰術戰鬥決勝', 'Resolve as turn-based tactical battle')}
              >
                {t('戰術', 'Tactical')}
              </button>
            )}
            <button
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={!valid}
            >
              {isHostile ? t('出陣！', 'March!') : t('移動', 'Move')}
            </button>
          </div>
        </footer>
      </div>
      {showPrep && targetId && officerId && (
        <BattlePrepModal
          sourceCityId={cityId}
          targetCityId={targetId}
          commanderId={officerId}
          companionIds={additionalIds.filter((id) => id !== officerId)}
          totalTroops={troops}
          onClose={() => {
            setShowPrep(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
