import type {
  BattleDetail,
  Building,
  City,
  EntityId,
  MarchCommand,
  Officer,
  ReportEntry,
  Skill,
} from '../types';
import { buildingBonuses } from './buildings';
import { conquestPopulationLoss } from './cityRuin';
import { OATH_BONDS } from '../data/bonds';
import { liveItemById } from '../data/items';
import { OFFICER_RELATIONSHIPS } from '../data/relationships';
import { SKILLS_BY_ID } from '../data/skills';
import { getEliteTroop } from '../data/eliteTroops';
import { deriveTactics, tacticsTotalBonus, combosPowerMultiplier, findActiveCombos } from '../data/officerAttributes';
import { combatModifiers, conquestLoyaltyMod, combatRoleFit, type CombatMods } from './traitEffects';
import { describeBattleSite, isRiverside } from '../data/geography';
import { cityPos } from '../data/cityGeo';
import { sidePoolRelationshipBonus, rivalShowdownMultiplier, parentsOf, childrenOf, spousesOf, siblingsOf, allSwornBrothersOf, swornAcrossLinesPenalty, areSwornBrothers } from './relationshipEffects';
import { effectivePrestigeEffects } from '../data/prestige';
import { honorificEffects, honorificById } from '../data/honorifics';
import { gradeAuraPowerMul, gradeAuraMorale, itemMasteryMul, enemyMoraleShock, holdsTheLine } from './gradeCombat';
import { growthPowerMul } from './growth';
import { arrivalFatigueMorale } from './marchPace';
import { itemSetBonuses } from '../data/itemSets';
import { selectSiegeEngine } from '../data/siegeEngines';
import {
  STRATAGEM_DEFS,
  pickAutoStratagem,
  rollStratagemSuccess,
  DEFENSIVE_SCHEMES,
  mirrorDefenderEffect,
  type BattleStratagemId,
  type StratagemEffect,
} from '../data/stratagems2';
import { combatPolicyEffects, cityPolicyEffects } from './policyEffects';
import { appointmentBonusFor } from './appointmentEffects';
import { aggregateSlotEffects } from '../data/defenseBuildings';
import type { Weather } from './weather';

/**
 * 甲冑防護 — sum the (live) defensive weight of every armor piece worn across a
 * side, and turn it into an own-casualty multiplier (<1). Each armor item's
 * leadership (+ half its war) counts as protection; the effect diminishes and
 * caps at −25% losses, so stacking armor helps but never makes a side immortal.
 */
function armorMitigationMul(pool: Array<Officer | null | undefined>): number {
  let def = 0;
  for (const o of pool) {
    if (!o) continue;
    for (const id of Object.values(o.equipment)) {
      const it = id ? liveItemById(id) : null;
      if (it && it.kind === 'armor') {
        def += (it.effects.leadership ?? 0) + Math.max(0, it.effects.war ?? 0) * 0.5;
      }
    }
  }
  return 1 - Math.min(0.25, def / 240);
}

/**
 * Classify a city's battlefield terrain. Prefers the authored `city.terrain`
 * field (every city carries one) and only falls back to name-keyword inference
 * for the rare city that lacks it — replacing the old name-only guesswork.
 */
export function cityCombatTerrain(city?: City): 'naval' | 'river' | 'mountain' | 'plain' {
  if (city?.terrain) {
    switch (city.terrain) {
      case 'water':    return 'river';
      case 'wetland':  return 'river';
      case 'mountain': return 'mountain';
      case 'forest':   return 'mountain';
      case 'pass':     return 'mountain';
      default:         return 'plain'; // plain, desert
    }
  }
  const cityName = city?.name.en.toLowerCase() ?? '';
  if (/jiang|river|chibi|red cliff|fan|jianye|wu|huai|han.river/.test(cityName)) return 'river';
  if (/shu|mt\.|mountain|hanzhong|jianmen|kuiguan|baidi/.test(cityName)) return 'mountain';
  return 'plain';
}

/**
 * Inherent defender power multiplier from the city's own ground — independent
 * of any defence buildings. Mountain holds and passes are murder to storm;
 * forest and marsh foul an attacker's footing; open plains and water give the
 * defender nothing extra. This is what makes a 山城 worth holding.
 */
export function terrainDefenderMultiplier(city?: City): number {
  switch (city?.terrain) {
    case 'pass':     return 1.15; // 關隘 — a handful can hold a chokepoint
    case 'mountain': return 1.12; // 山城 — high walls, hard climbs
    case 'forest':   return 1.06; // 山林 — broken ground, ambush cover
    case 'wetland':  return 1.05; // 湿地 — bogs down the assault
    default:         return 1.0;  // plain / water / desert
  }
}

/** Helper: compute combat-context policy effects for a side. */
function computePolicyCombat(
  officers: Officer[],
  ctx?: { city?: City; weather?: Weather },
) {
  const terrain = cityCombatTerrain(ctx?.city);
  return combatPolicyEffects(officers, { terrain, weather: ctx?.weather as string | undefined });
}

/** A water battle: a riverine/coastal/wetland city, or a port. */
function isWaterBattle(ctx?: { city?: City }): boolean {
  const c = ctx?.city;
  if (!c) return false;
  if (c.terrain === 'water' || c.terrain === 'wetland' || c.port) return true;
  const name = c.name.en.toLowerCase();
  return /jiang|river|chibi|red cliff|fan|jianye|\bwu\b|huai|han.river|lake|\bsea\b|bay/.test(name);
}

/**
 * Naval prowess multiplier. On a water battle a side rich in 水軍 specialists
 * (navy-master) presses its advantage — +8% per such officer, capped at +24%
 * — mirroring the river dominance ships enjoy in the hex tactical battle. On
 * land it has no effect.
 */
function navalProwessMul(pool: Officer[], ctx?: { city?: City }): number {
  if (!isWaterBattle(ctx)) return 1;
  const navy = pool.filter((o) => o.skills.includes('navy-master')).length;
  return navy === 0 ? 1 : 1 + Math.min(0.24, 0.08 * navy);
}

/**
 * 私兵 / 部曲 — a side's pooled personal-guard corps lends its commanders'
 * household troops to the fight. +1% power per 1,000 私兵 across the side,
 * capped at +18% so a guard-heavy general hits notably harder on attack or
 * defence without dwarfing troop counts.
 */
export function privateGuardMultiplier(pool: Officer[]): number {
  const total = pool.reduce((s, o) => s + Math.max(0, o.privateTroops ?? 0), 0);
  if (total <= 0) return 1;
  return 1 + Math.min(0.18, total / 100_000);
}

/**
 * 異域義從 — foreign auxiliaries (象兵/突騎/汗血騎) garrisoned by 遠使 embassies
 * fight above their numbers when their host city is defended. +1% defence power
 * per 1,330 aux, capped at +15% — elite quality layered on the raw troop count
 * they already add. (See City.foreignAux, systems/foreignRealm.ts.)
 */
export function foreignAuxDefenseMultiplier(aux: number | undefined): number {
  const a = Math.max(0, aux ?? 0);
  if (a <= 0) return 1;
  return 1 + Math.min(0.15, a / 20_000);
}

/**
 * 練度 — a well-drilled garrison holds the walls harder. The 練兵 command and
 * 演習 sparring build City.drill (0–100); each point adds 0.25% defensive power,
 * up to +25% at full drill. Raw levies (drill 0) fight at face value.
 */
