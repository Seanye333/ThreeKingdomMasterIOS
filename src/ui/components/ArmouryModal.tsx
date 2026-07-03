import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { ITEMS } from '../../game/data';
import type { Item } from '../../game/data/items';
import { ITEMS_BY_ID, REFINE_MAX, BREAKTHROUGH_MAX, breakthroughCost as itemBreakthroughCost, socketsFor, GEMS, GEMS_BY_ID } from '../../game/data/items';
import { useGameStore } from '../../game/state/store';
import type { EntityId, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { Name } from './Name';
import styles from './ArmouryModal.module.css';
import { useT, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type KindFilter = 'all' | 'weapon' | 'armor' | 'horse' | 'treasure' | 'book';
type OwnerFilter = 'mine' | 'enemy' | 'unclaimed' | 'all';

/** Sum all stat boosts an item gives — used for rarity classification. */
function itemRarityScore(item: Item): number {
  let s = 0;
  for (const v of Object.values(item.effects)) s += (v as number) ?? 0;
  return s;
}

function rarityTier(item: Item): 'legendary' | 'rare' | 'uncommon' | 'common' {
  const s = itemRarityScore(item);
  if (s >= 13) return 'legendary';
  if (s >= 8) return 'rare';
  if (s >= 4) return 'uncommon';
  return 'common';
}

const RARITY_COLOR: Record<ReturnType<typeof rarityTier>, string> = {
  legendary: '#e6c473',
  rare:      '#c178c7',
  uncommon:  '#88b7e8',
  common:    '#7a8893',
};
const RARITY_LABEL_ZH: Record<ReturnType<typeof rarityTier>, string> = {
  legendary: '神品', rare: '逸品', uncommon: '上品', common: '常品',
};

/** Pick the relevant stat for best-fit ranking. */
function bestFitStat(item: Item): 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma' {
  if (item.kind === 'weapon')  return 'war';
  if (item.kind === 'horse')   return 'war';
  if (item.kind === 'book')    return 'intelligence';
  // treasure: rank by sum of biggest effect
  const entries = Object.entries(item.effects) as Array<[
    'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma',
    number,
  ]>;
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return entries[0]?.[0] ?? 'politics';
}

export function ArmouryModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const assignItem = useGameStore((s) => s.assignItem);
  const unequipSlot = useGameStore((s) => s.unequipSlot);
  const lostItems = useGameStore((s) => s.lostItems);
  const cities = useGameStore((s) => s.cities);
  const buildings = useGameStore((s) => s.buildings);
  const itemRefinements = useGameStore((s) => s.itemRefinements);
  const itemBreakthroughs = useGameStore((s) => s.itemBreakthroughs);
  const itemGems = useGameStore((s) => s.itemGems);
  const gemStock = useGameStore((s) => s.gemStock);
  const refineItemFn = useGameStore((s) => s.refineItem);
  const breakthroughItemFn = useGameStore((s) => s.breakthroughItem);
  const socketGemFn = useGameStore((s) => s.socketGem);

  const [filter, setFilter] = useState<KindFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const t = useT();
  const d = useDesc();

  const lostItemIds = useMemo(() => new Set(lostItems.map((l) => l.itemId)), [lostItems]);

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

  const visibleItems = useMemo(() => {
    let list = filter === 'all' ? ITEMS : ITEMS.filter((i) => i.kind === filter);
    if (ownerFilter !== 'all') {
      list = list.filter((item) => {
        const holder = itemHolders[item.id];
        const isLost = lostItemIds.has(item.id);
        if (ownerFilter === 'mine') return holder && holder.forceId === playerForceId;
        if (ownerFilter === 'enemy') return holder && holder.forceId && holder.forceId !== playerForceId;
        if (ownerFilter === 'unclaimed') return !holder && !isLost;
        return true;
      });
    } else {
      // Even in 'all', hide truly hidden (lost & not yet discovered) items —
      // they should only show via Search, never as a teasing "Unclaimed" row.
      list = list.filter((i) => !lostItemIds.has(i.id));
    }
    // Sort: legendary first, then rare, uncommon, common.
    const tierOrder = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
    return [...list].sort((a, b) => tierOrder[rarityTier(a)] - tierOrder[rarityTier(b)]);
  }, [filter, ownerFilter, itemHolders, lostItemIds, playerForceId]);

  const handleAssign = (itemId: string, officerId: EntityId) => {
    assignItem(itemId, officerId);
    setAssigningItemId(null);
  };

  const handleUnequip = (
    officerId: EntityId,
    slot: 'weapon' | 'horse' | 'treasure' | 'book' | 'armor',
  ) => {
    unequipSlot(officerId, slot);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('宝物庫', 'Armoury')}</div>
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
              ['armor',    t('甲冑', 'Armor')],
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
        <div className={styles.filters}>
          <span className={styles.filterLabel}>{t('持有', 'Owner')}</span>
          {(
            [
              ['all',       t('全部', 'All')],
              ['mine',      t('我軍', 'Mine')],
              ['enemy',     t('他國', 'Enemy')],
              ['unclaimed', t('無主', 'Unclaimed')],
            ] as Array<[OwnerFilter, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              className={`${styles.chip} ${ownerFilter === k ? styles.chipActive : ''}`}
              onClick={() => setOwnerFilter(k)}
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
            const tier = rarityTier(item);
            const tierColor = RARITY_COLOR[tier];
            return (
              <li
                key={item.id}
                className={`${styles.row} ${styles[`kind_${item.kind}`]}`}
                style={{ borderLeft: `3px solid ${tierColor}` }}
              >
                <div className={styles.itemBlock}>
                  <div className={styles.itemNameRow}>
                    <span className={styles.itemNameZh} style={{ color: tierColor }}><Name pair={item.name} /></span>
                    <span className={`${styles.kindTag} ${styles[`kindTag_${item.kind}`]}`}>
                      {item.kind}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: tierColor, letterSpacing: '0.1rem' }}>
                      {RARITY_LABEL_ZH[tier]}
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
                          style={{ background: holderForce?.color ?? '#364654' }}
                        />
                        <span>
                          <Name pair={holder.name} />
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
                      {isYours && (() => {
                        // 裝備養成 — refine / 突破 / 鑲嵌 right here in the armoury.
                        const plus = itemRefinements[item.id] ?? 0;
                        const stars = itemBreakthroughs[item.id] ?? 0;
                        const gems = itemGems[item.id] ?? [];
                        const maxSockets = socketsFor(ITEMS_BY_ID[item.id] ?? item);
                        const hcity = holder.locationCityId ? cities[holder.locationCityId] : null;
                        const hasFoundry = !!hcity && buildings.some((b) => b.cityId === hcity.id && b.id === 'foundry');
                        const bc = itemBreakthroughCost(item, stars);
                        const canBreak = stars < BREAKTHROUGH_MAX && plus >= REFINE_MAX && hasFoundry && !!hcity && hcity.gold >= bc.gold && (hcity.iron ?? 0) >= bc.iron;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.72rem' }}>
                            <span style={{ color: '#7a8893' }}>
                              {plus > 0 && <span style={{ color: '#e6c473' }}>+{plus} </span>}
                              {stars > 0 && <span style={{ color: '#ff9f5a' }}>{'★'.repeat(stars)} </span>}
                              {gems.map((gid, gi) => { const g = GEMS_BY_ID[gid]; return g ? <span key={gi} title={g.name.zh} style={{ width: 8, height: 8, borderRadius: 'var(--tkm-radius-xs)', background: g.color, display: 'inline-block', marginRight: 2 }} /> : null; })}
                            </span>
                            {plus < REFINE_MAX && <button className={styles.actionBtn} onClick={() => refineItemFn(item.id)}>{t('精煉', 'Refine')}</button>}
                            {plus >= REFINE_MAX && stars < BREAKTHROUGH_MAX && (
                              <button className={styles.actionBtn} disabled={!canBreak} title={!hasFoundry ? t('需鐵工坊', 'needs foundry') : `${bc.gold}g+${bc.iron}鐵`} onClick={() => { const r = breakthroughItemFn(item.id); if (!r.ok) alert(r.reason); }}>{t('突破★', 'Star')}</button>
                            )}
                            {gems.length < maxSockets && (
                              <select value="" onChange={(e) => { if (e.target.value) { const r = socketGemFn(item.id, e.target.value); if (!r.ok) alert(r.reason); } }} style={{ background: '#10161e', border: '1px solid #6a8fb0', color: '#9fb0bf', fontSize: '0.66rem' }}>
                                <option value="">💎</option>
                                {GEMS.map((g) => { const n = gemStock[g.id] ?? 0; return <option key={g.id} value={g.id}>{g.name.zh} ({n > 0 ? t(`庫${n}`, `${n}`) : `${g.cost}g`})</option>; })}
                              </select>
                            )}
                          </div>
                        );
                      })()}
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

                {isAssigning && (() => {
                  const fitStat = bestFitStat(item);
                  const sortedForPick = [...ownOfficers].sort(
                    (a, b) => b.stats[fitStat] - a.stats[fitStat],
                  );
                  return (
                    <div className={styles.officerPicker}>
                      <div className={styles.pickerLabel}>
                        Assign to (★ best {fitStat.slice(0, 3).toUpperCase()}):
                      </div>
                      <div className={styles.officerGrid}>
                        {sortedForPick.length === 0 ? (
                          <span className={styles.muted}>No officers in your force.</span>
                        ) : (
                          sortedForPick.map((o, idx) => (
                            <button
                              key={o.id}
                              className={styles.officerBtn}
                              onClick={() => handleAssign(item.id, o.id)}
                            >
                              <span className={styles.officerZh}>
                                {idx === 0 && <span style={{ color: '#e6c473' }}>★ </span>}
                                <Name pair={o.name} />
                              </span>
                              <span className={styles.officerStats}>
                                {fitStat.slice(0, 3).toUpperCase()}{o.stats[fitStat]}
                                {' · '}<OfficerStats officer={o} keys={['war', 'leadership']} />
                                {o.equipment.length > 0 && (
                                  <span className={styles.officerHas}> · holds {o.equipment.length}</span>
                                )}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
