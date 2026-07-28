/**
 * 存檔版本與遷移 — how a campaign survives an update.
 *
 * The live campaign used to be versioned by RENAMING its storage key
 * (`tkm-save-v25` → `tkm-save-v26` → …). That is not a migration, it is a
 * deletion with extra steps: zustand looks up exactly one key, so the moment
 * the key changed, every in-progress campaign became unreachable. Named save
 * slots live elsewhere and survived, but the autosaved campaign — the one the
 * player was actually in the middle of — silently vanished on update.
 *
 * This module replaces that with the real thing:
 *
 *   1. The key is FROZEN at `tkm-save`. It must never change again. Schema
 *      changes are expressed by bumping {@link SAVE_VERSION}, not the key.
 *   2. {@link legacyKeyFallback} wraps the storage so a first run after the
 *      switch still finds an old `tkm-save-vN` blob and adopts it.
 *   3. {@link migrateSave} backfills fields the old save predates.
 *
 * ## Why the backfill is generic
 *
 * `onRehydrateStorage` in store.ts carries a long hand-written run of
 * `if (!state.foo) state.foo = []`. Every new persisted field needs another
 * line, and a forgotten line is a crash on load for anyone with an old save —
 * a bug you cannot hit in dev, because your own save always has the field.
 *
 * So the default backfill is derived from EMPTY_STATE instead of hand-listed:
 * anything the persisted blob lacks comes from the canonical initial state.
 * Hand-written rehydrate steps stay for the cases that are more than a
 * default (rebuilding ports from templates, backfilling family lineage) —
 * those are genuine logic, not defaults.
 */
import { EMPTY_STATE } from './gameState';

/**
 * The one and only storage key for the live campaign. FROZEN — bump
 * {@link SAVE_VERSION} instead. Changing this string orphans every save.
 */
export const LIVE_SAVE_KEY = 'tkm-save';

/**
 * Schema version. Bump when a persisted field changes shape in a way the
 * generic EMPTY_STATE backfill cannot repair, and add a step to
 * {@link migrateSave}. Adding a NEW field needs no bump — the backfill
 * already covers it.
 *
 * 27 = the first version-tracked schema (v1–v26 were key renames).
 */
export const SAVE_VERSION = 27;

/**
 * The historical key names, newest first. A save found under any of these
 * predates version tracking and is treated as version 0.
 */
export const LEGACY_SAVE_KEYS: readonly string[] = Array.from(
  { length: 26 },
  (_, i) => `tkm-save-v${26 - i}`,
);

/** Minimal shape of what zustand's persist hands to `migrate`. */
type PersistedState = Record<string, unknown>;

/**
 * Bring a persisted blob up to {@link SAVE_VERSION}.
 *
 * The generic step — fill in whatever the blob is missing from EMPTY_STATE —
 * runs for every version, so a save written before a field existed loads with
 * that field at its initial value rather than `undefined`. Version-specific
 * repairs (a field that changed *shape*, not just appeared) go in the switch
 * below, oldest first, and fall through so a v0 save runs every step.
 */
export function migrateSave(persisted: unknown, fromVersion: number): PersistedState {
  const state: PersistedState = { ...(persisted as PersistedState | null ?? {}) };

  // ---- version-specific repairs (oldest first, deliberately falling through)
  if (fromVersion < 27) {
    // Pre-27 saves are the key-renamed era. No field changed *shape* across
    // those renames — each rename just added fields — so the generic backfill
    // below is the whole migration. Future shape changes get a block here.
  }

  // ---- generic: any persisted field the blob predates gets its initial value
  return { ...(EMPTY_STATE as unknown as PersistedState), ...state };
}

/**
 * Wrap a StateStorage so a miss on {@link LIVE_SAVE_KEY} falls back to the
 * historical `tkm-save-vN` keys (newest first) and adopts the first hit.
 *
 * The adopted blob is copied forward to the live key on the next write (zustand
 * always writes to the configured key), and the legacy copy is deliberately
 * LEFT IN PLACE as a backup — same belt-and-braces stance idbStorage already
 * takes with its localStorage fallback.
 *
 * The scan only ever runs when the live key is empty, so it costs one pass on
 * the first load after updating and nothing thereafter.
 */
export function legacyKeyFallback(inner: {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}): typeof inner {
  return {
    async getItem(name) {
      const live = await inner.getItem(name);
      if (live != null) return live;
      if (name !== LIVE_SAVE_KEY) return null;
      for (const legacy of LEGACY_SAVE_KEYS) {
        try {
          const found = await inner.getItem(legacy);
          if (found != null) return found;
        } catch {
          // A single unreadable legacy key must not abort the scan.
        }
      }
      return null;
    },
    setItem: (name, value) => inner.setItem(name, value),
    removeItem: (name) => inner.removeItem(name),
  };
}
