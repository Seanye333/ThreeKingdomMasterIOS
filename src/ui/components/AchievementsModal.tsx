import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../../game/data';
import {
  loadAchievementProgress,
} from '../../game/systems/achievements';
import type { AchievementProgress } from '../../game/types';
import { useDesc, useLanguage } from '../i18n';
import { Modal } from './Modal';
import { Name } from './Name';

interface Props {
  onClose: () => void;
}

const TIER_COLORS = {
  bronze: '#a86b3a',
  silver: '#b8c0c8',
  gold: '#e6c473',
  legendary: '#ffce4a',
};

export function AchievementsModal({ onClose }: Props) {
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const desc = useDesc();
  const lang = useLanguage();

  useEffect(() => {
    setProgress(loadAchievementProgress());
  }, []);

  const done = progress?.completed ?? {};
  const completedCount = Object.keys(done).length;

  return (
    <Modal
      onClose={onClose}
      scrollBody
      padding="0"
      width="min(900px, 100%)"
      maxHeight="90vh"
      title={lang === 'en' ? 'Achievements' : '勳功'}
      badge={`${completedCount} / ${ACHIEVEMENTS.length}`}
    >
        {progress && (
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #2b3845', fontSize: '0.78rem', color: '#aab6c0', fontFamily: 'ui-monospace, monospace' }}>
            Total kills: {progress.counters.kills.toLocaleString()} ·
            Cities taken: {progress.counters.citiesTaken} ·
            Recruits: {progress.counters.recruits} ·
            Battles won: {progress.counters.battlesWon} ·
            Duels won: {progress.counters.duelsWon} ·
            Career runs: {progress.counters.careerRuns}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.55rem',
            padding: '1rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {ACHIEVEMENTS.map((a) => {
            const unlocked = !!done[a.id];
            const color = TIER_COLORS[a.tier];
            return (
              <div
                key={a.id}
                style={{
                  background: unlocked ? '#10161e' : '#080b0e',
                  border: `1px solid ${unlocked ? color : '#26323e'}`,
                  padding: '0.55rem 0.7rem',
                  opacity: unlocked ? 1 : 0.5,
                  boxShadow: unlocked ? `0 0 6px ${color}33` : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ color: unlocked ? color : '#6a5238', fontSize: '0.95rem' }}>
                    {unlocked ? '✓' : '✗'} <Name pair={a.name} />
                  </div>
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.6rem',
                    color,
                    letterSpacing: '0.05rem',
                    textTransform: 'uppercase',
                  }}>{a.tier}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#aab6c0', marginTop: '0.2rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {desc(a)}
                </div>
              </div>
            );
          })}
        </div>
    </Modal>
  );
}
