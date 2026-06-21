import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Mesh } from 'three';

/**
 * 3D 攻城戰 set-piece — a cinematic, fully procedural siege diorama (no GLB
 * assets, so nothing to whitelist or load): rammed gate, crenellated walls,
 * corner towers, scaling ladders with climbing parties, flanking catapults
 * lobbing stones, banner colours of both sides, drifting dust and a slow
 * auto-orbiting camera. It dramatizes an already-resolved siege; it is not an
 * interactive battle. Drop {@link SiegeDiorama3D} over any result.
 */
interface SiegeProps {
  /** Attacker / defender banner colours (hex). */
  attackerColor: string;
  defenderColor: string;
  /** Did the wall fall? Drives ram impact + breach rubble + heavier barrage. */
  cityFell: boolean;
}

const WALL_LEN = 14;
const WALL_H = 3.2;
const WALL_Z = 0;
/** Where the besiegers stand and the wall-top sits — handy shared anchors. */
const FIELD_Z = WALL_Z + 6;

function Crenellations({ color }: { color: string }) {
  const merlons = [];
  for (let x = -WALL_LEN / 2 + 0.5; x <= WALL_LEN / 2 - 0.5; x += 1.1) {
    merlons.push(
      <mesh key={x} position={[x, WALL_H + 0.25, WALL_Z]} castShadow>
        <boxGeometry args={[0.55, 0.5, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>,
    );
  }
  return <>{merlons}</>;
}

function Tower({ x, color }: { x: number; color: string }) {
  return (
    <group position={[x, 0, WALL_Z]}>
      <mesh position={[0, WALL_H * 0.75, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.3, WALL_H * 1.5, 12]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      <mesh position={[0, WALL_H * 1.5 + 0.1, 0]} castShadow>
        <coneGeometry args={[1.45, 0.9, 12]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Banner({ x, color }: { x: number; color: string }) {
  const flag = useRef<Mesh>(null);
  useFrame((s) => {
    if (flag.current) flag.current.rotation.y = Math.sin(s.clock.elapsedTime * 3 + x) * 0.3;
  });
  return (
    <group position={[x, WALL_H + 0.9, WALL_Z + 0.4]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
        <meshStandardMaterial color="#2a2018" />
      </mesh>
      <mesh ref={flag} position={[0.32, 0.45, 0]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** A block of soldiers as a small grid of crude figures. */
function Host({ x, z, color, count = 18 }: { x: number; z: number; color: string; count?: number }) {
  const positions = useMemo(() => {
    const ps: Array<[number, number]> = [];
    const cols = 6;
    for (let i = 0; i < count; i++) ps.push([(i % cols) * 0.5 - 1.25, Math.floor(i / cols) * 0.5]);
    return ps;
  }, [count]);
  return (
    <group position={[x, 0, z]}>
      {positions.map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.45, dz]} castShadow>
          <capsuleGeometry args={[0.12, 0.4, 4, 6]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** The battering ram that lunges at the gate. */
function Ram({ cityFell }: { cityFell: boolean }) {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    const amp = cityFell ? 0.9 : 0.5;
    g.current.position.z = WALL_Z + 3.2 + Math.abs(Math.sin(t * 1.6)) * -amp;
  });
  return (
    <group ref={g} position={[0, 0.6, WALL_Z + 3.2]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.4, 1.0, 2.2]} />
        <meshStandardMaterial color="#4a3623" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, -1.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 1.8, 8]} />
        <meshStandardMaterial color="#2a1c10" />
      </mesh>
    </group>
  );
}

/**
 * 雲梯 — a scaling ladder leaning on the rampart with a climbing party. Base
 * sits out in the field, top rests on the parapet; climbers crawl up on a loop.
 */
function SiegeLadder({ x, color, climbers = 3 }: { x: number; color: string; climbers?: number }) {
  const base = useMemo(() => new THREE.Vector3(x, 0, WALL_Z + 2.0), [x]);
  const top = useMemo(() => new THREE.Vector3(x, WALL_H + 0.3, WALL_Z + 0.55), []);
  const dir = useMemo(() => new THREE.Vector3().subVectors(top, base), [base, top]);
  const len = dir.length();
  const mid = useMemo(() => new THREE.Vector3().addVectors(base, top).multiplyScalar(0.5), [base, top]);
  // Tilt the (y-axis) ladder toward the wall (−z) by the lean angle.
  const lean = Math.atan2(top.z - base.z, top.y - base.y);
  const rungs = useMemo(() => Array.from({ length: 6 }, (_, i) => (i + 1) / 7), []);

  const party = useRef<Group>(null);
  useFrame((s) => {
    if (!party.current) return;
    const t = s.clock.elapsedTime;
    party.current.children.forEach((c, i) => {
      const u = ((t * 0.18 + i / climbers) % 1); // 0..1 up the ladder
      c.position.set(
        base.x,
        THREE.MathUtils.lerp(base.y + 0.4, top.y - 0.2, u),
        THREE.MathUtils.lerp(base.z, top.z, u),
      );
    });
  });

  return (
    <group>
      {/* Two rails + rungs, as one leaning group. */}
      <group position={[mid.x, mid.y, mid.z]} rotation={[lean, 0, 0]}>
        {[-0.22, 0.22].map((dx) => (
          <mesh key={dx} position={[dx, 0, 0]} castShadow>
            <boxGeometry args={[0.07, len, 0.07]} />
            <meshStandardMaterial color="#5a4327" roughness={0.95} />
          </mesh>
        ))}
        {rungs.map((u) => (
          <mesh key={u} position={[0, (u - 0.5) * len, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.06]} />
            <meshStandardMaterial color="#4a3520" roughness={1} />
          </mesh>
        ))}
      </group>
      {/* Climbing party. */}
      <group ref={party}>
        {Array.from({ length: climbers }).map((_, i) => (
          <mesh key={i} rotation={[lean, 0, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.36, 4, 6]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * 投石車 — a counterweight catapult: the arm winds back, snaps forward, and a
 * stone arcs toward the wall on a loop. `phase` offsets multiple engines so the
 * barrage staggers. Impact kicks up a dust burst at the parapet.
 */
function Catapult({ x, phase, heavy }: { x: number; phase: number; heavy: boolean }) {
  const arm = useRef<Group>(null);
  const stone = useRef<Mesh>(null);
  const launch = useMemo(() => new THREE.Vector3(x, 2.0, FIELD_Z + 2.4), [x]);
  // Aim at a point on the wall top, biased toward the gate.
  const target = useMemo(() => new THREE.Vector3(x * 0.4, WALL_H + 0.4, WALL_Z + 0.2), [x]);

  useFrame((s) => {
    const p = ((s.clock.elapsedTime * 0.32 + phase) % 1); // shot cycle
    if (arm.current) {
      // Wind back (0..0.55), snap forward (0.55..0.68), reset.
      const wind = p < 0.55 ? -0.7 - p * 0.6 : p < 0.68 ? 1.0 : 1.0 - (p - 0.68) * 3.6;
      arm.current.rotation.x = THREE.MathUtils.clamp(wind, -1.4, 1.0);
    }
    if (stone.current) {
      const flying = p > 0.62 && p < 0.95;
      stone.current.visible = flying;
      if (flying) {
        const u = (p - 0.62) / 0.33; // 0..1 along the arc
        stone.current.position.set(
          THREE.MathUtils.lerp(launch.x, target.x, u),
          THREE.MathUtils.lerp(launch.y, target.y, u) + Math.sin(u * Math.PI) * 3.2,
          THREE.MathUtils.lerp(launch.z, target.z, u),
        );
      }
    }
  });

  return (
    <>
      <group position={[x, 0, FIELD_Z + 2.4]}>
        {/* Frame */}
        {[-0.5, 0.5].map((dz) => (
          <mesh key={dz} position={[0, 0.7, dz]} castShadow>
            <boxGeometry args={[0.16, 1.4, 0.16]} />
            <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
          <meshStandardMaterial color="#2a1c10" />
        </mesh>
        {/* Throwing arm, pivoting on the axle. */}
        <group ref={arm} position={[0, 1.4, 0]}>
          <mesh position={[0, 0, -1.0]} castShadow>
            <boxGeometry args={[0.12, 0.12, 2.4]} />
            <meshStandardMaterial color={heavy ? '#6a2a14' : '#4a3623'} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 1.0]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#222" metalness={0.3} roughness={0.7} />
          </mesh>
        </group>
      </group>
      {/* Stone in flight — at scene root so its arc is in world space. */}
      <mesh ref={stone} position={[0, -10, 0]} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#5b5048" roughness={1} />
      </mesh>
    </>
  );
}

function Gate({ cityFell }: { cityFell: boolean }) {
  return (
    <group position={[0, 0, WALL_Z]}>
      <mesh position={[0, WALL_H * 0.55, 0.05]}>
        <boxGeometry args={[2.4, WALL_H * 1.1, 0.3]} />
        <meshStandardMaterial color={cityFell ? '#1a1208' : '#3a2814'} roughness={0.95} emissive={cityFell ? '#5a1e08' : '#000'} emissiveIntensity={cityFell ? 0.5 : 0} />
      </mesh>
      {cityFell && (
        <mesh position={[0, 0.3, 1.0]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[2.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#2a2018" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ attackerColor, defenderColor, cityFell }: SiegeProps) {
  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow />
      <directionalLight position={[-6, 4, -4]} intensity={0.3} color={cityFell ? '#ff7a3a' : '#88aaff'} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#6b5d44" roughness={1} />
      </mesh>

      {/* Wall + crenellations */}
      <mesh position={[0, WALL_H / 2, WALL_Z]} castShadow receiveShadow>
        <boxGeometry args={[WALL_LEN, WALL_H, 1.2]} />
        <meshStandardMaterial color="#8a7a5c" roughness={0.95} />
      </mesh>
      <Crenellations color="#8a7a5c" />
      <Gate cityFell={cityFell} />
      <Tower x={-WALL_LEN / 2} color="#7a6a4c" />
      <Tower x={WALL_LEN / 2} color="#7a6a4c" />

      {/* Defenders' banners along the wall */}
      <Banner x={-4} color={defenderColor} />
      <Banner x={0} color={defenderColor} />
      <Banner x={4} color={defenderColor} />

      {/* Defenders atop / behind the wall */}
      <Host x={-3} z={WALL_Z - 1.4} color={defenderColor} count={12} />
      <Host x={3} z={WALL_Z - 1.4} color={defenderColor} count={12} />

      {/* Besiegers massed before the gate */}
      <Host x={-3.5} z={FIELD_Z} color={attackerColor} />
      <Host x={3.5} z={FIELD_Z} color={attackerColor} />
      <Ram cityFell={cityFell} />

      {/* 雲梯 — scaling ladders flanking the gate */}
      <SiegeLadder x={-5.2} color={attackerColor} />
      <SiegeLadder x={5.2} color={attackerColor} />

      {/* 投石車 — catapults staggered behind the host */}
      <Catapult x={-5.6} phase={0} heavy={cityFell} />
      <Catapult x={5.6} phase={0.5} heavy={cityFell} />

      {/* Dust / smoke at the wall + bombardment haze */}
      <Sparkles count={60} scale={[WALL_LEN, 3, 8]} position={[0, 1.5, WALL_Z + 3]} size={6} speed={0.4} color={cityFell ? '#d8a060' : '#cfc4a8'} opacity={0.5} />
      <Sparkles count={24} scale={[WALL_LEN, 2, 1]} position={[0, WALL_H + 0.4, WALL_Z]} size={9} speed={0.7} color="#c8bca0" opacity={0.4} />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={30} blur={2} far={6} />
      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 1.8, WALL_Z]}
        minDistance={11}
        maxDistance={26}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.15}
      />
    </group>
  );
}

export function SiegeDiorama3D(props: SiegeProps) {
  return (
    <Canvas shadows camera={{ position: [12, 7.5, 17], fov: 40 }} dpr={[1, 1.6]}>
      <color attach="background" args={[props.cityFell ? '#2a1810' : '#1a2030']} />
      <fog attach="fog" args={[props.cityFell ? '#2a1810' : '#1a2030', 20, 40]} />
      <Scene {...props} />
    </Canvas>
  );
}
