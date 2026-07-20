import type { Officer } from '../types';
import { liveItemById, awakeningPerkCountFor } from '../data/items';
import { SKILLS_BY_ID } from '../data/skills';
import { effectivePrestigeEffects } from '../data/prestige';
import { afflictionDelta, chronicBarsArm } from './afflictions';
import { officerLevel } from './officerGrade';
import { gradeCombatBonus, itemMasteryMul, duelFirstStrike } from './gradeCombat';
import { evolvedArtDuelBonus, evolvedWeaponArt } from './evolvedArts';
import { skillEffectMul } from './skillMastery';
import { deriveWeaponType, type WeaponType } from '../data/weaponTypes';
import { martialBonus, martialXiuwei, schoolCounterEdge, schoolSecretArt } from './martialArts';

/**
 * 兵裝相剋(接單挑) — the duellists' weapon classes clash (§5.9), where before a
 * 1v1 read only raw 武力 + items. A halberd hooks a horseman, a mace/crossbow
 * shatters armour, a light blade bites it poorly — a modest prowess swing (±~6),
 * doubled by a weapon-master (god-of-war 等). Duel-tuned (no terrain/flank).
 */
function duelWeaponEdge(self: Officer, foe: Officer): number {
  const aw: WeaponType = deriveWeaponType(self);
  const dw: WeaponType = deriveWeaponType(foe);
  const dMounted = dw === 'cavalry';
  const dHeavy = dw === 'spear' || dw === 'halberd' || dw === 'sabre' || dw === 'cavalry' || dw === 'siege';
  let m = 1;
  if (aw === 'halberd' && dMounted) m *= 1.15;          // 戟制騎
  else if (aw === 'spear' && dMounted) m *= 1.07;        // 槍拒馬
  if ((aw === 'crossbow' || aw === 'siege') && dHeavy) m *= 1.10; // 破甲
  if (aw === 'sword' && (dw === 'halberd' || dw === 'cavalry' || dw === 'siege')) m *= 0.92; // 劍難破重
  if (aw === 'sabre' && (dw === 'sword' || dw === 'none')) m *= 1.06; // 刀破輕
  if (dw === 'fan') m *= 1.10; else if (dw === 'none') m *= 1.06;     // 襲書生/欺徒手
  if (m > 1) {
    const skill = aw === 'bow' || aw === 'crossbow' ? 'archer-master'
      : aw === 'cavalry' ? 'cavalry-master' : aw === 'siege' ? 'siegemaster'
      : (aw === 'spear' || aw === 'halberd' || aw === 'sabre' || aw === 'sword') ? 'god-of-war' : null;
    if (skill && self.skills?.includes(skill as never)) m = 1 + (m - 1) * 2; // 兵裝精通
  }
  return (Math.max(0.85, Math.min(1.3, m)) - 1) * 45; // ≈ ±6 on the prowess score
}

/**
 * One-on-one duel resolution between two officers — a multi-round 氣力 bout.
 *
 * Each officer's static prowess (war + weapon bonus + skill duelChanceBonus×30
 * + trait bonus) is fixed for the bout; every round both add a fresh die and
 * the loser of the exchange takes 氣力 (stamina) damage scaled by the margin.
 * Drop an opponent to 0 stamina and you cut them down. A bout that goes the
 * full distance is decided on remaining stamina — a clear lead still kills, a
 * close finish is a draw (both wounded, neither slain).
 */

export interface DuelInput {
  attacker: Officer;
  defender: Officer;
  rng?: () => number;
  /** 鬥將生涯 — optional fixed-prowess bonus earned on the 武評榜 (see warRanking). */
  aCareer?: number;
  dCareer?: number;
}

export interface DuelRoll {
  officerId: string;
  base: number;        // war stat
  itemBonus: number;
  skillBonus: number;  // from skill duelChanceBonus
  traitBonus: number;
  diceRoll: number;
  total: number;
}

/** One exchange of blows within a bout. */
export interface DuelExchange {
  round: number;
  attackerScore: number;
  defenderScore: number;
  roundWinner: 'attacker' | 'defender' | 'draw';
  /** Stamina remaining AFTER this exchange. */
  attackerStamina: number;
  defenderStamina: number;
  text: { zh: string; en: string };
}

export interface DuelResult {
  attackerRoll: DuelRoll;
  defenderRoll: DuelRoll;
  /** Final stamina gap (or the winner's remaining stamina on a knockout). */
  margin: number;
  /** Who won the duel, or 'draw' (both wounded). */
  winner: 'attacker' | 'defender' | 'draw';
  /** Set to the loser's officer id when the bout was decisive (a kill). */
  killedId?: string;
  /** 膽氣 — set when a would-be-fatal defeat instead ended in 請降/落荒而逃 (no kill).
   *  The loser is `winner`'s opposite; the caller may capture (yield) or let them go. */
  fate?: DuelFate;
  /** Round-by-round exchanges of the bout. */
  rounds: DuelExchange[];
  /** Final 氣力 of each side (0 = cut down). */
  attackerStamina: number;
  defenderStamina: number;
  /** True if the bout ended in a knockout (stamina hit 0) rather than on points. */
  knockout: boolean;
}

const MAX_ROUNDS = 8;

const ROUND_LINES_WIN: Array<{ zh: string; en: string }> = [
  { zh: '一招搶得先機!', en: 'A telling blow lands first!' },
  { zh: '槍來戟往,佔得上風!', en: 'Spear meets halberd — and gains the upper hand!' },
  { zh: '這一合,壓住了對手!', en: 'This exchange goes decisively his way!' },
];
const ROUND_LINES_DRAW: Array<{ zh: string; en: string }> = [
  { zh: '棋逢對手,難分軒輊!', en: 'Evenly matched — neither gives ground!' },
  { zh: '刀光交錯,各退半步!', en: 'Blades cross in a shower of sparks; both step back!' },
];

export function canDuel(o: Officer): { ok: boolean; reason?: string } {
  if (o.status === 'dead' || o.status === 'imprisoned')
    return { ok: false, reason: 'unavailable' };
  if (o.stats.war < 50) return { ok: false, reason: 'war stat too low' };
  if (o.traits?.includes('frail')) return { ok: false, reason: 'too frail' };
  return { ok: true };
}

// ─── 膽氣 / 怯戰 — a beaten fighter need not always die ───────────────────────
// A cornered warrior's nerve decides how the killing blow falls: a 忠勇之士 fights
// to the death (斬), while a craven throws down their arms (請降 — capturable) or
// bolts from the field (落荒而逃 — escapes, no kill). 膽氣 is read from temperament,
// 武力 and standing — the brave die on their feet; the timid live to run.

/** How a bested fighter meets defeat. */
export type DuelFate = 'slain' | 'yield' | 'flee';

const VALOR_TRAIT: Partial<Record<string, number>> = {
  matchless: 24, 'martial-valor': 16, ironhearted: 16, 'stoic-brave': 16,
  berserker: 15, duelist: 14, bloodthirsty: 12, vengeful: 11, gallant: 10,
  reckless: 10, loyal: 9, wrathful: 8, 'iron-discipline': 8, veteran: 7,
  'tiger-roar': 7, robust: 6, noble: 5, 'one-eyed': 5, filial: 4,
  cautious: -8, ambitious: -8, cunning: -8, sickly: -10, frail: -20, cowardly: -34,
};

/** 膽氣 (0..100) — the nerve a fighter carries into a losing bout. Brave hearts
 *  fight to the death; timid ones sue for quarter or flee. Driven by temperament,
 *  raw 武力 (a mighty arm steadies the will) and prestige/grade standing. */
export function duelValor(o: Officer): number {
  let v = 44;
  for (const t of o.traits ?? []) v += VALOR_TRAIT[t] ?? 0;
  v += Math.round((o.stats.war - 70) * 0.35);           // a strong arm firms the nerve
  v += Math.round(effectivePrestigeEffects(o).duelBonus * 0.5); // renown steels resolve
  v += gradeCombatBonus(o).duelBonus > 0 ? 3 : 0;
  return Math.max(4, Math.min(100, Math.round(v)));
}

const isCraven = (o: Officer): boolean => {
  const t = o.traits ?? [];
  return t.includes('cowardly') || t.includes('cunning') || t.includes('ambitious');
};

/** Decide how a loser who WOULD be cut down meets the blow. A high-膽氣 fighter
 *  almost always dies fighting; a craven mostly breaks — and the truly loyal never
 *  flee (they yield rather than run). Pure given the rng. */
export function duelDeathFate(loser: Officer, rng: () => number = Math.random): DuelFate {
  const v = duelValor(loser);
  // P(fights to the death) rises with 膽氣 on a sigmoid centred at v≈40, so an
  // ordinary fighter (~v44) still usually dies on a clean knockout (~70%) while a
  // craven (~v15) mostly breaks (~66%) and a hero (~v80) practically always falls
  // where he stands (~95%). Keeps auto-resolve lethality broadly intact.
  const pSlain = 0.30 + 0.66 / (1 + Math.exp(-(v - 40) / 9));
  if (rng() < pSlain) return 'slain';
  // Broke. A craven (or the self-serving cunning/ambitious) is apt to bolt; a
  // stout-but-outmatched fighter asks quarter. The dyed-in-the-wool loyal never run.
  const t = loser.traits ?? [];
  const steadfast = t.includes('loyal') || t.includes('ironhearted') || t.includes('martial-valor') || t.includes('matchless');
  const pFlee = steadfast ? 0 : isCraven(loser) ? 0.62 : 0.32;
  return rng() < pFlee ? 'flee' : 'yield';
}

export function resolveDuel(input: DuelInput): DuelResult {
  const rng = input.rng ?? Math.random;
  // rollOne gives the display breakdown; subtract its die for the fixed prowess.
  const a = rollOne(input.attacker, rng);
  const d = rollOne(input.defender, rng);
  // 兵裝相剋 — the weapon-class clash tilts the fixed prowess (a 戟將 wresting a
  // 騎將 from the saddle, a 劍士 struggling against heavy armour).
  // 獨門 — the marquee passives also colour the auto-resolved bout: 天下無敵/撼山
  // 難 firm up the prowess, 霸王色/斷橋 cow the foe's opening, 西涼鐵騎 surges,
  // 七進七出 spares one killing blow.
  const aPass = duelPassive(input.attacker)?.id ?? null;
  const dPass = duelPassive(input.defender)?.id ?? null;
  const passStatic = (p: DuelPassiveId | null) => (p === 'matchless-might' ? 7 : p === 'immovable' ? 5 : 0);
  // 流派相剋 — a trained school that answers the foe's fights above its line (§6.10).
  const aCls = weaponClassFor(input.attacker);
  const dCls = weaponClassFor(input.defender);
  const aStatic = a.total - a.diceRoll + duelWeaponEdge(input.attacker, input.defender) + passStatic(aPass) + martialBonus(input.attacker).prowess + schoolCounterEdge(aCls, dCls, martialXiuwei(input.attacker)) + (input.aCareer ?? 0);
  const dStatic = d.total - d.diceRoll + duelWeaponEdge(input.defender, input.attacker) + passStatic(dPass) + martialBonus(input.defender).prowess + schoolCounterEdge(dCls, aCls, martialXiuwei(input.defender)) + (input.dCareer ?? 0);

  // 氣力 — graded champions enter the bout with a deeper reserve (品階威儀).
  // 霸王色 — a fighter facing an aura-bearer opens with their reserve docked.
  const cows = (p: DuelPassiveId | null) => (p === 'overlord-aura' ? 10 : 0);
  // 兵器覺醒·迅捷 — a swift-awakened kit lends wind for the long bout (≤2 bite).
  const swiftSt = (o: Officer) => Math.min(2, awakeningPerkCountFor(o.equipment, 'swift')) * 5;
  let aSt = 100 + gradeCombatBonus(input.attacker).duelStamina + swiftSt(input.attacker) - cows(dPass);
  let dSt = 100 + gradeCombatBonus(input.defender).duelStamina + swiftSt(input.defender) - cows(aPass);
  // 衝鋒對撞 — a mounted bout opens with a charge pass; the bested rider opens hurt.
  const charge = resolveChargePass(input.attacker, input.defender, rng);
  if (charge) { aSt -= charge.dmgToAttacker; dSt -= charge.dmgToDefender; }
  const rounds: DuelExchange[] = [];
  let knockout: 'attacker' | 'defender' | null = null;
  // 萬人敵 — a 鑽石 champion seizes the opening exchange (先手氣勢), applied round 1 only.
  // 駿馬·先發 / 西涼鐵騎 add to that burst; an aura-bearer's foe opens flat-footed.
  const surge = (p: DuelPassiveId | null) => (p === 'cavalry-surge' ? 8 : 0);
  const cowsFirst = (p: DuelPassiveId | null) => (p === 'overlord-aura' || p === 'thunderous-roar' ? 8 : 0);
  const aFirst = duelFirstStrike(input.attacker) + (mountEdge(input.attacker) === 'charge' ? 8 : 0) + surge(aPass) - cowsFirst(dPass);
  const dFirst = duelFirstStrike(input.defender) + (mountEdge(input.defender) === 'charge' ? 8 : 0) + surge(dPass) - cowsFirst(aPass);
  // 的盧救主 / 七進七出 — a wonder-horse OR 趙雲's valour spares one killing blow.
  const aSavior = mountEdge(input.attacker) === 'savior' || aPass === 'undying-valor';
  const dSavior = mountEdge(input.defender) === 'savior' || dPass === 'undying-valor';

  for (let r = 1; r <= MAX_ROUNDS; r++) {
    const aScore = aStatic + Math.floor(rng() * 20) + (r === 1 ? aFirst : 0);
    const dScore = dStatic + Math.floor(rng() * 20) + (r === 1 ? dFirst : 0);
    const diff = aScore - dScore;
    const roundWinner = diff > 0 ? 'attacker' : diff < 0 ? 'defender' : 'draw';
    const dmg = 14 + Math.min(28, Math.floor(Math.abs(diff) * 0.8));
    if (roundWinner === 'attacker') dSt -= dmg;
    else if (roundWinner === 'defender') aSt -= dmg;
    aSt = Math.max(0, aSt);
    dSt = Math.max(0, dSt);
    const pool = roundWinner === 'draw' ? ROUND_LINES_DRAW : ROUND_LINES_WIN;
    rounds.push({
      round: r,
      attackerScore: aScore,
      defenderScore: dScore,
      roundWinner,
      attackerStamina: aSt,
      defenderStamina: dSt,
      text: pool[Math.floor(rng() * pool.length)],
    });
    if (aSt <= 0) { knockout = 'defender'; break; }
    if (dSt <= 0) { knockout = 'attacker'; break; }
  }

  if (knockout) {
    // 的盧救主 — the loser's wonder-horse bears them clear; they survive, unhorsed.
    const loserSaved = knockout === 'attacker' ? dSavior : aSavior;
    let killedId = loserSaved ? undefined : (knockout === 'attacker' ? input.defender.id : input.attacker.id);
    // 膽氣 — a beaten fighter's nerve decides the killing blow: the craven sue for
    // quarter (請降) or bolt (落荒而逃) rather than die where they stand.
    let fate: DuelFate | undefined;
    if (killedId) {
      const loser = knockout === 'attacker' ? input.defender : input.attacker;
      const f = duelDeathFate(loser, rng);
      if (f !== 'slain') { fate = f; killedId = undefined; }
    }
    return {
      attackerRoll: a, defenderRoll: d,
      margin: knockout === 'attacker' ? aSt : dSt,
      winner: knockout, killedId, fate, rounds,
      attackerStamina: aSt, defenderStamina: dSt, knockout: true,
    };
  }

  // Went the distance — decide on remaining stamina.
  const margin = Math.abs(aSt - dSt);
  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  let killedId: string | undefined;
  let fate: DuelFate | undefined;
  if (margin >= 15) {
    winner = aSt > dSt ? 'attacker' : 'defender';
    // A decisive stamina gap can be lethal, but reserve most kills for actual
    // knockouts — a points win shouldn't kill officers as freely as it did at 25.
    // 的盧救主 — even a decisive defeat spares the rider of a wonder-horse.
    const loserSaved = winner === 'attacker' ? dSavior : aSavior;
    if (margin >= 40 && !loserSaved) {
      killedId = winner === 'attacker' ? input.defender.id : input.attacker.id;
      // 膽氣 — even a rout may end in surrender or flight rather than a corpse.
      const loser = winner === 'attacker' ? input.defender : input.attacker;
      const f = duelDeathFate(loser, rng);
      if (f !== 'slain') { fate = f; killedId = undefined; }
    }
  }
  return {
    attackerRoll: a, defenderRoll: d, margin, winner, killedId, fate, rounds,
    attackerStamina: aSt, defenderStamina: dSt, knockout: false,
  };
}

/** Fixed prowess breakdown (war + item + skill + trait), no dice. */
function prowessParts(o: Officer): { itemBonus: number; skillBonus: number; traitBonus: number } {
  let itemBonus = 0;
  for (const id of o.equipment) {
    const it = liveItemById(id);
    // 兵器駕馭 — a 神兵 only tells in worthy hands; 精煉 boosts read live here.
    if (it?.effects.war) itemBonus += it.effects.war * itemMasteryMul(o, it);
  }
  // 器魂戰技 — an awakened weapon's signature art sharpens single combat (W9).
  itemBonus += evolvedArtDuelBonus(o);
  let skillBonus = 0;
  for (const sid of o.skills) {
    const s = SKILLS_BY_ID[sid];
    // 技能等級 — mastery deepens the champion's edge (skillMastery.ts).
    const m = skillEffectMul(o, sid);
    if (s?.combat?.duelChanceBonus) skillBonus += s.combat.duelChanceBonus * 30 * m;
    if (s?.combat?.warBonus) skillBonus += (s.combat.warBonus ?? 0) * 0.5 * m;
  }
  let traitBonus = 0;
  for (const t of o.traits ?? []) {
    if (t === 'matchless') traitBonus += 25;
    else if (t === 'duelist') traitBonus += 20;      // 鬥將 — lives for single combat
    else if (t === 'martial-valor') traitBonus += 12;
    else if (t === 'berserker') traitBonus += 10;    // 狂戰 — frenzy in the melee
    else if (t === 'wrathful') traitBonus += 8;
    else if (t === 'tiger-roar') traitBonus += 6;    // 虎吼 — battle cry rattles the foe
    else if (t === 'reckless') traitBonus += 6;
    else if (t === 'one-eyed') traitBonus += 6;
    else if (t === 'cowardly') traitBonus -= 15;
    else if (t === 'frail') traitBonus -= 30;
    else if (t === 'sickly') traitBonus -= 5;
    else if (t === 'cautious') traitBonus -= 4;
  }
  return { itemBonus, skillBonus, traitBonus };
}

/** Static prowess (war + bonuses, no dice) — drives interactive-duel damage. */
export function staticProwess(o: Officer): number {
  const p = prowessParts(o);
  // 養傷 — a lingering duel wound saps 武力 here too.
  // 傷殘 — permanent maims sap prowess for good (the dark mirror of growth).
  return Math.round(o.stats.war + afflictionDelta(o, 'war') + p.itemBonus + p.skillBonus + p.traitBonus + effectivePrestigeEffects(o).duelBonus + gradeCombatBonus(o).duelBonus + martialBonus(o).prowess - scarProwessPenalty(o));
}

function rollOne(o: Officer, rng: () => number): DuelRoll {
  const { itemBonus, skillBonus, traitBonus } = prowessParts(o);
  // 品階威儀 — a renowned warrior carries an edge into single combat.
  const gradeBonus = gradeCombatBonus(o).duelBonus;
  const diceRoll = Math.floor(rng() * 30);
  const total = o.stats.war + itemBonus + skillBonus + traitBonus + gradeBonus + diceRoll;
  return {
    officerId: o.id,
    base: o.stats.war,
    itemBonus,
    skillBonus: Math.round(skillBonus),
    traitBonus: Math.round(traitBonus),
    diceRoll,
    total: Math.round(total),
  };
}

// ─── 兵器絕技 — legendary weapons grant a signature edge in a duel ─────────
// A weapon art empowers one move (+32% when it lands), or 'pierce' (蛇矛破守)
// which chips a 格-guarding foe even when turned aside.
export type WeaponArtKind = 'power' | 'slash' | 'cleave' | 'pierce';
export interface WeaponArt { kind: WeaponArtKind; zh: string; en: string; weaponZh: string; weaponEn: string; }

const WEAPON_ARTS: Record<string, WeaponArt> = {
  'sky-piercer':  { kind: 'power',  zh: '畫戟·奮擊', en: 'Sky Piercer — Overpower+', weaponZh: '方天畫戟', weaponEn: 'Sky Piercer' },
  'green-dragon': { kind: 'slash',  zh: '偃月·斬',   en: 'Green Dragon — Slash+',   weaponZh: '青龍偃月刀', weaponEn: 'Green Dragon Blade' },
  'snake-spear':  { kind: 'pierce', zh: '蛇矛·破守', en: 'Snake Spear — Pierce',    weaponZh: '丈八蛇矛', weaponEn: 'Snake Spear' },
  'gu-ding':      { kind: 'cleave', zh: '古錠·劈',   en: 'Gu Ding — Cleave+',       weaponZh: '古錠刀', weaponEn: 'Gu Ding Sword' },
  'twin-swords':  { kind: 'slash',  zh: '雌雄·雙鋒', en: 'Twin Swords — Slash+',    weaponZh: '雌雄一對劍', weaponEn: 'Twin Swords' },
  'yitian':       { kind: 'power',  zh: '倚天·威',   en: 'Yitian — Overpower+',     weaponZh: '倚天劍', weaponEn: 'Yitian Sword' },
  'seven-star':   { kind: 'pierce', zh: '七星·刺',   en: 'Seven Star — Pierce',     weaponZh: '七星寶刀', weaponEn: 'Seven Star Sword' },
  'tiger-tooth-saber': { kind: 'cleave', zh: '虎牙·劈', en: 'Tiger-Tooth — Cleave+', weaponZh: '虎牙刀', weaponEn: 'Tiger-Tooth Saber' },
  'liquan-shenmao':     { kind: 'pierce', zh: '瀝泉·破守', en: 'Liquan Spear — Pierce',  weaponZh: '瀝泉神矛', weaponEn: 'Liquan Divine Spear' },
  'tianlong-pocheng-ji':{ kind: 'power',  zh: '破城·奮擊', en: 'City-Breaker — Overpower+', weaponZh: '天龍破城戟', weaponEn: 'Dragon City-Breaker Halberd' },
  'taotie-fu':          { kind: 'cleave', zh: '吞天·劈',   en: 'Taotie Axe — Cleave+',    weaponZh: '饕餮吞天斧', weaponEn: 'Taotie Sky-Devouring Axe' },
  'yinglong-mao':       { kind: 'pierce', zh: '喚雨·刺',   en: 'Responding-Dragon — Pierce', weaponZh: '應龍喚雨矛', weaponEn: 'Responding-Dragon Spear' },
  'wuzi-gang-dao':      { kind: 'cleave', zh: '烏茲·劈',   en: 'Wootz Saber — Cleave+',   weaponZh: '烏茲鋼刀', weaponEn: 'Wootz Steel Saber' },
  'liuxing-chui':       { kind: 'power',  zh: '流星·奮擊', en: 'Meteor Hammer — Overpower+', weaponZh: '流星錘', weaponEn: 'Meteor Hammer' },
  'qiongqi-qiang':      { kind: 'pierce', zh: '噬魂·破守', en: 'Qiongqi Spear — Pierce',  weaponZh: '窮奇噬魂槍', weaponEn: 'Qiongqi Soul-Eating Spear' },
  'xiangliu-ji':        { kind: 'power',  zh: '九首·奮擊', en: 'Nine-Head Halberd — Overpower+', weaponZh: '相柳九首戟', weaponEn: 'Xiangliu Nine-Head Halberd' },
  'juexian-jian':       { kind: 'slash',  zh: '絕仙·斬',   en: 'Sever-Immortal — Slash+', weaponZh: '絕仙劍', weaponEn: 'Sever-Immortal Sword' },
  'weijing-zhanfu':     { kind: 'cleave', zh: '維京·劈',   en: 'Viking Axe — Cleave+',    weaponZh: '維京戰斧', weaponEn: 'Viking War-Axe' },
  'gaochong-zanjin-qiang': { kind: 'pierce', zh: '鏨金·破守', en: 'Gilt Spear — Pierce',  weaponZh: '高寵鏨金槍', weaponEn: "Gao Chong's Gilt Spear" },
  'huyanzhuo-shuangbian': { kind: 'power',  zh: '雙鞭·奮擊', en: 'Twin Cudgels — Overpower+', weaponZh: '呼延灼雙鞭', weaponEn: "Huyan Zhuo's Twin Cudgels" },
  'suochao-jinzhan-fu':   { kind: 'cleave', zh: '金蘸·劈',   en: 'Gilt Axe — Cleave+',     weaponZh: '索超金蘸斧', weaponEn: "Suo Chao's Gilt Axe" },
  'lujunyi-qiang':        { kind: 'pierce', zh: '點鋼·破守', en: 'Steel Spear — Pierce',   weaponZh: '盧俊義點鋼槍', weaponEn: "Lu Junyi's Steel Spear" },
  'qinqiong-jian':        { kind: 'power',  zh: '金裝·奮擊', en: 'Gilt Mace — Overpower+', weaponZh: '秦瓊瓦面金裝鐧', weaponEn: "Qin Qiong's Gilt Mace" },
  'guansheng-dadao':      { kind: 'slash',  zh: '大刀·斬',   en: 'Great Saber — Slash+',   weaponZh: '關勝大刀', weaponEn: "Guan Sheng's Great Saber" },
  'yangzaixing-qiang':    { kind: 'pierce', zh: '神槍·破守', en: 'Divine Spear — Pierce',  weaponZh: '楊再興神槍', weaponEn: "Yang Zaixing's Spear" },
  'niugao-shuangjian':    { kind: 'power',  zh: '雙鐧·奮擊', en: 'Twin Maces — Overpower+', weaponZh: '牛皋雙鐧', weaponEn: "Niu Gao's Twin Maces" },
  'dongping-shuangqiang': { kind: 'pierce', zh: '雙槍·破守', en: 'Twin Spears — Pierce',  weaponZh: '董平雙槍', weaponEn: "Dong Ping's Twin Spears" },
  'shijin-baohuan-dao':   { kind: 'cleave', zh: '八環·劈',   en: 'Eight-Ring — Cleave+',  weaponZh: '史進八環刀', weaponEn: "Shi Jin's Eight-Ring Saber" },
  'wangyanzhang-qiang':   { kind: 'pierce', zh: '鐵槍·破守', en: 'Iron Spear — Pierce',   weaponZh: '王彥章鐵槍', weaponEn: "Wang Yanzhang's Iron Spear" },
  'luwenlong-shuangqiang':{ kind: 'pierce', zh: '雙槍·連刺', en: 'Twin Spears — Pierce',  weaponZh: '陸文龍雙槍', weaponEn: "Lu Wenlong's Twin Spears" },
  'yueyun-yinchui':       { kind: 'power',  zh: '銀錘·奮擊', en: 'Silver Hammers — Overpower+', weaponZh: '岳雲銀錘', weaponEn: "Yue Yun's Silver Hammers" },
  'bosaidun-cha':         { kind: 'pierce', zh: '三叉·破守', en: 'Trident — Pierce',        weaponZh: '波塞頓三叉戟', weaponEn: "Poseidon's Trident" },
  'chenxing-chui':        { kind: 'power',  zh: '晨星·奮擊', en: 'Morningstar — Overpower+', weaponZh: '晨星流星錘', weaponEn: 'Morningstar Flail' },
  'pei-bagua-chui':       { kind: 'power',  zh: '梅花·奮擊', en: 'Plum Hammers — Overpower+', weaponZh: '八卦梅花亮銀錘', weaponEn: 'Eight-Trigram Silver Hammers' },
  'taowu-chui':           { kind: 'power',  zh: '裂地·奮擊', en: 'Earth-Splitter — Overpower+', weaponZh: '梼杌裂地錘', weaponEn: 'Taowu Earth-Splitting Maul' },
};

