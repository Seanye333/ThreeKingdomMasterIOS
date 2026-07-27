/**
 * 戰場地表與天候美術 — the terrain tiles, ramparts, buildings and weather of the
 * tactical board.
 *
 * TacticalBattleScreen3D.tsx was 4,861 lines; roughly a thousand of them were
 * leaf presentational meshes (hex tiles, fieldworks, fire, bridges, forests,
 * mountains, rivers, roofs, houses, walls, gates, defence structures, the
 * instanced tile prisms and board skirt, and the rain/snow/haze/lightning/wind
 * layers) that only ever read their own props. Lifted here unchanged — same
 * code, same behaviour — so the file holding the actual battle logic is a
 * fifth smaller and these can be read without scrolling past it.
 *
 * Nothing here is used elsewhere; the exports exist so the screen imports them
 * back. (Same treatment as officerDetail/Sections.tsx.)
 */
import { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HexCoord, TacticalBattle, TacticalTile, TacticalUnit, TimeOfDay, Weather } from '../../../game/types';
import type { DefenseBuildingId } from '../../../game/data/defenseBuildings';
import { hexNeighbours, tileAt } from '../../../game/systems/tactical';
import { hexWorld, HEX_R, TERRAIN_HEIGHT, TERRAIN_COLOR } from './battleGrid';
import { groundNormalTexture, groundRoughnessTexture } from '../battleTextures';
import { EmbeddedSceneCtx, IS_MOBILE } from './shared';
import { playSfx } from '../../../game/systems/sound';

const R = HEX_R;
/** Shared normal-map scale — one Vector2 for every surface (never per-frame). */
const SURFACE_NORMAL_SCALE = new THREE.Vector2(0.5, 0.5);



/* ─── Time-of-day lighting presets ──────────────────────────────────── */
export interface LightingPreset {
  sky: [string, string];       // sky gradient (top, bottom)
  ambient: number;
  sun: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number };
  fog: [string, number, number];  // color, near, far
  showStars: boolean;
}
export const LIGHTING: Record<TimeOfDay, LightingPreset> = {
  dawn: {
    sky: ['#3a4a70', '#e0a878'],
    ambient: 0.45,
    sun: { color: '#ffc080', intensity: 1.0, position: [-12, 6, 6] },
    fill: { color: '#5a8acf', intensity: 0.25 },
    fog: ['#c08a60', 32, 75],
    showStars: false,
  },
  day: {
    sky: ['#5a8acf', '#8aafd0'],
    ambient: 0.6,
    sun: { color: '#fff5e0', intensity: 1.2, position: [10, 18, 6] },
    fill: { color: '#f0c890', intensity: 0.25 },
    fog: ['#a8bfd0', 35, 80],
    showStars: false,
  },
  dusk: {
    sky: ['#3a2a50', '#e07840'],
    ambient: 0.4,
    sun: { color: '#ff8050', intensity: 1.0, position: [12, 4, -8] },
    fill: { color: '#7050a0', intensity: 0.3 },
    fog: ['#704050', 28, 65],
    showStars: false,
  },
  night: {
    sky: ['#0a0f28', '#1a2440'],
    ambient: 0.25,
    sun: { color: '#a8c0ff', intensity: 0.5, position: [4, 14, 8] },  // moon
    fill: { color: '#506080', intensity: 0.2 },
    fog: ['#0a1020', 22, 55],
    showStars: true,
  },
};

/* ─── Weather presets ───────────────────────────────────────────────── */
export const WEATHER_FOG_MUL: Record<Weather, number> = {
  clear: 1.0,
  rain:  0.7,
  fog:   0.4,
  snow:  0.65,
  wind:  0.85,
};

