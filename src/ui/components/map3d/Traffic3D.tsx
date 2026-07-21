/* 道路與行旅 — split out of StrategicMap3D.tsx (2026-07).
   Curved roads, supply convoys, envoy riders, the city defense ring,
   the battle-ignition card, and the per-city overlay chip helper. */
import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../game/state/store';
import type { City, Season } from '../../../game/types';
import { grainPrice } from '../../../game/systems/grainTrade';
import { hoardEffects } from '../../../game/systems/hoarding';
import { positionAlongRoute, terrainRoute } from '../../../game/data/territories';
import { geoToPixel, MAP_W as PX_W, MAP_H as PX_H } from '../../../game/data/geography';
import { cityPixel } from '../../../game/data/cityGeo';
import { citySpecialty, specialtyClass } from '../../../game/data/specialties';
import { PROVINCE_BY_CITY } from '../../../game/data';
import { getEmbassyTarget } from '../../../game/systems/foreignRealm';
import { playSfx } from '../../../game/systems/sound';
import { useLanguage, pickName } from '../../i18n';
import { pxToWorld, sampleTerrainHeight, ARMY_TOKEN_SCALE, type OverlayMode } from './shared';

const PROVINCE_COLOR: Record<string, string> = {
  sili: '#d4a84a', yu: '#c19a3b', ji: '#3a5a8a', qing: '#5a8a8a',
  yan: '#8a5a3a', xu: '#6a8a3a', yang: '#2a7a4a', jing: '#7a4a8a',
  liang: '#b8442e', bing: '#5a4a8a', you: '#3a5a3a', yi: '#3a7d4a',
  jiao: '#5a8a4a',
};

/** Deterministic 0..1 hash from a string (same as 2D map's road curve seed). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Furthest zoom-out — the distance that frames the WHOLE map (its ground-plane
// bounding circle, half-diagonal ≈128) inside the 45° vertical FOV, plus ~15%
// margin. Big enough to see the full map on desktop, yet far tighter than the
// old 200·WORLD_SCALE (~1000 ≈ 5× the map) that shrank the land to a speck in a
// sea of empty water/sky. (MAP_W*1.25≈260 framed nothing — too close.)

// Below this camera height the full road network paints; above it (the strategic
// overview, where the default camera sits at ~MAP_D·0.9) only trunk roads show,
// dimmed, so the web stops blanketing the map. Lower than the label LOD.
const ROAD_DETAIL_Y = 120;
/* ─── Curved roads between adjacent cities (drape on terrain) ──── */
export function Roads({ cities }: { cities: Record<string, City> }) {
  // De-dupe edges via canonical key
  const edges = useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ from: City; to: City; seed: string }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const other = cities[adj];
        if (!other) continue;
        const a = c.id < other.id ? c.id : other.id;
        const b = c.id < other.id ? other.id : c.id;
        const key = `${a}|${b}`;
        if (set.has(key)) continue;
        set.add(key);
        // Seed uses the source city's id + adj id (matches 2D map's curve direction)
        list.push({ from: c, to: other, seed: c.id + adj });
      }
    }
    return list;
  }, [cities]);

  const linePts = useMemo(() => {
    const out: Array<{ pts: THREE.Vector3[]; imp: number }> = [];
    for (const { from, to, seed } of edges) {
      // Trunk roads between great cities run wider than back-country tracks.
      const imp = Math.max(0, Math.min(1, (from.population + to.population) / 320000));
      const [fpx, fpy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tpx, tpy] = cityPixel(to.id, to.coords.x, to.coords.y);
      const [fx, fz] = pxToWorld(fpx, fpy);
      const [tx, tz] = pxToWorld(tpx, tpy);
      const dx = tx - fx;
      const dz = tz - fz;
      const len = Math.hypot(dx, dz);
      // Skip degenerate zero-length edges (city to itself or coincident coords)
      // — division-by-zero here would produce NaN Vector3s and a console warning.
      if (len < 1e-6) continue;
      // Perpendicular direction
      const px = -dz / len;
      const pz = dx / len;
      // Deterministic curve magnitude (10–25% of length, signed by hash)
      const h = hashStr(seed);
      const sign = h < 0.5 ? -1 : 1;
      const amt = (0.10 + (h * 0.15)) * len * sign;
      const mx = (fx + tx) / 2 + px * amt;
      const mz = (fz + tz) / 2 + pz * amt;
      // Sample 18 points along quadratic Bezier, planted on terrain + small lift
      const SEG = 18;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const it = 1 - t;
        const x = it * it * fx + 2 * it * t * mx + t * t * tx;
        const z = it * it * fz + 2 * it * t * mz + t * t * tz;
        const y = sampleTerrainHeight(x, z) + 0.035;
        pts.push(new THREE.Vector3(x, y, z));
      }
      out.push({ pts, imp });
    }
    return out;
  }, [edges, cities]);

  // Two-pass worn path: a wider dark bed + a lighter trodden centre, so roads
  // read as packed-earth highways instead of GPU-hairlines. Trunk roads thicken.
  // 縮放分級 — at the strategic overview the full road web blankets the map and
  // drowns the cities/rivers/borders, so back-country tracks drop out and the
  // trunk roads dim; zoom into a region (camera drops below ROAD_DETAIL_Y) and
  // the whole network paints at full strength. Own threshold (lower than the
  // label LOD) with hysteresis so it flips once, around the default overview.
  const { camera } = useThree();
  const [far, setFar] = useState(true);
  useFrame(() => {
    const y = camera.position.y;
    setFar((cur) => (cur ? y >= ROAD_DETAIL_Y - 10 : y > ROAD_DETAIL_Y + 10));
  });
  return (
    <group>
      {linePts.map(({ pts, imp }, i) => {
        if (far && imp < 0.4) return null;          // hide minor tracks at distance
        const bedOp = far ? 0.26 : 0.55;
        const topOp = far ? 0.4 : 0.82;
        return (
          <group key={i}>
            <Line points={pts} color="#6b4a28" lineWidth={3.6 + imp * 3.2} transparent opacity={bedOp} />
            <Line points={pts} color="#cda268" lineWidth={1.7 + imp * 1.6} transparent opacity={topOp} />
          </group>
        );
      })}
    </group>
  );
}

