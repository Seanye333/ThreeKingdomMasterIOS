import { describe, it, expect } from 'vitest';
import {
  SHIP_CLASSES_BY_ID,
  SHIP_MIN_TIER,
  shipMeetsTier,
  shipBuildSeasons,
  portUpgradeCost,
  portMaxHpForTier,
  PORT_MAX_NAVAL_TIER,
} from './ships';

describe('naval tier (水軍養成)', () => {
  it('every ship class has a tier requirement and is buildable at tier 3', () => {
    for (const id of Object.keys(SHIP_MIN_TIER) as Array<keyof typeof SHIP_MIN_TIER>) {
      expect(SHIP_CLASSES_BY_ID[id], id).toBeTruthy();
      expect(shipMeetsTier(id, 3)).toBe(true);
    }
  });

  it('heavy hulls (樓船/大翼) are gated behind higher tiers', () => {
    expect(shipMeetsTier('warship', 1)).toBe(true);   // 艨艟 at any dockyard
    expect(shipMeetsTier('flagship', 1)).toBe(false); // 樓船 needs tier 2
    expect(shipMeetsTier('flagship', 2)).toBe(true);
    expect(shipMeetsTier('da-yi', 2)).toBe(false);    // 大翼 needs tier 3
    expect(shipMeetsTier('da-yi', 3)).toBe(true);
  });

  it('higher tiers shorten build time but never below one season', () => {
    const warship = SHIP_CLASSES_BY_ID['warship']; // 3 seasons base
    expect(shipBuildSeasons(warship, 1)).toBe(3);
    expect(shipBuildSeasons(warship, 2)).toBe(2);
    expect(shipBuildSeasons(warship, 3)).toBe(1);
    const transport = SHIP_CLASSES_BY_ID['transport']; // 2 seasons base
    expect(shipBuildSeasons(transport, 3)).toBe(1); // floored at 1
  });

  it('upgrade cost rises per tier and is zero when maxed', () => {
    expect(portUpgradeCost(1)).toBe(600);
    expect(portUpgradeCost(2)).toBe(1500);
    expect(portUpgradeCost(PORT_MAX_NAVAL_TIER)).toBe(0);
  });

  it('maxHp scales with tier', () => {
    expect(portMaxHpForTier(1000, 1)).toBe(1000);
    expect(portMaxHpForTier(1000, 2)).toBe(1400);
    expect(portMaxHpForTier(1000, 3)).toBe(1800);
  });
});
