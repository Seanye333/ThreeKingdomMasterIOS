/* ─── 城郭建築 — every built structure of the city diorama: the interior
 * buildings (官衙/兵舍/市樓…), the rampart ring with gates, towers, moat and
 * canal, the buildable foundation plots and their ghost/construction markers,
 * plus the shared Banner3D/useFlutter helpers. Extracted verbatim from
 * CityMapScreen3D.tsx (mechanical split). */
import { useContext, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingId } from '../../../game/types';
import { BUILDING_DEFS_BY_ID, BUILDING_CATEGORY, BUILDING_CATEGORY_LABEL } from '../../../game/data/buildings';
import { SelectionRing3D } from '../../components/SelectionRing3D';
import { hexWorld, HEX_COL_STEP, HEX_ROW_STEP } from '../battle3d/battleGrid';
import { ChineseRoof3D, SeasonCtx, InspectCtx } from './Folk3D';

/** A wisp of opaque chimney smoke — three puffs rise and shrink, then recycle
 *  (no transparency; they just dwindle to nothing). */
export function Smoke3D({ x, z, base = 1.0 }: { x: number; z: number; base?: number }) {
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

export const INSIDE_BUILDING_DEF: Record<BuildingId, { glyph: string; color: string; height: number; nameZh: string }> = {
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
  lingtai: { glyph: '靈', color: '#7a8ac8', height: 2.2, nameZh: '靈台' },
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
export function useFlutter(phase: number, amp = 0.25, speed = 2.2) {
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
export function Banner3D({ color, w, h, phase, faceX = 0 }: {
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
export function InsideBuilding3D({ coord, buildingId, level, damaged }: {
  coord: { col: number; row: number };
  buildingId: BuildingId;
  level: number;
  /** 戰損 — wrecked in a siege: charred, smoking, no bonus until repaired. */
  damaged?: boolean;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const inspect = useContext(InspectCtx);
  const def = INSIDE_BUILDING_DEF[buildingId];
  const h = def.height + level * 0.15;
  // 落成之慶 — a level-up lands with a quick swell-and-settle pop plus a
  // golden burst ring, so an upgrade finishing is felt, not just listed.
  const prevLevel = useRef(level);
  const popAt = useRef(-1);
  const popRef = useRef<THREE.Group>(null);
  const burstRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (prevLevel.current !== level) {
      if (level > prevLevel.current) popAt.current = clock.elapsedTime;
      prevLevel.current = level;
    }
    const g = popRef.current;
    if (!g) return;
    const dt = popAt.current >= 0 ? clock.elapsedTime - popAt.current : 99;
    if (dt < 0.9) {
      const k = 1 + Math.sin(Math.min(1, dt / 0.9) * Math.PI) * 0.22;
      g.scale.setScalar(k);
      if (burstRef.current) {
        burstRef.current.visible = true;
        const r = 0.4 + dt * 1.6;
        burstRef.current.scale.setScalar(r);
        (burstRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - dt * 0.8);
      }
    } else {
      g.scale.setScalar(1);
      if (burstRef.current) burstRef.current.visible = false;
    }
  });
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
      title: damaged ? `${def.nameZh} · 毀於兵燹` : `${def.nameZh} · ${catLabel?.zh ?? ''} lv${level}`,
      body: damaged
        ? '攻城戰火焚及此坊,梁柱焦黑、匠作俱廢 — 修繕之前不供加成(於城建面板修繕)。'
        : (bdef?.descriptionZh ?? bdef?.description ?? '城中營造,其加成已接入本城模擬。'),
      color: damaged ? '#b8442e' : def.color,
      commands: !damaged && cat === 'culture' ? ['promote-learning'] : undefined,
    });
  };
  // 懸停快覽 — desktop: name + level + what the building does, without the
  // click-through to the full inspect card. (Touch taps = inspect already.)
  const [hoveredB, setHoveredB] = useState(false);
  return (
    <group
      position={[x, 0, z]}
      onClick={onInspectBuilding}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredB(true); }}
      onPointerOut={() => { document.body.style.cursor = ''; setHoveredB(false); }}
    >
      {hoveredB && (
        <Html position={[0, h + 1.15, 0]} center distanceFactor={13} zIndexRange={[44, 34]} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(18,12,6,0.94)', border: `1px solid ${def.color}`, borderRadius: 'var(--tkm-radius-sm)',
            padding: '3px 9px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
            color: '#e7d6ad', whiteSpace: 'nowrap', lineHeight: 1.5, maxWidth: 260,
            boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>{def.nameZh} <span style={{ color: '#c0a878', fontWeight: 'normal' }}>lv{level}</span>{damaged && <span style={{ color: '#e05a3a', marginLeft: 4 }}>毀</span>}</div>
            <div style={{ color: '#bfae86', whiteSpace: 'normal', maxWidth: 240 }}>
              {(BUILDING_DEFS_BY_ID[buildingId]?.descriptionZh ?? BUILDING_DEFS_BY_ID[buildingId]?.description ?? '').slice(0, 60)}
            </div>
          </div>
        </Html>
      )}
      {/* 落成金環 — expanding burst on level-up */}
      <mesh ref={burstRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} raycast={() => null}>
        <ringGeometry args={[0.82, 1, 28]} />
        <meshBasicMaterial color="#ffd75e" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={popRef}>
      {/* Stone plinth */}
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.28, 0.18, 1.28]} />
        <meshStandardMaterial color="#9a8f78" roughness={0.95} />
      </mesh>
      {/* Main block — charred black-brown when siege-wrecked */}
      <mesh position={[0, h / 2 + 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshStandardMaterial color={damaged ? '#33291f' : def.color} roughness={damaged ? 0.98 : 0.7} />
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
      {/* Swept tiled roof — half-collapsed and soot-black when wrecked */}
      <group position={[0, h + 0.18, 0]} rotation={damaged ? [0.12, 0, -0.09] : [0, 0, 0]}>
        <ChineseRoof3D size={damaged ? 0.9 : 1.05} color={damaged ? '#1c1712' : roofColor} ornament={grand && !damaged} />
      </group>
      {/* 兵燹餘煙 — a wrecked building still smoulders */}
      {damaged && <Smoke3D x={0.2} z={0.1} base={h + 0.3} />}
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
          borderRadius: 'var(--tkm-radius-xs)',
          whiteSpace: 'nowrap',
        }}>
          {def.nameZh} <span style={{ opacity: 0.7 }}>lv{level}</span>
        </div>
      </Html>
      </group>
    </group>
  );
}

