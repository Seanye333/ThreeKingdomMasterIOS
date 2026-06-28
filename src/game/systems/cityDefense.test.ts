import { describe, it, expect } from 'vitest';
import type { City, Force, Fort } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { siegeFacilityAid } from './combat';
import { planAIFortAssaults } from './aiBuild';
import { endTurn } from './tactical';
import { mkUnit, mkBattle, mkTiles } from '../../test/factories';
import { MAP_W, MAP_H } from '../data/geography';

// ───────────────────────── Batch A — 城戍助守 (siegeFacilityAid) ─────────────

const mkFort = (over: Partial<Fort> & { id: string }): Fort => ({
  name: { zh: over.id, en: over.id },
  subtype: 'stockade',
  coords: { lon: 100, lat: 30 },
  ownerForceId: 'D',
  hp: 300,
  maxHp: 300,
  guards: ['c1'],
  ...over,
} as Fort);

describe('§5.5 城戍助守 — forts lend to the abstract siege', () => {
  it('a 箭樓 guarding the city shells the besieger and adds overwatch', () => {
    const aid = siegeFacilityAid({ f: mkFort({ id: 'f', facility: 'tower' }) }, 'D', 'c1');
    expect(aid.count).toBe(1);
    expect(aid.prestrike).toBeGreaterThan(0); // a volley off the storming column
    expect(aid.defenderMul).toBeGreaterThan(1); // sustained overwatch
    expect(aid.garrison).toBe(0);
    expect(aid.defenseAdd).toBe(0);
  });

  it('a 陣 musters extra garrison; a 防壁 stiffens the wall', () => {
    const camp = siegeFacilityAid({ f: mkFort({ id: 'f', facility: 'camp' }) }, 'D', 'c1');
    expect(camp.garrison).toBeGreaterThan(0);
    expect(camp.prestrike).toBe(0);
    const wall = siegeFacilityAid({ f: mkFort({ id: 'f', facility: 'wall' }) }, 'D', 'c1');
    expect(wall.defenseAdd).toBeGreaterThan(0);
  });

  it('only DEFENDER-owned forts that actually GUARD this city, and only if intact', () => {
    const tower = (over: Partial<Fort>) => ({ f: mkFort({ id: 'f', facility: 'tower', ...over }) });
    expect(siegeFacilityAid(tower({ ownerForceId: 'A' }), 'D', 'c1').count).toBe(0); // enemy's fort
    expect(siegeFacilityAid(tower({ guards: ['elsewhere'] }), 'D', 'c1').count).toBe(0); // guards another city
    expect(siegeFacilityAid(tower({ hp: 0 }), 'D', 'c1').count).toBe(0); // razed
    expect(siegeFacilityAid(undefined, 'D', 'c1').count).toBe(0);
    expect(siegeFacilityAid(tower({}), null, 'c1').count).toBe(0); // no defender force
  });

  it('a higher-level tower lends more', () => {
    const lv1 = siegeFacilityAid({ f: mkFort({ id: 'f', facility: 'tower', level: 1, hp: 300 }) }, 'D', 'c1');
    const lv3 = siegeFacilityAid({ f: mkFort({ id: 'f', facility: 'tower', level: 3, hp: 600 }) }, 'D', 'c1');
    expect(lv3.prestrike).toBeGreaterThan(lv1.prestrike);
    expect(lv3.defenderMul).toBeGreaterThan(lv1.defenderMul);
  });
});

// ───────────────────────── Batch B — AI 識城防 (raze priority) ───────────────

