/**
 * 計策 — Battle-phase stratagems the commander may deploy.
 *
 * Each stratagem has gating conditions, an INT-based success roll, and a
 * combat effect. Selected pre-battle when conditions are met.
 *
 * Note: file named stratagems2 to avoid colliding with the older
 * pre-existing stratagems.ts (cosmetic display only).
 */
import type { Officer, City } from '../types';
import type { Weather } from '../systems/weather';

export type BattleStratagemId =
  | 'fire-attack'        // 火攻
  | 'flood-attack'       // 水攻
  | 'ambush'             // 埋伏
  | 'feigned-retreat'    // 偽退
  | 'sow-discord'        // 反間
  | 'night-raid'         // 偷營
  | 'cut-supply'         // 截糧
  | 'false-surrender'    // 詐降
  // ── Phase 65: 15 more battle stratagems with real effects ──
  | 'last-stand'         // 死戰 — when own troops low, +30% power
  | 'iron-wall'          // 鐵壁 — defensive boost when defending
  | 'rush'               // 突進 — cavalry charge bonus
  | 'fire-arrow'         // 火矢 — mild fire attack
  | 'thunder'            // 雷震 — stun debuff to defender
  | 'beauty-plot'        // 美人計 — defender low-loyalty
  | 'chain-stratagem'    // 連環計 — multiple defender debuffs
  | 'half-cross'         // 半渡而擊 — river crossing strike
  | 'set-ambush-path'    // 設伏要道 — terrain ambush
  | 'press-pursuit'      // 趁勢追擊 — when defender weak
  | 'sneak-cross'        // 暗渡陳倉 — INT-superior flank
  | 'lure-tiger'         // 調虎離山 — lure commander out
  | 'cut-supply-strike'  // 釜底抽薪 — supply strike
  | 'besiege-relief'     // 圍魏救趙 — indirect pressure
  | 'wait-tired';        // 以逸待勞 — counter-attack bonus

export interface StratagemDef {
  id: BattleStratagemId;
  name: { zh: string; en: string };
  description: string;
  descriptionZh?: string;
  /** Officer INT threshold to even attempt. */
  minIntelligence: number;
  /** Per-condition gate — returns true if usable in this battle context. */
  isApplicable: (ctx: StratagemContext) => boolean;
  /** Returns combat effect multipliers when stratagem succeeds. */
  successEffect: StratagemEffect;
  /** Cost if stratagem fails (still rolls). */
  failurePenalty?: { attackerPowerMul?: number; ownLossMul?: number };
}

export interface StratagemContext {
  attacker: Officer;
  defender: Officer | null;
  attackerTroops: number;
  defenderTroops: number;
  city: City;
  weather: Weather;
  /** Sum INT of attacker + companions, averaged. */
  attackerIntelligence: number;
  /** Same for defender side. */
  defenderIntelligence: number;
  /** Average defender loyalty (for 詐降). */
  defenderAvgLoyalty: number;
}

export interface StratagemEffect {
  attackerPowerMul?: number;     // boost attacker raw power
  defenderPowerMul?: number;     // reduce defender power
  ownLossMul?: number;           // reduce attacker losses
  enemyLossMul?: number;         // increase defender losses
  surpriseRoll?: number;         // tilt win roll toward attacker
  /** Captures opportunity (if win): increase capture chance multiplier. */
  captureBonus?: number;
  /** Special: applies a delayed effect across N future seasons. */
  delayedDrain?: { seasons: number; troopsPerSeason: number };
}

