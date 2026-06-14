import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { PROVINCES } from '../../game/data';
import { useT } from '../i18n';

/**
 * 州牧圖 — the realm a province at a time. For each of the 13 provinces: how
 * many of its cities you hold against the field, who dominates the region, and
 * your regional weight in troops, gold and grain. The strategic altitude the
 * per-city roster can't give — where you own a heartland and where you hold a
 * lonely outpost. Pure read.
 */
export function ProvinceModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const rows = useMemo(() => {
    return PROVINCES.map((prov) => {
      const provCities = prov.cityIds.map((id) => cities[id]).filter(Boolean);
      if (provCities.length === 0) return null;
      const ownerCounts: Record<string, number> = {};
      let mine = 0, troops = 0, gold = 0, food = 0, held = 0;
      for (const c of provCities) {
        if (!c.ownerForceId) continue;
        held++;
        ownerCounts[c.ownerForceId] = (ownerCounts[c.ownerForceId] ?? 0) + 1;
        if (c.ownerForceId === playerForceId) { mine++; troops += c.troops; gold += c.gold; food += c.food; }
      }
      const dominantId = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        id: prov.id, name: prov.name.zh, color: prov.color,
        total: provCities.length, held, mine, troops, gold, food,
        dominant: dominantId ? { name: forces[dominantId]?.name.zh ?? dominantId, color: forces[dominantId]?.color ?? '#888', isMe: dominantId === playerForceId } : null,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.mine - a.mine || b.total - a.total);
  }, [cities, forces, playerForceId]);

  const num = (n: number) => n.toLocaleString();

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #5a4530',
        width: 'min(620px,100%)', maxHeight: '86vh', overflowY: 'auto', color: '#e8d9b0',
        fontFamily: '"Songti SC","Noto Serif SC",serif', padding: '1rem 1.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div style={{ fontSize: '1.15rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>🗺 {t('州域', 'Provinces')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((r) => {
            const frac = r.held > 0 ? r.mine / r.held : 0;
            return (
              <div key={r.id} style={{
                padding: '0.5rem 0.7rem', borderRadius: 5, background: '#1a140d',
                border: `1px solid ${r.mine > 0 ? '#4a3520' : '#2a2014'}`,
                borderLeft: `4px solid ${r.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ color: '#f0e0b0', fontSize: '0.95rem' }}>{r.name}
                    <span style={{ color: '#8a7050', fontSize: '0.76rem' }}> · {t(`控 ${r.mine}/${r.held}`, `${r.mine}/${r.held} held`)}</span>
                  </span>
                  {r.dominant && (
                    <span style={{ color: r.dominant.color, fontSize: '0.78rem' }}>
                      {r.dominant.isMe ? t('我據此州', 'yours') : t(`${r.dominant.name} 主之`, `${r.dominant.name} dominant`)}
                    </span>
                  )}
                </div>
                {/* control bar — player share of the held cities */}
                <div style={{ height: 4, background: '#2a2014', borderRadius: 2, margin: '4px 0', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${frac * 100}%`, background: frac >= 0.5 ? '#7ed68a' : '#d4a84a' }} />
                </div>
                {r.mine > 0 && (
                  <div style={{ fontSize: '0.74rem', color: '#c0a878', display: 'flex', gap: 14, fontFamily: 'ui-monospace, monospace' }}>
                    <span>⚔ {num(r.troops)}</span>
                    <span>🪙 {num(r.gold)}</span>
                    <span>🌾 {num(r.food)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
