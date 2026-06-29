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
  TaxRate,
  WarCoalition,
} from '../types';
import { getRelation, isHostilePermitted, pairKey } from '../types';
import { coalitionTargetFor } from './diplomacyPacts';
import type { Difficulty } from '../state/gameState';
import { OATH_BONDS, type OathBond } from '../data/bonds';
import { COMMAND_DEFS, meetsMinSize } from './commands';
import { buyQuote, sellQuote, sellHorses, sellIron, borderTariff } from './market';
import { CITY_SPECIALTY, cityRole, specialtyControl } from '../data/specialties';
import { buildingBonuses } from './buildings';
import { citySize, cityCarryingCapacity, cityEconCap, cityStatCap } from './citySize';
import { marchDurationFor } from '../data/cities';
import { marchSpeedMul, adjustMarchSeasons } from './marchPace';
import { marchSpeedMultiplier } from './weather';
import { siegeFacilityAid, terrainSiegeMultiplier, attackerArm } from './combat';
import { computeFog, type FogView } from './fogOfWar';
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
import { personalityAttackMul, personalityDiplomacyAppetite } from './rulerPersonality';
import { officerGrade, gradeRank } from './officerGrade';
import { attackDeterrence, recruitPreferenceScore, runtimeSwornPair, runtimeFeudPair } from './relationshipEffects';
import { addFriction } from './friction';

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
  /** Pairwise officer rapport (好感) — AI reads it to weight recruiting and
   *  runs 治府 upkeep on its own officers (5d). Returned (possibly grown). */
  rapport?: Record<string, number>;
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
  /** 共討會盟 — active war leagues. A member force biases its offensive focus
   *  toward the sworn foe (see pickForceTarget) — §7.1 ②. */
  warCoalitions?: WarCoalition[];
  /** Current per-force tax rates — the AI reads & updates its own forces'. */
  taxPolicy?: Record<EntityId, TaxRate>;
  date: GameDate;
  difficulty?: Difficulty;
  /** AI 強度 (1–5, default 3) — independent of difficulty. Scales how readily
   *  forces go on the offensive (see aggressionFromStrength). */
  aiStrength?: number;
  /** This season's weather — 知天候 AI strikes while the wind serves a fire
   *  attack and waits out a snowbound march (see weatherAttackMul). */
  weather?: import('./weather').Weather;
  /** Strategic forts/facilities — 識城防 AI counts an enemy city's 箭樓/投石臺
   *  network as a stiffer defence and shies off (see siegeFacilityAid). */
  forts?: Record<EntityId, import('../types/fort').Fort>;
  /** 迷霧對等 — when fog is on, the AI is fogged TOO: it only reacts to enemy
   *  columns its own forces can actually see, instead of magically intercepting
   *  every player march (see the field-interception gate in decideCommand). */
  fogOfWar?: boolean;
  rng?: () => number;
}

/** Map the 1–5 AI-strength dial to a multiplier on the attack threshold.
 *  >1 = the AI tolerates worse troop ratios (more aggressive expansion). */
export function aggressionFromStrength(level: number | undefined): number {
  const lv = Math.max(1, Math.min(5, Math.round(level ?? 3)));
  return [0.6, 0.8, 1.0, 1.2, 1.45][lv - 1];
}

/**
 * 知天候 — multiplier on the attack threshold from this season's weather
 * (>1 = strike now, <1 = bide). A 知火 commander on hand (a 智謀 who can light
 * the fields) will press HARD while a dry gale serves the torch — 萬事俱備,
 * 只欠東風. Snow grinds a march to a crawl, so a snowbound front holds. Rain is
 * a mild damper. Weather-blind before this; now the AI campaigns by the sky.
 */
export function weatherAttackMul(
  weather: import('./weather').Weather | undefined,
  hasFireMind: boolean,
): number {
  if (!weather) return 1;
  if (weather.kind === 'snow') return 0.82;          // 雪沒脛 — marching is misery
  if (weather.kind === 'rain') return 0.94;          // muddy roads, wet bows
  // A gale is the attacker's friend only if someone can exploit it with fire.
  if (weather.kind === 'wind' && weather.windPower >= 2) return hasFireMind ? 1.18 : 1.04;
  if (weather.kind === 'drought') return hasFireMind ? 1.08 : 1.0; // parched fields burn
  return 1;
}

