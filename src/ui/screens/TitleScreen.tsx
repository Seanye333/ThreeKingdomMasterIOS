import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { SCENARIOS as BUILTIN_SCENARIOS, allScenarios } from '../../game/data';
import { dailySeedString, dailyShareString, loadDailyResults, recentChallengeDays, rollDailyChallenge, winStreak } from '../../game/systems/dailyChallenge';

// Built-ins + installed mod scenarios, resolved once at module load.
const SCENARIOS = (() => { try { return allScenarios(); } catch { return BUILTIN_SCENARIOS; } })();
import { useGameStore } from '../../game/state/store';
import type { Difficulty } from '../../game/state/gameState';
import type { Scenario } from '../../game/types';
import { CustomOfficerCreator } from '../components/CustomOfficerCreator';
import { Seal } from '../components/Seal';
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
import { Modal } from '../components/Modal';
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
    // MapScreen 殼層 chunk 一併預取 — 不然要等「開始遊戲」按下才拉(慢網下
    // 是按鈕後的一段可見等待)。fire-and-forget;失敗就照舊按需載入。
    import('./MapScreen').catch(() => undefined);
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
  const lifespanMode = useGameStore((s) => s.lifespanMode ?? 'historical');
  const setLifespanMode = useGameStore((s) => s.setLifespanMode);
  const noBattleDeath = useGameStore((s) => s.noBattleDeath ?? false);
  const setNoBattleDeath = useGameStore((s) => s.setNoBattleDeath);
  const reviveDeadOfficers = useGameStore((s) => s.reviveDeadOfficers ?? false);
  const setReviveDeadOfficers = useGameStore((s) => s.setReviveDeadOfficers);
  const aiStrength = useGameStore((s) => s.aiStrength ?? 3);
  const setAiStrength = useGameStore((s) => s.setAiStrength);
  const startHandicap = useGameStore((s) => s.startHandicap ?? 'even');
  const setStartHandicap = useGameStore((s) => s.setStartHandicap);
  const victoryGoal = useGameStore((s) => s.victoryGoal ?? 'free');
  const setVictoryGoal = useGameStore((s) => s.setVictoryGoal);
  const placementMode = useGameStore((s) => s.placementMode ?? 'historical');
  const setPlacementMode = useGameStore((s) => s.setPlacementMode);
  const fogOfWar = useGameStore((s) => s.fogOfWar ?? false);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  const startTaxRate = useGameStore((s) => s.startTaxRate ?? 'normal');
  const setStartTaxRate = useGameStore((s) => s.setStartTaxRate);
  const startInflation = useGameStore((s) => s.startInflation ?? 0);
  const setStartInflation = useGameStore((s) => s.setStartInflation);
  const aiStartTroops = useGameStore((s) => s.aiStartTroops ?? 'even');
  const setAiStartTroops = useGameStore((s) => s.setAiStartTroops);
  const battleDifficulty = useGameStore((s) => s.battleDifficulty ?? null);
  const setBattleDifficulty = useGameStore((s) => s.setBattleDifficulty);
  const lifespanLength = useGameStore((s) => s.lifespanLength ?? 'historical');
  const setLifespanLength = useGameStore((s) => s.setLifespanLength);
  const agingStatLock = useGameStore((s) => s.agingStatLock ?? false);
  const setAgingStatLock = useGameStore((s) => s.setAgingStatLock);
  const talentDiscovery = useGameStore((s) => s.talentDiscovery ?? 'normal');
  const setTalentDiscovery = useGameStore((s) => s.setTalentDiscovery);
  const duelFrequency = useGameStore((s) => s.duelFrequency ?? 'normal');
  const setDuelFrequency = useGameStore((s) => s.setDuelFrequency);
  const disasterFrequency = useGameStore((s) => s.disasterFrequency ?? 'normal');
  const setDisasterFrequency = useGameStore((s) => s.setDisasterFrequency);
  const ironman = useGameStore((s) => s.ironman ?? false);
  const setIronman = useGameStore((s) => s.setIronman);
  const newOfficers = useGameStore((s) => s.newOfficers ?? 'off');
  const setNewOfficers = useGameStore((s) => s.setNewOfficers);
  const fictionalPool = useGameStore((s) => s.fictionalPool ?? 'off');
  const setFictionalPool = useGameStore((s) => s.setFictionalPool);
  const initialDiplomacy = useGameStore((s) => s.initialDiplomacy ?? 'neutral');
  const setInitialDiplomacy = useGameStore((s) => s.setInitialDiplomacy);
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
  // 開局治所 — player-chosen starting capital (null = scenario default).
  const [capitalChoice, setCapitalChoice] = useState<string | null>(null);
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
  // Reset the capital choice whenever the force (or scenario) changes.
  useEffect(() => { setCapitalChoice(null); }, [selectedForceId, scenarioId]);
  // Cities the chosen force owns — offered as initial-capital options.
  const selectedForceCities = useMemo(
    () => (selectedForceId ? scenario.cities.filter((c) => c.ownerForceId === selectedForceId) : []),
    [scenario, selectedForceId],
  );
  const selectedRuler = selectedForce
    ? scenario.officers.find((o) => o.id === selectedForce.rulerOfficerId) ?? null
    : null;

  // Launch with the chosen force. Hot-seat and chronicle mode detour through
  // styled pickers (no more native prompt() with a typed-in number).
  const startGame = (forceId: string) => {
    if (careerMode) { setCareerPick(forceId); return; }   // 一代記 — pick a face, not a number
    if (hotSeatMode) { setHotSeatPick(forceId); return; } // 熱座 — pick the player count
    loadScenario(scenario, forceId, difficulty, undefined, capitalChoice ?? undefined);
    setTutorialStep(0);
  };
  const launchCareer = (forceId: string, officerId: string) => {
    loadScenario(scenario, forceId, difficulty, undefined, capitalChoice ?? undefined);
    enterCareerMode(officerId);
    setTutorialStep(0);
    setCareerPick(null);
  };
  const launchHotSeat = (forceId: string, humans: number) => {
    // The chosen force is ALWAYS P1 (it used to be silently dropped when it
    // wasn't among the scenario's first N forces).
    const chosen = scenario.forces.find((f) => f.id === forceId);
    const others = scenario.forces.filter((f) => f.id !== forceId);
    const lineup = (chosen ? [chosen, ...others] : others).slice(0, humans);
    setHotSeatPlayers(lineup.map((f, i) => ({
      forceId: f.id, label: `P${i + 1}: ${lang === 'zh' ? f.name.zh : f.name.en}`,
    })));
    loadScenario(scenario, lineup[0].id, difficulty);
    setTutorialStep(0);
    setHotSeatPick(null);
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
    marginLeft: 'auto', background: '#26323e', color: '#c178c7',
    border: '1px solid #c178c7', padding: '0.08rem 0.4rem',
    fontSize: '0.7rem', letterSpacing: '0.05rem', borderRadius: 'var(--tkm-radius-xs)',
  };
  const navPrimary = (enabled: boolean): CSSProperties => ({
    borderColor: enabled ? 'var(--tkm-text-h2)' : 'rgba(255,255,255,0.08)',
    color: enabled ? 'var(--tkm-text-h2)' : '#6a5238',
    background: enabled ? 'rgba(230,196,115,0.14)' : 'transparent',
    fontWeight: 'bold',
    // A disabled primary shouldn't invite a click (was pointer + hover glow).
    cursor: enabled ? 'pointer' : 'not-allowed',
  });
  // 已複製 — brief label swap so the Copy button confirms it did something.
  const [copied, setCopied] = useState(false);
  // 一代記選角 / 熱座人數 / 隨機劇本 — styled pickers replacing native prompt().
  const [careerPick, setCareerPick] = useState<string | null>(null);   // forceId
  const [hotSeatPick, setHotSeatPick] = useState<string | null>(null); // forceId
  const [showRandom, setShowRandom] = useState(false);
  const [randomCount, setRandomCount] = useState(5);
  const [randomYear, setRandomYear] = useState(200);
  // 進階選項 — the ~30-control setup wall folds behind one disclosure so
  // Start is never buried below it.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className={styles.root} style={{ isolation: 'isolate' }}>
      {/* 戰役主圖 — optional epic key-art behind the whole menu. Drop
          public/title-hero.jpg to light it up; absent → the gradient backdrop
          alone (unchanged). Sits at z-index -1, dimmed so the menu stays legible. */}
      <img
        src={`${import.meta.env.BASE_URL}title-hero.jpg`}
        alt=""
        aria-hidden="true"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, zIndex: -1, pointerEvents: 'none' }}
      />
      {/* 壓暗罩 — darken the top band (behind the title) and foot so gold text /
          menu stay legible over a bright hero; mid-frame keeps the art visible.
          Sits above the hero img but below all content (both at z-index -1). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(8,11,14,0.62) 0%, rgba(8,11,14,0.18) 26%, transparent 50%, rgba(8,11,14,0.30) 100%)',
        }}
      />
      {/* 氛圍 — drifting ink clouds + rising embers behind the menu. */}
      <div className={styles.ambient} aria-hidden="true">
        <div className={styles.cloud} style={{ top: '10%', left: '4%', width: 380, height: 210, ['--c-dur' as string]: '74s' }} />
        <div className={styles.cloud} style={{ top: '48%', left: '58%', width: 440, height: 250, ['--c-dur' as string]: '96s', animationDirection: 'alternate-reverse' }} />
        <div className={styles.cloud} style={{ top: '70%', left: '20%', width: 320, height: 180, ['--c-dur' as string]: '110s' }} />
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={styles.mote}
            style={{
              left: `${(i * 61) % 100}%`,
              bottom: '-2%',
              ['--m-dur' as string]: `${11 + (i % 5) * 2.6}s`,
              ['--m-delay' as string]: `${(i % 7) * 1.4}s`,
            }}
          />
        ))}
      </div>
      <InstallPrompt />
      <WhatsNewModal />
      {boardDate && <LeaderboardModal date={boardDate} onClose={() => setBoardDate(null)} />}
      {/* 版本號 — bottom corner, quiet */}
      <div style={{ position: 'fixed', right: 10, bottom: 6, zIndex: 5, fontSize: '0.7rem', color: '#5f6c76', fontFamily: 'ui-monospace, monospace' }}>
        v{GAME_VERSION}
      </div>
      <header className={styles.header} style={{ position: 'relative' }}>
        {/* 朱印 — a 「鼎」 chop: the three-legged cauldron, emblem of 三足鼎立. */}
        <Seal
          chars="鼎"
          size={58}
          rotate={-8}
          title={lang === 'en' ? 'Ding — the three-legged cauldron' : '鼎 — 三足鼎立'}
          style={{ position: 'absolute', top: '1rem', right: 'clamp(0.75rem, 8vw, 5rem)', zIndex: 2 }}
        />
        <h1 className={styles.title}>
          {lang !== 'en' && <span className={styles.titleZh}>三國志</span>}
          {lang !== 'zh' && <span className={styles.titleEn}>Three Kingdom Masters</span>}
          {/* A single tapered brush sweep — calmer than the old four strokes. */}
          <svg
            className="tkm-brush-stroke"
            viewBox="0 0 300 24"
            style={{ display: 'block', margin: '0.35rem auto 0', width: 230, opacity: 0.9 }}
            fill="none"
            stroke="url(#tkm-title-sweep)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <defs>
              <linearGradient id="tkm-title-sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e6c473" stopOpacity="0" />
                <stop offset="50%" stopColor="#e6c473" stopOpacity="1" />
                <stop offset="100%" stopColor="#e6c473" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 12 14 Q 150 4 288 14" />
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
                  aria-current={on ? 'step' : undefined}
                  onClick={() => {
                    // allow stepping back to a completed step
                    if (i <= STEPS.findIndex((x) => x.k === step)) setStep(s.k);
                  }}
                  style={{
                    padding: '0.3rem 0.9rem',
                    border: `1px solid ${on ? 'var(--tkm-text-h2)' : done ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 999,
                    background: on ? 'rgba(230,196,115,0.12)' : 'transparent',
                    color: on ? 'var(--tkm-text-h2)' : done ? '#a8b4be' : '#6a7682',
                    fontFamily: 'inherit', fontSize: '0.82rem', letterSpacing: '0.06rem',
                    cursor: i <= STEPS.findIndex((x) => x.k === step) ? 'pointer' : 'default',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}
                >
                  {s.n} {lang === 'en' ? s.en : s.zh}
                </button>
                {i < STEPS.length - 1 && <span style={{ color: '#2b3845' }}>→</span>}
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
                border: '1px solid rgba(255, 112, 80, 0.4)', background: 'rgba(184, 88, 74, 0.1)',
                borderRadius: 'var(--tkm-radius, 8px)',
                padding: '0.5rem 0.85rem', marginBottom: '0.7rem', fontSize: '0.82rem',
              }}>
                <span style={{ color: '#ff9080', letterSpacing: '0.05rem' }}>🔥 {t('每日挑戰', 'Daily')} {todayStr}</span>
                <span style={{ color: '#e6edf3' }}>
                  {lang === 'en' ? dailyScenario.name.en : dailyScenario.name.zh} · {lang === 'en' ? dailyForce.name.en : dailyForce.name.zh}
                </span>
                <span style={{ color: 'var(--tkm-text-muted)', fontSize: '0.7rem' }}>
                  {daily.modifiers.map((m) => (lang === 'en' ? m.en : m.zh)).join(' / ')}
                </span>
                {dailyResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(dailyShareString(daily, dailyForce.name.zh, dailyResult))
                        .then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); })
                        .catch(() => undefined);
                    }}
                    style={{
                      background: copied ? 'rgba(126,214,138,0.14)' : 'transparent',
                      border: `1px solid ${copied ? '#7ed68a' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 'var(--tkm-radius-lg)', color: copied ? '#9ed6a8' : '#aab6c0',
                      padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                    }}
                    title={t('複製戰績', 'Copy result')}
                  >{copied ? `✓ ${t('已複製', 'Copied')}` : `${dailyResult.victory ? `🏆 ${dailyResult.seasons}旬` : '☠'} ${t('複製', 'Copy')}`}</button>
                )}
                {streak > 0 && (
                  <span style={{ color: '#f2dd9a', fontSize: '0.72rem' }} title={t('連勝天數', 'Win streak')}>
                    🔥×{streak}
                  </span>
                )}
                <button
                  onClick={launchDaily}
                  style={{
                    marginLeft: 'auto', background: 'linear-gradient(180deg,#4a2418,#321810)',
                    border: '1px solid #ff7050', color: '#ffb0a0', padding: '0.3rem 1rem',
                    borderRadius: 'var(--tkm-radius)',
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem',
                  }}
                >{dailyResult ? t('再戰', 'Again') : t('應戰', 'Accept')}</button>
                <button
                  onClick={() => setBoardDate(todayStr)}
                  title={t('每日排行榜', 'Daily leaderboard')}
                  aria-label={t('每日排行榜', 'Daily leaderboard')}
                  style={{
                    background: 'transparent', border: '1px solid #e6c473', color: '#f2dd9a',
                    padding: '0.3rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 'var(--tkm-radius)',
                  }}
                >🏆</button>
                {/* 補打日曆 — the last seven days, replayable; older days
                    show their result but the window has closed. */}
                <div style={{ flexBasis: '100%', display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--tkm-text-muted)' }}>{t('近七日', 'Last 7')}</span>
                  {recent.map((d) => {
                    const r = allResults[d];
                    const isToday = d === todayStr;
                    return (
                      <button
                        key={d}
                        onClick={() => launchFor(d)}
                        title={`${d}${r ? (r.victory ? ` 🏆 ${r.seasons}旬` : ' ☠') : t(' 未戰', ' unplayed')}`}
                        style={{
                          width: 26, height: 22, cursor: 'pointer', fontSize: '0.7rem',
                          fontFamily: 'ui-monospace, monospace',
                          background: r ? (r.victory ? 'rgba(212,168,74,0.3)' : 'rgba(184,68,46,0.25)') : 'transparent',
                          border: `1px solid ${isToday ? '#ff9080' : r ? (r.victory ? 'var(--tkm-text-h2)' : '#8a4538') : '#26323e'}`,
                          color: r ? (r.victory ? '#f2dd9a' : '#c08070') : '#5f6c76',
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
                    onClick={() => {
                      setActiveEra(e.id);
                      // 同步選取 — jump the highlight + detail panel to this era's
                      // first scenario so they never show a stale other-era pick.
                      const first = SCENARIOS.find((s) => eraOf(s) === e.id);
                      if (first) { setScenarioId(first.id); setSelectedForceId(null); }
                    }}
                    onMouseEnter={(ev) => { if (!on) { ev.currentTarget.style.color = '#c9b58a'; ev.currentTarget.style.borderColor = 'rgba(230,196,115,0.35)'; } }}
                    onMouseLeave={(ev) => { if (!on) { ev.currentTarget.style.color = 'var(--tkm-text-muted)'; ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                    style={{
                      padding: '0.4rem 0.95rem',
                      border: `1px solid ${on ? 'var(--tkm-text-h2)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 999,
                      background: on ? 'rgba(230,196,115,0.12)' : 'transparent',
                      color: on ? 'var(--tkm-text-h2)' : 'var(--tkm-text-muted)',
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
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
                <div style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', marginBottom: '0.5rem' }}>
                  {startYear} AD · {scenario.forces.length} {t('勢力', 'forces')}
                </div>
                {/* 戰役封面 — optional cover above the territory map. Drop
                    public/scenarios/<scenarioId>.jpg to light it up; absent → just
                    the minimap (unchanged). key=id remounts so a prior miss resets. */}
                <img
                  key={scenario.id}
                  src={`${import.meta.env.BASE_URL}scenarios/${scenario.id}.jpg`}
                  alt=""
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  style={{
                    width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block',
                    borderRadius: 'var(--tkm-radius, 8px)', marginBottom: '0.5rem',
                    border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))',
                    boxShadow: 'var(--tkm-elev-1, 0 2px 10px rgba(0,0,0,0.35))',
                  }}
                />
                <div style={{
                  borderRadius: 'var(--tkm-radius, 8px)', overflow: 'hidden',
                  border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))',
                  boxShadow: 'var(--tkm-elev-1, 0 2px 10px rgba(0,0,0,0.35))',
                }}>
                  <MiniMap scenario={scenario} labelCapitals />
                </div>
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

            {/* 載入存檔 — a returning player's #1 action; pulled out of the
                secondary tool grid below so it doesn't read as one of 10 lookups. */}
            <button
              className={styles.officersButton}
              style={{ marginTop: '0.6rem', letterSpacing: '0.04rem' }}
              onClick={() => setShowLoad(true)}
            >
              📂 {t('載入存檔 — 繼續已存戰役', 'Load Game — continue a saved campaign')}
            </button>

            {/* Hero Mode — timed challenge scenarios */}
            <button
              className={styles.officersButton}
              style={{ marginTop: '0.6rem', borderColor: '#c0504a', color: '#e2a07a', letterSpacing: '0.04rem' }}
              onClick={() => setShowHeroMode(true)}
            >
              ⚔ {t('英雄模式 — 限時挑戰', 'Hero Mode — Timed Challenges')}
            </button>

            {/* Secondary tools (encyclopaedia / random / custom). Load moved out
                above as a primary action. */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid #1e2832', paddingTop: '0.7rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button
                className={styles.officersButton}
                onClick={() => setShowRandom(true)}
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
              <div style={{ flex: '1 1 0', minWidth: 0, border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))', borderRadius: 'var(--tkm-radius, 8px)', background: 'rgba(27,37,49,0.55)', boxShadow: 'var(--tkm-elev-1, 0 2px 10px rgba(0,0,0,0.35))', padding: '1rem', minHeight: 340 }}>
                <div style={{ borderRadius: 'var(--tkm-radius-sm, 5px)', overflow: 'hidden', border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))' }}>
                  <MiniMap scenario={scenario} highlightForceId={selectedForceId} labelCapitals onSelectForce={setSelectedForceId} />
                </div>
                {selectedForce && selectedRuler ? (() => {
                  const st = forceStats(selectedForce.id);
                  const top = [...st.officers]
                    .sort((a, b) => (b.stats.war + b.stats.leadership + b.stats.intelligence) - (a.stats.war + a.stats.leadership + a.stats.intelligence))
                    .slice(0, 6);
                  const strength = st.cities >= 8 ? t('強', 'Strong') : st.cities >= 3 ? t('中', 'Moderate') : t('弱（高難度）', 'Weak (hard)');
                  return (
                    <div style={{ marginTop: '0.8rem', borderTop: '1px solid #1e2832', paddingTop: '0.7rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <OfficerPortrait officer={selectedRuler} size={72} forceColor={selectedForce.color} year={startYear} />
                        <div>
                          <div style={{ fontSize: '1.1rem', color: 'var(--tkm-text-h2)' }}>{lang === 'en' ? selectedForce.name.en : selectedForce.name.zh}</div>
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
                        {([['統', 'LDR', selectedRuler.stats.leadership], ['武', 'WAR', selectedRuler.stats.war], ['智', 'INT', selectedRuler.stats.intelligence], ['政', 'POL', selectedRuler.stats.politics], ['魅', 'CHA', selectedRuler.stats.charisma]] as const).map(([zh, en, v]) => (
                          <div key={zh}><div style={{ color: 'var(--tkm-text-muted)' }} title={t(zh, en)}>{lang === 'en' ? en : zh}</div><div style={{ color: 'var(--tkm-text-h2)', fontSize: '0.95rem' }}>{v}</div></div>
                        ))}
                      </div>
                      {/* force data */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1rem', fontSize: '0.78rem', color: '#a08c6a', borderTop: '1px solid #1e2832', paddingTop: '0.6rem' }}>
                        <div>{t('城池', 'Cities')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{st.cities}</b></div>
                        <div>{t('武將', 'Officers')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{st.officers.length}</b></div>
                        <div>{t('兵力', 'Troops')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{st.troops.toLocaleString()}</b></div>
                        <div>{t('資金', 'Gold')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{st.gold.toLocaleString()}</b></div>
                        <div>{t('兵糧', 'Food')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{st.food.toLocaleString()}</b></div>
                        <div>{t('勢力', 'Strength')}: <b style={{ color: 'var(--tkm-text-h2)' }}>{strength}</b></div>
                      </div>
                      {/* notable officers */}
                      <div style={{ marginTop: '0.7rem', borderTop: '1px solid #1e2832', paddingTop: '0.6rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--tkm-text-muted)', marginBottom: '0.4rem' }}>{t('主要武將', 'Notable Officers')}</div>
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
              <div style={{ fontSize: '1.05rem', color: 'var(--tkm-text-h2)' }}>{lang === 'en' ? scenario.name.en : scenario.name.zh}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--tkm-text-muted)' }}>{startYear} AD</div>
            </div>
            {selectedForce && selectedRuler && (() => {
              const st = forceStats(selectedForce.id);
              return (
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))', borderRadius: 'var(--tkm-radius, 8px)', background: 'rgba(27,37,49,0.55)', padding: '0.7rem', marginBottom: '0.9rem' }}>
                  <OfficerPortrait officer={selectedRuler} size={64} forceColor={selectedForce.color} year={startYear} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', color: 'var(--tkm-text-h2)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedForce.color }} />
                      {lang === 'en' ? selectedForce.name.en : selectedForce.name.zh}
                      <span style={{ color: '#a08c6a', fontSize: '0.85rem' }}>{lang === 'en' ? selectedRuler.name.en : selectedRuler.name.zh}</span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--tkm-text-muted)', margin: '0.3rem 0' }}>
                      統{selectedRuler.stats.leadership} 武{selectedRuler.stats.war} 智{selectedRuler.stats.intelligence} 政{selectedRuler.stats.politics} 魅{selectedRuler.stats.charisma}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#a08c6a' }}>
                      {t('城', 'Cities')} {st.cities} · {t('將', 'Officers')} {st.officers.length} · {t('兵', 'Troops')} {st.troops.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ width: 156, flexShrink: 0, borderRadius: 'var(--tkm-radius-sm, 5px)', overflow: 'hidden', border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))' }}>
                    <MiniMap scenario={scenario} highlightForceId={selectedForce.id} />
                  </div>
                </div>
              );
            })()}

            {/* ── 初始治所 ── pick which owned city is the realm's capital */}
            {selectedForce && selectedForceCities.length > 1 && (
              <>
                <OptHeader>{t('初始治所', 'Starting capital')}</OptHeader>
                <div style={optRowStyle}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>
                    {t('政令外交所出之地(每季 +3 民忠)', 'Seat of edicts & diplomacy (+3 loyalty/season)')}
                  </span>
                  <select
                aria-label={t('政令外交所出之地', 'Seat of edicts & diplomacy')}
                    value={capitalChoice ?? selectedForce.capitalCityId}
                    onChange={(e) => setCapitalChoice(e.target.value)}
                    style={optSelectStyle}
                  >
                    {selectedForceCities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'en' ? c.name.en : c.name.zh}
                        {c.id === selectedForce.capitalCityId ? t('(預設)', ' (default)') : ''}
                        {` · ${(c.population / 10000).toFixed(0)}萬`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

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

            {/* 進階選項 — 30 幾個控制項收進一個揭露,開始鈕不再沉底;
                預設值即推薦值,直接按「開始遊戲」就是推薦開局。 */}
            <button
              type="button"
              className={styles.officersButton}
              style={{ width: '100%', marginTop: '0.6rem', textAlign: 'left', color: advancedOpen ? 'var(--tkm-text-h2)' : undefined }}
              onClick={() => setAdvancedOpen((v) => !v)}
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? '▾' : '▸'} {t('進階選項 — AI強度 · 國力 · 經濟 · 勝利 · 模式 · 生死 · 世界 · 外交', 'Advanced — AI · economy · victory · modes · rules · diplomacy')}
            </button>
            {advancedOpen && (<>

            {/* ── AI 強度 ── independent of difficulty (RoTK 思考 / Total War 戰役難度) */}
            <OptHeader>{t('AI 強度', 'AI strength')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>
                {t('進取與戰術水平', 'Aggression & tactical skill')}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setAiStrength(lv)}
                    style={pillStyle(aiStrength === lv)}
                  >{lv}</button>
                ))}
              </div>
            </div>
            <p style={optNoteStyle}>
              {aiStrength <= 2
                ? t('保守:AI 少主動進攻,戰術較弱 —— 適合新手。', 'Cautious: the AI rarely attacks and fights clumsily — gentle.')
                : aiStrength === 3
                  ? t('普通:AI 行為均衡。', 'Standard: balanced AI behavior.')
                  : t('凶猛:AI 積極擴張、戰術老練 —— 高度挑戰。', 'Fierce: the AI expands hard and fights sharply — tough.')}
            </p>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('AI 起始兵力', 'AI starting troops')}</span>
              <select
                aria-label={t('AI 起始兵力', 'AI starting troops')}
                value={aiStartTroops}
                onChange={(e) => setAiStartTroops(e.target.value as 'fewer' | 'even' | 'more')}
                style={optSelectStyle}
              >
                <option value="fewer">{t('較少 ×0.8', 'Fewer ×0.8')}</option>
                <option value="even">{t('一般 ×1.0', 'Even ×1.0')}</option>
                <option value="more">{t('較多 ×1.2', 'More ×1.2')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('戰鬥難度', 'Battle difficulty')}</span>
              <select
                aria-label={t('戰鬥難度', 'Battle difficulty')}
                value={battleDifficulty ?? 'follow'}
                onChange={(e) => setBattleDifficulty(e.target.value === 'follow' ? null : e.target.value as 'easy' | 'normal' | 'hard')}
                style={optSelectStyle}
              >
                <option value="follow">{t('跟隨戰役難度', 'Follow campaign')}</option>
                <option value="easy">{t('易', 'Easy')}</option>
                <option value="normal">{t('普通', 'Normal')}</option>
                <option value="hard">{t('困難', 'Hard')}</option>
              </select>
            </div>

            {/* ── 起始國力 ── player handicap (Total War 起始資源 / RoTK 上級補正) */}
            <OptHeader>{t('起始國力', 'Starting power')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>
                {t('我方起始金錢/兵糧/兵力', 'Your starting gold / food / troops')}
              </span>
              <select
                aria-label={t('我方起始金錢/兵糧/兵力', 'Your starting gold / food / troops')}
                value={startHandicap}
                onChange={(e) => setStartHandicap(e.target.value as 'weak' | 'even' | 'strong')}
                style={optSelectStyle}
              >
                <option value="weak">{t('劣勢 ×0.7', 'Underdog ×0.7')}</option>
                <option value="even">{t('均衡 ×1.0', 'Even ×1.0')}</option>
                <option value="strong">{t('優勢 ×1.4', 'Mighty ×1.4')}</option>
              </select>
            </div>

            {/* ── 經濟 ── default tax preset + starting inflation headwind */}
            <OptHeader>{t('經濟', 'Economy')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('起始稅率', 'Starting tax rate')}</span>
              <select
                aria-label={t('起始稅率', 'Starting tax rate')}
                value={startTaxRate}
                onChange={(e) => setStartTaxRate(e.target.value as 'light' | 'normal' | 'heavy')}
                style={optSelectStyle}
              >
                <option value="light">{t('輕稅（少金·安民）', 'Light (less gold, happier)')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="heavy">{t('重稅（多金·失民）', 'Heavy (more gold, unrest)')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('起始通脹', 'Starting inflation')}</span>
              <select
                aria-label={t('起始通脹', 'Starting inflation')}
                value={startInflation === 0 ? 'none' : startInflation <= 15 ? 'low' : 'high'}
                onChange={(e) => setStartInflation(e.target.value === 'none' ? 0 : e.target.value === 'low' ? 15 : 35)}
                style={optSelectStyle}
              >
                <option value="none">{t('無', 'None')}</option>
                <option value="low">{t('輕微（稅收 −6%）', 'Mild (−6% tax income)')}</option>
                <option value="high">{t('嚴重（稅收 −14%）', 'Severe (−14% tax income)')}</option>
              </select>
            </div>

            {/* ── 勝利條件 ── (Total War victory conditions) */}
            <OptHeader>{t('勝利條件', 'Victory condition')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>
                {t('達成即獲勝', 'Reaching it wins the campaign')}
              </span>
              <select
                aria-label={t('達成即獲勝', 'Reaching it wins the campaign')}
                value={victoryGoal}
                onChange={(e) => setVictoryGoal(e.target.value as 'free' | 'unify' | 'hegemon' | 'tripartite')}
                style={optSelectStyle}
              >
                <option value="free">{t('自由（任意結局）', 'Free (any ending)')}</option>
                <option value="unify">{t('統一天下', 'Unify the realm')}</option>
                <option value="hegemon">{t('稱霸中原（據三都）', 'Hegemony (3 capitals)')}</option>
                <option value="tripartite">{t('三分天下', 'Three Kingdoms balance')}</option>
              </select>
            </div>

            {/* ── 遊戲模式 ── */}
            <OptHeader>{t('遊戲模式', 'Game modes')}</OptHeader>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={hotSeatMode} onChange={(e) => setHotSeatMode(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('輪流模式（多人共用鍵盤）', 'Hot-seat (players share keyboard)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={careerMode} onChange={(e) => setCareerMode(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('一代記模式（選擇一位武將為主角）', 'Chronicle mode (pick one officer as your avatar)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={romance} onChange={(e) => { setRomance(e.target.checked); setRomanceMode(e.target.checked); }} style={{ marginRight: '0.4rem' }} />
              {t('演義模式（歷史事件按時觸發）', 'Romance mode (historical events fire on schedule)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: careerMode ? 'var(--tkm-text-muted)' : '#4a5560', cursor: careerMode ? 'pointer' : 'not-allowed', opacity: careerMode ? 1 : 0.55 }}>
              <input type="checkbox" checked={roguelike} onChange={(e) => { setRoguelike(e.target.checked); setRoguelikeMode(e.target.checked); }} style={{ marginRight: '0.4rem', cursor: 'inherit' }} disabled={!careerMode} />
              {t('Roguelike 模式（主角陣亡即遊戲結束；需開啟一代記）', 'Roguelike (chronicle officer death = game over; requires Chronicle mode)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={ironman} onChange={(e) => setIronman(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('鐵人模式（禁止手動存檔，只保留每季自動存檔）', 'Ironman (no manual save — only the per-season autosave)')}
            </label>

            {/* ── 生死規則 ── per-campaign life/death settings (also in the in-game 設定). */}
            <OptHeader>{t('生死規則', 'Life & death')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('武將壽命', 'Officer lifespan')}</span>
              <select
                aria-label={t('武將壽命', 'Officer lifespan')}
                value={lifespanMode}
                onChange={(e) => setLifespanMode(e.target.value as 'historical' | 'fictionalImmortal' | 'immortal')}
                style={optSelectStyle}
              >
                <option value="historical">{t('史實', 'Historical')}</option>
                <option value="fictionalImmortal">{t('虛構不老', 'Fictional immortal')}</option>
                <option value="immortal">{t('全員不老', 'All immortal')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('壽命長短', 'Lifespan length')}</span>
              <select
                aria-label={t('壽命長短', 'Lifespan length')}
                value={lifespanLength}
                onChange={(e) => setLifespanLength(e.target.value as 'short' | 'historical' | 'long')}
                style={optSelectStyle}
              >
                <option value="short">{t('短命（老死更快）', 'Short (die sooner)')}</option>
                <option value="historical">{t('史實', 'Historical')}</option>
                <option value="long">{t('長壽（老死減半）', 'Long (live longer)')}</option>
              </select>
            </div>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={agingStatLock} onChange={(e) => setAgingStatLock(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('變老不影響屬性（五圍不隨年齡增減）', 'Aging does not affect stats (five stats frozen vs age)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={noBattleDeath} onChange={(e) => setNoBattleDeath(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('不會戰死（改為負傷或被俘）', 'No battle death (wounded or captured instead)')}
            </label>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={reviveDeadOfficers} onChange={(e) => setReviveDeadOfficers(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('起死回生（已故武將或逐年復活，含開局前去世者）', 'Revive the dead (fallen officers may return over the years)')}
            </label>

            {/* ── 世界規則 ── map/officer rules surfaced here (also in 設定). */}
            <OptHeader>{t('世界規則', 'World rules')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('武將與名品出現位置', 'Talent & item placement')}</span>
              <select
                aria-label={t('武將與名品出現位置', 'Talent & item placement')}
                value={placementMode}
                onChange={(e) => setPlacementMode(e.target.value as 'historical' | 'random')}
                style={optSelectStyle}
              >
                <option value="historical">{t('歷史', 'Historical')}</option>
                <option value="random">{t('虛構（隨機散落）', 'Fictional (scattered)')}</option>
              </select>
            </div>
            <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--tkm-text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" checked={fogOfWar} onChange={(e) => setFogOfWar(e.target.checked)} style={{ marginRight: '0.4rem' }} />
              {t('戰霧（隱藏未偵察的城邑）', 'Fog of war (hide unscouted cities)')}
            </label>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('在野登場（搜索難度）', 'Talent discovery')}</span>
              <select
                aria-label={t('在野登場', 'Talent discovery')}
                value={talentDiscovery}
                onChange={(e) => setTalentDiscovery(e.target.value as 'scarce' | 'normal' | 'plentiful')}
                style={optSelectStyle}
              >
                <option value="scarce">{t('稀少（難尋）', 'Scarce')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="plentiful">{t('眾多（易尋）', 'Plentiful')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('單挑頻率', 'Duel frequency')}</span>
              <select
                aria-label={t('單挑頻率', 'Duel frequency')}
                value={duelFrequency}
                onChange={(e) => setDuelFrequency(e.target.value as 'rare' | 'normal' | 'frequent')}
                style={optSelectStyle}
              >
                <option value="rare">{t('罕見 ×0.5', 'Rare ×0.5')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="frequent">{t('頻繁 ×2', 'Frequent ×2')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('天災頻率', 'Disaster frequency')}</span>
              <select
                aria-label={t('天災頻率', 'Disaster frequency')}
                value={disasterFrequency}
                onChange={(e) => setDisasterFrequency(e.target.value as 'low' | 'normal' | 'high')}
                style={optSelectStyle}
              >
                <option value="low">{t('少 ×0.5', 'Low ×0.5')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="high">{t('多 ×1.7', 'High ×1.7')}</option>
              </select>
            </div>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('新武將登場', 'New officers')}</span>
              <select
                aria-label={t('新武將登場', 'New officers')}
                value={newOfficers}
                onChange={(e) => setNewOfficers(e.target.value as 'off' | 'rare' | 'normal' | 'common')}
                style={optSelectStyle}
              >
                <option value="off">{t('關閉', 'Off')}</option>
                <option value="rare">{t('稀少', 'Rare')}</option>
                <option value="normal">{t('正常', 'Normal')}</option>
                <option value="common">{t('頻繁', 'Common')}</option>
              </select>
            </div>
            <p style={optNoteStyle}>
              {t('虛構新秀隨年代陸續以在野身分登場,補充人才池(無史實卒年,故受「武將壽命」影響)。', 'Fictional newcomers appear over the years as free agents to refresh the talent pool (no historical death year, so they obey the lifespan settings).')}
            </p>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('虛構人才庫（開局）', 'Fictional talent pool (start)')}</span>
              <select
                aria-label={t('虛構人才庫', 'Fictional talent pool')}
                value={fictionalPool}
                onChange={(e) => setFictionalPool(e.target.value as 'off' | 'some' | 'many')}
                style={optSelectStyle}
              >
                <option value="off">{t('關閉', 'Off')}</option>
                <option value="some">{t('少量（+20）', 'Some (+20)')}</option>
                <option value="many">{t('大量（+50）', 'Many (+50)')}</option>
              </select>
            </div>

            {/* ── 外交 ── opening relations between forces */}
            <OptHeader>{t('外交', 'Diplomacy')}</OptHeader>
            <div style={optRowStyle}>
              <span style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('初始外交', 'Opening relations')}</span>
              <select
                aria-label={t('初始外交', 'Opening relations')}
                value={initialDiplomacy}
                onChange={(e) => setInitialDiplomacy(e.target.value as 'neutral' | 'warring' | 'coalitions')}
                style={optSelectStyle}
              >
                <option value="neutral">{t('逐鹿（中立）', 'Free-for-all')}</option>
                <option value="warring">{t('亂世死敵', 'Warring (all soured)')}</option>
                <option value="coalitions">{t('群雄結盟', 'Coalitions')}</option>
              </select>
            </div>
            <p style={optNoteStyle}>
              {initialDiplomacy === 'warring'
                ? t('各勢力開局即交惡,AI 不結盟、不締約,亂世立現。', 'Every force starts soured — the AI shuns pacts; the realm ignites at once.')
                : initialDiplomacy === 'coalitions'
                  ? t('AI 勢力開局結成互不侵犯陣營,玩家須面對聯盟。', 'AI forces open in non-aggression blocs — you face coalitions, not a free-for-all.')
                  : t('預設:各勢力互不結盟,自由開戰。', 'Default: no pacts, all free to make war.')}
            </p>

            {/* Cross-over historical officers */}
            <button
              type="button"
              onClick={() => setShowDynasties((v) => !v)}
              style={{
                display: 'block', width: '100%', marginTop: '0.6rem',
                background: enabledDynasties.length > 0 ? 'rgba(230,196,115,0.12)' : 'transparent',
                border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))', borderRadius: 'var(--tkm-radius-sm, 5px)',
                color: enabledDynasties.length > 0 ? 'var(--tkm-text-h2)' : 'var(--tkm-text-muted)',
                padding: '0.4rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', textAlign: 'left',
              }}
            >
              {showDynasties ? '▾' : '▸'} {t('歷代名將', 'Historical Officers')}
              {enabledDynasties.length > 0 && (
                <span style={{ float: 'right', color: 'var(--tkm-text-h2)' }}>{enabledDynasties.length} {t('朝', 'dyn.')}</span>
              )}
            </button>
            {showDynasties && (
              <div style={{ marginTop: '0.4rem', padding: '0.6rem', border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))', borderRadius: 'var(--tkm-radius-sm, 5px)', background: 'rgba(27,37,49,0.5)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--tkm-text-muted)', marginBottom: '0.4rem' }}>
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
                          border: `1px solid ${on ? '#364654' : 'transparent'}`, fontSize: '0.75rem',
                          color: on ? 'var(--tkm-text-h2)' : '#a08c6a',
                        }}
                      >
                        <input type="checkbox" checked={on} onChange={() => toggleDynasty(d.id)} />
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{lang === 'en' ? d.name.en : d.name.zh}</span>
                        <span style={{ fontSize: '0.72rem', color: '#6a5238' }}>{lang === 'en' ? d.era.en : d.era.zh}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            </>)}

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
      {/* 一代記選角 — a portrait grid instead of “type a number from this list”. */}
      {careerPick && (() => {
        const force = scenario.forces.find((f) => f.id === careerPick);
        const pool = scenario.officers
          .filter((o) => o.forceId === careerPick && o.status !== 'dead')
          .sort((a, b) => (b.stats.war * 0.6 + b.stats.intelligence * 0.4) - (a.stats.war * 0.6 + a.stats.intelligence * 0.4));
        return (
          <Modal
            onClose={() => setCareerPick(null)}
            icon="🧭"
            title={t('一代記 — 選擇主角', 'Chronicle — choose your officer')}
            badge={force ? (lang === 'en' ? force.name.en : force.name.zh) : undefined}
            width="min(720px, 96vw)"
            scrollBody
            ariaLabel={t('一代記選角', 'Chronicle officer picker')}
          >
            <p style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', margin: '0 0 0.6rem' }}>
              {t('以一將之身歷經一代 — 點選頭像即開局。', 'Live one officer’s life — tap a portrait to begin.')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.45rem' }}>
              {pool.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => launchCareer(careerPick, o.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem',
                    background: 'rgba(27,37,49,0.55)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--tkm-radius-sm, 5px)', cursor: 'pointer', textAlign: 'left',
                    color: '#dfe9f2', fontFamily: 'inherit',
                  }}
                >
                  <OfficerPortrait officer={o} size={44} year={startYear} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.84rem', color: 'var(--tkm-text-h2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lang === 'en' ? o.name.en : o.name.zh}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--tkm-text-muted)' }}>
                      {t('武', 'W')}{o.stats.war} · {t('智', 'I')}{o.stats.intelligence} · {t('政', 'P')}{o.stats.politics}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Modal>
        );
      })()}

      {/* 熱座人數 — pick 2–4 with the exact lineup shown; the chosen force is P1. */}
      {hotSeatPick && (() => {
        const chosen = scenario.forces.find((f) => f.id === hotSeatPick);
        const others = scenario.forces.filter((f) => f.id !== hotSeatPick);
        return (
          <Modal
            onClose={() => setHotSeatPick(null)}
            icon="🔄"
            title={t('熱座對戰 — 幾位玩家?', 'Hot seat — how many players?')}
            width="min(480px, 96vw)"
            ariaLabel={t('熱座人數', 'Hot-seat player count')}
          >
            <p style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted)', margin: '0 0 0.6rem' }}>
              {t('同機輪流執掌各自勢力;你選定的勢力為 P1。', 'Take turns on one device; your chosen force plays first.')}
            </p>
            {[2, 3, 4].filter((n) => n <= scenario.forces.length).map((n) => {
              const lineup = (chosen ? [chosen, ...others] : others).slice(0, n);
              return (
                <button
                  key={n}
                  type="button"
                  className={styles.officersButton}
                  style={{ width: '100%', marginTop: '0.35rem', textAlign: 'left' }}
                  onClick={() => launchHotSeat(hotSeatPick, n)}
                >
                  <b style={{ color: 'var(--tkm-text-h2)' }}>{n} {t('人', 'players')}</b>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--tkm-text-muted)', marginTop: 2 }}>
                    {lineup.map((f, i) => `P${i + 1} ${lang === 'en' ? f.name.en : f.name.zh}`).join(' · ')}
                  </span>
                </button>
              );
            })}
          </Modal>
        );
      })()}

      {/* 隨機劇本 — labelled fields instead of two chained prompt()s. */}
      {showRandom && (
        <Modal
          onClose={() => setShowRandom(false)}
          icon="🎲"
          title={t('隨機劇本', 'Random scenario')}
          width="min(420px, 96vw)"
          ariaLabel={t('隨機劇本設定', 'Random scenario setup')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('勢力數量', 'Forces')}(2–10)</span>
            <input
              type="number" min={2} max={10} value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              aria-label={t('勢力數量', 'Number of forces')}
              style={{ width: 72, background: '#101820', color: 'var(--tkm-text-h2)', border: '1px solid #364654', borderRadius: 4, padding: '0.3rem 0.4rem', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.55rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--tkm-text-muted)', flex: 1 }}>{t('起始年份', 'Year')}(100–280)</span>
            <input
              type="number" min={100} max={280} value={randomYear}
              onChange={(e) => setRandomYear(Number(e.target.value))}
              aria-label={t('起始年份', 'Starting year')}
              style={{ width: 72, background: '#101820', color: 'var(--tkm-text-h2)', border: '1px solid #364654', borderRadius: 4, padding: '0.3rem 0.4rem', fontFamily: 'inherit' }}
            />
          </div>
          <button
            type="button"
            className={styles.officersButton}
            style={{ width: '100%', marginTop: '0.9rem', ...navPrimary(true) }}
            onClick={() => {
              const count = Math.max(2, Math.min(10, Math.round(randomCount) || 5));
              const year = Math.max(100, Math.min(280, Math.round(randomYear) || 200));
              setShowRandom(false);
              loadRandom(count, year);
            }}
          >
            ▶ {t('生成並開局', 'Generate & start')}
          </button>
        </Modal>
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
        title={t('設定', 'Settings')}
        aria-label={t('設定', 'Settings')}
        style={{
          position: 'fixed', top: 16, right: 16, width: 44, height: 44,
          background: 'rgba(20, 14, 8, 0.85)', border: '1px solid #e6c473',
          color: 'var(--tkm-text-h2)', fontSize: '1.4rem', cursor: 'pointer',
          fontFamily: 'serif', boxShadow: '0 0 8px rgba(0,0,0,0.6)', zIndex: 50,
        }}
      >⚙</button>
    </div>
  );
}

function miniBtn(disabled: boolean): CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))',
    borderRadius: 'var(--tkm-radius-sm, 5px)',
    color: disabled ? '#6a5238' : 'var(--tkm-text-h2)',
    padding: '0.15rem 0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.7rem',
  };
}

// ── Shared bits for the 開局設定 (options) step ──────────────────────────────
/** A small uppercase section divider, RoTK-settings style. */
function OptHeader({ children }: { children: import('react').ReactNode }) {
  return (
    <div style={{
      marginTop: '0.85rem', marginBottom: '0.35rem',
      fontSize: '0.68rem', letterSpacing: '0.07rem', color: '#c9a64e',
      textTransform: 'uppercase',
      borderTop: '1px solid var(--tkm-hairline, rgba(255,255,255,0.08))',
      paddingTop: '0.5rem',
    }}>{children}</div>
  );
}

const optRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem',
};
const optNoteStyle: CSSProperties = {
  fontSize: '0.7rem', color: '#6a7682', margin: '0.25rem 0 0', lineHeight: 1.3,
};
const optSelectStyle: CSSProperties = {
  background: '#080b0e', border: '1px solid #2b3845', color: 'var(--tkm-text-h2)',
  padding: '0.2rem 0.3rem', fontFamily: 'inherit', fontSize: '0.76rem',
};
const COARSE_POINTER = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches;

function pillStyle(on: boolean): CSSProperties {
  return {
    background: on ? '#26323e' : 'transparent',
    border: '1px solid ' + (on ? 'var(--tkm-text-h2)' : '#2b3845'),
    color: on ? 'var(--tkm-text-h2)' : 'var(--tkm-text-muted)',
    // 指尖可及 — a real ≥44px hit box on touch devices.
    padding: COARSE_POINTER ? '0.55rem 0.85rem' : '0.2rem 0.55rem',
    minWidth: COARSE_POINTER ? 44 : undefined,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem',
    borderRadius: 'var(--tkm-radius-sm)',
  };
}

// A compact territory map of a scenario: every city a dot coloured by its owning
// force (neutral = dark), with adjacency lines for a sense of the road network.
// Pass highlightForceId to spotlight one force's holdings.
function MiniMap({ scenario, highlightForceId, labelCapitals, onSelectForce }: { scenario: Scenario; highlightForceId?: string | null; labelCapitals?: boolean; onSelectForce?: (fid: string) => void }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const lang = useLanguage();
  const colorOf = (fid: string | null) =>
    fid ? (scenario.forces.find((f) => f.id === fid)?.color ?? '#4a3a28') : '#4a3a28';
  const forceName = (fid: string | null) => {
    if (!fid) return lang === 'en' ? 'Neutral' : '中立';
    const f = scenario.forces.find((x) => x.id === fid);
    return f ? (lang === 'en' ? f.name.en : f.name.zh) : '—';
  };
  const hc = hoverId ? scenario.cities.find((c) => c.id === hoverId) ?? null : null;
  return (
    <svg
      viewBox="110 150 790 570"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: 'auto', display: 'block', background: '#14100c', border: '1px solid #1e2832', borderRadius: 'var(--tkm-radius-sm)' }}
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
          <g key={c.id}>
            <circle
              cx={c.coords.x} cy={c.coords.y}
              r={isHover ? baseR + 3 : hl ? baseR + 2 : baseR}
              fill={colorOf(c.ownerForceId)}
              stroke={isHover ? '#ffffff' : hl ? '#fff5e0' : '#10161e'}
              strokeWidth={isHover ? 2 : hl ? 1.6 : 0.8}
              opacity={dim && !isHover ? 0.4 : 1}
              pointerEvents="none"
            />
            {/* 指尖可及 — a fat invisible hit ring so an 8px dot is tappable. */}
            <circle
              cx={c.coords.x} cy={c.coords.y} r={baseR + 10}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoverId(c.id)}
              onMouseLeave={() => setHoverId((prev) => (prev === c.id ? null : prev))}
              onClick={() => { if (onSelectForce && c.ownerForceId) onSelectForce(c.ownerForceId); }}
            />
          </g>
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
            {lang === 'en' ? cap.name.en : cap.name.zh}
          </text>
        );
      })}
      {/* Hover tooltip — city name, owner and garrison */}
      {hc && (() => {
        const left = hc.coords.x > 540;
        const tx = left ? -206 : 14;
        return (
          <g transform={`translate(${hc.coords.x}, ${hc.coords.y})`} pointerEvents="none">
            <rect x={tx} y={-36} width={192} height={50} rx={3} fill="#10161e" stroke={colorOf(hc.ownerForceId)} strokeWidth={1.5} />
            <text x={tx + 11} y={-15} fontSize={18} fill="#e6c473" style={{ fontWeight: 'bold' }}>{lang === 'en' ? hc.name.en : hc.name.zh}</text>
            <text x={tx + 11} y={6} fontSize={14} fill="#a08c6a">
              {forceName(hc.ownerForceId)} · {hc.troops.toLocaleString()}{hc.ownerForceId ? (lang === 'en' ? ' troops' : ' 兵') : ''}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