/* ─── A single hex tile + its terrain art (trees, peaks, water) ─────── */
export function HexTile({
  tile, onClick, hovered, highlight, windStrength, burning = false, instancedBase = false,
}: {
  tile: TacticalTile;
  onClick: () => void;
  hovered: boolean;
  /** The battle board draws all prisms in ONE InstancedMesh (see
   *  InstancedTilePrisms); the tile then skips its own prism and keeps
   *  only interaction + overlays. City map keeps per-tile prisms. */
  instancedBase?: boolean;
  /** 'move' = walkable destination, 'attack' = attackable enemy hex,
   *  'path' = a queued march waypoint, 'cast' = in stratagem range,
   *  'aoe' = splash of the hovered cast, undefined = no highlight */
  highlight: 'move' | 'attack' | 'path' | 'cast' | 'aoe' | undefined;
  windStrength: number;
  /** 火攻 — this hex is ablaze (ground fire). */
  burning?: boolean;
}) {
  const [x, z] = hexWorld(tile.coord.col, tile.coord.row);
  const h = TERRAIN_HEIGHT[tile.terrain];
  const baseColor = TERRAIN_COLOR[tile.terrain];
  // 地表質感 — shared procedural grain + a deterministic per-hex tint jitter so
  // a field of one terrain stops looking like a single flat slab.
  const surf = useMemo(() => ({ normal: groundNormalTexture(), rough: groundRoughnessTexture() }), []);
  const tint = useMemo(() => {
    const c = new THREE.Color(baseColor);
    const j = ((((tile.coord.col * 73856093) ^ (tile.coord.row * 19349663)) >>> 0) % 1000) / 1000;
    c.offsetHSL((j - 0.5) * 0.02, (j - 0.5) * 0.05, (j - 0.5) * 0.07);
    return c;
  }, [baseColor, tile.coord.col, tile.coord.row]);
  const pulseRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (pulseRef.current && highlight) {
      pulseRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.22;
    }
  });
  // 高亮配色 — brighter, more saturated than the terrain so move/attack/path
  // reads at a glance on a phone.
  const hlColor = highlight === 'move' ? '#5ef088'
    : highlight === 'path' ? '#ffd24a'
    : highlight === 'cast' ? '#7fb4ff'
    : highlight === 'aoe' ? '#ff9c3a' : '#ff6242';

  return (
    <group position={[x, 0, z]}>
      {/* Hex prism — 6-sided cylinder, height by terrain. Skipped when the
          board batches all prisms into one InstancedMesh. */}
      {!instancedBase && (
        <mesh
          position={[0, h / 2, 0]}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          receiveShadow
          castShadow
        >
          <cylinderGeometry args={[R * 0.98, R * 0.98, h, 6]} />
          <meshStandardMaterial
            color={hovered ? '#f0e0b0' : tint}
            normalMap={surf.normal ?? undefined}
            normalScale={SURFACE_NORMAL_SCALE}
            roughnessMap={surf.rough ?? undefined}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      )}
      {/* 觸控擴大命中區 — a flat invisible disk over the whole hex top makes the
          tile easy to tap on a phone. It sits low (at the hex surface) so the
          taller unit figures still win the raycast and stay individually tappable. */}
      <mesh
        position={[0, h + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <circleGeometry args={[R, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Highlight overlay — pulsing filled hex + a crisp outline ring so a
          walkable / attackable / path tile pops against the terrain. */}
      {highlight && (
        <group position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <mesh raycast={() => null}>
            <circleGeometry args={[R * 0.9, 6]} />
            <meshBasicMaterial
              ref={pulseRef}
              color={hlColor}
              transparent opacity={0.5} side={THREE.DoubleSide}
              toneMapped={false} depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0, 0.002]} raycast={() => null}>
            <ringGeometry args={[R * 0.82, R * 0.93, 6]} />
            <meshBasicMaterial color={hlColor} transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      )}
      {/* Terrain decoration on top */}
      {tile.terrain === 'forest' && <ForestArt y={h} windStrength={windStrength} />}
      {tile.terrain === 'mountain' && <MountainArt y={h} />}
      {tile.terrain === 'river' && <RiverArt y={h} />}
      {tile.terrain === 'bridge' && <BridgeArt y={h} />}
      {tile.terrain === 'fieldworks' && <FieldworksArt y={h} />}
      {burning && <FireArt y={h} />}
    </group>
  );
}

/** 陣中築壘 — a ring of sharpened stakes leaning outward over a fresh earth
 *  bank, with a crossed 拒馬 frame at the front. Reads as dug-in ground. */
