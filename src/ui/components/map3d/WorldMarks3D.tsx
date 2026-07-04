/* World-event markers on the strategic 3D map — battle pulses, queued
 * battles, live field-clash melees, beacons, burning cities, march/conquest/
 * loss flourishes and espionage couriers. Extracted verbatim from
 * StrategicMap3D.tsx (pure mechanical split). */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../game/state/store';
import { playSfx } from '../../../game/systems/sound';
import { cityPixel, cityPos } from '../../../game/data/cityGeo';
import { terrainRoute } from '../../../game/data/territories';
import type { City } from '../../../game/types';
import { useLanguage, pickName } from '../../i18n';
import { IS_MOBILE, ARMY_TOKEN_SCALE, pxToWorld, sampleTerrainHeight, cityElevation } from './shared';

const DEPART_SOLDIERS = Array.from({ length: 9 }, (_, i) => i);

/** 出征演出 — a one-off flourish at the origin city when you dispatch an army:
 *  the colours are raised, a file of soldiers streams out of the gate, and dust
 *  rings out. Self-times over ~2.6s; the parent unmounts it by key. */
function DepartureAnim({ x, y, z, color, hostile }: {
  x: number; y: number; z: number; color: string; hostile: boolean;
}) {
  const start = useRef<number | null>(null);
  const flagRef = useRef<THREE.Group>(null);
  const flagPlaneRef = useRef<THREE.Mesh>(null);
  const soldiersRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const e = clock.elapsedTime - start.current;
    // Raise the colours: the standard grows up over 0.7s, then the flag flutters.
    if (flagRef.current) {
      flagRef.current.scale.y = Math.min(1, e / 0.7);
    }
    if (flagPlaneRef.current) {
      flagPlaneRef.current.rotation.z = e > 0.7 ? Math.sin((e - 0.7) * 5) * 0.2 : 0;
    }
    // A file of soldiers streams out of the gate, then thins as they form column.
    if (soldiersRef.current) {
      soldiersRef.current.children.forEach((c, i) => {
        const a = (i / DEPART_SOLDIERS.length) * Math.PI * 2;
        const tt = Math.max(0, Math.min(1, (e - 0.25 - i * 0.04) / 1.5));
        const r = tt * 0.85;
        c.position.set(Math.cos(a) * r, 0.05 + Math.sin(tt * Math.PI) * 0.06, Math.sin(a) * r);
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (m) m.opacity = tt <= 0 ? 0 : 1 - Math.max(0, (e - 1.7) / 0.9);
      });
    }
    // Dust ring expands and fades.
    if (dustRef.current) {
      const dt = Math.min(1, e / 1.3);
      dustRef.current.scale.setScalar(0.3 + dt * 1.2);
      (dustRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - dt) * 0.4;
    }
  });
  return (
    <group position={[x, y, z]} scale={ARMY_TOKEN_SCALE}>
      <group ref={flagRef}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 5]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
        <mesh ref={flagPlaneRef} position={[0.1, 0.43, 0]}>
          <planeGeometry args={[0.2, 0.13]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>
      <group ref={soldiersRef}>
        {DEPART_SOLDIERS.map((i) => (
          <mesh key={i}>
            <capsuleGeometry args={[0.018, 0.05, 3, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0} />
          </mesh>
        ))}
      </group>
      <mesh ref={dustRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.52, 24]} />
        <meshBasicMaterial color={hostile ? '#caa46a' : '#b8c0c8'} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Watches the dispatch signal and plays a departure flourish at the origin
 *  city, then clears itself after ~2.6s. */
export function DepartureFlourish3D() {
  const dep = useGameStore((s) => s.marchDeparture);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const [active, setActive] = useState<{ key: number; x: number; y: number; z: number; color: string; hostile: boolean } | null>(null);
  useEffect(() => {
    if (!dep) return;
    const city = cities[dep.cityId];
    if (!city) return;
    const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
    const [wx, wz] = pxToWorld(px, py);
    const wy = sampleTerrainHeight(wx, wz) + 0.04;
    const color = (city.ownerForceId && forces[city.ownerForceId]?.color) || '#e6c473';
    setActive({ key: dep.key, x: wx, y: wy, z: wz, color, hostile: dep.hostile });
    const id = window.setTimeout(() => setActive(null), 2600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep?.key]);
  if (!active) return null;
  return <DepartureAnim key={active.key} x={active.x} y={active.y} z={active.z} color={active.color} hostile={active.hostile} />;
}

const CONQUEST_MOTES = Array.from({ length: 12 }, (_, i) => i);

/** 克城演出 — a flag-planting flourish when the player takes a city: the new
 *  colours are raised, a gold ring rings out, and victory motes rise. ~2.6s. */
function ConquestAnim({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  const start = useRef<number | null>(null);
  const flagRef = useRef<THREE.Group>(null);
  const flagPlaneRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const motesRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const e = clock.elapsedTime - start.current;
    if (flagRef.current) flagRef.current.scale.y = Math.min(1, e / 0.6);
    if (flagPlaneRef.current) flagPlaneRef.current.rotation.z = e > 0.6 ? Math.sin((e - 0.6) * 5) * 0.2 : 0;
    if (ringRef.current) {
      const dt = Math.min(1, e / 1.4);
      ringRef.current.scale.setScalar(0.3 + dt * 1.5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - dt) * 0.5;
    }
    if (motesRef.current) {
      motesRef.current.children.forEach((c, i) => {
        const a = (i / CONQUEST_MOTES.length) * Math.PI * 2;
        const tt = Math.max(0, Math.min(1, (e - 0.2 - i * 0.03) / 1.8));
        c.position.set(Math.cos(a) * 0.25, tt * 1.1, Math.sin(a) * 0.25);
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (m) m.opacity = tt <= 0 ? 0 : (1 - tt);
      });
    }
  });
  return (
    <group position={[x, y, z]} scale={ARMY_TOKEN_SCALE}>
      <group ref={flagRef}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.6, 5]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f0d878" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh ref={flagPlaneRef} position={[0.11, 0.5, 0]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.55, 28]} />
        <meshBasicMaterial color="#f0d070" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={motesRef}>
        {CONQUEST_MOTES.map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial color={i % 2 ? '#fff0c0' : '#f0d070'} transparent opacity={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Watches the conquest signal and plays a flag-planting flourish at the taken
 *  city, then clears itself after ~2.6s. */
export function ConquestFlourish3D() {
  const cap = useGameStore((s) => s.cityCaptured);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const [active, setActive] = useState<{ key: number; x: number; y: number; z: number; color: string } | null>(null);
  useEffect(() => {
    if (!cap) return;
    const city = cities[cap.cityId];
    if (!city) return;
    const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
    const [wx, wz] = pxToWorld(px, py);
    const wy = sampleTerrainHeight(wx, wz) + 0.04;
    const color = (city.ownerForceId && forces[city.ownerForceId]?.color) || '#e6c473';
    setActive({ key: cap.key, x: wx, y: wy, z: wz, color });
    const id = window.setTimeout(() => setActive(null), 2600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap?.key]);
  if (!active) return null;
  return <ConquestAnim key={active.key} x={active.x} y={active.y} z={active.z} color={active.color} />;
}

/** 失守演出 — a somber beat when the player loses a city: their colours topple
 *  from the wall and dark smoke rises. ~2.6s. */
function LossAnim({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  const start = useRef<number | null>(null);
  const flagRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const e = clock.elapsedTime - start.current;
    if (flagRef.current) {
      // The standard holds a beat, then topples sideways from its base.
      const fall = Math.max(0, Math.min(1, (e - 0.35) / 1.0));
      const eased = fall * fall;
      flagRef.current.rotation.z = -eased * (Math.PI / 2 + 0.15);
    }
    if (smokeRef.current) {
      const dt = Math.min(1, e / 1.7);
      smokeRef.current.scale.setScalar(0.3 + dt * 1.4);
      smokeRef.current.position.y = 0.12 + dt * 0.5;
      (smokeRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - dt) * 0.45;
    }
  });
  return (
    <group position={[x, y, z]} scale={ARMY_TOKEN_SCALE}>
      <group ref={flagRef}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.6, 5]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
        <mesh position={[0.11, 0.5, 0]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </group>
      <mesh ref={smokeRef} position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#601410" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Watches the loss signal and plays the toppling-colours beat (in the player's
 *  own colour, since they are the ones who fell), then clears after ~2.6s. */
export function LossFlourish3D() {
  const lost = useGameStore((s) => s.cityLost);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [active, setActive] = useState<{ key: number; x: number; y: number; z: number; color: string } | null>(null);
  useEffect(() => {
    if (!lost) return;
    const city = cities[lost.cityId];
    if (!city) return;
    const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
    const [wx, wz] = pxToWorld(px, py);
    const wy = sampleTerrainHeight(wx, wz) + 0.04;
    const color = (playerForceId && forces[playerForceId]?.color) || '#b8442e';
    setActive({ key: lost.key, x: wx, y: wy, z: wz, color });
    const id = window.setTimeout(() => setActive(null), 2600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lost?.key]);
  if (!active) return null;
  return <LossAnim key={active.key} x={active.x} y={active.y} z={active.z} color={active.color} />;
}

/** Crossed-sabre / broken-stockade markers at recent field-battle sites. */
/** An expanding ground ring marking a fresh battle site — the world reacting to
 *  a fight that just happened (③ causal flow). Loops, with a per-site phase. */
export function BattlePulseRing3D({ wx, y, wz, color, phase }: {
  wx: number; y: number; wz: number; color: string; phase: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = ((state.clock.elapsedTime + phase) % 1.7) / 1.7; // 0..1 loop
    const s = 0.12 + t * 0.55;
    if (ref.current) ref.current.scale.set(s, s, s);
    if (mat.current) mat.current.opacity = (1 - t) * 0.55;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[wx, y + 0.03, wz]}>
      <ringGeometry args={[0.7, 0.9, 28]} />
      <meshBasicMaterial ref={mat} color={color} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── 焚城 — burningCities has been tracked in state since forever but never
   drawn: a sacked/burning city now shows licking flames and a leaning smoke
   column for as long as the fire lasts. */
export function BurningCities3D() {
  const burning = useGameStore((s) => s.burningCities);
  const cities = useGameStore((s) => s.cities);
  if (!burning || burning.length === 0) return null;
  return (
    <group>
      {burning.map(({ cityId }) => {
        const c = cities[cityId];
        if (!c) return null;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return (
          <group key={cityId} position={[wx, wy, wz]}>
            {[[-0.22, 0.1], [0.18, -0.15], [0, 0.22]].map(([dx, dz], i) => (
              <BeaconFlame3D key={i} wx={dx} wy={0} wz={dz as number} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ─── 烽火預警 — beacons actually light ─────────────────────────────────
   A player city with a built 烽火台 (beacon slot) IGNITES when a hostile
   column is marching on it — and the alarm carries one hop to neighbouring
   player beacons (the chain the towers were built for). Flame + smoke on
   the map; the DOM warning chip lives in the outer shell. */
export function computeBeaconAlerts(
  cities: Record<string, City>,
  armies: Record<string, import('../../../game/types').Army>,
  playerForceId: string | null,
): { threatened: Set<string>; lit: Set<string> } {
  const threatened = new Set<string>();
  if (!playerForceId) return { threatened, lit: new Set() };
  for (const a of Object.values(armies)) {
    if (a.forceId === playerForceId) continue;
    const tgt = cities[a.targetCityId];
    if (tgt?.ownerForceId === playerForceId) threatened.add(tgt.id);
  }
  const hasBeacon = (c: City) => (c.buildSlots ?? []).some((sl) => sl.buildingId === 'beacon');
  const lit = new Set<string>();
  for (const id of threatened) {
    const c = cities[id];
    if (!c) continue;
    if (hasBeacon(c)) lit.add(id);
    // The alarm relays one hop to neighbouring player beacons.
    for (const adj of c.adjacentCityIds ?? []) {
      const n = cities[adj];
      if (n?.ownerForceId === playerForceId && hasBeacon(n)) lit.add(adj);
    }
  }
  return { threatened, lit };
}

function BeaconFlame3D({ wx, wy, wz }: { wx: number; wy: number; wz: number }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 9) * 0.3;
      flameRef.current.scale.x = 1 + Math.sin(t * 7 + 1) * 0.15;
    }
    if (smokeRef.current) {
      smokeRef.current.position.y = 0.55 + ((t * 0.25) % 0.5);
      (smokeRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - ((t * 0.25) % 0.5) * 0.6;
    }
  });
  return (
    <group position={[wx, wy, wz]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.32, 5]} />
        <meshStandardMaterial color="#4a3a26" roughness={0.9} />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.07, 0.22, 6]} />
        <meshBasicMaterial color="#ff8030" />
      </mesh>
      <mesh ref={smokeRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#5a5a5a" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.45, 0]} color="#ff7020" intensity={1.4} distance={2.4} decay={2} />
    </group>
  );
}

/** 長圍 — a dashed amber noose pulses around every invested city, so a
 *  siege-in-progress reads from across the map. */
export function SiegeRings3D() {
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const cities = useGameStore((s) => s.cities);
  const ringRef = useRef<THREE.Group>(null);
  const besieged = useMemo(() => {
    const out: string[] = [];
    for (const cmd of Object.values(pendingCommands)) {
      if (cmd.type === 'march' && cmd.holding && cmd.besieging && cities[cmd.besieging]) out.push(cmd.besieging);
    }
    return [...new Set(out)];
  }, [pendingCommands, cities]);
  useFrame(({ clock }) => {
    const g = ringRef.current;
    if (!g) return;
    const k = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.06;
    g.scale.set(k, 1, k);
  });
  if (besieged.length === 0) return null;
  return (
    <group ref={ringRef}>
      {besieged.map((id) => {
        const c = cities[id];
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return (
          <group key={id} position={[wx, wy + 0.06, wz]}>
            {/* Dashed noose — 12 short arc segments */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7]} rotation={[-Math.PI / 2, 0, -a]}>
                  <planeGeometry args={[0.5, 0.14]} />
                  <meshBasicMaterial color="#e8a040" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/** 烽火連天 — when a threatened city has a beacon, the alarm relays
 *  station-to-station along the shortest friendly path to the capital:
 *  every beacon-equipped city on the way lights, capital always lights.
 *  Returns one chain (ordered city ids) per beaconed threatened city. */
export function computeBeaconChains(
  cities: Record<string, City>,
  armies: Record<string, import('../../../game/types').Army>,
  playerForceId: string | null,
  capitalId: string | null,
): string[][] {
  if (!playerForceId || !capitalId) return [];
  const { threatened } = computeBeaconAlerts(cities, armies, playerForceId);
  const hasBeacon = (c: City | undefined) => !!c && (c.buildSlots ?? []).some((sl) => sl.buildingId === 'beacon');
  const chains: string[][] = [];
  for (const origin of threatened) {
    if (!hasBeacon(cities[origin]) || origin === capitalId) continue;
    // BFS through player-owned cities to the capital.
    const parent: Map<string, string | null> = new Map([[origin, null]]);
    const queue: string[] = [origin];
    let found = false;
    while (queue.length && !found) {
      const cur = queue.shift()!;
      for (const adj of cities[cur]?.adjacentCityIds ?? []) {
        if (parent.has(adj)) continue;
        const n = cities[adj];
        if (!n || n.ownerForceId !== playerForceId) continue;
        parent.set(adj, cur);
        if (adj === capitalId) { found = true; break; }
        queue.push(adj);
      }
    }
    if (!found) continue;
    const path: string[] = [];
    let walk: string | null = capitalId;
    while (walk) { path.push(walk); walk = parent.get(walk) ?? null; }
    path.reverse(); // origin → capital
    // Only the beacon stations (and the capital itself) carry the fire.
    const chain = path.filter((id, i) => i === 0 || id === capitalId || hasBeacon(cities[id]));
    if (chain.length >= 2) chains.push(chain);
  }
  return chains;
}

/** One relay: flames appear station by station, ~0.6s apart, then burn on. */
function BeaconChainFlames({ chain, cities }: { chain: string[]; cities: Record<string, City> }) {
  const startRef = useRef<number | null>(null);
  const [litCount, setLitCount] = useState(1);
  useEffect(() => { playSfx('quake'); }, []); // 烽火起 — the alarm rolls out once
  useFrame(({ clock }) => {
    if (startRef.current == null) startRef.current = clock.elapsedTime;
    const n = Math.min(chain.length, 1 + Math.floor((clock.elapsedTime - startRef.current) / 0.6));
    if (n !== litCount) setLitCount(n);
  });
  return (
    <group>
      {chain.slice(0, litCount).map((id) => {
        const c = cities[id];
        if (!c) return null;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return <BeaconFlame3D key={id} wx={wx + 0.45} wy={wy} wz={wz - 0.45} />;
      })}
    </group>
  );
}

export function BeaconAlerts3D() {
  const cities = useGameStore((s) => s.cities);
  const armies = useGameStore((s) => s.armies);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const capitalId = useGameStore((s) => (s.playerForceId ? s.forces[s.playerForceId]?.capitalCityId ?? null : null));
  const { lit } = useMemo(
    () => computeBeaconAlerts(cities, armies, playerForceId),
    [cities, armies, playerForceId],
  );
  // 烽火連天 — beaconed origins relay the alarm all the way home.
  const chains = useMemo(
    () => computeBeaconChains(cities, armies, playerForceId, capitalId),
    [cities, armies, playerForceId, capitalId],
  );
  const chained = useMemo(() => new Set(chains.flat()), [chains]);
  if (lit.size === 0 && chains.length === 0) return null;
  return (
    <group>
      {[...lit].filter((id) => !chained.has(id)).map((id) => {
        const c = cities[id];
        if (!c) return null;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const wy = cityElevation(wx, wz);
        return <BeaconFlame3D key={id} wx={wx + 0.45} wy={wy} wz={wz - 0.45} />;
      })}
      {chains.map((chain) => (
        <BeaconChainFlames key={`chain-${chain[0]}`} chain={chain} cities={cities} />
      ))}
    </group>
  );
}

/** 待戰 — battles queued for this season (AI clashes / siege defences not yet
 *  fought) pulse red at their sites so you can see what's coming before each
 *  one ignites. */
export function QueuedBattles3D() {
  const fieldQ = useGameStore((s) => s.pendingFieldBattleQueue);
  const siegeQ = useGameStore((s) => s.pendingSiegeDefenseQueue);
  const armies = useGameStore((s) => s.armies);
  const cities = useGameStore((s) => s.cities);
  const sites: Array<{ x: number; y: number; zh: string }> = [
    // Field clashes erupt at the midpoint between the two armies.
    ...(fieldQ ?? []).flatMap((q) => {
      const a = armies[q.playerArmyId], b = armies[q.enemyArmyId];
      return a && b ? [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, zh: '野戰待發' }] : [];
    }),
    ...(siegeQ ?? []).flatMap((q) => {
      const c = cities[q.targetCityId];
      return c ? [{ ...cityPos(c), zh: '守城待戰' }] : [];
    }),
  ];
  if (sites.length === 0) return null;
  return (
    <group>
      {sites.map((s, i) => {
        const [wx, wz] = pxToWorld(s.x, s.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        return (
          <group key={i}>
            <BattlePulseRing3D wx={wx} y={y} wz={wz} color="#e0552a" phase={i * 0.31} />
            <Html position={[wx, y + 0.7, wz]} center distanceFactor={10} zIndexRange={[45, 35]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40, 14, 8, 0.88)', border: '1px solid #e0552a', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>⚔ {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/** 真日級遭遇 — while the day-flow plays, a fired first-contact shows a
 *  pulsing ⚔ at the meeting point (the pair is engaged; resolution lands
 *  the actual clash at commit). Transient with the flow. */
export function DayEncounterMarks3D() {
  const dayFlow = useGameStore((s) => s.dayFlow);
  const fired = (dayFlow?.encounters ?? []).filter((e) => e.fired);
  const landed = (dayFlow?.arrivals ?? []).filter((a) => a.fired);
  if (fired.length === 0 && landed.length === 0) return null;
  return (
    <group>
      {/* 兵臨之日 — fired arrivals: own assault gold, incoming host red. */}
      {landed.map((a, i) => {
        const [wx, wz] = pxToWorld(a.x, a.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        const hot = a.kind === 'incoming';
        const tint = hot ? '#e0552a' : '#d4a84a';
        return (
          <group key={`arr-${a.id}`}>
            <BattlePulseRing3D wx={wx} y={y} wz={wz} color={tint} phase={0.5 + i * 0.29} />
            <Html position={[wx, y + 0.7, wz]} center distanceFactor={10} zIndexRange={[45, 35]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: hot ? 'rgba(40, 14, 8, 0.88)' : 'rgba(30, 22, 8, 0.88)',
                border: `1px solid ${tint}`, borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                color: hot ? '#f0b0a0' : '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>{hot ? '🔥' : a.kind === 'assault' ? '⛨' : '🏕'} {a.zh}</div>
            </Html>
          </group>
        );
      })}
      {fired.map((e, i) => {
        const [wx, wz] = pxToWorld(e.x, e.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        return (
          <group key={`${e.aId}-${e.bId}`}>
            <BattlePulseRing3D wx={wx} y={y} wz={wz} color="#e0552a" phase={i * 0.31} />
            <Html position={[wx, y + 0.7, wz]} center distanceFactor={10} zIndexRange={[45, 35]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40, 14, 8, 0.88)', border: '1px solid #e0552a', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                color: '#f0b0a0', whiteSpace: 'nowrap', letterSpacing: '1px',
              }}>⚔ {e.aZh} × {e.bZh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function FieldBattleMarks3D({ marks }: {
  marks: Array<{ x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number }>;
}) {
  if (!marks || marks.length === 0) return null;
  return (
    <group>
      {/* Fresh sites (this season) pulse — "fought here just now". */}
      {marks.filter((m) => m.seasonsLeft >= 2).map((m, i) => {
        const [wx, wz] = pxToWorld(m.x, m.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        const color = m.kind === 'ambush' ? '#e0a83a' : m.kind === 'camp' ? '#e0552a' : '#d4a84a';
        return <BattlePulseRing3D key={`pulse-${i}`} wx={wx} y={y} wz={wz} color={color} phase={i * 0.37} />;
      })}
      {marks.map((m, i) => {
        const [wx, wz] = pxToWorld(m.x, m.y);
        const y = sampleTerrainHeight(wx, wz) + 0.06;
        const fade = Math.min(1, m.seasonsLeft / 2);
        const color = m.kind === 'ambush' ? '#e08a2a' : m.kind === 'camp' ? '#c43a2a' : '#9aa6b4';
        if (m.kind === 'camp') {
          // Broken stockade — a few leaning snapped stakes.
          return (
            <group key={i} position={[wx, y, wz]}>
              {[[-0.1, 0.3], [0.05, -0.25], [0.14, 0.5]].map(([dx, rot], k) => (
                <mesh key={k} position={[dx, 0.08, 0]} rotation={[0, 0, rot]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.16, 4]} />
                  <meshStandardMaterial color="#6b4f2a" transparent opacity={0.9 * fade} />
                </mesh>
              ))}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <circleGeometry args={[0.14, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.4 * fade} />
              </mesh>
            </group>
          );
        }
        // Crossed sabres — two thin crossed bars lying on the ground.
        return (
          <group key={i} position={[wx, y, wz]} rotation={[-Math.PI / 2, 0, 0]}>
            {[Math.PI / 4, -Math.PI / 4].map((rot, k) => (
              <mesh key={k} rotation={[0, 0, rot]}>
                <boxGeometry args={[0.26, 0.025, 0.006]} />
                <meshBasicMaterial color={color} transparent opacity={0.85 * fade} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ─── 野戰混戰 — a brief LIVE melee at a fresh clash site (③ causal flow):
 *  two warbands charge together, trade blows, some fall, the loser routs,
 *  then it fades to the static crossed-sabre mark. Plays once on mount, so a
 *  battle you didn't command no longer resolves into a mere doodle. ── */
const CLASH_DURATION = 4.6;   // seconds of brawl before it settles to the mark
const CLASH_PER_SIDE = 6;
const CLASH_A = '#3a7dd9';    // the same blue/red the battle board uses per side
const CLASH_B = '#b8442e';

/** Deterministic 0..1 from site coords + index — stable across the re-renders
 *  the marks array triggers each season, so the brawl never re-rolls midway. */
function clashHash(x: number, y: number, i: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + i * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

type ClashMark = {
  x: number; y: number; kind: 'ambush' | 'camp' | 'clash'; seasonsLeft: number;
  aColor?: string; bColor?: string; winner?: -1 | 1; winName?: string;
  aTroops?: number; bTroops?: number;
};

export function FieldClashMelee3D({ marks }: { marks: ClashMark[] }) {
  // Every fresh battle site (this season) replays as a live brawl — clash,
  // ambush and stormed-camp alike.
  const fresh = marks.filter((m) => m.seasonsLeft >= 2);
  if (fresh.length === 0) return null;
  return <group>{fresh.map((m) => <ClashSite key={`${m.x},${m.y}`} m={m} />)}</group>;
}

/* 箭雨 — both sides loose volleys of arrows at each other through the clash,
 * arcing across the gap (matches the tactical battle's volley). Generic missile
 * exchange — no unit data needed. */
const CLASH_ARROW_UP = new THREE.Vector3(0, 1, 0);
function ClashArrows({ m, startRef }: { m: ClashMark; startRef: { current: number | null } }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = IS_MOBILE ? 12 : 24;
  const defs = useMemo(() => Array.from({ length: N }, (_, i) => {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;          // alternate firing sides
    const wave = Math.floor(i / 4) % 3;
    const h = clashHash(m.x, m.y, i * 7 + 3);
    const h2 = clashHash(m.x, m.y, i * 13 + 1);
    return { side, t0: 0.04 + wave * 0.26 + h * 0.05, lat: (h2 - 0.5) * 0.5, peak: 0.9 + h * 0.5 };
  }), [m.x, m.y, N]);
  useFrame(({ clock }) => {
    if (!ref.current || startRef.current == null) return;
    const tt = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const FLIGHT = 0.16;   // fraction of the clash a single arrow is airborne
    for (let i = 0; i < N; i++) {
      const a = defs[i];
      const lt = (tt - a.t0) / FLIGHT;                 // local 0→1 flight
      const vis = lt > 0 && lt < 1;
      const fromX = a.side * 0.55, toX = -a.side * 0.32;
      const x = fromX + (toX - fromX) * lt;
      const y = 0.12 + Math.sin(Math.min(1, Math.max(0, lt)) * Math.PI) * a.peak;
      const vy = a.peak * Math.PI * Math.cos(lt * Math.PI);
      dir.set(toX - fromX, vy, 0).normalize();
      q.setFromUnitVectors(CLASH_ARROW_UP, dir);
      p.set(x, y, a.lat);
      sc.setScalar(vis ? 1 : 0.0001);
      ref.current.setMatrixAt(i, m4.compose(p, q, sc));
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <cylinderGeometry args={[0.01, 0.01, 0.18, 4]} />
      <meshBasicMaterial color="#cdbb88" />
    </instancedMesh>
  );
}

/* 焚營 — a stormed camp (拔寨) goes up in flames on the broken side: a cluster
 * of fire tongues + smoke that swells, then dies down as the clash settles. */
function ClashFire({ side, startRef }: { side: -1 | 1; startRef: { current: number | null } }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g || startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    const grow = Math.min(1, t / 0.3);
    const die = t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
    g.scale.setScalar(0.5 + grow * 0.7);
    g.traverse((o) => {
      const mm = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (mm && 'opacity' in mm) mm.opacity = (mm.userData.base ?? 1) * grow * die;
    });
  });
  return (
    <group ref={groupRef} position={[side * 0.55, 0, 0]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const ang = (i / 9) * Math.PI * 2.4;
        const r = 0.06 + (i % 3) * 0.08;
        const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#ff7e26' : '#e0331a';
        return (
          <mesh key={`f${i}`} position={[Math.cos(ang) * r, 0.06 + (i % 4) * 0.09, Math.sin(ang) * r]}>
            <sphereGeometry args={[0.07 + (i % 3) * 0.03, 6, 6]} />
            <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
          </mesh>
        );
      })}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`s${i}`} position={[(i % 2 - 0.5) * 0.1, 0.45 + i * 0.13, 0]}>
          <sphereGeometry args={[0.12 + (i % 2) * 0.05, 6, 6]} />
          <meshBasicMaterial color="#5a5048" transparent opacity={0.7} ref={(mm) => { if (mm) mm.userData.base = 0.7; }} />
        </mesh>
      ))}
    </group>
  );
}

/* 後陣 — an instanced reserve host massed behind each side's front-line
 * brawlers (a block of soldiers + a forest of spears), so a big clash on the
 * map reads as armies colliding, not a dozen duellists. Scales with troops. */
const CLASH_HOST_MAX = IS_MOBILE ? 14 : 34;
function ClashHost({ side, troops, color }: { side: -1 | 1; troops?: number; color: string }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const spearRef = useRef<THREE.InstancedMesh>(null);
  const horseRef = useRef<THREE.InstancedMesh>(null);
  const slots = useMemo(() => {
    const count = Math.min(CLASH_HOST_MAX, Math.max(8, Math.round((troops ?? 8000) / 650)));
    const cols = Math.max(5, Math.round(Math.sqrt(count * 3)));
    const rows = Math.ceil(count / cols);
    const mountFrom = rows - Math.max(1, Math.round(rows * 0.35));   // rear ranks ride (cavalry reserve)
    const out: Array<{ x: number; z: number; ph: number; mounted: boolean }> = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const h = Math.abs(Math.sin(i * 12.9898 + side * 3.1));
      const z = (c - (cols - 1) / 2) * 0.065 + (h - 0.5) * 0.02;
      const x = side * (0.62 + r * 0.075);
      out.push({ x, z, ph: (i * 0.8) % (Math.PI * 2), mounted: r >= mountFrom });
    }
    return out;
  }, [troops, side]);
  const mountedCount = useMemo(() => slots.filter((s) => s.mounted).length, [slots]);
  const spearQuat = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, side * 0.22)), [side]);
  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    const t = clock.elapsedTime;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3().setScalar(0.9);
    let hi = 0;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const bob = Math.abs(Math.sin(t * 5 + sl.ph)) * 0.015;
      const ride = sl.mounted ? 0.06 : 0;
      if (sl.mounted && horseRef.current) {
        p.set(sl.x, 0.045 + bob * 0.4, sl.z);
        horseRef.current.setMatrixAt(hi++, m.compose(p, q, sc));
      }
      p.set(sl.x, 0.05 + bob + ride, sl.z);
      bodyRef.current.setMatrixAt(i, m.compose(p, q, sc));
      if (spearRef.current) {
        p.set(sl.x - side * 0.02, 0.12 + bob + ride, sl.z);
        spearRef.current.setMatrixAt(i, m.compose(p, spearQuat, sc));
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    if (spearRef.current) spearRef.current.instanceMatrix.needsUpdate = true;
    if (horseRef.current) horseRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={horseRef} args={[undefined, undefined, Math.max(1, mountedCount)]} castShadow>
        <boxGeometry args={[0.035, 0.04, 0.08] } />
        <meshStandardMaterial color="#6a4a32" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, slots.length]} castShadow>
        <boxGeometry args={[0.03, 0.07, 0.025]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={spearRef} args={[undefined, undefined, slots.length]} castShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.16, 4]} />
        <meshStandardMaterial color="#2a1d12" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

function ClashSite({ m }: { m: ClashMark }) {
  const startRef = useRef<number | null>(null);
  useFrame(({ clock }) => { if (startRef.current == null) startRef.current = clock.elapsedTime; });
  const [wx, wz] = pxToWorld(m.x, m.y);
  const y = sampleTerrainHeight(wx, wz) + 0.04;
  const colA = m.aColor ?? CLASH_A;
  const colB = m.bColor ?? CLASH_B;
  // m.winner is the WINNING side (−1 = A/left, 1 = B/right); the loser breaks.
  // Falls back to a deterministic pick when an old mark carries no outcome.
  const loser: -1 | 1 = m.winner != null ? (m.winner === -1 ? 1 : -1)
    : (clashHash(m.x, m.y, 99) < 0.5 ? -1 : 1);
  const sizeFor = (tr?: number) => tr != null ? Math.max(3, Math.min(10, Math.round(tr / 2500))) : CLASH_PER_SIDE;
  const nA = sizeFor(m.aTroops), nB = sizeFor(m.bTroops);
  const brawlers = useMemo(() => {
    const out: Array<{ side: -1 | 1; lane: number; laneN: number; phase: number; fallAt: number | null }> = [];
    const build = (side: -1 | 1, n: number) => {
      for (let k = 0; k < n; k++) {
        const h = clashHash(m.x, m.y, side * 17 + k);
        const odds = side === loser ? 0.62 : 0.16;   // the broken side falls far more
        const fallAt = h < odds ? 0.35 + clashHash(m.x, m.y, side * 31 + k) * 0.4 : null;
        out.push({ side, lane: k, laneN: n, phase: h * Math.PI * 2, fallAt });
      }
    };
    build(-1, nA); build(1, nB);
    return out;
  }, [m.x, m.y, loser, nA, nB]);
  return (
    <group position={[wx, y, wz]}>
      {/* Reserve hosts massed behind each front line — armies, not duellists. */}
      <ClashHost side={-1} troops={m.aTroops} color={colA} />
      <ClashHost side={1} troops={m.bTroops} color={colB} />
      {brawlers.map((b, i) => (
        <Brawler key={i} desc={b} loser={loser} color={b.side === -1 ? colA : colB} startRef={startRef} />
      ))}
      <ClashArrows m={m} startRef={startRef} />
      {/* 拔寨 → the broken side's camp burns. */}
      {m.kind === 'camp' && <ClashFire side={loser} startRef={startRef} />}
      <ClashDust startRef={startRef} />
      {m.winName && <ClashResultFlag name={m.winName} color={m.winner === 1 ? colB : colA} startRef={startRef} />}
    </group>
  );
}

function Brawler({ desc, loser, color, startRef }: {
  desc: { side: -1 | 1; lane: number; laneN: number; phase: number; fallAt: number | null };
  loser: -1 | 1;
  color: string;
  startRef: { current: number | null };
}) {
  const ref = useRef<THREE.Group>(null);
  const mBody = useRef<THREE.MeshStandardMaterial>(null);
  const mHead = useRef<THREE.MeshStandardMaterial>(null);
  const mWpn = useRef<THREE.MeshStandardMaterial>(null);
  const startX = desc.side * 0.5;
  const meleeX = desc.side * 0.07;
  const laneZ = (desc.lane - (desc.laneN - 1) / 2) * 0.085;
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    let x = meleeX, lunge = 0, fall = 0, op = 1;
    if (t < 0.26) {
      const p = t / 0.26;
      x = startX + (meleeX - startX) * (p * p * (3 - 2 * p));   // smoothstep charge
      op = Math.min(1, t / 0.05);
    } else {
      lunge = Math.sin(clock.elapsedTime * 9 + desc.phase) * 0.03;  // trading blows
      x = meleeX + lunge;
      if (desc.fallAt != null && t > desc.fallAt) fall = Math.min(1, (t - desc.fallAt) / 0.18);
      if (t > 0.84) {
        op = Math.max(0, 1 - (t - 0.84) / 0.16);                // fade to the mark
        if (desc.side === loser && desc.fallAt == null) x += (t - 0.84) * 1.3 * desc.side; // rout
      }
    }
    g.position.set(x, fall * -0.02, laneZ);
    g.rotation.z = fall * desc.side * -1.4;             // tip over when felled
    g.rotation.x = fall === 0 ? lunge * 4 : 0;          // lean into the lunge
    g.visible = t < 1.02;
    if (mBody.current) mBody.current.opacity = op;
    if (mHead.current) mHead.current.opacity = op;
    if (mWpn.current) mWpn.current.opacity = op;
  });
  return (
    <group ref={ref} position={[startX, 0, laneZ]} scale={0.9}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.03, 0.07, 0.025]} />
        <meshStandardMaterial ref={mBody} color={color} transparent roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.10, 0]} castShadow>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial ref={mHead} color="#e0c498" transparent roughness={0.75} />
      </mesh>
      {/* weapon thrust toward the enemy line */}
      <mesh position={[-desc.side * 0.03, 0.09, 0]} rotation={[0, 0, desc.side * 0.9]} castShadow>
        <cylinderGeometry args={[0.003, 0.003, 0.10, 4]} />
        <meshStandardMaterial ref={mWpn} color="#cdd2d8" metalness={0.4} transparent />
      </mesh>
    </group>
  );
}

/** A small「X軍 勝」flag that rises over the site as the brawl is decided. */
function ClashResultFlag({ name, color, startRef }: {
  name: string; color: string; startRef: { current: number | null };
}) {
  const [show, setShow] = useState(false);
  useFrame(({ clock }) => {
    if (startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    const v = t > 0.55 && t < 1.3;
    if (v !== show) setShow(v);
  });
  if (!show) return null;
  return (
    <Html position={[0, 0.42, 0]} center distanceFactor={10} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15, 10, 5, 0.85)', border: `1px solid ${color}`, borderRadius: 'var(--tkm-radius-xs)',
        padding: '1px 8px', color: '#ffe9a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
        fontSize: '12px', whiteSpace: 'nowrap', boxShadow: `0 0 9px ${color}99`,
      }}>{name}軍 勝</div>
    </Html>
  );
}

/** Dust kicked up by a clash — puffs swelling and fading over the brawl. */
function ClashDust({ startRef }: { startRef: { current: number | null } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || startRef.current == null) return;
    const t = (clock.elapsedTime - startRef.current) / CLASH_DURATION;
    ref.current.visible = t < 1.0;
    const env = Math.min(1, t < 0.2 ? t / 0.2 : (1 - t) / 0.2);   // ease in/out
    for (let i = 0; i < ref.current.children.length; i++) {
      const mp = ref.current.children[i] as THREE.Mesh;
      const lt = (clock.elapsedTime * 0.6 + i / 6) % 1;
      mp.position.set((i - 2.5) * 0.06, 0.02 + lt * 0.1, 0);
      mp.scale.setScalar(0.04 + lt * 0.1);
      (mp.material as THREE.MeshBasicMaterial).opacity = 0.22 * (1 - lt) * Math.max(0, env);
    }
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#cdbfa8" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Dust kicked up at a battle's clash point the instant it ignites. */
export function IgnitionDust3D() {
  const anchor = useGameStore((s) => s.tacticalBattle?.geoAnchor ?? null);
  const battleId = useGameStore((s) => s.tacticalBattle?.id ?? null);
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);
  const idRef = useRef<string | null>(null);
  useFrame(({ clock }) => {
    if (battleId !== idRef.current) {
      idRef.current = battleId;
      startRef.current = battleId ? clock.elapsedTime : null;
    }
    const g = ref.current;
    if (!g) return;
    if (startRef.current == null || !anchor) { g.visible = false; return; }
    const t = (clock.elapsedTime - startRef.current) / 1.3;
    if (t >= 1) { g.visible = false; return; }
    g.visible = true;
    const s = 0.25 + t * 1.7;
    g.scale.set(s, 1, s);
    if (matRef.current) matRef.current.opacity = 0.5 * (1 - t);
  });
  if (!anchor) return null;
  const [wx, wz] = pxToWorld(anchor.x, anchor.y);
  const y = sampleTerrainHeight(wx, wz) + 0.05;
  return (
    <group ref={ref} position={[wx, y, wz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.46, 32]} />
        <meshBasicMaterial ref={matRef} color="#d8c4a0" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ─── 細作 — your spies steal across the map toward their targets ─────────
   For each pending espionage op, a hooded courier slips along the road from
   the agent's city toward the target — the abstract op given a body on the
   map (RTK/TW agents). Player ops only; enemy spies stay unseen. */
export function EspionageAgents3D({ cities }: { cities: Record<string, City> }) {
  const ops = useGameStore((s) => s.pendingEspionage);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const lang = useLanguage();
  const routes = useMemo(() => {
    const out: Array<{ pts: THREE.Vector3[]; cum: number[]; total: number; phase: number; label: string }> = [];
    for (const op of ops) {
      const agent = officers[op.agentOfficerId];
      if (!agent || agent.forceId !== playerForceId || !agent.locationCityId || !op.targetCityId) continue;
      const src = cities[agent.locationCityId]; const dst = cities[op.targetCityId];
      if (!src || !dst) continue;
      const sp = cityPos(src); const dp = cityPos(dst);
      const route = terrainRoute(sp.x, sp.y, dp.x, dp.y);
      const pts = route.map((p) => { const [wx, wz] = pxToWorld(p.x, p.y); return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.05, wz); });
      if (pts.length < 2) continue;
      const cum = [0];
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
      const total = cum[cum.length - 1];
      if (total < 0.5) continue;
      out.push({ pts, cum, total, phase: (out.length * 0.37) % 1, label: pickName(agent.name, lang) });
    }
    return out;
  }, [ops, officers, cities, playerForceId, lang]);

  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    routes.forEach((r, i) => {
      const g = refs.current[i];
      if (!g) return;
      const d2 = ((t * 0.18) / r.total + r.phase) % 2;     // ping-pong: infiltrate & return
      const back = d2 > 1;
      const s = (back ? 2 - d2 : d2) * r.total;
      let k = 1; while (k < r.cum.length - 1 && r.cum[k] < s) k++;
      const seg = r.cum[k] - r.cum[k - 1] || 1;
      const f = (s - r.cum[k - 1]) / seg;
      g.position.lerpVectors(r.pts[k - 1], r.pts[k], f);
    });
  });

  return (
    <group>
      {routes.map((r, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} scale={0.85}>
          {/* hooded courier — dark cloak cone + head */}
          <mesh position={[0, 0.07, 0]} castShadow><coneGeometry args={[0.05, 0.16, 6]} /><meshStandardMaterial color="#2a2a30" roughness={0.9} /></mesh>
          <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.03, 6, 5]} /><meshStandardMaterial color="#1c1c22" roughness={0.85} /></mesh>
          <Html position={[0, 0.3, 0]} center distanceFactor={10} zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,12,28,0.82)', border: '1px solid #7a5a9a', borderRadius: 'var(--tkm-radius-xs)',
              padding: '0 5px', color: '#c8a8e0', fontFamily: 'var(--tkm-font-body)', fontSize: 9.5, whiteSpace: 'nowrap',
            }}>諜 {r.label}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}
