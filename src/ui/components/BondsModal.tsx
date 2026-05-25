import { useMemo, useState } from 'react';
import { OATH_BONDS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Officer } from '../../game/types';
import { OfficerDetail } from './OfficerDetail';
import styles from './BondsModal.module.css';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

type BondStatus = 'active' | 'dormant' | 'broken';

interface BondRow {
  officerA: Officer | null;
  officerB: Officer | null;
  floor: number;
  kind: string;
  label: string;
  status: BondStatus;
}

export function BondsModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const runtimeBonds = useGameStore((s) => s.runtimeBonds);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const t = useT();

  const rows = useMemo<BondRow[]>(() => {
    return [...OATH_BONDS, ...runtimeBonds].map((bond) => {
      const a = officers[bond.officerA] ?? null;
      const b = officers[bond.officerB] ?? null;
      let status: BondStatus;
      if (!a || !b || a.status === 'dead' || b.status === 'dead') {
        status = 'broken';
      } else if (a.forceId && a.forceId === b.forceId) {
        status = 'active';
      } else {
        status = 'dormant';
      }
      return { officerA: a, officerB: b, floor: bond.floor, kind: bond.kind, label: bond.label, status };
    });
  }, [officers, runtimeBonds]);

  const grouped: Record<BondStatus, BondRow[]> = {
    active: rows.filter((r) => r.status === 'active'),
    dormant: rows.filter((r) => r.status === 'dormant'),
    broken: rows.filter((r) => r.status === 'broken'),
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('絆', 'Bonds')}</div>
            <div className={styles.titleEn}>
              {t(
                `現役 ${grouped.active.length} · 沉寂 ${grouped.dormant.length} · 斷絕 ${grouped.broken.length}`,
                `Bonds & Allegiances — ${grouped.active.length} active · ${grouped.dormant.length} dormant · ${grouped.broken.length} broken`,
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <Section
          title={t('現役 — 兩位武將同屬一勢力', 'Active — both officers in the same force')}
          rows={grouped.active}
          forces={forces}
          emptyMsg={t('目前無啟動中之羈絆。', 'No bonds are currently active.')}
          onPickOfficer={setSelectedOfficer}
        />
        <Section
          title={t('沉寂 — 因效忠或所在地而暫絕', 'Dormant — separated by allegiance or location')}
          rows={grouped.dormant}
          forces={forces}
          emptyMsg={t('無沉寂之羈絆。', 'No dormant bonds.')}
          onPickOfficer={setSelectedOfficer}
        />
        <Section
          title={t('斷絕 — 至少一方已亡', 'Broken — at least one party has died')}
          rows={grouped.broken}
          forces={forces}
          emptyMsg={t('無斷絕之羈絆。', 'No broken bonds.')}
          onPickOfficer={setSelectedOfficer}
          dim
        />

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

function Section({
  title,
  rows,
  forces,
  emptyMsg,
  onPickOfficer,
  dim,
}: {
  title: string;
  rows: BondRow[];
  forces: Record<string, { color: string; name: { en: string; zh: string } }>;
  emptyMsg: string;
  onPickOfficer: (o: Officer) => void;
  dim?: boolean;
}) {
  return (
    <section className={`${styles.section} ${dim ? styles.sectionDim : ''}`}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {rows.length === 0 ? (
        <div className={styles.empty}>{emptyMsg}</div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r, i) => (
            <BondRowView
              key={i}
              row={r}
              forces={forces}
              onPickOfficer={onPickOfficer}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function BondRowView({
  row,
  forces,
  onPickOfficer,
}: {
  row: BondRow;
  forces: Record<string, { color: string; name: { en: string; zh: string } }>;
  onPickOfficer: (o: Officer) => void;
}) {
  const aForce = row.officerA?.forceId ? forces[row.officerA.forceId] : null;
  const bForce = row.officerB?.forceId ? forces[row.officerB.forceId] : null;
  const t = useT();
  return (
    <li className={styles.row}>
      <OfficerCell officer={row.officerA} force={aForce} onClick={onPickOfficer} />
      <div className={styles.linkBlock}>
        <div className={styles.bondLabel}>{row.label}</div>
        <div className={styles.bondFloor}>
          ≥ {row.floor} {t('忠誠', 'loyalty')}
        </div>
        <div className={`${styles.bondKind} ${styles[`kind_${row.kind}`]}`}>
          {row.kind}
        </div>
      </div>
      <OfficerCell officer={row.officerB} force={bForce} onClick={onPickOfficer} />
    </li>
  );
}

function OfficerCell({
  officer,
  force,
  onClick,
}: {
  officer: Officer | null;
  force: { color: string; name: { en: string; zh: string } } | null;
  onClick: (o: Officer) => void;
}) {
  const lang = useLanguage();
  if (!officer) return <div className={styles.cellMissing}>—</div>;
  const dead = officer.status === 'dead';
  return (
    <div
      className={styles.cell}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(officer)}
    >
      <div className={styles.cellName}>
        <span className={`${styles.cellNameZh} ${dead ? styles.dead : ''}`}>
          {lang === 'en' ? officer.name.en : officer.name.zh}
        </span>
        {lang === 'both' && <span className={styles.cellNameEn}>{officer.name.en}</span>}
      </div>
      <div className={styles.cellFooter}>
        <span
          className={styles.cellDot}
          style={{ background: force?.color ?? '#5a4530' }}
        />
        <span className={styles.cellForce}>
          {force ? (lang === 'en' ? force.name.en : force.name.zh) : (dead ? '亡' : '浪人')}
        </span>
        <span className={styles.cellLoy}>L{officer.loyalty}</span>
      </div>
    </div>
  );
}
