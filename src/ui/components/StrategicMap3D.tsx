import { Suspense, createContext, useEffect, useMemo, useRef, useState  } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { RENDER_HI } from '../renderQuality';
import { getTerritoryCanvas, getTerritorySignature, renderTerritorySnapshot } from './territoryOverlay';
import { useReplayStore } from './replayHistory';
import { setMapFocusHandler, requestMapFocus } from './mapFocusBus';
import { hasEscapeLayers } from '../hooks/useEscapeKey';
import { positionAlongRoute, terrainRoute } from '../../game/data/territories';
import { geoToPixel, battleGroundAt, MAP_W as PX_W, MAP_H as PX_H, WORLD_SCALE, hexAt as geoHexAt, hexCenter as geoHexCenter, HEX_ROW_SPACING as GEO_HEX_ROW, terrainMarchCost } from '../../game/data/geography';
import { getEmbassyTarget } from '../../game/systems/foreignRealm';
import { cityPixel, cityPos } from '../../game/data/cityGeo';
import { marchDurationFor } from '../../game/data/cities';
import { citySpecialty, specialtyClass } from '../../game/data/specialties';
import { NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../../game/data/namedMaps';
import * as THREE from 'three';
import { useGameStore } from '../../game/state/store';
import { PROVINCE_BY_CITY } from '../../game/data';
import type { City, Force, HexCoord, Season } from '../../game/types';
import { isHostilePermitted } from '../../game/types';
// The battle diorama reuses the real battle scene (embedded mode) + its hex
// coordinate helper, so the fight on the world map IS the fight.
import { BattleScene, BattleCinematics, hexWorld as battleHexWorld, FX_DURATION, SIGNATURE_FLAVOR } from '../screens/TacticalBattleScreen3D';
import { battleWindow } from '../../game/systems/battlefieldTerrain';
import { tacticFxSpec, FX_IMPACT, type StratagemFxInstance, type StratagemFxKind, type TacticFxSpec } from '../../game/data/stratagemFx';
import { categoryOfTactic } from '../../game/data/officerAttributes';
// In-place battle commanding — the SAME pure battle ops the fullscreen uses.
import { unitAt, canMove, canAttack, moveUnit, attackUnits, endTurn, applyStratagem, hexDistance, forecastAttack, matchupLabel, battleStratagemSituation } from '../../game/systems/tactical';
import { canDuel } from '../../game/systems/duel';
import { personalTacticsForUnit } from '../../game/systems/personalTactics';
import { Duel3DStage } from './duel/Duel3DStage';
import { MarchPicker } from './MarchPicker';
import { MusterModal } from './MusterModal';
import { OfficerPicker } from './OfficerPicker';
import { playSfx, playFxSfx, startMapAmbience, setMapAmbienceMode, stopMapAmbience } from '../../game/systems/sound';
import { computeFog } from '../../game/systems/fogOfWar';
import { STRATAGEMS } from '../../game/data';
import type { Officer, StratagemId } from '../../game/types';
import type { WeatherKind } from '../../game/systems/weather';
import { LocatorMap } from './LocatorMap';
import { ObjectivePanel } from './ObjectivePanel';
import { computeDayEncounters, marchPositionAtDay } from '../../game/systems/dayEncounters';
import { PortPanel } from './PortPanel';
import { FortPanel } from './FortPanel';
import { TribePanel } from './TribePanel';
import { SitePanel } from './SitePanel';
import { ScenicPanel } from './ScenicPanel';
import { BuildStockadePicker } from './BuildStockadePicker';
import { useT, useLanguage, pickName } from '../i18n';
import { IS_MOBILE, PIXEL_TO_WORLD, MAP_W, MAP_D, MARKER_SCALE, ARMY_TOKEN_SCALE, EMPTY_HEX_PAINT, EMPTY_TERRITORY_OWNERSHIP, pxToWorld, isLandPx, landSDF, distToPolyline, RIVERS, LAKES, valueNoise, sampleTerrain, sampleTerrainHeight, cityElevation } from './map3d/shared';
import { computeBeaconAlerts, QueuedBattles3D, DayEncounterMarks3D, FieldBattleMarks3D, FieldClashMelee3D, IgnitionDust3D, BeaconAlerts3D, SiegeRings3D, BurningCities3D, DepartureFlourish3D, ConquestFlourish3D, LossFlourish3D, EspionageAgents3D } from './map3d/WorldMarks3D';
import { Ocean, Lakes3D, RiverRibbons, SnowBlanket, Forest3D, Farmland3D, Villages3D, GeoLabels3D, TradeRouteLines3D, RainParticles, SnowParticles } from './map3d/NatureLayers3D';
import { MarchingArmies } from './map3d/Armies3D';
import { City3D } from './map3d/Cities3D';
import { HexWorldTerrain, warmHexWorldTiles, HEXW_R } from './map3d/HexWorld3D';
import { IntentLayer, DiplomacyLines3D } from './map3d/Intent3D';
import { SupplyLines3D, SupplyCorridor3D } from './map3d/Supply3D';
import { Forts3D, Ports3D } from './map3d/Strongholds3D';
import { SkyDome, DriftingClouds, CloudShadows, CitySmoke3D, Birds3D, EventMarks3D, TradeShips3D, DuskCityLights, Caravans3D, EMPTY_THREATS, FOG_OVERLAY, EMPTY_REVEALS } from './map3d/AtmosphereTrade3D';
import { Tribes3D, WildSites3D, ScenicSites3D } from './map3d/WildSites3D';
export { warmHexWorldTiles } from './map3d/HexWorld3D';
// Preserve this module's public surface — computeBeaconAlerts was exported from here.
export { computeBeaconAlerts };

type OverlayMode = 'none' | 'gold' | 'food' | 'troops' | 'loyalty' | 'province' | 'supply' | 'diplomacy' | 'threat' | 'specialty' | 'intent';

const PROVINCE_COLOR: Record<string, string> = {
  sili: '#d4a84a', yu: '#c19a3b', ji: '#3a5a8a', qing: '#5a8a8a',
  yan: '#8a5a3a', xu: '#6a8a3a', yang: '#2a7a4a', jing: '#7a4a8a',
  liang: '#b8442e', bing: '#5a4a8a', you: '#3a5a3a', yi: '#3a7d4a',
  jiao: '#5a8a4a',
};

/** Deterministic 0..1 hash from a string (same as 2D map's road curve seed). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Furthest zoom-out — the distance that frames the WHOLE map (its ground-plane
// bounding circle, half-diagonal ≈128) inside the 45° vertical FOV, plus ~15%
// margin. Big enough to see the full map on desktop, yet far tighter than the
// old 200·WORLD_SCALE (~1000 ≈ 5× the map) that shrank the land to a speck in a
// sea of empty water/sky. (MAP_W*1.25≈260 framed nothing — too close.)
const MAP_FOV_DEG = 45;     // matches the <Canvas camera fov>
const MAP_MAX_DIST =
  (Math.hypot(MAP_W / 2, MAP_D / 2) / Math.sin((MAP_FOV_DEG / 2) * Math.PI / 180)) * 1.15;

/* ─── Build a high-res procedural map texture (painted at pixel level)
 * Per-pixel sampling gives **crisp** biome borders + per-pixel grain.
 *
 * PERF: this is the single most expensive startup computation (millions
 * of sampleTerrain calls), so it is (a) module-cached — built once per
 * SESSION, not per mount (dev StrictMode double-mounts used to pay it
 * twice), and (b) row-chunked behind warmStrategicAssets() so the title
 * screen can pre-bake it in idle slices and entering the map never
 * blocks. If the player outruns the warm-up, the remainder finishes
 * synchronously on mount. */
// Phones get a lighter sheet — sampleTerrain costs the same per pixel
// everywhere, and 2.6× fewer pixels is the difference between the
// warm-up finishing during the title screen or not.
const TEX_W = IS_MOBILE ? 960 : 2000;
const TEX_H = IS_MOBILE ? 691 : 1440;
let terrainTexCache: THREE.Texture | null = null;
let terrainJob: { canvas: HTMLCanvasElement; img: ImageData; row: number } | null = null;

function terrainJobState() {
  if (!terrainJob) {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    terrainJob = { canvas, img: new ImageData(TEX_W, TEX_H), row: 0 };
  }
  return terrainJob;
}

/** Paint scanlines until the time budget runs out; true when the whole
 *  sheet is done. Deadline-based so warm-up ticks never jank the UI. */
function terrainFillFor(budgetMs: number): boolean {
  const job = terrainJobState();
  const data = job.img.data;
  const deadline = performance.now() + budgetMs;
  const end = TEX_H;
  for (let y = job.row; y < end; y++) {
    if (performance.now() > deadline) { job.row = y; return false; }
    const py = (y / TEX_H) * PX_H;
    for (let x = 0; x < TEX_W; x++) {
      const px = (x / TEX_W) * PX_W;
      const { h, color } = sampleTerrain(px, py);
      let r = color.r, g = color.g, b = color.b;
      if (h >= 0) {
        // Biome-aware detail bake (splat-style, no external assets):
        //  • high-freq grain so dirt/grass aren't flat,
        //  • mid-freq mottling to break up uniform colour fields,
        //  • rocky directional striation on slopes (scales with height),
        //  • a fine vegetation speckle wherever green dominates.
        const grain = (
          Math.sin(px * 5.1 + py * 3.3) * 0.5
          + Math.sin(px * 11.7 + py * 7.9) * 0.3
          + (Math.sin(x * 1.31) * Math.cos(y * 0.97)) * 0.4
        ) * 0.07;
        // Two-octave mottling: fine speckle + coarse soft patches (fields,
        // meadows, weathered rock) so no colour field reads as flat paint.
        const mottle = valueNoise(px * 0.5, py * 0.5) * 0.75 + valueNoise(px * 0.13, py * 0.11) * 0.65;
        const rock = h > 0.22 ? (h - 0.22) : 0;
        // Rocky strata on slopes — a second cross-streak adds craggy texture.
        const streak = (Math.sin(px * 0.9 - py * 0.6) * Math.sin(px * 2.7 + 1.0)
          + Math.sin(px * 1.7 + py * 1.1) * 0.5) * rock * 0.22;
        const green = color.g - (color.r > color.b ? color.r : color.b);
        const veg = green > 0.02 ? Math.sin(px * 21 + 0.5) * Math.cos(py * 17) * 0.05 : 0;
        // 烘焙光影 — macro relief shading: a NW-facing slope catches the sun,
        // its lee + valleys fall into shadow. Only on raised ground (cheap).
        let shade = 0;
        if (h > 0.1) {
          const hNW = sampleTerrain(px - 5, py - 5).h;
          shade = Math.max(-0.2, Math.min(0.2, (h - hNW) * 1.4));
        }
        const d = grain + mottle + streak + veg + shade;
        r += d; g += d * 0.96; b += d * 0.86;   // detail reads a touch warm
        // 大氣透視 — high ground takes a faint cool cast, the bluish haze of
        // distant ranges (subtle; snowcaps already whiten the very tops).
        if (h > 0.4) {
          const cool = Math.min(0.12, (h - 0.4) * 0.22);
          r -= cool; g -= cool * 0.3; b += cool * 0.5;
        }
      }
      const i = (y * TEX_W + x) * 4;
      data[i]     = Math.max(0, Math.min(255, r * 255));
      data[i + 1] = Math.max(0, Math.min(255, g * 255));
      data[i + 2] = Math.max(0, Math.min(255, b * 255));
      data[i + 3] = 255;
    }
  }
  job.row = end;
  return true;
}

function buildTerrainTexture(): THREE.Texture {
  if (terrainTexCache) return terrainTexCache;
  while (!terrainFillFor(100)) { /* finish whatever the warm-up left */ }
  const job = terrainJobState();
  job.canvas.getContext('2d')!.putImageData(job.img, 0, 0);
  const tex = new THREE.CanvasTexture(job.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  terrainTexCache = tex;
  terrainJob = null;
  return tex;
}

/* ─── Build a normal map from terrain heights — mountain ridges + river
 *  banks get real per-pixel relief under lighting. Module-cached and
 *  row-chunked, same as the colour sheet. */
const NM_W = IS_MOBILE ? 640 : 1000;
const NM_H = IS_MOBILE ? 461 : 720;
let normalMapCache: THREE.Texture | null = null;
let normalJob: { heights: Float32Array; row: number } | null = null;

function normalFillFor(budgetMs: number): boolean {
  if (!normalJob) normalJob = { heights: new Float32Array(NM_W * NM_H), row: 0 };
  const deadline = performance.now() + budgetMs;
  const end = NM_H;
  for (let y = normalJob.row; y < end; y++) {
    if (performance.now() > deadline) { normalJob.row = y; return false; }
    const py = (y / NM_H) * PX_H;
    for (let x = 0; x < NM_W; x++) {
      normalJob.heights[y * NM_W + x] = sampleTerrain((x / NM_W) * PX_W, py).h;
    }
  }
  normalJob.row = end;
  return true;
}

function buildNormalMap(): THREE.Texture {
  if (normalMapCache) return normalMapCache;
  while (!normalFillFor(100)) { /* finish remainder */ }
  const heights = normalJob!.heights;
  const canvas = document.createElement('canvas');
  canvas.width = NM_W;
  canvas.height = NM_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(NM_W, NM_H);
  const data = img.data;
  const STRENGTH = 12;  // scales the apparent slope — higher = more dramatic
  for (let y = 0; y < NM_H; y++) {
    for (let x = 0; x < NM_W; x++) {
      const xL = Math.max(0, x - 1), xR = Math.min(NM_W - 1, x + 1);
      const yU = Math.max(0, y - 1), yD = Math.min(NM_H - 1, y + 1);
      const dx = (heights[y * NM_W + xR] - heights[y * NM_W + xL]) * STRENGTH;
      const dy = (heights[yD * NM_W + x] - heights[yU * NM_W + x]) * STRENGTH;
      const nx = -dx;
      const ny = -dy;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * NM_W + x) * 4;
      data[i]     = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  normalMapCache = tex;
  normalJob = null;
  return tex;
}

/**
 * Pre-bake the strategic map's expensive sheets in small slices — call
 * repeatedly from an idle loop (the title screen does); each call does a
 * bounded chunk of work (~15-30ms) and returns true once EVERYTHING the
 * map needs at mount is cached.
 */
export function warmStrategicAssets(): boolean {
  if (!terrainTexCache) {
    if (terrainFillFor(14)) buildTerrainTexture();
    return false;
  }
  if (!normalMapCache) {
    if (normalFillFor(14)) buildNormalMap();
    return false;
  }
  buildWaterAlphaMask();
  // ⬡ hex-world quilt — ground a few columns per call so the first toggle
  // to the board map is instant instead of a 1-2s sampling stall.
  if (!warmHexWorldTiles(8)) return false;
  return true;
}

/* ─── Water alpha-mask — keeps the territory tint off the water ───
 *  White = land (tint shows), black = sea / lake / river bed (tint
 *  hidden). Mirrors exactly the water tests sampleTerrain paints with,
 *  so the mask and the drawn water always agree. Built once (static). */
let waterMaskCache: THREE.Texture | null = null;
function buildWaterAlphaMask(): THREE.Texture {
  if (waterMaskCache) return waterMaskCache;
  // Fixed mask resolution — coastline detail is independent of WORLD_SCALE.
  // Sample at scaled-world coords so one mask covers the whole map at any
  // scale without ballooning the canvas past mobile/GPU texture limits.
  const W = 1000, H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const wx = (x / W) * PX_W;
      const wy = (y / H) * PX_H;
      let water = landSDF(wx, wy) < 0;
      if (!water) {
        for (const lk of LAKES) {
          if (Math.hypot(wx - lk.x, wy - lk.y) < lk.r) { water = true; break; }
        }
      }
      if (!water) {
        for (const r of RIVERS) {
          if (distToPolyline(wx, wy, r.points) < r.width) { water = true; break; }
        }
      }
      const i = (y * W + x) * 4;
      const v = water ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = false;
  waterMaskCache = tex;
  return tex;
}

/* ─── Phase 3a — territory tint over the terrain ──────────────────
 *  Builds a sibling plane to MapTerrain, displaced to follow the same
 *  heights but lifted by 0.05 so it sits just above the ground, then
 *  textured with the same Voronoi canvas the 2D map uses. The texture
 *  rebuilds on ownership change. */
function TerritoryGroundLayer({
  cities,
  forces,
  territoryOwnership,
}: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
  territoryOwnership: Record<string, string | null>;
}) {
  // Same displaced geometry as MapTerrain — keep them in lockstep.
  const geom = useMemo(() => {
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.05 * WORLD_SCALE);   // lift scales with world so it clears the terrain plane (no z-fight) at far zoom
    }
    g.computeVertexNormals();
    return g;
  }, []);

  // CanvasTexture wrapping the cached hex-grid image. Rebuilds only when the
  // ownership signature changes — and the rebuild (a 2× supersampled paint) is
  // pushed off the critical path into an idle callback, so neither the first
  // map load nor a conquest's turn-tick stalls a frame waiting on the paint.
  // The new tint just swaps in a moment later; the previous one stays up until
  // then. Anisotropic + linear-no-mipmap filtering keeps the hex edges crisp.
  const sig = useMemo(
    () => getTerritorySignature(cities, territoryOwnership),
    [cities, territoryOwnership],
  );
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  // Free the last tint texture on unmount (e.g. when the Canvas remounts after
  // a context loss) — the rebuild path already disposes superseded ones.
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  texRef.current = texture;
  useEffect(() => () => { texRef.current?.dispose(); }, []);
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled) return;
      const tex = new THREE.CanvasTexture(getTerritoryCanvas(cities, forces, territoryOwnership));
      tex.flipY = true;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      setTexture((old) => { old?.dispose(); return tex; });
    };
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = win.requestIdleCallback
      ? win.requestIdleCallback(build, { timeout: 300 })
      : (window.setTimeout(build, 1) as unknown as number);
    return () => {
      cancelled = true;
      if (win.cancelIdleCallback) win.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // Until the first tint is painted, render nothing (the bare terrain shows);
  // the overlay fades in a frame later without ever blocking the load.
  if (!texture) return null;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      geometry={geom}
      // Render after the terrain so the alpha blend lands on top.
      renderOrder={1}
    >
      <meshBasicMaterial
        map={texture}
        // Hide the ownership tint over sea / lakes / rivers — water should
        // always read as water, not as faction colour.
        alphaMap={buildWaterAlphaMask()}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Procedural China terrain ───────────────────────────────────── */
function MapTerrain({ onGroundClick }: { onGroundClick?: (px: number, py: number) => void } = {}) {
  // Both textures are EXPENSIVE — module-cached, see the builders above.
  const texture = useMemo(() => buildTerrainTexture(), []);
  const normalMap = useMemo(() => buildNormalMap(), []);
  const geom = useMemo(() => {
    // Geometry only carries displacement now — colors come from the texture
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      // NOTE: after the -PI/2 X rotation, +Y maps to -Z (north). The COLOR
      // texture (and Three.js flipY=true) places its canvas y=0 (north
      // painted) at the +Y end of the plane too. So we MUST invert wy when
      // sampling — otherwise we sample southern terrain heights for the
      // northern vertices, putting mountains where the texture shows plains.
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      geometry={geom}
      onClick={(e) => {
        if (!onGroundClick) return;
        e.stopPropagation();
        const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
        const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
        onGroundClick(px, py);
      }}
    >
      <meshStandardMaterial
        map={texture}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(1.15, 1.15)}
        roughness={0.9}
        metalness={0.02}
      />
    </mesh>
  );
}

/* ─── 標籤分級 — when the camera is pulled far out, the ~120 city name+bar
   labels turn into noise (and DOM cost). A tiny in-canvas tracker quantizes
   camera distance into near/far; far hides labels of ordinary cities, keeping
   capitals and the selection readable. */
const ZoomLODCtx = createContext<'near' | 'far'>('near');
// Zoom gauged by camera HEIGHT (pan-independent — distance-from-origin flips
// erratically once you pan off-centre). City names show below this height.
const LOD_FAR_DIST = 220;
// Below this camera height the full road network paints; above it (the strategic
// overview, where the default camera sits at ~MAP_D·0.9) only trunk roads show,
// dimmed, so the web stops blanketing the map. Lower than the label LOD.
const ROAD_DETAIL_Y = 120;
function ZoomLODTracker({ onChange }: { onChange: (lod: 'near' | 'far') => void }) {
  const { camera } = useThree();
  const last = useRef<'near' | 'far'>('near');
  useFrame(() => {
    // Camera height = clean zoom proxy (independent of panning). Wide
    // hysteresis band so labels don't flicker right on the threshold.
    const d = camera.position.y;
    const next = last.current === 'far'
      ? (d < LOD_FAR_DIST - 14 ? 'near' : 'far')
      : (d > LOD_FAR_DIST + 14 ? 'far' : 'near');
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  });
  return null;
}

/** 迷你導航 — tracks the camera's view window for the corner minimap, and
 *  executes click-to-jump requests (camera keeps its current offset). */
function MiniNavRig({ controlsRef, onView, jump }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
  onView: (v: { cx: number; cy: number; span: number }) => void;
  jump: { px: number; py: number; seq: number } | null;
}) {
  const { camera } = useThree();
  const lastReport = useRef(0);
  const lastSeq = useRef(0);
  useFrame(({ clock }) => {
    const ctrl = controlsRef.current;
    if (jump && jump.seq !== lastSeq.current && ctrl) {
      lastSeq.current = jump.seq;
      const [wx, wz] = pxToWorld(jump.px, jump.py);
      const offset = camera.position.clone().sub(ctrl.target);
      ctrl.target.set(wx, sampleTerrainHeight(wx, wz), wz);
      camera.position.copy(ctrl.target).add(offset);
      ctrl.update();
    }
    if (clock.elapsedTime - lastReport.current < 0.25) return;
    lastReport.current = clock.elapsedTime;
    const tgt = ctrl?.target ?? new THREE.Vector3();
    const cx = (tgt.x + MAP_W / 2) / PIXEL_TO_WORLD;
    const cy = (tgt.z + MAP_D / 2) / PIXEL_TO_WORLD;
    const span = camera.position.distanceTo(tgt) * 0.9 / PIXEL_TO_WORLD;
    onView({ cx: Math.round(cx), cy: Math.round(cy), span: Math.round(span) });
  });
  return null;
}

/* ─── Curved roads between adjacent cities (drape on terrain) ──── */
function Roads({ cities }: { cities: Record<string, City> }) {
  // De-dupe edges via canonical key
  const edges = useMemo(() => {
    const set = new Set<string>();
    const list: Array<{ from: City; to: City; seed: string }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const other = cities[adj];
        if (!other) continue;
        const a = c.id < other.id ? c.id : other.id;
        const b = c.id < other.id ? other.id : c.id;
        const key = `${a}|${b}`;
        if (set.has(key)) continue;
        set.add(key);
        // Seed uses the source city's id + adj id (matches 2D map's curve direction)
        list.push({ from: c, to: other, seed: c.id + adj });
      }
    }
    return list;
  }, [cities]);

  const linePts = useMemo(() => {
    const out: Array<{ pts: THREE.Vector3[]; imp: number }> = [];
    for (const { from, to, seed } of edges) {
      // Trunk roads between great cities run wider than back-country tracks.
      const imp = Math.max(0, Math.min(1, (from.population + to.population) / 320000));
      const [fpx, fpy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tpx, tpy] = cityPixel(to.id, to.coords.x, to.coords.y);
      const [fx, fz] = pxToWorld(fpx, fpy);
      const [tx, tz] = pxToWorld(tpx, tpy);
      const dx = tx - fx;
      const dz = tz - fz;
      const len = Math.hypot(dx, dz);
      // Skip degenerate zero-length edges (city to itself or coincident coords)
      // — division-by-zero here would produce NaN Vector3s and a console warning.
      if (len < 1e-6) continue;
      // Perpendicular direction
      const px = -dz / len;
      const pz = dx / len;
      // Deterministic curve magnitude (10–25% of length, signed by hash)
      const h = hashStr(seed);
      const sign = h < 0.5 ? -1 : 1;
      const amt = (0.10 + (h * 0.15)) * len * sign;
      const mx = (fx + tx) / 2 + px * amt;
      const mz = (fz + tz) / 2 + pz * amt;
      // Sample 18 points along quadratic Bezier, planted on terrain + small lift
      const SEG = 18;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const it = 1 - t;
        const x = it * it * fx + 2 * it * t * mx + t * t * tx;
        const z = it * it * fz + 2 * it * t * mz + t * t * tz;
        const y = sampleTerrainHeight(x, z) + 0.035;
        pts.push(new THREE.Vector3(x, y, z));
      }
      out.push({ pts, imp });
    }
    return out;
  }, [edges, cities]);

  // Two-pass worn path: a wider dark bed + a lighter trodden centre, so roads
  // read as packed-earth highways instead of GPU-hairlines. Trunk roads thicken.
  // 縮放分級 — at the strategic overview the full road web blankets the map and
  // drowns the cities/rivers/borders, so back-country tracks drop out and the
  // trunk roads dim; zoom into a region (camera drops below ROAD_DETAIL_Y) and
  // the whole network paints at full strength. Own threshold (lower than the
  // label LOD) with hysteresis so it flips once, around the default overview.
  const { camera } = useThree();
  const [far, setFar] = useState(true);
  useFrame(() => {
    const y = camera.position.y;
    setFar((cur) => (cur ? y >= ROAD_DETAIL_Y - 10 : y > ROAD_DETAIL_Y + 10));
  });
  return (
    <group>
      {linePts.map(({ pts, imp }, i) => {
        if (far && imp < 0.4) return null;          // hide minor tracks at distance
        const bedOp = far ? 0.26 : 0.55;
        const topOp = far ? 0.4 : 0.82;
        return (
          <group key={i}>
            <Line points={pts} color="#6b4a28" lineWidth={3.6 + imp * 3.2} transparent opacity={bedOp} />
            <Line points={pts} color="#cda268" lineWidth={1.7 + imp * 1.6} transparent opacity={topOp} />
          </group>
        );
      })}
    </group>
  );
}

