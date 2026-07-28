import { describe, expect, it } from 'vitest';
import { HISTORICAL_BIOGRAPHIES } from './historicalBiographies';
import { HIST_BIOS_1 } from './historicalBios/part1';
import { HIST_BIOS_2 } from './historicalBios/part2';
import { HIST_BIOS_3 } from './historicalBios/part3';
import { HIST_BIOS_4 } from './historicalBios/part4';
import { HIST_BIOS_5 } from './historicalBios/part5';

/**
 * 列傳分檔不得互相吞沒 — historicalBiographies.ts is now a spread of five data
 * parts. A spread silently keeps the LAST value for a duplicated key, so an id
 * appearing in two parts would leave one biography permanently unreachable and
 * nothing would complain.
 *
 * That is not hypothetical: it is exactly the 2026-07 items.ts bug, where two
 * different items shared an id, ITEMS_BY_ID kept the later one, and a starting
 * treasure silently granted zero stats. This test is the guard that bug earned.
 */

const PARTS: Array<[string, Record<string, unknown>]> = [
  ['part1', HIST_BIOS_1],
  ['part2', HIST_BIOS_2],
  ['part3', HIST_BIOS_3],
  ['part4', HIST_BIOS_4],
  ['part5', HIST_BIOS_5],
];

describe('歷代列傳分檔', () => {
  it('no id appears in two parts', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const [name, part] of PARTS) {
      for (const id of Object.keys(part)) {
        const prev = seen.get(id);
        if (prev) clashes.push(`${id}: ${prev} & ${name}`);
        else seen.set(id, name);
      }
    }
    expect(clashes, `duplicate biography ids across parts:\n${clashes.join('\n')}`).toEqual([]);
  });

  it('the merged map holds exactly the sum of the parts', () => {
    // If this drifts from the sum, the spread ate something.
    const total = PARTS.reduce((n, [, p]) => n + Object.keys(p).length, 0);
    expect(Object.keys(HISTORICAL_BIOGRAPHIES).length).toBe(total);
  });

  it('every part contributes to the merged map', () => {
    for (const [name, part] of PARTS) {
      const ids = Object.keys(part);
      expect(ids.length, `${name} is empty`).toBeGreaterThan(0);
      for (const id of ids) {
        expect(HISTORICAL_BIOGRAPHIES[id], `${name}'s ${id} missing from the merge`).toBeTruthy();
      }
    }
  });

  it('every biography carries both languages', () => {
    for (const [id, bio] of Object.entries(HISTORICAL_BIOGRAPHIES)) {
      expect(bio.zh?.length, `${id} zh empty`).toBeGreaterThan(0);
      expect(bio.en?.length, `${id} en empty`).toBeGreaterThan(0);
    }
  });

  it('a quote, where present, carries both languages', () => {
    for (const [id, bio] of Object.entries(HISTORICAL_BIOGRAPHIES)) {
      if (!bio.quote) continue;
      expect(bio.quote.zh?.length, `${id} quote zh empty`).toBeGreaterThan(0);
      expect(bio.quote.en?.length, `${id} quote en empty`).toBeGreaterThan(0);
    }
  });

  it('the supplemental-quote pass still lands on real biographies', () => {
    // The merge loop at the foot of historicalBiographies.ts fills a quote only
    // where a bio exists AND has none of its own — so a figure who already had
    // a line keeps it (Han Xin keeps 多多益善 rather than taking 狡兔死). What
    // must hold after the split is that the pass still reaches the merged map
    // at all: plenty of figures carry a quote, and 項羽's supplemental one
    // landed.
    expect(HISTORICAL_BIOGRAPHIES['hist-xiang-yu']?.quote?.zh).toContain('力拔山');
    const quoted = Object.values(HISTORICAL_BIOGRAPHIES).filter((b) => b.quote).length;
    expect(quoted, 'no biography carries a quote — the merge pass is not running').toBeGreaterThan(50);
  });

  it('ids follow the hist- convention', () => {
    for (const id of Object.keys(HISTORICAL_BIOGRAPHIES)) {
      expect(id.startsWith('hist-'), `${id} breaks the hist- prefix convention`).toBe(true);
    }
  });
});
