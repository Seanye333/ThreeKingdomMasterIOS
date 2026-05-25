import type { Port } from '../types';

/**
 * Three Kingdoms-era ports modeled as RTK 14-style independent map
 * facilities. Each is at a real (lon, lat); connectedPortIds defines
 * the bidirectional sea-route graph; linkedCityId points at the home
 * city used for upkeep / AI assessment.
 *
 * Connection topology (rough):
 *   北海      渤海 — 平原 — 廣陵
 *   東海      廣陵 — 建業 — 會稽 — 永寧 — 番禺 — 合浦
 *   長江      永安 — 江陵 — 烏林 — 夏口 — 柴桑 — 蕪湖 — 建業 — 廣陵
 *   巢湖支    合肥 — 蕪湖
 *   珠江      番禺 — 合浦
 *
 * Ports declared with no force start neutral and can be captured by
 * the first player to reach them.
 */
export const PORT_TEMPLATES: Array<Omit<Port, 'ownerForceId' | 'hp'> & {
  defaultOwnerHint?: string;   // city id whose owner gets the port at scenario start
  maxHp: number;
}> = [
  // North coast (Bohai bay + Yellow River delta) — nudged into actual water
  {
    id: 'port-bohai',     name: { zh: '渤海港', en: 'Bohai Port' },
    coords: { lon: 118.6, lat: 38.5 }, maxHp: 1500,
    linkedCityId: 'bohai', defaultOwnerHint: 'bohai',
    connectedPortIds: ['port-pingyuan', 'port-guangling'],
  },
  {
    id: 'port-pingyuan',  name: { zh: '平原港', en: 'Pingyuan Port' },
    coords: { lon: 119.2, lat: 37.7 }, maxHp: 1200,
    linkedCityId: 'pingyuan', defaultOwnerHint: 'pingyuan',
    connectedPortIds: ['port-bohai', 'port-guangling'],
  },
  // East coast (Yangtze mouth → south coast)
  {
    id: 'port-guangling', name: { zh: '廣陵港', en: 'Guangling Port' },
    coords: { lon: 120.4, lat: 32.1 }, maxHp: 1800,
    linkedCityId: 'guangling', defaultOwnerHint: 'guangling',
    connectedPortIds: ['port-pingyuan', 'port-bohai', 'port-jianye', 'port-kuaiji'],
  },
  {
    id: 'port-jianye',    name: { zh: '建業港', en: 'Jianye Port' },
    coords: { lon: 118.7, lat: 32.2 }, maxHp: 2000,
    linkedCityId: 'jianye', defaultOwnerHint: 'jianye',
    connectedPortIds: ['port-guangling', 'port-wuhu', 'port-kuaiji'],
  },
  {
    id: 'port-kuaiji',    name: { zh: '會稽港', en: 'Kuaiji Port' },
    coords: { lon: 122.0, lat: 30.3 }, maxHp: 1400,
    linkedCityId: 'kuaiji', defaultOwnerHint: 'kuaiji',
    connectedPortIds: ['port-jianye', 'port-guangling', 'port-yongning'],
  },
  {
    id: 'port-yongning',  name: { zh: '永寧港', en: 'Yongning Port' },
    coords: { lon: 121.4, lat: 27.8 }, maxHp: 1000,
    linkedCityId: 'linhai',
    connectedPortIds: ['port-kuaiji', 'port-panyu'],
  },
  {
    id: 'port-panyu',     name: { zh: '番禺港', en: 'Panyu Port' },
    coords: { lon: 113.7, lat: 22.6 }, maxHp: 1300,
    linkedCityId: 'nanhai', defaultOwnerHint: 'nanhai',
    connectedPortIds: ['port-yongning', 'port-hepu'],
  },
  {
    id: 'port-hepu',      name: { zh: '合浦港', en: 'Hepu Port' },
    coords: { lon: 109.5, lat: 21.0 }, maxHp: 900,
    linkedCityId: 'hepu', defaultOwnerHint: 'hepu',
    connectedPortIds: ['port-panyu'],
  },
  // Yangtze (west → east) — each shifted south to the river channel
  {
    id: 'port-yongan',    name: { zh: '永安港', en: 'Yongan Port' },
    coords: { lon: 109.7, lat: 30.85 }, maxHp: 1000,
    linkedCityId: 'yongan', defaultOwnerHint: 'yongan',
    connectedPortIds: ['port-jiangling'],
  },
  {
    id: 'port-jiangling', name: { zh: '江陵港', en: 'Jiangling Port' },
    coords: { lon: 112.3, lat: 30.1 }, maxHp: 1700,
    linkedCityId: 'jiangling', defaultOwnerHint: 'jiangling',
    connectedPortIds: ['port-yongan', 'port-wulin'],
  },
  {
    id: 'port-wulin',     name: { zh: '烏林港', en: 'Wulin Port' },
    coords: { lon: 113.5, lat: 29.85 }, maxHp: 800,
    linkedCityId: 'jiangling',
    connectedPortIds: ['port-jiangling', 'port-xiakou'],
  },
  {
    id: 'port-xiakou',    name: { zh: '夏口港', en: 'Xiakou Port' },
    coords: { lon: 114.5, lat: 30.4 }, maxHp: 1500,
    linkedCityId: 'jiangxia', defaultOwnerHint: 'jiangxia',
    connectedPortIds: ['port-wulin', 'port-chaisang'],
  },
  {
    id: 'port-chaisang',  name: { zh: '柴桑港', en: 'Chaisang Port' },
    coords: { lon: 116.1, lat: 29.55 }, maxHp: 1300,
    linkedCityId: 'chaisang', defaultOwnerHint: 'chaisang',
    connectedPortIds: ['port-xiakou', 'port-wuhu'],
  },
  {
    id: 'port-wuhu',      name: { zh: '蕪湖港', en: 'Wuhu Port' },
    coords: { lon: 118.5, lat: 31.15 }, maxHp: 1100,
    linkedCityId: 'danyang',
    connectedPortIds: ['port-chaisang', 'port-jianye', 'port-hefei'],
  },
  // Chao Lake spur
  {
    id: 'port-hefei',     name: { zh: '合肥港', en: 'Hefei Port' },
    coords: { lon: 117.4, lat: 31.5 }, maxHp: 1200,
    linkedCityId: 'hefei', defaultOwnerHint: 'hefei',
    connectedPortIds: ['port-wuhu'],
  },
];