export const STRATAGEM_DEFS: Record<BattleStratagemId, StratagemDef> = {
  'fire-attack': {
    id: 'fire-attack',
    name: { zh: '火攻', en: 'Fire Attack' },
    description: '借風縱火 — only viable with strong wind, no rain. Devastating if successful.',
    descriptionZh: "藉風縱火，焚敵營寨。中計者每回合損兵八分，持續三回合；風起倍之，雨中減半。",
    minIntelligence: 75,
    isApplicable: (ctx) =>
      ctx.weather.windPower >= 2 &&
      ctx.weather.kind !== 'rain' &&
      ctx.weather.kind !== 'snow',
    successEffect: {
      attackerPowerMul: 1.40,
      enemyLossMul: 1.50,
      surpriseRoll: 0.15,
    },
    failurePenalty: { ownLossMul: 1.15 }, // backfires on attacker
  },
  'flood-attack': {
    id: 'flood-attack',
    name: { zh: '水攻', en: 'Flood Attack' },
    description: '掘堤淹城 — port/river city required. Reduces defender troops outright.',
    descriptionZh: "掘堤淹城。須臨水之城方可施行，成則大削敵兵。",
    minIntelligence: 80,
    isApplicable: (ctx) => !!ctx.city.port || ctx.city.terrain === 'plain',
    successEffect: {
      defenderPowerMul: 0.65,
      enemyLossMul: 1.35,
    },
    failurePenalty: { ownLossMul: 1.10 },
  },
  'ambush': {
    id: 'ambush',
    name: { zh: '埋伏', en: 'Ambush' },
    description: '林中設伏 — forest/mountain terrain only. Surprise damage + low own losses.',
    descriptionZh: "林中設伏。限山林之地，奇襲建功而我軍損失甚微。",
    minIntelligence: 70,
    isApplicable: (ctx) =>
      ctx.city.terrain === 'mountain' || ctx.city.terrain === 'forest',
    successEffect: {
      attackerPowerMul: 1.25,
      ownLossMul: 0.65,
      surpriseRoll: 0.12,
    },
  },
  'feigned-retreat': {
    id: 'feigned-retreat',
    name: { zh: '偽退', en: 'Feigned Retreat' },
    description: '誘敵深入 — needs attacker INT > defender INT. Reduces defender bonus.',
    descriptionZh: "誘敵深入。我軍智謀須勝敵方，方可削減敵勢。",
    minIntelligence: 78,
    isApplicable: (ctx) =>
      ctx.attackerIntelligence > ctx.defenderIntelligence + 10,
    successEffect: {
      defenderPowerMul: 0.75,
      attackerPowerMul: 1.15,
      enemyLossMul: 1.25,
    },
  },
  'sow-discord': {
    id: 'sow-discord',
    name: { zh: '反間', en: 'Sow Discord' },
    description: '反間之計 — works on any defender. Reduces enemy bond bonuses + power.',
    descriptionZh: "反間之計。離間敵將之心，削弱其同袍羈絆與戰力。",
    minIntelligence: 82,
    isApplicable: () => true,
    successEffect: {
      defenderPowerMul: 0.85,
    },
  },
  'night-raid': {
    id: 'night-raid',
    name: { zh: '偷營', en: 'Night Raid' },
    description: '夜襲敵營 — attacker INT roll. Bypasses city defense partially.',
    descriptionZh: "夜襲敵營。憑智謀一搏，可部分繞過城防。",
    minIntelligence: 70,
    isApplicable: (ctx) => ctx.attackerTroops >= 1000,
    successEffect: {
      surpriseRoll: 0.20,
      enemyLossMul: 1.30,
      // City defense effectively halved — implemented in resolver
    },
    failurePenalty: { ownLossMul: 1.20 },
  },
  'cut-supply': {
    id: 'cut-supply',
    name: { zh: '截糧', en: 'Cut Supply Line' },
    description: '斷其糧道 — drains enemy troops next 3 seasons (delayed effect).',
    descriptionZh: "斷其糧道。三季之內敵軍兵力日漸消耗。",
    minIntelligence: 75,
    isApplicable: (ctx) => ctx.defenderTroops > 3000,
    successEffect: {
      delayedDrain: { seasons: 3, troopsPerSeason: 500 },
      defenderPowerMul: 0.90,
    },
  },
  'false-surrender': {
    id: 'false-surrender',
    name: { zh: '詐降', en: 'False Surrender' },
    description: '詐降之計 — defender loyalty < 50 required. Surprise hit + capture chance.',
    descriptionZh: "詐降之計。須敵將忠誠低於五十，奇襲建功且可俘獲敵將。",
    minIntelligence: 80,
    isApplicable: (ctx) => ctx.defenderAvgLoyalty < 50,
    successEffect: {
      attackerPowerMul: 1.30,
      enemyLossMul: 1.40,
      captureBonus: 1.5,
      surpriseRoll: 0.18,
    },
  },
  // ── Phase 65: 15 more ──
  'last-stand': {
    id: 'last-stand',
    name: { zh: '死戰', en: 'Last Stand' },
    description: '背水一戰 — only when own troops less than enemy. +30% attacker power.',
    descriptionZh: "背水一戰。我寡敵眾之時，戰力增三成。",
    minIntelligence: 60,
    isApplicable: (ctx) => ctx.attackerTroops < ctx.defenderTroops,
    successEffect: { attackerPowerMul: 1.30, ownLossMul: 0.85 },
  },
  'iron-wall': {
    id: 'iron-wall',
    name: { zh: '鐵壁', en: 'Iron Wall' },
    description: '重甲列陣 — turns attack into siege mode: −defender power (slower but safer).',
    descriptionZh: "重甲列陣。轉攻為圍，削敵戰力，雖緩而穩。",
    minIntelligence: 65,
    isApplicable: () => true,
    successEffect: { defenderPowerMul: 0.85, ownLossMul: 0.70 },
  },
  rush: {
    id: 'rush',
    name: { zh: '突進', en: 'Cavalry Surge' },
    description: '騎兵衝鋒 — requires attacker War >= 80. Heavy first-strike.',
    descriptionZh: "騎兵衝鋒。武力八十以上方可施展，破陣於一擊。",
    minIntelligence: 60,
    isApplicable: (ctx) => ctx.attacker.stats.war >= 80,
    successEffect: { attackerPowerMul: 1.25, surpriseRoll: 0.10 },
  },
  'fire-arrow': {
    id: 'fire-arrow',
    name: { zh: '火矢', en: 'Fire Arrows' },
    description: '弓裹火油 — moderate fire attack, less wind-dependent than 火攻.',
    descriptionZh: "弓裹火油。較火攻為輕，受風候影響亦較少。",
    minIntelligence: 65,
    isApplicable: (ctx) =>
      ctx.weather.kind !== 'rain' && ctx.weather.kind !== 'snow',
    successEffect: { attackerPowerMul: 1.18, enemyLossMul: 1.20 },
    failurePenalty: { ownLossMul: 1.08 },
  },
  thunder: {
    id: 'thunder',
    name: { zh: '雷震', en: 'Thunder Strike' },
    description: '雷霆萬鈞 — Daoist thunder stuns defender. INT 80+ required.',
    descriptionZh: "雷霆萬鈞。道法召雷震懾敵將，須智謀八十以上。",
    minIntelligence: 80,
    isApplicable: () => true,
    successEffect: { defenderPowerMul: 0.75 },
  },
  'beauty-plot': {
    id: 'beauty-plot',
    name: { zh: '美人計', en: 'Beauty Plot' },
    description: '美人計 — defender CHA bound roll. Stronger when loyalty < 60.',
    descriptionZh: "美人計。以姿色亂敵心，敵將忠誠低於六十時尤為奏效。",
    minIntelligence: 70,
    // 好色之將自亂 — a lustful enemy commander is vulnerable however loyal he is.
    isApplicable: (ctx) => ctx.defenderAvgLoyalty < 60 || !!(ctx.defender?.traits as string[] | undefined)?.includes('lustful'),
    successEffect: { defenderPowerMul: 0.80, captureBonus: 1.3 },
  },
  'chain-stratagem': {
    id: 'chain-stratagem',
    name: { zh: '連環計', en: 'Chain Stratagem' },
    description: '龐統之計 — chained debuffs, defender attack and defense drop.',
    descriptionZh: "龐統之連環計。多重削弱，使敵攻守俱減。",
    minIntelligence: 90,
    isApplicable: () => true,
    successEffect: { defenderPowerMul: 0.70 },
  },
  'half-cross': {
    id: 'half-cross',
    name: { zh: '半渡而擊', en: 'Strike Mid-River' },
    description: '半渡而擊 — best when target is a port city (river crossing).',
    descriptionZh: "半渡而擊。臨水之城施之，趁敵渡河之半而擊之。",
    minIntelligence: 70,
    isApplicable: (ctx) => !!ctx.city.port,
    successEffect: { attackerPowerMul: 1.30, enemyLossMul: 1.40, surpriseRoll: 0.12 },
  },
  'set-ambush-path': {
    id: 'set-ambush-path',
    name: { zh: '設伏要道', en: 'Ambush the Path' },
    description: '路徑設伏 — terrain must be mountain/forest/pass.',
    descriptionZh: "設伏要道。須地處山林或關隘，伏兵建功。",
    minIntelligence: 75,
    isApplicable: (ctx) =>
      ctx.city.terrain === 'mountain' ||
      ctx.city.terrain === 'forest' ||
      ctx.city.terrain === 'pass',
    successEffect: { attackerPowerMul: 1.22, ownLossMul: 0.60, surpriseRoll: 0.15 },
  },
  'press-pursuit': {
    id: 'press-pursuit',
    name: { zh: '趁勢追擊', en: 'Press the Pursuit' },
    description: '趁勢追擊 — when defender significantly weaker. Annihilation strike.',
    descriptionZh: "趁勢追擊。敵兵已弱之時，一鼓而殲之。",
    minIntelligence: 65,
    isApplicable: (ctx) => ctx.defenderTroops < ctx.attackerTroops * 0.4,
    successEffect: { enemyLossMul: 1.60, captureBonus: 1.4 },
  },
  'sneak-cross': {
    id: 'sneak-cross',
    name: { zh: '暗渡陳倉', en: 'Sneak Across Chen Cang' },
    description: '明修棧道暗渡 — attacker INT must exceed defender by 15+.',
    descriptionZh: "明修棧道，暗渡陳倉。我軍智謀須勝敵方十五以上。",
    minIntelligence: 80,
    isApplicable: (ctx) =>
      ctx.attackerIntelligence > ctx.defenderIntelligence + 15,
    successEffect: { defenderPowerMul: 0.70, surpriseRoll: 0.20 },
  },
  'lure-tiger': {
    id: 'lure-tiger',
    name: { zh: '調虎離山', en: 'Lure the Tiger' },
    description: '調虎離山 — only against high-war defenders. Draws them out of position.',
    descriptionZh: "調虎離山。專制武力八十以上之猛將，誘其離守。",
    minIntelligence: 75,
    isApplicable: (ctx) => !!ctx.defender && ctx.defender.stats.war >= 80,
    successEffect: { defenderPowerMul: 0.65 },
  },
  'cut-supply-strike': {
    id: 'cut-supply-strike',
    name: { zh: '釜底抽薪', en: 'Pull Wood From the Cauldron' },
    description: '釜底抽薪 — cripple enemy supplies. Drain over time.',
    descriptionZh: "釜底抽薪。斷敵糧秣根本，使其兵力日益耗損。",
    minIntelligence: 75,
    isApplicable: (ctx) => ctx.defenderTroops > 4000,
    successEffect: {
      defenderPowerMul: 0.85,
      delayedDrain: { seasons: 3, troopsPerSeason: 600 },
    },
  },
  'besiege-relief': {
    id: 'besiege-relief',
    name: { zh: '圍魏救趙', en: 'Besiege Wei to Save Zhao' },
    description: '圍魏救趙 — indirect pressure. Strong with INT 80+.',
    descriptionZh: "圍魏救趙。以迂為直，智謀八十以上者尤為厲害。",
    minIntelligence: 80,
    isApplicable: () => true,
    successEffect: { defenderPowerMul: 0.82, attackerPowerMul: 1.10 },
  },
  'wait-tired': {
    id: 'wait-tired',
    name: { zh: '以逸待勞', en: 'Wait for the Exhausted' },
    description: '以逸待勞 — when defender has more troops, exhaust them first.',
    descriptionZh: "以逸待勞。敵眾我寡之時，先疲其師而後擊之。",
    minIntelligence: 70,
    isApplicable: (ctx) => ctx.defenderTroops > ctx.attackerTroops * 1.3,
    successEffect: { defenderPowerMul: 0.75, ownLossMul: 0.80 },
  },
};

