import { describe, expect, it } from 'vitest';
import { SCENARIO_OBJECTIVES } from './objectives';
import { OBJ_THREEKINGDOMS } from './objectives/threeKingdoms';
import { OBJ_WHATIF } from './objectives/whatif';
import { OBJ_WARRINGSTATES } from './objectives/warringStates';
import { OBJ_CHUHAN } from './objectives/chuHan';
import { OBJ_SUITANG } from './objectives/suiTang';
import { SCENARIOS } from './scenarios';

/**
 * 劇本目標分檔不得互相吞沒 — objectives.ts is now a spread of five board
 * files. A duplicated scenario id would leave one board's objectives silently
 * unreachable, exactly like the 2026-07 items.ts duplicate-id bug.
 *
 * The scenario-coverage cases below are the more valuable half: a scenario with
 * no objectives is a campaign the player can start and never be told what to
 * do, and that failure is invisible until someone plays it.
 */

const PARTS: Array<[string, Record<string, unknown>]> = [
  ['threeKingdoms', OBJ_THREEKINGDOMS],
  ['whatif', OBJ_WHATIF],
  ['warringStates', OBJ_WARRINGSTATES],
  ['chuHan', OBJ_CHUHAN],
  ['suiTang', OBJ_SUITANG],
];

describe('劇本目標分檔', () => {
  it('no scenario id appears in two board files', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const [name, part] of PARTS) {
      for (const id of Object.keys(part)) {
        const prev = seen.get(id);
        if (prev) clashes.push(`${id}: ${prev} & ${name}`);
        else seen.set(id, name);
      }
    }
    expect(clashes, `duplicate scenario ids across boards:\n${clashes.join('\n')}`).toEqual([]);
  });

  it('the merged map holds exactly the sum of the parts', () => {
    const total = PARTS.reduce((n, [, p]) => n + Object.keys(p).length, 0);
    expect(Object.keys(SCENARIO_OBJECTIVES).length).toBe(total);
  });

  it('every part contributes to the merged map', () => {
    for (const [name, part] of PARTS) {
      const ids = Object.keys(part);
      expect(ids.length, `${name} is empty`).toBeGreaterThan(0);
      for (const id of ids) {
        expect(SCENARIO_OBJECTIVES[id], `${name}'s ${id} missing from the merge`).toBeTruthy();
      }
    }
  });

  it('every objective set is non-empty', () => {
    // An id mapped to [] is worse than a missing id: the lookup succeeds and
    // the player is told nothing.
    for (const [id, objs] of Object.entries(SCENARIO_OBJECTIVES)) {
      expect(objs.length, `${id} has an empty objective list`).toBeGreaterThan(0);
    }
  });

  it('every objectives key names a real scenario', () => {
    const known = new Set(SCENARIOS.map((s) => s.id));
    const orphans = Object.keys(SCENARIO_OBJECTIVES).filter((id) => !known.has(id));
    expect(orphans, `objectives for scenarios that do not exist: ${orphans.join(', ')}`).toEqual([]);
  });

  it('every scenario has objectives', () => {
    // The inverse, and the one that actually bites: a playable scenario with no
    // goal defined starts fine and never tells the player what winning means.
    const missing = SCENARIOS.map((s) => s.id).filter((id) => !SCENARIO_OBJECTIVES[id]);
    expect(missing, `scenarios with no objectives: ${missing.join(', ')}`).toEqual([]);
  });
});
