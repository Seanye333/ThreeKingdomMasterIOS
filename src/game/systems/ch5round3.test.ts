import { describe, it, expect } from 'vitest';
import { STRATAGEM_DEFS, DEFENSIVE_SCHEMES, applicableStratagems } from '../data/stratagems2';
import { resolveDuel } from './duel';
import { resolveBattle, type BattleSide } from './combat';
import { aiTakeTurn } from './tacticalAi';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap, seededRng } from '../../test/factories';
import type { Officer, City } from '../types';

const off = (over: Partial<Officer> = {}): Officer => mkOfficer({ stats: { leadership: 75, war: 85, intelligence: 70, politics: 50, charisma: 60 }, ...over });

// ───────── 名計補全 — three iconic plots join the roster ─────────────────────

describe('§5.3 名計補全 — 空城/苦肉/聲東擊西', () => {
  it('the three defs exist with sane gates + effects', () => {
    for (const id of ['empty-fort', 'bitter-flesh', 'feint-strike'] as const) {
      expect(STRATAGEM_DEFS[id]).toBeTruthy();
      expect(STRATAGEM_DEFS[id].minIntelligence).toBeGreaterThan(60);
    }
    expect(DEFENSIVE_SCHEMES.has('empty-fort')).toBe(true); // 空城計 is a defender's bluff
    expect(STRATAGEM_DEFS['empty-fort'].failurePenalty).toBeTruthy(); // a failed bluff is ruin
  });

  it('空城計 only offers itself to a vastly-outnumbered defender; 聲東擊西 wants a wit edge', () => {
    const base = { attacker: off(), defender: off(), city: { terrain: 'plain', port: false } as City, weather: { kind: 'clear', windPower: 0 } as never, defenderAvgLoyalty: 80 };
    // empty-fort applicable when defender ≪ attacker.
    expect(STRATAGEM_DEFS['empty-fort'].isApplicable({ ...base, attackerTroops: 20000, defenderTroops: 4000, attackerIntelligence: 95, defenderIntelligence: 95 } as never)).toBe(true);
    expect(STRATAGEM_DEFS['empty-fort'].isApplicable({ ...base, attackerTroops: 8000, defenderTroops: 9000, attackerIntelligence: 95, defenderIntelligence: 95 } as never)).toBe(false);
    // feint-strike wants attacker INT > defender + 5.
    expect(STRATAGEM_DEFS['feint-strike'].isApplicable({ ...base, attackerTroops: 1, defenderTroops: 1, attackerIntelligence: 90, defenderIntelligence: 70 } as never)).toBe(true);
    expect(STRATAGEM_DEFS['feint-strike'].isApplicable({ ...base, attackerTroops: 1, defenderTroops: 1, attackerIntelligence: 72, defenderIntelligence: 80 } as never)).toBe(false);
  });

  it('a clever attacker is actually offered the new plots (applicableStratagems)', () => {
    const opts = applicableStratagems({ attacker: off({ stats: { leadership: 80, war: 70, intelligence: 95, politics: 50, charisma: 60 } }), defender: off({ stats: { leadership: 70, war: 70, intelligence: 70, politics: 50, charisma: 60 } }), attackerTroops: 20000, defenderTroops: 18000, city: { terrain: 'plain', port: false } as City, weather: { kind: 'clear', windPower: 0 } as never, attackerIntelligence: 95, defenderIntelligence: 70, defenderAvgLoyalty: 80 } as never, 12);
    expect(opts.some((o) => o.id === 'feint-strike' || o.id === 'bitter-flesh')).toBe(true);
  });
});

// ───────── 單挑接兵裝 — weapon class clashes in single combat ─────────────────

describe('§5.9 單挑接兵裝 — 戟將 wrests a 騎將 from the saddle', () => {
  it('a halberd duellist beats a cavalry lord more often than a plain-armed one', () => {
    const cav = () => off({ id: 'd', equipment: ['red-hare'] });          // 騎將
    const rate = (atkEq: string[]) => {
      const rng = seededRng(5); let wins = 0;
      for (let i = 0; i < 200; i++) {
        const r = resolveDuel({ attacker: off({ id: 'a', equipment: atkEq }), defender: cav(), rng });
        if (r.winner === 'attacker') wins++;
      }
      return wins / 200;
    };
    expect(rate(['sky-piercer'])).toBeGreaterThan(rate([])); // 戟制騎 tilts the bout
  });
});

// ───────── 抽象戰再深 — a decisive auto-battle becomes a rout ──────────────────

describe('§5.8 兵敗如山倒 — a lopsided auto-resolve shatters the loser', () => {
  const ctx = { city: { id: 'c', name: { zh: '城', en: 'C' }, terrain: 'plain', port: false } as unknown as City, allowPursuit: true } as never;
  it('an overwhelmed defender loses a far larger SHARE than in a close fight', () => {
    const rng = seededRng(9);
    const lossShare = (atkTroops: number) => {
      let total = 0; const N = 60;
      for (let i = 0; i < N; i++) {
        const atk: BattleSide = { troops: atkTroops, commander: off(), companions: [] };
        const def: BattleSide = { troops: 8000, commander: off(), companions: [] };
        const r = resolveBattle(atk, def, 0, rng, ctx);
        total += r.defenderLosses / 8000;
      }
      return total / N;
    };
    const blowout = lossShare(40000); // attacker overwhelms
    const close = lossShare(9000);    // near-even
    expect(blowout).toBeGreaterThan(close);
    expect(blowout).toBeGreaterThan(0.7); // the broken host is cut down
  });
});

// ───────── 名戰場 AI — the AI breaks the dam when the flood favours it ─────────

describe('§5.10 AI 決堰 — the marshal makes for the dam when it drowns more foes', () => {
  it('an AI commander steps to the 漢水堰 and breaks it (水淹七軍)', () => {
    const cmd = mkUnit({ id: 'A', officerId: 'oa', side: 'attacker', isCommander: true, coord: { col: 3, row: 2 }, troops: 6000 });
    const foe1 = mkUnit({ id: 'D1', officerId: 'od1', side: 'defender', coord: { col: 8, row: 3 }, troops: 5000 }); // on the river
    const foe2 = mkUnit({ id: 'D2', officerId: 'od2', side: 'defender', coord: { col: 8, row: 2 }, troops: 5000 }); // on the river
    const b = mkBattle({
      units: [cmd, foe1, foe2],
      tiles: mkTiles(12, 6, { '8,3': 'river', '8,2': 'river' }),
      width: 12, height: 6, activeSide: 'attacker',
      specialTiles: [{ coord: { col: 4, row: 2 }, label: { en: 'Han Dam', zh: '漢水堰' }, role: 'bridge' }],
    });
    // 2 foes on the water, 0 of ours → breaking the dam is pure profit.
    const after = aiTakeTurn(b, officerMap([cmd, foe1, foe2]), seededRng(2)).battle;
    expect(after.damBroken).toBe(true);
  });
});
