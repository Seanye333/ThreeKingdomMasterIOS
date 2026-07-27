import { Suspense, useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { STRATAGEM_RANGE } from '../../game/data/stratagemRanges';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars, SoftShadows, Sparkles } from '@react-three/drei';
import { ScenePostFx } from '../components/ScenePostFx';
import { SkyEnvironment } from '../components/SkyEnvironment';
import * as THREE from 'three';
import { RENDER_HI } from '../renderQuality';
import { useGLRecovery } from '../hooks/useGLRecovery';
import { TERRAIN_LABEL } from './battle3d/terrainLabels';
import { OfficerPortrait } from '../components/OfficerPortrait';
import { useGameStore } from '../../game/state/store';
import { playSfx, playFxSfx, startBattleAmbience, stopBattleAmbience, playMusic, stopMusic, type MusicTrack } from '../../game/systems/sound';
import type { EntityId, FormationId, HexCoord, Officer, StratagemId, TacticalBattle, TacticalTile, TacticalUnit, TimeOfDay, UnitType, Weather } from '../../game/types';
import { stratagemFxKind, tacticFxKind, tacticFxSpec, FX_DURATION, FX_IMPACT, type StratagemFxInstance, type StratagemFxKind } from '../../game/data/stratagemFx';
import { categoryOfTactic } from '../../game/data/officerAttributes';
import { attackUnits, canAttack, canMove, endTurn, hexDistance, moveUnit, resolveBattleEnd, unitAt, tileAt, hexNeighbours, forecastAttack, matchupLabel, battleStratagemSituation, defenderTerrainShield, terrainDamageMod, moveCost, findPath, moveUnitAlong, reachableHexes, isRouting, changeFormation, canChangeFormation, canFortify, fortifyTile, FIELDWORKS_AP_COST, canRetreatUnit, retreatUnit, pickAiFormation, formationCounterMul, breakGate, repairWall, scaleWall, batterTargets, repairTargets, scaleTargets, WALL_REPAIR_PER_ACTION } from '../../game/systems/tactical';
import { applyBattlePrep, applyStratagem, pickAiBattlePrep, pickDuelChampion, canIssuePreBattleDuel, applyPreBattleDuel, aiMaybePreBattleDuel } from '../../game/systems/tacticalSchemes';
import { duelDread } from '../../game/systems/duelChallenge';
import { realmEthos, ethosDreadBonus } from '../../game/systems/realmEthos';
import { type TeamDuelResult } from '../../game/systems/teamDuel';
import { TeamDuel3DStage } from '../components/duel/TeamDuel3DStage';
import { InteractiveTeamDuel3D } from '../components/duel/InteractiveTeamDuel3D';
import { aiTakeTurn, aiSkillForDifficulty } from '../../game/systems/tacticalAi';
import { FORMATIONS } from '../../game/data/formations';
import { canDuel, pickDuelTerrain, rollDuelScar } from '../../game/systems/duel';
import { duelWound } from '../../game/systems/afflictions';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { FORMATIONS_BY_ID, STRATAGEMS } from '../../game/data';
import { BattleResultsModal } from '../components/BattleResultsModal';
import { Modal } from '../components/Modal';
import { IntroDive } from '../components/IntroDive';
import { Duel3DStage } from '../components/duel/Duel3DStage';
import { useT, useDesc, useLanguage, pickName } from '../i18n';
import { isReduceMotion } from '../uiPrefs';
import { groundNormalTexture, groundRoughnessTexture } from './battleTextures';

/** Shared normal-map intensity for ground/armour grain. */
const SURFACE_NORMAL_SCALE = new THREE.Vector2(0.5, 0.5);

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


type ActionMode =
  | { kind: 'none' }
  | { kind: 'move' }
  | { kind: 'attack' }
  | { kind: 'duel' }
  /* 攻城 — pick which stretch of masonry to batter / scale / shore up. Only
     entered when more than one adjacent hex qualifies; a lone target acts at
     once, since making the player click twice for a forced choice is noise. */
  | { kind: 'siege'; act: 'batter' | 'scale' | 'repair' }
  /* 車輪戰 — pick which enemy the rush goes at, when more than one qualifies. */
  | { kind: 'gauntlet' }
  /* 陣前招降 — pick which broken enemy to call on, when more than one will hear. */
  | { kind: 'surrender' }
  | { kind: 'stratagem'; id: StratagemId; tacticId?: string };


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

const UNIT_TYPE_LABEL: Record<UnitType, { zh: string; en: string }> = {
  infantry: { zh: '步兵', en: 'Infantry' }, spearmen: { zh: '槍兵', en: 'Spearmen' }, cavalry: { zh: '騎兵', en: 'Cavalry' },
  archers: { zh: '弓兵', en: 'Archers' }, siege: { zh: '攻城', en: 'Siege' }, navy: { zh: '水軍', en: 'Navy' },
};
const WEATHER_LABEL: Record<Weather, { zh: string; en: string }> = {
  clear: { zh: '☀ 晴', en: '☀ Clear' }, rain: { zh: '☂ 雨', en: '☂ Rain' }, wind: { zh: '🌀 風', en: '🌀 Wind' }, fog: { zh: '≋ 霧', en: '≋ Fog' }, snow: { zh: '❄ 雪', en: '❄ Snow' },
};
const TOD_LABEL: Record<TimeOfDay, { zh: string; en: string }> = {
  dawn: { zh: '🌅 拂曉', en: '🌅 Dawn' }, day: { zh: '☀ 白晝', en: '☀ Day' }, dusk: { zh: '🌇 黃昏', en: '🌇 Dusk' }, night: { zh: '🌙 夜', en: '🌙 Night' },
};


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
    case 'enemy': return { label: langZh ? '敵' : 'enm', color: 'var(--tkm-hud-crimson)' };
    case 'ally':  return { label: langZh ? '友' : 'ally', color: 'var(--tkm-hud-green)' };
    case 'self':  return { label: langZh ? '己' : 'self', color: 'var(--tkm-hud-blue)' };
    case 'aoe':   return { label: langZh ? '範' : 'aoe', color: 'var(--tkm-hud-gold)' };
  }
}

// ─── HUD 共用元件 — the top bar used to restate the same parchment palette
// inline on every chip and button; these two carry it once (and give the
// buttons the hover state the inline styles never had). `tone` colours the
// ACTIVE state; idle is always parchment-on-leather.
/* HUD_TONES / HudButton / HudChip now live in components/HudControls so the
 * world map and city scene share the same overlay vocabulary. */
import { HudButton, HudChip } from '../components/HudControls';

// (hex world grid + terrain height/colour tables live in battle3d/battleGrid.ts;
//  re-exported so existing importers keep working.)
import { hexWorld, HEX_R, HEX_COL_STEP, HEX_ROW_STEP, TERRAIN_HEIGHT, TERRAIN_COLOR } from './battle3d/battleGrid';
import { EmbeddedSceneCtx, IS_MOBILE, UNIT_GLYPH } from './battle3d/shared';
import { hitArc, ARC_MUL, ARC_LABEL } from './battle3d/facing';
import { STATUS_BADGE, terrainBadge, navalBadges, supplyBadge, type StatusBadge } from './battle3d/statusBadges';
import { SHIP_CLASSES_BY_ID } from '../../game/data/ships';
import { isGrounded, groundingMul, seasickness } from '../../game/systems/navalWarfare';
import { shipPowerMul } from '../../game/systems/tactical';
import { canGauntlet, gauntletChallengers, battleGauntlet } from '../../game/systems/tacticalGauntlet';
import { surrenderTargets, surrenderCheck, callSurrender, SURRENDER_REFUSAL_MORALE, SURRENDER_LOYALTY_WALL } from '../../game/systems/tacticalSurrender';
import {
  wallFraction, wallState, WALL_STATE_LABEL, fortMaxHp, wallKey, weakestWall,
  hitsToBreach, repairsOutpace,
} from './battle3d/wallDamage';
export { EmbeddedSceneCtx };
import { AdaptiveFx, UnitMesh } from './battle3d/UnitVisuals3D';
export { hexWorld, HEX_R, HEX_COL_STEP, HEX_ROW_STEP, TERRAIN_HEIGHT, TERRAIN_COLOR };
import {
  HexTile, FieldworksArt, FireArt, BridgeArt, ForestArt, MountainArt, RiverArt,
  SweptRoof3D, TownHouse, CityWall, WallGate3D, DefenseStructure,
  InstancedTilePrisms, BoardSkirt, ZocOverlay,
  RainParticles, StormLightning, BattleHaze, SnowParticles, WindStreaks,
  LIGHTING, WEATHER_FOG_MUL,
} from './battle3d/BattleTerrainArt3D';
export {
  HexTile, FieldworksArt, FireArt, BridgeArt, ForestArt, MountainArt, RiverArt,
  SweptRoof3D, TownHouse, CityWall, WallGate3D, DefenseStructure,
  InstancedTilePrisms,
};


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

