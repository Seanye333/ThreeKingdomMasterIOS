/* Ambient nature / geography layers of the strategic 3D map — ocean, rivers,
 * lakes, weather particles, snow blanket, forests, farmland, villages, geo
 * labels and trade-route threads. Extracted verbatim from StrategicMap3D.tsx
 * (pure mechanical split). */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { RENDER_HI } from '../../renderQuality';
import { geoToPixel, MAP_W as PX_W, MAP_H as PX_H } from '../../../game/data/geography';
import { cityPixel } from '../../../game/data/cityGeo';
import { useGameStore } from '../../../game/state/store';
import { GEO_LABELS } from '../../../game/data/mapLabels';
import type { City, Season } from '../../../game/types';
import { useLanguage, pickName } from '../../i18n';
import { IS_MOBILE, MAP_W, MAP_D, PIXEL_TO_WORLD, GEO_LAT_MAX, GEO_LAT_SPAN, RIVERS, LAKES, pxToWorld, sampleTerrain, sampleTerrainHeight, cityElevation } from './shared';

/* ─── Ocean plane sitting just below sea-level terrain ─────────── */
/** Living water — a low-subdivision plane whose vertices roll in layered
 *  swells, so the sea shimmers and undulates instead of sitting glassy-flat. */
export function Ocean({ night = false }: { night?: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(MAP_W * 1.1, MAP_D * 1.1, 24, 24), []);
  const orig = useMemo(() => Float32Array.from(geom.attributes.position.array), [geom]);
  const frame = useRef(0);
  useFrame(({ clock }) => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3], y = orig[i * 3 + 1];
      // Layered swell — big rollers + a finer cross-chop for glittering relief.
      const swell = Math.sin(x * 0.05 + t * 0.7) * 0.06 + Math.cos(y * 0.045 + t * 0.55) * 0.06
        + Math.sin(x * 0.13 - y * 0.11 + t * 1.3) * 0.025;
      pos.setZ(i, swell);
    }
    pos.needsUpdate = true;
    // Recompute normals every few frames so the specular highlight travels
    // with the swells without paying the cost every single frame.
    if ((frame.current++ & 3) === 0) geom.computeVertexNormals();
  });
  const color = night ? '#0a2c3a' : '#0e5e74';
  // 倒影 — on desktop the sea becomes a real mirror: sky, sunset and the moon
  // glide across it (a planar reflection pass). Phones keep the cheap shimmer
  // material so the extra render pass never touches the mobile framerate.
  // Gate on !IS_MOBILE, NOT just RENDER_HI: capable iPhones resolve RENDER_HI
  // to true, but the per-frame 512² render-to-texture + blur pass is exactly
  // the kind of sustained GPU-memory pressure that makes iOS WKWebView drop
  // the WebGL context (→ black map) after a long session. The mirror is a
  // desktop-only luxury.
  if (RENDER_HI && !IS_MOBILE) {
    return (
      <mesh ref={ref} geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={6}
          mixStrength={night ? 0.95 : 0.55}
          blur={[300, 90]}
          mirror={night ? 0.85 : 0.55}
          color={color}
          roughness={0.22}
          metalness={0.72}
          depthScale={1.1}
          minDepthThreshold={0.85}
          maxDepthThreshold={1.2}
        />
      </mesh>
    );
  }
  return (
    <mesh ref={ref} geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.16}
        metalness={0.74}
        emissive={night ? '#05202c' : '#0a3a48'}
        emissiveIntensity={0.34}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ─── Render rivers as visible blue ribbons on top of terrain ─── */