/** The duel art of the first legendary weapon an officer has equipped, if any. */
export function weaponArtFor(o: Officer): WeaponArt | null {
  for (const id of o.equipment) if (WEAPON_ARTS[id]) return WEAPON_ARTS[id];
  return null;
}

// ─── 坐騎 — a famed war-horse lends its own edge to single combat ────────────
// A mount's raw +武力 already rolls into the prowess score (it's an item). What
// a NAMED steed adds *here* is duel-specific and can't be read off a stat line:
//   駿 charge — 赤兔/絕影 explode out of the gate: a 先發 edge (a banked 氣
//               interactively / a round-1 初速 in the auto bout).
//   救 savior — 的盧救主: a wonder-horse carries a beaten rider clear of the
//               killing blow ONCE — a lethal defeat becomes a bruising survival.
export type MountEdge = 'charge' | 'savior' | null;
const MOUNT_EDGE_BY_ITEM: Record<string, MountEdge> = {
  'red-hare': 'charge',          // 赤兔馬 — 日行千里,衝鋒先發
  'jue-ying': 'savior',          // 絕影 — 救曹操於宛城
  'dilu': 'savior',              // 的盧 — 一躍三丈過檀溪,的盧救主
  'zhaoye-yushizi': 'charge',    // 照夜玉獅子
  'wuzhui-ma': 'charge',         // 烏騅馬
  'wuzhui': 'charge',            // 烏騅
  'zhuahuang-feidian': 'charge', // 爪黃飛電 — 曹操坐騎
  'huolong-ju': 'charge',        // 火龍駒
  'yu-qilin': 'charge',          // 玉麒麟
  'huangbiao-touglong': 'charge',// 黃膘透骨龍
  'qianlixue': 'savior',         // 千里雪 — 輕捷脫險
  'wanli-yun': 'savior',         // 萬里雲
  'qianli-zhuifeng': 'savior',   // 千里追風
  'dawan': 'charge',             // 大宛馬 — 汗血寶馬
  'bailong': 'charge',           // 白龍
  'shizicong': 'charge',         // 獅子驄 — 負重不疲
  'huangbiao': 'charge',         // 黃驃馬
  'heizhui': 'charge',           // 黑追
  'wuyun-qingcong': 'savior',    // 烏雲青驄 — 輕捷
  'xueyun': 'savior',            // 雪雲
  'kuaicheng': 'savior',         // 快雲 — 輕快脫險
  'wuyun': 'charge',             // 烏雲踏雪
  'datas-yellow': 'charge',      // 大宛黃 — 汗血良駒
};

/** The duel edge of the first famed mount an officer has equipped, if any. */
export function mountEdge(o: Officer): MountEdge {
  for (const id of o.equipment) { const e = MOUNT_EDGE_BY_ITEM[id]; if (e) return e; }
  return null;
}

// ─── 必殺技 — a famous warrior's signature finisher, with its OWN mechanics ──
// The 武魂 gauge unlocks a once-per-bout 必殺 (an unstoppable strike). A named
// hero's finisher isn't just flavour — its `kind` bends the exchange:
//   feint  拖刀計  — bait a guard, then wheel: +50% when the foe was DEFENDING.
//   multi  七進七出 — a break-through flurry: ×1.2 and the rider cuts back out (回氣力).
//   sunder 無雙/斷橋 — the blow (and the war-cry) shatters will: drains the foe's 武魂.
//   volley 百步穿楊 — an archer's killing shot from range: ×1.25 precision.
//   power  奮命一擊 — the generic great-warrior finisher.
export type UltKind = 'power' | 'feint' | 'multi' | 'sunder' | 'volley';
export interface SignatureUlt { id: string; zh: string; en: string; kind: UltKind; }

