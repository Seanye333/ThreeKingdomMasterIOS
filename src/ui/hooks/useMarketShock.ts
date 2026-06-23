/**
 * Reads the forward-looking grain-market shocks for a city that the spot-price
 * model can't see from the city snapshot alone — an enemy army bearing down, a
 * famine/flood logged this season, or drought weather. Fed to
 * {@link import('../../game/systems/market').marketOutlook}.
 */
import { useGameStore } from '../../game/state/store';
import type { MarketShock } from '../../game/systems/market';
import type { EntityId } from '../../game/types';

export function useMarketShock(cityId: EntityId): MarketShock {
  const armies = useGameStore((s) => s.armies);
  const cities = useGameStore((s) => s.cities);
  const lastReport = useGameStore((s) => s.lastReport);
  const weatherKind = useGameStore((s) => s.weather?.kind);

  const owner = cities[cityId]?.ownerForceId ?? null;
  const underSiege = Object.values(armies).some(
    (a) => a.targetCityId === cityId && a.forceId !== owner,
  );
  const harvestHit = !!lastReport?.entries.some(
    (e) => e.cityId === cityId && (e.kind === 'famine' || e.kind === 'flood'),
  );
  return { underSiege, harvestHit, drought: weatherKind === 'drought' };
}
