import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import {
  ALLIANCE_PROPOSAL_COST,
  NAP_PROPOSAL_COST,
} from '../../game/systems/diplomacy';
import { SEASON_LABEL } from '../../game/types';
import type {
  EntityId,
  GameDate,
  Relation,
  Season,
} from '../../game/types';
import { getRelation } from '../../game/types';
import { MarriagePicker } from './MarriagePicker';
import { HostagePicker } from './HostagePicker';
import { useT } from '../i18n';
import styles from './DiplomacyModal.module.css';

interface Props {
  onClose: () => void;
}

interface ForceRow {
  id: EntityId;
  zh: string;
  en: string;
  color: string;
  cities: number;
  troops: number;
  relation: Relation;
}

export function DiplomacyModal({ onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });
  const proposeAlliance = useGameStore((s) => s.proposeAlliance);
  const proposeNAP = useGameStore((s) => s.proposeNonAggression);
  const payTribute = useGameStore((s) => s.payTribute);
  const breakAlliance = useGameStore((s) => s.breakAlliance);

  const [feedback, setFeedback] = useState<{
    forceId: EntityId;
    text: string;
    accepted?: boolean;
  } | null>(null);
  const [marriageTarget, setMarriageTarget] = useState<EntityId | null>(null);
  const [hostageTarget, setHostageTarget] = useState<EntityId | null>(null);
  const t = useT();

  const rows = useMemo<ForceRow[]>(() => {
    if (!playerForceId) return [];
    const out: ForceRow[] = [];
    for (const f of Object.values(forces)) {
      if (f.id === playerForceId) continue;
      const ownedCities = Object.values(cities).filter(
        (c) => c.ownerForceId === f.id,
      );
      if (ownedCities.length === 0) continue;
      out.push({
        id: f.id,
        zh: f.name.zh,
        en: f.name.en,
        color: f.color,
        cities: ownedCities.length,
        troops: ownedCities.reduce((s, c) => s + c.troops, 0),
        relation: getRelation(diplomacy, playerForceId, f.id),
      });
    }
    out.sort((a, b) => b.relation.score - a.relation.score);
    return out;
  }, [playerForceId, forces, cities, diplomacy]);

  if (!playerForceId) return null;

  const handle = (
    forceId: EntityId,
    action: () => { ok: boolean; message: string; accepted?: boolean },
  ) => {
    const r = action();
    setFeedback({ forceId, text: r.message, accepted: r.accepted });
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>外交</div>
            <div className={styles.titleEn}>
              {t('國庫金：', 'Diplomacy — Capital Gold:')}{' '}
              <strong>{playerCapitalGold.toLocaleString()}</strong>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        {rows.length === 0 ? (
          <div className={styles.empty}>{t('天下唯餘一勢力。', 'No other forces remain in the realm.')}</div>
        ) : (
          <ul className={styles.list}>
            {rows.map((row) => (
              <li key={row.id} className={styles.row}>
                <div className={styles.forceHead}>
                  <span
                    className={styles.colorDot}
                    style={{ background: row.color }}
                  />
                  <div className={styles.forceNames}>
                    <span className={styles.nameZh}>{row.zh}</span>
                    <span className={styles.nameEn}>{row.en}</span>
                  </div>
                  <div className={styles.relationBlock}>
                    <RelationBar score={row.relation.score} />
                    <StatusTag relation={row.relation} />
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span>
                    {t('城', 'Cities')} <strong>{row.cities}</strong>
                  </span>
                  <span>
                    {t('兵', 'Troops')} <strong>{row.troops.toLocaleString()}</strong>
                  </span>
                </div>

                {feedback?.forceId === row.id && (
                  <div
                    className={`${styles.feedback} ${
                      feedback.accepted === undefined
                        ? styles.feedbackInfo
                        : feedback.accepted
                          ? styles.feedbackOk
                          : styles.feedbackFail
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.allianceBtn}
                    onClick={() => handle(row.id, () => proposeAlliance(row.id))}
                    disabled={
                      row.relation.status === 'allied' ||
                      playerCapitalGold < ALLIANCE_PROPOSAL_COST
                    }
                    title={t('結成同盟 — 雙方禁止互攻。', 'Form a binding alliance — both sides forbidden from attacking.')}
                  >
                    {t('同盟', 'Alliance')} ({ALLIANCE_PROPOSAL_COST}{t('金', 'g')})
                  </button>
                  <button
                    className={styles.napBtn}
                    onClick={() => handle(row.id, () => proposeNAP(row.id))}
                    disabled={
                      row.relation.status !== 'neutral' ||
                      playerCapitalGold < NAP_PROPOSAL_COST
                    }
                    title={t('暫時和平 8 季。', 'Temporary peace for 8 seasons.')}
                  >
                    {t('不戰', 'NAP')} ({NAP_PROPOSAL_COST}{t('金', 'g')})
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() =>
                      handle(row.id, () => payTribute(row.id, 100))
                    }
                    disabled={playerCapitalGold < 100}
                  >
                    +100g
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() =>
                      handle(row.id, () => payTribute(row.id, 500))
                    }
                    disabled={playerCapitalGold < 500}
                  >
                    +500g
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() => setMarriageTarget(row.id)}
                    title={t('將自己武將與對方武將締姻 (1000金)', 'Forge a marriage bond between an officer of yours and one of theirs (1000g)')}
                  >
                    {t('婚姻', 'Marry')}
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() => setHostageTarget(row.id)}
                    disabled={row.relation.status === 'allied'}
                    title={t('送人質締結長期和約 (+50 好感、16 季 NAP)', 'Send a hostage to secure a long peace (+50 relation, 16-season NAP)')}
                  >
                    {t('人質', 'Hostage')}
                  </button>
                  {row.relation.status === 'allied' && (
                    <button
                      className={styles.breakBtn}
                      onClick={() => {
                        breakAlliance(row.id);
                        setFeedback({
                          forceId: row.id,
                          text: t('盟約已破，邦交受損。', 'Alliance broken. Relations damaged.'),
                          accepted: false,
                        });
                      }}
                      title={t('破棄同盟（−50 好感）', 'Break the alliance (−50 relation)')}
                    >
                      {t('絕交', 'Break')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {marriageTarget && (
          <MarriagePicker
            targetForceId={marriageTarget}
            onClose={() => setMarriageTarget(null)}
          />
        )}
        {hostageTarget && (
          <HostagePicker
            targetForceId={hostageTarget}
            onClose={() => setHostageTarget(null)}
          />
        )}
      </div>
    </div>
  );
}

function RelationBar({ score }: { score: number }) {
  const pct = (score + 100) / 2; // 0..100
  return (
    <div className={styles.relTrack}>
      <div className={styles.relCenter} />
      <div
        className={styles.relFill}
        style={{
          left: score >= 0 ? '50%' : `${pct}%`,
          width: `${Math.abs(score) / 2}%`,
          background: score >= 0 ? '#3a7dd9' : '#b8442e',
        }}
      />
      <span className={styles.relValue}>
        {score > 0 ? '+' : ''}
        {score}
      </span>
    </div>
  );
}

function StatusTag({ relation }: { relation: Relation }) {
  const t = useT();
  if (relation.status === 'allied')
    return <span className={`${styles.tag} ${styles.tagAllied}`}>{t('同盟', 'Allied')}</span>;
  if (relation.status === 'non-aggression') {
    const expires = formatDate(relation.expiresAt);
    return (
      <span className={`${styles.tag} ${styles.tagNap}`}>
        {t('不戰', 'NAP')} {expires && `→ ${expires}`}
      </span>
    );
  }
  return <span className={`${styles.tag} ${styles.tagNeutral}`}>{t('中立', 'Neutral')}</span>;
}

function formatDate(date?: GameDate): string {
  if (!date) return '';
  return `${SEASON_LABEL[date.season as Season].en.slice(0, 3)} ${date.year}`;
}
