import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { Modal } from './Modal';
import {
  ITEMS_BY_ID, liveItemById, itemRarity, itemLoreLevel, itemLoreTitle,
  itemAwakeningIds, AWAKENING_BY_ID, GEMS_BY_ID, itemIsEvolved, FORGE_AFFIXES_BY_ID, isCommandToken, type Item,
} from '../../game/data/items';
import { ITEM_WEAPON_TYPE, classifyWeaponByName, WEAPON_TYPE_DEFS, type WeaponType } from '../../game/data/weaponTypes';
import { SIGNATURE_ITEMS } from '../../game/data/signatureItems';
import { artForItem } from '../../game/systems/evolvedArts';
import { heirloomTier } from '../../game/systems/itemProvenance';
import { exportItemCardPNG } from './officerCardExport';
import { useT, useLanguage, pickName, useDesc } from '../i18n';

/**
 * 名品卡 — the officer card's sister: every treasure gets a card of its own.
 * Procedural SVG sigils stand in for art (blade / spear / bow silhouettes;
 * calligraphic glyphs for horses, books, armour, treasures), under a
 * rarity-tiered frame, with the item's whole life on one face: live effects,
 * 精煉/突破/寶石, the 威名 track and its next milestone, awakening perks,
 * the inscription, the signature master and the current bearer.
 */

const RARITY_FRAME: Record<string, { border: string; glow: string; label: { zh: string; en: string }; color: string }> = {
  gold: { border: 'linear-gradient(160deg, #e6c473, #8a6a2a 40%, #ffe9a8 60%, #a8842e)', glow: '0 0 18px rgba(230,196,115,0.35)', label: { zh: '神品', en: 'Legendary' }, color: '#e6c473' },
  silver: { border: 'linear-gradient(160deg, #cfd8e0, #6a7682 50%, #cfd8e0)', glow: '0 0 10px rgba(207,216,224,0.2)', label: { zh: '逸品', en: 'Rare' }, color: '#cfd8e0' },
  bronze: { border: 'linear-gradient(160deg, #c8884e, #6a4426 55%, #b87a3e)', glow: 'none', label: { zh: '良品', en: 'Fine' }, color: '#c8884e' },
};

