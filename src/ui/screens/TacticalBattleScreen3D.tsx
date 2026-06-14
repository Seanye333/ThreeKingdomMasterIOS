import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import { playSfx, playFxSfx, startBattleAmbience, stopBattleAmbience } from '../../game/systems/sound';
import type { EntityId, HexCoord, Officer, StratagemId, TacticalBattle, TacticalTile, TacticalUnit, TerrainKind, TimeOfDay, UnitType, Weather } from '../../game/types';
import type { DefenseBuildingId } from '../../game/data/defenseBuildings';
import { stratagemFxKind, tacticFxKind, tacticFxSpec, FX_DURATION, FX_IMPACT, type TacticFxSpec, type StratagemFxInstance, type StratagemFxKind } from '../../game/data/stratagemFx';
import { categoryOfTactic } from '../../game/data/officerAttributes';
import { applyBattlePrep,
  aiTakeTurn, aiSkillForDifficulty, applyStratagem, attackUnits, canAttack, canMove, endTurn, hexDistance,
  moveUnit, resolveBattleEnd, unitAt, forecastAttack, matchupLabel, battleStratagemSituation,
} from '../../game/systems/tactical';
import { canDuel } from '../../game/systems/duel';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { FORMATIONS_BY_ID, STRATAGEMS } from '../../game/data';
import { BattleResultsModal } from '../components/BattleResultsModal';
import { IntroDive } from '../components/IntroDive';
import { DuelGameModal } from '../components/DuelGameModal';
import { useT, useDesc, useLanguage } from '../i18n';

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

type ActionMode =
  | { kind: 'none' }
  | { kind: 'move' }
  | { kind: 'attack' }
  | { kind: 'duel' }
  | { kind: 'stratagem'; id: StratagemId; tacticId?: string };

/**
 * True when BattleScene is embedded as a diorama inside another scene (the
 * strategic map). Children read it to skip scene-global attachments (fog,
 * lights, surround, weather) and DOM label overlays that don't scale.
 */
export const EmbeddedSceneCtx = createContext(false);

/** N6 — Signature-tactic flavor lines for the battle log. Keyed by tacticId.
 *  Exported for the headless AI driver (it appends the same flavor lines). */
export const SIGNATURE_FLAVOR: Record<string, { zh: string; en: string }> = {
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
  ice:       0.02,
  road:      0.04,
  plain:     0.10,
  forest:    0.14,
  mountain:  0.18,
  hill:       0.16,
  marsh:      -0.05,
  desert:     0.09,   // flat open sand
  chokepoint: 0.04,
  bridge:     0.06,
  gate:       0.20,
  wall:       0.32,
  watchtower: 0.20,
};
export const TERRAIN_COLOR: Record<TerrainKind, string> = {
  river:    '#2c5882',
  ice:      '#b8d8e8',
  road:     '#7a6038',
  plain:    '#4a5e30',
  forest:   '#2a4220',
  mountain: '#5a4838',
  hill:       '#6a5a3a',  // tawny earth
  marsh:      '#3a4838',  // boggy green
  desert:     '#c9b079',  // sand / gobi
  chokepoint: '#5a4530',  // narrow defile (darker road)
  bridge:     '#8a6840',  // timber
  gate:       '#4a2820',  // dark masonry
  wall:       '#6a5650',  // grey rampart stone
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
  tile, onClick, hovered, highlight, windStrength, burning = false,
}: {
  tile: TacticalTile;
  onClick: () => void;
  hovered: boolean;
  /** 'move' = walkable destination, 'attack' = attackable enemy hex, undefined = no highlight */
  highlight: 'move' | 'attack' | undefined;
  windStrength: number;
  /** 火攻 — this hex is ablaze (ground fire). */
  burning?: boolean;
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
      {tile.terrain === 'bridge' && <BridgeArt y={h} />}
      {burning && <FireArt y={h} />}
    </group>
  );
}

/** 火攻 — licking flames + ember glow on a burning hex. */
export function FireArt({ y }: { y: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((m, i) => {
      const f = 1 + Math.sin(t * 7 + i * 2.1) * 0.25;
      m.scale.set(f, 1 + Math.sin(t * 9 + i) * 0.35, f);
    });
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
/* ─── 千軍萬馬 — a small block of rank-and-file behind the hero figure so a
 *  unit reads as a host, not a lone general. Count scales with troop strength;
 *  they idle-bob in formation. Skipped for navy (footmen on a boat read wrong). */
/* 千軍萬馬 — the rank-and-file host massed behind each unit's hero, rendered
 * as one instanced crowd (bodies + heads + a forest of spears) so a strong
 * stack reads as an ARMY, not a lone general. Count scales with troops; each
 * soldier idle-bobs in formation. Instanced → dozens cost almost nothing. */
const HOST_MAX = IS_MOBILE ? 16 : 48;
function UnitRetinue({ troops, color, unitType }: { troops: number; color: string; unitType?: string }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const spearRef = useRef<THREE.InstancedMesh>(null);
  const horseRef = useRef<THREE.InstancedMesh>(null);
  const mounted = unitType === 'cavalry';
  const rideLift = mounted ? 0.26 : 0;   // riders sit above their horses
  const slots = useMemo(() => {
    const count = Math.min(HOST_MAX, Math.max(6, Math.round(troops / 420)));
    const cols = Math.max(4, Math.round(Math.sqrt(count * 2.4)));   // wide & shallow so it doesn't spill far back
    const out: Array<{ x: number; z: number; ph: number; spear: boolean }> = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const h1 = Math.abs(Math.sin(i * 12.9898 + 1.3));
      const h2 = Math.abs(Math.sin(i * 78.233 + 0.7));
      const x = (c - (cols - 1) / 2) * 0.165 + (h1 - 0.5) * 0.07;
      const z = -0.5 - r * 0.17 + (h2 - 0.5) * 0.07;
      out.push({ x, z, ph: (i * 0.9) % (Math.PI * 2), spear: i % 4 !== 0 });
    }
    return out;
  }, [troops]);
  const spearCount = useMemo(() => slots.filter((s) => s.spear).length, [slots]);

  useFrame(({ clock }) => {
    if (!bodyRef.current || !headRef.current) return;
    const t = clock.elapsedTime;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const S = 0.42;
    sc.setScalar(S);
    let si = 0;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const bob = Math.abs(Math.sin(t * 4 + sl.ph)) * 0.03;
      const lift = bob + rideLift * S;
      if (horseRef.current) {
        p.set(sl.x, 0.13 * S + bob * 0.4, sl.z);
        horseRef.current.setMatrixAt(i, m.compose(p, q, sc));
      }
      p.set(sl.x, 0.18 * S + lift, sl.z);
      bodyRef.current.setMatrixAt(i, m.compose(p, q, sc));
      p.set(sl.x, 0.42 * S + lift, sl.z);
      headRef.current.setMatrixAt(i, m.compose(p, q, sc));
      if (sl.spear && spearRef.current) {
        p.set(sl.x + 0.12 * S, 0.42 * S + lift, sl.z);
        spearRef.current.setMatrixAt(si++, m.compose(p, q, sc));
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    if (spearRef.current) spearRef.current.instanceMatrix.needsUpdate = true;
    if (horseRef.current) horseRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {mounted && (
        <instancedMesh ref={horseRef} args={[undefined, undefined, slots.length]} castShadow>
          <boxGeometry args={[0.16, 0.18, 0.42]} />
          <meshStandardMaterial color="#6a4a32" roughness={0.85} />
        </instancedMesh>
      )}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, slots.length]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.34, 6]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, slots.length]} castShadow>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#e0c498" roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={spearRef} args={[undefined, undefined, Math.max(1, spearCount)]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
        <meshStandardMaterial color="#3a2818" />
      </instancedMesh>
    </group>
  );
}

