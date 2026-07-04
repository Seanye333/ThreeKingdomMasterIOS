/**
 * 戰術 AI — the whole computer-general: per-unit action selection
 * (aiActOnce), stratagem picking, role ordering, pathing value fields and
 * the outer aiTakeTurn loop. Split out of tactical.ts (2026-07) — a pure
 * mechanical move; the engine primitives stay in tactical.ts and are
 * imported below.
 */
import type {
  EntityId, Officer, TacticalBattle, TacticalUnit, HexCoord, TerrainKind,
  UnitType, StratagemId,
} from '../types';
import {
  hexDistance, hexNeighbours, tileAt,
  canMove, moveUnit, attackUnits,
  forecastAttack, applyStratagem, endTurn, isRouting, changeFormation,
  canChangeFormation, pickAiFormation, formationCounterMul, canFortify,
  fortifyTile, retreatUnit,
  counterMultiplier, repairWall, breakGate, scaleWall,
  attackRange, hasLineOfSight, canChallengeDuel, challengeDuel,
  WIND_DELTA, TERRAIN_MOVE_COST,
  terrainAffinity, tileValueFor, bestStepToward,
} from './tactical';
import { SIGNATURE_OVERRIDES } from './personalTactics';

/**
 * N1 — AI stratagem heuristic. Returns the battle after using a stratagem,
 * or null if none was applicable. Higher-INT officers get to attempt this
 * with a higher probability.
 */
