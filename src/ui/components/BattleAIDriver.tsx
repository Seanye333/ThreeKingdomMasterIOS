import { useEffect } from 'react';
import { aiTakeTurn, aiSkillForDifficulty } from '../../game/systems/tactical';
import { useGameStore } from '../../game/state/store';
import { SIGNATURE_FLAVOR } from '../screens/TacticalBattleScreen3D';

/**
 * 無頭 AI 驅動 — advances the AI's battle turns when NO battle screen is
 * mounted (during the world-camera fly-in, and while the battle is minimized
 * to its world-map diorama). Mutually exclusive with the 3D screen's own
 * driver: `active` must be false whenever the fullscreen view is up, so the
 * two timers never race.
 */
export function BattleAIDriver({ active }: { active: boolean }) {
  const battle = useGameStore((s) => s.tacticalBattle);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const start = useGameStore((s) => s.startTacticalBattle);
  const battleSpeed = useGameStore((s) => s.battleSpeed);
  const difficulty = useGameStore((s) => s.difficulty);
  const pushBattleFx = useGameStore((s) => s.pushBattleFx);

  useEffect(() => {
    if (!active || !battle || battle.winner) return;
    const playerSide = battle.attackerForceId === playerForceId ? 'attacker'
      : battle.defenderForceId === playerForceId ? 'defender' : null;
    if (!playerSide || battle.activeSide === playerSide) return;
    const delay = Math.max(150, 700 / Math.max(1, battleSpeed));
    const id = setTimeout(() => {
      const result = aiTakeTurn(battle, officers, Math.random, {
        skill: aiSkillForDifficulty(difficulty),
      });
      // Keep the signature flavor lines flowing into the log so the diorama's
      // story (and the sfx watcher, once the screen reopens) stays intact.
      let next = result.battle;
      for (const sig of result.signatures) {
        const flavor = SIGNATURE_FLAVOR[sig.tacticId];
        if (flavor) {
          next = {
            ...next,
            log: [...(next.log ?? []), { turn: next.turn, text: flavor.en, kind: 'event' as const }],
          };
        }
      }
      // Surface the casts so the diorama can play their FX/sound/運鏡 — without
      // a screen mounted, this is the only path the big-map view gets them.
      pushBattleFx(result.signatures.map((s) => ({
        tacticId: s.tacticId, stratagemId: s.stratagemId, coord: s.coord,
      })));
      start(next);
    }, delay);
    return () => clearTimeout(id);
  }, [active, battle, officers, playerForceId, start, battleSpeed, difficulty, pushBattleFx]);

  return null;
}
