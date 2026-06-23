import { useMemo, useState, useEffect, useRef, createContext, useContext } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls, Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { RENDER_HI } from '../renderQuality';
import { useGameStore } from '../../game/state/store';
import {
  DEFENSE_BUILDINGS,
  type DefenseBuildingId,
  aggregateSlotEffects,
} from '../../game/data/defenseBuildings';
import { previewBattlefield } from '../../game/systems/tactical';
import { battleGroundAt, geoToPixel } from '../../game/data/geography';
import { FACILITY_DEFS, type FacilityKind } from '../../game/types';
import { citySize, cityMeetsSize, CITY_SIZES_BY_ID } from '../../game/systems/citySize';
import { COMMAND_DEFS, meetsMinSize, previewCommandGain } from '../../game/systems/commands';
import { commandFitMultiplier } from '../../game/systems/traitEffects';
import { appointmentBonusFor } from '../../game/systems/appointmentEffects';
import { tickCityEconomy } from '../../game/systems/economy';
import { foodRate, buyQuote, sellQuote } from '../../game/systems/market';
import type { WeatherKind } from '../../game/systems/weather';
import type { InternalAffairsType, CommandType } from '../../game/types';
import { OfficerPicker } from '../components/OfficerPicker';
import { LocatorMap } from '../components/LocatorMap';
import { IntroDive } from '../components/IntroDive';
import { cityViewWindow } from '../viewWindow';
import { BUILDING_DEFS, BUILDING_DEFS_BY_ID, BUILDING_CATEGORY, BUILDING_CATEGORY_LABEL, BUILDING_PREREQ, BUILDING_MIN_SIZE, buildingGroupSynergy } from '../../game/data/buildings';
import { cityAffinity, citySpecialty, type SpecialtyDef } from '../../game/data/specialties';
import { startCityAmbience, stopCityAmbience, playSfx } from '../../game/systems/sound';
import type { EntityId, BuildingId, City } from '../../game/types';
import { SEASON_LABEL, type Season } from '../../game/types/common';
import { useLanguage, pickName, useT } from '../i18n';
// Reuse the polished 3D primitives from the tactical battle scene so the
// city map matches its visual fidelity — terrain art, lighting, walls.
import {
  hexWorld,
  HEX_COL_STEP,
  HEX_ROW_STEP,
  HexTile,
  DefenseStructure,
} from './TacticalBattleScreen3D';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

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
  granary:  { glyph: '倉', color: '#c8b478', height: 1.1, nameZh: '義倉' },
  infirmary:{ glyph: '醫', color: '#88c8a8', height: 1.2, nameZh: '醫館' },
  levee:    { glyph: '堤', color: '#6a98c0', height: 0.5, nameZh: '堤防' },
  stable:   { glyph: '廄', color: '#8a6a48', height: 1.0, nameZh: '馬廄' },
  workshop: { glyph: '工', color: '#7d7264', height: 1.3, nameZh: '工房' },
  mint:     { glyph: '錢', color: '#c9a23c', height: 1.1, nameZh: '錢莊' },
  arsenal:  { glyph: '庫', color: '#6b5f4a', height: 1.2, nameZh: '武庫' },
  relay:    { glyph: '驛', color: '#b89058', height: 1.0, nameZh: '驛站' },
  grandacademy: { glyph: '學', color: '#6fa0d8', height: 1.9, nameZh: '太學' },
  barbican: { glyph: '甕', color: '#6a5238', height: 1.6, nameZh: '甕城' },
  evernormal: { glyph: '糴', color: '#cabd82', height: 1.1, nameZh: '常平倉' },
  drillground: { glyph: '武', color: '#9a6a52', height: 0.9, nameZh: '演武場' },
  irrigation: { glyph: '水', color: '#6faec0', height: 0.5, nameZh: '水利' },
  recruithall: { glyph: '賢', color: '#9fc0e0', height: 1.5, nameZh: '招賢館' },
  spyoffice: { glyph: '諜', color: '#6a6a78', height: 1.2, nameZh: '諜報司' },
  supplydepot: { glyph: '傳', color: '#b09060', height: 1.1, nameZh: '驛傳' },
  civicoffice: { glyph: '安', color: '#c0a050', height: 1.2, nameZh: '安民坊' },
  tradeoffice: { glyph: '舶', color: '#3f8aa8', height: 1.3, nameZh: '市舶司' },
  warschool: { glyph: '韜', color: '#8a5848', height: 1.5, nameZh: '武學堂' },
  quartermaster: { glyph: '廩', color: '#b8a868', height: 1.2, nameZh: '糧倉署' },
  signaltower: { glyph: '譙', color: '#6b5a44', height: 2.0, nameZh: '譙樓' },
  fieldhospital: { glyph: '療', color: '#9ec8b0', height: 1.0, nameZh: '傷兵營' },
  daotemple: { glyph: '道', color: '#c8a85a', height: 1.7, nameZh: '道觀' },
  worksbureau: { glyph: '匠', color: '#8a7a5a', height: 1.3, nameZh: '將作監' },
  tavern: { glyph: '酒', color: '#c47a4a', height: 1.0, nameZh: '酒肆' },
  prison: { glyph: '牢', color: '#5a5550', height: 1.1, nameZh: '牢城' },
  pasture: { glyph: '牧', color: '#9aa86a', height: 0.6, nameZh: '牧苑' },
  library: { glyph: '藏', color: '#7fa8d0', height: 1.5, nameZh: '藏書閣' },
  beacon: { glyph: '烽', color: '#7a5a44', height: 2.1, nameZh: '烽燧' },
  armsbureau: { glyph: '器', color: '#7a7068', height: 1.4, nameZh: '軍器監' },
  pricebureau: { glyph: '平', color: '#c8b45a', height: 1.2, nameZh: '平準署' },
  heraldhall: { glyph: '鴻', color: '#c08a5a', height: 1.5, nameZh: '鴻臚館' },
  navalyard: { glyph: '艦', color: '#3f7a98', height: 1.3, nameZh: '樓船署' },
  scoutcamp: { glyph: '斥', color: '#7a8a6a', height: 0.9, nameZh: '斥候營' },
};

/* ─── Gentle ambient motion ──────────────────────────────────────────
 * The city canvas already redraws every frame (r3f frameloop="always"),
 * so these pure-transform tweens add life at essentially no extra GPU cost.
 * No textures, transparency or geometry churn — unrelated to the volumetric
 * cloud that once misbehaved. */

/** Oscillate a group like cloth caught in a breeze. Returns a ref to attach to
 *  the pivot group; phase de-syncs instances so they don't move in unison. */
function useFlutter(phase: number, amp = 0.25, speed = 2.2) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    g.rotation.y = Math.sin(t * speed + phase) * amp;
    g.rotation.z = Math.sin(t * speed * 1.4 + phase) * amp * 0.22;
  });
  return ref;
}

/** A fluttering banner cloth pivoted at a pole. */
function Banner3D({ color, w, h, phase, faceX = 0 }: {
  color: string; w: number; h: number; phase: number; faceX?: number;
}) {
  const ref = useFlutter(phase, 0.28, 2.0);
  return (
    <group ref={ref}>
      <mesh position={[faceX, 0, 0]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.75} />
      </mesh>
    </group>
  );
}

