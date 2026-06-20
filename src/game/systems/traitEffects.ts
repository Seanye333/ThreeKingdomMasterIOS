/**
 * Centralized "what does each personality trait actually DO?" module.
 *
 * Until now the 200-trait roster was mostly flavor — only training duration
 * and duel-eligibility consulted them. This module exposes a small set of
 * helpers each gameplay system calls to read trait modifiers in a consistent
 * way. Adding a new trait → adding it to the relevant set here is enough.
 */
import type { Officer, OfficerStats, InternalAffairsType } from '../types';

type TraitId = string;

function has(officer: Officer, id: TraitId): boolean {
  return (officer.traits ?? []).includes(id as never);
}
function hasAny(officer: Officer, ids: ReadonlySet<TraitId>): boolean {
  return (officer.traits ?? []).some((t) => ids.has(t));
}

// ─────────────────────────────────────────────────────────────────────
// T1 — Internal affairs multiplier
// ─────────────────────────────────────────────────────────────────────

const INTERNAL_BOOST_TRAITS = new Set(['diligent']);
const INTERNAL_PENALTY_TRAITS = new Set(['lazy']);
const COMMERCE_BOOST = new Set(['frugal']);
const DEFENSE_BOOST = new Set(['fortress-keeper']);
const LOYALTY_BOOST = new Set(['compassionate', 'benevolent', 'noble', 'lenient', 'generous']);

/**
 * Multiplier applied to an officer's internal-affairs effect.
 * Stacks additively from each matching trait, floored at 0.4 and capped at 2.0.
 */
export function internalAffairsMultiplier(
  officer: Officer,
  type: InternalAffairsType,
): number {
  let mul = 1.0;
  if (hasAny(officer, INTERNAL_BOOST_TRAITS)) mul += 0.20;
  if (hasAny(officer, INTERNAL_PENALTY_TRAITS)) mul -= 0.20;
  if ((type === 'develop-commerce' || type === 'major-commerce')
      && hasAny(officer, COMMERCE_BOOST)) mul += 0.20;
  if ((type === 'build-defense' || type === 'major-defense' || type === 'upgrade-wall')
      && hasAny(officer, DEFENSE_BOOST)) mul += 0.20;
  if (type === 'improve-loyalty' && hasAny(officer, LOYALTY_BOOST)) mul += 0.25;
  return Math.max(0.4, Math.min(2.0, mul));
}

/**
 * AI / UI fit score multiplier for picking an officer for a command type.
 * Combines internalAffairsMultiplier with role-specific trait fit.
 * Returns 1.0 = neutral, > 1 = good fit, < 1 = bad fit.
 */
export function commandFitMultiplier(
  officer: Officer,
  type: InternalAffairsType | 'march',
): number {
  if (type === 'march') {
    let m = 1;
    if (has(officer, 'cowardly')) m *= 0.5;
    if (has(officer, 'frail')) m *= 0.6;
    if (hasAny(officer, new Set(['martial-valor', 'veteran', 'ironhearted', 'stoic-brave']))) m *= 1.2;
    if (has(officer, 'field-tactician')) m *= 1.1;
    if (has(officer, 'reckless')) m *= 1.05;
    if (has(officer, 'cautious')) m *= 0.9;
    return m;
  }
  return internalAffairsMultiplier(officer, type);
}

/** Should AI avoid this officer entirely for combat? (cowardly / very frail) */
export function isCombatLiability(officer: Officer): boolean {
  return has(officer, 'cowardly') || has(officer, 'frail');
}

// ─────────────────────────────────────────────────────────────────────
// T2 — Effective stats (trait bonuses on top of raw stats)
// ─────────────────────────────────────────────────────────────────────

const WAR_BOOST = new Set(['martial-valor', 'ironhearted', 'veteran', 'stoic-brave', 'bloodthirsty', 'matchless']);
const WAR_PENALTY = new Set(['frail', 'cowardly', 'drunkard']);
const LEAD_BOOST = new Set(['veteran', 'fortress-keeper', 'field-tactician', 'noble']);
const INT_BOOST = new Set(['erudite', 'wise', 'scholar', 'mystical', 'strategist', 'precognitive']);
const POL_BOOST = new Set(['eloquent', 'diligent', 'honor-bound', 'composed', 'stern']);
const POL_PENALTY = new Set(['oath-breaker', 'lazy', 'drunkard']);
const CHA_BOOST = new Set(['charming', 'noble', 'graceful', 'eloquent', 'compassionate', 'refined']);
const CHA_PENALTY = new Set(['suspicious', 'ruthless', 'bloodthirsty', 'oath-breaker', 'cruel', 'arrogant']);

