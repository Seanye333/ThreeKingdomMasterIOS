import type {
  BattleObjective,
  City,
  DamagePopup,
  EntityId,
  FormationId,
  HexCoord,
  NamedBattleMap,
  Officer,
  Reinforcement,
  ShipClass,
  StratagemId,
  TacticalBattle,
  TacticalStatus,
  TacticalTile,
  TacticalUnit,
  TerrainKind,
  TimeOfDay,
  UnitType,
  Weather,
} from '../types';
import { cityPos } from '../data/cityGeo';
import { geoToPixel } from '../data/geography';
import { FACILITY_DEFS, type Fort } from '../types/fort';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../data/namedMaps';
import { SHIP_CLASSES_BY_ID } from '../data/ships';
import { deriveWeaponType, type WeaponType } from '../data/weaponTypes';
import { FORMATIONS_BY_ID } from '../data/formations';
import { pickVoiceLine } from '../data/voiceLines';
import { generateTerrain, type TerrainHint } from './battlefieldTerrain';
import { effectiveStats, tacticalDamageMul, tacticalDefenseMul, tacticalMoraleAura, stratagemDamageMul } from './traitEffects';
import { gradeCombatBonus } from './gradeCombat';
import { growthPowerMul } from './growth';
import { itemSetPowerMul } from '../data/itemSets';
import { SIGNATURE_OVERRIDES } from './personalTactics';
import { predictAttackDamage } from './damagePredict';
import { stratagemSituation, type Situation } from './tacticSituation';
import { resolveDuel, canDuel } from './duel';

/**
 * Unit-type counter matrix. counterBonus[attacker][defender] = multiplier on
 * damage dealt by attacker to defender. 1.0 = neutral, >1.0 = strong, <1.0 = weak.
 */
const COUNTER_MATRIX: Record<UnitType, Partial<Record<UnitType, number>>> = {
  spearmen: { cavalry: 1.5, archers: 0.75 },
  cavalry: { archers: 1.5, spearmen: 0.75 },
  archers: { spearmen: 1.5, cavalry: 0.75 },
  siege: { spearmen: 0.6, cavalry: 0.5, archers: 0.6 },
  navy: {}, // bonuses come from river terrain
  infantry: {},
};

export function counterMultiplier(a: UnitType, d: UnitType): number {
  return COUNTER_MATRIX[a][d] ?? 1.0;
}

/**
 * 兵裝相剋 — a finer layer than the 6-arm COUNTER_MATRIX: the officer's actual
 * weapon class (§5.9, derived from equipment) now bites in melee. Returns the
 * outgoing-damage multiplier for attacker-weapon vs defender-weapon/arm, plus a
 * short tag for the strongest edge. Deliberately light (≤×1.15 per edge, clamped
 * to [0.85,1.4]) so it refines the matchup without eclipsing the arm counters.
 */
export function weaponMatchupMul(
  aw: WeaponType,
  dw: WeaponType,
  dUnitType: UnitType,
  fromFlankOrRear: boolean,
): { mul: number; tag?: string } {
  let m = 1;
  let tag: string | undefined;
  const dMounted = dw === 'cavalry' || dUnitType === 'cavalry';
  const dHeavy = dw === 'spear' || dw === 'halberd' || dw === 'sabre' || dw === 'cavalry' || dw === 'siege';
  const dSoft = dw === 'bow' || dw === 'crossbow' || dw === 'fan';
  // 戟制騎 — halberds hook and drag horsemen from the saddle.
  if (aw === 'halberd' && dMounted) { m *= 1.15; tag = '戟制騎'; }
  // 長槍拒馬 — spears outreach the charge (light; spearmen arm already counters).
  else if (aw === 'spear' && dMounted) { m *= 1.07; tag = '槍拒馬'; }
  // 弩矢破甲 — crossbow bolts punch heavy armour where bows can't.
  if (aw === 'crossbow' && dHeavy) { m *= 1.13; tag = tag ?? '弩破甲'; }
  // 鐵騎踏陣 — horse runs down bows/crossbows/strategists caught in the open.
  if (aw === 'cavalry' && dSoft) { m *= 1.12; tag = tag ?? '騎踏陣'; }
  // 劍走輕靈 — agile swordsmen exploit an exposed flank/rear harder.
  if (aw === 'sword' && fromFlankOrRear) { m *= 1.10; tag = tag ?? '劍迅捷'; }
  // 重刃破輕 — a heavy sabre overpowers light blades and the unarmed.
  if (aw === 'sabre' && (dw === 'sword' || dw === 'none')) { m *= 1.07; tag = tag ?? '刀破輕'; }
  // 書生臨陣 / 赤手 — strategists and the unarmed are soft in a stand-up melee.
  if (dw === 'fan') { m *= 1.12; tag = tag ?? '襲書生'; }
  else if (dw === 'none') { m *= 1.08; tag = tag ?? '欺徒手'; }
  return { mul: Math.max(0.85, Math.min(1.4, m)), tag };
}

/** 連携合擊 — sworn brothers / famous bonded pairs who strike a foe together
 *  land a combined blow. Keyed by officer id. */
const COMBO_BONDS: ReadonlyArray<readonly [string, string]> = [
  ['liu-bei', 'guan-yu'], ['liu-bei', 'zhang-fei'], ['guan-yu', 'zhang-fei'],
  ['sun-ce', 'zhou-yu'], ['sun-quan', 'zhou-yu'], ['zhou-yu', 'huang-gai'],
  ['xiahou-dun', 'xiahou-yuan'], ['cao-cao', 'xiahou-dun'],
  ['ma-chao', 'pang-de'], ['zhuge-liang', 'liu-bei'], ['lu-meng', 'lu-xun'],
];
export function areBonded(a: string, b: string): boolean {
  return COMBO_BONDS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 精銳/異族 — famous elite corps & tribal hosts led by specific officers. The
 *  unit fights above its weight: atkMul to blows dealt, defMul to blows taken
 *  (<1 = hardier). */
export const ELITE_UNITS: Record<string, { zh: string; atkMul: number; defMul: number }> = {
  // 漢家精銳
  'cao-chun': { zh: '虎豹騎', atkMul: 1.22, defMul: 0.93 },
  'cao-cao': { zh: '虎豹騎', atkMul: 1.12, defMul: 0.95 },
  'gao-shun': { zh: '陷陣營', atkMul: 1.22, defMul: 0.9 },
  'gongsun-zan': { zh: '白馬義從', atkMul: 1.16, defMul: 0.98 },
  'ma-chao': { zh: '西涼鐵騎', atkMul: 1.18, defMul: 0.95 },
  'lu-bu': { zh: '并州狼騎', atkMul: 1.2, defMul: 0.95 },
  'yan-liang': { zh: '河北大戟', atkMul: 1.14, defMul: 0.92 },
  'qu-yi': { zh: '先登死士', atkMul: 1.18, defMul: 0.95 },
  // 異族
  'meng-huo': { zh: '南蠻象兵', atkMul: 1.2, defMul: 0.85 },
  'wutugu': { zh: '藤甲兵', atkMul: 1.1, defMul: 0.7 },
  'zhurong': { zh: '南蠻飛刀', atkMul: 1.14, defMul: 1.0 },
  'kebuneng': { zh: '鮮卑突騎', atkMul: 1.16, defMul: 0.95 },
  'tadun': { zh: '烏桓突騎', atkMul: 1.16, defMul: 0.95 },
};
export function eliteUnitOf(officerId: string): { zh: string; atkMul: number; defMul: number } | undefined {
  return ELITE_UNITS[officerId];
}

/** 陣克陣 — formations play rock-paper-scissors by character: 攻陣破守陣、守陣
 *  克機動、機動繞攻陣。神陣/無陣中庸。 */
type FormCat = 'offensive' | 'defensive' | 'mobile' | 'mystic' | 'none';
const FORMATION_CAT: Record<string, FormCat> = {
  'arrow-tip': 'offensive', 'awl': 'offensive', 'wheel': 'offensive', 'mandarin-duck': 'offensive', 'back-to-water': 'offensive',
  'fish-scale': 'defensive', 'square': 'defensive', 'stacked': 'defensive', 'crescent-moon': 'defensive', 'rattan-armor': 'defensive', 'crescent-withdraw': 'defensive', 'armored-cart': 'defensive',
  'crane-wing': 'mobile', 'wild-goose': 'mobile', 'yoke': 'mobile', 'spread-out': 'mobile', 'long-snake': 'mobile', 'ten-ambush': 'mobile',
  'eight-trigrams': 'mystic', 'seven-star': 'mystic', 'five-elements': 'mystic', 'four-symbols': 'mystic', 'trinity': 'mystic',
};
/** Damage multiplier from the attacker's formation vs the defender's. */
export function formationCounterMul(atk: string, def: string): number {
  const a = FORMATION_CAT[atk] ?? 'none', d = FORMATION_CAT[def] ?? 'none';
  if (a === 'none' || d === 'none' || a === 'mystic' || d === 'mystic') return 1.0;
  const beats: Record<string, string> = { offensive: 'defensive', defensive: 'mobile', mobile: 'offensive' };
  if (beats[a] === d) return 1.15;   // attacker's form counters defender's
  if (beats[d] === a) return 0.9;    // defender's form counters attacker's
  return 1.0;
}

/**
 * 排兵布陣 — pick a sensible formation for an AI army from its composition,
 * commander wits (formations gate on 智), stance, and — when known — the enemy's
 * formation (to win the 陣克陣). Without this NPC armies fought formation-less,
 * so the whole 24-formation system lay dormant against the AI.
 */
export function pickAiFormation(
  arms: UnitType[],
  commanderInt: number,
  opts?: { defensive?: boolean; counter?: FormationId; fireWeather?: boolean },
): FormationId {
  const usable = (f: FormationId) => (FORMATIONS_BY_ID[f]?.minIntelligence ?? 0) <= commanderInt;
  const n = (t: UnitType) => arms.filter((a) => a === t).length;
  const cav = n('cavalry'), arc = n('archers'), spe = n('spearmen');
  const cands: FormationId[] = [];
  // 乾風忌密 — in a dry gale the deadliest threat is fire leaping rank to rank,
  // so a wits-about commander loosens up: 疏陣 spaces the files out (fire can't
  // chain) and 鸞翔 keeps an archer screen mobile — both ahead of the tight
  // packings the enemy could touch off. (Never the oil-cured 藤甲 here — it
  // takes 2× burn; the picker steers well clear in fire weather.)
  const fireRisk = !!opts?.fireWeather;
  if (fireRisk && !opts?.counter) {
    cands.push('spread-out');
    if (arc > 0) cands.push('crescent-withdraw');
  }
  // 看破敵陣 — lead with a category that beats the enemy's (攻破守·守克機動·機動繞攻).
  if (opts?.counter) {
    const ec = FORMATION_CAT[opts.counter];
    const want = ec === 'defensive' ? 'offensive' : ec === 'mobile' ? 'defensive' : ec === 'offensive' ? 'mobile' : undefined;
    if (want) cands.push(...(Object.keys(FORMATION_CAT) as FormationId[]).filter((f) => FORMATION_CAT[f] === want));
  }
  // 因軍制宜 — by dominant arm and stance.
  if (opts?.defensive) cands.push('fish-scale', 'square', 'stacked', 'crescent-moon');
  if (cav >= arc && cav >= spe && cav > 0) cands.push('arrow-tip', 'awl');
  if (arc >= cav && arc >= spe && arc > 0) cands.push('wild-goose', 'crescent-withdraw');
  if (spe >= cav && spe > 0) cands.push('yoke', 'square');
  // 智深用奇 — a clever commander reaches for the mystic arts.
  if (commanderInt >= 90) cands.push('eight-trigrams');
  if (commanderInt >= 85) cands.push('five-elements', 'seven-star');
  if (commanderInt >= 80) cands.push('four-symbols', 'back-to-water');
  cands.push('fish-scale', 'square', 'spread-out'); // low-gate fallbacks
  return cands.find(usable) ?? 'none';
}

/** Per-terrain multiplier on damage dealt by attacker. */
const TERRAIN_DAMAGE_MOD: Record<UnitType, Partial<Record<TerrainKind, number>>> = {
  cavalry: { forest: 0.6, mountain: 0.4, river: 0.5, road: 1.2, plain: 1.1, hill: 1.3, marsh: 0.4, chokepoint: 0.7, bridge: 0.8 },
  archers: { forest: 1.1, mountain: 1.15, hill: 1.25, watchtower: 1.25 },
  navy: { river: 1.6, plain: 0.4, mountain: 0.2, forest: 0.5, road: 0.6, bridge: 1.0 },
  siege: { mountain: 0.5, forest: 0.7, river: 0.5, gate: 1.4, hill: 1.1 },
  spearmen: { chokepoint: 1.25 },
  infantry: { chokepoint: 1.1, hill: 1.1 },
};

export function terrainDamageMod(t: UnitType, terrain: TerrainKind): number {
  return TERRAIN_DAMAGE_MOD[t][terrain] ?? 1.0;
}

/** Defender's terrain shield — multiplier on damage TAKEN. <1 = harder to hurt. */
export function defenderTerrainShield(terrain: TerrainKind): number {
  switch (terrain) {
    case 'chokepoint': return 0.7;  // narrow defile — only 1 file can engage
    case 'watchtower': return 0.85; // elevated bowmen
    case 'hill':       return 0.9;  // high ground
    case 'mountain':   return 0.85;
    case 'forest':     return 0.92;
    case 'gate':       return 0.6;  // city gate is tough to crack
    case 'wall':       return 0.5;  // rampart — brutal to assault directly
    default:           return 1.0;
  }
}

/** 巷戰 — is this hex inside the walled enclosure (past the gate, among the
 *  houses)? Defenders fighting on home streets are dug in and hard to dislodge. */
export function insideWalls(b: TacticalBattle, coord: HexCoord): boolean {
  const walls = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate');
  if (walls.length < 3) return false;
  const cols = walls.map((t) => t.coord.col);
  const rows = walls.map((t) => t.coord.row);
  const wWest = Math.min(...cols), wEast = Math.max(...cols);
  const rMin = Math.min(...rows), rMax = Math.max(...rows);
  return coord.col > wWest && coord.col <= wEast && coord.row >= rMin && coord.row <= rMax
    && !walls.some((t) => t.coord.col === coord.col && t.coord.row === coord.row);
}

/**
 * 戰鬥預判 — the same composed math the AI uses (pickAdjacentTarget), surfaced
 * for the player: predicted damage range after unit-type counter + terrain, the
 * counter-attack risk, whether the blow殲滅s the target, and the matchup verdict.
 * Pure — read-only, no battle mutation. Lets the player strategise on the very
 * relationships the AI already exploits (槍克騎, 騎克弓, 弓克槍, 地利).
 */
export interface AttackForecast {
  dmgMin: number; dmgMax: number;
  counterMin: number; counterMax: number;
  willKill: boolean;
  /** Attacker-vs-defender unit-type verdict. */
  matchup: 'strong' | 'weak' | 'even';
  counterMult: number;
  terrainAtk: number;
  defShield: number;
}

export function forecastAttack(
  b: TacticalBattle,
  attacker: TacticalUnit,
  target: TacticalUnit,
  officers: Record<EntityId, Officer>,
): AttackForecast {
  const p = predictAttackDamage(b, attacker, target, officers);
  const ao = officers[attacker.officerId];
  const To = officers[target.officerId];
  const aTerr = tileAt(b, attacker.coord)?.terrain ?? 'plain';
  const dTerr = tileAt(b, target.coord)?.terrain ?? 'plain';
  const ctr = counterMultiplier(attacker.unitType, target.unitType);
  const aTerrMod = terrainDamageMod(attacker.unitType, aTerr);
  const shield = defenderTerrainShield(dTerr);
  const dist = hexDistance(attacker.coord, target.coord);

  // 背刺/側擊 — mirror attackUnits' facing reckoning.
  let fromRear = false; let flankMul = 1.0;
  if (typeof target.facing === 'number') {
    const gap = dirGap(hexDirection(target.coord, attacker.coord), target.facing);
    if (gap === 3) { fromRear = true; flankMul = 1.25; } else if (gap === 2) flankMul = 1.12;
  } else {
    const tf = target.side === 'attacker' ? 1 : -1;
    fromRear = (attacker.coord.col - target.coord.col) * tf < 0;
    flankMul = fromRear ? 1.25 : 1.0;
  }
  const ELEV: Partial<Record<TerrainKind, number>> = { mountain: 2, watchtower: 2, hill: 1 };
  const heightMul = (ELEV[aTerr] ?? 0) > (ELEV[dTerr] ?? 0) ? 1.15 : (ELEV[aTerr] ?? 0) < (ELEV[dTerr] ?? 0) ? 0.92 : 1;
  const pincers = b.units.filter((u) => u.side === attacker.side && u.id !== attacker.id && u.troops > 0 && hexDistance(u.coord, target.coord) === 1).length;
  const pincerMul = 1 + Math.min(0.28, 0.10 * pincers);
  const favor = attacker.side === 'attacker' ? (b.momentum ?? 0) : -(b.momentum ?? 0);
  const momentumMul = 1 + Math.max(-0.04, Math.min(0.05, favor / 2000));
  const aMoraleMul = attacker.morale >= 80 ? 1.06 : attacker.morale <= 15 ? 0.78 : attacker.morale < 40 ? 0.88 : 1;
  const targetRouting = isRouting(target);
  const pursuitMul = targetRouting ? (attacker.unitType === 'cavalry' ? 1.8 : attacker.unitType === 'navy' ? 1.3 : 1.5) : target.morale < 40 ? 1.12 : 1;
  let chargeMul = 1.0; let braced = false;
  const ch = attacker.charge;
  if (ch && ch.dist >= 2 && hexDistance(ch.from, target.coord) >= 2 && attacker.unitType !== 'siege' && attacker.unitType !== 'navy') {
    chargeMul = 1 + Math.min(attacker.unitType === 'cavalry' ? 0.32 : 0.15, (attacker.unitType === 'cavalry' ? 0.09 : 0.045) * (ch.dist - 1));
    if (target.unitType === 'spearmen' && typeof target.facing === 'number' && dirGap(hexDirection(target.coord, attacker.coord), target.facing) <= 1) { braced = true; chargeMul = 0.7; }
  }
  const escapeHexes = hexNeighbours(target.coord).filter((n) => { const t = tileAt(b, n); return t && moveCost(b, n) < 99 && !unitAt(b, n); });
  const encircled = escapeHexes.length === 0 && !target.isSupply;
  const desperate = encircled && !targetRouting;
  const encircleMul = encircled ? (targetRouting ? 1.25 : 0.90) : 1;
  const disorderMul = (attacker.effects.some((e) => e.kind === 'disorder') ? 0.82 : 1) * (target.effects.some((e) => e.kind === 'disorder') ? 1.15 : 1);
  let coverMul = 1.0;
  if (dist > 1) {
    coverMul *= 0.5; // 騷擾之射 — a ranged shot harasses, it doesn't decide
    if (dTerr === 'forest') coverMul *= 0.8;
    if (hexLine(attacker.coord, target.coord).slice(1, -1).some((c) => unitAt(b, c))) coverMul *= 0.85;
    const smoke = smokeOnLine(b, attacker.coord, target.coord); // 煙障迷目
    if (smoke > 0) coverMul *= Math.max(0.45, 1 - 0.28 * smoke);
  }
  const weaponMul = weaponMatchupMul(ao ? deriveWeaponType(ao) : 'none', To ? deriveWeaponType(To) : 'none', target.unitType, fromRear || flankMul > 1).mul;
  const aWoundedMul = ao?.status === 'wounded' ? (ao.woundSeverity === 'critical' ? 0.65 : ao.woundSeverity === 'serious' ? 0.78 : 0.9) : 1;
  const dWoundedMul = To?.status === 'wounded' ? (To.woundSeverity === 'critical' ? 1.3 : To.woundSeverity === 'serious' ? 1.22 : 1.12) : 1;
  const aGradeMul = ao ? gradeCombatBonus(ao).powerMul : 1;
  const dGradeResistMul = To ? 1 - gradeCombatBonus(To).damageResist : 1;
  const nightMul = b.timeOfDay === 'night' ? 0.94 : 1;
  const crossingMul = target.unitType !== 'navy' && (dTerr === 'river' || dTerr === 'bridge') ? 1.25 : 1;
  const streetMul = target.side === 'defender' && insideWalls(b, target.coord) ? 0.82 : 1;
  const freshMul = 1.05 - Math.min(0.30, (attacker.fatigue ?? 0) / 333);
  const fatigueMul = b.turn >= 10 ? Math.max(0.6, 1 - 0.05 * (b.turn - 9)) : 1;

  const armorMul = ARM_ARMOR[target.unitType] ?? 1;
  // predictAttackDamage's base omits COMBAT_LETHALITY — fold it in so the preview
  // matches the real hit.
  const fwd = COMBAT_LETHALITY * ctr * aTerrMod * shield * weaponMul * flankMul * heightMul * pincerMul * momentumMul
    * aMoraleMul * pursuitMul * chargeMul * encircleMul * disorderMul * coverMul
    * aWoundedMul * dWoundedMul * aGradeMul * dGradeResistMul * nightMul * crossingMul * streetMul
    * freshMul * fatigueMul * armorMul;
  const dmgMin = Math.max(0, Math.floor(p.min * fwd));
  const dmgMax = Math.max(0, Math.floor(p.max * fwd));
  const willKill = dmgMax >= target.troops;
  // 反擊 — a foe struck from beyond its reach, or routing, can't retaliate; the
  // rear/braced/desperate factors mirror attackUnits' counter math.
  const targetCanReach = attackRange(target, To) >= dist;
  const noCounter = willKill || targetRouting || !targetCanReach;
  const back = counterMultiplier(target.unitType, attacker.unitType) * (fromRear ? 0.4 : 1) * (braced ? 1.6 : 1) * (desperate ? 1.35 : 1);
  return {
    dmgMin, dmgMax,
    counterMin: noCounter ? 0 : Math.max(0, Math.floor(p.counterMin * back)),
    counterMax: noCounter ? 0 : Math.max(0, Math.floor(p.counterMax * back)),
    willKill,
    matchup: ctr * weaponMul > 1.08 ? 'strong' : ctr * weaponMul < 0.95 ? 'weak' : 'even',
    counterMult: ctr,
    terrainAtk: aTerrMod,
    defShield: shield,
  };
}

/** Short bilingual label for a unit-type counter edge, e.g. 槍克騎 / spear>cav. */
export function matchupLabel(a: UnitType, d: UnitType): { zh: string; en: string } | null {
  const m = counterMultiplier(a, d);
  if (m > 1.05) {
    const Z: Record<string, string> = { spearmen: '槍', cavalry: '騎', archers: '弓', siege: '砲', navy: '舟', infantry: '步' };
    return { zh: `${Z[a]}克${Z[d]}`, en: `${a}>${d}` };
  }
  return null;
}

/** 戰法情境 for a cast in-battle — builds the weather/terrain context from the
 *  board and delegates to the pure `stratagemSituation`. Used by applyStratagem
 *  and surfaced live on the tactic buttons so players can read the conditions. */
export function battleStratagemSituation(
  b: TacticalBattle,
  casterCoord: HexCoord,
  targetCoord: HexCoord,
  stratagem: StratagemId,
): Situation {
  return stratagemSituation(stratagem, {
    weather: b.weather,
    casterTerrain: tileAt(b, casterCoord)?.terrain ?? 'plain',
    targetTerrain: tileAt(b, targetCoord)?.terrain ?? 'plain',
  });
}

/**
 * Pick an appropriate unit type for an officer based on their stats
 * and any unit-type signaling skills.
 */
export function inferUnitType(o: Officer | undefined): UnitType {
  if (!o) return 'infantry';
  if (o.skills.includes('cavalry-master')) return 'cavalry';
  if (o.skills.includes('archer-master')) return 'archers';
  if (o.skills.includes('navy-master')) return 'navy';
  if (o.skills.includes('siegemaster')) return 'siege';
  // Stat-based fallback.
  if (o.stats.war >= 88 && o.stats.leadership >= 80) return 'spearmen';
  if (o.stats.war >= 85) return 'cavalry';
  if (o.stats.intelligence >= 80) return 'archers';
  return 'infantry';
}

// ─── Naval helpers ──────────────────────────────────────────────────────

/**
 * Pick a ship class for a contingent by its size — the flagship anchors the
 * line, big detachments crew proper warships, small ones ride fast skiffs.
 */
export function assignShipClass(troops: number, isCommander: boolean): ShipClass {
  if (isCommander) return 'flagship';
  if (troops >= 6000) return 'da-yi';
  if (troops >= 4000) return 'hai-hu';
  if (troops >= 2500) return 'warship';
  if (troops >= 1800) return 'ge-chuan';  // 戈船 — mid hull, strong against boarders
  if (troops >= 1200) return 'dou-jian';
  return 'zou-ge';
}

/**
 * Hull-strength multiplier on a ship's combat output, derived from its class'
 * combat strength (warship = 200 = 1.0× baseline). A 樓船 flagship hits ~1.4×,
 * a 走舸 skiff ~0.85×.
 */
export function shipPowerMul(shipClass: ShipClass | undefined): number {
  if (!shipClass) return 1;
  const cs = SHIP_CLASSES_BY_ID[shipClass]?.combatStrength ?? 200;
  return Math.max(0.85, Math.min(1.6, 1 + (cs - 200) / 1000));
}

// ─── Hex grid helpers (offset coordinates, "odd-q" flat-top) ──────────

/** Distance between two hexes in offset coords. */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const [ax, ay, az] = offsetToCube(a);
  const [bx, by, bz] = offsetToCube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

function offsetToCube(h: HexCoord): [number, number, number] {
  const x = h.col;
  const z = h.row - (h.col - (h.col & 1)) / 2;
  const y = -x - z;
  return [x, y, z];
}

/** The six cube-coordinate unit directions, for 朝向/側背 reckoning. */
const CUBE_DIRS: ReadonlyArray<readonly [number, number, number]> = [
  [1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1],
];

/** Hex direction (0..5) from one hex toward another — exact for adjacent hexes,
 *  nearest-of-six for farther ones. Drives unit facing + 側背 judgement. */
export function hexDirection(from: HexCoord, to: HexCoord): number {
  const [ax, ay, az] = offsetToCube(from);
  const [bx, by, bz] = offsetToCube(to);
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  let best = 0, bestScore = -Infinity;
  for (let i = 0; i < 6; i++) {
    const [cx, cy, cz] = CUBE_DIRS[i];
    const score = dx * cx + dy * cy + dz * cz;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

/** Circular distance between two hex directions (0..3); 3 = directly opposed. */
function dirGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 6;
  return Math.min(d, 6 - d);
}

/** 久戰疲乏 — fatigue gained per melee blow / volley, recovered per rested turn. */
const FATIGUE_PER_MELEE = 12;
const FATIGUE_PER_VOLLEY = 7;
const FATIGUE_REST = 7;
const FATIGUE_REST_DEFEND = 14;
const FATIGUE_SPENT = 70; // at/above this, a unit fields one fewer AP

/** 軍心動搖 — morale thresholds. At/above HIGH a unit's blows carry élan; at/
 *  below SHAKEN it wavers; at 0 it is 潰走 (routing). */
const MORALE_HIGH = 80;
const MORALE_SHAKEN = 40;

/** 殺傷烈度 — global lethality scalar on base damage. Lower = combat is more
 *  attrition than alpha-strike, so a unit survives the first blow to retaliate
 *  and counters/positioning/terrain/numbers matter (balance-sim tuned). */
const COMBAT_LETHALITY = 0.45;
/** 甲冑輕重 — per-arm durability (incoming-damage multiplier). 步/槍 are the
 *  armoured line: they soak volleys and charges and grind (lower = tougher).
 *  輕騎 is shock, not a shield wall — fast and hard-hitting but soft when caught.
 *  Gives the slow foot a reason to exist and reins in cavalry's dominance. */
const ARM_ARMOR: Partial<Record<UnitType, number>> = {
  infantry: 0.85, spearmen: 0.85, cavalry: 1.3,
};

/** 潰走 — a unit still manned but whose heart has broken (morale 0). It can't
 *  attack, auto-flees toward its own edge, and is run down by pursuers until it
 *  is killed or rallied back above 0. Only troops==0 actually removes it. */
export function isRouting(u: TacticalUnit): boolean {
  return u.troops > 0 && u.morale <= 0;
}

/** The board edge column a routing unit of this side flees toward (where its
 *  army came from): attackers stream back west (col 0), defenders east. */
function homeEdgeCol(b: TacticalBattle, side: 'attacker' | 'defender'): number {
  return side === 'attacker' ? 0 : b.width - 1;
}

/** 時辰推移 — the day wears on: every this-many turn-phases the light steps
 *  dawn → day → dusk → night (a long battle drags into darkness). */
const PHASE_TURNS = 7;
const TIME_SEQUENCE: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

/** Neighbours in offset coords for odd-q flat-top hexes. */
export function hexNeighbours(h: HexCoord): HexCoord[] {
  const odd = (h.col & 1) === 1;
  const deltas = odd
    ? [
        { col: +1, row: 0 }, { col: +1, row: +1 },
        { col: 0,  row: +1 }, { col: -1, row: +1 },
        { col: -1, row: 0 }, { col: 0,  row: -1 },
      ]
    : [
        { col: +1, row: -1 }, { col: +1, row: 0 },
        { col: 0,  row: +1 },  { col: -1, row: 0 },
        { col: -1, row: -1 }, { col: 0,  row: -1 },
      ];
  return deltas.map((d) => ({ col: h.col + d.col, row: h.row + d.row }));
}

// ─── Battle setup ─────────────────────────────────────────────────────

export type WindDirection = 'north' | 'south' | 'east' | 'west' | 'calm';

/** Unit vector a wind blows TOWARD (east wind = blows from west to east →
 *  fire spreads to higher cols). Shared by fire-spread + AI fire-targeting. */
export const WIND_DELTA: Record<WindDirection, { col: number; row: number }> = {
  north: { col: 0, row: -1 },
  south: { col: 0, row: 1 },
  east:  { col: 1, row: 0 },
  west:  { col: -1, row: 0 },
  calm:  { col: 0, row: 0 },
};

export interface SetupParams {
  cityId: EntityId;
  width: number;
  height: number;
  attackerForceId: EntityId | null;
  defenderForceId: EntityId | null;
  attackers: Array<{ officer: Officer; troops: number; unitType?: UnitType }>;
  defenders: Array<{ officer: Officer; troops: number; unitType?: UnitType }>;
  attackerFormation?: FormationId;
  defenderFormation?: FormationId;
  attackerObjective?: BattleObjective;
  defenderObjective?: BattleObjective;
  weather?: Weather;
  timeOfDay?: TimeOfDay;
  /** Wind direction (snapshot of strategic weather). Biases fire spread. */
  windDirection?: WindDirection;
  reinforcements?: Reinforcement[];
  /** Pre-rolled scripted map (overrides city-based lookup). */
  namedMapId?: EntityId;
  /** Build slots from the defender's city — placed on the hex grid as fixed structures. */
  buildSlots?: ReadonlyArray<{ slot: number; buildingId?: import('../data/defenseBuildings').DefenseBuildingId; level: number }>;
  /** Strategic 施設 — nearby ranged facilities (箭樓/投石臺) owned by the
   *  defender appear on the board as auto-firing emplacements. */
  forts?: Record<EntityId, Fort>;
  /** Geography hint (terrain category, port flag, coords) — drives terrain generation. */
  terrainHint?: TerrainHint;
  /** Real-map placement (anchor + approach bearing) — when set, the
   *  battlefield samples the actual strategic-map geography. */
  battleGeo?: import('./battlefieldTerrain').BattleGeo;
  /** Siege approach (攻城方略): storm the walls as-is (default), invest
   *  the city until the granaries run dry (圍困 — defenders start the
   *  assault starving and shaken), or break the dikes and flood it
   *  (水攻 — riverside cities only: washed-out wall breaches, floodwater
   *  at the foot of the walls, drowned and demoralised garrison). */
  siegeWorks?: 'storm' | 'invest' | 'flood';
  /** Field battle (army vs army in the open) — no city, so no rampart wall. */
  field?: boolean;
  /** 疲勞 — points the attacker's units open at below full morale (a forced-marched
   *  column arrives weary; 以逸待勞). Default 0. */
  attackerFatigue?: number;
}

// (Legacy TERRAIN_RNG_SEED removed — terrain generation now lives in
// battlefieldTerrain.ts which seeds its own RNG from the cityId.)

/**
 * Peace-time preview of the same battlefield a tactical battle would use,
 * without any units. Used by CityMapScreen to show players where their
 * defense structures will appear in actual combat.
 */
export interface BattlefieldPreview {
  width: number;
  height: number;
  tiles: TacticalTile[];
  weather: Weather;
  timeOfDay: TimeOfDay;
  specialTiles: NamedBattleMap['specialTiles'];
  /** Hex coords where the 8 build slots map to. */
  slotPositions: HexCoord[];
  namedMapName?: { zh: string; en: string };
}

export function previewBattlefield(
  cityId: EntityId,
  hint: TerrainHint = {},
  fallbackWidth = 14,
  fallbackHeight = 10,
  // When true, ignore any named tactical map and use the fallback size — the
  // city-interior view wants a consistently large grid for every city.
  forceSize = false,
): BattlefieldPreview {
  const namedMapId = forceSize ? undefined : NAMED_MAPS_BY_CITY[cityId];
  const namedMap: NamedBattleMap | undefined = namedMapId
    ? NAMED_MAPS_BY_ID[namedMapId]
    : undefined;
  const width = namedMap?.width ?? fallbackWidth;
  const height = namedMap?.height ?? fallbackHeight;
  const tiles = generateTerrain(cityId, width, height, hint, namedMap?.terrainOverrides);
  return {
    width, height, tiles,
    weather: namedMap?.weather ?? 'clear',
    timeOfDay: namedMap?.timeOfDay ?? 'day',
    specialTiles: namedMap?.specialTiles ?? [],
    slotPositions: computeSlotPositions(width, height),
    namedMapName: namedMap?.name,
  };
}


/**
 * 馳援 — plan relief columns for a besieged city: up to two neighbouring
 * cities of the defender's force each dispatch ~30% of their garrison
 * under their best idle officer, arriving mid-battle from the map edge
 * that matches their true direction (battle grid is oriented along the
 * approach bearing). The caller deducts the troops and records the plans
 * on the battle for the post-battle return trip.
 */
export function planSiegeRelief(args: {
  target: City;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  defenderForceId: EntityId | null;
  bearing: number;
}): { reinforcements: Reinforcement[]; plans: Array<{ cityId: EntityId; officerId: EntityId; troops: number }> } {
  const out: { reinforcements: Reinforcement[]; plans: Array<{ cityId: EntityId; officerId: EntityId; troops: number }> } = { reinforcements: [], plans: [] };
  if (!args.defenderForceId) return out;
  const tp = cityPos(args.target);
  const neighbours = (args.target.adjacentCityIds ?? [])
    .map((id) => args.cities[id])
    .filter((c): c is City => !!c && c.ownerForceId === args.defenderForceId && c.troops >= 3000)
    .sort((a, b) => b.troops - a.troops)
    .slice(0, 2);
  for (const relief of neighbours) {
    const officer = Object.values(args.officers)
      .filter((o) => o.locationCityId === relief.id && o.forceId === args.defenderForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && !o.task)
      .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4))[0];
    if (!officer) continue;
    const troops = Math.floor(relief.troops * 0.3);
    if (troops < 800) continue;
    // Map the relief city's true direction into battle-grid space (the
    // grid's +col axis runs along the approach bearing).
    const rp = cityPos(relief);
    const rel = Math.atan2(rp.y - tp.y, rp.x - tp.x) - args.bearing;
    const dc = Math.cos(rel);
    const dr = Math.sin(rel);
    const edge: Reinforcement['edge'] = Math.abs(dc) > Math.abs(dr)
      ? (dc > 0 ? 'east' : 'west')
      : (dr > 0 ? 'south' : 'north');
    out.reinforcements.push({
      arriveTurn: out.reinforcements.length === 0 ? 4 : 6,
      side: 'defender',
      officerId: officer.id,
      troops,
      unitType: inferUnitType(officer),
      edge,
      announcement: `${relief.name.zh}馳援！${officer.name.zh}率 ${troops.toLocaleString()} 殺到！`,
    });
    out.plans.push({ cityId: relief.id, officerId: officer.id, troops });
  }
  return out;
}

