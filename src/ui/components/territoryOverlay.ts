/**
 * Phase 3a + hex-grid refit — Territory color overlay for the strategic
 * maps. Renders a crisp RTK-XIV-style hexagonal grid onto an offscreen
 * canvas: every hex is filled by its owning force and outlined, giving a
 * sharp grid instead of the old soft Voronoi blob. Signature-cached so
 * it only recomputes when ownership changes; shared by 2D and 3D.
 */

import type { City, EntityId, Force } from '../../game/types';
import { generateTerritories, type Territory } from '../../game/data/territories';
import { isLand, hexCorners, HEX_W, HEX_V, HEX_SIZE } from '../../game/data/geography';

const W = 1000;
const H = 720;
const SS = 3; // supersample factor for crisp fine-grid lines
const NEUTRAL_COLOR = '#5a4530';
const FILL_ALPHA = 0.42;

let cachedCanvas: HTMLCanvasElement | null = null;
let cachedSignature = '';

/** Lighten a #rrggbb toward white by amount (0..1) — for border cores. */
function lighten(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function buildSignature(
  territories: Territory[],
  cities: Record<EntityId, City>,
  territoryOwnership: Record<EntityId, EntityId | null> = {},
): string {
  // Signature = effective owner of each territory: explicit override
  // (3c — set by march capture) wins, otherwise the parent city's owner.
  const parts: string[] = [];
  for (const t of territories) {
    const override = territoryOwnership[t.id];
    if (override !== undefined && override !== null) {
      parts.push(override);
    } else {
      const c = cities[t.parentCityId];
      parts.push(c?.ownerForceId ?? '_');
    }
  }
  return parts.join('|');
}

/**
 * Render the territory hex grid. Each hex is assigned to its nearest
 * territory's effective owner, filled with that force's colour, and
 * outlined — a thin grid line on every hex, plus a bolder dark edge on
 * the seams between two different forces (the contested frontier).
 */
function computeOverlay(
  territories: Territory[],
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
  territoryOwnership: Record<EntityId, EntityId | null> = {},
): HTMLCanvasElement {
  // Supersample: render at 2× then let drawImage/texture downsample, so the
  // fine grid lines stay crisp instead of blurring when the map is shown
  // smaller than 1000px or stretched over the 3D terrain.
  const off = document.createElement('canvas');
  off.width = W * SS;
  off.height = H * SS;
  const ctx = off.getContext('2d');
  if (!ctx) return off;
  ctx.scale(SS, SS); // draw everything below in logical 1000×720 space

  // Effective owner per territory: 3c override wins, else parent city.
  const tx = territories.map((t) => t.coords.x);
  const ty = territories.map((t) => t.coords.y);
  const ownerOf: Array<EntityId | null> = territories.map((t) => {
    const override = territoryOwnership[t.id];
    if (override !== undefined && override !== null) return override;
    return cities[t.parentCityId]?.ownerForceId ?? null;
  });
  const colorOf = (id: EntityId | null): string =>
    (id ? forces[id]?.color : null) ?? NEUTRAL_COLOR;

  // Spatial hash over territory centroids so the per-hex nearest search is
  // ~O(1) instead of O(territories). Lets the grid go very fine without the
  // recompute cost blowing up.
  const BUCKET = 70;
  const cols = Math.ceil(W / BUCKET) + 2;
  const buckets = new Map<number, number[]>();
  const bkey = (bx: number, by: number) => by * cols + bx;
  for (let i = 0; i < territories.length; i++) {
    const k = bkey(Math.floor(tx[i] / BUCKET) + 1, Math.floor(ty[i] / BUCKET) + 1);
    const arr = buckets.get(k);
    if (arr) arr.push(i); else buckets.set(k, [i]);
  }
  const nearestTerritory = (x: number, y: number): number => {
    const bx = Math.floor(x / BUCKET) + 1;
    const by = Math.floor(y / BUCKET) + 1;
    let best = -1;
    let bestD = Infinity;
    // Expand rings until a candidate is found, then one extra ring to be safe.
    for (let ring = 0; ring <= 6; ring++) {
      for (let dx = -ring; dx <= ring; dx++) {
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const arr = buckets.get(bkey(bx + dx, by + dy));
          if (!arr) continue;
          for (const i of arr) {
            const ddx = x - tx[i];
            const ddy = y - ty[i];
            const d = ddx * ddx + ddy * ddy;
            if (d < bestD) { bestD = d; best = i; }
          }
        }
      }
      if (best >= 0 && ring >= 1) break;
    }
    return best;
  };

  // Build the hex grid, tagging each hex with the owner of its nearest
  // territory. Ocean hexes (off the landmass) stay clear.
  type Hex = { cx: number; cy: number; owner: EntityId | null; painted: boolean };
  const grid: Hex[][] = [];
  for (let row = -1, y = -HEX_V; y < H + HEX_SIZE; row++, y = row * HEX_V) {
    const xOff = (((row % 2) + 2) % 2) * (HEX_W / 2);
    const line: Hex[] = [];
    for (let col = -1, x = -HEX_W + xOff; x < W + HEX_W; col++, x = col * HEX_W + xOff) {
      // Only land hexes paint — the SE ocean wedge stays clear. Whole
      // landmass is divided among forces by nearest-territory (Voronoi),
      // RTK-XIV style.
      const onLand = isLand(x, y, 2);
      const best = onLand ? nearestTerritory(x, y) : -1;
      const painted = onLand && best >= 0;
      line.push({ cx: x, cy: y, owner: painted ? ownerOf[best] : null, painted });
    }
    grid.push(line);
  }

  const tracePath = (cx: number, cy: number) => {
    const c = hexCorners(cx, cy);
    ctx.beginPath();
    ctx.moveTo(c[0][0], c[0][1]);
    for (let i = 1; i < 6; i++) ctx.lineTo(c[i][0], c[i][1]);
    ctx.closePath();
  };

  // Pass 1 — fills + thin per-hex grid line.
  ctx.lineJoin = 'round';
  for (const line of grid) {
    for (const h of line) {
      if (!h.painted) continue;
      tracePath(h.cx, h.cy);
      ctx.globalAlpha = FILL_ALPHA;
      ctx.fillStyle = colorOf(h.owner);
      ctx.fill();
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = '#1a120a';
      ctx.stroke();
    }
  }

  // Collect frontier hexes (any odd-r neighbour has a different owner).
  const frontier: Hex[] = [];
  for (let r = 0; r < grid.length; r++) {
    const even = r % 2 === 0;
    const deltas = even
      ? [[+1, 0], [-1, 0], [0, -1], [-1, -1], [0, +1], [-1, +1]]
      : [[+1, 0], [-1, 0], [+1, -1], [0, -1], [+1, +1], [0, +1]];
    for (let q = 0; q < grid[r].length; q++) {
      const h = grid[r][q];
      if (!h.painted) continue;
      for (const [dq, dr] of deltas) {
        const nb = grid[r + dr]?.[q + dq];
        if (!nb || !nb.painted || nb.owner !== h.owner) { frontier.push(h); break; }
      }
    }
  }

  // Pass 2a — dark base seam under every frontier hex (the "carved" edge).
  ctx.globalAlpha = 0.82;
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#120b05';
  for (const h of frontier) { tracePath(h.cx, h.cy); ctx.stroke(); }

  // Pass 2b — bright force-tinted core on top, so each frontier reads as a
  // crisp coloured border with a dark outline (RTK-style official lines).
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 0.6;
  for (const h of frontier) {
    ctx.strokeStyle = lighten(colorOf(h.owner), 0.45);
    tracePath(h.cx, h.cy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
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
  territoryOwnership: Record<EntityId, EntityId | null> = {},
): HTMLCanvasElement {
  const cityList = Object.values(cities);
  const territories = generateTerritories(cityList);
  const sig = buildSignature(territories, cities, territoryOwnership);
  if (!cachedCanvas || sig !== cachedSignature) {
    cachedCanvas = computeOverlay(territories, cities, forces, territoryOwnership);
    cachedSignature = sig;
  }
  return cachedCanvas;
}

/** Signature the ownership-keyed cache uses — exposed so the 3D map can
 *  decide whether to rebuild its CanvasTexture this frame. */
export function getTerritorySignature(
  cities: Record<EntityId, City>,
  territoryOwnership: Record<EntityId, EntityId | null> = {},
): string {
  const territories = generateTerritories(Object.values(cities));
  return buildSignature(territories, cities, territoryOwnership);
}

/**
 * Paint the territory overlay onto the main canvas. Cached on
 * ownership signature so this is essentially free once warmed up.
 */
export function drawTerritoryOverlay(
  ctx: CanvasRenderingContext2D,
  cities: Record<EntityId, City>,
  forces: Record<EntityId, Force>,
  territoryOwnership: Record<EntityId, EntityId | null> = {},
) {
  // Canvas is supersampled (W*SS × H*SS) — draw it back at logical size.
  ctx.drawImage(getTerritoryCanvas(cities, forces, territoryOwnership), 0, 0, W, H);
}