/* ─── Tower range ring (gold circle on the ground) ──────────────────── */
/* ─── The full 3D scene ─────────────────────────────────────────────── */
/* ─── Perimeter wall + gate ──────────────────────────────────────────── */
/** A lightweight crenellated wall block (no per-segment banner/animation, so
 *  a full perimeter stays cheap on mobile). */
export function WallSegment3D({ x, z, tier = 1 }: { x: number; z: number; tier?: 1 | 2 | 3 }) {
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
export function innerWallCells(W: number, H: number) {
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
export function InnerWallSeg3D({ x, z }: { x: number; z: number }) {
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
export function InnerGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
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
export function CityGate3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
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
export function CornerTower3D({ x, z, bannerColor }: { x: number; z: number; bannerColor: string }) {
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
export function Moat3D({ W, H }: { W: number; H: number }) {
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
export function canalRow(H: number): number {
  let r = Math.round(H * 0.55);
  while (r % 3 !== 0 && r > 2) r--;
  return Math.max(3, Math.min(H - 4, r));
}

/** A humped stone bridge carrying a street over the canal (spans z). */
export function CanalBridge3D({ x, z }: { x: number; z: number }) {
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
export function cityBuildPlots(W: number, H: number): Array<{ col: number; row: number }> {
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
export function FoundationPlot3D({ x, z, occupied, selected, onClick }: {
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
      {!occupied && !selected && (
        <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <ringGeometry args={[0.42, 0.56, 4]} />
          <meshBasicMaterial color="#d4a84a" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
      {selected && <SelectionRing3D radius={0.62} y={0.2} chevronY={0.85} chevronSize={0.2} />}
    </group>
  );
}

/** 營建幻影 — hovering a build option projects a translucent ghost of the
 *  building onto the selected plot, so you see the massing before paying. */
export function GhostBuilding3D({ x, z, buildingId }: { x: number; z: number; buildingId: BuildingId }) {
  const def = INSIDE_BUILDING_DEF[buildingId];
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const roofRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const k = 0.32 + Math.sin(clock.elapsedTime * 2.4) * 0.1;
    if (matRef.current) matRef.current.opacity = k;
    if (roofRef.current) roofRef.current.opacity = k;
  });
  if (!def) return null;
  const h = def.height + 0.15;
  return (
    <group position={[x, 0, z]} raycast={() => null}>
      <mesh position={[0, h / 2 + 0.18, 0]} raycast={() => null}>
        <boxGeometry args={[1.05, h, 1.05]} />
        <meshStandardMaterial ref={matRef} color={def.color} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh position={[0, h + 0.34, 0]} rotation={[0, Math.PI / 4, 0]} raycast={() => null}>
        <coneGeometry args={[0.95, 0.42, 4]} />
        <meshStandardMaterial ref={roofRef} color="#39444f" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Scaffolding shown on a plot whose building is still under construction
 *  (level 0, progress > 0) — wooden frame + a 建造中 banner. */
export function ConstructionSite3D({ x, z, nameZh }: { x: number; z: number; nameZh: string }) {
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
          color: '#e0c060', whiteSpace: 'nowrap', borderRadius: 'var(--tkm-radius-xs)',
        }}>
          🔨 {nameZh}·建造中
        </div>
      </Html>
    </group>
  );
}

/* ─── Living-city decoration — earthen dwellings + a central 府衙 ─────── */
