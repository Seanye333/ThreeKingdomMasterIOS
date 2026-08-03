import { describe, it, expect } from 'vitest';
import { followerDraw, followerChance, pickJoiner, rollFollowers,
         type FollowerContext } from './careerFollowers';
import { RANK_COMMONER, RANK_RETAINER } from './career';
import { mkOfficer } from '../../test/factories';
import type { HeroicDeeds } from '../types/deeds';
import type { EntityId, Officer } from '../types';

const deeds = (d: Partial<HeroicDeeds>) => d as HeroicDeeds;

const ctx = (over: Partial<FollowerContext> = {}): FollowerContext => ({
  deeds: undefined,
  charisma: 60,
  renown: 0,
  locationCityId: 'c1',
  hometownCityId: 'c1',
  privateTroops: 0,
  leadership: 60,
  ...over,
});

describe('投效之望', () => {
  it('rewards what you did, not what you own', () => {
    const idle = followerDraw(ctx());
    const proven = followerDraw(ctx({ deeds: deeds({ battlesWon: 12, duelsWon: 6 }) }));
    expect(proven).toBeGreaterThan(idle);
  });

  it('being in your own hometown is worth real pull', () => {
    const home = followerDraw(ctx({ hometownCityId: 'c1', locationCityId: 'c1' }));
    const away = followerDraw(ctx({ hometownCityId: 'c1', locationCityId: 'c9' }));
    expect(home - away).toBeCloseTo(0.16, 5);
  });

  it('a commoner still draws someone — an opening with no movement reads as broken', () => {
    expect(followerChance(followerDraw(ctx()), RANK_COMMONER)).toBeGreaterThan(0.15);
  });

  it('rank raises the odds but never to a certainty', () => {
    const d = followerDraw(ctx({ deeds: deeds({ citiesTaken: 20 }), renown: 200, charisma: 99 }));
    expect(followerChance(d, 3)).toBeGreaterThan(followerChance(d, RANK_COMMONER));
    expect(followerChance(d, 1)).toBeLessThanOrEqual(0.62);
  });
});

describe('義士來投 — 同鄉優先', () => {
  const mkFree = (id: string, home: string | undefined, city: string, war = 50): Officer => {
    const o = mkOfficer({ id, forceId: null, status: 'idle',
      stats: { war, leadership: 50, intelligence: 50, politics: 50, charisma: 50 } });
    (o as { hometownCityId?: string }).hometownCityId = home;
    (o as { locationCityId?: string | null }).locationCityId = city;
    return o;
  };
  const pool = (list: Officer[]) =>
    Object.fromEntries(list.map((o) => [o.id, o])) as Record<EntityId, Officer>;

  it('picks a fellow townsman over a stranger standing right there', () => {
    const got = pickJoiner({
      officers: pool([mkFree('homie', 'c1', 'c9'), mkFree('stranger', 'c7', 'c1')]),
      heroId: 'hero', hometownCityId: 'c1', locationCityId: 'c1',
      rank: RANK_RETAINER, roll: 0.5,
    });
    expect(got?.id).toBe('homie');
    expect(got?.viaHometown).toBe(true);
  });

  it('a commoner attracts no named officer at all', () => {
    expect(pickJoiner({
      officers: pool([mkFree('homie', 'c1', 'c1')]),
      heroId: 'hero', hometownCityId: 'c1', locationCityId: 'c1',
      rank: RANK_COMMONER, roll: 0.5,
    })).toBeNull();
  });

  it('a great captain will not follow a minor officer', () => {
    expect(pickJoiner({
      officers: pool([mkFree('star', 'c1', 'c1', 98)]),   // 98+50+50 = 198 > 165
      heroId: 'hero', hometownCityId: 'c1', locationCityId: 'c1',
      rank: RANK_RETAINER, roll: 0.5,
    })).toBeNull();
  });

  it('ignores officers already sworn to a force', () => {
    const sworn = mkFree('taken', 'c1', 'c1');
    (sworn as { forceId?: string | null }).forceId = 'F';
    expect(pickJoiner({
      officers: pool([sworn]),
      heroId: 'hero', hometownCityId: 'c1', locationCityId: 'c1',
      rank: RANK_RETAINER, roll: 0.5,
    })).toBeNull();
  });
});

describe('一季結算', () => {
  const empty = {} as Record<EntityId, Officer>;

  it('nothing happens when the season roll misses', () => {
    const out = rollFollowers(ctx(), empty, 'hero', [0.99, 0.5, 0.5]);
    expect(out).toEqual({ levies: 0, turnedAway: 0, viaHometown: false });
  });

  it('a commoner takes a few and has to turn the rest away', () => {
    // battlesWon:1 → 功績 5,還在白身(部曲門檻 6)。上限 10、已有 8 → 最多收 2。
    const out = rollFollowers(
      ctx({ deeds: deeds({ battlesWon: 1 }), privateTroops: 8 }), empty, 'hero',
      [0.01, 0.99, 0.99],
    );
    expect(out.levies).toBeLessThanOrEqual(2);
    expect(out.turnedAway).toBeGreaterThan(0);
  });

  it('turning people away is the signal to go earn an office', () => {
    const full = rollFollowers(
      ctx({ privateTroops: 10 }), empty, 'hero', [0.01, 0.9, 0.99],
    );
    expect(full.levies).toBe(0);
    expect(full.turnedAway).toBeGreaterThan(0);
  });

  it('rank widens how many come at once', () => {
    const asCommoner = rollFollowers(ctx({ privateTroops: 0 }), empty, 'hero', [0.01, 0.99, 0.99]);
    const asOfficer = rollFollowers(
      ctx({ deeds: deeds({ battlesWon: 5 }), privateTroops: 0 }), empty, 'hero',
      [0.01, 0.99, 0.99],
    );
    expect(asOfficer.levies).toBeGreaterThan(asCommoner.levies);
  });
});
