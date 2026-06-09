import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import {
  DEFENSE_BUILDINGS,
  type DefenseBuildingId,
  aggregateSlotEffects,
} from '../../game/data/defenseBuildings';
import { previewBattlefield } from '../../game/systems/tactical';
import { citySize } from '../../game/systems/citySize';
import type { EntityId, BuildingId } from '../../game/types';
import { useLanguage } from '../i18n';
// Reuse the polished 3D primitives from the tactical battle scene so the
// city map matches its visual fidelity — terrain art, lighting, walls.
import {
  hexWorld,
  HEX_COL_STEP,
  HEX_ROW_STEP,
  HexTile,
  DefenseStructure,
} from './TacticalBattleScreen3D';

/**
 * 3D version of CityMapScreen — uses the same hex tile / lighting /
 * structure primitives as the live tactical battle, so what you see
 * planning defenses is what you get when sieged.
 */

const INSIDE_BUILDING_DEF: Record<BuildingId, { glyph: string; color: string; height: number; nameZh: string }> = {
  barracks: { glyph: '營', color: '#a87858', height: 1.4, nameZh: '兵營' },
  market:   { glyph: '市', color: '#d4a84a', height: 1.0, nameZh: '市場' },
  foundry:  { glyph: '鐵', color: '#7a6750', height: 1.5, nameZh: '鐵工坊' },
  academy:  { glyph: '書', color: '#88b7e8', height: 1.6, nameZh: '書院' },
  temple:   { glyph: '寺', color: '#c19a3b', height: 1.8, nameZh: '寺院' },
  farm:     { glyph: '田', color: '#b8c87a', height: 0.5, nameZh: '農田' },
  wall:     { glyph: '壁', color: '#5a4530', height: 0.8, nameZh: '城壁' },
  shipyard: { glyph: '渠', color: '#3a6a98', height: 1.0, nameZh: '船廠' },
};

