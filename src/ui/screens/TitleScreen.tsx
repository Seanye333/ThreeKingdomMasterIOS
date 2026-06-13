import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SCENARIOS as BUILTIN_SCENARIOS, allScenarios } from '../../game/data';
import { dailySeedString, dailyShareString, loadDailyResults, recentChallengeDays, rollDailyChallenge, winStreak } from '../../game/systems/dailyChallenge';

// Built-ins + installed mod scenarios, resolved once at module load.
const SCENARIOS = (() => { try { return allScenarios(); } catch { return BUILTIN_SCENARIOS; } })();
import { useGameStore } from '../../game/state/store';
import type { Difficulty } from '../../game/state/gameState';
import type { Scenario } from '../../game/types';
import { CustomOfficerCreator } from '../components/CustomOfficerCreator';
import { InstallPrompt } from '../components/InstallPrompt';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { WhatsNewModal } from '../components/WhatsNewModal';
import { GAME_VERSION } from '../../game/data/changelog';
import { ItemsBrowser } from '../components/ItemsBrowser';
import { TacticsModal } from '../components/TacticsModal';
import { PoliciesModal } from '../components/PoliciesModal';
import { IndividualitiesModal } from '../components/IndividualitiesModal';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { SettingsModal } from '../components/SettingsModal';
import { ScenarioOfficersBrowser } from '../components/ScenarioOfficersBrowser';
import { HeroModeModal } from '../components/HeroModeModal';
import { EventEditorModal } from '../components/EventEditorModal';
import { OfficerPortrait } from '../components/OfficerPortrait';
import { DYNASTY_DEFS, type Dynasty } from '../../game/data/dynasties';

// Lazy — MapScreen also imports these dynamically; a static import here was
// pinning them into the main bundle (rolldown INEFFECTIVE_DYNAMIC_IMPORT).
const AchievementsModal = lazy(() =>
  import('../components/AchievementsModal').then((m) => ({ default: m.AchievementsModal })));
const FormationsModal = lazy(() =>
  import('../components/FormationsModal').then((m) => ({ default: m.FormationsModal })));
import { useT, useLanguage, useDesc } from '../i18n';
import styles from './TitleScreen.module.css';

const DIFFICULTIES: Array<{ id: Difficulty; en: string; zh: string; noteZh: string; noteEn: string }> = [
  { id: 'easy',   en: 'Easy',   zh: '初級', noteZh: '我方初始兵力 +20%。AI 攻擊較保守。', noteEn: 'Your starting troops +20%. AI attacks more cautiously.' },
  { id: 'normal', en: 'Normal', zh: '中級', noteZh: '預設平衡。',                              noteEn: 'Default balance.' },
  { id: 'hard',   en: 'Hard',   zh: '上級', noteZh: 'AI 初始兵力 +20%。AI 攻擊較積極。',     noteEn: 'AI starting troops +20%. AI attacks aggressively.' },
];

