/**
 * 大國留存 A/B —— 量 §4b:**史實上的強國在盤上一律會崩**。
 *
 * ## 它要回答的一件事
 *
 * `CAMPAIGN-CHECKS.md` §4b 記著一個跨盤的毛病:魏/晉/秦這種開局最大的一家,
 * 在自走十二輪之後城數與兵力雙雙腰斬,而**城沒怎麼丟、糧也不缺**——
 * 兵是在一場又一場邊境戰裡消耗掉的。小國(七城的魏、四城的韓)反而穩穩地漲。
 *
 * 那條記錄同時警告:**變異數很大**(同一份程式碼跑兩輪,一輪魏 66 城穩住、
 * 一輪掉到 36),所以「改一下看看」這種單輪比較毫無意義。這支就是為了讓
 * 那個比較做得起來:固定盤、固定輪數、多次重複,只報一個數 ——
 * **開局最大的那一家,末旬還剩幾成城、幾成兵**。
 *
 * ## 為什麼要自己一支,而不是用 balance-campaign
 *
 * `balance-campaign.ts` 數的是機制觸發次數(潰軍/掩殺/收降),它回答
 * 「這個機制有沒有在動」。這裡問的是完全不同的一件事:**生態的走向**——
 * 大國在不在崩。兩者都要留著。
 *
 * ## 判準
 *
 * 每張盤取**開局城數最多的那一家**(不是玩家、不是史實贏家 —— 就是最大的),
 * 跑 TURNS 旬,記末旬的 城數/兵力 相對開局的比值。多次取中位數,
 * 因為單輪的極端值(一輪 66→36、一輪 66→64)會把平均數拉得毫無意義。
 *
 * 另外報三個診斷,用來分辨「兵去哪了」:
 *  - `marchTroops`:全期進攻性行軍派出的總兵(兵有沒有出城)
 *  - `fronts`:末旬那一家的敵鄰家數(多線作戰的寬度)
 *  - `garrisonShare`:末旬趴在城裡的兵佔比(對照行軍中的兵)
 *
 * Run:
 *   node --import tsx scripts/big-power-ab.ts [runs] [turns] [scenarioPrefix]
 *   node --import tsx scripts/big-power-ab.ts 12 120            # 全部四張盤
 *   node --import tsx scripts/big-power-ab.ts 12 120 scn-241    # 只跑芍陂
 *
 * 輸出末行是機器可讀的一行 JSON,好讓 A/B 兩次跑的結果直接對比。
 */

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

import { useGameStore } from '../src/game/state/store';
import { SCENARIOS } from '../src/game/data/scenarios';
import type { City, EntityId } from '../src/game/types';

const RUNS = Number(process.argv[2] ?? 8);
const TURNS = Number(process.argv[3] ?? 120);
const PREFIX = process.argv[4] ?? '';

/**
 * 量哪幾張盤 —— §4b 是在這幾張上撞到的,所以 A/B 就在這幾張上做。
 *
 * 挑選判準:**開局有一家明顯最大**,而那一家在史書上的這幾年並沒有崩。
 * (241/244 的魏、ws-hangu 的秦、249 的司馬黨。)
 */
const BOARDS = ['scn-241-shaopi', 'scn-244-xingshi', 'scn-ws-hangu', 'scn-249-gaopingling']
  .filter((id) => !PREFIX || id.startsWith(PREFIX));

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function cityCount(cities: Record<EntityId, City>, forceId: EntityId): number {
  return Object.values(cities).filter((c) => c.ownerForceId === forceId).length;
}
function troopTotal(cities: Record<EntityId, City>, forceId: EntityId): number {
  return Object.values(cities)
    .filter((c) => c.ownerForceId === forceId)
    .reduce((s, c) => s + c.troops, 0);
}
/** 敵鄰家數 —— 多線作戰的寬度(不分敵我協定,只看不是自己的鄰城歸誰)。 */
function frontCount(cities: Record<EntityId, City>, forceId: EntityId): number {
  const n = new Set<EntityId>();
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== forceId) continue;
    for (const adjId of c.adjacentCityIds) {
      const adj = cities[adjId];
      if (adj?.ownerForceId && adj.ownerForceId !== forceId) n.add(adj.ownerForceId);
    }
  }
  return n.size;
}

interface BoardResult {
  scenario: string;
  force: string;
  city0: number;
  troop0: number;
  cityRatios: number[];
  troopRatios: number[];
  fronts: number[];
  marchTroops: number[];
  /** 全圖易手次數 —— 見下面 flips 的註解。 */
  flips: number[];
  /** 末旬還活著的勢力數。 */
  aliveForces: number[];
}

