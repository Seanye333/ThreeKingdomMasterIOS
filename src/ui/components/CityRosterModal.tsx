import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Name } from './Name';
import { graftTier, GRAFT_RESENTMENT_AT } from '../../game/systems/graft';
import type { City } from '../../game/types';

type Col = 'agriculture' | 'commerce' | 'troops' | 'population' | 'loyalty' | 'gold' | 'corruption';

/** `corruption` is optional on City, so the table reads it through here rather
 *  than indexing — an undefined would sort as NaN and render as blank on the
 *  very cities that are still clean. */
function val(c: City, key: Col): number {
  return key === 'corruption' ? (c.corruption ?? 0) : (c[key] as number);
}

/**
 * 郡縣一覽 — a sortable roster of your cities: 農/商/兵/民/忠/金/貪 at a glance, so
 * a wide realm is governed from one table instead of clicking every dot.
 *
 * 貪 earns its column because it is the one figure a player can do nothing
 * about without first knowing WHICH city has it. Graft accrues quietly, skims
 * up to 40% off that city's gold, and is cleared by sending an official for a
 * season — so the question is always "which of my twenty cities should he go
 * to", and it was unanswerable: the value appeared nowhere in the UI at all.
 * Sort by it and the answer is the top row.
 */
export function CityRosterModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const selectCity = useGameStore((s) => s.selectCity);
  const [sortBy, setSortBy] = useState<Col>('troops');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(cities)
      .filter((c) => c.ownerForceId === playerForceId)
      .filter((c) => !q || c.name.zh.includes(q) || c.name.en.toLowerCase().includes(q))
      .sort((a, b) => val(b, sortBy) - val(a, sortBy));
  }, [cities, playerForceId, sortBy, query]);

  const cols: Array<{ key: Col; zh: string; en: string }> = [
    { key: 'agriculture', zh: '農', en: 'Agr' },
    { key: 'commerce', zh: '商', en: 'Com' },
    { key: 'troops', zh: '兵', en: 'Troops' },
    { key: 'population', zh: '民', en: 'Pop' },
    { key: 'loyalty', zh: '忠', en: 'Loy' },
    { key: 'gold', zh: '金', en: 'Gold' },
    { key: 'corruption', zh: '貪', en: 'Graft' },
  ];
  const sum = (k: Col) => rows.reduce((s, c) => s + val(c, k), 0);

  return (
    <Modal onClose={onClose} width="min(720px, 100%)" icon={<Icon name="city" size={18} />} title={t('郡縣一覽', 'Cities')} badge={`(${rows.length})`}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('搜索城池…', 'Search cities…')}
          autoFocus
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: '0.6rem',
            background: '#14100a', border: '1px solid #2b3845', borderRadius: 'var(--tkm-radius-sm)',
            color: '#e6edf3', padding: '0.35rem 0.6rem', fontFamily: 'inherit', fontSize: '0.85rem',
          }}
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ color: '#7a8893', borderBottom: '1px solid #2b3845' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px' }}>{t('城', 'City')}</th>
              {cols.map((c) => (
                <th key={c.key} onClick={() => setSortBy(c.key)} style={{
                  textAlign: 'right', padding: '4px 6px', cursor: 'pointer',
                  color: sortBy === c.key ? '#f2dd9a' : '#7a8893',
                }}>{t(c.zh, c.en)}{sortBy === c.key ? ' ▾' : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="tkm-row-hover" onClick={() => { selectCity(c.id); onClose(); }} style={{ cursor: 'pointer', borderBottom: '1px solid #18212b' }}>
                <td style={{ padding: '3px 6px', color: c.ruined ? '#a06a5a' : '#eef4f8' }}><Name pair={c.name} />{c.ruined ? ' 🔥' : ''}</td>
                {cols.map((col) => {
                  const v = val(c, col.key);
                  const alarm = (col.key === 'loyalty' && c.loyalty < 40)
                    || (col.key === 'corruption' && v >= GRAFT_RESENTMENT_AT);
                  return (
                    <td
                      key={col.key}
                      title={col.key === 'corruption' ? t(graftTier(v).zh, graftTier(v).en) : undefined}
                      style={{
                        textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace',
                        color: alarm ? '#e8704a' : col.key === 'corruption' && v >= 25 ? '#d0a860' : '#aab6c0',
                      }}
                    >
                      {col.key === 'corruption' ? Math.round(v) : v.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ color: '#e6c473', borderTop: '1px solid #2b3845', fontWeight: 'bold' }}>
                <td style={{ padding: '4px 6px' }}>{t('合計', 'Total')}</td>
                {cols.map((col) => (
                  <td key={col.key} style={{ textAlign: 'right', padding: '4px 6px', fontFamily: 'ui-monospace, monospace' }}>
                    {col.key === 'loyalty' || col.key === 'corruption'
                      ? Math.round(sum(col.key) / rows.length)
                      : sum(col.key).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
    </Modal>
  );
}
