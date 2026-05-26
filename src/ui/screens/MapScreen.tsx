import { lazy, Suspense, useState } from 'react';
import { playSfx } from '../../game/systems/sound';
import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL, MONTH_PHASE_LABEL, firstMonthOfSeason } from '../../game/types';
import { WEATHER_LABEL, WIND_LABEL } from '../../game/systems/weather';
import { MANDATE_LABEL } from '../../game/systems/mandate';
import { CityPanel } from '../components/CityPanel';
import { BondsModal } from '../components/BondsModal';
import { RelationshipBrowserModal } from '../components/RelationshipBrowserModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SettingsModal } from '../components/SettingsModal';
import { CareerModal } from '../components/CareerModal';
import { DialogueModal } from '../components/DialogueModal';
import { ObjectivePanel } from '../components/ObjectivePanel';
import { CourtModal } from '../components/CourtModal';
import { DiplomacyModal } from '../components/DiplomacyModal';
import { EndingsModal } from '../components/EndingsModal';
import { EventModal } from '../components/EventModal';
import { ForcesOverview } from '../components/ForcesOverview';
import { OfficersTab } from '../components/OfficersTab';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { SeasonReportModal } from '../components/SeasonReportModal';
import { BattleTheaterModal } from '../components/BattleTheaterModal';
import { StrategicMap } from '../components/StrategicMap';
import { StrategicMap3D } from '../components/StrategicMap3D';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { VictoryModal } from '../components/VictoryModal';
import { WishesModal } from '../components/WishesModal';
import { TacticalBattleScreen } from './TacticalBattleScreen';
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
const DeedsModal = lazy(() => import('../components/DeedsModal').then(m => ({ default: m.DeedsModal })));
const ForgingModal = lazy(() => import('../components/ForgingModal').then(m => ({ default: m.ForgingModal })));
const DiplomacyGraphModal = lazy(() => import('../components/DiplomacyGraphModal').then(m => ({ default: m.DiplomacyGraphModal })));
const EncyclopediaModal = lazy(() => import('../components/EncyclopediaModal').then(m => ({ default: m.EncyclopediaModal })));
const EspionageModal = lazy(() => import('../components/EspionageModal').then(m => ({ default: m.EspionageModal })));
const TitlesModal = lazy(() => import('../components/TitlesModal').then(m => ({ default: m.TitlesModal })));
const GovernorsModal = lazy(() => import('../components/GovernorsModal').then(m => ({ default: m.GovernorsModal })));
const FormationsModal = lazy(() => import('../components/FormationsModal').then(m => ({ default: m.FormationsModal })));

