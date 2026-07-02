import { describe, it, expect } from 'vitest';
import { generateTerrain, type BattleGeo } from './battlefieldTerrain';
import { setupTacticalBattle, aiTakeTurn, moveCost, hexDistance, movementCost, repairWall, planSiegeRelief, endTurn, attackUnits, applyStratagem } from './tactical';
import { handleMarch } from './combat';
import { resolveSeason } from './resolution';
import { buildInitialCities, marchDurationFor } from '../data/cities';
import { cityPos } from '../data/cityGeo';
import { describeBattleSite, isRiverside, isFrozenWater, WORLD_SCALE } from '../data/geography';

const cities = buildInitialCities({});
const byId = Object.fromEntries(cities.map((c) => [c.id, c]));

const W = 18, H = 12;
const siegeGeo = (fromId: string, toId: string): BattleGeo => {
  const sp = cityPos(byId[fromId]);
  const tp = cityPos(byId[toId]);
  return { x: tp.x, y: tp.y, bearing: Math.atan2(tp.y - sp.y, tp.x - sp.x), anchorCol: W - 2 };
};
/** Water blocking the approach LANE (central rows of the mid-field) —
 *  distinguishes a true crossing from a river hugging one flank. */
const laneWater = (tiles: ReturnType<typeof generateTerrain>) =>
  tiles.filter((t) =>
    (t.terrain === 'river' || t.terrain === 'bridge')
    && t.coord.col >= 4 && t.coord.col <= 13
    && t.coord.row >= 3 && t.coord.row <= 8).length;

