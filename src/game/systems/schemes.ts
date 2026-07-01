/**
 * 大局計略 — the named schemes that move FORCES, not officers (officer-
 * level 離間 already lives in espionage):
 *
 *  驅虎吞狼 — goad force A into war with force B: their relation craters
 *    and A receives a 討伐 mark against B (+10% combat power toward
 *    them while it lasts). Easiest when they already despise each other.
 *  二虎競食 — set two neighbouring rivals at each other's throats: both
 *    relations drop, both get marks. Costlier, blunter.
 *  遠交近攻 — court the distant power: relations warm with a force that
 *    shares no border with you (distance makes friends cheap).
 *  離間盟好 — shatter an existing alliance/NAP between two rivals: their
 *    pact lapses to neutral and sours. The shallower their bond, the easier.
 *  流言亂政 — a realm-wide whispering campaign: every city of the target
 *    loses loyalty, and its weakest city teeters toward revolt.
 *  疑兵之計 — bluff strength to cow a bordering rival into not marching on
 *    you for a while (a deterrence the AI reads).
 *  趁火打劫 — when a rival is already embroiled (unrest or a war on another
 *    front), take a casus belli to fall on it while it's distracted.
 *
 * Success rides your best mind. Pure planning here; the store applies.
 */
import type { City, EntityId, Officer } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { getRelation } from '../types/diplomacy';

export type SchemeId =
  | 'tiger-wolf'
  | 'two-tigers'
  | 'far-friend'
  | 'sow-discord'
  | 'sow-chaos'
  | 'feign-strength'
  | 'loot-fire'
  | 'chain-link'
  | 'imperial-edict' // 假詔討賊 — hold the 天子: command a rival to attack another (§7.2-2)
  | 'feign-defeat'   // 詐敗誘敵 — feign weakness to bait a bordering rival into a rash war
  | 'fabricate';     // 無中生有 — conjure a false threat: cow a rival and sour it on its ally

export interface SchemeDef {
  id: SchemeId;
  zh: string;
  en: string;
  hintZh: string;
  hintEn: string;
  goldCost: number;
  /** Two targets (A vs B) or one (the distant friend). */
  targets: 1 | 2;
}

export const SCHEME_DEFS: SchemeDef[] = [
  { id: 'tiger-wolf', zh: '驅虎吞狼', en: 'Drive the Tiger', hintZh: '挑動甲勢力攻伐乙 — 兩家本有嫌隙則事半功倍', hintEn: 'Goad force A into war with B — easiest when they already despise each other.', goldCost: 600, targets: 2 },
  { id: 'two-tigers', zh: '二虎競食', en: 'Two Tigers, One Prey', hintZh: '使相鄰兩強互啄 — 雙方交惡並互相得討伐之名', hintEn: 'Set two bordering rivals at each other — both sour, both gain a casus belli.', goldCost: 800, targets: 2 },
  { id: 'far-friend', zh: '遠交近攻', en: 'Befriend the Far', hintZh: '結好無接壤之國 — 遠人之好,近敵之憂', hintEn: 'Warm relations with a power that shares no border with you.', goldCost: 300, targets: 1 },
  { id: 'sow-discord', zh: '離間盟好', en: 'Sow Discord', hintZh: '離間甲乙之同盟/互不侵犯 — 使其反目(盟誼越淺越易)', hintEn: "Shatter A & B's alliance or NAP — the shallower the bond, the easier.", goldCost: 700, targets: 2 },
  { id: 'sow-chaos', zh: '流言亂政', en: 'Sow Chaos', hintZh: '流言撼動敵國全境民心,弱城瀕亂', hintEn: "A realm-wide whispering campaign: every city of the target loses loyalty.", goldCost: 500, targets: 1 },
  { id: 'feign-strength', zh: '疑兵之計', en: 'Feign Strength', hintZh: '虛張聲勢,使接壤強鄰數季不敢來犯', hintEn: 'Bluff strength to cow a bordering rival into not attacking you for a while.', goldCost: 400, targets: 1 },
  { id: 'loot-fire', zh: '趁火打劫', en: 'Loot the Burning House', hintZh: '乘敵內外交困,得討伐之名而擊之', hintEn: 'When a rival is embroiled (unrest or a war elsewhere), take a casus belli against it.', goldCost: 400, targets: 1 },
  { id: 'chain-link', zh: '連環計', en: 'Chain Stratagem', hintZh: '一計連環 — 破甲乙之盟,並驅甲攻乙(需上智之謀,所費不貲)', hintEn: 'Chain two plots: shatter A & B’s pact AND goad A to war with B. Needs a brilliant mind; costly.', goldCost: 1200, targets: 2 },
  { id: 'imperial-edict', zh: '假詔討賊', en: 'Forged Imperial Edict', hintZh: '挾天子者:假詔命甲討乙 — 奉詔之名,甲乙大惡且甲得討伐之名(須挾天子)', hintEn: 'With the Son of Heaven in hand: forge an edict sending A to war on B — A gains a righteous casus belli.', goldCost: 700, targets: 2 },
  { id: 'feign-defeat', zh: '詐敗誘敵', en: 'Feign Defeat', hintZh: '詐示虛弱,驕接壤強鄰之心 — 予我討伐其之名、以逸待勞', hintEn: 'Feign weakness to make a bordering rival overconfident — it covets your land, handing YOU a casus belli.', goldCost: 450, targets: 1 },
  { id: 'fabricate', zh: '無中生有', en: 'Conjure Threat', hintZh: '偽造盟軍/大兵之虛 — 使一國疑我有備而不敢犯,且疑其盟友', hintEn: 'Conjure a false alliance/army: cow a rival into holding off, and sour it on its own ally.', goldCost: 500, targets: 1 },
];

