import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

type SortKey = 'killsTroops' | 'duelsWon' | 'captured' | 'citiesTaken' | 'espionageSuccess' | 'civicWorks' | 'battlesWon';

const COL_LABELS: Array<{ key: SortKey; zh: string; en: string }> = [
  { key: 'killsTroops',     zh: '殲敵', en: 'Kills' },
  { key: 'duelsWon',        zh: '一騎', en: 'Duels' },
  { key: 'captured',        zh: '生擒', en: 'Captures' },
  { key: 'citiesTaken',     zh: '攻陷', en: 'Cities' },
  { key: 'espionageSuccess',zh: '謀略', en: 'Plots' },
  { key: 'civicWorks',      zh: '内政', en: 'Civil' },
  { key: 'battlesWon',      zh: '勝戰', en: 'Wins' },
];

export function DeedsModal({ onClose }: Props) {
  const deeds = useGameStore((s) => s.deeds);
  const officers = useGameStore((s) => s.officers);
  const [sortBy, setSortBy] = useState<SortKey>('killsTroops');
  const t = useT();
  const lang = useLanguage();

  const rows = useMemo(() => {
    return Object.values(deeds)
      .filter((d) => officers[d.officerId])
      .map((d) => ({ ...d, officer: officers[d.officerId] }))
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, 50);
  }, [deeds, officers, sortBy]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 900,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '1px solid #5a4530',
          width: 'min(900px,100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #4a3520',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>{t('武功榜', 'Heroic Deeds')}</div>
            {lang === 'both' && <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>Heroic Deeds Leaderboard</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ overflow: 'auto', padding: '1rem 1.5rem' }}>
          {rows.length === 0 ? (
            <div style={{ color: '#6a5238', fontStyle: 'italic', padding: '2rem', textAlign: 'center' }}>
              {t('尚無功業記載。征戰、興邦、謀略,皆待後人傳頌。', 'No deeds recorded yet. Wage battles, build, scheme.')}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #4a3520' }}>
                  <th style={th()}>{t('名次', 'Rank')}</th>
                  <th style={th()}>{t('武將', 'Officer')}</th>
                  {COL_LABELS.map((c) => (
                    <th
                      key={c.key}
                      style={{ ...th(), cursor: 'pointer', color: sortBy === c.key ? '#d4a84a' : '#8a7050' }}
                      onClick={() => setSortBy(c.key)}
                    >
                      {lang === 'en' ? c.en : c.zh}
                      {lang === 'both' && <div style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>{c.en}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.officerId} style={{ borderBottom: '1px solid #2a1f15' }}>
                    <td style={td()}>
                      <span style={{ color: i < 3 ? '#d4a84a' : '#8a7050', fontWeight: i < 3 ? 'bold' : undefined }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={td()}>
                      <span style={{ color: '#d4a84a' }}>{lang === 'en' ? r.officer.name.en : r.officer.name.zh}</span>
                      {lang === 'both' && <> <span style={{ color: '#8a7050', fontSize: '0.72rem', fontStyle: 'italic' }}>{r.officer.name.en}</span></>}
                    </td>
                    {COL_LABELS.map((c) => (
                      <td
                        key={c.key}
                        style={{ ...td(), fontFamily: 'ui-monospace, monospace', color: sortBy === c.key ? '#d4a84a' : '#c0a878' }}
                      >
                        {r[c.key].toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function th() {
  return { textAlign: 'left' as const, padding: '0.4rem 0.5rem', fontWeight: 'normal' as const, fontSize: '0.72rem', letterSpacing: '0.15rem', textTransform: 'uppercase' as const };
}
function td() {
  return { padding: '0.35rem 0.5rem' };
}