/** 輜重車隊 — supply convoys crawling the roads between the player's cities,
 *  carrying grain (gold cart) or coin (pale cart). Mirrors the army column's
 *  route interpolation but renders a single ox-cart and never fights. */
export function Convoys({
  cities,
  convoys,
  forces,
}: {
  cities: Record<string, import('../../../game/types').City>;
  convoys: Record<string, import('../../../game/systems/convoy').Convoy>;
  forces: Record<string, import('../../../game/types').Force>;
}) {
  const list = useMemo(() => {
    const out: Array<{ id: string; route: Array<{ x: number; y: number }>; t: number; kind: 'food' | 'gold' | 'troops'; naval: boolean; color: string }> = [];
    for (const c of Object.values(convoys)) {
      const from = cities[c.fromCityId];
      const to = cities[c.toCityId];
      if (!from || !to) continue;
      const [fx, fy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tx, ty] = cityPixel(to.id, to.coords.x, to.coords.y);
      // A junk runs a straight sea lane; an ox-cart follows the land route.
      const route = c.naval ? [{ x: fx, y: fy }, { x: tx, y: ty }] : terrainRoute(fx, fy, tx, ty);
      const elapsed = c.totalSeasons - c.seasonsRemaining;
      const t = Math.min(0.96, Math.max(0.04, (elapsed + 0.5) / Math.max(1, c.totalSeasons)));
      const kind: 'food' | 'gold' | 'troops' = c.food > 0 ? 'food' : c.gold > 0 ? 'gold' : 'troops';
      out.push({ id: c.id, route, t, kind, naval: !!c.naval, color: forces[c.forceId]?.color ?? '#9a8a6a' });
    }
    return out;
  }, [cities, convoys, forces]);

  return (
    <>
      {list.map((c) => (
        <ConvoyCart key={c.id} route={c.route} t={c.t} kind={c.kind} naval={c.naval} color={c.color} />
      ))}
    </>
  );
}

