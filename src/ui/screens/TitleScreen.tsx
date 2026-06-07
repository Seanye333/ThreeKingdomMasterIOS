import { useMemo, useState, type CSSProperties } from 'react';
import { SCENARIOS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Difficulty } from '../../game/state/gameState';
import type { Scenario } from '../../game/types';
import { AchievementsModal } from '../components/AchievementsModal';
import { CustomOfficerCreator } from '../components/CustomOfficerCreator';
import { ItemsBrowser } from '../components/ItemsBrowser';
import { FormationsModal } from '../components/FormationsModal';
import { TacticsModal } from '../components/TacticsModal';
import { PoliciesModal } from '../components/PoliciesModal';
import { IndividualitiesModal } from '../components/IndividualitiesModal';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { SettingsModal } from '../components/SettingsModal';
import { ScenarioOfficersBrowser } from '../components/ScenarioOfficersBrowser';
import { DYNASTY_DEFS, type Dynasty } from '../../game/data/dynasties';
import { useT, useLanguage, useDesc } from '../i18n';
import styles from './TitleScreen.module.css';

const DIFFICULTIES: Array<{ id: Difficulty; en: string; zh: string; noteZh: string; noteEn: string }> = [
  { id: 'easy',   en: 'Easy',   zh: '初級', noteZh: '我方初始兵力 +20%。AI 攻擊較保守。', noteEn: 'Your starting troops +20%. AI attacks more cautiously.' },
  { id: 'normal', en: 'Normal', zh: '中級', noteZh: '預設平衡。',                              noteEn: 'Default balance.' },
  { id: 'hard',   en: 'Hard',   zh: '上級', noteZh: 'AI 初始兵力 +20%。AI 攻擊較積極。',     noteEn: 'AI starting troops +20%. AI attacks aggressively.' },
];

