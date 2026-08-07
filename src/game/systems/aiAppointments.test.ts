import { describe, it, expect } from 'vitest';
import type { Appointment, City, Force, Officer } from '../types';
import { planAIAppointments } from './aiAppointments';

function mkOfficer(id: string, politics: number): Officer {
  return {
    id, name: { zh: id, en: id }, forceId: 'wei', birthYear: 180,
    stats: { leadership: politics, war: politics, intelligence: politics, politics, charisma: politics },
    loyalty: 80, status: 'idle', locationCityId: 'c0', task: null,
    equipment: {} as Officer['equipment'], skills: [], rank: 'soldier',
  } as Officer;
}

function mkCity(id: string): City {
  return {
    id, name: { zh: id, en: id }, ownerForceId: 'wei', adjacentCityIds: [],
    population: 100000, troops: 10000, food: 10000, gold: 5000,
    loyalty: 70, defense: 50, order: 70,
  } as unknown as City;
}

/** cityCount 座城、staff 位能吏的一方之霸 —— 一人只能任一職。 */
function realm(cityCount: number, staff = cityCount * 3) {
  const officers: Record<string, Officer> = {};
  const cities: Record<string, City> = {};
  for (let i = 0; i < staff; i++) {
    // 政治由高到低,最高的幾位到得了白金(丞相的 minGrade)。
    officers[`o${i}`] = mkOfficer(`o${i}`, Math.max(62, 101 - i));
  }
  for (let i = 0; i < cityCount; i++) cities[`c${i}`] = mkCity(`c${i}`);
  const forces: Record<string, Force> = {
    wei: { id: 'wei', name: { zh: '魏', en: 'Wei' }, rulerOfficerId: 'o0', capitalCityId: 'c0', color: '#00f', isPlayer: false } as Force,
  };
  return { forces, officers, cities, appointments: [] as Appointment[], playerForceId: null, year: 225 };
}

describe('AI 任官 — 朝官不該被太守吃光', () => {
  /*
   * 這條測試釘的是**順序**,不是某個數字。
   *
   * CIVIC_TITLES 裡 prefect 排第一而且「一城一個」,heldByOfficer 又限一人一職;
   * 照表順序跑,城多的勢力會先把最能幹的人全派去當太守,朝廷反而空著 ——
   * 229 三帝盤實測:魏(60 城)與吳(29 城)六十旬後非太守職位為零,
   * 而只有 20 城的蜀漢湊得出七個。丞相是進「公」爵的硬條件,公才能進王、
   * 王才能稱帝,於是 AI 永遠卡在侯,「孫權稱帝」這種主目標從機制上就達不到。
   */
  it('三十城的大國仍拜得出丞相(而不是三十個太守)', () => {
    const out = planAIAppointments(realm(30));
    const mine = out.appointments.filter((a) => a.forceId === 'wei');
    expect(mine.some((a) => a.titleId === 'chancellor')).toBe(true);
    // 太守照樣派滿 —— 修的是先後,不是砍掉誰。
    expect(mine.filter((a) => a.titleId === 'prefect')).toHaveLength(30);
  });

  it('丞相又排在軍師之前 —— 否則諸葛亮先當了軍師,蜀漢就再沒有第二個白金去拜相', () => {
    const out = planAIAppointments(realm(30));
    const mine = out.appointments.filter((a) => a.forceId === 'wei');
    const chancellor = mine.find((a) => a.titleId === 'chancellor');
    const strategist = mine.find((a) => a.titleId === 'strategist');
    expect(chancellor).toBeDefined();
    expect(strategist).toBeDefined();
    // 政治/智力同分的設定下,拜相的是最高分那位。
    expect(chancellor!.officerId).toBe('o0');
  });
});
