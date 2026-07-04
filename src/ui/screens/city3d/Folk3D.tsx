/* 城中眾生 — the living figures of the city view (officers, family,
 * refugees, watchman, festival dressing, street encounters) plus shared
 * primitives (shade / ChineseRoof3D) and the Season/Night contexts. Split
 * out of CityMapScreen3D.tsx (2026-07); pure mechanical move. */
import { createContext, useContext, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';

// The current season flows to every roof/tree/ground via context so the whole
// city dresses for the season (snow in winter, gold leaves in autumn…) without
// threading a prop through dozens of components.
export const SeasonCtx = createContext<SeasonKey>('spring');

// 下旬月夜 — lets every dwelling/lantern know it's night without threading
// a prop through the whole scene tree.
export const NightCtx = createContext<boolean>(false);

/** Multiply an #rrggbb colour by a factor (>1 lightens, <1 darkens). Cheap
 *  helper so ridges/eaves can be tinted off a base roof colour. */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** A swept Chinese hip roof (廡殿頂) from opaque primitives — overhanging eave
 *  slab + 4-sided pyramid + ridge beam + upturned corner tips, optional 鴟吻
 *  ridge-end ornaments. Caller positions the group at eave height. */
export function ChineseRoof3D({ size, color, ornament = false, beasts = false }: {
  size: number; color: string; ornament?: boolean; beasts?: boolean;
}) {
  const season = useContext(SeasonCtx);
  const eave = size + 0.3;
  const roofH = 0.26 + eave * 0.16;
  const ridgeC = shade(color, 1.4);
  const snowy = season === 'winter';
  return (
    <group>
      {/* Overhanging eave slab — the shadow line */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[eave, 0.1, eave]} />
        <meshStandardMaterial color={shade(color, 0.85)} roughness={0.66} metalness={0.12} />
      </mesh>
      {/* Hip roof body */}
      <mesh position={[0, roofH / 2 + 0.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[eave * 0.72, roofH, 4]} />
        <meshStandardMaterial color={color} roughness={0.62} metalness={0.16} />
      </mesh>
      {/* Main ridge beam */}
      <mesh position={[0, roofH + 0.05, 0]} castShadow>
        <boxGeometry args={[eave * 0.5, 0.09, 0.12]} />
        <meshStandardMaterial color={ridgeC} roughness={0.55} />
      </mesh>
      {/* Upturned corner tips */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * eave * 0.45, 0.13, sz * eave * 0.45]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[0.08, 0.24, 4]} />
          <meshStandardMaterial color={ridgeC} roughness={0.6} />
        </mesh>
      ))}
      {/* Hip ridges (戗脊) running apex→corners on grand roofs — the tiled look */}
      {ornament && !snowy && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => {
        const a = new THREE.Vector3(0, roofH + 0.06, 0);
        const c = new THREE.Vector3(sx * eave * 0.46, 0.12, sz * eave * 0.46);
        const d = c.clone().sub(a);
        const len = d.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        const mid = a.clone().add(c).multiplyScalar(0.5);
        return (
          <mesh key={`hip${i}`} position={[mid.x, mid.y, mid.z]} quaternion={[q.x, q.y, q.z, q.w]} castShadow>
            <boxGeometry args={[0.07, len, 0.07]} />
            <meshStandardMaterial color={ridgeC} roughness={0.58} />
          </mesh>
        );
      })}
      {/* 鴟吻 ridge-end ornaments for important halls */}
      {ornament && [-1, 1].map((s, i) => (
        <mesh key={`o${i}`} position={[s * eave * 0.24, roofH + 0.16, 0]} rotation={[0, 0, s * 0.5]}>
          <coneGeometry args={[0.07, 0.22, 4]} />
          <meshStandardMaterial color="#d8b450" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {/* Ridge beasts (脊獸) marching down the ridge of grand roofs */}
      {beasts && !snowy && [-0.16, 0, 0.16].map((px, i) => (
        <mesh key={`b${i}`} position={[px * eave, roofH + 0.11, 0]} castShadow>
          <coneGeometry args={[0.04, 0.13, 5]} />
          <meshStandardMaterial color={shade(color, 1.7)} roughness={0.6} />
        </mesh>
      ))}
      {/* Winter snow blanket on the upper slopes */}
      {snowy && (
        <mesh position={[0, roofH * 0.58 + 0.08, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[eave * 0.6, roofH * 0.72, 4]} />
          <meshStandardMaterial color="#eef2f6" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}

/** 城中武將 — a named officer standing in the city: taller and straighter
 *  than townsfolk, headgear by calling (進賢冠/兜鍪/斗笠), name pill overhead,
 *  clickable. `hidden` renders an anonymous hooded silhouette (undiscovered
 *  talent — a hint that 搜索 would pay off). */
export function OfficerFigure3D({ x, z, nameZh, kind, seed, onClick }: {
  x: number; z: number;
  nameZh?: string;
  kind: 'court' | 'martial' | 'wanderer' | 'hidden';
  seed: number;
  onClick: () => void;
}) {
  const ROBES = { court: '#5a6f9e', martial: '#8a3a2e', wanderer: '#4a7a5a', hidden: '#3a3a42' } as const;
  const robe = ROBES[kind];
  const rot = ((seed % 5) - 2) * 0.5;
  return (
    <group
      position={[x, 0, z]}
      rotation={[0, rot, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {/* Body — a head taller than a villager, straight-backed */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.15, 0.48, 8]} />
        <meshStandardMaterial color={robe} roughness={0.8} />
      </mesh>
      {/* Sash */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.107, 0.107, 0.045, 8]} />
        <meshStandardMaterial color={kind === 'martial' ? '#3a2418' : '#c8b070'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.075, 9, 8]} />
        <meshStandardMaterial color={kind === 'hidden' ? '#8a7a66' : '#e6c39a'} roughness={0.8} />
      </mesh>
      {/* Headgear by calling */}
      {kind === 'court' && (
        <mesh position={[0, 0.65, -0.01]} castShadow>
          <boxGeometry args={[0.09, 0.07, 0.11]} />
          <meshStandardMaterial color="#22283a" roughness={0.7} />
        </mesh>
      )}
      {kind === 'martial' && (
        <>
          <mesh position={[0, 0.635, 0]} castShadow>
            <coneGeometry args={[0.085, 0.1, 8]} />
            <meshStandardMaterial color="#4a4a54" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.71, 0]}>
            <sphereGeometry args={[0.022, 6, 5]} />
            <meshStandardMaterial color="#c23a2e" roughness={0.6} />
          </mesh>
          {/* Shoulder guards */}
          {[-0.13, 0.13].map((sx, i) => (
            <mesh key={i} position={[sx, 0.43, 0]} castShadow>
              <sphereGeometry args={[0.05, 7, 6]} />
              <meshStandardMaterial color="#5a4a3a" metalness={0.3} roughness={0.6} />
            </mesh>
          ))}
        </>
      )}
      {kind === 'wanderer' && (
        <mesh position={[0, 0.64, 0]} castShadow>
          <coneGeometry args={[0.14, 0.07, 10]} />
          <meshStandardMaterial color="#9a8050" roughness={0.9} />
        </mesh>
      )}
      {kind === 'hidden' && (
        <mesh position={[0, 0.6, -0.015]} rotation={[0.25, 0, 0]} castShadow>
          <coneGeometry args={[0.1, 0.16, 8]} />
          <meshStandardMaterial color="#2e2e36" roughness={0.95} />
        </mesh>
      )}
      {/* Name pill */}
      <Html position={[0, 0.92, 0]} center distanceFactor={10} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap',
          color: kind === 'hidden' ? '#b8b0a0' : '#f2e8d2',
          background: 'rgba(22,16,10,0.75)',
          border: `1px solid ${kind === 'martial' ? '#c86a4a' : kind === 'wanderer' ? '#7ab88a' : kind === 'hidden' ? '#6a6a72' : '#8fa8d8'}`,
          borderRadius: 4, padding: '0 5px',
        }}>{kind === 'hidden' ? '？' : nameZh}</div>
      </Html>
    </group>
  );
}

