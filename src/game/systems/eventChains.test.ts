/**
 * 歷史事件鏈 — locks the chain machinery: flag-gated steps, the
 * officer-unaffiliated predicate, and choice effects applying through
 * the ordinary event-effect pipeline.
 */
import { describe, expect, it } from 'vitest';
import type { City, Force, Officer } from '../types';
import { mkOfficer } from '../../test/factories';
import { applyEventEffects, findFiringEvent } from './historicalEvents';
import type { HistoricalEventContext } from './historicalEvents';
import { HISTORICAL_EVENTS } from '../data/events';

const maolu1 = HISTORICAL_EVENTS.find((e) => e.id === 'evt-maolu-1')!;
const maolu3 = HISTORICAL_EVENTS.find((e) => e.id === 'evt-maolu-3')!;

function ctx(over: Partial<HistoricalEventContext> = {}): HistoricalEventContext {
  const officers: Record<string, Officer> = {
    'liu-bei': mkOfficer({ id: 'liu-bei', forceId: 'shu', status: 'active' }),
    'zhuge-liang': mkOfficer({ id: 'zhuge-liang', forceId: null, status: 'active' }),
  };
  const forces: Record<string, Force> = {
    shu: { id: 'shu', name: { zh: '劉備軍', en: 'Liu Bei' }, rulerOfficerId: 'liu-bei', capitalCityId: 'xinye', color: '#3a9b5c' } as Force,
  };
  const cities: Record<string, City> = {
    xinye: { id: 'xinye', ownerForceId: 'shu' } as City,
  };
  return {
    date: { year: 208, season: 'spring' } as HistoricalEventContext['date'],
    cities, officers, forces,
    eventFlags: {},
    firedEventIds: [],
    romanceMode: true,
    ...over,
  };
}

describe('三顧茅廬 chain', () => {
  it('step 1 fires only while Kongming is unaffiliated', () => {
    expect(findFiringEvent(ctx())?.id).toBe('evt-maolu-1');
    const recruited = ctx();
    recruited.officers['zhuge-liang'] = { ...recruited.officers['zhuge-liang'], forceId: 'shu' };
    expect(findFiringEvent(recruited)?.id).not.toBe('evt-maolu-1');
  });

  it('steps gate on the previous visit flag; abandoning kills the chain', () => {
    expect(findFiringEvent(ctx({ firedEventIds: ['evt-maolu-1'] }))?.id ?? null).not.toBe('evt-maolu-2');
    expect(findFiringEvent(ctx({
      firedEventIds: ['evt-maolu-1'],
      eventFlags: { 'maolu-visit-1': true },
    }))?.id).toBe('evt-maolu-2');
    // Abandoned: no chain step may fire again (the legacy fallback event
    // taking over instead is fine — history corrects itself).
    const afterAbandon = findFiringEvent(ctx({
      firedEventIds: ['evt-maolu-1', 'evt-maolu-2'],
      eventFlags: { 'maolu-visit-1': true, 'maolu-abandoned': true },
    }));
    expect(afterAbandon?.id?.startsWith('evt-maolu')).not.toBe(true);
  });

  it('the invite choice recruits Kongming through the normal effect pipe', () => {
    const c = ctx();
    const invite = maolu3.choices!.find((ch) => ch.id === 'invite')!;
    const after = applyEventEffects({ ...maolu3, effects: invite.effects, choices: undefined }, {
      date: c.date, cities: c.cities, officers: c.officers, forces: c.forces,
      eventFlags: c.eventFlags, firedEventIds: c.firedEventIds,
    });
    expect(after.officers['zhuge-liang'].forceId).toBe('shu');
    expect(after.eventFlags['maolu-done']).toBe(true);
  });

  it('the historical path is the FIRST choice on every chain step', () => {
    for (const evt of HISTORICAL_EVENTS.filter((e) => e.choices?.length)) {
      // First choice must advance, not abandon — the AI walks this path.
      const first = evt.choices![0];
      expect(first.effects.some((e) => e.kind === 'flag' && e.key.includes('abandon'))).toBe(false);
    }
  });

  it('chooser must rule for the choice to be offered (engine contract)', () => {
    expect(maolu1.chooserRulerId).toBe('liu-bei');
  });
});

