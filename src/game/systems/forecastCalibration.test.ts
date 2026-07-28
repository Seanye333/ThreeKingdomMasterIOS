/**
 * 傷害預估校準 — the preview must bracket the real blow, across the board.
 *
 * `forecastAttack` does not share code with `attackUnits`; it RE-DERIVES the
 * same result by hand. Its damage line multiplies ~40 separate factors —
 * terrain, weather, night, height, flanking, crossing, street, fatigue,
 * freshness, wounds, morale, pursuit, charge, encirclement, disorder, cover,
 * armour, formations, elite, grade, growth, item sets, traits, shield wall —
 * and every one of them is a hand copy of a line in `attackUnits`.
 *
 * That is a standing invitation to drift: add a multiplier to the real hit,
 * forget the preview, and the number the player plans around is quietly wrong.
 * Nothing crashes, no test fails, and the only symptom is that attacks stop
 * landing where the tooltip said they would.
 *
 * `battleAids.test.ts` already checks calibration once, for infantry-vs-infantry
 * on open plain at a single rng value. That covers a handful of the factors and
 * leaves the rest unverified. This file runs the same assertion across a MATRIX
 * of situations, so a dropped factor fails on the row that exercises it.
 *
 * The assertion is deliberately one-sided-tolerant: real damage must sit inside
 * [dmgMin, dmgMax] with a small epsilon for the floors that both paths apply at
 * different points. A forecast that is merely imprecise passes; one that is
 * systematically wrong (a missing multiplier) does not.
 */
import { describe, it, expect } from 'vitest';
import { forecastAttack, attackUnits } from './tactical';
import { mkUnit, mkBattle, mkTiles, mkOfficer, officerMap, fixedRng } from '../../test/factories';
import type { TacticalBattle, TacticalUnit, Officer, EntityId, TerrainKind, UnitType } from '../types';

/**
 * rng values that produce NO critical hit.
 *
 * Both paths draw the variance band as `0.85 + rng()*0.3`, and `attackUnits`
 * then rolls `rng() < 0.12` (0.22 with a martial skill) for a crit. A constant
 * rng at or above 0.25 therefore lands inside the band while keeping crits —
 * which the forecast explicitly excludes — off the table.
 */
const NO_CRIT = [0.25, 0.5, 0.75, 0.99] as const;

function damageDealt(
  b: TacticalBattle, off: Record<EntityId, Officer>, rngValue: number,
): number {
  const before = b.units.find((u) => u.id === 'D')!.troops;
  const after = attackUnits(b, 'A', 'D', off, fixedRng(rngValue)).units.find((u) => u.id === 'D')!;
  return before - after.troops;
}

/** Assert the forecast brackets every no-crit outcome for this situation. */
function expectBrackets(label: string, b: TacticalBattle, off: Record<EntityId, Officer>) {
  const a = b.units.find((u) => u.id === 'A')!;
  const d = b.units.find((u) => u.id === 'D')!;
  const f = forecastAttack(b, a, d, off);
  for (const v of NO_CRIT) {
    const actual = damageDealt(b, off, v);
    // Damage realized is capped by what the target has left, while the forecast
    // reports the uncapped swing (`willKill` is how it says "this finishes
    // them"). A blow that wipes the unit is therefore expected to land exactly
    // on its remaining troops, not inside the predicted band.
    if (f.dmgMin >= d.troops) {
      expect(actual, `${label} @rng=${v}: 預估必殺,實際應恰好打光 ${d.troops}`).toBe(d.troops);
      expect(f.willKill, `${label}: 預估下限已達敵軍全滅,willKill 應為 true`).toBe(true);
      continue;
    }
    // ±2 absorbs the independent Math.floor calls on each path.
    expect(actual, `${label} @rng=${v}: 實際 ${actual} < 預估下限 ${f.dmgMin}`)
      .toBeGreaterThanOrEqual(Math.max(0, f.dmgMin - 2));
    expect(actual, `${label} @rng=${v}: 實際 ${actual} > 預估上限 ${Math.min(f.dmgMax, d.troops)}`)
      .toBeLessThanOrEqual(Math.min(f.dmgMax, d.troops) + 2);
  }
}