/** 官邸 — a modest residence hall + the lord's family in the courtyard:
 *  spouse in a rose robe, children scaled by age. Capital only. */
export function Residence3D({ x, z, household, onClick }: {
  x: number; z: number;
  household: { spouses: string[]; kids: Array<{ nameZh: string; age: number; female: boolean }> };
  onClick: () => void;
}) {
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      {/* Hall */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.84, 1.15]} />
        <meshStandardMaterial color="#a0705a" roughness={0.85} />
      </mesh>
      <group position={[0, 0.9, 0]}><ChineseRoof3D size={1.35} color="#3c3648" /></group>
      {/* Courtyard fence */}
      {[-1.15, 1.15].map((sx, i) => (
        <mesh key={i} position={[sx, 0.16, 0.9]} castShadow>
          <boxGeometry args={[0.5, 0.32, 0.06]} />
          <meshStandardMaterial color="#6a5238" roughness={0.9} />
        </mesh>
      ))}
      {/* Spouse — rose robe */}
      {household.spouses.length > 0 && (
        <group position={[-0.55, 0, 1.15]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.13, 0.4, 7]} />
            <meshStandardMaterial color="#b06a80" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.46, 0]} castShadow>
            <sphereGeometry args={[0.065, 8, 7]} />
            <meshStandardMaterial color="#e6c39a" roughness={0.8} />
          </mesh>
        </group>
      )}
      {/* Children — small figures, one per heir (up to 3 shown) */}
      {household.kids.slice(0, 3).map((k, i) => (
        <group key={i} position={[0.15 + i * 0.42, 0, 1.2 + (i % 2) * 0.22]}>
          <mesh position={[0, 0.13, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.26, 7]} />
            <meshStandardMaterial color={k.female ? '#c08a9a' : '#7a8ab0'} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.31, 0]} castShadow>
            <sphereGeometry args={[0.05, 7, 6]} />
            <meshStandardMaterial color="#e6c39a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <Html position={[0, 1.5, 0]} center distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap',
          color: '#f0d8e0', background: 'rgba(22,16,10,0.78)',
          border: '1px solid #b06a80', borderRadius: 4, padding: '0 5px',
        }}>官邸</div>
      </Html>
    </group>
  );
}

