import type {
  City,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Officer,
  Relation,
  ReportEntry,
} from '../types';
import { getRelation, pairKey } from '../types';
import { diplomacyProposalBonus, diplomacyResistance } from './traitEffects';

export const NAP_DURATION_SEASONS = 8;
export const ALLIANCE_PROPOSAL_COST = 500;
export const NAP_PROPOSAL_COST = 200;

export type DiplomaticAction =
  | { kind: 'propose-alliance' }
  | { kind: 'propose-nap' }
  | { kind: 'pay-tribute'; amount: number };

export interface DiplomaticOutcome {
  ok: boolean;
  accepted?: boolean;
  message: string;
  diplomacy: DiplomaticState;
  scoreDelta?: number;
}

export interface DiplomaticContext {
  player: Force;
  playerRulerCharisma: number;
  /** Optional — when provided, ruler's personality traits modify proposal odds. */
  playerRuler?: Officer;
  target: Force;
  /** Optional — when provided, target ruler's suspicious/paranoid traits
   *  resist player proposals (T6/P1). */
  targetRuler?: Officer;
  targetTotalTroops: number;
  playerTotalTroops: number;
  diplomacy: DiplomaticState;
  date: GameDate;
  rng?: () => number;
  /** Multiplier on relation score deltas — driven by 大鴻臚 (Herald) title. */
  diplomacyMultiplier?: number;
  /** 信譽 — the proposer's reputation (0–100, default 100). Below 100 it shaves
   *  the odds of any pact: a known oath-breaker is harder to trust. */
  proposerCredibility?: number;
  /** 積怨 — the target's resentment of the proposer (0–100, default 0). A
   *  bitter foe is far less inclined to take your hand. */
  targetGrudge?: number;
}

/** Credibility's drag on acceptance odds: 0 at full repute, −0.4 at zero. */
function credibilityMod(ctx: DiplomaticContext): number {
  const cred = ctx.proposerCredibility ?? 100;
  let mod = (Math.max(0, Math.min(100, cred)) - 100) / 250;
  // 守信 — a ruler famed for keeping their word is trusted more readily
  // (the mirror of the already-wired 失信 oath-breaker).
  if (ctx.playerRuler && (ctx.playerRuler.traits as string[] | undefined ?? []).includes('keeps-word')) {
    mod += 0.15;
  }
  return mod;
}

/** Grudge's drag on acceptance odds: 0 at no resentment, −0.5 at boiling. */
function grudgeMod(ctx: DiplomaticContext): number {
  const g = Math.max(0, Math.min(100, ctx.targetGrudge ?? 0));
  return -g / 200;
}

/** Round-half-up so a 1.2 multiplier on a +5 base still feels generous. */
function scaleDelta(delta: number, mul: number | undefined): number {
  if (!mul || mul === 1) return delta;
  return delta >= 0
    ? Math.ceil(delta * mul)
    : Math.floor(delta * mul);
}

export function proposeAlliance(ctx: DiplomaticContext): DiplomaticOutcome {
  const rng = ctx.rng ?? Math.random;
  const current = getRelation(ctx.diplomacy, ctx.player.id, ctx.target.id);
  if (current.status === 'allied') {
    return {
      ok: false,
      message: `Already allied with ${ctx.target.name.en}.`,
      diplomacy: ctx.diplomacy,
    };
  }

  // Acceptance: relation share + charisma factor − strength imbalance.
  const strengthFactor =
    ctx.targetTotalTroops > 0
      ? (ctx.playerTotalTroops - ctx.targetTotalTroops) / Math.max(ctx.targetTotalTroops, 1)
      : 0.5;
  const traitBonus = ctx.playerRuler ? diplomacyProposalBonus(ctx.playerRuler) : 0;
  const targetResist = ctx.targetRuler ? diplomacyResistance(ctx.targetRuler) : 0;
  const chance = clamp(
    0.05,
    0.95,
    current.score / 200 +
      ctx.playerRulerCharisma / 400 +
      Math.max(-0.3, Math.min(0.3, strengthFactor * 0.2)) +
      traitBonus -
      targetResist +
      credibilityMod(ctx) +
      grudgeMod(ctx),
  );
  const roll = rng();

  if (roll < chance) {
    const delta = scaleDelta(30, ctx.diplomacyMultiplier);
    const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
      ...r,
      status: 'allied',
      score: clamp(-100, 100, r.score + delta),
      expiresAt: undefined,
    }));
    return {
      ok: true,
      accepted: true,
      message: `${ctx.target.name.en} accepts an alliance with ${ctx.player.name.en}!`,
      diplomacy: next,
      scoreDelta: delta,
    };
  }

  const delta = scaleDelta(5, ctx.diplomacyMultiplier);
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    score: clamp(-100, 100, r.score + delta),
  }));
  return {
    ok: true,
    accepted: false,
    message: `${ctx.target.name.en} declines the alliance, but the gesture is noted.`,
    diplomacy: next,
    scoreDelta: delta,
  };
}

