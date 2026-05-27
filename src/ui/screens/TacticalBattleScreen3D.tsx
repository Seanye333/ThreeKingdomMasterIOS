import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import type { EntityId, HexCoord, Officer, StratagemId, TacticalBattle, TacticalTile, TacticalUnit, TerrainKind, TimeOfDay, UnitType, Weather } from '../../game/types';
import type { DefenseBuildingId } from '../../game/data/defenseBuildings';
import {
  aiTakeTurn, applyStratagem, attackUnits, canAttack, canMove, endTurn, hexDistance,
  moveUnit, resolveBattleEnd, unitAt,
} from '../../game/systems/tactical';
import { canDuel, resolveDuel, type DuelResult } from '../../game/systems/duel';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { FORMATIONS_BY_ID, STRATAGEMS } from '../../game/data';
import { BattleResultsModal } from '../components/BattleResultsModal';
import { DuelModal } from '../components/DuelModal';
import { useT, useDesc, useLanguage } from '../i18n';

type ActionMode =
  | { kind: 'none' }
  | { kind: 'move' }
  | { kind: 'attack' }
  | { kind: 'duel' }
  | { kind: 'stratagem'; id: StratagemId; tacticId?: string };

/** N6 — Signature-tactic flavor lines for the battle log. Keyed by tacticId. */
const SIGNATURE_FLAVOR: Record<string, { zh: string; en: string }> = {
  'borrow-wind':    { zh: '今夜東風大作 — 諸葛祭壇神算!', en: 'A great east wind rises by night — divined by stratagem!' },
  'borrow-arrow':   { zh: '草船借箭,十萬箭歸我軍!', en: '100,000 arrows seized from the river mist!' },
  'eight-gates':    { zh: '八門遁甲開,敵入死門!', en: 'Eight Gates of Heaven open — the foe is trapped!' },
  'empty-fort':     { zh: '城門大開,撫琴退兵!', en: 'Gates flung wide, lute played — the enemy retreats in doubt!' },
  'seven-lamp':     { zh: '七星燈祈壽,延命七日!', en: 'Seven Star Lamps lit — borrowed days from heaven!' },
  'star-prayer':    { zh: '北斗祭七星,卜知吉凶!', en: 'Big Dipper prayer — fortune foretold!' },
  'burn-bowang':    { zh: '火燒博望坡,夏侯軍潰!', en: 'Fire at Bowang Slope — the enemy column shatters!' },
  'burn-yiling':    { zh: '火燒連營七百里,蜀軍崩潰!', en: '700 li of camps ablaze — Shu lines collapse!' },
  'burn-chibi':     { zh: '赤壁火起,曹軍北逃!', en: 'Red Cliffs ablaze — Cao retreats north!' },
  'chain-ship':     { zh: '連環船陣大成 — 浪靜如鏡!', en: 'Chained Fleet formed — waters still as glass!' },
  'seven-grab':     { zh: '七擒孟獲,南中心服!', en: 'Seven captures, seven releases — Nanman pacified!' },
  'changban':       { zh: '長坂坡前,七進七出!', en: 'At Changban Slope — seven charges, seven returns!' },
  'tongue-war':     { zh: '舌戰群儒,辭鋒如雷!', en: 'Tongue-battle with the Wu court — words like thunder!' },
  'white-robe':     { zh: '白衣渡江,荊州陷落!', en: 'White Robe crossing — Jingzhou falls!' },
  'beauty':         { zh: '美人計奏效,呂奉先誅董卓!', en: 'The beauty stratagem — Lü Bu slays Dong Zhuo!' },
  'self-injury':    { zh: '苦肉計成 — 黃蓋投江!', en: 'Self-injury accepted — Huang Gai feigns defection!' },
  'caocao-poetry':  { zh: '橫槊賦詩,英雄氣概!', en: 'Cao Cao recites verse atop his spear!' },
  'thunder':        { zh: '五雷正法 — 天威震軍!', en: 'Five Thunder method — heaven\'s wrath strikes!' },
};

const UNIT_TYPE_LABEL: Record<UnitType, string> = {
  infantry: 'Infantry', spearmen: 'Spearmen', cavalry: 'Cavalry',
  archers: 'Archers', siege: 'Siege', navy: 'Navy',
};
const WEATHER_LABEL: Record<Weather, string> = {
  clear: '☀ clear', rain: '☂ rain', wind: '🌀 wind', fog: '≋ fog', snow: '❄ snow',
};
const TOD_LABEL: Record<TimeOfDay, string> = {
  dawn: '🌅 dawn', day: '☀ day', dusk: '🌇 dusk', night: '🌙 night',
};

/* ─── Hex world-coord math (flat-top, odd-col offset) ────────────────────
 * Same offset-coord system the 2D screen uses, just mapped into 3D world
 * units (radius = 1). Y is height (up). Z replaces 2D row axis. */
const R = 1;
const COL_STEP = 1.5 * R;
const ROW_STEP = Math.sqrt(3) * R;

/** N4 — Target-type indicator per stratagem. Lets the UI show whether
 *  the player should click an enemy, an ally, or just themselves. */
function stratagemTargetType(id: StratagemId): 'enemy' | 'ally' | 'self' | 'aoe' {
  switch (id) {
    case 'rally':                                       return 'ally';
    case 'defend': case 'precognition': case 'dragon-veil': case 'false-retreat':
      return 'self';
    case 'fire-attack': case 'confusion': case 'charge': case 'rain-of-arrows':
    case 'chain-ships': case 'lightning': case 'supply-strike': case 'gallop':
      return 'enemy';
    default:                                            return 'aoe';
  }
}

/** N4 — Short bilingual label for the target type, shown on tactic buttons. */
function targetTypeBadge(type: 'enemy' | 'ally' | 'self' | 'aoe', langZh: boolean): { label: string; color: string } {
  switch (type) {
    case 'enemy': return { label: langZh ? '敵' : 'enm', color: '#b8442e' };
    case 'ally':  return { label: langZh ? '友' : 'ally', color: '#7ed68a' };
    case 'self':  return { label: langZh ? '己' : 'self', color: '#88b7e8' };
    case 'aoe':   return { label: langZh ? '範' : 'aoe', color: '#d4a84a' };
  }
}

export function hexWorld(col: number, row: number): [number, number] {
  const x = col * COL_STEP;
  const z = row * ROW_STEP + (col & 1 ? ROW_STEP / 2 : 0);
  return [x, z];
}

export const HEX_R = R;
export const HEX_COL_STEP = COL_STEP;
export const HEX_ROW_STEP = ROW_STEP;

export const TERRAIN_HEIGHT: Record<TerrainKind, number> = {
  river:    -0.08,
  road:      0.04,
  plain:     0.10,
  forest:    0.14,
  mountain:  0.18,
  hill:       0.16,
  marsh:      -0.05,
  chokepoint: 0.04,
  bridge:     0.06,
  gate:       0.20,
  watchtower: 0.20,
};
export const TERRAIN_COLOR: Record<TerrainKind, string> = {
  river:    '#2c5882',
  road:     '#7a6038',
  plain:    '#4a5e30',
  forest:   '#2a4220',
  mountain: '#5a4838',
  hill:       '#6a5a3a',  // tawny earth
  marsh:      '#3a4838',  // boggy green
  chokepoint: '#5a4530',  // narrow defile (darker road)
  bridge:     '#8a6840',  // timber
  gate:       '#4a2820',  // dark masonry
  watchtower: '#8a7050',  // stone platform
};

const UNIT_GLYPH: Record<UnitType, string> = {
  infantry: '歩', spearmen: '槍', cavalry: '騎',
  archers: '弓', siege: '攻', navy: '水',
};

