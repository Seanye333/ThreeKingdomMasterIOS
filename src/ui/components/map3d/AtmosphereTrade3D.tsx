/* 天穹與商旅 — sky dome, drifting clouds, city smoke/birds, event marks,
 * trade ships, dusk lights and caravans. Split out of StrategicMap3D.tsx
 * (2026-07, batch 5); pure mechanical move. */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from '../../../game/state/store';
import type { City, Port } from '../../../game/types';
import { cityPos, cityPixel } from '../../../game/data/cityGeo';
import { terrainRoute } from '../../../game/data/territories';
import { geoToPixel } from '../../../game/data/geography';
import { citySize } from '../../../game/systems/citySize';
import { IS_MOBILE, pxToWorld, sampleTerrainHeight, cityElevation, MAP_W, MAP_D } from './shared';

/* ─── 天穹 — a gradient sky dome + sun, the void above the horizon filled ──
 *  An inverted sphere parented to the camera so its edge is never reached;
 *  zenith blue → horizon haze (matched to the fog colour so land melts into
 *  sky). Shifts to a warm sunset at dusk. A bloom-haloed sun rides the
 *  sunlight direction. */
export function SkyDome({ top, horizon, sunPos: sunPosArr, celestialColor, moon, stars }: {
  top: string; horizon: string; sunPos: [number, number, number];
  celestialColor: string; moon: boolean; stars: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => { if (ref.current) ref.current.position.copy(camera.position); });
  const material = useMemo(() => {
    const topC = new THREE.Color(top);
    const bottom = new THREE.Color(horizon);
    return new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: topC }, bottom: { value: bottom }, exponent: { value: 0.7 } },
      vertexShader: `varying float vH; void main(){ vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 bottom; uniform float exponent; varying float vH;
        void main(){ float t = pow(max(vH,0.0), exponent); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }`,
    });
  }, [top, horizon]);
  const R = 1500;
  const sunDir = useMemo(() => new THREE.Vector3(...sunPosArr).normalize(), [sunPosArr]);
  const sunPos = sunDir.clone().multiplyScalar(R * 0.9);
  // 星空 — a deterministic field of stars on the upper inner dome, only mounted
  // at night. Pixel-sized points so they stay crisp at every zoom.
  const starGeom = useMemo(() => {
    const N = IS_MOBILE ? 220 : 520;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      const h2 = Math.abs(Math.sin(i * 78.233) * 12543.213) % 1;
      const theta = h1 * Math.PI * 2;
      const phi = Math.acos(0.12 + h2 * 0.82);     // bias toward the upper sky
      const r = R * 0.94;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <group ref={ref}>
      <mesh material={material}>
        <sphereGeometry args={[R, 32, 16]} />
      </mesh>
      {stars && (
        <points geometry={starGeom}>
          <pointsMaterial size={IS_MOBILE ? 1.6 : 2} sizeAttenuation={false} color="#e6ecff"
            transparent opacity={0.85} toneMapped={false} fog={false} depthWrite={false} />
        </points>
      )}
      {/* Sun (or moon) — a small bright core + a soft halo the bloom pass catches. */}
      <mesh position={sunPos}>
        <sphereGeometry args={[moon ? 26 : 34, 16, 12]} />
        <meshBasicMaterial color={celestialColor} toneMapped={false} fog={false} />
      </mesh>
      <mesh position={sunPos}>
        <sphereGeometry args={[moon ? 54 : 78, 16, 12]} />
        <meshBasicMaterial color={celestialColor} transparent opacity={moon ? 0.16 : 0.28} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ─── 雲影 — soft clouds drifting over the land, shadows in tow ───── */
export function DriftingClouds() {
  const ref = useRef<THREE.Group>(null);
  // Deterministic cloud field: position, scale, speed per cloud.
  const clouds = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x0: ((i * 137) % 100) / 100 * MAP_W - MAP_W / 2,
    z0: ((i * 71 + 23) % 100) / 100 * MAP_D - MAP_D / 2,
    s: 2.6 + ((i * 53) % 10) / 10 * 2.8,
    v: 0.12 + ((i * 31) % 10) / 10 * 0.1,
    puffs: [[0, 0, 1], [0.8, 0.25, 0.72], [-0.7, 0.18, 0.6]] as Array<[number, number, number]>,
  })), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((g, i) => {
      const c = clouds[i];
      // Drift east, wrap around the map edge.
      const span = MAP_W + 16;
      let x = c.x0 + t * c.v;
      x = ((x + span / 2) % span) - span / 2;
      g.position.x = x;
    });
  });
  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x0, 0, c.z0]}>
          {/* Soft white clouds drifting overhead. GROUND SHADOWS REMOVED on
              purpose — the flat shadow blots looked glued to the terrain. */}
          {c.puffs.map(([dx, dz, ps], j) => (
            <mesh key={j} position={[dx * c.s, 9 + j * 0.1, dz * c.s]} scale={[1, 0.3, 1]}>
              <sphereGeometry args={[c.s * 0.5 * ps, 10, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─── 炊煙 — every inhabited city breathes a thread of hearth-smoke ──────
 *  Instanced puffs rise, drift on the wind, swell and reset — the map reads
 *  as lived-in rather than a diorama of empty walls. */
export function CitySmoke3D({ cities }: { cities: Record<string, City> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  // One thin wisp per city — kept LOW and faint so dense city clusters (the
  // central plains) don't stack their smoke into a grey haze over the map.
  const cols = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; phase: number; speed: number }> = [];
    for (const city of Object.values(cities)) {
      const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      const baseY = cityElevation(wx, wz) + 0.3;
      const h = Math.abs(Math.sin(px * 7.7 + py * 3.1));
      out.push({ x: wx, y: baseY, z: wz, phase: h, speed: 0.1 + h * 0.06 });
    }
    return out;
  }, [cities]);
  const RISE = 0.45;
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion();
    const pos = new THREE.Vector3(); const scl = new THREE.Vector3();
    const t = clock.elapsedTime;
    cols.forEach((c, i) => {
      const prog = (t * c.speed + c.phase) % 1;
      pos.set(c.x + prog * 0.15, c.y + prog * RISE, c.z + prog * 0.08);
      const s = 0.04 + prog * 0.08;              // small wisp, swells slightly
      scl.set(s, s, s);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, cols.length)]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial color="#ccc4b8" transparent opacity={0.09} depthWrite={false} />
    </instancedMesh>
  );
}

/* ─── 飛鳥 — a few skeins of birds drift the high air, wings beating ───── */
export function Birds3D() {
  const flocks = useMemo(() => Array.from({ length: IS_MOBILE ? 2 : 4 }, (_, f) => ({
    z: ((f * 53 + 17) % 100) / 100 * MAP_D - MAP_D / 2,
    y: 7 + (f % 3) * 1.2,
    v: 0.5 + (f % 4) * 0.12,
    x0: ((f * 137) % 100) / 100 * MAP_W - MAP_W / 2,
    birds: Array.from({ length: 5 }, (_, b) => ({ dx: (b - 2) * 0.9, dz: Math.abs(b - 2) * 0.7, ph: b * 0.7 })),
  })), []);
  const refs = useRef<Array<THREE.Group | null>>([]);
  const wings = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flocks.forEach((fl, i) => {
      const g = refs.current[i];
      if (g) {
        const span = MAP_W + 12;
        let x = fl.x0 + t * fl.v;
        x = ((x + span / 2) % span) - span / 2;
        g.position.set(x, fl.y + Math.sin(t * 0.5 + i) * 0.4, fl.z);
      }
    });
    // Wing flap — shared phase per bird group.
    wings.current.forEach((w, i) => {
      if (w) w.rotation.z = Math.sin(t * 7 + i * 0.7) * 0.6;
    });
  });
  let wi = 0;
  return (
    <group>
      {flocks.map((fl, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          {fl.birds.map((b, j) => (
            <group key={j} position={[b.dx, 0, b.dz]} ref={(el) => { wings.current[wi++] = el; }}>
              <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.14, 0.012, 0.04]} /><meshBasicMaterial color="#22242a" /></mesh>
              <mesh position={[-0.07, 0, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.14, 0.012, 0.04]} /><meshBasicMaterial color="#22242a" /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─── 事件地標 — the season's calamities and windfalls, on the map ─────
   The report scrolls past once; the land remembers. Each city the tick
   touched (饑荒/瘟疫/豐收/民變/襲擾) wears a single-character chip until
   the next tick replaces the marks. Tap a chip to select the city. */
const EVENT_MARK_STYLE: Record<string, { ch: string; color: string; border: string }> = {
  harvest:     { ch: '豐', color: '#f0d98a', border: '#d4a84a' },
  famine:      { ch: '饑', color: '#e0b890', border: '#a07040' },
  flood:       { ch: '洪', color: '#9cc8e8', border: '#4a78a8' },
  plague:      { ch: '疫', color: '#d8a8e8', border: '#9060a8' },
  rebellion:   { ch: '亂', color: '#ff9080', border: '#b8584a' },
  'tribe-raid': { ch: '襲', color: '#ffb070', border: '#c87838' },
};

export function EventMarks3D({ cities, hidePx, visibleCityIds, onPick }: {
  cities: Record<string, City>;
  hidePx: { x: number; y: number } | null;
  /** 戰爭迷霧 — when set, only marks on in-view cities show. */
  visibleCityIds?: Set<string> | null;
  onPick: (cityId: string) => void;
}) {
  const marks = useGameStore((s) => s.cityEventMarks ?? EMPTY_EVENT_MARKS);
  const byCity = useMemo(() => {
    const m = new Map<string, Array<{ kind: string; text: string }>>();
    for (const mk of marks) {
      if (visibleCityIds && !visibleCityIds.has(mk.cityId)) continue;
      if (!m.has(mk.cityId)) m.set(mk.cityId, []);
      m.get(mk.cityId)!.push(mk);
    }
    return m;
  }, [marks, visibleCityIds]);
  return (
    <group>
      {[...byCity.entries()].map(([cityId, list]) => {
        const city = cities[cityId];
        if (!city) return null;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
        if (hidePx && Math.hypot(px - hidePx.x, py - hidePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html key={cityId} position={[wx + 0.45, y + 0.62, wz]} center distanceFactor={9} zIndexRange={[36, 26]}>
            <div style={{ display: 'flex', gap: 3 }}>
              {list.map((mk, i) => {
                const st = EVENT_MARK_STYLE[mk.kind];
                if (!st) return null;
                return (
                  <div
                    key={i}
                    onClick={(e) => { e.stopPropagation(); onPick(cityId); }}
                    title={mk.text}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(20,14,8,0.92)', border: `1px solid ${st.border}`,
                      color: st.color, fontFamily: 'var(--tkm-font-body)', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                    }}
                  >{st.ch}</div>
                );
              })}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
const EMPTY_EVENT_MARKS: Array<{ cityId: string; kind: string; text: string }> = [];
export const EMPTY_THREATS: Record<string, { color: string; label: string }> = {};
export const FOG_OVERLAY = { color: '#4a4a48', label: '?' };
export const EMPTY_REVEALS: Record<string, number> = {};

/* ─── 漕運商船 — junks plying the busiest sea and river lanes ──────────
   The naval counterpart of the ox-cart caravans: each port-to-port lane
   (the same straight edges naval marches sail) gets a trade junk if it's
   among the realm's busiest, ranked by the linked cities' commerce. The
   junks ping-pong, bob and heel a little; downed ports lose their trade. */
const SHIP_COUNT = IS_MOBILE ? 3 : 7;

export function TradeShips3D({ ports, cities }: {
  ports: Record<string, Port>;
  cities: Record<string, City>;
}) {
  const routes = useMemo(() => {
    const seen = new Set<string>();
    const pairs: Array<{ a: Port; b: Port; score: number }> = [];
    for (const p of Object.values(ports)) {
      if (p.hp <= 0) continue;
      for (const qid of p.connectedPortIds) {
        const q = ports[qid];
        if (!q || q.hp <= 0) continue;
        const key = p.id < qid ? p.id + qid : qid + p.id;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({
          a: p, b: q,
          score: (cities[p.linkedCityId]?.commerce ?? 0) + (cities[q.linkedCityId]?.commerce ?? 0),
        });
      }
    }
    pairs.sort((x, y) => y.score - x.score);
    const out: Array<{ ax: number; az: number; bx: number; bz: number; total: number; speed: number; phase: number }> = [];
    for (const { a, b } of pairs.slice(0, SHIP_COUNT)) {
      const [ax, az] = pxToWorld(...geoToPixel(a.coords.lon, a.coords.lat));
      const [bx, bz] = pxToWorld(...geoToPixel(b.coords.lon, b.coords.lat));
      const total = Math.hypot(bx - ax, bz - az);
      if (total < 0.8) continue;
      out.push({
        ax, az, bx, bz, total,
        speed: 0.18 + ((out.length * 29) % 10) * 0.012,
        phase: ((out.length * 113) % 100) / 100,
      });
    }
    return out;
  }, [ports, cities]);

  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      const d2 = ((t * r.speed) / r.total + r.phase) % 2;
      const back = d2 > 1;
      const f = back ? 2 - d2 : d2;
      g.position.set(
        r.ax + (r.bx - r.ax) * f,
        0.045 + Math.sin(t * 1.7 + i * 2.1) * 0.012,
        r.az + (r.bz - r.az) * f,
      );
      g.rotation.y = Math.atan2((r.bx - r.ax) * (back ? -1 : 1), (r.bz - r.az) * (back ? -1 : 1));
      g.rotation.z = Math.sin(t * 1.1 + i) * 0.05; // gentle heel
    });
  });

  return (
    <group>
      {routes.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          {/* 船身 */}
          <mesh position={[0, 0.025, 0]} castShadow>
            <boxGeometry args={[0.11, 0.05, 0.3]} />
            <meshStandardMaterial color="#6a4a2c" roughness={0.85} />
          </mesh>
          {/* 艉樓 */}
          <mesh position={[0, 0.062, -0.1]}>
            <boxGeometry args={[0.08, 0.035, 0.08]} />
            <meshStandardMaterial color="#7d5a36" roughness={0.85} />
          </mesh>
          {/* 桅杆 */}
          <mesh position={[0, 0.14, 0.02]}>
            <cylinderGeometry args={[0.006, 0.008, 0.2, 6]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} />
          </mesh>
          {/* 帆 */}
          <mesh position={[0, 0.15, 0.02]}>
            <planeGeometry args={[0.15, 0.16]} />
            <meshStandardMaterial color="#d8c9a0" roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 入暮燈火 — at dusk every settlement lights its lamps ─────────────
   Pairs with 晝夜隨旬: the lower half-month's warm twilight gets answered
   by window-lights scattered around each city token, more of them the
   bigger the city. One InstancedMesh of over-bright quads so the desktop
   bloom pass gives every lamp a halo; positions are deterministic per
   city, so the same windows light up every evening. */
const LAMPS_BY_TIER: Record<string, number> = {
  hamlet: 3, town: 5, city: 8, large: 12, capital: 16,
};

export function DuskCityLights({ cities }: { cities: Record<string, City> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const lamps = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; s: number }> = [];
    for (const city of Object.values(cities)) {
      const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      const baseY = cityElevation(wx, wz);
      const full = LAMPS_BY_TIER[citySize(city).id] ?? 4;
      const n = IS_MOBILE ? Math.ceil(full / 2) : full; // phones carry half the lamps
      for (let i = 0; i < n; i++) {
        // Deterministic scatter — same hash trick the quilt tint uses.
        const h1 = Math.abs(Math.sin(px * 12.9898 + i * 78.233));
        const h2 = Math.abs(Math.sin(py * 39.346 + i * 11.135));
        const ang = h1 * Math.PI * 2;
        const rad = 0.12 + h2 * 0.4;
        out.push({
          x: wx + Math.cos(ang) * rad,
          y: baseY + 0.08 + h1 * 0.22,
          z: wz + Math.sin(ang) * rad,
          s: 0.022 + h2 * 0.02,
        });
      }
    }
    return out;
  }, [cities]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    lamps.forEach((l, i) => {
      pos.set(l.x, l.y, l.z);
      scl.setScalar(l.s);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [lamps]);

  // A slow communal flicker — oil lamps, not LEDs.
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.86 + Math.sin(clock.elapsedTime * 2.3) * 0.1;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, lamps.length)]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      {/* Over-bright so the bloom pass halos each lamp — warm hearth-glow. */}
      <meshBasicMaterial ref={matRef} color={new THREE.Color(3.0, 2.0, 0.85)} transparent opacity={0.9} toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── 商隊 — trade carts trundling the busiest roads of the realm ──────
   Ambient life: ox-carts ping-pong along the REAL march routes between
   adjacent same-owner cities (internal trade), the busiest first — pair
   count scales with the cities' combined commerce. Pure flavour; carts
   carry no state and answer to no clicks. */
const CARAVAN_COUNT = IS_MOBILE ? 4 : 12;

export function Caravans3D({ cities }: { cities: Record<string, City> }) {
  const tradeRoutes = useGameStore((s) => s.tradeRoutes);
  const routes = useMemo(() => {
    const seen = new Set<string>();
    const pairs: Array<{ a: City; b: City; score: number }> = [];
    // 名產商路優先 — carts ride the LIVE specialty trade routes first, so the
    // ox-carts you see are the goods actually moving (and earning) this season.
    for (const r of tradeRoutes) {
      const a = cities[r.cityAId]; const b = cities[r.cityBId];
      if (!a || !b) continue;
      const key = a.id < b.id ? a.id + b.id : b.id + a.id;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b, score: 100000 + r.baseIncome });   // always ahead of filler
    }
    // Top up with the busiest internal pairs — adjacent same-owner cities.
    const filler: Array<{ a: City; b: City; score: number }> = [];
    for (const a of Object.values(cities)) {
      for (const adjId of a.adjacentCityIds ?? []) {
        const b = cities[adjId];
        if (!b || b.ownerForceId !== a.ownerForceId) continue;
        const key = a.id < adjId ? a.id + adjId : adjId + a.id;
        if (seen.has(key)) continue;
        seen.add(key);
        filler.push({ a, b, score: a.commerce + b.commerce });
      }
    }
    filler.sort((x, y) => y.score - x.score);
    pairs.push(...filler);
    const out: Array<{ pts: THREE.Vector3[]; cum: number[]; total: number; speed: number; phase: number }> = [];
    for (const { a, b } of pairs.slice(0, CARAVAN_COUNT)) {
      const pa = cityPos(a);
      const pb = cityPos(b);
      const route = terrainRoute(pa.x, pa.y, pb.x, pb.y);
      const pts = route.map((p) => {
        const [wx, wz] = pxToWorld(p.x, p.y);
        return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.045, wz);
      });
      if (pts.length < 2) continue;
      const cum = [0];
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
      const total = cum[cum.length - 1];
      if (total < 0.6) continue; // neighbours practically inside each other
      out.push({
        pts, cum, total,
        speed: 0.22 + ((out.length * 37) % 10) * 0.012,
        phase: ((out.length * 131) % 100) / 100,
      });
    }
    return out;
  }, [cities, tradeRoutes]);

  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      // Ping-pong along the route — out with goods, back with silver.
      const d2 = ((t * r.speed) / r.total + r.phase) % 2;
      const back = d2 > 1;
      const s = (back ? 2 - d2 : d2) * r.total;
      let k = 1;
      while (k < r.cum.length - 1 && r.cum[k] < s) k++;
      const seg = r.cum[k] - r.cum[k - 1] || 1;
      const f = (s - r.cum[k - 1]) / seg;
      const p0 = r.pts[k - 1];
      const p1 = r.pts[k];
      g.position.lerpVectors(p0, p1, f);
      g.rotation.y = Math.atan2((p1.x - p0.x) * (back ? -1 : 1), (p1.z - p0.z) * (back ? -1 : 1));
    });
  });

  return (
    <group>
      {routes.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} scale={0.8}>
          {/* 牛 — the ox out front */}
          <mesh position={[0, 0.045, 0.1]} castShadow>
            <boxGeometry args={[0.05, 0.055, 0.1]} />
            <meshStandardMaterial color="#5d4226" roughness={0.9} />
          </mesh>
          {/* 車板 */}
          <mesh position={[0, 0.05, -0.04]} castShadow>
            <boxGeometry args={[0.09, 0.03, 0.15]} />
            <meshStandardMaterial color="#8a6a40" roughness={0.85} />
          </mesh>
          {/* 篷布 */}
          <mesh position={[0, 0.09, -0.05]} castShadow>
            <boxGeometry args={[0.08, 0.05, 0.11]} />
            <meshStandardMaterial color="#cfc09a" roughness={0.95} />
          </mesh>
          {/* 車輪 */}
          {[-0.052, 0.052].map((x) => (
            <mesh key={x} position={[x, 0.03, -0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.012, 10]} />
              <meshStandardMaterial color="#3a2a18" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

