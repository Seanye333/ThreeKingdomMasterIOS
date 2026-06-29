/**
 * §7.1 外交縱橫 — the *unequal* and *multilateral* half of diplomacy, layered on
 * the equal-footing pacts in systems/diplomacy.ts. Four interlocking strands,
 * all pure & rng-injectable so the store/AI can drive both player and AI:
 *
 *  ① 稱臣納貢・附庸  — a hierarchical bond above mere alliance. A lesser realm
 *     submits (`force.vassalOfForceId`): shielded from its lord, paying season
 *     tribute (systems/resolution), summonable to war (徵召), and apt to throw
 *     off the yoke (叛附) once it outgrows or resents its master.
 *  ② 共討會盟・聯軍  — a player-led war league (`WarCoalition`); members bias
 *     their attacks toward the sworn foe and the 盟主's name rises or falls with
 *     the outcome.
 *  ③ 索貢・最後通牒  — coercive diplomacy: extort gold/grain or demand submission
 *     under threat of war.
 *  ④ 盟約義務・連坐  — alliances that *oblige*: a called ally that answers rises
 *     in repute, one that sits idle is marked down.
 *
 * Protection (suzerain⇄vassal, coalition members) rides the existing relation
 * `status: 'allied'`, so isHostilePermitted already blocks those strikes — no
 * new RelationStatus, no touching its ~15 callers. The hierarchy/tribute/徵召
 * semantics live on `force.vassalOfForceId`.
 */
import type {
  CallToArms,
  City,
  DiplomaticDemand,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Officer,
  PassageGrant,
  PeaceOffer,
  Relation,
  ReportEntry,
  RelationStatus,
  RulerPersonality,
  WarCoalition,
} from '../types';
import { getRelation, isHostilePermitted, pairKey } from '../types';
import { addSeasons, isOnOrAfter } from './diplomacy';
import { personalityDiplomacyAppetite } from './rulerPersonality';

