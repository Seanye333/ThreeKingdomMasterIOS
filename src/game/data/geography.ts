/**
 * Shared map geography — the China landmass shape, in the same 1000×720
 * pixel space the city coords use. Mirrors the coastline that
 * StrategicMap3D's procedural terrain draws, so the territory hex grid
 * and the 3D terrain agree on where land ends and sea begins.
 *
 * (The coastline data is intentionally duplicated from the 3D terrain
 * module rather than extracted — the 3D file is a large, working
 * procedural system and the ~25-point coastline is cheap to keep in
 * sync by hand. If these ever drift, the hex grid will paint slightly
 * past/short of the rendered coast; adjust here to match.)
 */

export const MAP_W = 1000;
export const MAP_H = 720;

const GEO_LON_MIN = 96, GEO_LON_MAX = 125;
const GEO_LAT_MIN = 17, GEO_LAT_MAX = 43;
const GEO_LAT_SPAN = GEO_LAT_MAX - GEO_LAT_MIN;

export function geoToPixel(lon: number, lat: number): [number, number] {
  const px = ((lon - GEO_LON_MIN) / (GEO_LON_MAX - GEO_LON_MIN)) * MAP_W;
  const py = (1 - (lat - GEO_LAT_MIN) / (GEO_LAT_MAX - GEO_LAT_MIN)) * MAP_H;
  return [px, py];
}

/** Eastern coastline longitude as a function of latitude. */
function coastLonAt(lat: number): number {
  const pts: [number, number][] = [
    [43, 124], [42, 124], [41, 124],
    [40, 121.5], [39.5, 122], [39, 118.5], [38, 117.5],
    [37.5, 122.5], [36, 121], [35, 120.5],
    [33, 121], [32, 121.5], [31, 122], [30, 122], [29, 121.5],
    [28, 121.5], [26, 120], [24, 118], [23, 117],
    [22, 114], [21.5, 111], [21, 110], [20, 110], [18, 110], [17, 110],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    if (lat <= pts[i][0] && lat >= pts[i + 1][0]) {
      const t = (pts[i][0] - lat) / (pts[i][0] - pts[i + 1][0] || 1);
      return pts[i][1] * (1 - t) + pts[i + 1][1] * t;
    }
  }
  return 122;
}

/** X pixel of the eastern coast at a given screen Y. */
function coastXAt(y: number): number {
  const lat = GEO_LAT_MAX - (y / MAP_H) * GEO_LAT_SPAN;
  const [px] = geoToPixel(coastLonAt(lat), lat);
  return px;
}

/**
 * Signed distance to the land boundary in pixels: positive = inland,
 * negative = at sea. Land is bounded on the east by the coastline and
 * on the south by the map edge; north and west run to the map border.
 */
export function landSDF(x: number, y: number): number {
  const distEast = coastXAt(y) - x;
  const distSouth = MAP_H - y;
  return Math.min(distEast, distSouth);
}

/** True if the pixel is on land (with an optional inland margin). */
export function isLand(x: number, y: number, margin = 0): boolean {
  return landSDF(x, y) > margin;
}

// ── Hex grid geometry (pointy-top, odd-r offset) ──────────────────
// Shared by the territory overlay (which draws the grid) and the army
// movement code (which snaps units to hex centres), so they always
// agree on cell positions.
// Fine RTK-XIV-style grid: ~116 hexes across the 1000px map width.
export const HEX_SIZE = 5;                        // centre → corner
export const HEX_W = Math.sqrt(3) * HEX_SIZE;     // horizontal spacing
export const HEX_V = 1.5 * HEX_SIZE;              // vertical (row) spacing

/** Six pointy-top corners of the hex centred at (cx, cy). */
export function hexCorners(cx: number, cy: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + HEX_SIZE * Math.cos(ang), cy + HEX_SIZE * Math.sin(ang)]);
  }
  return pts;
}

/**
 * Snap an arbitrary pixel to the centre of the hex that contains it,
 * on the same odd-r grid the overlay draws. Used to make marching units
 * sit on cells and step cell-to-cell instead of gliding.
 */
export function snapToHexCenter(px: number, py: number): { x: number; y: number } {
  const r = Math.round(py / HEX_V);
  const xOff = (((r % 2) + 2) % 2) === 1 ? HEX_W / 2 : 0;
  const q = Math.round((px - xOff) / HEX_W);
  return { x: q * HEX_W + xOff, y: r * HEX_V };
}
