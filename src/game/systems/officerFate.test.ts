/** 在野招攬 — 良禽擇木 (doctrine fit) + 名品禮聘 (gift value). */
import { describe, expect, it } from 'vitest';
import type { Force } from '../types';
import type { Item } from '../data/items';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { doctrineRecruitFit, giftRecruitValue, estimateRecruitChance, freeAgentRecruitOdds, attemptFreeAgentRecruit } from './officerFate';

const force = (over: Partial<Force> = {}): Force =>
  ({ id: 'f', name: { zh: 'f', en: 'f' }, rulerOfficerId: 'lord', capitalCityId: 'c', color: '#888', isPlayer: false, imperialRank: 'commoner', recruitmentStance: 'balanced', ...over } as Force);

describe('doctrineRecruitFit — 良禽擇木', () => {
  it('王道之士 favours a benevolent lord, spurns a brute', () => {
    const royal = mkOfficer({ id: 'r', doctrine: 'royal' as never });
    const kind = mkOfficer({ id: 'k', stats: { charisma: 90 } as never });
    const brute = mkOfficer({ id: 'b', stats: { charisma: 45 } as never });
    expect(doctrineRecruitFit(royal, kind, force(), 3).delta).toBeGreaterThan(0);
    const spurn = doctrineRecruitFit(royal, brute, force(), 3);
    expect(spurn.delta).toBeLessThan(0);
    expect(spurn.reasonZh).toBeTruthy();
  });

  it('霸道之士 follows the strong', () => {
    const hege = mkOfficer({ id: 'h', doctrine: 'hegemonic' as never });
    const strong = mkOfficer({ id: 's', stats: { war: 92, leadership: 88 } as never });
    expect(doctrineRecruitFit(hege, strong, force(), 3).delta).toBeGreaterThan(0);
  });

  it('割據之雄 will not serve anyone', () => {
    const warlord = mkOfficer({ id: 'w', doctrine: 'separatist' as never });
    const lord = mkOfficer({ id: 'l', stats: { charisma: 90, war: 90 } as never });
    expect(doctrineRecruitFit(warlord, lord, force(), 9).delta).toBeLessThan(0);
  });
});

describe('giftRecruitValue — 名品禮聘', () => {
  const goldWeapon = { id: 'gw', name: { zh: '神兵', en: 'Divine Arm' }, kind: 'weapon', effects: { war: 22 } } as unknown as Item;
  const bronzeTrinket = { id: 'bt', name: { zh: '小物', en: 'Trinket' }, kind: 'treasure', effects: { politics: 3 } } as unknown as Item;

  it('a rare, fitting gift sways more than a trinket', () => {
    const warrior = mkOfficer({ id: 'g', stats: { war: 90 } as never });
    expect(giftRecruitValue(goldWeapon, warrior)).toBeGreaterThan(giftRecruitValue(bronzeTrinket, warrior));
  });

  it('is capped at +0.20', () => {
    const warrior = mkOfficer({ id: 'g2', stats: { war: 95 } as never });
    expect(giftRecruitValue(goldWeapon, warrior)).toBeLessThanOrEqual(0.20);
  });
});

describe('estimateRecruitChance — captive 良禽擇木 / 舊部 / 復仇 / 報恩', () => {
  const city = { id: 'c', name: { zh: '城', en: 'City' } } as unknown as City;
  const lord = mkOfficer({ id: 'lord', stats: { charisma: 70 } as never });
  const base = (over = {}) => ({
    officer: mkOfficer({ id: 'cap', loyalty: 50, ...over }),
    city, recruiterForce: force(), recruiterRuler: lord,
    recruiterReputation: { citiesOwned: 3 }, approach: 'righteous' as const,
  });

  it('誓不事仇 — slaying their kin makes them nearly unrecruitable', () => {
    const normal = estimateRecruitChance(base());
    const vengeful = estimateRecruitChance(base({ killedRelativesBy: { kin: 'f' } }));
    expect(vengeful).toBeLessThan(normal - 0.3);
  });

  it('舊部歸心 — a captured former retainer is far easier to win back', () => {
    const normal = estimateRecruitChance(base());
    const retainer = estimateRecruitChance(base({ retinueOfLordId: 'lord' }));
    expect(retainer).toBeGreaterThan(normal + 0.2);
  });

  it('報恩 — one you once freed honourably inclines back', () => {
    const normal = estimateRecruitChance(base());
    const grateful = estimateRecruitChance(base({ freedByForceId: 'f' }));
    expect(grateful).toBeGreaterThan(normal);
  });
});

