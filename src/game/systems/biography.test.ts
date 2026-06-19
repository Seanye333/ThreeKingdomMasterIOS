/** 武將列傳 — locks the historian's pen. */
import { describe, expect, it } from 'vitest';
import type { HistoricBattle } from '../types';
import { createDeeds } from '../types/deeds';
import { mkOfficer } from '../../test/factories';
import { composeBiography, signatureBattle } from './biography';

const guanYu = mkOfficer({ id: 'guan-yu', stats: { war: 97, leadership: 95, intelligence: 75 } });

const battle = (over: Partial<HistoricBattle>): HistoricBattle =>
  ({
    id: 'b1', cityId: 'xiapi', date: { year: 200, season: 'spring' },
    attacker: { forceId: 'cao', commanderId: 'guan-yu', companionIds: [], troops: 20000, bondBonus: 0, blendedStat: 90, power: 1 },
    defender: { forceId: 'yuan', commanderId: 'yan-liang', companionIds: [], troops: 30000, bondBonus: 0, blendedStat: 80, power: 1 },
    cityDefense: 50, defenseFactor: 1.3, attackerWins: true, cityFalls: true,
    attackerLosses: 2000, defenderLosses: 9000,
    ...over,
  } as HistoricBattle);

describe('signatureBattle', () => {
  it('picks the biggest battle they commanded AND won', () => {
    const small = battle({ id: 's', attacker: { ...battle({}).attacker, troops: 5000 } });
    const lost = battle({ id: 'l', attackerWins: false });
    const big = battle({ id: 'big' });
    expect(signatureBattle('guan-yu', [small, lost, big])?.id).toBe('big');
    expect(signatureBattle('nobody', [big])).toBeNull();
  });
});

describe('composeBiography', () => {
  it('opens with the archetype and writes the battle record', () => {
    const deeds = { ...createDeeds('guan-yu'), battlesWon: 7, battlesLost: 2, duelsWon: 3, killsTroops: 12000, citiesTaken: 2, titles: ['萬人敵'] };
    const bio = composeBiography({
      officer: guanYu, deeds, battleHistory: [battle({})],
      forceNameZh: '曹操軍', cityNameZhById: { xiapi: '下邳' },
    });
    const zh = bio.map((p) => p.zh).join('');
    expect(zh).toContain('萬夫不當之勇');
    expect(zh).toContain('歷戰9場,勝7');
    expect(zh).toContain('單挑勝3陣');
    expect(zh).toContain('下邳之役');
    expect(zh).toContain('萬人敵');
  });

  it('an unknown gets the historians-waiting line', () => {
    const bio = composeBiography({
      officer: mkOfficer({ stats: { war: 60 } }), deeds: createDeeds('x'), battleHistory: [],
      forceNameZh: null,
    });
    expect(bio.some((p) => p.zh.includes('列傳俟後人補之'))).toBe(true);
  });
});
