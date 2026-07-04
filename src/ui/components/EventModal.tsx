import { useEffect } from 'react';
import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import type { HistoricalEvent } from '../../game/types/event';
import { playEventCue, type EventCueMood } from '../../game/systems/sound';
import styles from './EventModal.module.css';
import { useT, useLanguage, useDesc, pickName } from '../i18n';
import { OfficerPortrait } from './OfficerPortrait';

/** 事件配樂 — classify an event's mood from its effects (language-agnostic)
 *  with id/name keyword hints, so the right motif greets it. */
function eventMood(event: HistoricalEvent): EventCueMood {
  // An explicit mood (e.g. on choice-only dynamic events) wins over inference.
  if (event.mood) return event.mood;
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

/** 情緒色 — each mood gets an accent, a glow and a single-character chop. */
const MOOD_STYLE: Record<EventCueMood, { accent: string; glow: string; seal: string }> = {
  auspicious: { accent: '#e6c473', glow: 'rgba(212,168,74,0.4)', seal: '瑞' },
  somber:     { accent: '#9aa6b0', glow: 'rgba(154,166,176,0.35)', seal: '喪' },
  mystic:     { accent: '#b69ae0', glow: 'rgba(182,154,224,0.4)', seal: '玄' },
  martial:    { accent: '#d06450', glow: 'rgba(208,100,80,0.4)', seal: '兵' },
  ominous:    { accent: '#d89048', glow: 'rgba(216,144,72,0.38)', seal: '凶' },
};

/** 事件面孔 — every officer the event names (conditions, effects, choices,
 *  chooser), deduped in mention order: the cast of the scene. */
function eventOfficerIds(event: HistoricalEvent): string[] {
  const ids: string[] = [];
  const push = (id?: string) => { if (id && !ids.includes(id)) ids.push(id); };
  for (const r of event.requires ?? []) {
    push((r as { officerId?: string }).officerId);
    push((r as { rulerOfficerId?: string }).rulerOfficerId);
  }
  push(event.chooserRulerId);
  const effs = [...event.effects, ...(event.choices?.flatMap((c) => c.effects) ?? [])];
  for (const e of effs) {
    push((e as { officerId?: string }).officerId);
    push((e as { rulerOfficerId?: string }).rulerOfficerId);
  }
  return ids;
}

export function EventModal() {
  const pending = useGameStore((s) => s.pendingEvent);
  const dismiss = useGameStore((s) => s.dismissEvent);
  const resolveChoice = useGameStore((s) => s.resolveEventChoice);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
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
  const mood = MOOD_STYLE[eventMood(event)];
  return (
    <div className={styles.backdrop}>
      <div
        className={styles.modal}
        style={{ ['--evt-accent' as string]: mood.accent, ['--evt-glow' as string]: mood.glow }}
      >
        <div className={styles.scrollDecoration} />
        <div className={styles.moodSeal} aria-hidden="true">{mood.seal}</div>
        <div className={styles.eyebrow}>{t('史實事件', 'Historical Event')}</div>
        {lang !== 'en' && <div className={`${styles.titleZh} ${styles.titleZhAnim}`}>{event.name.zh}</div>}
        {lang !== 'zh' && <div className={styles.titleEn}>{event.name.en}</div>}
        <div className={styles.dateLine}>
          {year} AD · {lang === 'en' ? seasonLabel.en : seasonLabel.zh}
        </div>
        <hr className={styles.divider} />
        {/* 登場人物 — the faces this moment belongs to. */}
        {(() => {
          const cast = eventOfficerIds(event)
            .map((id) => officers[id])
            .filter((o): o is NonNullable<typeof o> => !!o && o.status !== 'dead')
            .slice(0, 3);
          if (cast.length === 0) return null;
          return (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '2px 0 6px' }}>
              {cast.map((o) => (
                <div key={o.id} style={{ textAlign: 'center' }}>
                  <OfficerPortrait
                    officer={o}
                    size={64}
                    year={year}
                    forceColor={o.forceId ? forces[o.forceId]?.color : undefined}
                  />
                  <div style={{ fontSize: '0.66rem', color: '#c9b87a', marginTop: 2, fontFamily: 'var(--tkm-font-body)' }}>
                    {pickName(o.name, lang)}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        <p className={`${styles.description} ${styles.descAnim}`}>{desc(event)}</p>
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
