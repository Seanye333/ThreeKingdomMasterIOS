import { describe, it, expect } from 'vitest';
import { NAMED_BATTLE_MAPS, NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../data/namedMaps';
import { OFFICER_IDS, TALENT_POOL_IDS } from '../data/officers';
import { CITY_IDS } from '../data/cities';
import { setupTacticalBattle, pickAiBattlePrep } from './tactical';
import { mkOfficer, mkUnit, mkBattle, mkTiles } from '../../test/factories';
import type { Officer, EntityId } from '../types';

function withRandom<T>(v: number, fn: () => T): T {
  const orig = Math.random;
  Math.random = () => v;
  try { return fn(); } finally { Math.random = orig; }
}
const off = (int: number): Officer => mkOfficer({ stats: { leadership: 70, war: 70, intelligence: int, politics: 50, charisma: 50 } });

// ───────────────────── Batch A — every map reachable (dead-content) ──────────

describe('§5.10 死圖歸位 — no named map is left unreachable', () => {
  it('every NAMED_BATTLE_MAP is bound to at least one city', () => {
    const bound = new Set(Object.values(NAMED_MAPS_BY_CITY));
    for (const m of NAMED_BATTLE_MAPS) {
      expect(bound.has(m.id), `${m.id} is defined but bound to no city (dead content)`).toBe(true);
    }
  });

  it('the once-orphaned 五丈原 / 漢中 maps now resolve from real cities', () => {
    expect(CITY_IDS).toContain('mei');
    expect(CITY_IDS).toContain('yangping');
    expect(NAMED_MAPS_BY_ID[NAMED_MAPS_BY_CITY['mei']]?.id).toBe('map-wuzhang-plains');
    expect(NAMED_MAPS_BY_ID[NAMED_MAPS_BY_CITY['yangping']]?.id).toBe('map-hanzhong');
  });

  it('the newly-bound maps carry a win objective + intro', () => {
    for (const id of ['map-wuzhang-plains', 'map-hanzhong', 'map-fancheng']) {
      const m = NAMED_MAPS_BY_ID[id];
      expect(m.attackerObjective ?? m.defenderObjective, `${id} needs an objective`).toBeTruthy();
      expect(m.introZh, `${id} needs an intro`).toBeTruthy();
    }
  });
});

// ───────────────────── Batch B — scripted reinforcements ─────────────────────

describe('§5.10 援軍突至 — signature reliefs are scripted & valid', () => {
  const officerIds = new Set<EntityId>([...OFFICER_IDS, ...TALENT_POOL_IDS]);

  it('reinforcements reference real officers, real sides, real edges', () => {
    for (const m of NAMED_BATTLE_MAPS) {
      for (const r of m.reinforcements ?? []) {
        expect(officerIds.has(r.officerId), `${m.id} → unknown officer ${r.officerId}`).toBe(true);
        expect(['attacker', 'defender']).toContain(r.side);
        expect(['north', 'south', 'east', 'west']).toContain(r.edge);
        expect(r.troops).toBeGreaterThan(0);
        expect(r.arriveTurn).toBeGreaterThan(1);
      }
    }
  });

  it('the famous reliefs are wired (張遼@合肥, 張飛@長坂, 黃蓋@赤壁, 王平@街亭, 黃忠@定軍)', () => {
    const has = (mapId: string, officerId: string) =>
      (NAMED_MAPS_BY_ID[mapId].reinforcements ?? []).some((r) => r.officerId === officerId);
    expect(has('map-hefei', 'zhang-liao')).toBe(true);
    expect(has('map-changban', 'zhang-fei')).toBe(true);
    expect(has('map-red-cliffs', 'huang-gai')).toBe(true);
    expect(has('map-jieting', 'wang-ping')).toBe(true);
    expect(has('map-dingjun', 'huang-zhong')).toBe(true);
  });
});

// ───────────────────── Batch C — locked wind blows the signature fire ────────

describe('§5.10 名向之風 — a battlefield can lock its wind', () => {
  it('赤壁/夷陵/新野 carry a fixed wind direction', () => {
    expect(NAMED_MAPS_BY_ID['map-red-cliffs'].windDirection).toBe('east');
    expect(NAMED_MAPS_BY_ID['map-yiling'].windDirection).toBe('east');
    expect(NAMED_MAPS_BY_ID['map-xinye'].windDirection).toBe('south');
  });

  it('setupTacticalBattle on 赤壁 locks the wind + weather (not a random gust)', () => {
    const battle = setupTacticalBattle({
      cityId: 'chibi', width: 10, height: 8, attackerForceId: 'A', defenderForceId: 'B',
      attackers: [{ officer: off(80), troops: 6000 }], defenders: [{ officer: off(80), troops: 6000 }],
      weather: 'clear', windDirection: 'calm', // strategic state says calm — the map must override
    });
    expect(battle.weather).toBe('wind');
    expect(battle.windDirection).toBe('east');
  });
});

// ───────────────────── Batch D — AI seizes the fire on a wind field ──────────

describe('§5.10 識名戰場 — the AI reaches for fire on a wind-swept field', () => {
  it('a wits-about attacker offers fire-prep first on a wind map', () => {
    const b = mkBattle({
      units: [
        mkUnit({ id: 'acmd', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 1, row: 4 } }),
        mkUnit({ id: 'dcmd', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 14, row: 4 } }),
      ],
      tiles: mkTiles(16, 9), width: 16, height: 9, weather: 'wind',
    });
    const preps = withRandom(0, () => pickAiBattlePrep(b, 'attacker', { oa: off(82), od: off(60) }));
    expect(preps).toContain('fire-prep');
    // calm weather → no special fire urgency for a mid-wits marshal
    const calm = withRandom(0, () => pickAiBattlePrep({ ...b, weather: 'clear' }, 'attacker', { oa: off(70), od: off(60) }));
    expect(calm).not.toContain('fire-prep');
  });
});
