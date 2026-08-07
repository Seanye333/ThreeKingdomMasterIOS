/**
 * 補位體檢 —— 找出「補位把城送到山那一邊」的那一類錯。
 *
 * ## 為什麼要有它
 *
 * `buildInitialCities` 對劇本沒明列的城,採「最近的已列城之主」補位(60px 內)。
 * 規則本身是對的:後來加進地圖的關隘與衛星城才不會變成無主空洞。但它**跨得過
 * 山川與州界**,而錯得無聲 —— 沒有任何測試會紅,只有那一家在掃描裡永遠 0。
 *
 * 手工撈到的四次(每一次都是先看到「某家主目標永遠 0」才回頭查的):
 *
 *  - 207 盤張魯只明列漢中,補位把**關中的陳倉、散關**也給了他;一個四城小國
 *    因此與曹操本土接壤,第 1 旬丟陳倉、第 12 旬丟漢中,一年亡國。
 *  - 208/211 盤:益州北部的劍閣、白水關離武都(馬騰/韓遂)比離成都近,
 *    於是涼州軍閥憑空得了劉璋的門戶。
 *  - 213/215 盤:天水、上邽離漢中最近,張魯憑空得了隴右。
 *  - 252/263/264/265 盤:**西陵**離上庸新城那一帶比離江陵近,於是吳的上游門戶
 *    落到魏手裡 —— 陸抗說「西陵、建平,國之藩表」的那個西陵。
 *
 * 四次都是人眼撞見的。所以規則寫成腳本。
 *
 * ## 判準
 *
 * 一座**補位來的**城 C(劇本沒明列),其主 F 在 C 所屬的州裡**一座明列的城都沒有**
 * → 可疑。意思是:F 在那個州本來沒有立足點,是補位硬把他放進去的。
 *
 * 這條刻意寬鬆 —— 邊界城本來就會有合理的跨州(曹操的新野在荊州)。所以它報的是
 * **可疑**不是錯,要人去看。真正的判準是那句話:**這一家在那個州有沒有根?**
 *
 * Run: `node --import tsx scripts/fill-audit.ts [scenarioIdPrefix]`
 */
import { readFileSync } from 'node:fs';
import { SCENARIOS } from '../src/game/data/scenarios';
import { PROVINCE_BY_CITY, PROVINCES } from '../src/game/data/provinces';

const SRC = readFileSync(new URL('../src/game/data/scenarios.ts', import.meta.url).pathname, 'utf8');
const provName = new Map((PROVINCES as Array<{ id: string; name: { zh: string } }>).map((p) => [p.id, p.name.zh]));
const PREFIX = process.argv[2] ?? '';

/** 這張盤的歸屬表裡**明列**了哪些城(展開 spread 一層以上)。 */
function listedCities(scenarioId: string): Set<string> | null {
  const m = new RegExp(`  id: '${scenarioId}',[\\s\\S]{0,16000}?cities: buildInitialCities\\((CITY_OWNERSHIP_[A-Z_0-9]+)`).exec(SRC);
  if (!m) return null;
  const out = new Set<string>();
  const seen = new Set<string>();
  const collect = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    const t = new RegExp(`const ${name}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`).exec(SRC);
    if (!t) return;
    for (const sp of t[1].matchAll(/\.\.\.(CITY_OWNERSHIP_[A-Z_0-9]+)/g)) collect(sp[1]);
    // 鍵可能帶引號('yi-county': …)—— 漏掉那一種會把明列的城誤報成補位來的。
    for (const e of t[1].matchAll(/'?([a-z0-9-]+)'?:\s*'([a-z0-9-]+)'/g)) out.add(e[1]);
  };
  collect(m[1]);
  return out;
}

let suspicious = 0;
let boards = 0;
for (const sc of SCENARIOS) {
  if (PREFIX && !sc.id.startsWith(PREFIX)) continue;
  const listed = listedCities(sc.id);
  if (!listed) continue;
  boards++;
  const pbc = PROVINCE_BY_CITY as Record<string, string>;
  // 每一家在每個州裡**明列**了幾座
  const rooted = new Map<string, Set<string>>();  // forceId → province ids
  for (const c of sc.cities) {
    if (!c.ownerForceId || !listed.has(c.id)) continue;
    const p = pbc[c.id];
    if (!p) continue;
    if (!rooted.has(c.ownerForceId)) rooted.set(c.ownerForceId, new Set());
    rooted.get(c.ownerForceId)!.add(p);
  }
  const hits: string[] = [];
  for (const c of sc.cities) {
    if (!c.ownerForceId || listed.has(c.id)) continue;   // 明列的不管
    const p = pbc[c.id];
    if (!p) continue;                                     // 沒有州的關隘不管
    if (rooted.get(c.ownerForceId)?.has(p)) continue;     // 在那個州有根
    // …而且那個州的**多數**是別人的。曹操沒明列白馬延津,但兗州本來就是他的 ——
    // 那不是補位把他放進去,是劇本懶得逐座寫。真正可疑的是「州是別人的,
    // 而他靠補位插了一兩座進去」。
    const inProv = sc.cities.filter((x) => pbc[x.id] === p && x.ownerForceId);
    const tally = new Map<string, number>();
    for (const x of inProv) tally.set(x.ownerForceId!, (tally.get(x.ownerForceId!) ?? 0) + 1);
    const mine = tally.get(c.ownerForceId) ?? 0;
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top || top[0] === c.ownerForceId) continue;      // 他就是那個州的多數
    if (mine > 2) continue;                               // 有兩座以上不算「插進去」
    hits.push(`${c.name.zh}(${provName.get(p) ?? p},${top[0]} 的州)→${c.ownerForceId}`);
  }
  if (hits.length) {
    suspicious += hits.length;
    console.log(`✗ ${sc.id.padEnd(26)} ${hits.length} 座`);
    console.log(`    ${hits.join('  ')}`);
  }
}
console.log(`\n=== ${boards} 張盤,${suspicious} 座「在那個州沒有根卻補位得到」的城 ===`);
console.log('這是**可疑**不是錯 —— 邊界城本來就會跨州。要看的是:這一家在那個州有沒有根。');