export function proposeNonAggression(
  ctx: DiplomaticContext,
): DiplomaticOutcome {
  const rng = ctx.rng ?? Math.random;
  const current = getRelation(ctx.diplomacy, ctx.player.id, ctx.target.id);
  if (current.status !== 'neutral') {
    return {
      ok: false,
      message:
        current.status === 'allied'
          ? 'Already allied — no pact needed.'
          : 'A non-aggression pact is already active.',
      diplomacy: ctx.diplomacy,
    };
  }

  const napTraitBonus = ctx.playerRuler ? diplomacyProposalBonus(ctx.playerRuler) : 0;
  const napTargetResist = ctx.targetRuler ? diplomacyResistance(ctx.targetRuler) : 0;
  const chance = clamp(0.1, 0.95, current.score / 150 + 0.55 + napTraitBonus - napTargetResist + credibilityMod(ctx) + grudgeMod(ctx));
  const roll = rng();
  if (roll < chance) {
    const delta = scaleDelta(15, ctx.diplomacyMultiplier);
    const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
      ...r,
      status: 'non-aggression',
      score: clamp(-100, 100, r.score + delta),
      expiresAt: addSeasons(ctx.date, NAP_DURATION_SEASONS),
    }));
    return {
      ok: true,
      accepted: true,
      message: `${ctx.target.name.en} agrees to a non-aggression pact for ${NAP_DURATION_SEASONS} seasons.`,
      diplomacy: next,
      scoreDelta: delta,
    };
  }
  const delta = scaleDelta(3, ctx.diplomacyMultiplier);
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    score: clamp(-100, 100, r.score + delta),
  }));
  return {
    ok: true,
    accepted: false,
    message: `${ctx.target.name.en} refuses the pact.`,
    diplomacy: next,
    scoreDelta: delta,
  };
}

export function payTribute(
  ctx: DiplomaticContext,
  amount: number,
): DiplomaticOutcome {
  const gain = scaleDelta(Math.floor(amount / 10), ctx.diplomacyMultiplier);
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    score: clamp(-100, 100, r.score + gain),
  }));
  return {
    ok: true,
    accepted: true,
    message: `${ctx.target.name.en} accepts ${amount} gold; relations improve by ${gain}.`,
    diplomacy: next,
    scoreDelta: gain,
  };
}

export function breakAlliance(
  diplomacy: DiplomaticState,
  forceA: EntityId,
  forceB: EntityId,
): DiplomaticState {
  return setRelation(diplomacy, forceA, forceB, (r) => ({
    ...r,
    status: 'neutral',
    score: clamp(-100, 100, r.score - 50),
    expiresAt: undefined,
  }));
}

// ──────────────────────────────────────────────────────────────────────
// Hostage exchange — surrender one of your officers to live at the
// target's court as guarantor of peace. Big relation boost (50) + NAP.
// ──────────────────────────────────────────────────────────────────────
export const HOSTAGE_RELATION_BONUS = 50;

