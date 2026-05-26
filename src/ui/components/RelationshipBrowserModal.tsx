import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { OFFICER_RELATIONSHIPS } from '../../game/data/relationships';
import { FAMILY_LINEAGE } from '../../game/data/familyLineage';
import { useT, useLanguage } from '../i18n';
import { OfficerDetail } from './OfficerDetail';
import type { Officer } from '../../game/types';

/**
 * R7 — Full relationship browser. Lists every officer who has at least
 * one relationship/family tie, with filters by category, search, and
 * jump-to-officer-detail. Triggered from the title screen / map screen.
 */

const KIND_META: Record<string, { zh: string; en: string; color: string }> = {
  spouse:          { zh: '配偶',     en: 'Spouse',          color: '#e8a8c8' },
  'parent-child':  { zh: '父子',     en: 'Parent / Child',  color: '#88b7e8' },
  sibling:         { zh: '兄弟',     en: 'Sibling',         color: '#c19a3b' },
  'sworn-brothers':{ zh: '義兄弟',   en: 'Sworn Brothers',  color: '#d4a84a' },
  rival:           { zh: '宿敵',     en: 'Rival',           color: '#b8442e' },
  'mentor-student':{ zh: '師徒',     en: 'Mentor/Student',  color: '#3a7dd9' },
  'master-servant':{ zh: '主從',     en: 'Master/Servant',  color: '#c19a3b' },
  romantic:        { zh: '戀人',     en: 'Romantic',        color: '#c178c7' },
  enemy:           { zh: '私仇',     en: 'Personal Enemy',  color: '#5a2025' },
};

interface Props {
  onClose: () => void;
  officersOverride?: Record<string, Officer>;
}

