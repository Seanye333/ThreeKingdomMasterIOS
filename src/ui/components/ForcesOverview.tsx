import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import type { City, EntityId, Officer } from '../../game/types';
import { AnimatedNumber } from './AnimatedNumber';
import { OfficerStats } from './OfficerStats';
import { realmEthos, ethosLine, type RealmEthos } from '../../game/systems/realmEthos';
import { useT, useLanguage } from '../i18n';
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
  /** 國風 (§6.18) — the realm's character, derived from its roster. */
  ethos: RealmEthos;
}

export function ForcesOverview({ onClose }: Props) {
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const deeds = useGameStore((s) => s.deeds);

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
        ethos: realmEthos(officers, deeds ?? {}, force.id),
      });
    }
    out.sort((a, b) => {
      if (a.isPlayer && !b.isPlayer) return -1;
      if (!a.isPlayer && b.isPlayer) return 1;
      return b.troops - a.troops;
    });
    return out;
  }, [forces, cities, officers, playerForceId, deeds]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>群雄</div>}
            {lang !== 'zh' && <div className={styles.titleEn}>Forces of the Realm</div>}
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
                    {lang === 'en' ? f.en : f.zh}
                    {f.isPlayer && <span className={styles.playerTag}>{t('我方', 'YOU')}</span>}
                    {f.cityCount === 0 && (
                      <span className={styles.eliminatedTag}>{t('覆滅', 'OUT')}</span>
                    )}
                  </span>
                  {lang === 'both' && <span className={styles.nameEn}>{f.en}</span>}
                </div>
                <div className={styles.stats}>
                  <Stat label={t('城', 'Cities')} num={f.cityCount} />
                  <Stat label={t('兵', 'Troops')} num={f.troops} flash />
                  <Stat label={t('金', 'Gold')} num={f.gold} flash />
                  <Stat label={t('糧', 'Food')} num={f.food} flash />
                  <Stat label={t('將', 'Officers')} num={f.officerCount} />
                </div>
              </div>
              {/* 國風 (§6.18) — the realm's character, and how pronounced it is.
                  Shown for every realm, so a rival's bent is readable too. */}
              {f.ethos.lean !== 'undistinguished' && (
                <div
                  title={t(
                    `${ethosLine(f.ethos).zh} 由該國武將的修為與戰績推導。尚武者鬥將懾人、學堂重武備;崇文者全境民心日附、學堂重文教;各自吸引同類之才。`,
                    `${ethosLine(f.ethos).en} Derived from the roster's cultivation and record. A martial realm cows challengers and drills harder; a literary one steadies its cities. Each draws its own kind.`,
                  )}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
                    padding: '0.1rem 0.5rem', borderRadius: 4, fontSize: '0.72rem',
                    background: f.ethos.lean === 'martial' ? 'rgba(224,132,106,0.14)'
                      : f.ethos.lean === 'literary' ? 'rgba(136,183,232,0.14)' : 'rgba(154,138,232,0.14)',
                    border: `1px solid ${f.ethos.lean === 'martial' ? '#e0846a' : f.ethos.lean === 'literary' ? '#88b7e8' : '#9a8ae8'}`,
                    color: f.ethos.lean === 'martial' ? '#ffc8b8' : f.ethos.lean === 'literary' ? '#cfe4ff' : '#d8cff5',
                  }}
                >
                  {f.ethos.lean === 'martial' ? '⚔' : f.ethos.lean === 'literary' ? '📜' : '⚖'}
                  {lang === 'en' ? f.ethos.en : f.ethos.zh}
                  <span style={{ opacity: 0.75 }}>
                    {t(`武${f.ethos.martial}・文${f.ethos.literary}`, `${f.ethos.martial}/${f.ethos.literary}`)}
                  </span>
                  <span style={{ opacity: 0.6 }}>
                    {f.ethos.strength >= 0.7 ? t('蔚然成風', 'deep') : f.ethos.strength >= 0.4 ? t('漸成風氣', 'taking hold') : t('初見端倪', 'faint')}
                  </span>
                </div>
              )}
              {f.topOfficers.length > 0 && (
                <div className={styles.topOfficers}>
                  {f.topOfficers.map((o) => (
                    <span key={o.id} className={styles.topOfficer}>
                      {lang !== 'en' && <span className={styles.officerNameZh}>{o.name.zh}</span>}
                      {lang !== 'zh' && <span className={styles.officerNameEn}>{o.name.en}</span>}
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