function aiTryStratagem(
  b: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  skill = 0.7,
): TacticalBattle | null {
  if (unit.ap < 1) return null;
  const off = officers[unit.officerId];
  if (!off) return null;
  // Probability to attempt a stratagem at all (high INT casts more; a more
  // skilled AI reaches for its tricks more readily).
  const baseChance = (0.20 + Math.max(0, (off.stats.intelligence - 60)) / 200) * (0.6 + 0.6 * skill);
  if (rng() > baseChance) return null;

  const enemies = b.units.filter((u) => u.side !== unit.side);
  const friends = b.units.filter((u) => u.side === unit.side);
  if (enemies.length === 0) return null;

  // Candidate stratagems in priority order, with target picker for each.
  type Cand = { id: StratagemId; target: HexCoord };
  const candidates: Cand[] = [];

  // 1. defend self if our troops are low
  if (unit.troops / Math.max(1, unit.maxTroops) < 0.4) {
    candidates.push({ id: 'defend', target: unit.coord });
  }
  // 1b. 詐敗誘敵 — a cunning officer pressed in melee feigns a rout to bait the
  // pursuer onto a回馬槍 (sets a 詐敗 trap on itself; springs on the next hit).
  const pressed = enemies.some((e) => hexDistance(unit.coord, e.coord) === 1);
  if (off.stats.intelligence >= 70 && pressed && !unit.effects.some((e) => e.kind === 'feign-rout')
      && (off.traits?.includes('cunning') || off.traits?.includes('precognitive') || unit.troops / Math.max(1, unit.maxTroops) < 0.6)) {
    candidates.push({ id: 'false-retreat', target: unit.coord });
  }
  // 2. rally a wounded friend within 2
  if (off.stats.intelligence >= 60) {
    const wounded = friends
      .filter((f) => f.id !== unit.id && f.troops / Math.max(1, f.maxTroops) < 0.5)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord))
      .filter((f) => hexDistance(unit.coord, f.coord) <= 2);
    if (wounded.length > 0) candidates.push({ id: 'rally', target: wounded[0].coord });
  }
  // 3. fire-attack — but a wits-about officer doesn't just torch the biggest
  // foe in range: 看風使火 he picks the one the wind & ground will punish most.
  // A blaze set downwind of a host packed onto flammable terrain (and in dry
  // wind) spreads INTO them; against the wind, or on bare rock, it gutters out.
  if (off.stats.intelligence >= 70 && b.weather !== 'rain') {
    const wind = WIND_DELTA[b.windDirection ?? 'calm'];
    const FLAMMABLE_T: Partial<Record<TerrainKind, number>> = { forest: 1.0, bridge: 0.9, plain: 0.45, road: 0.25, marsh: 0.1 };
    const fireScore = (e: TacticalUnit): number => {
      const tile = tileAt(b, e.coord);
      let s = e.troops; // bigger host = bigger prize
      s *= 1 + (FLAMMABLE_T[tile?.terrain ?? 'plain'] ?? 0); // dry tinder underfoot
      // downwind of the caster (wind carries the fire onto them) — up to +60%.
      const dx = e.coord.col - unit.coord.col, dy = e.coord.row - unit.coord.row;
      const mag = Math.hypot(dx, dy) || 1;
      const align = (wind.col * dx + wind.row * dy) / mag;
      if (b.windDirection && b.windDirection !== 'calm') s *= 1 + 0.6 * align;
      if (b.weather === 'wind') s *= 1.25; // a gale stokes any blaze
      // a packed cluster of foes lets fire leap rank to rank
      const cluster = enemies.filter((o) => hexDistance(e.coord, o.coord) <= 1).length;
      s *= 1 + 0.12 * (cluster - 1);
      return s;
    };
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
      .sort((a, b1) => fireScore(b1) - fireScore(a));
    if (inRange.length > 0) candidates.push({ id: 'fire-attack', target: inRange[0].coord });
  }
  // 4. confusion on the nearest enemy in range 4
  if (off.stats.intelligence >= 75) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 4)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord));
    if (inRange.length > 0) candidates.push({ id: 'confusion', target: inRange[0].coord });
  }
  // 5. lightning on the nearest enemy in range 4 (very high INT)
  if (off.stats.intelligence >= 90) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 4)
      .sort((a, b1) => b1.troops - a.troops);
    if (inRange.length > 0) candidates.push({ id: 'lightning', target: inRange[0].coord });
  }
  // 6. dragon-veil if multiple adjacent enemies
  const adjEnemies = enemies.filter((e) => hexDistance(unit.coord, e.coord) === 1);
  if (adjEnemies.length >= 2 && off.stats.war >= 80) {
    candidates.push({ id: 'dragon-veil', target: unit.coord });
  }
  // 7. charge an adjacent enemy
  if (adjEnemies.length > 0) {
    candidates.push({ id: 'charge', target: adjEnemies[0].coord });
  }
  // 8. rain-of-arrows for archers/siege/navy — only with arrows still in the quiver.
  if (['archers', 'siege', 'navy'].includes(unit.unitType) && off.stats.intelligence >= 60
      && (unit.maxAmmo === undefined || (unit.ammo ?? 0) > 0)) {
    const range = b.timeOfDay === 'night' ? 2 : 4;
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= range && hexDistance(unit.coord, e.coord) >= 2)
      .sort((a, b1) => b1.troops - a.troops);
    if (inRange.length > 0) candidates.push({ id: 'rain-of-arrows', target: inRange[0].coord });
  }
  // 9. gallop for cavalry
  if (unit.unitType === 'cavalry' && off.stats.war >= 70) {
    const inRange = enemies
      .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
      .sort((a, b1) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, b1.coord));
    if (inRange.length > 0) candidates.push({ id: 'gallop', target: inRange[0].coord });
  }
  // 10. naval play for ships — fireships (best vs a chained/clustered fleet),
  //     then ram or board an adjacent enemy ship.
  if (unit.unitType === 'navy') {
    if (off.stats.intelligence >= 65) {
      const inRange = enemies
        .filter((e) => hexDistance(unit.coord, e.coord) <= 3)
        .sort((a, b1) => {
          // Prefer chained targets (fire will spread through the whole fleet).
          const ac = a.effects.some((x) => x.kind === 'chained') ? 1 : 0;
          const bc = b1.effects.some((x) => x.kind === 'chained') ? 1 : 0;
          return bc - ac || b1.troops - a.troops;
        });
      if (inRange.length > 0) candidates.push({ id: 'fire-ship', target: inRange[0].coord });
    }
    if (adjEnemies.length > 0) {
      const ramTarget = [...adjEnemies].sort((a, b1) => b1.troops - a.troops)[0];
      if (off.stats.war >= 60) candidates.push({ id: 'board', target: ramTarget.coord });
      if (off.stats.war >= 55) candidates.push({ id: 'ram', target: ramTarget.coord });
    }
  }
  // 11. burn the enemy grain once a raider has reached their rear (烏巢).
  if (off.stats.war >= 60) {
    const inRear = unit.side === 'attacker' ? unit.coord.col >= b.width - 3 : unit.coord.col <= 2;
    const enemyStarving = enemies.some((e) => e.effects.some((x) => x.kind === 'starving'));
    if (inRear && !enemyStarving) candidates.push({ id: 'raid-supply', target: unit.coord });
  }

  for (const c of candidates) {
    const r = applyStratagem(b, unit.id, c.id, c.target, officers);
    if (r.ok) return r.battle;
  }
  return null;
}