/* ─── Time-of-day lighting presets ──────────────────────────────────── */
interface LightingPreset {
  sky: [string, string];       // sky gradient (top, bottom)
  ambient: number;
  sun: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number };
  fog: [string, number, number];  // color, near, far
  showStars: boolean;
}
const LIGHTING: Record<TimeOfDay, LightingPreset> = {
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
const WEATHER_FOG_MUL: Record<Weather, number> = {
  clear: 1.0,
  rain:  0.7,
  fog:   0.4,
  snow:  0.65,
  wind:  0.85,
};

/* ─── A single hex tile + its terrain art (trees, peaks, water) ─────── */
export function HexTile({
  tile, onClick, hovered, highlight, windStrength,
}: {
  tile: TacticalTile;
  onClick: () => void;
  hovered: boolean;
  /** 'move' = walkable destination, 'attack' = attackable enemy hex, undefined = no highlight */
  highlight: 'move' | 'attack' | undefined;
  windStrength: number;
}) {
  const [x, z] = hexWorld(tile.coord.col, tile.coord.row);
  const h = TERRAIN_HEIGHT[tile.terrain];
  const baseColor = TERRAIN_COLOR[tile.terrain];
  const pulseRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (pulseRef.current && highlight) {
      pulseRef.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.15;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Hex prism — 6-sided cylinder, height by terrain */}
      <mesh
        position={[0, h / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        receiveShadow
        castShadow
      >
        <cylinderGeometry args={[R * 0.98, R * 0.98, h, 6]} />
        <meshStandardMaterial
          color={hovered ? '#f0e0b0' : baseColor}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* Highlight overlay — pulsing colored disk above hex */}
      {highlight && (
        <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[R * 0.85, 6]} />
          <meshBasicMaterial
            ref={pulseRef}
            color={highlight === 'move' ? '#7ed68a' : '#ff7050'}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Terrain decoration on top */}
      {tile.terrain === 'forest' && <ForestArt y={h} windStrength={windStrength} />}
      {tile.terrain === 'mountain' && <MountainArt y={h} />}
      {tile.terrain === 'river' && <RiverArt y={h} />}
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

/* ─── Per-unit-type mount (horse / cart / boat) under the rider ──── */
function UnitMount({ unit, onClick }: { unit: TacticalUnit; onClick: () => void }) {
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); };
  if (unit.unitType === 'cavalry') {
    return (
      <>
        {/* Horse body — box */}
        <mesh position={[0, 0.30, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.45, 0.32, 0.95]} />
          <meshStandardMaterial color="#6a4830" roughness={0.85} />
        </mesh>
        {/* Horse head/neck — forward and slightly down */}
        <mesh position={[0, 0.42, -0.55]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.28]} />
          <meshStandardMaterial color="#6a4830" roughness={0.85} />
        </mesh>
        {/* 4 legs */}
        {([[-0.18, 0.4], [0.18, 0.4], [-0.18, -0.4], [0.18, -0.4]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.09, sz]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.18, 4]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
        {/* Tail */}
        <mesh position={[0, 0.40, 0.55]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.012, 0.25, 4]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'siege') {
    return (
      <>
        {/* Cart body */}
        <mesh position={[0, 0.18, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.70, 0.32, 0.85]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* 4 wheels */}
        {([[-0.35, 0.30], [0.35, 0.30], [-0.35, -0.30], [0.35, -0.30]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.12, sz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
        {/* Catapult arm tilted up */}
        <mesh position={[0, 0.65, -0.10]} rotation={[Math.PI / 3.5, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.65, 0.05]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Stone projectile in sling */}
        <mesh position={[0, 0.95, -0.40]} castShadow>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#5a5040" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'navy') {
    return (
      <>
        {/* Boat hull */}
        <mesh position={[0, 0.10, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.50, 0.18, 0.95]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* Boat prow — pointed forward */}
        <mesh position={[0, 0.13, -0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.22, 0.30, 4]} />
          <meshStandardMaterial color="#5a4530" roughness={0.85} />
        </mesh>
        {/* Mast */}
        <mesh position={[0, 0.85, 0.10]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.10, 5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Sail */}
        <mesh position={[0, 1.10, 0.10]} castShadow>
          <planeGeometry args={[0.42, 0.55]} />
          <meshStandardMaterial color="#e0d0a8" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </>
    );
  }
  return null;  // infantry, spearmen, archers stand on foot — no mount
}

/* ─── Per-unit-type weapon (sword/spear/bow) in the rider's hand ──── */
function UnitWeapon({ unit, yLift }: { unit: TacticalUnit; yLift: number }) {
  if (unit.unitType === 'spearmen') {
    return (
      <>
        {/* Long spear pole */}
        <mesh position={[-0.34, 0.85 + yLift, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1.40, 5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Spearhead */}
        <mesh position={[-0.34, 1.60 + yLift, 0]} castShadow>
          <coneGeometry args={[0.055, 0.18, 5]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.6} roughness={0.4} />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'archers') {
    return (
      <>
        {/* Bow — curved torus half */}
        <mesh position={[-0.40, 0.55 + yLift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.24, 0.024, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Bowstring */}
        <mesh position={[-0.40, 0.55 + yLift, 0]} castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.48, 3]} />
          <meshStandardMaterial color="#c0a070" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'infantry') {
    return (
      <>
        {/* Sword — angled across body */}
        <mesh position={[-0.34, 0.45 + yLift, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.038, 0.48, 0.012]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Round shield in front */}
        <mesh position={[0.30, 0.45 + yLift, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.20, 0.20, 0.04, 12]} />
          <meshStandardMaterial color="#5a4530" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'cavalry') {
    return (
      // Lance held forward
      <mesh position={[-0.30, 0.70 + yLift, -0.10]} rotation={[Math.PI / 2 - 0.1, 0, 0]} castShadow>
        <cylinderGeometry args={[0.020, 0.020, 1.10, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
    );
  }
  return null; // siege/navy already have their own props on the mount
}

/* ─── A unit standing on a hex ─────────────────────────────────────── */
function UnitMesh({
  unit, terrainH, isPlayer, selected, onClick, isWounded,
}: {
  unit: TacticalUnit;
  terrainH: number;
  isPlayer: boolean;
  selected: boolean;
  onClick: () => void;
  isWounded?: boolean;
}) {
  const [tx, tz] = hexWorld(unit.coord.col, unit.coord.row);
  const color = isPlayer ? '#3a7dd9' : '#b8442e';
  // Animated position — lerps to target hex when unit moves
  const groupRef = useRef<THREE.Group>(null);
  const prevTarget = useRef<{ x: number; z: number }>({ x: tx, z: tz });
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const tgt = groupRef.current.position;
    // Lerp x/z toward target hex
    tgt.x += (tx - tgt.x) * Math.min(1, delta * 6);
    tgt.z += (tz - tgt.z) * Math.min(1, delta * 6);
    // Idle bob + selected hover
    const moving = Math.abs(tgt.x - tx) > 0.01 || Math.abs(tgt.z - tz) > 0.01;
    const bobBase = terrainH + 0.02;
    tgt.y = bobBase
      + (selected ? Math.sin(clock.elapsedTime * 3) * 0.05 : 0)
      + (moving ? Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.08 : 0);  // walking bounce
    prevTarget.current = { x: tx, z: tz };
  });
  // Mount lifts the rider/driver/sailor above the ground feature
  const yLift =
    unit.unitType === 'cavalry' ? 0.30 :
    unit.unitType === 'siege'   ? 0.32 :
    unit.unitType === 'navy'    ? 0.18 :
    0;

  return (
    <group ref={groupRef} position={[tx, terrainH + 0.02, tz]}>
      {/* Mount or vehicle (cavalry horse / siege cart / navy boat) */}
      <UnitMount unit={unit} onClick={onClick} />
      {/* Body torso (sits above mount if any) */}
      <mesh
        position={[0, 0.4 + yLift, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        castShadow
      >
        <cylinderGeometry args={[0.30, 0.40, 0.55, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.78 + yLift, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color="#e0c498" roughness={0.7} />
      </mesh>
      {/* Per-unit-type weapon */}
      <UnitWeapon unit={unit} yLift={yLift} />
      {/* Banner pole + flag */}
      <mesh position={[0.25, 0.95 + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.45, 1.25 + yLift, 0]} castShadow>
        <planeGeometry args={[0.4, 0.25]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color="#d4a84a" side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* HTML overlay — unit info, always-upright crisp text */}
      <Html
        position={[0, 1.6, 0]}
        center
        distanceFactor={8}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(20, 14, 8, 0.88)',
          border: `1.5px solid ${unit.isCommander ? '#d4a84a' : color}`,
          padding: '2px 6px',
          fontFamily: 'Songti SC, serif',
          fontSize: '12px',
          color: '#f0e0b0',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: unit.isCommander
            ? `0 0 14px rgba(212,168,74,0.7)`
            : `0 0 8px ${color}`,
        }}>
          <div style={{ fontWeight: 'bold' }}>
            {unit.isCommander && <span style={{ color: '#d4a84a' }}>主 </span>}
            {UNIT_GLYPH[unit.unitType]} {unit.troops.toLocaleString()}
            {isWounded && <span style={{ color: '#b8442e', marginLeft: 3 }}>傷</span>}
            {unit.effects.some((e) => e.kind === 'burning') && (
              <span style={{ color: '#f55a20', marginLeft: 3 }}>🔥</span>
            )}
          </div>
          <div style={{
            height: 2,
            background: '#1a1410',
            marginTop: 2,
            width: 40,
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round((unit.troops / unit.maxTroops) * 100)}%`,
              background: unit.troops / unit.maxTroops > 0.5 ? '#7ed68a' : '#b8442e',
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ─── City wall — thick stone wall block standing on a hex ──────── */
export function CityWall({ coord, bannerColor }: { coord: HexCoord; bannerColor: string }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const pennantRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pennantRef.current) {
      pennantRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.3;
    }
  });
  return (
    <group position={[x, 0, z]}>
      {/* Wall body — thick stone block */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, 1.6]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {/* Crenellations on top edge */}
      {[-0.6, -0.2, 0.2, 0.6].map((px, i) => (
        <mesh key={i} position={[px, 1.5, 0.6]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
      {[-0.6, -0.2, 0.2, 0.6].map((px, i) => (
        <mesh key={`b${i}`} position={[px, 1.5, -0.6]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.3]} />
          <meshStandardMaterial color="#7a6550" roughness={0.92} />
        </mesh>
      ))}
      {/* Banner pole + flag */}
      <mesh position={[0.6, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
        <meshStandardMaterial color="#1a1410" />
      </mesh>
      <mesh ref={pennantRef} position={[0.85, 2.5, 0]} castShadow>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Defense building (watchtower / beacon / etc.) ─────────────── */
const DEFENSE_BUILDING_VISUAL: Record<DefenseBuildingId, { color: string; height: number; glyph: string }> = {
  'watchtower':     { color: '#d4a84a', height: 1.8, glyph: '箭' },
  'beacon':         { color: '#b8442e', height: 1.6, glyph: '烽' },
  'caltrops':       { color: '#7a6750', height: 0.3, glyph: '拒' },
  'lookout':        { color: '#88b7e8', height: 1.5, glyph: '瞭' },
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
  const isFlame = buildingId === 'beacon';
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current && isFlame) {
      flameRef.current.scale.y = 1 + Math.sin(clock.elapsedTime * 8) * 0.2;
    }
  });
  return (
    <group position={[x, 0.1, z]}>
      {/* Tower base — tapered */}
      <mesh position={[0, visual.height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.55, visual.height, 8]} />
        <meshStandardMaterial color={visual.color} roughness={0.85} />
      </mesh>
      {/* Roof / cap */}
      <mesh position={[0, visual.height + 0.2, 0]} castShadow>
        <coneGeometry args={[0.55, 0.4, 8]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>
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
      {/* HTML label with HP bar */}
      <Html position={[0, visual.height + 1.0, 0]} center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${visual.color}`,
          padding: '1px 5px',
          fontFamily: 'Songti SC, serif',
          fontSize: '11px',
          color: visual.color,
          textAlign: 'center',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}>
          {visual.glyph} {'★'.repeat(level)}
          <div style={{ height: 2, background: '#1a1410', marginTop: 1, width: 36 }}>
            <div style={{
              height: '100%', width: `${Math.round(hpPct * 100)}%`,
              background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
            }} />
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ─── Weather particles ─────────────────────────────────────────── */
function RainParticles({ count = 800, bounds }: { count?: number; bounds: { x: number; z: number } }) {
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
function SnowParticles({ count = 600, bounds }: { count?: number; bounds: { x: number; z: number } }) {
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

/* ─── Damage number floating up from a hex ─────────────────────── */
function DamagePopup3D({ coord, text, color, spawnedAt }: {
  coord: HexCoord; text: string; color: string; spawnedAt: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / 1.2);
    groupRef.current.position.y = 1.5 + t * 1.5;
    if (htmlRef.current) {
      htmlRef.current.style.opacity = String(1 - t);
    }
  });
  return (
    <group ref={groupRef} position={[x, 1.5, z]}>
      <Html center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={htmlRef} style={{
          color, fontFamily: 'Songti SC, serif',
          fontSize: '20px', fontWeight: 'bold',
          textShadow: `0 0 6px ${color}, 0 0 2px #000, 2px 2px 0 #000`,
          whiteSpace: 'nowrap',
        }}>{text}</div>
      </Html>
    </group>
  );
}

/* ─── Attack arc visual ─────────────────────────────────────────── */
function AttackArc({ from, to, kind, spawnedAt }: {
  from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number;
}) {
  const [fx, fz] = hexWorld(from.col, from.row);
  const [tx, tz] = hexWorld(to.col, to.row);
  const projRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!projRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / 0.5);
    // Arc: lerp x/z, parabolic y
    projRef.current.position.x = fx + (tx - fx) * t;
    projRef.current.position.z = fz + (tz - fz) * t;
    projRef.current.position.y = 1.0 + Math.sin(t * Math.PI) * (kind === 'ranged' ? 1.8 : 0.4);
    const mat = projRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - t;
  });
  const color = kind === 'ranged' ? '#a8c8e8' : '#ff8050';
  return (
    <mesh ref={projRef} position={[fx, 1, fz]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={1} />
    </mesh>
  );
}

/* ─── Stratagem visual effects — fire / lightning / aura / swirl / etc ── */

/** Map each StratagemId → FX kind. */
function stratagemFxKind(id: StratagemId):
  | 'fire' | 'lightning' | 'arrows' | 'aura' | 'swirl' | 'shockwave' | 'shield' | 'chain' | null {
  switch (id) {
    case 'fire-attack':      return 'fire';
    case 'lightning':        return 'lightning';
    case 'rain-of-arrows':   return 'arrows';
    case 'rally':            return 'aura';
    case 'precognition':     return 'aura';
    case 'confusion':        return 'swirl';
    case 'dragon-veil':      return 'shockwave';
    case 'defend':           return 'shield';
    case 'chain-ships':      return 'chain';
    case 'charge':           return 'shockwave';
    case 'gallop':           return 'shockwave';
    case 'supply-strike':    return 'fire';
    case 'false-retreat':    return 'swirl';
    default:                 return null;
  }
}

const FX_COLOR: Record<string, string> = {
  fire:      '#ff6020',
  lightning: '#a8d4ff',
  arrows:    '#d8c898',
  aura:      '#ffd060',
  swirl:     '#c178e8',
  shockwave: '#ff8040',
  shield:    '#ffd060',
  chain:     '#888888',
};

/** Per-FX duration in seconds. */
const FX_DURATION: Record<string, number> = {
  fire: 2.0, lightning: 0.6, arrows: 1.2, aura: 1.6,
  swirl: 1.6, shockwave: 1.0, shield: 1.6, chain: 1.2,
};

function StratagemFXNode({ coord, kind, spawnedAt }: {
  coord: HexCoord; kind: NonNullable<ReturnType<typeof stratagemFxKind>>; spawnedAt: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const color = FX_COLOR[kind];
  const dur = FX_DURATION[kind];
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / dur);
    const g = groupRef.current;
    // Per-FX animation logic
    switch (kind) {
      case 'fire': {
        // Rising particles — group climbs and shrinks
        g.position.y = t * 2.5;
        g.scale.setScalar(1 + t * 0.6);
        break;
      }
      case 'lightning': {
        // Quick descend + flash
        g.position.y = (1 - t) * 6;
        g.scale.setScalar(1 + (1 - t) * 0.4);
        break;
      }
      case 'arrows': {
        // Falling group
        g.position.y = (1 - t) * 5;
        break;
      }
      case 'aura': {
        // Slow rise + rotation
        g.rotation.y = t * Math.PI * 2;
        g.position.y = t * 0.8;
        break;
      }
      case 'swirl': {
        g.rotation.y = t * Math.PI * 4;
        g.position.y = 0.8 + Math.sin(t * Math.PI * 3) * 0.2;
        break;
      }
      case 'shockwave': {
        g.scale.setScalar(0.3 + t * 4);
        break;
      }
      case 'shield': {
        g.rotation.y = t * Math.PI;
        g.position.y = 0.5 + Math.sin(t * Math.PI * 2) * 0.1;
        break;
      }
      case 'chain': {
        g.rotation.y = t * Math.PI;
        break;
      }
    }
    // Fade out
    const fade = 1 - t;
    g.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m && 'opacity' in m) m.opacity = fade;
    });
  });

  // Geometry per kind
  const visuals = (() => {
    switch (kind) {
      case 'fire':
        return Array.from({ length: 12 }).map((_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          const r = 0.4 + (i % 3) * 0.2;
          return (
            <mesh key={i} position={[Math.cos(ang) * r, i * 0.15, Math.sin(ang) * r]}>
              <sphereGeometry args={[0.15 + (i % 3) * 0.03, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
          );
        });
      case 'lightning':
        return (
          <>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.04, 0.08, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.8, 16]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'arrows':
        return Array.from({ length: 8 }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          const r = 0.6;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * r, i * 0.3, Math.sin(ang) * r]}
              rotation={[Math.PI / 3, 0, 0]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
          );
        });
      case 'aura':
        return (
          <>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 1.1, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 6 }).map((_, i) => {
              const ang = (i / 6) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(ang) * 0.6, 0.5, Math.sin(ang) * 0.6]}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'swirl':
        return Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          const r = 0.5 + (i % 2) * 0.2;
          return (
            <mesh key={i} position={[Math.cos(ang) * r, 0.2 + i * 0.05, Math.sin(ang) * r]}>
              <sphereGeometry args={[0.07, 5, 5]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
          );
        });
      case 'shockwave':
        return (
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.7, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
        );
      case 'shield':
        return (
          <>
            <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 1.0, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.9, 16, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.18} wireframe />
            </mesh>
          </>
        );
      case 'chain':
        return Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[i * 0.25 - 0.5, 0.5, 0]}>
            <torusGeometry args={[0.12, 0.04, 6, 12]} />
            <meshBasicMaterial color={color} transparent opacity={1} />
          </mesh>
        ));
    }
  })();

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {visuals}
    </group>
  );
}

