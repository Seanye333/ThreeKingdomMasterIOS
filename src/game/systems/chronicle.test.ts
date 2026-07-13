import { describe, it, expect } from 'vitest';
import { composeYearChronicle } from './chronicle';
import type { City, Force, Officer } from '../types';

const officer = (id: string): Officer => ({
  id, name: { zh: id, en: id }, birthYear: 160,
  stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
  loyalty: 80, locationCityId: null, forceId: 'wei', status: 'idle', task: null,
  equipment: [], skills: [], rank: 'general',
} as Officer);

describe('史官年鑑 — the yearly page composes from real ledgers', () => {
  it('writes 大勢/兵事/災異/武評 and addresses the lord', () => {
    const cities = {
      a: { id: 'a', ownerForceId: 'wei' } as City,
      b: { id: 'b', ownerForceId: 'wei' } as City,
      c: { id: 'c', ownerForceId: 'shu' } as City,
    };
    const forces = {
      wei: { id: 'wei', name: { zh: '曹魏', en: 'Wei' } } as Force,
      shu: { id: 'shu', name: { zh: '蜀漢', en: 'Shu' } } as Force,
    };
    const page = composeYearChronicle({
      year: 195,
      annals: [
        { year: 195, season: 'summer', kind: 'event', titleZh: '克宛城', textZh: '曹魏克宛城' },
        { year: 195, season: 'autumn', kind: 'disaster', titleZh: '蝗災', textZh: '兗州大蝗' },
        { year: 194, season: 'winter', kind: 'event', titleZh: '前一年', textZh: '不應入鑑' },
      ],
      cities, forces,
      officers: { 'lu-bu': officer('lu-bu') },
      boardTop: new Map([['lu-bu', 1]]),
      prevCounts: { wei: 1, shu: 2 },
      playerForceId: 'shu',
    });
    expect(page.year).toBe(195);
    const body = page.paragraphs.join('\n');
    expect(body).toContain('曹魏');           // 大勢:霸主
    expect(body).toContain('拓地');           // 崛起
    expect(body).toContain('失地');           // 衰落
    expect(body).toContain('蝗災');           // 災異
    expect(body).toContain('第一lu-bu');      // 武評
    expect(body).toContain('主公');           // 收語
    expect(body).not.toContain('不應入鑑');   // 只寫本年
  });

  it('a lord with no cities gets the 臥薪嘗膽 line', () => {
    const page = composeYearChronicle({
      year: 190, annals: [], cities: {}, forces: {}, officers: {},
      boardTop: new Map(), prevCounts: {}, playerForceId: 'me',
    });
    expect(page.paragraphs.join('')).toContain('臥薪嘗膽');
  });
});
