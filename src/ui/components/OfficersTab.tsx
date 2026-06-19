import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import {
  deriveFormations, deriveTactics, derivePolicies,
} from '../../game/data/officerAttributes';
import { DYNASTY_DEFS, type Dynasty } from '../../game/data/dynasties';
import type { EntityId, Officer, OfficerStats } from '../../game/types';
import { OfficerDetail } from './OfficerDetail';
import { OfficerHoverCard } from './OfficerHoverCard';
import { useLanguage, pickName } from '../i18n';
import styles from './OfficersTab.module.css';

function topStatKey(s: OfficerStats): keyof OfficerStats {
  let key: keyof OfficerStats = 'leadership';
  let best = s.leadership;
  for (const k of ['war', 'intelligence', 'politics', 'charisma'] as const) {
    if (s[k] > best) { best = s[k]; key = k; }
  }
  return key;
}

interface Props {
  onClose: () => void;
}

type SortKey =
  | 'name'
  | 'total'
  | 'leadership'
  | 'war'
  | 'intelligence'
  | 'politics'
  | 'charisma'
  | 'age';

const SORT_LABEL: Record<SortKey, string> = {
  name:         'Name',
  total:        'Total',
  leadership:   'LED',
  war:          'WAR',
  intelligence: 'INT',
  politics:     'POL',
  charisma:     'CHA',
  age:          'Age',
};

type FilterKey = 'all' | 'mine' | 'free-agent' | 'captive' | 'elite' | string; // string = forceId

