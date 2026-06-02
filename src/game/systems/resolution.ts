import type {
  City,
  Command,
  DiplomaticState,
  EntityId,
  Force,
  GameDate,
  Officer,
  ReportEntry,
  SeasonReport,
} from '../types';
import { OATH_BONDS, type OathBond } from '../data/bonds';
import { isHostilePermitted } from '../types';
import { generateTerritories, terrainRoute, positionAlongRoute, type Territory } from '../data/territories';
import { advanceSeason } from '../state/gameState';
import { processAging } from './aging';
import { handleSearch, resolveInternalAffairs, type LostItemRef } from './commands';
import { handleMarch } from './combat';
import { tickDiplomacy } from './diplomacy';
import { tickCityEconomy } from './economy';
import { appointmentBonusFor } from './appointmentEffects';
import { MILITARY_RANKS_BY_ID } from '../data/titles';
import { rollEvents } from './events';

export interface ResolutionInput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  pendingCommands: Record<EntityId, Command>;
  diplomacy: DiplomaticState;
  runtimeBonds: OathBond[];
  lostItems: LostItemRef[];
  /** Phase 3c — current per-territory owner overrides (null/missing
   *  means inherit from parent city). */
  territoryOwnership?: Record<EntityId, EntityId | null>;
  /** Player's force — used to summarise their territory gains/losses. */
  playerForceId?: EntityId | null;
  /** Runtime family relations — flow through into combat for kinship bonuses. */
  family?: import('../types/family').FamilyRelation[];
  /** Civic-title appointments — drive force-wide bonuses in commands + combat. */
  appointments?: import('../types').Appointment[];
  /** Active 討伐令 marks — combat power +10% from issuer toward target. */
  casusBelliMarks?: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }>;
  /** Transient 求賢令 recruit multipliers — folded into recruit commands. */
  recruitBonusSeasons?: Record<EntityId, { multiplier: number; seasonsLeft: number }>;
  rng?: () => number;
  weather?: import('./weather').Weather;
  /**
   * True when this period transition crosses a season boundary (every 9
   * periods). Per-season ticks (economy, harvest, plague, etc.) only fire
   * when this is true. Defaults to true for backward compat.
   */
  seasonBoundary?: boolean;
}

export interface ResolutionOutput {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  lostItems: LostItemRef[];
  report: SeasonReport;
  /**
   * Marches still in transit (seasonsRemaining > 1 at start of resolution).
   * The store assigns these to next season's pendingCommands instead of
   * the usual {} reset, so the army keeps marching.
   */
  keptCommands?: Record<EntityId, Command>;
  /** Phase 3c — territory ownership map after capture stamps applied. */
  territoryOwnership?: Record<EntityId, EntityId | null>;
  /** Persistent field armies still on the map after this season (derived
   *  from in-transit marches — the canonical "unit on the map" layer). */
  armies?: Record<EntityId, import('../types').Army>;
  /** Pending delayed effects from stratagems (e.g. 截糧 troop drain). */
  delayedEffects?: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }>;
  /**
   * Heroic-deed deltas to apply this turn — bumped by individual systems
   * (combat duels, espionage successes, civic affairs commands, etc.).
   * Store aggregates and applies to state.deeds.
   */
  deedDeltas?: Array<{ officerId: EntityId; patch: Partial<import('../types').HeroicDeeds> }>;
}

