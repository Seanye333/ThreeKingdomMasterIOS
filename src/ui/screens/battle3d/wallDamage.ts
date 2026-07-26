import {
  FORT_MAX_HP,
  WALL_REPAIR_PER_ACTION,
  siegeAssaultPower,
} from '../../../game/systems/tactical';
import type { HexCoord, TacticalBattle } from '../../../game/types';

/**
 * 城防損毀 — reading `battle.wallHp` for the board.
 *
 * A siege is an attrition race the engine already simulates in full: every
 * wall/gate hex carries HP (wall 1000, gate 700), a siege contingent chips it
 * by `troops × 0.15 + 120` per assault, the garrison shores it back up by 180
 * with one of its own actions, and the hex only becomes a passable breach at
 * zero. Both sides are making a real decision every turn — keep battering this
 * gate or shift to the thinner wall; spend the defender's action repairing or
 * fighting.
 *
 * None of it was on screen. `wallHp` had eleven uses in the engine and **zero**
 * anywhere in the UI: masonry looked identical at 1000 HP and at 40, so the
 * attacker could not tell whether one more assault would open the city or
 * whether repairs were out-pacing them, and the defender had no way to see
 * which hex was about to fall — 搶修 was a guess. The only feedback was a log
 * line ("投石轟擊城牆!") that said nothing about progress.
 *
 * Everything here derives from the engine's own constants and functions, so the
 * bar on screen can never promise a breach the combat model won't grant.
 */

export type WallState = 'intact' | 'battered' | 'crumbling' | 'critical';

/** Fortifications without an entry fall back the same way `repairWall` does. */
export function fortMaxHp(terrain: string): number {
  return FORT_MAX_HP[terrain] ?? 1000;
}

/** Remaining strength as 0..1. Untracked hexes read as full. */
export function wallFraction(hp: number | undefined, terrain: string): number {
  if (hp === undefined) return 1;
  const max = fortMaxHp(terrain);
  if (max <= 0) return 1;
  return Math.max(0, Math.min(1, hp / max));
}

export function wallState(hp: number | undefined, terrain: string): WallState {
  if (hp === undefined) return 'intact';
  const f = wallFraction(hp, terrain);
  if (f > 0.85) return 'intact';
  if (f > 0.55) return 'battered';
  if (f > 0.25) return 'crumbling';
  return 'critical';
}

export const WALL_STATE_LABEL: Record<WallState, { zh: string; en: string; color: string }> = {
  intact: { zh: '完好', en: 'Intact', color: '#8ad8a0' },
  battered: { zh: '受損', en: 'Battered', color: '#d8c86a' },
  crumbling: { zh: '殘破', en: 'Crumbling', color: '#e0923a' },
  critical: { zh: '將傾', en: 'About to fall', color: '#e0523a' },
};

/**
 * How many more assaults this contingent needs to open the hex.
 *
 * Uses the engine's `siegeAssaultPower` rather than restating the formula, and
 * assumes no repairs in between — see `repairsOutpace` for the other half of
 * the race.
 */
export function hitsToBreach(hp: number | undefined, siegeTroops: number): number {
  if (hp === undefined) return 1;          // untracked hexes break in a single hit
  const per = siegeAssaultPower(siegeTroops);
  if (per <= 0) return Infinity;
  return Math.max(1, Math.ceil(hp / per));
}

/**
 * Whether a garrison repairing this hex every turn undoes the battering faster
 * than one contingent can deal it — in which case the attacker must bring a
 * second engine, storm the wall with ladders, or take the gate instead.
 */
export function repairsOutpace(siegeTroops: number, repairingUnits = 1): boolean {
  return repairingUnits * WALL_REPAIR_PER_ACTION >= siegeAssaultPower(siegeTroops);
}

/** Per-turn net progress against a hex, for the forecast line. */
export function netAssaultPerTurn(siegeTroops: number, repairingUnits = 0): number {
  return siegeAssaultPower(siegeTroops) - repairingUnits * WALL_REPAIR_PER_ACTION;
}

export const wallKey = (coord: HexCoord): string => `${coord.col},${coord.row}`;

export interface WallReading {
  coord: HexCoord;
  terrain: string;
  hp: number;
  max: number;
  fraction: number;
  state: WallState;
}

/** Every tracked fortification hex, weakest first — the defender's repair list. */
export function wallReadings(battle: TacticalBattle): WallReading[] {
  const hp = battle.wallHp;
  if (!hp) return [];
  const out: WallReading[] = [];
  for (const t of battle.tiles) {
    if (t.terrain !== 'wall' && t.terrain !== 'gate') continue;
    const v = hp[wallKey(t.coord)];
    if (v === undefined) continue;
    out.push({
      coord: t.coord,
      terrain: t.terrain,
      hp: v,
      max: fortMaxHp(t.terrain),
      fraction: wallFraction(v, t.terrain),
      state: wallState(v, t.terrain),
    });
  }
  return out.sort((a, b) => a.fraction - b.fraction);
}

/**
 * The one hex worth shouting about — the weakest fortification, once it is
 * damaged enough to matter. Drives the "城防告急" marker for the defender and
 * tells the attacker where the masonry is thinnest.
 */
export function weakestWall(battle: TacticalBattle): WallReading | null {
  const all = wallReadings(battle);
  const worst = all[0];
  if (!worst || worst.state === 'intact') return null;
  return worst;
}