function clamp(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function setRelation(
  state: DiplomaticState,
  a: EntityId,
  b: EntityId,
  update: (current: Relation) => Relation,
): DiplomaticState {
  const key = pairKey(a, b);
  return { relations: { ...state.relations, [key]: update(getRelation(state, a, b)) } };
}

/** Total garrison a force fields across all its cities. */
export function forceTroops(forceId: EntityId, cities: Record<EntityId, City>): number {
  let total = 0;
  for (const c of Object.values(cities)) if (c.ownerForceId === forceId) total += c.troops;
  return total;
}

/** Cities a force still holds. A force at 0 has been wiped from the map. */
export function forceCityCount(forceId: EntityId, cities: Record<EntityId, City>): number {
  let n = 0;
  for (const c of Object.values(cities)) if (c.ownerForceId === forceId) n++;
  return n;
}

// ──────────────────────────────────────────────────────────────────────
// ① 稱臣納貢 — vassalage
// ──────────────────────────────────────────────────────────────────────

/** Relation floor held while a vassalage stands (a protected subordinate). */
export const VASSAL_RELATION_FLOOR = 60;

export interface SubjugationContext {
  /** The would-be suzerain (the demanding side). */
  suzerainTroops: number;
  /** The would-be vassal (the side asked to bow). */
  vassalTroops: number;
  /** Relation score from the vassal's side toward the suzerain (−100..100). */
  relationScore: number;
  /** The vassal ruler's temperament — proud lords (low appetite) refuse. */
  vassalPersonality?: RulerPersonality;
  /** 積怨 — the vassal's resentment of the suzerain (0..100); bile breeds defiance. */
  grudge?: number;
  /** 天子之威 — imperial sanction backing the demand (0..~0.25, §7.1 ①). 挾天子者
   *  令不臣 — submission to one who speaks with the emperor's voice is harder to refuse. */
  imperialSanction?: number;
  rng?: () => number;
}

/**
 * 招撫稱臣 — a strong realm demands a weaker one bow as its vassal. The weaker the
 * supplicant relative to the demander, the warmer the relation, and the more
 * pliant its ruler, the likelier it kneels; a deep grudge stiffens its neck, while
 * the weight of the emperor's name (天子之威) bends it.
 */
export function evaluateSubjugation(ctx: SubjugationContext): { accepted: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  // Power gap: the more we tower over them, the more reasonable submission looks.
  // ratio 1 (even) → ~0; ratio 3 (we triple them) → strong pull.
  const ratio = ctx.suzerainTroops / Math.max(1, ctx.vassalTroops);
  const powerPull = clamp(-0.3, 0.6, (ratio - 1.3) * 0.35);
  const appetite = personalityDiplomacyAppetite(ctx.vassalPersonality); // 0.3 (tyrant) … 1.4 (cautious)
  const chance = clamp(
    0.02,
    0.92,
    powerPull +
      ctx.relationScore / 300 +
      (appetite - 1) * 0.5 -
      (ctx.grudge ?? 0) / 250 +
      (ctx.imperialSanction ?? 0),
  );
  return { accepted: rng() < chance, chance };
}

/**
 * 納款稱臣 — a realm offers itself as vassal to a *stronger* protector. For the
 * strong side this is nearly pure gain (tribute + a buffer), so it accepts
 * readily — unless it nurses a grudge it would rather settle by conquest.
 */
export function evaluateProtection(ctx: {
  protectorTroops: number;
  supplicantTroops: number;
  relationScore: number;
  /** 積怨 the protector bears the supplicant. */
  grudge?: number;
  rng?: () => number;
}): { accepted: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  const ratio = ctx.protectorTroops / Math.max(1, ctx.supplicantTroops);
  // A genuine protector (clearly stronger) almost always pockets a free vassal.
  const base = ratio >= 1.2 ? 0.8 : 0.45;
  const chance = clamp(0.05, 0.95, base + ctx.relationScore / 400 - (ctx.grudge ?? 0) / 150);
  return { accepted: rng() < chance, chance };
}

/** Seal a vassalage: set the bond on the force and lock the relation to 'allied'
 *  at/above the floor so neither side may strike the other. Pure — returns the
 *  pieces; the caller commits. */
export function sealVassalage(input: {
  suzerainId: EntityId;
  vassalId: EntityId;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
}): { forces: Record<EntityId, Force>; diplomacy: DiplomaticState } {
  const forces = { ...input.forces };
  const v = forces[input.vassalId];
  if (v) forces[input.vassalId] = { ...v, vassalOfForceId: input.suzerainId };
  const diplomacy = setRelation(input.diplomacy, input.suzerainId, input.vassalId, (r) => ({
    ...r,
    status: 'allied',
    score: clamp(-100, 100, Math.max(VASSAL_RELATION_FLOOR, r.score)),
    expiresAt: undefined,
  }));
  return { forces, diplomacy };
}

/** Dissolve a vassalage (peacefully freed, or thrown off in 叛附). When `hostile`
 *  the relation craters and the bond is torn; otherwise it lapses to a warm
 *  neutral (a freed vassal is grateful). */
export function dissolveVassalage(input: {
  suzerainId: EntityId;
  vassalId: EntityId;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  hostile: boolean;
}): { forces: Record<EntityId, Force>; diplomacy: DiplomaticState } {
  const forces = { ...input.forces };
  const v = forces[input.vassalId];
  if (v && v.vassalOfForceId === input.suzerainId) {
    forces[input.vassalId] = { ...v, vassalOfForceId: undefined };
  }
  const diplomacy = setRelation(input.diplomacy, input.suzerainId, input.vassalId, (r) => ({
    ...r,
    status: 'neutral',
    score: input.hostile ? -40 : clamp(-100, 100, Math.min(r.score, 40)),
    expiresAt: undefined,
  }));
  return { forces, diplomacy };
}

export interface VassalRevoltInput {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  /** Per-vassal discontent (0..100). */
  discontent: Record<EntityId, number>;
  /** Player's force id — a *player* vassal may also throw off the yoke. */
  playerForceId?: EntityId | null;
  rng?: () => number;
}

export interface VassalRevoltOutput {
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  discontent: Record<EntityId, number>;
  /** Grudge bumps to fold into the store's 積怨 map (keyed by the offended force). */
  grudgeBumps: Record<EntityId, number>;
  entries: ReportEntry[];
}

/**
 * 叛附 — each season a vassal weighs the yoke. A vassal that has *outgrown* its
 * lord, or one ground down by levies and war-summons (discontent), may declare
 * its independence: the bond snaps, relations crater, and a grudge is sworn. A
 * meek, weak, content vassal stays put. Pure & deterministic given `rng`.
 */
export function tickVassalRevolt(input: VassalRevoltInput): VassalRevoltOutput {
  const rng = input.rng ?? Math.random;
  let forces = input.forces;
  let diplomacy = input.diplomacy;
  const discontent = { ...input.discontent };
  const grudgeBumps: Record<EntityId, number> = {};
  const entries: ReportEntry[] = [];

  for (const vassal of Object.values(input.forces)) {
    const suzerainId = vassal.vassalOfForceId;
    if (!suzerainId) continue;
    const suzerain = input.forces[suzerainId];
    // Lord wiped from the map (gone, or holding no city) — the bond simply lapses,
    // freeing the vassal (no betrayal, no grudge); clears the dangling pointer.
    if (!suzerain || forceCityCount(suzerainId, input.cities) === 0) {
      const freed = { ...forces };
      const v = freed[vassal.id];
      if (v) freed[vassal.id] = { ...v, vassalOfForceId: undefined };
      forces = freed;
      delete discontent[vassal.id];
      entries.push({
        cityId: null,
        kind: 'note',
        text: `${vassal.name.en} is no longer anyone's vassal — its lord has fallen.`,
        textZh: `${vassal.name.zh}之宗主已亡,其臣屬之約遂解。`,
      });
      continue;
    }
    const vt = forceTroops(vassal.id, input.cities);
    const st = forceTroops(suzerainId, input.cities);
    if (vt === 0) continue; // a wiped vassal can't revolt
    const strengthRatio = vt / Math.max(1, st); // ≥1 → the tail wags the dog
    const dis = discontent[vassal.id] ?? 0;
    // Base revolt pressure: ambition once the vassal rivals its lord, plus the
    // slow burn of accumulated discontent. A loyal, weaker vassal ≈ 0.
    const ambition = Math.max(0, strengthRatio - 0.85) * 0.18;
    const chance = clamp(0, 0.5, ambition + dis / 400);
    // Discontent cools a little each season when nothing inflames it.
    discontent[vassal.id] = Math.max(0, dis - 3);
    if (chance <= 0 || rng() >= chance) continue;

    const out = dissolveVassalage({ suzerainId, vassalId: vassal.id, forces, diplomacy, hostile: true });
    forces = out.forces;
    diplomacy = out.diplomacy;
    delete discontent[vassal.id];
    grudgeBumps[suzerainId] = (grudgeBumps[suzerainId] ?? 0) + 20; // the spurned lord resents it
    entries.push({
      cityId: null,
      kind: 'note',
      text: `${vassal.name.en} casts off the yoke of ${suzerain.name.en} and declares its independence.`,
      textZh: `${vassal.name.zh}叛${suzerain.name.zh}而自立,不復臣屬。`,
    });
  }

  return { forces, diplomacy, discontent, grudgeBumps, entries };
}

export interface AIVassalageInput {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  /** A force's resentment toward each rival (keyed by the *resented* force). */
  grudges?: Record<EntityId, number>;
  playerForceId?: EntityId | null;
  rng?: () => number;
}

export interface AIVassalageOutput {
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  entries: ReportEntry[];
}

/** Overwhelming superiority a protector must hold before a weak realm will sue. */
const SUE_VASSALAGE_RATIO = 2.5;
/** Per-season chance an eligible desperate realm even tries to bend the knee. */
const SUE_VASSALAGE_ATTEMPT = 0.12;

/**
 * 弱者求附 — each season a cornered AI realm may sue to become the vassal of an
 * overwhelmingly stronger neighbour it isn't at war with (the player included as
 * a would-be lord). It weighs the power gap, relations and its ruler's pride via
 * the same evaluateSubjugation the player faces. The player never auto-submits.
 * Pure — the store commits the sealed bonds.
 */
export function tickAIVassalage(input: AIVassalageInput): AIVassalageOutput {
  const rng = input.rng ?? Math.random;
  let forces = input.forces;
  let diplomacy = input.diplomacy;
  const entries: ReportEntry[] = [];

  // Forces that already command a vassal don't themselves go begging (no chains).
  const suzerains = new Set<EntityId>();
  for (const f of Object.values(input.forces)) if (f.vassalOfForceId) suzerains.add(f.vassalOfForceId);

  for (const weak of Object.values(input.forces)) {
    if (weak.id === input.playerForceId) continue; // the player chooses for themselves
    if (weak.vassalOfForceId) continue; // already someone's vassal
    if (suzerains.has(weak.id)) continue; // a lord doesn't kneel
    if (rng() >= SUE_VASSALAGE_ATTEMPT) continue;

    const weakTroops = forceTroops(weak.id, input.cities);
    if (weakTroops === 0) continue;
    // Strongest bordering realm we're at peace-or-neutral with and dwarfed by.
    let best: { id: EntityId; troops: number } | null = null;
    for (const strong of Object.values(input.forces)) {
      if (strong.id === weak.id) continue;
      if (strong.vassalOfForceId) continue; // can't serve a vassal
      const rel = getRelation(diplomacy, weak.id, strong.id);
      if (rel.status === 'allied') continue; // already bound
      if (rel.score < 0) continue; // won't bow to a force it dislikes
      if (!forcesBorder(weak.id, strong.id, input.cities)) continue;
      const st = forceTroops(strong.id, input.cities);
      if (st < weakTroops * SUE_VASSALAGE_RATIO) continue;
      if (!best || st > best.troops) best = { id: strong.id, troops: st };
    }
    if (!best) continue;

    const { accepted } = evaluateSubjugation({
      suzerainTroops: best.troops, vassalTroops: weakTroops,
      relationScore: getRelation(diplomacy, weak.id, best.id).score,
      vassalPersonality: weak.personality,
      grudge: input.grudges?.[best.id] ?? 0,
      rng,
    });
    if (!accepted) continue;

    const sealed = sealVassalage({ suzerainId: best.id, vassalId: weak.id, forces, diplomacy });
    forces = sealed.forces;
    diplomacy = sealed.diplomacy;
    const lord = input.forces[best.id];
    entries.push({
      cityId: null,
      kind: 'note',
      text: `${weak.name.en}, hard-pressed, sues to become a vassal of ${lord?.name.en ?? 'a stronger realm'}.`,
      textZh: `${weak.name.zh}勢蹙,遣使納款,願臣屬${lord?.name.zh ?? '強鄰'}。`,
    });
  }

  return { forces, diplomacy, entries };
}

// ──────────────────────────────────────────────────────────────────────
// ③ 索貢・最後通牒 — coercive demands
// ──────────────────────────────────────────────────────────────────────

export type DemandKind = 'gold' | 'grain' | 'submit';

export interface DemandContext {
  demanderTroops: number;
  targetTroops: number;
  relationScore: number;
  targetPersonality?: RulerPersonality;
  grudge?: number;
  kind: DemandKind;
  /** 天子之威 — imperial sanction backing the demand (0..~0.25, §7.1 ①). */
  imperialSanction?: number;
  rng?: () => number;
}

/**
 * 最後通牒 — bend the knee or bleed. The target accedes more readily the more it
 * is outmatched and the meeker its ruler; it stiffens with pride, spite (grudge)
 * and the weight of the demand (handing over silver is one thing, sovereignty
 * another), and bends to the emperor's name. A refusal is a casus belli — the
 * caller cashes that out.
 */
export function evaluateDemand(ctx: DemandContext): { accede: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  const ratio = ctx.demanderTroops / Math.max(1, ctx.targetTroops);
  const powerPull = clamp(-0.35, 0.65, (ratio - 1.2) * 0.4);
  const appetite = personalityDiplomacyAppetite(ctx.targetPersonality);
  // Heavier demands are dearer to grant: silver < grain < submission.
  const severity = ctx.kind === 'gold' ? 0 : ctx.kind === 'grain' ? 0.08 : 0.3;
  const chance = clamp(
    0.02,
    0.9,
    0.25 + powerPull + ctx.relationScore / 400 + (appetite - 1) * 0.35 - (ctx.grudge ?? 0) / 250 - severity + (ctx.imperialSanction ?? 0),
  );
  return { accede: rng() < chance, chance };
}

// ──────────────────────────────────────────────────────────────────────
// ② 共討會盟 — war coalitions
// ──────────────────────────────────────────────────────────────────────

/** How long a sworn league holds before it disbands if the foe still stands. */
export const COALITION_DURATION_SEASONS = 8;

export interface CoalitionJoinContext {
  /** Invitee's relation toward the 盟主 (warmer → more willing to follow). */
  relationToLeader: number;
  /** Invitee's relation toward the foe (the more they loathe it, the keener). */
  relationToTarget: number;
  /** 積怨 the invitee bears the foe — old scores beg settling. */
  grudgeToTarget?: number;
  /** Combined coalition troops vs. the foe's — nobody joins a hopeless siege. */
  coalitionTroops: number;
  targetTroops: number;
  invitePersonality?: RulerPersonality;
  /** 信譽 — the 盟主's reputation (0–100, default 100). Few will follow a known
   *  oathbreaker into war (§7.1 ④ credibility cascade). */
  leaderCredibility?: number;
  rng?: () => number;
}

/**
 * Will an invited realm swear into the league? It weighs love of the 盟主, hatred
 * of the foe, and whether the combined host can actually win — an aggressive lord
 * needs less convincing, a cautious one wants the odds. A vassal of the foe never
 * joins (the caller filters those out). A 盟主 of poor repute is followed warily.
 */
export function evaluateCoalitionJoin(ctx: CoalitionJoinContext): { join: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  const odds = ctx.coalitionTroops / Math.max(1, ctx.coalitionTroops + ctx.targetTroops); // 0..1
  const feasibility = clamp(-0.3, 0.35, (odds - 0.5) * 0.9);
  // A warmonger relishes a sanctioned war; a cautious lord hangs back.
  const appetite = personalityDiplomacyAppetite(ctx.invitePersonality);
  const temperament = (1 - appetite) * 0.25; // tyrant +0.17, cautious −0.10
  // A tarnished name shaves the odds: 0 at full repute, −0.25 at zero.
  const reputeMod = (clamp(0, 100, ctx.leaderCredibility ?? 100) - 100) / 400;
  const chance = clamp(
    0.03,
    0.93,
    0.15 +
      ctx.relationToLeader / 250 -
      ctx.relationToTarget / 250 +
      (ctx.grudgeToTarget ?? 0) / 200 +
      feasibility +
      temperament +
      reputeMod,
  );
  return { join: rng() < chance, chance };
}

/** Forge the league: every member goes to war with the foe (relation neutral so
 *  isHostilePermitted opens), and members are shielded among themselves. */
export function formCoalition(input: {
  leaderId: EntityId;
  targetId: EntityId;
  memberIds: EntityId[]; // includes the leader
  diplomacy: DiplomaticState;
  date: GameDate;
  year: number;
}): { coalition: WarCoalition; diplomacy: DiplomaticState } {
  let diplomacy = input.diplomacy;
  // Each member is now at war with the foe: drop any pact, set a hostile tone.
  for (const m of input.memberIds) {
    diplomacy = setRelation(diplomacy, m, input.targetId, (r) => ({
      ...r,
      status: 'neutral',
      score: Math.min(r.score, -20),
      expiresAt: undefined,
    }));
  }
  const coalition = {
    leaderForceId: input.leaderId,
    targetForceId: input.targetId,
    memberForceIds: input.memberIds,
    startedYear: input.year,
    expiresAt: addSeasons(input.date, COALITION_DURATION_SEASONS),
  };
  return { coalition, diplomacy };
}

export interface CoalitionTickInput {
  coalitions: WarCoalition[];
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  date: GameDate;
}

export interface CoalitionTickOutput {
  coalitions: WarCoalition[];
  /** Credibility deltas for the 盟主 of each resolved league (+ for a kill, − for a fizzle). */
  credibilityDelta: Record<EntityId, number>;
  /** Mandate (天命) deltas for the 盟主 on a successful campaign. */
  mandateDelta: Record<EntityId, number>;
  /** 分贓 — the war-indemnity windfall paid into each victorious 盟主's capital. */
  goldDelta: Record<EntityId, number>;
  entries: ReportEntry[];
}

/** 盟主之賞 — the war indemnity a victorious 盟主 claims from the spoils. */
export const COALITION_LEADER_INDEMNITY = 1500;

/**
 * Resolve standing leagues each season:
 *  • the foe has been wiped from the map → the campaign *succeeded*: the 盟主's
 *    name and Mandate rise, the league disbands triumphant.
 *  • the deadline passed with the foe still standing → the league *fizzled*: the
 *    failed 盟主 loses a little face.
 * Pure; the store folds the deltas into credibility/mandate.
 */
export function tickCoalitions(input: CoalitionTickInput): CoalitionTickOutput {
  const kept: WarCoalition[] = [];
  const credibilityDelta: Record<EntityId, number> = {};
  const mandateDelta: Record<EntityId, number> = {};
  const goldDelta: Record<EntityId, number> = {};
  const entries: ReportEntry[] = [];

  for (const c of input.coalitions) {
    const foeAlive = forceCityCount(c.targetForceId, input.cities) > 0 && !!input.forces[c.targetForceId];
    const target = input.forces[c.targetForceId];
    const leader = input.forces[c.leaderForceId];
    if (!foeAlive) {
      credibilityDelta[c.leaderForceId] = (credibilityDelta[c.leaderForceId] ?? 0) + 10;
      mandateDelta[c.leaderForceId] = (mandateDelta[c.leaderForceId] ?? 0) + 8;
      // 分贓 — the 盟主 claims the war indemnity; the sworn members share the glory.
      goldDelta[c.leaderForceId] = (goldDelta[c.leaderForceId] ?? 0) + COALITION_LEADER_INDEMNITY;
      for (const m of c.memberForceIds) {
        if (m === c.leaderForceId) continue;
        credibilityDelta[m] = (credibilityDelta[m] ?? 0) + 3;
      }
      entries.push({
        cityId: null,
        kind: 'note',
        text: `The coalition led by ${leader?.name.en ?? 'the league'} has brought down ${target?.name.en ?? 'their foe'} — the 盟主 claims the spoils and the league's name resounds.`,
        textZh: `${leader?.name.zh ?? '盟主'}所倡之會盟,終滅${target?.name.zh ?? '敵'},盟主分其膏腴,名震於諸侯。`,
      });
      continue; // disband, victorious
    }
    if (isOnOrAfter(input.date, c.expiresAt)) {
      credibilityDelta[c.leaderForceId] = (credibilityDelta[c.leaderForceId] ?? 0) - 5;
      entries.push({
        cityId: null,
        kind: 'note',
        text: `The coalition against ${target?.name.en ?? 'the foe'} disbands with its work unfinished — its 盟主 loses face.`,
        textZh: `共討${target?.name.zh ?? '敵'}之會盟期滿而功未竟,盟主威信受損。`,
      });
      continue; // disband, fizzled
    }
    kept.push(c);
  }

  return { coalitions: kept, credibilityDelta, mandateDelta, goldDelta, entries };
}

/** Below this 信譽, the cascade bites: allies cool, vassals chafe. */
export const CREDIBILITY_CASCADE_THRESHOLD = 30;

/**
 * 失信之累(§7.1 ④ credibility cascade) — a realm whose name has fallen below the
 * threshold reaps the consequences beyond mere pact-odds: its standing allies cool
 * toward an untrustworthy partner, and its vassals chafe under a faithless lord
 * (feeding 叛附). Pure; the store folds the deltas in. A note fires for the player.
 */
export function tickCredibilityCascade(input: {
  credibility: Record<EntityId, number>;
  diplomacy: DiplomaticState;
  forces: Record<EntityId, Force>;
  discontent: Record<EntityId, number>;
  playerForceId?: EntityId | null;
}): { diplomacy: DiplomaticState; discontent: Record<EntityId, number>; entries: ReportEntry[] } {
  let diplomacy = input.diplomacy;
  const discontent = { ...input.discontent };
  const entries: ReportEntry[] = [];

  for (const [fid, cred] of Object.entries(input.credibility)) {
    if (cred >= CREDIBILITY_CASCADE_THRESHOLD || !input.forces[fid]) continue;
    // Allies cool toward an oathbreaker (relations only — the pact itself stands).
    for (const [key, rel] of Object.entries(diplomacy.relations)) {
      if (rel.status !== 'allied') continue;
      if (rel.forceA !== fid && rel.forceB !== fid) continue;
      diplomacy = { relations: { ...diplomacy.relations, [key]: { ...rel, score: Math.max(-100, rel.score - 2) } } };
    }
    // Vassals chafe under a faithless lord.
    for (const v of Object.values(input.forces)) {
      if (v.vassalOfForceId === fid) discontent[v.id] = Math.min(100, (discontent[v.id] ?? 0) + 4);
    }
    if (fid === input.playerForceId) {
      entries.push({
        cityId: null, kind: 'note',
        text: `Your name is in tatters — wary allies cool toward you and your vassals grow restless.`,
        textZh: `君信譽掃地 —— 盟友側目而漸疏,藩屬亦因之離心。`,
      });
    }
  }
  return { diplomacy, discontent, entries };
}

/** The foe a force is sworn to attack under any active coalition, if any —
 *  read by ai.pickForceTarget to bias members toward the agreed target. */
export function coalitionTargetFor(
  forceId: EntityId,
  coalitions: WarCoalition[],
): EntityId | null {
  for (const c of coalitions) {
    if (c.memberForceIds.includes(forceId)) return c.targetForceId;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────────────
// ④ 盟約義務・連坐 — calls to arms
// ──────────────────────────────────────────────────────────────────────

/** Do forces A and B share a border (some city of A is adjacent to a city of B)? */
function forcesBorder(a: EntityId, b: EntityId, cities: Record<EntityId, City>): boolean {
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== a) continue;
    for (const adjId of c.adjacentCityIds ?? []) {
      if (cities[adjId]?.ownerForceId === b) return true;
    }
  }
  return false;
}

/**
 * Raise a 援盟之請 for every player ally menaced by a stronger hostile neighbour:
 * a genuine ally (relation 'allied' but NOT a vassal/suzerain bond with the player)
 * that borders a foe it may lawfully fight and which outweighs it. Capped so the
 * board never floods. Pure — the store swaps these in each season.
 */
export function detectCallsToArms(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null | undefined;
  date: GameDate;
  /** Margin by which the foe must outweigh the ally to count as a threat. */
  threatRatio?: number;
  /** Max simultaneous calls. */
  cap?: number;
}): CallToArms[] {
  const { forces, cities, diplomacy, playerForceId, date } = input;
  if (!playerForceId || !forces[playerForceId]) return [];
  const threatRatio = input.threatRatio ?? 1.15;
  const cap = input.cap ?? 3;
  const expiresAt = addSeasons(date, 2);
  const calls: CallToArms[] = [];

  for (const ally of Object.values(forces)) {
    if (ally.id === playerForceId) continue;
    // A genuine ally — not the player's own vassal or suzerain.
    if (ally.vassalOfForceId === playerForceId) continue;
    if (forces[playerForceId].vassalOfForceId === ally.id) continue;
    if (getRelation(diplomacy, playerForceId, ally.id).status !== 'allied') continue;

    const allyTroops = forceTroops(ally.id, cities);
    let worst: { foeId: EntityId; troops: number } | null = null;
    for (const foe of Object.values(forces)) {
      if (foe.id === ally.id || foe.id === playerForceId) continue;
      if (!isHostilePermitted(diplomacy, ally.id, foe.id)) continue; // not actually at odds
      if (!forcesBorder(ally.id, foe.id, cities)) continue;
      const ft = forceTroops(foe.id, cities);
      if (ft < allyTroops * threatRatio) continue; // not a real menace
      if (!worst || ft > worst.troops) worst = { foeId: foe.id, troops: ft };
    }
    if (worst) calls.push({ allyForceId: ally.id, foeForceId: worst.foeId, expiresAt });
  }

  // Strongest threats first, capped.
  return calls
    .sort((a, b) => forceTroops(b.foeForceId, cities) - forceTroops(a.foeForceId, cities))
    .slice(0, cap);
}