/** Effective stats with trait bonuses layered on top of base stats.
 *  Each trait contributes +3 (or −3) to one stat; cap final at [1, 120]. */
export function effectiveStats(officer: Officer): OfficerStats {
  const base = officer.stats;
  let war = base.war;
  let leadership = base.leadership;
  let intelligence = base.intelligence;
  let politics = base.politics;
  let charisma = base.charisma;
  for (const t of officer.traits ?? []) {
    if (WAR_BOOST.has(t)) war += 3;
    if (WAR_PENALTY.has(t)) war -= 3;
    if (LEAD_BOOST.has(t)) leadership += 3;
    if (INT_BOOST.has(t)) intelligence += 3;
    if (POL_BOOST.has(t)) politics += 3;
    if (POL_PENALTY.has(t)) politics -= 3;
    if (CHA_BOOST.has(t)) charisma += 3;
    if (CHA_PENALTY.has(t)) charisma -= 3;
  }
  // 後遺 — fold in any active afflictions (養傷 saps 武力, 羞憤 saps 魅力/智力).
  for (const a of officer.afflictions ?? []) {
    war += a.war ?? 0;
    intelligence += a.intelligence ?? 0;
    charisma += a.charisma ?? 0;
  }
  const clamp = (v: number) => Math.max(1, Math.min(120, v));
  return {
    war: clamp(war),
    leadership: clamp(leadership),
    intelligence: clamp(intelligence),
    politics: clamp(politics),
    charisma: clamp(charisma),
  };
}

// ─────────────────────────────────────────────────────────────────────
// T3 — Loyalty drift per season
// ─────────────────────────────────────────────────────────────────────

const LOYAL_TRAITS = new Set(['loyal', 'honor-bound', 'ironhearted', 'pious']);
const FLIGHTY_TRAITS = new Set(['oath-breaker', 'ambitious', 'vainglorious', 'greedy']);
const AMBITIOUS_TRAITS = new Set(['ambitious', 'vainglorious']);

/** How much an officer's loyalty drifts each season-boundary, before
 *  events. Positive = loyalty regenerates; negative = officer drifts away. */
export function loyaltyDriftPerSeason(officer: Officer): number {
  let drift = 0;
  if (hasAny(officer, LOYAL_TRAITS)) drift += 1;
  if (hasAny(officer, FLIGHTY_TRAITS)) drift -= 1;
  // Ambitious officers without high rank drift down extra. (Rank check
  // would need data; we approximate via low stats — high-rank officers
  // usually have high overall stats.)
  const total = officer.stats.leadership + officer.stats.war + officer.stats.intelligence
              + officer.stats.politics + officer.stats.charisma;
  if (hasAny(officer, AMBITIOUS_TRAITS) && total >= 350 && officer.loyalty < 80) {
    drift -= 1;
  }
  return drift;
}

/** True if officer's `loyal`-class trait protects against defection entirely. */
export function isUnshakeable(officer: Officer): boolean {
  return hasAny(officer, LOYAL_TRAITS);
}

/** Per-season chance an officer with low loyalty defects (becomes free agent).
 *  - Unshakeable (loyal/honor-bound/ironhearted/pious): 0%
 *  - Below loyalty 20: 5% base
 *  - oath-breaker/greedy: ×2
 *  - vainglorious/ambitious: ×1.5
 *  - Below loyalty 10: ×2 again
 */
export function defectionChance(officer: Officer): number {
  if (officer.loyalty >= 20) return 0;
  if (isUnshakeable(officer)) return 0;
  let base = 0.05;
  if (has(officer, 'oath-breaker') || has(officer, 'greedy')) base *= 2;
  if (has(officer, 'vainglorious') || has(officer, 'ambitious')) base *= 1.5;
  if (officer.loyalty < 10) base *= 2;
  return Math.min(0.5, base);
}

// ─────────────────────────────────────────────────────────────────────
// T4 — Combat modifiers
// ─────────────────────────────────────────────────────────────────────

export interface CombatContext {
  isAttacker: boolean;
  isSiege: boolean;
  isDefendingHomeCity: boolean;
  outnumbered: boolean;
  weatherBad: boolean;
}

export interface CombatMods {
  attackMul: number;       // multiplier on raw damage output
  defenseMul: number;      // multiplier on damage taken
  moraleResist: number;    // 0–1; reduces morale loss this share
  routResist: number;      // 0–1; reduces chance of routing
  lossMul: number;         // multiplier on troop losses (<1 = better)
}

