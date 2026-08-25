/**
 * 有參 action 全掃 —— 參數從活著的戰役裡取,不是猜的。
 *
 * ## 這支補的是哪個洞
 *
 * `actionSweep.integration.test.ts` 掃無參的 57 個,並且在檔頭寫明
 * 「其餘 315 個仍然是空白」。那個空白就是 `store.ts` 函式覆蓋率長年停在
 * 兩成多的原因 —— 一個 975 KB、390 個 action 的檔案,九成的入口沒有被
 * 任何測試按過一次。
 *
 * 那支不掃有參的理由是對的:**猜參數的測試會騙自己**。傳錯型別讓 action
 * 拋 TypeError,測試於是「抓到一個錯」,而那是測試自己造的。
 *
 * 這支把那個前提拆掉:參數**從這一局真的存在的東西裡取** ——
 * `assignOfficer(officerId, cityId)` 拿的是活著的武將與盤上的城。
 * 於是「拋例外」重新變成一個關於遊戲的判準,而不是關於測試的。
 *
 * ## 判準與無參那支相同
 *
 *  1. **不准拋** —— 前置條件不成立(這座城不是你的、這個人已經在別家)
 *     應該是 no-op 或回 `{ ok: false }`,不是例外。
 *  2. **呼叫後世界仍自洽** —— 沿用 `assertInvariants`。
 *
 * ## 掃不到的那些,誠實記下來
 *
 * 物件型參數(`Scenario` / `TacticalBattle` / `Omit<Legion,'id'>`)、回呼、
 * 以及名字看不出種類的(`aId` / `id` / `targetId`)一律跳過並計數。
 * 測試會把「掃到幾個、跳過幾個」印出來,免得這支的存在被誤讀成
 * 「store 全測過了」—— 那正是上一支檔頭提醒過的事。
 *
 * ⚠ 另外跳掉**會換掉整個世界**的那幾個(`loadScenario` / `observeScenario`
 * / `startChallenge`):掃到它們之後,後面每一個 action 都在另一個盤上跑,
 * 看起來全過,其實測的不是同一件事 —— 與 `reset` 被排除是同一個理由。
 */
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
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
});

import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import { assertInvariants, resetTroopTracking } from '../../test/worldInvariants';
import { readActionSignatures } from '../../../scripts/store-action-signatures';
import { buildPools, resolveArg, type ArgWorld } from './actionArgs';

/** 換掉整個世界的那幾個 —— 見檔頭。 */
const SKIP = new Set<string>([
  'reset', 'loadScenario', 'observeScenario', 'startChallenge',
  // 這兩個會把 store 換成另一份存檔 / 另一種模式,同理。
  'loadFromSlot', 'importSave',
]);

/**
 * 至少要真的按下去這麼多個。防的是解析器或取值表安靜失效之後,
 * 測試縮成一句 `expect(true)` —— 上一支踩過同樣的形狀,所以這裡也釘一個底。
 */
const FLOOR = 120;

describe('有參 action 全掃 —— 參數取自活的戰役', () => {
  it('每一個參數解得出來的 action 都能被呼叫,而不破壞任何不變量', () => {
    resetTroopTracking();
    const st = useGameStore;
    const sc = SCENARIOS[0];
    st.getState().loadScenario(sc, sc.forces[0].id, 'normal');
    // 走幾旬,好讓軍隊、報告、事件這些「有東西可操作」的狀態真的存在。
    for (let t = 0; t < 3; t++) st.getState().endSeason();

    const { sigs, unparsed } = readActionSignatures();
    const withArgs = sigs.filter((s) => s.params.length > 0 && !SKIP.has(s.name));

    const threw: string[] = [];
    const broke: string[] = [];
    const skipped: string[] = [];
    let called = 0;

    for (const sig of [...withArgs].sort((a, b) => a.name.localeCompare(b.name))) {
      const live = st.getState() as unknown as Record<string, unknown>;
      const fn = live[sig.name];
      if (typeof fn !== 'function') { skipped.push(`${sig.name}(不在 runtime 上)`); continue; }

      const pools = buildPools(st.getState() as unknown as ArgWorld);
      const args: unknown[] = [];
      const seen = new Map<string, number>();
      let ok = true;
      for (const p of sig.params) {
        // 同一類的第 n 個參數要拿不同的值(見 actionArgs 的說明)。
        const kind = p.name.replace(/^(target|foe|my|to|from|source|dest|enemy)/, '').toLowerCase();
        const nth = seen.get(kind) ?? 0;
        seen.set(kind, nth + 1);
        const r = resolveArg(p.name, p.type, pools, nth);
        if (!r.ok) {
          if (p.optional) continue;      // 選填的解不出來就不傳
          ok = false;
          skipped.push(`${sig.name}(${p.name}: ${p.type.slice(0, 30)})`);
          break;
        }
        args.push(r.value);
      }
      if (!ok) continue;

      try {
        (fn as (...a: unknown[]) => unknown)(...args);
        called++;
      } catch (e) {
        threw.push(`${sig.name}(${args.map((a) => JSON.stringify(a)).join(', ')}): ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      /*
       * 不變量在**每一個 action 之後**當場驗,而且要把 action 名字帶進失敗訊息 ——
       * 否則 vitest 只會說「某個道具同時無主又在某人身上」,而掃描按了一百多個鍵,
       * 沒有名字就得二分法找半天。
       */
      try {
        assertInvariants(0);
      } catch (e) {
        broke.push(`${sig.name}(${args.map((a) => JSON.stringify(a)).join(', ')}): ${e instanceof Error ? e.message : String(e)}`);
        break;   // 世界已經壞了,後面每一個都會跟著紅 —— 停在第一個現場
      }
    }

    // 這幾行是這支測試的**產出**之一:覆蓋到哪裡、還差多少,寫在紀錄裡。
    // eslint-disable-next-line no-console
    console.log(
      `[actionSweepArgs] 有參 ${withArgs.length} 個:呼叫 ${called}、跳過 ${skipped.length}`
      + `;簽名切不出來的另有 ${unparsed.length} 個(${unparsed.join(', ')})`,
    );
    if (process.env.SWEEP_SKIPS) {
      // eslint-disable-next-line no-console
      console.log('[actionSweepArgs] 跳過明細:\n' + skipped.join('\n'));
    }

    expect(
      threw.join('\n'),
      '用活著的實體當參數呼叫 action 時拋例外 —— 前置條件不成立應該 no-op 或回 ok:false,不是炸',
    ).toBe('');
    expect(
      broke.join('\n'),
      '某個 action 跑完之後世界不自洽了 —— 訊息開頭就是留下殘局的那一個',
    ).toBe('');
    expect(called, `只按到 ${called} 個 action,取值表大概自己失效了`).toBeGreaterThanOrEqual(FLOOR);
  });
});
