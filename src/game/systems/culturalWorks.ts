/**
 * 文華 — 題詠與立祠 (§1.13).
 *
 * The age's other contest. 曹操 wrote 觀滄海 standing on the shore he had just
 * conquered; 曹丕 held that literature was "經國之大業,不朽之盛事"; and the men
 * who won the wars are remembered partly because somebody built them a shrine
 * and somebody else wrote them into a poem. A realm that only counts grain and
 * spears is missing half of what a Han court thought it was for.
 *
 * Two acts, both cheap in gold and slow in payoff:
 *
 *   題詠 — an officer of letters composes at a famous site or after a great
 *          event. The poem is REAL text (assembled from period-shaped lines,
 *          not a placeholder), goes into the realm's 文集, lifts the city's
 *          文教 and the author's renown, and can outlive both of them.
 *   立祠 — raise a shrine to an officer who has died. The city that keeps his
 *          memory keeps its faith with you (loyalty), his kin serve more
 *          willingly (clan loyalty), and pilgrims raise 文教 for good.
 *
 * Pure. The store holds `poems` / `shrines`; this file decides what they are
 * worth and what they say.
 */

import type { EntityId, Officer } from '../types';

// ─── 題詠 ─────────────────────────────────────────────────────────────

export type PoemOccasion =
  | 'scenic'    // 登臨題詠 — at a famous site
  | 'victory'   // 凱歌 — after taking a city
  | 'mourning'  // 悼亡 — for the newly dead
  | 'banquet'   // 讌集 — at a feast
  | 'exile';    // 述懷 — in adversity

export interface Poem {
  id: EntityId;
  authorId: EntityId;
  cityId: EntityId | null;
  year: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  occasion: PoemOccasion;
  titleZh: string;
  /** Four lines, already assembled. */
  linesZh: string[];
  /** 0–100. Drives every effect and whether it is remembered at all. */
  quality: number;
}

export const POEM_GOLD_COST = 150;
/** A poem this good enters the annals and is remembered after its author. */
export const POEM_MEMORABLE = 70;

const TITLE_HEAD: Record<PoemOccasion, string[]> = {
  scenic:   ['登', '望', '遊', '題'],
  victory:  ['凱歌', '軍中作', '破陣', '獻捷'],
  mourning: ['悼', '哭', '輓', '祭'],
  banquet:  ['公讌', '夜飲', '雅集', '對酒'],
  exile:    ['述懷', '詠懷', '感遇', '客中作'],
};

/** Opening lines, by occasion — the scene the poem is spoken from. */
const OPEN: Record<PoemOccasion, string[]> = {
  scenic: ['東臨碣石,以觀滄海', '朝登百尺樓,遙望九州路', '高台多悲風,朝日照北林', '川上寒風起,野中霜草衰'],
  victory: ['戈甲未解,旌旆先歸', '鼓鼙才定,笳吹入雲', '轅門曉月,尚照殘旗', '甲光向日,金鼓連天'],
  mourning: ['素車白馬,送子於途', '生死一別,音容永隔', '故人西去,不復東來', '哭君無淚,淚已先枯'],
  banquet: ['對酒當歌,人生幾何', '置酒高堂上,親交從我遊', '清夜遊西園,飛蓋相追隨', '嘉賓滿座,絲竹並陳'],
  exile: ['客行雖云樂,不如早旋歸', '飄飄何所似,天地一沙鷗', '身在江海,心存魏闕', '長路漫漫,吾將何依'],
};

const MIDDLE = [
  '樹木何蕭瑟,北風聲正悲',
  '白骨露於野,千里無雞鳴',
  '瞻彼中原,烽火未息',
  '烈士暮年,壯心不已',
  '譬如朝露,去日苦多',
  '月明星稀,烏鵲南飛',
  '山不厭高,海不厭深',
  '秋風蕭瑟,洪波湧起',
  '人生天地間,忽如遠行客',
  '功名竹帛上,豈為一身謀',
];

const CLOSE = [
  '幸甚至哉,歌以詠志',
  '安得猛士兮守四方',
  '慨當以慷,憂思難忘',
  '天下歸心,其在今日',
  '留取丹心,照汗青上',
  '此意悠悠,寄之絃歌',
];

/**
 * 詩才 — how good the poem is. Letters were the gentry's own game: 智 carries
 * it, 魅 gives it voice, and a man already famed for his brush writes better
 * than his raw stats suggest. A famous site (or a great occasion) lifts anyone.
 */
