import { useMemo } from 'react';
import { SCENARIO_OBJECTIVES } from '../../game/data';
import { evaluateGoal, findObjectiveFor } from '../../game/systems/objectives';
import { findChallenge } from '../../game/data/challenges';
import { useGameStore } from '../../game/state/store';
import { Name } from './Name';

export function ObjectivePanel() {
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
          <span>⚔ Hero Mode · 英雄模式</span>
          <span style={{ color: '#c0504a' }}>{'★'.repeat(challenge.star)}</span>
        </div>
        <div style={{ fontSize: '0.95rem', color: tint }}>
          <Name pair={challenge.name} />
        </div>
        <div style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {res.status === 'success' && '✓ 達成 Won'}
            {res.status === 'failure' && '✗ 失敗 Lost'}
            {res.status === 'pending' && (res.progress ?? '進行中…')}
          </span>
          {res.status === 'pending' && (
            <span style={{ color: yearsLeft <= 1 ? '#c0504a' : '#7a8893' }}>
              期限 {deadline} · 餘 {Math.max(0, yearsLeft)} 年
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!objective) return null;
  const primaryRes = evaluateGoal(objective.primary.goal, ctx);

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
        Objective · 目標
      </div>
      <div style={{ fontSize: '0.95rem', color: primaryRes.status === 'success' ? '#7ed68a' : primaryRes.status === 'failure' ? '#b8442e' : '#e6c473' }}>
        <Name pair={objective.primary.title} />
      </div>
      <div style={{ fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
        {primaryRes.status === 'success' && '✓ 達成 Achieved'}
        {primaryRes.status === 'failure' && '✗ 失敗 Failed'}
        {primaryRes.status === 'pending' && (primaryRes.progress ?? '進行中…')}
      </div>
    </div>
  );
}
