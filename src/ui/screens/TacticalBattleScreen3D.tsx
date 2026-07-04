import { Suspense, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { STRATAGEM_RANGE } from '../../game/data/stratagemRanges';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars, SoftShadows, Sparkles } from '@react-three/drei';
import {
  EffectComposer, Bloom, N8AO, ToneMapping, Vignette, SMAA,
  HueSaturation, BrightnessContrast, DepthOfField,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { RENDER_HI } from '../renderQuality';
import { SelectionRing3D } from '../components/SelectionRing3D';
import { useGameStore } from '../../game/state/store';
import { playSfx, playFxSfx, startBattleAmbience, stopBattleAmbience, playMusic, stopMusic, type MusicTrack } from '../../game/systems/sound';
import type { EntityId, FormationId, HexCoord, Officer, StratagemId, TacticalBattle, TacticalTile, TacticalUnit, TerrainKind, TimeOfDay, UnitType, Weather } from '../../game/types';
import type { DefenseBuildingId } from '../../game/data/defenseBuildings';
import { stratagemFxKind, tacticFxKind, tacticFxSpec, FX_DURATION, FX_IMPACT, type TacticFxSpec, type StratagemFxInstance, type StratagemFxKind } from '../../game/data/stratagemFx';
import { categoryOfTactic } from '../../game/data/officerAttributes';
import { applyBattlePrep, applyStratagem, attackUnits, canAttack, canMove, endTurn, hexDistance, moveUnit, resolveBattleEnd, unitAt, tileAt, hexNeighbours, forecastAttack, matchupLabel, battleStratagemSituation, eliteUnitOf, defenderTerrainShield, terrainDamageMod, moveCost, findPath, moveUnitAlong, reachableHexes, isRouting, changeFormation, canChangeFormation, canFortify, fortifyTile, FIELDWORKS_AP_COST, pickAiBattlePrep, pickAiFormation, formationCounterMul, pickDuelChampion, canIssuePreBattleDuel, applyPreBattleDuel, aiMaybePreBattleDuel } from '../../game/systems/tactical';
import { aiTakeTurn, aiSkillForDifficulty } from '../../game/systems/tacticalAi';
import { FORMATIONS } from '../../game/data/formations';
import { canDuel, pickDuelTerrain, rollDuelScar } from '../../game/systems/duel';
import { duelWound } from '../../game/systems/afflictions';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { FORMATIONS_BY_ID, STRATAGEMS } from '../../game/data';
import { BattleResultsModal } from '../components/BattleResultsModal';
import { IntroDive } from '../components/IntroDive';
import { Duel3DStage } from '../components/duel/Duel3DStage';
import { useT, useDesc, useLanguage, pickName } from '../i18n';
import { isReduceMotion } from '../uiPrefs';
import { groundNormalTexture, groundRoughnessTexture } from './battleTextures';

/** Shared normal-map intensity for ground/armour grain. */
const SURFACE_NORMAL_SCALE = new THREE.Vector2(0.5, 0.5);
/** Subtler grain for armour plate so it catches light without looking pitted. */
const ARMOR_NORMAL_SCALE = new THREE.Vector2(0.35, 0.35);
const armorNormal = groundNormalTexture();

/** Tiled clones of the ground grain for the wide shadow-catch skirt. */
const groundSkirtTextures = (() => {
  const tile = (t: THREE.Texture | null) => {
    if (!t) return null;
    const c = t.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(40, 40);
    c.needsUpdate = true;
    return c;
  };
  return { normal: tile(groundNormalTexture()), rough: tile(groundRoughnessTexture()) };
})();

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
  fieldworks: 0.13,   // packed earth bank
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
  fieldworks: '#7a5f3c',  // fresh-dug earth + timber stakes
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

/* ─── Per-unit-type mount (horse / cart / boat) under the rider ──── */
function UnitMount({ unit, onClick }: { unit: TacticalUnit; onClick: () => void }) {
  const click = (e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); };
  if (unit.isSupply) {
    // 糧車 — a tarp-covered grain wagon: a fat box on wheels, sacks heaped on top.
    return (
      <>
        <mesh position={[0, 0.26, 0]} onClick={click} castShadow>
          <boxGeometry args={[0.6, 0.34, 0.92]} />
          <meshStandardMaterial color="#7a5a32" roughness={0.9} />
        </mesh>
        {/* heaped grain sacks under a tarp */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.52, 0.22, 0.8]} />
          <meshStandardMaterial color="#d8c88a" roughness={0.95} />
        </mesh>
        {/* two wheels each side */}
        {([[-0.34, 0.3], [-0.34, -0.3], [0.34, 0.3], [0.34, -0.3]] as const).map(([sx, sz], i) => (
          <mesh key={i} position={[sx, 0.12, sz]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 8]} />
            <meshStandardMaterial color="#3a2818" />
          </mesh>
        ))}
      </>
    );
  }
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
          <cylinderGeometry args={[0.03, 0.03, 1.45, 6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        {/* Tassel below the head */}
        <mesh position={[-0.34, 1.46 + yLift, 0]} castShadow>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#b8442e" roughness={0.7} />
        </mesh>
        {/* Spearhead — broad leaf blade */}
        <mesh position={[-0.34, 1.66 + yLift, 0]} castShadow>
          <coneGeometry args={[0.075, 0.26, 6]} />
          <meshStandardMaterial color="#c4ccd4" metalness={0.7} roughness={0.3} />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'archers') {
    return (
      <>
        {/* Bow — curved torus half, recurve tips */}
        <mesh position={[-0.42, 0.55 + yLift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.30, 0.03, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#4a2e18" roughness={0.6} />
        </mesh>
        {/* Bowstring */}
        <mesh position={[-0.42, 0.55 + yLift, 0]} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.60, 3]} />
          <meshStandardMaterial color="#d8c090" />
        </mesh>
        {/* Nocked arrow */}
        <mesh position={[-0.36, 0.55 + yLift, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 4]} />
          <meshStandardMaterial color="#6a5230" />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'infantry') {
    return (
      <>
        {/* Sword blade — angled across body */}
        <mesh position={[-0.36, 0.50 + yLift, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.05, 0.54, 0.014]} />
          <meshStandardMaterial color="#cdd2d8" metalness={0.65} roughness={0.3} />
        </mesh>
        {/* Crossguard */}
        <mesh position={[-0.30, 0.27 + yLift, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.14, 0.03, 0.03]} />
          <meshStandardMaterial color="#3a2818" metalness={0.3} roughness={0.6} />
        </mesh>
        {/* Round shield in front, with a central boss */}
        <mesh position={[0.31, 0.45 + yLift, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.23, 0.05, 14]} />
          <meshStandardMaterial color="#6a3024" metalness={0.1} roughness={0.7} />
        </mesh>
        <mesh position={[0.34, 0.45 + yLift, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#d4a84a" metalness={0.6} roughness={0.35} />
        </mesh>
      </>
    );
  }
  if (unit.unitType === 'cavalry') {
    return (
      // Lance held forward — couched, with a steel head and a pennon
      <group position={[-0.30, 0.70 + yLift, -0.10]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.026, 0.026, 1.35, 6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.74, 0]} castShadow>
          <coneGeometry args={[0.05, 0.20, 6]} />
          <meshStandardMaterial color="#c4ccd4" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.07, 0.5, 0]} rotation={[0, 0, 0.5]} castShadow>
          <planeGeometry args={[0.16, 0.1]} />
          <meshStandardMaterial color="#b8442e" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  return null; // siege/navy already have their own props on the mount
}


/* ─── FPS 自適應 — sustained sub-26fps drops the cinematic post stack for
 *  the rest of the battle (one-way: no oscillating on/off flicker). ─── */
function AdaptiveFx({ onDegrade }: { onDegrade: () => void }) {
  const acc = useRef({ t: 0, n: 0, bad: 0 });
  useFrame((_, delta) => {
    const a = acc.current;
    a.t += delta; a.n++;
    if (a.t >= 1) {
      const fps = a.n / a.t;
      a.bad = fps < 26 ? a.bad + 1 : 0;
      a.t = 0; a.n = 0;
      if (a.bad >= 3) onDegrade();
    }
  });
  return null;
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
function UnitRetinue({ troops, color, unitType, formation }: { troops: number; color: string; unitType?: string; formation?: string }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const helmetRef = useRef<THREE.InstancedMesh>(null);
  const spearRef = useRef<THREE.InstancedMesh>(null);
  const horseRef = useRef<THREE.InstancedMesh>(null);
  const mounted = unitType === 'cavalry';
  const rideLift = mounted ? 0.26 : 0;   // riders sit above their horses
  // 兵種立繪 — the host's weapon reads its type: a long pike forest for 槍兵,
  // short sabres for 騎兵, sparse light arms for 弓兵, medium for the rest.
  const spearLen = unitType === 'spearmen' ? 1.1 : unitType === 'archers' ? 0.3
    : unitType === 'cavalry' ? 0.5 : 0.5;
  const spearColor = unitType === 'archers' ? '#6a5230' : '#3a2818';
  // 陣形佈列 — the rank-and-file REARRANGES with the side's formation, so a
  // formation switch is visible on the field: wedge for 錐行/鋒矢, ring for
  // 方圓/八卦, deep column for 長蛇/衝軛, wide crescent for 鶴翼/雁行/偃月,
  // loose skirmish scatter for 疏開, tight block otherwise.
  const shape = useMemo(() => {
    switch (formation) {
      case 'arrow-tip': case 'awl': case 'fish-scale': return 'wedge';
      case 'wheel': case 'eight-trigrams': case 'square': return 'ring';
      case 'crane-wing': case 'wild-goose': case 'crescent-moon': return 'crescent';
      case 'spread-out': case 'ten-ambush': return 'scatter';
      case 'back-to-water': case 'trinity': return 'column';
      default: return 'block';
    }
  }, [formation]);
  const slots = useMemo(() => {
    const count = Math.min(HOST_MAX, Math.max(6, Math.round(troops / 420)));
    const out: Array<{ x: number; z: number; ph: number; spear: boolean }> = [];
    for (let i = 0; i < count; i++) {
      const h1 = Math.abs(Math.sin(i * 12.9898 + 1.3));
      const h2 = Math.abs(Math.sin(i * 78.233 + 0.7));
      const jx = (h1 - 0.5) * 0.07, jz = (h2 - 0.5) * 0.07;
      let x = 0, z = 0;
      if (shape === 'wedge') {
        // rows of 1,2,3… — the point faces the enemy (forward = -z? host sits behind hero at -z, point toward hero)
        let row = 0, acc = 0;
        while (acc + row + 1 < i + 1) { acc += row + 1; row++; }
        const idxInRow = i - acc;
        x = (idxInRow - row / 2) * 0.19;
        z = -0.42 - row * 0.17;
      } else if (shape === 'ring') {
        const ang = (i / count) * Math.PI * 2;
        const ringR = 0.34 + 0.12 * (i % 2);
        x = Math.cos(ang) * ringR;
        z = -0.62 + Math.sin(ang) * ringR * 0.8;
      } else if (shape === 'crescent') {
        const tArc = i / Math.max(1, count - 1) - 0.5;       // -0.5..0.5
        x = tArc * 1.35;
        z = -0.78 + Math.abs(tArc) * 0.55; // wings swept forward, centre held back
      } else if (shape === 'scatter') {
        x = (h1 - 0.5) * 1.3;
        z = -0.35 - h2 * 0.9;
      } else if (shape === 'column') {
        const colW = 2;
        x = ((i % colW) - (colW - 1) / 2) * 0.19;
        z = -0.45 - Math.floor(i / colW) * 0.15;
      } else {
        const cols = Math.max(4, Math.round(Math.sqrt(count * 2.4)));
        const r = Math.floor(i / cols), c = i % cols;
        x = (c - (cols - 1) / 2) * 0.165;
        z = -0.5 - r * 0.17;
      }
      out.push({ x: x + jx, z: z + jz, ph: (i * 0.9) % (Math.PI * 2), spear: i % 4 !== 0 });
    }
    return out;
  }, [troops, shape]);
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
      if (helmetRef.current) {
        p.set(sl.x, 0.5 * S + lift, sl.z);
        helmetRef.current.setMatrixAt(i, m.compose(p, q, sc));
      }
      if (sl.spear && spearRef.current) {
        // Taller pikes stand up from the shoulder; short arms sit at the hand.
        p.set(sl.x + 0.12 * S, (0.42 * S + lift) + (spearLen - 0.5) * 0.42 * S, sl.z);
        spearRef.current.setMatrixAt(si++, m.compose(p, q, sc));
      }
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    if (helmetRef.current) helmetRef.current.instanceMatrix.needsUpdate = true;
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
      {/* 兜鍪 — an iron helmet on every footman so the host reads as armoured. */}
      <instancedMesh ref={helmetRef} args={[undefined, undefined, slots.length]} castShadow>
        <coneGeometry args={[0.13, 0.16, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.5} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={spearRef} args={[undefined, undefined, Math.max(1, spearCount)]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, spearLen, 4]} />
        <meshStandardMaterial color={spearColor} />
      </instancedMesh>
    </group>
  );
}

/** 旌旗 — a flag that swings from its pole, each on its own phase so a line of
 *  banners ripples rather than flapping in lockstep. */
function FlutterFlag({ color, poleX, y, big }: { color: string; poleX: number; y: number; big?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const ph = useMemo(() => Math.sin(poleX * 12.9 + y * 7.7) * 6.28, [poleX, y]);
  const w = big ? 0.6 : 0.42, h = big ? 0.42 : 0.28;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 4 + ph;
    ref.current.rotation.y = -0.2 + Math.sin(t) * 0.5;
    ref.current.rotation.z = Math.sin(t * 1.4) * 0.12;
  });
  return (
    <group ref={ref} position={[poleX, y, 0]}>
      <mesh position={[w / 2, 0, 0]} castShadow>
        <planeGeometry args={[w, h, 4, 1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** 戰袍 — a war-cloak draped from the shoulders that billows as it hangs, giving
 *  commanders and riders a heavier, more heroic silhouette. */
function UnitCape({ color, yLift, big }: { color: string; yLift: number; big?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const ph = useMemo(() => Math.sin(yLift * 13.1 + 2.4) * 6.28, [yLift]);
  const cloth = useMemo(() => new THREE.Color(color).multiplyScalar(0.7), [color]);
  const w = big ? 0.52 : 0.44, h = big ? 0.7 : 0.56;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 2.1 + ph;
    ref.current.rotation.x = 0.2 + Math.sin(t) * 0.07;       // billow off the back
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.05;
  });
  return (
    <group ref={ref} position={[-0.18, 0.74 + yLift, 0]}>
      <mesh position={[0, -h / 2, 0]} castShadow>
        <planeGeometry args={[w, h, 2, 3]} />
        <meshStandardMaterial color={cloth} side={THREE.DoubleSide} roughness={0.82} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** 浴血 — battle wear scaled by how much a unit has bled: blood streaks on the
 *  armor, and arrows lodged in it once badly hurt. Static (derived from state). */
function BattleWear({ unit, yLift }: { unit: TacticalUnit; yLift: number }) {
  const dmg = 1 - unit.troops / Math.max(1, unit.maxTroops);
  if (dmg < 0.18) return null;
  const ph = unit.coord.col * 7 + unit.coord.row * 13;
  return (
    <group raycast={() => null}>
      {[0, 1].map((i) => (
        <mesh key={`bl${i}`} position={[i ? -0.13 : 0.15, (0.52 - i * 0.2) + yLift, 0.31]} rotation={[0, 0, i ? -0.5 : 0.4]}>
          <planeGeometry args={[0.08, 0.2]} />
          <meshBasicMaterial color="#5a0f0a" transparent opacity={Math.min(0.85, 0.3 + dmg * 0.6)} depthWrite={false} />
        </mesh>
      ))}
      {dmg > 0.45 && [0, 1, 2].map((i) => {
        const a = ((ph + i * 97) % 360) * Math.PI / 180;
        return (
          <mesh key={`ar${i}`} position={[Math.cos(a) * 0.22, 0.55 + yLift + Math.sin(i * 1.3) * 0.12, Math.sin(a) * 0.22]} rotation={[Math.PI / 2 - 0.4, a, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.34, 4]} />
            <meshStandardMaterial color="#6a5230" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 選定標記 — a pulsing twin ground ring plus a bobbing down-chevron over the
 *  head, so the picked unit is unmistakable even on a small phone screen.
 *  Self-animating (own useFrame) and non-raycasting so it never eats taps. */
function SelectionMarker({ yLift }: { yLift: number }) {
  return <SelectionRing3D radius={0.66} y={0.05} chevronY={1.5 + yLift} />;
}

/** 武將立繪 — a properly proportioned low-poly warrior to replace the old
 *  cylinder-and-sphere "snowman": armoured legs + boots, a layered lamellar
 *  cuirass with tassets, broad curved pauldrons, posed arms with hands, a
 *  gorget and a bowl helmet (commanders add a face beard + a plumed crest).
 *  Faction colour rides on the chest/pauldrons; everything else is iron/leather.
 *  onClick lives on the whole group so the entire figure is one tap target. */
function WarriorFigure({
  color, yLift, isCommander, onClick,
}: {
  color: string;
  yLift: number;
  isCommander: boolean;
  onClick: (e: { stopPropagation: () => void }) => void;
}) {
  const IRON = '#2a2018';
  const LEATHER = '#3a2818';
  const SKIN = '#e0c498';
  const GOLD = '#d4a84a';
  return (
    <group position={[0, yLift, 0]} onClick={onClick}>
      {/* Legs — armoured greaves */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`leg${i}`} position={[x, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.058, 0.34, 8]} />
          <meshStandardMaterial color={IRON} roughness={0.8} metalness={0.18} />
        </mesh>
      ))}
      {/* War boots */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`boot${i}`} position={[x, 0.035, 0.05]} castShadow>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
          <meshStandardMaterial color="#1a120a" roughness={0.85} />
        </mesh>
      ))}
      {/* 戰裙 — tapered armoured skirt (tassets), main tap target */}
      <mesh position={[0, 0.36, 0]} castShadow onClick={onClick}>
        <cylinderGeometry args={[0.30, 0.43, 0.34, 12]} />
        <meshStandardMaterial color={LEATHER} roughness={0.82} metalness={0.1}
          normalMap={armorNormal ?? undefined} normalScale={ARMOR_NORMAL_SCALE} />
      </mesh>
      {/* Front tasset plate — a hanging armour flap */}
      <mesh position={[0, 0.32, 0.36]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.3, 0.04]} />
        <meshStandardMaterial color={IRON} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.08, 12]} />
        <meshStandardMaterial color={GOLD} roughness={0.5} metalness={0.45} />
      </mesh>
      {/* 鎧甲 — layered lamellar cuirass (two stacked tapers), faction colour */}
      <mesh position={[0, 0.68, 0]} castShadow onClick={onClick}>
        <cylinderGeometry args={[0.27, 0.32, 0.28, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3}
          normalMap={armorNormal ?? undefined} normalScale={ARMOR_NORMAL_SCALE} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 0.12, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Chest cross-strap — gold for a commander, leather otherwise */}
      <mesh position={[0, 0.68, 0.26]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.07, 0.4, 0.04]} />
        <meshStandardMaterial color={isCommander ? GOLD : LEATHER} roughness={0.5} metalness={isCommander ? 0.5 : 0.2} />
      </mesh>
      {/* 肩甲 — broad curved pauldrons */}
      {[-0.31, 0.31].map((x, i) => (
        <mesh key={`pauld${i}`} position={[x, 0.86, 0]} scale={[1.1, 0.7, 1.1]} castShadow>
          <sphereGeometry args={[0.15, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.45} metalness={0.35} />
        </mesh>
      ))}
      {/* Arms — upper arm + hand, angled out from the pauldrons */}
      {[-1, 1].map((s, i) => (
        <group key={`arm${i}`} position={[0.28 * s, 0.82, 0.02]} rotation={[0.1, 0, s * 0.2]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.32, 8]} />
            <meshStandardMaterial color={IRON} roughness={0.75} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.34, 0.03]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 護頸 — gorget */}
      <mesh position={[0, 0.94, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.08, 10]} />
        <meshStandardMaterial color={IRON} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.04, 0]} castShadow>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* 美髯 — a general's beard */}
      {isCommander && (
        <mesh position={[0, 0.99, 0.07]} rotation={[0.3, 0, 0]} castShadow>
          <coneGeometry args={[0.07, 0.16, 6]} />
          <meshStandardMaterial color="#2a1c10" roughness={0.85} />
        </mesh>
      )}
      {/* 兜鍪 — bowl helmet for everyone */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={IRON} roughness={0.45} metalness={0.45} />
      </mesh>
      {/* Helmet neck flap */}
      <mesh position={[0, 1.08, -0.1]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.03]} />
        <meshStandardMaterial color={LEATHER} roughness={0.7} metalness={0.15} />
      </mesh>
      {/* Commander crest — gold finial + tall red plume */}
      {isCommander && (
        <>
          <mesh position={[0, 1.27, 0]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.38, -0.02]} rotation={[0.2, 0, 0]} castShadow>
            <coneGeometry args={[0.05, 0.22, 6]} />
            <meshStandardMaterial color="#c0301c" roughness={0.55} />
          </mesh>
        </>
      )}
    </group>
  );
}

