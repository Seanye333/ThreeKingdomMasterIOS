import { describe, it, expect } from 'vitest';
import { SCENARIO_VERDICTS, SHARED_DEFEATS, scenarioVerdict } from './scenarioVerdicts';
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
   * 全庫 540 段敗亡於 2026-08-09 補滿(逐盤 + 共享兩層合計)。這條把它釘住:
   * **加新盤或給既有盤加一家,忘了寫敗亡就會紅。**
   * 紅了不是壞事,是提醒 —— 兩條路可選:逐盤寫進 SCENARIO_VERDICTS,
   * 或者(周邊勢力/只活在一個十年裡的家)加進 SHARED_DEFEATS。
   */
  it('全庫每一盤每一家都有敗亡變體', () => {
    const gaps: string[] = [];
    for (const sc of SCENARIOS) {
      for (const f of sc.forces) {
        if (!scenarioVerdict(sc.id, f.id)?.defeat) gaps.push(`${sc.name.zh}/${f.name.zh}(${sc.id}/${f.id})`);
      }
    }
    expect(gaps).toEqual([]);
  });

  /* ── 共享敗亡層(2026-08-09)────────────────────────────────────────── */

  it('周邊勢力吃得到共享敗亡 —— 沒逐盤寫也有自己的輓歌', () => {
    // 馬騰在 15 張盤上都沒有逐盤的敗亡變體
    const v = scenarioVerdict('scn-198-xiapi', 'ma-teng');
    expect(v?.defeat?.titleZh).toBe(SHARED_DEFEATS['sg:ma-teng'].titleZh);
  });

  it('盤上寫過的專屬敗亡永遠優先於共享層', () => {
    // 挑一個既在共享層裡、又在某張盤上逐盤寫過的家
    const pair = Object.entries(SCENARIO_VERDICTS).flatMap(([sid, byForce]) =>
      Object.entries(byForce)
        .filter(([fid, v]) => v.defeat && SHARED_DEFEATS[`${sid.startsWith('scn-ws-') ? 'ws' : sid.startsWith('scn-ch-') ? 'ch' : sid.startsWith('scn-st-') ? 'st' : 'sg'}:${fid}`])
        .map(([fid, v]) => ({ sid, fid, own: v.defeat! })),
    )[0];
    expect(pair, '沒有任何一家同時有專屬與共享敗亡 —— 這條測試就測不到東西了').toBeTruthy();
    const got = scenarioVerdict(pair.sid, pair.fid);
    expect(got?.defeat?.titleZh).toBe(pair.own.titleZh);
  });

  /*
   * ⚠ 分路線是這一層的必要條件,不是裝飾:`qi`/`zhao`/`wei`/`chu` 這四個
   * forceId **戰國與楚漢兩條線都在用**,而戰國的齊(田氏之齊)跟楚漢的齊
   * (田榮田橫)不是同一個國家。只按 forceId 共享會把田橫五百人蹈海貼到
   * 齊王建身上。
   */
  it('同一個 forceId 在不同路線上拿到不同的敗亡', () => {
    const ws = scenarioVerdict('scn-ws-changping', 'qi')?.defeat?.titleZh;
    const ch = scenarioVerdict('scn-ch-chuhan', 'qi')?.defeat?.titleZh;
    expect(ws).toBeTruthy();
    expect(ch).toBeTruthy();
    expect(ws).not.toBe(ch);
  });

  it('共享的只有敗亡,論曰不跨盤搬', () => {
    for (const d of Object.values(SHARED_DEFEATS)) {
      expect(d.titleZh && d.titleEn && d.textZh && d.textEn).toBeTruthy();
    }
    // 一個只吃共享層的家:有 defeat,但不該憑空多出論曰
    const v = scenarioVerdict('scn-198-xiapi', 'ma-teng');
    expect(v?.defeat).toBeTruthy();
    expect(v?.verdictZh).toBeUndefined();
    expect(v?.verdictLostZh).toBeUndefined();
  });

  /*
   * 沒寫過的盤照舊走通用結局 —— 這是刻意的,別讓它變成空白。
   *
   * (2026-08-09 加了共享層之後這條仍然成立,因為 `cao` 是**主要勢力**,
   *  刻意沒放進 SHARED_DEFEATS —— 曹操軍在不同盤上的敗法真的不一樣。)
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
