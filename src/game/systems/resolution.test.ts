import { describe, it, expect } from 'vitest';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';

/**
 * 結算 — the invariants of `resolveSeason`.
 *
 * This is the biggest file in the project (≈4.9k lines) behind a SINGLE
 * export, and until now it had no test file of its own: it was covered only
 * sideways, by seven topic tests and a dozen store-level integration tests
 * that each drive it to reach something else. The AI-siege bug lived exactly
 * in that gap for months — the conversion had a report line and a unit test,
 * but the camp it created evaporated the same turn, and no test was looking
 * at the turn *after*.
 *
 * So these are deliberately about the CONTRACT rather than about any one
 * feature: what must be true of the output for the store to be able to apply
 * it, and what must be true of a command that survives into next turn. A new
 * mechanic that quietly breaks one of these should fail here, not in a
 * player's save six weeks later.
 */

const mkOfficer = (id: string, forceId: string, locationCityId: string) => ({
  id, name: { zh: id, en: id }, skills: [], traits: [], equipment: [],
  stats: { war: 70, leadership: 70, intelligence: 60, politics: 60, charisma: 60 },
  forceId, locationCityId, status: 'idle', task: null,
}) as never;

function realm() {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 12_000, food: 120_000, gold: 8000 };
  cities['xuchang'] = { ...cities['xuchang'], ownerForceId: 'me', troops: 6000, food: 60_000, gold: 4000 };
  cities['changan'] = { ...cities['changan'], ownerForceId: 'foe', troops: 8000, food: 80_000, gold: 4000 };
  return cities;
}

const input = (over: Record<string, unknown> = {}) => ({
  date: { year: 200, season: 'spring', month: 1, phase: 'upper' } as never,
  cities: realm() as never,
  officers: {
    a: mkOfficer('a', 'me', 'luoyang'),
    b: mkOfficer('b', 'foe', 'changan'),
  } as never,
  forces: {} as never,
  pendingCommands: {} as never,
  diplomacy: { relations: {} } as never,
  runtimeBonds: [], lostItems: [],
  playerForceId: 'me',
  rng: () => 0.5,
  ...over,
});

