/**
 * Phase 3a + hex-grid refit — Territory color overlay for the strategic
 * maps. Renders a crisp RTK-XIV-style hexagonal grid onto an offscreen
 * canvas: every hex is filled by its owning force and outlined, giving a
 * sharp grid instead of the old soft Voronoi blob. Signature-cached so
 * it only recomputes when ownership changes; shared by 2D and 3D.
 */

import type { City, EntityId, Force } from '../../game/types';
import { generateTerritories, type Territory } from '../../game/data/territories';
import { isLand } from '../../game/data/geography';

const W = 1000;
const H = 720;
const NEUTRAL_COLOR = '#5a4530';
const FILL_ALPHA = 0.4;

// Hex grid geometry (pointy-top). HEX_SIZE = centre→corner.
const HEX_SIZE = 19;
const SQRT3 = Math.sqrt(3);
const HEX_W = SQRT3 * HEX_SIZE;        // horizontal centre spacing
const HEX_V = 1.5 * HEX_SIZE;          // vertical centre spacing

let cachedCanvas: HTMLCanvasElement | null = null;
let cachedSignature = '';

/** Six pointy-top corners of a hex centred at (cx, cy). */
function hexCorners(cx: number, cy: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + HEX_SIZE * Math.cos(ang), cy + HEX_SIZE * Math.sin(ang)]);
  }
  return pts;
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
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

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

  // Build the hex grid, tagging each hex with the owner of its nearest
  // territory (or null if none is within PAINT_RADIUS_2).
  type Hex = { cx: number; cy: number; owner: EntityId | null; painted: boolean };
  const grid: Hex[][] = [];
  for (let row = -1, y = -HEX_V; y < H + HEX_SIZE; row++, y = row * HEX_V) {
    const xOff = (((row % 2) + 2) % 2) * (HEX_W / 2);
    const line: Hex[] = [];
    for (let col = -1, x = -HEX_W + xOff; x < W + HEX_W; col++, x = col * HEX_W + xOff) {
      // Only land hexes paint — the SE ocean wedge stays clear. Whole
      // landmass is divided among forces by nearest-territory (Voronoi),
      // RTK-XIV style, instead of small blobs around each city.
      const onLand = isLand(x, y, 2);
      let best = -1;
      let bestD = Infinity;
      if (onLand) {
        for (let i = 0; i < territories.length; i++) {
          const dx = x - tx[i];
          const dy = y - ty[i];
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      const painted = onLand && best >= 0;
      line.push({ cx: x, cy: y, owner: painted ? ownerOf[best] : null, painted });
    }
    grid.push(line);
  }

  // Pass 1 — fills + thin per-hex grid line.
  ctx.lineJoin = 'round';
  for (const line of grid) {
    for (const h of line) {
      if (!h.painted) continue;
      const c = hexCorners(h.cx, h.cy);
      ctx.beginPath();
      ctx.moveTo(c[0][0], c[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(c[i][0], c[i][1]);
      ctx.closePath();
      ctx.globalAlpha = FILL_ALPHA;
      ctx.fillStyle = colorOf(h.owner);
      ctx.fill();
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#1a120a';
      ctx.stroke();
    }
  }

  // Pass 2 — bold frontier seams. For each painted hex, draw a heavier
  // outline if any of its 6 odd-r neighbours has a different owner. Same
  // -force interiors keep only the thin grid line from pass 1.
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2.25;
  ctx.strokeStyle = '#140d06';
  for (let r = 0; r < grid.length; r++) {
    const even = r % 2 === 0;
    // odd-r offset neighbour deltas
    const deltas = even
      ? [[+1, 0], [-1, 0], [0, -1], [-1, -1], [0, +1], [-1, +1]]
      : [[+1, 0], [-1, 0], [+1, -1], [0, -1], [+1, +1], [0, +1]];
    for (let q = 0; q < grid[r].length; q++) {
      const h = grid[r][q];
      if (!h.painted) continue;
      let frontier = false;
      for (const [dq, dr] of deltas) {
        const nb = grid[r + dr]?.[q + dq];
        if (!nb || !nb.painted || nb.owner !== h.owner) { frontier = true; break; }
      }
      if (!frontier) continue;
      const c = hexCorners(h.cx, h.cy);
      ctx.beginPath();
      ctx.moveTo(c[0][0], c[0][1]);
      for (let i = 1; i < 6; i++) ctx.lineTo(c[i][0], c[i][1]);
      ctx.closePath();
      ctx.stroke();
    }
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
  ctx.drawImage(getTerritoryCanvas(cities, forces, territoryOwnership), 0, 0);
}