export interface AITurnResult {
  battle: TacticalBattle;
  /** Each entry: a stratagem an AI unit used this turn. For signature
   *  tactics the officer owns, `tacticId` resolves to the named tactic. */
  signatures: Array<{ tacticId: string; coord: HexCoord; unitId: EntityId; stratagemId: StratagemId }>;
}

/** Reverse-lookup: for a stratagem id, find the most signature-worthy
 *  tactic in the officer's list that maps to that underlying stratagem. */
function inferSignatureTactic(
  officer: Officer | undefined,
  stratagemId: StratagemId,
): string {
  if (!officer) return stratagemId;
  const owned = ((officer as Officer & { tactics?: string[] }).tactics) ?? [];
  // Try exact tactics owned by officer that map to this underlying.
  for (const tid of owned) {
    const ov = SIGNATURE_OVERRIDES[tid];
    if (ov && ov.underlying === stratagemId) return tid;
  }
  return stratagemId;
}

// ─── AI movement & role helpers ────────────────────────────────────────

/** Map the global game difficulty onto the tactical AI's competence knob.
 *  The optional 1–5 AI-strength dial nudges it ±0.16 around the difficulty
 *  baseline (clamped to a sane floor/ceiling), so "AI 強度" is felt in battle
 *  as well as on the strategic map. */
export function aiSkillForDifficulty(
  difficulty: 'easy' | 'normal' | 'hard',
  aiStrength = 3,
): number {
  const base = difficulty === 'easy' ? 0.35 : difficulty === 'hard' ? 1.0 : 0.7;
  const lv = Math.max(1, Math.min(5, Math.round(aiStrength)));
  const nudge = (lv - 3) * 0.08;
  return Math.max(0.15, Math.min(1, base + nudge));
}

/** Battlefield role drives how the AI positions and fights a unit. */
export type TacticalRole = 'melee' | 'ranged' | 'strategist' | 'siege';

/** Classify a unit: siege heads for gates, ranged kite, fragile high-INT
 *  officers hang back and cast, everyone else brawls on the front line. */
export function unitRole(o: Officer | undefined, unitType: UnitType): TacticalRole {
  if (unitType === 'siege') return 'siege';
  if (unitType === 'archers' || unitType === 'navy') return 'ranged';
  const war = o?.stats.war ?? 60;
  const int = o?.stats.intelligence ?? 60;
  if (war < 65 && int >= 75) return 'strategist';
  return 'melee';
}

/** Acting order: front line first so the squishy units can react. */
function roleRank(role: TacticalRole): number {
  return role === 'melee' ? 0 : role === 'siege' ? 1 : role === 'ranged' ? 2 : 3;
}

/**
 * Reposition a kiting unit to sit in its preferred [lo,hi] distance band from
 * the nearest enemy, favouring terrain that boosts it. Returns the chosen
 * hex, or null if simply holding position is already best.
 */
export function bandRepositionStep(
  b: TacticalBattle,
  unit: TacticalUnit,
  enemies: TacticalUnit[],
  lo: number,
  hi: number,
): HexCoord | null {
  if (enemies.length === 0) return null;
  const score = (c: HexCoord): number => {
    const nd = Math.min(...enemies.map((e) => hexDistance(c, e.coord)));
    let band: number;
    if (nd < lo) band = (nd - lo) * 2; // too close → strong penalty
    else if (nd <= hi) band = 2; // sweet spot
    else band = (hi - nd) * 0.5; // too far → mild penalty
    const tile = tileAt(b, c);
    return band + (tile ? terrainAffinity(unit.unitType, tile.terrain) : 0);
  };
  let best: HexCoord | null = null;
  let bestScore = score(unit.coord);
  for (const n of hexNeighbours(unit.coord)) {
    if (!canMove(b, unit, n)) continue;
    const s = score(n);
    if (s > bestScore) {
      bestScore = s;
      best = n;
    }
  }
  return best;
}

/** Pick the juiciest target: nearby, countered by us, wounded, or a commander.
 *  Weighting wounded enemies low makes the side gang up (focus fire). */
export function pickAiTarget(
  unit: TacticalUnit,
  candidates: TacticalUnit[],
): TacticalUnit | undefined {
  if (candidates.length === 0) return undefined;
  const score = (e: TacticalUnit): number => {
    const counter = counterMultiplier(unit.unitType, e.unitType);
    let s = hexDistance(unit.coord, e.coord);
    if (e.isCommander) s *= 0.5;
    if (counter >= 1.4) s *= 0.6; // we counter them — pursue
    if (counter <= 0.8) s *= 1.8; // they counter us — avoid
    const woundedRatio = e.troops / Math.max(1, e.maxTroops);
    s *= 0.4 + woundedRatio; // weaker = juicier → focus fire
    return s;
  };
  return [...candidates].sort((a, c) => score(a) - score(c))[0];
}

