/**
 * Phase 3a — Territory color overlay for the 2D strategic map.
 *
 * Renders a Voronoi-by-territory fill onto an offscreen canvas, then
 * blits it under the city layer. The compute is a brute-force nearest
 * search per pixel — fine because we only recompute when ownership
 * actually changes (signature-cached).
 */

import type { City, EntityId, Force } from '../../game/types';
import { generateTerritories, type Territory } from '../../game/data/territories';

const W = 1000;
const H = 720;
const NEUTRAL_COLOR = '#5a4530';
const FILL_ALPHA = 0.45;
const EDGE_ALPHA = 0.75;

let cachedCanvas: HTMLCanvasElement | null = null;
let cachedSignature = '';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function buildSignature(
  territories: Territory[],
  cities: Record<EntityId, City>,
): string {
  // Signature = ownership of each parent city (other state — names, coords
  // — is constant within a session). Re-computed whenever this string
  // changes; otherwise we blit the cached canvas as-is.
  const parts: string[] = [];
  for (const t of territories) {
    const c = cities[t.parentCityId];
    parts.push(c?.ownerForceId ?? '_');
  }
  return parts.join('|');
}

/**
 * Compute the territory color buffer at full resolution. Each pixel is
 * assigned to its nearest territory; the cell takes its owning force
 * colour at FILL_ALPHA.
 */
function computeOverlay(
  territories: Territory[],
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
): HTMLCanvasElement {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d', { willReadFrequently: false });
  if (!octx) return off;
  const img = octx.createImageData(W, H);
  const px = img.data;

  // Pre-resolve each territory's RGB triple — avoids a hex parse per pixel.
  const colorRgb: Array<[number, number, number]> = territories.map((t) => {
    const city = cities[t.parentCityId];
    const force = city?.ownerForceId ? forces[city.ownerForceId] : null;
    return hexToRgb(force?.color ?? NEUTRAL_COLOR);
  });
  // Group by parent city — the EDGE is between cells with *different
  // parent forces*, not between same-force sub-cells of the same city.
  const forceKey: string[] = territories.map((t) => {
    const city = cities[t.parentCityId];
    return city?.ownerForceId ?? '_';
  });
  const tx = territories.map((t) => t.coords.x);
  const ty = territories.map((t) => t.coords.y);
  const a = Math.round(FILL_ALPHA * 255);
  const edgeA = Math.round(EDGE_ALPHA * 255);

  // Pass 1: assign each pixel to its nearest territory + paint fill colour.
  // Save the assigned key in a side buffer so pass 2 can compute borders.
  const keyBuf = new Uint16Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let bestIdx = 0;
      let bestD = Infinity;
      for (let i = 0; i < territories.length; i++) {
        const dx = x - tx[i];
        const dy = y - ty[i];
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
      keyBuf[y * W + x] = bestIdx;
      const [r, g, b] = colorRgb[bestIdx];
      const offset = (y * W + x) * 4;
      px[offset] = r;
      px[offset + 1] = g;
      px[offset + 2] = b;
      px[offset + 3] = a;
    }
  }
  // Pass 2: paint dark borders wherever the assigned force differs from
  // a neighbour. Borders only on inter-force boundaries — same-force
  // city sub-territories merge into one visible block.
  for (let y = 1; y < H; y++) {
    for (let x = 1; x < W; x++) {
      const here = forceKey[keyBuf[y * W + x]];
      const left = forceKey[keyBuf[y * W + (x - 1)]];
      const up = forceKey[keyBuf[(y - 1) * W + x]];
      if (here !== left || here !== up) {
        const offset = (y * W + x) * 4;
        // Dark warm-brown edge that reads against any force colour.
        px[offset] = 25;
        px[offset + 1] = 18;
        px[offset + 2] = 10;
        px[offset + 3] = edgeA;
      }
    }
  }
  octx.putImageData(img, 0, 0);
  return off;
}

/**
 * Get the cached Voronoi canvas, recomputing only if ownership has
 * changed. Used by both the 2D paint helper below and the 3D map's
 * ground-plane texture (so both views share the same image).
 */
export function getTerritoryCanvas(
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
): HTMLCanvasElement {
  const cityList = Object.values(cities);
  const territories = generateTerritories(cityList);
  const sig = buildSignature(territories, cities);
  if (!cachedCanvas || sig !== cachedSignature) {
    cachedCanvas = computeOverlay(territories, cities, forces);
    cachedSignature = sig;
  }
  return cachedCanvas;
}

/** Signature the ownership-keyed cache uses — exposed so the 3D map can
 *  decide whether to rebuild its CanvasTexture this frame. */
export function getTerritorySignature(
  cities: Record<EntityId, City>,
): string {
  const territories = generateTerritories(Object.values(cities));
  return buildSignature(territories, cities);
}

/**
 * Paint the territory overlay onto the main canvas. Cached on
 * ownership signature so this is essentially free once warmed up.
 */
export function drawTerritoryOverlay(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
) {
  ctx.drawImage(getTerritoryCanvas(cities, forces), 0, 0);
}
