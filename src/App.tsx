






import { useEffect, useState } from 'react';
import { FpsMeter } from './ui/components/FpsMeter';
import { PROVINCE_BY_CITY } from './game/data';
import { useGameStore } from './game/state/store';
import {
  playMusic,
  playSfx,
  setSoundEnabled as setSfxEnabled,
  startAmbience,
  stopAmbience,
  stopMusic,
  unlockAudio,
  enableAudioFiles,
  registerOfficerVoiceClips,
} from './game/systems/sound';
import { OFFICER_DUEL_LINES } from './game/data/officerLines';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { Suspense, lazy } from 'react';
import { TitleScreen } from './ui/screens/TitleScreen';
import { LoadingSplash } from './ui/components/LoadingSplash';

// The realm (three.js + the whole map/battle stack) is by far the heaviest
// chunk — lazy so the title paints instantly; the title screen pre-warms the
// chunk in the background the moment it mounts.
const MapScreen = lazy(() => import('./ui/screens/MapScreen').then((m) => ({ default: m.MapScreen })));

// Expose province lookup for the canvas overlay.
(window as unknown as { __provinceByCity?: Record<string, string> }).__provinceByCity = PROVINCE_BY_CITY;

// Map the optional recorded-audio pack to its conventional paths under
// public/audio/ (sfx/<name>.mp3, music/<track>.mp3, voice/<id>-{taunt,ult}.mp3).
// This only populates URL tables — nothing is fetched until the player turns on
// 真實音效包 in Settings; missing files fall back to the synth/TTS per item.
enableAudioFiles();
registerOfficerVoiceClips(Object.keys(OFFICER_DUEL_LINES));

/**
 * 進圖載入頁 — covers the map's heavy first-mount (terrain, instanced meshes,
 * the territory tint) so the entry never reads as a stutter. The trick is
 * ordering: paint the splash FIRST, yield two frames, THEN mount the map (its
 * synchronous init runs while the splash is already covering the screen), then
 * fade the splash out once the map has had a beat to settle. A main-thread
 * block can't be animated through, so the win is hiding it behind a screen
 * that's already on-screen — not animating during it.
 */
function CampaignBoot() {
  const [phase, setPhase] = useState<'cover' | 'mounted' | 'fading' | 'done'>('cover');
  useEffect(() => {
    if (phase === 'cover') {
      // Two rAFs guarantee the splash is painted before the map mounts.
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase('mounted')); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    if (phase === 'mounted') {
      const id = window.setTimeout(() => setPhase('fading'), 650);
      return () => window.clearTimeout(id);
    }
    if (phase === 'fading') {
      const id = window.setTimeout(() => setPhase('done'), 450);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  return (
    <>
      {phase !== 'cover' && (
        <Suspense fallback={<LoadingSplash />}>
          <MapScreen />
        </Suspense>
      )}
      {phase !== 'done' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            opacity: phase === 'fading' ? 0 : 1,
            transition: 'opacity 0.45s ease-out',
            pointerEvents: phase === 'fading' ? 'none' : 'auto',
          }}
        >
          <LoadingSplash />
        </div>
      )}
    </>
  );
}

export default function App() {
  const scenarioId = useGameStore((s) => s.scenarioId);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const victoryStatus = useGameStore((s) => s.victoryStatus);
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  // 戰略層音樂分層 — the realm breathes tension when an enemy field army is
  // marching on one of your cities; otherwise the strategic theme stays at peace.
  const underThreat = useGameStore((s) => {
    const pid = s.playerForceId;
    if (!pid) return false;
    for (const a of Object.values(s.armies)) {
      if (a.forceId === pid || a.cellTarget) continue;
      const c = s.cities[a.targetCityId];
      if (c && c.ownerForceId === pid) return true;
    }
    return false;
  });

  // Sound preference syncs to the engine.
  useEffect(() => {
    setSfxEnabled(soundEnabled);
    if (soundEnabled && scenarioId) {
      startAmbience();
      playMusic('peace');
    } else {
      stopAmbience();
      stopMusic();
    }
  }, [soundEnabled, scenarioId]);

  // Battle music transitions.
  useEffect(() => {
    if (!soundEnabled) return;
    if (tacticalBattle && !tacticalBattle.winner) playMusic('battle');
    else if (victoryStatus === 'victory') playMusic('victory');
    else if (victoryStatus === 'defeat') playMusic('defeat');
    else if (scenarioId) playMusic(underThreat ? 'tension' : 'peace');
  }, [tacticalBattle?.id, tacticalBattle?.winner, victoryStatus, scenarioId, soundEnabled, underThreat]);

  // Unlock audio on the very first user interaction (click anywhere).
  useEffect(() => {
    const handler = () => {
      unlockAudio();
      document.removeEventListener('click', handler);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Event modal opening = gong.
  useEffect(() => {
    if (pendingEvent) playSfx('gong');
  }, [pendingEvent]);

  // Victory / defeat banner.
  useEffect(() => {
    if (victoryStatus === 'victory') playSfx('victory');
    else if (victoryStatus === 'defeat') playSfx('defeat');
  }, [victoryStatus]);

  // Tactical battle opening = horn.
  useEffect(() => {
    if (tacticalBattle) playSfx('horn');
  }, [tacticalBattle?.id]);

  return (
    <ErrorBoundary fallbackLabel="Game crashed">
      {scenarioId ? <CampaignBoot /> : <TitleScreen />}
      <FpsMeter />
    </ErrorBoundary>
  );
}