const SIGNATURE_ULTS: Record<string, SignatureUlt> = {
  // ── 一線名將 ──
  'guan-yu':     { id: 'guan-yu',     kind: 'feint',  zh: '拖刀計',   en: 'Dragging-Blade Feint' },
  'zhao-yun':    { id: 'zhao-yun',    kind: 'multi',  zh: '七進七出', en: 'Seven In, Seven Out' },
  'ma-chao':     { id: 'ma-chao',     kind: 'multi',  zh: '錦帆銀槍', en: 'Silver Spear Flurry' },
  'lu-bu':       { id: 'lu-bu',       kind: 'sunder', zh: '無雙',     en: 'Peerless' },
  'zhang-fei':   { id: 'zhang-fei',   kind: 'sunder', zh: '據水斷橋', en: 'Roar at the Bridge' },
  'dian-wei':    { id: 'dian-wei',    kind: 'power',  zh: '雙戟摧鋒', en: 'Twin Halberds' },
  'xu-chu':      { id: 'xu-chu',      kind: 'power',  zh: '虎癡裸衣', en: 'Tiger Fury' },
  'sun-ce':      { id: 'sun-ce',      kind: 'multi',  zh: '江東霸王', en: 'Little Conqueror' },
  'huang-zhong': { id: 'huang-zhong', kind: 'volley', zh: '百步穿楊', en: 'Hundred-Pace Shot' },
  'taishi-ci':   { id: 'taishi-ci',   kind: 'volley', zh: '猿臂神射', en: 'Ape-Arm Volley' },
  'gan-ning':    { id: 'gan-ning',    kind: 'volley', zh: '錦帆神射', en: 'Brocade-Sail Volley' },
  'yan-liang':   { id: 'yan-liang',   kind: 'power',  zh: '河北上將', en: 'Champion of Hebei' },
  // ── 魏 ──
  'zhang-liao':  { id: 'zhang-liao',  kind: 'sunder', zh: '威震逍遙津', en: 'Terror of Xiaoyao Ford' },
  'xu-huang':    { id: 'xu-huang',    kind: 'power',  zh: '長驅直入', en: 'Headlong Charge' },
  'zhang-he':    { id: 'zhang-he',    kind: 'feint',  zh: '巧變',     en: 'Cunning Shift' },
  'xiahou-dun':  { id: 'xiahou-dun',  kind: 'power',  zh: '拔矢啖睛', en: 'Eye of Valor' },
  'xiahou-yuan': { id: 'xiahou-yuan', kind: 'volley', zh: '妙才神速', en: 'Lightning Marksman' },
  'pang-de':     { id: 'pang-de',     kind: 'feint',  zh: '抬櫬決死', en: 'Coffin-Borne Resolve' },
  'wen-chou':    { id: 'wen-chou',    kind: 'power',  zh: '河北驍將', en: 'Valiant of Hebei' },
  // ── 蜀 ──
  'wei-yan':     { id: 'wei-yan',     kind: 'feint',  zh: '倒拖刀',   en: 'Trailing Blade' },
  'jiang-wei':   { id: 'jiang-wei',   kind: 'multi',  zh: '文武雙絕', en: 'Blade and Mind' },
  'guan-ping':   { id: 'guan-ping',   kind: 'power',  zh: '虎子承風', en: 'Young Tiger' },
  'guan-xing':   { id: 'guan-xing',   kind: 'multi',  zh: '龍子復仇', en: 'Dragon\'s Vengeance' },
  'zhang-bao':   { id: 'zhang-bao',   kind: 'sunder', zh: '燕人之吼', en: 'Roar of Yan' },
  'ma-dai':      { id: 'ma-dai',      kind: 'power',  zh: '西涼鐵騎', en: 'Iron Cavalry of Xiliang' },
  // ── 吳 ──
  'zhou-tai':    { id: 'zhou-tai',    kind: 'multi',  zh: '九創救主', en: 'Nine Wounds' },
  'ling-tong':   { id: 'ling-tong',  kind: 'power',  zh: '沙場死鬥', en: 'To the Last' },
  'huang-gai':   { id: 'huang-gai',   kind: 'power',  zh: '苦肉重擊', en: 'Bitter-Flesh Strike' },
  'sun-jian':    { id: 'sun-jian',    kind: 'power',  zh: '江東猛虎', en: 'Tiger of Jiangdong' },
  // ── 群雄 ──
  'hua-xiong':   { id: 'hua-xiong',   kind: 'power',  zh: '斬將揚威', en: 'Champion-Slayer' },
  'wen-yang':    { id: 'wen-yang',    kind: 'multi',  zh: '單騎退雄兵', en: 'One Rider, a Host Turned' },
  'deng-ai':     { id: 'deng-ai',     kind: 'feint',  zh: '偷渡陰平', en: 'Yinping Gambit' },
  'ji-ling':     { id: 'ji-ling',     kind: 'power',  zh: '三尖兩刃', en: 'Three-Point Halberd' },
  // ── 魏(增補) ──
  'cao-zhang':   { id: 'cao-zhang',   kind: 'power',  zh: '黃鬚萬夫', en: 'Yellow-Beard, Match for Myriads' },
  'cao-ren':     { id: 'cao-ren',     kind: 'power',  zh: '天人之勇', en: 'Heaven-Sent Valor' },
  'gao-shun':    { id: 'gao-shun',    kind: 'sunder', zh: '陷陣破敵', en: 'Trap-Breaker Vanguard' },
  'li-dian':     { id: 'li-dian',     kind: 'feint',  zh: '深沉機變', en: 'Subtle Gambit' },
  'yu-jin':      { id: 'yu-jin',      kind: 'power',  zh: '毅重持軍', en: 'Iron Discipline' },
  // ── 蜀(增補) ──
  'yan-yan':     { id: 'yan-yan',     kind: 'feint',  zh: '老當益壯', en: 'Old Tiger\'s Wile' },
  'liao-hua':    { id: 'liao-hua',    kind: 'power',  zh: '蜀中先鋒', en: 'Vanguard of Shu' },
  // ── 吳(增補) ──
  'ding-feng':   { id: 'ding-feng',   kind: 'multi',  zh: '雪中短兵', en: 'Short Blades in the Snow' },
  'han-dang':    { id: 'han-dang',    kind: 'power',  zh: '江表虎臣', en: 'Tiger-Vassal of the South' },
  'pan-zhang':   { id: 'pan-zhang',   kind: 'power',  zh: '擒龍之刀', en: 'Dragon-Taker\'s Blade' },
  'zhu-ran':     { id: 'zhu-ran',     kind: 'power',  zh: '膽守江陵', en: 'Defiance at Jiangling' },
  // ── 群雄(增補) ──
  'gongsun-zan': { id: 'gongsun-zan', kind: 'volley', zh: '白馬神射', en: 'White-Horse Marksman' },
  'dong-zhuo':   { id: 'dong-zhuo',   kind: 'power',  zh: '魔王肆虐', en: 'Tyrant\'s Wrath' },
  'zhang-xiu':   { id: 'zhang-xiu',   kind: 'multi',  zh: '北地槍王', en: 'Spear-King of the North' },
  'wang-shuang': { id: 'wang-shuang', kind: 'power',  zh: '流星追魂', en: 'Meteor-Hammer Soul-Chaser' },
  'zhu-rong':    { id: 'zhu-rong',    kind: 'volley', zh: '飛刀絕殺', en: 'Hurled-Blade Kill' },
  'meng-huo':    { id: 'meng-huo',    kind: 'power',  zh: '南蠻之王', en: 'King of the Nanman' },
  'li-jue':      { id: 'li-jue',      kind: 'power',  zh: '西涼悍將', en: 'Brute of Xiliang' },
  // ── 增補(蜀) ──
  'zhou-cang':   { id: 'zhou-cang',   kind: 'power',  zh: '虎背扛刀', en: 'Bear-Backed Blade-Bearer' },
  'ma-zhong-wu': { id: 'ma-zhong-wu', kind: 'feint',  zh: '伏路擒龍', en: 'Ambush of the Dragon' },
  // ── 增補(魏) ──
  'guo-huai':    { id: 'guo-huai',    kind: 'feint',  zh: '料敵機先', en: 'Reading the Foe' },
  'hao-zhao':    { id: 'hao-zhao',    kind: 'power',  zh: '陳倉死守', en: 'Unbroken at Chencang' },
  'xiahou-ba':   { id: 'xiahou-ba',   kind: 'power',  zh: '虎步關右', en: 'Tiger-Stride of Guanyou' },
  'cao-zhen':    { id: 'cao-zhen',    kind: 'power',  zh: '虎豹遺風', en: 'Heir to the Tiger Cavalry' },
  'cao-xiu':     { id: 'cao-xiu',     kind: 'power',  zh: '千里駒', en: 'Thoroughbred of the Clan' },
  'gao-lan':     { id: 'gao-lan',     kind: 'power',  zh: '河北庭柱', en: 'Pillar of Hebei' },
  // ── 增補(吳) ──
  'zhu-huan':    { id: 'zhu-huan',    kind: 'feint',  zh: '攻守相生', en: 'Bulwark and Sally' },
  'cheng-pu':    { id: 'cheng-pu',    kind: 'power',  zh: '江表元勳', en: 'Elder of the Jiangbiao' },
  'dong-xi':     { id: 'dong-xi',     kind: 'power',  zh: '萬人之敵', en: 'Foe of Ten Thousand' },
  'ling-cao':    { id: 'ling-cao',    kind: 'power',  zh: '陷陣先登', en: 'First Over the Line' },
  'quan-cong':   { id: 'quan-cong',   kind: 'power',  zh: '江東棟梁', en: 'Mainstay of Jiangdong' },
  // ── 增補(群雄/異族) ──
  'wen-pin':     { id: 'wen-pin',     kind: 'power',  zh: '江夏砥柱', en: 'Bastion of Jiangxia' },
  'huang-zu':    { id: 'huang-zu',    kind: 'power',  zh: '江夏舊將', en: 'Veteran of Jiangxia' },
  'wutugu':      { id: 'wutugu',      kind: 'power',  zh: '藤甲蠻力', en: 'Rattan-Armoured Brute' },
  // ── 千古名將(歷代歷史武將,hist- 池)──────────────────────────────────
  // 秦漢
  'hist-xiang-yu':   { id: 'hist-xiang-yu',   kind: 'sunder', zh: '霸王之氣', en: 'Overlord\'s Aura' },
  'hist-bai-qi':     { id: 'hist-bai-qi',     kind: 'power',  zh: '殺神之威', en: 'God of Slaughter' },
  'hist-han-xin':    { id: 'hist-han-xin',    kind: 'feint',  zh: '背水一戰', en: 'Back to the River' },
  'hist-li-mu':      { id: 'hist-li-mu',      kind: 'feint',  zh: '邊塞奇謀', en: 'Frontier Stratagem' },
  'hist-lian-po':    { id: 'hist-lian-po',    kind: 'power',  zh: '老當益壯', en: 'Old and Only Fiercer' },
  'hist-wang-jian':  { id: 'hist-wang-jian',  kind: 'power',  zh: '滅國之師', en: 'Realm-Ending Host' },
  'hist-meng-tian':  { id: 'hist-meng-tian',  kind: 'power',  zh: '北築長城', en: 'Wall-Builder of the North' },
  'hist-ying-bu':    { id: 'hist-ying-bu',    kind: 'power',  zh: '黥布之勇', en: 'Valor of the Branded' },
  'hist-xiang-yan':  { id: 'hist-xiang-yan',  kind: 'power',  zh: '楚之名將', en: 'Champion of Chu' },
  'hist-wu-qi':      { id: 'hist-wu-qi',      kind: 'power',  zh: '吳子之法', en: 'Master Wu\'s Art' },
  'hist-yue-yi':     { id: 'hist-yue-yi',     kind: 'power',  zh: '連下七十', en: 'Seventy Cities Fallen' },
  'hist-tian-dan':   { id: 'hist-tian-dan',   kind: 'sunder', zh: '火牛破陣', en: 'Fire-Oxen Charge' },
  // 兩漢
  'hist-huo-qubing': { id: 'hist-huo-qubing', kind: 'multi',  zh: '封狼居胥', en: 'Banner on Wolf-Stone Mountain' },
  'hist-wei-qing':   { id: 'hist-wei-qing',   kind: 'power',  zh: '龍城飛將', en: 'Flying General of Longcheng' },
  'hist-li-guang':   { id: 'hist-li-guang',   kind: 'volley', zh: '飛將神射', en: 'Flying General\'s Shot' },
  'hist-ma-yuan':    { id: 'hist-ma-yuan',    kind: 'power',  zh: '馬革裹屍', en: 'Wrapped in a Horse-Hide' },
  'hist-ban-chao':   { id: 'hist-ban-chao',   kind: 'feint',  zh: '不入虎穴', en: 'Into the Tiger\'s Den' },
  // 隋唐五代
  'hist-li-cunxiao': { id: 'hist-li-cunxiao', kind: 'sunder', zh: '十三太保', en: 'Thirteenth Champion' },
  'hist-li-jing':    { id: 'hist-li-jing',    kind: 'feint',  zh: '神兵天降', en: 'Soldiers from the Sky' },
  'hist-su-dingfang':{ id: 'hist-su-dingfang',kind: 'power',  zh: '滅三國', en: 'Crusher of Three Realms' },
  'hist-qin-qiong':  { id: 'hist-qin-qiong',  kind: 'power',  zh: '撒手鐧', en: 'The Thrown Mace' },
  'hist-yuchi-gong': { id: 'hist-yuchi-gong', kind: 'power',  zh: '單鞭奪槊', en: 'Whip Takes the Lance' },
  'hist-xue-rengui': { id: 'hist-xue-rengui', kind: 'volley', zh: '三箭定天山', en: 'Three Arrows at Tianshan' },
  'hist-guo-ziyi':   { id: 'hist-guo-ziyi',   kind: 'feint',  zh: '單騎退敵', en: 'A Lone Rider Turns the Host' },
  'hist-shi-wansui': { id: 'hist-shi-wansui', kind: 'power',  zh: '敦煌戍主', en: 'Warden of Dunhuang' },
  // 兩宋
  'hist-yue-fei':    { id: 'hist-yue-fei',    kind: 'multi',  zh: '精忠報國', en: 'Utmost Loyalty' },
  'hist-han-shizhong':{id: 'hist-han-shizhong',kind:'power',  zh: '中興武功', en: 'Restorer\'s Valor' },
  'hist-di-qing':    { id: 'hist-di-qing',    kind: 'feint',  zh: '夜襲崑崙', en: 'Night Raid at Kunlun' },
  // 元明
  'hist-xu-da':      { id: 'hist-xu-da',      kind: 'power',  zh: '開國元勳', en: 'Founding Marshal' },
  'hist-chang-yuchun':{id: 'hist-chang-yuchun',kind:'power',  zh: '常勝萬夫', en: 'Chang Ten-Thousand' },
  'hist-qi-jiguang': { id: 'hist-qi-jiguang', kind: 'feint',  zh: '鴛鴦破陣', en: 'Mandarin-Duck Formation' },
  // ── 千古名將(續・春秋戰國至明清)────────────────────────────────────────
  // 春秋戰國・刺客名射
  'hist-yang-youji': { id: 'hist-yang-youji', kind: 'volley', zh: '百步穿楊', en: 'Pierce the Willow' },
  'hist-qing-ji':    { id: 'hist-qing-ji',    kind: 'multi',  zh: '飛人之疾', en: 'Swifter Than the Hawk' },
  'hist-zhuan-zhu':  { id: 'hist-zhuan-zhu',  kind: 'feint',  zh: '魚腸藏鋒', en: 'Blade in the Fish' },
  'hist-nie-zheng':  { id: 'hist-nie-zheng',  kind: 'feint',  zh: '士為知己', en: 'For the One Who Knew Me' },
  'hist-zhu-hai':    { id: 'hist-zhu-hai',    kind: 'power',  zh: '鐵椎一擊', en: 'The Iron Mallet' },
  'hist-gu-yezi':    { id: 'hist-gu-yezi',    kind: 'power',  zh: '搏黿之勇', en: 'Wrestler of River-Beasts' },
  'hist-wu-zixu':    { id: 'hist-wu-zixu',    kind: 'feint',  zh: '過昭關', en: 'Through the Zhao Pass' },
  // 秦漢
  'hist-fan-kuai':   { id: 'hist-fan-kuai',   kind: 'power',  zh: '鴻門撞帳', en: 'Crash the Hongmen Tent' },
  'hist-long-qu':    { id: 'hist-long-qu',    kind: 'power',  zh: '楚之驍將', en: 'Fierce Blade of Chu' },
  // 五胡・南北朝
  'hist-shi-hu':     { id: 'hist-shi-hu',     kind: 'power',  zh: '羯族暴威', en: 'Tyrant of the Jie' },
  'hist-tuoba-tao':  { id: 'hist-tuoba-tao',  kind: 'power',  zh: '太武掃北', en: 'Sweep of the North' },
  'hist-murong-chui':{ id: 'hist-murong-chui',kind: 'feint',  zh: '參合奇略', en: 'Stratagem at Canhe' },
  'hist-gao-aocao':  { id: 'hist-gao-aocao',  kind: 'power',  zh: '韓陵山勇', en: 'Valor of Hanling' },
  'hist-hulu-guang': { id: 'hist-hulu-guang', kind: 'volley', zh: '落雕都督', en: 'Hawk-Felling Commander' },
  'hist-lanlingwang':{ id: 'hist-lanlingwang',kind: 'sunder', zh: '蘭陵入陣', en: 'Prince of Lanling\'s Charge' },
  'hist-erzhu-rong': { id: 'hist-erzhu-rong', kind: 'sunder', zh: '河陰之威', en: 'Terror of Heyin' },
  'hist-yang-dayan': { id: 'hist-yang-dayan', kind: 'power',  zh: '當世關張', en: 'Guan-and-Zhang Reborn' },
  'hist-xiao-mohe':  { id: 'hist-xiao-mohe',  kind: 'power',  zh: '南陳猛將', en: 'Tiger of Southern Chen' },
  'hist-mai-tiezhang':{id: 'hist-mai-tiezhang',kind:'power',  zh: '鐵杖開山', en: 'Iron-Staff Mountain-Cleaver' },
  // 隋唐
  'hist-tang-taizong':{id: 'hist-tang-taizong',kind:'feint',  zh: '天策上將', en: 'Lord of Heaven\'s Strategy' },
  'hist-han-qinhu':  { id: 'hist-han-qinhu',  kind: 'power',  zh: '擒虎滅陳', en: 'Tiger-Taker' },
  'hist-luo-cheng':  { id: 'hist-luo-cheng',  kind: 'multi',  zh: '回馬羅槍', en: 'Luo\'s Wheeling Spear' },
  'hist-xue-rengao': { id: 'hist-xue-rengao', kind: 'power',  zh: '西秦悍將', en: 'Brute of Western Qin' },
  'hist-shan-xiongxin':{id:'hist-shan-xiongxin',kind:'power', zh: '棗陽奪槊', en: 'Jujube-Lance Reaver' },
  'hist-heichi-changzhi':{id:'hist-heichi-changzhi',kind:'power',zh:'黑齒驍勇',en:'Valor of Heichi' },
  'hist-shen-guang':  { id: 'hist-shen-guang', kind: 'multi', zh: '肉飛仙', en: 'The Flying Acrobat' },
  // 五代・遼宋金
  'hist-li-keyong':  { id: 'hist-li-keyong',  kind: 'volley', zh: '飛虎神射', en: 'One-Eyed Dragon\'s Shot' },
  'hist-wang-yanzhang':{id:'hist-wang-yanzhang',kind:'power', zh: '王鐵槍', en: 'Iron-Spear Wang' },
  'hist-zhao-kuangyin':{id:'hist-zhao-kuangyin',kind:'power', zh: '太祖盤龍', en: 'Coiled-Dragon Cudgel' },
  'hist-yang-ye':    { id: 'hist-yang-ye',    kind: 'power',  zh: '楊無敵', en: 'Yang the Invincible' },
  'hist-yang-yanzhao':{id: 'hist-yang-yanzhao',kind:'power',  zh: '六郎鎮邊', en: 'Sixth-Son of the Frontier' },
  'hist-mu-guiying': { id: 'hist-mu-guiying', kind: 'volley', zh: '楊門女將', en: 'Lady-General of the Yang' },
  'hist-fan-lihua':  { id: 'hist-fan-lihua',  kind: 'multi',  zh: '移山倒海', en: 'Mountain-Mover' },
  'hist-niu-gao':    { id: 'hist-niu-gao',    kind: 'power',  zh: '雙鐧破敵', en: 'Twin-Mace Breaker' },
  'hist-yelu-xiuge': { id: 'hist-yelu-xiuge', kind: 'multi',  zh: '契丹鐵騎', en: 'Khitan Iron Horse' },
  'hist-wuzhu':      { id: 'hist-wuzhu',      kind: 'power',  zh: '金兀朮', en: 'Wuzhu of the Jin' },
  'hist-aguda':      { id: 'hist-aguda',      kind: 'power',  zh: '金太祖', en: 'Founder of the Jin' },
  'hist-li-yuanhao': { id: 'hist-li-yuanhao', kind: 'power',  zh: '西夏立國', en: 'Founder of Western Xia' },
  'hist-liu-yu':     { id: 'hist-liu-yu',     kind: 'power',  zh: '氣吞萬里', en: 'Swallow Ten Thousand Li' },
  // 元
  'hist-genghis':    { id: 'hist-genghis',    kind: 'sunder', zh: '一代天驕', en: 'Pride of an Age' },
  'hist-jebe':       { id: 'hist-jebe',       kind: 'volley', zh: '蒙古神箭', en: 'Arrow of the Steppe' },
  'hist-subutai':    { id: 'hist-subutai',    kind: 'multi',  zh: '長驅萬里', en: 'Ten-Thousand-Li Drive' },
  'hist-muqali':     { id: 'hist-muqali',     kind: 'power',  zh: '太師木華黎', en: 'Grand Preceptor Muqali' },
  'hist-wang-baobao':{ id: 'hist-wang-baobao',kind: 'power',  zh: '元末名將', en: 'Last Champion of the Yuan' },
  // 明清
  'hist-lan-yu':     { id: 'hist-lan-yu',     kind: 'power',  zh: '捕魚兒海', en: 'Triumph at Fish-Lake' },
  'hist-yu-dayou':   { id: 'hist-yu-dayou',   kind: 'power',  zh: '俞家棍法', en: 'Yu-Family Staff' },
  'hist-oboi':       { id: 'hist-oboi',       kind: 'power',  zh: '滿洲第一', en: 'First Warrior of Manchuria' },
  'hist-nurhaci':    { id: 'hist-nurhaci',    kind: 'power',  zh: '七大恨', en: 'Seven Grievances' },
  // ── 千古名將(三續・刺客/女將/胡漢名將)──────────────────────────────────
  // 春秋戰國・刺客
  'hist-jing-ke':    { id: 'hist-jing-ke',    kind: 'feint',  zh: '圖窮匕見', en: 'Dagger in the Map' },
  'hist-yao-li':     { id: 'hist-yao-li',     kind: 'feint',  zh: '斷臂行刺', en: 'The One-Armed Assassin' },
  'hist-xian-zhen':  { id: 'hist-xian-zhen',  kind: 'feint',  zh: '城濮之謀', en: 'Stratagem at Chengpu' },
  'hist-zhao-she':   { id: 'hist-zhao-she',   kind: 'feint',  zh: '閼與之捷', en: 'Triumph at Eyu' },
  'hist-wang-ben':   { id: 'hist-wang-ben',   kind: 'power',  zh: '水灌大梁', en: 'Drown the Capital' },
  'hist-fuchai':     { id: 'hist-fuchai',     kind: 'power',  zh: '吳越爭霸', en: 'Hegemon of Wu' },
  // 秦漢
  'hist-zhang-han':  { id: 'hist-zhang-han',  kind: 'power',  zh: '秦軍最後', en: 'Last Sword of Qin' },
  'hist-zhongli-mei':{ id: 'hist-zhongli-mei',kind: 'power',  zh: '楚之猛將', en: 'Fierce Blade of Chu' },
  'hist-ji-bu':      { id: 'hist-ji-bu',      kind: 'power',  zh: '一諾千金', en: 'A Promise of Gold' },
  'hist-zhou-bo':    { id: 'hist-zhou-bo',    kind: 'power',  zh: '安劉社稷', en: 'Steadier of the Han' },
  'hist-guan-ying':  { id: 'hist-guan-ying',  kind: 'multi',  zh: '騎將追亡', en: 'Cavalry of the Hunt' },
  'hist-cen-peng':   { id: 'hist-cen-peng',   kind: 'power',  zh: '雲台名將', en: 'Hero of the Cloud Terrace' },
  'hist-wu-han':     { id: 'hist-wu-han',     kind: 'power',  zh: '沉勇有謀', en: 'Steady and Bold' },
  'hist-ma-wu':      { id: 'hist-ma-wu',      kind: 'power',  zh: '雲台虎將', en: 'Tiger of the Cloud Terrace' },
  'hist-jia-fu':     { id: 'hist-jia-fu',     kind: 'power',  zh: '常為軍鋒', en: 'Ever the Vanguard' },
  'hist-geng-yan':   { id: 'hist-geng-yan',   kind: 'feint',  zh: '有志竟成', en: 'Where There\'s a Will' },
  'hist-geng-gong':  { id: 'hist-geng-gong',  kind: 'power',  zh: '疏勒孤忠', en: 'Lone Loyalty at Shule' },
  // 魏晉南北朝
  'hist-zhou-chu':   { id: 'hist-zhou-chu',   kind: 'feint',  zh: '除三害', en: 'Slayer of the Three Scourges' },
  'hist-shi-le':     { id: 'hist-shi-le',     kind: 'power',  zh: '奴隸天子', en: 'Slave-Born Emperor' },
  'hist-shi-dakai':  { id: 'hist-shi-dakai',  kind: 'multi',  zh: '翼王破陣', en: 'Wing-King\'s Charge' },
  'hist-liu-yao':    { id: 'hist-liu-yao',    kind: 'power',  zh: '前趙猛主', en: 'Fierce Lord of Former Zhao' },
  'hist-tuoba-gui':  { id: 'hist-tuoba-gui',  kind: 'power',  zh: '北魏立國', en: 'Founder of Northern Wei' },
  'hist-murong-ke':  { id: 'hist-murong-ke',  kind: 'feint',  zh: '十六國第一', en: 'First of the Sixteen Kingdoms' },
  'hist-murong-shaozong':{id:'hist-murong-shaozong',kind:'feint',zh:'渦陽破侯', en: 'Breaker of Hou Jing' },
  'hist-tan-daoji':  { id: 'hist-tan-daoji',  kind: 'feint',  zh: '唱籌量沙', en: 'Counting Sand for Grain' },
  'hist-shen-qingzhi':{id: 'hist-shen-qingzhi',kind:'power',  zh: '草莽出將', en: 'Marsh-Born General' },
  'hist-heba-yue':   { id: 'hist-heba-yue',   kind: 'power',  zh: '關隴雄傑', en: 'Hero of Guanlong' },
  'hist-hou-andu':   { id: 'hist-hou-andu',   kind: 'power',  zh: '陳之虎臣', en: 'Tiger-Vassal of Chen' },
  // 隋唐五代
  'hist-zhang-xutuo':{ id: 'hist-zhang-xutuo',kind: 'power',  zh: '隋之名將', en: 'Champion of Sui' },
  'hist-xue-ju':     { id: 'hist-xue-ju',     kind: 'power',  zh: '西秦霸王', en: 'Conqueror of Western Qin' },
  'hist-cheng-yaojin':{id: 'hist-cheng-yaojin',kind:'power',  zh: '三板斧', en: 'Three Axe-Strokes' },
  'hist-duan-zhixuan':{id: 'hist-duan-zhixuan',kind:'multi',  zh: '驍勇先登', en: 'Bold First-Climber' },
  'hist-geshu-han':  { id: 'hist-geshu-han',  kind: 'power',  zh: '北斗高懸', en: 'High the Northern Dipper' },
  'hist-hun-zhen':   { id: 'hist-hun-zhen',   kind: 'volley', zh: '鐵勒神射', en: 'Tiele Marksman' },
  'hist-li-su':      { id: 'hist-li-su',      kind: 'feint',  zh: '雪夜入蔡', en: 'Snow-Night Raid on Cai' },
  'hist-an-lushan':  { id: 'hist-an-lushan',  kind: 'power',  zh: '范陽起兵', en: 'Revolt at Fanyang' },
  'hist-li-cunxu':   { id: 'hist-li-cunxu',   kind: 'multi',  zh: '李亞子', en: 'The Tiger-Cub Prince' },
  'hist-li-siyuan':  { id: 'hist-li-siyuan',  kind: 'power',  zh: '橫衝都將', en: 'Headlong Vanguard' },
  'hist-zhou-dewei': { id: 'hist-zhou-dewei', kind: 'feint',  zh: '料敵如神', en: 'Reading the Foe' },
  // 楊家將
  'hist-yang-zongbao':{id: 'hist-yang-zongbao',kind:'power',  zh: '少帥承風', en: 'Young Marshal of the Yang' },
  'hist-yang-yanping':{id: 'hist-yang-yanping',kind:'power',  zh: '楊大郎', en: 'Eldest Son of the Yang' },
  'hist-yang-yansi': { id: 'hist-yang-yansi', kind: 'power',  zh: '楊七郎', en: 'Seventh Son of the Yang' },
  // 遼宋金
  'hist-abaoji':     { id: 'hist-abaoji',     kind: 'sunder', zh: '契丹立國', en: 'Founder of the Khitan' },
  'hist-yelu-xiezhen':{id: 'hist-yelu-xiezhen',kind:'multi',  zh: '契丹奇兵', en: 'Khitan Surprise-Strike' },
  'hist-xin-qiji':   { id: 'hist-xin-qiji',   kind: 'feint',  zh: '萬軍擒叛', en: 'Snatched a Traitor from a Host' },
  'hist-liu-qi':     { id: 'hist-liu-qi',     kind: 'power',  zh: '順昌大捷', en: 'Triumph at Shunchang' },
  // 元
  'hist-kublai':     { id: 'hist-kublai',     kind: 'sunder', zh: '混一寰宇', en: 'One Realm Under Heaven' },
  'hist-mongke':     { id: 'hist-mongke',     kind: 'power',  zh: '蒙哥汗', en: 'Great Khan Mongke' },
  'hist-batu':       { id: 'hist-batu',       kind: 'multi',  zh: '長子西征', en: 'The Western Campaign' },
  'hist-bayan':      { id: 'hist-bayan',      kind: 'power',  zh: '滅宋大將', en: 'Conqueror of the Song' },
  // 明清・女將
  'hist-hua-mulan':  { id: 'hist-hua-mulan',  kind: 'multi',  zh: '替父從軍', en: 'In Her Father\'s Place' },
  'hist-fu-hao':     { id: 'hist-fu-hao',     kind: 'volley', zh: '商之女帥', en: 'Warrior-Queen of Shang' },
  'hist-qin-liangyu':{ id: 'hist-qin-liangyu',kind: 'power',  zh: '白桿勁旅', en: 'The White-Staff Brigade' },
  'hist-li-dingguo': { id: 'hist-li-dingguo', kind: 'multi',  zh: '兩蹶名王', en: 'Two Princes Felled' },
  'hist-fu-youde':   { id: 'hist-fu-youde',   kind: 'power',  zh: '七戰七捷', en: 'Seven Battles, Seven Wins' },
  'hist-wu-sangui':  { id: 'hist-wu-sangui',  kind: 'power',  zh: '衝冠一怒', en: 'Fury for a Fair Face' },
  'hist-dorgon':     { id: 'hist-dorgon',     kind: 'power',  zh: '攝政睿王', en: 'The Regent Prince' },
  'hist-bao-chao':   { id: 'hist-bao-chao',   kind: 'power',  zh: '霆軍悍將', en: 'Thunder-Army Brute' },
  'hist-sengge-rinchen':{id:'hist-sengge-rinchen',kind:'volley',zh:'蒙古鐵騎', en: 'Mongol Iron Horse' },
  // ── 三國二線名將(officers.ts)─────────────────────────────────────────────
  'zhang-ren':   { id: 'zhang-ren',   kind: 'volley', zh: '落鳳神射', en: 'Phoenix-Slope Shot' },
  'zhurong':     { id: 'zhurong',     kind: 'volley', zh: '飛刀夫人', en: 'Lady of the Flying Blades' },
  'kebi-neng':   { id: 'kebi-neng',   kind: 'volley', zh: '鮮卑大人', en: 'Khan of the Xianbei' },
  'shamoke':     { id: 'shamoke',     kind: 'volley', zh: '蠻王射鵰', en: 'Hawk-Shooting Savage King' },
  'cao-cao':     { id: 'cao-cao',     kind: 'feint',  zh: '亂世奸雄', en: 'Hero of a Chaotic Age' },
  'lu-meng':     { id: 'lu-meng',     kind: 'feint',  zh: '白衣渡江', en: 'White-Robed Crossing' },
  'sima-shi':    { id: 'sima-shi',    kind: 'feint',  zh: '司馬子元', en: 'Sima Ziyuan' },
  'lu-kang':     { id: 'lu-kang',     kind: 'feint',  zh: '吳之長城', en: 'Great Wall of Wu' },
  'han-sui':     { id: 'han-sui',     kind: 'feint',  zh: '西涼宿將', en: 'Veteran of Xiliang' },
  'wen-qin':     { id: 'wen-qin',     kind: 'power',  zh: '淮南悍將', en: 'Brute of Huainan' },
  'ju-yi':       { id: 'ju-yi',       kind: 'power',  zh: '先登破白馬', en: 'Vanguard at Jieqiao' },
  'fu-qian':     { id: 'fu-qian',     kind: 'power',  zh: '守關死節', en: 'Died Holding the Pass' },
  'chen-dao':    { id: 'chen-dao',    kind: 'power',  zh: '白毦衛士', en: 'White-Plume Guard' },
  'zang-ba':     { id: 'zang-ba',     kind: 'power',  zh: '泰山寇帥', en: 'Chief of the Mount Tai Outlaws' },
  'xu-rong':     { id: 'xu-rong',     kind: 'power',  zh: '涼州悍將', en: 'Brute of Liangzhou' },
  'ma-teng':     { id: 'ma-teng',     kind: 'power',  zh: '西涼之主', en: 'Lord of Xiliang' },
  'le-jin':      { id: 'le-jin',      kind: 'power',  zh: '先登陷陣', en: 'First into the Breach' },
  'guan-suo':    { id: 'guan-suo',    kind: 'multi',  zh: '蜀中三郎', en: 'Third Son of Shu' },
  'chen-wu':     { id: 'chen-wu',     kind: 'power',  zh: '江表虎臣', en: 'Tiger-Vassal of the South' },
  'wang-ping':   { id: 'wang-ping',   kind: 'power',  zh: '無當飛軍', en: 'The Invincible Flying Army' },
  'xu-sheng-wu': { id: 'xu-sheng-wu', kind: 'power',  zh: '江東屏障', en: 'Shield of Jiangdong' },
  'huangfu-song':{ id: 'huangfu-song',kind: 'power',  zh: '平黃巾', en: 'Queller of the Yellow Turbans' },
  'e-huan':      { id: 'e-huan',      kind: 'power',  zh: '方天大戟', en: 'Sky-Halberd Wielder' },
  'zhuge-shang': { id: 'zhuge-shang', kind: 'power',  zh: '綿竹死戰', en: 'Last Stand at Mianzhu' },
  'zhang-yan':   { id: 'zhang-yan',   kind: 'multi',  zh: '黑山飛燕', en: 'Flying Swallow of Black Mountain' },
  'wang-jun':    { id: 'wang-jun',    kind: 'power',  zh: '樓船破吳', en: 'Tower-Ships Break Wu' },
  'tadun':       { id: 'tadun',       kind: 'power',  zh: '烏桓單于', en: 'Khan of the Wuhuan' },
  'qian-zhao':   { id: 'qian-zhao',   kind: 'power',  zh: '北疆良將', en: 'Warden of the North' },
  'liu-feng':    { id: 'liu-feng',    kind: 'power',  zh: '副軍中郎', en: 'Deputy Commandant' },
  'jiang-qin':   { id: 'jiang-qin',   kind: 'power',  zh: '江東宿將', en: 'Veteran of Jiangdong' },
  'he-qi':       { id: 'he-qi',       kind: 'power',  zh: '平定山越', en: 'Pacifier of the Shanyue' },
  'bao-sanniang':{ id: 'bao-sanniang',kind: 'multi',  zh: '鮑家女將', en: 'Lady-General of the Bao' },
  'guan-yinping':{ id: 'guan-yinping',kind: 'multi',  zh: '關門虎女', en: 'Tiger-Daughter of Guan' },
  'pang-hui':    { id: 'pang-hui',    kind: 'power',  zh: '為父復仇', en: 'Avenger of his Father' },
  // ── 千古名將(四續・春秋至明清,war 84-85)──────────────────────────────
  'hist-zu-ti':         { id: 'hist-zu-ti',         kind: 'feint',  zh: '中流擊楫', en: 'Oath on the River' },
  'hist-zhou-yafu':     { id: 'hist-zhou-yafu',     kind: 'feint',  zh: '細柳治軍', en: 'Iron Camp of Xiliu' },
  'hist-zheng-chenggong':{id:'hist-zheng-chenggong',kind:'power',   zh: '收復台灣', en: 'Reclaimer of Taiwan' },
  'hist-zhao-wuling':   { id: 'hist-zhao-wuling',   kind: 'feint',  zh: '胡服騎射', en: 'Nomad Dress and Mounted Archery' },
  'hist-zhao-chongguo': { id: 'hist-zhao-chongguo', kind: 'feint',  zh: '老成持重', en: 'The Steady Veteran' },
  'hist-yuwen-yong':    { id: 'hist-yuwen-yong',    kind: 'power',  zh: '周武滅齊', en: 'Wu of Zhou Conquers Qi' },
  'hist-yuwen-tai':     { id: 'hist-yuwen-tai',     kind: 'feint',  zh: '西魏柱石', en: 'Pillar of Western Wei' },
  'hist-yue-yang':      { id: 'hist-yue-yang',      kind: 'power',  zh: '伐取中山', en: 'Conqueror of Zhongshan' },
  'hist-yongle':        { id: 'hist-yongle',        kind: 'power',  zh: '永樂大帝', en: 'The Yongle Emperor' },
  'hist-yelu-deguang':  { id: 'hist-yelu-deguang',  kind: 'power',  zh: '遼之雄主', en: 'Mighty Lord of Liao' },
  'hist-yang-su':       { id: 'hist-yang-su',       kind: 'power',  zh: '越國名將', en: 'Champion of the Yue Dukedom' },
  'hist-yang-wenguang': { id: 'hist-yang-wenguang', kind: 'power',  zh: '楊門後繼', en: 'Heir of the Yang' },
  'hist-xie-xuan':      { id: 'hist-xie-xuan',      kind: 'feint',  zh: '淝水大捷', en: 'Triumph at the Fei River' },
  'hist-xiang-liang':   { id: 'hist-xiang-liang',   kind: 'power',  zh: '江東起兵', en: 'Rising of the East' },
  'hist-wu-jie':        { id: 'hist-wu-jie',        kind: 'power',  zh: '和尚原捷', en: 'Triumph at Heshangyuan' },
  'hist-wanyan-liang':  { id: 'hist-wanyan-liang',  kind: 'power',  zh: '海陵伐宋', en: 'The Hailing Campaign' },
  'hist-wang-jian-song':{ id: 'hist-wang-jian-song',kind: 'feint',  zh: '釣魚死守', en: 'Unbroken at Fishing Town' },
  'hist-sun-chuanting': { id: 'hist-sun-chuanting', kind: 'power',  zh: '傳庭死明', en: 'With Him Falls the Ming' },
  'hist-shi-siming':    { id: 'hist-shi-siming',    kind: 'power',  zh: '安史驍將', en: 'Fierce Rebel of An-Shi' },
  'hist-shi-lang':      { id: 'hist-shi-lang',      kind: 'power',  zh: '平台水師', en: 'Admiral of the Taiwan Strait' },
  'hist-pang-juan':     { id: 'hist-pang-juan',     kind: 'feint',  zh: '馬陵之謀', en: 'The Maling Gambit' },
  'hist-mu-ying':       { id: 'hist-mu-ying',       kind: 'power',  zh: '沐王鎮滇', en: 'Warden of Yunnan' },
  'hist-murong-huang':  { id: 'hist-murong-huang',  kind: 'power',  zh: '前燕立國', en: 'Founder of Former Yan' },
  // ── 三國三線(officers.ts,war 75-79)──────────────────────────────────────
  'yuan-shao':   { id: 'yuan-shao',   kind: 'feint',  zh: '四世三公', en: 'Four Generations of Ministers' },
  'zhuge-liang': { id: 'zhuge-liang', kind: 'feint',  zh: '臥龍之謀', en: 'Stratagem of the Sleeping Dragon' },
  'zhuge-zhan':  { id: 'zhuge-zhan',  kind: 'power',  zh: '綿竹忠烈', en: 'Loyal Blood at Mianzhu' },
  'lady-sun':    { id: 'lady-sun',    kind: 'volley', zh: '弓腰之姬', en: 'The Bow-Waisted Lady' },
  'xing-cai':    { id: 'xing-cai',    kind: 'multi',  zh: '張門虎女', en: 'Tiger-Daughter of Zhang' },
  'zhu-jun':     { id: 'zhu-jun',     kind: 'power',  zh: '討賊名將', en: 'Bandit-Quelling Champion' },
  'zhang-yi':    { id: 'zhang-yi',    kind: 'power',  zh: '平定南中', en: 'Pacifier of the South' },
  'zhang-ni':    { id: 'zhang-ni',    kind: 'power',  zh: '蜀漢宿將', en: 'Veteran of Shu-Han' },
  'wu-yi':       { id: 'wu-yi',       kind: 'power',  zh: '國舅虎臣', en: 'Tiger-Vassal of the Realm' },
  'sun-li':      { id: 'sun-li',      kind: 'power',  zh: '剛斷之將', en: 'The Resolute General' },
  'shi-bao':     { id: 'shi-bao',     kind: 'power',  zh: '晉之名將', en: 'Champion of Jin' },
  'ma-zhong':    { id: 'ma-zhong',    kind: 'power',  zh: '平蠻良將', en: 'Tamer of the Frontier' },
  'huo-jun':     { id: 'huo-jun',     kind: 'power',  zh: '葭萌死守', en: 'Held Jiameng to the Last' },
  'hu-cheer':    { id: 'hu-cheer',    kind: 'feint',  zh: '盜戟夜行', en: 'The Halberd-Thief' },
  'guanqiu-jian':{ id: 'guanqiu-jian',kind: 'power',  zh: '淮南舉義', en: 'Rising at Huainan' },
  'guan-hai':    { id: 'guan-hai',    kind: 'power',  zh: '黃巾渠帥', en: 'Yellow-Turban Chieftain' },
  'gongsun-du':  { id: 'gongsun-du',  kind: 'power',  zh: '遼東之主', en: 'Lord of Liaodong' },
  'cao-chun':    { id: 'cao-chun',    kind: 'multi',  zh: '虎豹騎督', en: 'Captain of the Tiger Cavalry' },
  'wu-anguo':    { id: 'wu-anguo',    kind: 'power',  zh: '長安猛將', en: 'Brute of Chang\'an' },
  'guo-si':      { id: 'guo-si',      kind: 'power',  zh: '西涼悍卒', en: 'Brute-Soldier of Xiliang' },
  'feng-xi':     { id: 'feng-xi',     kind: 'power',  zh: '夷陵先鋒', en: 'Vanguard at Yiling' },
  'liu-pan':     { id: 'liu-pan',     kind: 'power',  zh: '荊州虎將', en: 'Tiger of Jingzhou' },
  'sun-huan':    { id: 'sun-huan',    kind: 'power',  zh: '宗室少將', en: 'Young Lord of the Clan' },
  'budugen':     { id: 'budugen',     kind: 'volley', zh: '鮮卑騎射', en: 'Xianbei Horse-Archer' },
  // ── 千古名將(五續・war 82-83)──────────────────────────────────────────
  'hist-zhang-xun':     { id: 'hist-zhang-xun',     kind: 'power',  zh: '睢陽死守', en: 'Unbroken at Suiyang' },
  'hist-zhu-wen':       { id: 'hist-zhu-wen',       kind: 'power',  zh: '後梁太祖', en: 'Founder of Later Liang' },
  'hist-li-zicheng':    { id: 'hist-li-zicheng',    kind: 'power',  zh: '闖王破京', en: 'The Dashing King' },
  'hist-li-xiucheng':   { id: 'hist-li-xiucheng',   kind: 'multi',  zh: '太平忠王', en: 'Loyal King of Taiping' },
  'hist-nian-gengyao':  { id: 'hist-nian-gengyao',  kind: 'power',  zh: '年大將軍', en: 'Grand General Nian' },
  'hist-huan-wen':      { id: 'hist-huan-wen',      kind: 'power',  zh: '氣概英雄', en: 'A Hero\'s Bearing' },
  'hist-guo-wei':       { id: 'hist-guo-wei',       kind: 'power',  zh: '後周太祖', en: 'Founder of Later Zhou' },
  'hist-tian-ji':       { id: 'hist-tian-ji',       kind: 'feint',  zh: '田忌賽馬', en: 'Tian Ji\'s Race' },
  'hist-xiang-zhuang':  { id: 'hist-xiang-zhuang',  kind: 'feint',  zh: '鴻門舞劍', en: 'Sword-Dance at Hongmen' },
  'hist-princess-pingyang':{id:'hist-princess-pingyang',kind:'volley',zh:'娘子軍', en: 'The Lady\'s Army' },
  'hist-wei-gao':       { id: 'hist-wei-gao',       kind: 'power',  zh: '鎮蜀名臣', en: 'Warden of Shu' },
  'hist-tang-he':       { id: 'hist-tang-he',       kind: 'power',  zh: '明之元勳', en: 'Founding Hero of Ming' },
  'hist-wang-yue':      { id: 'hist-wang-yue',      kind: 'feint',  zh: '威寧海子', en: 'Triumph at Weining' },
  'hist-qutu-tong':     { id: 'hist-qutu-tong',     kind: 'power',  zh: '隋唐忠將', en: 'Loyal Blade of Two Courts' },
  'hist-meng-wu':       { id: 'hist-meng-wu',       kind: 'power',  zh: '滅楚之師', en: 'Conqueror of Chu' },
  'hist-li-xiaogong':   { id: 'hist-li-xiaogong',   kind: 'power',  zh: '河間郡王', en: 'Prince of Hejian' },
  'hist-kuang-zhang':   { id: 'hist-kuang-zhang',   kind: 'feint',  zh: '垂沙之勝', en: 'Triumph at Chuisha' },
  'hist-pang-xuan':     { id: 'hist-pang-xuan',     kind: 'feint',  zh: '趙之良將', en: 'Fine General of Zhao' },
  'hist-sima-cuo':      { id: 'hist-sima-cuo',      kind: 'feint',  zh: '司馬錯滅蜀', en: 'Conqueror of Shu' },
  'hist-wang-dun':      { id: 'hist-wang-dun',      kind: 'power',  zh: '東晉強藩', en: 'Warlord of Eastern Jin' },
  'hist-zhang-hongfan': { id: 'hist-zhang-hongfan', kind: 'power',  zh: '崖山滅宋', en: 'The Fall of Yashan' },
  'hist-yu-jie':        { id: 'hist-yu-jie',        kind: 'feint',  zh: '蜀口屏障', en: 'Shield of the Shu Passes' },
  'hist-zhai-rang':     { id: 'hist-zhai-rang',     kind: 'power',  zh: '瓦崗首領', en: 'Founder of the Wagang' },
  'hist-yang-xingmi':   { id: 'hist-yang-xingmi',   kind: 'power',  zh: '十國吳主', en: 'Founder of Wu' },
  // ── 三國四線(officers.ts,war 70-74)──────────────────────────────────────
  'tian-yu':     { id: 'tian-yu',     kind: 'power',  zh: '魏之邊將', en: 'Frontier Champion of Wei' },
  'zhuge-ke':    { id: 'zhuge-ke',    kind: 'feint',  zh: '東興大捷', en: 'Triumph at Dongxing' },
  'zhou-fang':   { id: 'zhou-fang',   kind: 'feint',  zh: '斷髮賺曹', en: 'The Severed-Hair Ruse' },
  'sima-zhou':   { id: 'sima-zhou',   kind: 'power',  zh: '晉室宗親', en: 'Prince of the Jin' },
  'duosi':       { id: 'duosi',       kind: 'power',  zh: '禿龍洞主', en: 'Lord of the Bald-Dragon Cave' },
  'zhang-yang':  { id: 'zhang-yang',  kind: 'power',  zh: '河內太守', en: 'Warden of Henei' },
  'qin-lang':    { id: 'qin-lang',    kind: 'power',  zh: '驍騎將軍', en: 'General of Valiant Cavalry' },
  'chen-shi':    { id: 'chen-shi',    kind: 'power',  zh: '蜀漢戰將', en: 'War-General of Shu-Han' },
  'shen-dan':    { id: 'shen-dan',    kind: 'power',  zh: '上庸守將', en: 'Holder of Shangyong' },
  'xiahou-wei':  { id: 'xiahou-wei',  kind: 'power',  zh: '夏侯虎裔', en: 'Tiger-Scion of the Xiahou' },
  'wu-lan':      { id: 'wu-lan',      kind: 'power',  zh: '蜀中先鋒', en: 'Vanguard of Shu' },
  'zhang-ji':    { id: 'zhang-ji',    kind: 'power',  zh: '西涼舊部', en: 'Veteran of Xiliang' },
  // ── 千古名將(六續・war 80-81)──────────────────────────────────────────
  'hist-zhu-yuanzhang':{ id: 'hist-zhu-yuanzhang',kind: 'sunder', zh: '大明開國', en: 'Founder of the Great Ming' },
  'hist-wang-xuance':  { id: 'hist-wang-xuance',  kind: 'feint',  zh: '一人滅國', en: 'One Man Topples a Kingdom' },
  'hist-wei-rui':      { id: 'hist-wei-rui',      kind: 'feint',  zh: '白袍儒將', en: 'The White-Robed Scholar-General' },
  'hist-wei-xiaokuan': { id: 'hist-wei-xiaokuan', kind: 'power',  zh: '玉璧死守', en: 'Unbroken at Yubi' },
  'hist-tian-heng':    { id: 'hist-tian-heng',    kind: 'power',  zh: '田橫五百', en: 'The Five Hundred of Tian Heng' },
  'hist-tao-kan':      { id: 'hist-tao-kan',      kind: 'power',  zh: '運甓勵志', en: 'The Brick-Hauling Resolve' },
  'hist-xiao-daocheng':{ id: 'hist-xiao-daocheng',kind: 'power',  zh: '齊高皇帝', en: 'Founder of Southern Qi' },
  'hist-shi-tianze':   { id: 'hist-shi-tianze',   kind: 'power',  zh: '元之柱石', en: 'Pillar of the Yuan' },
  'hist-yuan-chonghuan':{id: 'hist-yuan-chonghuan',kind:'power',  zh: '寧遠大捷', en: 'Triumph at Ningyuan' },
  'hist-zhang-shijie': { id: 'hist-zhang-shijie', kind: 'power',  zh: '崖山忠魂', en: 'Loyal Soul of Yashan' },
  'hist-yang-xiuqing':{ id: 'hist-yang-xiuqing',  kind: 'feint',  zh: '太平東王', en: 'East-King of the Taiping' },
  'hist-zhibo':        { id: 'hist-zhibo',        kind: 'power',  zh: '智氏之強', en: 'Might of the Zhi Clan' },
  'hist-zilu':         { id: 'hist-zilu',         kind: 'power',  zh: '孔門之勇', en: 'Bravest of Confucius\'s Students' },
  'hist-wang-li':      { id: 'hist-wang-li',      kind: 'power',  zh: '秦軍上將', en: 'High General of Qin' },
  'hist-su-jiao':      { id: 'hist-su-jiao',      kind: 'power',  zh: '鉅鹿秦將', en: 'Qin Commander at Julu' },
  'hist-tian-chengsi': { id: 'hist-tian-chengsi', kind: 'power',  zh: '河北藩鎮', en: 'Warlord of Hebei' },
  'hist-zheng-zhilong':{ id: 'hist-zheng-zhilong',kind: 'power',  zh: '海上霸主', en: 'Overlord of the Seas' },
  'hist-tan-lun':      { id: 'hist-tan-lun',      kind: 'feint',  zh: '抗倭名臣', en: 'Scourge of the Pirates' },
  'hist-su-jun':       { id: 'hist-su-jun',       kind: 'power',  zh: '驍勇難制', en: 'Fierce and Unruly' },
  'hist-yue-cheng':    { id: 'hist-yue-cheng',    kind: 'power',  zh: '趙之良將', en: 'Fine General of Zhao' },
  'hist-toghto':       { id: 'hist-toghto',       kind: 'feint',  zh: '脫脫修史', en: 'The Chronicler-Chancellor' },
  'hist-tuoba-si':     { id: 'hist-tuoba-si',     kind: 'power',  zh: '北魏明元', en: 'Mingyuan of Northern Wei' },
  'hist-wang-wujun':   { id: 'hist-wang-wujun',   kind: 'power',  zh: '成德節度', en: 'Military Governor of Chengde' },
  'hist-zhao-xiangzi': { id: 'hist-zhao-xiangzi', kind: 'feint',  zh: '滅智分晉', en: 'Splitter of Jin' },
  'hist-zhao-jianzi':  { id: 'hist-zhao-jianzi',  kind: 'power',  zh: '趙氏奠基', en: 'Founder of the Zhao' },
  'hist-zhou-fashang': { id: 'hist-zhou-fashang', kind: 'power',  zh: '隋之水師', en: 'Admiral of the Sui' },
  'hist-xiang-rong':   { id: 'hist-xiang-rong',   kind: 'power',  zh: '江南大營', en: 'Commander of the Southern Camp' },
  'hist-yexien-temur': { id: 'hist-yexien-temur', kind: 'power',  zh: '元末名將', en: 'Late-Yuan Champion' },
  // ── 千古名將(七續・war 78,兵聖名帥)──────────────────────────────────
  'hist-sun-wu':       { id: 'hist-sun-wu',       kind: 'feint',  zh: '孫子兵法', en: 'The Art of War' },
  'hist-sima-rangju':  { id: 'hist-sima-rangju',  kind: 'feint',  zh: '司馬兵法', en: 'The Sima Methods' },
  'hist-zuo-zongtang': { id: 'hist-zuo-zongtang', kind: 'power',  zh: '抬棺西征', en: 'The Coffin-Borne March West' },
  'hist-zong-ze':      { id: 'hist-zong-ze',      kind: 'power',  zh: '過河三呼', en: 'Cross the River!' },
  'hist-li-yuan':      { id: 'hist-li-yuan',      kind: 'power',  zh: '太原起兵', en: 'Rising at Taiyuan' },
  'hist-wang-shichong':{ id: 'hist-wang-shichong',kind: 'feint',  zh: '洛陽梟雄', en: 'The Luoyang Schemer' },
  'hist-zhang-shicheng':{id:'hist-zhang-shicheng',kind: 'power',  zh: '吳王據蘇', en: 'King of Wu at Suzhou' },
  'hist-xiong-tingbi': { id: 'hist-xiong-tingbi', kind: 'power',  zh: '經略遼東', en: 'Warden of Liaodong' },
  'hist-huang-xing':   { id: 'hist-huang-xing',   kind: 'power',  zh: '開國元勳', en: 'Founding Revolutionary' },
  'hist-qin-xiaogong': { id: 'hist-qin-xiaogong', kind: 'feint',  zh: '商鞅變法', en: 'The Reforms of Shang Yang' },
  'hist-qin-huiwen':   { id: 'hist-qin-huiwen',   kind: 'feint',  zh: '連橫破縱', en: 'Break the Alliance' },
  'hist-yang-xuangan': { id: 'hist-yang-xuangan', kind: 'power',  zh: '黎陽舉兵', en: 'Revolt at Liyang' },
  'hist-yin-kaishan':  { id: 'hist-yin-kaishan',  kind: 'power',  zh: '凌煙功臣', en: 'Hero of the Lingyan Gallery' },
  'hist-sun-kewang':   { id: 'hist-sun-kewang',   kind: 'power',  zh: '大西驍將', en: 'Fierce Lord of the Daxi' },
  'hist-yu-yi':        { id: 'hist-yu-yi',        kind: 'power',  zh: '北伐之志', en: 'Resolve to March North' },
  'hist-li-guangli':   { id: 'hist-li-guangli',   kind: 'power',  zh: '貳師伐宛', en: 'The Dayuan Campaign' },
  'hist-zheng-ji':     { id: 'hist-zheng-ji',     kind: 'power',  zh: '西域都護', en: 'Protector of the Western Regions' },
  'hist-yang-duanhe':  { id: 'hist-yang-duanhe',  kind: 'power',  zh: '滅趙之師', en: 'Conqueror of Zhao' },
  // ── 補齊:所有 war≥81 之名將(徹底掃描遺漏)──────────────────────────────
  // 三國遺漏
  'zhou-chu':    { id: 'zhou-chu',    kind: 'feint',  zh: '周處除害', en: 'Slayer of the Three Scourges' },
  'wang-shuang-wei':{id:'wang-shuang-wei',kind:'power',zh: '魏之王雙', en: 'Wang Shuang of Wei' },
  'sun-yi':      { id: 'sun-yi',      kind: 'power',  zh: '孫氏猛虎', en: 'Tiger of the Sun Clan' },
  'pang-de-ye':  { id: 'pang-de-ye',  kind: 'power',  zh: '西涼閻行', en: 'Yan Xing of Xiliang' },
  'fu-qi':       { id: 'fu-qi',       kind: 'power',  zh: '守關死節', en: 'Died Holding the Pass' },
  'zhu-yi-wu':   { id: 'zhu-yi-wu',   kind: 'power',  zh: '吳之名將', en: 'Champion of Wu' },
  'mangya-chang':{ id: 'mangya-chang',kind: 'power',  zh: '南蠻先鋒', en: 'Vanguard of the Nanman' },
  // 金・蒙古
  'hist-zonghan':      { id: 'hist-zonghan',      kind: 'power',  zh: '粘罕滅宋', en: 'Nianhan, Conqueror of Song' },
  'hist-wanyan-loushi':{ id: 'hist-wanyan-loushi',kind: 'power',  zh: '金之先鋒', en: 'Vanguard of the Jin' },
  'hist-chenheshang':  { id: 'hist-chenheshang',  kind: 'power',  zh: '忠孝之軍', en: 'The Loyal-Filial Army' },
  'hist-zongwang':     { id: 'hist-zongwang',     kind: 'multi',  zh: '斡離不', en: 'Wolibu of the Jin' },
  'hist-loufan':       { id: 'hist-loufan',       kind: 'volley', zh: '婁煩神射', en: 'Loufan Marksman' },
  'hist-xiao-talin':   { id: 'hist-xiao-talin',   kind: 'volley', zh: '澶淵中箭', en: 'The Shaft at Chanyuan' },
  'hist-tolui':        { id: 'hist-tolui',        kind: 'multi',  zh: '監國拖雷', en: 'Tolui the Regent' },
  'hist-jochi':        { id: 'hist-jochi',        kind: 'multi',  zh: '長子朮赤', en: 'Jochi the Eldest' },
  'hist-chagatai':     { id: 'hist-chagatai',     kind: 'power',  zh: '察合台汗', en: 'Khan Chagatai' },
  'hist-hulagu':       { id: 'hist-hulagu',       kind: 'power',  zh: '西征滅國', en: 'The Ilkhan\'s Conquest' },
  'hist-aju':          { id: 'hist-aju',          kind: 'power',  zh: '滅宋先鋒', en: 'Vanguard of the Song\'s Fall' },
  'hist-kaidu':        { id: 'hist-kaidu',        kind: 'multi',  zh: '海都之亂', en: 'The Revolt of Kaidu' },
  'hist-jamuqa':       { id: 'hist-jamuqa',       kind: 'feint',  zh: '札木合', en: 'Jamuqa the Cunning' },
  'hist-yesugei':      { id: 'hist-yesugei',      kind: 'power',  zh: '也速該勇', en: 'Valor of Yesugei' },
  'hist-dodo':         { id: 'hist-dodo',         kind: 'power',  zh: '豫親王', en: 'Prince Dodo' },
  'hist-ajige':        { id: 'hist-ajige',        kind: 'power',  zh: '英親王', en: 'Prince Ajige' },
  'hist-hong-taiji':   { id: 'hist-hong-taiji',   kind: 'sunder', zh: '清太宗', en: 'Hong Taiji of the Qing' },
  // 清・近代名將
  'hist-zhaohui':      { id: 'hist-zhaohui',      kind: 'power',  zh: '定邊將軍', en: 'Pacifier of the Frontier' },
  'hist-hailancha':    { id: 'hist-hailancha',    kind: 'volley', zh: '索倫神射', en: 'Solon Marksman' },
  'hist-fukanggan':    { id: 'hist-fukanggan',    kind: 'power',  zh: '福康安', en: 'Fuk\'anggan' },
  'hist-agui':         { id: 'hist-agui',         kind: 'power',  zh: '阿桂大將', en: 'Grand General Agui' },
  'hist-duolong-a':    { id: 'hist-duolong-a',    kind: 'power',  zh: '多隆阿', en: 'Dorong\'a' },
  'hist-nie-shicheng': { id: 'hist-nie-shicheng', kind: 'power',  zh: '武毅殉國', en: 'Martyr of Wuyi' },
  'hist-feng-zicai':   { id: 'hist-feng-zicai',   kind: 'power',  zh: '鎮南關大捷', en: 'Triumph at Zhennan Pass' },
  'hist-ma-yukun':     { id: 'hist-ma-yukun',     kind: 'power',  zh: '甲午宿將', en: 'Veteran of 1894' },
  'hist-liu-yongfu':   { id: 'hist-liu-yongfu',   kind: 'power',  zh: '黑旗軍', en: 'The Black Flag Army' },
  'hist-liu-jintang':  { id: 'hist-liu-jintang',  kind: 'power',  zh: '收復新疆', en: 'Reclaimer of Xinjiang' },
  'hist-lin-wencha':   { id: 'hist-lin-wencha',   kind: 'power',  zh: '台灣名將', en: 'Champion of Taiwan' },
  'hist-cai-e':        { id: 'hist-cai-e',        kind: 'feint',  zh: '護國討袁', en: 'The National-Protection War' },
  'hist-li-chengliang':{ id: 'hist-li-chengliang',kind: 'power',  zh: '遼東總兵', en: 'Commander of Liaodong' },
  // 明
  'hist-zhang-xianzhong':{id:'hist-zhang-xianzhong',kind:'power', zh: '大西梟雄', en: 'The Daxi Warlord' },
  'hist-lu-xiangsheng':{ id: 'hist-lu-xiangsheng',kind: 'power',  zh: '盧公殉國', en: 'Lu the Martyr' },
  'hist-chen-youliang':{ id: 'hist-chen-youliang',kind: 'sunder', zh: '陳漢之主', en: 'Lord of Chen-Han' },
  'hist-li-wenzhong':  { id: 'hist-li-wenzhong',  kind: 'power',  zh: '明開國甥', en: 'Founding Nephew of Ming' },
  'hist-feng-sheng':   { id: 'hist-feng-sheng',   kind: 'power',  zh: '宋國公', en: 'Duke of Song' },
  'hist-deng-yu-ming': { id: 'hist-deng-yu-ming', kind: 'power',  zh: '衛國公', en: 'Duke of Wei' },
  // 隋唐五代
  'hist-li-ji':        { id: 'hist-li-ji',        kind: 'feint',  zh: '英公李勣', en: 'Li Ji, Duke of Ying' },
  'hist-li-guangbi':   { id: 'hist-li-guangbi',   kind: 'feint',  zh: '平亂首功', en: 'First in Quelling the Revolt' },
  'hist-gao-xianzhi':  { id: 'hist-gao-xianzhi',  kind: 'power',  zh: '怛羅斯', en: 'The Talas Campaign' },
  'hist-hou-junji':    { id: 'hist-hou-junji',    kind: 'power',  zh: '滅高昌', en: 'Conqueror of Gaochang' },
  'hist-he-ruobi':     { id: 'hist-he-ruobi',     kind: 'feint',  zh: '渡江滅陳', en: 'Cross and Conquer Chen' },
  'hist-lai-huer':     { id: 'hist-lai-huer',     kind: 'power',  zh: '隋之水師', en: 'Admiral of the Sui' },
  'hist-luo-yi':       { id: 'hist-luo-yi',       kind: 'power',  zh: '幽州羅藝', en: 'Luo Yi of Youzhou' },
  'hist-liu-heita':    { id: 'hist-liu-heita',    kind: 'power',  zh: '河北梟雄', en: 'Warlord of Hebei' },
  'hist-du-fuwei':     { id: 'hist-du-fuwei',     kind: 'power',  zh: '江淮霸主', en: 'Overlord of the Huai' },
  'hist-song-jingang': { id: 'hist-song-jingang', kind: 'power',  zh: '宋金剛勇', en: 'Valor of Song Jingang' },
  'hist-huang-chao':   { id: 'hist-huang-chao',   kind: 'sunder', zh: '沖天大將', en: 'The Heaven-Storming General' },
  'hist-ge-congzhou':  { id: 'hist-ge-congzhou',  kind: 'power',  zh: '梁之名將', en: 'Champion of Liang' },
  'hist-chai-rong':    { id: 'hist-chai-rong',    kind: 'sunder', zh: '周世宗', en: 'Shizong of Later Zhou' },
  'hist-gao-huaide':   { id: 'hist-gao-huaide',   kind: 'power',  zh: '高家將', en: 'Champion of the Gao' },
  'hist-shi-shouxin':  { id: 'hist-shi-shouxin',  kind: 'power',  zh: '義社元勳', en: 'Brother of the Sworn Ten' },
  'hist-zhe-deyi':     { id: 'hist-zhe-deyi',     kind: 'power',  zh: '折家軍', en: 'The Zhe-Family Army' },
  'hist-zong-luohou':  { id: 'hist-zong-luohou',  kind: 'power',  zh: '西秦驍將', en: 'Brute of Western Qin' },
  // 兩宋
  'hist-cao-bin':      { id: 'hist-cao-bin',      kind: 'feint',  zh: '不殺降城', en: 'The Bloodless Conquest' },
  'hist-meng-gong':    { id: 'hist-meng-gong',    kind: 'feint',  zh: '機動防禦', en: 'Master of Mobile Defence' },
  'hist-liang-hongyu': { id: 'hist-liang-hongyu', kind: 'multi',  zh: '擂鼓退金', en: 'War-Drums Against the Jin' },
  'hist-zhang-jun':    { id: 'hist-zhang-jun',    kind: 'power',  zh: '中興四將', en: 'One of the Four Restorers' },
  'hist-gao-qiong':    { id: 'hist-gao-qiong',    kind: 'power',  zh: '澶淵宿將', en: 'Veteran of Chanyuan' },
  'hist-wang-shao':    { id: 'hist-wang-shao',    kind: 'feint',  zh: '熙河開邊', en: 'Opener of the Xihe Frontier' },
  // 北朝・十六國
  'hist-gao-huan':     { id: 'hist-gao-huan',     kind: 'power',  zh: '東魏霸主', en: 'Lord of Eastern Wei' },
  'hist-dugu-xin':     { id: 'hist-dugu-xin',     kind: 'feint',  zh: '獨孤如願', en: 'Dugu Xin the Handsome' },
  'hist-duan-shao':    { id: 'hist-duan-shao',    kind: 'power',  zh: '北齊名將', en: 'Champion of Northern Qi' },
  'hist-murong-jun':   { id: 'hist-murong-jun',   kind: 'power',  zh: '前燕之主', en: 'Lord of Former Yan' },
  'hist-murong-wei':   { id: 'hist-murong-wei',   kind: 'power',  zh: '慕容廆', en: 'Murong Hui' },
  'hist-liu-yuan':     { id: 'hist-liu-yuan',     kind: 'power',  zh: '漢趙立國', en: 'Founder of Han-Zhao' },
  'hist-liu-laozhi':   { id: 'hist-liu-laozhi',   kind: 'power',  zh: '北府舊將', en: 'Old Hand of the Beifu' },
  'hist-fu-xiong':     { id: 'hist-fu-xiong',     kind: 'power',  zh: '前秦宗室', en: 'Prince of Former Qin' },
  'hist-zhu-lingshi':  { id: 'hist-zhu-lingshi',  kind: 'power',  zh: '伐蜀名將', en: 'Conqueror of Shu' },
  'hist-chen-baxian':  { id: 'hist-chen-baxian',  kind: 'sunder', zh: '陳武帝', en: 'Founder of the Chen' },
  'hist-wu-mingche':   { id: 'hist-wu-mingche',   kind: 'power',  zh: '南陳柱石', en: 'Pillar of Southern Chen' },
  'hist-zhang-zhaoda': { id: 'hist-zhang-zhaoda', kind: 'power',  zh: '陳之名將', en: 'Champion of Chen' },
  'hist-wang-sengbian':{ id: 'hist-wang-sengbian',kind: 'feint',  zh: '平定侯景', en: 'Queller of Hou Jing' },
  'hist-zhou-wenyu':   { id: 'hist-zhou-wenyu',   kind: 'power',  zh: '陳之虎將', en: 'Tiger of the Chen' },
  'hist-yuwen-shenju': { id: 'hist-yuwen-shenju', kind: 'power',  zh: '北周名將', en: 'Champion of Northern Zhou' },
  // 秦漢
  'hist-zhou-wuwang':  { id: 'hist-zhou-wuwang',  kind: 'sunder', zh: '武王伐紂', en: 'King Wu Smites Zhou' },
  'hist-cao-can':      { id: 'hist-cao-can',      kind: 'power',  zh: '蕭規曹隨', en: 'Heir to Xiao\'s Order' },
  'hist-peng-yue':     { id: 'hist-peng-yue',     kind: 'feint',  zh: '游擊鼻祖', en: 'Father of Guerrilla War' },
  'hist-chen-tang':    { id: 'hist-chen-tang',    kind: 'power',  zh: '雖遠必誅', en: 'However Far, We Strike' },
  'hist-feng-yi':      { id: 'hist-feng-yi',      kind: 'feint',  zh: '大樹將軍', en: 'The Great-Tree General' },
  'hist-gai-yan':      { id: 'hist-gai-yan',      kind: 'power',  zh: '雲台之列', en: 'Of the Cloud Terrace' },
  'hist-yao-qi':       { id: 'hist-yao-qi',       kind: 'power',  zh: '雲台名將', en: 'Hero of the Cloud Terrace' },
  'hist-li-xin':       { id: 'hist-li-xin',       kind: 'power',  zh: '少壯李信', en: 'Young and Bold Li Xin' },
  'hist-qin-kai':      { id: 'hist-qin-kai',      kind: 'feint',  zh: '卻胡千里', en: 'Drove the Nomads a Thousand Li' },
  'hist-fan-yuqi':     { id: 'hist-fan-yuqi',     kind: 'power',  zh: '樊於期', en: 'Fan Wuji' },
  // 春秋戰國
  'hist-helu':         { id: 'hist-helu',         kind: 'feint',  zh: '闔閭破楚', en: 'Helu Breaks Chu' },
  'hist-chu-zhuang-wang':{id:'hist-chu-zhuang-wang',kind:'sunder',zh: '問鼎中原', en: 'Eyeing the Cauldrons' },
  'hist-qin-wuwang':   { id: 'hist-qin-wuwang',   kind: 'power',  zh: '舉鼎絕臏', en: 'The Cauldron-Lifter' },
  'hist-ziyu-chu':     { id: 'hist-ziyu-chu',     kind: 'power',  zh: '楚之子玉', en: 'Ziyu of Chu' },
  'hist-dou-yuejiao':  { id: 'hist-dou-yuejiao',  kind: 'volley', zh: '若敖神射', en: 'Ruo\'ao Marksman' },
  'hist-zhuang-qiao':  { id: 'hist-zhuang-qiao',  kind: 'power',  zh: '莊蹻入滇', en: 'Zhuang Qiao Enters Dian' },
  'hist-meng-ao':      { id: 'hist-meng-ao',      kind: 'power',  zh: '蒙驁伐魏', en: 'Meng Ao Strikes Wei' },
  'hist-gongsun-jie':  { id: 'hist-gongsun-jie',  kind: 'power',  zh: '二桃之勇', en: 'Of the Two-Peach Tale' },
  'hist-tian-kaijiang':{ id: 'hist-tian-kaijiang',kind: 'power',  zh: '齊之勇士', en: 'Champion of Qi' },
  'hist-heba-sheng':   { id: 'hist-heba-sheng',   kind: 'power',  zh: '關隴名將', en: 'Champion of Guanlong' },
  // 隋末・唐初群雄
  'hist-dou-jiande':   { id: 'hist-dou-jiande',   kind: 'power',  zh: '夏王竇建德', en: 'Dou Jiande, King of Xia' },
  'hist-li-daozong':   { id: 'hist-li-daozong',   kind: 'feint',  zh: '江夏王', en: 'Prince of Jiangxia' },
  'hist-chen-xuanli':  { id: 'hist-chen-xuanli',  kind: 'power',  zh: '馬嵬兵變', en: 'The Mawei Mutiny' },
  'hist-wang-xiongdan':{ id: 'hist-wang-xiongdan',kind: 'power',  zh: '江淮猛將', en: 'Brute of the Huai' },
  'hist-kan-leng':     { id: 'hist-kan-leng',     kind: 'power',  zh: '闞稜陌刀', en: 'Kan Leng\'s Long-Saber' },
  'hist-wang-bodang':  { id: 'hist-wang-bodang',  kind: 'volley', zh: '瓦崗神射', en: 'Wagang Marksman' },
  'hist-yuan-tianmu':  { id: 'hist-yuan-tianmu',  kind: 'power',  zh: '北魏名將', en: 'Champion of Northern Wei' },
  'hist-yang-shihou':  { id: 'hist-yang-shihou',  kind: 'power',  zh: '梁之楊師厚', en: 'Yang Shihou of Liang' },
  'hist-yang-cunzhong':{ id: 'hist-yang-cunzhong',kind: 'power',  zh: '楊存中', en: 'Yang Cunzhong' },
  'hist-wang-yanqiu':  { id: 'hist-wang-yanqiu',  kind: 'power',  zh: '王晏球', en: 'Wang Yanqiu' },
  'hist-zhang-rou':    { id: 'hist-zhang-rou',    kind: 'power',  zh: '蒙元漢將', en: 'Han General of the Yuan' },
  'hist-zhang-renyuan':{ id: 'hist-zhang-renyuan',kind: 'feint',  zh: '三受降城', en: 'The Three Surrender-Cities' },
  'hist-wang-ji-ming': { id: 'hist-wang-ji-ming', kind: 'feint',  zh: '麓川之役', en: 'The Luchuan Campaign' },
  'hist-tuhai':        { id: 'hist-tuhai',        kind: 'power',  zh: '平定三藩', en: 'Queller of the Three Feudatories' },
  'hist-ma-sui':       { id: 'hist-ma-sui',       kind: 'power',  zh: '中唐良將', en: 'Fine General of Mid-Tang' },
  'hist-yang-zhong':   { id: 'hist-yang-zhong',   kind: 'power',  zh: '隋之先祖', en: 'Forebear of the Sui' },
  'hist-yang-zheng':   { id: 'hist-yang-zheng',   kind: 'power',  zh: '南宋勇將', en: 'Brute of Southern Song' },
  'hist-li-jiqian':    { id: 'hist-li-jiqian',    kind: 'power',  zh: '西夏奠基', en: 'Forebear of Western Xia' },
  'hist-pu-jiangjun':  { id: 'hist-pu-jiangjun',  kind: 'power',  zh: '蒲將軍', en: 'General Pu' },
  'hist-ji-xin-chu':   { id: 'hist-ji-xin-chu',   kind: 'power',  zh: '季布之弟', en: 'Brother of Ji Bu' },
  'hist-mai-wei':      { id: 'hist-mai-wei',      kind: 'power',  zh: '麥氏虎將', en: 'Tiger of the Mai' },
  'hist-mai-mengcai':  { id: 'hist-mai-mengcai',  kind: 'power',  zh: '驍勇善戰', en: 'Fierce and War-Skilled' },
  'hist-zhao-liangdong':{id: 'hist-zhao-liangdong',kind:'power',  zh: '勇略將軍', en: 'The Bold-and-Cunning General' },
  'hist-wang-conger':  { id: 'hist-wang-conger',  kind: 'multi',  zh: '白蓮女帥', en: 'Lady-Leader of the White Lotus' },
  'hist-yang-yanlang': { id: 'hist-yang-yanlang', kind: 'power',  zh: '楊四郎', en: 'Fourth Son of the Yang' },
  'hist-yang-yanding': { id: 'hist-yang-yanding', kind: 'power',  zh: '楊二郎', en: 'Second Son of the Yang' },
  'hist-yang-yanhui':  { id: 'hist-yang-yanhui',  kind: 'power',  zh: '楊五郎', en: 'Fifth Son of the Yang' },
  'hist-chen-yucheng': { id: 'hist-chen-yucheng', kind: 'multi',  zh: '太平英王', en: 'Brave-King of the Taiping' },
  'hist-yuxi-temur':   { id: 'hist-yuxi-temur',   kind: 'power',  zh: '元之名相', en: 'Grand Councillor of the Yuan' },
  'hist-pugu-huai’en': { id: 'hist-pugu-huai’en', kind: 'power',  zh: '平亂功臣', en: 'Hero of the Pacification' },
  // ── 補齊:所有 war 76-80 之名將 ─────────────────────────────────────────
  // 三國
  'zhu-ling':    { id: 'zhu-ling',    kind: 'power',  zh: '魏之宿將', en: 'Veteran of Wei' },
  'zhou-yu':     { id: 'zhou-yu',     kind: 'feint',  zh: '赤壁周郎', en: 'Zhou Yu of Red Cliff' },
  'zhao-tong':   { id: 'zhao-tong',   kind: 'power',  zh: '常山虎子', en: 'Tiger-Son of Changshan' },
  'zhao-guang':  { id: 'zhao-guang',  kind: 'power',  zh: '趙門虎子', en: 'Tiger-Son of the Zhao' },
  'xiahou-shang':{ id: 'xiahou-shang',kind: 'power',  zh: '征南之將', en: 'General of the Southern March' },
  'sun-shao':    { id: 'sun-shao',    kind: 'power',  zh: '廣陵卻敵', en: 'Repeller at Guangling' },
  'sun-jiao':    { id: 'sun-jiao',    kind: 'power',  zh: '宗室虎臣', en: 'Tiger-Vassal of the Clan' },
  'shen-ying':   { id: 'shen-ying',   kind: 'power',  zh: '吳之末將', en: 'Last General of Wu' },
  'mulu-da':     { id: 'mulu-da',     kind: 'volley', zh: '驅獸蠻王', en: 'Beast-Driving Savage King' },
  'luo-xian':    { id: 'luo-xian',    kind: 'power',  zh: '永安死守', en: 'Held Yong\'an to the Last' },
  'liu-zan':     { id: 'liu-zan',     kind: 'power',  zh: '吳之健將', en: 'Stalwart of Wu' },
  'liu-bao':     { id: 'liu-bao',     kind: 'power',  zh: '南匈奴王', en: 'King of the Southern Xiongnu' },
  'jin-huan':    { id: 'jin-huan',    kind: 'power',  zh: '金環三結', en: 'Jinhuan Sanjie' },
  'gou-fu':      { id: 'gou-fu',      kind: 'power',  zh: '蜀漢句扶', en: 'Gou Fu of Shu-Han' },
  'fu-rong':     { id: 'fu-rong',     kind: 'power',  zh: '夷陵死節', en: 'Died at Yiling' },
  'cao-hong':    { id: 'cao-hong',    kind: 'power',  zh: '舍命救主', en: 'Gave His Horse to His Lord' },
  'zhu-ju':      { id: 'zhu-ju',      kind: 'power',  zh: '吳之駙馬', en: 'Son-in-Law of Wu' },
  'zhu-ji-wu':   { id: 'zhu-ji-wu',   kind: 'power',  zh: '朱然之子', en: 'Son of Zhu Ran' },
  'zhang-zun':   { id: 'zhang-zun',   kind: 'power',  zh: '綿竹同殉', en: 'Fell with Zhuge at Mianzhu' },
  'yue-chen':    { id: 'yue-chen',    kind: 'power',  zh: '樂進之子', en: 'Son of Yue Jin' },
  'xie-jing':    { id: 'xie-jing',    kind: 'power',  zh: '吳之戰將', en: 'War-General of Wu' },
  'tao-huang':   { id: 'tao-huang',   kind: 'power',  zh: '交州名將', en: 'Champion of Jiaozhou' },
  'sun-jun':     { id: 'sun-jun',     kind: 'feint',  zh: '吳之權臣', en: 'Power-Holder of Wu' },
  'su-fei':      { id: 'su-fei',      kind: 'power',  zh: '江夏蘇飛', en: 'Su Fei of Jiangxia' },
  'qian-hong':   { id: 'qian-hong',   kind: 'power',  zh: '滅蜀偏將', en: 'Deputy in the Fall of Shu' },
  'ma-tie':      { id: 'ma-tie',      kind: 'power',  zh: '西涼馬氏', en: 'Of the Ma of Xiliang' },
  'hu-lie':      { id: 'hu-lie',      kind: 'power',  zh: '魏之先鋒', en: 'Vanguard of Wei' },
  'hu-fen':      { id: 'hu-fen',      kind: 'power',  zh: '晉之名將', en: 'Champion of Jin' },
  'guan-yi':     { id: 'guan-yi',     kind: 'power',  zh: '關門之後', en: 'Heir of the House of Guan' },
  'gongsun-kang':{ id: 'gongsun-kang',kind: 'feint',  zh: '遼東斬使', en: 'The Liaodong Beheading' },
  'chen-biao':   { id: 'chen-biao',   kind: 'power',  zh: '陳武之子', en: 'Son of Chen Wu' },
  'cao-xing':    { id: 'cao-xing',    kind: 'volley', zh: '一箭射布', en: 'The Shaft That Felled Lü Bu\'s Steed' },
  'beigong-boyu':{ id: 'beigong-boyu',kind: 'power',  zh: '涼州先零', en: 'Chief of the Western Qiang' },
  'bei-yan':     { id: 'bei-yan',     kind: 'power',  zh: '遼東守將', en: 'Holder of Liaodong' },
  'suli':        { id: 'suli',        kind: 'volley', zh: '鮮卑素利', en: 'Suli of the Xianbei' },
  'ma-xiu':      { id: 'ma-xiu',      kind: 'power',  zh: '西涼馬氏', en: 'Of the Ma of Xiliang' },
  // 歷史(war 80)
  'hist-jiang-ziya':   { id: 'hist-jiang-ziya',   kind: 'feint',  zh: '太公兵法', en: 'The Taigong\'s Art of War' },
  'hist-liu-xiu':      { id: 'hist-liu-xiu',      kind: 'sunder', zh: '昆陽神蹟', en: 'The Miracle at Kunyang' },
  'hist-han-wudi':     { id: 'hist-han-wudi',     kind: 'sunder', zh: '漢武雄圖', en: 'The Grand Design of Han Wu' },
  'hist-jin-wen-gong': { id: 'hist-jin-wen-gong', kind: 'feint',  zh: '退避三舍', en: 'Retreat Three Stages' },
  'hist-qin-mugong':   { id: 'hist-qin-mugong',   kind: 'power',  zh: '稱霸西戎', en: 'Hegemon of the Western Rong' },
  'hist-goujian':      { id: 'hist-goujian',      kind: 'feint',  zh: '臥薪嘗膽', en: 'Sleep on Brushwood, Taste Gall' },
  'hist-zheng-zhuanggong':{id:'hist-zheng-zhuanggong',kind:'feint',zh:'掘地見母', en: 'Dig to Meet His Mother' },
  'hist-chu-chengwang':{ id: 'hist-chu-chengwang',kind: 'power',  zh: '楚成霸業', en: 'Hegemony of Chu' },
  'hist-du-yu':        { id: 'hist-du-yu',        kind: 'feint',  zh: '杜武庫', en: 'The Arsenal of Du' },
  'hist-chen-qingzhi': { id: 'hist-chen-qingzhi', kind: 'multi',  zh: '白袍七千', en: 'Seven Thousand White-Robes' },
  'hist-deng-yu':      { id: 'hist-deng-yu',      kind: 'feint',  zh: '雲台之首', en: 'Foremost of the Cloud Terrace' },
  'hist-kou-xun':      { id: 'hist-kou-xun',      kind: 'feint',  zh: '文武備足', en: 'Both Pen and Sword' },
  'hist-geng-chun':    { id: 'hist-geng-chun',    kind: 'power',  zh: '雲台之列', en: 'Of the Cloud Terrace' },
  'hist-ji-xin':       { id: 'hist-ji-xin',       kind: 'feint',  zh: '誑楚救主', en: 'Decoy for His Lord' },
  'hist-hanxin-king':  { id: 'hist-hanxin-king',  kind: 'power',  zh: '韓王之後', en: 'Heir of the Han Kings' },
  'hist-liu-kun':      { id: 'hist-liu-kun',      kind: 'feint',  zh: '聞雞起舞', en: 'Rise to Dance at Cockcrow' },
  'hist-li-xiong':     { id: 'hist-li-xiong',     kind: 'power',  zh: '成漢立國', en: 'Founder of Cheng-Han' },
  'hist-gao-yang':     { id: 'hist-gao-yang',     kind: 'power',  zh: '北齊文宣', en: 'Wenxuan of Northern Qi' },
  'hist-gao-pian':     { id: 'hist-gao-pian',     kind: 'power',  zh: '晚唐名將', en: 'Champion of the Late Tang' },
  'hist-feng-changqing':{id: 'hist-feng-changqing',kind:'power',  zh: '安西封帥', en: 'Marshal of Anxi' },
  'hist-fu-hong':      { id: 'hist-fu-hong',      kind: 'power',  zh: '前秦先祖', en: 'Forebear of Former Qin' },
  'hist-duan-xiushi':  { id: 'hist-duan-xiushi',  kind: 'power',  zh: '笏擊朱泚', en: 'Struck the Rebel with a Tablet' },
  'hist-duan-siping':  { id: 'hist-duan-siping',  kind: 'power',  zh: '大理立國', en: 'Founder of Dali' },
  'hist-pan-mei':      { id: 'hist-pan-mei',      kind: 'power',  zh: '滅南漢', en: 'Conqueror of Southern Han' },
  'hist-she-taijun':   { id: 'hist-she-taijun',   kind: 'feint',  zh: '佘太君', en: 'The Matriarch She' },
  'hist-liu-futong':   { id: 'hist-liu-futong',   kind: 'power',  zh: '紅巾首義', en: 'Founder of the Red Turbans' },
  'hist-li-maozhen':   { id: 'hist-li-maozhen',   kind: 'power',  zh: '岐王李茂貞', en: 'Li Maozhen, King of Qi' },
  'hist-li-deming':    { id: 'hist-li-deming',    kind: 'power',  zh: '西夏拓土', en: 'Expander of Western Xia' },
  'hist-li-cunxin':    { id: 'hist-li-cunxin',    kind: 'power',  zh: '太保李存信', en: 'Champion Li Cunxin' },
  'hist-mao-wenlong':  { id: 'hist-mao-wenlong',  kind: 'power',  zh: '皮島總兵', en: 'Commander of Pi Island' },
  'hist-shang-kexi':   { id: 'hist-shang-kexi',   kind: 'power',  zh: '平南王', en: 'Prince Who Pacifies the South' },
  'hist-peng-yulin':   { id: 'hist-peng-yulin',   kind: 'power',  zh: '湘軍水師', en: 'Admiral of the Xiang Army' },
  'hist-jiang-zhongyuan':{id:'hist-jiang-zhongyuan',kind:'power', zh: '楚勇之創', en: 'Founder of the Chu Braves' },
  'hist-liu-mingchuan':{ id: 'hist-liu-mingchuan',kind: 'power',  zh: '台灣首任', en: 'First Governor of Taiwan' },
  'hist-lin-chaodong': { id: 'hist-lin-chaodong', kind: 'power',  zh: '棟軍守台', en: 'Defender of Taiwan' },
  'hist-ban-yong':     { id: 'hist-ban-yong',     kind: 'feint',  zh: '繼父定西', en: 'Heir to His Father\'s West' },
  'hist-ogedei':       { id: 'hist-ogedei',       kind: 'sunder', zh: '窩闊台汗', en: 'Great Khan Ogedei' },
  'hist-zhuche-tai':   { id: 'hist-zhuche-tai',   kind: 'multi',  zh: '蒙古先鋒', en: 'Vanguard of the Mongols' },
  'hist-yuechicher':   { id: 'hist-yuechicher',   kind: 'multi',  zh: '月赤察兒', en: 'Yuechicher' },
  'hist-yan-tiemur':   { id: 'hist-yan-tiemur',   kind: 'power',  zh: '元末權臣', en: 'Strongman of the Late Yuan' },
  'hist-puxian-wannu': { id: 'hist-puxian-wannu', kind: 'power',  zh: '東夏立國', en: 'Founder of Eastern Xia' },
  'hist-dashi-badulu': { id: 'hist-dashi-badulu', kind: 'power',  zh: '元末名將', en: 'Late-Yuan Champion' },
  'hist-wang-zhixing': { id: 'hist-wang-zhixing', kind: 'power',  zh: '武寧節度', en: 'Governor of Wuning' },
  'hist-wang-jun':     { id: 'hist-wang-jun',     kind: 'power',  zh: '晉樓船將', en: 'Tower-Ship Admiral of Jin' },
  'hist-wang-jian-shu':{ id: 'hist-wang-jian-shu',kind: 'power',  zh: '前蜀高祖', en: 'Founder of Former Shu' },
  'hist-wang-chongrong':{id: 'hist-wang-chongrong',kind:'power',  zh: '河中節度', en: 'Governor of Hezhong' },
  'hist-sima-jin':     { id: 'hist-sima-jin',     kind: 'power',  zh: '白起部將', en: 'Lieutenant of Bai Qi' },
  'hist-shi-tianni':   { id: 'hist-shi-tianni',   kind: 'power',  zh: '史氏漢將', en: 'Han General of the Shi' },
  'hist-shen-youzhi':  { id: 'hist-shen-youzhi',  kind: 'power',  zh: '荊州沈攸', en: 'Shen Youzhi of Jingzhou' },
  'hist-luan-shu':     { id: 'hist-luan-shu',     kind: 'feint',  zh: '晉之正卿', en: 'Chief Minister of Jin' },
  'hist-liu-wuzhou':   { id: 'hist-liu-wuzhou',   kind: 'power',  zh: '馬邑舉兵', en: 'Revolt at Mayi' },
  'hist-xun-xiang':    { id: 'hist-xun-xiang',    kind: 'power',  zh: '宋金剛部', en: 'Lieutenant of Song Jingang' },
  'hist-xiahou-ying':  { id: 'hist-xiahou-ying',  kind: 'power',  zh: '滕公夏侯', en: 'Lord Teng, Xiahou Ying' },
  'hist-wulantai':     { id: 'hist-wulantai',     kind: 'power',  zh: '清軍宿將', en: 'Qing Veteran' },
  'hist-huan-yi':      { id: 'hist-huan-yi',      kind: 'power',  zh: '秦之桓齮', en: 'Huan Yi of Qin' },
  'hist-huan-chu':     { id: 'hist-huan-chu',     kind: 'power',  zh: '楚之桓楚', en: 'Huan Chu of Chu' },
  'hist-hun-hao':      { id: 'hist-hun-hao',      kind: 'power',  zh: '唐之渾鎬', en: 'Hun Hao of Tang' },
  'hist-geshu-yao':    { id: 'hist-geshu-yao',    kind: 'power',  zh: '哥舒之子', en: 'Son of Geshu Han' },
  'hist-ding-ruchang': { id: 'hist-ding-ruchang', kind: 'power',  zh: '北洋提督', en: 'Admiral of the Beiyang Fleet' },
  'hist-deng-shichang':{ id: 'hist-deng-shichang',kind: 'power',  zh: '致遠撞敵', en: 'The Ramming of the Zhiyuan' },
  'hist-chai-shao':    { id: 'hist-chai-shao',    kind: 'power',  zh: '凌煙駙馬', en: 'Imperial Son-in-Law of Lingyan' },
  'hist-an-zhongrong': { id: 'hist-an-zhongrong', kind: 'power',  zh: '跋扈藩鎮', en: 'The Overbearing Warlord' },
  // 歷史(war 78)
  'hist-fu-jian':      { id: 'hist-fu-jian',      kind: 'sunder', zh: '投鞭斷流', en: 'Whips Enough to Dam a River' },
  'hist-liu-zhiyuan':  { id: 'hist-liu-zhiyuan',  kind: 'power',  zh: '後漢高祖', en: 'Founder of Later Han' },
  'hist-gao-cheng':    { id: 'hist-gao-cheng',    kind: 'power',  zh: '東魏世子', en: 'Heir of Eastern Wei' },
  'hist-zhu-ci':       { id: 'hist-zhu-ci',       kind: 'power',  zh: '涇原兵變', en: 'The Jingyuan Mutiny' },
  'hist-zhao-dejun':   { id: 'hist-zhao-dejun',   kind: 'power',  zh: '盧龍節度', en: 'Governor of Lulong' },
  'hist-yang-guangyuan':{id: 'hist-yang-guangyuan',kind:'power',  zh: '叛將楊光', en: 'The Turncoat Yang' },
  'hist-yan-shi':      { id: 'hist-yan-shi',      kind: 'power',  zh: '東平嚴實', en: 'Yan Shi of Dongping' },
  'hist-wang-xianzhi-tang':{id:'hist-wang-xianzhi-tang',kind:'power',zh:'唐末義軍', en: 'Late-Tang Rebel' },
  'hist-wang-chucun':  { id: 'hist-wang-chucun',  kind: 'power',  zh: '義武節度', en: 'Governor of Yiwu' },
  'hist-tian-dan-chu': { id: 'hist-tian-dan-chu', kind: 'power',  zh: '齊王田儋', en: 'Tian Dan, King of Qi' },
  'hist-temur-buhua':  { id: 'hist-temur-buhua',  kind: 'multi',  zh: '元末宗王', en: 'Late-Yuan Prince' },
  'hist-sima-zifan':   { id: 'hist-sima-zifan',   kind: 'power',  zh: '楚之子反', en: 'Zifan of Chu' },
  'hist-sima-shang':   { id: 'hist-sima-shang',   kind: 'power',  zh: '趙之名將', en: 'Champion of Zhao' },
  'hist-she-jian':     { id: 'hist-she-jian',     kind: 'power',  zh: '鉅鹿秦將', en: 'Qin Commander at Julu' },
  'hist-qu-xia':       { id: 'hist-qu-xia',       kind: 'power',  zh: '楚之莫敖', en: 'Mo\'ao of Chu' },
  'hist-li-tan':       { id: 'hist-li-tan',       kind: 'power',  zh: '濟南李壇', en: 'Li Tan of Jinan' },
  'hist-li-baozhen':   { id: 'hist-li-baozhen',   kind: 'feint',  zh: '昭義練兵', en: 'Drillmaster of Zhaoyi' },
  'hist-ju-xin':       { id: 'hist-ju-xin',       kind: 'feint',  zh: '燕之劇辛', en: 'Ju Xin of Yan' },
  'hist-guan-he':      { id: 'hist-guan-he',      kind: 'power',  zh: '灌嬰之子', en: 'Son of Guan Ying' },
  'hist-gongsun-xi':   { id: 'hist-gongsun-xi',   kind: 'power',  zh: '韓之名將', en: 'Champion of Han' },
  'hist-gongsun-ang':  { id: 'hist-gongsun-ang',  kind: 'power',  zh: '魏之公孫', en: 'Gongsun Yang of Wei' },
  'hist-geng-jingzhong':{id: 'hist-geng-jingzhong',kind:'power',  zh: '三藩之一', en: 'One of the Three Feudatories' },
  'hist-gao-kaidao':   { id: 'hist-gao-kaidao',   kind: 'power',  zh: '燕王高開', en: 'Gao Kaidao, King of Yan' },
  'hist-gao-jun':      { id: 'hist-gao-jun',      kind: 'power',  zh: '北齊宗室', en: 'Prince of Northern Qi' },
  'hist-fu-gongshi':   { id: 'hist-fu-gongshi',   kind: 'power',  zh: '江淮輔公', en: 'Fu Gongshi of the Huai' },
  'hist-feng-jing':    { id: 'hist-feng-jing',    kind: 'power',  zh: '漢之馮敬', en: 'Feng Jing of Han' },
  'hist-duan-wenzhen': { id: 'hist-duan-wenzhen',  kind: 'power', zh: '隋之段文', en: 'Duan Wenzhen of Sui' },
  'hist-du-wenxiu':    { id: 'hist-du-wenxiu',    kind: 'power',  zh: '雲南舉義', en: 'The Yunnan Rising' },
  'hist-chu-weiwang':  { id: 'hist-chu-weiwang',  kind: 'power',  zh: '楚威盛世', en: 'Zenith of Chu under Wei' },
  'hist-bai-gongsheng':{ id: 'hist-bai-gongsheng',kind: 'feint',  zh: '白公之亂', en: 'The Revolt of Lord Bai' },
  'hist-wei-wuhou':    { id: 'hist-wei-wuhou',    kind: 'power',  zh: '魏武侯', en: 'Marquis Wu of Wei' },
  'hist-xianyu-xiuli': { id: 'hist-xianyu-xiuli', kind: 'power',  zh: '六鎮起義', en: 'The Six-Garrisons Revolt' },
  'hist-zhou-yin':     { id: 'hist-zhou-yin',     kind: 'power',  zh: '楚之周殷', en: 'Zhou Yin of Chu' },
  'hist-sima-tang':    { id: 'hist-sima-tang',    kind: 'power',  zh: '宋之司馬', en: 'Sima Tang of Song' },
  'hist-shi-taihei':   { id: 'hist-shi-taihei',   kind: 'power',  zh: '金之史塔', en: 'Shi Taihei of the Jin' },
  'hist-qu-gai':       { id: 'hist-qu-gai',       kind: 'power',  zh: '楚之屈丐', en: 'Qu Gai of Chu' },
  'hist-gongzi-pengsheng':{id:'hist-gongzi-pengsheng',kind:'power',zh:'齊之力士', en: 'Strongman of Qi' },
  'hist-bao-yuan':     { id: 'hist-bao-yuan',     kind: 'volley', zh: '韓之暴鳶', en: 'Bao Yuan of Han' },
  'mu-lu':       { id: 'mu-lu',       kind: 'volley', zh: '驅獸蠻王', en: 'Beast-Driving Savage King' },
  'jinhuan-sanjie':{id: 'jinhuan-sanjie',kind: 'power', zh: '金環三結', en: 'Jinhuan Sanjie' },
  'hist-yan-jiangjun': { id: 'hist-yan-jiangjun', kind: 'power',  zh: '楚之鄢將', en: 'General Yan of Chu' },
};

