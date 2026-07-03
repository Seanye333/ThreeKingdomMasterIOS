/* City markers on the strategic 3D map — the tiered Chinese city models
 * (pass / hamlet / town / city / capital), walls, pagoda, gate tower, force
 * banner, razed-city rubble, plus the City3D marker with its name pill and
 * strength bars. Extracted verbatim from StrategicMap3D.tsx (pure mechanical
 * split). */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { cityPixel } from '../../../game/data/cityGeo';
import { citySize } from '../../../game/systems/citySize';
import type { City } from '../../../game/types';
import { SelectionRing3D } from '../SelectionRing3D';
import { useLanguage, pickName } from '../../i18n';
import { IS_MOBILE, PIXEL_TO_WORLD, MARKER_SCALE, pxToWorld } from './shared';

/* ─── A single city: 3D pillar + label + capital marker ──────── */
/* ─── Chinese-style city model — picks variant by tier + pass check ─
 *  - 關 (pass) → two cliff wedges flanking a gate-tower
 *  - 邑 (hamlet) → wood palisade + 2 small huts, no central tower
 *  - 鎮 (town) → low brick wall + small 1-story pagoda
 *  - 城 (city) → brick wall + 2-story pagoda + 2 corner towers
 *  - 大城 (large) → tall wall + 3-story pagoda + 4 corner towers
 *  - 都 (capital) → grand wall + 5-story pagoda + 4 corner towers + side halls */
/** 市坊 — a ring of suburb roofs that grows with the city's built structures,
 *  so a heavily-developed city visibly sprawls beyond its wall (RTK/TW). */
function CitySuburb({ radius, count }: { radius: number; count: number }) {
  if (count <= 0) return null;
  const n = Math.min(10, count);
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
        const r = radius * (1.45 + (i % 3) * 0.22);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const w = radius * 0.34, h = radius * (0.4 + (i % 3) * 0.12);
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, -a, 0]}>
            <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h * 0.8, w * 0.8]} />
              <meshStandardMaterial color="#b09a78" roughness={0.92} />
            </mesh>
            <mesh position={[0, h * 0.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[w * 0.62, h * 0.4, 4]} />
              <meshStandardMaterial color="#4a4540" roughness={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ChineseCity({ city, radius, height, forceColor, development = 0, onClick }: {
  city: City;
  radius: number;
  height: number;
  forceColor: string;
  development?: number;
  onClick: () => void;
}) {
  const isPass = city.name.zh.includes('關');
  const tier = isPass ? 'pass' : citySize(city).id;
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); };

  if (tier === 'pass') return <PassGate radius={radius} height={height} forceColor={forceColor} onClick={click} />;
  if (tier === 'hamlet') return (
    <>
      <HamletVillage radius={radius} height={height} forceColor={forceColor} onClick={click} />
      <CitySuburb radius={radius} count={development} />
    </>
  );

  // Walled-city variants — pagoda story count + tower count scale with tier
  const stories  = tier === 'town' ? 1 : tier === 'city' ? 2 : tier === 'large' ? 3 : 5;
  const towers   = tier === 'town' ? 0 : tier === 'city' ? 2 : 4;
  const wallHigh = tier === 'town' ? 0.40 : tier === 'city' ? 0.55 : tier === 'large' ? 0.65 : 0.75;
  return (
    <>
      <ChineseBrickWall
        radius={radius} height={height}
        wallHigh={wallHigh}
        towers={towers}
        forceColor={forceColor}
        onClick={click}
      />
      <Pagoda
        x={0} z={0}
        radius={radius * 0.55}
        baseY={height * wallHigh + 0.02}
        storyH={height * 0.20}
        stories={stories}
        bodyColor="#c8a878"
        roofColor="#3a3a4a"
      />
      {tier === 'capital' && (
        // Two side halls flanking the central pagoda
        <>
          <SideHall x={-radius * 0.7} z={0} radius={radius * 0.3}
            baseY={height * wallHigh + 0.02} h={height * 0.35} />
          <SideHall x={radius * 0.7} z={0} radius={radius * 0.3}
            baseY={height * wallHigh + 0.02} h={height * 0.35} />
        </>
      )}
      <CitySuburb radius={radius} count={development} />
    </>
  );
}