// ──────────────────────────────────────────────────────────────────────
// AI-side reciprocity — the strong-arm tools the player wields, turned back
// on them: AI realms coerce the player (③), gang up on a dominant player (②),
// and rally to a beleaguered player ally (④).
// ──────────────────────────────────────────────────────────────────────

const AI_DEMAND_RATIO = 1.8;       // a coercer must outweigh the player by this
const AI_DEMAND_SUBMIT_RATIO = 3;  // …and by this to demand outright submission
const AI_DEMAND_CHANCE = 0.10;     // per eligible bully per season

/**
 * 索貢來牒(AI→玩家) — each season a far stronger, proud neighbour the player is
 * NOT bound to may press a demand for gold (or, when it utterly towers over them,
 * submission). Only warlike rulers stoop to extortion. Returns fresh demands to
 * append to the pending board (deduped against those already standing). Pure.
 */
export function tickAIDemands(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null | undefined;
  existing: DiplomaticDemand[];
  date: GameDate;
  cap?: number;
  rng?: () => number;
}): DiplomaticDemand[] {
  const { forces, cities, diplomacy, playerForceId, existing, date } = input;
  if (!playerForceId || !forces[playerForceId]) return [];
  const player = forces[playerForceId];
  if (player.vassalOfForceId) return []; // a vassal is already squeezed by its lord
  const rng = input.rng ?? Math.random;
  const cap = input.cap ?? 2;
  if (existing.length >= cap) return [];
  const playerTroops = forceTroops(playerForceId, cities);
  if (playerTroops === 0) return [];
  const expiresAt = addSeasons(date, 2);
  const out: DiplomaticDemand[] = [];
  const have = new Set(existing.map((d) => d.fromForceId));

  for (const bully of Object.values(forces)) {
    if (bully.id === playerForceId || bully.vassalOfForceId) continue;
    if (have.has(bully.id)) continue;
    // Only the bellicose extort (aggressive/tyrant/expansionist/opportunist).
    const appetite = personalityDiplomacyAppetite(bully.personality);
    if (appetite > 1.05) continue; // peace-courters don't shake the player down
    const rel = getRelation(diplomacy, bully.id, playerForceId);
    if (rel.status !== 'neutral') continue; // no extorting a pact-partner/ally
    if (!forcesBorder(bully.id, playerForceId, cities)) continue;
    const bt = forceTroops(bully.id, cities);
    if (bt < playerTroops * AI_DEMAND_RATIO) continue;
    if (rng() >= AI_DEMAND_CHANCE) continue;
    const kind: DiplomaticDemand['kind'] = bt >= playerTroops * AI_DEMAND_SUBMIT_RATIO && rng() < 0.4 ? 'submit' : 'gold';
    out.push({ fromForceId: bully.id, kind, expiresAt });
    have.add(bully.id);
    if (existing.length + out.length >= cap) break;
  }
  return out;
}