export function resolveSeason(input: ResolutionInput): ResolutionOutput {
  const rng = input.rng ?? Math.random;
  let cities: Record<EntityId, City> = { ...input.cities };
  let officers: Record<EntityId, Officer> = { ...input.officers };
  let forces: Record<EntityId, Force> = { ...input.forces };
  let lostItems: LostItemRef[] = [...input.lostItems];
  const entries: ReportEntry[] = [];
  // 武功 — deed deltas accumulated this turn
  const deedDeltas: Array<{ officerId: EntityId; patch: Partial<import('../types').HeroicDeeds> }> = [];
  const bumpDeed = (officerId: EntityId, patch: Partial<import('../types').HeroicDeeds>) => {
    deedDeltas.push({ officerId, patch });
  };

  // 1. Process commands. Marches first, then internal affairs.
  // Multi-season march: if seasonsRemaining > 1, the army is still on the
  // road — decrement and keep for next season instead of resolving now.
  const allCmds = Object.values(input.pendingCommands);
  const allMarches = allCmds.filter((c): c is Extract<Command, { type: 'march' }> =>
    c.type === 'march',
  );
  const internals = allCmds.filter((c) => c.type !== 'march');

  // Phase 3i — mid-route interception. Two hostile armies whose current
  // map positions overlap this season clash in the field before either
  // reaches its destination. Loser's march is cancelled (survivors stream
  // back to source); winner takes lighter losses and marches on.
  const armyPosition = (cmd: Extract<Command, { type: 'march' }>) => {
    const src = cities[cmd.cityId];
    const dst = cities[cmd.targetCityId];
    if (!src || !dst) return null;
    const route = terrainRoute(src.coords.x, src.coords.y, dst.coords.x, dst.coords.y);
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    const remaining = cmd.seasonsRemaining ?? 1;
    const elapsed = total - remaining;
    const t = Math.min(0.95, Math.max(0.05, (elapsed + 0.5) / total));
    return positionAlongRoute(route, t);
  };
  const fieldStats = (cmd: Extract<Command, { type: 'march' }>) => {
    const cmdr = officers[cmd.officerId];
    if (!cmdr) return { blended: 0, power: 0 };
    const pool = [cmdr, ...(cmd.additionalOfficerIds ?? [])
      .map((id) => officers[id])
      .filter((o): o is Officer => !!o)];
    const blended = pool.reduce((s, o) => s + o.stats.war * 0.6 + o.stats.leadership * 0.4, 0) / pool.length;
    return { blended, power: blended * Math.sqrt(Math.max(1, cmd.troops)) };
  };
  // Build a field BattleDetail; `atk` is the victor side, `def` the loser.
  type FieldSide = {
    forceId: EntityId | null; commanderId: EntityId; companionIds: EntityId[];
    troops: number; blended: number; power: number; losses: number;
  };
  const makeFieldBattle = (cityId: EntityId, atk: FieldSide, def: FieldSide) => ({
    cityId,
    attacker: { forceId: atk.forceId, commanderId: atk.commanderId, companionIds: atk.companionIds, troops: atk.troops, bondBonus: 0, blendedStat: Math.round(atk.blended * 10) / 10, power: Math.round(atk.power) },
    defender: { forceId: def.forceId, commanderId: def.commanderId, companionIds: def.companionIds, troops: def.troops, bondBonus: 0, blendedStat: Math.round(def.blended * 10) / 10, power: Math.round(def.power) },
    cityDefense: 0, defenseFactor: 1, attackerWins: true, cityFalls: false,
    attackerLosses: atk.losses, defenderLosses: def.losses, field: true,
  });
  const cancelledMarchOfficers = new Set<EntityId>();
  const troopOverride: Record<EntityId, number> = {};
  const INTERCEPT_DIST = 45;
  for (let i = 0; i < allMarches.length; i++) {
    for (let j = i + 1; j < allMarches.length; j++) {
      const a = allMarches[i];
      const b = allMarches[j];
      if (cancelledMarchOfficers.has(a.officerId) || cancelledMarchOfficers.has(b.officerId)) continue;
      const oa = officers[a.officerId];
      const ob = officers[b.officerId];
      if (!oa?.forceId || !ob?.forceId || oa.forceId === ob.forceId) continue;
      if (!isHostilePermitted(input.diplomacy, oa.forceId, ob.forceId)) continue;
      const pa = armyPosition(a);
      const pb = armyPosition(b);
      if (!pa || !pb) continue;
      if (Math.hypot(pa.x - pb.x, pa.y - pb.y) > INTERCEPT_DIST) continue;

      // Field clash — higher blended power wins (ties to first army).
      const statsA = fieldStats(a);
      const statsB = fieldStats(b);
      const aWins = statsA.power >= statsB.power;
      const winner = aWins ? a : b;
      const loser = aWins ? b : a;
      const wStats = aWins ? statsA : statsB;
      const lStats = aWins ? statsB : statsA;
      const winnerCmdr = officers[winner.officerId];
      const loserCmdr = officers[loser.officerId];
      const winnerCasualty = Math.floor(winner.troops * 0.2);
      const loserCasualty = Math.floor(loser.troops * 0.6);
      // Casualties are drawn from each army's source city (troops are
      // notionally still there until the march resolves).
      const winSrc = cities[winner.cityId];
      const loseSrc = cities[loser.cityId];
      if (winSrc) cities[winSrc.id] = { ...winSrc, troops: Math.max(0, winSrc.troops - winnerCasualty) };
      if (loseSrc) cities[loseSrc.id] = { ...loseSrc, troops: Math.max(0, loseSrc.troops - loserCasualty) };
      troopOverride[winner.officerId] = Math.max(0, winner.troops - winnerCasualty);
      cancelledMarchOfficers.add(loser.officerId);
      // Free the loser's commander + companions so they idle at source.
      for (const id of [loser.officerId, ...(loser.additionalOfficerIds ?? [])]) {
        const o = officers[id];
        if (o) officers[id] = { ...o, task: null, status: 'idle' };
      }
      const wName = winnerCmdr?.name ?? { en: '?', zh: '？' };
      const lName = loserCmdr?.name ?? { en: '?', zh: '？' };
      // Structured detail so the report entry is clickable → full battle
      // breakdown, reusing the city-battle report UI. Field battle: no
      // walls, so defenseFactor 1 / cityDefense 0. Nominal location = the
      // victor's objective city.
      const fieldBattle = {
        cityId: winner.targetCityId,
        attacker: {
          forceId: winnerCmdr?.forceId ?? null,
          commanderId: winner.officerId,
          companionIds: winner.additionalOfficerIds ?? [],
          troops: winner.troops,
          bondBonus: 0,
          blendedStat: Math.round(wStats.blended * 10) / 10,
          power: Math.round(wStats.power),
        },
        defender: {
          forceId: loserCmdr?.forceId ?? null,
          commanderId: loser.officerId,
          companionIds: loser.additionalOfficerIds ?? [],
          troops: loser.troops,
          bondBonus: 0,
          blendedStat: Math.round(lStats.blended * 10) / 10,
          power: Math.round(lStats.power),
        },
        cityDefense: 0,
        defenseFactor: 1,
        attackerWins: true,
        cityFalls: false,
        attackerLosses: winnerCasualty,
        defenderLosses: loserCasualty,
        field: true,
      };
      entries.push({
        cityId: winner.targetCityId,
        kind: 'battle',
        text: `Field clash: ${wName.en} intercepted ${lName.en} on the march and routed them (−${winnerCasualty} vs −${loserCasualty}). ${lName.en}'s advance is broken.`,
        textZh: `野戰：${wName.zh}於行軍途中截擊${lName.zh}並擊潰之（我軍 −${winnerCasualty}，敵軍 −${loserCasualty}）。${lName.zh}之進軍受挫。`,
        battle: fieldBattle,
      });
    }
  }

  // ── Garrison sally interception ──────────────────────────────────
  // A column marching through hostile territory can be engaged by the
  // garrison of a defended city it passes near (not its own target). The
  // city sallies part of its garrison under its best warrior for a field
  // battle, so you can't waltz an army past a defended stronghold.
  const SALLY_DIST = 55;
  const SALLY_MIN_GARRISON = 4000;
  for (const a of allMarches) {
    if (cancelledMarchOfficers.has(a.officerId)) continue;
    const oa = officers[a.officerId];
    if (!oa?.forceId) continue;
    const pos = armyPosition(a);
    if (!pos) continue;
    // Nearest hostile, non-target city within sally range.
    let bestCity: City | null = null;
    let bestD = SALLY_DIST;
    for (const city of Object.values(cities)) {
      if (!city.ownerForceId || city.ownerForceId === oa.forceId) continue;
      if (city.id === a.targetCityId || city.id === a.cityId) continue;
      if (!isHostilePermitted(input.diplomacy, city.ownerForceId, oa.forceId)) continue;
      if (city.troops < SALLY_MIN_GARRISON) continue;
      const d = Math.hypot(pos.x - city.coords.x, pos.y - city.coords.y);
      if (d < bestD) { bestD = d; bestCity = city; }
    }
    if (!bestCity) continue;
    // Sally leader = strongest idle officer garrisoned in the city.
    const leader = Object.values(officers)
      .filter((o) => o.locationCityId === bestCity!.id && o.forceId === bestCity!.ownerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && !o.task)
      .sort((p, q) => (q.stats.war * 0.6 + q.stats.leadership * 0.4) - (p.stats.war * 0.6 + p.stats.leadership * 0.4))[0];
    if (!leader) continue;
    const sallyTroops = Math.floor(bestCity.troops * 0.5);
    const sallyBlended = leader.stats.war * 0.6 + leader.stats.leadership * 0.4;
    const sallyPower = sallyBlended * Math.sqrt(Math.max(1, sallyTroops));
    const marchStats = fieldStats(a);
    const defWins = sallyPower >= marchStats.power;
    const marchCmdr = officers[a.officerId];
    const mName = marchCmdr?.name ?? { en: '?', zh: '？' };
    if (defWins) {
      // Column routed: heavy losses, march cancelled, sally takes light losses.
      const marchLoss = Math.floor(a.troops * 0.55);
      const defLoss = Math.floor(sallyTroops * 0.2);
      const mSrc = cities[a.cityId];
      if (mSrc) cities[mSrc.id] = { ...mSrc, troops: Math.max(0, mSrc.troops - marchLoss) };
      cities[bestCity.id] = { ...cities[bestCity.id], troops: Math.max(0, cities[bestCity.id].troops - defLoss) };
      cancelledMarchOfficers.add(a.officerId);
      for (const id of [a.officerId, ...(a.additionalOfficerIds ?? [])]) {
        const o = officers[id];
        if (o) officers[id] = { ...o, task: null, status: 'idle' };
      }
      entries.push({
        cityId: bestCity.id, kind: 'battle',
        text: `${leader.name.en} sallied from ${bestCity.name.en} and broke ${mName.en}'s column on the march (−${marchLoss} vs −${defLoss}).`,
        textZh: `${leader.name.zh}自${bestCity.name.zh}出擊,於途中擊潰${mName.zh}之軍（敵 −${marchLoss}，我 −${defLoss}）。`,
        battle: makeFieldBattle(bestCity.id,
          { forceId: leader.forceId ?? null, commanderId: leader.id, companionIds: [], troops: sallyTroops, blended: sallyBlended, power: sallyPower, losses: defLoss },
          { forceId: oa.forceId ?? null, commanderId: a.officerId, companionIds: a.additionalOfficerIds ?? [], troops: a.troops, blended: marchStats.blended, power: marchStats.power, losses: marchLoss }),
      });
    } else {
      // Column fights through: sally repulsed, both bleed, march continues.
      const defLoss = Math.floor(sallyTroops * 0.5);
      const marchLoss = Math.floor(a.troops * 0.2);
      cities[bestCity.id] = { ...cities[bestCity.id], troops: Math.max(0, cities[bestCity.id].troops - defLoss) };
      const mSrc = cities[a.cityId];
      if (mSrc) cities[mSrc.id] = { ...mSrc, troops: Math.max(0, mSrc.troops - marchLoss) };
      troopOverride[a.officerId] = Math.max(0, (troopOverride[a.officerId] ?? a.troops) - marchLoss);
      entries.push({
        cityId: bestCity.id, kind: 'battle',
        text: `${leader.name.en} sallied from ${bestCity.name.en} but was repulsed by ${mName.en}'s column (−${defLoss} vs −${marchLoss}).`,
        textZh: `${leader.name.zh}自${bestCity.name.zh}出擊,反為${mName.zh}之軍所卻（我 −${defLoss}，敵 −${marchLoss}）。`,
        battle: makeFieldBattle(bestCity.id,
          { forceId: oa.forceId ?? null, commanderId: a.officerId, companionIds: a.additionalOfficerIds ?? [], troops: a.troops, blended: marchStats.blended, power: marchStats.power, losses: marchLoss },
          { forceId: leader.forceId ?? null, commanderId: leader.id, companionIds: [], troops: sallyTroops, blended: sallyBlended, power: sallyPower, losses: defLoss }),
      });
    }
  }

  const liveMarches = allMarches.filter((c) => !cancelledMarchOfficers.has(c.officerId));
  const withTroops = (c: Extract<Command, { type: 'march' }>) =>
    troopOverride[c.officerId] !== undefined ? { ...c, troops: troopOverride[c.officerId] } : c;
  const marches = liveMarches.filter((c) => (c.seasonsRemaining ?? 1) <= 1).map(withTroops);
  const inTransit = liveMarches.filter((c) => (c.seasonsRemaining ?? 1) > 1).map(withTroops);
  const keptCommands: Record<EntityId, Command> = {};
  for (const cmd of inTransit) {
    keptCommands[cmd.officerId] = {
      ...cmd,
      seasonsRemaining: (cmd.seasonsRemaining ?? 1) - 1,
    };
  }

  // Derive the persistent Army layer from the in-transit marches that will
  // keep marching next season. Each is positioned at its current point on
  // the terrain route. This is the canonical "unit on the map" entity the
  // renderers + future selection/redirect build on.
  const outArmies: Record<EntityId, import('../types').Army> = {};
  for (const cmd of inTransit) {
    const src = cities[cmd.cityId];
    const dst = cities[cmd.targetCityId];
    const cmdr = officers[cmd.officerId];
    if (!src || !dst || !cmdr?.forceId) continue;
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    const remainingNext = (cmd.seasonsRemaining ?? 1) - 1; // after this season's step
    const progress = Math.min(0.95, Math.max(0.05, (total - remainingNext) / total));
    const pos = armyPosition({ ...cmd, seasonsRemaining: remainingNext });
    outArmies[cmd.officerId] = {
      id: cmd.officerId,
      forceId: cmdr.forceId,
      commanderId: cmd.officerId,
      companionIds: cmd.additionalOfficerIds ?? [],
      troops: cmd.troops,
      fromCityId: cmd.cityId,
      targetCityId: cmd.targetCityId,
      x: pos?.x ?? src.coords.x,
      y: pos?.y ?? src.coords.y,
      progress,
      totalSeasons: total,
    };
  }

  // Phase 3c — territory capture stamps. Every army on the road this
  // season claims the cells along the slice of route it physically
  // covered. Both in-transit and arriving marches contribute.
  const territoryOwnership: Record<EntityId, EntityId | null> = {
    ...(input.territoryOwnership ?? {}),
  };
  const stampRouteSlice = (cmd: Extract<Command, { type: 'march' }>, tStart: number, tEnd: number) => {
    const src = cities[cmd.cityId];
    const dst = cities[cmd.targetCityId];
    const cmdr = officers[cmd.officerId];
    if (!src || !dst || !cmdr || !cmdr.forceId) return;
    const territories = generateTerritories(Object.values(cities));
    const route = terrainRoute(src.coords.x, src.coords.y, dst.coords.x, dst.coords.y);
    if (route.length < 2) return;
    // For each territory whose centroid projects between [tStart, tEnd]
    // along the polyline length, claim it for the marching force.
    const segLens: number[] = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const sl = Math.hypot(route[i + 1].x - route[i].x, route[i + 1].y - route[i].y);
      segLens.push(sl); total += sl;
    }
    const sliceStart = tStart * total;
    const sliceEnd = tEnd * total;
    for (const ter of territories) {
      // Distance of this territory's centroid from the polyline, plus its
      // projected arc length. Reject anything not close to the road.
      let acc = 0;
      let bestArc = -1;
      let bestPerp = Infinity;
      for (let i = 0; i < segLens.length; i++) {
        const a = route[i], b = route[i + 1];
        const sl = segLens[i];
        if (sl < 1) { acc += sl; continue; }
        const dx = (b.x - a.x) / sl, dy = (b.y - a.y) / sl;
        const rx = ter.coords.x - a.x, ry = ter.coords.y - a.y;
        const proj = Math.max(0, Math.min(sl, rx * dx + ry * dy));
        const perp = Math.abs(rx * (-dy) + ry * dx);
        if (perp < bestPerp) {
          bestPerp = perp;
          bestArc = acc + proj;
        }
        acc += sl;
      }
      if (bestArc < 0 || bestPerp > 22) continue;
      if (bestArc < sliceStart || bestArc > sliceEnd) continue;
      territoryOwnership[ter.id] = cmdr.forceId;
    }
  };
  for (const cmd of liveMarches) {
    const total = Math.max(1, cmd.totalSeasons ?? 1);
    const remainingAfter = Math.max(0, (cmd.seasonsRemaining ?? 1) - 1);
    const remainingBefore = cmd.seasonsRemaining ?? 1;
    const tStart = (total - remainingBefore) / total;
    const tEnd = (total - remainingAfter) / total;
    stampRouteSlice(cmd, tStart, tEnd);
  }

  const delayedEffects: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }> = [];
  for (const cmd of marches) {
    const citiesBefore = cities;
    const outcome = handleMarch(cmd, {
      cities,
      officers,
      rng,
      weather: input.weather,
      delayedEffectsOut: delayedEffects,
      family: input.family,
      appointments: input.appointments,
      casusBelliMarks: input.casusBelliMarks,
      date: input.date,
    });
    cities = outcome.cities;
    officers = outcome.officers;
    entries.push(...outcome.entries);
    // Phase 3d — city fell to a new owner this march: clear any captured
    // sub-territory overrides for that city, so its inner cells follow
    // the new owner instead of showing the previous invader's banner.
    for (const cityId of Object.keys(outcome.cities)) {
      const beforeOwner = citiesBefore[cityId]?.ownerForceId;
      const afterOwner = outcome.cities[cityId]?.ownerForceId;
      if (beforeOwner !== afterOwner) {
        const territories = generateTerritories(Object.values(cities));
        for (const ter of territories) {
          if (ter.parentCityId === cityId) {
            delete territoryOwnership[ter.id];
          }
        }
      }
    }
    // 武功 — duels: scan battle entries for duel winners
    for (const e of outcome.entries) {
      if (e.battle && e.battle.duelWinnerId) {
        bumpDeed(e.battle.duelWinnerId, { duelsWon: 1 });
      }
    }
  }

  for (const cmd of internals) {
    const officer = officers[cmd.officerId];
    const city = cities[cmd.cityId];
    if (!officer || !city) continue;
    if (officer.status !== 'idle') continue;
    if (cmd.type === 'search') {
      const result = handleSearch({ officer, city, officers, lostItems, rng });
      officers = result.officers;
      lostItems = result.lostItems;
      entries.push(result.entry);
      continue;
    }
    if (cmd.type === 'garrison') {
      // 鎮守 — clear enemy overrides from this city's own satellite cells
      // (the commander drives the raiders off) and reinforce defense.
      // Reclaim effectiveness scales with leadership.
      if (!city.ownerForceId) continue;
      const sats = generateTerritories(Object.values(cities))
        .filter((t) => t.parentCityId === city.id && !t.id.endsWith('-0'));
      let reclaimed = 0;
      for (const ter of sats) {
        const owner = territoryOwnership[ter.id];
        if (owner && owner !== city.ownerForceId) {
          delete territoryOwnership[ter.id];
          reclaimed++;
        }
      }
      const defBoost = Math.max(2, Math.floor(officer.stats.leadership / 20));
      cities[city.id] = {
        ...city,
        defense: Math.min(200, city.defense + defBoost),
      };
      entries.push({
        cityId: city.id,
        kind: 'command-success',
        text: reclaimed > 0
          ? `${officer.name.en} garrisoned ${city.name.en}: reclaimed ${reclaimed} territory cell(s), defense +${defBoost}.`
          : `${officer.name.en} garrisoned ${city.name.en}: defense +${defBoost}.`,
        textZh: reclaimed > 0
          ? `${officer.name.zh}鎮守${city.name.zh}：收復外圍 ${reclaimed} 格，城防 +${defBoost}。`
          : `${officer.name.zh}鎮守${city.name.zh}：城防 +${defBoost}。`,
      });
      bumpDeed(cmd.officerId, { civicWorks: 1 });
      continue;
    }
    const bonus = appointmentBonusFor(
      city.ownerForceId,
      input.appointments ?? [],
      officers,
      city.id,
    );
    // Fold 求賢令 transient recruit multiplier on top of civic title bonus.
    const recruitBoost = city.ownerForceId && input.recruitBonusSeasons
      ? input.recruitBonusSeasons[city.ownerForceId]
      : undefined;
    const finalBonus = recruitBoost
      ? { ...bonus, recruitBonus: bonus.recruitBonus + (recruitBoost.multiplier - 1) }
      : bonus;
    const result = resolveInternalAffairs(cmd.type, officer, city, rng, finalBonus);
    cities[city.id] = applyDelta(city, result.delta);
    entries.push({
      cityId: city.id,
      kind: result.success ? 'command-success' : 'command-failure',
      text: result.message,
      textZh: result.messageZh,
    });
    // 武功 — civicWorks bump on successful internal affairs
    if (result.success) bumpDeed(cmd.officerId, { civicWorks: 1 });
  }

  const seasonBoundary = input.seasonBoundary ?? true;

  // Phase 3g — territory income: precompute satellite cells per city so the
  // economy tick can add +TERRITORY_GOLD per cell the city still controls.
  // Captured cells stop paying their parent city, so losing ground = losing
  // income (on top of the supply-pressure drain below).
  const TERRITORY_GOLD = 5;
  const satellitesByCity: Record<EntityId, Territory[]> = {};
  if (seasonBoundary) {
    for (const ter of generateTerritories(Object.values(cities))) {
      if (ter.id.endsWith('-0')) continue; // cell 0 is the city itself
      (satellitesByCity[ter.parentCityId] ??= []).push(ter);
    }
  }
  const controlledSatellites = (city: City): number => {
    const sats = satellitesByCity[city.id] ?? [];
    let held = 0;
    for (const ter of sats) {
      const owner = territoryOwnership[ter.id];
      // Held if no override (defaults to parent city's force) or override
      // explicitly equals this city's force.
      if (owner == null || owner === city.ownerForceId) held++;
    }
    return held;
  };

  // 2. Economy tick per city — only on season boundary (every 9 periods).
  if (seasonBoundary)
  for (const city of Object.values(cities)) {
    // Gather officers stationed in this city for policy effect aggregation.
    const cityOfficers = Object.values(officers).filter(
      (o) => o.locationCityId === city.id && o.status !== 'dead' && o.status !== 'unsearched',
    );
    const tick = tickCityEconomy(city, input.date.season, cityOfficers);
    const territoryGold = city.ownerForceId
      ? controlledSatellites(city) * TERRITORY_GOLD
      : 0;
    const updated: City = {
      ...city,
      gold: city.gold + tick.goldIncome + territoryGold,
      food: Math.max(0, city.food + tick.foodIncome - tick.foodUpkeep),
      troops: Math.max(0, city.troops - tick.desertion),
      loyalty: Math.max(0, Math.min(100, city.loyalty + tick.loyaltyDelta)),
      population: Math.max(1000, city.population + tick.populationDelta),
    };
    cities[city.id] = updated;
    if (tick.populationDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.populationDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 人口 ${tick.populationDelta > 0 ? '+' : ''}${tick.populationDelta.toLocaleString()}.`,
        textZh: `${city.name.zh}：人口 ${tick.populationDelta > 0 ? '+' : ''}${tick.populationDelta.toLocaleString()}。`,
      });
    }

    if (tick.goldIncome > 0 || tick.foodIncome > 0) {
      entries.push({
        cityId: city.id,
        kind: 'income',
        text: `${city.name.en}: +${tick.goldIncome} gold${
          tick.foodIncome ? `, +${tick.foodIncome} food (harvest)` : ''
        }${tick.policyBadges.length ? ` · ${tick.policyBadges.slice(0, 2).join(' · ')}` : ''}.`,
        textZh: `${city.name.zh}：金 +${tick.goldIncome}${
          tick.foodIncome ? `、糧 +${tick.foodIncome}（秋收）` : ''
        }${tick.policyBadges.length ? ` · ${tick.policyBadges.slice(0, 2).join(' · ')}` : ''}。`,
      });
    }
    if (tick.loyaltyDelta !== 0) {
      entries.push({
        cityId: city.id,
        kind: tick.loyaltyDelta > 0 ? 'income' : 'desertion',
        text: `${city.name.en}: 民忠 ${tick.loyaltyDelta > 0 ? '+' : ''}${tick.loyaltyDelta} (policy effect).`,
        textZh: `${city.name.zh}：民忠 ${tick.loyaltyDelta > 0 ? '+' : ''}${tick.loyaltyDelta}（政令之效）。`,
      });
    }
    if (tick.foodUpkeep > 0) {
      entries.push({
        cityId: city.id,
        kind: 'upkeep',
        text: `${city.name.en}: −${tick.foodUpkeep} food (troop upkeep).`,
        textZh: `${city.name.zh}：糧 −${tick.foodUpkeep}（兵糧支用）。`,
      });
    }
    if (tick.desertion > 0) {
      entries.push({
        cityId: city.id,
        kind: 'desertion',
        text: `${city.name.en}: ${tick.desertion} troops deserted from starvation.`,
        textZh: `${city.name.zh}：因缺糧，逃兵 ${tick.desertion} 名。`,
      });
    }
  }

  // Phase 3f — territory supply pressure. If a city's own satellite
  // territories are occupied by an enemy force, the city loses some
  // troops + gold each season from supply disruption / morale damage.
  // Captured cells around an enemy city → enemy city slowly starves.
  if (seasonBoundary) {
    for (const city of Object.values(cities)) {
      if (!city.ownerForceId) continue;
      const sats = satellitesByCity[city.id] ?? [];
      if (sats.length === 0) continue;
      let enemyCount = 0;
      for (const ter of sats) {
        const owner = territoryOwnership[ter.id];
        if (owner && owner !== city.ownerForceId) enemyCount++;
      }
      if (enemyCount === 0) continue;
      const ratio = enemyCount / sats.length;
      const troopLoss = Math.floor(city.troops * ratio * 0.05);
      const goldLoss = Math.floor(city.gold * ratio * 0.15);
      if (troopLoss === 0 && goldLoss === 0) continue;
      cities[city.id] = {
        ...city,
        troops: Math.max(0, city.troops - troopLoss),
        gold: Math.max(0, city.gold - goldLoss),
      };
      const fully = ratio >= 1;
      entries.push({
        cityId: city.id,
        kind: 'desertion',
        text: `${city.name.en} ${fully ? 'is fully encircled' : 'is harassed'} — ${enemyCount}/${sats.length} surrounding territories enemy-held. −${troopLoss} troops, −${goldLoss}g.`,
        textZh: `${city.name.zh}${fully ? '被圍困' : '受騷擾'}：外圍 ${enemyCount}/${sats.length} 格陷敵。兵 −${troopLoss}、金 −${goldLoss}。`,
      });
    }
  }

  // Player territory summary: net cells captured / lost this season via
  // marching (override transitions involving the player force). Closes the
  // feedback loop on the core grid-conquest mechanic.
  const player = input.playerForceId;
  if (player) {
    const before = input.territoryOwnership ?? {};
    let gained = 0;
    let lost = 0;
    const keys = new Set([...Object.keys(before), ...Object.keys(territoryOwnership)]);
    for (const k of keys) {
      const b = before[k] ?? null;
      const a = territoryOwnership[k] ?? null;
      if (b === a) continue;
      if (a === player) gained++;
      else if (b === player) lost++;
    }
    if (gained > 0 || lost > 0) {
      const parts: string[] = [];
      const partsZh: string[] = [];
      if (gained > 0) { parts.push(`gained ${gained} territory cell(s)`); partsZh.push(`佔領 ${gained} 格領地`); }
      if (lost > 0) { parts.push(`lost ${lost}`); partsZh.push(`失守 ${lost} 格`); }
      entries.push({
        cityId: null,
        kind: gained >= lost ? 'conquest' : 'desertion',
        text: `Your forces ${parts.join(', ')} this season.`,
        textZh: `本季我軍${partsZh.join('、')}。`,
      });
    }
  }

  // 2a. Vassal tribute: each vassal force auto-pays 100g/season to its
  // suzerain's capital. If the vassal can't pay, no penalty — they're
  // already a vassal.
  if (seasonBoundary) {
    for (const vassal of Object.values(forces)) {
      if (!vassal.vassalOfForceId) continue;
      const suzerain = forces[vassal.vassalOfForceId];
      if (!suzerain) continue;
      const vCap = cities[vassal.capitalCityId];
      const sCap = cities[suzerain.capitalCityId];
      if (!vCap || !sCap) continue;
      const tribute = Math.min(vCap.gold, 100);
      if (tribute <= 0) continue;
      cities[vCap.id] = { ...vCap, gold: vCap.gold - tribute };
      cities[sCap.id] = { ...cities[sCap.id], gold: cities[sCap.id].gold + tribute };
    }
  }

  // 2b. Military stipend payment — each force pays its officers' rank
  // stipends out of its capital city's gold. Insufficient funds means
  // unpaid arrears (logged) — over time, this hurts loyalty.
  if (seasonBoundary) {
    for (const force of Object.values(forces)) {
      if (!force.capitalCityId) continue;
      const capital = cities[force.capitalCityId];
      if (!capital) continue;
      let stipend = 0;
      for (const o of Object.values(officers)) {
        if (o.forceId !== force.id) continue;
        if (o.status === 'dead' || o.status === 'imprisoned') continue;
        const rank = MILITARY_RANKS_BY_ID[o.rank];
        if (rank) stipend += rank.stipend;
      }
      if (stipend === 0) continue;
      const paid = Math.min(capital.gold, stipend);
      const owed = stipend - paid;
      cities[capital.id] = { ...capital, gold: capital.gold - paid };
      if (owed > 0) {
        // Unpaid arrears: shave 2 loyalty off every officer of this force.
        // Discontent spreads quickly when the treasury runs dry.
        for (const o of Object.values(officers)) {
          if (o.forceId !== force.id) continue;
          if (o.status === 'dead' || o.status === 'imprisoned') continue;
          officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 2) };
        }
        entries.push({
          cityId: capital.id,
          kind: 'note',
          text: `${force.name.en} treasury fell short of military stipends by ${owed}g — officers' loyalty −2.`,
          textZh: `${force.name.zh}府庫不足，俸祿欠 ${owed} 金，諸將忠誠 −2。`,
        });
      }
    }
  }

  // 3. Reset officer tasks + loyalty drift toward force strength.
  // Compute per-force city counts once.
  const cityCountByForce: Record<EntityId, number> = {};
  let totalCities = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId) {
      cityCountByForce[c.ownerForceId] =
        (cityCountByForce[c.ownerForceId] ?? 0) + 1;
      totalCities++;
    }
  }
  const avgCities =
    totalCities / Math.max(1, Object.keys(cityCountByForce).length);

  // Oath bonds are imported from data/bonds.ts.

  // Per-force censor loyalty drift bonus (御史中丞): +1 per season to all
  // officers of that force, on top of the cities-balance drift above.
  const censorBonusByForce: Record<EntityId, number> = {};
  if (input.appointments) {
    for (const f of Object.keys(cityCountByForce)) {
      censorBonusByForce[f] = appointmentBonusFor(
        f,
        input.appointments,
        officers,
      ).loyaltyDriftPerSeason;
    }
  }
  for (const o of Object.values(officers)) {
    let next: Officer = o.task ? { ...o, task: null } : o;
    if (o.forceId && o.status === 'idle') {
      const owned = cityCountByForce[o.forceId] ?? 0;
      let drift = 0;
      if (owned > avgCities + 1) drift = 1;
      else if (owned < avgCities - 1) drift = -1;
      else if (owned === 0) drift = -3;
      drift += censorBonusByForce[o.forceId] ?? 0;
      if (drift !== 0) {
        const newLoyalty = Math.max(0, Math.min(100, o.loyalty + drift));
        if (newLoyalty !== o.loyalty) {
          next = { ...next, loyalty: newLoyalty };
        }
      }
    }
    if (next !== o) officers[o.id] = next;
  }

  // Apply oath-bond loyalty floors (after drift, so bonds always win).
  // Includes both static historical bonds and runtime marriage bonds.
  const allBonds = [...OATH_BONDS, ...input.runtimeBonds];
  for (const bond of allBonds) {
    const a = officers[bond.officerA];
    const b = officers[bond.officerB];
    if (
      a &&
      b &&
      a.forceId &&
      a.forceId === b.forceId &&
      a.status !== 'dead' &&
      b.status !== 'dead'
    ) {
      if (a.loyalty < bond.floor)
        officers[bond.officerA] = { ...a, loyalty: bond.floor };
      if (b.loyalty < bond.floor)
        officers[bond.officerB] = { ...b, loyalty: bond.floor };
    }
  }

  // Defection: officers with loyalty < 20 abandon their force and become
  // free agents in the city they currently reside in.
  for (const o of Object.values(officers)) {
    if (
      o.status === 'idle' &&
      o.forceId &&
      o.loyalty < 20 &&
      o.locationCityId &&
      cities[o.locationCityId]?.ownerForceId === o.forceId
    ) {
      // 40% chance per season once loyalty is below 20.
      if (rng() < 0.4) {
        const formerForce = forces[o.forceId];
        officers[o.id] = {
          ...o,
          forceId: null,
          loyalty: 50,
          task: null,
        };
        entries.push({
          cityId: o.locationCityId,
          kind: 'note',
          text: `${o.name.en} (${o.name.zh}) abandons ${formerForce?.name.en ?? 'their lord'} and walks away a free agent.`,
          textZh: `${o.name.zh}背棄${formerForce?.name.zh ?? '主公'}，飄然而去，自此為一介游俠。`,
        });
      }
    }
  }

  // 4. Random events — only on season boundary.
  if (seasonBoundary) {
    const eventResult = rollEvents({
      season: input.date.season,
      cities,
      officers,
      rng,
    });
    cities = eventResult.cities;
    officers = eventResult.officers;
    entries.push(...eventResult.entries);
  }

  // 5. Aging — only at year boundary (winter → spring) + on season boundary.
  if (seasonBoundary && input.date.season === 'winter') {
    const aging = processAging({
      year: input.date.year,
      cities,
      officers,
      forces,
      rng,
      family: input.family,
    });
    cities = aging.cities;
    officers = aging.officers;
    forces = aging.forces;
    entries.push(...aging.entries);
  }

  // 6. Diplomacy tick (NAP expiry + relation decay on year transitions).
  const dip = tickDiplomacy({
    diplomacy: input.diplomacy,
    date: advanceSeason(input.date),
    isYearTransition: input.date.season === 'winter',
  });
  entries.push(...dip.entries);

  // 7. Advance date.
  const nextDate = advanceSeason(input.date);

  return {
    date: nextDate,
    cities,
    officers,
    forces,
    diplomacy: dip.diplomacy,
    lostItems,
    report: { date: { year: input.date.year, season: input.date.season }, entries },
    keptCommands: Object.keys(keptCommands).length > 0 ? keptCommands : undefined,
    armies: outArmies,
    territoryOwnership,
    delayedEffects: delayedEffects.length > 0 ? delayedEffects : undefined,
    deedDeltas: deedDeltas.length > 0 ? deedDeltas : undefined,
  };
}

function applyDelta(
  city: City,
  delta: Partial<{
    agriculture: number;
    commerce: number;
    defense: number;
    troops: number;
    population: number;
    loyalty: number;
    wallTier: 1 | 2 | 3;
  }>,
): City {
  // Stat caps grow with city tier — use cityStatCap (1000 as buffer since
  // we clamp by size separately in commands.ts).
  return {
    ...city,
    agriculture: Math.max(0, Math.min(200, city.agriculture + (delta.agriculture ?? 0))),
    commerce: Math.max(0, Math.min(200, city.commerce + (delta.commerce ?? 0))),
    defense: Math.max(0, Math.min(200, city.defense + (delta.defense ?? 0))),
    troops: Math.max(0, city.troops + (delta.troops ?? 0)),
    population: Math.max(0, city.population + (delta.population ?? 0)),
    loyalty: clamp(city.loyalty + (delta.loyalty ?? 0), 0, 100),
    wallTier: delta.wallTier ?? city.wallTier,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
