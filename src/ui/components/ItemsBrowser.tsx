import { useMemo, useState } from 'react';
import { ITEMS } from '../../game/data';
import type { Item } from '../../game/data/items';
import { CITY_NAMES_BY_ID } from '../../game/data/cities';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

type Kind = 'all' | Item['kind'];

const KIND_LABEL: Record<Kind, { zh: string; en: string }> = {
  all:      { zh: '一切', en: 'All' },
  weapon:   { zh: '武具', en: 'Weapons' },
  horse:    { zh: '名馬', en: 'Horses' },
  treasure: { zh: '宝物', en: 'Treasures' },
  book:     { zh: '兵書', en: 'Books' },
};

const KIND_COLOR: Record<Item['kind'], string> = {
  weapon:   '#b8442e',
  horse:    '#c9a64e',
  treasure: '#88b7e8',
  book:     '#7a9a5a',
};

type SortKey =
  | 'name'
  | 'kind'
  | 'total'
  | 'leadership'
  | 'war'
  | 'intelligence'
  | 'politics'
  | 'charisma'
  | 'origin';

const SORT_LABEL_ZH: Record<SortKey, string> = {
  name:         '名稱',
  kind:         '類別',
  total:        '總計',
  leadership:   '統率',
  war:          '武力',
  intelligence: '知力',
  politics:     '政治',
  charisma:     '魅力',
  origin:       '出處',
};
const SORT_LABEL_EN: Record<SortKey, string> = {
  name:         'Name',
  kind:         'Kind',
  total:        'Total',
  leadership:   'LED',
  war:          'WAR',
  intelligence: 'INT',
  politics:     'POL',
  charisma:     'CHA',
  origin:       'From',
};

const KIND_ORDER: Record<Item['kind'], number> = {
  weapon: 0, horse: 1, treasure: 2, book: 3,
};

function itemTotal(item: Item): number {
  const e = item.effects;
  return (e.leadership ?? 0) + (e.war ?? 0) + (e.intelligence ?? 0) + (e.politics ?? 0) + (e.charisma ?? 0);
}

/**
 * Standalone all-items browser. Usable from the title screen without a
 * game state, since it reads only from the static ITEMS catalog.
 */
