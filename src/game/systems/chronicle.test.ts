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
    expect(page.paragraphs.join('')).not.toContain('論曰'); // nothing to judge yet
  });
});

/**
 * 論曰 — the verdict reads the realm as it actually stands. These pin the
 * band boundaries so a governance change is visible in the historian's
 * wording rather than silently rounding to the same sentence.
 */
describe('史官的褒貶 — 論曰 judges from the live ledgers', () => {
  const town = (id: string, loyalty: number): City =>
    ({ id, ownerForceId: 'me', loyalty } as City);
  const page = (over: Partial<Parameters<typeof composeYearChronicle>[0]> = {}) =>
    composeYearChronicle({
      year: 200, annals: [], cities: { a: town('a', 90) }, forces: {}, officers: {},
      boardTop: new Map(), prevCounts: {}, playerForceId: 'me', ...over,
    }).paragraphs.join('\n');

  it('praises a well-governed realm and condemns a starved one', () => {
    expect(page({ cities: { a: town('a', 92) } })).toContain('道不拾遺');
    expect(page({ cities: { a: town('a', 20) } })).toContain('民不聊生');
  });

  it('reports whether the officers mean to stay', () => {
    const loyal = { x: { ...officer('x'), loyalty: 95 } as Officer };
    const restless = { x: { ...officer('x'), loyalty: 40 } as Officer };
    const mine = (o: Officer) => ({ ...o, forceId: 'me' });
    expect(page({ officers: { x: mine(loyal.x) } })).toContain('皆願效死');
    expect(page({ officers: { x: mine(restless.x) } })).toContain('離心已見');
  });

  it('counts the talent still lying in the fields', () => {
    const genius = (id: string): Officer => ({
      ...officer(id), forceId: null, stats: { leadership: 70, war: 95, intelligence: 70, politics: 70, charisma: 70 },
    } as Officer);
    const free = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`g${i}`, genius(`g${i}`)]));
    expect(page({ officers: free })).toContain('未見旌招');
    expect(page({ officers: {} })).toContain('略已收攬');
  });

  it('calls out a year spent entirely at war', () => {
    const wars = Array.from({ length: 6 }, (_, i) => ({
      year: 200, season: 'summer' as const, kind: 'event' as const,
      titleZh: `克某城${i}`, textZh: '克之',
    }));
    expect(page({ annals: wars })).toContain('窮兵者未有能久者也');
    expect(page({ annals: [] })).toContain('國用日饒');
  });

  it('measures a claimed throne against the ground actually held', () => {
    const forces = { me: { id: 'me', name: { zh: '我', en: 'Me' }, imperialRank: 'emperor' } as Force };
    // One city of five — the title outruns the realm.
    const thin = {
      a: town('a', 90),
      b: { id: 'b', ownerForceId: 'other' } as City, c: { id: 'c', ownerForceId: 'other' } as City,
      d: { id: 'd', ownerForceId: 'other' } as City, e: { id: 'e', ownerForceId: 'other' } as City,
    };
    expect(page({ forces, cities: thin })).toContain('輿地未半');
    expect(page({ forces, cities: { a: town('a', 90), b: town('b', 90) } })).toContain('名實相副');
  });

  it('judges a disaster year by whether relief reached the towns', () => {
    const woe = [{ year: 200, season: 'autumn' as const, kind: 'disaster' as const, titleZh: '大水', textZh: '河溢' }];
    expect(page({ annals: woe, cities: { a: town('a', 80) } })).toContain('民不甚困');
    expect(page({ annals: woe, cities: { a: town('a', 25) } })).toContain('賑貸不繼');
  });
});
