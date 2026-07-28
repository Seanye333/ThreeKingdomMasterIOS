/**
 * 寫入合併的正確性 — a buffer that lies about what is stored loses saves.
 *
 * The speed win is measured in persistCost.contract.test.ts. This file only
 * asks whether the buffer is honest: does a read see a pending write, does a
 * delete survive, do writes land in order, does flush actually flush.
 */
import { describe, it, expect } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { coalesceWrites, flushPendingSaves } from './saveWriteCoalescer';

/** An inner storage that records every call it actually receives. */
function recorder() {
  const data = new Map<string, string>();
  const calls: string[] = [];
  const storage: StateStorage = {
    getItem: async (k) => { calls.push(`get:${k}`); return data.has(k) ? data.get(k)! : null; },
    setItem: async (k, v) => { calls.push(`set:${k}=${v}`); data.set(k, v); },
    removeItem: async (k) => { calls.push(`del:${k}`); data.delete(k); },
  };
  return { storage, data, calls };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('coalesceWrites 合併', () => {
  it('collapses a synchronous burst into a single write of the last value', async () => {
    const r = recorder();
    const s = coalesceWrites(r.storage);
    for (let i = 0; i < 27; i++) await s.setItem('tkm-save', `v${i}`);
    // Nothing has reached the backing store yet — the burst is still buffered.
    expect(r.calls.filter((c) => c.startsWith('set:'))).toHaveLength(0);
    await s.flush();
    expect(r.calls.filter((c) => c.startsWith('set:'))).toEqual(['set:tkm-save=v26']);
    expect(r.data.get('tkm-save')).toBe('v26');
  });

  it('flushes on its own within one microtask — no flush() call needed', async () => {
    const r = recorder();
    const s = coalesceWrites(r.storage);
    await s.setItem('k', 'v');
    await tick();
    expect(r.data.get('k')).toBe('v');
  });

  it('writes to different keys all land', async () => {
    const r = recorder();
    const s = coalesceWrites(r.storage);
    await s.setItem('a', '1');
    await s.setItem('b', '2');
    await s.setItem('a', '3');
    await s.flush();
    expect(r.data.get('a')).toBe('3');
    expect(r.data.get('b')).toBe('2');
  });
});

describe('coalesceWrites 誠實性', () => {
  it('getItem sees a pending write — save-then-load in one block reads the new world', async () => {
    const r = recorder();
    const s = coalesceWrites(r.storage);
    await s.setItem('tkm-save', 'NEW');
    // Not yet in the backing store...
    expect(r.data.has('tkm-save')).toBe(false);
    // ...but the buffer must still answer with it.
    expect(await s.getItem('tkm-save')).toBe('NEW');
  });

  it('getItem falls through to the store when nothing is pending', async () => {
    const r = recorder();
    r.data.set('tkm-save', 'OLD');
    const s = coalesceWrites(r.storage);
    expect(await s.getItem('tkm-save')).toBe('OLD');
  });

  it('a pending remove reads as absent, not as the stale stored value', async () => {
    const r = recorder();
    r.data.set('tkm-save', 'OLD');
    const s = coalesceWrites(r.storage);
    await s.removeItem('tkm-save');
    expect(await s.getItem('tkm-save')).toBeNull();
  });

  it('removeItem cancels a buffered write instead of being resurrected by it', async () => {
    // The bug this guards: set() buffers, remove() goes straight through, then
    // the buffered set lands on top and the deleted save is back.
    const r = recorder();
    const s = coalesceWrites(r.storage);
    await s.setItem('tkm-save', 'DOOMED');
    await s.removeItem('tkm-save');
    await s.flush();
    expect(r.data.has('tkm-save')).toBe(false);
    expect(await s.getItem('tkm-save')).toBeNull();
  });

  it('a write after a remove wins', async () => {
    const r = recorder();
    r.data.set('k', 'OLD');
    const s = coalesceWrites(r.storage);
    await s.removeItem('k');
    await s.setItem('k', 'NEW');
    await s.flush();
    expect(r.data.get('k')).toBe('NEW');
  });
});

describe('coalesceWrites 韌性', () => {
  it('a failing inner write does not poison later saves', async () => {
    const data = new Map<string, string>();
    let failNext = true;
    const inner: StateStorage = {
      getItem: async (k) => data.get(k) ?? null,
      setItem: async (k, v) => {
        if (failNext) { failNext = false; throw new Error('quota'); }
        data.set(k, v);
      },
      removeItem: async (k) => void data.delete(k),
    };
    const s = coalesceWrites(inner);
    await s.setItem('k', 'lost');
    await s.flush();
    await s.setItem('k', 'kept');
    await s.flush();
    expect(data.get('k')).toBe('kept');
  });

  it('flushPendingSaves drains a coalescer that nobody holds a handle to', async () => {
    const r = recorder();
    coalesceWrites(r.storage).setItem('k', 'v');
    await flushPendingSaves();
    expect(r.data.get('k')).toBe('v');
  });

  it('flush on an empty buffer is a no-op, not a spurious write', async () => {
    const r = recorder();
    const s = coalesceWrites(r.storage);
    await s.flush();
    await s.flush();
    expect(r.calls).toEqual([]);
  });
});