/**
 * Pick the best applicable stratagem for a side. Returns null if none apply.
 * Prefers higher-effect ones when multiple qualify.
 */
/** 守城之計 — schemes a DEFENDER can throw (the rest are an attacker's plots).
 *  A besieged marshal answers with these (resolved with mirrored semantics). */
export const DEFENSIVE_SCHEMES: ReadonlySet<BattleStratagemId> = new Set<BattleStratagemId>([
  'iron-wall', 'wait-tired', 'last-stand', 'sow-discord', 'ambush', 'false-surrender',
]);

/** 反制 — a defending scheme's effect read from the DEFENDER's point of view:
 *  its "attackerPowerMul/ownLossMul" boost the defender & cut its losses, its
 *  "defenderPowerMul/enemyLossMul" sap the attacker & swell its losses. Returns
 *  an attacker-centric StratagemEffect so it can be merged with the attacker's. */
export function mirrorDefenderEffect(e: StratagemEffect): StratagemEffect {
  return {
    defenderPowerMul: e.attackerPowerMul,   // defender boosts itself
    attackerPowerMul: e.defenderPowerMul,   // defender saps the attacker
    enemyLossMul: e.ownLossMul,             // defender's own losses (= "enemy" of attacker) shrink
    ownLossMul: e.enemyLossMul,             // attacker's losses swell
    surpriseRoll: e.surpriseRoll ? -e.surpriseRoll : undefined, // tilts the roll back to the defender
  };
}

