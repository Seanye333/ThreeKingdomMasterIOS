import { describe, it, expect } from 'vitest';
import { resolveSeason } from './resolution';
import { buildInitialCities } from '../data/cities';
import { cityPos } from '../data/cityGeo';
import { terrainRoute, positionAlongRoute } from '../data/territories';
import { terrainMarchCost } from '../data/geography';
import { accrueFatigue, fatiguePowerMul, fatigueMoraleMalus, evadeSlipChance } from './marchPace';

/** 行軍博弈第二批 — 避戰迂迴(slip/倉皇接戰)、師老兵疲(累積/休整)、
 *  冬季行軍(苦寒/雪封/冬圍)、野戰繳獲。 */

const mkOfficer = (id: string, forceId: string, skills: string[] = []) => ({
  id, name: { zh: id, en: id }, skills, traits: [], equipment: [],
  stats: { war: 80, leadership: 75, intelligence: 60, politics: 50, charisma: 50 },
  forceId, locationCityId: 'luoyang', status: 'idle', task: null,
}) as never;

function fixtures(changanTroops = 3900) {
  const list = buildInitialCities({});
  const cities = Object.fromEntries(list.map((c) => [c.id, { ...c }]));
  // Both garrisons kept under the 4000 sally bar unless a test raises them.
  cities['luoyang'] = { ...cities['luoyang'], ownerForceId: 'me', troops: 3800, food: 90000, gold: 5000 };
  cities['changan'] = { ...cities['changan'], ownerForceId: 'foe', troops: changanTroops, food: 90000, gold: 5000 };
  return { cities };
}

const baseInput = (cities: Record<string, unknown>, officers: Record<string, unknown>, pendingCommands: Record<string, unknown>, rng: () => number, season = 'spring') => ({
  date: { year: 200, season, month: 1, phase: 'upper' } as never,
  cities: cities as never,
  officers: officers as never,
  forces: {} as never,
  pendingCommands: pendingCommands as never,
  diplomacy: { relations: {} } as never,
  runtimeBonds: [], lostItems: [],
  playerForceId: 'me',
  rng,
});

describe('marchPace 純函數 — 疲勞與避戰', () => {
  it('accrues on the road, rests in camp, grinds at a siege', () => {
    expect(accrueFatigue(0, { pace: 'normal', holding: false })).toBe(8);
    expect(accrueFatigue(0, { pace: 'forced', holding: false })).toBe(14);
    expect(accrueFatigue(0, { pace: 'cautious', holding: false })).toBe(4);
    expect(accrueFatigue(50, { holding: true })).toBe(42);
    expect(accrueFatigue(50, { holding: true, besieging: true })).toBe(54);
    expect(accrueFatigue(98, { pace: 'forced', holding: false })).toBe(100); // clamped
  });
  it('saps power and opening morale', () => {
    expect(fatiguePowerMul(0)).toBe(1);
    expect(fatiguePowerMul(100)).toBe(0.75);
    expect(fatigueMoraleMalus(40)).toBe(5);
    expect(fatigueMoraleMalus(100)).toBe(13);
  });
  it('slip chance is wits vs wits, pace-adjusted, clamped', () => {
    expect(evadeSlipChance(60, 60, undefined)).toBeCloseTo(0.4);
    expect(evadeSlipChance(90, 60, 'cautious')).toBeCloseTo(0.67);
    expect(evadeSlipChance(30, 95, 'forced')).toBe(0.2); // floor
  });
});

