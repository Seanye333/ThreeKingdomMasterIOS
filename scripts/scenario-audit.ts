/**
 * 戰役盤面體檢 —— 把黃巾之亂一盤一盤手查出來的毛病,變成跑遍 86 盤的檢查。
 *
 * ## 為什麼需要它
 *
 * 深挖第一個戰役時,幾乎每一條發現都不是「這一盤特有的」,而是**一類**問題:
 *
 *  - 朱儁的主目標是「攻取並據守宛城」,而盤上開局就把宛城給了他 —— 那條目標
 *    第 0 回合就達成。體檢腳本報 5/5,看起來很好,其實是白送的。
 *  - 「廣宗易帥」與「收印綬,削戶邑」兩條事件講的是趙忠、張讓,而這兩個人
 *    掛在 unsearched 池裡 —— 事件在講盤上不存在的人。
 *  - 赤壁盤的劉琮勢力,rulerOfficerId 寫的是**已經死了的**劉表。
 *
 * 這些都能機器查。一盤一盤用眼睛看,查到第五盤就會開始漏 —— 86 盤靠人是靠
 * 不住的。所以規則寫在這裡,`scenarioAudit.test.ts` 用棘輪釘住總數不許增加。
 *
 * Run:
 *   node --import tsx scripts/scenario-audit.ts            # 全部 86 盤
 *   node --import tsx scripts/scenario-audit.ts scn-208-chibi   # 單盤明細
 *
 * ⚠ 這支只查**盤面靜態一致性**(誰在哪、目標指向誰)。動態的平衡與可玩性
 * 要用 `scenario-report.ts` 讓 AI 真的把盤打完 —— 兩支互補,別用其中一支
 * 代替另一支。
 */

export type Severity = 'error' | 'warn';

export interface Finding {
  scenario: string;
  scenarioZh: string;
  force?: string;
  severity: Severity;
  rule: string;
  message: string;
}

/** 規則說明 —— 印在報告末尾,也是這支腳本的規格書。 */
export const RULES: Record<string, string> = {
  'ruler-missing': '勢力的 rulerOfficerId 在盤上找不到這個人',
  'ruler-dead': '勢力的君主開局就是 dead —— 屍體領軍',
  'ruler-elsewhere': '君主武將的 forceId 不是他自己統領的勢力',
  'capital-not-owned': '勢力的首都不歸自己',
  'force-no-city': '勢力開局一座城都沒有',
  'force-no-officer': '勢力開局一個在職武將都沒有 —— 沒有人能下令',
  'goal-city-missing': '目標指向盤上不存在的城',
  'goal-force-missing': '目標指向盤上不存在的勢力',
  'goal-officer-missing': '目標指向盤上不存在的武將',
  'goal-already-met': '主目標第 0 回合就已達成 —— 那不是目標,是開局狀態',
  'goal-year-past': '目標的 byYear 早於開局年份 —— 永遠不可能達成',
  'goal-force-self': '目標是擊潰自己',
  'event-blocked-unaffiliated':
    '事件要求某人在野,而該盤開局就把他編進了某勢力 —— 這條事件鏈在這張盤永遠不會觸發',
};

/**
 * 具名例外 —— **設計如此**,不是缺陷。
 *
 * 每一條都要寫理由。沒有理由的例外等於把規則關掉:下一個人看到清單只會照抄,
 * 而規則本來是要擋住「照抄」的。
 */
const EXCEPTIONS: Array<{ scenario: string; rule: string; why: string }> = [
  {
    scenario: 'scn-whatif-women',
    rule: 'event-blocked-unaffiliated',
    why: '架空盤:諸葛亮仕於黃月英。三顧茅廬在這張盤上本來就不該演 —— 那正是它的立意。',
  },
  {
    scenario: 'scn-ch-pengcheng',
    rule: 'capital-not-owned',
    why: '彭城之戰的前提就是劉邦已經拿下彭城、項羽在齊地回師 —— 首都不在自己手上是這一盤的題目。',
  },
  {
    scenario: 'scn-194-xuzhou',
    rule: 'capital-not-owned',
    why: '呂布趁曹操征徐州而襲取兗州,濮陽易主是這一盤的題目。',
  },
];

