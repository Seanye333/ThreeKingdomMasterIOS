import type {
  BattleDetail,
  City,
  EntityId,
  MarchCommand,
  Officer,
  ReportEntry,
  Skill,
} from '../types';
import { OATH_BONDS } from '../data/bonds';
import { ITEMS_BY_ID } from '../data/items';
import { OFFICER_RELATIONSHIPS } from '../data/relationships';
import { SKILLS_BY_ID } from '../data/skills';
import { getEliteTroop } from '../data/eliteTroops';
import { deriveTactics, tacticsTotalBonus } from '../data/officerAttributes';
import { selectSiegeEngine } from '../data/siegeEngines';
import {
  STRATAGEM_DEFS,
  pickAutoStratagem,
  rollStratagemSuccess,
  type BattleStratagemId,
  type StratagemEffect,
} from '../data/stratagems2';
import type { Weather } from './weather';

interface AggregatedSkillEffects {
  warBonus: number;
  leadershipBonus: number;
  powerMultiplier: number;
  enemyLossMultiplier: number;
  ownLossMultiplier: number;
  duelChanceBonus: number;
  defenseMultiplier: number;
}

const ZERO_EFFECTS: AggregatedSkillEffects = {
  warBonus: 0,
  leadershipBonus: 0,
  powerMultiplier: 1,
  enemyLossMultiplier: 1,
  ownLossMultiplier: 1,
  duelChanceBonus: 0,
  defenseMultiplier: 1,
};

/** Aggregate combat effects from one officer's skill list. */
function effectsForOfficer(o: Officer): AggregatedSkillEffects {
  const out: AggregatedSkillEffects = { ...ZERO_EFFECTS };
  for (const sid of o.skills) {
    const s: Skill | undefined = SKILLS_BY_ID[sid];
    if (!s?.combat) continue;
    out.warBonus += s.combat.warBonus ?? 0;
    out.leadershipBonus += s.combat.leadershipBonus ?? 0;
    out.powerMultiplier *= s.combat.powerMultiplier ?? 1;
    out.enemyLossMultiplier *= s.combat.enemyLossMultiplier ?? 1;
    out.ownLossMultiplier *= s.combat.ownLossMultiplier ?? 1;
    out.duelChanceBonus += s.combat.duelChanceBonus ?? 0;
    out.defenseMultiplier *= s.combat.defenseMultiplier ?? 1;
  }
  return out;
}

/** Aggregate combat effects from an entire side (commander + companions). */
function effectsForSide(pool: Officer[]): AggregatedSkillEffects {
  const out: AggregatedSkillEffects = { ...ZERO_EFFECTS };
  for (const o of pool) {
    const e = effectsForOfficer(o);
    out.warBonus += e.warBonus;
    out.leadershipBonus += e.leadershipBonus;
    out.powerMultiplier *= e.powerMultiplier;
    out.enemyLossMultiplier *= e.enemyLossMultiplier;
    out.ownLossMultiplier *= e.ownLossMultiplier;
    out.duelChanceBonus += e.duelChanceBonus;
    out.defenseMultiplier *= e.defenseMultiplier;
  }
  return out;
}

export interface BattleSide {
  troops: number;
  commander: Officer;
  /** Officers fighting on this side besides the commander (defenders or march companions). */
  companions?: Officer[];
}

export interface BattleResult {
  attackerWins: boolean;
  attackerLosses: number;
  defenderLosses: number;
  cityFalls: boolean;
  duel?: { winner: Officer; loser: Officer };
  // Breakdown for the battle detail modal
  aBlended: number;
  dBlended: number;
  aPower: number;
  dPower: number;
  defenseFactor: number;
  aBondBonusAvg: number;
  dBondBonusAvg: number;
  // ── Phase-49 enhancements ──
  /** Stratagem deployed by the attacker (if any). */
  stratagem?: { id: string; name: { zh: string; en: string }; succeeded: boolean };
  /** Wounded officers (one or both sides) — recoverable after N seasons. */
  wounded?: Array<{ officerId: EntityId; seasons: number }>;
  /** Officers captured by the victor (defection roll later). */
  captured?: EntityId[];
  /** Whether attacker pursued retreating enemy (extra losses to defender). */
  pursued?: boolean;
  /** Battle phase log for the replay screen. */
  phases?: BattlePhaseLog[];
  /** Final morale of each side at battle end (0–100). */
  attackerMoraleEnd?: number;
  defenderMoraleEnd?: number;
  /** Delayed effects (e.g. 截糧 drains) to apply over coming seasons. */
  delayedEffects?: Array<{ kind: 'troop-drain'; targetCityId?: EntityId; seasons: number; perSeason: number }>;
}