describe('避戰迂迴 — slipping and getting caught', () => {
  const evadeScene = (cities: Record<string, unknown>) => {
    const lp = cityPos(cities['luoyang'] as never);
    const cp = cityPos(cities['chengdu'] as never);
    const campAt = positionAlongRoute(terrainRoute(lp.x, lp.y, cp.x, cp.y), 0.5);
    return {
      officers: { mover: mkOfficer('mover', 'me'), blocker: mkOfficer('blocker', 'foe') },
      pendingCommands: {
        mover: {
          type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
          troops: 2400, totalSeasons: 2, seasonsRemaining: 2, evading: true,
        },
        blocker: {
          type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'blocker',
          troops: 20000, holding: true, targetX: campAt.x, targetY: campAt.y,
          totalSeasons: 5, seasonsRemaining: 5,
        },
      },
    };
  };

  it('a low roll slips the contact — no battle, the column marches on', () => {
    const { cities } = fixtures();
    const { officers, pendingCommands } = evadeScene(cities);
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.0) as never);
    expect(out.report.entries.some((e) => e.battle)).toBe(false);
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('迂迴避戰'))).toBe(true);
    const kept = out.keptCommands?.['mover'] as { evading?: boolean; seasonsRemaining?: number } | undefined;
    expect(kept?.evading).toBe(true);
    expect(kept?.seasonsRemaining).toBe(1); // advanced normally
  });

  it('a high roll is caught mid-slip — the clash fires', () => {
    const { cities } = fixtures();
    const { officers, pendingCommands } = evadeScene(cities);
    const out = resolveSeason(baseInput(cities, officers, pendingCommands, () => 0.99) as never);
    expect(out.report.entries.some((e) => e.battle && /第\d+日/.test(e.textZh ?? ''))).toBe(true);
  });
});

describe('師老兵疲 — the campaign wears columns down', () => {
  it('a season on the road adds fatigue to the kept command', () => {
    const { cities } = fixtures();
    const out = resolveSeason(baseInput(cities, { mover: mkOfficer('mover', 'me') }, {
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
        troops: 5000, totalSeasons: 3, seasonsRemaining: 3,
      },
    }, () => 0.0) as never);
    expect((out.keptCommands?.['mover'] as { fatigue?: number })?.fatigue).toBe(8);
    expect(out.armies?.['mover']?.fatigue).toBe(8);
  });

  it('a rest camp recovers; a siege camp grinds', () => {
    const { cities } = fixtures(500); // tiny garrison — no sortie
    const ap = cityPos(cities['changan'] as never);
    const out = resolveSeason(baseInput(cities, {
      camper: mkOfficer('camper', 'me'), besieger: mkOfficer('besieger', 'me'),
    }, {
      camper: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'camper',
        troops: 4000, holding: true, targetX: ap.x + 200, targetY: ap.y + 200,
        totalSeasons: 4, seasonsRemaining: 4, fatigue: 50,
      },
      besieger: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'besieger',
        troops: 6000, holding: true, besieging: 'changan', targetX: ap.x + 15, targetY: ap.y,
        totalSeasons: 4, seasonsRemaining: 4, fatigue: 50,
      },
    }, () => 0.99) as never);
    expect((out.keptCommands?.['camper'] as { fatigue?: number })?.fatigue).toBe(42);
    expect((out.keptCommands?.['besieger'] as { fatigue?: number })?.fatigue).toBe(54);
  });

  it('a worn army loses the field to an equal but fresh one', () => {
    const { cities } = fixtures(20000);
    cities['luoyang'] = { ...(cities['luoyang'] as object), ownerForceId: 'f1' } as never;
    cities['changan'] = { ...(cities['changan'] as object), ownerForceId: 'f2' } as never;
    const out = resolveSeason(baseInput(cities, {
      weary: { ...(mkOfficer('weary', 'f1') as object) } as never,
      fresh: { ...(mkOfficer('fresh', 'f2') as object) } as never,
    }, {
      weary: {
        type: 'march', cityId: 'luoyang', targetCityId: 'changan', officerId: 'weary',
        troops: 5000, totalSeasons: 2, seasonsRemaining: 2, fatigue: 100,
      },
      fresh: {
        type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'fresh',
        troops: 5000, totalSeasons: 2, seasonsRemaining: 2,
      },
    }, () => 0.0) as never);
    const clash = out.report.entries.find((e) => e.battle?.field);
    expect(clash).toBeTruthy();
    expect(clash!.battle!.attacker.commanderId).toBe('fresh'); // victor
  });
});

