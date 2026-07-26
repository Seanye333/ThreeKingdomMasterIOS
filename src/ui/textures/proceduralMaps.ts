import * as THREE from 'three';

/**
 * 程序紋理 — normal maps generated at runtime from a height field drawn on a
 * canvas. No image files.
 *
 * The scenes are built entirely from flat-coloured PBR meshes: a wall, a roof
 * and a plank differ only by hue, because there is no surface relief anywhere.
 * With an environment now bound (SkyEnvironment) that flatness reads even more
 * plainly — a perfectly smooth surface reflects the sky like glass.
 *
 * These give the big surfaces a little tooth: tile ridges, brick courses, wood
 * grain, cloth weave. Each is drawn once into a small tiling canvas, converted
 * to a normal map by Sobel, and cached at module level — a few hundred
 * kilobytes of GPU memory for the whole game, versus a texture pack download.
 *
 * ## Tuning
 *
 * Every map is deliberately shallow (`strength` well under 1). Relief that
 * reads correctly on a photo-scanned surface looks like crumpled foil on a
 * 200-triangle roof. If a surface looks noisy, lower the `normalScale` at the
 * call site first — that is a per-material dial and needs no regeneration.
 */

/** Height→normal via Sobel. `strength` scales the slope, not the resolution. */
function heightToNormal(height: Float32Array, size: number, strength: number): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sobel gradients — wrapped, so the map tiles seamlessly.
      const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1))
        - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1))
        - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -dx * strength, ny = -dy * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * size + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** Deterministic value noise so a rebuild looks identical (no Math.random). */
function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

const SIZE = 128;
const cache = new Map<string, THREE.DataTexture>();

function build(key: string, fill: (h: Float32Array) => void, strength: number): THREE.DataTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const h = new Float32Array(SIZE * SIZE);
  fill(h);
  const tex = heightToNormal(h, SIZE, strength);
  cache.set(key, tex);
  return tex;
}

/** 瓦壟 — half-round roof tiles in courses: rounded ridges, a seam per course. */
export function tileNormal(): THREE.DataTexture {
  return build('tile', (h) => {
    const period = 16;      // tile width in texels
    const course = 32;      // course height
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        // Alternate courses offset by half a tile, as laid.
        const row = Math.floor(y / course);
        const ox = row % 2 === 0 ? 0 : period / 2;
        const t = ((x + ox) % period) / period;
        // Half-round barrel across the tile, flattening at the seam.
        const barrel = Math.sin(t * Math.PI) ** 0.7;
        const seam = ((y % course) < 2) ? -0.5 : 0;
        h[y * SIZE + x] = barrel + seam;
      }
    }
  }, 1.6);
}

/** 磚縫 — running-bond brick courses with a recessed mortar joint. */
export function brickNormal(): THREE.DataTexture {
  return build('brick', (h) => {
    const bw = 32, bh = 16, mortar = 2;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const row = Math.floor(y / bh);
        const ox = row % 2 === 0 ? 0 : bw / 2;
        const inX = (x + ox) % bw, inY = y % bh;
        const joint = inX < mortar || inY < mortar;
        // Brick faces bulge very slightly; the joint sits below them.
        const face = 1 - 0.12 * hash2(Math.floor((x + ox) / bw), row);
        h[y * SIZE + x] = joint ? 0 : face;
      }
    }
  }, 1.4);
}

/** 木紋 — grain running along one axis, with occasional knots. */
export function woodNormal(): THREE.DataTexture {
  return build('wood', (h) => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        // Stretched noise = grain; a slow sine adds the growth rings.
        const g = hash2(Math.floor(x / 2), Math.floor(y / 22)) * 0.5
          + Math.sin(x * 0.22 + hash2(0, Math.floor(y / 22)) * 6) * 0.25;
        h[y * SIZE + x] = g;
      }
    }
  }, 0.8);
}

/** 織紋 — plain-weave cloth for banners and tents. */
export function clothNormal(): THREE.DataTexture {
  return build('cloth', (h) => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        // Over-under weave: two out-of-phase square waves.
        const warp = Math.sin(x * Math.PI / 4);
        const weft = Math.sin(y * Math.PI / 4);
        h[y * SIZE + x] = (warp > 0 ? weft : -weft) * 0.5;
      }
    }
  }, 0.7);
}

/** 夯土/地面 — coarse granular ground. */
export function earthNormal(): THREE.DataTexture {
  return build('earth', (h) => {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        h[y * SIZE + x] = hash2(x, y) * 0.6 + hash2(Math.floor(x / 4), Math.floor(y / 4)) * 0.4;
      }
    }
  }, 0.9);
}

/**
 * A repeat-configured clone. Textures are shared, but `repeat` is per-surface,
 * so callers that need different tiling get their own view of the same data.
 */
export function tiled(tex: THREE.DataTexture, repeat: number): THREE.Texture {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.needsUpdate = true;
  return t;
}

/** Release every cached map (called when a GL context is torn down). */
export function disposeProceduralMaps(): void {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
