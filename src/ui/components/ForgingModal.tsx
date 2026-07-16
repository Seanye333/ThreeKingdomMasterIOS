import { useEffect, useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { FORGE_RECIPES, ITEMS_BY_ID } from '../../game/data';
import { itemRarity, itemRarityMeta, GEMS, GEMS_BY_ID, GEM_FUSION, GEM_FUSION_COST } from '../../game/data/items';
import { dismantleYield, smithTier } from '../../game/systems/forging';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { ItemCardFace } from './ItemCard';
import type { EntityId } from '../../game/types';
import { useDesc, useLanguage, useT } from '../i18n';
import { usePanelNotice } from './usePanelNotice';
import { Name } from './Name';

interface Props {
  onClose: () => void;
}

const SPARKS = Array.from({ length: 14 }, (_, i) => i);

/** 鑄成 — the reveal when a weapon leaves the anvil: the name slams in over
 *  the forge's glow as embers fly up. Dismiss on click. */
function ForgedReveal({ name, plus, itemId, onDone }: { name?: { zh: string; en: string }; plus?: number; itemId?: string; onDone: () => void }) {
  const t = useT();
  useEffect(() => { playSfx('forge'); }, []);
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        background: 'radial-gradient(ellipse at center, rgba(60,22,6,0.6), rgba(0,0,0,0.9))',
        animation: reduced ? undefined : 'tkmCeremonyBackdrop 0.35s ease-out',
      }}
    >
      {!reduced && (
        <div style={{
          position: 'absolute', left: '50%', top: '46%', width: 560, height: 560,
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', borderRadius: '50%',
          background: 'repeating-conic-gradient(from 0deg, rgba(245,90,32,0) 0deg, rgba(245,140,40,0.5) 6deg, rgba(245,90,32,0) 12deg)',
          WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
          maskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
          animation: 'tkmRaySpin 16s linear infinite, tkmRayPulse 2.6s ease-in-out infinite',
        }} />
      )}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ fontSize: '0.78rem', letterSpacing: '0.5rem', color: '#e8a878', ...(reduced ? {} : { animation: 'tkmVictorySub 0.5s ease-out 0.15s both' }) }}>
          {t('鑄成', 'FORGED')}
        </div>
        <div style={{ fontSize: '3rem', lineHeight: 1, ...(reduced ? {} : { animation: 'tkmVictorySlam 0.7s cubic-bezier(0.2,0.9,0.3,1) both' }) }}>⚒</div>
        <div style={{
          fontSize: '2rem', color: '#ffd9a0', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.1rem',
          textShadow: '0 0 22px rgba(245,140,40,0.7)',
          ...(reduced ? {} : { animation: 'tkmVictorySub 0.5s ease-out 0.35s both' }),
        }}>
          <Name pair={name} />
        </div>
        {!!plus && plus > 0 && (
          <div style={{ fontSize: '0.95rem', color: '#ffd9a0', letterSpacing: '0.2rem', ...(reduced ? {} : { animation: 'tkmVictorySub 0.5s ease-out 0.5s both' }) }}>
            {t(`神品 +${plus}`, `Masterwork +${plus}`)}
          </div>
        )}
        {/* 出爐名品卡 — the freshly-forged piece presented as its card. */}
        {itemId && (
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(330px, 88vw)', marginTop: 6, ...(reduced ? {} : { animation: 'tkmVictorySub 0.55s ease-out 0.6s both' }) }}>
            <ItemCardFace itemId={itemId} />
          </div>
        )}
        {!reduced && SPARKS.map((i) => (
          <span key={i} style={{
            position: 'absolute', left: `calc(50% + ${(i - 7) * 16}px)`, bottom: '30%',
            width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: '50%',
            background: i % 2 ? '#ffd9a0' : '#f5781f', pointerEvents: 'none',
            boxShadow: '0 0 6px rgba(245,140,40,0.9)',
            animation: `tkmMoteFloat ${1.6 + (i % 4) * 0.35}s ease-out ${(i % 5) * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function ForgingModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const buildings = useGameStore((s) => s.buildings);
  const lostItems = useGameStore((s) => s.lostItems);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const officers = useGameStore((s) => s.officers);
  const knownRecipes = useGameStore((s) => s.knownRecipes);
  const itemRefinements = useGameStore((s) => s.itemRefinements);
  const forgeItem = useGameStore((s) => s.forgeItem);
  const dismantleItem = useGameStore((s) => s.dismantleItem);
  const gemStock = useGameStore((s) => s.gemStock);
  const fuseGems = useGameStore((s) => s.fuseGems);
  const { notify, noticeUI } = usePanelNotice();
  const desc = useDesc();

  // Find player cities with a foundry.
  const foundryCities = useMemo(() => {
    return Object.values(cities).filter((c) => {
      if (c.ownerForceId !== playerForceId) return false;
      return buildings.some((b) => b.cityId === c.id && b.id === 'foundry' && b.level > 0);
    });
  }, [cities, buildings, playerForceId]);

  const [pickedCityId, setPickedCityId] = useState<EntityId | null>(
    foundryCities[0]?.id ?? null,
  );
  // The just-forged weapon, shown in a brief reveal over the smithy.
  const [forged, setForged] = useState<{ name: { zh: string; en: string }; plus: number; itemId?: string } | null>(null);

  const pickedCity = pickedCityId ? cities[pickedCityId] : null;
  // 主匠 — the most capable smith stationed here decides the forge's quality.
  const smith = useMemo(() => {
    if (!pickedCityId) return null;
    return Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === pickedCityId && o.status !== 'dead')
      .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0] ?? null;
  }, [officers, pickedCityId, playerForceId]);
  const foundryLevel = pickedCityId
    ? (buildings.find((b) => b.cityId === pickedCityId && b.id === 'foundry')?.level ?? 0)
    : 0;
  const itemsInCity = pickedCityId
    ? lostItems.filter((li) => li.cityId === pickedCityId).map((li) => li.itemId)
    : [];

  const handle = (recipeId: string) => {
    if (!pickedCityId) return;
    const r = forgeItem(pickedCityId, recipeId);
    if (!r.ok) { notify(r.reason); return; }
    const recipe = FORGE_RECIPES.find((x) => x.id === recipeId);
    const item = recipe ? ITEMS_BY_ID[recipe.resultItemId] : null;
    if (item) setForged({ name: item.name, plus: r.plus ?? 0, itemId: item.id });
  };

  const handleDismantle = (itemId: string) => {
    if (!pickedCityId) return;
    const r = dismantleItem(pickedCityId, itemId);
    if (!r.ok) { notify(r.reason); return; }
    playSfx('forge');
  };

  return (
    <>
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'grid', placeItems: 'center',
        zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          borderTop: '3px solid #f55a20',  // ember orange — 炉火
          width: 'min(820px,100%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
          boxShadow: '0 0 16px rgba(245,90,32,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>鍛造</div>
            <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>Forge & Smithy</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #2b3845' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Foundry City
          </div>
          {foundryCities.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: '#b8442e', fontStyle: 'italic' }}>
              No city with a Foundry yet. Build one in a city via the City panel.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {foundryCities.map((c) => {
                const lvl = buildings.find((b) => b.cityId === c.id && b.id === 'foundry')?.level ?? 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setPickedCityId(c.id)}
                    style={{
                      background: pickedCityId === c.id ? '#26323e' : '#10161e',
                      border: `1px solid ${pickedCityId === c.id ? '#e6c473' : '#2b3845'}`,
                      color: pickedCityId === c.id ? '#e6c473' : '#aab6c0',
                      padding: '0.3rem 0.7rem',
                      fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    {c.name.zh} <span style={{ fontSize: '0.7rem', color: '#7a8893' }}>Lv{lvl}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {pickedCity && (
            <>
              <div style={{ fontSize: '0.78rem', color: '#7a8893', marginBottom: '0.35rem' }}>
                {lang === 'en' ? 'Treasury at ' : '府庫 · '}<Name pair={pickedCity.name} />: <strong style={{ color: '#c9a64e' }}>{pickedCity.gold}g</strong>
                {(pickedCity.iron ?? 0) > 0 && <> · <span style={{ color: '#9fb0bf' }}>{lang === 'en' ? `Iron ${pickedCity.iron}` : `鐵 ${pickedCity.iron}`}</span></>} ·
                {lang === 'en' ? ` Items here: ${itemsInCity.length}` : ` 存物 ${itemsInCity.length}`}
              </div>
              {/* 主匠 — the resident smith decides how fine each piece comes out. */}
              <div style={{ fontSize: '0.74rem', color: '#7a8893', marginBottom: '0.5rem' }}>
                {smith ? (() => {
                  const tier = smithTier(smith.stats.intelligence, (smith.traits ?? []).includes('inventive'));
                  const tierCol = tier.tier >= 3 ? '#ffd66e' : tier.tier >= 2 ? '#8ee8ff' : tier.tier >= 1 ? '#a8d8a8' : '#9aa6b0';
                  return (
                  <>
                    {lang === 'en' ? 'Master smith: ' : '主匠 · '}
                    <span style={{ color: '#e6c473' }}><Name pair={smith.name} /></span>
                    <span style={{ color: '#7a8893' }}> {lang === 'en' ? 'Int' : '智'}{smith.stats.intelligence}</span>
                    {(smith.traits ?? []).includes('inventive') && <span style={{ color: '#88b7e8' }}> · {lang === 'en' ? '✦ Inventive' : '✦ 巧思'}</span>}
                    <span title={tier.tier >= 3 ? (lang === 'en' ? 'Divine Artificer — finer masterworks, and pieces born with renown' : '神匠 — 神品更易、開爐即帶名器種子威名') : ''}
                      style={{ color: tierCol, marginLeft: 6, border: `1px solid ${tierCol}55`, borderRadius: 7, padding: '0 6px', fontSize: '0.7rem' }}>
                      {tier.tier >= 3 ? '⚒ ' : ''}{lang === 'en' ? tier.en : `監造·${tier.zh}`}
                    </span>
                  </>
                  );
                })() : (
                  <span style={{ color: '#b8442e', fontStyle: 'italic' }}>{lang === 'en' ? 'No smith stationed — forged pieces come out plain.' : '無武將駐守 —— 鑄件平平。'}</span>
                )}
              </div>
              {FORGE_RECIPES.map((r) => {
                const result = ITEMS_BY_ID[r.resultItemId];
                const known = (knownRecipes ?? []).includes(r.id);
                const have = r.ingredients.every((id) => itemsInCity.includes(id));
                const lvlOK = foundryLevel >= r.minFoundryLevel;
                const goldOK = pickedCity.gold >= r.goldCost;
                const ironOK = !r.ironCost || (pickedCity.iron ?? 0) >= r.ironCost;
                const canForge = known && have && lvlOK && goldOK && ironOK;
                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#10161e',
                      border: '1px solid ' + (canForge ? '#e6c473' : '#2b3845'),
                      padding: '0.7rem 0.85rem',
                      marginBottom: '0.4rem',
                      opacity: canForge ? 1 : known ? 0.65 : 0.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ color: known ? '#e6c473' : '#7a8893', fontSize: '1rem' }}>
                        {known ? '→ ' : '🔒 '}<Name pair={result?.name} />
                      </div>
                      <button
                        onClick={() => handle(r.id)}
                        disabled={!canForge}
                        title={!known ? (lang === 'en' ? 'Blueprint not yet learned — research it via 研發 at a foundry' : '鑄法未習得 —— 由巧思之士於鐵工坊研發') : undefined}
                        style={{
                          background: '#26323e',
                          border: '1px solid ' + (canForge ? '#e6c473' : '#2b3845'),
                          color: canForge ? '#e6c473' : '#6a5238',
                          padding: '0.3rem 0.8rem',
                          fontFamily: 'inherit', cursor: canForge ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {known ? '鍛 Forge' : (lang === 'en' ? '🔒 Locked' : '🔒 未習')}
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#aab6c0', fontStyle: 'italic', marginTop: '0.3rem' }}>
                      {desc(r)}
                    </div>
                    {r.ingredients.length > 0 && (
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: '#7a8893', marginTop: '0.3rem' }}>
                        Ingredients: {r.ingredients.map((id) => (
                          <span key={id} style={{ color: itemsInCity.includes(id) ? '#7ed68a' : '#b8442e', marginRight: '0.5rem' }}>
                            {ITEMS_BY_ID[id]?.name.zh ?? id} {itemsInCity.includes(id) ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: '#7a8893', marginTop: '0.2rem' }}>
                      {r.goldCost}g
                      {!!r.ironCost && <span style={{ color: ironOK ? '#9fb0bf' : '#b8442e' }}> · {lang === 'en' ? `${r.ironCost} iron` : `鐵 ${r.ironCost}`}</span>}
                      {' · req Foundry Lv'}{r.minFoundryLevel}
                    </div>
                  </div>
                );
              })}

              {/* 熔毀 — melt loose items back into iron + gold. */}
              {itemsInCity.length > 0 && (
                <div style={{ marginTop: '1.1rem', borderTop: '1px solid #2b3845', paddingTop: '0.8rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#c8884e', letterSpacing: '0.05rem', marginBottom: '0.2rem' }}>
                    {lang === 'en' ? 'Melt Down' : '熔毀'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    {lang === 'en'
                      ? 'Reclaim iron + gold from loose items — feeds the iron-forge discount.'
                      : '把藏寶池的散物熔回鐵與金 —— 鐵料回流可省鍛造金。'}
                  </div>
                  {itemsInCity.map((id, idx) => {
                    const it = ITEMS_BY_ID[id];
                    if (!it) return null;
                    const plus = itemRefinements[id] ?? 0;
                    const meta = itemRarityMeta(itemRarity(it));
                    const yld = dismantleYield(it, plus);
                    return (
                      <div
                        key={`${id}-${idx}`}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#10161e', border: '1px solid #2b3845',
                          padding: '0.4rem 0.7rem', marginBottom: '0.3rem',
                        }}
                      >
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: meta.color }}><Name pair={it.name} /></span>
                          {plus > 0 && <span style={{ color: '#ffd9a0', fontSize: '0.72rem' }}> +{plus}</span>}
                          <span style={{ color: '#7a8893', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem' }}> → 鐵 {yld.iron} · {yld.gold}g</span>
                        </div>
                        <button
                          onClick={() => handleDismantle(id)}
                          style={{
                            background: '#241a14', border: '1px solid #c8884e', color: '#d49a5e',
                            padding: '0.25rem 0.7rem', fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem',
                          }}
                        >
                          {lang === 'en' ? 'Melt' : '熔'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 寶石庫存 / 合成 — gems from melts; fuse 3 → 1 next grade. */}
              {GEMS.some((g) => (gemStock[g.id] ?? 0) > 0) && (
                <div style={{ marginTop: '1.1rem', borderTop: '1px solid #2b3845', paddingTop: '0.8rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#88b7e8', letterSpacing: '0.05rem', marginBottom: '0.2rem' }}>
                    {lang === 'en' ? 'Gem Vault' : '寶石庫存'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                    {lang === 'en' ? `Fuse ${GEM_FUSION_COST} of a grade into 1 of the next.` : `同階寶石 ${GEM_FUSION_COST} 顆合成 1 顆上階。`}
                  </div>
                  {GEMS.filter((g) => (gemStock[g.id] ?? 0) > 0).map((g) => {
                    const n = gemStock[g.id] ?? 0;
                    const out = GEM_FUSION[g.id];
                    const canFuse = !!out && n >= GEM_FUSION_COST;
                    return (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#10161e', border: '1px solid #2b3845', padding: '0.35rem 0.7rem', marginBottom: '0.3rem' }}>
                        <div style={{ fontSize: '0.82rem' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 'var(--tkm-radius-xs)', background: g.color, display: 'inline-block', marginRight: '0.4rem', boxShadow: '0 0 3px ' + g.color }} />
                          <span style={{ color: g.color }}>{lang === 'en' ? g.name.en : g.name.zh}</span>
                          <span style={{ color: '#9fb0bf' }}> ×{n}</span>
                          {out && <span style={{ color: '#7a8893', fontSize: '0.7rem' }}> → {lang === 'en' ? GEMS_BY_ID[out].name.en : GEMS_BY_ID[out].name.zh}</span>}
                        </div>
                        {out && (
                          <button
                            onClick={() => { const r = fuseGems(g.id); if (!r.ok) notify(r.reason); }}
                            disabled={!canFuse}
                            title={canFuse ? undefined : (lang === 'en' ? `Need ${GEM_FUSION_COST}` : `需 ${GEM_FUSION_COST} 顆`)}
                            style={{ background: '#10161e', border: `1px solid ${canFuse ? '#88b7e8' : '#2b3845'}`, color: canFuse ? '#88b7e8' : '#4a5662', padding: '0.2rem 0.6rem', fontFamily: 'inherit', cursor: canFuse ? 'pointer' : 'not-allowed', fontSize: '0.78rem' }}
                          >
                            {lang === 'en' ? 'Fuse' : '合成'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    {forged && <ForgedReveal name={forged.name} plus={forged.plus} itemId={forged.itemId} onDone={() => setForged(null)} />}
    {noticeUI}
    </>
  );
}
