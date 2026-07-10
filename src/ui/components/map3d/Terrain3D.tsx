/* 地形與領土底層 — split out of StrategicMap3D.tsx (2026-07).
   Procedural terrain/normal/water-mask textures (time-sliced builders +
   warmStrategicAssets prewarm), the territory tint layer, and the ground
   mesh. Pure world-floor concerns; no HUD. */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { getTerritoryCanvas, getTerritorySignature } from '../territoryOverlay';
import { MAP_W as PX_W, MAP_H as PX_H, WORLD_SCALE } from '../../../game/data/geography';
import type { City, Force } from '../../../game/types';
import { warmHexWorldTiles } from './HexWorld3D';
import { IS_MOBILE, PIXEL_TO_WORLD, MAP_W, MAP_D, landSDF, distToPolyline, RIVERS, LAKES, valueNoise, sampleTerrain } from './shared';

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
export function TerritoryGroundLayer({
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
export function MapTerrain({ onGroundClick }: { onGroundClick?: (px: number, py: number) => void } = {}) {
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

