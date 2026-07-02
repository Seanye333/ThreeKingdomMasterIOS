import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { TRIBES, TRIBES_BY_ID } from '../../game/data/tribes';
import { canCampaignTribe } from '../../game/systems/tribes';
import {
  emptyTribeDiplomacy,
  tribesShareFrontier,
  HEQIN_COST,
  HEQIN_YEARS,
  TRIBE_MARKET_COST,
  INCITE_COST,
  TRIBE_CLASH_COST,
  MENG_HUO_SUBMIT_CAPTURES,
} from '../../game/systems/tribesDiplomacy';
import type { EntityId } from '../../game/types';
import { useT, useLanguage, pickName } from '../i18n';

interface Props {
  tribeId: string;
  onClose: () => void;
}

/** 異族部落 — frontier tribe diplomacy/war panel. Mirrors FortPanel's flow
 *  (pick officer + troops to campaign) but the target is a raid-source tribe
 *  rather than a capturable strongpoint. */
export function TribePanel({ tribeId, onClose }: Props) {
  const tribe = TRIBES_BY_ID[tribeId];
  const cities = useGameStore((s) => s.cities);
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const aggression = useGameStore((s) =>
    (s.tribeState.aggression as Record<string, number>)[tribeId] ?? tribe?.baseAggression ?? 0);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });
  const subjugateTribe = useGameStore((s) => s.subjugateTribe);
  const placateTribe = useGameStore((s) => s.placateTribe);
  const diplo = useGameStore((s) => s.tribeDiplomacy) ?? emptyTribeDiplomacy();
  const forces = useGameStore((s) => s.forces);
  const year = useGameStore((s) => s.date.year);
  const proposeTribeMarriage = useGameStore((s) => s.proposeTribeMarriage);
  const openTribeMarket = useGameStore((s) => s.openTribeMarket);
  const requestTribeHostage = useGameStore((s) => s.requestTribeHostage);
  const inciteTribeRaid = useGameStore((s) => s.inciteTribeRaid);
  const clashTribes = useGameStore((s) => s.clashTribes);
  const resolveMengHuoCapture = useGameStore((s) => s.resolveMengHuoCapture);
  const t = useT();
  const lang = useLanguage();

  const [pickOfficer, setPickOfficer] = useState<EntityId | null>(null);
  const [troops, setTroops] = useState(5000);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [inciteTarget, setInciteTarget] = useState('');
  const [clashOther, setClashOther] = useState('');
  const [mengHuoPending, setMengHuoPending] = useState(false);

  const candidates = useMemo(() => {
    if (!playerForceId || !tribe) return [];
    const validSourceCityIds = new Set<string>();
    for (const cid of tribe.raidableCityIds) {
      const c = cities[cid];
      if (!c) continue;
      if (c.ownerForceId === playerForceId) validSourceCityIds.add(c.id);
      for (const adjId of c.adjacentCityIds ?? []) {
        if (cities[adjId]?.ownerForceId === playerForceId) validSourceCityIds.add(adjId);
      }
    }
    return Object.values(officersMap)
      .filter((o) =>
        o.forceId === playerForceId
        && (o.status === 'idle' || o.status === 'active')
        && o.locationCityId
        && validSourceCityIds.has(o.locationCityId),
      )
      .map((o) => ({ officer: o, city: cities[o.locationCityId!]! }))
      .sort((a, b) => b.officer.stats.war - a.officer.stats.war);
  }, [tribe, cities, officersMap, playerForceId]);

  if (!tribe) return null;
  const reach = playerForceId
    ? canCampaignTribe(tribe, cities, playerForceId)
    : { ok: false, reason: 'No player force.' };
  const chosen = candidates.find((c) => c.officer.id === pickOfficer);
  const maxTroops = chosen ? chosen.city.troops : 0;
  if (candidates.length > 0 && !pickOfficer) setPickOfficer(candidates[0].officer.id);
  // 威脅 — aggression capped to ~0.4 for the bar.
  const threatPct = Math.max(0, Math.min(1, aggression / 0.4));
  const color = tribe.color;

  const doSubjugate = () => {
    if (!pickOfficer) return;
    const r = subjugateTribe(tribe.id, pickOfficer, Math.min(troops, maxTroops));
    setFeedback({ ok: r.ok, text: r.message });
    if (r.mengHuo && !r.mengHuo.submitted) setMengHuoPending(true);
  };
  const doPlacate = () => {
    const r = placateTribe(tribe.id);
    setFeedback({ ok: r.ok, text: r.message });
  };

  // §8.3-deep — pact status for this tribe.
  const pact = diplo.pacts[tribe.id] ?? {};
  const marriageLeft = pact.marriageYear ? Math.max(0, HEQIN_YEARS - (year - pact.marriageYear)) : 0;
  const incite = diplo.incitements[tribe.id];
  const submitted = !!diplo.submitted[tribe.id];
  const founded = !!diplo.foundedStates[tribe.id];
  const captures = tribe.id === 'nanban' ? (diplo.mengHuoCaptures ?? 0) : 0;
  // 以夷制夷 target candidates — rival forces holding this tribe's frontier.
  const inciteTargets = useMemo(() => {
    const owners = new Set(
      tribe.raidableCityIds.map((id) => cities[id]?.ownerForceId).filter((f): f is string => !!f && f !== playerForceId),
    );
    return [...owners].map((id) => forces[id]).filter(Boolean);
  }, [tribe, cities, forces, playerForceId]);
  const clashCandidates = useMemo(
    () => TRIBES.filter((other) => other.id !== tribe.id && tribesShareFrontier(tribe, other)),
    [tribe],
  );
  const smallBtn = (enabled: boolean, color: string): React.CSSProperties => ({
    background: 'transparent', color: enabled ? color : '#97a4ae',
    border: `1px solid ${enabled ? color : '#364654'}`,
    padding: '0.3rem 0.6rem', cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
    opacity: enabled ? 1 : 0.5,
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#10161e',
          border: `2px solid ${color}`,
          padding: '1rem 1.2rem',
          color: '#eef4f8',
          fontFamily: 'var(--tkm-font-body)',
          minWidth: 360, maxWidth: 470,
          boxShadow: `0 0 16px ${color}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              ⛺ {pickName(tribe.name, lang)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#97a4ae' }}>
              {tribe.name.en} · {t('異族部落', 'Frontier Tribe')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#97a4ae',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#c8b89a', lineHeight: 1.5 }}>
          {tribe.descriptionZh ?? tribe.description}
        </div>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#7a8893' }}>{t('威脅', 'Threat')}</span>
          <span>
            <div style={{ height: 8, background: '#1e2832', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative', width: '100%' }}>
              <div style={{
                height: '100%', width: `${Math.round(threatPct * 100)}%`,
                background: threatPct > 0.6 ? '#b8442e' : threatPct > 0.3 ? '#c9a64e' : '#7ed68a',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#97a4ae' }}>
              {threatPct > 0.6 ? t('蠢蠢欲動', 'Restless') : threatPct > 0.3 ? t('時有寇邊', 'Probing') : t('暫且安分', 'Quiet')}
            </span>
          </span>

          <span style={{ color: '#7a8893' }}>{t('寇邊', 'Raids')}</span>
          <span style={{ fontSize: '0.78rem' }}>
            {tribe.raidableCityIds.map((id) => (cities[id] ? pickName(cities[id].name, lang) : id)).join(' · ')}
          </span>

          {(marriageLeft > 0 || pact.marketOpen || pact.hostageOfficerId || incite || submitted || founded || captures > 0) && (
            <>
              <span style={{ color: '#7a8893' }}>{t('盟約', 'Pacts')}</span>
              <span style={{ fontSize: '0.76rem', color: '#9ec8b0' }}>
                {submitted && <span>🤝 {t('傾心臣服(七擒之義)', 'Fully submitted')}　</span>}
                {founded && <span style={{ color: '#ff9a70' }}>👑 {t('已據漢城立國!', 'Founded a state on Han soil!')}　</span>}
                {marriageLeft > 0 && <span>💍 {t(`和親(餘 ${marriageLeft} 年)`, `Marriage (${marriageLeft}y left)`)}　</span>}
                {pact.marketOpen && <span>🏪 {t('互市通商', 'Market open')}　</span>}
                {pact.hostageOfficerId && <span>🧒 {t('質子在朝', 'Hostage at court')}　</span>}
                {incite && <span style={{ color: '#e8b070' }}>🗡 {t(`受唆使寇${forces[incite.targetForceId]?.name.zh ?? '?'}(餘 ${incite.seasonsLeft} 季)`, 'Incited')}　</span>}
                {captures > 0 && !submitted && <span>⛓ {t(`七擒進度 ${captures}/${MENG_HUO_SUBMIT_CAPTURES}`, `Captures ${captures}/${MENG_HUO_SUBMIT_CAPTURES}`)}</span>}
              </span>
            </>
          )}
        </div>

        {mengHuoPending && (
          <div style={{
            marginTop: '0.7rem', padding: '0.5rem 0.7rem',
            background: 'rgba(40, 32, 14, 0.55)', border: '1px solid #e6c473',
          }}>
            <div style={{ fontSize: '0.82rem', color: '#f2dd9a', marginBottom: 6 }}>
              {t(`孟獲已為階下之囚(第 ${captures} 擒)。斬之立威,抑或縱之服其心?`,
                 `Meng Huo kneels in chains (capture ${captures}). The sword, or the long game?`)}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={smallBtn(true, '#9ed68a')}
                onClick={() => { const r = resolveMengHuoCapture(true); setFeedback({ ok: r.ok, text: r.message }); setMengHuoPending(false); }}
              >{t('義釋之(七擒之道)', 'Release him')}</button>
              <button
                style={smallBtn(true, '#ff8060')}
                onClick={() => { const r = resolveMengHuoCapture(false); setFeedback({ ok: r.ok, text: r.message }); setMengHuoPending(false); }}
              >{t('斬之(南中必亂)', 'Execute him')}</button>
            </div>
          </div>
        )}

        {reach.ok && candidates.length > 0 && (
          <div style={{
            marginTop: '0.7rem', padding: '0.5rem 0.7rem',
            background: 'rgba(60, 26, 22, 0.4)', border: '1px solid #b8442e',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#ff8060', marginBottom: '0.4rem' }}>
              {t('選將出征：', 'Pick officer to campaign:')}
            </div>
            <select
              value={pickOfficer ?? ''}
              onChange={(e) => {
                setPickOfficer(e.target.value);
                const c = candidates.find((c) => c.officer.id === e.target.value);
                if (c) setTroops(Math.min(5000, c.city.troops));
              }}
              style={{
                width: '100%', padding: '0.3rem 0.5rem',
                background: '#10161e', color: '#eef4f8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', marginBottom: '0.4rem',
              }}
            >
              {candidates.map(({ officer: o, city }) => (
                <option key={o.id} value={o.id}>
                  {pickName(o.name, lang)} (WAR {o.stats.war}) @ {pickName(city.name, lang)} ({city.troops.toLocaleString()}t)
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              {t('兵力', 'Troops')}: <strong>{troops.toLocaleString()}</strong> / {maxTroops.toLocaleString()}
            </div>
            <input
              type="range" min={1000} max={Math.max(1000, maxTroops)} step={500}
              value={troops}
              onChange={(e) => setTroops(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ marginTop: '0.9rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={doSubjugate}
            disabled={!reach.ok || candidates.length === 0 || !pickOfficer}
            title={reach.ok ? '' : (reach.reason ?? '')}
            style={{
              background: '#3a1a1a', color: reach.ok ? '#ff8060' : '#97a4ae',
              border: `1px solid ${reach.ok ? '#b8442e' : '#364654'}`,
              padding: '0.4rem 0.8rem', cursor: reach.ok ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
              opacity: reach.ok ? 1 : 0.5,
            }}
          >{t('征討', 'Subjugate')}</button>
          <button
            onClick={doPlacate}
            disabled={playerCapitalGold < 400}
            title={t('賜物招撫,降低威脅', 'Gifts to cool their aggression')}
            style={{
              background: '#1a2a3a', color: '#e6c473',
              border: '1px solid #e6c473',
              padding: '0.4rem 0.8rem', cursor: playerCapitalGold < 400 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
              opacity: playerCapitalGold < 400 ? 0.4 : 1,
            }}
          >{t('招撫', 'Placate')} (−400g)</button>
        </div>

        {/* §8.3-deep 異族內交 — 和親/互市/質子 */}
        {!submitted && !founded && (
          <div style={{ marginTop: '0.6rem', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              style={smallBtn(marriageLeft <= 0 && playerCapitalGold >= HEQIN_COST, '#e8a0c0')}
              disabled={marriageLeft > 0 || playerCapitalGold < HEQIN_COST}
              title={t('嫁宗女以結其歡 — 一代人之內不寇我境(極怒仍可能背盟)', 'A generation of peace toward YOUR cities')}
              onClick={() => { const r = proposeTribeMarriage(tribe.id); setFeedback({ ok: r.ok, text: r.message }); }}
            >💍 {t('和親', 'Marriage')} (−{HEQIN_COST}g)</button>
            <button
              style={smallBtn(!pact.marketOpen && playerCapitalGold >= TRIBE_MARKET_COST, '#9ec8b0')}
              disabled={!!pact.marketOpen || playerCapitalGold < TRIBE_MARKET_COST}
              title={t('開邊互市 — 每季市利+偶得胡騎,其性漸馴;邊釁熾則市斷', 'Seasonal coin + horsemen; cools aggression')}
              onClick={() => { const r = openTribeMarket(tribe.id); setFeedback({ ok: r.ok, text: r.message }); }}
            >🏪 {t('互市', 'Market')} (−{TRIBE_MARKET_COST}g)</button>
            <button
              style={smallBtn(!pact.hostageOfficerId && aggression <= 0.12, '#9ad6e8')}
              disabled={!!pact.hostageOfficerId || aggression > 0.12}
              title={t('威服(侵略度≤0.12)方可徵質 — 質子入朝為將,其部不敢大舉', 'Needs aggression ≤0.12; the prince serves you')}
              onClick={() => { const r = requestTribeHostage(tribe.id); setFeedback({ ok: r.ok, text: r.message }); }}
            >🧒 {t('徵質子', 'Hostage')}</button>
          </div>
        )}

        {/* §8.3-deep 以夷制夷 */}
        {!submitted && !founded && (inciteTargets.length > 0 || clashCandidates.length > 0) && (
          <div style={{ marginTop: '0.6rem', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: '0.78rem' }}>
            {inciteTargets.length > 0 && !incite && (
              <>
                <select
                  value={inciteTarget}
                  onChange={(e) => setInciteTarget(e.target.value)}
                  style={{ background: '#10161e', color: '#e6c473', border: '1px solid #364654', padding: '0.25rem', fontFamily: 'inherit', fontSize: '0.75rem' }}
                >
                  <option value="">{t('嗾其寇…', 'Sic on…')}</option>
                  {inciteTargets.map((f) => <option key={f!.id} value={f!.id}>{f!.name.zh}</option>)}
                </select>
                <button
                  style={smallBtn(!!inciteTarget && playerCapitalGold >= INCITE_COST, '#e8b070')}
                  disabled={!inciteTarget || playerCapitalGold < INCITE_COST}
                  title={t('以金帛啖之,使寇敵國之邊(兩季)', "Pay the tribe to raid a rival's frontier for 2 seasons")}
                  onClick={() => { const r = inciteTribeRaid(tribe.id, inciteTarget); setFeedback({ ok: r.ok, text: r.message }); }}
                >🗡 {t('以夷制夷', 'Incite')} (−{INCITE_COST}g)</button>
              </>
            )}
            {clashCandidates.length > 0 && (
              <>
                <select
                  value={clashOther}
                  onChange={(e) => setClashOther(e.target.value)}
                  style={{ background: '#10161e', color: '#e6c473', border: '1px solid #364654', padding: '0.25rem', fontFamily: 'inherit', fontSize: '0.75rem' }}
                >
                  <option value="">{t('挑之與…', 'Clash with…')}</option>
                  {clashCandidates.map((o) => <option key={o.id} value={o.id}>{o.name.zh}</option>)}
                </select>
                <button
                  style={smallBtn(!!clashOther && playerCapitalGold >= TRIBE_CLASH_COST, '#c98a4e')}
                  disabled={!clashOther || playerCapitalGold < TRIBE_CLASH_COST}
                  title={t('反間之計 — 使二虜相攻,兩敗俱傷', 'Set the two tribes at each other')}
                  onClick={() => { const r = clashTribes(tribe.id, clashOther); setFeedback({ ok: r.ok, text: r.message }); }}
                >⚔ {t('挑動互鬥', 'Clash')} (−{TRIBE_CLASH_COST}g)</button>
              </>
            )}
          </div>
        )}

        {feedback && (
          <div style={{
            marginTop: '0.7rem', padding: '0.4rem 0.6rem',
            background: feedback.ok ? 'rgba(30, 60, 30, 0.4)' : 'rgba(60, 30, 30, 0.4)',
            border: `1px solid ${feedback.ok ? '#7ed68a' : '#b8442e'}`,
            color: feedback.ok ? '#7ed68a' : '#ff8060', fontSize: '0.82rem',
          }}>{feedback.text}</div>
        )}
      </div>
    </div>
  );
}
