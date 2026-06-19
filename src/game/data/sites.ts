import type { WildSite, SiteSubtype, City, EntityId } from '../types';

/**
 * 野外據點 templates — bandit nests, river fords and wilderness resource
 * deposits, each at a real (lon, lat). See types/site.ts for the model.
 *
 * Bandit nests start NEUTRAL + hostile (they raid). Fords and deposits start
 * NEUTRAL + unclaimed (a force seizes them to gain control / income).
 */
interface SiteTemplate {
  id: string;
  name: { zh: string; en: string };
  subtype: SiteSubtype;
  coords: { lon: number; lat: number };
  variant?: string;
  strength: number;
  guards: EntityId[];
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  // ─────────── 山賊山寨 (bandit nests) ───────────
  {
    id: 'bandit-taishan', name: { zh: '泰山賊', en: 'Mt. Tai Bandits' },
    subtype: 'bandit', coords: { lon: 117.1, lat: 36.2 }, strength: 5000,
    guards: ['linzi', 'langya', 'beihai'],   // 臧霸、孫觀之徒
  },
  {
    id: 'bandit-heishan', name: { zh: '黑山賊', en: 'Heishan Bandits' },
    subtype: 'bandit', coords: { lon: 113.7, lat: 36.0 }, strength: 6000,
    guards: ['ye', 'shangdang', 'hukou'],     // 張燕,太行山
  },
  {
    id: 'bandit-baibo', name: { zh: '白波賊', en: 'Baibo Bandits' },
    subtype: 'bandit', coords: { lon: 111.5, lat: 35.8 }, strength: 4000,
    guards: ['taiyuan', 'hanguguan'],          // 河東白波谷
  },
  {
    id: 'bandit-bagun', name: { zh: '巴郡板楯', en: 'Ba Hill Bandits' },
    subtype: 'bandit', coords: { lon: 107.0, lat: 30.4 }, strength: 3500,
    guards: ['jiangzhou', 'baxi'],             // 板楯蠻/賨人
  },
  {
    id: 'bandit-changsha', name: { zh: '長沙宗賊', en: 'Changsha Clansmen' },
    subtype: 'bandit', coords: { lon: 113.3, lat: 27.6 }, strength: 3500,
    guards: ['changsha', 'luling'],            // 荊南宗部
  },
  {
    id: 'bandit-donglai', name: { zh: '東萊海賊', en: 'Donglai Pirates' },
    subtype: 'bandit', coords: { lon: 120.6, lat: 37.2 }, strength: 3000,
    guards: ['beihai', 'linzi'],               // 管承,沿海
  },

  // ─────────── 渡口 / 關津 (river fords) ───────────
  {
    id: 'ford-mengjin', name: { zh: '孟津', en: 'Mengjin Ford' },
    subtype: 'ford', coords: { lon: 112.5, lat: 34.9 }, strength: 1500,
    guards: ['luoyang', 'hanguguan'],          // 洛陽北,黃河津
  },
  {
    id: 'ford-baima', name: { zh: '白馬津', en: 'Baima Ford' },
    subtype: 'ford', coords: { lon: 114.7, lat: 35.45 }, strength: 1500,
    guards: ['baima', 'liyang'],               // 官渡前線
  },
  {
    id: 'ford-yanjin', name: { zh: '延津', en: 'Yanjin Ford' },
    subtype: 'ford', coords: { lon: 114.1, lat: 35.42 }, strength: 1500,
    guards: ['yanjin', 'guandu'],
  },
  {
    id: 'ford-pujin', name: { zh: '蒲津', en: 'Pujin Ford' },
    subtype: 'ford', coords: { lon: 110.3, lat: 34.85 }, strength: 1500,
    guards: ['tongguan', 'changan'],           // 風陵渡,關中門戶
  },
  {
    id: 'ford-hengjiang', name: { zh: '橫江津', en: 'Hengjiang Crossing' },
    subtype: 'ford', coords: { lon: 118.3, lat: 31.7 }, strength: 1800,
    guards: ['jianye', 'hefei'],               // 長江津,孫吳北門
  },
  {
    id: 'ford-xiakou', name: { zh: '夏口', en: 'Xiakou Crossing' },
    subtype: 'ford', coords: { lon: 114.3, lat: 30.55 }, strength: 1800,
    guards: ['jiangxia', 'wuchang'],           // 漢水入江口
  },

