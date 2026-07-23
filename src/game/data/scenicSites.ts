import type { City } from '../types';

/**
 * 名所 — legendary/scenic spots that aren't strongpoints but reward a visit:
 * a worthy recluse may be persuaded to come out of retirement (訪賢), and a
 * treasure or classic text often turns up (尋寶). Each loots ONCE; the hermit
 * can be courted until recruited (or until someone else takes him).
 */
export interface ScenicSite {
  id: string;
  name: { zh: string; en: string };
  coords: { lon: number; lat: number };
  /** A reclusive worthy who may be recruited here while still a free agent. */
  hermitId?: string;
  /** A treasure / classic found here (added to the visiting city's lost-item
   *  pool, once). */
  itemId?: string;
  /** One-time gold reward to the visiting city. */
  gold: number;
  descZh: string;
  /** Nearby cities — must own or border one to send an envoy. */
  guards: string[];
}

export const SCENIC_SITES: ScenicSite[] = [
  {
    id: 'longzhong', name: { zh: '隆中臥龍崗', en: 'Longzhong' },
    coords: { lon: 112.0, lat: 31.95 }, hermitId: 'zhuge-liang', itemId: 'bagua-robe', gold: 300,
    descZh: '臥龍隱居之所。三顧而後出,天下可圖。', guards: ['xiangyang', 'fancheng'],
  },
  {
    id: 'shuijingzhuang', name: { zh: '水鏡莊', en: "Shuijing's Retreat" },
    coords: { lon: 112.35, lat: 31.85 }, hermitId: 'sima-hui', itemId: 'yi-jing', gold: 250,
    descZh: '水鏡先生司馬徽隱居處,識鑒天下英才。', guards: ['xiangyang'],
  },
  {
    id: 'lumenshan', name: { zh: '鹿門山', en: 'Mt. Lumen' },
    coords: { lon: 112.45, lat: 31.78 }, hermitId: 'pang-tong', gold: 200,
    descZh: '鳳雛龐統棲隱之山,與臥龍齊名。', guards: ['xiangyang'],
  },
  {
    id: 'yingchuan', name: { zh: '潁川書塾', en: 'Yingchuan Academy' },
    coords: { lon: 113.5, lat: 34.1 }, hermitId: 'xu-shu', itemId: 'sunzi-bingfa', gold: 250,
    descZh: '潁川多奇士,徐庶元直曾遊學於此。', guards: ['xuchang', 'guandu'],
  },
  {
    id: 'taoyuan', name: { zh: '桃園', en: 'Peach Garden' },
    coords: { lon: 115.97, lat: 39.45 }, itemId: 'twin-swords', gold: 400,
    descZh: '昔有三人結義於桃園之中,誓同生死。', guards: ['ji', 'beiping', 'zhuyai'],
  },
  {
    id: 'zhongnan', name: { zh: '終南山', en: 'Mt. Zhongnan' },
    coords: { lon: 108.9, lat: 33.95 }, itemId: 'taichi-diagram', gold: 250,
    descZh: '關中隱者所棲之名山,道書玄典每出於此。', guards: ['changan', 'chencang'],
  },

  // ─── 名所擴充(2026-07):訪賢隱士居 + 尋寶古蹟 ───
  {
    id: 'boling', name: { zh: '博陵崔氏', en: 'Cui of Boling' },
    coords: { lon: 115.5, lat: 38.5 }, hermitId: 'cui-zhouping', gold: 220,
    descZh: '博陵崔州平,臥龍之友,常與孔明論天下大勢,笑談興亡。', guards: ['ye', 'pingyuan'],
  },
  {
    id: 'baishui', name: { zh: '沔南白水', en: 'Baishui Retreat' },
    coords: { lon: 112.1, lat: 31.8 }, hermitId: 'huang-chengyan', gold: 240,
    descZh: '黃承彥居沔南白水,好造機巧,八陣石兵、木牛遺法,多出其手。', guards: ['xiangyang'],
  },
  {
    id: 'xianshan', name: { zh: '峴山龐公', en: 'Pang the Elder of Mt. Xian' },
    coords: { lon: 112.15, lat: 32.0 }, hermitId: 'pang-degong', gold: 220,
    descZh: '龐德公躬耕峴山之南,終身不入城府,臥龍、鳳雛之名,皆其所品。', guards: ['xiangyang'],
  },
  {
    id: 'gaomi', name: { zh: '高密鄭玄', en: 'Zheng Xuan of Gaomi' },
    coords: { lon: 119.75, lat: 36.4 }, hermitId: 'zheng-xuan', gold: 260,
    descZh: '經學大師鄭玄講學高密,弟子逾千,遍注群經,一代儒宗。', guards: ['beihai', 'linzi'],
  },
  {
    id: 'pingyuan-guanlu', name: { zh: '平原管輅', en: 'Guan Lu of Pingyuan' },
    coords: { lon: 116.4, lat: 37.4 }, hermitId: 'guan-lu', gold: 220,
    descZh: '神卜管輅隱於平原,占筮風角,言人生死,無不奇中。', guards: ['pingyuan'],
  },
  {
    id: 'tianzhushan', name: { zh: '天柱山', en: 'Mt. Tianzhu' },
    coords: { lon: 116.45, lat: 30.7 }, hermitId: 'zuo-ci', gold: 240,
    descZh: '左慈學道天柱山,得遁甲天書,能役鬼神、擲杯戲曹,方士之尤。', guards: ['lujiang'],
  },
  {
    id: 'quwa', name: { zh: '曲阿精舍', en: "Yu Ji's Retreat at Qu'e" },
    coords: { lon: 119.5, lat: 31.9 }, hermitId: 'yu-ji', gold: 220,
    descZh: '于吉立精舍於曲阿,燒香讀道書,製符水以治病,吳會之民多事之如神。', guards: ['wu', 'jianye'],
  },
  {
    id: 'xuwushan', name: { zh: '徐無山', en: 'Mt. Xuwu' },
    coords: { lon: 117.9, lat: 40.0 }, hermitId: 'tian-chou', gold: 240,
    descZh: '田疇率宗族入徐無山,躬耕自守,道不拾遺,袁曹皆慕其高名。', guards: ['beiping', 'yuyang'],
  },
  {
    id: 'qiao-huatuo', name: { zh: '譙郡華佗', en: 'Hua Tuo of Qiao' },
    coords: { lon: 115.8, lat: 33.9 }, hermitId: 'hua-tuo', gold: 260,
    descZh: '神醫華佗遊於江淮,精方藥針灸,首創麻沸散,能刳腹湔腸,五禽戲以養生。', guards: ['chenliu', 'xuchang'],
  },
  {
    id: 'taishan', name: { zh: '泰山封禪壇', en: 'Mt. Tai Altar' },
    coords: { lon: 117.1, lat: 36.25 }, itemId: 'taigong-bingfa', gold: 350,
    descZh: '泰山之巔,歷代帝王封禪告天之所,松柏參天,或藏兵韜秘典於雲霧之間。', guards: ['linzi', 'beihai'],
  },
  {
    id: 'miluo', name: { zh: '汨羅屈子祠', en: 'Qu Yuan Shrine, Miluo' },
    coords: { lon: 113.0, lat: 28.8 }, itemId: 'li-sao', gold: 300,
    descZh: '汨羅江畔,三閭大夫屈原懷沙自沉之處,離騷遺韻,千載猶存。', guards: ['changsha', 'jiangling'],
  },
  {
    id: 'yuxue', name: { zh: '會稽禹穴', en: "Yu's Cave, Kuaiji" },
    coords: { lon: 120.6, lat: 29.9 }, itemId: 'spring-autumn', gold: 300,
    descZh: '會稽山禹穴,相傳大禹葬處,藏有古書金簡,越地靈秀所鍾。', guards: ['kuaiji'],
  },
  {
    id: 'panxi', name: { zh: '磻溪釣台', en: "Taigong's Fishing Terrace" },
    coords: { lon: 107.2, lat: 34.5 }, itemId: 'liu-tao', gold: 320,
    descZh: '磻溪之畔,太公望垂釣遇文王之處,六韜兵謀,發於漁隱之間。', guards: ['chencang', 'changan'],
  },
];

