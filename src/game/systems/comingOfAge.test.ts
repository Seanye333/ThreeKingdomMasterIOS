import { describe, it, expect } from 'vitest';
import { SERVICE_AGE, hasComeOfAge, isUnborn } from './comingOfAge';
import { rollRecommendations } from './recommendation';
import { festivalPool } from './festival';
import { SCENARIOS } from '../data/scenarios';
import type { Officer } from '../types';

const mk = (id: string, birthYear: number, over: Partial<Officer> = {}): Officer => ({
  id,
  name: { zh: id, en: id },
  birthYear,
  stats: { leadership: 80, war: 80, intelligence: 80, politics: 80, charisma: 80 },
  loyalty: 0,
  locationCityId: 'luoyang',
  forceId: null,
  status: 'unsearched',
  task: null,
  equipment: [],
  skills: [],
  ...over,
} as Officer);

describe('元服 — 未及齡者不入人才池', () => {
  it('年齡以生年現算,不存狀態', () => {
    const kid = mk('kid', 181);
    expect(hasComeOfAge(kid, 184)).toBe(false);       // 三歲
    expect(hasComeOfAge(kid, 181 + SERVICE_AGE)).toBe(true);
    expect(isUnborn(mk('later', 202), 184)).toBe(true);
    expect(isUnborn(kid, 184)).toBe(false);           // 已生,只是尚幼
  });

  it('生年不明者當作已成年 —— 平民與自訂武將不受此限', () => {
    expect(hasComeOfAge({ birthYear: NaN }, 184)).toBe(true);
  });

  it('薦舉不薦鄉里的孩子', () => {
    const officers: Record<string, Officer> = {
      rec: mk('rec', 150, { forceId: 'f', status: 'idle', locationCityId: 'luoyang' }),
      kid: mk('kid', 181),
    };
    // 不給 year → 維持舊行為(既有呼叫端與測試)
    expect(rollRecommendations({ officers, forceId: 'f', rng: () => 0 })).toHaveLength(1);
    // 給了 year → 池子裡只剩那個孩子,於是薦無可薦
    expect(rollRecommendations({ officers, forceId: 'f', rng: () => 0, year: 184 })).toHaveLength(0);
  });

  it('求賢祭召不到尚未出生的人', () => {
    const officers: Record<string, Officer> = {
      grown: mk('grown', 150),
      unborn: mk('unborn', 202),
    };
    expect(festivalPool(officers).all).toHaveLength(2);
    expect(festivalPool(officers, 184).all.map((o) => o.id)).toEqual(['grown']);
  });
});

describe('184 年的盤面', () => {
  /*
   * 這條是**盤面**斷言,不是函式斷言 —— 抓的是「人才池裡有多少人根本不該在」。
   * 體檢十輪跑出過:三歲的諸葛亮被朱儁請進幕府、盧植在月旦評上品評尚未出生的
   * 姜維、而張角一死,黃巾的繼位者是那個三歲的諸葛亮。
   */
  it('尚未出生與未及元服者仍在名冊上(供家族/師承查詢),但不得已在某家麾下', () => {
    const sc = SCENARIOS.find((s) => s.id === 'scn-184-yellow-turban')!;
    const year = sc.startDate.year;
    const live = sc.officers.filter((o) => o.status !== 'dead');
    const tooYoung = live.filter((o) => !hasComeOfAge(o, year));
    // 盤子本來就有一大批未及齡者(184 年最早,佔比最高)—— 這是允許的,
    // 他們留在名冊上,只是不該被任何一條招攬路徑撿走。
    expect(tooYoung.length).toBeGreaterThan(0);
    expect(tooYoung.filter((o) => o.forceId)).toEqual([]);
  });
});