export function TitleScreen() {
  const loadScenario = useGameStore((s) => s.loadScenario);
  const observeScenario = useGameStore((s) => s.observeScenario);
  const [boardDate, setBoardDate] = useState<string | null>(null);
  const loadRandom = useGameStore((s) => s.loadRandomScenario);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const setHotSeatPlayers = useGameStore((s) => s.setHotSeatPlayers);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);

  // Pre-bake the 3D strategic map's expensive textures while the player is
  // still reading the title screen — small idle slices, so the UI never
  // stutters and entering the map is instant instead of seconds of freeze.
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    // Dynamic import — the title chunk must NOT statically pull the whole
    // three.js map stack (that's what made first paint a 5MB download). The
    // map chunk streams in the background and warms while the player reads.
    import('../components/StrategicMap3D').then(({ warmStrategicAssets }) => {
      if (stop) return;
      const tick = () => {
        if (stop) return;
        const done = warmStrategicAssets();
        if (!done) timer = setTimeout(tick, 8);
      };
      timer = setTimeout(tick, 400);
    });
    return () => { stop = true; clearTimeout(timer); };
  }, []);
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
  const [showHeroMode, setShowHeroMode] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
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
  // The "歷代名將" cross-over list offers eras OTHER than the one this scenario
  // already belongs to — those officers are native to the board already. This
  // is what surfaces the 三國 toggle on a Warring-States / Chu-Han / Sui-Tang
  // board (and, conversely, hides it on a Three-Kingdoms board).
  const NATIVE_DYNASTIES: Record<string, Dynasty[]> = {
    warring: ['warring-states'],
    chuhan: ['chu-han', 'qin'],
    suitang: ['sui', 'tang'],
    sanguo: ['three-kingdoms'],
    whatif: ['three-kingdoms'],
  };
  const visibleDynasties = DYNASTY_DEFS.filter(
    (d) => !(NATIVE_DYNASTIES[eraOf(scenario)] ?? []).includes(d.id),
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

  // Per-force snapshot for the force-selection detail panel.
  const forceStats = (forceId: string) => {
    const cities = scenario.cities.filter((c) => c.ownerForceId === forceId);
    const officers = scenario.officers.filter((o) => o.forceId === forceId && o.status !== 'dead');
    const troops = cities.reduce((s, c) => s + (c.troops || 0), 0);
    const gold = cities.reduce((s, c) => s + (c.gold || 0), 0);
    const food = cities.reduce((s, c) => s + (c.food || 0), 0);
    return { cities: cities.length, officers, troops, gold, food };
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
      <InstallPrompt />
      <WhatsNewModal />
      {boardDate && <LeaderboardModal date={boardDate} onClose={() => setBoardDate(null)} />}
      {/* 版本號 — bottom corner, quiet */}
      <div style={{ position: 'fixed', right: 10, bottom: 6, zIndex: 5, fontSize: '0.62rem', color: '#6a5a45', fontFamily: 'ui-monospace, monospace' }}>
        v{GAME_VERSION}
      </div>
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
        {step === 'scenario' && (() => {
          /* 每日挑戰 — same date, same seed, same start for everyone. */
          const todayStr = dailySeedString();
          const daily = rollDailyChallenge(todayStr, SCENARIOS);
          const dailyScenario = daily ? SCENARIOS.find((sc) => sc.id === daily.scenarioId) : null;
          const dailyForce = dailyScenario?.forces.find((f) => f.id === daily?.forceId);
          const dailyResult = loadDailyResults()[todayStr];
          const launchFor = (dateStr: string) => {
            const roll = rollDailyChallenge(dateStr, SCENARIOS);
            const scen = roll ? SCENARIOS.find((sc) => sc.id === roll.scenarioId) : null;
            const frc = scen?.forces.find((f) => f.id === roll?.forceId);
            if (!roll || !scen || !frc) return;
            const st = useGameStore.getState();
            if (roll.modifiers.some((m) => m.id === 'romance')) st.setRomanceMode(true);
            loadScenario(scen, frc.id, 'hard');
            const st2 = useGameStore.getState();
            st2.setFogOfWar(true);
            if (roll.modifiers.some((m) => m.id === 'poverty')) st2.applyPovertyHandicap();
            st2.startDailyChallenge(dateStr);
          };
          const launchDaily = () => launchFor(todayStr);
          const allResults = loadDailyResults();
          const streak = winStreak(allResults);
          const recent = recentChallengeDays();
          return (
          <section className={styles.scenarioCard} style={{ width: 'min(1060px, 96vw)', maxWidth: 'none' }}>
            {/* 每日挑戰橫幅 */}
            {daily && dailyScenario && dailyForce && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                border: '1px solid #b8584a', background: 'rgba(184, 88, 74, 0.08)',
                padding: '0.45rem 0.8rem', marginBottom: '0.7rem', fontSize: '0.82rem',
              }}>
                <span style={{ color: '#ff9080', letterSpacing: '0.15rem' }}>🔥 {t('每日挑戰', 'Daily')} {todayStr}</span>
                <span style={{ color: '#e8d9b0' }}>
                  {lang === 'en' ? dailyScenario.name.en : dailyScenario.name.zh} · {lang === 'en' ? dailyForce.name.en : dailyForce.name.zh}
                </span>
                <span style={{ color: '#8a7050', fontSize: '0.7rem' }}>
                  {daily.modifiers.map((m) => (lang === 'en' ? m.en : m.zh)).join(' / ')}
                </span>
                {dailyResult && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(dailyShareString(daily, dailyForce.name.zh, dailyResult)).catch(() => undefined)}
                    style={{
                      background: 'transparent', border: '1px solid #5a4530', color: '#c0a878',
                      padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
                    }}
                    title={t('複製戰績', 'Copy result')}
                  >{dailyResult.victory ? `🏆 ${dailyResult.seasons}旬` : '☠'} {t('複製', 'Copy')}</button>
                )}
                {streak > 0 && (
                  <span style={{ color: '#f0d98a', fontSize: '0.72rem' }} title={t('連勝天數', 'Win streak')}>
                    🔥×{streak}
                  </span>
                )}
                <button
                  onClick={launchDaily}
                  style={{
                    marginLeft: 'auto', background: 'linear-gradient(180deg,#4a2418,#321810)',
                    border: '1px solid #ff7050', color: '#ffb0a0', padding: '0.3rem 1rem',
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.2rem',
                  }}
                >{dailyResult ? t('再戰', 'Again') : t('應戰', 'Accept')}</button>
                <button
                  onClick={() => setBoardDate(todayStr)}
                  title={t('每日排行榜', 'Daily leaderboard')}
                  style={{
                    background: 'transparent', border: '1px solid #d4a84a', color: '#f0d98a',
                    padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >🏆</button>
                {/* 補打日曆 — the last seven days, replayable; older days
                    show their result but the window has closed. */}
                <div style={{ flexBasis: '100%', display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: '0.62rem', color: '#8a7050' }}>{t('近七日', 'Last 7')}</span>
                  {recent.map((d) => {
                    const r = allResults[d];
                    const isToday = d === todayStr;
                    return (
                      <button
                        key={d}
                        onClick={() => launchFor(d)}
                        title={`${d}${r ? (r.victory ? ` 🏆 ${r.seasons}旬` : ' ☠') : t(' 未戰', ' unplayed')}`}
                        style={{
                          width: 26, height: 22, cursor: 'pointer', fontSize: '0.62rem',
                          fontFamily: 'ui-monospace, monospace',
                          background: r ? (r.victory ? 'rgba(212,168,74,0.3)' : 'rgba(184,68,46,0.25)') : 'transparent',
                          border: `1px solid ${isToday ? '#ff9080' : r ? (r.victory ? '#d4a84a' : '#8a4538') : '#3a2d20'}`,
                          color: r ? (r.victory ? '#f0d98a' : '#c08070') : '#6a5a45',
                        }}
                      >{Number(d.slice(8))}</button>
                    );
                  })}
                </div>
              </div>
            )}
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

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
              {/* Left — scenario list (scrolls) */}
              <ul className={styles.scenarioList} style={{ flex: '1 1 0', minWidth: 0, maxHeight: 460, overflowY: 'auto' }}>
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
              {/* Right — description + territory preview for the highlighted scenario */}
              <div style={{ flex: '1 1 0', minWidth: 0 }}>
                <p className={styles.scenarioDesc} style={{ marginTop: 0 }}>{desc(scenario)}</p>
                <div style={{ fontSize: '0.78rem', color: '#8a7050', marginBottom: '0.5rem' }}>
                  {startYear} AD · {scenario.forces.length} {t('勢力', 'forces')}
                </div>
                <MiniMap scenario={scenario} labelCapitals />
              </div>
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

            {/* Hero Mode — timed challenge scenarios */}
            <button
              className={styles.officersButton}
              style={{ marginTop: '0.6rem', borderColor: '#c0504a', color: '#e2a07a', letterSpacing: '0.12rem' }}
              onClick={() => setShowHeroMode(true)}
            >
              ⚔ {t('英雄模式 — 限時挑戰', 'Hero Mode — Timed Challenges')}
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
              <button className={styles.officersButton} onClick={() => setShowEventEditor(true)}>{t('事件編輯器', 'Event Editor')}</button>
            </div>
          </section>
          );
        })()}

        {/* ───────────────── STEP 2 — Force ───────────────── */}
        {step === 'force' && (
          <section className={styles.forceSection} style={{ width: 'min(1000px, 96vw)', maxWidth: 'none' }}>
            <div className={styles.forceLabel}>
              {lang === 'en' ? scenario.name.en : scenario.name.zh} · {startYear} AD · {t('君主選擇', 'Choose your force')}
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {/* Left — force list */}
              <ul className={styles.forceList} style={{ flex: '1 1 0', minWidth: 0 }}>
                {scenario.forces.map((force) => {
                  const ruler = scenario.officers.find((o) => o.id === force.rulerOfficerId);
                  if (!ruler) return null;
                  const st = forceStats(force.id);
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
                          {st.cities}{t('城', 'c')} · {st.officers.length}{t('將', 'o')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Right — clickable territory map + force detail */}
              <div style={{ flex: '1 1 0', minWidth: 0, border: '1px solid #4a3520', background: 'rgba(20,16,12,0.5)', padding: '1rem', minHeight: 340 }}>
                <MiniMap scenario={scenario} highlightForceId={selectedForceId} labelCapitals onSelectForce={setSelectedForceId} />
                {selectedForce && selectedRuler ? (() => {
                  const st = forceStats(selectedForce.id);
                  const top = [...st.officers]
                    .sort((a, b) => (b.stats.war + b.stats.leadership + b.stats.intelligence) - (a.stats.war + a.stats.leadership + a.stats.intelligence))
                    .slice(0, 6);
                  const strength = st.cities >= 8 ? t('強', 'Strong') : st.cities >= 3 ? t('中', 'Moderate') : t('弱（高難度）', 'Weak (hard)');
                  return (
                    <div style={{ marginTop: '0.8rem', borderTop: '1px solid #3a2818', paddingTop: '0.7rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <OfficerPortrait officer={selectedRuler} size={72} forceColor={selectedForce.color} year={startYear} />
                        <div>
                          <div style={{ fontSize: '1.1rem', color: '#d4a84a' }}>{lang === 'en' ? selectedForce.name.en : selectedForce.name.zh}</div>
                          <div style={{ fontSize: '0.85rem', color: '#a08c6a' }}>
                            {lang === 'en' ? selectedRuler.name.en : selectedRuler.name.zh}
                            {selectedRuler.courtesyName && (
                              <span style={{ opacity: 0.6 }}> {lang === 'en' ? selectedRuler.courtesyName.en : selectedRuler.courtesyName.zh}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* ruler abilities */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.3rem', margin: '0.8rem 0', textAlign: 'center', fontSize: '0.75rem' }}>
                        {([['統', selectedRuler.stats.leadership], ['武', selectedRuler.stats.war], ['智', selectedRuler.stats.intelligence], ['政', selectedRuler.stats.politics], ['魅', selectedRuler.stats.charisma]] as const).map(([k, v]) => (
                          <div key={k}><div style={{ color: '#8a7050' }}>{k}</div><div style={{ color: '#d4a84a', fontSize: '0.95rem' }}>{v}</div></div>
                        ))}
                      </div>
                      {/* force data */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1rem', fontSize: '0.78rem', color: '#a08c6a', borderTop: '1px solid #3a2818', paddingTop: '0.6rem' }}>
                        <div>{t('城池', 'Cities')}: <b style={{ color: '#d4a84a' }}>{st.cities}</b></div>
                        <div>{t('武將', 'Officers')}: <b style={{ color: '#d4a84a' }}>{st.officers.length}</b></div>
                        <div>{t('兵力', 'Troops')}: <b style={{ color: '#d4a84a' }}>{st.troops.toLocaleString()}</b></div>
                        <div>{t('資金', 'Gold')}: <b style={{ color: '#d4a84a' }}>{st.gold.toLocaleString()}</b></div>
                        <div>{t('兵糧', 'Food')}: <b style={{ color: '#d4a84a' }}>{st.food.toLocaleString()}</b></div>
                        <div>{t('勢力', 'Strength')}: <b style={{ color: '#d4a84a' }}>{strength}</b></div>
                      </div>
                      {/* notable officers */}
                      <div style={{ marginTop: '0.7rem', borderTop: '1px solid #3a2818', paddingTop: '0.6rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#8a7050', marginBottom: '0.4rem' }}>{t('主要武將', 'Notable Officers')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {top.map((o) => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#a08c6a' }}>
                              <OfficerPortrait officer={o} size={26} forceColor={selectedForce.color} year={startYear} />
                              {lang === 'en' ? o.name.en : o.name.zh}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ color: '#6a5238', textAlign: 'center', padding: '1.2rem 1rem 0.5rem', fontSize: '0.85rem' }}>
                    {t('點擊地圖上的城池，或左側列表，選擇勢力', 'Click a city on the map — or the list — to pick a force')}
                  </div>
                )}
              </div>
            </div>
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
            <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '1.05rem', color: '#d4a84a' }}>{lang === 'en' ? scenario.name.en : scenario.name.zh}</div>
              <div style={{ fontSize: '0.74rem', color: '#8a7050' }}>{startYear} AD</div>
            </div>
            {selectedForce && selectedRuler && (() => {
              const st = forceStats(selectedForce.id);
              return (
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', border: '1px solid #4a3520', background: 'rgba(20,16,12,0.5)', padding: '0.7rem', marginBottom: '0.9rem' }}>
                  <OfficerPortrait officer={selectedRuler} size={64} forceColor={selectedForce.color} year={startYear} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', color: '#d4a84a', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedForce.color }} />
                      {lang === 'en' ? selectedForce.name.en : selectedForce.name.zh}
                      <span style={{ color: '#a08c6a', fontSize: '0.85rem' }}>{lang === 'en' ? selectedRuler.name.en : selectedRuler.name.zh}</span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#8a7050', margin: '0.3rem 0' }}>
                      統{selectedRuler.stats.leadership} 武{selectedRuler.stats.war} 智{selectedRuler.stats.intelligence} 政{selectedRuler.stats.politics} 魅{selectedRuler.stats.charisma}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#a08c6a' }}>
                      {t('城', 'Cities')} {st.cities} · {t('將', 'Officers')} {st.officers.length} · {t('兵', 'Troops')} {st.troops.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ width: 156, flexShrink: 0 }}>
                    <MiniMap scenario={scenario} highlightForceId={selectedForce.id} />
                  </div>
                </div>
              );
            })()}

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
                  <button type="button" onClick={() => setEnabledDynasties(visibleDynasties.map((d) => d.id))} style={miniBtn(false)}>{t('全選', 'All')}</button>
                  <button type="button" onClick={() => setEnabledDynasties([])} style={miniBtn(false)}>{t('清除', 'None')}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  {visibleDynasties.map((d) => {
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
            {/* 演義模擬器 — watch the AI play every realm from turn one. */}
            <button
              className={styles.officersButton}
              style={{ width: '100%', marginTop: '0.5rem', borderColor: '#7a6aa8', color: '#b0a0d0' }}
              onClick={() => { observeScenario(scenario, difficulty); setTutorialStep(null); }}
              title={t('不選勢力,純觀看 AI 群雄逐鹿', 'Pick no side — just watch the AI warlords contend')}
            >
              👁 {t('觀戰模式(演義模擬器)', 'Spectate (AI vs AI)')}
            </button>
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
      {showHeroMode && <HeroModeModal onClose={() => setShowHeroMode(false)} />}
      {showEventEditor && <EventEditorModal scenario={scenario} onClose={() => setShowEventEditor(false)} />}
      {showLoad && <SaveSlotsModal mode="load" onClose={() => setShowLoad(false)} />}
      {showAchievements && (
        <Suspense fallback={null}><AchievementsModal onClose={() => setShowAchievements(false)} /></Suspense>
      )}
      {showItems && <ItemsBrowser onClose={() => setShowItems(false)} />}
      {showFormations && (
        <Suspense fallback={null}><FormationsModal onClose={() => setShowFormations(false)} /></Suspense>
      )}
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

// A compact territory map of a scenario: every city a dot coloured by its owning
// force (neutral = dark), with adjacency lines for a sense of the road network.
// Pass highlightForceId to spotlight one force's holdings.
function MiniMap({ scenario, highlightForceId, labelCapitals, onSelectForce }: { scenario: Scenario; highlightForceId?: string | null; labelCapitals?: boolean; onSelectForce?: (fid: string) => void }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const colorOf = (fid: string | null) =>
    fid ? (scenario.forces.find((f) => f.id === fid)?.color ?? '#4a3a28') : '#4a3a28';
  const forceName = (fid: string | null) =>
    fid ? (scenario.forces.find((f) => f.id === fid)?.name.zh ?? '—') : '中立';
  const hc = hoverId ? scenario.cities.find((c) => c.id === hoverId) ?? null : null;
  return (
    <svg
      viewBox="110 150 790 570"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: 'auto', display: 'block', background: '#14100c', border: '1px solid #3a2818', borderRadius: 4 }}
    >
      {/* Schematic rivers — the Yellow (north) and Yangtze (south) */}
      <path d="M 150 380 Q 330 300 500 322 Q 660 342 808 306" stroke="#33424f" strokeWidth={5} fill="none" opacity={0.5} strokeLinecap="round" />
      <path d="M 320 590 Q 510 548 670 548 Q 790 540 866 500" stroke="#33424f" strokeWidth={5} fill="none" opacity={0.5} strokeLinecap="round" />
      {scenario.cities.map((c) =>
        c.adjacentCityIds.map((aid) => {
          if (aid <= c.id) return null; // draw each edge once
          const a = scenario.cities.find((x) => x.id === aid);
          if (!a) return null;
          return (
            <line
              key={`${c.id}-${aid}`}
              x1={c.coords.x} y1={c.coords.y}
              x2={a.coords.x} y2={a.coords.y}
              stroke="#2a2018" strokeWidth={1}
            />
          );
        }),
      )}
      {scenario.cities.map((c) => {
        const hl = !!highlightForceId && c.ownerForceId === highlightForceId;
        const dim = !!highlightForceId && !hl;
        const isHover = hoverId === c.id;
        // Dot size scales with city stature (population), so the great cities read big.
        const baseR = c.population >= 200000 ? 8 : c.population >= 100000 ? 6.2 : c.population >= 40000 ? 4.8 : 3.6;
        return (
          <circle
            key={c.id}
            cx={c.coords.x} cy={c.coords.y}
            r={isHover ? baseR + 3 : hl ? baseR + 2 : baseR}
            fill={colorOf(c.ownerForceId)}
            stroke={isHover ? '#ffffff' : hl ? '#fff5e0' : '#1a1410'}
            strokeWidth={isHover ? 2 : hl ? 1.6 : 0.8}
            opacity={dim && !isHover ? 0.4 : 1}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoverId(c.id)}
            onMouseLeave={() => setHoverId((p) => (p === c.id ? null : p))}
            onClick={() => { if (onSelectForce && c.ownerForceId) onSelectForce(c.ownerForceId); }}
          />
        );
      })}
      {/* Capital labels — each force's seat, in its own colour */}
      {labelCapitals && scenario.forces.map((f) => {
        const cap = scenario.cities.find((c) => c.id === f.capitalCityId);
        if (!cap) return null;
        const dim = !!highlightForceId && f.id !== highlightForceId;
        return (
          <text
            key={f.id}
            x={cap.coords.x} y={cap.coords.y - 11}
            fontSize={22} textAnchor="middle"
            fill={f.color} stroke="#14100c" strokeWidth={0.7}
            opacity={dim ? 0.4 : 1}
            style={{ paintOrder: 'stroke', fontWeight: 'bold', pointerEvents: 'none' }}
          >
            {cap.name.zh}
          </text>
        );
      })}
      {/* Hover tooltip — city name, owner and garrison */}
      {hc && (() => {
        const left = hc.coords.x > 540;
        const tx = left ? -206 : 14;
        return (
          <g transform={`translate(${hc.coords.x}, ${hc.coords.y})`} pointerEvents="none">
            <rect x={tx} y={-36} width={192} height={50} rx={3} fill="#1a1410" stroke={colorOf(hc.ownerForceId)} strokeWidth={1.5} />
            <text x={tx + 11} y={-15} fontSize={18} fill="#d4a84a" style={{ fontWeight: 'bold' }}>{hc.name.zh}</text>
            <text x={tx + 11} y={6} fontSize={14} fill="#a08c6a">
              {forceName(hc.ownerForceId)} · {hc.troops.toLocaleString()}{hc.ownerForceId ? ' 兵' : ''}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