function UnitMesh({
  unit, terrainH, isPlayer, selected, onClick, isWounded, lunge,
}: {
  unit: TacticalUnit;
  terrainH: number;
  isPlayer: boolean;
  selected: boolean;
  onClick: () => void;
  isWounded?: boolean;
  /** 突刺 — when this unit just struck a melee blow, thrust toward the target. */
  lunge?: { to: HexCoord; at: number } | null;
}) {
  const [tx, tz] = hexWorld(unit.coord.col, unit.coord.row);
  const color = isPlayer ? '#3a7dd9' : '#b8442e';
  const embedded = useContext(EmbeddedSceneCtx);
  // Animated position — lerps to target hex when unit moves
  const groupRef = useRef<THREE.Group>(null);
  const prevTarget = useRef<{ x: number; z: number }>({ x: tx, z: tz });
  // 受擊反應 — when this unit's troops drop, it flinches and flashes red so
  // every blow visibly LANDS (not just a number popping).
  const prevTroops = useRef(unit.troops);
  const hitAt = useRef(-1);
  const deathAt = useRef(-1);
  const flashRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustRef = useRef<THREE.Group>(null);
  const lastMoveAt = useRef(-10);
  const HIT_DUR = 0.34;
  const DEATH_DUR = 0.85;
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const tgt = g.position;
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
    // 行軍揚塵 — kick up dust while on the move; it lingers ~0.4s after halting.
    if (moving) lastMoveAt.current = clock.elapsedTime;
    if (dustRef.current && unit.unitType !== 'navy') {
      const dustAmt = Math.max(0, 1 - (clock.elapsedTime - lastMoveAt.current) / 0.4);
      let i = 0;
      dustRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const m = mesh.material as THREE.MeshBasicMaterial | undefined;
        if (m && 'opacity' in m) {
          const churn = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 9 + i * 1.7);
          m.opacity = dustAmt * 0.4 * churn;
          mesh.position.y = 0.04 + ((clock.elapsedTime * 0.6 + i * 0.3) % 0.25);
          i++;
        }
      });
    }
    // Detect a troop loss since last frame → trigger the hit reaction.
    if (unit.troops < prevTroops.current) hitAt.current = clock.elapsedTime;
    prevTroops.current = unit.troops;
    const hitT = hitAt.current >= 0
      ? Math.max(0, 1 - (clock.elapsedTime - hitAt.current) / HIT_DUR)
      : 0;
    // Flinch: a quick recoil wobble + scale punch, then settle.
    g.rotation.z = hitT > 0 ? Math.sin((clock.elapsedTime - hitAt.current) * 70) * hitT * 0.16 : 0;
    const s = 1 + hitT * 0.10;
    g.scale.set(s, s, s);
    if (flashRef.current) flashRef.current.opacity = hitT * 0.55;
    // 士氣低落 — a unit near breaking sways nervously, so you can SEE which
    // line is about to rout (and which enemy to push).
    if (unit.troops > 0 && hitT === 0 && unit.morale < 35) {
      const fear = (35 - unit.morale) / 35;
      g.rotation.z = Math.sin(clock.elapsedTime * 5.5 + tx * 3) * fear * 0.07;
    }
    // 突刺 — thrust toward the melee target on a strike, then recoil back.
    if (lunge && unit.troops > 0) {
      const [lx, lz] = hexWorld(lunge.to.col, lunge.to.row);
      const dx = lx - tx, dz = lz - tz;
      const len = Math.hypot(dx, dz) || 1;
      const since = (Date.now() - lunge.at) / 1000;
      const lungeT = since >= 0 && since < 0.4 ? Math.sin((since / 0.4) * Math.PI) : 0;
      tgt.x += (dx / len) * lungeT * 0.38;
      tgt.z += (dz / len) * lungeT * 0.38;
    }
    // 陣亡 — once wiped out, the husk topples, sinks and fades before it's
    // pruned, instead of blinking out of existence.
    if (unit.troops <= 0) {
      if (deathAt.current < 0) deathAt.current = clock.elapsedTime;
      const dT = Math.min(1, (clock.elapsedTime - deathAt.current) / DEATH_DUR);
      g.position.y = bobBase - dT * 0.42;
      g.rotation.x = dT * 1.05;
      g.rotation.z = 0;
      const ds = 1 - dT * 0.28;
      g.scale.set(ds, ds, ds);
      const op = 1 - dT;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as (THREE.Material & { opacity?: number; transparent?: boolean }) | undefined;
        if (m && 'opacity' in m) { m.transparent = true; m.opacity = op; }
      });
      if (flashRef.current) flashRef.current.opacity = 0;
    }
  });
  // Mount lifts the rider/driver/sailor above the ground feature
  const yLift =
    unit.unitType === 'cavalry' ? 0.30 :
    unit.unitType === 'siege'   ? 0.32 :
    unit.unitType === 'navy'    ? 0.18 :
    0;

  return (
    <group ref={groupRef} position={[tx, terrainH + 0.02, tz]}>
      {/* 受擊紅光 — flares on every troop loss (opacity driven in useFrame). */}
      <mesh position={[0, 0.55 + yLift, 0]} raycast={() => null}>
        <sphereGeometry args={[0.52, 12, 10]} />
        <meshBasicMaterial ref={flashRef} color="#ff3018" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* 行軍揚塵 — ground dust puffs, opacity driven by movement in useFrame. */}
      {unit.unitType !== 'navy' && (
        <group ref={dustRef} raycast={() => null}>
          {[[-0.22, -0.18], [0.2, -0.22], [-0.05, 0.24], [0.26, 0.1], [-0.28, 0.06]].map(([dx, dz], i) => (
            <mesh key={i} position={[dx, 0.04, dz]}>
              <sphereGeometry args={[0.1 + (i % 3) * 0.03, 6, 5]} />
              <meshBasicMaterial color={unit.unitType === 'cavalry' ? '#b6a07a' : '#a89878'} transparent opacity={0} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
      {/* Mount or vehicle (cavalry horse / siege cart / navy boat) */}
      <UnitMount unit={unit} onClick={onClick} />
      {/* Rank-and-file host behind the hero (footmen read wrong on a boat). */}
      {unit.unitType !== 'navy' && <UnitRetinue troops={unit.troops} color={color} unitType={unit.unitType} />}
      {/* Lower robe / hakama — wider at the bottom, gives armored silhouette. */}
      <mesh
        position={[0, 0.18 + yLift, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        castShadow
      >
        <cylinderGeometry args={[0.36, 0.45, 0.30, 12]} />
        <meshStandardMaterial color="#3a2818" roughness={0.85} />
      </mesh>
      {/* Belt sash — accent ring at the waist. */}
      <mesh position={[0, 0.36 + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.37, 0.37, 0.06, 12]} />
        <meshStandardMaterial color="#5a4530" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Chest armor — main body with side-faction color. */}
      <mesh
        position={[0, 0.55 + yLift, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.30, 0.36, 0.36, 12]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* Shoulder pauldrons — two small spheres for armor detail. */}
      <mesh position={[-0.28, 0.68 + yLift, 0]} castShadow>
        <sphereGeometry args={[0.10, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0.28, 0.68 + yLift, 0]} castShadow>
        <sphereGeometry args={[0.10, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.78 + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.10, 0.10, 8]} />
        <meshStandardMaterial color="#d8b894" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.90 + yLift, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#e0c498" roughness={0.7} />
      </mesh>
      {/* Helmet — cone for commanders or warriors. Skipped for low-tier units. */}
      {unit.isCommander && (
        <>
          <mesh position={[0, 1.04 + yLift, 0]} castShadow>
            <coneGeometry args={[0.17, 0.18, 8]} />
            <meshStandardMaterial color="#3a2818" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Crest plume — small vertical bar in red. */}
          <mesh position={[0, 1.18 + yLift, 0]} castShadow>
            <boxGeometry args={[0.04, 0.10, 0.02]} />
            <meshStandardMaterial color="#b8442e" roughness={0.4} />
          </mesh>
        </>
      )}
      {/* Per-unit-type weapon */}
      <UnitWeapon unit={unit} yLift={yLift} />
      {/* Banner pole + flag */}
      <mesh position={[0.28, 1.05 + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.95, 6]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.50, 1.40 + yLift, 0]} castShadow>
        <planeGeometry args={[0.42, 0.28]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Selection ring */}
      {selected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.7, 32]} />
          <meshBasicMaterial color="#d4a84a" side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* HTML overlay — unit info, always-upright crisp text. Skipped in the
          embedded diorama, and dropped the instant the unit is wiped out so a
          floating label doesn't hover over the toppling corpse. */}
      {!embedded && unit.troops > 0 && <Html
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
              background: unit.troops / unit.maxTroops > 0.5 ? '#7ed68a'
                : unit.troops / unit.maxTroops > 0.25 ? '#d4a84a' : '#b8442e',
              transition: 'width 0.4s ease, background 0.3s',
            }} />
          </div>
          {/* AP pips — filled gold = action points still left this turn. */}
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 3 }}>
            {Array.from({ length: Math.min(6, unit.maxAp) }).map((_, i) => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: i < unit.ap ? '#f0d070' : '#4a3a24',
                boxShadow: i < unit.ap ? '0 0 2px #f0d070' : 'none',
              }} />
            ))}
          </div>
        </div>
      </Html>}
    </group>
  );
}

/* ─── City wall — thick stone wall block standing on a hex ──────── */
/** Multiply an #rrggbb colour by a factor (>1 lightens). */
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

export function CityWall({ coord, bannerColor, rotY = 0 }: { coord: HexCoord; bannerColor: string; rotY?: number }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const pennantRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pennantRef.current) {
      pennantRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.3;
    }
  });
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Wall body — thick stone block */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.4, 1.6]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      {/* Tiled coping along the wall-walk */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <boxGeometry args={[1.68, 0.1, 1.68]} />
        <meshStandardMaterial color="#39444f" roughness={0.7} />
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

/** A grand gatehouse for the centre of a besieged wall — a two-storey tower
 *  with red columns, a swept double-eave roof and a fluttering banner. */
export function WallGate3D({ coord, bannerColor, rotY = 0 }: { coord: HexCoord; bannerColor: string; rotY?: number }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const pennant = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pennant.current) pennant.current.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.3;
  });
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Gate base + tiled coping */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.7, 1.6]} />
        <meshStandardMaterial color="#6a5540" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.74, 0]} castShadow>
        <boxGeometry args={[1.68, 0.1, 1.68]} />
        <meshStandardMaterial color="#39444f" roughness={0.7} />
      </mesh>
      {/* Wooden gate door facing the attackers (-x) */}
      <mesh position={[-0.82, 0.62, 0]} castShadow>
        <boxGeometry args={[0.04, 1.1, 0.7]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
      </mesh>
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
      </Html>}
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
/** 風向 — faint motion-streaks drifting across the field in the wind direction,
 *  so the wind that fuels 火계/順風 isn't just a HUD word. */
