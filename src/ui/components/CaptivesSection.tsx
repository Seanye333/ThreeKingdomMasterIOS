import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { recruitCostFor, type PersuasionApproach } from '../../game/systems/officerFate';
import { playSfx } from '../../game/systems/sound';
import type { EntityId } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import { OfficerStats } from './OfficerStats';
import { DebateModal } from './DebateModal';
import { RecruitSuccessModal } from './RecruitSuccessModal';
import { eloquence } from '../../game/systems/debate';
import styles from './CaptivesSection.module.css';

interface Props {
  cityId: EntityId;
}

export function CaptivesSection({ cityId }: Props) {
  const officersMap = useGameStore((s) => s.officers);
  const cityGold = useGameStore((s) => s.cities[cityId]?.gold ?? 0);
  const recruitOfficer = useGameStore((s) => s.recruitOfficer);
  const estimatePersuasion = useGameStore((s) => s.estimatePersuasion);
  const applyDebateCollapse = useGameStore((s) => s.applyDebateCollapse);
  const playerForceId = useGameStore((s) => s.playerForceId);
  // 舌戰 — the modal target + officers we've out-argued (one-shot edge).
  const [debating, setDebating] = useState<EntityId | null>(null);
  const [recruited, setRecruited] = useState<EntityId | null>(null);
  const [debateEdge, setDebateEdge] = useState<Set<EntityId>>(new Set());
  const bestDebater = useMemo(
    () => Object.values(officersMap)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === cityId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched')
      .sort((a, b) => eloquence(b) - eloquence(a))[0] ?? null,
    [officersMap, playerForceId, cityId],
  );
  const executeOfficer = useGameStore((s) => s.executeOfficer);
  const releaseOfficer = useGameStore((s) => s.releaseOfficer);
  const [feedback, setFeedback] = useState<{
    officerId: EntityId;
    text: string;
    ok: boolean;
  } | null>(null);

  const captives = useMemo(
    () =>
      Object.values(officersMap).filter(
        (o) => o.locationCityId === cityId && o.status === 'imprisoned',
      ),
    [officersMap, cityId],
  );

  if (captives.length === 0) return null;

  const handleRecruit = (officerId: EntityId, approach?: PersuasionApproach) => {
    const result = recruitOfficer(officerId, cityId, approach, debateEdge.has(officerId));
    if (debateEdge.has(officerId)) setDebateEdge((prev) => { const n = new Set(prev); n.delete(officerId); return n; });
    if (result.ok) setRecruited(officerId);
    setFeedback({ officerId, text: result.message, ok: result.ok });
    playSfx(result.ok ? 'bell' : 'defeat');
  };

  /* 勸降三策 — each approach shows its live odds so the choice means
     something: principle for the loyal, gold for the venal, friendship
     when an old comrade waits in your camp. */
  const APPROACHES: Array<{ id: PersuasionApproach; zh: string; tip: string }> = [
    { id: 'righteous', zh: '曉以大義', tip: '以大義折其節 — 忠義之士唯此可動' },
    { id: 'riches', zh: '許以重利', tip: '重金開路(費用加倍)— 貪者聞金而心動,廉者倍怒' },
    { id: 'feeling', zh: '以情動人', tip: '故舊之情 — 你麾下與其交情越深越有效,鄉土加成加倍' },
  ];

  return (
    <section className={styles.root}>
      <h3 className={styles.title}>Captives 捕虜 ({captives.length})</h3>
      <ul className={styles.list}>
        {captives.map((o) => (
          <li key={o.id} className={styles.row}>
            <OfficerHoverCard officer={o}>
              <div className={styles.head}>
                <span className={styles.nameZh}>{o.name.zh}</span>
                <span className={styles.nameEn}>{o.name.en}</span>
                <span className={styles.stats}>
                  <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} />
                  <span style={{ color: '#a8825a', marginLeft: 6 }}>· 忠 {o.loyalty}</span>
                </span>
              </div>
            </OfficerHoverCard>
            {feedback?.officerId === o.id && (
              <div
                className={`${styles.feedback} ${feedback.ok ? styles.feedbackOk : styles.feedbackFail}`}
              >
                {feedback.text}
              </div>
            )}
            <div className={styles.actions}>
              {bestDebater && !debateEdge.has(o.id) && (
                <button
                  className={styles.recruitBtn}
                  onClick={() => setDebating(o.id)}
                  title={`遣${bestDebater.name.zh}與其舌戰 — 勝則勸降大增(一次),罵倒則其志氣再挫`}
                >💬 舌戰</button>
              )}
              {debateEdge.has(o.id) && (
                <span style={{ fontSize: '0.7rem', color: '#9ed68a', alignSelf: 'center' }}>舌戰得勝,趁勢勸降 ↑</span>
              )}
              {APPROACHES.map((a) => {
                const cost = recruitCostFor(a.id);
                const odds = Math.round(estimatePersuasion(o.id, cityId, a.id) * 100);
                return (
                  <button
                    key={a.id}
                    className={styles.recruitBtn}
                    onClick={() => handleRecruit(o.id, a.id)}
                    disabled={cityGold < cost}
                    title={`${a.tip}(${cost}g)`}
                  >
                    {a.zh} {odds}%
                  </button>
                );
              })}
              <button
                className={styles.releaseBtn}
                onClick={() => releaseOfficer(o.id)}
              >
                釋放 Release
              </button>
              <button
                className={styles.executeBtn}
                onClick={() => executeOfficer(o.id)}
              >
                斬首 Execute
              </button>
            </div>
          </li>
        ))}
      </ul>
      {debating && bestDebater && officersMap[debating] && (
        <DebateModal
          me={bestDebater}
          foe={officersMap[debating]}
          onDone={({ won, collapse }) => {
            if (won) setDebateEdge((prev) => new Set(prev).add(debating));
            if (collapse) applyDebateCollapse(debating);
            setDebating(null);
          }}
        />
      )}
      {recruited && officersMap[recruited] && (
        <RecruitSuccessModal officer={officersMap[recruited]} onClose={() => setRecruited(null)} />
      )}
    </section>
  );
}
