import type { Force } from '../types';

/**
 * 勢力配色 — the scenario data hard-codes a colour per force, but those collide
 * (曹操 and 皇甫嵩 were the same blue) and several sit on the terrain's green
 * (孫堅), so realms blur together on the map. At load we re-assign each
 * scenario's forces from a curated, high-contrast, terrain-avoiding palette —
 * greedily picking the unused swatch nearest each force's canonical colour, so
 * 曹 stays blue-ish, 袁 red-ish… while no two realms ever look alike and none
 * vanish into the grass.
 */

/** Distinct, saturated, non-green / non-mud colours (terrain is green/brown). */
export const FORCE_PALETTE: string[] = [
  '#3a7dd9', // azure
  '#d8392c', // vermilion
  '#9b3fc4', // purple
  '#e07b1a', // orange
  '#16b8d4', // cyan
  '#d6409a', // magenta
  '#e0b81e', // gold
  '#5b4bd6', // indigo
  '#d11c5a', // crimson
  '#2aa0e0', // sky
  '#e8506b', // rose
  '#7d5fff', // violet
  '#f0992a', // amber
  '#1565c0', // deep blue
  '#b03a8a', // plum
  '#cf5c2e', // burnt orange
  '#00acc1', // teal
  '#ab47bc', // orchid
  '#c2185b', // raspberry
  '#5c6bc0', // periwinkle
  '#e84393', // pink
  '#d35400', // pumpkin
  '#8e6fd0', // lavender
  '#c9a227', // brass
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function dist2(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

/** Evenly-spaced fallback hues (skipping the green band) for scenarios that
 *  field more forces than the curated palette holds. */
function extraColor(i: number): string {
  // Hues 0–360 skipping 80–165 (greens). 24 base swatches already cover the
  // common case; this just guarantees we never run out.
  const span = 360 - 85;                 // usable hue arc
  let hue = (i * 47) % span;             // 47° step → well spread
  if (hue >= 80) hue += 85;              // jump over the green band
  const s = 0.62, l = i % 2 ? 0.46 : 0.56;
  // HSL → hex
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Re-colour a scenario's forces: each takes the unused palette swatch nearest
 * its original colour. Player force is coloured FIRST so it always gets the
 * closest match to its canonical hue. Pure — returns new force objects.
 */
export function distinctForceColors(forces: Force[]): Force[] {
  const order = [...forces].sort((a, b) => Number(b.isPlayer) - Number(a.isPlayer));
  const pool = [...FORCE_PALETTE];
  let extra = 0;
  const assigned = new Map<string, string>();
  for (const f of order) {
    if (pool.length === 0) { assigned.set(f.id, extraColor(extra++)); continue; }
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const d = dist2(f.color, pool[i]);
      if (d < bestD) { bestD = d; best = i; }
    }
    assigned.set(f.id, pool[best]);
    pool.splice(best, 1);
  }
  return forces.map((f) => ({ ...f, color: assigned.get(f.id) ?? f.color }));
}
