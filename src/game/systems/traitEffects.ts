/**
 * Centralized "what does each personality trait actually DO?" module.
 *
 * Until now the 200-trait roster was mostly flavor — only training duration
 * and duel-eligibility consulted them. This module exposes a small set of
 * helpers each gameplay system calls to read trait modifiers in a consistent
 * way. Adding a new trait → adding it to the relevant set here is enough.
 */
import type { Officer, OfficerStats, InternalAffairsType, UnitType, TerrainKind, EntityId } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { honorificById } from '../data/honorifics';

type TraitId = string;

function has(officer: Officer, id: TraitId): boolean {
  return (officer.traits ?? []).includes(id as never);
}
function hasAny(officer: Officer, ids: ReadonlySet<TraitId>): boolean {
  return (officer.traits ?? []).some((t) => ids.has(t));
}
/** Theme of a held 名號將軍 (or null) — lets non-combat themes pull their weight. */
function honorificTheme(officer: Officer): string | null {
  return honorificById(officer.honorificId)?.theme ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// T1 — Internal affairs multiplier
// ─────────────────────────────────────────────────────────────────────

const INTERNAL_BOOST_TRAITS = new Set(['diligent']);
const INTERNAL_PENALTY_TRAITS = new Set(['lazy']);
const COMMERCE_BOOST = new Set(['frugal']);
const DEFENSE_BOOST = new Set(['fortress-keeper']);
const LOYALTY_BOOST = new Set(['compassionate', 'benevolent', 'noble', 'lenient', 'generous', 'humble']);
// 治軍嚴整 — a disciplined martial officer drills the garrison and organises a
// 屯田 colony better than a soft administrator.
const DRILL_BOOST = new Set(['iron-discipline', 'martial-valor', 'veteran']);

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
  // 內向 — shuns the crowd, pours themselves into the ledgers (+10% internal).
  if ((officer.traits as string[] | undefined)?.includes('introverted')) mul += 0.10;
  // 鎮撫名號 — a 鎮撫 general steadies the realm: governance runs better (軍民賴安).
  if (honorificTheme(officer) === 'steward') mul += 0.10;
  if ((type === 'develop-commerce' || type === 'major-commerce')
      && hasAny(officer, COMMERCE_BOOST)) mul += 0.20;
  if ((type === 'build-defense' || type === 'major-defense' || type === 'upgrade-wall')
      && hasAny(officer, DEFENSE_BOOST)) mul += 0.20;
  if (type === 'improve-loyalty' && hasAny(officer, LOYALTY_BOOST)) mul += 0.25;
  if ((type === 'drill-troops' || type === 'military-farming')
      && hasAny(officer, DRILL_BOOST)) mul += 0.20;
  return Math.max(0.4, Math.min(2.0, mul));
}

// ─────────────────────────────────────────────────────────────────────
// 貪腐滋生 — how fast graft accrues in a city, by the character of the
// officers posted there. A venal governor lets it run; an incorruptible /
// frugal / iron-disciplined one keeps the clerks honest.
// ─────────────────────────────────────────────────────────────────────

const CORRUPTION_FAST = new Set(['greedy', 'gluttonous']);
const CORRUPTION_SLOW = new Set(['incorruptible', 'frugal', 'iron-discipline']);

/** Multiplier on a city's per-season corruption accrual from the officers
 *  stationed there. A greedy presence speeds it (×1.5); an upright one slows it
 *  (×0.5); both present roughly cancel. */
