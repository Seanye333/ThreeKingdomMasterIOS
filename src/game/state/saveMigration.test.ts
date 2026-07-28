import { describe, it, expect } from 'vitest';
import { EMPTY_STATE } from './gameState';
import {
  LIVE_SAVE_KEY,
  SAVE_VERSION,
  LEGACY_SAVE_KEYS,
  migrateSave,
  legacyKeyFallback,
} from './saveMigration';

/** An in-memory StateStorage double. */
function memStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('存檔 key 凍結', () => {
  it('the live key is the frozen name — renaming it orphans every campaign', () => {
    // This assertion exists to make a rename fail CI loudly. If you are here
    // because you wanted a new schema, bump SAVE_VERSION instead.
    expect(LIVE_SAVE_KEY).toBe('tkm-save');
  });

  it('every historical key is covered by the fallback scan', () => {
    // v1..v26 were real shipped key names. Missing one = those players'
    // in-progress campaign stays unreachable.
    for (let v = 1; v <= 26; v++) {
      expect(LEGACY_SAVE_KEYS).toContain(`tkm-save-v${v}`);
    }
  });

  it('scans newest-first so the most recent legacy save wins', () => {
    expect(LEGACY_SAVE_KEYS[0]).toBe('tkm-save-v26');
    expect(LEGACY_SAVE_KEYS[LEGACY_SAVE_KEYS.length - 1]).toBe('tkm-save-v1');
  });
});

describe('legacyKeyFallback', () => {
  it('finds a v26 campaign when the live key is empty', async () => {
    const inner = memStorage({ 'tkm-save-v26': '{"state":{"gold":7},"version":0}' });
    const wrapped = legacyKeyFallback(inner);
    expect(await wrapped.getItem(LIVE_SAVE_KEY)).toBe('{"state":{"gold":7},"version":0}');
  });

  it('prefers the live key over any legacy blob', async () => {
    const inner = memStorage({
      [LIVE_SAVE_KEY]: 'LIVE',
      'tkm-save-v26': 'OLD',
    });
    expect(await legacyKeyFallback(inner).getItem(LIVE_SAVE_KEY)).toBe('LIVE');
  });

  it('picks the newest legacy key when several eras are still on disk', async () => {
    const inner = memStorage({
      'tkm-save-v20': 'ANCIENT',
      'tkm-save-v26': 'RECENT',
      'tkm-save-v24': 'MIDDLE',
    });
    expect(await legacyKeyFallback(inner).getItem(LIVE_SAVE_KEY)).toBe('RECENT');
  });

  it('leaves the legacy blob in place as a backup', async () => {
    const inner = memStorage({ 'tkm-save-v26': 'OLD' });
    await legacyKeyFallback(inner).getItem(LIVE_SAVE_KEY);
    expect(inner.map.get('tkm-save-v26')).toBe('OLD');
  });

  it('does not scan legacy keys for unrelated names (save slots etc.)', async () => {
    const inner = memStorage({ 'tkm-save-v26': 'OLD' });
    expect(await legacyKeyFallback(inner).getItem('tkm-slot-3')).toBeNull();
  });

  it('survives an unreadable legacy key mid-scan', async () => {
    const inner = memStorage({ 'tkm-save-v20': 'SURVIVOR' });
    const flaky = {
      ...inner,
      getItem: (k: string) => {
        if (k === 'tkm-save-v24') throw new Error('corrupt');
        return inner.getItem(k);
      },
    };
    expect(await legacyKeyFallback(flaky).getItem(LIVE_SAVE_KEY)).toBe('SURVIVOR');
  });

  it('returns null when nothing is stored anywhere', async () => {
    expect(await legacyKeyFallback(memStorage()).getItem(LIVE_SAVE_KEY)).toBeNull();
  });
});

describe('migrateSave', () => {
  it('keeps every field the old save actually had', () => {
    const old = { gold: 999, scenarioId: 'yellow-turban', date: { year: 200 } };
    const out = migrateSave(old, 0);
    expect(out.gold).toBe(999);
    expect(out.scenarioId).toBe('yellow-turban');
    expect(out.date).toEqual({ year: 200 });
  });

  it('backfills fields the save predates from EMPTY_STATE', () => {
    // A save written before `rivalries` existed must not load it as undefined
    // — the UI iterates it. This is the class of crash the generic backfill
    // exists to prevent.
    const out = migrateSave({ scenarioId: 'x' }, 0);
    expect(out.rivalries).toEqual(EMPTY_STATE.rivalries);
    expect(out.duelHall).toEqual(EMPTY_STATE.duelHall);
    expect(out.lineage).toEqual(EMPTY_STATE.lineage);
  });

  it('never leaves a persisted collection undefined', () => {
    // Anything EMPTY_STATE declares as an array/object must survive migration
    // as an array/object, whatever the old save omitted.
    const out = migrateSave({}, 0);
    for (const [key, initial] of Object.entries(EMPTY_STATE)) {
      if (Array.isArray(initial)) {
        expect(Array.isArray(out[key]), `${key} should stay an array`).toBe(true);
      } else if (initial !== null && typeof initial === 'object') {
        expect(out[key], `${key} should stay an object`).toBeTypeOf('object');
      }
    }
  });

  it('does not let a backfill clobber a real persisted value', () => {
    const out = migrateSave({ rivalries: { 'a|b': 5 } }, 0);
    expect(out.rivalries).toEqual({ 'a|b': 5 });
  });

  it('tolerates a null/garbage blob instead of throwing', () => {
    expect(() => migrateSave(null, 0)).not.toThrow();
    expect(() => migrateSave(undefined, 0)).not.toThrow();
    // A blob that survived JSON.parse but is not an object shape.
    expect(migrateSave(null, 0).scenarioId).toBe(EMPTY_STATE.scenarioId);
  });

  it('is idempotent — migrating an already-current save changes nothing', () => {
    const current = migrateSave({ scenarioId: 'x', gold: 5 }, SAVE_VERSION);
    expect(migrateSave(current, SAVE_VERSION)).toEqual(current);
  });
});

describe('存檔往返 (C3)', () => {
  it('a v26-era blob survives the full storage → migrate → state path', async () => {
    // The exact journey a real player's campaign takes on the update that
    // ships this: written under the old key, found by the fallback, parsed,
    // migrated, and still carrying its campaign.
    const campaign = {
      state: { scenarioId: 'guandu', playerForceId: 'cao-cao', date: { year: 200, season: 'autumn' } },
      version: 0,
    };
    const inner = memStorage({ 'tkm-save-v26': JSON.stringify(campaign) });

    const raw = await legacyKeyFallback(inner).getItem(LIVE_SAVE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!) as { state: unknown; version: number };
    const migrated = migrateSave(parsed.state, parsed.version);

    expect(migrated.scenarioId).toBe('guandu');
    expect(migrated.playerForceId).toBe('cao-cao');
    expect(migrated.date).toEqual({ year: 200, season: 'autumn' });
    // …and the fields that campaign predates are present, not undefined.
    expect(migrated.rivalries).toBeDefined();
    expect(migrated.deeds).toBeDefined();
  });
});