export function pickAutoStratagem(
  ctx: StratagemContext,
  opts?: { only?: ReadonlySet<BattleStratagemId>; exclude?: ReadonlySet<BattleStratagemId> },
): BattleStratagemId | null {
  const candidates = Object.values(STRATAGEM_DEFS).filter(
    (s) => ctx.attackerIntelligence >= s.minIntelligence && s.isApplicable(ctx)
      && (!opts?.only || opts.only.has(s.id)) && !(opts?.exclude?.has(s.id)),
  );
  if (candidates.length === 0) return null;
  // T6 — Score each candidate by:
  //  - minIntelligence (more powerful)
  //  - Whether the attacker actually KNOWS a matching tactic (specialist bonus)
  //  - Trait synergies (fire-tactician + fire-attack, etc.)
  const attackerTactics = new Set(((ctx.attacker as { tactics?: string[] }).tactics) ?? []);
  const attackerTraits = new Set(((ctx.attacker as { traits?: string[] }).traits) ?? []);
  const score = (s: typeof candidates[number]): number => {
    let v = s.minIntelligence;
    if (attackerTactics.has(s.id)) v += 30; // they know it!
    const label = s.id + (s.name?.zh ?? '');
    if (attackerTraits.has('fire-tactician') && /fire|火|燒/i.test(label)) v += 15;
    if (attackerTraits.has('water-tactician') && /water|水|船/i.test(label)) v += 15;
    if (attackerTraits.has('ambush-master') && /ambush|伏|奇襲/i.test(label)) v += 15;
    if (attackerTraits.has('strategist')) v += 5;
    if (attackerTraits.has('cunning')) v += 5;
    return v;
  };
  candidates.sort((a, b) => score(b) - score(a));
  return candidates[0].id;
}