/**
 * Choose which *adjacent* enemy to actually strike — never walk past a free
 * hit. Mechanically grounded via predictAttackDamage + the same terrain/counter
 * multipliers attackUnits applies, so the AI: (1) secures kills (a foe it can
 * finish this hit deals no counter-attack — hugely valuable), (2) maximises the
 * net troop swing (damage dealt − counter taken), and (3) decapitates enemy
 * commanders.
 */
export function pickAdjacentTarget(
  b: TacticalBattle,
  unit: TacticalUnit,
  adjEnemies: TacticalUnit[],
  officers: Record<EntityId, Officer>,
): TacticalUnit | undefined {
  if (adjEnemies.length === 0) return undefined;
  // 量敵而擊 — score by the FULL forecast (weapon/側背/圍殲/氣勢/掩體 all baked in),
  // so the AI now favours a matchup it dominates and shies from a braced spearwall
  // or a desperate cornered foe (high counter, low net swing) on its own.
  const value = (e: TacticalUnit): number => {
    const f = forecastAttack(b, unit, e, officers);
    const expDmg = (f.dmgMin + f.dmgMax) / 2;
    const expCounter = (f.counterMin + f.counterMax) / 2;
    // Judge a kill by EXPECTED damage, not the optimistic max — the AI shouldn't
    // bank on a top-roll one-shot it usually won't land.
    const willKill = expDmg >= e.troops;
    let v = expDmg - (willKill ? 0 : expCounter); // net swing; a kill dodges the riposte
    if (willKill) v += e.troops * 0.5 + 500; // remove a unit AND dodge the counter
    if (e.isCommander) v += 800; // decapitation strike (also swings momentum hard)
    if (isRouting(e)) v += 300; // run the broken foe down before it rallies
    return v;
  };
  return adjEnemies.reduce((a, c) => (value(c) > value(a) ? c : a));
}

/** A commander steers toward an unresolved movement objective. */
function objectiveStep(b: TacticalBattle, unit: TacticalUnit): HexCoord | null {
  if (!unit.isCommander) return null;
  // 決堰水淹 — an unbroken dam (漢水堰) that would drown MORE of the enemy than
  // of us (more foe units standing on river/bridge) is worth making for: reach
  // it and break it for a 水淹七軍. The flood hits both sides, so only when the
  // maths favour us. (Named-map AI no longer ignores the battlefield's lever.)
  if (!b.damBroken) {
    const dam = (b.specialTiles ?? []).find((s) => s.label.zh.includes('堰') || s.label.zh.includes('堤'));
    if (dam && hexDistance(unit.coord, dam.coord) > 0) {
      const onWater = (side: 'attacker' | 'defender') => b.units.filter(
        (u) => u.side === side && u.troops > 0 && ['river', 'bridge'].includes(tileAt(b, u.coord)?.terrain ?? ''),
      ).length;
      const foe = unit.side === 'attacker' ? 'defender' : 'attacker';
      if (onWater(foe) >= onWater(unit.side) + 1) return bestStepToward(b, unit, dam.coord);
    }
  }
  const obj = unit.side === 'attacker' ? b.attackerObjective : b.defenderObjective;
  if (!obj || obj.resolved) return null;
  let goal: HexCoord | null = null;
  if ((obj.kind === 'hold-tile' || obj.kind === 'capture-supply') && obj.tileCoord) {
    goal = obj.tileCoord;
  } else if (obj.kind === 'escape') {
    goal = { col: unit.side === 'attacker' ? 0 : b.width - 1, row: unit.coord.row };
  }
  if (!goal || hexDistance(unit.coord, goal) === 0) return null;
  return bestStepToward(b, unit, goal);
}

/** Diff stratagem cooldowns to recover which (signature) tactic a unit fired. */
function detectSignature(
  prev: TacticalBattle,
  next: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
): AITurnResult['signatures'] {
  const out: AITurnResult['signatures'] = [];
  const prefix = `${unit.id}-`;
  for (const [k, val] of Object.entries(next.stratagemCooldowns)) {
    if (!k.startsWith(prefix)) continue;
    if ((prev.stratagemCooldowns[k] ?? -1) >= val) continue;
    const stratagemId = k.slice(prefix.length) as StratagemId;
    const after = next.units.find((u) => u.id === unit.id);
    if (!after) continue;
    const tacticId = inferSignatureTactic(officers[after.officerId], stratagemId);
    out.push({ tacticId, coord: after.coord, unitId: after.id, stratagemId });
  }
  return out;
}