export function cityDrillDefenseMultiplier(drill: number | undefined): number {
  const d = Math.max(0, Math.min(100, drill ?? 0));
  if (d <= 0) return 1;
  return 1 + d * 0.0025;
}

/**
 * 練度減損 — a well-drilled garrison also dies less: disciplined ranks hold
 * formation and take fewer casualties. Cuts defender losses up to −15% at full
 * drill. Multiplies the defender's own-loss rate (so < 1 means fewer losses).
 */
export function cityDrillLossMultiplier(drill: number | undefined): number {
  const d = Math.max(0, Math.min(100, drill ?? 0));
  if (d <= 0) return 1;
  return 1 - d * 0.0015;
}

/**
 * 威名 — a side's pooled prestige (虎將/名將/王佐 …) sharpens its battle power.
 * Uses the strongest single title's combatPowerMul rather than stacking, so a
 * roster of famous names reads as "led by a legend", capped near +12%.
 */
export function prestigeCombatMultiplier(pool: Officer[]): number {
  let best = 1;
  for (const o of pool) {
    // A title's combat heft OR a conferred 名號將軍 perk, whichever is higher.
    best = Math.max(best, effectivePrestigeEffects(o).combatPowerMul, honorificEffects(o).combatPowerMul);
  }
  return Math.min(1.12, best);
}

/**
 * 名號各司其職 — a held 名號將軍 lends a SITUATIONAL edge when the battle matches
 * its theme: 水戰 on water; 攻城/平叛/征討 when assaulting a city; 鎮撫 when
 * defending one's own walls; 武勇/平叛/征討 in an open field clash. Best single
 * match per side, +4% base +1%/tier, capped at +10%. Pure.
 */
export function honorificThemeMul(
  pool: Officer[],
  ctx: { water: boolean; siege: boolean; defending: boolean },
): number {
  let best = 1;
  for (const o of pool) {
    const h = honorificById(o.honorificId);
    if (!h) continue;
    const matches = ctx.water
      ? h.theme === 'naval'
      : ctx.siege
        ? (ctx.defending ? h.theme === 'steward' : (h.theme === 'siege' || h.theme === 'rebel' || h.theme === 'frontier'))
        : (h.theme === 'valor' || h.theme === 'rebel' || h.theme === 'frontier');
    if (matches) best = Math.max(best, 1 + 0.04 + (h.tier - 1) * 0.01);
  }
  return Math.min(1.10, best);
}

/**
 * Resolve a city's conditional defence-building effects for one siege. These
 * fields used to be aggregated and shown in the UI but never applied:
 *  - navalDefense (鐵索): +defence, water sieges only.
 *  - extraGarrison (兵舍): standing defenders added to the city's troops.
 *  - mountainBonus (城防/落石): +defender power, mountain terrain only.
 *  - cavalryPenalty (拒馬): −attacker power vs a cavalry-led assault.
 */