function ConvoyCart({ route, t, kind, naval, color = '#9a8a6a' }: { route: Array<{ x: number; y: number }>; t: number; kind: 'food' | 'gold' | 'troops'; naval?: boolean; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current || route.length === 0) return;
    const here = positionAlongRoute(route, t);
    const ahead = positionAlongRoute(route, Math.min(0.99, t + 0.05));
    const [wx, wz] = pxToWorld(here.x, here.y);
    const [wx2, wz2] = pxToWorld(ahead.x, ahead.y);
    // A junk floats at water level; a cart rides the terrain.
    const y = naval ? 0.06 : sampleTerrainHeight(wx, wz) + 0.05;
    groupRef.current.position.set(wx, y, wz);
    if (wx2 !== wx || wz2 !== wz) groupRef.current.rotation.y = Math.atan2(wx2 - wx, wz2 - wz);
  });
  const cargoColor = kind === 'gold' ? '#e8c84a' : kind === 'troops' ? '#9aa8b0' : '#d8c88a';
  if (naval) {
    // 漕船 — a small grain junk: hull, cargo deck, single mast & sail.
    return (
      <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.85}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.16, 0.62]} />
          <meshStandardMaterial color="#5a3f24" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.24, 0.05]} castShadow>
          <boxGeometry args={[0.22, 0.14, 0.34]} />
          <meshStandardMaterial color={cargoColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.42, -0.05]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0, 0.42, -0.05]}>
          <boxGeometry args={[0.01, 0.34, 0.26]} />
          <meshStandardMaterial color="#d8cdb0" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        {/* 旗 — a banner pennant in the owner's colour, atop the mast. */}
        <mesh position={[0.07, 0.6, -0.05]}>
          <boxGeometry args={[0.012, 0.11, 0.13]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.8}>
      {/* cart bed */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.34, 0.18, 0.5]} />
        <meshStandardMaterial color="#6a4a28" roughness={0.9} />
      </mesh>
      {/* cargo heap */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.42]} />
        <meshStandardMaterial color={cargoColor} roughness={0.85} />
      </mesh>
      {/* two wheels */}
      {([-0.2, 0.2] as const).map((sx, i) => (
        <mesh key={i} position={[sx, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 8]} />
          <meshStandardMaterial color="#2a1c10" />
        </mesh>
      ))}
      {/* draft ox up front */}
      <mesh position={[0, 0.16, -0.42]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.3]} />
        <meshStandardMaterial color="#4a3420" roughness={0.9} />
      </mesh>
      {/* 旗 — a banner pole flying the owner's colours, so you can tell whose
          column it is (and which to raid). */}
      <mesh position={[0.1, 0.46, 0.12]}>
        <cylinderGeometry args={[0.01, 0.01, 0.36, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.17, 0.56, 0.12]}>
        <boxGeometry args={[0.13, 0.09, 0.012]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * 游历使者 — lone officers roaming the map: a 城池 errand rider heads to another
 * city; a 遠使 embassy rider strikes out toward a distant realm/tribe at the
 * map's edge (gold banner). Mirrors the convoy renderer.
 */
export function Envoys({
  cities,
  expeditions,
  forces,
}: {
  cities: Record<string, import('../../../game/types').City>;
  expeditions: Record<string, import('../../../game/types').Expedition>;
  forces: Record<string, import('../../../game/types').Force>;
}) {
  const list = useMemo(() => {
    const out: Array<{ id: string; route: Array<{ x: number; y: number }>; t: number; color: string; embassy: boolean }> = [];
    for (const e of Object.values(expeditions)) {
      const from = cities[e.fromCityId];
      if (!from) continue;
      const [fx, fy] = cityPixel(from.id, from.coords.x, from.coords.y);
      let dx: number, dy: number;
      if (e.mode === 'embassy' && e.toRealmId) {
        const target = getEmbassyTarget(e.toRealmId);
        if (!target) continue;
        const [rx, ry] = geoToPixel(target.homeland.lon, target.homeland.lat);
        // Distant realms sit off the playable map — aim the rider at the border
        // in their direction so he heads off the right edge, not into the void.
        dx = Math.max(20, Math.min(PX_W - 20, rx));
        dy = Math.max(20, Math.min(PX_H - 20, ry));
      } else {
        const to = cities[e.toCityId];
        if (!to) continue;
        [dx, dy] = cityPixel(to.id, to.coords.x, to.coords.y);
      }
      // Outbound rides from home to destination; the return leg reverses it.
      const a = e.phase === 'returning' ? { x: dx, y: dy } : { x: fx, y: fy };
      const b = e.phase === 'returning' ? { x: fx, y: fy } : { x: dx, y: dy };
      const route = terrainRoute(a.x, a.y, b.x, b.y);
      const elapsed = e.legSeasons - e.seasonsRemaining;
      const t = Math.min(0.96, Math.max(0.04, (elapsed + 0.5) / Math.max(1, e.legSeasons)));
      out.push({ id: e.id, route, t, color: forces[e.forceId]?.color ?? '#cdb87a', embassy: e.mode === 'embassy' });
    }
    return out;
  }, [cities, expeditions, forces]);

  return (
    <>
      {list.map((e) => (
        <EnvoyRider key={e.id} route={e.route} t={e.t} color={e.color} embassy={e.embassy} />
      ))}
    </>
  );
}

function EnvoyRider({ route, t, color, embassy }: { route: Array<{ x: number; y: number }>; t: number; color: string; embassy: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current || route.length === 0) return;
    const here = positionAlongRoute(route, t);
    const ahead = positionAlongRoute(route, Math.min(0.99, t + 0.05));
    const [wx, wz] = pxToWorld(here.x, here.y);
    const [wx2, wz2] = pxToWorld(ahead.x, ahead.y);
    const y = sampleTerrainHeight(wx, wz) + 0.05;
    groupRef.current.position.set(wx, y, wz);
    if (wx2 !== wx || wz2 !== wz) groupRef.current.rotation.y = Math.atan2(wx2 - wx, wz2 - wz);
  });
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.85}>
      {/* mount */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.32]} />
        <meshStandardMaterial color="#5a3f24" roughness={0.9} />
      </mesh>
      {/* rider (force colour) */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.18, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#d8c0a0" />
      </mesh>
      {/* 旌節 — an envoy's tall banner so he's spottable on the map; gold for a
          遠使 to distant lands. */}
      <mesh position={[0, 0.62, -0.08]}>
        <cylinderGeometry args={[0.01, 0.01, 0.64, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.11, 0.78, -0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.014]} />
        <meshStandardMaterial color={embassy ? '#e6c473' : color} side={THREE.DoubleSide} emissive={embassy ? '#5a4410' : '#000000'} emissiveIntensity={embassy ? 0.4 : 0} />
      </mesh>
    </group>
  );
}