/* ─── Inside-city building (3D block + roof + glyph label) ──────────── */
function InsideBuilding3D({ coord, buildingId, level }: {
  coord: { col: number; row: number };
  buildingId: BuildingId;
  level: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const inspect = useContext(InspectCtx);
  const def = INSIDE_BUILDING_DEF[buildingId];
  const h = def.height + level * 0.15;
  // Temple & academy get a gilded, ornamented roof; the rest tile-blue.
  const grand = buildingId === 'temple' || buildingId === 'academy';
  const roofColor = grand ? '#b9952f' : '#39444f';
  // 點建築 — show what this built structure actually does (其加成已接入模擬),
  // and let 文教 buildings (書院/太學/藏書閣/武學堂) hold a 興学 lecture in place.
  const onInspectBuilding = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const bdef = BUILDING_DEFS_BY_ID[buildingId];
    const cat = BUILDING_CATEGORY[buildingId];
    const catLabel = BUILDING_CATEGORY_LABEL[cat];
    inspect({
      title: `${def.nameZh} · ${catLabel?.zh ?? ''} lv${level}`,
      body: bdef?.descriptionZh ?? bdef?.description ?? '城中營造,其加成已接入本城模擬。',
      color: def.color,
      commands: cat === 'culture' ? ['promote-learning'] : undefined,
    });
  };
  return (
    <group position={[x, 0, z]} onClick={onInspectBuilding}>
      {/* Stone plinth */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.28, 0.18, 1.28]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      {/* Main block */}
      <mesh position={[0, h / 2 + 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshStandardMaterial color={def.color} roughness={0.7} />
      </mesh>
      {/* Front colonnade */}
      {[-0.36, -0.12, 0.12, 0.36].map((px, i) => (
        <mesh key={`col${i}`} position={[px, h / 2 + 0.18, 0.54]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, h, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Recessed windows along the front */}
      {[-0.3, 0.3].map((px, i) => (
        <mesh key={`win${i}`} position={[px, h * 0.6 + 0.18, 0.53]}>
          <boxGeometry args={[0.18, 0.2, 0.04]} />
          <meshStandardMaterial color="#241c14" roughness={0.6} />
        </mesh>
      ))}
      {/* Swept tiled roof */}
      <group position={[0, h + 0.18, 0]}>
        <ChineseRoof3D size={1.05} color={roofColor} ornament={grand} />
      </group>
      {/* The foundry has a smoking chimney */}
      {buildingId === 'foundry' && (
        <>
          <mesh position={[0.34, h + 0.45, -0.34]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.6, 8]} />
            <meshStandardMaterial color="#3a2e22" roughness={0.9} />
          </mesh>
          <Smoke3D x={0.34} z={-0.34} base={h + 0.7} />
        </>
      )}
      {/* Floating label */}
      <Html position={[0, h + 0.9, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${def.color}`,
          padding: '1px 5px',
          fontFamily: 'var(--tkm-font-body)',
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
/* ─── The full 3D scene ─────────────────────────────────────────────── */
/* ─── Perimeter wall + gate ──────────────────────────────────────────── */
/** A lightweight crenellated wall block (no per-segment banner/animation, so
 *  a full perimeter stays cheap on mobile). */
function WallSegment3D({ x, z, tier = 1 }: { x: number; z: number; tier?: 1 | 2 | 3 }) {
  // 城壁強化 — each tier raises the rampart: taller and a touch thicker, so a
  // 3-級 citadel (合肥/長安/洛陽) visibly towers over a frontier stockade.
  const h = 1.3 + (tier - 1) * 0.55;
  const thick = 1.5 + (tier - 1) * 0.12;
  const stone = tier >= 3 ? '#736152' : tier === 2 ? '#6e5944' : '#6a5540';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[thick, h, 1.5]} />
        <meshStandardMaterial color={stone} roughness={0.92} />
      </mesh>
      {[-0.5, 0, 0.5].map((px, i) => (
        <mesh key={i} position={[px, h + 0.1, 0]} castShadow>
          <boxGeometry args={[0.34, 0.3, 1.5]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
      {/* Tier-3 citadels gain a stone string-course band partway up. */}
      {tier >= 3 && (
        <mesh position={[0, h * 0.62, 0.02]} castShadow>
          <boxGeometry args={[thick + 0.04, 0.16, 1.54]} />
          <meshStandardMaterial color="#8a7656" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

/** The inner palace-city (内城/皇城) wall ring around the civic centre — a
 *  rectangle of perimeter cells, only raised in great cities. Computed the
 *  same way in the scene (to draw it) and the scatter (to keep it clear). */
function innerWallCells(W: number, H: number) {
  // Snap borders off the plot lines (col/row % 3 === 2) so a foundation never
  // ends up sitting on the inner wall.
  const snap = (v: number) => (v % 3 === 2 ? v + 1 : v);
  const ic0 = snap(Math.round(W * 0.30)), ic1 = snap(Math.round(W * 0.70));
  const ir0 = snap(Math.round(H * 0.30)), ir1 = snap(Math.round(H * 0.70));
  const cells: Array<{ col: number; row: number }> = [];
  for (let c = ic0; c <= ic1; c++) { cells.push({ col: c, row: ir0 }); cells.push({ col: c, row: ir1 }); }
  for (let r = ir0 + 1; r < ir1; r++) { cells.push({ col: ic0, row: r }); cells.push({ col: ic1, row: r }); }
  return { ic0, ic1, ir0, ir1, cells };
}

/** A lower, crenellated inner-wall segment. */
function InnerWallSeg3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.0, 1.5]} />
        <meshStandardMaterial color="#7a6748" roughness={0.92} />
      </mesh>
      {[-0.5, 0, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 1.08, 0]} castShadow>
          <boxGeometry args={[0.34, 0.26, 1.5]} />
          <meshStandardMaterial color="#8a7656" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

/** The inner-wall gate facing the avenue — a red-pillared gatehouse. */
function InnerGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.5, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.5, 1.5]} />
          <meshStandardMaterial color="#7a6748" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.5, 0.34, 1.5]} />
        <meshStandardMaterial color="#8a7656" roughness={0.9} />
      </mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((px, i) => (
        <mesh key={`c${i}`} position={[px, 1.95, 0.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      <group position={[0, 2.2, 0]}><ChineseRoof3D size={1.5} color="#2f3a48" ornament beasts /></group>
      <mesh position={[0, 2.9, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 3.05, 0]}>
        <Banner3D color={bannerColor} w={0.3} h={0.32} phase={x + z} faceX={0.15} />
      </group>
    </group>
  );
}

/** A city gate — twin pillars, lintel, gatehouse roof, a wooden door and the
 *  force banner. Sits in the perimeter where a wall block would otherwise be. */
function CityGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* Gate pillars */}
      {[-0.55, 0.55].map((px, i) => (
        <mesh key={i} position={[px, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 1.8, 1.5]} />
          <meshStandardMaterial color="#6a5540" roughness={0.92} />
        </mesh>
      ))}
      {/* Lintel */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[1.6, 0.4, 1.55]} />
        <meshStandardMaterial color="#7a6550" roughness={0.9} />
      </mesh>
      {/* Upper gatehouse storey (城樓) */}
      <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.85, 1.2]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.78} />
      </mesh>
      {[-0.55, -0.18, 0.18, 0.55].map((px, i) => (
        <mesh key={`c${i}`} position={[px, 2.0, 0.62]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Swept double-eave gatehouse roof */}
      <group position={[0, 2.82, 0]}>
        <ChineseRoof3D size={1.7} color="#2f3a48" ornament beasts />
      </group>
      <group position={[0, 3.28, 0]}>
        <ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts />
      </group>
      {/* Wooden door in the opening */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.62, 1.3, 0.16]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
      </mesh>
      {/* Pennant on the ridge — flutters */}
      <mesh position={[0, 4.05, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 4.2, 0]}>
        <Banner3D color={bannerColor} w={0.32} h={0.34} phase={x + z} faceX={0.16} />
      </group>
    </group>
  );
}

/** A taller corner tower (角樓) anchoring each corner of the wall ring. */
function CornerTower3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 2.3, 1.75]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {[[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.45, pz]} castShadow>
          <boxGeometry args={[0.4, 0.36, 0.4]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
      {/* Swept tile roof */}
      <group position={[0, 2.62, 0]}>
        <ChineseRoof3D size={1.95} color="#33404e" ornament beasts />
      </group>
      {/* Flag mast + fluttering banner */}
      <mesh position={[0, 3.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 4.05, 0]}>
        <Banner3D color={bannerColor} w={0.4} h={0.34} phase={x + z * 1.2} faceX={0.2} />
      </group>
    </group>
  );
}

/** Surrounding water — a moat ringing the city; ices over pale in winter. */
function Moat3D({ W, H }: { W: number; H: number }) {
  const season = useContext(SeasonCtx);
  const frozen = season === 'winter';
  const cx = (W * HEX_COL_STEP) / 2, cz = (H * HEX_ROW_STEP) / 2;
  return (
    <mesh position={[cx, -0.1, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[W * HEX_COL_STEP + 8, H * HEX_ROW_STEP + 8]} />
      <meshStandardMaterial color={frozen ? '#bcd2dc' : '#2c5882'} roughness={frozen ? 0.55 : 0.35} metalness={frozen ? 0.2 : 0.45} />
    </mesh>
  );
}

/** The row a cross-city canal runs along — a street line near mid-city. */
function canalRow(H: number): number {
  let r = Math.round(H * 0.55);
  while (r % 3 !== 0 && r > 2) r--;
  return Math.max(3, Math.min(H - 4, r));
}

/** A humped stone bridge carrying a street over the canal (spans z). */
function CanalBridge3D({ x, z }: { x: number; z: number }) {
  const season = useContext(SeasonCtx);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.16, 1.9]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.1, 0.12, 0.8]} />
        <meshStandardMaterial color="#a89a78" roughness={0.95} />
      </mesh>
      {[-0.52, 0.52].map((px, i) => (
        <mesh key={i} position={[px, 0.36, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 1.8]} />
          <meshStandardMaterial color={season === 'winter' ? '#cdd6dc' : '#8f8472'} roughness={0.92} />
        </mesh>
      ))}
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

/** A raised stone foundation plinth. Empty plots show a gold "buildable" ring;
 *  tapping an empty one opens the build menu. */
function FoundationPlot3D({ x, z, occupied, selected, onClick }: {
  x: number; z: number; occupied: boolean; selected: boolean;
  onClick?: () => void;
}) {
  return (
    <group
      position={[x, 0, z]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={!occupied && onClick ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={!occupied && onClick ? () => { document.body.style.cursor = 'default'; } : undefined}
    >
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.35, 0.18, 1.35]} />
        <meshStandardMaterial color={occupied ? '#7a6a52' : selected ? '#cdb888' : '#9a8a68'} roughness={0.96} />
      </mesh>
      {!occupied && (
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.42, 0.56, 4]} />
          <meshBasicMaterial color={selected ? '#ffe9a8' : '#d4a84a'} transparent opacity={selected ? 0.85 : 0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {selected && (
        <mesh position={[0, 0.75, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.4, 4]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#d4a84a" emissiveIntensity={0.5} />
        </mesh>
      )}
    </group>
  );
}

/** Scaffolding shown on a plot whose building is still under construction
 *  (level 0, progress > 0) — wooden frame + a 建造中 banner. */
function ConstructionSite3D({ x, z, nameZh }: { x: number; z: number; nameZh: string }) {
  const posts: Array<[number, number]> = [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]];
  return (
    <group position={[x, 0, z]}>
      {/* Stacked-stone base under construction */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.5, 0.95]} />
        <meshStandardMaterial color="#8a7558" roughness={0.95} />
      </mesh>
      {/* Scaffold posts */}
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.55, pz]} castShadow>
          <boxGeometry args={[0.08, 1.1, 0.08]} />
          <meshStandardMaterial color="#6e5230" roughness={0.9} />
        </mesh>
      ))}
      {/* Cross beams */}
      <mesh position={[0, 1.0, -0.45]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.07]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.0, 0.45]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.07]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.9} />
      </mesh>
      <Html position={[0, 1.5, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)', border: '1px solid #c19a3b',
          padding: '1px 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
          color: '#e0c060', whiteSpace: 'nowrap', borderRadius: 2,
        }}>
          🔨 {nameZh}·建造中
        </div>
      </Html>
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

// Per-season lighting mood for the city view. The game advances by season (no
// wall-clock), so each season also carries a characteristic sun angle —
// spring soft-morning, summer high-noon, autumn low golden-hour, winter pale
// low — which gives every season its own shadow length/direction and a
// distinct time-of-day feel.
type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
// nightGlow: how strongly the braziers/lanterns cast warm light — low in the
// bright seasons, high in the dim ones, so winter reads as a lantern-lit dusk.
const SEASON_LIGHT: Record<SeasonKey, { ambient: number; ambientColor: string; sun: string; sunI: number; sunPos: [number, number, number]; fog: string; sky: string; nightGlow: number }> = {
  spring: { ambient: 0.62, ambientColor: '#fdf3e0', sun: '#fff0d8', sunI: 1.2, sunPos: [10, 17, 8], fog: '#bcd2e4', sky: 'linear-gradient(180deg, #6f9fd8 0%, #a8c8e0 100%)', nightGlow: 0.25 },
  summer: { ambient: 0.72, ambientColor: '#fffaf0', sun: '#fff8e8', sunI: 1.5, sunPos: [6, 23, 4], fog: '#c8dcec', sky: 'linear-gradient(180deg, #4f93d8 0%, #9fc8ee 100%)', nightGlow: 0.1 },
  autumn: { ambient: 0.55, ambientColor: '#f6e6c4', sun: '#ffd49a', sunI: 1.08, sunPos: [15, 10, 6], fog: '#d8c6a4', sky: 'linear-gradient(180deg, #b8946a 0%, #e0c89a 100%)', nightGlow: 0.55 },
  winter: { ambient: 0.5, ambientColor: '#e8f0f8', sun: '#e8eef8', sunI: 0.82, sunPos: [12, 9, -4], fog: '#cdd8e6', sky: 'linear-gradient(180deg, #8aa6c0 0%, #cdd9e6 100%)', nightGlow: 0.7 },
};

// The current season flows to every roof/tree/ground via context so the whole
// city dresses for the season (snow in winter, gold leaves in autumn…) without
// threading a prop through dozens of components.
const SeasonCtx = createContext<SeasonKey>('spring');

// Normalised (0..1) city stats the 3D scene scales itself by.
type CityStats = { fCommerce: number; fAgri: number; fLoyalty: number; fPop: number };

// Tapping a landmark reports a little "what is this" card up to the screen.
type InspectInfo = { title: string; body: string; color: string; commands?: InternalAffairsType[] };
/** Live, city-derived flavour text for the decorative landmarks (報時/瞭望/休憩). */
type LandmarkInfo = { timeBody: string; pagodaBody: string; gardenBody: string };

/** Which landmarks have an internal-affairs order queued this season (施政中). */
type CityActivity = { farm: boolean; market: boolean; barracks: boolean; wall: boolean; hall: boolean; tavern: boolean };

const InspectCtx = createContext<(info: InspectInfo) => void>(() => {});

/** Multiply an #rrggbb colour by a factor (>1 lightens, <1 darkens). Cheap
 *  helper so ridges/eaves can be tinted off a base roof colour. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** A swept Chinese hip roof (廡殿頂) from opaque primitives — overhanging eave
 *  slab + 4-sided pyramid + ridge beam + upturned corner tips, optional 鴟吻
 *  ridge-end ornaments. Caller positions the group at eave height. */
function ChineseRoof3D({ size, color, ornament = false, beasts = false }: {
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

/** A townhouse with real detail — stone plinth, plastered walls with timber
 *  corner posts, a door, recessed windows and a swept tiled roof. Three
 *  archetypes (cottage / merchant house / two-storey) chosen by hash. */
function Dwelling({ x, z, seed }: { x: number; z: number; seed: number }) {
  const season = useContext(SeasonCtx);
  const wall = HOUSE_WALL[seed % HOUSE_WALL.length];
  const roof = HOUSE_ROOF[(seed >> 3) % HOUSE_ROOF.length];
  const type = (seed >> 6) % 3;
  const w = 0.6 + (seed % 3) * 0.06;
  const bodyH = 0.4 + ((seed >> 2) % 3) * 0.08;
  const rot = ((seed >> 4) % 4) * (Math.PI / 12);
  const post = '#5a4530';
  const front = w / 2 + 0.01;
  // Windows glow warm in the dusky seasons (autumn/winter) — lamplit homes.
  const lit = (season === 'winter' || season === 'autumn') && (seed % 5 !== 0);
  const winColor = lit ? '#ffce82' : '#2a2018';
  const winEmissive = lit ? '#ff9c3a' : '#000000';
  const winGlow = lit ? 0.9 : 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Stone plinth */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.18, 0.12, w + 0.18]} />
        <meshStandardMaterial color="#8d8270" roughness={0.96} />
      </mesh>
      {/* Plastered walls */}
      <mesh position={[0, bodyH / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, w]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      {/* Timber corner posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * w / 2, bodyH / 2 + 0.12, sz * w / 2]} castShadow>
          <boxGeometry args={[0.06, bodyH, 0.06]} />
          <meshStandardMaterial color={post} roughness={0.85} />
        </mesh>
      ))}
      {/* Door + windows on the front face */}
      <mesh position={[0, 0.29, front]}>
        <boxGeometry args={[0.18, 0.34, 0.04]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
      <mesh position={[w * 0.28, bodyH * 0.66 + 0.12, front]}>
        <boxGeometry args={[0.14, 0.14, 0.04]} />
        <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
      </mesh>
      {type >= 1 && (
        <mesh position={[-w * 0.28, bodyH * 0.66 + 0.12, front]}>
          <boxGeometry args={[0.14, 0.14, 0.04]} />
          <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
        </mesh>
      )}
      {/* Lower roof */}
      <group position={[0, bodyH + 0.12, 0]}>
        <ChineseRoof3D size={w} color={roof} />
      </group>
      {/* Two-storey variant: a smaller upper box + its own roof */}
      {type === 2 && (
        <>
          <mesh position={[0, bodyH + 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[w * 0.78, 0.42, w * 0.78]} />
            <meshStandardMaterial color={wall} roughness={0.9} />
          </mesh>
          <mesh position={[0, bodyH + 0.42, w * 0.39 + 0.01]}>
            <boxGeometry args={[0.13, 0.13, 0.04]} />
            <meshStandardMaterial color={winColor} emissive={winEmissive} emissiveIntensity={winGlow} roughness={0.6} />
          </mesh>
          <group position={[0, bodyH + 0.64, 0]}>
            <ChineseRoof3D size={w * 0.78} color={roof} />
          </group>
        </>
      )}
    </group>
  );
}

/** A guardian stone lion (石獅) — base, crouching body, maned head, paw ball. */
function StoneLion3D({ x, z, faceZ }: { x: number; z: number; faceZ: number }) {
  const stone = '#b9b1a0';
  return (
    <group position={[x, 0, z]} rotation={[0, faceZ > 0 ? 0 : Math.PI, 0]}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.42]} />
        <meshStandardMaterial color="#8f8775" roughness={0.95} />
      </mesh>
      {/* Haunches + chest */}
      <mesh position={[0, 0.34, -0.06]} castShadow>
        <boxGeometry args={[0.22, 0.34, 0.24]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.46, 0.12]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.18]} />
        <meshStandardMaterial color={stone} roughness={0.9} />
      </mesh>
      {/* Maned head */}
      <mesh position={[0, 0.62, 0.16]} castShadow>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color={stone} roughness={0.85} />
      </mesh>
      {/* Paw ball */}
      <mesh position={[0, 0.12, 0.22]} castShadow>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial color="#a89e88" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** A tall flagpole flying the force banner (opaque cloth). */
function FlagPole3D({ x, z, color, h = 2.4 }: { x: number; z: number; color: string; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, h, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.8} />
      </mesh>
      <mesh position={[0, h - 0.02, 0]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#d4a84a" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Vertical hanging banner — flutters in the breeze */}
      <group position={[0, h - 0.5, 0]}>
        <Banner3D color={color} w={0.26} h={0.8} phase={x + z} faceX={0.13} />
      </group>
    </group>
  );
}

/** The seat of government — a grand double-eave hall on a stepped platform,
 *  flanked by stone lions and banner poles. */
function GovernmentHall3D({ x, z, bannerColor, isCapital = false }: { x: number; z: number; bannerColor: string; isCapital?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      {/* Paved plaza with a border step */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.1, 3.8]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.08, 2.4]} />
        <meshStandardMaterial color="#a89a72" roughness={0.95} />
      </mesh>
      {/* Stepped stone platform */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.2, 1.9]} />
        <meshStandardMaterial color="#b0a078" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.36, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.95, 0.18, 1.65]} />
        <meshStandardMaterial color="#bdac82" roughness={0.9} />
      </mesh>
      {/* Front steps */}
      <mesh position={[0, 0.16, 1.0]} receiveShadow>
        <boxGeometry args={[0.9, 0.12, 0.3]} />
        <meshStandardMaterial color="#a89a72" roughness={0.92} />
      </mesh>
      {/* Hall body */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.3]} />
        <meshStandardMaterial color="#8a3030" roughness={0.68} />
      </mesh>
      {/* Red columns wrapping the front */}
      {[-0.66, -0.22, 0.22, 0.66].map((px, i) => (
        <mesh key={i} position={[px, 0.95, 0.68]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Name plaque (匾額) over the doorway */}
      <mesh position={[0, 1.28, 0.69]} castShadow>
        <boxGeometry args={[0.7, 0.24, 0.05]} />
        <meshStandardMaterial color="#3a2414" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.28, 0.72]}>
        <boxGeometry args={[0.6, 0.16, 0.02]} />
        <meshStandardMaterial color="#caa24a" emissive="#6a4f18" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      {/* Double-eave roof (重檐) */}
      <group position={[0, 1.45, 0]}>
        <ChineseRoof3D size={1.7} color="#2f3a48" ornament beasts />
      </group>
      <group position={[0, 1.95, 0]}>
        <ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts />
      </group>
      {/* Courtyard wall enclosing the compound (gap at the front for the gate) */}
      {[
        [0, -2.05, 4.7, 0.16] as const,      // back
        [-2.25, 0, 0.16, 4.3] as const,      // left
        [2.25, 0, 0.16, 4.3] as const,       // right
        [-1.55, 2.05, 1.5, 0.16] as const,   // front-left of gate
        [1.55, 2.05, 1.5, 0.16] as const,    // front-right of gate
      ].map((w, i) => (
        <group key={`cw${i}`}>
          <mesh position={[w[0], 0.42, w[1]]} castShadow receiveShadow>
            <boxGeometry args={[w[2], 0.78, w[3]]} />
            <meshStandardMaterial color="#b8aa84" roughness={0.92} />
          </mesh>
          <mesh position={[w[0], 0.85, w[1]]} castShadow>
            <boxGeometry args={[w[2] + 0.08, 0.1, w[3] + 0.08]} />
            <meshStandardMaterial color="#39444f" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 衙門 gatehouse on the front gap */}
      {[-0.7, 0.7].map((px, i) => (
        <mesh key={`gp${i}`} position={[px, 0.55, 2.05]} castShadow>
          <boxGeometry args={[0.26, 1.1, 0.26]} />
          <meshStandardMaterial color="#8a3030" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 1.18, 2.05]} castShadow>
        <boxGeometry args={[1.7, 0.22, 0.3]} />
        <meshStandardMaterial color="#7a2820" roughness={0.7} />
      </mesh>
      <group position={[0, 1.34, 2.05]}><ChineseRoof3D size={1.5} color="#2f3a48" ornament /></group>
      {/* 華表 columns flanking the approach */}
      {[-1.9, 1.9].map((px, i) => (
        <group key={`hb${i}`} position={[px, 0, 2.7]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 2.2, 8]} />
            <meshStandardMaterial color="#d8d2c4" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color="#cfc8b8" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.32, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.14, 0.12, 8]} />
            <meshStandardMaterial color="#cfc8b8" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.46, 0]} castShadow>
            <coneGeometry args={[0.09, 0.16, 6]} />
            <meshStandardMaterial color="#caa84a" roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* 影壁 spirit screen facing the approach */}
      <group position={[0, 0, 3.4]}>
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.1, 0.2, 0.34]} />
          <meshStandardMaterial color="#9a8f78" roughness={0.92} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.3, 0.16]} />
          <meshStandardMaterial color="#a83a30" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.85, 0.09]}>
          <boxGeometry args={[1.0, 0.82, 0.04]} />
          <meshStandardMaterial color="#caa24a" emissive="#5a4010" emissiveIntensity={0.25} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[2.1, 0.12, 0.42]} />
          <meshStandardMaterial color="#39444f" roughness={0.6} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh key={i} position={[s * 1.0, 1.7, 0]} rotation={[0, 0, -s * 0.5]}>
            <coneGeometry args={[0.07, 0.2, 4]} />
            <meshStandardMaterial color="#566472" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* Guardian lions + banner poles flanking the steps */}
      <StoneLion3D x={-0.7} z={1.15} faceZ={1} />
      <StoneLion3D x={0.7} z={1.15} faceZ={1} />
      <FlagPole3D x={-1.5} z={1.4} color={bannerColor} />
      <FlagPole3D x={1.5} z={1.4} color={bannerColor} />
      {/* ★治所 — the realm's seat flies a grand gilded canopy (華蓋) on a tall
          central mast above the hall, so the capital reads from across the map. */}
      {isCapital && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 3.6, 8]} />
            <meshStandardMaterial color="#7a5a2a" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* tiered gold canopy */}
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[0.62, 0.4, 12]} />
            <meshStandardMaterial color="#d8b048" metalness={0.6} roughness={0.35} emissive="#6a4f12" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 3.78, 0]} castShadow>
            <coneGeometry args={[0.42, 0.3, 12]} />
            <meshStandardMaterial color="#e6c25a" metalness={0.6} roughness={0.32} emissive="#6a4f12" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 4.05, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#ffe08a" metalness={0.7} roughness={0.25} emissive="#8a6a1a" emissiveIntensity={0.5} />
          </mesh>
          <group position={[0, 2.4, 0]}><Banner3D color={bannerColor} w={0.4} h={1.0} phase={x - z} faceX={0.2} /></group>
        </group>
      )}
      <Html position={[0, isCapital ? 4.5 : 2.7, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.85)', border: `1px solid ${isCapital ? '#ffd86a' : '#d4a84a'}`, padding: '1px 6px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: isCapital ? '#ffe69a' : '#f0d98a', borderRadius: 2, whiteSpace: 'nowrap' }}>
          {isCapital ? '★ 治所' : '府衙'}
        </div>
      </Html>
    </group>
  );
}

/** 兵營 — a drill yard: a long timber barracks hall, a spear rack and a
 *  war banner. The seat of 徵兵 (recruitment). */
function Barracks3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.7, 0.8]} />
        <meshStandardMaterial color="#6a5236" roughness={0.85} />
      </mesh>
      <group position={[0, 0.72, 0]}><ChineseRoof3D size={1.6} color="#3a3026" /></group>
      {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((sx, i) => (
        <mesh key={i} position={[sx, 0.35, 0.62]} rotation={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.7, 5]} />
          <meshStandardMaterial color="#2a2018" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.85, 0.3, 0.4]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.6, 6]} />
        <meshStandardMaterial color="#4a3a26" roughness={0.9} />
      </mesh>
      <FlagPole3D x={-0.85} z={0.4} color={bannerColor} h={1.8} />
    </group>
  );
}

/** 酒樓 — a two-storey tavern under a hanging 「酒」 banner: the haunt of
 *  wanderers and unsung talent. The seat of 人材探訪. */
function Tavern3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.8, 0.9]} />
        <meshStandardMaterial color="#7d5a36" roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.75]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.82} />
      </mesh>
      <group position={[0, 1.3, 0]}><ChineseRoof3D size={1.0} color="#3a2f24" ornament /></group>
      <mesh position={[0.62, 0.95, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
        <meshStandardMaterial color="#2a2018" />
      </mesh>
      <Html position={[0.62, 1.35, 0.4]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#9a2a2a', border: '1px solid #f0d0a0', color: '#f5e8c8', fontFamily: 'var(--tkm-font-body)', fontSize: '13px', padding: '2px 5px', writingMode: 'vertical-rl' }}>酒</div>
      </Html>
    </group>
  );
}

/** A stylised low-poly garden tree — leafy, blossom or pine by hash, dressed
 *  for the season (gold in autumn, snow-dusted/bare in winter). */
function GardenTree3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const season = useContext(SeasonCtx);
  const sway = useRef<THREE.Group>(null);
  const phase = x * 0.8 + z;
  useFrame((s2) => {
    const g = sway.current; if (!g) return;
    const t = s2.clock.elapsedTime;
    g.rotation.z = Math.sin(t * 1.3 + phase) * 0.028;
    g.rotation.x = Math.sin(t * 1.1 + phase) * 0.018;
  });
  const s = 0.82 + (seed % 4) * 0.08;
  const type = (seed >> 5) % 5; // 0-2 leafy, 3 blossom, 4 pine
  const trunk = (
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.13, 0.7, 6]} />
      <meshStandardMaterial color="#5a3f28" roughness={0.9} />
    </mesh>
  );
  if (type === 4) {
    // Pine — evergreen, with a snow cap in winter.
    return (
      <group ref={sway} position={[x, 0, z]} scale={[s, s, s]}>
        {trunk}
        {[[0.7, 0.55], [1.05, 0.42], [1.35, 0.3]].map(([y, r], i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, 0.5, 7]} />
            <meshStandardMaterial color={season === 'winter' ? '#3a5a44' : '#2f5530'} roughness={0.85} flatShading />
          </mesh>
        ))}
        {season === 'winter' && [[0.78, 0.46], [1.13, 0.34]].map(([y, r], i) => (
          <mesh key={`sn${i}`} position={[0, y, 0]} castShadow>
            <coneGeometry args={[r, 0.34, 7]} />
            <meshStandardMaterial color="#eef2f6" roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  // Deciduous canopy colour by season.
  let canopy: string;
  if (season === 'winter') canopy = '#dfe6ec';                                   // snow-dusted bare
  else if (season === 'autumn') canopy = ['#c87a2a', '#d4972f', '#b8502a'][(seed >> 2) % 3]; // gold/red
  else if (type === 3 && season === 'spring') canopy = '#f0b6d2';                // blossom
  else if (type === 3) canopy = '#e6a8c8';
  else canopy = ['#3f6a32', '#4a7a3a', '#356030'][(seed >> 2) % 3];              // green
  const bare = season === 'winter';
  return (
    <group ref={sway} position={[x, 0, z]} scale={[s, s, s]}>
      {trunk}
      <mesh position={[0, 0.98, 0]} castShadow>
        <icosahedronGeometry args={[bare ? 0.4 : 0.5, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.2, 0.76, 0.08]} castShadow>
        <icosahedronGeometry args={[bare ? 0.24 : 0.32, 0]} />
        <meshStandardMaterial color={canopy} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.18, 0.78, -0.1]} castShadow>
        <icosahedronGeometry args={[bare ? 0.2 : 0.28, 0]} />
        <meshStandardMaterial color={shade(canopy, 0.9)} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

/** A warm street lantern — post + glowing lamp + cap, with a soft flicker. */
function Lantern3D({ x, z }: { x: number; z: number }) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const phase = x + z * 1.7;
  useFrame((s) => {
    if (lamp.current) lamp.current.emissiveIntensity = 0.55 + Math.sin(s.clock.elapsedTime * 4 + phase) * 0.18;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
        <meshStandardMaterial color="#2a1d12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.2]} />
        <meshStandardMaterial ref={lamp} color="#d4502a" emissive="#e07020" emissiveIntensity={0.6} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.08, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.18, 0.12, 4]} />
        <meshStandardMaterial color="#2a1d12" />
      </mesh>
    </group>
  );
}

/** A flat flagstone tile — paving the streets between buildings. */
function StonePath3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const shade = ['#8f8470', '#857a66', '#968b76', '#7e7460'][seed % 4];
  return (
    <mesh position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[1.28, 1.28, 0.08]} />
      <meshStandardMaterial color={shade} roughness={0.98} />
    </mesh>
  );
}

/** A market stall — counter, posts, a coloured awning, goods and a hanging
 *  shop sign (幌子). */
function MarketStall3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const awning = ['#b8442e', '#3a6a98', '#c19a3b', '#5a8a3a', '#8a3a7a'][seed % 5];
  const sign = ['#c8362a', '#2f6a3a', '#d4a838', '#8a3a7a'][(seed >> 2) % 4];
  const goods = ['#c8a060', '#9a5a2a', '#d8c050', '#6a8a3a', '#b85040'];
  return (
    <group position={[x, 0, z]} rotation={[0, (seed % 4) * (Math.PI / 8), 0]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.4, 0.5]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.85} />
      </mesh>
      {[[-0.36, -0.2], [0.36, -0.2], [-0.36, 0.2], [0.36, 0.2]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.55, pz]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 5]} />
          <meshStandardMaterial color="#4a3520" />
        </mesh>
      ))}
      <mesh position={[0, 1.08, 0]} rotation={[0.16, 0, 0]} castShadow>
        <boxGeometry args={[1.05, 0.06, 0.72]} />
        <meshStandardMaterial color={awning} roughness={0.8} />
      </mesh>
      {/* Goods piled on the counter */}
      <mesh position={[-0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.42, 0.16, 0.32]} />
        <meshStandardMaterial color={goods[seed % goods.length]} roughness={0.8} />
      </mesh>
      <mesh position={[0.25, 0.52, 0.05]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 8]} />
        <meshStandardMaterial color={goods[(seed >> 3) % goods.length]} roughness={0.8} />
      </mesh>
      {/* Hanging shop sign (幌子) off a front post */}
      <mesh position={[0.36, 0.78, 0.32]}>
        <boxGeometry args={[0.16, 0.34, 0.03]} />
        <meshStandardMaterial color={sign} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.36, 0.97, 0.32]}>
        <boxGeometry args={[0.02, 0.04, 0.16]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
    </group>
  );
}

/* ─── Street life — villagers, props, water features ─────────────────── */
const ROBE = ['#b8442e', '#3a6a98', '#5a8a3a', '#8a6a40', '#7a4a8a', '#c2a23a', '#4a6a6a', '#a85838'];
const FLOWER = ['#d24a6a', '#e0a83a', '#c85ad0', '#e85a3a', '#f0d040', '#e86aa0'];

/** A tiny townsfolk figure — robe, head, conical hat or topknot. Static. */
function Villager3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const robe = ROBE[seed % ROBE.length];
  const rot = (seed % 8) * (Math.PI / 4);
  const hat = (seed >> 3) % 2 === 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.34, 7]} />
        <meshStandardMaterial color={robe} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 7]} />
        <meshStandardMaterial color="#e6c39a" roughness={0.8} />
      </mesh>
      {hat ? (
        <mesh position={[0, 0.47, 0]} castShadow>
          <coneGeometry args={[0.12, 0.1, 10]} />
          <meshStandardMaterial color="#9a8050" roughness={0.8} />
        </mesh>
      ) : (
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.035, 6, 5]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
      )}
    </group>
  );
}

/** A stone well with a little tiled roof and a bucket. */
function Well3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.37, 0.38, 8]} />
        <meshStandardMaterial color="#8f8775" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 8]} />
        <meshStandardMaterial color="#1f3a4a" roughness={0.3} metalness={0.4} />
      </mesh>
      {[-0.3, 0.3].map((px, i) => (
        <mesh key={i} position={[px, 0.62, 0]} castShadow>
          <boxGeometry args={[0.05, 0.78, 0.05]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.78, 0.06, 0.34]} />
        <meshStandardMaterial color="#4a3520" />
      </mesh>
      <group position={[0, 1.04, 0]}><ChineseRoof3D size={0.5} color="#39444f" /></group>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.11, 7]} />
        <meshStandardMaterial color="#6e5230" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A two-wheeled handcart loaded with goods. */
function Cart3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const rot = (seed % 4) * (Math.PI / 5);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.72, 0.16, 0.46]} />
        <meshStandardMaterial color="#7a5a38" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.5, 0.2, 0.34]} />
        <meshStandardMaterial color="#c2a060" roughness={0.8} />
      </mesh>
      {[-0.24, 0.24].map((pz, i) => (
        <mesh key={i} position={[-0.28, 0.18, pz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
          <meshStandardMaterial color="#3a2818" roughness={0.85} />
        </mesh>
      ))}
      {[-0.16, 0.16].map((pz, i) => (
        <mesh key={`h${i}`} position={[0.42, 0.34, pz]} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[0.42, 0.03, 0.03]} />
          <meshStandardMaterial color="#5a4530" />
        </mesh>
      ))}
    </group>
  );
}

/** A townsfolk figure that strolls back and forth between two points along a
 *  street, facing the way it walks with a little gait bob. */
function Walker3D({ ax, az, bx, bz, seed }: { ax: number; az: number; bx: number; bz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const robe = ROBE[seed % ROBE.length];
  const hat = (seed >> 3) % 2 === 0;
  const speed = 0.16 + (seed % 5) * 0.02;
  useFrame((s) => {
    const g = ref.current; if (!g) return;
    const t = s.clock.elapsedTime * speed + seed;
    const u = (Math.sin(t) + 1) / 2;
    g.position.x = ax + (bx - ax) * u;
    g.position.z = az + (bz - az) * u;
    g.position.y = Math.abs(Math.sin(t * 8)) * 0.04;
    const fwd = Math.cos(t) >= 0 ? 1 : -1;
    g.rotation.y = Math.atan2((bx - ax) * fwd, (bz - az) * fwd);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, 0.34, 7]} /><meshStandardMaterial color={robe} roughness={0.85} /></mesh>
      <mesh position={[0, 0.4, 0]} castShadow><sphereGeometry args={[0.07, 8, 7]} /><meshStandardMaterial color="#e6c39a" roughness={0.8} /></mesh>
      {hat
        ? <mesh position={[0, 0.47, 0]} castShadow><coneGeometry args={[0.12, 0.1, 10]} /><meshStandardMaterial color="#9a8050" roughness={0.8} /></mesh>
        : <mesh position={[0, 0.46, 0]}><sphereGeometry args={[0.035, 6, 5]} /><meshStandardMaterial color="#2a2018" /></mesh>}
    </group>
  );
}

/** An ox-cart trundling along the avenue between two points. */
function MovingCart3D({ ax, az, bx, bz, seed }: { ax: number; az: number; bx: number; bz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current; if (!g) return;
    const t = s.clock.elapsedTime * 0.05 + seed;
    const u = (Math.sin(t) + 1) / 2;
    g.position.x = ax + (bx - ax) * u;
    g.position.z = az + (bz - az) * u;
    const fwd = Math.cos(t) >= 0 ? 1 : -1;
    g.rotation.y = Math.atan2((bx - ax) * fwd, (bz - az) * fwd);
  });
  return (
    <group ref={ref}>
      {/* Ox */}
      <mesh position={[0, 0.34, 0.7]} castShadow><boxGeometry args={[0.34, 0.34, 0.6]} /><meshStandardMaterial color="#6a5440" roughness={0.9} /></mesh>
      <mesh position={[0, 0.4, 1.05]} castShadow><boxGeometry args={[0.26, 0.24, 0.24]} /><meshStandardMaterial color="#5a4530" roughness={0.9} /></mesh>
      {[-0.12, 0.12].map((hx, i) => (
        <mesh key={i} position={[hx, 0.54, 1.12]} rotation={[0, 0, hx > 0 ? -0.5 : 0.5]}><cylinderGeometry args={[0.02, 0.02, 0.18, 5]} /><meshStandardMaterial color="#e8e0d0" /></mesh>
      ))}
      {[[-0.12, 0.5], [0.12, 0.5], [-0.12, 0.9], [0.12, 0.9]].map(([lx, lz], i) => (
        <mesh key={`lg${i}`} position={[lx, 0.12, lz]}><cylinderGeometry args={[0.04, 0.04, 0.24, 5]} /><meshStandardMaterial color="#4a3826" /></mesh>
      ))}
      {/* Cart bed + wheels + load */}
      <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.7, 0.14, 0.5]} /><meshStandardMaterial color="#7a5a38" roughness={0.85} /></mesh>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.5, 0.22, 0.36]} /><meshStandardMaterial color="#b89050" roughness={0.8} /></mesh>
      {[-0.27, 0.27].map((wz, i) => (
        <mesh key={`w${i}`} position={[0, 0.18, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.05, 12]} /><meshStandardMaterial color="#3a2818" /></mesh>
      ))}
    </group>
  );
}

/** A wisp of opaque chimney smoke — three puffs rise and shrink, then recycle
 *  (no transparency; they just dwindle to nothing). */
function Smoke3D({ x, z, base = 1.0 }: { x: number; z: number; base?: number }) {
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = grp.current; if (!g) return;
    g.children.forEach((m, i) => {
      const t = (s.clock.elapsedTime * 0.32 + i * 0.34) % 1;
      m.position.set(Math.sin(t * 4 + i) * 0.12, base + t * 1.4, 0);
      const sc = Math.sin(t * Math.PI) * 0.36 + 0.03;
      m.scale.setScalar(sc);
    });
  });
  return (
    <group ref={grp} position={[x, 0, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}><sphereGeometry args={[0.5, 7, 6]} /><meshStandardMaterial color="#bcb6ac" roughness={1} /></mesh>
      ))}
    </group>
  );
}

/** A few birds wheeling slowly over the city, wings flapping. */
function Birds3D({ cx, cz, radius, y }: { cx: number; cz: number; radius: number; y: number }) {
  const grp = useRef<THREE.Group>(null);
  const N = 5;
  useFrame((s) => {
    const g = grp.current; if (!g) return;
    const t = s.clock.elapsedTime * 0.22;
    g.children.forEach((b, i) => {
      const a = t + (i * Math.PI * 2) / N;
      b.position.set(cx + Math.cos(a) * radius, y + Math.sin(a * 1.7 + i) * 0.8, cz + Math.sin(a) * radius);
      b.rotation.y = -a;
      const flap = Math.sin(s.clock.elapsedTime * 7 + i) * 0.5;
      const wings = b as THREE.Object3D;
      if (wings.children[0]) wings.children[0].rotation.z = 0.3 + flap;
      if (wings.children[1]) wings.children[1].rotation.z = -0.3 - flap;
    });
  });
  return (
    <group ref={grp}>
      {Array.from({ length: N }).map((_, i) => (
        <group key={i}>
          <mesh position={[0.13, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.1]} /><meshStandardMaterial color="#2a2620" /></mesh>
          <mesh position={[-0.13, 0, 0]}><boxGeometry args={[0.26, 0.02, 0.1]} /><meshStandardMaterial color="#2a2620" /></mesh>
        </group>
      ))}
    </group>
  );
}

/** A glowing brazier with a flickering flame (opaque emissive — no transparency). */
function Brazier3D({ x, z }: { x: number; z: number }) {
  const flame = useRef<THREE.Mesh>(null);
  const coals = useRef<THREE.MeshStandardMaterial>(null);
  const phase = x * 1.7 + z;
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const f = 0.85 + Math.sin(t * 9 + phase) * 0.12 + Math.sin(t * 17 + phase) * 0.06;
    if (flame.current) { flame.current.scale.set(0.9 + (f - 0.9) * 0.5, f, 0.9 + (f - 0.9) * 0.5); }
    if (coals.current) { coals.current.emissiveIntensity = 1.0 + (f - 0.9) * 1.2; }
  });
  return (
    <group position={[x, 0, z]}>
      {[[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.18, pz]}>
          <cylinderGeometry args={[0.022, 0.022, 0.36, 5]} />
          <meshStandardMaterial color="#2a1d12" />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.13, 0.16, 10]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 10]} />
        <meshStandardMaterial ref={coals} color="#e0641e" emissive="#ff7a1e" emissiveIntensity={1.1} roughness={0.5} />
      </mesh>
      <mesh ref={flame} position={[0, 0.58, 0]}>
        <coneGeometry args={[0.08, 0.2, 7]} />
        <meshStandardMaterial color="#ffb43a" emissive="#ff8a1e" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** A raised flower bed — soil box, greenery and bright blossoms. */
function FlowerBed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.07, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.72, 0.14, 0.5]} />
        <meshStandardMaterial color="#5a4028" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.62, 0.04, 0.4]} />
        <meshStandardMaterial color="#3f6a32" roughness={0.9} />
      </mesh>
      {[[-0.2, -0.1], [0, 0.08], [0.2, -0.06], [-0.08, -0.13], [0.13, 0.11]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.22, pz]} castShadow>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshStandardMaterial color={FLOWER[(seed + i) % FLOWER.length]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** An arched stone bridge spanning the moat outside the gate. */
function StoneBridge3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.18, 2.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.14, 1.1]} />
        <meshStandardMaterial color="#a89a78" roughness={0.95} />
      </mesh>
      {[-0.52, 0.52].map((px, i) => (
        <mesh key={i} position={[px, 0.4, 0]} castShadow>
          <boxGeometry args={[0.1, 0.3, 2.5]} />
          <meshStandardMaterial color="#8f8472" roughness={0.92} />
        </mesh>
      ))}
      {/* Support pillars dipping into the moat */}
      {[-0.8, 0.8].map((pz, i) => (
        <mesh key={`p${i}`} position={[0, -0.1, pz]} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.16]} />
          <meshStandardMaterial color="#7e7460" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** A 水門 water gate set into a wall — twin piers, an arch lintel, a raised
 *  portcullis and a little gatehouse, opening the wall to the moat. The wall
 *  runs along z here, so boats pass through along x. */
function WaterGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.78, 0.78].map((pz, i) => (
        <mesh key={i} position={[0, 0.8, pz]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.6, 0.45]} />
          <meshStandardMaterial color="#6a5540" roughness={0.92} />
        </mesh>
      ))}
      {/* Arch lintel spanning the opening */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.5]} />
        <meshStandardMaterial color="#7a6550" roughness={0.9} />
      </mesh>
      {/* Raised portcullis bars */}
      {[-0.45, -0.15, 0.15, 0.45].map((pz, i) => (
        <mesh key={`b${i}`} position={[0, 0.95, pz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.7} />
        </mesh>
      ))}
      {/* Gatehouse + swept roof */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.55, 1.0]} />
        <meshStandardMaterial color="#8a6a40" roughness={0.8} />
      </mesh>
      <group position={[0, 2.35, 0]}><ChineseRoof3D size={1.4} color="#2f3a48" ornament /></group>
      <mesh position={[0, 3.0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 3.12, 0]}>
        <Banner3D color={bannerColor} w={0.3} h={0.3} phase={x + z} faceX={0.15} />
      </group>
    </group>
  );
}

/** A timber wharf reaching out over the moat — plank deck on pilings, moored
 *  cargo boats, crates and barrels, and a couple of dockhands. Extends +x. */
function Dock3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Plank deck */}
      <mesh position={[1.7, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.12, 1.1]} />
        <meshStandardMaterial color="#7a5e38" roughness={0.85} />
      </mesh>
      {/* Pilings into the water */}
      {[0.4, 1.5, 2.6].flatMap((px) => [-0.42, 0.42].map((pz) => (
        <mesh key={`pl-${px}-${pz}`} position={[px, -0.12, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 6]} />
          <meshStandardMaterial color="#4a3520" roughness={0.9} />
        </mesh>
      )))}
      {/* Cargo */}
      <mesh position={[0.55, 0.4, 0.24]} castShadow>
        <boxGeometry args={[0.34, 0.3, 0.34]} />
        <meshStandardMaterial color="#9a7040" roughness={0.85} />
      </mesh>
      <mesh position={[0.92, 0.36, -0.26]} castShadow>
        <boxGeometry args={[0.3, 0.26, 0.3]} />
        <meshStandardMaterial color="#8a6038" roughness={0.85} />
      </mesh>
      <mesh position={[0.62, 0.72, 0.2]} castShadow>
        <boxGeometry args={[0.28, 0.24, 0.28]} />
        <meshStandardMaterial color="#a87a48" roughness={0.85} />
      </mesh>
      <mesh position={[1.4, 0.4, 0.3]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.36, 10]} />
        <meshStandardMaterial color="#6a4a28" roughness={0.85} />
      </mesh>
      {/* Moored boats alongside (they bob) + dockhands */}
      <SmallBoat3D x={2.7} z={1.0} seed={2.1} />
      <SmallBoat3D x={1.9} z={-1.05} seed={4.3} />
      <Villager3D x={0.7} z={0.05} seed={42} />
      <Villager3D x={1.7} z={0.12} seed={71} />
    </group>
  );
}

/** Hundreds of grass tufts in one draw call (instanced) — ground texture on
 *  the open earth; in winter they become low snow mounds. */
function GrassTufts3D({ tufts }: { tufts: Array<{ x: number; z: number; s: number; r: number; c: string }> }) {
  const season = useContext(SeasonCtx);
  const snowy = season === 'winter';
  if (!tufts.length) return null;
  return (
    <Instances limit={tufts.length} range={tufts.length} castShadow={false} receiveShadow>
      <coneGeometry args={[0.07, 0.26, 5]} />
      <meshStandardMaterial roughness={0.9} flatShading />
      {tufts.map((t, i) => (
        <Instance
          key={i}
          position={[t.x, snowy ? 0.07 : 0.11, t.z]}
          rotation={[0, t.r, 0]}
          scale={snowy ? [t.s * 1.5, t.s * 0.5, t.s * 1.5] : [t.s, t.s, t.s]}
          color={snowy ? '#eef3f7' : t.c}
        />
      ))}
    </Instances>
  );
}

/** Lily pads floating on the moat, one draw call. */
function LilyPads3D({ pads }: { pads: Array<{ x: number; z: number; s: number }> }) {
  if (!pads.length) return null;
  return (
    <Instances limit={pads.length} range={pads.length} castShadow={false}>
      <cylinderGeometry args={[0.18, 0.18, 0.03, 7]} />
      <meshStandardMaterial color="#3f7a4a" roughness={0.7} />
      {pads.map((p, i) => (
        <Instance key={i} position={[p.x, -0.07, p.z]} scale={[p.s, 1, p.s]} />
      ))}
    </Instances>
  );
}

/** A reed clump at the water's edge. */
function Reed3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const n = 4 + (seed % 3);
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + seed;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.22, Math.sin(a) * 0.1]} rotation={[0, 0, Math.cos(a) * 0.18]} castShadow>
            <cylinderGeometry args={[0.012, 0.02, 0.5, 4]} />
            <meshStandardMaterial color="#6a7a3a" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A little sampan drifting and bobbing on the moat. */
function SmallBoat3D({ x, z, seed }: { x: number; z: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    g.position.y = -0.04 + Math.sin(t * 1.1 + seed) * 0.04;
    g.rotation.z = Math.sin(t * 0.9 + seed) * 0.05;
    g.rotation.x = Math.sin(t * 1.3 + seed) * 0.04;
  });
  return (
    <group ref={ref} position={[x, -0.04, z]} rotation={[0, seed, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.4, 0.12, 1.0]} />
        <meshStandardMaterial color="#6e5230" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.0, 0.5]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.3]} />
        <meshStandardMaterial color="#6e5230" roughness={0.85} />
      </mesh>
      {/* awning hoop */}
      <mesh position={[0, 0.28, -0.1]} castShadow>
        <boxGeometry args={[0.36, 0.1, 0.36]} />
        <meshStandardMaterial color="#9a8050" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** A multi-eave pagoda (塔) — the city's vertical landmark. */
function Pagoda3D({ x, z }: { x: number; z: number }) {
  const tiers = 5;
  const topY = 0.4 + tiers * 0.78;
  return (
    <group position={[x, 0, z]}>
      {/* Stone base */}
      <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.7, 0.36, 1.7]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      {Array.from({ length: tiers }).map((_, i) => {
        const y = 0.5 + i * 0.78;
        const w = 1.25 - i * 0.17;
        return (
          <group key={i}>
            <mesh position={[0, y, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.6, w]} />
              <meshStandardMaterial color="#9c3a30" roughness={0.7} />
            </mesh>
            {/* windows on each face */}
            <mesh position={[0, y, w / 2 + 0.01]}>
              <boxGeometry args={[w * 0.32, 0.26, 0.03]} />
              <meshStandardMaterial color="#241c14" roughness={0.6} />
            </mesh>
            <group position={[0, y + 0.34, 0]}>
              <ChineseRoof3D size={w} color="#2f3a48" beasts />
            </group>
          </group>
        );
      })}
      {/* Gilded finial */}
      <mesh position={[0, topY + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.5, 7]} />
        <meshStandardMaterial color="#d8b450" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, topY + 0.42, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#e8c860" metalness={0.6} roughness={0.35} />
      </mesh>
      <Html position={[0, topY + 0.7, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 2, whiteSpace: 'nowrap' }}>
          寶塔
        </div>
      </Html>
    </group>
  );
}

/** A banner on a short pole — strung along the wall-walk at intervals. */
function WallBanner3D({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <group position={[0, 1.98, 0]}>
        <Banner3D color={color} w={0.22} h={0.55} phase={x * 1.3 + z} faceX={0.11} />
      </group>
    </group>
  );
}

/** A 牌坊 memorial archway straddling the main avenue. */
function Paifang3D({ x, z }: { x: number; z: number }) {
  const pillars = [-1.1, -0.4, 0.4, 1.1];
  return (
    <group position={[x, 0, z]}>
      {pillars.map((px, i) => (
        <group key={i}>
          <mesh position={[px, 0.13, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.26, 0.34]} />
            <meshStandardMaterial color="#8f8472" roughness={0.92} />
          </mesh>
          <mesh position={[px, 1.05, 0]} castShadow>
            <boxGeometry args={[0.16, 1.9, 0.16]} />
            <meshStandardMaterial color="#9c3a30" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Lintels */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <boxGeometry args={[2.5, 0.13, 0.2]} />
        <meshStandardMaterial color="#a84838" roughness={0.65} />
      </mesh>
      <mesh position={[0, 2.02, 0]} castShadow>
        <boxGeometry args={[2.5, 0.22, 0.24]} />
        <meshStandardMaterial color="#7a2820" roughness={0.7} />
      </mesh>
      {/* Gilded plaque */}
      <mesh position={[0, 1.86, 0.04]}>
        <boxGeometry args={[0.72, 0.26, 0.05]} />
        <meshStandardMaterial color="#caa24a" emissive="#5a4010" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      {/* Tiered roofs — tall centre, lower sides */}
      <group position={[0, 2.28, 0]}><ChineseRoof3D size={1.05} color="#2f3a48" ornament beasts /></group>
      <group position={[-1.1, 1.95, 0]}><ChineseRoof3D size={0.5} color="#2f3a48" /></group>
      <group position={[1.1, 1.95, 0]}><ChineseRoof3D size={0.5} color="#2f3a48" /></group>
    </group>
  );
}

/** A 鼓樓 drum tower — stone arch base, a great red drum, double-eave roof. */
function DrumTower3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Stone base with an arched passage */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.44, 0.81]}>
        <boxGeometry args={[0.5, 0.72, 0.05]} />
        <meshStandardMaterial color="#241c14" roughness={0.6} />
      </mesh>
      {/* Upper pavilion */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.9, 1.3]} />
        <meshStandardMaterial color="#9c3a30" roughness={0.7} />
      </mesh>
      {[-0.5, -0.17, 0.17, 0.5].map((px, i) => (
        <mesh key={i} position={[px, 1.5, 0.66]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 7]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* The great drum */}
      <mesh position={[0, 1.5, 0.42]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.34, 16]} />
        <meshStandardMaterial color="#b83020" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.31, 0.31, 0.1, 16]} />
        <meshStandardMaterial color="#e0c060" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Double-eave roof */}
      <group position={[0, 2.0, 0]}><ChineseRoof3D size={1.45} color="#2f3a48" ornament beasts /></group>
      <group position={[0, 2.45, 0]}><ChineseRoof3D size={0.95} color="#2f3a48" ornament /></group>
      <Html position={[0, 3.0, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 2, whiteSpace: 'nowrap' }}>
          鼓樓
        </div>
      </Html>
    </group>
  );
}

/** A 鐘樓 bell tower — open upper storey with a great bronze bell slung from a
 *  beam, mirroring the drum tower (晨鐘暮鼓). */
function BellTower3D({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Stone arch base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.0, 1.6]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.44, 0.81]}>
        <boxGeometry args={[0.5, 0.72, 0.05]} />
        <meshStandardMaterial color="#241c14" roughness={0.6} />
      </mesh>
      {/* Open upper storey — four red columns */}
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.55, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Hanging beam + bronze bell */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.5, 14]} />
        <meshStandardMaterial color="#8a6a3a" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.88, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#6a4a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Double-eave roof */}
      <group position={[0, 2.15, 0]}><ChineseRoof3D size={1.45} color="#2f3a48" ornament beasts /></group>
      <group position={[0, 2.6, 0]}><ChineseRoof3D size={0.95} color="#2f3a48" ornament /></group>
      <Html position={[0, 3.15, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.8)', border: '1px solid #c19a3b', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#e0c060', borderRadius: 2, whiteSpace: 'nowrap' }}>
          鐘樓
        </div>
      </Html>
    </group>
  );
}

/** An open garden pavilion (亭) — stone base, red columns, low railing, a
 *  swept roof and a finial. */
function Pavilion3D({ x, z }: { x: number; z: number }) {
  const corners: Array<[number, number]> = [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.15, 0.24, 1.15]} />
        <meshStandardMaterial color="#a89a78" roughness={0.92} />
      </mesh>
      {corners.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.7, pz]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 1.0, 8]} />
          <meshStandardMaterial color="#a84838" roughness={0.6} />
        </mesh>
      ))}
      {/* Low railing rails on three sides */}
      {[[0, -0.46, 1.0, 0.05], [-0.46, 0, 0.05, 1.0], [0.46, 0, 0.05, 1.0]].map((r, i) => (
        <mesh key={`rl${i}`} position={[r[0], 0.4, r[1]]}>
          <boxGeometry args={[r[2], 0.12, r[3]]} />
          <meshStandardMaterial color="#8a3a30" roughness={0.7} />
        </mesh>
      ))}
      <group position={[0, 1.22, 0]}><ChineseRoof3D size={1.15} color="#2f3a48" ornament beasts /></group>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#e8c860" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** A classical garden — a pond with stone rim, lotus pads, a zig-zag plank
 *  bridge, a lakeside pavilion and a pair of willows. */
function Garden3D({ x, z }: { x: number; z: number }) {
  const season = useContext(SeasonCtx);
  const frozen = season === 'winter';
  return (
    <group position={[x, 0, z]}>
      {/* Pond water — frozen pale in winter */}
      <mesh position={[0, 0.0, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.12, 1.9]} />
        <meshStandardMaterial color={frozen ? '#cfe2ea' : '#2f6a86'} roughness={frozen ? 0.5 : 0.28} metalness={frozen ? 0.2 : 0.45} />
      </mesh>
      {/* Stone rim (four kerbs) */}
      {[[0, -1.02, 2.9, 0.18], [0, 1.02, 2.9, 0.18], [-1.42, 0, 0.18, 2.2], [1.42, 0, 0.18, 2.2]].map((r, i) => (
        <mesh key={i} position={[r[0], 0.1, r[1]]} castShadow receiveShadow>
          <boxGeometry args={[r[2], 0.2, r[3]]} />
          <meshStandardMaterial color="#9a8f78" roughness={0.94} />
        </mesh>
      ))}
      {/* Rim rocks */}
      {[[-1.1, -0.7], [1.2, 0.6], [-0.9, 0.8]].map(([rx, rz], i) => (
        <mesh key={`rk${i}`} position={[rx, 0.16, rz]} castShadow>
          <icosahedronGeometry args={[0.16 + (i % 2) * 0.05, 0]} />
          <meshStandardMaterial color="#7a7468" roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Lotus pads */}
      {[[-0.5, -0.3], [0.3, 0.2], [0.7, -0.4], [-0.2, 0.5]].map(([px, pz], i) => (
        <mesh key={`lp${i}`} position={[px, 0.07, pz]}>
          <cylinderGeometry args={[0.16, 0.16, 0.03, 7]} />
          <meshStandardMaterial color="#3f7a4a" roughness={0.7} />
        </mesh>
      ))}
      {/* Zig-zag plank bridge across the pond */}
      {[[-0.7, 0.35, 0.2], [0, 0.35, -0.1], [0.7, 0.35, 0.2]].map((b, i) => (
        <mesh key={`bz${i}`} position={[b[0], 0.16, b[2]]} rotation={[0, i === 1 ? 0.4 : -0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.06, 0.3]} />
          <meshStandardMaterial color="#8a3a30" roughness={0.7} />
        </mesh>
      ))}
      {/* Lakeside pavilion + two willows */}
      <Pavilion3D x={1.35} z={-0.9} />
      <GardenTree3D x={-1.3} z={0.95} seed={3} />
      <GardenTree3D x={1.4} z={1.0} seed={11} />
    </group>
  );
}

/** A 屯田 farm plot — tilled rows of crops (green sprouts → gold harvest →
 *  bare winter soil), a scarecrow and a farmhand. */
function Farmland3D({ x, z, lush = 0.5 }: { x: number; z: number; lush?: number }) {
  const season = useContext(SeasonCtx);
  const crop = season === 'winter' ? '#cdd6dc' : season === 'autumn' ? '#cba63a' : season === 'summer' ? '#9aa83a' : '#6a9a4a';
  const soil = season === 'winter' ? '#6f6a60' : '#5a4530';
  // More productive farms (higher agriculture) sprout denser, taller rows.
  const rows = Math.max(3, Math.min(7, Math.round(3 + lush * 4)));
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.1, 2.2]} />
        <meshStandardMaterial color={soil} roughness={0.97} />
      </mesh>
      {Array.from({ length: rows }).map((_, i) => {
        const rz = -0.85 + (i * 1.7) / (rows - 1);
        return (
          <group key={i}>
            <mesh position={[0, 0.13, rz]} receiveShadow>
              <boxGeometry args={[2.8, 0.09, 0.2]} />
              <meshStandardMaterial color={shade(soil, 1.25)} roughness={0.95} />
            </mesh>
            {season !== 'winter' && Array.from({ length: 7 }).map((_, j) => (
              <mesh key={j} position={[-1.2 + j * 0.4, 0.26, rz]} castShadow>
                <coneGeometry args={[0.07, 0.3, 5]} />
                <meshStandardMaterial color={crop} roughness={0.85} flatShading />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Scarecrow */}
      <group position={[1.25, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 1.0, 5]} /><meshStandardMaterial color="#6a5030" /></mesh>
        <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.7, 5]} /><meshStandardMaterial color="#6a5030" /></mesh>
        <mesh position={[0, 0.93, 0]} castShadow><sphereGeometry args={[0.1, 8, 7]} /><meshStandardMaterial color="#c8a060" roughness={0.9} /></mesh>
        <mesh position={[0, 1.02, 0]}><coneGeometry args={[0.17, 0.13, 8]} /><meshStandardMaterial color="#9a8050" /></mesh>
      </group>
      <Villager3D x={-1.15} z={0.95} seed={88} />
      <Html position={[0, 1.2, 0]} center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.78)', border: '1px solid #7a8a3a', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#bcd07a', borderRadius: 2, whiteSpace: 'nowrap' }}>
          屯田
        </div>
      </Html>
    </group>
  );
}

/** 焦土 — charred rubble mounds, broken beams and pillars of ruin-smoke laid
 *  over a razed city, on a sampling of its former house plots. */
function RuinsOverlay({ houses }: { houses: Array<{ x: number; z: number; seed: number; key: string }> }) {
  const sample = houses.filter((_, i) => i % 3 === 0).slice(0, RENDER_HI ? 14 : 8);
  return (
    <>
      {sample.map((h) => (
        <group key={`rb-${h.key}`} position={[h.x, 0, h.z]} rotation={[0, (h.seed % 6) * 0.5, 0]}>
          <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7 + (h.seed % 3) * 0.1, 0.34, 0.6]} />
            <meshStandardMaterial color="#3a322a" roughness={1} />
          </mesh>
          <mesh position={[0.2, 0.42, 0.1]} rotation={[0, 0, 0.7]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#241c14" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {sample.filter((_, i) => i % 4 === 0).map((h) => (
        <Smoke3D key={`rsm-${h.key}`} x={h.x} z={h.z} base={0.6} />
      ))}
    </>
  );
}

/** 名產 — a market consignment (stacked crates/sacks) tagged with the good's
 *  glyph; one adaptable prop stands in for all 15 regional specialties. */
function SpecialtyProp3D({ specialty, x, z }: { specialty: SpecialtyDef; x: number; z: number }) {
  const tint = specialty.foodMul > 1 ? '#b89a52' : '#9a7a4a';
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow><boxGeometry args={[0.4, 0.36, 0.4]} /><meshStandardMaterial color={tint} roughness={0.9} /></mesh>
      <mesh position={[0.28, 0.14, 0.1]} castShadow><boxGeometry args={[0.3, 0.28, 0.3]} /><meshStandardMaterial color="#8a6a3a" roughness={0.92} /></mesh>
      <mesh position={[-0.1, 0.5, 0]} castShadow><boxGeometry args={[0.34, 0.3, 0.34]} /><meshStandardMaterial color={tint} roughness={0.9} /></mesh>
      <Html position={[0, 0.98, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(20,14,8,0.82)', border: '1px solid #caa24a', padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: '#e8c46a', borderRadius: 2, whiteSpace: 'nowrap' }}>
          {specialty.glyph} {specialty.zh}
        </div>
      </Html>
    </group>
  );
}

/** 駐軍旌旗 — a rank of force banners by the drill ground, more for a big
 *  garrison (a great host plants a forest of flags). */
function GarrisonBanners3D({ x, z, troops, color }: { x: number; z: number; troops: number; color: string }) {
  // Each banner is a real draw call; cap lower on low-tier devices.
  const n = Math.max(0, Math.min(RENDER_HI ? 8 : 4, Math.round(troops / 12000)));
  if (n === 0) return null;
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }, (_, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        return <FlagPole3D key={i} x={-1.2 + col * 0.8} z={1.7 + row * 0.7} color={color} h={1.9} />;
      })}
    </group>
  );
}

/** A pulsing ground ring marking an active work-site (施政中). */
function ActivityRing3D({ x, z, color }: { x: number; z: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime;
    const k = 0.78 + Math.sin(t * 2.2) * 0.16;
    m.scale.set(k, k, 1);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.3 + (Math.sin(t * 2.2) + 1) * 0.12;
  });
  return (
    <mesh ref={ref} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 1.12, 30]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** 施政中 — work-in-progress at a landmark: a pulsing ring, a pair of pacing
 *  hands, and a 「…中」 tag. `soldier` adds a spear rank (操演), `build` a small
 *  scaffold (築城). Driven purely off this city's pending orders. */
function CommandActivity3D({ x, z, color, label, build = false, soldier = false }: {
  x: number; z: number; color: string; label: string; build?: boolean; soldier?: boolean;
}) {
  return (
    <group>
      <ActivityRing3D x={x} z={z} color={color} />
      {/* The pacing figures are the costly part (multi-mesh) — ring + tag carry
          the meaning, so low-tier devices keep those and drop the crowd. */}
      {RENDER_HI && <Walker3D ax={x - 0.85} az={z + 0.5} bx={x + 0.85} bz={z + 0.5} seed={Math.round(x * 13 + z * 7)} />}
      {RENDER_HI && <Walker3D ax={x + 0.7} az={z - 0.6} bx={x - 0.7} bz={z - 0.6} seed={Math.round(x * 5 + z * 17) + 3} />}
      {soldier && [-0.6, -0.2, 0.2, 0.6].map((px, i) => (
        <mesh key={i} position={[x + px, 0.55, z - 0.9]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 5]} />
          <meshStandardMaterial color="#caa24a" roughness={0.6} />
        </mesh>
      ))}
      {build && (
        <group position={[x, 0, z - 0.2]}>
          {[[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]].map((p, i) => (
            <mesh key={i} position={[p[0], 0.55, p[1]]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.1, 5]} />
              <meshStandardMaterial color="#7a5a32" roughness={0.9} />
            </mesh>
          ))}
          {[0.45, 0.85].map((hh, i) => (
            <mesh key={`pl${i}`} position={[0, hh, 0]} castShadow>
              <boxGeometry args={[1.2, 0.06, 1.2]} />
              <meshStandardMaterial color="#8a6a3a" roughness={0.92} />
            </mesh>
          ))}
        </group>
      )}
      <Html position={[x, build ? 1.5 : 1.1, z]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(18,26,12,0.86)', border: `1px solid ${color}`, padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: '#dceec4', borderRadius: 2, whiteSpace: 'nowrap' }}>
          {label}中
        </div>
      </Html>
    </group>
  );
}

/** Scatter dwellings across the inside-city land, leaving gaps for streets. */
function CityDwellings3D({ preview, cityWallCol, occupied, bannerColor, stats, grand, landmarkInfo, weatherKind, ruined, isCapital, specialty, troops, activity }: {
  preview: ReturnType<typeof previewBattlefield>;
  cityWallCol: number;
  occupied: Set<string>;
  bannerColor: string;
  stats: CityStats;
  grand: boolean;
  landmarkInfo: LandmarkInfo;
  weatherKind: WeatherKind;
  ruined: boolean;
  isCapital: boolean;
  specialty: SpecialtyDef | null;
  troops: number;
  activity: CityActivity;
}) {
  const inspect = useContext(InspectCtx);
  // The market grows with commerce — a sleepy 2-stall corner at low trade,
  // a packed bazaar when business booms.
  const market = useMemo(() => {
    const W = preview.width, H = preview.height;
    const out: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const baseCol = Math.min(W - 2, Math.round(cityWallCol * 0.62));
    const baseRow = Math.max(1, Math.round(H * 0.6));
    const OFFSETS = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [2, 1], [0, 2], [1, 2], [2, 2]] as const;
    const count = Math.max(2, Math.min(OFFSETS.length, 2 + Math.round(stats.fCommerce * 7)));
    for (const [dc, dr] of OFFSETS.slice(0, count)) {
      const col = baseCol + dc, row = baseRow + dr;
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue;
      const [x, z] = hexWorld(col, row);
      out.push({ x, z, seed: dwellingHash(col, row), key });
    }
    return out;
  }, [preview.width, preview.height, cityWallCol, occupied, stats.fCommerce]);

  // Twin landmark towers in the back corners — 鼓樓 left, 寶塔 right. Their
  // footprints (and a one-tile margin) are kept clear of houses.
  const landmarks = useMemo(() => {
    const W = preview.width, H = preview.height;
    const pagodaCell = { col: Math.max(3, W - 4), row: 3 };
    const drumCell = { col: 3, row: 3 };
    // Bell tower mirrors the drum tower, front-right (row H-4 has no plots).
    const bellCell = { col: Math.max(3, W - 4), row: Math.max(2, H - 4) };
    // Garden near the gate, in the rows below the foundation grid (rows ≥ H-3
    // never hold a plot), so it never overlaps a player building.
    const gateCol = Math.floor(W / 2);
    const gardenCell = { col: Math.max(2, gateCol === W - 4 ? gateCol - 4 : gateCol - 3), row: Math.max(2, H - 3) };
    // The 府衙 compound — reserve a 3×3 so stray houses don't sit in its court.
    const hallCell = { col: Math.max(1, Math.round(cityWallCol * 0.42)), row: Math.round(H / 2) };
    // 屯田 farm plot front-right, below the foundation grid.
    const farmCell = { col: Math.max(3, W - 5), row: Math.max(2, H - 3) };
    // 兵營 / 酒樓 flank the entrance avenue, in the plot-free south band.
    const barracksCell = { col: Math.max(2, gateCol - 4), row: Math.max(2, H - 3) };
    const tavernCell = { col: Math.min(W - 2, gateCol + 3), row: Math.max(2, H - 3) };
    const keys = new Set<string>();
    for (const c of [pagodaCell, drumCell, bellCell, gardenCell, hallCell, barracksCell, tavernCell]) {
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) keys.add(`${c.col + dc},${c.row + dr}`);
    }
    for (let dc = -1; dc <= 2; dc++) for (let dr = -1; dr <= 1; dr++) keys.add(`${farmCell.col + dc},${farmCell.row + dr}`);
    // Keep houses off the inner palace wall line in great cities.
    if (grand) for (const c of innerWallCells(W, H).cells) keys.add(`${c.col},${c.row}`);
    // …or off the canal line in lesser cities.
    else { const cr = canalRow(H); for (let c = 1; c <= W - 2; c++) keys.add(`${c},${cr}`); }
    const [px, pz] = hexWorld(pagodaCell.col, pagodaCell.row);
    const [dx, dz] = hexWorld(drumCell.col, drumCell.row);
    const [bx, bz] = hexWorld(bellCell.col, bellCell.row);
    const [gx2, gz2] = hexWorld(gardenCell.col, gardenCell.row);
    const [fx, fz] = hexWorld(farmCell.col, farmCell.row);
    const [barx, barz] = hexWorld(barracksCell.col, barracksCell.row);
    const [tavx, tavz] = hexWorld(tavernCell.col, tavernCell.row);
    return { keys, pagoda: { x: px, z: pz }, drum: { x: dx, z: dz }, bell: { x: bx, z: bz }, garden: { x: gx2, z: gz2 }, farm: { x: fx, z: fz }, barracks: { x: barx, z: barz }, tavern: { x: tavx, z: tavz } };
  }, [preview.width, preview.height, cityWallCol, grand]);

  const { houses, trees, paths, villagers, flowers, avenue, grass, dirt, puddles } = useMemo(() => {
    const houses: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const trees: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const paths: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const villagers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const flowers: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const avenue: Array<{ x: number; z: number; key: string }> = [];
    const grass: Array<{ x: number; z: number; s: number; r: number; c: string }> = [];
    const dirt: Array<{ x: number; z: number; seed: number; key: string }> = [];
    const puddles: Array<{ x: number; z: number; key: string }> = [];
    const GRASSC = ['#4a7a3a', '#3f6e34', '#56833f', '#5f8a44'];
    const sow = (cx: number, cz: number, seed: number) => {
      const n = 3 + (seed % 3);
      for (let i = 0; i < n && grass.length < 460; i++) {
        const a = seed * 0.7 + i * 2.4;
        grass.push({
          x: cx + Math.cos(a) * 0.42, z: cz + Math.sin(a * 1.3) * 0.42,
          s: 0.7 + ((seed >> i) % 3) * 0.18, r: a, c: GRASSC[(seed + i) % 4],
        });
      }
    };
    const marketKeys = new Set(market.map((m) => m.key));
    // Crowds scale with population — a thronging capital vs a quiet hamlet.
    const villagerCap = Math.round(6 + stats.fPop * 36);
    const W = preview.width, H = preview.height;
    // Main avenue straight in from the south gate — paved, kept clear of houses.
    const gateCol = Math.floor(W / 2);
    const avenueKeys = new Set<string>();
    for (let r = 1; r <= H - 2; r++) avenueKeys.add(`${gateCol},${r}`);
    // A planned street grid: streets run along every 3rd col/row, leaving 2×2
    // block interiors for houses, gardens and the player's foundations.
    for (const tile of preview.tiles) {
      const { col, row } = tile.coord;
      // Strictly inside the perimeter wall ring.
      if (col < 1 || col >= W - 1 || row < 1 || row >= H - 1) continue;
      if (NO_BUILD_TERRAIN.has(tile.terrain as string)) continue;
      const key = `${col},${row}`;
      if (occupied.has(key)) continue; // slots / buildings / foundations
      if (landmarks.keys.has(key)) continue; // pagoda / drum-tower footprints
      const [x, z] = hexWorld(col, row);
      if (avenueKeys.has(key)) { avenue.push({ x, z, key }); continue; } // main road
      if (marketKeys.has(key)) continue;
      const seed = dwellingHash(col, row);
      // Grid streets (paved); foundations live at col%3===2 so never clash.
      if (col % 3 === 0 || row % 3 === 0) {
        if (paths.length < 240) paths.push({ x, z, seed, key });
        continue;
      }
      // Block interior — mostly housing, with garden / townsfolk / flower beds.
      const bucket = seed % 100;
      if (bucket < 60 && houses.length < 64) houses.push({ x, z, seed, key });          // houses
      else if (bucket < 78 && trees.length < 30) { trees.push({ x, z, seed, key }); sow(x, z, seed); } // gardens
      else if (bucket < 90 && villagers.length < villagerCap) { villagers.push({ x, z, seed, key }); sow(x, z, seed); } // townsfolk
      else if (flowers.length < 20) flowers.push({ x, z, seed, key });                  // flower beds
      else {                                                                             // open ground
        sow(x, z, seed);
        const sub = (seed >> 9) % 12;
        if (sub < 2 && dirt.length < 20) dirt.push({ x, z, seed, key });                 // bare earth
        else if (sub === 2 && puddles.length < 10) puddles.push({ x, z, key });          // puddle
      }
    }
    return { houses, trees, paths, villagers, flowers, avenue, grass, dirt, puddles };
  }, [preview, occupied, market, landmarks, stats.fPop]);

  const hall = useMemo(() => {
    const col = Math.max(1, Math.round(cityWallCol * 0.42));
    const row = Math.round(preview.height / 2);
    const [x, z] = hexWorld(col, row);
    return { x, z };
  }, [preview.height, cityWallCol]);

  // A few lanterns flanking the hall + just inside the gate.
  const lanterns = useMemo(() => {
    const W = preview.width, H = preview.height;
    const spots: Array<[number, number]> = [
      [Math.round(cityWallCol * 0.42) - 2, Math.round(H / 2)],
      [Math.round(cityWallCol * 0.42) + 2, Math.round(H / 2)],
      [Math.floor(W / 2), H - 3], // inside the south gate
    ];
    return spots.map(([c, r]) => {
      const cc = Math.max(1, Math.min(W - 2, c));
      const rr = Math.max(1, Math.min(H - 2, r));
      const [x, z] = hexWorld(cc, rr);
      return { x, z, key: `${cc},${rr}` };
    });
  }, [preview.width, preview.height, cityWallCol]);

  // Hero props clustered around the civic centre + market.
  const props = useMemo(() => {
    const braziers = [
      { x: hall.x - 1.8, z: hall.z + 1.8 },
      { x: hall.x + 1.8, z: hall.z + 1.8 },
    ];
    const m0 = market[0];
    const well = m0 ? { x: m0.x - 1.3, z: m0.z + 1.0 } : { x: hall.x + 2.6, z: hall.z + 1.7 };
    const cart = m0 ? { x: m0.x + 1.5, z: m0.z + 0.5, seed: m0.seed >> 1 } : null;
    // Shoppers crowd the stalls in proportion to population.
    const folkCount = Math.max(2, Math.round(2 + stats.fPop * 8));
    const folk = market.flatMap((m, i) => [
      { x: m.x + (i % 2 ? 0.72 : -0.72), z: m.z - 0.72, seed: (m.seed >> 2) + i * 7 },
      { x: m.x - 0.5, z: m.z + 0.7, seed: (m.seed >> 4) + i * 13 },
    ]).slice(0, folkCount);
    // 牌坊 archway a few tiles in from the gate, straddling the avenue.
    const avSorted = [...avenue].sort((a, b) => b.z - a.z);
    const paifang = avSorted[2] ?? avSorted[avSorted.length - 1] ?? null;
    // Lanterns lining the main avenue — a loyal, contented city decks every
    // tile in lanterns (張燈結綵); a discontented one barely lights the way.
    const avenueLanterns: Array<{ x: number; z: number }> = [];
    const lanternStride = stats.fLoyalty > 0.66 ? 1 : stats.fLoyalty > 0.33 ? 2 : 3;
    avenue.forEach((a, i) => {
      if (i % lanternStride === 0) {
        avenueLanterns.push({ x: a.x - 0.92, z: a.z });
        avenueLanterns.push({ x: a.x + 0.92, z: a.z });
      }
    });
    // Pedestrians strolling the main avenue (more when populous) + an ox-cart.
    const avZ = [...avenue].sort((a, b) => a.z - b.z);
    const walkerN = Math.round(3 + stats.fPop * 8);
    const walkers: Array<{ ax: number; az: number; bx: number; bz: number; seed: number }> = [];
    for (let i = 0; i + 3 < avZ.length && walkers.length < walkerN; i += 2) {
      const a = avZ[i], b = avZ[i + 3];
      const side = i % 4 < 2 ? -0.5 : 0.5;
      walkers.push({ ax: a.x + side, az: a.z, bx: b.x + side, bz: b.z, seed: i * 13 + 5 });
    }
    const oxcart = avZ.length > 3
      ? { ax: avZ[1].x + 0.1, az: avZ[1].z, bx: avZ[avZ.length - 2].x + 0.1, bz: avZ[avZ.length - 2].z, seed: 1.7 }
      : null;
    return { braziers, well, cart, folk, paifang, avenueLanterns, walkers, oxcart };
  }, [hall, market, avenue, stats.fPop, stats.fLoyalty]);

  return (
    <>
      {/* Main avenue first so other paving/props sit on top of it */}
      {avenue.map((a) => (
        <mesh key={`av-${a.key}`} position={[a.x, 0.045, a.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <boxGeometry args={[1.46, 1.46, 0.07]} />
          <meshStandardMaterial color="#a89c84" roughness={0.97} />
        </mesh>
      ))}
      {/* Bare-earth patches + puddles break up the green ground */}
      {dirt.map((d) => (
        <mesh key={`dt-${d.key}`} position={[d.x, 0.035, d.z]} rotation={[-Math.PI / 2, (d.seed % 4) * 0.4, 0]} receiveShadow>
          <boxGeometry args={[1.0 + (d.seed % 3) * 0.12, 0.9 + (d.seed % 2) * 0.2, 0.05]} />
          <meshStandardMaterial color="#6a5740" roughness={0.98} />
        </mesh>
      ))}
      {puddles.map((p) => (
        <mesh key={`pd-${p.key}`} position={[p.x, 0.05, p.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.34, 16]} />
          <meshStandardMaterial color="#3a4a52" roughness={0.18} metalness={0.55} />
        </mesh>
      ))}
      <GrassTufts3D tufts={grass} />
      {paths.map((p) => <StonePath3D key={`pa-${p.key}`} x={p.x} z={p.z} seed={p.seed} />)}
      {flowers.map((f) => <FlowerBed3D key={`fb-${f.key}`} x={f.x} z={f.z} seed={f.seed} />)}
      {houses.map((h) => <Dwelling key={`dw-${h.key}`} x={h.x} z={h.z} seed={h.seed} />)}
      {trees.map((tr) => <GardenTree3D key={`tr-${tr.key}`} x={tr.x} z={tr.z} seed={tr.seed} />)}
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '市集 · 商坊', body: '城中商市,理一城之財貨。可於此勸課商賈。', color: '#d4a84a', commands: ['develop-commerce', 'major-commerce'] }); }}>
        {market.map((m) => <MarketStall3D key={`mk-${m.key}`} x={m.x} z={m.z} seed={m.seed} />)}
      </group>
      {/* 焦土 — a razed city empties of life: no crowds, no festive lanterns. */}
      {!ruined && villagers.map((v) => <Villager3D key={`vl-${v.key}`} x={v.x} z={v.z} seed={v.seed} />)}
      {!ruined && props.folk.map((v, i) => <Villager3D key={`mf-${i}`} x={v.x} z={v.z} seed={v.seed} />)}
      {!ruined && props.walkers.map((wk, i) => <Walker3D key={`wk-${i}`} ax={wk.ax} az={wk.az} bx={wk.bx} bz={wk.bz} seed={wk.seed} />)}
      {!ruined && props.oxcart && <MovingCart3D ax={props.oxcart.ax} az={props.oxcart.az} bx={props.oxcart.bx} bz={props.oxcart.bz} seed={props.oxcart.seed} />}
      {/* Chimney smoke from a scattering of homes (peaceful) — black pillars of
          ruin smoke if the city has been razed. */}
      {!ruined && houses.filter((_, i) => i % 8 === 0).slice(0, 5).map((h) => (
        <Smoke3D key={`sm-${h.key}`} x={h.x} z={h.z} base={1.15} />
      ))}
      {ruined && <RuinsOverlay houses={houses} />}
      {props.cart && !ruined && <Cart3D x={props.cart.x} z={props.cart.z} seed={props.cart.seed} />}
      <Well3D x={props.well.x} z={props.well.z} />
      {props.braziers.map((b, i) => <Brazier3D key={`bz-${i}`} x={b.x} z={b.z} />)}
      {!ruined && lanterns.map((l) => <Lantern3D key={`ln-${l.key}`} x={l.x} z={l.z} />)}
      {!ruined && props.avenueLanterns.map((l, i) => <Lantern3D key={`al-${i}`} x={l.x} z={l.z} />)}
      {props.paifang && <Paifang3D x={props.paifang.x} z={props.paifang.z} />}
      {/* 名產 — a signature-good prop by the market wards (salt heap, horse pen,
          loom…), a visual nod to the city's specialty trade edge. */}
      {specialty && market[0] && <SpecialtyProp3D specialty={specialty} x={market[0].x + 1.7} z={market[0].z + 1.6} />}
      {/* 駐軍旌旗 — a rank of banners by the drill ground, taller for a big garrison. */}
      {!ruined && <GarrisonBanners3D x={landmarks.barracks.x} z={landmarks.barracks.z} troops={troops} color={bannerColor} />}
      {/* 施政中 — work-in-progress at the landmark whose order is queued. */}
      {activity.farm && <CommandActivity3D x={landmarks.farm.x} z={landmarks.farm.z + 1.6} color="#bcd07a" label="勸課農桑" />}
      {activity.market && market[0] && <CommandActivity3D x={market[0].x} z={market[0].z + 1.5} color="#d4a84a" label="興商理財" />}
      {activity.barracks && <CommandActivity3D x={landmarks.barracks.x} z={landmarks.barracks.z + 1.6} color="#c08858" label="操演徵募" soldier />}
      {activity.hall && <CommandActivity3D x={hall.x} z={hall.z + 2.6} color="#f0d98a" label="撫民理政" />}
      {activity.tavern && <CommandActivity3D x={landmarks.tavern.x} z={landmarks.tavern.z + 1.3} color="#d98a6a" label="探訪賢才" />}
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '寶塔 · 瞭望', body: landmarkInfo.pagodaBody, color: '#e0c060' }); }}>
        <Pagoda3D x={landmarks.pagoda.x} z={landmarks.pagoda.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '鼓樓 · 報時', body: landmarkInfo.timeBody, color: '#e0c060' }); }}>
        <DrumTower3D x={landmarks.drum.x} z={landmarks.drum.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '鐘樓 · 報時', body: landmarkInfo.timeBody, color: '#e0c060' }); }}>
        <BellTower3D x={landmarks.bell.x} z={landmarks.bell.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '園林 · 雅集', body: landmarkInfo.gardenBody, color: '#9ac06a' }); }}>
        <Garden3D x={landmarks.garden.x} z={landmarks.garden.z} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '屯田 · 田畝', body: '军民屯垦之田,城邑粮秣所出。可於此勸課農桑、興修水利。', color: '#bcd07a', commands: ['develop-agriculture', 'major-agriculture', 'flood-control'] }); }}>
        <Farmland3D x={landmarks.farm.x} z={landmarks.farm.z} lush={weatherKind === 'drought' ? stats.fAgri * 0.32 : stats.fAgri} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '府衙 · 治所', body: '一城之治所,太守理政、安民撫眾、興学教化之地。', color: '#f0d98a', commands: ['improve-loyalty', 'relief', 'anti-corruption', 'encourage-migration', 'promote-learning'] }); }}>
        <GovernmentHall3D x={hall.x} z={hall.z} bannerColor={bannerColor} isCapital={isCapital} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '兵營 · 校場', body: '操演士卒、招募新軍、屯田練兵、鎮守疆場之所。', color: '#c08858', commands: ['recruit-troops', 'military-farming', 'drill-troops', 'garrison'] }); }}>
        <Barracks3D x={landmarks.barracks.x} z={landmarks.barracks.z} bannerColor={bannerColor} />
      </group>
      <group onClick={(e) => { e.stopPropagation(); inspect({ title: '酒樓', body: '杯酒之間,常聞在野賢才之名。可於此遣人探訪。', color: '#d98a6a', commands: ['search'] }); }}>
        <Tavern3D x={landmarks.tavern.x} z={landmarks.tavern.z} />
      </group>
    </>
  );
}

/* ─── 城外腹地 (Hinterland) ────────────────────────────────────────────
   The walled city sits at the centre. Beyond its moat we sample the REAL
   strategic-map geography in every direction — so the river that runs east
   toward a neighbour appears to the east, the mountains north appear north,
   and every approach shows the ground that actually lies between this city
   and that neighbour. The 8 defence slots ride the outer ring at their true
   compass bearings (directional defence), and a signed road runs out toward
   each adjacent city. */

interface Neighbor {
  id: EntityId;
  nameZh: string;
  nameEn: string;
  x: number;
  y: number;
  color: string;
  rel: 'self' | 'other' | 'neutral';
}

/** A strategic 施設 near this city, projected into the hinterland by its true
 *  bearing/distance so the same building shows on the world, city and battle. */
interface HinterlandFacility {
  id: EntityId;
  kind: FacilityKind;
  /** Geo-pixel offset from the city centre (east = +dx, south = +dy). */
  dx: number;
  dy: number;
  dist: number;
  owned: boolean;
}

/** An army marching near this city — shown on the hinterland at its true
 *  bearing so you watch columns close in from the direction they're coming. */
interface HinterlandArmy {
  id: EntityId;
  dx: number;
  dy: number;
  dist: number;
  color: string;
  troops: number;
  nameZh: string;
  own: boolean;
  /** Bearing down on THIS city. */
  incoming: boolean;
}

const HINTERLAND_BELT_DEPTH = 21;    // world units of countryside beyond the moat
const HINTERLAND_STRAT_REACH = 70;   // fallback reach (strategic units) for directions with no neighbour
const HINTERLAND_TILE_SP = IS_MOBILE ? 1.7 : 1.2; // belt sampling spacing — denser on desktop resolves thin rivers
const MOAT_PAD = 4;                  // moat half-extends this far past the grid
const HINTERLAND_REACH_MIN = 32;     // never sample shorter than this…
const HINTERLAND_REACH_MAX = 150;    // …nor farther than this (strategic units)

// Real-ground → colour / relief. Water sits flat & low; hills and mountains
// rise so the countryside reads in 3D.
const GROUND_COLOR: Record<string, string> = {
  sea:       '#1d4a68',
  lake:      '#27607f',
  river:     '#2c5882',
  riverbank: '#8a8a5e',
  mountain:  '#6a5b4c',
  hill:      '#7c7250',
  plain:     '#5f7a42',
};
const GROUND_HEIGHT: Record<string, number> = {
  sea: 0.1, lake: 0.1, river: 0.1, riverbank: 0.22,
  mountain: 1.8, hill: 0.75, plain: 0.28,
};
const WATER_GROUND = new Set(['sea', 'lake', 'river']);

// Compass slot directions in world space (x = east, +z = south, so N = −z).
// Index order matches computeSlotPositions / SLOT_POSITIONS: N,NE,E,SE,S,SW,W,NW.
const S2 = Math.SQRT1_2;
const COMPASS_DIR: Array<[number, number]> = [
  [0, -1], [S2, -S2], [1, 0], [S2, S2],
  [0, 1], [-S2, S2], [-1, 0], [-S2, -S2],
];
const COMPASS_ZH = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
const COMPASS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Which compass slot (0-7) guards a given world bearing (dx east, dz south). */
function octantForWorldDir(dx: number, dz: number): number {
  // 0° = north (−z), increasing clockwise through east.
  let deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg / 45) % 8;
}

/** A clickable octagon pad for a directional defence slot, with its compass
 *  label. Built defences render on top via the shared DefenseStructure. */
function HinterlandSlot3D({
  x, z, compass, occupied, selected, onClick, showLabel,
}: {
  x: number; z: number; compass: string; occupied: boolean;
  selected: boolean; onClick: () => void; showLabel: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.07, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[0.92, 0.92, 0.14, 8]} />
        <meshStandardMaterial
          color={occupied ? '#3a2d1a' : '#d4a84a'}
          emissive={selected ? '#f0e0b0' : occupied ? '#000000' : '#6a4a18'}
          emissiveIntensity={selected ? 0.6 : 0.25}
          transparent
          opacity={occupied ? 0.55 : 0.9}
          roughness={0.6}
        />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.05, 1.3, 24]} />
          <meshBasicMaterial color="#f0e0b0" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      {showLabel && (
        <Html center position={[0, 1.0, 0]} distanceFactor={26} occlude={false}>
          <div style={{
            color: occupied ? '#c0a878' : '#f0d98a',
            fontFamily: 'var(--tkm-font-body)', fontSize: '13px',
            letterSpacing: '1px', whiteSpace: 'nowrap',
            textShadow: '0 1px 3px #000', pointerEvents: 'none',
          }}>
            {compass}
          </div>
        </Html>
      )}
    </group>
  );
}

type HinterlandSite = { id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean };

/** Pulsing ground ring at a recent battle site — same语言 as the world map. */
function ScarPulse3D({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime % 1.7) / 1.7;
    const s = 0.3 + t * 1.4;
    if (ref.current) ref.current.scale.set(s, s, s);
    if (mat.current) mat.current.opacity = (1 - t) * 0.5;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z]}>
      <ringGeometry args={[0.7, 0.9, 28]} />
      <meshBasicMaterial ref={mat} color="#d4a84a" transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Hinterland3D({
  preview, city, neighbors, facilities, armies, stockades, ports, scars, slots, selectedSlot, onSlotClick, showOverlays,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  city: { coords: { x: number; y: number } };
  neighbors: Neighbor[];
  facilities: HinterlandFacility[];
  armies: HinterlandArmy[];
  stockades: HinterlandSite[];
  ports: HinterlandSite[];
  scars: Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  selectedSlot: number | null;
  onSlotClick: (slot: number) => void;
  showOverlays: boolean;
}) {
  const lang = useLanguage();
  const W = preview.width, H = preview.height;
  const cx = (W * HEX_COL_STEP) / 2;
  const cz = (H * HEX_ROW_STEP) / 2;
  const innerX = (W * HEX_COL_STEP) / 2 + MOAT_PAD;
  const innerZ = (H * HEX_ROW_STEP) / 2 + MOAT_PAD;
  const outerX = innerX + HINTERLAND_BELT_DEPTH;
  const outerZ = innerZ + HINTERLAND_BELT_DEPTH;

  // True bearing + strategic distance to each neighbour (same x=east / +y=south
  // frame the belt samples in), so each approach can reach its neighbour's real
  // distance rather than a flat fixed reach.
  const nbVecs = useMemo(
    () => neighbors.map((n) => ({
      bearing: Math.atan2(n.y - city.coords.y, n.x - city.coords.x),
      dist: Math.hypot(n.x - city.coords.x, n.y - city.coords.y),
    })),
    [neighbors, city.coords.x, city.coords.y],
  );

  // Sample a belt of real ground around the city. A tile's depth across the
  // belt maps to how far out we sample the strategic map; the OUTER reach in a
  // given direction is blended from the actual neighbours that lie that way —
  // so the country shown on each approach is the real ground between this city
  // and the neighbour it leads to, all the way to its doorstep.
  const tiles = useMemo(() => {
    const out: Array<{ x: number; z: number; color: string; h: number; water: boolean }> = [];
    const ellR = (ang: number, rx: number, rz: number) =>
      1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
    const reachAt = (ang: number) => {
      if (nbVecs.length === 0) return HINTERLAND_STRAT_REACH;
      let ws = 0, ds = 0;
      for (const n of nbVecs) {
        let d = Math.abs(ang - n.bearing);
        if (d > Math.PI) d = 2 * Math.PI - d;
        // Weight peaks sharply toward a neighbour's bearing, with a small floor
        // so in-between directions still blend rather than snap.
        const w = Math.pow(Math.max(0, Math.cos(d)), 3) + 0.08;
        ws += w; ds += w * n.dist;
      }
      return Math.max(HINTERLAND_REACH_MIN, Math.min(HINTERLAND_REACH_MAX, ds / ws));
    };
    for (let wx = cx - outerX; wx <= cx + outerX; wx += HINTERLAND_TILE_SP) {
      for (let wz = cz - outerZ; wz <= cz + outerZ; wz += HINTERLAND_TILE_SP) {
        const dx = wx - cx, dz = wz - cz;
        const r = Math.hypot(dx, dz);
        if (r < 0.001) continue;
        const ang = Math.atan2(dz, dx);
        const inR = ellR(ang, innerX, innerZ);
        const outR = ellR(ang, outerX, outerZ);
        if (r < inR || r > outR) continue;
        const t = (r - inR) / Math.max(0.001, outR - inR);
        const strat = 6 + t * (reachAt(ang) - 6);
        const ux = dx / r, uz = dz / r;
        const g = battleGroundAt(city.coords.x + ux * strat, city.coords.y + uz * strat);
        out.push({
          x: wx, z: wz,
          color: GROUND_COLOR[g] ?? GROUND_COLOR.plain,
          h: GROUND_HEIGHT[g] ?? 0.28,
          water: WATER_GROUND.has(g),
        });
      }
    }
    return out;
  }, [cx, cz, innerX, innerZ, outerX, outerZ, city.coords.x, city.coords.y, nbVecs]);

  const slotMap = new Map((slots ?? []).map((s) => [s.slot, s]));

  return (
    <group>
      {/* Countryside belt — instanced hex prisms, coloured & raised by real ground.
          No castShadow: shadow-mapping the whole belt is costly and barely visible. */}
      <Instances limit={Math.max(1, tiles.length)} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 1, 6]} />
        <meshStandardMaterial roughness={0.92} metalness={0.02} />
        {tiles.map((t, i) => (
          <Instance
            key={i}
            position={[t.x, t.water ? 0.05 : t.h / 2, t.z]}
            scale={[1, Math.max(0.12, t.h), 1]}
            color={t.color}
          />
        ))}
      </Instances>

      {/* Roads + signposts out to each neighbouring city, in its true direction */}
      {neighbors.map((n) => {
        const dx = n.x - city.coords.x, dz = n.y - city.coords.y;
        const len = Math.hypot(dx, dz) || 1;
        const ux = dx / len, uz = dz / len;
        const ang = Math.atan2(dz, dx);
        const inR = 1 / Math.hypot(Math.cos(ang) / innerX, Math.sin(ang) / innerZ);
        const outR = 1 / Math.hypot(Math.cos(ang) / outerX, Math.sin(ang) / outerZ);
        const mid = (inR + outR) / 2;
        const roadLen = outR - inR + 1.5;
        const postX = cx + ux * (outR + 0.4);
        const postZ = cz + uz * (outR + 0.4);
        return (
          <group key={n.id}>
            {/* Packed-earth road strip aligned along the bearing */}
            <mesh
              position={[cx + ux * mid, 0.16, cz + uz * mid]}
              rotation={[0, Math.atan2(-uz, ux), 0]}
              receiveShadow
            >
              <boxGeometry args={[roadLen, 0.08, 1.3]} />
              <meshStandardMaterial color="#9a8358" roughness={0.95} />
            </mesh>
            {/* Signpost */}
            <mesh position={[postX, 0.7, postZ]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 1.4, 6]} />
              <meshStandardMaterial color="#5a4326" roughness={0.9} />
            </mesh>
            <Html center position={[postX, 1.7, postZ]} distanceFactor={30} occlude={false}>
              <div style={{
                background: 'rgba(20,14,8,0.82)',
                border: `1px solid ${n.color}`,
                borderRadius: 3,
                padding: '2px 7px',
                color: n.rel === 'self' ? '#7ed68a' : n.rel === 'other' ? '#e0a0a0' : '#c0a878',
                fontFamily: 'var(--tkm-font-body)', fontSize: '12px',
                letterSpacing: '1px', whiteSpace: 'nowrap',
                textShadow: '0 1px 2px #000', pointerEvents: 'none',
              }}>
                往 {n.nameZh}
              </div>
            </Html>
          </group>
        );
      })}

      {/* 8 directional defence slots on the outer ring */}
      {COMPASS_DIR.map(([dxC, dzC], i) => {
        const px = cx + dxC * (innerX - 0.5);
        const pz = cz + dzC * (innerZ - 0.5);
        const s = slotMap.get(i);
        const occupied = !!s?.buildingId;
        return (
          <group key={`hslot-${i}`}>
            <HinterlandSlot3D
              x={px} z={pz}
              compass={COMPASS_ZH[i]}
              occupied={occupied}
              selected={selectedSlot === i}
              onClick={() => onSlotClick(i)}
              showLabel={showOverlays}
            />
            {occupied && s && (() => {
              const maxHp = 100 * s.level + 100;
              return (
                <group position={[px, 0, pz]}>
                  <DefenseStructure
                    coord={{ col: 0, row: 0 }}
                    buildingId={s.buildingId!}
                    level={s.level}
                    hp={maxHp}
                    maxHp={maxHp}
                  />
                </group>
              );
            })()}
          </group>
        );
      })}

      {/* 施設 — strategic facilities (箭樓/投石臺/陣/防壁) near this city, placed
          on the hinterland by their true bearing so the SAME building shows on
          the world map, here, and on the battlefield. */}
      {facilities.map((f) => {
        const ang = Math.atan2(f.dy, f.dx);
        const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
        const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
        const tt = Math.min(1, f.dist / HINTERLAND_STRAT_REACH);
        const r = inR + tt * (outR - inR);
        const fpx = cx + Math.cos(ang) * r, fpz = cz + Math.sin(ang) * r;
        const def = FACILITY_DEFS[f.kind];
        return (
          <group key={f.id} position={[fpx, 0, fpz]}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.9, 0.7]} />
              <meshStandardMaterial color="#5a4530" roughness={0.92} />
            </mesh>
            <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[0.42, 0.7, f.kind === 'catapult' ? 3 : 4]} />
              <meshStandardMaterial color={def.color} emissive={def.color} emissiveIntensity={0.3} roughness={0.6} />
            </mesh>
            {showOverlays && (
              <Html center position={[0, 1.95, 0]} distanceFactor={28} occlude={false}>
                <div style={{
                  color: f.owned ? '#f0d98a' : '#e0a0a0',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '12px',
                  letterSpacing: '1px', whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px #000', pointerEvents: 'none',
                }}>{pickName(def.name, lang)}</div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Armies near the city — projected onto the hinterland by true bearing, so
          you watch columns (enemy in red) close in from the direction they march. */}
      {armies.map((a) => {
        const ang = Math.atan2(a.dy, a.dx);
        const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
        const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
        const tt = Math.min(1, Math.max(0.08, a.dist / HINTERLAND_STRAT_REACH));
        const r = inR + tt * (outR - inR);
        const apx = cx + Math.cos(ang) * r, apz = cz + Math.sin(ang) * r;
        const threat = a.incoming && !a.own;
        return (
          <group key={a.id} position={[apx, 0, apz]}>
            {/* Banner pole + flag */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 1.4, 5]} />
              <meshStandardMaterial color="#1a1410" />
            </mesh>
            <mesh position={[0.32, 1.1, 0]} castShadow>
              <planeGeometry args={[0.55, 0.36]} />
              <meshStandardMaterial color={a.color} side={THREE.DoubleSide} emissive={threat ? a.color : '#000'} emissiveIntensity={threat ? 0.4 : 0} />
            </mesh>
            {/* A couple of troop blocks at the base */}
            {[-0.3, 0, 0.3].map((dx, i) => (
              <mesh key={i} position={[dx, 0.18, 0.25]} castShadow>
                <boxGeometry args={[0.18, 0.36, 0.18]} />
                <meshStandardMaterial color={a.own ? '#6a7a8a' : '#8a5a4a'} roughness={0.9} />
              </mesh>
            ))}
            {showOverlays && (
              <Html center position={[0, 1.95, 0]} distanceFactor={28} occlude={false}>
                <div style={{
                  color: a.own ? '#9ec9f0' : '#f0a0a0',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
                  letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px #000', pointerEvents: 'none',
                }}>
                  {threat ? '⚔ ' : ''}{a.nameZh} {a.troops.toLocaleString()}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Shared bearing/depth projection for the point sites below. */}
      {(() => {
        const project = (dx: number, dy: number, dist: number): [number, number] => {
          const ang = Math.atan2(dy, dx);
          const ellR = (rx: number, rz: number) => 1 / Math.hypot(Math.cos(ang) / rx, Math.sin(ang) / rz);
          const inR = ellR(innerX, innerZ), outR = ellR(outerX, outerZ);
          const tt = Math.min(1, Math.max(0.08, dist / HINTERLAND_STRAT_REACH));
          const r = inR + tt * (outR - inR);
          return [cx + Math.cos(ang) * r, cz + Math.sin(ang) * r];
        };
        return (
          <>
            {/* 塢壘/關砦 — wooden fort markers at their true bearing. */}
            {stockades.map((s) => {
              const [sx, sz] = project(s.dx, s.dy, s.dist);
              return (
                <group key={s.id} position={[sx, 0, sz]}>
                  <mesh position={[0, 0.35, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.7, 0.8]} />
                    <meshStandardMaterial color="#6b4f2a" roughness={0.95} />
                  </mesh>
                  <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.34, 0.5, 4]} />
                    <meshStandardMaterial color="#3a3a4a" roughness={0.85} />
                  </mesh>
                  {showOverlays && (
                    <Html center position={[0, 1.7, 0]} distanceFactor={28} occlude={false}>
                      <div style={{
                        color: s.owned ? '#f0d98a' : '#e0a0a0',
                        fontFamily: 'var(--tkm-font-body)', fontSize: '11px', whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px #000', pointerEvents: 'none',
                      }}>{s.nameZh}</div>
                    </Html>
                  )}
                </group>
              );
            })}
            {/* 港口 — a wharf plank + anchor chip at the waterline bearing. */}
            {ports.map((p) => {
              const [sx, sz] = project(p.dx, p.dy, p.dist);
              return (
                <group key={p.id} position={[sx, 0, sz]}>
                  <mesh position={[0, 0.12, 0]} castShadow>
                    <boxGeometry args={[1.3, 0.18, 0.5]} />
                    <meshStandardMaterial color="#7a6242" roughness={0.9} />
                  </mesh>
                  <mesh position={[0.45, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 0.8, 5]} />
                    <meshStandardMaterial color="#4a3a26" />
                  </mesh>
                  {showOverlays && (
                    <Html center position={[0, 1.3, 0]} distanceFactor={28} occlude={false}>
                      <div style={{
                        color: p.owned ? '#88b7e8' : '#c0a878',
                        fontFamily: 'var(--tkm-font-body)', fontSize: '11px', whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px #000', pointerEvents: 'none',
                      }}>⚓ {p.nameZh}</div>
                    </Html>
                  )}
                </group>
              );
            })}
            {/* 戰痕 — crossed sabres; fresh sites pulse (同 world map). */}
            {scars.map((m, i) => {
              const [sx, sz] = project(m.dx, m.dy, m.dist);
              return (
                <group key={`scar-${i}`}>
                  <group position={[sx, 0.08, sz]} rotation={[-Math.PI / 2, 0, 0]}>
                    {[Math.PI / 4, -Math.PI / 4].map((rot, k) => (
                      <mesh key={k} rotation={[0, 0, rot]}>
                        <boxGeometry args={[0.9, 0.09, 0.02]} />
                        <meshBasicMaterial color="#9aa6b4" transparent opacity={0.85} />
                      </mesh>
                    ))}
                  </group>
                  {m.fresh && <ScarPulse3D x={sx} z={sz} />}
                </group>
              );
            })}
          </>
        );
      })()}
    </group>
  );
}

function CityScene({
  preview, slots, buildings, construction, plots, cityWallCol, bannerColor, light, season, stats, grand, onInspect,
  selectedPlot, onPlotClick, hovered, onHover, onClick, showOverlays,
  city, neighbors, facilities, armies, stockades, ports, scars, selectedSlot, onSlotClick, landmarkInfo,
  weatherKind, isCapital, specialty, activity,
}: {
  preview: ReturnType<typeof previewBattlefield>;
  slots: ReturnType<typeof useGameStore.getState>['cities'][string]['buildSlots'];
  buildings: Array<{ coord: { col: number; row: number }; buildingId: BuildingId; level: number }>;
  construction: Array<{ coord: { col: number; row: number }; nameZh: string }>;
  plots: Array<{ col: number; row: number }>;
  cityWallCol: number;
  light: typeof SEASON_LIGHT[SeasonKey];
  season: SeasonKey;
  stats: CityStats;
  grand: boolean;
  onInspect: (info: InspectInfo) => void;
  bannerColor: string;
  selectedPlot: number | null;
  onPlotClick: (plotIndex: number) => void;
  hovered: { col: number; row: number } | null;
  onHover: (c: { col: number; row: number } | null) => void;
  onClick: (c: { col: number; row: number }) => void;
  showOverlays: boolean;
  city: City;
  neighbors: Neighbor[];
  facilities: HinterlandFacility[];
  armies: HinterlandArmy[];
  stockades: HinterlandSite[];
  ports: HinterlandSite[];
  scars: Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
  selectedSlot: number | null;
  onSlotClick: (slot: number) => void;
  landmarkInfo: LandmarkInfo;
  weatherKind: WeatherKind;
  isCapital: boolean;
  specialty: SpecialtyDef | null;
  activity: CityActivity;
}) {
  // Defence slots now ride the outer hinterland ring (directional defence),
  // not the city-wall hexes — so they no longer occupy any grid hex here.

  // Hexes that already hold something — a finished building OR a site under
  // construction. Empty foundations (not in this set) stay tappable to build.
  const buildingHexes = new Set([
    ...buildings.map((b) => `${b.coord.col},${b.coord.row}`),
    ...construction.map((c) => `${c.coord.col},${c.coord.row}`),
  ]);
  const occupiedHexes = new Set<string>();
  for (const b of buildings) occupiedHexes.add(`${b.coord.col},${b.coord.row}`);
  for (const p of plots) occupiedHexes.add(`${p.col},${p.row}`); // foundations

  // Season-driven lighting mood.
  return (
    <SeasonCtx.Provider value={season}>
      <SeasonalDrift season={season} />
      <WeatherFX kind={weatherKind} width={preview.width} height={preview.height} />
     <InspectCtx.Provider value={onInspect}>
      <ambientLight intensity={light.ambient * 0.7} color={light.ambientColor} />
      {/* Sky/ground hemisphere fill for richer ambient colour grading */}
      <hemisphereLight args={[light.ambientColor, '#6a5a3e', 0.45]} />
      <directionalLight
        position={light.sunPos} intensity={light.sunI} color={light.sun}
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.25} color={light.sun} />
      {/* Fog far-plane scales with the whole region (city + hinterland) so the
          countryside stays visible when the camera pulls back; near keeps the
          close-up atmosphere. */}
      <fog attach="fog" args={[light.fog, 40, Math.max(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP) * 5]} />

      {/* Warm lantern glow — stronger in the dim seasons, so winter reads as a
          lantern-lit dusk and summer is barely tinted. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const cx = (W * HEX_COL_STEP) / 2, cz = (H * HEX_ROW_STEP) / 2;
        const [gx, gz] = hexWorld(Math.floor(W / 2), H - 1);
        const I = 0.3 + light.nightGlow * 1.7;
        return (
          <>
            <pointLight position={[cx, 3.2, cz]} intensity={I} color="#ffb060" distance={22} decay={2} />
            <pointLight position={[gx, 2.6, gz - 1.5]} intensity={I * 0.8} color="#ffa850" distance={13} decay={2} />
            <pointLight position={[cx - 6, 2.4, cz - 4]} intensity={I * 0.7} color="#ffb878" distance={13} decay={2} />
          </>
        );
      })()}

      {/* Terrain tiles — uses shared HexTile from tactical for full fidelity */}
      {preview.tiles.map((tile) => {
        const isHovered = !!hovered && hovered.col === tile.coord.col && hovered.row === tile.coord.row;
        return (
          <group
            key={`${tile.coord.col},${tile.coord.row}`}
            onPointerOver={(e) => { e.stopPropagation(); onHover(tile.coord); }}
            onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          >
            <HexTile
              tile={tile}
              hovered={isHovered}
              highlight={undefined}
              windStrength={0.4}
              onClick={() => onClick(tile.coord)}
            />
          </group>
        );
      })}

      {/* Surrounding moat, seen beyond the walls. */}
      <Moat3D W={preview.width} H={preview.height} />

      {/* Moat life — lily pads, reed clumps, a drifting sampan */}
      {(() => {
        const W = preview.width, H = preview.height;
        const [ax, az] = hexWorld(0, 0);
        const [bx, bz] = hexWorld(W - 1, H - 1);
        const minX = Math.min(ax, bx), maxX = Math.max(ax, bx);
        const minZ = Math.min(az, bz), maxZ = Math.max(az, bz);
        const pads: Array<{ x: number; z: number; s: number }> = [];
        const N = 10;
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const s1 = i * 97 + 11, s2 = i * 53 + 29;
          pads.push({ x: minX - 1.7 - (s1 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s1 % 7) - 3) * 0.18, s: 0.7 + (s1 % 4) * 0.14 });
          pads.push({ x: maxX + 1.7 + (s2 % 8) * 0.12, z: minZ + t * (maxZ - minZ) + ((s2 % 7) - 3) * 0.18, s: 0.7 + (s2 % 4) * 0.14 });
          pads.push({ x: minX + t * (maxX - minX) + ((s2 % 7) - 3) * 0.18, z: minZ - 1.7 - (s1 % 8) * 0.12, s: 0.7 + (s1 % 3) * 0.16 });
        }
        const reeds = [
          { x: minX - 1.5, z: minZ - 1.3, seed: 2 },
          { x: maxX + 1.5, z: minZ - 1.3, seed: 5 },
          { x: minX - 1.5, z: maxZ + 1.3, seed: 8 },
        ];
        return (
          <>
            <LilyPads3D pads={pads} />
            {reeds.map((r, i) => <Reed3D key={`rd-${i}`} x={r.x} z={r.z} seed={r.seed} />)}
            <SmallBoat3D x={minX - 2.1} z={(minZ + maxZ) / 2} seed={1.2} />
          </>
        );
      })()}

      {/* City walls — full perimeter ring, towers at the corners, gate south. */}
      {(() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2), gateRow = H - 1;
        // 水門 on the east wall, opening to the moat where the wharf sits.
        const waterCol = W - 1, waterRow = Math.max(1, Math.min(H - 2, Math.round(H * 0.38)));
        const isWater = (s: { col: number; row: number }) => s.col === waterCol && s.row === waterRow;
        const corners = new Set([`0,0`, `${W - 1},0`, `0,${H - 1}`, `${W - 1},${H - 1}`]);
        const segs: Array<{ col: number; row: number }> = [];
        for (let c = 0; c < W; c++) { segs.push({ col: c, row: 0 }); segs.push({ col: c, row: H - 1 }); }
        for (let r = 1; r < H - 1; r++) { segs.push({ col: 0, row: r }); segs.push({ col: W - 1, row: r }); }
        const [gx, gz] = hexWorld(gateCol, gateRow);
        const [wx, wz] = hexWorld(waterCol, waterRow);
        return (
          <>
            {segs.filter((s) => !(s.col === gateCol && s.row === gateRow) && !corners.has(`${s.col},${s.row}`) && !isWater(s)).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallSegment3D key={`wall-${s.col}-${s.row}`} x={x} z={z} tier={city.wallTier ?? 1} />;
            })}
            {/* Banners flying from the wall-walk at intervals */}
            {segs.filter((s) => !corners.has(`${s.col},${s.row}`) && !(s.col === gateCol && s.row === gateRow) && !isWater(s) && (s.col + s.row) % 5 === 0).map((s) => {
              const [x, z] = hexWorld(s.col, s.row);
              return <WallBanner3D key={`wb-${s.col}-${s.row}`} x={x} z={z} color={bannerColor} />;
            })}
            {[...corners].map((c) => {
              const [col, row] = c.split(',').map(Number);
              const [x, z] = hexWorld(col, row);
              return <CornerTower3D key={`tower-${c}`} x={x} z={z} bannerColor={bannerColor} />;
            })}
            <group onClick={(e) => { e.stopPropagation(); onInspect({ title: '城牆 · 城門', body: '一城之屏障。可於此修築城防、大興築城、強化城壁。', color: '#9aa6b0', commands: ['build-defense', 'major-defense', 'upgrade-wall'] }); }}>
              <CityGate3D x={gx} z={gz} bannerColor={bannerColor} />
            </group>
            {/* 築城修壁中 — scaffolding + work crew when a defence order is queued. */}
            {activity.wall && <CommandActivity3D x={gx} z={gz - 1.4} color="#9aa6b0" label="築城修壁" build />}
            {/* Stone bridge crossing the moat out from the gate */}
            <StoneBridge3D x={gx} z={gz + 2.1} />
            {/* Water gate + wharf on the east wall */}
            <WaterGate3D x={wx} z={wz} bannerColor={bannerColor} />
            <Dock3D x={wx} z={wz} />
          </>
        );
      })()}

      {/* 内城/皇城 — a second, lower wall ring around the civic centre, raised
          only in great cities; gated south where the avenue enters. */}
      {grand && (() => {
        const W = preview.width, H = preview.height;
        const gateCol = Math.floor(W / 2);
        const { cells, ir0, ir1 } = innerWallCells(W, H);
        const [igx, igz] = hexWorld(gateCol, ir1);
        const avenueCross = (c: { col: number; row: number }) => c.col === gateCol && (c.row === ir0 || c.row === ir1);
        return (
          <>
            {cells.filter((c) => !avenueCross(c)).map((c) => {
              const [x, z] = hexWorld(c.col, c.row);
              return <InnerWallSeg3D key={`iw-${c.col}-${c.row}`} x={x} z={z} />;
            })}
            <InnerGate3D x={igx} z={igz} bannerColor={bannerColor} />
          </>
        );
      })()}

      {/* Cross-city canal — lesser cities (no inner wall) get a waterway with
          stone banks and bridges where the avenue/streets cross it. */}
      {!grand && (() => {
        const W = preview.width, H = preview.height;
        const cr = canalRow(H);
        const [x0] = hexWorld(1, cr);
        const [x1, cz] = hexWorld(W - 2, cr);
        const cxMid = (x0 + x1) / 2;
        const lenX = Math.abs(x1 - x0) + HEX_COL_STEP;
        const bridgeCols = [Math.floor(W / 2), Math.round(W * 0.25), Math.round(W * 0.75)];
        return (
          <group>
            {/* Water channel */}
            <mesh position={[cxMid, -0.04, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[lenX, HEX_ROW_STEP * 1.1]} />
              <meshStandardMaterial color="#2c5882" roughness={0.32} metalness={0.45} />
            </mesh>
            {/* Stone banks north & south */}
            {[-1, 1].map((s, i) => (
              <mesh key={i} position={[cxMid, 0.08, cz + s * HEX_ROW_STEP * 0.62]} castShadow receiveShadow>
                <boxGeometry args={[lenX, 0.2, 0.22]} />
                <meshStandardMaterial color="#9a8f78" roughness={0.94} />
              </mesh>
            ))}
            {bridgeCols.map((bc, i) => {
              const [bx] = hexWorld(bc, cr);
              return <CanalBridge3D key={`cb${i}`} x={bx} z={cz} />;
            })}
          </group>
        );
      })()}

      {/* 城外腹地 — real-geography countryside in every direction, roads to
          each neighbour, and the 8 defence slots on their compass bearings. */}
      <Hinterland3D
        preview={preview}
        city={city}
        neighbors={neighbors}
        facilities={facilities}
        armies={armies}
        stockades={stockades}
        ports={ports}
        scars={scars}
        slots={slots}
        selectedSlot={selectedSlot}
        onSlotClick={onSlotClick}
        showOverlays={showOverlays}
      />

      {/* Building foundations (地基) — real buildings sit on their plots, empty
          ones show a gold buildable ring; tap one to open the build menu. */}
      {plots.map((p, i) => {
        const [x, z] = hexWorld(p.col, p.row);
        const occupied = buildingHexes.has(`${p.col},${p.row}`);
        return (
          <FoundationPlot3D
            key={`plot-${p.col}-${p.row}`}
            x={x} z={z}
            occupied={occupied}
            selected={selectedPlot === i}
            onClick={occupied ? undefined : () => onPlotClick(i)}
          />
        );
      })}

      {/* Buildings still under construction — scaffolding + 建造中 banner. */}
      {construction.map((c) => {
        const [x, z] = hexWorld(c.coord.col, c.coord.row);
        return <ConstructionSite3D key={`cons-${c.coord.col}-${c.coord.row}`} x={x} z={z} nameZh={c.nameZh} />;
      })}

      {/* Living-city dwellings + central 府衙 (cosmetic) */}
      <CityDwellings3D preview={preview} cityWallCol={cityWallCol} occupied={occupiedHexes} bannerColor={bannerColor} stats={stats} grand={grand} landmarkInfo={landmarkInfo} weatherKind={weatherKind} ruined={!!city.ruined} isCapital={isCapital} specialty={specialty} troops={city.troops} activity={activity} />

      {/* A few birds wheeling over the rooftops */}
      <Birds3D
        cx={(preview.width * HEX_COL_STEP) / 2}
        cz={(preview.height * HEX_ROW_STEP) / 2}
        radius={Math.min(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP) * 0.32}
        y={8}
      />

      {/* Inside-city buildings */}
      {buildings.map((b) => (
        <InsideBuilding3D
          key={`bld-${b.coord.col},${b.coord.row}`}
          coord={b.coord}
          buildingId={b.buildingId}
          level={b.level}
        />
      ))}

     </InspectCtx.Provider>
    </SeasonCtx.Provider>
  );
}

/* ─── 市易 — inline grain market for the 市集 inspect card (金⇄糧 at the
 *  city's live, season-bent rate), so the player needn't open the flat panel. */
function MarketTradeRow({ city, season, cityId, tradeFood, onTraded }: {
  city: City;
  season: Season;
  cityId: EntityId;
  tradeFood: (cityId: EntityId, kind: 'buy' | 'sell', amount: number) => { ok: boolean; got: number };
  onTraded: (msg: string) => void;
}) {
  const rate = foodRate(city, season);
  const btn = (label: string, disabled: boolean, onClick: () => void, key: string) => (
    <button key={key} disabled={disabled} onClick={onClick} style={{
      background: disabled ? 'transparent' : '#2a1f14',
      border: `1px solid ${disabled ? '#3a2d20' : '#d4a84a'}`,
      color: disabled ? '#5a4a35' : '#f0d98a',
      padding: '0.26rem 0.5rem', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', fontSize: '0.72rem',
    }}>{label}</button>
  );
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6, fontSize: '0.72rem', color: '#c0a878' }}>
      <div style={{ marginBottom: 5 }}>
        <span style={{ color: '#8a7858' }}>市易</span> 糧價 <strong style={{ color: '#d4a84a' }}>{rate.toFixed(1)}</strong> 糧/金
        <span style={{ marginLeft: 8, color: '#8a7050' }}>庫 金{city.gold.toLocaleString()} · 糧{city.food.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ color: '#9ac06a', marginRight: 2 }}>買糧</span>
        {[500, 2000].map((g) => btn(`${g}金→${buyQuote(city, season, g).toLocaleString()}糧`, city.gold < g, () => {
          const r = tradeFood(cityId, 'buy', g);
          if (r.ok) playSfx('coin');
          onTraded(r.ok ? `市易:${g} 金易得 ${r.got.toLocaleString()} 糧。` : '府庫金不足。');
        }, `b${g}`))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 4 }}>
        <span style={{ color: '#e0c060', marginRight: 2 }}>賣糧</span>
        {[1000, 5000].map((f) => btn(`${f.toLocaleString()}糧→${sellQuote(city, season, f).toLocaleString()}金`, city.food < f, () => {
          const r = tradeFood(cityId, 'sell', f);
          if (r.ok) playSfx('coin');
          onTraded(r.ok ? `市易:${f.toLocaleString()} 糧易得 ${r.got.toLocaleString()} 金。` : '存糧不足。');
        }, `s${f}`))}
      </div>
    </div>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function CityMapScreen3D({ cityId, onClose }: {
  cityId: EntityId;
  onClose: () => void;
}) {
  // Thin shell — the early bail lives HERE so the inner component's ~20 hooks
  // always run unconditionally (the old in-body `if (!city) return null`
  // violated the Rules of Hooks for every hook declared after it).
  const city = useGameStore((s) => s.cities[cityId]);
  if (!city) return null;
  return <CityMapScreen3DInner city={city} cityId={cityId} onClose={onClose} />;
}

function CityMapScreen3DInner({ city, cityId, onClose }: {
  city: import('../../game/types').City;
  cityId: EntityId;
  onClose: () => void;
}) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const allCities = useGameStore((s) => s.cities);
  const allForts = useGameStore((s) => s.forts);
  const allArmies = useGameStore((s) => s.armies);
  const allBuildings = useGameStore((s) => s.buildings);
  const officersMap = useGameStore((s) => s.officers);
  const appointments = useGameStore((s) => s.appointments);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const date = useGameStore((s) => s.date);
  const taxPolicy = useGameStore((s) => s.taxPolicy);
  const inflation = useGameStore((s) => s.inflation ?? 0);
  const weatherKind = useGameStore((s) => (s.weather?.kind ?? 'clear') as WeatherKind);
  const tradeFood = useGameStore((s) => s.tradeFood);
  const autoAssignIdle = useGameStore((s) => s.autoAssignIdle);
  const relocateCapital = useGameStore((s) => s.relocateCapital);
  const capitalMoveUsed = useGameStore((s) => s.capitalMoveUsed);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const buildAction = useGameStore((s) => s.buildDefenseStructure);
  const upgradeAction = useGameStore((s) => s.upgradeDefenseStructure);
  const demolishAction = useGameStore((s) => s.demolishDefenseStructure);
  const startBuilding = useGameStore((s) => s.startBuilding);
  const startPracticeBattle = useGameStore((s) => s.startPracticeBattle);
  const season = useGameStore((s) => s.date.season) as SeasonKey;
  const baseLight = SEASON_LIGHT[season] ?? SEASON_LIGHT.spring;
  // 天時入景 — the weather bends the city's light, not just its harvest:
  // a drought bakes the air amber and hazy, rain greys it down, ruin drains
  // the colour out. The scene reads its own crisis at a glance.
  const light = useMemo(() => {
    let L = { ...baseLight };
    if (weatherKind === 'drought') {
      L = { ...L, ambient: L.ambient * 1.05, ambientColor: '#f4d79a', sun: '#ffdf9a', sunI: L.sunI * 1.12, fog: '#d8c690' };
    } else if (weatherKind === 'rain') {
      L = { ...L, ambient: L.ambient * 0.7, ambientColor: '#9fb0bc', sun: '#b8c4cc', sunI: L.sunI * 0.5, fog: '#8a98a2', nightGlow: Math.max(L.nightGlow, 0.5) };
    } else if (weatherKind === 'wind') {
      L = { ...L, fog: '#cabfa0' };
    }
    if (city.ruined) {
      L = { ...L, ambient: L.ambient * 0.78, ambientColor: '#b8a890', sun: '#c8b89a', sunI: L.sunI * 0.7, fog: '#7a6e5c', nightGlow: Math.max(L.nightGlow, 0.4) };
    }
    return L;
  }, [baseLight, weatherKind, city.ruined]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<number | null>(null);
  const [buildMsg, setBuildMsg] = useState<string | null>(null);
  const [inspect, setInspect] = useState<InspectInfo | null>(null);
  const [pickerCmd, setPickerCmd] = useState<InternalAffairsType | null>(null);
  const [hovered, setHovered] = useState<{ col: number; row: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(false);
  // Exit by rising back up toward the strategic-map vantage, then unmount.
  // A timeout OWNS the close so we never depend on the camera animation's
  // callback firing — clicking × always gets you out.
  const [exiting, setExiting] = useState(false);
  const closingRef = useRef(false);
  const beginClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    playSfx('whoosh');
    setExiting(true);
    window.setTimeout(onClose, 480);
  };
  const lang = useLanguage();
  const t = useT();

  const rawPreview = useMemo(
    () => previewBattlefield(cityId, {
      terrain: city?.terrain, port: city?.port,
      x: city?.coords.x, y: city?.coords.y,
    }, 30, 19, true), // city view uses a big, consistent grid (forceSize); 30×19 → 45 raw plots (sliced to building-type count)
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

  const isPlayer = city.ownerForceId === playerForceId;
  const slots = city.buildSlots ?? [];
  const size = citySize(city);
  const total = aggregateSlotEffects(slots);
  const builtCount = slots.filter((s) => s.buildingId).length;
  const cityWallCol = preview.width - 1;
  const ownerForce = city.ownerForceId ? forces[city.ownerForceId] : null;
  const bannerColor = ownerForce?.color ?? '#5a4530';
  // Live data the 3D scene reflects — a bustling market means high commerce, a
  // big farm means high agriculture, crowds mean population, lanterns mean a
  // loyal populace. The city view becomes a readout of its own numbers.
  const cap = size.statCap || 100;
  const econCap = size.econCap || cap;
  // 施政預覽 — for each command button, estimate the gain the city's BEST idle
  // officer would yield, so the player can judge value before opening the picker.
  const apptBonus = useMemo(
    () => appointmentBonusFor(city.ownerForceId, appointments, officersMap, cityId),
    [city.ownerForceId, appointments, officersMap, cityId],
  );
  const idleOfficers = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId && o.status === 'idle' && !o.task,
    ),
    [officersMap, cityId, city.ownerForceId],
  );
  // 在城武將 — every officer garrisoned here (興学 lectures lift them all).
  const stationedCount = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId,
    ).length,
    [officersMap, cityId, city.ownerForceId],
  );
  // 裝飾地標的活文本 — 鐘鼓樓報時、寶塔登高瞭望最近的異旗之城、園林記在城雅集之眾。
  const landmarkInfo = useMemo<LandmarkInfo>(() => {
    const seasonZh = SEASON_LABEL[date.season as Season]?.zh ?? '';
    const timeBody = `晨鐘暮鼓,司一城之辰刻。今為 ${date.year} 年 · ${seasonZh}季;城中現有武將 ${stationedCount} 員。`;
    let nearest: typeof city | null = null;
    let nd = Infinity;
    for (const c of Object.values(allCities)) {
      if (c.id === cityId || c.ownerForceId === city.ownerForceId) continue;
      const d = Math.hypot(c.coords.x - city.coords.x, c.coords.y - city.coords.y);
      if (d < nd) { nd = d; nearest = c; }
    }
    let pagodaBody: string;
    if (nearest) {
      const dx = nearest.coords.x - city.coords.x;
      const dy = nearest.coords.y - city.coords.y;
      const dir = ['東', '東南', '南', '西南', '西', '西北', '北', '東北'][
        Math.round(((Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8
      ];
      const ownerZh = nearest.ownerForceId ? (forces[nearest.ownerForceId]?.name.zh ?? '在野') : '在野';
      pagodaBody = `登高瞭望:最近的異旗之城為${dir}面的「${nearest.name.zh}」(${ownerZh}),憑欄可望其旌旗。`;
    } else {
      pagodaBody = '登高瞭望:四望皆我疆土,邊塵不驚。';
    }
    const gardenBody = stationedCount > 0
      ? `官家園池,曲橋亭榭、蓮葉垂柳。今城中 ${stationedCount} 員文武在此雅集休憩,情誼漸篤。`
      : '官家園池,曲橋亭榭、蓮葉垂柳。惜城中無將,池榭空寂。';
    return { timeBody, pagodaBody, gardenBody };
  }, [date.year, date.season, stationedCount, allCities, cityId, city, forces]);
  // 府衙度支 — this city's own seasonal ledger, via the SAME engine the season
  // settles with (not an estimate). Surfaced at the 府衙 so the player needn't
  // leave the city view for the 度支簿.
  const cityEcon = useMemo(() => {
    const cityOfficers = Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === city.ownerForceId,
    );
    const tax = city.ownerForceId ? (taxPolicy?.[city.ownerForceId] ?? 'normal') : 'normal';
    const infl = city.ownerForceId === playerForceId ? inflation : 0;
    const statecraft = city.ownerForceId ? (forces[city.ownerForceId]?.statecraft ?? null) : null;
    return tickCityEconomy(city, date.season as Season, cityOfficers, tax, infl, weatherKind, allBuildings, statecraft);
  }, [city, officersMap, cityId, taxPolicy, inflation, playerForceId, forces, date.season, weatherKind, allBuildings]);
  const isCapital = !!playerForceId && forces[playerForceId]?.capitalCityId === cityId;
  const specialty = useMemo(() => citySpecialty(cityId), [cityId]);
  // 施政中 — which landmarks have an order queued this season, so the scene can
  // show the work in progress (field hands at the 屯田, drilling at the 校場,
  // scaffolding on the walls…). Reads pendingCommands for this city.
  const activity = useMemo<CityActivity>(() => {
    const a: CityActivity = { farm: false, market: false, barracks: false, wall: false, hall: false, tavern: false };
    for (const c of Object.values(pendingCommands)) {
      if ((c as { cityId?: EntityId }).cityId !== cityId) continue;
      switch ((c as { type?: InternalAffairsType }).type) {
        case 'develop-agriculture': case 'major-agriculture': case 'flood-control': a.farm = true; break;
        case 'military-farming': a.farm = true; a.barracks = true; break;
        case 'develop-commerce': case 'major-commerce': a.market = true; break;
        case 'recruit-troops': case 'drill-troops': case 'garrison': a.barracks = true; break;
        case 'build-defense': case 'major-defense': case 'upgrade-wall': a.wall = true; break;
        case 'improve-loyalty': case 'relief': case 'anti-corruption': case 'encourage-migration': case 'promote-learning': a.hall = true; break;
        case 'search': a.tavern = true; break;
      }
    }
    return a;
  }, [pendingCommands, cityId]);
  // Best-officer施政預覽 per command, computed once (memoised) rather than
  // re-scanning idleOfficers for every button on every render of the card.
  const previewByCmd = useMemo(() => {
    const out: Partial<Record<InternalAffairsType, ReturnType<typeof previewCommandGain>>> = {};
    const types = (Object.keys(COMMAND_DEFS) as CommandType[]).filter((k): k is InternalAffairsType => k !== 'march');
    for (const ct of types) {
      const stat = COMMAND_DEFS[ct].stat;
      let best: typeof idleOfficers[number] | null = null;
      let bestScore = -1;
      for (const o of idleOfficers) {
        const score = o.stats[stat] * commandFitMultiplier(o, ct);
        if (score > bestScore) { bestScore = score; best = o; }
      }
      out[ct] = best ? previewCommandGain(ct, best, city, {
        internalMultiplier: apptBonus.internalMultiplier,
        recruitBonus: apptBonus.recruitBonus,
      }) : null;
    }
    return out;
  }, [idleOfficers, apptBonus, city]);
  const cityStats = {
    fCommerce: Math.min(1, city.commerce / cap),
    fAgri: Math.min(1, city.agriculture / cap),
    fLoyalty: Math.min(1, city.loyalty / (size.loyaltyCap || 100)),
    fPop: Math.min(1, city.population / 320000),
  };
  // Great cities raise a second, inner palace wall around the civic centre.
  const grandCity = size.id === 'capital' || size.id === 'large';

  const cityBuildingsAll = useMemo(
    () => allBuildings.filter((b) => b.cityId === cityId),
    [allBuildings, cityId],
  );
  // Buildable foundations (地基) inside the walls. Each building remembers the
  // plot it was placed on (b.plot); legacy/AI buildings without one fall back
  // to the first free plot in a deterministic order.
  // One foundation per possible building type — slice the raw grid to the
  // building-type count so there are never perpetually-empty buildable rings.
  const plots = useMemo(
    () => cityBuildPlots(preview.width, preview.height).slice(0, BUILDING_DEFS.length),
    [preview.width, preview.height],
  );
  const placed = useMemo(() => {
    const taken = new Set<number>();
    for (const b of cityBuildingsAll) if (typeof b.plot === 'number') taken.add(b.plot);
    let next = 0;
    const claim = () => { while (taken.has(next)) next++; taken.add(next); return next; };
    return cityBuildingsAll.map((b) => {
      const idx = typeof b.plot === 'number' ? b.plot : claim();
      return { building: b, plotIndex: idx, coord: plots[idx] };
    }).filter((p) => !!p.coord);
  }, [cityBuildingsAll, plots]);
  // Completed buildings get a real 3D block; in-progress ones (level 0,
  // progress > 0) show scaffolding so you can watch them go up.
  const insideBuildings = useMemo(
    () => placed.filter((p) => p.building.level > 0)
      .map((p) => ({ coord: p.coord, buildingId: p.building.id, level: p.building.level })),
    [placed],
  );
  const construction = useMemo(
    () => placed.filter((p) => p.building.level === 0 && p.building.progress > 0)
      .map((p) => ({ coord: p.coord, nameZh: INSIDE_BUILDING_DEF[p.building.id]?.nameZh ?? p.building.id })),
    [placed],
  );
  const presentTypes = useMemo(() => new Set(cityBuildingsAll.map((b) => b.id)), [cityBuildingsAll]);
  const plotByHex = useMemo(() => {
    const m = new Map<string, number>();
    plots.forEach((p, i) => m.set(`${p.col},${p.row}`, i));
    return m;
  }, [plots]);
  const buildingAtPlot = useMemo(() => {
    const m = new Map<number, typeof placed[number]['building']>();
    placed.forEach((p) => m.set(p.plotIndex, p.building));
    return m;
  }, [placed]);

  // Adjacent cities — used to draw a signed road in each one's true direction
  // and to tell which compass slot guards which approach.
  const neighbors = useMemo<Neighbor[]>(() => {
    if (!city) return [];
    return (city.adjacentCityIds ?? [])
      .map((id) => allCities[id])
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => {
        const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
        return {
          id: c.id,
          nameZh: pickName(c.name, lang),
          nameEn: c.name.en,
          x: c.coords.x,
          y: c.coords.y,
          color: owner?.color ?? '#8a7050',
          rel: (c.ownerForceId === playerForceId ? 'self'
            : c.ownerForceId ? 'other' : 'neutral') as Neighbor['rel'],
        };
      });
  }, [city, allCities, forces, playerForceId, lang]);

  // Strategic 施設 near this city — projected into the hinterland so the same
  // building shows on the world map, here, and (in range) on the battlefield.
  const nearbyFacilities = useMemo<HinterlandFacility[]>(() => {
    if (!city) return [];
    return Object.values(allForts)
      .filter((f) => f.facility)
      .map((f) => {
        const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
        const dx = fx - city.coords.x, dy = fy - city.coords.y;
        return {
          id: f.id, kind: f.facility!, dx, dy,
          dist: Math.hypot(dx, dy),
          owned: f.ownerForceId === playerForceId,
        };
      })
      .filter((f) => f.dist < 95); // only ones in this city's hinterland
  }, [allForts, city, playerForceId]);

  // 塢壘/關砦 (non-facility forts) near this city — same projection.
  const nearbyStockades = useMemo(() => {
    if (!city) return [] as Array<{ id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean }>;
    return Object.values(allForts)
      .filter((f) => !f.facility)
      .map((f) => {
        const [fx, fy] = geoToPixel(f.coords.lon, f.coords.lat);
        const dx = fx - city.coords.x, dy = fy - city.coords.y;
        return { id: f.id, dx, dy, dist: Math.hypot(dx, dy), nameZh: pickName(f.name, lang), owned: f.ownerForceId === playerForceId };
      })
      .filter((f) => f.dist < 95);
  }, [allForts, city, playerForceId, lang]);

  // 港口 near this city — anchored at their true bearing.
  const allPorts = useGameStore((s) => s.ports);
  const nearbyPorts = useMemo(() => {
    if (!city) return [] as Array<{ id: string; dx: number; dy: number; dist: number; nameZh: string; owned: boolean }>;
    return Object.values(allPorts)
      .map((p) => {
        const [ppx, ppy] = geoToPixel(p.coords.lon, p.coords.lat);
        const dx = ppx - city.coords.x, dy = ppy - city.coords.y;
        return { id: p.id, dx, dy, dist: Math.hypot(dx, dy), nameZh: pickName(p.name, lang), owned: p.ownerForceId === playerForceId };
      })
      .filter((p) => p.dist < 95);
  }, [allPorts, city, playerForceId, lang]);

  // 戰痕 — recent battle sites near this city pulse on the hinterland too.
  const fieldBattleMarks = useGameStore((s) => s.fieldBattleMarks);
  const nearbyScars = useMemo(() => {
    if (!city) return [] as Array<{ dx: number; dy: number; dist: number; fresh: boolean }>;
    return fieldBattleMarks
      .map((m) => {
        const dx = m.x - city.coords.x, dy = m.y - city.coords.y;
        return { dx, dy, dist: Math.hypot(dx, dy), fresh: m.seasonsLeft >= 2 };
      })
      .filter((m) => m.dist < 95 && m.dist > 3);
  }, [fieldBattleMarks, city]);

  // Armies marching near this city — projected onto the hinterland so you watch
  // columns close in from their true direction (enemy columns flagged a threat).
  const nearbyArmies = useMemo<HinterlandArmy[]>(() => {
    if (!city) return [];
    return Object.values(allArmies)
      .map((a) => {
        const dx = a.x - city.coords.x, dy = a.y - city.coords.y;
        const force = forces[a.forceId];
        return {
          id: a.id, dx, dy, dist: Math.hypot(dx, dy),
          color: force?.color ?? '#8a7050',
          troops: a.troops,
          nameZh: force ? pickName(force.name, lang) : '',
          own: a.forceId === playerForceId,
          incoming: a.targetCityId === cityId,
        };
      })
      // Skip columns sitting on the city itself (garrison) and far-off ones.
      .filter((a) => a.dist > 4 && a.dist < 95);
  }, [allArmies, city, forces, playerForceId, cityId, lang]);

  // For the selected slot: which neighbour(s) lie in its compass octant.
  const slotGuards = useMemo(() => {
    const m = new Map<number, Neighbor[]>();
    if (!city) return m;
    for (const n of neighbors) {
      const oct = octantForWorldDir(n.x - city.coords.x, n.y - city.coords.y);
      const arr = m.get(oct) ?? [];
      arr.push(n);
      m.set(oct, arr);
    }
    return m;
  }, [neighbors, city]);

  const handleTileClick = (coord: { col: number; row: number }) => {
    if (!isPlayer) return;
    // Defence slots live out in the hinterland now (clicked directly); tapping
    // the city ground only opens building foundations.
    const plotIdx = plotByHex.get(`${coord.col},${coord.row}`);
    if (plotIdx !== undefined) {
      handlePlotClick(plotIdx);
      return;
    }
    setSelectedSlot(null);
    setSelectedPlot(null);
  };

  const handleSlotClick = (slot: number) => {
    if (!isPlayer) return;
    setSelectedSlot(slot);
    setSelectedPlot(null);
    setError(null);
  };

  // 守城演習 from a chosen approach — the assault rolls in along this slot's
  // bearing (from the real neighbour that way, else the compass octant), so the
  // battle board IS this direction's slice of the map at full combat scale.
  const drillFromSlot = (slot: number) => {
    if (!isPlayer || !city) return;
    const guard = (slotGuards.get(slot) ?? [])[0];
    const bearing = guard
      ? Math.atan2(city.coords.y - guard.y, city.coords.x - guard.x)
      : Math.atan2(-COMPASS_DIR[slot][1], -COMPASS_DIR[slot][0]);
    if (startPracticeBattle(cityId, bearing)) onClose();
  };

  const handlePlotClick = (plotIndex: number) => {
    if (!isPlayer) return;
    setSelectedSlot(null);
    setBuildMsg(null);
    setSelectedPlot(plotIndex);
  };

  const tryStartBuilding = (plotIndex: number, id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id, plotIndex);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
        'not your city': '非我方城池',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法建造');
    } else {
      playSfx('thud');
      setSelectedPlot(null);
    }
  };

  const tryUpgradeBuilding = (id: BuildingId) => {
    setBuildMsg(null);
    const r = startBuilding(cityId, id);
    if (!r.ok) {
      const reasons: Record<string, string> = {
        'not enough gold': '城内存金不足',
        'max level': '已達最高等級',
        'already in progress': '已在建造中',
      };
      setBuildMsg(reasons[r.reason ?? ''] ?? r.reason ?? '無法升級');
    } else {
      playSfx('thud');
    }
  };

  const tryBuild = (slot: number, id: DefenseBuildingId) => {
    setError(null);
    const r = buildAction(cityId, slot, id);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else { playSfx('thud'); setSelectedSlot(null); }
  };
  const tryUpgrade = (slot: number) => {
    setError(null);
    const r = upgradeAction(cityId, slot);
    if (!r.ok) setError(r.reason ?? 'Failed');
    else playSfx('thud');
  };
  const tryDemolish = (slot: number) => {
    demolishAction(cityId, slot);
    setSelectedSlot(null);
  };

  const centerX = (preview.width * HEX_COL_STEP) / 2;
  const centerZ = (preview.height * HEX_ROW_STEP) / 2;
  // Frame the whole city — pull the camera back in proportion to its size.
  const citySpan = Math.max(preview.width * HEX_COL_STEP, preview.height * HEX_ROW_STEP);
  const camHeight = citySpan * 0.62;
  const camOffset = citySpan * 0.64;

  const ALL_BUILDINGS: DefenseBuildingId[] = [
    'watchtower', 'beacon', 'caltrops', 'lookout',
    'barracks-out', 'granary-out',
    'iron-chains', 'rockfall', 'arrow-platform',
  ];

  const currentSlot = selectedSlot !== null ? slots.find((s) => s.slot === selectedSlot) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') beginClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // City soundscape while the 城内 view is open.
  useEffect(() => {
    playSfx('open-modal');
    startCityAmbience();
    return () => stopCityAmbience();
  }, []);

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
        <div style={{ color: '#d4a84a', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.1rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{pickName(city.name, lang)}</span>
          <span style={{ fontSize: '0.85rem', color: size.color, marginLeft: '0.6rem' }}>{pickName(size.name, lang)}</span>
          <span style={{ fontSize: '0.7rem', color: '#8a7050', marginLeft: '0.8rem' }}>
            {builtCount}/8 防禦
            {total.defenseBonus > 0 && ` · +${total.defenseBonus} 守備`}
            {total.rangedPrestrike > 0 && ` · 預射 ${total.rangedPrestrike}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {isPlayer && idleOfficers.length > 0 && (
            <button
              onClick={() => {
                const r = autoAssignIdle();
                playSfx(r.assigned > 0 ? 'bell' : 'pluck');
                setAssignMsg(r.assigned > 0
                  ? `一鍵委派:${r.assigned} 員領命${r.goldSpent > 0 ? `,耗 ${r.goldSpent} 金` : ''}。`
                  : '無閒置武將可委派(或城已委任太守自理)。');
                window.setTimeout(() => setAssignMsg(null), 3200);
              }}
              title={t('把城中閒置武將按需求×適性自動派活', 'Auto-assign idle officers by need × aptitude')}
              style={{
                background: 'rgba(126, 214, 138, 0.16)',
                border: '1px solid rgba(126, 214, 138, 0.5)', borderRadius: '10px',
                color: '#bfeebf', padding: '0.3rem 0.6rem',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.7rem', cursor: 'pointer',
                letterSpacing: '0.08rem',
              }}
            >
              一鍵委派 ({idleOfficers.length})
            </button>
          )}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            style={{
              background: showOverlays ? 'rgba(212, 168, 74, 0.2)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              color: showOverlays ? '#d4a84a' : '#8a7050',
              padding: '0.3rem 0.6rem',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.7rem', cursor: 'pointer',
              letterSpacing: '0.1rem',
            }}
          >
            {showOverlays ? '✓' : ''} 戰術疊加
          </button>
          <button onClick={beginClose} style={{
            background: 'transparent', border: 'none', color: '#d4a84a',
            fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
          }}>×</button>
        </div>
      </header>

      {assignMsg && (
        <div style={{
          position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
          zIndex: 12, background: 'rgba(20,32,18,0.94)', border: '1px solid #7ed68a',
          borderRadius: 4, padding: '0.35rem 0.8rem', color: '#bfeebf',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem', whiteSpace: 'nowrap',
        }}>{assignMsg}</div>
      )}

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [centerX, camHeight * 2.6, centerZ + camOffset * 0.18], fov: 50 }}
          shadows={RENDER_HI}
          dpr={RENDER_HI ? [1, 2] : [1, 1.5]}
          style={{ background: light.sky }}
        >
          {/* Swoop down into the city on entry; rise back up on exit. Distinct
              keys so the exit dive mounts fresh (a reused instance would keep
              its finished state and never animate). The close itself is owned
              by beginClose's timeout, so this is purely visual. */}
          {exiting ? (
            <IntroDive
              key="out"
              mode="out"
              start={[centerX, camHeight * 2.6, centerZ + camOffset * 0.18]}
              end={[centerX, camHeight, centerZ + camOffset]}
              target={[centerX, 0, centerZ]}
              duration={0.45}
            />
          ) : (
            <IntroDive
              key="in"
              start={[centerX, camHeight * 2.6, centerZ + camOffset * 0.18]}
              end={[centerX, camHeight, centerZ + camOffset]}
              target={[centerX, 0, centerZ]}
              onDone={() => setIntroDone(true)}
            />
          )}
          <CityScene
            preview={preview}
            slots={slots}
            buildings={insideBuildings}
            construction={construction}
            plots={plots}
            cityWallCol={cityWallCol}
            bannerColor={bannerColor}
            light={light}
            season={season}
            stats={cityStats}
            grand={grandCity}
            onInspect={(info) => { playSfx('click'); setInspect(info); }}
            selectedPlot={selectedPlot}
            onPlotClick={handlePlotClick}
            hovered={hovered}
            onHover={setHovered}
            onClick={handleTileClick}
            showOverlays={showOverlays}
            city={city}
            neighbors={neighbors}
            facilities={nearbyFacilities}
            armies={nearbyArmies}
            stockades={nearbyStockades}
            ports={nearbyPorts}
            scars={nearbyScars}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
            landmarkInfo={landmarkInfo}
            weatherKind={weatherKind}
            isCapital={isCapital}
            specialty={specialty}
            activity={activity}
          />
          <OrbitControls
            enabled={introDone && !exiting}
            target={[centerX, 0, centerZ]}
            enablePan
            maxPolarAngle={Math.PI / 2.2}
            minDistance={6}
            maxDistance={citySpan * 2.4}
          />
          {/* Lanterns, braziers and water all catch a soft glow. */}
          {RENDER_HI && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.85} intensity={0.35} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>

        {/* "You are here" locator — this city's window on the world map. */}
        <div style={{ position: 'absolute', left: 12, bottom: 12 }}>
          <LocatorMap window={cityViewWindow(city)} focusCityId={cityId} />
        </div>

        {/* Slot editor overlay */}
        {selectedSlot !== null && isPlayer && (
          <div
            style={{
              position: 'absolute', right: 12, top: 12, width: 320,
              background: 'rgba(20, 14, 8, 0.95)',
              border: '1px solid #d4a84a',
              padding: '0.8rem',
              color: '#c0a878',
              fontFamily: 'var(--tkm-font-body)',
              fontSize: '0.78rem',
              maxHeight: 'calc(100vh - 80px)',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ color: '#d4a84a', letterSpacing: '0.07rem' }}>
                {lang === 'en'
                  ? `${COMPASS_EN[selectedSlot]} Gate`
                  : `${COMPASS_ZH[selectedSlot]}面 · 第 ${selectedSlot + 1} 號位`}
              </div>
              <button onClick={() => setSelectedSlot(null)} style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
              }}>×</button>
            </div>
            {/* Which approach this slot covers — directional defence. */}
            {(() => {
              const guarded = slotGuards.get(selectedSlot) ?? [];
              return (
                <div style={{
                  marginBottom: '0.5rem', fontSize: '0.72rem',
                  color: guarded.length ? '#e0b870' : '#7a6a50',
                  letterSpacing: '0.05rem',
                }}>
                  {guarded.length
                    ? (lang === 'en'
                        ? `Guards the road from ${guarded.map((n) => n.nameEn).join('、')}`
                        : `扼守 ${guarded.map((n) => n.nameZh).join('、')} 方向來路`)
                    : (lang === 'en' ? 'No neighbour lies this way' : '此方向無相鄰城池')}
                </div>
              );
            })()}
            {/* 守城演習此面 — fight a sparring assault from exactly this approach,
                on this direction's real terrain with the defences you've built. */}
            <button
              onClick={() => drillFromSlot(selectedSlot)}
              title={lang === 'en'
                ? 'Drill a siege from this approach — same terrain & defences as a real assault here. No losses.'
                : '在此面來敵的真實地形上演練守城,連同你建的防禦一同上陣。不損兵將。'}
              style={{
                width: '100%', padding: '0.45rem',
                background: 'linear-gradient(180deg, #2a3a20, #1d2a16)',
                color: '#9ed68a', border: '1px solid #7ed68a',
                marginBottom: '0.5rem', fontFamily: 'inherit', cursor: 'pointer',
                letterSpacing: '0.1rem',
              }}
            >
              ⚔ {lang === 'en'
                ? `Drill defence — assault from ${COMPASS_EN[selectedSlot]}`
                : `守城演習 · ${COMPASS_ZH[selectedSlot]}面來敵`}
            </button>
            {currentSlot?.buildingId ? (
              <div>
                <div style={{ color: DEFENSE_BUILDINGS[currentSlot.buildingId].color, marginBottom: '0.3rem' }}>
                  {pickName(DEFENSE_BUILDINGS[currentSlot.buildingId].name, lang)} lv{currentSlot.level}
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
                        {pickName(def.name, lang)} <span style={{ float: 'right', opacity: 0.7 }}>{def.goldCost}g</span>
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

        {/* Build-menu overlay — opens when a foundation (地基) is tapped. */}
        {selectedPlot !== null && isPlayer && (() => {
          const existing = buildingAtPlot.get(selectedPlot);
          const buildable = BUILDING_DEFS.filter((d) => d.id !== 'wall' && !presentTypes.has(d.id));
          const slotsUsed = cityBuildingsAll.length;
          const slotsCap = size.buildingSlots;
          const atSlotCap = slotsUsed >= slotsCap;
          // 建築群方略 — how many of each category the city already has built (lv≥1).
          const catCountCity: Partial<Record<string, number>> = {};
          const builtTypes = new Set<string>();
          for (const b of cityBuildingsAll) {
            if ((b.level ?? 0) < 1) continue;
            builtTypes.add(b.id);
            const c = BUILDING_CATEGORY[b.id];
            if (c) catCountCity[c] = (catCountCity[c] ?? 0) + 1;
          }
          const groupPct = (count: number) => Math.round((buildingGroupSynergy(count) - 1) * 100);
          const affinity = cityAffinity(cityId); // 地利 — specialty-favoured category
          return (
            <div
              style={{
                position: 'absolute', right: 12, top: 12, width: 320,
                background: 'rgba(20, 14, 8, 0.95)',
                border: '1px solid #d4a84a',
                padding: '0.8rem',
                color: '#c0a878',
                fontFamily: 'var(--tkm-font-body)',
                fontSize: '0.78rem',
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ color: '#d4a84a', letterSpacing: '0.07rem' }}>
                  {existing ? '城内設施' : '營建新設施'}
                </div>
                <button onClick={() => setSelectedPlot(null)} style={{
                  background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer',
                }}>×</button>
              </div>
              <div style={{ color: '#8a7050', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                💰 城内存金 <span style={{ color: '#e0c060' }}>{city.gold}</span>
                <span style={{ float: 'right' }}>
                  建設位 <span style={{ color: atSlotCap ? '#b8442e' : '#e0c060' }}>{slotsUsed}/{slotsCap}</span>
                </span>
              </div>

              {existing ? (() => {
                const def = BUILDING_DEFS_BY_ID[existing.id];
                const vis = INSIDE_BUILDING_DEF[existing.id];
                const building = existing.progress > 0 && existing.level === 0;
                const upgrading = existing.progress > 0 && existing.level > 0;
                return (
                  <div>
                    <div style={{ color: vis?.color ?? '#d4a84a', marginBottom: '0.3rem' }}>
                      {vis?.nameZh ?? existing.id} lv{existing.level}
                      {building && <span style={{ color: '#e0c060', marginLeft: 6 }}>· 建造中</span>}
                      {upgrading && <span style={{ color: '#e0c060', marginLeft: 6 }}>· 升級中</span>}
                    </div>
                    <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
                      {def?.descriptionZh}
                    </div>
                    {(() => {
                      const cat = BUILDING_CATEGORY[existing.id];
                      const cnt = catCountCity[cat] ?? 0;
                      const pct = groupPct(cnt);
                      return (
                        <div style={{ color: pct > 0 ? '#8fce8f' : '#8a7050', fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          {BUILDING_CATEGORY_LABEL[cat].zh}群 ×{cnt}
                          {pct > 0 ? ` → 同類效果 +${pct}%` : '(同類建築相鄰增益,多蓋更強)'}
                        </div>
                      );
                    })()}
                    {def && existing.level < def.maxLevel && existing.progress === 0 && (
                      <button
                        onClick={() => tryUpgradeBuilding(existing.id)}
                        style={{
                          width: '100%', padding: '0.45rem',
                          background: '#1a3a5a', color: '#88b7e8',
                          border: '1px solid #88b7e8',
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        升級 → lv{existing.level + 1}
                        <span style={{ float: 'right', opacity: 0.8 }}>{def.goldPerLevel}g · {def.seasonsPerLevel}季</span>
                      </button>
                    )}
                    {def && existing.level >= def.maxLevel && (
                      <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>已達最高等級</div>
                    )}
                  </div>
                );
              })() : (
                <div>
                  <div style={{ color: '#8a7050', marginBottom: '0.4rem' }}>選擇建築 → 蓋在此地基:</div>
                  {atSlotCap && (
                    <div style={{ color: '#b8442e', textAlign: 'center', fontSize: '0.72rem' }}>
                      建設位已滿 ({slotsUsed}/{slotsCap}) — 城市升級可增加建設位
                    </div>
                  )}
                  {!atSlotCap && buildable.length === 0 && (
                    <div style={{ color: '#8a7050', textAlign: 'center', fontSize: '0.72rem' }}>所有設施已建齊</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
                    {!atSlotCap && buildable.map((def) => {
                      const vis = INSIDE_BUILDING_DEF[def.id];
                      const cat = BUILDING_CATEGORY[def.id];
                      const prereq = BUILDING_PREREQ[def.id];
                      const prereqLocked = !!prereq && !builtTypes.has(prereq);
                      const minSize = BUILDING_MIN_SIZE[def.id];
                      const sizeLocked = !!minSize && !cityMeetsSize(city, minSize);
                      const locked = prereqLocked || sizeLocked;
                      const affine = cat === affinity;
                      const cost = Math.round(def.goldPerLevel * (affine ? 0.85 : 1));
                      const afford = city.gold >= cost;
                      const usable = afford && !locked;
                      return (
                        <button
                          key={def.id}
                          onClick={() => !locked && tryStartBuilding(selectedPlot, def.id)}
                          disabled={!usable}
                          title={def.descriptionZh}
                          style={{
                            padding: '0.4rem 0.5rem',
                            background: 'rgba(212, 168, 74, 0.08)',
                            border: `1px solid ${locked ? '#5a4a3a' : (vis?.color ?? '#5a4530')}`,
                            color: usable ? (vis?.color ?? '#c0a878') : '#6a5a44',
                            opacity: usable ? 1 : 0.5,
                            fontFamily: 'inherit', fontSize: '0.75rem',
                            cursor: usable ? 'pointer' : 'not-allowed', textAlign: 'left',
                          }}
                        >
                          <div>
                            {vis?.glyph} {vis?.nameZh ?? def.id}
                            {affine && <span style={{ color: '#e0c060', marginLeft: 4 }}>◆地利</span>}
                            <span style={{ float: 'right', opacity: 0.8 }}>{cost}g · {def.seasonsPerLevel}季</span>
                          </div>
                          {prereqLocked ? (
                            <div style={{ fontSize: '0.62rem', color: '#b8442e', marginTop: 1 }}>
                              需先建「{BUILDING_DEFS_BY_ID[prereq!]?.name.zh ?? prereq}」
                            </div>
                          ) : sizeLocked ? (
                            <div style={{ fontSize: '0.62rem', color: '#b8442e', marginTop: 1 }}>
                              需「{CITY_SIZES_BY_ID[minSize!]?.name.zh ?? minSize}」級以上城市
                            </div>
                          ) : (() => {
                            const after = groupPct((catCountCity[cat] ?? 0) + 1);
                            return (
                              <div style={{ fontSize: '0.62rem', color: '#7f9f6f', marginTop: 1 }}>
                                {BUILDING_CATEGORY_LABEL[cat].zh}群{after > 0 ? ` → 同類 +${after}%` : ''}
                                {affine ? ' · 地利 +10%/造價 −15%' : ''}
                              </div>
                            );
                          })()}
                          <div style={{ fontSize: '0.66rem', color: '#8a7050', marginTop: 2 }}>{def.descriptionZh}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {buildMsg && (
                <div style={{ color: '#b8442e', marginTop: '0.4rem', fontSize: '0.72rem' }}>{buildMsg}</div>
              )}
            </div>
          );
        })()}

        {/* Hint when nothing selected */}
        {selectedSlot === null && selectedPlot === null && isPlayer && (
          <div style={{
            position: 'absolute', bottom: 14, left: 14,
            background: 'rgba(20, 14, 8, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            padding: '0.3rem 0.6rem',
            color: '#8a7050', fontFamily: 'var(--tkm-font-body)',
            fontSize: '0.7rem', letterSpacing: '0.05rem',
          }}>
            點金色八角位 → 城外防禦 · 點地基(金框) → 城内營建
          </div>
        )}

        {/* Landmark inspect card — appears when a 地标 is tapped */}
        {inspect && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            width: 'min(420px, 80vw)',
            background: 'rgba(20, 14, 8, 0.94)',
            border: `1px solid ${inspect.color}`, borderRadius: 4,
            padding: '0.6rem 0.9rem',
            fontFamily: 'var(--tkm-font-body)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: inspect.color, fontSize: '1rem', letterSpacing: '0.07rem' }}>{inspect.title}</span>
              <button onClick={() => setInspect(null)} style={{
                background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer', fontSize: '0.9rem',
              }}>×</button>
            </div>
            <div style={{ color: '#c0a878', fontSize: '0.78rem', lineHeight: 1.6, marginTop: 4 }}>{inspect.body}</div>
            {/* 理政 — actionable commands tied to this building, with the
                building's live stat shown right where you act on it. */}
            {inspect.commands && isPlayer && (() => {
              const sizeId = citySize(city).id;
              // The metric this landmark governs, for the at-a-glance readout.
              const cmds = inspect.commands;
              // 文教 buildings only hold 興学 — show the talent it accelerates
              // (在城武將) rather than an irrelevant 城防 line.
              const learningOnly = cmds.length === 1 && cmds[0] === 'promote-learning';
              const metric = cmds.includes('develop-agriculture') ? { zh: '農業', v: city.agriculture, max: econCap as number | null }
                : cmds.includes('develop-commerce') ? { zh: '商業', v: city.commerce, max: econCap as number | null }
                : cmds.includes('drill-troops') ? { zh: '練度', v: city.drill ?? 0, max: 100 as number | null }
                : learningOnly ? { zh: '在城武將', v: stationedCount, max: null as number | null }
                : { zh: '城防', v: city.defense, max: cap as number | null };
              return (
                <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6 }}>
                  <div style={{ fontSize: '0.74rem', color: '#e8d9b0', marginBottom: 6 }}>
                    {metric.zh} <strong style={{ color: inspect.color }}>{metric.v}{learningOnly ? ' 員' : ''}</strong>
                    {metric.max != null && <span style={{ color: '#8a7050' }}> / {metric.max}</span>}
                    {!cmds.includes('develop-agriculture') && !cmds.includes('develop-commerce') && !learningOnly && (
                      <span style={{ marginLeft: 10, color: '#8a7050' }}>兵 {city.troops.toLocaleString()} · 民忠 {city.loyalty}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cmds.map((ct) => {
                      const def = COMMAND_DEFS[ct];
                      const tierOk = meetsMinSize(sizeId, def.minSize);
                      if (!tierOk) return null;
                      const canAfford = city.gold >= def.goldCost;
                      const pv = previewByCmd[ct] ?? null;
                      return (
                        <button
                          key={ct}
                          onClick={() => { playSfx('open-modal'); setPickerCmd(ct); setInspect(null); }}
                          disabled={!canAfford}
                          title={canAfford ? def.description : t('金錢不足', 'Not enough gold')}
                          style={{
                            background: canAfford ? '#2a1f14' : 'transparent',
                            border: `1px solid ${canAfford ? inspect.color : '#3a2d20'}`,
                            color: canAfford ? '#f0d98a' : '#5a4a35',
                            padding: '0.3rem 0.6rem', cursor: canAfford ? 'pointer' : 'not-allowed',
                            fontFamily: 'inherit', fontSize: '0.76rem',
                          }}
                        >{pickName(def.label, lang)} <span style={{ color: '#8a7050' }}>{def.goldCost > 0 ? `${def.goldCost}g` : '免'}</span>
                          {pv && pv.delta > 0 && canAfford && (
                            <span style={{ marginLeft: 5, color: '#8fbf7a' }}>≈+{pv.delta.toLocaleString()}</span>
                          )}</button>
                      );
                    })}
                  </div>
                  {/* 府衙 · 度支 + 治所/遷都 — the seat of government surfaces this
                      city's own seasonal ledger and the capital controls in place. */}
                  {cmds.includes('improve-loyalty') && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #3a2d20', paddingTop: 6, fontSize: '0.72rem', color: '#c0a878' }}>
                      <div style={{ marginBottom: 5 }}>
                        <span style={{ color: '#8a7858' }}>本城度支</span>{'  '}
                        季金 <strong style={{ color: '#e8c860' }}>+{cityEcon.goldIncome.toLocaleString()}</strong>
                        <span style={{ marginLeft: 8 }}>季糧 <strong style={{ color: (cityEcon.foodIncome - cityEcon.foodUpkeep) >= 0 ? '#9ac06a' : '#d4774a' }}>{(cityEcon.foodIncome - cityEcon.foodUpkeep) >= 0 ? '+' : ''}{(cityEcon.foodIncome - cityEcon.foodUpkeep).toLocaleString()}</strong></span>
                        <span style={{ marginLeft: 8 }}>人口 <strong style={{ color: cityEcon.populationDelta >= 0 ? '#88b7e8' : '#d4774a' }}>{cityEcon.populationDelta >= 0 ? '+' : ''}{cityEcon.populationDelta.toLocaleString()}</strong>/季</span>
                      </div>
                      {isCapital ? (
                        <div style={{ color: '#e8c860' }}>★ 本城為治所 — 政令所出,每季 +3 民忠、禁軍宿衛。</div>
                      ) : (
                        <button
                          onClick={() => {
                            const r = relocateCapital(cityId);
                            playSfx(r.ok ? 'gong' : 'pluck');
                            setAssignMsg(r.message);
                            window.setTimeout(() => setAssignMsg(null), 3600);
                            setInspect(null);
                          }}
                          style={{ background: '#2a1f14', border: '1px solid #e0c060', color: '#f0d98a', padding: '0.28rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem' }}
                        >遷都至此 <span style={{ color: '#8a7050' }}>{capitalMoveUsed ? '800g' : '首遷免費'}</span></button>
                      )}
                    </div>
                  )}
                  {/* 市集 · 市易 — inline grain market on the commerce landmark. */}
                  {cmds.includes('develop-commerce') && (
                    <MarketTradeRow
                      city={city}
                      season={date.season as Season}
                      cityId={cityId}
                      tradeFood={tradeFood}
                      onTraded={(m) => { setAssignMsg(m); window.setTimeout(() => setAssignMsg(null), 3000); }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 府衙理政 — the multi-select officer picker, opened from a building. */}
        {pickerCmd && isPlayer && (
          <OfficerPicker cityId={cityId} commandType={pickerCmd} onClose={() => setPickerCmd(null)} />
        )}

        {/* Live readout — the scene mirrors these numbers */}
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          background: 'rgba(20, 14, 8, 0.82)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
          padding: '0.34rem 0.6rem',
          color: '#b8a274', fontFamily: 'var(--tkm-font-body)',
          fontSize: '0.66rem', lineHeight: 1.55, textAlign: 'right',
        }}>
          <div style={{ color: '#8a7858', fontSize: '0.6rem', letterSpacing: '0.05rem', marginBottom: 2 }}>城景 · 實況</div>
          <div>市集 <span style={{ color: '#d4a84a' }}>商業 {city.commerce}/{econCap}</span></div>
          <div>屯田 <span style={{ color: '#9ac06a' }}>農業 {city.agriculture}/{econCap}</span></div>
          <div>行人 <span style={{ color: '#88b7e8' }}>人口 {city.population.toLocaleString()}</span></div>
          <div>張燈 <span style={{ color: '#e0884a' }}>民忠 {city.loyalty}/{size.loyaltyCap}</span></div>
        </div>
      </div>
    </div>
  );
}


/* ─── 四季飄物 — falling snow in winter, drifting gold leaves in autumn,
 *  blossom petals on the spring breeze. One instanced field, dressed by
 *  the season; summer stays clear. */
function SeasonalDrift({ season }: { season: 'spring' | 'summer' | 'autumn' | 'winter' }) {
  const cfg = season === 'winter'
    ? { count: 900, color: '#ffffff', size: 0.05, fall: 1.1, sway: 0.4, opacity: 0.9 }
    : season === 'autumn'
      ? { count: 260, color: '#d4972f', size: 0.055, fall: 0.55, sway: 1.1, opacity: 0.85 }
      : season === 'spring'
        ? { count: 180, color: '#f2c1d8', size: 0.045, fall: 0.4, sway: 1.3, opacity: 0.8 }
        : null;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => {
    const n = cfg?.count ?? 0;
    return Array.from({ length: n }, (_, i) => ({
      x: (((i * 73) % 200) / 200 - 0.5) * 46,
      z: (((i * 137 + 41) % 200) / 200 - 0.5) * 36,
      y: ((i * 29) % 100) / 100 * 16,
      speed: 0.7 + ((i * 31) % 10) / 10 * 0.7,
      drift: ((i * 17) % 63) / 10,
    }));
  }, [cfg?.count]);
  useFrame((state, delta) => {
    if (!meshRef.current || !cfg) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const sd = seeds[i];
      sd.y -= sd.speed * cfg.fall * delta;
      if (sd.y < 0) sd.y = 16;
      dummy.position.set(
        sd.x + Math.sin(t * 0.8 + sd.drift) * cfg.sway,
        sd.y,
        sd.z + Math.cos(t * 0.6 + sd.drift) * cfg.sway * 0.7,
      );
      dummy.rotation.set(t + sd.drift, t * 0.7, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  if (!cfg) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cfg.count]} key={season}>
      {season === 'winter'
        ? <sphereGeometry args={[cfg.size, 4, 4]} />
        : <planeGeometry args={[cfg.size * 2, cfg.size * 1.4]} />}
      <meshBasicMaterial color={cfg.color} transparent opacity={cfg.opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}

/* ─── 天時粒子 — weather laid over the city: slanting rain, drifting drought
 *  dust, or wind-blown grit. One instanced field, dressed by the weather kind;
 *  clear/snow defer to SeasonalDrift. */
function WeatherFX({ kind, width, height }: { kind: WeatherKind; width: number; height: number }) {
  // Low-tier devices get roughly half the motes (the per-frame instance loop is
  // the cost here, not the draw call — one instanced mesh either way).
  const cfg = kind === 'rain'
    ? { count: RENDER_HI ? 1100 : 480, color: '#9fb4c4', sizeX: 0.022, sizeY: 0.5, fall: 9, swayX: 0.6, swayZ: 0, opacity: 0.5, top: 16 }
    : kind === 'drought'
      ? { count: RENDER_HI ? 220 : 110, color: '#cdb27a', sizeX: 0.05, sizeY: 0.05, fall: 0.25, swayX: 2.4, swayZ: 1.6, opacity: 0.5, top: 6 }
      : kind === 'wind'
        ? { count: RENDER_HI ? 320 : 150, color: '#c4b388', sizeX: 0.07, sizeY: 0.03, fall: 0.6, swayX: 3.6, swayZ: 0.8, opacity: 0.42, top: 7 }
        : null;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const spanX = width * HEX_COL_STEP, spanZ = height * HEX_ROW_STEP;
  const seeds = useMemo(() => {
    const n = cfg?.count ?? 0;
    return Array.from({ length: n }, (_, i) => ({
      x: ((i * 73) % 200) / 200 * spanX,
      z: ((i * 137 + 41) % 200) / 200 * spanZ,
      y: ((i * 29) % 100) / 100 * (cfg?.top ?? 12),
      speed: 0.7 + ((i * 31) % 10) / 10 * 0.7,
      drift: ((i * 17) % 63) / 10,
    }));
  }, [cfg?.count, cfg?.top, spanX, spanZ]);
  useFrame((state, delta) => {
    if (!meshRef.current || !cfg) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const sd = seeds[i];
      sd.y -= sd.speed * cfg.fall * delta;
      if (sd.y < 0) sd.y = cfg.top;
      // Rain slants steadily; dust/wind swirl on a sine drift.
      const sx = kind === 'rain' ? cfg.swayX : Math.sin(t * 0.9 + sd.drift) * cfg.swayX;
      const sz = Math.cos(t * 0.7 + sd.drift) * cfg.swayZ;
      dummy.position.set(sd.x + sx, sd.y, sd.z + sz);
      if (kind === 'rain') dummy.rotation.set(0, 0, 0.18);
      else dummy.rotation.set(t + sd.drift, t * 0.6, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  if (!cfg) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, cfg.count]} key={kind}>
      <planeGeometry args={[cfg.sizeX, cfg.sizeY]} />
      <meshBasicMaterial color={cfg.color} transparent opacity={cfg.opacity} side={THREE.DoubleSide} depthWrite={false} />
    </instancedMesh>
  );
}
