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
  horse:    '#c19a3b',
  treasure: '#88b7e8',
  book:     '#7a9a5a',
};

/**
 * Standalone all-items browser. Usable from the title screen without a
 * game state, since it reads only from the static ITEMS catalog.
 */
export function ItemsBrowser({ onClose }: Props) {
  const [kind, setKind] = useState<Kind>('all');
  const [search, setSearch] = useState('');
  const t = useT();
  const lang = useLanguage();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qZh = search.trim();
    return ITEMS.filter((i) => {
      if (kind !== 'all' && i.kind !== kind) return false;
      if (!q) return true;
      return (
        i.name.en.toLowerCase().includes(q) ||
        i.name.zh.includes(qZh) ||
        i.description.toLowerCase().includes(q)
      );
    });
  }, [kind, search]);

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
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '1px solid #5a4530',
          width: 'min(1000px,100%)',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #4a3520',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.3rem' }}>{t('名品', 'Items')}</div>
            <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>
              {t(`收錄 ${ITEMS.length} 件`, `Famous Items · ${ITEMS.length} catalogued`)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #4a3520', flexWrap: 'wrap',
          }}
        >
          {(['all', 'weapon', 'horse', 'treasure', 'book'] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              style={{
                background: kind === k ? '#3a2d20' : 'transparent',
                border: '1px solid ' + (kind === k ? '#d4a84a' : '#4a3520'),
                color: kind === k ? '#d4a84a' : '#8a7050',
                padding: '0.35rem 1rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              {lang === 'en' ? KIND_LABEL[k].en : KIND_LABEL[k].zh}
              {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#5a4530' }}>{KIND_LABEL[k].en}</span></>}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('依名稱或描述搜尋…', 'Search by name or description…')}
            style={{
              background: '#1a1410',
              border: '1px solid #4a3520',
              color: '#d4a84a',
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
            <div style={{ color: '#8a7050', fontStyle: 'italic', padding: '2rem' }}>
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
        background: '#1a1410',
        border: `1px solid ${color}`,
        padding: '0.7rem 0.85rem',
        boxShadow: `inset 0 0 12px ${color}22`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: '0.95rem', color: '#d4a84a', letterSpacing: '0.15rem' }}>
          {lang === 'en' ? item.name.en : item.name.zh}
        </div>
        <div
          style={{
            fontSize: '0.6rem', color, letterSpacing: '0.15rem', textTransform: 'uppercase',
          }}
        >
          {lang === 'en' ? KIND_LABEL[item.kind].en : KIND_LABEL[item.kind].zh}
        </div>
      </div>
      {lang === 'both' && (
        <div style={{ fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic', marginBottom: '0.4rem' }}>
          {item.name.en}
        </div>
      )}
      <div style={{ fontSize: '0.78rem', color: '#c0a878', lineHeight: 1.45, marginBottom: '0.5rem' }}>
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
          <span style={{ color: '#8a7050', marginLeft: 'auto', fontStyle: 'italic' }}>
            {lang === 'en' ? 'from' : '出'} {lang === 'en'
              ? CITY_NAMES_BY_ID[item.originCityId].en
              : CITY_NAMES_BY_ID[item.originCityId].zh}
          </span>
        )}
      </div>
    </div>
  );
}