/** A fighter's signature 必殺技: a named hero's, else an archer's volley / a
 *  great warrior's generic 奮命一擊, else null (no finisher to name). */
export function signatureUlt(o: Officer): SignatureUlt | null {
  if (SIGNATURE_ULTS[o.id]) return SIGNATURE_ULTS[o.id];
  if (weaponClassFor(o) === 'bow') return { id: o.id, kind: 'volley', zh: '神射絕殺', en: 'Marksman\'s Kill' };
  if (o.traits?.includes('matchless') || o.stats.war >= 90) return { id: o.id, kind: 'power', zh: '奮命一擊', en: 'All-Out Strike' };
  return null;
}

// ─── 武魂・獨門 (legendary passives) — what sets the marquee fighters apart ───
// A named ult gives a fighter their flavour, but the true greats also carry a
// passive that bends the whole bout — 呂布's blows can't be fully blocked, 趙雲
// cannot be cut down the first time, 項羽's aura cows the foe from the off. This
// is the depth behind the breadth: not a 600th reskin of 奮命一擊, but a handful
// of fighters who genuinely play differently.
export type DuelPassiveId =
  | 'tyrant-might'    // 呂布 無雙 — 奮/必殺 blocked still bleeds 40% through
  | 'undying-valor'   // 趙雲 七進七出 — once per bout, a killing blow leaves them at 1
  | 'overlord-aura'   // 項羽 霸王色 — foe opens cowed: −2 氣 & −10 氣力
  | 'matchless-might' // 李存孝 天下無敵 — every landed offence bites +7 deeper
  | 'immovable'       // 岳飛 撼山難 — takes 15% less from every blow
  | 'last-stand-fury' // 典韋/許褚 死戰 — below 30 氣力, deals +25%
  | 'thunderous-roar' // 張飛 斷橋 — foe opens rattled: −2 氣
  | 'cavalry-surge'   // 馬超 西涼鐵騎 — opens with a banked 氣 (charge)
  | 'eagle-eye';      // 黃忠/養由基 神射 — a turned-aside shot still chips +5

