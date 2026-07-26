/**
 * 武將詳情的區塊元件 — the leaf sections of OfficerDetail.
 *
 * OfficerDetail.tsx was 3,123 lines: one 1,900-line component followed by eight
 * self-contained sections that only ever talked to it through props. Those
 * eight are lifted here unchanged — same code, same behaviour — so the file
 * that holds the actual panel logic is a third smaller and the sections can be
 * read (and re-rendered in isolation) without scrolling past it.
 *
 * Nothing here is used anywhere else in the app; they are exported only so the
 * panel can import them back.
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import { useGameStore } from '../../../game/state/store';
import { composeBiography } from '../../../game/systems/biography';
import type { BoutRecord } from '../../../game/systems/duelHall';
// Lazy — pulls the heavy 3D duel/debate stack only when a 名局 is actually replayed.
const BoutReplay3D = lazy(() => import('../duel/BoutReplay3D').then((m) => ({ default: m.BoutReplay3D })));
import { FAMILY_LINEAGE } from '../../../game/data/familyLineage';
import {
  OFFICER_RELATIONSHIPS,
  TRAIT_DEFS_BY_ID,
  getBiography,
} from '../../../game/data';
import { HISTORICAL_LIFESPANS } from '../../../game/data/historicalLifespans';
import { clanOf } from '../../../game/data/clans';
import type { Officer } from '../../../game/types';
import styles from '../OfficerDetail.module.css';
import { useT, useLanguage } from '../../i18n';

type PortraitArchetype = 'warrior' | 'strategist' | 'civil' | 'ruler' | 'lady' | 'sage';

const REL_KIND_LABEL: Record<string, { zh: string; en: string; color: string }> = {
  'sworn-brothers': { zh: '義兄弟', en: 'Sworn Brothers', color: '#e6c473' },
  'rival':          { zh: '宿敵',   en: 'Rival',          color: '#b8442e' },
  'mentor-student': { zh: '師弟',   en: 'Mentor / Student', color: '#3a7dd9' },
  'master-servant': { zh: '主従',   en: 'Master / Servant', color: '#c9a64e' },
  'romantic':       { zh: '恋人',   en: 'Romantic',         color: '#c178c7' },
  'enemy':          { zh: '私仇',   en: 'Personal Enemy',   color: '#5a2025' },
  // Family kinds (from FamilyRelation type)
  'spouse':         { zh: '配偶',   en: 'Spouse',          color: '#e8a8c8' },
  'parent':         { zh: '父母',   en: 'Parent',          color: '#88b7e8' },
  'child':          { zh: '子嗣',   en: 'Child',           color: '#7ed68a' },
  'sibling':        { zh: '兄弟',   en: 'Sibling',         color: '#c9a64e' },
};

/**
 * 下鑽 — opening a related officer's own panel from inside a section.
 *
 * The panel imports these sections, so a section cannot import the panel back
 * without a module cycle. It is handed in instead: OfficerDetail passes a
 * renderer, and the sections call it. (React.lazy would also break the cycle,
 * but lazy modals hang under a headless browser — see the project note — and
 * these are modals.)
 */
export type DrillDown = (officer: Officer, onClose: () => void) => React.ReactNode;