export function proposeHostage(
  ctx: DiplomaticContext,
): DiplomaticOutcome {
  const current = getRelation(ctx.diplomacy, ctx.player.id, ctx.target.id);
  if (current.status === 'allied') {
    return {
      ok: false,
      message: `Already allied with ${ctx.target.name.en} — no hostage needed.`,
      diplomacy: ctx.diplomacy,
    };
  }
  // Acceptance: high — hostages are a near-guaranteed peace signal
  const delta = scaleDelta(HOSTAGE_RELATION_BONUS, ctx.diplomacyMultiplier);
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    status: 'non-aggression',
    score: clamp(-100, 100, r.score + delta),
    expiresAt: addSeasons(ctx.date, NAP_DURATION_SEASONS * 2),
  }));
  return {
    ok: true,
    accepted: true,
    message: `${ctx.target.name.en} accepts the hostage. A long peace is sworn (${NAP_DURATION_SEASONS * 2} seasons).`,
    diplomacy: next,
    scoreDelta: delta,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Per-season tick: expire NAPs and decay relations gently.
// ──────────────────────────────────────────────────────────────────────

export interface DiplomacyTickInput {
  diplomacy: DiplomaticState;
  date: GameDate;
  isYearTransition: boolean;
}

export interface DiplomacyTickOutput {
  diplomacy: DiplomaticState;
  entries: ReportEntry[];
}

export function tickDiplomacy(input: DiplomacyTickInput): DiplomacyTickOutput {
  const next: Record<string, Relation> = {};
  const entries: ReportEntry[] = [];

  for (const [key, rel] of Object.entries(input.diplomacy.relations)) {
    let updated: Relation = rel;
    // Expire non-aggression pacts whose date has passed.
    if (
      updated.status === 'non-aggression' &&
      updated.expiresAt &&
      isOnOrAfter(input.date, updated.expiresAt)
    ) {
      updated = {
        ...updated,
        status: 'neutral',
        expiresAt: undefined,
      };
      entries.push({
        cityId: null,
        kind: 'note',
        text: `The non-aggression pact between ${rel.forceA} and ${rel.forceB} has expired.`,
        textZh: `${rel.forceA}與${rel.forceB}之互不侵犯之盟，今已期滿。`,
      });
    }
    // Yearly relation decay toward 0 (slow regression to mean).
    if (input.isYearTransition && updated.status === 'neutral') {
      const drift = updated.score > 0 ? -2 : updated.score < 0 ? 2 : 0;
      updated = { ...updated, score: updated.score + drift };
    }
    next[key] = updated;
  }

  return { diplomacy: { relations: next }, entries };
}

// ──────────────────────────────────────────────────────────────────────
// 動態聯盟 — coalitions against a runaway power (合縱).
//
// When one force outgrows the field, the lesser lords cool toward it (and
// shed their pacts with it) while warming to one another, eventually banding
// into non-aggression and alliance. The existing AI then acts on the shifted
// relations — so the late game stops being a foregone conclusion. Pure &
// deterministic (no rng); the player's own pacts are never overridden, but a
// player who becomes the hegemon will see the realm turn against *them*.
// ──────────────────────────────────────────────────────────────────────

/** A force is "hegemon" at ≥35% of held cities AND ≥1.5× the runner-up. */
const HEGEMON_CITY_SHARE = 0.35;
const HEGEMON_LEAD_RATIO = 1.5;
const COALITION_COOL_PER_SEASON = 7;  // non-hegemons' relations with the hegemon fall
const COALITION_WARM_PER_SEASON = 5;  // and rise among themselves

export interface CoalitionInput {
  diplomacy: DiplomaticState;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null | undefined;
  date: GameDate;
}

export interface CoalitionOutput {
  diplomacy: DiplomaticState;
  entries: ReportEntry[];
  /** The detected hegemon, or null when no force dominates. */
  hegemonId: EntityId | null;
}

export function applyCoalitionPressure(input: CoalitionInput): CoalitionOutput {
  const { cities, forces, playerForceId, date } = input;
  let diplomacy = input.diplomacy;
  const entries: ReportEntry[] = [];

  // City counts per living force.
  const count: Record<string, number> = {};
  let total = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId && forces[c.ownerForceId]) {
      count[c.ownerForceId] = (count[c.ownerForceId] ?? 0) + 1;
      total++;
    }
  }
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  // Need a real field (≥3 powers, enough cities) and a clear runaway leader.
  if (ranked.length < 3 || total < 6) return { diplomacy, entries, hegemonId: null };
  const [hegId, hegCities] = ranked[0];
  const secondCities = ranked[1][1];
  if (hegCities < total * HEGEMON_CITY_SHARE || hegCities < secondCities * HEGEMON_LEAD_RATIO) {
    return { diplomacy, entries, hegemonId: null };
  }

  const others = ranked.slice(1).map(([id]) => id);

  // 1) Every AI non-hegemon cools toward the hegemon; once sour, pacts with it
  //    lapse (a coalition will not honour a truce with the tyrant). The player's
  //    own relations are left to the player — except that AIs naturally cool
  //    toward a *player* hegemon, which is exactly the anti-snowball pressure.
  for (const x of others) {
    if (x === playerForceId) continue;
    diplomacy = setRelation(diplomacy, x, hegId, (r) => {
      const score = clamp(-100, 100, r.score - COALITION_COOL_PER_SEASON);
      const lapse = r.status !== 'neutral' && score <= -10;
      return {
        ...r,
        score,
        status: lapse ? 'neutral' : r.status,
        expiresAt: lapse ? undefined : r.expiresAt,
      };
    });
  }

  // 2) The AI non-hegemons warm to one another, sliding into NAP then alliance.
  const coalition = others.filter((x) => x !== playerForceId);
  for (let i = 0; i < coalition.length; i++) {
    for (let j = i + 1; j < coalition.length; j++) {
      diplomacy = setRelation(diplomacy, coalition[i], coalition[j], (r) => {
        const score = clamp(-100, 100, r.score + COALITION_WARM_PER_SEASON);
        let status = r.status;
        let expiresAt = r.expiresAt;
        if (score >= 75) {
          status = 'allied';
          expiresAt = undefined;
        } else if (r.status === 'neutral' && score >= 40) {
          status = 'non-aggression';
          expiresAt = addSeasons(date, NAP_DURATION_SEASONS);
        }
        return { ...r, score, status, expiresAt };
      });
    }
  }

  // 3) A once-a-year note so the shift is legible (especially to a hegemon player).
  if (date.season === 'spring') {
    const heg = forces[hegId]?.name;
    if (hegId === playerForceId) {
      entries.push({
        cityId: null,
        kind: 'note',
        text: `Your dominance unsettles the realm — the other lords begin to draw together against you.`,
        textZh: `天下側目於君之強盛,諸侯漸生合縱之心,隱然將共抗之。`,
      });
    } else if (heg) {
      entries.push({
        cityId: null,
        kind: 'note',
        text: `Wary of ${heg.en}'s growing power, the lesser lords draw closer together.`,
        textZh: `諸侯憚${heg.zh}之盛,合縱之勢漸成。`,
      });
    }
  }

  return { diplomacy, entries, hegemonId: hegId };
}

