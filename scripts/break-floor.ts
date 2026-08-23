/**
 * `break-force` 門檻怎麼訂 —— 量**期限之內**對方最少剩幾座城。
 *
 * ## 為什麼要有它
 *
 * `break-force` 的 `maxCities` 是個硬數字,訂高了等於沒題目、訂低了整條死。
 * 而它只能量,不能猜:同樣是「壓不垮的大國」,秦 42 城被楚壓到 17–22,
 * 張楚 4 城只壓得到 4–5,毌丘儉 3 城有時歸零有時剩 3。
 *
 * ## ⚠ 探針必須在 byYear 就停
 *
 * **這個錯我犯了兩次。** 手寫探針時圖方便跑十年,量到公孫瓚最少剩 2 城、
 * 張楚最少剩 3 城,就照著寫門檻 —— 而那兩條目標的期限分別只有 +5 年:
 * 期限之內公孫瓚剩 4~5、張楚剩 4~5,兩條都仍然 0/3,白改一輪。
 *
 * 所以這支**強制**要傳 byYear,並且在那一年結束就收。
 *
 * Run:
 *   node --import tsx scripts/break-floor.ts <盤id> <目標勢力id> <期限年> [輪數]
 *   node --import tsx scripts/break-floor.ts scn-ch-daze zhangchu 183 4
 *
 * ## 門檻有兩道邊界,不是一道
 *
 * 下緣:期限內量得到的**最少值的上緣**(量到 5,5,5,4 就訂 5)——
 * 訂在最小值等於只有運氣最好的那一輪過得了。
 *
 * 上緣:**對方開局城數減一**。這條是後來補的,因為只看下緣會出人命:
 * 張楚開局四城、期限內最少剩 3~4,照下緣訂五城 —— 門檻高過開局城數,
 * 於是第 0 旬就成立,整條目標變擺設(毌丘儉那條也一樣,3 城訂 ≤3)。
 * 兩條都是 `objectiveOwnership` 測試攔下來的,所以這支現在自己先報。
 *
 * 兩道邊界交不到的時候(小勢力壓不動),就別用 break-force —— 換題目。
 * 改完仍要跑 objective-sweep 驗。
 */
const g = globalThis as unknown as { localStorage?: unknown };
if (!g.localStorage) {
  const m = new Map<string, string>();
  g.localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0 };
}
import { useGameStore } from '../src/game/state/store';
import { SCENARIOS } from '../src/game/data/scenarios';

const [, , SID, TARGET, DEADLINE, RUNS] = process.argv;
if (!SID || !TARGET || !DEADLINE) {
  console.log('用法: break-floor.ts <盤id> <目標勢力id> <期限年> [輪數]');
  process.exit(1);
}
const scenario = SCENARIOS.find((s) => s.id === SID);
if (!scenario) { console.log(`找不到劇本 ${SID}`); process.exit(1); }

const st = useGameStore;
const runs = Number(RUNS ?? 4);
const mins: number[] = [];
for (let r = 0; r < runs; r++) {
  (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
    .observeScenario(scenario, 'normal');
  let min = Infinity;
  for (let t = 1; t <= 36 * 60; t++) {
    st.getState().endSeason();
    const s = st.getState();
    if (s.date.year > Number(DEADLINE)) break;   // ← 期限一過就收,見檔頭
    const n = Object.values(s.cities).filter((c) => c.ownerForceId === TARGET).length;
    if (n < min) min = n;
    if (n === 0) break;
  }
  mins.push(min === Infinity ? -1 : min);
}
const sorted = [...mins].sort((a, b) => a - b);
const startCities = scenario.cities.filter((c) => c.ownerForceId === TARGET).length;
const ceiling = startCities - 1;   // 見檔頭「上緣」:等於開局城數就是第 0 旬成立
const floor = sorted[sorted.length - 1];
console.log(`${SID} / ${TARGET}  開局 ${startCities} 城,期限 ${DEADLINE} 之內最少城數: ${mins.join(', ')}`);
if (floor <= ceiling) {
  console.log(`→ 建議門檻 maxCities: ${floor}(最少值的上緣;上限 ${ceiling} = 開局城數 -1)`);
} else {
  const hits = mins.filter((m) => m >= 0 && m <= ceiling).length;
  console.log(`→ ⚠ 兩道邊界交不到:下緣要 ${floor},而上緣只能到 ${ceiling}(開局 ${startCities} 城)。`);
  console.log(`   訂 ${ceiling} 的話 ${runs} 輪只中 ${hits} 輪;${hits === 0 ? '這條別用 break-force,換題目。' : '勉強成立,務必跑 objective-sweep 驗。'}`);
}
