import type {
  City,
  Command,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  InternalAffairsCommand,
  InternalAffairsType,
  MarchCommand,
  Officer,
  OfficerStats,
  ReportEntry,
} from '../types';
import { getRelation, isHostilePermitted, pairKey } from '../types';
import type { Difficulty } from '../state/gameState';
import { OATH_BONDS, type OathBond } from '../data/bonds';
import { COMMAND_DEFS } from './commands';
import { marchDurationFor } from '../data/cities';
import { isLand } from '../data/geography';
import {
  NAP_PROPOSAL_COST,
  computeTotalTroops,
  proposeNonAggression,
} from './diplomacy';
import {
  FREE_AGENT_COST,
  attemptFreeAgentRecruit,
} from './officerFate';
import type { Building, PolicyId } from '../types';
import {
  academyCapacity,
  academyLevel,
  cityHasAcademy,
  eligiblePolicies,
  policyTier,
  trainingCost,
  trainingDurationSeasons,
  trainingsInCity,
  type PendingTraining,
  eligibleTactics,
  tacticTier,
  tacticTrainingCost,
  tacticDurationSeasons,
} from './training';
import { TACTIC_DEFS, type TacticId } from '../data/officerAttributes';
import { commandFitMultiplier, isCombatLiability } from './traitEffects';
import { attackDeterrence, recruitPreferenceScore } from './relationshipEffects';

export interface AIPlanInput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null;
  pendingCommands: Record<EntityId, Command>;
  pendingTrainings: PendingTraining[];
  buildings: Building[];
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  /** Runtime family — flows into recruiting for kinship bonus (R1). */
  family?: import('../types/family').FamilyRelation[];
  /** Civic-title appointments — so AI can route a city's internal-affairs
   *  to its prefect (who gets the +15% internalMultiplier bonus). */
  appointments?: import('../types').Appointment[];
  /** Phase 3d — per-territory owner overrides. AI uses this to spot
   *  targets that currently hold its captured cells (reclaim priority). */
  territoryOwnership?: Record<EntityId, EntityId | null>;
  /** Persistent field armies — so the AI can dispatch interceptors to meet
   *  hostile columns in the open field rather than only at city walls. */
  armies?: Record<EntityId, import('../types').Army>;
  date: GameDate;
  difficulty?: Difficulty;
  rng?: () => number;
}

export interface AIPlanOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  pendingCommands: Record<EntityId, Command>;
  /** Trainings the AI started this turn (to be merged into state.pendingTrainings). */
  newTrainings: PendingTraining[];
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  entries: ReportEntry[];
}

/**
 * Plan one season of commands for every non-player force.
 * Mutates copies and returns the merged result so resolveSeason can run
 * over the combined player + AI pendingCommands.
 */