/** A two-unit battle with both sides adjacent on a chosen terrain pair. */
function duel(opts: {
  aType?: UnitType; dType?: UnitType;
  aTerrain?: TerrainKind; dTerrain?: TerrainKind;
  aOver?: Partial<TacticalUnit>; dOver?: Partial<TacticalUnit>;
  battleOver?: Partial<TacticalBattle>;
  officers?: Officer[];
} = {}) {
  const aCoord = { col: 2, row: 2 };
  const dCoord = { col: 3, row: 2 };
  const overrides: Record<string, TerrainKind> = {};
  if (opts.aTerrain) overrides[`${aCoord.col},${aCoord.row}`] = opts.aTerrain;
  if (opts.dTerrain) overrides[`${dCoord.col},${dCoord.row}`] = opts.dTerrain;
  const a = mkUnit({
    id: 'A', officerId: 'oa', side: 'attacker', unitType: opts.aType ?? 'infantry',
    troops: 8000, maxTroops: 10000, coord: aCoord, ...opts.aOver,
  });
  const d = mkUnit({
    id: 'D', officerId: 'od', side: 'defender', unitType: opts.dType ?? 'infantry',
    troops: 9000, maxTroops: 10000, coord: dCoord, ...opts.dOver,
  });
  const b = mkBattle({
    units: [a, d], tiles: mkTiles(10, 8, overrides), activeSide: 'attacker', ...opts.battleOver,
  });
  return { b, off: officerMap([a, d], opts.officers ?? []) };
}

describe('預估校準 — 兵種相剋', () => {
  const TYPES: UnitType[] = ['infantry', 'cavalry', 'archers', 'spearmen', 'siege'];
  for (const aType of TYPES) {
    for (const dType of TYPES) {
      it(`${aType} → ${dType}`, () => {
        const { b, off } = duel({ aType, dType });
        expectBrackets(`${aType}→${dType}`, b, off);
      });
    }
  }
});

describe('預估校準 — 地形', () => {
  const TERRAINS: TerrainKind[] = ['plain', 'forest', 'hill', 'mountain', 'marsh', 'river', 'road', 'shallows'];
  for (const t of TERRAINS) {
    it(`守方位於 ${t}(地形減傷)`, () => {
      const { b, off } = duel({ dTerrain: t });
      expectBrackets(`defender on ${t}`, b, off);
    });
    it(`攻方位於 ${t}(地形加成)`, () => {
      const { b, off } = duel({ aTerrain: t });
      expectBrackets(`attacker on ${t}`, b, off);
    });
  }

  it('高低差 — 攻方居高臨下', () => {
    const { b, off } = duel({ aTerrain: 'mountain', dTerrain: 'plain' });
    expectBrackets('height advantage', b, off);
  });

  it('高低差 — 攻方仰攻', () => {
    const { b, off } = duel({ aTerrain: 'plain', dTerrain: 'mountain' });
    expectBrackets('height disadvantage', b, off);
  });
});

describe('預估校準 — 天候與晝夜', () => {
  for (const weather of ['clear', 'rain', 'wind', 'fog', 'snow'] as const) {
    it(`天候 ${weather}`, () => {
      const { b, off } = duel({ battleOver: { weather } });
      expectBrackets(`weather ${weather}`, b, off);
    });
  }

  it('夜戰', () => {
    const { b, off } = duel({ battleOver: { timeOfDay: 'night' } });
    expectBrackets('night', b, off);
  });
});

