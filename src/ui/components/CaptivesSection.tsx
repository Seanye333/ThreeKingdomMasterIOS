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
import { ITEMS_BY_ID, itemRarity } from '../../game/data/items';
import { useT, useLanguage } from '../i18n';
import styles from './CaptivesSection.module.css';

interface Props {
  cityId: EntityId;
}

const RARITY_RANK: Record<string, number> = { gold: 3, silver: 2, bronze: 1 };

export function CaptivesSection({ cityId }: Props) {
  const t = useT();
  const lang = useLanguage();
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
  const lostItems = useGameStore((s) => s.lostItems);
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

  // 名品禮聘 — grandest unclaimed treasure in this city, to press on a captive.
  const bestGift = useMemo(() => {
    const here = lostItems
      .filter((li) => li.cityId === cityId && ITEMS_BY_ID[li.itemId])
      .map((li) => ITEMS_BY_ID[li.itemId]);
    if (here.length === 0) return null;
    return here.sort((a, b) => RARITY_RANK[itemRarity(b)] - RARITY_RANK[itemRarity(a)])[0];
  }, [lostItems, cityId]);

  if (captives.length === 0) return null;

  const handleRecruit = (officerId: EntityId, approach?: PersuasionApproach, giftItemId?: EntityId) => {
    const result = recruitOfficer(officerId, cityId, approach, debateEdge.has(officerId), giftItemId);
    if (debateEdge.has(officerId)) setDebateEdge((prev) => { const n = new Set(prev); n.delete(officerId); return n; });
    if (result.ok) setRecruited(officerId);
    setFeedback({ officerId, text: result.message, ok: result.ok });
    playSfx(result.ok ? 'bell' : 'defeat');
  };

  /* 勸降三策 — each approach shows its live odds so the choice means
     something: principle for the loyal, gold for the venal, friendship
     when an old comrade waits in your camp. */
  const APPROACHES: Array<{ id: PersuasionApproach; zh: string; en: string; tip: string; tipEn: string }> = [
    { id: 'righteous', zh: '曉以大義', en: 'Appeal to Honor', tip: '以大義折其節 — 忠義之士唯此可動', tipEn: 'Bend them by righteousness — only the loyal-hearted yield to this' },
    { id: 'riches', zh: '許以重利', en: 'Offer Riches', tip: '重金開路(費用加倍)— 貪者聞金而心動,廉者倍怒', tipEn: 'Open the way with gold (cost doubled) — the greedy waver, the upright rage' },
    { id: 'feeling', zh: '以情動人', en: 'Move by Friendship', tip: '故舊之情 — 你麾下與其交情越深越有效,鄉土加成加倍', tipEn: 'Old ties — the deeper your officer’s bond with him the better; hometown bonus doubled' },
  ];

  return (
    <section className={styles.root}>
      <h3 className={styles.title}>{t('捕虜', 'Captives')} ({captives.length})</h3>
      <ul className={styles.list}>
        {captives.map((o) => (
          <li key={o.id} className={styles.row}>
            <OfficerHoverCard officer={o}>
              <div className={styles.head}>
                {lang !== 'en' && <span className={styles.nameZh}>{o.name.zh}</span>}
                {lang !== 'zh' && <span className={styles.nameEn}>{o.name.en}</span>}
                <span className={styles.stats}>
                  <OfficerStats officer={o} keys={['war', 'intelligence', 'politics', 'charisma']} />
                  <span style={{ color: '#a8825a', marginLeft: 6 }}>· {t('忠', 'Loy')} {o.loyalty}</span>
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
                  title={t(`遣${bestDebater.name.zh}與其舌戰 — 勝則勸降大增(一次),罵倒則其志氣再挫`, `Send ${bestDebater.name.en} to debate — win to greatly boost surrender odds (once); a rout further breaks his will`)}
                >💬 {t('舌戰', 'Debate')}</button>
              )}
              {debateEdge.has(o.id) && (
                <span style={{ fontSize: '0.7rem', color: '#9ed68a', alignSelf: 'center' }}>{t('舌戰得勝,趁勢勸降 ↑', 'Debate won — press the advantage ↑')}</span>
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
                    title={`${lang === 'en' ? a.tipEn : a.tip}(${cost}g)`}
                  >
                    {lang === 'en' ? a.en : a.zh} {odds}%
                  </button>
                );
              })}
              {bestGift && (
                <button
                  className={styles.recruitBtn}
                  onClick={() => handleRecruit(o.id, 'riches', bestGift.id)}
                  title={t(`以名品「${bestGift.name.zh}」厚禮招降(成則隨之入幕)`, `Press ${bestGift.name.en} on them (joins them on success)`)}
                >🎁 {t('厚禮', 'Gift')} · {lang === 'en' ? bestGift.name.en : bestGift.name.zh}</button>
              )}
              <button
                className={styles.releaseBtn}
                onClick={() => releaseOfficer(o.id)}
              >
                {t('釋放', 'Release')}
              </button>
              <button
                className={styles.releaseBtn}
                onClick={() => releaseOfficer(o.id, true)}
                title={t('義釋 — 結恩於其,漲己威望;日後招攬大加成', 'Free them honorably — earns renown; far easier to recruit them later')}
              >
                {t('義釋', 'Free w/ honor')}
              </button>
              <button
                className={styles.executeBtn}
                onClick={() => executeOfficer(o.id)}
              >
                {t('斬首', 'Execute')}
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
