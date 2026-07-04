import { describe, it, expect } from 'vitest';
import { scarsFromBattle, pruneScars, worldScarKey, SCAR_TTL } from './worldScars';
import { battleWindow, generateTerrain, type BattleGeo } from './battlefieldTerrain';
import { cityPos } from '../data/cityGeo';
import { buildInitialCities } from '../data/cities';
import type { TacticalBattle } from '../types';

const W = 18, H = 12;
const byId = Object.fromEntries(buildInitialCities({}).map((c) => [c.id, c]));

function geoFor(cityId: string, bearing = 0): BattleGeo {
  const p = cityPos(byId[cityId]);
  return { x: p.x, y: p.y, bearing, anchorCol: W - 2 };
}

function fakeBattle(geo: BattleGeo, scarTiles: TacticalBattle['terrainScars']): TacticalBattle {
  return {
    id: 'b1', cityId: 'xiangyang',
    attackerForceId: 'a', defenderForceId: 'd',
    width: W, height: H, tiles: [], units: [], turn: 5,
    activeSide: 'attacker', stratagemCooldowns: {},
    attackerLosses: 0, defenderLosses: 0,
    weather: 'clear', timeOfDay: 'day',
    geoAnchor: { x: geo.x, y: geo.y, bearing: geo.bearing, anchorCol: geo.anchorCol },
    terrainScars: scarTiles,
  } as TacticalBattle;
}

describe('worldScars — battles carve lasting marks into the world lattice', () => {
  it('maps a battle-tile scar back to the exact world hex the tile sampled', () => {
    const geo = geoFor('xiangyang');
    const { anchorCol, anchorRow, flip, anchor } = battleWindow(geo, W, H);
    const b = fakeBattle(geo, [{ coord: { col: 4, row: 6 }, kind: 'burned-forest' }]);
    const scars = scarsFromBattle(b, 800);
    const wc = anchor.col + flip * (4 - anchorCol);
    const wr = anchor.row + (6 - anchorRow);
    expect(scars[worldScarKey(wc, wr)]).toEqual({ kind: 'scorched', t: 800 });
  });

  it('practice drills leave no scars', () => {
    const b = { ...fakeBattle(geoFor('xiangyang'), [{ coord: { col: 1, row: 1 }, kind: 'burned-forest' }]), practice: true };
    expect(Object.keys(scarsFromBattle(b, 800))).toHaveLength(0);
  });

  it('scars heal after their TTL at the season prune', () => {
    const scars = { '10,10': { kind: 'scorched' as const, t: 100 } };
    expect(pruneScars(scars, 100 + SCAR_TTL.scorched)).toBe(scars);          // still there
    expect(pruneScars(scars, 101 + SCAR_TTL.scorched)).toEqual({});          // healed
  });

  it('a NEW battle over scorched ground inherits the scar — the wood is gone', () => {
    const geo = geoFor('xiangyang', Math.PI / 3);
    const clean = generateTerrain('xiangyang', W, H, {}, undefined, geo);
    const forestTile = clean.find((t) => t.terrain === 'forest');
    expect(forestTile).toBeTruthy(); // the Xiangyang window grows wood
    const { anchorCol, anchorRow, flip, anchor } = battleWindow(geo, W, H);
    const wc = anchor.col + flip * (forestTile!.coord.col - anchorCol);
    const wr = anchor.row + (forestTile!.coord.row - anchorRow);
    const scarred = generateTerrain('xiangyang', W, H, {}, undefined, geo, {
      [worldScarKey(wc, wr)]: { kind: 'scorched', t: 1 },
    });
    const same = scarred.find((t) => t.coord.col === forestTile!.coord.col && t.coord.row === forestTile!.coord.row)!;
    expect(same.terrain).not.toBe('forest');
  });
});
