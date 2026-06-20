import type { Officer } from '../types';
import { ITEMS_BY_ID } from '../data/items';
import { SKILLS_BY_ID } from '../data/skills';
import { effectivePrestigeEffects } from '../data/prestige';

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

export function resolveDuel(input: DuelInput): DuelResult {
  const rng = input.rng ?? Math.random;
  // rollOne gives the display breakdown; subtract its die for the fixed prowess.
  const a = rollOne(input.attacker, rng);
  const d = rollOne(input.defender, rng);
  const aStatic = a.total - a.diceRoll;
  const dStatic = d.total - d.diceRoll;

  let aSt = 100;
  let dSt = 100;
  const rounds: DuelExchange[] = [];
  let knockout: 'attacker' | 'defender' | null = null;

  for (let r = 1; r <= MAX_ROUNDS; r++) {
    const aScore = aStatic + Math.floor(rng() * 20);
    const dScore = dStatic + Math.floor(rng() * 20);
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
    const killedId = knockout === 'attacker' ? input.defender.id : input.attacker.id;
    return {
      attackerRoll: a, defenderRoll: d,
      margin: knockout === 'attacker' ? aSt : dSt,
      winner: knockout, killedId, rounds,
      attackerStamina: aSt, defenderStamina: dSt, knockout: true,
    };
  }

  // Went the distance — decide on remaining stamina.
  const margin = Math.abs(aSt - dSt);
  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  let killedId: string | undefined;
  if (margin >= 15) {
    winner = aSt > dSt ? 'attacker' : 'defender';
    // A decisive stamina gap can be lethal, but reserve most kills for actual
    // knockouts — a points win shouldn't kill officers as freely as it did at 25.
    if (margin >= 40) killedId = winner === 'attacker' ? input.defender.id : input.attacker.id;
  }
  return {
    attackerRoll: a, defenderRoll: d, margin, winner, killedId, rounds,
    attackerStamina: aSt, defenderStamina: dSt, knockout: false,
  };
}