interface Ctx {
  id: string;
  zh: string;
  startYear: number;
  cityOwner: Map<string, string | null>;
  cityExists: Set<string>;
  forceIds: Set<string>;
  officerById: Map<string, { forceId: string | null; status: string; zh: string }>;
  officersInService: Map<string, number>;
  citiesOf: Map<string, number>;
  /** forceId → rulerOfficerId,給 officer-join-ruler 反解用。 */
  rulerOf: Map<string, string>;
}

/** 主目標在開局盤面上是不是已經成立。回 null 表示這條規則不適用。 */
function goalAlreadyMet(goal: Record<string, unknown>, forceId: string, c: Ctx): boolean | null {
  switch (goal.kind) {
    case 'hold-cities': {
      const ids = (goal.cityIds as string[]) ?? [];
      if (!ids.length) return null;
      /* 有期限的是**守成**目標 —— 開局持有是它的前提,不是缺陷(評估器已改成
         要撐到 byYear 才判成功,見 systems/objectives.ts)。沒期限的才是
         「打下來」型:開局就持有等於白送。 */
      if (goal.byYear !== undefined) return null;
      return ids.every((id) => c.cityOwner.get(id) === forceId);
    }
    case 'defeat-force': {
      const target = goal.forceId as string;
      // 盤上根本沒有這一家 → 另有 goal-force-missing 會報,不重複報。
      if (!c.forceIds.has(target)) return null;
      return (c.citiesOf.get(target) ?? 0) === 0;
    }
    case 'recruit-officer': {
      const o = c.officerById.get(goal.officerId as string);
      return o ? o.forceId === forceId : null;
    }
    case 'survive-until':
      return c.startYear >= (goal.year as number);
    case 'unify-realm': {
      const total = [...c.cityOwner.values()].filter((v) => v != null).length;
      return (c.citiesOf.get(forceId) ?? 0) >= total;
    }
    default:
      return null;   // declare-emperor / control-province — 沒有靜態判準
  }
}