const AI_COALITION_VS_PLAYER_CHANCE = 0.10;
const AI_COALITION_PLAYER_LEAD = 1.4; // player must outweigh the field this much

/**
 * 合縱共討(AI→玩家) — when the player has grown into the realm's clear front-runner,
 * a strong unbound AI may crown itself 盟主 and rally other free realms into an
 * explicit war league against them (the proactive sibling of the reactive 合縱).
 * One anti-player league at a time. Returns the forged coalition or null. Pure.
 */
export function tickAICoalitionVsPlayer(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  grudges?: Record<EntityId, number>;
  credibility?: Record<EntityId, number>;
  coalitions: WarCoalition[];
  playerForceId: EntityId | null | undefined;
  date: GameDate;
  year: number;
  rng?: () => number;
}): { coalition: WarCoalition; diplomacy: DiplomaticState; leaderId: EntityId } | null {
  const { forces, cities, diplomacy, playerForceId, coalitions, date, year } = input;
  if (!playerForceId || !forces[playerForceId]) return null;
  const player = forces[playerForceId];
  if (player.vassalOfForceId) return null;
  const rng = input.rng ?? Math.random;
  // Already a league sworn against the player? Don't pile on a second.
  if (coalitions.some((c) => c.targetForceId === playerForceId)) return null;
  if (rng() >= AI_COALITION_VS_PLAYER_CHANCE) return null;

  const playerTroops = forceTroops(playerForceId, cities);
  // Eligible leaders: unbound AI realms bordering the player. The strongest leads.
  const candidates = Object.values(forces)
    .filter((f) => f.id !== playerForceId && !f.vassalOfForceId
      && getRelation(diplomacy, f.id, playerForceId).status === 'neutral'
      && forcesBorder(f.id, playerForceId, cities))
    .map((f) => ({ f, troops: forceTroops(f.id, cities) }))
    .sort((a, b) => b.troops - a.troops);
  if (candidates.length === 0) return null;
  // Only band together if the player really is the front-runner over the strongest.
  const strongestRival = candidates[0].troops;
  if (playerTroops < strongestRival * AI_COALITION_PLAYER_LEAD) return null;

  const leaderId = candidates[0].f.id;
  let coalitionTroops = candidates[0].troops;
  const members: EntityId[] = [leaderId];
  for (const { f, troops } of candidates.slice(1)) {
    if (getRelation(diplomacy, leaderId, f.id).status === 'allied') { members.push(f.id); coalitionTroops += troops; continue; }
    const { join } = evaluateCoalitionJoin({
      relationToLeader: getRelation(diplomacy, leaderId, f.id).score,
      relationToTarget: getRelation(diplomacy, f.id, playerForceId).score,
      grudgeToTarget: input.grudges?.[f.id] ?? 0,
      coalitionTroops: coalitionTroops + troops, targetTroops: playerTroops,
      invitePersonality: f.personality, leaderCredibility: input.credibility?.[leaderId] ?? 100, rng,
    });
    if (join) { members.push(f.id); coalitionTroops += troops; }
  }
  if (members.length < 2) return null; // a lone "league" is just a war, not a 會盟
  const formed = formCoalition({ leaderId, targetId: playerForceId, memberIds: members, diplomacy, date, year });
  return { coalition: formed.coalition, diplomacy: formed.diplomacy, leaderId };
}