/** Roll the hour a battle opens at — most assaults go in by day, but
 *  some come at dusk or in the dead of night (夜戰). */
export function rollTimeOfDay(r: number = Math.random()): TimeOfDay {
  if (r < 0.15) return 'night';
  if (r < 0.27) return 'dusk';
  if (r < 0.34) return 'dawn';
  return 'day';
}

export function setupTacticalBattle(p: SetupParams): TacticalBattle {
  // Named map override?
  const namedMapId = p.namedMapId ?? NAMED_MAPS_BY_CITY[p.cityId];
  const namedMap: NamedBattleMap | undefined = namedMapId
    ? NAMED_MAPS_BY_ID[namedMapId]
    : undefined;
  const width = namedMap?.width ?? p.width;
  const height = namedMap?.height ?? p.height;
  const weather: Weather = namedMap?.weather ?? p.weather ?? 'clear';
  const timeOfDay: TimeOfDay = namedMap?.timeOfDay ?? p.timeOfDay ?? 'day';

  // A water city (and no scripted named-map terrain) makes this a naval
  // engagement: open-water board, every contingent crews a ship.
  const isNaval = !namedMap && p.terrainHint?.terrain === 'water';

  // Geography-aware terrain — uses the city's terrain/port/coords if provided.
  // With battleGeo (and no scripted named map) the grid samples the REAL
  // strategic map along the approach bearing.
  const tiles = generateTerrain(
    p.cityId,
    width,
    height,
    { ...(p.terrainHint ?? {}), naval: isNaval },
    namedMap?.terrainOverrides,
    namedMap ? undefined : p.battleGeo,
  );

  const placeUnits = (
    pool: Array<{ officer: Officer; troops: number; unitType?: UnitType }>,
    side: 'attacker' | 'defender',
  ): TacticalUnit[] => {
    // Front column at the edge; back column one hex inland for larger armies.
    const frontCol = side === 'attacker' ? 0 : width - 1;
    const backCol  = side === 'attacker' ? 1 : width - 2;
    // Front rank takes the most units height permits; overflow goes to back rank.
    const frontRankCapacity = height; // can fill the whole column if needed
    // Spawn placement is terrain-aware: a land unit must not materialise in a
    // river or inside a wall (map-ruxukou's mid-field river caught commanders
    // standing in the water). Nearest standable row wins; taken rows skip.
    const tileTerrainAt = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    const takenSpawns = new Set<string>();
    const standable = (col: number, row: number) => {
      if (isNaval) return true; // every contingent is a ship — water is home
      const g = tileTerrainAt.get(`${col},${row}`);
      return g !== 'river' && g !== 'wall' && g !== 'gate';
    };
    const settleRow = (col: number, wantRow: number): number => {
      for (let d = 0; d < height; d++) {
        for (const candidate of d === 0 ? [wantRow] : [wantRow - d, wantRow + d]) {
          if (candidate < 0 || candidate >= height) continue;
          const key = `${col},${candidate}`;
          if (takenSpawns.has(key)) continue;
          if (!standable(col, candidate)) continue;
          takenSpawns.add(key);
          return candidate;
        }
      }
      return Math.max(0, Math.min(height - 1, wantRow)); // pathological map — give up gracefully
    };
    return pool.slice(0, frontRankCapacity * 2).map((entry, i) => {
      const isBackRank = i >= frontRankCapacity;
      const rankIndex = isBackRank ? i - frontRankCapacity : i;
      // Interleave around the vertical center: 0, +1, -1, +2, -2, ...
      const row = Math.floor(height / 2)
        + (rankIndex % 2 === 0 ? -Math.floor(rankIndex / 2) : Math.floor((rankIndex + 1) / 2));
      // In a naval battle every contingent is a ship crew, regardless of the
      // officer's land specialty.
      const unitType = isNaval ? 'navy' : (entry.unitType ?? inferUnitType(entry.officer));
      const isCommander = i === 0;
      const shipClass = isNaval ? assignShipClass(entry.troops, isCommander) : undefined;
      const maxAp = unitType === 'cavalry' ? 4 : unitType === 'siege' ? 2 : 3;
      const uCol = isBackRank ? backCol : frontCol;
      const coord = { col: uCol, row: settleRow(uCol, Math.max(0, Math.min(height - 1, row))) };
      // 朝向 — units open facing the enemy edge (attacker rightward, defender left).
      const facing = hexDirection(coord, { col: coord.col + (side === 'attacker' ? 2 : -2), row: coord.row });
      // 弓矢 — only ranged arms carry a volley count.
      const maxAmmo = unitType === 'archers' ? 3 : unitType === 'siege' ? 3 : unitType === 'navy' ? 3 : 0;
      return {
        id: `${side}-${entry.officer.id}`,
        officerId: entry.officer.id,
        side,
        coord,
        troops: entry.troops,
        maxTroops: entry.troops,
        ap: maxAp,
        maxAp,
        // 疲勞 / 都督之旗 — a forced-marched attacker opens below full morale; a
        // legion banner offsets it (negative fatigue) but can't exceed full.
        morale: side === 'attacker' ? Math.min(100, Math.max(40, 100 - (p.attackerFatigue ?? 0))) : 100,
        isCommander,
        effects: [],
        unitType,
        fatigue: 0,
        facing,
        ...(maxAmmo > 0 ? { ammo: maxAmmo, maxAmmo } : {}),
        ...(shipClass ? { shipClass } : {}),
      };
    });
  };

  const units = [
    ...placeUnits(p.attackers, 'attacker'),
    ...placeUnits(p.defenders, 'defender'),
  ];

  // Generate spawn voice lines for famous officers.
  const log: TacticalBattle['log'] = [];
  // 戰役腳本 — a named historical battle opens with its scene-setting line.
  if (namedMap?.introZh || namedMap?.introEn) {
    log.push({ turn: 1, text: namedMap.introEn ?? namedMap.introZh ?? '', kind: 'event' });
  }
  for (const u of units) {
    const voice = pickVoiceLine(u.officerId, 'spawn', Math.random);
    if (voice) {
      log.push({ turn: 1, text: voice, speaker: u.officerId, kind: 'voice' });
    }
  }

  // Place city defense structures on the defender's edge — 8 compass-rose
  // slots map to a 2-column band on the right (defender) side of the map.
  const cityStructures: TacticalBattle['cityStructures'] = [];
  if (p.buildSlots && p.buildSlots.length > 0) {
    // Even-distributed positions in the rightmost 2 columns.
    const SLOT_TO_HEX = computeSlotPositions(width, height);
    // Track which hex coords are already occupied by units so we don't overlap.
    const taken = new Set(units.map((u) => `${u.coord.col},${u.coord.row}`));
    // Real-geo battlefields can put water inside the city's band — no
    // towers in the river (the water itself is the defence there).
    const tileTerrain = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    for (const slot of p.buildSlots) {
      if (!slot.buildingId) continue;
      const target = SLOT_TO_HEX[slot.slot];
      if (!target) continue;
      const key = `${target.col},${target.row}`;
      if (taken.has(key)) continue;  // skip if conflicting with a unit
      const ground = tileTerrain.get(key);
      if (ground === 'river' || ground === 'bridge') continue; // no building in the water
      taken.add(key);
      cityStructures.push({
        slotIndex: slot.slot,
        buildingId: slot.buildingId,
        level: slot.level,
        coord: target,
        hp: 100 * slot.level + 100,
      });
    }
  }

  // 施設參戰 — strategic ranged facilities (箭樓/投石臺) the defender has built
  // within range of this battlefield join the fight as auto-firing emplacements,
  // exactly like the city's own perimeter defences. (Built directly into the
  // cityStructures list so the existing auto-attack handles them.)
  const facilityWallCoords: HexCoord[] = [];
  if (p.forts && p.battleGeo && p.defenderForceId) {
    const FACILITY_TO_BUILDING: Partial<Record<import('../types/fort').FacilityKind, import('../data/defenseBuildings').DefenseBuildingId>> = {
      tower: 'watchtower',
      catapult: 'arrow-platform',
      camp: 'barracks-out', // 陣 — rallies adjacent defenders each turn
    };
    const taken = new Set([
      ...units.map((u) => `${u.coord.col},${u.coord.row}`),
      ...cityStructures.map((s) => `${s.coord.col},${s.coord.row}`),
    ]);
    const tileTerrain2 = new Map(tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
    // Candidate emplacement hexes on the defender's side (right band), inland a
    // little from the very edge so they sit behind the line.
    const candidates: HexCoord[] = [];
    for (let col = width - 2; col >= width - 4 && col >= 0; col--) {
      for (let row = 1; row < height - 1; row += 2) candidates.push({ col, row });
    }
    let ci = 0;
    for (const f of Object.values(p.forts)) {
      if (!f.facility || f.ownerForceId !== p.defenderForceId) continue;
      const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
      if (Math.hypot(fx - p.battleGeo.x, fy - p.battleGeo.y) > FACILITY_DEFS[f.facility].range) continue;
      // 防壁 — a barricade in range throws a short destructible wall line
      // across the mid-field instead of an emplacement.
      if (f.facility === 'wall') {
        const wallCol = Math.max(2, width - 6);
        const midRow = Math.floor(height / 2);
        for (const row of [midRow - 1, midRow, midRow + 1]) {
          const key = `${wallCol},${row}`;
          if (taken.has(key)) continue;
          const g = tileTerrain2.get(key);
          if (g === 'river' || g === 'bridge' || g === 'wall' || g === 'gate') continue;
          facilityWallCoords.push({ col: wallCol, row });
          taken.add(key);
        }
        continue;
      }
      const buildingId = FACILITY_TO_BUILDING[f.facility];
      if (!buildingId) continue;
      // Find the next free, dry candidate hex.
      while (ci < candidates.length) {
        const c = candidates[ci++];
        const key = `${c.col},${c.row}`;
        if (taken.has(key)) continue;
        const g = tileTerrain2.get(key);
        if (g === 'river' || g === 'bridge' || g === 'wall' || g === 'gate') continue;
        taken.add(key);
        cityStructures.push({
          slotIndex: 100 + cityStructures.length, // synthetic — not a city slot
          buildingId,
          level: 2,
          coord: c,
          hp: 300,
        });
        break;
      }
    }
  }

  // Ambush setup: units of a side using the ten-ambush formation that
  // begin on forest tiles start hidden. Revealed when an enemy moves
  // adjacent, or when the hidden unit itself attacks.
  const ambushSides = new Set<'attacker' | 'defender'>();
  if (p.attackerFormation === 'ten-ambush') ambushSides.add('attacker');
  if (p.defenderFormation === 'ten-ambush') ambushSides.add('defender');
  // Defender prep advantage: starts the fight with +10 morale (they had
  // time to dig in, brief troops, post lookouts).
  const finalUnits = units.map((u) => {
    let next: TacticalUnit = u;
    if (ambushSides.has(u.side)) {
      const tile = tiles.find((t) => t.coord.col === u.coord.col && t.coord.row === u.coord.row);
      if (tile?.terrain === 'forest') next = { ...next, hidden: true };
    }
    if (u.side === 'defender') {
      next = { ...next, morale: Math.min(100, next.morale + 10) };
    }
    return next;
  });

  // ── City walls. A procedural siege raises a walled town on the defender
  // side: west face (toward the attacker) with the main gate on the road
  // row, north + south faces each with their own gate, the back open to the
  // map edge (the far city sprawls off-field — also the long flanking route,
  // so an army without siege gear never hard-stalls). Pass cities (劍閣/
  // 虎牢…) keep the single wall line plugging their corridor. Named maps,
  // field battles and naval engagements stay unwalled.
  let battleTiles = tiles;
  let wallHp: Record<string, number> | undefined;
  let enclosure: { westCol: number; r0: number; r1: number; gateRow: number } | null = null;
  if (!isNaval && !p.field && !namedMap && width >= 8 && height >= 6) {
    const occupied = new Set(finalUnits.map((u) => `${u.coord.col},${u.coord.row}`));
    const hp: Record<string, number> = {};
    const gateRow = Math.floor(height / 2);
    if (p.terrainHint?.terrain === 'pass') {
      // Mountain fort — one wall line across the corridor.
      const wallCol = Math.max(2, width - 3);
      const r0 = Math.floor(height * 0.28);
      const r1 = Math.ceil(height * 0.72) - 1;
      battleTiles = tiles.map((t) => {
        if (t.coord.col !== wallCol || t.coord.row < r0 || t.coord.row > r1) return t;
        const key = `${t.coord.col},${t.coord.row}`;
        if (occupied.has(key)) return t; // never wall over a unit
        if (t.coord.row === gateRow) {
          hp[key] = 700;
          return { ...t, terrain: 'gate' as TerrainKind };
        }
        if (t.terrain === 'river') return t;
        hp[key] = 1000;
        return { ...t, terrain: 'wall' as TerrainKind };
      });
    } else {
      // Walled town (城郭) — three faces + gates; 贴水而建: any face the
      // real map runs a river along stays open water (the river is that
      // side's defence — 襄陽 on the 漢水), so which faces you can assault
      // depends on the actual geography. 四面看地形.
      const westCol = Math.max(2, width - 4);
      const r0 = Math.floor(height * 0.28);          // north face row
      const r1 = Math.ceil(height * 0.72) - 1;       // south face row
      const sideGateCol = Math.min(width - 2, westCol + 2);
      enclosure = { westCol, r0, r1, gateRow };
      battleTiles = tiles.map((t) => {
        const { col, row } = t.coord;
        const key = `${col},${row}`;
        const onWest = col === westCol && row >= r0 && row <= r1;
        // North/south faces stop one column short of the map edge — the
        // rear corners stay open as back alleys into the far quarter, so
        // an army without siege gear can still flank in (and the garrison
        // can sally out) instead of hard-stalling at sealed walls.
        const onNorth = row === r0 && col > westCol && col < width - 1;
        const onSouth = row === r1 && col > westCol && col < width - 1;
        if (!onWest && !onNorth && !onSouth) {
          // Interior streets — the town is built on level ground.
          if (col > westCol && row > r0 && row < r1
            && (t.terrain === 'mountain' || t.terrain === 'hill' || t.terrain === 'forest')) {
            return { ...t, terrain: 'plain' as TerrainKind };
          }
          return t;
        }
        if (occupied.has(key)) return t; // never wall over a unit
        const isGate = (onWest && row === gateRow) || ((onNorth || onSouth) && col === sideGateCol);
        if (t.terrain === 'river' && !isGate) return t;  // water face
        hp[key] = isGate ? 700 : 1000;
        return { ...t, terrain: (isGate ? 'gate' : 'wall') as TerrainKind };
      });
    }
    if (Object.keys(hp).length > 0) wallHp = hp;
  }

  // ── 攻城方略 — siege works applied over the raised defences ──
  let workedUnits = finalUnits;
  // (No !namedMap here — the invest debuff touches only units, and the
  // attacker already paid the grain; scripted fields starve the same. Same
  // precedent as the flood fallback below.)
  if (!isNaval && !p.field && p.siegeWorks === 'invest') {
    // 圍困 — the city was invested until the granaries ran dry: the
    // garrison opens the assault starving and shaken.
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          morale: Math.max(30, u.morale - 30),
          effects: [...u.effects, { kind: 'starving' as const, turnsLeft: 99 }],
        }
      : u);
    log.push({ turn: 1, text: '圍困日久，城中糧盡 — 守軍飢疲，士氣大墮。', kind: 'event' });
  }
  if (p.siegeWorks === 'flood' && enclosure && wallHp) {
    // 水攻 — the dikes are broken upstream: floodwater pools at the foot
    // of the walls, washes out wall segments, and drowns part of the
    // garrison (水淹七軍).
    const { westCol, r0, r1, gateRow } = enclosure;
    const washed = battleTiles
      .filter((t) => t.terrain === 'wall')
      .sort((a, b) => ((a.coord.row * 31 + a.coord.col * 7) % 11) - ((b.coord.row * 31 + b.coord.col * 7) % 11))
      .slice(0, 3)
      .map((t) => `${t.coord.col},${t.coord.row}`);
    const washedSet = new Set(washed);
    battleTiles = battleTiles.map((t) => {
      const key = `${t.coord.col},${t.coord.row}`;
      if (washedSet.has(key)) return { ...t, terrain: 'river' as TerrainKind };
      // Floodwater pooled along the western approach — the causeway (road
      // row) stays above the water.
      if (t.coord.col === westCol - 1 && t.coord.row >= r0 && t.coord.row <= r1
        && t.coord.row !== gateRow
        && (t.terrain === 'plain' || t.terrain === 'road' || t.terrain === 'marsh' || t.terrain === 'forest')) {
        return { ...t, terrain: 'river' as TerrainKind };
      }
      return t;
    });
    const nextHp = { ...wallHp };
    for (const key of washed) delete nextHp[key];
    wallHp = Object.keys(nextHp).length > 0 ? nextHp : undefined;
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          troops: Math.max(1, Math.floor(u.troops * 0.88)),
          maxTroops: Math.max(1, Math.floor(u.maxTroops * 0.88)),
          morale: Math.max(30, u.morale - 20),
        }
      : u);
    log.push({ turn: 1, text: '決堤！洪水灌城，城牆崩毀數段 — 守軍溺損，軍心動搖。', kind: 'event' });
  } else if (p.siegeWorks === 'flood') {
    // Scripted (named) battlefields have no procedural enclosure to wash out —
    // but the attacker still PAID for breaking the dikes, so the drowning
    // debuff lands regardless (the famous fields are riverside cities anyway).
    workedUnits = workedUnits.map((u) => u.side === 'defender'
      ? {
          ...u,
          troops: Math.max(1, Math.floor(u.troops * 0.88)),
          maxTroops: Math.max(1, Math.floor(u.maxTroops * 0.88)),
          morale: Math.max(30, u.morale - 20),
        }
      : u);
    log.push({ turn: 1, text: '決堤！洪水漫野 — 守軍溺損，軍心動搖。', kind: 'event' });
  }

  // 防壁參戰 — a strategic barricade in range throws a short destructible
  // wall line across the mid-field (siege gear batters it down like any wall).
  if (facilityWallCoords.length > 0) {
    const wallKeys = new Set(facilityWallCoords.map((c) => `${c.col},${c.row}`));
    battleTiles = battleTiles.map((t) =>
      wallKeys.has(`${t.coord.col},${t.coord.row}`) ? { ...t, terrain: 'wall' as TerrainKind } : t);
    const hp = { ...(wallHp ?? {}) };
    for (const key of wallKeys) hp[key] = 400;
    wallHp = hp;
    log.push({ turn: 1, text: '防壁橫亙中野 — 敵軍須拔除方可長驅。', kind: 'event' });
  }

  // 糧車 — a named map's wagon/supply tile fields a slow, lightly-manned grain
  // convoy for the defender. Reduce it to nothing and the garrison starves
  // (endTurn's 燒糧 handler). Opt-in via map design, so procedural sieges are
  // untouched. The cart has no real officer (defends at baseline stats).
  const supplyTiles = (namedMap?.specialTiles ?? []).filter((s) => s.role === 'wagon' || s.role === 'supply');
  if (supplyTiles.length > 0) {
    const occupied = new Set(workedUnits.map((u) => `${u.coord.col},${u.coord.row}`));
    supplyTiles.forEach((st, i) => {
      const key = `${st.coord.col},${st.coord.row}`;
      if (occupied.has(key)) return;
      occupied.add(key);
      workedUnits = [
        ...workedUnits,
        {
          id: `defender-supply-${i}`,
          officerId: `supply-${i}`,
          side: 'defender',
          coord: st.coord,
          troops: 1500,
          maxTroops: 1500,
          ap: 1,
          maxAp: 1,
          morale: 100,
          isCommander: false,
          effects: [],
          unitType: 'infantry',
          isSupply: true,
        },
      ];
    });
    if (workedUnits.some((u) => u.isSupply)) {
      log.push({ turn: 1, text: '糧車屯於陣後 — 守之則安,失之則餓。', kind: 'event' });
    }
  }

  return {
    id: `tac-${p.cityId}-${Date.now()}`,
    cityId: p.cityId,
    attackerForceId: p.attackerForceId,
    defenderForceId: p.defenderForceId,
    width,
    height,
    tiles: battleTiles,
    units: workedUnits,
    turn: 1,
    activeSide: 'attacker',
    stratagemCooldowns: {},
    attackerLosses: 0,
    defenderLosses: 0,
    startTroops: {
      attacker: workedUnits.filter((u) => u.side === 'attacker').reduce((s, u) => s + u.maxTroops, 0),
      defender: workedUnits.filter((u) => u.side === 'defender').reduce((s, u) => s + u.maxTroops, 0),
    },
    attackerFormation: p.attackerFormation ?? 'none',
    defenderFormation: p.defenderFormation ?? 'none',
    attackerObjective: p.attackerObjective ?? namedMap?.attackerObjective,
    defenderObjective: p.defenderObjective ?? namedMap?.defenderObjective,
    weather,
    timeOfDay,
    windDirection: p.windDirection ?? 'calm',
    reinforcements: [...(namedMap?.reinforcements ?? []), ...(p.reinforcements ?? [])],
    specialTiles: namedMap?.specialTiles ?? [],
    damagePopups: [],
    log,
    cityStructures: cityStructures.length > 0 ? cityStructures : undefined,
    naval: isNaval || undefined,
    wallHp,
    field: p.field || undefined,
    // The board's window into the strategic map — lets every view (this battle,
    // the city map, the world map) describe where it sits in one coordinate
    // space, so a "you are here" locator and zoom transitions line up.
    geoAnchor: p.battleGeo
      ? { x: p.battleGeo.x, y: p.battleGeo.y, bearing: p.battleGeo.bearing, anchorCol: p.battleGeo.anchorCol }
      : undefined,
  };
}