export function RiverRibbons({ frozen = false }: { frozen?: boolean }) {
  // Real WIDTH — a draped triangle strip following each river's course
  // (lineBasicMaterial linewidth is ignored by most GPUs, so the old
  // ribbons rendered as hairlines). Width tapers from the headwaters to
  // the full lower course.
  const ribbons = useMemo(() => {
    const out: Array<{ geom: THREE.BufferGeometry; freezes: boolean }> = [];
    for (const r of RIVERS) {
      // Densify the polyline so the strip bends smoothly.
      const dense: Array<[number, number]> = [];
      for (let i = 0; i < r.points.length - 1; i++) {
        const [ax, ay] = r.points[i];
        const [bx, by] = r.points[i + 1];
        const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 6));
        for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
      }
      dense.push(r.points[r.points.length - 1]);
      if (dense.length < 2) continue;
      const positions: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i < dense.length; i++) {
        const [px, py] = dense[i];
        const [nx, ny] = dense[Math.min(dense.length - 1, i + 1)];
        const [qx, qy] = dense[Math.max(0, i - 1)];
        // direction from neighbours; perpendicular for the banks
        let dx = nx - qx, dy = ny - qy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        const taper = 0.35 + 0.65 * (i / (dense.length - 1));   // grows downstream
        const halfW = (r.width * 0.7 * taper) * PIXEL_TO_WORLD;
        const [wx, wz] = pxToWorld(px, py);
        const h = sampleTerrain(px, py).h + 0.02;
        positions.push(
          wx + (-dy) * halfW, h, wz + dx * halfW,
          wx + dy * halfW, h, wz + (-dx) * halfW,
        );
        if (i > 0) {
          const a = (i - 1) * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      out.push({ geom, freezes: r.name === 'yellow' });
    }
    return out;
  }, []);
  const matRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  useFrame(({ clock }) => {
    // Living water — a brighter specular shimmer travelling along the rivers.
    const t = clock.elapsedTime;
    matRefs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = 0.24 + Math.sin(t * 1.3 + i * 1.7) * 0.16;
    });
  });
  return (
    <group>
      {ribbons.map((r, i) => (
        <mesh key={i} geometry={r.geom} renderOrder={1}>
          {/* 冰封 — the frozen Yellow River goes pale ice-blue in winter */}
          <meshStandardMaterial
            ref={(m) => { matRefs.current[i] = m; }}
            color={frozen && r.freezes ? '#cfe8f4' : '#3f7fae'}
            emissive={frozen && r.freezes ? '#e8f4fa' : '#5a9bc8'}
            emissiveIntensity={0.18}
            roughness={frozen && r.freezes ? 0.55 : 0.25}
            metalness={frozen && r.freezes ? 0.1 : 0.5}
            transparent opacity={0.92}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 3D forest patches — scattered conifer cones on plains/low hills.
 *  Each patch is an ellipse in (lon, lat) with a target tree count. */
const FOREST_PATCHES: Array<{ lon: number; lat: number; rLon: number; rLat: number; trees: number }> = [
  // 江南 — south of Yangtze, the classic 江湖 forest belt
  { lon: 114, lat: 28.5, rLon: 4.0, rLat: 2.0, trees: 700 },
  // 楚地 — Jingzhou hills north of Yangtze
  { lon: 112, lat: 31.0, rLon: 2.5, rLat: 1.2, trees: 350 },
  // 蜀中 — Sichuan basin edges
  { lon: 105.5, lat: 30.5, rLon: 2.0, rLat: 1.5, trees: 350 },
  // 黔/桂 — south-central karst hills
  { lon: 109, lat: 25.5, rLon: 3.0, rLat: 2.0, trees: 500 },
  // 闽 — Fujian/Jiangxi hills (Wuyi)
  { lon: 117, lat: 27, rLon: 1.5, rLat: 2.5, trees: 300 },
  // 三辅周边 — central Henan/Anhui small patches
  { lon: 115, lat: 32.5, rLon: 2.5, rLat: 1.2, trees: 250 },
];
export function Forest3D({ season }: { season: Season }) {
  const positions = useMemo(() => {
    const ps: { x: number; y: number; z: number; rot: number; scale: number }[] = [];
    for (const patch of FOREST_PATCHES) {
      // Phones plant a thinner wood — same patches, 60% of the trees.
      const target = IS_MOBILE ? Math.floor(patch.trees * 0.6) : patch.trees;
      for (let i = 0; i < target; i++) {
        // Random point within ellipse (sqrt for uniform area distribution)
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        const lon = patch.lon + Math.cos(a) * r * patch.rLon;
        const lat = patch.lat + Math.sin(a) * r * patch.rLat;
        const [px, py] = geoToPixel(lon, lat);
        const [wx, wz] = pxToWorld(px, py);
        const y = sampleTerrainHeight(wx, wz);
        // Skip sea, mountain peaks, and underwater spots
        if (y < 0.03 || y > 0.5) continue;
        ps.push({
          x: wx, y, z: wz,
          rot: Math.random() * Math.PI * 2,
          scale: 0.6 + Math.random() * 0.7,
        });
      }
    }
    return ps;
  }, []);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.y = p.rot;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      canopyRef.current.setMatrixAt(i, dummy.matrix);
    }
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  // 春華秋實 — the canopy follows the season: spring scatters blossom
  // through fresh green, summer is the old deep green, autumn turns the
  // woods gold and amber with late hold-outs, winter dusts them grey-green.
  // Deterministic per-tree hash so the same trees blossom every year.
  useEffect(() => {
    const canopy = canopyRef.current;
    if (!canopy) return;
    const c = new THREE.Color();
    for (let i = 0; i < positions.length; i++) {
      const h = ((i * 2654435761) >>> 0) % 100 / 100;
      const hex = season === 'spring' ? (h < 0.28 ? '#e0a8be' : '#3d6a34')
        : season === 'summer' ? '#2d4a28'
        : season === 'autumn' ? (h < 0.45 ? '#c8902e' : h < 0.75 ? '#a8651f' : '#56602a')
        : '#8e9a8c';
      canopy.setColorAt(i, c.set(hex));
    }
    if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
  }, [positions, season]);

  return (
    <group>
      {/* Trunk — thin brown cylinder */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.008, 0.012, 0.10, 5]} />
        <meshStandardMaterial color="#3a2818" roughness={0.95} />
      </instancedMesh>
      {/* Canopy — seasonal per-instance colour (white base × instanceColor) */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, positions.length]} castShadow>
        <coneGeometry args={[0.07, 0.30, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.92} />
      </instancedMesh>
    </group>
  );
}

/* ─── Rain / snow particle components ──────────────────────────── */
export function RainParticles({ count = 2000, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.6,
      z: (Math.random() - 0.5) * bounds.z * 1.6,
      y: Math.random() * 22,
      speed: 18 + Math.random() * 10,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 22;
      dummy.position.set(s.x, s.y, s.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.018, 0.018, 0.4, 4]} />
      <meshBasicMaterial color="#a8c8e8" transparent opacity={0.5} />
    </instancedMesh>
  );
}
export function SnowParticles({ count = 1500, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.6,
      z: (Math.random() - 0.5) * bounds.z * 1.6,
      y: Math.random() * 22,
      speed: 1.0 + Math.random() * 0.8,
      drift: Math.random() * Math.PI * 2,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 22;
      dummy.position.set(
        s.x + Math.sin(t + s.drift) * 0.4,
        s.y,
        s.z + Math.cos(t * 0.7 + s.drift) * 0.4,
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.07, 4, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

/* ─── 大湖 — 洞庭/鄱阳/太湖, a shimmering water surface over the painted
 *  lake basin so the great lakes read as open water, not just blue ground. */
export function Lakes3D() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Gentle opacity shimmer so the lakes feel alive like the sea.
    const o = 0.86 + Math.sin(clock.elapsedTime * 0.8) * 0.05;
    ref.current.children.forEach((m) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) mat.opacity = o;
    });
  });
  return (
    <group ref={ref}>
      {LAKES.map((lk, i) => {
        const [wx, wz] = pxToWorld(lk.x, lk.y);
        const r = lk.r * PIXEL_TO_WORLD;
        // Lift the surface above the territory tint plane (terrain +0.05) so
        // the lakes read as open water instead of being painted over by it.
        const y = sampleTerrainHeight(wx, wz) + 0.09;
        return (
          <mesh key={i} position={[wx, y, wz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[r, 40]} />
            <meshStandardMaterial color="#2c6e9c" roughness={0.26} metalness={0.55} transparent opacity={0.86} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─── 冬雪 — a snow blanket draped over the northern terrain in winter ─
 *  Static latitude/altitude mask (built once), shown only in winter.
 *  The Yellow River freezes too — its ribbon goes pale ice-blue. */
let snowMaskCache: THREE.Texture | null = null;
function buildSnowMask(): THREE.Texture {
  if (snowMaskCache) return snowMaskCache;
  const W = 500, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = (x / W) * PX_W, py = (y / H) * PX_H;
      const lat = GEO_LAT_MAX - (py / PX_H) * GEO_LAT_SPAN;
      let alpha = Math.max(0, Math.min(1, (lat - 31) / 6)) * 0.62;   // deep north whitens
      const { h } = sampleTerrain(px, py);
      if (h < 0) alpha = 0;                                          // no snow on water
      else if (h > 0.5) alpha = Math.min(0.85, alpha + 0.35);        // snow-capped ranges
      const i = (y * W + x) * 4;
      d[i] = 245; d[i + 1] = 248; d[i + 2] = 252;
      d[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  snowMaskCache = tex;
  return tex;
}

export function SnowBlanket() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, 240, 180);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.04);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const texture = useMemo(() => buildSnowMask(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} renderOrder={1}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ─── 名產商路 — faint gold threads between the player's trading cities ─── */
export function TradeRouteLines3D({ cities }: { cities: Record<string, City> }) {
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const segs = useMemo(() => {
    const out: THREE.Vector3[][] = [];
    for (const r of tradeRoutes) {
      const a = cities[r.cityAId]; const b = cities[r.cityBId];
      if (!a || !b || a.ownerForceId == null) continue;
      if (a.ownerForceId !== playerForceId || b.ownerForceId !== playerForceId) continue;
      const [ax, az] = pxToWorld(...cityPixel(a.id, a.coords.x, a.coords.y));
      const [bx, bz] = pxToWorld(...cityPixel(b.id, b.coords.x, b.coords.y));
      const ay = cityElevation(ax, az) + 0.12;
      const by = cityElevation(bx, bz) + 0.12;
      const mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 0.35, (az + bz) / 2);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz),
      );
      out.push(curve.getPoints(20));
    }
    return out;
  }, [tradeRoutes, cities, playerForceId]);
  if (segs.length === 0) return null;
  return (
    <group>
      {segs.map((pts, i) => (
        <Line key={i} points={pts} color="#e0c060" dashed dashSize={0.3} gapSize={0.18} lineWidth={1.3} transparent opacity={0.5} />
      ))}
    </group>
  );
}

/* ─── 田疇 — cultivated fields ringing each city, so settlements sit in
 *  farmland rather than bare ground. Instanced flat paddies. ── */
export function Farmland3D({ cities }: { cities: Record<string, City> }) {
  const fields = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; rot: number; s: number }> = [];
    for (const c of Object.values(cities)) {
      if (c.name.zh.includes('關')) continue;   // passes have no fields
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [cx, cz] = pxToWorld(px, py);
      const n = IS_MOBILE ? 4 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (px % 1.3);
        const r = 0.42 + (i % 2) * 0.26;       // a couple of rings just outside the wall
        const fx = cx + Math.cos(a) * r, fz = cz + Math.sin(a) * r;
        const y = sampleTerrainHeight(fx, fz);
        if (y < 0.05 || y > 0.28) continue;    // no fields on water or steep ground
        out.push({ x: fx, y, z: fz, rot: a, s: 0.85 + (i % 3) * 0.18 });
      }
    }
    return out;
  }, [cities]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      dummy.position.set(f.x, f.y + 0.02, f.z);
      dummy.rotation.set(0, f.rot, 0);
      dummy.scale.set(f.s, 1, f.s * 0.7);
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [fields, dummy]);
  if (fields.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, fields.length]} receiveShadow>
      <boxGeometry args={[0.24, 0.008, 0.18]} />
      <meshStandardMaterial color="#94a24c" roughness={0.95} />
    </instancedMesh>
  );
}

