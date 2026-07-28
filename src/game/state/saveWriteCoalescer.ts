/**
 * 存檔寫入合併 — collapse a season's intermediate saves into one.
 *
 * ## The measurement that motivated this
 *
 * `endSeason` is synchronous and commits ~27 times (each `set()` is a separate
 * zustand commit, and persist writes after every one). Measured over 240 ticks
 * of the opening scenario:
 *
 *   - 468 storage writes — 1.9 per tick
 *   - 248 MB serialized in total, averaging 542 KB a write
 *   - 17% of the whole season-resolution cost was JSON.stringify alone
 *
 * Every one of those writes except the last is a world that existed for
 * microseconds. Nobody can load them; the next commit overwrites them. On a
 * desktop that is merely wasteful, but the save is ~690 KB by year ten and the
 * real target is iOS, where each write is a stringify plus an IndexedDB
 * transaction.
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
import type { StateStorage } from 'zustand/middleware';

type Pending = { kind: 'set'; value: string } | { kind: 'remove' };

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
 * Wrap a StateStorage so writes issued in the same synchronous block collapse
 * into a single write of the final value, flushed on the next microtask.
 *
 * A microtask — not a timer — is deliberate. It is the shortest delay that
 * still spans a whole synchronous commit run, so `endSeason` collapses to one
 * write while a save is never more than a tick of the event loop behind the
 * store. A longer window would coalesce more and risk more.
 *
 * The returned storage carries `flush()` for callers that need the write on
 * disk right now (tests, and the save-slot code that copies the live blob).
 */
export function coalesceWrites(inner: StateStorage): StateStorage & { flush(): Promise<void> } {
  const pending = new Map<string, Pending>();
  // Entries handed to the backing store but not yet confirmed written. They
  // have left `pending` and have not arrived in `inner`, so without this a
  // read in that window falls through to the stale stored value.
  const inflight = new Map<string, Pending>();
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
          if (p.kind === 'remove') await inner.removeItem(key);
          else await inner.setItem(key, p.value);
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
      // truth, not what the backing store happens to hold right now.
      const p = pending.get(name) ?? inflight.get(name);
      if (p) return p.kind === 'remove' ? null : p.value;
      return inner.getItem(name);
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
