import type { City, EntityId, Force } from '../types';
import { getRelation, pairKey, type DiplomaticState } from '../types';
import { breakAlliance } from './diplomacy';

/**
 * AI 背盟 —— 撕毀盟約這件事,此前**只有玩家做得到**。
 *
 * `isHostilePermitted` 只在關係為 `neutral` 時放行,而 `breakAlliance` 是
 * store 上的玩家動作,AI 沒有對應的路。後果不是「AI 比較守信」,是
 * **好幾張盤的前提在 AI 手上演不出來**:
 *
 *  - 211 渭南盤劉備與劉璋是 non-aggression(史實上他正是被請進去的),
 *    於是 AI 劉備**永遠**打不了益州,而他的主目標就叫「西取益州」。
 *  - 同理孫權與蜀漢結盟則永無白衣渡江;任何一紙盟約一旦簽下就是永久的。
 *
 * 史書上這些盟約撕得比誰都快。所以給 AI 一條同樣的路,並且要它付同樣的代價:
 * 信譽 −25、對方積怨 +30、四鄰側目(關係各 −8)。
 *
 * 門檻刻意收得緊 —— 背盟要划算才有人做:
 *  1. 只撕 `non-aggression`(結盟 `allied` 另有聯姻/會盟系統管,不在此列)
 *  2. 兩家要真的接壤,而且對面有一座**我吃得下**的城(壓境兵力 ≥ 守軍 1.3 倍)
 *  3. 我的總兵力 ≥ 對方 1.6 倍 —— 打不過的人不會背盟,只會守約
 *  4. 關係已經不好(≤ +40)—— 情同兄弟的不會半夜翻臉
 *  5. 君主性格:暴虐/積極的敢,守成/學者的不敢(appetite 乘數)
 *  6. 每季每家至多一次,基礎機率 8%
 */

/** 背盟的代價 —— 與玩家那一側(store 的 breakAlliance)刻意同數。 */
export const BETRAYAL_CREDIBILITY_COST = 25;
export const BETRAYAL_GRUDGE = 30;
/** 四鄰對背信者的觀感。 */
export const BETRAYAL_BYSTANDER_RELATION = -8;
/** 每季每家的基礎機率(再乘君主性格的胃口)。 */
export const BETRAYAL_BASE_CHANCE = 0.08;
/** 兵力優勢門檻 —— 打不過的人不會背盟。 */
export const BETRAYAL_STRENGTH_RATIO = 1.6;
/** 情同兄弟的不會半夜翻臉。 */
export const BETRAYAL_MAX_RELATION = 40;

export interface BetrayalDecision {
  /** 背盟者。 */
  byForceId: EntityId;
  /** 被撕約的一方。 */
  targetForceId: EntityId;
  /** 讓他動心的那座城(進報表用)。 */
  prizeCityId: EntityId;
}

export interface AIBetrayalInput {
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  /** 只有 AI 會走這條;人類勢力照舊由玩家自己決定。 */
  aiForceIds: EntityId[];
  /** 君主性格胃口(1 = 常人);沿用 personalityDiplomacyAppetite 的反面。 */
  appetiteOf: (forceId: EntityId) => number;
  rng: () => number;
}

function totalTroops(forceId: EntityId, cities: Record<EntityId, City>): number {
  let n = 0;
  for (const c of Object.values(cities)) if (c.ownerForceId === forceId) n += c.troops;
  return n;
}

/**
 * 這一季有誰要背盟。純函數,不動任何狀態 —— 呼叫端拿去改外交、信譽與積怨。
 */
export function decideBetrayals(input: AIBetrayalInput): BetrayalDecision[] {
  const { forces, cities, diplomacy, aiForceIds, appetiteOf, rng } = input;
  const out: BetrayalDecision[] = [];
  const strength = new Map<EntityId, number>();
  const troopsOf = (id: EntityId) => {
    if (!strength.has(id)) strength.set(id, totalTroops(id, cities));
    return strength.get(id)!;
  };

  for (const forceId of aiForceIds) {
    const force = forces[forceId];
    if (!force || force.vassalOfForceId) continue;
    if (rng() >= BETRAYAL_BASE_CHANCE * appetiteOf(forceId)) continue;

    const mine = Object.values(cities).filter((c) => c.ownerForceId === forceId);
    if (!mine.length) continue;
    const myTroops = troopsOf(forceId);

    // 壓境兵力:每一座我的邊城可投入約六成戍卒(與 pickForceTarget 同一口徑)。
    const pressure: Record<EntityId, number> = {};
    for (const c of mine) {
      for (const adjId of c.adjacentCityIds) {
        const adj = cities[adjId];
        if (!adj || !adj.ownerForceId || adj.ownerForceId === forceId) continue;
        if (getRelation(diplomacy, forceId, adj.ownerForceId).status !== 'non-aggression') continue;
        pressure[adjId] = (pressure[adjId] ?? 0) + c.troops * 0.6;
      }
    }

    let best: { target: EntityId; prize: EntityId; score: number } | null = null;
    for (const [candId, force2] of Object.entries(pressure)) {
      const cand = cities[candId];
      const owner = cand?.ownerForceId;
      if (!cand || !owner) continue;
      const rel = getRelation(diplomacy, forceId, owner);
      if (rel.score > BETRAYAL_MAX_RELATION) continue;
      if (myTroops < troopsOf(owner) * BETRAYAL_STRENGTH_RATIO) continue;
      const effDef = cand.troops * (1 + cand.defense / 200);
      if (force2 < effDef * 1.3) continue;  // 吃不下就不必翻臉
      const score = (force2 / Math.max(1, effDef)) * (1 + (cand.population ?? 0) / 200_000);
      if (!best || score > best.score) best = { target: owner, prize: candId, score };
    }
    if (best) out.push({ byForceId: forceId, targetForceId: best.target, prizeCityId: best.prize });
  }
  return out;
}

/** 把一次背盟落到外交表上:盟約撕毀、關係重挫、四鄰側目。 */
export function applyBetrayal(
  diplomacy: DiplomaticState,
  d: BetrayalDecision,
  allForceIds: EntityId[],
): DiplomaticState {
  let next = breakAlliance(diplomacy, d.byForceId, d.targetForceId);
  for (const other of allForceIds) {
    if (other === d.byForceId || other === d.targetForceId) continue;
    const rel = getRelation(next, d.byForceId, other);
    next = {
      relations: {
        ...next.relations,
        [pairKey(d.byForceId, other)]: {
          ...rel,
          score: Math.max(-100, rel.score + BETRAYAL_BYSTANDER_RELATION),
        },
      },
    };
  }
  return next;
}
