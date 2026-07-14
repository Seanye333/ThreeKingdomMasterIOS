/** 武將圖鑑 — locks the album ledgers and set progress. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CODEX_SETS, codexMarkRecruited, codexMarkSeen, codexMarkSlain, codexSetProgress, loadCodex, CODEX_MILESTONES, codexMilestoneReached, codexMilestoneClaimed, codexClaimMilestone } from './codex';
import { OFFICER_IDS, TALENT_POOL_IDS } from '../data';
import { HISTORICAL_OFFICER_TEMPLATES } from '../data/historicalOfficers';

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

describe('codex ledgers', () => {
  it('recruit implies seen; commoners are not collectible', () => {
    codexMarkRecruited('guan-yu');
    codexMarkRecruited('commoner-li-ping');
    const c = loadCodex();
    expect(c.recruited).toContain('guan-yu');
    expect(c.seen).toContain('guan-yu');
    expect(c.recruited).not.toContain('commoner-li-ping');
  });

  it('seen and slain accumulate without duplicates', () => {
    codexMarkSeen(['cao-cao', 'cao-cao', 'lu-bu']);
    codexMarkSlain('lu-bu');
    const c = loadCodex();
    expect(c.seen.filter((x) => x === 'cao-cao')).toHaveLength(1);
    expect(c.slain).toEqual(['lu-bu']);
  });

  it('set progress counts only the ever-recruited', () => {
    codexMarkRecruited('liu-bei');
    codexMarkRecruited('guan-yu');
    expect(codexSetProgress(loadCodex(), 'oath-brothers')).toEqual({ have: 2, total: 3 });
    codexMarkRecruited('zhang-fei');
    expect(codexSetProgress(loadCodex(), 'oath-brothers')).toEqual({ have: 3, total: 3 });
  });
});

describe('codex sets', () => {
  // 歷代名將套 (凌煙閣/瓦崗/中興/楊家將) draw on the dynasty packs too.
  const ROSTER = new Set<string>([
    ...OFFICER_IDS, ...TALENT_POOL_IDS,
    ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id),
  ]);

  it('every set member is a real recruitable officer', () => {
    // Would have caught the `yue-jin`→`le-jin` bug: a member that no roster
    // entry matches makes its set permanently uncompletable.
    const orphans = CODEX_SETS.flatMap((s) =>
      s.members.filter((m) => !ROSTER.has(m)).map((m) => `${s.id}:${m}`),
    );
    expect(orphans).toEqual([]);
  });

  it('set ids and members are unique within each set', () => {
    const ids = CODEX_SETS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of CODEX_SETS) {
      expect(new Set(s.members).size).toBe(s.members.length);
    }
  });
});

describe('圖鑑功勳 — coverage milestones', () => {
  it('a milestone is reached once the seen-count crosses its bar, and claims once', () => {
    const first = CODEX_MILESTONES[0]; // need 25
    // Below the bar: not reached, cannot claim.
    codexMarkSeen(['a', 'b', 'c']);
    expect(codexMilestoneReached(loadCodex(), first)).toBe(false);
    expect(codexClaimMilestone(first.id)).toBe(false);
    // Cross the bar.
    codexMarkSeen(Array.from({ length: first.need }, (_, i) => `seen-${i}`));
    expect(codexMilestoneReached(loadCodex(), first)).toBe(true);
    expect(codexMilestoneClaimed(loadCodex(), first.id)).toBe(false);
    // First claim succeeds and sticks; a second is refused.
    expect(codexClaimMilestone(first.id)).toBe(true);
    expect(codexMilestoneClaimed(loadCodex(), first.id)).toBe(true);
    expect(codexClaimMilestone(first.id)).toBe(false);
  });

  it('milestone bars strictly ascend and ids are unique', () => {
    for (let i = 1; i < CODEX_MILESTONES.length; i++) {
      expect(CODEX_MILESTONES[i].need).toBeGreaterThan(CODEX_MILESTONES[i - 1].need);
    }
    const ids = CODEX_MILESTONES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
