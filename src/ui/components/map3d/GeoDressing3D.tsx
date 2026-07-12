/* 山河點景 — split out of StrategicMap3D.tsx (2026-07).
   The Great Wall, province ink-borders/watermarks, realm-scale faction
   labels, march preview line + range rings, timber bridges, relay posts,
   battlefield steles, unique landmark monuments, sea labels, and the
   compass heading tracker. Static dressing + light camera utilities. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { City, Force } from '../../../game/types';
import { terrainRoute } from '../../../game/data/territories';
import { geoToPixel, battleGroundAt, hexAt as geoHexAt, hexCenter as geoHexCenter, HEX_ROW_SPACING as GEO_HEX_ROW, terrainMarchCost } from '../../../game/data/geography';
import { cityPos, cityPixel } from '../../../game/data/cityGeo';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../../../game/data/namedMaps';
import { PROVINCE_BY_CITY } from '../../../game/data';
import { HEXW_R } from './HexWorld3D';
import { useLanguage, useT, pickName } from '../../i18n';
import { PIXEL_TO_WORLD, MAP_W, MAP_D, pxToWorld, sampleTerrainHeight, MARKER_SCALE, landSDF, distToPolyline, RIVERS, LAKES, sampleTerrain } from './shared';

/* ─── 北疆长城 — Qin/Han Great Wall draped along the northern frontier ─
 *  A stone rampart following the Yinshan/Yan ranges from the Hexi west end
 *  to Liaodong, with watchtowers at intervals. Instanced for cheapness. */
const WALL_GEO: ReadonlyArray<readonly [number, number]> = [
  [102.5, 38.2], [105.5, 39.2], [108.0, 40.3], [110.5, 41.2],
  [113.0, 41.6], [115.5, 41.6], [118.0, 41.2], [120.5, 41.2], [122.5, 41.3],
];
export function GreatWall3D() {
  const { segments, towers } = useMemo(() => {
    const pxPts = WALL_GEO.map(([lo, la]) => geoToPixel(lo, la));
    const dense: Array<[number, number]> = [];
    const STEP = 7;                                   // px between rampart blocks
    for (let i = 0; i < pxPts.length - 1; i++) {
      const [ax, ay] = pxPts[i], [bx, by] = pxPts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / STEP));
      for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
    }
    dense.push(pxPts[pxPts.length - 1]);
    const segments: Array<{ x: number; y: number; z: number; rot: number; len: number }> = [];
    const towers: Array<[number, number, number]> = [];
    for (let i = 0; i < dense.length - 1; i++) {
      const [wax, waz] = pxToWorld(dense[i][0], dense[i][1]);
      const [wbx, wbz] = pxToWorld(dense[i + 1][0], dense[i + 1][1]);
      const mx = (wax + wbx) / 2, mz = (waz + wbz) / 2;
      const len = Math.hypot(wbx - wax, wbz - waz);
      segments.push({ x: mx, y: sampleTerrainHeight(mx, mz), z: mz, rot: Math.atan2(wbz - waz, wbx - wax), len });
      if (i % 9 === 0) towers.push([wax, sampleTerrainHeight(wax, waz), waz]);
    }
    return { segments, towers };
  }, []);
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const towerRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    if (wallRef.current) {
      segments.forEach((s, i) => {
        d.position.set(s.x, s.y + 0.15, s.z);
        d.rotation.set(0, -s.rot, 0);
        d.scale.set(s.len * 1.2, 1, 1);
        d.updateMatrix();
        wallRef.current!.setMatrixAt(i, d.matrix);
      });
      wallRef.current.instanceMatrix.needsUpdate = true;
    }
    if (towerRef.current) {
      const e = new THREE.Object3D();
      towers.forEach((p, i) => {
        e.position.set(p[0], p[1] + 0.25, p[2]);
        e.updateMatrix();
        towerRef.current!.setMatrixAt(i, e.matrix);
      });
      towerRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [segments, towers]);
  return (
    <group>
      <instancedMesh ref={wallRef} args={[undefined, undefined, segments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.30, 0.14]} />
        <meshStandardMaterial color="#7c766c" roughness={0.96} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={towerRef} args={[undefined, undefined, towers.length]} castShadow receiveShadow>
        <boxGeometry args={[0.19, 0.50, 0.19]} />
        <meshStandardMaterial color="#b0a896" roughness={0.93} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}

