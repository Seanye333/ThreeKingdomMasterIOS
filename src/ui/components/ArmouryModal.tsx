import { useMemo, useState } from 'react';
import { ITEMS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { EntityId, Officer } from '../../game/types';
import styles from './ArmouryModal.module.css';
import { useT, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type KindFilter = 'all' | 'weapon' | 'horse' | 'treasure' | 'book';

export function ArmouryModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const assignItem = useGameStore((s) => s.assignItem);
  const unequipSlot = useGameStore((s) => s.unequipSlot);

  const [filter, setFilter] = useState<KindFilter>('all');
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const t = useT();
  const d = useDesc();

  const itemHolders = useMemo(() => {
    const map: Record<string, Officer | null> = {};
    for (const item of ITEMS) {
      const holder =
        Object.values(officers).find(
          (o) => o.equipment.includes(item.id) && o.status !== 'dead',
        ) ?? null;
      map[item.id] = holder;
    }
    return map;
  }, [officers]);

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
            b.stats.war + b.stats.leadership - (a.stats.war + a.stats.leadership),
        ),
    [officers, playerForceId],
  );

  const visibleItems = useMemo(
    () => (filter === 'all' ? ITEMS : ITEMS.filter((i) => i.kind === filter)),
    [filter],
  );

  const handleAssign = (itemId: string, officerId: EntityId) => {
    assignItem(itemId, officerId);
    setAssigningItemId(null);
  };

  const handleUnequip = (
    officerId: EntityId,
    slot: 'weapon' | 'horse' | 'treasure' | 'book',
  ) => {
    unequipSlot(officerId, slot);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>宝物庫</div>
            <div className={styles.titleEn}>
              Armoury — {ITEMS.length} items
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.filters}>
          <span className={styles.filterLabel}>Kind</span>
          {(
            [
              ['all',      t('全部', 'All')],
              ['weapon',   t('武器', 'Weapon')],
              ['horse',    t('駿馬', 'Horse')],
              ['treasure', t('寶物', 'Treasure')],
              ['book',     t('兵書', 'Book')],
            ] as Array<[KindFilter, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              className={`${styles.chip} ${filter === k ? styles.chipActive : ''}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className={styles.list}>
          {visibleItems.map((item) => {
            const holder = itemHolders[item.id];
            const holderForce = holder?.forceId ? forces[holder.forceId] : null;
            const isYours = holder?.forceId === playerForceId;
            const isAssigning = assigningItemId === item.id;
            return (
              <li
                key={item.id}
                className={`${styles.row} ${styles[`kind_${item.kind}`]}`}
              >
                <div className={styles.itemBlock}>
                  <div className={styles.itemNameRow}>
                    <span className={styles.itemNameZh}>{item.name.zh}</span>
                    <span className={styles.itemNameEn}>{item.name.en}</span>
                    <span className={`${styles.kindTag} ${styles[`kindTag_${item.kind}`]}`}>
                      {item.kind}
                    </span>
                  </div>
                  <div className={styles.itemDesc}>{d(item)}</div>
                  <div className={styles.itemEffects}>
                    {Object.entries(item.effects).map(([stat, val]) => (
                      <span key={stat} className={styles.effectChip}>
                        {stat.slice(0, 3).toUpperCase()} +{val}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.holderBlock}>
                  {holder ? (
                    <>
                      <div className={styles.holderName}>
                        <span
                          className={styles.colorDot}
                          style={{ background: holderForce?.color ?? '#5a4530' }}
                        />
                        <span>
                          {holder.name.zh}{' '}
                          <span className={styles.holderEn}>{holder.name.en}</span>
                        </span>
                      </div>
                      <div className={styles.holderForce}>
                        {holderForce?.name.zh ?? (holder.status === 'imprisoned' ? '捕虜' : '浪人')}
                      </div>
                      {isYours && (
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() =>
                              setAssigningItemId(isAssigning ? null : item.id)
                            }
                          >
                            {isAssigning ? 'Cancel' : 'Reassign'}
                          </button>
                          <button
                            className={styles.actionBtnDanger}
                            onClick={() => handleUnequip(holder.id, item.kind)}
                          >
                            Unequip
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className={styles.holderName}>
                        <span className={styles.unclaimed}>{t('未持', 'Unclaimed')}</span>
                      </div>
                      {playerForceId && (
                        <button
                          className={styles.actionBtn}
                          onClick={() =>
                            setAssigningItemId(isAssigning ? null : item.id)
                          }
                        >
                          {isAssigning ? 'Cancel' : 'Claim'}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {isAssigning && (
                  <div className={styles.officerPicker}>
                    <div className={styles.pickerLabel}>Assign to:</div>
                    <div className={styles.officerGrid}>
                      {ownOfficers.length === 0 ? (
                        <span className={styles.muted}>No officers in your force.</span>
                      ) : (
                        ownOfficers.map((o) => (
                          <button
                            key={o.id}
                            className={styles.officerBtn}
                            onClick={() => handleAssign(item.id, o.id)}
                          >
                            <span className={styles.officerZh}>{o.name.zh}</span>
                            <span className={styles.officerStats}>
                              W{o.stats.war} L{o.stats.leadership}
                              {o.equipment.length > 0 && (
                                <span className={styles.officerHas}> · holds {o.equipment.length}</span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