import { StratagemFXNode } from './battle3d/StratagemFx3D';

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
  const t9n = useT();
  const wallTiles = battle.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate');
  if (wallTiles.length === 0) return null;
  const defColor = playerSide === 'defender' ? '#3a7dd9' : '#b8442e';
  const attackers = battle.units.filter((u) => u.side === 'attacker' && u.troops > 0);
  /* 城防 — the weakest hex is the one both sides are playing for: the attacker
     concentrates on it, the defender spends an action shoring it up. */
  const weakest = weakestWall(battle);
  return (
    <>
      {wallTiles.map((t) => {
        const [x, z] = hexWorld(t.coord.col, t.coord.row);
        const adj = attackers.find((a) => hexDistance(a.coord, t.coord) === 1);
        const hp = battle.wallHp?.[wallKey(t.coord)];
        const frac = wallFraction(hp, t.terrain);
        const state = wallState(hp, t.terrain);
        const label = WALL_STATE_LABEL[state];
        const isWeakest = !!weakest
          && weakest.coord.col === t.coord.col && weakest.coord.row === t.coord.row;
        return (
          <group key={`siege-${t.coord.col},${t.coord.row}`} position={[x, 0, z]} raycast={() => null}>
            {/* 城防狀態 — only once the masonry has actually been hit, so an
                untouched curtain wall isn't papered over with plates. The
                engine tracks this per hex and nothing used to show it: a wall
                at 40 HP looked exactly like one at 1000. */}
            {hp !== undefined && state !== 'intact' && (
              <Html
                position={[0, t.terrain === 'gate' ? 4.1 : 2.6, 0]}
                center
                distanceFactor={9}
                zIndexRange={[9, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <div style={{
                  background: 'rgba(20, 14, 8, 0.86)',
                  border: `1.5px solid ${label.color}`,
                  borderRadius: 'var(--tkm-radius-xs)',
                  padding: '2px 5px',
                  minWidth: 62,
                  fontFamily: 'var(--tkm-font-body)',
                  fontSize: '11px',
                  color: '#f0e0b0',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  boxShadow: isWeakest ? `0 0 12px ${label.color}` : 'none',
                }}>
                  <div style={{ color: label.color, fontWeight: 'bold' }}>
                    {t9n(t.terrain === 'gate' ? '城門' : '城牆', t.terrain === 'gate' ? 'Gate' : 'Wall')}
                    {' '}{t9n(label.zh, label.en)}
                  </div>
                  <div style={{
                    height: 4, marginTop: 2, background: 'rgba(0,0,0,0.55)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{ width: `${Math.round(frac * 100)}%`, height: '100%', background: label.color }} />
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.75, marginTop: 1 }}>
                    {Math.max(0, Math.round(hp)).toLocaleString()} / {fortMaxHp(t.terrain).toLocaleString()}
                  </div>
                </div>
              </Html>
            )}
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
        add.push({ id: u.id, coord: u.coord, color: u.side === playerSide ? '#3a7dd9' : 'var(--tkm-hud-crimson)' });
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
    } else if (actionMode.kind === 'gauntlet') {
      for (const c of hexNeighbours(selectedUnit.coord)) {
        const e = unitAt(battle, c);
        if (e && e.side !== selectedUnit.side && canGauntlet(battle, e.id, officers)) {
          m.set(`${c.col},${c.row}`, 'attack');
        }
      }
    } else if (actionMode.kind === 'surrender') {
      // 招降 — light up the broken foes within earshot. Tinted as friendly work
      // (a move tint, not the attack red): the aim is to take him, not kill him.
      for (const e of surrenderTargets(battle, selectedUnit.id, officers)) {
        m.set(`${e.coord.col},${e.coord.row}`, 'move');
      }
    } else if (actionMode.kind === 'siege') {
      // 攻城 — light up the masonry this unit can actually work on. Repairs are
      // friendly work, so they get the move tint rather than the attack red.
      const legal = actionMode.act === 'batter' ? batterTargets(battle, selectedUnit.id)
        : actionMode.act === 'scale' ? scaleTargets(battle, selectedUnit.id)
        : repairTargets(battle, selectedUnit.id);
      for (const c of legal) {
        m.set(`${c.col},${c.row}`, actionMode.act === 'repair' ? 'move' : 'attack');
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
          {/* 天光 — sky-derived IBL. On a battlefield this is what finally
              separates lacquered armour, bronze blades and wet mud: they were
              all reflecting nothing before. */}
          <SkyEnvironment
            top={lighting.sky[0]}
            horizon={lighting.sky[1]}
            sun={lighting.sun.color}
            ground="#4a4030"
            intensity={battle.timeOfDay === 'night' ? 0.3 : 0.45}
          />
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
          .map((t) => {
            // 0 = sound, 1 = about to breach. Untracked hexes read as sound.
            const dmg = 1 - wallFraction(battle.wallHp?.[wallKey(t.coord)], t.terrain);
            return t.terrain === 'gate'
              ? <WallGate3D key={`gate-${t.coord.col},${t.coord.row}`} coord={t.coord} bannerColor={wallBanner} rotY={rotFor(t)} damage={dmg} />
              : <CityWall key={`wall-${t.coord.col},${t.coord.row}`} coord={t.coord} bannerColor={wallBanner} rotY={rotFor(t)} damage={dmg} />;
          });
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
            // 向背 — full arcs on the unit in hand; dimmed on whatever the
            // cursor is over, which is exactly when you are sizing up an
            // enemy's exposed back.
            showArcs={selectedId === u.id ? 'full'
              : (hovered && hovered.col === u.coord.col && hovered.row === u.coord.row) ? 'dim'
                : false}
            // 地利 — computed here from the engine's own terrain functions, so
            // the badge can never promise an edge the combat model withholds.
            ground={(() => {
              const tl = tileAt(battle, u.coord);
              if (!tl) return null;
              const L = TERRAIN_LABEL[tl.terrain];
              return terrainBadge(
                terrainDamageMod(u.unitType, tl.terrain),
                defenderTerrainShield(tl.terrain),
                L?.zh ?? tl.terrain, L?.en ?? tl.terrain,
              );
            })()}
            // 水戰/糧車 — hull class, grounding and crew sickness all come
            // straight out of navalWarfare; the convoy flag is whose it is.
            extra={(() => {
              const out: StatusBadge[] = [];
              if (u.isSupply) out.push(supplyBadge(u.side === playerSide));
              if (u.shipClass) {
                const tl = tileAt(battle, u.coord);
                const def = SHIP_CLASSES_BY_ID[u.shipClass];
                const drill = battle.navalDrill?.[u.side];
                const chained = u.effects.some((e) => e.kind === 'chained');
                const sick = typeof drill === 'number' ? seasickness(drill, chained) : null;
                out.push(...navalBadges({
                  shipZh: def?.name.zh ?? u.shipClass,
                  shipEn: def?.name.en ?? u.shipClass,
                  grounded: isGrounded(u.shipClass, tl?.terrain ?? 'plain'),
                  groundMul: groundingMul(u.shipClass, tl?.terrain ?? 'plain'),
                  hullMul: shipPowerMul(u.shipClass),
                  sickMul: sick?.powerMul ?? 1,
                  sickNoteZh: sick?.noteZh,
                  sickNoteEn: sick?.noteEn,
                }));
              }
              return out;
            })()}
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
  // 提示 — a transient in-HUD toast (bottom-centre) for rule feedback that
  // used to fire a jarring, English-only OS alert() mid-battle.
  const [hudToast, setHudToast] = useState<string | null>(null);
  // 戰報 — a collapsible drawer of the recent battle log (the ticker only
  // flashes the last line for ~3.6s; this lets a player review what happened).
  const [showLog, setShowLog] = useState(false);
  // 逐擊 — include the per-blow play-by-play (kind: 'blow'). On by default: an
  // empty-looking log was the complaint that produced it. Off collapses the
  // drawer back to the dramatic beats for a long siege.
  const [logBlows, setLogBlows] = useState(true);
  // ⚙ 工具托盤 — the utility buttons (錄影/委託/暫停/速度/戰報) fold behind one
  // gear by default; any ENGAGED tool keeps its button out so its state (and
  // off-switch) is never hidden (e.g. stop-recording while recording).
  const [showTools, setShowTools] = useState(false);
  // 確認 — a styled confirm dialog (replaces jarring window.confirm mid-battle).
  const [confirmDialog, setConfirmDialog] = useState<{ title: { zh: string; en: string }; body: { zh: string; en: string }; confirmLabel: { zh: string; en: string }; danger?: boolean; onConfirm: () => void } | null>(null);
  const hudToastTimer = useRef(0);
  const flashToast = (msg: string) => {
    setHudToast(msg);
    window.clearTimeout(hudToastTimer.current);
    hudToastTimer.current = window.setTimeout(() => setHudToast(null), 2600);
  };
  useEffect(() => () => window.clearTimeout(hudToastTimer.current), []);
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
  const dismissSpectate = useGameStore((s) => s.dismissSpectate);
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
  // 團戰並擊 — when BOTH champions have adjacent supporters, offer a real N-vs-M
  // melee (圍攻/合擊/膽氣, auto-resolved with consequences) instead of the 1v1.
  const [meleePrompt, setMeleePrompt] = useState<{ me: Officer; foe: Officer; mine: Officer[]; foes: Officer[]; meFatigue: number; foeFatigue: number; terrain: import('../../game/systems/duel').DuelTerrain } | null>(null);
  // 團戰同場 (§6.11) — the staged 3D playback of a resolved field melee (visual
  // only; the consequences were already bound when the melee resolved).
  const [fieldMeleeStage, setFieldMeleeStage] = useState<TeamDuelResult | null>(null);
  // 親督團戰 (§6.11 互動) — the player commands the melee round by round; the
  // consequences bind when the fight ends (onComplete).
  const [fieldMeleeLive, setFieldMeleeLive] = useState<{ me: Officer; foe: Officer; mine: Officer[]; foes: Officer[] } | null>(null);
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
  // WebGL 上下文丟失恢復 — see useGLRecovery; without it a dropped context
  // leaves the battle permanently black.
  const { glEpoch, attachGLRecovery } = useGLRecovery('TacticalBattleScreen3D');
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
    if (battle.spectate || (playerSide && (battle.activeSide !== playerSide || autoPilot))) {
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
            setCine({ key: ++cineCount.current, weight: 3, color: 'var(--tkm-hud-amber)' });
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
                { turn: battleAfterLogs.turn, text: flavor.zh, textEn: flavor.en, kind: 'event' as const },
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
          setCine({ key: ++cineCount.current, weight: 3, color: 'var(--tkm-hud-amber)' });  // 名場面:全運鏡
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
      setCine({ key: ++cineCount.current, weight: 3, color: won ? 'var(--tkm-hud-amber)' : '#ff5030' });
      const id = setTimeout(() => setShowResults(true), 1500);
      return () => clearTimeout(id);
    }
  }, [battle?.winner, showResults]);

  // Pop voice lines from the battle log to the ticker.
  useEffect(() => {
    if (!battle?.log || battle.log.length === 0) return;
    const last = battle.log[battle.log.length - 1];
    if (last.kind === 'voice' || last.kind === 'arrival') {
      setVoiceLine({ text: lang === 'en' && last.textEn ? last.textEn : last.text, key: Date.now() });
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

  // 敵將叫陣 — once per turn, a brave/strong enemy next to one of your duel-capable
  // officers may call you out. Accepting opens the bout (no AP cost — it's their
  // initiative); the foe carries any 車輪戰 fatigue.
  useEffect(() => {
    // `battle` can be null on this render. This guard used to sit in an
    // early return ABOVE the hook, so on those renders the hook was skipped
    // entirely and the hook ORDER changed between renders
    // (react-hooks/rules-of-hooks). CityMapScreen3D hit the same trap and
    // was fixed by hoisting; do the same here rather than bailing early.
    if (!battle) return;
    const myTurn = playerSide && battle.activeSide === playerSide && !battle.winner;
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
  }, [battle, playerSide, interactiveDuel, challenge, autoPilot, officers]);

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
    setCine({ key: ++cineCount.current, weight: r.killed ? 3 : 1, color: r.killed ? '#ff5030' : 'var(--tkm-hud-amber)' });
    // Replay the clash spark a beat later, when the lunges meet in the middle.
    // 決勝 — the killing blow gets a bigger, redder burst (the freeze-frame
    // hitstop + zoom-punch already fire via the weight-3 cine above).
    duelClashBig.current = r.killed;
    setTimeout(() => setDuelClashKey((k) => k + 1), 180);
  };


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
    // 車輪戰 — the enemy to gang up on was picked out of several.
    if (actionMode.kind === 'gauntlet') {
      if (u && u.side !== selectedUnit.side && canGauntlet(battle, u.id, officers)
          && hexDistance(selectedUnit.coord, u.coord) === 1) {
        playSfx('sword');
        start(battleGauntlet(battle, u.id, officers, Math.random));
        setActionMode({ kind: 'none' });
      }
      return;
    }
    // 陣前招降 — the broken officer to call on was picked out of several.
    if (actionMode.kind === 'surrender') {
      if (u && u.side !== selectedUnit.side
          && surrenderCheck(battle, selectedUnit, u, officers).ok) {
        const res = callSurrender(battle, selectedUnit.id, u.id, officers, Math.random);
        playSfx(res.yielded ? 'victory' : 'click');
        start(res.battle);
        setActionMode({ kind: 'none' });
      }
      return;
    }
    // 攻城 — a stretch of masonry was picked out of several legal ones.
    if (actionMode.kind === 'siege') {
      const { act } = actionMode;
      const legal = act === 'batter' ? batterTargets(battle, selectedUnit.id)
        : act === 'scale' ? scaleTargets(battle, selectedUnit.id)
        : repairTargets(battle, selectedUnit.id);
      if (legal.some((h) => h.col === c.col && h.row === c.row)) {
        playSfx(act === 'batter' ? 'crash' : act === 'scale' ? 'march' : 'thud');
        start(act === 'batter' ? breakGate(battle, selectedUnit.id, c)
          : act === 'scale' ? scaleWall(battle, selectedUnit.id, c)
          : repairWall(battle, selectedUnit.id, c));
        setActionMode({ kind: 'none' });
      }
      return;
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
        flashToast(t('須與敵將相鄰方可單挑', 'Must be adjacent to duel'));
        return;
      }
      const me = officers[selectedUnit.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      // 單挑資格 — translate the terse engine reason for the toast.
      const duelReason = (r?: string) => r === 'war stat too low' ? t('武力不足', 'war too low')
        : r === 'too frail' ? t('體弱不堪戰', 'too frail')
        : r === 'unavailable' ? t('無法出戰', 'unavailable') : (r ?? '');
      if (!meCheck.ok) { flashToast(t(`我方將領不可單挑:${duelReason(meCheck.reason)}`, `Your officer can't duel: ${duelReason(meCheck.reason)}`)); return; }
      if (!foeCheck.ok) { flashToast(t(`敵將不可單挑:${duelReason(foeCheck.reason)}`, `Enemy can't duel: ${duelReason(foeCheck.reason)}`)); return; }
      // Spend AP and open the interactive bout; the kill is applied on finish.
      start({ ...battle, units: battle.units.map((unit) => unit.id === selectedUnit.id ? { ...unit, ap: 0 } : unit) });
      // 三英戰呂布 — allies pressing the same foe can leap in mid-bout.
      const reinforcements = battle.units
        .filter((ru) => ru.side === playerSide && ru.troops > 0 && ru.ap > 0 && ru.officerId !== me.id
          && hexDistance(ru.coord, u.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      const duelTerrain = pickDuelTerrain();
      // 團戰並擊 (§6.11) — when the FOE also has champions at their side, the two
      // knots of officers can crash together instead: offer the choice.
      const foeAllies = battle.units
        .filter((ru) => ru.side !== playerSide && ru.troops > 0 && ru.officerId !== foe.id
          && hexDistance(ru.coord, u.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      if (reinforcements.length >= 1 && foeAllies.length >= 1) {
        setMeleePrompt({ me, foe, mine: [me, ...reinforcements], foes: [foe, ...foeAllies], meFatigue: selectedUnit.duelFatigue ?? 0, foeFatigue: u.duelFatigue ?? 0, terrain: duelTerrain });
        setActionMode({ kind: 'none' });
        return;
      }
      // 車輪戰 — each fighter opens winded by the bouts they've already fought.
      setInteractiveDuel({ me, foe, meFatigue: selectedUnit.duelFatigue ?? 0, foeFatigue: u.duelFatigue ?? 0, reinforcements, terrain: duelTerrain });
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
              { turn: next.turn, text: flavor.zh, textEn: flavor.en, kind: 'event' as const },
            ],
          };
          // N7 — show a transient on-screen banner for signature tactics
          setSignatureBanner({ zh: flavor.zh, en: flavor.en, key: Date.now() });
          setCine({ key: ++cineCount.current, weight: 3, color: 'var(--tkm-hud-amber)' });  // 名場面:全運鏡
          setTimeout(() => setSignatureBanner(null), 2400);
        }
        start(next);
        setActionMode({ kind: 'none' });
      } else if (r.reason) {
        flashToast(r.reason);
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
      {/* Top bar — wraps so a narrow / phone viewport can never shove the
          primary actions (End Turn · World · Exit) past the screen edge. */}
      <div style={{
        padding: '0.6rem 1rem',
        background: 'rgba(20, 14, 8, 0.85)',
        borderBottom: '1px solid #5a4530',
        color: 'var(--tkm-hud-cream)',
        fontFamily: 'var(--tkm-font-body)',
        display: 'flex', alignItems: 'center', gap: '0.7rem',
        flexWrap: 'wrap', rowGap: '0.4rem',
      }}>
        <strong>{t('戰術戰鬥', 'Tactical Battle')} · 3D</strong>
        <span style={{ fontSize: '0.85rem', color: 'var(--tkm-hud-gold)' }}>
          {t('第', 'Turn')} {battle.turn} {t('回', '')} · {myTurn ? <span style={{ color: 'var(--tkm-hud-green)' }}>{t('我方回合', 'YOUR TURN')}</span> : <span style={{ color: 'var(--tkm-hud-red)' }}>{t('敵方回合', 'ENEMY TURN')}</span>}
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
          <HudChip tone="ember" bg="rgba(90,40,20,0.5)" title={t('久戰糧道枯竭 — 雙方傷害遞減', 'Prolonged siege drains supply — both sides take falling damage')}>
            ⏳ {t('久戰', 'Fatigue')} −{Math.min(40, 5 * (battle.turn - 9))}%
          </HudChip>
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
                fontSize: '0.72rem', background: 'rgba(20,14,8,0.9)', color: ready ? 'var(--tkm-hud-gold)' : '#7a6038',
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
            <HudChip tone="blue" title={t('本戰勝利條件', 'Victory condition')}>
              🎯 {t(zh, en)}{prog}
            </HudChip>
          );
        })()}
        {myTurn && (() => {
          const live = battle.units.filter((u) => u.side === playerSide && u.troops > 0);
          const ready = live.filter((u) => u.ap > 0).length;
          return (
            <HudChip
              tone={ready > 0 ? 'gold' : 'green'}
              bg={ready > 0 ? 'rgba(212,168,74,0.18)' : 'rgba(110,174,115,0.16)'}
            >{ready > 0 ? `⚑ ${t('可動', 'ready')} ${ready}/${live.length}` : `✓ ${t('全員已動', 'all moved')}`}</HudChip>
          );
        })()}
        {/* 天候一覽 — weather · wind · time-of-day merged into one chip (was
            three), trimming the top-bar clutter while keeping each fact. */}
        <HudChip
          title={t('天候·風向·時段 — 影響火計蔓延、弓弩射程與夜戰視野', 'Weather · wind · time of day — governs fire spread, bow range and night sight')}>
          <span>{lang === 'en' ? WEATHER_LABEL[battle.weather].en : WEATHER_LABEL[battle.weather].zh}</span>
          {battle.windDirection && battle.windDirection !== 'calm' && (
            <span style={{ color: '#a8c4e0' }}>· {battle.windDirection === 'east' ? t('🌬→東', '🌬→E') : battle.windDirection === 'west' ? t('🌬←西', '🌬←W') : battle.windDirection === 'south' ? t('🌬↓南', '🌬↓S') : t('🌬↑北', '🌬↑N')}</span>
          )}
          <span style={{ opacity: 0.85 }}>· {lang === 'en' ? TOD_LABEL[battle.timeOfDay].en : TOD_LABEL[battle.timeOfDay].zh}</span>
        </HudChip>
        {/* ⚙ 工具托盤 — utilities fold behind the gear; an ENGAGED tool's
            button stays out so its state (and off-switch) is never hidden. */}
        <HudButton
          active={showTools}
          onClick={() => setShowTools((v) => !v)}
          title={t('工具 — 錄影/委託/暫停/速度/戰報', 'Tools — record / delegate / pause / speed / log')}
          ariaLabel={t('工具托盤', 'Tool tray')}
        >⚙{showTools ? '' : ' ▸'}</HudButton>
        {(showTools || recording) && (
          <HudButton
            active={recording} tone="red"
            onClick={toggleRecording}
            title={recording ? t('停止並下載錄影', 'Stop & download') : t('錄製戰鬥畫面(WebM)', 'Record the battle (WebM)')}
            ariaLabel={recording ? t('停止並下載錄影', 'Stop & download recording') : t('錄製戰鬥畫面', 'Record the battle')}
          >{recording ? t('⏹ 錄影中', '⏹ REC') : t('🎬 錄影', '🎬 Record')}</HudButton>
        )}
        {(showTools || autoPilot) && (
          <HudButton
            active={autoPilot} tone="green"
            onClick={() => setAutoPilot((v) => !v)}
            title={autoPilot ? t('收回指揮權', 'Take back command') : t('委託軍師指揮 — 戰術 AI 替你打,隨時可收回', 'Let the tactical AI play your side; toggle any time')}
            ariaLabel={autoPilot ? t('收回指揮權', 'Take back command') : t('委託軍師指揮', 'Delegate to the tactical AI')}
          >{autoPilot ? t('🤖 軍師代戰中', '🤖 AI in command') : t('🤖 委託指揮', '🤖 Delegate')}</HudButton>
        )}
        {(showTools || paused) && (
          <HudButton
            active={paused}
            onClick={() => setPaused((v) => !v)}
            title={t('暫停 / 繼續推演', 'Pause / resume')}
            ariaLabel={paused ? t('繼續推演', 'Resume') : t('暫停', 'Pause')}
          >{paused ? t('▶ 繼續', '▶ Resume') : t('⏸ 暫停', '⏸ Pause')}</HudButton>
        )}
        {(showTools || battleSpeed !== 1) && (
          <HudButton
            active={battleSpeed !== 1}
            onClick={() => setBattleSpeed(battleSpeed >= 4 ? 1 : battleSpeed * 2)}
            title={t('推演速度', 'Playback speed')}
            ariaLabel={t('推演速度', 'Playback speed')}
          >⏩ {battleSpeed}×</HudButton>
        )}
        {(showTools || showLog) && (
          <HudButton
            active={showLog}
            onClick={() => setShowLog((v) => !v)}
            title={t('戰報 — 回看近況記錄', 'Battle log — review recent events')}
            ariaLabel={t('戰報記錄', 'Battle log')}
          >📜 {t('戰報', 'Log')}</HudButton>
        )}
        {/* 撤退 — concede and pull out: you lose the field, but your standing
            units withdraw intact (no pursuit / 掩殺). */}
        {myTurn && !battle.winner && playerSide && !battle.practice && (
          <HudButton
            danger
            onClick={() => setConfirmDialog({
              title: { zh: '撤兵退走', en: 'Withdraw' },
              body: { zh: '此戰判負,但現存部隊得以保全,不遭掩殺。', en: 'You concede the field, but your standing units escape intact — no pursuit.' },
              confirmLabel: { zh: '撤兵', en: 'Withdraw' },
              danger: true,
              onConfirm: () => {
                const foe = playerSide === 'attacker' ? 'defender' : 'attacker';
                playSfx('horn');
                start({ ...battle, winner: foe, withdrew: true });
              },
            })}
            title={t('撤兵 — 判負但保全現存兵力', 'Withdraw — concede but save your surviving troops')}
          >🏳 {t('撤退', 'Withdraw')}</HudButton>
        )}
        {/* 戰前準備 — one card, played before your first move. */}
        {myTurn && battle.turn === 1 && playerSide && !battle.prepUsed?.[playerSide] && !prepDismissed && (
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--tkm-hud-gold)' }}>{t('戰前部署:', 'Prep:')}</span>
            {([
              { kind: 'ambush' as const, zh: '⚔ 伏兵', en: '⚔ Ambush', tip: '最強一軍潛伏 — 敵近不見,首擊帶伏擊加成、且亂敵陣腳', tipEn: 'Your strongest unit lies hidden — unseen until it strikes, the first blow lands with an ambush bonus and rattles the enemy line' },
              { kind: 'night' as const, zh: '🌙 夜襲', en: '🌙 Night raid', tip: '入夜開戰 — 弓弩射程縮短,夜霧蔽視,伏兵傷害更狠', tipEn: 'Open at night — bows lose range, night fog cuts sight, ambushes hit harder' },
              { kind: 'tunnel' as const, side: 'attacker' as const, zh: '⛏ 地道', en: '⛏ Tunnel', tip: '攻城方限定 — 最弱一軍自地道潛入牆內(守將機警則中伏)', tipEn: 'Attacker only — your weakest unit slips inside the walls via a tunnel (a wary defender springs a trap)' },
              { kind: 'caltrops-trap' as const, side: 'defender' as const, zh: '🪤 拒馬', en: '🪤 Caltrops', tip: '守方限定 — 陣前布鐵蒺藜陷坑,挫銳騎(騎兵 2.5× 傷)', tipEn: 'Defender only — sow iron caltrops before your line to break charging horse (2.5× damage vs cavalry)' },
              { kind: 'fire-prep' as const, side: 'attacker' as const, zh: '🔥 火計', en: '🔥 Fire plot', tip: '攻城方限定 — 預伏油薪,開局敵營已起火(雨雪不可)', tipEn: 'Attacker only — pre-laid oil and kindling set the enemy camp ablaze at the start (not in rain/snow)' },
              { kind: 'decoy' as const, zh: '🚩 疑兵', en: '🚩 Decoy', tip: '虛張旗鼓 — 敵疑我眾,開局士氣 −10', tipEn: 'False banners — the enemy overcounts your host and opens at −10 morale' },
            ]).filter((p) => !('side' in p) || p.side === playerSide).map((p) => (
              <button
                key={p.kind}
                title={lang === 'en' ? p.tipEn : p.tip}
                onClick={() => {
                  const r = applyBattlePrep(battle, playerSide, p.kind, officers);
                  if (r.ok) { start(r.battle); playSfx('shout'); }
                  else setPrepMsg(r.reason ?? null);
                }}
                style={{
                  background: 'rgba(58, 45, 24, 0.8)', border: '1px solid var(--tkm-hud-gold)', color: '#f0d98a',
                  fontSize: '0.7rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{lang === 'en' ? p.en : p.zh}</button>
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
                  // 威名威懾 (§6.13) — a dreaded champion riding out cows the enemy host
                  // before a blow is struck (未戰先怯): a small morale sag by their fame.
                  // 武風懾人 (§6.18) — his whole court's martial repute rides with him.
                  const st0 = useGameStore.getState();
                  const dread = duelDread(me, ethosDreadBonus(realmEthos(st0.officers, st0.deeds ?? {}, me.forceId)));
                  if (dread > 0.05) {
                    const drop = Math.round(dread * 16);
                    start({ ...battle, units: battle.units.map((u) => (u.side === foeSide && u.troops > 0 ? { ...u, morale: Math.max(0, u.morale - drop) } : u)) });
                    setPrepMsg(t(`${me.name.zh}威名震懾 — 敵軍未戰先怯(士氣 −${drop})`, `${me.name.en}'s fame cows the foe — enemy morale −${drop}`));
                  }
                  setInteractiveDuel({ me, foe, meFatigue: myChamp.duelFatigue ?? 0, foeFatigue: foeChamp.duelFatigue ?? 0, reinforcements: [], terrain: pickDuelTerrain(), preBattle: true });
                }}
                style={{ background: 'rgba(70, 30, 24, 0.85)', border: '1px solid #e0846a', color: '#ffb098', fontSize: '0.7rem', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}
              >{t('🐎 致師', '🐎 Challenge')}</button>
            )}
            <button
              onClick={() => setPrepDismissed(true)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: 'var(--tkm-hud-dim)', fontSize: '0.7rem', padding: '2px 6px', cursor: 'pointer', fontFamily: 'inherit' }}
            >{t('不備', 'Skip')}</button>
            {prepMsg && <span style={{ fontSize: '0.72rem', color: '#ff9080' }}>{prepMsg}</span>}
          </span>
        )}
        {battle.attackerFormation && battle.attackerFormation !== 'none' && (
          <span
            title={t('攻方陣形', 'Attacker formation')}
            style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: 'rgba(60, 26, 22, 0.7)', border: '1px solid var(--tkm-hud-crimson)', color: '#ff9078',
            }}>{t('攻', 'ATK')}·{(() => { const f = FORMATIONS_BY_ID[battle.attackerFormation]; return f ? pickName(f.name, lang) : battle.attackerFormation; })()}</span>
        )}
        {battle.defenderFormation && battle.defenderFormation !== 'none' && (
          <span
            title={t('守方陣形', 'Defender formation')}
            style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: 'rgba(26, 40, 60, 0.7)', border: '1px solid #3a7dd9', color: 'var(--tkm-hud-blue)',
            }}>{t('守', 'DEF')}·{(() => { const f = FORMATIONS_BY_ID[battle.defenderFormation]; return f ? pickName(f.name, lang) : battle.defenderFormation; })()}</span>
        )}
        <button
          onClick={onEndTurn}
          disabled={!myTurn}
          style={{
            background: '#5a4530', color: 'var(--tkm-hud-cream)', border: '1px solid var(--tkm-hud-gold)',
            padding: '0.3rem 0.7rem', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)',
            opacity: !myTurn ? 0.4 : 1,
          }}
        >{t('結束回合', 'End Turn')}</button>
        {battle.spectate && (
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '0.72rem', color: 'var(--tkm-hud-amber)', border: '1px solid var(--tkm-hud-dim)', borderRadius: 'var(--tkm-radius-xs)', padding: '0.15rem 0.6rem', letterSpacing: '0.08rem' }}>
            👁 {t('演義重現 — 勝負不入史', 'Dramatization — nothing is recorded')}
          </span>
        )}
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
          aria-label={t('回大地圖觀戰', 'Watch from the world map')}
        >🌏 {t('大地圖', 'World')}</button>
        {/* Direct way out — instant for a drill, confirmed for a real battle
            (forfeiting / 棄城 has consequences). The 2D view is retired. */}
        <button
          onClick={() => {
            if (battle.spectate) { dismissSpectate(); return; } // 演義重現 — nothing to settle
            if (battle.practice) { endDrill(); return; } // bank 練度/歷練 by result
            setConfirmDialog({
              title: { zh: '退出戰鬥', en: 'Leave Battle' },
              body: { zh: '確定退出此戰?棄戰/棄城將有後果。', en: 'Leave this battle? Forfeiting the field has consequences.' },
              confirmLabel: { zh: '退出', en: 'Leave' },
              danger: true,
              onConfirm: () => cancelBattle(),
            });
          }}
          style={{
            marginLeft: '0.4rem',
            background: '#3a1a16', color: '#f0c0b0', border: '1px solid #b8584a',
            padding: '0.3rem 0.8rem', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)',
          }}
          title={battle.practice ? t('結束演習', 'End the drill') : t('退出戰鬥', 'Leave the battle')}
          aria-label={battle.practice ? t('結束演習', 'End the drill') : t('退出戰鬥', 'Leave the battle')}
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
          // Remounts with a fresh GL context if the old one is lost and never
          // restored. This scene is the heaviest of the three AND runs while
          // the strategic map's context is still alive, so it is the most
          // likely to be dropped under memory pressure — and a black battle
          // screen mid-engagement is unrecoverable without it.
          key={glEpoch}
          onCreated={({ gl }) => attachGLRecovery(gl)}
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
            {!fxDegraded && (
              <ScenePostFx
                mobile={IS_MOBILE}
                ao={{ radius: 1.2, intensity: 2.4 }}
                bloom={{ threshold: 0.7, intensity: 0.6 }}
                dof={duelFocus
                  ? { target: [duelFocus[0], 1.0, duelFocus[1]], focalLength: 0.04, bokehScale: 5 }
                  : null}
                grade={{ saturation: 0.12, contrast: 0.12 }}
                vignette={{ offset: 0.25, darkness: 0.62 }}
              />
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
        {/* Read-only info for enemy units — mirrors the friendly UnitPanel3D's
            top-right anchor (they're mutually exclusive: one unit selected at a
            time), keeping the bottom-left corner clear for the two maps. */}
        {selectedUnit && (!playerSide || selectedUnit.side !== playerSide) && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            width: 280, maxWidth: 'calc(100vw - 32px)',
            background: 'rgba(20, 14, 8, 0.92)',
            border: '1px solid var(--tkm-hud-crimson)',
            padding: '0.6rem 0.9rem',
            color: 'var(--tkm-hud-cream)',
            fontFamily: 'var(--tkm-font-body)',
            boxShadow: '0 0 16px rgba(184, 68, 46, 0.4)',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
              {(() => { const o = officers[selectedUnit.officerId]; return o ? pickName(o.name, lang) : '?'; })()} ({UNIT_GLYPH[selectedUnit.unitType]})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tkm-hud-tan)' }}>
              {t('敵', 'ENEMY')} · {t(officers[selectedUnit.officerId]?.name.zh ?? '', officers[selectedUnit.officerId]?.name.en ?? '')}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {t('兵', 'HP')} {selectedUnit.troops.toLocaleString()}/{selectedUnit.maxTroops.toLocaleString()} ·
              {t('行', 'AP')} {selectedUnit.ap}/{selectedUnit.maxAp} · {t('氣', 'Mor')} {selectedUnit.morale}
              {isRouting(selectedUnit) && <span style={{ color: '#e0623a', fontWeight: 'bold' }}> · {t('潰走', 'ROUTING')}</span>}
              {(selectedUnit.fatigue ?? 0) > 0 && <span style={{ color: (selectedUnit.fatigue ?? 0) >= 70 ? '#e0623a' : '#caa15a' }}> · {t('疲', 'Ftg')} {Math.round(selectedUnit.fatigue ?? 0)}</span>}
              {selectedUnit.maxAmmo !== undefined && <span style={{ color: (selectedUnit.ammo ?? 0) <= 0 ? '#e0623a' : 'var(--tkm-hud-blue)' }}> · {t('矢', 'Amo')} {selectedUnit.ammo ?? 0}/{selectedUnit.maxAmmo}</span>}
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
              border: '1px solid var(--tkm-hud-gold)',
              padding: '0.45rem 1.2rem',
              color: 'var(--tkm-hud-cream)',
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
              textShadow: '0 0 22px var(--tkm-hud-gold), 0 0 44px rgba(212,168,74,0.6), 0 4px 0 #2a1f15',
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

        {/* 提示 — transient rule-feedback toast (replaces mid-battle alert()). */}
        {hudToast && (
          <div
            key={hudToast}
            role="status"
            style={{
              position: 'absolute', bottom: '14%', left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none', zIndex: 60,
              background: 'rgba(48, 22, 16, 0.94)',
              border: '1px solid #b8584a', borderRadius: 'var(--tkm-radius)',
              color: '#ffcbb8', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
              padding: '0.4rem 0.9rem', letterSpacing: '0.04rem',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
              animation: 'tkmFadeIn 0.18s ease-out',
              whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            ⚠ {hudToast}
          </div>
        )}

        {/* 戰報抽屜 — the recent battle log, newest first; toggled from the top bar. */}
        {showLog && (
          <div style={{
            position: 'absolute', left: '50%', bottom: '11%',
            transform: 'translateX(-50%)',
            width: 'min(460px, 88vw)', maxHeight: '34vh', overflowY: 'auto',
            zIndex: 55,
            background: 'rgba(16, 12, 8, 0.94)',
            border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius)',
            boxShadow: '0 6px 22px rgba(0,0,0,0.55)',
            fontFamily: 'var(--tkm-font-body)',
            animation: 'tkmFadeIn 0.18s ease-out',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.4rem 0.7rem', borderBottom: '1px solid #2a2015', position: 'sticky', top: 0,
              background: 'rgba(16, 12, 8, 0.98)',
            }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.12rem', color: 'var(--tkm-hud-gold)' }}>📜 {t('戰報', 'Battle Log')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* 逐擊/要事 — the play-by-play is on by default (that is the point
                    of it), but a long siege turns it into a wall of blows, so it
                    can be muted back down to the dramatic beats. */}
                <button
                  onClick={() => setLogBlows((v) => !v)}
                  aria-pressed={logBlows}
                  title={t('逐擊戰報 — 每一次交鋒的細節', 'Play-by-play — every exchange in detail')}
                  style={{
                    background: logBlows ? 'rgba(200,160,80,0.18)' : 'transparent',
                    border: `1px solid ${logBlows ? '#8a6a3a' : '#3a2f22'}`,
                    borderRadius: 4, color: logBlows ? 'var(--tkm-hud-gold)' : 'var(--tkm-hud-dim)',
                    cursor: 'pointer', fontSize: '0.62rem', padding: '0.1rem 0.4rem', lineHeight: 1.5,
                  }}
                >{t('逐擊', 'Blows')}</button>
                <button
                  onClick={() => setShowLog(false)}
                  aria-label={t('關閉戰報', 'Close log')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--tkm-hud-dim)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                >×</button>
              </div>
            </div>
            <div style={{ padding: '0.4rem 0.7rem' }}>
              {(() => {
                const all = battle.log ?? [];
                const shown = logBlows ? all : all.filter((e) => e.kind !== 'blow');
                const entries = shown.slice(-60).reverse();
                if (entries.length === 0) return <div style={{ fontSize: '0.75rem', color: '#7a6850', fontStyle: 'italic', padding: '0.3rem 0' }}>{t('尚無戰報。', 'No events yet.')}</div>;
                return entries.map((e, i) => (
                  <div key={i} style={{
                    fontSize: e.kind === 'blow' ? '0.71rem' : '0.75rem', lineHeight: 1.6, padding: '0.12rem 0',
                    color: e.kind === 'event' ? '#e8c878' : e.kind === 'arrival' ? '#9ed6c0' : e.kind === 'blow' ? '#9d9078' : '#bcb090',
                    borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{ color: '#6a5c44', fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', marginRight: 6 }}>{t(`第${e.turn}回`, `T${e.turn}`)}</span>
                    {lang === 'en' && e.textEn ? e.textEn : e.text}
                  </div>
                ));
              })()}
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
                padding: '0.5rem 0.7rem', color: 'var(--tkm-hud-cream)', fontFamily: 'var(--tkm-font-body)',
                fontSize: '0.82rem', boxShadow: `0 0 14px ${verdictColor}44`,
              }}>
                <div style={{ fontWeight: 'bold', color: verdictColor, marginBottom: '0.25rem' }}>
                  ⚔ {t('戰鬥預判', 'Forecast')}{f.willKill ? ` · ${t('可殲滅', 'LETHAL')}` : ''}
                </div>
                <div>{t('預估傷害', 'Damage')}: <b>{f.dmgMin.toLocaleString()}–{f.dmgMax.toLocaleString()}</b></div>
                <div style={{ color: f.counterMax > 0 ? 'var(--tkm-hud-ember)' : '#8a9a7a' }}>
                  {t('反擊', 'Counter')}: {f.counterMax > 0 ? `${f.counterMin.toLocaleString()}–${f.counterMax.toLocaleString()}` : t('無', 'none')}
                </div>
                {ml && (
                  <div style={{ color: 'var(--tkm-hud-mint)' }}>↑ {t(`${ml.zh} ×${f.counterMult.toFixed(2)}`, `${ml.en} ×${f.counterMult.toFixed(2)}`)}</div>
                )}
                {counterBad && (
                  <div style={{ color: '#e88a7a' }}>↓ {t(`被${counterBad.zh}`, `vuln ${counterBad.en}`)}</div>
                )}
                {/* 向背 — name the arc this blow lands on. The engine already
                    applies ×1.25 / ×1.12 for rear and flank; without this the
                    player had to guess where the target was pointed. */}
                {(() => {
                  const arcKind = hitArc(tgt, selectedUnit.coord);
                  if (arcKind === 'front' || arcKind === 'unknown') return null;
                  const L = ARC_LABEL[arcKind];
                  return (
                    <div style={{ color: arcKind === 'rear' ? '#ff8a6a' : '#e0c070' }}>
                      {arcKind === 'rear' ? '⇠' : '⇢'} {t(`擊其${L.zh}`, `${L.en} attack`)} ×{ARC_MUL[arcKind].toFixed(2)}
                    </div>
                  );
                })()}
                {f.defShield < 1 && (
                  <div style={{ color: '#a0b8d8' }}>🛡 {t('敵據地利', 'enemy terrain')} ×{f.defShield.toFixed(2)}</div>
                )}
                {f.terrainAtk !== 1 && (
                  <div style={{ color: f.terrainAtk > 1 ? 'var(--tkm-hud-mint)' : 'var(--tkm-hud-ember)' }}>
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
          const terLabel = tl ? TERRAIN_LABEL[tl.terrain] : null;
          const ter: [string, string] | null = terLabel ? [terLabel.zh, terLabel.en] : null;
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
                <div style={{ color: 'var(--tkm-hud-mint)' }}>🛡 {t(`守此格受擊 ×${shield.toFixed(2)}`, `defence ×${shield.toFixed(2)}`)}</div>
              )}
              {cost < 99 && cost > 1 && (
                <div style={{ color: '#c0a878' }}>👣 {t(`移入耗 ${cost} AP`, `${cost} AP to enter`)}</div>
              )}
              {cost >= 99 && (
                <div style={{ color: 'var(--tkm-hud-ember)' }}>✕ {t('不可通行', 'impassable')}</div>
              )}
              {mine && atkMod !== 1 && (
                <div style={{ color: atkMod > 1 ? 'var(--tkm-hud-mint)' : 'var(--tkm-hud-ember)' }}>
                  {atkMod > 1 ? '⤴' : '⤵'} {t(`我軍在此出擊 ×${atkMod.toFixed(2)}`, `attacking from here ×${atkMod.toFixed(2)}`)}
                </div>
              )}
              {/* 攻城預判 — a besieged wall is a race between the ram and the
                  garrison's repairs, and the engine runs it in full. Say how
                  many more assaults this contingent needs, and warn when 搶修
                  is undoing the battering faster than it lands. */}
              {tl && (tl.terrain === 'wall' || tl.terrain === 'gate') && (() => {
                const hp = battle.wallHp?.[wallKey(hovered)];
                if (hp === undefined) return null;
                const st = wallState(hp, tl.terrain);
                const L = WALL_STATE_LABEL[st];
                const siege = mine && selectedUnit!.unitType === 'siege'
                  && hexDistance(selectedUnit!.coord, hovered) === 1
                  ? selectedUnit! : null;
                return (
                  <>
                    <div style={{ color: L.color }}>
                      🧱 {t(`城防 ${L.zh}`, `Fortification ${L.en}`)}
                      {' '}{Math.max(0, Math.round(hp)).toLocaleString()}/{fortMaxHp(tl.terrain).toLocaleString()}
                    </div>
                    {siege && (
                      <div style={{ color: 'var(--tkm-hud-gold)' }}>
                        🔨 {t(`再攻 ${hitsToBreach(hp, siege.troops)} 次可破`, `${hitsToBreach(hp, siege.troops)} more assaults to breach`)}
                      </div>
                    )}
                    {siege && repairsOutpace(siege.troops) && (
                      <div style={{ color: 'var(--tkm-hud-ember)' }}>
                        ⚠ {t('守軍搶修快過此部鑿擊 — 需再調攻城械或改雲梯登城', 'Repairs out-pace this engine — bring another or scale the wall')}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          );
        })()}

        {/* 戰場小地圖 — corner overview of all units. */}
        <BattleMinimap battle={battle} playerSide={playerSide} />

        {/* Action mode hint */}
        {actionMode.kind !== 'none' && myTurn && (() => {
          const config = {
            move: { color: 'var(--tkm-hud-green)', text: t('點擊綠色格子移動', 'Click a green tile to move') },
            attack: { color: 'var(--tkm-hud-red)', text: t('點擊紅色敵軍攻擊', 'Click a red enemy to attack') },
            duel: { color: 'var(--tkm-hud-gold)', text: t('點擊相鄰敵將一騎打', 'Click an adjacent enemy to duel') },
            stratagem: { color: '#c19a3b', text: t('點擊目標施放計略', 'Click a target to cast stratagem') },
            gauntlet: {
              color: 'var(--tkm-hud-gold)',
              text: t('點擊要圍攻的敵將 — 眾人輪番上陣', 'Click the enemy to gang up on — your officers go at him in turn'),
            },
            surrender: {
              color: 'var(--tkm-hud-mint)',
              text: t('點擊要招降的殘破敵將', 'Click the broken enemy to call on'),
            },
            siege: {
              color: 'var(--tkm-hud-ember)',
              text: actionMode.kind === 'siege' && actionMode.act === 'repair'
                ? t('點擊要搶修的城防', 'Click the fortification to repair')
                : actionMode.kind === 'siege' && actionMode.act === 'scale'
                  ? t('點擊要攀登的城牆', 'Click the wall to scale')
                  : t('點擊要鑿擊的城牆或城門', 'Click the wall or gate to batter'),
            },
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
                <span style={{ color: sitUp ? 'var(--tkm-hud-mint)' : 'var(--tkm-hud-ember)', marginLeft: '0.5rem' }}>
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
            <div style={{ fontSize: '0.9rem', color: 'var(--tkm-hud-gold)', letterSpacing: '0.5rem', marginBottom: '0.4rem' }}>
              ⚔ {t('兩軍對壘', 'THE ARMIES MEET')} ⚔
            </div>
            <div style={{ fontSize: 'clamp(1.4rem, 5vw, 2.6rem)', fontWeight: 700, color: 'var(--tkm-hud-cream)', textShadow: '0 2px 12px #000, 0 0 20px rgba(0,0,0,0.6)' }}>
              <span style={{ color: '#7ed6e0' }}>{cmdr(me)}</span>
              <span style={{ color: 'var(--tkm-hud-ember)', margin: '0 1rem' }}>⚔</span>
              <span style={{ color: '#ff8a6a' }}>{cmdr(foe)}</span>
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--tkm-hud-tan)', marginTop: '0.3rem', fontFamily: 'ui-monospace, monospace' }}>
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
            // 演義重現 — pure theatre; the campaign never hears of it.
            if (battle.spectate) {
              dismissSpectate();
              setShowResults(false);
              return;
            }
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
      {/* 確認 — styled confirm for 撤退 / 退出 (was a jarring OS window.confirm). */}
      {confirmDialog && (
        <Modal
          onClose={() => setConfirmDialog(null)}
          title={lang === 'en' ? confirmDialog.title.en : confirmDialog.title.zh}
          icon="⚠"
          width="min(400px, 92vw)"
          zIndex={1500}
          ariaLabel={lang === 'en' ? confirmDialog.title.en : confirmDialog.title.zh}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#cdd6df', lineHeight: 1.7, marginBottom: '1.1rem' }}>
              {lang === 'en' ? confirmDialog.body.en : confirmDialog.body.zh}
            </div>
            <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'center' }}>
              <button
                onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); fn(); }}
                style={{
                  flex: 1, padding: '0.55rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', letterSpacing: '0.08rem',
                  background: confirmDialog.danger ? 'linear-gradient(180deg,#7a2a20,#4a1810)' : 'linear-gradient(180deg,#3a2d18,#2a1f10)',
                  border: `1px solid ${confirmDialog.danger ? '#e0846a' : '#e6c473'}`,
                  color: confirmDialog.danger ? '#ffe0d0' : '#f2dd9a',
                }}
              >{lang === 'en' ? confirmDialog.confirmLabel.en : confirmDialog.confirmLabel.zh}</button>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{ flex: 1, padding: '0.55rem', background: '#1e2832', border: '1px solid #364654', color: 'var(--tkm-hud-grey)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.08rem' }}
              >{t('取消', 'Cancel')}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 敵將叫陣 — accept to duel, or refuse. Esc / backdrop = 避戰 (the app-wide
          dismiss gesture now works, instead of trapping the player). */}
      {challenge && !interactiveDuel && (
        <Modal
          onClose={() => setChallenge(null)}
          title={t('陣前叫陣', 'A Challenge')}
          icon="⚔"
          width="min(420px, 92vw)"
          zIndex={1400}
          ariaLabel={t('陣前叫陣', 'A challenge')}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t(`${challenge.foe.name.zh} 立馬陣前,大喝挑戰!`, `${challenge.foe.name.en} rides forth and calls you out!`)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--tkm-hud-grey)', marginBottom: '1.2rem' }}>
              {t(`「${challenge.me.name.zh},可敢與我一戰?」`, `"${challenge.me.name.en} — do you dare face me?"`)}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => { setInteractiveDuel({ ...challenge, terrain: pickDuelTerrain() }); setChallenge(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >{t('應戰!', 'Accept!')}</button>
              <button
                onClick={() => setChallenge(null)}
                style={{ flex: 1, padding: '0.6rem', background: '#1e2832', border: '1px solid #364654', color: 'var(--tkm-hud-grey)', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1rem' }}
              >{t('避戰', 'Refuse')}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 斬/擒 — the defeated foe's fate is yours to decide. A forced choice:
          no Esc/backdrop/close so the player must pick 斬 or 生擒. */}
      {captureChoice && (
        <Modal
          onClose={() => {}}
          hideClose
          closeOnEsc={false}
          closeOnBackdrop={false}
          width="min(420px, 92vw)"
          zIndex={1450}
          ariaLabel={t('處置敗將', "The captive's fate")}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t(`${captureChoice.name.zh} 已敗於你劍下!`, `${captureChoice.name.en} falls before you!`)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--tkm-hud-grey)', marginBottom: '1.2rem' }}>{t('斬之以絕後患,還是生擒以圖招攬?', 'Cut them down — or take them alive to win over?')}</div>
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
        </Modal>
      )}

      {/* 團戰並擊 (§6.11) — both champions have supporters at their side: choose a
          classic 1v1 (allies wait to 援護) or crash the two knots together. */}
      {meleePrompt && (
        <Modal
          onClose={() => setMeleePrompt(null)}
          width="min(460px, 94vw)"
          zIndex={1450}
          ariaLabel={t('團戰並擊', 'Team melee')}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>
              {t('兩陣群英相對!', 'Champions mass on both sides!')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--tkm-hud-grey)', marginBottom: '0.8rem' }}>
              {t(`我方 ${meleePrompt.mine.map((o) => o.name.zh).join('・')} ⚔ 敵陣 ${meleePrompt.foes.map((o) => o.name.zh).join('・')}`,
                `${meleePrompt.mine.map((o) => o.name.en).join(', ')} vs ${meleePrompt.foes.map((o) => o.name.en).join(', ')}`)}
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  const p = meleePrompt;
                  setMeleePrompt(null);
                  setInteractiveDuel({ me: p.me, foe: p.foe, meFatigue: p.meFatigue, foeFatigue: p.foeFatigue, reinforcements: p.mine.slice(1), terrain: p.terrain });
                }}
                title={t('經典一騎打 — 友將立於陣側,力戰不支時援護接力', 'A classic 1v1 — allies stand by to relieve you mid-bout')}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#3a3020,#241c10)', border: '1px solid #e6c473', color: '#f0d890', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
              >⚔ {t('一騎打', '1v1 Duel')}</button>
              <button
                onClick={() => {
                  const p = meleePrompt;
                  setMeleePrompt(null);
                  // 親督 — the melee fights out interactively; consequences bind on completion.
                  setFieldMeleeLive({ me: p.me, foe: p.foe, mine: p.mine, foes: p.foes });
                }}
                title={t('團戰並擊 — 兩陣群將混戰,你親自督戰:每合下集火/死守之令;被斬者亡、請降者被擒、落荒者逸,全軍士氣隨之', 'Crash the knots together — YOU command the melee round by round: the slain fall, the yielded are bound, the fled escape; army morale swings')}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#5a2a20,#3a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}
              >🔥 {t('團戰並擊', 'Team Melee')}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 親督團戰 — the interactive melee; its outcome binds exactly like the
          auto-resolved one did (same TeamDuelResult through the same code). */}
      {fieldMeleeLive && (
        <InteractiveTeamDuel3D
          sideA={fieldMeleeLive.mine.map((o) => ({ officer: o }))}
          sideB={fieldMeleeLive.foes.map((o) => ({ officer: o }))}
          onComplete={(res) => {
            const p = fieldMeleeLive;
            setFieldMeleeLive(null);
            const b = useGameStore.getState().tacticalBattle;
            if (!b || !playerSide) return;
            (() => {
                  const downed = [...res.a, ...res.b].filter((f) => f.downed);
                  const downedIds = new Set(downed.map((f) => f.id));
                  const partIds = new Set([...p.mine, ...p.foes].map((o) => o.id));
                  const prevCas = b.casualties ?? { attacker: [], defender: [] };
                  const cas = { attacker: [...prevCas.attacker], defender: [...prevCas.defender] };
                  const forcedKills = [...(b.forcedKills ?? [])];
                  const forcedCaptures = [...(b.forcedCaptures ?? [])];
                  for (const f of downed) {
                    const du = b.units.find((uu) => uu.officerId === f.id);
                    if (du) cas[du.side].push(f.id);
                    // 斬/擒/逃 — a slain foe falls for good, a yielded one is bound,
                    // a fled one escapes the field; survivors of a knockout carry wounds.
                    if (f.side === 'b') {
                      if (f.fate === 'slain') forcedKills.push(f.id);
                      else if (f.fate === 'yield') forcedCaptures.push(f.id);
                    }
                    if (f.fate !== 'slain') afflictOfficer(f.id, duelWound(true));
                  }
                  const winSide = res.winner === 'a' ? playerSide : res.winner === 'b' ? (playerSide === 'attacker' ? 'defender' : 'attacker') : null;
                  const headZh = res.winner === 'a' ? `${p.me.name.zh} 率眾將團戰並擊 — 大破敵陣群英!`
                    : res.winner === 'b' ? `團戰失利 — ${p.foe.name.zh} 等敵將勢盛!`
                    : `${p.me.name.zh} 與 ${p.foe.name.zh} 兩陣群英鏖戰 — 各自收兵。`;
                  const headEn = res.winner === 'a' ? `${p.me.name.en} leads the melee — the enemy champions are broken!`
                    : res.winner === 'b' ? `The melee is lost — ${p.foe.name.en}'s knot prevails!`
                    : `The champions fight to a standstill — both sides withdraw.`;
                  start({
                    ...b,
                    units: b.units
                      .filter((uu) => !downedIds.has(uu.officerId))
                      .map((uu) => {
                        let unit = uu;
                        if (partIds.has(uu.officerId)) unit = { ...unit, ap: 0, duelFatigue: (unit.duelFatigue ?? 0) + 24 };
                        if (winSide) unit = uu.side === winSide
                          ? { ...unit, morale: Math.min(100, unit.morale + 12) }
                          : { ...unit, morale: Math.max(0, unit.morale - 18) };
                        return unit;
                      }),
                    casualties: cas,
                    forcedKills, forcedCaptures,
                    log: [
                      ...(b.log ?? []),
                      { turn: b.turn, text: headZh, textEn: headEn, kind: 'event' as const },
                      ...res.log.map((l) => ({ turn: b.turn, text: l.zh, textEn: l.en, kind: 'event' as const })),
                    ],
                  });
                  // 名聲/武學 — the captain banks the win; survivors hone their craft.
                  const st = useGameStore.getState();
                  if (res.winner === 'a') { recordDeed(p.me.id, { duelsWon: 1 }); st.fireAchievement({ kind: 'field-melee' }); } // 群英並擊
                  for (const f of res.a) if (!f.downed) st.awardMartialInsight(f.id, 2);
                  for (const f of res.b) if (!f.downed) st.growMartialXiuwei(f.id, 1);
                  setSignatureBanner({ zh: headZh, en: headEn, key: Date.now() });
                  setCine({ key: ++cineCount.current, weight: 3, color: 'var(--tkm-hud-amber)' });
                  setTimeout(() => setSignatureBanner(null), 2400);
                  st.recordMeleeBout(res); // 團戰名局廊 — archive the field melee
            })();
          }}
        />
      )}

      {/* 團戰同場 — a resolved melee replays with every champion in-ring. */}
      {fieldMeleeStage && (
        <TeamDuel3DStage result={fieldMeleeStage} onDone={() => setFieldMeleeStage(null)} />
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
            // 怯戰 — a foe who 請降 / 落荒而逃 is out of the fight: removed with no kill
            // (yield → capturable below; flee → simply gone from the field).
            const foeBroke = outcome.fate && outcome.winner === 'attacker' ? outcome.fate : null;
            const removedId = killedId ?? (foeBroke ? foe.id : null);
            let next = battle;
            if (removedId) {
              const fallen = next.units.find((u) => u.officerId === removedId);
              const prevCas = next.casualties ?? { attacker: [], defender: [] };
              next = {
                ...next,
                units: next.units.filter((u) => u.officerId !== removedId),
                casualties: fallen
                  ? { ...prevCas, [fallen.side]: [...prevCas[fallen.side], removedId] }
                  : prevCas,
              };
            }
            const duelWinner = outcome.winner === 'attacker' ? me : foe;
            const duelLoser = outcome.winner === 'attacker' ? foe : me;
            next = {
              ...next,
              log: [...(next.log ?? []), {
                turn: next.turn,
                text: outcome.winner === 'draw'
                  ? `${me.name.zh} 與 ${foe.name.zh} 大戰不分勝負 — 俱各帶傷。`
                  : foeBroke === 'yield' ? `${foe.name.zh} 力盡棄械,陣前請降!`
                  : foeBroke === 'flee' ? `${foe.name.zh} 膽寒,撥馬落荒而逃!`
                  : `${duelWinner.name.zh} 於陣前力克 ${duelLoser.name.zh}!`,
                textEn: outcome.winner === 'draw'
                  ? `${me.name.en} and ${foe.name.en} fought to a draw — both wounded.`
                  : foeBroke === 'yield' ? `${foe.name.en} throws down his arms and yields on the field!`
                  : foeBroke === 'flee' ? `${foe.name.en} loses his nerve and flees the field!`
                  : `${duelWinner.name.en} bested ${duelLoser.name.en} in single combat!`,
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
              if (loserId !== removedId) {
                next = { ...next, units: next.units.map((u) => u.officerId === loserId ? { ...u, troops: Math.round(u.troops * 0.82) } : u) };
              }
              const wn = outcome.winner === 'attacker' ? me : foe;
              setSignatureBanner(preBattle
                ? { zh: `致師奏功 — ${wn.name.zh} 陣前折服敵將!`, en: `${wn.name.en} wins the pre-battle challenge!`, key: Date.now() }
                : { zh: `一騎討 — ${wn.name.zh} 力克強敵!`, en: `${wn.name.en} wins the duel!`, key: Date.now() });
              setCine({ key: ++cineCount.current, weight: 3, color: 'var(--tkm-hud-amber)' });
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
              if (woundedId !== removedId) {
                afflictOfficer(woundedId, duelWound(true));
                // 傷殘 — a brutal field duel may cripple the bested-but-living fighter
                // for good (斷臂/目眇/跛足) — a permanent narrowing of their craft.
                const scar = rollDuelScar();
                if (scar) inflictDuelScar(woundedId, scar);
              }
              // 慘勝 — a hard-won bout bloodies the VICTOR too: a light lingering
              // wound (養傷 downtime), so a costly win isn't a free one (§6.13).
              if (outcome.hardWon) {
                const victorId = outcome.winner === 'attacker' ? me.id : foe.id;
                afflictOfficer(victorId, duelWound(false));
              }
              // 名聲榜 — the victor banks a 單挑 win toward their renown.
              recordDeed(outcome.winner === 'attacker' ? me.id : foe.id, { duelsWon: 1 });
            }
            setInteractiveDuel(null);
            // 斬/擒 — a felled or surrendered foe may be taken alive; a fled one is gone.
            if ((killedId && killedId === foe.id) || foeBroke === 'yield') setCaptureChoice({ id: foe.id, name: foe.name });
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
  const t = useT();
  const W = 150, H = Math.round(150 * (battle.height / battle.width));
  const dot = (bg: string, ring?: boolean) => (
    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: bg, border: ring ? '1.5px solid #f0d070' : 'none', verticalAlign: 'middle' }} />
  );
  return (
    <div
      title={t('戰場全覽 — 藍:我方 · 紅:敵軍 · 金圈:主將', 'Battlefield overview — blue: yours · red: enemy · gold ring: commander')}
      style={{
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
      {/* 圖例 — a thin caption strip decodes the dots (was an unexplained blob). */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        display: 'flex', gap: 7, justifyContent: 'center', alignItems: 'center',
        padding: '1px 0', fontSize: '0.56rem', letterSpacing: '0.03rem',
        color: '#c8b59a', background: 'rgba(10, 8, 5, 0.72)',
      }}>
        <span>{dot('#5a9ee0')} {t('我', 'You')}</span>
        <span>{dot('#e06a52')} {t('敵', 'Foe')}</span>
        <span>{dot('#2a2015', true)} {t('主將', 'Cmdr')}</span>
      </div>
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
  // 車輪戰 needs the whole roster to judge who may join the rush.
  const officers = useGameStore((s) => s.officers);
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
    color: 'var(--tkm-hud-cream)',
    fontFamily: 'var(--tkm-font-body)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textAlign: 'left',
  };
  const btnActive: React.CSSProperties = {
    background: 'rgba(212, 168, 74, 0.25)',
    borderColor: 'var(--tkm-hud-gold)',
    color: 'var(--tkm-hud-cream)',
  };

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, bottom: 16,
      width: 280,
      background: 'rgba(20, 14, 8, 0.94)',
      border: '1px solid var(--tkm-hud-gold)',
      padding: '0.7rem 0.8rem',
      color: 'var(--tkm-hud-cream)',
      fontFamily: 'var(--tkm-font-body)',
      boxShadow: '0 0 16px rgba(212, 168, 74, 0.4)',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--tkm-hud-dim)', letterSpacing: '0.05rem' }}>{t('已選', 'SELECTED')}</div>
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
              {officer ? (
                <OfficerPortrait officer={officer} size={48} forceColor={rc} />
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 700, color: '#f4e8c8', fontFamily: 'var(--tkm-font-body)', textShadow: '0 2px 4px #000' }}>{surname}</span>
              )}
              <span style={{
                position: 'absolute', bottom: -1, right: -1, fontSize: '0.7rem',
                background: rc, color: '#1a120a', padding: '0 3px', fontWeight: 700, borderRadius: 'var(--tkm-radius-xs)',
              }}>{role}</span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.15rem' }}>{officer ? pickName(officer.name, lang) : '?'}</div>
              {lang !== 'en' && <div style={{ fontSize: '0.7rem', color: 'var(--tkm-hud-tan)' }}>{officer?.name.en ?? ''}</div>}
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
        <div style={{ fontSize: '0.66rem', color: 'var(--tkm-hud-dim)', marginTop: 4, letterSpacing: '0.08rem' }}>
          {t('統', 'LED')} {officer.stats.leadership} · {t('武', 'WAR')} {officer.stats.war} · {t('智', 'INT')} {officer.stats.intelligence}
        </div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem',
        fontSize: '0.72rem', marginTop: '0.5rem',
      }}>
        <span title={t('兵力', 'Troops')}>{t('兵', 'HP')} <strong>{unit.troops.toLocaleString()}</strong>/{unit.maxTroops.toLocaleString()}</span>
        <span title={t('行動點', 'Action points')}>{t('行', 'AP')} <strong style={{ color: unit.ap === 0 ? 'var(--tkm-hud-crimson)' : 'var(--tkm-hud-green)' }}>{unit.ap}</strong>/{unit.maxAp}</span>
        <span>{t('士氣', 'Morale')} <strong style={{ color: isRouting(unit) ? '#e0623a' : unit.morale < 40 ? '#caa15a' : unit.morale >= 80 ? 'var(--tkm-hud-green)' : '#cdbb95' }}>{unit.morale}</strong>
          {isRouting(unit) ? ` ${t('潰走', 'ROUT')}` : unit.morale < 40 ? ` ${t('動搖', 'shaken')}` : unit.morale >= 80 ? ` ${t('高昂', 'high')}` : ''}</span>
        <span>{lang === 'en' ? UNIT_TYPE_LABEL[unit.unitType].en : UNIT_TYPE_LABEL[unit.unitType].zh}</span>
        {(unit.charge?.dist ?? 0) >= 2 && (
          <span style={{ color: '#ffb24a' }}>{t('衝鋒', 'Charge')} <strong>×{unit.charge!.dist}</strong></span>
        )}
        {(unit.fatigue ?? 0) > 0 && (
          <span>{t('疲乏', 'Fatigue')} <strong style={{ color: (unit.fatigue ?? 0) >= 70 ? '#e0623a' : '#caa15a' }}>{Math.round(unit.fatigue ?? 0)}</strong>{(unit.fatigue ?? 0) >= 70 ? ` ⚠` : ''}</span>
        )}
        {unit.maxAmmo !== undefined && (
          <span>{t('弓矢', 'Arrows')} <strong style={{ color: (unit.ammo ?? 0) <= 0 ? '#e0623a' : 'var(--tkm-hud-blue)' }}>{unit.ammo ?? 0}</strong>/{unit.maxAmmo}</span>
        )}
      </div>
      {unit.effects.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          {unit.effects.map((e, i) => {
            // Shared with the board nameplate (see battle3d/statusBadges) so
            // the two can't drift apart on name or colour.
            const badge = STATUS_BADGE[e.kind];
            const col = badge?.color ?? '#88b7e8';
            return (
              <span key={i} style={{
                fontSize: '0.7rem', padding: '1px 5px',
                border: `1px solid ${col}`, color: col, borderRadius: 'var(--tkm-radius-xs)',
              }}
              title={badge ? t(badge.tipZh, badge.tipEn) : undefined}
              >{t(badge?.zh ?? e.kind, badge?.en ?? e.kind)} {e.turnsLeft}t</span>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '0.7rem', borderTop: '1px solid #3a2818', paddingTop: '0.5rem' }}>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'move' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'move' ? { kind: 'none' } : { kind: 'move' })}
        >{t('移動', 'Move')} <span style={{ float: 'right', color: 'var(--tkm-hud-dim)' }}>1 AP/{t('格', 'hex')}</span></button>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'attack' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'attack' ? { kind: 'none' } : { kind: 'attack' })}
        >{t('攻擊', 'Attack')} <span style={{ float: 'right', color: 'var(--tkm-hud-dim)' }}>1 AP</span></button>
        <button
          style={{ ...btnBase, ...(actionMode.kind === 'duel' ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
          disabled={apDisabled}
          onClick={() => setActionMode(actionMode.kind === 'duel' ? { kind: 'none' } : { kind: 'duel' })}
        >{t('一騎打', 'Duel')} <span style={{ float: 'right', color: 'var(--tkm-hud-gold)' }}>{t('生死', 'kill')}</span></button>
        {/* 陣中築壘 — entrench the current hex: shield ×0.85, slows entry,
            breaks cavalry charges. Open firm ground only; burns if fired. */}
        {canFortify(battle, unit) && (
          <button
            style={{ ...btnBase, opacity: apDisabled ? 0.4 : 1 }}
            disabled={apDisabled}
            title={t('就地築壘:本格化為工事 — 受擊×0.85、敵入耗步、破騎兵衝鋒。木柵怕火。', 'Entrench: this hex becomes fieldworks — damage ×0.85, slows entry, breaks cavalry charges. Burns.')}
            onClick={() => { playSfx('click'); startBattle(fortifyTile(battle, unit.id)); setActionMode({ kind: 'none' }); }}
          >⛏ {t('築壘', 'Entrench')} <span style={{ float: 'right', color: 'var(--tkm-hud-dim)' }}>{FIELDWORKS_AP_COST} AP</span></button>
        )}
        {/* 脫離 — pull ONE battered unit off the field instead of conceding the
            whole battle. The engine has had this since the AI learned to save
            its wounded; the player's only exit was 撤退 (the entire army). Only
            offered where the engine allows it: back at your own edge, not the
            commander. 10% of the unit is written off as stragglers. */}
        {canRetreatUnit(battle, unit) && (
          <button
            style={{ ...btnBase }}
            title={t(`脫離戰場:此部退出本戰(折損約 ${Math.floor(unit.troops * 0.1).toLocaleString()} 人為潰散),餘眾保全。主將不可脫離,且須退至我方陣後兩格內。`,
                     `Pull this unit out of the battle — about ${Math.floor(unit.troops * 0.1).toLocaleString()} are written off as stragglers, the rest are saved. The commander cannot leave, and a unit must be within two hexes of your own edge.`)}
            onClick={() => {
              playSfx('march');
              startBattle(retreatUnit(battle, unit.id));
              setActionMode({ kind: 'none' });
            }}
          >🏳 {t('脫離', 'Withdraw unit')} <span style={{ float: 'right', color: 'var(--tkm-hud-dim)' }}>−10%</span></button>
        )}
        {/* 攻城三動作 — battering, scaling and repairing were all implemented in
            the engine but only ever called from the AI, so a besieging player
            could not open a wall at all and a defending one could not shore one
            up. Each appears only where the engine says it would do something. */}
        {(() => {
          const rows: Array<{
            act: 'batter' | 'scale' | 'repair';
            targets: HexCoord[];
            glyph: string; zh: string; en: string; tipZh: string; tipEn: string; color: string;
            run: (c: HexCoord) => TacticalBattle;
            sfx: Parameters<typeof playSfx>[0];
          }> = [
            {
              act: 'batter', targets: batterTargets(battle, unit.id),
              glyph: '🔨', zh: '破城', en: 'Batter', color: 'var(--tkm-hud-ember)',
              tipZh: '以攻城械鑿擊相鄰城牆或城門 — 城牆 1000、城門 700,每擊約 兵數×0.15+120,歸零則成缺口。',
              tipEn: 'Batter an adjacent wall or gate — wall 1000 HP, gate 700, roughly troops×0.15+120 per assault; it breaches at zero.',
              run: (c) => breakGate(battle, unit.id, c), sfx: 'crash',
            },
            {
              act: 'scale', targets: scaleTargets(battle, unit.id),
              glyph: '🪜', zh: '雲梯登城', en: 'Scale', color: 'var(--tkm-hud-gold)',
              tipZh: '踏雲梯翻越城牆,直落牆內 — 須有我方攻城械貼著同一段牆,且牆內有空格可落腳。耗盡行動。',
              tipEn: 'Storm over the rampart and drop inside — needs a friendly siege engine braced on that same wall and a free hex behind it. Costs all AP.',
              run: (c) => scaleWall(battle, unit.id, c), sfx: 'march',
            },
            {
              act: 'repair', targets: repairTargets(battle, unit.id),
              glyph: '🧱', zh: '搶修城防', en: 'Repair', color: 'var(--tkm-hud-mint)',
              tipZh: `搶修相鄰受損城防 +${WALL_REPAIR_PER_ACTION} — 若快過敵軍鑿擊,城牆便永不告破。耗盡行動。`,
              tipEn: `Shore up an adjacent damaged fortification by ${WALL_REPAIR_PER_ACTION} — out-pace the battering and the wall never falls. Costs all AP.`,
              run: (c) => repairWall(battle, unit.id, c), sfx: 'thud',
            },
          ];
          return rows.filter((r) => r.targets.length > 0).map((r) => {
            const armed = actionMode.kind === 'siege' && actionMode.act === r.act;
            return (
              <button
                key={r.act}
                style={{ ...btnBase, ...(armed ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
                disabled={apDisabled}
                title={t(r.tipZh, r.tipEn)}
                onClick={() => {
                  if (armed) { setActionMode({ kind: 'none' }); return; }
                  // One legal stretch of wall is not a choice — just do it.
                  if (r.targets.length === 1) {
                    playSfx(r.sfx);
                    startBattle(r.run(r.targets[0]));
                    setActionMode({ kind: 'none' });
                    return;
                  }
                  playSfx('click');
                  setActionMode({ kind: 'siege', act: r.act });
                }}
              >{r.glyph} {t(r.zh, r.en)}{' '}
                <span style={{ float: 'right', color: r.color }}>
                  {r.targets.length > 1 ? t(`${r.targets.length} 處`, `${r.targets.length} spots`) : t('1 AP', '1 AP')}
                </span>
              </button>
            );
          });
        })()}
        {/* 車輪戰 — champions at one man IN TURN, as distinct from §6.11 團戰
            (all at once, which the battle already offers). The queue logic
            lived in gauntlet.ts and was the only system module nothing in the
            game imported. Offered when two or more of your officers are
            pressed against the same enemy. */}
        {(() => {
          const rushable = hexNeighbours(unit.coord)
            .map((c) => unitAt(battle, c))
            .filter((e): e is TacticalUnit => !!e && e.side !== unit.side
              && canGauntlet(battle, e.id, officers));
          if (rushable.length === 0) return null;
          const armed = actionMode.kind === 'gauntlet';
          const queueOf = (e: TacticalUnit) => gauntletChallengers(battle, e.id, officers);
          const go = (e: TacticalUnit) => {
            playSfx('sword');
            startBattle(battleGauntlet(battle, e.id, officers, Math.random));
            setActionMode({ kind: 'none' });
          };
          return (
            <button
              style={{ ...btnBase, ...(armed ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
              disabled={apDisabled}
              title={t(
                `${queueOf(rushable[0]).length} 員**輪番**搦戰同一敵將,中間不容其回氣 —— 由弱漸強,前者耗掉的氣力留給後者。與「團戰並擊」(眾人同時圍毆)不同:此處各將單獨面對他,先上者多半要敗,但敗得不白費。參戰者全員耗盡行動,勝負皆然。`,
                `Your officers take one enemy IN TURN, giving him no time to recover — weakest first, so each bout banks wind off him for the next. Unlike 團戰 (all at once), each of yours faces him alone: the early ones will likely lose, but not for nothing. Everyone who commits spends their whole action, win or lose.`,
              )}
              onClick={() => {
                if (armed) { setActionMode({ kind: 'none' }); return; }
                if (rushable.length === 1) { go(rushable[0]); return; }
                playSfx('click');
                setActionMode({ kind: 'gauntlet' });
              }}
            >⚔⚔ {t('車輪戰', 'Gauntlet')}{' '}
              <span style={{ float: 'right', color: 'var(--tkm-hud-gold)' }}>
                {rushable.length > 1
                  ? t(`${rushable.length} 敵`, `${rushable.length} foes`)
                  : t(`${queueOf(rushable[0]).length} 員齊上`, `${queueOf(rushable[0]).length} join`)}
              </span>
            </button>
          );
        })()}
        {/* 陣前招降 — call a broken enemy officer to lay down arms. Offered only
            when someone within earshot is actually finished (routing / shaken /
            nearly wiped out); the odds are shown up front because a refusal
            steels them, so it is a decision, not a free re-roll. */}
        {(() => {
          const callable = surrenderTargets(battle, unit.id, officers);
          if (callable.length === 0) return null;
          const armed = actionMode.kind === 'surrender';
          const oddsOf = (e: TacticalUnit) => surrenderCheck(battle, unit, e, officers).chance;
          const best = callable.reduce((a, e) => (oddsOf(e) > oddsOf(a) ? e : a));
          const go = (e: TacticalUnit) => {
            const res = callSurrender(battle, unit.id, e.id, officers, Math.random);
            playSfx(res.yielded ? 'victory' : 'click');
            startBattle(res.battle);
            setActionMode({ kind: 'none' });
          };
          return (
            <button
              style={{ ...btnBase, ...(armed ? btnActive : {}), opacity: apDisabled ? 0.4 : 1 }}
              disabled={apDisabled}
              title={t(
                `隔陣喊話,勸已無戰意的敵將棄械歸降。只有潰走、士氣將盡或殘部無幾的敵人肯聽;每名敵將**一戰只能勸一次**,拒絕者反而重整士氣(+${SURRENDER_REFUSAL_MORALE})。成算看你的魅力、對方的忠誠與殘破程度 —— 他若曾在你麾下、或與你有結義骨肉之親,格外容易;忠誠 ${SURRENDER_LOYALTY_WALL} 以上或與你有宿怨者,聽都不聽。歸降者於你**守住戰場**時成為俘虜。`,
                `Shout across the line for a finished enemy officer to yield. Only the routing, the nearly broken, or the nearly wiped out will listen; each foe can be called ONCE per battle, and a refusal rallies them (+${SURRENDER_REFUSAL_MORALE} morale). The odds turn on your charisma, their loyalty and how broken they are — a man who once served your banner, or who is sworn or kin to you, is far likelier to come over; loyalty ${SURRENDER_LOYALTY_WALL}+ or a blood feud will not even hear it. A yielded officer becomes your prisoner if your side holds the field.`,
              )}
              onClick={() => {
                if (armed) { setActionMode({ kind: 'none' }); return; }
                if (callable.length === 1) { go(callable[0]); return; }
                playSfx('click');
                setActionMode({ kind: 'surrender' });
              }}
            >☮ {t('招降', 'Call to Yield')}{' '}
              <span style={{ float: 'right', color: 'var(--tkm-hud-gold)' }}>
                {callable.length > 1
                  ? t(`${callable.length} 敵 · 至多 ${Math.round(oddsOf(best) * 100)}%`, `${callable.length} foes · up to ${Math.round(oddsOf(best) * 100)}%`)
                  : `${Math.round(oddsOf(best) * 100)}%`}
              </span>
            </button>
          );
        })()}
      </div>

      {availableStratagems.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px dotted #3a2818', paddingTop: '0.4rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--tkm-hud-gold)', letterSpacing: '0.05rem', marginBottom: '0.3rem' }}>{t('計略', 'STRATAGEMS')}</div>
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
                  ...(isSig ? { borderColor: 'var(--tkm-hud-gold)' } : {}),
                  opacity: apDisabled || onCd ? 0.4 : 1,
                }}
                disabled={apDisabled || onCd}
                title={`${desc(s)}\n\n${t('目標', 'Target')}: ${targetHint}\n${t('範圍', 'Range')}: ${s.range}${onCd ? `\n${t('冷卻', 'CD')}: ${cd}t` : ''}`}
                onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: s.id })}
              >
                {isSig && <span style={{ color: 'var(--tkm-hud-gold)' }}>★ </span>}
                <span style={{ color: badge.color, fontSize: '0.7rem', marginRight: 3 }}>[{badge.label}]</span>
                {pickName(s.name, lang)}
                <span style={{ float: 'right', color: 'var(--tkm-hud-dim)', fontSize: '0.66rem' }}>
                  {onCd ? `CD ${cd}t` : `r${s.range}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {personalTactics.length > 0 && (
        <div style={{ marginTop: '0.6rem', borderTop: '1px dotted #3a2818', paddingTop: '0.4rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--tkm-hud-gold)', letterSpacing: '0.05rem', marginBottom: '0.3rem' }}>
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
                  ...(pt.isSignature ? { borderColor: 'var(--tkm-hud-gold)' } : { borderColor: '#5a4530' }),
                  opacity: apDisabled || onCd ? 0.4 : 1,
                }}
                disabled={apDisabled || onCd}
                title={`${pt.description}\n\n${t('目標', 'Target')}: ${targetHint}\n${t('範圍', 'Range')}: ${pt.range}${sit.note ? `\n${t('情境', 'Situation')}: ${t(sit.note.zh, sit.note.en)}` : ''}${onCd ? `\n${t('冷卻', 'CD')}: ${cd}t` : ''}`}
                onClick={() => setActionMode(active ? { kind: 'none' } : { kind: 'stratagem', id: pt.underlying, tacticId: pt.tacticId })}
              >
                {pt.isSignature && <span style={{ color: 'var(--tkm-hud-gold)' }}>★ </span>}
                {sitMark && <span style={{ color: sitColor, marginRight: 2 }}>{sitMark}</span>}
                <span style={{ color: badge.color, fontSize: '0.7rem', marginRight: 3 }}>[{badge.label}]</span>
                {pt.nameZh}
                <span style={{ float: 'right', color: 'var(--tkm-hud-dim)', fontSize: '0.66rem' }}>
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
