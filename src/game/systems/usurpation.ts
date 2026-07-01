import type { City, EntityId, Force, Officer } from '../types';

/**
 * §7.5 再深化 — 禪代之階 (the ladder to usurpation) and its counter-play. Where
 * ambition.ts lets an over-mighty AI minister seize a lord in a single roll — and
 * leaves the *player* immune — this models the slow, telegraphed climb by which a
 * 權臣 (a 曹操/司馬懿) eclipses even the player's throne: 專權 → 逼宮 → 加九錫 →
 * 受禪. The court can see it coming and cut it short (翦除肘腋). Pure helpers.
 */

/** The four rungs a 權臣 climbs toward the throne. */
export const LADDER_STAGES: Array<{ zh: string; en: string; blurbZh: string; blurbEn: string }> = [
  { zh: '專權', en: 'Dominance', blurbZh: '權傾朝野,政出私門', blurbEn: 'dominates the court, ruling in all but name' },
  { zh: '逼宮', en: 'Coercion', blurbZh: '逼宮奪權,翦除異己', blurbEn: 'coerces the throne and purges rivals' },
  { zh: '加九錫', en: 'Nine Bestowments', blurbZh: '加九錫、建國邸,篡形已具', blurbEn: 'takes the Nine Bestowments — usurpation all but formalised' },
  { zh: '受禪', en: 'Abdication', blurbZh: '受禪代立,神器易主', blurbEn: 'receives the abdication — the realm changes hands' },
];
export const LADDER_TOP = LADDER_STAGES.length - 1; // 受禪

/** Martial+civil weight of an officer, matching ambition.ts's measure. */
export function capability(o: Officer): number {
  return o.stats.war + o.stats.leadership + o.stats.intelligence * 0.6 + o.stats.politics * 0.4;
}

/**
 * The over-mighty minister of a realm, if one looms: the ablest serving officer
 * who is NOT the ruler, eclipses the ruler's own ability, and whose loyalty has
 * cooled enough to harbour designs. Returns null for a court in hand.
 */
export function overmightyMinister(
  force: Force,
  officers: Record<EntityId, Officer>,
  year: number,
): Officer | null {
  const ruler = officers[force.rulerOfficerId];
  const rulerCap = ruler ? capability(ruler) : 0;
  let best: Officer | null = null;
  let bestCap = 0;
  for (const o of Object.values(officers)) {
    if (o.forceId !== force.id || o.id === force.rulerOfficerId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
    if (o.traits?.includes('loyal' as never)) continue; // the faithful never scheme
    if (o.loyalty >= 55) continue;                       // a content minister doesn't climb
    const cap = capability(o);
    if (cap <= rulerCap * 0.95) continue;                // must eclipse the ruler
    if (cap > bestCap) { bestCap = cap; best = o; }
  }
  // A senile/child ruler (no ruler cap) makes any strong minister over-mighty.
  void year;
  return best;
}

/**
 * 登階之速 — the per-season chance the 權臣 climbs another rung. Driven by how
 * far he eclipses the throne, how cool his loyalty, and the size of the 心腹黨羽
 * (accomplices) at his back. A guarded court (small cabal, higher loyalty) stalls
 * him for years; an unchecked one reaches 受禪 fast.
 */
export function ladderAdvanceChance(minister: Officer, ruler: Officer | undefined, cabalSize: number): number {
  const edge = ruler ? Math.max(0, capability(minister) - capability(ruler)) / 200 : 0.3; // 0..~0.5
  const disloyal = Math.max(0, 55 - minister.loyalty) / 55; // 0..1
  const clique = Math.min(0.25, cabalSize * 0.06);
  return Math.max(0, Math.min(0.6, 0.05 + edge * 0.4 + disloyal * 0.2 + clique));
}

/**
 * 心腹黨羽 — officers who would throw in with a rising 權臣: same-realm malcontents
 * (low loyalty, not the ruler, not sworn-loyal), preferring those at his city and
 * of his court faction. Returns up to `cap` candidate ids, ablest first.
 */
export function cabalCandidates(
  minister: Officer,
  officers: Record<EntityId, Officer>,
  cap: number,
): EntityId[] {
  const pool = Object.values(officers).filter((o) =>
    o.forceId === minister.forceId && o.id !== minister.id &&
    (o.status === 'idle' || o.status === 'active') &&
    !o.traits?.includes('loyal' as never) && o.loyalty < 50,
  );
  pool.sort((a, b) => {
    const sameCity = (x: Officer) => (x.locationCityId === minister.locationCityId ? 1 : 0);
    return (sameCity(b) - sameCity(a)) || (capability(b) - capability(a));
  });
  return pool.slice(0, cap).map((o) => o.id);
}

/**
 * 討逆之名 — is a realm a fit target for a 清君側 (a righteous war to clear the
 * throne's side)? A realm ruled through a tyrant's terror (its cities in revolt),
 * a runaway inner court (學官亂政), or a fresh usurper invites the banner.
 */
export function righteousReason(args: {
  force: Force;
  cities: Record<EntityId, City>;
  eunuchPower: number;
  usurperRuler: boolean;
}): { zh: string; en: string } | null {
  const { force, cities, eunuchPower, usurperRuler } = args;
  const owned = Object.values(cities).filter((c) => c.ownerForceId === force.id);
  if (owned.length === 0) return null;
  const avgLoyalty = owned.reduce((s, c) => s + c.loyalty, 0) / owned.length;
  if (usurperRuler) return { zh: '篡逆之君,人神共憤', en: 'a usurper on the throne' };
  if (eunuchPower >= 60) return { zh: '閹宦亂政,毒流海內', en: 'the inner court rules through terror' };
  if (avgLoyalty < 35) return { zh: '苛政虐民,天下側目', en: 'a tyranny that grinds its people' };
  return null;
}