/**
 * Maps the 8 compass-rose slot indices (N/NE/E/SE/S/SW/W/NW) to hex coords
 * on the defender's side of the battlefield (rightmost 2 columns).
 */
export function computeSlotPositions(width: number, height: number): HexCoord[] {
  const colA = width - 1;       // defender's edge column
  const colB = Math.max(0, width - 2); // one hex inland
  const rows = {
    top:    Math.max(0, Math.floor(height * 0.15)),
    upper:  Math.max(0, Math.floor(height * 0.30)),
    mid:    Math.floor(height / 2),
    lower:  Math.min(height - 1, Math.floor(height * 0.70)),
    bottom: Math.min(height - 1, Math.floor(height * 0.85)),
  };
  // Index order matches SLOT_POSITIONS in defenseBuildings.ts: N, NE, E, SE, S, SW, W, NW
  return [
    { col: colB, row: rows.top },     // 0 N
    { col: colA, row: rows.top },     // 1 NE
    { col: colA, row: rows.mid },     // 2 E
    { col: colA, row: rows.bottom },  // 3 SE
    { col: colB, row: rows.bottom },  // 4 S
    { col: colB, row: rows.lower },   // 5 SW
    { col: colB, row: rows.mid },     // 6 W
    { col: colB, row: rows.upper },   // 7 NW
  ];
}

// ─── Action processing ────────────────────────────────────────────────

const TERRAIN_MOVE_COST: Record<TerrainKind, number> = {
  plain: 1,
  road: 1,    // road cost = 1 (no bonus in this simple model)
  ice: 2,     // 冰面 — crossable but slow and slippery
  forest: 2,
  mountain: 3,
  river: 3,
  hill: 2,
  marsh: 3,       // boggy ground
  desert: 2,      // 沙磧 — loose sand drags on foot
  chokepoint: 1,  // narrow but flat
  bridge: 1,      // crosses river cheaply
  gate: 99,       // impassable until siege breaks it (handled elsewhere)
  wall: 99,       // impassable rampart until battered down (handled elsewhere)
  watchtower: 2,  // climbable
};

export function tileAt(b: TacticalBattle, c: HexCoord): TacticalTile | undefined {
  return b.tiles.find((t) => t.coord.col === c.col && t.coord.row === c.row);
}

export function unitAt(b: TacticalBattle, c: HexCoord): TacticalUnit | undefined {
  return b.units.find(
    (u) =>
      u.coord.col === c.col &&
      u.coord.row === c.row &&
      u.troops > 0,
  );
}

/** 天候入地 — rain churns open ground into mud and snow blankets it, dragging on
 *  the march; firm/covered footing (wall/gate/bridge/chokepoint/forest) is spared.
 *  Returns the extra move cost the current weather adds to a terrain. */
export function weatherMoveSurcharge(weather: Weather, terrain: TerrainKind): number {
  const soft = terrain === 'plain' || terrain === 'road' || terrain === 'desert' || terrain === 'marsh' || terrain === 'hill';
  if (weather === 'rain' && soft) return 1;   // 泥濘
  if (weather === 'snow' && soft) return 1;    // 積雪
  return 0;
}

export function moveCost(b: TacticalBattle, to: HexCoord): number {
  const t = tileAt(b, to);
  if (!t) return Infinity;
  const base = TERRAIN_MOVE_COST[t.terrain];
  if (base >= 99) return base; // impassable stays impassable
  return base + weatherMoveSurcharge(b.weather, t.terrain);
}

/** Enemies (living, visible) currently adjacent to a unit — its zone-of-control
 *  captors. Breaking away from all of them costs an extra AP. */
function engagedFoes(b: TacticalBattle, unit: TacticalUnit): TacticalUnit[] {
  return b.units.filter(
    (e) => e.side !== unit.side && e.troops > 0 && !e.hidden && hexDistance(e.coord, unit.coord) === 1,
  );
}

/**
 * Movement cost into a hex including a +1 zone-of-control surcharge when the
 * unit breaks contact with every enemy it was engaged with — melee is sticky,
 * so peeling a unit off the line costs extra. Repositioning while staying in
 * contact is free of the surcharge.
 */
export function movementCost(b: TacticalBattle, unit: TacticalUnit, to: HexCoord): number {
  let base = moveCost(b, to);
  // The garrison opens its own gates — defenders pass gate hexes (slowly);
  // attackers still have to break them down.
  if (base >= 99 && unit.side === 'defender' && tileAt(b, to)?.terrain === 'gate') base = 2;
  if (base >= 99) return base;
  const foes = engagedFoes(b, unit);
  if (foes.length === 0) return base;
  const stillEngaged = foes.some((e) => hexDistance(e.coord, to) === 1);
  return stillEngaged ? base : base + 1;
}

export function canMove(
  b: TacticalBattle,
  unit: TacticalUnit,
  to: HexCoord,
): boolean {
  if (unit.ap <= 0) return false;
  const dist = hexDistance(unit.coord, to);
  if (dist !== 1) return false;
  const cost = movementCost(b, unit, to);
  if (cost > unit.ap) return false;
  if (unitAt(b, to)) return false;
  return true;
}

export function moveUnit(
  b: TacticalBattle,
  unitId: EntityId,
  to: HexCoord,
): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || !canMove(b, unit, to)) return b;
  const cost = movementCost(b, unit, to);
  // Reveal any hidden enemy that just became adjacent to the moved unit
  // (and any hidden unit adjacent to a watchtower the moved unit reveals).
  const adj = hexNeighbours(to);
  // 衝鋒蓄力 — accumulate the run as NET displacement from where it began this
  // turn (doubling back doesn't build momentum; odd-q "straight" lines that
  // zigzag in cube space still count, since hexDistance is the true metric).
  const stepDir = hexDirection(unit.coord, to);
  const runFrom = unit.charge?.from ?? unit.coord;
  const nextCharge = { from: runFrom, dist: hexDistance(runFrom, to) };
  // 半渡之亂 — fording a river breaks the ranks; the unit lands disordered (a
  // bridge is a built crossing, so it doesn't). Ships are at home on the water.
  const forded = tileAt(b, to)?.terrain === 'river' && unit.unitType !== 'navy';
  let next: TacticalBattle = {
    ...b,
    units: b.units.map((u) => {
      if (u.id === unitId) {
        const effects = forded && !u.effects.some((e) => e.kind === 'disorder')
          ? [...u.effects, { kind: 'disorder' as const, turnsLeft: 1 }]
          : u.effects;
        return { ...u, coord: to, ap: u.ap - cost, facing: stepDir, charge: nextCharge, effects };
      }
      // Hidden enemy of the moving unit, now adjacent? Reveal.
      if (u.hidden && u.side !== unit.side &&
          adj.some((n) => n.col === u.coord.col && n.row === u.coord.row)) {
        return { ...u, hidden: false };
      }
      return u;
    }),
  };
  // 決堤水淹 — reaching the dam tile breaks it; the surge sweeps every unit
  // caught on the water (river/bridge), friend or foe alike (水淹七軍).
  if (!next.damBroken) {
    const dam = (next.specialTiles ?? []).find(
      (s) => (s.label.zh.includes('堰') || s.label.zh.includes('堤'))
        && s.coord.col === to.col && s.coord.row === to.row,
    );
    if (dam) {
      const terrAt = new Map(next.tiles.map((t) => [`${t.coord.col},${t.coord.row}`, t.terrain]));
      next = {
        ...next,
        damBroken: true,
        units: next.units.map((u) => {
          const terr = terrAt.get(`${u.coord.col},${u.coord.row}`);
          return u.troops > 0 && (terr === 'river' || terr === 'bridge')
            ? { ...u, troops: Math.max(0, u.troops - Math.floor(u.maxTroops * 0.25)), morale: Math.max(0, u.morale - 20) }
            : u;
        }),
        damagePopups: [...(next.damagePopups ?? []), { id: `flood-${Date.now()}`, coord: to, text: '決堤!', color: '#3a9ad0', spawnedAt: Date.now() }],
        log: [...(next.log ?? []), { turn: next.turn, text: '決堤!漢水滔滔,下游盡成澤國 — 水淹七軍!', kind: 'event' as const }],
      };
    }
  }
  return next;
}

/**
 * 尋徑 — cheapest path from a unit to an empty destination hex, by terrain move
 * cost (Dijkstra over the hex grid). Returns the ordered steps AFTER the start
 * (last entry === dest), or [] if the destination is occupied/unreachable.
 * Plans on terrain only; the actual walk re-checks AP and zone-of-control per
 * step, so the surcharge for breaking contact is paid at execution, not here.
 */
export function findPath(b: TacticalBattle, unit: TacticalUnit, dest: HexCoord): HexCoord[] {
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  const startK = key(unit.coord);
  const destK = key(dest);
  if (startK === destK) return [];
  if (unitAt(b, dest)) return [];
  if (!tileAt(b, dest) || moveCost(b, dest) >= 99) return [];

  const dist = new Map<string, number>([[startK, 0]]);
  const prev = new Map<string, HexCoord>();
  const frontier: Array<{ c: HexCoord; d: number }> = [{ c: unit.coord, d: 0 }];

  while (frontier.length > 0) {
    let mi = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].d < frontier[mi].d) mi = i;
    const { c, d } = frontier.splice(mi, 1)[0];
    if (key(c) === destK) break;
    if (d > (dist.get(key(c)) ?? Infinity)) continue;
    for (const n of hexNeighbours(c)) {
      const nk = key(n);
      if (!tileAt(b, n)) continue;
      // Can't path through a living unit; the destination is already empty.
      if (nk !== destK && unitAt(b, n)) continue;
      const step = moveCost(b, n);
      if (step >= 99) continue;
      const nd = d + step;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        prev.set(nk, c);
        frontier.push({ c: n, d: nd });
      }
    }
  }

  if (!prev.has(destK)) return [];
  const path: HexCoord[] = [];
  let cur: HexCoord | undefined = dest;
  while (cur && key(cur) !== startK) {
    path.unshift(cur);
    cur = prev.get(key(cur));
  }
  return path;
}

/**
 * 可達 — every empty hex a unit can reach THIS turn (cumulative terrain cost ≤
 * its remaining AP), as a set of "col,row" keys. Used to glow the full move
 * range so multi-step orders are discoverable. Ignores the transient ZoC
 * surcharge (paid at execution), so it's a generous-but-honest preview.
 */
export function reachableHexes(b: TacticalBattle, unit: TacticalUnit): Set<string> {
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  const reach = new Set<string>();
  const best = new Map<string, number>([[key(unit.coord), 0]]);
  const frontier: Array<{ c: HexCoord; d: number }> = [{ c: unit.coord, d: 0 }];
  while (frontier.length > 0) {
    let mi = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].d < frontier[mi].d) mi = i;
    const { c, d } = frontier.splice(mi, 1)[0];
    if (d > (best.get(key(c)) ?? Infinity)) continue;
    for (const n of hexNeighbours(c)) {
      if (!tileAt(b, n) || unitAt(b, n)) continue;
      const step = moveCost(b, n);
      if (step >= 99) continue;
      const nd = d + step;
      if (nd <= unit.ap && nd < (best.get(key(n)) ?? Infinity)) {
        best.set(key(n), nd);
        reach.add(key(n));
        frontier.push({ c: n, d: nd });
      }
    }
  }
  return reach;
}

/**
 * Walk a unit along a planned path, step by step, as far as this turn's AP and
 * the real movement rules (ZoC, occupancy) permit. Returns the resulting battle
 * and the un-walked remainder (empty when the destination was reached).
 */
export function moveUnitAlong(
  b: TacticalBattle,
  unitId: EntityId,
  steps: HexCoord[],
): { battle: TacticalBattle; remaining: HexCoord[] } {
  let cur = b;
  for (let i = 0; i < steps.length; i++) {
    const unit = cur.units.find((u) => u.id === unitId);
    if (!unit) return { battle: cur, remaining: [] };
    if (!canMove(cur, unit, steps[i])) return { battle: cur, remaining: steps.slice(i) };
    cur = moveUnit(cur, unitId, steps[i]);
  }
  return { battle: cur, remaining: [] };
}

/**
 * 續行 — at the start of a side's turn, units carrying a queued march order
 * resume it with their fresh AP. A unit pinned in melee holds its ground (and
 * keeps the order); a blocked route is abandoned so nothing loops forever.
 */
function resumeQueuedPaths(b: TacticalBattle): TacticalBattle {
  let cur = b;
  const movers = cur.units.filter(
    (u) => u.side === cur.activeSide && u.troops > 0 && u.path && u.path.length > 0,
  );
  for (const m of movers) {
    const u = cur.units.find((x) => x.id === m.id);
    if (!u || !u.path || u.path.length === 0) continue;
    const engaged = cur.units.some(
      (e) => e.side !== u.side && e.troops > 0 && !e.hidden && hexDistance(e.coord, u.coord) === 1,
    );
    if (engaged) continue; // hold the line; the order waits
    const before = u.path.length;
    const { battle, remaining } = moveUnitAlong(cur, u.id, u.path);
    cur = battle;
    const progressed = remaining.length < before;
    const newPath = progressed && remaining.length > 0 ? remaining : undefined;
    cur = {
      ...cur,
      units: cur.units.map((x) => (x.id === u.id ? { ...x, path: newPath } : x)),
    };
  }
  return cur;
}

/**
 * 潰走 — at the start of a side's turn, its routing units (morale 0, still
 * manned) bolt for their own edge under no one's command. They can't fight; they
 * only run, and pursuers cut them down (追擊掩殺, see attackUnits). A router
 * rallied back above 0 morale (收攏/旗令/aura) before its turn rejoins the line
 * and is skipped here.
 */
function processRout(b: TacticalBattle): TacticalBattle {
  let cur = b;
  const routers = cur.units.filter((u) => u.side === cur.activeSide && isRouting(u));
  for (const r of routers) {
    const edgeCol = homeEdgeCol(cur, r.side);
    let safety = 8;
    while (safety-- > 0) {
      const u = cur.units.find((x) => x.id === r.id);
      if (!u || !isRouting(u) || u.ap <= 0 || u.coord.col === edgeCol) break;
      const step = bestStepToward(cur, u, { col: edgeCol, row: u.coord.row });
      if (!step) break;
      const moved = moveUnit(cur, u.id, step);
      if (moved === cur) break; // blocked
      cur = moved;
    }
  }
  return cur;
}

/** Max HP a fortification repairs back toward, by kind. */
const FORT_MAX_HP: Record<string, number> = { wall: 1000, gate: 700 };

/**
 * 搶修城防 — a defender adjacent to a battered (but standing) wall or gate
 * spends its action shoring it back up. Only the garrison repairs, only
 * fortifications with tracked HP, and never above their original strength.
 */
export function repairWall(b: TacticalBattle, unitId: EntityId, coord: HexCoord): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || unit.side !== 'defender' || unit.ap <= 0) return b;
  if (hexDistance(unit.coord, coord) !== 1) return b;
  const tile = tileAt(b, coord);
  if (!tile || (tile.terrain !== 'wall' && tile.terrain !== 'gate')) return b;
  const key = `${coord.col},${coord.row}`;
  const cur = b.wallHp?.[key];
  const max = FORT_MAX_HP[tile.terrain] ?? 1000;
  if (cur === undefined || cur >= max) return b;
  const next = Math.min(max, cur + 180);
  return {
    ...b,
    wallHp: { ...b.wallHp, [key]: next },
    units: b.units.map((u) => (u.id === unitId ? { ...u, ap: 0 } : u)),
    log: [...(b.log ?? []), { turn: b.turn, text: '守軍搶修城防，缺損處重歸堅固。', kind: 'event' }],
  };
}

/**
 * Battering power a siege contingent brings to bear on a wall or gate per
 * assault — scales with the size of the engine crew.
 */
export function siegeAssaultPower(troops: number): number {
  return Math.floor(troops * 0.15) + 120;
}

/**
 * Siege units adjacent to a 城門 gate or 城牆 wall hex spend an attack action to
 * batter it. Destructible hexes (those tracked in `wallHp`) chip down over
 * several assaults and only become a passable breach at 0 HP; hexes without
 * tracked HP (e.g. named-map gates) break in a single hit, as they always did.
 * Non-siege units cannot batter fortifications.
 *
 * Kept named `breakGate` for its existing callers; it now handles walls too.
 */
export function breakGate(b: TacticalBattle, unitId: EntityId, coord: HexCoord): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || unit.unitType !== 'siege') return b;
  if (unit.ap <= 0) return b;
  const tile = tileAt(b, coord);
  if (!tile || (tile.terrain !== 'gate' && tile.terrain !== 'wall')) return b;
  if (hexDistance(unit.coord, coord) !== 1) return b;

  const key = `${coord.col},${coord.row}`;
  const isGate = tile.terrain === 'gate';
  const curHp = b.wallHp?.[key];
  const spendAp = (u: TacticalUnit) => (u.id === unitId ? { ...u, ap: 0 } : u);

  // Tracked HP — chip it down; breach only at 0.
  if (curHp !== undefined) {
    const newHp = curHp - siegeAssaultPower(unit.troops);
    if (newHp > 0) {
      return {
        ...b,
        wallHp: { ...b.wallHp, [key]: newHp },
        units: b.units.map(spendAp),
        log: [
          ...(b.log ?? []),
          { turn: b.turn, text: isGate ? '攻城槌猛撞城門！' : '投石轟擊城牆！', kind: 'event' },
        ],
      };
    }
    const nextWallHp = { ...(b.wallHp ?? {}) };
    delete nextWallHp[key];
    return {
      ...b,
      tiles: b.tiles.map((t) =>
        t.coord.col === coord.col && t.coord.row === coord.row ? { ...t, terrain: 'plain' } : t,
      ),
      wallHp: Object.keys(nextWallHp).length > 0 ? nextWallHp : undefined,
      units: b.units.map(spendAp),
      log: [
        ...(b.log ?? []),
        { turn: b.turn, text: isGate ? '城門告破！' : '城牆崩塌，缺口洞開！', kind: 'event' },
      ],
    };
  }

  // No tracked HP — one-shot (legacy named-map gate behaviour).
  return {
    ...b,
    tiles: b.tiles.map((t) =>
      t.coord.col === coord.col && t.coord.row === coord.row ? { ...t, terrain: 'plain' } : t,
    ),
    units: b.units.map(spendAp),
    log: [...(b.log ?? []), { turn: b.turn, text: 'Siege engine smashes the gate down!', kind: 'event' }],
  };
}

