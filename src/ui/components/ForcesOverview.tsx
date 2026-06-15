import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import type { City, EntityId, Officer } from '../../game/types';
import { AnimatedNumber } from './AnimatedNumber';
import { OfficerStats } from './OfficerStats';
import styles from './ForcesOverview.module.css';

interface Props {
  onClose: () => void;
}

interface ForceSummary {
  id: EntityId;
  zh: string;
  en: string;
  color: string;
  isPlayer: boolean;
  cityCount: number;
  troops: number;
  gold: number;
  food: number;
  officerCount: number;
  topOfficers: Officer[];
  rulerOfficerId: EntityId;
  capitalCityId: EntityId;
}

export function ForcesOverview({ onClose }: Props) {
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const summaries = useMemo<ForceSummary[]>(() => {
    const out: ForceSummary[] = [];
    for (const force of Object.values(forces)) {
      const forceCities: City[] = Object.values(cities).filter(
        (c) => c.ownerForceId === force.id,
      );
      const forceOfficers: Officer[] = Object.values(officers).filter(
        (o) => o.forceId === force.id && o.status !== 'dead',
      );
      out.push({
        id: force.id,
        zh: force.name.zh,
        en: force.name.en,
        color: force.color,
        isPlayer: force.id === playerForceId,
        cityCount: forceCities.length,
        troops: forceCities.reduce((s, c) => s + c.troops, 0),
        gold: forceCities.reduce((s, c) => s + c.gold, 0),
        food: forceCities.reduce((s, c) => s + c.food, 0),
        officerCount: forceOfficers.length,
        topOfficers: [...forceOfficers]
          .sort(
            (a, b) =>
              b.stats.war + b.stats.intelligence -
              (a.stats.war + a.stats.intelligence),
          )
          .slice(0, 3),
        rulerOfficerId: force.rulerOfficerId,
        capitalCityId: force.capitalCityId,
      });
    }
    out.sort((a, b) => {
      if (a.isPlayer && !b.isPlayer) return -1;
      if (!a.isPlayer && b.isPlayer) return 1;
      return b.troops - a.troops;
    });
    return out;
  }, [forces, cities, officers, playerForceId]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>群雄</div>
            <div className={styles.titleEn}>Forces of the Realm</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <ul className={styles.list}>
          {summaries.map((f) => (
            <li key={f.id} className={f.cityCount === 0 ? styles.eliminated : ''}>
              <div className={styles.row}>
                <span
                  className={styles.colorDot}
                  style={{ background: f.color }}
                />
                <div className={styles.nameBlock}>
                  <span className={styles.nameZh}>
                    {f.zh}
                    {f.isPlayer && <span className={styles.playerTag}>YOU</span>}
                    {f.cityCount === 0 && (
                      <span className={styles.eliminatedTag}>ELIMINATED</span>
                    )}
                  </span>
                  <span className={styles.nameEn}>{f.en}</span>
                </div>
                <div className={styles.stats}>
                  <Stat label="Cities" num={f.cityCount} />
                  <Stat label="Troops" num={f.troops} flash />
                  <Stat label="Gold" num={f.gold} flash />
                  <Stat label="Food" num={f.food} flash />
                  <Stat label="Officers" num={f.officerCount} />
                </div>
              </div>
              {f.topOfficers.length > 0 && (
                <div className={styles.topOfficers}>
                  {f.topOfficers.map((o) => (
                    <span key={o.id} className={styles.topOfficer}>
                      <span className={styles.officerNameZh}>{o.name.zh}</span>
                      <span className={styles.officerNameEn}>{o.name.en}</span>
                      <span className={styles.officerStats}>
                        <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} />
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, num, flash }: { label: string; value?: number | string; num?: number; flash?: boolean }) {
  return (
    <span className={styles.statBlock}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {num !== undefined ? <AnimatedNumber value={num} flash={flash} /> : value}
      </span>
    </span>
  );
}
