export interface Item {
  id: string;
  name: { en: string; zh: string };
  kind: 'weapon' | 'horse' | 'treasure' | 'book' | 'armor';
  description: string;
  descriptionZh?: string;
  /** Historical origin city — used by `computeLostItems` to scatter items
   *  near where they would have been forged or discovered. Falls back to
   *  a random owned city if absent or not owned by anyone. */
  originCityId?: string;
  effects: {
    leadership?: number;
    war?: number;
    intelligence?: number;
    politics?: number;
    charisma?: number;
  };
  /** One-shot grants when this item is equipped by an officer who doesn't
   *  already have the granted ability. Granted abilities stay even if the
   *  item is unequipped — knowledge keeps. */
  grants?: {
    policy?: string;     // PolicyId
    tactic?: string;     // TacticId
    trait?: string;      // PersonalityTrait
    formation?: string;  // OfficerFormationId
  };
  /** 兵書/秘笈 — a consumable manual. When `study`-ed by an officer it applies
   *  its effect once and is destroyed (not kept as equipment). `xp` floods growth
   *  XP; `latent` lifts the named latent ceiling (and nudges the stat with it);
   *  `skill` teaches an innate skill. A consumable's `effects` are ignored.
   *  See store.studyManual. */
  consumable?: {
    xp?: number;
    latent?: { stat: 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma'; amount: number };
    skill?: string; // SKILLS id
    /** 武學秘籍 — raises the officer's 武學修為 (duel mastery) by this much. */
    xiuwei?: number;
    /** 武學心得 — banks this much spendable duel insight. */
    insight?: number;
    /** 辯經 — raises the officer's 文辯修為 (debate scholarship) by this much. */
    debateXiuwei?: number;
    /** 文辯心得 — banks this much spendable debate insight. */
    debateInsight?: number;
  };
  /** 品階 — optional explicit rarity. When omitted, itemRarity() derives one
   *  from the item's effect magnitude so every item reads in the shared
   *  金/銀/銅 visual language. */
  rarity?: 'gold' | 'silver' | 'bronze';
  /** 鍛造專屬 — when true this item exists ONLY as a forge product: it is never
   *  scattered as a lost item nor handed to a historical officer, so forging it
   *  can never duplicate something already findable in the world. */
  forgeOnly?: boolean;
}

export type ItemRarity = 'gold' | 'silver' | 'bronze';

const RARITY_META: Record<ItemRarity, { zh: string; en: string; color: string }> = {
  gold:   { zh: '神兵', en: 'Legendary', color: '#e6c473' },
  silver: { zh: '寶器', en: 'Fine',      color: '#cfd8e0' },
  bronze: { zh: '良具', en: 'Common',    color: '#c8884e' },
};

/**
 * 寶物品階 — a gold/silver/bronze rarity that mirrors the officer 品階 colours.
 * Uses an explicit `item.rarity` when set, else derives one from the total
 * stat magnitude (a one-shot grant counts as extra heft) so 神兵 like the
 * Sky Piercer read gold while a modest trinket reads bronze.
 */
export function itemRarity(item: Item): ItemRarity {
  if (item.rarity) return item.rarity;
  const e = item.effects;
  let weight = Math.abs(e.war ?? 0) + Math.abs(e.leadership ?? 0) + Math.abs(e.intelligence ?? 0)
    + Math.abs(e.politics ?? 0) + Math.abs(e.charisma ?? 0);
  if (item.grants && Object.keys(item.grants).length > 0) weight += 6;
  if (weight >= 15) return 'gold';
  if (weight >= 9) return 'silver';
  return 'bronze';
}

export function itemRarityMeta(r: ItemRarity): { zh: string; en: string; color: string } {
  return RARITY_META[r];
}

// ─── 精煉 — item refinement ─────────────────────────────────────────────────
/** Max refinement level (+0 … +REFINE_MAX). */
export const REFINE_MAX = 5;

/**
 * 精煉登記 — a denormalized view of the store's `itemRefinements` map. The pure
 * item-effect read sites (combat / duel / damage prediction / the officer sheet)
 * resolve an item's *live* refined stats through `liveItemById` without having
 * to thread the map through every signature. The store is the source of truth
 * and calls `setRefineRegistry` whenever the map changes (refine action, new
 * game, save rehydrate). Defaults empty, so anything that never sets it (tests,
 * old saves) sees base items — identical to the pre-refinement behaviour.
 */
let REFINE_REGISTRY: Record<string, number> = {};
export function setRefineRegistry(map: Record<string, number> | undefined): void {
  REFINE_REGISTRY = map ?? {};
}
export function itemRefineLevel(itemId: string): number {
  const p = REFINE_REGISTRY[itemId] ?? 0;
  return p < 0 ? 0 : p > REFINE_MAX ? REFINE_MAX : p;
}

/**
 * Refined effect magnitudes: each +1 lifts every non-zero stat effect by 15% of
 * its base (rounded, always at least ±1 on a non-zero effect). A +5 神兵 hits
 * ~75% harder — and the boosted magnitude can promote its 品階 tier, so a fully
 * refined 良具 can read 寶器 and demand a worthier wielder (金裝配金將).
 */
export function refinedEffects(item: Item, plus: number): Item['effects'] {
  if (!plus) return item.effects;
  const out: Item['effects'] = {};
  for (const [k, v] of Object.entries(item.effects) as Array<[keyof Item['effects'], number | undefined]>) {
    if (!v) continue;
    out[k] = v + Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * 0.15 * plus));
  }
  return out;
}

// ─── 突破 — item breakthrough stars (beyond +REFINE_MAX) ────────────────────
/** Max breakthrough stars (★0 … ★BREAKTHROUGH_MAX), each beyond full 精煉. */
export const BREAKTHROUGH_MAX = 5;
let BREAKTHROUGH_REGISTRY: Record<string, number> = {};
export function setBreakthroughRegistry(map: Record<string, number> | undefined): void {
  BREAKTHROUGH_REGISTRY = map ?? {};
}
export function itemBreakthroughLevel(itemId: string): number {
  const s = BREAKTHROUGH_REGISTRY[itemId] ?? 0;
  return s < 0 ? 0 : s > BREAKTHROUGH_MAX ? BREAKTHROUGH_MAX : s;
}
/**
 * Each ★ lifts every non-zero effect by 12% of base — stacks on 精煉 — PLUS a
 * milestone surge at ★3 (+10%) and ★5 (+20%), so breakthrough isn't linear:
 * reaching ★3 / ★5 is a real 質變 power spike, not just one more grade.
 */
function breakthroughEffects(effects: Item['effects'], stars: number): Item['effects'] {
  if (!stars) return effects;
  const milestone = (stars >= 5 ? 0.20 : 0) + (stars >= 3 ? 0.10 : 0);
  const factor = 0.12 * stars + milestone;
  const out: Item['effects'] = {};
  for (const [k, v] of Object.entries(effects) as Array<[keyof Item['effects'], number | undefined]>) {
    if (!v) continue;
    out[k] = v + Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * factor));
  }
  return out;
}

// ─── 鑲嵌 — gems socketed into an item ──────────────────────────────────────
export interface Gem {
  id: string;
  name: { en: string; zh: string };
  effects: Item['effects'];
  /** Gold to socket one. */
  cost: number;
  color: string;
}
/** Sockets available on an item, by 品階 (神兵 3 / 寶器 2 / 良具 1). */
export function socketsFor(item: Item): number {
  const r = itemRarity(item);
  return r === 'gold' ? 3 : r === 'silver' ? 2 : 1;
}
let GEM_REGISTRY: Record<string, string[]> = {};
export function setGemRegistry(map: Record<string, string[]> | undefined): void {
  GEM_REGISTRY = map ?? {};
}
export function itemGemIds(itemId: string): string[] {
  return GEM_REGISTRY[itemId] ?? [];
}

// ─── 名器養成 — a weapon's accumulated battle-renown (人器合一) ────────────────
// Carried through battle after battle, a weapon builds a legend: a small growing
// aura on its effects, and a familiarity that eases the 兵器駕馭 grade penalty for
// whoever wields it (see gradeCombat.itemMasteryMul). Stored per-item, denormalised
// into a registry like 精煉/突破/鑲嵌 so the pure read sites resolve through it.
let LORE_REGISTRY: Record<string, number> = {};
export function setLoreRegistry(map: Record<string, number> | undefined): void {
  LORE_REGISTRY = map ?? {};
}
/** Battles this item has been carried through — its 威名. */
export function itemLoreLevel(itemId: string): number {
  const n = LORE_REGISTRY[itemId] ?? 0;
  return n < 0 ? 0 : n;
}
/** 名器稱號 — a storied weapon earns a title as its renown climbs. */
const LORE_TITLES: Array<{ at: number; zh: string; en: string }> = [
  { at: 60, zh: '名器', en: 'Storied' },
  { at: 30, zh: '百戰', en: 'Battle-Worn' },
  { at: 12, zh: '飲血', en: 'Blooded' },
];
export function itemLoreTitle(renown: number): { zh: string; en: string } | null {
  for (const t of LORE_TITLES) if (renown >= t.at) return { zh: t.zh, en: t.en };
  return null;
}
/** 名器光環 — renown gently lifts the item's effects, capped at +8% (~40 battles). */
export function itemLoreAuraMul(renown: number): number {
  return 1 + Math.min(0.08, Math.max(0, renown) * 0.002);
}

// ─── 耗損保養 — a weapon's wear, and the whetstone that undoes it ────────────
// A 神兵 carried through battle after battle dulls: past a threshold its edge
// bites a touch softer until it is 保養'd (whetted) at a forge. Deliberately
// gentle — nothing shows below WEAR_BITE (60 battles' worth), and the worst it
// ever costs is −6% — so it's a whisper of upkeep on your finest arms, never a
// tax on every piece. Stored per-item like 精煉/名器.
export const WEAR_MAX = 100;
export const WEAR_BITE = 60; // wear below this shows nothing
let WEAR_REGISTRY: Record<string, number> = {};
export function setWearRegistry(map: Record<string, number> | undefined): void {
  WEAR_REGISTRY = map ?? {};
}
export function itemWearLevel(itemId: string): number {
  const n = WEAR_REGISTRY[itemId] ?? 0;
  return n < 0 ? 0 : n > WEAR_MAX ? WEAR_MAX : n;
}
/** Effect multiplier from wear — 1 until WEAR_BITE, then down to 0.94 at 100. */
export function itemWearPenaltyMul(wear: number): number {
  return wear <= WEAR_BITE ? 1 : 1 - Math.min(0.06, (wear - WEAR_BITE) * 0.0015);
}
/** Gold to 保養 (whet) a worn blade back to keen — scales with the wear undone. */
export function whetCost(wear: number): number {
  return Math.round(Math.max(0, Math.min(WEAR_MAX, wear)) * 8);
}