const COMBAT_NEUTRAL: CombatMods = {
  attackMul: 1, defenseMul: 1, moraleResist: 0, routResist: 0, lossMul: 1,
};

/** Pull combat modifiers from an officer's traits for the current context. */
export function combatModifiers(officer: Officer, ctx: CombatContext): CombatMods {
  const mods: CombatMods = { ...COMBAT_NEUTRAL };
  const t = new Set(officer.traits ?? []);
  if (t.has('martial-valor')) mods.attackMul *= 1.10;
  if (t.has('bloodthirsty'))  mods.attackMul *= 1.08;
  if (t.has('ironhearted'))   { mods.moraleResist += 0.50; mods.routResist += 0.30; }
  if (t.has('stoic-brave'))   { mods.moraleResist += 0.30; mods.routResist += 0.20; }
  if (t.has('cowardly'))      { mods.moraleResist -= 0.30; mods.routResist -= 0.30; }
  if (t.has('veteran'))       mods.lossMul *= 0.90;
  if (t.has('weathered') && ctx.weatherBad) mods.attackMul *= 1.10;
  if (t.has('field-tactician') && ctx.outnumbered) mods.attackMul *= 1.15;
  if (t.has('fortress-keeper') && ctx.isDefendingHomeCity) mods.defenseMul *= 1.15;
  if (ctx.isSiege) {
    if (t.has('siege-expert'))   mods.attackMul *= 1.20;
  }
  if (ctx.isAttacker && t.has('ambush-master')) mods.attackMul *= 1.10;
  if (t.has('frail')) mods.lossMul *= 1.10;
  if (t.has('drunkard')) { mods.attackMul *= 0.95; mods.routResist -= 0.10; }
  return mods;
}

// ─────────────────────────────────────────────────────────────────────
// T5 — Post-conquest behavior
// ─────────────────────────────────────────────────────────────────────

const MERCIFUL_TRAITS = new Set(['compassionate', 'benevolent', 'chivalrous', 'honor-bound', 'noble', 'lenient', 'generous']);
const BRUTAL_TRAITS = new Set(['ruthless', 'bloodthirsty', 'cruel', 'wrathful']);

/** Post-conquest loyalty modifier for the captured city. Merciful
 *  commanders earn higher loyalty from the populace; brutal ones lower. */
export function conquestLoyaltyMod(commander: Officer): number {
  let mod = 0;
  if (hasAny(commander, MERCIFUL_TRAITS)) mod += 15;
  if (hasAny(commander, BRUTAL_TRAITS)) mod -= 15;
  return mod;
}

// ─────────────────────────────────────────────────────────────────────
// T6 — Diplomacy modifiers
// ─────────────────────────────────────────────────────────────────────

const DIPLOMAT_TRAITS = new Set(['eloquent', 'graceful', 'noble', 'composed']);
const TRICKSTER_TRAITS = new Set(['cunning', 'strategist']);
const SUSPICIOUS_TRAITS = new Set(['suspicious', 'paranoid']);

/** Bonus to the chance an opposing ruler accepts a diplomatic proposal. */
export function diplomacyProposalBonus(rulerOfficer: Officer): number {
  let bonus = 0;
  if (hasAny(rulerOfficer, DIPLOMAT_TRAITS)) bonus += 0.15;
  if (hasAny(rulerOfficer, TRICKSTER_TRAITS)) bonus += 0.10;
  return bonus;
}

