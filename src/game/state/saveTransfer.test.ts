/** 存檔互傳 — locks the bundle round-trip and the import validations. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportAllSaves, importAllSaves } from './saveTransfer';

function stubStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  const stub = {
    get length() { return map.size; },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
  };
  vi.stubGlobal('localStorage', stub);
  return map;
}

beforeEach(() => vi.unstubAllGlobals());

describe('exportAllSaves', () => {
  it('bundles every tkm-* key and nothing else', () => {
    stubStorage({
      'tkm-save-v26': '{"a":1}',
      'tkm-slot-slot-1': '{"b":2}',
      'other-app': 'secret',
    });
    const b = exportAllSaves(new Date('2026-06-12T00:00:00Z'));
    expect(Object.keys(b.entries).sort()).toEqual(['tkm-save-v26', 'tkm-slot-slot-1']);
    expect(b.kind).toBe('tkm-save-bundle');
  });
});

describe('importAllSaves', () => {
  it('round-trips an exported bundle', () => {
    stubStorage({ 'tkm-save-v26': '{"a":1}', 'tkm-slot-index': '[]' });
    const json = JSON.stringify(exportAllSaves());
    const map = stubStorage(); // fresh "device"
    const res = importAllSaves(json);
    expect(res).toEqual({ ok: true, count: 2 });
    expect(map.get('tkm-save-v26')).toBe('{"a":1}');
  });

  it('rejects garbage and foreign keys', () => {
    const map = stubStorage();
    expect(importAllSaves('not json').ok).toBe(false);
    expect(importAllSaves('{"kind":"nope"}').ok).toBe(false);
    const crafted = JSON.stringify({
      kind: 'tkm-save-bundle', version: 1, exportedAt: '',
      entries: { 'evil-key': 'x' },
    });
    expect(importAllSaves(crafted)).toEqual({ ok: false, reason: 'empty' });
    expect(map.has('evil-key')).toBe(false);
  });
});
