/**
 * 戰場質感 — procedural surface textures for the battlefield.
 *
 * The battle scene ships no image assets; every surface is a flat-coloured
 * meshStandardMaterial, which reads as plastic. Here we synthesise tiling
 * normal + roughness maps from fractal value-noise on a canvas, once, and
 * cache them. Feeding these into the terrain/armour materials breaks up the
 * flat shading so light grazes across real-feeling grain.
 */
import * as THREE from 'three';

/** Small deterministic PRNG so the grain is identical across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tiling fractal value-noise heightfield in [0,1], size×size. */
function fractalHeight(size: number, seed: number): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  for (let cells = 4; cells <= size / 2; cells *= 2) {
    const rnd = mulberry32(seed + cells * 9173);
    const grid = new Float32Array((cells + 1) * (cells + 1));
    for (let i = 0; i < grid.length; i++) grid[i] = rnd();
    // wrap edges so the octave tiles seamlessly
    for (let y = 0; y <= cells; y++) grid[y * (cells + 1) + cells] = grid[y * (cells + 1)];
    for (let x = 0; x <= cells; x++) grid[cells * (cells + 1) + x] = grid[x];
    const scale = cells / size;
    for (let y = 0; y < size; y++) {
      const fy = y * scale, gy = Math.floor(fy), ty = fy - gy;
      for (let x = 0; x < size; x++) {
        const fx = x * scale, gx = Math.floor(fx), tx = fx - gx;
        const a = grid[gy * (cells + 1) + gx], b = grid[gy * (cells + 1) + gx + 1];
        const c = grid[(gy + 1) * (cells + 1) + gx], d = grid[(gy + 1) * (cells + 1) + gx + 1];
        const top = a + (b - a) * tx, bot = c + (d - c) * tx;
        out[y * size + x] += (top + (bot - top) * ty) * amp;
      }
    }
    total += amp;
    amp *= 0.55;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function canvasFromRGBA(size: number, data: Uint8ClampedArray): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  return cv;
}

const SIZE = 256;
let heightCache: Float32Array | null = null;
function height(): Float32Array {
  if (!heightCache) heightCache = fractalHeight(SIZE, 1337);
  return heightCache;
}

let normalTex: THREE.CanvasTexture | null = null;
/** Tiling tangent-space normal map derived from the noise heightfield. */
export function groundNormalTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  if (normalTex) return normalTex;
  const h = height();
  const s = SIZE;
  const px = new Uint8ClampedArray(s * s * 4);
  const strength = 2.2;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const l = h[y * s + ((x - 1 + s) % s)], r = h[y * s + ((x + 1) % s)];
      const u = h[((y - 1 + s) % s) * s + x], d = h[((y + 1) % s) * s + x];
      const nx = (l - r) * strength, ny = (u - d) * strength, nz = 1;
      const inv = 1 / Math.hypot(nx, ny, nz);
      const i = (y * s + x) * 4;
      px[i] = (nx * inv * 0.5 + 0.5) * 255;
      px[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      px[i + 2] = (nz * inv * 0.5 + 0.5) * 255;
      px[i + 3] = 255;
    }
  }
  normalTex = new THREE.CanvasTexture(canvasFromRGBA(s, px));
  normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.needsUpdate = true;
  return normalTex;
}

let roughTex: THREE.CanvasTexture | null = null;
/** Tiling grayscale roughness map — slightly polished where the soil is high. */
export function groundRoughnessTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;
  if (roughTex) return roughTex;
  const h = height();
  const s = SIZE;
  const px = new Uint8ClampedArray(s * s * 4);
  for (let i = 0; i < s * s; i++) {
    const v = (0.55 + h[i] * 0.45) * 255;  // never fully smooth
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    px[i * 4 + 3] = 255;
  }
  roughTex = new THREE.CanvasTexture(canvasFromRGBA(s, px));
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.needsUpdate = true;
  return roughTex;
}