/** 器形圖騰 — weapon silhouettes as inline SVG; others use a calligraphic seal. */
function WeaponSigil({ type, color }: { type: WeaponType; color: string }) {
  const stroke = { stroke: color, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (type) {
    case 'sabre':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M30 82 C 26 60, 34 30, 62 14 C 56 34, 52 56, 44 76 Z" fill={color} opacity="0.9" /><path d="M28 84 L 22 92 M36 80 L 30 74" {...stroke} /></svg>;
    case 'sword':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 10 L 56 22 L 54 68 L 50 74 L 46 68 L 44 22 Z" fill={color} opacity="0.9" /><path d="M38 74 L 62 74 M50 74 L 50 88 M44 92 a6 6 0 0 0 12 0" {...stroke} /></svg>;
    case 'spear':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 6 L 58 22 L 50 34 L 42 22 Z" fill={color} opacity="0.9" /><path d="M50 34 L 50 92" {...stroke} /><path d="M44 40 L 56 40" {...stroke} /></svg>;
    case 'halberd':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 8 L 56 20 L 50 30 L 44 20 Z" fill={color} opacity="0.9" /><path d="M50 30 L 50 92" {...stroke} /><path d="M50 34 C 68 34, 74 48, 66 58 C 62 46, 56 42, 50 42 Z" fill={color} opacity="0.85" /></svg>;
    case 'bow':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M30 14 C 66 34, 66 66, 30 86" {...stroke} /><path d="M30 14 L 30 86" stroke={color} strokeWidth="1.5" /><path d="M30 50 L 78 50 M70 44 L 78 50 L 70 56" {...stroke} /></svg>;
    case 'crossbow':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M18 40 C 50 22, 50 22, 82 40" {...stroke} /><path d="M50 26 L 50 78" {...stroke} /><path d="M36 66 L 64 66" {...stroke} /></svg>;
    case 'fan':
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><path d="M50 84 L 22 30 A 34 34 0 0 1 78 30 Z" fill={color} opacity="0.55" /><path d="M50 84 L 30 36 M50 84 L 50 26 M50 84 L 70 36" {...stroke} /></svg>;
    default:
      return <svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="34" {...stroke} opacity="0.7" /><path d="M32 50 L 68 50 M50 32 L 50 68" {...stroke} /></svg>;
  }
}

function sigilFor(item: Item): { kind: 'svg'; type: WeaponType } | { kind: 'glyph'; char: string } {
  if (item.kind === 'weapon') {
    const wt = ITEM_WEAPON_TYPE[item.id] ?? classifyWeaponByName(item.name) ?? 'sword';
    if (wt !== 'none' && wt !== 'cavalry' && wt !== 'siege') return { kind: 'svg', type: wt };
    return { kind: 'glyph', char: '兵' };
  }
  if (item.kind === 'horse') return { kind: 'glyph', char: '馬' };
  if (item.kind === 'book') return { kind: 'glyph', char: '書' };
  if (item.kind === 'armor') return { kind: 'glyph', char: '甲' };
  return { kind: 'glyph', char: '寶' };
}

const LORE_MILESTONES = [12, 30, 60];

export function ItemCardFace({ itemId, onClose }: { itemId: string; onClose?: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  const officers = useGameStore((s) => s.officers);
  const inscriptions = useGameStore((s) => s.itemInscriptions);
  const refinements = useGameStore((s) => s.itemRefinements);
  const breakthroughs = useGameStore((s) => s.itemBreakthroughs);
  const gems = useGameStore((s) => s.itemGems);
  const provenance = useGameStore((s) => s.itemProvenance?.[itemId]);
  const evolved = itemIsEvolved(itemId);
  const wear = useGameStore((s) => s.itemWear?.[itemId] ?? 0);
  const affixes = useGameStore((s) => s.itemAffixes?.[itemId] ?? []);

  const base = ITEMS_BY_ID[itemId];
  const live = liveItemById(itemId);
  const holder = useMemo(
    () => Object.values(officers).find((o) => o.status !== 'dead' && o.equipment.includes(itemId)) ?? null,
    [officers, itemId],
  );
  if (!base || !live) return null;

  const rarity = itemRarity(base);
  const frame = RARITY_FRAME[rarity] ?? RARITY_FRAME.bronze;
  const lore = itemLoreLevel(itemId);
  const loreTitle = itemLoreTitle(lore);
  const nextMilestone = LORE_MILESTONES.find((m) => lore < m) ?? null;
  const awakened = itemAwakeningIds(itemId).map((aid) => AWAKENING_BY_ID[aid]).filter(Boolean);
  const socketed = (gems[itemId] ?? []).map((gid) => GEMS_BY_ID[gid]).filter(Boolean);
  const plus = refinements[itemId] ?? 0;
  const stars = breakthroughs[itemId] ?? 0;
  const ins = inscriptions?.[itemId];
  const masters = SIGNATURE_ITEMS.filter((p) => p.itemId === itemId).map((p) => officers[p.officerId]).filter(Boolean);
  const sigil = sigilFor(base);
  const wtDef = base.kind === 'weapon' ? WEAPON_TYPE_DEFS[ITEM_WEAPON_TYPE[base.id] ?? classifyWeaponByName(base.name) ?? 'sword'] : null;

  return (
    <div style={{ position: 'relative', padding: 3, borderRadius: 12, background: frame.border, boxShadow: `0 8px 40px rgba(0,0,0,0.7), ${frame.glow}`, overflow: 'hidden' }}>
      <div style={{ position: 'relative', background: '#0c1118', borderRadius: 9, overflow: 'hidden' }}>
        {/* 圖騰區 — the sigil over a smoky vignette. */}
        <div style={{ position: 'relative', height: 190, background: 'radial-gradient(ellipse at 50% 30%, #232d3a 0%, #0c1118 78%)', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 120, height: 120, opacity: 0.92 }}>
            {sigil.kind === 'svg'
              ? <WeaponSigil type={sigil.type} color={frame.color} />
              : <div style={{ fontSize: '5.2rem', textAlign: 'center', lineHeight: '120px', color: frame.color, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', textShadow: `0 0 26px ${frame.color}55` }}>{sigil.char}</div>}
          </div>
          {/* Top chrome — rarity + kind/class. */}
          <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ background: 'rgba(10,14,20,0.82)', border: `1px solid ${frame.color}`, color: frame.color, padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08rem' }}>
              {pickName(frame.label, lang)}
            </span>
            <span style={{ background: 'rgba(10,14,20,0.82)', border: '1px solid #3c4f5e', color: '#9aa6b0', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem' }}>
              {base.kind}{wtDef ? ` · ${pickName({ zh: wtDef.zh, en: wtDef.en }, lang)}` : ''}
            </span>
          </div>
          {/* 名牌 — inscribed name leads; the born name stands beneath it. */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 12px 8px', background: 'linear-gradient(180deg, transparent, rgba(10,13,18,0.94) 62%)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.25rem', color: '#f2e2b8', fontWeight: 700, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>
                {ins?.name ? `${ins.name}` : pickName(base.name, lang)}
              </span>
              {ins?.name && <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>{t('本名', 'born ')} {pickName(base.name, lang)} <span style={{ color: '#c8a24e' }}>✒</span></span>}
              {plus > 0 && <span style={{ color: '#e6c473', fontSize: '0.85rem' }}>+{plus}</span>}
              {stars > 0 && <span style={{ color: '#ff9f5a', fontSize: '0.8rem' }}>{'★'.repeat(stars)}</span>}
              {loreTitle && <span style={{ color: '#e0a868', fontSize: '0.72rem' }}>〈{pickName(loreTitle, lang)}〉</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 效果 — live numbers (精煉/突破/寶石/威名/覺醒全折入). */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(live.effects).map(([k, v]) => (
              <span key={k} style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: 9, background: 'rgba(126,192,224,0.08)', border: '1px solid #2c4454', color: '#9ed0ea', fontFamily: 'ui-monospace, monospace' }}>
                {k.slice(0, 3).toUpperCase()} +{v}
              </span>
            ))}
            {socketed.map((g, gi) => (
              <span key={`g${gi}`} title={g!.name.zh} style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: 9, border: `1px solid ${g!.color}88`, color: g!.color }}>◆ {pickName(g!.name, lang)}</span>
            ))}
            {/* 統御信物 — the command aura + 坐鎮增兵 note (D1/W10). */}
            {isCommandToken(itemId) && (
              <span title={t('統御信物 — 己方全軍 +4%/人戰力(封頂+8%);持者駐城募兵上限 +10%/人(封頂+20%)', 'Command token — +4% army power per bearer; +10% recruit ceiling while stationed')}
                style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: 9, background: 'rgba(230,196,115,0.12)', border: '1px solid #8a6a2a', color: '#ffd66e' }}>
                ⚑ {t('統御信物', 'Command Token')}
              </span>
            )}
          </div>

          {/* 威名 — the battle-renown track toward the next milestone. */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: 3 }}>
              <span>{t('威名', 'RENOWN')} {lore}</span>
              <span>{nextMilestone ? t(`距下檔 ${nextMilestone - lore} 戰`, `${nextMilestone - lore} battles to next`) : t('名器圓滿', 'fully storied')}</span>
            </div>
            <div style={{ height: 6, background: '#1a222c', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (lore / 60) * 100)}%`, background: `linear-gradient(90deg, ${frame.color}66, ${frame.color})` }} />
            </div>
          </div>

          {/* 耗損 — a well-used 神兵 shows wear once it's genuinely worn (>60). */}
          {wear > 60 && (
            <div style={{ fontSize: '0.68rem', color: '#c88a5a' }}
              title={t(`耗損 ${wear}/100 — 效果暫減至多 6%,可於鐵坊城「保養」復原`, `Wear ${wear}/100 — effects dip up to 6%; whet it at a forge`)}>
              🔧 {t('耗損', 'Wear')} {wear}/100 · {t('宜保養', 'needs whetting')}
            </div>
          )}
          {/* 器魂 — an awakened legendary wears its ·神 mark + signature art (W9). */}
          {evolved && (() => {
            const art = artForItem(itemId);
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span title={t('器魂已醒 — ★5 名器進化為 ·神 終極形態,全效果再增', 'Spirit awakened — the ★5 storied form has ascended')}
                  style={{ fontSize: '0.72rem', padding: '1px 9px', borderRadius: 9, background: 'linear-gradient(100deg, #fff4c8, #e6c473, #a8842e)', color: '#20242c', fontWeight: 700, letterSpacing: '0.1rem' }}>
                  ☯ {t('器魂已醒', 'Ascended')}
                </span>
                {art && (
                  <span title={t(`器魂戰技「${art.zh}」— ${art.descZh}(單挑勇 +${art.duelBonus})`, `Signature art "${art.en}" — ${art.descEn} (duel +${art.duelBonus})`)}
                    style={{ fontSize: '0.72rem', padding: '1px 8px', borderRadius: 9, background: 'rgba(200,120,220,0.14)', border: '1px solid #a06ed0', color: '#d6a8ea' }}>
                    ⚔ {lang === 'en' ? art.en : art.zh}
                  </span>
                )}
              </div>
            );
          })()}

          {/* 覺醒詞條 */}
          {awakened.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {awakened.map((p, pi) => (
                <span key={pi} title={lang === 'en' ? p!.description : p!.descriptionZh}
                  style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: 9, background: 'rgba(255,214,110,0.12)', border: '1px solid #8a6a2a', color: '#ffd66e' }}>
                  ⚡ {pickName(p!.name, lang)}
                </span>
              ))}
            </div>
          )}
          {/* 鍛造詞綴 — forge-tempered affixes (天工偶得). */}
          {affixes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {affixes.map((aid, ai) => {
                const af = FORGE_AFFIXES_BY_ID[aid];
                if (!af) return null;
                const eff = Object.entries(af.effects).map(([k, v]) => `${k === 'war' ? '武' : k === 'leadership' ? '統' : k === 'intelligence' ? '智' : k === 'politics' ? '政' : '魅'}+${v}`).join('·');
                return (
                  <span key={ai} title={`鍛造詞綴(天工偶得):${eff}`}
                    style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: 9, background: 'rgba(126,214,168,0.12)', border: '1px solid #3f7a5c', color: '#8fe3b0' }}>
                    ✧ {lang === 'en' ? af.name.en : af.name.zh}
                  </span>
                );
              })}
            </div>
          )}

          {/* 本命 + 現持 */}
          {(masters.length > 0 || holder) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.72rem' }}>
              {masters.length > 0 && (
                <span style={{ color: '#ffe9a8' }}>✦ {t('本命', 'Signature of')}:{masters.map((m) => pickName(m!.name, lang)).join('、')}</span>
              )}
              {holder && (
                <span style={{ color: holder && masters.some((m) => m!.id === holder.id) ? '#8ac88a' : '#9aa6b0' }}>
                  ⚔ {t('現持', 'Borne by')}:{pickName(holder.name, lang)}
                </span>
              )}
            </div>
          )}

          {/* 名器譜系 — the lineage of wielders + a battle tally + heirloom title. */}
          {provenance && provenance.owners.length > 0 && (
            <div style={{ borderTop: '1px solid #1e2832', paddingTop: 6 }}>
              <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{t('名器譜系', 'PROVENANCE')} · {t('歷', '')}{provenance.battles}{t('戰', ' battles')}{provenance.kills > 0 ? ` · ${t('殲', 'felled ')}${provenance.kills.toLocaleString()}` : ''}</span>
                {(() => {
                  const h = heirloomTier(provenance);
                  if (h.tier === 0) return null;
                  const col = h.tier >= 3 ? '#ffd66e' : h.tier >= 2 ? '#d6a8ea' : '#8fe3b0';
                  return <span title={t('傳世名器 — 譜系綿長,躋身傳世(升階時威名遠播)', 'Heirloom — a long lineage earns a title')}
                    style={{ color: col, border: `1px solid ${col}66`, borderRadius: 7, padding: '0 5px' }}>❖ {lang === 'en' ? h.en : h.zh}</span>;
                })()}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#c8b48a', lineHeight: 1.6 }}>
                {provenance.owners.map((oid, oi) => (
                  <span key={oi}>
                    {oi > 0 && <span style={{ color: '#5f6c76' }}> → </span>}
                    {officers[oid] ? pickName(officers[oid].name, lang) : oid}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 銘文 + 出處 */}
          {ins?.motto && (
            <div style={{ borderLeft: `2px solid ${frame.color}66`, paddingLeft: 8, fontSize: '0.74rem', fontStyle: 'italic', color: '#e0c98a' }}>「{ins.motto}」</div>
          )}
          <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#7a8893', lineHeight: 1.6 }}>{desc(base)}</div>
        </div>
      </div>
      {/* ⤓ 存圖 — the treasure as a PNG keepsake. */}
      <button
        onClick={(e) => { e.stopPropagation(); void exportItemCardPNG(itemId, lang, ins); }}
        aria-label={t('存圖', 'Save as image')}
        title={t('存圖(PNG)', 'Save card as PNG')}
        style={{ position: 'absolute', top: 6, right: onClose ? 38 : 6, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(10,14,20,0.72)', color: '#cfd8e0', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}
      >⤓</button>
      {onClose && (
        <button onClick={onClose} aria-label={t('關閉', 'Close')}
          style={{ position: 'absolute', top: 6, right: 6, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(10,14,20,0.72)', color: '#cfd8e0', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}
        >×</button>
      )}
    </div>
  );
}

/** 輕量小卡 — the card WALL's tile: sigil + name + growth marks only, so a
 *  500-item grid stays cheap. Tap for the full ItemCardFace. */
export function ItemTile({ itemId }: { itemId: string }) {
  const lang = useLanguage();
  const refinements = useGameStore((s) => s.itemRefinements);
  const breakthroughs = useGameStore((s) => s.itemBreakthroughs);
  const inscriptions = useGameStore((s) => s.itemInscriptions);
  const base = ITEMS_BY_ID[itemId];
  if (!base) return null;
  const rarity = itemRarity(base);
  const frame = RARITY_FRAME[rarity] ?? RARITY_FRAME.bronze;
  const sigil = sigilFor(base);
  const plus = refinements[itemId] ?? 0;
  const stars = breakthroughs[itemId] ?? 0;
  const lore = itemLoreLevel(itemId);
  return (
    <div style={{ border: `1px solid ${frame.color}`, borderRadius: 8, overflow: 'hidden', background: '#0d1218' }}>
      <div style={{ position: 'relative', height: 74, background: 'radial-gradient(ellipse at 50% 35%, #202a36 0%, #0d1218 80%)', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 54, height: 54 }}>
          {sigil.kind === 'svg'
            ? <WeaponSigil type={sigil.type} color={frame.color} />
            : <div style={{ fontSize: '2.3rem', textAlign: 'center', lineHeight: '54px', color: frame.color, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{sigil.char}</div>}
        </div>
        {lore >= 12 && <span style={{ position: 'absolute', top: 3, right: 5, fontSize: '0.58rem', color: '#e0a868' }}>{itemLoreTitle(lore)?.zh}</span>}
      </div>
      <div style={{ padding: '0.18rem 0.3rem', textAlign: 'center', fontSize: '0.72rem', color: frame.color, borderTop: `1px solid ${frame.color}55`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {inscriptions?.[itemId]?.name ?? pickName(base.name, lang)}
        {(plus > 0 || stars > 0) && (
          <span style={{ marginLeft: 3, fontSize: '0.62rem', color: '#e6c473' }}>{plus > 0 ? `+${plus}` : ''}{stars > 0 ? '★'.repeat(stars) : ''}</span>
        )}
      </div>
    </div>
  );
}

export function ItemCardModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const t = useT();
  return (
    <Modal
      onClose={onClose}
      width="min(360px, 94vw)"
      padding="0"
      zIndex={1210}
      ariaLabel={t('名品卡', 'Item card')}
      frameStyle={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}
      hideClose
    >
      <ItemCardFace itemId={itemId} onClose={onClose} />
    </Modal>
  );
}
