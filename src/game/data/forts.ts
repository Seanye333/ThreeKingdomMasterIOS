import type { Fort } from '../types';
import { fortMaxHpForLevel } from '../types';

/**
 * Historical Three Kingdoms-era 砦 (forts) — strategic strongpoints
 * smaller than 關 but significant in famous campaigns. Each is at a
 * real (lon, lat) and guards specific city corridors.
 *
 * Stockades (塢/壘) are not predefined — they're player-built at runtime
 * via the buildStockade action.
 */
export const FORT_TEMPLATES: Array<Omit<Fort, 'ownerForceId' | 'hp' | 'seasonsRemaining'> & {
  defaultOwnerHint?: string;   // city id whose owner gets the fort at start
  maxHp: number;
}> = [
  {
    id: 'fort-jieting',  name: { zh: '街亭', en: 'Jieting' },
    subtype: 'fort',
    coords: { lon: 105.97, lat: 34.86 },   // modern Qin'an / Tianshui pass
    guards: ['tianshui', 'hanzhong'],
    maxHp: 600,
    defaultOwnerHint: 'tianshui',
  },
  {
    id: 'fort-dingjun',  name: { zh: '定軍山', en: 'Dingjun Mountain' },
    subtype: 'fort',
    coords: { lon: 106.92, lat: 33.10 },   // south of Hanzhong
    guards: ['hanzhong', 'chengdu'],
    maxHp: 800,
    defaultOwnerHint: 'hanzhong',
  },
  {
    id: 'fort-wuzhang',  name: { zh: '五丈原', en: 'Wuzhang Plains' },
    subtype: 'fort',
    coords: { lon: 107.78, lat: 34.30 },   // north of Mei, north of Qinling
    guards: ['mei', 'chencang'],
    maxHp: 700,
    defaultOwnerHint: 'chencang',
  },
  {
    id: 'fort-xiegu',    name: { zh: '斜谷', en: 'Xie Valley' },
    subtype: 'fort',
    coords: { lon: 107.20, lat: 33.55 },   // pass north of Hanzhong
    guards: ['hanzhong', 'chencang'],
    maxHp: 500,
    defaultOwnerHint: 'hanzhong',
  },
  {
    id: 'fort-mianzhu',  name: { zh: '綿竹', en: 'Mianzhu' },
    subtype: 'fort',
    coords: { lon: 104.21, lat: 31.34 },   // Shu's last defense before Chengdu
    guards: ['chengdu', 'baxi'],
    maxHp: 700,
    defaultOwnerHint: 'chengdu',
  },
  {
    id: 'fort-baidicheng', name: { zh: '白帝城', en: 'Baidi Castle' },
    subtype: 'fort',
    coords: { lon: 109.55, lat: 31.04 },   // Yangtze gorges, by Yongan
    guards: ['yongan', 'jiangling'],
    maxHp: 900,
    defaultOwnerHint: 'yongan',
  },
  {
    id: 'fort-runan',    name: { zh: '汝南壘', en: 'Runan Stockade' },
    subtype: 'fort',
    coords: { lon: 114.42, lat: 33.20 },   // between Xuchang and Shouchun
    guards: ['runan', 'xuchang'],
    maxHp: 500,
  },
  {
    id: 'fort-bowang',   name: { zh: '博望坡', en: 'Bowang Slope' },
    subtype: 'fort',
    coords: { lon: 112.74, lat: 33.18 },   // famous ambush site north of Xinye
    guards: ['xinye', 'wancheng'],
    maxHp: 400,
    defaultOwnerHint: 'wancheng',
  },
  {
    id: 'fort-luokou',   name: { zh: '濡須塢', en: 'Ruxu Stockade' },
    subtype: 'fort',
    coords: { lon: 117.65, lat: 31.65 },   // Wu's frontier against Wei in Huainan
    guards: ['hefei', 'jianye'],
    maxHp: 800,
    defaultOwnerHint: 'jianye',
  },
  {
    id: 'fort-changshan',name: { zh: '長山壘', en: 'Changshan Stockade' },
    subtype: 'fort',
    coords: { lon: 114.50, lat: 38.05 },   // Hebei, Yuan family heartland
    guards: ['ye', 'nanpi'],
    maxHp: 600,
    defaultOwnerHint: 'ye',
  },
];

export function buildInitialForts(
  cityOwnerByCityId: Record<string, string | null>,
): Record<string, Fort> {
  const out: Record<string, Fort> = {};
  for (const t of FORT_TEMPLATES) {
    const ownerCity = t.defaultOwnerHint ?? t.guards[0];
    out[t.id] = {
      id: t.id,
      name: t.name,
      subtype: t.subtype,
      coords: t.coords,
      guards: t.guards,
      maxHp: t.maxHp,
      hp: t.maxHp,
      ownerForceId: cityOwnerByCityId[ownerCity] ?? null,
    };
  }
  return out;
}

/** Same migration pattern as ports — refresh design data, preserve hp/owner/level. */
export function migrateForts(
  savedForts: Record<string, Fort> | undefined,
  cityOwnerByCityId: Record<string, string | null>,
): Record<string, Fort> {
  const out: Record<string, Fort> = {};
  for (const t of FORT_TEMPLATES) {
    const saved = savedForts?.[t.id];
    const level = saved?.level ?? 1;
    const effMaxHp = fortMaxHpForLevel(t.maxHp, level);
    out[t.id] = {
      id: t.id,
      name: t.name,
      subtype: t.subtype,
      coords: t.coords,
      guards: t.guards,
      maxHp: effMaxHp,
      hp: saved?.hp != null ? Math.min(saved.hp, effMaxHp) : effMaxHp,
      ownerForceId: saved?.ownerForceId
        ?? cityOwnerByCityId[t.defaultOwnerHint ?? t.guards[0]] ?? null,
      level,
    };
  }
  if (savedForts) {
    for (const [id, f] of Object.entries(savedForts)) {
      if (out[id]) continue;
      out[id] = { ...f, level: f.level ?? 1 };
    }
  }
  return out;
}

export const FORT_IDS = FORT_TEMPLATES.map((t) => t.id);

/** Whether the player can attack the fort — needs an owned city adjacent
 *  to one of fort.guards (or the guard city itself). */
export function canPlayerAttackFort(
  fort: Fort,
  cities: Record<string, import('../types').City>,
  playerForceId: string,
): { ok: boolean; reason?: string } {
  for (const guardId of fort.guards) {
    const guard = cities[guardId];
    if (!guard) continue;
    if (guard.ownerForceId === playerForceId) return { ok: true };
    for (const adjId of guard.adjacentCityIds ?? []) {
      const adj = cities[adjId];
      if (adj && adj.ownerForceId === playerForceId) return { ok: true };
    }
  }
  return {
    ok: false,
    reason: `Need to own or border one of: ${fort.guards.map((g) => cities[g]?.name.zh ?? g).join(', ')}.`,
  };
}