export function OfficersTab({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const lang = useLanguage();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const currentYear = useGameStore((s) => s.date.year);

  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [search, setSearch] = useState('');
  const [minStat, setMinStat] = useState<number>(0);
  const [statKey, setStatKey] = useState<keyof OfficerStats | 'any'>('any');
  // 'all' = no dynasty filter; 'three-kingdoms' = officers with no dynasty tag;
  // a Dynasty id = officers from that era.
  const [dynastyFilter, setDynastyFilter] = useState<'all' | 'three-kingdoms' | Dynasty>('all');
  // Dynasties present in the current officer pool — drives which chips render.
  const presentDynasties = useMemo(() => {
    const set = new Set<Dynasty>();
    for (const o of Object.values(officers)) if (o.dynasty) set.add(o.dynasty);
    return DYNASTY_DEFS.filter((d) => set.has(d.id));
  }, [officers]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const visibleOfficers = useMemo<Officer[]>(() => {
    let list = Object.values(officers).filter(
      (o) => o.status !== 'unsearched' && o.status !== 'dead',
    );

    if (filter === 'mine') {
      list = list.filter((o) => o.forceId === playerForceId);
    } else if (filter === 'free-agent') {
      list = list.filter((o) => o.forceId === null && o.status === 'idle');
    } else if (filter === 'captive') {
      list = list.filter((o) => o.status === 'imprisoned');
    } else if (filter === 'elite') {
      list = list.filter((o) =>
        Math.max(o.stats.leadership, o.stats.war, o.stats.intelligence, o.stats.politics, o.stats.charisma) >= 90,
      );
    } else if (filter !== 'all') {
      list = list.filter((o) => o.forceId === filter);
    }

    // Dynasty filter.
    if (dynastyFilter === 'three-kingdoms') {
      list = list.filter((o) => !o.dynasty);
    } else if (dynastyFilter !== 'all') {
      list = list.filter((o) => o.dynasty === dynastyFilter);
    }

    // Free-text search by name / courtesy name.
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.en.toLowerCase().includes(q) ||
          o.name.zh.includes(search) ||
          (o.courtesyName?.en.toLowerCase().includes(q) ?? false) ||
          (o.courtesyName?.zh.includes(search) ?? false),
      );
    }

    // Min-stat filter.
    if (minStat > 0) {
      list = list.filter((o) => {
        if (statKey === 'any') {
          return Math.max(
            o.stats.leadership, o.stats.war, o.stats.intelligence, o.stats.politics, o.stats.charisma,
          ) >= minStat;
        }
        return o.stats[statKey] >= minStat;
      });
    }

    const sumStats = (s: OfficerStats) =>
      s.leadership + s.war + s.intelligence + s.politics + s.charisma;

    const sum = (o: Officer) => sumStats(o.stats);
    const primary = (a: Officer, b: Officer): number => {
      if (sortKey === 'name') return b.name.en.localeCompare(a.name.en); // desc = Z→A
      if (sortKey === 'age') return b.birthYear - a.birthYear; // desc = youngest first
      if (sortKey === 'total') return sum(b) - sum(a);
      return b.stats[sortKey] - a.stats[sortKey];
    };
    // Tiebreaker: fall back to total stats so equal primary values sort by overall rank.
    const cmp = (a: Officer, b: Officer): number => primary(a, b) || sum(b) - sum(a);
    return [...list].sort((a, b) => (sortDir === 'desc' ? cmp(a, b) : -cmp(a, b)));
  }, [officers, filter, sortKey, sortDir, playerForceId, search, minStat, statKey, dynastyFilter]);

  const liveForces = useMemo(
    () =>
      Object.values(forces).filter((f) =>
        Object.values(cities).some((c) => c.ownerForceId === f.id),
      ),
    [forces, cities],
  );

  const totalKnown = Object.values(officers).filter(
    (o) => o.status !== 'unsearched' && o.status !== 'dead',
  ).length;
  const totalUnsearched = Object.values(officers).filter(
    (o) => o.status === 'unsearched',
  ).length;
  const totalDead = Object.values(officers).filter(
    (o) => o.status === 'dead',
  ).length;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{lang === 'en' ? 'Officers' : '武将'}</div>
            <div className={styles.titleEn}>
              Officers — {visibleOfficers.length} of {totalKnown} shown ·{' '}
              {totalUnsearched} hidden · {totalDead} fallen
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Filter</span>
            <button
              className={`${styles.chip} ${filter === 'all' ? styles.chipActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {playerForceId && (
              <button
                className={`${styles.chip} ${filter === 'mine' ? styles.chipActive : ''}`}
                onClick={() => setFilter('mine')}
              >
                Mine
              </button>
            )}
            <button
              className={`${styles.chip} ${filter === 'free-agent' ? styles.chipActive : ''}`}
              onClick={() => setFilter('free-agent')}
            >
              Free
            </button>
            <button
              className={`${styles.chip} ${filter === 'captive' ? styles.chipActive : ''}`}
              onClick={() => setFilter('captive')}
            >
              Captives
            </button>
            <button
              className={`${styles.chip} ${filter === 'elite' ? styles.chipActive : ''}`}
              onClick={() => setFilter('elite')}
              title="Officers with any stat ≥ 90"
            >
              ★ Elite
            </button>
            {liveForces
              .filter((f) => f.id !== playerForceId)
              .map((f) => (
                <button
                  key={f.id}
                  className={`${styles.chip} ${filter === f.id ? styles.chipActive : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  <span
                    className={styles.chipDot}
                    style={{ background: f.color }}
                  />
                  {f.name.zh}
                </button>
              ))}
          </div>

          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'en' ? 'Name / courtesy' : '姓名 / 字'}
              style={{
                background: '#10161e',
                border: '1px solid #2b3845',
                color: '#e6c473',
                padding: '0.3rem 0.5rem',
                fontFamily: 'inherit',
                flex: 1,
                maxWidth: 220,
              }}
            />
            <span className={styles.controlLabel} style={{ marginLeft: '0.5rem' }}>Min</span>
            <select
              value={statKey}
              onChange={(e) => setStatKey(e.target.value as keyof OfficerStats | 'any')}
              style={{
                background: '#10161e', border: '1px solid #2b3845', color: '#e6c473',
                padding: '0.3rem', fontFamily: 'inherit',
              }}
            >
              <option value="any">any</option>
              <option value="leadership">{lang === 'en' ? 'Leadership' : '統率'}</option>
              <option value="war">{lang === 'en' ? 'War' : '武力'}</option>
              <option value="intelligence">{lang === 'en' ? 'Intelligence' : '知力'}</option>
              <option value="politics">{lang === 'en' ? 'Politics' : '政治'}</option>
              <option value="charisma">{lang === 'en' ? 'Charisma' : '魅力'}</option>
            </select>
            <input
              type="number"
              min={0} max={150}
              value={minStat}
              onChange={(e) => setMinStat(Number(e.target.value) || 0)}
              style={{
                background: '#10161e', border: '1px solid #2b3845', color: '#e6c473',
                padding: '0.3rem', fontFamily: 'ui-monospace, monospace', width: 60,
              }}
            />
          </div>

          {presentDynasties.length > 0 && (
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>{lang === 'en' ? 'Dynasty' : '朝代'}</span>
              <button
                className={`${styles.chip} ${dynastyFilter === 'all' ? styles.chipActive : ''}`}
                onClick={() => setDynastyFilter('all')}
              >{lang === 'en' ? 'All' : '全部'}</button>
              <button
                className={`${styles.chip} ${dynastyFilter === 'three-kingdoms' ? styles.chipActive : ''}`}
                onClick={() => setDynastyFilter('three-kingdoms')}
              >{lang === 'en' ? 'Three Kingdoms' : '三國'}</button>
              {presentDynasties.map((d) => (
                <button
                  key={d.id}
                  className={`${styles.chip} ${dynastyFilter === d.id ? styles.chipActive : ''}`}
                  onClick={() => setDynastyFilter(d.id)}
                  title={d.era.zh}
                >
                  <span
                    className={styles.chipDot}
                    style={{ background: d.color }}
                  />
                  {d.name.zh}
                </button>
              ))}
            </div>
          )}

          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Sort</span>
            {(['name', 'total', 'leadership', 'war', 'intelligence', 'politics', 'charisma', 'age'] as SortKey[]).map((k) => (
              <button
                key={k}
                className={`${styles.chip} ${sortKey === k ? styles.chipActive : ''}`}
                onClick={() => handleSort(k)}
              >
                {SORT_LABEL[k]} {sortKey === k && (sortDir === 'desc' ? '↓' : '↑')}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.header2}>
          <span className={styles.h2name}>Officer</span>
          <span className={styles.h2force}>Force · Location</span>
          <SortHeader label="LED" col="leadership" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label="WAR" col="war" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label="INT" col="intelligence" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label="POL" col="politics" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label="CHA" col="charisma" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <span className={styles.h2meta} title="Tactics · Formations · Policies">{lang === 'en' ? 'T·F·P' : '戰·陣·政'}</span>
          <SortHeader label="Age · Loy" col="age" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
        </div>

        <ul className={styles.list}>
          {visibleOfficers.length === 0 ? (
            <li className={styles.empty}>No officers match this filter.</li>
          ) : (
            visibleOfficers.map((o) => (
              <OfficerRow
                key={o.id}
                officer={o}
                forceId={o.forceId}
                forceName={
                  o.forceId && forces[o.forceId]
                    ? pickName(forces[o.forceId]!.name, lang)
                    : o.status === 'imprisoned'
                      ? (lang === 'en' ? 'Captive' : '捕虜')
                      : (lang === 'en' ? 'Free agent' : '浪人')
                }
                forceColor={
                  o.forceId
                    ? forces[o.forceId]?.color ?? '#364654'
                    : '#364654'
                }
                locationName={
                  o.locationCityId && cities[o.locationCityId]
                    ? pickName(cities[o.locationCityId]!.name, lang)
                    : '—'
                }
                currentYear={currentYear}
                highlight={o.forceId === playerForceId}
                onClick={() => setSelectedOfficer(o)}
              />
            ))
          )}
        </ul>

        {selectedOfficer && (
          <OfficerDetail
            officer={selectedOfficer}
            onClose={() => setSelectedOfficer(null)}
          />
        )}
      </div>
    </div>
  );
}

