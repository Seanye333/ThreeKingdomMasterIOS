import { useMemo } from 'react';
import { SCENARIO_OBJECTIVES } from '../../game/data';
import { evaluateGoal, findObjectiveFor } from '../../game/systems/objectives';
import { findChallenge } from '../../game/data/challenges';
import { useGameStore } from '../../game/state/store';
import { Name } from './Name';
import { useT } from '../i18n';
import type { ObjectiveGoal } from '../../game/types';

/** 這條目標的期限年(沒有期限的回 null)。goal 是聯合型別,只有部分成員帶年份。 */
function deadlineOf(goal: ObjectiveGoal): number | null {
  const g = goal as { byYear?: number; year?: number };
  return g.byYear ?? g.year ?? null;
}

export function ObjectivePanel() {
  const t = useT();
  const scenarioId = useGameStore((s) => s.scenarioId);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const year = useGameStore((s) => s.date.year);
  const activeChallenge = useGameStore((s) => s.activeChallenge);

  const objective = useMemo(
    () => findObjectiveFor(scenarioId, playerForceId, SCENARIO_OBJECTIVES),
    [scenarioId, playerForceId],
  );
  const challenge = useMemo(() => findChallenge(activeChallenge), [activeChallenge]);

  const ctx = useMemo(() => {
    const liveForceIds = new Set<string>();
    for (const c of Object.values(cities)) {
      if (c.ownerForceId) liveForceIds.add(c.ownerForceId);
    }
    return {
      scenarioId,
      playerForceId,
      cities,
      officers,
      year,
      liveForceIds,
      isEmperor: playerForceId ? forces[playerForceId]?.imperialRank === 'emperor' : false,
    };
  }, [scenarioId, playerForceId, cities, officers, year, forces]);

  // Hero Mode challenge takes over the panel when one is active.
  if (challenge) {
    const res = evaluateGoal(challenge.goal, ctx);
    const deadline = challenge.goal.kind === 'survive-until' ? challenge.goal.year : challenge.deadlineYear;
    const yearsLeft = deadline - year;
    const tint = res.status === 'success' ? '#7ed68a' : res.status === 'failure' ? '#b8442e' : '#e2a07a';
    return (
      <div
        style={{
          background: '#10161e', border: '1px solid #c0504a', borderLeft: '3px solid #c0504a',
          padding: '0.5rem 0.8rem', fontSize: '0.78rem', color: '#aab6c0',
          fontFamily: 'var(--tkm-font-body)', display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 260,
        }}
      >
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('⚔ 英雄模式', '⚔ Hero Mode')}</span>
          <span style={{ color: '#c0504a' }}>{'★'.repeat(challenge.star)}</span>
        </div>
        <div style={{ fontSize: '0.95rem', color: tint }}>
          <Name pair={challenge.name} />
        </div>
        <div style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {res.status === 'success' && t('✓ 達成', '✓ Won')}
            {res.status === 'failure' && t('✗ 失敗', '✗ Lost')}
            {res.status === 'pending' && (res.progress ?? t('進行中…', 'In progress…'))}
          </span>
          {res.status === 'pending' && (
            <span style={{ color: yearsLeft <= 1 ? '#c0504a' : '#7a8893' }}>
              {t(`期限 ${deadline} · 餘 ${Math.max(0, yearsLeft)} 年`, `by ${deadline} · ${Math.max(0, yearsLeft)}y left`)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!objective) return null;
  const primaryRes = evaluateGoal(objective.primary.goal, ctx);
  const secondary = objective.secondary ?? [];
  const primaryDeadline = deadlineOf(objective.primary.goal);

  return (
    <div
      style={{
        background: '#10161e',
        border: '1px solid #2b3845',
        padding: '0.5rem 0.8rem',
        fontSize: '0.78rem',
        color: '#aab6c0',
        fontFamily: 'var(--tkm-font-body)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        minWidth: 260,
      }}
    >
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase' }}>
        {t('目標', 'Objective')}
      </div>
      <div style={{ fontSize: '0.95rem', color: primaryRes.status === 'success' ? '#7ed68a' : primaryRes.status === 'failure' ? '#b8442e' : '#e6c473' }}>
        <Name pair={objective.primary.title} />
      </div>
      <div style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace', display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
        <span>
          {primaryRes.status === 'success' && t('✓ 達成', '✓ Achieved')}
          {primaryRes.status === 'failure' && t('✗ 失敗', '✗ Failed')}
          {primaryRes.status === 'pending' && (primaryRes.progress ?? t('進行中…', 'In progress…'))}
        </span>
        {primaryRes.status === 'pending' && primaryDeadline !== null && (
          <span style={{ color: primaryDeadline - year <= 1 ? '#c0504a' : '#7a8893' }}>
            {t(`期限 ${primaryDeadline} · 餘 ${Math.max(0, primaryDeadline - year)} 年`,
              `by ${primaryDeadline} · ${Math.max(0, primaryDeadline - year)}y left`)}
          </span>
        )}
      </div>
      {/* 目標的來由 —— 每一條主目標都寫了它在史書上是什麼事,不顯示等於沒寫。 */}
      <div style={{ fontSize: '0.68rem', color: '#7a8893', lineHeight: 1.5 }}>
        {t(objective.primary.descriptionZh ?? objective.primary.description, objective.primary.description)}
      </div>
      {/*
       * 次要目標 —— 本專案的準則是「主目標寫他真正做到的事,次要寫他沒做到的」,
       * 於是次要那一欄放的正是名場面(取長安、盡有荊州、翦滅曹爽…)。
       * 面板此前只畫主目標,那些全都沒有人看得到。
       */}
      {secondary.length > 0 && (
        <div style={{ borderTop: '1px solid #1e2833', marginTop: '0.25rem', paddingTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.06rem', color: '#5e6a75', textTransform: 'uppercase' }}>
            {t('次要', 'Also')}
          </div>
          {secondary.map((g, i) => {
            const r = evaluateGoal(g.goal, ctx);
            const by = deadlineOf(g.goal);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', fontSize: '0.72rem' }}>
                <span style={{ color: r.status === 'success' ? '#7ed68a' : r.status === 'failure' ? '#8a5548' : '#9aa6b0' }}>
                  {r.status === 'success' ? '✓ ' : r.status === 'failure' ? '✗ ' : '· '}
                  <Name pair={g.title} />
                </span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', color: '#5e6a75', whiteSpace: 'nowrap' }}>
                  {r.status === 'pending' ? (r.progress ?? (by !== null ? `→ ${by}` : '')) : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