export type BattlePhase = 'formation' | 'skirmish' | 'mainEngagement' | 'pursuit';

export interface BattlePhaseLog {
  phase: BattlePhase;
  attackerMorale: number;
  defenderMorale: number;
  /** Short narrative line for the replay. */
  text: string;
}

export interface BattleContext {
  city: City;
  weather?: Weather;
  /** If true, attacker may pursue retreating enemy after win. */
  allowPursuit?: boolean;
}

export function resolveBattle(
  attacker: BattleSide,
  defender: BattleSide,
  cityDefense: number,
  rng: () => number,
  ctx?: BattleContext,
): BattleResult {
  // ── 空城計 Empty-Fort Stratagem ──
  // Defender has almost no troops AND a genius commander; attacker is not a
  // top strategist; flat 55% chance attacker turns back without engaging.
  if (
    defender.troops < 200 &&
    defender.commander.stats.intelligence >= 90 &&
    attacker.commander.stats.intelligence < 90 &&
    attacker.troops > 1500 &&
    rng() < 0.55
  ) {
    return {
      attackerWins: false,
      attackerLosses: 0,
      defenderLosses: 0,
      cityFalls: false,
      aBlended: 0,
      dBlended: 0,
      aPower: 0,
      dPower: 0,
      defenseFactor: 1 + cityDefense / 150,
      aBondBonusAvg: 0,
      dBondBonusAvg: 0,
      duel: undefined,
    };
  }

  // 60% war (raw might) + 40% leadership (cohesion / formation),
  // plus a bond bonus for officers whose family/clan partners fight beside them,
  // plus item effects from all equipped items (weapon + horse + treasure + book),
  // plus skill effects (warBonus / leadershipBonus aggregated per-side).
  const attackerPool = [
    attacker.commander,
    ...(attacker.companions ?? []),
  ];
  const defenderPool = [
    defender.commander,
    ...(defender.companions ?? []),
  ].filter((o) => !!o);

  const aSkillEffects = effectsForSide(attackerPool);
  const dSkillEffects = effectsForSide(defenderPool);

  const blended = (o: Officer, sameSideIds: EntityId[]) => {
    const bond = bondBonus(o.id, sameSideIds);
    let itemWar = 0;
    let itemLead = 0;
    for (const id of Object.values(o.equipment)) {
      const item = id ? ITEMS_BY_ID[id] : null;
      if (!item) continue;
      itemWar += item.effects.war ?? 0;
      itemLead += item.effects.leadership ?? 0;
    }
    // Tactic bonuses — each tactic the officer knows gives a small stat buff.
    const tactics = (o as Officer & { tactics?: string[] }).tactics
      ?? deriveTactics(o.stats, o.id);
    const tb = tacticsTotalBonus(tactics);
    return (
      (o.stats.war + itemWar + bond + tb.war) * 0.6 +
      (o.stats.leadership + itemLead + bond + tb.leadership) * 0.4
    );
  };

  // ── 計策 Stratagem — auto-pick best applicable, roll for success ──
  const stratagemPool = (ctx && defender.commander && ctx.weather)
    ? {
        attacker: attacker.commander,
        defender: defender.commander,
        attackerTroops: attacker.troops,
        defenderTroops: defender.troops,
        city: ctx.city,
        weather: ctx.weather,
        attackerIntelligence: avgInt([attacker.commander, ...(attacker.companions ?? [])]),
        defenderIntelligence: avgInt([defender.commander, ...(defender.companions ?? [])]),
        defenderAvgLoyalty: avgLoyalty([defender.commander, ...(defender.companions ?? [])]),
      }
    : null;
  let stratagemSucceeded = false;
  let stratEffect: StratagemEffect = {};
  let stratagemRecord: BattleResult['stratagem'] = undefined;
  let delayedEffects: BattleResult['delayedEffects'] = undefined;
  if (stratagemPool) {
    const sid: BattleStratagemId | null = pickAutoStratagem(stratagemPool);
    if (sid) {
      const def = STRATAGEM_DEFS[sid];
      stratagemSucceeded = rollStratagemSuccess(def, stratagemPool, rng);
      stratagemRecord = {
        id: def.id,
        name: def.name,
        succeeded: stratagemSucceeded,
      };
      if (stratagemSucceeded) {
        stratEffect = def.successEffect;
        if (stratEffect.delayedDrain) {
          delayedEffects = [{
            kind: 'troop-drain',
            targetCityId: ctx?.city.id,
            seasons: stratEffect.delayedDrain.seasons,
            perSeason: stratEffect.delayedDrain.troopsPerSeason,
          }];
        }
      } else if (def.failurePenalty) {
        stratEffect = {
          attackerPowerMul: def.failurePenalty.attackerPowerMul,
          ownLossMul: def.failurePenalty.ownLossMul,
        };
      }
    }
  }

  // ── Elite troop bonuses (虎豹騎 / 陷陣營 / 白毦 / 藤甲 / 丹陽 / 烏丸) ──
  // Only the commander's elite formation applies (not companions') to model
  // a single elite corps per army.
  const aElite = getEliteTroop(attacker.commander);
  const dElite = defender.commander ? getEliteTroop(defender.commander) : null;
  const aElitePower = aElite?.powerMultiplier ?? 1;
  const dElitePower = dElite?.powerMultiplier ?? 1;
  const aEliteWarBonus = aElite?.warBonus ?? 0;
  const dEliteWarBonus = dElite?.warBonus ?? 0;
  const aEliteOwnLoss = aElite?.ownLossMultiplier ?? 1;
  const dEliteOwnLoss = dElite?.ownLossMultiplier ?? 1;

  const attackerIds = attackerPool.map((o) => o.id);
  const aBaseBlended =
    attackerPool.reduce((s, o) => s + blended(o, attackerIds), 0) /
    attackerPool.length;
  // Skill war/lead bonuses are flat — applied to the blended score after
  // dividing by the pool size (so a 3-officer side doesn't dilute the bonus).
  const aBlended =
    aBaseBlended +
    aSkillEffects.warBonus * 0.6 +
    aSkillEffects.leadershipBonus * 0.4 +
    aEliteWarBonus * 0.6;
  const aBondBonusAvg =
    attackerPool.reduce((s, o) => s + bondBonus(o.id, attackerIds), 0) /
    attackerPool.length;
  const aPower =
    aBlended * Math.sqrt(attacker.troops) * aSkillEffects.powerMultiplier * aElitePower *
    (stratEffect.attackerPowerMul ?? 1);

  const defenderIds = defenderPool.map((o) => o.id);
  const dBaseBlended =
    defenderPool.length > 0
      ? defenderPool.reduce((s, o) => s + blended(o, defenderIds), 0) /
        defenderPool.length
      : 50;
  const dBlended =
    dBaseBlended +
    dSkillEffects.warBonus * 0.6 +
    dSkillEffects.leadershipBonus * 0.4 +
    dEliteWarBonus * 0.6;
  const dBondBonusAvg =
    defenderPool.length > 0
      ? defenderPool.reduce(
          (s, o) => s + bondBonus(o.id, defenderIds),
          0,
        ) / defenderPool.length
      : 0;
  // Wall tier multiplier (1 = 1.0×, 2 = 1.18×, 3 = 1.40×) and siege engine
  // counter-multiplier.
  const wallTier = ctx?.city?.wallTier ?? 1;
  const wallMul = wallTier === 3 ? 1.40 : wallTier === 2 ? 1.18 : 1.0;
  const siegeEngine = ctx ? selectSiegeEngine(attacker, wallTier) : null;
  const siegeMul = siegeEngine?.defenseMultiplier ?? 1;
  const defenseFactor =
    (1 + cityDefense / 150) * dSkillEffects.defenseMultiplier * wallMul * siegeMul;
  const dPower =
    dBlended *
    Math.sqrt(defender.troops + 1) *
    defenseFactor *
    dSkillEffects.powerMultiplier *
    dElitePower *
    (stratEffect.defenderPowerMul ?? 1);

  const total = aPower + dPower || 1;
  const aRatio = aPower / total;
  const dRatio = dPower / total;
  const roll = rng();

  const variance = (rng() - 0.5) * 0.15;
  // Casualties: own losses scale with own's "ownLossMultiplier" (lower=better),
  // plus the enemy's "enemyLossMultiplier" (higher=worse for us).
  const aLossRate = clamp01(
    (dRatio + variance) *
      aSkillEffects.ownLossMultiplier *
      dSkillEffects.enemyLossMultiplier *
      aEliteOwnLoss *
      (stratEffect.ownLossMul ?? 1),
  );
  const dLossRate = clamp01(
    (aRatio - variance) *
      dSkillEffects.ownLossMultiplier *
      aSkillEffects.enemyLossMultiplier *
      dEliteOwnLoss *
      (stratEffect.enemyLossMul ?? 1),
  );

  const attackerLosses = Math.floor(attacker.troops * aLossRate);
  const defenderLosses = Math.floor(defender.troops * dLossRate);

  const attackerSurvivors = attacker.troops - attackerLosses;
  const defenderSurvivors = defender.troops - defenderLosses;

  // Field win condition (stratagem surprise tilts the roll for attacker).
  const surpriseTilt = stratEffect.surpriseRoll ?? 0;
  const attackerWins = roll < aRatio + 0.05 + surpriseTilt;

  // Duel: rare event when both commanders have war ≥ 80.
  let duel: BattleResult['duel'];
  if (
    attacker.commander.stats.war >= 80 &&
    defender.commander.stats.war >= 80 &&
    rng() < 0.18
  ) {
    const aCmd = effectsForOfficer(attacker.commander);
    const dCmd = effectsForOfficer(defender.commander);
    const aWar =
      attacker.commander.stats.war + rng() * 20 + aCmd.duelChanceBonus * 30;
    const dWar =
      defender.commander.stats.war + rng() * 20 + dCmd.duelChanceBonus * 30;
    duel =
      aWar > dWar
        ? { winner: attacker.commander, loser: defender.commander }
        : { winner: defender.commander, loser: attacker.commander };
  }

  // ── Multi-phase morale tracking + rout detection ──
  // Each side starts at 60 + commander leadership/10. Phases shift morale by
  // power-ratio dynamics, stratagem surprise, duel outcomes, and elite presence.
  const phases: BattlePhaseLog[] = [];
  let aMorale = clamp(60 + attacker.commander.stats.leadership / 10, 0, 100);
  let dMorale = defender.commander
    ? clamp(60 + defender.commander.stats.leadership / 10, 0, 100)
    : 30;

  // Phase 1 — Formation (兵陣)
  if (aElite) aMorale += 8;
  if (dElite) dMorale += 8;
  if (stratagemRecord?.succeeded) aMorale += 6;
  phases.push({
    phase: 'formation',
    attackerMorale: Math.round(aMorale),
    defenderMorale: Math.round(dMorale),
    text: stratagemRecord?.succeeded
      ? `布陣完畢 — ${stratagemRecord.name.zh} 之計成`
      : '兩軍布陣，旗鼓相當',
  });

  // Phase 2 — Skirmish (初鋒)
  const skirmishShift = (aRatio - dRatio) * 25 + surpriseTilt * 40;
  aMorale = clamp(aMorale + skirmishShift, 0, 100);
  dMorale = clamp(dMorale - skirmishShift, 0, 100);
  phases.push({
    phase: 'skirmish',
    attackerMorale: Math.round(aMorale),
    defenderMorale: Math.round(dMorale),
    text: skirmishShift > 8
      ? '初鋒已勝 — 攻方氣勢正盛'
      : skirmishShift < -8 ? '初鋒受挫 — 守方反占先機' : '初鋒互有勝負',
  });

  // Phase 3 — Main engagement (主戰)
  const mainShift = (aRatio - dRatio) * 35;
  aMorale = clamp(aMorale + mainShift - 5, 0, 100);
  dMorale = clamp(dMorale - mainShift - 5, 0, 100);
  if (duel) {
    if (duel.winner.id === attacker.commander.id) {
      aMorale = clamp(aMorale + 15, 0, 100);
      dMorale = clamp(dMorale - 20, 0, 100);
    } else {
      aMorale = clamp(aMorale - 20, 0, 100);
      dMorale = clamp(dMorale + 15, 0, 100);
    }
  }
  phases.push({
    phase: 'mainEngagement',
    attackerMorale: Math.round(aMorale),
    defenderMorale: Math.round(dMorale),
    text: duel
      ? `一騎討 — ${duel.winner.name.zh} 斬 ${duel.loser.name.zh}`
      : '主戰膠著 — 殺聲震天',
  });

  // Rout: if morale < 25, that side breaks regardless of casualties.
  let finalAttackerWins = attackerWins;
  let extraDefenderLosses = 0;
  let extraAttackerLosses = 0;
  if (dMorale < 25 && aMorale > 35) {
    finalAttackerWins = true;
    extraDefenderLosses = Math.floor(defenderSurvivors * 0.25);
  } else if (aMorale < 25 && dMorale > 35) {
    finalAttackerWins = false;
    extraAttackerLosses = Math.floor(attackerSurvivors * 0.25);
  }

  // Phase 4 — Pursuit (追擊). Only if attacker won + chose to pursue.
  let pursued = false;
  let captured: EntityId[] = [];
  if (finalAttackerWins && (ctx?.allowPursuit ?? true) && aMorale > 50) {
    pursued = true;
    extraDefenderLosses += Math.floor(defenderSurvivors * 0.15);
    // Capture chance: each enemy commander/companion rolls based on INT diff.
    const allDefenders = [defender.commander, ...(defender.companions ?? [])]
      .filter((o): o is Officer => !!o);
    for (const d of allDefenders) {
      const baseChance = 0.06 +
        Math.max(0, attacker.commander.stats.intelligence - d.stats.intelligence) * 0.003;
      const captureChance = baseChance * (stratEffect.captureBonus ?? 1);
      if (rng() < captureChance) captured.push(d.id);
    }
    phases.push({
      phase: 'pursuit',
      attackerMorale: Math.round(aMorale),
      defenderMorale: Math.round(dMorale),
      text: captured.length > 0
        ? `追撃成功 — 俘獲 ${captured.length} 名將`
        : '追撃 — 餘敵潰逃',
    });
  }

  // Wounded officers: any commander or companion on the losing side has a
  // small chance to be wounded (not killed) instead of just walking off.
  const wounded: Array<{ officerId: EntityId; seasons: number }> = [];
  const losingSide = finalAttackerWins
    ? [defender.commander, ...(defender.companions ?? [])]
    : [attacker.commander, ...(attacker.companions ?? [])];
  for (const o of losingSide) {
    if (!o) continue;
    if (captured.includes(o.id)) continue;
    if (duel?.loser.id === o.id) continue; // duel loser handled by duel record
    if (rng() < 0.18) {
      wounded.push({
        officerId: o.id,
        seasons: 1 + Math.floor(rng() * 3), // 1-3 seasons
      });
    }
  }

  // Final cityFalls accounts for morale-driven rout outcomes.
  const finalDefSurvivors = defenderSurvivors - extraDefenderLosses;
  const finalAttSurvivors = attackerSurvivors - extraAttackerLosses;
  const finalCityFalls = finalAttackerWins && finalAttSurvivors > finalDefSurvivors;

  return {
    attackerWins: finalAttackerWins,
    attackerLosses: attackerLosses + extraAttackerLosses,
    defenderLosses: defenderLosses + extraDefenderLosses,
    cityFalls: finalCityFalls,
    duel,
    aBlended,
    dBlended,
    aPower,
    dPower,
    defenseFactor,
    aBondBonusAvg,
    dBondBonusAvg,
    stratagem: stratagemRecord,
    wounded: wounded.length > 0 ? wounded : undefined,
    captured: captured.length > 0 ? captured : undefined,
    pursued,
    phases,
    attackerMoraleEnd: Math.round(aMorale),
    defenderMoraleEnd: Math.round(dMorale),
    delayedEffects,
  };
}