export function corruptionAccrualMultiplier(officers: Officer[]): number {
  let mul = 1;
  if (officers.some((o) => hasAny(o, CORRUPTION_FAST))) mul *= 1.5;
  if (officers.some((o) => hasAny(o, CORRUPTION_SLOW))) mul *= 0.5;
  return mul;
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
    // 攻城/陷陣 — a march on a city is a siege; the AI prefers siege & charge
    // specialists to lead it (so 攻城/先鋒/鬥將 actually get fielded forward).
    if (has(officer, 'siege-expert')) m *= 1.15;
    if (hasAny(officer, new Set(['vanguard', 'duelist']))) m *= 1.05;
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

/** 重傷不能理事 — a gravely (critical) wounded officer is bed-bound: they can't
 *  lead internal-affairs commands, run espionage, or seek duels until they
 *  recover. Minor/serious wounds only sap power (see tactical woundPenalty). */
export function isIncapacitated(officer: Officer): boolean {
  return officer.status === 'wounded' && officer.woundSeverity === 'critical';
}

/**
 * Combat-role fit — a selection-bias multiplier so the AI (and UI suggestions)
 * field the RIGHT specialist for a battle's shape: a 水將 for a river fight, a
 * 善守 to hold a wall, an 攻城 for a siege, a 鬥將 to lead a charge. Multiplies
 * the officer's war score for SORTING only; it does NOT touch effectiveStats, so
 * it never double-counts with tacticalDamageMul. Range ≈ [0.5, 1.4].
 */
export function combatRoleFit(
  officer: Officer,
  ctx: { isSiege?: boolean; isNaval?: boolean; isDefense?: boolean },
): number {
  const t = new Set(officer.traits ?? []);
  let mul = 1.0;
  if (ctx.isSiege && t.has('siege-expert')) mul *= 1.20;
  if (ctx.isSiege && t.has('ambush-master')) mul *= 1.08;
  if (ctx.isNaval && t.has('navy-master')) mul *= 1.20;
  if (ctx.isDefense && t.has('fortress-keeper')) mul *= 1.20;
  if (ctx.isDefense && (t.has('shield-bearer') || t.has('mountain-still'))) mul *= 1.08;
  if (!ctx.isDefense && (t.has('duelist') || t.has('vanguard') || t.has('martial-valor'))) mul *= 1.10;
  if (has(officer, 'cowardly')) mul *= 0.5;
  if (has(officer, 'frail')) mul *= 0.6;
  return mul;
}

// ─────────────────────────────────────────────────────────────────────
// T2 — Effective stats (trait bonuses on top of raw stats)
// ─────────────────────────────────────────────────────────────────────

const WAR_BOOST = new Set(['martial-valor', 'ironhearted', 'veteran', 'stoic-brave', 'bloodthirsty', 'matchless', 'robust', 'berserker', 'tiger-roar']);
const WAR_PENALTY = new Set(['frail', 'cowardly', 'drunkard', 'hunchback', 'sleepy']);
const LEAD_BOOST = new Set(['veteran', 'fortress-keeper', 'field-tactician', 'noble', 'iron-discipline', 'banner-master']);
const INT_BOOST = new Set(['erudite', 'wise', 'classics-scholar', 'mystical', 'strategist', 'precognitive', 'analytical', 'visionary', 'quick-witted', 'deep-schemer', 'unfathomable', 'sleeping-dragon', 'phoenix-mind']);
const POL_BOOST = new Set(['eloquent', 'diligent', 'honor-bound', 'composed', 'stern', 'meritocratic', 'pragmatic', 'self-disciplined']);
const POL_PENALTY = new Set(['oath-breaker', 'lazy', 'drunkard', 'short-sighted', 'spendthrift', 'opium-user']);
const CHA_BOOST = new Set(['charming', 'noble', 'graceful', 'eloquent', 'compassionate', 'refined', 'handsome-noble', 'beautiful', 'jade-face', 'gallant', 'humorous', 'sociable']);
const CHA_PENALTY = new Set(['suspicious', 'ruthless', 'bloodthirsty', 'oath-breaker', 'cruel', 'arrogant', 'ugly', 'cold', 'awkward', 'haughty']);

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
    // 文武雙全 — a small, even lift to every 圍 (fulfils the description's promise).
    if (t === 'versatile') { war += 2; leadership += 2; intelligence += 2; politics += 2; charisma += 2; }
    // 巨力 — raw thews lend martial weight.
    if (t === 'mighty-strength') war += 4;
    // 過目不忘 — a perfect memory sharpens the mind.
    if (t === 'photographic-memory') intelligence += 3;
    // 學究 — 拘泥細節而博學,智力大進。
    if (t === 'pedantic') intelligence += 5;
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
// 忠君愛國 — steadfast officers regenerate loyalty but (unlike LOYAL_TRAITS) are
// not made wholly unshakeable; their devotion is to the realm, not blind.
const STEADFAST_TRAITS = new Set(['patriotic', 'grateful', 'nostalgic']);

/** How much an officer's loyalty drifts each season-boundary, before
 *  events. Positive = loyalty regenerates; negative = officer drifts away. */
export function loyaltyDriftPerSeason(officer: Officer): number {
  let drift = 0;
  if (hasAny(officer, LOYAL_TRAITS)) drift += 1;
  if (hasAny(officer, STEADFAST_TRAITS)) drift += 1;
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
// T4b — Tactical (hex-battle) specialist modifiers
//
// The strategic combatModifiers above averages whole armies, where a single
// officer's "unit type" is ill-defined. The hex tactical battle, by contrast,
// gives every officer a concrete UnitType, terrain tile, time-of-day and turn —
// so the unit/terrain/night/charge specialist traits that the roster *promises*
// (神槍/弩匠/騎將/水將/山戰/林戰/夜襲/先鋒…) are wired HERE, where they're real.
// `attackUnits` multiplies the offense result into the blow and the defense
// result into damage taken.
// ─────────────────────────────────────────────────────────────────────

export interface TacticalTraitContext {
  unitType: UnitType;
  terrain: TerrainKind;
  isNight: boolean;
  isAmbush: boolean;   // attacker struck from concealment (hidden)
  turn: number;        // 1-based battle turn
  troopRatio: number;  // current troops / max troops (0–1)
  isAttacker: boolean;
  enemyForceId?: EntityId; // the foe's force — for the 復仇 vengeful check
}

/** Offensive damage multiplier from an attacker's tactical specialist traits. */
export function tacticalDamageMul(officer: Officer, ctx: TacticalTraitContext): number {
  const t = new Set(officer.traits ?? []);
  let mul = 1;
  // ── Unit-type specialists (the headline "broken promises") ──
  if (ctx.unitType === 'spearmen' && (t.has('spear-master') || t.has('pikeman'))) mul *= 1.15;
  if (ctx.unitType === 'archers' && (t.has('sharpshooter') || t.has('crossbow-adept'))) mul *= 1.15;
  if (ctx.unitType === 'cavalry' && t.has('cavalryman')) mul *= 1.15;
  if (ctx.unitType === 'navy' && t.has('navy-master')) mul *= 1.20;
  if (ctx.unitType === 'siege' && t.has('siege-expert')) mul *= 1.20;
  // ── 復仇 — +20% against the very force that slew a close relative ──
  if (t.has('vengeful') && ctx.enemyForceId
      && officer.killedRelativesBy
      && Object.values(officer.killedRelativesBy).includes(ctx.enemyForceId)) mul *= 1.20;
  // ── 為兄弟復仇 — +12% against the force that slew a sworn brother (no trait) ──
  if (ctx.enemyForceId
      && officer.killedSwornBy
      && Object.values(officer.killedSwornBy).includes(ctx.enemyForceId)) mul *= 1.12;
  // ── Terrain specialists ──
  if ((ctx.terrain === 'hill' || ctx.terrain === 'mountain') && t.has('hill-fighter')) mul *= 1.20;
  if (ctx.terrain === 'forest' && t.has('forest-fighter')) mul *= 1.20;
  if (ctx.terrain === 'desert' && t.has('desert-rider')) mul *= 1.25;
  if ((ctx.terrain === 'plain' || ctx.terrain === 'road') && t.has('field-tactician')) mul *= 1.10;
  // ── Time / opening / desperation ──
  if (ctx.isNight && t.has('night-raider')) mul *= 1.25;
  if (ctx.isAmbush && (t.has('ambush-master') || t.has('raid-style') || t.has('serpent-strike'))) mul *= 1.20;
  if (ctx.turn === 1 && (t.has('vanguard') || t.has('explosive'))) mul *= 1.20;       // 先鋒/暴烈 burst
  if (ctx.turn > 1 && t.has('explosive')) mul *= 0.92;                                // …then they tire
  if (ctx.troopRatio < 0.5 && (t.has('berserker') || t.has('one-eyed'))) mul *= 1.25; // cornered fury
  if (t.has('lightning-spear') && ctx.unitType === 'spearmen') mul *= 1.10;
  return mul;
}

/** Defensive multiplier on damage an officer TAKES from tactical specialist
 *  traits (<1 = takes less). */
export function tacticalDefenseMul(officer: Officer, ctx: TacticalTraitContext): number {
  const t = new Set(officer.traits ?? []);
  let mul = 1;
  if (t.has('shield-bearer')) mul *= 0.85;
  if (t.has('mountain-still') && (ctx.terrain === 'hill' || ctx.terrain === 'mountain')) mul *= 0.85;
  if (t.has('river-warden') && (ctx.terrain === 'river' || ctx.terrain === 'bridge')) mul *= 0.85;
  if (t.has('fortress-keeper') && (ctx.terrain === 'wall' || ctx.terrain === 'gate')) mul *= 0.85;
  return mul;
}

/** Per-officer morale aura granted to ADJACENT allies in tactical battles
 *  (旗令/開朗/沉勇). Caller sums it over neighbours. */
export function tacticalMoraleAura(officer: Officer): number {
  const t = new Set(officer.traits ?? []);
  let aura = 0;
  if (t.has('banner-master')) aura += 5;
  if (t.has('cheerful')) aura += 4;
  if (t.has('stoic-brave')) aura += 3;
  if (t.has('iron-discipline')) aura += 3;
  return aura;
}

// ─────────────────────────────────────────────────────────────────────
// T4c — Stratagem (計略) amplifiers
// ─────────────────────────────────────────────────────────────────────

/** Damage/effect multiplier a caster's traits lend to a battle stratagem. */
export function stratagemDamageMul(officer: Officer, stratagem: string): number {
  const t = new Set(officer.traits ?? []);
  let mul = 1;
  // General planners sharpen any 計.
  if (t.has('strategist')) mul *= 1.10;
  if (t.has('adaptable') || t.has('deep-schemer')) mul *= 1.10;
  // Element specialists.
  if (stratagem === 'fire-attack' && t.has('fire-tactician')) mul *= 1.30;
  if ((stratagem === 'chain-ships' || stratagem === 'flood' || stratagem === 'water-attack')
      && t.has('water-tactician')) mul *= 1.30;
  if (stratagem === 'rain-of-arrows' && (t.has('sharpshooter') || t.has('crossbow-adept'))) mul *= 1.20;
  if (stratagem === 'charge' && (t.has('cavalryman') || t.has('reckless'))) mul *= 1.15;
  return mul;
}

// ─────────────────────────────────────────────────────────────────────
// T4d — 舌戰 (word-war) prowess
// ─────────────────────────────────────────────────────────────────────

/** Multiplier on an officer's 舌戰 prowess from rhetorical traits. */
export function wordWarProwessMul(officer: Officer): number {
  const t = new Set(officer.traits ?? []);
  let mul = 1;
  if (t.has('eloquent') || t.has('persuasive')) mul *= 1.12;
  if (t.has('sharp-tongue')) mul *= 1.10;
  if (t.has('quick-witted') || t.has('humorous')) mul *= 1.06;
  if (t.has('composed') || t.has('reserved')) mul *= 1.05;   // unflappable under barbs
  if (t.has('taciturn')) mul *= 0.92;                         // few words to spend
  if (t.has('awkward')) mul *= 0.90;
  return mul;
}

// ─────────────────────────────────────────────────────────────────────
// T5 — Post-conquest behavior
// ─────────────────────────────────────────────────────────────────────

// Graded by how the trait shows mercy: a gentle soul wins the people most, an
// honour-bound knight somewhat, a merely lenient governor a little.
const MERCY_STRONG = new Set(['compassionate', 'benevolent']);
const MERCY_MILD = new Set(['chivalrous', 'honor-bound', 'noble', 'lenient', 'generous']);
const CRUEL_STRONG = new Set(['bloodthirsty', 'cruel']);
const CRUEL_MILD = new Set(['ruthless', 'wrathful']);

/** Post-conquest loyalty modifier for the captured city. Merciful
 *  commanders earn higher loyalty from the populace; brutal ones lower.
 *  Magnitude is tiered so the cluster doesn't all read as a flat ±15. */
export function conquestLoyaltyMod(commander: Officer): number {
  let mod = 0;
  if (hasAny(commander, MERCY_STRONG)) mod += 18;
  else if (hasAny(commander, MERCY_MILD)) mod += 12;
  if (hasAny(commander, CRUEL_STRONG)) mod -= 18;
  else if (hasAny(commander, CRUEL_MILD)) mod -= 12;
  return mod;
}

// ─────────────────────────────────────────────────────────────────────
// T5b — Economy: per-city income/upkeep from the character of its officers
// ─────────────────────────────────────────────────────────────────────

const THRIFTY_TRAITS = new Set(['frugal', 'modest-dress', 'self-disciplined', 'ascetic']);
const WASTEFUL_TRAITS = new Set(['spendthrift', 'gluttonous', 'opium-user', 'gambler']);

/** Multiplier on a city's gold income from the officers stationed there.
 *  A thrifty steward squeezes more from the same coin; a wastrel or a
 *  backroom dealer leaks it. Clamped to a gentle band. */
export function cityIncomeTraitMul(officers: Officer[]): number {
  let mul = 1;
  if (officers.some((o) => hasAny(o, THRIFTY_TRAITS))) mul += 0.08;
  if (officers.some((o) => hasAny(o, WASTEFUL_TRAITS))) mul -= 0.08;
  if (officers.some((o) => has(o, 'dark-political'))) mul += 0.05; // backroom deals fill the coffers…
  return Math.max(0.8, Math.min(1.2, mul));
}

// ─────────────────────────────────────────────────────────────────────
// T6 — Diplomacy modifiers
// ─────────────────────────────────────────────────────────────────────

const DIPLOMAT_TRAITS = new Set(['eloquent', 'graceful', 'noble', 'composed', 'persuasive', 'smooth', 'sociable']);
const TRICKSTER_TRAITS = new Set(['cunning', 'strategist', 'deep-schemer', 'dark-political']);
const SUSPICIOUS_TRAITS = new Set(['suspicious', 'paranoid', 'unfathomable']);

/** Bonus to the chance an opposing ruler accepts a diplomatic proposal. */
export function diplomacyProposalBonus(rulerOfficer: Officer): number {
  let bonus = 0;
  if (hasAny(rulerOfficer, DIPLOMAT_TRAITS)) bonus += 0.15;
  if (hasAny(rulerOfficer, TRICKSTER_TRAITS)) bonus += 0.10;
  // 內向 — a reticent envoy fares worse at the negotiating table (−10%).
  if ((rulerOfficer.traits as string[] | undefined)?.includes('introverted')) bonus -= 0.10;
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

const SPY_TRAITS = new Set(['cunning', 'strategist', 'precognitive', 'deep-schemer', 'shadow-walker', 'dark-political']);
const SPY_RESIST_TRAITS = new Set(['loyal', 'honor-bound', 'suspicious', 'composed', 'taciturn', 'paranoid', 'precognitive', 'unfathomable', 'fire-eyes']);

/** Bonus to the chance an espionage op succeeds. */
export function espionageBonus(agent: Officer): number {
  let bonus = 0;
  if (hasAny(agent, SPY_TRAITS)) bonus += 0.15;
  // 謀略名號 — a 謀略 general runs the spy-craft better (運籌帷幄).
  if (honorificTheme(agent) === 'guile') bonus += 0.10;
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

const HARDY_TRAITS = new Set(['weathered', 'stoic-brave', 'long-lived', 'ironhearted', 'robust', 'crane-longevity']);
const SICKLY_TRAITS = new Set(['frail', 'drunkard', 'sickly', 'opium-user']);

/** Multiplier on the annual death roll. <1 = longer lived. */
export function deathChanceMultiplier(officer: Officer): number {
  let mul = 1;
  if (hasAny(officer, HARDY_TRAITS)) mul *= 0.7;
  if (hasAny(officer, SICKLY_TRAITS)) mul *= 1.3;
  if (has(officer, 'long-lived')) mul *= 0.6; // historical longevity
  return mul;
}

// 醫者 — the medical axis (§2.4). A physician posted to a force speeds the
// recovery of its wounded; an officer's own constitution / a healer's care
// also colours how a plague treats them.
const FRAGILE_TO_PLAGUE = new Set(['sickly', 'frail', 'drunkard', 'opium-user']);
const PLAGUE_RESILIENT = new Set(['long-lived', 'robust', 'physician', 'crane-longevity']);

/** Extra wound-recovery multiplier a force gains from its best resident healer.
 *  Caller adds this on top of medicine/building bonuses. */
export function physicianRecoveryBonus(officers: Officer[]): number {
  return officers.some((o) => has(o, 'physician')) ? 0.2 : 0;
}

/** Per-officer multiplier on a plague's chance to carry them off. Frail bodies
 *  succumb; the hale and the well-doctored pull through. */
export function plagueDeathTraitMul(officer: Officer): number {
  let mul = 1;
  if (hasAny(officer, FRAGILE_TO_PLAGUE)) mul *= 1.5;
  if (hasAny(officer, PLAGUE_RESILIENT)) mul *= 0.7;
  return mul;
}

// ─────────────────────────────────────────────────────────────────────
// T9 — Recruitment
// ─────────────────────────────────────────────────────────────────────

/** Bonus to free-agent recruit chance for the prospective recruit. */
export function recruitChanceBonus(prospect: Officer): number {
  let bonus = 0;
  if (has(prospect, 'approachable')) bonus += 0.10;
  if (has(prospect, 'sociable')) bonus += 0.08;  // wide circle, easily courted
  if (has(prospect, 'charming')) bonus += 0.05; // willing to be charmed
  if (has(prospect, 'wandering-spirit')) bonus += 0.10; // a drifter, no roots to hold them
  if (has(prospect, 'noble')) bonus -= 0.10;
  if (has(prospect, 'aloof')) bonus -= 0.08;     // distant, hard to reach
  if (has(prospect, 'loyal')) bonus -= 0.15;    // loyal officers won't switch easily
  if (has(prospect, 'patriotic')) bonus -= 0.10; // devotion to the realm resists poaching
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
  if (has(ruler, 'cordial-host')) bonus += 0.05; // entertains and wins over guests
  if (has(ruler, 'meritocratic')) bonus += 0.05; // 任賢 — talent flocks to one who values it
  return bonus;
}

/** Traits that, when shared between two officers in the same force/city,
 *  can spark a friendship bond. Heroic / philosophical / aesthetic
 *  traits — not negative ones. Used by P11 bond formation and E marriage
 *  assimilation. Declared early so both sections can reference it. */
const BONDABLE_TRAITS: readonly string[] = [
  'chivalrous', 'mystical', 'classics-scholar', 'erudite', 'refined',
  'poetic-genius', 'martial-valor', 'honor-bound', 'pious',
  'loyal', 'composed', 'noble', 'graceful', 'compassionate',
  'benevolent', 'eloquent', 'wise',
  // 性情相投 — sociable / warm-hearted characters make friends readily.
  'sociable', 'cordial-host', 'humorous', 'gallant', 'cheerful', 'generous',
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
  // ── ≥70 tiers (broad pools) so well-rounded officers aren't locked out ──
  if (s.war >= 70) pool.push('robust', 'reckless', 'tiger-roar');
  if (s.war >= 80) pool.push('veteran', 'martial-valor', 'stoic-brave');
  if (s.war >= 90) pool.push('ironhearted', 'matchless', 'duelist');
  if (s.intelligence >= 70) pool.push('analytical', 'quick-witted', 'curious');
  if (s.intelligence >= 80) pool.push('strategist', 'erudite', 'wise');
  if (s.intelligence >= 90) pool.push('precognitive', 'composed', 'deep-schemer');
  if (s.leadership >= 70) pool.push('iron-discipline', 'banner-master');
  if (s.leadership >= 80) pool.push('field-tactician', 'veteran');
  if (s.leadership >= 90) pool.push('fortress-keeper');
  if (s.politics >= 70) pool.push('pragmatic', 'self-disciplined', 'meritocratic');
  if (s.politics >= 80) pool.push('diligent', 'honor-bound', 'composed');
  if (s.charisma >= 70) pool.push('sociable', 'humorous', 'gallant');
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
  'sunzi-bingfa':    'strategist',
  'sima-fa':         'veteran',
  'liu-tao':         'strategist',
  'mengde-manual':   'cunning',
  'art-of-war':      'strategist',
  'spring-autumn':   'honor-bound',
  'guanzi-shu':      'diligent',
  'liji-book':       'refined',
  'meng-zi':         'benevolent',
  'mozi-book':       'frugal',
  'zhuangzi-book':   'composed',
  'gongsun-longzi':  'eloquent',
  'jiuzhang-suan':   'classics-scholar',
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
  if (has(officer, 'poetic-genius') || has(officer, 'graceful') || has(officer, 'refined')) chance += 0.04;
  if (has(officer, 'drunkard')) chance += 0.05;
  if (has(officer, 'jealous')) chance += 0.04;  // quarrels with peers
  if (has(officer, 'gambler')) chance += 0.04;  // wins or loses a fortune
  if (has(officer, 'inventive') || has(officer, 'curious')) chance += 0.03; // tinkering
  if (has(officer, 'erudite') || has(officer, 'classics-scholar')) chance += 0.03;   // study breakthroughs
  return chance;
}

export interface FlavorEvent {
  kind: 'mystical' | 'poetic' | 'drunkard' | 'jealous' | 'gambler' | 'inventive' | 'classics-scholar';
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
  if (['diligent', 'erudite', 'wise', 'classics-scholar', 'cunning'].includes(traitId))
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
  // Tactical specialists (hex battle)
  if (traitId === 'spear-master' || traitId === 'pikeman') out.push({ zh: '統槍兵時傷害 +15%', en: 'Spear units +15% dmg' });
  if (traitId === 'sharpshooter' || traitId === 'crossbow-adept') out.push({ zh: '統弓弩時傷害 +15% · 矢雨 +20%', en: 'Archer units +15% · arrow-volley +20%' });
  if (traitId === 'cavalryman') out.push({ zh: '統騎兵時傷害 +15% · 突撃 +15%', en: 'Cavalry +15% dmg · charge +15%' });
  if (traitId === 'navy-master') out.push({ zh: '水軍傷害 +20%', en: 'Naval units +20% dmg' });
  if (traitId === 'hill-fighter') out.push({ zh: '山地/丘陵傷害 +20%', en: 'Hill/mountain +20% dmg' });
  if (traitId === 'forest-fighter') out.push({ zh: '森林傷害 +20%', en: 'Forest +20% dmg' });
  if (traitId === 'desert-rider') out.push({ zh: '荒漠傷害 +25%', en: 'Desert +25% dmg' });
  if (traitId === 'night-raider') out.push({ zh: '夜戰傷害 +25%', en: 'Night battle +25% dmg' });
  if (traitId === 'vanguard' || traitId === 'explosive') out.push({ zh: '首回合傷害 +20%', en: 'First-turn +20% dmg' });
  if (traitId === 'berserker') out.push({ zh: '兵力<50% 傷害 +25% · 一騎打 +10', en: 'Below 50% troops +25% · duel +10' });
  if (traitId === 'raid-style' || traitId === 'serpent-strike' || traitId === 'ambush-master') out.push({ zh: '伏擊/奇襲傷害 +20%', en: 'Ambush/raid +20% dmg' });
  if (traitId === 'shield-bearer') out.push({ zh: '受傷 −15%', en: 'Damage taken −15%' });
  if (traitId === 'mountain-still') out.push({ zh: '山地防守:受傷 −15%', en: 'Hill/mtn defense −15% taken' });
  if (traitId === 'river-warden') out.push({ zh: '沿江防守:受傷 −15%', en: 'River defense −15% taken' });
  if (traitId === 'banner-master') out.push({ zh: '相鄰友軍士氣 +5/回合 · 統率 +3', en: 'Adjacent allies +5 morale/turn · lead +3' });
  if (traitId === 'cheerful') out.push({ zh: '相鄰友軍士氣 +4/回合', en: 'Adjacent allies +4 morale/turn' });
  if (traitId === 'duelist') out.push({ zh: '一騎打擲骰 +20 · 好戰', en: 'Duel rolls +20 · seeks combat' });
  // Stratagems
  if (traitId === 'fire-tactician') out.push({ zh: '火計 +30% · 火攻 +1 回合', en: 'Fire stratagems +30% · burn +1 turn' });
  if (traitId === 'water-tactician') out.push({ zh: '水計 +30%', en: 'Water stratagems +30%' });
  if (traitId === 'strategist') out.push({ zh: '計略傷害 +10%', en: 'Stratagem dmg +10%' });
  if (traitId === 'adaptable' || traitId === 'deep-schemer') out.push({ zh: '計略傷害 +10% · 諜報 +', en: 'Stratagem dmg +10% · espionage +' });
  // 舌戰
  if (traitId === 'eloquent' || traitId === 'persuasive') out.push({ zh: '舌戰口才 ×1.12', en: 'Word-war prowess ×1.12' });
  if (traitId === 'sharp-tongue') out.push({ zh: '舌戰口才 ×1.10', en: 'Word-war prowess ×1.10' });
  if (traitId === 'taciturn') out.push({ zh: '舌戰口才 ×0.92(寡言)', en: 'Word-war ×0.92 (few words)' });
  // Convoy
  if (traitId === 'stern' || traitId === 'tireless-march') out.push({ zh: '輜重行軍 +10%', en: 'Convoy march +10%' });
  if (traitId === 'iron-discipline') out.push({ zh: '輜重行軍 +5% · 本部士氣 +', en: 'Convoy +5% · unit morale +' });
  // Medical (§2.4)
  if (traitId === 'physician') out.push({ zh: '同勢力傷者養傷 +20% · 抗瘟疫', en: 'Force wound recovery +20% · plague-resilient' });
  if (traitId === 'herbalist') out.push({ zh: '採藥 + · 減瘟疫之害', en: 'Medicine gather + · eases plague' });
  // Economy
  if (THRIFTY_TRAITS.has(traitId)) out.push({ zh: '駐城金收 +8%', en: 'City gold income +8%' });
  if (WASTEFUL_TRAITS.has(traitId)) out.push({ zh: '駐城金收 −8%', en: 'City gold income −8%' });
  if (traitId === 'dark-political') out.push({ zh: '駐城金收 +5% · 諜報 + · 易入宦黨', en: 'City gold +5% · espionage + · eunuch faction' });
  if (traitId === 'patriotic' || traitId === 'grateful' || traitId === 'nostalgic') out.push({ zh: '忠誠 +1/季', en: 'Loyalty +1/season' });
  if (traitId === 'versatile') out.push({ zh: '五圍各 +2', en: 'All five stats +2' });
  if (traitId === 'mighty-strength') out.push({ zh: '武力 +4', en: 'War +4' });
  // Stats
  const statMap: Record<string, string[]> = {
    'martial-valor': ['武力 +3'], 'ironhearted': ['武力 +3'], 'veteran': ['武力 +3 · 統率 +3'],
    'stoic-brave': ['武力 +3'], 'bloodthirsty': ['武力 +3 · 魅力 −3'], 'matchless': ['武力 +3'],
    'fortress-keeper': ['統率 +3'], 'field-tactician': ['統率 +3'], 'noble': ['統率 +3 · 魅力 +3'],
    'erudite': ['知力 +3'], 'wise': ['知力 +3'], 'classics-scholar': ['知力 +3'], 'mystical': ['知力 +3'],
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
  if (has(officer, 'gambler')) {
    const won = rng() < 0.5;
    pool.push({
      kind: 'gambler',
      loyaltyDelta: won ? 2 : -3,
      textZh: won
        ? `${officer.name.zh}賭場豪擲,竟連莊大勝,意氣風發。`
        : `${officer.name.zh}一擲千金而輸個精光,垂頭喪氣。`,
      textEn: won
        ? `${officer.name.en} hit a hot streak at dice — spirits soar.`
        : `${officer.name.en} gambled it all away — morale sinks.`,
    });
  }
  if (has(officer, 'inventive') || has(officer, 'curious')) {
    pool.push({
      kind: 'inventive',
      loyaltyDelta: 1,
      statDelta: { intelligence: 1 },
      textZh: `${officer.name.zh}巧思忽至,試造新器,智力 +1。`,
      textEn: `${officer.name.en} tinkered out a clever contrivance — intelligence +1.`,
    });
  }
  if (has(officer, 'erudite') || has(officer, 'classics-scholar')) {
    pool.push({
      kind: 'classics-scholar',
      loyaltyDelta: 1,
      statDelta: { politics: 1 },
      textZh: `${officer.name.zh}埋首典籍,有所得,政治 +1。`,
      textEn: `${officer.name.en} pored over the classics and gained insight — politics +1.`,
    });
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}

// ─────────────────────────────────────────────────────────────────────
// Trait coverage registry — which traits any system actually reads.
//
// This is the single source of truth for: (1) officerGen, so brand-new
// recruits aren't handed dead flavor traits; (2) the OfficerDetail UI, which
// badges a trait "(風味)" when nothing reads it; (3) the GUIDE §2.3 wired/flavor
// split. Built by unioning every trait Set defined above plus the traits that
// are checked by string literal here or in sibling systems (duel/debate/
// convoy/courtFactions/training/growth). When you wire a new trait, add it to a
// Set above (preferred) or to EXTRA_WIRED below.
// ─────────────────────────────────────────────────────────────────────

const EXTRA_WIRED: readonly string[] = [
  // inline-checked in this module (commandFit / combatModifiers / effectiveStats)
  'pedantic', 'introverted', // 學究(智+5)、內向(內政+10%/外交−10%)
  'cautious', 'reckless', 'weathered', 'siege-expert', 'ambush-master',
  'drunkard', 'versatile', 'mighty-strength', 'photographic-memory', 'cowardly',
  'frail', 'field-tactician', 'fortress-keeper', 'martial-valor', 'veteran',
  'ironhearted', 'stoic-brave', 'bloodthirsty',
  // tactical specialists (tacticalDamageMul / tacticalDefenseMul / aura)
  'spear-master', 'pikeman', 'sharpshooter', 'crossbow-adept', 'cavalryman',
  'navy-master', 'hill-fighter', 'forest-fighter', 'desert-rider',
  'night-raider', 'raid-style', 'serpent-strike', 'vanguard', 'explosive',
  'one-eyed', 'lightning-spear', 'shield-bearer', 'mountain-still',
  'river-warden', 'banner-master', 'cheerful', 'berserker',
  // stratagem amplifiers
  'strategist', 'adaptable', 'deep-schemer', 'fire-tactician', 'water-tactician',
  // 舌戰 prowess
  'eloquent', 'persuasive', 'sharp-tongue', 'quick-witted', 'humorous',
  'composed', 'reserved', 'taciturn', 'awkward',
  // recruitment
  'approachable', 'sociable', 'charming', 'wandering-spirit', 'aloof',
  'patriotic', 'oath-breaker', 'cordial-host', 'meritocratic', 'generous', 'noble',
  // duel.ts / debate.ts / afflictions.ts
  'matchless', 'wrathful', 'sickly', 'duelist',
  'arrogant', 'vainglorious', 'stubborn', 'impatient',
  // courtFactions.ts
  'sycophant', 'cunning', 'refined', 'benevolent', 'honest-to-fault',
  'dark-political', 'court-favorite', 'crowd-pleaser',
  'smiling-tiger', 'smiling-blade', 'hates-evil',
  // read by other systems: 嫉妒 rival/jealousy (store/resolution/wishes),
  // 玉心 corruption-immunity (officerFate).
  'envious', 'jade-heart',
  // convoy.ts
  'diligent', 'lazy', 'stern', 'iron-discipline', 'tireless-march',
  // newly wired this pass: 復仇 (combat vs killer force), 好色 (seduction),
  // 仁孝 (kin-anchored loyalty), 守信 (diplomacy credibility).
  'vengeful', 'lustful', 'filial', 'keeps-word',
  // §2.4 medical axis: wound recovery + plague mitigation
  'physician', 'herbalist',
  // flavor events + item/policy resonance grants
  'mystical', 'poetic-genius', 'graceful', 'jealous', 'gambler', 'inventive',
  'curious', 'erudite', 'classics-scholar', 'pious', 'frugal', 'honor-bound', 'wise',
  'compassionate',
];

const WIRED_TRAIT_IDS: ReadonlySet<string> = new Set<string>([
  ...INTERNAL_BOOST_TRAITS, ...INTERNAL_PENALTY_TRAITS, ...COMMERCE_BOOST,
  ...DEFENSE_BOOST, ...LOYALTY_BOOST, ...DRILL_BOOST, ...CORRUPTION_FAST,
  ...CORRUPTION_SLOW, ...WAR_BOOST, ...WAR_PENALTY, ...LEAD_BOOST, ...INT_BOOST,
  ...POL_BOOST, ...POL_PENALTY, ...CHA_BOOST, ...CHA_PENALTY, ...LOYAL_TRAITS,
  ...FLIGHTY_TRAITS, ...AMBITIOUS_TRAITS, ...STEADFAST_TRAITS, ...MERCY_STRONG,
  ...MERCY_MILD, ...CRUEL_STRONG, ...CRUEL_MILD, ...THRIFTY_TRAITS,
  ...WASTEFUL_TRAITS, ...DIPLOMAT_TRAITS, ...TRICKSTER_TRAITS,
  ...SUSPICIOUS_TRAITS, ...SPY_TRAITS, ...SPY_RESIST_TRAITS, ...HARDY_TRAITS,
  ...SICKLY_TRAITS, ...HOT_TRAITS, ...SAGE_TRAITS, ...BONDABLE_TRAITS,
  ...CRUEL_TRAITS, ...GENTLE_TRAITS, ...EXTRA_WIRED,
]);

/** True if at least one game system reads this trait. */
export function isWiredTrait(id: string): boolean {
  return WIRED_TRAIT_IDS.has(id);
}

/** True if NO system reads this trait (pure flavor / cosmetic). */
export function isFlavorOnlyTrait(id: string): boolean {
  return !WIRED_TRAIT_IDS.has(id);
}

/** All trait ids that any system reads — used by officerGen to avoid handing
 *  new recruits dead traits. */
export function wiredTraitIds(): string[] {
  return [...WIRED_TRAIT_IDS];
}

/**
 * 戰績習性 — a trait an officer EARNS from a sustained record of deeds, checked
 * each season. Demonstrated mastery hardens into character: a serial duellist
 * becomes a 鬥將, a city-taker an 攻城 expert, and so on. Returns at most one new
 * (wired, not-yet-held) trait, or null. Granted by the season tick in store.ts.
 */
export function deedTraitCandidate(officer: Officer, deeds: HeroicDeeds | undefined): string | null {
  if (!deeds) return null;
  const have = new Set((officer.traits ?? []) as string[]);
  if ((deeds.duelsWon ?? 0) >= 3 && !have.has('duelist')) return 'duelist';
  if ((deeds.citiesTaken ?? 0) >= 5 && !have.has('siege-expert')) return 'siege-expert';
  if ((deeds.battlesWon ?? 0) >= 10 && !have.has('veteran')) return 'veteran';
  if ((deeds.espionageSuccess ?? 0) >= 5 && !have.has('cunning')) return 'cunning';
  if ((deeds.killsTroops ?? 0) >= 2000 && !have.has('shadow-walker')) return 'shadow-walker';
  // 舌戰成名 — a record of won word-wars earns 雄辯 (which then sharpens future
  // 舌戰 prowess); a serial 罵倒er earns the feared 寡言鋒 (biting, few words).
  if ((deeds.debateRouts ?? 0) >= 3 && !have.has('sharp-tongue')) return 'sharp-tongue';
  if ((deeds.debatesWon ?? 0) >= 5 && !have.has('eloquent')) return 'eloquent';
  return null;
}
