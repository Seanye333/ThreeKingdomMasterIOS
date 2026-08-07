/**
 * 目標掃描 —— 跑遍每一張盤,只回答一件事:**哪一家的主目標是死的**。
 *
 * ## 為什麼要有它
 *
 * `scenario-report.ts` 一次看一張盤,而「主目標達成 0/N」這種毛病是全庫性的:
 * 目標寫在 `objectives/` 裡、能不能達成卻由城池歸屬、開局外交、姿態三者決定,
 * 三邊各自改過之後沒有人重跑。實際撈到的四種死法,沒有一種會讓測試變紅:
 *
 *  1. **要 AI 走到它不會去的地方** —— 董卓的 `control-province: liang`,涼州從
 *     九城變十二城之後等於要求 AI 走到敦煌、張掖、酒泉;五輪峰值一律 9/12。
 *  2. **要 AI 打互不侵犯的鄰居** —— 208 盤曹操與六家皆 non-aggression,他唯一
 *     能打的在江南,而那條江他過不去。
 *  3. **兩家主目標指向同一座城** —— 208 江夏,曹操與孫權都要,而它在劉備手裡:
 *     兩家一起 0。
 *  4. **主目標寫成他史書上沒做到的事** —— 袁紹滅曹、劉表取許昌、公孫瓚取鄴。
 *     本專案的準則是**主目標寫他真正做到的,次要寫他沒做到的**。
 *
 * ## 兩個一定要記住的前提
 *
 *  - **用 `observeScenario`,不是 `loadScenario(…, forces[0].id)`** —— 後者會把
 *    那張盤的主角變成一兵不出的玩家(`planAITurn` 用 `isHuman()` 跳過玩家勢力)。
 *    208 盤舊法量到曹操 48 → 11 城,新法 48 → 42。
 *  - **回合數要蓋過該盤所有目標期限** —— 190 盤期限在 195–198,跑到 194 就收,
 *    十一家有七家 0/6,而那全是窗口沒到期。這支自己從目標裡算窗口。
 *
 * Run:
 *   node --import tsx scripts/objective-sweep.ts [runs] [scenarioIdPrefix]
 *   node --import tsx scripts/objective-sweep.ts 3 scn-2      # 只掃三國中後期
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
import { SCENARIO_OBJECTIVES } from '../src/game/data/objectives';
import { evaluateGoal } from '../src/game/systems/objectives';
import { PROVINCE_BY_CITY } from '../src/game/data/provinces';

type Goal = Parameters<typeof evaluateGoal>[0];

const RUNS = Number(process.argv[2] ?? 3);
const PREFIX = process.argv[3] ?? '';
/**
 * 一年三十六旬。窗口再長也就跑到這裡 —— 再長是體檢不是掃描。
 *
 * **這個數字自己咬過我一次。** 原本是 620,而戰國/楚漢/隋唐三線的盤一律
 * `startDate.year = 178`(它們借三國的曆法軸),期限卻寫到 200–208 ——
 * 要跑滿得 (208-178+1)×36 = 1116 旬。620 只走到 195 年,於是那三線**所有**
 * 守成目標(「函谷不開」「邯鄲三年」…)一律 0,而它們一條都沒死:
 * 是掃描沒跑到判定的那一年。三國線同樣中招的有 scn-265(期限 290)。
 * 判準:輸出裡 `旬` 剛好等於這個上限的盤,結果一律不可信。
 */
const MAX_TURNS = 1200;

/** 這條目標最晚要在哪一年之前判完。沒有期限的(如 recruit-officer)算 0。 */
function deadlineOf(goal: Goal): number {
  const g = goal as { byYear?: number; year?: number };
  return g.byYear ?? g.year ?? 0;
}

/*
 * 具名例外 —— **有些主目標 0 是設計如此。**
 *
 * 這幾家在史書上就是輸了,而那正是那張盤要玩家改寫的東西:呂布死於白門樓、
 * 公孫瓚自焚於易京樓、袁術嘔血於江亭、袁尚失鄴而走遼東。他們的主目標寫的是
 * 「守住」,AI 自走時當然守不住 —— 那不是資料錯,是題目。
 *
 * **判準**:這一家在**這張盤所涵蓋的那幾年裡**,史書上的下場就是覆滅或失地。
 * 不是「他最後輸了」—— 是「在這個窗口內他就輸了」。
 *
 * 列在這裡,是為了讓掃描的頭條數字表示**沒有解釋的**死目標。
 * 沿用 `scenario-audit.ts` 的體例:要進來就得寫理由。
 */
