/** 終局史書 — locks the historians' compilation. */
import { describe, expect, it } from 'vitest';
import type { City, Force, HistoricBattle } from '../types';
import { createDeeds } from '../types/deeds';
import { mkOfficer } from '../../test/factories';
import { composeHistoryBook, historyBookToText } from './historyBook';

const input = () => ({
  playerForceId: 'shu',
  forces: { shu: { id: 'shu', name: { zh: '劉備軍', en: 'Liu Bei' }, rulerOfficerId: 'liu-bei', capitalCityId: 'chengdu' } as Force },
  officers: {
    'liu-bei': mkOfficer({ id: 'liu-bei', forceId: 'shu' }),
    'guan-yu': mkOfficer({ id: 'guan-yu', forceId: 'shu', stats: { war: 97 }, name: { zh: '關羽', en: 'Guan Yu' } }),
  },
  cities: {
    chengdu: { id: 'chengdu', ownerForceId: 'shu', name: { zh: '成都', en: 'Chengdu' } } as City,
    hefei: { id: 'hefei', ownerForceId: null, name: { zh: '合肥', en: 'Hefei' } } as City,
  },
  deeds: { 'guan-yu': { ...createDeeds('guan-yu'), citiesTaken: 3, battlesWon: 8, duelsWon: 2 } },
  battleHistory: [
    {
      id: 'b1', cityId: 'hefei', date: { year: 200, season: 'autumn' },
      attacker: { forceId: 'shu', commanderId: 'guan-yu', companionIds: [], troops: 30000, bondBonus: 0, blendedStat: 90, power: 1 },
      defender: { forceId: 'wei', commanderId: 'liu-bei', companionIds: [], troops: 25000, bondBonus: 0, blendedStat: 70, power: 1 },
      cityDefense: 50, defenseFactor: 1.3, attackerWins: true, cityFalls: true,
      attackerLosses: 1000, defenderLosses: 9000,
    } as HistoricBattle,
  ],
  chronicle: [
    { year: 196, season: 'spring', zh: '舉义旗於涿郡', kind: 'event' },
    { year: 200, season: 'autumn', zh: '克合肥', kind: 'conquest' },
  ],
  victoryStatus: 'victory',
  startYear: 196,
  currentYear: 208,
});

describe('composeHistoryBook', () => {
  it('compiles preface, annals, battles, lives and the appraisal', () => {
    const book = composeHistoryBook(input());
    const titles = book.map((s) => s.title);
    expect(titles).toEqual(['序', '大事記', '十大戰役', '功臣列傳', '贊曰']);
    const all = book.flatMap((s) => s.lines).join('');
    expect(all).toContain('終定鼎天下');
    expect(all).toContain('合肥之役');
    expect(all).toContain('【關');
  });

  it('an ongoing campaign reads as the unfinished scroll', () => {
    const book = composeHistoryBook({ ...input(), victoryStatus: 'playing' });
    expect(book.flatMap((s) => s.lines).join('')).toContain('此卷未完');
  });

  it('exports a readable text scroll', () => {
    const txt = historyBookToText(composeHistoryBook(input()), '劉備軍');
    expect(txt).toContain('《劉備軍本紀》');
    expect(txt).toContain('■ 十大戰役');
  });
});
