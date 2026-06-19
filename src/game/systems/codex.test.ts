/** 武將圖鑑 — locks the album ledgers and set progress. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { codexMarkRecruited, codexMarkSeen, codexMarkSlain, codexSetProgress, loadCodex } from './codex';

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
