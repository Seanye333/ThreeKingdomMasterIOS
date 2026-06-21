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
import { isLand, terrainMarchCost, WORLD_SCALE } from '../data/geography';
import { cityPos } from '../data/cityGeo';
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
import { officerGrade, gradeRank } from './officerGrade';
import { attackDeterrence, recruitPreferenceScore, runtimeSwornPair } from './relationshipEffects';

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

  // The map's runaway power, if any — lesser forces gang up on it (合縱抗霸).
  const hegemonId = findHegemon(cities);
  for (const [forceId, forceCities] of citiesByForce) {
    // Force-level offensive focus for the season — bordering cities mass on it.
    const forceTargetId = pickForceTarget(forceId, forceCities, cities, input.diplomacy, hegemonId);
    // Season posture: consolidate when a bordering force overshadows us.
    const posture = forcePosture(forceId, forceCities, cities);
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
        forceTargetId,
        posture,
        hegemonId,
        input.date.season,
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

  // ── AI 義兄弟 / 私兵: forces invest their renown + treasury into their own
  //    officers, mirroring what the player can do — so the systems are
  //    two-sided. Sworn brotherhood binds two strong generals (combat synergy
  //    + loyalty floor); 私兵 funds a top commander's household guard. ──
  for (const forceId of aiForceIds) {
    const force = input.forces[forceId];
    if (!force) continue;
    const capital = cities[force.capitalCityId];
    if (!capital) continue;
    let capitalGold = capital.gold;

    const forceOfficers = Object.values(officers).filter(
      (o) => o.forceId === forceId && o.status !== 'dead' && o.status !== 'imprisoned',
    );
    if (forceOfficers.length === 0) continue;

    // 結拜 — bind the two strongest unbonded warriors (~7%/season, needs gold).
    if (capitalGold >= 500 && rng() < 0.07) {
      const warriors = [...forceOfficers]
        .filter((o) => o.stats.war >= 75)
        .sort((a, b) => b.stats.war - a.stats.war);
      outer: for (let i = 0; i < warriors.length; i++) {
        for (let j = i + 1; j < warriors.length; j++) {
          const a = warriors[i], b = warriors[j];
          if (runtimeSwornPair(a.id, b.id, runtimeBonds)) continue;
          runtimeBonds.push({
            officerA: a.id, officerB: b.id, floor: 90, kind: 'sibling',
            label: `${a.name.en} & ${b.name.en} 義兄弟`,
          });
          capitalGold -= 300;
          officers[a.id] = { ...officers[a.id], loyalty: Math.max(officers[a.id].loyalty ?? 0, 90) };
          officers[b.id] = { ...officers[b.id], loyalty: Math.max(officers[b.id].loyalty ?? 0, 90) };
          entries.push({
            cityId: null, kind: 'note',
            text: `${a.name.en} and ${b.name.en} of ${force.name.en} swear brotherhood.`,
            textZh: `${force.name.zh}麾下${a.name.zh}與${b.name.zh}義結金蘭。`,
          });
          break outer;
        }
      }
    }

    // 私兵 — fund the top commander's guard when the treasury is flush.
    if (capitalGold >= 4000) {
      const top = [...forceOfficers].sort((a, b) => b.stats.war - a.stats.war)[0];
      if (top) {
        const cap = top.stats.leadership * 100;
        const room = cap - (top.privateTroops ?? 0);
        if (room > 0) {
          // Spend up to a quarter of the spare treasury, 2 gold/unit.
          const affordable = Math.floor((capitalGold - 2000) / 2);
          const take = Math.max(0, Math.min(room, affordable, 4000));
          if (take > 0) {
            officers[top.id] = { ...officers[top.id], privateTroops: (top.privateTroops ?? 0) + take };
            capitalGold -= take * 2;
          }
        }
      }
    }

    if (capitalGold !== capital.gold) {
      cities[capital.id] = { ...cities[capital.id], gold: capitalGold };
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

  // ── AI split (分兵) ───────────────────────────────────────────────
  // An oversized dug-in field camp divides to cover more ground, planting a
  // second ambush under a spare officer at a nearby covered cell. The
  // counterpart to the automatic 合流 (co-located camps merge in
  // resolveSeason). One split per force per season, kept conservative.
  for (const forceId of aiForceIds) {
    if (rng() > 0.4) continue;
    // Largest holding camp of this force that has a spare officer to lead
    // the detachment and enough troops to leave both halves viable.
    let bestCmd: MarchCommand | null = null;
    let bestTroops = 9000;
    for (const cmd of Object.values(pendingCommands)) {
      if (cmd.type !== 'march' || !cmd.holding) continue;
      if (officers[cmd.officerId]?.forceId !== forceId) continue;
      if ((cmd.additionalOfficerIds?.length ?? 0) < 1) continue;
      if ((cmd.troops ?? 0) > bestTroops) { bestTroops = cmd.troops; bestCmd = cmd; }
    }
    if (!bestCmd) continue;
    const detachTroops = Math.floor(bestCmd.troops / 2);
    if (detachTroops < 3000) continue;
    const army = input.armies?.[bestCmd.officerId];
    const srcCity = cities[bestCmd.cityId];
    const cx = army?.x ?? (srcCity ? cityPos(srcCity).x : undefined);
    const cy = army?.y ?? (srcCity ? cityPos(srcCity).y : undefined);
    if (cx == null || cy == null) continue;
    // Plant the detachment on the best-covered nearby land cell.
    let bx = cx, by = cy, bestCover = -1;
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      const tx = cx + Math.cos(ang) * 44 * WORLD_SCALE, ty = cy + Math.sin(ang) * 44 * WORLD_SCALE;   // scaled ×1.21, then ×WORLD_SCALE
      if (!isLand(tx, ty, 2)) continue;
      const cover = terrainMarchCost(tx, ty);
      if (cover > bestCover) { bestCover = cover; bx = tx; by = ty; }
    }
    const companions = bestCmd.additionalOfficerIds ?? [];
    const detachId = companions[0];
    const remain = companions.slice(1);
    pendingCommands[bestCmd.officerId] = {
      ...bestCmd,
      troops: bestCmd.troops - detachTroops,
      additionalOfficerIds: remain.length > 0 ? remain : undefined,
    };
    pendingCommands[detachId] = {
      type: 'march', cityId: bestCmd.cityId, officerId: detachId,
      targetCityId: bestCmd.targetCityId, targetX: bx, targetY: by,
      troops: detachTroops, holding: true, seasonsRemaining: 1, totalSeasons: 1,
    };
    const dOff = officers[detachId];
    if (dOff) officers[detachId] = { ...dOff, task: 'march' };
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

/**
 * Force-level offensive focus: pick the single enemy/neutral city this force
 * should concentrate on this season — the one its bordering cities can most
 * readily overwhelm *together* (combined adjacent troops vs the target's
 * defence) weighted by the prize (population). Returns null if nothing on the
 * border is collectively takeable.
 *
 * decideCommand then biases every bordering city toward this one target, so the
 * AI masses several columns on a single city instead of each city poking its
 * own nearest neighbour piecemeal.
 */
export function pickForceTarget(
  forceId: EntityId,
  forceCities: City[],
  allCities: Record<EntityId, City>,
  diplomacy: DiplomaticState,
  hegemonId: EntityId | null = null,
): EntityId | null {
  // City count per force — used to spot a death blow (an enemy's last city).
  const cityCount: Record<EntityId, number> = {};
  for (const c of Object.values(allCities)) {
    if (c.ownerForceId) cityCount[c.ownerForceId] = (cityCount[c.ownerForceId] ?? 0) + 1;
  }
  // Candidate → total friendly troops that could march on it from our border.
  const pressure: Record<EntityId, number> = {};
  for (const city of forceCities) {
    for (const adjId of city.adjacentCityIds) {
      const adj = allCities[adjId];
      if (!adj || adj.ownerForceId === forceId) continue;
      if (adj.ownerForceId !== null && !isHostilePermitted(diplomacy, forceId, adj.ownerForceId)) continue;
      // Each bordering city could commit ~60% of its garrison.
      pressure[adjId] = (pressure[adjId] ?? 0) + city.troops * 0.6;
    }
  }
  let best: EntityId | null = null;
  let bestScore = 0;
  for (const [candId, force] of Object.entries(pressure)) {
    const cand = allCities[candId];
    if (!cand) continue;
    const effDef = cand.troops * (1 + cand.defense / 200);
    const feasibility = force / Math.max(1, effDef);
    if (feasibility < 1.05) continue; // can't realistically take it, even massed
    const value = 1 + (cand.population ?? 0) / 200_000;
    // Death blow: taking the last city of an enemy force wipes it off the map —
    // worth far more than the city's size alone, so the AI finishes off crippled
    // rivals instead of leaving one-city rumps to linger.
    const elimination = cand.ownerForceId && cityCount[cand.ownerForceId] === 1 ? 2.5 : 1;
    // 合縱抗霸: pile onto the hegemon's frontier so the lesser powers gang up.
    const hegemon = cand.ownerForceId && cand.ownerForceId === hegemonId ? 1.6 : 1;
    const score = feasibility * value * elimination * hegemon;
    if (score > bestScore) { bestScore = score; best = candId; }
  }
  return best;
}

/**
 * Rear-to-front reinforcement: for a *safe* city (not itself bordering an enemy),
 * find a friendly neighbour that IS on the front (borders an enemy) and is
 * notably weaker, to ferry surplus troops to. Returns that city id, or null if
 * this city is on the front itself or has no weak bordering neighbour. A march
 * to a friendly city reinforces it (handleMarch merges the troops).
 */
export function pickReinforcementTarget(
  city: City,
  allCities: Record<EntityId, City>,
  forceId: EntityId,
  diplomacy: DiplomaticState,
): EntityId | null {
  const bordersEnemy = (c: City) => c.adjacentCityIds.some((id) => {
    const e = allCities[id];
    return !!e && e.ownerForceId !== forceId &&
      (e.ownerForceId === null || isHostilePermitted(diplomacy, forceId, e.ownerForceId));
  });
  if (bordersEnemy(city)) return null; // a front-line city keeps its garrison
  let best: EntityId | null = null;
  let bestTroops = Infinity;
  for (const id of city.adjacentCityIds) {
    const c = allCities[id];
    if (!c || c.ownerForceId !== forceId || c.id === city.id) continue;
    if (c.troops >= city.troops * 0.6) continue; // not notably weaker
    if (!bordersEnemy(c)) continue;              // not actually on the front
    if (c.troops < bestTroops) { bestTroops = c.troops; best = c.id; }
  }
  return best;
}

/**
 * Strategic posture for the season. 'defensive' when a bordering force overshadows
 * us (≥1.5× our total troops) — the AI then consolidates (reinforce/develop/dig
 * in) and only takes very safe attacks or death blows, instead of overextending
 * into risky land-grabs while a hegemon looms. 'aggressive' otherwise.
 */
export function forcePosture(
  forceId: EntityId,
  forceCities: City[],
  allCities: Record<EntityId, City>,
): 'aggressive' | 'defensive' {
  const myTroops = computeTotalTroops(forceId, allCities);
  const neighbors = new Set<EntityId>();
  for (const c of forceCities) {
    for (const adjId of c.adjacentCityIds) {
      const adj = allCities[adjId];
      if (adj?.ownerForceId && adj.ownerForceId !== forceId) neighbors.add(adj.ownerForceId);
    }
  }
  let maxNeighbor = 0;
  for (const nid of neighbors) maxNeighbor = Math.max(maxNeighbor, computeTotalTroops(nid, allCities));
  return maxNeighbor >= myTroops * 1.5 ? 'defensive' : 'aggressive';
}

/**
 * The map's hegemon — the single force whose total troops clearly dominate
 * (>1.3× the next strongest). Returns null when no one runs away with it, so
 * forces only gang up once a leader actually emerges. Other forces then bias
 * their offensives onto the hegemon's frontier (合縱抗霸) and will strike it even
 * from a defensive posture, the only real check on a runaway power.
 */
export function findHegemon(allCities: Record<EntityId, City>): EntityId | null {
  const totals: Record<EntityId, number> = {};
  for (const c of Object.values(allCities)) {
    if (c.ownerForceId) totals[c.ownerForceId] = (totals[c.ownerForceId] ?? 0) + c.troops;
  }
  const sorted = Object.values(totals).length >= 2
    ? Object.entries(totals).sort((a, b) => b[1] - a[1])
    : [];
  if (sorted.length < 2) return null;
  return sorted[0][1] > sorted[1][1] * 1.3 ? sorted[0][0] : null;
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
  forceTargetId: EntityId | null = null,
  posture: 'aggressive' | 'defensive' = 'aggressive',
  hegemonId: EntityId | null = null,
  season?: 'spring' | 'summer' | 'autumn' | 'winter',
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
        Math.hypot(a.x - cityPos(city).x, a.y - cityPos(city).y) < 157 * WORLD_SCALE,   // scaled ×1.21, then ×WORLD_SCALE
    );
    if (!ownColumnNearby) {
      const THREAT_DIST = 255 * WORLD_SCALE;   // how close a hostile column must be to react (scales with world)
      let threat: import('../types').Army | null = null;
      let threatScore = Infinity;
      for (const a of armyList) {
        if (a.forceId === forceId) continue;
        if (!isHostilePermitted(diplomacy, forceId, a.forceId)) continue;
        if (a.troops < 1500) continue; // not worth a sally
        const cp0 = cityPos(city);
        const d = Math.hypot(a.x - cp0.x, a.y - cp0.y);
        const aimsHere = a.targetCityId === city.id && !a.cellTarget;
        if (!aimsHere && d > THREAT_DIST) continue;
        // Prefer the nearest; a column explicitly targeting us jumps the queue.
        const score = d - (aimsHere ? 400 : 0);
        if (score < threatScore) { threatScore = score; threat = a; }
      }
      // Someone already engaging this threat? Then don't double up.
      const alreadyEngaged = threat && armyList.some(
        (a) => a.forceId === forceId &&
          Math.hypot(a.x - threat!.x, a.y - threat!.y) < 60 * WORLD_SCALE,   // scaled ×1.21, then ×WORLD_SCALE
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
            // Intercept cell ≈ 25–50% of the way from the city to the column.
            // Among the land candidates on that line, pick the one with the
            // best terrain cover so the column springs its ambush from rough
            // ground (mountains/river crossings amplify the ambush bonus).
            const cp1 = cityPos(city);
            const cx = cp1.x, cy = cp1.y;
            let ix = cx, iy = cy, bestCover = -1;
            for (let f = 0.5; f >= 0.18; f -= 0.06) {
              const tx = cx + (threat.x - cx) * f;
              const ty = cy + (threat.y - cy) * f;
              if (!isLand(tx, ty, 2)) continue;
              const cover = terrainMarchCost(tx, ty);
              if (cover > bestCover) { bestCover = cover; ix = tx; iy = ty; }
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
        // The force-level focus target jumps the queue so bordering cities mass
        // on one city; otherwise lower troops = easier, with a discount for an
        // owner sitting on my captured cells.
        const aFocus = a.id === forceTargetId ? 100_000 : 0;
        const bFocus = b.id === forceTargetId ? 100_000 : 0;
        const aDebt = a.ownerForceId ? (reclaimDebt[a.ownerForceId] ?? 0) : 0;
        const bDebt = b.ownerForceId ? (reclaimDebt[b.ownerForceId] ?? 0) : 0;
        return (a.troops - aDebt * 400 - aFocus) - (b.troops - bDebt * 400 - bFocus);
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
      // The force-focus target gets a relaxed bar: it was chosen because the
      // border can take it *collectively*, so individual cities should commit
      // even when their own ratio is a touch short — the columns converge.
      const focusRelax = target.id === forceTargetId ? 1.3 : 1;
      // Under a looming hegemon, consolidate: only very safe attacks / death
      // blows clear the bar, so the force doesn't overextend while outmatched —
      // EXCEPT a strike on the hegemon itself, which a coalition presses even
      // from a defensive posture (still gated by feasibility, so no suicide).
      const vsHegemon = target.ownerForceId != null && target.ownerForceId === hegemonId;
      const postureMul = posture === 'defensive' && !vsHegemon ? 0.5 : 1;
      const attackThreshold = baseThreshold * deterrence * focusRelax * postureMul;

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

      const dur = marchDurationFor(city, target, season);
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

  // 4.5 Rear reinforcement — a safe, troop-rich city (no enemy on its own
  // border) ferries surplus troops to a weak front-line neighbour. A friendly-
  // target march reinforces rather than assaults, so the front thickens up
  // instead of the rear hoarding an idle army.
  if (city.troops >= 8000 && city.gold >= COMMAND_DEFS['march'].goldCost) {
    const destId = pickReinforcementTarget(city, allCities, forceId, diplomacy);
    const dest = destId ? allCities[destId] : null;
    if (dest) {
      const send = Math.floor((city.troops - 5000) * 0.8); // keep a 5000 garrison
      if (send >= 2000) {
        const o = officersHere.find((c) => !isCombatLiability(c)) ?? officersHere[0];
        if (o) {
          const dur = marchDurationFor(city, dest, season);
          const cmd: MarchCommand = {
            type: 'march', cityId: city.id, officerId: o.id, targetCityId: dest.id,
            troops: send, seasonsRemaining: dur, totalSeasons: dur,
          };
          return { command: cmd, officer: o };
        }
      }
    }
  }

  // 5. Routine — front-line cities fortify, rear cities grow the economy.
  const onFront = city.adjacentCityIds.some((id) => {
    const e = allCities[id];
    return !!e && e.ownerForceId !== forceId &&
      (e.ownerForceId === null || isHostilePermitted(diplomacy, forceId, e.ownerForceId));
  });
  const devType = chooseDevelopment(city, onFront);
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
  // 品階優先 — when fielding a field commander (march), a proven 品階 tips the
  // scale, so the AI sends its 金牌/白金/鑽石 names to the front, not just raw 武力.
  const gradePref = (o: Officer) => (type === 'march' ? 1 + gradeRank(officerGrade(o).grade) * 0.04 : 1);
  return [...officers].sort((a, b) => {
    const aPref = a.id === prefectId ? 1.2 : 1;
    const bPref = b.id === prefectId ? 1.2 : 1;
    return (
      b.stats[stat] * commandFitMultiplier(b, type) * bPref * gradePref(b) -
      a.stats[stat] * commandFitMultiplier(a, type) * aPref * gradePref(a)
    );
  })[0];
}

/**
 * Position-aware development (force-level economic division of labour): a
 * front-line city (bordering an enemy) walls up first and only funds the economy
 * once well-fortified; a rear city is a pure economic engine, pumping whichever
 * of commerce/agriculture is lower and never wasting effort on walls it'll never
 * need. Replaces the old position-blind "raise the lowest stat".
 */
export function chooseDevelopment(
  city: City,
  onFront: boolean,
): 'develop-agriculture' | 'develop-commerce' | 'build-defense' {
  const econ = city.commerce <= city.agriculture ? 'develop-commerce' : 'develop-agriculture';
  if (onFront) return city.defense < 75 ? 'build-defense' : econ;
  return econ;
}
