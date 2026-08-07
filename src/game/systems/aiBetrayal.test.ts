import { describe, expect, it } from 'vitest';
import type { City, DiplomaticState, Force } from '../types';
import { getRelation, pairKey } from '../types';
import { decideBetrayals, applyBetrayal, BETRAYAL_BYSTANDER_RELATION } from './aiBetrayal';

const mkCity = (id: string, owner: string, troops: number, adj: string[]): City =>
  ({ id, name: { zh: id, en: id }, ownerForceId: owner, adjacentCityIds: adj,
     population: 100_000, troops, food: 10_000, gold: 1_000,
     loyalty: 70, defense: 50, order: 70 } as unknown as City);

const mkForce = (id: string): Force =>
  ({ id, name: { zh: id, en: id }, rulerOfficerId: `${id}-r`, capitalCityId: `${id}-a`,
     color: '#000', isPlayer: false } as Force);

/** 強者(a,兩城各一萬)與弱者(b,一城一千)接壤,關係為互不侵犯。 */
function board(relStatus: 'non-aggression' | 'neutral' | 'allied', relScore = 20, bTroops = 1000) {
  const cities: Record<string, City> = {
    'a-a': mkCity('a-a', 'a', 10_000, ['a-b', 'b-a']),
    'a-b': mkCity('a-b', 'a', 10_000, ['a-a', 'b-a']),
    'b-a': mkCity('b-a', 'b', bTroops, ['a-a', 'a-b']),
  };
  const diplomacy: DiplomaticState = {
    relations: { [pairKey('a', 'b')]: { forceA: 'a', forceB: 'b', score: relScore, status: relStatus } },
  };
  return {
    forces: { a: mkForce('a'), b: mkForce('b'), c: mkForce('c') },
    cities, diplomacy, aiForceIds: ['a', 'b'],
    appetiteOf: () => 1,
    rng: () => 0.001,   // 必定過機率門檻;門檻本身另有測試
  };
}

describe('AI 背盟 — 撕毀盟約不再只有玩家做得到', () => {
  /*
   * 為什麼要有這條:`isHostilePermitted` 只在關係 neutral 時放行,而
   * `breakAlliance` 是 store 上的玩家動作。於是 211 渭南盤的 AI 劉備
   * 與劉璋是 non-aggression(史實上他正是被請進去的),他**永遠**打不了益州,
   * 而那張盤他的主目標就叫「西取益州」。
   */
  it('壓得住又吃得下時,強者撕約', () => {
    const out = decideBetrayals(board('non-aggression'));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ byForceId: 'a', targetForceId: 'b', prizeCityId: 'b-a' });
  });

  it('只撕互不侵犯 —— 結盟另有聯姻/會盟系統管,中立本來就打得', () => {
    expect(decideBetrayals(board('allied'))).toHaveLength(0);
    expect(decideBetrayals(board('neutral'))).toHaveLength(0);
  });

  it('關係太好不翻臉', () => {
    expect(decideBetrayals(board('non-aggression', 80))).toHaveLength(0);
  });

  it('打不過就守約 —— 弱者不會背盟', () => {
    // b 兵力拉到與 a 相當:誰都不到 1.6 倍,兩邊都不動。
    expect(decideBetrayals(board('non-aggression', 20, 20_000))).toHaveLength(0);
  });

  it('背盟之後四鄰側目', () => {
    const b = board('non-aggression');
    const next = applyBetrayal(b.diplomacy, { byForceId: 'a', targetForceId: 'b', prizeCityId: 'b-a' }, ['a', 'b', 'c']);
    expect(getRelation(next, 'a', 'b').status).toBe('neutral');   // 盟約已撕,可以動兵
    expect(getRelation(next, 'a', 'c').score).toBe(BETRAYAL_BYSTANDER_RELATION); // 旁觀者(原本 0)
  });
});
