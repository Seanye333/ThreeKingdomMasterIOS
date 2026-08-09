import { describe, it, expect } from 'vitest';
import { planAICourt } from './aiCourt';
import { HISTORICAL_EVENTS } from '../data/events';
import type { City, EntityId, Force, Officer } from '../types';

/**
 * 僭號 —— 傳國璽在手的那一條稱帝路。
 *
 * 為什麼要有它:`imperial-seal-found` 從前是個**只寫不讀**的旗標(全庫沒有
 * 任何地方讀它),於是「孫堅得玉璽」這個名場面在遊戲裡不影響任何東西。
 * 連帶的後果是**袁術永遠稱不了帝** —— `aiCourt` 的即位規則要王爵
 * (二十城 + 215 年後)且 220 年之後,而他建安二年就僭號了,據淮南八九座城,
 * 憑的是讖言與孫策質下的那方璽。四張盤上他的主目標叫「仲氏之業」,而那條路
 * 機制上不存在。
 */
const mkOfficer = (id: string, forceId: string | null): Officer => ({
  id, name: { en: id, zh: id }, forceId,
  birthYear: 155, status: 'active', loyalty: 80,
  locationCityId: 'shouchun', task: null,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
} as unknown as Officer);

const mkCity = (id: string, ownerForceId: string | null): City => ({
  id, name: { en: id, zh: id }, ownerForceId,
  troops: 10000, food: 50000, gold: 8000, defense: 50, loyalty: 70,
  population: 200000, agriculture: 60, commerce: 60,
  adjacentCityIds: [], buildings: [],
} as unknown as City);

function scene(flags: Record<string, boolean>, year: number, cityCount = 9) {
  const force: Force = {
    id: 'yuan-shu', name: { en: 'Yuan Shu', zh: '袁術' },
    rulerOfficerId: 'yuan-shu', capitalCityId: 'shouchun',
    color: '#888', imperialRank: 'marquis', isPlayer: false,
  } as unknown as Force;
  const forces: Record<EntityId, Force> = { 'yuan-shu': force };
  const cities: Record<EntityId, City> = {};
  for (let i = 0; i < cityCount; i++) {
    const id = i === 0 ? 'shouchun' : `c${i}`;
    cities[id] = mkCity(id, 'yuan-shu');
  }
  const officers: Record<EntityId, Officer> = { 'yuan-shu': mkOfficer('yuan-shu', 'yuan-shu') };
  return {
    forces, cities, officers,
    appointments: [], edictCooldowns: {}, deeds: {},
    diplomacy: { relations: {} } as never,
    eventFlags: flags,
    mandate: { byForce: { 'yuan-shu': 60 } },
    date: { year, season: 'spring' as const },
    playerForceId: null,
    laterHanBoard: true,
    rng: () => 0.01,   // 一定過機率門檻
  };
}

describe('僭號:傳國璽在手的稱帝路', () => {
  it('袁術持璽、九座城,在 197 年就稱得了帝', () => {
    const ctx = scene({ 'seal-with-yuan-shu': true }, 197);
    const out = planAICourt(ctx as never);
    expect(out.forces['yuan-shu'].imperialRank).toBe('emperor');
  });

  /* 反向:沒有那方璽,同樣的本錢在 197 年稱不了 —— 否則上一條只是「機率過了」。 */
  it('沒有璽,同樣的本錢在 197 年稱不了帝', () => {
    const ctx = scene({}, 197);
    const out = planAICourt(ctx as never);
    expect(out.forces['yuan-shu'].imperialRank).toBe('marquis');
  });

  /* 門檻低而不是沒有:三座城的殘部拿著璽也僭不起來。 */
  it('持璽而只有三座城,僭不起來', () => {
    const ctx = scene({ 'seal-with-yuan-shu': true }, 197, 3);
    const out = planAICourt(ctx as never);
    expect(out.forces['yuan-shu'].imperialRank).toBe('marquis');
  });

  it('玉璽的流轉在事件表上接得起來:孫堅得璽 → 孫策質璽於袁術', () => {
    const found = HISTORICAL_EVENTS.find((e) => e.id === 'evt-sun-jian-imperial-seal')!;
    const pledge = HISTORICAL_EVENTS.find((e) => e.id === 'evt-sun-ce-pledges-seal')!;
    expect(found, '孫堅得玉璽這條事件不見了').toBeTruthy();
    expect(pledge, '孫策以璽借兵這條事件不見了').toBeTruthy();
    // 前一節種下的旗標,正是後一節要求的
    const sets = (found.effects ?? []).filter((f) => f.kind === 'flag').map((f) => (f as { key: string }).key);
    expect(sets).toContain('seal-with-sun-jian');
    const needs = (pledge.requires ?? []).filter((r) => r.kind === 'flag-set').map((r) => (r as { key: string }).key);
    expect(needs).toContain('seal-with-sun-jian');
    // 後一節種下的,正是 aiCourt 讀的那一個
    const pledgeSets = (pledge.effects ?? []).filter((f) => f.kind === 'flag').map((f) => (f as { key: string }).key);
    expect(pledgeSets).toContain('seal-with-yuan-shu');
  });
});
