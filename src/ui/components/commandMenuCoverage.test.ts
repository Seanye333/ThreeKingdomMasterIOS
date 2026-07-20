/**
 * 指令選單覆蓋 — the city command menu orders its buttons from hand-written
 * lists (commandMenuOrder.ts), so a newly-added InternalAffairsType is
 * invisible — and therefore unusable — until someone remembers to add it.
 * This test is that someone.
 *
 * It caught exactly that the day 決獄/括戶/抑兼併 were added: the commands
 * existed, the AI used them, the advisor recommended them — and the player
 * could not click them.
 */
import { describe, it, expect } from 'vitest';
import { CIVIL_ORDER, MIL_ORDER, MAJOR_CIVIL, MAJOR_MIL, MIL_TYPES } from './commandMenuOrder';
import { COMMAND_DEFS } from '../../game/systems/commands';
import type { InternalAffairsType } from '../../game/types';

const shown = new Set<string>([...CIVIL_ORDER, ...MIL_ORDER, ...MAJOR_CIVIL, ...MAJOR_MIL]);

describe('every internal-affairs command is reachable from the menu', () => {
  it('lists every command defined in COMMAND_DEFS', () => {
    const defined = Object.keys(COMMAND_DEFS).filter((k) => k !== 'march') as InternalAffairsType[];
    expect(defined.filter((t) => !shown.has(t))).toEqual([]);
  });

  it('lists nothing that does not exist', () => {
    expect([...shown].filter((t) => !(t in COMMAND_DEFS))).toEqual([]);
  });

  it('shows each command exactly once', () => {
    const all = [...CIVIL_ORDER, ...MIL_ORDER, ...MAJOR_CIVIL, ...MAJOR_MIL];
    expect(all.length).toBe(shown.size);
  });

  it('keeps the 軍務 tab split consistent with its own lists', () => {
    for (const t of MIL_ORDER) expect(MIL_TYPES.has(t)).toBe(true);
    for (const t of CIVIL_ORDER) expect(MIL_TYPES.has(t)).toBe(false);
    expect(MIL_TYPES.has('march')).toBe(true);
  });
});