/* ─── Formation visualizer — colored ring on the ground + zh label ──
 *  Coloring by "category" (defensive/offensive/mobile/mystic) gives a quick
 *  visual cue without needing 23 distinct shapes. */
const FORMATION_COLOR: Record<string, string> = {
  // Defensive — cyan/blue
  'fish-scale':       '#88b7e8',
  'square':           '#88b7e8',
  'stacked':          '#88b7e8',
  'crescent-moon':    '#88b7e8',
  'rattan-armor':     '#88b7e8',
  'crescent-withdraw': '#88b7e8',
  'armored-cart':     '#88b7e8',
  // Offensive — red/orange
  'arrow-tip':        '#ff7050',
  'awl':              '#ff7050',
  'wheel':            '#ff7050',
  'mandarin-duck':    '#ff7050',
  'back-to-water':    '#ff7050',
  // Mobile / encircling — gold
  'crane-wing':       '#d4a84a',
  'wild-goose':       '#d4a84a',
  'yoke':             '#d4a84a',
  'spread-out':       '#d4a84a',
  'long-snake':       '#d4a84a',
  'ten-ambush':       '#d4a84a',
  // Mystic / balanced — purple
  'eight-trigrams':   '#c19af0',
  'seven-star':       '#c19af0',
  'five-elements':    '#c19af0',
  'four-symbols':     '#c19af0',
  'trinity':          '#c19af0',
};
function FormationViz({ battle, side }: { battle: TacticalBattle; side: 'attacker' | 'defender' }) {
  const formationId = side === 'attacker' ? battle.attackerFormation : battle.defenderFormation;
  if (!formationId || formationId === 'none') return null;
  const units = battle.units.filter((u) => u.side === side);
  if (units.length === 0) return null;

  // Centroid + spread radius in 3D world coords
  let cxW = 0, czW = 0;
  for (const u of units) {
    const [x, z] = hexWorld(u.coord.col, u.coord.row);
    cxW += x;
    czW += z;
  }
  cxW /= units.length;
  czW /= units.length;
  let maxDistW = 0;
  for (const u of units) {
    const [x, z] = hexWorld(u.coord.col, u.coord.row);
    const d = Math.hypot(x - cxW, z - czW);
    if (d > maxDistW) maxDistW = d;
  }
  const rW = maxDistW + 0.8;

  const color = FORMATION_COLOR[formationId] ?? '#d4a84a';
  const labelZh = FORMATIONS_BY_ID[formationId]?.name.zh ?? formationId;
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.45 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group position={[cxW, 0.02, czW]}>
      {/* Pulsing colored ring on the ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rW - 0.05, rW, 64]} />
        <meshBasicMaterial ref={ringRef} color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      {/* Inner faint fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[rW - 0.05, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      {/* Floating label */}
      <Html position={[0, 0.4, 0]} center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff',
          fontFamily: 'Songti SC, serif',
          fontSize: '14px',
          fontWeight: 'bold',
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${color}`,
          padding: '2px 8px',
          borderRadius: 2,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 8px ${color}`,
        }}>{side === 'attacker' ? 'A' : 'D'} · {labelZh}</div>
      </Html>
    </group>
  );
}

