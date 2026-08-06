/**
 * 內容體檢 —— 跨全庫的**一類**問題,而不是某一張盤的問題。
 *
 * ## 為什麼要有它
 *
 * 深挖 184、190、200 三張盤的過程中,反覆撞到同一批毛病,而每一次都是靠人眼
 * 在讀某一段資料時偶然發現的:
 *
 *  - **同名事件**:「三英戰呂布」有兩條、「白馬斬顏良」有兩條 —— 互斥條件各查
 *    各的旗標,誰先誰後全看列表順序,條件稍有不同就會演兩次。
 *  - **永遠設不上的旗標**:官渡盤上烏巢一度要求 `baima-yanliang`,而那一節要
 *    `guan-yu-with-cao` —— 關羽在這張盤是劉備的人,旗標設不起來,整條鏈 0/10。
 *  - **州別錯掛**:郿與武關掛在益州,於是「盡取益州」必須先打下兩座關中城,
 *    七張盤的益州目標全部受影響。
 *  - **沒有城的州 / 沒有州的城**:司隸一度看起來 0 城(其實是我查錯 id),
 *    而函谷關、蕭關、散關、街亭、陽平關**真的沒有州**。
 *
 * 靠人一張盤一張盤看是看不完的 —— 86 個劇本、160 餘條事件、128 座城。
 * 所以規則寫成腳本。
 *
 * ## 與既有兩支的分工
 *
 *  - `scenario-audit.ts`:單一劇本內部的一致性(都城歸屬、目標城存在…)
 *  - `scenario-report.ts`:AI 自走的動態(誰活得下去、目標達不達得到)
 *  - **這一支**:跨劇本、跨資料表的**靜態**一致性
 *
 * Run: `node --import tsx scripts/content-audit.ts`
 */

const ROOT = new URL('..', import.meta.url).pathname;

interface Finding { level: 'error' | 'warn'; where: string; what: string }

async function main() {
  const { HISTORICAL_EVENTS } = await import(`${ROOT}src/game/data/events`);
  const { SCENARIOS } = await import(`${ROOT}src/game/data/scenarios`);
  const { PROVINCE_BY_CITY, PROVINCES } = await import(`${ROOT}src/game/data/provinces`);
  const { CITY_IDS, CITY_NAMES_BY_ID } = await import(`${ROOT}src/game/data/cities`);

  const findings: Finding[] = [];
  const evts = HISTORICAL_EVENTS as Array<{
    id: string;
    name: { zh: string; en: string };
    requires?: Array<{ kind: string; key?: string }>;
    effects?: Array<{ kind: string; key?: string; cityId?: string }>;
    choices?: Array<{ effects?: Array<{ kind: string; key?: string; cityId?: string }> }>;
    season?: string;
    yearMin: number;
    yearMax: number;
  }>;

  // ① 同名事件 —— 兩條中文名一字不差的事件,幾乎都是同一個場面寫了兩次
  const byName = new Map<string, string[]>();
  for (const e of evts) {
    const k = e.name.zh;
    byName.set(k, [...(byName.get(k) ?? []), e.id]);
  }
  for (const [zh, ids] of byName) {
    if (ids.length > 1) {
      findings.push({ level: 'error', where: `events/${ids.join(' + ')}`, what: `同名事件「${zh}」×${ids.length} —— 互斥若沒做全,同一個場面會演兩次` });
    }
  }

  // ② 旗標:被 requires 讀,而全庫沒有任何 effects 寫得上去
  const setKeys = new Set<string>();
  for (const e of evts) {
    for (const f of e.effects ?? []) if (f.kind === 'flag' && f.key) setKeys.add(f.key);
    for (const c of e.choices ?? []) for (const f of c.effects ?? []) if (f.kind === 'flag' && f.key) setKeys.add(f.key);
  }
  for (const e of evts) {
    for (const r of e.requires ?? []) {
      if (r.kind === 'flag-set' && r.key && !setKeys.has(r.key)) {
        findings.push({ level: 'error', where: `events/${e.id}`, what: `要求旗標 \`${r.key}\`,而全庫沒有任何事件設得上它 —— 這一節永遠不會演` });
      }
    }
  }

  // ③ 事件效果裡的城 id 必須存在(「city-luoyang」那個坑)
  const cityIds = new Set(CITY_IDS as string[]);
  const checkCity = (e: { id: string }, f: { kind: string; cityId?: string }) => {
    if (!f.cityId || !f.kind.startsWith('city-')) return;
    if (!cityIds.has(f.cityId)) {
      findings.push({ level: 'error', where: `events/${e.id}`, what: `效果指向不存在的城 \`${f.cityId}\` —— 查不到城會靜默跳過` });
    }
  };
  for (const e of evts) {
    for (const f of e.effects ?? []) checkCity(e, f);
    for (const c of e.choices ?? []) for (const f of c.effects ?? []) checkCity(e, f);
  }

  // ④ 城與州:沒有州的城,以及州裡列了不存在的城
  const pbc = PROVINCE_BY_CITY as Record<string, string>;
  const orphanCities = (CITY_IDS as string[]).filter((id) => !pbc[id]);
  if (orphanCities.length) {
    findings.push({ level: 'warn', where: 'provinces', what: `${orphanCities.length} 座城不屬於任何州(control-province 目標永遠數不到它們):${orphanCities.map((i) => (CITY_NAMES_BY_ID as Record<string, { zh: string }>)[i]?.zh ?? i).join(' ')}` });
  }
  for (const p of PROVINCES as Array<{ id: string; name: { zh: string }; cityIds: string[] }>) {
    const ghosts = p.cityIds.filter((id) => !cityIds.has(id));
    if (ghosts.length) findings.push({ level: 'error', where: `provinces/${p.id}`, what: `${p.name.zh} 列了不存在的城:${ghosts.join(' ')}` });
  }

  // ⑤ 劇本覆蓋度 —— 只報數,不判對錯(旗艦盤才需要滿格)
  const { SCENARIO_VERDICTS } = await import(`${ROOT}src/game/data/scenarioVerdicts`);
  const covered = (SCENARIOS as Array<{ id: string; kind?: string; openingRelations?: unknown[] }>)
    .filter((s) => s.kind !== 'whatif');
  const noRel = covered.filter((s) => !s.openingRelations?.length);
  const noVer = covered.filter((s) => !(SCENARIO_VERDICTS as Record<string, unknown>)[s.id]);
  findings.push({ level: 'warn', where: 'coverage', what: `${noRel.length}/${covered.length} 個歷史劇本沒有開局外交(兩兩中立 = 盤上沒有敵我)` });
  findings.push({ level: 'warn', where: 'coverage', what: `${noVer.length}/${covered.length} 個歷史劇本沒有落幕文本(亡國時讀通用輓歌)` });

  // ── 印出來 ──
  const errs = findings.filter((f) => f.level === 'error');
  const warns = findings.filter((f) => f.level === 'warn');
  console.log('=== 內容體檢(跨劇本靜態一致性)===\n');
  for (const f of errs) console.log(`  ✗ [${f.where}] ${f.what}`);
  if (errs.length && warns.length) console.log('');
  for (const f of warns) console.log(`  · [${f.where}] ${f.what}`);
  console.log(`\nerror ${errs.length} / warn ${warns.length}`);
  if (errs.length) process.exitCode = 1;
}

main();
