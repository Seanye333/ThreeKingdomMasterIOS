/**
 * 事件覆蓋體檢 —— **每一張盤,實際演得到幾條戲。**
 *
 * ## 為什麼要有它
 *
 * 六格規格的第③格原本用「這張盤有沒有宣告 `eventFlags`」來數,結果是 32/86,
 * 而那個數字**誤判了兩頭**:
 *
 *  - 三國歷史盤沒有 `eventFlags` 卻**不空** —— 全庫兩百餘條事件裡有一大批
 *    靠人物與年份就能落在它們身上。實測 231 鹵城盤 11 條(含隴上裝神割麥、
 *    上方谷、五丈原)、225 南征盤 14 條(含七擒孟獲、街亭、揮淚斬馬謖):
 *    它們的題眼**已經被共享事件演出來了**。
 *  - 外傳三線反過來:也沒有 `eventFlags`,而且是**真的一條都演不到**
 *    (2026-08-09 補之前,戰國 14 張 + 楚漢 4 張 + 隋唐 3 張全空)。
 *
 * 所以「有沒有旗標」量的是機制,不是內容。這支腳本直接量內容:讓 AI 自走,
 * 數 `pendingEvent` 實際跳出來幾條。這是③唯一誠實的判準。
 *
 * ⚠ 它比靜態掃描慢得多(每盤一輪 260 回合,全庫約 20–30 分鐘),所以
 * **不是每次改動都要跑**;它的位置是「動完事件表之後,拿一次全庫基線」。
 *
 * Run:
 *   node --import tsx scripts/event-coverage.ts            # 全庫
 *   node --import tsx scripts/event-coverage.ts scn-ws-    # 只跑某個前綴
 *   node --import tsx scripts/event-coverage.ts '' 200     # 自訂回合數
 */

// endSeason 的自動存檔會碰 localStorage;在 node 環境補一個。
const g = globalThis as unknown as { localStorage?: unknown };
if (!g.localStorage) {
  const mem = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
}

const PREFIX = process.argv[2] ?? '';
const TURNS = Number(process.argv[3] ?? 260);

async function main() {
  const { useGameStore } = await import('../src/game/state/store');
  const { SCENARIOS } = await import('../src/game/data/scenarios');
  const st = useGameStore;

  const rows: Array<{ id: string; zh: string; line: string; n: number; first: string[] }> = [];

  for (const scenario of SCENARIOS) {
    if (PREFIX && !scenario.id.startsWith(PREFIX)) continue;
    // 觀戰模式 —— 不能用 loadScenario(…, forces[0].id),那樣主角一兵不出。
    (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
      .observeScenario(scenario, 'normal');

    const seen: string[] = [];
    for (let t = 1; t <= TURNS; t++) {
      st.getState().endSeason();
      const s = st.getState();
      const pending = s.pendingEvent;
      if (!pending) continue;
      seen.push(pending.event.name.zh);
      // 選第一項 = 史實路線;不選會卡在 pending 每回合重觸發。
      const first = (pending.event as { choices?: Array<{ id: string }> }).choices?.[0];
      if (pending.awaitingChoice && first) s.resolveEventChoice?.(first.id);
      else s.dismissEvent?.();
    }
    const uniq = [...new Set(seen)];
    const line = /^scn-ws-/.test(scenario.id) ? '戰國'
      : /^scn-ch-/.test(scenario.id) ? '楚漢'
      : /^scn-st-/.test(scenario.id) ? '隋唐'
      : scenario.kind === 'whatif' ? '假想' : '三國';
    rows.push({ id: scenario.id, zh: scenario.name.zh, line, n: uniq.length, first: uniq.slice(0, 4) });
    console.log(`${String(uniq.length).padStart(3)} 條  ${line}  ${scenario.name.zh}  (${scenario.id})`);
  }

  rows.sort((a, b) => a.n - b.n);
  console.log('\n=== 最空的十張 ===');
  for (const r of rows.slice(0, 10)) console.log(`  ${String(r.n).padStart(3)} 條  ${r.line} ${r.zh}  ${r.first.join('/')}`);

  const byLine: Record<string, number[]> = {};
  for (const r of rows) (byLine[r.line] ??= []).push(r.n);
  console.log('\n=== 按路線 ===');
  for (const [k, v] of Object.entries(byLine)) {
    const sorted = [...v].sort((a, b) => a - b);
    console.log(`  ${k.padEnd(4)} ${String(v.length).padStart(3)} 張  中位 ${sorted[Math.floor(sorted.length / 2)]}  最少 ${sorted[0]}  最多 ${sorted[sorted.length - 1]}`);
  }
  console.log(`\n零事件的盤:${rows.filter((r) => r.n === 0).length} 張;不足 5 條:${rows.filter((r) => r.n < 5).length} 張。`);
}

main();
