import { useMemo, useState } from 'react';
import type { Officer, OfficerStats, Scenario } from '../../game/types';
import {
  deriveFormations, deriveTactics, derivePolicies,
} from '../../game/data/officerAttributes';
import { OfficerDetail } from './OfficerDetail';
import styles from './OfficersTab.module.css';
import { useT, useLanguage } from '../i18n';

function topStatKey(s: OfficerStats): keyof OfficerStats {
  let key: keyof OfficerStats = 'leadership';
  let best = s.leadership;
  for (const k of ['war', 'intelligence', 'politics', 'charisma'] as const) {
    if (s[k] > best) { best = s[k]; key = k; }
  }
  return key;
}

interface Props {
  scenario: Scenario;
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

const SORT_LABEL_ZH: Record<SortKey, string> = {
  name:         '姓名',
  total:        '總計',
  leadership:   '統率',
  war:          '武力',
  intelligence: '知力',
  politics:     '政治',
  charisma:     '魅力',
  age:          '年齡',
};
const SORT_LABEL_EN: Record<SortKey, string> = {
  name:         'Name',
  total:        'Total',
  leadership:   'LED',
  war:          'WAR',
  intelligence: 'INT',
  politics:     'POL',
  charisma:     'CHA',
  age:          'Age',
};

type FilterKey = 'all' | 'unsearched' | 'free-agent' | 'elite' | string; // string = forceId

export function ScenarioOfficersBrowser({ scenario, onClose }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [search, setSearch] = useState('');
  const [minStat, setMinStat] = useState<number>(0);
  const [statKey, setStatKey] = useState<keyof OfficerStats | 'any'>('any');
  const t = useT();
  const lang = useLanguage();
  const SORT_LABEL = lang === 'en' ? SORT_LABEL_EN : SORT_LABEL_ZH;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const visibleOfficers = useMemo<Officer[]>(() => {
    let list = scenario.officers.filter((o) => o.status !== 'dead');

    if (filter === 'unsearched') {
      list = list.filter((o) => o.status === 'unsearched');
    } else if (filter === 'free-agent') {
      list = list.filter((o) => o.forceId === null && o.status === 'idle');
    } else if (filter === 'elite') {
      list = list.filter((o) =>
        Math.max(o.stats.leadership, o.stats.war, o.stats.intelligence, o.stats.politics, o.stats.charisma) >= 90,
      );
    } else if (filter !== 'all') {
      list = list.filter((o) => o.forceId === filter);
    }

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
    const cmp = (a: Officer, b: Officer): number => primary(a, b) || sum(b) - sum(a);
    return [...list].sort((a, b) => (sortDir === 'desc' ? cmp(a, b) : -cmp(a, b)));
  }, [scenario, filter, sortKey, sortDir, search, minStat, statKey]);

  const forcesById = useMemo(
    () => Object.fromEntries(scenario.forces.map((f) => [f.id, f])),
    [scenario],
  );
  const citiesById = useMemo(
    () => Object.fromEntries(scenario.cities.map((c) => [c.id, c])),
    [scenario],
  );

  const total = scenario.officers.filter((o) => o.status !== 'dead').length;
  const unsearched = scenario.officers.filter(
    (o) => o.status === 'unsearched',
  ).length;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('武將一覽', 'Officers')}</div>
            <div className={styles.titleEn}>
              {lang === 'en' ? scenario.name.en : scenario.name.zh} ({scenario.startDate.year} AD) ·{' '}
              {t(`顯示 ${visibleOfficers.length} / ${total}`, `${visibleOfficers.length} of ${total} shown`)} · {t(`隱藏 ${unsearched}`, `${unsearched} hidden`)}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>{t('篩選', 'Filter')}</span>
            <button
              className={`${styles.chip} ${filter === 'all' ? styles.chipActive : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('全部', 'All')} ({total})
            </button>
            <button
              className={`${styles.chip} ${filter === 'unsearched' ? styles.chipActive : ''}`}
              onClick={() => setFilter('unsearched')}
            >
              {t('未發現', 'Unsearched')} ({unsearched})
            </button>
            <button
              className={`${styles.chip} ${filter === 'free-agent' ? styles.chipActive : ''}`}
              onClick={() => setFilter('free-agent')}
            >
              {t('在野', 'Free')}
            </button>
            <button
              className={`${styles.chip} ${filter === 'elite' ? styles.chipActive : ''}`}
              onClick={() => setFilter('elite')}
              title={t('任一能力 ≥ 90 的武將', 'Officers with any stat ≥ 90')}
            >
              ★ {t('精英', 'Elite')}
            </button>
            {scenario.forces.map((f) => (
              <button
                key={f.id}
                className={`${styles.chip} ${filter === f.id ? styles.chipActive : ''}`}
                onClick={() => setFilter(f.id)}
              >
                <span
                  className={styles.chipDot}
                  style={{ background: f.color }}
                />
                {lang === 'en' ? f.name.en : f.name.zh}
              </button>
            ))}
          </div>

          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>{t('搜尋', 'Search')}</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('姓名 / 名 / 字', 'Name / 名 / courtesy')}
              style={{
                background: '#1a1410', border: '1px solid #4a3520', color: '#d4a84a',
                padding: '0.3rem 0.5rem', fontFamily: 'inherit', flex: 1, maxWidth: 220,
              }}
            />
            <span className={styles.controlLabel} style={{ marginLeft: '0.5rem' }}>{t('下限', 'Min')}</span>
            <select
              value={statKey}
              onChange={(e) => setStatKey(e.target.value as keyof OfficerStats | 'any')}
              style={{
                background: '#1a1410', border: '1px solid #4a3520', color: '#d4a84a',
                padding: '0.3rem', fontFamily: 'inherit',
              }}
            >
              <option value="any">{t('任一', 'any')}</option>
              <option value="leadership">統率</option>
              <option value="war">武力</option>
              <option value="intelligence">知力</option>
              <option value="politics">政治</option>
              <option value="charisma">魅力</option>
            </select>
            <input
              type="number"
              min={0} max={150}
              value={minStat}
              onChange={(e) => setMinStat(Number(e.target.value) || 0)}
              style={{
                background: '#1a1410', border: '1px solid #4a3520', color: '#d4a84a',
                padding: '0.3rem', fontFamily: 'ui-monospace, monospace', width: 60,
              }}
            />
          </div>

          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>{t('排序', 'Sort')}</span>
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
          <span className={styles.h2name}>{t('武將', 'Officer')}</span>
          <span className={styles.h2force}>{t('勢力 · 居所', 'Force · Location')}</span>
          <SortHeader label={SORT_LABEL.leadership}   col="leadership"   sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label={SORT_LABEL.war}          col="war"          sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label={SORT_LABEL.intelligence} col="intelligence" sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label={SORT_LABEL.politics}     col="politics"     sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <SortHeader label={SORT_LABEL.charisma}     col="charisma"     sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
          <span className={styles.h2meta} title={t('戰法 · 陣形 · 政策', 'Tactics · Formations · Policies')}>戰·陣·政</span>
          <SortHeader label={SORT_LABEL.age}          col="age"          sortKey={sortKey} sortDir={sortDir} onClick={handleSort} />
        </div>

        <ul className={styles.list}>
          {visibleOfficers.length === 0 ? (
            <li className={styles.empty}>{t('沒有符合條件的武將。', 'No officers match this filter.')}</li>
          ) : (
            visibleOfficers.map((o) => {
              const force = o.forceId ? forcesById[o.forceId] : null;
              const city = o.locationCityId ? citiesById[o.locationCityId] : null;
              const age = scenario.startDate.year - o.birthYear;
              const top = topStatKey(o.stats);
              const tCount = deriveTactics(o.stats, o.id).length;
              const fCount = deriveFormations(o.stats, o.id).length;
              const pCount = derivePolicies(o.stats, o.id).length;
              return (
                <li
                  key={o.id}
                  className={styles.row}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedOfficer(o)}
                >
                  <span className={styles.rowName}>
                    {lang !== 'en' && <span className={styles.rowNameZh}>{o.name.zh}</span>}
                    {lang !== 'zh' && <span className={styles.rowNameEn}>{o.name.en}</span>}
                  </span>
                  <span className={styles.rowForce}>
                    <span
                      className={styles.rowForceDot}
                      style={{ background: force?.color ?? '#5a4530' }}
                    />
                    <span className={styles.rowForceText}>
                      {force ? (lang === 'en' ? force.name.en : force.name.zh) : (o.status === 'unsearched' ? t('未發現', 'unsearched') : t('在野', 'free agent'))}
                      {city && (
                        <span className={styles.rowLocation}>
                          · {lang === 'en' ? city.name.en : city.name.zh}
                        </span>
                      )}
                    </span>
                  </span>
                  <StatCell value={o.stats.leadership}    top={top === 'leadership'} />
                  <StatCell value={o.stats.war}           top={top === 'war'} />
                  <StatCell value={o.stats.intelligence}  top={top === 'intelligence'} />
                  <StatCell value={o.stats.politics}      top={top === 'politics'} />
                  <StatCell value={o.stats.charisma}      top={top === 'charisma'} />
                  <span className={styles.kitCell} title={`${tCount} tactics · ${fCount} formations · ${pCount} policies`}>
                    <span className={tCount >= 6 ? styles.kitCountStrong : tCount >= 3 ? styles.kitCount : ''}>{tCount}</span>
                    ·
                    <span className={fCount >= 6 ? styles.kitCountStrong : fCount >= 3 ? styles.kitCount : ''}>{fCount}</span>
                    ·
                    <span className={pCount >= 6 ? styles.kitCountStrong : pCount >= 3 ? styles.kitCount : ''}>{pCount}</span>
                  </span>
                  <span className={styles.rowMeta}>
                    <span className={styles.rowAge}>{age}</span>
                  </span>
                </li>
              );
            })
          )}
        </ul>

        {selectedOfficer && (
          <OfficerDetail
            officer={selectedOfficer}
            onClose={() => setSelectedOfficer(null)}
            forcesOverride={forcesById}
            citiesOverride={citiesById}
            yearOverride={scenario.startDate.year}
          />
        )}
      </div>
    </div>
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
