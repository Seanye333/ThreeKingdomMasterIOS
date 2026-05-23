import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { BattleDetail } from '../../game/types';
import { OfficerPortrait } from './OfficerPortrait';
import { pickVoiceLine } from '../../game/data/voiceLines';
import { playSfx } from '../../game/systems/sound';

interface Props {
  battle: BattleDetail;
  onClose: () => void;
}

const PHASE_LABEL: Record<string, { zh: string; en: string; sfx: 'horn' | 'sword' | 'crash' | 'gong' }> = {
  formation:      { zh: '布陣',     en: 'Formation',       sfx: 'horn' },
  skirmish:       { zh: '初鋒',     en: 'Skirmish',        sfx: 'arrow' as never },
  mainEngagement: { zh: '主戰',     en: 'Main Engagement', sfx: 'sword' },
  pursuit:        { zh: '追擊',     en: 'Pursuit',         sfx: 'crash' },
};

const PHASE_MS = 2200;

export function BattleTheaterModal({ battle, onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const currentYear = useGameStore((s) => s.date.year);

  // Reveal phases one at a time. Players can click to skip ahead.
  const phases = battle.phases ?? [];
  const totalSteps = phases.length + 1; // last step = summary
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= totalSteps - 1) return;
    const phase = phases[step];
    if (phase) {
      // Phase-specific sfx.
      const sfxMap: Record<string, 'horn' | 'sword' | 'crash' | 'arrow'> = {
        formation: 'horn',
        skirmish: 'arrow',
        mainEngagement: 'sword',
        pursuit: 'crash',
      };
      playSfx(sfxMap[phase.phase] ?? 'click');
    }
    const id = setTimeout(() => setStep((s) => s + 1), PHASE_MS);
    return () => clearTimeout(id);
  }, [step, phases, totalSteps]);

  const attacker = officers[battle.attacker.commanderId];
  const defender = officers[battle.defender.commanderId];
  const aForce = battle.attacker.forceId ? forces[battle.attacker.forceId] : null;
  const dForce = battle.defender.forceId ? forces[battle.defender.forceId] : null;
  const city = cities[battle.cityId];

  const currentPhase = phases[Math.min(step, phases.length - 1)] ?? null;
  const isSummary = step >= phases.length;

  const aMoraleNow = currentPhase?.attackerMorale ?? battle.attackerMoraleEnd ?? 60;
  const dMoraleNow = currentPhase?.defenderMorale ?? battle.defenderMoraleEnd ?? 60;

  // Pick a victor's line when summary appears
  const victorLine = useMemo(() => {
    if (!isSummary) return null;
    const speaker = battle.attackerWins ? attacker : defender;
    if (!speaker) return null;
    return pickVoiceLine(speaker.id, 'rally', Math.random);
  }, [isSummary, battle.attackerWins, attacker, defender]);

  const handleAdvance = () => {
    if (step >= totalSteps - 1) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (!attacker || !defender) {
    onClose();
    return null;
  }

  return (
    <div
      onClick={handleAdvance}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--tkm-bg-modal, #1f1610)',
          border: '1px solid var(--tkm-text-h2, #d4a84a)',
          width: 720, maxWidth: '96vw',
          padding: '1.5rem',
          color: 'var(--tkm-text-body, #c9b89a)',
          fontFamily: 'var(--tkm-font-body)',
          position: 'relative',
        }}
      >
        {/* Title row */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1.8rem',
            color: 'var(--tkm-text-h2, #d4a84a)',
            letterSpacing: '0.4rem',
          }}>
            {city?.name.zh ?? '?'} 之戰
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--tkm-text-muted)',
            letterSpacing: '0.2rem',
            marginTop: '0.2rem',
          }}>
            Battle of {city?.name.en ?? '?'}
          </div>
        </div>

        {/* Two armies */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem', alignItems: 'center', marginBottom: '1.2rem',
        }}>
          {/* Attacker */}
          <ArmyPanel
            officer={attacker}
            force={aForce}
            troops={battle.attacker.troops}
            morale={aMoraleNow}
            year={currentYear}
            align="left"
            winning={battle.attackerWins && isSummary}
          />

          {/* Center clash icon */}
          <div style={{
            fontSize: '2rem',
            color: 'var(--tkm-text-h2, #d4a84a)',
            letterSpacing: '0.2rem',
            textAlign: 'center',
          }}>
            {currentPhase?.phase === 'mainEngagement' ? (
              <span className="tkm-clash">⚔</span>
            ) : (
              <span>⚔</span>
            )}
          </div>

          {/* Defender */}
          <ArmyPanel
            officer={defender}
            force={dForce}
            troops={battle.defender.troops}
            morale={dMoraleNow}
            year={currentYear}
            align="right"
            winning={!battle.attackerWins && isSummary}
          />
        </div>

        {/* Phase banner + narration */}
        {!isSummary && currentPhase && (
          <div
            key={step}
            style={{
              animation: 'tkmFadeIn 0.45s ease-out',
              background: 'var(--tkm-bg-raised, #251c14)',
              border: '1px solid var(--tkm-border-soft, #3a2818)',
              padding: '0.9rem 1.1rem',
              minHeight: 90,
            }}
          >
            <div style={{
              fontFamily: 'var(--tkm-font-zh)',
              fontSize: '1.15rem',
              color: 'var(--tkm-text-h2, #d4a84a)',
              letterSpacing: '0.25rem',
              marginBottom: '0.3rem',
            }}>
              第 {step + 1} 幕 · {PHASE_LABEL[currentPhase.phase]?.zh ?? currentPhase.phase}
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--tkm-text-muted)',
                fontStyle: 'italic',
                marginLeft: '0.5rem',
                letterSpacing: '0.15rem',
              }}>
                {PHASE_LABEL[currentPhase.phase]?.en ?? currentPhase.phase}
              </span>
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--tkm-text-h1, #f0e0b0)',
              lineHeight: 1.6,
            }}>
              {currentPhase.text}
            </div>
          </div>
        )}

        {/* Summary view */}
        {isSummary && (
          <div
            style={{
              animation: 'tkmFadeIn 0.6s ease-out',
              background: 'var(--tkm-bg-raised, #251c14)',
              border: '1px solid var(--tkm-text-h2, #d4a84a)',
              padding: '1rem 1.2rem',
            }}
          >
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--tkm-font-zh)',
              fontSize: '2.2rem',
              color: battle.attackerWins ? 'var(--tkm-success, #b8c87a)' : 'var(--tkm-danger, #b8442e)',
              letterSpacing: '0.5rem',
              marginBottom: '0.6rem',
            }}>
              {battle.attackerWins ? (battle.cityFalls ? '城陷' : '勝') : '敗北'}
            </div>

            {/* Stratagem result */}
            {battle.stratagem && (
              <div style={{
                fontSize: '0.85rem',
                color: battle.stratagem.succeeded ? 'var(--tkm-warn)' : 'var(--tkm-text-muted)',
                textAlign: 'center',
                marginBottom: '0.5rem',
                letterSpacing: '0.2rem',
              }}>
                {battle.stratagem.succeeded ? '✓' : '✗'} {battle.stratagem.nameZh}（{battle.stratagem.nameEn}）
                {battle.stratagem.succeeded ? ' 之計成' : ' 之計敗'}
              </div>
            )}

            {/* Casualties */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem', fontSize: '0.85rem',
              padding: '0.5rem 0',
              borderTop: '1px solid var(--tkm-border-soft)',
              borderBottom: '1px solid var(--tkm-border-soft)',
              marginBottom: '0.5rem',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.7rem' }}>攻方傷亡</div>
                <div style={{
                  fontFamily: 'var(--tkm-font-mono)',
                  color: 'var(--tkm-danger)',
                  fontSize: '1.1rem',
                }}>−{battle.attackerLosses.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.7rem' }}>守方傷亡</div>
                <div style={{
                  fontFamily: 'var(--tkm-font-mono)',
                  color: 'var(--tkm-danger)',
                  fontSize: '1.1rem',
                }}>−{battle.defenderLosses.toLocaleString()}</div>
              </div>
            </div>

            {/* Pursuit / capture / wounded */}
            <div style={{ fontSize: '0.78rem', color: 'var(--tkm-text-body)' }}>
              {battle.pursued && <div>● 追擊得勝，敵餘軍潰散</div>}
              {battle.capturedIds && battle.capturedIds.length > 0 && (
                <div>
                  ● 俘獲 {battle.capturedIds.length} 員：
                  {battle.capturedIds
                    .map((id) => officers[id]?.name.zh)
                    .filter(Boolean)
                    .join('、')}
                </div>
              )}
              {battle.woundedIds && battle.woundedIds.length > 0 && (
                <div>
                  ● 負傷 {battle.woundedIds.length} 員（休養後復出）
                </div>
              )}
              {battle.duelWinnerId && battle.duelLoserId && (
                <div>
                  ● 一騎討 — {officers[battle.duelWinnerId]?.name.zh} 斬 {officers[battle.duelLoserId]?.name.zh}
                </div>
              )}
            </div>

            {/* Victor voice line */}
            {victorLine && (
              <div
                className="tkm-voiceline"
                style={{ marginTop: '0.8rem', fontSize: '0.88rem' }}
              >
                「{victorLine}」
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--tkm-text-muted)',
          marginTop: '0.8rem',
          letterSpacing: '0.2rem',
        }}>
          {isSummary
            ? '⟫ 點擊任意處關閉'
            : `⟫ ${step + 1} / ${phases.length}  ·  點擊跳至下一幕`}
        </div>
      </div>
    </div>
  );
}

