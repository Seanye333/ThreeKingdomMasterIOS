import { useMemo, useState } from 'react';
import { SKILLS } from '../../game/data';
import type {
  EntityId,
  OfficerStats,
  Scenario,
} from '../../game/types';
import styles from './CustomOfficerCreator.module.css';
import { useDesc, useLanguage } from '../i18n';

interface Props {
  scenario: Scenario;
  onClose: () => void;
  onCreate: (custom: CustomOfficer) => void;
}

export interface CustomOfficer {
  id: string;
  zhName: string;
  enName: string;
  courtesyZh: string;
  courtesyEn: string;
  stats: OfficerStats;
  skills: string[];
  /** Force ID to join, or null to start as a wandering free agent. */
  affiliationForceId: EntityId | null;
}

const STAT_BUDGET = 360;
const STAT_MIN = 30;
const STAT_MAX = 150;
const MAX_SKILLS = 3;

export function CustomOfficerCreator({ scenario, onClose, onCreate }: Props) {
  const desc = useDesc();
  const lang = useLanguage();
  const [zhName, setZhName] = useState('我君');
  const [enName, setEnName] = useState('Wo Jun');
  const [courtesyZh, setCourtesyZh] = useState('');
  const [courtesyEn, setCourtesyEn] = useState('');
  const [stats, setStats] = useState<OfficerStats>({
    leadership: 70,
    war: 70,
    intelligence: 70,
    politics: 70,
    charisma: 70,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [affId, setAffId] = useState<EntityId | null>(null);

  const totalStats = useMemo(
    () => Object.values(stats).reduce((s, v) => s + v, 0),
    [stats],
  );

  const overBudget = totalStats > STAT_BUDGET;
  const remaining = STAT_BUDGET - totalStats;

  const setStat = (key: keyof OfficerStats, val: number) =>
    setStats((s) => ({ ...s, [key]: Math.max(STAT_MIN, Math.min(STAT_MAX, val)) }));

  const toggleSkill = (id: string) => {
    setSkills((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_SKILLS) return cur;
      return [...cur, id];
    });
  };

  const canStart =
    zhName.trim().length > 0 &&
    enName.trim().length > 0 &&
    !overBudget;

  const submit = () => {
    if (!canStart) return;
    onCreate({
      id: `custom-${Date.now()}`,
      zhName: zhName.trim(),
      enName: enName.trim(),
      courtesyZh: courtesyZh.trim(),
      courtesyEn: courtesyEn.trim(),
      stats,
      skills,
      affiliationForceId: affId,
    });
  };

  const labels: Array<[keyof OfficerStats, string, string]> = [
    ['leadership', '統率', 'Leadership'],
    ['war', '武力', 'War'],
    ['intelligence', '知力', 'Intelligence'],
    ['politics', '政治', 'Politics'],
    ['charisma', '魅力', 'Charisma'],
  ];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>自定義武將$</div>
            <div className={styles.titleEn}>Create Your Officer</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.row}>
            <span className={styles.label}>名 Name (zh)</span>
            <input
              className={styles.input}
              value={zhName}
              onChange={(e) => setZhName(e.target.value)}
              maxLength={4}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Name (en)</span>
            <input
              className={styles.input}
              value={enName}
              onChange={(e) => setEnName(e.target.value)}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>字 Courtesy (zh)</span>
            <input
              className={styles.input}
              value={courtesyZh}
              onChange={(e) => setCourtesyZh(e.target.value)}
              maxLength={4}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Courtesy (en)</span>
            <input
              className={styles.input}
              value={courtesyEn}
              onChange={(e) => setCourtesyEn(e.target.value)}
            />
          </div>

          <div>
            <div className={styles.statBudget + (overBudget ? ' ' + styles.budgetWarn : '')}>
              Stat budget: {totalStats} / {STAT_BUDGET}
              {overBudget && ' — over by ' + Math.abs(remaining) + '!'}
              {!overBudget && remaining > 0 && ' — ' + remaining + ' remaining'}
            </div>
            {labels.map(([key, zh, en]) => (
              <div key={key} className={styles.statRow}>
                <span className={styles.statName}>{zh} {en}</span>
                <input
                  type="range"
                  className={styles.statRange}
                  min={STAT_MIN}
                  max={STAT_MAX}
                  value={stats[key]}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                />
                <span className={styles.statValue}>{stats[key]}</span>
                <button
                  className={styles.skillChip}
                  onClick={() => setStat(key, stats[key] - 5)}
                >−5</button>
                <button
                  className={styles.skillChip}
                  onClick={() => setStat(key, stats[key] + 5)}
                >+5</button>
              </div>
            ))}
          </div>

          <div className={styles.skillsRow}>
            <span className={styles.label}>Skills ({skills.length}/{MAX_SKILLS})</span>
            <div>
              <div className={styles.skillGrid}>
                {SKILLS.map((s) => (
                  <button
                    key={s.id}
                    className={`${styles.skillChip} ${skills.includes(s.id) ? styles.skillChipActive : ''}`}
                    onClick={() => toggleSkill(s.id)}
                    title={desc(s)}
                  >
                    {lang === 'en' ? s.name.en : s.name.zh}{lang === 'both' ? ` ${s.name.en}` : ''}
                  </button>
                ))}
              </div>
              <div className={styles.skillCapWarn}>
                Up to {MAX_SKILLS} skills. Hover for descriptions.
              </div>
            </div>
          </div>

          <div className={styles.affiliationRow}>
            <span className={styles.label}>Force 君主</span>
            <div className={styles.affChips}>
              <button
                className={`${styles.affChip} ${styles.affChipFA} ${affId === null ? styles.affChipActive : ''}`}
                onClick={() => setAffId(null)}
              >
                浪人 Free Agent (start in random city)
              </button>
              {scenario.forces.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.affChip} ${affId === f.id ? styles.affChipActive : ''}`}
                  onClick={() => setAffId(f.id)}
                >
                  <span className={styles.dot} style={{ background: f.color }} />
                  {f.name.zh} {f.name.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div style={{ fontSize: '0.8rem', color: '#8a7050' }}>
            {affId === null
              ? 'Your officer will start unattached. Recruit yourself once the scenario begins.'
              : 'You will play as your force from the start.'}
          </div>
          <button className={styles.startBtn} onClick={submit} disabled={!canStart}>
            出陣 Begin
          </button>
        </div>
      </div>
    </div>
  );
}
