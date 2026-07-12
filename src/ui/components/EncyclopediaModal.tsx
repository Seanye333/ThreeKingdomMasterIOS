import { useMemo, useState } from 'react';
import type { Officer } from '../../game/types';
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
import { OfficerCardModal } from './OfficerCardModal';
import { officerGrade, gradeMeta } from '../../game/systems/officerGrade';
import { bpLeaderboard } from '../../game/systems/powerBoard';
import { ITEM_CODEX_SETS, itemCodexSetProgress, loadItemCodex } from '../../game/systems/itemCodex';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type Section = 'officers' | 'codex' | 'ranking' | 'items' | 'skills' | 'traits' | 'events' | 'provinces';

export function EncyclopediaModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const setRewardsClaimed = useGameStore((s) => s.setRewardsClaimed);
  const powerBoardPrev = useGameStore((s) => s.powerBoardPrev);
  const [section, setSection] = useState<Section>('officers');
  const [search, setSearch] = useState('');
  // 交叉引用 — clicking any officer chip opens their full detail (列傳 included)
  // in a stacked modal; clicking a famous-set pill filters the codex grid to it.
  const [drillId, setDrillId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [setFilter, setSetFilter] = useState<string | null>(null);
  const desc = useDesc();
  useEscapeKey(onClose);
  // 武將圖鑑 — cross-campaign officer album (read once per open; the ledgers
  // only grow via play, not while browsing).
  const codex = useMemo(() => loadCodex(), []);

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
          {(['officers', 'codex', 'ranking', 'items', 'skills', 'traits', 'events', 'provinces'] as Section[]).map((s) => (
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
                s === 'ranking' ? '武評' :
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
            /* 圖鑑 — the cross-campaign card album: 仕 full-colour card with
               a grade-tinted frame, 遇 greyed, 未遇 a black silhouette. */
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
            const recHere = roster.filter((o) => recruited.has(o.id)).length;
            const pct = roster.length > 0 ? Math.round((recHere / roster.length) * 100) : 0;
            return (
              <>
                {/* 收集率 — this world's roster vs the everlasting album. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.6rem' }}>
                  <div style={{ flex: 1, height: 8, background: '#18212b', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #8a6a2a, #e6c473)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#e6c473', fontFamily: 'ui-monospace,monospace' }}>
                    仕 {recHere}/{roster.length}({pct}%)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
                    遇 {codex.seen.length} · 斬 {codex.slain.length}(跨戰役累積)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                  {CODEX_SETS.map((set) => {
                    const p = codexSetProgress(codex, set.id);
                    const done = p.have === p.total;
                    const active = setFilter === set.id;
                    // 成套之禮已賀 — this campaign's court has celebrated the set.
                    const feted = (setRewardsClaimed ?? []).includes(set.id);
                    return (
                      <button key={set.id}
                        onClick={() => setSetFilter(active ? null : set.id)}
                        title={feted ? `${set.en} — 成套之禮已領(金800·眾將忠誠+5);同陣出征另有羈絆之力` : set.en}
                        style={{
                          border: `1px solid ${active ? '#f2dd9a' : feted ? '#c8a24e' : done ? '#e6c473' : '#2b3845'}`,
                          background: active ? 'rgba(212,168,74,0.28)' : feted ? 'rgba(212,168,74,0.18)' : done ? 'rgba(212,168,74,0.12)' : 'transparent',
                          padding: '0.3rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer',
                          fontFamily: 'inherit', letterSpacing: '0.04rem',
                          color: done ? '#f2dd9a' : '#9aa6b0',
                          boxShadow: feted ? '0 0 8px rgba(230,196,115,0.25)' : undefined,
                        }}>
                        {feted ? '🎁 ' : done ? '✦ ' : ''}{set.zh} {p.have}/{p.total}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                  {shown.map((o) => (
                    <CodexTile key={o.id} officer={o}
                      isSeen={seen.has(o.id)} isRec={recruited.has(o.id)} isSlain={slain.has(o.id)}
                      onOpen={() => setCardId(o.id)} />
                  ))}
                </div>
              </>
            );
          })()}
          {section === 'ranking' && (() => {
            /* 天下武評 — the realm's BP board (top 20 + wherever your own
               officers actually sit). Clicking a row opens the card. */
            const q = search.trim().toLowerCase();
            const full = bpLeaderboard(officers, 0);
            const top = full.slice(0, 20);
            const mine = full.filter((r) => r.officer.forceId === playerForceId).slice(0, 5);
            const shownRows = q
              ? full.filter((r) => r.officer.name.zh.includes(search.trim()) || r.officer.name.en.toLowerCase().includes(q)).slice(0, 20)
              : top;
            const medal = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
            const row = (r: (typeof full)[number]) => {
              const o = r.officer;
              const force = o.forceId ? forces[o.forceId] : null;
              const g = officerGrade(o);
              const isMine = o.forceId === playerForceId;
              return (
                <div key={o.id} onClick={() => setCardId(o.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '0.35rem 0.6rem', cursor: 'pointer',
                    background: isMine ? 'rgba(212,168,74,0.08)' : '#10161e',
                    border: `1px solid ${isMine ? '#8a6a2a' : '#2b3845'}`, marginBottom: 4,
                    borderLeft: r.rank <= 3 ? '3px solid #e6c473' : undefined,
                  }}>
                  <span style={{ width: 34, textAlign: 'center', fontSize: r.rank <= 3 ? '1rem' : '0.8rem', color: '#c9a64e', fontFamily: 'ui-monospace,monospace' }}>{medal(r.rank)}</span>
                  {/* 風雲 — movement vs last season's board (top-50 snapshot). */}
                  {(() => {
                    const prev = (powerBoardPrev ?? {})[o.id];
                    if (prev === undefined && r.rank <= 20 && Object.keys(powerBoardPrev ?? {}).length > 0) {
                      return <span style={{ width: 34, fontSize: '0.62rem', color: '#e0907a', letterSpacing: '0.04rem' }}>NEW</span>;
                    }
                    if (prev !== undefined && prev !== r.rank) {
                      const up = prev > r.rank;
                      return (
                        <span style={{ width: 34, fontSize: '0.68rem', color: up ? '#8ac88a' : '#e0907a', fontFamily: 'ui-monospace,monospace' }}>
                          {up ? '↑' : '↓'}{Math.abs(prev - r.rank)}
                        </span>
                      );
                    }
                    return <span style={{ width: 34 }} />;
                  })()}
                  <span style={{ flex: 1, color: isMine ? '#f2dd9a' : '#e6edf3' }}>
                    {o.name.zh}
                    {isMine && <span style={{ marginLeft: 6, fontSize: '0.65rem', color: '#c8a24e' }}>我方</span>}
                  </span>
                  {force && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#9aa6b0' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: force.color }} />
                      {force.name.zh}
                    </span>
                  )}
                  {(o.stars ?? 0) > 0 && <span style={{ fontSize: '0.7rem', color: '#ffd66e' }}>{'★'.repeat(o.stars ?? 0)}</span>}
                  <span style={{ fontSize: '0.72rem', color: g.color }}>{g.name.zh}</span>
                  <span style={{ width: 64, textAlign: 'right', fontSize: '0.85rem', color: '#ffe9a8', fontFamily: 'ui-monospace,monospace' }}>{r.bp.toLocaleString()}</span>
                </div>
              );
            };
            return (
              <>
                <div style={{ fontSize: '0.72rem', color: '#7a8893', marginBottom: '0.6rem' }}>
                  天下武評 — 以綜合戰力(BP)論英雄,純屬品評、不入戰鬥;點列可開武將卡。在世且已現世者入榜。
                </div>
                {shownRows.map(row)}
                {!q && mine.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', color: '#c8a24e', margin: '0.8rem 0 0.4rem', letterSpacing: '0.08rem' }}>我方名次</div>
                    {mine.map(row)}
                  </>
                )}
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
        {cardId && officers[cardId] && (
          <OfficerCardModal
            officer={officers[cardId]}
            onClose={() => setCardId(null)}
            // 緣分跳卡 — hop along bond lines, but only to names already met.
            onJump={(id) => { if (officers[id] && codex.seen.includes(id)) setCardId(id); }}
          />
        )}
      </div>
    </div>
  );
}

/** 圖鑑小卡 — one album slot: 仕 full colour in a grade frame, 遇 greyed,
 *  未遇 a faint black silhouette with its name withheld. */
function CodexTile({ officer, isSeen, isRec, isSlain, onOpen }: {
  officer: Officer;
  isSeen: boolean; isRec: boolean; isSlain: boolean; onOpen: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const frameColor = isRec ? gradeMeta(officerGrade(officer).grade).color : isSeen ? '#7a6244' : '#1c2630';
  return (
    <div
      onClick={isSeen ? onOpen : undefined}
      title={isSeen ? officer.name.en : '未遇 — 讓他在某局登場即可解鎖'}
      style={{
        border: `1px solid ${frameColor}`, borderRadius: 6, overflow: 'hidden',
        background: isRec ? 'rgba(212,168,74,0.08)' : '#0d1218',
        cursor: isSeen ? 'pointer' : 'default',
      }}>
      <div style={{ position: 'relative', aspectRatio: '3 / 4', background: '#10161e' }}>
        {!imgFailed ? (
          <img
            src={`${import.meta.env.BASE_URL}portraits/${officer.id}.webp`}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              filter: isRec ? 'none' : isSeen ? 'grayscale(0.9) brightness(0.75)' : 'brightness(0.16) saturate(0)',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '1.6rem', color: isSeen ? '#5f6c76' : '#232d38' }}>
            {isSeen ? officer.name.zh.slice(0, 1) : '?'}
          </div>
        )}
        {isSlain && isSeen && (
          <span title="斬 — 死於我令" style={{ position: 'absolute', top: 3, right: 5, fontSize: '0.8rem', textShadow: '0 0 4px #000' }}>☠</span>
        )}
      </div>
      <div style={{ padding: '0.2rem 0.3rem', textAlign: 'center', fontSize: '0.78rem', color: isRec ? '#f2dd9a' : isSeen ? '#aab6c0' : '#3d4a56', borderTop: `1px solid ${frameColor}` }}>
        {isSeen ? officer.name.zh : '???'}
        <span style={{ marginLeft: 4, fontSize: '0.66rem', color: '#5f6c76' }}>{isRec ? '仕' : isSeen ? '遇' : ''}</span>
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