function WindStreaks({ bounds, dir }: { bounds: { x: number; z: number }; dir: 'east' | 'west' | 'south' | 'north' }) {
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

/** 威脅預警 — a pulsing red ground ring under an enemy that can reach + strike
 *  the selected unit next turn, so you can read the danger before committing. */
function ThreatMarker({ coord }: { coord: HexCoord }) {
  const ref = useRef<THREE.Mesh>(null);
  const [x, z] = hexWorld(coord.col, coord.row);
  useFrame(({ clock }) => {
    if (ref.current) {
      const p = 0.82 + Math.sin(clock.elapsedTime * 4) * 0.18;
      ref.current.scale.set(p, p, p);
    }
  });
  return (
    <mesh ref={ref} position={[x, 0.07, z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[0.58, 0.78, 24]} />
      <meshBasicMaterial color="#ff4030" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* ─── Damage number floating up from a hex ─────────────────────── */
function DamagePopup3D({ coord, text, color, spawnedAt }: {
  coord: HexCoord; text: string; color: string; spawnedAt: number;
}) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const embedded = useContext(EmbeddedSceneCtx);
  // 暴擊會心 — scale the number by the damage magnitude; big blows read BIG and
  // glow hot-gold, small ones stay plain, so hits have a punch hierarchy.
  const mag = Math.abs(parseInt(text.replace(/[^0-9-]/g, ''), 10)) || 0;
  const fs = Math.round(18 + Math.min(30, mag / 170));   // 18 → 48 px
  const hot = mag >= 2600;
  const dispColor = hot ? '#ffe27a' : color;
  useFrame(() => {
    if (!groupRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / 1.2);
    groupRef.current.position.y = 1.5 + t * (hot ? 1.9 : 1.5);
    if (htmlRef.current) {
      htmlRef.current.style.opacity = String(1 - t);
      // Pop-in punch: overshoot to 1.5× then settle in the first 0.12 of life.
      const pop = t < 0.12 ? 1.5 - (t / 0.12) * 0.5 : 1;
      htmlRef.current.style.transform = `scale(${pop})`;
    }
  });
  if (embedded) {
    // The diorama can't use screen-space DOM popups (they ignore the group
    // scale) — but CSS3D Html (transform+sprite) lives IN the scene: it
    // scales with the diorama, billboards to the camera, costs no font
    // fetch (troika's default font is a CDN asset — blank offline/PWA),
    // and covers CJK for free.
    return (
      <group ref={groupRef} position={[x, 1.5, z]}>
        <Html transform sprite distanceFactor={undefined} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: dispColor, fontFamily: 'Songti SC, serif', fontSize: `${Math.round(fs * 1.3)}px`, fontWeight: 'bold',
            textShadow: `0 0 ${hot ? 9 : 5}px ${dispColor}, 1px 1px 0 #000, -1px -1px 0 #000`,
            whiteSpace: 'nowrap', transform: 'scale(0.06)',
          }}>{hot ? `${text}!` : text}</div>
        </Html>
      </group>
    );
  }
  return (
    <group ref={groupRef} position={[x, 1.5, z]}>
      <Html center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={htmlRef} style={{
          color: dispColor, fontFamily: 'Songti SC, serif',
          fontSize: `${fs}px`, fontWeight: 'bold',
          textShadow: `0 0 ${hot ? 10 : 6}px ${dispColor}, 0 0 2px #000, 2px 2px 0 #000`,
          whiteSpace: 'nowrap',
        }}>{hot ? `${text}!` : text}</div>
      </Html>
    </group>
  );
}

/* ─── Attack arc visual ─────────────────────────────────────────── */
const ARROW_UP = new THREE.Vector3(0, 1, 0);
/** 箭雨 — a ranged attack looses an instanced volley of arrows, each on its
 *  own staggered high arc with lateral spread, oriented along its flight. */
function ArrowVolley({ fx, fz, tx, tz, spawnedAt }: {
  fx: number; fz: number; tx: number; tz: number; spawnedAt: number;
}) {
  const N = IS_MOBILE ? 10 : 20;
  const ref = useRef<THREE.InstancedMesh>(null);
  const arrows = useMemo(() => Array.from({ length: N }, (_, i) => ({
    lat: Math.sin(i * 12.9898) * 0.42,
    stagger: Math.abs(Math.sin(i * 78.233)) * 0.13,
    peak: 1.5 + Math.abs(Math.sin(i * 4.1)) * 0.7,
  })), [N]);
  useFrame(() => {
    if (!ref.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const dx = tx - fx, dz = tz - fz;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;   // perpendicular for the spread
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const dir = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const a = arrows[i];
      const t = Math.min(1, Math.max(0, (age - a.stagger) / 0.55));
      const vis = t > 0 && t < 1;
      const y = 1.0 + Math.sin(t * Math.PI) * a.peak;
      const vy = a.peak * Math.PI * Math.cos(t * Math.PI);
      dir.set(dx, vy, dz).normalize();
      q.setFromUnitVectors(ARROW_UP, dir);
      pos.set(fx + dx * t + px * a.lat, y, fz + dz * t + pz * a.lat);
      sc.setScalar(vis ? 1 : 0.0001);
      m.compose(pos, q, sc);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <cylinderGeometry args={[0.012, 0.012, 0.34, 4]} />
      <meshBasicMaterial color="#cdbb88" />
    </instancedMesh>
  );
}

/** 命中爆點 — when a volley lands (~0.46s after release), kick a dust ring +
 *  scattered splinters at the target tile so ranged hits have a point of impact. */
function ArrowImpact({ x, z, spawnedAt }: { x: number; z: number; spawnedAt: number }) {
  const ref = useRef<THREE.Group>(null);
  const DELAY = 0.46, DUR = 0.42;
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const age = (Date.now() - spawnedAt) / 1000 - DELAY;
    const vis = age >= 0 && age <= DUR;
    g.visible = vis;
    if (!vis) return;
    const t = age / DUR;
    g.scale.setScalar(0.4 + t * 1.3);
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m && 'opacity' in m) m.opacity = (1 - t) * 0.7;
    });
  });
  return (
    <group ref={ref} position={[x, 0.1, z]} visible={false} raycast={() => null}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.46, 18]} />
        <meshBasicMaterial color="#b6a079" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.28, 0.12, Math.sin(a) * 0.28]} rotation={[Math.PI / 3, -a, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.2, 4]} />
            <meshBasicMaterial color="#caa45a" transparent opacity={0.8} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

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
    projRef.current.position.x = fx + (tx - fx) * t;
    projRef.current.position.z = fz + (tz - fz) * t;
    projRef.current.position.y = 1.0 + Math.sin(t * Math.PI) * 0.4;
    const mat = projRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 1 - t;
  });
  // Ranged attacks loose a whole volley; melee throws a single arcing strike.
  if (kind === 'ranged') return (
    <>
      <ArrowVolley fx={fx} fz={fz} tx={tx} tz={tz} spawnedAt={spawnedAt} />
      <ArrowImpact x={tx} z={tz} spawnedAt={spawnedAt} />
    </>
  );
  return (
    <mesh ref={projRef} position={[fx, 1, fz]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#ff8050" transparent opacity={1} />
    </mesh>
  );
}

/* ─── Stratagem visual effects — fire / lightning / aura / swirl / etc ── */

/** Map each StratagemId → FX kind. */
// 戰法特效的純資料映射(kind / 顏色 / 壽命)抽到 game/data/stratagemFx.ts,
// 大地圖戰鬥沿用同一份;此處 re-export 讓 StrategicMap3D 的舊 import 不必改。
export { stratagemFxKind, tacticFxKind, tacticFxSpec, FX_DURATION };

/* 戰鬥運鏡 — a quick zoom-punch on heavy casts + a true freeze-frame hitstop.
 * The FOV dip never fights OrbitControls. The hitstop pauses the r3f clock for
 * ~85ms so EVERY clock-driven animation holds on the impact, then resumes
 * WITHOUT resetting elapsedTime (we restore oldTime so motion stays continuous). */