function UnitMesh({
  unit, terrainH, isPlayer, selected, onClick, isWounded, lunge, formation,
}: {
  unit: TacticalUnit;
  terrainH: number;
  isPlayer: boolean;
  selected: boolean;
  onClick: () => void;
  isWounded?: boolean;
  /** 突刺 — when this unit just struck a melee blow, thrust toward the target. */
  lunge?: { to: HexCoord; at: number } | null;
  /** 陣形 — the side's active formation shapes the rank-and-file layout. */
  formation?: string;
}) {
  const t = useT();
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
  const bloodRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.MeshBasicMaterial>(null);
  const dustRef = useRef<THREE.Group>(null);
  const navyFoamRef = useRef<THREE.Group>(null);
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
    // 水戰 — navy units rock on the swell and trail foam (stronger when rowing).
    if (unit.unitType === 'navy') {
      g.rotation.z += Math.sin(clock.elapsedTime * 1.5 + tx) * 0.045;
      tgt.y += Math.sin(clock.elapsedTime * 1.2 + tz) * 0.02;
      if (navyFoamRef.current) {
        const wake = moving ? 0.5 : 0.26;
        navyFoamRef.current.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
          if (m && 'opacity' in m) m.opacity = wake * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 5));
        });
      }
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
    // 主將光環 — gentle breathing pulse on the command-range ring.
    if (auraRef.current) auraRef.current.opacity = 0.16 + Math.sin(clock.elapsedTime * 2) * 0.07;
    // 血霧 — on a hit, specks of blood burst outward and fade.
    if (bloodRef.current) {
      const out = (1 - hitT) * 0.55;
      bloodRef.current.children.forEach((c, i) => {
        const a = (i / 7) * Math.PI * 2;
        c.position.set(Math.cos(a) * out, 0.55 + yLift + (1 - hitT) * 0.35 - (1 - hitT) * (1 - hitT) * 0.5, Math.sin(a) * out);
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (m) m.opacity = hitT > 0 ? hitT * 0.9 : 0;
      });
    }
    // 士氣低落 — a unit near breaking sways nervously, so you can SEE which
    // line is about to rout (and which enemy to push).
    if (unit.troops > 0 && hitT === 0 && unit.morale < 35) {
      const fear = (35 - unit.morale) / 35;
      g.rotation.z = Math.sin(clock.elapsedTime * 5.5 + tx * 3) * fear * 0.07;
      // 潰逃姿態 — near-broken units recoil/lean back as if about to bolt.
      g.rotation.x = unit.morale < 20 ? -0.18 * ((20 - unit.morale) / 20) : 0;
    } else if (hitT === 0 && unit.troops > 0) {
      g.rotation.x = 0;
    }
    // 突刺 — strike motion toward the melee target, shaped by unit type:
    // 騎兵踐踏遠衝、槍兵急促突刺、餘者中庸。
    if (lunge && unit.troops > 0) {
      const [lx, lz] = hexWorld(lunge.to.col, lunge.to.row);
      const dx = lx - tx, dz = lz - tz;
      const len = Math.hypot(dx, dz) || 1;
      const reach = unit.unitType === 'cavalry' ? 0.58 : unit.unitType === 'spearmen' ? 0.46 : 0.38;
      const dur = unit.unitType === 'cavalry' ? 0.5 : unit.unitType === 'spearmen' ? 0.28 : 0.36;
      const since = (Date.now() - lunge.at) / 1000;
      const lungeT = since >= 0 && since < dur ? Math.sin((since / dur) * Math.PI) : 0;
      tgt.x += (dx / len) * lungeT * reach;
      tgt.z += (dz / len) * lungeT * reach;
      // Cavalry dips forward as it tramples through.
      if (unit.unitType === 'cavalry') tgt.y -= lungeT * 0.12;
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
      {/* 血霧 — burst specks driven in useFrame on each hit. */}
      <group ref={bloodRef} raycast={() => null}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.04 + (i % 3) * 0.015, 5, 5]} />
            <meshBasicMaterial color={i % 2 ? '#9a0f0a' : '#c41810'} transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* 水戰浪沫 — foam ring + wake trail under a warship. */}
      {unit.unitType === 'navy' && (
        <group ref={navyFoamRef} raycast={() => null}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.6, 20]} />
            <meshBasicMaterial color="#dff2fa" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          {[0, 1].map((i) => (
            <mesh key={i} position={[0, 0.02, 0.55 + i * 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.5 - i * 0.16, 0.12]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
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
      {/* 主將光環 — a command-presence ring marks the general's rallying reach. */}
      {unit.isCommander && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} raycast={() => null}>
          <ringGeometry args={[1.05, 1.28, 40]} />
          <meshBasicMaterial ref={auraRef} color={color} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {/* Mount or vehicle (cavalry horse / siege cart / navy boat) */}
      <UnitMount unit={unit} onClick={onClick} />
      {/* Rank-and-file host behind the hero (footmen read wrong on a boat). */}
      {unit.unitType !== 'navy' && <UnitRetinue troops={unit.troops} color={color} unitType={unit.unitType} formation={formation} />}
      {/* 戰袍 — war-cloak for generals and riders. */}
      {(unit.isCommander || unit.unitType === 'cavalry') && (
        <UnitCape color={color} yLift={yLift} big={unit.isCommander} />
      )}
      {/* 武將本體 — properly proportioned warrior figure (legs, lamellar armour,
          pauldrons, arms, helmet); the whole group is one tap target. */}
      <WarriorFigure
        color={color}
        yLift={yLift}
        isCommander={!!unit.isCommander}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      />
      {/* Per-unit-type weapon */}
      <UnitWeapon unit={unit} yLift={yLift} />
      {/* 浴血 — blood + lodged arrows scaled by damage taken. */}
      <BattleWear unit={unit} yLift={yLift} />
      {/* Banner pole + fluttering flag — commanders fly a taller 大纛. */}
      <mesh position={[0.28, (unit.isCommander ? 1.2 : 1.05) + yLift, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, unit.isCommander ? 1.25 : 0.95, 6]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <FlutterFlag color={color} poleX={0.29} y={(unit.isCommander ? 1.62 : 1.40) + yLift} big={unit.isCommander} />
      {/* Commander 大纛 finial — a small gold ball atop the standard. */}
      {unit.isCommander && (
        <mesh position={[0.28, 1.84 + yLift, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#d4a84a" metalness={0.6} roughness={0.3} />
        </mesh>
      )}
      {/* 選定標記 — pulsing ground ring + bobbing head chevron. */}
      {selected && <SelectionMarker yLift={yLift} />}
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
          fontFamily: 'var(--tkm-font-body)',
          fontSize: '12px',
          color: '#f0e0b0',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          borderRadius: 'var(--tkm-radius-xs)',
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
            {unit.effects.some((e) => e.kind === 'starving') && (
              <span style={{ color: '#caa45a', marginLeft: 3 }} title={t('糧盡兵疲', 'Out of supply')}>糧</span>
            )}
          </div>
          {/* 精銳/異族 — elite-corps banner under the name. */}
          {eliteUnitOf(unit.officerId) && (
            <div style={{ fontSize: '10px', color: '#e0b860', letterSpacing: '1px', marginTop: 1 }}>
              ❖ {eliteUnitOf(unit.officerId)!.zh}
            </div>
          )}
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
              background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
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
function BoardSkirt({ tiles }: { tiles: TacticalTile[] }) {
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
function ZocOverlay({ battle, selectedUnit, playerSide }: {
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
/** 風雷 — occasional lightning over a rainstorm: a high blue-white flash lights
 *  the whole field, with a delayed thunder rumble. Mounted only in rain. */
function StormLightning() {
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
function BattleHaze({ bounds, tint, count = 22 }: { bounds: { x: number; z: number }; tint: string; count?: number }) {
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
            color: dispColor, fontFamily: 'var(--tkm-font-body)', fontSize: `${Math.round(fs * 1.3)}px`, fontWeight: 'bold',
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
          color: dispColor, fontFamily: 'var(--tkm-font-body)',
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
  const ang = useMemo(() => Math.atan2(tz - fz, tx - fx), [fx, fz, tx, tz]);
  const projRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!projRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / 0.5);
    projRef.current.position.x = fx + (tx - fx) * t;
    projRef.current.position.z = fz + (tz - fz) * t;
    projRef.current.position.y = 1.0 + Math.sin(t * Math.PI) * 0.4;
    projRef.current.scale.setScalar(1 - t * 0.5);
    projRef.current.visible = t < 0.98;
    // 斬擊 — the strike blooms into a flash as it lands.
    if (flashRef.current) {
      const it = Math.max(0, (t - 0.6) / 0.4);
      flashRef.current.scale.setScalar(0.1 + it * 0.9);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = it * (1 - it) * 4;
    }
  });
  // Ranged attacks loose a whole volley; melee throws a single arcing strike.
  if (kind === 'ranged') return (
    <>
      <ArrowVolley fx={fx} fz={fz} tx={tx} tz={tz} spawnedAt={spawnedAt} />
      <ArrowImpact x={tx} z={tz} spawnedAt={spawnedAt} />
    </>
  );
  return (
    <>
      {/* glowing strike bolt with a trailing streak along its travel */}
      <group ref={projRef} position={[fx, 1, fz]} rotation={[0, -ang, 0]}>
        <mesh>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshBasicMaterial color="#ffb060" transparent opacity={0.95} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position={[-0.28, 0, 0]}>
          <boxGeometry args={[0.55, 0.07, 0.07]} />
          <meshBasicMaterial color="#ff7a3a" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
      {/* impact flash at the target */}
      <mesh ref={flashRef} position={[tx, 1, tz]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshBasicMaterial color="#fff0c0" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
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
          const ms = trigger.weight >= 3 ? 180 : 85;
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
  const lang = useLanguage();
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
  const formationDef = FORMATIONS_BY_ID[formationId];
  const label = formationDef ? pickName(formationDef.name, lang) : formationId;

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
          fontFamily: 'var(--tkm-font-body)',
          fontSize: '14px',
          fontWeight: 'bold',
          background: 'rgba(20, 14, 8, 0.85)',
          border: `1px solid ${color}`,
          padding: '2px 8px',
          borderRadius: 'var(--tkm-radius-xs)',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 8px ${color}`,
        }}>{side === 'attacker' ? 'A' : 'D'} · {label}</div>
      </Html>}
    </group>
  );
}

/* ─── The whole 3D scene ────────────────────────────────────────────── */
/* ─── 战场天地 — ground skirt + horizon hills so the field sits in a
 *  world instead of floating in the void. Fog fades both away. ───── */
function BattleSurround({ width, height, timeOfDay, weather }: { width: number; height: number; timeOfDay: TimeOfDay; weather: Weather }) {
  const [cx] = hexWorld(Math.floor(width / 2), Math.floor(height / 2));
  const [, cz] = hexWorld(Math.floor(width / 2), Math.floor(height / 2));
  const earth = timeOfDay === 'night' ? '#11161f' : timeOfDay === 'dusk' ? '#4a3828' : '#3d4a2c';
  const hillCol = timeOfDay === 'night' ? '#0c1118' : timeOfDay === 'dusk' ? '#3a2c22' : '#2c3824';
  // 遠山如黛 — a second, taller mountain ring further out, hazed toward the
  // sky (atmospheric perspective): dusk paints it rust, night sinks it blue.
  const farCol = timeOfDay === 'night' ? '#16202e'
    : timeOfDay === 'dusk' ? '#6a4a3c'
    : timeOfDay === 'dawn' ? '#5a5468' : '#54687a';
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
  const farPeaks = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + 0.17;
    const r = 56 + ((i * 41) % 14);
    return {
      x: cx + Math.cos(a) * r * 1.25,
      z: cz + Math.sin(a) * r * 0.85,
      h: 7 + ((i * 67) % 23) / 23 * 10,
      w: 10 + ((i * 31) % 13),
    };
  }), [cx, cz]);
  return (
    <group>
      {/* Ground skirt — a vast earthen disc under and beyond the board */}
      <mesh position={[cx, -0.12, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[90, 48]} />
        <meshStandardMaterial color={earth} roughness={1} />
      </mesh>
      {/* Far range — parallax depth behind the near hills */}
      {farPeaks.map((h, i) => (
        <mesh key={`f${i}`} position={[h.x, h.h / 2 - 0.1, h.z]}>
          <coneGeometry args={[h.w, h.h, 6]} />
          <meshStandardMaterial color={farCol} roughness={1} fog={false} />
        </mesh>
      ))}
      {/* 雪嶺 — snowfall caps the far range white */}
      {weather === 'snow' && farPeaks.map((h, i) => (
        <mesh key={`fs${i}`} position={[h.x, h.h * 0.82, h.z]}>
          <coneGeometry args={[h.w * 0.34, h.h * 0.36, 6]} />
          <meshStandardMaterial color="#dbe4ec" roughness={0.9} fog={false} />
        </mesh>
      ))}
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
      // Plains carpet — denser clumps of grass, spread across the hex.
      if (t.terrain === 'plain' && hsh < 78) {
        const n = 4 + (hsh % 5);
        for (let k = 0; k < n; k++) {
          const a = ((hsh + k * 47) % 100) / 100 * Math.PI * 2;
          const r = 0.15 + ((hsh * (k + 3)) % 70) / 100;
          grass.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
        }
      }
      // Forest undergrowth — a few tufts at the foot of the trees.
      if (t.terrain === 'forest' && hsh < 65) {
        const n = 2 + (hsh % 3);
        for (let k = 0; k < n; k++) {
          const a = ((hsh + k * 61) % 100) / 100 * Math.PI * 2;
          const r = 0.2 + ((hsh * (k + 2)) % 55) / 100;
          grass.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
        }
      }
      // Hills & mountains — scattered scree, a couple of stones each.
      if ((t.terrain === 'hill' || t.terrain === 'mountain') && hsh < 80) {
        const n = 1 + (hsh % 3);
        for (let k = 0; k < n; k++) {
          const a = ((hsh + k * 53) % 100) / 100 * Math.PI * 2;
          const r = 0.3 + ((hsh * (k + 1)) % 40) / 100;
          rocks.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]);
        }
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

/** 鏡頭跟隨 — on the enemy's turn, gently drift the orbit target toward where
 *  the action just landed (latest damage popup); on your turn, ease back to the
 *  board centre. Subtle lerp on controls.target — never wrests manual control. */
function CameraFollow({ battle, playerSide, home, focus = null }: {
  battle: TacticalBattle; playerSide: 'attacker' | 'defender' | null; home: [number, number];
  focus?: [number, number] | null;
}) {
  const controls = useThree((s) => s.controls) as unknown as { target?: THREE.Vector3 } | null;
  const camera = useThree((s) => s.camera);
  // Remember where the camera was so it can ease back after the duel.
  const homeCam = useRef<THREE.Vector3 | null>(null);
  useFrame(() => {
    const tgt = controls?.target;
    if (!tgt) return;
    // 戰場原地對決 — frame the two fighters: pan the target to the midpoint and
    // pull the camera into a close, low angle.
    if (focus) {
      if (!homeCam.current) homeCam.current = camera.position.clone();
      tgt.x += (focus[0] - tgt.x) * 0.07;
      tgt.z += (focus[1] - tgt.z) * 0.07;
      camera.position.lerp(DUEL_CAM.set(focus[0] + 3.5, 5.5, focus[1] + 7), 0.05);
      return;
    }
    if (homeCam.current) {
      camera.position.lerp(homeCam.current, 0.06);
      if (camera.position.distanceTo(homeCam.current) < 0.5) homeCam.current = null;
    }
    let fx = home[0], fz = home[1];
    const aiTurn = !!playerSide && battle.activeSide !== playerSide && !battle.winner;
    if (aiTurn) {
      const recent = (battle.damagePopups ?? []).filter((p) => Date.now() - p.spawnedAt < 1600);
      const last = recent[recent.length - 1];
      if (last) { const [x, z] = hexWorld(last.coord.col, last.coord.row); fx = x; fz = z; }
    }
    tgt.x += (fx - tgt.x) * 0.04;
    tgt.z += (fz - tgt.z) * 0.04;
  });
  return null;
}
const DUEL_CAM = new THREE.Vector3();

const CLASH_SPARKS = Array.from({ length: 16 }, (_, i) => i);
/** 兵器交擊 — a bright flash + flung sparks + a ground shockwave ring where the
 *  two duelists' weapons meet, replayed each round (parent remounts it by key). */
function DuelClash3D({ pos, big = false }: { pos: [number, number, number]; big?: boolean }) {
  const start = useRef<number | null>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Group>(null);
  const mag = big ? 1.9 : 1;   // the killing blow flares larger
  const dur = big ? 0.75 : 0.5;
  useFrame(({ clock }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const e = clock.elapsedTime - start.current;
    const tt = Math.min(1, e / dur);
    if (flashRef.current) {
      flashRef.current.scale.setScalar((0.25 + tt * 1.0) * mag);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - tt) * 0.95;
    }
    if (ringRef.current) {
      const rs = (0.2 + tt * 2.2) * mag;
      ringRef.current.scale.set(rs, rs, rs);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - tt) * 0.7;
    }
    if (sparksRef.current) {
      sparksRef.current.children.forEach((c, i) => {
        const a = (i / CLASH_SPARKS.length) * Math.PI * 2;
        const ease = 1 - (1 - tt) * (1 - tt);   // fling out fast, slow at the end
        const r = ease * 1.1 * mag;
        c.position.set(Math.cos(a) * r, Math.sin(i * 1.7) * 0.5 * ease * mag, Math.sin(a) * r);
        c.rotation.z = a;
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (m) m.opacity = 1 - tt;
      });
    }
  });
  return (
    <group position={pos}>
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshBasicMaterial color={big ? '#ffd0a0' : '#fff0c0'} transparent opacity={0.95} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* ground shockwave */}
      <mesh ref={ringRef} position={[0, -pos[1] + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.46, 32]} />
        <meshBasicMaterial color={big ? '#ffb070' : '#ffe6a0'} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={sparksRef}>
        {CLASH_SPARKS.map((i) => (
          <mesh key={i}>
            <boxGeometry args={[0.035, 0.035, 0.2]} />
            <meshBasicMaterial color={i % 2 ? '#ffd86a' : '#fff2cf'} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 日月 — a glowing sun (day/dawn/dusk) or pale moon (night) hung in the sky at
 *  the light's direction; Bloom gives it a halo. */
function SkyBody({ position, color, night }: { position: [number, number, number]; color: string; night: boolean }) {
  const p: [number, number, number] = [position[0] * 4, position[1] * 3 + 12, position[2] * 4];
  const core = night ? 2.6 : 4;
  return (
    <group position={p} raycast={() => null}>
      <mesh><sphereGeometry args={[core, 20, 20]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh><sphereGeometry args={[core * 1.7, 20, 20]} /><meshBasicMaterial color={color} transparent opacity={0.16} toneMapped={false} depthWrite={false} /></mesh>
    </group>
  );
}

/** 連環船 — iron chains binding two linked ships, drawn as a row of links along
 *  the span (the 赤壁 fleet that can't scatter — and burns as one). */
function ChainLink({ a, c }: { a: HexCoord; c: HexCoord }) {
  const [ax, az] = hexWorld(a.col, a.row);
  const [cx, cz] = hexWorld(c.col, c.row);
  const ang = Math.atan2(cz - az, cx - ax);
  const n = 5;
  return (
    <group raycast={() => null}>
      {Array.from({ length: n }).map((_, i) => {
        const t = (i + 0.5) / n;
        return (
          <mesh key={i} position={[ax + (cx - ax) * t, 0.2, az + (cz - az) * t]} rotation={[Math.PI / 2, 0, ang]}>
            <torusGeometry args={[0.08, 0.025, 5, 8]} />
            <meshStandardMaterial color="#5a554e" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 攻城 — garrison silhouettes man the battlements, and assault ladders lean
 *  against any wall an attacker has reached. A first-pass siege dressing. */
function SiegeOverlay({ battle, playerSide }: { battle: TacticalBattle; playerSide: 'attacker' | 'defender' | null }) {
  const wallTiles = battle.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate');
  if (wallTiles.length === 0) return null;
  const defColor = playerSide === 'defender' ? '#3a7dd9' : '#b8442e';
  const attackers = battle.units.filter((u) => u.side === 'attacker' && u.troops > 0);
  return (
    <>
      {wallTiles.map((t) => {
        const [x, z] = hexWorld(t.coord.col, t.coord.row);
        const adj = attackers.find((a) => hexDistance(a.coord, t.coord) === 1);
        return (
          <group key={`siege-${t.coord.col},${t.coord.row}`} position={[x, 0, z]} raycast={() => null}>
            {/* Defenders on the rampart (walls only — gate is the breach). */}
            {t.terrain === 'wall' && [-0.42, 0.42].map((dx, i) => (
              <group key={i} position={[dx, 1.55, 0]}>
                <mesh><cylinderGeometry args={[0.1, 0.13, 0.32, 6]} /><meshStandardMaterial color={defColor} roughness={0.7} /></mesh>
                <mesh position={[0, 0.24, 0]}><sphereGeometry args={[0.09, 6, 6]} /><meshStandardMaterial color="#e0c498" /></mesh>
                <mesh position={[0.12, 0.26, 0]}><cylinderGeometry args={[0.012, 0.012, 0.62, 4]} /><meshStandardMaterial color="#3a2818" /></mesh>
              </group>
            ))}
            {/* Assault ladder, yawed toward the attacker pressing this wall. */}
            {adj && (() => {
              const [ax, az] = hexWorld(adj.coord.col, adj.coord.row);
              const yaw = Math.atan2(ax - x, az - z);
              return (
                <group rotation={[0, yaw, 0]}>
                  <group position={[0, 0, 0.82]} rotation={[-0.5, 0, 0]}>
                    {[-0.13, 0.13].map((rx, i) => (
                      <mesh key={i} position={[rx, 0.78, 0]}><boxGeometry args={[0.04, 1.7, 0.04]} /><meshStandardMaterial color="#5a4028" roughness={0.9} /></mesh>
                    ))}
                    {[0.2, 0.55, 0.9, 1.25, 1.55].map((ry, i) => (
                      <mesh key={`r${i}`} position={[0, ry, 0]}><boxGeometry args={[0.3, 0.03, 0.03]} /><meshStandardMaterial color="#6a4a30" /></mesh>
                    ))}
                  </group>
                </group>
              );
            })()}
          </group>
        );
      })}
    </>
  );
}

/** 伏兵 — a purple shock-ring + flung debris bursts where a hidden unit springs
 *  its ambush, so the reveal reads as a sudden sally from cover. */
function AmbushBurst({ coord, at }: { coord: HexCoord; at: number }) {
  const ref = useRef<THREE.Group>(null);
  const [x, z] = hexWorld(coord.col, coord.row);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const t = Math.min(1, (Date.now() - at) / 750);
    g.scale.setScalar(0.4 + t * 2.1);
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m && 'opacity' in m) m.opacity = (1 - t) * 0.8;
    });
  });
  return (
    <group ref={ref} position={[x, 0.12, z]} raycast={() => null}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.6, 20]} />
        <meshBasicMaterial color="#9a6ad0" transparent opacity={0.8} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, 0.15 + (i % 3) * 0.1, Math.sin(a) * 0.35]}>
            <boxGeometry args={[0.07, 0.05, 0.02]} />
            <meshBasicMaterial color={i % 2 ? '#6a8a4a' : '#7a6a4a'} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 屍橫 — a fallen unit leaves a mound, a blood/scorch stain, a downed spear
 *  and a scrap of its banner where it died; the field fills with carnage. */
function Corpse({ coord, color }: { coord: HexCoord; color: string }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const r = (coord.col * 7 + coord.row * 13) % 7;
  // 血濺 — an irregular pooled stain plus a ring of cast-off spatter, so a
  // death scars the earth rather than dropping a tidy disc.
  const spatter = useMemo(() => {
    const seed = (coord.col * 131 + coord.row * 197) >>> 0;
    return Array.from({ length: 5 }, (_, i) => {
      const a = (((seed + i * 79) % 100) / 100) * Math.PI * 2;
      const d = 0.4 + (((seed * (i + 3)) % 60) / 100);
      const s = 0.07 + (((seed + i * 17) % 40) / 100) * 0.16;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s };
    });
  }, [coord.col, coord.row]);
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]} raycast={() => null}>
      {/* main pool */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 10]} />
        <meshBasicMaterial color="#34130f" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* cast-off spatter */}
      {spatter.map((sp, i) => (
        <mesh key={i} position={[sp.x, 0.021, sp.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[sp.s, 7]} />
          <meshBasicMaterial color="#3e160f" transparent opacity={0.38} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.06, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.26, 8, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      <mesh position={[0.12, 0.07, 0.05]} rotation={[0, 0.6, Math.PI / 2 - 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.34, 0.04, 0.05]} rotation={[-Math.PI / 2, 0, 0.5]}>
        <planeGeometry args={[0.18, 0.12]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.9} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** 焦土 — a charred, ashen scorch left where ground fire has burned. */
function ScorchMark({ coord }: { coord: HexCoord }) {
  const [x, z] = hexWorld(coord.col, coord.row);
  const r = (coord.col * 11 + coord.row * 17) % 7;
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]} raycast={() => null}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 9]} />
        <meshBasicMaterial color="#0d0a08" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <circleGeometry args={[0.34, 8]} />
        <meshBasicMaterial color="#221a12" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function BattleScene({
  battle, playerSide, actionMode,
  selectedId, hovered, setHovered, onTileClick,
  attackArcs, stratagemFx, officers, embedded = false, duelFocus = null, duelClashKey = 0, duelClashBig = false,
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
  /** 戰場原地對決 — world [x,z] midpoint to frame while a duel plays, or null. */
  duelFocus?: [number, number] | null;
  /** Bumped each duel round to replay a clash spark between the fighters. */
  duelClashKey?: number;
  /** The killing blow gets a bigger, redder clash. */
  duelClashBig?: boolean;
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

  // 屍橫遍野 — accumulate a corpse where each unit falls; persists after the
  // wiped-out husk is pruned, so the battlefield fills with the dead.
  const [fallen, setFallen] = useState<{ id: string; coord: HexCoord; color: string }[]>([]);
  const fallenIds = useRef(new Set<string>());
  useEffect(() => { fallenIds.current = new Set(); setFallen([]); }, [battle.id]);
  useEffect(() => {
    const add: { id: string; coord: HexCoord; color: string }[] = [];
    for (const u of units) {
      if (u.troops <= 0 && !fallenIds.current.has(u.id)) {
        fallenIds.current.add(u.id);
        add.push({ id: u.id, coord: u.coord, color: u.side === playerSide ? '#3a7dd9' : '#b8442e' });
      }
    }
    if (add.length) setFallen((f) => [...f, ...add].slice(-50));
  }, [units, playerSide]);

  // 焦土 — once a hex has burned, leave a charred scorch that lingers after the
  // flames die, so fire leaves a lasting mark on the land.
  const [scorched, setScorched] = useState<HexCoord[]>([]);
  const scorchedKeys = useRef(new Set<string>());
  useEffect(() => { scorchedKeys.current = new Set(); setScorched([]); }, [battle.id]);
  useEffect(() => {
    const add: HexCoord[] = [];
    for (const f of battle.groundFires ?? []) {
      const key = `${f.coord.col},${f.coord.row}`;
      if (!scorchedKeys.current.has(key)) { scorchedKeys.current.add(key); add.push(f.coord); }
    }
    if (add.length) setScorched((s) => [...s, ...add].slice(-60));
  }, [battle.groundFires]);

  // 伏兵奇襲 — burst an ambush FX where a hidden unit just sprang into view.
  const prevHidden = useRef<Set<string>>(new Set());
  const [ambushFx, setAmbushFx] = useState<{ id: string; coord: HexCoord; at: number }[]>([]);
  useEffect(() => {
    const sprung: { id: string; coord: HexCoord; at: number }[] = [];
    for (const u of units) {
      if (prevHidden.current.has(u.id) && !u.hidden && u.troops > 0) {
        sprung.push({ id: `amb-${u.id}-${Date.now()}`, coord: u.coord, at: Date.now() });
      }
    }
    prevHidden.current = new Set(units.filter((u) => u.hidden).map((u) => u.id));
    if (sprung.length) {
      setAmbushFx((f) => [...f, ...sprung]);
      sprung.forEach((s) => setTimeout(() => setAmbushFx((f) => f.filter((x) => x.id !== s.id)), 1000));
    }
  }, [units]);

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
    const m = new Map<string, 'move' | 'attack' | 'path' | 'cast' | 'aoe'>();
    if (!selectedUnit || !playerSide || selectedUnit.side !== playerSide) return m;
    if (actionMode.kind === 'move') {
      // Full move range this turn (multi-step), not just adjacent hexes.
      for (const k of reachableHexes(battle, selectedUnit)) m.set(k, 'move');
    } else if (actionMode.kind === 'attack') {
      for (const u of units) {
        if (u.side !== playerSide && canAttack(battle, selectedUnit, u)) {
          m.set(`${u.coord.col},${u.coord.row}`, 'attack');
        }
      }
    } else if (actionMode.kind === 'stratagem') {
      // 計謀預覽 — tint the castable range; ring the hovered cell's splash.
      const def = STRATAGEM_RANGE[actionMode.id];
      if (def && !def.self) {
        const maxR = def.nightMax != null && battle.timeOfDay === 'night' ? def.nightMax : def.max;
        for (const t of tiles) {
          const d = hexDistance(selectedUnit.coord, t.coord);
          if (d >= def.min && d <= maxR) m.set(`${t.coord.col},${t.coord.row}`, 'cast');
        }
        if (hovered && def.aoe > 0) {
          const hd = hexDistance(selectedUnit.coord, hovered);
          if (hd >= def.min && hd <= maxR) {
            for (const t of tiles) {
              if (hexDistance(hovered, t.coord) <= def.aoe) m.set(`${t.coord.col},${t.coord.row}`, 'aoe');
            }
          }
        }
      }
    }
    // 行軍路線 — show the selected unit's standing march order (amber waypoints).
    for (const w of selectedUnit.path ?? []) m.set(`${w.col},${w.row}`, 'path');
    return m;
  }, [battle, selectedUnit, playerSide, actionMode, tiles, units, hovered]);

  return (
    <EmbeddedSceneCtx.Provider value={embedded}>
      {/* Scene globals — fog, surround hills, stars, lights, shadow-catch
          ground and weather all belong to the FULLSCREEN battle only; as an
          embedded diorama the host scene provides its own. */}
      {!embedded && (
        <>
          <fog attach="fog" args={[lighting.fog[0], fogNear, fogFar]} />
          <BattleSurround width={battle.width} height={battle.height} timeOfDay={battle.timeOfDay} weather={battle.weather} />
          {lighting.showStars && <Stars radius={80} depth={50} count={2500} factor={3} fade speed={0.5} />}
          <SkyBody position={lighting.sun.position} color={lighting.sun.color} night={lighting.showStars} />
          <CameraFollow battle={battle} playerSide={playerSide} home={[hexWorld(battle.width / 2, battle.height / 2)[0], hexWorld(battle.width / 2, battle.height / 2)[1]]} focus={duelFocus} />

          {/* Percentage-closer soft shadows — contact-tight near the feet,
              softening with distance so units sit IN the field, not on it.
              High tier only — shadows are off entirely on the 流暢 tier. */}
          {RENDER_HI && <SoftShadows size={26} samples={16} focus={0.7} />}

          {/* Lighting per time-of-day */}
          <ambientLight intensity={lighting.ambient} />
          <directionalLight
            position={lighting.sun.position}
            intensity={lighting.sun.intensity}
            color={lighting.sun.color}
            castShadow
            // 陰影分檔 — the map resolution follows the board: a skirmish
            // board doesn't rasterise a 4k shadow atlas (D15).
            shadow-mapSize-width={battle.width * battle.height <= 120 ? 1024 : battle.width * battle.height <= 216 ? 2048 : 4096}
            shadow-mapSize-height={battle.width * battle.height <= 120 ? 1024 : battle.width * battle.height <= 216 ? 2048 : 4096}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
            shadow-camera-left={-24}
            shadow-camera-right={24}
            shadow-camera-top={24}
            shadow-camera-bottom={-24}
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
            <meshStandardMaterial
              color="#1a1408"
              normalMap={groundSkirtTextures.normal ?? undefined}
              normalScale={SURFACE_NORMAL_SCALE}
              roughnessMap={groundSkirtTextures.rough ?? undefined}
              roughness={0.96}
            />
          </mesh>

          {/* Weather particles */}
          {/* 戰塵 — ambient battlefield haze, except when rain washes it away. */}
          {battle.weather !== 'rain' && battle.weather !== 'snow' && <BattleHaze bounds={bounds} tint={lighting.fog[0]} />}
          {battle.weather === 'rain' && <RainParticles bounds={bounds} />}
          {battle.weather === 'rain' && !isReduceMotion() && <StormLightning />}
          {battle.weather === 'snow' && <SnowParticles bounds={bounds} />}
          {battle.weather === 'wind' && battle.windDirection && battle.windDirection !== 'calm' && (
            <WindStreaks bounds={bounds} dir={battle.windDirection} />
          )}
          {/* 流螢微塵 — drifting motes (cool at night, warm embers at dusk) that
              thicken the air; Bloom catches them for a glow. */}
          {(battle.timeOfDay === 'dusk' || battle.timeOfDay === 'night') && !isReduceMotion() && (
            <Sparkles
              count={110}
              position={[bounds.x / 2, 2.2, bounds.z / 2]}
              scale={[bounds.x + 6, 4.5, bounds.z + 6]}
              size={battle.timeOfDay === 'night' ? 2.2 : 3}
              speed={0.3}
              opacity={0.7}
              color={battle.timeOfDay === 'night' ? '#aac4ff' : '#ffb060'}
              noise={1.5}
            />
          )}
        </>
      )}
      <FieldDressing tiles={tiles} />
      {/* 兵器交擊 — clash spark between the duelists (also in the map diorama). */}
      {duelFocus && duelClashKey > 0 && <DuelClash3D key={duelClashKey} pos={[duelFocus[0], 1.0, duelFocus[1]]} big={duelClashBig} />}

      {/* All tiles — prisms batched into one InstancedMesh, per-tile
          overlays/interaction rendered on top. */}
      <InstancedTilePrisms tiles={tiles} hovered={hovered} />
      <BoardSkirt tiles={tiles} />
      {/* 控制區紅網 — where the enemy line grips (ZoC +1 AP to break away). */}
      <ZocOverlay battle={battle} selectedUnit={selectedUnit ?? null} playerSide={playerSide} />
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
                instancedBase
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

      {/* 屍橫遍野 — the accumulated dead (skipped in the lightweight diorama). */}
      {!embedded && scorched.map((c, i) => <ScorchMark key={`scorch-${c.col}-${c.row}-${i}`} coord={c} />)}
      {!embedded && fallen.map((c) => <Corpse key={`corpse-${c.id}`} coord={c.coord} color={c.color} />)}
      {/* 伏兵奇襲 — reveal bursts where ambushers sprang. */}
      {ambushFx.map((a) => <AmbushBurst key={a.id} coord={a.coord} at={a.at} />)}
      {/* 攻城 — wall defenders + assault ladders (siege battles only). */}
      {!embedded && <SiegeOverlay battle={battle} playerSide={playerSide} />}
      {/* 連環船 — chains binding linked fleets. */}
      {(() => {
        const drawn = new Set<string>();
        const links: React.ReactNode[] = [];
        for (const u of units) {
          const ce = u.effects.find((e) => e.kind === 'chained') as { chainedWith?: EntityId[] } | undefined;
          if (!ce?.chainedWith) continue;
          for (const pid of ce.chainedWith) {
            const key = [u.id, pid].sort().join('|');
            if (drawn.has(key)) continue;
            drawn.add(key);
            const p = units.find((x) => x.id === pid);
            if (p && u.troops > 0 && p.troops > 0) links.push(<ChainLink key={key} a={u.coord} c={p.coord} />);
          }
        }
        return links;
      })()}

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
            formation={u.side === 'attacker' ? battle.attackerFormation : battle.defenderFormation}
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
  const [paused, setPaused] = useState(false);
  const setBattleSpeed = useGameStore((s) => s.setBattleSpeed);
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
  const afflictOfficer = useGameStore((s) => s.afflictOfficer);
  const inflictDuelScar = useGameStore((s) => s.inflictDuelScar);
  const recordDeed = useGameStore((s) => s.recordDeed);
  const cancelBattle = useGameStore((s) => s.cancelTacticalBattle);
  const endDrill = useGameStore((s) => s.endPracticeDrill);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const battleSpeed = useGameStore((s) => s.battleSpeed);
  const difficulty = useGameStore((s) => s.difficulty);
  const battleDifficulty = useGameStore((s) => s.battleDifficulty ?? null);
  const aiStrength = useGameStore((s) => s.aiStrength ?? 3);
  const battleDiff = battleDifficulty ?? difficulty;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HexCoord | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>({ kind: 'none' });

  // Keyboard shortcuts: mirror the 2D screen.
  // 1=move, 2=attack, 3=duel, Esc=cancel, Space=end turn, Tab=cycle.
  // ── 战场音效 — ambience for the duration, log-driven stings for events.
  useEffect(() => {
    startBattleAmbience();
    return () => { stopBattleAmbience(); stopMusic(); };
  }, []);
  const musicPhase = useRef<MusicTrack | null>(null);
  const [bloodKey, setBloodKey] = useState(0);
  const prevMyTroops = useRef<number | null>(null);
  const sfxCursor = useRef(0);
  useEffect(() => {
    const log = battle?.log ?? [];
    if (sfxCursor.current > log.length) sfxCursor.current = 0; // new battle
    for (let i = sfxCursor.current; i < log.length; i++) {
      const t = log[i]?.text ?? '';
      // 運鏡 — a gate breaching or a flood gets a hard camera kick; a charge a
      // lighter one. setCine drives the canvas punch (reduced-motion safe).
      const kick = (weight: number, color: string) => setCine({ key: ++cineCount.current, weight, color });
      if (t.includes('告破') || t.includes('崩塌') || t.includes('焚斷')) { playSfx('crash'); kick(3, '#ff5030'); }
      else if (t.includes('決堤') || t.includes('山崩')) { playSfx('quake'); kick(3, '#5a9bd5'); }
      else if (t.includes('火') || t.includes('烈焰')) playSfx('fire');
      else if (t.includes('馳援') || t.includes('糧盡')) playSfx('horn');
      else if (t.includes('夜襲') || t.includes('殺到')) { playSfx('shout'); kick(2, '#ffd54a'); }
      else if (t.includes('搶修') || t.includes('猛撞') || t.includes('轟擊')) playSfx('thud');
      else if (t.includes('傾下') || t.includes('射出')) playSfx('arrow');
      // 腹背受敵 — a tense war-drum roll + a kick when the trap closes on a foe.
      else if (t.includes('腹背受敵')) { playSfx('wardrum'); kick(2, '#ff9a3a'); }
      // 衝鋒陷陣 — a war cry + a camera kick when a line storms in or scales a wall.
      else if (t.includes('突貫') || t.includes('踏牆') || t.includes('先登') || t.includes('陷陣') || t.includes('突騎')) { playSfx('shout'); kick(2, '#ffd54a'); }
      // 鳴金 — a struck gong when morale collapses or a line is shattered.
      else if (t.includes('士氣大墮') || t.includes('士氣大挫') || t.includes('軍心動搖') || t.includes('軍心惶惶') || t.includes('大亂') || t.includes('潰')) playSfx('retreat');
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
        start(endTurn(battle, officers));
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
  // 開戰對峙 — a matchup card slams in over the opening swoop, then fades.
  const [showOpening, setShowOpening] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShowOpening(false), 2800);
    return () => clearTimeout(id);
  }, []);
  const [interactiveDuel, setInteractiveDuel] = useState<{ me: Officer; foe: Officer; meFatigue: number; foeFatigue: number; reinforcements: Officer[]; terrain?: import('../../game/systems/duel').DuelTerrain; preBattle?: boolean } | null>(null);
  // 敵將叫陣 — an aggressive enemy adjacent to one of your officers may challenge
  // you at the top of your turn; accept to duel, or refuse.
  const [challenge, setChallenge] = useState<{ me: Officer; foe: Officer; meFatigue: number; foeFatigue: number; reinforcements: Officer[] } | null>(null);
  const challengeTurn = useRef(-1);
  // 斬/擒 — after a duel KOs an enemy, the victor chooses their fate.
  const [captureChoice, setCaptureChoice] = useState<{ id: string; name: { zh: string; en: string } } | null>(null);
  // 兵器交擊 — bumps each duel round so a spark burst replays between the fighters.
  const [duelClashKey, setDuelClashKey] = useState(0);
  const duelClashBig = useRef(false);
  const [voiceLine, setVoiceLine] = useState<{ text: string; key: number } | null>(null);
  // N7 — signature-tactic banner overlay state
  const [signatureBanner, setSignatureBanner] = useState<{ zh: string; en: string; key: number } | null>(null);
  // FPS 自適應 — once the frame rate stays low, shed the post stack for good.
  const [fxDegraded, setFxDegraded] = useState(false);
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
    if (isReduceMotion()) return;  // 減少動畫 — skip the camera punch entirely.
    const el = canvasWrapRef.current;
    if (!el || typeof el.animate !== 'function') return;
    const a = cine.weight >= 3 ? 17 : cine.weight >= 2 ? 11 : 5;
    el.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${a}px,${-a * 0.7}px) scale(1.04)` },
        { transform: `translate(${-a}px,${a * 0.6}px) scale(1.04)` },
        { transform: `translate(${a * 0.6}px,${a * 0.5}px) scale(1.02)` },
        { transform: `translate(${-a * 0.4}px,${-a * 0.3}px) scale(1.01)` },
        { transform: 'translate(0,0) scale(1)' },
      ],
      { duration: cine.weight >= 3 ? 520 : cine.weight >= 2 ? 430 : 260, easing: 'ease-out' },
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

  // 音樂分層 — the score climbs with the battle: 緊張 → 鏖戰(climax)→ 勝/敗.
  // Deduped (playMusic restarts the track), so it only switches on a phase change.
  useEffect(() => {
    if (!battle) return;
    let track: MusicTrack;
    if (battle.winner) {
      track = battle.winner === playerSide ? 'victory' : 'defeat';
    } else {
      const frac = (side: 'attacker' | 'defender') => {
        const st = battle.startTroops?.[side] ?? 1;
        const cur = battle.units.filter((u) => u.side === side && u.troops > 0).reduce((s, u) => s + u.troops, 0);
        return cur / Math.max(1, st);
      };
      track = (Math.min(frac('attacker'), frac('defender')) < 0.5 || battle.turn >= 8) ? 'battle' : 'tension';
    }
    if (musicPhase.current !== track) { musicPhase.current = track; playMusic(track); }
  }, [battle?.winner, battle?.turn, battle?.units, playerSide]);

  // 受創血暈 — flash red screen-edges when YOUR army loses troops.
  useEffect(() => {
    if (!battle || !playerSide) return;
    const mine = battle.units.filter((u) => u.side === playerSide).reduce((s, u) => s + u.troops, 0);
    if (prevMyTroops.current != null && mine < prevMyTroops.current - 50) setBloodKey((k) => k + 1);
    prevMyTroops.current = mine;
  }, [battle?.units, playerSide]);

  // AI takes its turn after a short delay when it's not the player's side —
  // or on the player's side too, when 委託指揮 is engaged.
  useEffect(() => {
    if (!battle || battle.winner) return;
    if (paused) return;  // 暫停 — freeze the AI's auto-advance
    if (playerSide && (battle.activeSide !== playerSide || autoPilot)) {
      const delay = Math.max(150, 700 / Math.max(1, battleSpeed));
      const id = setTimeout(() => {
        // 委託指揮做活 — handing a battle to the AI shouldn't waste the opening:
        // on turn 1 the delegated side lays a battle prep (§5.7) and re-forms to
        // counter the enemy if it's being out-shaped (worth the turn of disorder
        // before the lines meet). Yields after setup so the move comes next tick.
        if (autoPilot && battle.turn === 1 && playerSide && !battle.prepUsed?.[playerSide]) {
          let working = battle;
          const enemySide = playerSide === 'attacker' ? 'defender' : 'attacker';
          const ourForm = playerSide === 'attacker' ? working.attackerFormation : working.defenderFormation;
          const enemyForm = enemySide === 'attacker' ? working.attackerFormation : working.defenderFormation;
          if (ourForm && enemyForm && canChangeFormation(working, playerSide) && formationCounterMul(enemyForm, ourForm) > 1) {
            const myArms = working.units.filter((u) => u.side === playerSide && u.troops > 0).map((u) => u.unitType);
            const cmdInt = officers[working.units.find((u) => u.side === playerSide && u.isCommander)?.officerId ?? '']?.stats.intelligence ?? 70;
            working = changeFormation(working, playerSide, pickAiFormation(myArms, cmdInt, { counter: enemyForm }));
          }
          for (const kind of pickAiBattlePrep(working, playerSide, officers)) {
            const r = applyBattlePrep(working, playerSide, kind, officers);
            if (r.ok) { working = r.battle; break; }
          }
          if (working !== battle) { start(working); return; }
        }
        // 敵將致師 — on turn 1 the enemy may open with its own champion's challenge
        // (auto-resolved; it sets the tone before either host advances).
        if (battle.turn === 1 && battle.activeSide !== playerSide && !battle.preDuelUsed?.[battle.activeSide]) {
          const pd = aiMaybePreBattleDuel(battle, battle.activeSide, officers, Math.random);
          if (pd.issued) {
            if (pd.line) { setSignatureBanner({ ...pd.line, key: Date.now() }); setTimeout(() => setSignatureBanner(null), 2200); }
            setCine({ key: ++cineCount.current, weight: 3, color: '#ffd54a' });
            start(pd.battle);
            return;
          }
        }
        const result = aiTakeTurn(battle, officers, Math.random, {
          skill: aiSkillForDifficulty(battleDiff, aiStrength),
          // 委託指揮 — when the whole battle is delegated, let bold officers
          // settle scores by auto-resolved 陣前單挑 (no interactive prompt).
          autoDuel: autoPilot,
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
          setCine({ key: ++cineCount.current, weight: 3, color: '#ffd54a' });  // 名場面:全運鏡
          setTimeout(() => setSignatureBanner(null), 2400);
        }
        start(battleAfterLogs);
      }, delay);
      return () => clearTimeout(id);
    }
  }, [battle, officers, playerSide, start, battleSpeed, battleDiff, aiStrength, autoPilot, paused]);

  // 勝負定格 — on decision, a dramatic camera kick (FOV punch + hitstop) and a
  // slam-in banner play before the results modal slides in.
  useEffect(() => {
    if (battle?.winner && !showResults) {
      const won = playerSide && battle.winner === playerSide;
      setCine({ key: ++cineCount.current, weight: 3, color: won ? '#ffd54a' : '#ff5030' });
      const id = setTimeout(() => setShowResults(true), 1500);
      return () => clearTimeout(id);
    }
  }, [battle?.winner, showResults]);

  // Pop voice lines from the battle log to the ticker.
  useEffect(() => {
    if (!battle?.log || battle.log.length === 0) return;
    const last = battle.log[battle.log.length - 1];
    if (last.kind === 'voice' || last.kind === 'arrival') {
      setVoiceLine({ text: last.text, key: Date.now() });
      // 會戰入場 — a column riding onto the field gets its horn; allied
      // relief blows a touch grander than a plain reinforcement.
      if (last.kind === 'arrival') playSfx(last.text.includes('盟軍') ? 'victory' : 'horn');
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

  // 戰場原地對決 — the two duelists' units (by their original officers) and the
  // world midpoint the camera frames while the bout plays.
  const duelUnitCoords = interactiveDuel
    ? (() => {
        const a = battle.units.find((u) => u.officerId === interactiveDuel.me.id);
        const b = battle.units.find((u) => u.officerId === interactiveDuel.foe.id);
        return a && b ? { a: a.coord, b: b.coord } : null;
      })()
    : null;
  const duelFocus: [number, number] | null = duelUnitCoords
    ? (() => {
        const [ax, az] = hexWorld(duelUnitCoords.a.col, duelUnitCoords.a.row);
        const [bx, bz] = hexWorld(duelUnitCoords.b.col, duelUnitCoords.b.row);
        return [(ax + bx) / 2, (az + bz) / 2];
      })()
    : null;
  // Each exchange: both fighters lunge at each other + a camera kick.
  const onDuelRound = (r: { hit: 'a' | 'd' | 'both'; killed: boolean }) => {
    if (!duelUnitCoords) return;
    // spawnedAt must be a Date.now() stamp — the lunge anim reads (Date.now()-at).
    const now = Date.now();
    const id1 = now, id2 = now + 1;
    setAttackArcs((arcs) => [...arcs,
      { id: id1, from: duelUnitCoords.a, to: duelUnitCoords.b, kind: 'melee' as const, spawnedAt: now },
      { id: id2, from: duelUnitCoords.b, to: duelUnitCoords.a, kind: 'melee' as const, spawnedAt: now },
    ]);
    setTimeout(() => setAttackArcs((arcs) => arcs.filter((x) => x.id !== id1 && x.id !== id2)), 600);
    setCine({ key: ++cineCount.current, weight: r.killed ? 3 : 1, color: r.killed ? '#ff5030' : '#ffd54a' });
    // Replay the clash spark a beat later, when the lunges meet in the middle.
    // 決勝 — the killing blow gets a bigger, redder burst (the freeze-frame
    // hitstop + zoom-punch already fire via the weight-3 cine above).
    duelClashBig.current = r.killed;
    setTimeout(() => setDuelClashKey((k) => k + 1), 180);
  };

  // 敵將叫陣 — once per turn, a brave/strong enemy next to one of your duel-capable
  // officers may call you out. Accepting opens the bout (no AP cost — it's their
  // initiative); the foe carries any 車輪戰 fatigue.
  useEffect(() => {
    if (!myTurn || interactiveDuel || challenge || !playerSide) return;
    if (autoPilot) return; // 委託指揮 — duels auto-resolve; don't interrupt with a prompt
    if (challengeTurn.current === battle.turn) return;
    challengeTurn.current = battle.turn;
    for (const e of battle.units) {
      if (e.side === playerSide || e.troops <= 0) continue;
      const foe = officers[e.officerId];
      if (!foe || !canDuel(foe).ok) continue;
      const seeksDuels = foe.traits?.some((tr) => tr === 'martial-valor' || tr === 'reckless' || tr === 'matchless' || tr === 'wrathful');
      const aggro = (seeksDuels ? 0.34 : 0) + Math.max(0, (foe.stats.war - 80) / 100);
      if (Math.random() > Math.min(0.6, 0.12 + aggro)) continue;
      const meUnit = battle.units.find((u) => u.side === playerSide && u.troops > 0
        && hexDistance(u.coord, e.coord) === 1
        && officers[u.officerId] && canDuel(officers[u.officerId]!).ok);
      if (!meUnit) continue;
      const reinforcements = battle.units
        .filter((ru) => ru.side === playerSide && ru.troops > 0 && ru.ap > 0 && ru.officerId !== meUnit.officerId
          && hexDistance(ru.coord, e.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      setChallenge({
        me: officers[meUnit.officerId]!, foe,
        meFatigue: meUnit.duelFatigue ?? 0, foeFatigue: e.duelFatigue ?? 0, reinforcements,
      });
      break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTurn, battle.turn]);

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
    if (actionMode.kind === 'move') {
      // 兵種動作音 — hoofbeats / oars / trundling siege / marching feet.
      const moveSfx = () => playSfx(selectedUnit.unitType === 'navy' ? 'whoosh'
        : selectedUnit.unitType === 'siege' ? 'thud' : 'march');
      // Adjacent hex → a single step; a manual order cancels any standing march.
      if (canMove(battle, selectedUnit, c)) {
        moveSfx();
        const moved = moveUnit(battle, selectedUnit.id, c);
        start({ ...moved, units: moved.units.map((u) => (u.id === selectedUnit.id ? { ...u, path: undefined } : u)) });
        setActionMode({ kind: 'none' });
        return;
      }
      // 多步命令 — a farther empty hex: pathfind, walk as far as AP allows now,
      // and queue the remainder to resume at the start of the next turn.
      if (!unitAt(battle, c)) {
        const path = findPath(battle, selectedUnit, c);
        if (path.length > 0) {
          moveSfx();
          const { battle: after, remaining } = moveUnitAlong(battle, selectedUnit.id, path);
          start({ ...after, units: after.units.map((u) => (u.id === selectedUnit.id ? { ...u, path: remaining.length > 0 ? remaining : undefined } : u)) });
          setActionMode({ kind: 'none' });
          return;
        }
      }
    }
    if (actionMode.kind === 'attack' && u && u.side !== playerSide && canAttack(battle, selectedUnit, u)) {
      const kind: 'melee' | 'ranged' = selectedUnit.unitType === 'archers' || selectedUnit.unitType === 'siege' ? 'ranged' : 'melee';
      const aid = Date.now();
      // Per-type attack sting: 砲車轟然 / 弓矢呼嘯 / 騎兵吶喊 / 白刃相交.
      playSfx(kind === 'ranged'
        ? (selectedUnit.unitType === 'siege' ? 'crash' : 'arrow')
        : (selectedUnit.unitType === 'cavalry' ? 'shout' : 'sword'));
      setAttackArcs((a) => [...a, { id: aid, from: selectedUnit.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setAttackArcs((a) => a.filter((x) => x.id !== aid)), 600);
      const afterAtk = attackUnits(battle, selectedUnit.id, u.id, officers, Math.random);
      start(afterAtk);
      // 殲滅頓幀 — a killing blow gets the full impact; slaying a COMMANDER gets
      // the kill-cam beat: the longest hitstop + a 「斬將」 banner.
      const slain = afterAtk.units.find((x) => x.id === u.id);
      if (u.troops > 0 && (!slain || slain.troops <= 0)) {
        if (u.isCommander) {
          setCine({ key: ++cineCount.current, weight: 3, color: '#ff5030' });
          const nm = officers[u.officerId]?.name.zh ?? '敵將';
          setSignatureBanner({ zh: `斬 ${nm}！`, en: `${officers[u.officerId]?.name.en ?? 'Commander'} slain!`, key: Date.now() });
          setTimeout(() => setSignatureBanner(null), 2200);
        } else {
          setCine({ key: ++cineCount.current, weight: 2, color: '#ff5030' });
        }
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
      // 三英戰呂布 — allies pressing the same foe can leap in mid-bout.
      const reinforcements = battle.units
        .filter((ru) => ru.side === playerSide && ru.troops > 0 && ru.ap > 0 && ru.officerId !== me.id
          && hexDistance(ru.coord, u.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      // 車輪戰 — each fighter opens winded by the bouts they've already fought.
      setInteractiveDuel({ me, foe, meFatigue: selectedUnit.duelFatigue ?? 0, foeFatigue: u.duelFatigue ?? 0, reinforcements, terrain: pickDuelTerrain() });
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
          setCine({ key: ++cineCount.current, weight: 3, color: '#ffd54a' });  // 名場面:全運鏡
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
    start(endTurn(battle, officers));
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
        fontFamily: 'var(--tkm-font-body)',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <strong>{t('戰術戰鬥', 'Tactical Battle')} · 3D</strong>
        <span style={{ fontSize: '0.85rem', color: '#d4a84a' }}>
          {t('第', 'Turn')} {battle.turn} {t('回', '')} · {myTurn ? <span style={{ color: '#7ed68a' }}>{t('我方回合', 'YOUR TURN')}</span> : <span style={{ color: '#ff7050' }}>{t('敵方回合', 'ENEMY TURN')}</span>}
        </span>
        {(() => {
          // 戰局氣勢 — momentum is +ve for the attacker; show it from the player's view.
          const favor = Math.max(-100, Math.min(100, (playerSide === 'defender' ? -1 : 1) * (battle.momentum ?? 0)));
          const pct = (favor + 100) / 2; // 0..100, 50 = even
          const label = favor >= 25 ? t('順勢', 'Surging') : favor <= -25 ? t('頹勢', 'Faltering') : t('均勢', 'Even');
          const col = favor >= 25 ? '#7ed68a' : favor <= -25 ? '#ff7050' : '#caa15a';
          return (
            <span title={t('戰局氣勢 — 殺敵/斬將取勢,順勢全軍勇,頹勢軍心搖', 'Battle momentum — kills & felling commanders swing the tide; the leader presses, the loser bleeds')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: col }}>
              {t('氣勢', 'Tide')}
              <span style={{ position: 'relative', width: 72, height: 7, background: '#2a1f12', border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-xs)' }}>
                <span style={{ position: 'absolute', left: '50%', top: -1, bottom: -1, width: 1, background: '#7a6038' }} />
                <span style={{ position: 'absolute', left: `${Math.min(pct, 50)}%`, width: `${Math.abs(pct - 50)}%`, top: 0, bottom: 0, background: col, opacity: 0.85, borderRadius: 'var(--tkm-radius-xs)' }} />
              </span>
              {label}
            </span>
          );
        })()}
        {battle.turn >= 10 && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(90,40,20,0.5)', border: '1px solid #c0703a', color: '#e0a070',
          }} title={t('久戰糧道枯竭 — 雙方傷害遞減', 'Prolonged siege drains supply — both sides take falling damage')}>
            ⏳ {t('久戰', 'Fatigue')} −{Math.min(40, 5 * (battle.turn - 9))}%
          </span>
        )}
        {/* 臨陣變陣 — re-form mid-battle (costs a turn of disorder; few-turn cooldown). */}
        {playerSide && (() => {
          const cur = playerSide === 'attacker' ? battle.attackerFormation : battle.defenderFormation;
          const ready = myTurn && canChangeFormation(battle, playerSide) && !battle.winner;
          return (
            <select
              value={cur ?? 'none'}
              disabled={!ready}
              title={ready ? t('臨陣變陣 — 全軍暫陷亂一回合,冷卻3回合', 'Re-form mid-battle — the whole army is briefly disordered; few-turn cooldown') : t('變陣冷卻中 / 非我方回合', 'Re-form on cooldown / not your turn')}
              onChange={(e) => { if (ready) start(changeFormation(battle, playerSide, e.target.value as FormationId)); }}
              style={{
                fontSize: '0.72rem', background: 'rgba(20,14,8,0.9)', color: ready ? '#d4a84a' : '#7a6038',
                border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-xs)', padding: '1px 4px', fontFamily: 'var(--tkm-font-body)',
                opacity: ready ? 1 : 0.6,
              }}
            >
              {FORMATIONS.map((f) => (
                <option key={f.id} value={f.id}>{t('陣', 'Form')}:{f.name.zh}</option>
              ))}
            </select>
          );
        })()}
        {/* 戰鬥目標 — surface the player's win condition. */}
        {(() => {
          const obj = playerSide === 'attacker' ? battle.attackerObjective : battle.defenderObjective;
          const lbl: Record<string, [string, string]> = {
            'destroy-commander': ['斬敵主將', 'Slay the enemy commander'],
            'hold-tile': ['守住要地', 'Hold the position'],
            'escape': ['主將脫出戰場', 'Escape with your commander'],
            'survive-turns': ['堅守到援軍', 'Survive'],
            'escort': ['護送脫出', 'Escort to the edge'],
            'capture-supply': ['奪取糧倉', 'Seize the supply dump'],
          };
          const k = obj?.kind ?? 'destroy-commander';
          const [zh, en] = lbl[k] ?? ['殲敵或斬將', 'Rout or slay the foe'];
          const prog = obj?.turnsRequired ? ` ${obj.progress ?? 0}/${obj.turnsRequired}` : '';
          return (
            <span style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: 'rgba(40,28,18,0.7)', border: '1px solid #7ec0e0', color: '#9ed0ea',
            }} title={t('本戰勝利條件', 'Victory condition')}>
              🎯 {t(zh, en)}{prog}
            </span>
          );
        })()}
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
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#a89070',
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
          background: 'rgba(40, 28, 18, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#a89070',
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
        {/* 速度 / 暫停 — pace the auto-advance, or freeze to read the board. */}
        <button
          onClick={() => setPaused((v) => !v)}
          title={t('暫停 / 繼續推演', 'Pause / resume')}
          style={{
            fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer',
            background: paused ? 'rgba(212,168,74,0.25)' : 'rgba(40, 28, 18, 0.7)',
            border: `1px solid ${paused ? '#d4a84a' : '#5a4530'}`,
            color: paused ? '#f0d98a' : '#a89070', fontFamily: 'inherit',
          }}
        >{paused ? '▶ 繼續' : '⏸ 暫停'}</button>
        <button
          onClick={() => setBattleSpeed(battleSpeed >= 4 ? 1 : battleSpeed * 2)}
          title={t('推演速度', 'Playback speed')}
          style={{
            fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer',
            background: 'rgba(40, 28, 18, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
            color: '#a89070', fontFamily: 'inherit',
          }}
        >⏩ {battleSpeed}×</button>
        {/* 撤退 — concede and pull out: you lose the field, but your standing
            units withdraw intact (no pursuit / 掩殺). */}
        {myTurn && !battle.winner && playerSide && !battle.practice && (
          <button
            onClick={() => {
              if (!window.confirm(t('撤兵退走?此戰判負,但現存部隊得以保全。', 'Withdraw? You concede the field, but your standing units escape intact.'))) return;
              const foe = playerSide === 'attacker' ? 'defender' : 'attacker';
              playSfx('horn');
              start({ ...battle, winner: foe, withdrew: true });
            }}
            title={t('撤兵 — 判負但保全現存兵力', 'Withdraw — concede but save your surviving troops')}
            style={{
              fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer',
              background: 'rgba(60,30,20,0.7)', border: '1px solid #b8584a', color: '#e0a090', fontFamily: 'inherit',
            }}
          >🏳 {t('撤退', 'Withdraw')}</button>
        )}
        {/* 戰前準備 — one card, played before your first move. */}
        {myTurn && battle.turn === 1 && playerSide && !battle.prepUsed?.[playerSide] && !prepDismissed && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#d4a84a' }}>{t('戰前部署:', 'Prep:')}</span>
            {([
              { kind: 'ambush' as const, zh: '⚔ 伏兵', tip: '最強一軍潛伏 — 敵近不見,首擊帶伏擊加成、且亂敵陣腳' },
              { kind: 'night' as const, zh: '🌙 夜襲', tip: '入夜開戰 — 弓弩射程縮短,夜霧蔽視,伏兵傷害更狠' },
              { kind: 'tunnel' as const, side: 'attacker' as const, zh: '⛏ 地道', tip: '攻城方限定 — 最弱一軍自地道潛入牆內(守將機警則中伏)' },
              { kind: 'caltrops-trap' as const, side: 'defender' as const, zh: '🪤 拒馬', tip: '守方限定 — 陣前布鐵蒺藜陷坑,挫銳騎(騎兵 2.5× 傷)' },
              { kind: 'fire-prep' as const, side: 'attacker' as const, zh: '🔥 火計', tip: '攻城方限定 — 預伏油薪,開局敵營已起火(雨雪不可)' },
              { kind: 'decoy' as const, zh: '🚩 疑兵', tip: '虛張旗鼓 — 敵疑我眾,開局士氣 −10' },
            ]).filter((p) => !('side' in p) || p.side === playerSide).map((p) => (
              <button
                key={p.kind}
                title={p.tip}
                onClick={() => {
                  const r = applyBattlePrep(battle, playerSide, p.kind, officers);
                  if (r.ok) { start(r.battle); playSfx('shout'); }
                  else setPrepMsg(r.reason ?? null);
                }}
                style={{
                  background: 'rgba(58, 45, 24, 0.8)', border: '1px solid #d4a84a', color: '#f0d98a',
                  fontSize: '0.7rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{p.zh}</button>
            ))}
            {/* 致師 — call out the enemy's champion before a blow is struck; a
                win sets the tone of the whole battle (士氣大振). Spends the slot. */}
            {canIssuePreBattleDuel(battle, playerSide, officers) && (
              <button
                title={t('致師搦戰 — 遣本陣最強之將陣前單挑敵將。勝則三軍士氣大振(+18),敗則奪氣(−22)。佔本回合部署。',
                  'Pre-battle challenge — send your champion to duel the enemy\'s. A win lifts your whole host (+18 morale), a loss cows it (−22). Spends your turn-1 prep.')}
                onClick={() => {
                  const myChamp = pickDuelChampion(battle, playerSide, officers);
                  const foeSide = playerSide === 'attacker' ? 'defender' : 'attacker';
                  const foeChamp = pickDuelChampion(battle, foeSide, officers);
                  if (!myChamp || !foeChamp) { setPrepMsg(t('無人可出陣', 'no champion to send')); return; }
                  const me = officers[myChamp.officerId];
                  const foe = officers[foeChamp.officerId];
                  if (!me || !foe) return;
                  setInteractiveDuel({ me, foe, meFatigue: myChamp.duelFatigue ?? 0, foeFatigue: foeChamp.duelFatigue ?? 0, reinforcements: [], terrain: pickDuelTerrain(), preBattle: true });
                }}
                style={{ background: 'rgba(70, 30, 24, 0.85)', border: '1px solid #e0846a', color: '#ffb098', fontSize: '0.7rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}
              >{t('🐎 致師', '🐎 Challenge')}</button>
            )}
            <button
              onClick={() => setPrepDismissed(true)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#8a7050', fontSize: '0.7rem', padding: '2px 6px', cursor: 'pointer', fontFamily: 'inherit' }}
            >{t('不備', 'Skip')}</button>
            {prepMsg && <span style={{ fontSize: '0.72rem', color: '#ff9080' }}>{prepMsg}</span>}
          </span>
        )}
        {battle.attackerFormation && battle.attackerFormation !== 'none' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(60, 26, 22, 0.7)', border: '1px solid #b8442e', color: '#ff9078',
          }}>A: {(() => { const f = FORMATIONS_BY_ID[battle.attackerFormation]; return f ? pickName(f.name, lang) : battle.attackerFormation; })()}</span>
        )}
        {battle.defenderFormation && battle.defenderFormation !== 'none' && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 7px',
            background: 'rgba(26, 40, 60, 0.7)', border: '1px solid #3a7dd9', color: '#88b7e8',
          }}>D: {(() => { const f = FORMATIONS_BY_ID[battle.defenderFormation]; return f ? pickName(f.name, lang) : battle.defenderFormation; })()}</span>
        )}
        <button
          onClick={onEndTurn}
          disabled={!myTurn}
          style={{
            background: '#5a4530', color: '#f0e0b0', border: '1px solid #d4a84a',
            padding: '0.3rem 0.7rem', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)',
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
            fontFamily: 'var(--tkm-font-body)',
          }}
          title={t('回大地圖觀戰 — 戰鬥在原地繼續', 'Watch from the world map — the battle continues in place')}
        >🌏 {t('大地圖', 'World')}</button>
        {/* Direct way out — instant for a drill, confirmed for a real battle
            (forfeiting / 棄城 has consequences). The 2D view is retired. */}
        <button
          onClick={() => {
            if (battle.practice) { endDrill(); return; } // bank 練度/歷練 by result
            if (window.confirm(t('確定退出此戰?', 'Leave this battle?'))) {
              cancelBattle();
            }
          }}
          style={{
            marginLeft: '0.4rem',
            background: '#3a1a16', color: '#f0c0b0', border: '1px solid #b8584a',
            padding: '0.3rem 0.8rem', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)',
          }}
          title={battle.practice ? t('結束演習', 'End the drill') : t('退出戰鬥', 'Leave the battle')}
        >✕ {battle.practice ? t('結束演習', 'End Drill') : t('退出', 'Exit')}</button>
      </div>

      {/* 3D canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
       <div ref={canvasWrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* 受創血暈 — red edges flash when your army takes losses. */}
        {bloodKey > 0 && <div key={bloodKey} className="tkm-blood-vignette" />}
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
          // Phones: cap the pixel ratio (a DPR-3 phone otherwise renders at 2×
          // = ~4× the fragments) and drop shadow maps — both are pure GPU-memory
          // wins that keep the battle scene from tipping the tab into an
          // out-of-memory reload while the strategic map context is also alive.
          shadows={RENDER_HI}
          dpr={RENDER_HI ? [1, 2] : [1, 1.5]}
          camera={{ position: [target[0] - 8, 40, target[2] + 6], fov: 45 }}
          gl={{
            // High tier: SMAA in the composer handles edges. Low tier (no
            // composer): fall back to hardware MSAA.
            antialias: !RENDER_HI,
            // The composer applies AgX tone mapping as its final pass, so on the
            // high tier the renderer stays linear to avoid double tone-mapping.
            // With the composer gated off (low tier) the renderer must apply AgX
            // itself, or the scene renders washed-out and linear.
            toneMapping: RENDER_HI ? THREE.NoToneMapping : THREE.AgXToneMapping,
          }}
        >
          <BattleCinematics trigger={cine} />
          {/* Swoop down onto the field from overhead when the battle opens. */}
          <IntroDive
            start={[target[0] - 8, 40, target[2] + 6]}
            end={[target[0] - 8, IS_MOBILE ? 11 : 14, target[2] + (IS_MOBILE ? 9 : 12)]}
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
              duelFocus={duelFocus}
              duelClashKey={duelClashKey}
              duelClashBig={duelClashBig.current}
            />
            <OrbitControls
              makeDefault
              enabled={introDone}
              target={target}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={6}
              maxDistance={40}
              enablePan
              panSpeed={IS_MOBILE ? 1.1 : 0.8}
              rotateSpeed={0.7}
              enableDamping
              dampingFactor={IS_MOBILE ? 0.2 : 0.1}
              // 觸控操作 — 單指平移地圖(而非旋轉,旋轉會吃掉點擊),雙指縮放/旋轉。
              touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
            />
            {/* Cinematic post stack: ambient-occlusion grounding, bloom for
                fires/beacons, a warm grade, vignette, and AgX tone mapping.
                Depth-of-field kicks in only to frame a duel. The whole stack is
                the priciest thing on screen (N8AO especially), so it runs on the
                精緻 tier only — the 流暢 tier renders straight to screen with the
                renderer's own AgX tone mapping (set on the Canvas gl above). */}
            {RENDER_HI && !fxDegraded && <AdaptiveFx onDegrade={() => setFxDegraded(true)} />}
            {RENDER_HI && !fxDegraded && (
            <EffectComposer enableNormalPass multisampling={0}>
              <N8AO
                aoRadius={1.2}
                intensity={2.4}
                distanceFalloff={1.0}
                quality="performance"
                halfRes
              />
              <Bloom luminanceThreshold={0.7} intensity={0.6} mipmapBlur />
              {duelFocus ? (
                <DepthOfField
                  target={[duelFocus[0], 1.0, duelFocus[1]]}
                  focalLength={0.04}
                  bokehScale={5}
                  height={480}
                />
              ) : (
                <></>
              )}
              <HueSaturation saturation={0.12} />
              <BrightnessContrast brightness={0.0} contrast={0.12} />
              <Vignette eskil={false} offset={0.25} darkness={0.62} />
              <ToneMapping mode={ToneMappingMode.AGX} />
              <SMAA />
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
            fontFamily: 'var(--tkm-font-body)',
            minWidth: 200,
            boxShadow: '0 0 16px rgba(184, 68, 46, 0.4)',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
              {(() => { const o = officers[selectedUnit.officerId]; return o ? pickName(o.name, lang) : '?'; })()} ({UNIT_GLYPH[selectedUnit.unitType]})
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a89070' }}>
              {t('敵', 'ENEMY')} · {t(officers[selectedUnit.officerId]?.name.zh ?? '', officers[selectedUnit.officerId]?.name.en ?? '')}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              HP {selectedUnit.troops.toLocaleString()}/{selectedUnit.maxTroops.toLocaleString()} ·
              AP {selectedUnit.ap}/{selectedUnit.maxAp} · Mor {selectedUnit.morale}
              {isRouting(selectedUnit) && <span style={{ color: '#e0623a', fontWeight: 'bold' }}> · {t('潰走', 'ROUTING')}</span>}
              {(selectedUnit.fatigue ?? 0) > 0 && <span style={{ color: (selectedUnit.fatigue ?? 0) >= 70 ? '#e0623a' : '#caa15a' }}> · {t('疲', 'Ftg')} {Math.round(selectedUnit.fatigue ?? 0)}</span>}
              {selectedUnit.maxAmmo !== undefined && <span style={{ color: (selectedUnit.ammo ?? 0) <= 0 ? '#e0623a' : '#88b7e8' }}> · {t('矢', 'Amo')} {selectedUnit.ammo ?? 0}/{selectedUnit.maxAmmo}</span>}
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
              fontFamily: 'var(--tkm-font-body)',
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
              fontFamily: 'var(--tkm-font-body)',
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
              fontFamily: 'var(--tkm-font-body)',
              fontSize: '0.9rem',
              color: '#e8c878',
              letterSpacing: '0.07rem',
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
                padding: '0.5rem 0.7rem', color: '#f0e0b0', fontFamily: 'var(--tkm-font-body)',
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
          // 地勢一覽 — terrain name + what standing here actually does:
          // defence shield, move cost, and (with one of yours selected)
          // how the ground bends that unit's blows.
          const tl = tileAt(battle, hovered);
          const TER_ZH: Record<string, [string, string]> = {
            plain: ['平原', 'Plain'], forest: ['森林', 'Forest'], mountain: ['山地', 'Mountain'],
            river: ['大河', 'River'], road: ['道路', 'Road'], ice: ['冰面', 'Ice'],
            hill: ['高地', 'Hill'], marsh: ['沼澤', 'Marsh'], desert: ['沙磧', 'Desert'],
            chokepoint: ['隘口', 'Defile'], bridge: ['橋樑', 'Bridge'], gate: ['城門', 'Gate'],
            wall: ['城牆', 'Wall'], watchtower: ['瞭望台', 'Watchtower'], fieldworks: ['築壘', 'Fieldworks'],
          };
          const ter = tl ? (TER_ZH[tl.terrain] ?? [tl.terrain, tl.terrain]) : null;
          const shield = tl ? defenderTerrainShield(tl.terrain) : 1;
          const cost = moveCost(battle, hovered);
          const atkMod = tl && mine ? terrainDamageMod(selectedUnit!.unitType, tl.terrain) : 1;
          return (
            <div style={{
              position: 'absolute', top: 12, right: 12, minWidth: 128,
              background: 'rgba(20, 14, 8, 0.88)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--tkm-radius-lg)',
              padding: '0.35rem 0.6rem', color: '#d4b98a',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem', lineHeight: 1.5,
            }}>
              <div style={{ color: '#e8d9b0' }}>
                {ter ? (lang === 'zh' ? ter[0] : ter[1]) : '—'}
                <span style={{ color: '#7a8893', marginLeft: 6, fontFamily: 'ui-monospace, monospace', fontSize: '0.68rem' }}>({hovered.col},{hovered.row})</span>
              </div>
              {shield < 1 && (
                <div style={{ color: '#9ad6a8' }}>🛡 {t(`守此格受擊 ×${shield.toFixed(2)}`, `defence ×${shield.toFixed(2)}`)}</div>
              )}
              {cost < 99 && cost > 1 && (
                <div style={{ color: '#c0a878' }}>👣 {t(`移入耗 ${cost} AP`, `${cost} AP to enter`)}</div>
              )}
              {cost >= 99 && (
                <div style={{ color: '#e8a07a' }}>✕ {t('不可通行', 'impassable')}</div>
              )}
              {mine && atkMod !== 1 && (
                <div style={{ color: atkMod > 1 ? '#9ad6a8' : '#e8a07a' }}>
                  {atkMod > 1 ? '⤴' : '⤵'} {t(`我軍在此出擊 ×${atkMod.toFixed(2)}`, `attacking from here ×${atkMod.toFixed(2)}`)}
                </div>
              )}
            </div>
          );
        })()}

        {/* 戰場小地圖 — corner overview of all units. */}
        <BattleMinimap battle={battle} playerSide={playerSide} />

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
              fontFamily: 'var(--tkm-font-body)',
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

      {/* 開戰對峙 — the two commanders square off as the battle opens. */}
      {showOpening && !battle.winner && (() => {
        const cmdr = (side: 'attacker' | 'defender') => {
          const c = battle.units.find((u) => u.side === side && u.isCommander)
            ?? battle.units.find((u) => u.side === side);
          const o = c ? officers[c.officerId] : null;
          return o ? pickName(o.name, lang) : '？';
        };
        const tally = (side: 'attacker' | 'defender') =>
          battle.units.filter((u) => u.side === side).reduce((s, u) => s + u.troops, 0);
        const me = playerSide ?? 'attacker';
        const foe = me === 'attacker' ? 'defender' : 'attacker';
        // 自動戰鬥預覽 — a rough win estimate from troops weighted by 武+統.
        const power = (side: 'attacker' | 'defender') =>
          battle.units.filter((u) => u.side === side && u.troops > 0).reduce((s, u) => {
            const o = officers[u.officerId];
            const f = o ? 1 + ((o.stats.war + o.stats.leadership) - 100) / 220 : 1;
            return s + u.troops * Math.max(0.5, f);
          }, 0);
        const mp = power(me), fp = power(foe);
        const win = Math.round((mp / Math.max(1, mp + fp)) * 100);
        const winColor = win >= 58 ? '#7ed68a' : win >= 42 ? '#d4a84a' : '#e8704a';
        return (
          <div className="tkm-victory-sub" style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
            zIndex: 1400, pointerEvents: 'none', textAlign: 'center',
            fontFamily: 'var(--tkm-font-body)', whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: '0.9rem', color: '#d4a84a', letterSpacing: '0.5rem', marginBottom: '0.4rem' }}>
              ⚔ {t('兩軍對壘', 'THE ARMIES MEET')} ⚔
            </div>
            <div style={{ fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', fontWeight: 700, color: '#f0e0b0', textShadow: '0 2px 12px #000, 0 0 20px rgba(0,0,0,0.6)' }}>
              <span style={{ color: '#7ed6e0' }}>{cmdr(me)}</span>
              <span style={{ color: '#e8a07a', margin: '0 1rem' }}>⚔</span>
              <span style={{ color: '#ff8a6a' }}>{cmdr(foe)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', color: '#a89070', marginTop: '0.3rem', fontFamily: 'ui-monospace, monospace' }}>
              {tally(me).toLocaleString()} {t('對', 'vs')} {tally(foe).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9rem', color: winColor, marginTop: '0.35rem', letterSpacing: '0.07rem' }}>
              {t('預估勝算', 'Est. odds')} ~{win}%
            </div>
          </div>
        );
      })()}

      {/* 勝負定格 — the big character slams in over the frozen field, holds a
          beat, then hands off to the results modal. */}
      {battle.winner && !showResults && (() => {
        const won = !!playerSide && battle.winner === playerSide;
        const ch = won ? '勝' : '敗';
        const col = won ? '#ffd54a' : '#e8584a';
        const sub = won ? t('凱旋', 'Victory') : t('敗北', 'Defeat');
        return (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1500, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.5) 100%)',
          }}>
            <div className="tkm-victory-slam" style={{
              fontFamily: 'var(--tkm-font-body)', fontWeight: 'bold', fontSize: 'min(40vh, 30vw)',
              color: col, lineHeight: 1,
              textShadow: `0 0 30px ${col}, 0 0 8px #000, 4px 6px 0 rgba(0,0,0,0.5)`,
            }}>{ch}</div>
            <div className="tkm-victory-sub" style={{
              fontFamily: 'var(--tkm-font-body)', fontSize: 'clamp(1rem, 4vw, 2rem)',
              color: col, letterSpacing: '0.14rem', marginTop: '0.5rem',
              textShadow: '0 2px 8px #000',
            }}>{sub}</div>
          </div>
        );
      })()}

      {showResults && battle.winner && (
        <BattleResultsModal
          battle={battle}
          playerSide={playerSide}
          onClose={() => {
            // 演習 — a drill leaves no real casualties, but now banks 練度 +
            // 武將歷練 scaled by how the garrison fared (endPracticeDrill).
            if (battle.practice) {
              endDrill();
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
      {/* 敵將叫陣 — accept to duel, or refuse. */}
      {challenge && !interactiveDuel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'grid', placeItems: 'center', zIndex: 140 }}>
          <div style={{ width: 'min(420px,92vw)', background: 'linear-gradient(160deg,#241a10,#140d06)', border: '1px solid #b8442e', padding: '1.4rem', textAlign: 'center', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', boxShadow: '0 0 30px rgba(184,68,46,0.4)' }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.3rem', color: '#e0846a', marginBottom: '0.5rem' }}>⚔ {t('陣前叫陣', 'A CHALLENGE')}</div>
            <div style={{ fontSize: '1.5rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t(`${challenge.foe.name.zh} 立馬陣前,大喝挑戰!`, `${challenge.foe.name.en} rides forth and calls you out!`)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#aab6c0', marginBottom: '1.2rem' }}>
              {t(`「${challenge.me.name.zh},可敢與我一戰?」`, `"${challenge.me.name.en} — do you dare face me?"`)}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setInteractiveDuel({ ...challenge, terrain: pickDuelTerrain() }); setChallenge(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >{t('應戰!', 'Accept!')}</button>
              <button
                onClick={() => setChallenge(null)}
                style={{ flex: 1, padding: '0.6rem', background: '#1e2832', border: '1px solid #364654', color: '#aab6c0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1rem' }}
              >{t('避戰', 'Refuse')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 斬/擒 — the defeated foe's fate is yours to decide. */}
      {captureChoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 145 }}>
          <div style={{ width: 'min(420px,92vw)', background: 'linear-gradient(160deg,#241a10,#140d06)', border: '1px solid #e6c473', padding: '1.4rem', textAlign: 'center', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3' }}>
            <div style={{ fontSize: '1.4rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t(`${captureChoice.name.zh} 已敗於你劍下!`, `${captureChoice.name.en} falls before you!`)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#aab6c0', marginBottom: '1.2rem' }}>{t('斬之以絕後患,還是生擒以圖招攬?', 'Cut them down — or take them alive to win over?')}</div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => { start({ ...battle, forcedKills: [...(battle.forcedKills ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🗡 {t('斬', 'Slay')}</button>
              <button
                onClick={() => { start({ ...battle, forcedCaptures: [...(battle.forcedCaptures ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#2a4a2a,#16301a)', border: '1px solid #86f29a', color: '#d0ffd8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🪢 {t('生擒', 'Capture')}</button>
            </div>
          </div>
        </div>
      )}

      {interactiveDuel && (
        <Duel3DStage
          attacker={interactiveDuel.me}
          defender={interactiveDuel.foe}
          meFatigue={interactiveDuel.meFatigue}
          foeFatigue={interactiveDuel.foeFatigue}
          reinforcements={interactiveDuel.reinforcements}
          terrain={interactiveDuel.terrain ?? 'plain'}
          staged
          onRound={onDuelRound}
          onComplete={(outcome) => {
            const { foe } = interactiveDuel;
            // 援護 — the officer who actually finished the bout (may be a relief).
            const me = (outcome.attackerId && officers[outcome.attackerId]) || interactiveDuel.me;
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
            // 一騎討 — a decisive duel sways both armies: the victor's side is
            // emboldened (+10), the bested side shaken (−15), with a banner + kick.
            // 致師 — a pre-battle challenge sets the tone, so it swings harder
            // (+18 / −22) and spends the side's turn-1 special (applyPreBattleDuel).
            const meSide = battle.units.find((u) => u.officerId === me.id)?.side;
            const preBattle = !!interactiveDuel.preBattle;
            if (outcome.winner !== 'draw') {
              const winSide = outcome.winner === 'attacker' ? meSide : (meSide === 'attacker' ? 'defender' : 'attacker');
              const loseSide = winSide === 'attacker' ? 'defender' : 'attacker';
              if (winSide && preBattle && meSide) {
                next = applyPreBattleDuel(next, meSide, winSide);
              } else if (winSide) {
                next = {
                  ...next,
                  units: next.units.map((u) => u.side === winSide ? { ...u, morale: Math.min(100, u.morale + 10) }
                    : u.side === loseSide ? { ...u, morale: Math.max(0, u.morale - 15) } : u),
                };
              }
              // 負傷 — the bested fighter is personally mauled: their own unit
              // loses ~18% of its troops (on top of the side-wide morale hit),
              // which also makes the post-battle wound roll likelier.
              const loserId = outcome.winner === 'attacker' ? foe.id : me.id;
              if (loserId !== killedId) {
                next = { ...next, units: next.units.map((u) => u.officerId === loserId ? { ...u, troops: Math.round(u.troops * 0.82) } : u) };
              }
              const wn = outcome.winner === 'attacker' ? me : foe;
              setSignatureBanner(preBattle
                ? { zh: `致師奏功 — ${wn.name.zh} 陣前折服敵將!`, en: `${wn.name.en} wins the pre-battle challenge!`, key: Date.now() }
                : { zh: `一騎討 — ${wn.name.zh} 力克強敵!`, en: `${wn.name.en} wins the duel!`, key: Date.now() });
              setCine({ key: ++cineCount.current, weight: 3, color: '#ffd54a' });
              setTimeout(() => setSignatureBanner(null), 2200);
            } else {
              // 兩敗俱傷 — a draw mauls both: each loses ~10% of its troops.
              next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, troops: Math.round(u.troops * 0.9) } : u) };
              // A drawn 致師 still spends the slot and leaves both hosts tense.
              if (preBattle && meSide) next = applyPreBattleDuel(next, meSide, 'draw');
            }
            // 車輪戰 — both surviving fighters are more winded for any next bout.
            next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, duelFatigue: (u.duelFatigue ?? 0) + 24 } : u) };
            start(next);
            // 養傷 — a survivor of the bout carries a lingering wound (−武力 for a
            // few seasons): the bested fighter is hurt worse; a draw mauls both.
            if (outcome.winner === 'draw') {
              if (me.id !== killedId) afflictOfficer(me.id, duelWound(false));
              if (foe.id !== killedId) afflictOfficer(foe.id, duelWound(false));
            } else {
              const woundedId = outcome.winner === 'attacker' ? foe.id : me.id;
              if (woundedId !== killedId) {
                afflictOfficer(woundedId, duelWound(true));
                // 傷殘 — a brutal field duel may cripple the bested-but-living fighter
                // for good (斷臂/目眇/跛足) — a permanent narrowing of their craft.
                const scar = rollDuelScar();
                if (scar) inflictDuelScar(woundedId, scar);
              }
              // 名聲榜 — the victor banks a 單挑 win toward their renown.
              recordDeed(outcome.winner === 'attacker' ? me.id : foe.id, { duelsWon: 1 });
            }
            setInteractiveDuel(null);
            // 斬/擒 — you cut the foe down; choose whether to take them alive.
            if (killedId && killedId === foe.id) setCaptureChoice({ id: foe.id, name: foe.name });
          }}
        />
      )}
    </div>
  );
}

/* ─── Selected unit side panel — actions, stratagems, duel, etc. ─── */
/** 戰場小地圖 — a corner overview of the whole field: dots for every standing
 *  unit (your side blue, the foe red, commanders ringed), so a big board stays
 *  legible at a glance. */
function BattleMinimap({ battle, playerSide }: { battle: TacticalBattle; playerSide: 'attacker' | 'defender' | null }) {
  const W = 150, H = Math.round(150 * (battle.height / battle.width));
  return (
    <div style={{
      position: 'absolute', left: 12, bottom: 12, width: W, height: H,
      background: 'rgba(16, 12, 8, 0.82)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)', pointerEvents: 'none', overflow: 'hidden',
    }}>
      {battle.units.filter((u) => u.troops > 0 && !(u.hidden && u.side !== playerSide)).map((u) => {
        const mine = playerSide ? u.side === playerSide : u.side === 'attacker';
        const x = (u.coord.col / Math.max(1, battle.width - 1)) * (W - 8) + 4;
        const y = (u.coord.row / Math.max(1, battle.height - 1)) * (H - 8) + 4;
        const sz = u.isCommander ? 7 : 5;
        return (
          <div key={u.id} style={{
            position: 'absolute', left: x - sz / 2, top: y - sz / 2, width: sz, height: sz,
            borderRadius: '50%', background: mine ? '#5a9ee0' : '#e06a52',
            border: u.isCommander ? '1.5px solid #f0d070' : 'none',
          }} />
        );
      })}
    </div>
  );
}

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
  const startBattle = useGameStore((s) => s.startTacticalBattle);
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
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
    color: '#f0e0b0',
    fontFamily: 'var(--tkm-font-body)',
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
      fontFamily: 'var(--tkm-font-body)',
      boxShadow: '0 0 16px rgba(212, 168, 74, 0.4)',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: '0.7rem', color: '#8a7050', letterSpacing: '0.05rem' }}>{t('已選', 'SELECTED')}</div>
      {/* 武將立繪(風格化頭像)— 姓字印 + 角色徽,無美術資源時的代位畫像。 */}
      {(() => {
        const st = officer?.stats;
        const role = !st ? '士' : st.war >= st.intelligence + 8 ? '猛'
          : st.intelligence >= st.war + 8 ? '智'
          : st.leadership >= 85 ? '帥' : '將';
        const rc = role === '猛' ? '#e8704a' : role === '智' ? '#9a7ce8'
          : role === '帥' ? '#d4a84a' : '#7ec0e0';
        const surname = (officer ? pickName(officer.name, lang) : '')?.[0] ?? '?';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: 4 }}>
            <div style={{
              position: 'relative', width: 52, height: 64, flexShrink: 0,
              border: `2px solid ${rc}`, borderRadius: 'var(--tkm-radius-xs)',
              background: `linear-gradient(160deg, rgba(40,28,18,0.9), ${rc}33)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 10px ${rc}66`,
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f4e8c8', fontFamily: 'var(--tkm-font-body)', textShadow: '0 2px 4px #000' }}>{surname}</span>
              <span style={{
                position: 'absolute', bottom: -1, right: -1, fontSize: '0.7rem',
                background: rc, color: '#1a120a', padding: '0 3px', fontWeight: 700, borderRadius: 'var(--tkm-radius-xs)',
              }}>{role}</span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{officer ? pickName(officer.name, lang) : '?'}</div>
              {lang !== 'en' && <div style={{ fontSize: '0.7rem', color: '#a89070' }}>{officer?.name.en ?? ''}</div>}
              {st && (
                <div style={{ fontSize: '0.64rem', color: '#9a8a6a', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                  武{st.war} 智{st.intelligence} 統{st.leadership}
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
        <span>{t('士氣', 'Morale')} <strong style={{ color: isRouting(unit) ? '#e0623a' : unit.morale < 40 ? '#caa15a' : unit.morale >= 80 ? '#7ed68a' : '#cdbb95' }}>{unit.morale}</strong>
          {isRouting(unit) ? ` ${t('潰走', 'ROUT')}` : unit.morale < 40 ? ` ${t('動搖', 'shaken')}` : unit.morale >= 80 ? ` ${t('高昂', 'high')}` : ''}</span>
        <span>{UNIT_TYPE_LABEL[unit.unitType]}</span>
        {(unit.charge?.dist ?? 0) >= 2 && (
          <span style={{ color: '#ffb24a' }}>{t('衝鋒', 'Charge')} <strong>×{unit.charge!.dist}</strong></span>
        )}
        {(unit.fatigue ?? 0) > 0 && (
          <span>{t('疲乏', 'Fatigue')} <strong style={{ color: (unit.fatigue ?? 0) >= 70 ? '#e0623a' : '#caa15a' }}>{Math.round(unit.fatigue ?? 0)}</strong>{(unit.fatigue ?? 0) >= 70 ? ` ⚠` : ''}</span>
        )}
        {unit.maxAmmo !== undefined && (
          <span>{t('弓矢', 'Arrows')} <strong style={{ color: (unit.ammo ?? 0) <= 0 ? '#e0623a' : '#88b7e8' }}>{unit.ammo ?? 0}</strong>/{unit.maxAmmo}</span>
        )}
      </div>
      {unit.effects.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          {unit.effects.map((e, i) => {
            const EFF_ZH: Record<string, string> = {
              burning: '燃燒', confused: '混亂', defending: '據守', chained: '連環',
              revealed: '現形', demoralized: '沮喪', starving: '糧盡', disorder: '陷亂', 'feign-rout': '詐敗',
            };
            const col = e.kind === 'burning' ? '#ff7050'
              : e.kind === 'confused' || e.kind === 'disorder' ? '#c19a3b'
              : e.kind === 'starving' ? '#d8b24a'
              : e.kind === 'demoralized' ? '#c89090'
              : e.kind === 'feign-rout' ? '#c178c7'
              : '#88b7e8';
            return (
              <span key={i} style={{
                fontSize: '0.7rem', padding: '1px 5px',
                border: `1px solid ${col}`, color: col, borderRadius: 'var(--tkm-radius-xs)',
              }}>{t(EFF_ZH[e.kind] ?? e.kind, e.kind)} {e.turnsLeft}t</span>
            );
          })}
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
        {/* 陣中築壘 — entrench the current hex: shield ×0.85, slows entry,
            breaks cavalry charges. Open firm ground only; burns if fired. */}
        {canFortify(battle, unit) && (
          <button
            style={{ ...btnBase, opacity: apDisabled ? 0.4 : 1 }}
            disabled={apDisabled}
            title={t('就地築壘:本格化為工事 — 受擊×0.85、敵入耗步、破騎兵衝鋒。木柵怕火。', 'Entrench: this hex becomes fieldworks — damage ×0.85, slows entry, breaks cavalry charges. Burns.')}
            onClick={() => { playSfx('click'); startBattle(fortifyTile(battle, unit.id)); setActionMode({ kind: 'none' }); }}
          >⛏ {t('築壘', 'Entrench')} <span style={{ float: 'right', color: '#8a7050' }}>{FIELDWORKS_AP_COST} AP</span></button>
        )}
      </div>

      {availableStratagems.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px dotted #3a2818', paddingTop: '0.4rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#d4a84a', letterSpacing: '0.05rem', marginBottom: '0.3rem' }}>{t('計略', 'STRATAGEMS')}</div>
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
                <span style={{ color: badge.color, fontSize: '0.7rem', marginRight: 3 }}>[{badge.label}]</span>
                {pickName(s.name, lang)}
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
          <div style={{ fontSize: '0.7rem', color: '#d4a84a', letterSpacing: '0.05rem', marginBottom: '0.3rem' }}>
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
                <span style={{ color: badge.color, fontSize: '0.7rem', marginRight: 3 }}>[{badge.label}]</span>
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
