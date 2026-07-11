import { describe, expect, it } from 'vitest';
import { effectChips, type ChipContext } from './eventEffectChips';
import { mkOfficer } from '../../test/factories';
import type { City, EventEffect, Force } from '../../game/types';

const ctx = (lang: 'zh' | 'en' = 'zh'): ChipContext => ({
  officers: {
    'guan-yu': mkOfficer({ id: 'guan-yu', name: { zh: '關羽', en: 'Guan Yu' } }),
    'cao-cao': mkOfficer({ id: 'cao-cao', name: { zh: '曹操', en: 'Cao Cao' } }),
  },
  cities: { hefei: { id: 'hefei', name: { zh: '合肥', en: 'Hefei' } } as City },
  forces: {} as Record<string, Force>,
  lang,
});

describe('effectChips — event effects → player-readable consequence chips', () => {
  it('renders joins, deaths, deltas and multipliers with the right tone', () => {
    const effects: EventEffect[] = [
      { kind: 'officer-join-ruler', officerId: 'guan-yu', rulerOfficerId: 'cao-cao' },
      { kind: 'officer-status', officerId: 'guan-yu', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
      { kind: 'city-defense', cityId: 'hefei', delta: 15 },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 1.03 },
    ];
    const chips = effectChips(effects, ctx());
    expect(chips.map((c) => c.text)).toEqual([
      '⚑ 關羽入曹操麾下',
      '☠ 關羽身死',
      '曹操天命 -3',
      '合肥城防 +15',
      '曹操軍兵力 ×1.03',
    ]);
    expect(chips.map((c) => c.tone)).toEqual(['good', 'bad', 'bad', 'good', 'good']);
  });

  it('flags and wishes are internal — no chips', () => {
    const effects: EventEffect[] = [
      { kind: 'flag', key: 'guan-yu-with-cao' },
      { kind: 'force-wish', officerId: 'guan-yu', wishKind: 'duel', text: { zh: 'x', en: 'x' } },
    ];
    expect(effectChips(effects, ctx())).toEqual([]);
  });

  it('falls back to raw ids for unknown entities and speaks English when asked', () => {
    const chips = effectChips(
      [{ kind: 'city-loyalty', cityId: 'nowhere', delta: -5 }],
      ctx('en'),
    );
    expect(chips[0]).toEqual({ text: 'nowhere loyalty -5', tone: 'bad' });
  });
});