// ──────────────────────────────────────────────────────────────────────
// 假途・借道 — right of passage (§7.1 B)
// ──────────────────────────────────────────────────────────────────────

/** Window a granted leave-to-pass stands before it lapses. */
export const PASSAGE_DURATION_SEASONS = 8;

/** Does any city of `forceId` neighbour `cityId`? (the corridor test) */
export function cityBordersForce(cityId: EntityId, forceId: EntityId, cities: Record<EntityId, City>): boolean {
  const c = cities[cityId];
  if (!c) return false;
  for (const adjId of c.adjacentCityIds ?? []) {
    if (cities[adjId]?.ownerForceId === forceId) return true;
  }
  return false;
}

/** Is a passage grant from `grantorId` to `granteeId` currently on the books? */
export function passageActive(grants: PassageGrant[], granteeId: EntityId, grantorId: EntityId): boolean {
  return grants.some((g) => g.granteeForceId === granteeId && g.grantorForceId === grantorId);
}

/**
 * Resolve whether `granteeId` can strike `targetId` by leave-to-pass: either the
 * target IS a grantor's own city (假途滅虢 betrayal) or it borders a grantor's
 * land (a transit attack on a foe beyond the corridor). Pure read.
 */
export function passageReachableTarget(
  grants: PassageGrant[],
  granteeId: EntityId,
  targetId: EntityId,
  cities: Record<EntityId, City>,
): { reachable: boolean; betrayal: boolean; grantorId: EntityId | null } {
  const target = cities[targetId];
  if (!target) return { reachable: false, betrayal: false, grantorId: null };
  for (const g of grants) {
    if (g.granteeForceId !== granteeId) continue;
    if (target.ownerForceId === g.grantorForceId) return { reachable: true, betrayal: true, grantorId: g.grantorForceId };
    if (cityBordersForce(targetId, g.grantorForceId, cities)) return { reachable: true, betrayal: false, grantorId: g.grantorForceId };
  }
  return { reachable: false, betrayal: false, grantorId: null };
}

