/**
 * 他們實際上做到了什麼 —— **不要猜目標,把目標從模擬裡讀出來。**
 *
 * ## 為什麼要有它
 *
 * 寫主目標一直是「憑史書 + 憑盤面猜」,然後跑一小時的 `objective-sweep.ts`
 * 看它死不死。兩支既有工具都不能代替那一小時:
 *
 *  - `reachability-audit.ts` 算的是 `pickForceTarget` 的**入選門檻**,
 *    而 2026-08-16 證實**壓力高不等於打得下來** —— 張魯取葭萌壓力 2.73–3.87,
 *    三張盤全部 0/3。必要條件不是充分條件。
 *  - `objective-ownership-audit.ts` 只看開局那一刻的歸屬,看不到後來。
 *
 * 這支換一個方向:**不問「這條目標做得到嗎」,問「他到底做了什麼」**。
 * 跑 N 輪,逐家報:
 *
 *  - **守得住的城**:開局就有、而且到每個檢查點還在手上(附 N 輪中守住幾輪)
 *  - **打得下的城**:開局不是他的、而過程中被他拿下(附 N 輪中拿下幾輪)
 *  - 城數/兵力的走勢
 *
 * 守住率高的城 → 可以寫進 `hold-cities` 主目標;
 * 攻取率高的城 → 可以寫進「取得」型主目標。**兩者都是實測,不是推測。**
 *
 * ## 讀法
 *
 * 這支報的是 **AI 自走**的結果,而玩家能集中兵力、AI 不會。所以:
 *  - 主目標**應該**落在這支報得出來的範圍內(AI 做得到,玩家更做得到)。
 *  - 次要目標可以寫在範圍外(「你做得到而 AI 做不到」是刻意的)。
 *
 * ⚠ 輪數少的時候,50% 上下那一格是雜訊,別當真。要當判準至少 6 輪,
 * 而且看的是**比例**不是有沒有 —— 同一個理由見 objective-sweep 檔頭那條
 * 「二值判定裁決不了 AI 改動」。
 *
 * Run:
 *   node --import tsx scripts/what-they-actually-do.ts <scenarioId> [runs] [forceId]
 *   node --import tsx scripts/what-they-actually-do.ts scn-whatif-cao-wins-chibi 6 zhang-lu
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
import type { EntityId } from '../src/game/types';

const SCENARIO_ID = process.argv[2] ?? '';
const RUNS = Number(process.argv[3] ?? 6);
const ONLY_FORCE = process.argv.slice(4).find((a) => !a.startsWith('--')) ?? '';

/**
 * 檢查點:開局後第幾年。守成型目標的期限多半落在 3–12 年,
 * 但崩得快的勢力要用更早的點才看得出形狀 —— 用 `--years=1,2,3,5` 改。
 */
const CHECK_YEARS = (() => {
  const arg = process.argv.find((a) => a.startsWith('--years='));
  if (!arg) return [3, 6, 9, 12];
  return arg.slice(8).split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0);
})();
/*
 * **一年三十六旬**,不是四季。
 *
 * 第一版寫 4(想當然耳「endSeason 一次一季」),於是四個檢查點其實全落在
 * 開局後一年三個月之內 —— 每一座城看起來都守得住,而我照著那份數據改了
 * 三條主目標。逐旬探針才抓到:旬 8 還是 208 年、旬 44 是 209、旬 48 是 210,
 * 兩個年界之間隔 36 旬。
 *
 * 判準:這支的輸出若顯示「什麼都守得住」,先確認年份換算,不要先信結論。
 * (`objective-sweep.ts` 的 MAX_TURNS = 1200 也是按 36 旬/年 算的。)
 */
const TURNS_PER_YEAR = 36;

interface Tally {
  /**
   * 城 → 各檢查點**手上有它**的輪數。開局有的與後來打下的一律記在這裡。
   *
   * ⚠ 第一版把「打得下」記成「整場曾經拿過」而**沒有時間戳**,結果讀錯了一條:
   * 曹操贏赤壁那盤張魯的葭萌「4/6 打得下」,而主目標是「據漢中、葭萌」——
   * 看起來只差一點,實際上他是**丟了漢中之後才南下拿葭萌的**,兩個條件
   * 從來沒有同時成立。`hold-cities` 要的是**同一個時點上全部在手**,
   * 所以每個檢查點都要逐城記,不能只記「有沒有拿過」。
   */
  held: Map<EntityId, number[]>;
  cities: number[];
  troops: number[];
  startCities: Set<EntityId>;
}

