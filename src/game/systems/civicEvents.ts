/**
 * 內政事件 — civic events that turn the internal-affairs stats (貪腐/練度/屯田)
 * from background numbers into moments the player remembers in the season report.
 *
 * These are recurring, stat-driven, auto-resolved events (distinct from the
 * one-shot scripted history beats in historicalEvents.ts). Each owned city can
 * fire at most ONE civic event per season, checked in priority order:
 *
 *   - 貪腐醜聞  (corruption ≥ 55) — a graft scandal erupts: an official absconds
 *                with public funds, loyalty craters. The PUNISHMENT for letting
 *                corruption fester; the cure is the 巡查肅貪 command.
 *   - 校場揚威  (drill ≥ 80)      — a grand military review lifts public spirit.
 *   - 屯田豐收  (autumn, big garrison + sound agriculture) — the soldier-farms
 *                bring in a bumper harvest of grain.
 *
 * Pure & deterministic given the rng; the caller (resolution.ts) commits the
 * returned city patches and report entries.
 */
import type { City, EntityId, ReportEntry } from '../types';

export interface CivicEventOutput {
  cities: Record<EntityId, City>;
  entries: ReportEntry[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function rollCivicEvents(input: {
  cities: Record<EntityId, City>;
  season: string;
  rng: () => number;
  /** Used only to flavour-tag the player's own events; effects are identical. */
  playerForceId?: EntityId | null;
}): CivicEventOutput {
  const { season, rng } = input;
  const cities = { ...input.cities };
  const entries: ReportEntry[] = [];

  for (const city of Object.values(input.cities)) {
    if (!city.ownerForceId) continue;

    // ── 貪腐醜聞 — graft scandal (the cost of neglecting 巡查肅貪) ──
    const corruption = city.corruption ?? 0;
    if (corruption >= 55 && rng() < corruption / 400) {
      const stolen = Math.min(city.gold, Math.round(200 + corruption * 12));
      const loyaltyHit = 4;
      cities[city.id] = {
        ...cities[city.id],
        gold: Math.max(0, cities[city.id].gold - stolen),
        loyalty: clamp(cities[city.id].loyalty - loyaltyHit, 0, 100),
        // Exposed in the open — graft drops some, but the rot isn't cleared
        // (only 巡查肅貪 does that properly).
        corruption: clamp(corruption - 10, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'note',
        text: `${city.name.en}: a corruption scandal — an official absconded with ${stolen}g of public funds; the people seethe (loyalty −${loyaltyHit}). Order 巡查肅貪 to root out the rest.`,
        textZh: `${city.name.zh}:貪腐醜聞爆發 —— 貪官攜公帑 ${stolen} 金潛逃,民怨沸騰(民忠 −${loyaltyHit})。宜速遣員巡查肅貪。`,
      });
      continue;
    }

    // ── 校場揚威 — a grand review of a well-drilled garrison ──
    const drill = city.drill ?? 0;
    if (drill >= 80 && rng() < 0.15) {
      const loyaltyGain = 2;
      cities[city.id] = {
        ...cities[city.id],
        loyalty: clamp(cities[city.id].loyalty + loyaltyGain, 0, 100),
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: a grand muster on the drill-ground — the garrison's discipline awes the populace (loyalty +${loyaltyGain}).`,
        textZh: `${city.name.zh}:大閱校場,軍威赫赫,士民振奮(民忠 +${loyaltyGain})。`,
      });
      continue;
    }

    // ── 屯田豐收 — a bumper harvest from the soldier-farms ──
    if (
      season === 'autumn' &&
      city.troops >= 8000 &&
      city.agriculture >= 60 &&
      rng() < 0.2
    ) {
      const bonusFood = Math.round(city.troops * 0.06);
      cities[city.id] = {
        ...cities[city.id],
        food: cities[city.id].food + bonusFood,
      };
      entries.push({
        cityId: city.id,
        kind: 'edict',
        text: `${city.name.en}: the military farms bring in a bumper harvest — granaries swell (+${bonusFood} food).`,
        textZh: `${city.name.zh}:屯田大熟,軍糧充盈(糧 +${bonusFood})。`,
      });
      continue;
    }
  }

  return { cities, entries };
}
