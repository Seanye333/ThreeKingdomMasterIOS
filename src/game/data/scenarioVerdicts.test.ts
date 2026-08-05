import { describe, it, expect } from 'vitest';
import { SCENARIO_VERDICTS, scenarioVerdict } from './scenarioVerdicts';
import { SCENARIOS } from './scenarios';
import { checkEndings } from '../systems/endings';
import type { City, Force, Officer, EntityId } from '../types';

/**
 * 落幕文本的接線測試。
 *
 * 這種資料最典型的壞法是**無聲失效**:勢力 id 打成 'zhu-jun' 而盤上叫 'zhujun',
 * 於是 `scenarioVerdict()` 回 null,遊戲照常跑、照常結束,只是玩家永遠讀到通用
 * 的那段輓歌 —— 沒有例外、沒有紅字,只有一段沒人看得到的文字躺在檔案裡。
 * (`endings.ts` 的五段敗亡輓歌就這樣躺了很久:UI 只在勝利時掛 EndingsModal。)
 */
describe('戰役落幕文本(敗亡變體 / 史官論曰)', () => {
  it('every scenario id in the table is a real board', () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    for (const id of Object.keys(SCENARIO_VERDICTS)) {
      expect(ids.has(id), `${id} 不是任何一個劇本的 id`).toBe(true);
    }
  });

  it('every force id in the table is a real force on that board', () => {
    for (const [sid, byForce] of Object.entries(SCENARIO_VERDICTS)) {
      const board = SCENARIOS.find((s) => s.id === sid)!;
      const forceIds = new Set(board.forces.map((f) => f.id));
      for (const fid of Object.keys(byForce)) {
        expect(
          forceIds.has(fid),
          `${sid} 沒有叫 ${fid} 的勢力(盤上是:${[...forceIds].join(', ')})`,
        ).toBe(true);
      }
    }
  });

  /** 有寫的盤要寫齊 —— 五家裡漏一家,那一家的玩家就掉回通用文本。 */
  it('scn-184-yellow-turban covers all five forces', () => {
    const board = SCENARIOS.find((s) => s.id === 'scn-184-yellow-turban')!;
    for (const f of board.forces) {
      const v = scenarioVerdict(board.id, f.id);
      expect(v, `${f.name.zh} 沒有落幕文本`).toBeTruthy();
      expect(v!.defeat, `${f.name.zh} 沒有敗亡變體`).toBeTruthy();
      expect(v!.verdictZh, `${f.name.zh} 沒有功成論曰`).toBeTruthy();
      expect(v!.verdictLostZh, `${f.name.zh} 沒有敗亡論曰`).toBeTruthy();
    }
  });

  /** 端到端:亡國的張角讀到的是黃巾自己的輓歌,不是「昔劉備數失城郭」。 */
  it('a landless player gets the board-specific elegy, not the generic one', () => {
    const forces: Record<EntityId, Force> = {
      'yellow-turban': {
        id: 'yellow-turban',
        name: { en: 'Yellow Turbans', zh: '黃巾' },
        rulerOfficerId: 'zhang-jiao',
        capitalCityId: 'ye',
        color: '#a88a2a',
        isPlayer: true,
      } as Force,
      han: { id: 'han', name: { en: 'Han', zh: '漢室' }, rulerOfficerId: 'lu-zhi', capitalCityId: 'luoyang', color: '#f0d878', isPlayer: false } as Force,
    };
    const officers: Record<EntityId, Officer> = {
      'zhang-jiao': { id: 'zhang-jiao', forceId: 'yellow-turban', status: 'idle' } as Officer,
    };
    // 一座城,握在別人手裡 → playerCities === 0 → defeat
    const cities: Record<EntityId, City> = {
      luoyang: { id: 'luoyang', ownerForceId: 'han', troops: 100, loyalty: 50 } as City,
    };
    const ending = checkEndings({
      cities, officers, forces,
      playerForceId: 'yellow-turban',
      date: { year: 185, month: 3, phase: 0 } as never,
      scenarioId: 'scn-184-yellow-turban',
    });
    expect(ending?.kind).toBe('defeat');
    expect(ending?.titleZh).toBe('蒼天未死,黃天不立');
    expect(ending?.verdictZh).toContain('論曰');
    // 通用文本的招牌句不該出現
    expect(ending?.textZh).not.toContain('劉備');
  });

  /*
   * 沒寫過的盤照舊走通用結局 —— 這是刻意的,別讓它變成空白。
   *
   * scenarioId 用一個**不存在的假 id**,不是隨手挑一張真盤:原本這裡寫的是
   * scn-190-anti-dong-zhuo,而 190 一寫上落幕文本,這條測試就紅了 ——
   * 它測的是「查不到就退回通用」這條路,不是那張盤。假 id 永遠不會被寫上,
   * 於是這條測試也永遠不會因為別人做了他該做的事而失敗。
   */
  it('boards without a verdict fall back to the generic ending', () => {
    const forces: Record<EntityId, Force> = {
      cao: { id: 'cao', name: { en: 'Cao', zh: '曹操軍' }, rulerOfficerId: 'cao-cao', capitalCityId: 'xuchang', color: '#3a7dd9', isPlayer: true } as Force,
      x: { id: 'x', name: { en: 'X', zh: 'X' }, rulerOfficerId: 'x', capitalCityId: 'ye', color: '#fff', isPlayer: false } as Force,
    };
    const ending = checkEndings({
      cities: { ye: { id: 'ye', ownerForceId: 'x', troops: 10, loyalty: 50 } as City },
      officers: { 'cao-cao': { id: 'cao-cao', forceId: 'cao', status: 'idle' } as Officer },
      forces,
      playerForceId: 'cao',
      date: { year: 200, month: 1, phase: 0 } as never,
      scenarioId: 'scn-verdictless-fixture',
    });
    expect(ending?.kind).toBe('defeat');
    expect(ending?.titleZh).toBe('流亡天涯');
    expect(ending?.verdictZh).toBeUndefined();
  });
});