export function BattleCinematics({ trigger }: { trigger: { key: number; weight: number } | null }) {
  const { camera, clock } = useThree();
  const baseFov = useRef<number | null>(null);
  const pulse = useRef(0);
  const lastKey = useRef(0);
  const frozen = useRef(false);
  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    if (baseFov.current == null) baseFov.current = cam.fov;
    if (trigger && trigger.key !== lastKey.current) {
      lastKey.current = trigger.key;
      if (trigger.weight >= 2) {
        pulse.current = 1;
        // 頓幀 — pause the clock (delta→0, elapsedTime frozen) for a beat, then
        // resume cleanly. Guard against autoStart resetting elapsedTime to 0.
        if (!frozen.current) {
          frozen.current = true;
          clock.autoStart = false;
          clock.running = false;
          const ms = trigger.weight >= 3 ? 130 : 85;
          setTimeout(() => {
            clock.oldTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            clock.running = true;
            clock.autoStart = true;
            frozen.current = false;
          }, ms);
        }
      }
    }
    if (pulse.current > 0) {
      pulse.current = Math.max(0, pulse.current - delta * 2.6);
      const dip = Math.sin(pulse.current * Math.PI) * (baseFov.current * 0.13);
      cam.fov = baseFov.current - dip;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function StratagemFXNode({ coord, spec, spawnedAt }: {
  coord: HexCoord; spec: TacticFxSpec; spawnedAt: number;
}) {
  const { kind, color, density, spin, scale, variant } = spec;
  const [x, z] = hexWorld(coord.col, coord.row);
  const dur = FX_DURATION[kind];
  /** particle count scaled by this tactic's density (min 2). */
  const n = (base: number) => Math.max(2, Math.round(base * density));
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
      case 'grain': {
        // 焚糧 — climbs a little, flame flickers via scale
        g.position.y = t * 1.0;
        g.scale.setScalar(1 + t * 0.3 + Math.sin(t * 30) * 0.05);
        break;
      }
      case 'rune': {
        // 神算 — slow rise + steady rotation of the trigram
        g.rotation.y = t * Math.PI * 1.5;
        g.position.y = 0.3 + t * 0.5;
        break;
      }
      case 'feint': {
        // 偽計 — the false image pulls back and fades away
        g.position.z = -t * 1.8;
        g.position.x = t * 0.4;
        break;
      }
      case 'streak': {
        // 飛将 — dash forward leaving the trail behind
        g.position.x = t * 2.4;
        break;
      }
      case 'dragon': {
        // 龍威 — the dragon coils upward fast
        g.rotation.y = t * Math.PI * 3;
        g.position.y = t * 2.0;
        g.scale.setScalar(1 + t * 0.4);
        break;
      }
      case 'splash': {
        // 撞角 — water crown leaps then falls, ripple spreads
        g.position.y = Math.sin(t * Math.PI) * 1.4;
        g.scale.setScalar(1 + t * 1.2);
        break;
      }
      case 'grapple': {
        // 接舷 — ropes swing, sparks jitter
        g.rotation.y = Math.sin(t * Math.PI * 4) * 0.25;
        break;
      }
      case 'shipfire': {
        // 火船 — the blaze climbs the hull
        g.position.y = t * 0.8;
        g.scale.setScalar(1 + t * 0.5 + Math.sin(t * 26) * 0.04);
        break;
      }
      case 'scatter': {
        // 劫糧道 — crates burst outward
        g.scale.setScalar(0.4 + t * 2.2);
        break;
      }
      case 'rocks': {
        // 落石 — boulders plummet from above
        g.position.y = (1 - t) * 3.5;
        break;
      }
      case 'wind': {
        // 借東風 — the wind spirals up fast
        g.rotation.y = t * Math.PI * 4;
        g.position.y = t * 0.6;
        break;
      }
      case 'gate': {
        // 八門遁甲 — the eight gates wheel slowly shut
        g.rotation.y = t * Math.PI * 0.8;
        g.position.y = t * 0.2;
        break;
      }
      case 'empty': {
        // 空城計 — the unnerving calm spreads outward, almost still
        g.scale.setScalar(1 + t * 0.8);
        break;
      }
      case 'lamp': {
        // 七星燈 — the Dipper of lamps drifts gently upward
        g.position.y = t * 0.5;
        g.rotation.y = Math.sin(t * 2) * 0.1;
        break;
      }
      case 'net': {
        // 七擒 — the capture net drops over the foe
        g.position.y = (1 - t) * 2.2;
        break;
      }
      case 'charm': {
        // 美人計 — petals swirl up and around
        g.rotation.y = t * Math.PI * 2;
        g.position.y = t * 0.5;
        break;
      }
      case 'thunderstorm': {
        // 五雷 — a barrage of bolts crashes down
        g.position.y = (1 - t) * 5;
        g.scale.setScalar(1 + (1 - t) * 0.3);
        break;
      }
      case 'poison': {
        // 毒瘴 — the toxic cloud roils upward and swells
        g.position.y = t * 0.7;
        g.scale.setScalar(1 + t * 0.5);
        break;
      }
      case 'ice': {
        // 冰封 — shards lock in, a slow shiver
        g.position.y = 0.2 + Math.sin(t * 12) * 0.02 * (1 - t);
        break;
      }
      case 'blades': {
        // 刀陣 — the blade ring whirls
        g.rotation.y = t * Math.PI * 6;
        break;
      }
      case 'spears': {
        // 槍林 — the spear wall thrusts up
        g.position.y = -0.4 + Math.min(1, t * 3) * 0.4;
        break;
      }
      case 'caltrops': {
        // 鐵蒺藜 — spikes scatter outward across the ground
        g.scale.setScalar(0.3 + Math.min(1, t * 2.5) * 1.0);
        break;
      }
      case 'beast': {
        // 猛獸 — a pouncing lunge forward
        g.position.x = Math.sin(t * Math.PI) * 0.8;
        g.position.y = Math.sin(t * Math.PI) * 0.4;
        break;
      }
      case 'drum': {
        // 戰鼓 — pulses outward in beats
        g.scale.setScalar(0.6 + (0.4 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.6) * (0.5 + t));
        break;
      }
      case 'cannon': {
        // 火砲 — muzzle blast bursts then drifts
        g.scale.setScalar(0.3 + Math.min(1, t * 4) * 1.4);
        g.position.y = t * 0.4;
        break;
      }
      case 'smoke': {
        // 煙幕 — the screen billows up and spreads
        g.position.y = t * 1.2;
        g.scale.setScalar(1 + t * 0.9);
        break;
      }
      case 'vortex': {
        // 旋渦 — a tight fast funnel
        g.rotation.y = t * Math.PI * 8;
        g.position.y = 0.6 + Math.sin(t * Math.PI * 2) * 0.15;
        break;
      }
      case 'oil': {
        // 火油 — the slick splatters out low and burns
        g.scale.setScalar(0.4 + t * 1.6);
        break;
      }
      case 'curse': {
        // 詛咒 — dark sigils orbit and sink in
        g.rotation.y = t * Math.PI * 3;
        g.position.y = 0.5 - t * 0.3;
        break;
      }
    }
    // Per-tactic spin direction/speed (applied to whatever rotation the case set).
    g.rotation.y *= spin;
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
        // 烈焰 + 濃煙柱 — orange/yellow/red flame tongues at the base, dark
        // smoke billowing above; the whole column rises (赤壁 inferno).
        return (
          <>
            {Array.from({ length: n(18) }).map((_, i) => {
              const ang = (i / 18) * Math.PI * 3.2;
              const r = 0.12 + (i % 4) * 0.17;
              // tint the flame palette toward this tactic's colour
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? color : '#e0331a';
              return (
                <mesh key={`f${i}`} position={[Math.cos(ang) * r, 0.08 + (i % 5) * 0.18, Math.sin(ang) * r]}>
                  <sphereGeometry args={[0.13 + (i % 3) * 0.05, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const ang = (i / 8) * Math.PI * 2;
              const r = 0.18 + (i % 3) * 0.16;
              return (
                <mesh key={`s${i}`} position={[Math.cos(ang) * r, 1.05 + i * 0.24, Math.sin(ang) * r]}>
                  <sphereGeometry args={[0.24 + (i % 3) * 0.09, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#52493f' : '#6a6055'} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
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
        // variant 0/1: orbiting volley climbing a spiral; 2/3: a falling rain spread.
        return Array.from({ length: n(8) }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          const rain = variant >= 2;
          const r = rain ? 0.25 + (i % 4) * 0.18 : 0.6;
          return (
            <mesh
              key={i}
              position={rain
                ? [Math.cos(ang) * r, 0.4 + (i % 5) * 0.42, Math.sin(ang) * r]
                : [Math.cos(ang) * r, i * 0.3, Math.sin(ang) * r]}
              rotation={rain ? [Math.PI / 2.2, 0, 0] : [Math.PI / 3, 0, 0]}
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
            {Array.from({ length: n(6) }).map((_, i) => {
              const ang = (i / n(6)) * Math.PI * 2;
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
        return Array.from({ length: n(10) }).map((_, i) => {
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
        // variant ≥2 adds a second, outer ring.
        return (
          <>
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.7, 32]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {variant >= 2 && (
              <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.85, 0.98, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}
          </>
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
      case 'grain':
        // 兵糧攻 — 糧箱起火,火舌與穀屑齊飛
        return (
          <>
            {[-0.16, 0.16].map((dx, i) => (
              <mesh key={`box${i}`} position={[dx, 0.13, 0]}>
                <boxGeometry args={[0.24, 0.24, 0.24]} />
                <meshBasicMaterial color="#7a5230" transparent opacity={1} />
              </mesh>
            ))}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.08 + (i % 3) * 0.08;
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#ff8424' : '#e0331a';
              return (
                <mesh key={`fl${i}`} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.15, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.07, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'rune':
        // 神算 — 八卦符陣 + 浮空符牘 + 中央慧眼
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.55, 0.72, 8]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.46, 0.5, Math.sin(a) * 0.46]} rotation={[0, -a, 0]}>
                  <boxGeometry args={[0.02, 0.22, 0.02]} />
                  <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.72, 0]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshBasicMaterial color="#d4ecff" transparent opacity={1} toneMapped={false} />
            </mesh>
          </>
        );
      case 'feint':
        // 偽計 — 半透明虛影連同煙塵向後撤去
        return (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <mesh key={`gh${i}`} position={[i * 0.2 - 0.2, 0.5, i * 0.18]}>
                <boxGeometry args={[0.2, 0.5, 0.12]} />
                <meshBasicMaterial color={color} transparent opacity={0.45} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`d${i}`} position={[Math.cos(a) * 0.4, 0.12, Math.sin(a) * 0.4]}>
                  <sphereGeometry args={[0.09, 5, 5]} />
                  <meshBasicMaterial color="#a89a86" transparent opacity={0.5} />
                </mesh>
              );
            })}
          </>
        );
      case 'streak':
        // 飛将 — 水平疾風線 + 揚塵尾跡
        return (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh
                key={`s${i}`}
                position={[-0.5 - i * 0.18, 0.3 + (i % 2) * 0.18, (i % 3 - 1) * 0.12]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
                <meshBasicMaterial color={color} transparent opacity={1} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`d${i}`} position={[-0.3 - i * 0.16, 0.1, i % 2 ? 0.12 : -0.12]}>
                <sphereGeometry args={[0.08 + (i % 2) * 0.04, 5, 5]} />
                <meshBasicMaterial color="#bda678" transparent opacity={0.6} />
              </mesh>
            ))}
          </>
        );
      case 'dragon':
        // 龍威 — 青龍鱗節螺旋升騰,腳下符環
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.45, 0.6, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 4;
              const r = 0.42 - i * 0.012;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.1 + i * 0.13, Math.sin(a) * r]}>
                  <sphereGeometry args={[Math.max(0.04, 0.1 - i * 0.004), 8, 8]} />
                  <meshBasicMaterial color={i % 2 ? '#3a7dd9' : '#7ec8ff'} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'splash':
        // 撞角 — 浪冠水珠四濺 + 漣漪環
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.4, 0.55, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.25 + (i % 3) * 0.12;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.18, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#dff2fa' : color} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'grapple':
        // 接舷 — 飛鉤纜索鉤住敵舷,鉤尖迸火星
        return (
          <>
            {Array.from({ length: 4 }).map((_, i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <mesh
                  key={`r${i}`}
                  position={[Math.cos(a) * 0.3, 0.45, Math.sin(a) * 0.3]}
                  rotation={[Math.PI / 3, -a, 0]}
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.9, 4]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`sp${i}`} position={[Math.cos(a) * 0.55, 0.72, Math.sin(a) * 0.55]}>
                  <sphereGeometry args={[0.05, 5, 5]} />
                  <meshBasicMaterial color="#ffd24a" transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'shipfire':
        // 火船 — 黑船身載烈焰沖江,水面映漣漪
        return (
          <>
            <mesh position={[0, 0.12, 0]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[0.9, 0.18, 0.34]} />
              <meshBasicMaterial color="#2a2018" transparent opacity={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.6, 0.82, 24]} />
              <meshBasicMaterial color="#3a7dd9" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => {
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#ff7e26' : '#e0331a';
              return (
                <mesh key={i} position={[(i % 5) * 0.18 - 0.36, 0.28 + (i % 4) * 0.16, Math.sin(i) * 0.1]}>
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'scatter':
        // 劫糧道 — 糧車糧箱朝四方迸飛 + 煙塵
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={`c${i}`}
                  position={[Math.cos(a) * 0.4, 0.2 + (i % 2) * 0.2, Math.sin(a) * 0.4]}
                  rotation={[a, a * 1.3, 0]}
                >
                  <boxGeometry args={[0.16, 0.16, 0.16]} />
                  <meshBasicMaterial color={i % 2 ? '#a9763e' : '#caa45a'} transparent opacity={1} />
                </mesh>
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2 + 0.5;
              return (
                <mesh key={`d${i}`} position={[Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5]}>
                  <sphereGeometry args={[0.1, 5, 5]} />
                  <meshBasicMaterial color="#b3a081" transparent opacity={0.5} />
                </mesh>
              );
            })}
          </>
        );
      case 'rocks':
        // 落石 — 滾石自天崩落,著地揚起塵環
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              const r = 0.15 + (i % 3) * 0.12;
              return (
                <mesh
                  key={`b${i}`}
                  position={[Math.cos(a) * r, 0.4 + (i % 4) * 0.4, Math.sin(a) * r]}
                  rotation={[a, a, a * 0.5]}
                >
                  <dodecahedronGeometry args={[0.12 + (i % 3) * 0.04, 0]} />
                  <meshBasicMaterial color={i % 2 ? '#7c746a' : '#9a9288'} transparent opacity={1} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.3, 0.55, 20]} />
              <meshBasicMaterial color="#8f877b" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'wind':
        // 借東風 — 螺旋風弧捲起,綠葉隨風旋飛
        return (
          <>
            {[0, 1, 2].map((i) => (
              <mesh key={`arc${i}`} position={[0, 0.3 + i * 0.4, 0]} rotation={[Math.PI / 2 - 0.3 * i, 0, i * 0.6]}>
                <torusGeometry args={[0.4 + i * 0.12, 0.025, 6, 16, Math.PI * 1.4]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`lf${i}`} position={[Math.cos(a) * 0.45, 0.3 + (i % 3) * 0.3, Math.sin(a) * 0.45]} rotation={[a, a, 0]}>
                  <boxGeometry args={[0.07, 0.03, 0.02]} />
                  <meshBasicMaterial color="#9ad6a8" transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'gate':
        // 八門遁甲 — 八根光柱環成八門,死門(其一)染赤
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.7, 0.85, 8]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.78, 0.45, Math.sin(a) * 0.78]}>
                  <boxGeometry args={[0.08, 0.9, 0.08]} />
                  <meshBasicMaterial color={i === 5 ? '#ff5530' : color} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'empty':
        // 空城計 — 城門大開,撫琴退兵,蕩開兩圈靜謐漣漪
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.5, 0.62, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.85, 0.92, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.22, 0.04, 6, 12, Math.PI]} />
              <meshBasicMaterial color="#c9b48a" transparent opacity={1} />
            </mesh>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={i} position={[(i - 2) * 0.18, 0.7 + Math.abs(i - 2) * 0.06, 0]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshBasicMaterial color="#fff4d8" transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
          </>
        );
      case 'lamp': {
        // 七星燈 — 七盞燈擺成北斗,祈壽延命
        const DIPPER: Array<[number, number]> = [
          [-0.6, 0.3], [-0.32, 0.22], [-0.03, 0.26], [0.26, 0.16], [0.42, -0.05], [0.22, -0.32], [-0.05, -0.34],
        ];
        return (
          <>
            {DIPPER.map(([px, pz], i) => (
              <mesh key={`l${i}`} position={[px, 0.4 + (i % 2) * 0.08, pz]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            {DIPPER.map(([px, pz], i) => (
              <mesh key={`st${i}`} position={[px, 0.18, pz]}>
                <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} />
                <meshBasicMaterial color="#6a5230" transparent opacity={1} />
              </mesh>
            ))}
          </>
        );
      }
      case 'net':
        // 七擒孟獲 — 擒縱之網自天罩落
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`m${i}`} position={[Math.cos(a) * 0.3, 0.5, Math.sin(a) * 0.3]} rotation={[Math.PI / 2.5, -a, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.9, 4]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
              <ringGeometry args={[0.45, 0.5, 18]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'charm':
        // 美人計 — 桃色花瓣繞旋媚惑
        return (
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.35 + (i % 3) * 0.1;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.18, Math.sin(a) * r]} rotation={[a, a, 0]}>
                  <coneGeometry args={[0.06, 0.12, 4]} />
                  <meshBasicMaterial color={i % 2 ? '#ff9ec4' : '#ffd0e0'} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.3, 0.42, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'thunderstorm':
        // 五雷正法 — 五道天雷齊落,焦土成環
        return (
          <>
            {([[-0.4, 0.2], [0.3, -0.3], [0.0, 0.0], [0.45, 0.35], [-0.3, -0.4]] as Array<[number, number]>).map(([px, pz], i) => (
              <mesh key={i} position={[px, 2.4, pz]}>
                <cylinderGeometry args={[0.03, 0.07, 5, 5]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.5, 0.85, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </>
        );
      case 'poison':
        // 毒瘴 — 翻滾的綠毒雲團 + 升騰毒泡
        return (
          <>
            {Array.from({ length: n(10) }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.18 + (i % 3) * 0.14;
              return (
                <mesh key={`p${i}`} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.16, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.16 + (i % 3) * 0.05, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? color : '#6fa030'} transparent opacity={0.7} />
                </mesh>
              );
            })}
          </>
        );
      case 'ice':
        // 冰封 — 放射狀冰晶碎片 + 地面寒環
        return (
          <>
            {Array.from({ length: n(8) }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.22 + (i % 2) * 0.16;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.25 + (i % 3) * 0.18, Math.sin(a) * r]} rotation={[a, a, a]}>
                  <octahedronGeometry args={[0.1 + (i % 3) * 0.03, 0]} />
                  <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.35, 0.5, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'blades':
        // 刀陣 — 環繞的刀刃輪轉
        return Array.from({ length: n(7) }).map((_, i) => {
          const a = (i / n(7)) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.5, 0.4, Math.sin(a) * 0.5]} rotation={[0, -a, Math.PI / 2.2]}>
              <coneGeometry args={[0.05, 0.34, 3]} />
              <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
            </mesh>
          );
        });
      case 'spears':
        // 槍林 — 一片向上戳刺的槍尖
        return Array.from({ length: n(9) }).map((_, i) => {
          const a = (i / n(9)) * Math.PI * 2;
          const r = 0.2 + (i % 3) * 0.14;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.45, Math.sin(a) * r]}>
              <coneGeometry args={[0.04, 0.8, 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.95} />
            </mesh>
          );
        });
      case 'caltrops':
        // 鐵蒺藜 — 地面四散的尖刺
        return (
          <>
            {Array.from({ length: n(12) }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2 * 1.6;
              const r = 0.15 + (i % 4) * 0.12;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.08, Math.sin(a) * r]} rotation={[Math.PI / 4, a, 0]}>
                  <tetrahedronGeometry args={[0.07, 0]} />
                  <meshBasicMaterial color={color} transparent opacity={0.95} />
                </mesh>
              );
            })}
          </>
        );
      case 'beast':
        // 猛獸 — 三道爪痕劃過 + 兇光
        return (
          <>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[(i - 1) * 0.16, 0.5, 0]} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.04, 0.7, 0.03]} />
                <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0, 0.5, -0.1]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshBasicMaterial color="#ffd24a" transparent opacity={0.6} toneMapped={false} />
            </mesh>
          </>
        );
      case 'drum':
        // 戰鼓 — 同心鼓圈 + 中央鼓面
        return (
          <>
            {[0.4, 0.65, 0.9].map((rr, i) => (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 + i * 0.01, 0]}>
                <ringGeometry args={[rr, rr + 0.08, 28]} />
                <meshBasicMaterial color={color} transparent opacity={0.8 - i * 0.2} side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.3, 16]} />
              <meshBasicMaterial color="#8a2a1a" transparent opacity={0.9} />
            </mesh>
          </>
        );
      case 'cannon':
        // 火砲 — 砲口爆焰 + 灰煙
        return (
          <>
            {Array.from({ length: n(8) }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.1 + (i % 3) * 0.12;
              return (
                <mesh key={`b${i}`} position={[Math.cos(a) * r, 0.3, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.12, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#ffd24a' : color} transparent opacity={0.9} toneMapped={false} />
                </mesh>
              );
            })}
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={`s${i}`} position={[(i - 2) * 0.12, 0.6 + i * 0.08, 0]}>
                <sphereGeometry args={[0.14, 6, 6]} />
                <meshBasicMaterial color="#6a6055" transparent opacity={0.6} />
              </mesh>
            ))}
          </>
        );
      case 'smoke':
        // 煙幕 — 大團遮蔽灰煙
        return Array.from({ length: n(9) }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const r = 0.15 + (i % 4) * 0.14;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.2, Math.sin(a) * r]}>
              <sphereGeometry args={[0.22 + (i % 3) * 0.08, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.55} />
            </mesh>
          );
        });
      case 'vortex':
        // 旋渦 — 收緊的螺旋柱
        return Array.from({ length: n(14) }).map((_, i) => {
          const a = (i / 14) * Math.PI * 5;
          const r = 0.55 - i * 0.03;
          return (
            <mesh key={i} position={[Math.cos(a) * Math.max(0.05, r), 0.12 + i * 0.09, Math.sin(a) * Math.max(0.05, r)]}>
              <sphereGeometry args={[0.06, 5, 5]} />
              <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
            </mesh>
          );
        });
      case 'oil':
        // 火油 — 低伏黑油濺射 + 火苗
        return (
          <>
            {Array.from({ length: n(10) }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.3 + (i % 3) * 0.14;
              return (
                <mesh key={`o${i}`} position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={0.9} />
                </mesh>
              );
            })}
            {Array.from({ length: 5 }).map((_, i) => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <mesh key={`f${i}`} position={[Math.cos(a) * 0.25, 0.22, Math.sin(a) * 0.25]}>
                  <coneGeometry args={[0.06, 0.2, 5]} />
                  <meshBasicMaterial color="#ff7e26" transparent opacity={0.9} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'curse':
        // 詛咒 — 環繞的暗紫符印 + 中央邪光
        return (
          <>
            {Array.from({ length: n(6) }).map((_, i) => {
              const a = (i / n(6)) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.5, 0.5, Math.sin(a) * 0.5]} rotation={[0, -a, 0]}>
                  <torusGeometry args={[0.1, 0.02, 4, 8]} />
                  <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.13, 10, 10]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
            </mesh>
          </>
        );
    }
  })();

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <group scale={scale}>{visuals}</group>
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
  // Hooks must run unconditionally — early returns only AFTER them (a side
  // toggling its formation on/off used to change the hook order and crash).
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  const embedded = useContext(EmbeddedSceneCtx);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.opacity = 0.45 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
    }
  });
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
      {/* Floating label (skipped in the embedded diorama) */}
      {!embedded && <Html position={[0, 0.4, 0]} center distanceFactor={6} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
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
      </Html>}
    </group>
  );
}