export function siegeBuildingModifiers(
  slotEffects: ReturnType<typeof aggregateSlotEffects>,
  opts: { water: boolean; mountain: boolean; attackerCavalry: boolean },
): { defenseBonus: number; garrisonBonus: number; defenderPowerMul: number; attackerPowerMul: number } {
  return {
    defenseBonus: opts.water ? slotEffects.navalDefense : 0,
    garrisonBonus: slotEffects.extraGarrison,
    defenderPowerMul: opts.mountain ? 1 + slotEffects.mountainBonus : 1,
    attackerPowerMul: opts.attackerCavalry ? Math.max(0.5, 1 - slotEffects.cavalryPenalty) : 1,
  };
}

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
function effectsForOfficer(o: Officer, isWater = false): AggregatedSkillEffects {
  const out: AggregatedSkillEffects = { ...ZERO_EFFECTS };
  for (const sid of o.skills) {
    // 水軍 (navy-master) only musters its bonus on the water — on land it's inert.
    if (sid === 'navy-master' && !isWater) continue;
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
function effectsForSide(pool: Officer[], isWater = false): AggregatedSkillEffects {
  const out: AggregatedSkillEffects = { ...ZERO_EFFECTS };
  for (const o of pool) {
    const e = effectsForOfficer(o, isWater);
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
  /** Stratagem deployed by the attacker (if any). `seenThrough` = a wise
   *  defender 看破'd it (it failed AND the defender turned it back). */
  stratagem?: { id: string; name: { zh: string; en: string }; succeeded: boolean; seenThrough?: boolean };
  /** 連環計 — a second scheme the attacker chained on (智 ≥ 90), e.g. 連環+火攻. */
  stratagemChain?: { id: string; name: { zh: string; en: string }; succeeded: boolean };
  /** 守城之計 — the besieged marshal's own counter-scheme (鐵壁/以逸待勞/反間…). */
  defenderStratagem?: { id: string; name: { zh: string; en: string }; succeeded: boolean; seenThrough?: boolean };
  /** Wounded officers (one or both sides) — recoverable after N seasons. */
  wounded?: Array<{ officerId: EntityId; seasons: number; severity: 'minor' | 'serious' | 'critical' }>;
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
  /** Multiplier on attacker damage from city defensive structures (烽火台 etc.). <1 = attacker hits softer. */
  attackerDamageMul?: number;
  /** Runtime family relations — used for relationship combat bonuses. */
  family?: import('../types/family').FamilyRelation[];
  /** Runtime oath bonds (義兄弟 結拜 / rapport) — sworn-brother combat synergy. */
  runtimeBonds?: import('../data/bonds').OathBond[];
  /** Pairwise officer rapport (好感, −100..100) — graded same-side synergy/friction. */
  rapport?: Record<string, number>;
  /** Civic-title power multipliers per side (軍師/太尉/丞相 etc.). */
  attackerTitlePowerMul?: number;
  defenderTitlePowerMul?: number;
  /** 討伐令 casus-belli combat bonus — attacker gets +10% when its force
   *  has denounced the defender's force (within the 8-season window). */
  attackerCasusBelliMul?: number;
  defenderCasusBelliMul?: number;
  /** 單挑頻率 — multiplier on the field-duel trigger chance. Default 1. */
  duelChanceMul?: number;
  /** 疲勞 — points the attacker's opening morale is docked by (a forced-marched
   *  column arrives weary, 以逸待勞). Default 0. */
  attackerMoraleMod?: number;
  /** 軍師獻策 — a player-chosen scheme to deploy instead of the auto-pick. Only
   *  honoured if its INT gate + conditions are met, else falls back to auto. */
  forcedStratagem?: string;
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

  const water = isWaterBattle(ctx);
  const aSkillEffects = effectsForSide(attackerPool, water);
  const dSkillEffects = effectsForSide(defenderPool, water);

  const blended = (o: Officer, sameSideIds: EntityId[]) => {
    const bond = bondBonus(o.id, sameSideIds);
    let itemWar = 0;
    let itemLead = 0;
    for (const id of Object.values(o.equipment)) {
      const item = id ? liveItemById(id) : null;
      if (!item) continue;
      // 武器主攻、甲冑主守 — armor's value is its 減傷 (armorMitigationMul), NOT
      // raw power, so it does not feed the offensive blend (no double-dip).
      if (item.kind === 'armor') continue;
      // 兵器駕馭 — an under-grade wielder doesn't get the full effect. The item
      // is resolved live so 精煉 boosts (and any rarity promotion) count here.
      const mastery = itemMasteryMul(o, item);
      itemWar += (item.effects.war ?? 0) * mastery;
      itemLead += (item.effects.leadership ?? 0) * mastery;
    }
    // Tactic bonuses — each tactic the officer knows gives a small stat buff.
    const tactics = (o as Officer & { tactics?: string[] }).tactics
      ?? deriveTactics(o.stats, o.id);
    const tb = tacticsTotalBonus(tactics);
    // 歷練之威 — a seasoned officer's experience lifts their whole contribution.
    return (
      (o.stats.war + itemWar + bond + tb.war) * 0.6 +
      (o.stats.leadership + itemLead + bond + tb.leadership) * 0.4
    ) * growthPowerMul(o);
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
  let stratEffect: StratagemEffect = {};
  let stratagemRecord: BattleResult['stratagem'] = undefined;
  let stratagemChainRecord: BattleResult['stratagemChain'] = undefined;
  let defenderStratagemRecord: BattleResult['defenderStratagem'] = undefined;
  let delayedEffects: BattleResult['delayedEffects'] = undefined;
  // Merge a fresh StratagemEffect into the running one (multiplying the muls).
  const fold = (into: StratagemEffect, e: StratagemEffect): StratagemEffect => ({
    attackerPowerMul: (into.attackerPowerMul ?? 1) * (e.attackerPowerMul ?? 1),
    defenderPowerMul: (into.defenderPowerMul ?? 1) * (e.defenderPowerMul ?? 1),
    ownLossMul: (into.ownLossMul ?? 1) * (e.ownLossMul ?? 1),
    enemyLossMul: (into.enemyLossMul ?? 1) * (e.enemyLossMul ?? 1),
    surpriseRoll: (into.surpriseRoll ?? 0) + (e.surpriseRoll ?? 0),
    // captureBonus is consumed as a MULTIPLIER (?? 1) downstream — keep it so.
    captureBonus: (into.captureBonus ?? 1) * (e.captureBonus ?? 1),
    delayedDrain: e.delayedDrain ?? into.delayedDrain,
  });
  if (stratagemPool) {
    // 看破 — a wise / precognitive defender sees through the attacker's plot,
    // foiling it outright (and turning it back). A keen mind reads a ruse even
    // at parity (base 7%), and the edge climbs sharply with the INT gap.
    const dTraits = (defender.commander?.traits ?? []) as string[];
    const seerEdge = (stratagemPool.defenderIntelligence - stratagemPool.attackerIntelligence + 5) / 70
      + (dTraits.includes('precognitive') ? 0.20 : 0)
      + (dTraits.some((t) => t === 'crouching-dragon' || t === 'young-phoenix' || t === 'celestial-tactician') ? 0.12 : 0);

    // ── Attacker's scheme (may be chained at 智 ≥ 90 — 連環計) ──
    // 軍師獻策 — honour the player's chosen scheme if it's gated & applicable,
    // else the marshal's auto-pick.
    const forced = ctx?.forcedStratagem as BattleStratagemId | undefined;
    const forcedOk = forced && STRATAGEM_DEFS[forced]
      && stratagemPool.attackerIntelligence >= STRATAGEM_DEFS[forced].minIntelligence
      && STRATAGEM_DEFS[forced].isApplicable(stratagemPool);
    const sid = forcedOk ? forced! : pickAutoStratagem(stratagemPool);
    if (sid) {
      const def = STRATAGEM_DEFS[sid];
      const seenThrough = rng() < Math.max(0, Math.min(0.6, seerEdge));
      const ok = !seenThrough && rollStratagemSuccess(def, stratagemPool, rng);
      stratagemRecord = { id: def.id, name: def.name, succeeded: ok, seenThrough };
      // 將計就計 — a plot seen through is turned back on its author.
      if (seenThrough) stratEffect = fold(stratEffect, { defenderPowerMul: 1.08, ownLossMul: 1.12 });
      if (ok) {
        stratEffect = fold(stratEffect, def.successEffect);
        // 計謀條件深化 — a scheme bites deeper against the right mark: 美人計 on a
        // 好色 commander, 反間/美人計 on a low-loyalty host (人心已散).
        if (def.id === 'beauty-plot' && dTraits.includes('lustful')) stratEffect = fold(stratEffect, { defenderPowerMul: 0.85, captureBonus: 1.25 });
        if ((def.id === 'sow-discord' || def.id === 'beauty-plot') && stratagemPool.defenderAvgLoyalty < 50) stratEffect = fold(stratEffect, { defenderPowerMul: 0.90 });
        if (def.successEffect.delayedDrain) {
          delayedEffects = [{ kind: 'troop-drain', targetCityId: ctx?.city.id, seasons: def.successEffect.delayedDrain.seasons, perSeason: def.successEffect.delayedDrain.troopsPerSeason }];
        }
      } else if (def.failurePenalty) {
        stratEffect = fold(stratEffect, { attackerPowerMul: def.failurePenalty.attackerPowerMul, ownLossMul: def.failurePenalty.ownLossMul });
      }
      // 連環計 — a master (智 ≥ 90) links a second scheme onto the first. 計多必失:
      // piling a second ruse on is far easier to read (+0.22 看破), so chaining
      // against a wise foe courts a double backfire — power, not a free win.
      if (stratagemPool.attackerIntelligence >= 90) {
        const sid2 = pickAutoStratagem(stratagemPool, { exclude: new Set([sid]) });
        if (sid2) {
          const def2 = STRATAGEM_DEFS[sid2];
          const seen2 = rng() < Math.max(0, Math.min(0.7, seerEdge + 0.22));
          const ok2 = !seen2 && rollStratagemSuccess(def2, stratagemPool, rng);
          stratagemChainRecord = { id: def2.id, name: def2.name, succeeded: ok2 };
          if (ok2) stratEffect = fold(stratEffect, def2.successEffect);
          else if (seen2) stratEffect = fold(stratEffect, { defenderPowerMul: 1.06, ownLossMul: 1.10 }); // 連環見破,反受其累
        }
      }
    }

    // ── Defender's counter-scheme (鐵壁/以逸待勞/反間…), mirrored semantics ──
    const dPool: typeof stratagemPool = {
      ...stratagemPool,
      attacker: stratagemPool.defender!, defender: stratagemPool.attacker,
      attackerTroops: stratagemPool.defenderTroops, defenderTroops: stratagemPool.attackerTroops,
      attackerIntelligence: stratagemPool.defenderIntelligence, defenderIntelligence: stratagemPool.attackerIntelligence,
    };
    const dsid = pickAutoStratagem(dPool, { only: DEFENSIVE_SCHEMES });
    if (dsid) {
      const ddef = STRATAGEM_DEFS[dsid];
      // The attacker's own wits may see through the defence in turn.
      const aSees = (stratagemPool.attackerIntelligence - stratagemPool.defenderIntelligence) / 220;
      const dSeen = rng() < Math.max(0, Math.min(0.4, aSees));
      const dok = !dSeen && rollStratagemSuccess(ddef, dPool, rng);
      defenderStratagemRecord = { id: ddef.id, name: ddef.name, succeeded: dok, seenThrough: dSeen };
      if (dok) stratEffect = fold(stratEffect, mirrorDefenderEffect(ddef.successEffect));
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
  // ── Policy effects (per side) — military-theory, horse-armor, etc.
  const aPolicy = computePolicyCombat(attackerPool, ctx);
  const dPolicy = computePolicyCombat(defenderPool, ctx);
  // ── T4 — Trait combat modifiers (averaged across each side's pool) ──
  const isSiegeBattle = !!ctx?.city;
  const aOutnumbered = attacker.troops < defender.troops * 0.75;
  const dOutnumbered = defender.troops < attacker.troops * 0.75;
  const weatherBad = ctx?.weather ? ctx.weather.kind !== 'clear' : false;
  const aggregateMods = (pool: Officer[], isAtk: boolean, outnum: boolean): CombatMods => {
    if (pool.length === 0) return { attackMul: 1, defenseMul: 1, moraleResist: 0, routResist: 0, lossMul: 1 };
    const accum: CombatMods = { attackMul: 1, defenseMul: 1, moraleResist: 0, routResist: 0, lossMul: 1 };
    for (const o of pool) {
      const m = combatModifiers(o, {
        isAttacker: isAtk,
        isSiege: isSiegeBattle,
        isDefendingHomeCity: !isAtk && isSiegeBattle,
        outnumbered: outnum,
        weatherBad,
      });
      accum.attackMul *= m.attackMul;
      accum.defenseMul *= m.defenseMul;
      accum.moraleResist += m.moraleResist;
      accum.routResist += m.routResist;
      accum.lossMul *= m.lossMul;
    }
    // Compress multiplicative stacks so 4 ironhearted officers don't push numbers to insanity.
    const compress = (v: number) => 1 + (v - 1) * 0.7;
    accum.attackMul = compress(accum.attackMul);
    accum.defenseMul = compress(accum.defenseMul);
    accum.lossMul = compress(accum.lossMul);
    return accum;
  };
  const aTraitMods = aggregateMods(attackerPool, true, aOutnumbered);
  const dTraitMods = aggregateMods(defenderPool, false, dOutnumbered);

  // ── T8 — Tactic combos: collect each side's pooled tactics ──
  const aPooledTactics: string[] = [];
  for (const o of attackerPool) {
    aPooledTactics.push(...(((o as Officer & { tactics?: string[] }).tactics) ?? deriveTactics(o.stats, o.id)));
  }
  const dPooledTactics: string[] = [];
  for (const o of defenderPool) {
    dPooledTactics.push(...(((o as Officer & { tactics?: string[] }).tactics) ?? deriveTactics(o.stats, o.id)));
  }
  const aComboMul = combosPowerMultiplier(aPooledTactics);
  const dComboMul = combosPowerMultiplier(dPooledTactics);

  // R1 — Relationship bonuses
  const family = ctx?.family ?? [];
  const bonds = ctx?.runtimeBonds ?? [];
  const rapport = ctx?.rapport ?? {};
  const aRelBonus = sidePoolRelationshipBonus(attackerPool, family, bonds, rapport);
  const dRelBonus = sidePoolRelationshipBonus(defenderPool, family, bonds, rapport);
  // Rival showdown (commanders are rivals) — both sides get an attack boost
  const rivalMul = rivalShowdownMultiplier(attacker.commander, defender.commander);

  const aTitlePowerMul = ctx?.attackerTitlePowerMul ?? 1;
  const dTitlePowerMul = ctx?.defenderTitlePowerMul ?? 1;
  const aCasusMul = ctx?.attackerCasusBelliMul ?? 1;
  const dCasusMul = ctx?.defenderCasusBelliMul ?? 1;
  // 水戰 — navy specialists dominate a river/coastal engagement.
  const aNavalMul = navalProwessMul(attackerPool, ctx);
  const dNavalMul = navalProwessMul(defenderPool, ctx);
  // 私兵 — pooled personal-guard corps lend their household troops.
  const aGuardMul = privateGuardMultiplier(attackerPool);
  const dGuardMul = privateGuardMultiplier(defenderPool);
  // 威名 — a side led by famous names hits harder.
  const aPrestigeMul = prestigeCombatMultiplier(attackerPool);
  const dPrestigeMul = prestigeCombatMultiplier(defenderPool);
  // 名號各司其職 — situational honorific edge by battle type (水戰/攻城/守城/野戰).
  const aThemeMul = honorificThemeMul(attackerPool, { water, siege: isSiegeBattle, defending: false });
  const dThemeMul = honorificThemeMul(defenderPool, { water, siege: isSiegeBattle, defending: true });
  // 品階威儀 — a side led by high-grade officers fights above its numbers.
  const aGradeMul = gradeAuraPowerMul(attackerPool);
  const dGradeMul = gradeAuraPowerMul(defenderPool);
  // 神兵譜共鳴 — a commander bearing a full legendary set lifts the army's power.
  // 套裝共鳴 — power axis (+ naval axis in water battles); the guard axis feeds
  // the casualty rates below.
  const NO_SET = { powerMul: 1, guardMul: 1, navalMul: 1 };
  const aSet = attacker.commander ? itemSetBonuses(attacker.commander) : NO_SET;
  const dSet = defender.commander ? itemSetBonuses(defender.commander) : NO_SET;
  const aSetMul = aSet.powerMul * (water ? aSet.navalMul : 1);
  const dSetMul = dSet.powerMul * (water ? dSet.navalMul : 1);
  const aPower =
    aBlended * Math.sqrt(attacker.troops) * aSkillEffects.powerMultiplier * aElitePower *
    (stratEffect.attackerPowerMul ?? 1) * aPolicy.attackMul * aTraitMods.attackMul * aComboMul *
    aRelBonus.powerMul * rivalMul * aTitlePowerMul * aCasusMul * aNavalMul * aGuardMul * aPrestigeMul * aThemeMul * aGradeMul * aSetMul;

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
    (1 + cityDefense / 150) * dSkillEffects.defenseMultiplier * wallMul * siegeMul * dTraitMods.defenseMul;
  const dPower =
    dBlended *
    Math.sqrt(defender.troops + 1) *
    defenseFactor *
    dSkillEffects.powerMultiplier *
    dElitePower *
    (stratEffect.defenderPowerMul ?? 1) *
    dPolicy.attackMul * dTraitMods.attackMul * dComboMul * dRelBonus.powerMul * rivalMul *
    dTitlePowerMul * dCasusMul * dNavalMul * dGuardMul * dPrestigeMul * dThemeMul * dGradeMul * dSetMul / Math.max(0.5, dPolicy.defenseMul);

  const total = aPower + dPower || 1;
  const aRatio = aPower / total;
  const dRatio = dPower / total;
  const roll = rng();

  const variance = (rng() - 0.5) * 0.15;
  // Casualties: own losses scale with own's "ownLossMultiplier" (lower=better),
  // plus the enemy's "enemyLossMultiplier" (higher=worse for us).
  // Defensive structures on the perimeter make the attacker take more damage.
  // (attackerDamageMul < 1 = attacker hits softer → defender takes less → attacker takes MORE proportionally)
  const structureAttackerLossBoost = ctx?.attackerDamageMul ? 1 / Math.max(0.5, ctx.attackerDamageMul) : 1;
  // 甲冑防護 — armor worn by the side's officers blunts its own casualties;
  // a 守 set (四象神甲 etc.) on the commander adds to that.
  const aArmorMul = armorMitigationMul(attackerPool) * aSet.guardMul;
  const dArmorMul = armorMitigationMul(defenderPool) * dSet.guardMul;
  const aLossRate = clamp01(
    (dRatio + variance) *
      aSkillEffects.ownLossMultiplier *
      dSkillEffects.enemyLossMultiplier *
      aEliteOwnLoss *
      (stratEffect.ownLossMul ?? 1) *
      structureAttackerLossBoost *
      aTraitMods.lossMul *
      aArmorMul,
  );
  const dLossRate = clamp01(
    (aRatio - variance) *
      dSkillEffects.ownLossMultiplier *
      aSkillEffects.enemyLossMultiplier *
      dEliteOwnLoss *
      (stratEffect.enemyLossMul ?? 1) *
      dTraitMods.lossMul *
      cityDrillLossMultiplier(ctx?.city?.drill) *
      dArmorMul,
  );

  const attackerLosses = Math.floor(attacker.troops * aLossRate);
  const defenderLosses = Math.floor(defender.troops * dLossRate);

  const attackerSurvivors = attacker.troops - attackerLosses;
  const defenderSurvivors = defender.troops - defenderLosses;

  // Field win condition (stratagem surprise tilts the roll for attacker).
  const surpriseTilt = stratEffect.surpriseRoll ?? 0;
  const attackerWins = roll < aRatio + 0.05 + surpriseTilt;

  // Duel: rare event when both commanders have war ≥ 80. 鬥將/武勇 actively seek
  // single combat, so a duel-seeker on either side makes it markedly likelier.
  const duelSeekers = (o: Officer) => (o.traits as string[] | undefined ?? [])
    .some((t) => t === 'duelist' || t === 'martial-valor' || t === 'reckless');
  const duelSeekMul = (duelSeekers(attacker.commander) ? 1.6 : 1)
    * (duelSeekers(defender.commander) ? 1.6 : 1);
  // 義不相殘 — sworn brothers across the line will not seek each other's blood;
  // the bout simply never happens (the cross-line morale bite is felt instead).
  const swornAcross = areSwornBrothers(attacker.commander.id, defender.commander.id, bonds);
  let duel: BattleResult['duel'];
  if (
    !swornAcross &&
    attacker.commander.stats.war >= 80 &&
    defender.commander.stats.war >= 80 &&
    rng() < 0.12 * (ctx?.duelChanceMul ?? 1) * duelSeekMul
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
  // 品階威儀 — a graded commander steadies his own line (gradeAuraMorale) AND
  // 萬軍辟易 shakes the enemy's (enemyMoraleShock): facing a legend, the foe opens lower.
  // 同袍士氣 — relationship morale (sworn/family/好感 lift; 宿怨 drag) plus the
  // divided heart of facing a sworn brother across the line. Small but real.
  const aRelMorale = (aRelBonus.moraleResist + swornAcrossLinesPenalty(attackerPool, defenderPool, bonds)) * 15;
  const dRelMorale = (dRelBonus.moraleResist + swornAcrossLinesPenalty(defenderPool, attackerPool, bonds)) * 15;
  let aMorale = clamp(60 + attacker.commander.stats.leadership / 10 + gradeAuraMorale(attackerPool) - enemyMoraleShock(defenderPool) + aRelMorale - (ctx?.attackerMoraleMod ?? 0), 0, 100);
  let dMorale = defender.commander
    ? clamp(60 + defender.commander.stats.leadership / 10 + gradeAuraMorale(defenderPool) - enemyMoraleShock(attackerPool) + dRelMorale, 0, 100)
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
  // 不動如山 — a 白金+ commander's host breaks in good order: a rout costs it far
  // fewer extra casualties (0.10 instead of 0.25).
  if (dMorale < 25 && aMorale > 35) {
    finalAttackerWins = true;
    extraDefenderLosses = Math.floor(defenderSurvivors * (holdsTheLine(defenderPool) ? 0.10 : 0.25));
  } else if (aMorale < 25 && dMorale > 35) {
    finalAttackerWins = false;
    extraAttackerLosses = Math.floor(attackerSurvivors * (holdsTheLine(attackerPool) ? 0.10 : 0.25));
  }

  // Phase 4 — Pursuit (追擊). Only if attacker won + chose to pursue.
  let pursued = false;
  const captured: EntityId[] = [];
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
  const wounded: Array<{ officerId: EntityId; seasons: number; severity: 'minor' | 'serious' | 'critical' }> = [];
  const losingSide = finalAttackerWins
    ? [defender.commander, ...(defender.companions ?? [])]
    : [attacker.commander, ...(attacker.companions ?? [])];
  for (const o of losingSide) {
    if (!o) continue;
    if (captured.includes(o.id)) continue;
    if (duel?.loser.id === o.id) continue; // duel loser handled by duel record
    if (rng() < 0.18) {
      // 傷勢分級 — most wounds are slight; a sixth are grave; a rare one is
      // near-mortal and lays the officer up for half a year (and may kill).
      const r = rng();
      const severity = r < 0.62 ? 'minor' : r < 0.9 ? 'serious' : 'critical';
      const seasons = severity === 'minor' ? 1 + Math.floor(rng() * 2)   // 1-2
        : severity === 'serious' ? 3 + Math.floor(rng() * 2)             // 3-4
        : 5 + Math.floor(rng() * 2);                                     // 5-6
      wounded.push({ officerId: o.id, seasons, severity });
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
    stratagemChain: stratagemChainRecord,
    defenderStratagem: defenderStratagemRecord,
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
  /** Runtime family relations — used for relationship combat bonuses. */
  family?: import('../types/family').FamilyRelation[];
  /** Runtime oath bonds (義兄弟 結拜 / rapport) — sworn-brother combat synergy. */
  runtimeBonds?: import('../data/bonds').OathBond[];
  /** Pairwise officer rapport (好感, −100..100) — graded same-side synergy/friction. */
  rapport?: Record<string, number>;
  /** Civic-title appointments — derive per-force power multiplier per battle. */
  appointments?: import('../types').Appointment[];
  /** Active casus-belli marks (from 討伐令). Attacker gets +10% vs target. */
  casusBelliMarks?: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }>;
  /** Current game date — needed to filter expired casus-belli marks. */
  date?: { year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' };
  /** The human player's force — AI attackers (≠ player) pick siege works
   *  (圍困/水攻) on their own; the player chooses via the battle modal. */
  playerForceId?: EntityId | null;
  /** 不會戰死 — when true, a duel loser is gravely wounded but survives,
   *  rather than being slain on the field. */
  noBattleDeath?: boolean;
  /** 單挑頻率 — multiplier on the field-duel trigger chance. Default 1. */
  duelChanceMul?: number;
  /** City interior buildings — 城壁/武庫/甕城/譙樓 add to the defender's wall. */
  buildings?: Building[];
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
    const coNamesZh = transferCompanions.length > 0
      ? `與${transferCompanions.map((o) => o.name.zh).join('、')}`
      : '';
    entries.push({
      cityId: target.id,
      kind: 'march',
      text: `${commander.name.en}${coNames} transferred ${sentTroops.toLocaleString()} troops from ${source.name.en} to ${target.name.en}.`,
      textZh: `${commander.name.zh}${coNamesZh}自${source.name.zh}調兵 ${sentTroops.toLocaleString()} 至${target.name.zh}。`,
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
  // 適才適所 — pick the defender whose specialist traits fit the fight (善守 on a
  // wall, 水將 on a river), not merely the highest 武力.
  const defNaval = isWaterBattle({ city: target });
  const defenderCommander =
    [...defenderOfficers].sort((a, b) =>
      b.stats.war * combatRoleFit(b, { isSiege: true, isNaval: defNaval, isDefense: true })
      - a.stats.war * combatRoleFit(a, { isSiege: true, isNaval: defNaval, isDefense: true }),
    )[0] ?? fallbackCommander(target);

  // Gather marching companions (multi-officer armies).
  const companions: Officer[] = (cmd.additionalOfficerIds ?? [])
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o);

  // Defenders' personal city-defense policies (城防/護城河/烽燧/關隘/海防/禁衛) add to wall strength.
  const cityResidents = Object.values(officers).filter(
    (o) => o.locationCityId === target.id && o.status !== 'dead',
  );
  const defenseBonusFromPolicy = (() => {
    const eff = cityPolicyEffects(target, cityResidents);
    return eff.defenseBonus;
  })();
  // Defense structures built on the city's perimeter (箭樓/拒馬/鐵索/...).
  const slotEffects = aggregateSlotEffects(target.buildSlots ?? []);
  // Conditional defence-building effects: 鐵索 navalDefense only on water, 拒馬
  // cavalryPenalty only vs a cavalry-led assault, rampart/rockfall mountainBonus
  // only in the passes, 兵舍 extraGarrison always adds standing defenders.
  const siegeMods = siegeBuildingModifiers(slotEffects, {
    water: isWaterBattle({ city: target }),
    mountain: cityCombatTerrain(target) === 'mountain',
    attackerCavalry: commander.skills.includes('cavalry-master'),
  });
  // Inherent ground advantage for the defender (passes/mountains/forest/marsh),
  // on top of any walls or rockfall facilities.
  const terrainDefMul = terrainDefenderMultiplier(target);
  // ── AI 攻城方略 — a non-player attacker prosecutes the siege like a
  // player would: flood a riverside city (decisive sieges only), or invest
  // a grain-poor one until the garrison starves. Costs come out of the
  // attacking city's stores; effects weaken the defence below.
  let worksDefenseMul = 1;
  let worksTroopsMul = 1;
  let worksNoteZh = '';
  let worksNoteEn = '';
  const isAiAttacker = ctx.playerForceId !== undefined && source.ownerForceId !== ctx.playerForceId;
  if (isAiAttacker && target.ownerForceId && target.troops >= 5000) {
    const tp = cityPos(target);
    const investCost = Math.max(800, sentTroops);
    if (isRiverside(tp.x, tp.y) && ctx.weather?.kind !== 'drought' && cities[source.id].gold >= 1000) {
      cities[source.id] = { ...cities[source.id], gold: cities[source.id].gold - 400 };
      worksDefenseMul = 0.6;
      worksTroopsMul = 0.88;
      worksNoteZh = `【水攻】${commander.name.zh}決堤灌${target.name.zh} — 城牆崩毀，守軍溺損。`;
      worksNoteEn = `[Flood] ${commander.name.en} broke the dikes on ${target.name.en} — walls washed out, garrison drowned.`;
    } else if (target.food < target.troops * 6 && cities[source.id].food >= investCost + 5000) {
      cities[source.id] = { ...cities[source.id], food: cities[source.id].food - investCost };
      worksDefenseMul = 0.85;
      worksTroopsMul = 0.9;
      worksNoteZh = `【圍困】${commander.name.zh}圍${target.name.zh}而斷其糧 — 城中飢疲，守備鬆弛。`;
      worksNoteEn = `[Invest] ${commander.name.en} starved ${target.name.en} out — the garrison weakens.`;
    }
    if (worksNoteZh) {
      entries.push({ cityId: target.id, kind: 'note', text: worksNoteEn, textZh: worksNoteZh });
    }
  }

  // 城內建築 — 城壁/武庫/工房/甕城/譙樓/烽燧 reinforce the wall on top of policies
  // and perimeter defence structures; 樓船署 adds defence in water battles.
  const cityBuildBonus = buildingBonuses(target.id, ctx.buildings ?? []);
  const buildingDefenseAdd = cityBuildBonus.defenseAdd
    + (isWaterBattle({ city: target }) ? cityBuildBonus.navalPower : 0);
  const effectiveDefense =
    (target.defense + defenseBonusFromPolicy + slotEffects.defenseBonus + siegeMods.defenseBonus + buildingDefenseAdd) * worksDefenseMul;
  const defenderTroops = Math.max(1, Math.floor((target.troops + siegeMods.garrisonBonus) * worksTroopsMul));

  // Watchtower / arrow-platform / rockfall pre-strike the attacker before battle math.
  const adjustedAttackerTroops = Math.max(0, sentTroops - slotEffects.rangedPrestrike);

  // Civic title force multipliers (軍師/太尉/丞相). Looked up by attacker
  // and defender force; null target owner ⇒ 1.
  const attackerTitlePowerMul = ctx.appointments
    ? appointmentBonusFor(source.ownerForceId, ctx.appointments, officers).powerMultiplier
    : 1;
  const defenderTitlePowerMul = ctx.appointments
    ? appointmentBonusFor(target.ownerForceId, ctx.appointments, officers).powerMultiplier
    : 1;
  // Casus-belli combat bonus (討伐令): if A has denounced B and the mark
  // is still valid, A gets +10% power when attacking B (and vice versa).
  const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
  const isMarkActive = (m: { expiresYear: number; expiresSeason: 'spring' | 'summer' | 'autumn' | 'winter' }) => {
    if (!ctx.date) return true;
    const nowAbs = ctx.date.year * 4 + seasonIdx[ctx.date.season];
    const expAbs = m.expiresYear * 4 + seasonIdx[m.expiresSeason];
    return nowAbs <= expAbs;
  };
  const hasMark = (byF: EntityId | null, targetF: EntityId | null) => {
    if (!byF || !targetF || !ctx.casusBelliMarks) return false;
    return ctx.casusBelliMarks.some(
      (m) => m.byForceId === byF && m.targetForceId === targetF && isMarkActive(m),
    );
  };
  const attackerCasusBelliMul = hasMark(source.ownerForceId, target.ownerForceId) ? 1.1 : 1;
  const defenderCasusBelliMul = hasMark(target.ownerForceId, source.ownerForceId) ? 1.1 : 1;
  const result = resolveBattle(
    { troops: adjustedAttackerTroops, commander, companions },
    {
      troops: defenderTroops,
      commander: defenderCommander,
      companions: defenderOfficers,
    },
    effectiveDefense,
    ctx.rng,
    {
      city: target,
      weather: ctx.weather,
      allowPursuit: true,
      attackerDamageMul: slotEffects.attackerDamageMul,
      family: ctx.family,
      runtimeBonds: ctx.runtimeBonds,
      rapport: ctx.rapport,
      attackerTitlePowerMul: attackerTitlePowerMul * siegeMods.attackerPowerMul,
      defenderTitlePowerMul: defenderTitlePowerMul * siegeMods.defenderPowerMul * terrainDefMul * foreignAuxDefenseMultiplier(target.foreignAux) * cityDrillDefenseMultiplier(target.drill),
      attackerCasusBelliMul,
      defenderCasusBelliMul,
      duelChanceMul: ctx.duelChanceMul ?? 1,
      // 疲勞 less 都督之旗 — a forced march opens weary (以逸待勞), but a renowned
      // legion marshal's banner steadies the column (legionBanner offsets it).
      attackerMoraleMod: arrivalFatigueMorale(cmd.pace) - (cmd.legionBanner ?? 0),
      // 軍師獻策 — a scheme the player chose for this assault (if any).
      forcedStratagem: cmd.forcedStratagem,
    },
  );
  // Account for the prestrike in the casualty report.
  if (slotEffects.rangedPrestrike > 0) {
    result.attackerLosses += slotEffects.rangedPrestrike;
  }

  // Wounded officers: apply 'wounded' status with recovery countdown.
  if (result.wounded) {
    // 戰陣藥營 — a side with 藥材 dresses its grave wounds in the field: it
    // downgrades severity (so fewer later die of their wounds — see the 瀕死 roll)
    // and shortens convalescence, spending medicine from that realm's stores.
    const MED_COST = 120;
    const medPool: Record<string, number> = {};
    const medTotal = (fid: string | null | undefined): number => {
      if (!fid) return 0;
      if (medPool[fid] == null) medPool[fid] = Object.values(cities).reduce((sum, c) => c.ownerForceId === fid ? sum + (c.medicine ?? 0) : sum, 0);
      return medPool[fid];
    };
    const spendMed = (fid: string, amount: number) => {
      medPool[fid] = Math.max(0, (medPool[fid] ?? 0) - amount);
      let rem = amount;
      for (const c of Object.values(cities)) {
        if (rem <= 0) break;
        if (c.ownerForceId !== fid || (c.medicine ?? 0) <= 0) continue;
        const take = Math.min(c.medicine ?? 0, rem);
        cities[c.id] = { ...c, medicine: (c.medicine ?? 0) - take };
        rem -= take;
      }
    };
    for (const w of result.wounded) {
      const o = officers[w.officerId];
      if (!o || o.status === 'dead') continue;
      let severity = w.severity;
      let seasons = w.seasons;
      const fid = o.forceId;
      if (fid && (severity === 'critical' || severity === 'serious') && medTotal(fid) >= MED_COST) {
        spendMed(fid, MED_COST);
        severity = severity === 'critical' ? 'serious' : 'minor';
        seasons = Math.max(1, seasons - 2);
        if (fid === ctx.playerForceId) {
          entries.push({
            cityId: target.id, kind: 'note',
            text: `Field hospital (藥營) tended ${o.name.en}'s wounds — severity eased.`,
            textZh: `戰陣藥營救治${o.name.zh},傷勢得緩、復出有期。`,
          });
        }
      }
      officers[w.officerId] = {
        ...o,
        status: 'wounded',
        task: null,
        woundedSeasons: seasons,
        woundSeverity: severity,
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
        capturedFromForceId: o.forceId ?? undefined,
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
      textZh: result.stratagem.succeeded
        ? `${result.stratagem.name.zh}之計大成 — 攻方${commander.name.zh}用計奏效。`
        : `${result.stratagem.name.zh}之計失策 — 反受其害。`,
    });
  }

  if (result.duel) {
    const loser = officers[result.duel.loser.id];
    if (ctx.noBattleDeath) {
      // 不會戰死 — the loser is unhorsed and gravely wounded, but lives.
      entries.push({
        cityId: target.id,
        kind: 'battle',
        text: `Duel! ${result.duel.winner.name.en} bested ${result.duel.loser.name.en}, who fled gravely wounded.`,
        textZh: `一騎討！${result.duel.winner.name.zh}陣前敗${result.duel.loser.name.zh}，後者重傷遁走。`,
      });
      if (loser) {
        officers[result.duel.loser.id] = {
          ...loser,
          status: 'wounded',
          woundSeverity: 'serious',
          woundedSeasons: 3,
          task: null,
        };
      }
    } else {
      entries.push({
        cityId: target.id,
        kind: 'battle',
        text: `Duel! ${result.duel.winner.name.en} slew ${result.duel.loser.name.en} on the field.`,
        textZh: `一騎討！${result.duel.winner.name.zh}陣前斬${result.duel.loser.name.zh}。`,
      });
      // 復仇種子 — record the slayer's force on each surviving close relative of
      // the fallen, so a `vengeful` kin bears a grudge in future battles.
      const killerForce = result.duel.winner.forceId;
      if (killerForce) {
        const fam = ctx?.family ?? [];
        const loserId = result.duel.loser.id;
        const relIds = [...parentsOf(loserId, fam), ...childrenOf(loserId, fam), ...spousesOf(loserId, fam), ...siblingsOf(loserId, fam)];
        for (const relId of relIds) {
          const rel = officers[relId];
          if (!rel || rel.status === 'dead') continue;
          officers[relId] = { ...rel, killedRelativesBy: { ...(rel.killedRelativesBy ?? {}), [loserId]: killerForce } };
        }
        // 為兄弟復仇 — a fallen brother's sworn kin bear a grudge against the slayer's
        // force (combat bonus vs them, no `vengeful` trait required).
        for (const swornId of allSwornBrothersOf(loserId, ctx?.runtimeBonds ?? [])) {
          const sw = officers[swornId];
          if (!sw || sw.status === 'dead') continue;
          officers[swornId] = { ...sw, killedSwornBy: { ...(sw.killedSwornBy ?? {}), [loserId]: killerForce } };
        }
      }
      officers[result.duel.loser.id] = {
        ...officers[result.duel.loser.id],
        status: 'dead',
        forceId: null,
        task: null,
      };
    }
  }

  const attackerSurvivors = sentTroops - result.attackerLosses;
  const defenderSurvivors = Math.max(
    0,
    target.troops - result.defenderLosses,
  );

  // ── R3 — Comradeship after fighting together ──
  // After a victorious battle, the commander has a chance to forge a
  // sworn-comrade bond with one of their companions (if not already bonded).
  // Bonds emit a flavor entry only — they're tracked via runtimeBonds
  // (the caller in resolveSeason picks them up).
  // To keep this simple we just signal via the entries log; the store can
  // optionally lift these into runtimeBonds.
  if (result.attackerWins && companions.length > 0 && ctx.rng() < 0.08) {
    const buddy = companions[Math.floor(ctx.rng() * companions.length)];
    entries.push({
      cityId: target.id,
      kind: 'note',
      text: `[Comrades] ${commander.name.en} and ${buddy.name.en} sealed a sworn-comrade bond after this campaign.`,
      textZh: `【結為同袍】${commander.name.zh}與${buddy.name.zh}在此役後結為生死之交。`,
    });
  }

  // ── T8 — Tactic combo announcements ──
  // Recompute the pooled tactics here (resolveBattle has its own copies).
  const atkPool: string[] = [];
  for (const o of [commander, ...companions]) {
    atkPool.push(...(((o as Officer & { tactics?: string[] }).tactics) ?? deriveTactics(o.stats, o.id)));
  }
  const defPool: string[] = [];
  for (const o of defenderOfficers) {
    defPool.push(...(((o as Officer & { tactics?: string[] }).tactics) ?? deriveTactics(o.stats, o.id)));
  }
  const atkCombos = findActiveCombos(atkPool);
  for (const c of atkCombos) {
    entries.push({
      cityId: target.id,
      kind: 'battle',
      text: `[Combo] ${c.nameEn}: ${c.textEn}`,
      textZh: `【連環戰法】${c.nameZh}:${c.textZh}`,
    });
  }
  const defCombos = findActiveCombos(defPool);
  for (const c of defCombos) {
    entries.push({
      cityId: target.id,
      kind: 'battle',
      text: `[Defender Combo] ${c.nameEn}: ${c.textEn}`,
      textZh: `【守方連環】${c.nameZh}:${c.textZh}`,
    });
  }

  // ── P8 — Battle-derived traits ─────────────────────────────────
  // Winners of decisive battles may earn `veteran` (if they don't have
  // it). Losers of catastrophic battles may gain `cowardly`. Roll once
  // per battle for the commander only (companions don't earn).
  const aLossPct = result.attackerLosses / Math.max(1, sentTroops);
  const dLossPct = result.defenderLosses / Math.max(1, target.troops);
  const tryGainTrait = (off: Officer, traitId: 'veteran' | 'cowardly', chance: number) => {
    if (!off || off.status === 'dead') return;
    // Only persist onto a REAL stored officer — a synthetic garrison fallback
    // (id `garrison-…`, not in the officers map) or an id-less stand-in would
    // otherwise spawn a phantom officer holding only `{traits}`, which later
    // crashes systems that read its (missing) name/stats.
    const existing = off.id ? officers[off.id] : undefined;
    if (!existing) return;
    const ts = (off.traits ?? []) as string[];
    if (ts.includes(traitId)) return;
    // Conflicts: veteran ↮ cowardly; can't have both
    if (traitId === 'veteran' && ts.includes('cowardly')) return;
    if (traitId === 'cowardly' && (ts.includes('martial-valor') || ts.includes('ironhearted'))) return;
    if (ctx.rng() < chance) {
      officers[off.id] = {
        ...existing,
        traits: [...ts, traitId] as Officer['traits'],
      };
      entries.push({
        cityId: target.id,
        kind: traitId === 'veteran' ? 'note' : 'desertion',
        text: traitId === 'veteran'
          ? `${off.name.en} earned the Veteran trait through hard battle.`
          : `${off.name.en} grew Cowardly after a devastating defeat.`,
        textZh: traitId === 'veteran'
          ? `${off.name.zh}經此一役,習得「老兵」之性。`
          : `${off.name.zh}大敗之餘,染上「怯懦」之性。`,
      });
    }
  };
  // Decisive attacker victory: heavy defender losses + light own losses.
  if (result.attackerWins && dLossPct > 0.5 && aLossPct < 0.25) {
    tryGainTrait(commander, 'veteran', 0.10);
  }
  // Decisive defender victory: drove off attacker with light losses.
  if (!result.attackerWins && aLossPct > 0.5 && dLossPct < 0.25) {
    tryGainTrait(defenderCommander, 'veteran', 0.10);
  }
  // Catastrophic loss for the loser.
  if (result.attackerWins && dLossPct > 0.7) {
    tryGainTrait(defenderCommander, 'cowardly', 0.05);
  }
  if (!result.attackerWins && aLossPct > 0.7) {
    tryGainTrait(commander, 'cowardly', 0.05);
  }

  const attackerNames = [commander, ...companions]
    .map((o) => o.name.en)
    .join(' + ');
  const defenderNames = [defenderCommander, ...defenderOfficers.filter((o) => o.id !== defenderCommander.id)]
    .slice(0, 4)
    .map((o) => o.name.en)
    .join(' + ');
  const attackerNamesZh = [commander, ...companions]
    .map((o) => o.name.zh)
    .join('、');
  const defenderNamesZh = [defenderCommander, ...defenderOfficers.filter((o) => o.id !== defenderCommander.id)]
    .slice(0, 4)
    .map((o) => o.name.zh)
    .join('、');

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
          seenThrough: result.stratagem.seenThrough,
        }
      : undefined,
    stratagemChain: result.stratagemChain
      ? { nameZh: result.stratagemChain.name.zh, nameEn: result.stratagemChain.name.en, succeeded: result.stratagemChain.succeeded }
      : undefined,
    defenderStratagem: result.defenderStratagem
      ? { nameZh: result.defenderStratagem.name.zh, nameEn: result.defenderStratagem.name.en, succeeded: result.defenderStratagem.succeeded, seenThrough: result.defenderStratagem.seenThrough }
      : undefined,
    attackerMoraleEnd: result.attackerMoraleEnd,
    defenderMoraleEnd: result.defenderMoraleEnd,
    woundedIds: result.wounded?.map((w) => w.officerId),
    capturedIds: result.captured,
    pursued: result.pursued,
  };

  // Name the real ground the city stands on — 「襄陽之戰（漢水之濱）」.
  const tp = cityPos(target);
  const site = describeBattleSite(tp.x, tp.y);
  const siteZh = site ? `（${site.zh}）` : '';
  const siteEn = site ? ` (${site.en})` : '';
  entries.push({
    cityId: target.id,
    kind: 'battle',
    text:
      `Battle at ${target.name.en}${siteEn}: ${attackerNames} (${sentTroops.toLocaleString()}) vs ` +
      `${defenderNames} (${target.troops.toLocaleString()}). ` +
      `Casualties — atk ${result.attackerLosses.toLocaleString()}, def ${result.defenderLosses.toLocaleString()}. ` +
      `[Click for breakdown]`,
    textZh:
      `${target.name.zh}之戰${siteZh}：${attackerNamesZh}（${sentTroops.toLocaleString()}）對陣` +
      `${defenderNamesZh}（${target.troops.toLocaleString()}）。` +
      `折損 — 攻方 ${result.attackerLosses.toLocaleString()}、守方 ${result.defenderLosses.toLocaleString()}。` +
      `[點擊查看詳情]`,
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
    // T5 — commander's traits affect post-conquest city loyalty: merciful
    // commanders earn higher loyalty; brutal ones cause unrest.
    const traitLoyaltyMod = conquestLoyaltyMod(commander);
    const baseLoyalty = Math.max(20, Math.floor(target.loyalty * 0.5));
    // 兵燹 — the sack costs the city a fifth of its people; some flee as 流民 to
    // an adjacent city still held by the former owner.
    const formerOwner = target.ownerForceId;
    const popLoss = conquestPopulationLoss(cities[target.id].population);
    cities[target.id] = {
      ...cities[target.id],
      ownerForceId: source.ownerForceId,
      troops: attackerSurvivors,
      population: popLoss.survivors,
      loyalty: Math.max(10, Math.min(80, baseLoyalty + traitLoyaltyMod)),
    };
    if (popLoss.refugees > 0 && formerOwner) {
      const haven = target.adjacentCityIds.find(
        (cid) => cities[cid] && cities[cid].ownerForceId === formerOwner && !cities[cid].ruined,
      );
      if (haven) {
        cities[haven] = { ...cities[haven], population: cities[haven].population + popLoss.refugees };
      }
    }
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
    const coNamesZh = companions.length > 0
      ? `與${companions.map((o) => o.name.zh).join('、')}`
      : '';
    entries.push({
      cityId: target.id,
      kind: 'conquest',
      text: `${target.name.en} has fallen! ${commander.name.en}${coNames} occupies the city.`,
      textZh: `${target.name.zh}已陷！${commander.name.zh}${coNamesZh}入城據守。`,
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
      textZh: `${commander.name.zh}雖勝於野戰，然未能破${target.name.zh}城，餘眾撤回。`,
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
      textZh: `${commander.name.zh}於${target.name.zh}受挫敗退，餘 ${attackerSurvivors.toLocaleString()} 兵歸營。`,
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