export function poemQuality(args: {
  author: Pick<Officer, 'stats' | 'renown'>;
  occasion: PoemOccasion;
  /** At a 名勝 / after a real event — an occasion worth writing about. */
  occasionWeight?: number;
  /** The city's 文教 — a lettered city has better company to write for. */
  culture?: number;
  rng?: () => number;
}): number {
  const rng = args.rng ?? Math.random;
  const wit = args.author.stats.intelligence;
  const voice = args.author.stats.charisma;
  const fame = Math.min(20, (args.author.renown ?? 0) / 6);
  const base = wit * 0.45 + voice * 0.3 + fame;
  const occasionLift = (args.occasionWeight ?? 0) * 10 + (args.culture ?? 0) * 0.08;
  // 詩成於興 — the same man does not write equally well twice.
  const inspiration = (rng() - 0.35) * 26;
  return Math.max(0, Math.min(100, Math.round(base + occasionLift + inspiration)));
}

/**
 * Compose the poem itself. Deterministic given the rng — the same roll always
 * writes the same poem, so a save/reload can't reroll a masterpiece.
 */
export function composePoem(args: {
  author: Officer;
  cityId: EntityId | null;
  cityNameZh?: string;
  year: number;
  season: Poem['season'];
  occasion: PoemOccasion;
  quality: number;
  rng?: () => number;
}): Poem {
  const rng = args.rng ?? Math.random;
  const pick = <T,>(xs: T[]): T => xs[Math.floor(rng() * xs.length)] ?? xs[0];
  const head = pick(TITLE_HEAD[args.occasion]);
  const titleZh = args.cityNameZh && (args.occasion === 'scenic' || args.occasion === 'victory')
    ? `${head}${args.cityNameZh}`
    : head;
  const lines = [pick(OPEN[args.occasion]), pick(MIDDLE), pick(MIDDLE), pick(CLOSE)]
    .filter((l, i, a) => a.indexOf(l) === i);   // no repeated line in one poem
  return {
    id: `poem-${args.author.id}-${args.year}-${args.season}`,
    authorId: args.author.id,
    cityId: args.cityId,
    year: args.year,
    season: args.season,
    occasion: args.occasion,
    titleZh,
    linesZh: lines,
    quality: args.quality,
  };
}

/** What a finished poem is worth. */
export function poemEffects(quality: number): {
  cultureGain: number;
  loyaltyGain: number;
  renownGain: number;
  /** Worth writing into the annals. */
  memorable: boolean;
  tierZh: string;
  tierEn: string;
} {
  const memorable = quality >= POEM_MEMORABLE;
  return {
    cultureGain: Math.round(quality / 20),          // 0–5
    loyaltyGain: quality >= 55 ? 2 : quality >= 30 ? 1 : 0,
    renownGain: Math.round(quality / 12),           // 0–8
    memorable,
    tierZh: quality >= 88 ? '千古絕唱' : quality >= POEM_MEMORABLE ? '傳世之作' : quality >= 45 ? '清詞麗句' : '聊以自娛',
    tierEn: quality >= 88 ? 'Immortal' : quality >= POEM_MEMORABLE ? 'Enduring' : quality >= 45 ? 'Accomplished' : 'A pleasant trifle',
  };
}

// ─── 立祠 ─────────────────────────────────────────────────────────────

export interface Shrine {
  id: EntityId;
  /** The officer honoured (dead). */
  officerId: EntityId;
  cityId: EntityId;
  year: number;
  /** Renown at the time of building — fixes the shrine's standing effects. */
  renown: number;
}

/** A shrine costs by the honour paid: a great name deserves a great hall. */
export function shrineCost(renown: number): number {
  return 400 + Math.round(Math.min(80, renown) * 12);
}

/**
 * What a standing shrine does, every season, for as long as the city is yours.
 * Modest numbers deliberately: this is a slow, cheap, permanent civic good —
 * the counterweight to razing and executing your way across the map.
 */
export function shrineEffects(renown: number): {
  loyaltyPerSeason: number;
  culturePerSeason: number;
  /** Loyalty lift for living officers of the honoured man's clan. */
  clanLoyalty: number;
} {
  const great = renown >= 60;
  return {
    loyaltyPerSeason: great ? 2 : 1,
    culturePerSeason: great ? 1 : 0,
    clanLoyalty: great ? 6 : 3,
  };
}

/** 一城一祠 — a city honours one name; a second shrine there is just masonry. */
export function canBuildShrine(
  shrines: ReadonlyArray<Shrine>,
  cityId: EntityId,
  officerId: EntityId,
): { ok: boolean; reasonZh?: string; reasonEn?: string } {
  if (shrines.some((s) => s.cityId === cityId)) {
    return { ok: false, reasonZh: '此城已有祠廟,一城一祠。', reasonEn: 'This city already keeps a shrine.' };
  }
  if (shrines.some((s) => s.officerId === officerId)) {
    return { ok: false, reasonZh: '其祠已立於他城。', reasonEn: 'A shrine to this officer already stands elsewhere.' };
  }
  return { ok: true };
}
