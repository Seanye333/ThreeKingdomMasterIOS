import type {
  City,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Relation,
  ReportEntry,
} from '../types';
import { getRelation, pairKey } from '../types';

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
  target: Force;
  targetTotalTroops: number;
  playerTotalTroops: number;
  diplomacy: DiplomaticState;
  date: GameDate;
  rng?: () => number;
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
  const chance = clamp(
    0.05,
    0.95,
    current.score / 200 +
      ctx.playerRulerCharisma / 400 +
      Math.max(-0.3, Math.min(0.3, strengthFactor * 0.2)),
  );
  const roll = rng();

  if (roll < chance) {
    const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
      ...r,
      status: 'allied',
      score: clamp(-100, 100, r.score + 30),
      expiresAt: undefined,
    }));
    return {
      ok: true,
      accepted: true,
      message: `${ctx.target.name.en} accepts an alliance with ${ctx.player.name.en}!`,
      diplomacy: next,
      scoreDelta: 30,
    };
  }

  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    score: clamp(-100, 100, r.score + 5),
  }));
  return {
    ok: true,
    accepted: false,
    message: `${ctx.target.name.en} declines the alliance, but the gesture is noted.`,
    diplomacy: next,
    scoreDelta: 5,
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

  const chance = clamp(0.1, 0.95, current.score / 150 + 0.55);
  const roll = rng();
  if (roll < chance) {
    const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
      ...r,
      status: 'non-aggression',
      score: clamp(-100, 100, r.score + 15),
      expiresAt: addSeasons(ctx.date, NAP_DURATION_SEASONS),
    }));
    return {
      ok: true,
      accepted: true,
      message: `${ctx.target.name.en} agrees to a non-aggression pact for ${NAP_DURATION_SEASONS} seasons.`,
      diplomacy: next,
      scoreDelta: 15,
    };
  }
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    score: clamp(-100, 100, r.score + 3),
  }));
  return {
    ok: true,
    accepted: false,
    message: `${ctx.target.name.en} refuses the pact.`,
    diplomacy: next,
    scoreDelta: 3,
  };
}

export function payTribute(
  ctx: DiplomaticContext,
  amount: number,
): DiplomaticOutcome {
  const gain = Math.floor(amount / 10);
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
  const next = setRelation(ctx.diplomacy, ctx.player.id, ctx.target.id, (r) => ({
    ...r,
    status: 'non-aggression',
    score: clamp(-100, 100, r.score + HOSTAGE_RELATION_BONUS),
    expiresAt: addSeasons(ctx.date, NAP_DURATION_SEASONS * 2),
  }));
  return {
    ok: true,
    accepted: true,
    message: `${ctx.target.name.en} accepts the hostage. A long peace is sworn (${NAP_DURATION_SEASONS * 2} seasons).`,
    diplomacy: next,
    scoreDelta: HOSTAGE_RELATION_BONUS,
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

function addSeasons(date: GameDate, count: number): GameDate {
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

function isOnOrAfter(a: GameDate, b: GameDate): boolean {
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