/**
 * The cities `granteeId` may march on from `sourceCityId` by leave-to-pass — for
 * the UI to offer. A corridor opens only where the source borders the grantor's
 * land; through it, foes neighbouring the grantor come into reach (transit) and
 * the grantor's own border cities become betrayal targets (假途滅虢).
 */
export function passageTargets(
  grants: PassageGrant[],
  granteeId: EntityId,
  sourceCityId: EntityId,
  cities: Record<EntityId, City>,
): Array<{ cityId: EntityId; betrayal: boolean; grantorId: EntityId }> {
  const out: Array<{ cityId: EntityId; betrayal: boolean; grantorId: EntityId }> = [];
  const seen = new Set<EntityId>([sourceCityId]);
  const source = cities[sourceCityId];
  if (!source) return out;
  for (const g of grants) {
    if (g.granteeForceId !== granteeId) continue;
    if (!cityBordersForce(sourceCityId, g.grantorForceId, cities)) continue; // no corridor from here
    for (const c of Object.values(cities)) {
      if (seen.has(c.id) || !c.ownerForceId) continue;
      if (c.ownerForceId === g.grantorForceId) {
        // 假途滅虢 — only the grantor cities you'd actually pass (border the source).
        if (source.adjacentCityIds?.includes(c.id)) { out.push({ cityId: c.id, betrayal: true, grantorId: g.grantorForceId }); seen.add(c.id); }
      } else if (c.ownerForceId !== granteeId && cityBordersForce(c.id, g.grantorForceId, cities)) {
        out.push({ cityId: c.id, betrayal: false, grantorId: g.grantorForceId }); seen.add(c.id);
      }
    }
  }
  return out;
}

