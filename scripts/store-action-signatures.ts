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
import { readFileSync } from 'node:fs';
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
  const { sigs, unparsed } = readActionSignatures();
  const withArgs = sigs.filter((s) => s.params.length > 0);
  console.log(`解出 ${sigs.length} 個 action:無參 ${sigs.length - withArgs.length}、有參 ${withArgs.length}`);
  if (unparsed.length) console.log(`切不出來的 ${unparsed.length} 個:${unparsed.join(', ')}`);
}
