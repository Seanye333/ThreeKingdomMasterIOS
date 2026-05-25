import { useMemo, useState } from 'react';
import {
  HISTORICAL_EVENTS,
  ITEMS,
  PROVINCES,
  SKILLS,
  TRAIT_DEFS,
  getBiography,
} from '../../game/data';
import { useGameStore } from '../../game/state/store';
import { useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type Section = 'officers' | 'items' | 'skills' | 'traits' | 'events' | 'provinces';

export function EncyclopediaModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const [section, setSection] = useState<Section>('officers');
  const [search, setSearch] = useState('');
  const desc = useDesc();

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qZh = search.trim();
    if (section === 'officers') {
      return Object.values(officers)
        .filter((o) => o.status !== 'unsearched')
        .filter((o) =>
          !q ||
          o.name.en.toLowerCase().includes(q) ||
          o.name.zh.includes(qZh) ||
          (o.courtesyName?.en.toLowerCase().includes(q) ?? false),
        )
        .sort((a, b) => a.birthYear - b.birthYear);
    }
    if (section === 'items') {
      return ITEMS.filter((i) =>
        !q || i.name.en.toLowerCase().includes(q) || i.name.zh.includes(qZh),
      );
    }
    if (section === 'skills') {
      return SKILLS.filter((s) =>
        !q || s.name.en.toLowerCase().includes(q) || s.name.zh.includes(qZh),
      );
    }
    if (section === 'traits') {
      return TRAIT_DEFS.filter((t) =>
        !q || t.name.en.toLowerCase().includes(q) || t.name.zh.includes(qZh),
      );
    }
    if (section === 'events') {
      return HISTORICAL_EVENTS.filter((e) =>
        !q || e.name.en.toLowerCase().includes(q) || e.name.zh.includes(qZh),
      );
    }
    if (section === 'provinces') {
      return PROVINCES.filter((p) =>
        !q || p.name.en.toLowerCase().includes(q) || p.name.zh.includes(qZh),
      );
    }
    return [];
  }, [section, search, officers]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
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
        <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #4a3520', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>列傳</div>
            <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>Encyclopedia of the Three Kingdoms</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid #4a3520' }}>
          {(['officers', 'items', 'skills', 'traits', 'events', 'provinces'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                background: section === s ? '#3a2d20' : 'transparent',
                border: '1px solid ' + (section === s ? '#d4a84a' : '#4a3520'),
                color: section === s ? '#d4a84a' : '#8a7050',
                padding: '0.35rem 1rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              {s === 'officers' ? '武将' :
                s === 'items' ? '名品' :
                s === 'skills' ? '特技' :
                s === 'traits' ? '性格' :
                s === 'events' ? '史実' : '州郡'}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              background: '#1a1410', border: '1px solid #4a3520', color: '#d4a84a',
              padding: '0.3rem 0.5rem', fontFamily: 'inherit', flex: 1, marginLeft: 'auto',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
          {section === 'officers' && (matches as Array<typeof officers[string]>).map((o) => {
            const bio = getBiography(o.id, o.name.en, o.name.zh, o.stats);
            return (
              <div key={o.id} style={card()}>
                <div style={{ fontSize: '1.05rem', color: '#d4a84a' }}>
                  {o.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{o.name.en}</span>
                  {o.courtesyName && <span style={{ color: '#8a7050', fontSize: '0.78rem', marginLeft: '0.4rem' }}>({o.courtesyName.zh})</span>}
                </div>
                <div style={metaLine}>
                  W{o.stats.war} L{o.stats.leadership} I{o.stats.intelligence} P{o.stats.politics} C{o.stats.charisma} · {o.birthYear}{o.deathYear ? `–${o.deathYear}` : ''}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#c0a878', marginTop: '0.4rem' }}>{bio.zh}</div>
              </div>
            );
          })}
          {section === 'items' && (matches as typeof ITEMS).map((it) => (
            <div key={it.id} style={card()}>
              <div style={{ fontSize: '1rem', color: '#d4a84a' }}>
                {it.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{it.name.en}</span>
                <span style={{ marginLeft: '0.4rem', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem', color: '#c19a3b' }}>· {it.kind}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#c0a878', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(it)}</div>
              <div style={metaLine}>
                {Object.entries(it.effects).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`).join(' · ')}
              </div>
            </div>
          ))}
          {section === 'skills' && (matches as typeof SKILLS).map((s) => (
            <div key={s.id} style={card()}>
              <div style={{ fontSize: '1rem', color: '#d4a84a' }}>
                {s.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{s.name.en}</span>
                <span style={{ marginLeft: '0.4rem', color: '#c19a3b', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem' }}>· {s.category}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#c0a878', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(s)}</div>
            </div>
          ))}
          {section === 'traits' && (matches as typeof TRAIT_DEFS).map((t) => (
            <div key={t.id} style={{ ...card(), borderColor: t.color }}>
              <div style={{ fontSize: '1rem', color: t.color }}>
                {t.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{t.name.en}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#c0a878', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(t)}</div>
            </div>
          ))}
          {section === 'events' && (matches as typeof HISTORICAL_EVENTS).map((e) => (
            <div key={e.id} style={card()}>
              <div style={{ fontSize: '1rem', color: '#d4a84a' }}>
                {e.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{e.name.en}</span>
                <span style={{ marginLeft: '0.4rem', color: '#8a7050', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem' }}>
                  {e.yearMin}{e.yearMax !== e.yearMin ? `–${e.yearMax}` : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#c0a878', marginTop: '0.4rem', lineHeight: 1.7 }}>{desc(e)}</div>
            </div>
          ))}
          {section === 'provinces' && (matches as typeof PROVINCES).map((p) => (
            <div key={p.id} style={{ ...card(), borderLeftColor: p.color, borderLeftWidth: 3 }}>
              <div style={{ fontSize: '1rem', color: p.color }}>
                {p.name.zh} <span style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic' }}>{p.name.en}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#c0a878', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(p)}</div>
              <div style={metaLine}>
                Cities: {p.cityIds.map((cid) => cities[cid]?.name.zh ?? cid).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    background: '#1a1410',
    border: '1px solid #4a3520',
    padding: '0.6rem 0.85rem',
    marginBottom: '0.4rem',
  };
}

const metaLine: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.72rem',
  color: '#8a7050',
  marginTop: '0.25rem',
  letterSpacing: '0.05rem',
};
