import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Name } from './Name';

type Col = 'agriculture' | 'commerce' | 'troops' | 'population' | 'loyalty' | 'gold';

/**
 * 郡縣一覽 — a sortable roster of your cities: 農/商/兵/民/忠/金 at a glance, so a
 * wide realm is governed from one table instead of clicking every dot.
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
      .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [cities, playerForceId, sortBy, query]);

  const cols: Array<{ key: Col; zh: string; en: string }> = [
    { key: 'agriculture', zh: '農', en: 'Agr' },
    { key: 'commerce', zh: '商', en: 'Com' },
    { key: 'troops', zh: '兵', en: 'Troops' },
    { key: 'population', zh: '民', en: 'Pop' },
    { key: 'loyalty', zh: '忠', en: 'Loy' },
    { key: 'gold', zh: '金', en: 'Gold' },
  ];
  const sum = (k: Col) => rows.reduce((s, c) => s + (c[k] as number), 0);

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
              <tr key={c.id} onClick={() => { selectCity(c.id); onClose(); }} style={{ cursor: 'pointer', borderBottom: '1px solid #18212b' }}>
                <td style={{ padding: '3px 6px', color: c.ruined ? '#a06a5a' : '#eef4f8' }}><Name pair={c.name} />{c.ruined ? ' 🔥' : ''}</td>
                {cols.map((col) => (
                  <td key={col.key} style={{ textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace', color: col.key === 'loyalty' && c.loyalty < 40 ? '#e8704a' : '#aab6c0' }}>
                    {(c[col.key] as number).toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ color: '#e6c473', borderTop: '1px solid #2b3845', fontWeight: 'bold' }}>
                <td style={{ padding: '4px 6px' }}>{t('合計', 'Total')}</td>
                {cols.map((col) => (
                  <td key={col.key} style={{ textAlign: 'right', padding: '4px 6px', fontFamily: 'ui-monospace, monospace' }}>
                    {col.key === 'loyalty' ? Math.round(sum('loyalty') / rows.length) : sum(col.key).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
    </Modal>
  );
}