describe('resolveSeason — output contract', () => {
  it('returns a state the store can apply, with no NaN in the ledgers', () => {
    const out = resolveSeason(input());
    expect(out.cities).toBeDefined();
    expect(out.officers).toBeDefined();
    expect(out.report).toBeDefined();
    for (const [id, c] of Object.entries(out.cities)) {
      expect(Number.isFinite(c.gold), `${id} gold`).toBe(true);
      expect(Number.isFinite(c.food), `${id} food`).toBe(true);
      expect(Number.isFinite(c.troops), `${id} troops`).toBe(true);
      expect(c.food, `${id} food ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(c.troops, `${id} troops ≥ 0`).toBeGreaterThanOrEqual(0);
      expect(c.loyalty, `${id} loyalty in range`).toBeGreaterThanOrEqual(0);
      expect(c.loyalty, `${id} loyalty in range`).toBeLessThanOrEqual(100);
      expect(c.population, `${id} population > 0`).toBeGreaterThan(0);
    }
  });

  it('does not mutate the input cities object', () => {
    const cities = realm();
    const goldBefore = cities['luoyang'].gold;
    const troopsBefore = cities['luoyang'].troops;
    resolveSeason(input({ cities }));
    expect(cities['luoyang'].gold, 'input gold untouched').toBe(goldBefore);
    expect(cities['luoyang'].troops, 'input troops untouched').toBe(troopsBefore);
  });

  it('is deterministic for a fixed rng', () => {
    const a = resolveSeason(input({ rng: () => 0.42 }));
    const b = resolveSeason(input({ rng: () => 0.42 }));
    const strip = (o: typeof a) => JSON.stringify(Object.fromEntries(
      Object.entries(o.cities).map(([k, c]) => [k, [c.gold, c.food, c.troops, c.loyalty]]),
    ));
    expect(strip(a)).toBe(strip(b));
  });

  it('every report entry carries text in both languages', () => {
    const out = resolveSeason(input());
    for (const e of out.report?.entries ?? []) {
      expect(typeof e.text, 'en text').toBe('string');
      expect(typeof e.textZh, 'zh text').toBe('string');
    }
  });
});

describe('resolveSeason — commands that survive the turn', () => {
  /** A two-season march: it must still be in transit next turn. */
  const marching = {
    a: {
      type: 'march', officerId: 'a', cityId: 'luoyang', targetCityId: 'changan',
      troops: 5000, seasonsRemaining: 2, totalSeasons: 2, food: 40_000,
    },
  };

  it('keeps an in-transit column and counts its journey down', () => {
    const out = resolveSeason(input({ pendingCommands: marching }));
    const kept = (out.keptCommands ?? {})['a'] as { seasonsRemaining?: number } | undefined;
    expect(kept, 'a multi-season march must carry forward').toBeDefined();
    expect(kept?.seasonsRemaining).toBeLessThan(2);
  });

  it('every carried command still names a live officer', () => {
    const out = resolveSeason(input({ pendingCommands: marching }));
    for (const [id, cmd] of Object.entries(out.keptCommands ?? {})) {
      expect(out.officers[id], `${id} must exist`).toBeDefined();
      expect(out.officers[id].status, `${id} not dead`).not.toBe('dead');
      expect(cmd.officerId, 'key matches command').toBe(id);
    }
  });

  it('derives an army for each carried march, and no orphans', () => {
    const out = resolveSeason(input({ pendingCommands: marching }));
    const kept = Object.keys(out.keptCommands ?? {});
    // Army identifies its leader as `commanderId` (not `officerId`).
    const armyOfficers = new Set(
      Object.values(out.armies ?? {}).map((a) => (a as { commanderId: string }).commanderId),
    );
    for (const id of kept) {
      expect(armyOfficers.has(id), `${id} carried but has no army on the map`).toBe(true);
    }
    // And nothing on the map that no command backs — that is how a column
    // becomes immortal.
    for (const a of Object.values(out.armies ?? {})) {
      const oid = (a as { commanderId: string }).commanderId;
      expect(kept.includes(oid), `army ${oid} has no backing command`).toBe(true);
    }
  });

  it('a column appears at most once across the carried commands', () => {
    const out = resolveSeason(input({ pendingCommands: marching }));
    const ids = Object.values(out.keptCommands ?? {}).map((c) => c.officerId);
    expect(new Set(ids).size, 'duplicate officer in keptCommands').toBe(ids.length);
  });
});

describe('resolveSeason — fed its own output, it stays stable', () => {
  it('survives ten consecutive turns without drifting into a bad state', () => {
    let cities = realm();
    let officers = {
      a: mkOfficer('a', 'me', 'luoyang'),
      b: mkOfficer('b', 'foe', 'changan'),
    } as Record<string, unknown>;
    let commands: Record<string, unknown> = {
      a: {
        type: 'march', officerId: 'a', cityId: 'luoyang', targetCityId: 'changan',
        troops: 5000, seasonsRemaining: 3, totalSeasons: 3, food: 60_000,
      },
    };
    for (let turn = 0; turn < 10; turn++) {
      const out = resolveSeason(input({
        cities, officers, pendingCommands: commands,
        date: { year: 200, season: 'spring', month: 1 + (turn % 3), phase: 'upper' },
      }));
      cities = out.cities as typeof cities;
      officers = out.officers as typeof officers;
      commands = (out.keptCommands ?? {}) as typeof commands;
      for (const [id, c] of Object.entries(cities)) {
        expect(Number.isFinite(c.gold), `t${turn} ${id} gold finite`).toBe(true);
        expect(c.troops, `t${turn} ${id} troops ≥ 0`).toBeGreaterThanOrEqual(0);
        expect(c.food, `t${turn} ${id} food ≥ 0`).toBeGreaterThanOrEqual(0);
      }
      for (const cmd of Object.values(commands) as Array<{ troops?: number }>) {
        if (cmd.troops !== undefined) {
          expect(cmd.troops, `t${turn} carried column has troops`).toBeGreaterThan(0);
        }
      }
    }
  });
});

/**
 * 避戰 vs 紮營 — `MarchCommand.evading` is documented "cleared on hold", and the
 * player's own toggle refuses to evade while camped. But only the AI ever SETS
 * evading, and none of the three places that convert a march into a camp
 * (pursuit called off / investing a siege / arriving at the target cell) used
 * to clear it — so an AI column could be dug in and slipping contacts at once.
 * The soak fuzzer caught it at roughly one run in seven.
 */
describe('紮營即不復避戰', () => {
  it('every hold conversion in resolution clears the evade flag', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./resolution.ts', import.meta.url), 'utf8'));
    // Each `holding = true` / `holding: true` that marks a camp must sit beside
    // an evading clear. Kept as a source check because the three sites live deep
    // inside a 4,800-line season pass with no seam to call them through.
    const holds = [...src.matchAll(/holding[:=] true/g)];
    expect(holds.length).toBeGreaterThan(0);
    for (const m of holds) {
      const window = src.slice(m.index!, m.index! + 400);
      const isFatigueCall = window.startsWith('holding: true, besieging:');
      if (isFatigueCall) continue;   // accrueFatigue argument, not a state write
      expect(
        /evading[:=] undefined/.test(window),
        `hold at offset ${m.index} does not clear evading`,
      ).toBe(true);
    }
  });
});
