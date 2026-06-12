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