/* ─── The whole 3D scene ────────────────────────────────────────────── */
/* ─── 战场天地 — ground skirt + horizon hills so the field sits in a
 *  world instead of floating in the void. Fog fades both away. ───── */
function BattleSurround({ width, height, timeOfDay }: { width: number; height: number; timeOfDay: TimeOfDay }) {
  const [cx] = hexWorld(Math.floor(width / 2), Math.floor(height / 2));
  const [, cz] = hexWorld(Math.floor(width / 2), Math.floor(height / 2));
  const earth = timeOfDay === 'night' ? '#11161f' : timeOfDay === 'dusk' ? '#4a3828' : '#3d4a2c';
  const hillCol = timeOfDay === 'night' ? '#0c1118' : timeOfDay === 'dusk' ? '#3a2c22' : '#2c3824';
  // Deterministic ring of silhouette hills.
  const hills = useMemo(() => Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2;
    const r = 30 + ((i * 37) % 10);
    return {
      x: cx + Math.cos(a) * r * 1.25,
      z: cz + Math.sin(a) * r * 0.85,
      h: 3 + ((i * 53) % 17) / 17 * 5,
      w: 5 + ((i * 29) % 11),
    };
  }), [cx, cz]);
  return (
    <group>
      {/* Ground skirt — a vast earthen disc under and beyond the board */}
      <mesh position={[cx, -0.12, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[90, 48]} />
        <meshStandardMaterial color={earth} roughness={1} />
      </mesh>
      {/* Horizon hills — dark silhouettes swallowed by the fog */}
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, h.h / 2 - 0.1, h.z]}>
          <coneGeometry args={[h.w, h.h, 7]} />
          <meshStandardMaterial color={hillCol} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 草石点缀 — grass tufts on the plains, scattered stones on hills.
 *  Instanced; deterministic per coord so the field doesn't shimmer. */
function FieldDressing({ tiles }: { tiles: TacticalTile[] }) {
  const items = useMemo(() => {
    const grass: Array<[number, number, number]> = [];
    const rocks: Array<[number, number, number]> = [];
    for (const t of tiles) {
      const hsh = (t.coord.col * 73 + t.coord.row * 31) % 100;
      const [x, z] = hexWorld(t.coord.col, t.coord.row);
      const y = TERRAIN_HEIGHT[t.terrain];
      if (t.terrain === 'plain' && hsh < 55) {
        const n = 2 + (hsh % 2);
        for (let k = 0; k < n; k++) {
          const a = ((hsh + k * 47) % 100) / 100 * Math.PI * 2;
          const r = 0.25 + ((hsh * (k + 3)) % 50) / 100;
          grass.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
        }
      }
      if (t.terrain === 'hill' && hsh < 70) {
        const a = (hsh / 100) * Math.PI * 2;
        rocks.push([x + Math.cos(a) * 0.45, y, z + Math.sin(a) * 0.45]);
      }
    }
    return { grass, rocks };
  }, [tiles]);
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    if (grassRef.current) {
      items.grass.forEach((g, i) => {
        d.position.set(g[0], g[1] + 0.07, g[2]);
        d.rotation.set(0, (i * 1.7) % Math.PI, ((i % 5) - 2) * 0.06);
        d.scale.setScalar(0.8 + (i % 4) * 0.12);
        d.updateMatrix();
        grassRef.current!.setMatrixAt(i, d.matrix);
      });
      grassRef.current.instanceMatrix.needsUpdate = true;
    }
    if (rockRef.current) {
      items.rocks.forEach((r, i) => {
        d.position.set(r[0], r[1] + 0.05, r[2]);
        d.rotation.set((i % 3) * 0.4, i * 0.9, 0);
        d.scale.setScalar(0.7 + (i % 3) * 0.25);
        d.updateMatrix();
        rockRef.current!.setMatrixAt(i, d.matrix);
      });
      rockRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [items]);
  return (
    <group>
      <instancedMesh ref={grassRef} args={[undefined, undefined, Math.max(1, items.grass.length)]}>
        <coneGeometry args={[0.05, 0.16, 4]} />
        <meshStandardMaterial color="#5d7a36" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, Math.max(1, items.rocks.length)]} castShadow>
        <dodecahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#71685c" roughness={0.97} />
      </instancedMesh>
    </group>
  );
}

