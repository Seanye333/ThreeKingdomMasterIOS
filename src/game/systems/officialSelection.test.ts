import { describe, it, expect } from 'vitest';
import {
  selectionEffects, effectiveSelection, rectifierOf, rectifierIsUpright,
  selectionAvailable, selectionLoyaltyDrift, SELECTION_NAMES,
} from './officialSelection';
import type { Officer } from '../types';

function off(over: Partial<Officer> & { id: string }): Officer {
  return {
    id: over.id,
    name: { zh: '某', en: 'X' },
    forceId: 'wei',
    status: 'idle',
    loyalty: 70,
    birthYear: 180,
    stats: { war: 50, leadership: 50, intelligence: 50, politics: 50, charisma: 50 },
    skills: [],
    ...over,
  } as Officer;
}

describe('選官三制', () => {
  it('察舉 is the neutral baseline (and the default for old saves)', () => {
    const e = selectionEffects('chaju');
    expect(e).toEqual(selectionEffects(undefined));
    expect(e.recommendMul).toBe(1);
    expect(e.commonerMul).toBe(1);
    expect(e.aristocratLoyalty).toBe(0);
  });

  it('九品中正 is a pipeline that shuts the humble out', () => {
    const e = selectionEffects('jiupin');
    expect(e.recommendMul).toBeGreaterThan(1.5);
    expect(e.discernBonus).toBeGreaterThan(0);
    expect(e.commonerMul).toBeLessThan(0.5);
    expect(e.aristocratLoyalty).toBeGreaterThan(0);
    expect(e.commonerLoyalty).toBeLessThan(0);
    expect(SELECTION_NAMES.jiupin.motto).toBe('上品無寒門');
  });

  it('開科取士 reverses both signs', () => {
    const e = selectionEffects('keju');
    expect(e.commonerMul).toBeGreaterThan(2);
    expect(e.commonerQuality).toBeGreaterThan(0);
    expect(e.recommendMul).toBeLessThan(1);
    expect(e.aristocratLoyalty).toBeLessThan(0);
    expect(e.commonerLoyalty).toBeGreaterThan(0);
  });
});

describe('中正之公', () => {
  const dull = off({ id: 'a', stats: { war: 50, leadership: 50, intelligence: 50, politics: 70, charisma: 50 } });
  const upright = off({
    id: 'b', traits: ['incorruptible'],
    stats: { war: 50, leadership: 50, intelligence: 50, politics: 88, charisma: 50 },
  });

  it('the highest 政治 officer holds the office', () => {
    expect(rectifierOf([dull, upright])?.id).toBe('b');
  });

  it('a court with nobody fit has no Rectifier', () => {
    const junior = off({ id: 'c', stats: { war: 50, leadership: 50, intelligence: 50, politics: 40, charisma: 50 } });
    expect(rectifierOf([junior])).toBeNull();
    expect(rectifierIsUpright(null)).toBe(false);
  });

  it('an upright Rectifier keeps a door open for humble birth', () => {
    const biased = effectiveSelection('jiupin', dull);
    const fair = effectiveSelection('jiupin', upright);
    expect(fair.commonerMul).toBeGreaterThan(biased.commonerMul);
    expect(fair.commonerLoyalty).toBe(0);
    expect(fair.recommendMul).toBe(biased.recommendMul);   // the pipeline is unchanged
  });

  it('only 九品 cares who the Rectifier is', () => {
    expect(effectiveSelection('keju', upright)).toEqual(selectionEffects('keju'));
    expect(effectiveSelection('chaju', upright)).toEqual(selectionEffects('chaju'));
  });
});

describe('可行與否', () => {
  const ctx = { cityCount: 8, hasRectifier: true, hasGrandAcademy: true };

  it('察舉 is always available', () => {
    expect(selectionAvailable('chaju', { cityCount: 1, hasRectifier: false, hasGrandAcademy: false }).ok).toBe(true);
  });

  it('九品 needs a realm and a man to grade it', () => {
    expect(selectionAvailable('jiupin', { ...ctx, cityCount: 3 }).ok).toBe(false);
    expect(selectionAvailable('jiupin', { ...ctx, hasRectifier: false }).ok).toBe(false);
    expect(selectionAvailable('jiupin', ctx).ok).toBe(true);
  });

  it('開科 needs somewhere to examine them', () => {
    expect(selectionAvailable('keju', { ...ctx, hasGrandAcademy: false }).ok).toBe(false);
    expect(selectionAvailable('keju', ctx).ok).toBe(true);
  });
});

describe('上品無寒門 — loyalty drift by birth', () => {
  const aristocrat = off({ id: 'xun-yu', clanId: 'yingchuan-xun' });
  const humble = off({ id: 'commoner-1234' });
  const plain = off({ id: 'nobody-named' });

  it('九品 flatters the great houses and grates on the humble', () => {
    const e = selectionEffects('jiupin');
    expect(selectionLoyaltyDrift(e, aristocrat)).toBeGreaterThan(0);
    expect(selectionLoyaltyDrift(e, humble)).toBeLessThan(0);
  });

  it('開科 reverses it', () => {
    const e = selectionEffects('keju');
    expect(selectionLoyaltyDrift(e, aristocrat)).toBeLessThan(0);
    expect(selectionLoyaltyDrift(e, humble)).toBeGreaterThan(0);
  });

  it('an unaffiliated officer of no great house drifts nowhere', () => {
    expect(selectionLoyaltyDrift(selectionEffects('jiupin'), plain)).toBe(0);
    expect(selectionLoyaltyDrift(selectionEffects('chaju'), aristocrat)).toBe(0);
  });
});