export function ItemsBrowser({ onClose }: Props) {
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const t = useT();
  const lang = useLanguage();
  const SORT_LABEL = lang === 'en' ? SORT_LABEL_EN : SORT_LABEL_ZH;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      // Name and origin default to ascending; stats and total default to desc.
      setSortDir(key === 'name' || key === 'origin' || key === 'kind' ? 'asc' : 'desc');
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qZh = search.trim();
    const filtered = ITEMS.filter((i) => {
      if (kind !== 'all' && i.kind !== kind) return false;
      if (!q) return true;
      return (
        i.name.en.toLowerCase().includes(q) ||
        i.name.zh.includes(qZh) ||
        i.description.toLowerCase().includes(q)
      );
    });

    const primary = (a: Item, b: Item): number => {
      if (sortKey === 'name') {
        // Sort by zh name (Unicode codepoint order) for Chinese, en for English
        if (lang === 'en') return a.name.en.localeCompare(b.name.en);
        return a.name.zh.localeCompare(b.name.zh, 'zh-CN');
      }
      if (sortKey === 'kind') return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      if (sortKey === 'origin') {
        const ao = a.originCityId ?? '';
        const bo = b.originCityId ?? '';
        return ao.localeCompare(bo);
      }
      if (sortKey === 'total') return itemTotal(a) - itemTotal(b);
      // Stat keys: leadership/war/intelligence/politics/charisma
      return (a.effects[sortKey] ?? 0) - (b.effects[sortKey] ?? 0);
    };
    // Tie-breaker: total stats then name
    const cmp = (a: Item, b: Item): number =>
      primary(a, b) ||
      (itemTotal(a) - itemTotal(b)) ||
      a.name.zh.localeCompare(b.name.zh, 'zh-CN');
    return [...filtered].sort((a, b) => (sortDir === 'desc' ? -cmp(a, b) : cmp(a, b)));
  }, [kind, search, sortKey, sortDir, lang]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'grid', placeItems: 'center',
        zIndex: 900,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          width: 'min(1000px,100%)',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #2b3845',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.1rem' }}>{t('名品', 'Items')}</div>
            <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>
              {t(
                `顯示 ${visible.length} / ${ITEMS.length}`,
                `${visible.length} of ${ITEMS.length} shown`,
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #2b3845', flexWrap: 'wrap',
          }}
        >
          {(['all', 'weapon', 'horse', 'treasure', 'book'] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                background: kind === k ? '#26323e' : 'transparent',
                border: '1px solid ' + (kind === k ? '#e6c473' : '#2b3845'),
                color: kind === k ? '#e6c473' : '#7a8893',
                padding: '0.35rem 1rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              {lang === 'en' ? KIND_LABEL[k].en : KIND_LABEL[k].zh}
              {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#364654' }}>{KIND_LABEL[k].en}</span></>}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('依名稱或描述搜尋…', 'Search by name or description…')}
            style={{
              background: '#10161e',
              border: '1px solid #2b3845',
              color: '#e6c473',
              padding: '0.3rem 0.5rem',
              fontFamily: 'inherit',
              flex: 1,
              marginLeft: 'auto',
              minWidth: 200,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex', gap: '0.4rem', padding: '0.5rem 1.5rem',
            borderBottom: '1px solid #2b3845', flexWrap: 'wrap', alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#7a8893', letterSpacing: '0.1rem', marginRight: '0.3rem' }}>
            {t('排序', 'Sort')}
          </span>
          {(['name', 'kind', 'total', 'leadership', 'war', 'intelligence', 'politics', 'charisma', 'origin'] as SortKey[]).map((k) => {
            const active = sortKey === k;
            return (
              <button
                key={k}
                onClick={() => handleSort(k)}
                style={{
                  background: active ? '#26323e' : 'transparent',
                  border: '1px solid ' + (active ? '#e6c473' : '#2b3845'),
                  color: active ? '#e6c473' : '#7a8893',
                  padding: '0.25rem 0.7rem',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  letterSpacing: '0.08rem',
                }}
              >
                {SORT_LABEL[k]} {active && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
            );
          })}
        </div>

        <div
          style={{
            overflowY: 'auto',
            padding: '1rem 1.5rem',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.75rem',
            alignContent: 'start',
          }}
        >
          {visible.length === 0 ? (
            <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '2rem' }}>
              {t('沒有符合的物品。', 'No items match.')}
            </div>
          ) : (
            visible.map((i) => <ItemCard key={i.id} item={i} />)
          )}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const color = KIND_COLOR[item.kind];
  const lang = useLanguage();
  const stats: Array<[string, number | undefined]> = [
    ['統', item.effects.leadership],
    ['武', item.effects.war],
    ['知', item.effects.intelligence],
    ['政', item.effects.politics],
    ['魅', item.effects.charisma],
  ];
  return (
    <div
      style={{
        background: '#10161e',
        border: `1px solid ${color}`,
        padding: '0.7rem 0.85rem',
        boxShadow: `inset 0 0 12px ${color}22`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: '0.95rem', color: '#e6c473', letterSpacing: '0.05rem' }}>
          {lang === 'en' ? item.name.en : item.name.zh}
        </div>
        <div
          style={{
            fontSize: '0.6rem', color, letterSpacing: '0.05rem', textTransform: 'uppercase',
          }}
        >
          {lang === 'en' ? KIND_LABEL[item.kind].en : KIND_LABEL[item.kind].zh}
        </div>
      </div>
      {lang === 'both' && (
        <div style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic', marginBottom: '0.4rem' }}>
          {item.name.en}
        </div>
      )}
      <div style={{ fontSize: '0.78rem', color: '#aab6c0', lineHeight: 1.45, marginBottom: '0.5rem' }}>
        {lang === 'zh' && item.descriptionZh ? item.descriptionZh : item.description}
      </div>
      <div
        style={{
          display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center',
          fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem',
        }}
      >
        {stats.map(([label, value]) =>
          value !== undefined && value !== 0 ? (
            <span key={label} style={{ color: '#a8c87a' }}>
              {label} +{value}
            </span>
          ) : null,
        )}
        {item.originCityId && CITY_NAMES_BY_ID[item.originCityId] && (
          <span style={{ color: '#7a8893', marginLeft: 'auto', fontStyle: 'italic' }}>
            {lang === 'en' ? 'from' : '出'} {lang === 'en'
              ? CITY_NAMES_BY_ID[item.originCityId].en
              : CITY_NAMES_BY_ID[item.originCityId].zh}
          </span>
        )}
      </div>
    </div>
  );
}