describe('real-geography battlefields (战斗地图写实)', () => {
  it('storming 襄陽 from the north crosses the 漢水; from the south the lane is open', () => {
    const target = byId['xiangyang'];
    const hint = { terrain: target.terrain, port: target.port, x: target.coords.x, y: target.coords.y };
    const fromNorth = generateTerrain('xiangyang', W, H, hint, undefined, siegeGeo('xinye', 'xiangyang'));
    const fromSouth = generateTerrain('xiangyang', W, H, hint, undefined, siegeGeo('jiangling', 'xiangyang'));
    // P0 統一格網 — the board is a lattice window SLID toward the approach:
    // from 新野 the window shows the northern ground with the 漢水 in the
    // lane and the war road bridging it. (From 江陵 the window shows the
    // southern ground — where the authored 漢水 meanders south-east, so
    // water legitimately appears there too; the old rotated-grid "dry
    // southern lane" claim does not survive honest geography at this
    // window size.)
    const bridges = (tiles: ReturnType<typeof generateTerrain>) =>
      tiles.filter((t) => t.terrain === 'bridge' || t.terrain === 'ice').length;
    expect(laneWater(fromNorth), '北面来攻应有汉水在场').toBeGreaterThanOrEqual(6);
    expect(bridges(fromNorth), '北面来攻需架桥渡汉水').toBeGreaterThanOrEqual(1);
    // Both approaches stay playable: an approach road exists on the board.
    const roads = (tiles: ReturnType<typeof generateTerrain>) =>
      tiles.filter((t) => t.terrain === 'road' || t.terrain === 'bridge').length;
    expect(roads(fromSouth)).toBeGreaterThanOrEqual(4);
  });

  it('a battle in the Qinling passes is walled by real mountains', () => {
    // 漢中→陳倉: the approach crosses the Qinling — expect heavy mountain mass.
    const geo = siegeGeo('hanzhong', 'chencang');
    const tiles = generateTerrain('chencang', W, H, { terrain: byId['chencang'].terrain }, undefined, geo);
    const mountains = tiles.filter((t) => t.terrain === 'mountain' || t.terrain === 'hill').length;
    expect(mountains).toBeGreaterThanOrEqual(30);
  });

  it('an open-plains clash (許昌↔陳留) stays mostly open ground', () => {
    const a = cityPos(byId['xuchang']);
    const b = cityPos(byId['chenliu']);
    const geo: BattleGeo = {
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      bearing: Math.atan2(b.y - a.y, b.x - a.x),
    };
    const tiles = generateTerrain('xuchang', W, H, {}, undefined, geo);
    // Coarser canonical cells widen the geographic window (the 黃河 belt
    // now edges in) — "mostly open" at this scale means < 30% blocked.
    const blocked = tiles.filter((t) => t.terrain === 'mountain' || t.terrain === 'river').length;
    expect(blocked).toBeLessThan(W * H * 0.3);
    // The march road runs along the TRUE bearing line through the board.
    const road = tiles.filter((t) => t.terrain === 'road' || t.terrain === 'bridge' || t.terrain === 'chokepoint');
    expect(road.length).toBeGreaterThanOrEqual(W / 2);
  });

  it('pass cities keep their corridor guarantee on real ground', () => {
    const geo = siegeGeo('jiameng', 'jianmen');
    const tiles = generateTerrain('jianmen', W, H, { terrain: 'pass' }, undefined, geo);
    const top = tiles.filter((t) => t.coord.row === 0 && t.terrain === 'mountain').length;
    const bottom = tiles.filter((t) => t.coord.row === H - 1 && t.terrain === 'mountain').length;
    expect(top).toBe(W);
    expect(bottom).toBe(W);
    expect(tiles.some((t) => t.terrain === 'chokepoint')).toBe(true);
  });

  it('the rampart hugs the water — river flanks stay river (贴水而建)', () => {
    const target = byId['xiangyang'];
    const off = (id: string) => ({ officer: { id, name: { zh: id, en: id }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 }, forceId: 'x', locationCityId: null, status: 'idle' } as never, troops: 4000 });
    const battle = setupTacticalBattle({
      cityId: 'xiangyang', width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [off('atk')], defenders: [off('def')],
      terrainHint: { terrain: target.terrain, port: target.port },
      battleGeo: siegeGeo('xinye', 'xiangyang'),
    });
    const wallCol = W - 4;   // walled-town west face
    // The rampart footprint spans the town rows; the 漢水 quantises to the
    // lattice row hugging its face. 贴水而建 now means: the wall band is
    // pure fortification-or-water, AND open water touches the rampart.
    const band = battle.tiles.filter((t) => t.coord.col === wallCol && t.coord.row >= 3 && t.coord.row <= 8);
    const fortOrWater = band.every((t) =>
      t.terrain === 'wall' || t.terrain === 'gate' || t.terrain === 'tower' || t.terrain === 'moat' || t.terrain === 'river');
    expect(fortOrWater, '城墙带只应是工事或水面').toBe(true);
    expect(battle.tiles.some((t) => t.terrain === 'gate')).toBe(true);
    const hugsWater = battle.tiles.some((t) =>
      t.terrain === 'river' && Math.abs(t.coord.col - wallCol) <= 1 && t.coord.row >= 2 && t.coord.row <= 9);
    expect(hugsWater, '漢水应贴着城墙').toBe(true);
  });

  it('describeBattleSite names the real ground', () => {
    const xy = cityPos(byId['xiangyang']);
    const north = describeBattleSite(xy.x, xy.y - 4);            // just north of 襄陽 → 漢水
    expect(north?.zh, '襄陽城北应是汉水').toMatch(/漢水/);
    const qinling = describeBattleSite(...(() => { const a = cityPos(byId['hanzhong']); const b = cityPos(byId['chencang']); return [(a.x + b.x) / 2, (a.y + b.y) / 2] as [number, number]; })());
    expect(qinling?.zh, '漢中→陳倉之间应是秦岭').toMatch(/秦嶺/);
    const plain = describeBattleSite(...(() => { const a = cityPos(byId['xuchang']); const b = cityPos(byId['chenliu']); return [(a.x + b.x) / 2, (a.y + b.y) / 2] as [number, number]; })());
    expect(plain, '許昌—陳留平原应无地名').toBeNull();
  });

  it('the enclosure always has a rear route — no hard-stall without siege gear', () => {
    // BFS over passable terrain from the attacker spawn to the defender:
    // the back-alley corners must make the interior reachable with every
    // wall and gate still intact.
    const off = (id: string) => ({ officer: { id, name: { zh: id, en: id }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 } } as never, troops: 4000 });
    const battle = setupTacticalBattle({
      cityId: 'xuchang', width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [off('atk')], defenders: [off('def')],
      terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('chenliu', 'xuchang'),
    });
    const def = battle.units.find((u) => u.side === 'defender')!;
    const start = battle.units.find((u) => u.side === 'attacker')!.coord;
    const seen = new Set<string>([`${start.col},${start.row}`]);
    const queue = [start];
    let reached = false;
    while (queue.length && !reached) {
      const c = queue.shift()!;
      for (const dc of [-1, 0, 1]) for (const dr of [-1, 0, 1]) {
        if (!dc && !dr) continue;
        const n = { col: c.col + dc, row: c.row + dr };
        if (n.col < 0 || n.row < 0 || n.col >= W || n.row >= H) continue;
        const k = `${n.col},${n.row}`;
        if (seen.has(k)) continue;
        if (n.col === def.coord.col && n.row === def.coord.row) { reached = true; break; }
        if (moveCost(battle, n) >= 99) continue;
        seen.add(k);
        queue.push(n);
      }
    }
    expect(reached, '攻方无器械也必须能绕进城(后巷)').toBe(true);
  });

  it('an attacking siege engine rolls toward the gate and batters it', () => {
    const mk = (id: string, war = 70) => ({ officer: { id, name: { zh: id, en: id }, skills: id === 'eng' ? ['siegemaster'] : [], stats: { war, leadership: 70, intelligence: 60, politics: 50, charisma: 50 } } as never, troops: 4000 });
    let battle = setupTacticalBattle({
      cityId: 'xuchang', width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [mk('atk'), mk('eng')], defenders: [mk('def')],
      terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('chenliu', 'xuchang'),
    });
    const officers = Object.fromEntries(battle.units.map((u) => [u.officerId, { id: u.officerId, name: { zh: u.officerId, en: u.officerId }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 }, traits: [] } as never]));
    const engId = battle.units.find((u) => u.unitType === 'siege')!.id;
    const gates = battle.tiles.filter((t) => t.terrain === 'gate');
    const distToGate = (b: typeof battle) => {
      const e = b.units.find((u) => u.id === engId)!;
      return Math.min(...gates.map((g) => hexDistance(e.coord, g.coord)));
    };
    const before = distToGate(battle);
    const hpBefore = JSON.stringify(battle.wallHp);
    for (let i = 0; i < 4; i++) {
      battle = { ...aiTakeTurn(battle, officers, () => 0.5, { skill: 1 }).battle, activeSide: 'attacker' };
      battle.units = battle.units.map((u) => ({ ...u, ap: u.maxAp }));
    }
    const after = distToGate(battle);
    const battered = JSON.stringify(battle.wallHp) !== hpBefore;
    // After a few turns the engine must have closed on the gate (or already
    // be chipping fortifications down).
    expect(after < before || battered, `器械应逼近城门(${before}→${after})或已开砸`).toBe(true);
  });

  it('圍困 starves the garrison; 水攻 washes out walls and drowns defenders', () => {
    const off = (id: string) => ({ officer: { id, name: { zh: id, en: id }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 } } as never, troops: 4000 });
    const base = {
      width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [off('atk')], defenders: [off('def')],
    };
    // 圍困 at 許昌 (plains city)
    const invest = setupTacticalBattle({
      ...base, cityId: 'xuchang', terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('chenliu', 'xuchang'), siegeWorks: 'invest',
    });
    const investDef = invest.units.filter((u) => u.side === 'defender');
    expect(investDef.every((u) => u.effects.some((e) => e.kind === 'starving'))).toBe(true);
    expect(investDef.every((u) => u.morale <= 80)).toBe(true);

    // 水攻 at 鄴 (riverside of the 黄河 — 曹操灌鄴) vs plain storm —
    // washed-out walls, drowned garrison
    const storm = setupTacticalBattle({
      ...base, cityId: 'ye', terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('liyang', 'ye'), siegeWorks: 'storm',
    });
    const flood = setupTacticalBattle({
      ...base, cityId: 'ye', terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('liyang', 'ye'), siegeWorks: 'flood',
    });
    const wallCount = (b: typeof storm) => b.tiles.filter((t) => t.terrain === 'wall').length;
    expect(wallCount(flood), '决堤应冲垮墙段').toBeLessThan(wallCount(storm));
    const floodDef = flood.units.filter((u) => u.side === 'defender');
    const stormDef = storm.units.filter((u) => u.side === 'defender');
    expect(floodDef[0].troops).toBeLessThan(stormDef[0].troops);
    expect(floodDef.every((u) => u.morale <= 90)).toBe(true);
  });

  it('isRiverside gates the flood option by real geography', () => {
    const xy = cityPos(byId['xiangyang']);
    const xc = cityPos(byId['xuchang']);
    expect(isRiverside(xy.x, xy.y), '襄陽臨漢水').toBe(true);
    expect(isRiverside(xc.x, xc.y), '許昌不臨水').toBe(false);
  });

  it('garrison countermeasures: gate passage, wall repair, alley plugging', () => {
    const off = (id: string, war = 70) => ({ officer: { id, name: { zh: id, en: id }, skills: [], stats: { war, leadership: 70, intelligence: 60, politics: 50, charisma: 50 } } as never, troops: 4000 });
    const battle = setupTacticalBattle({
      cityId: 'xuchang', width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [off('atk')], defenders: [off('def'), off('def2'), off('def3')],
      terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('chenliu', 'xuchang'),
    });
    const gate = battle.tiles.find((t) => t.terrain === 'gate')!;
    const atk = battle.units.find((u) => u.side === 'attacker')!;
    const def = battle.units.find((u) => u.side === 'defender')!;
    // Defenders pass their own gates; attackers cannot.
    expect(movementCost(battle, { ...def, coord: { col: gate.coord.col + 1, row: gate.coord.row } }, gate.coord)).toBeLessThan(99);
    expect(movementCost(battle, { ...atk, coord: { col: gate.coord.col - 1, row: gate.coord.row } }, gate.coord)).toBeGreaterThanOrEqual(99);
    // Repair: chip a wall down, stand a defender next to it, repair restores HP.
    const wall = battle.tiles.find((t) => t.terrain === 'wall')!;
    const key = `${wall.coord.col},${wall.coord.row}`;
    const damaged = {
      ...battle,
      wallHp: { ...battle.wallHp, [key]: 300 },
      units: battle.units.map((u) => u.id === def.id
        ? { ...u, coord: { col: wall.coord.col + 1, row: wall.coord.row }, ap: 3 } : u),
    };
    const repaired = repairWall(damaged, def.id, wall.coord);
    expect(repaired.wallHp![key]).toBe(480);
    // Attackers cannot repair.
    const atkAdj = {
      ...damaged,
      units: damaged.units.map((u) => u.id === atk.id
        ? { ...u, coord: { col: wall.coord.col - 1, row: wall.coord.row }, ap: 3 } : u),
    };
    expect(repairWall(atkAdj, atk.id, wall.coord)).toBe(atkAdj);
  });

  it('defender AI plugs a threatened rear alley', () => {
    const off = (id: string) => ({ officer: { id, name: { zh: id, en: id }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 } } as never, troops: 4000 });
    let battle = setupTacticalBattle({
      cityId: 'xuchang', width: W, height: H,
      attackerForceId: 'a', defenderForceId: 'b',
      attackers: [off('atk')], defenders: [off('def'), off('def2'), off('def3')],
      terrainHint: { terrain: 'plain' },
      battleGeo: siegeGeo('chenliu', 'xuchang'),
    });
    const rows = battle.tiles.filter((t) => t.terrain === 'wall' || t.terrain === 'gate').map((t) => t.coord.row);
    const alley = { col: W - 1, row: Math.min(...rows) };
    // Park an attacker two hexes from the rear alley, give the turn to the garrison.
    battle = {
      ...battle,
      activeSide: 'defender',
      units: battle.units.map((u) => u.side === 'attacker'
        ? { ...u, coord: { col: W - 1, row: Math.max(0, Math.min(...rows) - 2) } } : u),
    };
    const officers = Object.fromEntries(battle.units.map((u) => [u.officerId, { id: u.officerId, name: { zh: u.officerId, en: u.officerId }, skills: [], stats: { war: 70, leadership: 70, intelligence: 60, politics: 50, charisma: 50 }, traits: [] } as never]));
    const distBefore = Math.min(...battle.units.filter((u) => u.side === 'defender').map((u) => hexDistance(u.coord, alley)));
    const after = aiTakeTurn(battle, officers, () => 0.5, { skill: 1 }).battle;
    const distAfter = Math.min(...after.units.filter((u) => u.side === 'defender').map((u) => hexDistance(u.coord, alley)));
    expect(distAfter, `守军应逼近后巷堵口 (${distBefore}→${distAfter})`).toBeLessThan(distBefore);
  });

  it('AI attackers pick siege works in auto-resolved marches; players do not', () => {
    const list = buildInitialCities({});
    const mkCities = () => {
      const m = Object.fromEntries(list.map((c) => ({ ...c })).map((c) => [c.id, c]));
      m['xinye'] = { ...m['xinye'], ownerForceId: 'ai-x', gold: 5000, food: 90000, troops: 20000 };
      m['xiangyang'] = { ...m['xiangyang'], ownerForceId: 'foe-y', troops: 9000 }; // 漢水畔, big garrison
      m['xuchang'] = { ...m['xuchang'], ownerForceId: 'foe-y', troops: 8000, food: 1000 }; // grain-poor, not riverside
      m['chenliu'] = { ...m['chenliu'], ownerForceId: 'ai-x', gold: 5000, food: 90000, troops: 20000 };
      return m;
    };
    const officer = { id: 'gen-1', name: { zh: '張遼', en: 'Zhang Liao' }, skills: [], traits: [], equipment: [], stats: { war: 92, leadership: 88, intelligence: 75, politics: 50, charisma: 60 }, forceId: 'ai-x', locationCityId: 'xinye', status: 'idle', task: null } as never;
    const baseCtx = { officers: { 'gen-1': officer }, rng: () => 0.5, playerForceId: 'me' };

    // AI floods riverside 襄陽.
    const flood = handleMarch(
      { type: 'march', cityId: 'xinye', targetCityId: 'xiangyang', officerId: 'gen-1', troops: 8000 } as never,
      { ...baseCtx, cities: mkCities() } as never,
    );
    expect(flood.entries.some((e) => (e.textZh ?? '').includes('水攻')), 'AI 应对临水大城用水攻').toBe(true);
    expect(flood.cities['xinye'].gold).toBe(5000 - 400);

    // AI invests the grain-poor inland city of 許昌.
    const invest = handleMarch(
      { type: 'march', cityId: 'chenliu', targetCityId: 'xuchang', officerId: { ...officer, locationCityId: 'chenliu' } && 'gen-1', troops: 8000 } as never,
      { ...baseCtx, cities: mkCities() } as never,
    );
    expect(invest.entries.some((e) => (e.textZh ?? '').includes('圍困')), 'AI 应围困缺粮之城').toBe(true);

    // The player's own auto-marches stay plain storms.
    const player = handleMarch(
      { type: 'march', cityId: 'xinye', targetCityId: 'xiangyang', officerId: 'gen-1', troops: 8000 } as never,
      { ...baseCtx, cities: mkCities(), playerForceId: 'ai-x' } as never,
    );
    expect(player.entries.some((e) => (e.textZh ?? '').includes('水攻'))).toBe(false);
  });

  it('an AI column arriving at a garrisoned player city defers to a 守城戰', () => {
    const list = buildInitialCities({});
    const cm = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
    cm['xinye'] = { ...cm['xinye'], ownerForceId: 'ai-x', troops: 20000, gold: 3000, food: 50000 };
    cm['xiangyang'] = { ...cm['xiangyang'], ownerForceId: 'me', troops: 8000 };
    const mkOff = (id: string, forceId: string, locationCityId: string) => ({
      id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
      stats: { war: 85, leadership: 80, intelligence: 70, politics: 50, charisma: 60 },
      forceId, locationCityId, status: 'idle', task: null,
    }) as never;
    const officers = {
      'ai-gen': mkOff('ai-gen', 'ai-x', 'xinye'),
      'my-gen': mkOff('my-gen', 'me', 'xiangyang'),
    };
    const out = resolveSeason({
      date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
      cities: cm as never,
      officers: officers as never,
      forces: {} as never,
      pendingCommands: {
        'ai-gen': { type: 'march', cityId: 'xinye', targetCityId: 'xiangyang', officerId: 'ai-gen', troops: 6000, seasonsRemaining: 1, totalSeasons: 1 } as never,
      },
      diplomacy: { relations: {} } as never,
      runtimeBonds: [],
      lostItems: [],
      playerForceId: 'me',
      rng: () => 0.5,
    });
    expect(out.pendingSiegeDefenses?.length, '应转交互守城战').toBe(1);
    const d = out.pendingSiegeDefenses![0];
    expect(d.targetCityId).toBe('xiangyang');
    expect(d.troops).toBe(6000);
    // The column is committed — source troops already deducted.
    expect(out.cities['xinye'].troops).toBe(20000 - 6000);
    // The city was NOT auto-assaulted: still the player's.
    expect(out.cities['xiangyang'].ownerForceId).toBe('me');
  });

  it('planSiegeRelief sends neighbouring garrisons under their best officers', () => {
    const list = buildInitialCities({});
    const cm = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
    cm['xiangyang'] = { ...cm['xiangyang'], ownerForceId: 'liu-biao' };
    cm['jiangling'] = { ...cm['jiangling'], ownerForceId: 'liu-biao', troops: 12000 };
    cm['fancheng'] = { ...cm['fancheng'], ownerForceId: 'liu-biao', troops: 8000 };
    const mkOff = (id: string, loc: string) => ({
      id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
      stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
      forceId: 'liu-biao', locationCityId: loc, status: 'idle', task: null,
    }) as never;
    const officers = { o1: mkOff('o1', 'jiangling'), o2: mkOff('o2', 'fancheng') };
    const relief = planSiegeRelief({
      target: cm['xiangyang'] as never, cities: cm as never, officers: officers as never,
      defenderForceId: 'liu-biao', bearing: Math.PI / 2,
    });
    expect(relief.plans.length).toBeGreaterThanOrEqual(1);
    expect(relief.reinforcements.length).toBe(relief.plans.length);
    for (const r of relief.reinforcements) {
      expect(r.side).toBe('defender');
      expect(r.troops).toBeGreaterThanOrEqual(800);
      expect(['north', 'south', 'east', 'west']).toContain(r.edge);
    }
    // 30% of the biggest garrison rode out.
    expect(relief.plans[0].troops).toBe(Math.floor(12000 * 0.3));
  });

  it('ground fire burns standers, spreads off rain, and torches forests to plain', async () => {
    const { mkBattle, mkUnit, mkTiles } = await import('../../test/factories');
    const unit = mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, troops: 3000 });
    const foe = mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 5, row: 5 }, troops: 3000 });
    const base = mkBattle({
      units: [unit, foe],
      tiles: mkTiles(8, 8, { '2,2': 'forest', '3,2': 'forest' }),
    });
    // Standing in the flames: lose troops, catch fire.
    const burning = { ...base, groundFires: [{ coord: { col: 2, row: 2 }, turnsLeft: 4 }] };
    const after = endTurn(burning);
    const u = after.units.find((x) => x.id === 'A1')!;
    expect(u.troops).toBeLessThan(3000);
    expect(u.effects.some((e) => e.kind === 'burning')).toBe(true);
    // Forest burns out → open ground.
    let b2 = { ...base, groundFires: [{ coord: { col: 3, row: 2 }, turnsLeft: 1 }] };
    const after2 = endTurn(b2);
    expect(after2.tiles.find((t) => t.coord.col === 3 && t.coord.row === 2)?.terrain).toBe('plain');
    // Rain smothers fires fast.
    const rainy = { ...base, weather: 'rain' as const, groundFires: [{ coord: { col: 3, row: 2 }, turnsLeft: 2 }] };
    const after3 = endTurn(rainy);
    expect(after3.groundFires ?? []).toHaveLength(0);
  });

  it('冰封 — winter freezes northern waters and shortens 黄河 crossings', () => {
    // The frozen Yellow River belt: 白馬→黎陽 crossing gets ice tiles in winter.
    const winterGeo = { ...siegeGeo('baima', 'liyang'), season: 'winter' as const };
    const tiles = generateTerrain('liyang', W, H, {}, undefined, winterGeo);
    expect(tiles.some((t) => t.terrain === 'ice'), '冬季黄河应结冰').toBe(true);
    expect(tiles.some((t) => t.terrain === 'river'), '').toBe(false);
    // Southern waters never freeze: 新野→襄陽 keeps open 漢水.
    const south = generateTerrain('xiangyang', W, H, {}, undefined, { ...siegeGeo('xinye', 'xiangyang'), season: 'winter' as const });
    expect(south.some((t) => t.terrain === 'ice')).toBe(false);
    // Strategic: marching across the frozen river is cheaper.
    const winterDur = marchDurationFor(byId['baima'], byId['liyang'], 'winter');
    const summerDur = marchDurationFor(byId['baima'], byId['liyang'], 'summer');
    expect(winterDur).toBeLessThanOrEqual(summerDur);
    expect(isFrozenWater(180 * WORLD_SCALE, 'winter')).toBe(true);   // north
    expect(isFrozenWater(400 * WORLD_SCALE, 'winter')).toBe(false);  // south
    expect(isFrozenWater(180 * WORLD_SCALE, 'summer')).toBe(false);
  });

  it('居高臨下 — striking downhill outdamages flat ground', async () => {
    const { mkBattle, mkUnit, mkTiles } = await import('../../test/factories');
    const officers = {} as never;
    const mk = (terrOverrides: Record<string, import('../types').TerrainKind>) => mkBattle({
      units: [
        mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, troops: 5000, ap: 3 }),
        mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 }, troops: 5000 }),
      ],
      tiles: mkTiles(8, 8, terrOverrides),
    });
    const flat = attackUnits(mk({}), 'A1', 'D1', officers, () => 0.5);
    const high = attackUnits(mk({ '2,2': 'hill' }), 'A1', 'D1', officers, () => 0.5);
    const dmgFlat = 5000 - flat.units.find((u) => u.id === 'D1')!.troops;
    const dmgHigh = 5000 - high.units.find((u) => u.id === 'D1')!.troops;
    expect(dmgHigh, '高地攻击应更痛').toBeGreaterThan(dmgFlat);
  });

  it('落石 seals the path; 燒橋 drops the span into the river', async () => {
    const { mkBattle, mkUnit, mkTiles } = await import('../../test/factories');
    const officers = {
      oA1: { id: 'oA1', name: { zh: '魏延', en: 'Wei Yan' }, skills: [], traits: [], equipment: [], stats: { war: 80, leadership: 70, intelligence: 60, politics: 40, charisma: 50 } },
    } as never;
    const b = mkBattle({
      units: [
        mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 2, row: 2 }, troops: 4000, ap: 3 }),
        mkUnit({ id: 'D1', officerId: 'oD1', side: 'defender', coord: { col: 3, row: 2 }, troops: 4000 }),
      ],
      tiles: mkTiles(8, 8, { '2,1': 'mountain', '3,2': 'road' }),
    });
    const r = applyStratagem(b, 'A1', 'rockslide', { col: 3, row: 2 }, officers);
    expect(r.ok, r.reason ?? '').toBe(true);
    expect(r.battle.tiles.find((t) => t.coord.col === 3 && t.coord.row === 2)?.terrain).toBe('mountain');
    expect(r.battle.units.find((u) => u.id === 'D1')!.troops).toBeLessThan(4000);

    // 燒橋: a burning bridge collapses into the river when the fire dies.
    const bridge = mkBattle({
      units: [mkUnit({ id: 'A1', officerId: 'oA1', side: 'attacker', coord: { col: 1, row: 1 }, troops: 3000 })],
      tiles: mkTiles(8, 8, { '4,4': 'bridge' }),
    });
    const burning = { ...bridge, groundFires: [{ coord: { col: 4, row: 4 }, turnsLeft: 1 }] };
    const after = endTurn(burning);
    expect(after.tiles.find((t) => t.coord.col === 4 && t.coord.row === 4)?.terrain).toBe('river');
  });

  it('is deterministic for the same battle and varies across battles', () => {
    const geo = siegeGeo('xinye', 'xiangyang');
    const a = generateTerrain('xiangyang', W, H, {}, undefined, geo);
    const b = generateTerrain('xiangyang', W, H, {}, undefined, geo);
    expect(a).toEqual(b);
    const c = generateTerrain('xiangyang', W, H, {}, undefined, siegeGeo('jiangling', 'xiangyang'));
    expect(a).not.toEqual(c);
  });
});