/* ─── The whole 3D scene ────────────────────────────────────────────── */
function BattleScene({
  battle, playerSide, actionMode,
  selectedId, hovered, setHovered, onTileClick,
  attackArcs, stratagemFx, officers,
}: {
  battle: TacticalBattle;
  playerSide: 'attacker' | 'defender' | null;
  actionMode: ActionMode;
  selectedId: string | null;
  hovered: HexCoord | null;
  setHovered: (c: HexCoord | null) => void;
  onTileClick: (c: HexCoord) => void;
  attackArcs: { id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }[];
  stratagemFx: Array<{ id: number; coord: HexCoord; kind: NonNullable<ReturnType<typeof stratagemFxKind>>; spawnedAt: number }>;
  officers: Record<EntityId, Officer>;
}) {
  const { tiles, units } = battle;
  const tileByCoord = useMemo(() => {
    const m = new Map<string, TacticalTile>();
    for (const t of tiles) m.set(`${t.coord.col},${t.coord.row}`, t);
    return m;
  }, [tiles]);

  const lighting = LIGHTING[battle.timeOfDay];
  const fogMul = WEATHER_FOG_MUL[battle.weather];
  const fogFar = lighting.fog[2] * fogMul;
  const fogNear = lighting.fog[1] * fogMul;

  // Wind strength for tree sway (higher in wind/rain weather)
  const windStrength = battle.weather === 'wind' ? 2.2
    : battle.weather === 'rain' ? 1.3
    : 0.5;

  // Compute scene bounds for weather particles
  const bounds = useMemo(() => {
    const [maxX] = hexWorld(battle.width, 0);
    const [, maxZ] = hexWorld(0, battle.height);
    return { x: maxX, z: maxZ };
  }, [battle.width, battle.height]);

  // Banner color for player side
  const bannerColor = playerSide === 'defender' ? '#3a7dd9' : '#b8442e';

  // Highlight set: which hexes glow green (move) or red (attack)?
  const selectedUnit = selectedId ? battle.units.find((u) => u.id === selectedId) : null;
  const highlights = useMemo(() => {
    const m = new Map<string, 'move' | 'attack'>();
    if (!selectedUnit || !playerSide || selectedUnit.side !== playerSide) return m;
    if (actionMode.kind === 'move') {
      for (const t of tiles) {
        if (canMove(battle, selectedUnit, t.coord)) {
          m.set(`${t.coord.col},${t.coord.row}`, 'move');
        }
      }
    } else if (actionMode.kind === 'attack') {
      for (const u of units) {
        if (u.side !== playerSide && canAttack(battle, selectedUnit, u)) {
          m.set(`${u.coord.col},${u.coord.row}`, 'attack');
        }
      }
    }
    return m;
  }, [battle, selectedUnit, playerSide, actionMode, tiles, units]);

  return (
    <>
      <fog attach="fog" args={[lighting.fog[0], fogNear, fogFar]} />
      {lighting.showStars && <Stars radius={80} depth={50} count={2500} factor={3} fade speed={0.5} />}

      {/* Lighting per time-of-day */}
      <ambientLight intensity={lighting.ambient} />
      <directionalLight
        position={lighting.sun.position}
        intensity={lighting.sun.intensity}
        color={lighting.sun.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight
        position={[-lighting.sun.position[0], 6, -lighting.sun.position[2]]}
        intensity={lighting.fill.intensity}
        color={lighting.fill.color}
      />
      <hemisphereLight args={[lighting.sky[0], '#3a2818', 0.3]} />

      {/* Ground plane for shadow catching beyond hexes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1408" />
      </mesh>

      {/* Weather particles */}
      {battle.weather === 'rain' && <RainParticles bounds={bounds} />}
      {battle.weather === 'snow' && <SnowParticles bounds={bounds} />}

      {/* All tiles */}
      {tiles.map((t) => {
        const key = `${t.coord.col},${t.coord.row}`;
        const isHov = !!hovered && hovered.col === t.coord.col && hovered.row === t.coord.row;
        return (
          <group
            key={key}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(t.coord); }}
            onPointerOut={() => setHovered(null)}
          >
            <HexTile
              tile={t}
              onClick={() => onTileClick(t.coord)}
              hovered={isHov}
              highlight={highlights.get(key)}
              windStrength={windStrength}
            />
          </group>
        );
      })}

      {/* City walls — rightmost column hexes that don't have a defense structure */}
      {(() => {
        const wallCol = battle.width - 1;
        const structureCoords = new Set(
          (battle.cityStructures ?? []).map((s) => `${s.coord.col},${s.coord.row}`),
        );
        const unitCoords = new Set(units.map((u) => `${u.coord.col},${u.coord.row}`));
        return tiles
          .filter((t) =>
            t.coord.col === wallCol &&
            !structureCoords.has(`${t.coord.col},${t.coord.row}`) &&
            !unitCoords.has(`${t.coord.col},${t.coord.row}`),
          )
          .map((t) => (
            <CityWall
              key={`wall-${t.coord.col},${t.coord.row}`}
              coord={t.coord}
              bannerColor={playerSide === 'defender' ? bannerColor : '#3a7dd9'}
            />
          ));
      })()}

      {/* Defense structures */}
      {(battle.cityStructures ?? []).map((s) => (
        <DefenseStructure
          key={`struct-${s.slotIndex}`}
          coord={s.coord}
          buildingId={s.buildingId}
          level={s.level}
          hp={s.hp}
          maxHp={s.level * 200}
        />
      ))}

      {/* Formation visualizers — colored ring on the ground + label */}
      <FormationViz battle={battle} side="attacker" />
      <FormationViz battle={battle} side="defender" />

      {/* All units — skip hidden enemy units. */}
      {units
        .filter((u) => !(u.hidden && u.side !== playerSide))
        .map((u) => {
        const tile = tileByCoord.get(`${u.coord.col},${u.coord.row}`);
        const h = tile ? TERRAIN_HEIGHT[tile.terrain] : 0.1;
        const isPlayer = playerSide ? u.side === playerSide : u.side === 'attacker';
        const isWounded = officers[u.officerId]?.status === 'wounded';
        return (
          <UnitMesh
            key={u.id}
            unit={u}
            terrainH={h}
            isPlayer={isPlayer}
            selected={selectedId === u.id}
            onClick={() => onTileClick(u.coord)}
            isWounded={isWounded}
          />
        );
      })}

      {/* Damage popups floating up from hexes */}
      {(battle.damagePopups ?? []).map((p) => (
        <DamagePopup3D
          key={p.id}
          coord={p.coord}
          text={p.text}
          color={p.color}
          spawnedAt={p.spawnedAt}
        />
      ))}

      {/* Attack arcs (arrows/projectiles flying) */}
      {attackArcs.map((a) => (
        <AttackArc
          key={a.id}
          from={a.from} to={a.to} kind={a.kind} spawnedAt={a.spawnedAt}
        />
      ))}
      {/* Stratagem FX particles */}
      {stratagemFx.map((f) => (
        <StratagemFXNode
          key={f.id}
          coord={f.coord}
          kind={f.kind}
          spawnedAt={f.spawnedAt}
        />
      ))}
    </>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function TacticalBattleScreen3D({ onClose }: { onClose: () => void }) {
  const battle = useGameStore((s) => s.tacticalBattle);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const start = useGameStore((s) => s.startTacticalBattle);
  const applyResolution = useGameStore((s) => s.applyTacticalResolution);
  const battleSpeed = useGameStore((s) => s.battleSpeed);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HexCoord | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ kind: 'none' });

  // Keyboard shortcuts: mirror the 2D screen.
  // 1=move, 2=attack, 3=duel, Esc=cancel, Space=end turn, Tab=cycle.
  useEffect(() => {
    if (!battle) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const playerSideNow = battle.attackerForceId === useGameStore.getState().playerForceId
        ? 'attacker'
        : battle.defenderForceId === useGameStore.getState().playerForceId
          ? 'defender'
          : null;
      if (!playerSideNow || battle.activeSide !== playerSideNow || battle.winner) return;
      if (e.key === 'Escape') { setActionMode({ kind: 'none' }); return; }
      if (e.key === ' ') {
        e.preventDefault();
        start(endTurn(battle));
        setSelectedId(null);
        setActionMode({ kind: 'none' });
        return;
      }
      if (!selectedId) return;
      if (e.key === '1') setActionMode({ kind: actionMode.kind === 'move' ? 'none' : 'move' });
      else if (e.key === '2') setActionMode({ kind: actionMode.kind === 'attack' ? 'none' : 'attack' });
      else if (e.key === '3') setActionMode({ kind: actionMode.kind === 'duel' ? 'none' : 'duel' });
      else if (e.key === 'Tab') {
        e.preventDefault();
        const myUnits = battle.units.filter((u) => u.side === playerSideNow && u.ap > 0);
        if (myUnits.length === 0) return;
        const idx = myUnits.findIndex((u) => u.id === selectedId);
        const next = myUnits[(idx + 1) % myUnits.length];
        setSelectedId(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [battle, selectedId, actionMode, start]);

  const [attackArcs, setAttackArcs] = useState<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [voiceLine, setVoiceLine] = useState<{ text: string; key: number } | null>(null);
  // N7 — signature-tactic banner overlay state
  const [signatureBanner, setSignatureBanner] = useState<{ zh: string; en: string; key: number } | null>(null);
  // Stratagem FX particles
  const [stratagemFx, setStratagemFx] = useState<Array<{
    id: number;
    coord: HexCoord;
    kind: NonNullable<ReturnType<typeof stratagemFxKind>>;
    spawnedAt: number;
  }>>([]);
  const t = useT();
  const lang = useLanguage();

  const playerSide: 'attacker' | 'defender' | null = useMemo(() => {
    if (!battle) return null;
    if (battle.attackerForceId === playerForceId) return 'attacker';
    if (battle.defenderForceId === playerForceId) return 'defender';
    return null;
  }, [battle, playerForceId]);

  // AI takes its turn after a short delay when it's not the player's side.
  useEffect(() => {
    if (!battle || battle.winner) return;
    if (playerSide && battle.activeSide !== playerSide) {
      const delay = Math.max(150, 700 / Math.max(1, battleSpeed));
      const id = setTimeout(() => {
        const result = aiTakeTurn(battle, officers, Math.random);
        const next = result.battle;
        // For each AI signature usage, spawn FX + banner + flavor log entry.
        const fxToAdd: Array<{ id: number; coord: HexCoord; kind: NonNullable<ReturnType<typeof stratagemFxKind>>; spawnedAt: number }> = [];
        let fxCounter = Date.now();
        let bannerToShow: { zh: string; en: string } | null = null;
        let battleAfterLogs = next;
        for (const sig of result.signatures) {
          const fxKind = stratagemFxKind(sig.stratagemId);
          if (fxKind) {
            fxToAdd.push({
              id: fxCounter++,
              coord: sig.coord,
              kind: fxKind,
              spawnedAt: Date.now(),
            });
          }
          // Signature flavor for AI famous-tactic usage
          const flavor = SIGNATURE_FLAVOR[sig.tacticId];
          if (flavor) {
            battleAfterLogs = {
              ...battleAfterLogs,
              log: [
                ...(battleAfterLogs.log ?? []),
                { turn: battleAfterLogs.turn, text: flavor.en, kind: 'event' as const },
              ],
            };
            // Only show one banner per turn (the last one) so they don't queue up forever
            bannerToShow = { zh: flavor.zh, en: flavor.en };
          }
        }
        if (fxToAdd.length > 0) {
          setStratagemFx((arr) => [...arr, ...fxToAdd]);
          for (const f of fxToAdd) {
            const life = (FX_DURATION[f.kind] ?? 1.5) * 1000 + 200;
            setTimeout(() => setStratagemFx((arr) => arr.filter((x) => x.id !== f.id)), life);
          }
        }
        if (bannerToShow) {
          setSignatureBanner({ zh: bannerToShow.zh, en: bannerToShow.en, key: Date.now() });
          setTimeout(() => setSignatureBanner(null), 2400);
        }
        start(battleAfterLogs);
      }, delay);
      return () => clearTimeout(id);
    }
  }, [battle, officers, playerSide, start, battleSpeed]);

  // Show results modal when a winner is decided.
  useEffect(() => {
    if (battle?.winner && !showResults) {
      const id = setTimeout(() => setShowResults(true), 800);
      return () => clearTimeout(id);
    }
  }, [battle?.winner, showResults]);

  // Pop voice lines from the battle log to the ticker.
  useEffect(() => {
    if (!battle?.log || battle.log.length === 0) return;
    const last = battle.log[battle.log.length - 1];
    if (last.kind === 'voice' || last.kind === 'arrival') {
      setVoiceLine({ text: last.text, key: Date.now() });
    }
  }, [battle?.log?.length]);

  // Center camera on battlefield midpoint.
  const target = useMemo<[number, number, number]>(() => {
    if (!battle) return [0, 0, 0];
    const [cx, cz] = hexWorld(battle.width / 2, battle.height / 2);
    return [cx, 0, cz];
  }, [battle]);

  if (!battle) return null;

  const selectedUnit = selectedId ? battle.units.find((u) => u.id === selectedId) : null;
  const lighting = LIGHTING[battle.timeOfDay];
  const myTurn = playerSide && battle.activeSide === playerSide && !battle.winner;

  const onTileClick = (c: HexCoord) => {
    if (!myTurn) return;
    const u = unitAt(battle, c);
    // Click own unit → select & enter move mode UNLESS we're aiming a
    // stratagem (then a friendly click is the target of a buff like rally).
    if (u && u.side === playerSide && actionMode.kind !== 'stratagem') {
      setSelectedId(u.id);
      setActionMode({ kind: 'move' });
      return;
    }
    if (!selectedUnit) return;
    if (actionMode.kind === 'move' && canMove(battle, selectedUnit, c)) {
      start(moveUnit(battle, selectedUnit.id, c));
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'attack' && u && u.side !== playerSide && canAttack(battle, selectedUnit, u)) {
      const kind: 'melee' | 'ranged' = selectedUnit.unitType === 'archers' || selectedUnit.unitType === 'siege' ? 'ranged' : 'melee';
      const aid = Date.now();
      setAttackArcs((a) => [...a, { id: aid, from: selectedUnit.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setAttackArcs((a) => a.filter((x) => x.id !== aid)), 600);
      start(attackUnits(battle, selectedUnit.id, u.id, officers, Math.random));
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'duel' && u && u.side !== playerSide) {
      if (hexDistance(selectedUnit.coord, u.coord) !== 1) {
        alert('Must be adjacent for a duel.');
        return;
      }
      const me = officers[selectedUnit.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      if (!meCheck.ok) { alert(`Your officer cannot duel: ${meCheck.reason}`); return; }
      if (!foeCheck.ok) { alert(`Enemy cannot duel: ${foeCheck.reason}`); return; }
      const result = resolveDuel({ attacker: me, defender: foe });
      let next: TacticalBattle = { ...battle, units: battle.units.map((unit) => unit.id === selectedUnit.id ? { ...unit, ap: 0 } : unit) };
      if (result.killedId) {
        next = { ...next, units: next.units.filter((unit) => unit.officerId !== result.killedId) };
      }
      next = {
        ...next,
        log: [
          ...(next.log ?? []),
          {
            turn: next.turn,
            text: result.winner === 'draw'
              ? `${me.name.en} and ${foe.name.en} fight to a draw — both wounded.`
              : `${result.winner === 'attacker' ? me.name.en : foe.name.en} slew ${result.winner === 'attacker' ? foe.name.en : me.name.en} in single combat!`,
            kind: 'event',
          },
        ],
      };
      start(next);
      setDuelResult(result);
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'stratagem') {
      const r = applyStratagem(battle, selectedUnit.id, actionMode.id, c, officers);
      if (r.ok) {
        // Spawn FX at the target hex.
        const fxKind = stratagemFxKind(actionMode.id);
        if (fxKind) {
          const fxId = Date.now();
          // For self-targeted (defend / precognition / dragon-veil), origin = caster
          const isSelf = ['defend', 'precognition', 'dragon-veil'].includes(actionMode.id);
          const fxCoord = isSelf ? selectedUnit.coord : c;
          setStratagemFx((arr) => [...arr, { id: fxId, coord: fxCoord, kind: fxKind, spawnedAt: fxId }]);
          const lifeMs = (FX_DURATION[fxKind] ?? 1.5) * 1000 + 200;
          setTimeout(() => setStratagemFx((arr) => arr.filter((f) => f.id !== fxId)), lifeMs);
        }
        // N6 — append a signature flavor line to the battle log if the
        // tactic invoked has a famous historical moment associated.
        const tactId = actionMode.tacticId;
        const flavor = tactId ? SIGNATURE_FLAVOR[tactId] : undefined;
        let next = r.battle;
        if (flavor) {
          next = {
            ...next,
            log: [
              ...(next.log ?? []),
              { turn: next.turn, text: flavor.en, kind: 'event' as const },
            ],
          };
          // N7 — show a transient on-screen banner for signature tactics
          setSignatureBanner({ zh: flavor.zh, en: flavor.en, key: Date.now() });
          setTimeout(() => setSignatureBanner(null), 2400);
        }
        start(next);
        setActionMode({ kind: 'none' });
      } else if (r.reason) {
        alert(r.reason);
      }
      return;
    }
  };

  const onEndTurn = () => {
    if (!myTurn) return;
    start(endTurn(battle));
    setSelectedId(null);
    setActionMode({ kind: 'none' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: `linear-gradient(180deg, ${lighting.sky[0]} 0%, ${lighting.sky[1]} 100%)`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '0.6rem 1rem',
        background: 'rgba(20, 14, 8, 0.85)',
        borderBottom: '1px solid #5a4530',
        color: '#f0e0b0',
        fontFamily: 'Songti SC, serif',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <strong>{t('戰術戰鬥', 'Tactical Battle')} · 3D</strong>
        <span style={{ fontSize: '0.85rem', color: '#d4a84a' }}>
          {t('第', 'Turn')} {battle.turn} {t('回', '')} · {myTurn ? <span style={{ color: '#7ed68a' }}>{t('我方回合', 'YOUR TURN')}</span> : <span style={{ color: '#ff7050' }}>{t('敵方回合', 'ENEMY TURN')}</span>}
        </span>
        <span style={{
          fontSize: '0.72rem', padding: '2px 7px',
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid #5a4530', color: '#a89070',
        }}>{WEATHER_LABEL[battle.weather]}</span>
        <span style={{
          fontSize: '0.72rem', padding: '2px 7px',
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid #5a4530', color: '#a89070',
        }}>{TOD_LABEL[battle.timeOfDay]}</span>
        {battle.attackerFormation && battle.attackerFormation !== 'none' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(60, 26, 22, 0.7)', border: '1px solid #b8442e', color: '#ff9078',
          }}>A: {FORMATIONS_BY_ID[battle.attackerFormation]?.name.zh ?? battle.attackerFormation}</span>
        )}
        {battle.defenderFormation && battle.defenderFormation !== 'none' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(26, 40, 60, 0.7)', border: '1px solid #3a7dd9', color: '#88b7e8',
          }}>D: {FORMATIONS_BY_ID[battle.defenderFormation]?.name.zh ?? battle.defenderFormation}</span>
        )}
        <button
          onClick={onEndTurn}
          disabled={!myTurn}
          style={{
            background: '#5a4530', color: '#f0e0b0', border: '1px solid #d4a84a',
            padding: '0.3rem 0.7rem', cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
            opacity: !myTurn ? 0.4 : 1,
          }}
        >{t('結束回合', 'End Turn')}</button>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: '#3a2818', color: '#f0e0b0', border: '1px solid #d4a84a',
            padding: '0.3rem 0.8rem', cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
          }}
          title={t('切換 2D 視圖', 'Switch to 2D view')}
        >{t('切換 2D', 'Switch 2D')} ⇄</button>
      </div>

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          shadows
          camera={{ position: [target[0] - 8, 14, target[2] + 12], fov: 45 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <BattleScene
              battle={battle}
              playerSide={playerSide}
              actionMode={actionMode}
              selectedId={selectedId}
              hovered={hovered}
              setHovered={setHovered}
              onTileClick={onTileClick}
              attackArcs={attackArcs}
              stratagemFx={stratagemFx}
              officers={officers}
            />
            <OrbitControls
              target={target}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={6}
              maxDistance={40}
              enableDamping
              dampingFactor={0.1}
            />
          </Suspense>
        </Canvas>

        {/* Selected unit side panel — full action menu */}
        {selectedUnit && playerSide && selectedUnit.side === playerSide && (
          <UnitPanel3D
            unit={selectedUnit}
            officer={officers[selectedUnit.officerId] ?? null}
            battle={battle}
            actionMode={actionMode}
            setActionMode={setActionMode}
            canAct={!!myTurn}
          />
        )}
        {/* Read-only info for enemy units */}
        {selectedUnit && (!playerSide || selectedUnit.side !== playerSide) && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            background: 'rgba(20, 14, 8, 0.92)',
            border: '1px solid #b8442e',
            padding: '0.6rem 0.9rem',
            color: '#f0e0b0',
            fontFamily: 'Songti SC, serif',
            minWidth: 200,
            boxShadow: '0 0 16px rgba(184, 68, 46, 0.4)',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
              {officers[selectedUnit.officerId]?.name.zh ?? '?'} ({UNIT_GLYPH[selectedUnit.unitType]})
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a89070' }}>
              {t('敵', 'ENEMY')} · {t(officers[selectedUnit.officerId]?.name.zh ?? '', officers[selectedUnit.officerId]?.name.en ?? '')}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              HP {selectedUnit.troops.toLocaleString()}/{selectedUnit.maxTroops.toLocaleString()} ·
              AP {selectedUnit.ap}/{selectedUnit.maxAp} · Mor {selectedUnit.morale}
            </div>
          </div>
        )}

        {/* Battle log voice ticker */}
        {voiceLine && (
          <div
            key={voiceLine.key}
            style={{
              position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20, 14, 8, 0.92)',
              border: '1px solid #d4a84a',
              padding: '0.45rem 1.2rem',
              color: '#f0e0b0',
              fontFamily: 'Songti SC, serif',
              fontSize: '0.95rem',
              pointerEvents: 'none',
              animation: 'tkmVoiceFade 3.6s ease-out forwards',
              maxWidth: '60%', textAlign: 'center',
              boxShadow: '0 0 12px rgba(212, 168, 74, 0.5)',
            }}
          >
            「{voiceLine.text}」
          </div>
        )}

        {/* N7 — Signature tactic banner overlay */}
        {signatureBanner && (
          <div
            key={signatureBanner.key}
            style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'tkmSignatureBanner 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              textAlign: 'center',
              zIndex: 50,
            }}
          >
            <div style={{
              fontFamily: 'Songti SC, serif',
              fontSize: '3.4rem',
              color: '#ffd47a',
              letterSpacing: '0.5rem',
              textShadow: '0 0 22px #d4a84a, 0 0 44px rgba(212,168,74,0.6), 0 4px 0 #2a1f15',
              fontWeight: 700,
              filter: 'drop-shadow(0 0 10px rgba(212,168,74,0.8))',
            }}>
              {lang === 'en' ? signatureBanner.en : signatureBanner.zh}
            </div>
            <div style={{
              marginTop: '0.4rem',
              fontFamily: 'Songti SC, serif',
              fontSize: '0.9rem',
              color: '#e8c878',
              letterSpacing: '0.2rem',
              opacity: 0.7,
            }}>
              {lang === 'zh' ? '★ 簽名戰法 ★' : '★ Signature Stratagem ★'}
            </div>
          </div>
        )}

        {/* Hover hex indicator */}
        {hovered && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(20, 14, 8, 0.85)',
            border: '1px solid #5a4530',
            padding: '0.3rem 0.6rem',
            color: '#d4a84a',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.78rem',
          }}>
            ({hovered.col}, {hovered.row})
          </div>
        )}

        {/* Action mode hint */}
        {actionMode.kind !== 'none' && myTurn && (() => {
          const config = {
            move: { color: '#7ed68a', text: t('點擊綠色格子移動', 'Click a green tile to move') },
            attack: { color: '#ff7050', text: t('點擊紅色敵軍攻擊', 'Click a red enemy to attack') },
            duel: { color: '#d4a84a', text: t('點擊相鄰敵將一騎打', 'Click an adjacent enemy to duel') },
            stratagem: { color: '#c19a3b', text: t('點擊目標施放計略', 'Click a target to cast stratagem') },
          }[actionMode.kind];
          return (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20, 14, 8, 0.92)',
              border: `1px solid ${config.color}`,
              padding: '0.4rem 0.9rem',
              color: config.color,
              fontFamily: 'Songti SC, serif',
              fontSize: '0.9rem',
              pointerEvents: 'none',
            }}>{config.text}</div>
          );
        })()}
      </div>

      {showResults && battle.winner && (
        <BattleResultsModal
          battle={battle}
          playerSide={playerSide}
          onClose={() => {
            const resolution = resolveBattleEnd(battle, officers);
            applyResolution(
              resolution.capturedOfficerIds,
              [...resolution.attackerDead, ...resolution.defenderDead],
              resolution.lootGold,
              resolution.winner,
            );
            setShowResults(false);
            onClose();
          }}
        />
      )}
      {duelResult && (
        <DuelModal result={duelResult} onClose={() => setDuelResult(null)} />
      )}
    </div>
  );
}

