import { useMemo } from 'react';
import { SCENARIOS_BY_ID } from '../../game/data/scenarios';
import { SCENARIO_OBJECTIVES } from '../../game/data';
import { scenarioPrologue } from '../../game/data/scenarioPrologues';
import { findObjectiveFor } from '../../game/systems/objectives';
import { useGameStore } from '../../game/state/store';
import { useDesc, useLanguage, useT } from '../i18n';
import { Modal } from './Modal';
import { Name } from './Name';

/**
 * 序章 — the opening page of a campaign.
 *
 * Shown once, right after a scenario loads: the state of the realm, then the
 * part addressed to your own house, then the goals your house is playing for.
 * The objectives table carries a lot of writing (a primary and one or two
 * secondaries per force, each with its own line of history) that the corner
 * HUD panel has no room for — this is where it gets read.
 *
 * Scenarios with no prologue entry never open this; the flag is set at load
 * time only when the board has one.
 */
export function PrologueModal() {
  const open = useGameStore((s) => s.prologueOpen);
  const scenarioId = useGameStore((s) => s.scenarioId);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const year = useGameStore((s) => s.date.year);
  const closePrologue = useGameStore((s) => s.closePrologue);
  const lang = useLanguage();
  const t = useT();
  const d = useDesc();

  const prologue = useMemo(
    () => scenarioPrologue(scenarioId, playerForceId),
    [scenarioId, playerForceId],
  );
  const objective = useMemo(
    () => findObjectiveFor(scenarioId, playerForceId, SCENARIO_OBJECTIVES),
    [scenarioId, playerForceId],
  );

  if (!open || !prologue) return null;

  const scenario = scenarioId ? SCENARIOS_BY_ID[scenarioId] : null;
  const force = playerForceId ? forces[playerForceId] : null;
  const ruler = force?.rulerOfficerId ? officers[force.rulerOfficerId] : null;
  const body = (text: { zh: string; en: string }) => (lang === 'en' ? text.en : text.zh);

  const goals = objective ? [objective.primary, ...(objective.secondary ?? [])] : [];

  return (
    <Modal
      onClose={closePrologue}
      title={scenario ? <Name pair={scenario.name} /> : t('序章', 'Prologue')}
      icon="巻"
      badge={`${year} ${t('年', 'AD')}`}
      width="min(680px, 100%)"
      scrollBody
      closeOnBackdrop={false}
      ariaLabel={t('序章', 'Prologue')}
    >
      {/* 天下大勢 — the board, as everyone sees it. */}
      <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.85, color: '#c8d2da', fontSize: '0.9rem' }}>
        {body(prologue.intro)}
      </p>

      {/* 本家 — the part addressed to your house. */}
      {prologue.force && (
        <>
          <div
            style={{
              margin: '1.1rem 0 0.6rem', paddingBottom: '0.3rem',
              borderBottom: '1px solid #2b3845', color: '#e6c473',
              fontSize: '0.85rem', letterSpacing: '0.05rem',
            }}
          >
            {force ? <Name pair={force.name} /> : null}
            {ruler && <span style={{ color: '#7a8893', marginLeft: '0.5rem', fontSize: '0.78rem' }}>
              <Name pair={ruler.name} />
            </span>}
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.85, color: '#c8d2da', fontSize: '0.9rem' }}>
            {body(prologue.force)}
          </p>
        </>
      )}

      {/* 所圖 — what this house is playing for. */}
      {goals.length > 0 && (
        <div style={{ marginTop: '1.2rem' }}>
          <div
            style={{
              color: '#7a8893', fontSize: '0.7rem', letterSpacing: '0.07rem',
              textTransform: 'uppercase', marginBottom: '0.5rem',
            }}
          >
            {t('所圖', 'Your Objectives')}
          </div>
          {goals.map((g, i) => (
            <div
              key={g.title.en}
              style={{
                borderLeft: `2px solid ${i === 0 ? '#e6c473' : '#3a4754'}`,
                padding: '0.15rem 0 0.15rem 0.7rem',
                marginBottom: '0.6rem',
              }}
            >
              <div style={{ color: i === 0 ? '#e6c473' : '#aab6c0', fontSize: '0.88rem' }}>
                <Name pair={g.title} />
                {i > 0 && (
                  <span style={{ color: '#5f6b76', fontSize: '0.7rem', marginLeft: '0.4rem' }}>
                    {t('副', 'secondary')}
                  </span>
                )}
              </div>
              <div style={{ color: '#8f9ba6', fontSize: '0.78rem', lineHeight: 1.6, marginTop: '0.15rem' }}>
                {d(g)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
        <button
          type="button"
          autoFocus
          onClick={closePrologue}
          style={{
            background: '#1a2430', border: '1px solid #e6c473', color: '#e6c473',
            padding: '0.4rem 1.6rem', fontSize: '0.9rem', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.08rem',
          }}
        >
          {t('入局', 'Begin')}
        </button>
      </div>
    </Modal>
  );
}