/** Do two forces share a border (any adjacent city pair)? */
export function forcesAdjacent(cities: Record<EntityId, City>, a: EntityId, b: EntityId): boolean {
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== a) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      if (cities[adj]?.ownerForceId === b) return true;
    }
  }
  return false;
}

/** 內外交困 — is force `f` embroiled (a teetering city, or a war on another
 *  front against a non-player rival), so 趁火打劫 has a fire to loot? */
export function forceEmbroiled(
  cities: Record<EntityId, City>,
  diplomacy: DiplomaticState,
  f: EntityId,
  playerForceId: EntityId,
): boolean {
  // A city of theirs in unrest (loyalty < 45).
  for (const c of Object.values(cities)) {
    if (c.ownerForceId === f && c.loyalty < 45) return true;
  }
  // …or at war with a bordering rival that isn't us (a fight on another front).
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== f) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      const owner = cities[adj]?.ownerForceId;
      if (owner && owner !== f && owner !== playerForceId && getRelation(diplomacy, f, owner).status === 'neutral') return true;
    }
  }
  return false;
}

export function schemeOdds(
  scheme: SchemeId,
  diplomacy: DiplomaticState,
  strategist: Officer | null,
  a: EntityId,
  b?: EntityId,
  /** 抗謀 — the target realm's sharpest counsel resists the ploy (its best
   *  advisor's intelligence); a clever court sees through a clumsy scheme. */
  targetCounselIQ?: number,
): number {
  const iq = strategist?.stats.intelligence ?? 50;
  // A wary, intelligent target shaves the odds (0 at IQ ≤ 50, −0.125 at IQ 100).
  const resist = Math.max(0, ((targetCounselIQ ?? 50) - 50) / 400);
  const fin = (x: number, lo = 0.05, hi = 0.95) => Math.max(lo, Math.min(hi, x - resist));
  if (scheme === 'far-friend') return fin(0.55 + iq / 300); // overt courtship — but resistance still applies
  if (scheme === 'sow-chaos') return fin(0.35 + iq / 300, 0.05, 0.9);
  if (scheme === 'feign-strength') return fin(0.45 + iq / 280);
  if (scheme === 'feign-defeat') return fin(0.45 + iq / 280); // 驕兵之計 — as easy to bait as to cow
  if (scheme === 'fabricate') return fin(0.4 + iq / 280);
  if (scheme === 'imperial-edict') return fin(0.5 + iq / 260); // 天子之命,難拒 — the edict carries weight
  if (scheme === 'loot-fire') return fin(0.5 + iq / 300);
  if (scheme === 'chain-link') {
    // An ambitious double-plot: hard, and dearly bought; needs a brilliant mind.
    const rel = b ? getRelation(diplomacy, a, b).score : 0;
    return fin(0.2 + iq / 250 - rel / 250, 0.05, 0.85);
  }
  if (scheme === 'sow-discord') {
    // The shallower the bond between A and B, the easier it is to break.
    const rel = b ? getRelation(diplomacy, a, b).score : 0;
    return fin(0.3 + iq / 280 - rel / 220, 0.05, 0.9);
  }
  const rel = b ? getRelation(diplomacy, a, b).score : 0;
  // The worse they get along, the easier the push.
  const base = scheme === 'tiger-wolf' ? 0.35 : 0.28;
  return fin(base + iq / 280 - rel / 180, 0.05, 0.9);
}

