import { useMemo, useState } from 'react';
import { ESPIONAGE_DEFS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { EntityId, EspionageKind, Officer } from '../../game/types';
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
  const lang = useLanguage();
  const desc = useDesc();

  const [pickedKind, setPickedKind] = useState<EspionageKind | null>(null);
  const [pickedAgentId, setPickedAgentId] = useState<EntityId | null>(null);
  const [pickedTargetForceId, setPickedTargetForceId] = useState<EntityId | null>(null);
  const [pickedTargetCityId, setPickedTargetCityId] = useState<EntityId | null>(null);
  const [pickedTargetOfficerId, setPickedTargetOfficerId] = useState<EntityId | null>(null);

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
    (def.targetsOfficer ? !!pickedTargetOfficerId : !!pickedTargetCityId);

  const submit = () => {
    if (!canConfirm || !pickedKind || !pickedAgentId || !pickedTargetForceId) return;
    const r = queueEspionage(
      pickedKind,
      pickedAgentId,
      pickedTargetForceId,
      pickedTargetCityId ?? undefined,
      pickedTargetOfficerId ?? undefined,
    );
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

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>密偵</div>
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
                  <span>{o.name.zh} {o.name.en}</span>
                  <span className={styles.optionStats}>INT {o.stats.intelligence}</span>
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
                    {f.name.zh} {f.name.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            {def?.targetsOfficer ? (
              <>
                <div className={styles.colLabel}>Target Officer (sorted by lowest loyalty)</div>
                <div className={styles.optionList}>
                  {targetOfficers.length === 0 ? (
                    <div className={styles.muted}>Pick a target force.</div>
                  ) : targetOfficers.map((o) => (
                    <button
                      key={o.id}
                      className={`${styles.option} ${pickedTargetOfficerId === o.id ? styles.optionActive : ''}`}
                      onClick={() => setPickedTargetOfficerId(o.id)}
                    >
                      <span>{o.name.zh} {o.name.en}</span>
                      <span className={styles.optionStats}>L{o.loyalty} · I{o.stats.intelligence}</span>
                    </button>
                  ))}
                </div>
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
                      <span>{c.name.zh} {c.name.en}</span>
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
              <span>{def.name.en} by {agentSummary(officers, pickedAgentId)}</span>
            ) : (
              <span>Pick an operation, agent, and target.</span>
            )}
          </div>
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