export interface DuelPassive { id: DuelPassiveId; zh: string; en: string; }

const DUEL_PASSIVES: Record<string, DuelPassive> = {
  'lu-bu':       { id: 'tyrant-might',    zh: '無雙',     en: 'Peerless' },
  'zhao-yun':    { id: 'undying-valor',   zh: '七進七出', en: 'Seven In, Seven Out' },
  'hist-xiang-yu':{ id: 'overlord-aura',  zh: '霸王色',   en: "Overlord's Presence" },
  'hist-li-cunxiao':{ id: 'matchless-might', zh: '天下無敵', en: 'Unmatched Under Heaven' },
  'hist-yue-fei':{ id: 'immovable',       zh: '撼山難',   en: 'Immovable as a Mountain' },
  'dian-wei':    { id: 'last-stand-fury', zh: '死戰護主', en: 'Last Stand' },
  'xu-chu':      { id: 'last-stand-fury', zh: '虎癡裸衣', en: 'Tiger Fury' },
  'zhang-fei':   { id: 'thunderous-roar', zh: '據水斷橋', en: 'Roar at the Bridge' },
  'ma-chao':     { id: 'cavalry-surge',   zh: '西涼鐵騎', en: 'Iron Cavalry of Xiliang' },
  'huang-zhong': { id: 'eagle-eye',       zh: '百步穿楊', en: 'Hundred-Pace Shot' },
  'hist-yang-youji':{ id: 'eagle-eye',    zh: '百步穿楊', en: 'Pierce the Willow' },
  'hist-li-guang':{ id: 'eagle-eye',      zh: '飛將神射', en: "Flying General's Shot" },
};