export function planAITurn(input: AIPlanInput): AIPlanOutput {
  const rng = input.rng ?? Math.random;
  const difficulty = input.difficulty ?? 'normal';
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const pendingCommands = { ...input.pendingCommands };
  const newTrainings: PendingTraining[] = [];
  let diplomacy = input.diplomacy;
  const runtimeBonds = [...input.runtimeBonds];
  const entries: ReportEntry[] = [];

  // Group cities by owning force.
  const citiesByForce = new Map<EntityId, City[]>();
  for (const city of Object.values(cities)) {
    if (!city.ownerForceId) continue;
    if (city.ownerForceId === input.playerForceId) continue;
    const arr = citiesByForce.get(city.ownerForceId) ?? [];
    arr.push(city);
    citiesByForce.set(city.ownerForceId, arr);
  }

  for (const [forceId, forceCities] of citiesByForce) {
    for (const city of forceCities) {
      if (pendingCommands[city.id]) continue; // shouldn't happen but safe
      const officersHere = Object.values(officers).filter(
        (o) =>
          o.locationCityId === city.id &&
          o.forceId === forceId &&
          o.status === 'idle' &&
          !o.task,
      );
      if (officersHere.length === 0) continue;

      // Look up this city's prefect (if any) so decideCommand can prefer
      // them for internal-affairs (the +15% internalMultiplier bonus).
      const prefectAppt = (input.appointments ?? []).find(
        (a) => a.titleId === 'prefect' && a.forceId === forceId && a.cityId === city.id,
      );
      const prefectId = prefectAppt?.officerId ?? null;
      const decision = decideCommand(
        city,
        officersHere,
        cities,
        forceId,
        difficulty,
        input.diplomacy,
        rng,
        input.forces,
        input.family ?? [],
        prefectId,
        input.territoryOwnership ?? {},
        input.armies ?? {},
      );
      if (!decision) continue;

      // Apply: debit gold, mark officer (and companions) busy, store command.
      cities[city.id] = {
        ...cities[city.id],
        gold:
          cities[city.id].gold - COMMAND_DEFS[decision.command.type].goldCost,
      };
      officers[decision.officer.id] = {
        ...officers[decision.officer.id],
        task: decision.command.type,
      };
      if (decision.companions) {
        for (const cid of decision.companions) {
          if (officers[cid]) {
            officers[cid] = { ...officers[cid], task: decision.command.type };
          }
        }
      }
      pendingCommands[city.id] = decision.command;
    }
  }

  // ── AI hires free agents in its cities
  for (const [forceId, forceCities] of citiesByForce) {
    const force = input.forces[forceId];
    if (!force) continue;
    const ruler = officers[force.rulerOfficerId];
    if (!ruler || ruler.status === 'dead') continue;

    for (const city of forceCities) {
      const updatedCity = cities[city.id];
      if (!updatedCity || updatedCity.gold < FREE_AGENT_COST) continue;
      const agents = Object.values(officers).filter(
        (o) =>
          o.locationCityId === city.id &&
          o.status === 'idle' &&
          o.forceId === null,
      );
      if (agents.length === 0) continue;
      // X1b — Prefer free agents by RELATIONSHIP (sworn brothers / family /
      // former masters of the ruler) first, then by total stats. Personal
      // enemies are excluded entirely (-9999 score).
      const scoreFor = (o: Officer) => {
        const rel = recruitPreferenceScore(o.id, ruler.id, input.family ?? []);
        if (rel < 0) return rel; // skip enemies
        const stats = o.stats.leadership + o.stats.war + o.stats.intelligence + o.stats.politics + o.stats.charisma;
        return rel + stats;
      };
      const candidates = [...agents]
        .map((o) => ({ o, score: scoreFor(o) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score);
      if (candidates.length === 0) continue;
      const target = candidates[0].o;
      const result = attemptFreeAgentRecruit({
        officer: target,
        city: updatedCity,
        recruiterForce: force,
        recruiterRuler: ruler,
        family: input.family,
        rng,
      });
      cities[city.id] = {
        ...updatedCity,
        gold: updatedCity.gold - FREE_AGENT_COST,
      };
      if (result.ok && result.recruitedOfficer) {
        officers[target.id] = result.recruitedOfficer;
        entries.push({
          cityId: city.id,
          kind: 'note',
          text: `${target.name.en} enters service under ${force.name.en} at ${city.name.en}.`,
          textZh: `${target.name.zh}於${city.name.zh}投效${force.name.zh}。`,
        });
      }
    }
  }

  // ── AI-initiated diplomacy: weak AI forces seek NAPs with much
  //    stronger neighbors (player included) to buy time.
  const aiForceIds = Array.from(citiesByForce.keys());
  for (const forceId of aiForceIds) {
    if (rng() > 0.25) continue; // 25% chance per AI per season

    const force = input.forces[forceId];
    const ruler = force ? officers[force.rulerOfficerId] : null;
    if (!force || !ruler || ruler.status === 'dead') continue;
    const capital = cities[force.capitalCityId];
    if (!capital || capital.gold < NAP_PROPOSAL_COST) continue;

    const myTroops = computeTotalTroops(forceId, cities);
    // Find a stronger neighbor we don't already have a treaty with.
    const neighbors = new Set<EntityId>();
    for (const c of citiesByForce.get(forceId) ?? []) {
      for (const adjId of c.adjacentCityIds) {
        const adj = cities[adjId];
        if (adj?.ownerForceId && adj.ownerForceId !== forceId) {
          neighbors.add(adj.ownerForceId);
        }
      }
    }
    const candidates = [...neighbors]
      .map((nid) => ({
        id: nid,
        troops: computeTotalTroops(nid, cities),
        rel: getRelation(diplomacy, forceId, nid),
      }))
      .filter(
        (n) =>
          n.rel.status === 'neutral' &&
          n.troops > myTroops * 1.4, // only seek peace from much stronger
      )
      .sort((a, b) => b.troops - a.troops);

    const target = candidates[0];
    if (!target) continue;
    const targetForce = input.forces[target.id];
    if (!targetForce) continue;

    const outcome = proposeNonAggression({
      player: force,
      playerRulerCharisma: ruler.stats.charisma,
      target: targetForce,
      targetTotalTroops: target.troops,
      playerTotalTroops: myTroops,
      diplomacy,
      date: input.date,
      rng,
    });
    if (outcome.ok) {
      cities[capital.id] = {
        ...capital,
        gold: capital.gold - NAP_PROPOSAL_COST,
      };
      diplomacy = outcome.diplomacy;
      entries.push({
        cityId: null,
        kind: 'note',
        text: outcome.accepted
          ? `${force.name.en} sues for peace with ${targetForce.name.en} — non-aggression pact signed.`
          : `${force.name.en} sought peace with ${targetForce.name.en}, but was rebuffed.`,
        textZh: outcome.accepted
          ? `${force.name.zh}向${targetForce.name.zh}求和，互不侵犯之盟既立。`
          : `${force.name.zh}遣使向${targetForce.name.zh}議和，遭其婉拒。`,
      });
    }
  }

  // ── AI marriage diplomacy: forces with high positive relations may
  //    propose marriages to cement the bond. 8% chance per friendly pair.
  for (const forceId of aiForceIds) {
    const force = input.forces[forceId];
    if (!force) continue;
    const capital = cities[force.capitalCityId];
    if (!capital || capital.gold < 1000) continue;

    for (const otherId of aiForceIds) {
      if (otherId === forceId || otherId <= forceId) continue; // avoid dup
      const other = input.forces[otherId];
      if (!other) continue;
      const rel = getRelation(diplomacy, forceId, otherId);
      if (rel.score < 60) continue;
      if (rng() > 0.08) continue;

      // Already a marriage between these forces? Skip.
      const officersA = Object.values(officers).filter(
        (o) => o.forceId === forceId && o.status === 'idle',
      );
      const officersB = Object.values(officers).filter(
        (o) => o.forceId === otherId && o.status === 'idle',
      );
      if (officersA.length === 0 || officersB.length === 0) continue;

      const aIds = new Set(officersA.map((o) => o.id));
      const bIds = new Set(officersB.map((o) => o.id));
      const alreadyMarried = runtimeBonds.some(
        (b) =>
          (aIds.has(b.officerA) && bIds.has(b.officerB)) ||
          (aIds.has(b.officerB) && bIds.has(b.officerA)),
      );
      if (alreadyMarried) continue;

      // Pick highest-charisma officer from each side.
      const aPick = [...officersA].sort(
        (a, b) => b.stats.charisma - a.stats.charisma,
      )[0];
      const bPick = [...officersB].sort(
        (a, b) => b.stats.charisma - a.stats.charisma,
      )[0];

      cities[capital.id] = { ...capital, gold: capital.gold - 1000 };
      runtimeBonds.push({
        officerA: aPick.id,
        officerB: bPick.id,
        floor: 80,
        kind: 'oath',
        label: `${aPick.name.en} ⚭ ${bPick.name.en} Marriage`,
      });

      // Boost relations.
      const key = pairKey(forceId, otherId);
      const current = getRelation(diplomacy, forceId, otherId);
      diplomacy = {
        relations: {
          ...diplomacy.relations,
          [key]: { ...current, score: Math.min(100, current.score + 50) },
        },
      };
      entries.push({
        cityId: null,
        kind: 'note',
        text: `Marriage forged: ${aPick.name.en} (${force.name.en}) ⚭ ${bPick.name.en} (${other.name.en}). Relations deepen.`,
        textZh: `聯姻既成：${aPick.name.zh}（${force.name.zh}）⚭ ${bPick.name.zh}（${other.name.zh}），兩家情誼日深。`,
      });
      break; // only one marriage per force per season
    }
  }

  // ── AI academy training ─────────────────────────────────────────
  // For each AI force: cap concurrent trainings at ceil(numCities/3),
  // clamped 1–5. Bigger empires train more policies in parallel; tiny
  // ones stay restrained so they don't blow the war chest.
  // Same per-turn capacity per academy still applies via the city-side
  // capacity check below.
  for (const [forceId, forceCities] of citiesByForce) {
    const inFlightCount = input.pendingTrainings.reduce((n, t) => {
      const o = officers[t.officerId];
      return o?.forceId === forceId ? n + 1 : n;
    }, 0);
    const concurrentCap = Math.max(1, Math.min(5, Math.ceil(forceCities.length / 3)));
    if (inFlightCount >= concurrentCap) continue;
    let trainedThisTurn = 0;
    const slotsOpen = concurrentCap - inFlightCount;

    for (const city of forceCities) {
      if (trainedThisTurn >= slotsOpen) break;
      const updated = cities[city.id];
      if (!updated) continue;
      if (!cityHasAcademy(updated, input.buildings)) continue;

      const aLvl = academyLevel(updated, input.buildings);
      const cap = academyCapacity(aLvl);
      const inUse =
        trainingsInCity(updated.id, input.pendingTrainings) +
        trainingsInCity(updated.id, newTrainings);
      // For lv3 (instant) capacity is Infinity, so this is safe.
      if (aLvl < 3 && inUse >= cap) continue;

      const officersHere = Object.values(officers).filter(
        (o) =>
          o.locationCityId === updated.id &&
          o.forceId === forceId &&
          o.status === 'idle' &&
          !o.task &&
          !pendingCommands[o.id] &&
          (o.policies?.length ?? 0) < 5 && // AI restraint: stops at 5 to leave gold for war
          !newTrainings.some((nt) => nt.officerId === o.id),
      );
      if (officersHere.length === 0) continue;

      // Pick the officer with the highest intelligence (best ROI).
      const officer = [...officersHere].sort(
        (a, b) => b.stats.intelligence - a.stats.intelligence,
      )[0];

      // N3 — 33% chance the AI trains a TACTIC instead of a policy this turn.
      // Only when the officer has tactics to learn + enough gold.
      const wantsTactic = rng() < 0.33;
      const { available: avTac } = wantsTactic ? eligibleTactics(officer) : { available: [] as TacticId[] };
      if (wantsTactic && avTac.length > 0) {
        const tacticCost = tacticTrainingCost(officer);
        if (updated.gold >= tacticCost + 300) {
          // Prefer tier-1/2 tactics to keep AI growing broadly.
          const filteredTac = avTac.filter((tt) => tacticTier(tt) <= 2);
          const tacPool = filteredTac.length > 0 ? filteredTac : avTac;
          const tacticId = tacPool[Math.floor(rng() * tacPool.length)];
          const tacDur = tacticDurationSeasons(officer, updated, tacticId, input.buildings);
          cities[updated.id] = { ...updated, gold: updated.gold - tacticCost };
          if (tacDur <= 0) {
            const haveT = officer.tactics ?? [];
            if (!haveT.includes(tacticId)) {
              officers[officer.id] = { ...officer, tactics: [...haveT, tacticId] };
            }
          } else {
            newTrainings.push({
              officerId: officer.id,
              cityId: updated.id,
              kind: 'tactic',
              policyId: 'tuntian' as never,
              tacticId,
              seasonsLeft: tacDur,
              goldSpent: tacticCost,
            });
          }
          trainedThisTurn += 1;
          void TACTIC_DEFS; // suppress unused-import warning if no entry triggers
          continue; // move to next city
        }
      }

      const cost = trainingCost(officer);
      if (updated.gold < cost + 300) continue; // keep 300g buffer for ops

      const { available } = eligiblePolicies(officer);
      // Prefer base/advanced policies to keep AI building broad foundations.
      const filtered = available.filter((p) => policyTier(p) <= 2);
      const pool = filtered.length > 0 ? filtered : available;
      if (pool.length === 0) continue;

      const policyId: PolicyId = pool[Math.floor(rng() * pool.length)];
      const duration = trainingDurationSeasons(
        officer,
        updated,
        policyId,
        input.buildings,
      );

      // Debit gold.
      cities[updated.id] = { ...updated, gold: updated.gold - cost };

      if (duration <= 0) {
        // Imperial Academy — apply policy immediately, no queue entry.
        const have = officer.policies ?? [];
        if (!have.includes(policyId)) {
          officers[officer.id] = {
            ...officer,
            policies: [...have, policyId],
          };
        }
      } else {
        newTrainings.push({
          officerId: officer.id,
          cityId: updated.id,
          policyId,
          seasonsLeft: duration,
          goldSpent: cost,
        });
      }
      trainedThisTurn += 1;
    }
  }

  return { cities, officers, pendingCommands, newTrainings, diplomacy, runtimeBonds, entries };
}

interface Decision {
  command: Command;
  officer: Officer;
  companions?: EntityId[];
}

function isBondedTo(a: EntityId, b: EntityId): boolean {
  return OATH_BONDS.some(
    (bond) =>
      (bond.officerA === a && bond.officerB === b) ||
      (bond.officerA === b && bond.officerB === a),
  );
}

function decideCommand(
  city: City,
  officersHere: Officer[],
  allCities: Record<EntityId, City>,
  forceId: EntityId,
  difficulty: Difficulty,
  diplomacy: DiplomaticState,
  rng: () => number,
  forces: Record<EntityId, Force>,
  family: import('../types/family').FamilyRelation[],
  prefectId: EntityId | null = null,
  territoryOwnership: Record<EntityId, EntityId | null> = {},
  armies: Record<EntityId, import('../types').Army> = {},
): Decision | null {
  const ownRulerId = forces[forceId]?.rulerOfficerId;
  // 1. Food crisis — develop agriculture
  if (city.food < city.troops * 0.6) {
    const o = bestForCommand(officersHere, 'politics', 'develop-agriculture', prefectId);
    if (o && canAfford(city, 'develop-agriculture')) {
      return internalDecision('develop-agriculture', city, o);
    }
  }

  // 2. Troop crisis — recruit
  if (city.troops < 3000) {
    const o = bestForCommand(officersHere, 'charisma', 'recruit-troops', prefectId);
    if (o && canAfford(city, 'recruit-troops') && city.population > 50_000) {
      return internalDecision('recruit-troops', city, o);
    }
  }

  // 3. Loyalty crisis — pacify
  if (city.loyalty < 40) {
    const o = bestForCommand(officersHere, 'charisma', 'improve-loyalty', prefectId);
    if (o && canAfford(city, 'improve-loyalty')) {
      return internalDecision('improve-loyalty', city, o);
    }
  }

  // 3.5 Field interception — a hostile column is bearing down on this city
  // (or threatening it from nearby open ground). Rather than wait behind the
  // walls, sally a field army to meet them in the open: dispatch to an
  // intercept cell on the line between the city and the incoming army, so the
  // two columns clash mid-route (resolveSeason's INTERCEPT_DIST handles the
  // actual battle). This is how the AI uses the persistent-army layer.
  if (city.troops >= 6000 && city.gold >= COMMAND_DEFS['march'].goldCost) {
    const armyList = Object.values(armies);
    // Don't pile on: if we already have a column out near this city, the
    // response is underway — let it play out instead of stacking interceptors.
    const ownColumnNearby = armyList.some(
      (a) => a.forceId === forceId && !a.holding &&
        Math.hypot(a.x - city.coords.x, a.y - city.coords.y) < 130,
    );
    if (!ownColumnNearby) {
      const THREAT_DIST = 210;   // how close a hostile column must be to react
      let threat: import('../types').Army | null = null;
      let threatScore = Infinity;
      for (const a of armyList) {
        if (a.forceId === forceId) continue;
        if (!isHostilePermitted(diplomacy, forceId, a.forceId)) continue;
        if (a.troops < 1500) continue; // not worth a sally
        const d = Math.hypot(a.x - city.coords.x, a.y - city.coords.y);
        const aimsHere = a.targetCityId === city.id && !a.cellTarget;
        if (!aimsHere && d > THREAT_DIST) continue;
        // Prefer the nearest; a column explicitly targeting us jumps the queue.
        const score = d - (aimsHere ? 400 : 0);
        if (score < threatScore) { threatScore = score; threat = a; }
      }
      // Someone already engaging this threat? Then don't double up.
      const alreadyEngaged = threat && armyList.some(
        (a) => a.forceId === forceId &&
          Math.hypot(a.x - threat!.x, a.y - threat!.y) < 50,
      );
      if (threat && !alreadyEngaged) {
        const marchPool = officersHere.filter((c) => !isCombatLiability(c));
        const o = bestForCommand(marchPool, 'war', 'march');
        if (o && o.stats.war >= 62) {
          // Keep the city defensible: never send so much that the remaining
          // garrison can't cover the incoming column.
          const keep = Math.max(3000, Math.floor(threat.troops * 0.5));
          const sendTroops = Math.min(
            Math.floor(city.troops * 0.6),
            city.troops - keep,
          );
          if (sendTroops >= 2000) {
            // Intercept cell ≈ 45% of the way from the city to the column,
            // nudged back toward the city until it lands on solid ground.
            const cx = city.coords.x, cy = city.coords.y;
            let ix = cx, iy = cy;
            for (let f = 0.45; f >= 0.12; f -= 0.08) {
              const tx = cx + (threat.x - cx) * f;
              const ty = cy + (threat.y - cy) * f;
              if (isLand(tx, ty, 2)) { ix = tx; iy = ty; break; }
            }
            const companion = marchPool
              .filter((c) => c.id !== o.id)
              .sort((p, q) =>
                (q.stats.war * 0.6 + q.stats.leadership * 0.4) -
                (p.stats.war * 0.6 + p.stats.leadership * 0.4))[0];
            const companions = companion ? [companion.id] : [];
            const dist = Math.hypot(ix - cx, iy - cy);
            const dur = dist < 80 ? 1 : dist < 150 ? 2 : dist < 240 ? 3 : 4;
            const cmd: MarchCommand = {
              type: 'march',
              cityId: city.id,
              officerId: o.id,
              targetCityId: city.id,
              targetX: ix,
              targetY: iy,
              troops: sendTroops,
              additionalOfficerIds: companions.length > 0 ? companions : undefined,
              seasonsRemaining: dur,
              totalSeasons: dur,
            };
            return { command: cmd, officer: o, companions };
          }
        }
      }
    }
  }

  // 4. Opportunity to attack a weaker neighbor
  if (city.troops >= 5000 && city.gold >= COMMAND_DEFS['march'].goldCost) {
    // Phase 3d — reclaim bias: how many of MY territory cells does each
    // candidate force currently hold? Use as a soft preference so AI
    // counter-marches forces that have been raiding it.
    const reclaimDebt: Record<EntityId, number> = {};
    for (const [terId, ownerId] of Object.entries(territoryOwnership)) {
      if (!ownerId || ownerId === forceId) continue;
      // territory ids are `${parentCityId}-${i}` — recover parent.
      const dash = terId.lastIndexOf('-');
      const parentCityId = dash > 0 ? terId.slice(0, dash) : terId;
      const parent = allCities[parentCityId];
      if (parent?.ownerForceId === forceId) {
        reclaimDebt[ownerId] = (reclaimDebt[ownerId] ?? 0) + 1;
      }
    }
    const targets = city.adjacentCityIds
      .map((id) => allCities[id])
      .filter(
        (c): c is City =>
          !!c &&
          c.ownerForceId !== forceId &&
          (c.ownerForceId === null ||
            isHostilePermitted(diplomacy, forceId, c.ownerForceId)),
      )
      .sort((a, b) => {
        // Lower troops = easier; but a target whose owner is sitting on
        // my captured cells gets an effective discount.
        const aDebt = a.ownerForceId ? (reclaimDebt[a.ownerForceId] ?? 0) : 0;
        const bDebt = b.ownerForceId ? (reclaimDebt[b.ownerForceId] ?? 0) : 0;
        return (a.troops - aDebt * 400) - (b.troops - bDebt * 400);
      });

    const baseThreshold =
      difficulty === 'easy' ? 0.4 : difficulty === 'hard' ? 0.8 : 0.6;
    for (const target of targets) {
      // X1a — relationship-based deterrence between rulers.
      // 0.2 = parent/child/spouse, 0.35 = sworn brothers, 0.5 = mentor,
      // 1.0 = neutral, 1.10 = rival, 1.30 = personal enemy.
      const targetRulerId = target.ownerForceId
        ? forces[target.ownerForceId]?.rulerOfficerId
        : undefined;
      const deterrence = attackDeterrence(ownRulerId, targetRulerId, family);
      const attackThreshold = baseThreshold * deterrence;

      // Effective defender strength factors in city defense: a fortress at
      // defense 88 (Tongguan) counts as if the garrison were ~60% larger.
      const defenseMultiplier = 1 + target.defense / 200;
      const effectiveDefenderTroops = target.troops * defenseMultiplier;
      const ratio = effectiveDefenderTroops / Math.max(1, city.troops);
      if (ratio > attackThreshold) continue;
      // P4 — exclude cowardly/frail officers from leading marches.
      const marchPool = officersHere.filter((c) => !isCombatLiability(c));
      const o = bestForCommand(marchPool, 'war', 'march');
      if (!o || o.stats.war < 60) continue;
      const sendTroops = Math.floor(city.troops * 0.7);
      if (sendTroops < 1000) continue;

      // Multi-officer: pick up to 2 companions. Score uses 60% war + 40%
      // leadership (matching the battle blended-stat formula) plus a
      // sizeable bonus for officers bonded to the commander, and a smaller
      // bonus for officers bonded to each other (so picking the third
      // creates double-bond stacks like Liu/Guan/Zhang or Cao+Xiahou).
      const scoreFor = (c: Officer, alreadyPicked: Officer[]): number => {
        const blended = c.stats.war * 0.6 + c.stats.leadership * 0.4;
        const cmdBond = isBondedTo(o.id, c.id) ? 30 : 0;
        const peerBonds = alreadyPicked.reduce(
          (s, p) => s + (isBondedTo(p.id, c.id) ? 15 : 0),
          0,
        );
        return blended + cmdBond + peerBonds;
      };
      const companionPool = officersHere.filter((c) => c.id !== o.id && !isCombatLiability(c));
      const picked: Officer[] = [];
      while (picked.length < 2 && companionPool.length > picked.length) {
        const remaining = companionPool.filter(
          (c) => !picked.includes(c),
        );
        const next = remaining.sort(
          (a, b) => scoreFor(b, picked) - scoreFor(a, picked),
        )[0];
        if (!next) break;
        picked.push(next);
      }
      const companions = picked.map((c) => c.id);

      const dur = marchDurationFor(city, target);
      const cmd: MarchCommand = {
        type: 'march',
        cityId: city.id,
        officerId: o.id,
        targetCityId: target.id,
        troops: sendTroops,
        additionalOfficerIds: companions.length > 0 ? companions : undefined,
        seasonsRemaining: dur,
        totalSeasons: dur,
      };
      return { command: cmd, officer: o, companions };
    }
  }

  // 5. Routine — develop the lowest of agriculture/commerce/defense
  const devType = lowestDevCommand(city);
  const o = bestBy(officersHere, 'politics', prefectId);
  if (o && canAfford(city, devType)) {
    return internalDecision(devType, city, o);
  }

  // 6. Pacify if we can afford it (cheap fallback)
  if (city.loyalty < 90) {
    const fb = bestBy(officersHere, 'charisma', prefectId);
    if (fb && canAfford(city, 'improve-loyalty')) {
      return internalDecision('improve-loyalty', city, fb);
    }
  }

  // No command this turn.
  void rng; // reserved for future randomness
  return null;
}

function internalDecision(
  type: InternalAffairsType,
  city: City,
  officer: Officer,
): Decision {
  const cmd: InternalAffairsCommand = {
    type,
    cityId: city.id,
    officerId: officer.id,
  };
  return { command: cmd, officer };
}

function canAfford(city: City, type: InternalAffairsType | 'march'): boolean {
  return city.gold >= COMMAND_DEFS[type].goldCost;
}

function bestBy(
  officers: Officer[],
  stat: keyof OfficerStats,
  prefectId: EntityId | null = null,
): Officer | null {
  if (officers.length === 0) return null;
  return [...officers].sort((a, b) => {
    const aScore = a.stats[stat] * (a.id === prefectId ? 1.2 : 1);
    const bScore = b.stats[stat] * (b.id === prefectId ? 1.2 : 1);
    return bScore - aScore;
  })[0];
}

/** P3 — fit-aware picker. Score = stat × trait fit × prefect bias.
 *  Prefects get a +20% nudge when their seat city is the work site, so
 *  the +15% internalMultiplier bonus actually lands. */
function bestForCommand(
  officers: Officer[],
  stat: keyof OfficerStats,
  type: InternalAffairsType | 'march',
  prefectId: EntityId | null = null,
): Officer | null {
  if (officers.length === 0) return null;
  return [...officers].sort((a, b) => {
    const aPref = a.id === prefectId ? 1.2 : 1;
    const bPref = b.id === prefectId ? 1.2 : 1;
    return (
      b.stats[stat] * commandFitMultiplier(b, type) * bPref -
      a.stats[stat] * commandFitMultiplier(a, type) * aPref
    );
  })[0];
}

function lowestDevCommand(
  city: City,
): 'develop-agriculture' | 'develop-commerce' | 'build-defense' {
  const stats: Array<[
    'develop-agriculture' | 'develop-commerce' | 'build-defense',
    number,
  ]> = [
    ['develop-agriculture', city.agriculture],
    ['develop-commerce', city.commerce],
    ['build-defense', city.defense],
  ];
  stats.sort((a, b) => a[1] - b[1]);
  return stats[0][0];
}
