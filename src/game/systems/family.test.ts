import { describe, it, expect } from 'vitest';
import type { GameDate, Officer, OfficerStats, PendingHeir } from '../types';
import {
  tickFamily, birthChanceFor, rollHeirTraits, applyUpbringing, shadowRankFor, addParentChild,
  aiArrangeMarriages,
} from './family';
import { applySuccession } from './succession';
import type { Force } from '../types';
import { deriveInitialClanStandings, tickClanStandings, clanTierOf, clanPrestigeBonus } from './clans';
import { clanOf } from '../data/clans';

function mkOfficer(id: string, over: Partial<Officer> = {}): Officer {
  return {
    id,
    name: { zh: id, en: id },
    birthYear: 180,
    forceId: 'wei',
    stats: { leadership: 70, war: 70, intelligence: 70, politics: 70, charisma: 70 },
    loyalty: 70,
    status: 'idle',
    locationCityId: 'luoyang',
    task: null,
    equipment: [] as Officer['equipment'],
    skills: [],
    rank: 'soldier',
    ...over,
  } as Officer;
}

const SPRING: GameDate = { year: 210, season: 'spring', phase: 'lower' } as GameDate;
function dateAt(year: number, season: GameDate['season'] = 'spring'): GameDate {
  return { year, season, phase: 'lower' } as GameDate;
}

describe('tickFamily — cross-force birth guard', () => {
  it('a couple split across realms does not breed', () => {
    const a = mkOfficer('a', { female: false, birthYear: 185, forceId: 'wei' });
    const b = mkOfficer('b', { female: true, birthYear: 188, forceId: 'shu' });
    const out = tickFamily({
      date: SPRING,
      officers: { a, b },
      family: [{ officerA: 'a', officerB: 'b', kind: 'spouse' }],
      pendingHeirs: [],
      rng: () => 0.0, // would always roll a birth if eligible
    });
    expect(out.pendingHeirs).toHaveLength(0);
  });

  it('a same-force couple breeds and the child inherits traits', () => {
    const a = mkOfficer('a', { female: false, birthYear: 185, forceId: 'wei', traits: ['loyal'] });
    const b = mkOfficer('b', { female: true, birthYear: 188, forceId: 'wei', traits: ['loyal'] });
    const out = tickFamily({
      date: SPRING,
      officers: { a, b },
      family: [{ officerA: 'a', officerB: 'b', kind: 'spouse' }],
      pendingHeirs: [],
      rng: () => 0.0,
    });
    expect(out.pendingHeirs).toHaveLength(1);
    // With both parents carrying 'loyal' and rng=0, the child inherits it.
    expect(out.pendingHeirs[0].traits).toContain('loyal');
  });
});

describe('birthChanceFor — marital harmony', () => {
  it('harmonious couples conceive more readily than discordant ones', () => {
    // sharedBondableTrait → harmonious. Cruel+gentle → discordant.
    const gentleA = mkOfficer('a', { traits: ['benevolent'] });
    const gentleB = mkOfficer('b', { traits: ['benevolent'] });
    const cruel = mkOfficer('c', { traits: ['cruel'] });
    const gentle = mkOfficer('d', { traits: ['benevolent'] });
    const harmonious = birthChanceFor(gentleA, gentleB);
    const discordant = birthChanceFor(cruel, gentle);
    const neutral = birthChanceFor(mkOfficer('e'), mkOfficer('f'));
    expect(harmonious).toBeGreaterThan(neutral);
    expect(discordant).toBeLessThan(neutral);
  });
});

describe('applyUpbringing — schooling biases growth', () => {
  it('nudges baseStats toward the tutor strengths over the years', () => {
    const tutor = mkOfficer('tutor', { stats: { leadership: 50, war: 50, intelligence: 110, politics: 60, charisma: 50 } });
    let heir: PendingHeir = {
      id: 'heir-1', parentAId: 'a', parentBId: 'b', birthYear: 200,
      baseStats: { leadership: 40, war: 40, intelligence: 40, politics: 40, charisma: 40 },
      name: { zh: '子', en: 'Child' }, female: false, tutorId: 'tutor',
    };
    const officers = { tutor };
    // Run a few schooled years (ages 5..9). rng kept mid so no random extras dominate.
    for (let y = 205; y <= 209; y++) heir = applyUpbringing(heir, officers, y, () => 0.5);
    expect(heir.upbringing).toBeDefined();
    expect(heir.upbringing!.years).toBe(5);
    const bias = heir.upbringing!.statBias;
    // Intelligence (the tutor's strength) should be the most-grown stat.
    const maxKey = (Object.keys(bias) as Array<keyof OfficerStats>).sort((x, y2) => bias[y2] - bias[x])[0];
    expect(maxKey).toBe('intelligence');
    expect(bias.intelligence).toBeGreaterThan(0);
  });

  it('does nothing outside the 5–13 age window', () => {
    const heir: PendingHeir = {
      id: 'heir-2', parentAId: 'a', parentBId: 'b', birthYear: 200,
      baseStats: { leadership: 40, war: 40, intelligence: 40, politics: 40, charisma: 40 },
      name: { zh: '子', en: 'Child' }, female: false,
    };
    const unchanged = applyUpbringing(heir, {}, 203, () => 0.5); // age 3
    expect(unchanged.upbringing).toBeUndefined();
  });
});