async function main() {
  const scenario = SCENARIOS.find((s) => s.id === SCENARIO_ID);
  if (!scenario) {
    console.log(`找不到劇本 ${SCENARIO_ID}`);
    console.log('可用:', SCENARIOS.map((s) => s.id).slice(0, 12).join(', '), '…');
    return;
  }
  const st = useGameStore;
  const tallies = new Map<EntityId, Tally>();
  const nameOf = new Map<EntityId, string>();

  for (let r = 0; r < RUNS; r++) {
    (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
      .observeScenario(scenario, 'normal');
    const s0 = st.getState();

    for (const f of Object.values(s0.forces)) {
      if (ONLY_FORCE && f.id !== ONLY_FORCE) continue;
      if (!tallies.has(f.id)) {
        tallies.set(f.id, {
          held: new Map(), cities: [], troops: [],
          startCities: new Set(
            Object.values(s0.cities).filter((c) => c.ownerForceId === f.id).map((c) => c.id),
          ),
        });
      }
      nameOf.set(f.id, f.name?.zh ?? f.id);
    }

    let checkIdx = 0;
    const maxTurns = CHECK_YEARS[CHECK_YEARS.length - 1] * TURNS_PER_YEAR;
    for (let t = 1; t <= maxTurns; t++) {
      st.getState().endSeason();
      const s = st.getState();
      if (checkIdx < CHECK_YEARS.length && t === CHECK_YEARS[checkIdx] * TURNS_PER_YEAR) {
        for (const [fid, tally] of tallies) {
          // 這個時點手上有的每一座城 —— 開局就有的與打下來的一視同仁,
          // 因為 hold-cities 判的就是「此刻在不在手上」。
          for (const c of Object.values(s.cities)) {
            if (c.ownerForceId !== fid) continue;
            const arr = tally.held.get(c.id) ?? CHECK_YEARS.map(() => 0);
            arr[checkIdx]++;
            tally.held.set(c.id, arr);
          }
        }
        checkIdx++;
      }
    }
    const sN = st.getState();
    for (const [fid, tally] of tallies) {
      tally.cities.push(Object.values(sN.cities).filter((c) => c.ownerForceId === fid).length);
      tally.troops.push(
        Object.values(sN.cities).filter((c) => c.ownerForceId === fid).reduce((a, c) => a + c.troops, 0),
      );
    }
  }

  const s = st.getState();
  const cityName = (id: EntityId) => s.cities[id]?.name?.zh ?? id;

  console.log(`\n=== ${scenario.name?.zh ?? scenario.id}(${RUNS} 輪,跑到開局後 ${CHECK_YEARS[CHECK_YEARS.length - 1]} 年)===`);
  console.log(`檢查點(開局後年數):${CHECK_YEARS.join(' / ')}\n`);

  for (const [fid, tally] of tallies) {
    const startN = tally.startCities.size;
    const endMed = [...tally.cities].sort((a, b) => a - b)[Math.floor(RUNS / 2)];
    console.log(`── ${nameOf.get(fid)} (${fid})  開局 ${startN} 城 → 末期中位 ${endMed} 城`);

    /*
     * 逐檢查點都要印,**不能只印最後一格。**
     *
     * 主目標的期限多半是開局後三年,而這支預設跑到十二年 —— 一座城在
     * 第 3 年 6/6、第 12 年 2/6 是很常見的形狀(守成型目標會隨時間衰減)。
     * 只看末格會把「三年內守得住」誤判成死目標,然後把一條好題目改掉。
     */
    const rows = [...tally.held.entries()]
      .map(([cid, arr]) => ({ cid, arr, own: tally.startCities.has(cid) }))
      .sort((a, b) => Number(b.own) - Number(a.own) || b.arr[0] - a.arr[0]);
    const head = CHECK_YEARS.map((y) => `+${y}年`.padStart(6)).join('');
    console.log(`   城池在手比例(${RUNS} 輪中)      ${head}`);
    for (const r of rows) {
      const cells = r.arr.map((n) => `${n}/${RUNS}`.padStart(6)).join('');
      console.log(`     ${r.own ? '守' : '取'} ${cityName(r.cid).padEnd(6)}${cells}`);
    }
    const neverKept = [...tally.startCities].filter((cid) => !tally.held.has(cid));
    if (neverKept.length) {
      console.log(`     ✗ 開局有、每個檢查點都已失去: ${neverKept.map(cityName).join('、')}`);
    }
    console.log('');
  }
}

main();