/** 輜重車隊 — supply convoys crawling the roads between the player's cities,
 *  carrying grain (gold cart) or coin (pale cart). Mirrors the army column's
 *  route interpolation but renders a single ox-cart and never fights. */
function Convoys({
  cities,
  convoys,
  forces,
}: {
  cities: Record<string, import('../../game/types').City>;
  convoys: Record<string, import('../../game/systems/convoy').Convoy>;
  forces: Record<string, import('../../game/types').Force>;
}) {
  const list = useMemo(() => {
    const out: Array<{ id: string; route: Array<{ x: number; y: number }>; t: number; kind: 'food' | 'gold' | 'troops'; naval: boolean; color: string }> = [];
    for (const c of Object.values(convoys)) {
      const from = cities[c.fromCityId];
      const to = cities[c.toCityId];
      if (!from || !to) continue;
      const [fx, fy] = cityPixel(from.id, from.coords.x, from.coords.y);
      const [tx, ty] = cityPixel(to.id, to.coords.x, to.coords.y);
      // A junk runs a straight sea lane; an ox-cart follows the land route.
      const route = c.naval ? [{ x: fx, y: fy }, { x: tx, y: ty }] : terrainRoute(fx, fy, tx, ty);
      const elapsed = c.totalSeasons - c.seasonsRemaining;
      const t = Math.min(0.96, Math.max(0.04, (elapsed + 0.5) / Math.max(1, c.totalSeasons)));
      const kind: 'food' | 'gold' | 'troops' = c.food > 0 ? 'food' : c.gold > 0 ? 'gold' : 'troops';
      out.push({ id: c.id, route, t, kind, naval: !!c.naval, color: forces[c.forceId]?.color ?? '#9a8a6a' });
    }
    return out;
  }, [cities, convoys, forces]);

  return (
    <>
      {list.map((c) => (
        <ConvoyCart key={c.id} route={c.route} t={c.t} kind={c.kind} naval={c.naval} color={c.color} />
      ))}
    </>
  );
}

function ConvoyCart({ route, t, kind, naval, color = '#9a8a6a' }: { route: Array<{ x: number; y: number }>; t: number; kind: 'food' | 'gold' | 'troops'; naval?: boolean; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current || route.length === 0) return;
    const here = positionAlongRoute(route, t);
    const ahead = positionAlongRoute(route, Math.min(0.99, t + 0.05));
    const [wx, wz] = pxToWorld(here.x, here.y);
    const [wx2, wz2] = pxToWorld(ahead.x, ahead.y);
    // A junk floats at water level; a cart rides the terrain.
    const y = naval ? 0.06 : sampleTerrainHeight(wx, wz) + 0.05;
    groupRef.current.position.set(wx, y, wz);
    if (wx2 !== wx || wz2 !== wz) groupRef.current.rotation.y = Math.atan2(wx2 - wx, wz2 - wz);
  });
  const cargoColor = kind === 'gold' ? '#e8c84a' : kind === 'troops' ? '#9aa8b0' : '#d8c88a';
  if (naval) {
    // 漕船 — a small grain junk: hull, cargo deck, single mast & sail.
    return (
      <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.85}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.3, 0.16, 0.62]} />
          <meshStandardMaterial color="#5a3f24" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.24, 0.05]} castShadow>
          <boxGeometry args={[0.22, 0.14, 0.34]} />
          <meshStandardMaterial color={cargoColor} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.42, -0.05]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0, 0.42, -0.05]}>
          <boxGeometry args={[0.01, 0.34, 0.26]} />
          <meshStandardMaterial color="#d8cdb0" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        {/* 旗 — a banner pennant in the owner's colour, atop the mast. */}
        <mesh position={[0.07, 0.6, -0.05]}>
          <boxGeometry args={[0.012, 0.11, 0.13]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.8}>
      {/* cart bed */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.34, 0.18, 0.5]} />
        <meshStandardMaterial color="#6a4a28" roughness={0.9} />
      </mesh>
      {/* cargo heap */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.42]} />
        <meshStandardMaterial color={cargoColor} roughness={0.85} />
      </mesh>
      {/* two wheels */}
      {([-0.2, 0.2] as const).map((sx, i) => (
        <mesh key={i} position={[sx, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 8]} />
          <meshStandardMaterial color="#2a1c10" />
        </mesh>
      ))}
      {/* draft ox up front */}
      <mesh position={[0, 0.16, -0.42]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.3]} />
        <meshStandardMaterial color="#4a3420" roughness={0.9} />
      </mesh>
      {/* 旗 — a banner pole flying the owner's colours, so you can tell whose
          column it is (and which to raid). */}
      <mesh position={[0.1, 0.46, 0.12]}>
        <cylinderGeometry args={[0.01, 0.01, 0.36, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.17, 0.56, 0.12]}>
        <boxGeometry args={[0.13, 0.09, 0.012]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * 游历使者 — lone officers roaming the map: a 城池 errand rider heads to another
 * city; a 遠使 embassy rider strikes out toward a distant realm/tribe at the
 * map's edge (gold banner). Mirrors the convoy renderer.
 */
function Envoys({
  cities,
  expeditions,
  forces,
}: {
  cities: Record<string, import('../../game/types').City>;
  expeditions: Record<string, import('../../game/types').Expedition>;
  forces: Record<string, import('../../game/types').Force>;
}) {
  const list = useMemo(() => {
    const out: Array<{ id: string; route: Array<{ x: number; y: number }>; t: number; color: string; embassy: boolean }> = [];
    for (const e of Object.values(expeditions)) {
      const from = cities[e.fromCityId];
      if (!from) continue;
      const [fx, fy] = cityPixel(from.id, from.coords.x, from.coords.y);
      let dx: number, dy: number;
      if (e.mode === 'embassy' && e.toRealmId) {
        const target = getEmbassyTarget(e.toRealmId);
        if (!target) continue;
        const [rx, ry] = geoToPixel(target.homeland.lon, target.homeland.lat);
        // Distant realms sit off the playable map — aim the rider at the border
        // in their direction so he heads off the right edge, not into the void.
        dx = Math.max(20, Math.min(PX_W - 20, rx));
        dy = Math.max(20, Math.min(PX_H - 20, ry));
      } else {
        const to = cities[e.toCityId];
        if (!to) continue;
        [dx, dy] = cityPixel(to.id, to.coords.x, to.coords.y);
      }
      // Outbound rides from home to destination; the return leg reverses it.
      const a = e.phase === 'returning' ? { x: dx, y: dy } : { x: fx, y: fy };
      const b = e.phase === 'returning' ? { x: fx, y: fy } : { x: dx, y: dy };
      const route = terrainRoute(a.x, a.y, b.x, b.y);
      const elapsed = e.legSeasons - e.seasonsRemaining;
      const t = Math.min(0.96, Math.max(0.04, (elapsed + 0.5) / Math.max(1, e.legSeasons)));
      out.push({ id: e.id, route, t, color: forces[e.forceId]?.color ?? '#cdb87a', embassy: e.mode === 'embassy' });
    }
    return out;
  }, [cities, expeditions, forces]);

  return (
    <>
      {list.map((e) => (
        <EnvoyRider key={e.id} route={e.route} t={e.t} color={e.color} embassy={e.embassy} />
      ))}
    </>
  );
}

function EnvoyRider({ route, t, color, embassy }: { route: Array<{ x: number; y: number }>; t: number; color: string; embassy: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current || route.length === 0) return;
    const here = positionAlongRoute(route, t);
    const ahead = positionAlongRoute(route, Math.min(0.99, t + 0.05));
    const [wx, wz] = pxToWorld(here.x, here.y);
    const [wx2, wz2] = pxToWorld(ahead.x, ahead.y);
    const y = sampleTerrainHeight(wx, wz) + 0.05;
    groupRef.current.position.set(wx, y, wz);
    if (wx2 !== wx || wz2 !== wz) groupRef.current.rotation.y = Math.atan2(wx2 - wx, wz2 - wz);
  });
  return (
    <group ref={groupRef} scale={ARMY_TOKEN_SCALE * 0.85}>
      {/* mount */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.11, 0.11, 0.32]} />
        <meshStandardMaterial color="#5a3f24" roughness={0.9} />
      </mesh>
      {/* rider (force colour) */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.18, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#d8c0a0" />
      </mesh>
      {/* 旌節 — an envoy's tall banner so he's spottable on the map; gold for a
          遠使 to distant lands. */}
      <mesh position={[0, 0.62, -0.08]}>
        <cylinderGeometry args={[0.01, 0.01, 0.64, 5]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      <mesh position={[0.11, 0.78, -0.08]}>
        <boxGeometry args={[0.18, 0.14, 0.014]} />
        <meshStandardMaterial color={embassy ? '#e6c473' : color} side={THREE.DoubleSide} emissive={embassy ? '#5a4410' : '#000000'} emissiveIntensity={embassy ? 0.4 : 0} />
      </mesh>
    </group>
  );
}

/** 城防一目了然 — a city's BUILT perimeter defences (buildSlots) show as tiny
 *  gold watch-posts around its token at their true compass positions, so the
 *  world map reads which cities are fortified and on which approaches. */
