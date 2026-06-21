import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';
import { officerGrade, gradeScore, officerLevel } from '../../game/systems/officerGrade';
import { renownFromDeeds, fameMedal } from '../../game/systems/fame';
import { ageBand } from '../../game/systems/aging';
import { breakthroughTitle } from '../../game/systems/growth';
import type { Officer } from '../../game/types';
import { OfficerDetail } from './OfficerDetail';

/**
 * 名將榜 — the realm's officers ranked by 品階 score. A single board that puts
 * every general's worth side by side (品階 · 名望 · 歷練 · 年歲), so you can see
 * at a glance who the heavyweights are — yours and your rivals'.
 */
export function HallOfFameModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const deeds = useGameStore((s) => s.deeds);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [selected, setSelected] = useState<Officer | null>(null);

  const rows = useMemo(() => {
    return Object.values(officers)
      .filter((o) => o.status !== 'dead' && o.status !== 'unsearched')
      .filter((o) => (scope === 'mine' ? o.forceId === playerForceId : true))
      .map((o) => ({ o, score: gradeScore(o) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
  }, [officers, scope, playerForceId]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '3px solid #e6c473',
          width: 'min(880px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)', boxShadow: '0 0 18px rgba(212,168,74,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.1rem' }}>{t('名將榜', 'Hall of Fame')}</div>
            <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>{t('按品階評分排名', 'Ranked by grade score')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.7rem 1.5rem 0' }}>
          {(['all', 'mine'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} style={{
              padding: '0.2rem 0.7rem', borderRadius: 2, cursor: 'pointer', fontSize: '0.78rem',
              background: scope === s ? '#2a2010' : '#10161e', border: `1px solid ${scope === s ? '#e6c473' : '#26323e'}`, color: scope === s ? '#e6c473' : '#8a97a3',
            }}>{s === 'all' ? t('天下', 'All') : t('本勢力', 'My force')}</button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0.8rem 1.5rem' }}>
          {rows.map(({ o, score }, i) => {
            const g = officerGrade(o);
            const force = o.forceId ? forces[o.forceId] : null;
            const medal = fameMedal(renownFromDeeds(deeds[o.id]));
            const band = ageBand(year - o.birthYear);
            const bt = breakthroughTitle(o.breakthroughs);
            return (
              <button key={o.id} onClick={() => setSelected(o)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left',
                padding: '0.4rem 0.5rem', marginBottom: '0.25rem', cursor: 'pointer',
                background: o.forceId === playerForceId ? 'rgba(212,168,74,0.06)' : '#10161e',
                border: '1px solid #1f2a36', borderRadius: 2, color: '#e6edf3',
              }}>
                <span style={{ width: 26, textAlign: 'right', color: i < 3 ? '#e6c473' : '#7a8893', fontFamily: 'ui-monospace, monospace' }}>{i + 1}</span>
                <span style={{ minWidth: 110, fontSize: '0.92rem' }}>
                  {lang === 'en' ? o.name.en : o.name.zh}
                  {medal && <span style={{ marginLeft: 4 }}>{medal.glyph}</span>}
                </span>
                <span style={{ padding: '0.05rem 0.4rem', borderRadius: 2, border: `1px solid ${g.color}`, color: g.color, fontSize: '0.72rem' }}>
                  {lang === 'en' ? g.name.en : g.name.zh}
                </span>
                <span style={{ width: 34, color: '#9aa7b3', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>{score}</span>
                <span style={{ color: '#8a97a3', fontSize: '0.72rem' }}>Lv.{officerLevel(o)}</span>
                {bt && <span style={{ color: '#8ee8ff', fontSize: '0.7rem' }}>{lang === 'en' ? bt.en : bt.zh}</span>}
                <span style={{ color: band.color, fontSize: '0.7rem' }}>{lang === 'en' ? band.en : band.zh}</span>
                <span style={{ marginLeft: 'auto', color: force?.color ?? '#5a7090', fontSize: '0.72rem' }}>
                  {force ? (lang === 'en' ? force.name.en : force.name.zh) : t('在野', 'Free')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && <OfficerDetail officer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
