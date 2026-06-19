/** idbStorage — locks the localStorage fallback when IDB is absent. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { idbStorage } from './idbStorage';

describe('idbStorage without IndexedDB', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    const map = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => { map.set(k, v); },
      removeItem: (k: string) => { map.delete(k); },
    });
    vi.stubGlobal('indexedDB', undefined);
  });

  it('reads and writes straight through to localStorage', async () => {
    await idbStorage.setItem('tkm-save', '{"x":1}');
    expect(await idbStorage.getItem('tkm-save')).toBe('{"x":1}');
    await idbStorage.removeItem('tkm-save');
    expect(await idbStorage.getItem('tkm-save')).toBeNull();
  });

  it('returns null for an absent key', async () => {
    expect(await idbStorage.getItem('nope')).toBeNull();
  });
});