/* ─── 村落 — scattered countryside hamlets (mud-brick body + thatch roof),
 *  instanced across the land so the realm feels inhabited between cities. ── */
export function Villages3D() {
  const houses = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; rot: number; s: number }> = [];
    const N = IS_MOBILE ? 130 : 300;
    let tries = 0;
    while (out.length < N && tries < N * 14) {
      tries++;
      const [wx, wz] = pxToWorld(Math.random() * PX_W, Math.random() * PX_H);
      const y = sampleTerrainHeight(wx, wz);
      if (y < 0.05 || y > 0.30) continue;   // skip sea + steep mountain
      out.push({ x: wx, y, z: wz, rot: Math.random() * Math.PI * 2, s: 0.55 + Math.random() * 0.5 });
    }
    return out;
  }, []);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const roofRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!bodyRef.current || !roofRef.current) return;
    for (let i = 0; i < houses.length; i++) {
      const h = houses[i];
      dummy.position.set(h.x, h.y + 0.018 * h.s, h.z);
      dummy.rotation.y = h.rot; dummy.scale.setScalar(h.s);
      dummy.updateMatrix(); bodyRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(h.x, h.y + 0.05 * h.s, h.z);
      dummy.updateMatrix(); roofRef.current.setMatrixAt(i, dummy.matrix);
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    roofRef.current.instanceMatrix.needsUpdate = true;
  }, [houses, dummy]);
  if (houses.length === 0) return null;
  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, houses.length]} castShadow>
        <boxGeometry args={[0.045, 0.04, 0.055]} />
        <meshStandardMaterial color="#9a8462" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, houses.length]} castShadow>
        <coneGeometry args={[0.045, 0.03, 4]} />
        <meshStandardMaterial color="#6a5238" roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

