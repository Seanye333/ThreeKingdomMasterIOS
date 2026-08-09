import { describe, it, expect } from 'vitest';
import { HISTORICAL_EVENTS } from './events';
import { OFFICER_IDS, TALENT_POOL_IDS } from './index';
import { HISTORICAL_OFFICER_TEMPLATES } from './historicalOfficers';
import { buildInitialCities } from './cities';

describe('historical event catalog integrity', () => {
  /*
   * 外傳三線(戰國/楚漢/隋唐)的人不在三國名冊裡 —— 他們在
   * `historicalOfficers.ts`。垓下、大澤鄉、虎牢那幾條事件鏈引用的是那一批。
   */
  const known = new Set([
    ...OFFICER_IDS, ...TALENT_POOL_IDS,
    ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id),
  ]);

  it('event ids are unique', () => {
    const ids = HISTORICAL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every referenced officer id exists', () => {
    // ⚠ 這條原本只掃 requires 與頂層 effects —— **choices 裡的 officerId
    //   一直沒查**,而抉擇型事件的效果全在 choices 裡。同 cityId 那條的成因。
    const bad: string[] = [];
    const chk = (id: string | undefined, where: string) => {
      if (id && !known.has(id)) bad.push(where + ' → ' + id);
    };
    for (const e of HISTORICAL_EVENTS) {
      for (const r of e.requires ?? []) if ('officerId' in r) chk(r.officerId, `${e.id} requires`);
      const scan = (fs: typeof e.effects, where: string) => {
        for (const f of fs) {
          if ('officerId' in f) chk(f.officerId, where);
          if ('rulerOfficerId' in f) chk(f.rulerOfficerId, where + ' ruler');
        }
      };
      scan(e.effects, `${e.id} effect`);
      chk(e.chooserRulerId, `${e.id} chooser`);
      for (const c of e.choices ?? []) scan(c.effects, `${e.id} choice ${c.id}`);
    }
    expect(bad).toEqual([]);
  });

  /*
   * 為什麼補這一條:officerId 從一開始就查,cityId **從來沒查過** —— 而
   * cityId 是個裸 string,寫錯了 `tsc` 不會紅、事件照樣「觸發」,只是那條
   * 效果落在一座不存在的城上,靜默蒸發。2026-08-09 補後三國事件時一次就寫
   * 錯了兩個(`chang-an` 其實叫 `changan`、`yecheng` 其實叫 `ye`),兩條都
   * 通過了 build 和當時的全部測試。
   */
  it('every referenced city id exists', () => {
    const cityIds = new Set(buildInitialCities({}).map((c) => c.id));
    const bad: string[] = [];
    for (const e of HISTORICAL_EVENTS) {
      const check = (o: unknown, where: string) => {
        if (o && typeof o === 'object' && 'cityId' in o) {
          const id = (o as { cityId?: string }).cityId;
          if (id && !cityIds.has(id)) bad.push(`${e.id} ${where} → ${id}`);
        }
      };
      for (const r of e.requires ?? []) check(r, 'requires');
      for (const f of e.effects) check(f, 'effect');
      for (const c of e.choices ?? []) for (const f of c.effects) check(f, `choice ${c.id}`);
    }
    expect(bad).toEqual([]);
  });

  /*
   * 中文正文裡混進西里爾/諺文 —— 2026-08-09 一天犯了兩次:
   * 「融не能戰」(西里爾 не)、「以此愧見닌下」(諺文 닌,本該是「陛」)。
   * 兩次都通過了 build 與全部測試,因為它們在字串裡,型別看不出來;
   * 而畫面上就是一個看不懂的字。
   *
   * 片假名中點「・」是刻意的標題分隔符(雞肋・楊修之死),放行。
   */
  it('中文正文沒有混進西里爾或諺文', () => {
    const bad: string[] = [];
    const suspicious = /[Ѐ-ӿ가-힯぀-ヺー-ヿ]/;
    const scan = (s: string | undefined, where: string) => {
      if (s && suspicious.test(s)) bad.push(`${where}: ${s.match(new RegExp(suspicious, 'g'))?.join('')}`);
    };
    for (const e of HISTORICAL_EVENTS) {
      scan(e.name.zh, `${e.id} name`);
      scan(e.descriptionZh, `${e.id} desc`);
      for (const c of e.choices ?? []) scan(c.label.zh, `${e.id} choice ${c.id}`);
    }
    expect(bad).toEqual([]);
  });

  it('year windows are sane', () => {
    for (const e of HISTORICAL_EVENTS) {
      expect(e.yearMin, e.id).toBeLessThanOrEqual(e.yearMax);
      /*
       * 下限是 178 而不是 184 —— **外傳三線借三國的曆法軸**(`startDate.year`
       * 都是 178),於是垓下、大澤鄉、虎牢那幾條鏈的窗口從 178 起算。
       * 它們不靠年份鎖住自己,靠的是「只有那條線才有的人」當守衛。
       */
      expect(e.yearMin, e.id).toBeGreaterThanOrEqual(178);
      expect(e.yearMax, e.id).toBeLessThanOrEqual(290);
    }
  });

  it('the six new 列傳 icons are present', () => {
    /*
     * evt-three-heroes-lu-bu → evt-sanying-lubu:虎牢關那一場原本在事件表裡
     * 有兩條,名字一字不差,互斥只做了一半(呂布負傷時後者先演,旗標沒設,
     * 傷癒後前者再演一次)。2026-08 併成一條,保留 evt-sanying-lubu 並收下
     * 另一條的效果與旗標。這裡跟著改指向存活的那個 id。
     */
    const ids = new Set(HISTORICAL_EVENTS.map((e) => e.id));
    for (const id of ['evt-warm-wine-hua-xiong', 'evt-sanying-lubu', 'evt-dingjunshan', 'evt-jieting-ma-su', 'evt-scraping-bone', 'evt-single-blade-meeting']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