/* ─── Selected unit side panel — actions, stratagems, duel, etc. ─── */
function UnitPanel3D({
  unit, officer, battle, actionMode, setActionMode, canAct,
}: {
  unit: TacticalUnit;
  officer: Officer | null;
  battle: TacticalBattle;
  actionMode: ActionMode;
  setActionMode: (m: ActionMode) => void;
  canAct: boolean;
}) {
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();
  const personalTactics = personalTacticsForUnit(officer, unit);
  const availableStratagems = STRATAGEMS.filter((s) => {
    if (!officer) return false;
    if (s.signatureOf && !s.signatureOf.includes(officer.id)) return false;
    if (s.minIntelligence && officer.stats.intelligence < s.minIntelligence) return false;
    if (s.minWar && officer.stats.war < s.minWar) return false;
    if (s.requiresUnitType && !s.requiresUnitType.includes(unit.unitType)) return false;
    return true;
  });

  const apDisabled = !canAct || unit.ap === 0;
  const btnBase: React.CSSProperties = {
    display: 'block', width: '100%',
    padding: '0.4rem 0.6rem', marginBottom: '0.25rem',
    background: 'rgba(40, 28, 18, 0.7)',
    border: '1px solid #5a4530',
    color: '#f0e0b0',
    fontFamily: 'Songti SC, serif',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textAlign: 'left',
  };
  const btnActive: React.CSSProperties = {
    background: 'rgba(212, 168, 74, 0.25)',
    borderColor: '#d4a84a',
    color: '#f0e0b0',
  };

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, bottom: 16,
      width: 280,
      background: 'rgba(20, 14, 8, 0.94)',
      border: '1px solid #d4a84a',
      padding: '0.7rem 0.8rem',
      color: '#f0e0b0',
      fontFamily: 'Songti SC, serif',
      boxShadow: '0 0 16px rgba(212, 168, 74, 0.4)',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: '0.62rem', color: '#8a7050', letterSpacing: '0.15rem' }}>{t('已選', 'SELECTED')}</div>
      <div style={{ fontWeight: 'bold', fontSize: '1.15rem', marginTop: 2 }}>
        {officer?.name.zh ?? '?'}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#a89070' }}>{officer?.name.en ?? ''}</div>
      {officer && (
        <div style={{ fontSize: '0.66rem', color: '#8a7050', marginTop: 4, letterSpacing: '0.08rem' }}>
          LED {officer.stats.leadership} · WAR {officer.stats.war} · INT {officer.stats.intelligence}
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem',
        fontSize: '0.72rem', marginTop: '0.5rem',
      }}>
        <span>HP <strong>{unit.troops.toLocaleString()}</strong>/{unit.maxTroops.toLocaleString()}</span>
        <span>AP <strong style={{ color: unit.ap === 0 ? '#b8442e' : '#7ed68a' }}>{unit.ap}</strong>/{unit.maxAp}</span>
        <span>Morale {unit.morale}</span>
        <span>{UNIT_TYPE_LABEL[unit.unitType]}</span>
      </div>
      {unit.effects.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          {unit.effects.map((e, i) => (
            <span key={i} style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              border: `1px solid ${
                e.kind === 'burning' ? '#ff7050'
                : e.kind === 'confused' ? '#c19a3b'
                : '#88b7e8'
              }`,
              color: e.kind === 'burning' ? '#ff7050'
                : e.kind === 'confused' ? '#c19a3b'
                : '#88b7e8',
              borderRadius: 2,
            }}>{e.kind} {e.turnsLeft}t</span>
          ))}
        </div>
      )}

      <div style={{ marginTop: '0.7rem', borderTop: '1px solid #3a2818', paddingTop: '0.5rem' }}>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'move' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'move' ? { kind: 'none' } : { kind: 'move' })}
        >{t('移動', 'Move')} <span style={{ float: 'right', color: '#8a7050' }}>1 AP/{t('格', 'hex')}</span></button>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'attack' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'attack' ? { kind: 'none' } : { kind: 'attack' })}
        >{t('攻擊', 'Attack')} <span style={{ float: 'right', color: '#8a7050' }}>1 AP</span></button>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'duel' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'duel' ? { kind: 'none' } : { kind: 'duel' })}
        >{t('一騎打', 'Duel')} <span style={{ float: 'right', color: '#d4a84a' }}>{t('生死', 'kill')}</span></button>
      </div>

      {availableStratagems.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px dotted #3a2818', paddingTop: '0.4rem' }}>
          <div style={{ fontSize: '0.62rem', color: '#d4a84a', letterSpacing: '0.15rem', marginBottom: '0.3rem' }}>{t('計略', 'STRATAGEMS')}</div>
          {availableStratagems.map((s) => {
            const cdKey = `${unit.id}-${s.id}`;
            const cd = (battle.stratagemCooldowns[cdKey] ?? 0) - battle.turn;
            const onCd = cd > 0;
            const active = actionMode.kind === 'stratagem' && actionMode.id === s.id;
            const isSig = !!s.signatureOf;
            const targetType = stratagemTargetType(s.id);
            const badge = targetTypeBadge(targetType, lang !== 'en');
            const targetHint = targetType === 'ally' ? t('點擊我方單位', 'Click a friendly unit')
              : targetType === 'self' ? t('施放於自身', 'Cast on self')
              : targetType === 'enemy' ? t('點擊敵方單位', 'Click an enemy unit')
              : t('範圍效果', 'Area effect');
            return (
              <button
                key={s.id}
                style={{
                  ...btnBase,
                  ...(active ? btnActive : {}),
                  ...(isSig ? { borderColor: '#d4a84a' } : {}),
                  opacity: apDisabled || onCd ? 0.4 : 1,
                }}
                disabled={apDisabled || onCd}
                title={`${desc(s)}\n\n${t('目標', 'Target')}: ${targetHint}\n${t('範圍', 'Range')}: ${s.range}${onCd ? `\n${t('冷卻', 'CD')}: ${cd}t` : ''}`}
                onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: s.id })}
              >
                {isSig && <span style={{ color: '#d4a84a' }}>★ </span>}
                <span style={{ color: badge.color, fontSize: '0.6rem', marginRight: 3 }}>[{badge.label}]</span>
                {s.name.zh}
                <span style={{ float: 'right', color: '#8a7050', fontSize: '0.66rem' }}>
                  {onCd ? `CD ${cd}t` : `r${s.range}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {personalTactics.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px dotted #3a2818', paddingTop: '0.4rem' }}>
          <div style={{ fontSize: '0.62rem', color: '#d4a84a', letterSpacing: '0.15rem', marginBottom: '0.3rem' }}>★ {t('個人戰法', 'PERSONAL')}</div>
          {personalTactics.map((pt) => {
            const cdKey = `${unit.id}-${pt.underlying}`;
            const cd = (battle.stratagemCooldowns[cdKey] ?? 0) - battle.turn;
            const onCd = cd > 0;
            const active = actionMode.kind === 'stratagem' && actionMode.id === pt.underlying;
            const targetType = stratagemTargetType(pt.underlying);
            const badge = targetTypeBadge(targetType, lang !== 'en');
            const targetHint = targetType === 'ally' ? t('點擊我方單位', 'Click a friendly unit')
              : targetType === 'self' ? t('施放於自身', 'Cast on self')
              : targetType === 'enemy' ? t('點擊敵方單位', 'Click an enemy unit')
              : t('範圍效果', 'Area effect');
            return (
              <button
                key={pt.id}
                style={{
                  ...btnBase,
                  ...(active ? btnActive : {}),
                  ...(pt.isSignature ? { borderColor: '#d4a84a' } : { borderColor: '#5a4530' }),
                  opacity: apDisabled || onCd ? 0.4 : 1,
                }}
                disabled={apDisabled || onCd}
                title={`${pt.description}\n\n${t('目標', 'Target')}: ${targetHint}\n${t('範圍', 'Range')}: ${pt.range}${onCd ? `\n${t('冷卻', 'CD')}: ${cd}t` : ''}`}
                onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: pt.underlying, tacticId: pt.tacticId })}
              >
                {pt.isSignature && <span style={{ color: '#d4a84a' }}>★ </span>}
                <span style={{ color: badge.color, fontSize: '0.6rem', marginRight: 3 }}>[{badge.label}]</span>
                {pt.nameZh}
                <span style={{ float: 'right', color: '#8a7050', fontSize: '0.66rem' }}>
                  {onCd ? `CD ${cd}t` : `r${pt.range}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