export interface AIPlanOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  pendingCommands: Record<EntityId, Command>;
  /** Trainings the AI started this turn (to be merged into state.pendingTrainings). */
  newTrainings: PendingTraining[];
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  /** Officer rapport after AI 治府 upkeep (5d). */
  rapport?: Record<string, number>;
  /** Updated tax rates (AI forces only; player's entry passes through). */
  taxPolicy: Record<EntityId, TaxRate>;
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
  const aiAggressionMul = aggressionFromStrength(input.aiStrength);
  const cities = { ...input.cities };
  const officers = { ...input.officers };
  const pendingCommands = { ...input.pendingCommands };
  const newTrainings: PendingTraining[] = [];
  let diplomacy = input.diplomacy;
  const runtimeBonds = [...input.runtimeBonds];
  let rapport = { ...(input.rapport ?? {}) };
  const taxPolicy = { ...(input.taxPolicy ?? {}) };
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
    // A sworn coalition member trains its spear on the league's foe (§7.1 ②).
    const coalitionFoeId = coalitionTargetFor(forceId, input.warCoalitions ?? []);
    const forceTargetId = pickForceTarget(forceId, forceCities, cities, input.diplomacy, hegemonId, coalitionFoeId);
    // Season posture: consolidate when a bordering force overshadows us.
    const posture = forcePosture(forceId, forceCities, cities);
    // 迷霧對等 — this force's own sight of the map (own cities + borders + its
    // columns' scout rings). When fog is on, the AI may only react to enemy
    // columns inside it; off → null = omniscient, same as the player un-fogged.
    const fog: FogView | null = input.fogOfWar
      ? computeFog(cities, input.armies ?? {}, forceId, undefined, officers)
      : null;
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
        aiAggressionMul,
        input.weather,
        input.forts,
        fog,
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
        const rel = recruitPreferenceScore(o.id, ruler.id, input.family ?? [], rapport);
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

  // ── 市易 — AI grain market: balance each city's food↔gold instead of
  //    letting starvation or a glut go to waste (the player's 市易 lever, now
  //    used by the AI). Each city trades with its own coffers, like 兵糧 the
  //    player would shore up. Buy low into a starving garrison; sell a granary
  //    glut (which is being price-penalised anyway) when gold runs short.
  {
    const season = input.date.season;
    for (const forceCities of citiesByForce.values()) {
      for (const c of forceCities) {
        const city = cities[c.id];
        if (!city) continue;
        const need = city.troops * 2;                       // upkeep buffer before desertion
        // Starving + has coin → buy grain up toward the buffer, keeping a 100g reserve.
        if (city.food < city.troops * 1.5 && city.gold > 200) {
          const deficit = need - city.food;
          let spend = Math.min(city.gold - 100, Math.ceil(deficit / Math.max(1, buyQuote(city, season, 1))));
          spend = Math.max(0, Math.min(spend, Math.floor(city.gold * 0.6)));
          if (spend >= 20) {
            const bought = buyQuote(city, season, spend);
            if (bought > 0) cities[city.id] = { ...city, gold: city.gold - spend, food: city.food + bought };
          }
        }
        // Glut + gold-poor → sell the surplus above ×6 mouths for coin.
        else if (city.food > city.troops * 8 && city.gold < 800) {
          const surplus = city.food - city.troops * 6;
          if (surplus >= 200) {
            const gold = sellQuote(city, season, surplus);
            if (gold > 0) cities[city.id] = { ...city, gold: city.gold + gold, food: city.food - surplus };
          }
        }
        // 馬市 — a horse-country city with a fat herd and a thin purse sells the
        // surplus for coin (and keeps the warhorse market liquid for the player).
        const c2 = cities[city.id];
        const horses = c2.warhorses ?? 0;
        if (horses > 1500 && c2.gold < 1200) {
          const producer = CITY_SPECIALTY[city.id] === 'horse';
          const surplusH = horses - 1000;
          const gold = sellHorses(c2, producer, surplusH);
          if (gold > 0) cities[city.id] = { ...c2, gold: c2.gold + gold, warhorses: horses - surplusH };
        }
        // 鐵市 — likewise sell off an iron glut when the purse runs thin.
        const c3 = cities[city.id];
        const ore = c3.iron ?? 0;
        if (ore > 2500 && c3.gold < 1200) {
          const producer = CITY_SPECIALTY[city.id] === 'iron';
          const surplusI = ore - 1500;
          const gold = sellIron(c3, producer, surplusI);
          if (gold > 0) cities[city.id] = { ...c3, gold: c3.gold + gold, iron: ore - surplusI };
        }
      }
    }
  }

  // ── 榷場 — AI cross-border grain relief: a glutted city ships its surplus to
  //    an adjacent peace-partner (allied/NAP) city that's short, taking gold for
  //    it (priced by the buyer's market, less the 榷場 tariff). The AI side of the
  //    player's borderTrade — friendly economies interlink instead of one
  //    starving beside a neighbour's overflowing granary. AI↔AI only; the
  //    player's coffers are never touched without the player's own action.
  {
    const season = input.date.season;
    for (const seller of Object.values(cities)) {
      const sid = seller.ownerForceId;
      if (!sid || sid === input.playerForceId) continue;
      const sNow = cities[seller.id];
      if (sNow.food <= sNow.troops * 7) continue; // only a real glut spares grain
      for (const nid of sNow.adjacentCityIds) {
        const buyer = cities[nid];
        if (!buyer || !buyer.ownerForceId || buyer.ownerForceId === sid || buyer.ownerForceId === input.playerForceId) continue;
        const rel = getRelation(diplomacy, sid, buyer.ownerForceId);
        if (rel.status !== 'allied' && rel.status !== 'non-aggression') continue;
        if (buyer.food >= buyer.troops * 2) continue; // buyer not actually short
        const amount = Math.min(sNow.food - sNow.troops * 6, buyer.troops * 2 - buyer.food);
        if (amount < 300) continue;
        const tariff = borderTariff(buildingBonuses(seller.id, input.buildings).tradeMul);
        const buyerMkt = { stability: buildingBonuses(buyer.id, input.buildings).priceStability };
        const gold = Math.floor(sellQuote(buyer, season, amount, buyerMkt) * (1 - tariff));
        if (gold <= 0 || buyer.gold < gold) continue;
        cities[seller.id] = { ...sNow, food: sNow.food - amount, gold: sNow.gold + gold };
        cities[buyer.id] = { ...buyer, food: buyer.food + amount, gold: buyer.gold - gold };
        break; // one relief shipment per seller per season
      }
    }
  }

  // ── 榷場(買方)— a starving AI city with coin actively buys grain from a
  //    peace-partner that has spare (the cases the seller-relief pass didn't
  //    proactively cover). The AI now both offers AND seeks cross-border grain.
  {
    const season = input.date.season;
    for (const buyer of Object.values(cities)) {
      const bid = buyer.ownerForceId;
      if (!bid || bid === input.playerForceId) continue;
      const bNow = cities[buyer.id];
      if (bNow.food >= bNow.troops * 1.5 || bNow.gold < 300) continue; // not desperate, or broke
      for (const nid of bNow.adjacentCityIds) {
        const seller = cities[nid];
        if (!seller || !seller.ownerForceId || seller.ownerForceId === bid || seller.ownerForceId === input.playerForceId) continue;
        const rel = getRelation(diplomacy, bid, seller.ownerForceId);
        if (rel.status !== 'allied' && rel.status !== 'non-aggression') continue;
        const spare = seller.food - seller.troops * 3;
        if (spare < 300) continue;
        const tariff = borderTariff(buildingBonuses(buyer.id, input.buildings).tradeMul);
        const sellerMkt = { stability: buildingBonuses(seller.id, input.buildings).priceStability };
        let spend = Math.min(Math.floor(bNow.gold * 0.4), 3000);
        if (spend < 50) continue;
        let food = Math.floor(buyQuote(seller, season, spend, sellerMkt) * (1 - tariff));
        if (food <= 0) continue;
        const maxFood = Math.min(spare, bNow.troops * 2 - bNow.food);
        if (food > maxFood) { spend = Math.floor(spend * (maxFood / food)); food = maxFood; }
        if (spend < 50 || food < 200) continue;
        cities[buyer.id] = { ...bNow, gold: bNow.gold - spend, food: bNow.food + food };
        cities[seller.id] = { ...seller, food: seller.food - food, gold: seller.gold + spend };
        break; // one purchase per buyer per season
      }
    }
  }

  // ── 馬政調度 — a force ferries surplus warhorses from its breeders to its most
  //    horse-poor city (abstracted instant logistics, as with AI grain balancing),
  //    so AI frontiers raise cavalry too instead of the herd piling up at the studs.
  for (const forceCities of citiesByForce.values()) {
    if (forceCities.length < 2) continue;
    let donor: string | null = null;
    let recip: string | null = null;
    for (const c of forceCities) {
      if (!cities[c.id]) continue;
      if (donor === null || (cities[c.id].warhorses ?? 0) > (cities[donor].warhorses ?? 0)) donor = c.id;
      if (recip === null || (cities[c.id].warhorses ?? 0) < (cities[recip].warhorses ?? 0)) recip = c.id;
    }
    if (!donor || !recip || donor === recip) continue;
    const dHorses = cities[donor].warhorses ?? 0;
    if (dHorses < 2000) continue;                       // only a real surplus is spread
    const move = Math.min(1500, dHorses - 1000);
    if (move < 200) continue;
    cities[donor] = { ...cities[donor], warhorses: dHorses - move };
    cities[recip] = { ...cities[recip], warhorses: (cities[recip].warhorses ?? 0) + move };
  }

  // ── 定稅 — AI tax policy: a self-correcting loyalty↔gold lever (the player's
  //    稅率 dial, now used by the AI). A restive realm eases the burden (輕稅);
  //    a contented realm at war squeezes for war-chest gold (重稅); otherwise
  //    常稅. Because 重稅 bleeds loyalty, a force that over-squeezes drops below
  //    the contentment bar and reverts — a stable feedback loop, no runaway.
  for (const [forceId, forceCities] of citiesByForce) {
    if (forceCities.length === 0) continue;
    const avgLoyalty = forceCities.reduce((s, c) => s + (cities[c.id]?.loyalty ?? c.loyalty), 0) / forceCities.length;
    const atWar = forceCities.some((c) =>
      c.adjacentCityIds.some((id) => {
        const e = cities[id];
        return !!e && e.ownerForceId != null && e.ownerForceId !== forceId &&
          isHostilePermitted(diplomacy, forceId, e.ownerForceId);
      }),
    );
    taxPolicy[forceId] =
      avgLoyalty < 42 ? 'light' :
      atWar && avgLoyalty >= 60 ? 'heavy' :
      'normal';
  }

  // ── AI-initiated diplomacy: weak AI forces seek NAPs with much
  //    stronger neighbors (player included) to buy time.
  const aiForceIds = Array.from(citiesByForce.keys());
  for (const forceId of aiForceIds) {
    // 君主性格 — warmongers (tyrant/aggressive) rarely sue for peace; cautious /
    // defensive rulers court it readily. Base 25%/season scaled by appetite.
    if (rng() > 0.25 * personalityDiplomacyAppetite(input.forces[forceId]?.personality)) continue;

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
            label: `${a.name.en} & ${b.name.en} 義兄弟`, depth: 1, sharedSeasons: 0,
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

  // ── AI 離間計 — a capable rival sows discord among the PLAYER's officers,
  //    souring the warmest co-located, unbonded pair (may even harden into a
  //    宿怨). Gated by AI aggression + difficulty so weak/easy AI leaves the
  //    player be. The negative half of the social game, turned on the player. ──
  if (input.playerForceId) {
    const discordChance = 0.05 * aiAggressionMul * (difficulty === 'hard' ? 1.5 : difficulty === 'easy' ? 0.4 : 1);
    const hasSchemer = Object.values(officers).some(
      (o) => o.forceId && o.forceId !== input.playerForceId && o.status !== 'dead' &&
        o.status !== 'imprisoned' && o.stats.intelligence >= 80,
    );
    if (hasSchemer && rng() < discordChance) {
      const pf = input.playerForceId;
      const pOff = Object.values(officers).filter(
        (o) => o.forceId === pf && o.status !== 'dead' && o.locationCityId,
      );
      let best: [Officer, Officer] | null = null;
      let bestR = 40; // only worth poisoning a pair that's actually warm
      for (let i = 0; i < pOff.length; i++) {
        for (let j = i + 1; j < pOff.length; j++) {
          const a = pOff[i], b = pOff[j];
          if (a.locationCityId !== b.locationCityId) continue;
          // Sworn brothers and existing feuds are off the table here.
          if (runtimeSwornPair(a.id, b.id, runtimeBonds) || runtimeFeudPair(a.id, b.id, runtimeBonds)) continue;
          const r = rapport[pairKey(a.id, b.id)] ?? 0;
          if (r > bestR) { bestR = r; best = [a, b]; }
        }
      }
      if (best) {
        const [a, b] = best;
        const fr = addFriction(rapport, a.id, b.id, 15 + Math.floor(rng() * 16), false);
        rapport = fr.rapport;
        if (fr.forged) runtimeBonds.push(fr.forged);
        entries.push({
          cityId: a.locationCityId, kind: 'note',
          text: `Rumours sap the trust between ${a.name.en} and ${b.name.en} — a rival's whisper campaign.`,
          textZh: `流言中傷,${a.name.zh}與${b.name.zh}漸生嫌隙 —— 敵方離間之計。`,
        });
      }
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

  // ── AI 總動員 (coordinated mass surge) ────────────────────────────
  // When a force holds a real edge, it occasionally hurls SEVERAL bordering
  // cities at ONE weak enemy city at once — a climactic all-in instead of the
  // usual one-city pecking. One surge per force per season, low odds, and only
  // cities/officers not already committed this turn join in.
  {
    const surgeSeason = input.date.season;
    for (const forceId of aiForceIds) {
      if (rng() > 0.12) continue;                       // rare — a big decision
      const myCities = Object.values(cities).filter((c) => c.ownerForceId === forceId);
      if (myCities.length < 3) continue;
      // Enemy cities bordered by my able cities → who could converge on them.
      const borderers = new Map<EntityId, City[]>();
      for (const c of myCities) {
        if (c.troops < 3000) continue;
        for (const nid of c.adjacentCityIds) {
          const n = cities[nid];
          if (!n || !n.ownerForceId || n.ownerForceId === forceId) continue;
          if (!isHostilePermitted(diplomacy, forceId, n.ownerForceId)) continue;
          (borderers.get(nid) ?? borderers.set(nid, []).get(nid)!).push(c);
        }
      }
      // The weakest target ≥2 of my cities border, where I outweigh it ≥1.6×.
      let best: { target: City; from: City[] } | null = null;
      for (const [tid, from] of borderers) {
        if (from.length < 2) continue;
        const tgt = cities[tid];
        if (!tgt) continue;
        const myTroops = from.reduce((s, c) => s + c.troops, 0);
        if (myTroops < tgt.troops * 1.6) continue;
        if (!best || tgt.troops < best.target.troops) best = { target: tgt, from };
      }
      if (!best) continue;
      // Throw the borderers' best uncommitted officers onto the target at once.
      for (const c of best.from) {
        const lead = Object.values(officers)
          .filter((o) => o.forceId === forceId && o.locationCityId === c.id && !o.task
            && (o.status === 'active' || o.status === 'idle') && !pendingCommands[o.id])
          .sort((a, b) => (b.stats.leadership * 0.6 + b.stats.war * 0.4) - (a.stats.leadership * 0.6 + a.stats.war * 0.4))[0];
        if (!lead) continue;
        const dur = adjustMarchSeasons(marchDurationFor(c, best.target, surgeSeason), 'normal', marchSpeedMul([lead]));
        pendingCommands[lead.id] = {
          type: 'march', cityId: c.id, officerId: lead.id, targetCityId: best.target.id,
          troops: Math.floor(c.troops * 0.65), seasonsRemaining: dur, totalSeasons: dur,
        };
        officers[lead.id] = { ...officers[lead.id], task: 'march' };
      }
    }
  }

  return { cities, officers, pendingCommands, newTrainings, diplomacy, runtimeBonds, rapport, taxPolicy, entries };
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
  coalitionFoeId: EntityId | null = null,
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
  // 名物版圖 — our existing grip on each strategic good, so we can weigh a
  // candidate that would tighten it (clustering toward a 專營 monopoly).
  const ownCtrl = specialtyControl(allCities, forceId);
  let best: EntityId | null = null;
  let bestScore = 0;
  for (const [candId, force] of Object.entries(pressure)) {
    const cand = allCities[candId];
    if (!cand) continue;
    const effDef = cand.troops * (1 + cand.defense / 200);
    const feasibility = force / Math.max(1, effDef);
    if (feasibility < 1.05) continue; // can't realistically take it, even massed
    let value = 1 + (cand.population ?? 0) / 200_000;
    // 名物所鍾 — a city that makes a famous good is a richer prize, and richer
    // still if seizing it tightens our grip on that good (toward 鹽鐵專營).
    const role = cityRole(candId);
    if (role) value *= 1.25 + Math.min(0.6, ownCtrl.strength[role] * 0.12);
    // Death blow: taking the last city of an enemy force wipes it off the map —
    // worth far more than the city's size alone, so the AI finishes off crippled
    // rivals instead of leaving one-city rumps to linger.
    const elimination = cand.ownerForceId && cityCount[cand.ownerForceId] === 1 ? 2.5 : 1;
    // 合縱抗霸: pile onto the hegemon's frontier so the lesser powers gang up.
    const hegemon = cand.ownerForceId && cand.ownerForceId === hegemonId ? 1.6 : 1;
    // 共討會盟: a sworn league member throws its weight at the agreed foe (§7.1 ②).
    const coalition = cand.ownerForceId && cand.ownerForceId === coalitionFoeId ? 1.8 : 1;
    const score = feasibility * value * elimination * hegemon * coalition;
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
  aiAggressionMul = 1,
  weather?: import('./weather').Weather,
  forts?: Record<EntityId, import('../types/fort').Fort>,
  fog: FogView | null = null,
): Decision | null {
  const ownRulerId = forces[forceId]?.rulerOfficerId;
  // 前線 — a city bordering an enemy (or neutral) realm. Computed up-front so
  // garrison build-up, migration and development can all key off position.
  const onFront = city.adjacentCityIds.some((id) => {
    const e = allCities[id];
    return !!e && e.ownerForceId !== forceId &&
      (e.ownerForceId === null || isHostilePermitted(diplomacy, forceId, e.ownerForceId));
  });

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

  // 3. Loyalty crisis — pacify. 賑濟 (open the granaries) is preferred when the
  // city is food-rich: it's stronger than 撫民 and spends grain instead of the
  // gold the AI would rather pour into armies. A famine-threatened city keeps
  // its grain and pays gold instead; a broke-but-fed city relieves on a slimmer
  // surplus rather than do nothing.
  if (city.loyalty < 40) {
    // 巡查肅貪 — a wealthy city first roots out graft: it restores faith AND
    // recovers gold (the richer the city, the more), so it pays for itself
    // where 撫民 only spends. Politics-led.
    if (city.commerce >= 60 && canAfford(city, 'anti-corruption')) {
      const g = bestForCommand(officersHere, 'politics', 'anti-corruption', prefectId);
      if (g) return internalDecision('anti-corruption', city, g);
    }
    const reliefFood = Math.max(500, Math.round(city.population * 0.02));
    if (city.food >= reliefFood * 2 && city.food > city.troops) {
      const r = bestForCommand(officersHere, 'charisma', 'relief', prefectId);
      if (r) return internalDecision('relief', city, r);
    }
    const o = bestForCommand(officersHere, 'charisma', 'improve-loyalty', prefectId);
    if (o && canAfford(city, 'improve-loyalty')) {
      return internalDecision('improve-loyalty', city, o);
    }
    if (city.food >= reliefFood) {
      const r = bestForCommand(officersHere, 'charisma', 'relief', prefectId);
      if (r) return internalDecision('relief', city, r);
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
        // 迷霧對等 — can't sally to meet a column the scouts never spotted.
        if (fog && !fog.isVisiblePx(a.x, a.y)) continue;
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
      // 君主性格 — a tyrant/aggressive lord strikes on thin margins; a cautious
      // or scholarly one only when very safe.
      const personalityMul = personalityAttackMul(forces[forceId]?.personality);
      // 知天候 — a 智謀 commander on hand turns a dry gale into a 火攻 chance and
      // presses; snow holds the column. (hasFireMind: someone here can light it.)
      const hasFireMind = officersHere.some((c) => c.stats.intelligence >= 80);
      const weatherMul = weatherAttackMul(weather, hasFireMind);
      const attackThreshold = baseThreshold * deterrence * focusRelax * postureMul * aiAggressionMul * personalityMul * weatherMul;

      // 識城防 — a city ringed by enemy 箭樓/投石臺/陣/防壁 is a far harder nut: the
      // forts shell the storming column, muster extra garrison and stiffen the
      // wall (the very siege aid they now lend, §5.5). The AI reads it the same
      // way the siege math will, so it shies off a fort-defended target and only
      // commits with a bigger edge — or goes to raze the forts first.
      const aid = siegeFacilityAid(forts, target.ownerForceId, target.id);
      // 識地利 — a 山城/雄關 is murder to storm, the more so with cavalry and in
      // snow; a desert saps a big host. The AI reads the SAME terrain math the
      // siege will (factoring the arm it could field), so it shies off a 雄關 it
      // can't crack and only presses when it brings engines or overwhelming foot.
      const aiArm = attackerArm(officersHere);
      const terrainMul = terrainSiegeMultiplier(target, {
        arm: aiArm, weather,
        attackerTroops: city.troops, defenderTroops: target.troops + aid.garrison,
      });
      // Effective defender strength factors in city defense: a fortress at
      // defense 88 (Tongguan) counts as if the garrison were ~60% larger.
      const defenseMultiplier = 1 + (target.defense + aid.defenseAdd) / 200;
      const effectiveDefenderTroops = (target.troops + aid.garrison) * defenseMultiplier * aid.defenderMul * terrainMul;
      // The besieging column is shelled before it reaches the walls.
      const effectiveAttackerTroops = Math.max(1, city.troops - aid.prestrike);
      const ratio = effectiveDefenderTroops / effectiveAttackerTroops;
      if (ratio > attackThreshold) continue;
      // P4 — exclude cowardly/frail officers from leading marches.
      const marchPool = officersHere.filter((c) => !isCombatLiability(c));
      // 險地遣良 — into a pass/mountain, lead with an 攻城 engineer if one's on
      // hand (器械破關); otherwise the best fighter. Keeps the eval honest: the
      // arm the AI counted on (siege) is the arm it actually sends.
      const hardTerrain = target.terrain === 'pass' || target.terrain === 'mountain';
      let o = bestForCommand(marchPool, 'war', 'march');
      if (hardTerrain) {
        const sieger = marchPool
          .filter((c) => c.skills.includes('siegemaster') && c.stats.war >= 60)
          .sort((a, b) => b.stats.war - a.stats.war)[0];
        if (sieger) o = sieger;
      }
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

      // 行軍捷疾 — 健行/嚴峻/騎將/驛站 quicken an AI host too (鈍重 drags it),
      // and the sky has its say: 雪沒脛/泥淖 drag the column, a tailwind hurries it.
      const dur = adjustMarchSeasons(
        marchDurationFor(city, target, season), 'normal',
        marchSpeedMul([o, ...picked]) * marchSpeedMultiplier(weather),
      );
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
          const dur = adjustMarchSeasons(marchDurationFor(city, dest, season), 'normal', marchSpeedMul([o]));
          const cmd: MarchCommand = {
            type: 'march', cityId: city.id, officerId: o.id, targetCityId: dest.id,
            troops: send, seasonsRemaining: dur, totalSeasons: dur,
          };
          return { command: cmd, officer: o };
        }
      }
    }
  }

  // 4.6 建軍 — keep a standing garrison sized to the city's tier and position.
  // Front-line cities hold a strong garrison; rear cities a modest one (whose
  // surplus the reinforcement step above ferries to the front). This is what
  // keeps a realm's armies from bleeding away to nothing over a long war —
  // cities actively rebuild toward a target instead of only when nearly empty.
  {
    const cap = citySize(city).troopCap;
    const target = Math.floor(cap * (onFront ? 0.75 : 0.5));
    if (
      city.troops < target &&
      city.population > 40_000 &&
      city.loyalty >= 50 &&
      city.gold >= COMMAND_DEFS['recruit-troops'].goldCost * 3 // keep a reserve for other works
    ) {
      const o = bestForCommand(officersHere, 'charisma', 'recruit-troops', prefectId);
      if (o) return internalDecision('recruit-troops', city, o);
    }
  }

  // 4.65 屯田 — a city with a hungry garrison settles its soldiers on state land:
  // food without spending a single civilian. Keeps a large standing army fed —
  // especially near the front, where armies mass and the larder runs thin. The
  // food yield scales with the garrison, so it needs real troops to be worth it.
  if (
    city.troops >= 2000 &&
    city.food < city.troops * 4 &&
    canAfford(city, 'military-farming')
  ) {
    const o = bestForCommand(officersHere, 'leadership', 'military-farming', prefectId);
    if (o) return internalDecision('military-farming', city, o);
  }

  // 4.7 招撫流民 — a settled city with ample headroom under its 承載力 actively
  // recruits migrants to drive its population toward the next size tier (and the
  // tier unlocks that come with it). Stops once the city fills toward its
  // ceiling, so 農業 development can raise the ceiling before pulling more in.
  {
    const headroom = cityCarryingCapacity(city) - city.population;
    if (
      headroom >= city.population * 0.25 &&
      city.loyalty >= 55 &&
      city.population >= 20_000 &&
      city.gold >= COMMAND_DEFS['encourage-migration'].goldCost * 2
    ) {
      const o = bestForCommand(officersHere, 'charisma', 'encourage-migration', prefectId);
      if (o) return internalDecision('encourage-migration', city, o);
    }
  }

  // 4.8 鎮守 — an enemy column has overrun some of this city's territory cells.
  // Drive them off (reclaim the halo + a defense bump). Cheap (150g), so it
  // slots in before the costlier development works. territory ids are
  // `${parentCityId}-${i}`, so a cell is this city's iff it carries our prefix.
  {
    const prefix = `${city.id}-`;
    let lostCells = 0;
    for (const [terId, ownerId] of Object.entries(territoryOwnership)) {
      if (!terId.startsWith(prefix)) continue;
      if (ownerId != null && ownerId !== forceId) lostCells++;
    }
    if (lostCells > 0 && canAfford(city, 'garrison')) {
      const o = bestForCommand(officersHere, 'leadership', 'garrison', prefectId);
      if (o) return internalDecision('garrison', city, o);
    }
  }

  // 4.9 城壁強化 — a front-line 城-tier fortress raises its wall tier (1→3) when
  // the treasury is fat enough to spare 1500g and still fund other works. A
  // citadel (Tier 3) makes the city far costlier to storm, so border bastions
  // invest in stone once their economy can bear it. Naturally bounded — wallTier
  // maxes at 3, after which the apply step refuses and we fall through.
  if (
    onFront &&
    (city.wallTier ?? 1) < 3 &&
    meetsMinSize(citySize(city).id, 'city') &&
    city.gold >= COMMAND_DEFS['upgrade-wall'].goldCost * 1.6 &&
    city.loyalty >= 50
  ) {
    const o = bestBy(officersHere, 'politics', prefectId);
    if (o) return internalDecision('upgrade-wall', city, o);
  }

  // 4.93 練兵 — a front-line fortress with a real garrison drills its troops,
  // building 練度 (defensive fighting power in a siege). Cheap insurance for a
  // border bastion once its walls are seen to; gated on a garrison worth drilling
  // and on the drill level having room to climb. Leadership-led.
  if (
    onFront &&
    city.troops >= 3000 &&
    (city.drill ?? 0) < 60 &&
    city.loyalty >= 50 &&
    canAfford(city, 'drill-troops')
  ) {
    const o = bestForCommand(officersHere, 'leadership', 'drill-troops', prefectId);
    if (o) return internalDecision('drill-troops', city, o);
  }

  // 4.95 治水 — a calm rear city with spare gold raises hand-built flood works
  // (toward the immunity cap) as cheap insurance against the summer floods. Self-
  // limiting: the apply step stops adding once works hit 3, after which it only
  // irrigates and we'd rather develop, so gate on works < 2.
  if (
    !onFront &&
    (city.floodWorks ?? 0) < 2 &&
    city.loyalty >= 50 &&
    city.gold >= COMMAND_DEFS['flood-control'].goldCost * 2
  ) {
    const o = bestBy(officersHere, 'politics', prefectId);
    if (o) return internalDecision('flood-control', city, o);
  }

  // 4.97 興学 — a prosperous, peaceful rear city with its economy already built
  // out turns to growing TALENT: a 講學 XP burst to every officer stationed here.
  // Gated on a maxed-out economy so it never crowds out development, and on ≥2
  // pupils so the burst actually pays off. Intelligence-led.
  {
    const econCap = cityEconCap(city);
    if (
      !onFront &&
      officersHere.length >= 2 &&
      city.loyalty >= 55 &&
      city.agriculture >= econCap * 0.85 &&
      city.commerce >= econCap * 0.85 &&
      canAfford(city, 'promote-learning')
    ) {
      const o = bestBy(officersHere, 'intelligence', prefectId);
      if (o) return internalDecision('promote-learning', city, o);
    }
  }

  // 4.98 特訓 — a rich, peaceful rear city with gold to spare puts its most
  // promising officer through a hard personal drill (特訓): gold traded for big
  // 歷練 plus a shot at a skill / 性格 / 潛能. Gated like 興学 (economy built out)
  // so it never crowds out development, plus a real-headroom check so it isn't
  // wasted on an officer who can barely grow. Keeps AI growth on par with the
  // player's new training lever.
  {
    const econCap = cityEconCap(city);
    if (
      !onFront &&
      city.loyalty >= 55 &&
      city.agriculture >= econCap * 0.9 &&
      city.commerce >= econCap * 0.9 &&
      city.gold >= COMMAND_DEFS['special-training'].goldCost * 3
    ) {
      const cand = officersHere.find((o) => {
        const lat = o.latentStats;
        if (!lat || o.status === 'wounded') return false;
        const gap = (lat.war - o.stats.war) + (lat.leadership - o.stats.leadership)
          + (lat.intelligence - o.stats.intelligence) + (lat.politics - o.stats.politics)
          + (lat.charisma - o.stats.charisma);
        return gap >= 10;
      });
      if (cand) return internalDecision('special-training', city, cand);
    }
  }

  // 5. Routine — front-line cities fortify, rear cities grow the economy.
  const devType = chooseDevelopment(city, onFront);
  // 二級內政 — once the city reaches 城 tier, prefer the triple-strength 大農政/
  // 大商政/大築城 when affordable and the stat still has room to climb.
  const majorType = majorDevFor(devType, city);
  const o = bestBy(officersHere, 'politics', prefectId);
  if (o && majorType && canAfford(city, majorType)) {
    return internalDecision(majorType, city, o);
  }
  if (o && canAfford(city, devType)) {
    return internalDecision(devType, city, o);
  }

  // 6. Pacify if we can afford it (cheap fallback). 撫民 tapers off near the
  // cap, so a food-rich, gold-strapped city tops itself off with 賑濟 instead.
  if (city.loyalty < 90) {
    const fb = bestBy(officersHere, 'charisma', prefectId);
    if (fb && canAfford(city, 'improve-loyalty')) {
      return internalDecision('improve-loyalty', city, fb);
    }
    const reliefFood = Math.max(500, Math.round(city.population * 0.02));
    if (fb && city.food >= reliefFood * 3) {
      return internalDecision('relief', city, fb);
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

/** 二級內政 — upgrade a basic development order to its triple-strength 大-variant
 *  when the city has reached 城 tier and the target stat still has room to grow
 *  (no point paying 3× to push a near-capped stat). Null = stick with basic. */
function majorDevFor(
  devType: 'develop-agriculture' | 'develop-commerce' | 'build-defense',
  city: City,
): InternalAffairsType | null {
  if (!meetsMinSize(citySize(city).id, 'city')) return null;
  const econCap = cityEconCap(city);
  const statCap = cityStatCap(city);
  switch (devType) {
    case 'develop-agriculture': return city.agriculture < econCap - 10 ? 'major-agriculture' : null;
    case 'develop-commerce':    return city.commerce < econCap - 10 ? 'major-commerce' : null;
    case 'build-defense':       return city.defense < statCap - 10 ? 'major-defense' : null;
  }
}