export function FieldworksArt({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* Fresh earth bank */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[R * 0.72, R * 0.85, 0.08, 8]} />
        <meshStandardMaterial color="#6a5236" roughness={0.98} />
      </mesh>
      {/* Outward-leaning sharpened stakes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.26;
        const px = Math.cos(a) * R * 0.68, pz = Math.sin(a) * R * 0.68;
        return (
          <mesh key={i} position={[px, 0.22, pz]} rotation={[Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]} castShadow>
            <coneGeometry args={[0.05, 0.42, 5]} />
            <meshStandardMaterial color="#8a6a42" roughness={0.9} />
          </mesh>
        );
      })}
      {/* 拒馬 — crossed-stake frame on a bar */}
      <group position={[0, 0.16, R * 0.3]} rotation={[0, 0.35, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, R * 0.9, 5]} />
          <meshStandardMaterial color="#5a4226" roughness={0.9} />
        </mesh>
        {[-0.28, 0, 0.28].map((px, i) => (
          <group key={i} position={[px, 0, 0]}>
            <mesh rotation={[0.7, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.36, 4]} />
              <meshStandardMaterial color="#7a5c38" roughness={0.9} />
            </mesh>
            <mesh rotation={[-0.7, 0, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.36, 4]} />
              <meshStandardMaterial color="#7a5c38" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** 火攻 — licking flames + ember glow on a burning hex. */
export function FireArt({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) {
      ref.current.children.forEach((m, i) => {
        const f = 1 + Math.sin(t * 7 + i * 2.1) * 0.25;
        m.scale.set(f, 1 + Math.sin(t * 9 + i) * 0.35, f);
      });
    }
    // 濃煙升騰 — smoke climbs and fades, so a fire field reads as spreading.
    if (smokeRef.current) {
      smokeRef.current.children.forEach((m, i) => {
        const cycle = (t * 0.5 + i * 0.33) % 1;
        m.position.y = 0.6 + cycle * 2.4;
        m.position.x = Math.sin(t * 0.6 + i) * 0.3 * cycle;
        const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (1 - cycle) * 0.32;
        const sc = 0.3 + cycle * 0.6;
        m.scale.set(sc, sc, sc);
      });
    }
  });
  return (
    <group position={[0, y, 0]}>
      {/* Ember-lit ground */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 0.8, 6]} />
        <meshStandardMaterial color="#3a1408" emissive="#c84a10" emissiveIntensity={0.8} roughness={0.9} />
      </mesh>
      {/* Licking flames */}
      <group ref={ref}>
        {[[-0.3, -0.15, 0.5], [0.25, 0.2, 0.65], [0, -0.3, 0.45], [0.05, 0.32, 0.4]].map(([px, pz, ph], i) => (
          <mesh key={i} position={[px, ph / 2, pz]}>
            <coneGeometry args={[0.16, ph, 6]} />
            <meshStandardMaterial
              color={i % 2 ? '#ff9a28' : '#ff5a14'}
              emissive={i % 2 ? '#ffb840' : '#ff6a1a'}
              emissiveIntensity={1.8}
              transparent opacity={0.85}
            />
          </mesh>
        ))}
      </group>
      {/* Rising smoke */}
      <group ref={smokeRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.6, 0]} raycast={() => null}>
            <sphereGeometry args={[0.26, 6, 6]} />
            <meshBasicMaterial color={i % 2 ? '#4a423a' : '#5c5048'} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 浮橋/渡口 — timber pontoon deck over the water: plank deck, side
 *  rails and mooring posts, with water shimmering beneath the spans. */
export function BridgeArt({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {/* Water beneath the spans */}
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R * 0.85, 6]} />
        <meshStandardMaterial color="#3a6a98" roughness={0.35} metalness={0.45} />
      </mesh>
      {/* Plank deck — slats across the crossing direction */}
      {[-0.52, -0.26, 0, 0.26, 0.52].map((px, i) => (
        <mesh key={i} position={[px, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.05, 1.05]} />
          <meshStandardMaterial color={i % 2 ? '#8a6840' : '#7a5c38'} roughness={0.85} />
        </mesh>
      ))}
      {/* Side rails */}
      {[-0.45, 0.45].map((pz, i) => (
        <mesh key={`r${i}`} position={[0, 0.16, pz]} castShadow>
          <boxGeometry args={[1.3, 0.04, 0.05]} />
          <meshStandardMaterial color="#5a4226" roughness={0.85} />
        </mesh>
      ))}
      {/* Mooring posts at the four rail ends */}
      {[[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.45], [0.6, 0.45]].map(([px, pz], i) => (
        <mesh key={`p${i}`} position={[px, 0.14, pz]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.26, 6]} />
          <meshStandardMaterial color="#4a3826" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function ForestArt({ y, windStrength }: { y: number; windStrength: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && windStrength > 0) {
      // Subtle tree sway
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.4) * 0.04 * windStrength;
    }
  });
  return (
    <group ref={ref} position={[0, y, 0]}>
      {[[-0.35, -0.2, 0.55], [0.35, 0.2, 0.65], [-0.1, 0.35, 0.5]].map(([px, pz, ph], i) => (
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, ph / 2, 0]} castShadow>
            <coneGeometry args={[0.28, ph, 6]} />
            <meshStandardMaterial color="#2d4a28" roughness={0.9} />
          </mesh>
          <mesh position={[0, ph * 0.75, 0]} castShadow>
            <coneGeometry args={[0.2, ph * 0.5, 6]} />
            <meshStandardMaterial color="#3a5a32" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function MountainArt({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <coneGeometry args={[0.85, 1.1, 6]} />
        <meshStandardMaterial color="#5a4530" roughness={0.95} />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <coneGeometry args={[0.32, 0.2, 6]} />
        <meshStandardMaterial color="#f0e0b0" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function RiverArt({ y }: { y: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
    }
  });
  return (
    <mesh position={[0, y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[R * 0.85, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color="#3a6a98"
        emissive="#5a9bc8"
        emissiveIntensity={0.15}
        roughness={0.3}
        metalness={0.5}
      />
    </mesh>
  );
}

// (unit visuals — mounts, weapons, retinues, banners, the full WarriorFigure
//  and UnitMesh — live in battle3d/UnitVisuals3D.tsx.)

function shadeHex(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** A swept Chinese hip roof (matches the city-interior fidelity) — opaque
 *  eave slab + 4-sided pyramid + ridge beam + upturned corner tips. */
export function SweptRoof3D({ size, color = '#39444f' }: { size: number; color?: string }) {
  const eave = size + 0.2;
  const roofH = 0.22 + eave * 0.16;
  const ridge = shadeHex(color, 1.4);
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[eave, 0.08, eave]} />
        <meshStandardMaterial color={shadeHex(color, 0.85)} roughness={0.66} metalness={0.12} />
      </mesh>
      <mesh position={[0, roofH / 2 + 0.06, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[eave * 0.72, roofH, 4]} />
        <meshStandardMaterial color={color} roughness={0.62} metalness={0.16} />
      </mesh>
      <mesh position={[0, roofH + 0.04, 0]} castShadow>
        <boxGeometry args={[eave * 0.5, 0.08, 0.1]} />
        <meshStandardMaterial color={ridge} roughness={0.55} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * eave * 0.45, 0.12, sz * eave * 0.45]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[0.07, 0.22, 4]} />
          <meshStandardMaterial color={ridge} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** A humble town house inside the walls — mud-brick body + tiled pyramid
 *  roof, size/rotation varied per coord so the streets feel lived-in. */
export function TownHouse({ coord }: { coord: HexCoord }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const h = 0.34 + ((coord.col * 11 + coord.row * 17) % 4) * 0.05;
  const w = 0.55 + ((coord.col * 5 + coord.row * 3) % 3) * 0.08;
  const rot = ((coord.col * 13 + coord.row * 7) % 4) * (Math.PI / 8);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w * 0.8]} />
        <meshStandardMaterial color="#9a8468" roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.78, 0.26, 4]} />
        <meshStandardMaterial color="#39444f" roughness={0.75} />
      </mesh>
    </group>
  );
}

/**
 * 崩落 — which merlons have been knocked off a battered wall.
 *
 * Deterministic per hex and per merlon, so a wall doesn't reshuffle its damage
 * every frame: each merlon gets a stable 0..1 threshold from its coordinates
 * and falls once the wall has taken more damage than that. Spreading the
 * thresholds (rather than knocking them out in index order) keeps neighbouring
 * wall hexes from crumbling in the same visible pattern.
 */
function merlonGone(coord: HexCoord, i: number, damage: number): boolean {
  const h = ((coord.col * 73856093) ^ (coord.row * 19349663) ^ (i * 83492791)) >>> 0;
  return damage > 0.15 + ((h % 100) / 100) * 0.8;
}

/** Soot and bare stone as masonry is beaten down. */
function batteredStone(base: string, damage: number): string {
  return new THREE.Color(base).lerp(new THREE.Color('#3b3230'), damage * 0.55).getStyle();
}

export function CityWall({ coord, bannerColor, rotY = 0, damage = 0 }: { coord: HexCoord; bannerColor: string; rotY?: number; damage?: number }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const pennantRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pennantRef.current) {
      pennantRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.3;
    }
  });
  // The body slumps a little as it is beaten down, so a failing wall reads as
  // lower than a sound one even from a shallow camera angle.
  const bodyH = 1.4 - damage * 0.22;
  const stone = batteredStone('#6a5540', damage);
  const merlonStone = batteredStone('#7a6550', damage);
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Wall body — thick stone block */}
      <mesh position={[0, bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, bodyH, 1.6]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
      {/* Tiled coping along the wall-walk — shears off once the wall is failing. */}
      {damage < 0.75 && (
        <mesh position={[0, bodyH + 0.02, 0]} castShadow>
          <boxGeometry args={[1.68, 0.1, 1.68]} />
          <meshStandardMaterial color={batteredStone('#39444f', damage)} roughness={0.7} />
        </mesh>
      )}
      {/* Crenellations on top edge — knocked out one by one under bombardment. */}
      {[-0.6, -0.2, 0.2, 0.6].map((px, i) => !merlonGone(coord, i, damage) && (
        <mesh key={i} position={[px, bodyH + 0.1, 0.6]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color={merlonStone} roughness={0.92} />
        </mesh>
      ))}
      {[-0.6, -0.2, 0.2, 0.6].map((px, i) => !merlonGone(coord, i + 4, damage) && (
        <mesh key={`b${i}`} position={[px, bodyH + 0.1, -0.6]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color={merlonStone} roughness={0.92} />
        </mesh>
      ))}
      {/* Rubble piling at the foot of a wall that has taken real punishment. */}
      {damage > 0.35 && [0, 1, 2, 3].map((i) => {
        const h = ((coord.col * 40503) ^ (coord.row * 12289) ^ (i * 6151)) >>> 0;
        const s = 0.1 + ((h >> 3) % 9) / 60;
        return (
          <mesh
            key={`rub${i}`}
            position={[-0.9 + ((h % 7) / 7) * 0.5, s * 0.5, -0.7 + ((h >> 6) % 15) / 10]}
            rotation={[0, ((h >> 9) % 12) / 2, 0]}
            castShadow
          >
            <boxGeometry args={[s, s, s * 0.8]} />
            <meshStandardMaterial color={merlonStone} roughness={0.95} />
          </mesh>
        );
      })}
      {/* Banner pole + flag — the colours come down when the wall is about to go. */}
      {damage < 0.8 && (
        <>
          <mesh position={[0.6, bodyH + 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
            <meshStandardMaterial color="#1a1410" />
          </mesh>
          <mesh ref={pennantRef} position={[0.85, bodyH + 1.1, 0]} castShadow>
            <planeGeometry args={[0.5, 0.3]} />
            <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** A grand gatehouse for the centre of a besieged wall — a two-storey tower
 *  with red columns, a swept double-eave roof and a fluttering banner. */
export function WallGate3D({ coord, bannerColor, rotY = 0, damage = 0 }: { coord: HexCoord; bannerColor: string; rotY?: number; damage?: number }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const pennant = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pennant.current) pennant.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.3;
  });
  const stone = batteredStone('#6a5540', damage);
  // The ram works on the door, so that is where the damage has to read: the
  // leaves splinter, then buckle inward off their hinges.
  const doorSag = damage * 0.34;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Gate base + tiled coping */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.7, 1.6]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.74, 0]} castShadow>
        <boxGeometry args={[1.68, 0.1, 1.68]} />
        <meshStandardMaterial color={batteredStone('#39444f', damage)} roughness={0.7} />
      </mesh>
      {/* Wooden gate door facing the attackers (-x) — splits into two buckling
          leaves as the ram works on it, and hangs open when it is nearly through. */}
      <group position={[-0.82, 0.62, 0]} rotation={[doorSag * 0.5, 0, 0]}>
        {[-0.18, 0.18].map((dz, i) => (
          <mesh
            key={i}
            position={[i === 0 ? -doorSag * 0.12 : doorSag * 0.1, 0, dz * (1 + doorSag)]}
            rotation={[0, (i === 0 ? -1 : 1) * doorSag * 0.8, 0]}
            castShadow
          >
            <boxGeometry args={[0.04, 1.1 - doorSag * 0.18, 0.34]} />
            <meshStandardMaterial color={batteredStone('#4a2f1a', damage * 0.7)} roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* Splintered timber at the threshold once the ram has bitten. */}
      {damage > 0.4 && [0, 1, 2].map((i) => {
        const h = ((coord.col * 27644437) ^ (coord.row * 3860031) ^ (i * 40503)) >>> 0;
        return (
          <mesh
            key={`spl${i}`}
            position={[-0.95 - ((h % 5) / 20), 0.06, -0.4 + ((h >> 4) % 9) / 10]}
            rotation={[0, ((h >> 8) % 12) / 2, Math.PI / 2.2]}
            castShadow
          >
            <boxGeometry args={[0.05, 0.34, 0.05]} />
            <meshStandardMaterial color="#3a2412" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Upper storey + red columns */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.8, 1.15]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.78} />
      </mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((pz, i) => (
        <mesh key={i} position={[-0.6, 1.95, pz]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Swept double-eave roof */}
      <group position={[0, 2.65, 0]}><SweptRoof3D size={1.6} color="#2f3a48" /></group>
      <group position={[0, 3.05, 0]}><SweptRoof3D size={1.1} color="#2f3a48" /></group>
      {/* Pennant */}
      <mesh position={[0, 3.6, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh ref={pennant} position={[0.2, 3.72, 0]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Defense building (watchtower / beacon / etc.) ─────────────── */
const DEFENSE_BUILDING_VISUAL: Record<DefenseBuildingId, { color: string; height: number; glyph: string }> = {
  'watchtower':     { color: 'var(--tkm-hud-gold)', height: 1.8, glyph: '箭' },
  'beacon':         { color: 'var(--tkm-hud-crimson)', height: 1.6, glyph: '烽' },
  'caltrops':       { color: '#7a6750', height: 0.3, glyph: '拒' },
  'lookout':        { color: 'var(--tkm-hud-blue)', height: 1.5, glyph: '瞭' },
  'barracks-out':   { color: '#a87858', height: 1.0, glyph: '營' },
  'granary-out':    { color: '#b8c87a', height: 1.0, glyph: '倉' },
  'iron-chains':    { color: '#5a4530', height: 0.4, glyph: '索' },
  'rockfall':       { color: '#4a3a30', height: 1.2, glyph: '石' },
  'arrow-platform': { color: '#c19a3b', height: 1.4, glyph: '台' },
};
export function DefenseStructure({
  coord, buildingId, level, hp, maxHp,
}: {
  coord: HexCoord;
  buildingId: DefenseBuildingId;
  level: number;
  hp: number;
  maxHp: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const visual = DEFENSE_BUILDING_VISUAL[buildingId];
  const hpPct = Math.max(0, Math.min(1, hp / maxHp));
  const embedded = useContext(EmbeddedSceneCtx);
  const isFlame = buildingId === 'beacon';
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current && isFlame) {
      flameRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 8) * 0.2;
    }
  });
  const roofed = buildingId === 'watchtower' || buildingId === 'lookout'
    || buildingId === 'arrow-platform' || buildingId === 'barracks-out' || buildingId === 'granary-out';
  return (
    <group position={[x, 0.1, z]}>
      {/* Tower base — tapered */}
      <mesh position={[0, visual.height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.55, visual.height, 8]} />
        <meshStandardMaterial color={visual.color} roughness={0.85} />
      </mesh>
      {/* Swept tiled roof for the tall fortifications; a plain cap otherwise */}
      {roofed ? (
        <group position={[0, visual.height, 0]}>
          <SweptRoof3D size={1.05} color="#39444f" />
        </group>
      ) : (
        <mesh position={[0, visual.height + 0.2, 0]} castShadow>
          <coneGeometry args={[0.55, 0.4, 8]} />
          <meshStandardMaterial color="#3a2818" roughness={0.9} />
        </mesh>
      )}
      {/* Beacon: flickering flame */}
      {isFlame && (
        <mesh ref={flameRef} position={[0, visual.height + 0.55, 0]}>
          <coneGeometry args={[0.2, 0.5, 8]} />
          <meshBasicMaterial color="#ff8030" transparent opacity={0.9} />
        </mesh>
      )}
      {isFlame && (
        <pointLight position={[0, visual.height + 0.5, 0]} color="#ff6020" intensity={2} distance={4} />
      )}
      {/* HTML label with HP bar (skipped in the embedded diorama) */}
      {!embedded && <Html position={[0, visual.height + 1.0, 0]} center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${visual.color}`,
          padding: '1px 5px',
          fontFamily: 'var(--tkm-font-body)',
          fontSize: '11px',
          color: visual.color,
          textAlign: 'center',
          borderRadius: 'var(--tkm-radius-xs)',
          whiteSpace: 'nowrap',
        }}>
          {visual.glyph} {'★'.repeat(level)}
          <div style={{ height: 2, background: '#1a1410', marginTop: 1, width: 36 }}>
            <div style={{
              height: '100%', width: `${Math.round(hpPct * 100)}%`,
              background: hpPct > 0.5 ? 'var(--tkm-hud-green)' : 'var(--tkm-hud-crimson)',
            }} />
          </div>
        </div>
      </Html>}
    </group>
  );
}

/** 棋盤一体成型 — every tile prism in ONE InstancedMesh: a 216-cell board
 *  drops ~216 shadow-casting meshes to a single draw (+ single depth pass).
 *  Per-instance color carries the terrain tint (same jitter hash as
 *  HexTile) and the hover flash; interaction stays on each tile's
 *  invisible hit disk, so clicks/hover behave exactly as before. */
export function InstancedTilePrisms({ tiles, hovered }: { tiles: TacticalTile[]; hovered: HexCoord | null }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const surf = useMemo(() => ({ normal: groundNormalTexture(), rough: groundRoughnessTexture() }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Layout effects: matrices + instance colours must land BEFORE the first
  // painted frame — the shader compiles with (or without) instancing colour
  // on first render, and a colour-less first compile leaves the board white.
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    tiles.forEach((t, i) => {
      const [x, z] = hexWorld(t.coord.col, t.coord.row);
      const h = TERRAIN_HEIGHT[t.terrain];
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(1, Math.max(0.001, h), 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [tiles, dummy]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    tiles.forEach((t, i) => {
      if (hovered && hovered.col === t.coord.col && hovered.row === t.coord.row) {
        c.set('#f0e0b0');
      } else {
        c.set(TERRAIN_COLOR[t.terrain]);
        const j = ((((t.coord.col * 73856093) ^ (t.coord.row * 19349663)) >>> 0) % 1000) / 1000;
        c.offsetHSL((j - 0.5) * 0.02, (j - 0.5) * 0.05, (j - 0.5) * 0.07);
      }
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [tiles, hovered]);
  return (
    <instancedMesh
      key={tiles.length}
      ref={ref}
      args={[undefined, undefined, tiles.length]}
      castShadow
      receiveShadow
      raycast={() => null}
    >
      <cylinderGeometry args={[R * 0.98, R * 0.98, 1, 6]} />
      <meshStandardMaterial
        color="#ffffff"
        normalMap={surf.normal ?? undefined}
        normalScale={SURFACE_NORMAL_SCALE}
        roughnessMap={surf.rough ?? undefined}
        roughness={0.92}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

/** 戰場收邊 — two rings of fading ghost hexes beyond the board's true
 *  edge (each wearing its nearest real tile's terrain colour), so the
 *  battlefield dissolves into the dark ground instead of ending at a
 *  cliff. Pure dressing: no raycast, no shadows, two draw calls. */
export function BoardSkirt({ tiles }: { tiles: TacticalTile[] }) {
  const rings = useMemo(() => {
    const board = new Map<string, TacticalTile>();
    for (const t of tiles) board.set(`${t.coord.col},${t.coord.row}`, t);
    const nbsOf = (c: number, r: number) => (c & 1
      ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
      : [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]])
      .map(([dc, dr]) => ({ col: c + dc, row: r + dr }));
    const grow = (seen: Set<string>, seeds: Array<{ col: number; row: number }>) => {
      const ring: Array<{ col: number; row: number; near: TacticalTile }> = [];
      for (const sd of seeds) {
        for (const nb of nbsOf(sd.col, sd.row)) {
          const k = `${nb.col},${nb.row}`;
          if (board.has(k) || seen.has(k)) continue;
          seen.add(k);
          // nearest real tile = the seed we grew from (good enough for tint)
          const near = board.get(`${sd.col},${sd.row}`) ?? ring.find(() => true)?.near ?? tiles[0];
          ring.push({ col: nb.col, row: nb.row, near });
        }
      }
      return ring;
    };
    const seen = new Set<string>(board.keys());
    const ring1 = grow(seen, tiles.map((t) => t.coord));
    const r1ByKey = new Map(ring1.map((c) => [`${c.col},${c.row}`, c]));
    const ring2raw = grow(seen, ring1);
    const ring2 = ring2raw.map((c) => {
      // inherit tint through ring1
      const parent = nbsOf(c.col, c.row).map((nb) => r1ByKey.get(`${nb.col},${nb.row}`)).find(Boolean);
      return { ...c, near: parent?.near ?? c.near };
    });
    return { ring1, ring2 };
  }, [tiles]);
  const ringMesh = (cells: Array<{ col: number; row: number; near: TacticalTile }>, opacity: number, keyId: string) => {
    if (cells.length === 0) return null;
    return (
      <SkirtRingMesh key={`${keyId}-${cells.length}`} cells={cells} opacity={opacity} />
    );
  };
  return <group raycast={() => null}>{ringMesh(rings.ring1, 0.4, 'r1')}{ringMesh(rings.ring2, 0.16, 'r2')}</group>;
}

function SkirtRingMesh({ cells, opacity }: {
  cells: Array<{ col: number; row: number; near: TacticalTile }>; opacity: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    cells.forEach((cell, i) => {
      const [x, z] = hexWorld(cell.col, cell.row);
      dummy.position.set(x, 0.015, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      c.set(TERRAIN_COLOR[cell.near.terrain]).offsetHSL(0, -0.08, -0.1);
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [cells, dummy]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} raycast={() => null}>
      <circleGeometry args={[R * 0.96, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity} depthWrite={false} />
    </instancedMesh>
  );
}

/** 控制區紅網 — while one of YOUR units is selected, every cell adjacent
 *  to a visible living enemy wears a thin red hex net: melee is sticky
 *  (breaking contact costs +1 AP), and this shows exactly where the line
 *  grips. Pure overlay, no raycast. */
export function ZocOverlay({ battle, selectedUnit, playerSide }: {
  battle: TacticalBattle;
  selectedUnit: TacticalUnit | null;
  playerSide: 'attacker' | 'defender' | null;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cells = useMemo(() => {
    if (!selectedUnit || !playerSide || selectedUnit.side !== playerSide) return [];
    const occupied = new Set(battle.units.filter((u) => u.troops > 0).map((u) => `${u.coord.col},${u.coord.row}`));
    const seen = new Set<string>();
    const out: HexCoord[] = [];
    for (const e of battle.units) {
      if (e.side === playerSide || e.troops <= 0 || e.hidden) continue;
      for (const nb of hexNeighbours(e.coord)) {
        const k = `${nb.col},${nb.row}`;
        if (seen.has(k) || occupied.has(k)) continue;
        const tl = tileAt(battle, nb);
        if (!tl) continue;
        seen.add(k);
        out.push(nb);
      }
    }
    return out;
  }, [battle, selectedUnit, playerSide]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m || cells.length === 0) return;
    cells.forEach((c, i) => {
      const [x, z] = hexWorld(c.col, c.row);
      const h = TERRAIN_HEIGHT[tileAt(battle, c)?.terrain ?? 'plain'];
      dummy.position.set(x, h + 0.03, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [cells, dummy, battle]);
  if (cells.length === 0) return null;
  return (
    <instancedMesh key={cells.length} ref={ref} args={[undefined, undefined, cells.length]} raycast={() => null}>
      <ringGeometry args={[R * 0.7, R * 0.86, 6]} />
      <meshBasicMaterial color="#c0504a" transparent opacity={0.3} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── Weather particles ─────────────────────────────────────────── */
export function RainParticles({ count = 800, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.5,
      z: (Math.random() - 0.5) * bounds.z * 1.5,
      y: Math.random() * 18,
      speed: 14 + Math.random() * 8,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 18;
      dummy.position.set(s.x, s.y, s.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.012, 0.012, 0.3, 4]} />
      <meshBasicMaterial color="#a8c8e8" transparent opacity={0.45} />
    </instancedMesh>
  );
}
/** 風雷 — occasional lightning over a rainstorm: a high blue-white flash lights
 *  the whole field, with a delayed thunder rumble. Mounted only in rain. */
export function StormLightning() {
  const lightRef = useRef<THREE.PointLight>(null);
  const next = useRef(2 + Math.random() * 5);
  const flash = useRef(0);
  useFrame((_, delta) => {
    next.current -= delta;
    if (next.current <= 0) {
      // A flicker — a sharp strike, sometimes a quick double-flash.
      flash.current = 1;
      next.current = 5 + Math.random() * 8;
      const boom = 180 + Math.random() * 500;
      window.setTimeout(() => playSfx('quake'), boom);
    }
    if (flash.current > 0) {
      flash.current = Math.max(0, flash.current - delta * 4.5);
      // A little crackle on the way down so it doesn't read as a smooth fade.
      const crackle = 0.7 + 0.3 * Math.sin(flash.current * 30);
      if (lightRef.current) lightRef.current.intensity = flash.current * crackle * 3.2;
    }
  });
  return <pointLight ref={lightRef} position={[0, 28, 6]} color="#cfe0ff" intensity={0} distance={140} decay={0.6} />;
}

/** 戰塵 — a low, slow drift of soft haze puffs over the field: the dust and
 *  smoke of an army in the field. Camera-facing billboards at very low opacity,
 *  tinted to the time-of-day fog so dawn/dusk/night read right. */
export function BattleHaze({ bounds, tint, count = 22 }: { bounds: { x: number; z: number }; tint: string; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.7,
      z: (Math.random() - 0.5) * bounds.z * 1.7,
      y: 0.4 + Math.random() * 1.5,
      sx: 2.4 + Math.random() * 2.8,
      sy: 1.3 + Math.random() * 1.6,
      speed: 0.1 + Math.random() * 0.16,
      drift: Math.random() * Math.PI * 2,
    })),
  [count, bounds.x, bounds.z]);
  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return;
    const lx = bounds.x * 0.9, lz = bounds.z * 0.9;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.x += Math.cos(s.drift) * s.speed * delta;
      s.z += Math.sin(s.drift) * s.speed * delta;
      if (s.x > lx) s.x = -lx; else if (s.x < -lx) s.x = lx;
      if (s.z > lz) s.z = -lz; else if (s.z < -lz) s.z = lz;
      dummy.position.set(s.x, s.y, s.z);
      dummy.lookAt(camera.position);
      dummy.scale.set(s.sx, s.sy, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={tint} transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

export function SnowParticles({ count = 600, bounds }: { count?: number; bounds: { x: number; z: number } }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.5,
      z: (Math.random() - 0.5) * bounds.z * 1.5,
      y: Math.random() * 18,
      speed: 0.8 + Math.random() * 0.7,
      drift: Math.random() * Math.PI * 2,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.y -= s.speed * delta;
      if (s.y < 0) s.y = 18;
      dummy.position.set(s.x + Math.sin(t + s.drift) * 0.3, s.y, s.z + Math.cos(t * 0.7 + s.drift) * 0.3);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}
/** 風向 — faint motion-streaks drifting across the field in the wind direction,
 *  so the wind that fuels 火계/順風 isn't just a HUD word. */
export function WindStreaks({ bounds, dir }: { bounds: { x: number; z: number }; dir: 'east' | 'west' | 'south' | 'north' }) {
  const count = IS_MOBILE ? 36 : 72;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [dvx, dvz] = dir === 'east' ? [1, 0] : dir === 'west' ? [-1, 0] : dir === 'south' ? [0, 1] : [0, -1];
  const alongZ = dir === 'north' || dir === 'south';
  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * bounds.x * 1.7,
      z: (Math.random() - 0.5) * bounds.z * 1.7,
      y: 0.4 + Math.random() * 3.2,
      len: 0.6 + Math.random() * 0.8,
    })),
  [count, bounds.x, bounds.z]);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const sp = 9 * delta;
    const hx = bounds.x * 0.9, hz = bounds.z * 0.9;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.x += dvx * sp; s.z += dvz * sp;
      if (s.x > hx) s.x = -hx; else if (s.x < -hx) s.x = hx;
      if (s.z > hz) s.z = -hz; else if (s.z < -hz) s.z = hz;
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, alongZ ? Math.PI / 2 : 0, 0);
      dummy.scale.set(s.len, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} raycast={() => null}>
      <boxGeometry args={[0.5, 0.018, 0.018]} />
      <meshBasicMaterial color="#e8e4d6" transparent opacity={0.22} depthWrite={false} />
    </instancedMesh>
  );
}
