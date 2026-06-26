import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { debateProwess } from '../../game/systems/wordWar';
import { persuasionTargets, buildPersuasionScenario, PERSUADE_COST, type PersuasionTarget } from '../../game/systems/persuasion';
import { scenarioOutcome, scenarioResultLine } from '../../game/systems/debateScenarios';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { Debate3DStage } from './debate/Debate3DStage';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 说客 — the live 舌戰 as a strategic verb (§3.4). Send a silver-tongued envoy to
 * a REACHABLE rival city to 说降 a disgruntled enemy officer (defect) or 游说 a
 * neutral/rival lord into an alliance. The bout runs through the interactive
 * debate engine; a win lands real consequences (a defection, an alliance, a gift
 * of gold) via scenarioOutcome → applyScenarioEffects. Costs gold up front, win
 * or lose — a frontier tool, not an everywhere-at-once cheat.
 */
export function PersuasionModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);
  const spendCityGold = useGameStore((s) => s.spendCityGold);
  const recordDeed = useGameStore((s) => s.recordDeed);

  const player = playerForceId ? forces[playerForceId] : null;
  const capital = player ? cities[player.capitalCityId] : null;
  const canAfford = (capital?.gold ?? 0) >= PERSUADE_COST;

  const targets = useMemo(
    () => persuasionTargets({ officers, cities, forces, diplomacy, playerForceId }),
    [officers, cities, forces, diplomacy, playerForceId],
  );
  // 善言之士 — your own free officers, sharpest tongues first.
  const envoys = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && (o.status === 'idle' || o.status === 'active'))
      .sort((a, b) => debateProwess(b) - debateProwess(a)),
    [officers, playerForceId],
  );

  const [envoyId, setEnvoyId] = useState<string | null>(null);
  const [target, setTarget] = useState<PersuasionTarget | null>(null);
  const [active, setActive] = useState<{ envoyId: string; target: PersuasionTarget } | null>(null);
  const [result, setResult] = useState<{ text: string; notes: string[] } | null>(null);

  const envoy = envoyId ? officers[envoyId] : null;
  const ready = !!(envoy && target && canAfford);

  // ── Live bout ──────────────────────────────────────────────────────────────
  if (active) {
    const me = officers[active.envoyId];
    const foe = officers[active.target.officerId];
    if (me && foe) {
      const scenario = buildPersuasionScenario(active.target);
      return (
        <Debate3DStage
          me={me}
          foe={foe}
          topic={active.target.topic}
          difficulty={active.target.difficulty}
          onComplete={(outcome) => {
            const won = outcome.winner === 'me';
            const routed = won && outcome.routed;
            setActive(null);
            const effects = scenarioOutcome(scenario, { won, routed });
            applyScenarioEffects(effects);
            if (won) recordDeed(active.envoyId, { debatesWon: 1, ...(routed ? { debateRouts: 1 } : {}) });
            const head = scenarioResultLine(scenario, { won, routed });
            setTarget(null);
            setResult({
              text: lang === 'en' ? head.en : head.zh,
              notes: effects.map((e) => (lang === 'en' ? e.textEn : e.textZh)),
            });
          }}
        />
      );
    }
    setActive(null);
  }

  const KIND_LABEL = (k: PersuasionTarget['kind']) =>
    k === 'defect' ? { icon: '🎭', zh: '說降', en: 'Defect' } : { icon: '🤝', zh: '結盟', en: 'Ally' };

  return (
    <Modal onClose={onClose} title={t('说客', 'Persuader-Envoy')} icon="🗣" width="min(580px, 100%)" scrollBody>
      <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
        {t(`遣善言之士赴鄰境,當面論辯 —— 說降心懷不滿的敵將,或游說諸侯結盟。費 ${PERSUADE_COST} 金(成敗皆耗),勝則棄暗投明、或盟約立成。`,
          `Send a silver tongue to a bordering rival city to talk a disgruntled officer into defecting, or sway a lord into alliance. Costs ${PERSUADE_COST} gold (win or lose); a win lands a defection or an alliance.`)}
      </div>

      {/* 遣誰出馬 — pick the envoy. */}
      <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', margin: '0 0 0.4rem' }}>{t('遣誰出馬', 'Choose your envoy')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6, marginBottom: '0.9rem' }}>
        {envoys.map((o) => {
          const sel = o.id === envoyId;
          return (
            <button key={o.id} onClick={() => { setEnvoyId(sel ? null : o.id); setResult(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', background: sel ? 'rgba(136,183,232,0.16)' : '#10161e', border: `1px solid ${sel ? '#88b7e8' : '#26323e'}`, borderRadius: 4, padding: '0.4rem 0.5rem', cursor: 'pointer', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' }}>
              <OfficerPortrait officer={o} size={32} forceColor="#88b7e8" year={year} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#f2dd9a', fontSize: '0.85rem' }}>{pickName(o.name, lang)}</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>{t('智', 'INT')} {o.stats.intelligence} · {t('魅', 'CHA')} {o.stats.charisma}</span>
              </span>
            </button>
          );
        })}
        {envoys.length === 0 && <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '0.8rem 0', gridColumn: '1 / -1' }}>{t('無可遣之說客。', 'No envoy available.')}</div>}
      </div>

      {/* 訪何人 — pick the mark. */}
      <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', margin: '0 0 0.4rem' }}>{t('訪何人(鄰境可達)', 'Choose a mark (reachable)')} ({targets.length})</div>
      <div style={{ display: 'grid', gap: 6, marginBottom: '0.9rem' }}>
        {targets.map((tg) => {
          const sel = target?.officerId === tg.officerId && target?.kind === tg.kind;
          const k = KIND_LABEL(tg.kind);
          const diff = tg.difficulty === 'peerless' ? t('宗師', 'Master') : tg.difficulty === 'veteran' ? t('名士', 'Adept') : t('學徒', 'Novice');
          return (
            <button key={`${tg.kind}-${tg.officerId}`} onClick={() => { setTarget(sel ? null : tg); setResult(null); }}
              style={{ textAlign: 'left', padding: '0.5rem 0.6rem', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', background: sel ? 'rgba(230,176,96,0.16)' : '#10161e', border: `1px solid ${sel ? '#e0b060' : '#26323e'}`, color: '#e6edf3' }}>
              <div style={{ color: '#f2dd9a', fontSize: '0.9rem' }}>
                {k.icon} {t(k.zh, k.en)} · {pickName(tg.officerName, lang)}
                <span style={{ color: '#8a96a0', fontSize: '0.72rem' }}> — {pickName(tg.forceName, lang)} · {pickName(tg.cityName, lang)}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9aa6b0', marginTop: 2 }}>
                {tg.kind === 'defect' ? t(`忠誠 ${tg.loyalty}(越低越易說動)`, `loyalty ${tg.loyalty} (lower = easier)`) : t('游說結盟', 'sway into alliance')} · {t('對手', 'foe')} {diff}
              </div>
            </button>
          );
        })}
        {targets.length === 0 && <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '0.8rem 0' }}>{t('鄰境無可游說之人 —— 需與他勢力接壤。', 'No reachable marks — you must border a rival.')}</div>}
      </div>

      <button
        disabled={!ready}
        onClick={() => {
          if (!envoyId || !target || !player) return;
          if (!spendCityGold(player.capitalCityId, PERSUADE_COST)) { setResult({ text: t('國庫不足,難備使資。', 'The treasury cannot fund the embassy.'), notes: [] }); return; }
          setResult(null);
          setActive({ envoyId, target });
        }}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
          background: ready ? 'linear-gradient(180deg,#6e4a23,#3e2813)' : '#1e2832',
          border: `1px solid ${ready ? '#e0b060' : '#2b3845'}`, color: ready ? '#ffe8c0' : '#5f6c76',
          cursor: ready ? 'pointer' : 'default', fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem' }}
      >🗣 {t(`遣說客出使（費 ${PERSUADE_COST} 金）`, `Send the envoy (${PERSUADE_COST} gold)`)}</button>
      {!canAfford && envoy && target && (
        <div style={{ fontSize: '0.74rem', color: '#d88', marginBottom: '0.8rem' }}>⚠ {t('國庫金不足。', 'Not enough gold in the treasury.')}</div>
      )}

      {result && (
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 6, padding: '0.6rem 0.8rem', marginBottom: '0.4rem' }}>
          <div style={{ color: '#e6c473', marginBottom: result.notes.length ? '0.4rem' : 0 }}>{result.text}</div>
          {result.notes.map((n, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#9ed68a', lineHeight: 1.6 }}>✦ {n}</div>)}
        </div>
      )}
    </Modal>
  );
}
