/**
 * 存檔成本契約 — two numbers that decide whether the game is playable on iOS.
 *
 * ## 1. One write per tick
 *
 * `endSeason` commits ~27 times synchronously. Persist used to write after
 * every one; measured over 240 ticks that was 468 writes (1.9/tick), 248 MB
 * serialized, and 17% of the entire season-resolution cost spent in
 * JSON.stringify. saveWriteCoalescer.ts collapses each burst to one write —
 * measured 240 writes (1.0/tick), 118 MB, 9%.
 *
 * This test pins that. Anything that writes the store outside the coalescer,
 * or an `await` slipped into the middle of `endSeason` (which would split one
 * burst into several), shows up here as the ratio climbing back toward 2.
 *
 * ## 2. The save does not grow without bound
 *
 * A 240-tick campaign lands around 690 KB — the accumulating logs (chronicle,
 * annals) are already trimmed, and battle replays persist without their
 * turn-by-turn trails. That is a property of the current partialize, not a
 * law: adding one unbounded array to it is enough to make a late campaign
 * unsaveable on a phone, and it would be invisible in dev where nobody plays
 * 240 ticks. So the ceiling is asserted.
 *
 * Both are ceilings with real headroom, not tight pins — this suite must fail
 * on a regression, not on noise.
 */
import { describe, it, expect, beforeAll } from 'vitest';

let writes = 0;
let bytes = 0;

beforeAll(() => {
  const g = globalThis as unknown as { localStorage?: unknown };
  const mem = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => {
      if (k === 'tkm-save') { writes++; bytes += v.length; }
      mem.set(k, String(v));
    },
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';

const TURNS = 240; // 一旬一次,240 旬 ≈ 10 遊戲年

let finalSaveBytes = 0;

beforeAll(async () => {
  const st = useGameStore;
  st.getState().loadScenario(SCENARIOS[0], SCENARIOS[0].forces[0].id, 'normal');
  await new Promise((r) => setTimeout(r, 50));
  writes = 0; bytes = 0;
  for (let i = 0; i < TURNS; i++) {
    st.getState().endSeason();
    // Each tick is its own synchronous block with a full event loop after it —
    // that is what pressing 「結束回合」 looks like. Grinding all 240 in one
    // block would coalesce everything into a single write and measure a win
    // that does not exist in the game.
    await new Promise((r) => setTimeout(r, 0));
  }
  await new Promise((r) => setTimeout(r, 100));
  const partialize = (useGameStore.persist as unknown as {
    getOptions(): { partialize(x: unknown): unknown };
  }).getOptions().partialize;
  finalSaveBytes = JSON.stringify(partialize(st.getState())).length;
}, 300_000);

describe('存檔寫入合併', () => {
  it('writes the save about once per tick, not once per commit', () => {
    const perTick = writes / TURNS;
    expect(perTick, `每旬寫入 ${perTick.toFixed(2)} 次(合併前為 1.9)`).toBeLessThanOrEqual(1.2);
  });

  it('still writes — a coalescer that drops every save would also pass the ceiling', () => {
    expect(writes, '整整 240 旬一次都沒存檔').toBeGreaterThanOrEqual(TURNS * 0.8);
  });
});

describe('存檔體積', () => {
  it('a 10-year campaign save stays under 1.5 MB', () => {
    const kb = finalSaveBytes / 1024;
    expect(kb, `末期存檔 ${kb.toFixed(0)} KB(基準約 690 KB)`).toBeLessThan(1536);
  });

  it('the accumulating logs are trimmed rather than kept in full', () => {
    // 240 ticks of history would run to thousands of entries unpruned.
    const s = useGameStore.getState();
    expect(s.annals?.length ?? 0, 'annals 未裁剪').toBeLessThan(600);
    expect(s.chronicle?.length ?? 0, 'chronicle 未裁剪').toBeLessThan(600);
  });

  it('battle replays persist without their turn-by-turn trails', () => {
    // A single trail runs 0.5-1 MB; partialize strips snapshots deliberately.
    const partialize = (useGameStore.persist as unknown as {
      getOptions(): { partialize(x: unknown): { battleReplays?: Array<{ snapshots?: unknown[] }> } };
    }).getOptions().partialize;
    const saved = partialize(useGameStore.getState()).battleReplays ?? [];
    for (const r of saved) expect(r.snapshots ?? []).toHaveLength(0);
  });
});