// ─── 器魂進化 — the legendary capstone above 突破★5 ──────────────────────────
// A 神兵 (gold rarity) taken to full breakthrough (★5) AND storied renown (名器,
// 60 battles) can 醒器魂 — awaken its spirit — evolving to a named final form:
// its title takes a ·神 suffix and every effect surges once more. A player-only,
// once-per-item rite; the registry is a plain id-set (never AI-repointed).
export const EVOLVE_LORE_REQ = 60;
/** The extra surge an awakened 器魂 lends every effect. */
export const EVOLVE_EFFECT_BOOST = 0.18;
let EVOLVED_REGISTRY = new Set<string>();
export function setEvolvedRegistry(ids: Iterable<string> | undefined): void {
  EVOLVED_REGISTRY = new Set(ids ?? []);
}
export function itemIsEvolved(itemId: string): boolean {
  return EVOLVED_REGISTRY.has(itemId);
}
/**
 * 器魂共鳴 — a host fielding several 器魂-awakened (·神) arms resonates: the
 * spirits answer one another. +3% power per awakened weapon beyond the first,
 * capped +6% (three). Symmetric; a small reward for a legendary armoury.
 */
export function evolvedResonanceMul(pool: Array<{ equipment: readonly string[] } | null | undefined>): number {
  let count = 0;
  for (const o of pool) {
    if (!o) continue;
    for (const id of o.equipment) {
      if (ITEMS_BY_ID[id]?.kind === 'weapon' && EVOLVED_REGISTRY.has(id)) count++;
    }
  }
  return count >= 2 ? 1 + Math.min(0.06, 0.03 * (count - 1)) : 1;
}
/** Can this item awaken its 器魂 now? (gold rarity · ★5 · 名器 · not yet evolved) */
export function canEvolveItem(itemId: string): { ok: boolean; reasonZh: string; reasonEn: string } {
  const base = ITEMS_BY_ID[itemId];
  if (!base) return { ok: false, reasonZh: '無此器', reasonEn: 'No such item' };
  if (itemIsEvolved(itemId)) return { ok: false, reasonZh: '器魂已醒', reasonEn: 'Already awakened' };
  if (itemRarity(base) !== 'gold') return { ok: false, reasonZh: '唯神兵可醒器魂', reasonEn: 'Only 神兵 (legendary) can awaken' };
  if (itemBreakthroughLevel(itemId) < BREAKTHROUGH_MAX) return { ok: false, reasonZh: `需突破★${BREAKTHROUGH_MAX}`, reasonEn: `Needs ★${BREAKTHROUGH_MAX} breakthrough` };
  if (itemLoreLevel(itemId) < EVOLVE_LORE_REQ) return { ok: false, reasonZh: `威名未至名器(${EVOLVE_LORE_REQ}戰)`, reasonEn: `Needs 名器 renown (${EVOLVE_LORE_REQ} battles)` };
  return { ok: true, reasonZh: '', reasonEn: '' };
}

// ─── 鍛造詞綴 — 天工偶得 ──────────────────────────────────────────────────────
// A forged piece can leave the anvil bearing a random 詞綴 (affix): a flat bonus
// tempered in by luck. A 神匠 (see forging.smithTier) draws a fine affix more
// often. Stored per-item like 覺醒, folded through liveItem so every read site
// gets it. Purely additive — a lucky forge is simply a better piece.
export interface ForgeAffix {
  id: string;
  name: { zh: string; en: string };
  effects: Partial<Item['effects']>;
}
export const FORGE_AFFIXES: ForgeAffix[] = [
  { id: 'piercing', name: { zh: '破甲', en: 'Armor-Piercing' }, effects: { war: 3 } },
  { id: 'swift', name: { zh: '疾風', en: 'Swift' }, effects: { leadership: 3 } },
  { id: 'bloodthirsty', name: { zh: '嗜血', en: 'Bloodthirsty' }, effects: { war: 4 } },
  { id: 'sturdy', name: { zh: '堅甲', en: 'Sturdy' }, effects: { leadership: 4 } },
  { id: 'clever', name: { zh: '巧智', en: 'Clever' }, effects: { intelligence: 3 } },
  { id: 'balanced', name: { zh: '中和', en: 'Balanced' }, effects: { war: 2, leadership: 2 } },
];
export const FORGE_AFFIXES_BY_ID: Record<string, ForgeAffix> = Object.fromEntries(FORGE_AFFIXES.map((a) => [a.id, a]));

let AFFIX_REGISTRY: Record<string, string[]> = {};
export function setAffixRegistry(map: Record<string, string[]> | undefined): void {
  AFFIX_REGISTRY = map ?? {};
}
export function itemAffixIds(itemId: string): string[] {
  return AFFIX_REGISTRY[itemId] ?? [];
}
/**
 * Roll an affix for a fresh forge: base 22% chance, +12% for a 神匠. On a hit,
 * a masterwork forge (神匠) leans toward the richer affixes. Returns an id or ''.
 */
export function rollForgeAffix(rng: () => number, masterSmith: boolean): string {
  if (rng() >= (masterSmith ? 0.34 : 0.22)) return '';
  // 神匠 draws from the fine end (嗜血/堅甲/破甲/疾風); others draw the full spread.
  const pool = masterSmith
    ? ['bloodthirsty', 'sturdy', 'piercing', 'swift']
    : FORGE_AFFIXES.map((a) => a.id);
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
}

// ─── 兵器覺醒 — at each 威名 milestone (飲血12/百戰30/名器60) the wielder picks
// one of three awakening perks, a flat stat engraved into the blade itself.
// Stored per-item like 精煉/寶石, resolved through liveItemById, so every read
// site (combat, duel, BP, UI) gets it for free. Picks are permanent and may
// repeat — a twice-blooded edge simply cuts deeper.
export interface AwakeningPerk {
  id: string;
  name: { zh: string; en: string };
  descriptionZh: string;
  description: string;
  effects: Partial<Item['effects']>;
}
export const AWAKENING_PERKS: AwakeningPerk[] = [
  { id: 'edge', name: { zh: '鋒鏑淬血', en: 'Blooded Edge' }, descriptionZh: '刃口飲血自礪 — 武力 +3', description: 'The edge remembers blood — War +3.', effects: { war: 3 } },
  { id: 'command', name: { zh: '大將之風', en: 'Marshal\'s Bearing' }, descriptionZh: '執之者威儀自生 — 統率 +3', description: 'It lends its bearer presence — Leadership +3.', effects: { leadership: 3 } },
  { id: 'mind', name: { zh: '玄機內蘊', en: 'Hidden Subtlety' }, descriptionZh: '器中藏鋒,運籌自明 — 智力 +3', description: 'Subtlety folded into the steel — Intelligence +3.', effects: { intelligence: 3 } },
  // 情境系 — no flat stats; each bites in ONE situation (wired at the combat
  // layer via awakeningPerkCountFor): 破陣 amplifies shock stratagems, 拒守
  // deepens the defending stance, 迅捷 lends single-combat wind.
  { id: 'breaker', name: { zh: '破陣', en: 'Line-Breaker' }, descriptionZh: '衝擊謀略(突貫/馳突)傷害 +8%', description: 'Shock stratagems (charge/gallop) hit +8% harder.', effects: {} },
  { id: 'bulwark', name: { zh: '拒守', en: 'Bulwark' }, descriptionZh: '持有者立防時再減傷 5%', description: 'While defending, the bearer takes a further −5%.', effects: {} },
  { id: 'swift', name: { zh: '迅捷', en: 'Swift' }, descriptionZh: '單挑氣力 +5(車輪戰更持久)', description: '+5 duel stamina — the long wind of single combat.', effects: {} },
];

/** How many of `perkId` the bearer's whole kit carries (stacks across items). */
export function awakeningPerkCountFor(equipment: readonly string[], perkId: string): number {
  let n = 0;
  for (const itemId of equipment) {
    for (const aid of itemAwakeningIds(itemId)) if (aid === perkId) n += 1;
  }
  return n;
}
export const AWAKENING_BY_ID: Record<string, AwakeningPerk> = Object.fromEntries(AWAKENING_PERKS.map((p) => [p.id, p]));

let AWAKEN_REGISTRY: Record<string, string[]> = {};
export function setAwakeningRegistry(map: Record<string, string[]> | undefined): void {
  AWAKEN_REGISTRY = map ?? {};
}
export function itemAwakeningIds(itemId: string): string[] {
  return AWAKEN_REGISTRY[itemId] ?? [];
}
/** How many awakening picks this much 威名 has unlocked (0–3). */
export function awakeningSlots(renown: number): number {
  return renown >= 60 ? 3 : renown >= 30 ? 2 : renown >= 12 ? 1 : 0;
}

// ─── 重鑄分解 — smelting a blade back to iron. Rarity sets the base yield;
// sunk 精煉/突破 metal comes back too. The item itself is gone for the
// campaign (destroyedItems) — a hard trade, no infinite loops.
export function smeltIronYield(item: Item, plus = 0, stars = 0): number {
  const r = itemRarity(item);
  const base = r === 'gold' ? 240 : r === 'silver' ? 120 : 60;
  return base + plus * 25 + stars * 80;
}
/** Grant +1 威名 to every weapon / armour / mount in each equipment list (one list
 *  per officer-per-battle, so an officer in two battles seasons their gear twice).
 *  Returns a NEW lore map. Shared by the tactical (store) + strategic (endSeason) hooks. */
export function accrueWeaponLore(prior: Record<string, number>, equipmentLists: string[][]): Record<string, number> {
  const next = { ...prior };
  for (const eq of equipmentLists) {
    for (const itemId of eq) {
      const base = ITEMS_BY_ID[itemId];
      if (base && (base.kind === 'weapon' || base.kind === 'armor' || base.kind === 'horse')) {
        next[itemId] = (next[itemId] ?? 0) + 1;
      }
    }
  }
  return next;
}