/**
 * 反間敗露 — the chance a scheme is traced back to its author. A botched plot is
 * far likelier to be exposed than a clean one; a brilliant 軍師 covers their tracks.
 * Overt courtship (遠交近攻) has nothing to hide. Pure read; the store applies the
 * fallout (the manipulated realm(s) resent the schemer).
 */
export function schemeExposureChance(
  scheme: SchemeId,
  succeeded: boolean,
  strategistIQ: number,
): number {
  if (scheme === 'far-friend') return 0; // an open embassy, not a plot
  const base = succeeded ? 0.12 : 0.35;
  return Math.max(0.03, Math.min(0.6, base - strategistIQ / 350));
}

const ZH_EN = {
  self: '不可以己方為目標',
  adjacent: '遠交者不可接壤',
  twoDistinct: '需選兩個不同目標',
  notAdjacent: '兩家無接壤,驅之不動',
  noPact: '二者本無盟可離',
  notAdjacentPlayer: '其與我不接壤,疑兵無用',
  notEmbroiled: '敵未陷困,無火可趁',
};

export function validateScheme(
  scheme: SchemeId,
  cities: Record<EntityId, City>,
  playerForceId: EntityId,
  a: EntityId,
  b?: EntityId,
  diplomacy?: DiplomaticState,
): string | null {
  if (a === playerForceId || b === playerForceId) return ZH_EN.self;
  if (scheme === 'far-friend') {
    if (forcesAdjacent(cities, playerForceId, a)) return ZH_EN.adjacent;
    return null;
  }
  if (scheme === 'sow-chaos' || scheme === 'fabricate') return null; // any rival realm
  if (scheme === 'feign-strength' || scheme === 'feign-defeat') {
    if (!forcesAdjacent(cities, playerForceId, a)) return ZH_EN.notAdjacentPlayer;
    return null;
  }
  if (scheme === 'imperial-edict') {
    // 奉詔討賊 — command A to war on B; the 天子 speaks from afar (no adjacency).
    if (!b || a === b) return ZH_EN.twoDistinct;
    return null; // the 挾天子 requirement is checked in the store (it holds the emperor state)
  }
  if (scheme === 'loot-fire') {
    if (diplomacy && !forceEmbroiled(cities, diplomacy, a, playerForceId)) return ZH_EN.notEmbroiled;
    return null;
  }
  if (scheme === 'sow-discord' || scheme === 'chain-link') {
    if (!b || a === b) return ZH_EN.twoDistinct;
    if (diplomacy) {
      const st = getRelation(diplomacy, a, b).status;
      if (st !== 'allied' && st !== 'non-aggression') return ZH_EN.noPact;
    }
    return null;
  }
  // tiger-wolf / two-tigers
  if (!b || a === b) return ZH_EN.twoDistinct;
  if (!forcesAdjacent(cities, a, b)) return ZH_EN.notAdjacent;
  return null;
}