/** Resistance to being deceived / agreeing to bad deals. */
export function diplomacyResistance(rulerOfficer: Officer): number {
  if (hasAny(rulerOfficer, SUSPICIOUS_TRAITS)) return 0.30;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────
// T7 — Espionage modifiers
// ─────────────────────────────────────────────────────────────────────

const SPY_TRAITS = new Set(['cunning', 'strategist', 'precognitive']);
const SPY_RESIST_TRAITS = new Set(['loyal', 'honor-bound', 'suspicious', 'composed', 'taciturn', 'paranoid', 'precognitive']);

/** Bonus to the chance an espionage op succeeds. */
export function espionageBonus(agent: Officer): number {
  let bonus = 0;
  if (hasAny(agent, SPY_TRAITS)) bonus += 0.15;
  return bonus;
}

/** Defensive resistance — the average resistance of officers in the
 *  target city (computed by caller). Returns the per-officer share. */
export function counterEspionageResist(officer: Officer): number {
  let r = 0;
  if (hasAny(officer, SPY_RESIST_TRAITS)) r += 0.10;
  return r;
}

// ─────────────────────────────────────────────────────────────────────
// T8 — Aging / mortality
// ─────────────────────────────────────────────────────────────────────

const HARDY_TRAITS = new Set(['weathered', 'stoic-brave', 'long-lived', 'ironhearted']);
const SICKLY_TRAITS = new Set(['frail', 'drunkard', 'sickly']);

/** Multiplier on the annual death roll. <1 = longer lived. */
export function deathChanceMultiplier(officer: Officer): number {
  let mul = 1;
  if (hasAny(officer, HARDY_TRAITS)) mul *= 0.7;
  if (hasAny(officer, SICKLY_TRAITS)) mul *= 1.3;
  if (has(officer, 'long-lived')) mul *= 0.6; // historical longevity
  return mul;
}

// ─────────────────────────────────────────────────────────────────────
// T9 — Recruitment
// ─────────────────────────────────────────────────────────────────────

/** Bonus to free-agent recruit chance for the prospective recruit. */
export function recruitChanceBonus(prospect: Officer): number {
  let bonus = 0;
  if (has(prospect, 'approachable')) bonus += 0.10;
  if (has(prospect, 'charming')) bonus += 0.05; // willing to be charmed
  if (has(prospect, 'noble')) bonus -= 0.10;
  if (has(prospect, 'loyal')) bonus -= 0.15;    // loyal officers won't switch easily
  if (has(prospect, 'oath-breaker')) bonus += 0.15;
  return bonus;
}

/** Bonus when the RECRUITER's ruler is charismatic in special ways. */
export function recruiterBonus(ruler: Officer): number {
  let bonus = 0;
  if (has(ruler, 'charming')) bonus += 0.10;
  if (has(ruler, 'noble')) bonus += 0.05;
  if (has(ruler, 'eloquent')) bonus += 0.05;
  if (has(ruler, 'generous')) bonus += 0.05;
  return bonus;
}

/** Traits that, when shared between two officers in the same force/city,
 *  can spark a friendship bond. Heroic / philosophical / aesthetic
 *  traits — not negative ones. Used by P11 bond formation and E marriage
 *  assimilation. Declared early so both sections can reference it. */
const BONDABLE_TRAITS: readonly string[] = [
  'chivalrous', 'mystical', 'scholar', 'erudite', 'refined',
  'poetic-genius', 'martial-valor', 'honor-bound', 'pious',
  'loyal', 'composed', 'noble', 'graceful', 'compassionate',
  'benevolent', 'eloquent', 'wise',
];

// ─────────────────────────────────────────────────────────────────────
// A — Level-up trait gain
// ─────────────────────────────────────────────────────────────────────

/**
 * When an officer crosses an XP level threshold, they may earn a trait
 * drawn from a pool weighted by their stat profile. Returns null if no
 * roll succeeds. Only fires at certain levels (3, 5).
 */
export function rollLevelUpTrait(
  officer: Officer,
  newLevel: number,
  rng: () => number,
): string | null {
  // Only roll at the "career milestone" levels.
  if (newLevel !== 3 && newLevel !== 5 && newLevel !== 6) return null;
  if (rng() > 0.35) return null; // ~35% at each milestone
  const have = new Set((officer.traits ?? []) as string[]);
  const pool: string[] = [];
  const s = officer.stats;
  if (s.war >= 80) pool.push('veteran', 'martial-valor', 'stoic-brave');
  if (s.war >= 90) pool.push('ironhearted', 'matchless');
  if (s.intelligence >= 80) pool.push('strategist', 'erudite', 'wise');
  if (s.intelligence >= 90) pool.push('precognitive', 'composed');
  if (s.leadership >= 80) pool.push('field-tactician', 'veteran');
  if (s.leadership >= 90) pool.push('fortress-keeper');
  if (s.politics >= 80) pool.push('diligent', 'honor-bound', 'composed');
  if (s.charisma >= 80) pool.push('eloquent', 'graceful');
  if (s.charisma >= 90) pool.push('charming', 'compassionate');
  const filtered = pool.filter((t) => !have.has(t));
  if (filtered.length === 0) return null;
  return filtered[Math.floor(rng() * filtered.length)];
}

// ─────────────────────────────────────────────────────────────────────
// C — Item resonance (持有物品 → 個性)
// ─────────────────────────────────────────────────────────────────────

/** Map item ID → resonant trait. Holding the item gives a small per-season
 *  chance to gain the trait. */
const ITEM_RESONANCE: Record<string, string> = {
  // Books / classics
  'sunzi-art':       'strategist',
  'sunzi-bingfa':    'strategist',
  'sima-fa':         'veteran',
  'liu-tao':         'strategist',
  'mengde-manual':   'cunning',
  'art-of-war':      'strategist',
  'spring-autumn':   'honor-bound',
  'guanzi-book':     'diligent',
  'liji-book':       'refined',
  'mengzi-book':     'benevolent',
  'mozi-book':       'frugal',
  'zhuangzi-book':   'composed',
  'gongsun-longzi':  'eloquent',
  'jiuzhang-suan':   'scholar',
  'star-chart':      'mystical',
  'way-of-great-peace': 'mystical',
  // Weapons — fierce traits
  'green-dragon':    'martial-valor',
  'snake-spear':     'martial-valor',
  'sky-piercer':     'martial-valor',
  'wargod-trident':  'martial-valor',
  'seven-star':      'honor-bound',
  // Stealth
  'sleeve-darts':    'cunning',
};

/** Returns the resonant trait for an item the officer holds, or null.
 *  Each season-tick this is rolled at ~1% per held resonant item. */
export function itemResonanceCandidate(officer: Officer): string | null {
  const have = new Set((officer.traits ?? []) as string[]);
  for (const itemId of officer.equipment ?? []) {
    const trait = ITEM_RESONANCE[itemId];
    if (trait && !have.has(trait)) return trait;
  }
  return null;
}

/**
 * T9 — Items that, when held long enough, can grant a battle tactic.
 * Books primarily; some legendary weapons too.
 */
const ITEM_TACTIC_GRANT: Record<string, string> = {
  'sunzi-art':       'deception',
  'sunzi-bingfa':    'know-self',
  'sima-fa':         'wait-tired',
  'liu-tao':         'ambush',
  'mengde-manual':   'ruse',
  'art-of-war':      'deception',
  'star-chart':      'star-prayer',
  'way-of-great-peace': 'thunder',
  'qimen-text':      'eight-gates',
  // Famous weapons → signature tactics
  'green-dragon':    'last-stand',
  'snake-spear':     'rush',
  'sky-piercer':     'rush',
  'wargod-trident':  'rush',
};

/** Returns the tactic an item might grant, if held and not yet known. */
export function itemTacticCandidate(officer: Officer): string | null {
  const have = new Set((officer.tactics ?? []) as string[]);
  for (const itemId of officer.equipment ?? []) {
    const tactic = ITEM_TACTIC_GRANT[itemId];
    if (tactic && !have.has(tactic)) return tactic;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// H — Policy resonance (深耕政策 → 個性)
// ─────────────────────────────────────────────────────────────────────

/** Map policy ID → resonant trait. */
const POLICY_RESONANCE: Record<string, string> = {
  'legalism':       'stern',
  'rites':          'honor-bound',
  'scholarship':    'erudite',
  'military-theory': 'strategist',
  'spy-network':    'cunning',
  'recruitment':    'eloquent',
  'inspection':     'composed',
  'frontier-pacification': 'composed',
  'tuntian':        'diligent',
  'commerce':       'frugal',
  'engineering':    'diligent',
  'horse-stewardship': 'martial-valor',
  'smithing':       'martial-valor',
  'astronomy':      'mystical',
  'ancestor-rites': 'pious',
  'crime-amnesty':  'benevolent',
  'land-reform':    'benevolent',
};

/** Returns the resonant trait for any policy the officer knows, or null. */
export function policyResonanceCandidate(officer: Officer): string | null {
  const have = new Set((officer.traits ?? []) as string[]);
  for (const policyId of officer.policies ?? []) {
    const trait = POLICY_RESONANCE[policyId];
    if (trait && !have.has(trait)) return trait;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// G — Age-driven drift
// ─────────────────────────────────────────────────────────────────────

const HOT_TRAITS = new Set(['martial-valor', 'reckless', 'wrathful', 'bloodthirsty', 'cowardly']);
const SAGE_TRAITS = ['wise', 'composed', 'weathered', 'erudite'];

/** Age 60+ officers occasionally lose a hot trait or gain a sage trait.
 *  Returns {remove?, add?} or null. */
export function rollAgeDrift(
  officer: Officer,
  age: number,
  rng: () => number,
): { remove?: string; add?: string } | null {
  if (age < 60) return null;
  if (rng() > 0.06) return null; // ~6% per year for 60+
  const traits = (officer.traits ?? []) as string[];
  // Try to remove a hot trait first.
  const hot = traits.find((t) => HOT_TRAITS.has(t));
  if (hot && rng() < 0.5) return { remove: hot };
  // Otherwise try to add a sage trait.
  const have = new Set(traits);
  const candidates = SAGE_TRAITS.filter((t) => !have.has(t));
  if (candidates.length === 0) return null;
  return { add: candidates[Math.floor(rng() * candidates.length)] };
}

// ─────────────────────────────────────────────────────────────────────
// E — Marriage assimilation
// ─────────────────────────────────────────────────────────────────────

/** For a harmonious couple, one spouse may absorb a bondable trait from
 *  the other. Returns the trait to copy (and which spouse gets it) or null. */
export function rollMarriageAssimilation(
  a: Officer,
  b: Officer,
  rng: () => number,
): { recipient: 'a' | 'b'; trait: string } | null {
  if (rng() > 0.03) return null; // 3% per season for harmonious couples
  const aSet = new Set((a.traits ?? []) as string[]);
  const bSet = new Set((b.traits ?? []) as string[]);
  // Things a has that b lacks (bondable only)
  const aGivesB: string[] = [];
  const bGivesA: string[] = [];
  for (const t of aSet) {
    if (BONDABLE_TRAITS.includes(t) && !bSet.has(t)) aGivesB.push(t);
  }
  for (const t of bSet) {
    if (BONDABLE_TRAITS.includes(t) && !aSet.has(t)) bGivesA.push(t);
  }
  const allOptions: Array<{ recipient: 'a' | 'b'; trait: string }> = [
    ...aGivesB.map((t) => ({ recipient: 'b' as const, trait: t })),
    ...bGivesA.map((t) => ({ recipient: 'a' as const, trait: t })),
  ];
  if (allOptions.length === 0) return null;
  return allOptions[Math.floor(rng() * allOptions.length)];
}

// ─────────────────────────────────────────────────────────────────────
// P11 — Same-trait bond formation (uses BONDABLE_TRAITS declared above)
// ─────────────────────────────────────────────────────────────────────

/**
 * P12 — Marriage compatibility. Returns:
 *  - "harmonious" if both spouses share a bondable trait (positive resonance)
 *  - "discordant" if one is mild/peaceful and the other violent/treacherous
 *  - "neutral" otherwise
 */
const CRUEL_TRAITS = new Set(['cruel', 'ruthless', 'bloodthirsty', 'wrathful', 'oath-breaker']);
const GENTLE_TRAITS = new Set(['compassionate', 'benevolent', 'graceful', 'refined', 'pious']);
export function maritalCompatibility(a: Officer, b: Officer): 'harmonious' | 'discordant' | 'neutral' {
  if (sharedBondableTrait(a, b)) return 'harmonious';
  const aCruel = (a.traits ?? []).some((t) => CRUEL_TRAITS.has(t));
  const aGentle = (a.traits ?? []).some((t) => GENTLE_TRAITS.has(t));
  const bCruel = (b.traits ?? []).some((t) => CRUEL_TRAITS.has(t));
  const bGentle = (b.traits ?? []).some((t) => GENTLE_TRAITS.has(t));
  if ((aCruel && bGentle) || (bCruel && aGentle)) return 'discordant';
  return 'neutral';
}

/** Find shared bondable trait between two officers, or null. */
export function sharedBondableTrait(a: Officer, b: Officer): string | null {
  const aT = new Set(a.traits ?? []);
  for (const t of (b.traits ?? [])) {
    if (BONDABLE_TRAITS.includes(t as string) && aT.has(t)) return t as string;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// T10 — Event triggers
// ─────────────────────────────────────────────────────────────────────

/** Per-season chance an officer triggers their personality-flavored
 *  random event. Caller picks one event per officer per season at most. */
export function flavorEventChance(officer: Officer): number {
  let chance = 0;
  if (has(officer, 'mystical')) chance += 0.04;
  if (has(officer, 'poetic-genius')) chance += 0.04;
  if (has(officer, 'drunkard')) chance += 0.05;
  if (has(officer, 'jealous')) chance += 0.04; // quarrels with peers
  return chance;
}

export interface FlavorEvent {
  kind: 'mystical' | 'poetic' | 'drunkard' | 'jealous';
  loyaltyDelta: number;
  statDelta?: Partial<OfficerStats>;
  textZh: string;
  textEn: string;
}

/**
 * P5 — Human-readable summary of what a trait ACTUALLY does mechanically.
 * Returns bilingual lines for tooltip display. Empty when the trait is
 * pure flavor (no system reads it yet).
 */
export function traitMechanicalEffects(traitId: string): Array<{ zh: string; en: string }> {
  const out: Array<{ zh: string; en: string }> = [];
  // Training
  if (['diligent', 'erudite', 'wise', 'scholar', 'cunning'].includes(traitId))
    out.push({ zh: '書院培訓 −1 季', en: 'Academy training −1 season' });
  if (traitId === 'lazy') out.push({ zh: '書院培訓 +1 季', en: 'Academy training +1 season' });
  if (traitId === 'loyal') out.push({ zh: '書院學費 −20%', en: 'Academy tuition −20%' });
  // Internal affairs
  if (traitId === 'diligent') out.push({ zh: '內政效果 +20%', en: 'Internal affairs +20%' });
  if (traitId === 'lazy') out.push({ zh: '內政效果 −20%', en: 'Internal affairs −20%' });
  if (traitId === 'frugal') out.push({ zh: '商業命令 +20%', en: 'Commerce commands +20%' });
  if (traitId === 'fortress-keeper') out.push({ zh: '築城命令 +20% · 守城防禦 +15%', en: 'Defense commands +20% · garrison +15%' });
  if (['compassionate', 'benevolent', 'noble', 'lenient', 'generous'].includes(traitId))
    out.push({ zh: '撫民命令 +25%', en: 'Loyalty commands +25%' });
  // Loyalty
  if (['loyal', 'honor-bound', 'ironhearted', 'pious'].includes(traitId))
    out.push({ zh: '忠誠 +1/季 · 永不背叛', en: 'Loyalty +1/season · never defects' });
  if (['oath-breaker', 'greedy'].includes(traitId))
    out.push({ zh: '忠誠 −1/季 · 低忠時叛逃機率 ×2', en: 'Loyalty −1/season · defection ×2 when low' });
  if (['ambitious', 'vainglorious'].includes(traitId))
    out.push({ zh: '忠誠 −1/季 · 高潛能無位則 −1 額外', en: 'Loyalty −1/season · extra −1 if high-potential w/o rank' });
  // Combat
  if (traitId === 'martial-valor') out.push({ zh: '戰場攻擊 +10%', en: 'Battle attack +10%' });
  if (traitId === 'bloodthirsty') out.push({ zh: '戰場攻擊 +8% · 攻陷後民忠 −15', en: 'Battle attack +8% · brutal post-conquest' });
  if (traitId === 'ironhearted') out.push({ zh: '士氣抗性 +50% · 潰散抗性 +30%', en: 'Morale resist +50% · rout resist +30%' });
  if (traitId === 'stoic-brave') out.push({ zh: '士氣抗性 +30% · 潰散抗性 +20%', en: 'Morale resist +30% · rout resist +20%' });
  if (traitId === 'cowardly') out.push({ zh: '士氣與潰散抗性 −30% · AI 不派出陣', en: 'Morale/rout −30% · AI avoids deploying' });
  if (traitId === 'veteran') out.push({ zh: '損兵 −10%', en: 'Troop losses −10%' });
  if (traitId === 'weathered') out.push({ zh: '惡劣天候時攻擊 +10%', en: 'Bad-weather attack +10%' });
  if (traitId === 'field-tactician') out.push({ zh: '寡擊眾時攻擊 +15%', en: 'Outnumbered attack +15%' });
  if (traitId === 'siege-expert') out.push({ zh: '攻城戰攻擊 +20% (重置自三國志14)', en: 'Siege attack +20%' });
  if (traitId === 'frail') out.push({ zh: '不能單挑 · 損兵 +10% · AI 不派出陣', en: 'Cannot duel · losses +10% · AI avoids deploying' });
  // Conquest
  if (['compassionate', 'benevolent', 'chivalrous', 'honor-bound', 'lenient', 'generous'].includes(traitId))
    out.push({ zh: '攻陷後民忠 +15', en: 'Post-conquest loyalty +15' });
  if (['ruthless', 'bloodthirsty', 'cruel', 'wrathful'].includes(traitId))
    out.push({ zh: '攻陷後民忠 −15', en: 'Post-conquest loyalty −15' });
  // Diplomacy
  if (['eloquent', 'graceful', 'noble', 'composed'].includes(traitId))
    out.push({ zh: '統治者:外交提議成功率 +15%', en: 'Ruler: diplomacy proposal +15%' });
  if (['cunning', 'strategist'].includes(traitId))
    out.push({ zh: '統治者:外交與計策 +10%', en: 'Ruler: diplomacy & stratagem +10%' });
  if (['suspicious', 'paranoid'].includes(traitId))
    out.push({ zh: '統治者:抗外交提議 30%', en: 'Ruler: resist proposals 30%' });
  // Espionage
  if (['cunning', 'strategist', 'precognitive'].includes(traitId))
    out.push({ zh: '諜報成功 +15%', en: 'Espionage success +15%' });
  if (['loyal', 'honor-bound', 'taciturn', 'paranoid', 'precognitive'].includes(traitId))
    out.push({ zh: '抗諜報 +10% (離間 ×3)', en: 'Counter-intel +10% (defect ×3)' });
  // Aging
  if (['weathered', 'stoic-brave', 'ironhearted'].includes(traitId))
    out.push({ zh: '老化死亡率 ×0.7', en: 'Death rate ×0.7' });
  if (traitId === 'long-lived') out.push({ zh: '老化死亡率 ×0.42 (壽福)', en: 'Death rate ×0.42 (long-lived)' });
  if (['frail', 'drunkard', 'sickly'].includes(traitId))
    out.push({ zh: '老化死亡率 ×1.3', en: 'Death rate ×1.3' });
  // Recruit
  if (traitId === 'approachable') out.push({ zh: '更易被招攬', en: 'Easier to recruit' });
  if (traitId === 'charming') out.push({ zh: '統治者:招攬 +10%', en: 'Ruler: recruit +10%' });
  // Stats
  const statMap: Record<string, string[]> = {
    'martial-valor': ['武力 +3'], 'ironhearted': ['武力 +3'], 'veteran': ['武力 +3 · 統率 +3'],
    'stoic-brave': ['武力 +3'], 'bloodthirsty': ['武力 +3 · 魅力 −3'], 'matchless': ['武力 +3'],
    'fortress-keeper': ['統率 +3'], 'field-tactician': ['統率 +3'], 'noble': ['統率 +3 · 魅力 +3'],
    'erudite': ['知力 +3'], 'wise': ['知力 +3'], 'scholar': ['知力 +3'], 'mystical': ['知力 +3'],
    'strategist': ['知力 +3'], 'precognitive': ['知力 +3'],
    'eloquent': ['政治 +3 · 魅力 +3'], 'diligent': ['政治 +3'], 'honor-bound': ['政治 +3'],
    'composed': ['政治 +3'], 'stern': ['政治 +3'], 'oath-breaker': ['政治 −3 · 魅力 −3'],
    'lazy': ['政治 −3'], 'drunkard': ['政治 −3 · 武力 −3'],
    'charming': ['魅力 +3'], 'graceful': ['魅力 +3'], 'compassionate': ['魅力 +3'], 'refined': ['魅力 +3'],
    'suspicious': ['魅力 −3'], 'ruthless': ['魅力 −3'], 'cruel': ['魅力 −3'], 'arrogant': ['魅力 −3'],
    'frail': ['武力 −3'], 'cowardly': ['武力 −3'],
  };
  if (statMap[traitId]) {
    for (const s of statMap[traitId]) out.push({ zh: s, en: s.replace(/[一-龥]/g, '?') });
  }
  return out;
}

/** Pick the most-specific event for the officer this season. */
export function rollFlavorEvent(officer: Officer, rng: () => number): FlavorEvent | null {
  if (rng() >= flavorEventChance(officer)) return null;
  const pool: FlavorEvent[] = [];
  if (has(officer, 'mystical')) {
    pool.push({
      kind: 'mystical',
      loyaltyDelta: 2,
      statDelta: { intelligence: 1 },
      textZh: `${officer.name.zh}夜觀星象,得一啟示,智力 +1。`,
      textEn: `${officer.name.en} divined an omen by starlight — intelligence +1.`,
    });
  }
  if (has(officer, 'poetic-genius')) {
    pool.push({
      kind: 'poetic',
      loyaltyDelta: 3,
      statDelta: { charisma: 1 },
      textZh: `${officer.name.zh}賦詩傳誦,名聲日盛,魅力 +1。`,
      textEn: `${officer.name.en} composed verse that spread far — charisma +1.`,
    });
  }
  if (has(officer, 'drunkard')) {
    pool.push({
      kind: 'drunkard',
      loyaltyDelta: -2,
      statDelta: { leadership: -1 },
      textZh: `${officer.name.zh}酒醉誤事,統率 −1。`,
      textEn: `${officer.name.en} drank too deep and erred — leadership −1.`,
    });
  }
  if (has(officer, 'jealous')) {
    pool.push({
      kind: 'jealous',
      loyaltyDelta: -3,
      textZh: `${officer.name.zh}嫉妒同僚之功,軍中略有騷動。`,
      textEn: `${officer.name.en} envied peers' deeds — small unrest in the camp.`,
    });
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}