const NO_DIPLO = { relations: {} } as DiplomaticState;
const mkCity = (over: Partial<City> & { id: string }): City => ({
  ownerForceId: null, troops: 8000, gold: 2000, defense: 20, population: 100_000,
  adjacentCityIds: [], coords: { x: 500, y: 360 }, name: { zh: over.id, en: over.id }, ...over,
} as unknown as City);
const mkForce = (over: Partial<Force> & { id: string }): Force => ({
  name: { zh: over.id, en: over.id }, color: '#abcdef', capitalCityId: 'cap', personality: 'defensive', ...over,
} as unknown as Force);
const fortAtPx = (over: Partial<Fort> & { id: string; px: number; py: number }): Fort => {
  const lon = 96 + (over.px / MAP_W) * 29;
  const lat = 43 - (over.py / MAP_H) * 26;
  const { px: _px, py: _py, ...rest } = over;
  return { name: { zh: over.id, en: over.id }, subtype: 'stockade', coords: { lon, lat },
    ownerForceId: null, hp: 300, maxHp: 300, guards: [], ...rest } as Fort;
};

describe('§5.5 AI 識城防 — the AI razes the most threatening fort first', () => {
  it('goes for the ranged 箭樓 over a plain palisade, even when the palisade is nearer', () => {
    const out = planAIFortAssaults({
      cities: {
        h: mkCity({ id: 'h', ownerForceId: 'AI', troops: 10_000, coords: { x: 500, y: 360 } }),
        mine: mkCity({ id: 'mine', ownerForceId: 'P' }),
      },
      forces: { AI: mkForce({ id: 'AI', capitalCityId: 'h' }), P: mkForce({ id: 'P', capitalCityId: 'mine' }) },
      forts: {
        // The palisade sits CLOSER (px 510) than the tower (px 520) — nearest-first
        // would raze the palisade; the 識城防 bias goes for the tower that shells it.
        plain: fortAtPx({ id: 'plain', px: 510, py: 360, ownerForceId: 'P', hp: 600, maxHp: 600, guards: ['mine'] }),
        tower: fortAtPx({ id: 'tower', px: 520, py: 360, facility: 'tower', ownerForceId: 'P', hp: 600, maxHp: 600, guards: ['mine'] }),
      },
      diplomacy: NO_DIPLO,
      playerForceId: 'P',
      rng: () => 0.01,
    });
    expect(out.forts['tower'].hp).toBeLessThan(600); // the tower took the assault
    expect(out.forts['plain'].hp).toBe(600);         // the palisade was passed over
  });
});

// ───────────────────────── Batch D — 投石臺 splash on the hex map ─────────────

describe('§5.5 投石臺 vs 箭樓 — a catapult scatters, a tower picks one mark', () => {
  const battleWith = (buildingId: 'arrow-platform' | 'watchtower') => mkBattle({
    units: [
      mkUnit({ id: 'a1', officerId: 'oa1', side: 'attacker', coord: { col: 10, row: 5 }, troops: 5000 }),
      mkUnit({ id: 'a2', officerId: 'oa2', side: 'attacker', coord: { col: 9, row: 5 }, troops: 5000 }), // adjacent to a1
      mkUnit({ id: 'd1', officerId: 'od1', side: 'defender', coord: { col: 2, row: 5 }, troops: 5000 }),
    ],
    tiles: mkTiles(18, 12), width: 18, height: 12, activeSide: 'attacker',
    cityStructures: [{ slotIndex: 0, buildingId, level: 1, coord: { col: 12, row: 5 }, hp: 400 }],
  });

  it('投石臺 splashes half-damage onto a unit beside the primary target', () => {
    const next = endTurn(battleWith('arrow-platform'));
    const a1 = next.units.find((u) => u.id === 'a1')!;
    const a2 = next.units.find((u) => u.id === 'a2')!;
    expect(a1.troops).toBeLessThan(5000);          // primary target hit
    expect(a2.troops).toBeLessThan(5000);          // neighbour caught the splash
    expect(5000 - a2.troops).toBeLessThan(5000 - a1.troops); // splash is the lesser blow
  });

  it('箭樓 strikes a single mark — the neighbour is untouched', () => {
    const next = endTurn(battleWith('watchtower'));
    const a1 = next.units.find((u) => u.id === 'a1')!;
    const a2 = next.units.find((u) => u.id === 'a2')!;
    expect(a1.troops).toBeLessThan(5000);  // the one mark
    expect(a2.troops).toBe(5000);          // no scatter
  });
});
