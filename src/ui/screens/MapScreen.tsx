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
import { CardRevealModal } from '../components/CardRevealModal';
import { YearbookModal } from '../components/YearbookModal';
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

/** Coarse-pointer / small-screen device — gets the bottom thumb dock. */
const IS_COARSE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

/** 拇指塢 — one bottom-dock button: icon over label, 44px+ touch target. */
function DockBtn({ icon, label, onClick, badge, primary }: {
  icon: string; label: string; onClick: () => void; badge?: number; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: primary ? 1.3 : 1, minHeight: 46, position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        background: primary ? 'rgba(212,168,74,0.18)' : 'transparent',
        border: `1px solid ${primary ? '#d4a84a' : 'rgba(255,255,255,0.10)'}`,
        color: primary ? '#f0d98a' : '#c8d2da', borderRadius: 'var(--tkm-radius)',
        fontFamily: 'var(--tkm-font-body)', cursor: 'pointer', padding: '0.2rem 0.2rem',
      }}
    >
      <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '0.68rem', letterSpacing: '0.05rem', whiteSpace: 'nowrap' }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: '18%', minWidth: 15, height: 15, borderRadius: 999,
          background: '#c0504a', color: '#fff', fontSize: '0.62rem', lineHeight: '15px', padding: '0 3px',
        }}>{badge}</span>
      )}
    </button>
  );
}
import { TutorialOverlay } from '../components/TutorialOverlay';
import { TutorialTasks } from '../components/TutorialTasks';
import { VictoryModal } from '../components/VictoryModal';
import { WishesModal } from '../components/WishesModal';
import { TacticalBattleScreen } from './TacticalBattleScreen';
import { ConquestPolicyModal } from '../components/ConquestPolicyModal';
import { BattleAIDriver } from '../components/BattleAIDriver';
import { HudMenu, type MenuEntry } from '../components/HudMenu';
import { THEMES, getStoredTheme, applyTheme, type ThemeId } from '../theme';
import { getStoredUiPrefs, patchUiPrefs } from '../uiPrefs';
import { useT, useLanguage } from '../i18n';
import { Modal } from '../components/Modal';
import { OfficerPortrait } from '../components/OfficerPortrait';
import { COMMAND_DEFS } from '../../game/systems/commands';
import type { City, InternalAffairsType, Officer } from '../../game/types';
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
  const lang = useLanguage();
  // 委派錄 — after ⚡一鍵委派, a summary card of who went where doing what
  // (the old toast only said "N officers assigned").
  const [assignReport, setAssignReport] = useState<Array<{ officer: Officer; city: City; type: InternalAffairsType }> | null>(null);
  const [assignGold, setAssignGold] = useState(0);
  const runAutoAssign = () => {
    const r = autoAssignIdle();
    if (r.assigned === 0) return;
    const s = useGameStore.getState();
    const rows = r.details
      .map((d) => ({ officer: s.officers[d.officerId], city: s.cities[d.cityId], type: d.type }))
      .filter((x): x is { officer: Officer; city: City; type: InternalAffairsType } => !!x.officer && !!x.city);
    setAssignGold(r.goldSpent);
    setAssignReport(rows);
  };
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
  // 窄欄 — below ~tablet width the seven top-bar dropdowns collapse into one
  // 選單 (900px: with all seven triggers + info blocks the bar starts to
  // scroll around 1100, and by 900 scrolling is constant).
  const [narrowBar, setNarrowBar] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const on = (e: MediaQueryListEvent) => setNarrowBar(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // 沉浸模式 — three independently-collapsible chrome groups so a landscape
  // phone can go full-screen on the 3D map: the top bar (hideNav), the phone
  // bottom thumb dock (hideDock) and the city side panel (hidePanel). Each has
  // its own edge handle; a floating ⛶ master toggle flips all three at once.
  // Persisted in uiPrefs. The R3F <Canvas> owns a ResizeObserver, so the map
  // reflows to fill on its own when a slot collapses — no map-side wiring.
  const [hideNav, setHideNav] = useState(() => getStoredUiPrefs().hideNav);
  const [hideDock, setHideDock] = useState(() => getStoredUiPrefs().hideDock);
  const [hidePanel, setHidePanel] = useState(() => getStoredUiPrefs().hideSidePanel);
  const applyHideNav = (v: boolean) => { setHideNav(v); patchUiPrefs({ hideNav: v }); };
  const applyHideDock = (v: boolean) => { setHideDock(v); patchUiPrefs({ hideDock: v }); };
  const applyHidePanel = (v: boolean) => { setHidePanel(v); patchUiPrefs({ hideSidePanel: v }); };
  // 全隱 = master is "on". The dock only exists on a coarse pointer, so it only
  // counts toward the shown/hidden tally there.
  const anyChromeShown = !hideNav || !hidePanel || (IS_COARSE && !hideDock);
  const immersive = !anyChromeShown;
  // Master toggle: anything showing → hide it all; fully hidden → bring it back.
  const toggleImmersive = () => {
    const next = anyChromeShown;
    applyHideNav(next);
    applyHideDock(next);
    applyHidePanel(next);
    playSfx('click');
  };
  // 首次橫屏一次性提示 — the immersive ⛶ is easy to miss, so on a phone the very
  // first time we're in landscape we point it out once (localStorage-gated).
  const [immersiveHint, setImmersiveHint] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !IS_COARSE) return;
    try { if (localStorage.getItem('tkm-immersive-hinted')) return; } catch { return; }
    const mq = window.matchMedia('(orientation: landscape)');
    let timer = 0;
    const maybeHint = () => {
      if (!mq.matches) return;
      const p = getStoredUiPrefs();
      if (p.hideNav && p.hideSidePanel) return; // already living in immersive
      setImmersiveHint(true);
      try { localStorage.setItem('tkm-immersive-hinted', '1'); } catch { /* private mode */ }
      timer = window.setTimeout(() => setImmersiveHint(false), 6000);
      mq.removeEventListener('change', maybeHint);
    };
    maybeHint();
    mq.addEventListener('change', maybeHint);
    return () => { mq.removeEventListener('change', maybeHint); if (timer) window.clearTimeout(timer); };
  }, []);
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
  const beginDayFlow = useGameStore((s) => s.beginDayFlow);
  const dayFlowFollow = useGameStore((s) => s.dayFlowFollow);
  const setDayFlowFollow = useGameStore((s) => s.setDayFlowFollow);
  const engageEncounter = useGameStore((s) => s.engageEncounter);
  // 真日級親征 — a fired, not-yet-fought, player-involved encounter while
  // the flow is paused ⇒ offer to fight it RIGHT NOW.
  const engageable = useGameStore((s) => {
    if (!s.dayFlow || s.dayFlow.playing || s.tacticalBattle) return false;
    const pf = s.playerForceId;
    if (!pf) return false;
    return (s.dayFlow.encounters ?? []).some((e) => e.fired && !e.fought
      && (s.armies[e.aId]?.forceId === pf || s.armies[e.bId]?.forceId === pf)
      && !!s.armies[e.aId] && !!s.armies[e.bId]);
  });
  // 本旬結算本體 — the flow's day 15 (or a flow-less advance) lands here.
  const commitTurn = () => {
    if (hotSeatPlayers.length > 1) {
      if (hotSeatActiveIndex === hotSeatPlayers.length - 1) endSeason();
      cycleHotSeat();
    } else {
      endSeason();
    }
  };
  useEffect(() => {
    if (!dayFlow?.playing) return;
    const iv = setInterval(() => {
      const df = useGameStore.getState().dayFlow;
      if (!df) { clearInterval(iv); return; }
      if (df.day + 1 >= df.total) {
        // 第 15 日 — the month closes: NOW the sim resolves (battles, reports).
        clearInterval(iv);
        dayFlowSkip();
        commitTurn();
        return;
      }
      dayFlowTick();
    }, 420 / (dayFlow.speed || 1));
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFlow?.playing, dayFlow?.speed, dayFlow?.key]);

  const advanceTurn = () => {
    playSfx('horn');
    // 日流(前置)— with columns on the road, the half-month WALKS first
    // (pause mid-way and reroute: the order genuinely lands this turn);
    // resolution fires at day 15. Hot-seat/observe/empty roads skip straight.
    // Read fresh store state — this closure is held by a once-bound keydown
    // handler, so hook-captured values here would be stale (day-flow would
    // never trigger from the space bar).
    const live = useGameStore.getState();
    if (hotSeatPlayers.length <= 1 && live.playerForceId
        && Object.keys(live.armies ?? {}).length > 0 && !live.dayFlow) {
      beginDayFlow();
      return;
    }
    commitTurn();
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
      // 觀日行軍 — with columns on the road the spectator month WALKS too:
      // start the day flow (the flow driver above commits at day 15; no
      // player force, so nothing pauses it). Otherwise commit straight.
      if (s.dayFlow) return;   // a month is already walking
      if (Object.keys(s.armies ?? {}).length > 0) {
        s.beginDayFlow();
        s.dayFlowSetSpeed(simSpeed * 2, false);   // brisker gait; don't clobber the player's saved pace
        return;
      }
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
      // 鬆綁 — the palette stays reachable while a report/event modal is up
      // (it opens VIEW panels, which are safe under either); only a battle,
      // the city interior or a finished campaign truly own the keyboard.
      const paletteBlocked = s.cityMapOpen || !!s.tacticalBattle || s.victoryStatus !== 'playing';
      // 命令臺 — / or ⌘K/Ctrl-K opens the command palette.
      if (!typing && !paletteBlocked && (e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')))) {
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
      { id: 'autoassign', zh: '一鍵委派閒置武將', en: 'Auto-assign idle officers', hint: g.act, run: () => runAutoAssign() },
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
      { id: 'relations', zh: '形勢一覽 — 邦交矩陣', en: 'Standings matrix', hint: g.diplo, run: () => setShowRelations(true) },
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

  // ── 頂欄下拉 — cut by intent: 治國 / 兵事 / 邦交 / 朝儀 / 人 / 翻閱.
  // Declared once so the wide bar (seven triggers) and the narrow bar
  // (one merged 選單) render the same entries.
  const hudMenus: { label: string; title: string; items: MenuEntry[] }[] = [
    {
      label: t('內政', 'Domestic'),
      title: t('內政 — 郡縣、輜重、度支、賑災', 'Domestic — cities, convoys, treasury, relief'),
      items: [
        { label: t('郡縣', 'Cities'),    onClick: () => setShowCityRoster(true), title: t('全境城池一覽 — 排序、跳轉', 'Every city at a glance — sort & jump') },
        { label: t('州域', 'Provinces'), onClick: () => setShowProvinces(true), title: t('各州控勢與州牧', 'Provincial control & governors') },
        { label: t('輜重', 'Convoys'),   onClick: () => setShowConvoys(true), title: t('在途運輸與常運糧道一覽', 'Columns on the road & standing routes') },
        { label: t('度支', 'Treasury'),  onClick: () => setShowBudget(true), title: t('全國收支簿 — 稅入/俸祿/軍費', 'Realm budget — income & upkeep') },
        { label: t('賑災', 'Relief'),    onClick: () => setShowRelief(true), badge: pendingReliefCount, title: t('開倉賑濟受災城池', 'Open granaries for stricken cities') },
        { label: t('待辦', 'To-Do'),     onClick: () => setShowToDo(true), title: t('本旬該辦之事的提醒清單', 'Reminders for this turn') },
      ],
    },
    {
      label: t('軍務', 'Military'),
      title: t('軍務 — 軍團、計略、演武場、武備', 'Military — legions, schemes, arenas, armoury'),
      items: [
        { label: t('錦囊', 'Advisor'),    onClick: () => setShowAdvisor(true), title: t('軍師建議 — 當下最值得做的事', "Advisor — what's worth doing now") },
        { label: t('軍團', 'Legions'),    onClick: () => setShowLegions(true), title: t('委任軍團 — 都督自主征伐', 'Delegated legions under a marshal') },
        { label: t('陣形', 'Formations'), onClick: () => setShowFormations(true), title: t('演練與指派會戰陣形', 'Drill & assign battle formations') },
        { label: t('私兵', 'Guard'),      onClick: () => setShowPrivateForces(true), title: t('武將部曲 — 私兵編制', "Officers' private retinues") },
        { label: t('計略', 'Schemes'),    onClick: () => setShowSchemes(true), title: t('離間/流言/疑兵等謀略', 'Sow discord, rumors, feints…') },
        { label: t('密偵', 'Espionage'),  onClick: () => setShowEspionage(true), title: t('細作網絡與反間', 'Spy networks & counter-intel') },
        { header: t('演武場', 'Arenas') },
        { label: t('演武', 'Sparring'),   onClick: () => setShowTraining(true), title: t('武將切磋練級,不傷和氣', 'Sparring bouts — XP, no blood') },
        { label: t('比武', 'Tournament'), onClick: () => setShowTournament(true), title: t('比武大會 — 奪魁揚名', 'Martial tournament') },
        { label: t('論辯', 'Debate'),     onClick: () => setShowDebateGround(true), title: t('舌戰論辯 — 以智服人', 'Debate hall — win with wits') },
        { label: t('武鬥館', 'Hall'),     onClick: () => setShowDuelHall(true), title: t('3D 單挑武鬥館', '3D duel hall') },
        { header: t('武備', 'Smithy') },
        { label: t('寶物', 'Armoury'),    onClick: () => setShowArmoury(true), title: t('寶物庫 — 授予/回收裝備', 'Armoury — grant & reclaim gear') },
        { label: t('鍛造', 'Forge'),      onClick: () => setShowForge(true), title: t('鍛造/精煉/鑲嵌裝備', 'Forge, refine & socket gear') },
      ],
    },
    {
      label: t('外交', 'Diplomacy'),
      title: t('外交 — 邦交、形勢一覽、關係図', 'Diplomacy — relations, standings, graph'),
      items: [
        { label: t('邦交', 'Relations'),     onClick: () => setShowDiplomacy(true), title: t('結盟/停戰/歲幣等外交指令', 'Alliances, truces, tribute…') },
        { label: t('形勢一覽', 'Standings'), onClick: () => setShowRelations(true), title: t('勢力 × 勢力關係矩陣', 'Force × force relation matrix') },
        { label: t('關係図', 'Graph'),       onClick: () => setShowDipGraph(true), title: t('邦交關係圖(節點圖)', 'Diplomacy as a node graph') },
      ],
    },
    {
      label: t('朝堂', 'Court'),
      title: t('朝堂 — 任官、州牧、考課、朝廷、祭祀', 'Court — appointments, governors, reviews, edicts, rites'),
      items: [
        { label: t('任官', 'Titles'),    onClick: () => setShowTitles(true), title: t('授予官職與稱號', 'Grant offices & titles') },
        { label: t('州牧', 'Governors'), onClick: () => setShowGovernors(true), title: t('委任州牧,分州而治', 'Appoint provincial governors') },
        { label: t('考課', 'Reviews'),   onClick: () => setShowKaoke(true), title: t('太守/州牧政績考評', 'Governor performance reviews') },
        { label: t('朝廷', 'Court'),     onClick: () => setShowCourt(true), title: t('天子朝廷 — 黨爭/上表/禪讓', 'The imperial court — factions & edicts') },
        { label: t('祭祀', 'Rites'),     onClick: () => setShowRites(true), title: t('郊祀/祈雨/招安/宣撫', 'Rites, rain prayers, pacification') },
      ],
    },
    {
      label: t('人才', 'Personnel'),
      title: t('人才 — 因緣、武功、書信、列傳', 'Personnel — bonds, deeds, letters, biographies'),
      items: [
        { label: t('因緣', 'Relations'), onClick: () => setShowRelationships(true), title: t('武將間的恩怨情仇網', 'Officer relationship web') },
        { label: t('結義', 'Bonds'),     onClick: () => setShowBonds(true), title: t('桃園結義 — 義兄弟與師徒', 'Sworn bonds & mentorships') },
        { label: t('威名', 'Prestige'),  onClick: () => setShowPrestige(true), title: t('武將聲望與威名稱號', 'Officer renown & epithets') },
        { label: t('武功', 'Deeds'),     onClick: () => setShowDeeds(true), title: t('斬將/奪城等功業記錄', 'Feats — duels won, cities taken…') },
        { label: t('書信', 'Letters'),   onClick: () => setShowWishes(true), badge: wishes.length, title: t('武將心願與請命書信', "Officers' wishes & petitions") },
        { label: t('名將榜', 'Hall of Fame'), onClick: () => setShowHallOfFame(true), title: t('本局名將排行榜', "This campaign's hall of fame") },
        { label: t('列傳', 'Wiki'),      onClick: () => setShowEncyclopedia(true), title: t('人物列傳百科', 'Officer biographies') },
        ...(careerMode
          ? [{ label: t('一代記', 'Chronicle'), onClick: () => setShowCareer(true), title: t('你這一代武將的生涯記', 'Your career chronicle') }]
          : []),
      ],
    },
    {
      label: t('記錄', 'Records'),
      title: t('記錄 — 情勢、戰功、典籍', 'Records — standings, war record, chronicles'),
      items: [
        { header: t('情勢', 'Standings') },
        { label: t('大勢', 'Powers'),    onClick: () => setShowPowerGraph(true), title: t('天下大勢曲線 — 勢力消長', 'Balance-of-power graph') },
        { label: t('較量', 'Compare'),   onClick: () => setShowCompare(true), title: t('與他國並列比較國力', 'Side-by-side force comparison') },
        { label: t('市井', 'Rumors'),    onClick: () => setShowRumors(true), title: t('市井流言 — 天下風聞', 'Street rumors from across the realm') },
        { header: t('戰功', 'War Record') },
        { label: t('戰史', 'Battles'),   onClick: () => setShowHistory(true), title: t('歷次會戰戰報', 'Past battle reports') },
        { label: t('戰錄', 'Replays'),   onClick: () => setShowReplays(true), title: t('會戰回放存檔', 'Saved battle replays') },
        { label: t('勳功', 'Achievements'), onClick: () => setShowAch(true), title: t('成就勳功', 'Achievements') },
        { label: t('戰記', 'Stats'),        onClick: () => setShowCampaignStats(true), title: t('本局統計數據', 'Campaign statistics') },
        { header: t('典籍', 'Chronicles') },
        { label: t('史書', 'Annals'),    onClick: () => setShowHistoryBook(true), title: t('編年史書 — 大事記', 'The chronicle of events') },
        { label: t('📜 國史', '📜 Chronicle'), onClick: () => setShowChronicle(true), title: t('攻城/工程等勝敗回顧', 'Sieges & works, reviewed') },
        { label: t('☄ 災異志', '☄ Portents'), onClick: () => setShowAnnals(true), title: t('天象災異編年誌', 'Annals of portents & disasters') },
        { label: t('概念', 'Concepts'),     onClick: () => setShowGlossary(true), title: t('機制詞條字典', 'Mechanics glossary') },
      ],
    },
  ];

  return (
    <div className={styles.root}>
      <div className={`${styles.topBarSlot} ${hideNav ? styles.topBarSlotHidden : ''}`}>
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
            className={`${styles.season} ${styles.aux}`}
            title={t(`天候 — 影響火攻與行軍速度。風力:${weather.windPower}。`, `Weather affects fire attacks and march speed. Wind power: ${weather.windPower}.`)}
            style={{ color: '#9aa6b0' }}
          >
            {weatherZh}·{windZh}
          </span>
          <span
            className={`${styles.season} ${styles.aux}`}
            title={t(`天命:${mandate}/100 — 影響徵募與叛亂風險。`, `Heaven's Mandate: ${mandate}/100. Affects recruitment and rebellion risk.`)}
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
              <span className={`${styles.playerNameEn} ${styles.aux}`}>{t('', playerForce.name.en)}</span>
              <span style={{ marginLeft: 10, fontSize: '0.82rem', color: '#d6dde4', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 11 }}>
                <span className={goldLow ? 'tkm-threat-chip' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 'var(--tkm-radius-sm)', padding: goldLow ? '0 3px' : undefined, color: goldLow ? '#e0707a' : undefined }} title={goldLow ? t('國庫見底!', 'Treasury empty!') : t('金', 'Gold')}><Icon name="gold" size={13} color={goldLow ? '#e0707a' : '#e6c473'} /><AnimatedNumber value={playerGold} flash /></span>
                <span className={foodLow ? 'tkm-threat-chip' : undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 'var(--tkm-radius-sm)', padding: foodLow ? '0 3px' : undefined, color: foodLow ? '#e0707a' : undefined }} title={foodLow ? t('糧倉見底!', 'Granary empty!') : t('糧', 'Grain')}><Icon name="grain" size={13} color={foodLow ? '#e0707a' : '#d8c88a'} /><AnimatedNumber value={playerFood} flash /></span>
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
        {!narrowBar && (
          <>
            <button
              className={styles.forcesButton}
              onClick={() => setShowOfficers(true)}
            >
              {t('武將', 'Officers')}
            </button>
            <button
              className={styles.forcesButton}
              onClick={() => setShowForces(true)}
            >
              {t('群雄', 'Forces')}
            </button>
            {hudMenus.map((m) => (
              <HudMenu key={m.label} label={m.label} title={m.title} items={m.items} />
            ))}
            {/* ／命令臺 — the fastest path to everything; surface the hotkey. */}
            <button
              className={styles.forcesButton}
              onClick={() => setShowPalette(true)}
              title={t('命令臺 — 按 / 或 ⌘K,直搜全部功能', 'Command palette — press / or ⌘K to search every screen')}
              style={{ fontFamily: 'var(--tkm-font-mono)', padding: '0.35rem 0.55rem' }}
            >
              ／
            </button>
          </>
        )}
        {/* 窄欄 — one merged 選單 replaces the seven dropdowns; section
            headers keep the same grouping, it only folds. */}
        {narrowBar && (
          <HudMenu
            label={t('選單', 'Menu')}
            title={t('全部功能', 'All screens')}
            items={[
              { label: t('武將', 'Officers'), onClick: () => setShowOfficers(true) },
              { label: t('群雄', 'Forces'),   onClick: () => setShowForces(true) },
              ...hudMenus.flatMap((m): MenuEntry[] => [{ header: m.label }, ...m.items]),
            ]}
          />
        )}
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
                      borderRadius: 'var(--tkm-radius-xs)',
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
                    padding: '0.2rem 0.5rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
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
                onClick={runAutoAssign}
                title={t('一鍵委派 — 依城所需與才能,自動派遣全部閒置武將', 'Auto-assign all idle officers by city need & aptitude')}
                style={{
                  marginRight: 8, cursor: 'pointer',
                  background: 'rgba(126,214,138,0.16)', border: '1px solid #6fae73',
                  color: '#9ad6a8', padding: '0.2rem 0.55rem', borderRadius: 'var(--tkm-radius-sm)',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem', whiteSpace: 'nowrap',
                }}
              >
                ⚡ {t('委派', 'Assign')}
              </button>
            )}
            <button
              className={styles.advanceButton}
              onClick={advanceTurn}
              title={t('過旬結算 — 空格亦可', 'Resolve the turn — Space works too')}
            >
              {hotSeatPlayers.length > 1
                ? t(`結束 ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? '回合'} →`,
                    `End ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? 'Turn'} →`)
                : t(`下旬 ${monthNum}月${phaseInfo.zh} →`,
                    `End ${monthNum}m ${phaseInfo.zh} →`)}
            </button>
          </>
        )}
        {/* 收起頂欄 — tuck the bar (and phone dock) away for a taller map. */}
        <button
          className={styles.navHideChevron}
          onClick={() => applyHideNav(true)}
          title={t('收起頂欄 — 只看地圖(頂部把手可喚回)', 'Hide the top bar — pull it back from the top handle')}
          aria-label={t('收起頂欄', 'Hide top bar')}
        >▴</button>
      </header>
      </div>

      <main className={`${styles.main} ${immersive ? styles.mainImmersive : ''}`}>
        <div className={styles.mapWrap} style={{ position: 'relative' }}>
          {/* Free the strategic map's WebGL context while the fullscreen battle
              (单挑 / 舌战 / 会战) sits opaque on top of it. Two live three.js
              contexts at once is what tips mobile browsers into an out-of-memory
              tab reload — which drops the player back to the map mid-fight and
              forces a re-出阵. Minimizing the battle to its map diorama clears
              battleScreenUp, so the map remounts and 观战 still works. */}
          {!battleScreenUp && <Suspense fallback={null}><StrategicMap3D /></Suspense>}
          {/* In-transit armies overview — shown over both map modes. Sits
              below the objective card (top-left, ~top:12–110); the beacon
              column above it (z:20) stays on top when both are present. */}
          <div style={{ position: 'absolute', left: 8, top: 118, zIndex: 15 }}>
            <ArmiesPanel />
          </div>
          {/* 新手五事 — anchored over the map's right edge (inside the
              positioned mapWrap) so it never covers the city panel's tabs. */}
          <TutorialTasks />
          {/* 沉浸總開關 — lives in the map's top-right corner (tracks the map
              area, so it sits below the bar and left of the panel when they're
              shown, and reaches the screen corner when they're not). */}
          {!battleScreenUp && (
            <button
              className={`${styles.masterToggle} ${immersive ? styles.masterToggleOn : ''}`}
              onClick={toggleImmersive}
              title={immersive
                ? t('退出沉浸 — 顯示頂欄與側欄', 'Exit immersive — show the bar & panel')
                : t('沉浸模式 — 隱藏介面,只看全屏地圖', 'Immersive — hide the UI for a full-screen map')}
              aria-label={immersive ? t('退出沉浸', 'Exit immersive') : t('沉浸模式', 'Immersive mode')}
              aria-pressed={immersive}
            >⛶</button>
          )}
          {/* 首次橫屏提示 — a one-shot nudge hanging under the ⛶ toggle. */}
          {immersiveHint && !immersive && !battleScreenUp && (
            <button
              className={styles.immersiveHint}
              onClick={() => { setImmersiveHint(false); toggleImmersive(); }}
            >{t('⛶ 點此全屏看地圖', '⛶ Tap for a full-screen map')}</button>
          )}
        </div>
        <div className={`${styles.panelSlot} ${hidePanel ? styles.panelSlotHidden : ''}`}>
          <CityPanel />
        </div>
      </main>

      {/* 季度過場 — washes a season card over the realm when 春→夏→秋→冬 turns,
          settling just above the season report it then reveals. */}
      <SeasonTransition />
      {/* 日流控制條 — day counter + pause/speed/skip while the turn plays out. */}
      {dayFlow && (
        <div style={{
          position: 'fixed', bottom: 'calc(4.6rem + var(--tkm-safe-bottom))', left: '50%', transform: 'translateX(-50%)',
          zIndex: 640, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(16, 22, 30, 0.92)', border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius)',
          padding: '0.3rem 0.7rem', color: '#f0d98a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t(`第 ${dayFlow.day + 1} 日 / ${dayFlow.total}`, `Day ${dayFlow.day + 1} / ${dayFlow.total}`)}</span>
          <button onClick={dayFlowTogglePause} style={{ background: 'transparent', border: '1px solid #d4a84a', color: '#f0d98a', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', padding: '0.1rem 0.5rem', fontFamily: 'inherit' }}>
            {dayFlow.playing ? '⏸' : '▶'}
          </button>
          {[1, 2, 4].map((sp) => (
            <button key={sp} onClick={() => dayFlowSetSpeed(sp)} style={{
              background: dayFlow.speed === sp ? 'rgba(212,168,74,0.25)' : 'transparent',
              border: `1px solid ${dayFlow.speed === sp ? '#d4a84a' : '#4a5568'}`,
              color: dayFlow.speed === sp ? '#f0d98a' : '#97a4ae', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', padding: '0.1rem 0.4rem', fontFamily: 'inherit', fontSize: '0.78rem',
            }}>{sp}×</button>
          ))}
          {engageable && (
            <button
              onClick={() => { playSfx('wardrum'); engageEncounter(); }}
              title={t('親征 — 就在相遇之日開打;勝負即時寫回,餘日繼續行軍', 'Engage NOW — fight on the day you met; the verdict writes back and the march goes on')}
              style={{
                background: 'rgba(224,85,42,0.22)', border: '1px solid #e0552a',
                color: '#ffb09a', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
                padding: '0.1rem 0.55rem', fontFamily: 'inherit', fontWeight: 'bold',
              }}
            >⚔ {t('迎戰', 'Engage')}</button>
          )}
          <button
            onClick={() => setDayFlowFollow(!dayFlowFollow)}
            title={t('跟拍 — 鏡頭隨主力縱隊行進', 'Follow — camera rides your lead column')}
            style={{
              background: dayFlowFollow ? 'rgba(212,168,74,0.25)' : 'transparent',
              border: `1px solid ${dayFlowFollow ? '#d4a84a' : '#4a5568'}`,
              color: dayFlowFollow ? '#f0d98a' : '#97a4ae', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', padding: '0.1rem 0.45rem', fontFamily: 'inherit',
            }}
          >📍</button>
          <button
            onClick={() => { dayFlowSkip(); commitTurn(); }}
            title={t('跳過日播,直接結算本旬', 'Skip the days, resolve the turn now')}
            style={{ background: 'transparent', border: '1px solid #4a5568', color: '#97a4ae', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', padding: '0.1rem 0.5rem', fontFamily: 'inherit' }}
          >⏭</button>
        </div>
      )}
      {/* 拇指塢 — phone-only bottom dock: the five actions a thumb reaches
          for every turn. Desktop keeps the top bar it already has. Collapses on
          its own (hideDock) or with the master ⛶; a ▴ tab pulls it back. */}
      {IS_COARSE && !observing && !battleScreenUp && !hideDock && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 630,
          display: 'flex', alignItems: 'stretch', gap: 6,
          padding: '0.35rem 0.55rem calc(0.35rem + var(--tkm-safe-bottom))',
          background: 'linear-gradient(180deg, rgba(14,18,22,0.88), rgba(10,14,18,0.97))',
          borderTop: '1px solid var(--tkm-border-gold)', backdropFilter: 'blur(8px)',
        }}>
          {/* 收起拇指塢 — a slim grip on the dock's top edge. */}
          <button
            className={styles.dockHideTab}
            onClick={() => applyHideDock(true)}
            title={t('收起底部快捷列', 'Hide the bottom dock')}
            aria-label={t('收起底部快捷列', 'Hide bottom dock')}
          >▾</button>
          <DockBtn icon="⚔" label={t('武將', 'Officers')} onClick={() => setShowOfficers(true)} />
          <DockBtn icon="🏯" label={t('郡縣', 'Cities')} onClick={() => setShowCityRoster(true)} />
          <DockBtn icon="⚡" label={t('委派', 'Assign')} onClick={runAutoAssign} badge={idleCount} />
          <DockBtn icon="📋" label={t('待辦', 'To-Do')} onClick={() => setShowToDo(true)} />
          <DockBtn primary icon="▶" label={t(`下旬 ${monthNum}月${phaseInfo.zh}`, `Next`)} onClick={advanceTurn} />
        </nav>
      )}
      {/* 拇指塢復原把手 — a ▴ tab at the bottom edge when the dock is tucked. */}
      {IS_COARSE && !observing && !battleScreenUp && hideDock && (
        <button
          className={styles.dockShowTab}
          onClick={() => applyHideDock(false)}
          title={t('顯示底部快捷列', 'Show the bottom dock')}
          aria-label={t('顯示底部快捷列', 'Show bottom dock')}
        >▴</button>
      )}
      {/* 沉浸邊緣把手 — independent of the master toggle: pull the top bar back
          down from the top edge, and slide the side panel in/out from the right
          edge, each on its own. Hidden while a full-screen battle is up. */}
      {!battleScreenUp && hideNav && (
        <button
          className={styles.navShowTab}
          onClick={() => applyHideNav(false)}
          title={t('顯示頂欄', 'Show the top bar')}
          aria-label={t('顯示頂欄', 'Show top bar')}
        >▾</button>
      )}
      {!battleScreenUp && (
        <button
          className={styles.panelTab}
          onClick={() => applyHidePanel(!hidePanel)}
          title={hidePanel ? t('拉出側欄', 'Show the side panel') : t('收起側欄', 'Hide the side panel')}
          aria-label={hidePanel ? t('拉出側欄', 'Show side panel') : t('收起側欄', 'Hide side panel')}
          aria-pressed={!hidePanel}
        >{hidePanel ? '‹' : '›'}</button>
      )}
      {/* 日流播放時,季報壓後 — the report pops once the days finish walking. */}
      {!dayFlow && (
        <ErrorBoundary fallbackLabel="Season report panel crashed">
          <SeasonReportModal />
        </ErrorBoundary>
      )}
      <ErrorBoundary fallbackLabel="Battle theater crashed">
        <BattleTheaterMount />
        <FieldBattleMount />
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
        {showToDo && <ToDoModal onClose={() => setShowToDo(false)} onOpenLetters={() => setShowWishes(true)}
          onOpenFeature={(id) => {
            // 探索建議 — the To-Do nudges route into the real feature panels.
            if (id === 'schemes') setShowSchemes(true);
            else if (id === 'espionage') setShowEspionage(true);
            else if (id === 'rites') setShowRites(true);
            else if (id === 'annals') setShowAnnals(true);
            else if (id === 'forge') setShowForge(true);
            else if (id === 'tournament') setShowTournament(true);
            else if (id === 'debate-ground') setShowDebateGround(true);
          }} />}
        {showPalette && <CommandPalette commands={paletteCommands} onClose={() => setShowPalette(false)} />}
        {showCompare && <ForceCompareModal onClose={() => setShowCompare(false)} />}
        {showRumors && <RumorsModal onClose={() => setShowRumors(false)} />}
        {showProvinces && <ProvinceModal onClose={() => setShowProvinces(false)} />}
        {showConvoys && <ConvoyModal onClose={() => setShowConvoys(false)} />}
      </Suspense>
      {/* 委派錄 — who ⚡一鍵委派 sent where, grouped by city. */}
      {assignReport && (
        <Modal
          onClose={() => setAssignReport(null)}
          title={t('委派錄', 'Assignments')}
          icon="⚡"
          badge={t(`${assignReport.length} 員 · 耗金 ${assignGold}`, `${assignReport.length} officers · −${assignGold}g`)}
          width="min(430px, 100%)"
          maxHeight="72vh"
          scrollBody
        >
          {(() => {
            const byCity = new Map<string, typeof assignReport>();
            for (const row of assignReport) {
              const arr = byCity.get(row.city.id) ?? [];
              arr.push(row);
              byCity.set(row.city.id, arr);
            }
            return [...byCity.values()].map((rows) => (
              <div key={rows[0].city.id} style={{ marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#e6c473', letterSpacing: '0.08rem', marginBottom: 4, borderBottom: '1px solid #1d2731', paddingBottom: 3 }}>
                  {lang === 'en' ? rows[0].city.name.en : rows[0].city.name.zh}
                </div>
                {rows.map((r) => {
                  const def = COMMAND_DEFS[r.type];
                  return (
                    <div key={r.officer.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.18rem 0', fontSize: '0.8rem', color: '#cdd6df' }}>
                      <OfficerPortrait officer={r.officer} size={24} />
                      <span style={{ flex: 1 }}>{lang === 'en' ? r.officer.name.en : r.officer.name.zh}</span>
                      <span style={{ color: '#9ab87a' }}>▸ {def ? (lang === 'en' ? def.label.en : def.label.zh) : r.type}</span>
                      <span style={{ color: '#7a8893', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', minWidth: 38, textAlign: 'right' }}>
                        {(def?.goldCost ?? 0) > 0 ? `${def?.goldCost}g` : t('免費', 'free')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </Modal>
      )}
      {/* 戰略層回饋 — order-confirmation toasts, top-centre */}
      <ActionToasts />
      {/* 慶典彈窗 — celebratory image/video on milestones (升城/遷都…) */}
      <CelebrationPopup />
      {/* 得將開卡 — gold-or-better newcomers flip in as a trading card */}
      <CardRevealModal />
      {/* 史官年鑑 — the historian's page for the year just closed (springs) */}
      <YearbookModal />
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
            zIndex: 985, // Z.toast — 蓋過教學浮層(見 ui/zIndex.ts 層級表)
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
            zIndex: 985, // Z.toast — 蓋過教學浮層(見 ui/zIndex.ts 層級表)
            boxShadow: '0 0 14px rgba(193, 154, 59, 0.4)',
            animation: 'tkmFadeIn 0.4s ease-out',
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1rem', color: '#c9a64e' }}>
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
            zIndex: 985, // Z.toast — 蓋過教學浮層(見 ui/zIndex.ts 層級表)
            boxShadow: '0 0 14px rgba(217, 106, 74, 0.4)',
            animation: 'tkmFadeIn 0.4s ease-out',
            maxWidth: 280,
          }}
        >
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.1rem', color: '#d96a4a' }}>
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
      {/* Headless AI turns while the fullscreen battle view is down (fly-in
          delay or minimized to the diorama) — never alongside the screen's
          own driver. */}
      <BattleAIDriver active={!!tacticalBattle && !battleScreenUp} />
      {battleScreenUp && <TacticalBattleScreen />}
      {/* 入城三選 — surfaces once the stormed city's battle screen closes. */}
      {!tacticalBattle && <ConquestPolicyModal />}
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