describe('預估校準 — 單位狀態', () => {
  it('守方立防(傷害減半)', () => {
    const { b, off } = duel({ dOver: { effects: [{ kind: 'defending', turnsLeft: 2 }] } });
    expectBrackets('defending', b, off);
  });

  it('攻方燃燒', () => {
    const { b, off } = duel({ aOver: { effects: [{ kind: 'burning', turnsLeft: 2 }] } });
    expectBrackets('burning', b, off);
  });

  it('攻方士氣低落', () => {
    const { b, off } = duel({ aOver: { effects: [{ kind: 'demoralized', turnsLeft: 2 }] } });
    expectBrackets('demoralized', b, off);
  });

  it('攻方糧盡', () => {
    const { b, off } = duel({ aOver: { effects: [{ kind: 'starving', turnsLeft: 2 }] } });
    expectBrackets('starving', b, off);
  });

  it('攻方疲勞', () => {
    const { b, off } = duel({ aOver: { fatigue: 90 } });
    expectBrackets('fatigued', b, off);
  });

  it('師老兵疲 — 第 15 回合', () => {
    const { b, off } = duel({ battleOver: { turn: 15 } });
    expectBrackets('turn 15 fatigue', b, off);
  });

  it('攻方士氣高昂 vs 低迷', () => {
    for (const morale of [20, 60, 100]) {
      const { b, off } = duel({ aOver: { morale } });
      expectBrackets(`attacker morale ${morale}`, b, off);
    }
  });

  it('守方潰逃(追擊加成)', () => {
    const { b, off } = duel({ dOver: { morale: 0 } });
    expectBrackets('routing target', b, off);
  });
});

describe('預估校準 — 陣型', () => {
  const FORMS = ['none', 'fish-scale', 'eight-trigrams', 'arrow-tip', 'crane-wing', 'awl', 'square'] as const;
  for (const af of FORMS) {
    it(`攻方 ${af} 陣`, () => {
      const { b, off } = duel({ battleOver: { attackerFormation: af } });
      expectBrackets(`attacker formation ${af}`, b, off);
    });
  }
  for (const df of FORMS) {
    it(`守方 ${df} 陣`, () => {
      const { b, off } = duel({ battleOver: { defenderFormation: df } });
      expectBrackets(`defender formation ${df}`, b, off);
    });
  }
});

describe('預估校準 — 武將差異', () => {
  it('高武力攻方', () => {
    const oa = mkOfficer({ id: 'oa', stats: { war: 99, leadership: 70, intelligence: 70, politics: 60, charisma: 60 } });
    const { b, off } = duel({ officers: [oa] });
    expectBrackets('high war', b, off);
  });

  it('高統率守方', () => {
    const od = mkOfficer({ id: 'od', stats: { war: 70, leadership: 99, intelligence: 70, politics: 60, charisma: 60 } });
    const { b, off } = duel({ officers: [od] });
    expectBrackets('high leadership', b, off);
  });

  it('負傷攻方', () => {
    for (const sev of ['light', 'serious', 'critical'] as const) {
      const oa = mkOfficer({ id: 'oa', status: 'wounded', woundSeverity: sev });
      const { b, off } = duel({ officers: [oa] });
      expectBrackets(`wounded attacker ${sev}`, b, off);
    }
  });

  it('負傷守方', () => {
    for (const sev of ['light', 'serious', 'critical'] as const) {
      const od = mkOfficer({ id: 'od', status: 'wounded', woundSeverity: sev });
      const { b, off } = duel({ officers: [od] });
      expectBrackets(`wounded defender ${sev}`, b, off);
    }
  });
});

describe('預估校準 — 組合情境', () => {
  it('夜襲:騎兵 + 夜戰 + 守方立防 + 森林', () => {
    const { b, off } = duel({
      aType: 'cavalry', dTerrain: 'forest',
      dOver: { effects: [{ kind: 'defending', turnsLeft: 2 }] },
      battleOver: { timeOfDay: 'night' },
    });
    expectBrackets('night cavalry raid', b, off);
  });

  it('疲師仰攻雨中據山之敵', () => {
    const { b, off } = duel({
      aTerrain: 'plain', dTerrain: 'mountain',
      aOver: { fatigue: 80, morale: 40 },
      battleOver: { weather: 'rain', turn: 12 },
    });
    expectBrackets('exhausted uphill assault', b, off);
  });

  it('銳騎乘勝追擊潰兵', () => {
    const oa = mkOfficer({ id: 'oa', stats: { war: 95, leadership: 85, intelligence: 70, politics: 60, charisma: 60 } });
    const { b, off } = duel({
      aType: 'cavalry', dType: 'archers',
      aOver: { morale: 100, fatigue: 0 },
      dOver: { morale: 0 },
      officers: [oa],
    });
    expectBrackets('cavalry pursuit', b, off);
  });
});