const BY_DESIGN: Array<{ scenario: string; force: string; why: string }> = [
  { scenario: 'scn-195-jiangdong', force: 'lu-bu',      why: '「白門樓之前」—— 標題就是說他到得了那一天;史書上他 198 年就沒了。' },
  { scenario: 'scn-195-jiangdong', force: 'gongsun',    why: '易京樓積穀三百萬斛而自焚於 199 —— 守到 200 年正是要玩家改寫的事。' },
  { scenario: 'scn-198-xiapi',     force: 'yuan-shu',   why: '「仲氏不亡」—— 他 199 年嘔血死於江亭,問廚下惟有麥屑三十斛。' },
  { scenario: 'scn-204-yecheng',   force: 'yuan-shang', why: '「鄴城固守」—— 鄴城陷落是這張盤的名字。' },
  { scenario: 'scn-199-yijing',    force: 'gongsun',    why: '同 195:易京之戰的結局就是樓焚。' },
  // 楚漢:項羽在這幾年裡先後打垮了齊與九江,那正是「楚漢相爭」的內容。
  { scenario: 'scn-ch-chuhan',    force: 'jiujiang',   why: '「黥布反楚」—— 叛楚之後龍且擊破九江,英布單身走漢。' },
  { scenario: 'scn-ch-sanqin',    force: 'jiujiang',   why: '同上:按兵不動的下場是被楚順手收拾。' },
  { scenario: 'scn-ch-pengcheng', force: 'jiujiang',   why: '同上。' },
  { scenario: 'scn-ch-chuhan',    force: 'qi',         why: '田榮 205 年為項羽所破而死,齊地再叛再破 —— 這張盤的前半就是它。' },
  { scenario: 'scn-ch-sanqin',    force: 'qi',         why: '同上:牽制項羽的代價就是被項羽先打。' },
  { scenario: 'scn-ch-jingxing',  force: 'qi',         why: '同上;而井陘之後韓信東下,齊亡於灌嬰之手。' },
];
const byDesign = (sid: string, fid: string) => BY_DESIGN.some((e) => e.scenario === sid && e.force === fid);

const st = useGameStore;
const dead: Array<{ id: string; zh: string; forceId: string; title: string; goal: string }> = [];
let boards = 0;

for (const scenario of SCENARIOS) {
  if ((scenario as { kind?: string }).kind === 'whatif') continue;
  if (PREFIX && !scenario.id.startsWith(PREFIX)) continue;
  const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
    forceId: string; primary: { title: { zh: string }; goal: Goal };
  }>>)[scenario.id] ?? [];
  if (!objs.length) continue;
  boards++;

  const startYear = scenario.startDate?.year ?? 0;
  const latest = Math.max(startYear, ...objs.map((o) => deadlineOf(o.primary.goal)));
  const turns = Math.min(MAX_TURNS, Math.max(120, (latest - startYear + 1) * 36));

  const met: Record<string, number> = {};
  for (const o of objs) met[o.forceId] = 0;

  for (let r = 0; r < RUNS; r++) {
    (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
      .observeScenario(scenario, 'normal');
    const hit: Record<string, boolean> = {};
    for (let t = 1; t <= turns; t++) {
      st.getState().endSeason();
      const s = st.getState() as unknown as {
        pendingEvent?: { event: { choices?: Array<{ id: string }> } };
        resolveEventChoice: (id: string) => void; dismissEvent: () => void;
        popupQueue?: unknown[]; dismissPopup: () => void;
        cities: Record<string, { ownerForceId?: string | null }>;
        officers: Record<string, unknown>; date: { year: number };
        forces: Record<string, { imperialRank?: string }>;
      };
      if (s.pendingEvent) s.resolveEventChoice(s.pendingEvent.event.choices?.[0]?.id ?? '');
      if ((st.getState() as unknown as { pendingEvent?: unknown }).pendingEvent) s.dismissEvent();
      while ((st.getState() as unknown as { popupQueue?: unknown[] }).popupQueue?.length) s.dismissPopup();

      const cur = st.getState() as unknown as typeof s;
      const live = new Set<string>();
      for (const c of Object.values(cur.cities)) if (c.ownerForceId) live.add(c.ownerForceId);
      for (const o of objs) {
        if (hit[o.forceId]) continue;
        const res = evaluateGoal(o.primary.goal, {
          scenarioId: scenario.id, playerForceId: o.forceId,
          cities: cur.cities as never, officers: cur.officers as never,
          year: cur.date.year, liveForceIds: live,
          isEmperor: cur.forces[o.forceId]?.imperialRank === 'emperor',
        } as never);
        if (res.status === 'success') hit[o.forceId] = true;
      }
    }
    for (const o of objs) if (hit[o.forceId]) met[o.forceId]++;
  }

  const zeros = objs.filter((o) => met[o.forceId] === 0);
  const line = objs.map((o) => `${o.forceId}:${met[o.forceId]}`).join(' ');
  console.log(`${zeros.length ? '✗' : '·'} ${scenario.id.padEnd(24)} ${String(turns).padStart(3)}旬 到${scenario.startDate?.year ?? '?'}+  ${line}`);
  for (const o of zeros) {
    dead.push({ id: scenario.id, zh: scenario.name.zh, forceId: o.forceId, title: o.primary.title.zh, goal: JSON.stringify(o.primary.goal) });
  }
}

