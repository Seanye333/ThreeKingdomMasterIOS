import { describe, it, expect } from 'vitest';
import {
  recordRivalryBout, rivalryBetween, isNemesis, familiarity, headToHead, pairKey,
  rivalriesOf, findRivalryChallenge, NEMESIS_THRESHOLD, type RivalryMap,
} from './rivalries';
import { mkOfficer } from '../../test/factories';

describe('恩怨簿 — head-to-head history', () => {
  it('keys a pair order-independently and tallies wins to the right side', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'));
    let m: RivalryMap = {};
    m = recordRivalryBout(m, 'guan-yu', 'huang-zhong', 'a', false, 200, 1); // guan-yu wins
    m = recordRivalryBout(m, 'huang-zhong', 'guan-yu', 'a', false, 200, 2); // huang-zhong wins (caller order flipped)
    const rec = rivalryBetween(m, 'guan-yu', 'huang-zhong')!;
    expect(rec.bouts).toBe(2);
    expect(headToHead(rec, 'guan-yu')).toEqual({ mine: 1, theirs: 1, draws: 0 });
    expect(headToHead(rec, 'huang-zhong')).toEqual({ mine: 1, theirs: 1, draws: 0 });
  });

  it('becomes 宿敵 only after the threshold of bouts', () => {
    let m: RivalryMap = {};
    for (let i = 0; i < NEMESIS_THRESHOLD - 1; i++) m = recordRivalryBout(m, 'x', 'y', 'draw', false, 200, 0);
    expect(isNemesis(m, 'x', 'y')).toBe(false);
    m = recordRivalryBout(m, 'x', 'y', 'a', false, 200, 1);
    expect(isNemesis(m, 'x', 'y')).toBe(true);
  });

  it('familiarity rises with bouts and resets to 0 once closed in blood', () => {
    let m: RivalryMap = {};
    m = recordRivalryBout(m, 'x', 'y', 'a', false, 200, 0);
    m = recordRivalryBout(m, 'x', 'y', 'b', false, 200, 1);
    const f2 = familiarity(rivalryBetween(m, 'x', 'y'));
    expect(f2).toBeGreaterThan(0);
    expect(f2).toBeLessThan(1);
    m = recordRivalryBout(m, 'x', 'y', 'a', true, 200, 2); // x slays y
    const rec = rivalryBetween(m, 'x', 'y')!;
    expect(rec.killerId).toBe('x');
    expect(rec.victimId).toBe('y');
    expect(isNemesis(m, 'x', 'y')).toBe(false); // closed in blood
    expect(familiarity(rec)).toBe(0);
  });

  it('rivalriesOf lists an officer\'s feuds, most-fought first', () => {
    let m: RivalryMap = {};
    m = recordRivalryBout(m, 'hero', 'a', 'a', false, 200, 0);
    m = recordRivalryBout(m, 'hero', 'b', 'a', false, 200, 0);
    m = recordRivalryBout(m, 'hero', 'b', 'a', false, 200, 1);
    const list = rivalriesOf(m, 'hero');
    expect(list.length).toBe(2);
    expect(list[0].bouts).toBe(2); // the 'b' feud, most-fought, comes first
  });

  it('a sworn 宿敵 forged in play triggers a rivalry challenge even without a hand-listed pairing', () => {
    const officers = {
      mine: mkOfficer({ id: 'mine', forceId: 'P', stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } }),
      foe: mkOfficer({ id: 'foe', forceId: 'E', stats: { war: 90, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } }),
    };
    let m: RivalryMap = {};
    for (let i = 0; i < NEMESIS_THRESHOLD; i++) m = recordRivalryBout(m, 'mine', 'foe', 'draw', false, 200, 0);
    const noHistory = findRivalryChallenge(officers, 'P', {}, () => 0, {});
    expect(noHistory).toBeNull(); // not a famous pair, no grudge, no history
    const withHistory = findRivalryChallenge(officers, 'P', {}, () => 0, m);
    expect(withHistory).not.toBeNull();
    expect(withHistory!.rivalId).toBe('foe');
  });
});