/** The legendary passive a fighter carries into single combat, if any. */
export function duelPassive(o: Officer): DuelPassive | null {
  return DUEL_PASSIVES[o.id] ?? null;
}

// ─── 傷殘 (permanent maims) — single combat that doesn't kill can still cripple ─
// A brutal bout may leave a lasting maim that no 養傷 heals. Each narrows the
// fighter's repertoire for good — a 斷臂 cannot flurry, a 跛足 cannot dodge, a
// 目眇 fights half-blind — and saps their prowess. The dark mirror of growth.
export type DuelScar = 'maimed-arm' | 'maimed-eye' | 'maimed-leg';

export interface DuelScarInfo { id: DuelScar; zh: string; en: string; descZh: string; descEn: string; }
export const DUEL_SCAR_INFO: Record<DuelScar, DuelScarInfo> = {
  'maimed-arm': { id: 'maimed-arm', zh: '斷臂', en: 'Maimed Arm', descZh: '不能使連擊,勇−8', descEn: 'cannot combo; −8 prowess' },
  'maimed-eye': { id: 'maimed-eye', zh: '目眇', en: 'Lost Eye',   descZh: '讀招大降,勇−6', descEn: 'reads the foe poorly; −6 prowess' },
  'maimed-leg': { id: 'maimed-leg', zh: '跛足', en: 'Lamed Leg',  descZh: '不能閃避,勇−5', descEn: 'cannot dodge; −5 prowess' },
};

/** The permanent maims a fighter carries. */
export function duelScars(o: Officer): DuelScar[] {
  return o.duelScars ?? [];
}
/** Total prowess sapped by an officer's maims (for staticProwess). */
function scarProwessPenalty(o: Officer): number {
  let p = 0;
  for (const s of duelScars(o)) p += s === 'maimed-arm' ? 8 : s === 'maimed-eye' ? 6 : 5;
  return p;
}
/** A move a maimed fighter can no longer field (連擊 for an arm, 閃 for a leg). */
export function scarBarsMove(o: Officer, m: DuelMove): boolean {
  const scars = duelScars(o);
  // 折肱之痛 — a battle-crippled arm bars the heavy combo, same as a duel maim.
  if (m === 'combo' && (scars.includes('maimed-arm') || chronicBarsArm(o))) return true;
  if (m === 'dodge' && scars.includes('maimed-leg')) return true;
  return false;
}

/**
 * A brutal single combat — survived, but barely — may leave a permanent maim.
 * Rolls ~22% of the time on a survived knockout; the kind is random (a broken
 * arm most often). The caller applies it to the bested fighter who lived.
 */
export function rollDuelScar(rng: () => number = Math.random): DuelScar | null {
  if (rng() >= 0.22) return null;
  const r = rng();
  return r < 0.42 ? 'maimed-arm' : r < 0.76 ? 'maimed-leg' : 'maimed-eye';
}

// ─── 馬戰 (mounted combat) — the soul of single combat in the romance ─────────
// When a fighter rides a famed steed into the bout, the duel opens with a 衝鋒對撞
// (a charge pass, 兩馬相交): the two thunder past each other and the better-poised
// rider lands the opening blow — a heavy lance reaches furthest, a peerless aura
// strikes first. A crushing pass can unhorse the loser outright. Thereafter, while
// still mounted, a long arm reaches (馬上長兵) but the seat steals some nimbleness
// (馬上難閃). 挑落下馬 (a parry-disarm) ends the mounted phase.

/** A reach bonus for the long arms a rider levels from the saddle. */
function chargeReach(o: Officer): number {
  const c = weaponClassFor(o);
  return c === 'spear' || c === 'halberd' || c === 'glaive' ? 8 : c === 'sword' || c === 'twinblade' ? 0 : 4;
}

export interface ChargePass {
  winner: 'attacker' | 'defender' | 'clash'; // 'clash' = a dead-even pass
  dmgToAttacker: number;
  dmgToDefender: number;
  unhorsed?: 'attacker' | 'defender';        // a crushing pass throws the loser
  textZh: string;
  textEn: string;
}

/**
 * 衝鋒對撞 — the opening charge pass, fought only when at least one duellist is
 * mounted. Pure: the better-poised rider (prowess + 先手 + reach + saddle) lands
 * the opening blow; a lopsided pass unhorses the loser. Returns null on a pure
 * foot duel (neither mounted).
 */
export function resolveChargePass(attacker: Officer, defender: Officer, rng: () => number = Math.random): ChargePass | null {
  const aM = mountEdge(attacker) !== null;
  const dM = mountEdge(defender) !== null;
  if (!aM && !dM) return null;
  const pose = (o: Officer, mounted: boolean) =>
    staticProwess(o) + duelFirstStrike(o) + (mounted ? chargeReach(o) + 6 : 0);
  const aPose = pose(attacker, aM);
  const dPose = pose(defender, dM);
  const diff = aPose - dPose + Math.floor(rng() * 24) - 12;
  if (Math.abs(diff) < 4) {
    return { winner: 'clash', dmgToAttacker: 8, dmgToDefender: 8, textZh: '兩馬相交,槍戟錯鋒,各自掠過!', textEn: 'The two steeds thunder past — lances cross, both glance away!' };
  }
  const winnerIsA = diff > 0;
  const margin = Math.abs(diff);
  const dmg = Math.round(12 + Math.min(26, margin * 0.7));
  const unhorse = margin >= 30; // a crushing pass throws the loser from the saddle
  const w = winnerIsA ? attacker : defender;
  const l = winnerIsA ? defender : attacker;
  return {
    winner: winnerIsA ? 'attacker' : 'defender',
    dmgToAttacker: winnerIsA ? 0 : dmg,
    dmgToDefender: winnerIsA ? dmg : 0,
    unhorsed: unhorse ? (winnerIsA ? 'defender' : 'attacker') : undefined,
    textZh: unhorse ? `${w.name.zh}一槍將 ${l.name.zh} 挑落馬下!` : `兩馬相交 — ${w.name.zh}佔得先機,一擊得手!`,
    textEn: unhorse ? `${w.name.en} unhorses ${l.name.en} on the very first pass!` : `The charge meets — ${w.name.en} lands the opening blow!`,
  };
}

/** Fold a resolved 衝鋒對撞 into a fresh bout: the loser of the pass opens wounded
 *  (and unhorsed if it was a crushing pass). Returns a new bout. */
export function applyChargePass(bout: DuelBout, pass: ChargePass): DuelBout {
  const b: DuelBout = { ...bout };
  b.aStamina = Math.max(1, b.aStamina - pass.dmgToAttacker);
  b.dStamina = Math.max(1, b.dStamina - pass.dmgToDefender);
  if (pass.unhorsed === 'attacker') { b.aUnhorsed = true; b.aMountSavior = false; }
  if (pass.unhorsed === 'defender') { b.dUnhorsed = true; b.dMountSavior = false; }
  return b;
}

// ─── 兵器 — which weapon an officer wields in the 3D duel arena ──────────────
// Drives both the animation pack (one-handed sword vs two-handed polearm vs the
// dedicated axe / bow packs) and the weapon mesh on the hand. Two-handed:
// glaive/spear/halberd/greatsword; 斧 and 弓 each fight with their own pack.
export type WeaponClass = 'sword' | 'axe' | 'twinblade' | 'glaive' | 'spear' | 'halberd' | 'greatsword' | 'bow';

// A legendary weapon dictates the class outright.
const WEAPON_CLASS_BY_ITEM: Record<string, WeaponClass> = {
  'green-dragon': 'glaive',   // 青龍偃月刀
  'snake-spear': 'spear',     // 丈八蛇矛
  'sky-piercer': 'halberd',   // 方天畫戟
  'twin-swords': 'twinblade', // 雌雄一對劍
  'gu-ding': 'sword',         // 古錠刀
  'yitian': 'sword',          // 倚天劍
};

// Famous officers keep their signature arm even without the legendary item.
const WEAPON_CLASS_BY_OFFICER: Record<string, WeaponClass> = {
  'guan-yu': 'glaive', 'zhang-fei': 'spear', 'zhao-yun': 'spear', 'ma-chao': 'spear',
  'lu-bu': 'halberd', 'dian-wei': 'greatsword', 'xu-chu': 'greatsword',
  'huang-gai': 'axe', 'xu-huang': 'axe', 'dong-zhuo': 'halberd',
  // 神射手 — famous archers carry a bow into the arena (ranged opening volley).
  'huang-zhong': 'bow', 'taishi-ci': 'bow', 'xiahou-yuan': 'bow', 'gan-ning': 'bow',
};

/** The officer's 3D duel weapon: legendary item → signature → war-based default. */
export function weaponClassFor(o: Officer): WeaponClass {
  for (const id of o.equipment) { const c = WEAPON_CLASS_BY_ITEM[id]; if (c) return c; }
  // 改換門庭 — a deliberately chosen school overrides both the famous-officer
  // table and the weapon in hand (§6.10).
  if (o.martialSchool) return o.martialSchool;
  if (WEAPON_CLASS_BY_OFFICER[o.id]) return WEAPON_CLASS_BY_OFFICER[o.id];
  // Default: heavy bruisers swing a greatsword; everyone else a sword & shield.
  if (o.stats.war >= 92 && o.stats.intelligence < 60) return 'greatsword';
  return 'sword';
}

/** The animation pack a weapon class fights with: one-handed vs two-handed.
 *  (弓 archers use their own pack — see the arena's packForClass.) */
export function weaponIsTwoHanded(c: WeaponClass): boolean {
  return c === 'glaive' || c === 'spear' || c === 'halberd' || c === 'greatsword';
}

/** 弓手 — an archer opens with a ranged volley and harries from distance. */
export function weaponIsRanged(c: WeaponClass): boolean {
  return c === 'bow';
}

// ─── Interactive duel — a counter game of 3 attacks / 3 defenses + specials ──
//
//   Attacks:  劈 cleave (high/heavy) · 斬 slash (mid/fast) · 掃 sweep (low)
//   Defenses: 格 guard (block) · 閃 dodge (evade) · 架 parry (deflect+riposte)
//   Specials: 挑釁 taunt  — banks 2 氣 + recovers, but a foe's attack lands clean
//             突刺 thrust — costs 1 氣; fast lunge, only 格 guard stops it (slips
//                           閃 dodge & 架 parry, beats the slower base attacks)
//             連擊 combo  — costs 2 氣; a flurry no single defense fully stops
//             奮 power    — costs 2 氣; heavy overpower, only 格 guard stops it
//
// Counters are near-decisive — the matrix fixes WHO is hit; prowess gap and a
// small die only set the magnitude. Each attack is STOPPED by two defenses and
// PUNISHES the third (its blind spot):
//   劈 cleave punished only by 架 parry · 斬 slash punished only by 閃 dodge ·
//   掃 sweep  punished only by 格 guard.
// Attack-vs-attack is a mini ring: 斬 > 劈 > 掃 > 斬. The specials resolve in a
// dedicated branch so the tested base matrix above is never perturbed.

export type DuelMove =
  | 'cleave' | 'slash' | 'sweep'      // 3 base attacks
  | 'guard' | 'dodge' | 'parry'       // 3 defenses
  | 'power'                           // 奮 — heavy spender
  | 'taunt' | 'thrust' | 'combo'      // 挑釁 / 突刺 / 連擊 — specials
  | 'ultimate';                       // 必殺技 — unleashed when the 武魂 gauge is full

const ATTACKS: DuelMove[] = ['cleave', 'slash', 'sweep'];
const DEFENSES: DuelMove[] = ['guard', 'dodge', 'parry'];
const SPECIALS: DuelMove[] = ['taunt', 'thrust', 'combo'];

// ─── 招式修練 — a general's repertoire grows with their level (skill tree) ────
// The 3 attacks / 3 defenses + 奮 are the foundation every fighter knows. The
// flourish moves and the 必殺技 are earned as a general seasons in battle, so a
// raw recruit fights plainly and a veteran has the full arsenal.
export const DUEL_MOVE_UNLOCK: Partial<Record<DuelMove, number>> = {
  taunt: 3, thrust: 6, combo: 10, ultimate: 14,
};
/** The level at which a move becomes available (1 = known from the start). */
export function duelMoveUnlockLevel(m: DuelMove): number {
  return DUEL_MOVE_UNLOCK[m] ?? 1;
}
/** Whether an officer has trained far enough to field a given move. Uses the
 *  canonical 歷練 level (explicit officer.level wins, else derived from
 *  capability + growth) so a real roster officer — who never has a stored
 *  level — still unlocks moves by prowess rather than being stuck at Lv.1. */
export function isDuelMoveUnlocked(o: Officer, m: DuelMove): boolean {
  // 傷殘 — a maim bars a move outright (a 斷臂 can't flurry, a 跛足 can't dodge).
  // A maim outranks 悟招: no amount of study restores an arm.
  if (scarBarsMove(o, m)) return false;
  // 悟招 — a move bought outright with 心得 is theirs regardless of level (§6.10).
  if (o.duelMovesLearned?.includes(m)) return true;
  // 武學修為 — a well-drilled duellist fields the flourish moves earlier than their
  // 歷練 level alone would allow (a raw-but-trained fighter still has real craft).
  return officerLevel(o) + martialBonus(o).moveUnlockDiscount >= duelMoveUnlockLevel(m);
}
const ALL_DUEL_MOVES: DuelMove[] = ['cleave', 'slash', 'sweep', 'guard', 'dodge', 'parry', 'power', 'taunt', 'thrust', 'combo', 'ultimate'];
/** Every move an officer may field at their current level. */
export function unlockedDuelMoves(o: Officer): DuelMove[] {
  return ALL_DUEL_MOVES.filter((m) => isDuelMoveUnlocked(o, m));
}
export const isAttackMove = (m: DuelMove): boolean => ATTACKS.includes(m);
export const isDefenseMove = (m: DuelMove): boolean => DEFENSES.includes(m);
export const isSpecialMove = (m: DuelMove): boolean => SPECIALS.includes(m);
/** Any move that closes to strike (base attacks + thrust/combo/power/必殺). */
const isOffensiveMove = (m: DuelMove): boolean => isAttackMove(m) || m === 'thrust' || m === 'combo' || m === 'power' || m === 'ultimate';

/** 武魂 — the gauge fills to this to unlock a once-per-bout 必殺技. */
export const SPIRIT_MAX = 100;

// The one defense each attack BEATS (its blind spot); the other two stop it.
const ATTACK_PUNISHES: Record<string, DuelMove> = { cleave: 'parry', slash: 'dodge', sweep: 'guard' };
// Attack-vs-attack mini ring: key beats value (斬>劈>掃>斬).
const ATTACK_BEATS: Record<string, DuelMove> = { slash: 'cleave', cleave: 'sweep', sweep: 'slash' };
// Base damage a clean strike deals, before prowess gap / die / weapon art.
const STRIKE_DMG: Record<string, number> = { cleave: 34, slash: 26, sweep: 24, power: 42, thrust: 30, combo: 34, ultimate: 64 };
// 氣 banked by a defense that holds (架 parry banks most; 閃 dodge none).
const DEFENSE_GUARD: Record<string, number> = { guard: 1, parry: 2, dodge: 0 };

// 氣 costs / rewards of the specials.
export const THRUST_COST = 1;
export const COMBO_COST = 2;
const TAUNT_BANK = 2;     // 挑釁 banks this much 氣 when it isn't punished
const TAUNT_RECOVER = 8;  // …and catches this much breath back

// 難度 — how sharply the AI foe reads and counters you.
export type DuelDifficulty = 'rookie' | 'veteran' | 'peerless';

// 地形 — the ground a bout is fought on colours the exchange. 演武/比武 are on
// the neutral 校場 (plain); a battlefield 單挑 can fall on rougher terrain.
export type DuelTerrain = 'plain' | 'bridge' | 'mud' | 'fire' | 'rain';
export const DUEL_TERRAIN_INFO: Record<DuelTerrain, { zh: string; en: string; descZh: string; descEn: string }> = {
  plain:  { zh: '校場', en: 'Open Ground', descZh: '平地 — 無增益', descEn: 'level ground — no modifier' },
  bridge: { zh: '長坂橋', en: 'Narrow Bridge', descZh: '窄橋 — 閃避無處騰挪,失足受創', descEn: 'no room to dodge — lost footing chips you' },
  mud:    { zh: '泥濘', en: 'Mire', descZh: '泥濘 — 突刺/連擊陷足,威力大減', descEn: 'lunges & flurries bog down (−20%)' },
  fire:   { zh: '火海', en: 'Burning Field', descZh: '烈火 — 雙方每回合灼傷', descEn: 'flames scorch both each round' },
  rain:   { zh: '雨夜', en: 'Rainy Night', descZh: '雨夜濕滑 — 刀劈失準(−10%)', descEn: 'slick footing dulls every blow (−10%)' },
};
/** Pick a battlefield terrain — mostly neutral, sometimes rough. */
export function pickDuelTerrain(rng: () => number = Math.random): DuelTerrain {
  const r = rng();
  if (r < 0.55) return 'plain';
  if (r < 0.67) return 'bridge';
  if (r < 0.79) return 'mud';
  if (r < 0.90) return 'rain';
  return 'fire';
}

// 性格 — a fighter's temperament colours HOW the AI fights (separate from how
// well it reads you, which is 難度). 猛: presses the attack, loves 奮/連擊; 慎:
// hangs back on 格/閃/架, spends 氣 grudgingly; 詐: feints — leans on 挑釁 bluffs
// and 突刺, baiting a guard then slipping it. 均 is the balanced default.
export type DuelPersona = 'aggressive' | 'cautious' | 'cunning' | 'balanced';

/** Read a fighter's duelling temperament from its traits and stat shape. */
export function duelPersona(o: Officer): DuelPersona {
  const t = o.traits ?? [];
  const { war, intelligence: int } = o.stats;
  if (t.includes('reckless') || t.includes('wrathful') || t.includes('matchless') || t.includes('duelist') || t.includes('berserker') || t.includes('martial-valor') || (war >= 88 && war > int + 20)) return 'aggressive';
  if (t.includes('cunning') || t.includes('ambitious') || (int >= 80 && int > war)) return 'cunning';
  if (t.includes('cautious') || t.includes('cowardly') || t.includes('sickly')) return 'cautious';
  return 'balanced';
}

export interface DuelBout {
  aStamina: number;
  dStamina: number;
  aGuard: number;   // successful blocks banked toward 奮 (Overpower)
  dGuard: number;
  aStatic: number;  // fixed prowess
  dStatic: number;
  aInt: number;     // intelligence — drives how well each side reads the foe
  dInt: number;
  aMoves: DuelMove[]; // move history, so a sharp mind can read a habit
  dMoves: DuelMove[];
  aChain: DuelMove[]; // 連招 — consecutive landed offensive strikes (resets on a miss/defense)
  dChain: DuelMove[];
  aSpirit: number;    // 武魂 — 0..SPIRIT_MAX; full unlocks a 必殺技
  dSpirit: number;
  aUltUsed: boolean;  // 必殺技 is once per bout
  dUltUsed: boolean;
  aArt: WeaponArt | null; // 兵器絕技 — a legendary weapon's signature edge
  dArt: WeaponArt | null;
  aEvolvedArt: boolean; // 器魂戰技 — an awakened (·神) weapon stokes 武魂 faster
  dEvolvedArt: boolean;
  aUlt: SignatureUlt | null; // 必殺技 — the named finisher unleashed at full 武魂
  dUlt: SignatureUlt | null;
  aMountSavior: boolean; // 的盧救主 — a wonder-horse that can spare one killing blow…
  dMountSavior: boolean;
  aMountSaved: boolean;  // …and whether it has already spent that rescue.
  dMountSaved: boolean;
  aPassive: DuelPassiveId | null; // 獨門 — a legendary fighter's bout-bending passive
  dPassive: DuelPassiveId | null;
  aUndyingUsed: boolean; // 七進七出 — the innate once-per-bout death-cheat, if spent
  dUndyingUsed: boolean;
  aFlaw: number; // 破綻 — 0..100; whiffing an attack opens you up, so the next blow
  dFlaw: number; //         you take bites deeper. Landing/defending closes it again.
  aMounted: boolean; // 馬戰 — entered the bout on a famed steed (mountEdge)…
  dMounted: boolean;
  aUnhorsed: boolean; // …and whether a 挑落下馬 has since put them on foot.
  dUnhorsed: boolean;
  aClass: WeaponClass; // 兵器 — drives class combat traits (spear reach, axe break…)
  dClass: WeaponClass;
  aPersona: DuelPersona; // 性格 — colours how each side fights on instinct
  dPersona: DuelPersona;
  terrain: DuelTerrain;  // 地形 — the ground the bout is fought on
  difficulty: DuelDifficulty; // AI skill tier for the foe
  round: number;    // rounds played
  over: boolean;
  winner?: 'attacker' | 'defender' | 'draw';
  killedId?: string;
}

export const POWER_GUARD_COST = 2;

/** Starting-stamina penalties (車輪戰): an officer who has already dueled this
 *  battle opens the next bout winded. Clamped so they can still put up a fight. */