/** One AI decision for a single unit. Returns the (possibly unchanged) battle,
 *  whether it actually acted, and any signature tactics fired. */
function aiActOnce(
  b: TacticalBattle,
  unit: TacticalUnit,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  skill: number,
  autoDuel: boolean,
): { battle: TacticalBattle; acted: boolean; signatures: AITurnResult['signatures'] } {
  const hold = { battle: b, acted: false, signatures: [] as AITurnResult['signatures'] };
  const off = officers[unit.officerId];

  // Ambusher lies in wait — springs only when an enemy is adjacent (landing
  // the +30% ambush bonus); otherwise holds its concealed position.
  if (unit.hidden) {
    const adj = b.units.find(
      (e) => e.side !== unit.side && !e.hidden && e.troops > 0 && hexDistance(unit.coord, e.coord) === 1,
    );
    if (adj) return { battle: attackUnits(b, unit.id, adj.id, officers, rng), acted: true, signatures: [] };
    return hold;
  }

  const enemies = b.units.filter((u) => u.side !== unit.side && !u.hidden && u.troops > 0);
  if (enemies.length === 0) return hold;
  const role = unitRole(off, unit.unitType);
  const fragile = role === 'ranged' || role === 'strategist';

  // Reach for a stratagem first (skill-gated). Ranged units lob arrows here;
  // casters unleash fire / confusion / lightning.
  const stratResult = aiTryStratagem(b, unit, officers, rng, skill);
  if (stratResult) {
    return { battle: stratResult, acted: true, signatures: detectSignature(b, stratResult, unit, officers) };
  }

  // Siege engines batter an adjacent wall or gate — gates first (700 HP
  // vs 1000, and the road runs through them).
  if (unit.unitType === 'siege') {
    const adjForts = hexNeighbours(unit.coord)
      .map((c) => tileAt(b, c))
      .filter((t): t is NonNullable<typeof t> => t?.terrain === 'gate' || t?.terrain === 'wall');
    const fort = adjForts.find((t) => t.terrain === 'gate') ?? adjForts[0];
    if (fort) return { battle: breakGate(b, unit.id, fort.coord), acted: true, signatures: [] };
    // Not at the walls yet — an attacking engine's job is the breach:
    // roll toward the nearest gate (or wall segment) instead of chasing
    // units around the enclosure.
    if (unit.side === 'attacker') {
      const forts = b.tiles.filter((t) => t.terrain === 'gate' || t.terrain === 'wall');
      if (forts.length > 0) {
        const gates = forts.filter((t) => t.terrain === 'gate');
        const pool = gates.length > 0 ? gates : forts;
        const nearest = pool.reduce((best, t) =>
          hexDistance(unit.coord, t.coord) < hexDistance(unit.coord, best.coord) ? t : best);
        const step = bestStepToward(b, unit, nearest.coord);
        if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
      }
    }
  }

  // Broken units flee off their own edge instead of dying in place.
  if (!unit.isCommander && unit.troops < unit.maxTroops * 0.3 && unit.morale < 30) {
    const edgeCol = unit.side === 'attacker' ? 0 : b.width - 1;
    if (Math.abs(unit.coord.col - edgeCol) <= 2) {
      return { battle: retreatUnit(b, unit.id), acted: true, signatures: [] };
    }
  }

  const adjEnemies = enemies.filter((e) => hexDistance(unit.coord, e.coord) === 1);

  // Fragile units (archers, casters) keep their distance once the AI is
  // skilled enough to micro; a clumsy low-skill AI just brawls in line.
  const micro = skill >= 0.4;
  if (fragile && micro) {
    const lo = role === 'strategist' ? 3 : 2;
    // 弓不出射程 — archers/siege must kite to a band INSIDE their own range, else
    // they sit a hex too far and never loose a shot (battles stall to the cap).
    const hi = role === 'strategist' ? 6 : attackRange(unit, off);
    if (adjEnemies.length > 0) {
      // Enemy in our face — back off if we can, else fight.
      const step = bandRepositionStep(b, unit, enemies, lo, hi);
      if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
      const t = pickAiTarget(unit, adjEnemies);
      if (t) return { battle: attackUnits(b, unit.id, t.id, officers, rng), acted: true, signatures: [] };
    }
    // Drifted out of the firing band — slide back into it.
    const nearest = Math.min(...enemies.map((e) => hexDistance(unit.coord, e.coord)));
    if (nearest < lo || nearest > hi + 1) {
      const step = bandRepositionStep(b, unit, enemies, lo, hi);
      if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
    }
    // 引弓搭箭 — well-positioned and armed: loose a basic ranged shot at the foe
    // it can hurt most (in射程 + clear射界), rather than idle. Uses the real
    // forecast so it shoots through gaps, not into cover/walls.
    if (role === 'ranged' && (unit.ammo ?? 0) > 0) {
      const shootable = enemies.filter((e) => {
        const d = hexDistance(unit.coord, e.coord);
        return d > 1 && d <= attackRange(unit, off) && hasLineOfSight(b, unit.coord, e.coord);
      });
      if (shootable.length > 0) {
        const best = shootable.reduce((a, c) => {
          const fa = forecastAttack(b, unit, a, officers); const fc = forecastAttack(b, unit, c, officers);
          return (fc.dmgMin + fc.dmgMax) > (fa.dmgMin + fa.dmgMax) ? c : a;
        });
        return { battle: attackUnits(b, unit.id, best.id, officers, rng), acted: true, signatures: [] };
      }
    }
    return hold; // in a good spot — don't charge into melee
  }

  // 陣前挑將 — a bold champion calls out a beatable adjacent officer rather than
  // trade blows with the rank-and-file: it picks the foe it most outmatches
  // (a commander breaks more if felled), exploiting 車輪戰 to wear heroes down.
  const duelEager = !!off?.traits?.some((t) => t === 'martial-valor' || t === 'reckless' || t === 'matchless');
  if (
    autoDuel && skill >= 0.5 && !fragile && (off?.stats.war ?? 0) >= 80 && adjEnemies.length > 0 &&
    rng() < 0.10 + (duelEager ? 0.18 : 0)
  ) {
    const beatable = adjEnemies
      .filter((e) => canChallengeDuel(unit, e, officers))
      .map((e) => ({ e, edge: (off?.stats.war ?? 0) - (officers[e.officerId]?.stats.war ?? 99) - (e.duelFatigue ?? 0) * 5 }))
      .filter((x) => x.edge >= 8)
      .sort((a, c) => (c.e.isCommander ? 1 : 0) - (a.e.isCommander ? 1 : 0) || c.edge - a.edge);
    if (beatable.length > 0) {
      return { battle: challengeDuel(b, unit.id, beatable[0].e.id, officers, rng), acted: true, signatures: [] };
    }
  }

  // Melee: never walk past a free hit. Strike the best adjacent foe —
  // kill-secure / best net troop swing / decapitation (pickAdjacentTarget).
  if (adjEnemies.length > 0) {
    const t = pickAdjacentTarget(b, unit, adjEnemies, officers);
    if (t) return { battle: attackUnits(b, unit.id, t.id, officers, rng), acted: true, signatures: [] };
  }

  // ── Garrison countermeasures (守方反制) ──
  if (unit.side === 'defender' && !fragile) {
    const forts = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate');
    if (forts.length > 0) {
      const rows = forts.map((t) => t.coord.row);
      const r0 = Math.min(...rows);
      const r1 = Math.max(...rows);
      // 堵后巷 — the rear corner alleys are the unwalled way in. If a foe
      // is closing on one and nobody plugs it, the nearest free defender
      // bodies the gap (an occupied hex blocks movement outright).
      const alleys: HexCoord[] = [
        { col: b.width - 1, row: r0 },
        { col: b.width - 1, row: r1 },
      ].filter((c) => {
        const t = tileAt(b, c);
        return t && TERRAIN_MOVE_COST[t.terrain] < 99;
      });
      for (const alley of alleys) {
        const threat = enemies.some((e) => hexDistance(e.coord, alley) <= 4);
        if (!threat) continue;
        const plugged = b.units.some((u) =>
          u.side === 'defender' && u.troops > 0 && hexDistance(u.coord, alley) === 0);
        if (plugged) continue;
        if (unit.coord.col === alley.col && unit.coord.row === alley.row) break; // already here
        const iAmNearest = !b.units.some((u) =>
          u.side === 'defender' && u.troops > 0 && u.id !== unit.id && u.ap > 0 &&
          hexDistance(u.coord, alley) < hexDistance(unit.coord, alley));
        if (!iAmNearest) continue;
        const step = bestStepToward(b, unit, alley);
        if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
      }
      // 搶修城防 — quiet stretch of wall + battered masonry next door →
      // shore it up before the next assault.
      if (skill >= 0.4 && !enemies.some((e) => hexDistance(e.coord, unit.coord) <= 3)) {
        const damaged = hexNeighbours(unit.coord).find((c) => {
          const t = tileAt(b, c);
          if (!t || (t.terrain !== 'wall' && t.terrain !== 'gate')) return false;
          const hp = b.wallHp?.[`${c.col},${c.row}`];
          const max = t.terrain === 'gate' ? 700 : 1000;
          return hp !== undefined && hp < max;
        });
        if (damaged) {
          const repaired = repairWall(b, unit.id, damaged);
          if (repaired !== b) return { battle: repaired, acted: true, signatures: [] };
        }
      }
      // 夜襲器械 — a hard-hitting garrison unit sorties (through its own
      // gate — defenders can pass) to burn the siege engines battering the
      // walls, as long as the garrison isn't already stretched thin.
      const defendersAlive = b.units.filter((u) => u.side === 'defender' && u.troops > 0).length;
      if (skill >= 0.5 && (off?.stats.war ?? 0) >= 70 && defendersAlive >= 3) {
        const engines = enemies.filter((e) =>
          e.unitType === 'siege' &&
          forts.some((f) => hexDistance(e.coord, f.coord) <= 3));
        if (engines.length > 0) {
          const prey = engines.reduce((bst, e) =>
            hexDistance(unit.coord, e.coord) < hexDistance(unit.coord, bst.coord) ? e : bst);
          if (hexDistance(unit.coord, prey.coord) === 1) {
            return { battle: attackUnits(b, unit.id, prey.id, officers, rng), acted: true, signatures: [] };
          }
          if (hexDistance(unit.coord, prey.coord) <= 6) {
            const step = bestStepToward(b, unit, prey.coord);
            if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
          }
        }
      }
    }
  }

  // Foot troops scale an adjacent wall when a friendly engine braces it.
  if (!fragile) {
    const wall = hexNeighbours(unit.coord)
      .map((c) => tileAt(b, c))
      .find((t) => t?.terrain === 'wall');
    if (wall) {
      const scaled = scaleWall(b, unit.id, wall.coord);
      if (scaled !== b) return { battle: scaled, acted: true, signatures: [] };
    }
  }

  // Elite light cavalry peel off to flank a supply raid on the enemy rear
  // (烏巢). Only when the side can spare them and the grain isn't already
  // burning — they aim for the back corner away from the enemy mass.
  if (
    skill >= 0.7 && unit.unitType === 'cavalry' && !unit.isCommander &&
    (off?.stats.war ?? 0) >= 70 && adjEnemies.length === 0
  ) {
    const friendsAlive = b.units.filter((u) => u.side === unit.side && u.troops > 0).length;
    const enemyStarving = enemies.some((e) => e.effects.some((x) => x.kind === 'starving'));
    const inRear = unit.side === 'attacker' ? unit.coord.col >= b.width - 3 : unit.coord.col <= 2;
    if (friendsAlive >= 4 && !enemyStarving && !inRear) {
      const edgeCol = unit.side === 'attacker' ? b.width - 1 : 0;
      const avgRow = enemies.reduce((s, e) => s + e.coord.row, 0) / enemies.length;
      const targetRow = avgRow < b.height / 2 ? b.height - 1 : 0; // opposite corner
      const step = bestStepToward(b, unit, { col: edgeCol, row: targetRow });
      if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
    }
  }

  // Pursue a battlefield objective (commander only) before chasing kills.
  const objStep = objectiveStep(b, unit);
  if (objStep) return { battle: moveUnit(b, unit.id, objStep), acted: true, signatures: [] };

  // A defender already dug into advantageous ground (chokepoint / hill / gate /
  // river-for-navy) stands fast rather than abandon the edge to chase — let the
  // attacker assault into it.
  if (unit.side === 'defender' && tileValueFor(unit, tileAt(b, unit.coord)?.terrain ?? 'plain') >= 1.2) {
    return hold;
  }

  // Approach the best target via terrain-aware pathfinding, weighted toward
  // cohesion (advance as a body, not piecemeal) and escorting a pressed 軍師.
  const target = pickAiTarget(unit, enemies);
  if (target) {
    const friends = b.units.filter((u) => u.side === unit.side && u.id !== unit.id && u.troops > 0);
    const guard = friends.find((f) => {
      const fo = officers[f.officerId];
      return fo && unitRole(fo, f.unitType) === 'strategist' &&
        enemies.some((e) => hexDistance(f.coord, e.coord) <= 3);
    });
    const bonus = (c: HexCoord): number => {
      let bdg = 0;
      if (friends.some((f) => hexDistance(c, f.coord) === 1)) bdg += 0.25; // cohesion
      if (guard && hexDistance(c, guard.coord) <= 1) bdg += 0.3; // escort the 軍師
      return bdg;
    };
    const step = bestStepToward(b, unit, target.coord, bonus);
    if (step) return { battle: moveUnit(b, unit.id, step), acted: true, signatures: [] };
  }

  return hold;
}