export function MapScreen() {
  const [use3DMap, setUse3DMap] = useState(true);
  const t = useT();
  const [showForces, setShowForces] = useState(false);
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showOfficers, setShowOfficers] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showArmoury, setShowArmoury] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [showEspionage, setShowEspionage] = useState(false);
  const [showCourt, setShowCourt] = useState(false);
  const [showSave, setShowSave] = useState<'save' | 'load' | null>(null);
  const [showFormations, setShowFormations] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme());
  const handleSetTheme = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
  };
  const [showWishes, setShowWishes] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [showReplays, setShowReplays] = useState(false);
  const [showDeeds, setShowDeeds] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showDipGraph, setShowDipGraph] = useState(false);
  const [showCareer, setShowCareer] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const [showGovernors, setShowGovernors] = useState(false);
  const [showCampaignStats, setShowCampaignStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const careerMode = useGameStore((s) => s.careerMode);
  const recentAchievementUnlocks = useGameStore((s) => s.recentAchievementUnlocks);
  const acknowledgeAchievements = useGameStore((s) => s.acknowledgeAchievements);
  const currentSeasonKey = useGameStore((s) => s.date.season);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
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
  const reset = useGameStore((s) => s.reset);
  const weather = useGameStore((s) => s.weather);
  const mandate = useGameStore((s) =>
    s.playerForceId ? s.mandate.byForce[s.playerForceId] ?? 50 : 50,
  );
  const season = SEASON_LABEL[date.season];
  const monthNum = date.month ?? firstMonthOfSeason(date.season);
  const phaseInfo = MONTH_PHASE_LABEL[date.phase ?? 'upper'];
  const weatherZh = WEATHER_LABEL[weather.kind].zh;
  const windZh = WIND_LABEL[weather.wind].zh;
  const mandateInfo = MANDATE_LABEL(mandate);
  const mandateColor =
    mandateInfo.tone === 'high' ? '#d4a84a' :
    mandateInfo.tone === 'mid'  ? '#b0a070' : '#b8442e';

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <button className={styles.backButton} onClick={reset}>
          ← {t('標題', 'Title')}
        </button>
        <div className={styles.dateBlock}>
          <span className={styles.year}>{date.year} AD</span>
          <span className={styles.season} title={`${season.en} (${season.zh})`}>
            {monthNum}月{phaseInfo.zh} <span className={styles.seasonZh}>{season.zh}</span>
          </span>
          <span
            className={styles.season}
            title={`Weather affects fire attacks and march speed. Wind power: ${weather.windPower}.`}
            style={{ color: '#b0a070' }}
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
        <button
          className={styles.forcesButton}
          onClick={() => setShowDiplomacy(true)}
        >
          {t('外交', 'Diplomacy')}
        </button>
        <button
          className={styles.forcesButton}
          onClick={() => setShowForces(true)}
        >
          {t('群雄', 'Forces')}
        </button>

        {/* ── Grouped dropdowns ── */}
        <HudMenu
          label={t('人才', 'Personnel')}
          title={t('人才 — 絆、武功、列傳', 'Personnel — bonds, deeds, biographies')}
          items={[
            { label: t('絆', 'Bonds'),       onClick: () => setShowBonds(true) },
            { label: t('因緣', 'Relations'), onClick: () => setShowRelationships(true) },
            { label: t('武功', 'Deeds'),     onClick: () => setShowDeeds(true) },
            { label: t('列傳', 'Wiki'),      onClick: () => setShowEncyclopedia(true) },
            { label: t('關係図', 'Graph'),   onClick: () => setShowDipGraph(true) },
            ...(careerMode
              ? [{ label: t('列傳', 'Career'), onClick: () => setShowCareer(true) }]
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
            { label: t('書信', 'Letters'),   onClick: () => setShowWishes(true), badge: wishes.length },
          ]}
        />
        <HudMenu
          label={t('軍務', 'Military')}
          title={t('軍務 — 戰史、密偵、陣形', 'Military — battles, espionage, formations')}
          items={[
            { label: t('戰史', 'Battles'),    onClick: () => setShowHistory(true) },
            { label: t('戰錄', 'Replays'),    onClick: () => setShowReplays(true) },
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
          title={t('記錄 — 勳功、戰記', 'Records — achievements & stats')}
          items={[
            { label: t('勳功', 'Achievements'), onClick: () => setShowAch(true) },
            { label: t('戰記', 'Stats'),        onClick: () => setShowCampaignStats(true) },
          ]}
        />
        <HudMenu
          label={t('設定', 'System')}
          title={t('系統 — 設定、存讀、音效', 'System — settings, save/load, sound')}
          items={[
            { label: t('⚙ 設定', '⚙ Settings'),                onClick: () => setShowSettings(true) },
            { label: fogOfWar ? t('🌫 戰霧：開', '🌫 Fog: On') : t('☀ 戰霧：關', '☀ Fog: Off'), onClick: () => setFogOfWar(!fogOfWar) },
            { label: t('📖 教學', '📖 Tutorial'),               onClick: () => setTutorialStep(0) },
            { label: t('保存', 'Save'),                        onClick: () => setShowSave('save') },
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
        <button
          className={styles.advanceButton}
          onClick={() => {
            playSfx('horn');
            if (hotSeatPlayers.length > 1) {
              // Cycle to next player; advance season only when we wrap.
              const lastIdx = hotSeatPlayers.length - 1;
              if (hotSeatActiveIndex === lastIdx) {
                endSeason();
              }
              cycleHotSeat();
            } else {
              endSeason();
            }
          }}
        >
          {hotSeatPlayers.length > 1
            ? t(`結束 ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? '回合'} →`,
                `End ${hotSeatPlayers[hotSeatActiveIndex]?.label ?? 'Turn'} →`)
            : t(`下旬 ${monthNum}月${phaseInfo.zh} →`,
                `End ${monthNum}m ${phaseInfo.zh} →`)}
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.mapWrap} style={{ position: 'relative' }}>
          {use3DMap ? (
            <StrategicMap3D onSwitch2D={() => setUse3DMap(false)} />
          ) : (
            <>
              <StrategicMap />
              {/* Seasonal palette overlay */}
              <div
                className={`seasonal-${currentSeasonKey}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  mixBlendMode: 'overlay',
                }}
              />
              {/* Objective tracker in the top-left corner of the map */}
              <div style={{ position: 'absolute', top: 8, left: 8, pointerEvents: 'none' }}>
                <ObjectivePanel />
              </div>
              {/* Switch to 3D button */}
              <button
                onClick={() => setUse3DMap(true)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#1a3a5a', color: '#88b7e8',
                  border: '1px solid #88b7e8', padding: '0.35rem 0.7rem',
                  cursor: 'pointer', fontFamily: 'Songti SC, serif',
                  boxShadow: '0 0 8px rgba(0,0,0,0.6)',
                }}
                title={t('切換 3D 地圖', 'Switch to 3D map')}
              >{t('切換 3D', 'Switch 3D')} ⇄</button>
            </>
          )}
        </div>
        <CityPanel />
      </main>

      <ErrorBoundary fallbackLabel="Season report panel crashed">
        <SeasonReportModal />
      </ErrorBoundary>
      <ErrorBoundary fallbackLabel="Battle theater crashed">
        <BattleTheaterMount />
      </ErrorBoundary>
      {showForces && <ForcesOverview onClose={() => setShowForces(false)} />}
      {showDiplomacy && (
        <DiplomacyModal onClose={() => setShowDiplomacy(false)} />
      )}
      {showOfficers && (
        <OfficersTab onClose={() => setShowOfficers(false)} />
      )}
      {showBonds && <BondsModal onClose={() => setShowBonds(false)} />}
      {showRelationships && <RelationshipBrowserModal onClose={() => setShowRelationships(false)} />}
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
        {showEspionage && <EspionageModal onClose={() => setShowEspionage(false)} />}
        {showDeeds && <DeedsModal onClose={() => setShowDeeds(false)} />}
        {showReplays && <BattleReplayModal onClose={() => setShowReplays(false)} />}
        {showEncyclopedia && <EncyclopediaModal onClose={() => setShowEncyclopedia(false)} />}
        {showDipGraph && <DiplomacyGraphModal onClose={() => setShowDipGraph(false)} />}
        {showForge && <ForgingModal onClose={() => setShowForge(false)} />}
        {showAch && <AchievementsModal onClose={() => setShowAch(false)} />}
        {showCampaignStats && <CampaignStatsModal onClose={() => setShowCampaignStats(false)} />}
      </Suspense>
      {/* Achievement toast — bottom-right when something just unlocked */}
      {recentAchievementUnlocks.length > 0 && (
        <div
          onClick={acknowledgeAchievements}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(160deg, #2a1f15, #1a1410)',
            border: '2px solid #d4a84a',
            padding: '0.7rem 1rem',
            color: '#d4a84a',
            fontFamily: '"Songti SC", serif',
            cursor: 'pointer',
            zIndex: 980,
            boxShadow: '0 0 14px rgba(212, 168, 74, 0.5)',
            animation: 'tkmFadeIn 0.4s ease-out',
          }}
        >
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.3rem', color: '#c19a3b' }}>
            勳功 UNLOCKED
          </div>
          <div style={{ fontSize: '0.95rem', marginTop: '0.2rem' }}>
            {recentAchievementUnlocks.length} new achievement{recentAchievementUnlocks.length > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic' }}>
            click to dismiss
          </div>
        </div>
      )}
      <DialogueModal />
      {showSave && (
        <SaveSlotsModal
          mode={showSave}
          onClose={() => setShowSave(null)}
        />
      )}
      <EventModal />
      <VictoryModal />
      {(victoryStatus === 'victory' || showEnding) && (
        <EndingsModal onClose={() => setShowEnding(false)} />
      )}
      <TutorialOverlay />
      {tacticalBattle && <TacticalBattleScreen />}
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