/* ─── 州界虚线 — dashed ink borders between the thirteen provinces ───
 *  A draped texture: sample the map on a coarse grid, assign each land
 *  sample to its nearest city's province (same Voronoi the territory
 *  layer uses), and stipple a dash wherever neighbouring samples belong
 *  to different provinces. Water (sea/lake/river) is skipped so borders
 *  stop at the coast and break at rivers. Static — built once. */
let provinceBorderTexCache: THREE.Texture | null = null;
function buildProvinceBorderTexture(cities: Record<string, City>): THREE.Texture {
  if (provinceBorderTexCache) return provinceBorderTexCache;
  const W = 2000, H = 1440;                    // 2× pixel space, crisper dots
  const STEP = 2;                              // logical-px sampling grid
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // City geo-pixel positions + province ids
  const pts: Array<{ x: number; y: number; pid: string }> = [];
  for (const c of Object.values(cities)) {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    pts.push({ x: px, y: py, pid: PROVINCE_BY_CITY[c.id] ?? '?' });
  }
  const isWater = (x: number, y: number): boolean => {
    if (landSDF(x, y) < 0) return true;
    for (const lk of LAKES) if (Math.hypot(x - lk.x, y - lk.y) < lk.r) return true;
    for (const r of RIVERS) if (distToPolyline(x, y, r.points) < r.width) return true;
    return false;
  };
  const provAt = (x: number, y: number): string | null => {
    if (isWater(x, y)) return null;
    let best = ''; let bd = Infinity;
    for (const p of pts) {
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bd) { bd = d; best = p.pid; }
    }
    return best;
  };
  // Cache one row at a time so each sample's province is computed once.
  const cols = Math.floor(1000 / STEP), rows = Math.floor(720 / STEP);
  let prevRow: Array<string | null> = new Array(cols).fill(null);
  for (let gy = 0; gy < rows; gy++) {
    const row: Array<string | null> = new Array(cols);
    for (let gx = 0; gx < cols; gx++) row[gx] = provAt(gx * STEP, gy * STEP);
    for (let gx = 0; gx < cols; gx++) {
      const here = row[gx];
      if (!here) continue;
      const right = gx + 1 < cols ? row[gx + 1] : null;
      const up = prevRow[gx];
      const isBorder = (right && right !== here) || (up && up !== here);
      if (!isBorder) continue;
      const x = gx * STEP, y = gy * STEP;
      // Dash rhythm: ~12px ink, ~6px gap along the border's run.
      if ((x + y) % 18 >= 12) continue;
      // Parchment halo under an ink dot — reads on both dark and gold ground.
      ctx.fillStyle = 'rgba(238, 226, 196, 0.40)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(48, 34, 18, 0.72)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 2.0, 0, Math.PI * 2); ctx.fill();
    }
    prevRow = row;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 8;
  provinceBorderTexCache = tex;
  return tex;
}

