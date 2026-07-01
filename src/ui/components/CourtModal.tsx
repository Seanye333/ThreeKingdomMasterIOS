import { useMemo, useState } from 'react';
import { EDICTS, IMPERIAL_RANKS, IMPERIAL_RANKS_BY_ID } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { EdictKind, EntityId } from '../../game/types';
import styles from './CourtModal.module.css';
import { useLanguage, useDesc, pickName } from '../i18n';
import { Name } from './Name';
import { canPromoteToRank, nextImperialRank } from '../../game/systems/imperialEffects';
import { canWelcomeEmperor, emperorCustodian } from '../../game/systems/emperor';
import { deriveCourtFactions, FACTION_LABEL } from '../../game/systems/courtFactions';
import { clanGentryWeight } from '../../game/systems/clans';
import { LADDER_STAGES } from '../../game/systems/usurpation';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface Props {
  onClose: () => void;
}

export function CourtModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const edictHistory = useGameStore((s) => s.edictHistory);
  const edictCooldowns = useGameStore((s) => s.edictCooldowns);
  const date = useGameStore((s) => s.date);
  const issueEdict = useGameStore((s) => s.issueEdict);
  const promoteImperialRank = useGameStore((s) => s.promoteImperialRank);
  const setCourtPatronage = useGameStore((s) => s.setCourtPatronage);
  const purgeFaction = useGameStore((s) => s.purgeFaction);
  const courtPatronage = useGameStore((s) => s.courtPatronage);
  const allCities = useGameStore((s) => s.cities);
  const allAppointments = useGameStore((s) => s.appointments);
  const allOfficers = useGameStore((s) => s.officers);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const eventFlags = useGameStore((s) => s.eventFlags);
  const mandate = useGameStore((s) => s.mandate);
  const emperorCityId = useGameStore((s) => s.emperorCityId);
  const welcomeEmperor = useGameStore((s) => s.welcomeEmperor);
  // §7.4-deep 帝室朝政
  const consortKin = useGameStore((s) => s.consortKin);
  const eunuchPower = useGameStore((s) => s.eunuchPower);
  const regencies = useGameStore((s) => s.regencies);
  const elevateConsort = useGameStore((s) => s.elevateConsort);
  const sellOffices = useGameStore((s) => s.sellOffices);
  const purgeEunuchs = useGameStore((s) => s.purgeEunuchs);
  const declareNewEra = useGameStore((s) => s.declareNewEra);
  // §7.5-deep 禪代之階
  const usurpLadder = useGameStore((s) => s.usurpLadder);
  const exiledLords = useGameStore((s) => s.exiledLords);
  const righteousTargets = useGameStore((s) => s.righteousTargets);
  const curbUsurper = useGameStore((s) => s.curbUsurper);
  const raiseRighteousBanner = useGameStore((s) => s.raiseRighteousBanner);
  const shelterExile = useGameStore((s) => s.shelterExile);
  const [consortPick, setConsortPick] = useState('');
  const [eraInput, setEraInput] = useState('');
  const lang = useLanguage();
  const desc = useDesc();

  const playerForce = playerForceId ? forces[playerForceId] : null;
  const holdsEmperor = !!emperorCityId && allCities[emperorCityId]?.ownerForceId === playerForceId;
  const isSovereign = playerForce?.imperialRank === 'king' || playerForce?.imperialRank === 'emperor';
  const myEunuch = playerForceId ? (eunuchPower?.[playerForceId] ?? 0) : 0;
  const myConsortId = playerForceId ? consortKin?.[playerForceId] : undefined;
  const myRegency = playerForceId ? regencies?.[playerForceId] : undefined;
  const myIdlerOfficers = useMemo(
    () => Object.values(allOfficers).filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && o.id !== playerForce?.rulerOfficerId),
    [allOfficers, playerForceId, playerForce?.rulerOfficerId],
  );
  const currentRank = playerForce?.imperialRank ?? 'commoner';
  const currentRankDef = IMPERIAL_RANKS_BY_ID[currentRank];

  const otherForces = useMemo(
    () => Object.values(forces).filter((f) => f.id !== playerForceId),
    [forces, playerForceId],
  );

  const [edictTargets, setEdictTargets] = useState<Record<string, EntityId>>({});

  const seasonOrder: Record<string, number> = { spring: 0, summer: 1, autumn: 2, winter: 3 };
  const nowAbs = date.year * 4 + seasonOrder[date.season];

  const onCooldown = (k: EdictKind) => {
    const cd = edictCooldowns[k];
    if (!cd) return false;
    return cd.year * 4 + seasonOrder[cd.season] > nowAbs;
  };

  const issue = (k: EdictKind) => {
    const target = edictTargets[k];
    const r = issueEdict(k, target);
    if (r.ok) {
      if (r.message) alert(r.message);
    } else {
      alert(r.reason ?? 'Failed');
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{lang === 'en' ? 'Imperial Court' : '朝廷'}</div>
            <div className={styles.titleEn}>Imperial Court</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        {/* 奉迎天子 — where the Son of Heaven sits, and who holds him. */}
        {emperorCityId && (() => {
          const custodian = emperorCustodian(allCities, emperorCityId);
          const custodianForce = custodian ? forces[custodian] : null;
          const canWelcome = !!playerForceId && !!playerForce
            && canWelcomeEmperor(allCities, emperorCityId, playerForceId, playerForce.capitalCityId);
          return (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
              background: 'rgba(212, 168, 74, 0.08)', border: '1px solid #6a5530',
              padding: '0.5rem 0.8rem', margin: '0 0 0.6rem', fontSize: '0.82rem',
            }}>
              <span>
                👑 {lang === 'en' ? 'The Emperor resides at ' : '天子駐蹕'}
                <strong style={{ color: '#f2dd9a' }}>{allCities[emperorCityId]?.name.zh ?? emperorCityId}</strong>
                {custodianForce
                  ? <span style={{ color: custodianForce.color }}>(
                      {custodian === playerForceId
                        ? (lang === 'en' ? 'in your custody — edicts cost 30% less, the Mandate drifts your way, the realm resents you' : '在你奉戴之下 — 詔書七折,天命日聚,而諸侯側目')
                        : `${custodianForce.name.zh}${lang === 'en' ? ' holds him' : '挾之'}`})
                    </span>
                  : <span style={{ color: '#7a8893' }}>{lang === 'en' ? '(masterless city)' : '(無主之城)'}</span>}
              </span>
              {canWelcome && (
                <button
                  onClick={() => welcomeEmperor()}
                  style={{
                    background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: '1px solid #e6c473',
                    color: '#f2dd9a', padding: '0.3rem 0.8rem', cursor: 'pointer',
                    fontFamily: 'inherit', letterSpacing: '0.05rem', whiteSpace: 'nowrap',
                  }}
                  title={lang === 'en' ? 'Move the emperor into your capital (+10 Mandate)' : '奉迎天子入都 — 天命 +10,自此國都即帝都'}
                >{lang === 'en' ? 'Welcome the Emperor' : '奉迎天子'}</button>
              )}
            </div>
          );
        })()}

        <div className={styles.rankSummary}>
          <div>
            {lang !== 'en' && <div className={styles.rankCurrent}>{currentRankDef.name.zh}</div>}
            {lang !== 'zh' && <div className={styles.rankCurrentEn}>{currentRankDef.name.en}</div>}
          </div>
          <div className={styles.rankDesc}>
            Imperial standing: tier {currentRankDef.tier} of {IMPERIAL_RANKS.length - 1}.
            Recruit bonus +{Math.round(currentRankDef.recruitBonus * 100)}%, internal ×{currentRankDef.internalMultiplier.toFixed(2)}.
            {currentRank === 'commoner' && ' Higher ranks unlock more edicts.'}
            {currentRank === 'emperor' && ' You are the Son of Heaven.'}
          </div>
          {playerForceId && currentRank !== 'emperor' && (() => {
            const next = nextImperialRank(currentRank);
            if (!next) return null;
            const nextDef = IMPERIAL_RANKS_BY_ID[next];
            const force = forces[playerForceId];
            const check = force
              ? canPromoteToRank(next, force, allCities, allAppointments, date.year, eventFlags)
              : { ok: false, reason: 'invalid force' };
            const isEmperorPath = next === 'emperor';
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                <button
                  disabled={!check.ok || isEmperorPath}
                  title={isEmperorPath ? '需頒「即位」詔令' : check.ok ? '' : (!check.ok ? check.reason : '')}
                  onClick={() => {
                    const r = promoteImperialRank(playerForceId, next);
                    if (!r.ok) alert(r.reason ?? 'Failed');
                  }}
                  style={{
                    background: check.ok && !isEmperorPath ? '#1e2832' : '#10161e',
                    border: '1px solid #e6c473',
                    color: check.ok && !isEmperorPath ? '#e6c473' : '#6a5238',
                    padding: '0.5rem 0.9rem',
                    fontFamily: 'inherit',
                    cursor: check.ok && !isEmperorPath ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.07rem',
                  }}
                >
                  {lang === 'en' ? 'Promote → ' : '進爵 → '}<Name pair={nextDef.name} />
                </button>
                {!check.ok && !isEmperorPath && (
                  <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>{(check as { reason: string }).reason}</div>
                )}
                {isEmperorPath && (
                  <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>{lang === 'en' ? 'Requires the “Enthronement” edict' : '需頒「即位」詔令'}</div>
                )}
              </div>
            );
          })()}
        </div>
        {/* Court factions snapshot (auto-derived from officer stats + traits). */}
        {playerForceId && (() => {
          const factions = deriveCourtFactions(allOfficers, clanGentryWeight(allOfficers, clanStandings))[playerForceId] ?? [];
          if (factions.length === 0) return null;
          const counts: Record<string, number> = {};
          for (const f of factions) counts[f.faction] = (counts[f.faction] ?? 0) + 1;
          const total = factions.length;
          return (
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #2b3845', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.78rem' }}>
              <span style={{ color: '#7a8893', letterSpacing: '0.07rem' }}>{lang === 'en' ? 'Court factions:' : '朝堂派系:'}</span>
              {(['military', 'gentry', 'reformer', 'eunuch'] as const).map((fid) => {
                const n = counts[fid] ?? 0;
                if (n === 0) return null;
                const pct = Math.round((n / total) * 100);
                const favoured = courtPatronage === fid;
                return (
                  <span key={fid} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: favoured ? '#f2dd9a' : pct > 50 ? '#e6c473' : '#aab6c0' }}>
                    {favoured && '★'}{FACTION_LABEL[fid].zh} {n} ({pct}%)
                    <button
                      onClick={() => setCourtPatronage(favoured ? null : fid)}
                      title={lang === 'en' ? (favoured ? 'Withdraw patronage' : 'Patronise this faction — its bloc rallies & the realm reaps its boon') : (favoured ? '撤回扶植' : '扶植此派 —— 其黨擁戴,並得其派之利')}
                      style={{ background: 'transparent', border: `1px solid ${favoured ? '#e6c473' : '#2b3845'}`, color: favoured ? '#f2dd9a' : '#7a8893', cursor: 'pointer', fontSize: '0.6rem', padding: '0 0.2rem', borderRadius: 2 }}
                    >{favoured ? '✓扶' : '扶'}</button>
                    <button
                      onClick={() => { const r = purgeFaction(fid); if (r.message) alert(r.message); }}
                      title={lang === 'en' ? 'Purge this faction (黨錮) — loyalty crashes, mandate −5, 500g; a proud officer may defect' : '黨錮此派 —— 忠誠驟降、天命 −5、500金;倨傲之臣或憤而出走'}
                      style={{ background: 'transparent', border: '1px solid #5a2d2d', color: '#e0707a', cursor: 'pointer', fontSize: '0.6rem', padding: '0 0.2rem', borderRadius: 2 }}
                    >錮</button>
                  </span>
                );
              })}
              {playerForceId && (() => {
                const m = mandate.byForce[playerForceId] ?? 50;
                const mNote = m < 30 ? '（天命衰）' : m > 70 ? '（天命昌）' : '';
                return <span style={{ color: m < 30 ? '#b8442e' : m > 70 ? '#e6c473' : '#7a8893' }}>
                  · 天命 {m}{mNote}
                </span>;
              })()}
            </div>
          );
        })()}

        {/* §7.4-deep 帝室朝政 — 外戚 / 學官 / 改元 / 輔政 */}
        {playerForceId && (
          <div style={{ padding: '0.55rem 1rem', borderBottom: '1px solid #2b3845', display: 'flex', flexWrap: 'wrap', gap: '0.7rem', alignItems: 'center', fontSize: '0.72rem' }}>
            {/* 輔政 */}
            {myRegency && (
              <span style={{ color: '#e6c473' }}>
                {lang === 'en' ? '輔政 Regency:' : '太后臨朝·輔政:'} {(lang === 'en' ? allOfficers[myRegency.regentId]?.name.en : allOfficers[myRegency.regentId]?.name.zh) ?? '—'}
              </span>
            )}
            {/* 外戚 */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#aab6c0' }}>
              {lang === 'en' ? '外戚 Consort-kin:' : '外戚:'}
              {myConsortId
                ? <span style={{ color: '#f2dd9a' }}>{(lang === 'en' ? allOfficers[myConsortId]?.name.en : allOfficers[myConsortId]?.name.zh) ?? '—'}</span>
                : <>
                    <select value={consortPick} onChange={(e) => setConsortPick(e.target.value)} style={{ background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', fontSize: '0.68rem', borderRadius: 3 }}>
                      <option value="">{lang === 'en' ? '— pick —' : '— 擇 —'}</option>
                      {myIdlerOfficers.slice(0, 40).map((o) => <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>)}
                    </select>
                    <button disabled={!consortPick} onClick={() => { const r = elevateConsort(consortPick); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(!!consortPick)} title={lang === 'en' ? 'Raise this officer\'s kin as consort-kin (立后納妃): +loyalty to him & his house.' : '立其族為國舅(立后納妃):其人其族忠誠大漲。'}>
                      {lang === 'en' ? 'Elevate' : '立后納妃'}
                    </button>
                  </>}
            </span>
            {/* 學官 (holds emperor) */}
            {holdsEmperor && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: myEunuch >= 60 ? '#e0707a' : '#aab6c0' }}>
                {lang === 'en' ? '學官 Inner court:' : '學官:'} {Math.round(myEunuch)}/100
                <button disabled={myEunuch < 30} onClick={() => { const r = sellOffices(); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(myEunuch >= 30)} title={lang === 'en' ? 'Sell offices for gold (民心 & 清流 suffer).' : '賣官鬻爵取金(損民心・清流)。'}>
                  {lang === 'en' ? 'Sell offices' : '賣官'}
                </button>
                <button disabled={myEunuch <= 0} onClick={() => { const r = purgeEunuchs(); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(myEunuch > 0)} title={lang === 'en' ? 'Purge the inner court (清流 rally, palace reels).' : '盡誅學官(清流復振、宮廷動盪)。'}>
                  {lang === 'en' ? 'Purge' : '盡誅學官'}
                </button>
              </span>
            )}
            {/* 改元 */}
            {isSovereign && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: '#aab6c0' }}>
                <input value={eraInput} onChange={(e) => setEraInput(e.target.value)} placeholder={playerForce?.eraName ?? (lang === 'en' ? 'era' : '年號')} style={{ width: '5rem', background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', fontSize: '0.68rem', borderRadius: 3, padding: '0.1rem 0.3rem' }} />
                <button onClick={() => { const r = declareNewEra(eraInput); if (r.ok) setEraInput(''); else if (r.reason) alert(r.reason); }} style={miniCourtBtn(true)} title={lang === 'en' ? 'Proclaim a new era (改元): mandate +4, on a cooldown.' : '改元頒朔:天命 +4,數年一次。'}>
                  {lang === 'en' ? 'New era 改元' : '改元'}
                </button>
              </span>
            )}
          </div>
        )}

        {/* §7.5-deep 禪代之階 — 權臣 warning / 清君側 / 流亡客將 */}
        {playerForceId && (() => {
          const ladder = usurpLadder?.[playerForceId];
          const exiles = Object.entries(exiledLords ?? {});
          const targets = Object.entries(righteousTargets ?? {});
          if (!ladder && exiles.length === 0 && targets.length === 0) return null;
          const minister = ladder ? allOfficers[ladder.officerId] : null;
          const st = ladder ? LADDER_STAGES[ladder.stage] : null;
          return (
            <div style={{ padding: '0.55rem 1rem', borderBottom: '1px solid #2b3845', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem' }}>
              {ladder && minister && st && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ladder.stage >= 2 ? '#e0707a' : '#e6c473' }}>
                  <span>⚠ {lang === 'en' ? 'Usurpation' : '禪代之階'}: {lang === 'en' ? minister.name.en : minister.name.zh} — <b>{lang === 'en' ? st.en : st.zh}</b> ({ladder.stage + 1}/{LADDER_STAGES.length}) · {lang === 'en' ? `cabal ${ladder.cabal.length}` : `黨羽 ${ladder.cabal.length}`}</span>
                  <button onClick={() => { const r = curbUsurper(); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(true)} title={lang === 'en' ? 'Scatter his cabal and knock him down a rung (翦除肘腋). Costs gold; a cornered minister may revolt.' : '翦除肘腋:散其黨羽、挫其一階(費金;狗急或跳牆)。'}>
                    {lang === 'en' ? 'Curb (翦除肘腋)' : '翦除肘腋'}
                  </button>
                </div>
              )}
              {targets.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: '#aab6c0' }}>
                  <span>{lang === 'en' ? '清君側 Righteous war:' : '可興清君側:'}</span>
                  {targets.slice(0, 5).map(([tid, cause]) => {
                    const f = forces[tid];
                    if (!f) return null;
                    return (
                      <button key={tid} onClick={() => { const r = raiseRighteousBanner(tid); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(true)} title={lang === 'en' ? cause.reasonEn : cause.reasonZh}>
                        {lang === 'en' ? `Denounce ${f.name.en}` : `討 ${f.name.zh}`}
                      </button>
                    );
                  })}
                </div>
              )}
              {exiles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', color: '#aab6c0' }}>
                  <span>{lang === 'en' ? '流亡客將 Exiles:' : '流亡客將:'}</span>
                  {exiles.slice(0, 5).map(([oid, ex]) => {
                    const o = allOfficers[oid];
                    if (!o || o.forceId != null) return null;
                    return (
                      <button key={oid} onClick={() => { const r = shelterExile(oid); if (!r.ok && r.reason) alert(r.reason); }} style={miniCourtBtn(true)} title={lang === 'en' ? `Shelter ${o.name.en}, lord of the fallen ${ex.formerNameEn} (gain him + a few followers; 鳩占鵲巢 risk).` : `納${o.name.zh}(故${ex.formerNameZh}之主)來投:得其人與從者,然鳩占鵲巢有風險。`}>
                        {lang === 'en' ? `Shelter ${o.name.en}` : `納 ${o.name.zh}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        <div className={styles.body}>
          {EDICTS.map((e) => {
            const minRankDef = IMPERIAL_RANKS_BY_ID[e.minRank];
            const meetsRank = currentRankDef.tier >= minRankDef.tier;
            const cd = onCooldown(e.kind);
            const needsTarget = e.kind === 'denounce' || e.kind === 'declare-vassal' || e.kind === 'levy-tribute' || e.kind === 'grace-favor';
            const target = edictTargets[e.kind];
            const canIssue = meetsRank && !cd && (!needsTarget || !!target);
            return (
              <div key={e.kind} className={styles.edictCard}>
                <div className={styles.edictBody}>
                  <div>
                    {lang !== 'en' && <span className={styles.edictName}>{e.name.zh}</span>}
                    {lang !== 'zh' && <span className={styles.edictNameEn}>{e.name.en}</span>}
                  </div>
                  <div className={styles.edictDesc}>{desc(e)}</div>
                  <div className={styles.edictMeta}>
                    <span className={styles.metaGold}>{e.goldCost}g</span>
                    <span className={styles.metaRank}>{lang === 'en' ? 'req ' : '需 '}<Name pair={minRankDef.name} /></span>
                    {e.cooldownSeasons < 99 && (
                      <span className={styles.metaCd}>{lang === 'en' ? `CD ${e.cooldownSeasons} seasons` : `冷卻 ${e.cooldownSeasons} 旬`}</span>
                    )}
                  </div>
                  {needsTarget && (
                    <div className={styles.targetPick}>
                      {otherForces.map((f) => (
                        <button
                          key={f.id}
                          className={`${styles.targetChip} ${target === f.id ? styles.targetChipActive : ''}`}
                          onClick={() => setEdictTargets((s) => ({ ...s, [e.kind]: f.id }))}
                        >
                          <span className={styles.dot} style={{ background: f.color }} />
                          <Name pair={f.name} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className={styles.issueBtn} onClick={() => issue(e.kind)} disabled={!canIssue}>
                  {cd ? (lang === 'en' ? 'On CD' : '冷卻中') : !meetsRank ? (lang === 'en' ? `Need ${minRankDef.name.en}` : `需${minRankDef.name.zh}`) : (lang === 'en' ? 'Issue' : '頒令')}
                </button>
              </div>
            );
          })}
        </div>

        {edictHistory.length > 0 && (
          <div className={styles.history} style={{ maxHeight: 200, overflow: 'auto' }}>
            <div className={styles.historyTitle}>{lang === 'en' ? 'Edict History' : '詔令履歷'} ({edictHistory.length})</div>
            {[...edictHistory].reverse().map((h) => {
              const def = EDICTS.find((d) => d.kind === h.kind);
              const target = h.targetForceId ? forces[h.targetForceId] : null;
              return (
                <div key={h.id} className={styles.historyItem}>
                  <span className={styles.historyDate}>
                    {h.issuedYear} {h.issuedSeason}
                  </span>
                  {' — '}
                  {def ? pickName(def.name, lang) : h.kind}
                  {target && ` → ${pickName(target.name, lang)}`}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function miniCourtBtn(enabled: boolean) {
  return {
    background: 'transparent', border: `1px solid ${enabled ? '#2b3845' : '#1c2530'}`,
    color: enabled ? '#9fb2c0' : '#4a5560', cursor: enabled ? 'pointer' : 'default',
    fontSize: '0.62rem', padding: '0.05rem 0.35rem', borderRadius: 3,
  } as const;
}
