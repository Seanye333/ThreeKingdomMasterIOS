import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { requestMapFocus } from '../components/mapFocusBus';
import { playSfx } from '../../game/systems/sound';
import { useGameStore } from '../../game/state/store';
import { DEED_TITLES_BY_ID } from '../../game/systems/deedTitles';
import { prestigeTitleById } from '../../game/data/prestige';
import { SEASON_LABEL, MONTH_PHASE_LABEL, firstMonthOfSeason } from '../../game/types';
import { WEATHER_LABEL, WIND_LABEL } from '../../game/systems/weather';
import { MANDATE_LABEL } from '../../game/systems/mandate';
import { CityPanel } from '../components/CityPanel';
import { ActionToasts } from '../components/ActionToasts';
import { CelebrationPopup } from '../components/CelebrationPopup';
import { RelationshipBrowserModal } from '../components/RelationshipBrowserModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SettingsModal } from '../components/SettingsModal';
import { CareerModal } from '../components/CareerModal';
import { BondsModal } from '../components/BondsModal';
import { PrivateForcesModal } from '../components/PrivateForcesModal';
import { PrestigeModal } from '../components/PrestigeModal';
import { BondCeremony } from '../components/BondCeremony';
import { PrestigeCeremony } from '../components/PrestigeCeremony';
import { PromotionCeremony } from '../components/PromotionCeremony';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Icon } from '../components/Icon';
import { DialogueModal } from '../components/DialogueModal';
import { ArmiesPanel } from '../components/ArmiesPanel';
import { CourtModal } from '../components/CourtModal';
import { DiplomacyModal } from '../components/DiplomacyModal';
import { EndingsModal } from '../components/EndingsModal';
import { EventModal } from '../components/EventModal';
import { ForcesOverview } from '../components/ForcesOverview';
import { OfficersTab } from '../components/OfficersTab';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { SeasonReportModal } from '../components/SeasonReportModal';
import { SeasonTransition } from '../components/SeasonTransition';
import { Chip } from '../components/Chip';
import { BattleTheaterModal } from '../components/BattleTheaterModal';
// 啟動提速 — the 3D map bundle (≈360KB) loads on demand, not at boot.
const StrategicMap3D = lazy(() => import('../components/StrategicMap3D').then(m => ({ default: m.StrategicMap3D })));
import { TutorialOverlay } from '../components/TutorialOverlay';
import { TutorialTasks } from '../components/TutorialTasks';
import { VictoryModal } from '../components/VictoryModal';
import { WishesModal } from '../components/WishesModal';
import { TacticalBattleScreen } from './TacticalBattleScreen';
import { BattleAIDriver } from '../components/BattleAIDriver';
import { HudMenu } from '../components/HudMenu';
import { THEMES, getStoredTheme, applyTheme, type ThemeId } from '../theme';
import { useT } from '../i18n';
import styles from './MapScreen.module.css';