export function BattleScene({
  battle, playerSide, actionMode,
  selectedId, hovered, setHovered, onTileClick,
  attackArcs, stratagemFx, officers, embedded = false,
}: {
  battle: TacticalBattle;
  playerSide: 'attacker' | 'defender' | null;
  actionMode: ActionMode;
  selectedId: string | null;
  hovered: HexCoord | null;
  setHovered: (c: HexCoord | null) => void;
  onTileClick: (c: HexCoord) => void;
  attackArcs: { id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }[];
  stratagemFx: StratagemFxInstance[];
  officers: Record<EntityId, Officer>;
  /** Diorama mode — rendered inside ANOTHER scene (the strategic map): skip
   *  scene-global fog/lights/surround/ground/weather and DOM overlays. */
  embedded?: boolean;
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
    <EmbeddedSceneCtx.Provider value={embedded}>
      {/* Scene globals — fog, surround hills, stars, lights, shadow-catch
          ground and weather all belong to the FULLSCREEN battle only; as an
          embedded diorama the host scene provides its own. */}
      {!embedded && (
        <>
          <fog attach="fog" args={[lighting.fog[0], fogNear, fogFar]} />
          <BattleSurround width={battle.width} height={battle.height} timeOfDay={battle.timeOfDay} />
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
          {battle.weather === 'wind' && battle.windDirection && battle.windDirection !== 'calm' && (
            <WindStreaks bounds={bounds} dir={battle.windDirection} />
          )}
        </>
      )}
      <FieldDressing tiles={tiles} />

      {/* All tiles */}
      {(() => {
        const fireSet = new Set((battle.groundFires ?? []).map((f) => `${f.coord.col},${f.coord.row}`));
        return tiles.map((t) => {
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
                burning={fireSet.has(key)}
              />
            </group>
          );
        });
      })()}

      {/* City walls + gatehouses — mounted on the actual wall/gate TILES of
          the walled-town enclosure, oriented per face (battlements toward
          the attacker, gate doors facing outward). Breached tiles turn to
          plain, so the masonry visibly vanishes at the breach. Town houses
          fill the enclosure so the prize reads as a living city. */}
      {(() => {
        const wallTiles = tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate');
        if (wallTiles.length === 0) return null;
        const structureCoords = new Set(
          (battle.cityStructures ?? []).map((s) => `${s.coord.col},${s.coord.row}`),
        );
        const westCol = Math.min(...wallTiles.map((t) => t.coord.col));
        const r0 = Math.min(...wallTiles.map((t) => t.coord.row));
        const r1 = Math.max(...wallTiles.map((t) => t.coord.row));
        const wallBanner = playerSide === 'defender' ? bannerColor : '#3a7dd9';
        const rotFor = (t: { coord: HexCoord; terrain: string }): number => {
          if (t.terrain === 'gate') {
            if (t.coord.col === westCol) return 0;            // door → attacker (-x)
            return t.coord.row === r0 ? -Math.PI / 2 : Math.PI / 2; // north / south face
          }
          return t.coord.col === westCol ? Math.PI / 2 : 0;   // battlements across the face
        };
        const pieces = wallTiles
          .filter((t) => !structureCoords.has(`${t.coord.col},${t.coord.row}`))
          .map((t) => (
            t.terrain === 'gate'
              ? <WallGate3D key={`gate-${t.coord.col},${t.coord.row}`} coord={t.coord} bannerColor={wallBanner} rotY={rotFor(t)} />
              : <CityWall key={`wall-${t.coord.col},${t.coord.row}`} coord={t.coord} bannerColor={wallBanner} rotY={rotFor(t)} />
          ));
        // Interior streets — sprinkle homes on plain ground inside the walls.
        const houses = tiles
          .filter((t) => t.terrain === 'plain'
            && t.coord.col > westCol && t.coord.row > r0 && t.coord.row < r1
            && ((t.coord.col * 7 + t.coord.row * 13) % 5) < 2)
          .map((t) => <TownHouse key={`home-${t.coord.col},${t.coord.row}`} coord={t.coord} />);
        return [...pieces, ...houses];
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
        const arc = attackArcs.find((a) => a.kind === 'melee'
          && a.from.col === u.coord.col && a.from.row === u.coord.row);
        return (
          <UnitMesh
            key={u.id}
            unit={u}
            terrainH={h}
            isPlayer={isPlayer}
            selected={selectedId === u.id}
            onClick={() => onTileClick(u.coord)}
            isWounded={isWounded}
            lunge={arc ? { to: arc.to, at: arc.spawnedAt } : null}
          />
        );
      })}

      {/* 威脅預警 — when YOUR unit is picked, ring the enemies that could reach
          and hit it next turn (move range + attack reach, terrain-agnostic). */}
      {(() => {
        const sel = selectedId ? units.find((u) => u.id === selectedId) : null;
        if (!sel || (playerSide && sel.side !== playerSide)) return null;
        const reach = (e: TacticalUnit) =>
          (e.unitType === 'archers' || e.unitType === 'siege' ? 4 : 1) + e.maxAp;
        return units
          .filter((e) => e.side !== sel.side && e.troops > 0
            && !(e.hidden && e.side !== playerSide)
            && hexDistance(e.coord, sel.coord) <= reach(e))
          .map((e) => <ThreatMarker key={`threat-${e.id}`} coord={e.coord} />);
      })()}

      {/* Damage popups floating up from hexes. Age-filtered at render — the
          array itself only ever grows between endTurn prunes, and a popup
          past its float animation would otherwise sit invisible (fullscreen)
          or frozen mid-air (embedded Text) forever. */}
      {(battle.damagePopups ?? []).filter((p) => Date.now() - p.spawnedAt < 1400).map((p) => (
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
          spec={f.spec}
          spawnedAt={f.spawnedAt}
        />
      ))}
    </EmbeddedSceneCtx.Provider>
  );
}

