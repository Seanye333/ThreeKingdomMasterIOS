import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { getRelation } from '../../game/types/diplomacy';
import { useT, useLanguage } from '../i18n';

/**
 * 邦交一覽 — the diplomatic state of the realm at a glance: a force × force
 * matrix coloured by relation (allied / non-aggression / neutral, warmed or
 * chilled by the -100..+100 score), with living forces ranked by city count.
 */
export function RelationsModal({ onClose }: { onClose: () => void }) {
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const t = useT();
  const lang = useLanguage();

  // Living forces only (own at least one city), biggest realms first.
  const living = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of Object.values(cities)) {
      if (c.ownerForceId) counts.set(c.ownerForceId, (counts.get(c.ownerForceId) ?? 0) + 1);
    }
    return Object.values(forces)
      .filter((f) => (counts.get(f.id) ?? 0) > 0)
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      .map((f) => ({ force: f, cityCount: counts.get(f.id) ?? 0 }));
  }, [forces, cities]);

  const cellFor = (aId: string, bId: string) => {
    if (aId === bId) return { bg: 'rgba(90,69,48,0.35)', label: '—', color: '#364654', title: '' };
    const rel = getRelation(diplomacy, aId, bId);
    const score = rel.score;
    if (rel.status === 'allied') {
      return { bg: 'rgba(126,214,138,0.28)', label: '盟', color: '#9ed68a', title: `${t('同盟', 'Allied')} · ${score}` };
    }
    if (rel.status === 'non-aggression') {
      return { bg: 'rgba(136,183,232,0.22)', label: '約', color: '#88b7e8', title: `${t('互不侵犯', 'Non-aggression')} · ${score}` };
    }
    // Neutral — tint by score: hostile reds below, warming golds above.
    if (score <= -30) return { bg: 'rgba(184,68,46,0.30)', label: '惡', color: '#e08070', title: `${t('交惡', 'Hostile')} · ${score}` };
    if (score >= 30) return { bg: 'rgba(212,168,74,0.20)', label: '善', color: '#e6c473', title: `${t('友好', 'Cordial')} · ${score}` };
    return { bg: 'rgba(40,32,24,0.45)', label: '中', color: '#7a8893', title: `${t('中立', 'Neutral')} · ${score}` };
  };

  const name = (f: { name: { zh: string; en: string } }) => (lang === 'en' ? f.name.en : f.name.zh);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(8,6,4,0.82)',
        display: 'grid', placeItems: 'center', zIndex: 260,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '94vw', maxHeight: '88vh', overflow: 'auto',
          background: 'linear-gradient(180deg, #221a10, #1a140c)',
          border: '1px solid #8a6f3a', padding: '1rem 1.2rem',
          fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
          <div>
            <span style={{ fontSize: '1.25rem', letterSpacing: '0.04rem', color: '#f2dd9a' }}>{t('邦 交', 'Relations')}</span>
            <span style={{ marginLeft: '0.8rem', fontSize: '0.7rem', color: '#7a8893' }}>
              <span style={{ color: '#9ed68a' }}>盟 {t('同盟', 'allied')}</span> ·{' '}
              <span style={{ color: '#88b7e8' }}>約 {t('互不侵犯', 'pact')}</span> ·{' '}
              <span style={{ color: '#e6c473' }}>善</span>/<span style={{ color: '#7a8893' }}>中</span>/<span style={{ color: '#e08070' }}>惡</span>
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#97a4ae', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </header>

        <table style={{ borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.25rem 0.5rem' }} />
              {living.map(({ force }) => (
                <th key={force.id} style={{
                  padding: '0.25rem 0.3rem', fontWeight: 'normal',
                  color: force.id === playerForceId ? '#f2dd9a' : force.color,
                  writingMode: living.length > 8 ? ('vertical-rl' as const) : undefined,
                  whiteSpace: 'nowrap', fontSize: '0.72rem',
                }}>{name(force)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {living.map(({ force: row, cityCount }) => (
              <tr key={row.id}>
                <th style={{
                  textAlign: 'right', padding: '0.2rem 0.5rem', fontWeight: 'normal',
                  color: row.id === playerForceId ? '#f2dd9a' : row.color, whiteSpace: 'nowrap',
                }}>
                  {row.id === playerForceId ? '★ ' : ''}{name(row)}
                  <span style={{ color: '#5a4a35', fontSize: '0.62rem' }}> {cityCount}{t('城', '')}</span>
                </th>
                {living.map(({ force: col }) => {
                  const cell = cellFor(row.id, col.id);
                  return (
                    <td key={col.id} title={cell.title} style={{
                      background: cell.bg, color: cell.color,
                      border: '1px solid #18212b', textAlign: 'center',
                      minWidth: 30, height: 28, cursor: 'default',
                    }}>{cell.label}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