export function initDuelBout(
  attacker: Officer,
  defender: Officer,
  aStaminaPenalty = 0,
  dStaminaPenalty = 0,
  difficulty: DuelDifficulty = 'veteran',
  terrain: DuelTerrain = 'plain',
  aCareer = 0, // 鬥將生涯 — fixed-prowess bonus earned on the 武評榜 (see warRanking)
  dCareer = 0,
): DuelBout {
  const aClass = weaponClassFor(attacker);
  const dClass = weaponClassFor(defender);
  // 駿馬·先發 — a war-charger opens the bout with a banked 氣 (like the archer's volley).
  const aCharge = mountEdge(attacker) === 'charge' ? 1 : 0;
  const dCharge = mountEdge(defender) === 'charge' ? 1 : 0;
  // 獨門·開場 — a legendary passive can colour the bout from the very first move:
  // 西涼鐵騎 opens with a banked 氣; 霸王色/據水斷橋 cow the FOE (−氣, −氣力).
  const aPass = duelPassive(attacker)?.id ?? null;
  const dPass = duelPassive(defender)?.id ?? null;
  const surge = (p: DuelPassiveId | null) => (p === 'cavalry-surge' ? 1 : 0);
  const cowsFoeGuard = (p: DuelPassiveId | null) => (p === 'overlord-aura' || p === 'thunderous-roar' ? 2 : 0);
  const cowsFoeStam = (p: DuelPassiveId | null) => (p === 'overlord-aura' ? 10 : 0);
  return {
    // 車輪戰 floors a winded fighter at 30; 霸王色 then docks the FOE of an
    // aura-bearer a further 10 (so a fresh foe opens at 90, a spent one at 20).
    aStamina: Math.max(30, 100 - aStaminaPenalty) - cowsFoeStam(dPass),
    dStamina: Math.max(30, 100 - dStaminaPenalty) - cowsFoeStam(aPass),
    // 弓·先發制人 / 駿馬·先發 / 西涼鐵騎 open with a banked 氣; an aura-bearer's foe
    // opens a 氣 down.
    // 武學·蓄勢 — a 大成+ master opens with the initiative already banked.
    aGuard: Math.max(0, (weaponIsRanged(aClass) ? 1 : 0) + aCharge + surge(aPass) + martialBonus(attacker).openingGuard - cowsFoeGuard(dPass)),
    dGuard: Math.max(0, (weaponIsRanged(dClass) ? 1 : 0) + dCharge + surge(dPass) + martialBonus(defender).openingGuard - cowsFoeGuard(aPass)),
    // 鬥將生涯 — recognised duellists fight above their stat line (段位 + 百戰).
    // 流派相剋 — a trained school that answers the foe's adds its counter edge.
    aStatic: staticProwess(attacker) + aCareer + schoolCounterEdge(aClass, dClass, martialXiuwei(attacker)),
    dStatic: staticProwess(defender) + dCareer + schoolCounterEdge(dClass, aClass, martialXiuwei(defender)),
    // 目眇 — a half-blind fighter reads the foe far worse (drives the AI's 料敵).
    aInt: attacker.stats.intelligence - (duelScars(attacker).includes('maimed-eye') ? 25 : 0),
    dInt: defender.stats.intelligence - (duelScars(defender).includes('maimed-eye') ? 25 : 0),
    aMoves: [], dMoves: [],
    aChain: [], dChain: [],
    aSpirit: 0, dSpirit: 0, aUltUsed: false, dUltUsed: false,
    // 兵器絕技,無則流派絕學 — a famed weapon's art first; else a 大成+ arm
    // carries their school's signature stroke (§6.10) even with a plain blade.
    aArt: weaponArtFor(attacker) ?? schoolSecretArt(aClass, martialXiuwei(attacker)),
    dArt: weaponArtFor(defender) ?? schoolSecretArt(dClass, martialXiuwei(defender)),
    aEvolvedArt: evolvedWeaponArt(attacker) != null, dEvolvedArt: evolvedWeaponArt(defender) != null,
    aUlt: signatureUlt(attacker), dUlt: signatureUlt(defender),
    aMountSavior: mountEdge(attacker) === 'savior', dMountSavior: mountEdge(defender) === 'savior',
    aMountSaved: false, dMountSaved: false,
    aPassive: aPass, dPassive: dPass, aUndyingUsed: false, dUndyingUsed: false,
    aFlaw: 0, dFlaw: 0,
    aMounted: mountEdge(attacker) !== null, dMounted: mountEdge(defender) !== null,
    aUnhorsed: false, dUnhorsed: false,
    aClass, dClass,
    aPersona: duelPersona(attacker), dPersona: duelPersona(defender),
    terrain,
    difficulty,
    round: 0, over: false,
  };
}

export interface DuelRoundResult {
  bout: DuelBout;
  roundWinner: 'attacker' | 'defender' | 'draw';
  dmgToAttacker: number;
  dmgToDefender: number;
  /** 缴械 — set to the side whose weapon was knocked aside by a 架 parry. */
  disarm?: 'attacker' | 'defender';
  /** 連招 — set when a side lands its 3rd+ consecutive offensive strike. A named
   *  chain (斬→突刺→奮) bites deepest; any chain ≥3 jars the foe's guard open. */
  combo?: { side: 'attacker' | 'defender'; length: number; named: boolean };
  /** 必殺技 — set to the side that unleashed an unstoppable 武魂 finisher. */
  ultimate?: 'attacker' | 'defender';
  /** 的盧救主 — set to the side whose wonder-horse just bore them clear of death. */
  mountSaved?: 'attacker' | 'defender';
  /** 挑落下馬 — set to the side just unhorsed by a parry-disarm (steed's edge lost). */
  unhorsed?: 'attacker' | 'defender';
}

/** Whether a side may unleash its 必殺技 right now (gauge full, not yet spent). */
export function ultReady(bout: DuelBout, side: 'attacker' | 'defender'): boolean {
  return side === 'attacker'
    ? bout.aSpirit >= SPIRIT_MAX && !bout.aUltUsed
    : bout.dSpirit >= SPIRIT_MAX && !bout.dUltUsed;
}

/** 連段必殺 — the set sequence that pays the biggest 連招 bonus. */
const NAMED_CHAIN: DuelMove[] = ['slash', 'thrust', 'power'];
const endsWithSeq = (chain: DuelMove[], seq: DuelMove[]): boolean =>
  seq.length <= chain.length && seq.every((m, i) => chain[chain.length - seq.length + i] === m);

/** 必殺一擊 — the damage (and side-effects) of a signature finisher. The blow is
 *  unstoppable; its `kind` colours how: 拖刀計 bites a defender, 七進七出 cuts
 *  through and out (回氣力), 無雙/斷橋 shatters the foe's 武魂, 百步穿楊 strikes
 *  with deadly precision. */
interface UltOutcome { dmg: number; selfRecover: number; drainFoeSpirit: boolean; }
function ultStrike(ult: SignatureUlt | null, foeMove: DuelMove, selfP: number, foeP: number, rng: () => number): UltOutcome {
  const base = STRIKE_DMG.ultimate ?? 64;
  const edge = Math.max(-6, Math.min(14, (selfP - foeP) * 0.35));
  let dmg = base + edge + rng() * 8;
  let selfRecover = 0;
  let drainFoeSpirit = false;
  switch (ult?.kind ?? 'power') {
    case 'feint':  if (isDefenseMove(foeMove)) dmg *= 1.5; break;       // 拖刀計 — baits a guard
    case 'multi':  dmg *= 1.2; selfRecover = 12; break;                 // 七進七出 — break through & out
    case 'volley': dmg *= 1.25; break;                                  // 百步穿楊 — precision
    case 'sunder': drainFoeSpirit = true; break;                        // 無雙/斷橋 — shatter the foe's 武魂
    default: break;                                                     // 奮命一擊 — generic
  }
  return { dmg: Math.max(6, Math.round(dmg)), selfRecover, drainFoeSpirit };
}

/** Resolve one exchange. attacker/defender each commit a move. */
export function duelRound(
  bout: DuelBout,
  aMove: DuelMove,
  dMove: DuelMove,
  rng: () => number = Math.random,
): DuelRoundResult {
  const b: DuelBout = { ...bout };
  if (b.over) return { bout: b, roundWinner: 'draw', dmgToAttacker: 0, dmgToDefender: 0 };
  // Record the exchange so a reading mind has a habit to exploit next round.
  b.aMoves = [...bout.aMoves, aMove];
  b.dMoves = [...bout.dMoves, dMove];
  const spendCost = (m: DuelMove): number => (m === 'power' ? POWER_GUARD_COST : m === 'combo' ? COMBO_COST : m === 'thrust' ? THRUST_COST : 0);
  b.aGuard = Math.max(0, b.aGuard - spendCost(aMove));
  b.dGuard = Math.max(0, b.dGuard - spendCost(dMove));

  // A clean strike's damage. Near-decisive: the matrix already chose the victim;
  // a stronger arm and a small die only set how hard, never flip it. A matching
  // 兵器絕技 bites ~32% deeper.
  const strike = (move: DuelMove, winP: number, loseP: number, art: WeaponArt | null): number => {
    const base = STRIKE_DMG[move] ?? 20;
    const edge = Math.max(-6, Math.min(14, (winP - loseP) * 0.35));
    const mul = art && art.kind === move ? 1.32 : 1;
    return Math.max(6, Math.round((base + edge + rng() * 8) * mul));
  };
  const chip = (): number => Math.round(8 + rng() * 6);

  let roundWinner: 'attacker' | 'defender' | 'draw' = 'draw';
  let dmgToAttacker = 0, dmgToDefender = 0;
  let aGuardGain = 0, dGuardGain = 0, aRecover = 0, dRecover = 0;
  let disarm: 'attacker' | 'defender' | undefined;
  let unhorsed: 'attacker' | 'defender' | undefined;
  // 無雙/斷橋 — a 'sunder' ult drains the foe's 武魂; applied AFTER the spirit
  // recompute below so the foe doesn't refill from the blow they just took.
  let drainASpirit = false, drainDSpirit = false;

  if (aMove === 'ultimate' || dMove === 'ultimate') {
    // ── 必殺技 — an unstoppable 武魂 finisher. No defense turns it aside; both
    // sides landing their ult in the same exchange simply trade huge blows. A
    // named hero's signature (拖刀計/七進七出/無雙…) bends the blow — see ultStrike.
    if (aMove === 'ultimate') {
      const u = ultStrike(b.aUlt, dMove, b.aStatic, b.dStatic, rng);
      // 器魂加持 — an awakened (·神) weapon lends the finisher a fifth more bite
      // (E2) AND a 震魂 quality: it always shatters the foe's 武魂, denying THEM a
      // finisher (F2) — a qualitative upgrade, not just a bigger number.
      dmgToDefender = b.aEvolvedArt ? Math.round(u.dmg * 1.2) : u.dmg;
      b.dGuard = 0; aRecover += u.selfRecover; if (u.drainFoeSpirit || b.aEvolvedArt) drainDSpirit = true;
    }
    if (dMove === 'ultimate') {
      const u = ultStrike(b.dUlt, aMove, b.dStatic, b.aStatic, rng);
      dmgToAttacker = b.dEvolvedArt ? Math.round(u.dmg * 1.2) : u.dmg;
      b.aGuard = 0; dRecover += u.selfRecover; if (u.drainFoeSpirit || b.dEvolvedArt) drainASpirit = true;
    }
    roundWinner = dmgToDefender > dmgToAttacker ? 'attacker' : dmgToAttacker > dmgToDefender ? 'defender' : 'draw';
  } else if (isSpecialMove(aMove) || isSpecialMove(dMove)) {
    // ── 招式·特技 (taunt / thrust / combo) — resolved apart from the base ring ──
    if (aMove === 'taunt' || dMove === 'taunt') {
      // 挑釁 — bank 氣 & catch a breath, UNLESS the foe pressed an attack home,
      // in which case it lands clean (no guard up). Mutual taunt / taunt-vs-
      // defense is safe posturing for the taunter.
      const settleTaunt = (taunterIsA: boolean) => {
        const foe = taunterIsA ? dMove : aMove;
        if (isOffensiveMove(foe)) {
          // Punished: the foe's blow lands clean on the open taunter.
          const foeP = taunterIsA ? b.dStatic : b.aStatic;
          const selfP = taunterIsA ? b.aStatic : b.dStatic;
          const foeArt = taunterIsA ? b.dArt : b.aArt;
          const dmg = strike(foe, foeP, selfP, foeArt);
          if (taunterIsA) { dmgToAttacker = dmg; roundWinner = 'defender'; }
          else { dmgToDefender = dmg; roundWinner = 'attacker'; }
        } else {
          // Safe — bank 氣 and recover. The foe (defending or also taunting)
          // gets their own defensive 氣 / breath.
          if (taunterIsA) { aGuardGain += TAUNT_BANK; aRecover += TAUNT_RECOVER; }
          else { dGuardGain += TAUNT_BANK; dRecover += TAUNT_RECOVER; }
        }
      };
      if (aMove === 'taunt') settleTaunt(true);
      if (dMove === 'taunt') settleTaunt(false);
      // A defending foe still banks its defensive 氣 / dodge breath.
      if (aMove === 'taunt' && isDefenseMove(dMove)) { dGuardGain += DEFENSE_GUARD[dMove]; if (dMove === 'dodge') dRecover += 5; }
      if (dMove === 'taunt' && isDefenseMove(aMove)) { aGuardGain += DEFENSE_GUARD[aMove]; if (aMove === 'dodge') aRecover += 5; }
    } else if (isOffensiveMove(aMove) && isOffensiveMove(dMove)) {
      // Two committed strikes (≥1 special) — a hard trade. Both land; the
      // crisper blow wins and blunts half of the other's.
      let aDmg = strike(aMove, b.aStatic, b.dStatic, b.aArt);
      let dDmg = strike(dMove, b.dStatic, b.aStatic, b.dArt);
      if (aDmg > dDmg) dDmg = Math.round(dDmg * 0.5);
      else if (dDmg > aDmg) aDmg = Math.round(aDmg * 0.5);
      dmgToDefender = aDmg; dmgToAttacker = dDmg;
      roundWinner = aDmg > dDmg ? 'attacker' : dDmg > aDmg ? 'defender' : 'draw';
    } else {
      // One special offence (thrust/combo) vs a defense — the defender is the
      // non-special side. Resolve by the special's rules.
      const atkIsA = isDefenseMove(dMove);
      const atk = atkIsA ? aMove : dMove;     // 'thrust' | 'combo'
      const def = atkIsA ? dMove : aMove;     // 'guard' | 'dodge' | 'parry'
      const atkP = atkIsA ? b.aStatic : b.dStatic;
      const defP = atkIsA ? b.dStatic : b.aStatic;
      const atkArt = atkIsA ? b.aArt : b.dArt;
      let atkLands = 0, defLands = 0, defBank = 0, defRec = 0;
      let win: 'atk' | 'def' = 'atk';
      if (atk === 'thrust') {
        if (def === 'guard') { defBank = 1; defLands = chip(); win = 'def'; } // 格 stops the thrust — recoil
        else { atkLands = strike('thrust', atkP, defP, atkArt); if (def === 'dodge') defRec = 5; } // slips 閃/架
      } else { // combo — a flurry no single guard fully stops
        const full = strike('combo', atkP, defP, atkArt);
        if (def === 'guard') { atkLands = Math.round(full * 0.5); defBank = 1; }
        else if (def === 'dodge') { atkLands = Math.round(full * 0.6); defRec = 4; }
        else { atkLands = Math.round(full * 0.6); defBank = 2; defLands = Math.round(9 + rng() * 4); } // 架 deflects one, ripostes
      }
      if (atkIsA) {
        dmgToDefender = atkLands; dmgToAttacker = defLands; dGuardGain += defBank; dRecover += defRec;
        roundWinner = win === 'atk' ? 'attacker' : 'defender';
      } else {
        dmgToAttacker = atkLands; dmgToDefender = defLands; aGuardGain += defBank; aRecover += defRec;
        roundWinner = win === 'atk' ? 'defender' : 'attacker';
      }
    }
  } else if (aMove === 'power' || dMove === 'power') {
    if (aMove === 'power' && dMove === 'power') {
      dmgToDefender = strike('power', b.aStatic, b.dStatic, b.aArt);
      dmgToAttacker = strike('power', b.dStatic, b.aStatic, b.dArt);
      roundWinner = dmgToDefender >= dmgToAttacker ? 'attacker' : 'defender';
    } else if (aMove === 'power') {
      if (dMove === 'guard') { dGuardGain = 1; dmgToAttacker = chip(); roundWinner = 'defender'; } // blocked — recoil
      else { dmgToDefender = strike('power', b.aStatic, b.dStatic, b.aArt); roundWinner = 'attacker'; }
    } else { // dMove === 'power'
      if (aMove === 'guard') { aGuardGain = 1; dmgToDefender = chip(); roundWinner = 'attacker'; }
      else { dmgToAttacker = strike('power', b.dStatic, b.aStatic, b.dArt); roundWinner = 'defender'; }
    }
  } else if (isAttackMove(aMove) && isAttackMove(dMove)) {
    if (aMove === dMove) { dmgToAttacker = chip(); dmgToDefender = chip(); roundWinner = 'draw'; } // mirror clash
    else if (ATTACK_BEATS[aMove] === dMove) { dmgToDefender = strike(aMove, b.aStatic, b.dStatic, b.aArt); roundWinner = 'attacker'; }
    else { dmgToAttacker = strike(dMove, b.dStatic, b.aStatic, b.dArt); roundWinner = 'defender'; }
  } else if (isDefenseMove(aMove) && isDefenseMove(dMove)) {
    // Wary circling — both catch their breath; 閃 dodge recovers a little 氣力.
    aGuardGain = DEFENSE_GUARD[aMove]; dGuardGain = DEFENSE_GUARD[dMove];
    aRecover = aMove === 'dodge' ? 4 : 0; dRecover = dMove === 'dodge' ? 4 : 0;
    roundWinner = 'draw';
  } else {
    // One attacks, one defends.
    const aAttacks = isAttackMove(aMove);
    const atk = aAttacks ? aMove : dMove;
    const def = aAttacks ? dMove : aMove;
    const atkP = aAttacks ? b.aStatic : b.dStatic;
    const defP = aAttacks ? b.dStatic : b.aStatic;
    const atkArt = aAttacks ? b.aArt : b.dArt;

    if (ATTACK_PUNISHES[atk] === def) {
      // Wrong guess — the strike lands big on the defender.
      const dmg = strike(atk, atkP, defP, atkArt);
      if (aAttacks) { dmgToDefender = dmg; roundWinner = 'attacker'; }
      else { dmgToAttacker = dmg; roundWinner = 'defender'; }
    } else {
      // Defense holds. 架 parry ripostes; 蛇矛破守 chips a 格-guarding foe.
      const gain = DEFENSE_GUARD[def];
      const riposte = def === 'parry' ? Math.round(9 + rng() * 5) : 0;
      const pierce = def === 'guard' && atkArt?.kind === 'pierce' ? 9 : 0;
      // 缴械 — a parry that holds can rip the attacker's weapon aside: a sharper
      // arm disarms more often. The victim is staggered and loses all banked 氣.
      const canDisarm = def === 'parry' && rng() < 0.22 + Math.max(0, Math.min(0.2, (defP - atkP) * 0.004));
      // 挑落下馬 — a disarm against a still-mounted fighter unhorses them: a heavier
      // fall (extra stagger) and the steed's edge is lost (no 的盧救主 on the ground).
      const victimMounted = canDisarm && (aAttacks ? (b.aMounted && !b.aUnhorsed) : (b.dMounted && !b.dUnhorsed));
      const stagger = (canDisarm ? Math.round(10 + rng() * 6) : 0) + (victimMounted ? Math.round(8 + rng() * 6) : 0);
      if (aAttacks) {
        dGuardGain += gain; if (def === 'dodge') dRecover = 5;
        dmgToAttacker += riposte + stagger; dmgToDefender += pierce; roundWinner = 'defender';
        if (canDisarm) { disarm = 'attacker'; b.aGuard = 0; if (victimMounted) { b.aUnhorsed = true; b.aMountSavior = false; unhorsed = 'attacker'; } }
      } else {
        aGuardGain += gain; if (def === 'dodge') aRecover = 6;
        dmgToDefender += riposte + stagger; dmgToAttacker += pierce; roundWinner = 'attacker';
        if (canDisarm) { disarm = 'defender'; b.dGuard = 0; if (victimMounted) { b.dUnhorsed = true; b.dMountSavior = false; unhorsed = 'defender'; } }
      }
    }
  }

  // ── 兵器特性 — each weapon class flavours the exchange ──────────────────────
  // 斧·破甲: an axe chips a 格-guarding foe even when the blow is turned aside.
  if (isAttackMove(aMove) && dMove === 'guard' && ATTACK_PUNISHES[aMove] !== 'guard' && b.aClass === 'axe')
    dmgToDefender += Math.round(STRIKE_DMG[aMove] * 0.4);
  if (isAttackMove(dMove) && aMove === 'guard' && ATTACK_PUNISHES[dMove] !== 'guard' && b.dClass === 'axe')
    dmgToAttacker += Math.round(STRIKE_DMG[dMove] * 0.4);
  // 矛·一寸長: a spear wins a mirrored clash on reach (and isn't traded into).
  if (isAttackMove(aMove) && aMove === dMove) {
    if (b.aClass === 'spear' && b.dClass !== 'spear') { dmgToDefender = strike(aMove, b.aStatic, b.dStatic, b.aArt); dmgToAttacker = 0; roundWinner = 'attacker'; }
    else if (b.dClass === 'spear' && b.aClass !== 'spear') { dmgToAttacker = strike(dMove, b.dStatic, b.aStatic, b.dArt); dmgToDefender = 0; roundWinner = 'defender'; }
  }
  // 偃月刀: a sweeping slash/cleave from a glaive cuts ~20% deeper.
  if (dmgToDefender > 0 && b.aClass === 'glaive' && (aMove === 'slash' || aMove === 'cleave')) dmgToDefender = Math.round(dmgToDefender * 1.2);
  if (dmgToAttacker > 0 && b.dClass === 'glaive' && (dMove === 'slash' || dMove === 'cleave')) dmgToAttacker = Math.round(dmgToAttacker * 1.2);
  // 雙劍·追擊: a landed twin-blade strike flurries a second small cut.
  if (dmgToDefender > 0 && b.aClass === 'twinblade' && isAttackMove(aMove)) dmgToDefender += 6;
  if (dmgToAttacker > 0 && b.dClass === 'twinblade' && isAttackMove(dMove)) dmgToAttacker += 6;
  // 重兵器·震懾: a landed greatsword blow hits harder and jars a 氣 point loose.
  if (dmgToDefender > 0 && b.aClass === 'greatsword' && isAttackMove(aMove)) { dmgToDefender += 7; b.dGuard = Math.max(0, b.dGuard - 1); }
  if (dmgToAttacker > 0 && b.dClass === 'greatsword' && isAttackMove(dMove)) { dmgToAttacker += 7; b.aGuard = Math.max(0, b.aGuard - 1); }
  // 弓·騎射: a bow's base attack that's turned aside still harasses a few 氣力 —
  // an archer keeps chipping from range even when the foe defends well.
  if (b.aClass === 'bow' && isAttackMove(aMove) && isDefenseMove(dMove) && ATTACK_PUNISHES[aMove] !== dMove) dmgToDefender += 4;
  if (b.dClass === 'bow' && isAttackMove(dMove) && isDefenseMove(aMove) && ATTACK_PUNISHES[dMove] !== aMove) dmgToAttacker += 4;
  // 奮·壓制: a landed Overpower knocks all the victim's banked 氣 loose.
  if (aMove === 'power' && dmgToDefender > 0) b.dGuard = 0;
  if (dMove === 'power' && dmgToAttacker > 0) b.aGuard = 0;

  // ── 馬戰 (mounted) — while still ahorse, a long arm reaches (馬上長兵) but the
  // saddle steals some nimbleness (馬上難閃). Ends once 挑落下馬 puts them on foot.
  const aRiding = b.aMounted && !b.aUnhorsed;
  const dRiding = b.dMounted && !b.dUnhorsed;
  const longArm = (c: WeaponClass) => c === 'spear' || c === 'halberd' || c === 'glaive';
  if (aRiding && dmgToDefender > 0 && isAttackMove(aMove) && longArm(b.aClass)) dmgToDefender += 4;
  if (dRiding && dmgToAttacker > 0 && isAttackMove(dMove) && longArm(b.dClass)) dmgToAttacker += 4;
  if (aRiding && aMove === 'dodge') { aRecover = Math.max(0, aRecover - 3); dmgToAttacker += 3; } // 馬上難閃
  if (dRiding && dMove === 'dodge') { dRecover = Math.max(0, dRecover - 3); dmgToDefender += 3; }

  // ── 地形 (terrain) — the ground itself shapes the exchange ──────────────────
  if (b.terrain === 'fire') { dmgToAttacker += 4; dmgToDefender += 4; } // 烈火灼身
  else if (b.terrain === 'mud') { // 泥濘 — lunges & flurries bog down
    if ((aMove === 'thrust' || aMove === 'combo') && dmgToDefender > 0) dmgToDefender = Math.round(dmgToDefender * 0.8);
    if ((dMove === 'thrust' || dMove === 'combo') && dmgToAttacker > 0) dmgToAttacker = Math.round(dmgToAttacker * 0.8);
  } else if (b.terrain === 'bridge') { // 窄橋 — a dodge finds no room; footing chips
    if (aMove === 'dodge') { aRecover = 0; dmgToAttacker += 3; }
    if (dMove === 'dodge') { dRecover = 0; dmgToDefender += 3; }
  } else if (b.terrain === 'rain') { // 雨夜濕滑 — every cut loses a little bite
    if (dmgToDefender > 0 && isAttackMove(aMove)) dmgToDefender = Math.round(dmgToDefender * 0.9);
    if (dmgToAttacker > 0 && isAttackMove(dMove)) dmgToAttacker = Math.round(dmgToAttacker * 0.9);
  }

  // ── 連招 (combo chains) — a side that lands an offensive strike on consecutive
  // rounds builds a 連段. The 3rd+ strike in a row bites 50% deeper and jars the
  // foe's guard wide open (破防); the set sequence 斬→突刺→奮 is a true 連段必殺
  // (×1.8). Any non-landing round (a miss, a block, a defense) breaks the chain.
  let combo: DuelRoundResult['combo'];
  const aLanded = isOffensiveMove(aMove) && roundWinner === 'attacker' && dmgToDefender > 0;
  const dLanded = isOffensiveMove(dMove) && roundWinner === 'defender' && dmgToAttacker > 0;
  const aChain = aLanded ? [...b.aChain, aMove] : [];
  const dChain = dLanded ? [...b.dChain, dMove] : [];
  if (aLanded && aChain.length >= 3) {
    const named = endsWithSeq(aChain, NAMED_CHAIN);
    dmgToDefender = Math.round(dmgToDefender * (named ? 1.8 : 1.5));
    b.dGuard = 0; // 破防
    combo = { side: 'attacker', length: aChain.length, named };
  }
  if (dLanded && dChain.length >= 3) {
    const named = endsWithSeq(dChain, NAMED_CHAIN);
    dmgToAttacker = Math.round(dmgToAttacker * (named ? 1.8 : 1.5));
    b.aGuard = 0; // 破防
    combo = { side: 'defender', length: dChain.length, named };
  }
  b.aChain = aChain;
  b.dChain = dChain;

  // ── 獨門 (legendary passives) — the marquee fighters bend the final blow ─────
  // 天下無敵 bites deeper, 死戰 rages when cornered, 無雙's spenders overwhelm,
  // 神射 chips from range, 撼山難 shrugs blows off. Applied to this exchange's
  // settled damage (after weapon traits / terrain / combos).
  // attacker's passive: shapes the blow it DEALS (→ defender) and TAKES (← itself)
  if (b.aPassive === 'matchless-might' && dmgToDefender > 0 && isOffensiveMove(aMove)) dmgToDefender += 7;
  if (b.aPassive === 'last-stand-fury' && b.aStamina < 30 && dmgToDefender > 0) dmgToDefender = Math.round(dmgToDefender * 1.25);
  if (b.aPassive === 'tyrant-might' && dmgToDefender > 0 && (aMove === 'power' || aMove === 'combo' || aMove === 'thrust' || aMove === 'ultimate')) dmgToDefender = Math.round(dmgToDefender * 1.2);
  if (b.aPassive === 'eagle-eye' && b.aClass === 'bow' && isAttackMove(aMove) && isDefenseMove(dMove) && ATTACK_PUNISHES[aMove] !== dMove) dmgToDefender += 5;
  if (b.aPassive === 'immovable' && dmgToAttacker > 0) dmgToAttacker = Math.round(dmgToAttacker * 0.85);
  // defender's passive: mirror (it DEALS → attacker, TAKES ← itself)
  if (b.dPassive === 'matchless-might' && dmgToAttacker > 0 && isOffensiveMove(dMove)) dmgToAttacker += 7;
  if (b.dPassive === 'last-stand-fury' && b.dStamina < 30 && dmgToAttacker > 0) dmgToAttacker = Math.round(dmgToAttacker * 1.25);
  if (b.dPassive === 'tyrant-might' && dmgToAttacker > 0 && (dMove === 'power' || dMove === 'combo' || dMove === 'thrust' || dMove === 'ultimate')) dmgToAttacker = Math.round(dmgToAttacker * 1.2);
  if (b.dPassive === 'eagle-eye' && b.dClass === 'bow' && isAttackMove(dMove) && isDefenseMove(aMove) && ATTACK_PUNISHES[dMove] !== aMove) dmgToAttacker += 5;
  if (b.dPassive === 'immovable' && dmgToDefender > 0) dmgToDefender = Math.round(dmgToDefender * 0.85);

  // ── 破綻 (off-balance) — a blow landed on an off-balance fighter (one who just
  // whiffed) bites up to +50% deeper; then re-tally each side's exposure: whiffing
  // an attack into a hold opens you wide, landing or holding closes you again.
  if (dmgToAttacker > 0 && b.aFlaw > 0) dmgToAttacker = Math.round(dmgToAttacker * (1 + b.aFlaw / 200));
  if (dmgToDefender > 0 && b.dFlaw > 0) dmgToDefender = Math.round(dmgToDefender * (1 + b.dFlaw / 200));
  const flawAfter = (cur: number, mine: DuelMove, iWon: boolean, dealt: number, defended: boolean): number => {
    // whiffed an attack (committed, didn't land, didn't win) → wide open
    if (isOffensiveMove(mine) && !iWon && dealt === 0) return Math.min(100, cur + 20);
    if (isOffensiveMove(mine) && dealt > 0) return Math.max(0, cur - 14); // landed → recovered
    if (defended) return Math.max(0, cur - 9);                            // held → composed
    return Math.max(0, cur - 4);                                          // otherwise drift down
  };
  b.aFlaw = flawAfter(b.aFlaw, aMove, roundWinner === 'attacker', dmgToDefender, isDefenseMove(aMove) && roundWinner !== 'defender');
  b.dFlaw = flawAfter(b.dFlaw, dMove, roundWinner === 'defender', dmgToAttacker, isDefenseMove(dMove) && roundWinner !== 'attacker');

  // ── 武魂 (spirit gauge) — both dealing and weathering blows stoke a fighter's
  // fury; fill the gauge to unleash a 必殺技. An ult spends the whole gauge.
  // 器魂戰技 — an awakened (·神) weapon stokes its bearer's 武魂 +30% faster, so
  // the 必殺技 comes sooner (D2). The spirit is willing when the blade is awake.
  const aSpiritMul = b.aEvolvedArt ? 1.3 : 1;
  const dSpiritMul = b.dEvolvedArt ? 1.3 : 1;
  b.aSpirit = Math.min(SPIRIT_MAX, b.aSpirit + Math.round((dmgToDefender * 0.5 + dmgToAttacker * 0.7) * aSpiritMul));
  b.dSpirit = Math.min(SPIRIT_MAX, b.dSpirit + Math.round((dmgToAttacker * 0.5 + dmgToDefender * 0.7) * dSpiritMul));
  let ultimate: DuelRoundResult['ultimate'];
  if (aMove === 'ultimate') { b.aSpirit = 0; b.aUltUsed = true; ultimate = 'attacker'; }
  if (dMove === 'ultimate') { b.dSpirit = 0; b.dUltUsed = true; ultimate = 'defender'; }
  // 無雙/斷橋 — now shatter the foe's 武魂 (after they refilled from the blow).
  if (drainASpirit) b.aSpirit = 0;
  if (drainDSpirit) b.dSpirit = 0;

  b.aGuard += aGuardGain;
  b.dGuard += dGuardGain;
  b.aStamina = Math.min(100, Math.max(0, b.aStamina - dmgToAttacker + aRecover));
  b.dStamina = Math.min(100, Math.max(0, b.dStamina - dmgToDefender + dRecover));
  // 的盧救主 / 七進七出 — a downed fighter is borne clear of the killing blow once
  // per bout: a wonder-horse (mountSavior) OR 趙雲's innate 七進七出 (undying-valor)
  // floors them at 1 氣力 instead of falling.
  let mountSaved: DuelRoundResult['mountSaved'];
  if (b.aStamina <= 0 && b.aMountSavior && !b.aMountSaved) { b.aStamina = 1; b.aMountSaved = true; mountSaved = 'attacker'; }
  else if (b.aStamina <= 0 && b.aPassive === 'undying-valor' && !b.aUndyingUsed) { b.aStamina = 1; b.aUndyingUsed = true; mountSaved = 'attacker'; }
  if (b.dStamina <= 0 && b.dMountSavior && !b.dMountSaved) { b.dStamina = 1; b.dMountSaved = true; mountSaved = 'defender'; }
  else if (b.dStamina <= 0 && b.dPassive === 'undying-valor' && !b.dUndyingUsed) { b.dStamina = 1; b.dUndyingUsed = true; mountSaved = 'defender'; }
  b.round += 1;

  if (b.aStamina <= 0 || b.dStamina <= 0 || b.round >= MAX_ROUNDS) {
    b.over = true;
    if (b.aStamina <= 0 && b.dStamina <= 0) b.winner = 'draw';
    else if (b.aStamina <= 0) { b.winner = 'defender'; }
    else if (b.dStamina <= 0) { b.winner = 'attacker'; }
    else {
      const gap = Math.abs(b.aStamina - b.dStamina);
      b.winner = gap < 15 ? 'draw' : b.aStamina > b.dStamina ? 'attacker' : 'defender';
    }
    // A knockout (stamina to 0) is lethal; a points win is not.
    if (b.aStamina <= 0 && b.winner === 'defender') b.killedId = 'attacker';
    if (b.dStamina <= 0 && b.winner === 'attacker') b.killedId = 'defender';
  }
  return { bout: b, roundWinner, dmgToAttacker, dmgToDefender, disarm, combo, ultimate, mountSaved, unhorsed };
}