/**
 * An item with 精煉 → 突破 → 鑲嵌 all baked into `effects`, in that order:
 * refine and breakthrough scale the base magnitudes; gems then add flat stats.
 * Rarity recomputes from the boosted magnitude (so growth can promote 品階).
 */
export function liveItem(item: Item, plus: number, stars = 0, gemIds: string[] = [], lore = 0, awakenIds: string[] = [], evolved = false, wear = 0, affixIds: string[] = []): Item {
  if (!plus && !stars && gemIds.length === 0 && lore <= 0 && awakenIds.length === 0 && !evolved && wear <= WEAR_BITE && affixIds.length === 0) return item;
  let effects = refinedEffects(item, plus);
  if (stars) effects = breakthroughEffects(effects, stars);
  // 兵器覺醒 — engraved perks are flat adds, folded before the lore aura so a
  // storied blade's renown amplifies them like everything else.
  if (awakenIds.length > 0) {
    effects = { ...effects };
    for (const aid of awakenIds) {
      const perk = AWAKENING_BY_ID[aid];
      if (!perk) continue;
      for (const [k, v] of Object.entries(perk.effects) as Array<[keyof Item['effects'], number | undefined]>) {
        if (!v) continue;
        effects[k] = (effects[k] ?? 0) + v;
      }
    }
  }
  // 鍛造詞綴 — forge-tempered affixes are flat adds, folded with the awakening perks.
  if (affixIds.length > 0) {
    effects = { ...effects };
    for (const aid of affixIds) {
      const affix = FORGE_AFFIXES_BY_ID[aid];
      if (!affix) continue;
      for (const [k, v] of Object.entries(affix.effects) as Array<[keyof Item['effects'], number | undefined]>) {
        if (!v) continue;
        effects[k] = (effects[k] ?? 0) + v;
      }
    }
  }
  if (gemIds.length > 0) {
    effects = { ...effects };
    for (const gid of gemIds) {
      const gem = GEMS_BY_ID[gid];
      if (!gem) continue;
      for (const [k, v] of Object.entries(gem.effects) as Array<[keyof Item['effects'], number | undefined]>) {
        if (!v) continue;
        effects[k] = (effects[k] ?? 0) + v;
      }
    }
    // 寶石共鳴 — sockets filled with the SAME gem resonate: +25% of that gem per
    // matching socket beyond the first (2 同 → +25%, 滿 3 孔 → +50%).
    if (gemIds.length >= 2 && new Set(gemIds).size === 1) {
      const gem = GEMS_BY_ID[gemIds[0]];
      if (gem) {
        const reso = (gemIds.length - 1) * 0.25;
        for (const [k, v] of Object.entries(gem.effects) as Array<[keyof Item['effects'], number | undefined]>) {
          if (!v) continue;
          effects[k] = (effects[k] ?? 0) + Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * reso));
        }
      }
    }
  }
  // 名器光環 — battle-renown lifts every effect by a small, capped factor.
  if (lore > 0) {
    const mul = itemLoreAuraMul(lore);
    if (mul > 1) {
      effects = { ...effects };
      for (const [k, v] of Object.entries(effects) as Array<[keyof Item['effects'], number | undefined]>) {
        if (!v) continue;
        effects[k] = v + Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * (mul - 1)));
      }
    }
  }
  // 耗損 — a worn blade bites softer (only past WEAR_BITE; capped −6%).
  const wearMul = itemWearPenaltyMul(wear);
  if (wearMul < 1) {
    effects = { ...effects };
    for (const [k, v] of Object.entries(effects) as Array<[keyof Item['effects'], number | undefined]>) {
      if (!v) continue;
      effects[k] = Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * wearMul));
    }
  }
  // 器魂 — an awakened spirit surges every effect once more and renames the piece.
  if (evolved) {
    effects = { ...effects };
    for (const [k, v] of Object.entries(effects) as Array<[keyof Item['effects'], number | undefined]>) {
      if (!v) continue;
      effects[k] = v + Math.sign(v) * Math.max(1, Math.round(Math.abs(v) * EVOLVE_EFFECT_BOOST));
    }
    return { ...item, effects, name: { zh: `${item.name.zh}·神`, en: `${item.name.en} · Ascended` } };
  }
  return { ...item, effects };
}

/** Look up an item by id and bake in its registered refinement + breakthrough + gems + 名器威名. */
export function liveItemById(id: string): Item | null {
  const base = ITEMS_BY_ID[id];
  if (!base) return null;
  return liveItem(base, itemRefineLevel(id), itemBreakthroughLevel(id), itemGemIds(id), itemLoreLevel(id), itemAwakeningIds(id), itemIsEvolved(id), itemWearLevel(id), itemAffixIds(id));
}

// ─── 統御信物 — command tokens ──────────────────────────────────────────────
/** Treasures whose bearer marshals the whole host to fight above itself. */
export const COMMAND_TOKEN_IDS = new Set<string>([
  'hufu-tiger-tally', 'shuaiyin-marshal-seal', 'bingfu-command-tally',
  'jieyue-ceremonial-axe', 'lingqi-command-banner',
]);

export function isCommandToken(itemId: string): boolean {
  return COMMAND_TOKEN_IDS.has(itemId);
}

/** 戰場繳獲 — is this a storied enough piece (神兵/寶器/統御信物) that a victor
 *  might strip it from a fallen foe? Common gear isn't worth the looting. */
export function isBattleSpoil(itemId: string): boolean {
  if (COMMAND_TOKEN_IDS.has(itemId)) return true;
  const base = ITEMS_BY_ID[itemId];
  if (!base) return false;
  const r = itemRarity(base);
  return r === 'gold' || r === 'silver';
}

/**
 * 兵科專屬 — each command token favours a fighting arm, so a marshal directs the
 * host they were cut out to lead: 虎符 the horse, 帥印 the foot, 節鉞 the spears,
 * 令旗 the bows; 兵符 (the muster tally) is even-handed ('all'). A unit of the
 * matching arm within the aura gets the fuller bonus (tactical.commandAuraMul).
 */
export const COMMAND_TOKEN_ARM: Record<string, 'cavalry' | 'infantry' | 'spearmen' | 'archers' | 'all'> = {
  'hufu-tiger-tally': 'cavalry',
  'shuaiyin-marshal-seal': 'infantry',
  'bingfu-command-tally': 'all',
  'jieyue-ceremonial-axe': 'spearmen',
  'lingqi-command-banner': 'archers',
};

/**
 * 統御之威 — a side fielding officers who bear command tokens fights above its
 * numbers: +4% power per token-bearer, capped at +8% (two tokens). Pure
 * command aura, on top of the token's own hefty 統率. Symmetric — any side can
 * carry one.
 */
export function commandTokenMultiplier(pool: Array<{ equipment: readonly string[] } | null | undefined>): number {
  let bearers = 0;
  const distinct = new Set<string>();
  for (const o of pool) {
    if (!o) continue;
    const held = o.equipment.find((id) => COMMAND_TOKEN_IDS.has(id));
    if (held) { bearers++; distinct.add(held); }
  }
  let mul = 1 + Math.min(0.08, 0.04 * bearers);
  // 六軍歸心 — three or more DIFFERENT tokens fielded by one host (the full staff
  // of command assembled) resonate for a further +6%. A real assembly goal.
  if (distinct.size >= 3) mul *= 1.06;
  return mul;
}

/** True if a side fields the full 六軍歸心 command staff (≥3 distinct tokens). */
export function hasFullCommandStaff(pool: Array<{ equipment: readonly string[] } | null | undefined>): boolean {
  const distinct = new Set<string>();
  for (const o of pool) {
    if (!o) continue;
    const held = o.equipment.find((id) => COMMAND_TOKEN_IDS.has(id));
    if (held) distinct.add(held);
  }
  return distinct.size >= 3;
}

/** Gold cost to take an item from `plus` → `plus+1` (escalates with rarity + level). */
export function refineCost(item: Item, plus: number): number {
  const r = itemRarity(item);
  const base = r === 'gold' ? 600 : r === 'silver' ? 360 : 220;
  return Math.round(base * (plus + 1) * 1.35);
}

/** 洗點退養 — cumulative gold sunk into an item's 精煉 + 突破, for a respec refund. */
export function itemGrowthGoldSpent(item: Item, plus: number, stars: number): number {
  let g = 0;
  for (let p = 0; p < plus; p++) g += refineCost(item, p);
  for (let st = 0; st < stars; st++) g += breakthroughCost(item, st).gold;
  return g;
}

/** 突破 — gold + iron to take an item from ★stars → ★stars+1 (steep, end-game). */
export function breakthroughCost(item: Item, stars: number): { gold: number; iron: number } {
  const r = itemRarity(item);
  const g = r === 'gold' ? 1200 : r === 'silver' ? 800 : 500;
  return { gold: Math.round(g * (stars + 1) * 1.6), iron: 200 * (stars + 1) };
}

