import { useEffect, useMemo, useState } from 'react';
import { FORGE_RECIPES, ITEMS_BY_ID } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import type { EntityId } from '../../game/types';
import { useDesc, useLanguage, useT } from '../i18n';
import { Name } from './Name';

interface Props {
  onClose: () => void;
}

const SPARKS = Array.from({ length: 14 }, (_, i) => i);

/** 鑄成 — the reveal when a weapon leaves the anvil: the name slams in over
 *  the forge's glow as embers fly up. Dismiss on click. */
function ForgedReveal({ name, onDone }: { name?: { zh: string; en: string }; onDone: () => void }) {
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
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const buildings = useGameStore((s) => s.buildings);
  const lostItems = useGameStore((s) => s.lostItems);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forgeItem = useGameStore((s) => s.forgeItem);
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
  const [forged, setForged] = useState<{ zh: string; en: string } | null>(null);

  const pickedCity = pickedCityId ? cities[pickedCityId] : null;
  const foundryLevel = pickedCityId
    ? (buildings.find((b) => b.cityId === pickedCityId && b.id === 'foundry')?.level ?? 0)
    : 0;
  const itemsInCity = pickedCityId
    ? lostItems.filter((li) => li.cityId === pickedCityId).map((li) => li.itemId)
    : [];

  const handle = (recipeId: string) => {
    if (!pickedCityId) return;
    const r = forgeItem(pickedCityId, recipeId);
    if (!r.ok) { alert(r.reason); return; }
    const recipe = FORGE_RECIPES.find((x) => x.id === recipeId);
    const item = recipe ? ITEMS_BY_ID[recipe.resultItemId] : null;
    if (item) setForged(item.name);
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
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
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
              <div style={{ fontSize: '0.78rem', color: '#7a8893', marginBottom: '0.5rem' }}>
                {lang === 'en' ? 'Treasury at ' : '府庫 · '}<Name pair={pickedCity.name} />: <strong style={{ color: '#c9a64e' }}>{pickedCity.gold}g</strong> ·
                {lang === 'en' ? ` Items here: ${itemsInCity.length}` : ` 存物 ${itemsInCity.length}`}
              </div>
              {FORGE_RECIPES.map((r) => {
                const result = ITEMS_BY_ID[r.resultItemId];
                const have = r.ingredients.every((id) => itemsInCity.includes(id));
                const lvlOK = foundryLevel >= r.minFoundryLevel;
                const goldOK = pickedCity.gold >= r.goldCost;
                const canForge = have && lvlOK && goldOK;
                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#10161e',
                      border: '1px solid ' + (canForge ? '#e6c473' : '#2b3845'),
                      padding: '0.7rem 0.85rem',
                      marginBottom: '0.4rem',
                      opacity: canForge ? 1 : 0.65,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ color: '#e6c473', fontSize: '1rem' }}>
                        → <Name pair={result?.name} />
                      </div>
                      <button
                        onClick={() => handle(r.id)}
                        disabled={!canForge}
                        style={{
                          background: '#26323e',
                          border: '1px solid ' + (canForge ? '#e6c473' : '#2b3845'),
                          color: canForge ? '#e6c473' : '#6a5238',
                          padding: '0.3rem 0.8rem',
                          fontFamily: 'inherit', cursor: canForge ? 'pointer' : 'not-allowed',
                        }}
                      >
                        鍛 Forge
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#aab6c0', fontStyle: 'italic', marginTop: '0.3rem' }}>
                      {desc(r)}
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: '#7a8893', marginTop: '0.3rem' }}>
                      Ingredients: {r.ingredients.map((id) => (
                        <span key={id} style={{ color: itemsInCity.includes(id) ? '#7ed68a' : '#b8442e', marginRight: '0.5rem' }}>
                          {ITEMS_BY_ID[id]?.name.zh ?? id} {itemsInCity.includes(id) ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: '#7a8893', marginTop: '0.2rem' }}>
                      {r.goldCost}g · req Foundry Lv{r.minFoundryLevel}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
    {forged && <ForgedReveal name={forged} onDone={() => setForged(null)} />}
    </>
  );
}