  // ─────────── 礦場 / 鹽鐵 (resource deposits) ───────────
  {
    id: 'res-xiechi', name: { zh: '解池鹽澤', en: 'Xiechi Salt Lake' },
    subtype: 'resource', variant: 'salt', coords: { lon: 110.9, lat: 35.0 }, strength: 1200,
    guards: ['tongguan', 'hanguguan'],         // 河東鹽池,歷代鹽利
  },
  {
    id: 'res-taihang-iron', name: { zh: '太行鐵山', en: 'Taihang Ironworks' },
    subtype: 'resource', variant: 'iron', coords: { lon: 113.4, lat: 36.4 }, strength: 1500,
    guards: ['shangdang', 'ye'],
  },
  {
    id: 'res-nanzhong-gold', name: { zh: '南中金沙', en: 'Nanzhong Gold' },
    subtype: 'resource', variant: 'gold', coords: { lon: 101.8, lat: 24.6 }, strength: 1200,
    guards: ['jianning', 'yunnan'],            // 益州南金礦
  },
  {
    id: 'res-danyang-copper', name: { zh: '丹陽銅山', en: 'Danyang Copper' },
    subtype: 'resource', variant: 'copper', coords: { lon: 118.6, lat: 31.0 }, strength: 1500,
    guards: ['danyang', 'jianye'],             // 鑄錢之源
  },
  {
    id: 'res-hexi-horse', name: { zh: '河西馬場', en: 'Hexi Horse Pasture' },
    subtype: 'resource', variant: 'horse', coords: { lon: 101.5, lat: 38.2 }, strength: 1800,
    guards: ['wuwei', 'zhangye'],              // 涼州牧苑
  },
  {
    id: 'res-shu-saltwell', name: { zh: '蜀中鹽井', en: 'Shu Salt Wells' },
    subtype: 'resource', variant: 'salt', coords: { lon: 104.4, lat: 29.6 }, strength: 1200,
    guards: ['qianwei', 'jiangzhou'],          // 井鹽
  },
];

/** Per-season effect of holding a resource deposit. Salt/iron/gold/copper pay
 *  gold into the holder's nearest owned guard city; a horse pasture sends a
 *  trickle of remounts (troops) instead. */
export const RESOURCE_SITE_DEFS: Record<string, { zh: string; goldPerSeason: number; troopsPerSeason: number }> = {
  salt:   { zh: '鹽',   goldPerSeason: 120, troopsPerSeason: 0 },
  iron:   { zh: '鐵',   goldPerSeason: 90,  troopsPerSeason: 0 },
  gold:   { zh: '金',   goldPerSeason: 160, troopsPerSeason: 0 },
  copper: { zh: '銅',   goldPerSeason: 90,  troopsPerSeason: 0 },
  horse:  { zh: '馬',   goldPerSeason: 40,  troopsPerSeason: 300 },
};

function mk(t: SiteTemplate): WildSite {
  return {
    id: t.id,
    name: t.name,
    subtype: t.subtype,
    coords: t.coords,
    variant: t.variant ?? '',
    ownerForceId: null,
    hp: t.strength,
    maxHp: t.strength,
    strength: t.strength,
    guards: t.guards,
    hostile: t.subtype === 'bandit',
  };
}

export function buildInitialSites(): Record<string, WildSite> {
  const out: Record<string, WildSite> = {};
  for (const t of SITE_TEMPLATES) out[t.id] = mk(t);
  return out;
}

/** Refresh design data while preserving runtime state (owner/hp/hostile). */
export function migrateSites(
  saved: Record<string, WildSite> | undefined,
): Record<string, WildSite> {
  const out: Record<string, WildSite> = {};
  for (const t of SITE_TEMPLATES) {
    const base = mk(t);
    const s = saved?.[t.id];
    out[t.id] = s
      ? { ...base, ownerForceId: s.ownerForceId ?? null, hp: Math.min(s.hp ?? base.hp, base.maxHp), hostile: s.hostile ?? base.hostile }
      : base;
  }
  // keep any unknown saved sites (forward-compat)
  if (saved) for (const [id, s] of Object.entries(saved)) if (!out[id]) out[id] = s;
  return out;
}

export const SITE_IDS = SITE_TEMPLATES.map((t) => t.id);

const SUBTYPE_VERB: Record<SiteSubtype, string> = {
  bandit: '剿', ford: '取', resource: '佔',
};

/** Whether the player may attack/seize a site — needs to own or border one
 *  of its guard cities. */
export function canPlayerSeizeSite(
  site: WildSite,
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

export function siteActionVerb(subtype: SiteSubtype): string {
  return SUBTYPE_VERB[subtype];
}
