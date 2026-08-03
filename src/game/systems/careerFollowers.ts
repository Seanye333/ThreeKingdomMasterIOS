import type { EntityId, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { careerStanding, careerGuardCap, RANK_COMMONER, RANK_RETAINER } from './career';

/**
 * 投效 — 一代記主角靠自己的所作所為招來的人。
 *
 * 這不是君主的求賢令(那是 commonerTalent.ts,以勢力之名招天下士),而是
 * <b>一個人如何從一個人變成一群人</b>:你剿了匪、鄉里記著你,於是有人願意
 * 跟你走。它是「個人」跨到「小隊」的那一步,也是整條成長線最關鍵的一環。
 *
 * 三個設計取捨:
 *
 * 一、<b>來投是功績的回報,不是花錢買的</b>。募兵用錢,投效用名 ——
 *     所以它獎勵的是你真的去做了事,而不是你攢了多少金。
 * 二、<b>同鄉是最強的一條線</b>。你在自己的家鄉,人脈與信任都在那裡;
 *     來投的義士也優先從同鄉的在野武將裡挑 —— 這正好用上武將表的籍貫。
 * 3、<b>品階是天花板</b>。人願意跟你,不代表你養得起、帶得動。
 *     白身只養得了幾個賓客,想帶隊就得先掙個出身 —— 升品的動機由此而來。
 */

export interface FollowerContext {
  deeds: HeroicDeeds | undefined;
  /** 主角的魅力 — 人望。 */
  charisma: number;
  /** 戰功威望。 */
  renown: number;
  /** 主角此刻所在的城。 */
  locationCityId: EntityId | null;
  /** 主角的籍貫。 */
  hometownCityId: EntityId | null | undefined;
  /** 現有私兵。 */
  privateTroops: number;
  /** 主角統率 — 只決定能不能摸到品階給的天花板。 */
  leadership: number;
}

/**
 * 投效之望 0..1 — 每季有多少人想跟著你。
 *
 * 功績佔大頭(你做過什麼),人望次之(你是什麼人),威望再次(別人怎麼說你)。
 * 在家鄉另加一成半 —— 鄉里的信任是白身唯一拿得出手的本錢。
 */
export function followerDraw(ctx: FollowerContext): number {
  const merit = careerStanding(ctx.deeds).merit;
  const deedPull = Math.min(1, merit / 260);
  const humanity = Math.max(0, Math.min(1, (ctx.charisma - 45) / 45));
  const fame = Math.min(1, ctx.renown / 110);
  const home = ctx.hometownCityId && ctx.locationCityId === ctx.hometownCityId ? 0.16 : 0;
  return Math.max(0, Math.min(1, 0.44 * deedPull + 0.28 * humanity + 0.12 * fame + home));
}

/** 每季有人來投的機率。白身也有,只是少 —— 開局就完全沒動靜會讓人以為壞了。 */
export function followerChance(draw: number, rank: number): number {
  const base = rank >= RANK_COMMONER ? 0.16 : rank >= RANK_RETAINER ? 0.24 : 0.30;
  return Math.max(0, Math.min(0.62, base + draw * 0.34));
}

export interface FollowerRoll {
  /** 鄉勇 — 無名之輩,直接進私兵。 */
  levies: number;
  /** 因品階上限而收不下的人數 — 用來告訴玩家「你該升官了」。 */
  turnedAway: number;
  /** 義士 — 有名有姓的在野武將願意追隨(部曲以上才有)。 */
  recruitId?: EntityId;
  /** 這次是不是靠同鄉的情面。 */
  viaHometown: boolean;
}

/**
 * 挑一個願意來投的在野武將。
 *
 * 同鄉優先 —— 那 344 個有籍貫的武將在這裡第一次真正派上用場。
 * 其次才看合不合得來:你的品階撐不撐得住對方的身價(名將不會跟著白身走)。
 */
export function pickJoiner(input: {
  officers: Record<EntityId, Officer>;
  heroId: EntityId;
  hometownCityId: EntityId | null | undefined;
  locationCityId: EntityId | null;
  rank: number;
  roll: number;
}): { id: EntityId; viaHometown: boolean } | null {
  if (input.rank > RANK_RETAINER) return null;      // 白身還招不到有名有姓的人
  const ceiling = input.rank <= 5 ? 999 : input.rank <= 7 ? 210 : 165;

  const pool: Array<{ id: EntityId; home: boolean; worth: number }> = [];
  for (const o of Object.values(input.officers)) {
    if (o.id === input.heroId) continue;
    if (o.forceId !== null && o.forceId !== undefined) continue;   // 只找在野
    if (o.status === 'dead' || o.status === 'unsearched' || o.status === 'imprisoned') continue;
    const s = o.stats;
    const worth = s.war + s.leadership + s.intelligence;
    if (worth > ceiling) continue;                  // 名將不會跟著小官走
    const home = !!input.hometownCityId && o.hometownCityId === input.hometownCityId;
    const near = o.locationCityId === input.locationCityId;
    if (!home && !near) continue;                   // 要嘛同鄉,要嘛就在眼前
    pool.push({ id: o.id, home, worth });
  }
  if (!pool.length) return null;

  // 同鄉排前面 — 有同鄉就從同鄉裡挑
  const homies = pool.filter((p) => p.home);
  const use = homies.length ? homies : pool;
  const pick = use[Math.floor(input.roll * use.length) % use.length];
  return { id: pick.id, viaHometown: pick.home };
}

/**
 * 一季的投效結算。純函式 — 亂數由呼叫端注入,存檔才重現得出同一個世界。
 */
export function rollFollowers(
  ctx: FollowerContext,
  officers: Record<EntityId, Officer>,
  heroId: EntityId,
  rolls: [number, number, number],
): FollowerRoll {
  const standing = careerStanding(ctx.deeds);
  const draw = followerDraw(ctx);
  const none: FollowerRoll = { levies: 0, turnedAway: 0, viaHometown: false };
  if (rolls[0] > followerChance(draw, standing.rank)) return none;

  // 鄉勇人數 — 品階越高,一次來得越多
  const scale = standing.rank >= RANK_COMMONER ? 3
    : standing.rank >= RANK_RETAINER ? 9
      : standing.rank >= 8 ? 24 : 60;
  const wanted = 1 + Math.floor(rolls[1] * scale * (0.5 + draw));

  const cap = careerGuardCap(standing, ctx.leadership);
  const room = Math.max(0, cap - ctx.privateTroops);
  const levies = Math.min(wanted, room);
  const turnedAway = wanted - levies;

  // 義士 — 部曲以上,而且要比鄉勇罕見得多
  let recruitId: EntityId | undefined;
  let viaHometown = false;
  if (rolls[2] < 0.22 + draw * 0.20) {
    const joiner = pickJoiner({
      officers, heroId,
      hometownCityId: ctx.hometownCityId,
      locationCityId: ctx.locationCityId,
      rank: standing.rank,
      roll: rolls[2],
    });
    if (joiner) {
      recruitId = joiner.id;
      viaHometown = joiner.viaHometown;
    }
  }
  return { levies, turnedAway, recruitId, viaHometown };
}
