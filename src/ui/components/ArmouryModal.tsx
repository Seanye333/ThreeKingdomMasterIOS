import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { ITEMS } from '../../game/data';
import type { Item } from '../../game/data/items';
import { ITEMS_BY_ID, REFINE_MAX, BREAKTHROUGH_MAX, breakthroughCost as itemBreakthroughCost, socketsFor, GEMS, GEMS_BY_ID, AWAKENING_PERKS, AWAKENING_BY_ID, awakeningSlots, smeltIronYield, canEvolveItem, itemIsEvolved, whetCost } from '../../game/data/items';
import { useGameStore } from '../../game/state/store';
import type { EntityId, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { Name } from './Name';
import styles from './ArmouryModal.module.css';
import { useT, useDesc } from '../i18n';
import { usePanelNotice } from './usePanelNotice';
import { ItemCardModal, ItemTile } from './ItemCard';

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
  const itemLore = useGameStore((s) => s.itemLore);
  const itemAwakenings = useGameStore((s) => s.itemAwakenings);
  const itemWear = useGameStore((s) => s.itemWear);
  const whetItemFn = useGameStore((s) => s.whetItem);
  const destroyedItems = useGameStore((s) => s.destroyedItems);
  const awakenItemFn = useGameStore((s) => s.awakenItem);
  const smeltItemFn = useGameStore((s) => s.smeltItem);
  const evolveItemFn = useGameStore((s) => s.evolveItem);
  const evolvedItems = useGameStore((s) => s.evolvedItems); // re-render when 器魂 awakens
  const itemInscriptions = useGameStore((s) => s.itemInscriptions);
  const inscribeItemFn = useGameStore((s) => s.inscribeItem);
  // ✒ 銘刻 — inline editor state for the item being inscribed.
  const [inscribingId, setInscribingId] = useState<string | null>(null);
  const [insName, setInsName] = useState('');
  const [insMotto, setInsMotto] = useState('');
  // 回爐二段確認 — first tap arms the smelt button for one item.
  const [smeltConfirmId, setSmeltConfirmId] = useState<string | null>(null);
  // 🎴 名品卡 + 卡牆視圖.
  const [itemCardId, setItemCardId] = useState<string | null>(null);
  const [wallView, setWallView] = useState(false);

  const [filter, setFilter] = useState<KindFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const t = useT();
  const { notify, noticeUI } = usePanelNotice();
  const d = useDesc();

  const lostItemIds = useMemo(() => new Set(lostItems.map((l) => l.itemId)), [lostItems]);
  const destroyedSet = useMemo(() => new Set(destroyedItems ?? []), [destroyedItems]);

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
    let list = (filter === 'all' ? ITEMS : ITEMS.filter((i) => i.kind === filter)).filter((i) => !destroyedSet.has(i.id)); // 回爐者不復見
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
  }, [filter, ownerFilter, itemHolders, lostItemIds, playerForceId, destroyedSet]);

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
          <button
            className={`${styles.chip} ${wallView ? styles.chipActive : ''}`}
            onClick={() => setWallView((v) => !v)}
            style={{ marginRight: 8 }}
            title={t('卡牆 — 名品以卡片陳列', 'Card wall view')}
          >🎴 {t('卡牆', 'Wall')}</button>
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

        {wallView && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 8, overflowY: 'auto', padding: '0.6rem' }}>
            {visibleItems.map((item) => (
              <div key={item.id} style={{ cursor: 'pointer' }} onClick={() => setItemCardId(item.id)}>
                <ItemTile itemId={item.id} />
              </div>
            ))}
          </div>
        )}
        {!wallView && <ul className={styles.list}>
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
                    <span className={styles.itemNameZh} style={{ color: tierColor, cursor: 'pointer', textDecoration: 'underline dotted rgba(230,196,115,0.35)', textUnderlineOffset: 2 }} title={t('名品卡', 'Item card')} onClick={() => setItemCardId(item.id)}><Name pair={item.name} /></span>
                    {itemInscriptions[item.id]?.name && (
                      <span title={itemInscriptions[item.id]?.motto ? `「${itemInscriptions[item.id]!.motto}」` : undefined}
                        style={{ fontSize: '0.74rem', color: '#c8a24e' }}>✒「{itemInscriptions[item.id]!.name}」</span>
                    )}
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
                              <button className={styles.actionBtn} disabled={!canBreak} title={!hasFoundry ? t('需鐵工坊', 'needs foundry') : `${bc.gold}g+${bc.iron}鐵`} onClick={() => { const r = breakthroughItemFn(item.id); if (!r.ok) notify(r.reason); }}>{t('突破★', 'Star')}</button>
                            )}
                            {/* 器魂進化 — the ★5 神兵 capstone. */}
                            {stars >= BREAKTHROUGH_MAX && (evolvedItems.includes(item.id) || itemIsEvolved(item.id)
                              ? <span title={t('器魂已醒 — ·神 終極形態', 'Spirit awakened — ·神 form')} style={{ color: '#ffd66e', fontSize: '0.66rem', border: '1px solid #8a6a2a', borderRadius: 8, padding: '0 5px' }}>☯{t('器魂', 'Ascended')}</span>
                              : (() => { const g = canEvolveItem(item.id); return (
                                <button className={styles.actionBtn} disabled={!g.ok}
                                  title={g.ok ? t('醒器魂:3000金+400鐵 — 神兵進化為 ·神,全效果再增', 'Awaken spirit: 3000g+400 iron — ascend to ·神') : t(g.reasonZh, g.reasonEn)}
                                  onClick={() => { const r = evolveItemFn(item.id); if (!r.ok) notify(r.message); }}>☯{t('器魂', 'Ascend')}</button>
                              ); })()
                            )}
                            {gems.length < maxSockets && (
                              <select value="" onChange={(e) => { if (e.target.value) { const r = socketGemFn(item.id, e.target.value); if (!r.ok) notify(r.reason); } }} style={{ background: '#10161e', border: '1px solid #6a8fb0', color: '#9fb0bf', fontSize: '0.66rem' }}>
                                <option value="">💎</option>
                                {GEMS.map((g) => { const n = gemStock[g.id] ?? 0; return <option key={g.id} value={g.id}>{g.name.zh} ({n > 0 ? t(`庫${n}`, `${n}`) : `${g.cost}g`})</option>; })}
                              </select>
                            )}
                            {(() => {
                              // 兵器覺醒 — 威名里程碑解鎖的詞條(飲血12/百戰30/名器60,各一選)。
                              const lore = itemLore[item.id] ?? 0;
                              const picked = itemAwakenings[item.id] ?? [];
                              const slots = awakeningSlots(lore);
                              return (
                                <>
                                  {picked.map((aid, ai) => { const perk = AWAKENING_BY_ID[aid]; return perk ? (
                                    <span key={ai} title={perk.descriptionZh} style={{ color: '#ffd66e', fontSize: '0.66rem', border: '1px solid #8a6a2a', borderRadius: 8, padding: '0 5px' }}>⚡{perk.name.zh}</span>
                                  ) : null; })}
                                  {picked.length < slots && (
                                    <select value="" onChange={(e) => { if (e.target.value) { const r = awakenItemFn(item.id, e.target.value); if (!r.ok) notify(r.reason); } }}
                                      title={t(`威名 ${lore} — 可銘 ${slots - picked.length} 條覺醒詞條`, `Renown ${lore} — ${slots - picked.length} awakening pick(s)`)}
                                      style={{ background: '#1a1408', border: '1px solid #8a6a2a', color: '#ffd66e', fontSize: '0.66rem' }}>
                                      <option value="">⚡{t('覺醒', 'Awaken')}</option>
                                      {AWAKENING_PERKS.map((pk) => <option key={pk.id} value={pk.id}>{pk.name.zh} — {pk.descriptionZh.split('—')[1]?.trim()}</option>)}
                                    </select>
                                  )}
                                  {picked.length >= slots && slots < 3 && lore > 0 && (
                                    <span style={{ color: '#7a8893', fontSize: '0.62rem' }} title={t('繼續征戰累積威名,解鎖下一詞條(12/30/60戰)', 'Fight on — next pick unlocks at 12/30/60 battles')}>威名{lore}</span>
                                  )}
                                </>
                              );
                            })()}
                            {(() => {
                              // 重鑄分解 — 熔為鐵料;二段確認,一去不回。
                              const armed = smeltConfirmId === item.id;
                              const yieldIron = smeltIronYield(item, plus, stars);
                              return (
                                <button className={styles.actionBtnDanger}
                                  onClick={() => {
                                    if (!armed) { setSmeltConfirmId(item.id); window.setTimeout(() => setSmeltConfirmId((v) => (v === item.id ? null : v)), 3000); return; }
                                    setSmeltConfirmId(null);
                                    const r = smeltItemFn(item.id);
                                    if (!r.ok) notify(r.reason);
                                  }}
                                  title={armed ? t(`再點一次確認 — 熔毀得鐵 ${yieldIron},本局不復存`, `Tap again — smelt for ${yieldIron} iron, gone this campaign`) : t(`回爐重鑄 — 熔為鐵 ${yieldIron}`, `Smelt for ${yieldIron} iron`)}
                                  style={armed ? { background: 'rgba(184,68,46,0.3)', color: '#ffb0a0' } : undefined}
                                >{armed ? t(`熔毀+${yieldIron}鐵?`, `Smelt +${yieldIron}?`) : '🔥'}</button>
                              );
                            })()}
                            {/* 保養 — whet a worn 神兵 (only shows once genuinely worn). */}
                            {(itemWear[item.id] ?? 0) > 60 && (
                              <button className={styles.actionBtn}
                                title={t(`保養 — 磨損 ${itemWear[item.id]}/100,費 ${whetCost(itemWear[item.id] ?? 0)}金復原鋒銳`, `Whet — wear ${itemWear[item.id]}/100, ${whetCost(itemWear[item.id] ?? 0)}g to restore`)}
                                onClick={() => { const r = whetItemFn(item.id); if (!r.ok) notify(r.message); }}
                              >🔧</button>
                            )}
                            {(itemLore[item.id] ?? 0) >= 60 && (
                              <button className={styles.actionBtn}
                                title={t('銘刻 — 名器可由主人賜名題銘', 'Inscribe — a storied arm may bear a given name')}
                                onClick={() => {
                                  setInscribingId(inscribingId === item.id ? null : item.id);
                                  setInsName(itemInscriptions[item.id]?.name ?? '');
                                  setInsMotto(itemInscriptions[item.id]?.motto ?? '');
                                }}
                              >✒</button>
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

                {inscribingId === item.id && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: '0.3rem 0', fontSize: '0.74rem' }}>
                    <input value={insName} onChange={(e) => setInsName(e.target.value)} maxLength={12}
                      placeholder={t('賜名(如 冷豔鋸)', 'Given name')}
                      style={{ background: '#10161e', border: '1px solid #4a3f26', color: '#ffe9a8', padding: '0.15rem 0.4rem', width: 130, fontFamily: 'inherit' }} />
                    <input value={insMotto} onChange={(e) => setInsMotto(e.target.value)} maxLength={12}
                      placeholder={t('題銘一句', 'Motto')}
                      style={{ background: '#10161e', border: '1px solid #2c4454', color: '#9ed0ea', padding: '0.15rem 0.4rem', width: 170, fontFamily: 'inherit' }} />
                    <button className={styles.actionBtn} onClick={() => {
                      const r = inscribeItemFn(item.id, insName, insMotto);
                      if (r.ok) setInscribingId(null); else notify(r.message);
                    }}>{t('銘刻', 'Engrave')}</button>
                  </div>
                )}
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
        </ul>}
        {itemCardId && <ItemCardModal itemId={itemCardId} onClose={() => setItemCardId(null)} />}
      </div>
      {noticeUI}
    </div>
  );
}