describe('新增四鏈 — 連環計/烏巢/白衣/空城', () => {
  it('連環計: the rift gates the halberd; the legacy one-shot stands down', () => {
    const officers = {
      'wang-yun': mkOfficer({ id: 'wang-yun', forceId: 'dz', status: 'active' }),
      'dong-zhuo': mkOfficer({ id: 'dong-zhuo', forceId: 'dz', status: 'active' }),
      'lu-bu': mkOfficer({ id: 'lu-bu', forceId: 'dz', status: 'active' }),
    };
    const forces = {
      dz: { id: 'dz', name: { zh: '董卓軍', en: 'Dong Zhuo' }, rulerOfficerId: 'dong-zhuo', capitalCityId: 'changan', color: '#666' },
    } as unknown as HistoricalEventContext['forces'];
    const cities = { changan: { id: 'changan', ownerForceId: 'dz' } } as HistoricalEventContext['cities'];
    const c = (flags: Record<string, boolean>, fired: string[]) => ({
      date: { year: 192, season: 'spring' } as HistoricalEventContext['date'],
      cities, officers, forces, eventFlags: flags, firedEventIds: fired, romanceMode: true,
    });
    expect(findFiringEvent(c({}, []))?.id).toBe('evt-lianhuan-1');
    expect(findFiringEvent(c({ 'lianhuan-sown': true }, ['evt-lianhuan-1']))?.id).toBe('evt-lianhuan-2');
    // Rift path: the chain finale fires, NOT the legacy one-shot.
    expect(findFiringEvent(c({ 'lianhuan-sown': true, 'lianhuan-rift': true }, ['evt-lianhuan-1', 'evt-lianhuan-2']))?.id).toBe('evt-lianhuan-3');
    // Averted: neither the finale nor the legacy event (rift unset blocks one, averted means wang-yun chain spent).
    const averted = findFiringEvent(c({ 'lianhuan-sown': true, 'lianhuan-averted': true }, ['evt-lianhuan-1', 'evt-lianhuan-2']));
    expect(averted?.id).toBe('evt-dong-zhuo-assassinated'); // history still finds a way (fallback allowed when no rift)
  });

  it('空城計 waits for 三顧茅廬 to have delivered Kongming', () => {
    const evt = HISTORICAL_EVENTS.find((e) => e.id === 'evt-kongcheng')!;
    expect(evt.requires?.some((r) => r.kind === 'flag-set' && r.key === 'maolu-done')).toBe(true);
    expect(evt.chooserRulerId).toBe('sima-yi');
    // Historical first choice retreats — Kongming escapes.
    expect(evt.choices?.[0].id).toBe('retreat');
  });
});

describe('名場面補完批 — 甘露寺→截江 / 逍遙津→甘寧劫營', () => {
  it('截江奪阿斗 only fires after the Ganlu wedding actually happened', () => {
    const evt = HISTORICAL_EVENTS.find((e) => e.id === 'evt-jiejiang-aduo')!;
    expect(evt.requires?.some((r) => r.kind === 'flag-set' && r.key === 'ganlu-married')).toBe(true);
    // Declining the wedding sets a different flag — the intercept never fires.
    const wedding = HISTORICAL_EVENTS.find((e) => e.id === 'evt-ganlu-wedding')!;
    const decline = wedding.choices!.find((c) => c.id === 'decline')!;
    expect(decline.effects.some((e) => e.kind === 'flag' && e.key === 'ganlu-married')).toBe(false);
    // Historical first choice recovers the heir and returns Lady Sun to Wu.
    expect(evt.choices?.[0].id).toBe('intercept');
    expect(evt.choices?.[0].effects.some((e) => e.kind === 'officer-join-ruler' && e.rulerOfficerId === 'sun-quan')).toBe(true);
  });

  it("甘寧百騎劫營 is gated on Xiaoyao Ford's shame", () => {
    const raid = HISTORICAL_EVENTS.find((e) => e.id === 'evt-ganning-raid')!;
    expect(raid.requires?.some((r) => r.kind === 'flag-set' && r.key === 'xiaoyaojin')).toBe(true);
    const ford = HISTORICAL_EVENTS.find((e) => e.id === 'evt-xiaoyaojin')!;
    expect(ford.effects.some((e) => e.kind === 'flag' && e.key === 'xiaoyaojin')).toBe(true);
  });

  it('the choice events walk history on their first choice (AI contract)', () => {
    const firsts: Record<string, string> = {
      'evt-wenji-return': 'ransom',
      'evt-ganlu-wedding': 'cross',
      'evt-jiejiang-aduo': 'intercept',
      'evt-jilei-yangxiu': 'execute',
      'evt-huatuo-prison': 'kill',
      'evt-zuoci-mocks': 'hunt',
    };
    for (const [id, choiceId] of Object.entries(firsts)) {
      const evt = HISTORICAL_EVENTS.find((e) => e.id === id)!;
      expect(evt.choices?.[0].id, id).toBe(choiceId);
    }
  });

  it('樂不思蜀 rides the fall-of-Shu flag set by 鄧艾偷渡陰平', () => {
    const evt = HISTORICAL_EVENTS.find((e) => e.id === 'evt-lebusishu')!;
    expect(evt.requires?.some((r) => r.kind === 'flag-set' && r.key === 'shu-fallen-263')).toBe(true);
    const fall = HISTORICAL_EVENTS.find((e) => e.id === 'evt-shu-falls-deng-ai')!;
    expect(fall.effects.some((e) => e.kind === 'flag' && e.key === 'shu-fallen-263')).toBe(true);
  });
});
