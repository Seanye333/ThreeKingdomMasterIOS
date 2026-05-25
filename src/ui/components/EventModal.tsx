import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import styles from './EventModal.module.css';
import { useT, useLanguage, useDesc } from '../i18n';

export function EventModal() {
  const pending = useGameStore((s) => s.pendingEvent);
  const dismiss = useGameStore((s) => s.dismissEvent);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  if (!pending) return null;
  const { event, year, season } = pending;
  const seasonLabel = SEASON_LABEL[season];
  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.scrollDecoration} />
        <div className={styles.eyebrow}>{t('史實事件', 'Historical Event')}</div>
        {lang !== 'en' && <div className={styles.titleZh}>{event.name.zh}</div>}
        {lang !== 'zh' && <div className={styles.titleEn}>{event.name.en}</div>}
        <div className={styles.dateLine}>
          {year} AD · {lang === 'en' ? seasonLabel.en : seasonLabel.zh}
        </div>
        <hr className={styles.divider} />
        <p className={styles.description}>{desc(event)}</p>
        <div className={styles.actions}>
          <button className={styles.ackButton} onClick={dismiss}>
            {t('承知', 'Continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
