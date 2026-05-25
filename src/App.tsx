






import { useEffect } from 'react';
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
} from './game/systems/sound';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { MapScreen } from './ui/screens/MapScreen';
import { TitleScreen } from './ui/screens/TitleScreen';

// Expose province lookup for the canvas overlay.
(window as unknown as { __provinceByCity?: Record<string, string> }).__provinceByCity = PROVINCE_BY_CITY;

export default function App() {
  const scenarioId = useGameStore((s) => s.scenarioId);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const victoryStatus = useGameStore((s) => s.victoryStatus);
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);

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
    else if (scenarioId) playMusic('peace');
  }, [tacticalBattle?.id, tacticalBattle?.winner, victoryStatus, scenarioId, soundEnabled]);

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
      {scenarioId ? <MapScreen /> : <TitleScreen />}
    </ErrorBoundary>
  );
}