/** Will an ally lend its roads? Allies oblige readily; a NAP partner needs warmth;
 *  a wary (cautious/suspicious) ruler is stingier. Pure & rng-injectable. */
export function evaluatePassage(ctx: {
  relStatus: RelationStatus;
  relScore: number;
  grantorPersonality?: RulerPersonality;
  rng?: () => number;
}): { granted: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  if (ctx.relStatus === 'neutral') return { granted: false, chance: 0 }; // only a friend lends the road
  const base = ctx.relStatus === 'allied' ? 0.85 : 0.45;
  const appetite = personalityDiplomacyAppetite(ctx.grantorPersonality); // wary rulers court peace but guard their land
  const chance = clamp(0.05, 0.97, base + ctx.relScore / 300 - (appetite > 1.2 ? 0.1 : 0));
  return { granted: rng() < chance, chance };
}

/** Season upkeep: drop passage grants that have lapsed or whose parties vanished. */
export function tickPassageGrants(input: {
  grants: PassageGrant[];
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  date: GameDate;
}): PassageGrant[] {
  return input.grants.filter((g) =>
    !isOnOrAfter(input.date, g.expiresAt) &&
    !!input.forces[g.grantorForceId] && forceCityCount(g.grantorForceId, input.cities) > 0 &&
    !!input.forces[g.granteeForceId] && forceCityCount(g.granteeForceId, input.cities) > 0,
  );
}

// ──────────────────────────────────────────────────────────────────────
// 調停・斡旋 — third-party mediation (§7.1 C)
// ──────────────────────────────────────────────────────────────────────

/**
 * Will a third realm's good offices broker a thaw between the player and a foe?
 * A weighty broker the foe respects, pressed on a foe not implacably set against
 * the player, carries the day; deep grudges and a slight broker fail. Pure.
 */
export function evaluateMediation(ctx: {
  brokerTroops: number;
  foeTroops: number;
  /** The foe's relation toward the broker — a foe heeds a friend's counsel. */
  brokerRelationToFoe: number;
  /** 積怨 — the foe's resentment of the player (0..100). */
  foeGrudge: number;
  /** The foe's current relation toward the player. */
  foeRelationToPlayer: number;
  /** 大鴻臚 — the player's diplomacy multiplier sweetens the odds. */
  diplomacyMultiplier?: number;
  rng?: () => number;
}): { success: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  // A broker who towers over the foe is heeded; a slight one is brushed off.
  const clout = clamp(-0.2, 0.4, (ctx.brokerTroops / Math.max(1, ctx.foeTroops) - 1) * 0.3);
  const rapport = clamp(-0.1, 0.35, ctx.brokerRelationToFoe / 250); // the foe listens to a friend
  const base = 0.28 + clout + rapport + ctx.foeRelationToPlayer / 400 - ctx.foeGrudge / 200;
  const chance = clamp(0.05, 0.9, base * (ctx.diplomacyMultiplier ?? 1));
  return { success: rng() < chance, chance };
}

// ──────────────────────────────────────────────────────────────────────
// 求和乞降 — suing for peace / war termination (§7.1 ②')
// ──────────────────────────────────────────────────────────────────────

/**
 * Will a foe accept the player's plea to end the war? A foe whose war is even or
 * going badly takes the terms; one that's winning big smells blood and fights on.
 * Reparations sweeten the offer; spite (grudge) hardens it. Pure.
 */
export function evaluatePeaceOffer(ctx: {
  suerTroops: number;
  foeTroops: number;
  foeRelation: number;
  foeGrudge?: number;
  /** Gold the suer offers as reparations — sweetens the deal. */
  reparations?: number;
  foePersonality?: RulerPersonality;
  rng?: () => number;
}): { accepted: boolean; chance: number } {
  const rng = ctx.rng ?? Math.random;
  // ratio >1 → the suer is the stronger; the foe is losing and keener to settle.
  const ratio = ctx.suerTroops / Math.max(1, ctx.foeTroops);
  const tide = clamp(-0.35, 0.4, (ratio - 0.9) * 0.4);
  const appetite = personalityDiplomacyAppetite(ctx.foePersonality);
  const sweetener = clamp(0, 0.25, (ctx.reparations ?? 0) / 8000);
  const chance = clamp(
    0.05, 0.9,
    0.3 + tide + ctx.foeRelation / 400 - (ctx.foeGrudge ?? 0) / 200 + (appetite - 1) * 0.2 + sweetener,
  );
  return { accepted: rng() < chance, chance };
}

/**
 * 乞降來使(AI→玩家) — a beaten AI realm at war with the player sues for terms: one
 * ground down (high grudge from the player's aggression) and clearly outmatched
 * offers reparations, or — if truly desperate — its very submission. Returns fresh
 * offers to append to the pending board. Pure.
 */