/**
 * 雲梯登城 — a (non-siege) foot unit adjacent to a 城牆 wall can scale it and
 * drop onto the far side, *if* a friendly siege engine (the ladder/tower) is
 * also adjacent to that same wall hex. Spends all AP. Lets an assault pour
 * through the rampart without first reducing it to rubble.
 */
export function scaleWall(b: TacticalBattle, unitId: EntityId, wallCoord: HexCoord): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit || unit.ap <= 0 || unit.unitType === 'siege') return b;
  const tile = tileAt(b, wallCoord);
  if (!tile || tile.terrain !== 'wall') return b;
  if (hexDistance(unit.coord, wallCoord) !== 1) return b;
  // Need a siege engine of our side braced against the same wall.
  const hasLadder = b.units.some(
    (u) => u.side === unit.side && u.unitType === 'siege' && u.troops > 0 &&
      hexDistance(u.coord, wallCoord) === 1,
  );
  if (!hasLadder) return b;
  // Land on a free, passable hex on the far side of the wall.
  const landing = hexNeighbours(wallCoord).find((c) => {
    const t = tileAt(b, c);
    if (!t || TERRAIN_MOVE_COST[t.terrain] >= 99) return false;
    if (unitAt(b, c)) return false;
    return unit.side === 'attacker' ? c.col > wallCoord.col : c.col < wallCoord.col;
  });
  if (!landing) return b;
  return {
    ...b,
    units: b.units.map((u) => (u.id === unitId ? { ...u, coord: landing, ap: 0 } : u)),
    log: [...(b.log ?? []), { turn: b.turn, text: '雲梯架起，士卒踏牆而入！', kind: 'event' }],
  };
}

/**
 * Voluntary retreat: a unit walks off the battlefield with its remaining
 * troops intact. Removes the unit from the battle (counted as a loss
 * since they're no longer engaged, but at full troops — no rout).
 * Commanders cannot retreat — they must be the last to leave.
 */
export function retreatUnit(b: TacticalBattle, unitId: EntityId): TacticalBattle {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return b;
  if (unit.isCommander) return b; // commander stays
  // Must be at the appropriate edge (close to a side edge) — within 2 hexes.
  const myEdgeCol = unit.side === 'attacker' ? 0 : b.width - 1;
  if (Math.abs(unit.coord.col - myEdgeCol) > 2) return b;
  const remaining = b.units.filter((u) => u.id !== unitId);
  const lossKey = unit.side === 'attacker' ? 'attackerLosses' : 'defenderLosses';
  return {
    ...b,
    units: remaining,
    [lossKey]: (b[lossKey] ?? 0) + Math.floor(unit.troops * 0.1), // 10% counted as stragglers
  };
}

/** 臨陣變陣 — whether the side may re-form right now (a manoeuvre on a few-turn
 *  cooldown so it can't be spammed). */
export function canChangeFormation(b: TacticalBattle, side: 'attacker' | 'defender'): boolean {
  return (b.stratagemCooldowns[`reform-${side}`] ?? 0) <= b.turn;
}

/** 變陣 — re-form the army into a new shape mid-battle. The whole side spends a
 *  beat reordering its ranks: every living unit is thrown into 陷亂 for a turn
 *  (the new shape only tells once the dust settles), and it can't repeat for a
 *  few turns. A real trade: switch to counter the enemy's formation, but eat a
 *  turn of disorder doing it. No-op if disallowed or already in that shape. */
export function changeFormation(b: TacticalBattle, side: 'attacker' | 'defender', formation: FormationId): TacticalBattle {
  if (!canChangeFormation(b, side)) return b;
  const cur = side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  if (cur === formation) return b;
  const units = b.units.map((u) => (u.side === side && u.troops > 0 && !u.effects.some((e) => e.kind === 'disorder')
    ? { ...u, effects: [...u.effects, { kind: 'disorder' as const, turnsLeft: 1 }] } : u));
  const name = FORMATIONS_BY_ID[formation]?.name.zh ?? formation;
  return {
    ...b,
    [side === 'attacker' ? 'attackerFormation' : 'defenderFormation']: formation,
    units,
    stratagemCooldowns: { ...b.stratagemCooldowns, [`reform-${side}`]: b.turn + 3 },
    log: [...(b.log ?? []), { turn: b.turn, text: `${side === 'attacker' ? '攻方' : '守方'}臨陣變陣 — 改結「${name}」陣,整隊未定(暫陷亂)。`, kind: 'event' as const }],
  };
}

/** 射程 — how far a unit can strike. Melee arms reach one hex; bows/siege/navy
 *  loose at range (弓3·弩4·攻城4·水軍3). A crossbow's longer reach reads from the
 *  officer's weapon class when supplied. */
export function attackRange(unit: TacticalUnit, officer?: Officer): number {
  if (unit.unitType === 'siege') return 4;
  if (unit.unitType === 'navy') return 3;
  if (unit.unitType === 'archers') {
    return officer && deriveWeaponType(officer) === 'crossbow' ? 4 : 3;
  }
  return 1;
}

/** offset (odd-q) ← cube. */
function cubeToOffset(x: number, z: number): HexCoord {
  return { col: x, row: z + (x - (x & 1)) / 2 };
}

/** 視線 — the hexes a straight shot passes through, endpoints included. */
function hexLine(a: HexCoord, b: HexCoord): HexCoord[] {
  const n = hexDistance(a, b);
  if (n === 0) return [a];
  const [ax, , az] = offsetToCube(a);
  const [bx, , bz] = offsetToCube(b);
  const out: HexCoord[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let rx = Math.round(ax + (bx - ax) * t);
    const ry = Math.round(-ax - az + (-bx - bz - (-ax - az)) * t);
    let rz = Math.round(az + (bz - az) * t);
    const dx = Math.abs(rx - (ax + (bx - ax) * t));
    const dz = Math.abs(rz - (az + (bz - az) * t));
    const dy = Math.abs(ry - (-ax - az + (-bx - bz - (-ax - az)) * t));
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dz > dy) rz = -rx - ry;
    out.push(cubeToOffset(rx, rz));
  }
  return out;
}

/** 射界 — is there a clear line of sight for a direct shot? Walls/gates/mountains
 *  in the way block it (an arcing 矢雨 ignores this — it lofts over). Units on the
 *  line don't block a direct shot but lend the target cover (handled in damage). */
export function hasLineOfSight(b: TacticalBattle, from: HexCoord, to: HexCoord): boolean {
  const line = hexLine(from, to);
  for (let i = 1; i < line.length - 1; i++) {
    const t = tileAt(b, line[i]);
    if (t && (t.terrain === 'wall' || t.terrain === 'gate' || t.terrain === 'mountain')) return false;
  }
  return true;
}

/**
 * 煙障 — how many burning ground-fire hexes a line of sight crosses. A pall of
 * smoke fouls an archer's aim (handled as a ranged-damage penalty, not a hard
 * LOS block, so it stays deterministic for AI planning). Endpoints excluded:
 * a unit standing IN the fire is already burning, that's a separate matter.
 */
export function smokeOnLine(b: TacticalBattle, from: HexCoord, to: HexCoord): number {
  const fires = b.groundFires;
  if (!fires || fires.length === 0) return 0;
  const burning = new Set(fires.map((f) => `${f.coord.col},${f.coord.row}`));
  const line = hexLine(from, to);
  let n = 0;
  for (let i = 1; i < line.length - 1; i++) {
    if (burning.has(`${line[i].col},${line[i].row}`)) n++;
  }
  return n;
}

export function canAttack(
  b: TacticalBattle,
  unit: TacticalUnit,
  target: TacticalUnit,
): boolean {
  if (unit.ap <= 0 || unit.side === target.side) return false;
  if (isRouting(unit)) return false; // 潰走之軍只顧奔逃，無還手之力
  const dist = hexDistance(unit.coord, target.coord);
  if (dist < 1 || dist > attackRange(unit)) return false;
  if (dist === 1) return true; // melee — no line-of-sight needed
  // 遠程:矢盡不能射,且須有射界(牆/高山阻斷)。
  if (unit.maxAmmo !== undefined && (unit.ammo ?? 0) <= 0) return false;
  return hasLineOfSight(b, unit.coord, target.coord);
}

/**
 * Compute damage as a function of stat × troops modified by terrain, status,
 * formation, weather, and unit-type counters. Also emits damage popups and
 * fires voice lines for the attacker.
 */