export function ProvinceBorders3D({ cities }: { cities: Record<string, City> }) {
  // Same displaced plane as the territory layer, a hair higher so the
  // dashes sit on top of the tint but under lakes/labels.
  const geom = useMemo(() => {
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.06);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const texture = useMemo(() => buildProvinceBorderTexture(cities), [cities]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} renderOrder={2}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ─── 州名 — the thirteen Han provinces as faint floating watermarks so
 *  the player can read regions at a glance. Big + translucent, behind the
 *  city labels; they scale with distance so they recede when you zoom in. */
const STATES_GEO: ReadonlyArray<{ zh: string; lon: number; lat: number }> = [
  { zh: '司隸', lon: 110.0, lat: 34.7 },
  { zh: '豫州', lon: 114.4, lat: 33.2 },
  { zh: '冀州', lon: 114.7, lat: 37.9 },
  { zh: '兗州', lon: 116.1, lat: 35.5 },
  { zh: '徐州', lon: 118.4, lat: 34.1 },
  { zh: '青州', lon: 119.4, lat: 36.9 },
  { zh: '荊州', lon: 112.2, lat: 30.0 },
  { zh: '揚州', lon: 118.7, lat: 30.0 },
  { zh: '益州', lon: 104.1, lat: 30.0 },
  { zh: '涼州', lon: 101.4, lat: 37.2 },
  { zh: '并州', lon: 112.4, lat: 38.6 },
  { zh: '幽州', lon: 118.8, lat: 40.6 },
  { zh: '交州', lon: 108.0, lat: 22.6 },
];
export function ProvinceLabels3D() {
  return (
    <group>
      {STATES_GEO.map((s) => {
        const [wx, wz] = pxToWorld(...geoToPixel(s.lon, s.lat));
        const y = sampleTerrainHeight(wx, wz) + 1.4;
        return (
          <Html key={s.zh} position={[wx, y, wz]} center distanceFactor={32}
            zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              fontSize: '46px', fontWeight: 700,
              color: 'rgba(255, 246, 224, 0.30)',
              textShadow: '0 2px 12px rgba(0,0,0,0.55)',
              letterSpacing: '0.22em', whiteSpace: 'nowrap', userSelect: 'none',
            }}>{s.zh}</div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── 天下大勢 — RTK-XIV-style realm labels: zoom out and each lord's name
 *  blooms over the heart of his domain, colour-coded, so you read who holds
 *  what at a glance. Zoom back in and they fade; city labels take over. */
/** Camera distance below which the realm names give way to city detail.
 *  Far higher than the city-label LOD (30): names stay through the overview
 *  and medium zoom, vanishing only once you pull in to inspect cities. */
const FACTION_LABEL_DIST = 220;   // camera-height handoff with the city-name LOD: above → realm names, below → city names
export function FactionLabels3D({ cities, forces, officers }: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
  officers: Record<string, { name: { zh: string; en: string } }>;
}) {
  // Own zoom gate (hysteresis) so the names persist until you zoom in close.
  const lang = useLanguage();
  const { camera } = useThree();
  const [show, setShow] = useState(true);
  const shownRef = useRef(true);
  useFrame(() => {
    const d = camera.position.y;   // camera height — pan-independent zoom proxy
    const next = shownRef.current
      ? d >= FACTION_LABEL_DIST - 14      // stay shown until we pull in past the lower band
      : d > FACTION_LABEL_DIST + 14;       // re-show once we zoom back out past the upper band
    if (next !== shownRef.current) { shownRef.current = next; setShow(next); }
  });
  const labels = useMemo(() => {
    const agg = new Map<string, { sx: number; sz: number; n: number }>();
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId) continue;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      const e = agg.get(c.ownerForceId) ?? { sx: 0, sz: 0, n: 0 };
      e.sx += wx; e.sz += wz; e.n += 1;
      agg.set(c.ownerForceId, e);
    }
    const out: Array<{ x: number; z: number; name: string; color: string; bright: string; n: number }> = [];
    for (const [fid, e] of agg) {
      const force = forces[fid];
      if (!force || e.n === 0) continue;
      const ruler = force.rulerOfficerId ? officers[force.rulerOfficerId] : null;
      const name = ruler ? pickName(ruler.name, lang) : pickName(force.name, lang);
      // Brighten the realm colour for legible text on the dark chip — keeps the
      // faction's hue but guarantees contrast even for dark/terrain-green lords.
      const bright = '#' + new THREE.Color(force.color).lerp(new THREE.Color('#ffffff'), 0.45).getHexString();
      out.push({ x: e.sx / e.n, z: e.sz / e.n, name, color: force.color, bright, n: e.n });
    }
    return out;
  }, [cities, forces, officers, lang]);
  if (!show) return null;   // pulled in close → city detail takes over
  return (
    <group>
      {labels.map((l, i) => {
        // Bigger domains get a bigger name; sized large so they read from a
        // full zoom-out (distanceFactor keeps a fixed world size, so a big
        // factor + big font is what stays legible when the camera pulls back).
        const fs = Math.round(64 + Math.min(48, l.n * 3));
        const y = sampleTerrainHeight(l.x, l.z) + 2.2;
        return (
          <Html key={i} position={[l.x, y, l.z]} center distanceFactor={64} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(14,10,6,0.72)',
              border: `3px solid ${l.color}`,
              borderRadius: 'var(--tkm-radius-lg)',
              padding: '2px 16px',
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              fontSize: `${fs}px`, fontWeight: 800,
              color: l.bright,
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              letterSpacing: '0.08em', whiteSpace: 'nowrap', userSelect: 'none', opacity: 0.96,
            }}>{l.name}</div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── 行軍預覽 — glowing route while the march picker is open ─────── */
export function MarchPreviewLine({ fromId, toId, cities, winter }: {
  fromId: string; toId: string; cities: Record<string, City>;
  /** 冬望 — when the leg would be walked in winter, deep-mountain cells
   *  show snow-white (雪封風險路段:所見即所險). */
  winter?: boolean;
}) {
  const data = useMemo(() => {
    const from = cities[fromId];
    const to = cities[toId];
    if (!from || !to) return null;
    const fp = cityPos(from);
    const tp = cityPos(to);
    const route = terrainRoute(fp.x, fp.y, tp.x, tp.y);
    const pts = route.map((p) => {
      const [wx, wz] = pxToWorld(p.x, p.y);
      return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.12, wz);
    });
    // Cities the column marches past that could sally out at it.
    const risky: Array<[number, number]> = [];
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || c.ownerForceId === from.ownerForceId) continue;
      if (c.id === toId || c.id === fromId) continue;
      if (c.troops < 4000) continue;
      const cp = cityPos(c);
      const near = route.some((p) => Math.hypot(p.x - cp.x, p.y - cp.y) < 67);
      if (near) risky.push(pxToWorld(cp.x, cp.y));
    }
    // P2 行軍上格 — quantise the route onto the canonical lattice and show
    // the actual CELLS the column will cross, tinted by terrain cost
    // (green plains → red ridge/river crossings): 所見即所行.
    const cells: Array<{ x: number; z: number; color: string }> = [];
    const seenCells = new Set<string>();
    for (let i = 0; i < route.length - 1; i++) {
      const p0 = route[i], p1 = route[i + 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / (GEO_HEX_ROW / 2)));
      for (let k = 0; k <= steps; k++) {
        const px = p0.x + (p1.x - p0.x) * (k / steps);
        const py = p0.y + (p1.y - p0.y) * (k / steps);
        const h = geoHexAt(px, py);
        const key = `${h.col},${h.row}`;
        if (seenCells.has(key)) continue;
        seenCells.add(key);
        const cc = geoHexCenter(h.col, h.row);
        const cost = terrainMarchCost(cc.x, cc.y);
        const [wx, wz] = pxToWorld(cc.x, cc.y);
        cells.push({
          x: wx, z: wz,
          // 冬季深山 → 雪封白:this stretch may snow the column in for a season.
          color: winter && cost >= 0.55 ? '#dceef7'
            : cost < 0.25 ? '#69d47e' : cost < 0.7 ? '#e8c15a' : '#ef7350',
        });
      }
    }
    return { pts, risky, cells };
  }, [fromId, toId, cities, winter]);
  const matRef = useRef<THREE.LineDashedMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 3) * 0.2;
  });
  const geom = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry().setFromPoints(data.pts);
    return g;
  }, [data]);
  const lineObj = useMemo(() => {
    if (!geom) return null;
    const mat = new THREE.LineDashedMaterial({ color: '#ffd75e', dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.95 });
    const l = new THREE.Line(geom, mat);
    l.computeLineDistances();
    return { l, mat };
  }, [geom]);
  useEffect(() => {
    if (lineObj) matRef.current = lineObj.mat as never;
  }, [lineObj]);
  if (!data || !lineObj) return null;
  return (
    <group>
      <primitive object={lineObj.l} />
      {/* P2 行軍上格 — the lattice cells the column will actually cross,
          tinted by march cost (green open ground → red ridge/river). */}
      {data.cells.map((c, i) => (
        <mesh key={`c${i}`} position={[c.x, sampleTerrainHeight(c.x, c.z) + 0.08, c.z]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[HEXW_R * 0.62, HEXW_R * 0.8, 6]} />
          <meshBasicMaterial color={c.color} transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      {/* 邀擊 risk — hostile garrisons within sally reach of the route */}
      {data.risky.map(([wx, wz], i) => (
        <mesh key={i} position={[wx, sampleTerrainHeight(wx, wz) + 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.66, 24]} />
          <meshBasicMaterial color="#ff5040" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 橋樑 — timber bridges where a road crosses a river/lake. Each
 *  city-adjacency edge is sampled; a crossing run gets one bridge oriented
 *  along the road. ── */
export function Bridges3D({ cities }: { cities: Record<string, City> }) {
  const bridges = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const cross: Array<[number, number]> = [];
        const N = 26;
        for (let i = 1; i < N; i++) {
          const t = i / N;
          const px = fpx + (tpx - fpx) * t, py = fpy + (tpy - fpy) * t;
          const g = battleGroundAt(px, py);
          if (g === 'river' || g === 'lake') cross.push([px, py]);
        }
        if (cross.length === 0) continue;
        const [mpx, mpy] = cross[Math.floor(cross.length / 2)];
        const [wx, wz] = pxToWorld(mpx, mpy);
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        out.push({ x: wx, z: wz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (bridges.length === 0) return null;
  return (
    <group>
      {bridges.map((b, i) => (
        <group key={i} position={[b.x, sampleTerrainHeight(b.x, b.z) + 0.05, b.z]} rotation={[0, b.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.025, 0.9]} />
            <meshStandardMaterial color="#8a6840" roughness={0.85} />
          </mesh>
          <mesh position={[0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
          <mesh position={[-0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 驛站 — a relay post (hut + pennant) at the midpoint of long roads,
 *  on dry ground, so the highways feel travelled. ── */
export function PostStations3D({ cities }: { cities: Record<string, City> }) {
  const posts = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const mpx = (fpx + tpx) / 2, mpy = (fpy + tpy) / 2;
        const g = battleGroundAt(mpx, mpy);
        if (g === 'river' || g === 'lake' || g === 'sea') continue;   // not on water (bridges handle that)
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        if (Math.hypot(tx - fx, tz - fz) < 5) continue;               // only the longer hauls
        const [mx, mz] = pxToWorld(mpx, mpy);
        if (sampleTerrainHeight(mx, mz) < 0.06) continue;
        out.push({ x: mx, z: mz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (posts.length === 0) return null;
  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, sampleTerrainHeight(p.x, p.z), p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.07, 0.06, 0.08]} /><meshStandardMaterial color="#a08a64" roughness={0.9} /></mesh>
          <mesh position={[0, 0.075, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.065, 0.035, 4]} /><meshStandardMaterial color="#5f4a2e" roughness={0.85} /></mesh>
          <mesh position={[0.05, 0.1, 0.05]}><cylinderGeometry args={[0.004, 0.004, 0.14, 4]} /><meshStandardMaterial color="#3a2818" /></mesh>
          <mesh position={[0.085, 0.13, 0.05]}><planeGeometry args={[0.06, 0.035]} /><meshStandardMaterial color="#c0502e" side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 名勝古戰場 — a stone stele + label marking the famous battlefields the
 *  named-map data records (赤壁/官渡/長坂/定軍山…). One per battle. ── */
export function Landmarks3D({ cities }: { cities: Record<string, City> }) {
  const lang = useLanguage();
  const sites = useMemo(() => {
    const usedMap = new Set<string>();
    const out: Array<{ x: number; z: number; name: string }> = [];
    for (const [cid, mapId] of Object.entries(NAMED_MAPS_BY_CITY)) {
      if (usedMap.has(mapId)) continue;
      const c = cities[cid]; const m = NAMED_MAPS_BY_ID[mapId];
      if (!c || !m) continue;
      usedMap.add(mapId);
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, name: pickName(m.name, lang) });
    }
    return out;
  }, [cities, lang]);
  return (
    <group>
      {sites.map((s, i) => {
        const x = s.x + 0.55, z = s.z + 0.55;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.06, 0.24, 0.04]} /><meshStandardMaterial color="#5a554e" roughness={0.85} /></mesh>
            <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.085, 0.03, 0.06]} /><meshStandardMaterial color="#46423b" roughness={0.8} /></mesh>
            <Html position={[0, 0.37, 0]} center distanceFactor={13} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.8)', border: '1px solid #8a7050', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#e0c89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>⚔ {s.name}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 唯一名建築 — landmark monuments at iconic cities ────────────────
 * Each three-kingdoms capital and a handful of legendary sites carry a
 * one-of-a-kind structure that reads instantly from the map: 鄴 flies the
 * Bronze Sparrow Terrace, the Han capitals raise twin-eaved palace halls,
 * 成都 the brocade-roofed Shu palace. Purely cosmetic, geo-anchored to the
 * real city pixel so it sits right beside the city marker. */
type LandmarkKind = 'terrace' | 'palace' | 'brocade';
const UNIQUE_LANDMARKS: ReadonlyArray<{ cityId: string; zh: string; en: string; kind: LandmarkKind }> = [
  { cityId: 'ye',      zh: '銅雀臺', en: 'Bronze Sparrow Terrace', kind: 'terrace' },  // 曹操鄴城,銅雀／金鳳／冰井三臺
  { cityId: 'luoyang', zh: '漢宮',   en: 'Han Palace',             kind: 'palace'  },  // 後漢南北宮、魏都宮城
  { cityId: 'changan', zh: '未央宮', en: 'Weiyang Palace',         kind: 'palace'  },  // 前漢宮室、董卓遷都
  { cityId: 'xuchang', zh: '許都',   en: 'Xudu Capital',           kind: 'palace'  },  // 獻帝行在、曹魏發跡
  { cityId: 'jianye',  zh: '太初宮', en: 'Taichu Palace',          kind: 'palace'  },  // 孫吳宮城
  { cityId: 'chengdu', zh: '錦官城', en: 'Brocade City',           kind: 'brocade' },  // 蜀宮、錦官織造
];

/** A twin-eaved swept roof in a chosen palette (重檐廡殿頂). */
function PalaceRoof3D({ y, w, d, color = '#c9a23c', ridge = '#e8cf6a' }: {
  y: number; w: number; d: number; color?: string; ridge?: string;
}) {
  const eave = (ey: number, ew: number, ed: number, eh: number) => (
    <group position={[0, ey, 0]}>
      <mesh castShadow><boxGeometry args={[ew, eh, ed]} /><meshStandardMaterial color={color} roughness={0.55} metalness={0.25} /></mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * ew * 0.46, eh * 0.3, sz * ed * 0.4]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[eh * 0.55, eh * 1.4, 4]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0, y, 0]}>
      {eave(0, w, d, 0.05)}
      {/* upper tier — 重檐 */}
      <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[w * 0.6, 0.06, d * 0.6]} /><meshStandardMaterial color="#8a2f28" roughness={0.8} /></mesh>
      {eave(0.12, w * 0.66, d * 0.66, 0.04)}
      {/* golden ridge acroteria (鴟尾) */}
      <mesh position={[-w * 0.34, 0.05, 0]} rotation={[0, 0, 0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[w * 0.34, 0.05, 0]} rotation={[0, 0, -0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
    </group>
  );
}

/** A grand palace hall on a raised stone platform with vermilion columns. */
function PalaceHall3D({ roofColor, roofRidge }: { roofColor?: string; roofRidge?: string }) {
  return (
    <group>
      {/* Raised stone platform (臺基) */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow><boxGeometry args={[0.72, 0.08, 0.46]} /><meshStandardMaterial color="#b8a88c" roughness={0.92} /></mesh>
      <mesh position={[0, 0.085, 0.25]} castShadow><boxGeometry args={[0.3, 0.01, 0.06]} /><meshStandardMaterial color="#9a8a70" roughness={0.95} /></mesh>
      {/* Vermilion hall body */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.16, 0.36]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      {/* Front colonnade */}
      {[-0.24, -0.08, 0.08, 0.24].map((cx, i) => (
        <mesh key={i} position={[cx, 0.17, 0.19]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.16, 8]} /><meshStandardMaterial color="#6a1f1a" roughness={0.7} /></mesh>
      ))}
      <PalaceRoof3D y={0.27} w={0.7} d={0.46} color={roofColor} ridge={roofRidge} />
    </group>
  );
}

/** 銅雀臺 — a three-tier stone terrace crowned by a pavilion and the bronze
 *  sparrow that gave it its name. */
function BronzeTerrace3D() {
  return (
    <group>
      {/* Three receding stone tiers */}
      <mesh position={[0, 0.10, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.2, 0.42]} /><meshStandardMaterial color="#9a9082" roughness={0.95} /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow receiveShadow><boxGeometry args={[0.37, 0.16, 0.31]} /><meshStandardMaterial color="#a89e8e" roughness={0.95} /></mesh>
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow><boxGeometry args={[0.26, 0.12, 0.22]} /><meshStandardMaterial color="#b4aa98" roughness={0.95} /></mesh>
      {/* Crowning pavilion */}
      <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[0.2, 0.1, 0.17]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      <PalaceRoof3D y={0.6} w={0.26} d={0.22} color="#c9a23c" />
      {/* 銅雀 — the bronze sparrow perched on the ridge */}
      <group position={[0, 0.74, 0]}>
        <mesh castShadow><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, 0.04, -0.02]} castShadow><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[-0.04, 0.01, 0]} rotation={[0, 0, 0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0.04, 0.01, 0]} rotation={[0, 0, -0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, -0.01, 0.05]} rotation={[1.2, 0, 0]} castShadow><coneGeometry args={[0.015, 0.06, 4]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
      </group>
    </group>
  );
}

export function UniqueLandmarks3D({ cities }: { cities: Record<string, City> }) {
  const lang = useLanguage();
  const sites = useMemo(() => {
    const out: Array<{ x: number; z: number; zh: string; kind: LandmarkKind }> = [];
    for (const lm of UNIQUE_LANDMARKS) {
      const c = cities[lm.cityId];
      if (!c) continue;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, zh: pickName(lm, lang), kind: lm.kind });
    }
    return out;
  }, [cities, lang]);
  const scale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s, i) => {
        // Offset opposite the battle signpost so the two never collide.
        const x = s.x - 0.6, z = s.z - 0.6;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]} scale={scale}>
            {s.kind === 'terrace' ? <BronzeTerrace3D />
              : s.kind === 'brocade' ? <PalaceHall3D roofColor="#3f7d6e" roofRidge="#7fd0b8" />
              : <PalaceHall3D />}
            <Html position={[0, s.kind === 'terrace' ? 0.95 : 0.5, 0]} center distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.82)', border: '1px solid #c9a23c', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#f0d89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>🏯 {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 行軍時距環 — concentric rings around a selected column's source city,
   one per march-time band (moveArmyToCell: <100px=1 季, <195=2, <275=3, else
   4). Shows at a glance how many seasons a march to any spot will cost, so you
   stop guessing where you can reach this turn. Rings hug the terrain. ─────── */
const MARCH_BANDS: Array<{ r: number; seasons: number; color: string }> = [
  { r: 100, seasons: 1, color: '#5ad17a' },
  { r: 195, seasons: 2, color: '#e3c948' },
  { r: 275, seasons: 3, color: '#e0863a' },
];
export function MarchRangeRings({ cx, cy }: { cx: number; cy: number }) {
  const t = useT();
  const rings = useMemo(() => MARCH_BANDS.map((b) => {
    const N = 90;
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const [wx, wz] = pxToWorld(cx + Math.cos(ang) * b.r, cy + Math.sin(ang) * b.r);
      pts.push([wx, sampleTerrainHeight(wx, wz) + 0.14, wz]);
    }
    const [lx, lz] = pxToWorld(cx, cy - b.r);   // north point — anchor the label
    return { pts, color: b.color, seasons: b.seasons, label: [lx, sampleTerrainHeight(lx, lz) + 0.5, lz] as [number, number, number] };
  }), [cx, cy]);
  return (
    <group>
      {rings.map((rg, i) => (
        <group key={i}>
          <Line points={rg.pts} color={rg.color} lineWidth={2} transparent opacity={0.7} dashed dashSize={2.4} gapSize={1.4} />
          <Html position={rg.label} center distanceFactor={11} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.82)', border: `1px solid ${rg.color}`, borderRadius: 'var(--tkm-radius-xs)',
              padding: '1px 6px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: rg.color, whiteSpace: 'nowrap',
            }}>{t(`${rg.seasons} 季`, `${rg.seasons} season${rg.seasons > 1 ? 's' : ''}`)}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ─── 海域 — faint sea names drift in the open water around the coast so the
   empty margin reads as ocean on an old chart, not dead space. They sit past
   the map edges (the pan clamp keeps the land from covering them) and hold a
   constant on-screen size, so they mostly register at the strategic zoom. ── */
const SEA_LABELS: Array<{ zh: string; en: string; pos: [number, number, number]; size: number }> = [
  { zh: '東海', en: 'East Sea', pos: [MAP_W * 0.58, 1, MAP_D * 0.16], size: 25 },
  { zh: '南海', en: 'South Sea', pos: [MAP_W * 0.16, 1, MAP_D * 0.72], size: 23 },
  { zh: '渤海', en: 'Bohai', pos: [MAP_W * 0.46, 1, -MAP_D * 0.42], size: 17 },
];
export function SeaLabels() {
  const lang = useLanguage();
  return (
    <>
      {SEA_LABELS.map((s) => (
        <Html key={s.zh} position={s.pos} center zIndexRange={[8, 2]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'var(--tkm-font-display, serif)', fontSize: s.size, fontStyle: 'italic',
            color: 'rgba(176,202,224,0.55)', letterSpacing: lang === 'en' ? '2px' : '10px',
            whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.6)', userSelect: 'none',
          }}>{lang === 'en' ? s.en : s.zh}</div>
        </Html>
      ))}
    </>
  );
}

/* ─── 羅盤 — reports the camera's heading (azimuth, in whole degrees) up to the
   DOM compass rose, which counter-rotates so 北 always points to true north. */
export function HeadingTracker({ controlsRef, onHeading }: {
  controlsRef: React.MutableRefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onHeading: (deg: number) => void;
}) {
  const last = useRef(999);
  useFrame(() => {
    const c = controlsRef.current as unknown as { getAzimuthalAngle?: () => number } | null;
    if (!c?.getAzimuthalAngle) return;
    const deg = Math.round((c.getAzimuthalAngle() * 180) / Math.PI);
    if (deg !== last.current) { last.current = deg; onHeading(deg); }
  });
  return null;
}