describe('冬季行軍 — cold, snowed passes, freezing siege lines', () => {
  it('winter marching sheds stragglers', () => {
    const { cities } = fixtures();
    const out = resolveSeason(baseInput(cities, { mover: mkOfficer('mover', 'me') }, {
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
        troops: 5000, totalSeasons: 3, seasonsRemaining: 3,
      },
    }, () => 0.99, 'winter') as never);
    // 3% frost toll (rng 0.99 keeps the snowed-pass roll from firing).
    expect((out.keptCommands?.['mover'] as { troops?: number })?.troops).toBe(4850);
  });

  it('deep-mountain columns can be snowed in for the season', () => {
    const { cities } = fixtures();
    const ap = cityPos(cities['changan'] as never);
    const hp = cityPos(cities['hanzhong'] as never);
    const route = terrainRoute(ap.x, ap.y, hp.x, hp.y);
    // Find a season-slot whose midpoint sits in deep mountains (秦嶺).
    const total = 4;
    let snowRemaining = 0;
    for (let remaining = total; remaining >= 1; remaining--) {
      const t = Math.min(0.95, Math.max(0.05, (total - remaining + 0.5) / total));
      const p = positionAlongRoute(route, t);
      if (terrainMarchCost(p.x, p.y) >= 0.55) { snowRemaining = remaining; break; }
    }
    expect(snowRemaining).toBeGreaterThan(0); // 秦嶺 crosses real mountains
    const out = resolveSeason(baseInput(cities, { mover: mkOfficer('mover', 'me') }, {
      mover: {
        type: 'march', cityId: 'changan', targetCityId: 'hanzhong', officerId: 'mover',
        troops: 5000, totalSeasons: total, seasonsRemaining: snowRemaining,
      },
    }, () => 0.0, 'winter') as never);
    // Snowed in: the season passes but the column makes no headway.
    expect((out.keptCommands?.['mover'] as { seasonsRemaining?: number })?.seasonsRemaining).toBe(snowRemaining);
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('大雪封山'))).toBe(true);
  });

  it('winter siege lines shed men to the cold', () => {
    const { cities } = fixtures(500);
    const ap = cityPos(cities['changan'] as never);
    const out = resolveSeason(baseInput(cities, { besieger: mkOfficer('besieger', 'me') }, {
      besieger: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'besieger',
        troops: 6000, holding: true, besieging: 'changan', targetX: ap.x + 15, targetY: ap.y,
        totalSeasons: 4, seasonsRemaining: 4,
      },
    }, () => 0.99, 'winter') as never);
    expect((out.keptCommands?.['besieger'] as { troops?: number })?.troops).toBe(5760); // −4%
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('凍損'))).toBe(true);
  });
});

