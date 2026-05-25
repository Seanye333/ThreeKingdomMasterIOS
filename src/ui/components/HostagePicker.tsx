import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import styles from './MarriagePicker.module.css';   // reuse the same styles
import { useT } from '../i18n';

interface Props {
  targetForceId: EntityId;
  onClose: () => void;
}

export function HostagePicker({ targetForceId, onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const proposeHostage = useGameStore((s) => s.proposeHostage);

  const [pick, setPick] = useState<EntityId | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const t = useT();

  const candidates = useMemo(() => {
    if (!playerForceId) return [];
    const playerForce = forces[playerForceId];
    return Object.values(officers)
      .filter((o) =>
        o.forceId === playerForceId
        && (o.status === 'idle' || o.status === 'active')
        && o.id !== playerForce?.rulerOfficerId,
      )
      // Lower-charisma, lower-stat officers are typically the ones sent
      .sort((a, b) => a.stats.charisma - b.stats.charisma);
  }, [officers, playerForceId, forces]);

  const playerForce = playerForceId ? forces[playerForceId] : null;
  const targetForce = forces[targetForceId];

  const handleSubmit = () => {
    if (!pick) return;
    const r = proposeHostage(targetForceId, pick);
    setFeedback({ ok: r.ok, text: r.message });
    if (r.ok) setPick(null);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>人質交換</div>
            <div className={styles.titleEn}>
              {t(`送往 ${targetForce?.name.zh ?? ''}`, `Send Hostage to ${targetForce?.name.en ?? ''}`)}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.meta}>
          {t(
            `送出人質可締結長期和約（16 季不戰、好感 +50）。武將被軟禁在 ${targetForce?.name.zh ?? ''} 都城，釋放前無法調用。`,
            `A hostage cements a long peace (16-season NAP, +50 relation). The officer is held in ${targetForce?.name.zh ?? ''}'s capital and unavailable until released.`
          )}
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span
                className={styles.colorDot}
                style={{ background: playerForce?.color ?? '#5a4530' }}
              />
              <span>{playerForce?.name.zh ?? t('我方', 'You')} — {t('選人質', 'pick a hostage')}</span>
            </div>
            {candidates.length === 0 ? (
              <div className={styles.empty}>{t('沒有可派的武將。', 'No eligible officers.')}</div>
            ) : (
              <ul className={styles.officerList}>
                {candidates.map((o) => {
                  const city = o.locationCityId ? cities[o.locationCityId] : null;
                  return (
                    <li key={o.id}>
                      <button
                        className={`${styles.officerButton} ${pick === o.id ? styles.officerSelected : ''}`}
                        onClick={() => setPick(o.id)}
                      >
                        <span className={styles.officerNameZh}>{o.name.zh}</span>
                        <span className={styles.officerNameEn}>{o.name.en}</span>
                        <span className={styles.officerCha}>
                          CHA <strong>{o.stats.charisma}</strong>
                          {' · '}WAR <strong>{o.stats.war}</strong>
                        </span>
                        {city && (
                          <span className={styles.officerCity}>{city.name.zh}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`${styles.feedback} ${feedback.ok ? styles.feedbackOk : styles.feedbackFail}`}>
            {feedback.text}
          </div>
        )}

        <footer className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!pick}
          >
            {t('送出人質', 'Send Hostage')}
          </button>
        </footer>
      </div>
    </div>
  );
}