// ──────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────

function setRelation(
  state: DiplomaticState,
  forceA: EntityId,
  forceB: EntityId,
  update: (current: Relation) => Relation,
): DiplomaticState {
  const key = pairKey(forceA, forceB);
  const current = getRelation(state, forceA, forceB);
  return {
    relations: {
      ...state.relations,
      [key]: update(current),
    },
  };
}

function clamp(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function addSeasons(date: GameDate, count: number): GameDate {
  const seasons: Array<GameDate['season']> = ['spring', 'summer', 'autumn', 'winter'];
  let year = date.year;
  let idx = seasons.indexOf(date.season);
  for (let i = 0; i < count; i++) {
    idx++;
    if (idx >= seasons.length) {
      idx = 0;
      year++;
    }
  }
  return { year, season: seasons[idx] };
}

export function isOnOrAfter(a: GameDate, b: GameDate): boolean {
  if (a.year !== b.year) return a.year > b.year;
  const seasons: Array<GameDate['season']> = ['spring', 'summer', 'autumn', 'winter'];
  return seasons.indexOf(a.season) >= seasons.indexOf(b.season);
}

export function computeTotalTroops(
  forceId: EntityId,
  cities: Record<EntityId, City>,
): number {
  let total = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId === forceId) total += c.troops;
  }
  return total;
}

// Re-export helpers; the UI uses them.
export { getRelation, pairKey };
