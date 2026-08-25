/**
 * 從 `storeTypes.ts` 讀出 390 個 action 的**參數名與型別**。
 *
 * ## 為什麼要讀原始碼而不是問 runtime
 *
 * JS 只給得出 `fn.length`(而且預設參數會讓它歸零),給不出參數**叫什麼名字**。
 * 而這個 store 的參數名正是唯一能分辨「這個 EntityId 是城、是武將、還是軍隊」
 * 的線索 —— 全庫 300 個參數都宣告成 `EntityId`,只有名字說得出它是誰。
 *
 * 所以簽名從 `interface GameStore` 解出來:那裡每一條都寫著
 * `assignOfficer: (officerId: EntityId, cityId: EntityId) => void`。
 *
 * ⚠ 這是**文字解析**,不是型別檢查。它只求「切得出參數名與型別文字」,
 * 切不出來的就回報成 unparsed —— 寧可少掃也不要猜錯(見 actionSweep 那支的
 * 檔頭:猜參數的測試會騙自己)。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export type Param = { name: string; optional: boolean; type: string };
export type ActionSig = { name: string; params: Param[]; ret: string };

/** 頂層逗號切分 —— 不能用 `split(',')`,`Record<a, b>` 與物件字面值會被切壞。 */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if ('<([{'.includes(ch)) depth++;
    if ('>)]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * `export type X = 'a' | 'b' | 'c'` 的全庫索引。
 *
 * 參數型別有一大批寫成 `import('../systems/law').LawSeverity` 或光禿禿的
 * `TaxRate` —— 兩種都是**別處宣告的字面量聯集**。與其在取值表裡把那些字串
 * 抄一遍(抄了就會跟著實作漂),不如**回原始碼把宣告讀出來**:
 * 型別改了,取值自動跟著改;型別不再是字面量聯集,索引就查不到、於是跳過。
 *
 * 只收「純字面量」的別名;含物件、泛型、其他型別參照的一律不收 ——
 * 判準跟 firstLiteral 一樣:**不確定就不要猜**。
 */
let LITERAL_ALIASES: Map<string, string[]> | null = null;

function walk(dir: string, out: string[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) out.push(full);
  }
}

export function literalAliases(): Map<string, string[]> {
  if (LITERAL_ALIASES) return LITERAL_ALIASES;
  const here = dirname(fileURLToPath(import.meta.url));
  const files: string[] = [];
  walk(join(here, '../src/game'), files);
  const map = new Map<string, string[]>();
  for (const f of files) {
    const txt = readFileSync(f, 'utf8');
    for (const m of txt.matchAll(/export type ([A-Za-z0-9_]+)\s*=\s*([^;]+);/g)) {
      const [, name, rawRhs] = m;
      /*
       * 先把註解刮掉。多行聯集幾乎都長這樣:
       *   export type ShipClass =
       *     | 'transport'   // 運船 — moves troops across water
       * 不刮的話切出來的是 `'transport' // 運船…`,`/^'[^']*'$/` 對不上,
       * 整個別名就被判成「不是純字面量」而漏掉 —— 第一版就是這麼漏了十幾個。
       */
      const rhs = rawRhs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      const parts = rhs.split('|').map((p) => p.trim()).filter(Boolean);
      if (!parts.length) continue;
      const lits = parts.filter((p) => /^'[^']*'$/.test(p));
      const other = parts.filter((p) => !/^'[^']*'$/.test(p) && p !== 'null' && p !== 'undefined');
      if (!lits.length || other.length) continue;
      if (!map.has(name)) map.set(name, lits.map((l) => l.slice(1, -1)));
    }
  }
  LITERAL_ALIASES = map;
  return map;
}

export function readActionSignatures(): { sigs: ActionSig[]; unparsed: string[] } {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, '../src/game/state/storeTypes.ts'), 'utf8');
  const body = src.slice(src.indexOf('interface GameStore'));
  const sigs: ActionSig[] = [];
  const unparsed: string[] = [];
  for (const m of body.matchAll(/\n {2}([a-zA-Z][A-Za-z0-9_]*): \(([^;]*?)\) =>([^;]*);/gs)) {
    const [, name, rawArgs, ret] = m;
    const args = rawArgs.trim();
    if (!args) { sigs.push({ name, params: [], ret: ret.trim() }); continue; }
    const params: Param[] = [];
    let ok = true;
    for (const piece of splitTopLevel(args)) {
      const p = piece.trim();
      if (!p) continue;
      const pm = /^([A-Za-z0-9_]+)(\?)?:\s*([\s\S]+)$/.exec(p);
      if (!pm) { ok = false; break; }
      params.push({ name: pm[1], optional: !!pm[2], type: pm[3].replace(/\s+/g, ' ').trim() });
    }
    if (!ok) { unparsed.push(name); continue; }
    sigs.push({ name, params, ret: ret.trim() });
  }
  return { sigs, unparsed };
}

if (process.argv[1]?.includes('store-action-signatures')) {
  console.log(`字面量型別別名索引:${literalAliases().size} 個`);
  const { sigs, unparsed } = readActionSignatures();
  const withArgs = sigs.filter((s) => s.params.length > 0);
  console.log(`解出 ${sigs.length} 個 action:無參 ${sigs.length - withArgs.length}、有參 ${withArgs.length}`);
  if (unparsed.length) console.log(`切不出來的 ${unparsed.length} 個:${unparsed.join(', ')}`);
}
