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
import { CODEX_SETS, codexSetProgress, loadCodex, CODEX_MILESTONES, codexMilestoneReached, codexMilestoneClaimed } from '../../game/systems/codex';
import { festivalPool, FESTIVAL_GOLD_COST } from '../../game/systems/festival';
import { FRAME_SKINS, loadFrameSkin, saveFrameSkin, unlockedFrameSkins } from './cardFrames';
import { CARD_BACKS, loadCardBack, saveCardBack, unlockedCardBacks } from './cardBacks';
import { ItemCardModal } from './ItemCard';
import { OfficerCardModal, OfficerCardFace } from './OfficerCardModal';
import { officerGrade, gradeMeta } from '../../game/systems/officerGrade';
import { cardCondition } from '../../game/systems/battlePower';
import { bpLeaderboard } from '../../game/systems/powerBoard';
import { ITEM_CODEX_SETS, itemCodexSetProgress, loadItemCodex, ITEM_CODEX_MILESTONES, itemCodexMilestoneReached, itemCodexMilestoneClaimed } from '../../game/systems/itemCodex';
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
  const bounties = useGameStore((s) => s.bounties);
  const year = useGameStore((s) => s.date.year);
  const holdFestival = useGameStore((s) => s.holdTalentFestival);
  const festivalPity = useGameStore((s) => s.festivalPity);
  const generalScrolls = useGameStore((s) => s.generalScrolls);
  const claimMilestone = useGameStore((s) => s.claimCodexMilestone);
  const claimItemMilestone = useGameStore((s) => s.claimItemCodexMilestone);
  const [festivalMsg, setFestivalMsg] = useState<string | null>(null);
  const [frameSkinId, setFrameSkinId] = useState(() => loadFrameSkin().id);
  const [cardBackId, setCardBackId] = useState(() => loadCardBack().id);
  const [itemCardId, setItemCardId] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('officers');
  const [search, setSearch] = useState('');
  // 交叉引用 — clicking any officer chip opens their full detail (列傳 included)
  // in a stacked modal; clicking a famous-set pill filters the codex grid to it.
  const [drillId, setDrillId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  // ⚖ 雙卡對比 — pick two names on the 武評 board, see the cards side by side.
  const [compareSel, setCompareSel] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [setFilter, setSetFilter] = useState<string | null>(null);
  const desc = useDesc();
  useEscapeKey(onClose);
  // 武將圖鑑 — cross-campaign officer album (read once per open; the ledgers
  // only grow via play, not while browsing).
  // Re-read when 名將殘卷 changes — claiming a 圖鑑功勳 mints scrolls, so the
  // milestone's claimed state refreshes on the same tick.
  const codex = useMemo(() => loadCodex(), [generalScrolls]);

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
                  {/* 🏮 求賢祭 — the collection hub's ceremonial pull. */}
                  {playerForceId && (() => {
                    const pool = festivalPool(officers);
                    const oddsPct = Math.round(pool.odds.goldPlus * 100);
                    return (
                      <button
                        onClick={() => { const r = holdFestival(); setFestivalMsg(r.message); }}
                        disabled={pool.odds.total === 0}
                        title={`花 ${FESTIVAL_GOLD_COST} 金於都城開祭,召一名隱世賢士現身(在野,仍須親自招攬)。池中 ${pool.odds.total} 人、金牌以上佔 ${oddsPct}%;連續 3 次未出金牌保底必出。每季一次。`}
                        style={{
                          border: '1px solid #8a6a2a', background: 'rgba(230,196,115,0.12)', color: '#ffd66e',
                          padding: '0.2rem 0.7rem', borderRadius: 'var(--tkm-radius-xs)', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: '0.75rem', letterSpacing: '0.06rem',
                        }}
                      >🏮 求賢祭 {FESTIVAL_GOLD_COST}金 · 金+率{oddsPct}%{festivalPity > 0 ? ` · 保底${Math.min(festivalPity, 3)}/3` : ''}</button>
                    );
                  })()}
                  {festivalMsg && <span style={{ fontSize: '0.72rem', color: '#c8a24e' }}>{festivalMsg}</span>}
                  {/* 📜 名將殘卷 — festival-dropped currency; spent on 殘卷煉星 (武將面板). */}
                  {playerForceId && (
                    <span
                      title="名將殘卷 — 求賢祭現身即得(金牌名+2、故人再+2);於武將面板「煉星」不耗金升星。"
                      style={{ fontSize: '0.72rem', color: '#a8c4ea', border: '1px solid #4a5f7a', background: 'rgba(126,160,224,0.1)', borderRadius: 'var(--tkm-radius-xs)', padding: '0.15rem 0.5rem' }}
                    >📜 名將殘卷 {generalScrolls}</span>
                  )}
                  {/* 🎴 卡框皮膚 — achievement-unlocked cosmetic frames. */}
                  <select
                    value={frameSkinId}
                    onChange={(e) => { saveFrameSkin(e.target.value); setFrameSkinId(e.target.value); }}
                    title={`卡框皮膚(成就解鎖):${FRAME_SKINS.map((s2) => `${s2.zh}${s2.requires ? '·需成就' : ''}`).join(' / ')}`}
                    style={{ background: '#10161e', border: '1px solid #2b3845', color: '#9aa6b0', fontSize: '0.72rem', fontFamily: 'inherit' }}
                  >
                    {unlockedFrameSkins().map((s2) => <option key={s2.id} value={s2.id}>🎴 {s2.zh}</option>)}
                  </select>
                  {/* 🂠 卡背收藏 — achievement-unlocked reveal card backs. */}
                  <select
                    value={cardBackId}
                    onChange={(e) => { saveCardBack(e.target.value); setCardBackId(e.target.value); }}
                    title={`卡背收藏(開卡翻面所現,成就解鎖):${CARD_BACKS.map((b) => `${b.zh}${b.requires ? '·需成就' : ''}`).join(' / ')}`}
                    style={{ background: '#10161e', border: '1px solid #2b3845', color: '#9aa6b0', fontSize: '0.72rem', fontFamily: 'inherit' }}
                  >
                    {unlockedCardBacks().map((b) => <option key={b.id} value={b.id}>🂠 {b.zh}</option>)}
                  </select>
                </div>
                {/* 📖 圖鑑功勳 — coverage milestones (cross-campaign 遇-count); claim
                    a reached one into this campaign for scrolls + treasury gold. */}
                {playerForceId && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.7rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>圖鑑功勳 · 遇 {codex.seen.length}</span>
                    {CODEX_MILESTONES.map((m) => {
                      const reached = codexMilestoneReached(codex, m);
                      const claimed = codexMilestoneClaimed(codex, m.id);
                      const canClaim = reached && !claimed;
                      return (
                        <button key={m.id}
                          onClick={canClaim ? () => { const r = claimMilestone(m.id); setFestivalMsg(r.message); } : undefined}
                          disabled={!canClaim}
                          title={`${m.zh} — 遇滿 ${m.need} 種:名將殘卷 +${m.scrolls}、都城金 +${m.gold}${claimed ? '(已領)' : reached ? '(可領)' : `(尚差 ${m.need - codex.seen.length})`}`}
                          style={{
                            fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 9, fontFamily: 'inherit',
                            cursor: canClaim ? 'pointer' : 'default',
                            border: `1px solid ${claimed ? '#3f5c3f' : canClaim ? '#8a6a2a' : '#2b3845'}`,
                            background: claimed ? 'rgba(138,200,138,0.08)' : canClaim ? 'rgba(230,196,115,0.16)' : 'transparent',
                            color: claimed ? '#8ac88a' : canClaim ? '#ffd66e' : '#5f6c76',
                          }}>
                          {claimed ? '✓ ' : canClaim ? '🎁 ' : ''}{m.zh} {codex.seen.length}/{m.need}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                      peak={codex.peak[o.id]}
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
                  {/* 加冕 — a portrait medallion; the realm's finest wears the crown. */}
                  <span style={{ position: 'relative', width: 26, height: 26, flex: 'none' }}>
                    <img src={`${import.meta.env.BASE_URL}portraits/${o.id}.webp`} alt="" loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${r.rank <= 3 ? '#e6c473' : '#3c4f5e'}` }} />
                    {r.rank === 1 && <span style={{ position: 'absolute', top: -11, left: 5, fontSize: '0.72rem' }}>👑</span>}
                  </span>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareSel((prev) => prev.includes(o.id)
                        ? prev.filter((x) => x !== o.id)
                        : [...prev.slice(-1), o.id]);
                    }}
                    title="⚖ 選兩人對比卡面"
                    style={{
                      background: compareSel.includes(o.id) ? 'rgba(230,196,115,0.25)' : 'transparent',
                      border: `1px solid ${compareSel.includes(o.id) ? '#e6c473' : '#2b3845'}`,
                      borderRadius: 'var(--tkm-radius-xs)', color: compareSel.includes(o.id) ? '#f2dd9a' : '#5f6c76',
                      cursor: 'pointer', fontSize: '0.72rem', padding: '0 5px', fontFamily: 'inherit',
                    }}
                  >⚖</button>
                </div>
              );
            };
            return (
              <>
                <div style={{ fontSize: '0.72rem', color: '#7a8893', marginBottom: '0.6rem' }}>
                  天下武評 — 以綜合戰力(BP)論英雄,純屬品評、不入戰鬥;點列可開武將卡。在世且已現世者入榜。
                </div>
                {/* 🎯 天下懸賞 — the court's active wanted notices. */}
                {(bounties?.length ?? 0) > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.7rem' }}>
                    {bounties!.map((b) => {
                      const o = officers[b.officerId];
                      if (!o) return null;
                      return (
                        <span key={b.officerId}
                          onClick={() => setCardId(b.officerId)}
                          title={b.kind === 'capture'
                            ? `生擒${o.name.zh}並收監於我城 — 賞金 ${b.gold}、威望 +${b.renown}(限至 ${b.expiresYear} 年)`
                            : `招攬${o.name.zh}入幕 — 賞金 ${b.gold}、威望 +${b.renown}(限至 ${b.expiresYear} 年)`}
                          style={{
                            fontSize: '0.74rem', padding: '0.15rem 0.6rem', borderRadius: 9, cursor: 'pointer',
                            border: `1px solid ${b.kind === 'capture' ? '#8a4030' : '#3f5c3f'}`,
                            background: b.kind === 'capture' ? 'rgba(184,68,46,0.12)' : 'rgba(138,200,138,0.1)',
                            color: b.kind === 'capture' ? '#e0907a' : '#a8d8a8',
                            opacity: b.expiresYear < year ? 0.5 : 1,
                          }}>
                          {b.kind === 'capture' ? '🎯 擒' : '🤝 攬'} {o.name.zh} · {b.gold}金{o.locationCityId && cities[o.locationCityId] ? ` · 現於${cities[o.locationCityId].name.zh}` : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
                {shownRows.map(row)}
                {!q && mine.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', color: '#c8a24e', margin: '0.8rem 0 0.4rem', letterSpacing: '0.08rem' }}>我方名次</div>
                    {mine.map(row)}
                  </>
                )}
                {compareSel.length === 2 && (
                  <button
                    onClick={() => setCompareOpen(true)}
                    style={{
                      position: 'sticky', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                      display: 'block', margin: '0.6rem auto 0', padding: '0.4rem 1.4rem',
                      background: 'rgba(230,196,115,0.2)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius-sm)',
                      color: '#f2dd9a', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', letterSpacing: '0.15rem',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                    }}
                  >⚖ 對比 {officers[compareSel[0]]?.name.zh} × {officers[compareSel[1]]?.name.zh}</button>
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
          {/* 藏珍功勳 — item-collection milestones; claim into this campaign. */}
          {section === 'items' && playerForceId && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>藏珍功勳 · 藏 {itemCodex.carried.length}</span>
              {ITEM_CODEX_MILESTONES.map((m) => {
                const reached = itemCodexMilestoneReached(itemCodex, m);
                const claimed = itemCodexMilestoneClaimed(itemCodex, m.id);
                const canClaim = reached && !claimed;
                return (
                  <button key={m.id}
                    onClick={canClaim ? () => { const r = claimItemMilestone(m.id); setFestivalMsg(r.message); } : undefined}
                    disabled={!canClaim}
                    title={`${m.zh} — 藏滿 ${m.need} 件:鐵 +${m.iron}、都城金 +${m.gold}${claimed ? '(已領)' : reached ? '(可領)' : `(尚差 ${m.need - itemCodex.carried.length})`}`}
                    style={{
                      fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 9, fontFamily: 'inherit',
                      cursor: canClaim ? 'pointer' : 'default',
                      border: `1px solid ${claimed ? '#3f5c3f' : canClaim ? '#8a6a2a' : '#2b3845'}`,
                      background: claimed ? 'rgba(138,200,138,0.08)' : canClaim ? 'rgba(230,196,115,0.16)' : 'transparent',
                      color: claimed ? '#8ac88a' : canClaim ? '#ffd66e' : '#5f6c76',
                    }}>
                    {claimed ? '✓ ' : canClaim ? '🎁 ' : ''}{m.zh} {itemCodex.carried.length}/{m.need}
                  </button>
                );
              })}
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
                  <span style={{ cursor: 'pointer', textDecoration: 'underline dotted rgba(230,196,115,0.35)', textUnderlineOffset: 2 }} title="名品卡" onClick={() => setItemCardId(it.id)}><Name pair={it.name} /></span>
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
        {itemCardId && <ItemCardModal itemId={itemCardId} onClose={() => setItemCardId(null)} />}
        {/* ⚖ 雙卡對撞 — two full cards side by side (stacks on a narrow screen). */}
        {compareOpen && compareSel.length === 2 && officers[compareSel[0]] && officers[compareSel[1]] && (
          <div
            onClick={() => setCompareOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(4,6,10,0.85)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 16,
              padding: '2rem 1rem', overflowY: 'auto', flexWrap: 'wrap',
            }}
          >
            {compareSel.map((id) => (
              <div key={id} onClick={(e) => e.stopPropagation()} style={{ width: 'min(380px, 92vw)' }}>
                <OfficerCardFace officer={officers[id]} />
              </div>
            ))}
            <button
              onClick={() => setCompareOpen(false)}
              aria-label="關閉對比"
              style={{
                position: 'fixed', top: 14, right: 16, width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(10,14,20,0.8)', border: '1px solid rgba(255,255,255,0.25)', color: '#cfd8e0',
                cursor: 'pointer', fontSize: '1rem',
              }}
            >×</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 圖鑑小卡 — one album slot: 仕 full colour in a grade frame, 遇 greyed,
 *  未遇 a faint black silhouette with its name withheld. */
function CodexTile({ officer, isSeen, isRec, isSlain, peak, onOpen }: {
  officer: Officer;
  isSeen: boolean; isRec: boolean; isSlain: boolean;
  /** 巔峰形態 — the best form you ever raised this officer to (cross-campaign). */
  peak?: import('../../game/systems/codex').CodexPeak;
  onOpen: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  // 六星巔峰 — an officer once raised to six stars keeps a gold ring forever.
  const peakGold = (peak?.stars ?? 0) >= 6;
  const frameColor = peakGold ? '#ffd66e' : isRec ? gradeMeta(officerGrade(officer).grade).color : isSeen ? '#7a6244' : '#1c2630';
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
        {/* 品相印 — the graded-slab appraisal, corner-stamped from the peak form. */}
        {peak && isSeen && (() => {
          const cond = cardCondition(peak.bp, peak.stars);
          return (
            <span title={`品相 ${cond.zh} — 依巔峰戰力與星級鑑定`}
              style={{ position: 'absolute', top: 3, left: 4, fontSize: '0.56rem', color: cond.color, background: 'rgba(6,10,16,0.82)', border: `1px solid ${cond.color}66`, borderRadius: 3, padding: '0 3px', letterSpacing: '0.06rem' }}>
              ◈{cond.zh}
            </span>
          );
        })()}
      </div>
      <div style={{ padding: '0.2rem 0.3rem', textAlign: 'center', fontSize: '0.78rem', color: isRec ? '#f2dd9a' : isSeen ? '#aab6c0' : '#3d4a56', borderTop: `1px solid ${frameColor}` }}>
        {isSeen ? officer.name.zh : '???'}
        <span style={{ marginLeft: 4, fontSize: '0.66rem', color: '#5f6c76' }}>{isRec ? '仕' : isSeen ? '遇' : ''}</span>
        {peak && isSeen && (
          <div title={`巔峰形態 — 曾養至 戰力${peak.bp.toLocaleString()}${peak.stars > 0 ? ` · ${peak.stars}★` : ''}`}
            style={{ fontSize: '0.6rem', color: peakGold ? '#ffd66e' : '#8a7a5a', fontFamily: 'ui-monospace,monospace' }}>
            巔峰{peak.bp.toLocaleString()}{peak.stars > 0 ? `·${peak.stars}★` : ''}
          </div>
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