/**
 * Run a full AI side-turn. `opts.skill` (0–1) scales competence: below 0.4 the
 * AI brawls without kiting; higher values micro ranged units, lean on
 * stratagems, and path intelligently. Maps from game difficulty by the caller.
 */
export function aiTakeTurn(
  b: TacticalBattle,
  officers: Record<EntityId, Officer>,
  rng: () => number,
  opts?: { skill?: number; autoDuel?: boolean },
): AITurnResult {
  const skill = Math.max(0, Math.min(1, opts?.skill ?? 0.7));
  // 陣前挑將 — auto-resolved single combats are only allowed when no human is
  // watching this side play out (off-screen AI-vs-AI, or 委託指揮 delegated): an
  // interactively-played battle uses the rich 3D 敵將叫陣 path instead, so the
  // player never has a bout snatched away.
  const autoDuel = opts?.autoDuel ?? false;
  let cur = b;
  // 臨陣變陣 — on turn 1 (before the lines meet) a sharp AI re-forms if the
  // enemy's shape hard-counters its own, paying the turn of disorder while it's
  // still cheap. No more tactically-static armies fighting in a beaten formation.
  if (cur.turn === 1) {
    const side = cur.activeSide;
    const ourForm = side === 'attacker' ? cur.attackerFormation : cur.defenderFormation;
    const enemyForm = side === 'attacker' ? cur.defenderFormation : cur.attackerFormation;
    const cmd = cur.units.find((u) => u.side === side && u.isCommander && u.troops > 0);
    const int = cmd ? officers[cmd.officerId]?.stats.intelligence ?? 70 : 70;
    if (ourForm && enemyForm && int >= 75 && canChangeFormation(cur, side) && formationCounterMul(enemyForm, ourForm) > 1) {
      const arms = cur.units.filter((u) => u.side === side && u.troops > 0).map((u) => u.unitType);
      cur = changeFormation(cur, side, pickAiFormation(arms, int, { counter: enemyForm }));
    }
  }
  // 陣中築壘 — a defending AI that isn't yet engaged digs in: one fresh unit on
  // open firm ground with no attacker within 4 hexes raises fieldworks, so the
  // AI plays the same entrench game the player can. One dig per turn at most.
  if (cur.activeSide === 'defender' && !cur.naval && rng() < 0.5 * skill) {
    const foes = cur.units.filter((u) => u.side === 'attacker' && u.troops > 0);
    const digger = cur.units.find((u) =>
      u.side === 'defender' && u.troops > 0 && u.morale > 0 && !u.isCommander
      && u.ap >= u.maxAp && canFortify(cur, u)
      && foes.every((f) => hexDistance(f.coord, u.coord) >= 4));
    if (digger) cur = fortifyTile(cur, digger.id);
  }
  const signatures: AITurnResult['signatures'] = [];
  let safety = 120;
  while (safety-- > 0) {
    // Routing units (morale 0) aren't commanded — they already bolted for the
    // edge in processRout; the AI never tries to act with them.
    const myUnits = cur.units.filter((u) => u.side === cur.activeSide && u.ap > 0 && u.troops > 0 && u.morale > 0);
    if (myUnits.length === 0) break;
    // Front line acts before ranged/casters so the squishy units can react to
    // how the melee shapes up.
    const ordered = [...myUnits].sort(
      (a, c) =>
        roleRank(unitRole(officers[a.officerId], a.unitType)) -
        roleRank(unitRole(officers[c.officerId], c.unitType)),
    );
    let acted = false;
    for (const unit of ordered) {
      const r = aiActOnce(cur, unit, officers, rng, skill, autoDuel);
      if (r.acted) {
        cur = r.battle;
        signatures.push(...r.signatures);
        acted = true;
        break; // recompute the board after every action
      }
    }
    if (!acted) break;
  }
  return { battle: endTurn(cur, officers), signatures };
}
