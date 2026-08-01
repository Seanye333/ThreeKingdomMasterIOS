import { describe, it, expect } from 'vitest';
import { SCENARIO_ERA_OFFSET, eraOffsetFor, formatEraYear, formatScenarioYear } from './era';
import { SCENARIOS } from './scenarios';

/**
 * 紀年 — the display layer over the engine's shared positive timeline.
 *
 * The bug this guards against is not subtle but it IS invisible to every other
 * test: the Warring States and Sui-Tang boards all start at internal year 178
 * (deliberately — see `era.ts` and the `historicalLifespans.ts` header), and
 * the UI printed that raw. A player picking 「戰國·長平之戰」 was told it was
 * 178 AD. Long Ping was 260 BC.
 */
describe('紀年 (era display)', () => {
  it('formats AD years plainly and BC years with no year zero', () => {
    expect(formatEraYear(184, 0, 'zh')).toBe('184 年');
    expect(formatEraYear(184, 0, 'en')).toBe('184 AD');
    // 長平: internal 178 + offset → 260 BC
    expect(formatEraYear(178, -260 - 178, 'zh')).toBe('前 260 年');
    expect(formatEraYear(178, -260 - 178, 'en')).toBe('260 BC');
    // 偏移用史實慣例(−260 就是前 260 年,不是天文紀年的 −260)。這一條是
    // 第一版寫錯的地方:兩套慣例差一年,長平當時顯示成「前 261 年」。
    expect(formatEraYear(178, -179, 'zh')).toBe('前 1 年');
    expect(formatEraYear(178, -180, 'zh')).toBe('前 2 年');
    // 0 不該由正確的偏移產生;真出現時當前 1 年,讓函式是全函數。
    expect(formatEraYear(178, -178, 'zh')).toBe('前 1 年');
  });

  it('advances the displayed year with the campaign, not just the start', () => {
    const off = -260 - 178;            // 長平
    expect(formatEraYear(178, off, 'zh')).toBe('前 260 年');
    expect(formatEraYear(188, off, 'zh')).toBe('前 250 年');   // ten years on
  });

  it('leaves Three Kingdoms boards untouched (offset 0)', () => {
    for (const s of SCENARIOS) {
      if (s.id.startsWith('scn-ws-') || s.id.startsWith('scn-ch-') || s.id.startsWith('scn-st-')) continue;
      expect(eraOffsetFor(s.id), `${s.id} should have no era offset`).toBe(0);
      expect(formatScenarioYear(s.startDate.year, s.id, 'en')).toBe(`${s.startDate.year} AD`);
    }
  });

  /**
   * 每一個跨代盤都必須有偏移 —— 少一個就是那個盤在畫面上宣稱自己是 178 年。
   * 這條也擋「加了新的戰國/楚漢/隋唐劇本卻忘了登記」。
   */
  it('gives every cross-era board an offset', () => {
    const cross = SCENARIOS.filter((s) => /^scn-(ws|ch|st)-/.test(s.id));
    expect(cross.length).toBeGreaterThan(20);
    for (const s of cross) {
      expect(SCENARIO_ERA_OFFSET[s.id], `${s.id} (${s.name.zh}) has no era offset`).toBeDefined();
    }
  });

  it('has no offsets pointing at scenarios that no longer exist', () => {
    const ids = new Set(SCENARIOS.map((s) => s.id));
    for (const id of Object.keys(SCENARIO_ERA_OFFSET)) {
      expect(ids.has(id), `era offset for unknown scenario ${id}`).toBe(true);
    }
  });

  /** 每個盤換算出來的年份要落在它那個時代裡,而不只是「有個偏移」。 */
  it('lands each board in its actual era', () => {
    const era = (id: string) => formatScenarioYear(178, id, 'en');
    expect(era('scn-ws-changping')).toBe('260 BC');
    expect(era('scn-ws-qin-unify')).toBe('230 BC');
    expect(era('scn-ch-gaixia')).toBe('202 BC');
    expect(era('scn-ch-daze')).toBe('209 BC');
    expect(era('scn-st-suiend')).toBe('617 AD');
    expect(era('scn-st-anshi')).toBe('755 AD');

    const yearOf = (id: string) => 178 + eraOffsetFor(id);
    for (const s of SCENARIOS) {
      const y = yearOf(s.id);
      if (s.id.startsWith('scn-ws-')) expect(y, s.id).toBeLessThan(-220);      // 戰國
      if (s.id.startsWith('scn-ch-')) expect(y, s.id).toBeGreaterThan(-210);   // 楚漢
      if (s.id.startsWith('scn-ch-')) expect(y, s.id).toBeLessThan(-200);
      if (s.id.startsWith('scn-st-')) expect(y, s.id).toBeGreaterThan(600);    // 隋唐
    }
  });
});