// ─── 寶石 — gems for 鑲嵌. Flat stat inlays; socket up to socketsFor(item). ───
export const GEMS: Gem[] = [
  { id: 'gem-war',    name: { en: 'Bloodstone',  zh: '赤血石' }, effects: { war: 4 },          cost: 600, color: '#b8442e' },
  { id: 'gem-lead',   name: { en: 'Aegis Jade',  zh: '玄武玉' }, effects: { leadership: 4 },   cost: 600, color: '#4a8acb' },
  { id: 'gem-int',    name: { en: 'Sage Sapphire', zh: '智慧藍晶' }, effects: { intelligence: 4 }, cost: 600, color: '#3a7dd9' },
  { id: 'gem-pol',    name: { en: 'Court Amber', zh: '朝陽琥珀' }, effects: { politics: 4 },     cost: 500, color: '#c9a64e' },
  { id: 'gem-cha',    name: { en: 'Charm Pearl', zh: '傾城明珠' }, effects: { charisma: 4 },     cost: 500, color: '#c178c7' },
  { id: 'gem-warlead', name: { en: 'Tiger Ruby', zh: '虎魄' },    effects: { war: 3, leadership: 3 }, cost: 1000, color: '#e0623a' },
  { id: 'gem-allround', name: { en: 'Five-Element Gem', zh: '五行寶玉' }, effects: { war: 2, leadership: 2, intelligence: 2 }, cost: 1400, color: '#7ed68a' },
  // 高階寶石 — 精良 / 完美,以及更稀有的雙屬性與帝王晶。
  { id: 'gem-war-fine',    name: { en: 'Fine Bloodstone',  zh: '精良赤血石' }, effects: { war: 6 },        cost: 1300, color: '#d4533a' },
  { id: 'gem-lead-fine',   name: { en: 'Fine Aegis Jade',  zh: '精良玄武玉' }, effects: { leadership: 6 }, cost: 1300, color: '#5a9adb' },
  { id: 'gem-war-perfect', name: { en: 'Perfect War-Soul', zh: '完美戰魂石' }, effects: { war: 8 },        cost: 2400, color: '#ff5a3a' },
  { id: 'gem-lead-perfect',name: { en: 'Perfect Guardian', zh: '完美守護石' }, effects: { leadership: 8 }, cost: 2400, color: '#3a8fe0' },
  { id: 'gem-intcha',      name: { en: 'Exquisite Jade',   zh: '玲瓏七竅玉' }, effects: { intelligence: 3, charisma: 3 }, cost: 1100, color: '#a0d0e8' },
  { id: 'gem-imperial',    name: { en: 'Imperial Amethyst', zh: '帝王紫晶' }, effects: { war: 3, leadership: 3, charisma: 3 }, cost: 2000, color: '#9b59b6' },
];
export const GEMS_BY_ID: Record<string, Gem> = Object.fromEntries(GEMS.map((g) => [g.id, g]));

/** 寶石合成 — fuse 3 of a lower gem into 1 of the next grade (基礎 → 精良 → 完美). */
export const GEM_FUSION: Record<string, string> = {
  'gem-war': 'gem-war-fine',  'gem-war-fine': 'gem-war-perfect',
  'gem-lead': 'gem-lead-fine', 'gem-lead-fine': 'gem-lead-perfect',
};
/** How many of the input gem one fusion consumes. */
export const GEM_FUSION_COST = 3;

