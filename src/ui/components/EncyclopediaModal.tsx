import { useMemo, useState } from 'react';
import {
  HISTORICAL_EVENTS,
  ITEMS,
  ITEMS_BY_ID,
  PROVINCES,
  SKILLS,
  SKILLS_BY_ID,
  TRAIT_DEFS,
  getBiography,
} from '../../game/data';
import { useGameStore } from '../../game/state/store';
import { OfficerStats } from './OfficerStats';
import { OfficerDetail } from './OfficerDetail';
import { Name } from './Name';
import { CODEX_SETS, codexSetProgress, loadCodex } from '../../game/systems/codex';
import { ITEM_CODEX_SETS, itemCodexSetProgress, loadItemCodex } from '../../game/systems/itemCodex';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type Section = 'officers' | 'codex' | 'items' | 'skills' | 'traits' | 'events' | 'provinces';

export function EncyclopediaModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const [section, setSection] = useState<Section>('officers');
  const [search, setSearch] = useState('');
  // 交叉引用 — clicking any officer chip opens their full detail (列傳 included)
  // in a stacked modal; clicking a famous-set pill filters the codex grid to it.
  const [drillId, setDrillId] = useState<string | null>(null);
  const [setFilter, setSetFilter] = useState<string | null>(null);
  const desc = useDesc();
  useEscapeKey(onClose);

  // D1/D2 — cross-tab jumps and "who carries this item" lookup.
  const jumpTo = (sec: Section, name: string) => { setSection(sec); setSearch(name); };
  const holderByItem = useMemo(() => {
    const m: Record<string, string> = {};
    for (const o of Object.values(officers)) {
      for (const id of o.equipment ?? []) m[id] = o.id;
    }
    return m;
  }, [officers]);
  // 名品圖鑑 — cross-campaign "treasures you've carried" ledger.
  const itemCodex = loadItemCodex();
  const carriedSet = new Set(itemCodex.carried);

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
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          width: 'min(1000px,100%)',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>列傳</div>
            <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>Encyclopedia of the Three Kingdoms</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid #2b3845' }}>
          {(['officers', 'codex', 'items', 'skills', 'traits', 'events', 'provinces'] as Section[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                background: section === s ? '#26323e' : 'transparent',
                border: '1px solid ' + (section === s ? '#e6c473' : '#2b3845'),
                color: section === s ? '#e6c473' : '#7a8893',
                padding: '0.35rem 1rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              {s === 'officers' ? '武将' :
                s === 'codex' ? '圖鑑' :
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
              background: '#10161e', border: '1px solid #2b3845', color: '#e6c473',
              padding: '0.3rem 0.5rem', fontFamily: 'inherit', flex: 1, marginLeft: 'auto',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', flex: 1 }}>
          {section === 'officers' && (matches as Array<typeof officers[string]>).map((o) => {
            const bio = getBiography(o.id, o.name.en, o.name.zh, o.stats);
            const skillNames = (o.skills ?? []).map((id) => SKILLS_BY_ID[id]).filter(Boolean);
            const itemNames = (o.equipment ?? []).map((id) => ITEMS_BY_ID[id]).filter(Boolean);
            return (
              <div key={o.id} style={card()}>
                <div style={{ fontSize: '1.05rem', color: '#e6c473', cursor: 'pointer' }} onClick={() => setDrillId(o.id)} title="詳情">
                  <Name pair={o.name} />
                  {o.courtesyName && <span style={{ color: '#7a8893', fontSize: '0.78rem', marginLeft: '0.4rem' }}>({o.courtesyName.zh})</span>}
                </div>
                <div style={metaLine}>
                  <OfficerStats officer={o} /> · {o.birthYear}{o.deathYear ? `–${o.deathYear}` : ''}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginTop: '0.4rem' }}>{bio.zh}</div>
                {(skillNames.length > 0 || itemNames.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.4rem' }}>
                    {skillNames.map((s) => (
                      <button key={s.id} onClick={() => jumpTo('skills', s.name.zh)} style={xrefChip('#3a7dd9')}>{s.name.zh}</button>
                    ))}
                    {itemNames.map((it) => (
                      <button key={it.id} onClick={() => jumpTo('items', it.name.zh)} style={xrefChip('#c9a64e')}>{it.name.zh}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {section === 'codex' && (() => {
            /* 圖鑑 — the cross-campaign album: 灰 never met, 銅 seen on the
               stage, 金 carried your colors, ☠ died at your order. */
            const codex = loadCodex();
            const seen = new Set(codex.seen);
            const recruited = new Set(codex.recruited);
            const slain = new Set(codex.slain);
            const roster = Object.values(officers).filter((o) => !o.id.startsWith('commoner-') && !o.id.startsWith('custom-'));
            const q = search.trim();
            // When a famous-set pill is active, narrow the grid to its members.
            const activeSet = setFilter ? CODEX_SETS.find((s) => s.id === setFilter) : null;
            const setMembers = activeSet ? new Set(activeSet.members) : null;
            const shown = roster
              .filter((o) => !setMembers || setMembers.has(o.id))
              .filter((o) => !q || o.name.zh.includes(q) || o.name.en.toLowerCase().includes(q.toLowerCase()));
            return (
              <>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  {CODEX_SETS.map((set) => {
                    const p = codexSetProgress(codex, set.id);
                    const done = p.have === p.total;
                    const active = setFilter === set.id;
                    return (
                      <button key={set.id}
                        onClick={() => setSetFilter(active ? null : set.id)}
                        title={set.en}
                        style={{
                          border: `1px solid ${active ? '#f2dd9a' : done ? '#e6c473' : '#2b3845'}`,
                          background: active ? 'rgba(212,168,74,0.28)' : done ? 'rgba(212,168,74,0.12)' : 'transparent',
                          padding: '0.3rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer',
                          fontFamily: 'inherit', letterSpacing: '0.04rem',
                          color: done ? '#f2dd9a' : '#9aa6b0',
                        }}>
                        {done ? '✦ ' : ''}{set.zh} {p.have}/{p.total}
                      </button>
                    );
                  })}
                  <div style={{ fontSize: '0.72rem', color: '#7a8893', alignSelf: 'center' }}>
                    遇 {codex.seen.length} · 仕 {codex.recruited.length} · 斬 {codex.slain.length}(跨戰役累積)
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6 }}>
                  {shown.map((o) => {
                    const isRec = recruited.has(o.id);
                    const isSeen = seen.has(o.id);
                    const isSlain = slain.has(o.id);
                    return (
                      <div key={o.id}
                        onClick={isSeen ? () => setDrillId(o.id) : undefined}
                        title={isSeen ? (o.name.en) : undefined}
                        style={{
                          border: `1px solid ${isRec ? '#e6c473' : isSeen ? '#7a6244' : '#18212b'}`,
                          background: isRec ? 'rgba(212,168,74,0.10)' : '#15100a',
                          padding: '0.35rem 0.4rem', textAlign: 'center',
                          opacity: isSeen ? 1 : 0.45,
                          cursor: isSeen ? 'pointer' : 'default',
                        }}>
                        <div style={{ fontSize: '0.85rem', color: isRec ? '#f2dd9a' : isSeen ? '#aab6c0' : '#5a4a38' }}>
                          {isSeen ? o.name.zh : '???'}{isSlain ? ' ☠' : ''}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#5f6c76' }}>
                          {isRec ? '仕' : isSeen ? '遇' : '未遇'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
          {section === 'items' && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
              {ITEM_CODEX_SETS.map((set) => {
                const p = itemCodexSetProgress(itemCodex, set.id);
                const done = p.have === p.total;
                return (
                  <div key={set.id} title={set.en} style={{
                    border: `1px solid ${done ? '#e6c473' : '#2b3845'}`,
                    background: done ? 'rgba(212,168,74,0.12)' : 'transparent',
                    padding: '0.3rem 0.7rem', fontSize: '0.78rem',
                    color: done ? '#f2dd9a' : '#9aa6b0',
                  }}>
                    {done ? '✦ ' : ''}{set.zh} {p.have}/{p.total}
                  </div>
                );
              })}
              <div style={{ fontSize: '0.72rem', color: '#7a8893', alignSelf: 'center' }}>
                藏 {itemCodex.carried.length}(跨戰役累積)
              </div>
            </div>
          )}
          {section === 'items' && (matches as typeof ITEMS).map((it) => {
            const holderId = holderByItem[it.id];
            const holder = holderId ? officers[holderId] : null;
            const origin = it.originCityId ? cities[it.originCityId] : null;
            const carried = carriedSet.has(it.id);
            return (
              <div key={it.id} style={card()}>
                <div style={{ fontSize: '1rem', color: '#e6c473' }}>
                  <Name pair={it.name} />
                  <span style={{ marginLeft: '0.4rem', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem', color: '#c9a64e' }}>· {it.kind}</span>
                  {carried && <span title="曾入我庫" style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#9ed8b8' }}>· 藏</span>}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(it)}</div>
                <div style={metaLine}>
                  {Object.entries(it.effects).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`).join(' · ')}
                </div>
                {(holder || origin) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.4rem', alignItems: 'center' }}>
                    {origin && <span style={metaLine}>產於 {origin.name.zh}</span>}
                    {holder && (
                      <>
                        <span style={metaLine}>現持 ·</span>
                        <button onClick={() => setDrillId(holder.id)} style={xrefChip('#c9a64e')}>{holder.name.zh}</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {section === 'skills' && (matches as typeof SKILLS).map((s) => (
            <div key={s.id} style={card()}>
              <div style={{ fontSize: '1rem', color: '#e6c473' }}>
                <Name pair={s.name} />
                <span style={{ marginLeft: '0.4rem', color: '#c9a64e', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem' }}>· {s.category}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(s)}</div>
            </div>
          ))}
          {section === 'traits' && (matches as typeof TRAIT_DEFS).map((t) => (
            <div key={t.id} style={{ ...card(), borderColor: t.color }}>
              <div style={{ fontSize: '1rem', color: t.color }}>
                <Name pair={t.name} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(t)}</div>
            </div>
          ))}
          {section === 'events' && (matches as typeof HISTORICAL_EVENTS).map((e) => {
            // D3 — participants drawn from the event's gating predicates + chooser.
            const participantIds = [...new Set([
              ...(e.requires ?? []).flatMap((r) => ('officerId' in r ? [r.officerId] : [])),
              ...(e.chooserRulerId ? [e.chooserRulerId] : []),
            ])].filter((id) => officers[id]);
            return (
              <div key={e.id} style={card()}>
                <div style={{ fontSize: '1rem', color: '#e6c473' }}>
                  <Name pair={e.name} />
                  <span style={{ marginLeft: '0.4rem', color: '#7a8893', fontFamily: 'ui-monospace,monospace', fontSize: '0.7rem' }}>
                    {e.yearMin}{e.yearMax !== e.yearMin ? `–${e.yearMax}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#aab6c0', marginTop: '0.4rem', lineHeight: 1.7 }}>{desc(e)}</div>
                {participantIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: '0.4rem' }}>
                    {participantIds.map((id) => (
                      <button key={id} onClick={() => setDrillId(id)} style={xrefChip('#c9a64e')}>{officers[id].name.zh}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {section === 'provinces' && (matches as typeof PROVINCES).map((p) => (
            <div key={p.id} style={{ ...card(), borderLeftColor: p.color, borderLeftWidth: 3 }}>
              <div style={{ fontSize: '1rem', color: p.color }}>
                <Name pair={p.name} />
              </div>
              <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginTop: '0.3rem', fontStyle: 'italic' }}>{desc(p)}</div>
              <div style={metaLine}>
                Cities: {p.cityIds.map((cid) => cities[cid]?.name.zh ?? cid).join(' · ')}
              </div>
            </div>
          ))}
        </div>
        {drillId && officers[drillId] && (
          <OfficerDetail officer={officers[drillId]} onClose={() => setDrillId(null)} />
        )}
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    background: '#10161e',
    border: '1px solid #2b3845',
    padding: '0.6rem 0.85rem',
    marginBottom: '0.4rem',
  };
}

function xrefChip(color: string): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}55`, color,
    padding: '0.05rem 0.45rem', fontSize: '0.72rem', cursor: 'pointer',
    fontFamily: 'inherit', borderRadius: 'var(--tkm-radius-xs)',
  };
}

const metaLine: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.72rem',
  color: '#7a8893',
  marginTop: '0.25rem',
  letterSpacing: '0.05rem',
};