export function TitleScreen() {
  const loadScenario = useGameStore((s) => s.loadScenario);
  const loadRandom = useGameStore((s) => s.loadRandomScenario);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const setHotSeatPlayers = useGameStore((s) => s.setHotSeatPlayers);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [showOfficers, setShowOfficers] = useState(false);
  const [showCustomOfficer, setShowCustomOfficer] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [hotSeatMode, setHotSeatMode] = useState(false);
  const [careerMode, setCareerMode] = useState(false);
  const [romance, setRomance] = useState(false);
  const [roguelike, setRoguelike] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const [showTactics, setShowTactics] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showIndividualities, setShowIndividualities] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDynasties, setShowDynasties] = useState(false);
  const enterCareerMode = useGameStore((s) => s.enterCareerMode);
  const setRomanceMode = useGameStore((s) => s.setRomanceMode);
  const setRoguelikeMode = useGameStore((s) => s.setRoguelikeMode);
  const enabledDynasties = useGameStore((s) => s.enabledDynasties);
  const setEnabledDynasties = useGameStore((s) => s.setEnabledDynasties);
  const toggleDynasty = (d: Dynasty) => {
    const set = new Set(enabledDynasties);
    if (set.has(d)) set.delete(d); else set.add(d);
    setEnabledDynasties([...set]);
  };
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  const scenario = useMemo<Scenario>(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );
  const startYear = scenario.startDate.year;

  // ── New-game wizard (三国志14-style stepped flow) ──────────────────────
  const [step, setStep] = useState<'scenario' | 'force' | 'options'>('scenario');
  const [selectedForceId, setSelectedForceId] = useState<string | null>(null);
  const ERAS = [
    { id: 'warring', zh: '戰國', en: 'Warring States' },
    { id: 'chuhan',  zh: '楚漢', en: 'Chu-Han' },
    { id: 'sanguo',  zh: '三國', en: 'Three Kingdoms' },
    { id: 'suitang', zh: '隋唐', en: 'Sui-Tang' },
    { id: 'whatif',  zh: '假想', en: 'What-If' },
  ] as const;
  const eraOf = (s: Scenario): string => {
    if (s.id.startsWith('scn-ws-')) return 'warring';
    if (s.id.startsWith('scn-ch-')) return 'chuhan';
    if (s.id.startsWith('scn-st-')) return 'suitang';
    if (s.kind === 'whatif') return 'whatif';
    return 'sanguo';
  };
  const [activeEra, setActiveEra] = useState<string>('sanguo');
  const eraScenarios = useMemo(
    () => SCENARIOS.filter((s) => eraOf(s) === activeEra),
    [activeEra],
  );
  const selectedForce = scenario.forces.find((f) => f.id === selectedForceId) ?? null;
  const selectedRuler = selectedForce
    ? scenario.officers.find((o) => o.id === selectedForce.rulerOfficerId) ?? null
    : null;

  // Launch with the chosen force, honouring hot-seat / chronicle modes.
  const startGame = (forceId: string) => {
    if (hotSeatMode) {
      const human = prompt(t('人類玩家數量？(2–4)', 'How many human players? (2–4)'), '2');
      const n = Math.max(2, Math.min(4, Number(human) || 2));
      const allForces = scenario.forces.slice(0, n);
      setHotSeatPlayers(allForces.map((f, i) => ({
        forceId: f.id, label: `P${i + 1}: ${lang === 'zh' ? f.name.zh : f.name.en}`,
      })));
      loadScenario(scenario, allForces[0].id, difficulty);
    } else {
      loadScenario(scenario, forceId, difficulty);
    }
    if (careerMode) {
      const officersInForce = scenario.officers.filter((o) => o.forceId === forceId);
      const list = officersInForce
        .map((o, i) => `${i + 1}. ${lang === 'zh' ? o.name.zh : `${o.name.zh} ${o.name.en}`} (W${o.stats.war} I${o.stats.intelligence})`)
        .join('\n');
      const choice = prompt(`${t('一代記主角 — 請輸入編號：', 'Chronicle officer — pick a number:')}\n\n${list}`, '1');
      const idx = Math.max(0, Math.min(officersInForce.length - 1, Number(choice) - 1));
      const picked = officersInForce[idx] ?? officersInForce[0];
      if (picked) enterCareerMode(picked.id);
    }
    setTutorialStep(0);
  };

  const STEPS = [
    { k: 'scenario' as const, n: '①', zh: '劇本', en: 'Scenario' },
    { k: 'force' as const,    n: '②', zh: '勢力', en: 'Force' },
    { k: 'options' as const,  n: '③', zh: '開局', en: 'Setup' },
  ];

  const whatIfBadge: CSSProperties = {
    marginLeft: 'auto', background: '#3a2d20', color: '#c178c7',
    border: '1px solid #c178c7', padding: '0.08rem 0.4rem',
    fontSize: '0.6rem', letterSpacing: '0.15rem', borderRadius: 2,
  };
  const navPrimary = (enabled: boolean): CSSProperties => ({
    borderColor: enabled ? '#d4a84a' : '#4a3520',
    color: enabled ? '#d4a84a' : '#6a5238',
    background: enabled ? '#3a2818' : 'transparent',
    fontWeight: 'bold',
  });

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {lang !== 'en' && <span className={styles.titleZh}>三國志</span>}
          {lang !== 'zh' && <span className={styles.titleEn}>Three Kingdom Masters</span>}
          <svg
            className="tkm-brush-stroke"
            viewBox="0 0 300 80"
            style={{ display: 'block', margin: '0.5rem auto 0', maxWidth: 300, opacity: 0.85 }}
            fill="none"
            stroke="#d4a84a"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <path d="M 20 25 Q 80 18 145 25" />
            <path d="M 20 45 Q 80 38 145 45" />
            <path d="M 20 65 Q 80 58 145 65" />
            <path d="M 180 18 Q 220 40 270 65" style={{ animationDelay: '0.9s' }} />
          </svg>
        </h1>
        {/* Stepped-wizard indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
          {STEPS.map((s, i) => {
            const on = step === s.k;
            const done = STEPS.findIndex((x) => x.k === step) > i;
            return (
              <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  onClick={() => {
                    // allow stepping back to a completed step
                    if (i <= STEPS.findIndex((x) => x.k === step)) setStep(s.k);
                  }}
                  style={{
                    padding: '0.25rem 0.8rem',
                    border: `1px solid ${on ? '#d4a84a' : done ? '#8a7050' : '#4a3520'}`,
                    background: on ? '#3a2818' : 'transparent',
                    color: on ? '#d4a84a' : done ? '#a08c6a' : '#6a5238',
                    fontFamily: 'inherit', fontSize: '0.82rem', letterSpacing: '0.1rem',
                    cursor: i <= STEPS.findIndex((x) => x.k === step) ? 'pointer' : 'default',
                  }}
                >
                  {s.n} {lang === 'en' ? s.en : s.zh}
                </button>
                {i < STEPS.length - 1 && <span style={{ color: '#4a3520' }}>→</span>}
              </div>
            );
          })}
        </div>
      </header>

      <main className={styles.main} style={{ flexDirection: 'column', alignItems: 'center' }}>
        {/* ───────────────── STEP 1 — Scenario ───────────────── */}
        {step === 'scenario' && (
          <section className={styles.scenarioCard} style={{ width: 'min(920px, 94vw)', maxWidth: 'none' }}>
            {/* Era tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
              {ERAS.map((e) => {
                const count = SCENARIOS.filter((s) => eraOf(s) === e.id).length;
                const on = activeEra === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setActiveEra(e.id)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      border: `1px solid ${on ? '#d4a84a' : '#4a3520'}`,
                      background: on ? '#3a2818' : 'transparent',
                      color: on ? '#d4a84a' : '#8a7050',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
                    }}
                  >
                    {lang === 'en' ? e.en : e.zh}{' '}
                    <span style={{ opacity: 0.55, fontSize: '0.7rem' }}>{count}</span>
                  </button>
                );
              })}
            </div>

            <ul className={styles.scenarioList}>
              {eraScenarios.map((s) => (
                <li key={s.id}>
                  <button
                    className={`${styles.scenarioButton} ${scenarioId === s.id ? styles.scenarioSelected : ''}`}
                    onClick={() => { setScenarioId(s.id); setSelectedForceId(null); }}
                  >
                    <span className={styles.scenarioYear}>{s.startDate.year} AD</span>
                    <span className={styles.scenarioName}>
                      {lang !== 'en' && <span className={styles.scenarioNameZh}>{s.name.zh}</span>}
                      {lang !== 'zh' && <span className={styles.scenarioNameEn}>{s.name.en}</span>}
                    </span>
                    {s.kind === 'whatif' && <span style={whatIfBadge}>{t('假想', 'WHAT-IF')}</span>}
                  </button>
                </li>
              ))}
            </ul>

            <p className={styles.scenarioDesc}>{desc(scenario)}</p>
            <div style={{ fontSize: '0.78rem', color: '#8a7050', marginBottom: '0.7rem' }}>
              {startYear} AD · {scenario.forces.length} {t('勢力', 'forces')}
            </div>

            <button
              className={styles.officersButton}
              style={navPrimary(true)}
              onClick={() => {
                // If the highlighted scenario isn't in the active era tab, jump to
                // the first of the active era so step 2 matches what's shown.
                if (eraOf(scenario) !== activeEra && eraScenarios[0]) {
                  setScenarioId(eraScenarios[0].id);
                  setSelectedForceId(null);
                }
                setStep('force');
              }}
            >
              {t('下一步：選擇勢力 →', 'Next: Choose Force →')}
            </button>

            {/* Secondary tools (encyclopaedia / load / random / custom) */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid #3a2818', paddingTop: '0.7rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button className={styles.officersButton} onClick={() => setShowLoad(true)}>{t('載入存檔', 'Load Game')}</button>
              <button
                className={styles.officersButton}
                onClick={() => {
                  const count = Number(prompt(t('勢力數量？(3–8)', 'How many forces? (3–8)'), '5') ?? '5');
                  const year = Number(prompt(t('年份？(180–240)', 'Year? (180–240)'), '200') ?? '200');
                  if (count >= 2 && count <= 10 && year >= 100 && year <= 280) loadRandom(count, year);
                }}
              >{t('隨機劇本', 'Random')}</button>
              <button className={styles.officersButton} onClick={() => setShowOfficers(true)}>{t('武將一覽', 'Officers')}</button>
              <button className={styles.officersButton} onClick={() => setShowItems(true)}>{t('名品一覽', 'Items')}</button>
              <button className={styles.officersButton} onClick={() => setShowFormations(true)}>{t('陣形一覽', 'Formations')}</button>
              <button className={styles.officersButton} onClick={() => setShowTactics(true)}>{t('戰法一覽', 'Tactics')}</button>
              <button className={styles.officersButton} onClick={() => setShowPolicies(true)}>{t('政策一覽', 'Policies')}</button>
              <button className={styles.officersButton} onClick={() => setShowIndividualities(true)}>{t('個性一覽', 'Traits')}</button>
              <button className={styles.officersButton} onClick={() => setShowCustomOfficer(true)}>{t('自定義武將', 'Custom Officer')}</button>
              <button className={styles.officersButton} onClick={() => setShowAchievements(true)}>{t('勳功', 'Achievements')}</button>
            </div>
          </section>
        )}

        {/* ───────────────── STEP 2 — Force ───────────────── */}
        {step === 'force' && (
          <section className={styles.forceSection} style={{ width: 'min(920px, 94vw)', maxWidth: 'none' }}>
            <div className={styles.forceLabel}>
              {lang === 'en' ? scenario.name.en : scenario.name.zh} · {startYear} AD · {t('君主選擇', 'Choose your force')}
            </div>
            <ul className={styles.forceList}>
              {scenario.forces.map((force) => {
                const ruler = scenario.officers.find((o) => o.id === force.rulerOfficerId);
                if (!ruler) return null;
                return (
                  <li key={force.id}>
                    <button
                      className={`${styles.forceButton} ${selectedForceId === force.id ? styles.scenarioSelected : ''}`}
                      onClick={() => setSelectedForceId(force.id)}
                    >
                      <span className={styles.forceColor} style={{ background: force.color }} />
                      <span className={styles.forceText}>
                        {lang !== 'en' && <span className={styles.forceNameZh}>{force.name.zh}</span>}
                        {lang !== 'zh' && <span className={styles.forceNameEn}>{ruler.name.en}</span>}
                        {lang === 'zh' && <span className={styles.forceNameEn}>{ruler.name.zh}</span>}
                      </span>
                      <span className={styles.forceStats}>
                        W{ruler.stats.war} · I{ruler.stats.intelligence} · P{ruler.stats.politics} · C{ruler.stats.charisma}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
              <button className={styles.officersButton} style={{ flex: 1 }} onClick={() => setStep('scenario')}>
                {t('← 返回劇本', '← Back')}
              </button>
              <button
                className={styles.officersButton}
                style={{ flex: 2, ...navPrimary(!!selectedForceId) }}
                disabled={!selectedForceId}
                onClick={() => selectedForceId && setStep('options')}
              >
                {t('下一步：開局設定 →', 'Next: Setup →')}
              </button>
            </div>
          </section>
        )}

        {/* ───────────────── STEP 3 — Setup ───────────────── */}
        {step === 'options' && (
          <section className={styles.scenarioCard} style={{ width: 'min(720px, 94vw)', maxWidth: 'none' }}>
            <div style={{ fontSize: '0.95rem', color: '#d4a84a', marginBottom: '0.9rem', textAlign: 'center' }}>
              {lang === 'en' ? scenario.name.en : scenario.name.zh}
              {selectedForce && selectedRuler && (
                <>
                  {' · '}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedForce.color, display: 'inline-block' }} />
                    {lang === 'en' ? selectedRuler.name.en : `${selectedForce.name.zh}（${selectedRuler.name.zh}）`}
                  </span>
                </>
              )}
            </div>

            <div className={styles.difficultyLabel}>{t('難易度', 'Difficulty')}</div>
            <div className={styles.difficultyRow}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={`${styles.diffButton} ${difficulty === d.id ? styles.diffSelected : ''}`}
                  onClick={() => setDifficulty(d.id)}
                  title={t(d.noteZh, d.noteEn)}
                >
                  {lang !== 'en' && <span className={styles.diffZh}>{d.zh}</span>}
                  {lang !== 'zh' && <span className={styles.diffEn}>{d.en}</span>}
                </button>
              ))}
            </div>
            <p className={styles.difficultyNote}>
              {(() => { const d = DIFFICULTIES.find((x) => x.id === difficulty); return d ? t(d.noteZh, d.noteEn) : ''; })()}
            </p>

            {/* Game modes */}
            <label style={{ display: 'block', marginTop: '0.6rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
              <input type="checkbox" checked={hotSeatMode} onChange={(e) => setHotSeatMode(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('輪流模式（多人共用鍵盤）', 'Hot-seat (players share keyboard)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
              <input type="checkbox" checked={careerMode} onChange={(e) => setCareerMode(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('一代記模式（選擇一位武將為主角）', 'Chronicle mode (pick one officer as your avatar)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
              <input type="checkbox" checked={romance} onChange={(e) => { setRomance(e.target.checked); setRomanceMode(e.target.checked); }} style={{ marginRight: '0.4rem' }} />
              {t('演義模式（歷史事件按時觸發）', 'Romance mode (historical events fire on schedule)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
              <input type="checkbox" checked={roguelike} onChange={(e) => { setRoguelike(e.target.checked); setRoguelikeMode(e.target.checked); }} style={{ marginRight: '0.4rem' }} disabled={!careerMode} />
              {t('Roguelike 模式（主角陣亡即遊戲結束；需開啟一代記）', 'Roguelike (chronicle officer death = game over; requires Chronicle mode)')}
            </label>

            {/* Cross-over historical officers */}
            <button
              type="button"
              onClick={() => setShowDynasties((v) => !v)}
              style={{
                display: 'block', width: '100%', marginTop: '0.6rem',
                background: enabledDynasties.length > 0 ? '#3a2818' : 'transparent',
                border: '1px solid #4a3520', color: enabledDynasties.length > 0 ? '#d4a84a' : '#8a7050',
                padding: '0.35rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', textAlign: 'left',
              }}
            >
              {showDynasties ? '▾' : '▸'} {t('歷代名將', 'Historical Officers')}
              {enabledDynasties.length > 0 && (
                <span style={{ float: 'right', color: '#d4a84a' }}>{enabledDynasties.length} {t('朝', 'dyn.')}</span>
              )}
            </button>
            {showDynasties && (
              <div style={{ marginTop: '0.4rem', padding: '0.5rem', border: '1px solid #4a3520', background: 'rgba(20,16,12,0.5)' }}>
                <div style={{ fontSize: '0.7rem', color: '#8a7050', marginBottom: '0.4rem' }}>
                  {t(
                    '勾選後，對應朝代的名將以「未發現」狀態加入劇本，依出生地隱於各城，需「搜索人才」尋得。',
                    'Selected dynasties join as unsearched free agents at their hometown cities — use Search for Talent to discover them.',
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem' }}>
                  <button type="button" onClick={() => setEnabledDynasties(DYNASTY_DEFS.map((d) => d.id))} style={miniBtn(false)}>{t('全選', 'All')}</button>
                  <button type="button" onClick={() => setEnabledDynasties([])} style={miniBtn(false)}>{t('清除', 'None')}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  {DYNASTY_DEFS.map((d) => {
                    const on = enabledDynasties.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer',
                          padding: '0.2rem 0.4rem', background: on ? 'rgba(212,168,74,0.08)' : 'transparent',
                          border: `1px solid ${on ? '#5a4530' : 'transparent'}`, fontSize: '0.75rem',
                          color: on ? '#d4a84a' : '#a08c6a',
                        }}
                      >
                        <input type="checkbox" checked={on} onChange={() => toggleDynasty(d.id)} />
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{lang === 'en' ? d.name.en : d.name.zh}</span>
                        <span style={{ fontSize: '0.65rem', color: '#6a5238' }}>{lang === 'en' ? d.era.en : d.era.zh}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className={styles.officersButton} style={{ flex: 1 }} onClick={() => setStep('force')}>
                {t('← 返回', '← Back')}
              </button>
              <button
                className={styles.officersButton}
                style={{ flex: 2, ...navPrimary(true), fontSize: '1rem', padding: '0.6rem' }}
                onClick={() => { if (selectedForceId) startGame(selectedForceId); }}
              >
                {t('▶ 開始遊戲', '▶ Start Game')}
              </button>
            </div>
          </section>
        )}
      </main>

      {showOfficers && (
        <ScenarioOfficersBrowser scenario={scenario} onClose={() => setShowOfficers(false)} />
      )}
      {showCustomOfficer && (
        <CustomOfficerCreator
          scenario={scenario}
          onClose={() => setShowCustomOfficer(false)}
          onCreate={(custom) => {
            const playerForceId = custom.affiliationForceId ?? scenario.forces[0].id;
            loadScenario(scenario, playerForceId, difficulty, {
              id: custom.id,
              name: { zh: custom.zhName, en: custom.enName },
              courtesyName: custom.courtesyZh || custom.courtesyEn
                ? { zh: custom.courtesyZh, en: custom.courtesyEn }
                : undefined,
              stats: custom.stats,
              skills: custom.skills,
              affiliationForceId: custom.affiliationForceId,
            });
          }}
        />
      )}
      {showLoad && <SaveSlotsModal mode="load" onClose={() => setShowLoad(false)} />}
      {showAchievements && <AchievementsModal onClose={() => setShowAchievements(false)} />}
      {showItems && <ItemsBrowser onClose={() => setShowItems(false)} />}
      {showFormations && <FormationsModal onClose={() => setShowFormations(false)} />}
      {showTactics && <TacticsModal onClose={() => setShowTactics(false)} />}
      {showPolicies && <PoliciesModal onClose={() => setShowPolicies(false)} />}
      {showIndividualities && <IndividualitiesModal onClose={() => setShowIndividualities(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Settings gear in top-right corner */}
      <button
        onClick={() => setShowSettings(true)}
        title="設定 / Settings"
        style={{
          position: 'fixed', top: 16, right: 16, width: 44, height: 44,
          background: 'rgba(20, 14, 8, 0.85)', border: '1px solid #d4a84a',
          color: '#d4a84a', fontSize: '1.4rem', cursor: 'pointer',
          fontFamily: 'serif', boxShadow: '0 0 8px rgba(0,0,0,0.6)', zIndex: 50,
        }}
      >⚙</button>
    </div>
  );
}

function miniBtn(disabled: boolean): CSSProperties {
  return {
    background: '#3a2818',
    border: '1px solid #4a3520',
    color: disabled ? '#6a5238' : '#d4a84a',
    padding: '0.15rem 0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
  };
}
