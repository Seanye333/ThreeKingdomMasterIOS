import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { Icon } from './Icon';
import { useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 大勢 — the realm as lines: one per living force, power over time.
 * Rises tell you who to court; bleeds tell you who to eat.
 */
export function PowerGraphModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const history = useGameStore((s) => s.powerHistory ?? []);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);

  // 實時排行 — current standings (cities / troops / gold) + unification progress.
  const { rows, totalCities, unif } = useMemo(() => {
    const agg: Record<string, { cities: number; troops: number; gold: number }> = {};
    let total = 0;
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId) continue;
      total++;
      const a = (agg[c.ownerForceId] ??= { cities: 0, troops: 0, gold: 0 });
      a.cities++; a.troops += c.troops; a.gold += c.gold;
    }
    const rs = Object.entries(agg).map(([fid, v]) => ({
      fid, ...v,
      name: forces[fid]?.name.zh ?? fid,
      color: forces[fid]?.color ?? '#777',
      ruler: forces[fid]?.rulerOfficerId ? (officers[forces[fid].rulerOfficerId]?.name.zh ?? '') : '',
    })).sort((a, b) => b.cities - a.cities || b.troops - a.troops);
    const mine = rs.find((r) => r.fid === playerForceId)?.cities ?? 0;
    return { rows: rs, totalCities: total, unif: Math.round((mine / Math.max(1, total)) * 100) };
  }, [cities, forces, officers, playerForceId]);

  const W = 560;
  const H = 300;
  const PAD = 34;

  const { lines, maxP, years } = useMemo(() => {
    const living = new Set(Object.values(cities).map((c) => c.ownerForceId).filter(Boolean) as string[]);
    // Every force that EVER appears in history still draws (fallen lines
    // flatline to zero — that's the story).
    const ids = new Set<string>();
    for (const snap of history) Object.keys(snap.byForce).forEach((id) => ids.add(id));
    let max = 1;
    for (const snap of history) for (const v of Object.values(snap.byForce)) max = Math.max(max, v);
    const n = Math.max(1, history.length - 1);
    const ls = [...ids].map((fid) => {
      const pts = history.map((snap, i) => {
        const x = PAD + (i / n) * (W - PAD * 2);
        const y = H - PAD - ((snap.byForce[fid] ?? 0) / max) * (H - PAD * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return {
        fid,
        pts,
        color: forces[fid]?.color ?? '#777',
        name: forces[fid]?.name.zh ?? fid,
        alive: living.has(fid),
        latest: history[history.length - 1]?.byForce[fid] ?? 0,
      };
    }).sort((a, b) => b.latest - a.latest);
    return {
      lines: ls,
      maxP: max,
      years: history.length > 0 ? [history[0].year, history[history.length - 1].year] : null,
    };
  }, [history, forces, cities]);

  return (
    <Modal onClose={onClose} width="min(640px, 100%)" padding="1rem 1.3rem" icon="📈" title={t('天下大勢', 'Balance of Power')}>
        {history.length < 2 ? (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1.5rem 0' }}>
            {t('史官尚在磨墨 — 過幾旬再來看曲線。', 'The historians are still grinding ink — give it a few seasons.')}
          </div>
        ) : (
          <>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ background: '#14100a', border: '1px solid #18212b' }}>
              {/* Frame + axis labels */}
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1={PAD} x2={W - PAD} y1={H - PAD - f * (H - PAD * 2)} y2={H - PAD - f * (H - PAD * 2)} stroke="#241c12" />
              ))}
              {lines.map((l) => (
                <polyline
                  key={l.fid}
                  points={l.pts}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.fid === playerForceId ? 2.6 : 1.4}
                  opacity={l.alive ? 0.95 : 0.35}
                />
              ))}
              {years && (
                <>
                  <text x={PAD} y={H - 10} fontSize={11} fill="#7a8893">{years[0]}年</text>
                  <text x={W - PAD} y={H - 10} fontSize={11} fill="#7a8893" textAnchor="end">{years[1]}年</text>
                  <text x={PAD} y={16} fontSize={10} fill="#5f6c76">{t('國力(城+兵+財)峰值', 'Power (cities+troops+gold), peak')} {Math.round(maxP / 1000)}k</text>
                </>
              )}
            </svg>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, fontSize: '0.75rem' }}>
              {lines.map((l) => (
                <span key={l.fid} style={{ color: l.color, opacity: l.alive ? 1 : 0.45 }}>
                  ■ {l.name}{l.fid === playerForceId ? '(我)' : ''}{!l.alive ? t('(亡)', ' (fallen)') : ''}
                </span>
              ))}
            </div>
          </>
        )}

        {/* 實時排行 + 統一進度 — who holds what, right now. */}
        {rows.length > 0 && (
          <div style={{ marginTop: '0.8rem', borderTop: '1px solid #243240', paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#e6c473', marginBottom: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="city" size={13} color="#e6c473" />{t('當世排行', 'Standings')}</span>
              <span title={t('已控城池 / 天下城池', 'cities held / total')}>
                {t('統一', 'Unify')} {unif}% <span style={{ color: '#7a8893' }}>({rows.find((r) => r.fid === playerForceId)?.cities ?? 0}/{totalCities})</span>
              </span>
            </div>
            <div style={{ height: 5, background: '#241c12', borderRadius: 'var(--tkm-radius-xs)', marginBottom: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${unif}%`, background: unif >= 50 ? '#7ed68a' : '#e6c473' }} />
            </div>
            <div style={{ maxHeight: 150, overflowY: 'auto', fontSize: '0.76rem' }}>
              {rows.slice(0, 12).map((r, i) => (
                <div key={r.fid} style={{
                  display: 'grid', gridTemplateColumns: '1.2rem 1fr auto auto', gap: 8, padding: '2px 4px',
                  background: r.fid === playerForceId ? 'rgba(212,168,74,0.14)' : 'transparent',
                  alignItems: 'baseline',
                }}>
                  <span style={{ color: '#7a8893' }}>{i + 1}.</span>
                  <span style={{ color: r.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ■ {r.name}{r.ruler ? <span style={{ color: '#97a4ae' }}> · {r.ruler}</span> : ''}{r.fid === playerForceId ? '(我)' : ''}
                  </span>
                  <span style={{ color: '#aab6c0', fontFamily: 'ui-monospace, monospace' }}>{r.cities}{t('城', '')}</span>
                  <span style={{ color: '#9aa8b0', fontFamily: 'ui-monospace, monospace' }}>{Math.round(r.troops / 1000)}k{t('兵', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </Modal>
  );
}
