import { describe, it, expect } from 'vitest';
import { duelCommentary, debateCommentary } from './combatCommentary';

describe('實況解說 (commentary)', () => {
  it('announces a kill with both names', () => {
    const l = duelCommentary({ aName: '關羽', dName: '顏良', winner: 'attacker', hit: 'd', killed: true });
    expect(l?.zh).toContain('關羽');
    expect(l?.zh).toContain('顏良');
  });

  it('calls a disarm', () => {
    const l = duelCommentary({ aName: 'A', dName: 'B', winner: 'attacker', hit: 'd', disarm: 'defender' });
    expect(l?.en.toLowerCase()).toContain('disarm');
  });

  it('names a finisher combo', () => {
    const l = duelCommentary({ aName: 'A', dName: 'B', winner: 'attacker', hit: 'd', combo: { side: 'attacker', length: 3, named: true } });
    expect(l?.zh).toContain('連段必殺');
  });

  it('returns a line for a one-sided exchange and is index-stable', () => {
    const a = duelCommentary({ aName: 'A', dName: 'B', winner: 'attacker', hit: 'd' }, 2);
    const b = duelCommentary({ aName: 'A', dName: 'B', winner: 'attacker', hit: 'd' }, 2);
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });

  it('announces a debate rout', () => {
    const l = debateCommentary({ aName: '孔明', dName: '王朗', winner: 'a', hit: 'd', routed: true, dmg: 40 });
    expect(l?.zh).toContain('孔明');
    expect(l?.zh).toMatch(/罵倒|潰不成言/);
  });

  it('quiet rounds may return null', () => {
    expect(duelCommentary({ aName: 'A', dName: 'B', winner: 'draw', hit: 'a' })).toBeNull();
  });
});