/**
 * 軍師獻策 — the schemes a commander could deploy in this battle (INT-gated &
 * applicable), best-first, with an estimated success chance. Drives the
 * player-facing scheme picker. `max` caps the list (default 4).
 */
export function applicableStratagems(
  ctx: StratagemContext,
  max = 4,
): Array<{ id: BattleStratagemId; name: { zh: string; en: string }; descriptionZh?: string; odds: number }> {
  const list = Object.values(STRATAGEM_DEFS).filter(
    (s) => ctx.attackerIntelligence >= s.minIntelligence && s.isApplicable(ctx),
  );
  // Reuse the same "they know it / theme synergy" preference as the auto-pick.
  const tactics = new Set(((ctx.attacker as { tactics?: string[] }).tactics) ?? []);
  list.sort((a, b) => (b.minIntelligence + (tactics.has(b.id) ? 30 : 0)) - (a.minIntelligence + (tactics.has(a.id) ? 30 : 0)));
  return list.slice(0, max).map((s) => ({
    id: s.id, name: s.name, descriptionZh: s.descriptionZh,
    // rough success estimate (mirrors rollStratagemSuccess's core, sans dice).
    odds: Math.max(0.25, Math.min(0.95, 0.55 + (ctx.attackerIntelligence - s.minIntelligence) * 0.015 - (ctx.defenderIntelligence > 80 ? 0.10 : 0))),
  }));
}

