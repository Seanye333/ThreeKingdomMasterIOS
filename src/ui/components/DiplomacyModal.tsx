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
import { Icon } from './Icon';
import { Name } from './Name';
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
  const requestGrain = useGameStore((s) => s.requestGrain);
  const proposeTradeTreaty = useGameStore((s) => s.proposeTradeTreaty);
  const breakAlliance = useGameStore((s) => s.breakAlliance);
  const breakMarriageAlliance = useGameStore((s) => s.breakMarriageAlliance);
  const marriageAlliances = useGameStore((s) => s.marriageAlliances);
  const grudges = useGameStore((s) => s.grudges);
  const tradePartners = useGameStore((s) => s.tradePartners);
  const credibility = useGameStore((s) => (playerForceId ? s.credibility[playerForceId] : undefined) ?? 100);

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
            <div className={styles.titleZh}>{t('外交', 'Diplomacy')}</div>
            <div className={styles.titleEn}>
              {t('國庫金：', 'Diplomacy — Capital Gold:')}{' '}
              <Icon name="gold" size={13} color="#e6c473" style={{ verticalAlign: '-0.12em' }} /> <strong>{playerCapitalGold.toLocaleString()}</strong>
              {' · '}
              <span title={t('背盟則損,守信漸復;低信譽他國難與結盟。', 'Falls when you break pacts, recovers as you honour them; low credibility makes others wary.')}>
                {t('信譽', 'Credibility')}{' '}
                <strong style={{ color: credibility >= 80 ? '#7ed68a' : credibility >= 50 ? '#e6c473' : '#e0707a' }}>
                  {credibility}
                </strong>
              </span>
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
                    <span className={styles.nameZh}><Name pair={{ zh: row.zh, en: row.en }} /></span>
                  </div>
                  <div className={styles.relationBlock}>
                    <RelationBar score={row.relation.score} />
                    <StatusTag relation={row.relation} />
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="city" size={12} color="#8a98a4" />{t('城', 'Cities')} <strong>{row.cities}</strong>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="war" size={12} color="#8a98a4" />{t('兵', 'Troops')} <strong>{row.troops.toLocaleString()}</strong>
                  </span>
                  {(grudges[row.id] ?? 0) >= 15 && (
                    <span title={t('對我方積怨 — 越高越難議和結盟', 'Resentment toward you — high grudges make pacts hard')}>
                      {t('積怨', 'Grudge')} <strong style={{ color: (grudges[row.id] ?? 0) >= 50 ? '#e0707a' : '#e0a070' }}>{grudges[row.id] ?? 0}</strong>
                    </span>
                  )}
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
                    onClick={() => handle(row.id, () => requestGrain(row.id))}
                    disabled={row.relation.status === 'neutral' && row.relation.score < 20}
                    title={t('向友邦借糧,濟入都城(盟友慷慨,中立須交好)', "Ask a friendly power for grain (allies are generous; a neutral must be on good terms)")}
                  >
                    {t('借糧', 'Grain')}
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() => handle(row.id, () => proposeTradeTreaty(row.id))}
                    disabled={row.relation.status === 'neutral' || tradePartners.includes(row.id)}
                    title={t('締結通商條約 — 和平期間兩國歲入俱增(需同盟或互不侵犯)', 'Open a trade treaty — both earn steady income while at peace (needs alliance or NAP)')}
                  >
                    {tradePartners.includes(row.id) ? t('通商✓', 'Trade✓') : t('通商', 'Trade')}
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
                  {(() => {
                    const married = marriageAlliances.some(
                      (m) => m.forceA === row.id || m.forceB === row.id,
                    );
                    if (married) {
                      return (
                        <button
                          className={styles.breakBtn}
                          onClick={() => {
                            const r = breakMarriageAlliance(row.id);
                            setFeedback({
                              forceId: row.id,
                              text: r.ok
                                ? t('聯姻之盟撕毀 — 背信之名播於四鄰。', 'Marriage alliance renounced — branded an oathbreaker.')
                                : r.message,
                              accepted: false,
                            });
                          }}
                          title={t('背信棄義 — 撕毀聯姻同盟（與該國及他國好感俱崩）', 'Renounce the marriage alliance (relation crash with them AND all others)')}
                        >
                          {t('背盟', 'Renounce')}
                        </button>
                      );
                    }
                    if (row.relation.status === 'allied') {
                      return (
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
                      );
                    }
                    return null;
                  })()}
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