/** Convenience: build initial Port records from templates, owner derived
 *  from the linked city's controlling force at scenario start (or null). */
export function buildInitialPorts(
  cityOwnerByCityId: Record<string, string | null>,
): Record<string, Port> {
  const out: Record<string, Port> = {};
  for (const t of PORT_TEMPLATES) {
    const ownerCityId = t.defaultOwnerHint ?? t.linkedCityId;
    out[t.id] = {
      id: t.id,
      name: t.name,
      coords: t.coords,
      ownerForceId: cityOwnerByCityId[ownerCityId] ?? null,
      hp: t.maxHp,
      maxHp: t.maxHp,
      connectedPortIds: t.connectedPortIds,
      linkedCityId: t.linkedCityId,
    };
  }
  return out;
}

export const PORT_IDS = PORT_TEMPLATES.map((t) => t.id);

/**
 * Migrate / rebuild ports from templates, preserving only the dynamic
 * fields (ownerForceId, hp) from a saved snapshot. Design-data fields
 * (coords, maxHp, connections, linked city) always come from the current
 * PORT_TEMPLATES — so tweaking the template propagates to all old saves.
 *
 *  - If savedPorts has the port → keep its owner + hp (clamped to new maxHp)
 *  - If not (legacy save, or new port added later) → fall back to defaults
 *    derived from current city ownership
 */
/**
 * Whether a player force can REACH a port for attack. RTK 14-style:
 *   - LAND: player owns a city adjacent to the port's linked city, OR
 *           owns the linked city itself (own city, contested port).
 *   - SEA:  player owns any port that is sea-connected to the target.
 */
export function canPlayerAttackPort(
  port: Port,
  cities: Record<string, import('../types').City>,
  ports: Record<string, Port>,
  playerForceId: string,
): { ok: boolean; via?: 'land' | 'sea'; reason?: string } {
  // Sea — any owned port directly connected to the target
  for (const p of Object.values(ports)) {
    if (p.ownerForceId === playerForceId
        && p.connectedPortIds.includes(port.id)) {
      return { ok: true, via: 'sea' };
    }
  }
  // Land — adjacent (or same) to the linked city
  const linked = cities[port.linkedCityId];
  if (linked) {
    if (linked.ownerForceId === playerForceId) {
      return { ok: true, via: 'land' };
    }
    for (const adjId of linked.adjacentCityIds ?? []) {
      const adj = cities[adjId];
      if (adj && adj.ownerForceId === playerForceId) {
        return { ok: true, via: 'land' };
      }
    }
  }
  return {
    ok: false,
    reason: `No reachable approach. Hold a city adjacent to ${linked?.name.zh ?? port.linkedCityId}, or own a sea-connected port.`,
  };
}

/**
 * Cities reachable by sea from the given source city (RTK 14-style naval
 * routing). A march is valid if either:
 *   - the target is in city.adjacentCityIds (land path), OR
 *   - source has a linked port AND target has a linked port AND those
 *     ports are connected via the port-graph BFS.
 *
 * Returns the set of CITY ids reachable by sea (NOT including source).
 */
export function navalReachableCityIds(
  sourceCityId: string,
  ports: Record<string, Port>,
): Set<string> {
  const sourcePortIds = Object.values(ports)
    .filter((p) => p.linkedCityId === sourceCityId)
    .map((p) => p.id);
  if (sourcePortIds.length === 0) return new Set();

  // BFS through the port sea-route graph
  const visited = new Set<string>(sourcePortIds);
  const queue = [...sourcePortIds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const p = ports[id];
    if (!p) continue;
    for (const c of p.connectedPortIds) {
      if (!visited.has(c)) {
        visited.add(c);
        queue.push(c);
      }
    }
  }
  // Collect linked cities of every visited port, excluding source
  const cityIds = new Set<string>();
  for (const id of visited) {
    const p = ports[id];
    if (p && p.linkedCityId !== sourceCityId) cityIds.add(p.linkedCityId);
  }
  return cityIds;
}

export function migratePorts(
  savedPorts: Record<string, Port> | undefined,
  cityOwnerByCityId: Record<string, string | null>,
): Record<string, Port> {
  const out: Record<string, Port> = {};
  for (const t of PORT_TEMPLATES) {
    const saved = savedPorts?.[t.id];
    const fallbackOwner =
      cityOwnerByCityId[t.defaultOwnerHint ?? t.linkedCityId] ?? null;
    out[t.id] = {
      id: t.id,
      name: t.name,
      coords: t.coords,
      connectedPortIds: t.connectedPortIds,
      linkedCityId: t.linkedCityId,
      maxHp: t.maxHp,
      // Dynamic — preserve from save if present, else default
      ownerForceId: saved?.ownerForceId ?? fallbackOwner,
      hp: saved?.hp != null ? Math.min(saved.hp, t.maxHp) : t.maxHp,
    };
  }
  return out;
}
