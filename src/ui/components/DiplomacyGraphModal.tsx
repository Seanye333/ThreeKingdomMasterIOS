import { useMemo } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { getRelation, pairKey } from '../../game/types';
import { Name } from './Name';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

/**
 * Visual diplomacy graph: forces around a circle, lines colored by status.
 */
export function DiplomacyGraphModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const t = useT();
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const diplomacy = useGameStore((s) => s.diplomacy);

  const liveForces = useMemo(
    () => Object.values(forces).filter((f) => Object.values(cities).some((c) => c.ownerForceId === f.id)),
    [forces, cities],
  );

  const cx = 350;
  const cy = 300;
  const r = 220;

  const positions = liveForces.map((f, i) => {
    const angle = (Math.PI * 2 * i) / liveForces.length - Math.PI / 2;
    return {
      force: f,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });

  // Build pairs.
  const pairs: Array<{ a: typeof positions[0]; b: typeof positions[0]; status: string; score: number }> = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const rel = getRelation(diplomacy, positions[i].force.id, positions[j].force.id);
      pairs.push({ a: positions[i], b: positions[j], status: rel.status, score: rel.score });
    }
  }

  return (
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
          width: 'min(820px,100%)',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>關係図</div>
            <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>Diplomacy Web</div>
          </div>
          <button onClick={onClose} aria-label={t('關閉', 'Close')} title={t('關閉', 'Close')} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>
        <svg viewBox="0 0 700 600" style={{ width: '100%', maxHeight: '70vh', display: 'block' }}>
          {/* Edges */}
          {pairs.map((p, i) => {
            const color =
              p.status === 'allied' ? '#e6c473' :
              p.status === 'non-aggression' ? '#88b7e8' :
              p.score < -30 ? '#b8442e' : '#364654';
            const dash =
              p.status === 'non-aggression' ? '6 4' :
              undefined;
            return (
              <line
                key={i}
                x1={p.a.x} y1={p.a.y} x2={p.b.x} y2={p.b.y}
                stroke={color}
                strokeWidth={p.status === 'allied' ? 3 : p.status === 'non-aggression' ? 2 : p.score < -30 ? 2 : 1}
                strokeDasharray={dash}
                opacity={p.status === 'allied' || p.status === 'non-aggression' || p.score < -30 ? 0.85 : 0.25}
              />
            );
          })}
          {/* Force nodes */}
          {positions.map((p) => (
            <g key={p.force.id}>
              <circle cx={p.x} cy={p.y} r="40" fill={p.force.color} stroke="#10161e" strokeWidth="2" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff" fontFamily="Songti SC, serif">
                {p.force.name.zh.charAt(0)}
              </text>
              <text x={p.x} y={p.y + 58} textAnchor="middle" fontSize="12" fill="#e6edf3" fontFamily="Songti SC, serif">
                <Name pair={p.force.name} />
              </text>
            </g>
          ))}
        </svg>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1.5rem', fontSize: '0.78rem', borderTop: '1px solid #2b3845', color: '#aab6c0' }}>
          <span><span style={{ background: '#e6c473', display: 'inline-block', width: 14, height: 3, marginRight: 4, verticalAlign: 'middle' }} /> {t('同盟', 'Allied')}</span>
          <span><span style={{ background: '#88b7e8', display: 'inline-block', width: 14, height: 3, marginRight: 4, verticalAlign: 'middle' }} /> {t('互不侵犯', 'Non-aggression')}</span>
          <span><span style={{ background: '#b8442e', display: 'inline-block', width: 14, height: 3, marginRight: 4, verticalAlign: 'middle' }} /> {t('敵對', 'Hostile')}</span>
        </div>
      </div>
    </div>
  );
}

// Make pairKey importable (used elsewhere).
void pairKey;