/* ─── Top-level screen ──────────────────────────────────────────────── */
export function TacticalBattleScreen3D() {
  const battle = useGameStore((s) => s.tacticalBattle);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const start = useGameStore((s) => s.startTacticalBattle);
  // 戰前準備 — bar visibility + last refusal reason.
  const [prepDismissed, setPrepDismissed] = useState(false);
  const [prepMsg, setPrepMsg] = useState<string | null>(null);
  // 🎬 戰鬥錄影 — MediaRecorder over the battle canvas; one button
  // toggles, stop downloads the clip. Recorder dies with the screen.
  const screenRootRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  // 🤖 委託指揮 — the same tactical AI that drives the enemy plays YOUR
  // side while engaged; flip it off any turn to take the reins back.
  const [autoPilot, setAutoPilot] = useState(false);
  const toggleRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    const canvas = screenRootRef.current?.querySelector('canvas');
    if (!canvas || !('captureStream' in canvas) || typeof MediaRecorder === 'undefined') return;
    const stream = (canvas as HTMLCanvasElement).captureStream(30);
    const mime = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      .find((m) => MediaRecorder.isTypeSupported(m));
    if (!mime) return;
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
      recorderRef.current = null;
      setRecording(false);
      if (chunks.length === 0) return;
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `戰役錄影-${new Date().toISOString().slice(0, 16).replace(':', '')}.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
  };
  useEffect(() => () => { recorderRef.current?.stop(); }, []);
  const applyResolution = useGameStore((s) => s.applyTacticalResolution);
  const cancelBattle = useGameStore((s) => s.cancelTacticalBattle);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const battleSpeed = useGameStore((s) => s.battleSpeed);
  const difficulty = useGameStore((s) => s.difficulty);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HexCoord | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ kind: 'none' });

  // Keyboard shortcuts: mirror the 2D screen.
  // 1=move, 2=attack, 3=duel, Esc=cancel, Space=end turn, Tab=cycle.
  // ── 战场音效 — ambience for the duration, log-driven stings for events.
  useEffect(() => {
    startBattleAmbience();
    return () => stopBattleAmbience();
  }, []);
  const sfxCursor = useRef(0);
  useEffect(() => {
    const log = battle?.log ?? [];
    if (sfxCursor.current > log.length) sfxCursor.current = 0; // new battle
    for (let i = sfxCursor.current; i < log.length; i++) {
      const t = log[i]?.text ?? '';
      if (t.includes('告破') || t.includes('崩塌') || t.includes('焚斷')) playSfx('crash');
      else if (t.includes('決堤') || t.includes('山崩')) playSfx('quake');
      else if (t.includes('火') || t.includes('烈焰')) playSfx('fire');
      else if (t.includes('馳援') || t.includes('糧盡')) playSfx('horn');
      else if (t.includes('夜襲') || t.includes('殺到')) playSfx('shout');
      else if (t.includes('搶修') || t.includes('猛撞') || t.includes('轟擊')) playSfx('thud');
      else if (t.includes('傾下') || t.includes('射出')) playSfx('arrow');
    }
    sfxCursor.current = log.length;
  }, [battle?.log]);
  // Victory / defeat sting once, when the banner drops.
  const winSfxDone = useRef(false);
  useEffect(() => {
    if (!battle?.winner || winSfxDone.current) return;
    winSfxDone.current = true;
    const playerSideNow = battle.attackerForceId === useGameStore.getState().playerForceId
      ? 'attacker' : battle.defenderForceId === useGameStore.getState().playerForceId ? 'defender' : null;
    playSfx(playerSideNow && battle.winner === playerSideNow ? 'victory' : 'defeat');
  }, [battle?.winner]);

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
        playSfx('horn');
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
  const [introDone, setIntroDone] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [interactiveDuel, setInteractiveDuel] = useState<{ me: Officer; foe: Officer } | null>(null);
  const [voiceLine, setVoiceLine] = useState<{ text: string; key: number } | null>(null);
  // N7 — signature-tactic banner overlay state
  const [signatureBanner, setSignatureBanner] = useState<{ zh: string; en: string; key: number } | null>(null);
  // Stratagem FX particles
  const [stratagemFx, setStratagemFx] = useState<StratagemFxInstance[]>([]);
  // 戰鬥運鏡 — impact event driving screen-shake / flash / zoom-punch.
  const [cine, setCine] = useState<{ key: number; weight: number; color: string } | null>(null);
  const cineCount = useRef(0);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  /** Fire a cinematic kick for an FX archetype (no-op for soft auras). */
  const punch = (kind: StratagemFxKind, color: string) => {
    const weight = FX_IMPACT[kind];
    if (weight > 0) setCine({ key: ++cineCount.current, weight, color });
  };
  // Run the screen-shake on the canvas wrapper whenever a cinematic fires.
  useEffect(() => {
    if (!cine || cine.weight <= 0) return;
    const el = canvasWrapRef.current;
    if (!el || typeof el.animate !== 'function') return;
    const a = cine.weight >= 2 ? 11 : 5;
    el.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${a}px,${-a * 0.7}px) scale(1.03)` },
        { transform: `translate(${-a}px,${a * 0.6}px) scale(1.03)` },
        { transform: `translate(${a * 0.6}px,${a * 0.5}px) scale(1.02)` },
        { transform: `translate(${-a * 0.4}px,${-a * 0.3}px) scale(1.01)` },
        { transform: 'translate(0,0) scale(1)' },
      ],
      { duration: cine.weight >= 2 ? 430 : 260, easing: 'ease-out' },
    );
  }, [cine?.key]);  // eslint-disable-line react-hooks/exhaustive-deps
  const t = useT();
  const lang = useLanguage();

  const playerSide: 'attacker' | 'defender' | null = useMemo(() => {
    if (!battle) return null;
    if (battle.attackerForceId === playerForceId) return 'attacker';
    if (battle.defenderForceId === playerForceId) return 'defender';
    return null;
  }, [battle, playerForceId]);

  // AI takes its turn after a short delay when it's not the player's side —
  // or on the player's side too, when 委託指揮 is engaged.
  useEffect(() => {
    if (!battle || battle.winner) return;
    if (playerSide && (battle.activeSide !== playerSide || autoPilot)) {
      const delay = Math.max(150, 700 / Math.max(1, battleSpeed));
      const id = setTimeout(() => {
        const result = aiTakeTurn(battle, officers, Math.random, {
          skill: aiSkillForDifficulty(difficulty),
        });
        const next = result.battle;
        // For each AI signature usage, spawn FX + banner + flavor log entry.
        const fxToAdd: StratagemFxInstance[] = [];
        let fxCounter = Date.now();
        let bannerToShow: { zh: string; en: string } | null = null;
        let battleAfterLogs = next;
        for (const sig of result.signatures) {
          const spec = tacticFxSpec(sig.tacticId, sig.stratagemId, categoryOfTactic);
          if (spec) {
            fxToAdd.push({
              id: fxCounter++,
              coord: sig.coord,
              spec,
              spawnedAt: Date.now(),
            });
            playFxSfx(spec.kind);
            punch(spec.kind, spec.color);
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
            const life = (FX_DURATION[f.spec.kind] ?? 1.5) * 1000 + 200;
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
  }, [battle, officers, playerSide, start, battleSpeed, difficulty, autoPilot]);

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
      playSfx(kind === 'ranged' ? 'arrow' : 'sword');
      setAttackArcs((a) => [...a, { id: aid, from: selectedUnit.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setAttackArcs((a) => a.filter((x) => x.id !== aid)), 600);
      const afterAtk = attackUnits(battle, selectedUnit.id, u.id, officers, Math.random);
      start(afterAtk);
      // 殲滅頓幀 — a killing blow gets the full impact (shake + flash + hitstop).
      const slain = afterAtk.units.find((x) => x.id === u.id);
      if (u.troops > 0 && (!slain || slain.troops <= 0)) {
        setCine({ key: ++cineCount.current, weight: 2, color: '#ff5030' });
      }
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
      // Spend AP and open the interactive bout; the kill is applied on finish.
      start({ ...battle, units: battle.units.map((unit) => unit.id === selectedUnit.id ? { ...unit, ap: 0 } : unit) });
      setInteractiveDuel({ me, foe });
      setActionMode({ kind: 'none' });
      return;
    }
    if (actionMode.kind === 'stratagem') {
      const r = applyStratagem(battle, selectedUnit.id, actionMode.id, c, officers, actionMode.tacticId);
      if (r.ok) {
        // Spawn FX at the target hex — every tactic gets its own distinct visual.
        const spec = tacticFxSpec(actionMode.tacticId, actionMode.id, categoryOfTactic);
        if (spec) {
          const fxId = Date.now();
          // For self-targeted (defend / precognition / dragon-veil), origin = caster
          const isSelf = ['defend', 'precognition', 'dragon-veil'].includes(actionMode.id);
          const fxCoord = isSelf ? selectedUnit.coord : c;
          setStratagemFx((arr) => [...arr, { id: fxId, coord: fxCoord, spec, spawnedAt: fxId }]);
          playFxSfx(spec.kind);
          punch(spec.kind, spec.color);
          const lifeMs = (FX_DURATION[spec.kind] ?? 1.5) * 1000 + 200;
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
    <div ref={screenRootRef} style={{
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
        {myTurn && (() => {
          const live = battle.units.filter((u) => u.side === playerSide && u.troops > 0);
          const ready = live.filter((u) => u.ap > 0).length;
          return (
            <span style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: ready > 0 ? 'rgba(212,168,74,0.18)' : 'rgba(110,174,115,0.16)',
              border: `1px solid ${ready > 0 ? '#d4a84a' : '#6fae73'}`,
              color: ready > 0 ? '#f0d98a' : '#9ad6a8',
            }}>{ready > 0 ? `⚑ ${t('可動', 'ready')} ${ready}/${live.length}` : `✓ ${t('全員已動', 'all moved')}`}</span>
          );
        })()}
        <span style={{
          fontSize: '0.72rem', padding: '2px 7px',
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid #5a4530', color: '#a89070',
        }}>{WEATHER_LABEL[battle.weather]}</span>
        {battle.windDirection && battle.windDirection !== 'calm' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(40, 28, 18, 0.7)', border: '1px solid #6a88a8', color: '#a8c4e0',
          }} title={t('風向 — 火勢順風蔓延', 'Wind — fire spreads downwind')}>
            {battle.windDirection === 'east' ? '🌬→ 東風' : battle.windDirection === 'west' ? '🌬← 西風' : battle.windDirection === 'south' ? '🌬↓ 南風' : '🌬↑ 北風'}
          </span>
        )}
        <span style={{
          fontSize: '0.72rem', padding: '2px 7px',
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid #5a4530', color: '#a89070',
        }}>{TOD_LABEL[battle.timeOfDay]}</span>
        <button
          onClick={toggleRecording}
          title={recording ? t('停止並下載錄影', 'Stop & download') : t('錄製戰鬥畫面(WebM)', 'Record the battle (WebM)')}
          style={{
            fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer',
            background: recording ? 'rgba(184, 68, 46, 0.35)' : 'rgba(40, 28, 18, 0.7)',
            border: `1px solid ${recording ? '#ff6a50' : '#5a4530'}`,
            color: recording ? '#ffb0a0' : '#a89070', fontFamily: 'inherit',
          }}
        >{recording ? '⏹ 錄影中' : '🎬 錄影'}</button>
        <button
          onClick={() => setAutoPilot((v) => !v)}
          title={autoPilot ? t('收回指揮權', 'Take back command') : t('委託軍師指揮 — 戰術 AI 替你打,隨時可收回', 'Let the tactical AI play your side; toggle any time')}
          style={{
            fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer',
            background: autoPilot ? 'rgba(126, 214, 138, 0.25)' : 'rgba(40, 28, 18, 0.7)',
            border: `1px solid ${autoPilot ? '#7ed68a' : '#5a4530'}`,
            color: autoPilot ? '#c8e8a0' : '#a89070', fontFamily: 'inherit',
          }}
        >{autoPilot ? '🤖 軍師代戰中' : '🤖 委託指揮'}</button>
        {/* 戰前準備 — one card, played before your first move. */}
        {myTurn && battle.turn === 1 && playerSide && !battle.prepUsed?.[playerSide] && !prepDismissed && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#d4a84a' }}>{t('戰前部署:', 'Prep:')}</span>
            {([
              { kind: 'ambush' as const, zh: '⚔ 伏兵', tip: '最強一軍潛伏 — 敵近不見,首擊帶伏擊加成' },
              { kind: 'night' as const, zh: '🌙 夜襲', tip: '入夜開戰 — 弓弩射程縮短,伏兵傷害更狠' },
              { kind: 'tunnel' as const, zh: '⛏ 地道', tip: '攻城方限定 — 最弱一軍自地道潛入牆內' },
            ]).map((p) => (
              <button
                key={p.kind}
                title={p.tip}
                onClick={() => {
                  const r = applyBattlePrep(battle, playerSide, p.kind);
                  if (r.ok) { start(r.battle); playSfx('shout'); }
                  else setPrepMsg(r.reason ?? null);
                }}
                style={{
                  background: 'rgba(58, 45, 24, 0.8)', border: '1px solid #d4a84a', color: '#f0d98a',
                  fontSize: '0.7rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{p.zh}</button>
            ))}
            <button
              onClick={() => setPrepDismissed(true)}
              style={{ background: 'transparent', border: '1px solid #5a4530', color: '#8a7050', fontSize: '0.7rem', padding: '2px 6px', cursor: 'pointer', fontFamily: 'inherit' }}
            >{t('不備', 'Skip')}</button>
            {prepMsg && <span style={{ fontSize: '0.65rem', color: '#ff9080' }}>{prepMsg}</span>}
          </span>
        )}
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
        {/* 觀戰 — drop back to the world map; the battle keeps playing as a
            diorama on the very ground it's fought over. Tap it to return. */}
        <button
          onClick={() => setBattleViewMinimized(true)}
          style={{
            marginLeft: 'auto',
            background: '#16261a', color: '#9ed68a', border: '1px solid #5a8a3a',
            padding: '0.3rem 0.8rem', cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
          }}
          title={t('回大地圖觀戰 — 戰鬥在原地繼續', 'Watch from the world map — the battle continues in place')}
        >🌏 {t('大地圖', 'World')}</button>
        {/* Direct way out — instant for a drill, confirmed for a real battle
            (forfeiting / 棄城 has consequences). The 2D view is retired. */}
        <button
          onClick={() => {
            if (battle.practice || window.confirm(t('確定退出此戰?', 'Leave this battle?'))) {
              cancelBattle();
            }
          }}
          style={{
            marginLeft: '0.4rem',
            background: '#3a1a16', color: '#f0c0b0', border: '1px solid #b8584a',
            padding: '0.3rem 0.8rem', cursor: 'pointer',
            fontFamily: 'Songti SC, serif',
          }}
          title={battle.practice ? t('結束演習', 'End the drill') : t('退出戰鬥', 'Leave the battle')}
        >✕ {battle.practice ? t('結束演習', 'End Drill') : t('退出', 'Exit')}</button>
      </div>

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
       <div ref={canvasWrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* 戰鬥運鏡 — impact flash, remounted per cast to replay its fade */}
        {cine && cine.weight > 0 && (
          <div
            key={cine.key}
            className="tkm-fx-flash"
            style={{
              ['--fx-color' as string]: cine.color,
              ['--fx-peak' as string]: cine.weight >= 2 ? 0.42 : 0.24,
              ['--fx-dur' as string]: cine.weight >= 2 ? '0.42s' : '0.3s',
            } as CSSProperties}
          />
        )}
        <Canvas
          shadows={!IS_MOBILE}
          dpr={IS_MOBILE ? [1, 1.5] : [1, 2]}
          camera={{ position: [target[0] - 8, 40, target[2] + 6], fov: 45 }}
          gl={{ antialias: !IS_MOBILE }}
        >
          <BattleCinematics trigger={cine} />
          {/* Swoop down onto the field from overhead when the battle opens. */}
          <IntroDive
            start={[target[0] - 8, 40, target[2] + 6]}
            end={[target[0] - 8, 14, target[2] + 12]}
            target={target}
            onDone={() => setIntroDone(true)}
          />
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
              enabled={introDone}
              target={target}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={6}
              maxDistance={40}
              enableDamping
              dampingFactor={0.1}
            />
            {/* Fires, beacons and night lanterns glow. */}
            {!IS_MOBILE && (
              <EffectComposer>
                <Bloom luminanceThreshold={0.8} intensity={0.45} mipmapBlur />
              </EffectComposer>
            )}
          </Suspense>
        </Canvas>
       </div>

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

        {/* Hover hex indicator — upgrades to a 戰鬥預判 card when the selected
            unit is yours and you're aiming at an enemy it can strike. */}
        {hovered && (() => {
          const tgt = unitAt(battle, hovered);
          const mine = selectedUnit && playerSide && selectedUnit.side === playerSide;
          const aimable = mine && tgt && tgt.side !== playerSide && tgt.troops > 0
            && canAttack(battle, selectedUnit, tgt);
          if (aimable) {
            const f = forecastAttack(battle, selectedUnit, tgt, officers);
            const ml = matchupLabel(selectedUnit.unitType, tgt.unitType);
            const counterBad = matchupLabel(tgt.unitType, selectedUnit.unitType);
            const verdictColor = f.willKill ? '#7ed68a' : f.matchup === 'strong' ? '#d4e88a'
              : f.matchup === 'weak' ? '#e8a07a' : '#d4a84a';
            return (
              <div style={{
                position: 'absolute', top: 12, right: 12, minWidth: 168,
                background: 'rgba(20, 14, 8, 0.92)', border: `1px solid ${verdictColor}`,
                padding: '0.5rem 0.7rem', color: '#f0e0b0', fontFamily: 'Songti SC, serif',
                fontSize: '0.82rem', boxShadow: `0 0 14px ${verdictColor}44`,
              }}>
                <div style={{ fontWeight: 'bold', color: verdictColor, marginBottom: '0.25rem' }}>
                  ⚔ {t('戰鬥預判', 'Forecast')}{f.willKill ? ` · ${t('可殲滅', 'LETHAL')}` : ''}
                </div>
                <div>{t('預估傷害', 'Damage')}: <b>{f.dmgMin.toLocaleString()}–{f.dmgMax.toLocaleString()}</b></div>
                <div style={{ color: f.counterMax > 0 ? '#e8a07a' : '#8a9a7a' }}>
                  {t('反擊', 'Counter')}: {f.counterMax > 0 ? `${f.counterMin.toLocaleString()}–${f.counterMax.toLocaleString()}` : t('無', 'none')}
                </div>
                {ml && (
                  <div style={{ color: '#9ad6a8' }}>↑ {t(`${ml.zh} ×${f.counterMult.toFixed(2)}`, `${ml.en} ×${f.counterMult.toFixed(2)}`)}</div>
                )}
                {counterBad && (
                  <div style={{ color: '#e88a7a' }}>↓ {t(`被${counterBad.zh}`, `vuln ${counterBad.en}`)}</div>
                )}
                {f.defShield < 1 && (
                  <div style={{ color: '#a0b8d8' }}>🛡 {t('敵據地利', 'enemy terrain')} ×{f.defShield.toFixed(2)}</div>
                )}
                {f.terrainAtk !== 1 && (
                  <div style={{ color: f.terrainAtk > 1 ? '#9ad6a8' : '#e8a07a' }}>
                    {f.terrainAtk > 1 ? '⤴' : '⤵'} {t('我方地形', 'my terrain')} ×{f.terrainAtk.toFixed(2)}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(20, 14, 8, 0.85)', border: '1px solid #5a4530',
              padding: '0.3rem 0.6rem', color: '#d4a84a',
              fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem',
            }}>
              ({hovered.col}, {hovered.row})
            </div>
          );
        })()}

        {/* Action mode hint */}
        {actionMode.kind !== 'none' && myTurn && (() => {
          const config = {
            move: { color: '#7ed68a', text: t('點擊綠色格子移動', 'Click a green tile to move') },
            attack: { color: '#ff7050', text: t('點擊紅色敵軍攻擊', 'Click a red enemy to attack') },
            duel: { color: '#d4a84a', text: t('點擊相鄰敵將一騎打', 'Click an adjacent enemy to duel') },
            stratagem: { color: '#c19a3b', text: t('點擊目標施放計略', 'Click a target to cast stratagem') },
          }[actionMode.kind];
          // 戰法情境預覽 — while a stratagem is armed, read out how the current
          // weather/terrain bends it, before you've even picked a target.
          let sitNote: { zh: string; en: string } | null = null;
          let sitUp = true;
          if (actionMode.kind === 'stratagem' && selectedUnit) {
            const s = battleStratagemSituation(battle, selectedUnit.coord, selectedUnit.coord, actionMode.id);
            sitNote = s.note;
            sitUp = s.mult >= 1;
          }
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
            }}>
              {config.text}
              {sitNote && (
                <span style={{ color: sitUp ? '#9ad6a8' : '#e8a07a', marginLeft: '0.5rem' }}>
                  · {sitUp ? '⊕' : '⊖'} {t(sitNote.zh, sitNote.en)}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {showResults && battle.winner && (
        <BattleResultsModal
          battle={battle}
          playerSide={playerSide}
          onClose={() => {
            // 演習 — a drill leaves no trace: dismiss without writeback.
            // (Clearing the battle unmounts the whole host; no extra close.)
            if (battle.practice) {
              cancelBattle();
              setShowResults(false);
              return;
            }
            const resolution = resolveBattleEnd(battle, officers);
            applyResolution(
              resolution.capturedOfficerIds,
              [...resolution.attackerDead, ...resolution.defenderDead],
              resolution.lootGold,
              resolution.winner,
            );
            setShowResults(false);
          }}
        />
      )}
      {interactiveDuel && (
        <DuelGameModal
          attacker={interactiveDuel.me}
          defender={interactiveDuel.foe}
          onComplete={(outcome) => {
            const { me, foe } = interactiveDuel;
            const killedId = outcome.killedId === 'defender' ? foe.id
              : outcome.killedId === 'attacker' ? me.id : null;
            let next = battle;
            if (killedId) {
              const fallen = next.units.find((u) => u.officerId === killedId);
              const prevCas = next.casualties ?? { attacker: [], defender: [] };
              next = {
                ...next,
                units: next.units.filter((u) => u.officerId !== killedId),
                casualties: fallen
                  ? { ...prevCas, [fallen.side]: [...prevCas[fallen.side], killedId] }
                  : prevCas,
              };
            }
            next = {
              ...next,
              log: [...(next.log ?? []), {
                turn: next.turn,
                text: outcome.winner === 'draw'
                  ? `${me.name.en} and ${foe.name.en} fought to a draw — both wounded.`
                  : `${outcome.winner === 'attacker' ? me.name.en : foe.name.en} bested ${outcome.winner === 'attacker' ? foe.name.en : me.name.en} in single combat!`,
                kind: 'event',
              }],
            };
            start(next);
            setInteractiveDuel(null);
          }}
        />
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
  // Show the officer's FULL 戰法 pool (was silently capped at 8); the list
  // scrolls if it's long, so nothing is hidden.
  const personalTactics = personalTacticsForUnit(officer, unit, 16);
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
                : e.kind === 'starving' ? '#d8b24a'
                : e.kind === 'demoralized' ? '#c89090'
                : '#88b7e8'
              }`,
              color: e.kind === 'burning' ? '#ff7050'
                : e.kind === 'confused' ? '#c19a3b'
                : e.kind === 'starving' ? '#d8b24a'
                : e.kind === 'demoralized' ? '#c89090'
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
          <div style={{ fontSize: '0.62rem', color: '#d4a84a', letterSpacing: '0.15rem', marginBottom: '0.3rem' }}>
            ★ {t('個人戰法', 'PERSONAL')} <span style={{ color: '#6a5238' }}>({personalTactics.length})</span>
          </div>
          <div style={{ maxHeight: 232, overflowY: 'auto', paddingRight: 2 }}>
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
            // 情境 — does this 戰法 suit the weather/terrain right now?
            const sit = battleStratagemSituation(battle, unit.coord, unit.coord, pt.underlying);
            const sitMark = sit.note ? (sit.mult >= 1 ? '⊕' : '⊖') : '';
            const sitColor = sit.mult >= 1 ? '#9ad6a8' : '#e8a07a';
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
                title={`${pt.description}\n\n${t('目標', 'Target')}: ${targetHint}\n${t('範圍', 'Range')}: ${pt.range}${sit.note ? `\n${t('情境', 'Situation')}: ${t(sit.note.zh, sit.note.en)}` : ''}${onCd ? `\n${t('冷卻', 'CD')}: ${cd}t` : ''}`}
                onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: pt.underlying, tacticId: pt.tacticId })}
              >
                {pt.isSignature && <span style={{ color: '#d4a84a' }}>★ </span>}
                {sitMark && <span style={{ color: sitColor, marginRight: 2 }}>{sitMark}</span>}
                <span style={{ color: badge.color, fontSize: '0.6rem', marginRight: 3 }}>[{badge.label}]</span>
                {pt.nameZh}
                <span style={{ float: 'right', color: '#8a7050', fontSize: '0.66rem' }}>
                  {onCd ? `CD ${cd}t` : `r${pt.range}`}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
