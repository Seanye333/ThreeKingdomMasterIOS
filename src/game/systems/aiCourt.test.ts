import { describe, it, expect } from 'vitest';
import type { City, DiplomaticState, Force, Officer } from '../types';
import { pairKey } from '../types';
import { planAICourt } from './aiCourt';

function mkCity(id: string, owner: string): City {
  return {
    id, name: { zh: id, en: id }, ownerForceId: owner, adjacentCityIds: [],
    population: 100000, troops: 10000, food: 10000, gold: 20000,
    loyalty: 70, defense: 50, order: 70,
  } as unknown as City;
}

function mkForce(id: string, rank: Force['imperialRank']): Force {
  return {
    id, name: { zh: id, en: id }, rulerOfficerId: `${id}-ruler`,
    capitalCityId: `${id}-c0`, color: '#00f', isPlayer: false, imperialRank: rank,
  } as Force;
}

/**
 * 天下三分:魏已稱帝,蜀吳皆為王,各二十餘城。`hostile` 決定蜀吳與魏的關係。
 */
function splitRealm(hostile: boolean, seed = 0) {
  const forces: Record<string, Force> = {
    wei: mkForce('wei', 'emperor'),
    shu: mkForce('shu', 'king'),
    wu: mkForce('wu', 'king'),
  };
  const cities: Record<string, City> = {};
  for (const f of ['wei', 'shu', 'wu']) for (let i = 0; i < 22; i++) cities[`${f}-c${i}`] = mkCity(`${f}-c${i}`, f);
  const officers: Record<string, Officer> = {};
  for (const f of ['wei', 'shu', 'wu']) {
    officers[`${f}-ruler`] = {
      id: `${f}-ruler`, name: { zh: f, en: f }, forceId: f, birthYear: 180,
      stats: { leadership: 80, war: 80, intelligence: 80, politics: 80, charisma: 80 },
      loyalty: 100, status: 'idle', locationCityId: `${f}-c0`, task: null,
      equipment: {} as Officer['equipment'], skills: [], rank: 'soldier',
    } as Officer;
  }
  const score = hostile ? -40 : 45;
  const diplomacy: DiplomaticState = {
    relations: {
      [pairKey('wei', 'shu')]: { forceA: 'wei', forceB: 'shu', score, status: 'neutral' },
      [pairKey('wei', 'wu')]: { forceA: 'wei', forceB: 'wu', score, status: 'neutral' },
      [pairKey('shu', 'wu')]: { forceA: 'shu', forceB: 'wu', score: 30, status: 'neutral' },
    },
  };
  let n = seed;
  return {
    forces, officers, cities, appointments: [], edictCooldowns: {}, deeds: {},
    diplomacy, eventFlags: {}, mandate: { byForce: { wei: 60, shu: 60, wu: 60 } },
    date: { year: 229, season: 'spring' as const }, playerForceId: null,
    // 固定亂數 —— 只驗「機率是不是零」,不驗擲骰。
    rng: () => { n += 1; return 0.01; },
  };
}

describe('AI 即位 —— 天下已有帝,不等於不能再立一個', () => {
  /*
   * 原規則是「天下已有皇帝則 AI 不得稱帝」,而那把史實寫反了:
   * 劉備 221、孫權 229 兩次稱帝,**都是因為別人先稱了** —— 漢統既絕,
   * 不得不立。照原規則,229 三帝盤上的 AI 孫權永遠登不了基,
   * 而那張盤孫權的主目標就叫「吳皇帝即位」。
   */
  it('與那位皇帝勢不兩立的王,可以割據稱帝', () => {
    const out = planAICourt(splitRealm(true));
    // 蜀吳互為盟友(關係 +30)而同與魏為敵 —— 兩家都該立。
    // 判準用 some 不用 every,正是為了這一格:孫權踐阼時與蜀漢是盟友,
    // 蜀還遣陳震往賀,他要否認的只有洛陽那一位。
    expect(out.newEnthronements.sort()).toEqual(['shu', 'wu']);
  });

  it('與皇帝交好的王不會另立朝廷', () => {
    const out = planAICourt(splitRealm(false));
    expect(out.newEnthronements).toHaveLength(0);
  });
});