/*
 * 死目標印出來時**順便分類** —— 這一步原本是我每次手工做的,而它決定了下一步:
 *
 *  - `守成`  開局就全握著 → 0 表示他**丟了**,是平衡或姿態問題,不是目標寫錯。
 *  - `取得`  一座都不在手上 → 0 多半是「要 AI 走到它不會去的地方」,
 *            或「寫成他史書上沒做到的事」。
 *  - `半守半取` 兩者皆有 → 通常是目標把腹地和奢望寫在同一條裡,拆開就好。
 *  - `大州`  control-province 且該州 >8 城 → 邊城 AI 永遠不去(揚荊涼交幽益)。
 */
function shapeOf(scenario: (typeof SCENARIOS)[number], forceId: string, goal: Goal): string {
  const own: Record<string, string | null> = {};
  for (const c of scenario.cities) own[c.id] = c.ownerForceId ?? null;
  const g = goal as { kind: string; cityIds?: string[]; provinceId?: string };
  if (g.kind === 'hold-cities' && g.cityIds) {
    const mine = g.cityIds.filter((c) => own[c] === forceId).length;
    const shape = mine === g.cityIds.length ? '守成' : mine ? '半守半取' : '取得';
    const missing = g.cityIds.filter((c) => own[c] !== forceId)
      .map((c) => `${c}@${own[c] ?? '無主'}`).join(' ');
    return missing ? `${shape} 缺 ${missing}` : shape;
  }
  if (g.kind === 'control-province' && g.provinceId) {
    const inProv = Object.entries(PROVINCE_BY_CITY as Record<string, string>)
      .filter(([, p]) => p === g.provinceId).map(([c]) => c);
    const mine = inProv.filter((c) => own[c] === forceId).length;
    return `${inProv.length > 8 ? '大州' : '州'} ${mine}/${inProv.length}`;
  }
  if (g.kind === 'defeat-force') {
    const t = (g as unknown as { forceId: string }).forceId;
    const n = Object.values(own).filter((o) => o === t).length;
    return `滅 ${t}(開局 ${n} 城)`;
  }
  return g.kind;
}

const designed = dead.filter((d) => byDesign(d.id, d.forceId));
const unexplained = dead.filter((d) => !byDesign(d.id, d.forceId));
console.log(`\n=== ${boards} 張盤,${RUNS} 輪;主目標 0 中的 ${dead.length} 條(其中 ${designed.length} 條設計如此,未解釋 ${unexplained.length} 條)===`);
for (const d of designed) {
  const e = BY_DESIGN.find((x) => x.scenario === d.id && x.force === d.forceId)!;
  console.log(`  · ${d.zh}(${d.id}) / ${d.forceId} 「${d.title}」 —— ${e.why}`);
}
if (designed.length) console.log('');
for (const d of unexplained) {
  const sc = SCENARIOS.find((s) => s.id === d.id)!;
  console.log(`  ${d.zh}(${d.id}) / ${d.forceId} 「${d.title}」 [${shapeOf(sc, d.forceId, JSON.parse(d.goal) as Goal)}]`);
}