export function attackUnits(
  b: TacticalBattle,
  attackerId: EntityId,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): TacticalBattle {
  const attacker = b.units.find((u) => u.id === attackerId);
  const target = b.units.find((u) => u.id === targetId);
  if (!attacker || !target) return b;
  if (!canAttack(b, attacker, target)) return b;
  // 遠程射擊 — a shot loosed from beyond melee (弓弩/攻城/水軍): it spends an arrow,
  // draws no melee riposte from a foe that can't reach back, and is blunted by
  // cover (forest, or a body on the line).
  const attackDist = hexDistance(attacker.coord, target.coord);
  const isRanged = attackDist > 1;
  let coverMul = 1.0;
  if (isRanged) {
    // 騷擾之射 — a loosed volley harasses; it never bites like a sustained melee
    // press (which is why bows soften and cavalry/foot decide). Without this a
    // kiting archer that never risks a counter simply wins — keep it a chip, not
    // a kill. (The dedicated 矢雨齊發 stratagem is the archers' real burst.)
    coverMul *= 0.5;
    if (tileAt(b, target.coord)?.terrain === 'forest') coverMul *= 0.8;          // 林木遮蔽
    const line = hexLine(attacker.coord, target.coord);
    const screened = line.slice(1, -1).some((c) => unitAt(b, c));               // 友/敵軍擋箭
    if (screened) coverMul *= 0.85;
    const smoke = smokeOnLine(b, attacker.coord, target.coord);                  // 煙障迷目
    if (smoke > 0) coverMul *= Math.max(0.45, 1 - 0.28 * smoke);
  }
  // Ambush bonus + reveal: hidden attacker striking from concealment
  // gets +30% damage this hit, then is revealed.
  const ambushBonus = attacker.hidden ? (b.timeOfDay === 'night' ? 1.5 : 1.3) : 1.0;
  if (attacker.hidden) {
    b = { ...b, units: b.units.map((u) => u.id === attackerId ? { ...u, hidden: false } : u) };
  }

  const ao = officers[attacker.officerId];
  const To = officers[target.officerId];
  // Wounded officers fight at reduced effectiveness — 受傷帶兵. The graver the
  // wound, the worse they (and their men) fare.
  const woundPenalty = (o?: { status: string; woundSeverity?: 'minor' | 'serious' | 'critical' }): number => {
    if (o?.status !== 'wounded') return 1.0;
    return o.woundSeverity === 'critical' ? 0.65 : o.woundSeverity === 'serious' ? 0.78 : 0.9;
  };
  const aWoundedMul = woundPenalty(ao);
  const dWoundedMul = To?.status === 'wounded' ? (To.woundSeverity === 'critical' ? 1.3 : To.woundSeverity === 'serious' ? 1.22 : 1.12) : 1.0;
  const aWar = ao ? effectiveStats(ao).war : 50;
  const dLead = To ? effectiveStats(To).leadership : 50;

  // Defending status halves incoming damage.
  const targetDefending = target.effects.some((e) => e.kind === 'defending');
  // Burning status: 5% troops of attacker added to damage (the flames keep eating).
  const attackerBurning = attacker.effects.some((e) => e.kind === 'burning');
  const attackerDemoralized = attacker.effects.some((e) => e.kind === 'demoralized');
  const attackerStarving = attacker.effects.some((e) => e.kind === 'starving');

  const counter = counterMultiplier(attacker.unitType, target.unitType);
  const aTerrainTile = tileAt(b, attacker.coord);
  const aTerrainMod = aTerrainTile ? terrainDamageMod(attacker.unitType, aTerrainTile.terrain) : 1;

  // 陣勢 — every formation effect is scaled by how intact the line is and how
  // masterful the commander (兵敗陣亂 ↔ 陣法精通). A dissolved 大陣 gives nothing.
  const aFormStrength = formationStrength(b, attacker.side, officers);
  const dFormStrength = formationStrength(b, target.side, officers);
  // Formation effects on defense (faded by the defender's 陣勢).
  const targetFormation =
    target.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  const defenseMul = applyFormStrength(defensiveFormationBonus(b, target, targetFormation ?? 'none'), dFormStrength);

  // Attacker's formation offensive bonus (faded by the attacker's 陣勢).
  const attackerFormation =
    attacker.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  const offenseMul = applyFormStrength(offensiveFormationBonus(
    attackerFormation ?? 'none',
    attacker.unitType,
    b.turn,
  ), aFormStrength);
  // 陣克陣 — formation-vs-formation rock-paper-scissors (scaled by 陣勢).
  const formCounterMul = applyFormStrength(formationCounterMul(attackerFormation ?? 'none', targetFormation ?? 'none'), aFormStrength);
  // 精銳/異族 — elite corps hit harder and shrug off blows.
  const eliteMul = (ELITE_UNITS[attacker.officerId]?.atkMul ?? 1) * (ELITE_UNITS[target.officerId]?.defMul ?? 1);

  // Weather effects.
  const weatherMul = weatherDamageMul(b.weather, attacker.unitType);
  // 夜戰 — confusion dampens open blows but sharpens the knife in the dark.
  const nightMul = b.timeOfDay === 'night' ? 0.94 : 1.0;
  // 居高臨下 — striking downhill hits harder; fighting uphill, softer.
  const ELEV: Partial<Record<TerrainKind, number>> = { mountain: 2, watchtower: 2, hill: 1 };
  const aElev = aTerrainTile ? (ELEV[aTerrainTile.terrain] ?? 0) : 0;
  const dElevTile = tileAt(b, target.coord);
  const dElev = dElevTile ? (ELEV[dElevTile.terrain] ?? 0) : 0;
  const heightMul = aElev > dElev ? 1.15 : aElev < dElev ? 0.92 : 1.0;

  // Defender's terrain shield (chokepoint, watchtower, hill, mountain,
  // forest, gate) reduces incoming damage.
  const dTerrainTile = tileAt(b, target.coord);
  const dShield = dTerrainTile ? defenderTerrainShield(dTerrainTile.terrain) : 1.0;
  // 半渡而擊 — a land unit caught mid-crossing on a river/bridge is horribly
  // exposed (+25%); ships are at home on the water and exempt.
  const onCrossing = target.unitType !== 'navy'
    && (dTerrainTile?.terrain === 'river' || dTerrainTile?.terrain === 'bridge');
  const crossingMul = onCrossing ? 1.25 : 1.0;
  // 巷戰死守 — once the gate is breached, defenders fight house-to-house on
  // their own streets; they're 18% harder to root out inside the walls.
  const streetMul = target.side === 'defender' && insideWalls(b, target.coord) ? 0.82 : 1.0;
  // 糧道枯竭：turn ≥ 10 both sides start to suffer 5% per turn beyond,
  // capped at -40% so battles still resolve.
  const fatigueMul = b.turn >= 10
    ? Math.max(0.6, 1 - 0.05 * (b.turn - 9))
    : 1.0;
  // 一鼓作氣,再而衰,三而竭 — a fresh unit's blow carries élan (×1.05); a spent
  // one flags (down to ×0.75 at full 久戰疲乏).
  const freshMul = 1.05 - Math.min(0.30, (attacker.fatigue ?? 0) / 333);

  // 士氣轉戰力 — a unit's heart shows in its blows: 氣勢如虹 (≥80) presses the
  // attack home; a 動搖 (<40) one wavers, a near-broken one barely fights.
  const aMoraleMul =
    attacker.morale >= MORALE_HIGH ? 1.06
    : attacker.morale <= 15 ? 0.78
    : attacker.morale < MORALE_SHAKEN ? 0.88
    : 1.0;
  // 追擊掩殺 — a broken (routing) foe is cut down from behind, no riposte; a
  // merely shaken one is easier to press. Cavalry run routers down hardest
  // (銜尾追殺); ships don't chase like horse.
  const targetRouting = isRouting(target);
  const pursuitMul = targetRouting
    ? (attacker.unitType === 'cavalry' ? 1.8 : attacker.unitType === 'navy' ? 1.3 : 1.5)
    : target.morale < MORALE_SHAKEN ? 1.12 : 1.0;

  // 衝鋒蓄力 — a unit that ran a distance into a closing blow carries momentum
  // (cavalry hardest). The foe must have been ≥2 hexes off when the run began
  // (a real charge, not a shuffle in contact). A spear unit braced (據守) and
  // facing the charger receives it on the points (拒馬立防): the charge breaks
  // and the spears gut the chargers on the counter.
  let chargeMul = 1.0;
  let braced = false;
  const ch = attacker.charge;
  if (ch && ch.dist >= 2 && hexDistance(ch.from, target.coord) >= 2
      && attacker.unitType !== 'siege' && attacker.unitType !== 'navy') {
    const per = attacker.unitType === 'cavalry' ? 0.09 : 0.045;
    const cap = attacker.unitType === 'cavalry' ? 0.32 : 0.15;
    chargeMul = 1 + Math.min(cap, per * (ch.dist - 1));
    // 立防拒馬 — spears are inherently anti-charge: a spearman FACING the charger
    // sets against it and breaks the impact, no manual 據守 needed (this is what
    // keeps cavalry from simply running spearmen down).
    const tBraced = target.unitType === 'spearmen'
      && typeof target.facing === 'number'
      && dirGap(hexDirection(target.coord, attacker.coord), target.facing) <= 1;
    if (tBraced) { braced = true; chargeMul = 0.7; }
  }

  // Naval: a bigger hull (樓船/大翼) hits harder than a 走舸 skiff.
  const shipMul = shipPowerMul(attacker.shipClass);

  // 夾擊 — pincer bonus: every *other* friendly unit also pressing the target
  // adds +12% (a surrounded foe can't guard every side), capped at +36%.
  const pincers = b.units.filter(
    (u) => u.side === attacker.side && u.id !== attacker.id && u.troops > 0 &&
      hexDistance(u.coord, target.coord) === 1,
  ).length;
  const pincerMul = 1 + Math.min(0.28, 0.10 * pincers);

  // 合擊 — a sworn brother pressing the same foe lands a combined blow (+30%).
  const comboAlly = b.units.find(
    (u) => u.side === attacker.side && u.id !== attacker.id && u.troops > 0
      && hexDistance(u.coord, target.coord) === 1
      && areBonded(attacker.officerId, u.officerId),
  );
  const comboMul = comboAlly ? 1.3 : 1.0;

  // 背刺/側擊 — a blow that lands outside the foe's front arc catches it
  // unguarded. With real 朝向, the rear arc (directly behind) is +25% and it can
  // barely counter; a flank is +12%. Units with no facing set fall back to the
  // legacy side-based reckoning (attacker faces +col, defender −col).
  let fromRear = false;
  let flankMul = 1.0;
  if (typeof target.facing === 'number') {
    const gap = dirGap(hexDirection(target.coord, attacker.coord), target.facing);
    if (gap === 3) { fromRear = true; flankMul = 1.25; }
    else if (gap === 2) { flankMul = 1.12; }
  } else {
    const targetFacing = target.side === 'attacker' ? 1 : -1;
    fromRear = (attacker.coord.col - target.coord.col) * targetFacing < 0;
    flankMul = fromRear ? 1.25 : 1.0;
  }
  // 陣形方位 — the names finally mean their shapes (scaled by 陣勢): an all-round
  // 方圓/四象/偃月 seals its flanks; a long 長蛇/鋒矢/錐行 line is thin on the side;
  // an enveloping 鶴翼/雁行 attacker turns a flank harder. Folds into the §5.1 側背.
  if (flankMul > 1.0) {
    const excess = flankMul - 1;
    let mod = 1.0;
    if (targetFormation === 'square' || targetFormation === 'four-symbols' || targetFormation === 'crescent-moon') mod -= 0.6 * dFormStrength;   // 環陣護側
    if (targetFormation === 'long-snake' || targetFormation === 'arrow-tip' || targetFormation === 'awl') mod += 0.5 * dFormStrength;            // 長陣側薄
    if (attackerFormation === 'crane-wing' || attackerFormation === 'wild-goose') mod += 0.45 * aFormStrength;                                    // 鶴翼包抄
    flankMul = 1 + excess * Math.max(0, mod);
    if (flankMul <= 1.001) fromRear = false; // a fully-sealed flank denies the rear bonus's perks too
  }

  // 戰局氣勢 — a side riding the tide of battle presses its blows home (順勢),
  // a side losing it falters (頹勢). Momentum is +ve for the attacker side.
  const favor = attacker.side === 'attacker' ? (b.momentum ?? 0) : -(b.momentum ?? 0);
  const momentumMul = 1 + Math.max(-0.04, Math.min(0.05, favor / 2000));

  // 兵裝相剋 — the officers' weapon classes (§5.9) refine the matchup: 戟制騎、
  // 弩破甲、騎踏弓弩、劍走側背、刀破輕、襲書生/欺徒手. No longer pure display.
  const aWeapon = ao ? deriveWeaponType(ao) : 'none';
  const dWeapon = To ? deriveWeaponType(To) : 'none';
  const weapon = weaponMatchupMul(aWeapon, dWeapon, target.unitType, fromRear || flankMul > 1);
  const weaponMul = weapon.mul;

  // 圍殲與退路 — has the target any empty, passable hex to fall back to? None =
  // encircled. A cornered unit that hasn't broken fights desperately (困獸猶鬥:
  // harder to kill, resists routing, ripostes savagely — 圍師必闕); but a routing
  // unit boxed in is cut down where it stands (甕中之鱉).
  const escapeHexes = hexNeighbours(target.coord).filter((n) => {
    const t = tileAt(b, n);
    return t && moveCost(b, n) < 99 && !unitAt(b, n);
  });
  const encircled = escapeHexes.length === 0 && !target.isSupply;
  let encircleMul = 1.0;
  let desperate = false;
  if (encircled) {
    if (targetRouting) encircleMul = 1.25;
    else { encircleMul = 0.90; desperate = true; }
  }

  // 陷亂 — a disordered attacker mills and hits soft; a disordered target is an
  // open mark. 詐敗 — the target only *looked* broken; this blow springs the trap.
  const aDisordered = attacker.effects.some((e) => e.kind === 'disorder');
  const dDisordered = target.effects.some((e) => e.kind === 'disorder');
  const disorderMul = (aDisordered ? 0.82 : 1.0) * (dDisordered ? 1.15 : 1.0);
  const feigning = target.effects.some((e) => e.kind === 'feign-rout');

  // 督戰壓陣 — a unit fighting beside its own steady commander will not break
  // while the banner stands (its morale is floored when struck).
  const enforced = b.units.some(
    (c) => c.side === target.side && c.isCommander && c.id !== target.id
      && c.troops > 0 && c.morale > 30 && hexDistance(c.coord, target.coord) === 1,
  );

  // 品階威儀 — a higher-grade officer's unit hits harder, and a higher-grade
  // defender's formation shrugs off part of the blow (威儀 toughness).
  const aGradeMul = ao ? gradeCombatBonus(ao).powerMul : 1;
  const dGradeResistMul = To ? 1 - gradeCombatBonus(To).damageResist : 1;
  // 歷練之威 — a seasoned attacker's unit hits a touch harder per growth level.
  const aGrowthMul = ao ? growthPowerMul(ao) : 1;
  // 神兵譜共鳴 — a full legendary set lends extra bite.
  const aSetMul = ao ? itemSetPowerMul(ao) : 1;
  // 性格專長 — unit-type / terrain / night / charge specialist traits (神槍/弩匠/
  // 騎將/水將/山戰/林戰/夜襲/先鋒/狂戰…) finally bite, where unit type & terrain are real.
  const aTraitCtx = {
    unitType: attacker.unitType,
    terrain: aTerrainTile?.terrain ?? 'plain',
    isNight: b.timeOfDay === 'night',
    isAmbush: ambushBonus > 1.0,
    turn: b.turn,
    troopRatio: attacker.maxTroops > 0 ? attacker.troops / attacker.maxTroops : 1,
    isAttacker: attacker.side === 'attacker',
    enemyForceId: To?.forceId ?? undefined,
  } as const;
  const aTraitMul = ao ? tacticalDamageMul(ao, aTraitCtx) : 1;
  const dTraitDefMul = To
    ? tacticalDefenseMul(To, { ...aTraitCtx, unitType: target.unitType, terrain: (dTerrainTile?.terrain ?? 'plain'), isAttacker: target.side === 'attacker', enemyForceId: ao?.forceId ?? undefined })
    : 1;
  const base =
    Math.floor((attacker.troops * (aWar + 30) * (0.85 + rng() * 0.3) * COMBAT_LETHALITY) / (dLead + 50));
  // 甲冑輕重 — armoured foot soak blows; light horse takes extra punishment.
  const armorMul = ARM_ARMOR[target.unitType] ?? 1;
  let damage = Math.floor(
    base * counter * aTerrainMod * weatherMul * defenseMul * offenseMul *
    dShield * ambushBonus * fatigueMul * freshMul * aWoundedMul * dWoundedMul * shipMul * pincerMul *
    nightMul * heightMul * flankMul * crossingMul * streetMul * comboMul * formCounterMul * eliteMul * aGradeMul * dGradeResistMul * aGrowthMul * aSetMul *
    aMoraleMul * pursuitMul * chargeMul * weaponMul * encircleMul * disorderMul * momentumMul * coverMul * armorMul *
    aTraitMul * dTraitDefMul,
  );
  if (targetDefending) damage = Math.floor(damage / 2);
  if (attackerBurning) damage = Math.floor(damage * 0.9);
  if (attackerDemoralized) damage = Math.floor(damage * 0.8);
  if (attackerStarving) damage = Math.floor(damage * 0.85); // 糧盡兵疲

  // 特技臨陣 — martial skills make the blow tell: more frequent, harder crits.
  const MARTIAL = ['god-of-war', 'flying-general', 'sage-of-war', 'brave', 'tiger-vanguard',
    'little-conqueror', 'tiger-of-jiangdong', 'iron-vow'];
  const martialSkill = (ao?.skills ?? []).find((s) => MARTIAL.includes(s));
  const isCrit = rng() < (martialSkill ? 0.22 : 0.12);
  if (isCrit) damage = Math.floor(damage * (martialSkill ? 1.8 : 1.6));

  const newTroops = Math.max(0, target.troops - damage);
  let moraleLoss = Math.floor((damage / Math.max(1, target.maxTroops)) * 50);
  // 必死則生 — a cornered, unbroken unit steels itself and barely loses heart.
  if (desperate) moraleLoss = Math.floor(moraleLoss * 0.5);

  // Counter-attack: target deals back ~40% if still alive. A foe struck in the
  // rear barely retaliates; a routing foe doesn't at all (it only runs); a
  // braced spearwall that just turned back a charge ripostes savagely (拒馬); a
  // cornered beast lashes out (困獸猶鬥); and a 詐敗 unit that only *looked*
  // broken springs a full-strength riposte on its pursuer (誘敵反噬).
  // A target struck from beyond its own reach can't strike back (弓弩臨敵,白刃
  //莫及) — only a foe whose range covers the distance ripostes.
  const targetCanReach = attackRange(target, To) >= attackDist;
  let counterTroops = attacker.troops;
  let counterDamage = 0;
  if (newTroops > 0 && !targetRouting && targetCanReach) {
    const dWar = To ? effectiveStats(To).war : 50;
    const aLead = ao ? effectiveStats(ao).leadership : 50;
    const counterPortion = feigning ? 1.0 : 0.4;
    const counterBase = Math.floor(
      (target.troops * (dWar + 30) * (0.85 + rng() * 0.3) * counterPortion) / (aLead + 50)
        * (feigning ? 1 : fromRear ? 0.4 : 1) * (braced ? 1.6 : 1) * (desperate ? 1.35 : 1),
    );
    counterTroops = Math.max(0, attacker.troops - counterBase);
    counterDamage = counterBase;
  }

  // Damage popups. Tag the blow: ★會心 / 衝鋒 / 追擊 / 背刺.
  const tag = feigning ? '誘 ' : braced ? '折 ' : chargeMul > 1.05 ? '衝 ' : targetRouting ? '追 ' : encircleMul > 1 ? '殲 ' : isRanged ? (coverMul < 1 ? '掩 ' : '射 ') : weapon.tag ? `${weapon.tag} ` : fromRear ? '背 ' : '';
  const popups: DamagePopup[] = [
    {
      id: `dmg-${Date.now()}-1`,
      coord: target.coord,
      text: `${martialSkill && isCrit ? '★' : ''}${tag}-${damage.toLocaleString()}${isCrit ? '!' : ''}`,
      color: isCrit ? '#ffce4a' : chargeMul > 1.05 ? '#ffb24a' : targetRouting ? '#c45a8a' : fromRear ? '#ff9a3a' : '#ff6a4a',
      spawnedAt: Date.now(),
    },
  ];
  if (counterDamage > 0) {
    popups.push({
      id: `dmg-${Date.now()}-2`,
      coord: attacker.coord,
      text: `-${counterDamage.toLocaleString()}`,
      color: '#88b7e8',
      spawnedAt: Date.now() + 1,
    });
  }

  // Voice lines.
  const log = b.log ? [...b.log] : [];
  if (comboAlly && ao) {
    log.push({ turn: b.turn, text: `${ao.name.zh} × ${officers[comboAlly.officerId]?.name.zh ?? '友軍'} 合擊!`, kind: 'event' });
  }
  // 衝鋒陷陣 / 拒馬立防 / 追擊掩殺 — battle-flavour beats for the new edges.
  if (braced) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '守軍'}長槍立防 — ${ao?.name.zh ?? '騎軍'}衝勢盡折,人馬交摧!`, kind: 'event' });
  } else if (chargeMul > 1.05) {
    log.push({ turn: b.turn, text: `${ao?.name.zh ?? '騎軍'}蓄勢突陣,衝鋒陷陣!`, kind: 'event' });
  } else if (targetRouting && newTroops === 0) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '潰軍'}奔逃之際被銜尾掩殺 — 全軍覆沒!`, kind: 'event' });
  } else if (feigning) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '敵軍'}詐敗回馬 — ${ao?.name.zh ?? '追兵'}中伏陣腳大亂!`, kind: 'event' });
  } else if (desperate && newTroops > 0) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '敵軍'}四面被圍,困獸猶鬥 — 拼死反撲!`, kind: 'event' });
  } else if (encircled && targetRouting && newTroops === 0) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '敵軍'}走投無路,聚而殲之 — 甕中捉鱉!`, kind: 'event' });
  }
  // 腹背受敵 — the target is truly surrounded (pressed on three sides, or struck
  // in the rear while also flanked). A presentation beat; the pincer/rear damage
  // bonuses above already carry the mechanics.
  if (newTroops > 0 && (pincers >= 2 || (fromRear && pincers >= 1))) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '敵軍'}腹背受敵 — 陷入重圍!`, kind: 'event' });
  }
  if (isCrit && martialSkill && ao) {
    const SKILL_ZH: Record<string, string> = {
      'god-of-war': '武神', 'flying-general': '飛將', 'sage-of-war': '兵聖', 'brave': '勇猛',
      'tiger-vanguard': '虎臣', 'little-conqueror': '小霸王', 'tiger-of-jiangdong': '江東之虎', 'iron-vow': '鐵誓',
    };
    log.push({ turn: b.turn, text: `${ao.name.zh}【${SKILL_ZH[martialSkill] ?? '武技'}】會心一擊!`, kind: 'event' });
  }
  const attackVoice = pickVoiceLine(attacker.officerId, isCrit ? 'critical' : 'attack', rng);
  if (attackVoice) {
    log.push({ turn: b.turn, text: attackVoice, speaker: attacker.officerId, kind: 'voice' });
  }
  if (newTroops === 0) {
    const killVoice = pickVoiceLine(attacker.officerId, 'kill', rng);
    if (killVoice) {
      log.push({ turn: b.turn, text: killVoice, speaker: attacker.officerId, kind: 'voice' });
    }
  } else if (newTroops < target.maxTroops * 0.3) {
    const lowVoice = pickVoiceLine(target.officerId, 'lowHp', rng);
    if (lowVoice) {
      log.push({ turn: b.turn, text: lowVoice, speaker: target.officerId, kind: 'voice' });
    }
  }

  // 軍心崩潰 — this blow broke the unit's heart (morale to 0 while still manned):
  // it routs (潰走) instead of holding the line.
  if (newTroops > 0 && target.morale > 0 && target.morale - moraleLoss <= 0) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '敵軍'}軍心崩潰 — 棄陣潰走!`, kind: 'event' });
  }

  // Chained-unit damage spread.
  const chainEffect = target.effects.find((e) => e.kind === 'chained') as
    | { kind: 'chained'; turnsLeft: number; chainedWith: EntityId[] }
    | undefined;
  const chainSpread = Math.floor(damage * 0.5);
  // 潰敗連鎖 — a unit wiped out before their eyes shakes its neighbours' morale.
  const routShock = newTroops === 0
    ? new Set(b.units
        .filter((u) => u.side === target.side && u.id !== targetId && u.troops > 0
          && hexDistance(u.coord, target.coord) === 1)
        .map((u) => u.id))
    : null;
  // 主將陣亡 — slaying the enemy commander crashes their WHOLE army's morale.
  const commanderFell = newTroops === 0 && target.isCommander;
  // 指揮繼承 — the steadiest surviving officer takes up the fallen banner. A
  // clear chain of command softens the shock (−15 not −30); a leaderless host
  // reels in full. 副將接管,代領全軍.
  let successorId: EntityId | undefined;
  if (commanderFell) {
    const heirs = b.units.filter((u) => u.side === target.side && u.id !== targetId && u.troops > 0);
    if (heirs.length > 0) {
      successorId = heirs.reduce((best, u) => {
        const lb = officers[best.officerId] ? effectiveStats(officers[best.officerId]).leadership : 0;
        const lu = officers[u.officerId] ? effectiveStats(officers[u.officerId]).leadership : 0;
        return lu > lb ? u : best;
      }).id;
    }
  }
  const crashDrop = successorId ? 15 : 30;
  if (commanderFell) {
    log.push({ turn: b.turn, text: `${To?.name.zh ?? '主將'}陣亡 — 全軍動搖!`, kind: 'event' });
    if (successorId) {
      const heir = officers[b.units.find((u) => u.id === successorId)!.officerId];
      log.push({ turn: b.turn, text: `${heir?.name.zh ?? '副將'}臨危接掌帥旗,代領全軍 — 陣腳暫穩。`, kind: 'event' });
    }
  }
  const units = b.units.map((u) => {
    if (u.id === targetId) {
      // 督戰壓陣 — beside a steady commander, the unit won't break (morale floored).
      const morale = Math.max(enforced ? 10 : 0, u.morale - moraleLoss);
      // 衝陣致亂 — a landed charge breaks the target's ranks; the 詐敗 trap is
      // spent the moment it springs.
      let effects = u.effects.filter((e) => e.kind !== 'feign-rout');
      if (chargeMul > 1.05 && newTroops > 0 && !effects.some((e) => e.kind === 'disorder')) {
        effects = [...effects, { kind: 'disorder' as const, turnsLeft: 1 }];
      }
      return { ...u, troops: newTroops, morale, effects };
    }
    if (u.id === attackerId) {
      // 久戰疲乏 + 朝向 — pressing the attack tires the unit and turns it to face
      // the foe. The charge is spent on impact (衝鋒蓄力 consumed). Springing a
      // 詐敗 trap throws the pursuer's own ranks into disorder. A ranged shot
      // spends an arrow and tires less than a hand-to-hand bout.
      const effects = feigning && !u.effects.some((e) => e.kind === 'disorder')
        ? [...u.effects, { kind: 'disorder' as const, turnsLeft: 1 }]
        : u.effects;
      return {
        ...u, ap: u.ap - 1, troops: counterTroops,
        fatigue: Math.min(100, (u.fatigue ?? 0) + (isRanged ? FATIGUE_PER_VOLLEY : FATIGUE_PER_MELEE)),
        facing: hexDirection(u.coord, target.coord),
        charge: undefined,
        ammo: isRanged && u.maxAmmo !== undefined ? Math.max(0, (u.ammo ?? 0) - 1) : u.ammo,
        effects,
      };
    }
    // Chain damage to linked units.
    if (chainEffect && chainEffect.chainedWith.includes(u.id) && u.side === target.side) {
      const tr = Math.max(0, u.troops - chainSpread);
      popups.push({
        id: `dmg-${Date.now()}-chain-${u.id}`,
        coord: u.coord,
        text: `-${chainSpread.toLocaleString()}`,
        color: '#ff9070',
        spawnedAt: Date.now() + 2,
      });
      return { ...u, troops: tr };
    }
    // Morale shock: whole-army crash if the commander fell (softened when a heir
    // takes command), else a local tremor through the dead unit's neighbours.
    // The heir picks up the banner (isCommander) as it steadies the line.
    if (commanderFell && u.side === target.side && u.id !== targetId && u.troops > 0) {
      const next = { ...u, morale: Math.max(0, u.morale - crashDrop) };
      return u.id === successorId ? { ...next, isCommander: true } : next;
    }
    if (routShock && routShock.has(u.id)) {
      return { ...u, morale: Math.max(0, u.morale - 14) };
    }
    return u;
  });

  // 戰局氣勢 — felling a unit (especially a commander) swings the tide toward the
  // side that struck the blow (+ve favours the attacker side).
  let momentum = b.momentum ?? 0;
  if (newTroops === 0) {
    const swing = (target.isCommander ? 14 : 6) * (attacker.side === 'attacker' ? 1 : -1);
    momentum = Math.max(-100, Math.min(100, momentum + swing));
  }

  return {
    ...b,
    units,
    momentum,
    damagePopups: [...(b.damagePopups ?? []), ...popups],
    log,
  };
}

/** 陣前挑將 — whether the challenger may call out the adjacent enemy officer to
 *  a mid-battle single combat (both able-bodied, neither routing, adjacent). */
export function canChallengeDuel(
  challenger: TacticalUnit,
  target: TacticalUnit,
  officers: Record<EntityId, Officer>,
): boolean {
  if (challenger.ap <= 0 || challenger.side === target.side) return false;
  if (isRouting(challenger) || isRouting(target)) return false;
  if (challenger.isSupply || target.isSupply) return false;
  if (hexDistance(challenger.coord, target.coord) !== 1) return false;
  const co = officers[challenger.officerId];
  const to = officers[target.officerId];
  if (!co || !to) return false;
  return canDuel(co).ok && canDuel(to).ok;
}

/**
 * 陣前單挑 — two adjacent enemy officers cross blades mid-battle, resolved by the
 * same odds as the 演武場 (resolveDuel). 車輪戰: each bout already fought this
 * battle blunts a fighter's effective 武力, so relays of fresh challengers can
 * wear down a peerless champion. The loser's unit reels — a clean knockout
 * shatters its heart into a rout (潰走), a points loss merely shakes it — while
 * the victor's banner soars (氣勢大振). A challenge spends the challenger's turn.
 */
export function challengeDuel(
  b: TacticalBattle,
  challengerId: EntityId,
  targetId: EntityId,
  officers: Record<EntityId, Officer>,
  rng: () => number,
): TacticalBattle {
  const challenger = b.units.find((u) => u.id === challengerId);
  const target = b.units.find((u) => u.id === targetId);
  if (!challenger || !target) return b;
  if (!canChallengeDuel(challenger, target, officers)) return b;
  const co = officers[challenger.officerId];
  const to = officers[target.officerId];

  // 車輪戰 — prior bouts blunt a fighter (−5 武力 each, floored at −20).
  const winded = (o: Officer, u: TacticalUnit): Officer => {
    const pen = Math.min(20, (u.duelFatigue ?? 0) * 5);
    return pen > 0 ? { ...o, stats: { ...o.stats, war: Math.max(1, o.stats.war - pen) } } : o;
  };
  const result = resolveDuel({ attacker: winded(co, challenger), defender: winded(to, target), rng });

  const log = b.log ? [...b.log] : [];
  const popups: DamagePopup[] = [];
  log.push({ turn: b.turn, text: `⚔ ${co.name.zh} 出陣搦戰 ${to.name.zh} — 陣前單挑!`, kind: 'event' });

  // Both fighters spend a bout (車輪戰); the challenger spends the whole turn.
  let units = b.units.map((u) => {
    if (u.id === challengerId) return { ...u, ap: 0, duelFatigue: (u.duelFatigue ?? 0) + 1 };
    if (u.id === targetId) return { ...u, duelFatigue: (u.duelFatigue ?? 0) + 1 };
    return u;
  });

  if (result.winner === 'draw') {
    log.push({ turn: b.turn, text: '兩將鬥得難解難分,各自鳴金 — 勝負未分。', kind: 'event' });
    return { ...b, units, log };
  }

  const winnerUnit = result.winner === 'attacker' ? challenger : target;
  const loserUnit = result.winner === 'attacker' ? target : challenger;
  const winnerOff = officers[winnerUnit.officerId];
  const loserOff = officers[loserUnit.officerId];
  const knockout = result.knockout;
  const loserTroopLoss = Math.floor(loserUnit.troops * (knockout ? 0.30 : 0.10));

  units = units.map((u) => {
    if (u.id === loserUnit.id) {
      const morale = knockout ? 0 : Math.max(0, u.morale - 35); // 挑落 → 潰走
      return { ...u, troops: Math.max(0, u.troops - loserTroopLoss), morale };
    }
    if (u.id === winnerUnit.id) return { ...u, morale: Math.min(100, u.morale + 15) };
    if (u.side === winnerUnit.side && u.troops > 0) return { ...u, morale: Math.min(100, u.morale + 5) };
    if (u.side === loserUnit.side && u.troops > 0) return { ...u, morale: Math.max(0, u.morale - 5) };
    return u;
  });

  popups.push({
    id: `duel-${Date.now()}`,
    coord: loserUnit.coord,
    text: knockout ? '挑落馬下!' : '陣前小挫',
    color: '#ffd24a',
    spawnedAt: Date.now(),
  });
  log.push({
    turn: b.turn,
    text: knockout
      ? `${winnerOff?.name.zh ?? '勝者'}神威凜凜,將 ${loserOff?.name.zh ?? '敵將'} 挑落馬下 — 其部潰散奔逃!`
      : `${winnerOff?.name.zh ?? '勝者'}佔得上風,${loserOff?.name.zh ?? '敵將'} 部曲奪氣。`,
    kind: 'event',
  });
  // 主將敗北 — a routed commander drags the whole army's heart down further.
  if (knockout && loserUnit.isCommander) {
    units = units.map((u) => (u.side === loserUnit.side && u.id !== loserUnit.id && u.troops > 0
      ? { ...u, morale: Math.max(0, u.morale - 10) } : u));
    log.push({ turn: b.turn, text: `主將敗於陣前 — ${loserUnit.side === 'attacker' ? '攻方' : '守方'}三軍奪氣!`, kind: 'event' });
  }

  return { ...b, units, log, damagePopups: [...(b.damagePopups ?? []), ...popups] };
}

/**
 * 陣勢 — how much of a side's formation bonus is actually in force. It fades as
 * the line shatters (routing/disordered units, a fallen commander — 兵敗陣亂) and
 * swells with the commander's 陣法精通 (intelligence past the formation's gate).
 * Returns a scalar applied to every formation effect's deviation from neutral:
 * 0 = the 大陣 has dissolved (lost ⅔ of its standing line, or near-leaderless).
 */
export function formationStrength(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  officers?: Record<EntityId, Officer>,
): number {
  const formation = side === 'attacker' ? b.attackerFormation : b.defenderFormation;
  if (!formation || formation === 'none') return 0;
  const sideUnits = b.units.filter((u) => u.side === side && u.troops > 0);
  if (sideUnits.length === 0) return 0;
  // 整度 — fraction still holding the line (neither routing nor disordered).
  const holding = sideUnits.filter(
    (u) => !isRouting(u) && !u.effects.some((e) => e.kind === 'disorder'),
  ).length;
  const holdFrac = holding / sideUnits.length;
  if (holdFrac < 0.34) return 0; // 大陣已亂 — the formation has come apart
  const cmd = sideUnits.find((u) => u.isCommander);
  let integrity = holdFrac * (cmd ? 1 : 0.6); // 失帥則陣亂
  // 陣法精通 — a master tactician's formation bites far harder than a novice's.
  const gate = FORMATIONS_BY_ID[formation]?.minIntelligence ?? 0;
  const cmdInt = cmd && officers?.[cmd.officerId] ? effectiveStats(officers[cmd.officerId]).intelligence : 60;
  const mastery = 1 + Math.max(0, Math.min(0.35, (cmdInt - gate) / 160));
  return integrity * mastery;
}

/** Scale a formation effect's deviation from neutral (1.0) by the side's 陣勢. */
function applyFormStrength(rawMul: number, strength: number): number {
  return 1 + (rawMul - 1) * strength;
}

function defensiveFormationBonus(
  b: TacticalBattle,
  target: TacticalUnit,
  formation: FormationId,
): number {
  if (formation === 'fish-scale') {
    const adjAllies = b.units.filter(
      (u) =>
        u.side === target.side &&
        u.id !== target.id &&
        hexDistance(u.coord, target.coord) === 1,
    );
    if (adjAllies.length > 0) return 0.85; // 15% damage reduction
  }
  if (formation === 'spread-out') return 0.9;
  // ── New formations ──
  if (formation === 'square') return 0.80;             // all-side defense
  if (formation === 'crescent-moon') return 0.85;      // anti-flank
  if (formation === 'wheel') {
    // Compounding: each turn elapsed shaves more losses. floor 0.65.
    return Math.max(0.65, 0.95 - b.turn * 0.05);
  }
  if (formation === 'back-to-water') return 0.70;      // -30% own losses
  if (formation === 'trinity') {
    const sameSide = b.units.filter((u) => u.side === target.side).length;
    if (sameSide >= 3) return 0.90;                    // -10% when 3+ officers
  }
  if (formation === 'crescent-withdraw') {
    if (target.unitType === 'archers') return 0.75;    // crossbow corps protected
    return 0.95;
  }
  if (formation === 'long-snake') {
    // Strong from front, weak from flank — approximated as flat +5% bonus.
    return 0.95;
  }
  // ── Phase 53 additions ──
  if (formation === 'armored-cart') {
    // The cart wall — extra strong vs cavalry attackers.
    // (Attacker's unit type is unknown here; approximate as flat 0.80 defense.)
    return 0.80;
  }
  if (formation === 'stacked') {
    // Layered shield wall — strong frontal defense.
    return 0.60;
  }
  if (formation === 'four-symbols') {
    // Balanced — +15% on all sides translates to defense ~0.85.
    return 0.85;
  }
  if (formation === 'rattan-armor') {
    // Arrows skid off — but caller for fire-attack must double damage elsewhere.
    if (b.weather === 'rain') return 0.95; // wet rattan loses springiness
    return 0.70;
  }
  if (formation === 'five-elements') {
    // Cycle: earth turn (turn % 5 == 4) reduces losses heavily.
    const phase = b.turn % 5;
    if (phase === 4) return 0.75; // 土 — loss reduction
    if (phase === 1) return 0.85; // 木 — defense
    return 0.92;
  }
  return 1.0;
}

/**
 * Offensive multiplier from the attacker's formation.
 */
export function offensiveFormationBonus(
  formation: FormationId,
  unitType: UnitType,
  turn: number,
): number {
  if (formation === 'awl') {
    return turn === 1 ? 1.35 : 1.0;                    // first-strike piercing
  }
  if (formation === 'arrow-tip') {
    if (unitType === 'cavalry') return 1.15;
    return 1.05;
  }
  if (formation === 'wild-goose') {
    if (unitType === 'archers') return 1.15;
    return 1.05;
  }
  if (formation === 'back-to-water') return 1.20;      // death-or-victory
  if (formation === 'ten-ambush') return 1.25;         // multi-axis surprise
  if (formation === 'crescent-withdraw' && unitType === 'archers') return 1.25;
  if (formation === 'long-snake') return 1.05;
  if (formation === 'trinity') return 1.10;
  // ── Phase 53 additions ──
  if (formation === 'yoke' && unitType === 'spearmen') return 1.50; // anti-cavalry pikes
  if (formation === 'armored-cart' && unitType === 'infantry') return 1.15;
  if (formation === 'mandarin-duck' && unitType === 'infantry') return 1.25;
  if (formation === 'four-symbols') return 1.15;
  if (formation === 'seven-star') {
    // Stratagem-focused formation; small generic +5% melee.
    return 1.05;
  }
  if (formation === 'five-elements') {
    const phase = turn % 5;
    if (phase === 0 && (unitType === 'infantry' || unitType === 'spearmen')) return 1.20; // 金 — weapons
    if (phase === 2 && unitType === 'cavalry') return 1.20; // 水 — flow
    if (phase === 3 && unitType === 'archers') return 1.25; // 火 — archers (fire arrows)
    return 1.05;
  }
  return 1.0;
}

function weatherDamageMul(w: Weather, unitType: UnitType): number {
  if (w === 'rain' && unitType === 'archers') return 0.75;
  if (w === 'fog' && unitType === 'archers') return 0.7;
  if (w === 'snow') return 0.9;
  if (w === 'wind' && unitType === 'navy') return 1.15;
  return 1.0;
}

// ─── Stratagems ──────────────────────────────────────────────────────

/* ─── 戰前準備 — one preparation per side, before the first move ────────
   伏兵 ambush: your strongest non-commander contingent slips into
     concealment (the existing hidden mechanics: revealed by adjacency or
     its own first strike, which lands at the ambush bonus — ×1.5 at night).
   夜襲 night raid: the battle opens under darkness — ranged eyes shorten,
     ambushes bite harder, every line fights at night odds.
   地道 tunnel: siege attackers only — sappers carry your weakest
     contingent under the wall line; it surfaces inside the city. */
export type BattlePrepKind = 'ambush' | 'night' | 'tunnel';

/**
 * 計接戰場 — when an abstract-combat scheme (§5.3) is played out on the hex grid,
 * it manifests as a real opening: 火攻/火矢 → flames already licking the enemy
 * front; 埋伏 → a hidden contingent; 夜襲 → the battle opens in darkness; 斷糧 →
 * the enemy host already going hungry. Connects the two combat layers.
 */
export function applyOpeningScheme(b: TacticalBattle, scheme: string): TacticalBattle {
  const enemy: 'attacker' | 'defender' = 'defender'; // the scheme is the attacker's plot
  if (scheme === 'fire-attack' || scheme === 'fire-arrow') {
    if (b.weather === 'rain' || b.weather === 'snow') return b;
    // Set the foremost enemy unit's ground alight.
    const front = b.units.filter((u) => u.side === enemy && u.troops > 0)
      .sort((a, c) => a.coord.col - c.coord.col)[0]; // defenders sit east; lowest col = nearest the attacker
    if (!front) return b;
    return {
      ...b,
      groundFires: [...(b.groundFires ?? []), { coord: front.coord, turnsLeft: 3 }],
      log: [...(b.log ?? []), { turn: 1, text: '🔥 火計既發 — 敵營一隅已騰起烈焰!', kind: 'event' as const }],
    };
  }
  if (scheme === 'ambush' || scheme === 'set-ambush-path') {
    return applyBattlePrep(b, 'attacker', 'ambush').battle;
  }
  if (scheme === 'night-raid') {
    return applyBattlePrep(b, 'attacker', 'night').battle;
  }
  if (scheme === 'cut-supply' || scheme === 'cut-supply-strike') {
    const prey = b.units.filter((u) => u.side === enemy && u.troops > 0 && !u.isSupply)
      .sort((a, c) => c.troops - a.troops)[0];
    if (!prey) return b;
    return {
      ...b,
      units: b.units.map((u) => (u.id === prey.id
        ? { ...u, effects: u.effects.some((e) => e.kind === 'starving') ? u.effects : [...u.effects, { kind: 'starving' as const, turnsLeft: 4 }], morale: Math.max(0, u.morale - 12) }
        : u)),
      log: [...(b.log ?? []), { turn: 1, text: '🌾 糧道已斷 — 敵一軍乏食、士氣低落!', kind: 'event' as const }],
    };
  }
  return b;
}

export function applyBattlePrep(
  b: TacticalBattle,
  side: 'attacker' | 'defender',
  kind: BattlePrepKind,
): { battle: TacticalBattle; ok: boolean; reason?: string } {
  if (b.turn !== 1) return { battle: b, ok: false, reason: 'the battle is already joined' };
  if (b.prepUsed?.[side]) return { battle: b, ok: false, reason: 'already prepared' };
  const mark = (nb: TacticalBattle, text: string): TacticalBattle => ({
    ...nb,
    prepUsed: { ...b.prepUsed, [side]: kind },
    log: [...(nb.log ?? []), { turn: 1, text, kind: 'event' as const }],
  });

  if (kind === 'night') {
    // 夜襲劫營 — the enemy is roused from camp in disarray: every foe opens the
    // fight shaken (−18 morale). Night also cuts archery and emboldens ambush.
    const foe = side === 'attacker' ? 'defender' : 'attacker';
    const raided = b.units.map((u) =>
      u.side === foe && u.troops > 0 ? { ...u, morale: Math.max(0, u.morale - 18) } : u);
    return {
      battle: mark({ ...b, timeOfDay: 'night', units: raided },
        '🌙 夜襲劫營!敵軍倉促應戰、陣腳大亂(士氣挫),弓弩難及,伏兵愈利。'),
      ok: true,
    };
  }

  if (kind === 'ambush') {
    const candidates = b.units
      .filter((u) => u.side === side && !u.isCommander && u.troops > 0 && !u.hidden)
      .sort((a, z) => z.troops - a.troops);
    if (candidates.length === 0) return { battle: b, ok: false, reason: 'no contingent to conceal' };
    const chosen = candidates[0];
    return {
      battle: mark(
        { ...b, units: b.units.map((u) => (u.id === chosen.id ? { ...u, hidden: true } : u)) },
        '⚔ 伏兵已設 — 一軍銜枚潛行,候敵自投。',
      ),
      ok: true,
    };
  }

  // tunnel
  if (side !== 'attacker') return { battle: b, ok: false, reason: 'defenders dig no tunnels' };
  const wallCols = b.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate').map((t) => t.coord.col);
  if (wallCols.length === 0) return { battle: b, ok: false, reason: 'no walls to tunnel under' };
  const wallCol = Math.max(...wallCols);
  const movers = b.units
    .filter((u) => u.side === 'attacker' && !u.isCommander && u.troops > 0 && u.coord.col <= wallCol)
    .sort((a, z) => a.troops - z.troops);
  if (movers.length === 0) return { battle: b, ok: false, reason: 'no contingent to send below' };
  const occupied = new Set(b.units.filter((u) => u.troops > 0).map((u) => `${u.coord.col},${u.coord.row}`));
  const exit = b.tiles.find((t) =>
    t.coord.col === wallCol + 1
    && !occupied.has(`${t.coord.col},${t.coord.row}`)
    && !['wall', 'gate', 'river', 'deep-water'].includes(t.terrain));
  if (!exit) return { battle: b, ok: false, reason: 'no ground inside the walls' };
  return {
    battle: mark(
      { ...b, units: b.units.map((u) => (u.id === movers[0].id ? { ...u, coord: exit.coord } : u)) },
      '⛏ 地道既成 — 一軍自城下湧出,已在牆內!',
    ),
    ok: true,
  };
}

export function applyStratagem(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  targetCoord: HexCoord,
  officers: Record<EntityId, Officer>,
  /** Signature tactic riding this cast — 借東風 literally turns the sky. */
  tacticId?: string,
): { battle: TacticalBattle; ok: boolean; reason?: string } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false, reason: 'no unit' };
  const cooldownKey = `${unitId}-${stratagem}`;
  const onCd = (b.stratagemCooldowns[cooldownKey] ?? 0) > b.turn;
  if (onCd) return { battle: b, ok: false, reason: 'on cooldown' };
  if (unit.ap < 1) return { battle: b, ok: false, reason: 'no AP' };
  // 借東風 — before the fire lands, the caster prays the wind round to blow from
  // himself toward the enemy line, so the burn that follows spreads INTO their
  // fleet (the Red Cliffs button). It is NOT a sure thing: success scales with
  // the caster's wits, and a wiser enemy sage may 逆風 — pray it back. Heaven
  // does not always answer. (Gated here so a wasted/cooldown cast doesn't move
  // the sky for free; the result also opens a re-cast window via cooldown.)
  if (tacticId === 'borrow-wind') {
    const caster = officers[unit.officerId];
    const casterInt = caster?.stats.intelligence ?? 70;
    const foes = b.units.filter((u) => u.side !== unit.side && u.troops > 0);
    // 逆風 — the wisest opposing strategist resists; a true master can cancel it.
    let foeSage = 0;
    for (const u of foes) {
      const o = officers[u.officerId];
      if (!o) continue;
      const adept = o.skills?.includes('celestial-tactician') || o.skills?.includes('crouching-dragon') || o.skills?.includes('young-phoenix');
      if (o.stats.intelligence >= 80 || adept) foeSage = Math.max(foeSage, o.stats.intelligence + (adept ? 6 : 0));
    }
    const resist = foeSage > casterInt ? Math.min(0.6, (foeSage - casterInt) / 55) : 0;
    const success = Math.max(0.2, Math.min(0.97, 0.82 + (casterInt - 85) / 110)) * (1 - resist);
    const nameZh = caster?.name.zh ?? '';
    if (foes.length > 0 && Math.random() < success) {
      const avgCol = foes.reduce((sum, u) => sum + u.coord.col, 0) / foes.length;
      const avgRow = foes.reduce((sum, u) => sum + u.coord.row, 0) / foes.length;
      const dCol = avgCol - unit.coord.col;
      const dRow = avgRow - unit.coord.row;
      const dir: WindDirection = Math.abs(dCol) >= Math.abs(dRow)
        ? (dCol >= 0 ? 'east' : 'west')
        : (dRow >= 0 ? 'south' : 'north');
      b = {
        ...b,
        weather: 'wind',
        windDirection: dir,
        log: [...(b.log ?? []), {
          turn: b.turn,
          text: `🌬 ${nameZh}祭風祈禳,風雲突變 — ${dir === 'east' ? '東' : dir === 'west' ? '西' : dir === 'south' ? '南' : '北'}風大作!`,
          kind: 'event' as const,
        }],
      };
    } else {
      // 風不應禱 — the ritual fails (heaven, or an enemy sage praying it back).
      b = {
        ...b,
        log: [...(b.log ?? []), {
          turn: b.turn,
          text: resist > 0.25
            ? `🌬 ${nameZh}祭風,然敵營亦有高人逆風相抗 — 風終不至。`
            : `🌬 ${nameZh}祭風祈禳,然天意難測 — 風候未應。`,
          kind: 'event' as const,
        }],
      };
    }
  }

  const off = officers[unit.officerId];

  // 看破/反計 — a rival master strategist on the receiving side may see through
  // a 計略 and foil it; the caster wastes the turn (AP + cooldown spent).
  const COUNTERABLE: StratagemId[] = ['fire-attack', 'confusion', 'false-retreat', 'lightning', 'rain-of-arrows'];
  if (COUNTERABLE.includes(stratagem)) {
    const t0 = unitAt(b, targetCoord);
    const foeSide = t0 ? t0.side : unit.side === 'attacker' ? 'defender' : 'attacker';
    let seer: Officer | null = null;
    for (const u of b.units) {
      if (u.side !== foeSide || u.troops <= 0) continue;
      const o = officers[u.officerId];
      if (!o) continue;
      if (!(o.skills?.includes('celestial-tactician') || o.skills?.includes('crouching-dragon') || o.skills?.includes('young-phoenix'))) continue;
      if (!seer || o.stats.intelligence > seer.stats.intelligence) seer = o;
    }
    if (seer) {
      const chance = Math.max(0, Math.min(0.5, (seer.stats.intelligence - (off?.stats.intelligence ?? 60) + 18) / 100));
      if (Math.random() < chance) {
        return {
          battle: {
            ...b,
            units: b.units.map((u) => (u.id === unitId ? { ...u, ap: u.ap - 1 } : u)),
            stratagemCooldowns: { ...b.stratagemCooldowns, [cooldownKey]: b.turn + 2 },
            log: [...(b.log ?? []), { turn: b.turn, text: `${seer.name.zh}看破此計 — 計不得售!`, kind: 'event' as const }],
          },
          ok: true,
        };
      }
    }
  }

  switch (stratagem) {
    case 'fire-attack': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      const bareTile = tileAt(b, targetCoord);
      const tileFlammable = !!bareTile && ['forest', 'plain', 'road', 'bridge'].includes(bareTile.terrain);
      if ((!target || target.side === unit.side) && !(target == null && tileFlammable && b.weather !== 'rain'))
        return { battle: b, ok: false, reason: 'invalid target' };
      // Wind doubles fire duration; rain halves it. 火攻 master stokes it +1 turn.
      const baseTurns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 3;
      const turns = baseTurns + ((off?.traits as string[] | undefined ?? []).includes('fire-tactician') ? 1 : 0);
      let updated = target && target.side !== unit.side
        ? setStatus(b, target.id, { kind: 'burning', turnsLeft: turns })
        : b;
      // The ground itself catches — a spreading field fire (火攻).
      const groundTile = tileAt(b, targetCoord);
      if (groundTile && (groundTile.terrain === 'forest' || groundTile.terrain === 'plain' || groundTile.terrain === 'road') && b.weather !== 'rain') {
        updated = {
          ...updated,
          groundFires: [
            ...(updated.groundFires ?? []),
            { coord: targetCoord, turnsLeft: groundTile.terrain === 'forest' ? 4 : 2 },
          ],
          log: [...(updated.log ?? []), { turn: b.turn, text: '烈火騰起，野地燃成一片！', kind: 'event' }],
        };
      }
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'confusion': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const updated = setStatus(b, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'defend': {
      // 據守整隊 — digging in also re-forms a unit whose ranks were thrown into
      // disorder (a charge / a river ford), clearing 陷亂 on the spot.
      const reformed = {
        ...b,
        units: b.units.map((u) => (u.id === unit.id
          ? { ...u, effects: u.effects.filter((e) => e.kind !== 'disorder') }
          : u)),
      };
      const updated = setStatus(reformed, unit.id, { kind: 'defending', turnsLeft: 1 });
      return finalize(updated, unitId, stratagem, 0);
    }
    case 'rally': {
      if ((off?.stats.intelligence ?? 0) < 60)
        return { battle: b, ok: false, reason: 'requires INT 60' };
      if (hexDistance(unit.coord, targetCoord) > 2)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side !== unit.side)
        return { battle: b, ok: false, reason: 'must be friendly' };
      const restored = Math.floor(target.maxTroops * 0.15);
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                troops: Math.min(u.maxTroops, u.troops + restored),
                morale: Math.min(100, u.morale + 25),
              }
            : u,
        ),
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'charge': {
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Charge: +50% damage, spend all AP. Open ground spurs the charge home;
      // forest/mountain bog it down (戰法情境).
      const aWar = off?.stats.war ?? 50;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      const chgSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      const chgTraitMul = off ? stratagemDamageMul(off, stratagem) : 1;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.5) / (dLead + 50) * chgSit.mult * chgTraitMul,
      );
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 25) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
      };
      return finalize(updated, unitId, stratagem, 2);
    }
    case 'rain-of-arrows': {
      const maxRange = b.timeOfDay === 'night' ? 2 : 4;
      const d = hexDistance(unit.coord, targetCoord);
      if (d > maxRange || d < 2)
        return { battle: b, ok: false, reason: `range 2–${maxRange}` };
      // 矢盡 — a ranged unit out of arrows can't volley until resupplied (糧車/補給格).
      if (unit.maxAmmo !== undefined && (unit.ammo ?? 0) <= 0)
        return { battle: b, ok: false, reason: '矢盡待補給' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // 戰法情境 — rain soaks the bowstrings, high ground extends the volley.
      const arrSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      const stratMul = arrSit.mult * (off ? stratagemDamageMul(off, stratagem) : 1);
      // 拋射覆蓋 — a volley falls over an area: the aimed hex takes the brunt,
      // every other enemy pressed up against it catches the spillover (半傷).
      // Arcing shots loft over walls/units, so no line-of-sight or cover applies.
      const splashIds = new Set(
        b.units.filter((u) => u.side === target.side && u.troops > 0 && u.id !== target.id
          && hexDistance(u.coord, target.coord) === 1).map((u) => u.id),
      );
      const popups: DamagePopup[] = [];
      const updated: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id) {
            const dmg = Math.floor(u.troops * 0.12 * stratMul);
            popups.push({ id: `dmg-${Date.now()}-arr`, coord: u.coord, text: `-${dmg.toLocaleString()}`, color: '#88b7e8', spawnedAt: Date.now() });
            return { ...u, troops: Math.max(0, u.troops - dmg), morale: Math.max(0, u.morale - 3) };
          }
          if (splashIds.has(u.id)) {
            const dmg = Math.floor(u.troops * 0.06 * stratMul);
            popups.push({ id: `dmg-${Date.now()}-arr-${u.id}`, coord: u.coord, text: `-${dmg.toLocaleString()}`, color: '#9cc0e8', spawnedAt: Date.now() + 1 });
            return { ...u, troops: Math.max(0, u.troops - dmg) };
          }
          if (u.id === unit.id) return {
            ...u, ap: u.ap - 1,
            ammo: u.maxAmmo !== undefined ? Math.max(0, (u.ammo ?? 0) - 1) : u.ammo,
            fatigue: Math.min(100, (u.fatigue ?? 0) + FATIGUE_PER_VOLLEY),
          };
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), ...popups],
      };
      const updated2 = splashIds.size > 0
        ? { ...updated, log: [...(updated.log ?? []), { turn: b.turn, text: '矢雨覆蓋,波及一片!', kind: 'event' as const }] }
        : updated;
      return finalize(updated2, unitId, stratagem, 1);
    }
    case 'chain-ships': {
      if ((off?.stats.intelligence ?? 0) < 80)
        return { battle: b, ok: false, reason: 'requires INT 80' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Chain target + its adjacent allies.
      const chained = b.units.filter(
        (u) => u.side === target.side && hexDistance(u.coord, target.coord) <= 1,
      );
      const chainedIds = chained.map((u) => u.id);
      let next = b;
      for (const c of chained) {
        next = setStatus(next, c.id, {
          kind: 'chained',
          turnsLeft: 4,
          chainedWith: chainedIds.filter((id) => id !== c.id),
        });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'false-retreat': {
      if ((off?.stats.intelligence ?? 0) < 70)
        return { battle: b, ok: false, reason: 'requires INT 70' };
      // 詐敗誘敵 — the caster feigns a rout (sets a 詐敗 trap on itself: the next
      // pursuer to strike it springs a full-strength回馬 counter and is thrown
      // into disorder) AND rattles the nearest foe into giving chase.
      const enemies = b.units
        .filter((u) => u.side !== unit.side)
        .sort((a, c) => hexDistance(unit.coord, a.coord) - hexDistance(unit.coord, c.coord));
      let next = setStatus(b, unit.id, { kind: 'feign-rout', turnsLeft: 3 });
      if (enemies[0]) next = setStatus(next, enemies[0].id, { kind: 'confused', turnsLeft: 2 });
      next = { ...next, log: [...(next.log ?? []), { turn: b.turn, text: `${off?.name.zh ?? '我軍'}佯敗回旋,虛留破綻以誘追兵。`, kind: 'event' as const }] };
      return finalize(next, unitId, stratagem, 0);
    }
    case 'precognition': {
      if ((off?.stats.intelligence ?? 0) < 90)
        return { battle: b, ok: false, reason: 'requires INT 90' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'revealed', turnsLeft: 2 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'lightning': {
      if ((off?.stats.intelligence ?? 0) < 85)
        return { battle: b, ok: false, reason: 'requires INT 85' };
      if (hexDistance(unit.coord, targetCoord) > 4)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target) return { battle: b, ok: false, reason: 'no target' };
      // 戰法情境 — a brewing storm feeds the bolt; fog/snow damps it.
      const ltSit = battleStratagemSituation(b, unit.coord, targetCoord, stratagem);
      const damage = Math.floor(target.troops * 0.15 * ltSit.mult * (off ? stratagemDamageMul(off, stratagem) : 1));
      const confuse = Math.random() < 0.3;
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-lightning`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}⚡`,
            color: '#e0d090',
            spawnedAt: Date.now(),
          },
        ],
      };
      if (confuse) next = setStatus(next, target.id, { kind: 'confused', turnsLeft: 2 });
      return finalize(next, unitId, stratagem, 0);
    }
    case 'supply-strike': {
      if ((off?.stats.intelligence ?? 0) < 75)
        return { battle: b, ok: false, reason: 'requires INT 75' };
      let next = b;
      for (const e of b.units.filter((u) => u.side !== unit.side)) {
        next = setStatus(next, e.id, { kind: 'demoralized', turnsLeft: 3 });
      }
      return finalize(next, unitId, stratagem, 0);
    }
    case 'gallop': {
      // Lü Bu's signature: charge up to 3 hexes in a straight line.
      if (hexDistance(unit.coord, targetCoord) > 3 || hexDistance(unit.coord, targetCoord) < 1)
        return { battle: b, ok: false, reason: 'range 1–3' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      // Move adjacent to target, deal 1.75× damage.
      const neighbours = hexNeighbours(target.coord);
      const landing = neighbours.find(
        (c) => tileAt(b, c) && !unitAt(b, c),
      );
      const aWar = off?.stats.war ?? 80;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.75) / (dLead + 50),
      );
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === unit.id && landing) {
            return { ...u, coord: landing, ap: 0 };
          }
          if (u.id === target.id) {
            return { ...u, troops: Math.max(0, u.troops - damage) };
          }
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          {
            id: `dmg-${Date.now()}-gallop`,
            coord: target.coord,
            text: `-${damage.toLocaleString()}!`,
            color: '#ff6a4a',
            spawnedAt: Date.now(),
          },
        ],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '飛将，突貫!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'dragon-veil': {
      // Zhao Yun's signature: hit every adjacent enemy.
      const adjEnemies = b.units.filter(
        (u) => u.side !== unit.side && hexDistance(u.coord, unit.coord) === 1,
      );
      if (adjEnemies.length === 0)
        return { battle: b, ok: false, reason: 'no adjacent enemies' };
      const aWar = off?.stats.war ?? 80;
      const popups: DamagePopup[] = [];
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          const enemy = adjEnemies.find((e) => e.id === u.id);
          if (enemy) {
            const dLead = officers[u.officerId]?.stats.leadership ?? 50;
            const dmg = Math.floor(
              (unit.troops * (aWar + 30) * 0.6) / (dLead + 50),
            );
            popups.push({
              id: `dmg-${Date.now()}-veil-${u.id}`,
              coord: u.coord,
              text: `-${dmg.toLocaleString()}`,
              color: '#ff6a4a',
              spawnedAt: Date.now(),
            });
            return { ...u, troops: Math.max(0, u.troops - dmg) };
          }
          return u;
        }),
        damagePopups: [...(b.damagePopups ?? []), ...popups],
        log: [
          ...(b.log ?? []),
          {
            turn: b.turn,
            text: '龍威在此!',
            speaker: unit.officerId,
            kind: 'voice',
          },
        ],
      };
      return finalize(next, unitId, stratagem, 3);
    }
    case 'ram': {
      // 撞角 — drive the prow into an adjacent ship. Heavy hull damage scaled
      // by this ship's class; spends all AP like a charge.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dLead = officers[target.officerId]?.stats.leadership ?? 50;
      // 撞沉 — ramming caves in a hull; against another ship it's devastating.
      const ramShipMul = target.unitType === 'navy' ? 1.5 : 1.0;
      const damage = Math.floor(
        (unit.troops * (aWar + 30) * 1.6 * shipPowerMul(unit.shipClass) * ramShipMul) / (dLead + 50),
      );
      const sank = damage >= target.troops;
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 20) };
          if (u.id === unit.id) return { ...u, ap: 0 };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-ram`, coord: target.coord, text: `${sank && target.unitType === 'navy' ? '撞沉 ' : ''}-${damage.toLocaleString()}!`, color: '#7ec8e6', spawnedAt: Date.now() },
        ],
        log: sank && target.unitType === 'navy'
          ? [...(b.log ?? []), { turn: b.turn, text: `${officers[target.officerId]?.name.zh ?? '敵艦'}座艦被撞沉!`, kind: 'event' as const }]
          : b.log,
      };
      return finalize(next, unitId, stratagem, 2);
    }
    case 'board': {
      // 接舷 — grapple an adjacent ship and fight it out on the decks. War-based
      // marine melee that shatters morale and costs the boarder little.
      if (hexDistance(unit.coord, targetCoord) > 1)
        return { battle: b, ok: false, reason: 'adjacent only' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const aWar = off?.stats.war ?? 60;
      const dWar = officers[target.officerId]?.stats.war ?? 50;
      const damage = Math.floor((unit.troops * (aWar + 30) * 1.1) / (dWar + 60));
      const selfLoss = Math.floor(damage * 0.25);
      const next: TacticalBattle = {
        ...b,
        units: b.units.map((u) => {
          if (u.id === target.id)
            return { ...u, troops: Math.max(0, u.troops - damage), morale: Math.max(0, u.morale - 35) };
          if (u.id === unit.id) return { ...u, troops: Math.max(0, u.troops - selfLoss) };
          return u;
        }),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-board`, coord: target.coord, text: `-${damage.toLocaleString()}`, color: '#ff8a4a', spawnedAt: Date.now() },
        ],
      };
      return finalize(next, unitId, stratagem, 1);
    }
    case 'fire-ship': {
      // 火船 — send blazing hulks downwind into the enemy line. Sets fire (long
      // in wind, doused in rain) plus immediate damage; ruinous against a fleet
      // chained together (連環計 + 火船 = 赤壁).
      if ((off?.stats.intelligence ?? 0) < 65)
        return { battle: b, ok: false, reason: 'requires INT 65' };
      if (hexDistance(unit.coord, targetCoord) > 3)
        return { battle: b, ok: false, reason: 'out of range' };
      const target = unitAt(b, targetCoord);
      if (!target || target.side === unit.side)
        return { battle: b, ok: false, reason: 'invalid target' };
      const turns = b.weather === 'wind' ? 5 : b.weather === 'rain' ? 1 : 4;
      const damage = Math.floor(target.troops * 0.12);
      let next: TacticalBattle = {
        ...b,
        units: b.units.map((u) =>
          u.id === target.id ? { ...u, troops: Math.max(0, u.troops - damage) } : u,
        ),
        damagePopups: [
          ...(b.damagePopups ?? []),
          { id: `dmg-${Date.now()}-fireship`, coord: target.coord, text: `-${damage.toLocaleString()}🔥`, color: '#ff7a3a', spawnedAt: Date.now() },
        ],
      };
      next = setStatus(next, target.id, { kind: 'burning', turnsLeft: turns });
      return finalize(next, unitId, stratagem, 3);
    }
    case 'rockslide': {
      if ((off?.stats.war ?? 0) < 55)
        return { battle: b, ok: false, reason: 'requires WAR 55' };
      if (hexDistance(unit.coord, targetCoord) > 2)
        return { battle: b, ok: false, reason: 'out of range' };
      // Must hold (or flank) the heights.
      const onMountain = [unit.coord, ...hexNeighbours(unit.coord)].some((c) => {
        const t = tileAt(b, c);
        return t?.terrain === 'mountain';
      });
      if (!onMountain) return { battle: b, ok: false, reason: 'needs mountain footing' };
      const tTile = tileAt(b, targetCoord);
      if (!tTile || !['road', 'plain', 'hill', 'chokepoint'].includes(tTile.terrain))
        return { battle: b, ok: false, reason: 'invalid ground' };
      const victim = unitAt(b, targetCoord);
      let next = b;
      if (victim && victim.side !== unit.side) {
        const dmg = Math.min(victim.troops, Math.floor(victim.troops * 0.18) + 250);
        next = {
          ...next,
          units: next.units.map((u) => u.id === victim.id
            ? { ...u, troops: Math.max(0, u.troops - dmg), morale: Math.max(0, u.morale - 12) }
            : u),
        };
      }
      next = {
        ...next,
        tiles: next.tiles.map((t) =>
          t.coord.col === targetCoord.col && t.coord.row === targetCoord.row
            ? { ...t, terrain: 'mountain' as TerrainKind }
            : t),
        log: [...(next.log ?? []), { turn: b.turn, text: '山崩石落，道路斷絕！', kind: 'event' }],
      };
      return finalize(next, unitId, stratagem, 0);
    }
    case 'raid-supply': {
      // 劫糧道 — only from deep in the enemy rear (flank a raider around the
      // line, 烏巢-style). Torches the grain: every enemy unit starts starving
      // — bleeding deserters and morale each turn. Long cooldown: the depot
      // only burns once.
      const inRear = unit.side === 'attacker'
        ? unit.coord.col >= b.width - 3
        : unit.coord.col <= 2;
      if (!inRear)
        return { battle: b, ok: false, reason: 'must reach the enemy rear' };
      const foes = b.units.filter((u) => u.side !== unit.side && u.troops > 0);
      if (foes.length === 0) return { battle: b, ok: false, reason: 'no enemy supply to burn' };
      let next = b;
      for (const e of foes) {
        next = setStatus(next, e.id, { kind: 'starving', turnsLeft: 5 });
      }
      next = {
        ...next,
        log: [
          ...(next.log ?? []),
          { turn: b.turn, text: '糧道斷絕，敵軍大亂！', speaker: unit.officerId, kind: 'event' },
        ],
      };
      return finalize(next, unitId, stratagem, 6);
    }
  }
}

function setStatus(
  b: TacticalBattle,
  unitId: EntityId,
  status: TacticalStatus,
): TacticalBattle {
  return {
    ...b,
    units: b.units.map((u) => {
      if (u.id !== unitId) return u;
      const filtered = u.effects.filter((e) => e.kind !== status.kind);
      return { ...u, effects: [...filtered, status] };
    }),
  };
}

function finalize(
  b: TacticalBattle,
  unitId: EntityId,
  stratagem: StratagemId,
  cooldownTurns: number,
): { battle: TacticalBattle; ok: boolean } {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) return { battle: b, ok: false };
  const newAp = stratagem === 'charge' ? 0 : Math.max(0, unit.ap - 1);
  const next: TacticalBattle = {
    ...b,
    units: b.units.map((u) => (u.id === unitId ? { ...u, ap: newAp } : u)),
    stratagemCooldowns: {
      ...b.stratagemCooldowns,
      [`${unitId}-${stratagem}`]: b.turn + cooldownTurns,
    },
  };
  return { battle: next, ok: true };
}

// ─── Turn end ────────────────────────────────────────────────────────

export function endTurn(b: TacticalBattle, officers?: Record<EntityId, Officer>): TacticalBattle {
  // Prune expired damage popups — every battle event appends to the array and
  // nothing ever removed them, so a long battle accumulated hundreds of dead
  // popup nodes (and the embedded diorama showed them frozen mid-air).
  const now = Date.now();
  b = { ...b, damagePopups: (b.damagePopups ?? []).filter((p) => now - p.spawnedAt < 2000) };
  // Eight-trigrams aura: friendly units in formation regen 4% per turn.
  const inFormation = (side: 'attacker' | 'defender') =>
    (side === 'attacker' ? b.attackerFormation : b.defenderFormation) === 'eight-trigrams';

  // Apply ongoing effects (burning), tick durations, then flip side.
  let tickedUnits = b.units.map((u) => {
    let troops = u.troops;
    let morale = u.morale;
    const newEffects: TacticalStatus[] = [];
    // Rattan-armor doubles fire damage (oil-cured rattan ignites); so do
    // pitch-caulked wooden ships — fire is death on the water (赤壁).
    const uSideFormation = u.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
    // 藤甲 burns catastrophically (canonical); ships burn hard but a touch less,
    // so a single fire-ship cast no longer near-auto-wipes a clumped fleet.
    const fireMul = uSideFormation === 'rattan-armor' ? 2.0 : u.unitType === 'navy' ? 1.6 : 1.0;
    for (const e of u.effects) {
      if (e.kind === 'burning') {
        const burn = Math.floor(u.maxTroops * 0.08 * fireMul);
        troops = Math.max(0, troops - burn);
      }
      // 糧盡 — a starving host bleeds deserters and loses heart each turn.
      if (e.kind === 'starving') {
        troops = Math.max(0, troops - Math.floor(u.maxTroops * 0.06));
        morale = Math.max(0, morale - 5);
      }
      if (e.turnsLeft > 1) {
        newEffects.push({ ...e, turnsLeft: e.turnsLeft - 1 });
      }
    }
    // Eight Trigrams heal.
    if (inFormation(u.side)) {
      troops = Math.min(u.maxTroops, troops + Math.floor(u.maxTroops * 0.04));
    }
    // 久戰疲乏 — a rested unit catches its breath (more so if it stood on the
    // defensive); a spent unit (≥70) fields one fewer AP next turn.
    const wasDefending = u.effects.some((e) => e.kind === 'defending');
    const fatigue = Math.max(0, (u.fatigue ?? 0) - (wasDefending ? FATIGUE_REST_DEFEND : FATIGUE_REST));
    const ap = Math.max(1, u.maxAp - (fatigue >= FATIGUE_SPENT ? 1 : 0));
    // 就地補給 — a ranged unit beside a 糧車 or supply tile draws fresh arrows.
    let ammo = u.ammo;
    if (u.maxAmmo !== undefined && (u.ammo ?? 0) < u.maxAmmo) {
      const resupplied = b.units.some((s) => s.isSupply && s.side === u.side && s.troops > 0 && hexDistance(s.coord, u.coord) === 1)
        || (b.specialTiles ?? []).some((s) => (s.role === 'supply' || s.role === 'wagon') && hexDistance(s.coord, u.coord) <= 1);
      if (resupplied) ammo = Math.min(u.maxAmmo, (u.ammo ?? 0) + 1);
    }
    // 衝鋒蓄力 is momentum within a single activation — it doesn't carry across
    // turns; a unit must build its run anew each turn.
    return { ...u, troops, morale, effects: newEffects, ap, fatigue, ammo, charge: undefined };
  });

  // 旗令/開朗/沉勇 — a unit beside a morale-aura officer recovers heart each turn
  // (the aura the bearer projects to ADJACENT allies). Skipped when the caller
  // didn't supply the officer map (e.g. unit tests).
  if (officers) {
    tickedUnits = tickedUnits.map((u) => {
      if (u.troops <= 0 || u.morale >= 100) return u;
      let aura = 0;
      for (const other of tickedUnits) {
        if (other.id === u.id || other.side !== u.side || other.troops <= 0) continue;
        if (hexDistance(other.coord, u.coord) !== 1) continue;
        const oo = officers[other.officerId];
        if (oo) aura += tacticalMoraleAura(oo);
      }
      return aura > 0 ? { ...u, morale: Math.min(100, u.morale + Math.min(8, aura)) } : u;
    });

    // 將旗統率 — the commander's banner steadies the host within its 統率半徑
    // (R = 2 + 統率/40, so a great captain holds a wider line); a unit beyond
    // ALL support — out of the banner AND with no friendly shoulder beside it —
    // is 孤軍 and loses heart each turn (孤軍奮戰，軍心漸搖), which can tip it into
    // a rout. The commander itself is exempt.
    const banners = tickedUnits
      .filter((c) => c.isCommander && c.troops > 0 && c.morale > 0)
      .map((c) => ({
        side: c.side,
        coord: c.coord,
        radius: 2 + Math.floor((officers[c.officerId] ? effectiveStats(officers[c.officerId]).leadership : 60) / 40),
      }));
    tickedUnits = tickedUnits.map((u) => {
      if (u.troops <= 0 || u.isCommander) return u;
      const inBanner = banners.some((bn) => bn.side === u.side && hexDistance(bn.coord, u.coord) <= bn.radius);
      if (inBanner) {
        return u.morale < 100 ? { ...u, morale: Math.min(100, u.morale + 3) } : u;
      }
      const hasShoulder = tickedUnits.some(
        (f) => f.side === u.side && f.id !== u.id && f.troops > 0 && hexDistance(f.coord, u.coord) === 1,
      );
      if (!hasShoulder) return { ...u, morale: Math.max(0, u.morale - 6) };
      return u;
    });

    // 寡不敵眾 / 眾寡懸殊 — local force balance shows in the heart: a unit hemmed
    // in by a far heavier press of foes (within 2 hexes) wavers (−4), while one
    // that overwhelmingly outweighs the enemy around it takes heart (+3). Quiet
    // pockets with no contact nearby are left alone.
    tickedUnits = tickedUnits.map((u) => {
      if (u.troops <= 0 || isRouting(u)) return u;
      let friend = 0;
      let foe = 0;
      for (const o of tickedUnits) {
        if (o.troops <= 0 || o.isSupply) continue;
        const d = hexDistance(o.coord, u.coord);
        if (d > 2) continue;
        if (o.side === u.side) friend += o.troops;
        else foe += o.troops;
      }
      if (foe <= 0) return u;
      const ratio = friend / foe;
      if (ratio < 0.5 && u.morale > 0) return { ...u, morale: Math.max(0, u.morale - 4) };
      if (ratio > 2.5 && u.morale < 100) return { ...u, morale: Math.min(100, u.morale + 3) };
      return u;
    });

    // 順勢/頹勢 — the side riding the battle's momentum takes heart; the side
    // losing it bleeds morale. Scales with how lopsided the tide has become.
    const mom = b.momentum ?? 0;
    if (Math.abs(mom) >= 35) {
      const swing = Math.min(2, Math.floor(Math.abs(mom) / 35) + 1);
      const favored: 'attacker' | 'defender' = mom > 0 ? 'attacker' : 'defender';
      tickedUnits = tickedUnits.map((u) => {
        if (u.troops <= 0 || isRouting(u)) return u;
        if (u.side === favored) return u.morale < 100 ? { ...u, morale: Math.min(100, u.morale + swing) } : u;
        return u.morale > 0 ? { ...u, morale: Math.max(0, u.morale - swing) } : u;
      });
    }
  }

  // ── 燒糧 — a supply convoy reduced to ruin starves the host that leaned on
  // it: the owning side's units lose heart and begin deserting (烏巢之火).
  // One-shot, guarded by grainBurned so it never re-fires.
  let grainBurned = b.grainBurned ?? false;
  const grainLog: NonNullable<TacticalBattle['log']> = [];
  if (!grainBurned) {
    const burnedSides = new Set(
      b.units.filter((u) => u.isSupply && u.troops <= 0).map((u) => u.side),
    );
    if (burnedSides.size > 0) {
      grainBurned = true;
      tickedUnits = tickedUnits.map((u) => {
        if (!burnedSides.has(u.side) || u.isSupply || u.troops <= 0) return u;
        const starving = u.effects.some((e) => e.kind === 'starving')
          ? u.effects
          : [...u.effects, { kind: 'starving' as const, turnsLeft: 3 }];
        return { ...u, morale: Math.max(0, u.morale - 20), effects: starving };
      });
      grainLog.push({ turn: b.turn + 1, text: '糧車被焚！三軍乏食、士氣大挫 — 軍心動搖。', kind: 'event' });
    }
  }

  // ── Fire spread: each burning unit may set an adjacent unit alight.
  // Rain blocks spread entirely; wind doubles the chance and biases the
  // spread direction. Forest hexes and rattan-armor units catch fire most
  // readily.
  if (b.weather !== 'rain') {
    const baseSpreadChance = b.weather === 'wind' ? 0.45 : 0.22;
    // East wind = fire spreads west-to-east; south wind = north-to-south, etc.
    const wd = WIND_DELTA[b.windDirection ?? 'calm'];
    const burningIds = tickedUnits
      .filter((u) => u.effects.some((e) => e.kind === 'burning'))
      .map((u) => u.id);
    for (const bid of burningIds) {
      const src = tickedUnits.find((u) => u.id === bid);
      if (!src) continue;
      const neighbours = hexNeighbours(src.coord);
      // Score each adjacent occupied hex by alignment with wind, then pick
      // the highest-scored to bias spread direction.
      const adjUnits = tickedUnits.filter(
        (u) => neighbours.some((n) => n.col === u.coord.col && n.row === u.coord.row) &&
               !u.effects.some((e) => e.kind === 'burning'),
      );
      if (adjUnits.length === 0) continue;
      // Higher score = better match with wind direction.
      const scored = adjUnits.map((u) => {
        const dx = u.coord.col - src.coord.col;
        const dy = u.coord.row - src.coord.row;
        const align = wd.col * dx + wd.row * dy;
        return { u, score: align };
      });
      scored.sort((a, b1) => b1.score - a.score);
      const adjUnit = scored[0].u;
      const tile = b.tiles.find(
        (t) => t.coord.col === adjUnit.coord.col && t.coord.row === adjUnit.coord.row,
      );
      const adjFormation = adjUnit.side === 'attacker' ? b.attackerFormation : b.defenderFormation;
      let chance = baseSpreadChance;
      if (tile?.terrain === 'forest') chance *= 1.6;
      if (adjFormation === 'rattan-armor') chance *= 2.0;
      if (adjUnit.unitType === 'navy') chance *= 1.5; // fire leaps hull to hull
      // Strong wind alignment bonus when picked unit is downwind.
      if (scored[0].score > 0 && b.windDirection !== 'calm') chance *= 1.3;
      if (Math.random() < chance) {
        tickedUnits = tickedUnits.map((u) =>
          u.id === adjUnit.id
            ? { ...u, effects: [...u.effects, { kind: 'burning', turnsLeft: 2 }] }
            : u,
        );
      }
    }
  }

  // ── Ground fire (火攻): hexes ablaze burn whoever stands on them,
  // creep downwind through flammable ground, drown in the rain, and
  // leave torched forests as open ground.
  let nextTiles = b.tiles;
  let nextGroundFires = b.groundFires ?? [];
  const fireLog: NonNullable<TacticalBattle['log']> = [];
  if (nextGroundFires.length > 0) {
    const fireKey = (c: HexCoord) => `${c.col},${c.row}`;
    const burningSet = new Set(nextGroundFires.map((f) => fireKey(f.coord)));
    // Burn whoever stands in the flames (and set them alight). 火燒糧道 —
    // a supply train caught in a blaze is dry tinder: its wagons go up far
    // faster (×3 loss), and the lost grain is what really breaks the host
    // downstream (see the 燒糧 starve-check above). 烏巢, 上方谷.
    tickedUnits = tickedUnits.map((u) => {
      if (!burningSet.has(fireKey(u.coord)) || u.troops <= 0) return u;
      const burnRate = u.isSupply ? 0.21 : 0.07;
      const loss = Math.max(40, Math.floor(u.troops * burnRate));
      const effects = u.effects.some((e) => e.kind === 'burning')
        ? u.effects
        : [...u.effects, { kind: 'burning' as const, turnsLeft: 2 }];
      return { ...u, troops: Math.max(0, u.troops - loss), morale: Math.max(0, u.morale - (u.isSupply ? 8 : 4)), effects };
    });
    // Spread downwind into flammable neighbours.
    const FLAMMABLE: Record<string, number> = { forest: 0.5, bridge: 0.45, plain: 0.22, road: 0.12, marsh: 0.05 };
    const wd2 = WIND_DELTA[b.windDirection ?? 'calm'];
    const sparked: Array<{ coord: HexCoord; turnsLeft: number }> = [];
    if (b.weather !== 'rain') {
      for (const f of nextGroundFires) {
        for (const n of hexNeighbours(f.coord)) {
          if (burningSet.has(fireKey(n))) continue;
          const t = nextTiles.find((x) => x.coord.col === n.col && x.coord.row === n.row);
          if (!t) continue;
          let chance = FLAMMABLE[t.terrain] ?? 0;
          if (chance <= 0) continue;
          const align = wd2.col * (n.col - f.coord.col) + wd2.row * (n.row - f.coord.row);
          if (b.windDirection !== 'calm') chance *= align > 0 ? 1.8 : 0.5;
          if (b.weather === 'wind') chance *= 1.4;
          if (Math.random() < chance) {
            // 火頭遞弱 — the spreading front can't burn longer than the ember
            // that lit it, so fire weakens the further it creeps from its
            // source (downwind it carries; against the wind it soon dies).
            const base = t.terrain === 'forest' ? 4 : 2;
            sparked.push({ coord: n, turnsLeft: Math.max(1, Math.min(base, f.turnsLeft)) });
            burningSet.add(fireKey(n));
          }
        }
      }
    }
    if (sparked.length > 0) fireLog.push({ turn: b.turn, text: '風助火勢，烈焰蔓延！', kind: 'event' });
    // Tick down (rain smothers fast); torched forest becomes open ground.
    const tickAmount = b.weather === 'rain' ? 2 : 1;
    const expiring = nextGroundFires.filter((f) => f.turnsLeft - tickAmount <= 0);
    for (const f of expiring) {
      const t = nextTiles.find((x) => x.coord.col === f.coord.col && x.coord.row === f.coord.row);
      if (t?.terrain === 'forest') {
        nextTiles = nextTiles.map((x) =>
          x.coord.col === f.coord.col && x.coord.row === f.coord.row
            ? { ...x, terrain: 'plain' as TerrainKind }
            : x);
      } else if (t?.terrain === 'bridge') {
        // 燒橋 — the span collapses into the river; the crossing is cut.
        nextTiles = nextTiles.map((x) =>
          x.coord.col === f.coord.col && x.coord.row === f.coord.row
            ? { ...x, terrain: 'river' as TerrainKind }
            : x);
        fireLog.push({ turn: b.turn, text: '橋樑焚斷，退路已絕！', kind: 'event' });
      }
    }
    if (b.weather === 'rain' && expiring.length > 0) fireLog.push({ turn: b.turn, text: '大雨傾盆，野火漸熄。', kind: 'event' });
    nextGroundFires = [
      ...nextGroundFires.map((f) => ({ ...f, turnsLeft: f.turnsLeft - tickAmount })).filter((f) => f.turnsLeft > 0),
      ...sparked,
    ];
  }

  // ── Morale chain: any unit whose troops just dropped to 0 (routing this
  // turn) drags adjacent ALLY morale down by 15 — panic spreads.
  const justRouted = tickedUnits.filter(
    (u) => u.troops <= 0 && b.units.find((x) => x.id === u.id)!.troops > 0,
  );
  if (justRouted.length > 0) {
    tickedUnits = tickedUnits.map((u) => {
      if (u.troops <= 0) return u;
      let drop = 0;
      for (const r of justRouted) {
        if (r.side !== u.side) continue;
        const adj = hexNeighbours(r.coord).some((n) => n.col === u.coord.col && n.row === u.coord.row);
        if (adj) drop += 15;
      }
      if (drop === 0) return u;
      return { ...u, morale: Math.max(0, u.morale - drop) };
    });
  }

  // Spawn reinforcements scheduled for this turn.
  const arrivedUnits: TacticalUnit[] = [];
  const arrivalLog: NonNullable<TacticalBattle['log']> = [];
  const remaining = (b.reinforcements ?? []).filter((r) => {
    if (r.arriveTurn !== b.turn + 1) return true;
    // Spawn one unit at the chosen edge.
    const spawnCol =
      r.edge === 'west' ? 0
      : r.edge === 'east' ? b.width - 1
      : Math.floor(b.width / 2);
    const spawnRow =
      r.edge === 'north' ? 0
      : r.edge === 'south' ? b.height - 1
      : Math.floor(b.height / 2);
    arrivedUnits.push({
      id: `${r.side}-reinforce-${r.officerId}-t${b.turn + 1}`,
      officerId: r.officerId,
      side: r.side,
      coord: { col: spawnCol, row: spawnRow },
      troops: r.troops,
      maxTroops: r.troops,
      ap: r.unitType === 'cavalry' ? 4 : r.unitType === 'siege' ? 2 : 3,
      maxAp: r.unitType === 'cavalry' ? 4 : r.unitType === 'siege' ? 2 : 3,
      morale: 100,
      isCommander: false,
      effects: [],
      unitType: r.unitType,
    });
    if (r.announcement) {
      arrivalLog.push({
        turn: b.turn + 1,
        text: r.announcement,
        kind: 'arrival',
      });
    }
    return false;
  });

  // 收攏潰兵 — a unit broken (morale 0) but still manned, standing beside a
  // steady commander, is rallied back into the line instead of fleeing.
  tickedUnits = tickedUnits.map((u) => {
    if (u.troops <= 0 || u.morale > 0) return u;
    const rallied = tickedUnits.some((c) =>
      c.side === u.side && c.isCommander && c.troops > 0 && c.morale > 30
      && hexNeighbours(c.coord).some((n) => n.col === u.coord.col && n.row === u.coord.row));
    return rallied ? { ...u, morale: 25 } : u;
  });

  // 戰場異象 — an occasional dramatic event shakes the field after it's joined.
  const eventLog: NonNullable<TacticalBattle['log']> = [];
  if (b.turn >= 3 && Math.random() < 0.09) {
    const roll = Math.random();
    const sideZh = (s: 'attacker' | 'defender') => (s === 'attacker' ? '攻方' : '守方');
    if (roll < 0.34) {
      const live = tickedUnits.filter((u) => u.troops > 0);
      if (live.length) {
        const v = live[Math.floor(Math.random() * live.length)];
        const dmg = Math.floor(v.maxTroops * 0.08);
        tickedUnits = tickedUnits.map((u) => u.id === v.id
          ? { ...u, troops: Math.max(0, u.troops - dmg), morale: Math.max(0, u.morale - 12) } : u);
        eventLog.push({ turn: b.turn + 1, text: '☄ 流星墜營,軍心惶惶!', kind: 'event' });
      }
    } else if (roll < 0.67) {
      const side: 'attacker' | 'defender' = Math.random() < 0.5 ? 'attacker' : 'defender';
      tickedUnits = tickedUnits.map((u) => u.side === side && u.troops > 0
        ? { ...u, troops: Math.max(0, u.troops - Math.floor(u.maxTroops * 0.04)), morale: Math.max(0, u.morale - 6) } : u);
      eventLog.push({ turn: b.turn + 1, text: `🦠 軍中疫疾橫行,${sideZh(side)}減員失士!`, kind: 'event' });
    } else {
      const side: 'attacker' | 'defender' = Math.random() < 0.5 ? 'attacker' : 'defender';
      tickedUnits = tickedUnits.map((u) => u.side === side && u.troops > 0
        ? { ...u, morale: Math.min(100, u.morale + 15) } : u);
      eventLog.push({ turn: b.turn + 1, text: `🎺 ${sideZh(side)}得天時鼓舞,士氣大振!`, kind: 'event' });
    }
  }

  // Remove only annihilated units (troops 0). A broken unit (morale 0) is no
  // longer wiped on the spot — it 潰走 (lingers and flees, run down by pursuers),
  // so only an emptied unit leaves the field here.
  const allUnits = [...tickedUnits, ...arrivedUnits];
  const surviving = allUnits.filter((u) => u.troops > 0);
  const removed = allUnits.filter((u) => u.troops <= 0);
  const newAttackerLoss = removed
    .filter((u) => u.side === 'attacker')
    .reduce((s, u) => s + u.maxTroops, 0);
  const newDefenderLoss = removed
    .filter((u) => u.side === 'defender')
    .reduce((s, u) => s + u.maxTroops, 0);

  // Objective progress.
  let attackerObj = b.attackerObjective;
  let defenderObj = b.defenderObjective;
  attackerObj = tickObjective(attackerObj, surviving, 'attacker', b.width);
  defenderObj = tickObjective(defenderObj, surviving, 'defender', b.width);

  // Winner check.
  const attackerLeft = surviving.some((u) => u.side === 'attacker');
  const defenderLeft = surviving.some((u) => u.side === 'defender');
  const attackerCommanderDown = !surviving.some(
    (u) => u.side === 'attacker' && u.isCommander,
  );
  const defenderCommanderDown = !surviving.some(
    (u) => u.side === 'defender' && u.isCommander,
  );
  // 三軍盡潰 — a side still on the field but whose every standing unit is routing
  // has lost the day: the army has broken (兵敗如山倒).
  const attackerBroken = attackerLeft && surviving.filter((u) => u.side === 'attacker').every(isRouting);
  const defenderBroken = defenderLeft && surviving.filter((u) => u.side === 'defender').every(isRouting);

  let winner: 'attacker' | 'defender' | undefined;
  if (attackerObj?.resolved === 'success') winner = 'attacker';
  else if (defenderObj?.resolved === 'success') winner = 'defender';
  else if (!attackerLeft || attackerCommanderDown || attackerBroken) winner = 'defender';
  else if (!defenderLeft || defenderCommanderDown || defenderBroken) winner = 'attacker';
  else if (b.turn + 1 > 30) {
    // 糧盡兵疲 — beyond turn 30, force resolution by remaining troop strength.
    // Tie favors defender (they held).
    const aTroops = surviving
      .filter((u) => u.side === 'attacker')
      .reduce((s, u) => s + u.troops, 0);
    const dTroops = surviving
      .filter((u) => u.side === 'defender')
      .reduce((s, u) => s + u.troops, 0);
    winner = aTroops > dTroops * 1.1 ? 'attacker' : 'defender';
  }

  // ── City defense structures auto-act at end of attacker's turn ──
  // Watchtowers + arrow-platforms fire at closest attacker.
  // Caltrops damage adjacent attacker units.
  // Rockfalls trigger when an attacker is on the trap hex.
  const turnEndingForAttacker = b.activeSide === 'attacker';
  const structurePopups: DamagePopup[] = [];
  const structureLog: NonNullable<TacticalBattle['log']> = [];
  let updatedStructures = b.cityStructures;
  let unitsAfterStructures = surviving;
  let additionalAttackerLoss = 0;
  if (turnEndingForAttacker && b.cityStructures && b.cityStructures.length > 0) {
    const next = b.cityStructures.map((s) => ({ ...s }));
    const STRUCT_NAMES: Record<string, string> = {
      watchtower: '箭樓', 'arrow-platform': '箭台', rockfall: '落石',
      caltrops: '拒馬', 'iron-chains': '鐵索', beacon: '烽火台',
    };
    for (const s of next) {
      if (s.hp <= 0 || s.triggered) continue;
      // ── Attackers hugging the emplacement batter it down — siege units
      // wreck it fast, other troops chip away. At 0 HP it's destroyed and falls
      // silent, giving the attacker counterplay against a fortified rampart. ──
      const sappers = unitsAfterStructures.filter(
        (u) => u.side === 'attacker' && u.troops > 0 && hexDistance(s.coord, u.coord) === 1,
      );
      if (sappers.length > 0) {
        const batter = sappers.reduce((sum, u) => sum + (u.unitType === 'siege' ? 200 : 60), 0);
        s.hp = Math.max(0, s.hp - batter);
        if (s.hp <= 0) {
          structurePopups.push({
            id: `struct-down-${s.slotIndex}-t${b.turn}`,
            coord: s.coord, text: '✸', color: '#b8442e', spawnedAt: Date.now(),
          });
          structureLog.push({
            turn: b.turn, text: `${STRUCT_NAMES[s.buildingId] ?? '城防工事'}被攻破！`, kind: 'event',
          });
          continue; // wrecked — it can't fire this turn
        }
      }
      // 陣 (外營) — a supply camp rallies adjacent defenders instead of firing:
      // +4 morale per turn to defender units within 2 hexes (cap 100).
      if (s.buildingId === 'barracks-out') {
        let rallied = false;
        unitsAfterStructures = unitsAfterStructures.map((u) => {
          if (u.side !== 'defender' || u.troops <= 0 || u.morale >= 100) return u;
          if (hexDistance(s.coord, u.coord) > 2) return u;
          rallied = true;
          return { ...u, morale: Math.min(100, u.morale + 4) };
        });
        if (rallied) {
          structureLog.push({ turn: b.turn, text: '陣中旗鼓相聞 — 守軍士氣穩固。', kind: 'event' });
        }
        continue;
      }
      const attackerUnits = unitsAfterStructures.filter((u) => u.side === 'attacker' && u.troops > 0);
      if (attackerUnits.length === 0) continue;
      // Range and damage per kind.
      let range: number;
      let dmg: number;
      let oneShot = false;
      switch (s.buildingId) {
        case 'watchtower':       range = 4; dmg = 80 * s.level; break;
        case 'arrow-platform':   range = 5; dmg = 100 * s.level; break;
        case 'rockfall':         range = 1; dmg = 200 * s.level; oneShot = true; break;
        case 'caltrops':         range = 1; dmg = 40 * s.level; break;
        case 'beacon':           range = 0; dmg = 0; break;  // intel-only, no auto-fire
        case 'iron-chains':      range = 1; dmg = 60 * s.level; break;
        default:                 range = 0; dmg = 0;
      }
      if (range === 0 || dmg === 0) continue;
      // Find closest attacker in range.
      let target: typeof attackerUnits[0] | null = null;
      let targetDist = Infinity;
      for (const u of attackerUnits) {
        const d = hexDistance(s.coord, u.coord);
        if (d <= range && d < targetDist) {
          targetDist = d;
          target = u;
        }
      }
      if (!target) continue;
      // 投石臺 vs 箭樓 — a catapult lobs a stone that SCATTERS through the press:
      // it splashes half-damage onto attackers adjacent to the impact, where the
      // tower's single precise arrow strikes one mark. 亂石穿空,一發而眾傷.
      const isCatapult = s.buildingId === 'arrow-platform';
      const splashDmg = Math.round(dmg * 0.5);
      const splashIds = new Set(
        isCatapult
          ? unitsAfterStructures
              .filter((u) => u.side === 'attacker' && u.troops > 0 && u.id !== target!.id
                && hexDistance(u.coord, target!.coord) === 1)
              .map((u) => u.id)
          : [],
      );
      unitsAfterStructures = unitsAfterStructures.map((u) => {
        if (u.id === target!.id) {
          additionalAttackerLoss += Math.min(u.troops, dmg);
          return { ...u, troops: Math.max(0, u.troops - dmg) };
        }
        if (splashIds.has(u.id)) {
          additionalAttackerLoss += Math.min(u.troops, splashDmg);
          return { ...u, troops: Math.max(0, u.troops - splashDmg) };
        }
        return u;
      });
      // UI popup at the target's hex (+ splash markers around it).
      const popupId = `struct-${s.slotIndex}-t${b.turn}`;
      structurePopups.push({
        id: popupId,
        coord: target.coord,
        text: `−${dmg}`,
        color: '#d4a84a',
        spawnedAt: Date.now(),
      });
      if (splashIds.size > 0) {
        for (const u of unitsAfterStructures) {
          if (!splashIds.has(u.id)) continue;
          structurePopups.push({
            id: `struct-${s.slotIndex}-splash-${u.id}-t${b.turn}`,
            coord: u.coord, text: `−${splashDmg}`, color: '#c46a3a', spawnedAt: Date.now(),
          });
        }
      }
      const ZH: Record<string, string> = {
        'watchtower': '箭樓', 'arrow-platform': '箭台', 'rockfall': '落石',
        'caltrops': '拒馬', 'iron-chains': '鐵索',
      };
      structureLog.push({
        turn: b.turn,
        text: isCatapult && splashIds.size > 0
          ? `${ZH[s.buildingId] ?? s.buildingId} 投石！亂石穿空,${dmg + splashDmg * splashIds.size} 兵傷亡。`
          : `${ZH[s.buildingId] ?? s.buildingId} 射出！${dmg} 兵傷亡。`,
        kind: 'event',
      });
      if (oneShot) s.triggered = true;
    }
    updatedStructures = next;
  }

  // ── 滾木礌石 / 金汁 — a manned rampart pours death on attackers at its base.
  // Triggers at the end of the attacker's turn for each intact wall/gate hex
  // that still has a living defender within 2 hexes (an abandoned wall is
  // silent). A battered wall pours less. Brutal on units hugging the wall to
  // assault it — bring siege engines to breach fast, or flank the open ends.
  if (turnEndingForAttacker && b.wallHp) {
    const oilByUnit: Record<string, number> = {};
    for (const [key, hp] of Object.entries(b.wallHp)) {
      if (hp <= 0) continue;
      const [wc, wr] = key.split(',').map(Number);
      const wallCoord = { col: wc, row: wr };
      const tile = b.tiles.find((t) => t.coord.col === wc && t.coord.row === wr);
      if (!tile || (tile.terrain !== 'wall' && tile.terrain !== 'gate')) continue;
      const manned = unitsAfterStructures.some(
        (u) => u.side === 'defender' && u.troops > 0 && hexDistance(u.coord, wallCoord) <= 2,
      );
      if (!manned) continue;
      const initialHp = tile.terrain === 'gate' ? 700 : 1000;
      const frac = Math.max(0.3, Math.min(1, hp / initialHp));
      const dmg = Math.round((tile.terrain === 'gate' ? 180 : 300) * frac);
      for (const u of unitsAfterStructures) {
        if (u.side === 'attacker' && u.troops > 0 && hexDistance(u.coord, wallCoord) === 1) {
          oilByUnit[u.id] = (oilByUnit[u.id] ?? 0) + dmg;
        }
      }
    }
    if (Object.keys(oilByUnit).length > 0) {
      unitsAfterStructures = unitsAfterStructures.map((u) => {
        const oil = oilByUnit[u.id];
        if (!oil) return u;
        const loss = Math.min(u.troops, Math.min(oil, 700)); // cap per turn
        additionalAttackerLoss += loss;
        structurePopups.push({
          id: `oil-${u.id}-t${b.turn}`,
          coord: u.coord,
          text: `−${loss}`,
          color: '#e0a040',
          spawnedAt: Date.now(),
        });
        return { ...u, troops: Math.max(0, u.troops - loss), morale: Math.max(0, u.morale - 5) };
      });
      structureLog.push({ turn: b.turn, text: '城上滾木礌石、金汁傾下！', kind: 'event' });
    }
  }

  // Record this turn's fallen officers (annihilated outright or finished off by
  // structures/boiling oil). Units are removed from the field here, so without
  // this running tally resolveBattleEnd couldn't tell who fell. `allUnits` holds
  // everyone present this turn; whoever isn't in the final survivor set fell.
  // A routing unit (morale 0, still manned) is NOT fallen — it lingers and flees.
  const finalUnits = unitsAfterStructures.filter((u) => u.troops > 0);
  const survivingIds = new Set(finalUnits.map((u) => u.id));
  const fallen = allUnits.filter((u) => !survivingIds.has(u.id));
  const prevCas = b.casualties ?? { attacker: [], defender: [] };
  const casualties = {
    attacker: [...prevCas.attacker, ...fallen.filter((u) => u.side === 'attacker').map((u) => u.officerId)],
    defender: [...prevCas.defender, ...fallen.filter((u) => u.side === 'defender').map((u) => u.officerId)],
  };

  // Losses = (every troop ever fielded) − (troops still standing). Carrying the
  // cumulative startTroops (deployment + arrived reinforcements) and subtracting
  // current strength counts damage to survivors and never books a routed-but-
  // not-destroyed unit's fled troops as casualties. Falls back to the old
  // incremental tally for any battle built without startTroops.
  const startTroops = b.startTroops
    ? {
        attacker: b.startTroops.attacker + arrivedUnits.filter((u) => u.side === 'attacker').reduce((s, u) => s + u.maxTroops, 0),
        defender: b.startTroops.defender + arrivedUnits.filter((u) => u.side === 'defender').reduce((s, u) => s + u.maxTroops, 0),
      }
    : undefined;
  const curAtk = finalUnits.filter((u) => u.side === 'attacker').reduce((s, u) => s + u.troops, 0);
  const curDef = finalUnits.filter((u) => u.side === 'defender').reduce((s, u) => s + u.troops, 0);
  const attackerLosses = startTroops
    ? Math.max(0, startTroops.attacker - curAtk)
    : b.attackerLosses + newAttackerLoss + additionalAttackerLoss;
  const defenderLosses = startTroops
    ? Math.max(0, startTroops.defender - curDef)
    : b.defenderLosses + newDefenderLoss;

  // 天有不測風雲 — the weather can turn mid-battle (affects next turn:
  // rain douses fires and bows, wind feeds the flames).
  let nextWeather = b.weather;
  const wroll = Math.random();
  if (b.weather === 'clear' && wroll < 0.05) nextWeather = 'rain';
  else if (b.weather === 'clear' && wroll < 0.09) nextWeather = 'wind';
  else if (b.weather === 'rain' && wroll < 0.18) nextWeather = 'clear';
  else if (b.weather === 'wind' && wroll < 0.12) nextWeather = 'clear';
  else if (b.weather === 'fog' && wroll < 0.15) nextWeather = 'clear';
  // 雨滅火 — the moment the heavens open, ground fires gutter out fast.
  if (nextWeather === 'rain' && b.weather !== 'rain' && nextGroundFires.length > 0) {
    nextGroundFires = nextGroundFires.map((f) => ({ ...f, turnsLeft: Math.ceil(f.turnsLeft / 2) }));
  }
  // 風雲變色 — the wind is a player too. At sea it veers freely each round
  // (a fire set downwind can find itself upwind a turn later); on land a
  // standing gale still gusts and swings, so a 火攻 can blow back on the one
  // who set it — the very nightmare 借東風 is meant to engineer for the foe.
  let nextWind = b.windDirection ?? 'calm';
  const hasWind = nextWind !== 'calm';
  const veerChance = b.naval ? 0.15 : (b.weather === 'wind' && hasWind ? 0.07 : 0);
  if (veerChance > 0 && Math.random() < veerChance) {
    const dirs: WindDirection[] = ['north', 'south', 'east', 'west'];
    const turned = dirs.filter((d) => d !== nextWind);
    nextWind = turned[Math.floor(Math.random() * turned.length)];
  }
  const windTurnZh = nextWind === 'east' ? '東' : nextWind === 'west' ? '西' : nextWind === 'south' ? '南' : '北';
  const windLog: NonNullable<TacticalBattle['log']> = nextWind !== (b.windDirection ?? 'calm')
    ? [{ turn: b.turn, text: b.naval ? `風向轉${windTurnZh},艨艟調帆!` : `風向陡轉${windTurnZh}風 — 火勢改道,當心反噬!`, kind: 'event' }]
    : [];
  const weatherLog: NonNullable<TacticalBattle['log']> = nextWeather !== b.weather
    ? [{ turn: b.turn, text: nextWeather === 'rain' ? '驟雨傾盆，火攻難繼！' : nextWeather === 'wind' ? '狂風驟起，火借風勢！' : '雲開天霽。', kind: 'event' }]
    : [];

  // 時辰推移 — every PHASE_TURNS the light steps onward toward night; a long
  // battle drags into darkness (and the night mechanics it brings).
  const newTurn = b.turn + 1;
  let nextTimeOfDay = b.timeOfDay;
  const timeLog: NonNullable<TacticalBattle['log']> = [];
  const tIdx = TIME_SEQUENCE.indexOf(b.timeOfDay);
  if (newTurn % PHASE_TURNS === 0 && tIdx >= 0 && tIdx < TIME_SEQUENCE.length - 1) {
    nextTimeOfDay = TIME_SEQUENCE[tIdx + 1];
    const TIME_ZH: Record<TimeOfDay, string> = { dawn: '拂曉', day: '白晝', dusk: '黃昏', night: '入夜' };
    timeLog.push({
      turn: newTurn,
      text: nextTimeOfDay === 'night' ? '🌙 天色入夜 — 弓矢難及、伏路愈深。' : nextTimeOfDay === 'dusk' ? '日暮西山，天色向晚。' : `天色轉${TIME_ZH[nextTimeOfDay]}。`,
      kind: 'event',
    });
  }

  const next: TacticalBattle = {
    ...b,
    units: finalUnits,
    tiles: nextTiles,
    weather: nextWeather,
    timeOfDay: nextTimeOfDay,
    windDirection: nextWind,
    groundFires: nextGroundFires.length > 0 ? nextGroundFires : undefined,
    turn: newTurn,
    activeSide: b.activeSide === 'attacker' ? 'defender' : 'attacker',
    // 氣勢回落 — the tide eases back toward even each turn unless fed afresh.
    momentum: Math.trunc((b.momentum ?? 0) * 0.85),
    attackerLosses,
    defenderLosses,
    startTroops,
    grainBurned,
    winner: winner ?? b.winner,
    attackerObjective: attackerObj,
    defenderObjective: defenderObj,
    reinforcements: remaining,
    casualties,
    log: [...(b.log ?? []), ...grainLog, ...fireLog, ...weatherLog, ...windLog, ...timeLog, ...arrivalLog, ...structureLog, ...eventLog],
    damagePopups: structurePopups, // visible briefly on turn flip
    cityStructures: updatedStructures,
  };
  // 潰走 then 續行軍令 — newly-active routers bolt for their edge first, then the
  // units still under command resume any queued march with their fresh AP.
  return next.winner ? next : resumeQueuedPaths(processRout(next));
}

function tickObjective(
  obj: BattleObjective | undefined,
  units: TacticalUnit[],
  side: 'attacker' | 'defender',
  width: number,
): BattleObjective | undefined {
  if (!obj || obj.resolved) return obj;
  if ((obj.kind === 'hold-tile' || obj.kind === 'capture-supply') && obj.tileCoord) {
    const holding = units.some(
      (u) =>
        u.side === side &&
        u.coord.col === obj.tileCoord!.col &&
        u.coord.row === obj.tileCoord!.row,
    );
    const progress = (obj.progress ?? 0) + (holding ? 1 : 0);
    // hold-tile defaults to 5 turns; seizing a supply dump is quicker (2).
    const need = obj.turnsRequired ?? (obj.kind === 'capture-supply' ? 2 : 5);
    if (progress >= need) {
      return { ...obj, progress, resolved: 'success' };
    }
    return { ...obj, progress };
  }
  if (obj.kind === 'survive-turns') {
    const progress = (obj.progress ?? 0) + 1;
    if (progress >= (obj.turnsRequired ?? 8)) {
      return { ...obj, progress, resolved: 'success' };
    }
    return { ...obj, progress };
  }
  if (obj.kind === 'escape') {
    // Spirit the commander off the field via their own edge: attackers exit the
    // way they came (col 0), defenders out the far edge (col width-1).
    const cmd = units.find((u) => u.side === side && u.isCommander);
    if (!cmd) return { ...obj, resolved: 'failure' };
    const homeCol = side === 'attacker' ? 0 : width - 1;
    if (cmd.coord.col === homeCol) return { ...obj, resolved: 'success' };
  }
  return obj;
}

// ─── AI ───────────────────────────────────────────────────────────────

/**
 * Compute the post-battle resolution: surviving officer IDs by side,
 * captured officers (defeated commanders kept alive), loot.
 */
export interface BattleResolution {
  winner: 'attacker' | 'defender' | null;
  attackerSurvivors: EntityId[];
  defenderSurvivors: EntityId[];
  attackerDead: EntityId[];
  defenderDead: EntityId[];
  capturedOfficerIds: EntityId[];
  attackerLosses: number;
  defenderLosses: number;
  lootGold: number;
}

export function resolveBattleEnd(
  battle: TacticalBattle,
  officers: Record<EntityId, Officer>,
): BattleResolution {
  const surviving = battle.units;
  const winner = battle.winner ?? null;
  const survivorsBySide = (side: 'attacker' | 'defender') =>
    surviving.filter((u) => u.side === side).map((u) => u.officerId);
  const attackerSurvivors = survivorsBySide('attacker');
  const defenderSurvivors = survivorsBySide('defender');

  const captured: EntityId[] = [];
  const dead: EntityId[] = [];

  // Loser-side: each fallen officer is captured (charisma roll) or killed. Fallen
  // units are removed from the field mid-battle (endTurn), so we read its running
  // casualty tally — a diff of the survivors-only `units` array against itself
  // would always be empty. Guard against any id that still has a standing unit.
  const survivorSet = new Set(surviving.map((u) => u.officerId));
  const lostOfficers = (side: 'attacker' | 'defender'): EntityId[] =>
    [...new Set(battle.casualties?.[side] ?? [])].filter((id) => !survivorSet.has(id));

  // 追擊掩殺 — a victor who ends the day still strong runs the broken foe down:
  // more fleeing officers are caught, and the spoils swell. A bloody narrow win
  // (winner also gutted) yields a thin pursuit.
  const winnerStrength = winner
    ? surviving.filter((u) => u.side === winner).reduce((s, u) => s + u.troops, 0)
    : 0;
  const loserLoss = winner === 'attacker' ? battle.defenderLosses
    : winner === 'defender' ? battle.attackerLosses : 0;
  // An orderly withdrawal denies the victor a pursuit.
  const hotPursuit = !!winner && !battle.withdrew && winnerStrength > loserLoss * 0.5;
  const pursuitCapMul = hotPursuit ? 1.35 : 1;
  const pursuitLootMul = hotPursuit ? 1.5 : 1;

  // 單挑生擒/斬殺 — a duel victor's explicit choice overrides the capture roll.
  const forcedCap = new Set(battle.forcedCaptures ?? []);
  const forcedKill = new Set(battle.forcedKills ?? []);
  if (winner === 'attacker') {
    for (const id of lostOfficers('defender')) {
      const o = officers[id];
      if (!o) continue;
      if (forcedCap.has(id)) { captured.push(id); continue; }
      if (forcedKill.has(id)) { dead.push(id); continue; }
      // Capture chance based on attacker's charisma (commander) + pursuit.
      const acc = surviving.find((u) => u.side === 'attacker' && u.isCommander);
      const cmdCha = acc ? (officers[acc.officerId]?.stats.charisma ?? 60) : 60;
      if (Math.random() < (cmdCha / 130) * pursuitCapMul) captured.push(id);
      else dead.push(id);
    }
  } else if (winner === 'defender') {
    for (const id of lostOfficers('attacker')) {
      if (forcedCap.has(id)) { captured.push(id); continue; }
      if (forcedKill.has(id)) { dead.push(id); continue; }
      const dc = surviving.find((u) => u.side === 'defender' && u.isCommander);
      const cmdCha = dc ? (officers[dc.officerId]?.stats.charisma ?? 60) : 60;
      if (Math.random() < (cmdCha / 130) * pursuitCapMul) captured.push(id);
      else dead.push(id);
    }
  }

  // Loot: 10–25% of loser's troop value as gold-equivalent, swollen by pursuit.
  const lootGold = winner
    ? Math.floor(
        ((winner === 'attacker' ? battle.defenderLosses : battle.attackerLosses) *
          (0.1 + Math.random() * 0.15) * pursuitLootMul) /
          10,
      )
    : 0;

  return {
    winner,
    attackerSurvivors,
    defenderSurvivors,
    attackerDead: winner === 'attacker' ? [] : dead,
    defenderDead: winner === 'defender' ? [] : dead,
    capturedOfficerIds: captured,
    attackerLosses: battle.attackerLosses,
    defenderLosses: battle.defenderLosses,
    lootGold,
  };
}

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

/** How much a tile suits this unit type — rewards attack-boosting terrain and
 *  cover (low incoming-damage terrain). Higher is better for positioning. */
function terrainAffinity(type: UnitType, terrain: TerrainKind): number {
  return terrainDamageMod(type, terrain) + (1 - defenderTerrainShield(terrain));
}

/** Standing value of a tile for a unit: damage it deals there ÷ damage it
 *  takes there. ≥1.2 = advantageous ground worth holding (hill/chokepoint,
 *  river for navy); <1 = poor footing. */
export function tileValueFor(unit: TacticalUnit, terrain: TerrainKind): number {
  return terrainDamageMod(unit.unitType, terrain) / defenderTerrainShield(terrain);
}

/**
 * Dijkstra cost field flowing outward from `goal` over passable terrain.
 * Other units block their hex (you can't march through a stack) — except the
 * goal hex itself, so we can path *up to* an enemy and stop adjacent. Gates
 * (cost ≥ 99) are impassable. Returns cost keyed by "col,row".
 */
function costFieldTo(b: TacticalBattle, goal: HexCoord, mover: TacticalUnit): Map<string, number> {
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  const goalKey = key(goal);
  const blocked = new Set(
    b.units
      .filter((u) => u.troops > 0 && u.id !== mover.id && key(u.coord) !== goalKey)
      .map((u) => key(u.coord)),
  );
  const dist = new Map<string, number>([[goalKey, 0]]);
  const frontier: Array<{ c: HexCoord; d: number }> = [{ c: goal, d: 0 }];
  while (frontier.length > 0) {
    // Grid is small — a linear scan for the cheapest node is plenty fast.
    let bi = 0;
    for (let i = 1; i < frontier.length; i++) if (frontier[i].d < frontier[bi].d) bi = i;
    const { c, d } = frontier.splice(bi, 1)[0];
    if (d > (dist.get(key(c)) ?? Infinity)) continue;
    for (const n of hexNeighbours(c)) {
      const t = tileAt(b, n);
      if (!t) continue;
      const nk = key(n);
      if (blocked.has(nk)) continue;
      let step = TERRAIN_MOVE_COST[t.terrain];
      // Defenders path through their own gates (sally / repair sorties).
      if (step >= 99 && mover.side === 'defender' && t.terrain === 'gate') step = 2;
      if (step >= 99) continue; // wall / impassable
      const nd = d + step;
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        frontier.push({ c: n, d: nd });
      }
    }
  }
  return dist;
}

/**
 * Best single step toward a goal: follows the cost field so the unit routes
 * *around* mountains, rivers and friendly stacks instead of stalling against
 * them, breaking ties toward terrain that suits the unit.
 */
export function bestStepToward(
  b: TacticalBattle,
  unit: TacticalUnit,
  goal: HexCoord,
  bonus?: (c: HexCoord) => number,
): HexCoord | null {
  const field = costFieldTo(b, goal, unit);
  const key = (c: HexCoord) => `${c.col},${c.row}`;
  let best: HexCoord | null = null;
  let bestScore = Infinity;
  for (const n of hexNeighbours(unit.coord)) {
    if (!canMove(b, unit, n)) continue;
    const d = field.get(key(n));
    if (d === undefined) continue;
    const tile = tileAt(b, n);
    const aff = tile ? terrainAffinity(unit.unitType, tile.terrain) : 0;
    // Lower score wins; terrain affinity and the optional bonus (cohesion /
    // escort) shave it so the unit drifts toward good ground and its allies.
    const score = d - aff * 0.1 - (bonus ? bonus(n) : 0);
    if (score < bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best;
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
