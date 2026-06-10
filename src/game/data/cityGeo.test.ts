import { describe, it, expect } from 'vitest';
import { CITY_GEO_OVERRIDES, cityPixel, cityPos } from './cityGeo';
import { buildInitialCities, marchDurationFor } from './cities';
import { isLand } from './geography';

const cities = buildInitialCities({});
const byId = Object.fromEntries(cities.map((c) => [c.id, c]));

describe('unified geo distance system', () => {
  it('every city has a geo override — nothing falls back to painted-map px', () => {
    const missing = cities.filter((c) => !CITY_GEO_OVERRIDES[c.id]).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it('cityPixel projects every city inside the 1000×720 map, on land', () => {
    for (const c of cities) {
      const [x, y] = cityPixel(c.id, c.coords.x, c.coords.y);
      expect(x, c.id).toBeGreaterThanOrEqual(0);
      expect(x, c.id).toBeLessThanOrEqual(1000);
      expect(y, c.id).toBeGreaterThanOrEqual(0);
      expect(y, c.id).toBeLessThanOrEqual(720);
      // margin −2: coastal cities may brush the shoreline by a pixel
      expect(isLand(x, y, -2), `${c.id} at ${x.toFixed(0)},${y.toFixed(0)} should be on land`).toBe(true);
    }
  });

  it('no two cities overlap on the map (de-cluster floor holds)', () => {
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const a = cityPos(cities[i]);
        const b = cityPos(cities[j]);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d, `${cities[i].id} ↔ ${cities[j].id}`).toBeGreaterThan(12);
      }
    }
  });

  it('all adjacent marches resolve to 1–4 seasons', () => {
    for (const c of cities) {
      for (const adj of c.adjacentCityIds) {
        const to = byId[adj];
        if (!to) continue;
        const dur = marchDurationFor(c, to);
        expect(dur, `${c.id}→${adj}`).toBeGreaterThanOrEqual(1);
        expect(dur, `${c.id}→${adj}`).toBeLessThanOrEqual(4);
      }
    }
  });

  it('march durations reflect real geography (sample pairs)', () => {
    const dur = (a: string, b: string) => marchDurationFor(byId[a], byId[b]);
    // Close central-plains neighbours — quick hops.
    expect(dur('xuchang', 'luoyang')).toBe(1);
    expect(dur('xiangyang', 'fancheng')).toBe(1);
    expect(dur('chengdu', 'luocheng')).toBe(1);
    expect(dur('taiyuan', 'luoyang')).toBe(1);
    // Medium rides.
    expect(dur('beiping', 'ye')).toBe(2);
    expect(dur('changan', 'hanzhong')).toBe(2);  // across 秦岭 via the pass roads
    expect(dur('liaodong', 'beiping')).toBe(2);
    // Long hauls across real mountains/distance.
    expect(dur('hanzhong', 'xiangyang')).toBe(3);
    expect(dur('jiaozhi', 'nanhai')).toBe(3);
    expect(dur('hanzhong', 'wancheng')).toBe(4); // across 秦岭/武当, genuinely far
  });

  it('無錫 sits in 江東 next to 吳, not in the gorges (regression: mislabel)', () => {
    const wuxi = cityPos(byId['wuxi']);
    const wu = cityPos(byId['wu']);
    const yongan = cityPos(byId['yongan']);
    expect(Math.hypot(wuxi.x - wu.x, wuxi.y - wu.y)).toBeLessThan(60);
    expect(Math.hypot(wuxi.x - yongan.x, wuxi.y - yongan.y)).toBeGreaterThan(200);
  });
});
