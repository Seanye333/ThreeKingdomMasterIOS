import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';
import { DEED_TITLES_BY_ID } from '../../game/systems/deedTitles';
import { OfficerDetail } from './OfficerDetail';
import type { Officer } from '../../game/types';

interface Props {
  onClose: () => void;
}

type SortKey =
  | 'killsTroops' | 'duelsWon' | 'captured' | 'citiesTaken'
  | 'espionageSuccess' | 'civicWorks' | 'battlesWon'
  | 'trainingsCompleted' | 'childrenSired'
  | 'titles';

const COL_LABELS: Array<{ key: SortKey; zh: string; en: string }> = [
  { key: 'titles',            zh: '稱號', en: 'Titles' },
  { key: 'killsTroops',       zh: '殲敵', en: 'Kills' },
  { key: 'duelsWon',          zh: '一騎', en: 'Duels' },
  { key: 'captured',          zh: '生擒', en: 'Captures' },
  { key: 'citiesTaken',       zh: '攻陷', en: 'Cities' },
  { key: 'espionageSuccess',  zh: '謀略', en: 'Plots' },
  { key: 'civicWorks',        zh: '内政', en: 'Civil' },
  { key: 'battlesWon',        zh: '勝戰', en: 'Wins' },
  { key: 'trainingsCompleted',zh: '育成', en: 'Training' },
  { key: 'childrenSired',     zh: '子嗣', en: 'Heirs' },
];

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

export function DeedsModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const deeds = useGameStore((s) => s.deeds);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [sortBy, setSortBy] = useState<SortKey>('killsTroops');
  const [forceFilter, setForceFilter] = useState<string>('all');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const t = useT();
  const lang = useLanguage();

  const rows = useMemo(() => {
    return Object.values(deeds)
      .filter((d) => officers[d.officerId])
      .filter((d) => forceFilter === 'all'
        || (forceFilter === 'player' && officers[d.officerId].forceId === playerForceId)
        || officers[d.officerId].forceId === forceFilter)
      .map((d) => ({ ...d, officer: officers[d.officerId] }))
      .sort((a, b) => {
        if (sortBy === 'titles') return (b.titles?.length ?? 0) - (a.titles?.length ?? 0);
        return ((b[sortBy] as number) ?? 0) - ((a[sortBy] as number) ?? 0);
      })
      .slice(0, 50);
  }, [deeds, officers, sortBy, forceFilter, playerForceId]);

  const forceList = useMemo(() => {
    const used = new Set<string>();
    for (const o of Object.values(officers)) {
      if (deeds[o.id] && o.forceId) used.add(o.forceId);
    }
    return Object.values(forces).filter((f) => used.has(f.id));
  }, [forces, officers, deeds]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          borderTop: '3px solid #e6c473',  // gold — 金石之功
          width: 'min(1100px,100%)', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
          boxShadow: '0 0 18px rgba(212,168,74,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>{t('武功榜', 'Heroic Deeds')}</div>
            {lang === 'both' && <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>Heroic Deeds Leaderboard</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        {/* Force filter chip row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          padding: '0.7rem 1.5rem 0', alignItems: 'center',
        }}>
          <span style={{ color: '#7a8893', fontSize: '0.75rem', marginRight: '0.4rem' }}>
            {t('勢力', 'Force')}:
          </span>
          {[
            { id: 'all', label: t('全部', 'All') },
            ...(playerForceId ? [{ id: 'player', label: t('我軍', 'Mine') }] : []),
            ...forceList.map((f) => ({
              id: f.id,
              label: lang === 'en' ? f.name.en : f.name.zh,
            })),
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setForceFilter(chip.id)}
              style={{
                background: forceFilter === chip.id ? '#1e2832' : 'transparent',
                border: `1px solid ${forceFilter === chip.id ? '#e6c473' : '#2b3845'}`,
                color: forceFilter === chip.id ? '#e6c473' : '#7a8893',
                padding: '0.25rem 0.6rem', fontSize: '0.75rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div style={{ overflow: 'auto', padding: '1rem 1.5rem' }}>
          {rows.length === 0 ? (
            <div style={{ color: '#6a5238', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
              {t('尚無功業記載。征戰、興邦、謀略,皆待後人傳頌。', 'No deeds recorded yet. Wage battles, build, scheme.')}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2b3845' }}>
                  <th style={th()}>{t('名次', 'Rank')}</th>
                  <th style={th()}>{t('武將', 'Officer')}</th>
                  {COL_LABELS.map((c) => (
                    <th
                      key={c.key}
                      style={{ ...th(), cursor: 'pointer', color: sortBy === c.key ? '#e6c473' : '#7a8893' }}
                      onClick={() => setSortBy(c.key)}
                    >
                      {lang === 'en' ? c.en : c.zh}
                      {lang === 'both' && <div style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>{c.en}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const topTitle = (r.titles ?? [])
                    .map((id) => DEED_TITLES_BY_ID[id])
                    .filter(Boolean)
                    .sort((a, b) => b!.threshold - a!.threshold)[0];
                  return (
                    <tr
                      key={r.officerId}
                      onClick={() => setSelectedOfficer(r.officer)}
                      style={{
                        borderBottom: '1px solid #1b2531',
                        cursor: 'pointer',
                        background: i < 3 ? 'rgba(212,168,74,0.04)' : undefined,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,168,74,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i < 3 ? 'rgba(212,168,74,0.04)' : 'transparent')}
                    >
                      <td style={td()}>
                        <span style={{ color: i < 3 ? '#e6c473' : '#7a8893', fontWeight: i < 3 ? 'bold' : undefined }}>
                          {MEDAL[i] ?? (i + 1)}
                        </span>
                      </td>
                      <td style={td()}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#e6c473' }}>
                            {lang === 'en' ? r.officer.name.en : r.officer.name.zh}
                            {lang === 'both' && <> <span style={{ color: '#7a8893', fontSize: '0.72rem', fontStyle: 'italic' }}>{r.officer.name.en}</span></>}
                          </span>
                          {topTitle && (
                            <span style={{ color: '#a08050', fontSize: '0.7rem', fontStyle: 'italic' }}>
                              {lang === 'en' ? topTitle.name.en : topTitle.name.zh}
                            </span>
                          )}
                        </div>
                      </td>
                      {COL_LABELS.map((c) => {
                        if (c.key === 'titles') {
                          return (
                            <td key={c.key} style={{ ...td(), color: sortBy === c.key ? '#e6c473' : '#aab6c0', fontFamily: 'ui-monospace, monospace' }}>
                              {(r.titles?.length ?? 0).toLocaleString()}
                            </td>
                          );
                        }
                        return (
                          <td
                            key={c.key}
                            style={{ ...td(), fontFamily: 'ui-monospace, monospace', color: sortBy === c.key ? '#e6c473' : '#aab6c0' }}
                          >
                            {(((r[c.key as keyof typeof r] as number) ?? 0)).toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOfficer && (
        <OfficerDetail
          officer={selectedOfficer}
          onClose={() => setSelectedOfficer(null)}
        />
      )}
    </div>
  );
}

function th() {
  return { textAlign: 'left' as const, padding: '0.4rem 0.5rem', fontWeight: 'normal' as const, fontSize: '0.72rem', letterSpacing: '0.05rem', textTransform: 'uppercase' as const };
}
function td() {
  return { padding: '0.35rem 0.5rem' };
}