/** A flared Chinese eave — wide tile slab, raised ridge, four upturned
 *  corner tips (戧脊). The silhouette that says "Chinese roof" at a glance. */
function SweptEave({ y, w, d, h }: { y: number; w: number; d: number; h: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.72} />
      </mesh>
      <mesh position={[0, h * 0.7, 0]} castShadow>
        <boxGeometry args={[w * 0.62, h * 0.5, d * 0.16]} />
        <meshStandardMaterial color="#1d1d27" roughness={0.6} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w * 0.46, h * 0.32, sz * d * 0.4]} rotation={[sz * 0.45, 0, -sx * 0.45]} castShadow>
          <coneGeometry args={[h * 0.5, h * 1.3, 4]} />
          <meshStandardMaterial color="#2a2a35" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** 城門樓 — a gate opening recessed in the front wall, crowned by a roofed
 *  gatehouse with swept eaves. Grand cities get a double eave (重檐). */
function GateTower({ radius: r, height, wallH, grand }: {
  radius: number; height: number; wallH: number; grand: boolean;
}) {
  const hallH = height * 0.17;
  const hallY = wallH + height * 0.045 + hallH / 2;
  return (
    <group position={[0, 0, r * 1.04]}>
      {/* Gate opening — dark recess in the wall base */}
      <mesh position={[0, wallH * 0.33, -r * 0.04]}>
        <boxGeometry args={[r * 0.5, wallH * 0.6, r * 0.16]} />
        <meshStandardMaterial color="#140f09" roughness={0.95} />
      </mesh>
      {/* Stone platform crowning the wall over the gate */}
      <mesh position={[0, wallH + height * 0.02, 0]} castShadow>
        <boxGeometry args={[r * 1.02, height * 0.045, r * 0.52]} />
        <meshStandardMaterial color="#4a4a56" roughness={0.7} />
      </mesh>
      {/* Wooden gatehouse hall */}
      <mesh position={[0, hallY, 0]} castShadow>
        <boxGeometry args={[r * 0.8, hallH, r * 0.4]} />
        <meshStandardMaterial color="#8a5630" roughness={0.78} />
      </mesh>
      <SweptEave y={wallH + height * 0.045 + hallH} w={r * 1.06} d={r * 0.6} h={height * 0.05} />
      {grand && (
        <>
          <mesh position={[0, wallH + height * 0.045 + hallH + height * 0.08, 0]} castShadow>
            <boxGeometry args={[r * 0.52, height * 0.1, r * 0.3]} />
            <meshStandardMaterial color="#8a5630" roughness={0.78} />
          </mesh>
          <SweptEave y={wallH + height * 0.045 + hallH + height * 0.16} w={r * 0.72} d={r * 0.42} h={height * 0.045} />
        </>
      )}
    </group>
  );
}

/** Chinese brick wall: low rectangular wall, optional corner towers,
 *  with tiled-tile crenellations. */