// Code-split heavy / rarely-opened modals. They are loaded on demand the
// first time the user opens them, keeping the initial bundle smaller.
const ArmouryModal = lazy(() => import('../components/ArmouryModal').then(m => ({ default: m.ArmouryModal })));
const BattleHistoryModal = lazy(() => import('../components/BattleHistoryModal').then(m => ({ default: m.BattleHistoryModal })));
const BattleReplayModal = lazy(() => import('../components/BattleReplayModal').then(m => ({ default: m.BattleReplayModal })));
const AchievementsModal = lazy(() => import('../components/AchievementsModal').then(m => ({ default: m.AchievementsModal })));
const CampaignStatsModal = lazy(() => import('../components/CampaignStatsModal').then(m => ({ default: m.CampaignStatsModal })));
const GlossaryModal = lazy(() => import('../components/GlossaryModal').then(m => ({ default: m.GlossaryModal })));
const ChronicleModal = lazy(() => import('../components/ChronicleModal').then(m => ({ default: m.ChronicleModal })));
const AnnalsModal = lazy(() => import('../components/AnnalsModal').then(m => ({ default: m.AnnalsModal })));
const RitesModal = lazy(() => import('../components/RitesModal').then(m => ({ default: m.RitesModal })));
const ReliefModal = lazy(() => import('../components/ReliefModal').then(m => ({ default: m.ReliefModal })));
const RelationsModal = lazy(() => import('../components/RelationsModal').then(m => ({ default: m.RelationsModal })));
const LegionsModal = lazy(() => import('../components/LegionsModal').then(m => ({ default: m.LegionsModal })));
const AdvisorModal = lazy(() => import('../components/AdvisorModal').then(m => ({ default: m.AdvisorModal })));
const GovernorEvalModal = lazy(() => import('../components/GovernorEvalModal').then(m => ({ default: m.GovernorEvalModal })));
const HistoryBookModal = lazy(() => import('../components/HistoryBookModal').then(m => ({ default: m.HistoryBookModal })));
const SchemesModal = lazy(() => import('../components/SchemesModal').then(m => ({ default: m.SchemesModal })));
const PowerGraphModal = lazy(() => import('../components/PowerGraphModal').then(m => ({ default: m.PowerGraphModal })));
const CityRosterModal = lazy(() => import('../components/CityRosterModal').then(m => ({ default: m.CityRosterModal })));
const BudgetModal = lazy(() => import('../components/BudgetModal').then(m => ({ default: m.BudgetModal })));
const ToDoModal = lazy(() => import('../components/ToDoModal').then(m => ({ default: m.ToDoModal })));
const CommandPalette = lazy(() => import('../components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const ForceCompareModal = lazy(() => import('../components/ForceCompareModal').then(m => ({ default: m.ForceCompareModal })));
const RumorsModal = lazy(() => import('../components/RumorsModal').then(m => ({ default: m.RumorsModal })));
const ProvinceModal = lazy(() => import('../components/ProvinceModal').then(m => ({ default: m.ProvinceModal })));
const ConvoyModal = lazy(() => import('../components/ConvoyModal').then(m => ({ default: m.ConvoyModal })));
type PaletteCommand = import('../components/CommandPalette').PaletteCommand;
const DeedsModal = lazy(() => import('../components/DeedsModal').then(m => ({ default: m.DeedsModal })));
const HallOfFameModal = lazy(() => import('../components/HallOfFameModal').then(m => ({ default: m.HallOfFameModal })));
const ForgingModal = lazy(() => import('../components/ForgingModal').then(m => ({ default: m.ForgingModal })));
const DiplomacyGraphModal = lazy(() => import('../components/DiplomacyGraphModal').then(m => ({ default: m.DiplomacyGraphModal })));
const EncyclopediaModal = lazy(() => import('../components/EncyclopediaModal').then(m => ({ default: m.EncyclopediaModal })));
const EspionageModal = lazy(() => import('../components/EspionageModal').then(m => ({ default: m.EspionageModal })));
const TitlesModal = lazy(() => import('../components/TitlesModal').then(m => ({ default: m.TitlesModal })));
const GovernorsModal = lazy(() => import('../components/GovernorsModal').then(m => ({ default: m.GovernorsModal })));
const FormationsModal = lazy(() => import('../components/FormationsModal').then(m => ({ default: m.FormationsModal })));
const TrainingGroundModal = lazy(() => import('../components/TrainingGroundModal').then(m => ({ default: m.TrainingGroundModal })));
const TournamentModal = lazy(() => import('../components/TournamentModal').then(m => ({ default: m.TournamentModal })));
const DebateGroundModal = lazy(() => import('../components/DebateGroundModal').then(m => ({ default: m.DebateGroundModal })));
const PersuasionModal = lazy(() => import('../components/PersuasionModal').then(m => ({ default: m.PersuasionModal })));
const DuelHallModal = lazy(() => import('../components/DuelHallModal').then(m => ({ default: m.DuelHallModal })));

export function MapScreen() {
  const t = useT();
  const [showForces, setShowForces] = useState(false);
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showOfficers, setShowOfficers] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showArmoury, setShowArmoury] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [showEspionage, setShowEspionage] = useState(false);
  const [showCourt, setShowCourt] = useState(false);
  const [showSave, setShowSave] = useState<'save' | 'load' | null>(null);
  const [showFormations, setShowFormations] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showDebateGround, setShowDebateGround] = useState(false);
  const [showPersuasion, setShowPersuasion] = useState(false);
  const [showDuelHall, setShowDuelHall] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme());
  const handleSetTheme = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
  };
  const [showWishes, setShowWishes] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [showReplays, setShowReplays] = useState(false);
  const [showDeeds, setShowDeeds] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showDipGraph, setShowDipGraph] = useState(false);
  const [showCareer, setShowCareer] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [showPrivateForces, setShowPrivateForces] = useState(false);
  const [showPrestige, setShowPrestige] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showGovernors, setShowGovernors] = useState(false);
  const [showKaoke, setShowKaoke] = useState(false);
  const [showCampaignStats, setShowCampaignStats] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showAnnals, setShowAnnals] = useState(false);
  const [showRites, setShowRites] = useState(false);
  const [showRelief, setShowRelief] = useState(false);
  // §8.2-deep 賑災 — auto-surface the relief desk when disasters land.
  const pendingReliefCount = useGameStore((s) => (s.pendingRelief ?? []).length);
  useEffect(() => {
    if (pendingReliefCount > 0) setShowRelief(true);
  }, [pendingReliefCount]);
  const [showRelations, setShowRelations] = useState(false);
  const [showLegions, setShowLegions] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showHistoryBook, setShowHistoryBook] = useState(false);
  const [showSchemes, setShowSchemes] = useState(false);
  const [showPowerGraph, setShowPowerGraph] = useState(false);
  const [showCityRoster, setShowCityRoster] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showToDo, setShowToDo] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showRumors, setShowRumors] = useState(false);
  const [showProvinces, setShowProvinces] = useState(false);
  const [showConvoys, setShowConvoys] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const careerMode = useGameStore((s) => s.careerMode);
  const recentAchievementUnlocks = useGameStore((s) => s.recentAchievementUnlocks);
  const acknowledgeAchievements = useGameStore((s) => s.acknowledgeAchievements);
  const recentDeedTitles = useGameStore((s) => s.recentDeedTitles);
  const acknowledgeDeedTitles = useGameStore((s) => s.acknowledgeDeedTitles);
  const recentPrestige = useGameStore((s) => s.recentPrestige);
  const acknowledgePrestige = useGameStore((s) => s.acknowledgePrestige);
  const recentBonds = useGameStore((s) => s.recentBonds);
  const acknowledgeBond = useGameStore((s) => s.acknowledgeBond);
  const recentPrestigeCeremony = useGameStore((s) => s.recentPrestigeCeremony);
  const acknowledgePrestigeCeremony = useGameStore((s) => s.acknowledgePrestigeCeremony);
  const recentPromotions = useGameStore((s) => s.recentPromotions);
  const acknowledgePromotion = useGameStore((s) => s.acknowledgePromotion);
  const officersForToast = useGameStore((s) => s.officers);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  const ironman = useGameStore((s) => s.ironman ?? false);
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  // 戰場引燃 — hold the battle screen back ~1s so the world camera can fly to
  // the clash site first (BattleFocusFly); the battle then drops over that
  // very spot and the post-battle reveal shows the scar. One camera line.
  const battleId = tacticalBattle?.id ?? null;
  const [revealedForBattle, setRevealedForBattle] = useState<string | null>(null);
  useEffect(() => {
    if (!battleId) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const id = window.setTimeout(() => setRevealedForBattle(battleId), reduced ? 0 : 1000);
    return () => window.clearTimeout(id);
  }, [battleId]);
  const battleRevealed = !!battleId && revealedForBattle === battleId;
  // 觀戰 — minimized battles live as a diorama on the world map; the headless
  // driver keeps AI turns flowing. A fresh battle always opens fullscreen, and
  // a finished one reopens itself so the results modal can land.
  const battleViewMinimized = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  useEffect(() => {
    if (battleId) setBattleViewMinimized(false);
  }, [battleId, setBattleViewMinimized]);
  useEffect(() => {
    if (tacticalBattle?.winner && battleViewMinimized) setBattleViewMinimized(false);
  }, [tacticalBattle?.winner, battleViewMinimized, setBattleViewMinimized]);
  const battleScreenUp = !!tacticalBattle && battleRevealed && !battleViewMinimized;
  // Gates for the bond ceremony — it waits behind season report / events /
  // battle playback so it plays on a clear map, not buried under a modal.
  const ceremonyBlocked = useGameStore(
    (s) => !!s.lastReport || !!s.pendingEvent || !!s.tacticalBattle || s.pendingBattleTheaters.length > 0,
  );
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
  const wishes = useGameStore((s) => s.officerWishes);
  const victoryStatus = useGameStore((s) => s.victoryStatus);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const hotSeatPlayers = useGameStore((s) => s.hotSeatPlayers);
  const hotSeatActiveIndex = useGameStore((s) => s.hotSeatActiveIndex);
  const cycleHotSeat = useGameStore((s) => s.cycleHotSeat);
  const date = useGameStore((s) => s.date);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const playerForce = useGameStore((s) =>
    playerForceId ? s.forces[playerForceId] : null,
  );
  const playerCityCount = useGameStore(
    (s) =>
      Object.values(s.cities).filter((c) => c.ownerForceId === playerForceId)
        .length,
  );
  // Force-wide totals for the always-visible HUD (animated, flash on change).
  const playerGold = useGameStore((s) =>
    Object.values(s.cities).reduce((a, c) => (c.ownerForceId === s.playerForceId ? a + c.gold : a), 0),
  );
  const playerTroops = useGameStore((s) =>
    Object.values(s.cities).reduce((a, c) => (c.ownerForceId === s.playerForceId ? a + c.troops : a), 0),
  );
  const playerFood = useGameStore((s) =>
    Object.values(s.cities).reduce((a, c) => (c.ownerForceId === s.playerForceId ? a + c.food : a), 0),
  );
  const pendingCount = useGameStore(
    (s) => Object.keys(s.pendingCommands).length,
  );
  const trainingCount = useGameStore((s) =>
    s.pendingTrainings.filter((t) => {
      const o = s.officers[t.officerId];
      return o?.forceId === s.playerForceId;
    }).length,
  );
  const endSeason = useGameStore((s) => s.endSeason);
  // 季內進度 — how many of the player's officers still await an order this turn
  // (idle, in a self-run city, not training/marching). Nudges "use your turn".
  const idleCount = useGameStore((s) => {
    if (!s.playerForceId) return 0;
    const delegated = new Set(Object.keys(s.cityDelegations ?? {}));
    const training = new Set(s.pendingTrainings.map((tr) => tr.officerId));
    let n = 0;
    for (const o of Object.values(s.officers)) {
      if (o.forceId !== s.playerForceId || o.task) continue;
      if (training.has(o.id)) continue;
      const city = o.locationCityId ? s.cities[o.locationCityId] : null;
      if (!city || city.ownerForceId !== s.playerForceId || delegated.has(city.id)) continue;
      n++;
    }
    return n;
  });
  const selectCityFromHud = useGameStore((s) => s.selectCity);
  const autoAssignIdle = useGameStore((s) => s.autoAssignIdle);
  // Cycle through EVERY city that still has an idle commander — repeated taps
  // walk them one by one (like Tab does for cities), selecting each and flying
  // the map camera over to it, so a turn never leaves an officer forgotten
  // off-screen.
  const idleCycleRef = useRef(0);
  const jumpToIdle = () => {
    const s = useGameStore.getState();
    if (!s.playerForceId) return;
    const delegated = new Set(Object.keys(s.cityDelegations ?? {}));
    const training = new Set(s.pendingTrainings.map((tr) => tr.officerId));
    const seen = new Set<string>();
    const idleCities = [];
    for (const o of Object.values(s.officers)) {
      if (o.forceId !== s.playerForceId || o.task) continue;
      if (training.has(o.id)) continue;
      const city = o.locationCityId ? s.cities[o.locationCityId] : null;
      if (!city || city.ownerForceId !== s.playerForceId || delegated.has(city.id)) continue;
      if (seen.has(city.id)) continue;
      seen.add(city.id);
      idleCities.push(city);
    }
    if (idleCities.length === 0) return;
    idleCities.sort((a, b) => a.id.localeCompare(b.id));   // stable cycle order
    const idx = idleCycleRef.current % idleCities.length;
    idleCycleRef.current = idx + 1;
    const city = idleCities[idx];
    selectCityFromHud(city.id);
    requestMapFocus(city.id);
  };
  // 敵軍逼近 — player-owned cities a hostile field army is marching on, with
  // its combined strength and how far along the road it is. Sorted nearest-to-
  // arrival so the chip's first jump is to the most urgent front. Selects the
  // raw store maps (stable refs) and derives in useMemo — a selector that built
  // a fresh array every call would spin React into an infinite render (#185).
  const armiesMap = useGameStore((s) => s.armies);
  const citiesMap = useGameStore((s) => s.cities);
  const threats = useMemo(() => {
    if (!playerForceId) return [] as { cityId: string; name: string; troops: number; progress: number }[];
    const byCity: Record<string, { cityId: string; name: string; troops: number; progress: number }> = {};
    for (const a of Object.values(armiesMap)) {
      if (a.forceId === playerForceId || a.cellTarget) continue;
      const city = citiesMap[a.targetCityId];
      if (!city || city.ownerForceId !== playerForceId) continue;
      const cur = (byCity[a.targetCityId] ??= { cityId: a.targetCityId, name: city.name.zh, troops: 0, progress: 0 });
      cur.troops += a.troops;
      cur.progress = Math.max(cur.progress, a.progress);
    }
    return Object.values(byCity).sort((x, y) => y.progress - x.progress);
  }, [armiesMap, citiesMap, playerForceId]);
  // Jump to the most-imminent threatened city.
  const jumpToThreat = () => {
    if (threats.length > 0) selectCityFromHud(threats[0].cityId);
  };
  const reset = useGameStore((s) => s.reset);
  const weather = useGameStore((s) => s.weather);
  const mandate = useGameStore((s) =>
    s.playerForceId ? s.mandate.byForce[s.playerForceId] ?? 50 : 50,
  );
  // 空格過旬 — the same path as the advance button (hot-seat cycling and
  // all), but only when nothing modal owns the keyboard: no report up, not
  // inside a city, no battle running.
  // 日流 — drive the day-by-day playback while it runs.
  const dayFlow = useGameStore((s) => s.dayFlow);
  const dayFlowTick = useGameStore((s) => s.dayFlowTick);
  const dayFlowTogglePause = useGameStore((s) => s.dayFlowTogglePause);
  const dayFlowSetSpeed = useGameStore((s) => s.dayFlowSetSpeed);
  const dayFlowSkip = useGameStore((s) => s.dayFlowSkip);
  useEffect(() => {
    if (!dayFlow?.playing) return;
    const iv = setInterval(() => dayFlowTick(), 420 / (dayFlow.speed || 1));
    return () => clearInterval(iv);
  }, [dayFlow?.playing, dayFlow?.speed, dayFlow?.key, dayFlowTick]);

  const advanceTurn = () => {
    playSfx('horn');
    if (hotSeatPlayers.length > 1) {
      if (hotSeatActiveIndex === hotSeatPlayers.length - 1) endSeason();
      cycleHotSeat();
    } else {
      endSeason();
    }
  };
  // 演義模擬器 — no player force means observe mode: auto-advance ticks
  // (auto-dismissing the season report) until a force unifies the realm.
  const observing = playerForceId === null;
  const [autoSim, setAutoSim] = useState(observing);
  // 觀戰倍速 — how fast the spectator sim ticks (1× = 1.4s/旬).
  const [simSpeed, setSimSpeed] = useState(1);
  useEffect(() => {
    if (!autoSim || !observing) return;
    const id = setInterval(() => {
      const s = useGameStore.getState();
      if (s.tacticalBattle || s.victoryStatus === 'victory') return;
      if (s.lastReport) { s.dismissReport(); return; }
      if (s.pendingEvent) { s.dismissEvent(); return; }
      s.endSeason();
    }, Math.round(1400 / simSpeed));
    return () => clearInterval(id);
  }, [autoSim, observing, simSpeed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      const s = useGameStore.getState();
      const blocked = !!s.lastReport || s.cityMapOpen || !!s.tacticalBattle || s.victoryStatus !== 'playing';
      // 命令臺 — / or ⌘K/Ctrl-K opens the command palette.
      if (!typing && !blocked && (e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')))) {
        e.preventDefault();
        setShowPalette(true);
        return;
      }
      if (e.code !== 'Space' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing || (el && el.tagName === 'BUTTON')) return;
      if (blocked) return;
      e.preventDefault();
      advanceTurn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotSeatPlayers.length, hotSeatActiveIndex]);

  const season = SEASON_LABEL[date.season];
  const monthNum = date.month ?? firstMonthOfSeason(date.season);
  // 季色 — spring jade, summer cinnabar, autumn gold, winter frost.
  const seasonAccent = { spring: '#7ec46a', summer: '#e0744a', autumn: '#e6c473', winter: '#a9c8e2' }[date.season] ?? '#e6c473';
  // 見底警示 — a treasury/granary at or below zero pulses red.
  const goldLow = playerGold <= 0;
  const foodLow = playerFood <= 0;
  const phaseInfo = MONTH_PHASE_LABEL[date.phase ?? 'upper'];
  const weatherZh = WEATHER_LABEL[weather.kind].zh;
  const windZh = WIND_LABEL[weather.wind].zh;
  const mandateInfo = MANDATE_LABEL(mandate);
  const mandateColor =
    mandateInfo.tone === 'high' ? '#e6c473' :
    mandateInfo.tone === 'mid'  ? '#9aa6b0' : '#b8442e';

  // 命令臺指令集 — every panel + key action, reachable by keyboard. Cheap to
  // rebuild; only mounted when the palette is open.
  const paletteCommands: PaletteCommand[] = (() => {
    const g = { diplo: t('外交', 'Diplomacy'), people: t('人才', 'Personnel'), court: t('朝堂', 'Court'), mil: t('軍務', 'Military'), craft: t('匠工', 'Crafting'), rec: t('記錄', 'Records'), act: t('指令', 'Action'), sys: t('系統', 'System') };
    const c: PaletteCommand[] = [
      { id: 'idle', zh: '前往閒置武將', en: 'Go to idle commander', hint: g.act, run: jumpToIdle },
      { id: 'autoassign', zh: '一鍵委派閒置武將', en: 'Auto-assign idle officers', hint: g.act, run: () => autoAssignIdle() },
      ...(threats.length > 0 ? [{ id: 'threat', zh: '前往受襲城池', en: 'Go to threatened city', hint: g.act, run: jumpToThreat }] : []),
      { id: 'advance', zh: '結束本旬', en: 'End the turn', hint: g.act, run: advanceTurn },
      { id: 'todo', zh: '待辦', en: 'To-Do', hint: g.rec, run: () => setShowToDo(true) },
      { id: 'cities', zh: '郡縣一覽', en: 'Cities roster', hint: g.rec, run: () => setShowCityRoster(true) },
      { id: 'provinces', zh: '州域 — 各州控勢', en: 'Provinces', hint: g.rec, run: () => setShowProvinces(true) },
      { id: 'convoys', zh: '輜重 — 運輸一覽', en: 'Convoys', hint: g.rec, run: () => setShowConvoys(true) },
      { id: 'budget', zh: '度支簿', en: 'Treasury', hint: g.rec, run: () => setShowBudget(true) },
      { id: 'power', zh: '天下大勢', en: 'Balance of power', hint: g.rec, run: () => setShowPowerGraph(true) },
      { id: 'compare', zh: '較量 — 勢力對比', en: 'Compare forces', hint: g.rec, run: () => setShowCompare(true) },
      { id: 'rumors', zh: '市井流言', en: 'Rumors', hint: g.rec, run: () => setShowRumors(true) },
      { id: 'annals', zh: '史書', en: 'Annals', hint: g.rec, run: () => setShowHistoryBook(true) },
      { id: 'chronicle', zh: '國史', en: 'Chronicle', hint: g.rec, run: () => setShowChronicle(true) },
      { id: 'zaiyi', zh: '災異志 — 天象災異編年', en: 'Annals of portents', hint: g.rec, run: () => setShowAnnals(true) },
      { id: 'rites', zh: '祭祀 — 郊祀/祈雨/招安/宣撫', en: 'Rites & pacification', hint: g.court, run: () => setShowRites(true) },
      { id: 'relief', zh: '賑災 — 開倉/徙民', en: 'Disaster relief', hint: g.court, run: () => setShowRelief(true) },
      { id: 'ach', zh: '勳功', en: 'Achievements', hint: g.rec, run: () => setShowAch(true) },
      { id: 'stats', zh: '戰記', en: 'Campaign stats', hint: g.rec, run: () => setShowCampaignStats(true) },
      { id: 'glossary', zh: '概念 — 機制詞條', en: 'Concepts glossary', hint: g.rec, run: () => setShowGlossary(true) },
      { id: 'diplomacy', zh: '邦交', en: 'Diplomacy', hint: g.diplo, run: () => setShowDiplomacy(true) },
      { id: 'dipgraph', zh: '關係図', en: 'Relations graph', hint: g.diplo, run: () => setShowDipGraph(true) },
      { id: 'forces', zh: '群雄', en: 'Forces', hint: g.diplo, run: () => setShowForces(true) },
      { id: 'relationships', zh: '因緣', en: 'Officer relations', hint: g.people, run: () => setShowRelationships(true) },
      { id: 'bonds', zh: '結義', en: 'Bonds', hint: g.people, run: () => setShowBonds(true) },
      { id: 'prestige', zh: '威名', en: 'Prestige', hint: g.people, run: () => setShowPrestige(true) },
      { id: 'deeds', zh: '武功', en: 'Deeds', hint: g.people, run: () => setShowDeeds(true) },
      { id: 'hall-of-fame', zh: '名將榜', en: 'Hall of Fame', hint: g.people, run: () => setShowHallOfFame(true) },
      { id: 'wiki', zh: '列傳', en: 'Biographies', hint: g.people, run: () => setShowEncyclopedia(true) },
      { id: 'titles', zh: '任官', en: 'Appointments', hint: g.court, run: () => setShowTitles(true) },
      { id: 'governors', zh: '州牧', en: 'Governors', hint: g.court, run: () => setShowGovernors(true) },
      { id: 'kaoke', zh: '考課', en: 'Reviews', hint: g.court, run: () => setShowKaoke(true) },
      { id: 'courtm', zh: '朝廷', en: 'Court', hint: g.court, run: () => setShowCourt(true) },
      { id: 'relations', zh: '邦交關係', en: 'Relations', hint: g.court, run: () => setShowRelations(true) },
      { id: 'letters', zh: '書信', en: 'Letters', hint: g.court, run: () => setShowWishes(true) },
      { id: 'advisor', zh: '錦囊', en: 'Advisor', hint: g.mil, run: () => setShowAdvisor(true) },
      { id: 'schemes', zh: '計略', en: 'Schemes', hint: g.mil, run: () => setShowSchemes(true) },
      { id: 'legions', zh: '軍團', en: 'Legions', hint: g.mil, run: () => setShowLegions(true) },
      { id: 'battles', zh: '戰史', en: 'Battle history', hint: g.mil, run: () => setShowHistory(true) },
      { id: 'replays', zh: '戰錄', en: 'Replays', hint: g.mil, run: () => setShowReplays(true) },
      { id: 'guard', zh: '私兵', en: 'Private guard', hint: g.mil, run: () => setShowPrivateForces(true) },
      { id: 'espionage', zh: '密偵', en: 'Espionage', hint: g.mil, run: () => setShowEspionage(true) },
      { id: 'formations', zh: '陣形', en: 'Formations', hint: g.mil, run: () => setShowFormations(true) },
      { id: 'training', zh: '演武場', en: 'Sparring ground', hint: g.mil, run: () => setShowTraining(true) },
      { id: 'debate-ground', zh: '論辯場', en: 'Debate ground', hint: g.mil, run: () => setShowDebateGround(true) },
      { id: 'persuasion', zh: '說客', en: 'Persuader-envoy', hint: g.diplo, run: () => setShowPersuasion(true) },
      { id: 'tournament', zh: '比武大會', en: 'Martial tournament', hint: g.mil, run: () => setShowTournament(true) },
      { id: 'duel-hall', zh: '武鬥館', en: 'Hall of bouts', hint: g.mil, run: () => setShowDuelHall(true) },
      { id: 'armoury', zh: '寶物', en: 'Armoury', hint: g.craft, run: () => setShowArmoury(true) },
      { id: 'forge', zh: '鍛造', en: 'Forge', hint: g.craft, run: () => setShowForge(true) },
      { id: 'settings', zh: '設定', en: 'Settings', hint: g.sys, run: () => setShowSettings(true) },
    ];
    if (careerMode) c.push({ id: 'career', zh: '一代記', en: 'Career chronicle', hint: g.people, run: () => setShowCareer(true) });
    return c;
  })();

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={reset}>
          ← {t('標題', 'Title')}
        </button>
        <div className={styles.dateBlock}>
          <span className={styles.year}>{date.year} AD</span>
          <span className={styles.season} title={`${season.en} (${season.zh})`}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: seasonAccent, marginRight: 5, boxShadow: `0 0 5px ${seasonAccent}`, verticalAlign: 'middle' }} />
            {monthNum}月{phaseInfo.zh} <span className={styles.seasonZh} style={{ color: seasonAccent }}>{season.zh}</span>
          </span>
          <span
            className={styles.season}
            title={`Weather affects fire attacks and march speed. Wind power: ${weather.windPower}.`}
            style={{ color: '#9aa6b0' }}
          >
            {weatherZh}·{windZh}
          </span>
          <span
            className={styles.season}
            title={`Heaven's Mandate (天命): ${mandate}/100. Affects recruitment and rebellion risk.`}
            style={{ color: mandateColor }}
          >
            天命 {mandateInfo.zh}
          </span>
        </div>
        <div className={styles.playerBlock}>
          {playerForce && (
            <>
              <span
                className={styles.colorDot}
                style={{ background: playerForce.color }}
              />
              <span className={styles.playerName}>{playerForce.name.zh}</span>
              <span className={styles.playerNameEn}>{t('', playerForce.name.en)}</span>
              <span style={{ marginLeft: 10, fontSize: '0.82rem', color: '#d6dde4', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 11 }}>
                <span className={goldLow ? 'tkm-threat-chip' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: goldLow ? '0 3px' : undefined, color: goldLow ? '#e0707a' : undefined }} title={goldLow ? t('國庫見底!', 'Treasury empty!') : t('金', 'Gold')}><Icon name="gold" size={13} color={goldLow ? '#e0707a' : '#e6c473'} /><AnimatedNumber value={playerGold} flash /></span>
                <span className={foodLow ? 'tkm-threat-chip' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: foodLow ? '0 3px' : undefined, color: foodLow ? '#e0707a' : undefined }} title={foodLow ? t('糧倉見底!', 'Granary empty!') : t('糧', 'Grain')}><Icon name="grain" size={13} color={foodLow ? '#e0707a' : '#d8c88a'} /><AnimatedNumber value={playerFood} flash /></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title={t('兵', 'Troops')}><Icon name="war" size={13} color="#9ec0d8" /><AnimatedNumber value={playerTroops} flash /></span>
              </span>
            </>
          )}
        </div>
        <div className={styles.orderBlock}>
          {t('指令', 'Orders')}: <strong>{pendingCount}/{playerCityCount}</strong>
          {trainingCount > 0 && (
            <span
              title={t(`書院/師徒培訓中:${trainingCount} 人`, `Training (academy + mentor): ${trainingCount} officer${trainingCount > 1 ? 's' : ''}`)}
              style={{ marginLeft: 12, color: '#88b7e8', fontSize: '0.85em' }}
            >
              📚 <strong>{trainingCount}</strong>
            </span>
          )}
        </div>
        {/* Top-tier (always visible — most clicked) */}
        <button
          className={styles.forcesButton}
          onClick={() => setShowOfficers(true)}
        >
          {t('武將', 'Officers')}
        </button>
        <HudMenu
          label={t('外交', 'Diplomacy')}
          title={t('外交 — 邦交、關係図', 'Diplomacy — relations & graph')}
          items={[
            { label: t('邦交', 'Relations'), onClick: () => setShowDiplomacy(true) },
            { label: t('關係図', 'Graph'),   onClick: () => setShowDipGraph(true) },
          ]}
        />
        <button
          className={styles.forcesButton}
          onClick={() => setShowForces(true)}
        >
          {t('群雄', 'Forces')}
        </button>

        {/* ── Grouped dropdowns ── */}
        <HudMenu
          label={t('人才', 'Personnel')}
          title={t('人才 — 因緣、武功、列傳', 'Personnel — bonds, deeds, biographies')}
          items={[
            { label: t('因緣', 'Relations'), onClick: () => setShowRelationships(true) },
            { label: t('結義', 'Bonds'),     onClick: () => setShowBonds(true) },
            { label: t('威名', 'Prestige'),  onClick: () => setShowPrestige(true) },
            { label: t('武功', 'Deeds'),     onClick: () => setShowDeeds(true) },
            { label: t('名將榜', 'Hall of Fame'), onClick: () => setShowHallOfFame(true) },
            { label: t('列傳', 'Wiki'),      onClick: () => setShowEncyclopedia(true) },
            ...(careerMode
              ? [{ label: t('一代記', 'Chronicle'), onClick: () => setShowCareer(true) }]
              : []),
          ]}
        />
        <HudMenu
          label={t('朝堂', 'Court')}
          title={t('朝堂 — 任官、州牧、朝廷', 'Court — appointments, governors, edicts')}
          items={[
            { label: t('任官', 'Titles'),    onClick: () => setShowTitles(true) },
            { label: t('州牧', 'Governors'), onClick: () => setShowGovernors(true) },
            { label: t('朝廷', 'Court'),     onClick: () => setShowCourt(true) },
            { label: t('祭祀', 'Rites'),     onClick: () => setShowRites(true) },
            { label: t('賑災', 'Relief'),    onClick: () => setShowRelief(true), badge: pendingReliefCount },
            { label: t('邦交', 'Relations'), onClick: () => setShowRelations(true) },
            { label: t('書信', 'Letters'),   onClick: () => setShowWishes(true), badge: wishes.length },
          ]}
        />
        <HudMenu
          label={t('軍務', 'Military')}
          title={t('軍務 — 戰史、密偵、陣形', 'Military — battles, espionage, formations')}
          items={[
            { label: t('錦囊', 'Advisor'),    onClick: () => setShowAdvisor(true) },
            { label: t('演武', 'Sparring'),   onClick: () => setShowTraining(true) },
            { label: t('論辯', 'Debate'),     onClick: () => setShowDebateGround(true) },
            { label: t('比武', 'Tournament'), onClick: () => setShowTournament(true) },
            { label: t('武鬥館', 'Hall'),     onClick: () => setShowDuelHall(true) },
            { label: t('計略', 'Schemes'),    onClick: () => setShowSchemes(true) },
            { label: t('軍團', 'Legions'),    onClick: () => setShowLegions(true) },
            { label: t('戰史', 'Battles'),    onClick: () => setShowHistory(true) },
            { label: t('戰錄', 'Replays'),    onClick: () => setShowReplays(true) },
            { label: t('私兵', 'Guard'),      onClick: () => setShowPrivateForces(true) },
            { label: t('密偵', 'Espionage'),  onClick: () => setShowEspionage(true) },
            { label: t('陣形', 'Formations'), onClick: () => setShowFormations(true) },
          ]}
        />
        <HudMenu
          label={t('匠工', 'Crafting')}
          title={t('匠工 — 寶物、鍛造', 'Crafting — armoury and forge')}
          items={[
            { label: t('寶物', 'Armoury'), onClick: () => setShowArmoury(true) },
            { label: t('鍛造', 'Forge'),   onClick: () => setShowForge(true) },
          ]}
        />
        <HudMenu
          label={t('記錄', 'Records')}
          title={t('記錄 — 勳功、戰記、概念', 'Records — achievements, stats & concepts')}
          items={[
            { label: t('史書', 'Annals'),    onClick: () => setShowHistoryBook(true) },
            { label: t('大勢', 'Powers'),    onClick: () => setShowPowerGraph(true) },
            { label: t('較量', 'Compare'),   onClick: () => setShowCompare(true) },
            { label: t('市井', 'Rumors'),    onClick: () => setShowRumors(true) },
            { label: t('待辦', 'To-Do'),     onClick: () => setShowToDo(true) },
            { label: t('郡縣', 'Cities'),    onClick: () => setShowCityRoster(true) },
            { label: t('州域', 'Provinces'), onClick: () => setShowProvinces(true) },
            { label: t('輜重', 'Convoys'),   onClick: () => setShowConvoys(true) },
            { label: t('度支', 'Treasury'),  onClick: () => setShowBudget(true) },
            { label: t('勳功', 'Achievements'), onClick: () => setShowAch(true) },
            { label: t('戰記', 'Stats'),        onClick: () => setShowCampaignStats(true) },
            { label: t('概念', 'Concepts'),     onClick: () => setShowGlossary(true) },
            { label: t('📜 國史', '📜 Chronicle'), onClick: () => setShowChronicle(true) },
            { label: t('☄ 災異志', '☄ Portents'), onClick: () => setShowAnnals(true) },
          ]}
        />
        <HudMenu
          label={t('設定', 'System')}
          title={t('系統 — 設定、存讀、音效', 'System — settings, save/load, sound')}
          items={[
            { label: t('⌨ 命令臺 (/)', '⌨ Command (/)'),       onClick: () => setShowPalette(true) },
            { label: t('⚙ 設定', '⚙ Settings'),                onClick: () => setShowSettings(true) },
            { label: fogOfWar ? t('🌫 戰霧：開', '🌫 Fog: On') : t('☀ 戰霧：關', '☀ Fog: Off'), onClick: () => setFogOfWar(!fogOfWar) },
            { label: t('📖 教學', '📖 Tutorial'),               onClick: () => setTutorialStep(0) },
            ...(ironman
              ? [{ label: t('🔒 鐵人模式（禁手動存檔）', '🔒 Ironman (no manual save)'), onClick: () => {} }]
              : [{ label: t('保存', 'Save'), onClick: () => setShowSave('save') }]),
            { label: t('載入', 'Load'),                        onClick: () => setShowSave('load') },
            { label: soundEnabled ? t('🔊 音效：開', '🔊 Sound: On') : t('🔇 音效：關', '🔇 Sound: Off'), onClick: () => setSoundEnabled(!soundEnabled) },
            ...THEMES.map((th) => ({
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      width: 30,
                      height: 14,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.3)',
                    }}
                  >
                    <span style={{ flex: 1, background: th.swatch[0] }} />
                    <span style={{ flex: 1, background: th.swatch[1] }} />
                    <span style={{ flex: 1, background: th.swatch[2] }} />
                  </span>
                  {theme === th.id ? '✓ ' : '  '}
                  {t(th.zh, th.en)}
                </span>
              ),
              onClick: () => handleSetTheme(th.id),
            })),
          ]}
        />
        {observing ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              className={styles.advanceButton}
              onClick={() => setAutoSim((v) => !v)}
              title={t('演義模擬器 — 自動推演天下大勢', 'Spectator — auto-simulating the realm')}
              style={{ background: autoSim ? 'rgba(122,106,168,0.3)' : undefined }}
            >
              {autoSim ? t('⏸ 暫停推演', '⏸ Pause') : t('▶ 繼續推演', '▶ Resume')}
            </button>
            {/* 觀戰倍速 — speed up or slow the auto-advance. */}
            <span style={{ display: 'inline-flex', gap: 2 }}>
              {[1, 2, 4].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSimSpeed(sp)}
                  title={t(`${sp}× 速度`, `${sp}× speed`)}
                  style={{
                    background: simSpeed === sp ? 'rgba(122,106,168,0.4)' : 'transparent',
                    border: `1px solid ${simSpeed === sp ? '#a890d0' : '#4a3a5a'}`,
                    color: simSpeed === sp ? '#d0c0f0' : '#8a7aa0',
                    padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
                  }}
                >{sp}×</button>
              ))}
            </span>
          </span>
        ) : (
          <>
            {/* 敵軍逼近 — pulsing red alert when a hostile army marches on one of
                your cities; click to jump to the most imminent front. */}
            {threats.length > 0 && (
              <Chip
                tone="danger"
                pulse
                icon="⚠"
                onClick={jumpToThreat}
                title={threats
                  .map((th) => `${th.name} ⚔ ${th.troops.toLocaleString()}${t('兵', '')}`)
                  .join('  ·  ')}
                style={{ marginRight: 8 }}
              >
                {threats.length} {t('城受襲', threats.length > 1 ? 'under threat' : 'threatened')}
              </Chip>
            )}
            {/* 季內進度 — idle-commander nudge; click to jump to the first. */}
            <Chip
              tone={idleCount > 0 ? 'warn' : 'ok'}
              icon={idleCount > 0 ? '⚑' : '✓'}
              onClick={jumpToIdle}
              disabled={idleCount === 0}
              title={idleCount > 0
                ? t('尚有未派遣的武將 — 點擊前往', 'Idle commanders await orders — click to jump')
                : t('全員已令', 'every commander has an order')}
              style={{ marginRight: 8 }}
            >
              {idleCount > 0 ? `${idleCount} ${t('閒置', 'idle')}` : t('全員已令', 'all set')}
            </Chip>
            {/* 一鍵委派 — auto-assign every idle officer a sensible task. */}
            {idleCount > 0 && (
              <button
                onClick={() => autoAssignIdle()}
                title={t('一鍵委派 — 依城所需與才能,自動派遣全部閒置武將', 'Auto-assign all idle officers by city need & aptitude')}
                style={{
                  marginRight: 8, cursor: 'pointer',
                  background: 'rgba(126,214,138,0.16)', border: '1px solid #6fae73',
                  color: '#9ad6a8', padding: '0.2rem 0.55rem', borderRadius: 4,
                  fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem', whiteSpace: 'nowrap',
                }}
              >
                ⚡ {t('委派', 'Assign')}
              </button>
            )}
            <button
              className={styles.advanceButton}
              onClick={advanceTurn}
            >
              {hotSeatPlayers.length > 1
                ? t(`結束 ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? '回合'} →`,
                    `End ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? 'Turn'} →`)
                : t(`下旬 ${monthNum}月${phaseInfo.zh} →`,
                    `End ${monthNum}m ${phaseInfo.zh} →`)}
            </button>
          </>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.mapWrap} style={{ position: 'relative' }}>
          {/* Free the strategic map's WebGL context while the fullscreen battle
              (单挑 / 舌战 / 会战) sits opaque on top of it. Two live three.js
              contexts at once is what tips mobile browsers into an out-of-memory
              tab reload — which drops the player back to the map mid-fight and
              forces a re-出阵. Minimizing the battle to its map diorama clears
              battleScreenUp, so the map remounts and 观战 still works. */}
          {!battleScreenUp && <Suspense fallback={null}><StrategicMap3D /></Suspense>}
          {/* In-transit armies overview — shown over both map modes. */}
          <div style={{ position: 'absolute', left: 8, top: 92, zIndex: 15 }}>
            <ArmiesPanel />
          </div>
        </div>
        <CityPanel />
      </main>

      {/* 季度過場 — washes a season card over the realm when 春→夏→秋→冬 turns,
          settling just above the season report it then reveals. */}
      <SeasonTransition />
      {/* 日流控制條 — day counter + pause/speed/skip while the turn plays out. */}
      {dayFlow && (
        <div style={{
          position: 'fixed', bottom: 'calc(4.6rem + var(--tkm-safe-bottom))', left: '50%', transform: 'translateX(-50%)',
          zIndex: 640, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(16, 22, 30, 0.92)', border: '1px solid #d4a84a', borderRadius: 8,
          padding: '0.3rem 0.7rem', color: '#f0d98a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t(`第 ${dayFlow.day + 1} 日 / ${dayFlow.total}`, `Day ${dayFlow.day + 1} / ${dayFlow.total}`)}</span>
          <button onClick={dayFlowTogglePause} style={{ background: 'transparent', border: '1px solid #d4a84a', color: '#f0d98a', borderRadius: 5, cursor: 'pointer', padding: '0.1rem 0.5rem', fontFamily: 'inherit' }}>
            {dayFlow.playing ? '⏸' : '▶'}
          </button>
          {[1, 2, 4].map((sp) => (
            <button key={sp} onClick={() => dayFlowSetSpeed(sp)} style={{
              background: dayFlow.speed === sp ? 'rgba(212,168,74,0.25)' : 'transparent',
              border: `1px solid ${dayFlow.speed === sp ? '#d4a84a' : '#4a5568'}`,
              color: dayFlow.speed === sp ? '#f0d98a' : '#97a4ae', borderRadius: 5, cursor: 'pointer', padding: '0.1rem 0.4rem', fontFamily: 'inherit', fontSize: '0.78rem',
            }}>{sp}×</button>
          ))}
          <button onClick={dayFlowSkip} style={{ background: 'transparent', border: '1px solid #4a5568', color: '#97a4ae', borderRadius: 5, cursor: 'pointer', padding: '0.1rem 0.5rem', fontFamily: 'inherit' }}>⏭</button>
        </div>
      )}
      {/* 日流播放時,季報壓後 — the report pops once the days finish walking. */}
      {!dayFlow && (
        <ErrorBoundary fallbackLabel="Season report panel crashed">
          <SeasonReportModal />
        </ErrorBoundary>
      )}
      <ErrorBoundary fallbackLabel="Battle theater crashed">
        {!dayFlow && <BattleTheaterMount />}
        {!dayFlow && <FieldBattleMount />}
      </ErrorBoundary>
      {showForces && <ForcesOverview onClose={() => setShowForces(false)} />}
      {showDiplomacy && (
        <DiplomacyModal onClose={() => setShowDiplomacy(false)} />
      )}
      {showOfficers && (
        <OfficersTab onClose={() => setShowOfficers(false)} />
      )}
      {showRelationships && <RelationshipBrowserModal onClose={() => setShowRelationships(false)} />}
      {showBonds && <BondsModal onClose={() => setShowBonds(false)} />}
      {showPrivateForces && <PrivateForcesModal onClose={() => setShowPrivateForces(false)} />}
      {showPrestige && <PrestigeModal onClose={() => setShowPrestige(false)} />}
      {showCourt && <CourtModal onClose={() => setShowCourt(false)} />}
      {showWishes && <WishesModal onClose={() => setShowWishes(false)} />}
      {showCareer && <CareerModal onClose={() => setShowCareer(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <Suspense fallback={null}>
        {showHistory && (
          <BattleHistoryModal onClose={() => setShowHistory(false)} />
        )}
        {showArmoury && <ArmouryModal onClose={() => setShowArmoury(false)} />}
        {showTitles && <TitlesModal onClose={() => setShowTitles(false)} />}
        {showGovernors && <GovernorsModal onClose={() => setShowGovernors(false)} />}
        {showFormations && <FormationsModal onClose={() => setShowFormations(false)} />}
        {showTraining && <TrainingGroundModal onClose={() => setShowTraining(false)} />}
        {showDebateGround && <DebateGroundModal onClose={() => setShowDebateGround(false)} />}
        {showPersuasion && <PersuasionModal onClose={() => setShowPersuasion(false)} />}
        {showDuelHall && <DuelHallModal onClose={() => setShowDuelHall(false)} />}
        {showTournament && <TournamentModal onClose={() => setShowTournament(false)} />}
        {showEspionage && <EspionageModal onClose={() => setShowEspionage(false)} />}
        {showDeeds && <DeedsModal onClose={() => setShowDeeds(false)} />}
        {showHallOfFame && <HallOfFameModal onClose={() => setShowHallOfFame(false)} />}
        {showReplays && <BattleReplayModal onClose={() => setShowReplays(false)} />}
        {showEncyclopedia && <EncyclopediaModal onClose={() => setShowEncyclopedia(false)} />}
        {showDipGraph && <DiplomacyGraphModal onClose={() => setShowDipGraph(false)} />}
        {showForge && <ForgingModal onClose={() => setShowForge(false)} />}
        {showAch && <AchievementsModal onClose={() => setShowAch(false)} />}
        {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
        {showCampaignStats && <CampaignStatsModal onClose={() => setShowCampaignStats(false)} />}
        {showChronicle && <ChronicleModal onClose={() => setShowChronicle(false)} />}
        {showAnnals && <AnnalsModal onClose={() => setShowAnnals(false)} />}
        {showRites && <RitesModal onClose={() => setShowRites(false)} />}
        {showRelief && <ReliefModal onClose={() => setShowRelief(false)} />}
        {showRelations && <RelationsModal onClose={() => setShowRelations(false)} />}
        {showLegions && <LegionsModal onClose={() => setShowLegions(false)} />}
        {showAdvisor && <AdvisorModal onClose={() => setShowAdvisor(false)} />}
        {showKaoke && <GovernorEvalModal onClose={() => setShowKaoke(false)} />}
        {showHistoryBook && <HistoryBookModal onClose={() => setShowHistoryBook(false)} />}
        {showSchemes && <SchemesModal onClose={() => setShowSchemes(false)} />}
        {showPowerGraph && <PowerGraphModal onClose={() => setShowPowerGraph(false)} />}
        {showCityRoster && <CityRosterModal onClose={() => setShowCityRoster(false)} />}
        {showBudget && <BudgetModal onClose={() => setShowBudget(false)} />}
        {showToDo && <ToDoModal onClose={() => setShowToDo(false)} onOpenLetters={() => setShowWishes(true)} />}
        {showPalette && <CommandPalette commands={paletteCommands} onClose={() => setShowPalette(false)} />}
        {showCompare && <ForceCompareModal onClose={() => setShowCompare(false)} />}
        {showRumors && <RumorsModal onClose={() => setShowRumors(false)} />}
        {showProvinces && <ProvinceModal onClose={() => setShowProvinces(false)} />}
        {showConvoys && <ConvoyModal onClose={() => setShowConvoys(false)} />}
      </Suspense>
      {/* 戰略層回饋 — order-confirmation toasts, top-centre */}
      <ActionToasts />
      {/* 慶典彈窗 — celebratory image/video on milestones (升城/遷都…) */}
      <CelebrationPopup />
      {/* Achievement toast — bottom-right when something just unlocked */}
      {recentAchievementUnlocks.length > 0 && (
        <div
          key={recentAchievementUnlocks.length}
          onClick={acknowledgeAchievements}
          className="tkm-ach-toast"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(160deg,#1b2531,#10161e)',
            border: '2px solid #e6c473',
            padding: '0.7rem 1rem',
            color: '#e6c473',
            fontFamily: 'var(--tkm-font-body)',
            cursor: 'pointer',
            zIndex: 980,
          }}
        >
          <div className="tkm-ach-toast-title" style={{ fontSize: '0.7rem', color: '#c9a64e' }}>
            {t('勳功', 'UNLOCKED')}
          </div>
          <div style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>
            {t(`${recentAchievementUnlocks.length} 項新成就`, `${recentAchievementUnlocks.length} new achievement${recentAchievementUnlocks.length > 1 ? 's' : ''}`)}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>
            {t('點擊關閉', 'click to dismiss')}
          </div>
        </div>
      )}
      {/* Deed-title toast — sits above the achievement toast when both present */}
      {recentDeedTitles.length > 0 && (
        <div
          onClick={acknowledgeDeedTitles}
          style={{
            position: 'fixed',
            bottom: recentAchievementUnlocks.length > 0 ? 130 : 20,
            right: 20,
            background: 'linear-gradient(160deg,#1b2531,#10161e)',
            border: '2px solid #c9a64e',
            padding: '0.7rem 1rem',
            color: '#e6c473',
            fontFamily: 'var(--tkm-font-body)',
            cursor: 'pointer',
            zIndex: 980,
            boxShadow: '0 0 14px rgba(193, 154, 59, 0.4)',
            animation: 'tkmFadeIn 0.4s ease-out',
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.1rem', color: '#c9a64e' }}>
            {t('稱號', 'EARNED')}
          </div>
          {recentDeedTitles.slice(-3).map((g, i) => {
            const o = officersForToast[g.officerId];
            const titleDef = DEED_TITLES_BY_ID[g.titleId];
            if (!o || !titleDef) return null;
            return (
              <div key={i} style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                {o.name.zh} — <span style={{ color: '#c9a64e' }}>「{titleDef.name.zh}」</span>
              </div>
            );
          })}
          {recentDeedTitles.length > 3 && (
            <div style={{ fontSize: '0.7rem', color: '#7a8893', marginTop: '0.15rem' }}>
              {t(`還有 ${recentDeedTitles.length - 3} 例`, `+${recentDeedTitles.length - 3} more`)}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic', marginTop: '0.2rem' }}>
            {t('點擊關閉', 'click to dismiss')}
          </div>
        </div>
      )}
      {/* 威名 toast — stacks above the deed-title + achievement toasts */}
      {recentPrestige.length > 0 && (
        <div
          onClick={acknowledgePrestige}
          style={{
            position: 'fixed',
            bottom: 20 + (recentAchievementUnlocks.length > 0 ? 110 : 0) + (recentDeedTitles.length > 0 ? 110 : 0),
            right: 20,
            background: 'linear-gradient(160deg,#1b2531,#10161e)',
            border: '2px solid #d96a4a',
            padding: '0.7rem 1rem',
            color: '#e2a07a',
            fontFamily: 'var(--tkm-font-body)',
            cursor: 'pointer',
            zIndex: 980,
            boxShadow: '0 0 14px rgba(217, 106, 74, 0.4)',
            animation: 'tkmFadeIn 0.4s ease-out',
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.1rem', color: '#d96a4a' }}>
            {t('威名', 'PRESTIGE')}
          </div>
          {recentPrestige.slice(-3).map((g, i) => {
            const o = officersForToast[g.officerId];
            const titleDef = prestigeTitleById(g.titleId);
            if (!o || !titleDef) return null;
            return (
              <div key={i} style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                {o.name.zh} — <span style={{ color: '#d96a4a' }}>「{titleDef.name.zh}」</span>
              </div>
            );
          })}
          {recentPrestige.length > 3 && (
            <div style={{ fontSize: '0.7rem', color: '#7a8893', marginTop: '0.15rem' }}>
              {t(`還有 ${recentPrestige.length - 3} 例`, `+${recentPrestige.length - 3} more`)}
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic', marginTop: '0.2rem' }}>
            {t('點擊關閉', 'click to dismiss')}
          </div>
        </div>
      )}
      {/* 義結金蘭 ceremony for a bond forged in-play (one at a time, and only
          once the season report / events have been dismissed). */}
      {recentBonds.length > 0 && !ceremonyBlocked && (() => {
        const c = recentBonds[0];
        const a = officersForToast[c.aId], b = officersForToast[c.bId];
        if (!a || !b) { acknowledgeBond(); return null; }
        return (
          <BondCeremony
            a={a}
            b={b}
            titleZh={c.titleZh}
            titleEn={c.titleEn}
            color={playerForce?.color ?? '#e6c473'}
            year={date.year}
            onDone={acknowledgeBond}
          />
        );
      })()}
      {/* 封號 ceremony for a top-tier 威名 rise — after bonds, and on a clear map. */}
      {recentBonds.length === 0 && recentPrestigeCeremony.length > 0 && !ceremonyBlocked && (() => {
        const c = recentPrestigeCeremony[0];
        const o = officersForToast[c.officerId];
        if (!o) { acknowledgePrestigeCeremony(); return null; }
        return (
          <PrestigeCeremony
            officer={o}
            titleId={c.titleId}
            color={playerForce?.color ?? '#e6c473'}
            year={date.year}
            onDone={acknowledgePrestigeCeremony}
          />
        );
      })()}
      {/* 晉牌封賞 ceremony — after bonds + 封號, on a clear map. */}
      {recentBonds.length === 0 && recentPrestigeCeremony.length === 0 && recentPromotions.length > 0 && !ceremonyBlocked && (() => {
        const c = recentPromotions[0];
        const o = officersForToast[c.officerId];
        if (!o) { acknowledgePromotion(); return null; }
        return (
          <PromotionCeremony
            officer={o}
            grade={c.grade}
            color={playerForce?.color ?? '#e6c473'}
            year={date.year}
            onDone={acknowledgePromotion}
          />
        );
      })()}
      <DialogueModal />
      {showSave && (
        <SaveSlotsModal
          mode={showSave}
          onClose={() => setShowSave(null)}
        />
      )}
      {!dayFlow && <EventModal />}
      <VictoryModal />
      {(victoryStatus === 'victory' || showEnding) && (
        <EndingsModal onClose={() => setShowEnding(false)} />
      )}
      <TutorialOverlay />
      <TutorialTasks />
      {/* Headless AI turns while the fullscreen battle view is down (fly-in
          delay or minimized to the diorama) — never alongside the screen's
          own driver. */}
      <BattleAIDriver active={!!tacticalBattle && !battleScreenUp} />
      {battleScreenUp && <TacticalBattleScreen />}
    </div>
  );
}

function BattleTheaterMount() {
  const queue = useGameStore((s) => s.pendingBattleTheaters);
  const lastReport = useGameStore((s) => s.lastReport);
  const dismiss = useGameStore((s) => s.dismissBattleTheater);
  // Only show after the season report has been dismissed.
  if (lastReport) return null;
  const next = queue[0];
  if (!next) return null;
  return <BattleTheaterModal battle={next} onClose={dismiss} />;
}

/**
 * AI 亲征 — once the season report and any abstract battle theaters are
 * cleared, pop the next AI-forced field clash into an interactive tactical
 * battle. The player commands their column; on resolution the next queued
 * clash (if any) follows.
 */
function FieldBattleMount() {
  const lastReport = useGameStore((s) => s.lastReport);
  const theaters = useGameStore((s) => s.pendingBattleTheaters);
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  const queueLen = useGameStore((s) => s.pendingFieldBattleQueue?.length ?? 0);
  const siegeQueueLen = useGameStore((s) => s.pendingSiegeDefenseQueue?.length ?? 0);
  const startNext = useGameStore((s) => s.startNextFieldBattle);
  const startNextSiege = useGameStore((s) => s.startNextSiegeDefense);
  useEffect(() => {
    if (lastReport || theaters.length > 0 || tacticalBattle) return;
    // Field clashes first, then any column at our gates (守城戰).
    if (queueLen > 0) { startNext(); return; }
    if (siegeQueueLen > 0) startNextSiege();
  }, [lastReport, theaters.length, tacticalBattle, queueLen, siegeQueueLen, startNext, startNextSiege]);
  return null;
}
