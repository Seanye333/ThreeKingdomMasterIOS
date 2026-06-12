import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import styles from './EventModal.module.css';
import { useT, useLanguage, useDesc } from '../i18n';

export function EventModal() {
  const pending = useGameStore((s) => s.pendingEvent);
  const dismiss = useGameStore((s) => s.dismissEvent);
  const resolveChoice = useGameStore((s) => s.resolveEventChoice);
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
        {pending.awaitingChoice && event.choices?.length ? (
          /* 抉擇 — history holds its breath; the player picks the branch. */
          <div className={styles.actions} style={{ flexDirection: 'column', gap: 8 }}>
            {event.choices.map((c) => (
              <button
                key={c.id}
                className={styles.ackButton}
                style={{ width: '100%' }}
                onClick={() => resolveChoice(c.id)}
              >
                {lang === 'en' ? c.label.en : lang === 'both' ? `${c.label.zh} · ${c.label.en}` : c.label.zh}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.actions}>
            <button className={styles.ackButton} onClick={dismiss}>
              {t('承知', 'Continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
