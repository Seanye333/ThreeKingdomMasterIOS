import { describe, it, expect } from 'vitest';
import { SCENARIOS, scenarioPremiseOfficerIds } from './scenarios';
import { HISTORICAL_EVENTS } from './events';
import { findFiringEventIn } from '../systems/historicalEvents';
import type { City, EntityId, Force, HistoricalEvent, Officer } from '../types';

/**
 * 假想盤的**前提人物**不該死在自己的盤上。
 *
 * 這條測試是實測撈出來的,不是設想的。修之前跑 `observeScenario` 三輪:
 *
 *   關羽守住荊州   關羽第 1 旬死於「關羽,麥城死」   3/3
 *   若關羽威震華夏 關羽第 1–2 旬死於「白衣渡江」     3/3
 *   若周瑜不死     周瑜第 1–5 旬死於「周瑜歸天」     3/3
 *   若董卓未亡     董卓第 3–6 旬死於「呂布弒董」     3/3
 *   若孫策不死     孫策第 3–6 旬死於「孫策死於刺客」 3/3
 *   若郭嘉不死     郭嘉第 9–12 旬死於「郭嘉遺計定遼東」3/3
 *
 * 兩個獨立的殺手,缺一條修不完:
 *
 *  1. **事件**:守衛問的是「此人還活著嗎」,而這種盤的前提正是他活著 ——
 *     於是那條殺他的事件不但不被擋,還必然成立。
 *  2. **壽命**:`deathChance` 一旦「當前年 ≥ 史實卒年」就回 0.3 + 0.15×超出年數。
 *     陸遜卒 245 而盤 249 開局 = 每年 90%,實測 3/3 死在第一個冬季。
 *
 * 兩者都無聲 —— 沒有任何測試會紅,玩家只會覺得「這張盤怎麼開場就崩了」。
 */
describe('假想盤的前提人物', () => {
  const whatIfBoards = SCENARIOS.filter((s) => s.kind === 'whatif');

  it('每個 premiseOfficerIds 都是那張盤上真的、活著的人', () => {
    for (const sc of SCENARIOS) {
      for (const id of sc.premiseOfficerIds ?? []) {
        const o = sc.officers.find((x) => x.id === id);
        expect(o, `${sc.id} 的前提人物 ${id} 不在盤上 —— 查不到會靜默失效`).toBeTruthy();
        expect(o!.status, `${sc.id} 的前提人物 ${id} 開局就是死的`).not.toBe('dead');
      }
    }
  });

  /*
   * 史實卒年必須清掉。這一條單獨釘,是因為它與上一條是兩個不同的機制:
   * 人還在盤上、事件也攔住了,而壽命系統照樣每年擲一次 45%。
   */
  it('前提人物的史實卒年已經清掉(否則壽命系統每年 30–90% 擲殺)', () => {
    for (const sc of SCENARIOS) {
      for (const id of sc.premiseOfficerIds ?? []) {
        const o = sc.officers.find((x) => x.id === id);
        expect(
          o?.deathYear,
          `${sc.id} 的 ${id} 還帶著史實卒年 ${o?.deathYear},開局年是 ${sc.startDate.year}`,
        ).toBeUndefined();
      }
    }
  });

  /**
   * 真正的把關:拿全庫事件表跑一遍,任何一條會把前提人物設成 dead 的事件
   * 都不該在那張盤上被選中。用 `alwaysFire` 拿掉 0.6 的擲骰,只問條件。
   */
  it('沒有一條會殺前提人物的事件能在那張盤上點燃', () => {
    for (const sc of whatIfBoards) {
      const premise = sc.premiseOfficerIds ?? [];
      if (!premise.length) continue;
      const kills = HISTORICAL_EVENTS.filter((e: HistoricalEvent) => {
        const dies = (fx: typeof e.effects) =>
          (fx ?? []).some(
            (f) => f.kind === 'officer-status' && f.status === 'dead' && premise.includes(f.officerId),
          );
        return dies(e.effects) || (e.choices ?? []).some((c) => dies(c.effects));
      });
      if (!kills.length) continue;

      const officers: Record<EntityId, Officer> = Object.fromEntries(
        sc.officers.map((o) => [o.id, o]),
      );
      const cities: Record<EntityId, City> = Object.fromEntries(sc.cities.map((c) => [c.id, c]));
      const forces: Record<EntityId, Force> = Object.fromEntries(sc.forces.map((f) => [f.id, f]));
      // 掃過那張盤涵蓋得到的每一年 —— 窗口沒到不算擋住了。
      for (let year = sc.startDate.year; year <= sc.startDate.year + 12; year++) {
        for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
          const hit = findFiringEventIn(kills, {
            date: { year, season },
            cities,
            officers,
            forces,
            eventFlags: {},
            firedEventIds: [],
            premiseOfficerIds: scenarioPremiseOfficerIds(sc.id),
          }, { alwaysFire: true });
          expect(
            hit,
            `${sc.name.zh}(${sc.id})${year} 年 ${season}:「${hit?.name.zh}」會殺掉這張盤的前提人物`,
          ).toBeNull();
        }
      }
    }
  });

  /*
   * 反向:把保護拿掉,同一組事件**必須**點得著 —— 否則上面那條測試可能只是
   * 因為條件本來就不成立而綠,等於一條空測試。
   */
  it('拿掉保護之後,那些事件確實點得著(證明上一條不是空測試)', () => {
    const board = SCENARIOS.find((s) => s.id === 'scn-whatif-zhouyu-lives')!;
    const officers: Record<EntityId, Officer> = Object.fromEntries(
      board.officers.map((o) => [o.id, o]),
    );
    const cities: Record<EntityId, City> = Object.fromEntries(board.cities.map((c) => [c.id, c]));
    const forces: Record<EntityId, Force> = Object.fromEntries(board.forces.map((f) => [f.id, f]));
    const zhouYuDies = HISTORICAL_EVENTS.filter((e: HistoricalEvent) =>
      (e.effects ?? []).some(
        (f) => f.kind === 'officer-status' && f.status === 'dead' && f.officerId === 'zhou-yu',
      ),
    );
    expect(zhouYuDies.length, '事件表裡沒有殺周瑜的事件了 —— 這條測試要重寫').toBeGreaterThan(0);

    const unprotected = findFiringEventIn(zhouYuDies, {
      date: { year: board.startDate.year, season: 'spring' },
      cities,
      officers,
      forces,
      eventFlags: {},
      firedEventIds: [],
      // premiseOfficerIds 故意不傳
    }, { alwaysFire: true });
    expect(unprotected, '沒有保護時「周瑜歸天」本來就點得著').not.toBeNull();
  });
});