/**
 * Roll whether a stratagem succeeds. Higher attacker INT = better odds;
 * defender INT contests.
 */
export function rollStratagemSuccess(
  strat: StratagemDef,
  ctx: StratagemContext,
  rng: () => number,
): boolean {
  const base = 0.55 + (ctx.attackerIntelligence - strat.minIntelligence) * 0.015;
  const contest = ctx.defenderIntelligence > 80 ? 0.10 : 0;
  // P10 — stratagem-type specialist trait bonuses on the attacker.
  const traits = (ctx.attacker.traits ?? []) as string[];
  let traitBonus = 0;
  if (traits.includes('strategist') || traits.includes('cunning')) traitBonus += 0.08;
  // Element-themed stratagems: fire / water / ambush specialists get +12%.
  const stratLabel = strat.id + (strat.name?.zh ?? '');
  // Element / theme specialists
  if (traits.includes('fire-tactician') && /fire|火|燒|燎/i.test(stratLabel)) traitBonus += 0.12;
  if (traits.includes('water-tactician') && /water|water-attack|水|淹|潰|船|渡/i.test(stratLabel)) traitBonus += 0.12;
  if (traits.includes('ambush-master') && /ambush|伏|奇襲|偷|渡/i.test(stratLabel)) traitBonus += 0.12;
  // T5 — broader trait/tactic synergies
  // Poetic / verbal types boost cultural/word-war stratagems
  if ((traits.includes('poetic-genius') || traits.includes('eloquent'))
      && /tongue|chu-songs|verse|empty-fort|罵|舌戰|楚歌|詠|空城|聲/i.test(stratLabel)) traitBonus += 0.10;
  // Mystical/Daoist boosts spiritual stratagems
  if (traits.includes('mystical')
      && /thunder|seven-lamp|star|eight-gates|qimen|precognition|雷|星|神|燈|遁甲|占/i.test(stratLabel)) traitBonus += 0.12;
  // Composed/defensive types boost holding/feinting stratagems
  if (traits.includes('composed')
      && /empty-fort|iron-wall|wait-tired|feign|defend|hold|空城|鐵壁|以逸|假|守/i.test(stratLabel)) traitBonus += 0.08;
  // Martial-valor types boost charge/duel stratagems
  if ((traits.includes('martial-valor') || traits.includes('matchless'))
      && /charge|gallop|rush|changban|突|衝|奔|騎/i.test(stratLabel)) traitBonus += 0.08;
  // Cunning types boost deception / ruse-style stratagems
  if (traits.includes('cunning')
      && /ruse|hide|deception|feign|borrow|switch|偽|騙|詐|借|易/i.test(stratLabel)) traitBonus += 0.08;
  // Veterans get small bonus to all (experience)
  if (traits.includes('veteran')) traitBonus += 0.05;
  // Defender precognitive sees through plots — extra contest.
  const defenderTraits = ((ctx.defender?.traits ?? []) as string[]);
  const defenderResist = defenderTraits.includes('precognitive') ? 0.15 : 0;
  return rng() < Math.max(0.25, Math.min(0.95, base - contest + traitBonus - defenderResist));
}