/**
 * 預覽即擲骰 — the odds the screen quotes must be the odds the attempt rolls
 * against. This is a regression fence, not a nicety: the old
 * `previewRecruitChance` was a hand-copied subset that had silently drifted to
 * ignore 宿怨/舊部/報恩/主義/薦保/賄賂, so anything built on it would have
 * promised the player numbers the engine never honoured. The seam is now
 * single (`freeAgentRecruitOdds`), and these tests hold it single.
 */
describe('freeAgentRecruitOdds — 訪賢勝算與實際擲骰同源', () => {
  const city = { id: 'c', name: { zh: '城', en: 'City' }, gold: 5000 } as unknown as City;
  // A middling lord with one city: the odds must sit well clear of the 0.95
  // clamp, or every "this bonus helps" assertion silently compares 0.95 to 0.95.
  const lord = mkOfficer({ id: 'lord', stats: { charisma: 30 } as never });
  const base = (over: Record<string, unknown> = {}) => ({
    officer: mkOfficer({ id: 'agent', status: 'idle' as const, forceId: null, loyalty: 50, ...over }),
    city,
    recruiterForce: force(),
    recruiterRuler: lord,
    recruiterReputation: { citiesOwned: 1 },
    family: [],
    free: true,
  });

  it('the quoted chance is the threshold the roll actually uses', () => {
    const input = base();
    const { chance } = freeAgentRecruitOdds(input);
    // Just under the quoted odds must succeed; just over must fail. If the
    // attempt ever grows a term the preview lacks, one of these flips.
    expect(attemptFreeAgentRecruit({ ...input, rng: () => chance - 0.001 }).ok).toBe(true);
    expect(attemptFreeAgentRecruit({ ...input, rng: () => chance + 0.001 }).ok).toBe(false);
  });

  it('every escalation the UI offers moves the quoted number', () => {
    const plain = freeAgentRecruitOdds(base()).chance;
    expect(freeAgentRecruitOdds({ ...base(), debateWon: true }).chance).toBeGreaterThan(plain);
    expect(freeAgentRecruitOdds({ ...base(), bribeBonus: 0.25 }).chance).toBeGreaterThan(plain);
    expect(freeAgentRecruitOdds({ ...base(), giftBonus: 0.2 }).chance).toBeGreaterThan(plain);
    expect(freeAgentRecruitOdds({ ...base(), persistenceBonus: 0.2 }).chance).toBeGreaterThan(plain);
    expect(freeAgentRecruitOdds({ ...base(), recommendedBonus: 0.15 }).chance).toBeGreaterThan(plain);
  });

  it('報恩 — one you freed honourably is warmer, and the preview says so', () => {
    const plain = freeAgentRecruitOdds(base()).chance;
    const grateful = freeAgentRecruitOdds(base({ freedByForceId: 'f' })).chance;
    expect(grateful).toBeGreaterThan(plain);
  });

  it('a refusal reason is offered before the attempt, not only after', () => {
    // 'noble' is the simplest cold-reason path that needs no relationship state.
    const proud = freeAgentRecruitOdds(base({ traits: ['noble'] }));
    expect(proud.reasonZh).toBeTruthy();
    expect(proud.reasonEn).toBeTruthy();
  });
});