export function tickAIPeaceOffers(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  grudges?: Record<EntityId, number>;
  playerForceId: EntityId | null | undefined;
  existing: PeaceOffer[];
  date: GameDate;
  cap?: number;
  rng?: () => number;
}): PeaceOffer[] {
  const { forces, cities, diplomacy, playerForceId, existing, date } = input;
  if (!playerForceId || !forces[playerForceId]) return [];
  const rng = input.rng ?? Math.random;
  const cap = input.cap ?? 2;
  if (existing.length >= cap) return [];
  const playerTroops = forceTroops(playerForceId, cities);
  if (playerTroops === 0) return [];
  const expiresAt = addSeasons(date, 2);
  const have = new Set(existing.map((o) => o.fromForceId));
  const out: PeaceOffer[] = [];

  for (const f of Object.values(forces)) {
    if (f.id === playerForceId || f.vassalOfForceId) continue;
    if (have.has(f.id)) continue;
    if (getRelation(diplomacy, f.id, playerForceId).status !== 'neutral') continue; // must be able to fight = at war
    if (!forcesBorder(f.id, playerForceId, cities)) continue;
    const grudge = input.grudges?.[f.id] ?? 0;
    if (grudge < 25) continue; // no active grievance ⇒ not really being crushed
    const ft = forceTroops(f.id, cities);
    if (ft >= playerTroops * 0.7) continue; // still strong enough to fight on
    if (rng() >= 0.3) continue;
    const desperate = ft < playerTroops * 0.35 || grudge >= 60;
    out.push({ fromForceId: f.id, kind: desperate ? 'vassal' : 'reparations', expiresAt });
    have.add(f.id);
    if (existing.length + out.length >= cap) break;
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────
// 質子 — diplomatic hostages living at a foreign court (§7.1 D)
// ──────────────────────────────────────────────────────────────────────

/** Per-season chance a hostage slips its keepers and flees home. */
const HOSTAGE_ESCAPE_CHANCE = 0.05;

/**
 * Season upkeep for diplomatic hostages (`officer.hostageOfForceId`): a surety
 * whose **keeper realm falls** is freed and goes home; one whose **own realm
 * falls** is cut loose at the foreign court; and each season a few **slip away**
 * (越獄) back to their lord. Betrayal-death is handled at the betraying march
 * (store.issueMarch), not here. Pure; the store commits the officer map.
 */
export function tickHostages(input: {
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  rng?: () => number;
}): { officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const rng = input.rng ?? Math.random;
  const entries: ReportEntry[] = [];
  let officers = input.officers;
  const sendHome = (o: Officer, why: 'freed' | 'escaped'): void => {
    const home = o.forceId ? input.forces[o.forceId] : null;
    const cap = home ? input.cities[home.capitalCityId] : null;
    officers = {
      ...officers,
      [o.id]: { ...o, status: 'idle', hostageOfForceId: undefined, locationCityId: cap?.id ?? o.locationCityId },
    };
    const holder = o.hostageOfForceId ? input.forces[o.hostageOfForceId] : null;
    entries.push({
      cityId: cap?.id ?? null,
      kind: 'note',
      text: why === 'escaped'
        ? `${o.name.en} slips away from ${holder?.name.en ?? 'captivity'} and returns home.`
        : `${o.name.en}, held as a hostage, is freed and returns home.`,
      textZh: why === 'escaped'
        ? `${o.name.zh}自${holder?.name.zh ?? '質中'}脫身,潛歸故里。`
        : `質子${o.name.zh}得釋,歸返本國。`,
    });
  };

  for (const o of Object.values(input.officers)) {
    const hid = o.hostageOfForceId;
    if (!hid || o.status === 'dead' || !o.forceId) continue;
    const holderAlive = !!input.forces[hid] && forceCityCount(hid, input.cities) > 0;
    const homeAlive = !!input.forces[o.forceId] && forceCityCount(o.forceId, input.cities) > 0;
    if (!holderAlive) {
      if (homeAlive) sendHome(o, 'freed');
      else officers = { ...officers, [o.id]: { ...o, hostageOfForceId: undefined, status: 'idle' } };
      continue;
    }
    if (!homeAlive) {
      // Their realm is gone — no longer a surety, just an officer at the court.
      officers = { ...officers, [o.id]: { ...o, hostageOfForceId: undefined, status: 'idle' } };
      continue;
    }
    if (rng() < HOSTAGE_ESCAPE_CHANCE) sendHome(o, 'escaped');
  }

  return { officers, entries };
}

const ALLY_RALLY_CHANCE = 0.3;

/**
 * 盟友驰援(AI→玩家) — the mirror of detectCallsToArms: when the player is hard-
 * pressed by a stronger bordering foe, each genuine AI ally that also borders that
 * foe may declare war on it to relieve the player. Automatic (no prompt). Pure.
 */
export function tickAllyRally(input: {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null | undefined;
  threatRatio?: number;
  rng?: () => number;
}): { diplomacy: DiplomaticState; entries: ReportEntry[] } {
  const { forces, cities, playerForceId } = input;
  let diplomacy = input.diplomacy;
  const entries: ReportEntry[] = [];
  if (!playerForceId || !forces[playerForceId]) return { diplomacy, entries };
  const rng = input.rng ?? Math.random;
  const threatRatio = input.threatRatio ?? 1.15;
  const playerTroops = forceTroops(playerForceId, cities);
  if (playerTroops === 0) return { diplomacy, entries };

  // The player's worst bordering menace.
  let worst: { foeId: EntityId; troops: number } | null = null;
  for (const foe of Object.values(forces)) {
    if (foe.id === playerForceId) continue;
    if (!isHostilePermitted(diplomacy, playerForceId, foe.id)) continue;
    if (!forcesBorder(playerForceId, foe.id, cities)) continue;
    const ft = forceTroops(foe.id, cities);
    if (ft < playerTroops * threatRatio) continue;
    if (!worst || ft > worst.troops) worst = { foeId: foe.id, troops: ft };
  }
  if (!worst) return { diplomacy, entries };
  const foeId = worst.foeId;

  for (const ally of Object.values(forces)) {
    if (ally.id === playerForceId || ally.id === foeId) continue;
    if (ally.vassalOfForceId === playerForceId) continue; // a vassal is summoned, not a peer
    if (forces[playerForceId].vassalOfForceId === ally.id) continue;
    if (getRelation(diplomacy, playerForceId, ally.id).status !== 'allied') continue;
    if (!isHostilePermitted(diplomacy, ally.id, foeId)) continue; // already at peace-block with the foe
    if (!forcesBorder(ally.id, foeId, cities)) continue;
    if (rng() >= ALLY_RALLY_CHANCE) continue;
    diplomacy = setRelation(diplomacy, ally.id, foeId, (r) => ({ ...r, status: 'neutral', score: Math.min(r.score, -15), expiresAt: undefined }));
    entries.push({
      cityId: null,
      kind: 'note',
      text: `${ally.name.en} honours its pact and marches against ${forces[foeId]?.name.en ?? 'your foe'} to relieve you.`,
      textZh: `${ally.name.zh}踐盟,發兵討${forces[foeId]?.name.zh ?? '敵'}以解君之困。`,
    });
  }
  return { diplomacy, entries };
}
