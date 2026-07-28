import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { haulSummary } from './expedition';
import type { ExpeditionHaul } from '../types/expedition';
import type { EntityId, Officer } from '../types';

/**
 * 所得須言明 — every field of a haul that changes the world permanently must
 * appear in the homecoming report. The bug this replaces: the report printed
 * only `haul.note`, hand-written per errand mode, so a mode that forgot to
 * mention a result never told the player about it at all — including stat
 * gains, recruited officers and home-city loyalty, each a permanent change.
 */

const officers: Record<EntityId, Officer> = {
  wolong: mkOfficer({ id: 'wolong', name: { zh: '諸葛亮', en: 'Zhuge Liang' } } as never) as Officer,
};

describe('haulSummary', () => {
  it('an empty haul summarises to nothing (no stray brackets in the report)', () => {
    expect(haulSummary({}, officers)).toEqual({ zh: '', en: '' });
  });

  it('reports a stat gain — the field that silently changed the officer', () => {
    const h: ExpeditionHaul = { statGain: { stat: 'war', amount: 2 } };
    const s = haulSummary(h, officers);
    expect(s.zh).toContain('武 +2');
    expect(s.en).toContain('WAR +2');
  });

  it('names a recruited officer rather than printing an id', () => {
    const s = haulSummary({ recruitOfficerId: 'wolong' }, officers);
    expect(s.zh).toContain('諸葛亮');
    expect(s.en).toContain('Zhuge Liang');
    expect(s.zh).not.toContain('wolong');
  });

  it('falls back to the id when the officer is unknown, instead of "undefined"', () => {
    const s = haulSummary({ recruitOfficerId: 'ghost' }, officers);
    expect(s.zh).toContain('ghost');
    expect(s.zh).not.toContain('undefined');
  });

  it('reports home loyalty in both directions', () => {
    expect(haulSummary({ homeLoyaltyDelta: 5 }, officers).zh).toContain('民心 +5');
    expect(haulSummary({ homeLoyaltyDelta: -3 }, officers).zh).toContain('民心 -3');
  });

  it('covers every other haul field', () => {
    const s = haulSummary({
      gold: 300, food: 200, auxTroops: 500, prestige: 4, wounded: true,
    }, officers);
    expect(s.zh).toContain('金 +300');
    expect(s.zh).toContain('糧 +200');
    expect(s.zh).toContain('義從 +500');
    expect(s.zh).toContain('天命 +4');
    expect(s.zh).toContain('負傷');
    expect(s.en).toContain('+300 gold');
    expect(s.en).toContain('returns wounded');
  });

  it('joins several results readably', () => {
    const s = haulSummary({ gold: 100, statGain: { stat: 'intelligence', amount: 1 } }, officers);
    expect(s.zh).toBe('金 +100 · 智 +1');
  });

  it('every stat key has a label — an unlabelled stat would print a raw key', () => {
    for (const stat of ['leadership', 'war', 'intelligence', 'politics', 'charisma'] as const) {
      const s = haulSummary({ statGain: { stat, amount: 1 } }, officers);
      expect(s.zh, `${stat} unlabelled`).not.toContain(stat);
      expect(s.zh.length).toBeGreaterThan(0);
    }
  });

  it('both languages are populated whenever anything is', () => {
    const hauls: ExpeditionHaul[] = [
      { gold: 1 }, { food: 1 }, { auxTroops: 1 }, { prestige: 1 },
      { homeLoyaltyDelta: 1 }, { statGain: { stat: 'war', amount: 1 } },
      { recruitOfficerId: 'wolong' }, { wounded: true },
    ];
    for (const h of hauls) {
      const s = haulSummary(h, officers);
      expect(s.zh.length, `zh empty for ${JSON.stringify(h)}`).toBeGreaterThan(0);
      expect(s.en.length, `en empty for ${JSON.stringify(h)}`).toBeGreaterThan(0);
    }
  });

  it('zero-valued fields do not produce noise lines', () => {
    // 0 gold is "nothing happened", not "you gained 0 gold".
    expect(haulSummary({ gold: 0, food: 0, prestige: 0 }, officers)).toEqual({ zh: '', en: '' });
  });
});