/** 城防一目了然 — a city's BUILT perimeter defences (buildSlots) show as tiny
 *  gold watch-posts around its token at their true compass positions, so the
 *  world map reads which cities are fortified and on which approaches. */
const CITY_SLOT_DIR: Array<[number, number]> = [
  [0, -1], [Math.SQRT1_2, -Math.SQRT1_2], [1, 0], [Math.SQRT1_2, Math.SQRT1_2],
  [0, 1], [-Math.SQRT1_2, Math.SQRT1_2], [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2],
];
export function CityDefenseRing({ city, wx, wz, terrainY }: {
  city: City; wx: number; wz: number; terrainY: number;
}) {
  const built = (city.buildSlots ?? []).filter((s) => s.buildingId);
  if (built.length === 0) return null;
  return (
    <group position={[wx, terrainY, wz]}>
      {built.map((s) => {
        const dir = CITY_SLOT_DIR[s.slot] ?? [0, -1];
        return (
          <group key={s.slot} position={[dir[0] * 0.62, 0, dir[1] * 0.62]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.035, 0.14, 5]} />
              <meshStandardMaterial color="#8a6f3a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <coneGeometry args={[0.04, 0.06, 4]} />
              <meshStandardMaterial color="#d4a84a" emissive="#d4a84a" emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 開戰演出 (stage 3) — when a battle ignites, a war-drum + horn sounds, a
 *  「X軍 ⚔ Y軍」 title card flashes, and dust bursts at the clash site, so the
 *  start of every fight reads as a moment, not a silent state flip. ── */
export function BattleIgnitionCard() {
  const battleId = useGameStore((s) => s.tacticalBattle?.id ?? null);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const [card, setCard] = useState<{ a: string; b: string; ac: string; bc: string } | null>(null);
  const lastId = useRef<string | null>(null);
  const lang = useLanguage();
  useEffect(() => {
    if (!battleId || battleId === lastId.current) return;
    lastId.current = battleId;
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    const af = b.attackerForceId ? forces[b.attackerForceId] : undefined;
    const df = b.defenderForceId ? forces[b.defenderForceId] : undefined;
    const defCity = cities[b.cityId];
    setCard({
      a: af ? pickName(af.name, lang) : (lang === 'en' ? 'Punitive Force' : '討伐軍'),
      b: df ? pickName(df.name, lang) : (defCity ? pickName(defCity.name, lang) : (lang === 'en' ? 'Garrison' : '守軍')),
      ac: af?.color ?? '#3a7dd9',
      bc: df?.color ?? '#b8442e',
    });
    playSfx('wardrum');
    const t1 = setTimeout(() => playSfx('horn'), 260);
    const t2 = setTimeout(() => setCard(null), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [battleId, forces, cities, lang]);
  if (!card) return null;
  const side = (c: string): React.CSSProperties => ({
    background: 'rgba(15, 10, 5, 0.86)', border: `2px solid ${c}`, borderRadius: 'var(--tkm-radius-sm)',
    padding: '0.45rem 1.1rem', color: '#ffe9a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
    fontSize: '1.9rem', letterSpacing: '2px', textShadow: '0 0 8px rgba(0,0,0,0.9)',
    boxShadow: `0 0 18px ${c}aa`, whiteSpace: 'nowrap',
  });
  return (
    <div style={{
      position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <style>{'@keyframes tkm-ignite{0%{opacity:0;transform:scale(0.65)}14%{opacity:1;transform:scale(1.06)}28%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(1.02)}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', animation: 'tkm-ignite 2.2s ease-out forwards' }}>
        <span style={side(card.ac)}>{card.a}{lang === 'en' ? '' : '軍'}</span>
        <span style={{ fontSize: '2.6rem', color: '#e0552a', textShadow: '0 0 18px #e0552a, 0 0 4px #fff' }}>⚔</span>
        <span style={side(card.bc)}>{card.b}{lang === 'en' ? '' : '軍'}</span>
      </div>
    </div>
  );
}

/* ─── Compute heatmap color + label for a city given the current mode ── */
export function overlayForCity(
  city: City,
  mode: OverlayMode,
  maxes: { gold: number; food: number; troops: number },
  /** 米價 (§1.16) needs the season — grain is dear in winter and cheap after harvest. */
  season: Season = 'spring',
): { color: string; label: string } | null {
  if (mode === 'none' || mode === 'supply' || mode === 'diplomacy' || mode === 'threat') return null; // these draw their own
  if (mode === 'specialty') {
    // 名產 — mark only the cities that make a famous good, glyph-coded by class.
    const sp = citySpecialty(city.id);
    if (!sp) return null;
    const cls = specialtyClass(city.id);
    const color = cls === 'war' ? '#b8442e' : cls === 'food' ? '#6aae5a' : cls === 'craft' ? '#d4a84a' : cls === 'physic' ? '#4aa8a0' : '#8a7a4a';
    return { color, label: sp.glyph };
  }
  if (mode === 'grain') {
    // 米價 (§1.16) — where grain is dear, caravans are already on the road and a
    // siege will bite far sooner. Green = 穀賤傷農, red = 米珠薪桂.
    const price = grainPrice(city, season, {
      hoardMul: hoardEffects(city.hoardedGrain ?? 0).marketRateMul,
    });
    // 6 (cheap) … 18 (dear) covers the realistic band.
    const t = Math.max(0, Math.min(1, (price - 6) / 12));
    const r = Math.floor(70 + 165 * t);
    const g = Math.floor(180 - 130 * t);
    const b = Math.floor(70 - 30 * t);
    return { color: `rgb(${r},${g},${b})`, label: price.toFixed(0) };
  }
  if (mode === 'province') {
    const pid = PROVINCE_BY_CITY[city.id];
    const color = pid ? (PROVINCE_COLOR[pid] ?? '#5a4530') : '#5a4530';
    return { color, label: (pid ?? '?').toUpperCase() };
  }
  const v = mode === 'gold' ? city.gold
    : mode === 'food' ? city.food
    : mode === 'troops' ? city.troops
    : city.loyalty;
  let r = 0, g = 0, b = 0;
  if (mode === 'loyalty') {
    const t = Math.min(1, v / 100);
    if (t < 0.5) { r = 220; g = Math.floor(220 * (t * 2)); b = 60; }
    else { r = Math.floor(220 * (1 - (t - 0.5) * 2)); g = 200; b = Math.floor(220 * (t - 0.5) * 2); }
  } else {
    const max = mode === 'gold' ? maxes.gold : mode === 'food' ? maxes.food : maxes.troops;
    const t = Math.min(1, v / Math.max(1, max));
    r = Math.floor(60 + 180 * t);
    g = Math.floor(40 + 130 * t);
    b = Math.floor(30 + 30 * t);
  }
  const label = mode === 'loyalty' ? `${v}`
    : v >= 10000 ? `${Math.round(v / 1000)}k`
    : `${v}`;
  return { color: `rgb(${r},${g},${b})`, label };
}


/* ─── 米市商旅 (§1.16) — the caravans the price gap put on the road ─────── */

/**
 * Grain moving by itself. Distinct from {@link Convoys}: those are *your* carts
 * on *your* order, drawn as a token walking a route over several seasons. These
 * are private merchants who ran last season and are already gone — so they are
 * drawn as a faint dotted thread along the road, thicker for a bigger haul,
 * amber inside the realm and pale gold where it crossed a border.
 *
 * Only shown under the 米價 overlay: the thread and the price colour are the
 * same story (grain flows toward red), and elsewhere it would just be clutter.
 */
export function GrainCaravans({ flows }: {
  flows: ReadonlyArray<{ fromCityId: string; toCityId: string; food: number; crossBorder: boolean }>;
}) {
  const cities = useGameStore((st) => st.cities);
  const lines = useMemo(() => {
    const out: Array<{ key: string; pts: [number, number, number][]; color: string; width: number }> = [];
    for (const f of flows) {
      const from = cities[f.fromCityId];
      const to = cities[f.toCityId];
      if (!from || !to) continue;
      const [fx, fy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tx, ty] = cityPixel(to.id, to.coords.x, to.coords.y);
      const route = terrainRoute(fx, fy, tx, ty);
      const pts = route.map((p) => {
        const [wx, wz] = pxToWorld(p.x, p.y);
        return [wx, sampleTerrainHeight(p.x, p.y) + 0.6, wz] as [number, number, number];
      });
      if (pts.length < 2) continue;
      out.push({
        key: `${f.fromCityId}->${f.toCityId}`,
        pts,
        color: f.crossBorder ? '#e8d08a' : '#c8a05a',
        width: Math.max(0.8, Math.min(3, f.food / 900)),
      });
    }
    return out;
  }, [flows, cities]);

  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((l) => (
        <Line key={l.key} points={l.pts} color={l.color} lineWidth={l.width}
          transparent opacity={0.55} dashed dashSize={2.2} gapSize={2.0} />
      ))}
    </>
  );
}