async function main() {
  const st = useGameStore;
  const results: BoardResult[] = [];

  for (const sid of BOARDS) {
    const scenario = SCENARIOS.find((s) => s.id === sid);
    if (!scenario) { console.log(`?? 找不到 ${sid}`); continue; }

    const res: BoardResult = {
      scenario: sid, force: '', city0: 0, troop0: 0,
      cityRatios: [], troopRatios: [], fronts: [], marchTroops: [],
      flips: [], aliveForces: [],
    };

    for (let r = 0; r < RUNS; r++) {
      (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
        .observeScenario(scenario, 'normal');

      const s0 = st.getState();
      // 開局最大的一家 —— 城數優先,同數比兵。
      let big: EntityId = '';
      let bigCities = -1, bigTroops = -1;
      for (const f of s0.forces ? Object.values(s0.forces) : []) {
        const cc = cityCount(s0.cities, f.id);
        const tt = troopTotal(s0.cities, f.id);
        if (cc > bigCities || (cc === bigCities && tt > bigTroops)) {
          big = f.id; bigCities = cc; bigTroops = tt;
        }
      }
      res.force = big;
      res.city0 = bigCities;
      res.troop0 = bigTroops;

      let marched = 0;
      /*
       * 每支縱隊只算一次。
       *
       * 第一版寫的是 `seasonsRemaining === totalSeasons`,而那**永遠不成立**:
       * 縱隊在被觀察到的時候已經走過一旬了。派出兵於是一路報 0。
       * 用 id 去重才對。
       */
      const seenArmies = new Set<EntityId>();
      /*
       * 全圖易手次數 —— **這一格是防呆用的,不是拿來變好看的。**
       *
       * 任何讓 AI 變保守的改動都能把「大國留存」推到 100%,做法是讓誰都不打了。
       * 那不是修好,那是把盤面凍住:史實上該發生的併吞也一起不發生。
       * 所以 A/B 一定要兩個數一起看 —— 大國留存**上升**而易手次數**不塌**,
       * 才算數。
       */
      let flips = 0;
      let ownerSnapshot: Record<EntityId, EntityId | null> = {};
      for (const c of Object.values(st.getState().cities)) ownerSnapshot[c.id] = c.ownerForceId;

      for (let t = 1; t <= TURNS; t++) {
        st.getState().endSeason();
        const s = st.getState();
        for (const a of Object.values(s.armies ?? {})) {
          if (a.forceId !== big || seenArmies.has(a.id)) continue;
          seenArmies.add(a.id);
          const dest = s.cities[a.targetCityId];
          if (dest && dest.ownerForceId !== big) marched += a.troops; // 進攻性,不算增援
        }
        const next: Record<EntityId, EntityId | null> = {};
        for (const c of Object.values(s.cities)) {
          next[c.id] = c.ownerForceId;
          if (ownerSnapshot[c.id] !== undefined && ownerSnapshot[c.id] !== c.ownerForceId) flips++;
        }
        ownerSnapshot = next;
        if (cityCount(s.cities, big) === 0) break; // 亡國,提前收
      }

      const sN = st.getState();
      const cN = cityCount(sN.cities, big);
      const tN = troopTotal(sN.cities, big);
      res.cityRatios.push(bigCities > 0 ? cN / bigCities : 0);
      res.troopRatios.push(bigTroops > 0 ? tN / bigTroops : 0);
      res.fronts.push(frontCount(sN.cities, big));
      res.marchTroops.push(marched);
      res.flips.push(flips);
      res.aliveForces.push(
        new Set(Object.values(sN.cities).map((c) => c.ownerForceId).filter(Boolean)).size,
      );

      process.stdout.write(
        `  ${sid} run${r + 1}: ${big} 城 ${bigCities}→${cN} 兵 ${Math.round(bigTroops / 1000)}k→${Math.round(tN / 1000)}k\n`,
      );
    }
    results.push(res);
  }

  console.log('\n=== 大國留存(中位數,括號內是最差–最好) ===');
  console.log('盤                        最大的一家   城留存(區間)      兵留存(區間)      戰線  易手  存國');
  for (const r of results) {
    const pct = (xs: number[]) => `${(median(xs) * 100).toFixed(0)}%`;
    /*
     * 區間跟中位數一樣重要 —— **A/B 只看中位數會下錯結論。**
     *
     * 上一輪比對是我手動從日誌裡把六個數字撈出來排序才看出來的:
     * 244 盤兩組兵力區間完全不重疊(380–486k vs 532–756k)= 真效果;
     * 而五國攻秦兩組都橫跨 50–250k,中位數看起來從 40% 掉到 20%,
     * 其實那個差距**小於組內離散**,n=6 根本分不出來。
     * 兩種情況的中位數都在動,只有區間分得出哪個算數。
     */
    const span = (xs: number[]) =>
      `${(Math.min(...xs) * 100).toFixed(0)}–${(Math.max(...xs) * 100).toFixed(0)}`;
    console.log(
      `${r.scenario.padEnd(24)}  ${r.force.padEnd(10)}  ` +
      `${pct(r.cityRatios).padStart(5)} (${span(r.cityRatios).padStart(7)})  ` +
      `${pct(r.troopRatios).padStart(5)} (${span(r.troopRatios).padStart(7)})  ` +
      `${median(r.fronts).toFixed(1).padStart(4)}  ` +
      `${median(r.flips).toFixed(0).padStart(4)}  ${median(r.aliveForces).toFixed(0).padStart(4)}`,
    );
  }
  const allC = results.flatMap((r) => r.cityRatios);
  const allT = results.flatMap((r) => r.troopRatios);
  const allF = results.flatMap((r) => r.flips);
  console.log(
    `\n全盤中位:城留存 ${(median(allC) * 100).toFixed(0)}%  ` +
    `兵留存 ${(median(allT) * 100).toFixed(0)}%  易手 ${median(allF).toFixed(0)}`,
  );
  console.log('⚠ 城留存上升而易手塌下去 = 把盤面凍住了,不算修好。');
  console.log('⚠ 比 A/B 時先看區間再看中位:兩組區間重疊得厲害就是 n 不夠,中位差不算數。');
  console.log(`(${RUNS} 輪 × ${TURNS} 旬 × ${results.length} 盤)`);
  console.log('JSON ' + JSON.stringify({
    runs: RUNS, turns: TURNS,
    cityMedian: median(allC), troopMedian: median(allT), flipMedian: median(allF),
    boards: results.map((r) => ({
      s: r.scenario, f: r.force,
      c: median(r.cityRatios), t: median(r.troopRatios),
      fronts: median(r.fronts), march: median(r.marchTroops),
      flips: median(r.flips), alive: median(r.aliveForces),
    })),
  }));
}

main();
