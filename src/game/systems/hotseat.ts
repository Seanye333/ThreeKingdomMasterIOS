import type { EntityId } from '../types';

/**
 * 熱座 — helpers for two or more people sharing one device.
 *
 * The seating itself already existed: the title screen picks the player count,
 * `hotSeatPlayers` / `hotSeatActiveIndex` hold the table, `cycleHotSeat` moves
 * `playerForceId` to the next chair, and MapScreen resolves the season after
 * the last seat. That design is right, and deliberately keeps `playerForceId`
 * a SINGLE id — it is referenced ~2,250 times and nearly every one means "the
 * person looking at this screen"; pluralising it would touch everything and
 * mean something different in each place.
 *
 * What was missing was the consequence of that choice. Because the AI is only
 * ever told `playerForceId`, it treated every OTHER human force as its own:
 * the waiting players' cities took AI build orders and their armies marched,
 * all before they had so much as sat down. `isHumanForce` is the fix, and
 * `pruneSeats` handles the other hole — `cycleHotSeat` is a modulo over the
 * seat list, so a conquered player's empty chair came round forever.
 */

export interface HotseatConfig {
  /** Forces under human control, in seating order. One entry = ordinary play. */
  forceIds: EntityId[];
  /** Whose turn it is — an index into `forceIds`. */
  index: number;
}

export const MAX_SEATS = 4;

/** True when more than one person is playing. */
export function isHotseat(cfg: HotseatConfig | undefined | null): boolean {
  return !!cfg && cfg.forceIds.length > 1;
}

/**
 * Is this force human-run? Everything the AI does must ask this rather than
 * comparing against `playerForceId`, which in hotseat is only the CURRENT seat
 * — the other humans would otherwise be played by the computer behind their
 * backs, spending their gold before they ever sat down.
 */
export function isHumanForce(
  forceId: EntityId | null | undefined,
  cfg: HotseatConfig | undefined | null,
  playerForceId: EntityId | null | undefined,
): boolean {
  if (!forceId) return false;
  if (cfg && cfg.forceIds.length > 0) return cfg.forceIds.includes(forceId);
  return forceId === playerForceId;
}

/**
 * Drop any seat whose force has been wiped off the map, keeping the current
 * seat pointed at the same person where possible.
 *
 * A hotseat game where one player is conquered must not strand the round on an
 * empty chair — the survivors play on, and the loser watches.
 */
export function pruneSeats(
  cfg: HotseatConfig,
  liveForceIds: ReadonlySet<EntityId> | EntityId[],
): HotseatConfig {
  const live = liveForceIds instanceof Set ? liveForceIds : new Set(liveForceIds);
  const current = cfg.forceIds[cfg.index];
  const forceIds = cfg.forceIds.filter((id) => live.has(id));
  if (forceIds.length === cfg.forceIds.length) return cfg;
  if (forceIds.length === 0) return { forceIds, index: 0 };
  const keep = forceIds.indexOf(current);
  return { forceIds, index: keep >= 0 ? keep : 0 };
}

/** Seat number for the handoff card — 1-based, the way people count chairs. */
export function seatNumber(cfg: HotseatConfig): number {
  return cfg.index + 1;
}

/**
 * 對局雙方皆為真人 — a tactical battle between two seated players.
 *
 * The battle screen decides whose orders it takes from `playerForceId`, and
 * `BattleAIDriver` fires whenever the active side is not that force. In a
 * hotseat game those two facts combine badly: the moment the turn passes to the
 * other human, the AI treats it as an enemy turn and plays it for them. Same
 * shape as the strategic-layer bug — the computer governing a player who is
 * simply waiting — and the same fix: ask whether the force is HUMAN, not
 * whether it is the one at the keyboard.
 */
export function isPvpBattle(
  attackerForceId: EntityId | null | undefined,
  defenderForceId: EntityId | null | undefined,
  seatForceIds: readonly EntityId[] | undefined,
): boolean {
  if (!attackerForceId || !defenderForceId || !seatForceIds || seatForceIds.length < 2) return false;
  return seatForceIds.includes(attackerForceId) && seatForceIds.includes(defenderForceId);
}

/** Which seated force holds a given side of a PvP battle. */
export function forceOfSide(
  side: 'attacker' | 'defender',
  attackerForceId: EntityId | null | undefined,
  defenderForceId: EntityId | null | undefined,
): EntityId | null {
  return (side === 'attacker' ? attackerForceId : defenderForceId) ?? null;
}