describe('tickFamily — coming of age', () => {
  it('activates an heir at 14 with traits, a clan, and a shadow rank', () => {
    const parent = mkOfficer('cao-cao', {
      name: { zh: '曹操', en: 'Cao Cao' }, forceId: 'wei', female: false,
      stats: { leadership: 100, war: 90, intelligence: 95, politics: 98, charisma: 100 },
      skills: ['skill-x'],
    });
    const heir: PendingHeir = {
      id: 'heir-cc', parentAId: 'cao-cao', parentBId: 'mother', birthYear: 196,
      baseStats: { leadership: 60, war: 60, intelligence: 60, politics: 60, charisma: 60 },
      name: { zh: '曹丕', en: 'Cao Pi' }, female: false, traits: ['ambitious'],
    };
    const out = tickFamily({
      date: dateAt(210, 'winter'), // age 14
      officers: { 'cao-cao': parent },
      family: [],
      pendingHeirs: [heir],
      rng: () => 0.5,
    });
    expect(out.pendingHeirs).toHaveLength(0);
    const child = out.officers['heir-cc'];
    expect(child).toBeDefined();
    expect(child.traits).toContain('ambitious');
    expect(child.skills).toContain('skill-x'); // inherited a parent skill
    expect(child.rank).not.toBe('soldier'); // 蔭補 from a distinguished parent
    expect(child.clanId).toBeDefined(); // joined / founded a house
    // The founding parent now heads the house too.
    expect(out.officers['cao-cao'].clanId).toBe(child.clanId);
  });
});

describe('clan standings — prestige & tiers', () => {
  it('a curated great clan reads as a 世家; a lone officer is humble', () => {
    const officers: Record<string, Officer> = {
      'sima-yi': mkOfficer('sima-yi', { stats: { leadership: 95, war: 70, intelligence: 100, politics: 98, charisma: 85 } }),
      'sima-shi': mkOfficer('sima-shi', { stats: { leadership: 90, war: 75, intelligence: 92, politics: 88, charisma: 80 } }),
      'nobody': mkOfficer('nobody'),
    };
    const standings = deriveInitialClanStandings(officers);
    expect(standings['sima']).toBeDefined();
    expect(clanTierOf(officers['sima-yi'], standings)).not.toBe('humble');
    // A lone unaffiliated officer forms no house.
    expect(clanTierOf(officers['nobody'], standings)).toBe('humble');
  });

  it('a great-house scion gets recruit + loyalty bonuses; humble gets none', () => {
    const officers: Record<string, Officer> = {
      'sima-yi': mkOfficer('sima-yi', { stats: { leadership: 110, war: 80, intelligence: 120, politics: 115, charisma: 100 }, peerageId: 'xian' }),
      'sima-shi': mkOfficer('sima-shi', { stats: { leadership: 100, war: 80, intelligence: 110, politics: 105, charisma: 95 }, peerageId: 'ting' }),
    };
    const standings = deriveInitialClanStandings(officers);
    const bonus = clanPrestigeBonus(officers['sima-yi'], standings);
    expect(bonus.recruit).toBeGreaterThan(0);
    expect(clanPrestigeBonus(mkOfficer('nobody'), standings).recruit).toBe(0);
  });

  it('eases prestige toward a falling target but remembers the peak', () => {
    const strong: Record<string, Officer> = {
      'sima-yi': mkOfficer('sima-yi', { stats: { leadership: 120, war: 90, intelligence: 130, politics: 125, charisma: 110 }, peerageId: 'gong' }),
      'sima-shi': mkOfficer('sima-shi', { stats: { leadership: 110, war: 90, intelligence: 120, politics: 115, charisma: 105 }, peerageId: 'xian' }),
    };
    const start = deriveInitialClanStandings(strong);
    const peak = start['sima'].prestige;
    // Both members die — target collapses.
    const fallen: Record<string, Officer> = {
      'sima-yi': { ...strong['sima-yi'], status: 'dead' },
      'sima-shi': { ...strong['sima-shi'], status: 'dead' },
    };
    const after = tickClanStandings(fallen, start);
    expect(after.clanStandings['sima'].prestige).toBeLessThan(peak); // declined
    expect(after.clanStandings['sima'].peakPrestige).toBe(peak);     // peak remembered
  });
});

