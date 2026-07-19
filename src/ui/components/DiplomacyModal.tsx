import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
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
import { Duel3DStage } from './duel/Duel3DStage';
import { Debate3DStage } from './debate/Debate3DStage';
import { PEACE_DUEL_COST } from '../../game/systems/duelDiplomacy';
import { CONCORD_COST, TRIBUNE_COST, PERSUADE_COST, canPersuadeCity, pickCourtVoice } from '../../game/systems/debateDiplomacy';
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
  useEscapeKey(onClose);
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
  // §7.1 縱橫 — vassalage, coercion, leagues, call-to-arms.
  const demandVassalage = useGameStore((s) => s.demandVassalage);
  const seekProtection = useGameStore((s) => s.seekProtection);
  const releaseVassal = useGameStore((s) => s.releaseVassal);
  const summonVassal = useGameStore((s) => s.summonVassal);
  const demandTribute = useGameStore((s) => s.demandTribute);
  const proposeCoalition = useGameStore((s) => s.proposeCoalition);
  const answerCallToArms = useGameStore((s) => s.answerCallToArms);
  const pendingCallsToArms = useGameStore((s) => s.pendingCallsToArms);
  const answerDemand = useGameStore((s) => s.answerDemand);
  const pendingDemands = useGameStore((s) => s.pendingDemands);
  const recallHostage = useGameStore((s) => s.recallHostage);
  const requestMediation = useGameStore((s) => s.requestMediation);
  // §7.1-deep 外交再深化
  const offerTribute = useGameStore((s) => s.offerTribute);
  const proposePeaceDuel = useGameStore((s) => s.proposePeaceDuel);
  const settlePeaceDuel = useGameStore((s) => s.settlePeaceDuel);
  // 決鬥定和 — an accepted proposal fights ONE non-lethal championship bout.
  const [peaceDuel, setPeaceDuel] = useState<{ forceId: EntityId; meId: EntityId; foeId: EntityId } | null>(null);
  // 折衝樽俎 (§6.16) — an accepted parley argues out at the table instead.
  const proposeParley = useGameStore((s) => s.proposeParley);
  const settleParley = useGameStore((s) => s.settleParley);
  const proposePersuadeCity = useGameStore((s) => s.proposePersuadeCity);
  const settlePersuadeCity = useGameStore((s) => s.settlePersuadeCity);
  const [parley, setParley] = useState<{ kind: 'concord' | 'tribute'; forceId: EntityId; meId: EntityId; foeId: EntityId } | null>(null);
  const [persuade, setPersuade] = useState<{ cityId: EntityId; envoyId: EntityId; defenderId: EntityId } | null>(null);
  const exactTribute = useGameStore((s) => s.exactTribute);
  const dissolveTribute = useGameStore((s) => s.dissolveTribute);
  const proposeDefensivePact = useGameStore((s) => s.proposeDefensivePact);
  const dissolveDefensivePact = useGameStore((s) => s.dissolveDefensivePact);
  const stationCourtEnvoy = useGameStore((s) => s.stationCourtEnvoy);
  const recallCourtEnvoy = useGameStore((s) => s.recallCourtEnvoy);
  const tributePacts = useGameStore((s) => s.tributePacts);
  const defensivePacts = useGameStore((s) => s.defensivePacts);
  const courtEnvoys = useGameStore((s) => s.courtEnvoys);
  const requestPassage = useGameStore((s) => s.requestPassage);
  const passageGrants = useGameStore((s) => s.passageGrants);
  const sueForPeace = useGameStore((s) => s.sueForPeace);
  const answerPeaceOffer = useGameStore((s) => s.answerPeaceOffer);
  const pendingPeaceOffers = useGameStore((s) => s.pendingPeaceOffers);
  const officers = useGameStore((s) => s.officers);

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

  const playerForce = playerForceId ? forces[playerForceId] : null;
  const myTroops = useMemo(
    () => Object.values(cities).reduce((s, c) => (c.ownerForceId === playerForceId ? s + c.troops : s), 0),
    [cities, playerForceId],
  );
  // Allies/NAP partners eligible to be rallied into a war league.
  const leagueInvitees = useMemo(
    () => rows.filter((r) => r.relation.status === 'allied' || r.relation.status === 'non-aggression').map((r) => r.id),
    [rows],
  );
  const myVassalCount = useMemo(
    () => Object.values(forces).filter((f) => f.vassalOfForceId === playerForceId).length,
    [forces, playerForceId],
  );

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

        {pendingDemands.length > 0 && (
          <div className={styles.callsToArms}>
            <div className={styles.callsTitle}>{t('索貢來牒', 'Ultimatums')}</div>
            {pendingDemands.map((d) => {
              const from = forces[d.fromForceId];
              if (!from) return null;
              const what = d.kind === 'submit'
                ? t('逼君稱臣', 'demands you submit as vassal')
                : d.kind === 'gold' ? t('索我金帛', 'demands gold') : t('索我糧秣', 'demands grain');
              return (
                <div key={d.fromForceId} className={styles.callRow}>
                  <span className={styles.callText}>
                    {t(`${from.name.zh} 下牒 — ${what},否則興兵`, `${from.name.en} ${what} — or war`)}
                  </span>
                  <button
                    className={styles.breakBtn}
                    onClick={() => {
                      const r = answerDemand(d.fromForceId, true);
                      setFeedback({ forceId: d.fromForceId, text: r.message, accepted: false });
                    }}
                    title={t('屈服 — 輸款/稱臣息兵', 'Yield — pay up / submit to avoid war')}
                  >
                    {d.kind === 'submit' ? t('屈服稱臣', 'Submit') : t('輸款', 'Pay')}
                  </button>
                  <button
                    className={styles.allianceBtn}
                    onClick={() => {
                      const r = answerDemand(d.fromForceId, false);
                      setFeedback({ forceId: d.fromForceId, text: r.message, accepted: true });
                    }}
                    title={t('抗牒 — 寧戰不屈(即為開戰之釁)', 'Defy — refuse and accept war')}
                  >
                    {t('抗牒', 'Defy')}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pendingPeaceOffers.length > 0 && (
          <div className={styles.callsToArms}>
            <div className={styles.callsTitle}>{t('乞降求和', 'Pleas for Peace')}</div>
            {pendingPeaceOffers.map((o) => {
              const from = forces[o.fromForceId];
              if (!from) return null;
              const what = o.kind === 'vassal' ? t('願舉國稱臣', 'offers to submit as your vassal') : t('願輸款罷兵', 'offers reparations to end the war');
              return (
                <div key={o.fromForceId} className={styles.callRow}>
                  <span className={styles.callText}>
                    {t(`${from.name.zh} 遣使乞和 — ${what}`, `${from.name.en} sues for peace — ${what}`)}
                  </span>
                  <button
                    className={styles.allianceBtn}
                    onClick={() => {
                      const r = answerPeaceOffer(o.fromForceId, true);
                      setFeedback({ forceId: o.fromForceId, text: r.message, accepted: true });
                    }}
                    title={t('受降 — 取其歲幣/稱臣,罷兵言和', 'Grant terms — take their reparations / submission and end the war')}
                  >
                    {t('受降', 'Grant')}
                  </button>
                  <button
                    className={styles.breakBtn}
                    onClick={() => {
                      const r = answerPeaceOffer(o.fromForceId, false);
                      setFeedback({ forceId: o.fromForceId, text: r.message, accepted: false });
                    }}
                    title={t('不受降 — 續討滅之', 'Refuse — fight on to destroy them')}
                  >
                    {t('不受', 'Refuse')}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pendingCallsToArms.length > 0 && (
          <div className={styles.callsToArms}>
            <div className={styles.callsTitle}>{t('援盟之請', 'Calls to Arms')}</div>
            {pendingCallsToArms.map((c) => {
              const ally = forces[c.allyForceId];
              const foe = forces[c.foeForceId];
              if (!ally || !foe) return null;
              return (
                <div key={`${c.allyForceId}-${c.foeForceId}`} className={styles.callRow}>
                  <span className={styles.callText}>
                    {t(`盟友 ${ally.name.zh} 受 ${foe.name.zh} 所逼,求君發兵`, `${ally.name.en} begs your aid against ${foe.name.en}`)}
                  </span>
                  <button
                    className={styles.allianceBtn}
                    onClick={() => {
                      const r = answerCallToArms(c.allyForceId, c.foeForceId, true);
                      setFeedback({ forceId: c.foeForceId, text: r.message, accepted: true });
                    }}
                    title={t('踐盟參戰 — 對其敵宣戰,信譽上升', 'Honour the pact — declare war on the foe; your repute rises')}
                  >
                    {t('參戰', 'Answer')}
                  </button>
                  <button
                    className={styles.breakBtn}
                    onClick={() => {
                      const r = answerCallToArms(c.allyForceId, c.foeForceId, false);
                      setFeedback({ forceId: c.allyForceId, text: r.message, accepted: false });
                    }}
                    title={t('坐視盟友 — 盟誼與信譽俱損,盟約或自解', 'Sit idle — relations and repute suffer; the pact may lapse')}
                  >
                    {t('坐視', 'Ignore')}
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
                  {(() => {
                    const vof = forces[row.id]?.vassalOfForceId;
                    if (vof === playerForceId) return <span className={styles.vassalTag}>{t('我之藩屬', 'Your vassal')}</span>;
                    if (playerForce?.vassalOfForceId === row.id) return <span className={styles.vassalTag}>{t('我奉其為主', 'Your suzerain')}</span>;
                    if (vof && forces[vof]) return <span className={styles.vassalTag}>{t(`${forces[vof].name.zh}之屬`, `Vassal of ${forces[vof].name.en}`)}</span>;
                    return null;
                  })()}
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
                    className={styles.napBtn}
                    onClick={() => {
                      const r = proposePeaceDuel(row.id);
                      if (!r.ok) {
                        setFeedback({ forceId: row.id, text: r.reason === 'no-gold' ? t(`需 ${PEACE_DUEL_COST} 金遣使下書。`, `Needs ${PEACE_DUEL_COST} gold for the envoy.`) : r.reason === 'foe-no-champion' ? t('彼國無將可出。', 'They have no champion to send.') : t('無法決鬥定和。', 'Cannot propose a duel of peace.'), accepted: false });
                        return;
                      }
                      if (!r.accepted) { setFeedback({ forceId: row.id, text: r.message ?? '', accepted: false }); return; }
                      setPeaceDuel({ forceId: row.id, meId: r.myChampionId!, foeId: r.foeChampionId! });
                    }}
                    disabled={row.relation.status !== 'neutral' || playerCapitalGold < PEACE_DUEL_COST}
                    title={t('決鬥定和 — 兩國各出一將,點到為止,一戰息兵:無論勝負皆締互不侵犯;敗方納金、勝方得威。以戰止戰。', 'Duel of peace — each realm sends a champion for ONE non-lethal bout; either way both swear non-aggression, the loser pays an indemnity. War settled in an afternoon.')}
                  >
                    ⚔ {t('決鬥定和', 'Peace Duel')} ({PEACE_DUEL_COST}{t('金', 'g')})
                  </button>
                  <button
                    className={styles.napBtn}
                    onClick={() => {
                      const r = proposeParley('concord', row.id);
                      if (!r.ok) {
                        setFeedback({ forceId: row.id, text: r.reason === 'no-gold' ? t(`需 ${CONCORD_COST} 金設樽俎之會。`, `Needs ${CONCORD_COST} gold for the banquet.`) : r.reason === 'foe-no-voice' ? t('彼國無士可辯。', 'They have no voice to send.') : t('無法折衝樽俎。', 'Cannot propose a parley.'), accepted: false });
                        return;
                      }
                      if (!r.accepted) { setFeedback({ forceId: row.id, text: r.message ?? '', accepted: false }); return; }
                      setParley({ kind: 'concord', forceId: row.id, meId: r.myVoiceId!, foeId: r.foeVoiceId! });
                    }}
                    disabled={row.relation.status !== 'neutral' || playerCapitalGold < CONCORD_COST}
                    title={t('折衝樽俎 — 兩國各出一士,舌戰一場息兵:無論勝負皆締互不侵犯;辯負者納金。不戰而屈人之兵。', 'Parley of concord — each realm sends its keenest tongue for ONE debate; either way both swear non-aggression, the loser pays. War settled over the banquet table.')}
                  >
                    💬 {t('折衝定和', 'Concord Parley')} ({CONCORD_COST}{t('金', 'g')})
                  </button>
                  <button
                    className={styles.tributeBtn}
                    onClick={() => {
                      const r = proposeParley('tribute', row.id);
                      if (!r.ok) {
                        setFeedback({ forceId: row.id, text: r.reason === 'no-gold' ? t(`需 ${TRIBUNE_COST} 金遣使齎書。`, `Needs ${TRIBUNE_COST} gold for the envoy.`) : t('無法責讓。', 'Cannot send the remonstrance.'), accepted: false });
                        return;
                      }
                      if (!r.accepted) { setFeedback({ forceId: row.id, text: r.message ?? '', accepted: false }); return; }
                      setParley({ kind: 'tribute', forceId: row.id, meId: r.myVoiceId!, foeId: r.foeVoiceId! });
                    }}
                    disabled={playerCapitalGold < TRIBUNE_COST}
                    title={t('責讓索貢 — 遣辯士數其之罪,辯服其庭則納貢輸金;然無論成敗皆傷和氣、積其怨。', 'Remonstrance — send an envoy to read them their sins; out-argue their court and they pay tribute. Either way the air chills.')}
                  >
                    📜 {t('責讓索貢', 'Demand Tribute')} ({TRIBUNE_COST}{t('金', 'g')})
                  </button>
                  {/* 舌戰說降 — a weakly-held wall of theirs may be argued open. */}
                  {(() => {
                    const targets = Object.values(cities).filter((c) =>
                      c.ownerForceId === row.id && canPersuadeCity(c, forces[row.id]?.capitalCityId === c.id).ok);
                    if (!targets.length) return null;
                    const envoy = playerForceId ? pickCourtVoice(officers, playerForceId) : null;
                    return (
                      <select
                        defaultValue=""
                        disabled={playerCapitalGold < PERSUADE_COST || !envoy}
                        onChange={(e) => {
                          const cid = e.target.value;
                          if (!cid || !envoy) return;
                          e.target.value = '';
                          const r = proposePersuadeCity(cid, envoy.id);
                          if (!r.ok) {
                            setFeedback({ forceId: row.id, text: r.reason === 'no-gold' ? t(`需 ${PERSUADE_COST} 金遣使赴城。`, `Needs ${PERSUADE_COST} gold for the envoy.`) : t('此城不可說降。', 'That wall will not hear it.'), accepted: false });
                            return;
                          }
                          if (!r.accepted) { setFeedback({ forceId: row.id, text: r.message ?? '', accepted: false }); return; }
                          setPersuade({ cityId: cid, envoyId: envoy.id, defenderId: r.defenderId! });
                        }}
                        title={t(`舌戰說降 — 遣辯士至其弱城(守軍≤2500)城下論戰:罵倒守將則開城來降;辯勝亦令其軍心離散。耗 ${PERSUADE_COST} 金。`, `Persuade a weakly-held city (garrison ≤2500): rout its keeper in argument and the gates open without a corpse. ${PERSUADE_COST} gold.`)}
                        style={{ padding: '0.2rem 0.3rem', borderRadius: 4, background: '#10161e', border: '1px solid #8ec8a0', color: '#bfe6cf', fontSize: '0.76rem', fontFamily: 'inherit' }}
                      >
                        <option value="">🏯 {t('舌戰說降…', 'Persuade a city…')} ({PERSUADE_COST}{t('金', 'g')})</option>
                        {targets.map((c) => (
                          <option key={c.id} value={c.id}>{t(c.name.zh, c.name.en)} · {t('守', 'grn')} {c.troops}</option>
                        ))}
                      </select>
                    );
                  })()}
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
                  {/* §7.1-deep 歲幣 / 攻守同盟 / 常駐使節 */}
                  {(() => {
                    const payingThem = (tributePacts ?? []).some((p) => p.payerForceId === playerForceId && p.payeeForceId === row.id);
                    const exactingThem = (tributePacts ?? []).some((p) => p.payerForceId === row.id && p.payeeForceId === playerForceId);
                    const bonded = (defensivePacts ?? []).some((p) => p.forceA === row.id || p.forceB === row.id);
                    const envoyHere = !!courtEnvoys?.[row.id];
                    const ablestIdle = Object.values(officers)
                      .filter((o) => o.forceId === playerForceId && o.status === 'idle' && !o.task && o.locationCityId != null && cities[o.locationCityId]?.ownerForceId === playerForceId)
                      .sort((a, b) => (b.stats.intelligence + b.stats.charisma) - (a.stats.intelligence + a.stats.charisma))[0];
                    const wrap = (r: { ok: boolean; reason?: string }) => ({ ok: r.ok, message: r.ok ? '' : (r.reason ?? '') });
                    return <>
                      <button className={styles.tributeBtn}
                        onClick={() => handle(row.id, () => wrap(payingThem || exactingThem ? dissolveTribute(row.id) : offerTribute(row.id, 300)))}
                        title={t('歲幣買安 — 每季輸 300 金換其不犯(再按取消)', 'Pay 300 gold/season for a firm peace (click again to end)')}
                      >{payingThem ? t('歲幣✓', 'Tribute✓') : t('歲幣', 'Tribute')}</button>
                      <button className={styles.tributeBtn}
                        onClick={() => handle(row.id, () => wrap(exactingThem ? dissolveTribute(row.id) : exactTribute(row.id, 300)))}
                        title={t('勒索歲貢 — 壓其勢/持討伐令,每季勒 300 金', 'Extort 300 gold/season from a much weaker or war-marked rival')}
                      >{exactingThem ? t('勒貢✓', 'Exact✓') : t('勒貢', 'Exact')}</button>
                      <button className={styles.tributeBtn}
                        onClick={() => handle(row.id, () => wrap(bonded ? dissolveDefensivePact(row.id) : proposeDefensivePact(row.id)))}
                        title={t('攻守同盟·連橫 — 盟友共享你的討伐令(須同盟或關係≥40)', 'Defensive bloc — the ally shares your casus belli (needs alliance / relation ≥40)')}
                      >{bonded ? t('攻守✓', 'Bloc✓') : t('攻守', 'Bloc')}</button>
                      <button className={styles.tributeBtn}
                        disabled={!envoyHere && !ablestIdle}
                        onClick={() => handle(row.id, () => wrap(envoyHere ? recallCourtEnvoy(row.id) : ablestIdle ? stationCourtEnvoy(ablestIdle.id, row.id) : { ok: false, reason: 'no idle officer' }))}
                        title={t('朝聘常駐使 — 遣一員常駐其朝:維關係、探情報、預警其動(再按召還)', 'Station a resident envoy: holds ties, gathers intel, warns of their designs (click to recall)')}
                      >{envoyHere ? t('召使', 'Recall') : t('常駐使', 'Envoy')}</button>
                    </>;
                  })()}
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

                {(() => {
                  const isMyVassal = forces[row.id]?.vassalOfForceId === playerForceId;
                  const iAmTheirVassal = playerForce?.vassalOfForceId === row.id;
                  const iAmAnyVassal = !!playerForce?.vassalOfForceId;
                  const neutral = row.relation.status === 'neutral';
                  const allied = row.relation.status === 'allied';
                  const weaker = row.troops < myTroops * 0.7;
                  const muchWeaker = row.troops < myTroops * 0.5;
                  const stronger = row.troops > myTroops * 1.4;
                  const canCoerce = !allied && !isMyVassal && !iAmTheirVassal;
                  const myHostageHere = Object.values(officers).find(
                    (o) => o.hostageOfForceId === row.id && o.forceId === playerForceId && o.status !== 'dead',
                  );
                  const isPartner = allied || row.relation.status === 'non-aggression';
                  const hasPassage = (passageGrants ?? []).some((g) => g.grantorForceId === row.id && g.granteeForceId === playerForceId);
                  const showRow = isMyVassal || iAmTheirVassal || !!myHostageHere || isPartner ||
                    (canCoerce && (neutral || leagueInvitees.length > 0 || myVassalCount > 0));
                  if (!showRow) return null;
                  return (
                    <div className={styles.actions}>
                      {isPartner && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => !hasPassage && handle(row.id, () => requestPassage(row.id))}
                          disabled={hasPassage}
                          title={t('假途借道 — 求其許我假道,可經其境擊其外之敵(8季);亦可假途滅虢', 'Ask for passage — march through their land to strike foes beyond it (8 seasons); or betray the host (假途滅虢)')}
                        >
                          {hasPassage ? t('借道✓', 'Passage✓') : t('借道', 'Passage')}
                        </button>
                      )}
                      {myHostageHere && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => handle(row.id, () => recallHostage(myHostageHere.id))}
                          title={t(`索還質子 ${myHostageHere.name.zh} — 撤回人質,對方稍以為憾`, `Recall your hostage ${myHostageHere.name.en} — withdraws the surety, the keeper cools a little`)}
                        >
                          {t('索還質子', 'Recall hostage')}
                        </button>
                      )}
                      {isMyVassal && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => handle(row.id, () => releaseVassal(row.id))}
                          title={t('釋放藩屬 — 復其自主,以德懷之', 'Free this vassal — a magnanimous, relation-warming act')}
                        >
                          {t('釋放', 'Free')}
                        </button>
                      )}
                      {iAmTheirVassal && (
                        <button
                          className={styles.breakBtn}
                          onClick={() => handle(row.id, () => releaseVassal(row.id))}
                          title={t('背主自立 — 不復臣屬(信譽 −20、宿主含怨)', 'Renounce your vassalage (−20 credibility, the lord nurses a grudge)')}
                        >
                          {t('背主自立', 'Renounce')}
                        </button>
                      )}
                      {canCoerce && neutral && !iAmAnyVassal && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => handle(row.id, () => demandVassalage(row.id))}
                          disabled={!weaker}
                          title={t('招撫稱臣 — 逼弱邦俯首為藩屬(納貢、可徵召)', 'Demand a weaker realm bow as your vassal (tribute + summonable)')}
                        >
                          {t('招撫稱臣', 'Subjugate')}
                        </button>
                      )}
                      {canCoerce && neutral && stronger && myVassalCount === 0 && !iAmAnyVassal && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => handle(row.id, () => seekProtection(row.id))}
                          title={t('納款稱臣 — 奉強鄰為主,以求庇護', 'Offer yourself as a stronger realm’s vassal for protection')}
                        >
                          {t('納款稱臣', 'Submit')}
                        </button>
                      )}
                      {canCoerce && (
                        <button
                          className={styles.coerceBtn}
                          onClick={() => handle(row.id, () => demandTribute(row.id, 'gold'))}
                          disabled={!weaker}
                          title={t('索貢 — 以戰相脅,勒其金帛(拒則開戰)', 'Extort gold under threat of war (refusal is a casus belli)')}
                        >
                          {t('索貢', 'Extort')}
                        </button>
                      )}
                      {canCoerce && (
                        <button
                          className={styles.coerceBtn}
                          onClick={() => handle(row.id, () => demandTribute(row.id, 'submit'))}
                          disabled={!muchWeaker || iAmAnyVassal}
                          title={t('最後通牒 — 逼其稱臣,否則兵戎相見', 'Ultimatum: submit as vassal or face war')}
                        >
                          {t('逼降', 'Ultimatum')}
                        </button>
                      )}
                      {canCoerce && leagueInvitees.length > 0 && (
                        <button
                          className={styles.coerceBtn}
                          onClick={() => handle(row.id, () => proposeCoalition(row.id, leagueInvitees))}
                          title={t('共討會盟 — 號召盟友共擊此敵(數季協同)', 'Forge a war league — rally your allies to jointly attack this foe')}
                        >
                          {t('共討', 'Coalition')}
                        </button>
                      )}
                      {canCoerce && neutral && (() => {
                        // Auto-pick the weightiest third realm the foe most respects.
                        const broker = rows
                          .filter((r) => r.id !== row.id)
                          .map((r) => ({ r, rapport: getRelation(diplomacy, r.id, row.id).score, troops: r.troops }))
                          .sort((a, b) => (b.rapport + b.troops / 5000) - (a.rapport + a.troops / 5000))[0];
                        if (!broker) return null;
                        return (
                          <button
                            className={styles.tributeBtn}
                            onClick={() => handle(row.id, () => requestMediation(broker.r.id, row.id))}
                            disabled={playerCapitalGold < 600}
                            title={t(`調停斡旋 — 請 ${broker.r.zh} 居中調停,與其罷兵(600金)`, `Pay ${broker.r.en} to broker a truce with this foe (600g)`)}
                          >
                            {t('調停', 'Mediate')}
                          </button>
                        );
                      })()}
                      {canCoerce && neutral && row.relation.score < 0 && (
                        <button
                          className={styles.tributeBtn}
                          onClick={() => handle(row.id, () => sueForPeace(row.id))}
                          title={t('求和 — 輸歲幣乞和,締互不侵犯(對方占優則不允)', 'Sue for peace — offer reparations for a NAP (a winning foe refuses)')}
                        >
                          {t('求和', 'Sue peace')}
                        </button>
                      )}
                      {canCoerce && myVassalCount > 0 && (
                        <button
                          className={styles.coerceBtn}
                          onClick={() => handle(row.id, () => {
                            const vassals = Object.values(forces).filter((f) => f.vassalOfForceId === playerForceId);
                            let last = { ok: false, message: t('無藩屬可徵召。', 'No vassals to summon.') };
                            for (const v of vassals) last = summonVassal(v.id, row.id);
                            return last;
                          })}
                          title={t('徵召藩屬 — 命麾下藩屬出兵討之', 'Summon your vassals to war against this foe')}
                        >
                          {t('徵召討之', 'Summon')}
                        </button>
                      )}
                    </div>
                  );
                })()}
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
        {/* 決鬥定和 — the accepted challenge fights out here: ONE non-lethal bout
            (點到為止), then the settlement binds either way (settlePeaceDuel). */}
        {peaceDuel && officers[peaceDuel.meId] && officers[peaceDuel.foeId] && (
          <Duel3DStage
            attacker={officers[peaceDuel.meId]}
            defender={officers[peaceDuel.foeId]}
            lethal={false}
            difficulty="veteran"
            onComplete={(outcome) => {
              const pd = peaceDuel;
              setPeaceDuel(null);
              const oc = outcome.winner === 'attacker' ? 'win' : outcome.winner === 'defender' ? 'loss' : 'draw';
              const r = settlePeaceDuel(pd.forceId, pd.meId, pd.foeId, oc);
              setFeedback({ forceId: pd.forceId, text: r.message, accepted: oc !== 'loss' });
            }}
          />
        )}
        {/* 折衝樽俎 — the accepted parley argues out here: ONE war of words at the
            table, then settleParley applies the terms either way. */}
        {parley && officers[parley.meId] && officers[parley.foeId] && (
          <Debate3DStage
            me={officers[parley.meId]}
            foe={officers[parley.foeId]}
            difficulty="peerless"
            onComplete={(outcome) => {
              const p = parley;
              setParley(null);
              const oc = outcome.winner === 'me' ? 'win' : outcome.winner === 'foe' ? 'loss' : 'draw';
              const r = settleParley(p.kind, p.forceId, p.meId, p.foeId, oc, outcome.winner === 'me' && outcome.routed);
              setFeedback({ forceId: p.forceId, text: r.message, accepted: oc !== 'loss' });
            }}
          />
        )}
        {/* 舌戰說降 — the envoy argues at the wall; a 罵倒 opens the gates. */}
        {persuade && officers[persuade.envoyId] && officers[persuade.defenderId] && (
          <Debate3DStage
            me={officers[persuade.envoyId]}
            foe={officers[persuade.defenderId]}
            difficulty="peerless"
            onComplete={(outcome) => {
              const p = persuade;
              setPersuade(null);
              const oc = outcome.winner === 'me' ? 'win' : outcome.winner === 'foe' ? 'loss' : 'draw';
              const owner = cities[p.cityId]?.ownerForceId;
              const r = settlePersuadeCity(p.cityId, p.envoyId, p.defenderId, oc, outcome.winner === 'me' && outcome.routed);
              if (owner) setFeedback({ forceId: owner, text: r.message, accepted: oc === 'win' });
            }}
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