export function RelationshipsSection({ officerId, officersOverride, drillDown }: {
  officerId: string;
  officersOverride?: Record<string, Officer>;
  drillDown?: DrillDown;
}) {
  const storeOfficers = useGameStore((s) => s.officers);
  const officers = officersOverride ?? storeOfficers;
  const family = useGameStore((s) => s.family);
  const t = useT();
  const lang = useLanguage();
  // R2 — local state for drill-down: clicking a related officer chip
  // opens THEIR detail in a stacked modal.
  const [drillOfficerId, setDrillOfficerId] = useState<string | null>(null);
  // R5 — local collapse state per category. Default expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (k: string) => {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const rels = OFFICER_RELATIONSHIPS.filter((r) => r.a === officerId || r.b === officerId);
  type FamilyDisplay = { otherId: string; kind: 'spouse' | 'parent' | 'child' | 'sibling'; note: { zh: string; en: string } };
  const seenFamilyKeys = new Set<string>();
  const familyPool = [
    ...family,
    ...FAMILY_LINEAGE.filter((f) => f.officerA === officerId || f.officerB === officerId),
  ].filter((f) => {
    const key = `${f.officerA}|${f.officerB}|${f.kind}`;
    if (seenFamilyKeys.has(key)) return false;
    seenFamilyKeys.add(key);
    return true;
  });
  const familyRels: FamilyDisplay[] = familyPool
    .filter((f) => f.officerA === officerId || f.officerB === officerId)
    .map((f) => {
      const isA = f.officerA === officerId;
      const otherId = isA ? f.officerB : f.officerA;
      let kind: FamilyDisplay['kind'];
      if (f.kind === 'spouse') kind = 'spouse';
      else if (f.kind === 'sibling') kind = 'sibling';
      else kind = isA ? 'child' : 'parent';
      const otherName = officers[otherId]?.name.zh ?? otherId;
      const note = (() => {
        switch (kind) {
          case 'spouse':  return { zh: `結髮 · ${otherName}`,     en: `Spouse of ${otherName}` };
          case 'parent':  return { zh: `${otherName}之父母`,      en: `Parent of ${otherName}` };
          case 'child':   return { zh: `${otherName}之子嗣`,      en: `Child of ${otherName}` };
          case 'sibling': return { zh: `與${otherName}兄弟`,      en: `Sibling of ${otherName}` };
        }
      })();
      return { otherId, kind, note };
    });
  if (rels.length === 0 && familyRels.length === 0) return null;

  // R5 — Group entries by category for collapsible display.
  type Entry = {
    key: string;
    otherId: string;
    kind: string;
    noteZh: string;
    noteEn: string;
  };
  const groups: Record<string, Entry[]> = {};
  // Order priority — family kinds first, then bond kinds
  const CATEGORY_ORDER = [
    'spouse', 'parent', 'child', 'sibling',
    'sworn-brothers', 'master-servant', 'mentor-student',
    'romantic', 'rival', 'enemy',
  ];
  const addEntry = (kind: string, e: Entry) => {
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(e);
  };
  for (const fr of familyRels) {
    addEntry(fr.kind, {
      key: `fam-${fr.otherId}-${fr.kind}`,
      otherId: fr.otherId,
      kind: fr.kind,
      noteZh: fr.note.zh,
      noteEn: fr.note.en,
    });
  }
  for (const r of rels) {
    const otherId = r.a === officerId ? r.b : r.a;
    addEntry(r.kind, {
      key: `${r.a}-${r.b}-${r.kind}`,
      otherId,
      kind: r.kind,
      noteZh: r.note.zh,
      noteEn: r.note.en,
    });
  }
  const totalCount = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

  const renderEntry = (entry: Entry) => {
    const other = officers[entry.otherId];
    const meta = REL_KIND_LABEL[entry.kind];
    if (!other || !meta) return null;
    return (
      <div
        key={entry.key}
        onClick={() => setDrillOfficerId(entry.otherId)}
        title={lang === 'en' ? `Open ${other.name.en}` : `查看 ${other.name.zh}`}
        style={{
          background: '#10161e',
          borderLeft: `3px solid ${meta.color}`,
          padding: '0.4rem 0.6rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#1b2531'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#10161e'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>
            <span style={{ color: '#e6c473' }}>{lang === 'en' ? other.name.en : other.name.zh}</span>
            {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>{other.name.en}</span></>}
          </span>
          <span style={{
            fontSize: '0.72rem', letterSpacing: '0.05rem', textTransform: 'uppercase',
            color: meta.color,
          }}>
            {lang === 'en' ? meta.en : lang === 'both' ? `${meta.zh} ${meta.en}` : meta.zh}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#aab6c0', fontStyle: 'italic', marginTop: '0.2rem' }}>
          {lang === 'en' ? entry.noteEn : lang === 'both' ? `${entry.noteZh} · ${entry.noteEn}` : entry.noteZh}
        </div>
      </div>
    );
  };

  const drillOfficer = drillOfficerId ? officers[drillOfficerId] : null;

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>
        {t('因緣', 'Relationships')}
        <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#7a8893' }}>
          {totalCount}
        </span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {CATEGORY_ORDER.map((cat) => {
          const arr = groups[cat];
          if (!arr || arr.length === 0) return null;
          const meta = REL_KIND_LABEL[cat];
          if (!meta) return null;
          const isCollapsed = collapsed.has(cat);
          return (
            <div key={cat}>
              <div
                onClick={() => toggleCollapse(cat)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.15rem 0.3rem',
                  borderBottom: `1px dashed ${meta.color}`,
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{
                  color: meta.color,
                  fontSize: '0.72rem',
                  letterSpacing: '0.07rem',
                }}>
                  {isCollapsed ? '▸' : '▾'} {lang === 'en' ? meta.en : meta.zh}
                  <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>({arr.length})</span>
                </span>
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {arr.map(renderEntry)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* R2 — Drill-down: clicking a chip opens that officer's full detail */}
      {drillOfficer && drillDown?.(drillOfficer, () => setDrillOfficerId(null))}
    </section>
  );
}

/** 本朝實錄 — the biography THIS campaign wrote: composed live from the
 *  officer's deeds, epithets and battle history. The static lore above is
 *  who they were; this is who they're becoming in your game. */
export function CampaignChronicleBlock({ officer, officersOverride, drillDown }: {
  officer: Officer;
  officersOverride?: Record<string, Officer>;
  drillDown?: DrillDown;
}) {
  const deeds = useGameStore((s) => s.deeds[officer.id] ?? null);
  const battleHistory = useGameStore((s) => s.battleHistory);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const storeOfficers = useGameStore((s) => s.officers);
  const family = useGameStore((s) => s.family);
  const runtimeBonds = useGameStore((s) => s.runtimeBonds);
  const duelHall = useGameStore((s) => s.duelHall);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const officers = officersOverride ?? storeOfficers;
  const lang = useLanguage();
  const t = useT();
  // B — 交叉引用 click targets: drill to a named officer, or replay a 名局.
  const [drillId, setDrillId] = useState<string | null>(null);
  const [replay, setReplay] = useState<BoutRecord | null>(null);
  const officerNamesById = useMemo(
    () => Object.fromEntries(Object.values(officers).map((o) => [o.id, o.name])),
    [officers],
  );
  const forceNamesById = useMemo(
    () => Object.fromEntries(Object.values(forces).map((f) => [f.id, f.name])),
    [forces],
  );
  const paragraphs = useMemo(() => composeBiography({
    officer,
    deeds,
    battleHistory,
    forceNameZh: officer.forceId ? forces[officer.forceId]?.name.zh ?? null : null,
    cityNameZhById: Object.fromEntries(Object.values(cities).map((c) => [c.id, c.name.zh])),
    officerNamesById,
    forceNamesById,
    family,
    runtimeBonds,
    duelHall,
    clanStandings,
  }), [officer, deeds, battleHistory, forces, cities, officerNamesById, forceNamesById, family, runtimeBonds, duelHall, clanStandings]);
  return (
    <div style={{ marginTop: '0.6rem', borderTop: '1px dashed #26323e', paddingTop: '0.5rem' }}>
      <div style={{
        fontSize: '0.66rem', color: '#c9a64e', letterSpacing: '0.08rem',
        textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', marginBottom: 4,
      }}>{t('本朝實錄', 'This campaign')}</div>
      {paragraphs.map((p, i) => {
        // Clickable cross-references: named officers we can drill to, a bout we can replay.
        const refIds = [...new Set(p.refs?.officerIds ?? [])].filter((id) => id !== officer.id && officers[id]);
        const bout = p.refs?.boutId ? duelHall.find((b) => b.id === p.refs!.boutId) : undefined;
        return (
          <div key={i} style={{ margin: '0 0 0.35rem' }}>
            <p style={{
              margin: 0, fontSize: '0.8rem', lineHeight: 1.7,
              color: '#cdb88f', fontFamily: 'var(--tkm-font-body)',
            }}>
              {lang === 'en' ? p.en : lang === 'both' ? `${p.zh} — ${p.en}` : p.zh}
            </p>
            {(refIds.length > 0 || bout) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 3 }}>
                {refIds.map((id) => (
                  <button key={id} onClick={() => setDrillId(id)} style={refChip}>
                    {officers[id].name.zh}
                  </button>
                ))}
                {bout && (
                  <button onClick={() => setReplay(bout)} style={{ ...refChip, color: '#9ed8b8', borderColor: '#3a5e4c' }}>
                    ▶ {t('名局重演', 'Replay')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {drillId && officers[drillId] && drillDown?.(officers[drillId], () => setDrillId(null))}
      {replay && (
        <Suspense fallback={null}>
          <BoutReplay3D rec={replay} onClose={() => setReplay(null)} />
        </Suspense>
      )}
    </div>
  );
}

const refChip: React.CSSProperties = {
  background: 'rgba(212,168,74,0.10)', border: '1px solid #5a4a2a', color: '#e6c473',
  padding: '0.05rem 0.45rem', fontSize: '0.72rem', cursor: 'pointer',
  fontFamily: 'var(--tkm-font-body)', borderRadius: 'var(--tkm-radius-xs)',
};

export function BiographyBlock({ officer }: { officer: Officer }) {
  const bio = getBiography(officer.id, officer.name.en, officer.name.zh, officer.stats);
  const lang = useLanguage();
  // 歷代名將 cross-over generals carry their real historical lifespan as a
  // display-only line (their playable birthYear is shifted to ~150 AD).
  const lifespan = HISTORICAL_LIFESPANS[officer.id];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {bio.era && (
        <div
          style={{
            fontSize: '0.72rem',
            color: '#c9a64e',
            letterSpacing: '0.07rem',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {lang === 'en' ? bio.era.en : lang === 'both' ? `${bio.era.zh} · ${bio.era.en}` : bio.era.zh}
        </div>
      )}
      {lifespan && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#7a8893',
            fontFamily: 'var(--tkm-font-body)',
          }}
          title={lang === 'en' ? 'Historical lifespan' : '歷史生卒'}
        >
          ◷ {lang === 'en' ? lifespan.en : lang === 'both' ? `${lifespan.zh} · ${lifespan.en}` : lifespan.zh}
        </div>
      )}
      {lang !== 'en' && (
        <div
          style={{
            background: '#10161e',
            borderLeft: '3px solid #e6c473',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#e6c473',
            fontFamily: 'var(--tkm-font-body)',
          }}
        >
          {bio.zh}
        </div>
      )}
      {lang !== 'zh' && (
        <div
          style={{
            background: '#10161e',
            borderLeft: '3px solid #364654',
            padding: '0.6rem 0.85rem',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: '#aab6c0',
            fontStyle: 'italic',
          }}
        >
          {bio.en}
        </div>
      )}
      {bio.quote && (
        <div
          style={{
            background: '#080b0e',
            border: '1px dashed #2b3845',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#e6edf3',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          &ldquo; {lang === 'en' ? bio.quote.en : bio.quote.zh} &rdquo;
          {lang === 'both' && (
            <div style={{ fontSize: '0.7rem', color: '#7a8893', marginTop: '0.3rem' }}>
              — {bio.quote.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Known Chinese compound surnames present in the roster.
const COMPOUND_SURNAMES = [
  '諸葛', '司馬', '夏侯', '太史', '公孫', '上官', '歐陽',
];

function getSurname(zh: string): string {
  for (const s of COMPOUND_SURNAMES) {
    if (zh.startsWith(s)) return s;
  }
  return zh.charAt(0);
}

// Officer ids whose full-body portrait (public/portraits/<id>-full.webp) 404'd
// this session — skip re-requesting so we don't re-fire a failing GET.
const missingFullPortraits = new Set<string>();

/**
 * Left column of the officer-detail modal. Shows a hand-drawn full-body
 * portrait (public/portraits/<id>-full.webp) at its natural proportions when
 * one exists; otherwise falls back to the procedural circular Portrait.
 */
export function PortraitColumn({
  officer,
  zh,
  color,
  archetype,
  age,
}: {
  officer: Officer;
  zh: string;
  color: string;
  archetype: PortraitArchetype;
  age: number;
}) {
  const [imgFailed, setImgFailed] = useState(() => missingFullPortraits.has(officer.id));
  const src = `${import.meta.env.BASE_URL}portraits/${officer.id}-full.webp`;

  return (
    <div className={styles.portraitColumn}>
      {imgFailed ? (
        <Portrait zh={zh} color={color} archetype={archetype} age={age} />
      ) : (
        <img
          className={styles.portraitFull}
          src={src}
          alt={zh}
          loading="lazy"
          onError={() => { missingFullPortraits.add(officer.id); setImgFailed(true); }}
        />
      )}
    </div>
  );
}

export function Portrait({
  zh,
  color,
  archetype,
  age,
}: {
  zh: string;
  color: string;
  archetype: PortraitArchetype;
  age: number;
}) {
  const surname = getSurname(zh);
  const isCompound = surname.length === 2;
  const gradId = `grad-${zh.charCodeAt(0)}-${zh.charCodeAt(1) ?? 0}-${archetype}`;
  const isOld = age >= 55;

  // Archetype-specific accent color.
  const accent: Record<PortraitArchetype, string> = {
    warrior: '#b8442e',
    strategist: '#3a7dd9',
    civil: '#6abf6a',
    ruler: '#e6c473',
    lady: '#c178c7',
    sage: '#88b7e8',
  };
  const acc = accent[archetype];

  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      className={styles.portrait}
    >
      <defs>
        <radialGradient id={gradId} cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="60%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#10161e" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${gradId}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6c473" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
      </defs>

      {/* Outer frame ring with archetype color */}
      <circle cx="42" cy="42" r="40" fill="none" stroke={acc} strokeWidth="1" opacity="0.5" />
      <circle cx="42" cy="42" r="38" fill={`url(#${gradId})`} stroke={`url(#${gradId}-frame)`} strokeWidth="1.8" />

      {/* Archetype ornaments */}
      {archetype === 'warrior' && (
        <g>
          {/* Helmet sweep over the top */}
          <path d="M 14 30 Q 42 8 70 30 L 66 32 Q 42 14 18 32 Z" fill="#5a2025" opacity="0.9" stroke="#b8442e" strokeWidth="0.6" />
          {/* Plume */}
          <path d="M 42 8 L 38 2 L 42 4 L 46 2 Z" fill="#b8442e" />
          {/* Cheek guards */}
          <path d="M 14 38 L 14 50 L 20 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
          <path d="M 70 38 L 70 50 L 64 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
        </g>
      )}
      {archetype === 'strategist' && (
        <g>
          {/* Scholar's cap (冠) - boxy with a tassel */}
          <rect x="28" y="14" width="28" height="10" rx="1" fill="#1a3052" stroke="#3a7dd9" strokeWidth="0.6" />
          <path d="M 28 14 L 32 8 L 52 8 L 56 14 Z" fill="#1a3052" opacity="0.7" />
          <line x1="42" y1="8" x2="42" y2="4" stroke="#88b7e8" strokeWidth="0.8" />
          <circle cx="42" cy="3" r="1" fill="#e6c473" />
        </g>
      )}
      {archetype === 'sage' && (
        <g>
          {/* Daoist headdress with star */}
          <path d="M 22 22 Q 42 6 62 22 L 58 26 Q 42 12 26 26 Z" fill="#0a1a2a" opacity="0.85" />
          <path d="M 42 6 L 44 10 L 48 11 L 45 14 L 46 18 L 42 16 L 38 18 L 39 14 L 36 11 L 40 10 Z" fill="#e6c473" opacity="0.9" />
          {/* Feathered fan accent */}
          <path d="M 64 50 Q 76 46 72 60 Q 66 56 64 50 Z" fill="#e6edf3" opacity="0.7" stroke="#7a8893" strokeWidth="0.3" />
        </g>
      )}
      {archetype === 'civil' && (
        <g>
          {/* Tall civil hat */}
          <rect x="32" y="10" width="20" height="14" rx="1" fill="#2a3a2a" stroke="#6abf6a" strokeWidth="0.6" />
          <line x1="42" y1="10" x2="42" y2="6" stroke="#6abf6a" strokeWidth="0.6" />
          <circle cx="42" cy="5" r="0.8" fill="#e6c473" />
        </g>
      )}
      {archetype === 'ruler' && (
        <g>
          {/* Imperial crown with bead curtain */}
          <rect x="22" y="14" width="40" height="6" fill="#26323e" stroke="#e6c473" strokeWidth="1" />
          <rect x="22" y="10" width="40" height="6" fill="#10161e" stroke="#e6c473" strokeWidth="0.6" />
          {/* Hanging beads */}
          {[26, 31, 36, 42, 48, 53, 58].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="20" x2={x} y2="26" stroke="#e6c473" strokeWidth="0.4" />
              <circle cx={x} cy="27" r="1.2" fill="#e6c473" />
            </g>
          ))}
          {/* Top dragon ornament */}
          <path d="M 38 10 L 42 4 L 46 10 Z" fill="#b8442e" />
        </g>
      )}
      {archetype === 'lady' && (
        <g>
          {/* Hair coil with hairpin and ornament */}
          <ellipse cx="42" cy="20" rx="22" ry="10" fill="#10161e" opacity="0.85" />
          <ellipse cx="42" cy="18" rx="14" ry="6" fill="#1b2531" />
          {/* Hairpin with flower */}
          <line x1="48" y1="22" x2="58" y2="14" stroke="#e6c473" strokeWidth="0.6" />
          <circle cx="58" cy="14" r="2.5" fill="#c178c7" stroke="#e6c473" strokeWidth="0.4" />
          <circle cx="58" cy="14" r="1" fill="#e6c473" />
          {/* Side hair locks */}
          <path d="M 22 24 Q 18 38 22 50" fill="none" stroke="#10161e" strokeWidth="2.5" opacity="0.7" />
          <path d="M 62 24 Q 66 38 62 50" fill="none" stroke="#10161e" strokeWidth="2.5" opacity="0.7" />
        </g>
      )}

      {/* Beard for older male officers */}
      {isOld && archetype !== 'lady' && (
        <path
          d="M 30 56 Q 42 78 54 56 Q 50 70 42 72 Q 34 70 30 56 Z"
          fill="#26323e"
          opacity="0.7"
        />
      )}

      {/* Surname character */}
      {isCompound ? (
        <>
          <text
            x="42" y="40"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e6edf3"
            stroke="#10161e"
            strokeWidth="0.4"
          >
            {surname.charAt(0)}
          </text>
          <text
            x="42" y="60"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e6edf3"
            stroke="#10161e"
            strokeWidth="0.4"
          >
            {surname.charAt(1)}
          </text>
        </>
      ) : (
        <text
          x="42" y="56"
          textAnchor="middle"
          fontSize="28"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#e6edf3"
          stroke="#10161e"
          strokeWidth="0.5"
        >
          {surname}
        </text>
      )}

      {/* Archetype seal in corner */}
      <g transform="translate(64, 64)">
        <rect x="-7" y="-7" width="14" height="14" fill={acc} stroke="#10161e" strokeWidth="0.8" rx="1" />
        <text
          x="0" y="3"
          textAnchor="middle"
          fontSize="9"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#fff"
        >
          {archetype === 'warrior' ? '武'
          : archetype === 'strategist' ? '智'
          : archetype === 'sage' ? '聖'
          : archetype === 'civil' ? '文'
          : archetype === 'ruler' ? '君'
          : '麗'}
        </text>
      </g>
    </svg>
  );
}

export function StatBar({
  label,
  value,
  bonus = 0,
  mode = 'stat',
}: {
  label: string;
  value: number;
  /** Bonuses from items + skills (drawn as a separate fill segment). */
  bonus?: number;
  mode?: 'stat' | 'loyalty';
}) {
  // Loyalty: 0–100 scale. Stats: 0–150 scale (max possible after XP growth).
  // Past 100, glow gold ("transcendent"). Past 130, glow brighter.
  const scaleMax = mode === 'loyalty' ? 100 : 150;
  const effective = value + bonus;
  const baseWidthPct = Math.min(100, (value / scaleMax) * 100);
  const bonusWidthPct = Math.min(100, ((value + bonus) / scaleMax) * 100) - baseWidthPct;
  const fillColor =
    mode === 'loyalty'
      ? effective >= 80 ? '#3a7dd9' : effective >= 50 ? '#c9a64e' : '#b8442e'
      : effective >= 130 ? '#ffce4a'
      : effective >= 100 ? '#e6c473'
      : effective >= 80 ? '#c9a64e'
      : effective >= 60 ? '#7a8893'
      : '#364654';
  const glow = mode === 'stat' && effective > 100;
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statBarTrack}>
        {/* Hundred-mark tick — shows the old "natural" cap */}
        {mode === 'stat' && (
          <div
            style={{
              position: 'absolute',
              left: `${(100 / scaleMax) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(212, 168, 74, 0.5)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Base stat fill */}
        <div
          className={styles.statBarFill}
          style={{
            width: `${baseWidthPct}%`,
            background: fillColor,
            boxShadow: glow ? `0 0 6px ${fillColor}` : undefined,
          }}
        />
        {/* Item + skill bonus fill — striped/lighter to show it's external */}
        {bonus > 0 && (
          <div
            className={styles.statBarFill}
            style={{
              left: `calc(1px + ${baseWidthPct}%)`,
              width: `${bonusWidthPct}%`,
              background:
                `repeating-linear-gradient(45deg, #88b7e8 0, #88b7e8 4px, #5a8ab8 4px, #5a8ab8 8px)`,
              boxShadow: '0 0 6px #88b7e8',
            }}
          />
        )}
        <span
          className={styles.statBarValue}
          style={glow ? { color: '#ffce4a', textShadow: '0 0 4px #000, 0 0 6px #ffce4a' } : undefined}
          title={bonus > 0 ? `Base ${value} + ${bonus} from items/skills` : undefined}
        >
          {effective}
          {bonus > 0 && (
            <span style={{ color: '#88b7e8', fontSize: '0.7em', marginLeft: 4 }}>
              ({value}+{bonus})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ─── R4 — Family tree mini-visualization ──────────────────────────────
 * Shows parent(s) above, self in center, spouse to the side, children
 * below — all clickable to drill-down. Uses static FAMILY_LINEAGE +
 * runtime state.family.
 */
export function FamilyTreeSection({ officerId, officersOverride, drillDown }: {
  officerId: string;
  officersOverride?: Record<string, Officer>;
  drillDown?: DrillDown;
}) {
  const storeOfficers = useGameStore((s) => s.officers);
  const officers = officersOverride ?? storeOfficers;
  const family = useGameStore((s) => s.family);
  const t = useT();
  const lang = useLanguage();
  const [drillId, setDrillId] = useState<string | null>(null);

  const allFamily = [...family, ...FAMILY_LINEAGE.filter(
    (f) => f.officerA === officerId || f.officerB === officerId,
  )];
  // Dedup
  const seen = new Set<string>();
  const familyPool = allFamily.filter((f) => {
    const k = `${f.officerA}|${f.officerB}|${f.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const parents: string[] = [];
  const children: string[] = [];
  const spouses: string[] = [];
  const siblings: string[] = [];
  for (const f of familyPool) {
    if (f.officerA !== officerId && f.officerB !== officerId) continue;
    if (f.kind === 'parent-child') {
      if (f.officerA === officerId) children.push(f.officerB);
      else parents.push(f.officerA);
    } else if (f.kind === 'spouse') {
      spouses.push(f.officerA === officerId ? f.officerB : f.officerA);
    } else if (f.kind === 'sibling') {
      siblings.push(f.officerA === officerId ? f.officerB : f.officerA);
    }
  }

  if (parents.length === 0 && children.length === 0 && spouses.length === 0 && siblings.length === 0) {
    return null;
  }

  const node = (id: string, color: string, role: string) => {
    const o = officers[id];
    if (!o) return null;
    return (
      <div
        key={`${role}-${id}`}
        onClick={() => setDrillId(id)}
        title={lang === 'en' ? `Open ${o.name.en}` : `查看 ${o.name.zh}`}
        style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: '#10161e',
          border: `1px solid ${color}`,
          padding: '0.35rem 0.55rem',
          minWidth: 75,
          cursor: 'pointer',
          margin: 2,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#1b2531'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#10161e'; }}
      >
        <span style={{ color, fontSize: '0.7rem', letterSpacing: '0.1rem' }}>{role}</span>
        <span style={{ color: '#e6c473', fontSize: '0.82rem', marginTop: 2 }}>
          {lang === 'en' ? o.name.en : o.name.zh}
        </span>
        {o.status === 'dead' && (
          <span style={{ fontSize: '0.7rem', color: '#6b3a3a', marginTop: 1 }}>† {t('卒', 'dec.')}</span>
        )}
        {o.status === 'retired' && (
          <span style={{ fontSize: '0.7rem', color: '#7a8a5a', marginTop: 1 }}>{t('歸隱', 'retired')}</span>
        )}
      </div>
    );
  };

  const drillOfficer = drillId ? officers[drillId] : null;

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>{t('家系図', 'Family Tree')}</h3>
      <div style={{
        background: 'linear-gradient(180deg, rgba(212,168,74,0.04) 0%, transparent 100%)',
        padding: '0.6rem 0.4rem',
        border: '1px solid #2b3845',
      }}>
        {/* Parents */}
        {parents.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {parents.map((p) => node(p, '#88b7e8', t('父母', 'Parent')))}
          </div>
        )}
        {/* Vertical line if has parents */}
        {parents.length > 0 && (
          <div style={{ width: 2, height: 12, background: '#364654', margin: '2px auto' }} />
        )}
        {/* Self + spouses + siblings */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          {siblings.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {siblings.slice(0, 4).map((s) => node(s, '#c9a64e', t('兄弟', 'Sibling')))}
              {siblings.length > 4 && (
                <span style={{ color: '#7a8893', fontSize: '0.72rem', alignSelf: 'center', margin: '0 4px' }}>
                  +{siblings.length - 4}
                </span>
              )}
            </div>
          )}
          {/* Self */}
          <div
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              background: '#1e2832',
              border: '2px solid #e6c473',
              padding: '0.5rem 0.8rem',
              minWidth: 90,
              margin: 2,
              boxShadow: '0 0 12px rgba(212,168,74,0.4)',
            }}
          >
            <span style={{ color: '#e6c473', fontSize: '0.7rem', letterSpacing: '0.05rem' }}>
              {t('本人', 'Self')}
            </span>
            <span style={{ color: '#ffd47a', fontSize: '0.95rem', marginTop: 2, fontWeight: 600 }}>
              {(() => {
                const me = officers[officerId];
                return me ? (lang === 'en' ? me.name.en : me.name.zh) : officerId;
              })()}
            </span>
          </div>
          {spouses.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {spouses.map((s) => node(s, '#e8a8c8', t('配偶', 'Spouse')))}
            </div>
          )}
        </div>
        {/* Vertical line down to children */}
        {children.length > 0 && (
          <div style={{ width: 2, height: 12, background: '#364654', margin: '2px auto' }} />
        )}
        {/* Children */}
        {children.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {children.slice(0, 8).map((c) => node(c, '#7ed68a', t('子嗣', 'Child')))}
            {children.length > 8 && (
              <span style={{ color: '#7a8893', fontSize: '0.72rem', alignSelf: 'center', margin: '0 4px' }}>
                +{children.length - 8}
              </span>
            )}
          </div>
        )}
      </div>
      {drillOfficer && drillDown?.(drillOfficer, () => setDrillId(null))}
    </section>
  );
}

const CLAN_TIER_META: Record<'humble' | 'gentry' | 'great', { zh: string; en: string; color: string }> = {
  humble: { zh: '寒門', en: 'Humble', color: '#7a8893' },
  gentry: { zh: '士族', en: 'Gentry', color: '#cfd8e0' },
  great: { zh: '世家', en: 'Great House', color: '#e6c473' },
};

const HEIR_STAT_ROW: Array<{ key: keyof Officer['stats']; zh: string; en: string }> = [
  { key: 'leadership', zh: '統', en: 'LDR' },
  { key: 'war', zh: '武', en: 'WAR' },
  { key: 'intelligence', zh: '智', en: 'INT' },
  { key: 'politics', zh: '政', en: 'POL' },
  { key: 'charisma', zh: '魅', en: 'CHR' },
];

/** 家門與子嗣 — clan standing banner + pending-heir roster with upbringing /
 *  designation / adoption controls (for the player's own officers). §2.5. */
export function HeirsAndClanSection({ officerId }: { officerId: string }) {
  const officers = useGameStore((s) => s.officers);
  const pendingHeirs = useGameStore((s) => s.pendingHeirs);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const family = useGameStore((s) => s.family);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const assignTutorFn = useGameStore((s) => s.assignTutor);
  const designateHeirFn = useGameStore((s) => s.designateHeir);
  const adoptHeirFn = useGameStore((s) => s.adoptHeir);
  const t = useT();
  const lang = useLanguage();
  const [adoptId, setAdoptId] = useState('');

  const officer = officers[officerId];
  if (!officer) return null;
  const isMine = officer.forceId === playerForceId;
  const clanId = clanOf(officer);
  const standing = clanId ? clanStandings[clanId] : undefined;
  const heirs = pendingHeirs.filter((h) => h.parentAId === officerId || h.parentBId === officerId);
  // Grown children (activated officers) of this officer, for heir designation.
  const grownChildren = family
    .filter((r) => r.kind === 'parent-child' && (r.officerA === officerId || r.officerB === officerId))
    .map((r) => (r.officerA === officerId ? r.officerB : r.officerA))
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o && o.status !== 'dead');

  if (!standing && heirs.length === 0 && grownChildren.length === 0) return null;

  const tierMeta = standing ? CLAN_TIER_META[standing.tier] : null;
  // Living officers in the player's force — tutor / adoption candidates.
  const playerOfficers = isMine
    ? Object.values(officers).filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched')
    : [];

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>{t('家門與子嗣', 'House & Heirs')}</h3>

      {standing && tierMeta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          background: 'linear-gradient(180deg, rgba(212,168,74,0.05) 0%, transparent 100%)',
          border: '1px solid #2b3845', padding: '0.5rem 0.6rem', marginBottom: heirs.length > 0 ? '0.5rem' : 0,
        }}>
          <span style={{ color: '#ffd47a', fontSize: '0.95rem', fontWeight: 600 }}>
            {lang === 'en' ? (standing.nameEn ?? standing.nameZh) : standing.nameZh}
          </span>
          <span style={{
            color: tierMeta.color, border: `1px solid ${tierMeta.color}`,
            fontSize: '0.66rem', padding: '0.05rem 0.35rem', letterSpacing: '0.06rem',
          }}>{lang === 'en' ? tierMeta.en : tierMeta.zh}</span>
          <span style={{ color: '#9fb0bf', fontSize: '0.74rem' }}>
            {t('聲望', 'Prestige')} {standing.prestige}
            {standing.peakPrestige && standing.peakPrestige > standing.prestige
              ? `（${t('巔峰', 'peak')} ${standing.peakPrestige}）` : ''}
          </span>
        </div>
      )}

      {heirs.map((h) => {
        const age = year - h.birthYear;
        const toCome = Math.max(0, 14 - age);
        const projected = HEIR_STAT_ROW.map(({ key }) => h.baseStats[key] + (h.upbringing?.statBias[key] ?? 0));
        const tutor = h.tutorId ? officers[h.tutorId] : undefined;
        return (
          <div key={h.id} style={{ border: '1px solid #2b3845', padding: '0.5rem 0.6rem', marginBottom: '0.4rem', background: '#10161e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#e6c473', fontSize: '0.85rem' }}>
                {lang === 'en' ? h.name.en : h.name.zh}
              </span>
              <span style={{ color: h.female ? '#e8a8c8' : '#88b7e8', fontSize: '0.66rem' }}>
                {h.female ? t('女', 'F') : t('男', 'M')}
              </span>
              <span style={{ color: '#9fb0bf', fontSize: '0.72rem' }}>
                {age}{t('歲', 'y')} · {toCome > 0 ? t(`${toCome}年後及冠`, `${toCome}y to age`) : t('將及冠', 'coming of age')}
              </span>
              {h.upbringing?.prodigyRevealed && (
                <span style={{ color: '#ffce4a', border: '1px solid #ffce4a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('神童', 'Prodigy')}</span>
              )}
              {h.designatedHeir && (
                <span style={{ color: '#7ed68a', border: '1px solid #7ed68a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('世子', 'Heir')}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              {HEIR_STAT_ROW.map((s, i) => (
                <span key={s.key} style={{ color: '#cfd8e0', fontSize: '0.72rem' }}>
                  <span style={{ color: '#7a8893' }}>{lang === 'en' ? s.en : s.zh}</span> {projected[i]}
                </span>
              ))}
            </div>

            {h.traits && h.traits.length > 0 && (
              <div style={{ marginTop: '0.3rem', color: '#b69bd0', fontSize: '0.72rem' }}>
                {h.traits.map((tid) => TRAIT_DEFS_BY_ID[tid]).filter(Boolean).map((tr) => lang === 'en' ? tr.name.en : tr.name.zh).join('、')}
              </div>
            )}

            <div style={{ marginTop: '0.3rem', color: '#9fb0bf', fontSize: '0.72rem' }}>
              {t('西席', 'Tutor')}：{tutor ? (lang === 'en' ? tutor.name.en : tutor.name.zh) : t('（無）', '(none)')}
            </div>

            {isMine && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={h.tutorId ?? ''}
                  onChange={(e) => assignTutorFn(h.id, e.target.value || null)}
                  style={{ background: '#0c1218', color: '#cfd8e0', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.25rem', maxWidth: 160 }}
                >
                  <option value="">{t('指派西席…', 'Assign tutor…')}</option>
                  {playerOfficers.map((o) => (
                    <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>
                  ))}
                </select>
                {!h.designatedHeir && (
                  <button
                    onClick={() => designateHeirFn(h.id)}
                    style={{ background: '#1b2531', color: '#7ed68a', border: '1px solid #2b5a3a', fontSize: '0.72rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                  >{t('立為世子', 'Designate heir')}</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {grownChildren.length > 0 && (
        <div style={{ marginTop: '0.3rem' }}>
          <div style={{ color: '#7a8893', fontSize: '0.68rem', marginBottom: '0.2rem' }}>{t('成年子嗣', 'Grown children')}</div>
          {grownChildren.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span style={{ color: '#7ed68a', fontSize: '0.78rem' }}>{lang === 'en' ? c.name.en : c.name.zh}</span>
              {c.designatedHeir && (
                <span style={{ color: '#7ed68a', border: '1px solid #7ed68a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('世子', 'Heir')}</span>
              )}
              {isMine && !c.designatedHeir && (
                <button
                  onClick={() => designateHeirFn(c.id)}
                  style={{ background: '#1b2531', color: '#7ed68a', border: '1px solid #2b5a3a', fontSize: '0.7rem', padding: '0.1rem 0.45rem', cursor: 'pointer' }}
                >{t('立為世子', 'Designate heir')}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {isMine && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#7a8893', fontSize: '0.72rem' }}>{t('收養', 'Adopt')}</span>
          <select
            value={adoptId}
            onChange={(e) => setAdoptId(e.target.value)}
            style={{ background: '#0c1218', color: '#cfd8e0', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.25rem', maxWidth: 160 }}
          >
            <option value="">{t('選擇武將…', 'Choose officer…')}</option>
            {playerOfficers.filter((o) => o.id !== officerId).map((o) => (
              <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>
            ))}
          </select>
          <button
            disabled={!adoptId}
            onClick={() => { if (adoptId) { adoptHeirFn(adoptId, officerId); setAdoptId(''); } }}
            style={{ background: '#1b2531', color: adoptId ? '#e6c473' : '#566', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.5rem', cursor: adoptId ? 'pointer' : 'default' }}
          >{t('收為養子', 'Adopt')}</button>
        </div>
      )}
    </section>
  );
}

