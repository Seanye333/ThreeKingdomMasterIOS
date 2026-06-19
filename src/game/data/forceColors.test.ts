import { describe, it, expect } from 'vitest';
import { distinctForceColors, FORCE_PALETTE } from './forceColors';
import { SCENARIOS } from './scenarios';

function hueOf(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60; if (hue < 0) hue += 360;
  return hue;
}

describe('distinct force colours', () => {
  it('palette itself is collision-free and terrain-avoiding (no greens)', () => {
    expect(new Set(FORCE_PALETTE).size).toBe(FORCE_PALETTE.length);
    for (const c of FORCE_PALETTE) {
      const hue = hueOf(c);
      // green band ~80–165° is the terrain; palette must avoid it
      expect(hue < 80 || hue > 165, `${c} (hue ${hue.toFixed(0)}) sits in the green band`).toBe(true);
    }
  });

  it('every scenario re-colours its forces to be mutually distinct', () => {
    for (const sc of SCENARIOS) {
      const recoloured = distinctForceColors(sc.forces);
      const colours = recoloured.map((f) => f.color);
      expect(new Set(colours).size, `${sc.id} has colour collisions`).toBe(colours.length);
    }
  });

  it('keeps a force close to its canonical hue where it can (曹操 stays blue-ish)', () => {
    const guandu = SCENARIOS.find((s) => s.id === 'guandu' || s.forces.some((f) => f.id === 'cao'));
    if (!guandu) return;
    const recoloured = distinctForceColors(guandu.forces);
    const cao = recoloured.find((f) => f.id === 'cao');
    if (cao) {
      const hue = hueOf(cao.color);
      expect(hue > 180 && hue < 260, `Cao Cao hue ${hue.toFixed(0)} should stay blue`).toBe(true);
    }
  });

  it('the player force is recoloured deterministically (pure)', () => {
    const sc = SCENARIOS[0];
    const a = distinctForceColors(sc.forces).map((f) => f.color);
    const b = distinctForceColors(sc.forces).map((f) => f.color);
    expect(a).toEqual(b);
  });
});
