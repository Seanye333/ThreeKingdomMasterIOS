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
import { readActionSignatures, literalAliases } from '../../../scripts/store-action-signatures';
import { buildPools, resolveArg, type ArgWorld } from './actionArgs';

/** 換掉整個世界的那幾個 —— 見檔頭。 */
const SKIP = new Set<string>([
  'reset', 'loadScenario', 'observeScenario', 'startChallenge',
  // 這兩個會把 store 換成另一份存檔 / 另一種模式,同理。
  'loadFromSlot', 'importSave',
  // `loadRandomScenario` 也是換掉整個世界 —— 是 fuzzer 找出來的漏網之魚:
  // 它一跑,後面每個 action 都在一個隨機盤上動,而演武的 `__spar__` 力量
  // 會留在城的 ownerForceId 上,於是報出「某城由不存在的勢力持有」。
  // 兇手是掃描自己換了世界,不是遊戲。
  'loadRandomScenario',
]);

/**
 * 至少要真的按下去這麼多個。防的是解析器或取值表安靜失效之後,
 * 測試縮成一句 `expect(true)` —— 上一支踩過同樣的形狀,所以這裡也釘一個底。
 */
const FLOOR = 120;

/**
 * 掃三種**世界**,不是三次同一個世界。
 *
 * 只掃一局的話,每個 action 都只走過一次它的快樂路徑 ——
 * 分支覆蓋因此卡在三成多:「你不是這座城的主人」「府庫不足」「還在打仗」
 * 這些分岔一次也沒進去過。
 *
 * 挑的三家刻意不同型:**大國 / 中等 / 一城小號**。同一個 `raiseTroops`,
 * 在府庫充裕的大國走的是扣錢那一支,在窮小號走的是「不夠」那一支。
 */
const WORLDS: Array<{ scenarioId: string; forceId: string; seasons?: number; why: string }> = [
  // 赤壁的曹操:48 城,府庫與人手都不缺 —— 走得到「花得起」那一支。
  { scenarioId: 'scn-208-chibi', forceId: 'cao', why: '大國(48 城)' },
  // 孫策定江東的孫策:**開局只有一座城** —— 走得到「不夠 / 沒有人 / 沒有鄰城」那一支。
  { scenarioId: 'scn-195-jiangdong', forceId: 'sun', why: '一城小號' },
  // 反董卓聯軍:十一家混戰,開局外交最複雜 —— 走得到同盟 / 互不侵犯那幾支。
  { scenarioId: 'scn-190-anti-dong-zhuo', forceId: 'cao', why: '十一家混戰的開局外交' },
  /*
   * 走六十旬再掃 —— 前三個世界都還在開局附近,而一大批分支只有**局勢已經
   * 發生過**才進得去:打過仗才有俘虜與傷兵、結過盟才撕得了約、
   * 有人當上州牧才談得上考課。暖機本身就是這一格的內容。
   */
  { scenarioId: 'scn-200-guandu', forceId: 'cao', seasons: 60, why: '走過六十旬的中局' },
];

describe('有參 action 全掃 —— 參數取自活的戰役', () => {
  it.each(WORLDS)('$why:每一個參數解得出來的 action 都能被呼叫,而不破壞任何不變量', ({ scenarioId, forceId, seasons }) => {
    resetTroopTracking();
    const st = useGameStore;
    const sc = SCENARIOS.find((x) => x.id === scenarioId);
    expect(sc, `盤 ${scenarioId} 不見了 —— 這張表要跟著劇本改`).toBeTruthy();
    const force = sc!.forces.find((f) => f.id === forceId);
    expect(force, `${scenarioId} 上沒有 ${forceId} —— 這張表要跟著劇本改`).toBeTruthy();
    st.getState().loadScenario(sc!, force!.id, 'normal');
    /*
     * 走十二旬 —— 不只是「有東西可操作」,更是為了讓**物件型參數有實物可取**:
     * 彈出事件、編年、戰報這幾個集合開局都是空的,三旬也還太少。
     * (實測:3 旬時 annals 空,12 旬有 25 筆、battleHistory 有 33 筆。)
     */
    for (let t = 0; t < (seasons ?? 12); t++) st.getState().endSeason();

    const { sigs, unparsed } = readActionSignatures();
    const aliases = literalAliases();
    const withArgs = sigs.filter((s) => s.params.length > 0 && !SKIP.has(s.name));

    const threw: string[] = [];
    const broke: string[] = [];
    const skipped: string[] = [];
    const calledOnce = new Set<string>();
    let called = 0;

    /*
     * 跑**兩趟**。有一批 action 操作的是「本局才會長出來」的東西
     * (`recallConvoy` 要先有輜重隊、`deleteCommandTemplate` 要先有範本),
     * 開局那幾個集合都是空的,第一趟只能跳過。
     * 第一趟按下去會把它們造出來,第二趟就掃得到 —— 而且造它們的是
     * **遊戲自己的 action**,不是測試手捏的假資料。
     */
    for (const pass of [1, 2] as const)
    for (const sig of [...withArgs].sort((a, b) => a.name.localeCompare(b.name))) {
      if (pass === 2 && calledOnce.has(sig.name)) continue;
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
        const r = resolveArg(p.name, p.type, pools, nth, aliases);
        if (!r.ok) {
          if (p.optional) continue;      // 選填的解不出來就不傳
          ok = false;
          if (pass === 2) skipped.push(`${sig.name}(${p.name}: ${p.type.slice(0, 30)})`);
          break;
        }
        args.push(r.value);
      }
      if (!ok) continue;

      try {
        (fn as (...a: unknown[]) => unknown)(...args);
        called++;
        calledOnce.add(sig.name);
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
      `[actionSweepArgs] ${sc!.id}/${force!.id} 有參 ${withArgs.length} 個:呼叫 ${called}、跳過 ${skipped.length}`
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
  },
  /*
   * 一格 10–15 秒(單跑),而全套併行跑再加上覆蓋率插樁會到二三十秒 ——
   * 預設的 20 秒會在**全套執行時**逾時而單跑時綠燈,那是最難查的一種紅。
   * 這裡明著給到兩分鐘:掃三百個 action × 四個世界本來就是長工。
   */
  120_000);
});