export const ENCOUNTER_LOOK = {
  merchant:    { zh: '行商', robe: '#8a6a3a', hat: true },
  knight:      { zh: '遊俠', robe: '#5a3a3a', hat: false },
  soothsayer:  { zh: '相士', robe: '#4a4a6a', hat: true },
  storyteller: { zh: '說書', robe: '#3a5a4a', hat: false },
} as const;

/** 街頭際遇 — a special figure by the archway with a gold shimmer ring;
 *  tap to hear their offer (one per city per season). */
export function StreetEncounterFigure({ x, z, kind, onClick }: {
  x: number; z: number;
  kind: keyof typeof ENCOUNTER_LOOK;
  onClick: () => void;
}) {
  const look = ENCOUNTER_LOOK[kind];
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.opacity = 0.45 + Math.sin(clock.elapsedTime * 3) * 0.25;
  });
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.4, 24]} />
        <meshBasicMaterial ref={ringRef} color="#ffd75e" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.4, 7]} />
        <meshStandardMaterial color={look.robe} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 7]} />
        <meshStandardMaterial color="#e6c39a" roughness={0.8} />
      </mesh>
      {look.hat && (
        <mesh position={[0, 0.54, 0]} castShadow>
          <coneGeometry args={[0.12, 0.09, 10]} />
          <meshStandardMaterial color="#6a5838" roughness={0.85} />
        </mesh>
      )}
      <Html position={[0, 0.85, 0]} center distanceFactor={10} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap',
          color: '#ffe9a8', background: 'rgba(22,16,10,0.8)',
          border: '1px solid #ffd75e', borderRadius: 4, padding: '0 5px',
        }}>✨ {look.zh}</div>
      </Html>
    </group>
  );
}

/** 打更人 — the night watchman pacing the main avenue with a glowing
 *  hand-lantern. Only appears on lower-phase (moonlit) nights. */
