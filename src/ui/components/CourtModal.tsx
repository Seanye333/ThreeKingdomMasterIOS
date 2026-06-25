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
  const allCities = useGameStore((s) => s.cities);
  const allAppointments = useGameStore((s) => s.appointments);
  const allOfficers = useGameStore((s) => s.officers);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const eventFlags = useGameStore((s) => s.eventFlags);
  const mandate = useGameStore((s) => s.mandate);
  const emperorCityId = useGameStore((s) => s.emperorCityId);
  const welcomeEmperor = useGameStore((s) => s.welcomeEmperor);
  const lang = useLanguage();
  const desc = useDesc();

  const playerForce = playerForceId ? forces[playerForceId] : null;
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
                return (
                  <span key={fid} style={{ color: pct > 50 ? '#e6c473' : '#aab6c0' }}>
                    {FACTION_LABEL[fid].zh} {n} ({pct}%)
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

        <div className={styles.body}>
          {EDICTS.map((e) => {
            const minRankDef = IMPERIAL_RANKS_BY_ID[e.minRank];
            const meetsRank = currentRankDef.tier >= minRankDef.tier;
            const cd = onCooldown(e.kind);
            const needsTarget = e.kind === 'denounce' || e.kind === 'declare-vassal' || e.kind === 'levy-tribute';
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