interface RowProps {
  officer: Officer;
  forceId: EntityId | null;
  forceName: string;
  forceColor: string;
  locationName: string;
  currentYear: number;
  highlight: boolean;
  onClick: () => void;
}

function OfficerRow({
  officer: o,
  forceName,
  forceColor,
  locationName,
  currentYear,
  highlight,
  onClick,
}: RowProps) {
  const lang = useLanguage();
  const age = currentYear - o.birthYear;
  const task = o.task ? (lang === 'en' ? COMMAND_DEFS[o.task]?.label.en : COMMAND_DEFS[o.task]?.label.zh) : null;
  const top = topStatKey(o.stats);
  const tacticsCount = deriveTactics(o.stats, o.id).length;
  const formationsCount = deriveFormations(o.stats, o.id).length;
  const policiesCount = derivePolicies(o.stats, o.id).length;

  return (
    <li
      className={`${styles.row} ${highlight ? styles.rowMine : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <OfficerHoverCard officer={o}>
        <span className={styles.rowName}>
          {lang !== 'en' && <span className={styles.rowNameZh}>{o.name.zh}</span>}
          {lang !== 'zh' && <span className={styles.rowNameEn}>{o.name.en}</span>}
          {o.courtesyName && (
            <span className={styles.rowCourtesy}>
              ({pickName(o.courtesyName, lang)})
            </span>
          )}
        </span>
      </OfficerHoverCard>
      <span className={styles.rowForce}>
        <span
          className={styles.rowForceDot}
          style={{ background: forceColor }}
        />
        <span className={styles.rowForceText}>
          {forceName}
          <span className={styles.rowLocation}>· {locationName}</span>
          {task && <span className={styles.rowTask}> · {task}</span>}
          {o.status === 'imprisoned' && (
            <span className={styles.rowCaptive}> · 捕虜</span>
          )}
        </span>
      </span>
      <StatCell value={o.stats.leadership} top={top === 'leadership'} />
      <StatCell value={o.stats.war}        top={top === 'war'} />
      <StatCell value={o.stats.intelligence} top={top === 'intelligence'} />
      <StatCell value={o.stats.politics}    top={top === 'politics'} />
      <StatCell value={o.stats.charisma}    top={top === 'charisma'} />
      <KitCell tactics={tacticsCount} formations={formationsCount} policies={policiesCount} />
      <span className={styles.rowMeta}>
        <span className={styles.rowAge}>{age}</span>
        <span className={styles.rowLoyalty}>{o.loyalty}</span>
      </span>
    </li>
  );
}

function StatCell({ value, top = false }: { value: number; top?: boolean }) {
  const tone =
    value >= 90 ? styles.statEpic
    : value >= 80 ? styles.statHigh
    : value >= 60 ? styles.statMid
    : styles.statLow;
  return <span className={`${styles.statCell} ${tone} ${top ? styles.statTop : ''}`}>{value}</span>;
}

function KitCell({ tactics, formations, policies }: { tactics: number; formations: number; policies: number }) {
  const cls = (n: number) => n >= 6 ? styles.kitCountStrong : n >= 3 ? styles.kitCount : '';
  return (
    <span className={styles.kitCell} title={`${tactics} tactics · ${formations} formations · ${policies} policies`}>
      <span className={cls(tactics)}>{tactics}</span>·<span className={cls(formations)}>{formations}</span>·<span className={cls(policies)}>{policies}</span>
    </span>
  );
}

interface SortHeaderProps {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: 'desc' | 'asc';
  onClick: (col: SortKey) => void;
}

function SortHeader({ label, col, sortKey, sortDir, onClick }: SortHeaderProps) {
  const active = sortKey === col;
  return (
    <button
      className={`${styles.sortHeader} ${active ? styles.sortHeaderActive : ''}`}
      onClick={() => onClick(col)}
    >
      <span>{label}</span>
      <span className={styles.sortArrow}>
        {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
      </span>
    </button>
  );
}
