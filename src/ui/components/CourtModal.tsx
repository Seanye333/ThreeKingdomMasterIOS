import { useMemo, useState } from 'react';
import { EDICTS, IMPERIAL_RANKS, IMPERIAL_RANKS_BY_ID } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { EdictKind, EntityId } from '../../game/types';
import styles from './CourtModal.module.css';
import { useLanguage, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

export function CourtModal({ onClose }: Props) {
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const edictHistory = useGameStore((s) => s.edictHistory);
  const edictCooldowns = useGameStore((s) => s.edictCooldowns);
  const date = useGameStore((s) => s.date);
  const issueEdict = useGameStore((s) => s.issueEdict);
  const promoteImperialRank = useGameStore((s) => s.promoteImperialRank);
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
            <div className={styles.titleZh}>朝廷</div>
            <div className={styles.titleEn}>Imperial Court</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.rankSummary}>
          <div>
            <div className={styles.rankCurrent}>{currentRankDef.name.zh}</div>
            <div className={styles.rankCurrentEn}>{currentRankDef.name.en}</div>
          </div>
          <div className={styles.rankDesc}>
            Imperial standing: tier {currentRankDef.tier} of {IMPERIAL_RANKS.length - 1}.
            Recruit bonus +{Math.round(currentRankDef.recruitBonus * 100)}%, internal ×{currentRankDef.internalMultiplier.toFixed(2)}.
            {currentRank === 'commoner' && ' Higher ranks unlock more edicts.'}
            {currentRank === 'emperor' && ' You are the Son of Heaven.'}
          </div>
          {playerForceId && currentRank !== 'emperor' && (
            <select
              value={currentRank}
              onChange={(e) => promoteImperialRank(playerForceId, e.target.value as typeof currentRank)}
              style={{
                background: '#1a1410',
                border: '1px solid #4a3520',
                color: '#d4a84a',
                padding: '0.4rem',
                fontFamily: 'inherit',
              }}
            >
              {IMPERIAL_RANKS.filter((r) => r.id !== 'emperor').map((r) => (
                <option key={r.id} value={r.id}>{r.name.zh} {r.name.en}</option>
              ))}
            </select>
          )}
        </div>

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
                    <span className={styles.metaRank}>req {minRankDef.name.en}</span>
                    {e.cooldownSeasons < 99 && (
                      <span className={styles.metaCd}>CD {e.cooldownSeasons} seasons</span>
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
                          {f.name.zh}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className={styles.issueBtn} onClick={() => issue(e.kind)} disabled={!canIssue}>
                  {cd ? 'On CD' : !meetsRank ? `Need ${minRankDef.name.en}` : 'Issue'}
                </button>
              </div>
            );
          })}
        </div>

        {edictHistory.length > 0 && (
          <div className={styles.history}>
            <div className={styles.historyTitle}>Edict History</div>
            {edictHistory.slice(-10).reverse().map((h) => {
              const def = EDICTS.find((d) => d.kind === h.kind);
              const target = h.targetForceId ? forces[h.targetForceId] : null;
              return (
                <div key={h.id} className={styles.historyItem}>
                  <span className={styles.historyDate}>
                    {h.issuedYear} {h.issuedSeason}
                  </span>
                  {' — '}
                  {def?.name.en ?? h.kind}
                  {target && ` → ${target.name.en}`}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
