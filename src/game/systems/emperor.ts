/**
 * 奉迎天子 — the Son of Heaven as a piece on the board.
 *
 * The emperor resides in one city (洛陽 to start; he moves only when a
 * custodian "welcomes" him to their capital). Whoever OWNS that city
 * holds him, and holding him is worth holding:
 *  - edicts cost 30% less (詔書出自天子,誰敢計較工本)
 *  - the Mandate drifts toward the custodian (+2/season)
 *  - every other living force resents it (relation −1/season)
 *
 * Custody is implicit — conquer the city, inherit the emperor. 奉迎
 * moves him into your capital so a border fortress falling later
 * doesn't cost you the throne.
 */
import type { City, EntityId } from '../types';

export const EMPEROR_HOME = 'luoyang';
export const EDICT_DISCOUNT = 0.7;
export const MANDATE_PER_SEASON = 2;
export const RESENTMENT_PER_SEASON = -1;

/** The force currently holding the emperor — owner of his city. */
export function emperorCustodian(
  cities: Record<EntityId, City>,
  emperorCityId: EntityId | null,
): EntityId | null {
  if (!emperorCityId) return null;
  return cities[emperorCityId]?.ownerForceId ?? null;
}

/** Whether a force may 奉迎 — they hold the emperor but not at their
 *  capital yet. */
export function canWelcomeEmperor(
  cities: Record<EntityId, City>,
  emperorCityId: EntityId | null,
  forceId: EntityId,
  capitalCityId: EntityId,
): boolean {
  return emperorCustodian(cities, emperorCityId) === forceId
    && emperorCityId !== capitalCityId
    && cities[capitalCityId]?.ownerForceId === forceId;
}
