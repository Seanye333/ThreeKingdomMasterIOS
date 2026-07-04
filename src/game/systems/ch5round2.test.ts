import { describe, it, expect } from 'vitest';
import { resolveBattle, type BattleSide } from './combat';
import { endTurn } from './tactical';
import { aiTakeTurn } from './tacticalAi';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, seededRng } from '../../test/factories';
import type { Officer, City } from '../types';

function withRandom<T>(v: number, fn: () => T): T {
  const orig = Math.random; Math.random = () => v;
  try { return fn(); } finally { Math.random = orig; }
}
const off = (over: Partial<Officer> = {}): Officer => mkOfficer({ stats: { leadership: 75, war: 80, intelligence: 70, politics: 50, charisma: 60 }, ...over });

// ───────── A — abstract battle now reads the lead commanders' weapon classes ─

describe('§5 abstract battle 接兵裝相剋 — weapon class carries into auto-resolve', () => {
  const ctx = { city: { id: 'c', name: { zh: '城', en: 'C' }, terrain: 'plain', port: false } as unknown as City, allowPursuit: true } as never;
  const winRate = (attackerCmd: Officer) => {
    const rng = seededRng(7);
    let wins = 0;
    for (let i = 0; i < 120; i++) {
      const atk: BattleSide = { troops: 12000, commander: attackerCmd, companions: [] };
      const def: BattleSide = { troops: 12000, commander: off({ id: 'd', equipment: ['red-hare'] }), companions: [] }; // 騎將 defender
      if (resolveBattle(atk, def, 0, rng, ctx).attackerWins) wins++;
    }
    return wins / 120;
  };
  it('a 戟 marshal beats a 騎 lord more often than a plain-armed one (戟制騎)', () => {
    const halberd = winRate(off({ id: 'a', equipment: ['sky-piercer'] }));  // 戟
    const plain = winRate(off({ id: 'a', equipment: [] }));                  // stat-derived 槍
    expect(halberd).toBeGreaterThan(plain); // 戟制騎 tilts the auto-resolve
  });
});

// ───────── B — mystic formations now do what their scrolls promise ──────────

describe('§5.2 玄門陣法做活', () => {
  it('八陣困敵 — a foe in contact with the Eight Trigrams loses a step (−1 AP)', () => {
    const a = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', coord: { col: 1, row: 2 } }); // maxAp 3
    const d = mkUnit({ id: 'D', officerId: 'od', side: 'defender', coord: { col: 2, row: 2 } }); // adjacent
    const b = mkBattle({ units: [a, d], tiles: mkTiles(8, 6), activeSide: 'attacker', defenderFormation: 'eight-trigrams' });
    const after = withRandom(0.5, () => endTurn(b));
    expect(after.units.find((u) => u.id === 'A')!.ap).toBe(2); // sapped a step by the 八陣
    // control: no mystic formation → full AP.
    const plain = withRandom(0.5, () => endTurn({ ...b, defenderFormation: 'square' }));
    expect(plain.units.find((u) => u.id === 'A')!.ap).toBe(3);
  });

  it('背水置死地 — a broken unit in 背水陣 turns and fights instead of fleeing', () => {
    const a = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', coord: { col: 4, row: 2 }, morale: 0, troops: 5000 });
    const a2 = mkUnit({ id: 'A2', officerId: 'oa2', side: 'attacker', isCommander: true, coord: { col: 3, row: 4 }, morale: 100, troops: 6000 }); // live commander → battle isn't decided
    const d = mkUnit({ id: 'D', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 7, row: 2 } });
    const b = mkBattle({ units: [a, a2, d], tiles: mkTiles(10, 6), activeSide: 'defender', attackerFormation: 'back-to-water' });
    const after = withRandom(0.5, () => endTurn(b)); // flips to attacker → processRout
    const u = after.units.find((x) => x.id === 'A')!;
    expect(u.morale).toBeGreaterThanOrEqual(20); // 置之死地而後生 — rallied, not routed
    expect(u.coord.col).toBe(4);                  // held its ground (didn't bolt to the edge)
  });
});

// ───────── D — weather morale + AI re-formation ─────────────────────────────

describe('§5.4/§5.2 天候撼士氣 + 臨陣變陣', () => {
  it('天候撼軍 — heavy snow chills the ranks (−morale) where clear weather doesn’t', () => {
    const mk = (weather: 'snow' | 'clear') => mkBattle({
      units: [mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', coord: { col: 1, row: 1 }, morale: 50 }),
        mkUnit({ id: 'D', officerId: 'od', side: 'defender', coord: { col: 9, row: 5 } })], // far → no morale aura
      tiles: mkTiles(12, 7), activeSide: 'attacker', weather,
    });
    const snow = withRandom(0.5, () => endTurn(mk('snow'))).units.find((u) => u.id === 'A')!.morale;
    const clear = withRandom(0.5, () => endTurn(mk('clear'))).units.find((u) => u.id === 'A')!.morale;
    expect(snow).toBeLessThan(clear);
  });

  it('臨陣變陣 — a clever AI re-forms on turn 1 when its shape is hard-countered', () => {
    // attacker 鋒矢(offensive) is countered by defender 鶴翼(mobile beats offensive).
    const a = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 1, row: 2 }, unitType: 'infantry' });
    const d = mkUnit({ id: 'D', officerId: 'od', side: 'defender', isCommander: true, coord: { col: 6, row: 2 } });
    const b = mkBattle({ units: [a, d], tiles: mkTiles(8, 5), activeSide: 'attacker', turn: 1,
      attackerFormation: 'arrow-tip', defenderFormation: 'crane-wing' });
    const officers = { oa: off({ stats: { leadership: 80, war: 80, intelligence: 92, politics: 50, charisma: 60 } }), od: off() };
    const after = withRandom(0.5, () => aiTakeTurn(b, officers, seededRng(3)).battle);
    expect(after.attackerFormation).not.toBe('arrow-tip'); // re-formed to counter the 鶴翼
  });
});
