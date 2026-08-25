const g = globalThis as unknown as { localStorage?: unknown };
if (!g.localStorage) { const m = new Map<string,string>(); g.localStorage = { getItem:(k:string)=>m.get(k)??null, setItem:(k:string,v:string)=>void m.set(k,v), removeItem:(k:string)=>void m.delete(k), clear:()=>m.clear(), key:()=>null, length:0 }; }
import { useGameStore } from '../src/game/state/store';
import { SCENARIOS } from '../src/game/data/scenarios';
import { readActionSignatures, literalAliases } from './store-action-signatures';
import { buildPools, resolveArg, type ArgWorld } from '../src/game/state/actionArgs';
const st = useGameStore; const sc = SCENARIOS[0];
st.getState().loadScenario(sc, sc.forces[0].id, 'normal');
for (let i=0;i<3;i++) st.getState().endSeason();
const { sigs } = readActionSignatures(); const aliases = literalAliases();
const pools = buildPools(st.getState() as unknown as ArgWorld);
const rows: string[] = [];
for (const s of sigs) {
  if (!s.params.length) continue;
  const seen = new Map<string, number>();
  for (const p of s.params) {
    const kind = p.name.replace(/^(target|foe|my|to|from|source|dest|enemy)/, '').toLowerCase();
    const nth = seen.get(kind) ?? 0; seen.set(kind, nth+1);
    const r = resolveArg(p.name, p.type, pools, nth, aliases);
    if (!r.ok && !p.optional) { rows.push(`${s.name}\t${p.name}\t${p.type.replace(/\s+/g,' ').slice(0,60)}`); break; }
  }
}
console.log(rows.join('\n'));