const CITY_SLOT_DIR: Array<[number, number]> = [
  [0, -1], [Math.SQRT1_2, -Math.SQRT1_2], [1, 0], [Math.SQRT1_2, Math.SQRT1_2],
  [0, 1], [-Math.SQRT1_2, Math.SQRT1_2], [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2],
];
function CityDefenseRing({ city, wx, wz, terrainY }: {
  city: City; wx: number; wz: number; terrainY: number;
}) {
  const built = (city.buildSlots ?? []).filter((s) => s.buildingId);
  if (built.length === 0) return null;
  return (
    <group position={[wx, terrainY, wz]}>
      {built.map((s) => {
        const dir = CITY_SLOT_DIR[s.slot] ?? [0, -1];
        return (
          <group key={s.slot} position={[dir[0] * 0.62, 0, dir[1] * 0.62]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.035, 0.14, 5]} />
              <meshStandardMaterial color="#8a6f3a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <coneGeometry args={[0.04, 0.06, 4]} />
              <meshStandardMaterial color="#d4a84a" emissive="#d4a84a" emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 開戰演出 (stage 3) — when a battle ignites, a war-drum + horn sounds, a
 *  「X軍 ⚔ Y軍」 title card flashes, and dust bursts at the clash site, so the
 *  start of every fight reads as a moment, not a silent state flip. ── */
function BattleIgnitionCard() {
  const battleId = useGameStore((s) => s.tacticalBattle?.id ?? null);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const [card, setCard] = useState<{ a: string; b: string; ac: string; bc: string } | null>(null);
  const lastId = useRef<string | null>(null);
  const lang = useLanguage();
  useEffect(() => {
    if (!battleId || battleId === lastId.current) return;
    lastId.current = battleId;
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    const af = b.attackerForceId ? forces[b.attackerForceId] : undefined;
    const df = b.defenderForceId ? forces[b.defenderForceId] : undefined;
    const defCity = cities[b.cityId];
    setCard({
      a: af ? pickName(af.name, lang) : (lang === 'en' ? 'Punitive Force' : '討伐軍'),
      b: df ? pickName(df.name, lang) : (defCity ? pickName(defCity.name, lang) : (lang === 'en' ? 'Garrison' : '守軍')),
      ac: af?.color ?? '#3a7dd9',
      bc: df?.color ?? '#b8442e',
    });
    playSfx('wardrum');
    const t1 = setTimeout(() => playSfx('horn'), 260);
    const t2 = setTimeout(() => setCard(null), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [battleId, forces, cities, lang]);
  if (!card) return null;
  const side = (c: string): React.CSSProperties => ({
    background: 'rgba(15, 10, 5, 0.86)', border: `2px solid ${c}`, borderRadius: 'var(--tkm-radius-sm)',
    padding: '0.45rem 1.1rem', color: '#ffe9a8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
    fontSize: '1.9rem', letterSpacing: '2px', textShadow: '0 0 8px rgba(0,0,0,0.9)',
    boxShadow: `0 0 18px ${c}aa`, whiteSpace: 'nowrap',
  });
  return (
    <div style={{
      position: 'absolute', top: '32%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <style>{'@keyframes tkm-ignite{0%{opacity:0;transform:scale(0.65)}14%{opacity:1;transform:scale(1.06)}28%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(1.02)}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', animation: 'tkm-ignite 2.2s ease-out forwards' }}>
        <span style={side(card.ac)}>{card.a}軍</span>
        <span style={{ fontSize: '2.6rem', color: '#e0552a', textShadow: '0 0 18px #e0552a, 0 0 4px #fff' }}>⚔</span>
        <span style={side(card.bc)}>{card.b}軍</span>
      </div>
    </div>
  );
}

/* ─── Compute heatmap color + label for a city given the current mode ── */
function overlayForCity(
  city: City,
  mode: OverlayMode,
  maxes: { gold: number; food: number; troops: number },
): { color: string; label: string } | null {
  if (mode === 'none' || mode === 'supply' || mode === 'diplomacy' || mode === 'threat') return null; // these draw their own
  if (mode === 'specialty') {
    // 名產 — mark only the cities that make a famous good, glyph-coded by class.
    const sp = citySpecialty(city.id);
    if (!sp) return null;
    const cls = specialtyClass(city.id);
    const color = cls === 'war' ? '#b8442e' : cls === 'food' ? '#6aae5a' : cls === 'craft' ? '#d4a84a' : cls === 'physic' ? '#4aa8a0' : '#8a7a4a';
    return { color, label: sp.glyph };
  }
  if (mode === 'province') {
    const pid = PROVINCE_BY_CITY[city.id];
    const color = pid ? (PROVINCE_COLOR[pid] ?? '#5a4530') : '#5a4530';
    return { color, label: (pid ?? '?').toUpperCase() };
  }
  const v = mode === 'gold' ? city.gold
    : mode === 'food' ? city.food
    : mode === 'troops' ? city.troops
    : city.loyalty;
  let r = 0, g = 0, b = 0;
  if (mode === 'loyalty') {
    const t = Math.min(1, v / 100);
    if (t < 0.5) { r = 220; g = Math.floor(220 * (t * 2)); b = 60; }
    else { r = Math.floor(220 * (1 - (t - 0.5) * 2)); g = 200; b = Math.floor(220 * (t - 0.5) * 2); }
  } else {
    const max = mode === 'gold' ? maxes.gold : mode === 'food' ? maxes.food : maxes.troops;
    const t = Math.min(1, v / Math.max(1, max));
    r = Math.floor(60 + 180 * t);
    g = Math.floor(40 + 130 * t);
    b = Math.floor(30 + 30 * t);
  }
  const label = mode === 'loyalty' ? `${v}`
    : v >= 10000 ? `${Math.round(v / 1000)}k`
    : `${v}`;
  return { color: `rgb(${r},${g},${b})`, label };
}

/* ─── Top-level scene ─────────────────────────────────────── */
/* ─── Season lighting presets — light/color only, no overlay planes ─
 *  Re-introduced after the overlay-plane bug. These ONLY change the
 *  three lights and the fog tint — no big planes that can occlude. */
interface SeasonPreset {
  ambient: number; ambientColor: string;
  sun: { color: string; intensity: number };
  fillColor: string; hemiSky: string; hemiGround: string; hemiIntensity: number;
  fogColor: string;
}
const SEASON_PRESETS: Record<Season, SeasonPreset> = {
  spring: {
    ambient: 0.80, ambientColor: '#fff5e0',
    sun: { color: '#fff5d8', intensity: 1.45 },
    fillColor: '#c8e0c8', hemiSky: '#a8d0e8', hemiGround: '#6a8a4a',
    hemiIntensity: 0.55, fogColor: '#c8c898',
  },
  summer: {
    ambient: 0.90, ambientColor: '#ffffff',
    sun: { color: '#ffffe8', intensity: 1.60 },
    fillColor: '#d0d0c0', hemiSky: '#a0c0e8', hemiGround: '#5a4530',
    hemiIntensity: 0.45, fogColor: '#c8b890',
  },
  autumn: {
    ambient: 0.72, ambientColor: '#ffe8c8',
    sun: { color: '#ffd8a0', intensity: 1.30 },
    fillColor: '#e0b888', hemiSky: '#c8a880', hemiGround: '#7a5530',
    hemiIntensity: 0.55, fogColor: '#c0a070',
  },
  winter: {
    ambient: 0.58, ambientColor: '#c8d8e8',
    sun: { color: '#e0e8f5', intensity: 1.15 },
    fillColor: '#8098c0', hemiSky: '#a0c0e8', hemiGround: '#607080',
    hemiIntensity: 0.5, fogColor: '#a8b8c8',
  },
};

/* ─── 晝夜 — time of day, read off the 旬 (third of the month) ────────
   上旬 = day, 中旬 = dusk (golden hour), 下旬 = a moonlit night. Each tints
   the sky dome, swaps sun⇄moon, recolours fog/ambient and decides whether
   the settlements light their lamps and the stars come out — so a full
   month visibly rolls noon → sunset → night and back. */
export type TimeOfDay = 'day' | 'dusk' | 'night';
export function phaseToTOD(phase: string | undefined): TimeOfDay {
  return phase === 'lower' ? 'night' : phase === 'middle' ? 'dusk' : 'day';
}
interface TODPreset {
  ambientMul: number; ambientColor: string | null;   // null = keep the season's colour
  sunMul: number; sunColor: string | null;
  sunPos: [number, number, number];
  skyTop: string; horizon: string | null; fog: string | null;
  celestial: 'sun' | 'moon'; celestialColor: string;
  lights: boolean;    // settlements light their lamps
  stars: boolean;
}
const TOD_PRESETS: Record<TimeOfDay, TODPreset> = {
  day: {
    ambientMul: 1, ambientColor: null, sunMul: 1, sunColor: null,
    sunPos: [8, 16, 6], skyTop: '#5f8ec8', horizon: null, fog: null,
    celestial: 'sun', celestialColor: '#fff2c8', lights: false, stars: false,
  },
  dusk: {
    ambientMul: 0.72, ambientColor: '#d8b890', sunMul: 0.8, sunColor: '#ffb070',
    sunPos: [12, 7, 10], skyTop: '#1f2a52', horizon: '#caa37e', fog: '#caa37e',
    celestial: 'sun', celestialColor: '#ff9848', lights: true, stars: false,
  },
  night: {
    ambientMul: 0.42, ambientColor: '#5a6a92', sunMul: 0.26, sunColor: '#9fb6e0',
    sunPos: [10, 9, 12], skyTop: '#070b1c', horizon: '#1a2440', fog: '#141d33',
    celestial: 'moon', celestialColor: '#dfe8ff', lights: true, stars: true,
  },
};

/* ─── Weather presets ──────────────────────────────────────────── */
interface WeatherPreset {
  particles: 'none' | 'rain' | 'snow';
}
const WEATHER_PRESETS: Record<WeatherKind, WeatherPreset> = {
  clear:   { particles: 'none' },
  rain:    { particles: 'rain' },
  snow:    { particles: 'snow' },
  wind:    { particles: 'none' },
  drought: { particles: 'none' },
};

/* ─── 北疆长城 — Qin/Han Great Wall draped along the northern frontier ─
 *  A stone rampart following the Yinshan/Yan ranges from the Hexi west end
 *  to Liaodong, with watchtowers at intervals. Instanced for cheapness. */
const WALL_GEO: ReadonlyArray<readonly [number, number]> = [
  [102.5, 38.2], [105.5, 39.2], [108.0, 40.3], [110.5, 41.2],
  [113.0, 41.6], [115.5, 41.6], [118.0, 41.2], [120.5, 41.2], [122.5, 41.3],
];
function GreatWall3D() {
  const { segments, towers } = useMemo(() => {
    const pxPts = WALL_GEO.map(([lo, la]) => geoToPixel(lo, la));
    const dense: Array<[number, number]> = [];
    const STEP = 7;                                   // px between rampart blocks
    for (let i = 0; i < pxPts.length - 1; i++) {
      const [ax, ay] = pxPts[i], [bx, by] = pxPts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / STEP));
      for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * (k / n), ay + (by - ay) * (k / n)]);
    }
    dense.push(pxPts[pxPts.length - 1]);
    const segments: Array<{ x: number; y: number; z: number; rot: number; len: number }> = [];
    const towers: Array<[number, number, number]> = [];
    for (let i = 0; i < dense.length - 1; i++) {
      const [wax, waz] = pxToWorld(dense[i][0], dense[i][1]);
      const [wbx, wbz] = pxToWorld(dense[i + 1][0], dense[i + 1][1]);
      const mx = (wax + wbx) / 2, mz = (waz + wbz) / 2;
      const len = Math.hypot(wbx - wax, wbz - waz);
      segments.push({ x: mx, y: sampleTerrainHeight(mx, mz), z: mz, rot: Math.atan2(wbz - waz, wbx - wax), len });
      if (i % 9 === 0) towers.push([wax, sampleTerrainHeight(wax, waz), waz]);
    }
    return { segments, towers };
  }, []);
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const towerRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const d = new THREE.Object3D();
    if (wallRef.current) {
      segments.forEach((s, i) => {
        d.position.set(s.x, s.y + 0.15, s.z);
        d.rotation.set(0, -s.rot, 0);
        d.scale.set(s.len * 1.2, 1, 1);
        d.updateMatrix();
        wallRef.current!.setMatrixAt(i, d.matrix);
      });
      wallRef.current.instanceMatrix.needsUpdate = true;
    }
    if (towerRef.current) {
      const e = new THREE.Object3D();
      towers.forEach((p, i) => {
        e.position.set(p[0], p[1] + 0.25, p[2]);
        e.updateMatrix();
        towerRef.current!.setMatrixAt(i, e.matrix);
      });
      towerRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [segments, towers]);
  return (
    <group>
      <instancedMesh ref={wallRef} args={[undefined, undefined, segments.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.30, 0.14]} />
        <meshStandardMaterial color="#7c766c" roughness={0.96} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={towerRef} args={[undefined, undefined, towers.length]} castShadow receiveShadow>
        <boxGeometry args={[0.19, 0.50, 0.19]} />
        <meshStandardMaterial color="#b0a896" roughness={0.93} metalness={0.02} />
      </instancedMesh>
    </group>
  );
}

/* ─── 州界虚线 — dashed ink borders between the thirteen provinces ───
 *  A draped texture: sample the map on a coarse grid, assign each land
 *  sample to its nearest city's province (same Voronoi the territory
 *  layer uses), and stipple a dash wherever neighbouring samples belong
 *  to different provinces. Water (sea/lake/river) is skipped so borders
 *  stop at the coast and break at rivers. Static — built once. */
let provinceBorderTexCache: THREE.Texture | null = null;
function buildProvinceBorderTexture(cities: Record<string, City>): THREE.Texture {
  if (provinceBorderTexCache) return provinceBorderTexCache;
  const W = 2000, H = 1440;                    // 2× pixel space, crisper dots
  const STEP = 2;                              // logical-px sampling grid
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // City geo-pixel positions + province ids
  const pts: Array<{ x: number; y: number; pid: string }> = [];
  for (const c of Object.values(cities)) {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    pts.push({ x: px, y: py, pid: PROVINCE_BY_CITY[c.id] ?? '?' });
  }
  const isWater = (x: number, y: number): boolean => {
    if (landSDF(x, y) < 0) return true;
    for (const lk of LAKES) if (Math.hypot(x - lk.x, y - lk.y) < lk.r) return true;
    for (const r of RIVERS) if (distToPolyline(x, y, r.points) < r.width) return true;
    return false;
  };
  const provAt = (x: number, y: number): string | null => {
    if (isWater(x, y)) return null;
    let best = ''; let bd = Infinity;
    for (const p of pts) {
      const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bd) { bd = d; best = p.pid; }
    }
    return best;
  };
  // Cache one row at a time so each sample's province is computed once.
  const cols = Math.floor(1000 / STEP), rows = Math.floor(720 / STEP);
  let prevRow: Array<string | null> = new Array(cols).fill(null);
  for (let gy = 0; gy < rows; gy++) {
    const row: Array<string | null> = new Array(cols);
    for (let gx = 0; gx < cols; gx++) row[gx] = provAt(gx * STEP, gy * STEP);
    for (let gx = 0; gx < cols; gx++) {
      const here = row[gx];
      if (!here) continue;
      const right = gx + 1 < cols ? row[gx + 1] : null;
      const up = prevRow[gx];
      const isBorder = (right && right !== here) || (up && up !== here);
      if (!isBorder) continue;
      const x = gx * STEP, y = gy * STEP;
      // Dash rhythm: ~12px ink, ~6px gap along the border's run.
      if ((x + y) % 18 >= 12) continue;
      // Parchment halo under an ink dot — reads on both dark and gold ground.
      ctx.fillStyle = 'rgba(238, 226, 196, 0.40)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(48, 34, 18, 0.72)';
      ctx.beginPath(); ctx.arc(x * 2, y * 2, 2.0, 0, Math.PI * 2); ctx.fill();
    }
    prevRow = row;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = true;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 8;
  provinceBorderTexCache = tex;
  return tex;
}

function ProvinceBorders3D({ cities }: { cities: Record<string, City> }) {
  // Same displaced plane as the territory layer, a hair higher so the
  // dashes sit on top of the tint but under lakes/labels.
  const geom = useMemo(() => {
    const subW = 240, subD = 180;
    const g = new THREE.PlaneGeometry(MAP_W, MAP_D, subW, subD);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wy = pos.getY(i);
      const px = (wx + MAP_W / 2) / PIXEL_TO_WORLD;
      const py = (MAP_D / 2 - wy) / PIXEL_TO_WORLD;
      pos.setZ(i, sampleTerrain(px, py).h + 0.06);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const texture = useMemo(() => buildProvinceBorderTexture(cities), [cities]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geom} renderOrder={2}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/* ─── 州名 — the thirteen Han provinces as faint floating watermarks so
 *  the player can read regions at a glance. Big + translucent, behind the
 *  city labels; they scale with distance so they recede when you zoom in. */
const STATES_GEO: ReadonlyArray<{ zh: string; lon: number; lat: number }> = [
  { zh: '司隸', lon: 110.0, lat: 34.7 },
  { zh: '豫州', lon: 114.4, lat: 33.2 },
  { zh: '冀州', lon: 114.7, lat: 37.9 },
  { zh: '兗州', lon: 116.1, lat: 35.5 },
  { zh: '徐州', lon: 118.4, lat: 34.1 },
  { zh: '青州', lon: 119.4, lat: 36.9 },
  { zh: '荊州', lon: 112.2, lat: 30.0 },
  { zh: '揚州', lon: 118.7, lat: 30.0 },
  { zh: '益州', lon: 104.1, lat: 30.0 },
  { zh: '涼州', lon: 101.4, lat: 37.2 },
  { zh: '并州', lon: 112.4, lat: 38.6 },
  { zh: '幽州', lon: 118.8, lat: 40.6 },
  { zh: '交州', lon: 108.0, lat: 22.6 },
];
function ProvinceLabels3D() {
  return (
    <group>
      {STATES_GEO.map((s) => {
        const [wx, wz] = pxToWorld(...geoToPixel(s.lon, s.lat));
        const y = sampleTerrainHeight(wx, wz) + 1.4;
        return (
          <Html key={s.zh} position={[wx, y, wz]} center distanceFactor={32}
            zIndexRange={[1, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              fontSize: '46px', fontWeight: 700,
              color: 'rgba(255, 246, 224, 0.30)',
              textShadow: '0 2px 12px rgba(0,0,0,0.55)',
              letterSpacing: '0.22em', whiteSpace: 'nowrap', userSelect: 'none',
            }}>{s.zh}</div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── 天下大勢 — RTK-XIV-style realm labels: zoom out and each lord's name
 *  blooms over the heart of his domain, colour-coded, so you read who holds
 *  what at a glance. Zoom back in and they fade; city labels take over. */
/** Camera distance below which the realm names give way to city detail.
 *  Far higher than the city-label LOD (30): names stay through the overview
 *  and medium zoom, vanishing only once you pull in to inspect cities. */
const FACTION_LABEL_DIST = 220;   // camera-height handoff with the city-name LOD: above → realm names, below → city names
function FactionLabels3D({ cities, forces, officers }: {
  cities: Record<string, City>;
  forces: Record<string, Force>;
  officers: Record<string, { name: { zh: string; en: string } }>;
}) {
  // Own zoom gate (hysteresis) so the names persist until you zoom in close.
  const lang = useLanguage();
  const { camera } = useThree();
  const [show, setShow] = useState(true);
  const shownRef = useRef(true);
  useFrame(() => {
    const d = camera.position.y;   // camera height — pan-independent zoom proxy
    const next = shownRef.current
      ? d >= FACTION_LABEL_DIST - 14      // stay shown until we pull in past the lower band
      : d > FACTION_LABEL_DIST + 14;       // re-show once we zoom back out past the upper band
    if (next !== shownRef.current) { shownRef.current = next; setShow(next); }
  });
  const labels = useMemo(() => {
    const agg = new Map<string, { sx: number; sz: number; n: number }>();
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId) continue;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      const e = agg.get(c.ownerForceId) ?? { sx: 0, sz: 0, n: 0 };
      e.sx += wx; e.sz += wz; e.n += 1;
      agg.set(c.ownerForceId, e);
    }
    const out: Array<{ x: number; z: number; name: string; color: string; bright: string; n: number }> = [];
    for (const [fid, e] of agg) {
      const force = forces[fid];
      if (!force || e.n === 0) continue;
      const ruler = force.rulerOfficerId ? officers[force.rulerOfficerId] : null;
      const name = ruler ? pickName(ruler.name, lang) : pickName(force.name, lang);
      // Brighten the realm colour for legible text on the dark chip — keeps the
      // faction's hue but guarantees contrast even for dark/terrain-green lords.
      const bright = '#' + new THREE.Color(force.color).lerp(new THREE.Color('#ffffff'), 0.45).getHexString();
      out.push({ x: e.sx / e.n, z: e.sz / e.n, name, color: force.color, bright, n: e.n });
    }
    return out;
  }, [cities, forces, officers, lang]);
  if (!show) return null;   // pulled in close → city detail takes over
  return (
    <group>
      {labels.map((l, i) => {
        // Bigger domains get a bigger name; sized large so they read from a
        // full zoom-out (distanceFactor keeps a fixed world size, so a big
        // factor + big font is what stays legible when the camera pulls back).
        const fs = Math.round(64 + Math.min(48, l.n * 3));
        const y = sampleTerrainHeight(l.x, l.z) + 2.2;
        return (
          <Html key={i} position={[l.x, y, l.z]} center distanceFactor={64} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(14,10,6,0.72)',
              border: `3px solid ${l.color}`,
              borderRadius: 'var(--tkm-radius-lg)',
              padding: '2px 16px',
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              fontSize: `${fs}px`, fontWeight: 800,
              color: l.bright,
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
              letterSpacing: '0.08em', whiteSpace: 'nowrap', userSelect: 'none', opacity: 0.96,
            }}>{l.name}</div>
          </Html>
        );
      })}
    </group>
  );
}

/* ─── 行軍預覽 — glowing route while the march picker is open ─────── */
function MarchPreviewLine({ fromId, toId, cities }: {
  fromId: string; toId: string; cities: Record<string, City>;
}) {
  const data = useMemo(() => {
    const from = cities[fromId];
    const to = cities[toId];
    if (!from || !to) return null;
    const fp = cityPos(from);
    const tp = cityPos(to);
    const route = terrainRoute(fp.x, fp.y, tp.x, tp.y);
    const pts = route.map((p) => {
      const [wx, wz] = pxToWorld(p.x, p.y);
      return new THREE.Vector3(wx, sampleTerrainHeight(wx, wz) + 0.12, wz);
    });
    // Cities the column marches past that could sally out at it.
    const risky: Array<[number, number]> = [];
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || c.ownerForceId === from.ownerForceId) continue;
      if (c.id === toId || c.id === fromId) continue;
      if (c.troops < 4000) continue;
      const cp = cityPos(c);
      const near = route.some((p) => Math.hypot(p.x - cp.x, p.y - cp.y) < 67);
      if (near) risky.push(pxToWorld(cp.x, cp.y));
    }
    // P2 行軍上格 — quantise the route onto the canonical lattice and show
    // the actual CELLS the column will cross, tinted by terrain cost
    // (green plains → red ridge/river crossings): 所見即所行.
    const cells: Array<{ x: number; z: number; color: string }> = [];
    const seenCells = new Set<string>();
    for (let i = 0; i < route.length - 1; i++) {
      const p0 = route[i], p1 = route[i + 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / (GEO_HEX_ROW / 2)));
      for (let k = 0; k <= steps; k++) {
        const px = p0.x + (p1.x - p0.x) * (k / steps);
        const py = p0.y + (p1.y - p0.y) * (k / steps);
        const h = geoHexAt(px, py);
        const key = `${h.col},${h.row}`;
        if (seenCells.has(key)) continue;
        seenCells.add(key);
        const cc = geoHexCenter(h.col, h.row);
        const cost = terrainMarchCost(cc.x, cc.y);
        const [wx, wz] = pxToWorld(cc.x, cc.y);
        cells.push({
          x: wx, z: wz,
          color: cost < 0.25 ? '#69d47e' : cost < 0.7 ? '#e8c15a' : '#ef7350',
        });
      }
    }
    return { pts, risky, cells };
  }, [fromId, toId, cities]);
  const matRef = useRef<THREE.LineDashedMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 3) * 0.2;
  });
  const geom = useMemo(() => {
    if (!data) return null;
    const g = new THREE.BufferGeometry().setFromPoints(data.pts);
    return g;
  }, [data]);
  const lineObj = useMemo(() => {
    if (!geom) return null;
    const mat = new THREE.LineDashedMaterial({ color: '#ffd75e', dashSize: 0.5, gapSize: 0.3, transparent: true, opacity: 0.95 });
    const l = new THREE.Line(geom, mat);
    l.computeLineDistances();
    return { l, mat };
  }, [geom]);
  useEffect(() => {
    if (lineObj) matRef.current = lineObj.mat as never;
  }, [lineObj]);
  if (!data || !lineObj) return null;
  return (
    <group>
      <primitive object={lineObj.l} />
      {/* P2 行軍上格 — the lattice cells the column will actually cross,
          tinted by march cost (green open ground → red ridge/river). */}
      {data.cells.map((c, i) => (
        <mesh key={`c${i}`} position={[c.x, sampleTerrainHeight(c.x, c.z) + 0.08, c.z]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[HEXW_R * 0.62, HEXW_R * 0.8, 6]} />
          <meshBasicMaterial color={c.color} transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      {/* 邀擊 risk — hostile garrisons within sally reach of the route */}
      {data.risky.map(([wx, wz], i) => (
        <mesh key={i} position={[wx, sampleTerrainHeight(wx, wz) + 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.66, 24]} />
          <meshBasicMaterial color="#ff5040" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── 橋樑 — timber bridges where a road crosses a river/lake. Each
 *  city-adjacency edge is sampled; a crossing run gets one bridge oriented
 *  along the road. ── */
function Bridges3D({ cities }: { cities: Record<string, City> }) {
  const bridges = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const cross: Array<[number, number]> = [];
        const N = 26;
        for (let i = 1; i < N; i++) {
          const t = i / N;
          const px = fpx + (tpx - fpx) * t, py = fpy + (tpy - fpy) * t;
          const g = battleGroundAt(px, py);
          if (g === 'river' || g === 'lake') cross.push([px, py]);
        }
        if (cross.length === 0) continue;
        const [mpx, mpy] = cross[Math.floor(cross.length / 2)];
        const [wx, wz] = pxToWorld(mpx, mpy);
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        out.push({ x: wx, z: wz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (bridges.length === 0) return null;
  return (
    <group>
      {bridges.map((b, i) => (
        <group key={i} position={[b.x, sampleTerrainHeight(b.x, b.z) + 0.05, b.z]} rotation={[0, b.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.025, 0.9]} />
            <meshStandardMaterial color="#8a6840" roughness={0.85} />
          </mesh>
          <mesh position={[0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
          <mesh position={[-0.08, 0.04, 0]}><boxGeometry args={[0.015, 0.05, 0.9]} /><meshStandardMaterial color="#5f4326" /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 驛站 — a relay post (hut + pennant) at the midpoint of long roads,
 *  on dry ground, so the highways feel travelled. ── */
function PostStations3D({ cities }: { cities: Record<string, City> }) {
  const posts = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ x: number; z: number; rot: number }> = [];
    for (const c of Object.values(cities)) {
      for (const adj of c.adjacentCityIds ?? []) {
        const o = cities[adj]; if (!o) continue;
        const key = c.id < o.id ? `${c.id}|${o.id}` : `${o.id}|${c.id}`;
        if (seen.has(key)) continue; seen.add(key);
        const [fpx, fpy] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [tpx, tpy] = cityPixel(o.id, o.coords.x, o.coords.y);
        const mpx = (fpx + tpx) / 2, mpy = (fpy + tpy) / 2;
        const g = battleGroundAt(mpx, mpy);
        if (g === 'river' || g === 'lake' || g === 'sea') continue;   // not on water (bridges handle that)
        const [fx, fz] = pxToWorld(fpx, fpy);
        const [tx, tz] = pxToWorld(tpx, tpy);
        if (Math.hypot(tx - fx, tz - fz) < 5) continue;               // only the longer hauls
        const [mx, mz] = pxToWorld(mpx, mpy);
        if (sampleTerrainHeight(mx, mz) < 0.06) continue;
        out.push({ x: mx, z: mz, rot: Math.atan2(tx - fx, tz - fz) });
      }
    }
    return out;
  }, [cities]);
  if (posts.length === 0) return null;
  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.x, sampleTerrainHeight(p.x, p.z), p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.07, 0.06, 0.08]} /><meshStandardMaterial color="#a08a64" roughness={0.9} /></mesh>
          <mesh position={[0, 0.075, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[0.065, 0.035, 4]} /><meshStandardMaterial color="#5f4a2e" roughness={0.85} /></mesh>
          <mesh position={[0.05, 0.1, 0.05]}><cylinderGeometry args={[0.004, 0.004, 0.14, 4]} /><meshStandardMaterial color="#3a2818" /></mesh>
          <mesh position={[0.085, 0.13, 0.05]}><planeGeometry args={[0.06, 0.035]} /><meshStandardMaterial color="#c0502e" side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── 名勝古戰場 — a stone stele + label marking the famous battlefields the
 *  named-map data records (赤壁/官渡/長坂/定軍山…). One per battle. ── */
function Landmarks3D({ cities }: { cities: Record<string, City> }) {
  const lang = useLanguage();
  const sites = useMemo(() => {
    const usedMap = new Set<string>();
    const out: Array<{ x: number; z: number; name: string }> = [];
    for (const [cid, mapId] of Object.entries(NAMED_MAPS_BY_CITY)) {
      if (usedMap.has(mapId)) continue;
      const c = cities[cid]; const m = NAMED_MAPS_BY_ID[mapId];
      if (!c || !m) continue;
      usedMap.add(mapId);
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, name: pickName(m.name, lang) });
    }
    return out;
  }, [cities, lang]);
  return (
    <group>
      {sites.map((s, i) => {
        const x = s.x + 0.55, z = s.z + 0.55;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.06, 0.24, 0.04]} /><meshStandardMaterial color="#5a554e" roughness={0.85} /></mesh>
            <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[0.085, 0.03, 0.06]} /><meshStandardMaterial color="#46423b" roughness={0.8} /></mesh>
            <Html position={[0, 0.37, 0]} center distanceFactor={13} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.8)', border: '1px solid #8a7050', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#e0c89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>⚔ {s.name}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 唯一名建築 — landmark monuments at iconic cities ────────────────
 * Each three-kingdoms capital and a handful of legendary sites carry a
 * one-of-a-kind structure that reads instantly from the map: 鄴 flies the
 * Bronze Sparrow Terrace, the Han capitals raise twin-eaved palace halls,
 * 成都 the brocade-roofed Shu palace. Purely cosmetic, geo-anchored to the
 * real city pixel so it sits right beside the city marker. */
type LandmarkKind = 'terrace' | 'palace' | 'brocade';
const UNIQUE_LANDMARKS: ReadonlyArray<{ cityId: string; zh: string; en: string; kind: LandmarkKind }> = [
  { cityId: 'ye',      zh: '銅雀臺', en: 'Bronze Sparrow Terrace', kind: 'terrace' },  // 曹操鄴城,銅雀／金鳳／冰井三臺
  { cityId: 'luoyang', zh: '漢宮',   en: 'Han Palace',             kind: 'palace'  },  // 後漢南北宮、魏都宮城
  { cityId: 'changan', zh: '未央宮', en: 'Weiyang Palace',         kind: 'palace'  },  // 前漢宮室、董卓遷都
  { cityId: 'xuchang', zh: '許都',   en: 'Xudu Capital',           kind: 'palace'  },  // 獻帝行在、曹魏發跡
  { cityId: 'jianye',  zh: '太初宮', en: 'Taichu Palace',          kind: 'palace'  },  // 孫吳宮城
  { cityId: 'chengdu', zh: '錦官城', en: 'Brocade City',           kind: 'brocade' },  // 蜀宮、錦官織造
];

/** A twin-eaved swept roof in a chosen palette (重檐廡殿頂). */
function PalaceRoof3D({ y, w, d, color = '#c9a23c', ridge = '#e8cf6a' }: {
  y: number; w: number; d: number; color?: string; ridge?: string;
}) {
  const eave = (ey: number, ew: number, ed: number, eh: number) => (
    <group position={[0, ey, 0]}>
      <mesh castShadow><boxGeometry args={[ew, eh, ed]} /><meshStandardMaterial color={color} roughness={0.55} metalness={0.25} /></mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * ew * 0.46, eh * 0.3, sz * ed * 0.4]} rotation={[sz * 0.5, 0, -sx * 0.5]} castShadow>
          <coneGeometry args={[eh * 0.55, eh * 1.4, 4]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
  return (
    <group position={[0, y, 0]}>
      {eave(0, w, d, 0.05)}
      {/* upper tier — 重檐 */}
      <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[w * 0.6, 0.06, d * 0.6]} /><meshStandardMaterial color="#8a2f28" roughness={0.8} /></mesh>
      {eave(0.12, w * 0.66, d * 0.66, 0.04)}
      {/* golden ridge acroteria (鴟尾) */}
      <mesh position={[-w * 0.34, 0.05, 0]} rotation={[0, 0, 0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[w * 0.34, 0.05, 0]} rotation={[0, 0, -0.5]} castShadow><coneGeometry args={[0.022, 0.07, 5]} /><meshStandardMaterial color={ridge} roughness={0.4} metalness={0.5} /></mesh>
    </group>
  );
}

/** A grand palace hall on a raised stone platform with vermilion columns. */
function PalaceHall3D({ roofColor, roofRidge }: { roofColor?: string; roofRidge?: string }) {
  return (
    <group>
      {/* Raised stone platform (臺基) */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow><boxGeometry args={[0.72, 0.08, 0.46]} /><meshStandardMaterial color="#b8a88c" roughness={0.92} /></mesh>
      <mesh position={[0, 0.085, 0.25]} castShadow><boxGeometry args={[0.3, 0.01, 0.06]} /><meshStandardMaterial color="#9a8a70" roughness={0.95} /></mesh>
      {/* Vermilion hall body */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow><boxGeometry args={[0.6, 0.16, 0.36]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      {/* Front colonnade */}
      {[-0.24, -0.08, 0.08, 0.24].map((cx, i) => (
        <mesh key={i} position={[cx, 0.17, 0.19]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.16, 8]} /><meshStandardMaterial color="#6a1f1a" roughness={0.7} /></mesh>
      ))}
      <PalaceRoof3D y={0.27} w={0.7} d={0.46} color={roofColor} ridge={roofRidge} />
    </group>
  );
}

/** 銅雀臺 — a three-tier stone terrace crowned by a pavilion and the bronze
 *  sparrow that gave it its name. */
function BronzeTerrace3D() {
  return (
    <group>
      {/* Three receding stone tiers */}
      <mesh position={[0, 0.10, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.2, 0.42]} /><meshStandardMaterial color="#9a9082" roughness={0.95} /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow receiveShadow><boxGeometry args={[0.37, 0.16, 0.31]} /><meshStandardMaterial color="#a89e8e" roughness={0.95} /></mesh>
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow><boxGeometry args={[0.26, 0.12, 0.22]} /><meshStandardMaterial color="#b4aa98" roughness={0.95} /></mesh>
      {/* Crowning pavilion */}
      <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[0.2, 0.1, 0.17]} /><meshStandardMaterial color="#8a2f28" roughness={0.78} /></mesh>
      <PalaceRoof3D y={0.6} w={0.26} d={0.22} color="#c9a23c" />
      {/* 銅雀 — the bronze sparrow perched on the ridge */}
      <group position={[0, 0.74, 0]}>
        <mesh castShadow><sphereGeometry args={[0.035, 10, 8]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, 0.04, -0.02]} castShadow><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[-0.04, 0.01, 0]} rotation={[0, 0, 0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0.04, 0.01, 0]} rotation={[0, 0, -0.7]} castShadow><coneGeometry args={[0.02, 0.08, 4]} /><meshStandardMaterial color="#9c7a3c" roughness={0.45} metalness={0.6} /></mesh>
        <mesh position={[0, -0.01, 0.05]} rotation={[1.2, 0, 0]} castShadow><coneGeometry args={[0.015, 0.06, 4]} /><meshStandardMaterial color="#b5894a" roughness={0.45} metalness={0.6} /></mesh>
      </group>
    </group>
  );
}

function UniqueLandmarks3D({ cities }: { cities: Record<string, City> }) {
  const lang = useLanguage();
  const sites = useMemo(() => {
    const out: Array<{ x: number; z: number; zh: string; kind: LandmarkKind }> = [];
    for (const lm of UNIQUE_LANDMARKS) {
      const c = cities[lm.cityId];
      if (!c) continue;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      out.push({ x: wx, z: wz, zh: pickName(lm, lang), kind: lm.kind });
    }
    return out;
  }, [cities, lang]);
  const scale = PIXEL_TO_WORLD * 50 * 0.5 * MARKER_SCALE;
  return (
    <group>
      {sites.map((s, i) => {
        // Offset opposite the battle signpost so the two never collide.
        const x = s.x - 0.6, z = s.z - 0.6;
        const y = sampleTerrainHeight(x, z);
        return (
          <group key={i} position={[x, y, z]} scale={scale}>
            {s.kind === 'terrace' ? <BronzeTerrace3D />
              : s.kind === 'brocade' ? <PalaceHall3D roofColor="#3f7d6e" roofRidge="#7fd0b8" />
              : <PalaceHall3D />}
            <Html position={[0, s.kind === 'terrace' ? 0.95 : 0.5, 0]} center distanceFactor={11} zIndexRange={[8, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(28, 18, 10, 0.82)', border: '1px solid #c9a23c', borderRadius: 'var(--tkm-radius-xs)',
                padding: '1px 6px', color: '#f0d89a', fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                fontSize: '11px', whiteSpace: 'nowrap',
              }}>🏯 {s.zh}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ─── 行軍時距環 — concentric rings around a selected column's source city,
   one per march-time band (moveArmyToCell: <100px=1 季, <195=2, <275=3, else
   4). Shows at a glance how many seasons a march to any spot will cost, so you
   stop guessing where you can reach this turn. Rings hug the terrain. ─────── */
const MARCH_BANDS: Array<{ r: number; seasons: number; color: string }> = [
  { r: 100, seasons: 1, color: '#5ad17a' },
  { r: 195, seasons: 2, color: '#e3c948' },
  { r: 275, seasons: 3, color: '#e0863a' },
];
function MarchRangeRings({ cx, cy }: { cx: number; cy: number }) {
  const t = useT();
  const rings = useMemo(() => MARCH_BANDS.map((b) => {
    const N = 90;
    const pts: Array<[number, number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const ang = (i / N) * Math.PI * 2;
      const [wx, wz] = pxToWorld(cx + Math.cos(ang) * b.r, cy + Math.sin(ang) * b.r);
      pts.push([wx, sampleTerrainHeight(wx, wz) + 0.14, wz]);
    }
    const [lx, lz] = pxToWorld(cx, cy - b.r);   // north point — anchor the label
    return { pts, color: b.color, seasons: b.seasons, label: [lx, sampleTerrainHeight(lx, lz) + 0.5, lz] as [number, number, number] };
  }), [cx, cy]);
  return (
    <group>
      {rings.map((rg, i) => (
        <group key={i}>
          <Line points={rg.pts} color={rg.color} lineWidth={2} transparent opacity={0.7} dashed dashSize={2.4} gapSize={1.4} />
          <Html position={rg.label} center distanceFactor={11} zIndexRange={[40, 30]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.82)', border: `1px solid ${rg.color}`, borderRadius: 'var(--tkm-radius-xs)',
              padding: '1px 6px', fontFamily: 'var(--tkm-font-body)', fontSize: '10px', color: rg.color, whiteSpace: 'nowrap',
            }}>{t(`${rg.seasons} 季`, `${rg.seasons} season${rg.seasons > 1 ? 's' : ''}`)}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ─── 海域 — faint sea names drift in the open water around the coast so the
   empty margin reads as ocean on an old chart, not dead space. They sit past
   the map edges (the pan clamp keeps the land from covering them) and hold a
   constant on-screen size, so they mostly register at the strategic zoom. ── */
const SEA_LABELS: Array<{ zh: string; en: string; pos: [number, number, number]; size: number }> = [
  { zh: '東海', en: 'East Sea', pos: [MAP_W * 0.58, 1, MAP_D * 0.16], size: 25 },
  { zh: '南海', en: 'South Sea', pos: [MAP_W * 0.16, 1, MAP_D * 0.72], size: 23 },
  { zh: '渤海', en: 'Bohai', pos: [MAP_W * 0.46, 1, -MAP_D * 0.42], size: 17 },
];
function SeaLabels() {
  const lang = useLanguage();
  return (
    <>
      {SEA_LABELS.map((s) => (
        <Html key={s.zh} position={s.pos} center zIndexRange={[8, 2]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'var(--tkm-font-display, serif)', fontSize: s.size, fontStyle: 'italic',
            color: 'rgba(176,202,224,0.55)', letterSpacing: lang === 'en' ? '2px' : '10px',
            whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.6)', userSelect: 'none',
          }}>{lang === 'en' ? s.en : s.zh}</div>
        </Html>
      ))}
    </>
  );
}

/* ─── 羅盤 — reports the camera's heading (azimuth, in whole degrees) up to the
   DOM compass rose, which counter-rotates so 北 always points to true north. */
function HeadingTracker({ controlsRef, onHeading }: {
  controlsRef: React.MutableRefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onHeading: (deg: number) => void;
}) {
  const last = useRef(999);
  useFrame(() => {
    const c = controlsRef.current as unknown as { getAzimuthalAngle?: () => number } | null;
    if (!c?.getAzimuthalAngle) return;
    const deg = Math.round((c.getAzimuthalAngle() * 180) / Math.PI);
    if (deg !== last.current) { last.current = deg; onHeading(deg); }
  });
  return null;
}


function MapScene({ overlayMode, onPortClick, onFortClick, onTribeClick, onSiteClick, onScenicClick, onQuickAction, mapStyle, dioSelectedId, dioMode, dioCast, dioArcs, dioFx, dioHover, onDioHover, onDioramaTile, onFocusWorld, onDragLock }: {
  overlayMode: OverlayMode;
  mapStyle: 'classic' | 'hex';
  onPortClick: (portId: string) => void;
  onFortClick: (fortId: string) => void;
  onTribeClick: (tribeId: string) => void;
  onSiteClick: (siteId: string) => void;
  onScenicClick: (siteId: string) => void;
  /** 快捷輪盤 — open the march/recruit picker for a city (DOM modals live
   *  in the outer shell, outside the Canvas). */
  onQuickAction: (kind: 'march' | 'recruit' | 'muster', cityId: string) => void;
  /** 原地指揮 — in-place battle commanding state, owned by the outer shell. */
  dioSelectedId: string | null;
  dioMode: 'move' | 'attack';
  dioCast: { id: StratagemId; tacticId?: string } | null;
  dioArcs: Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>;
  dioFx: StratagemFxInstance[];
  dioHover: HexCoord | null;
  onDioHover: (c: HexCoord | null) => void;
  onDioramaTile: (c: HexCoord) => void;
  /** 雙擊飛鏡 — fly+zoom the camera to a double-clicked ground point. */
  onFocusWorld?: (wx: number, wz: number) => void;
  /** 拖拽行軍 — lock/unlock the orbit controls while a drag is live. */
  onDragLock?: (locked: boolean) => void;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_TERRITORY_OWNERSHIP);
  const hexPaint = useGameStore((s) => s.hexPaint ?? EMPTY_HEX_PAINT);
  const worldScars = useGameStore((s) => s.worldScars);
  const spottedAmbushIds = useGameStore((s) => s.spottedAmbushIds);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);
  const openCityMap = useGameStore((s) => s.openCityMap);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const selectedArmyId3D = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const redirectArmy = useGameStore((s) => s.redirectArmy);
  const moveArmyToCell = useGameStore((s) => s.moveArmyToCell);
  const mergeArmyInto = useGameStore((s) => s.mergeArmyInto);
  const startFieldBattle = useGameStore((s) => s.startFieldBattle);
  const armiesState = useGameStore((s) => s.armies);
  const convoysState = useGameStore((s) => s.convoys);
  const expeditionsState = useGameStore((s) => s.expeditions);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const lang = useLanguage();
  const t = useT();
  const handleArmyClick = (officerId: string) => {
    // A completed drag also emits a click on release — swallow it.
    if (performance.now() - dragEndedAtRef.current < 300) return;
    const clicked = armiesState[officerId];
    if (!clicked) return;
    // No selection yet → select own column.
    if (!selectedArmyId3D) {
      if (clicked.forceId === playerForceId) selectArmy(officerId);
      return;
    }
    if (officerId === selectedArmyId3D) { selectArmy(null); return; }
    // Friendly column → rendezvous and merge; enemy → ride out and engage.
    if (clicked.forceId === playerForceId) {
      if (mergeArmyInto(selectedArmyId3D, officerId)) selectArmy(null);
      else selectArmy(officerId);
    } else {
      if (startFieldBattle(selectedArmyId3D, officerId)) selectArmy(null);
    }
  };
  // 拖拽行軍 — press-hold an own column ~0.35s (hold still: >9px slop =
  // camera pan and the hold cancels), then drag; release on land reroutes
  // it there (same moveArmyToCell semantics as select+tap).
  const [dragMarch, setDragMarch] = useState<{
    id: string; px: number; py: number;
    /** 遭遇預告 — first predicted contact on the CURRENT drop target. */
    forecast?: { day: number; foeZh: string; foeEn: string } | null;
  } | null>(null);
  const dragCellRef = useRef<string>('');
  const dragMarchRef = useRef<typeof dragMarch>(null);
  dragMarchRef.current = dragMarch;
  const dragPendingRef = useRef<{ timer: ReturnType<typeof setTimeout>; sx: number; sy: number } | null>(null);
  const dragEndedAtRef = useRef(0);
  const cancelPendingDrag = () => {
    if (dragPendingRef.current) { clearTimeout(dragPendingRef.current.timer); dragPendingRef.current = null; }
  };
  const endDrag = (commit: boolean) => {
    const d = dragMarchRef.current;
    dragMarchRef.current = null;   // double-fire guard (plane up + window up)
    if (d) {
      dragEndedAtRef.current = performance.now();
      if (commit && isLandPx(d.px, d.py) && useGameStore.getState().moveArmyToCell(d.id, d.px, d.py)) {
        useGameStore.getState().selectArmy(null);
      }
    }
    setDragMarch(null);
    onDragLock?.(false);
    document.body.style.cursor = '';
  };
  const handleArmyPressStart = (officerId: string, e: { clientX: number; clientY: number }) => {
    const live = useGameStore.getState();
    const a = live.armies[officerId];
    if (!a || a.forceId !== live.playerForceId) return;
    cancelPendingDrag();
    const timer = setTimeout(() => {
      dragPendingRef.current = null;
      setDragMarch({ id: officerId, px: a.x, py: a.y });
      onDragLock?.(true);
      document.body.style.cursor = 'grabbing';
    }, 350);
    dragPendingRef.current = { timer, sx: e.clientX, sy: e.clientY };
  };
  useEffect(() => {
    const move = (ev: PointerEvent) => {
      const pend = dragPendingRef.current;
      if (pend && Math.hypot(ev.clientX - pend.sx, ev.clientY - pend.sy) > 9) cancelPendingDrag();
    };
    const up = () => { cancelPendingDrag(); if (dragMarchRef.current) endDrag(true); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fieldBattleMarks = useGameStore((s) => s.fieldBattleMarks);
  const portsForMarch = useGameStore((s) => s.ports);
  // 戰場立體微縮 — the live battle rendered in place on the world map.
  const tacticalBattle = useGameStore((s) => s.tacticalBattle);
  const battleViewMinimizedScene = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  // Mobile perf gate: only render the diorama when it's actually being watched
  // (minimized view) — desktop also gets the fly-in bloom behind the screen.
  const showDiorama = !!tacticalBattle?.geoAnchor && (!IS_MOBILE || battleViewMinimizedScene);
  const battleSitePx = tacticalBattle?.geoAnchor
    ? { x: tacticalBattle.geoAnchor.x, y: tacticalBattle.geoAnchor.y }
    : null;
  const weather = useGameStore((s) => s.weather);
  const marchPreview = useGameStore((s) => s.marchPreview);
  const weatherPreset = WEATHER_PRESETS[weather.kind];
  const season = useGameStore((s) => s.date.season) as Season;
  const seasonPreset = SEASON_PRESETS[season];
  // 晝夜隨旬 — the month rolls 上旬→day, 中旬→dusk, 下旬→a moonlit night, so
  // time visibly passes as each third of the month resolves.
  const tod = phaseToTOD(useGameStore((s) => s.date.phase));
  const todP = TOD_PRESETS[tod];
  // 行程測距 — with a city selected, hovering another shows the march time.
  const [hoverCityId, setHoverCityId] = useState<string | null>(null);

  // Bounds for particle effects
  const particleBounds = useMemo(() => ({ x: MAP_W, z: MAP_D }), []);

  const NEUTRAL = '#5a4530';

  // Identify capital cities by force.capitalCityId
  const capitalCityIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of Object.values(forces)) {
      if (f.capitalCityId) set.add(f.capitalCityId);
    }
    return set;
  }, [forces]);

  // 城建程度 — sum of building levels per city; drives the suburb sprawl that
  // makes development visible on the map (a built-up city outgrows its wall).
  const buildingsState = useGameStore((s) => s.buildings);
  const devByCity = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of buildingsState) m[b.cityId] = (m[b.cityId] ?? 0) + Math.max(1, b.level);
    return m;
  }, [buildingsState]);

  // Maxes for heatmap normalization
  const maxes = useMemo(() => {
    const vs = Object.values(cities);
    return {
      gold:   Math.max(1, ...vs.map((c) => c.gold)),
      food:   Math.max(1, ...vs.map((c) => c.food)),
      troops: Math.max(1, ...vs.map((c) => c.troops)),
    };
  }, [cities]);

  // 威脅熱度 — per player city: hostile columns already marching at it
  // (full weight, scarier the closer) + hostile garrisons next door (they
  // could). Coloured by threat-to-garrison ratio: green can hold, red
  // cannot. Allies and pact partners don't count — they may not attack.
  const diplomacyScene = useGameStore((s) => s.diplomacy);
  const threatOverlays = useMemo(() => {
    if (overlayMode !== 'threat' || !playerForceId) return EMPTY_THREATS;
    const hostileForce = (fid: string | null | undefined) =>
      !!fid && fid !== playerForceId && isHostilePermitted(diplomacyScene, fid, playerForceId);
    const out: Record<string, { color: string; label: string }> = {};
    for (const city of Object.values(cities)) {
      if (city.ownerForceId !== playerForceId) continue;
      let inbound = 0;
      for (const a of Object.values(armiesState)) {
        if (!hostileForce(a.forceId)) continue;
        if (a.targetCityId === city.id && !a.holding) inbound += a.troops * (0.7 + 0.3 * a.progress);
      }
      for (const adjId of city.adjacentCityIds ?? []) {
        const nb = cities[adjId];
        if (nb && hostileForce(nb.ownerForceId)) inbound += nb.troops * 0.45;
      }
      const ratio = Math.min(1, inbound / Math.max(1, city.troops));
      const col = new THREE.Color('#3f9a4d').lerp(new THREE.Color('#cc2a1e'), ratio);
      out[city.id] = {
        color: `#${col.getHexString()}`,
        label: inbound >= 1000 ? `${Math.round(inbound / 1000)}k` : inbound > 0 ? `${Math.round(inbound)}` : '安',
      };
    }
    return out;
  }, [overlayMode, cities, armiesState, diplomacyScene, playerForceId]);

  // 戰爭迷霧 — optional intel limit: what your cities and columns can see.
  // View-layer only (the AI plays the same); beacons stay live regardless.
  const fogOfWarOn = useGameStore((s) => s.fogOfWar);
  const espReveals = useGameStore((s) => s.espionageReveals ?? EMPTY_REVEALS);
  const fog = useMemo(
    () => (fogOfWarOn && playerForceId
      ? computeFog(cities, armiesState, playerForceId, Object.keys(espReveals), officers)
      : null),
    [fogOfWarOn, cities, armiesState, playerForceId, espReveals, officers],
  );
  // Hostile columns out of sight simply don't render — filter the command
  // map MarchingArmies feeds on (the army layer mirrors it 1:1 by officer).
  const visibleCommands = useMemo(() => {
    if (!fog) return pendingCommands;
    const out: typeof pendingCommands = {};
    for (const [k, cmd] of Object.entries(pendingCommands)) {
      const a = armiesState[cmd.officerId ?? k];
      if (a && a.forceId !== playerForceId && !fog.isVisiblePx(a.x, a.y)) continue;
      out[k] = cmd;
    }
    return out;
  }, [fog, pendingCommands, armiesState, playerForceId]);

  return (
    <>
      {/* Distance fog — restored; blends the far horizon into the sky dome. */}
      <fog attach="fog" args={[todP.fog ?? seasonPreset.fogColor, 150 * WORLD_SCALE, 560 * WORLD_SCALE]} />

      {/* 天穹 — gradient sky + sun/moon (+ stars at night), horizon matched to fog. */}
      <SkyDome
        top={todP.skyTop}
        horizon={todP.horizon ?? seasonPreset.fogColor}
        sunPos={todP.sunPos}
        celestialColor={todP.celestialColor}
        moon={todP.celestial === 'moon'}
        stars={todP.stars}
      />

      {/* Per-season lighting, dimmed and recoloured by time of day */}
      <ambientLight intensity={seasonPreset.ambient * todP.ambientMul} color={todP.ambientColor ?? seasonPreset.ambientColor} />
      <directionalLight
        position={todP.sunPos}
        intensity={seasonPreset.sun.intensity * todP.sunMul}
        color={todP.sunColor ?? seasonPreset.sun.color}
        castShadow
        // 2048 halves shadow VRAM/fill on weak GPUs; at map scale the
        // difference is invisible.
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-MAP_W}
        shadow-camera-right={MAP_W}
        shadow-camera-top={MAP_D}
        shadow-camera-bottom={-MAP_D}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 5, -10]} intensity={0.45} color={seasonPreset.fillColor} />
      <hemisphereLight args={[seasonPreset.hemiSky, seasonPreset.hemiGround, seasonPreset.hemiIntensity]} />

      {/* Weather particles (rain / snow) */}
      {weatherPreset.particles === 'rain' && <RainParticles bounds={particleBounds} />}
      {weatherPreset.particles === 'snow' && <SnowParticles bounds={particleBounds} />}

      {/* 雙擊空地飛鏡 — double-clicking bare ground (when not placing a march)
          flies + zooms the camera to that spot. Cities keep their own click
          semantics, so this only fires on open terrain. */}
      <group onDoubleClick={(e) => {
        if (selectedArmyId3D) return;   // march-placement mode — don't hijack
        e.stopPropagation();
        onFocusWorld?.(e.point.x, e.point.z);
      }}>
      {mapStyle === 'hex' ? (
        // ⬡ 棋盤世界 — hex-prism quilt; rivers/lakes are blue hexes, the sea
        // is the living Ocean below. Same ground-click contract as the scroll.
        <HexWorldTerrain
          season={season}
          cities={cities}
          forces={forces}
          territoryOwnership={territoryOwnership}
          hexPaint={hexPaint}
          worldScars={worldScars}
          fogCityIds={fog ? fog.visibleCityIds : null}
          onGroundClick={(px, py) => {
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }}
        />
      ) : (
        <Suspense fallback={null}>
          <MapTerrain onGroundClick={(px, py) => {
            // With an army selected, clicking open land marches it to that
            // cell and digs in — coords are geo-pixels, the same space the
            // whole simulation runs in (the old 2D path fed painted-map
            // coords here, a cross-space bug retired with it).
            if (selectedArmyId3D && isLandPx(px, py) && moveArmyToCell(selectedArmyId3D, px, py)) {
              selectArmy(null);
            }
          }} />
          <TerritoryGroundLayer cities={cities} forces={forces} territoryOwnership={territoryOwnership} />
        </Suspense>
      )}
      </group>
      <Ocean night={tod === 'night'} />
      {mapStyle === 'classic' && <Lakes3D />}
      {/* 河流流光 — the smooth shimmering ribbon rides BOTH maps; on the hex
          quilt it flows as living water down the blue channel of river tiles. */}
      <RiverRibbons frozen={season === 'winter'} />
      {mapStyle === 'classic' && season === 'winter' && <SnowBlanket />}
      {/* Forests plant at the shared height function, so the same trees stand
          perfectly on the hex quilt too. */}
      <Forest3D season={season} />
      <Farmland3D cities={cities} />
      <Villages3D />
      <GreatWall3D />
      <DriftingClouds />
      {/* 雲影掠地 — the clouds above cast drifting shade on the lowlands. */}
      {!IS_MOBILE && <CloudShadows />}
      {tod === 'day' && <Birds3D />}
      <CitySmoke3D cities={cities} />
      <Caravans3D cities={cities} />
      <TradeShips3D ports={portsForMarch} cities={cities} />
      {todP.lights && <DuskCityLights cities={cities} />}
      {/* Province borders are flat ground decals — they'd sink into the
          raised hex prisms, so the quilt view goes without them. */}
      <ProvinceBorders3D cities={cities} />
      {overlayMode === 'province' && <ProvinceLabels3D />}
      {/* 天下大勢 — lord names over their domains when zoomed out (RTK-XIV). */}
      <FactionLabels3D cities={cities} forces={forces} officers={officers} />
      <SeaLabels />
      {marchPreview && (
        <MarchPreviewLine fromId={marchPreview.fromId} toId={marchPreview.toId} cities={cities} />
      )}

      {/* In hex mode the road network is paved into the quilt itself. */}
      {mapStyle === 'classic' && <Roads cities={cities} />}
      <Bridges3D cities={cities} />
      <PostStations3D cities={cities} />
      <Landmarks3D cities={cities} />
      <UniqueLandmarks3D cities={cities} />
      <MarchingArmies cities={cities} pendingCommands={visibleCommands} forces={forces} officers={officers} ports={portsForMarch} selectedArmyId={selectedArmyId3D} onArmyClick={handleArmyClick} onArmyPressStart={handleArmyPressStart} hideNearPx={battleSitePx} playerForceId={playerForceId} spottedAmbushIds={spottedAmbushIds} />
      {/* 糧道可視 — selected long-range column shows its supply ribbon. */}
      {selectedArmyId3D && <SupplyCorridor3D armyId={selectedArmyId3D} />}
      {/* 拖拽行軍 — live drag: capture plane + ghost line + landing ring/ETA. */}
      {dragMarch && (() => {
        const a = armiesState[dragMarch.id];
        if (!a) return null;
        const [ax, az] = pxToWorld(a.x, a.y);
        const [txw, tzw] = pxToWorld(dragMarch.px, dragMarch.py);
        const land = isLandPx(dragMarch.px, dragMarch.py);
        const cmd = pendingCommands[dragMarch.id];
        const srcCity = cmd?.type === 'march' ? cities[cmd.cityId] : null;
        let eta = 1;
        if (srcCity) {
          const sp = cityPos(srcCity);
          const dist = Math.hypot(dragMarch.px - sp.x, dragMarch.py - sp.y);
          eta = dist < 100 ? 1 : dist < 195 ? 2 : dist < 275 ? 3 : 4;
        }
        const ay = sampleTerrainHeight(ax, az) + 0.35;
        const ty = sampleTerrainHeight(txw, tzw) + 0.15;
        const tint = land ? '#ffe08a' : '#c0504a';
        return (
          <group>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}
              onPointerMove={(e) => {
                const px = (e.point.x + MAP_W / 2) / PIXEL_TO_WORLD;
                const py = (e.point.z + MAP_D / 2) / PIXEL_TO_WORLD;
                // 遭遇預告 — re-sweep only when the drop CELL changes (the
                // day-sweep walks every march's route; too dear per move).
                const cell = geoHexAt(px, py);
                const cellKey = `${cell.col},${cell.row}`;
                if (cellKey !== dragCellRef.current) {
                  dragCellRef.current = cellKey;
                  const live = useGameStore.getState();
                  const myCmd = live.pendingCommands[dragMarch.id];
                  let forecast: { day: number; foeZh: string; foeEn: string } | null = null;
                  if (myCmd?.type === 'march') {
                    const myArmy = live.armies[dragMarch.id];
                    const srcC = live.cities[myCmd.cityId];
                    const sp2 = srcC ? cityPos(srcC) : null;
                    const dist = sp2 ? Math.hypot(px - sp2.x, py - sp2.y) : 0;
                    const total = dist < 100 ? 1 : dist < 195 ? 2 : dist < 275 ? 3 : 4;
                    const remaining = Math.max(1, Math.ceil((1 - (myArmy?.progress ?? 0)) * total));
                    const trial = { ...myCmd, targetX: px, targetY: py, holding: false, totalSeasons: total, seasonsRemaining: remaining };
                    const others = Object.values(live.pendingCommands)
                      .filter((c): c is typeof myCmd => c.type === 'march' && c.officerId !== myCmd.officerId)
                      // 設伏不入卦 — a hidden enemy ambush must not leak through the
                      // forecast; you find out when you blunder into it (unless
                      // your scouts already flushed it — then it forecasts).
                      .filter((c) => !(c.holding && c.ambush && live.officers[c.officerId]?.forceId !== live.playerForceId
                        && !(live.spottedAmbushIds ?? []).includes(c.officerId)));
                    const contacts = computeDayEncounters([trial, ...others], live.officers, live.cities, live.diplomacy);
                    const mine = contacts.find((c) => c.a.officerId === myCmd.officerId || c.b.officerId === myCmd.officerId);
                    if (mine) {
                      const foeId = mine.a.officerId === myCmd.officerId ? mine.b.officerId : mine.a.officerId;
                      const foe = live.officers[foeId];
                      forecast = { day: Math.max(1, mine.day), foeZh: foe?.name.zh ?? '敵軍', foeEn: foe?.name.en ?? 'enemy' };
                    }
                  }
                  setDragMarch((d) => (d ? { ...d, px, py, forecast } : d));
                  return;
                }
                setDragMarch((d) => (d ? { ...d, px, py } : d));
              }}
              onPointerUp={(e) => { e.stopPropagation(); endDrag(true); }}
            >
              <planeGeometry args={[MAP_W * 2.2, MAP_D * 2.2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Line points={[[ax, ay, az], [txw, ty + 0.25, tzw]]} color={tint} lineWidth={2} dashed dashSize={0.4} gapSize={0.25} />
            <mesh position={[txw, ty, tzw]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.72, 32]} />
              <meshBasicMaterial color={tint} transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <Html position={[txw, ty + 0.9, tzw]} center distanceFactor={10} zIndexRange={[46, 36]} style={{ pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(18,12,6,0.92)', border: `1px solid ${dragMarch.forecast ? '#e0552a' : tint}`, borderRadius: 'var(--tkm-radius-xs)', padding: '1px 7px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px', color: land ? '#ffe9a8' : '#f0b0a0', whiteSpace: 'nowrap' }}>
                {land ? `${t('進駐此地', 'March here')} · ${eta}${t('旬', ' turn(s)')}` : t('不可入水', 'Water — no landing')}
                {land && dragMarch.forecast && (
                  <div style={{ color: '#ff9c7a' }}>
                    ⚠ {t(`第${dragMarch.forecast.day}日遇 ${dragMarch.forecast.foeZh}`, `Day ${dragMarch.forecast.day}: meets ${dragMarch.forecast.foeEn}`)}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })()}
      <Convoys cities={cities} convoys={convoysState} forces={forces} />
      <Envoys cities={cities} expeditions={expeditionsState} forces={forces} />
      {overlayMode === 'supply' && <SupplyLines3D />}
      {/* 糧道總覽 — the supply overlay also lights EVERY long-range column's
          corridor at once (cut ones flag red), not just the selected army:
          the whole logistics picture in one keypress. */}
      {overlayMode === 'supply' && Object.values(armiesState)
        .filter((a) => a.forceId === playerForceId && a.id !== selectedArmyId3D)
        .map((a) => <SupplyCorridor3D key={`sup-${a.id}`} armyId={a.id} />)}
      {overlayMode === 'diplomacy' && <DiplomacyLines3D cities={cities} forces={forces} />}
      {overlayMode === 'intent' && <IntentLayer cities={cities} forces={forces} armies={armiesState} playerForceId={playerForceId} fog={fog} />}
      <FieldBattleMarks3D marks={fieldBattleMarks} />
      <FieldClashMelee3D marks={fieldBattleMarks} />
      <IgnitionDust3D />
      <QueuedBattles3D />
      <DayEncounterMarks3D />
      <BeaconAlerts3D />
      {/* 長圍 — invested cities wear a pulsing amber noose. */}
      <SiegeRings3D />
      <BurningCities3D />
      <EventMarks3D cities={cities} hidePx={battleSitePx} visibleCityIds={fog?.visibleCityIds ?? null} onPick={(id) => selectCity(id)} />
      <Ports3D onPortClick={onPortClick} />
      <Forts3D onFortClick={onFortClick} hideNearPx={battleSitePx} />
      <Tribes3D onTribeClick={onTribeClick} />
      <WildSites3D onSiteClick={onSiteClick} />
      <ScenicSites3D onScenicClick={onScenicClick} />
      <TradeRouteLines3D cities={cities} />
      <GeoLabels3D />
      <EspionageAgents3D cities={cities} />
      <DepartureFlourish3D />
      <ConquestFlourish3D />
      <LossFlourish3D />

      {/* 戰場微縮 — the LIVE battle, embedded on the very ground it's fought
          over (same scene component, same state; rotated to its true bearing,
          anchored on its geoAnchor column). Tap to enter the fullscreen view. */}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const ga = tacticalBattle.geoAnchor;
        // P3 圖上開戰 — the battle renders 1:1 ON the world lattice: the same
        // battleWindow() that cut the board out of the map now puts it back,
        // cell-for-cell (flip mirrors east-approach boards; no rotation).
        const win = battleWindow(ga, tacticalBattle.width, tacticalBattle.height);
        const apx = geoHexCenter(win.anchor.col, win.anchor.row);
        const [bwx, bwz] = pxToWorld(apx.x, apx.y);
        const by = sampleTerrainHeight(bwx, bwz) + 0.12;
        const S = HEXW_R; // canonical cell size — board hex = world hex
        const [acx, acz] = battleHexWorld(win.anchorCol, win.anchorRow);
        const [bcx, bcz] = battleHexWorld(
          Math.floor(tacticalBattle.width / 2),
          Math.floor(tacticalBattle.height / 2),
        );
        const pSide = tacticalBattle.attackerForceId === playerForceId ? 'attacker' as const
          : tacticalBattle.defenderForceId === playerForceId ? 'defender' as const : null;
        return (
          <group position={[bwx, by, bwz]} scale={[win.flip * S, S, S]}>
            <group position={[-acx, 0, -acz]}>
              {/* Dark plinth so the board reads cleanly over sloped terrain */}
              <mesh position={[bcx, -0.7, bcz]} receiveShadow>
                <boxGeometry args={[tacticalBattle.width * 1.5 + 3, 1.3, tacticalBattle.height * Math.sqrt(3) + 3]} />
                <meshStandardMaterial color="#241c12" roughness={0.95} />
              </mesh>
              <BattleScene
                embedded
                battle={tacticalBattle}
                playerSide={pSide}
                actionMode={dioCast && dioSelectedId
                  ? { kind: 'stratagem', id: dioCast.id, tacticId: dioCast.tacticId }
                  : dioSelectedId ? { kind: dioMode } : { kind: 'none' }}
                selectedId={dioSelectedId}
                hovered={dioHover}
                setHovered={onDioHover}
                onTileClick={onDioramaTile}
                attackArcs={dioArcs}
                stratagemFx={dioFx}
                officers={officers}
              />
            </group>
          </group>
        );
      })()}
      {showDiorama && tacticalBattle?.geoAnchor && (() => {
        const [bwx, bwz] = pxToWorld(tacticalBattle.geoAnchor.x, tacticalBattle.geoAnchor.y);
        const by = sampleTerrainHeight(bwx, bwz);
        return (
          <Html position={[bwx, by + 1.15, bwz]} center distanceFactor={10} zIndexRange={[60, 50]}>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: 'rgba(26, 16, 10, 0.92)', color: '#f0d98a',
                border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-xs)',
                padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '13px',
                letterSpacing: '1px', whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(212,168,74,0.45)',
              }}
            >
              ⚔ 戰鬥進行中 · 第{tacticalBattle.turn}回 ▸ 進入
            </button>
          </Html>
        );
      })()}

      {Object.values(cities).map((city) => {
        const force = forces[city.ownerForceId ?? ''];
        const color = force?.color ?? NEUTRAL;
        const [px, py] = cityPixel(city.id, city.coords.x, city.coords.y);
        // The battle diorama replaces the local scenery — a besieged city's
        // walls are ON the board, so the giant token underneath would clash.
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const terrainY = cityElevation(wx, wz);
        return (
          <group
            key={city.id}
            onPointerOver={(e) => { e.stopPropagation(); setHoverCityId(city.id); }}
            onPointerOut={() => setHoverCityId((cur) => (cur === city.id ? null : cur))}
          >
            <City3D
              city={city}
              forceColor={color}
              isCapital={capitalCityIds.has(city.id)}
              isSelected={selectedCityId === city.id}
              terrainY={terrainY}
              development={devByCity[city.id] ?? 0}
              isOwn={!!playerForceId && city.ownerForceId === playerForceId}
              overlay={fog && city.ownerForceId !== playerForceId && !fog.visibleCityIds.has(city.id)
                ? (overlayMode === 'none' ? null : FOG_OVERLAY)
                : overlayMode === 'threat' ? (threatOverlays[city.id] ?? null) : overlayForCity(city, overlayMode, maxes)}
              onClick={() => {
                // RTS-style: with an army selected, clicking a city re-routes
                // the column there (the 2D map used to own this interaction).
                if (selectedArmyId3D && redirectArmy(selectedArmyId3D, city.id)) {
                  selectArmy(null);
                  return;
                }
                if (selectedCityId === city.id) openCityMap();
                else selectCity(city.id);
              }}
            />
            <CityDefenseRing city={city} wx={wx} wz={wz} terrainY={terrainY} />
          </group>
        );
      })}

      {/* 城市快捷輪盤 — quick actions fanned around the selected city. */}
      {selectedCityId && cities[selectedCityId] && (() => {
        const c = cities[selectedCityId]!;
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        if (battleSitePx && Math.hypot(px - battleSitePx.x, py - battleSitePx.y) < 50) return null;
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 0.55, wz]} center distanceFactor={9} zIndexRange={[44, 34]}>
            <CityQuickRing
              key={c.id}
              own={c.ownerForceId === playerForceId}
              onEnter={() => openCityMap()}
              onMarch={() => onQuickAction('march', c.id)}
              onRecruit={() => onQuickAction('recruit', c.id)}
              onMuster={() => onQuickAction('muster', c.id)}
            />
          </Html>
        );
      })()}

      {/* 可達範圍 — with a column selected, concentric rings mark how far
          1/2/3 旬 of marching reach (the same geo thresholds the move order
          uses, centred on the column's source city like the order math). */}
      {selectedArmyId3D && armiesState[selectedArmyId3D] && cities[armiesState[selectedArmyId3D]!.fromCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const sp = cityPos(src);
        const [wx, wz] = pxToWorld(sp.x, sp.y);
        const rings = [
          { rpx: 100, zh: t('1旬', '1 wk') },
          { rpx: 195, zh: t('2旬', '2 wk') },
          { rpx: 275, zh: t('3旬', '3 wk') },
        ];
        return (
          <group>
            {rings.map((r, i) => (
              <mesh key={i} position={[wx, 0.1, wz]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
                <ringGeometry args={[r.rpx * PIXEL_TO_WORLD - 0.045, r.rpx * PIXEL_TO_WORLD + 0.045, 96]} />
                <meshBasicMaterial color="#f0d98a" transparent opacity={0.42 - i * 0.1} depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
            {rings.map((r, i) => (
              <Html key={`l${i}`} position={[wx + r.rpx * PIXEL_TO_WORLD * 0.7071, 0.25, wz - r.rpx * PIXEL_TO_WORLD * 0.7071]} center distanceFactor={11} zIndexRange={[26, 16]} style={{ pointerEvents: 'none' }}>
                <div style={{
                  background: 'rgba(20,14,8,0.82)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)',
                  padding: '0 5px', fontFamily: 'var(--tkm-font-body)', fontSize: 10, color: '#f0d98a',
                  whiteSpace: 'nowrap',
                }}>{r.zh}</div>
              </Html>
            ))}
          </group>
        );
      })()}

      {/* 行軍時距環 — a selected column shows its march-time bands. */}
      {selectedArmyId3D && armiesState[selectedArmyId3D]
        && cities[armiesState[selectedArmyId3D]!.fromCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const [cx, cy] = cityPixel(src.id, src.coords.x, src.coords.y);
        return <MarchRangeRings cx={cx} cy={cy} />;
      })()}

      {/* 改道測距 — column selected + hovering a city: how long the redirect
          would take from the column's source (the order's own math). */}
      {selectedArmyId3D && hoverCityId && armiesState[selectedArmyId3D]
        && cities[armiesState[selectedArmyId3D]!.fromCityId] && cities[hoverCityId] && (() => {
        const src = cities[armiesState[selectedArmyId3D]!.fromCityId]!;
        const to = cities[hoverCityId]!;
        if (to.id === src.id) return null;
        const ticks = marchDurationFor(src, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        // 遭遇預告 — the same day-sweep the drag ghost runs: would THIS
        // redirect walk into a hostile column, and on which day?
        const live = useGameStore.getState();
        const myCmd = live.pendingCommands[selectedArmyId3D];
        let fc: { day: number; foe: string } | null = null;
        if (myCmd?.type === 'march') {
          const myArmy = live.armies[selectedArmyId3D];
          const remaining = Math.max(1, Math.ceil((1 - (myArmy?.progress ?? 0)) * ticks));
          const trial = { ...myCmd, targetCityId: to.id, targetX: undefined, targetY: undefined, holding: false, totalSeasons: ticks, seasonsRemaining: remaining };
          const others = Object.values(live.pendingCommands)
            .filter((c): c is typeof myCmd => c.type === 'march' && c.officerId !== myCmd.officerId)
            .filter((c) => !(c.holding && c.ambush && live.officers[c.officerId]?.forceId !== live.playerForceId
              && !(live.spottedAmbushIds ?? []).includes(c.officerId)));
          const mine = computeDayEncounters([trial, ...others], live.officers, live.cities, live.diplomacy)
            .find((c) => c.a.officerId === myCmd.officerId || c.b.officerId === myCmd.officerId);
          if (mine) {
            const foeId = mine.a.officerId === myCmd.officerId ? mine.b.officerId : mine.a.officerId;
            const foe = live.officers[foeId];
            fc = { day: Math.max(1, mine.day), foe: foe ? pickName(foe.name, lang) : '?' };
          }
        }
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: `1px solid ${fc ? '#e0552a' : '#f0d98a'}`, borderRadius: 'var(--tkm-radius-xs)',
              padding: '2px 8px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              {t('改道 → ', 'Reroute → ')}{pickName(to.name, lang)}{t(` · 約 ${ticks} 旬`, ` · ~${ticks} wk`)}
              {fc && (
                <div style={{ color: '#ff9c7a' }}>⚠ {t(`第${fc.day}日遇 ${fc.foe}`, `Day ${fc.day}: meets ${fc.foe}`)}</div>
              )}
            </div>
          </Html>
        );
      })()}

      {/* 行程測距 — selected → hovered march time, in the same 旬 the end-turn
          button counts in. */}
      {!selectedArmyId3D && selectedCityId && hoverCityId && hoverCityId !== selectedCityId
        && cities[selectedCityId] && cities[hoverCityId] && (() => {
        const from = cities[selectedCityId]!;
        const to = cities[hoverCityId]!;
        const ticks = marchDurationFor(from, to, season);
        const [px, py] = cityPixel(to.id, to.coords.x, to.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        return (
          <Html position={[wx, y + 1.35, wz]} center distanceFactor={9} zIndexRange={[42, 32]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(20,14,8,0.9)', border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-xs)',
              padding: '2px 8px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#f0d98a', whiteSpace: 'nowrap', letterSpacing: '1px',
            }}>
              {pickName(from.name, lang)} → {pickName(to.name, lang)}{t(` · 行軍約 ${ticks} 旬`, ` · march ~${ticks} wk`)}
            </div>
          </Html>
        );
      })()}

      {/* 懸停快覽 — hovering a city (desktop) cards its owner + troops/food,
          unless a march/redirect distance preview is already on it. Fogged
          enemy cities show name only. */}
      {!IS_MOBILE && hoverCityId && cities[hoverCityId]
        && !(selectedArmyId3D && armiesState[selectedArmyId3D])
        && !(selectedCityId && hoverCityId !== selectedCityId) && (() => {
        const c = cities[hoverCityId]!;
        const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
        const fogged = !!fog && c.ownerForceId !== playerForceId && !fog.visibleCityIds.has(c.id);
        const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
        const [wx, wz] = pxToWorld(px, py);
        const y = cityElevation(wx, wz);
        const fmt = (n: number) => Math.round(n).toLocaleString();
        return (
          <Html position={[wx, y + 1.75, wz]} center distanceFactor={9} zIndexRange={[43, 33]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(18,12,6,0.92)', border: '1px solid #6a5230', borderRadius: 'var(--tkm-radius-sm)',
              padding: '3px 9px', fontFamily: 'var(--tkm-font-body)', fontSize: '11px',
              color: '#e7d6ad', whiteSpace: 'nowrap', lineHeight: 1.5, boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>
                {pickName(c.name, lang)}
                <span style={{ color: owner?.color ?? '#8a7a58', marginLeft: 6, fontWeight: 'normal' }}>
                  {owner ? pickName(owner.name, lang) : t('中立', 'Neutral')}
                </span>
              </div>
              {fogged
                ? <div style={{ color: '#9a8a66' }}>{t('情報不足', 'No intel')}</div>
                : <div>{t('兵 ', 'Troops ')}{fmt(c.troops)} · {t('糧 ', 'Food ')}{fmt(c.food)}</div>}
            </div>
          </Html>
        );
      })()}
    </>
  );
}

/* ─── 城市快捷輪盤 — radial quick actions on the selected city ──────────
   Own city: 進城 / 出陣 / 徵兵 fan out around the token — the three things
   you actually do every turn, one tap instead of a trip through the city
   screen. Hostile city: a single 全軍集結 button (armed by a first tap so
   a stray click can't commit the whole realm to war). */
function CityQuickRing({ own, onEnter, onMarch, onRecruit, onMuster }: {
  own: boolean;
  onEnter: () => void;
  onMarch: () => void;
  onRecruit: () => void;
  onMuster: () => void;
}) {
  const t = useT();

  const radial = (emoji: string, zh: string, en: string, deg: number, onClick: () => void) => {
    const rad = (deg * Math.PI) / 180;
    const R = 54;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          position: 'absolute',
          left: Math.cos(rad) * R - 23,
          top: -Math.sin(rad) * R - 23,
          width: 46, height: 46, borderRadius: '50%',
          background: 'rgba(20,14,8,0.92)', border: '1px solid #d4a84a',
          color: '#f0e0b0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1, padding: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
        }}
        title={t(zh, en)}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 9, letterSpacing: 1 }}>{t(zh, en)}</span>
      </button>
    );
  };

  if (!own) {
    // Enemy city — opens the muster planner (preview + options + confirm).
    return (
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onMuster(); }}
          style={{
            position: 'absolute', left: -62, top: -76, width: 124,
            background: 'rgba(20,14,8,0.92)', border: '1px solid #b8584a',
            color: '#e8b0a0', cursor: 'pointer',
            fontFamily: 'var(--tkm-font-body)', fontSize: 12, letterSpacing: 2,
            padding: '0.32rem 0', borderRadius: 'var(--tkm-radius-sm)', boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
            whiteSpace: 'nowrap',
          }}
        >{t('🚩 全軍集結', '🚩 Mass muster')}</button>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: 0, height: 0 }}>
      {radial('⛩', '進城', 'Enter', 150, onEnter)}
      {radial('⚔', '出陣', 'March', 90, onMarch)}
      {radial('👥', '徵兵', 'Recruit', 30, onRecruit)}
      {/* 勤王 — rally the realm to reinforce this own city. */}
      {radial('🚩', '集結', 'Muster', 210, onMuster)}
    </div>
  );
}

/* ─── 城市搜索 — type a name (漢字或拼音), fly there ───────────────────
   Ninety-odd cities is too many to hunt by eye in the late game. Matches
   against zh names and the pinyin-ish en names; Enter takes the first
   match, click takes any. Jumping reuses the locator's camera path and
   selects the city so its panel opens on arrival. */
function CitySearchBox({ onJump, compact }: {
  onJump: (cityId: string, px: number, py: number) => void;
  /** 手機 — collapse to a 🔍 button; the input only exists while open, so
   *  it can't sit on top of the map chrome. */
  compact?: boolean;
}) {
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const t = useT();
  const lang = useLanguage();
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return Object.values(cities)
      .filter((c) => c.name.zh.includes(q.trim()) || c.name.en.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [cities, q]);
  const jump = (c: City) => {
    const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
    onJump(c.id, px, py);
    setQ('');
    setOpen(false);
  };
  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={t('尋城', 'Find city')}
      >🔍</button>
    );
  }
  return (
    <div style={{ position: 'relative', fontFamily: 'var(--tkm-font-body)', display: 'flex', gap: 4 }}>
      {compact && (
        <button
          onClick={() => { setOpen(false); setQ(''); }}
          style={{
            width: 30, background: 'rgba(20, 14, 8, 0.88)', color: '#c0a878',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', cursor: 'pointer', fontSize: 13, order: 2,
          }}
        >✕</button>
      )}
      <input
        autoFocus={compact}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) jump(matches[0]);
          if (e.key === 'Escape') setQ('');
          e.stopPropagation(); // keep typing out of the map hotkeys
        }}
        placeholder={t('🔍 尋城(漢字/拼音)', '🔍 Find city')}
        style={{
          width: compact ? 'min(56vw, 210px)' : 138,
          background: 'rgba(20, 14, 8, 0.88)', color: '#e8d9b0',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.5rem', outline: 'none',
          fontFamily: 'inherit', fontSize: '0.75rem',
        }}
      />
      {matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 2, minWidth: 170,
          background: 'rgba(20, 14, 8, 0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)', zIndex: 30,
        }}>
          {matches.map((c) => {
            const owner = c.ownerForceId ? forces[c.ownerForceId] : null;
            return (
              <div
                key={c.id}
                onClick={() => jump(c)}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: 10, cursor: 'pointer',
                  padding: '0.3rem 0.55rem', fontSize: '0.78rem', color: '#e8d9b0',
                  borderBottom: '1px solid #2a2014',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,168,74,0.14)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span>{pickName(c.name, lang)}</span>
                <span style={{ color: owner?.color ?? '#6a6050', fontSize: '0.7rem' }}>
                  {owner ? pickName(owner.name, lang) : t('無主', 'free')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Top-level component ─────────────────────────────────── */
const OVERLAY_OPTIONS: Array<{ id: OverlayMode; zh: string; en: string }> = [
  { id: 'none',     zh: '關閉', en: 'OFF' },
  { id: 'gold',     zh: '金錢', en: 'GOLD' },
  { id: 'food',     zh: '糧草', en: 'FOOD' },
  { id: 'troops',   zh: '兵力', en: 'TROOPS' },
  { id: 'loyalty',  zh: '民忠', en: 'LOYALTY' },
  { id: 'province', zh: '州郡', en: 'PROVINCE' },
  { id: 'specialty', zh: '名產', en: 'GOODS' },
  { id: 'supply',   zh: '糧道', en: 'SUPPLY' },
  { id: 'diplomacy', zh: '邦交', en: 'TIES' },
  { id: 'threat',   zh: '威脅', en: 'THREAT' },
  { id: 'intent',   zh: '兵鋒', en: 'INTENT' },
];

const WEATHER_ZH: Record<WeatherKind, string> = {
  clear: '☀ 晴', rain: '☂ 雨', snow: '❄ 雪', wind: '🌀 風', drought: '☼ 旱',
};
const SEASON_ZH: Record<Season, string> = {
  spring: '春', summer: '夏', autumn: '秋', winter: '冬',
};

/**
 * 軍令提示 — when one of the player's columns is selected, a bar spells out
 * what tapping each thing does (the orders existed, but nothing on screen
 * said so). Also the visible way to deselect.
 */
function ArmyOrdersHint() {
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const army = useGameStore((s) => (s.selectedArmyId ? s.armies[s.selectedArmyId] : null));
  const officers = useGameStore((s) => s.officers);
  const selectArmy = useGameStore((s) => s.selectArmy);
  // The in-place battle commander bar owns the bottom slot when up.
  const battleBarUp = useGameStore((s) => !!s.tacticalBattle && s.battleViewMinimized);
  const t = useT();
  const lang = useLanguage();
  if (!selectedArmyId || !army) return null;
  const commander = officers[army.commanderId];
  return (
    <div style={{
      position: 'absolute', bottom: battleBarUp ? 64 : 14, left: '50%', transform: 'translateX(-50%)',
      zIndex: 12, display: 'flex', alignItems: 'center', gap: '0.6rem',
      background: 'rgba(20, 14, 8, 0.92)', border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-sm)',
      padding: '0.4rem 0.8rem', fontFamily: 'var(--tkm-font-body)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
      flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
    }}>
      <span style={{ color: '#f0d98a', letterSpacing: '0.1rem', fontSize: '0.85rem' }}>
        ⚑ {commander ? pickName(commander.name, lang) : '?'}{t('部', '')} {army.troops.toLocaleString()}{t('兵', '')}
      </span>
      <span style={{ color: '#8a7050', fontSize: '0.72rem', letterSpacing: '0.05rem' }}>
        {t('點城市:改道 · 點空地:進駐 · 點友軍:合流 · 點敵軍:野戰',
           'Tap city: redirect · ground: dig in · ally: merge · enemy: engage')}
      </span>
      <button
        onClick={() => selectArmy(null)}
        style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', color: '#c0a878',
          padding: '0.15rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem',
        }}
      >✕ {t('取消', 'Cancel')}</button>
    </div>
  );
}

/**
 * 戰場引燃 — when a battle ignites, fly the world camera down to the clash
 * site (its geoAnchor) BEFORE the battle screen drops over the map, and leave
 * it there so the post-battle reveal shows the scar you made. One continuous
 * camera line: world → battle → world.
 */
function BattleFocusFly({ controlsRef, onSettled }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onSettled: (target: [number, number, number]) => void;
}) {
  const { camera } = useThree();
  const geoAnchor = useGameStore((s) => s.tacticalBattle?.geoAnchor ?? null);
  const anim = useRef<null | {
    from: THREE.Vector3; to: THREE.Vector3;
    fromT: THREE.Vector3; toT: THREE.Vector3; t: number;
  }>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!geoAnchor) { lastKey.current = null; return; }
    const key = `${Math.round(geoAnchor.x)},${Math.round(geoAnchor.y)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const [wx, wz] = pxToWorld(geoAnchor.x, geoAnchor.y);
    const h = sampleTerrainHeight(wx, wz);
    anim.current = {
      from: camera.position.clone(),
      to: new THREE.Vector3(wx, h + 2.8, wz + 2.3),
      fromT: controlsRef.current?.target.clone() ?? new THREE.Vector3(0, 0, 0),
      toT: new THREE.Vector3(wx, h, wz),
      t: 0,
    };
  }, [geoAnchor, camera, controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    const ctrl = controlsRef.current;
    if (ctrl) ctrl.enabled = false;
    a.t = Math.min(1, a.t + delta / 0.85);
    const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2; // easeInOutQuad
    camera.position.lerpVectors(a.from, a.to, e);
    if (ctrl) {
      ctrl.target.lerpVectors(a.fromT, a.toT, e);
      ctrl.update();
    }
    if (a.t >= 1) {
      anim.current = null;
      if (ctrl) ctrl.enabled = true;
      onSettled([a.toT.x, a.toT.y, a.toT.z]);
    }
  });
  return null;
}

/* ─── 大事飛鏡 — a cinematic sweep when a city changes hands ───────────
   When YOU take a city (cityCaptured) or lose one (cityLost), the camera
   dives to it and slowly arcs around the newly-won (or newly-burning) walls
   before handing control back — a beat that makes a conquest *feel* like one.
   Battle ignitions keep their own fly (BattleFocusFly); this defers to them,
   and honours prefers-reduced-motion. */
function EventFocusFly({ controlsRef, onSettled }: {
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  onSettled: (target: [number, number, number]) => void;
}) {
  const { camera } = useThree();
  const capturedKey = useGameStore((s) => s.cityCaptured?.key ?? 0);
  const lostKey = useGameStore((s) => s.cityLost?.key ?? 0);
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
  const seen = useRef<{ cap: number; lost: number }>({ cap: capturedKey, lost: lostKey });
  const anim = useRef<null | {
    from: THREE.Vector3; orbitCenter: THREE.Vector3; radius: number;
    ang0: number; ang1: number; height: number;
    fromT: THREE.Vector3; toT: THREE.Vector3; t: number;
  }>(null);

  useEffect(() => {
    // Battle fly owns the camera while a fight is live; just keep our markers
    // current so we don't replay the move the instant the battle clears.
    if (battleActive) { seen.current = { cap: capturedKey, lost: lostKey }; return; }
    const capBumped = capturedKey !== seen.current.cap;
    const lostBumped = lostKey !== seen.current.lost;
    if (!capBumped && !lostBumped) return;
    seen.current = { cap: capturedKey, lost: lostKey };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const st = useGameStore.getState();
    const cityId = capBumped ? st.cityCaptured?.cityId : st.cityLost?.cityId;
    const city = cityId ? st.cities[cityId] : null;
    if (!city) return;
    const [wx, wz] = pxToWorld(...cityPixel(city.id, city.coords.x, city.coords.y));
    const h = sampleTerrainHeight(wx, wz);
    const ang0 = Math.PI * 0.28;
    anim.current = {
      from: camera.position.clone(),
      orbitCenter: new THREE.Vector3(wx, h, wz),
      radius: 3.2, ang0, ang1: ang0 + 0.95, height: h + 2.9,
      fromT: controlsRef.current?.target.clone() ?? new THREE.Vector3(0, 0, 0),
      toT: new THREE.Vector3(wx, h, wz),
      t: 0,
    };
  }, [capturedKey, lostKey, battleActive, camera, controlsRef]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a) return;
    const ctrl = controlsRef.current;
    if (ctrl) ctrl.enabled = false;
    a.t = Math.min(1, a.t + delta / 2.1);          // ~2.1s: dive then slow arc
    const FLY = 0.45;
    if (a.t < FLY) {
      const e = a.t / FLY;
      const ease = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
      const start = new THREE.Vector3(
        a.orbitCenter.x + Math.cos(a.ang0) * a.radius, a.height, a.orbitCenter.z + Math.sin(a.ang0) * a.radius);
      camera.position.lerpVectors(a.from, start, ease);
      if (ctrl) { ctrl.target.lerpVectors(a.fromT, a.toT, ease); ctrl.update(); }
    } else {
      const e = (a.t - FLY) / (1 - FLY);
      const ang = a.ang0 + (a.ang1 - a.ang0) * e;
      camera.position.set(
        a.orbitCenter.x + Math.cos(ang) * a.radius, a.height, a.orbitCenter.z + Math.sin(ang) * a.radius);
      if (ctrl) { ctrl.target.copy(a.toT); ctrl.update(); }
    }
    if (a.t >= 1) {
      anim.current = null;
      if (ctrl) ctrl.enabled = true;
      onSettled([a.toT.x, a.toT.y, a.toT.z]);
    }
  });
  return null;
}

/* ─── 戰役回放 — record one territory snapshot per season (headless) ───── */
function ReplayRecorder() {
  const dateSig = useGameStore((s) => `${s.date.year}-${s.date.season}-${s.date.phase}`);
  useEffect(() => {
    const st = useGameStore.getState();
    const owners: Record<string, string | null> = {};
    for (const c of Object.values(st.cities)) owners[c.id] = c.ownerForceId ?? null;
    const colors: Record<string, string> = {};
    for (const f of Object.values(st.forces)) colors[f.id] = f.color;
    const ph = st.date.phase === 'lower' ? '下' : st.date.phase === 'middle' ? '中' : '上';
    const label = `${st.date.year} ${SEASON_ZH[st.date.season as Season]}${ph}`;
    useReplayStore.getState().record({ label, owners }, colors);
  }, [dateSig]);
  return null;
}

/* ─── 戰役回放面板 — scrub / play the campaign's territory timelapse ───── */
function ReplayPanel({ onClose }: { onClose: () => void }) {
  const snapshots = useReplayStore((s) => s.snapshots);
  const colors = useReplayStore((s) => s.colors);
  const cities = useGameStore((s) => s.cities);
  const t = useT();
  const maxIdx = Math.max(0, snapshots.length - 1);
  const [idx, setIdx] = useState(maxIdx);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cur = Math.min(idx, maxIdx);

  useEffect(() => {
    if (!playing) return;
    const h = window.setInterval(() => {
      setIdx((i) => { if (i >= maxIdx) { setPlaying(false); return maxIdx; } return i + 1; });
    }, 300);
    return () => window.clearInterval(h);
  }, [playing, maxIdx]);

  useEffect(() => {
    const snap = snapshots[cur];
    const canvas = canvasRef.current;
    if (!snap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const src = renderTerritorySnapshot(cities, snap.owners, colors);
    ctx.fillStyle = '#0e0a06';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  }, [cur, snapshots, cities, colors]);

  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (cur >= maxIdx) setIdx(0);    // at the end → replay from the start
    setPlaying(true);
  };

  const cw = IS_MOBILE ? 320 : 520;
  const ch = Math.round((cw * 720) / 1000);

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(8,5,2,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #1c1409 0%, #120c06 100%)',
        border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-lg)', padding: '0.9rem 1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)', maxWidth: '94vw',
        fontFamily: 'var(--tkm-font-body)', color: '#d8c4a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 'bold', letterSpacing: '0.08rem' }}>🎞 {t('戰役回放', 'Campaign Timelapse')}</div>
          <button onClick={onClose} style={{
            background: 'transparent', color: '#a89070', border: '1px solid #5a4530',
            borderRadius: 'var(--tkm-radius)', cursor: 'pointer', padding: '0.15rem 0.5rem', fontSize: '0.8rem',
          }}>✕</button>
        </div>
        {snapshots.length === 0 ? (
          <div style={{ width: cw, padding: '2rem 0', textAlign: 'center', color: '#8a7858' }}>
            {t('尚無記錄 — 推進幾季後即可回放天下消長。', 'No history yet — advance a few seasons to build the timelapse.')}
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} width={cw} height={ch} style={{
              width: cw, height: ch, borderRadius: 'var(--tkm-radius)', border: '1px solid #3a2c18', display: 'block', background: '#0e0a06',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button onClick={togglePlay} style={{
                background: '#d4a84a', color: '#1a1410', border: 'none', borderRadius: 'var(--tkm-radius)',
                cursor: 'pointer', padding: '0.3rem 0.7rem', fontWeight: 'bold', fontSize: '0.85rem', minWidth: 64,
              }}>{playing ? t('⏸ 暫停', '⏸ Pause') : t('▶ 播放', '▶ Play')}</button>
              <input type="range" min={0} max={maxIdx} value={cur}
                onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
                style={{ flex: 1, accentColor: '#d4a84a', cursor: 'pointer' }} />
              <div style={{ minWidth: 86, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', color: '#e0c98a' }}>
                {snapshots[cur]?.label ?? ''}
              </div>
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: '#7a6a4a', textAlign: 'right' }}>
              {cur + 1} / {snapshots.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const GROUND_UP = new THREE.Vector3(0, 1, 0);
type CamApi = {
  zoomBy: (factor: number) => void;
  recenter: () => void;
  /** Fly to a ground point. dist = fixed focus distance (idle-jump); omit for
   *  the progressive "zoom in a notch" double-click behaviour. */
  flyTo: (wx: number, wz: number, dist?: number) => void;
};

/* ─── 鏡頭 API — the map's one camera controller. Publishes imperative
   zoom / recenter / flyTo for the DOM buttons & double-click, and each frame
   applies held keyboard / screen-edge panning, then clamps the look-at point
   to the map. All of it sits OUTSIDE OrbitControls but inside the Canvas. ── */
function MapCamApi({ apiRef, controlsRef, panInputRef }: {
  apiRef: React.MutableRefObject<CamApi | null>;
  controlsRef: React.MutableRefObject<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>;
  panInputRef: React.MutableRefObject<{ x: number; z: number }>;
}) {
  const { camera } = useThree();
  // Active double-click fly — eased lerp of camera+target, owns the camera
  // until it settles.
  const fly = useRef<null | {
    t: number; dur: number;
    fromP: THREE.Vector3; toP: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3;
  }>(null);

  useEffect(() => {
    apiRef.current = {
      // factor < 1 zooms in, > 1 zooms out — scales the camera→target distance,
      // clamped to OrbitControls' OWN live min/max (read off the instance, so a
      // battle's closer 0.9 floor is honoured and '+' never jumps backward).
      zoomBy: (factor) => {
        fly.current = null;
        const ctrl = controlsRef.current as unknown as
          ({ target: THREE.Vector3; update: () => void; minDistance?: number; maxDistance?: number } | null);
        if (!ctrl) return;
        const offset = camera.position.clone().sub(ctrl.target);
        const min = ctrl.minDistance ?? 3;
        const max = ctrl.maxDistance ?? MAP_MAX_DIST;
        const dist = THREE.MathUtils.clamp(offset.length() * factor, min, max);
        camera.position.copy(ctrl.target).add(offset.setLength(dist));
        ctrl.update();
      },
      // Snap back to the opening overview (map centre, default height/angle).
      recenter: () => {
        fly.current = null;
        const ctrl = controlsRef.current;
        if (!ctrl) return;
        ctrl.target.set(0, 0, 0);
        camera.position.set(0, MAP_D * 0.9, MAP_D * 0.7);
        ctrl.update();
      },
      // 雙擊飛鏡 — ease the camera over the double-clicked point and zoom in a
      // notch, keeping the current viewing direction so it never disorients.
      flyTo: (wx, wz, dist) => {
        const ctrl = controlsRef.current as unknown as
          ({ target: THREE.Vector3; update: () => void; minDistance?: number } | null);
        if (!ctrl) return;
        const toT = new THREE.Vector3(wx, sampleTerrainHeight(wx, wz), wz);
        const dir = camera.position.clone().sub(ctrl.target);
        const curDist = dir.length() || 1;
        dir.normalize();
        const min = ctrl.minDistance ?? 3;
        // dist given (idle-jump → consistent city view); else zoom in a notch.
        const want = dist ?? Math.min(curDist * 0.55, MAP_D * 0.5);
        const focusDist = THREE.MathUtils.clamp(want, min, MAP_MAX_DIST);
        const toP = toT.clone().add(dir.multiplyScalar(focusDist));
        fly.current = { t: 0, dur: 0.5, fromP: camera.position.clone(), toP, fromT: ctrl.target.clone(), toT };
      },
    };
    return () => { apiRef.current = null; };
  }, [camera, apiRef, controlsRef]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    // dt is clamped — a long stall (tab backgrounded) shouldn't teleport.
    const dt = Math.min(delta, 0.05);

    // 1) A double-click fly takes over the camera until it lands.
    const a = fly.current;
    if (a) {
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
      camera.position.lerpVectors(a.fromP, a.toP, e);
      ctrl.target.lerpVectors(a.fromT, a.toT, e);
      ctrl.update();
      if (a.t >= 1) fly.current = null;
      return;
    }

    // 2) Held keyboard / screen-edge panning — glide target+camera across the
    //    ground plane, faster the further you're zoomed out.
    const inp = panInputRef.current;
    if (inp && (inp.x !== 0 || inp.z !== 0)) {
      const speed = camera.position.distanceTo(ctrl.target) * 0.6 * dt;
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() > 1e-6) {
        fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, GROUND_UP).normalize();
        const move = right.multiplyScalar(inp.x * speed).add(fwd.multiplyScalar(inp.z * speed));
        camera.position.add(move);
        ctrl.target.add(move);
        ctrl.update();
      }
    }

    // 3) 平移邊界 — keep the look-at point inside the map so a pan can't drag
    //    the land off into open water/sky. A pan moves target AND camera in
    //    lockstep, so we shift the camera by the same delta we clamp off the
    //    target — the view simply stops dead at the coastline. Target can still
    //    reach the very edge, so every coastal city can sit centre-screen.
    const t = ctrl.target;
    const cx = THREE.MathUtils.clamp(t.x, -MAP_W / 2, MAP_W / 2);
    const cz = THREE.MathUtils.clamp(t.z, -MAP_D / 2, MAP_D / 2);
    if (cx !== t.x || cz !== t.z) {
      camera.position.x += cx - t.x;
      camera.position.z += cz - t.z;
      t.x = cx;
      t.z = cz;
    }
  });
  return null;
}

/* ─── 操作說明 — a one-glance cheat-sheet for every map control, opened by the
   ? on the controls hint, so the many gestures/shortcuts stay discoverable. ─ */
function MapHelpPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const rows: Array<[string, string]> = IS_MOBILE
    ? [
        [t('單指拖曳', '1-finger drag'), t('平移地圖', 'pan the map')],
        [t('雙指捏合', 'pinch'), t('縮放(朝手指)', 'zoom toward fingers')],
        [t('雙指擰轉', '2-finger twist'), t('旋轉視角', 'rotate the view')],
        [t('輕點城市', 'tap a city'), t('選取 · 再點進城', 'select · tap again to enter')],
        [t('輕點空地', 'tap ground'), t('選軍時下令移動', 'move a selected column')],
        ['🔍 ＋－ ⌖ 🏯', t('尋城 / 縮放 / 復位 / 回都', 'search / zoom / recenter / capital')],
      ]
    : [
        [t('左鍵拖曳', 'left-drag'), t('平移地圖', 'pan the map')],
        [t('右鍵拖曳', 'right-drag'), t('旋轉視角', 'rotate the view')],
        [t('滾輪', 'scroll'), t('縮放(朝光標)', 'zoom toward cursor')],
        [t('雙擊空地', 'double-click ground'), t('飛近並放大', 'fly in + zoom')],
        [t('WASD / 方向鍵', 'WASD / arrows'), t('移動地圖', 'pan the map')],
        [t('滑鼠移到邊緣', 'mouse to edge'), t('滾屏', 'edge-scroll')],
        [t('點城市', 'click a city'), t('選取 · 再點進城', 'select · click again to enter')],
        ['1-9 / 0', t('切換疊圖', 'toggle overlays')],
        ['Tab', t('巡視自己的城', 'cycle your cities')],
        ['Home', t('回都城', 'jump to capital')],
        ['Esc', t('取消選取', 'clear selection')],
        ['＋－ ⌖ 🏯 🔍', t('縮放 / 復位 / 回都 / 尋城', 'zoom / recenter / capital / search')],
      ];
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: 'rgba(8,5,2,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, #1c1409 0%, #120c06 100%)',
        border: '1px solid #5a4530', borderRadius: 'var(--tkm-radius-lg)', padding: '1rem 1.2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)', maxWidth: '92vw', minWidth: 270,
        fontFamily: 'var(--tkm-font-body)', color: '#d8c4a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div style={{ fontWeight: 'bold', letterSpacing: '0.08rem' }}>🎮 {t('地圖操作', 'Map Controls')}</div>
          <button onClick={onClose} style={{
            background: 'transparent', color: '#a89070', border: '1px solid #5a4530',
            borderRadius: 'var(--tkm-radius)', cursor: 'pointer', padding: '0.15rem 0.5rem', fontSize: '0.8rem',
          }}>✕</button>
        </div>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={i}>
                <td style={{ padding: '3px 14px 3px 0', color: '#e0c98a', whiteSpace: 'nowrap', fontWeight: 600 }}>{k}</td>
                <td style={{ padding: '3px 0', color: '#bfae86' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StrategicMap3D() {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('none');
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedFortId, setSelectedFortId] = useState<string | null>(null);
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedScenicId, setSelectedScenicId] = useState<string | null>(null);
  const [showStockadeBuild, setShowStockadeBuild] = useState(false);
  // Orbit pivot — held as STATE (stable ref) so re-renders don't snap the
  // target back; BattleFocusFly animates it to a clash site, then locks it in.
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void; enabled: boolean } | null>(null);
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 0, 0]);
  // While a battle diorama is on the map, let the camera dive much closer.
  const battleActive = useGameStore((s) => !!s.tacticalBattle);
  // 標籤分級 — quantized camera distance, provided to City3D labels.
  const [zoomLod, setZoomLod] = useState<'near' | 'far'>('near');
  const tod = phaseToTOD(useGameStore((s) => s.date.phase));

  // 畫面復原 — WebGL context-loss guard. On a long session iOS WKWebView can
  // drop the GL context under GPU-memory pressure; three.js calls
  // preventDefault() (so the browser *may* restore it) and the continuous
  // render loop repaints once it does. But on a hard out-of-memory loss the
  // browser may never fire 'webglcontextrestored', leaving a permanently black
  // map. If no restore arrives within a short grace window we bump this epoch
  // to fully remount the <Canvas> with a brand-new GL context — the cached
  // terrain/normal/water textures simply re-upload into the fresh renderer.
  const [glEpoch, setGlEpoch] = useState(0);
  const glRestoreTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (glRestoreTimer.current != null) window.clearTimeout(glRestoreTimer.current);
  }, []);

  // 鏡頭按鈕橋接 — an in-Canvas rig (MapCamApi) publishes imperative zoom /
  // recenter / flyTo helpers here, so the DOM corner buttons (which live
  // outside the Canvas) and double-click can drive the camera without
  // re-implementing OrbitControls.
  const camApiRef = useRef<CamApi | null>(null);
  // 前往閒置武將 — the HUD's idle-officer button (outside the Canvas) asks the
  // map to fly to a city through this bus; we smooth-fly to a steady city view.
  useEffect(() => {
    setMapFocusHandler((cityId) => {
      const c = useGameStore.getState().cities[cityId];
      if (!c) return;
      const [px, py] = cityPixel(c.id, c.coords.x, c.coords.y);
      const [wx, wz] = pxToWorld(px, py);
      camApiRef.current?.flyTo(wx, wz, MAP_D * 0.45);
    });
    return () => setMapFocusHandler(null);
  }, []);
  // 跟拍 — while the day flow plays with follow enabled, glide the camera
  // after the player's lead marching column (largest troops). One flyTo per
  // day tick keeps the ride smooth without fighting manual panning between
  // ticks; the encounter auto-pause then lands with the camera on scene.
  const dfFollowOn = useGameStore((st) => (st.dayFlow ? st.dayFlowFollow : false));
  const dfDayForCam = useGameStore((st) => st.dayFlow?.day ?? -1);
  useEffect(() => {
    if (!dfFollowOn || dfDayForCam < 0) return;
    const live = useGameStore.getState();
    const pf = live.playerForceId;
    if (!pf) return;
    const marches = Object.values(live.pendingCommands).filter(
      (c): c is Extract<typeof c, { type: 'march' }> =>
        c.type === 'march' && !c.holding && live.officers[c.officerId]?.forceId === pf,
    );
    if (marches.length === 0) return;
    const lead = marches.reduce((a, b) => ((b.troops ?? 0) > (a.troops ?? 0) ? b : a));
    const pos = marchPositionAtDay(lead, live.cities, dfDayForCam);
    if (!pos) return;
    const [wx, wz] = pxToWorld(pos.x, pos.y);
    camApiRef.current?.flyTo(wx, wz);
  }, [dfFollowOn, dfDayForCam]);
  // 回都 — select the player's capital and fly to it (Home key + the 🏛 button).
  const jumpToCapital = () => {
    const st = useGameStore.getState();
    const cap = st.playerForceId ? st.forces[st.playerForceId]?.capitalCityId : null;
    if (!cap || !st.cities[cap]) return;
    st.selectCity(cap);
    requestMapFocus(cap);
  };
  // 羅盤朝向 — camera azimuth (deg), fed by an in-Canvas tracker; drives the
  // compass rose so 北 always points north even after you twist the view.
  const [heading, setHeading] = useState(0);

  // 開局取景 — once the map mounts, ease the camera from the default whole-map
  // overview onto YOUR realm (the bounding circle of your cities), so you open
  // looking at your own situation instead of the dead centre of the map.
  const framedRef = useRef(false);
  useEffect(() => {
    if (framedRef.current) return;
    const s = useGameStore.getState();
    const pid = s.playerForceId;
    if (!pid) return;
    const own = Object.values(s.cities).filter((c) => c.ownerForceId === pid);
    if (own.length === 0) return;
    const pts = own.map((c) => cityPixel(c.id, c.coords.x, c.coords.y));
    const ccx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const ccy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const maxR = pts.reduce((m, p) => Math.max(m, Math.hypot(p[0] - ccx, p[1] - ccy)), 0);
    const [wx, wz] = pxToWorld(ccx, ccy);
    const radiusWorld = (maxR + 120) * PIXEL_TO_WORLD;   // pad so cities sit off the very edge
    // Cap well below MAP_MAX_DIST — a realm spanning half of China (漢室
    // 39 城) would otherwise open at the fog wall and read as a blank wash.
    const fitDist = THREE.MathUtils.clamp(
      (radiusWorld / Math.sin((MAP_FOV_DEG / 2) * Math.PI / 180)) * 1.1, 45, 130);
    framedRef.current = true;
    let tries = 0;
    const tryFrame = () => {
      if (camApiRef.current) { camApiRef.current.flyTo(wx, wz, fitDist); return; }
      if (tries++ < 40) requestAnimationFrame(tryFrame);   // wait for the GL scene to mount
    };
    const id = window.setTimeout(() => requestAnimationFrame(tryFrame), 220);
    return () => window.clearTimeout(id);
  }, []);
  // 鍵盤 / 邊緣平移 — held-direction state (desktop only). MapCamApi reads the
  // combined {x,z} each frame; DOM listeners below keep the parts in sync.
  const panInputRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const heldKeysRef = useRef<Set<string>>(new Set());
  const edgePanRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  // Combine held keys + edge state into the {x,z} MapCamApi reads each frame.
  // Stored in a ref so both the keyboard and the edge-scroll effects share it.
  const recomputePanRef = useRef<() => void>(() => {});
  recomputePanRef.current = () => {
    const k = heldKeysRef.current, eg = edgePanRef.current;
    let x = eg.x, z = eg.z;
    if (k.has('left')) x -= 1;
    if (k.has('right')) x += 1;
    if (k.has('up')) z += 1;
    if (k.has('down')) z -= 1;
    panInputRef.current = { x: Math.max(-1, Math.min(1, x)), z: Math.max(-1, Math.min(1, z)) };
  };
  useEffect(() => {
    if (IS_MOBILE) return;   // touch users pan with a finger; no keys / edges
    const recompute = () => recomputePanRef.current();
    const dirOf = (key: string): string | null => {
      switch (key) {
        case 'w': case 'W': case 'ArrowUp': return 'up';
        case 's': case 'S': case 'ArrowDown': return 'down';
        case 'a': case 'A': case 'ArrowLeft': return 'left';
        case 'd': case 'D': case 'ArrowRight': return 'right';
        default: return null;
      }
    };
    const onDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dir = dirOf(e.key);
      if (!dir) return;
      if (e.key.startsWith('Arrow')) e.preventDefault();   // stop the page scrolling
      heldKeysRef.current.add(dir);
      recompute();
    };
    const onUp = (e: KeyboardEvent) => {
      const dir = dirOf(e.key);
      if (!dir) return;
      heldKeysRef.current.delete(dir);
      recompute();
    };
    // Focus loss can swallow a keyup — clear everything so a key never sticks.
    const clearAll = () => { heldKeysRef.current.clear(); edgePanRef.current = { x: 0, z: 0 }; recompute(); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clearAll);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clearAll);
    };
  }, []);

  // 環境音 — wind under everything; birds by day, crickets at dusk/night, war
  // drums while a battle burns. Follows the sound toggle live.
  const soundOn = useGameStore((s) => s.soundEnabled);
  useEffect(() => {
    if (!soundOn) { stopMapAmbience(); return; }
    startMapAmbience(battleActive ? 'war' : tod === 'day' ? 'day' : 'dusk');
    return () => stopMapAmbience();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);
  useEffect(() => {
    setMapAmbienceMode(battleActive ? 'war' : tod === 'day' ? 'day' : 'dusk');
  }, [battleActive, tod]);

  // 迷你導航 — camera view window for the corner minimap + click-to-jump.
  const [navView, setNavView] = useState<{ cx: number; cy: number; span: number } | null>(null);
  const [navJump, setNavJump] = useState<{ px: number; py: number; seq: number } | null>(null);
  const selectCityOuter = useGameStore((s) => s.selectCity);
  const fogOfWar = useGameStore((s) => s.fogOfWar);
  const setFogOfWar = useGameStore((s) => s.setFogOfWar);
  // 手機收納 — objective card and the map-tools tray fold away by default.
  const [objOpen, setObjOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  // 戰役回放面板開關。
  const [showReplay, setShowReplay] = useState(false);
  const [showMapHelp, setShowMapHelp] = useState(false);

  // 鍵盤快捷鍵 — 1..9 switch overlays, Tab cycles own cities (camera in
  // tow), Esc backs out of selections. Typing in any input is exempt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '0') {
        // 0 toggles the strategic-intent (兵鋒) overlay — it's the 10th mode,
        // past the 1–9 number row.
        setOverlayMode((cur) => (cur === 'intent' ? 'none' : 'intent'));
      } else if (e.key >= '1' && e.key <= '9') {
        const opt = OVERLAY_OPTIONS.filter((o) => o.id !== 'none')[Number(e.key) - 1];
        if (opt) setOverlayMode((cur) => (cur === opt.id ? 'none' : opt.id));
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const s = useGameStore.getState();
        const own = Object.values(s.cities)
          .filter((c) => c.ownerForceId === s.playerForceId)
          .sort((a, b) => a.name.zh.localeCompare(b.name.zh));
        if (own.length === 0) return;
        const idx = own.findIndex((c) => c.id === s.selectedCityId);
        const next = own[(idx + 1) % own.length];
        s.selectCity(next.id);
        const [px, py] = cityPixel(next.id, next.coords.x, next.coords.y);
        setNavJump({ px, py, seq: Date.now() });
      } else if (e.key === 'Escape') {
        // A modal/window owns this Esc (its escape-stack handler closes it on
        // the same keydown) — don't also deselect the city underneath.
        if (hasEscapeLayers()) return;
        const s = useGameStore.getState();
        if (s.selectedArmyId) s.selectArmy(null);
        else if (s.selectedCityId) s.selectCity(null);
        setQuickPick(null);
      } else if (e.key === 'Home' || e.key === 'h' || e.key === 'H') {
        jumpToCapital();   // 回都
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // 天下大勢 snapshot — grab the WebGL canvas as a PNG.
  const mapRootRef = useRef<HTMLDivElement>(null);
  const snapYear = useGameStore((s) => s.date.year);
  const exportSnapshot = () => {
    const canvas = mapRootRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = (canvas as HTMLCanvasElement).toDataURL('image/png');
    a.download = `天下大勢-${snapYear}年.png`;
    a.click();
  };
  // 烽火示警 — hostile columns marching on player cities (chip top-left).
  const beaconCities = useGameStore((s) => s.cities);
  const beaconArmies = useGameStore((s) => s.armies);
  const beaconSelectCity = useGameStore((s) => s.selectCity);
  const beaconPlayerForceId = useGameStore((s) => s.playerForceId);
  const beaconAlerts = useMemo(
    () => computeBeaconAlerts(beaconCities, beaconArmies, beaconPlayerForceId),
    [beaconCities, beaconArmies, beaconPlayerForceId],
  );
  // ⬡ 棋盤世界 experiment — hex-tile world terrain; the painted scroll map
  // stays the default and is always one tap away (backup).
  const [mapStyle, setMapStyle] = useState<'classic' | 'hex'>(
    // P1 統一格網 — the hex board is the primary form (ROTK-XIV style);
    // the painted scroll stays as the opt-in 鑑賞 mode.
    () => (localStorage.getItem('tkm-map-style') === 'classic' ? 'classic' : 'hex'),
  );
  const toggleMapStyle = () => {
    const next = mapStyle === 'hex' ? 'classic' : 'hex';
    setMapStyle(next);
    localStorage.setItem('tkm-map-style', next);
  };

  // ── 原地指揮 (stage 3) — command the minimized battle right on the map ──
  // Selection is keyed by battle id so a stale pick can't leak into the next
  // fight (unit ids repeat across battles); validity is derived, no effects.
  const worldBattle = useGameStore((s) => s.tacticalBattle);
  const worldBattleMinimized = useGameStore((s) => s.battleViewMinimized);
  const setBattleViewMinimized = useGameStore((s) => s.setBattleViewMinimized);
  const startBattleUpdate = useGameStore((s) => s.startTacticalBattle);
  const officersAll = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [dioPick, setDioPick] = useState<{ bid: string; uid: string } | null>(null);
  const [dioMode, setDioMode] = useState<'move' | 'attack'>('move');
  const [dioHover, setDioHoverRaw] = useState<HexCoord | null>(null);
  const setDioHover = (c: HexCoord | null) => {
    setDioHoverRaw((prev) => (prev?.col === c?.col && prev?.row === c?.row ? prev : c));
  };
  // 計謀 — an armed stratagem waiting for its target hex; FX ride the diorama.
  // tacticId set = a personal/signature tactic riding an underlying stratagem.
  const [dioCast, setDioCast] = useState<{ id: StratagemId; tacticId?: string } | null>(null);
  const [dioFx, setDioFx] = useState<StratagemFxInstance[]>([]);
  // 戰鬥運鏡 — same impact kick as the tactical screen, on the big-map battle.
  const [cine, setCine] = useState<{ key: number; weight: number; color: string } | null>(null);
  const cineCount = useRef(0);
  const mapCanvasWrapRef = useRef<HTMLDivElement>(null);
  // 邊緣滾屏 — nudging the mouse into the canvas edge band pans the map
  // (desktop only). Corner UI lives outside this wrapper, so hovering a button
  // never triggers a scroll.
  useEffect(() => {
    if (IS_MOBILE) return;
    const el = mapCanvasWrapRef.current;
    if (!el) return;
    const M = 42;   // edge band thickness in px
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      let x = 0, z = 0;
      if (e.clientX <= r.left + M) x = -1; else if (e.clientX >= r.right - M) x = 1;
      if (e.clientY <= r.top + M) z = 1; else if (e.clientY >= r.bottom - M) z = -1;
      edgePanRef.current = { x, z };
      recomputePanRef.current();
    };
    const onLeave = () => { edgePanRef.current = { x: 0, z: 0 }; recomputePanRef.current(); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  const punchFx = (kind: StratagemFxKind, color: string) => {
    const weight = FX_IMPACT[kind];
    if (weight > 0) setCine({ key: ++cineCount.current, weight, color });
  };
  useEffect(() => {
    if (!cine || cine.weight <= 0) return;
    const el = mapCanvasWrapRef.current;
    if (!el || typeof el.animate !== 'function') return;
    const a = cine.weight >= 2 ? 10 : 4.5;
    el.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: `translate(${a}px,${-a * 0.7}px) scale(1.03)` },
        { transform: `translate(${-a}px,${a * 0.6}px) scale(1.03)` },
        { transform: `translate(${a * 0.6}px,${a * 0.5}px) scale(1.02)` },
        { transform: 'translate(0,0) scale(1)' },
      ],
      { duration: cine.weight >= 2 ? 420 : 250, easing: 'ease-out' },
    );
  }, [cine?.key]);  // eslint-disable-line react-hooks/exhaustive-deps
  const dioFxIdRef = useRef(0);
  /** Spawn one cast FX on the diorama: particle + sound + 運鏡, auto-expired. */
  const spawnCastFx = (coord: HexCoord, spec: TacticFxSpec) => {
    const fxId = ++dioFxIdRef.current;
    const now = Date.now();
    setDioFx((arr) => [...arr, { id: fxId, coord, spec, spawnedAt: now }]);
    playFxSfx(spec.kind);
    punchFx(spec.kind, spec.color);
    const lifeMs = (FX_DURATION[spec.kind] ?? 1.5) * 1000 + 200;
    setTimeout(() => setDioFx((arr) => arr.filter((f) => f.id !== fxId)), lifeMs);
  };
  // 大地圖 AI 施放戰法 → 在縮圖戰場播同樣的特效/音效/運鏡。BattleAIDriver 無頭
  // 推進、不直接入 dioFx,故經 store 的 battleFxBatch 轉一手。
  const battleFxBatch = useGameStore((s) => s.battleFxBatch);
  const lastFxBatchKey = useRef(0);
  useEffect(() => {
    if (!battleFxBatch || battleFxBatch.key === lastFxBatchKey.current) return;
    lastFxBatchKey.current = battleFxBatch.key;
    if (!worldBattle || !worldBattleMinimized) return;  // only while watching the diorama
    for (const ev of battleFxBatch.events) {
      const spec = tacticFxSpec(ev.tacticId, ev.stratagemId, categoryOfTactic);
      if (spec) spawnCastFx(ev.coord, spec);
    }
  }, [battleFxBatch?.key]);  // eslint-disable-line react-hooks/exhaustive-deps
  // 單挑 — armed duel waiting for an adjacent enemy commander; the bout itself
  // runs in the same DuelGameModal the fullscreen uses.
  const [dioDuelArm, setDioDuelArm] = useState(false);
  const [worldDuel, setWorldDuel] = useState<{ me: Officer; foe: Officer; meFatigue: number; foeFatigue: number; reinforcements: Officer[] } | null>(null);
  const [captureChoice, setCaptureChoice] = useState<{ id: string; name: { zh: string; en: string } } | null>(null);
  // 快捷輪盤 — which DOM picker (march/recruit) the ring asked for.
  const [quickPick, setQuickPick] = useState<{ kind: 'march' | 'recruit' | 'muster'; cityId: string } | null>(null);
  const [dioArcs, setDioArcs] = useState<Array<{ id: number; from: HexCoord; to: HexCoord; kind: 'melee' | 'ranged'; spawnedAt: number }>>([]);
  const dioSelectedId = worldBattle && dioPick && dioPick.bid === worldBattle.id
    && worldBattle.units.some((u) => u.id === dioPick.uid) ? dioPick.uid : null;
  const worldPlayerSide: 'attacker' | 'defender' | null = worldBattle
    ? (worldBattle.attackerForceId === playerForceId ? 'attacker'
      : worldBattle.defenderForceId === playerForceId ? 'defender' : null)
    : null;
  const worldMyTurn = !!worldBattle && !!worldPlayerSide
    && worldBattle.activeSide === worldPlayerSide && !worldBattle.winner;

  // Same select/move/attack semantics as the fullscreen onTileClick — the
  // deep actions (stratagems, duels, formations) live one ⤢ tap away.
  const handleDioramaTile = (c: HexCoord) => {
    const b = useGameStore.getState().tacticalBattle;
    if (!b) return;
    if (!useGameStore.getState().battleViewMinimized) {
      // Pre-reveal (fly-in) click — just open the fullscreen view.
      setBattleViewMinimized(false);
      return;
    }
    const pSide = b.attackerForceId === playerForceId ? 'attacker'
      : b.defenderForceId === playerForceId ? 'defender' : null;
    if (!pSide || b.activeSide !== pSide || b.winner) return;
    const u = unitAt(b, c);
    // An armed stratagem treats ANY click as its target (incl. friendlies —
    // rally-style buffs), exactly like the fullscreen flow.
    if (dioCast) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioCast(null); return; }
      const r = applyStratagem(b, sel0.id, dioCast.id, c, useGameStore.getState().officers, dioCast.tacticId);
      if (r.ok) {
        const spec = tacticFxSpec(dioCast.tacticId, dioCast.id, categoryOfTactic);
        if (spec) {
          const isSelf = ['defend', 'precognition', 'dragon-veil'].includes(dioCast.id);
          spawnCastFx(isSelf ? sel0.coord : c, spec);
        }
        // N6 — signature flavor line for famous personal tactics.
        const flavor = dioCast.tacticId ? SIGNATURE_FLAVOR[dioCast.tacticId] : undefined;
        const next = flavor
          ? { ...r.battle, log: [...(r.battle.log ?? []), { turn: r.battle.turn, text: flavor.en, kind: 'event' as const }] }
          : r.battle;
        startBattleUpdate(next);
      } else if (r.reason) {
        alert(r.reason);
      }
      setDioCast(null);
      return;
    }
    // An armed duel needs an ADJACENT enemy commander — same gates as the
    // fullscreen flow (canDuel both sides, costs the unit's AP).
    if (dioDuelArm && u && u.side !== pSide) {
      const sel0 = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
      if (!sel0) { setDioDuelArm(false); return; }
      if (hexDistance(sel0.coord, u.coord) !== 1) { alert('須與敵將相鄰方可單挑'); return; }
      const officers = useGameStore.getState().officers;
      const me = officers[sel0.officerId];
      const foe = officers[u.officerId];
      if (!me || !foe) return;
      const meCheck = canDuel(me);
      const foeCheck = canDuel(foe);
      if (!meCheck.ok) { alert(`我將無法單挑: ${meCheck.reason}`); return; }
      if (!foeCheck.ok) { alert(`敵將無法應戰: ${foeCheck.reason}`); return; }
      startBattleUpdate({ ...b, units: b.units.map((unit) => unit.id === sel0.id ? { ...unit, ap: 0 } : unit) });
      // 三英戰呂布 — allies pressing the same foe may leap in mid-bout.
      const reinforcements = b.units
        .filter((ru) => ru.side === sel0.side && ru.troops > 0 && ru.ap > 0 && ru.officerId !== sel0.officerId
          && hexDistance(ru.coord, u.coord) === 1 && officers[ru.officerId] && canDuel(officers[ru.officerId]!).ok)
        .map((ru) => officers[ru.officerId]!).slice(0, 2);
      // 車輪戰 — fatigue from earlier bouts carries into this one.
      setWorldDuel({ me, foe, meFatigue: sel0.duelFatigue ?? 0, foeFatigue: u.duelFatigue ?? 0, reinforcements });
      setDioDuelArm(false);
      return;
    }
    if (u && u.side === pSide) {
      setDioPick({ bid: b.id, uid: u.id });
      setDioMode('move');
      setDioCast(null);
      setDioDuelArm(false);
      return;
    }
    const sel = dioSelectedId ? b.units.find((x) => x.id === dioSelectedId) : null;
    if (!sel) return;
    if (u && u.side !== pSide && canAttack(b, sel, u)) {
      const kind: 'melee' | 'ranged' = sel.unitType === 'archers' || sel.unitType === 'siege' ? 'ranged' : 'melee';
      const aid = Date.now();
      playSfx(kind === 'ranged' ? 'arrow' : 'sword');
      setDioArcs((a) => [...a, { id: aid, from: sel.coord, to: u.coord, kind, spawnedAt: aid }]);
      setTimeout(() => setDioArcs((a) => a.filter((x) => x.id !== aid)), 600);
      startBattleUpdate(attackUnits(b, sel.id, u.id, useGameStore.getState().officers, Math.random));
      return;
    }
    if (!u && dioMode === 'move' && canMove(b, sel, c)) {
      startBattleUpdate(moveUnit(b, sel.id, c));
    }
  };
  const weather = useGameStore((s) => s.weather);
  const season = useGameStore((s) => s.date.season) as Season;
  const t = useT();
  const lang = useLanguage();

  return (
    <div ref={mapRootRef} style={{
      position: 'absolute', inset: 0,
      background: tod === 'night'
        ? 'linear-gradient(180deg, #060a1c 0%, #1a2440 100%)'
        : tod === 'dusk'
        ? 'linear-gradient(180deg, #6a5a78 0%, #d89060 100%)'
        : 'linear-gradient(180deg, #88a0c0 0%, #c8b890 100%)',
    }}>
      {/* Objective tracker — top-left. Phones fold it into a chip; the
          full card is a tap away instead of owning a third of the screen. */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        {IS_MOBILE && !objOpen ? (
          <button
            onClick={() => setObjOpen(true)}
            style={{
              pointerEvents: 'auto', background: 'rgba(20, 14, 8, 0.88)', color: '#d4a84a',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem', cursor: 'pointer',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.75rem',
            }}
          >🎯 {t('目標', 'Goal')}</button>
        ) : (
          <div style={{ position: 'relative' }}>
            {IS_MOBILE && (
              <button
                onClick={() => setObjOpen(false)}
                style={{
                  pointerEvents: 'auto', position: 'absolute', top: 2, right: 2, zIndex: 1,
                  background: 'transparent', color: '#8a7050', border: 'none',
                  fontSize: '0.85rem', cursor: 'pointer',
                }}
              >✕</button>
            )}
            <ObjectivePanel />
          </div>
        )}
        {/* 烽火示警 — stacked under the objective card so neither covers the other. */}
        {beaconAlerts.threatened.size > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--tkm-font-body)' }}>
            {[...beaconAlerts.threatened].slice(0, 4).map((id) => (
              <button
                key={id}
                onClick={() => beaconSelectCity(id)}
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(40, 14, 8, 0.92)', border: '1px solid #e0552a',
                  color: '#f0b0a0', borderRadius: 'var(--tkm-radius-xs)', padding: '3px 9px',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
                  letterSpacing: '0.08rem', textAlign: 'left',
                  boxShadow: '0 0 10px rgba(224,85,42,0.35)',
                }}
              >
                🔥 {t('烽火示警', 'Beacons lit')} · {beaconCities[id] ? pickName(beaconCities[id].name, lang) : id}{t('告急', ' under threat')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 開戰字卡 — flashes 「X軍 ⚔ Y軍」 + drums when any battle ignites. */}
      <BattleIgnitionCard />

      {/* Season + weather chip */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
        display: 'flex', gap: 6,
        flexWrap: 'wrap', justifyContent: 'center', maxWidth: '96vw',
        pointerEvents: 'none',
      }}>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#d4a84a',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.7rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>{SEASON_ZH[season]} {season}</span>
        <span style={{
          background: 'rgba(20, 14, 8, 0.85)', color: '#a8c4e0',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.7rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
        }}>{WEATHER_ZH[weather.kind]}{weather.windPower >= 2 ? ` ${weather.windPower}` : ''}</span>
      </div>

      {/* Controls hint — desktop only; corrected for the map-app controls
          (left-drag now PANS, right-drag rotates), with a ? that opens the full
          cheat-sheet so every gesture/shortcut is discoverable. */}
      {!IS_MOBILE && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(20, 14, 8, 0.85)', color: '#a89070',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          padding: '0.3rem 0.6rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.72rem',
        }}>
          <span style={{ pointerEvents: 'none' }}>{t('左拖平移 · 右拖旋轉 · 滾輪縮放 · 雙擊飛近', 'left-drag pan · right-drag rotate · scroll zoom · double-click fly')}</span>
          <button onClick={() => setShowMapHelp(true)} title={t('操作說明', 'Controls')} style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: 'transparent', color: '#d4a84a', border: '1px solid #6a5230',
            cursor: 'pointer', fontSize: 11, lineHeight: 1, padding: 0, fontWeight: 'bold',
          }}>?</button>
        </div>
      )}

      {/* 尋城 — search-and-fly. Desktop: input under the controls hint.
          Phones: a 🔍 button that expands on tap, below the hint chip so
          nothing sits over the season/weather strip. */}
      <div style={{ position: 'absolute', top: IS_MOBILE ? 12 : 46, right: 12, zIndex: 11 }}>
        <CitySearchBox compact={IS_MOBILE} onJump={(cityId, px, py) => {
          setNavJump({ px, py, seq: Date.now() });
          selectCityOuter(cityId);
        }} />
      </div>

      {/* Map layers & tools — bottom-left, folded on every device behind one
          ◧ 圖層 trigger (the old always-open 15-button row read as clutter).
          The tray opens above it: overlay chips grouped 資源/政情/軍情, then
          view toggles and tools. 1-9/0 hotkeys still switch overlays directly;
          the trigger echoes the active overlay so a hidden tray never lies. */}
      <button
        onClick={() => setToolsOpen((v) => !v)}
        style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 11,
          background: toolsOpen ? '#d4a84a' : 'rgba(20, 14, 8, 0.92)',
          color: toolsOpen ? '#1a1410' : overlayMode !== 'none' ? '#f0d98a' : '#c0a878',
          border: '1px solid ' + (toolsOpen || overlayMode !== 'none' ? '#d4a84a' : '#5a4530'),
          borderRadius: 'var(--tkm-radius-lg)',
          padding: '0.35rem 0.7rem', cursor: 'pointer',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}
        title={t('圖層與地圖工具 — 疊圖亦可按 1–9/0 直切', 'Map layers & tools — overlays also on hotkeys 1–9/0')}
      >
        ◧ {t('圖層', 'Layers')}
        {overlayMode !== 'none' && (() => {
          const act = OVERLAY_OPTIONS.find((o) => o.id === overlayMode);
          return act ? <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 'bold' }}>· {t(act.zh, act.en)}</span> : null;
        })()}
        {fogOfWar && <span title={t('戰爭迷霧開啟', 'Fog of war on')}>🌫</span>}
      </button>
      {toolsOpen && (
      <div style={{
        position: 'absolute', bottom: 52, left: 12, zIndex: 10,
        width: 300, maxWidth: 'calc(100vw - 24px)',
        background: 'rgba(20, 14, 8, 0.94)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
        padding: '0.5rem 0.6rem',
        boxShadow: '0 0 12px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {([
          [t('資源疊圖', 'Resource overlays'), ['gold', 'food', 'troops', 'loyalty'] as OverlayMode[]],
          [t('政情疊圖', 'Realm overlays'), ['province', 'specialty', 'diplomacy'] as OverlayMode[]],
          [t('軍情疊圖', 'War overlays'), ['supply', 'threat', 'intent'] as OverlayMode[]],
        ] as Array<[string, OverlayMode[]]>).map(([head, ids]) => (
          <div key={head}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{head}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ids.map((id) => {
                const opt = OVERLAY_OPTIONS.find((o) => o.id === id)!;
                // 1-9 follow OVERLAY_OPTIONS order (sans 'none'); 兵鋒 rides on 0.
                const numbered = OVERLAY_OPTIONS.filter((o) => o.id !== 'none');
                const hotkey = id === 'intent' ? '0' : String(numbered.findIndex((o) => o.id === id) + 1);
                return (
                  <button
                    key={id}
                    onClick={() => setOverlayMode((cur) => (cur === id ? 'none' : id))}
                    title={t(`快捷鍵 ${hotkey}`, `Hotkey ${hotkey}`)}
                    style={{
                      background: overlayMode === id ? '#d4a84a' : 'transparent',
                      color: overlayMode === id ? '#1a1410' : '#a89070',
                      border: '1px solid ' + (overlayMode === id ? '#d4a84a' : '#5a4530'),
                      padding: '0.28rem 0.5rem',
                      cursor: 'pointer',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.05rem',
                    }}
                  >
                    {t(opt.zh, opt.en)}
                    <span style={{ opacity: 0.5, fontSize: '0.6rem', marginLeft: 3 }}>{hotkey}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{t('顯示', 'View')}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={toggleMapStyle}
              style={{
                background: mapStyle === 'hex' ? 'rgba(212, 168, 74, 0.18)' : '#1a2415',
                color: mapStyle === 'hex' ? '#d4a84a' : '#9ab87a',
                border: `1px solid ${mapStyle === 'hex' ? '#d4a84a' : '#4a5a3a'}`,
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('切換地圖風格 — 棋盤六角地塊 / 畫卷地圖(實驗)', 'Toggle map style — hex-tile board / painted scroll (experimental)')}
            >{mapStyle === 'hex' ? t('🗺 畫卷地圖', 'Scroll Map') : t('⬡ 棋盤地圖', 'Hex Map')}</button>
            <button
              onClick={() => setFogOfWar(!fogOfWar)}
              style={{
                background: fogOfWar ? 'rgba(120, 130, 150, 0.22)' : '#241c12',
                color: fogOfWar ? '#b8c4d8' : '#a89070',
                border: `1px solid ${fogOfWar ? '#8a96ac' : '#5a4530'}`,
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('戰爭迷霧 — 只看得見自己城池與行軍縱隊周邊的敵情;烽火台照常預警', 'Fog of war — intel limited to what your cities and columns can see; beacons still warn')}
            >🌫 {fogOfWar ? t('迷霧:開', 'Fog ON') : t('迷霧:關', 'Fog OFF')}</button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.12rem', color: '#8a7658', marginBottom: 3 }}>{t('工具', 'Tools')}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowStockadeBuild(true)}
              style={{
                background: '#3a2818', color: '#c8a878',
                border: '1px solid rgba(255,255,255,0.14)', borderRadius: 'var(--tkm-radius-lg)',
                padding: '0.3rem 0.55rem', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('築壘寨 / 箭樓 / 投石臺 — 施設可轟擊路過敵軍', 'Build stockade / arrow tower / catapult — facilities shell passing enemies')}
            >⚒ {t('築堡施設', 'Build')}</button>
            <button
              onClick={exportSnapshot}
              style={{
                background: '#241c12', color: '#c0a878',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem',
                cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('把當前天下大勢存成 PNG', 'Save the current realm view as a PNG')}
            >📷 {t('大勢', 'Snap')}</button>
            <button
              onClick={() => setShowReplay(true)}
              style={{
                background: '#241c12', color: '#c0a878',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', padding: '0.3rem 0.55rem',
                cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.76rem',
              }}
              title={t('戰役回放 — 快進重現整局天下消長', "Campaign timelapse — fast-forward the whole campaign's territory changes")}
            >🎞 {t('回放', 'Replay')}</button>
          </div>
        </div>
      </div>
      )}
      {/* 戰役回放:無頭記錄器(每季存一幀)+ 開啟後的面板。 */}
      <ReplayRecorder />
      {showReplay && <ReplayPanel onClose={() => setShowReplay(false)} />}
      {showMapHelp && <MapHelpPanel onClose={() => setShowMapHelp(false)} />}

      <div ref={mapCanvasWrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* 戰鬥運鏡 — impact flash for big-map casts, remounted per cast */}
      {cine && cine.weight > 0 && (
        <div
          key={cine.key}
          className="tkm-fx-flash"
          style={{
            ['--fx-color']: cine.color,
            ['--fx-peak']: cine.weight >= 2 ? 0.38 : 0.22,
            ['--fx-dur']: cine.weight >= 2 ? '0.42s' : '0.3s',
          } as React.CSSProperties}
        />
      )}
      <Canvas
        // Remounts with a fresh GL context if the old one is lost and never
        // restored (see glEpoch / onCreated below).
        key={glEpoch}
        // Shadow maps are the single biggest GPU cost on this scene — high tier only.
        shadows={RENDER_HI}
        dpr={RENDER_HI ? [1, 2] : [1, 1.5]}
        camera={{ position: [0, MAP_D * 0.9, MAP_D * 0.7], fov: 45, near: 0.5, far: 400 * WORLD_SCALE }}
        // preserveDrawingBuffer lets the 📷 button read the frame back.
        gl={{ antialias: RENDER_HI, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          // Recover from WebGL context loss instead of going black forever.
          const canvas = gl.domElement;
          const onLost = (e: Event) => {
            e.preventDefault();                 // ask the browser to attempt a restore
            if (glRestoreTimer.current != null) return;
            // Grace period: a transient loss (tab switch, brief pressure) is
            // restored by the browser + three.js on its own. If it isn't, the
            // context is dead for good — hard-remount with a fresh one.
            glRestoreTimer.current = window.setTimeout(() => {
              glRestoreTimer.current = null;
              console.warn('[StrategicMap3D] WebGL context not restored — remounting canvas');
              setGlEpoch((n) => n + 1);
            }, 1800);
          };
          const onRestored = () => {
            if (glRestoreTimer.current != null) {
              window.clearTimeout(glRestoreTimer.current);
              glRestoreTimer.current = null;
            }
          };
          canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
          canvas.addEventListener('webglcontextrestored', onRestored as EventListener, false);
        }}
      >
        <BattleCinematics trigger={cine} />
        <Suspense fallback={null}>
          <ZoomLODTracker onChange={setZoomLod} />
          <ZoomLODCtx.Provider value={zoomLod}>
          <MapScene
            overlayMode={overlayMode}
            mapStyle={mapStyle}
            onPortClick={setSelectedPortId}
            onFortClick={setSelectedFortId}
            onTribeClick={setSelectedTribeId}
            onSiteClick={setSelectedSiteId}
            onScenicClick={setSelectedScenicId}
            onQuickAction={(kind, cityId) => setQuickPick({ kind, cityId })}
            dioSelectedId={worldBattleMinimized ? dioSelectedId : null}
            dioMode={dioMode}
            dioCast={worldBattleMinimized ? dioCast : null}
            dioArcs={dioArcs}
            dioFx={dioFx}
            dioHover={worldBattleMinimized ? dioHover : null}
            onDioHover={setDioHover}
            onDioramaTile={handleDioramaTile}
            onFocusWorld={(wx, wz) => camApiRef.current?.flyTo(wx, wz)}
            onDragLock={(locked) => {
              const c = controlsRef.current as { enabled?: boolean } | null;
              if (c) c.enabled = !locked;
            }}
          />
          </ZoomLODCtx.Provider>
          <OrbitControls
            ref={controlsRef as React.Ref<never>}
            target={orbitTarget}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={battleActive ? 0.9 : 3}
            maxDistance={MAP_MAX_DIST}
            enableDamping
            dampingFactor={0.1}
            // 地圖 App 式操作 — drag the ground with one finger / left mouse,
            // pinch (or scroll) to zoom toward where you're looking, twist with
            // two fingers / right-drag to rotate. screenSpacePanning=false keeps
            // a pan gliding across the terrain instead of drifting skyward when
            // the camera is tilted; zoomToCursor homes the zoom on the cursor.
            screenSpacePanning={false}
            zoomToCursor
            touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
            mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          />
          <MapCamApi apiRef={camApiRef} controlsRef={controlsRef} panInputRef={panInputRef} />
          <HeadingTracker controlsRef={controlsRef} onHeading={setHeading} />
          {/* Fly to a battle the moment it ignites — before its screen mounts. */}
          <BattleFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          {/* Cinematic arc when a city changes hands (capture / loss). */}
          <EventFocusFly controlsRef={controlsRef} onSettled={setOrbitTarget} />
          <MiniNavRig controlsRef={controlsRef} onView={setNavView} jump={navJump} />
          {/* Gentle bloom — beacons, fires and water shimmer get a halo; on a
              moonlit lower-phase NIGHT it opens up so the city lamps, beacon
              chains and ember fields truly glow (萬家燈火). High tier only. */}
          {RENDER_HI && (
            <EffectComposer>
              <Bloom
                luminanceThreshold={tod === 'night' ? 0.5 : 0.85}
                intensity={tod === 'night' ? 0.9 : 0.35}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
      </div>

      {/* 鏡頭控制 — zoom in/out + recenter on the right edge, clear of the
          bottom-right minimap and top-right buttons. Big round tap targets for
          touch; they drive the OrbitControls camera via MapCamApi. */}
      <div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        zIndex: 11, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {([
          { key: 'in', label: '＋', title: t('放大', 'Zoom in'), onClick: () => camApiRef.current?.zoomBy(0.78) },
          { key: 'out', label: '－', title: t('縮小', 'Zoom out'), onClick: () => camApiRef.current?.zoomBy(1.28) },
          { key: 'home', label: '⌖', title: t('復位 — 回到全局俯視', 'Recenter — overview'), onClick: () => { camApiRef.current?.recenter(); setOrbitTarget([0, 0, 0]); } },
          { key: 'capital', label: '🏯', title: t('回都城 (Home)', 'Capital (Home)'), onClick: jumpToCapital },
        ] as const).map((b) => (
          <button
            key={b.key}
            title={b.title}
            aria-label={b.title}
            onClick={b.onClick}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(20, 14, 8, 0.92)', color: '#c0a878',
              border: '1px solid #5a4530', cursor: 'pointer',
              fontSize: b.key === 'in' || b.key === 'out' ? 22 : 17, lineHeight: 1, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.55)',
            }}
          >{b.label}</button>
        ))}
      </div>

      {/* 羅盤 — a parchment compass rose on the left edge; the whole rose turns
          with the camera so the red 北 spike always points to true north. Pure
          decoration (pointer-events off) that also doubles as a heading read. */}
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        zIndex: 9, pointerEvents: 'none', opacity: 0.5,
      }}>
        <svg width="54" height="54" viewBox="0 0 100 100"
          style={{ transform: `rotate(${heading}deg)`, transition: 'transform 0.12s linear' }}>
          <circle cx="50" cy="50" r="47" fill="rgba(20,14,8,0.4)" stroke="#caa86a" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="39" fill="none" stroke="#caa86a" strokeWidth="0.6" opacity="0.4" />
          <polygon points="50,14 55,50 50,86 45,50" fill="#caa86a" opacity="0.5" />
          <polygon points="14,50 50,45 86,50 50,55" fill="#caa86a" opacity="0.3" />
          <polygon points="50,8 54,50 46,50" fill="#d9434a" opacity="0.78" />
          <text x="50" y="27" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#f0dca8" fontFamily="serif">北</text>
        </svg>
      </div>

      {/* 快捷輪盤的 DOM 端 — the pickers the ring opens (ordinary modals,
          they live outside the Canvas). */}
      {quickPick?.kind === 'march' && (
        <MarchPicker cityId={quickPick.cityId} onClose={() => setQuickPick(null)} />
      )}
      {quickPick?.kind === 'recruit' && (
        <OfficerPicker cityId={quickPick.cityId} commandType="recruit-troops" onClose={() => setQuickPick(null)} />
      )}
      {quickPick?.kind === 'muster' && (
        <MusterModal targetCityId={quickPick.cityId} onClose={() => setQuickPick(null)} />
      )}

      {/* 原地指揮 — command the minimized battle right on the map: select,
          move, attack, end turn. Deep actions (stratagems/duels) are one ⤢
          tap away in the fullscreen view. */}
      {worldBattle && worldBattleMinimized && (() => {
        const sel = dioSelectedId ? worldBattle.units.find((u) => u.id === dioSelectedId) : null;
        const off = sel ? officersAll[sel.officerId] : null;
        const hovUnit = dioHover ? unitAt(worldBattle, dioHover) : null;
        const hovOff = hovUnit ? officersAll[hovUnit.officerId] : null;
        const hovIsOwn = hovUnit && worldPlayerSide && hovUnit.side === worldPlayerSide;
        const modeBtn = (mode: 'move' | 'attack', zh: string, en: string) => (
          <button
            onClick={() => setDioMode(mode)}
            style={{
              background: dioMode === mode ? 'rgba(212,168,74,0.22)' : 'transparent',
              border: `1px solid ${dioMode === mode ? '#d4a84a' : '#5a4530'}`,
              color: dioMode === mode ? '#f0d98a' : '#c0a878',
              padding: '0.15rem 0.55rem', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.75rem',
            }}
          >{t(zh, en)}</button>
        );
        return (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            zIndex: 13, display: 'flex', alignItems: 'center', gap: IS_MOBILE ? '0.35rem' : '0.55rem',
            background: 'rgba(20, 14, 8, 0.94)', border: '1px solid #b8584a', borderRadius: 'var(--tkm-radius-sm)',
            padding: IS_MOBILE ? '0.3rem 0.5rem' : '0.4rem 0.8rem', fontFamily: 'var(--tkm-font-body)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.6)',
            // Phones: wrap the chips instead of overflowing off-screen.
            flexWrap: 'wrap', justifyContent: 'center', maxWidth: '94vw',
          }}>
            <span style={{ color: '#e0a0a0', fontSize: '0.78rem', letterSpacing: '0.1rem' }}>
              ⚔ {t(`第${worldBattle.turn}回`, `T${worldBattle.turn}`)} · {worldBattle.winner
                ? t('勝負已分', 'Decided')
                : worldMyTurn ? t('我方回合', 'YOUR TURN') : t('敵方回合', 'enemy turn')}
            </span>
            {sel && off ? (
              <>
                <span style={{ color: '#f0d98a', fontSize: '0.8rem' }}>
                  {pickName(off.name, lang)} · AP {sel.ap}/{sel.maxAp} · {sel.troops.toLocaleString()}{t('兵', '')}
                </span>
                {modeBtn('move', '移動', 'Move')}
                {modeBtn('attack', '攻擊', 'Attack')}
                {/* 單挑 — adjacent enemy commander, same gates as fullscreen. */}
                <button
                  onClick={() => { setDioDuelArm(!dioDuelArm); setDioCast(null); }}
                  title={t('單挑 — 點相鄰敵將開打(耗盡AP)', 'Duel — tap an adjacent enemy commander (costs all AP)')}
                  style={{
                    background: dioDuelArm ? 'rgba(214,126,126,0.22)' : 'transparent',
                    border: `1px solid ${dioDuelArm ? '#d67e7e' : '#5a3a3a'}`,
                    color: dioDuelArm ? '#f0bcbc' : '#c88888',
                    padding: '0.15rem 0.45rem', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.72rem',
                  }}
                >{t('單挑', 'Duel')}</button>
                {/* 個人戰術 — signature moves riding underlying stratagems. */}
                {personalTacticsForUnit(off, sel).slice(0, 3).map((pt) => {
                  const armed = dioCast?.id === pt.underlying && dioCast?.tacticId === pt.tacticId;
                  return (
                    <button
                      key={pt.id}
                      onClick={() => { setDioCast(armed ? null : { id: pt.underlying, tacticId: pt.tacticId }); setDioDuelArm(false); }}
                      title={pt.nameEn}
                      style={{
                        background: armed ? 'rgba(193,154,240,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#c19af0' : '#4a3a5a'}`,
                        color: armed ? '#ddc8f5' : '#a88fc8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{lang === 'en' ? pt.nameEn : pt.nameZh}</button>
                  );
                })}
                {/* 計謀 — same availability rules as the fullscreen panel. */}
                {STRATAGEMS.filter((s) => {
                  if (s.signatureOf && !s.signatureOf.includes(off.id)) return false;
                  if (s.minIntelligence && off.stats.intelligence < s.minIntelligence) return false;
                  if (s.minWar && off.stats.war < s.minWar) return false;
                  if (s.requiresUnitType && !s.requiresUnitType.includes(sel.unitType)) return false;
                  return true;
                }).slice(0, 4).map((s) => {
                  const armed = dioCast?.id === s.id && !dioCast?.tacticId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setDioCast(armed ? null : { id: s.id }); setDioDuelArm(false); }}
                      title={s.descriptionZh ?? s.description}
                      style={{
                        background: armed ? 'rgba(136,183,232,0.22)' : 'transparent',
                        border: `1px solid ${armed ? '#88b7e8' : '#3a4a5a'}`,
                        color: armed ? '#bcd8f0' : '#88a7c8',
                        padding: '0.15rem 0.45rem', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: '0.72rem',
                      }}
                    >{pickName(s.name, lang)}</button>
                  );
                })}
                {(dioCast || dioDuelArm) && (
                  <span style={{ color: dioDuelArm ? '#d67e7e' : '#88b7e8', fontSize: '0.7rem' }}>
                    {dioDuelArm ? t('點相鄰敵將', 'tap adjacent foe') : t('點目標格施放', 'tap a target hex')}
                  </span>
                )}
                {/* 戰法情境預覽 — current weather/terrain effect on the armed cast. */}
                {dioCast && (() => {
                  const s = battleStratagemSituation(worldBattle, sel.coord, sel.coord, dioCast.id);
                  if (!s.note) return null;
                  return (
                    <span style={{ color: s.mult >= 1 ? '#9ad6a8' : '#e8a07a', fontSize: '0.7rem' }}>
                      {s.mult >= 1 ? '⊕' : '⊖'} {t(s.note.zh, s.note.en)}
                    </span>
                  );
                })()}
              </>
            ) : (
              <span style={{ color: '#8a7050', fontSize: '0.74rem' }}>
                {t('點選棋盤上我方部隊下令', 'Tap one of your units on the board')}
              </span>
            )}
            {hovUnit && hovOff && hovUnit.id !== dioSelectedId && (
              <span style={{
                color: hovIsOwn ? '#9ec9f0' : '#f0a0a0', fontSize: '0.74rem',
                borderLeft: '1px solid #4a3520', paddingLeft: '0.55rem',
              }}>
                {hovIsOwn ? '' : t('敵 ', 'Enemy ')}{pickName(hovOff.name, lang)} · {hovUnit.troops.toLocaleString()}{t('兵', '')} · AP {hovUnit.ap}/{hovUnit.maxAp}
              </span>
            )}
            {/* 戰鬥預判 — same forecast as the fullscreen screen, on the diorama. */}
            {sel && !hovIsOwn && hovUnit && hovUnit.troops > 0 && worldPlayerSide && sel.side === worldPlayerSide
              && canAttack(worldBattle, sel, hovUnit) && (() => {
              const f = forecastAttack(worldBattle, sel, hovUnit, officersAll);
              const ml = matchupLabel(sel.unitType, hovUnit.unitType);
              const bad = matchupLabel(hovUnit.unitType, sel.unitType);
              const col = f.willKill ? '#7ed68a' : f.matchup === 'strong' ? '#d4e88a' : f.matchup === 'weak' ? '#e8a07a' : '#d4a84a';
              return (
                <span style={{
                  color: col, fontSize: '0.74rem', borderLeft: '1px solid #4a3520', paddingLeft: '0.55rem',
                }}>
                  ⚔ {f.dmgMin.toLocaleString()}–{f.dmgMax.toLocaleString()}
                  {f.willKill ? ` · ${t('可殲滅', 'LETHAL')}` : f.counterMax > 0 ? ` · ${t('反', 'ca')}${f.counterMax.toLocaleString()}` : ''}
                  {ml ? ` · ↑${lang === 'en' ? ml.en : ml.zh}` : bad ? ` · ↓${t('被', 'vs ')}${lang === 'en' ? bad.en : bad.zh}` : ''}
                </span>
              );
            })()}
            <button
              onClick={() => {
                const b = useGameStore.getState().tacticalBattle;
                if (!b || !worldMyTurn) return;
                startBattleUpdate(endTurn(b, useGameStore.getState().officers));
                setDioPick(null);
              }}
              disabled={!worldMyTurn}
              style={{
                background: worldMyTurn ? '#5a4530' : '#241c12', color: worldMyTurn ? '#f0e0b0' : '#6a5238',
                border: '1px solid #d4a84a', padding: '0.15rem 0.6rem',
                cursor: worldMyTurn ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >{t('結束回合', 'End Turn')}</button>
            <button
              onClick={() => setBattleViewMinimized(false)}
              style={{
                background: '#16261a', color: '#9ed68a', border: '1px solid #5a8a3a',
                padding: '0.15rem 0.6rem', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >⤢ {t('全屏戰場', 'Fullscreen')}</button>
          </div>
        );
      })()}

      {/* 迷你導航 — the realm at a glance; click to jump the camera there. */}
      {navView && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 11 }}>
          <LocatorMap
            window={{ cx: navView.cx, cy: navView.cy, spanX: navView.span * 1.6, spanY: navView.span, rotation: 0, kind: 'world' }}
            width={IS_MOBILE ? 108 : 138}
            onPickPx={(px, py) => setNavJump({ px, py, seq: Date.now() })}
          />
        </div>
      )}

      {/* 單挑 from the world map — same modal & writeback as the fullscreen. */}
      {worldDuel && (
        <Duel3DStage
          attacker={worldDuel.me}
          defender={worldDuel.foe}
          meFatigue={worldDuel.meFatigue}
          foeFatigue={worldDuel.foeFatigue}
          reinforcements={worldDuel.reinforcements}
          staged
          onRound={() => {
            // 戰場原地對決 — the two diorama units lunge at each other each round.
            const bt = useGameStore.getState().tacticalBattle;
            const ua = bt?.units.find((u) => u.officerId === worldDuel.me.id);
            const ub = bt?.units.find((u) => u.officerId === worldDuel.foe.id);
            if (!ua || !ub) return;
            const now = Date.now();
            setDioArcs((a) => [...a,
              { id: now, from: ua.coord, to: ub.coord, kind: 'melee' as const, spawnedAt: now },
              { id: now + 1, from: ub.coord, to: ua.coord, kind: 'melee' as const, spawnedAt: now },
            ]);
            setTimeout(() => setDioArcs((a) => a.filter((x) => x.id !== now && x.id !== now + 1)), 600);
          }}
          onComplete={(outcome) => {
            const { foe } = worldDuel;
            const b = useGameStore.getState().tacticalBattle;
            const me = (outcome.attackerId && useGameStore.getState().officers[outcome.attackerId]) || worldDuel.me;
            setWorldDuel(null);
            if (!b) return;
            const killedId = outcome.killedId === 'defender' ? foe.id
              : outcome.killedId === 'attacker' ? me.id : null;
            let next = b;
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
                kind: 'event' as const,
              }],
            };
            // 負傷 — the bested fighter's own unit is mauled (~18%); a draw
            // mauls both (~10%). Feeds the post-battle wound roll.
            if (outcome.winner !== 'draw') {
              const loserId = outcome.winner === 'attacker' ? foe.id : me.id;
              if (loserId !== killedId) {
                next = { ...next, units: next.units.map((u) => u.officerId === loserId ? { ...u, troops: Math.round(u.troops * 0.82) } : u) };
              }
            } else {
              next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, troops: Math.round(u.troops * 0.9) } : u) };
            }
            // 車輪戰 — both surviving fighters open any next bout more winded.
            next = { ...next, units: next.units.map((u) => (u.officerId === me.id || u.officerId === foe.id) ? { ...u, duelFatigue: (u.duelFatigue ?? 0) + 24 } : u) };
            startBattleUpdate(next);
            if (killedId && killedId === foe.id) setCaptureChoice({ id: foe.id, name: foe.name });
          }}
        />
      )}

      {/* 斬/擒 — choose the defeated foe's fate. */}
      {captureChoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1400 }}>
          <div style={{ width: 'min(420px,92vw)', background: 'linear-gradient(160deg,#241a10,#140d06)', border: '1px solid #e6c473', padding: '1.4rem', textAlign: 'center', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3' }}>
            <div style={{ fontSize: '1.4rem', color: '#f2dd9a', marginBottom: '0.3rem' }}>{captureChoice.name.zh} 已敗於你劍下!</div>
            <div style={{ fontSize: '0.85rem', color: '#aab6c0', marginBottom: '1.2rem' }}>斬之以絕後患,還是生擒以圖招攬?</div>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={() => { const b = useGameStore.getState().tacticalBattle; if (b) startBattleUpdate({ ...b, forcedKills: [...(b.forcedKills ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🗡 斬</button>
              <button
                onClick={() => { const b = useGameStore.getState().tacticalBattle; if (b) startBattleUpdate({ ...b, forcedCaptures: [...(b.forcedCaptures ?? []), captureChoice.id] }); setCaptureChoice(null); }}
                style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(180deg,#2a4a2a,#16301a)', border: '1px solid #86f29a', color: '#d0ffd8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.05rem', letterSpacing: '0.1rem' }}
              >🪢 生擒</button>
            </div>
          </div>
        </div>
      )}

      {/* 軍令提示 — with a column selected, spell out what a tap does. The
          orders existed but were invisible; this makes them discoverable. */}
      <ArmyOrdersHint />

      {selectedPortId && (
        <PortPanel
          portId={selectedPortId}
          onClose={() => setSelectedPortId(null)}
        />
      )}
      {selectedFortId && (
        <FortPanel
          fortId={selectedFortId}
          onClose={() => setSelectedFortId(null)}
        />
      )}
      {selectedTribeId && (
        <TribePanel
          tribeId={selectedTribeId}
          onClose={() => setSelectedTribeId(null)}
        />
      )}
      {selectedSiteId && (
        <SitePanel
          siteId={selectedSiteId}
          onClose={() => setSelectedSiteId(null)}
        />
      )}
      {selectedScenicId && (
        <ScenicPanel
          siteId={selectedScenicId}
          onClose={() => setSelectedScenicId(null)}
        />
      )}
      {showStockadeBuild && (
        <BuildStockadePicker onClose={() => setShowStockadeBuild(false)} />
      )}
    </div>
  );
}
