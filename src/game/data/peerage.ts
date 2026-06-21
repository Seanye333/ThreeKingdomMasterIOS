import type { Officer } from '../types';
import type { Peerage, PeerageId } from '../types/title';
import type { HeroicDeeds } from '../types/deeds';

/**
 * 爵位 — the enfeoffment ladder. Conferred on top officers as the highest layer
 * of 官爵 above the appointed 軍階/官職. See types/title.ts for the design notes.
 *
 * Balance intent: a peerage is a *net-positive* reward — the fief's productive
 * land yields revenue to the realm AND the noble's loyalty/prestige rises — but
 * the two great fiefs (公/王) demand a sovereign to grant and pile 野心 onto an
 * over-mighty retainer, so heaping them on a strong general can breed a warlord.
 */
export const PEERAGES: Peerage[] = [
  {
    id: 'guannei',
    name: { zh: '關內侯', en: 'Marquis Within the Passes' },
    tier: 1,
    fiefGold: 40,
    fiefGrain: 60,
    loyaltyBonus: 2,
    loyaltyOnGrant: 4,
    prestige: 4,
    minMerit: 120,
    ambitionPressure: 0,
  },
  {
    id: 'ting',
    name: { zh: '亭侯', en: 'Village Marquis' },
    tier: 2,
    fiefGold: 90,
    fiefGrain: 120,
    loyaltyBonus: 3,
    loyaltyOnGrant: 6,
    prestige: 8,
    minMerit: 200,
    ambitionPressure: 0,
  },
  {
    id: 'xiang',
    name: { zh: '鄉侯', en: 'County Marquis' },
    tier: 3,
    fiefGold: 160,
    fiefGrain: 200,
    loyaltyBonus: 4,
    loyaltyOnGrant: 8,
    prestige: 14,
    minMerit: 320,
    ambitionPressure: 1,
  },
  {
    id: 'xian',
    name: { zh: '縣侯', en: 'Prefecture Marquis' },
    tier: 4,
    fiefGold: 260,
    fiefGrain: 300,
    loyaltyBonus: 5,
    loyaltyOnGrant: 10,
    prestige: 22,
    minMerit: 460,
    ambitionPressure: 2,
  },
  {
    id: 'gong',
    name: { zh: '公', en: 'Duke' },
    tier: 5,
    fiefGold: 420,
    fiefGrain: 460,
    loyaltyBonus: 6,
    loyaltyOnGrant: 12,
    prestige: 34,
    minMerit: 640,
    ambitionPressure: 4,
    requiresSovereign: true,
  },
  {
    id: 'wang',
    name: { zh: '王', en: 'King' },
    tier: 6,
    fiefGold: 640,
    fiefGrain: 640,
    loyaltyBonus: 8,
    loyaltyOnGrant: 16,
    prestige: 50,
    minMerit: 860,
    ambitionPressure: 7,
    requiresSovereign: true,
  },
];

export const PEERAGES_BY_ID: Record<PeerageId, Peerage> = Object.fromEntries(
  PEERAGES.map((p) => [p.id, p]),
) as Record<PeerageId, Peerage>;

export function peerageById(id: PeerageId | undefined | null): Peerage | null {
  return id ? PEERAGES_BY_ID[id] ?? null : null;
}

/** Tier of a held peerage (0 = none), for comparisons. */
export function peerageTier(id: PeerageId | undefined | null): number {
  return peerageById(id)?.tier ?? 0;
}

/**
 * 功勳積分 — a composite merit score gating enfeoffment. Blends raw ability with
 * battlefield/civic deeds so a veteran of real campaigns out-ranks a green
 * high-stat prodigy. Pure; deeds optional (falls back to stats only).
 */
export function meritScore(o: Officer, deeds?: HeroicDeeds): number {
  const s = o.stats;
  const ability =
    Math.max(s.war, s.intelligence, s.politics) + 0.5 * s.leadership;
  let merit = ability * 2;
  if (deeds) {
    merit += Math.min(300, (deeds.killsTroops ?? 0) / 200);
    merit += (deeds.duelsWon ?? 0) * 12;
    merit += (deeds.citiesTaken ?? 0) * 30;
    merit += (deeds.battlesWon ?? 0) * 8;
    merit += (deeds.captured ?? 0) * 15;
    merit += (deeds.espionageSuccess ?? 0) * 12;
    merit += (deeds.civicWorks ?? 0) * 6;
  }
  return Math.round(merit);
}

/**
 * The highest peerage an officer qualifies for by merit. `sovereign` =
 * whether the granting force has 稱王/稱帝 (unlocks 公/王). Returns null if the
 * officer clears nothing — or only a peerage no higher than one already held.
 */
export function highestEligiblePeerage(
  o: Officer,
  deeds: HeroicDeeds | undefined,
  sovereign: boolean,
): Peerage | null {
  const merit = meritScore(o, deeds);
  const held = peerageTier(o.peerageId);
  let best: Peerage | null = null;
  for (const p of PEERAGES) {
    if (p.requiresSovereign && !sovereign) continue;
    if (merit < p.minMerit) continue;
    if (p.tier <= held) continue;
    if (!best || p.tier > best.tier) best = p;
  }
  return best;
}

export interface PeerageEffects {
  fiefGold: number;
  fiefGrain: number;
  loyaltyBonus: number;
  prestige: number;
  ambitionPressure: number;
}

const NO_PEERAGE: PeerageEffects = {
  fiefGold: 0,
  fiefGrain: 0,
  loyaltyBonus: 0,
  prestige: 0,
  ambitionPressure: 0,
};

/** Standing effects of an officer's held peerage. Pure. */
export function peerageEffects(o: Officer | undefined): PeerageEffects {
  const p = peerageById(o?.peerageId);
  if (!p) return NO_PEERAGE;
  return {
    fiefGold: p.fiefGold,
    fiefGrain: p.fiefGrain,
    loyaltyBonus: p.loyaltyBonus,
    prestige: p.prestige,
    ambitionPressure: p.ambitionPressure,
  };
}
