/** 名品圖鑑 — locks the treasure ledger and set progress. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEM_CODEX_SETS, itemCodexMarkCarried, itemCodexMarkCarriedMany, itemCodexSetProgress, loadItemCodex } from './itemCodex';
import { ITEMS_BY_ID } from '../data';

function stubStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  });
  return map;
}

beforeEach(() => { vi.unstubAllGlobals(); stubStorage(); });

describe('item codex ledger', () => {
  it('carried accumulates without duplicates', () => {
    itemCodexMarkCarried('red-hare');
    itemCodexMarkCarried('red-hare');
    itemCodexMarkCarriedMany(['dilu', 'green-dragon']);
    const c = loadItemCodex();
    expect(c.carried.filter((x) => x === 'red-hare')).toHaveLength(1);
    expect(c.carried).toContain('dilu');
    expect(c.carried).toContain('green-dragon');
  });

  it('set progress counts only the ever-carried', () => {
    itemCodexMarkCarried('red-hare');
    expect(itemCodexSetProgress(loadItemCodex(), 'famous-steeds')).toEqual({ have: 1, total: 5 });
    itemCodexMarkCarriedMany(['dilu', 'jue-ying', 'zhuahuang-feidian', 'dawan']);
    expect(itemCodexSetProgress(loadItemCodex(), 'famous-steeds')).toEqual({ have: 5, total: 5 });
  });
});

describe('item codex sets', () => {
  it('every set member is a real item', () => {
    const orphans = ITEM_CODEX_SETS.flatMap((s) =>
      s.members.filter((m) => !ITEMS_BY_ID[m]).map((m) => `${s.id}:${m}`),
    );
    expect(orphans).toEqual([]);
  });

  it('set ids and members are unique', () => {
    const ids = ITEM_CODEX_SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of ITEM_CODEX_SETS) {
      expect(new Set(s.members).size).toBe(s.members.length);
    }
  });
});