/* ─── 地名 — named ranges, rivers and seas drawn on the map (RTK/TW style) ── */
const GEO_LABEL_STYLE: Record<string, { color: string; glyph: string; y: number }> = {
  mountain: { color: '#cdbb96', glyph: '⛰', y: 0.55 },
  river:    { color: '#9fd0e6', glyph: '〜', y: 0.18 },
  sea:      { color: '#8fc0dc', glyph: '🌊', y: 0.12 },
};
export function GeoLabels3D() {
  const lang = useLanguage();
  const labels = useMemo(() => GEO_LABELS.map((g) => {
    const [px, py] = geoToPixel(g.lon, g.lat);
    const [wx, wz] = pxToWorld(px, py);
    const st = GEO_LABEL_STYLE[g.kind];
    const y = g.kind === 'sea' ? st.y : sampleTerrainHeight(wx, wz) + st.y;
    return { ...g, label: pickName(g, lang), wx, wz, y, st };
  }), [lang]);
  return (
    <group>
      {labels.map((l, i) => (
        <Html key={i} position={[l.wx, l.y, l.wz]} center distanceFactor={26} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: l.st.color,
            fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
            fontSize: l.kind === 'mountain' ? '15px' : '14px',
            fontStyle: l.kind === 'river' ? 'italic' : 'normal',
            letterSpacing: l.kind === 'sea' ? '6px' : '3px',
            textShadow: '0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
            opacity: 0.78, whiteSpace: 'nowrap', userSelect: 'none',
          }}>{l.kind === 'mountain' ? `${l.st.glyph}${l.label}` : l.label}</div>
        </Html>
      ))}
    </group>
  );
}
