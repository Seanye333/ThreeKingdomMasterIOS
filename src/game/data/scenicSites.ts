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
