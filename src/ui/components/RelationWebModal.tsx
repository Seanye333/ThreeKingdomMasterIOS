import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { OFFICER_RELATIONSHIPS } from '../../game/data/relationships';
import { OATH_BONDS, isFeudKind } from '../../game/data/bonds';
import { parentsOf, childrenOf, spousesOf, siblingsOf } from '../../game/systems/relationshipEffects';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 群英譜 — a relationship web. The bonds a card lists as chips, drawn instead
 * as an ego-network: the focal officer at the hub, their ties radiating out —
 * 義結 (green) / 宿敵 (amber) / 私仇 (red) / 師徒 (blue) / 主從 (slate) / 情
 * (rose) / 姻親 (pink) / 血親 (gold) — each edge colour-and-label coded. Click
 * any spoke to re-centre and walk the web. Reads the static relationship
 * tables + runtime family; zero mechanics, a way to see the age's human map.
 */

interface Edge { otherId: string; color: string; label: string }

const REL_STYLE: Record<string, { color: string; zh: string; en: string }> = {
  'sworn-brothers': { color: '#8ac88a', zh: '義結', en: 'Sworn' },
  rival: { color: '#e0a868', zh: '宿敵', en: 'Rival' },
  enemy: { color: '#e0574a', zh: '私仇', en: 'Feud' },
  'mentor-student': { color: '#7ec0e0', zh: '師徒', en: 'Mentor' },
  'master-servant': { color: '#a0b0c8', zh: '主從', en: 'Liege' },
  romantic: { color: '#e89ac0', zh: '情', en: 'Love' },
  spouse: { color: '#e0a8d0', zh: '姻親', en: 'Married' },
  kin: { color: '#e6c473', zh: '血親', en: 'Kin' },
};

export function RelationWebModal({ initialFocalId, onClose }: { initialFocalId: string; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const family = useGameStore((s) => s.family);
  const [focalId, setFocalId] = useState(initialFocalId);
  useEscapeKey(onClose);

  const nameOf = (id: string) => (officers[id] ? pickName(officers[id].name, lang) : id);

  const edges = useMemo<Edge[]>(() => {
    const map = new Map<string, Edge>();
    const add = (otherId: string, styleKey: string) => {
      if (!otherId || otherId === focalId || map.has(otherId)) return;
      const st = REL_STYLE[styleKey] ?? REL_STYLE.kin;
      map.set(otherId, { otherId, color: st.color, label: lang === 'en' ? st.en : st.zh });
    };
    for (const r of OFFICER_RELATIONSHIPS) {
      if (r.a === focalId) add(r.b, r.kind);
      else if (r.b === focalId) add(r.a, r.kind);
    }
    for (const b of OATH_BONDS) {
      const other = b.officerA === focalId ? b.officerB : b.officerB === focalId ? b.officerA : null;
      if (other) add(other, isFeudKind(b.kind) ? 'enemy' : b.kind === 'oath' ? 'sworn-brothers' : 'kin');
    }
    const fam = family ?? [];
    for (const s of spousesOf(focalId, fam)) add(s, 'spouse');
    for (const p of parentsOf(focalId, fam)) add(p, 'kin');
    for (const c of childrenOf(focalId, fam)) add(c, 'kin');
    for (const s of siblingsOf(focalId, fam)) add(s, 'kin');
    return [...map.values()].slice(0, 14);
  }, [focalId, family, lang]);

  const C = 175, R = 128; // canvas centre + spoke radius
  const focalName = nameOf(focalId);

  const node = (id: string, x: number, y: number, r: number, isFocal: boolean, color: string) => (
    <g key={id} style={{ cursor: isFocal ? 'default' : 'pointer' }} onClick={isFocal ? undefined : () => setFocalId(id)}>
      <clipPath id={`clip-${id}`}><circle cx={x} cy={y} r={r} /></clipPath>
      <circle cx={x} cy={y} r={r} fill="#141c26" stroke={color} strokeWidth={isFocal ? 3 : 2} />
      <image href={`${import.meta.env.BASE_URL}portraits/${id}.webp`} x={x - r} y={y - r} width={r * 2} height={r * 2}
        clipPath={`url(#clip-${id})`} preserveAspectRatio="xMidYMin slice" />
      <text x={x} y={y + r + 13} textAnchor="middle" fontSize={isFocal ? 13 : 11} fill={isFocal ? '#f2e2b8' : '#c0ccd6'}
        style={{ fontFamily: '"Ma Shan Zheng", "Songti SC", serif', pointerEvents: 'none' }}>{nameOf(id)}</text>
    </g>
  );

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-label={t('群英譜', 'The Web of Ties')}
      style={{ position: 'fixed', inset: 0, zIndex: 1450, background: 'rgba(4,6,10,0.82)', display: 'grid', placeItems: 'center', padding: '1rem' }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(430px, 94vw)', background: 'linear-gradient(175deg, #131b26 0%, #0a0e15 100%)', border: '1px solid #2b3d4e', borderRadius: 'var(--tkm-radius-lg)', boxShadow: '0 12px 48px rgba(0,0,0,0.8)', padding: '1rem 1rem 0.7rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '1rem', color: '#cfe0ea', letterSpacing: '0.2rem', fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{t('群英譜', 'WEB OF TIES')}</span>
          <span style={{ fontSize: '0.7rem', color: '#7a8893' }}>{focalName} · {edges.length} {t('緣', 'ties')}</span>
        </div>
        {edges.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#7a8893', fontSize: '0.8rem', padding: '2rem 0' }}>
            {t('此人於譜中無所繫 — 孤臣一介。', 'No recorded ties — a solitary figure.')}
          </div>
        ) : (
          <svg viewBox="0 0 350 350" width="100%" style={{ display: 'block' }}>
            {/* spokes first so nodes sit on top */}
            {edges.map((e, i) => {
              const a = (i / edges.length) * Math.PI * 2 - Math.PI / 2;
              const x = C + R * Math.cos(a), y = C + R * Math.sin(a);
              const mx = C + (R * 0.56) * Math.cos(a), my = C + (R * 0.56) * Math.sin(a);
              return (
                <g key={`edge-${e.otherId}`}>
                  <line x1={C} y1={C} x2={x} y2={y} stroke={e.color} strokeWidth={1.5} opacity={0.55} />
                  <rect x={mx - 15} y={my - 8} width={30} height={15} rx={7} fill="#0a0e15" opacity={0.85} />
                  <text x={mx} y={my + 3} textAnchor="middle" fontSize={9.5} fill={e.color} style={{ pointerEvents: 'none' }}>{e.label}</text>
                </g>
              );
            })}
            {edges.map((e, i) => {
              const a = (i / edges.length) * Math.PI * 2 - Math.PI / 2;
              return node(e.otherId, C + R * Math.cos(a), C + R * Math.sin(a), 26, false, e.color);
            })}
            {node(focalId, C, C, 34, true, '#e6c473')}
          </svg>
        )}
        <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#5f6c76', paddingBottom: 6 }}>
          {t('點節點以其為心走譜 · Esc 收起', 'Tap a node to re-centre · Esc to close')}
        </div>
      </div>
    </div>
  );
}
