import { useEffect } from 'react';
import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import type { HistoricalEvent } from '../../game/types/event';
import { playEventCue, type EventCueMood } from '../../game/systems/sound';
import styles from './EventModal.module.css';
import { useT, useLanguage, useDesc } from '../i18n';

/** 事件配樂 — classify an event's mood from its effects (language-agnostic)
 *  with id/name keyword hints, so the right motif greets it. */
function eventMood(event: HistoricalEvent): EventCueMood {
  const text = `${event.id} ${event.name.en}`.toLowerCase();
  if (event.effects.some((e) => e.kind === 'officer-status' && e.status === 'dead')) return 'somber';
  if (/omen|star|heaven|prophe|comet|eclipse|portent|dream|天命|祥瑞|讖|彗|蝕/.test(text)) return 'mystic';
  if (event.effects.some((e) => e.kind === 'spawn-rebel-force')) return 'martial';
  if (event.effects.some((e) =>
    (e.kind === 'force-gold' && e.delta < 0) ||
    (e.kind === 'city-loyalty' && e.delta < 0) ||
    (e.kind === 'officer-loyalty' && e.delta < 0) ||
    (e.kind === 'force-troops-multiplier' && e.multiplier < 1))) return 'ominous';
  if (event.effects.some((e) => e.kind === 'officer-join' || e.kind === 'officer-join-ruler' || e.kind === 'grant-title')) return 'auspicious';
  return 'auspicious';
}

export function EventModal() {
  const pending = useGameStore((s) => s.pendingEvent);
  const dismiss = useGameStore((s) => s.dismissEvent);
  const resolveChoice = useGameStore((s) => s.resolveEventChoice);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  // Greet each new event with its mood motif (fires once per event id).
  const eventId = pending?.event.id;
  useEffect(() => {
    if (pending) playEventCue(eventMood(pending.event));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
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
