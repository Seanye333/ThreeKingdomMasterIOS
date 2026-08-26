/**
 * 把 action 全掃當成 fuzzer 來搖 —— 找的是**間歇性**的殘局。
 *
 * `actionSweepArgs` 那支測試跑四個世界、每次一輪,已經抓到兩個真 bug
 * (屍體佔著州牧、屍體當著君主)。兩個都**不是「沒測到」而是「測不出來」**:
 * 舌戰慘敗是否致死由 rng 決定,六次裡才炸一兩次。
 *
 * 既然如此,提高命中率的辦法就不是想得更聰明,是**搖得更多次**:
 * 換盤、換勢力、換暖機長度,每一輪都是一組新的隨機。
 *
 * 這支不進 CI(它會跑很久、而且沒有固定的通過門檻)——
 * 它是「找 bug 的工具」,找到之後把那一條釘進測試才是產出。
 *
 * Run: node --import tsx scripts/store-action-fuzz.ts [輪數]
 */
const g = globalThis as unknown as { localStorage?: unknown };
if (!g.localStorage) {
  const m = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(), key: () => null, length: 0,
  };
}
import { useGameStore } from '../src/game/state/store';
import { SCENARIOS } from '../src/game/data/scenarios';
import { readActionSignatures, literalAliases } from './store-action-signatures';
import { buildPools, resolveArg, type ArgWorld } from '../src/game/state/actionArgs';
import { checkInvariants } from '../src/test/worldInvariants';

/*
 * 換掉整個世界的那幾個。`loadRandomScenario` 是**這支 fuzzer 自己找出來的
 * 漏網之魚**:它一跑,後面每個 action 都在一個隨機盤上動,而演武的
 * `__spar__` 勢力會留在城的 ownerForceId 上 —— 於是報出「某城由不存在的
 * 勢力持有」。兇手是掃描自己換了世界,不是遊戲。
 */
const SKIP = new Set(['reset', 'loadScenario', 'observeScenario', 'startChallenge',
  'loadFromSlot', 'importSave', 'loadRandomScenario']);
const ROUNDS = Number(process.argv[2] ?? 20);

const { sigs } = readActionSignatures();
const aliases = literalAliases();
const withArgs = sigs.filter((s) => s.params.length > 0 && !SKIP.has(s.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const findings = new Map<string, { kind: string; msg: string; hits: number; where: string }>();
const st = useGameStore;

for (let round = 0; round < ROUNDS; round++) {
  /*
   * 每一輪換一張盤、換一家、換暖機長度 —— 三個維度都動,免得只搖到同一個角落。
   *
   * ⚠ 這裡犯過兩次同一類錯,都是「看起來在搖、其實沒動」:
   *   一、三個維度都用 `round % n` —— 同一張盤永遠配同一家。
   *   二、改成 `round * 7`、`round * 3` 之後**更糟**:七家的盤上
   *       `round*7 % 7` 恆為 0,永遠是第一家;旬數 `(round*3)%6` 只在
   *       4 與 34 之間跳。**乘一個常數不等於錯開 —— 那個常數可能與
   *       池子大小同因數。**
   * 所以改用雜湊:每個維度各拿 round 的一個獨立雜湊值,池子多大都不會退化。
   */
  const hash = (n: number, salt: number): number => {
    let h = (n * 2654435761 + salt * 40503) >>> 0;
    h ^= h >>> 15; h = (h * 2246822507) >>> 0; h ^= h >>> 13;
    return h >>> 0;
  };
  const sc = SCENARIOS[round % SCENARIOS.length];   // 盤要輪完,所以照序走
  const force = sc.forces[hash(round, 1) % sc.forces.length];
  const seasons = 4 + (hash(round, 2) % 6) * 10;
  st.getState().loadScenario(sc, force.id, 'normal');
  for (let t = 0; t < seasons; t++) st.getState().endSeason();
  const where = `${sc.id}/${force.id}/${seasons}旬`;

  // 兩趟 —— 跟 actionSweepArgs 一樣:第一趟造出輜重隊/範本/心願,第二趟才掃得到。
  let broken = false;
  for (let pass = 0; pass < 2 && !broken; pass++)
  for (const sig of withArgs) {
    if (broken) break;
    const live = st.getState() as unknown as Record<string, unknown>;
    const fn = live[sig.name];
    if (typeof fn !== 'function') continue;
    const pools = buildPools(st.getState() as unknown as ArgWorld);
    const args: unknown[] = [];
    const seen = new Map<string, number>();
    let ok = true;
    for (const p of sig.params) {
      const kind = p.name.replace(/^(target|foe|my|to|from|source|dest|enemy)/, '').toLowerCase();
      const nth = seen.get(kind) ?? 0;
      seen.set(kind, nth + 1);
      const r = resolveArg(p.name, p.type, pools, nth, aliases);
      if (!r.ok) { if (p.optional) continue; ok = false; break; }
      args.push(r.value);
    }
    if (!ok) continue;

    const note = (kind: string, msg: string) => {
      const key = `${sig.name}|${kind}|${msg.slice(0, 90)}`;
      const prev = findings.get(key);
      if (prev) prev.hits++;
      else findings.set(key, { kind, msg, hits: 1, where });
    };
    const hadBattle = !!(st.getState() as unknown as { tacticalBattle?: unknown }).tacticalBattle;
    try {
      (fn as (...a: unknown[]) => unknown)(...args);
      const nowBattle = !!(st.getState() as unknown as { tacticalBattle?: unknown }).tacticalBattle;
      if (!hadBattle && nowBattle && process.env.FUZZ_TRACE) console.log(`\n  ${sig.name} 開了一場戰術會戰`);
    } catch (e) {
      note('拋例外', e instanceof Error ? e.message : String(e));
      continue;
    }
    const bad = checkInvariants();
    if (bad && process.env.FUZZ_TRACE) {
      const s2 = st.getState() as unknown as { cities: Record<string, { ownerForceId?: string }>; forces: Record<string, unknown> };
      const orphan = Object.entries(s2.cities).filter(([, c]) => c.ownerForceId && !s2.forces[c.ownerForceId]);
      console.log(`\n  兇手 ${sig.name}(${JSON.stringify(args).slice(0, 80)})`);
      console.log(`  孤兒城 ${orphan.slice(0, 3).map(([id, c]) => `${id}→${c.ownerForceId}`).join(', ')};現存勢力 ${Object.keys(s2.forces).join(',')}`);
    }
    if (bad) {
      /*
       * ⚠ 一破就跳到下一輪。**不跳的話後面每一個 action 都會繼承那個殘局**,
       * 一輪就報出八十幾種「不自洽」而其中只有第一個是兇手 ——
       * 第一版沒跳,10 輪報 83 種,全是同一句話。
       */
      note('世界不自洽', bad);
      broken = true;
      break;
    }
  }
  process.stdout.write(`\r第 ${round + 1}/${ROUNDS} 輪(${where})—— 目前 ${findings.size} 種`);
}

console.log('\n');
if (!findings.size) { console.log('搖完沒有新發現。'); process.exit(0); }
const rows = [...findings.entries()].sort((a, b) => b[1].hits - a[1].hits);
for (const [key, f] of rows) {
  console.log(`[${f.kind} ×${f.hits}] ${key.split('|')[0]}  (${f.where})\n    ${f.msg}`);
}
console.log(`\n共 ${findings.size} 種,${ROUNDS} 輪。`);
