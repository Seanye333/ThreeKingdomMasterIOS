import { describe, it, expect } from 'vitest';
import { findRivalryChallenge } from './rivalries';
import { mkOfficer } from '../../test/factories';

const fighter = (id: string, forceId: string) => mkOfficer({ id, forceId, stats: { war: 85, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } });

describe('宿敵 (rivalry challenges)', () => {
  it('a famous rival who is present and hostile rides out', () => {
    const officers = {
      'guan-yu': fighter('guan-yu', 'shu'),
      'huang-zhong': fighter('huang-zhong', 'wei'),
    };
    const ch = findRivalryChallenge(officers, 'shu');
    expect(ch).not.toBeNull();
    expect(ch!.championId).toBe('guan-yu');
    expect(ch!.rivalId).toBe('huang-zhong');
    expect(ch!.famous).toBe(true);
  });

  it('no challenge when the rival is on your own side', () => {
    const officers = {
      'guan-yu': fighter('guan-yu', 'shu'),
      'huang-zhong': fighter('huang-zhong', 'shu'),
    };
    expect(findRivalryChallenge(officers, 'shu')).toBeNull();
  });

  it('an emergent grudge (very low 好感) qualifies when no famous pair exists', () => {
    const officers = {
      'a': fighter('a', 'shu'),
      'b': fighter('b', 'wei'),
    };
    const rapport = { 'a:b': -50 };
    const ch = findRivalryChallenge(officers, 'shu', rapport);
    expect(ch).not.toBeNull();
    expect(ch!.famous).toBe(false);
  });

  it('returns null when no rivals are present', () => {
    const officers = { 'guan-yu': fighter('guan-yu', 'shu') };
    expect(findRivalryChallenge(officers, 'shu')).toBeNull();
  });
});
