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

/**
 * 期限之後再多跑幾年 —— **「做不到」與「太晚」是兩種病,要分開看。**
 *
 * 198 盤曹操的「白門樓」是滅呂布,而呂布開局只有下邳、琅琊兩座城;三輪皆 0,
 * 看起來像「AI 打不下兩城小國」。實際逐旬追下去:他 200 年拿下琅琊、旋即被
 * 奪回、201 年再取、**202 年才全滅** —— 期限寫的是白門樓那一年。
 * 目標沒寫錯,是 AI 收尾比史書慢了三年。這種要調的是窗口或 AI,不是改題目。
 *
 * 於是掃描一律多跑 GRACE 年,對每條死目標記下「不設期限的話哪一年會成」。
 */
const GRACE_YEARS = 6;

/** 這條目標若不設期限,會不會成、哪一年成。守成型另算(見下)。 */
type Late = {
  /** 取得/滅/稱帝…:不設期限時最早達成的年份(取多輪最好的一次)。0 = 從未。 */
  reachedYear: number;
  /** 守成型:從開局起連續握住的最後一年(取多輪最好的一次)。0 = 開局就丟。 */
  heldUntil: number;
};

const st = useGameStore;
const dead: Array<{
  id: string; zh: string; forceId: string; title: string; goal: string; late: Late;
}> = [];
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
  const turns = Math.min(MAX_TURNS, Math.max(120, (latest - startYear + 1 + GRACE_YEARS) * 36));

  const met: Record<string, number> = {};
  /** 開局歸屬:用來認出守成型(目標城全在自己手上),那一型的「遲到」要另外量。 */
  const startOwner: Record<string, string | null> = {};
  for (const c of scenario.cities) startOwner[c.id] = c.ownerForceId ?? null;
  const isHolding = (o: (typeof objs)[number]) => {
    const g = o.primary.goal as { kind: string; cityIds?: string[] };
    return g.kind === 'hold-cities' && !!g.cityIds
      && g.cityIds.every((c) => startOwner[c] === o.forceId);
  };
  const late: Record<string, Late> = {};
  for (const o of objs) { met[o.forceId] = 0; late[o.forceId] = { reachedYear: 0, heldUntil: 0 }; }

  for (let r = 0; r < RUNS; r++) {
    (st.getState() as unknown as { observeScenario: (s: typeof scenario, d: 'normal') => void })
      .observeScenario(scenario, 'normal');
    const hit: Record<string, boolean> = {};
    /** 這一輪裡不設期限的達成年 / 守成型連續握住到的年份。 */
    const reached: Record<string, number> = {};
    const heldTo: Record<string, number> = {};
    const broken: Record<string, boolean> = {};
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
      const ctxOf = (fid: string) => ({
        scenarioId: scenario.id, playerForceId: fid,
        cities: cur.cities as never, officers: cur.officers as never,
        year: cur.date.year, liveForceIds: live,
        isEmperor: cur.forces[fid]?.imperialRank === 'emperor',
      });
      for (const o of objs) {
        if (!hit[o.forceId]) {
          const res = evaluateGoal(o.primary.goal, ctxOf(o.forceId) as never);
          if (res.status === 'success') hit[o.forceId] = true;
        }
        /*
         * 「太晚」的量法分兩種:
         *  - 守成型:期限拿掉等於第 1 旬就成(`evaluateGoal` 沒有 byYear 就走取得
         *    語意),量它沒有意義。改量**他撐到哪一年**。
         *  - 其餘:把 byYear 拿掉重評一次,記最早達成的那一年。
         */
        if (isHolding(o)) {
          if (broken[o.forceId]) continue;
          const bare = { ...(o.primary.goal as object), byYear: undefined } as Goal;
          const res = evaluateGoal(bare, ctxOf(o.forceId) as never);
          if (res.status === 'success') heldTo[o.forceId] = cur.date.year;
          else broken[o.forceId] = true;
        } else if (!reached[o.forceId]) {
          const bare = { ...(o.primary.goal as object), byYear: undefined } as Goal;
          const res = evaluateGoal(bare, ctxOf(o.forceId) as never);
          if (res.status === 'success') reached[o.forceId] = cur.date.year;
        }
      }
    }
    for (const o of objs) {
      if (hit[o.forceId]) met[o.forceId]++;
      const L = late[o.forceId];
      // 多輪取最好的一次 —— 問的是「有沒有可能」,不是「平均如何」。
      if (reached[o.forceId] && (!L.reachedYear || reached[o.forceId] < L.reachedYear)) {
        L.reachedYear = reached[o.forceId];
      }
      if ((heldTo[o.forceId] ?? 0) > L.heldUntil) L.heldUntil = heldTo[o.forceId];
    }
  }

  const zeros = objs.filter((o) => met[o.forceId] === 0);
  const line = objs.map((o) => `${o.forceId}:${met[o.forceId]}`).join(' ');
  console.log(`${zeros.length ? '✗' : '·'} ${scenario.id.padEnd(24)} ${String(turns).padStart(3)}旬 到${scenario.startDate?.year ?? '?'}+  ${line}`);
  for (const o of zeros) {
    dead.push({
      id: scenario.id, zh: scenario.name.zh, forceId: o.forceId,
      title: o.primary.title.zh, goal: JSON.stringify(o.primary.goal),
      late: late[o.forceId],
    });
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

/**
 * 每條死目標後面那句「差在哪」—— 這一欄決定了修法:
 *  - `遲 N 年`  期限外做到了 → 調窗口,或讓 AI 收尾快一點。**別改題目。**
 *  - `守到 X 年(要 Y)` 守成型撐了多久 → 差一年是平衡,差十年是姿態或選錯城。
 *  - `從未達成`  多跑 GRACE 年也沒有 → 這才是目標本身寫錯了。
 */
function gapOf(d: (typeof dead)[number]): string {
  const g = JSON.parse(d.goal) as { kind: string; byYear?: number; year?: number };
  const due = g.byYear ?? g.year;
  if (d.late.heldUntil) return `守到 ${d.late.heldUntil} 年${due ? `(要 ${due})` : ''}`;
  if (d.late.reachedYear) {
    return due ? `遲 ${d.late.reachedYear - due} 年(${d.late.reachedYear} 才成)` : `${d.late.reachedYear} 年才成`;
  }
  return '從未達成';
}

const lateOnes = unexplained.filter((d) => d.late.reachedYear || d.late.heldUntil);
const neverOnes = unexplained.filter((d) => !d.late.reachedYear && !d.late.heldUntil);
console.log(`--- 期限外做得到 / 撐了一段的 ${lateOnes.length} 條(調窗口或調 AI)---`);
for (const d of lateOnes) {
  const sc = SCENARIOS.find((s) => s.id === d.id)!;
  console.log(`  ${d.zh}(${d.id}) / ${d.forceId} 「${d.title}」 [${shapeOf(sc, d.forceId, JSON.parse(d.goal) as Goal)}] —— ${gapOf(d)}`);
}
console.log(`\n--- 多跑 ${GRACE_YEARS} 年也從未達成的 ${neverOnes.length} 條(題目本身要重寫)---`);
for (const d of neverOnes) {
  const sc = SCENARIOS.find((s) => s.id === d.id)!;
  console.log(`  ${d.zh}(${d.id}) / ${d.forceId} 「${d.title}」 [${shapeOf(sc, d.forceId, JSON.parse(d.goal) as Goal)}]`);
}
