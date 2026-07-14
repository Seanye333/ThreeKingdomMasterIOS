/** 名品圖鑑 — locks the treasure ledger and set progress. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEM_CODEX_SETS, itemCodexMarkCarried, itemCodexMarkCarriedMany, itemCodexSetProgress, loadItemCodex, ITEM_CODEX_MILESTONES, itemCodexMilestoneReached, itemCodexMilestoneClaimed, itemCodexClaimMilestone } from './itemCodex';
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

describe('藏珍功勳 — item collection milestones', () => {
  it('a milestone unlocks at its carried-count bar and claims once', () => {
    const first = ITEM_CODEX_MILESTONES[0]; // need 20
    itemCodexMarkCarriedMany(Array.from({ length: 5 }, (_, i) => `it-${i}`));
    expect(itemCodexMilestoneReached(loadItemCodex(), first)).toBe(false);
    expect(itemCodexClaimMilestone(first.id)).toBe(false);
    itemCodexMarkCarriedMany(Array.from({ length: first.need }, (_, i) => `carry-${i}`));
    expect(itemCodexMilestoneReached(loadItemCodex(), first)).toBe(true);
    expect(itemCodexClaimMilestone(first.id)).toBe(true);
    expect(itemCodexMilestoneClaimed(loadItemCodex(), first.id)).toBe(true);
    expect(itemCodexClaimMilestone(first.id)).toBe(false); // once only
  });

  it('milestone bars ascend and ids are unique', () => {
    for (let i = 1; i < ITEM_CODEX_MILESTONES.length; i++) {
      expect(ITEM_CODEX_MILESTONES[i].need).toBeGreaterThan(ITEM_CODEX_MILESTONES[i - 1].need);
    }
    const ids = ITEM_CODEX_MILESTONES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