describe('追擊與候期 — hounding routs and marking time', () => {
  it('a pursuer catches the rout it was set on — hunt counted in the output', () => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const ap = cityPos(cities['changan'] as never);
    const road = terrainRoute(lp.x, lp.y, ap.x, ap.y);
    const fleeAt = positionAlongRoute(road, 0.55);
    const behind = positionAlongRoute(road, 0.45);
    const out = resolveSeason(baseInput(cities, {
      runner: mkOfficer('runner', 'foe'), hunter: mkOfficer('hunter', 'me'),
    }, {
      runner: {
        type: 'march', cityId: 'changan', targetCityId: 'changan', officerId: 'runner',
        troops: 600, routed: true, returning: true, fleeX: fleeAt.x, fleeY: fleeAt.y,
        totalSeasons: 2, seasonsRemaining: 2, food: 50000,
      },
      hunter: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'hunter',
        troops: 6000, pursueTargetId: 'runner', fleeX: behind.x, fleeY: behind.y,
        targetX: fleeAt.x, targetY: fleeAt.y, totalSeasons: 1, seasonsRemaining: 1,
      },
    }, () => 0.0) as never);
    const strike = out.report.entries.find((e) => e.battle?.routHunt);
    expect(strike).toBeTruthy();
    expect(out.playerRoutsHunted).toBe(1);
    expect(out.playerTroopsAbsorbed).toBe(99); // 30% of 330 cut down
  });

  it('quarry gone → the chase ends: dig in on the spot, flag cleared', () => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const ap = cityPos(cities['changan'] as never);
    const mid = positionAlongRoute(terrainRoute(lp.x, lp.y, ap.x, ap.y), 0.5);
    const out = resolveSeason(baseInput(cities, { hunter: mkOfficer('hunter', 'me') }, {
      hunter: {
        type: 'march', cityId: 'luoyang', targetCityId: 'luoyang', officerId: 'hunter',
        troops: 6000, pursueTargetId: 'ghost', fleeX: mid.x, fleeY: mid.y,
        targetX: mid.x + 30, targetY: mid.y, totalSeasons: 2, seasonsRemaining: 2,
      },
    }, () => 0.0) as never);
    const kept = out.keptCommands?.['hunter'] as { pursueTargetId?: string; holding?: boolean } | undefined;
    expect(kept?.pursueTargetId).toBeUndefined();
    expect(kept?.holding).toBe(true);
    expect(out.report.entries.some((e) => (e.textZh ?? '').includes('追擊已了'))).toBe(true);
  });

  it('候期 — a waiting column marks time: no advance, counter ticks down', () => {
    const { cities } = fixtures();
    const out = resolveSeason(baseInput(cities, { mover: mkOfficer('mover', 'me') }, {
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
        troops: 5000, totalSeasons: 3, seasonsRemaining: 3, waitSeasons: 2,
      },
    }, () => 0.0) as never);
    const kept = out.keptCommands?.['mover'] as { seasonsRemaining?: number; waitSeasons?: number } | undefined;
    expect(kept?.seasonsRemaining).toBe(3); // marked time — no headway
    expect(kept?.waitSeasons).toBe(1);
  });
});

describe('野戰繳獲 — a field victory strips the loser\'s baggage', () => {
  it('the victor takes grain (into its own train) and coin, named in the report', () => {
    const { cities } = fixtures();
    const lp = cityPos(cities['luoyang'] as never);
    const cp = cityPos(cities['chengdu'] as never);
    const campAt = positionAlongRoute(terrainRoute(lp.x, lp.y, cp.x, cp.y), 0.75);
    const out = resolveSeason(baseInput(cities, {
      mover: mkOfficer('mover', 'me'), blocker: mkOfficer('blocker', 'foe'),
    }, {
      mover: {
        type: 'march', cityId: 'luoyang', targetCityId: 'chengdu', officerId: 'mover',
        troops: 2400, totalSeasons: 1, seasonsRemaining: 1,
      },
      blocker: {
        type: 'march', cityId: 'changan', targetCityId: 'luoyang', officerId: 'blocker',
        troops: 20000, holding: true, targetX: campAt.x, targetY: campAt.y,
        totalSeasons: 5, seasonsRemaining: 5, food: 50000,
      },
    }, () => 0.0) as never);
    // Crushing ambush (ratio clamps ×1.25): loser casualty 2160 → 3240 grain
    // + 86 gold + 32 horses + 54 iron of spoils.
    const clash = out.report.entries.find((e) => e.battle?.field);
    expect((clash?.textZh ?? '')).toContain('繳獲糧秣 3,240');
    expect((clash?.textZh ?? '')).toContain('金 86');
    expect((clash?.textZh ?? '')).toContain('馬 32');
    expect((clash?.textZh ?? '')).toContain('鐵 54');
    // The camp carries provisions, so the grain rode straight into its train.
    expect((out.keptCommands?.['blocker'] as { food?: number })?.food).toBeGreaterThan(2500);
  });
});