/* ─── Inside-city building (3D block + roof + glyph label) ──────────── */
function InsideBuilding3D({ coord, buildingId, level }: {
  coord: { col: number; row: number };
  buildingId: BuildingId;
  level: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const def = INSIDE_BUILDING_DEF[buildingId];
  const h = def.height + level * 0.15;
  return (
    <group position={[x, 0, z]}>
      {/* Main block */}
      <mesh position={[0, h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshStandardMaterial color={def.color} roughness={0.7} />
      </mesh>
      {/* Pyramidal Chinese-style roof */}
      <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.8, 0.5, 4]} />
        <meshStandardMaterial color="#3a2818" roughness={0.85} />
      </mesh>
      {/* Floating label */}
      <Html position={[0, h + 0.9, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${def.color}`,
          padding: '1px 5px',
          fontFamily: 'Songti SC, serif',
          fontSize: '11px',
          color: def.color,
          textAlign: 'center',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}>
          {def.nameZh} <span style={{ opacity: 0.7 }}>lv{level}</span>
        </div>
      </Html>
    </group>
  );
}

/* ─── Tower range ring (gold circle on the ground) ──────────────────── */
function RangeRing3D({ coord, range, color }: {
  coord: { col: number; row: number };
  range: number;
  color: string;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const radius = range * HEX_ROW_STEP * 0.95;
  return (
    <mesh position={[x, 0.22, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.05, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── Available-slot marker (golden octagonal floor disc) ───────────── */
function SlotMarker3D({ coord, occupied }: {
  coord: { col: number; row: number };
  occupied: boolean;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  if (occupied) return null;
  return (
    <mesh position={[x, 0.22, z]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
      <ringGeometry args={[0.55, 0.78, 8]} />
      <meshBasicMaterial color="#d4a84a" transparent opacity={0.55} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ─── The full 3D scene ─────────────────────────────────────────────── */
/* ─── Perimeter wall + gate ──────────────────────────────────────────── */
/** A lightweight crenellated wall block (no per-segment banner/animation, so
 *  a full perimeter stays cheap on mobile). */
function WallSegment3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.3, 1.5]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {[-0.5, 0, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 1.4, 0]} castShadow>
          <boxGeometry args={[0.34, 0.3, 1.5]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

/** A city gate — twin pillars, lintel, gatehouse roof, a wooden door and the
 *  force banner. Sits in the perimeter where a wall block would otherwise be. */
function CityGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.55, 0.55].map((px, i) => (
        <mesh key={i} position={[px, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 1.8, 1.5]} />
          <meshStandardMaterial color="#6a5540" roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[1.55, 0.42, 1.5]} />
        <meshStandardMaterial color="#7a6550" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.12, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.3, 0.5, 4]} />
        <meshStandardMaterial color="#3a2818" roughness={0.85} />
      </mesh>
      {/* Wooden door in the opening */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.62, 1.3, 0.16]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <planeGeometry args={[0.55, 0.32]} />
        <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Building foundations (地基) — the CoC-style build plots ─────────── */
/** A regular sub-grid of buildable plots inside the wall ring. Deterministic
 *  so a city's layout is stable across views. */
function cityBuildPlots(W: number, H: number): Array<{ col: number; row: number }> {
  const plots: Array<{ col: number; row: number }> = [];
  for (let col = 2; col <= W - 3; col += 3) {
    for (let row = 2; row <= H - 3; row += 3) {
      plots.push({ col, row });
    }
  }
  return plots;
}

/** A raised stone foundation plinth. Empty plots show a gold "buildable" ring. */
function FoundationPlot3D({ x, z, occupied }: { x: number; z: number; occupied: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.35, 0.18, 1.35]} />
        <meshStandardMaterial color={occupied ? '#7a6a52' : '#9a8a68'} roughness={0.96} />
      </mesh>
      {!occupied && (
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.42, 0.56, 4]} />
          <meshBasicMaterial color="#d4a84a" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/* ─── Living-city decoration — earthen dwellings + a central 府衙 ─────── */
function dwellingHash(col: number, row: number): number {
  let h = (col * 73856093) ^ (row * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}
const HOUSE_WALL = ['#c8b48a', '#bfa980', '#cdbb95', '#b8a276', '#d0bd97'];
const HOUSE_ROOF = ['#3a2818', '#46342a', '#2f4a55', '#403020', '#34404a'];
// Terrains a house can't sit on.
const NO_BUILD_TERRAIN = new Set(['river', 'water', 'lake', 'sea', 'mountain', 'deep-water']);
// Wilderness flattened to level city ground (no mountains/hills/trees inside
// the walls); standing water is kept as the odd pond.
const WILDERNESS_TERRAIN = new Set(['mountain', 'hill', 'forest', 'wetland', 'river', 'marsh', 'rocky']);

/** A small earthen house: solid box + pitched roof (same primitives as the
 *  working buildings — no textures, transparency or animation). */
function Dwelling({ x, z, seed }: { x: number; z: number; seed: number }) {
  const wall = HOUSE_WALL[seed % HOUSE_WALL.length];
  const roof = HOUSE_ROOF[(seed >> 3) % HOUSE_ROOF.length];
  const w = 0.58 + (seed % 3) * 0.05;
  const h = 0.38 + ((seed >> 2) % 3) * 0.08;
  const rot = ((seed >> 4) % 4) * (Math.PI / 10);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={wall} roughness={0.88} />
      </mesh>
      <mesh position={[0, h + 0.16, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.8, 0.3, 4]} />
        <meshStandardMaterial color={roof} roughness={0.82} />
      </mesh>
    </group>
  );
}

/** The seat of government — a larger labelled hall near the city centre. */
function GovernmentHall3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#8a3030" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.25, 0.6, 4]} />
        <meshStandardMaterial color="#2a1a12" roughness={0.85} />
      </mesh>
      <Html position={[0, 2.1, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.85)', border: '1px solid #d4a84a', padding: '1px 6px', fontFamily: 'Songti SC, serif', fontSize: '11px', color: '#f0d98a', borderRadius: 2, whiteSpace: 'nowrap' }}>
          府衙
        </div>
      </Html>
    </group>
  );
}

/** Scatter dwellings across the inside-city land, leaving gaps for streets. */
function CityDwellings3D({ preview, cityWallCol, occupied }: {
  preview: ReturnType<typeof previewBattlefield>;
  cityWallCol: number;
  occupied: Set<string>;
}) {
  const houses = useMemo(() => {
    const out: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const W = preview.width, H = preview.height;
    for (const tile of preview.tiles) {
      const { col, row } = tile.coord;
      // Strictly inside the perimeter wall ring.
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      if (NO_BUILD_TERRAIN.has(tile.terrain as string)) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue;                     // slots + real buildings
      const seed = dwellingHash(col, row);
      if (seed % 100 < 45) continue;                       // ~55% density; gaps = streets
      const [x, z] = hexWorld(col, row);
      out.push({ x, z, seed, key });
      if (out.length >= 36) break;                         // safety cap
    }
    return out;
  }, [preview, cityWallCol, occupied]);

  const hall = useMemo(() => {
    const col = Math.max(1, Math.round(cityWallCol * 0.42));
    const row = Math.round(preview.height / 2);
    const [x, z] = hexWorld(col, row);
    return { x, z };
  }, [preview.height, cityWallCol]);

  return (
    <>
      {houses.map((h) => <Dwelling key={`dw-${h.key}`} x={h.x} z={h.z} seed={h.seed} />)}
      <GovernmentHall3D x={hall.x} z={hall.z} />
    </>
  );
}

function CityScene({
  preview, slots, buildings, plots, cityWallCol, bannerColor,
  hovered, onHover, onClick, showOverlays,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  buildings: Array<{ coord: { col: number; row: number }; buildingId: BuildingId; level: number }>;
  plots: Array<{ col: number; row: number }>;
  cityWallCol: number;
  bannerColor: string;
  hovered: { col: number; row: number } | null;
  onHover: (c: { col: number; row: number } | null) => void;
  onClick: (c: { col: number; row: number }) => void;
  showOverlays: boolean;
}) {
  const slotIndexAtHex = new Map<string, number>();
  preview.slotPositions.forEach((pos, idx) => slotIndexAtHex.set(`${pos.col},${pos.row}`, idx));
  const slotMap = new Map((slots ?? []).map((s) => [s.slot, s]));

  // Hexes that already hold something — dwellings avoid these.
  const buildingHexes = new Set(buildings.map((b) => `${b.coord.col},${b.coord.row}`));
  const occupiedHexes = new Set<string>();
  preview.slotPositions.forEach((pos) => occupiedHexes.add(`${pos.col},${pos.row}`));
  for (const b of buildings) occupiedHexes.add(`${b.coord.col},${b.coord.row}`);
  for (const p of plots) occupiedHexes.add(`${p.col},${p.row}`); // foundations

  // Tower range circles for visualization
  const towerRanges: Array<{ coord: { col: number; row: number }; range: number; color: string }> = [];
  for (const s of slots ?? []) {
    if (!s.buildingId) continue;
    const pos = preview.slotPositions[s.slot];
    if (!pos) continue;
    let range = 0; let color = '#d4a84a';
    switch (s.buildingId) {
      case 'watchtower':     range = 4; color = '#d4a84a'; break;
      case 'arrow-platform': range = 5; color = '#c19a3b'; break;
      case 'rockfall':       range = 1; color = '#4a3a30'; break;
      case 'caltrops':       range = 1; color = '#7a6750'; break;
      case 'iron-chains':    range = 1; color = '#3a6a98'; break;
    }
    if (range > 0) towerRanges.push({ coord: pos, range, color });
  }

  // Day-time lighting (matches TacticalBattleScreen3D 'day' preset)
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 18, 6]} intensity={1.2} color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.25} color="#f0c890" />
      <fog attach="fog" args={['#a8bfd0', 35, 80]} />

      {/* Terrain tiles — uses shared HexTile from tactical for full fidelity */}
      {preview.tiles.map((tile) => {
        const isHovered = !!hovered && hovered.col === tile.coord.col && hovered.row === tile.coord.row;
        const slotIdx = slotIndexAtHex.get(`${tile.coord.col},${tile.coord.row}`);
        return (
          <group
            key={`${tile.coord.col},${tile.coord.row}`}
            onPointerOver={(e) => { e.stopPropagation(); onHover(tile.coord); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          >
            <HexTile
              tile={tile}
              hovered={isHovered}
              highlight={slotIdx !== undefined && !slotMap.get(slotIdx)?.buildingId ? 'move' : undefined}
              windStrength={0.4}
              onClick={() => onClick(tile.coord)}
            />
          </group>
        );
      })}

      {/* City walls — full perimeter ring with a gate on the south edge. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2), gateRow = H - 1;
        const segs: Array<{ col: number; row: number }> = [];
        for (let c = 0; c < W; c++) { segs.push({ col: c, row: 0 }); segs.push({ col: c, row: H - 1 }); }
        for (let r = 1; r < H - 1; r++) { segs.push({ col: 0, row: r }); segs.push({ col: W - 1, row: r }); }
        const [gx, gz] = hexWorld(gateCol, gateRow);
        return (
          <>
            {segs.filter((s) => !(s.col === gateCol && s.row === gateRow)).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallSegment3D key={`wall-${s.col}-${s.row}`} x={x} z={z} />;
            })}
            <CityGate3D x={gx} z={gz} bannerColor={bannerColor} />
          </>
        );
      })()}

      {/* Slot markers — golden octagon discs showing buildable hexes */}
      {preview.slotPositions.map((pos, idx) => (
        <SlotMarker3D
          key={`slot-${idx}`}
          coord={pos}
          occupied={!!slotMap.get(idx)?.buildingId}
        />
      ))}

      {/* Building foundations (地基) — real buildings sit on the first plots,
          empty ones show a gold buildable ring. */}
      {plots.map((p) => {
        const [x, z] = hexWorld(p.col, p.row);
        return <FoundationPlot3D key={`plot-${p.col}-${p.row}`} x={x} z={z} occupied={buildingHexes.has(`${p.col},${p.row}`)} />;
      })}

      {/* Living-city dwellings + central 府衙 (cosmetic) */}
      <CityDwellings3D preview={preview} cityWallCol={cityWallCol} occupied={occupiedHexes} />

      {/* Inside-city buildings */}
      {buildings.map((b) => (
        <InsideBuilding3D
          key={`bld-${b.coord.col},${b.coord.row}`}
          coord={b.coord}
          buildingId={b.buildingId}
          level={b.level}
        />
      ))}

      {/* Defense structures on slots — reuse tactical's DefenseStructure */}
      {(slots ?? []).map((s) => {
        if (!s.buildingId) return null;
        const pos = preview.slotPositions[s.slot];
        if (!pos) return null;
        // Synthesize hp/maxHp from level for the shared component.
        const maxHp = 100 * s.level + 100;
        return (
          <DefenseStructure
            key={`def-${s.slot}`}
            coord={pos}
            buildingId={s.buildingId}
            level={s.level}
            hp={maxHp}
            maxHp={maxHp}
          />
        );
      })}

      {/* Range rings overlay */}
      {showOverlays && towerRanges.map((tr, i) => (
        <RangeRing3D key={`rr-${i}`} coord={tr.coord} range={tr.range} color={tr.color} />
      ))}
    </>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function CityMapScreen3D({ cityId, onClose, onSwitch2D }: {
  cityId: EntityId;
  onClose: () => void;
  onSwitch2D: () => void;
}) {
  const city = useGameStore((s) => s.cities[cityId]);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const allBuildings = useGameStore((s) => s.buildings);
  const buildAction = useGameStore((s) => s.buildDefenseStructure);
  const upgradeAction = useGameStore((s) => s.upgradeDefenseStructure);
  const demolishAction = useGameStore((s) => s.demolishDefenseStructure);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [hovered, setHovered] = useState<{ col: number; row: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lang = useLanguage();

  const rawPreview = useMemo(
    () => previewBattlefield(cityId, {
      terrain: city?.terrain, port: city?.port,
      x: city?.coords.x, y: city?.coords.y,
    }, 18, 13), // city view uses a roomier grid than a battle slice
    [cityId, city?.terrain, city?.port, city?.coords.x, city?.coords.y],
  );
  // Inside the walls the ground is a city, not a battlefield — flatten the
  // wilderness (mountains, hills, trees) to level ground, keeping only water
  // as the odd pond/canal.
  const preview = useMemo(() => ({
    ...rawPreview,
    tiles: rawPreview.tiles.map((tl) =>
      WILDERNESS_TERRAIN.has(tl.terrain as string) ? { ...tl, terrain: 'plain' as typeof tl.terrain } : tl,
    ),
  }), [rawPreview]);

  if (!city) return null;
  const isPlayer = city.ownerForceId === playerForceId;
  const slots = city.buildSlots ?? [];
  const size = citySize(city);
  const total = aggregateSlotEffects(slots);
  const builtCount = slots.filter((s) => s.buildingId).length;
  const cityWallCol = preview.width - 1;
  const ownerForce = city.ownerForceId ? forces[city.ownerForceId] : null;
  const bannerColor = ownerForce?.color ?? '#5a4530';

  const cityBuildings = useMemo(
    () => allBuildings.filter((b) => b.cityId === cityId && b.level > 0),
    [allBuildings, cityId],
  );
  // Buildable foundations (地基) inside the walls; the city's real buildings
  // sit on the first plots, the rest stay open for future construction.
  const plots = useMemo(
    () => cityBuildPlots(preview.width, preview.height),
    [preview.width, preview.height],
  );
  const insideBuildings = useMemo(
    () => cityBuildings
      .map((b, i) => ({ coord: plots[i], buildingId: b.id, level: b.level }))
      .filter((b): b is { coord: { col: number; row: number }; buildingId: BuildingId; level: number } => !!b.coord),
    [cityBuildings, plots],
  );

  const slotIndexAtHex = useMemo(() => {
    const m = new Map<string, number>();
    preview.slotPositions.forEach((p, i) => m.set(`${p.col},${p.row}`, i));
    return m;
  }, [preview]);

  const handleTileClick = (coord: { col: number; row: number }) => {
    if (!isPlayer) return;
    const slotIdx = slotIndexAtHex.get(`${coord.col},${coord.row}`);
    if (slotIdx === undefined) {
      setSelectedSlot(null);
      return;
    }
    setSelectedSlot(slotIdx);
    setError(null);
  };

  const tryBuild = (slot: number, id: DefenseBuildingId) => {
    setError(null);
    const r = buildAction(cityId, slot, id);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else setSelectedSlot(null);
  };
  const tryUpgrade = (slot: number) => {
    setError(null);
    const r = upgradeAction(cityId, slot);
    if (!r.ok) setError(r.reason ?? 'Failed');
  };
  const tryDemolish = (slot: number) => {
    demolishAction(cityId, slot);
    setSelectedSlot(null);
  };

  const centerX = (preview.width * HEX_COL_STEP) / 2;
  const centerZ = (preview.height * HEX_ROW_STEP) / 2;

  const ALL_BUILDINGS: DefenseBuildingId[] = [
    'watchtower', 'beacon', 'caltrops', 'lookout',
    'barracks-out', 'granary-out',
    'iron-chains', 'rockfall', 'arrow-platform',
  ];

  const currentSlot = selectedSlot !== null ? slots.find((s) => s.slot === selectedSlot) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="tkm-city-enter" style={{
      position: 'fixed', inset: 0, background: '#0a0805', zIndex: 320,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar */}
      <header style={{
        padding: '0.6rem 1rem',
        background: 'linear-gradient(180deg, #1f1610 0%, rgba(31,22,16,0.85) 100%)',
        borderBottom: '1px solid #4a3520',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        <div style={{ color: '#d4a84a', fontFamily: 'Songti SC, serif', letterSpacing: '0.3rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{city.name.zh}</span>
          <span style={{ fontSize: '0.85rem', color: size.color, marginLeft: '0.6rem' }}>{size.name.zh}</span>
          <span style={{ fontSize: '0.7rem', color: '#8a7050', marginLeft: '0.8rem' }}>
            {builtCount}/8 防禦
            {total.defenseBonus > 0 && ` · +${total.defenseBonus} 守備`}
            {total.rangedPrestrike > 0 && ` · 預射 ${total.rangedPrestrike}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            style={{
              background: showOverlays ? 'rgba(212, 168, 74, 0.2)' : 'transparent',
              border: '1px solid #5a4530',
              color: showOverlays ? '#d4a84a' : '#8a7050',
              padding: '0.3rem 0.6rem',
              fontFamily: 'Songti SC, serif', fontSize: '0.7rem', cursor: 'pointer',
              letterSpacing: '0.1rem',
            }}
          >
            {showOverlays ? '✓' : ''} 戰術疊加
          </button>
          <button
            onClick={onSwitch2D}
            style={{
              background: '#1a3a5a', color: '#88b7e8',
              border: '1px solid #88b7e8', padding: '0.3rem 0.7rem',
              cursor: 'pointer', fontFamily: 'Songti SC, serif', fontSize: '0.7rem',
              letterSpacing: '0.1rem',
            }}
          >
            ⇄ 切換 2D
          </button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#d4a84a',
            fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
          }}>×</button>
        </div>
      </header>

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [centerX, 16, centerZ + 16], fov: 50 }}
          shadows
          style={{ background: 'linear-gradient(180deg, #5a8acf 0%, #8aafd0 100%)' }}
        >
          <CityScene
            preview={preview}
            slots={slots}
            buildings={insideBuildings}
            plots={plots}
            cityWallCol={cityWallCol}
            bannerColor={bannerColor}
            hovered={hovered}
            onHover={setHovered}
            onClick={handleTileClick}
            showOverlays={showOverlays}
          />
          <OrbitControls
            target={[centerX, 0, centerZ]}
            enablePan
            maxPolarAngle={Math.PI / 2.2}
            minDistance={6}
            maxDistance={40}
          />
        </Canvas>

        {/* Slot editor overlay */}
        {selectedSlot !== null && isPlayer && (
          <div
            style={{
              position: 'absolute', right: 12, top: 12, width: 320,
              background: 'rgba(20, 14, 8, 0.95)',
              border: '1px solid #d4a84a',
              padding: '0.8rem',
              color: '#c0a878',
              fontFamily: 'Songti SC, serif',
              fontSize: '0.78rem',
              maxHeight: 'calc(100vh - 80px)',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ color: '#d4a84a', letterSpacing: '0.2rem' }}>
                {lang === 'en' ? `Slot ${selectedSlot + 1}` : `第 ${selectedSlot + 1} 號位`}
              </div>
              <button onClick={() => setSelectedSlot(null)} style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
              }}>×</button>
            </div>
            {currentSlot?.buildingId ? (
              <div>
                <div style={{ color: DEFENSE_BUILDINGS[currentSlot.buildingId].color, marginBottom: '0.3rem' }}>
                  {DEFENSE_BUILDINGS[currentSlot.buildingId].name.zh} lv{currentSlot.level}
                </div>
                <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                  {DEFENSE_BUILDINGS[currentSlot.buildingId].description}
                </div>
                {currentSlot.level < DEFENSE_BUILDINGS[currentSlot.buildingId].maxLevel && (
                  <button
                    onClick={() => tryUpgrade(selectedSlot)}
                    style={{
                      width: '100%', padding: '0.4rem',
                      background: '#1a3a5a', color: '#88b7e8',
                      border: '1px solid #88b7e8', marginBottom: '0.3rem',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    升級 → lv{currentSlot.level + 1}
                  </button>
                )}
                <button
                  onClick={() => tryDemolish(selectedSlot)}
                  style={{
                    width: '100%', padding: '0.4rem',
                    background: '#3a1a1a', color: '#b8442e',
                    border: '1px solid #b8442e',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  拆除
                </button>
              </div>
            ) : (
              <div>
                <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>選擇建築:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {ALL_BUILDINGS.map((id) => {
                    const def = DEFENSE_BUILDINGS[id];
                    return (
                      <button
                        key={id}
                        onClick={() => tryBuild(selectedSlot, id)}
                        title={def.description}
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: 'rgba(212, 168, 74, 0.08)',
                          border: `1px solid ${def.color}`,
                          color: def.color,
                          fontFamily: 'inherit', fontSize: '0.75rem',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {def.name.zh} <span style={{ float: 'right', opacity: 0.7 }}>{def.goldCost}g</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {error && (
              <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{error}</div>
            )}
          </div>
        )}

        {/* Hint when nothing selected */}
        {selectedSlot === null && isPlayer && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: 'rgba(20, 14, 8, 0.8)',
            border: '1px solid #5a4530',
            padding: '0.3rem 0.6rem',
            color: '#8a7050', fontFamily: 'Songti SC, serif',
            fontSize: '0.7rem', letterSpacing: '0.15rem',
          }}>
            點擊金色八角位 → 建造城外防禦
          </div>
        )}
      </div>
    </div>
  );
}
