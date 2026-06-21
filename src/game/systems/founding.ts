import type { City, EntityId, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { highestEligiblePeerage } from '../data/peerage';

/**
 * 建國大典 — the founding ceremony a realm holds once it has ascended (王/帝).
 * Beyond the bare enthronement edict, the 大典 is a one-shot set-piece: 大赦天下
 * (realm-wide loyalty), 封賞百官 (mass enfeoffment of every deserving officer via
 * the peerage ladder), and a swell of 天命. Pure — the caller commits + names
 * the dynasty/era. Returns the granted peerages for the report.
 */
export interface FoundingResult {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** Officers newly enfeoffed and to which peerage. */
  enfeoffed: Array<{ officerId: EntityId; peerageId: string }>;
  /** 大赦 loyalty bump applied to every owned city's 民心. */
  cityLoyaltyGain: number;
  /** 天命 gain to fold into the mandate. */
  mandateGain: number;
}

export const FOUNDING_CITY_LOYALTY = 8;
export const FOUNDING_OFFICER_LOYALTY = 6;
export const FOUNDING_MANDATE = 15;

export function holdFounding(input: {
  forceId: EntityId;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  deeds: Record<EntityId, HeroicDeeds>;
}): FoundingResult {
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const enfeoffed: FoundingResult['enfeoffed'] = [];

  // 大赦天下 — every city of the realm rejoices.
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== input.forceId) continue;
    cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + FOUNDING_CITY_LOYALTY) };
  }

  // 恩賞群臣 + 封賞百官 — loyalty for all, peerage for the deserving.
  for (const o of Object.values(officers)) {
    if (o.forceId !== input.forceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    let next: Officer = {
      ...o,
      loyalty: Math.min(100, o.loyalty + FOUNDING_OFFICER_LOYALTY),
    };
    // sovereign=true — the founding realm can now confer 公/王.
    const peer = highestEligiblePeerage(next, input.deeds[o.id], true);
    if (peer) {
      next = {
        ...next,
        peerageId: peer.id,
        loyalty: Math.min(100, next.loyalty + peer.loyaltyOnGrant),
      };
      enfeoffed.push({ officerId: o.id, peerageId: peer.id });
    }
    officers[o.id] = next;
  }

  return {
    cities,
    officers,
    enfeoffed,
    cityLoyaltyGain: FOUNDING_CITY_LOYALTY,
    mandateGain: FOUNDING_MANDATE,
  };
}
