import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../../game/data';
import {
  loadAchievementProgress,
} from '../../game/systems/achievements';
import type { AchievementProgress } from '../../game/types';
import { useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

const TIER_COLORS = {
  bronze: '#a86b3a',
  silver: '#b8c0c8',
  gold: '#d4a84a',
  legendary: '#ffce4a',
};

export function AchievementsModal({ onClose }: Props) {
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const desc = useDesc();

  useEffect(() => {
    setProgress(loadAchievementProgress());
  }, []);

  const done = progress?.completed ?? {};
  const completedCount = Object.keys(done).length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'grid', placeItems: 'center',
        zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '1px solid #5a4530',
          width: 'min(900px,100%)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '1rem 1.5rem', borderBottom: '1px solid #4a3520',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>勳功</div>
            <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>
              Achievements ({completedCount} / {ACHIEVEMENTS.length})
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        {progress && (
          <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #4a3520', fontSize: '0.78rem', color: '#c0a878', fontFamily: 'ui-monospace, monospace' }}>
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
                  background: unlocked ? '#1a1410' : '#0a0805',
                  border: `1px solid ${unlocked ? color : '#3a2d20'}`,
                  padding: '0.55rem 0.7rem',
                  opacity: unlocked ? 1 : 0.5,
                  boxShadow: unlocked ? `0 0 6px ${color}33` : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ color: unlocked ? color : '#6a5238', fontSize: '0.95rem' }}>
                    {unlocked ? '✓' : '✗'} {a.name.zh}
                    <span style={{ fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic', marginLeft: '0.4rem' }}>
                      {a.name.en}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.6rem',
                    color,
                    letterSpacing: '0.15rem',
                    textTransform: 'uppercase',
                  }}>{a.tier}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#c0a878', marginTop: '0.2rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {desc(a)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