function avgInt(officers: Array<Officer | undefined>): number {
  const live = officers.filter((o): o is Officer => !!o);
  if (live.length === 0) return 50;
  return live.reduce((s, o) => s + o.stats.intelligence, 0) / live.length;
}

function avgLoyalty(officers: Array<Officer | undefined>): number {
  const live = officers.filter((o): o is Officer => !!o);
  if (live.length === 0) return 50;
  return live.reduce((s, o) => s + (o.loyalty ?? 50), 0) / live.length;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Returns a stat bonus for `officerId` when allied bonded partners are
 * fighting beside them. Counted: clan oath bonds (+5 each) and personal
 * relationships — sworn-brothers (+7), master-servant (+5), romantic (+4),
 * mentor-student (+3). Rivals/enemies on the SAME side actually subtract
 * (-3 / -5) because the historical pair would feud in council. Capped at
 * +20 / -10.
 */
function bondBonus(officerId: EntityId, sameSideIds: EntityId[]): number {
  const set = new Set(sameSideIds);
  set.delete(officerId);
  if (set.size === 0) return 0;
  let bonus = 0;
  for (const b of OATH_BONDS) {
    if (b.officerA === officerId && set.has(b.officerB)) bonus += 5;
    else if (b.officerB === officerId && set.has(b.officerA)) bonus += 5;
  }
  for (const r of OFFICER_RELATIONSHIPS) {
    const otherId =
      r.a === officerId ? r.b : r.b === officerId ? r.a : null;
    if (!otherId || !set.has(otherId)) continue;
    switch (r.kind) {
      case 'sworn-brothers': bonus += 7; break;
      case 'master-servant': bonus += 5; break;
      case 'romantic':       bonus += 4; break;
      case 'mentor-student': bonus += 3; break;
      case 'rival':          bonus -= 3; break;
      case 'enemy':          bonus -= 5; break;
    }
  }
  return Math.max(-10, Math.min(20, bonus));
}

export interface MarchContext {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  rng: () => number;
  /** Current weather — enables stratagem auto-selection. */
  weather?: Weather;
  /** Delayed effects accumulator (e.g. 截糧 troop drains). */
  delayedEffectsOut?: Array<{ targetCityId?: EntityId; seasons: number; perSeason: number }>;
}

export interface MarchOutcome {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
}

export function handleMarch(
  cmd: MarchCommand,
  ctx: MarchContext,
): MarchOutcome {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const entries: ReportEntry[] = [];

  const source = cities[cmd.cityId];
  const target = cities[cmd.targetCityId];
  const commander = officers[cmd.officerId];
  if (!source || !target || !commander) {
    return { cities, officers, entries };
  }

  // Deduct troops from source.
  const sentTroops = Math.min(source.troops, cmd.troops);
  cities[source.id] = { ...source, troops: source.troops - sentTroops };

  // Friendly transfer: same owner — commander and any companions move too.
  const transferCompanions: Officer[] = (cmd.additionalOfficerIds ?? [])
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o);
  if (target.ownerForceId === source.ownerForceId) {
    cities[target.id] = { ...target, troops: target.troops + sentTroops };
    officers[commander.id] = {
      ...commander,
      locationCityId: target.id,
      task: null,
    };
    for (const co of transferCompanions) {
      officers[co.id] = { ...co, locationCityId: target.id, task: null };
    }
    const coNames = transferCompanions.length > 0
      ? ` with ${transferCompanions.map((o) => o.name.en).join(', ')}`
      : '';
    entries.push({
      cityId: target.id,
      kind: 'march',
      text: `${commander.name.en}${coNames} transferred ${sentTroops.toLocaleString()} troops from ${source.name.en} to ${target.name.en}.`,
    });
    return { cities, officers, entries };
  }

  // Combat.
  const defenderOfficers = Object.values(officers).filter(
    (o) =>
      o.locationCityId === target.id &&
      o.forceId === target.ownerForceId &&
      o.status === 'idle',
  );
  const defenderCommander =
    defenderOfficers.sort((a, b) => b.stats.war - a.stats.war)[0] ??
    fallbackCommander(target);

  // Gather marching companions (multi-officer armies).
  const companions: Officer[] = (cmd.additionalOfficerIds ?? [])
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o);

  const result = resolveBattle(
    { troops: sentTroops, commander, companions },
    {
      troops: target.troops,
      commander: defenderCommander,
      companions: defenderOfficers,
    },
    target.defense,
    ctx.rng,
    { city: target, weather: ctx.weather, allowPursuit: true },
  );

  // Wounded officers: apply 'wounded' status with recovery countdown.
  if (result.wounded) {
    for (const w of result.wounded) {
      const o = officers[w.officerId];
      if (!o || o.status === 'dead') continue;
      officers[w.officerId] = {
        ...o,
        status: 'wounded',
        task: null,
        woundedSeasons: w.seasons,
      };
    }
  }

  // Captured officers: become imprisoned by attacker's force (loyalty wiped).
  if (result.captured) {
    for (const id of result.captured) {
      const o = officers[id];
      if (!o || o.status === 'dead') continue;
      officers[id] = {
        ...o,
        status: 'imprisoned',
        forceId: null,
        loyalty: 30,
        task: null,
      };
    }
  }

  // Delayed effects (截糧 drain): accumulate to caller.
  if (result.delayedEffects && ctx.delayedEffectsOut) {
    for (const e of result.delayedEffects) {
      ctx.delayedEffectsOut.push({
        targetCityId: e.targetCityId,
        seasons: e.seasons,
        perSeason: e.perSeason,
      });
    }
  }

  // Stratagem narrative entry.
  if (result.stratagem) {
    entries.push({
      cityId: target.id,
      kind: 'note',
      text: result.stratagem.succeeded
        ? `${result.stratagem.name.zh} 之計成功 — 攻方 ${commander.name.zh} 用計奏效`
        : `${result.stratagem.name.zh} 之計失敗 — 反受其害`,
    });
  }

  if (result.duel) {
    entries.push({
      cityId: target.id,
      kind: 'battle',
      text: `Duel! ${result.duel.winner.name.en} slew ${result.duel.loser.name.en} on the field.`,
    });
    officers[result.duel.loser.id] = {
      ...officers[result.duel.loser.id],
      status: 'dead',
      forceId: null,
      task: null,
    };
  }

  const attackerSurvivors = sentTroops - result.attackerLosses;
  const defenderSurvivors = Math.max(
    0,
    target.troops - result.defenderLosses,
  );

  const attackerNames = [commander, ...companions]
    .map((o) => o.name.en)
    .join(' + ');
  const defenderNames = [defenderCommander, ...defenderOfficers.filter((o) => o.id !== defenderCommander.id)]
    .slice(0, 4)
    .map((o) => o.name.en)
    .join(' + ');

  const battleDetail: BattleDetail = {
    cityId: target.id,
    attacker: {
      forceId: source.ownerForceId,
      commanderId: commander.id,
      companionIds: companions.map((o) => o.id),
      troops: sentTroops,
      bondBonus: Math.round(result.aBondBonusAvg * 10) / 10,
      blendedStat: Math.round(result.aBlended * 10) / 10,
      power: Math.round(result.aPower),
    },
    defender: {
      forceId: target.ownerForceId,
      commanderId: defenderCommander.id,
      companionIds: defenderOfficers
        .filter((o) => o.id !== defenderCommander.id)
        .map((o) => o.id),
      troops: target.troops,
      bondBonus: Math.round(result.dBondBonusAvg * 10) / 10,
      blendedStat: Math.round(result.dBlended * 10) / 10,
      power: Math.round(result.dPower),
    },
    cityDefense: target.defense,
    defenseFactor: Math.round(result.defenseFactor * 100) / 100,
    attackerWins: result.attackerWins,
    cityFalls: result.cityFalls,
    attackerLosses: result.attackerLosses,
    defenderLosses: result.defenderLosses,
    duelWinnerId: result.duel?.winner.id,
    duelLoserId: result.duel?.loser.id,
    phases: result.phases?.map((p) => ({
      phase: p.phase,
      attackerMorale: p.attackerMorale,
      defenderMorale: p.defenderMorale,
      text: p.text,
    })),
    stratagem: result.stratagem
      ? {
          id: result.stratagem.id,
          nameZh: result.stratagem.name.zh,
          nameEn: result.stratagem.name.en,
          succeeded: result.stratagem.succeeded,
        }
      : undefined,
    attackerMoraleEnd: result.attackerMoraleEnd,
    defenderMoraleEnd: result.defenderMoraleEnd,
    woundedIds: result.wounded?.map((w) => w.officerId),
    capturedIds: result.captured,
    pursued: result.pursued,
  };

  entries.push({
    cityId: target.id,
    kind: 'battle',
    text:
      `Battle at ${target.name.en}: ${attackerNames} (${sentTroops.toLocaleString()}) vs ` +
      `${defenderNames} (${target.troops.toLocaleString()}). ` +
      `Casualties — atk ${result.attackerLosses.toLocaleString()}, def ${result.defenderLosses.toLocaleString()}. ` +
      `[Click for breakdown]`,
    battle: battleDetail,
  });

  // Helper: reset task + optionally move companions
  const finalizeCompanions = (newLocation: EntityId | null) => {
    for (const co of companions) {
      const cur = officers[co.id];
      if (!cur || cur.status === 'dead') continue;
      officers[co.id] = {
        ...cur,
        task: null,
        locationCityId: newLocation ?? cur.locationCityId,
      };
    }
  };

  if (result.cityFalls) {
    // Conquest. Commander + companions all move to target.
    cities[target.id] = {
      ...cities[target.id],
      ownerForceId: source.ownerForceId,
      troops: attackerSurvivors,
      loyalty: Math.max(20, Math.floor(target.loyalty * 0.5)),
    };
    officers[commander.id] = {
      ...commander,
      locationCityId: target.id,
      task: null,
    };
    finalizeCompanions(target.id);
    // Capture surviving defender officers (if not killed in duel).
    for (const def of defenderOfficers) {
      if (def.status === 'dead') continue;
      officers[def.id] = {
        ...officers[def.id],
        status: 'imprisoned',
        forceId: null,
        task: null,
      };
    }
    const coNames = companions.length > 0
      ? ` with ${companions.map((o) => o.name.en).join(', ')}`
      : '';
    entries.push({
      cityId: target.id,
      kind: 'conquest',
      text: `${target.name.en} has fallen! ${commander.name.en}${coNames} occupies the city.`,
    });
  } else if (result.attackerWins) {
    // Won field but didn't take city — survivors return.
    cities[source.id] = {
      ...cities[source.id],
      troops: cities[source.id].troops + attackerSurvivors,
    };
    cities[target.id] = { ...target, troops: defenderSurvivors };
    officers[commander.id] = { ...commander, task: null };
    finalizeCompanions(source.id);
    entries.push({
      cityId: target.id,
      kind: 'battle',
      text: `${commander.name.en} won the field but could not breach ${target.name.en}. Survivors returned.`,
    });
  } else {
    // Repulsed.
    cities[source.id] = {
      ...cities[source.id],
      troops: cities[source.id].troops + attackerSurvivors,
    };
    cities[target.id] = { ...target, troops: defenderSurvivors };
    officers[commander.id] = { ...commander, task: null };
    finalizeCompanions(source.id);
    entries.push({
      cityId: target.id,
      kind: 'defeat',
      text: `${commander.name.en} was repulsed at ${target.name.en}. ${attackerSurvivors.toLocaleString()} troops returned.`,
    });
  }

  return { cities, officers, entries };
}

// Fallback "garrison commander" when target has no officers stationed.
function fallbackCommander(city: City): Officer {
  return {
    id: `garrison-${city.id}`,
    name: { en: `${city.name.en} Garrison`, zh: `${city.name.zh}守備` },
    birthYear: 0,
    stats: { leadership: 40, war: 40, intelligence: 40, politics: 40, charisma: 40 },
    loyalty: 100,
    locationCityId: city.id,
    forceId: city.ownerForceId,
    status: 'idle',
    task: null,
    equipment: [],
    skills: [],
    rank: 'soldier',
  };
}
