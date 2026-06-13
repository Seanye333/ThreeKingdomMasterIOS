import { describe, it, expect } from 'vitest';
import { planAISiteSeizures } from './aiBuild';
import { buildInitialSites } from '../data/sites';
import { buildInitialCities } from '../data/cities';

function cityMap() {
  return Object.fromEntries(buildInitialCities({}).map((c) => [c.id, { ...c }]));
}
const forces = {
  ai: { id: 'ai', name: { zh: '敵', en: 'Foe' }, color: '#fff' },
  me: { id: 'me', name: { zh: '我', en: 'Me' }, color: '#0f0' },
} as never;

describe('planAISiteSeizures', () => {
  it('an AI force with a strong garrison near a neutral site seizes it', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    // Shangdang guards the Taihang ironworks — give it a big AI garrison.
    cities['shangdang'] = { ...cities['shangdang'], ownerForceId: 'ai', troops: 20000 };
    const out = planAISiteSeizures({ cities, forces, sites, playerForceId: 'me', rng: () => 0.0 });
    expect(out.sites['res-taihang-iron'].ownerForceId).toBe('ai');
    expect(out.sites['res-taihang-iron'].hostile).toBe(false);
    // The committing garrison bled for it.
    expect(out.cities['shangdang'].troops).toBeLessThan(20000);
  });

  it('the player force never auto-seizes', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    cities['shangdang'] = { ...cities['shangdang'], ownerForceId: 'me', troops: 20000 };
    const out = planAISiteSeizures({ cities, forces, sites, playerForceId: 'me', rng: () => 0.0 });
    expect(out.sites['res-taihang-iron'].ownerForceId).toBeNull();
  });

  it('no nearby AI garrison → sites stay neutral', () => {
    const sites = buildInitialSites();
    const cities = cityMap(); // all neutral owners
    const out = planAISiteSeizures({ cities, forces, sites, playerForceId: 'me', rng: () => 0.0 });
    expect(Object.values(out.sites).every((s) => s.ownerForceId === null)).toBe(true);
  });

  it('the chance gate can skip a force entirely', () => {
    const sites = buildInitialSites();
    const cities = cityMap();
    cities['shangdang'] = { ...cities['shangdang'], ownerForceId: 'ai', troops: 20000 };
    // rng > 0.25 → force is skipped this season.
    const out = planAISiteSeizures({ cities, forces, sites, playerForceId: 'me', rng: () => 0.99 });
    expect(out.sites['res-taihang-iron'].ownerForceId).toBeNull();
  });
});