describe('addParentChild / rollHeirTraits / shadowRank', () => {
  it('addParentChild is idempotent', () => {
    const f1 = addParentChild([], 'parent', 'child');
    const f2 = addParentChild(f1, 'parent', 'child');
    expect(f2).toHaveLength(1);
    expect(f2[0]).toMatchObject({ officerA: 'child', officerB: 'parent', kind: 'parent-child' });
  });

  it('rollHeirTraits only yields inheritable (non-legendary, wired) traits', () => {
    const father = mkOfficer('f', { traits: ['loyal'] });
    const mother = mkOfficer('m', { traits: ['loyal'] });
    const traits = rollHeirTraits(father, mother, () => 0.0);
    expect(traits.length).toBeGreaterThan(0);
  });

  it('shadowRankFor lifts the child of a distinguished parent above soldier', () => {
    const lord = mkOfficer('lord', { stats: { leadership: 100, war: 95, intelligence: 95, politics: 98, charisma: 100 } });
    const nobody = mkOfficer('nobody', { stats: { leadership: 30, war: 30, intelligence: 30, politics: 30, charisma: 30 } });
    expect(shadowRankFor(lord).rank).not.toBe('soldier');
    expect(shadowRankFor(nobody).rank).toBe('soldier');
  });
});

describe('clanOf honors runtime clanId', () => {
  it('a runtime clanId overrides curated membership for emergent houses', () => {
    const heir = mkOfficer('heir-x', { clanId: 'house-foo' });
    expect(clanOf(heir)).toBe('house-foo');
  });
});

function mkForce(over: Partial<Force> = {}): Force {
  return { id: 'wei', name: { zh: '魏', en: 'Wei' }, rulerOfficerId: 'lord', capitalCityId: 'luoyang', color: '#00f', isPlayer: false } as Force;
}

describe('succession — 世子 priority & 諸子奪嫡', () => {
  it('prefers the designated heir over the eldest son, and passed-over sons resent it', () => {
    const lord = mkOfficer('lord', { status: 'dead', forceId: 'wei' });
    const elder = mkOfficer('elder', { birthYear: 198, forceId: 'wei', loyalty: 80 });
    const younger = mkOfficer('younger', { birthYear: 202, forceId: 'wei', loyalty: 80, designatedHeir: true });
    const out = applySuccession({
      forces: { wei: mkForce() },
      officers: { lord, elder, younger },
      family: [
        { officerA: 'elder', officerB: 'lord', kind: 'parent-child' },
        { officerA: 'younger', officerB: 'lord', kind: 'parent-child' },
      ],
    });
    expect(out.forces.wei.rulerOfficerId).toBe('younger'); // 世子 wins over birth order
    expect(out.officers.elder.loyalty).toBeLessThan(80);   // passed-over son resents it
  });
});

describe('aiArrangeMarriages — AI grows its own dynasties', () => {
  it('weds two unmarried AI officers but never the player\'s', () => {
    const officers: Record<string, Officer> = {
      'ai-a': mkOfficer('ai-a', { forceId: 'wei', birthYear: 188, female: false }),
      'ai-b': mkOfficer('ai-b', { forceId: 'wei', birthYear: 192, female: true }),
      'me-a': mkOfficer('me-a', { forceId: 'shu', birthYear: 188 }),
      'me-b': mkOfficer('me-b', { forceId: 'shu', birthYear: 190 }),
    };
    const out = aiArrangeMarriages({ officers, family: [], playerForceId: 'shu', year: 210, rng: () => 0 });
    const spouses = out.family.filter((r) => r.kind === 'spouse');
    expect(spouses).toHaveLength(1);
    const ids = [spouses[0].officerA, spouses[0].officerB].sort();
    expect(ids).toEqual(['ai-a', 'ai-b']); // the AI pair, not the player's
  });
});