export const SCENIC_BY_ID: Record<string, ScenicSite> = Object.fromEntries(
  SCENIC_SITES.map((s) => [s.id, s]),
);

/** Whether the player may send an envoy — must own or border a guard city. */
export function canVisitScenic(
  site: ScenicSite,
  cities: Record<string, City>,
  playerForceId: string,
): { ok: boolean; reason?: string } {
  for (const gid of site.guards) {
    const g = cities[gid];
    if (!g) continue;
    if (g.ownerForceId === playerForceId) return { ok: true };
    for (const adjId of g.adjacentCityIds ?? []) {
      if (cities[adjId]?.ownerForceId === playerForceId) return { ok: true };
    }
  }
  return {
    ok: false,
    reason: `Need to own or border one of: ${site.guards.map((g) => cities[g]?.name.zh ?? g).join(', ')}.`,
  };
}

/**
 * 訪賢 success roll — pure, so it's testable. A persuasive envoy backed by a
 * charismatic ruler coaxes the recluse out; high-INT hermits (孔明) hold out
 * harder. Returns whether the worthy agrees to serve.
 */
export function rollHermitRecruit(args: {
  envoyCharisma: number;
  rulerCharisma: number;
  hermitIntelligence: number;
  /** 三顧 — how many times you've now called (1-based); sincerity tells. */
  visit?: number;
  rng: () => number;
}): boolean {
  const { envoyCharisma, rulerCharisma, hermitIntelligence, rng } = args;
  // Base on the better of envoy/ruler charm; the loftier the recluse, the
  // steeper the climb.
  const persuasion = Math.max(envoyCharisma, rulerCharisma * 0.9);
  // 三顧之誠 — the lofty recluse tests sincerity: a first call seldom finds him
  // in (一訪不遇), the second leaves a card, but by the third repeated devotion
  // nearly always draws him out (三顧茅廬).
  const visit = Math.max(1, args.visit ?? 1);
  const visitBonus = visit >= 3 ? 0.45 : visit === 2 ? 0.12 : -0.15;
  const cap = visit >= 3 ? 0.97 : 0.9;
  const chance = Math.max(0.05, Math.min(cap, (persuasion - hermitIntelligence * 0.5) / 70 + 0.35 + visitBonus));
  return rng() < chance;
}
