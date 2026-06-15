import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { eloquence } from '../../game/systems/debate';
import type { EntityId } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import { OfficerStats } from './OfficerStats';
import { Icon } from './Icon';
import { DebateModal } from './DebateModal';
import { RecruitSuccessModal } from './RecruitSuccessModal';
import { useT, useLanguage } from '../i18n';
import styles from './FreeAgentsSection.module.css';

interface Props {
  cityId: EntityId;
  isPlayerCity: boolean;
}

const BRIBE_AMOUNT = 300;

export function FreeAgentsSection({ cityId, isPlayerCity }: Props) {
  const officersMap = useGameStore((s) => s.officers);
  const cityGold = useGameStore((s) => s.cities[cityId]?.gold ?? 0);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const recruitFreeAgent = useGameStore((s) => s.recruitFreeAgent);
  const lockFreeAgentRecruit = useGameStore((s) => s.lockFreeAgentRecruit);
  const recruitState = useGameStore((s) => s.recruitState);
  const year = useGameStore((s) => s.date.year);
  const season = useGameStore((s) => s.date.season);
  const seasonKey = `${year}|${season}`;
  const t = useT();
  const lang = useLanguage();

  const [feedback, setFeedback] = useState<{ officerId: EntityId; text: string; ok: boolean } | null>(null);
  const [debating, setDebating] = useState<EntityId | null>(null);
  const [recruited, setRecruited] = useState<EntityId | null>(null);

  const agents = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.status === 'idle' && o.forceId === null,
    ),
    [officersMap, cityId],
  );
  // The most eloquent stationed officer leads the war of words.
  const orator = useMemo(
    () => Object.values(officersMap)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === cityId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched')
      .sort((a, b) => eloquence(b) - eloquence(a))[0] ?? null,
    [officersMap, playerForceId, cityId],
  );

  if (agents.length === 0) return null;

  const stageOf = (id: EntityId): 'fresh' | 'declined' | 'locked' => {
    const r = recruitState[id];
    if (!r || r.season !== seasonKey) return 'fresh';
    return r.stage;
  };

  const invite = (id: EntityId, opts?: { debateWon?: boolean; bribe?: number }) => {
    const r = recruitFreeAgent(id, cityId, opts);
    setFeedback({ officerId: id, text: r.message, ok: r.ok });
    playSfx(r.ok ? 'bell' : 'defeat');
    if (r.ok) setRecruited(id);
  };

  return (
    <section className={styles.root}>
      <h3 className={styles.title}>{t('浪人', 'Free Agents')} ({agents.length})</h3>
      <ul className={styles.list}>
        {agents.map((o) => {
          const stage = stageOf(o.id);
          return (
            <li key={o.id} className={styles.row}>
              <OfficerHoverCard officer={o}>
                <div className={styles.head}>
                  {lang !== 'en' && <span className={styles.nameZh}>{o.name.zh}</span>}
                  {lang !== 'zh' && (
                    <span className={styles.nameEn}>
                      {o.name.en}
                      {o.courtesyName && <span className={styles.courtesy}> ({o.courtesyName.en})</span>}
                    </span>
                  )}
                  <span className={styles.stats}>
                    <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} />
                  </span>
                </div>
              </OfficerHoverCard>
              {feedback?.officerId === o.id && (
                <div className={`${styles.feedback} ${feedback.ok ? styles.feedbackOk : styles.feedbackFail}`}>
                  {feedback.text}
                </div>
              )}
              {isPlayerCity && (
                <div className={styles.actions}>
                  {stage === 'locked' ? (
                    <span style={{ fontSize: '0.72rem', color: '#a8825a' }}>{t('舌戰失利 · 下回合再訪', 'Lost the debate — try next turn')}</span>
                  ) : stage === 'fresh' ? (
                    <button className={styles.recruitBtn} onClick={() => invite(o.id)} title={t('禮聘出仕(免費)', 'Invite to serve (free)')}>
                      {t('招聘', 'Invite')}
                    </button>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.7rem', color: '#a8825a', marginRight: 4 }}>{t('婉拒 —', 'Declined —')}</span>
                      {orator && (
                        <button
                          className={styles.recruitBtn}
                          onClick={() => setDebating(o.id)}
                          title={t(`遣${orator.name.zh}與其舌戰,勝則機率大增,負則本回合不再見`, `Send ${orator.name.en} to debate — win to greatly boost odds, lose and they won't see you this turn`)}
                        >💬 {t('舌戰', 'Debate')}</button>
                      )}
                      <button
                        className={styles.recruitBtn}
                        onClick={() => invite(o.id, { bribe: BRIBE_AMOUNT })}
                        disabled={cityGold < BRIBE_AMOUNT}
                        title={cityGold < BRIBE_AMOUNT ? `需 ${BRIBE_AMOUNT} 金` : `贈金 ${BRIBE_AMOUNT} 以動其心`}
                      ><Icon name="gold" size={11} /> {t('賄賂', 'Bribe')} ({BRIBE_AMOUNT}g)</button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {recruited && officersMap[recruited] && (
        <RecruitSuccessModal officer={officersMap[recruited]} onClose={() => setRecruited(null)} />
      )}
      {debating && orator && officersMap[debating] && (
        <DebateModal
          me={orator}
          foe={officersMap[debating]}
          onDone={({ won }) => {
            const target = debating;
            setDebating(null);
            if (won) {
              invite(target, { debateWon: true });
            } else {
              lockFreeAgentRecruit(target);
              setFeedback({ officerId: target, text: '舌戰失利,此人拂袖而去 — 下回合再訪。', ok: false });
              playSfx('defeat');
            }
          }}
        />
      )}
    </section>
  );
}