function ChineseBrickWall({ radius, height, wallHigh, towers, forceColor, onClick }: {
  radius: number; height: number;
  wallHigh: number;
  towers: 0 | 2 | 4;
  forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  const wallH = height * wallHigh;
  const cornerPositions: ReadonlyArray<readonly [number, number]> =
    towers === 0 ? []
    : towers === 2 ? [[-1.05, 0], [1.05, 0]]
    : [[1, 1], [1, -1], [-1, 1], [-1, -1]];

  return (
    <>
      {/* Outer wall — terracotta brick */}
      <mesh
        position={[0, wallH / 2, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[radius * 2.2, wallH, radius * 2.2]} />
        <meshStandardMaterial color="#9a7560" roughness={0.92} />
      </mesh>
      {/* Wall cap — dark tile band along the top */}
      <mesh position={[0, wallH + 0.005, 0]} castShadow>
        <boxGeometry args={[radius * 2.3, height * 0.04, radius * 2.3]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.7} />
      </mesh>
      {/* Crenellations along front + back + sides */}
      {([
        [-0.7, 1.1], [0, 1.1], [0.7, 1.1],
        [-0.7, -1.1], [0, -1.1], [0.7, -1.1],
        [1.1, -0.7], [1.1, 0], [1.1, 0.7],
        [-1.1, -0.7], [-1.1, 0], [-1.1, 0.7],
      ] as const).map(([sx, sz], i) => (
        <mesh key={`b${i}`} position={[radius * sx, wallH + 0.045, radius * sz]} castShadow>
          <boxGeometry args={[radius * 0.18, height * 0.08, radius * 0.18]} />
          <meshStandardMaterial color="#7a6550" roughness={0.85} />
        </mesh>
      ))}
      {/* Corner towers with Chinese roofs */}
      {cornerPositions.map(([sx, sz], i) => (
        <group key={`tw${i}`} position={[radius * 1.1 * sx, 0, radius * 1.1 * sz]}>
          {/* Tower body */}
          <mesh position={[0, wallH * 0.85, 0]} castShadow>
            <boxGeometry args={[radius * 0.4, wallH * 1.5, radius * 0.4]} />
            <meshStandardMaterial color={forceColor} roughness={0.7} />
          </mesh>
          {/* Eave — flat wide disc */}
          <mesh position={[0, wallH * 1.62, 0]} castShadow>
            <boxGeometry args={[radius * 0.62, height * 0.025, radius * 0.62]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
          </mesh>
          {/* Pyramidal roof — rotated 45° so the square cone aligns with the
           *  square tower below */}
          <mesh position={[0, wallH * 1.74, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[radius * 0.32, height * 0.20, 4]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* 城門樓 — gate + roofed gatehouse on the front wall (重檐 for grand cities) */}
      <GateTower radius={radius} height={height} wallH={wallH} grand={towers === 4} />
    </>
  );
}

/** Chinese pagoda: stacked stories with wide eaves between, pointed spire. */
function Pagoda({
  x, z, radius, baseY, storyH, stories, bodyColor, roofColor,
}: {
  x: number; z: number;
  radius: number;
  baseY: number;
  storyH: number;
  stories: number;
  bodyColor: string;
  roofColor: string;
}) {
  const meshes: React.ReactNode[] = [];
  let y = baseY;
  for (let s = 0; s < stories; s++) {
    // Each successive story narrower by ~12%
    const r = radius * Math.pow(0.85, s);
    // Story body
    meshes.push(
      <mesh key={`b${s}`} position={[x, y + storyH / 2, z]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.92, r, storyH, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.78} />
      </mesh>,
    );
    // Eave — flat wide disc above each story
    const eaveR = r * 1.35;
    const eaveH = storyH * 0.13;
    meshes.push(
      <mesh key={`e${s}`} position={[x, y + storyH + eaveH / 2, z]} castShadow>
        <cylinderGeometry args={[eaveR, eaveR * 1.10, eaveH, 8]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>,
    );
    y += storyH + eaveH;
  }
  // Spire — small final cone
  meshes.push(
    <mesh key="spire" position={[x, y + storyH * 0.6, z]} castShadow>
      <coneGeometry args={[radius * 0.10, storyH * 1.2, 6]} />
      <meshStandardMaterial color="#d4a84a" roughness={0.4} metalness={0.4} />
    </mesh>,
  );
  return <>{meshes}</>;
}

/** Hamlet (邑): no walls, just a wood palisade ring + 2-3 huts. */
function HamletVillage({ radius, height, forceColor, onClick }: {
  radius: number; height: number; forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <>
      {/* Wood palisade ring */}
      <mesh
        position={[0, height * 0.18, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, height * 0.36, 10, 1, true]} />
        <meshStandardMaterial color="#5a4530" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* 3 small huts inside */}
      {([[-0.4, -0.3], [0.4, -0.3], [0, 0.4]] as const).map(([sx, sz], i) => (
        <group key={i} position={[radius * sx, 0, radius * sz]}>
          <mesh position={[0, height * 0.18, 0]} castShadow>
            <boxGeometry args={[radius * 0.45, height * 0.30, radius * 0.45]} />
            <meshStandardMaterial color="#a89070" roughness={0.85} />
          </mesh>
          <mesh position={[0, height * 0.42, 0]} castShadow>
            <coneGeometry args={[radius * 0.36, height * 0.18, 4]} />
            <meshStandardMaterial color={forceColor} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Pass (關): rocky cliffs pinching a crenellated wall, with a double-eave
 *  gatehouse plugging the valley — reads as a fortified mountain gate. */
function PassGate({ radius, height, forceColor, onClick }: {
  radius: number; height: number; forceColor: string;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  return (
    <>
      {/* Cliff flanks — rock-grey, slightly skewed so they read as crags */}
      <mesh position={[-radius * 1.05, height * 0.55, 0]} rotation={[0, 0.28, 0.06]} castShadow>
        <boxGeometry args={[radius * 0.60, height * 1.20, radius * 1.9]} />
        <meshStandardMaterial color="#6e6354" roughness={0.97} />
      </mesh>
      <mesh position={[radius * 1.05, height * 0.50, 0]} rotation={[0, -0.22, -0.05]} castShadow>
        <boxGeometry args={[radius * 0.60, height * 1.05, radius * 1.9]} />
        <meshStandardMaterial color="#75695a" roughness={0.97} />
      </mesh>
      {/* Wall stubs tying the gate into both cliffs */}
      <mesh position={[-radius * 0.62, height * 0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 0.55, height * 0.60, radius * 0.45]} />
        <meshStandardMaterial color="#8a7560" roughness={0.92} />
      </mesh>
      <mesh position={[radius * 0.62, height * 0.30, 0]} castShadow receiveShadow>
        <boxGeometry args={[radius * 0.55, height * 0.60, radius * 0.45]} />
        <meshStandardMaterial color="#8a7560" roughness={0.92} />
      </mesh>
      {/* Central gate base — stone — click target */}
      <mesh
        position={[0, height * 0.35, 0]}
        castShadow receiveShadow
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[radius * 1.0, height * 0.70, radius * 0.7]} />
        <meshStandardMaterial color="#907c64" roughness={0.9} />
      </mesh>
      {/* Gate arch — darker opening */}
      <mesh position={[0, height * 0.25, radius * 0.36]}>
        <boxGeometry args={[radius * 0.5, height * 0.45, radius * 0.05]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* Battlements along the gate top */}
      {[-0.36, -0.12, 0.12, 0.36].map((sx, i) => (
        <mesh key={i} position={[radius * sx, height * 0.745, radius * 0.30]} castShadow>
          <boxGeometry args={[radius * 0.13, height * 0.09, radius * 0.08]} />
          <meshStandardMaterial color="#9c8870" roughness={0.9} />
        </mesh>
      ))}
      {/* Gatehouse — force-coloured hall with double swept eaves */}
      <mesh position={[0, height * 0.92, 0]} castShadow>
        <boxGeometry args={[radius * 1.0, height * 0.36, radius * 0.78]} />
        <meshStandardMaterial color={forceColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, height * 1.12, 0]} castShadow>
        <boxGeometry args={[radius * 1.42, height * 0.06, radius * 1.08]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      {/* Upper storey + second eave + crown roof */}
      <mesh position={[0, height * 1.26, 0]} castShadow>
        <boxGeometry args={[radius * 0.72, height * 0.22, radius * 0.58]} />
        <meshStandardMaterial color="#7a4a3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 1.40, 0]} castShadow>
        <boxGeometry args={[radius * 1.05, height * 0.05, radius * 0.82]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, height * 1.52, 0]} castShadow>
        <coneGeometry args={[radius * 0.55, height * 0.26, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.8} />
      </mesh>
    </>
  );
}

/** Small auxiliary hall (used flanking the capital pagoda). */
function SideHall({ x, z, radius, baseY, h }: {
  x: number; z: number;
  radius: number; baseY: number; h: number;
}) {
  return (
    <>
      <mesh position={[x, baseY + h / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[radius * 1.3, h, radius * 1.0]} />
        <meshStandardMaterial color="#a85040" roughness={0.78} />
      </mesh>
      {/* Curved roof — using cone with 4 sides */}
      <mesh position={[x, baseY + h + h * 0.18, z]} castShadow>
        <coneGeometry args={[radius * 0.95, h * 0.45, 4]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.78} />
      </mesh>
    </>
  );
}

/** Force banner flown over an owned city — a pole + waving flag. */
function CityBanner({ color, baseY, isCapital }: {
  color: string; baseY: number; isCapital: boolean;
}) {
  const flagRef = useRef<THREE.Mesh>(null);
  const poleH = isCapital ? 0.55 : 0.38;
  const flagW = isCapital ? 0.22 : 0.15;
  const flagH = isCapital ? 0.14 : 0.09;
  const flagY = baseY + poleH - flagH * 0.7;
  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(clock.elapsedTime * 3.5) * 0.18;
    }
  });
  return (
    <group>
      <mesh position={[0, baseY + poleH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, poleH, 5]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      {/* Gold finial on capital poles. */}
      {isCapital && (
        <mesh position={[0, baseY + poleH + 0.02, 0]} castShadow>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#f0d878" metalness={0.5} roughness={0.4} />
        </mesh>
      )}
      <mesh ref={flagRef} position={[flagW / 2, flagY, 0]} castShadow>
        <planeGeometry args={[flagW, flagH]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** City pillar group: walled city / pagoda / pass / hamlet by tier, with
 *  a force-colored base disk, banner, name label and selection ring. */
export function City3D({
  city, forceColor, isCapital, isSelected, terrainY, overlay, development = 0, isOwn = false, onClick,
}: {
  city: City;
  forceColor: string;
  isCapital: boolean;
  isSelected: boolean;
  terrainY: number;
  overlay: { color: string; label: string } | null;
  development?: number;
  isOwn?: boolean;
  onClick: () => void;
}) {
  const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
  const [x, z] = pxToWorld(px, py);
  // Scale by city size (population or troops) — bigger cities, taller towers.
  const sizeScore = Math.max(1, Math.min(4, city.population / 60000 + city.troops / 30000));
  const height = 0.18 + sizeScore * 0.12;
  const radius = 0.10 + sizeScore * 0.03;
  // World-size compensation: pillars stay visually reasonable as the world
  // gets bigger. The final multiplier shrinks the footprint so neighbouring
  // cities (min ~18px ≈ 2.6 hexes apart) stop overlapping — de-crowds the
  // dense clusters (Luoyang basin, Shu passes, Xiangyang/Fancheng) without
  // moving any city off its real-geography position.
  const worldScale = PIXEL_TO_WORLD * 50 * 0.6 * MARKER_SCALE;   // 0.5→0.6: cities ~20% larger to read as proper cities under the name pills (still de-crowded enough for the dense clusters)
  // Own-city beacon pulse (selection pulse lives in SelectionRing3D)
  const ownRingRef = useRef<THREE.MeshBasicMaterial>(null);
  const lang = useLanguage();
  useFrame(({ clock }) => {
    if (ownRingRef.current && isOwn) {
      ownRingRef.current.opacity = 0.55 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    }
  });

  return (
    <group position={[x, terrainY, z]} scale={worldScale}>
      {/* City base — colored disk on the ground */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius + 0.08, 16]} />
        <meshBasicMaterial color={forceColor} transparent opacity={0.45} />
      </mesh>
      {/* 我方城池 — a glowing beacon ring so your own cities pop from afar. */}
      {isOwn && (
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.18, radius + 0.30, 36]} />
          <meshBasicMaterial ref={ownRingRef} color="#86f29a" side={THREE.DoubleSide} transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
      <ChineseCity
        city={city}
        radius={radius}
        height={height}
        forceColor={forceColor}
        development={development}
        onClick={onClick}
      />
      {/* Force banner — every owned city flies its colours so ownership
       *  reads from the buildings, not just the ground grid. Capitals get
       *  a taller pole + larger flag. A razed city flies none. */}
      {city.ownerForceId && !city.ruined && (
        <CityBanner color={forceColor} baseY={height} isCapital={isCapital} />
      )}
      {/* 焦土 — a charred rubble heap + drifting smoke marks a razed city. */}
      {city.ruined && (
        <group>
          <mesh position={[0, 0.06, 0]} castShadow>
            <coneGeometry args={[radius * 1.1, 0.16, 6]} />
            <meshStandardMaterial color="#3a3128" roughness={1} />
          </mesh>
          <mesh position={[0, height * 0.6, 0]}>
            <sphereGeometry args={[radius * 0.7, 8, 6]} />
            <meshBasicMaterial color="#2a2a2a" transparent opacity={0.4} />
          </mesh>
        </group>
      )}
      {/* Port complex — pier, wharf, war junk + mast forest */}
      {/* Old in-city port docks removed — ports are now independent entities
       *  rendered by <Ports3D />. Cities with city.port=true still pass the
       *  flag for legacy lookup but no longer draw their own dock here. */}
      {/* Selection ring — shared gold twin-ring, same as battle/city maps */}
      {isSelected && <SelectionRing3D radius={radius + 0.2} y={0.04} />}
      {/* Overlay heatmap disk + value label */}
      {overlay && (
        <>
          <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius + 0.32, 16]} />
            <meshBasicMaterial color={overlay.color} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, height + 0.32, 0]} center distanceFactor={IS_MOBILE ? 9 : 6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 'bold',
              textShadow: '0 0 4px #000, 0 0 2px #000',
              whiteSpace: 'nowrap',
            }}>{overlay.label}</div>
          </Html>
        </>
      )}
      {/* City name — ALWAYS shown (RTK-XIV style) so it never flickers in and
       *  out as you zoom. A solid pill keeps it legible over any terrain; the
       *  border carries the owning realm's colour; your own cities glow green
       *  with a ★. The realm-name overlay layers on top when zoomed right out. */}
      {(
        <Html position={[0, height + 0.6, 0]} center distanceFactor={8.5} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'var(--tkm-font-body)', textAlign: 'center', width: 96 }}>
            <div style={{
              display: 'inline-block',
              fontSize: isOwn ? '13px' : '12px',
              fontWeight: 'bold',
              // 選中城池的名牌與 3D 環同步高亮:金邊、金光、微放大。
              color: isSelected ? '#fff6df' : isOwn ? '#eafff0' : '#f2e8d2',
              background: isOwn ? 'rgba(20,42,26,0.85)' : 'rgba(22,16,10,0.8)',
              border: `1.5px solid ${isSelected ? '#f0d488' : isOwn ? '#86f29a' : forceColor}`,
              borderRadius: 'var(--tkm-radius-sm)',
              padding: '0px 7px',
              whiteSpace: 'nowrap',
              boxShadow: isSelected
                ? '0 0 11px rgba(240,212,136,0.9)'
                : isOwn ? '0 0 7px rgba(120,225,150,0.65)' : '0 1px 3px rgba(0,0,0,0.5)',
              marginBottom: 2,
              transform: isSelected ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.16s cubic-bezier(0.2,0.9,0.3,1), box-shadow 0.16s ease, border-color 0.16s ease',
            }}>{isOwn ? '★ ' : ''}{pickName(city.name, lang)}</div>
            {/* Strength bars only on the selected city — keeps the map clean. */}
            {isSelected && <CityStrengthBars city={city} />}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Three thin bars rendered under a city name in the 3D map's HTML overlay.
 *  Normalized against typical max values so a small city has a thin bar and
 *  a big city fills it. Click goes through (parent has pointerEvents none). */
function CityStrengthBars({ city }: { city: City }) {
  const bar = (label: string, value: number, max: number, color: string) => {
    const pct = Math.max(0, Math.min(1, value / max));
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, fontSize: 8,
        color: '#1a1410',
      }}>
        <span style={{ width: 16, textShadow: '0 0 3px #f0e0b0', fontWeight: 'bold' }}>{label}</span>
        <div style={{
          flex: 1, height: 3, background: 'rgba(20,14,8,0.45)',
          border: '0.5px solid rgba(20,14,8,0.7)',
        }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: color }} />
        </div>
      </div>
    );
  };
  return (
    <>
      {bar('兵', city.troops,     40_000, '#b8442e')}  {/* troops */}
      {bar('金', city.gold,       20_000, '#d4a84a')}  {/* gold */}
      {bar('忠', city.loyalty,    100,    '#88b7e8')}  {/* loyalty */}
    </>
  );
}
