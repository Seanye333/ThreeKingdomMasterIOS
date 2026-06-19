import { describe, it, expect } from 'vitest';
import {
  bestPrestige, prestigeEffects, prestigeEffectsFromId, effectivePrestigeEffects,
  effectivePrestige, prestigeTitleById, refreshPrestige,
} from './prestige';
import { mkOfficer } from '../../test/factories';
import type { HeroicDeeds } from '../types/deeds';

const stats = (over: Partial<{ war: number; leadership: number; intelligence: number; politics: number; charisma: number }>) =>
  ({ war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50, ...over });
const deeds = (over: Partial<HeroicDeeds>): HeroicDeeds => ({
  killsTroops: 0, duelsWon: 0, captured: 0, citiesTaken: 0, espionageSuccess: 0,
  civicWorks: 0, battlesWon: 0, battlesLost: 0, trainingsCompleted: 0, ...over,
});

describe('prestige (威名)', () => {
  it('awards 虎將 to a peerless warrior, with a duel bonus', () => {
    const o = mkOfficer({ stats: stats({ war: 95 }) });
    expect(bestPrestige(o)!.id).toBe('tiger-general');
    expect(prestigeEffects(o).duelBonus).toBeGreaterThan(0);
  });

  it('awards 能臣 to a master administrator, with an income multiplier', () => {
    const o = mkOfficer({ stats: stats({ politics: 90 }) });
    expect(bestPrestige(o)!.id).toBe('able-minister');
    expect(prestigeEffects(o).incomeMul).toBeGreaterThan(1);
  });

  it('gates 名將 behind a battle record (deeds)', () => {
    const o = mkOfficer({ stats: stats({ war: 85 }) }); // ≥84 but <90
    expect(bestPrestige(o)!.id).toBe('fierce-general'); // no deeds → 猛將
    expect(bestPrestige(o, { battlesWon: 10 } as never)!.id).toBe('famed-general'); // deeds → 名將
  });

  it('gives a mediocre officer no prestige and neutral effects', () => {
    const o = mkOfficer({ stats: stats({}) });
    expect(bestPrestige(o)).toBeNull();
    expect(prestigeEffects(o)).toEqual({ duelBonus: 0, combatPowerMul: 1, incomeMul: 1 });
  });

  it('lets a strong-but-not-elite officer EARN 虎將 through deeds', () => {
    const o = mkOfficer({ stats: stats({ war: 86 }) }); // <90 innate
    expect(bestPrestige(o)!.id).toBe('fierce-general'); // war≥82 only → 猛將
    expect(bestPrestige(o, deeds({ duelsWon: 10 }))!.id).toBe('tiger-general'); // earned
    expect(bestPrestige(o, deeds({ killsTroops: 80000 }))!.id).toBe('tiger-general');
  });

  it('earns 良吏/能臣 through civic works', () => {
    const o = mkOfficer({ stats: stats({ politics: 76 }) }); // <80 innate
    expect(bestPrestige(o)).toBeNull();
    expect(bestPrestige(o, deeds({ civicWorks: 12 }))!.id).toBe('steward');
    const o2 = mkOfficer({ stats: stats({ politics: 84 }) }); // <88 innate → 良吏 only
    expect(bestPrestige(o2)!.id).toBe('steward');
    expect(bestPrestige(o2, deeds({ civicWorks: 22 }))!.id).toBe('able-minister');
  });
});

describe('cached prestige title (deeds-aware)', () => {
  it('prestigeEffectsFromId / effective effects read the cached id', () => {
    expect(prestigeEffectsFromId('tiger-general').duelBonus).toBe(12);
    expect(prestigeEffectsFromId(undefined)).toEqual({ duelBonus: 0, combatPowerMul: 1, incomeMul: 1 });
    // No cached id → falls back to innate computation.
    const innate = mkOfficer({ stats: stats({ war: 95 }) });
    expect(effectivePrestigeEffects(innate).duelBonus).toBe(12);
    // Cached id wins over innate (an earned title the stats alone wouldn't give).
    const earned = mkOfficer({ stats: stats({ war: 86 }), prestigeTitleId: 'tiger-general' });
    expect(effectivePrestige(earned)!.id).toBe('tiger-general');
    expect(prestigeTitleById('nope')).toBeNull();
  });

  it('refreshPrestige caches titles and announces only rises', () => {
    const officers = {
      a: mkOfficer({ id: 'a', stats: stats({ war: 95 }) }),                 // → tiger (new)
      b: mkOfficer({ id: 'b', stats: stats({ war: 86 }), prestigeTitleId: 'tiger-general' }), // demote to 猛將, silent
      c: mkOfficer({ id: 'c', stats: stats({}) }),                          // none, no award
      d: mkOfficer({ id: 'd', status: 'dead', stats: stats({ war: 99 }) }), // dead, skipped
    };
    const r = refreshPrestige(officers, {});
    expect(r.officers.a.prestigeTitleId).toBe('tiger-general');
    expect(r.officers.b.prestigeTitleId).toBe('fierce-general'); // updated silently
    expect(r.officers.c.prestigeTitleId).toBeUndefined();
    expect(r.officers.d.prestigeTitleId).toBeUndefined(); // dead untouched
    const ids = r.awards.map((x) => x.officerId).sort();
    expect(ids).toEqual(['a']); // only a rose; b demoted (silent), c none, d dead
  });
});
