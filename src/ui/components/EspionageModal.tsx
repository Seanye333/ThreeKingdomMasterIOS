import { useMemo, useState } from 'react';
import { ESPIONAGE_DEFS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { EntityId, EspionageKind, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { Name } from './Name';
import styles from './EspionageModal.module.css';
import { useLanguage, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

export function EspionageModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const pendingEspionage = useGameStore((s) => s.pendingEspionage);
  const queueEspionage = useGameStore((s) => s.queueEspionage);
  const cancelEspionage = useGameStore((s) => s.cancelEspionage);
  const embeddedSpies = useGameStore((s) => s.embeddedSpies);
  const plantSpy = useGameStore((s) => s.plantSpy);
  const recallSpy = useGameStore((s) => s.recallSpy);
  const lang = useLanguage();
  const desc = useDesc();

  const [pickedKind, setPickedKind] = useState<EspionageKind | null>(null);
  const [pickedAgentId, setPickedAgentId] = useState<EntityId | null>(null);
  const [pickedTargetForceId, setPickedTargetForceId] = useState<EntityId | null>(null);
  const [pickedTargetCityId, setPickedTargetCityId] = useState<EntityId | null>(null);
  const [pickedTargetOfficerId, setPickedTargetOfficerId] = useState<EntityId | null>(null);
  const [pickedTargetOfficerId2, setPickedTargetOfficerId2] = useState<EntityId | null>(null);

  const def = pickedKind ? ESPIONAGE_DEFS.find((d) => d.kind === pickedKind) : null;

  const availableAgents = useMemo(
    () =>
      Object.values(officers)
        .filter(
          (o) =>
            o.forceId === playerForceId &&
            o.status === 'idle' &&
            !o.task &&
            (!def || o.stats.intelligence >= def.minIntelligence),
        )
        .sort((a, b) => b.stats.intelligence - a.stats.intelligence),
    [officers, playerForceId, def],
  );

  const enemyForces = useMemo(
    () =>
      Object.values(forces).filter(
        (f) => f.id !== playerForceId,
      ),
    [forces, playerForceId],
  );

  const targetCities = useMemo(() => {
    if (!pickedTargetForceId) return [];
    return Object.values(cities).filter(
      (c) => c.ownerForceId === pickedTargetForceId,
    );
  }, [cities, pickedTargetForceId]);

  const targetOfficers = useMemo(() => {
    if (!pickedTargetForceId) return [];
    return Object.values(officers)
      .filter(
        (o) =>
          o.forceId === pickedTargetForceId &&
          o.status !== 'dead' &&
          o.status !== 'imprisoned',
      )
      .sort((a, b) => a.loyalty - b.loyalty);
  }, [officers, pickedTargetForceId]);

  const canConfirm =
    !!def &&
    !!pickedAgentId &&
    !!pickedTargetForceId &&
    (def.targetsOfficer ? !!pickedTargetOfficerId : !!pickedTargetCityId) &&
    (def.kind !== 'sow-discord' || (!!pickedTargetOfficerId2 && pickedTargetOfficerId2 !== pickedTargetOfficerId));

  // Success probability preview — mirrors the calc in resolveEspionage:
  //   chance = baseSuccess × (agent.int / 100)
  //   chance += (agent.int − target avg int) × 0.005
  //   chance += espionage trait bonus
  //   chance −= target counter-intel resist
  //   for defect: heavy (100 − target.loyalty) / 50 boost
  // We approximate (no trait module call) for a player-facing estimate.
  const successProb = useMemo(() => {
    if (!def || !pickedAgentId || !pickedTargetForceId) return null;
    const agent = officers[pickedAgentId];
    if (!agent) return null;
    const targetForceOfficers = Object.values(officers).filter(
      (o) => o.forceId === pickedTargetForceId && o.status !== 'dead',
    );
    const avgInt = targetForceOfficers.length > 0
      ? targetForceOfficers.reduce((s, o) => s + o.stats.intelligence, 0) / targetForceOfficers.length
      : 60;
    let chance = def.baseSuccess * (agent.stats.intelligence / 100);
    chance += (agent.stats.intelligence - avgInt) * 0.005;
    if (def.kind === 'defect' && pickedTargetOfficerId) {
      const targ = officers[pickedTargetOfficerId];
      if (targ) chance += (100 - targ.loyalty) / 50;
    }
    // Cunning trait bonus on attacker
    if ((agent.traits ?? []).includes('cunning')) chance += 0.1;
    return Math.max(0.05, Math.min(0.95, chance));
  }, [def, pickedAgentId, pickedTargetForceId, pickedTargetOfficerId, officers]);

  const plant = () => {
    if (!pickedAgentId || !pickedTargetCityId) return;
    const r = plantSpy(pickedAgentId, pickedTargetCityId);
    if (r.ok) {
      setPickedKind(null);
      setPickedAgentId(null);
      setPickedTargetForceId(null);
      setPickedTargetCityId(null);
      setPickedTargetOfficerId(null);
    } else {
      alert(r.reason ?? 'Failed');
    }
  };

  const submit = () => {
    if (!canConfirm || !pickedKind || !pickedAgentId || !pickedTargetForceId) return;
    const r = queueEspionage(
      pickedKind,
      pickedAgentId,
      pickedTargetForceId,
      pickedTargetCityId ?? undefined,
      pickedTargetOfficerId ?? undefined,
      pickedTargetOfficerId2 ?? undefined,
    );
    if (r.ok) {
      setPickedKind(null);
      setPickedAgentId(null);
      setPickedTargetForceId(null);
      setPickedTargetCityId(null);
      setPickedTargetOfficerId(null);
      setPickedTargetOfficerId2(null);
    } else {
      alert(r.reason ?? 'Failed');
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{lang === 'en' ? 'Espionage' : '密偵'}</div>
            <div className={styles.titleEn}>Espionage</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.column}>
            <div className={styles.colLabel}>Operation</div>
            {ESPIONAGE_DEFS.map((d) => (
              <button
                key={d.kind}
                className={`${styles.opCard} ${pickedKind === d.kind ? styles.opCardActive : ''}`}
                onClick={() => {
                  setPickedKind(d.kind);
                  setPickedTargetCityId(null);
                  setPickedTargetOfficerId(null);
                }}
              >
                <div>
                  {lang !== 'en' && <span className={styles.opName}>{d.name.zh}</span>}
                  {lang !== 'zh' && <span className={styles.opNameEn}>{d.name.en}</span>}
                </div>
                <div className={styles.opDesc}>{desc(d)}</div>
                <div className={styles.opMeta}>
                  <span className={styles.opMetaGold}>{d.goldCost}g</span>
                  <span className={styles.opMetaInt}>INT {d.minIntelligence}+</span>
                  <span className={styles.opMetaChance}>{Math.round(d.baseSuccess * 100)}% base</span>
                </div>
              </button>
            ))}
            {pendingEspionage.length > 0 && (
              <div className={styles.pending}>
                <div className={styles.colLabel}>Queued ({pendingEspionage.length})</div>
                {pendingEspionage.map((op) => {
                  const agent = officers[op.agentOfficerId];
                  return (
                    <div key={op.id} className={styles.pendingOp}>
                      <span>{op.kind} · {agent?.name.en ?? '?'}</span>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => cancelEspionage(op.id)}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}
            {embeddedSpies.length > 0 && (
              <div className={styles.pending}>
                <div className={styles.colLabel}>{lang === 'en' ? 'Embedded' : '潛伏細作'} ({embeddedSpies.length})</div>
                {embeddedSpies.map((spy) => {
                  const agent = officers[spy.agentOfficerId];
                  const city = cities[spy.targetCityId];
                  const exp = Math.min(100, Math.round(spy.exposure));
                  return (
                    <div key={spy.id} className={styles.pendingOp} style={{ display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                        <span>{(lang === 'en' ? agent?.name.en : agent?.name.zh) ?? '?'} → {(lang === 'en' ? city?.name.en : city?.name.zh) ?? '?'}</span>
                        <button className={styles.cancelBtn} title={lang === 'en' ? 'Recall' : '召回'} onClick={() => recallSpy(spy.id)}>↩</button>
                      </div>
                      <div title={`${lang === 'en' ? 'Exposure' : '暴露'} ${exp}%`} style={{ height: 5, background: '#10161e', border: '1px solid #2b3845', marginTop: 3 }}>
                        <div style={{ width: `${exp}%`, height: '100%', background: exp > 66 ? '#b8442e' : exp > 33 ? '#e6c473' : '#7ed68a' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.column}>
            <div className={styles.colLabel}>Agent</div>
            <div className={styles.optionList}>
              {availableAgents.length === 0 ? (
                <div className={styles.muted}>No qualified, idle officers.</div>
              ) : availableAgents.map((o) => (
                <button
                  key={o.id}
                  className={`${styles.option} ${pickedAgentId === o.id ? styles.optionActive : ''}`}
                  onClick={() => setPickedAgentId(o.id)}
                >
                  <span><Name pair={o.name} /></span>
                  <span className={styles.optionStats}><OfficerStats officer={o} keys={['intelligence']} /></span>
                </button>
              ))}
            </div>
            <div className={styles.colLabel} style={{ marginTop: '0.5rem' }}>Target Force</div>
            <div className={styles.optionList}>
              {enemyForces.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.option} ${pickedTargetForceId === f.id ? styles.optionActive : ''}`}
                  onClick={() => {
                    setPickedTargetForceId(f.id);
                    setPickedTargetCityId(null);
                    setPickedTargetOfficerId(null);
                  }}
                >
                  <span>
                    <span className={styles.dot} style={{ background: f.color }} />
                    <Name pair={f.name} />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            {def?.targetsOfficer ? (
              <>
                <div className={styles.colLabel}>
                  {def.kind === 'sow-discord' ? 'Officer A (to estrange)' : 'Target Officer (sorted by lowest loyalty)'}
                </div>
                <div className={styles.optionList}>
                  {targetOfficers.length === 0 ? (
                    <div className={styles.muted}>Pick a target force.</div>
                  ) : targetOfficers.map((o) => (
                    <button
                      key={o.id}
                      className={`${styles.option} ${pickedTargetOfficerId === o.id ? styles.optionActive : ''}`}
                      onClick={() => setPickedTargetOfficerId(o.id)}
                    >
                      <span><Name pair={o.name} /></span>
                      <span className={styles.optionStats}>L{o.loyalty} · <OfficerStats officer={o} keys={['intelligence']} /></span>
                    </button>
                  ))}
                </div>
                {def.kind === 'sow-discord' && (
                  <>
                    <div className={styles.colLabel} style={{ marginTop: '0.6rem' }}>Officer B (to estrange)</div>
                    <div className={styles.optionList}>
                      {targetOfficers.filter((o) => o.id !== pickedTargetOfficerId).map((o) => (
                        <button
                          key={o.id}
                          className={`${styles.option} ${pickedTargetOfficerId2 === o.id ? styles.optionActive : ''}`}
                          onClick={() => setPickedTargetOfficerId2(o.id)}
                        >
                          <span><Name pair={o.name} /></span>
                          <span className={styles.optionStats}>L{o.loyalty} · <OfficerStats officer={o} keys={['intelligence']} /></span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className={styles.colLabel}>Target City</div>
                <div className={styles.optionList}>
                  {targetCities.length === 0 ? (
                    <div className={styles.muted}>Pick a target force.</div>
                  ) : targetCities.map((c) => (
                    <button
                      key={c.id}
                      className={`${styles.option} ${pickedTargetCityId === c.id ? styles.optionActive : ''}`}
                      onClick={() => setPickedTargetCityId(c.id)}
                    >
                      <span><Name pair={c.name} /></span>
                      <span className={styles.optionStats}>L{c.loyalty} · G{c.gold} · F{c.food}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.confirmBar}>
          <div className={styles.summary}>
            {def && pickedAgentId && pickedTargetForceId ? (
              <span><Name pair={def.name} /> {lang === 'en' ? 'by' : '由'} {agentSummary(officers, pickedAgentId)}</span>
            ) : (
              <span>Pick an operation, agent, and target.</span>
            )}
          </div>
          {/* Success probability bar — estimated, not exact. */}
          {successProb !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              minWidth: '160px',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#7a8893', letterSpacing: '0.05rem' }}>
                估算
              </span>
              <div style={{
                flex: 1, height: '8px', minWidth: '70px',
                background: '#10161e', border: '1px solid #2b3845',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${successProb * 100}%`, height: '100%',
                  background: successProb > 0.65 ? '#7ed68a' :
                              successProb > 0.4 ? '#e6c473' : '#b8442e',
                  transition: 'width 0.2s ease-out',
                }} />
              </div>
              <span style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.85rem',
                color: successProb > 0.65 ? '#7ed68a' :
                       successProb > 0.4 ? '#e6c473' : '#b8442e',
                minWidth: '2.5rem', textAlign: 'right',
              }}>
                {Math.round(successProb * 100)}%
              </span>
            </div>
          )}
          <button
            className={styles.confirmBtn}
            disabled={!pickedAgentId || !pickedTargetCityId}
            onClick={plant}
            title={lang === 'en' ? 'Embed a persistent undercover agent in this city' : '派遣常駐潛伏細作於此城（持續刺探/侵蝕,有暴露風險)'}
          >
            {lang === 'en' ? 'Plant Spy' : '潛伏'}
          </button>
          <button className={styles.confirmBtn} disabled={!canConfirm} onClick={submit}>
            Queue Op
          </button>
        </div>
      </div>
    </div>
  );
}

function agentSummary(officers: Record<EntityId, Officer>, id: EntityId): string {
  const o = officers[id];
  if (!o) return '?';
  return `${o.name.en} (INT ${o.stats.intelligence})`;
}
