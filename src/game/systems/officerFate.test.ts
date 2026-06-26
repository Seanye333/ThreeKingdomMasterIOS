/** 在野招攬 — 良禽擇木 (doctrine fit) + 名品禮聘 (gift value). */
import { describe, expect, it } from 'vitest';
import type { Force } from '../types';
import type { Item } from '../data/items';
import type { City } from '../types';
import { mkOfficer } from '../../test/factories';
import { doctrineRecruitFit, giftRecruitValue, estimateRecruitChance } from './officerFate';

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

  it('覇道之士 follows the strong', () => {
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