export function Watchman3D({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current; if (!g) return;
    const t = s.clock.elapsedTime * 0.08 + 2.4;
    const u = (Math.sin(t) + 1) / 2;
    g.position.x = ax + (bx - ax) * u;
    g.position.z = az + (bz - az) * u;
    g.position.y = Math.abs(Math.sin(t * 8)) * 0.03;
    const fwd = Math.cos(t) >= 0 ? 1 : -1;
    g.rotation.y = Math.atan2((bx - ax) * fwd, (bz - az) * fwd);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.135, 0.36, 7]} />
        <meshStandardMaterial color="#3a3f4e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 7]} />
        <meshStandardMaterial color="#e6c39a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.11, 0.09, 10]} />
        <meshStandardMaterial color="#2c3040" roughness={0.85} />
      </mesh>
      {/* Hand lantern on a short pole — warm glow that reads at night */}
      <mesh position={[0.16, 0.36, 0.06]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 5]} />
        <meshStandardMaterial color="#4a3520" />
      </mesh>
      <mesh position={[0.22, 0.24, 0.06]}>
        <sphereGeometry args={[0.05, 8, 7]} />
        <meshStandardMaterial color="#ffb84a" emissive="#ff9a2e" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/** 流民 — a hunched refugee huddled by the roadside with a cloth bundle:
 *  visible poverty when a city's loyalty has cratered. */
export function Refugee3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const rot = (seed % 8) * (Math.PI / 4);
  const sitting = seed % 3 !== 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, sitting ? 0.11 : 0.15, 0]} rotation={[sitting ? 0.35 : 0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, sitting ? 0.2 : 0.28, 7]} />
        <meshStandardMaterial color={seed % 2 ? '#6a5d48' : '#75604a'} roughness={0.98} />
      </mesh>
      <mesh position={[0, sitting ? 0.26 : 0.33, 0.045]} castShadow>
        <sphereGeometry args={[0.062, 8, 7]} />
        <meshStandardMaterial color="#cfa87e" roughness={0.9} />
      </mesh>
      {/* Ragged straw cape */}
      <mesh position={[0, sitting ? 0.2 : 0.26, -0.02]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.13, 0.16, 8]} />
        <meshStandardMaterial color="#8a7a4e" roughness={1} />
      </mesh>
      {/* Cloth bundle beside them */}
      <mesh position={[0.16, 0.05, 0.05]} castShadow>
        <sphereGeometry args={[0.075, 7, 6]} />
        <meshStandardMaterial color="#9a8a68" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** 白幡 — a white mourning streamer hung out by a plague-struck household. */
export function MourningBanner3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 1.6 + seed) * 0.22;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 1.5, 5]} />
        <meshStandardMaterial color="#4a3b2a" roughness={0.9} />
      </mesh>
      <mesh ref={ref} position={[0, 1.24, 0]} castShadow>
        <boxGeometry args={[0.04, 0.6, 0.18]} />
        <meshStandardMaterial color="#e8e4da" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** 綵旗 — a sagging string of festival pennants strung across the avenue
 *  between two lantern posts (秋社廟會). */
export function FestivalPennants3D({ ax, az, bx, bz }: { ax: number; az: number; bx: number; bz: number }) {
  const COLORS = ['#d9583a', '#e8b34a', '#4a8a5a', '#5a72b8', '#b85a8a'];
  const len = Math.hypot(bx - ax, bz - az);
  const angY = Math.atan2(-(bz - az), bx - ax);
  const N = 7;
  return (
    <group>
      <group position={[(ax + bx) / 2, 1.38, (az + bz) / 2]} rotation={[0, angY, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, len, 4]} />
          <meshStandardMaterial color="#3a2c1c" roughness={0.9} />
        </mesh>
      </group>
      {Array.from({ length: N - 1 }).map((_, j) => {
        const i = j + 1;
        const t = i / N;
        return (
          <mesh
            key={i}
            position={[ax + (bx - ax) * t, 1.38 - Math.sin(t * Math.PI) * 0.16 - 0.08, az + (bz - az) * t]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.055, 0.15, 4]} />
            <meshStandardMaterial color={COLORS[i % COLORS.length]} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}
