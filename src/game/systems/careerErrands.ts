import type { City, EntityId, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { careerStanding, RANK_COMMONER, RANK_RETAINER, RANK_LOWEST_OFFICE } from './career';

/**
 * 差事 — 白身接得到的活。
 *
 * 這是整條成長線缺的那一環。前面做了階梯(career)、閘門(careerAuthority)、
 * 投效(careerFollowers),但白身沒有<b>掙功績的辦法</b>:能做的只有習武比試,
 * 而那些不記戰功。於是階梯爬不動,投效也永遠停在三兩個鄉勇。
 *
 * 差事補的就是這個缺口:縣裡出了盜匪、商隊要人押、大戶要人看家 ——
 * 你去做,拿錢、拿名、拿功績。三個設計原則:
 *
 * 一、<b>差事從城的處境長出來,不是憑空刷的</b>。治安差才有盜匪可剿、
 *     有商業才有商隊可押、鬧饑荒才有人請你護糧。世界的狀態決定你能接什麼活,
 *     所以「這個縣現在怎麼樣」是玩家真的需要知道的事。
 * 二、<b>會死人</b>。帶著三個宾客去剿五十個盜匪,那叫送死。私兵、武力與
 *     難度的落差直接換成傷亡與受傷,不是失敗就重來。
 * 三、<b>報酬要能換成品階</b>。功績直接進 deeds,所以做活就是在爬階梯 ——
 *     這條線一旦接上,白身才真的有路可走。
 */

export type ErrandKind =
  | 'bandits'     // 剿匪 — 治安差的縣才有
  | 'escort'      // 押鏢 — 商業旺的縣才有
  | 'manhunt'     // 緝拿 — 有逃犯/細作
  | 'relief'      // 護糧 — 饑荒時
  | 'guard';      // 護院 — 大戶人家,哪裡都有

export interface Errand {
  id: string;
  kind: ErrandKind;
  cityId: EntityId;
  /** 難度 1–5。決定風險與報酬。 */
  tier: number;
  /** 雇主 — 有名有姓的話,做成了會記人情。 */
  patronId: EntityId | null;
  goldReward: number;
  /** 需要的兵力下限 — 不足硬接會死人。 */
  wantTroops: number;
}

export const ERRAND_LABEL: Record<ErrandKind, { zh: string; en: string }> = {
  bandits: { zh: '剿匪', en: 'Bandit hunt' },
  escort: { zh: '押鏢', en: 'Escort' },
  manhunt: { zh: '緝拿', en: 'Manhunt' },
  relief: { zh: '護糧', en: 'Grain convoy' },
  guard: { zh: '護院', en: 'House guard' },
};

/** 這個品階還接不接差事 — 太守以上有正經公務,不會再去接私活。 */
export function takesErrands(rank: number): boolean {
  return rank > 5;
}

/**
 * 城裡現在有什麼活可接。純函式 — 同一座城同一季永遠給同一批,
 * 玩家才不會靠刷新刷出好差事。
 */
export function errandsAt(input: {
  city: City;
  year: number;
  season: string;
  rank: number;
  roll: () => number;
  /** 城裡的人 — 用來挑雇主。省略則差事無主(舊行為)。 */
  officers?: Record<EntityId, Officer>;
  /** 主角 — 不會自己委託自己。 */
  heroId?: EntityId;
}): Errand[] {
  const { city, rank } = input;
  const patrons = input.officers
    ? patronsAt(input.officers, city.id, input.heroId, rank)
    : [];
  if (!takesErrands(rank)) return [];
  const out: Errand[] = [];
  const key = `${city.id}-${input.year}-${input.season}`;
  const push = (kind: ErrandKind, tier: number, want: number) => {
    out.push({
      id: `${key}-${kind}`,
      kind,
      cityId: city.id,
      tier,
      // 雇主 — 有名有姓的委託人。人情就是從這裡長出來的:
      // 你替他辦成了,他記著;記著你的人多了,才有人肯替你說話。
      patronId: patrons.length
        ? patrons[Math.floor(input.roll() * patrons.length) % patrons.length].id
        : null,
      // 報酬隨難度陡升 —— 三級以上才值得冒險
      goldReward: Math.round(24 * tier * tier * (0.8 + input.roll() * 0.5)),
      wantTroops: want,
    });
  };

  // 民心低則盜匪起 —— 用 loyalty 當治安的指標,越低匪患越凶。
  const order = city.loyalty ?? 70;
  if (order < 66) {
    const tier = order < 30 ? 4 : order < 48 ? 3 : 2;
    push('bandits', tier, tier * 40);
  }
  // 商業旺 → 有鏢可押
  if ((city.commerce ?? 0) >= 55) push('escort', 2, 30);
  // 鬧饑荒 → 護糧
  if ((city.food ?? 99999) < 9000) push('relief', 3, 60);
  // 大戶護院 — 哪裡都有,錢少但穩,是白身的保底
  push('guard', 1, 0);
  // 緝拿 — 人口多的縣才藏得住人
  if ((city.population ?? 0) > 120000) push('manhunt', 2, 10);

  return out;
}

/**
 * 誰會託你辦事。
 *
 * 兩條規矩:**得在同一座城**(不在眼前的人不會託你),而且
 * **身價不能離你太遠** —— 白身接不到太守的委託,那不合情理,
 * 也會讓「人情」這條線一開始就跳級。
 */
export function patronsAt(
  officers: Record<EntityId, Officer>,
  cityId: EntityId,
  heroId: EntityId | undefined,
  rank: number,
): Officer[] {
  // 品階越低,託得起你的人也越小 —— 白身只接得到小吏與鄉紳的活
  const ceiling = rank >= RANK_COMMONER ? 170 : rank >= RANK_RETAINER ? 200 : 260;
  return Object.values(officers).filter((o) => {
    if (o.id === heroId) return false;
    if (o.locationCityId !== cityId) return false;
    if (o.status === 'dead' || o.status === 'unsearched' || o.status === 'imprisoned') return false;
    const s = o.stats;
    return s.politics + s.leadership + s.charisma <= ceiling;
  });
}

/**
 * 人情的增減 — 辦成了記多少,砸了扣多少。
 *
 * 辦砸比辦成扣得凶:替人辦事,搞砸一次抵得上辦成兩次。
 */
export function favorDelta(grade: 0 | 1 | 2 | 3, tier: number): number {
  if (grade === 3) return 3 + tier;
  if (grade === 2) return 2 + Math.floor(tier / 2);
  if (grade === 1) return -2;
  return -(3 + tier);
}

export interface ErrandOutcome {
  /** 0 大敗 · 1 失手 · 2 辦成 · 3 漂亮 */
  grade: 0 | 1 | 2 | 3;
  gold: number;
  /** 折進 deeds 的功績來源。 */
  deeds: Partial<HeroicDeeds>;
  renown: number;
  /** 私兵折損。 */
  losses: number;
  /** 主角受傷幾季(0 = 沒事)。 */
  wounded: number;
  textZh: string;
  textEn: string;
}

/**
 * 勝算 0..1 — 抽出來是為了讓面板顯示得出來。
 *
 * 「會死人」這條設計要成立,玩家就得<b>看得到自己在賭什麼</b>;
 * 不給資訊的風險不叫風險,叫耍賴。
 */
export function errandOdds(e: Errand, hero: Officer): number {
  const troops = hero.privateTroops ?? 0;
  const s = hero.stats;
  const skill = e.kind === 'manhunt'
    ? (s.intelligence * 0.7 + s.politics * 0.3)
    : (s.war * 0.55 + s.leadership * 0.45);
  const skillPull = Math.max(0, Math.min(1, (skill - 40) / 55));
  const manning = e.wantTroops <= 0 ? 1
    : Math.max(0, Math.min(1.15, troops / e.wantTroops));
  return Math.max(0.04, Math.min(0.96,
    0.30 + skillPull * 0.48 + (manning - 0.5) * 0.34 - (e.tier / 5) * 0.34,
  ));
}

/**
 * 辦差的判定。
 *
 * 勝算來自三處:主角本事(武力/統率)、帶的人夠不夠、以及難度。
 * 兵力不足是最致命的一項 —— 差一半就砍掉四成勝算,而且死得最慘。
 */
export function resolveErrand(input: {
  errand: Errand;
  hero: Officer;
  deeds: HeroicDeeds | undefined;
  roll: () => number;
}): ErrandOutcome {
  const { errand: e, hero } = input;
  const troops = hero.privateTroops ?? 0;
  // 兵力缺口 — 失手時賠多少全看這個
  const manning = e.wantTroops <= 0 ? 1
    : Math.max(0, Math.min(1.15, troops / e.wantTroops));
  const shortfall = Math.max(0, 1 - manning);

  const odds = errandOdds(e, hero);

  const r = input.roll();
  const grade: 0 | 1 | 2 | 3 = r < odds * 0.28 ? 3 : r < odds ? 2 : r < odds + 0.28 ? 1 : 0;

  const rank = careerStanding(input.deeds).rank;
  // 品階越低,同一件差事給的功績越重 —— 白身的第一場仗該有份量
  const meritMul = rank >= RANK_COMMONER ? 1.6 : rank >= RANK_RETAINER ? 1.3 : 1.0;

  const deeds: Partial<HeroicDeeds> = {};
  let gold = 0;
  let renown = 0;
  let losses = 0;
  let wounded = 0;

  if (grade >= 2) {
    gold = Math.round(e.goldReward * (grade === 3 ? 1.5 : 1));
    renown = Math.round(e.tier * (grade === 3 ? 2.2 : 1.2));
    const scale = Math.round(e.tier * meritMul * (grade === 3 ? 1.6 : 1));
    if (e.kind === 'bandits') {
      deeds.battlesWon = 1;
      deeds.killsTroops = 120 * scale;
    } else if (e.kind === 'manhunt') {
      deeds.espionageSuccess = Math.max(1, Math.round(scale * 0.8));
    } else {
      deeds.civicWorks = Math.max(1, scale * 2);
    }
    // 打贏了也會折人 — 只是少
    losses = Math.round(troops * 0.04 * e.tier * (grade === 3 ? 0.4 : 1) * input.roll());
  } else {
    // 失手:兵力差得越多,賠得越慘
    losses = Math.round(troops * (0.10 + shortfall * 0.34) * (grade === 0 ? 1.7 : 1));
    renown = grade === 0 ? -Math.round(e.tier * 0.8) : 0;
    if (grade === 0) {
      // 大敗才可能傷到主角本人,而且兵越不夠越可能
      const hurt = input.roll() < 0.28 + shortfall * 0.45;
      wounded = hurt ? (input.roll() < 0.25 ? 3 : 1) : 0;
    }
  }
  losses = Math.max(0, Math.min(troops, losses));

  const label = ERRAND_LABEL[e.kind];
  const zh = grade === 3 ? `${label.zh}辦得漂亮` : grade === 2 ? `${label.zh}辦成了`
    : grade === 1 ? `${label.zh}沒辦成` : `${label.zh}大敗`;
  const en = grade === 3 ? `${label.en} — done handsomely` : grade === 2 ? `${label.en} — done`
    : grade === 1 ? `${label.en} — failed` : `${label.en} — routed`;

  return { grade, gold, deeds, renown, losses, wounded, textZh: zh, textEn: en };
}

/** 把差事的功績併進既有的 deeds 記錄。 */
export function mergeDeeds(base: HeroicDeeds | undefined, add: Partial<HeroicDeeds>): HeroicDeeds {
  const b = (base ?? {}) as HeroicDeeds;
  const out = { ...b } as HeroicDeeds & Record<string, number>;
  for (const [k, v] of Object.entries(add)) {
    if (typeof v === 'number') out[k] = ((b as unknown as Record<string, number>)[k] ?? 0) + v;
  }
  return out;
}

/** 有官身之後差事會變少 —— 那時候你該去打仗,不是去替人看家。 */
export function errandCap(rank: number): number {
  if (rank >= RANK_COMMONER) return 4;
  if (rank >= RANK_RETAINER) return 3;
  if (rank >= RANK_LOWEST_OFFICE) return 2;
  return 1;
}