export async function auditAll(): Promise<Finding[]> {
  const { SCENARIOS } = await import('../src/game/data/scenarios');
  const { SCENARIO_OBJECTIVES } = await import('../src/game/data/objectives');
  const { HISTORICAL_EVENTS } = await import('../src/game/data/events');
  const out: Finding[] = [];

  /* 要求「在野」的事件 —— 這是最容易無聲失效的一種閘門。三顧茅廬那條就是:
     `evt-maolu-1` 要 zhuge-liang 在野,而**名叫三顧茅廬的那張盤**開局把臥龍
     編進了劉表軍,於是整條鏈在自己的主場盤上永遠不會演。 */
  const unaffiliatedGates = HISTORICAL_EVENTS.flatMap((e) =>
    (e.requires ?? [])
      .filter((r) => r.kind === 'officer-unaffiliated')
      .map((r) => ({
        event: e.id,
        eventZh: e.name.zh,
        officerId: (r as { officerId: string }).officerId,
        yearMin: e.yearMin,
        yearMax: e.yearMax,
      })),
  );

  /*
   * 這條鏈本來要把人送給誰。
   *
   * 少了這一層會滿屏誤報:赤壁盤開局 208 年,諸葛亮在劉備手下 —— 那不是
   * 「鏈被堵死」,那是**三顧已經演完了**(208 年開局的盤本來就該如此)。
   * 真正的缺陷是他隸屬**別人**:三顧茅廬盤把他編進了劉表軍。
   *
   * 收件人從同一批事件的 officer-join / officer-join-ruler 效果反推 —— 後者
   * 是按君主動態解析的,所以要在每張盤上各自解析一次。
   */
  const joinTargets = new Map<string, { forceIds: string[]; rulerIds: string[] }>();
  for (const e of HISTORICAL_EVENTS) {
    const fx = [
      ...(e.effects ?? []),
      ...((e as { choices?: Array<{ effects?: unknown[] }> }).choices ?? []).flatMap((ch) => ch.effects ?? []),
    ] as Array<{ kind: string; officerId?: string; forceId?: string; rulerOfficerId?: string }>;
    for (const f of fx) {
      if (f.kind !== 'officer-join' && f.kind !== 'officer-join-ruler') continue;
      if (!f.officerId) continue;
      if (!joinTargets.has(f.officerId)) joinTargets.set(f.officerId, { forceIds: [], rulerIds: [] });
      const t = joinTargets.get(f.officerId)!;
      if (f.forceId) t.forceIds.push(f.forceId);
      if (f.rulerOfficerId) t.rulerIds.push(f.rulerOfficerId);
    }
  }

  for (const sc of SCENARIOS) {
    const c: Ctx = {
      id: sc.id,
      zh: sc.name.zh,
      startYear: sc.startDate.year,
      cityOwner: new Map(sc.cities.map((x) => [x.id, x.ownerForceId ?? null])),
      cityExists: new Set(sc.cities.map((x) => x.id)),
      forceIds: new Set(sc.forces.map((f) => f.id)),
      officerById: new Map(
        sc.officers.map((o) => [o.id, { forceId: o.forceId ?? null, status: o.status, zh: o.name.zh }]),
      ),
      officersInService: new Map(),
      citiesOf: new Map(),
      rulerOf: new Map(sc.forces.map((f) => [f.id, f.rulerOfficerId])),
    };
    for (const o of sc.officers) if (o.forceId) c.officersInService.set(o.forceId, (c.officersInService.get(o.forceId) ?? 0) + 1);
    for (const x of sc.cities) if (x.ownerForceId) c.citiesOf.set(x.ownerForceId, (c.citiesOf.get(x.ownerForceId) ?? 0) + 1);

    const add = (severity: Severity, rule: string, message: string, force?: string) =>
      out.push({ scenario: sc.id, scenarioZh: sc.name.zh, force, severity, rule, message });

    /* ── 勢力自身的一致性 ── */
    for (const f of sc.forces) {
      const ruler = c.officerById.get(f.rulerOfficerId);
      if (!ruler) add('error', 'ruler-missing', `${f.name.zh} 的君主 ${f.rulerOfficerId} 不在盤上`, f.id);
      else {
        if (ruler.status === 'dead') add('error', 'ruler-dead', `${f.name.zh} 的君主 ${ruler.zh} 開局就是死的`, f.id);
        if (ruler.forceId !== f.id) {
          add('error', 'ruler-elsewhere',
            `${f.name.zh} 的君主 ${ruler.zh} 卻隸屬 ${ruler.forceId ?? '在野'}`, f.id);
        }
      }
      if (!c.cityExists.has(f.capitalCityId)) {
        add('error', 'capital-not-owned', `${f.name.zh} 的首都 ${f.capitalCityId} 不是盤上的城`, f.id);
      } else if (c.cityOwner.get(f.capitalCityId) !== f.id) {
        add('warn', 'capital-not-owned',
          `${f.name.zh} 的首都 ${f.capitalCityId} 歸 ${c.cityOwner.get(f.capitalCityId) ?? '無主'}`, f.id);
      }
      if ((c.citiesOf.get(f.id) ?? 0) === 0) add('error', 'force-no-city', `${f.name.zh} 開局沒有城`, f.id);
      if ((c.officersInService.get(f.id) ?? 0) === 0) add('error', 'force-no-officer', `${f.name.zh} 開局沒有在職武將`, f.id);
    }

    /* ── 事件閘門 ── */
    for (const g of unaffiliatedGates) {
      // 只看這張盤活得到的年份區間 —— 一場 184 年的戰役不必為 263 年的事件負責。
      if (g.yearMax < c.startYear) continue;
      const o = c.officerById.get(g.officerId);
      if (!o?.forceId) continue;
      const t = joinTargets.get(g.officerId);
      const allowed = new Set<string>(t?.forceIds ?? []);
      for (const rid of t?.rulerIds ?? []) {
        const f = [...c.forceIds].find((fid) => c.rulerOf.get(fid) === rid);
        if (f) allowed.add(f);
      }
      if (allowed.has(o.forceId)) continue;   // 故事已經演完了,不是被堵死
      add('error', 'event-blocked-unaffiliated',
        `「${g.eventZh}」(${g.event},${g.yearMin}–${g.yearMax})要 ${o.zh} 在野,`
        + `而他開局隸屬 ${o.forceId}`
        + (allowed.size ? `(鏈本來要送他去 ${[...allowed].join('/')})` : ''));
    }

    /* ── 目標 ── */
    const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
      forceId: string;
      primary: { title: { zh: string }; goal: Record<string, unknown> };
      secondary?: Array<{ title: { zh: string }; goal: Record<string, unknown> }>;
    }>>)[sc.id] ?? [];
    for (const ob of objs) {
      const fzh = sc.forces.find((f) => f.id === ob.forceId)?.name.zh ?? ob.forceId;
      const goals: Array<[string, Record<string, unknown>, boolean]> = [
        [ob.primary.title.zh, ob.primary.goal, true],
        ...(ob.secondary ?? []).map((g) => [g.title.zh, g.goal, false] as [string, Record<string, unknown>, boolean]),
      ];
      for (const [title, goal, isPrimary] of goals) {
        const where = `${fzh}「${title}」`;
        if (goal.kind === 'hold-cities') {
          for (const cid of (goal.cityIds as string[]) ?? []) {
            if (!c.cityExists.has(cid)) add('error', 'goal-city-missing', `${where} 指向不存在的城 ${cid}`, ob.forceId);
          }
        }
        if (goal.kind === 'defeat-force') {
          const t = goal.forceId as string;
          if (!c.forceIds.has(t)) add('error', 'goal-force-missing', `${where} 要擊潰的 ${t} 不在盤上`, ob.forceId);
          if (t === ob.forceId) add('error', 'goal-force-self', `${where} 是擊潰自己`, ob.forceId);
        }
        if (goal.kind === 'recruit-officer' && !c.officerById.has(goal.officerId as string)) {
          add('error', 'goal-officer-missing', `${where} 要招攬的 ${goal.officerId} 不在盤上`, ob.forceId);
        }
        const by = (goal.byYear ?? goal.year) as number | undefined;
        if (by != null && by < c.startYear) {
          add('error', 'goal-year-past', `${where} 期限 ${by} 早於開局 ${c.startYear}`, ob.forceId);
        }
        if (isPrimary && goalAlreadyMet(goal, ob.forceId, c) === true) {
          add('warn', 'goal-already-met', `${where} 開局就已達成`, ob.forceId);
        }
      }
    }
  }
  return out.filter(
    (f) => !EXCEPTIONS.some((e) => e.scenario === f.scenario && e.rule === f.rule),
  );
}

