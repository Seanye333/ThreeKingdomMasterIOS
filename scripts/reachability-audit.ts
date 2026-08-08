/**
 * 可及性體檢 —— **取得型主目標,AI 的評分函式會不會把那座城列進候選**。
 *
 * ## 為什麼要有它
 *
 * `objective-sweep.ts` 要跑一個鐘頭才告訴你「這條目標是死的」,而其中有一整類
 * 是**靜態就算得出來**的:`pickForceTarget`(systems/ai.ts)只把
 *
 *     壓力 = Σ(相鄰己方城 troops × 0.6)
 *     effDef = 目標城 troops × (1 + defense / 200)
 *     feasibility = 壓力 / effDef
 *
 * 中 `feasibility ≥ 1.05` 的城列進候選。低於門檻的城 **AI 一輩子不會去打**
 * —— 不是難,是根本不在名單裡。逐盤體檢時撞到三條(2026-08-08):
 *
 *   189 十常侍「挾持宮禁」要洛陽:三城合兵不到九千,壓力 4,950 / effDef 11,700 = 0.42
 *   189 孫堅「江東猛虎」要襄陽:兩座城都不與襄陽相鄰,壓力 **0**
 *   189 曹操「取許昌」:只有陳留一座相鄰,0.54
 *
 * 三條都要跑滿 12 輪才在報告上顯示 0/12,而這支腳本一秒鐘就指出來。
 *
 * ## 讀法
 *
 * 這是**診斷**,不是硬性規則 —— 開局算不到不代表永遠算不到:AI 打下鄰城之後
 * 壓力會變。判準是:
 *
 *   - `壓力 0`(完全不相鄰)幾乎一定是死的 —— 除非中間那幾座城會先易主。
 *   - `0 < feasibility < 1.05` 要看那一家會不會長大;小國多半不會。
 *   - 玩家目標另當別論:**玩家可以集中兵力,AI 不會**。次要目標寫成
 *     「你做得到而 AI 做不到」的事是刻意的,主目標不該是。
 *
 * Run: node --import tsx scripts/reachability-audit.ts [scenarioIdPrefix]
 */

const PREFIX = process.argv[2] ?? '';

async function main() {
  const { SCENARIOS } = await import('../src/game/data/scenarios');
  const { SCENARIO_OBJECTIVES } = await import('../src/game/data/objectives');

  type Goal = { kind: string; cityIds?: string[]; provinceId?: string; byYear?: number };
  const rows: Array<{ sid: string; zh: string; fid: string; title: string; detail: string; worst: number }> = [];
  let checked = 0;

  for (const sc of SCENARIOS) {
    if (PREFIX && !sc.id.startsWith(PREFIX)) continue;
    const objs = (SCENARIO_OBJECTIVES as Record<string, Array<{
      forceId: string; primary: { title: { zh: string }; goal: Goal };
    }>>)[sc.id] ?? [];
    if (!objs.length) continue;

    const byId = Object.fromEntries(sc.cities.map((c) => [c.id, c]));
    for (const o of objs) {
      const g = o.primary.goal;
      if (g.kind !== 'hold-cities' || !g.cityIds) continue;
      // 開局就據有的城不算 —— 那是守成,不必打
      const toTake = g.cityIds.filter((id) => byId[id]?.ownerForceId !== o.forceId);
      if (!toTake.length) continue;
      checked++;

      const parts: string[] = [];
      let worst = Infinity;
      for (const targetId of toTake) {
        const target = byId[targetId];
        if (!target) { parts.push(`${targetId}=城不存在`); worst = 0; continue; }
        let pressure = 0;
        for (const c of sc.cities) {
          if (c.ownerForceId !== o.forceId) continue;
          if (!c.adjacentCityIds?.includes(targetId)) continue;
          pressure += c.troops * 0.6;
        }
        const effDef = target.troops * (1 + target.defense / 200);
        const f = pressure / Math.max(1, effDef);
        if (f < worst) worst = f;
        parts.push(`${targetId} ${f.toFixed(2)}${pressure === 0 ? '(不相鄰)' : ''}`);
      }
      if (worst < 1.05) {
        rows.push({
          sid: sc.id, zh: sc.name.zh, fid: o.forceId,
          title: o.primary.title.zh, detail: parts.join(' '), worst,
        });
      }
    }
  }

  rows.sort((a, b) => a.worst - b.worst);
  console.log('=== 取得型主目標的開局可及性(feasibility < 1.05 = AI 的候選名單裡沒有它)===\n');
  const unreachable = rows.filter((r) => r.worst === 0);
  const marginal = rows.filter((r) => r.worst > 0);
  console.log(`--- 壓力 0:完全不相鄰,${unreachable.length} 條 ---`);
  for (const r of unreachable) {
    console.log(`  ${r.zh}(${r.sid}) / ${r.fid} 「${r.title}」 — ${r.detail}`);
  }
  console.log(`\n--- 相鄰但推不動(0 < f < 1.05),${marginal.length} 條 ---`);
  for (const r of marginal) {
    console.log(`  ${r.zh}(${r.sid}) / ${r.fid} 「${r.title}」 — ${r.detail}`);
  }
  console.log(`\n檢查了 ${checked} 條取得型主目標,其中 ${rows.length} 條開局在 AI 的候選門檻之下。`);
}

main();
