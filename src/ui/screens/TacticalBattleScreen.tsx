import { useEffect, useMemo, useRef, useState } from 'react';
import { NAMED_MAPS_BY_ID, NAMED_MAPS_BY_CITY } from '../../game/data';
import { playSfx } from '../../game/systems/sound';
import { useGameStore } from '../../game/state/store';
import type { Officer } from '../../game/types';
import { Debate3DStage } from '../components/debate/Debate3DStage';
import { LocatorMap } from '../components/LocatorMap';
import { battleViewWindow } from '../viewWindow';
import { TacticalBattleScreen3D } from './TacticalBattleScreen3D';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useDesc } from '../i18n';
import styles from './TacticalBattleScreen.module.css';

/**
 * Battle host — a thin shell around the 3D battle screen (the 2D SVG view has
 * been retired). Owns only what must outlive / sit above the 3D scene:
 *   - the opening cinematic (curtains + title + seal)
 *   - the 舌戰 word-war prelude (fires once the cinematic ends)
 *   - the "you are here" locator on the world map
 * Everything else — board, panels, AI driver, keyboard, results, duels —
 * lives in TacticalBattleScreen3D.
 */

// Once-per-battle latches that survive unmounts — the host remounts every
// time the player returns from the world-map diorama, and neither the
// cinematic nor the word-war should replay mid-battle.
let cinematicPlayedFor: string | null = null;
let wordWarFiredFor: string | null = null;

export function TacticalBattleScreen() {
  const battle = useGameStore((s) => s.tacticalBattle);
  const officers = useGameStore((s) => s.officers);
  const start = useGameStore((s) => s.startTacticalBattle);
  const cancelBattle = useGameStore((s) => s.cancelTacticalBattle);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const [showCinematic, setShowCinematic] = useState(
    () => useGameStore.getState().tacticalBattle?.id !== cinematicPlayedFor,
  );
  // 舌戰 — opens after the opening cinematic when both sides have INT ≥ 80.
  const [interactiveDebate, setInteractiveDebate] = useState<{ me: Officer; foe: Officer } | null>(null);
  // Track whether we've already evaluated word war this battle, so it
  // doesn't re-fire on each re-render after the cinematic.
  const wordWarChecked = useRef(false);
  const desc = useDesc();

  // Identify which side the player is on.
  const playerSide: 'attacker' | 'defender' | null = useMemo(() => {
    if (!battle) return null;
    if (battle.attackerForceId === playerForceId) return 'attacker';
    if (battle.defenderForceId === playerForceId) return 'defender';
    return null;
  }, [battle, playerForceId]);

  // After the cinematic ends, if both sides have an INT ≥ 80 officer,
  // fire the 舌戰 (word war) prelude. Result modifies live unit morale
  // when the player dismisses the modal.
  useEffect(() => {
    if (!battle || showCinematic || wordWarChecked.current) return;
    if (wordWarFiredFor === battle.id) return; // already fired this battle
    wordWarChecked.current = true;
    wordWarFiredFor = battle.id;
    const sideOfficers = (side: 'attacker' | 'defender') => battle.units
      .filter((u) => u.side === side)
      .map((u) => officers[u.officerId])
      .filter((o): o is Officer => !!o);
    const best = (arr: Officer[]) =>
      [...arr].sort((a, b) => (b.stats.intelligence + b.stats.charisma) - (a.stats.intelligence + a.stats.charisma))[0];
    const aOff = sideOfficers('attacker');
    const dOff = sideOfficers('defender');
    if (!aOff.some((o) => o.stats.intelligence >= 80) || !dOff.some((o) => o.stats.intelligence >= 80)) return;
    const me = best(playerSide === 'attacker' ? aOff : dOff);
    const foe = best(playerSide === 'attacker' ? dOff : aOff);
    if (!me || !foe) return;
    // Defer a tick so the modal opens outside the effect pass (and outside
    // the cinematic's final frame).
    const id = window.setTimeout(() => setInteractiveDebate({ me, foe }), 0);
    return () => window.clearTimeout(id);
  }, [battle, showCinematic, officers, playerSide]);

  // Hide cinematic after the full curtain + title + seal sequence — once per
  // battle (returning from the world-map diorama must not replay it).
  useEffect(() => {
    if (!battle || cinematicPlayedFor === battle.id) return;
    cinematicPlayedFor = battle.id;
    // Curtains slide for 1.8s, title reveals through 2.8s, seal stamps at 2.9s.
    // Hold the full sequence + breath for the player to read.
    const id = setTimeout(() => setShowCinematic(false), 4500);
    // Drum + horn flourish on battle open.
    playSfx('horn');
    setTimeout(() => playSfx('sword'), 2400); // seal-stamp thunk
    return () => clearTimeout(id);
  }, [battle?.id]);

  if (!battle) return null;

  // Resolve through the same city→map table the board generator uses (the old
  // `map-${cityId}` derivation missed renamed maps like 赤壁/定軍山).
  const namedMap = battle.field ? undefined : NAMED_MAPS_BY_ID[NAMED_MAPS_BY_CITY[battle.cityId] ?? ''];
  const battleTitleZh = namedMap?.name.zh ?? (battle.field ? '野戰' : '戰術戰闘');
  const battleTitleEn = namedMap?.name.en ?? (battle.field ? 'Field Battle' : 'Tactical Battle');

  return (
    <div className={styles.root}>
      <ErrorBoundary
        fallbackLabel="3D 戰場加載失敗 — 3D battlefield failed to load"
        escapeAction={{ label: '退出戰鬥 Leave battle', onClick: cancelBattle }}
      >
        <TacticalBattleScreen3D />
      </ErrorBoundary>

      {/* "You are here" locator — this battlefield's window on the world map.
          Above the 3D screen (z-1000); hidden during the cinematic. */}
      {!showCinematic && (
        <div style={{ position: 'fixed', left: 10, bottom: 10, zIndex: 1010 }}>
          <LocatorMap window={battleViewWindow(battle)} focusCityId={battle.cityId} width={132} />
        </div>
      )}

      {showCinematic && (
        <div className={styles.cinematic} style={{ zIndex: 1020 }}>
          {/* Sliding curtain panels reveal the title. */}
          <div className={styles.cinCurtainL} />
          <div className={styles.cinCurtainR} />
          <div className={styles.cinematicTitle}>
            <div className={styles.cinematicTitleZh}>{battleTitleZh}</div>
            <div className={styles.cinematicTitleEn}>{battleTitleEn}</div>
            {namedMap && (
              <div className={styles.cinematicDesc}>{desc(namedMap)}</div>
            )}
            {/* Vermilion seal stamps in last — classic Chinese chop look. */}
            <div className={styles.cinSeal}>戰</div>
          </div>
        </div>
      )}

      {/* 舌戰 — playable war of words at battle start; the result shifts unit
          morale (player's side by meDelta, the enemy by foeDelta). */}
      {interactiveDebate && (
        <Debate3DStage
          me={interactiveDebate.me}
          foe={interactiveDebate.foe}
          onComplete={({ meDelta, foeDelta }) => {
            start({
              ...battle,
              units: battle.units.map((u) => ({
                ...u,
                morale: Math.max(0, Math.min(100, u.morale + (u.side === playerSide ? meDelta : foeDelta))),
              })),
            });
            setInteractiveDebate(null);
          }}
        />
      )}
    </div>
  );
}
