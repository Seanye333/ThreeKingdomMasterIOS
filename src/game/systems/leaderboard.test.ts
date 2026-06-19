/** 排行榜 client — locks graceful degradation when the API is absent. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLeaderboard, savePlayerName, savedPlayerName, submitScore } from './leaderboard';

beforeEach(() => {
  vi.unstubAllGlobals();
  const map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
  });
});

describe('leaderboard client', () => {
  it('returns null when the API is unreachable (no backend, offline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await fetchLeaderboard('2026-06-13')).toBeNull();
  });

  it('parses a configured response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ kvConfigured: true, rows: [{ name: '曹操', seasons: 40 }] }),
    }));
    const r = await fetchLeaderboard('2026-06-13');
    expect(r?.kvConfigured).toBe(true);
    expect(r?.rows[0].name).toBe('曹操');
  });

  it('remembers the player name across submits, trimmed to 16', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ kvConfigured: true, rows: [] }) }));
    await submitScore('2026-06-13', '一個非常非常非常長的名號超過十六字', 40);
    expect(savedPlayerName().length).toBeLessThanOrEqual(16);
    savePlayerName('  孫權  ');
    expect(savedPlayerName()).toBe('孫權');
  });
});
