import { describe, it, expect } from 'vitest';
import { stratagemSituation } from './tacticSituation';

const base = { weather: 'clear' as const, casterTerrain: 'plain' as const, targetTerrain: 'plain' as const };

describe('戰法情境 — stratagemSituation', () => {
  it('charge rewards open ground and is bogged down by rough terrain', () => {
    expect(stratagemSituation('charge', { ...base, casterTerrain: 'plain' }).mult).toBeGreaterThan(1);
    expect(stratagemSituation('charge', { ...base, casterTerrain: 'forest' }).mult).toBeLessThan(1);
    expect(stratagemSituation('charge', { ...base, targetTerrain: 'mountain' }).mult).toBeLessThan(1);
  });

  it('arrows: rain hurts, high ground helps, tailwind helps a little', () => {
    expect(stratagemSituation('rain-of-arrows', { ...base, weather: 'rain' }).mult).toBeLessThan(1);
    expect(stratagemSituation('rain-of-arrows', { ...base, casterTerrain: 'hill' }).mult).toBeGreaterThan(1);
    expect(stratagemSituation('rain-of-arrows', { ...base, weather: 'wind' }).mult).toBeGreaterThan(1);
  });

  it('lightning is fed by storms, damped by fog/snow', () => {
    expect(stratagemSituation('lightning', { ...base, weather: 'rain' }).mult).toBeGreaterThan(1);
    expect(stratagemSituation('lightning', { ...base, weather: 'fog' }).mult).toBeLessThan(1);
    expect(stratagemSituation('lightning', { ...base, weather: 'clear' }).mult).toBe(1);
  });

  it('fire fizzles over water and always returns a readable note in wind/rain', () => {
    expect(stratagemSituation('fire-attack', { ...base, targetTerrain: 'river' }).mult).toBeLessThan(1);
    expect(stratagemSituation('fire-attack', { ...base, weather: 'wind' }).note).not.toBeNull();
    expect(stratagemSituation('fire-attack', { ...base, weather: 'rain' }).note).not.toBeNull();
  });

  it('a stratagem with no situational rule is neutral and silent', () => {
    const s = stratagemSituation('rally', base);
    expect(s.mult).toBe(1);
    expect(s.note).toBeNull();
  });

  it('every situational verdict gives a sane multiplier (0.3–2)', () => {
    const ids = ['charge', 'rain-of-arrows', 'lightning', 'fire-attack', 'rally'] as const;
    const ctxs = [
      base,
      { ...base, weather: 'rain' as const }, { ...base, weather: 'wind' as const },
      { ...base, casterTerrain: 'hill' as const }, { ...base, casterTerrain: 'forest' as const },
      { ...base, targetTerrain: 'river' as const },
    ];
    for (const id of ids) for (const c of ctxs) {
      const m = stratagemSituation(id, c).mult;
      expect(m).toBeGreaterThanOrEqual(0.3);
      expect(m).toBeLessThanOrEqual(2);
    }
  });
});