/** Fixed prowess breakdown (war + item + skill + trait), no dice. */
function prowessParts(o: Officer): { itemBonus: number; skillBonus: number; traitBonus: number } {
  let itemBonus = 0;
  for (const id of o.equipment) {
    const it = ITEMS_BY_ID[id];
    if (it?.effects.war) itemBonus += it.effects.war;
  }
  let skillBonus = 0;
  for (const sid of o.skills) {
    const s = SKILLS_BY_ID[sid];
    if (s?.combat?.duelChanceBonus) skillBonus += s.combat.duelChanceBonus * 30;
    if (s?.combat?.warBonus) skillBonus += (s.combat.warBonus ?? 0) * 0.5;
  }
  let traitBonus = 0;
  for (const t of o.traits ?? []) {
    if (t === 'matchless') traitBonus += 25;
    else if (t === 'martial-valor') traitBonus += 12;
    else if (t === 'wrathful') traitBonus += 8;
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
  return Math.round(o.stats.war + p.itemBonus + p.skillBonus + p.traitBonus + effectivePrestigeEffects(o).duelBonus);
}

function rollOne(o: Officer, rng: () => number): DuelRoll {
  const { itemBonus, skillBonus, traitBonus } = prowessParts(o);
  const diceRoll = Math.floor(rng() * 30);
  const total = o.stats.war + itemBonus + skillBonus + traitBonus + diceRoll;
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
};

/** The duel art of the first legendary weapon an officer has equipped, if any. */
export function weaponArtFor(o: Officer): WeaponArt | null {
  for (const id of o.equipment) if (WEAPON_ARTS[id]) return WEAPON_ARTS[id];
  return null;
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
  | 'taunt' | 'thrust' | 'combo';     // 挑釁 / 突刺 / 連擊 — new specials

const ATTACKS: DuelMove[] = ['cleave', 'slash', 'sweep'];
const DEFENSES: DuelMove[] = ['guard', 'dodge', 'parry'];
const SPECIALS: DuelMove[] = ['taunt', 'thrust', 'combo'];
export const isAttackMove = (m: DuelMove): boolean => ATTACKS.includes(m);
export const isDefenseMove = (m: DuelMove): boolean => DEFENSES.includes(m);
export const isSpecialMove = (m: DuelMove): boolean => SPECIALS.includes(m);
/** Any move that closes to strike (base attacks + thrust/combo/power). */
const isOffensiveMove = (m: DuelMove): boolean => isAttackMove(m) || m === 'thrust' || m === 'combo' || m === 'power';

// The one defense each attack BEATS (its blind spot); the other two stop it.
const ATTACK_PUNISHES: Record<string, DuelMove> = { cleave: 'parry', slash: 'dodge', sweep: 'guard' };
// Attack-vs-attack mini ring: key beats value (斬>劈>掃>斬).
const ATTACK_BEATS: Record<string, DuelMove> = { slash: 'cleave', cleave: 'sweep', sweep: 'slash' };
// Base damage a clean strike deals, before prowess gap / die / weapon art.
const STRIKE_DMG: Record<string, number> = { cleave: 34, slash: 26, sweep: 24, power: 42, thrust: 30, combo: 34 };
// 氣 banked by a defense that holds (架 parry banks most; 閃 dodge none).
const DEFENSE_GUARD: Record<string, number> = { guard: 1, parry: 2, dodge: 0 };

// 氣 costs / rewards of the specials.
export const THRUST_COST = 1;
export const COMBO_COST = 2;
const TAUNT_BANK = 2;     // 挑釁 banks this much 氣 when it isn't punished
const TAUNT_RECOVER = 8;  // …and catches this much breath back

// 難度 — how sharply the AI foe reads and counters you.
export type DuelDifficulty = 'rookie' | 'veteran' | 'peerless';

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
  aArt: WeaponArt | null; // 兵器絕技 — a legendary weapon's signature edge
  dArt: WeaponArt | null;
  aClass: WeaponClass; // 兵器 — drives class combat traits (spear reach, axe break…)
  dClass: WeaponClass;
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
): DuelBout {
  const aClass = weaponClassFor(attacker);
  const dClass = weaponClassFor(defender);
  return {
    aStamina: Math.max(30, 100 - aStaminaPenalty),
    dStamina: Math.max(30, 100 - dStaminaPenalty),
    // 弓·先發制人 — an archer opens with a banked 氣 from the ranged volley.
    aGuard: weaponIsRanged(aClass) ? 1 : 0, dGuard: weaponIsRanged(dClass) ? 1 : 0,
    aStatic: staticProwess(attacker), dStatic: staticProwess(defender),
    aInt: attacker.stats.intelligence, dInt: defender.stats.intelligence,
    aMoves: [], dMoves: [],
    aArt: weaponArtFor(attacker), dArt: weaponArtFor(defender),
    aClass, dClass,
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

  if (isSpecialMove(aMove) || isSpecialMove(dMove)) {
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
      const stagger = canDisarm ? Math.round(10 + rng() * 6) : 0;
      if (aAttacks) {
        dGuardGain += gain; if (def === 'dodge') dRecover = 5;
        dmgToAttacker += riposte + stagger; dmgToDefender += pierce; roundWinner = 'defender';
        if (canDisarm) { disarm = 'attacker'; b.aGuard = 0; }
      } else {
        aGuardGain += gain; if (def === 'dodge') aRecover = 6;
        dmgToDefender += riposte + stagger; dmgToAttacker += pierce; roundWinner = 'attacker';
        if (canDisarm) { disarm = 'defender'; b.dGuard = 0; }
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

  b.aGuard += aGuardGain;
  b.dGuard += dGuardGain;
  b.aStamina = Math.min(100, Math.max(0, b.aStamina - dmgToAttacker + aRecover));
  b.dStamina = Math.min(100, Math.max(0, b.dStamina - dmgToDefender + dRecover));
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
  return { bout: b, roundWinner, dmgToAttacker, dmgToDefender, disarm };
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
  const d = DIFF[bout.difficulty];
  const readChance = Math.min(d.cap, Math.max(0, (myInt - 40) / 100) * d.read);
  if (rng() < readChance) {
    let predicted: DuelMove | null = null;
    if (foeGuard >= POWER_GUARD_COST && rng() < d.powerRead) predicted = 'power';
    else predicted = readHabit(foeMoves, rng);
    if (predicted) return COUNTER[predicted];
  }

  if (guard >= POWER_GUARD_COST && rng() < 0.55) return 'power';
  // 連擊 — sometimes spend a full bank on a flurry instead of 奮.
  if (guard >= COMBO_COST && rng() < 0.5) return 'combo';
  // 突刺 — a single banked 氣 buys a fast lunge that only 格 stops.
  if (guard >= THRUST_COST && rng() < 0.3) return 'thrust';
  const r = rng();
  // Battered → favour defense; otherwise press an attack on instinct.
  if (stamina < 35) return r < 0.4 ? 'guard' : r < 0.7 ? 'parry' : 'dodge';
  // 挑釁 — flush of 氣力 and no bank: gamble a taunt to load a spender.
  if (guard < THRUST_COST && stamina > 55 && r > 0.9) return 'taunt';
  return r < 0.45 ? 'slash' : r < 0.72 ? 'cleave' : 'sweep';
}