// 第五批單獨成陣列 + 展開,避免巨型字面量觸發 TS2590(union too complex)。
const FORGE_BATCH_5: Item[] = [
  // ─── 鍛造專屬兵器 · 第五批 · 水滸/封神/西遊/神話/古龍/異域 (forge-only, batch 5) ───
  {
    id: 'huyanzhuo-shuangbian',
    name: { en: 'Huyan Zhuo\'s Twin Cudgels', zh: '呼延灼雙鞭' },
    kind: 'weapon',
    description: 'Huyan Zhuo of the Water Margin, master of the chained-cavalry charge.',
    descriptionZh: '《水滸》雙鞭呼延灼,連環馬之主將。',
    effects: { war: 10, leadership: 4 },
    grants: { tactic: 'iron-chain' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'suochao-jinzhan-fu',
    name: { en: 'Suo Chao\'s Gilt Axe', zh: '索超金蘸斧' },
    kind: 'weapon',
    description: 'The Gilt Axe of Suo Chao the Vanguard — he fights to the last.',
    descriptionZh: '《水滸》急先鋒索超之金蘸斧,死戰不退。',
    effects: { war: 11, leadership: 2 },
    grants: { tactic: 'last-stand' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'dongping-shuangqiang',
    name: { en: 'Dong Ping\'s Twin Spears', zh: '董平雙槍' },
    kind: 'weapon',
    description: 'Dong Ping the Twin-Spear General of the Water Margin.',
    descriptionZh: '《水滸》雙槍將董平,文武雙全。',
    effects: { war: 10, intelligence: 3 },
    grants: { tactic: 'twin-spear' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'gongsunsheng-jian',
    name: { en: 'Gongsun Sheng\'s Pine-Grain Sword', zh: '公孫勝松紋古定劍' },
    kind: 'weapon',
    description: 'Gongsun Sheng\'s Daoist sword, calling down the Five Thunders.',
    descriptionZh: '《水滸》入雲龍公孫勝之劍,行五雷天罡正法。',
    effects: { war: 4, intelligence: 8 },
    grants: { tactic: 'thunder' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'lujunyi-qiang',
    name: { en: 'Lu Junyi\'s Tempered Steel Spear', zh: '盧俊義渾鐵點鋼槍' },
    kind: 'weapon',
    description: 'Lu Junyi the Jade Qilin — his staff-play has no equal under heaven.',
    descriptionZh: '《水滸》玉麒麟盧俊義,棍棒天下無對。',
    effects: { war: 12, leadership: 3 },
    grants: { tactic: 'total-victory' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'shijin-baohuan-dao',
    name: { en: 'Shi Jin\'s Eight-Ring Saber', zh: '史進四竅八環刀' },
    kind: 'weapon',
    description: 'The eight-ringed glaive of Shi Jin, the Nine-Dragon Tattooed.',
    descriptionZh: '《水滸》九紋龍史進之三尖兩刃四竅八環刀。',
    effects: { war: 9, leadership: 3 },
    grants: { formation: 'wheel' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'fantian-bao-yin',
    name: { en: 'Sky-Overturning Seal', zh: '番天印' },
    kind: 'weapon',
    description: 'Guangchengzi\'s treasure-seal of the Investiture, falling like a meteor.',
    descriptionZh: '《封神》廣成子鎮山法寶,砸落如隕。',
    effects: { war: 7, intelligence: 6 },
    grants: { tactic: 'meteor' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yinyang-jing',
    name: { en: 'Yin-Yang Mirror', zh: '陰陽鏡' },
    kind: 'weapon',
    description: 'The Yin-Yang Mirror — one flash divides the living from the dead.',
    descriptionZh: '《封神》一照分生死的陰陽寶鏡。',
    effects: { war: 5, intelligence: 8 },
    grants: { tactic: 'curse' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'jin-jiao-jian',
    name: { en: 'Golden-Dragon Shears', zh: '金蛟剪' },
    kind: 'weapon',
    description: 'Zhao Gongming\'s shears of the Investiture — twin dragons closing in.',
    descriptionZh: '《封神》趙公明法寶,雙蛟絞合。',
    effects: { war: 9, intelligence: 4 },
    grants: { tactic: 'surround-three' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'lu-xian-jian',
    name: { en: 'Immortal-Butcher Sword', zh: '戮仙劍' },
    kind: 'weapon',
    description: 'One of the Four Zhuxian Swords — it slays even immortals.',
    descriptionZh: '《封神》誅仙四劍之一,專斬上仙。',
    effects: { war: 10, intelligence: 4 },
    grants: { tactic: 'kill-king' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wuhuo-shenyan-shan',
    name: { en: 'Five-Fire Divine-Flame Fan', zh: '五火神焰扇' },
    kind: 'weapon',
    description: 'Luo Xuan\'s fan of the Investiture — one wave fills the sky with flame.',
    descriptionZh: '《封神》羅宣法寶,一搧烈焰漫天。',
    effects: { war: 4, intelligence: 7 },
    grants: { tactic: 'borrow-wind' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'xiangyao-baozhang',
    name: { en: 'Demon-Subduing Staff', zh: '降妖寶杖' },
    kind: 'weapon',
    description: 'Sha Wujing\'s staff from Journey to the West.',
    descriptionZh: '《西遊》沙僧之寶杖,月裡梭羅所制。',
    effects: { war: 9, leadership: 4 },
    grants: { formation: 'trinity' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'donghuang-zhong',
    name: { en: 'Eastern-Emperor Bell', zh: '東皇鐘' },
    kind: 'weapon',
    description: 'The primordial Eastern-Emperor Bell — its toll snatches the soul.',
    descriptionZh: '上古神器東皇鐘,鐘鳴攝魂。',
    effects: { war: 6, intelligence: 7 },
    grants: { tactic: 'soul-snatch' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'haotian-ta',
    name: { en: 'Pagoda of Heaven', zh: '昊天塔' },
    kind: 'weapon',
    description: 'Li Jing\'s exquisite pagoda — impregnable as iron.',
    descriptionZh: '托塔李天王之玲瓏寶塔,固若金湯。',
    effects: { war: 5, leadership: 6, intelligence: 4 },
    grants: { tactic: 'tortoise-shell' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'shennong-ding',
    name: { en: 'Shennong\'s Cauldron', zh: '神農鼎' },
    kind: 'weapon',
    description: 'Shennong\'s cauldron — it imparts the arts of medicine.',
    descriptionZh: '神農嘗百草之鼎,通醫藥之術。',
    effects: { war: 4, intelligence: 6, politics: 4 },
    grants: { policy: 'medicine' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'bi-yu-dao2',
    name: { en: 'Green Jade Saber', zh: '碧玉刀' },
    kind: 'weapon',
    description: 'Gu Long\'s Green Jade Saber — fortune favors its bearer.',
    descriptionZh: '古龍七種武器之一,持者多福。',
    effects: { war: 7, charisma: 5 },
    grants: { trait: 'benevolent' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'duo-qing-huan',
    name: { en: 'Rings of Sentiment', zh: '多情環' },
    kind: 'weapon',
    description: 'Gu Long\'s twin Rings of Sentiment, link upon link.',
    descriptionZh: '古龍七種武器之一,雙環相扣。',
    effects: { war: 8, intelligence: 3 },
    grants: { tactic: 'chain' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'liquan-shenmao',
    name: { en: 'Liquan Divine Spear', zh: '瀝泉神矛' },
    kind: 'weapon',
    description: 'Yue Fei\'s Liquan Spear — the Yue army runs the broken foe to ground.',
    descriptionZh: '岳飛之瀝泉神矛,岳家軍追亡逐北。',
    effects: { war: 11, leadership: 4 },
    grants: { tactic: 'press-pursuit' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'tianlong-pocheng-ji',
    name: { en: 'Dragon City-Breaker Halberd', zh: '天龍破城戟' },
    kind: 'weapon',
    description: 'A great halberd for the long siege — it never relents.',
    descriptionZh: '破城拔寨之巨戟,久攻不懈。',
    effects: { war: 11, leadership: 3 },
    grants: { tactic: 'protracted' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'makedun-changmao',
    name: { en: 'Macedonian Sarissa', zh: '馬其頓長矛' },
    kind: 'weapon',
    description: 'The Macedonian sarissa — ranks of pikes stacked like a forest.',
    descriptionZh: '馬其頓方陣之長矛,層層如林。',
    effects: { war: 8, leadership: 6 },
    grants: { formation: 'stacked' },
    rarity: 'gold',
    forgeOnly: true,
  },];

const FORGE_BATCH_6: Item[] = [
  // ─── 鍛造專屬兵器 · 第六批 · 說岳/楊家/隋唐/山海經/異域 (forge-only, batch 6) ───
  {
    id: 'gaochong-zanjin-qiang',
    name: { en: 'Gao Chong\'s Gilt Spear', zh: '高寵鏨金槍' },
    kind: 'weapon',
    description: 'Gao Chong of the Yue Fei saga, who unhorsed siege-carts single-handed.',
    descriptionZh: '《說岳》高寵挑滑車,槍法天下無雙。',
    effects: { war: 12, leadership: 2 },
    grants: { tactic: 'heavy-cav' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yueyun-yinchui',
    name: { en: 'Yue Yun\'s Silver Hammers', zh: '岳雲銀錘' },
    kind: 'weapon',
    description: 'Yue Yun\'s twin silver hammers — a boy-general who broke the line at twelve.',
    descriptionZh: '《說岳》岳雲雙錘,十二歲陷陣的小將。',
    effects: { war: 11, leadership: 3 },
    grants: { tactic: 'tiger-crouch' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'niugao-shuangjian',
    name: { en: 'Niu Gao\'s Twin Maces', zh: '牛皋雙鐧' },
    kind: 'weapon',
    description: 'Niu Gao\'s blunt twin maces, rousing the whole host with a bellow.',
    descriptionZh: '《說岳》牛皋粗豪,雙鐧鼓舞三軍。',
    effects: { war: 9, leadership: 4 },
    grants: { tactic: 'rouse' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yangzaixing-qiang',
    name: { en: 'Yang Zaixing\'s Spear', zh: '楊再興神槍' },
    kind: 'weapon',
    description: 'Yang Zaixing, who fought to the death at Xiaoshang River, arrows and all.',
    descriptionZh: '《說岳》楊再興小商河死戰,中箭猶殺數十。',
    effects: { war: 11, intelligence: 2 },
    grants: { tactic: 'attrition' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'luwenlong-shuangqiang',
    name: { en: 'Lu Wenlong\'s Twin Spears', zh: '陸文龍雙槍' },
    kind: 'weapon',
    description: 'Lu Wenlong, the borderland boy-prince, twin spears like dragons.',
    descriptionZh: '《說岳》陸文龍番邦少年,雙槍如龍。',
    effects: { war: 10, intelligence: 3 },
    grants: { tactic: 'light-cav' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yanchengfang-jinchui',
    name: { en: 'Yan Chengfang\'s Gold Hammers', zh: '嚴成方金錘' },
    kind: 'weapon',
    description: 'Yan Chengfang\'s golden hammers, one of the Four Hammer-Wielders.',
    descriptionZh: '《說岳》嚴成方金錘,八大錘之一。',
    effects: { war: 11, leadership: 2 },
    grants: { formation: 'arrow-tip' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yangjia-jindao',
    name: { en: 'Yang Family Gold Saber', zh: '楊家金刀' },
    kind: 'weapon',
    description: 'The Yang patriarch\'s gold saber, passed down the Yang generals.',
    descriptionZh: '楊令公金刀,楊家將世代相傳。',
    effects: { war: 9, leadership: 5 },
    grants: { formation: 'fish-scale' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yangqilang-jili',
    name: { en: 'Yang Qilang\'s Iron Caltrop-Mace', zh: '楊七郎鐵蒺藜' },
    kind: 'weapon',
    description: 'Yang the Seventh\'s spiked caltrop-mace — ferocious beyond compare.',
    descriptionZh: '楊七郎之鐵蒺藜骨朵,猛烈絕倫。',
    effects: { war: 10, intelligence: 2 },
    grants: { tactic: 'pitfall' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'pei-bagua-chui',
    name: { en: 'Eight-Trigram Plum Silver Hammers', zh: '八卦梅花亮銀錘' },
    kind: 'weapon',
    description: 'Pei Yuanqing\'s silver hammers — three blows drove back Li Yuanba.',
    descriptionZh: '《隋唐》裴元慶之亮銀錘,三錘退李元霸。',
    effects: { war: 12, leadership: 2, intelligence: -1 },
    grants: { tactic: 'high-ground' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yuwang-shuo',
    name: { en: 'Yu-King Lance', zh: '禹王槊' },
    kind: 'weapon',
    description: 'Wu Yunzhao\'s Yu-King lance, the fierce general of Nanyang.',
    descriptionZh: '《隋唐》伍雲召之禹王槊,南陽猛將。',
    effects: { war: 11, leadership: 3 },
    grants: { formation: 'back-to-water' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zaoyang-shuo',
    name: { en: 'Jujube-Yang Lance', zh: '棗陽槊' },
    kind: 'weapon',
    description: 'Shan Xiongxin\'s studded jujube lance, the Red-Haired Spirit-Officer.',
    descriptionZh: '《隋唐》單雄信之金釘棗陽槊,赤發靈官。',
    effects: { war: 10, leadership: 3 },
    grants: { tactic: 'night-war' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qinqiong-jian',
    name: { en: 'Qin Qiong\'s Gilt Mace', zh: '瓦面金裝鐧' },
    kind: 'weapon',
    description: 'Qin Qiong\'s gilt mace — his loyalty to sworn brothers ran deep.',
    descriptionZh: '《隋唐》秦瓊瓦面金裝鐧,義薄雲天。',
    effects: { war: 9, leadership: 4, charisma: 3 },
    grants: { tactic: 'sworn-brothers' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'taotie-fu',
    name: { en: 'Taotie Sky-Devouring Axe', zh: '饕餮吞天斧' },
    kind: 'weapon',
    description: 'The Taotie\'s gluttonous axe — it falls as if to devour the sky.',
    descriptionZh: '《山海經》饕餮貪噬,斧落如吞天嚙地。',
    effects: { war: 13, intelligence: -2 },
    grants: { tactic: 'scorched-earth' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qiongqi-qiang',
    name: { en: 'Qiongqi Soul-Eating Spear', zh: '窮奇噬魂槍' },
    kind: 'weapon',
    description: 'The Qiongqi\'s man-eating spear, its point steeped in gu-poison.',
    descriptionZh: '《山海經》窮奇食人,槍鋒淬以蠱毒。',
    effects: { war: 10, intelligence: 3 },
    grants: { tactic: 'gu-poison' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'taowu-chui',
    name: { en: 'Taowu Earth-Splitting Maul', zh: '梼杌裂地錘' },
    kind: 'weapon',
    description: 'The Taowu\'s obstinate maul — a blow splits the very earth.',
    descriptionZh: '《山海經》梼杌頑兇,錘震裂地。',
    effects: { war: 12, leadership: 2 },
    grants: { formation: 'five-elements' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'xiangliu-ji',
    name: { en: 'Xiangliu Nine-Head Halberd', zh: '相柳九首戟' },
    kind: 'weapon',
    description: 'Xiangliu the nine-headed — its halberd strikes from ten directions.',
    descriptionZh: '《山海經》相柳九首,戟出九面合圍。',
    effects: { war: 11, intelligence: 3 },
    grants: { formation: 'ten-ambush' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yinglong-mao',
    name: { en: 'Responding-Dragon Rain Spear', zh: '應龍喚雨矛' },
    kind: 'weapon',
    description: 'The Responding Dragon\'s spear, summoning flood and rain.',
    descriptionZh: '《山海經》應龍蓄水司雨,矛引洪流。',
    effects: { war: 9, intelligence: 5 },
    grants: { tactic: 'water-attack' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wuzi-gang-dao',
    name: { en: 'Wootz Steel Saber', zh: '烏茲鋼刀' },
    kind: 'weapon',
    description: 'A saber of Indian wootz steel — watered patterns, cutting iron in silence.',
    descriptionZh: '天竺烏茲鋼所鍛,花紋如水,削鐵無聲。',
    effects: { war: 10, leadership: 2 },
    grants: { tactic: 'deception' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'weijing-zhanfu',
    name: { en: 'Viking War-Axe', zh: '維京戰斧' },
    kind: 'weapon',
    description: 'The broad axe of the Northmen — they raid ashore and leave nothing.',
    descriptionZh: '北海維京人之闊斧,登岸劫掠,所過無遺。',
    effects: { war: 11, leadership: 2 },
    grants: { tactic: 'viking-raid' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'aosiman-wandao',
    name: { en: 'Ottoman Kilij', zh: '奧斯曼彎刀' },
    kind: 'weapon',
    description: 'The kilij of the Ottoman cavalry, curved like a withdrawing crescent moon.',
    descriptionZh: '奧斯曼鐵騎之彎刀,如新月卷殺。',
    effects: { war: 9, leadership: 4 },
    grants: { formation: 'crescent-withdraw' },
    rarity: 'gold',
    forgeOnly: true,
  },
];

const FORGE_BATCH_7: Item[] = [
  // ─── 鍛造專屬兵器 · 第七批 · 封神/歐洲/日本/山海經/水滸 (forge-only, batch 7) ───
  {
    id: 'xianxian-jian',
    name: { en: 'Trap-Immortal Sword', zh: '陷仙劍' },
    kind: 'weapon',
    description: 'One of the Four Zhuxian Swords — it traps and slays.',
    descriptionZh: '《封神》誅仙四劍之一,主陷殺。',
    effects: { war: 9, intelligence: 5 },
    grants: { tactic: 'eight-gates' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'juexian-jian',
    name: { en: 'Sever-Immortal Sword', zh: '絕仙劍' },
    kind: 'weapon',
    description: 'One of the Four Zhuxian Swords, its array hides the Qimen.',
    descriptionZh: '《封神》誅仙四劍之一,陣藏奇門。',
    effects: { war: 10, intelligence: 4 },
    grants: { tactic: 'qimen-dunjia' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'hunyuan-jindou',
    name: { en: 'Primordial Golden Bushel', zh: '混元金斗' },
    kind: 'weapon',
    description: 'The Sanxiao\'s bushel of the Investiture — it captures all who enter.',
    descriptionZh: '《封神》三霄法寶,削三魂七魄,收盡萬仙。',
    effects: { war: 5, intelligence: 7 },
    grants: { tactic: 'seven-grab' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'luohun-zhong',
    name: { en: 'Soul-Falling Bell', zh: '落魂鐘' },
    kind: 'weapon',
    description: 'A treasure-bell whose toll fells the soul, backed by the Five Thunders.',
    descriptionZh: '《封神》法寶,鐘響落魂,雷法相加。',
    effects: { war: 5, intelligence: 8 },
    grants: { tactic: 'five-thunder' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'shizijun-jian',
    name: { en: 'Crusader\'s Holy Sword', zh: '十字軍聖劍' },
    kind: 'weapon',
    description: 'A crusader knight\'s holy sword — faith is its strength.',
    descriptionZh: '歐洲十字軍騎士之聖劍,信仰即力量。',
    effects: { war: 10, leadership: 4 },
    grants: { trait: 'pious' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yuanzhuo-jian',
    name: { en: 'Round-Table Steel-Cleaver', zh: '圓桌斷鋼劍' },
    kind: 'weapon',
    description: 'The Round Table\'s kingly blade, cleaving steel like mud.',
    descriptionZh: '圓桌騎士的王者之劍,斷鋼如泥。',
    effects: { war: 11, leadership: 5 },
    grants: { tactic: 'royal-way' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'shuangshou-jujian',
    name: { en: 'Two-Hand Greatsword', zh: '雙手巨劍' },
    kind: 'weapon',
    description: 'The European zweihander — one sweep opens a bloody lane.',
    descriptionZh: '歐洲雙手巨劍,一掃開血路。',
    effects: { war: 12, leadership: 2 },
    grants: { tactic: 'leopard-wolf' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'chenxing-chui',
    name: { en: 'Morningstar Flail', zh: '晨星流星錘' },
    kind: 'weapon',
    description: 'The morningstar flail — it needs open ground to swing.',
    descriptionZh: '歐洲晨星鏈錘,需開闊揮舞。',
    effects: { war: 10, leadership: 2 },
    grants: { formation: 'spread-out' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'ruishi-changji',
    name: { en: 'Swiss Halberd', zh: '瑞士長戟' },
    kind: 'weapon',
    description: 'The Swiss halberd square — a wall of blades.',
    descriptionZh: '瑞士長戟方陣,戟林如牆。',
    effects: { war: 9, leadership: 6 },
    grants: { formation: 'four-symbols' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'tongzieqie',
    name: { en: 'Dojigiri Yasutsuna', zh: '童子切安綱' },
    kind: 'weapon',
    description: 'First of Japan\'s Five Great Swords — one cut slew an oni.',
    descriptionZh: '天下五劍之首,一刀斬鬼。',
    effects: { war: 11, intelligence: 3 },
    grants: { tactic: 'still-vs-motion' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'guiwan-guogang',
    name: { en: 'Onimaru Kunitsuna', zh: '鬼丸國綱' },
    kind: 'weapon',
    description: 'One of the Five Great Swords — it rose on its own to slay a demon.',
    descriptionZh: '天下五劍之一,自起驅邪斬鬼。',
    effects: { war: 10, intelligence: 4 },
    grants: { tactic: 'counter-plot' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qingling-qie',
    name: { en: 'Tonbogiri', zh: '蜻蛉切' },
    kind: 'weapon',
    description: 'One of Japan\'s Three Great Spears — a dragonfly is cut by its mere touch.',
    descriptionZh: '天下三名槍,蜻蜓觸鋒立斷。',
    effects: { war: 12, leadership: 3 },
    grants: { tactic: 'half-cross' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'riben-hao',
    name: { en: 'Nihongo', zh: '日本號' },
    kind: 'weapon',
    description: 'A Three Great Spear, won in the famous drinking wager of the Kuroda.',
    descriptionZh: '天下三名槍,黑田家飲酒奪槍之典。',
    effects: { war: 11, leadership: 4 },
    grants: { tactic: 'warm-wine' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'kuiniu-chui',
    name: { en: 'Kui-Ox Sky-Quaking Maul', zh: '夔牛震天槌' },
    kind: 'weapon',
    description: 'The one-legged Kui-ox maul — its boom carries five hundred li.',
    descriptionZh: '《山海經》夔牛一足,皮為鼓,聲震五百里。',
    effects: { war: 12, leadership: 2 },
    grants: { formation: 'yoke' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'kunpeng-shuo',
    name: { en: 'Kunpeng Wave-Smiting Lance', zh: '鯤鵬擊浪槊' },
    kind: 'weapon',
    description: 'The Kunpeng lance — it sweeps like the great fish turning to roc.',
    descriptionZh: '《山海經》鯤化為鵬,槊掃如擊浪摶風。',
    effects: { war: 10, intelligence: 4 },
    grants: { tactic: 'water-form' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'fenghuang-gong',
    name: { en: 'Phoenix-Nirvana Bow', zh: '鳳凰涅槃弓' },
    kind: 'weapon',
    description: 'The phoenix bow — its arrows fall like burning plumes.',
    descriptionZh: '《山海經》鳳凰浴火,箭出如火翎漫天。',
    effects: { war: 7, intelligence: 5 },
    grants: { tactic: 'fire-crow' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'xingtian-ganqi',
    name: { en: 'Xingtian\'s Axe and Shield', zh: '刑天干戚' },
    kind: 'weapon',
    description: 'Xingtian, who danced with axe and shield though beheaded — never yielding.',
    descriptionZh: '《山海經》刑天斷首猶舞干戚,至死不屈。',
    effects: { war: 13, leadership: 1 },
    grants: { trait: 'reckless' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'guansheng-dadao',
    name: { en: 'Guan Sheng\'s Great Saber', zh: '關勝大刀' },
    kind: 'weapon',
    description: 'Guan Sheng of the Water Margin, heir to Guan Yu\'s blade-arts.',
    descriptionZh: '《水滸》大刀關勝,關羽之後,青龍刀法。',
    effects: { war: 10, leadership: 5 },
    grants: { formation: 'mandarin-duck' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'huarong-gong',
    name: { en: 'Hua Rong\'s Willow-Piercing Bow', zh: '花榮穿楊弓' },
    kind: 'weapon',
    description: 'Hua Rong the Little Li Guang — never an arrow wasted.',
    descriptionZh: '《水滸》小李廣花榮,箭無虛發。',
    effects: { war: 8, intelligence: 4 },
    grants: { tactic: 'volley' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wangyanzhang-qiang',
    name: { en: 'Wang Yanzhang\'s Iron Spear', zh: '王彥章鐵槍' },
    kind: 'weapon',
    description: 'Wang the Iron-Spear of the Five Dynasties, who broke 36 camps in a day.',
    descriptionZh: '五代王鐵槍,日不移影連挑三十六寨。',
    effects: { war: 12, leadership: 3 },
    grants: { tactic: 'cut-supply' },
    rarity: 'gold',
    forgeOnly: true,
  },
];

const FORGE_BATCH_8: Item[] = [
  // ─── 鍛造專屬兵器 · 第八批 · 鐵料配方 · 希臘/北歐/異域/山海經/水滸 (forge-only, iron-cost) ───
  {
    id: 'bosaidun-cha',
    name: { en: 'Poseidon\'s Trident', zh: '波塞頓三叉戟' },
    kind: 'weapon',
    description: 'Poseidon\'s trident, which shakes the sea and raises the flood.',
    descriptionZh: '希臘海神波塞頓之三叉戟,撼海掀濤。',
    effects: { war: 11, intelligence: 4 },
    grants: { tactic: 'sand-dam' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'aruisi-mao',
    name: { en: 'Ares\' War Spear', zh: '阿瑞斯戰矛' },
    kind: 'weapon',
    description: 'The spear of Ares — where it goes, men fight to the death.',
    descriptionZh: '希臘戰神阿瑞斯之矛,所至無不死戰。',
    effects: { war: 13, leadership: 2 },
    grants: { tactic: 'inspire-soldiers' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zhousi-leiting',
    name: { en: 'Zeus\'s Thunderbolt', zh: '宙斯雷霆' },
    kind: 'weapon',
    description: 'Zeus\'s thunderbolt, calling the lightning of heaven.',
    descriptionZh: '希臘主神宙斯之雷霆,召天雷而擊。',
    effects: { war: 9, intelligence: 6 },
    grants: { tactic: 'star-prayer' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'akiliusi-mao',
    name: { en: 'Spear of Achilles', zh: '阿喀琉斯之矛' },
    kind: 'weapon',
    description: 'Achilles\' spear — borne by a body no blade can pierce.',
    descriptionZh: '希臘英雄阿喀琉斯之矛,刀槍不入之軀。',
    effects: { war: 12, leadership: 3 },
    grants: { tactic: 'golden-bell' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'leishen-chui',
    name: { en: 'Mjolnir', zh: '雷神之錘' },
    kind: 'weapon',
    description: 'Thor\'s hammer Mjolnir of the North — a single thunderous blow.',
    descriptionZh: '北歐雷神索爾之錘妙爾尼爾,雷霆一擊。',
    effects: { war: 12, leadership: 3 },
    grants: { tactic: 'vajra-finger' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'yongheng-qiang',
    name: { en: 'Gungnir', zh: '永恆之槍' },
    kind: 'weapon',
    description: 'Odin\'s spear Gungnir — once thrown, it never misses.',
    descriptionZh: '北歐主神奧丁之槍岡格尼爾,擲出必中。',
    effects: { war: 11, intelligence: 4 },
    grants: { tactic: 'far-near' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'tier-jian',
    name: { en: 'Tyr\'s Sword', zh: '提爾斷劍' },
    kind: 'weapon',
    description: 'The sword of Tyr, who gave his hand to keep his word.',
    descriptionZh: '北歐戰神提爾之劍,以斷手立信。',
    effects: { war: 11, leadership: 3 },
    grants: { tactic: 'attack-authority' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'damashige-dao',
    name: { en: 'Damascus Scimitar', zh: '大馬士革彎刀' },
    kind: 'weapon',
    description: 'A Damascus-steel scimitar, its watered edge keen as ripples.',
    descriptionZh: '大馬士革花紋鋼彎刀,鋒利如水波。',
    effects: { war: 10, leadership: 2 },
    grants: { tactic: 'sneak-cross' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'bosi-wandao',
    name: { en: 'Persian Shamshir', zh: '波斯彎刀' },
    kind: 'weapon',
    description: 'The shamshir of the Persian cavalry, fluid in the saddle.',
    descriptionZh: '波斯鐵騎之彎刀,馬上揮灑自如。',
    effects: { war: 10, leadership: 3 },
    grants: { tactic: 'lure-tiger' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'luoma-duanjian',
    name: { en: 'Roman Gladius', zh: '羅馬短劍' },
    kind: 'weapon',
    description: 'The Roman gladius — the legion\'s testudo advances like a wall.',
    descriptionZh: '羅馬軍團之短劍,龜甲陣推進如牆。',
    effects: { war: 9, leadership: 6 },
    grants: { formation: 'armored-cart' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'cunzheng-yaodao',
    name: { en: 'Muramasa Cursed Blade', zh: '村正妖刀' },
    kind: 'weapon',
    description: 'The cursed Muramasa — it thirsts for blood, of foe and master alike.',
    descriptionZh: '日本村正妖刀,嗜血,傷敵亦噬主。',
    effects: { war: 12, leadership: -1 },
    grants: { tactic: 'self-injury' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'tujue-jian',
    name: { en: 'Turkic Wolf-Fang Arrows', zh: '突厥狼牙箭' },
    kind: 'weapon',
    description: 'Turkic wolf-fang arrows, swarming like bees to blot the sun.',
    descriptionZh: '突厥騎射之狼牙箭,如蜂群蔽日。',
    effects: { war: 9, intelligence: 3 },
    grants: { tactic: 'bee-swarm' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zhujiuyin-jian',
    name: { en: 'Zhujiuyin Netherworld Sword', zh: '燭九陰幽冥劍' },
    kind: 'weapon',
    description: 'The sword of Zhujiuyin, lord of day and night — unfathomable as the dark.',
    descriptionZh: '《山海經》燭九陰司晝夜,劍出幽冥莫測。',
    effects: { war: 9, intelligence: 5 },
    grants: { tactic: 'hide-light' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'dijiang-chui',
    name: { en: 'Dijiang Chaos Maul', zh: '帝江渾沌錘' },
    kind: 'weapon',
    description: 'The faceless dancing Dijiang\'s maul — it falls into formless chaos.',
    descriptionZh: '《山海經》帝江無面而善舞,錘落混沌難辨。',
    effects: { war: 12, leadership: 1 },
    grants: { tactic: 'sow-discord-2' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'jiuwei-dao',
    name: { en: 'Nine-Tail Soul-Eating Saber', zh: '九尾噬魂刀' },
    kind: 'weapon',
    description: 'The nine-tailed fox\'s saber, bewitching and soul-snatching.',
    descriptionZh: '《山海經》九尾狐媚惑攝魂,刀下迷魂。',
    effects: { war: 8, charisma: 5 },
    grants: { tactic: 'beauty' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'hanba-bian',
    name: { en: 'Drought-Fiend Sky-Burning Whip', zh: '旱魃焚天鞭' },
    kind: 'weapon',
    description: 'Where the drought-fiend Hanba passes, the land burns for a thousand li.',
    descriptionZh: '《山海經》旱魃所至赤地千里,鞭出燎原。',
    effects: { war: 10, intelligence: 3 },
    grants: { tactic: 'fire-ox' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'leiheng-podao',
    name: { en: 'Lei Heng\'s Broadsword', zh: '雷橫朴刀' },
    kind: 'weapon',
    description: 'The broadsword of Lei Heng, the Winged Tiger of the Water Margin.',
    descriptionZh: '《水滸》插翅虎雷橫之朴刀。',
    effects: { war: 9, leadership: 3 },
    grants: { tactic: 'bait-trap' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zhutong-dao',
    name: { en: 'Zhu Tong\'s Saber', zh: '朱仝美髯刀' },
    kind: 'weapon',
    description: 'Zhu Tong the Beautiful-Bearded, who freed heroes in mercy.',
    descriptionZh: '《水滸》美髯公朱仝,義釋豪傑。',
    effects: { war: 9, leadership: 4, charisma: 4 },
    grants: { tactic: 'mercy-show' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'pangwanchun-nu',
    name: { en: 'Pang Wanchun\'s Divine Crossbow', zh: '龐萬春神臂弩' },
    kind: 'weapon',
    description: 'Pang Wanchun the Little Yang Youji — his repeating crossbow never missed.',
    descriptionZh: '《水滸》小養由基龐萬春,連珠神弩。',
    effects: { war: 9, intelligence: 4 },
    grants: { tactic: 'crossbow' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'dengyuanjue-zhang',
    name: { en: 'Deng Yuanjue\'s Staff', zh: '鄧元覺寶杖' },
    kind: 'weapon',
    description: 'The iron staff of Deng Yuanjue, the warrior-monk of Fang La.',
    descriptionZh: '《水滸》方臘國師鄧元覺之渾鐵禪杖。',
    effects: { war: 11, leadership: 3 },
    grants: { tactic: 'iron-shirt' },
    rarity: 'gold',
    forgeOnly: true,
  },
];

const FORGE_BATCH_9: Item[] = [
  // ─── 鍛造專屬甲冑 · 第九批 · 鐵料鑄甲 (forge-only armor, iron-cost) ───
  {
    id: 'xuantie-zhongkai',
    name: { en: 'Black-Iron Heavy Armor', zh: '玄鐵重鎧' },
    kind: 'armor',
    description: 'Heavy armor of pure black iron — its bearer stands like an iron wall.',
    descriptionZh: '純玄鐵打造的重鎧,立陣如鐵牆。',
    effects: { leadership: 8, war: 4 },
    grants: { tactic: 'iron-wall' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'bailian-tiejia',
    name: { en: 'Hundred-Temper Iron Armor', zh: '百鍊鐵甲' },
    kind: 'armor',
    description: 'Hundred-tempered iron armor, anchoring an unbreakable square.',
    descriptionZh: '百鍊精鐵之甲,結方圓而不潰。',
    effects: { leadership: 6, war: 5 },
    grants: { formation: 'square' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wujin-lianhuan-kai',
    name: { en: 'Black-Gold Chain Armor', zh: '烏金連環鎧' },
    kind: 'armor',
    description: 'Black-gold chain armor — shells the body like a tortoise.',
    descriptionZh: '烏金連環之鎧,龜甲覆身,矢石難傷。',
    effects: { leadership: 7, war: 4 },
    grants: { tactic: 'tortoise-shell' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qinglong-linjia',
    name: { en: 'Azure-Dragon Scale Armor', zh: '青龍鱗甲' },
    kind: 'armor',
    description: 'The Azure-Dragon scale armor of the Four Symbols — wood of the east.',
    descriptionZh: '四象之青龍鱗甲,東方木德,據高而守。',
    effects: { leadership: 7, war: 5 },
    grants: { tactic: 'high-ground' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'baihu-yinkai',
    name: { en: 'White-Tiger Silver Armor', zh: '白虎銀鎧' },
    kind: 'armor',
    description: 'The White-Tiger silver armor of the Four Symbols — metal of the west.',
    descriptionZh: '四象之白虎銀鎧,西方金德,死戰不退。',
    effects: { leadership: 6, war: 6 },
    grants: { tactic: 'last-stand' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zhuque-huojia',
    name: { en: 'Vermilion-Bird Flame Armor', zh: '朱雀火甲' },
    kind: 'armor',
    description: 'The Vermilion-Bird flame armor of the Four Symbols — fire of the south.',
    descriptionZh: '四象之朱雀火甲,南方火德,鼓舞三軍。',
    effects: { leadership: 6, war: 4, intelligence: 3 },
    grants: { tactic: 'rouse' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'xuanwu-zhongjia',
    name: { en: 'Black-Tortoise Heavy Armor', zh: '玄武重甲' },
    kind: 'armor',
    description: 'The Black-Tortoise heavy armor of the Four Symbols — water of the north.',
    descriptionZh: '四象之玄武重甲,北方水德,堅不可摧。',
    effects: { leadership: 9, war: 3 },
    grants: { tactic: 'iron-shirt' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'saitangni-kai',
    name: { en: 'Beast-Face Armor', zh: '賽唐猊獸面鎧' },
    kind: 'armor',
    description: 'Xu Ning\'s beast-faced chain armor from the Water Margin.',
    descriptionZh: '《水滸》金槍手徐寧之賽唐猊連環甲。',
    effects: { leadership: 7, war: 6 },
    grants: { formation: 'rattan-armor' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'luoma-banjia',
    name: { en: 'Roman Lorica', zh: '羅馬板甲' },
    kind: 'armor',
    description: 'The Roman legion\'s plate lorica, advancing in testudo.',
    descriptionZh: '羅馬軍團之板甲,龜甲方陣推進。',
    effects: { leadership: 8, war: 3 },
    grants: { formation: 'armored-cart' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'weijing-suojia',
    name: { en: 'Viking Mail', zh: '維京鎖甲' },
    kind: 'armor',
    description: 'The mail of the Northmen, raiding ashore.',
    descriptionZh: '北海維京戰士之鎖子甲,劫掠登岸。',
    effects: { leadership: 6, war: 5 },
    grants: { tactic: 'viking-raid' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'budong-mingwang-jia',
    name: { en: 'Acala Body-Armor', zh: '不動明王甲' },
    kind: 'armor',
    description: 'Acala\'s body-armor — a golden bell no blade can pierce.',
    descriptionZh: '不動明王護體之甲,金鐘罩體,刀槍不入。',
    effects: { leadership: 8, war: 5 },
    grants: { tactic: 'golden-bell' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'fengchi-zijin-kui',
    name: { en: 'Phoenix-Wing Helm', zh: '鳳翅紫金盔' },
    kind: 'armor',
    description: 'A phoenix-winged gilt helm of command, fanning a crane-wing line.',
    descriptionZh: '鳳翅紫金盔,將帥之儀,列鶴翼之陣。',
    effects: { leadership: 6, war: 4, charisma: 4 },
    grants: { formation: 'crane-wing' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'tianwang-huti-jia',
    name: { en: 'Heaven-King Armor', zh: '天王護體甲' },
    kind: 'armor',
    description: 'The Pagoda-King\'s body-armor — it husbands strength for the long fight.',
    descriptionZh: '托塔天王護體寶甲,養精蓄銳,久戰不疲。',
    effects: { leadership: 9, war: 4 },
    grants: { tactic: 'conserve-strength' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'huangjin-suozi-jia',
    name: { en: 'Gold Chain Armor', zh: '黃金鎖子甲' },
    kind: 'armor',
    description: 'Gilded chain armor of awe, arrayed in fish-scale.',
    descriptionZh: '黃金鎖子甲,煌煌生威,魚鱗列陣。',
    effects: { leadership: 6, war: 4, charisma: 5 },
    grants: { formation: 'fish-scale' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'xipi-tengjia',
    name: { en: 'Rhino-Hide Rattan Armor', zh: '犀皮藤甲' },
    kind: 'armor',
    description: 'Rhino-hide rattan armor — light, tough, turning stillness against motion.',
    descriptionZh: '犀皮藤甲,輕韌避矢,以靜制動。',
    effects: { leadership: 5, war: 6 },
    grants: { tactic: 'still-vs-motion' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qilin-baojia',
    name: { en: 'Qilin Treasure Armor', zh: '麒麟寶甲' },
    kind: 'armor',
    description: 'The auspicious Qilin\'s treasure armor — the Five Elements guard the realm.',
    descriptionZh: '麒麟瑞獸寶甲,五行護體,鎮邦之器。',
    effects: { leadership: 8, war: 6, intelligence: 3 },
    grants: { formation: 'five-elements' },
    rarity: 'gold',
    forgeOnly: true,
  },
];

const FORGE_BATCH_10: Item[] = [
  // ─── 鍛造專屬名物 · 第十批 · 名馬/兵書/寶物 (forge-only, other slots) ───
  {
    id: 'zhaoye-yushizi',
    name: { en: 'Jade-Lion Steed', zh: '照夜玉獅子' },
    kind: 'horse',
    description: 'Zhao Yun\'s jade-white war-steed.',
    descriptionZh: '趙雲坐騎照夜玉獅子,白龍駒。',
    effects: { war: 5, leadership: 4 },
    grants: { tactic: 'thousand-ride' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wuzhui-ma',
    name: { en: 'Black Dapple', zh: '烏騅馬' },
    kind: 'horse',
    description: 'Xiang Yu\'s black dapple, a thousand li a day.',
    descriptionZh: '項羽烏騅,日行千里。',
    effects: { war: 6, leadership: 3 },
    grants: { tactic: 'cavalry-war' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qianlixue',
    name: { en: 'Thousand-Li Snow', zh: '千里雪' },
    kind: 'horse',
    description: 'A snow-white courser, swift as wind.',
    descriptionZh: '白馬千里雪,輕捷如風。',
    effects: { war: 4, leadership: 5 },
    grants: { tactic: 'light-cav' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'shizicong',
    name: { en: 'Lion Roan', zh: '獅子驄' },
    kind: 'horse',
    description: 'The Lion Roan of the imperial stables, tireless under weight.',
    descriptionZh: '御廄名駒獅子驄,負重不疲。',
    effects: { war: 5, leadership: 4 },
    grants: { tactic: 'heavy-cav' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'huangbiao-touglong',
    name: { en: 'Tawny Dragon', zh: '黃膘透骨龍' },
    kind: 'horse',
    description: 'The Tawny Bone-Dragon steed, marvelously fleet.',
    descriptionZh: '黃膘透骨龍,神駿異常。',
    effects: { war: 5, leadership: 3, charisma: 3 },
    grants: { tactic: 'rush' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'dunjia-tianshu',
    name: { en: 'Dunjia Heaven-Book', zh: '遁甲天書' },
    kind: 'book',
    description: 'The heaven-book of Qimen Dunjia, mastering yin-yang flux.',
    descriptionZh: '奇門遁甲之天書,通陰陽變化。',
    effects: { intelligence: 8 },
    grants: { tactic: 'qimen-dunjia' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'qingnang-xinjie',
    name: { en: 'New Qingnang Canon', zh: '青囊新解' },
    kind: 'book',
    description: 'A new reading of the Qingnang medical canon.',
    descriptionZh: '青囊書新解,醫者活人之術。',
    effects: { intelligence: 6, politics: 3 },
    grants: { policy: 'medicine' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'wujing-zongyao',
    name: { en: 'Compendium of War', zh: '武經總要' },
    kind: 'book',
    description: 'The Song compendium of military arts and ordnance.',
    descriptionZh: '宋《武經總要》,軍政武備總集。',
    effects: { intelligence: 6, leadership: 5 },
    grants: { tactic: 'attack-plans' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'jiangyuan',
    name: { en: 'The General\'s Garden', zh: '將苑' },
    kind: 'book',
    description: 'Zhuge Liang\'s treatise on generalship.',
    descriptionZh: '諸葛亮《將苑》,為將之道。',
    effects: { intelligence: 7, leadership: 4 },
    grants: { policy: 'military-theory' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'jiuxi',
    name: { en: 'Nine Bestowments', zh: '九錫' },
    kind: 'treasure',
    description: 'The Nine Bestowments — the summit of a subject\'s honor.',
    descriptionZh: '天子九錫,人臣之極榮。',
    effects: { politics: 8, charisma: 6 },
    grants: { policy: 'imperial-edict' },
    rarity: 'gold',
    forgeOnly: true,
  },
  // ── 統御信物 — command tokens: the tools of high command, worn as treasures.
  //    Beyond a hefty 統率, a token's bearer marshals the whole host to fight a
  //    touch above itself (commandTokenMul). See COMMAND_TOKEN_IDS. ──
  {
    id: 'hufu-tiger-tally', name: { en: 'Tiger Tally', zh: '虎符' }, kind: 'treasure',
    description: 'The bronze tiger tally — split in two, it commands an army in the sovereign\'s name.',
    descriptionZh: '銅鑄虎符,剖之為二,合之則三軍聽令。',
    effects: { leadership: 8 }, rarity: 'gold', originCityId: 'luoyang',
  },
  {
    id: 'shuaiyin-marshal-seal', name: { en: "Marshal's Seal", zh: '帥印' }, kind: 'treasure',
    description: "The grand marshal's seal — whoever holds it holds the field.",
    descriptionZh: '大將軍帥印,執之者號令全軍。',
    effects: { leadership: 7, war: 2 }, rarity: 'gold', originCityId: 'ye',
  },
  {
    id: 'bingfu-command-tally', name: { en: 'Command Tally', zh: '兵符' }, kind: 'treasure',
    description: 'The command tally that musters and moves the standing host.',
    descriptionZh: '調兵遣將之符,徵發部伍,如臂使指。',
    effects: { leadership: 6, politics: 2 }, rarity: 'silver', originCityId: 'xuchang',
  },
  {
    id: 'jieyue-ceremonial-axe', name: { en: 'Ceremonial Axe & Banner', zh: '節鉞' }, kind: 'treasure',
    description: 'The axe and staff of delegated authority — power over life and death in the field.',
    descriptionZh: '假節鉞者,得專征伐、賞罰由己。',
    effects: { leadership: 7, charisma: 2 }, rarity: 'gold', originCityId: 'chengdu',
  },
  {
    id: 'lingqi-command-banner', name: { en: 'Command Banner', zh: '令旗' }, kind: 'treasure',
    description: 'The commander\'s signal banner — the host wheels and charges at its wave.',
    descriptionZh: '主將令旗,一揮之間,萬眾進退。',
    effects: { leadership: 6, war: 1 }, rarity: 'silver', originCityId: 'jianye',
  },
  {
    id: 'longwen-yudai',
    name: { en: 'Dragon Jade Belt', zh: '龍紋玉帶' },
    kind: 'treasure',
    description: 'A dragon-figured jade belt of ducal rank.',
    descriptionZh: '龍紋玉帶,公侯之儀。',
    effects: { politics: 6, charisma: 6 },
    grants: { policy: 'rites' },
    rarity: 'gold',
    forgeOnly: true,
  },
  {
    id: 'zhenguo-shenxi',
    name: { en: 'Realm-Anchoring Seal', zh: '鎮國神璽' },
    kind: 'treasure',
    description: 'The Realm-Anchoring Seal, commanding all under heaven.',
    descriptionZh: '鎮國神璽,號令天下。',
    effects: { politics: 9, charisma: 5 },
    grants: { policy: 'legalism' },
    rarity: 'gold',
    forgeOnly: true,
  },
];

import { ITEMSCORE } from './items/itemsCore';
import { ITEMSATTESTED } from './items/itemsAttested';
import { ITEMSLITERARY } from './items/itemsLiterary';
import { ITEMSLATE } from './items/itemsLate';

export const ITEMS: Item[] = [
  ...ITEMSCORE,
  ...ITEMSATTESTED,
  ...ITEMSLITERARY,
  // 鍛造專屬 — only obtainable at a foundry, so they never scatter as treasure.
  ...FORGE_BATCH_5,
  ...FORGE_BATCH_6,
  ...FORGE_BATCH_7,
  ...FORGE_BATCH_8,
  ...FORGE_BATCH_9,
  ...FORGE_BATCH_10,
  ...ITEMSLATE,
];

// 甲冑歸位 — these were authored as 'treasure' before the armor slot existed;
// reclassify the genuine 甲/鎧/盔 into the dedicated armor slot (so they grant
// 減傷 in battle). Divination shells (龜甲卜) and bribe-jade (薏苡甲) stay treasures.
const ARMOR_ITEM_IDS = new Set([
  'chain-mail', 'longlin-kai', 'liujin-shizi-kui', 'xuanjia', 'yin-kui', 'lion-helm',
  'mingguang-armor', 'man-cheng-jin-jia', 'zhou-tai-xuan-jia', 'ma-dai-tie-jia',
  'zhao-yun-yin-jia', 'qi-jiguang-jia', 'ma-chao-shi-zi-kui', 'zhang-fei-zhuo-jia',
  'huo-qubing-jia', 'shan-wen-jia', 'bu-ren-jia', 'ma-kai', 'zha-jia', 'mian-jia',
]);
for (const it of ITEMS) {
  if (it.kind === 'treasure' && ARMOR_ITEM_IDS.has(it.id)) it.kind = 'armor';
}

export function getItem(id: string): Item | null {
  return ITEMS.find((i) => i.id === id) ?? null;
}

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);