// The best answer to a predicted move: stop an attack with a defense that holds
// (架 parry where it can, to riposte + bank 氣), or punish a defense with the
// attack it can't stop. 奮 power is only stopped by 格 guard.
const COUNTER: Record<DuelMove, DuelMove> = {
  slash: 'parry',   // 斬 — parry holds & ripostes (dodge would be punished)
  cleave: 'guard',  // 劈 — guard holds (parry would be punished)
  sweep: 'parry',   // 掃 — parry holds (guard would be punished)
  guard: 'sweep',   // 格 — swept from below
  dodge: 'slash',   // 閃 — caught by the fast slash
  parry: 'cleave',  // 架 — broken through by the heavy cleave
  power: 'guard',   // 奮 — only the block stops it
  thrust: 'guard',  // 突刺 — only the block stops the lunge
  combo: 'guard',   // 連擊 — guard bleeds the least from the flurry
  taunt: 'slash',   // 挑釁 — punish the open taunter with a fast cut
  ultimate: 'dodge',// 必殺 — unstoppable; nothing truly counters it
};

/** The foe's prevailing habit over their last few moves (random among ties). */
function readHabit(moves: DuelMove[], rng: () => number): DuelMove | null {
  const recent = moves.slice(-4);
  if (recent.length === 0) return null;
  const counts: Partial<Record<DuelMove, number>> = {};
  for (const m of recent) counts[m] = (counts[m] ?? 0) + 1;
  let best: DuelMove[] = [];
  let max = 0;
  for (const m of recent) {
    const c = counts[m] ?? 0;
    if (c > max) { max = c; best = [m]; }
    else if (c === max && !best.includes(m)) best.push(m);
  }
  return best[Math.floor(rng() * best.length)] ?? null;
}

/** AI picks a move. 料敵 — a sharp mind (high 智力) reads the foe's habit (or a
 *  loaded guard threatening 奮) and plays the counter; a 武夫 just fights on
 *  instinct: spend 奮 when banked, otherwise favour attack, guard when battered. */
export function aiDuelMove(bout: DuelBout, side: 'attacker' | 'defender', rng: () => number = Math.random): DuelMove {
  const guard = side === 'attacker' ? bout.aGuard : bout.dGuard;
  const stamina = side === 'attacker' ? bout.aStamina : bout.dStamina;
  const myInt = side === 'attacker' ? bout.aInt : bout.dInt;
  const foeMoves = side === 'attacker' ? bout.dMoves : bout.aMoves;
  const foeGuard = side === 'attacker' ? bout.dGuard : bout.aGuard;

  // Reading the foe scales with intelligence AND the difficulty tier: a rookie
  // barely reads, a veteran counters ~70% at high INT, a peerless foe almost
  // always counters and reliably punishes a loaded 奮.
  const DIFF: Record<DuelDifficulty, { read: number; cap: number; powerRead: number }> = {
    rookie:   { read: 0.45, cap: 0.40, powerRead: 0.25 },
    veteran:  { read: 1.00, cap: 0.72, powerRead: 0.45 },
    peerless: { read: 1.40, cap: 0.92, powerRead: 0.70 },
  };
  const foeStam = side === 'attacker' ? bout.dStamina : bout.aStamina;
  // 必殺·把握戰機 — a rookie just lets the finisher fly; a seasoned foe HOLDS it
  // for the kill (an ult ≈ 64 drops a foe under ~40) and won't waste it early.
  if (ultReady(bout, side)) {
    const canFinish = foeStam <= 40;
    const fire = bout.difficulty === 'rookie' ? 0.85 : canFinish ? 0.96 : 0.42;
    if (rng() < fire) return 'ultimate';
  }

  const d = DIFF[bout.difficulty];
  const readChance = Math.min(d.cap, Math.max(0, (myInt - 40) / 100) * d.read);
  if (rng() < readChance) {
    let predicted: DuelMove | null = null;
    if (foeGuard >= POWER_GUARD_COST && rng() < d.powerRead) predicted = 'power';
    else predicted = readHabit(foeMoves, rng);
    if (predicted) return COUNTER[predicted];
  }

  // 趁勝追擊 — a sharp fighter who has the foe on the ropes (low 氣力) presses the
  // attack to finish, rather than circling; with a full bank, a heavy spender.
  if (foeStam <= 32 && bout.difficulty !== 'rookie' && rng() < 0.6) {
    if (guard >= POWER_GUARD_COST && rng() < 0.7) return 'power';
    return rng() < 0.45 ? 'slash' : rng() < 0.8 ? 'cleave' : 'sweep';
  }

  // 性格 — temperament tunes the instinct play. 均 (balanced) keeps the exact
  // baseline; 猛 presses & spends 氣 freely, 慎 hoards 氣 and falls back on 守,
  // 詐 feints with 挑釁 bluffs and 突刺.
  const persona = side === 'attacker' ? bout.aPersona : bout.dPersona;
  const P: Record<DuelPersona, { power: number; combo: number; thrust: number; taunt: number }> = {
    aggressive: { power: 0.78, combo: 0.66, thrust: 0.30, taunt: 0.0 },
    cautious:   { power: 0.40, combo: 0.32, thrust: 0.20, taunt: 0.0 },
    cunning:    { power: 0.52, combo: 0.50, thrust: 0.52, taunt: 0.28 },
    balanced:   { power: 0.55, combo: 0.50, thrust: 0.30, taunt: 0.0 },
  };
  const p = P[persona];

  if (guard >= POWER_GUARD_COST && rng() < p.power) return 'power';
  // 連擊 — sometimes spend a full bank on a flurry instead of 奮.
  if (guard >= COMBO_COST && rng() < p.combo) return 'combo';
  // 突刺 — a single banked 氣 buys a fast lunge that only 格 stops.
  if (guard >= THRUST_COST && rng() < p.thrust) return 'thrust';
  const r = rng();
  // Battered → favour defense; a 猛 fighter may still swing through it.
  if (stamina < 35) {
    if (persona === 'aggressive' && r > 0.55) return r > 0.8 ? 'cleave' : 'slash';
    return r < 0.4 ? 'guard' : r < 0.7 ? 'parry' : 'dodge';
  }
  // 挑釁 — flush of 氣力 and no bank: gamble a taunt to load a spender. A 詐
  // fighter bluffs far more often (詐 0.28 vs the baseline 0.10).
  const tauntGate = 1 - (persona === 'cunning' ? p.taunt : 0.1);
  if (guard < THRUST_COST && stamina > 55 && r > tauntGate) return 'taunt';
  // 慎 stands off behind a guard even while healthy; 猛 leans on the heavy 劈.
  if (persona === 'cautious' && r > 0.82) return 'guard';
  if (persona === 'aggressive') return r < 0.30 ? 'slash' : r < 0.85 ? 'cleave' : 'sweep';
  return r < 0.45 ? 'slash' : r < 0.72 ? 'cleave' : 'sweep';
}

// ─── 環境借勢 — the ground itself is a weapon, once a bout ────────────────────
// Beyond the passive tilt each 地形 already lends (see DUEL_TERRAIN_INFO), a
// fighter may spend a beat to TURN the terrain on the foe: fling the brazier's
// flames, roar the bridge-planks out from under them (張飛據橋), sling mud into
// the eyes. A one-shot tactical burst — chip 氣力, open a 破綻, sometimes unhorse.

export interface TerrainExploit { zh: string; en: string; descZh: string; descEn: string; }
export const TERRAIN_EXPLOIT: Record<DuelTerrain, TerrainExploit> = {
  plain:  { zh: '揚沙眯目', en: 'Kick Dust', descZh: '揚沙撲敵 — 傷氣力、露破綻', descEn: 'fling grit — chip stamina, open a flaw' },
  bridge: { zh: '據橋斷喝', en: 'Bridge Roar', descZh: '斷喝震橋 — 敵失足重挫,騎者落馬', descEn: 'a thunderous roar staggers the foe — and unhorses a rider' },
  mud:    { zh: '撩泥迷眼', en: 'Sling Mud', descZh: '撩泥迷眼 — 大開破綻、奪其氣', descEn: 'blind the foe — a wide flaw, a 氣 knocked loose' },
  fire:   { zh: '撩火撲面', en: 'Hurl Flame', descZh: '撩火撲面 — 重傷敵,自身微灼', descEn: 'fling the flames — burns the foe, singes you a little' },
  rain:   { zh: '借雨突襲', en: 'Rain Ambush', descZh: '藉雨幕突襲 — 一記奇襲重擊', descEn: 'strike from the rain-curtain — a heavy surprise blow' },
};

export interface DuelExploitResult { bout: DuelBout; dmgToFoe: number; dmgToSelf: number; unhorsed?: 'attacker' | 'defender'; textZh: string; textEn: string; }

/** 環境借勢 — turn the terrain against the foe. Pure; the caller tracks the
 *  once-per-bout limit (mirrors the 暗器/金瘡藥 items). `side` is the exploiter. */
export function applyDuelExploit(bout: DuelBout, side: 'attacker' | 'defender', rng: () => number = Math.random): DuelExploitResult {
  const b: DuelBout = { ...bout };
  const foe = side === 'attacker' ? 'defender' : 'attacker';
  const foeStam = () => (foe === 'attacker' ? b.aStamina : b.dStamina);
  const setFoeStam = (v: number) => { if (foe === 'attacker') b.aStamina = v; else b.dStamina = v; };
  const setSelfStam = (v: number) => { if (side === 'attacker') b.aStamina = v; else b.dStamina = v; };
  const selfStam = () => (side === 'attacker' ? b.aStamina : b.dStamina);
  const bumpFoeFlaw = (n: number) => { if (foe === 'attacker') b.aFlaw = Math.min(100, b.aFlaw + n); else b.dFlaw = Math.min(100, b.dFlaw + n); };
  const dropFoeGuard = (n: number) => { if (foe === 'attacker') b.aGuard = Math.max(0, b.aGuard - n); else b.dGuard = Math.max(0, b.dGuard - n); };
  const foeMounted = (foe === 'attacker' ? b.aMounted && !b.aUnhorsed : b.dMounted && !b.dUnhorsed);
  const ex = TERRAIN_EXPLOIT[b.terrain];
  let dmgToFoe = 0, dmgToSelf = 0;
  let unhorsed: 'attacker' | 'defender' | undefined;
  switch (b.terrain) {
    case 'fire':
      dmgToFoe = 14 + Math.round(rng() * 6); dmgToSelf = 4 + Math.round(rng() * 4);
      bumpFoeFlaw(15);
      break;
    case 'bridge': {
      dmgToFoe = 10 + Math.round(rng() * 6); dropFoeGuard(1); bumpFoeFlaw(28);
      if (foeMounted) {
        dmgToFoe += 8 + Math.round(rng() * 6);
        if (foe === 'attacker') { b.aUnhorsed = true; b.aMountSavior = false; } else { b.dUnhorsed = true; b.dMountSavior = false; }
        unhorsed = foe;
      }
      break;
    }
    case 'mud':
      dmgToFoe = 8 + Math.round(rng() * 5); dropFoeGuard(1); bumpFoeFlaw(32);
      break;
    case 'rain':
      dmgToFoe = 13 + Math.round(rng() * 6); bumpFoeFlaw(12);
      break;
    default: // plain — 揚沙眯目
      dmgToFoe = 8 + Math.round(rng() * 5); bumpFoeFlaw(22);
      break;
  }
  // Never lethal on its own — a setup, not a finisher (floors the foe at 1 氣力).
  setFoeStam(Math.max(1, foeStam() - dmgToFoe));
  if (dmgToSelf) setSelfStam(Math.max(1, selfStam() - dmgToSelf));
  return { bout: b, dmgToFoe, dmgToSelf, unhorsed, textZh: ex.zh, textEn: ex.en };
}

// ─── 部位打擊 — a called shot trades certainty for a decisive effect ──────────
// Rather than trade a blow, a fighter may AIM: 擊械 to knock the foe's weapon
// aside (缴械), or 斬馬 to bring a rider down (挑落下馬). A gamble — a sharper arm
// lands it more often; a whiff leaves the aimer open (破綻). One attempt per bout.

export type AimTarget = 'disarm' | 'unhorse';
export interface DuelAimedResult { bout: DuelBout; ok: boolean; disarm?: 'attacker' | 'defender'; unhorsed?: 'attacker' | 'defender'; dmgToFoe: number; textZh: string; textEn: string; }

/** 部位打擊 — an aimed called shot. Pure; the caller tracks the once-per-bout
 *  limit. `side` is the aimer; `target` picks the effect. */
export function applyAimedStrike(bout: DuelBout, side: 'attacker' | 'defender', target: AimTarget, rng: () => number = Math.random): DuelAimedResult {
  const b: DuelBout = { ...bout };
  const foe = side === 'attacker' ? 'defender' : 'attacker';
  const selfP = side === 'attacker' ? b.aStatic : b.dStatic;
  const foeP = foe === 'attacker' ? b.aStatic : b.dStatic;
  const foeMounted = (foe === 'attacker' ? b.aMounted && !b.aUnhorsed : b.dMounted && !b.dUnhorsed);
  const setFoeStam = (d: number) => { if (foe === 'attacker') b.aStamina = Math.max(1, b.aStamina - d); else b.dStamina = Math.max(1, b.dStamina - d); };
  const clearFoeGuard = () => { if (foe === 'attacker') b.aGuard = 0; else b.dGuard = 0; };
  const bumpSelfFlaw = (n: number) => { if (side === 'attacker') b.aFlaw = Math.min(100, b.aFlaw + n); else b.dFlaw = Math.min(100, b.dFlaw + n); };
  const bumpFoeFlaw = (n: number) => { if (foe === 'attacker') b.aFlaw = Math.min(100, b.aFlaw + n); else b.dFlaw = Math.min(100, b.dFlaw + n); };

  // 斬馬 against a fighter already on foot is wasted breath — auto-miss.
  if (target === 'unhorse' && !foeMounted) {
    bumpSelfFlaw(16);
    return { bout: b, ok: false, dmgToFoe: 0, textZh: '斬馬撲空 — 敵本無馬', textEn: 'the horse-cut finds no rider' };
  }
  const base = target === 'disarm' ? 0.42 : 0.40;
  const chance = Math.max(0.2, Math.min(0.82, base + (selfP - foeP) * 0.004));
  if (rng() >= chance) {
    // Whiffed — overcommitted and wide open.
    bumpSelfFlaw(18);
    return { bout: b, ok: false, dmgToFoe: 0, textZh: target === 'disarm' ? '擊械落空,自身門戶大開' : '斬馬未中,收勢不及', textEn: target === 'disarm' ? 'the disarm misses — you are left open' : 'the horse-cut misses' };
  }
  const stagger = 10 + Math.round(rng() * 6);
  setFoeStam(stagger);
  bumpFoeFlaw(22);
  if (target === 'disarm') {
    clearFoeGuard();
    return { bout: b, ok: true, disarm: foe, dmgToFoe: stagger, textZh: '一擊击械 — 敵兵器脫手!', textEn: 'a clean strike — the foe is disarmed!' };
  }
  // unhorse
  if (foe === 'attacker') { b.aUnhorsed = true; b.aMountSavior = false; } else { b.dUnhorsed = true; b.dMountSavior = false; }
  return { bout: b, ok: true, unhorsed: foe, dmgToFoe: stagger, textZh: '一斬斷馬 — 挑落敵將!', textEn: 'the mount is cut down — the rider falls!' };
}

// ─── 棄馬步戰 — dismount to fight on foot ─────────────────────────────────────
// A rider may swing down and fight afoot (關羽下馬 style): they give up 馬上長兵
// reach AND a 的盧救主 lifeline, but shed the 馬上難閃 penalty (full dodge again)
// and can no longer be 挑落下馬. A real choice — worth it for a non-long-arm rider
// (mounted is pure downside for them) or against a foe who threatens the unhorse.
export function canDismount(bout: DuelBout, side: 'attacker' | 'defender'): boolean {
  return side === 'attacker' ? bout.aMounted && !bout.aUnhorsed : bout.dMounted && !bout.dUnhorsed;
}
/** Dismount a side mid-bout. Pure; the caller tracks that it's a one-time choice. */
export function dismountBout(bout: DuelBout, side: 'attacker' | 'defender'): DuelBout {
  const b: DuelBout = { ...bout };
  if (side === 'attacker') { b.aUnhorsed = true; b.aMountSavior = false; }
  else { b.dUnhorsed = true; b.dMountSavior = false; }
  return b;
}

// ─── 怯戰 — a cornered fighter may break before the killing blow ──────────────
// The AI-controlled loser, driven low on 氣力 and short on 膽氣, may throw down
// their arms (請降) or bolt (落荒而逃) rather than fight on to death. Called each
// round by the interactive host for the foe; returns the break, or null to fight on.
export function checkDuelBreak(bout: DuelBout, side: 'attacker' | 'defender', officer: Officer, rng: () => number = Math.random): DuelFate | null {
  if (bout.over) return null;
  const stam = side === 'attacker' ? bout.aStamina : bout.dStamina;
  if (stam > 24) return null; // only a cornered fighter's nerve is tested
  const v = duelValor(officer);
  // The lower the 氣力 and the thinner the 膽氣, the likelier the break.
  const pBreak = Math.max(0, Math.min(0.5, ((26 - stam) / 26) * (1 - v / 115)));
  if (rng() >= pBreak) return null;
  const fate = duelDeathFate(officer, rng);
  // They didn't die — a 'slain' roll here just means they steel themselves to
  // yield rather than run.
  return fate === 'slain' ? 'yield' : fate;
}
