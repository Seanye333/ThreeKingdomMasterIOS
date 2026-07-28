/**
 * 存檔寫入合併 — collapse a season's intermediate saves into one.
 *
 * ## The measurement that motivated this
 *
 * `endSeason` is synchronous and commits ~27 times (each `set()` is a separate
 * zustand commit, and persist writes after every one). Measured over 240 ticks
 * of the opening scenario: 468 storage writes — 1.9 per tick — each carrying
 * the whole ~690-KB save.
 *
 * Every one of those writes except the last is a world that existed for
 * microseconds. Nobody can load them; the next commit overwrites them. On a
 * desktop that is merely wasteful, but the real target is iOS, where each
 * write is a `JSON.stringify` of the whole save plus an IndexedDB transaction.
 *
 * ## Why this replaces `createJSONStorage` rather than wrapping it
 *
 * The first version of this module wrapped a `StateStorage` — the string-level
 * interface — and sat UNDER `createJSONStorage`. That halved the IndexedDB
 * writes and nothing else: persist serialized on every single commit and only
 * the final string reached the buffer. Measured, it was plain — 60 ticks gave
 * 60 storage writes but **121 `JSON.stringify` calls**. The expensive half was
 * never coalesced at all.
 *
 * So this is a `PersistStorage` instead: it buffers the state OBJECT and
 * serializes once, at drain time. It absorbs `createJSONStorage`'s job (the
 * stringify/parse pair) precisely so that job can be deferred.
 *
 * ## Why the fix belongs here and not at the 27 call sites
 *
 * The call sites are not the problem — each `set()` is a legitimate state
 * change, and threading a "don't persist yet" flag through all of them would
 * put a persistence concern inside game logic and go stale the moment someone
 * adds a 28th. Storage is the single seam every write already passes through,
 * so one wrapper covers present and future writers alike. Same stance as
 * {@link legacyKeyFallback} in saveMigration.ts.
 *
 * ## Correctness rules this has to honour
 *
 * A write buffer that lies about what is stored is worse than a slow one:
 *
 *   - `getItem` MUST see pending writes. Otherwise a save-then-load inside one
 *     synchronous block reads the previous world.
 *   - `removeItem` MUST cancel a pending write for that key, or a delete gets
 *     resurrected by the buffered value landing after it.
 *   - Ordering across keys MUST be preserved — writes chain off one promise
 *     rather than racing.
 *   - The buffer holds for exactly one microtask, so anything that can end the
 *     page (`visibilitychange` → hidden, `pagehide`) flushes first. On iOS the
 *     app being backgrounded fires both.
 */
import type { PersistStorage, StateStorage, StorageValue } from 'zustand/middleware';

type Pending<S> = { kind: 'set'; value: StorageValue<S> } | { kind: 'remove' };

/** Every live coalescer's flush, so page-lifecycle events can drain them all. */
const registry = new Set<() => Promise<void>>();

/** Drain every coalescer immediately. Called on page hide; safe to call anytime. */
export function flushPendingSaves(): Promise<void> {
  return Promise.all([...registry].map((f) => f())).then(() => undefined);
}

let lifecycleBound = false;

/**
 * Bind page-lifecycle flushes once.
 *
 * `visibilitychange` is the one that matters on iOS — backgrounding the app
 * fires it, and unlike `beforeunload` the browser actually runs it. `pagehide`
 * covers the bfcache path. Both are best-effort: the buffer is one microtask
 * deep, so the window where a write is in flight at all is vanishingly small.
 */
function bindLifecycle(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushPendingSaves();
  });
  window.addEventListener('pagehide', () => void flushPendingSaves());
}

/**
 * A `PersistStorage` that collapses a synchronous burst of commits into one
 * serialize-and-write of the final state.
 *
 * Drop-in for `createJSONStorage(() => inner)` — it does the same JSON work,
 * just deferred to the moment the write actually happens, which is the entire
 * point (see the module header).
 *
 * The returned storage carries `flush()` for callers that need the save on
 * disk right now (tests, and anything copying the live blob to a slot).
 */
export function coalesceWrites<S>(
  inner: StateStorage,
): PersistStorage<S> & { flush(): Promise<void> } {
  const pending = new Map<string, Pending<S>>();
  // Entries handed to the backing store but not yet confirmed written. They
  // have left `pending` and have not arrived in `inner`, so without this a
  // read in that window falls through to the stale stored value.
  const inflight = new Map<string, Pending<S>>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Serializes the actual writes so two flushes cannot interleave and land a
  // stale value last. Every drain chains onto this.
  let chain: Promise<void> = Promise.resolve();

  function drain(): Promise<void> {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    if (pending.size === 0) return chain;
    const batch = new Map(pending);
    pending.clear();
    for (const [k, p] of batch) inflight.set(k, p);
    chain = chain.then(async () => {
      for (const [key, p] of batch) {
        try {
          // 序列化只發生在這裡 — once per drain, not once per commit. This
          // line is the whole reason the module owns the JSON layer.
          if (p.kind === 'remove') await inner.removeItem(key);
          else await inner.setItem(key, JSON.stringify(p.value));
        } catch {
          // A failed write must not poison the chain for later saves; the
          // underlying storage already has its own quota/IDB fallbacks.
        }
      }
    }).then(() => {
      // Identity check, not just key presence: a newer batch may already own
      // this key, and dropping its entry would reopen the stale-read window.
      for (const [k, p] of batch) if (inflight.get(k) === p) inflight.delete(k);
    });
    return chain;
  }

  /**
   * A timer, not `queueMicrotask`. The caller may `await` each `setItem`, and
   * every await drains the microtask queue — which would run the flush between
   * two writes of the same burst and coalesce nothing. A macrotask window sits
   * outside all of that, so a whole synchronous commit run collapses no matter
   * how the caller awaits. The cost is one event-loop turn of delay, and the
   * page-lifecycle hooks below cover the case where the page ends first.
   */
  function schedule(): void {
    if (timer !== null) return;
    timer = setTimeout(() => { timer = null; void drain(); }, 0);
  }

  const flush = () => drain();
  registry.add(flush);
  bindLifecycle();

  return {
    async getItem(name) {
      // Read-through the buffer: a pending (or still-landing) write is the
      // truth, not what the backing store happens to hold right now. It is
      // also still an object here, so a save-then-load inside one block skips
      // the round trip through JSON entirely.
      const p = pending.get(name) ?? inflight.get(name);
      if (p) return p.kind === 'remove' ? null : p.value;
      const raw = await inner.getItem(name);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as StorageValue<S>;
      } catch {
        // A corrupt blob must read as "no save", not throw on boot — that
        // would take the whole app down before the title screen.
        return null;
      }
    },
    setItem(name, value) {
      pending.set(name, { kind: 'set', value });
      schedule();
      return Promise.resolve();
    },
    removeItem(name) {
      // Overwrites any buffered value for this key — otherwise the delete
      // happens and then the stale write lands on top of it.
      pending.set(name, { kind: 'remove' });
      schedule();
      return Promise.resolve();
    },
    flush,
  };
}