export function RelationshipBrowserModal({ onClose, officersOverride }: Props) {
  const storeOfficers = useGameStore((s) => s.officers);
  const officers = officersOverride ?? storeOfficers;
  const family = useGameStore((s) => s.family);
  const t = useT();
  const lang = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  // Aggregate every (kind, a, b, note) into a flat list
  const allEntries = useMemo(() => {
    const out: Array<{
      a: string; b: string; kind: string; noteZh: string; noteEn: string;
    }> = [];
    for (const r of OFFICER_RELATIONSHIPS) {
      out.push({ a: r.a, b: r.b, kind: r.kind, noteZh: r.note.zh, noteEn: r.note.en });
    }
    // Family entries — combine static FAMILY_LINEAGE with runtime
    const familyPool = new Map<string, typeof family[number]>();
    for (const f of [...FAMILY_LINEAGE, ...family]) {
      familyPool.set(`${f.officerA}|${f.officerB}|${f.kind}`, f);
    }
    for (const f of familyPool.values()) {
      const note = (() => {
        if (f.kind === 'spouse') return { zh: '結髮夫妻', en: 'Spouses' };
        if (f.kind === 'parent-child') return { zh: '父母與子', en: 'Parent and child' };
        return { zh: '兄弟姊妹', en: 'Siblings' };
      })();
      out.push({ a: f.officerA, b: f.officerB, kind: f.kind, noteZh: note.zh, noteEn: note.en });
    }
    return out;
  }, [family]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (filter !== 'all' && e.kind !== filter) return false;
      if (!q) return true;
      const aName = officers[e.a];
      const bName = officers[e.b];
      const haystack = `${aName?.name.zh ?? ''} ${aName?.name.en ?? ''} ${bName?.name.zh ?? ''} ${bName?.name.en ?? ''} ${e.noteZh} ${e.noteEn}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allEntries, filter, search, officers]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allEntries.length };
    for (const e of allEntries) c[e.kind] = (c[e.kind] ?? 0) + 1;
    return c;
  }, [allEntries]);

  const FILTERS: { key: string; zh: string; en: string }[] = [
    { key: 'all',             zh: '全部',     en: 'All' },
    { key: 'parent-child',    zh: '父母 / 子嗣', en: 'Family' },
    { key: 'sibling',         zh: '兄弟',     en: 'Siblings' },
    { key: 'spouse',          zh: '配偶',     en: 'Spouses' },
    { key: 'sworn-brothers',  zh: '義兄弟',   en: 'Sworn Brothers' },
    { key: 'master-servant',  zh: '主從',     en: 'Master / Servant' },
    { key: 'mentor-student',  zh: '師徒',     en: 'Mentor / Student' },
    { key: 'rival',           zh: '宿敵',     en: 'Rivals' },
    { key: 'enemy',           zh: '私仇',     en: 'Enemies' },
    { key: 'romantic',        zh: '戀人',     en: 'Romantic' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 320,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'grid', placeItems: 'center',
        padding: '0.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1f1610', border: '1px solid #d4a84a',
          width: 'min(1100px, 96vw)', maxHeight: '94vh',
          display: 'flex', flexDirection: 'column',
          color: '#c0a878', fontFamily: 'Songti SC, serif',
        }}
      >
        {/* Header */}
        <header style={{
          padding: '0.8rem 1.1rem',
          borderBottom: '1px solid #4a3520',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#d4a84a', fontSize: '1.3rem', letterSpacing: '0.4rem' }}>
              {t('人物關係圖', 'Relationship Browser')}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#8a7050', letterSpacing: '0.1rem' }}>
              {filtered.length} / {allEntries.length} {t('條因緣', 'entries')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#d4a84a',
            fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
          }}>×</button>
        </header>

        {/* Filter chips + search */}
        <div style={{
          padding: '0.6rem 1.1rem',
          borderBottom: '1px solid #4a3520',
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center',
        }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const meta = KIND_META[f.key];
            const color = meta?.color ?? '#d4a84a';
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  background: active ? `${color}20` : 'transparent',
                  border: `1px solid ${active ? color : '#4a3520'}`,
                  color: active ? color : '#8a7050',
                  padding: '0.25rem 0.55rem',
                  fontFamily: 'inherit', fontSize: '0.72rem',
                  letterSpacing: '0.1rem', cursor: 'pointer',
                }}
              >
                {lang === 'en' ? f.en : f.zh}
                {counts[f.key] !== undefined && (
                  <span style={{ marginLeft: 4, opacity: 0.6 }}>({counts[f.key]})</span>
                )}
              </button>
            );
          })}
          <input
            type="text"
            placeholder={t('搜尋武將或事件...', 'Search officer or event...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              marginLeft: 'auto',
              background: '#1a1410',
              border: '1px solid #5a4530',
              color: '#c0a878',
              padding: '0.3rem 0.5rem',
              fontFamily: 'inherit',
              fontSize: '0.78rem',
              minWidth: 200,
            }}
          />
        </div>

        {/* Entries list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.6rem 1.1rem',
        }}>
          {filtered.length === 0 ? (
            <div style={{ color: '#8a7050', fontStyle: 'italic', padding: '2rem 0', textAlign: 'center' }}>
              {t('無符合條件的因緣。', 'No matching relationships.')}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.4rem' }}>
              {filtered.slice(0, 500).map((e, i) => {
                const oa = officers[e.a];
                const ob = officers[e.b];
                const meta = KIND_META[e.kind];
                const noClick = !oa || !ob;
                return (
                  <div
                    key={`${e.a}-${e.b}-${e.kind}-${i}`}
                    onClick={() => {
                      if (oa) setSelectedOfficer(oa);
                    }}
                    style={{
                      background: '#1a1410',
                      borderLeft: `3px solid ${meta?.color ?? '#5a4530'}`,
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.78rem',
                      cursor: noClick ? 'default' : 'pointer',
                      opacity: noClick ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#d4a84a' }}>
                        {oa ? (lang === 'en' ? oa.name.en : oa.name.zh) : e.a}
                        <span style={{ margin: '0 0.4rem', color: meta?.color ?? '#8a7050', fontSize: '0.7rem' }}>
                          {lang === 'en' ? '⇄' : '⇄'}
                        </span>
                        <span
                          onClick={(ev) => {
                            ev.stopPropagation();
                            if (ob) setSelectedOfficer(ob);
                          }}
                          style={{ cursor: ob ? 'pointer' : 'default' }}
                        >
                          {ob ? (lang === 'en' ? ob.name.en : ob.name.zh) : e.b}
                        </span>
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        letterSpacing: '0.15rem',
                        color: meta?.color ?? '#8a7050',
                      }}>
                        {meta ? (lang === 'en' ? meta.en : meta.zh) : e.kind}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#c0a878', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      {lang === 'en' ? e.noteEn : e.noteZh}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length > 500 && (
            <div style={{ color: '#8a7050', fontSize: '0.7rem', textAlign: 'center', padding: '0.5rem' }}>
              {t(`再 ${filtered.length - 500} 條未顯示 — 縮小篩選範圍。`, `${filtered.length - 500} more not shown — narrow the filter.`)}
            </div>
          )}
        </div>

        {selectedOfficer && (
          <OfficerDetail
            officer={selectedOfficer}
            onClose={() => setSelectedOfficer(null)}
            officersOverride={officersOverride}
          />
        )}
      </div>
    </div>
  );
}
