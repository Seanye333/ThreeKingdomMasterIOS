import { describe, it, expect } from 'vitest';
import { HISTORICAL_EVENTS } from './events';

/**
 * 同名事件必須互斥 — 一場名場面在同一局裡不能演兩次。
 *
 * 155 個事件裡有五組同名的(三顧茅廬、白馬斬顏良、三英戰呂布、馬躍檀溪、
 * 揮淚斬馬謖),成因都一樣:先寫了一個獨立事件,後來又寫了一個帶選項的
 * 加強版/鏈版,兩份都留在檔案裡。街亭那組當初有好好處理(舊版加
 * `flag-unset: jieting-chain-started`,註解寫明 superseded);其餘三組沒有,
 * 於是同一局會在虎牢關前打兩次三英、斬兩次顏良、躍兩次檀溪。
 *
 * 更糟的是三顧茅廬:簡述版的條件寫成 `flag-set: maolu-abandoned` —— 玩家在
 * 鏈裡明白選了「罷了,天下何處無賢才」,系統反手把諸葛亮送上門,**把玩家的
 * 選擇整個抹掉**。
 *
 * 所以這條測試釘的不是「不准同名」(同名的簡述版是有用的:給沒走過該鏈的
 * 盤用),而是**同名的任兩個事件之間必須有旗標互斥**。
 */
describe('同名事件互斥', () => {
  const byName = new Map<string, typeof HISTORICAL_EVENTS>();
  for (const e of HISTORICAL_EVENTS) {
    const k = e.name.zh;
    if (!byName.has(k)) byName.set(k, [] as unknown as typeof HISTORICAL_EVENTS);
    (byName.get(k) as unknown as Array<typeof e>).push(e);
  }
  const groups = [...byName.entries()].filter(([, v]) => v.length > 1);

  it('has same-name groups worth guarding (otherwise this test is dead weight)', () => {
    expect(groups.length).toBeGreaterThan(0);
  });

  it.each(groups.map(([name]) => name))('%s — every pair is mutually exclusive by flag', (name) => {
    const es = byName.get(name)!;
    const flagsSet = (e: (typeof HISTORICAL_EVENTS)[number]) => new Set([
      ...(e.effects ?? []).filter((f) => f.kind === 'flag').map((f) => (f as { key: string }).key),
      ...((e as { choices?: Array<{ effects?: Array<{ kind: string; key?: string }> }> }).choices ?? [])
        .flatMap((c) => (c.effects ?? []).filter((f) => f.kind === 'flag').map((f) => f.key!)),
    ]);
    const flagsUnsetRequired = (e: (typeof HISTORICAL_EVENTS)[number]) => new Set(
      (e.requires ?? []).filter((r) => r.kind === 'flag-unset').map((r) => (r as { key: string }).key),
    );
    const flagsSetRequired = (e: (typeof HISTORICAL_EVENTS)[number]) => new Set(
      (e.requires ?? []).filter((r) => r.kind === 'flag-set').map((r) => (r as { key: string }).key),
    );

    /*
     * 鏈上的互斥 — 街亭那組不是直接互斥的:`evt-jieting-ma-su` 要求
     * `jieting-chain-started` 未設,而那個旗標是**鏈的第一步**設的,不是同名
     * 的 `evt-jieting-2` 設的。所以把前一步也算進來:一個事件所「屬於的鏈」
     * = 它自己設的旗標,加上任何「設了它所要求旗標」的事件所設的旗標。
     * (只追一跳就夠 —— 現有的鏈都不超過三步,而多追會讓互斥判定過於寬鬆。)
     */
    const chainFlags = (e: (typeof HISTORICAL_EVENTS)[number]) => {
      const out = flagsSet(e);
      for (const need of flagsSetRequired(e)) {
        for (const other of HISTORICAL_EVENTS) {
          if (other === e) continue;
          if (flagsSet(other).has(need)) for (const f of flagsSet(other)) out.add(f);
        }
      }
      return out;
    };

    for (let i = 0; i < es.length; i++) {
      for (let j = i + 1; j < es.length; j++) {
        const a = es[i], b = es[j];
        // 互斥的兩種寫法:B 要求 A 的旗標未設(A 演過就不演 B),或反之;
        // 也接受 B 要求 A 的旗標**已**設(那是鏈,不是重複)。
        const aFlags = chainFlags(a), bFlags = chainFlags(b);
        const exclusive =
          [...flagsUnsetRequired(b)].some((k) => aFlags.has(k))
          || [...flagsUnsetRequired(a)].some((k) => bFlags.has(k))
          || [...flagsSetRequired(b)].some((k) => aFlags.has(k))
          || [...flagsSetRequired(a)].some((k) => bFlags.has(k));
        expect(
          exclusive,
          `${a.id} 與 ${b.id} 同名「${name}」卻沒有旗標互斥 —— 同一局會演兩次。`
          + `做法見 evt-jieting-ma-su:替後來的加強版留 flag-unset。`,
        ).toBe(true);
      }
    }
  });

  /** 三顧茅廬那個 bug 的專屬守衛:簡述版不可以在玩家「明白拒絕」之後補送。 */
  it('the short 三顧茅廬 never fires after the player walked away', () => {
    const short = HISTORICAL_EVENTS.find((e) => e.id === 'evt-three-visits-to-thatched-cottage')!;
    const req = short.requires ?? [];
    expect(
      req.some((r) => r.kind === 'flag-unset' && (r as { key: string }).key === 'maolu-abandoned'),
      '簡述版必須要求 maolu-abandoned 未設 —— 否則玩家選了放棄,系統照樣把諸葛亮送上門。',
    ).toBe(true);
    expect(
      req.some((r) => r.kind === 'flag-set' && (r as { key: string }).key === 'maolu-abandoned'),
      '不可以要求 maolu-abandoned 已設(那正是原本的 bug)。',
    ).toBe(false);
  });
});