async function main() {
  const only = process.argv[2];
  const all = await auditAll();
  const findings = only ? all.filter((f) => f.scenario === only) : all;

  const errors = findings.filter((f) => f.severity === 'error');
  const warns = findings.filter((f) => f.severity === 'warn');
  console.log(`\n=== 戰役盤面體檢 ===`);
  console.log(`${only ? only : '全部劇本'}:error ${errors.length} / warn ${warns.length}\n`);

  const byRule = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule)!.push(f);
  }
  const order = [...byRule.entries()].sort((a, b) => {
    const sev = (x: Finding[]) => (x[0].severity === 'error' ? 0 : 1);
    return sev(a[1]) - sev(b[1]) || b[1].length - a[1].length;
  });
  for (const [rule, fs] of order) {
    console.log(`── [${fs[0].severity}] ${rule} × ${fs.length} —— ${RULES[rule] ?? ''}`);
    for (const f of fs.slice(0, only ? 999 : 12)) console.log(`     ${f.scenarioZh.padEnd(16)} ${f.message}`);
    if (!only && fs.length > 12) console.log(`     …另 ${fs.length - 12} 筆(給劇本 id 看單盤明細)`);
    console.log('');
  }
  if (!findings.length) console.log('乾淨。\n');
  if (!only && EXCEPTIONS.length) {
    console.log(`(具名例外 ${EXCEPTIONS.length} 條,設計如此:`
      + EXCEPTIONS.map((e) => `${e.scenario}/${e.rule}`).join('、') + ')\n');
  }
}

if (process.argv[1]?.includes('scenario-audit')) void main();
