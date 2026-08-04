import type { EntityId, Officer } from '../types';
import { careerStanding, RANK_COMMONER, RANK_LOWEST_OFFICE } from './career';

/**
 * 人情與薦舉 — 797 個武將真正進入玩家生活的地方。
 *
 * 漢末仕進靠察舉,不靠考試:你要出頭,就得有人肯替你說話。
 * 這條線把前面幾件事串起來 —— 差事有雇主,替雇主辦成了記人情,
 * 人情夠厚,那個人便會在上頭替你舉薦。
 *
 * 設計上刻意讓它<b>比自己掙功績快、但不受自己控制</b>:
 * 舉薦是別人給的,所以它獎勵的是「你替誰辦過事」而不是「你刷了多少活」。
 * 一個把全縣得罪光的人,武藝再高也升不上去。
 */

/** 一段人情。正數是他欠你,負數是你欠他(或他記恨你)。 */
export type Favors = Record<EntityId, number>;

/** 薦舉需要的人情門檻 — 跟著品階水漲船高。 */
export function recommendThreshold(rank: number): number {
  if (rank >= RANK_COMMONER) return 8;
  if (rank >= RANK_LOWEST_OFFICE) return 14;
  return 22;
}

/**
 * 這個人有沒有份量替你說話。
 *
 * 舉薦是把自己的名聲押在你身上,所以得是個<b>說話有人聽</b>的人:
 * 政治與魅力撐得起,而且不能比你還低微。
 */
export function canRecommend(patron: Officer, heroRank: number): boolean {
  const weight = patron.stats.politics * 0.6 + patron.stats.charisma * 0.4;
  // 分四檔 —— 一個縣吏薦得動白身,薦不動都督。
  // 併成兩檔的話,「舉薦的份量該跟著你水漲船高」這條就形同虛設。
  const need = heroRank >= RANK_COMMONER ? 52
    : heroRank >= RANK_LOWEST_OFFICE ? 62
      : heroRank >= 6 ? 74
        : 86;
  return weight >= need && patron.status !== 'dead' && patron.status !== 'imprisoned';
}

export interface Recommendation {
  patronId: EntityId;
  /** 折算成功績 — 薦舉是條捷徑,但走不遠。 */
  merit: number;
}

/**
 * 每季結算:有沒有人替你說話。
 *
 * 只挑<b>人情最厚的那一個</b> —— 舉薦是件鄭重的事,不會一季來三個。
 * 觸發後人情要扣掉,人情是用得完的:欠你的還了,就不再欠了。
 */
export function rollRecommendation(input: {
  favors: Favors;
  officers: Record<EntityId, Officer>;
  heroDeeds: import('../types/deeds').HeroicDeeds | undefined;
  roll: number;
}): Recommendation | null {
  const standing = careerStanding(input.heroDeeds);
  const need = recommendThreshold(standing.rank);

  let best: { id: EntityId; favor: number } | null = null;
  for (const [id, favor] of Object.entries(input.favors)) {
    if (favor < need) continue;
    const p = input.officers[id];
    if (!p || !canRecommend(p, standing.rank)) continue;
    if (!best || favor > best.favor) best = { id, favor };
  }
  if (!best) return null;

  // 人情越厚,開口的機會越大,但永遠不是必然
  const chance = Math.min(0.55, 0.18 + (best.favor - need) * 0.02);
  if (input.roll > chance) return null;

  // 折算功績 — 大致等於一級的一半,所以薦舉是助力不是捷徑
  const merit = Math.round(need * 0.9);
  return { patronId: best.id, merit };
}

/** 薦舉之後人情消耗掉一部分 — 人情是用得完的。 */
export function spendFavor(favors: Favors, patronId: EntityId, need: number): Favors {
  const next = { ...favors };
  next[patronId] = Math.max(0, (next[patronId] ?? 0) - need);
  return next;
}

/** 記一筆人情。 */
export function addFavor(favors: Favors | undefined, patronId: EntityId, delta: number): Favors {
  const next = { ...(favors ?? {}) };
  next[patronId] = (next[patronId] ?? 0) + delta;
  return next;
}
