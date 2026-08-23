/**
 * 文案與資料對不對得上 —— 玩家讀的是句子,判定跑的是 `goal`。
 *
 * ## 為什麼要有它
 *
 * 2026-08-23 修「淺水原·定楊」時順手發現:文案寫「至184年仍據北平、薊」而
 * `byYear` 是 180。再往下翻,隋末那一整批都是同一個形狀 ——
 * 我在前幾批把期限往回壓、把城的清單縮短,**改了 `goal` 卻沒改句子**:
 *
 *   唐   「至189年仍據長安、太原、潼關、上黨」 → cityIds 只有 長安、潼關
 *   鄭   「至190年仍據洛陽、宛城」            → byYear 181
 *   夏   「至191年仍據鄴、渤海、平原」        → cityIds 只有 鄴、渤海;byYear 181
 *   西秦 「至188年仍據金城、天水、安定」      → cityIds 只有 金城、天水;byYear 179
 *
 * 這一型**掃描抓不到、模擬也抓不到**:目標本身是活的,`objective-sweep`
 * 照樣報成功。壞的是玩家看到的那句話 —— 他照著「守四座城到189年」去打,
 * 而系統其實只要兩座、只要到181年。這是**只有文案與資料對讀才看得見**的錯,
 * 跟 objective-ownership 那條「守成寫了別人的城」是同一個家族。
 *
 * ## 判準:只查對得起來的兩件事
 *
 * 年份與城數都是**句子裡明寫出來的數字**,對不上就是錯,沒有解釋空間。
 * 不查「句子提到而 goal 沒有的城」—— 文案本來就會提到旁邊的城當背景
 * (「許昌在李密手裡,而李密才是眼前的敵人」),那樣查會滿屏誤報。
 *
 * Run: node --import tsx scripts/objective-text-audit.ts [盤id前綴]
 */
import { SCENARIOS } from '../src/game/data/scenarios';
import { SCENARIO_OBJECTIVES } from '../src/game/data/objectives';
import type { ScenarioObjective, ObjectiveGoal } from '../src/game/types';

export type TextFinding = { tag: string; line: string };

/** 句子裡的期限:「至184年」「於184年前」「到184年」。 */
const YEAR_RE = /[至於到](\d{2,4})年/;
/**
 * 英文那一側的期限:`by 184` / `in 184` / `to 184`。
 *
 * 兩側分開查,因為**它們會各自漂**:中文對得上不代表英文對得上。
 * 第一版只查中文,而英文是我照著中文的提示一條條手改的 —— 那不是機制。
 */
const YEAR_EN_RE = /\b(?:by|in|to|before|until)\s+(\d{3})\b/i;
/**
 * 只看破折號之前那一段 —— 破折號之後是**史實旁白**,裡面的年份不是期限。
 *
 * 「Take Chang'an — in history he marched on it in 194 and was beaten.」
 * 期限是 200,而 194 是史實。第一版沒有這道切法,就把它報成錯。
 * 全庫的寫法都是「目標句 —— 旁白」,所以切破折號就夠。
 */
function goalClause(t: string): string {
  return t.split(/—|——/)[0];
}
/**
 * 句子裡的城池枚舉:「仍據A、B、C」「據A與B、C」「取A、B並取C」。
 *
 * 分隔符不只頓號 —— 第一版只吃頓號,於是把「許昌、陳留與官渡」數成兩座、
 * 「江州、巴西並取涪城」數成兩座,誤報了十來條。實際用到的接續詞有
 * 頓號 / 與 / 和 / 並取 / 並守 / 仍守,一併吃掉。
 */
const CITY_LIST_RE = /(?:仍據|仍保|據|攻取|取)([^\s,。—]+(?:(?:、|與|和|並取|並守|仍守)[^\s,。—]+)+)/;
const CITY_SPLIT_RE = /、|與|和|並取|並守|仍守/;
/** 把「成皋(官渡、虎牢)」這種夾註先拿掉,否則夾註裡的頓號會被數進去。 */
const PAREN_RE = /[((][^))]*[))]/g;

