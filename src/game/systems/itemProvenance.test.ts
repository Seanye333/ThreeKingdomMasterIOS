import { describe, it, expect } from 'vitest';
import { accrueItemProvenance, PROVENANCE_MAX_OWNERS, heirloomTier } from './itemProvenance';

describe('名器譜系 — item provenance', () => {
  it('appends a new wielder, counts battles, and tallies kills', () => {
    let prov = accrueItemProvenance({}, [{ itemId: 'green-dragon', ownerId: 'guan-yu', kills: 100 }]);
    expect(prov['green-dragon']).toEqual({ owners: ['guan-yu'], battles: 1, kills: 100 });
    // Same hand carries it on — no new chapter, but battles/kills still climb.
    prov = accrueItemProvenance(prov, [{ itemId: 'green-dragon', ownerId: 'guan-yu', kills: 50 }]);
    expect(prov['green-dragon']).toEqual({ owners: ['guan-yu'], battles: 2, kills: 150 });
    // A new champion adds a chapter.
    prov = accrueItemProvenance(prov, [{ itemId: 'green-dragon', ownerId: 'guan-ping', kills: 0 }]);
    expect(prov['green-dragon'].owners).toEqual(['guan-yu', 'guan-ping']);
    expect(prov['green-dragon'].battles).toBe(3);
  });

  it('keeps only the last N wielders on the scroll', () => {
    let prov: ReturnType<typeof accrueItemProvenance> = {};
    for (let i = 0; i < PROVENANCE_MAX_OWNERS + 5; i++) {
      prov = accrueItemProvenance(prov, [{ itemId: 'blade', ownerId: `owner-${i}`, kills: 0 }]);
    }
    expect(prov['blade'].owners).toHaveLength(PROVENANCE_MAX_OWNERS);
    expect(prov['blade'].owners[0]).toBe('owner-5'); // earliest bearers rolled off
    expect(prov['blade'].battles).toBe(PROVENANCE_MAX_OWNERS + 5);
  });

  it('no entries → the map is returned unchanged', () => {
    const prov = { x: { owners: ['a'], battles: 1, kills: 0 } };
    expect(accrueItemProvenance(prov, [])).toBe(prov);
  });
});

describe('傳世名器 — heirloom tiers', () => {
  const owners = (n: number) => Array.from({ length: n }, (_, i) => `o${i}`);
  it('climbs by wielder-count OR kill-count', () => {
    expect(heirloomTier(undefined).tier).toBe(0);
    expect(heirloomTier({ owners: owners(1), battles: 1, kills: 0 }).tier).toBe(0);
    expect(heirloomTier({ owners: owners(3), battles: 3, kills: 0 }).tier).toBe(1); // 名器譜系
    expect(heirloomTier({ owners: owners(5), battles: 5, kills: 0 }).tier).toBe(2); // 傳世名器
    expect(heirloomTier({ owners: owners(8), battles: 8, kills: 0 }).tier).toBe(3); // 神兵譜系
    // Kills alone can promote a single-hand blade.
    expect(heirloomTier({ owners: owners(1), battles: 40, kills: 200 }).tier).toBe(2);
    expect(heirloomTier({ owners: owners(1), battles: 99, kills: 500 }).tier).toBe(3);
  });
});
