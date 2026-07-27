/**
 * 部族之世 — a people that had not yet coalesced does not sit on the frontier.
 *
 * Found by running the all-AI observer (scripts/ai-watch.ts) on the Warring
 * States board: it ended 200 turns with a `tribe-state-linyi` holding two
 * cities — Linyi being a kingdom whose own description says it was founded in
 * 192 AD, roughly four centuries after that board's story. Same shape as the
 * Yellow Turbans rising against Xiang Yu: every scenario opens at game year
 * 178 regardless of era, so anything gated on `date.year` mis-fires. The gate
 * has to be the BOARD.
 */
import { describe, expect, it } from 'vitest';
import { TRIBES, tribesOnBoard, boardHistoricalYear } from '../data/tribes';
import { createInitialTribeState } from './tribes';

describe('tribesOnBoard — 依盤面紀年', () => {
  it('Linyi (founded 192 AD) is absent from the Warring States and Chu-Han boards', () => {
    expect(tribesOnBoard('scn-ws-seven').map((t) => t.id)).not.toContain('linyi');
    expect(tribesOnBoard('scn-ch-chuhan').map((t) => t.id)).not.toContain('linyi');
  });

  it('the Han-era frontier is complete — nothing is gated off the default board', () => {
    expect(tribesOnBoard('scn-190-anti-dong-zhuo').length).toBe(TRIBES.length);
    expect(tribesOnBoard(null).length).toBe(TRIBES.length);
  });

  it('the ancient peoples are on every board', () => {
    // 匈奴/羌/氐/南蠻/山越 carry no foundedYear: they predate every scenario.
    for (const id of ['xiongnu', 'qiang', 'di', 'nanban', 'shanyue']) {
      expect(tribesOnBoard('scn-ws-seven').map((t) => t.id), id).toContain(id);
    }
  });

  it('Goguryeo (37 BC) reaches the Chu-Han board but not the Warring States one', () => {
    expect(tribesOnBoard('scn-ws-seven').map((t) => t.id)).not.toContain('goguryeo');
    expect(tribesOnBoard('scn-ch-chuhan').map((t) => t.id)).not.toContain('goguryeo');
    expect(tribesOnBoard('scn-st-suiend').map((t) => t.id)).toContain('goguryeo');
  });

  it('boards sit in their own era, not in game-year 178', () => {
    expect(boardHistoricalYear('scn-ws-seven')).toBeLessThan(0);
    expect(boardHistoricalYear('scn-ch-daze')).toBeLessThan(0);
    expect(boardHistoricalYear('scn-st-suiend')).toBeGreaterThan(500);
  });
});

describe('createInitialTribeState — 缺席即無條目', () => {
  it('absence is expressed by having no aggression entry at all', () => {
    // Every downstream loop (raids, levies, incitement, AI punitive expeditions)
    // skips on `aggression[id] == null`, so this is the single switch that
    // takes a people off the board.
    const ws = createInitialTribeState('scn-ws-seven');
    expect(ws.aggression.linyi).toBeUndefined();
    expect(ws.aggression.xiongnu).toBeGreaterThan(0);
    const han = createInitialTribeState('scn-190-anti-dong-zhuo');
    expect(han.aggression.linyi).toBeGreaterThan(0);
  });
});