function ArmyPanel({
  officer, force, troops, morale, year, align, winning,
}: {
  officer: import('../../game/types').Officer;
  force: import('../../game/types').Force | null;
  troops: number;
  morale: number;
  year: number;
  align: 'left' | 'right';
  winning: boolean;
}) {
  const moraleColor =
    morale >= 60 ? 'var(--tkm-success, #b8c87a)' :
    morale >= 30 ? 'var(--tkm-warn, #d4a84a)' :
    'var(--tkm-danger, #b8442e)';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      gap: '0.4rem',
      filter: winning ? 'drop-shadow(0 0 12px var(--tkm-text-h2))' : 'none',
      transition: 'filter 0.5s',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center',
        flexDirection: align === 'left' ? 'row' : 'row-reverse' }}>
        <OfficerPortrait officer={officer} size={64} forceColor={force?.color} year={year} />
        <div style={{ textAlign: align }}>
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1.15rem',
            color: 'var(--tkm-text-h1, #f0e0b0)',
            letterSpacing: '0.2rem',
          }}>
            {officer.name.zh}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--tkm-text-muted)',
            letterSpacing: '0.15rem',
          }}>
            {force?.name.zh ?? '—'} · {troops.toLocaleString()} 兵
          </div>
        </div>
      </div>
      {/* Morale bar */}
      <div style={{ width: '100%', minWidth: 140 }}>
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--tkm-text-muted)',
          letterSpacing: '0.15rem',
          textAlign: align,
        }}>士氣 {Math.round(morale)}</div>
        <div className="tkm-morale-bar">
          <div
            className="fill"
            style={{
              width: `${Math.max(0, Math.min(100, morale))}%`,
              background: moraleColor,
              marginLeft: align === 'right' ? `${100 - Math.max(0, Math.min(100, morale))}%` : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
