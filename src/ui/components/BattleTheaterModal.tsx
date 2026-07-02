import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import type { BattleDetail } from '../../game/types';
import { OfficerPortrait } from './OfficerPortrait';
import { useLanguage } from '../i18n';
import { pickVoiceLine } from '../../game/data/voiceLines';
import { playSfx } from '../../game/systems/sound';

// 3D siege set-piece — lazy so the heavy three.js bundle loads only on demand.
const SiegeDiorama3D = lazy(() =>
  import('./SiegeDiorama3D').then((m) => ({ default: m.SiegeDiorama3D })),
);

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
  useEscapeKey(onClose);
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const currentYear = useGameStore((s) => s.date.year);

  // Reveal phases one at a time. Players can click to skip ahead.
  const phases = battle.phases ?? [];
  const totalSteps = phases.length + 1; // last step = summary
  const [step, setStep] = useState(0);
  const [showSiege, setShowSiege] = useState(false);

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

  // Distribute total casualties across phases so the troop counter ticks down each act.
  // Heaviest fighting at mainEngagement, lighter in skirmish / pursuit, none in formation.
  const phaseWeights: Record<string, number> = {
    formation: 0,
    skirmish: 0.18,
    mainEngagement: 0.62,
    pursuit: 0.2,
  };
  const cumulative = (upTo: number) => {
    let aw = 0, dw = 0;
    for (let i = 0; i <= upTo && i < phases.length; i++) {
      aw += phaseWeights[phases[i].phase] ?? 0;
      dw += phaseWeights[phases[i].phase] ?? 0;
    }
    return { aw, dw };
  };
  const fullA = phases.reduce((s, p) => s + (phaseWeights[p.phase] ?? 0), 0) || 1;
  const fullD = fullA;
  const idx = Math.min(step, phases.length - 1);
  const { aw: aWeight, dw: dWeight } = isSummary ? { aw: fullA, dw: fullD } : cumulative(idx);
  const aTroopsNow = Math.max(0, Math.round(battle.attacker.troops - (battle.attackerLosses * aWeight) / fullA));
  const dTroopsNow = Math.max(0, Math.round(battle.defender.troops - (battle.defenderLosses * dWeight) / fullD));

  // Per-phase casualty delta (for floating numbers).
  const phaseAttackerLoss = currentPhase && !isSummary
    ? Math.round((battle.attackerLosses * (phaseWeights[currentPhase.phase] ?? 0)) / fullA)
    : 0;
  const phaseDefenderLoss = currentPhase && !isSummary
    ? Math.round((battle.defenderLosses * (phaseWeights[currentPhase.phase] ?? 0)) / fullD)
    : 0;

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
          background: 'var(--tkm-bg-modal, #141c25)',
          border: '1px solid var(--tkm-text-h2, #e6c473)',
          width: 720, maxWidth: '96vw',
          padding: '1.5rem',
          color: 'var(--tkm-text-body, #b6c2cc)',
          fontFamily: 'var(--tkm-font-body)',
          position: 'relative',
        }}
      >
        {/* Title row */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          {lang !== 'en' && (
            <div style={{
              fontFamily: 'var(--tkm-font-zh)',
              fontSize: '1.8rem',
              color: 'var(--tkm-text-h2, #e6c473)',
              letterSpacing: '0.14rem',
            }}>
              {city?.name.zh ?? '?'} 之戰
            </div>
          )}
          {lang !== 'zh' && (
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--tkm-text-muted)',
              letterSpacing: '0.07rem',
              marginTop: '0.2rem',
            }}>
              Battle of {city?.name.en ?? '?'}
            </div>
          )}
        </div>

        {/* Two armies */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '1rem', alignItems: 'center', marginBottom: '0.6rem',
        }}>
          <ArmyPanel
            officer={attacker}
            force={aForce}
            troops={aTroopsNow}
            morale={aMoraleNow}
            year={currentYear}
            align="left"
            winning={battle.attackerWins && isSummary}
          />
          <ArmyPanel
            officer={defender}
            force={dForce}
            troops={dTroopsNow}
            morale={dMoraleNow}
            year={currentYear}
            align="right"
            winning={!battle.attackerWins && isSummary}
          />
        </div>

        {/* Animated battlefield strip */}
        <BattlefieldStrip
          phase={currentPhase?.phase ?? 'formation'}
          step={step}
          attackerLosses={phaseAttackerLoss}
          defenderLosses={phaseDefenderLoss}
          flashKey={
            (battle.stratagem?.succeeded && currentPhase?.phase === 'mainEngagement')
              ? `s${step}` : null
          }
        />

        {/* Phase progress dots */}
        <div className="tkm-phase-dots">
          {phases.map((_, i) => (
            <div
              key={i}
              className={`tkm-phase-dot ${i === step ? 'active' : i < step ? 'past' : ''}`}
            />
          ))}
          {isSummary && <div className="tkm-phase-dot active" />}
        </div>

        {/* Phase banner + narration */}
        {!isSummary && currentPhase && (
          <div
            key={step}
            style={{
              animation: 'tkmFadeIn 0.45s ease-out',
              background: 'var(--tkm-bg-raised, #18212b)',
              border: '1px solid var(--tkm-border-soft, #1e2832)',
              padding: '0.9rem 1.1rem',
              minHeight: 90,
            }}
          >
            <div style={{
              fontFamily: 'var(--tkm-font-zh)',
              fontSize: '1.15rem',
              color: 'var(--tkm-text-h2, #e6c473)',
              letterSpacing: '0.08rem',
              marginBottom: '0.3rem',
            }}>
              第 {step + 1} 幕 · {PHASE_LABEL[currentPhase.phase]?.zh ?? currentPhase.phase}
              <span style={{
                fontSize: '0.7rem',
                color: 'var(--tkm-text-muted)',
                fontStyle: 'italic',
                marginLeft: '0.5rem',
                letterSpacing: '0.05rem',
              }}>
                {PHASE_LABEL[currentPhase.phase]?.en ?? currentPhase.phase}
              </span>
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: 'var(--tkm-text-h1, #eef4f8)',
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
              background: 'var(--tkm-bg-raised, #18212b)',
              border: '1px solid var(--tkm-text-h2, #e6c473)',
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
              {battle.attackerWins ? (battle.cityFalls ? (lang === 'en' ? 'City Fell' : '城陷') : (lang === 'en' ? 'Victory' : '勝')) : (lang === 'en' ? 'Defeat' : '敗北')}
            </div>

            {/* 觀此攻城 — open the 3D siege set-piece for a city assault
                (any non-field battle is an assault on a walled city). */}
            {!battle.field && (
              <div style={{ textAlign: 'center', marginBottom: '0.7rem' }}>
                <button
                  onClick={() => setShowSiege(true)}
                  style={{
                    background: 'linear-gradient(135deg,#7a3a1a,#caa53d)', color: '#1a1206',
                    border: 'none', borderRadius: '6px', padding: '0.45rem 1.1rem',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', letterSpacing: '0.08rem',
                  }}
                >
                  ⚔ {lang === 'en' ? 'Watch the Siege (3D)' : '觀此攻城 (3D)'}
                </button>
              </div>
            )}

            {/* 計謀交鋒 — both sides' schemes, 看破 & 連環 surfaced. */}
            {(battle.stratagem || battle.defenderStratagem) && (
              <div style={{ fontSize: '0.82rem', textAlign: 'center', marginBottom: '0.5rem', letterSpacing: '0.06rem' }}>
                {battle.stratagem && (
                  <div style={{ color: battle.stratagem.succeeded ? 'var(--tkm-warn)' : 'var(--tkm-text-muted)' }}>
                    {battle.stratagem.seenThrough ? '👁' : battle.stratagem.succeeded ? '✓' : '✗'} {lang === 'en' ? '攻' : '攻'}・{lang === 'en' ? battle.stratagem.nameEn : battle.stratagem.nameZh}
                    {battle.stratagem.seenThrough ? (lang === 'en' ? ' — seen through!' : '被看破!')
                      : lang === 'en' ? (battle.stratagem.succeeded ? ' succeeded' : ' failed') : (battle.stratagem.succeeded ? ' 之計成' : ' 之計敗')}
                    {battle.stratagemChain && (lang === 'en'
                      ? ` ＋連環 ${battle.stratagemChain.nameEn}${battle.stratagemChain.succeeded ? '✓' : '✗'}`
                      : ` ＋連環 ${battle.stratagemChain.nameZh}${battle.stratagemChain.succeeded ? '✓' : '✗'}`)}
                  </div>
                )}
                {battle.defenderStratagem && (
                  <div style={{ color: battle.defenderStratagem.succeeded ? 'var(--tkm-good, #7ed68a)' : 'var(--tkm-text-muted)' }}>
                    {battle.defenderStratagem.seenThrough ? '👁' : battle.defenderStratagem.succeeded ? '✓' : '✗'} 守・{lang === 'en' ? battle.defenderStratagem.nameEn : battle.defenderStratagem.nameZh}
                    {battle.defenderStratagem.seenThrough ? (lang === 'en' ? ' — seen through!' : '被看破!')
                      : (battle.defenderStratagem.succeeded ? (lang === 'en' ? ' held' : ' 之計成') : (lang === 'en' ? ' failed' : ' 之計敗'))}
                  </div>
                )}
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
                <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.7rem' }}>{lang === 'en' ? 'Attacker losses' : '攻方傷亡'}</div>
                <div style={{
                  fontFamily: 'var(--tkm-font-mono)',
                  color: 'var(--tkm-danger)',
                  fontSize: '1.1rem',
                }}>−{battle.attackerLosses.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--tkm-text-muted)', fontSize: '0.7rem' }}>{lang === 'en' ? 'Defender losses' : '守方傷亡'}</div>
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
          letterSpacing: '0.07rem',
        }}>
          {isSummary
            ? '⟫ 點擊任意處關閉'
            : `⟫ ${step + 1} / ${phases.length}  ·  點擊跳至下一幕`}
        </div>
      </div>

      {showSiege && (
        <div
          onClick={(e) => { e.stopPropagation(); setShowSiege(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#000' }}
        >
          <Suspense fallback={<div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#e6c473' }}>…</div>}>
            <SiegeDiorama3D
              attackerColor={forces[battle.attacker.forceId ?? '']?.color ?? '#b8442e'}
              defenderColor={forces[battle.defender.forceId ?? '']?.color ?? '#3a7dd9'}
              cityFell={battle.cityFalls}
            />
          </Suspense>
          <div style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', color: '#e6c473', fontSize: '1rem', letterSpacing: '0.12rem', textShadow: '0 2px 8px #000', pointerEvents: 'none' }}>
            {cities[battle.cityId]?.name.zh ?? ''} {lang === 'en' ? 'Siege' : '攻城戰'} — {battle.cityFalls ? (lang === 'en' ? 'the gate is broken' : '城門告破') : (lang === 'en' ? 'the walls hold' : '城垣堅守')}
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: '#9aa7b2', fontSize: '0.75rem', pointerEvents: 'none' }}>
            {lang === 'en' ? 'drag to orbit · tap to close' : '拖動環視 · 點擊關閉'}
          </div>
        </div>
      )}
    </div>
  );
}

function BattlefieldStrip({
  phase, step, attackerLosses, defenderLosses, flashKey,
}: {
  phase: 'formation' | 'skirmish' | 'mainEngagement' | 'pursuit';
  step: number;
  attackerLosses: number;
  defenderLosses: number;
  flashKey: string | null;
}) {
  // Layout: 6 silhouettes per side, marching in place.
  // Position shifts by phase: formation = far apart, skirmish = closer + arrows fly,
  // mainEngagement = interlocked (clash flash), pursuit = attackers chasing right.
  const layout: Record<typeof phase, { aStart: number; aGap: number; dStart: number; dGap: number; cls: string }> = {
    formation:      { aStart: 8,  aGap: 14, dStart: 70, dGap: 14, cls: '' },
    skirmish:       { aStart: 16, aGap: 14, dStart: 60, dGap: 14, cls: '' },
    mainEngagement: { aStart: 30, aGap: 8,  dStart: 50, dGap: 8,  cls: '' },
    pursuit:        { aStart: 30, aGap: 11, dStart: 75, dGap: 14, cls: 'pursuit' },
  } as never;
  const cfg = layout[phase] ?? layout.formation;
  const aGlyph = '人';
  const dGlyph = '人';

  return (
    <div className="tkm-battlefield" key={`strip-${step}`}>
      {flashKey && <div className="tkm-flash" key={flashKey} />}

      {/* Attacker soldiers */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`a-${i}`}
          className={`tkm-soldier attacker ${phase === 'mainEngagement' ? 'tkm-advance-r' : ''}`}
          style={{ left: `${cfg.aStart + i * cfg.aGap}%`, animationDelay: `${i * 0.08}s` }}
        >
          {aGlyph}
        </div>
      ))}
      {/* Defender soldiers */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`d-${i}`}
          className={`tkm-soldier defender ${phase === 'mainEngagement' ? 'tkm-advance-l' : ''}`}
          style={{ left: `${cfg.dStart + i * cfg.dGap}%`, animationDelay: `${i * 0.08}s` }}
        >
          {dGlyph}
        </div>
      ))}

      {/* Arrow volley for skirmish */}
      {phase === 'skirmish' && Array.from({ length: 8 }).map((_, i) => {
        const fromLeft = i % 2 === 0;
        const startY = 35 + (i % 3) * 6;
        return (
          <div
            key={`arrow-${i}`}
            className="tkm-arrow"
            style={{
              left: fromLeft ? '20%' : '70%',
              top: `${startY}%`,
              animationDelay: `${i * 0.08}s`,
              ['--dx' as never]: fromLeft ? '180px' : '-180px',
              ['--dy' as never]: '-10px',
              ['--ang' as never]: fromLeft ? '-12deg' : '192deg',
            } as React.CSSProperties}
          />
        );
      })}

      {/* Pursuit dust */}
      {phase === 'pursuit' && Array.from({ length: 5 }).map((_, i) => (
        <div
          key={`dust-${i}`}
          className="tkm-dust"
          style={{
            left: `${20 + i * 14}%`,
            bottom: '10px',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}

      {/* Clash icon for mainEngagement */}
      {phase === 'mainEngagement' && (
        <div style={{
          position: 'absolute', left: '50%', top: '30%',
          transform: 'translate(-50%, -50%)',
          fontSize: '2.2rem', color: 'var(--tkm-warn, #e6c473)',
        }}>
          <span className="tkm-clash">⚔</span>
        </div>
      )}

      {/* Casualty floaters */}
      {attackerLosses > 0 && (
        <div className="tkm-casualty" style={{ left: '18%' }}>
          −{attackerLosses.toLocaleString()}
        </div>
      )}
      {defenderLosses > 0 && (
        <div className="tkm-casualty" style={{ right: '18%' }}>
          −{defenderLosses.toLocaleString()}
        </div>
      )}
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
  const lang = useLanguage();
  const moraleColor =
    morale >= 60 ? 'var(--tkm-success, #b8c87a)' :
    morale >= 30 ? 'var(--tkm-warn, #e6c473)' :
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
            color: 'var(--tkm-text-h1, #eef4f8)',
            letterSpacing: '0.07rem',
          }}>
            {officer.name.zh}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--tkm-text-muted)',
            letterSpacing: '0.05rem',
          }}>
            {force?.name.zh ?? '—'} · {troops.toLocaleString()} 兵
          </div>
        </div>
      </div>
      {/* Morale bar */}
      <div style={{ width: '100%', minWidth: 140 }}>
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--tkm-text-muted)',
          letterSpacing: '0.05rem',
          textAlign: align,
        }}>{lang === 'en' ? 'Morale' : '士氣'} {Math.round(morale)}</div>
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