/** 句子列了幾座城 —— 數不出來(夾了數字、夾了句子)就回 undefined,不報。 */
function listedCityCount(zh: string): { n: number; raw: string } | undefined {
  const m = CITY_LIST_RE.exec(zh.replace(PAREN_RE, ''));
  if (!m) return undefined;
  const parts = m[1].split(CITY_SPLIT_RE).filter(Boolean);
  // 城名不含數字;含了就表示正則吃過頭,吃進了下一個子句。
  if (parts.some((p) => /\d/.test(p))) return undefined;
  return { n: parts.length, raw: m[1] };
}

function goalYear(g: ObjectiveGoal): number | undefined {
  const anyG = g as unknown as { byYear?: number; year?: number };
  return anyG.byYear ?? anyG.year;
}
function goalCityCount(g: ObjectiveGoal): number | undefined {
  const anyG = g as unknown as { cityIds?: string[] };
  return anyG.cityIds?.length;
}

/** 「逼到只剩三城」裡的那個數字 —— `break-force` 的 `maxCities` 也寫在句子裡。 */
const CN_NUM: Record<string, number> = {
  一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};
const BREAK_RE = /只剩([一二三四五六七八九十兩])城/;

export function auditObjectiveText(prefix = ''): { findings: TextFinding[]; checked: number } {
  const findings: TextFinding[] = [];
  let checked = 0;

  for (const scenario of SCENARIOS) {
    if (prefix && !scenario.id.startsWith(prefix)) continue;
    const objs = (SCENARIO_OBJECTIVES as Record<string, ScenarioObjective[]>)[scenario.id] ?? [];
    const forceName = new Map(scenario.forces.map((f) => [f.id, f.name.zh ?? f.id]));
    const where = `${scenario.name.zh}(${scenario.id})`;

    for (const o of objs) {
      const slots: Array<{ kind: string; g: ObjectiveGoal; zh: string; en: string; title: string }> = [
        { kind: '主', g: o.primary.goal, zh: o.primary.descriptionZh ?? '', en: o.primary.description ?? '', title: o.primary.title.zh },
        ...(o.secondary ?? []).map((s) => ({
          kind: '次', g: s.goal, zh: s.descriptionZh ?? '', en: s.description ?? '', title: s.title.zh,
        })),
      ];
      for (const s of slots) {
        checked++;
        const who = `${where} / ${forceName.get(o.forceId) ?? o.forceId} ${s.kind}「${s.title}」`;

        const yr = goalYear(s.g);
        const m = YEAR_RE.exec(goalClause(s.zh));
        if (yr != null && m && Number(m[1]) !== yr) {
          findings.push({ tag: '年份對不上', line: `${who} — 中文寫 ${m[1]} 年,goal 是 ${yr}` });
        }
        const em = YEAR_EN_RE.exec(goalClause(s.en));
        if (yr != null && em && Number(em[1]) !== yr) {
          findings.push({ tag: '年份對不上(英)', line: `${who} — 英文寫 ${em[1]},goal 是 ${yr}` });
        }

        const bm = BREAK_RE.exec(goalClause(s.zh));
        const cap = (s.g as unknown as { maxCities?: number }).maxCities;
        if (cap != null && bm && CN_NUM[bm[1]] !== cap) {
          findings.push({
            tag: '門檻對不上',
            line: `${who} — 文案寫「只剩${bm[1]}城」,maxCities 是 ${cap}`,
          });
        }

        const want = goalCityCount(s.g);
        const cm = listedCityCount(goalClause(s.zh));
        if (want != null && cm && cm.n !== want) {
          findings.push({
            tag: '城數對不上',
            line: `${who} — 文案列了 ${cm.n} 座(${cm.raw}),cityIds 只有 ${want} 座`,
          });
        }
      }
    }
  }
  return { findings, checked };
}

if (process.argv[1]?.includes('objective-text-audit')) {
  const { findings, checked } = auditObjectiveText(process.argv[2] ?? '');
  const byTag = new Map<string, string[]>();
  for (const f of findings) byTag.set(f.tag, [...(byTag.get(f.tag) ?? []), f.line]);
  console.log('=== 目標文案 × goal 資料對照 ===\n');
  for (const [tag, lines] of byTag) {
    console.log(`--- ${tag}(${lines.length}) ---`);
    for (const l of lines) console.log(`  ${l}`);
    console.log('');
  }
  console.log(`檢查了 ${checked} 條目標(主+次),${findings.length} 條對不上。`);
}
