/**
 * 內容目錄生成器 — 從 src/game/data + src/game/systems 抽取所有內容清單。產出兩份:
 *   1) docs/CATALOG.md     — 完整全量(每件名品/政策/戰法逐條),供查閱/grep。
 *   2) docs/GUIDE.md 附錄  — 可讀摘要(小集合全表 + 大集合統計、效果表與精選)。
 * 效果數字直接來自遊戲的同一真相源(policyEffects 的資料表、戰法類別/名戰表),
 * 因此文檔永不與遊戲脫節。重新生成:  npm run docs:catalog
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { ITEMS } from '../src/game/data/items';
import { SKILLS } from '../src/game/data/skills';
import { PRESTIGE_TITLES } from '../src/game/data/prestige';
import { CHALLENGES } from '../src/game/data/challenges';
import { SHIP_CLASSES } from '../src/game/data/ships';
import { ELITE_TROOPS } from '../src/game/data/eliteTroops';
import { CIVIC_TITLES, MILITARY_RANKS } from '../src/game/data/titles';
import { DEFENSE_BUILDINGS } from '../src/game/data/defenseBuildings';
import { SIEGE_ENGINES } from '../src/game/data/siegeEngines';
import {
  POLICY_DEFS, TACTIC_DEFS, POLICY_PREREQ, TACTIC_COMBOS,
  CATEGORY_BONUS, categoryOfTactic, isTacticSignature, tacticMasteryTier,
  type TacticCategory,
} from '../src/game/data/officerAttributes';
import { CATEGORY_TEMPLATE, SIGNATURE_OVERRIDES } from '../src/game/systems/personalTactics';
import { CITY_POLICY_EFFECTS, COMBAT_POLICY_EFFECTS, RECRUIT_POLICY_EFFECTS } from '../src/game/systems/policyEffects';
import { SCENARIOS } from '../src/game/data/scenarios';
import { SPECIALTY_DEFS, CITY_SPECIALTY, SPECIALTY_ROLE, ROLE_ZH } from '../src/game/data/specialties';

const here = dirname(fileURLToPath(import.meta.url));
const GUIDE = join(here, '..', 'docs', 'GUIDE.md');
const CATALOG = join(here, '..', 'docs', 'CATALOG.md');

const effTotal = (e: Record<string, number> | undefined) =>
  e ? Object.values(e).reduce((a, b) => a + (b as number), 0) : 0;
const effStr = (e: Record<string, number> | undefined) =>
  e ? Object.entries(e).map(([k, v]) => `${k.slice(0, 3).toUpperCase()}+${v}`).join(' ') : '';
const clean = (s?: string) => (s ?? '').replace(/\|/g, '/');
const pct = (d?: number) => (d == null ? '' : `${d >= 0 ? '+' : ''}${Math.round(d * 100)}%`);

const itemsByKind: Record<string, number> = {};
for (const it of ITEMS) itemsByKind[it.kind] = (itemsByKind[it.kind] ?? 0) + 1;
const policyN = Object.keys(POLICY_DEFS).length;
const tacticN = Object.keys(TACTIC_DEFS).length;
const siege = Object.values(SIEGE_ENGINES) as Array<{ name: { zh: string; en: string }; defenseMultiplier: number; descriptionZh?: string }>;
const defs = Object.values(DEFENSE_BUILDINGS) as Array<{ name: { zh: string; en: string }; goldCost: number; maxLevel: number; descriptionZh?: string }>;

const CAT_ZH: Record<TacticCategory, string> = {
  melee: '近戰', ranged: '遠射', mystic: '玄術', disrupt: '擾敵', strategy: '謀略',
};
const polZh = (id: string) => (POLICY_DEFS as Record<string, { zh: string; en: string }>)[id]?.zh ?? id;
const polEn = (id: string) => (POLICY_DEFS as Record<string, { zh: string; en: string }>)[id]?.en ?? '';
const prereqStr = (id: string) => {
  const ps = (POLICY_PREREQ as Record<string, string[]>)[id] ?? [];
  return ps.length ? ps.map(polZh).join('、') : '—';
};

// ─── 戰法 — 類別速查 / 組合 / 熟練度(摘要+全量共用)───
function tacticRefTables(): string[] {
  const L: string[] = [];
  L.push('', '戰法依**類別**決定底層效果、射程與冷卻;**名戰(★)**享更強的射程/冷卻/威力。',
    '持有的戰法越多,全戰法威力越高(熟練度);集齊特定組合再觸發額外戰力加成。');

  L.push('', '#### 類別速查 — 每個類別的屬性加成與底層戰法', '',
    '| 類別 | 屬性加成 | 底層戰法 | 射程 | 冷卻 |', '|---|---|---|---|---|');
  for (const cat of ['melee', 'ranged', 'mystic', 'disrupt', 'strategy'] as TacticCategory[]) {
    const b = CATEGORY_BONUS[cat];
    const t = CATEGORY_TEMPLATE[cat];
    const bonus = Object.entries(b).filter(([, v]) => v).map(([k, v]) => `${k.slice(0, 3).toUpperCase()}+${v}`).join(' ') || '—';
    L.push(`| ${CAT_ZH[cat]} ${cat} | ${bonus} | ${t.underlying} | ${t.range} | ${t.cooldown} |`);
  }

  L.push('', `#### 戰法組合 Combos(${TACTIC_COMBOS.length})— 同一方集齊全部戰法即觸發`, '',
    '| 組合 | 需集齊 | 戰力× | 觸發 |', '|---|---|---|---|');
  for (const c of TACTIC_COMBOS) {
    L.push(`| ${c.nameZh} ${c.nameEn} | ${c.tactics.join(' + ')} | ×${c.powerMul} | ${clean(c.textZh)} |`);
  }

  L.push('', '#### 熟練度 Mastery — 持有戰法數量決定全戰法威力', '',
    '| 階 | 條件(持有戰法數) | 戰力× |', '|---|---|---|');
  const tiers: Array<[number, string]> = [[12, '≥ 12'], [8, '8 – 11'], [4, '4 – 7'], [0, '0 – 3']];
  for (const [n, cond] of tiers) {
    const m = tacticMasteryTier(n);
    L.push(`| ${m.labelZh} ${m.labelEn} | ${cond} | ×${m.multiplier} |`);
  }
  return L;
}

// ─── 戰法 — 全 589 條逐條(僅 CATALOG)───
function tacticFullTable(): string[] {
  const L: string[] = ['', `#### 全戰法一覽(${tacticN})`, '',
    '| 戰法 | 類別 | ★ | 底層戰法 | 射程 | 冷卻 |', '|---|---|---|---|---|---|'];
  for (const tid of Object.keys(TACTIC_DEFS)) {
    const def = (TACTIC_DEFS as Record<string, { zh: string; en: string }>)[tid];
    const cat = categoryOfTactic(tid);
    const tpl = CATEGORY_TEMPLATE[cat];
    const sig = (SIGNATURE_OVERRIDES as Record<string, { underlying: string; range: number; cooldown: number }>)[tid];
    const underlying = sig?.underlying ?? tpl.underlying;
    const range = sig?.range ?? tpl.range;
    const cd = sig?.cooldown ?? tpl.cooldown;
    const star = isTacticSignature(tid) ? '★' : '';
    L.push(`| ${def.zh} ${def.en} | ${CAT_ZH[cat]} | ${star} | ${underlying} | ${range} | ${cd} |`);
  }
  return L;
}

// ─── 政策 — 三類效果表(摘要+全量共用)───
function policyEffectTables(): string[] {
  const L: string[] = [];
  const cityEntries = Object.entries(CITY_POLICY_EFFECTS) as Array<[string, { badge: string }]>;
  L.push('', `#### 內政效果 City Effects(${cityEntries.length})— 駐城武將持有即生效`, '',
    '| 政策 | 效果 | 前置 |', '|---|---|---|');
  for (const [id, eff] of cityEntries) L.push(`| ${polZh(id)} ${polEn(id)} | ${eff.badge} | ${prereqStr(id)} |`);

  const combatEntries = Object.entries(COMBAT_POLICY_EFFECTS) as Array<[string, { badge: string; waterBadge?: string; terrain?: string[]; waterFireMul?: number }]>;
  L.push('', `#### 戰鬥效果 Combat Effects(${combatEntries.length})— 出戰武將持有即生效`, '',
    '| 政策 | 效果 | 地形 | 前置 |', '|---|---|---|---|');
  for (const [id, eff] of combatEntries) {
    const terr = eff.terrain ? eff.terrain.join('/') : eff.waterFireMul != null ? '全地形(水戰加強)' : '全地形';
    const badge = eff.badge + (eff.waterBadge ? ` / 水:${eff.waterBadge}` : '');
    L.push(`| ${polZh(id)} ${polEn(id)} | ${badge} | ${terr} | ${prereqStr(id)} |`);
  }

  const recEntries = Object.entries(RECRUIT_POLICY_EFFECTS) as Array<[string, { badge?: string; searchSuccessBonus?: number; recruitTroopMul?: number }]>;
  L.push('', `#### 招募效果 Recruitment Effects(${recEntries.length})— 全勢力武將持有即生效`, '',
    '| 政策 | 效果 | 前置 |', '|---|---|---|');
  for (const [id, eff] of recEntries) {
    const label = eff.badge ?? [
      eff.searchSuccessBonus ? `招攬 ${pct(eff.searchSuccessBonus)}` : '',
      eff.recruitTroopMul ? `兵質 ${pct(eff.recruitTroopMul)}` : '',
    ].filter(Boolean).join(' ');
    L.push(`| ${polZh(id)} ${polEn(id)} | ${label} | ${prereqStr(id)} |`);
  }
  return L;
}

// ─── 政策 — 其餘科技/制度節點(僅 CATALOG)───
function policyRestTable(): string[] {
  const effIds = new Set([
    ...Object.keys(CITY_POLICY_EFFECTS),
    ...Object.keys(COMBAT_POLICY_EFFECTS),
    ...Object.keys(RECRUIT_POLICY_EFFECTS),
  ]);
  const rest = Object.keys(POLICY_DEFS).filter((id) => !effIds.has(id));
  const L: string[] = ['', `#### 制度 / 科技節點(${rest.length})— 解鎖前置、提供威望或劇情效果`, '',
    '| 政策 | 前置 |', '|---|---|'];
  for (const id of rest) L.push(`| ${polZh(id)} ${polEn(id)} | ${prereqStr(id)} |`);
  return L;
}

// ─── shared small-set tables (used in both summary and full) ───
function smallTables(): string[] {
  const L: string[] = [];
  L.push('', `### 技能 Skills(${SKILLS.length})`, '', '| 技 | 類別 | 說明 |', '|---|---|---|');
  for (const sk of SKILLS) L.push(`| ${sk.name.zh} ${sk.name.en} | ${(sk as { category?: string }).category ?? ''} | ${clean(sk.descriptionZh)} |`);

  L.push('', `### 威名 Prestige(${PRESTIGE_TITLES.length})`, '', '| 威名 | 路線 | 效果 |', '|---|---|---|');
  for (const p of PRESTIGE_TITLES) {
    const e = p.effects as { duelBonus?: number; combatPowerMul?: number; incomeMul?: number };
    const parts = [e.duelBonus ? `單挑+${e.duelBonus}` : '', e.combatPowerMul && e.combatPowerMul !== 1 ? `戰力×${e.combatPowerMul}` : '', e.incomeMul && e.incomeMul !== 1 ? `收入×${e.incomeMul}` : ''].filter(Boolean).join(' ');
    L.push(`| ${p.name.zh} ${p.name.en} | ${(p as { path?: string }).path ?? ''} | ${parts} |`);
  }

  L.push('', `### 官職 Civic Titles(${CIVIC_TITLES.length})`, '', '| 官職 | 主屬性 | 效果 |', '|---|---|---|');
  for (const c of CIVIC_TITLES) L.push(`| ${c.name.zh} ${c.name.en} | ${(c as { primaryStat?: string }).primaryStat ?? ''} | ${clean(c.descriptionZh)} |`);

  L.push('', `### 軍階 Military Ranks(${MILITARY_RANKS.length})`, '', MILITARY_RANKS.map((r) => r.name.zh).join(' → '));

  L.push('', `### 船級 Ship Classes(${SHIP_CLASSES.length})`, '', '| 船 | 造價 | 工期 | 戰力 | 載量 |', '|---|---|---|---|---|');
  for (const s of SHIP_CLASSES) L.push(`| ${s.name.zh} ${s.name.en} | ${s.goldCost} | ${s.seasonsToBuild} | ${s.combatStrength} | ${(s as { capacity?: number }).capacity ?? '—'} |`);

  L.push('', `### 精兵 Elite Troops(${ELITE_TROOPS.length})`, '', '| 精兵 | 戰力× | 損耗× | 武力+ |', '|---|---|---|---|');
  for (const e of ELITE_TROOPS) L.push(`| ${e.name.zh} ${e.name.en} | ${e.powerMultiplier} | ${(e as { ownLossMultiplier?: number }).ownLossMultiplier ?? '—'} | ${(e as { warBonus?: number }).warBonus ?? 0} |`);

  L.push('', `### 攻城器械 Siege Engines(${siege.length})`, '', '| 器械 | 守備× | 說明 |', '|---|---|---|');
  for (const s of siege) L.push(`| ${s.name.zh} ${s.name.en} | ${s.defenseMultiplier} | ${clean(s.descriptionZh)} |`);

  L.push('', `### 城防設施 Defense Buildings(${defs.length})`, '', '| 設施 | 造價 | 上限級 | 說明 |', '|---|---|---|---|');
  for (const d of defs) L.push(`| ${d.name.zh} ${d.name.en} | ${d.goldCost} | ${d.maxLevel} | ${clean(d.descriptionZh).slice(0, 60)} |`);

  L.push('', `### 英雄模式挑戰 Hero-Mode Challenges(${CHALLENGES.length})`, '', '| 挑戰 | 難度 | 劇本 | 期限 |', '|---|---|---|---|');
  for (const c of CHALLENGES) L.push(`| ${c.name.zh} ${c.name.en} | ${(c as { difficulty?: string }).difficulty ?? ''} | ${c.scenarioId} | ${(c as { deadlineYear?: number }).deadlineYear ?? '—'} |`);

  const byKind = new Map<string, string[]>();
  for (const s of SCENARIOS) {
    const k = (s as { kind?: string }).kind ?? 'historical';
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(`${s.name.zh}(${s.startDate.year})`);
  }
  L.push('', `### 劇本 Scenarios(${SCENARIOS.length})`, '');
  for (const [k, names] of byKind) L.push(`- **${k}**(${names.length}):${names.join('、')}`);

  // 名產名物 — each signature good's premium, strategic role, and producer count.
  const prodCount: Record<string, number> = {};
  for (const sid of Object.values(CITY_SPECIALTY)) prodCount[sid] = (prodCount[sid] ?? 0) + 1;
  const specIds = Object.keys(SPECIALTY_DEFS) as Array<keyof typeof SPECIALTY_DEFS>;
  L.push('', `### 名產名物 Specialties(${specIds.length} 物 · ${Object.keys(CITY_SPECIALTY).length} 城)— 戰略物資見 §1.9`, '',
    '| 名產 | 戰略物資 | 商利 | 糧產 | 產地數 | 註 |', '|---|---|---|---|---|---|');
  for (const id of specIds) {
    const d = SPECIALTY_DEFS[id];
    const role = SPECIALTY_ROLE[id];
    L.push(`| ${d.glyph} ${d.zh} | ${role ? ROLE_ZH[role] : '—'} | ${d.goldMul > 1 ? pct(d.goldMul - 1) : '—'} | ${d.foodMul > 1 ? pct(d.foodMul - 1) : '—'} | ${prodCount[id] ?? 0} | ${clean(d.noteZh)} |`);
  }
  return L;
}

// ─── GUIDE summary block ───
const summary: string[] = [];
summary.push(
  '> 完整全量(全部 1273 名品逐條 / 全 589 戰法 / 全部政策科技節點)見 **[docs/CATALOG.md](CATALOG.md)**;此處為可讀摘要,但政策與戰法的**效果數字皆為全量**。',
  '',
  '### 內容總量',
  '',
  '| 類別 | 數量 |',
  '|---|---|',
  `| 名品 Items | ${ITEMS.length}(${Object.entries(itemsByKind).map(([k, n]) => `${k} ${n}`).join(' / ')}) |`,
  `| 政策 Policies | ${policyN} |`,
  `| 戰法 Tactics | ${tacticN} |`,
  `| 技能 Skills | ${SKILLS.length} |`,
  `| 威名 Prestige | ${PRESTIGE_TITLES.length} |`,
  `| 官職 Civic Titles | ${CIVIC_TITLES.length} |`,
  `| 船級 Ships | ${SHIP_CLASSES.length} |`,
  `| 精兵 Elite | ${ELITE_TROOPS.length} |`,
  `| 攻城器械 Siege | ${siege.length} |`,
  `| 城防設施 Defense | ${defs.length} |`,
  `| 英雄挑戰 Challenges | ${CHALLENGES.length} |`,
  `| 劇本 Scenarios | ${SCENARIOS.length} |`,
  `| 名產 Specialties | ${Object.keys(SPECIALTY_DEFS).length} 物 / ${Object.keys(CITY_SPECIALTY).length} 城 |`,
);
// 名品精選 — top 30 by effect total
const topItems = [...ITEMS].sort((a, b) => effTotal(b.effects as Record<string, number>) - effTotal(a.effects as Record<string, number>)).slice(0, 30);
summary.push('', '### 名品精選(加成最高 30 件,全 1273 件見 CATALOG)', '', '| 名 | 類 | 出處城 | 加成 |', '|---|---|---|---|');
for (const it of topItems) summary.push(`| ${it.name.zh} | ${it.kind} | ${it.originCityId ?? '—'} | ${effStr(it.effects as Record<string, number>)} |`);
// 政策效果(全量效果表)+ 戰法機制(類別/組合/熟練度)
summary.push('', `### 政策 Policies — 效果一覽(${policyN} 項,科技節點全表見 CATALOG)`);
summary.push(...policyEffectTables());
summary.push('', `### 戰法 Tactics — 機制總覽(${tacticN} 條,逐條表見 CATALOG)`);
summary.push(...tacticRefTables());
summary.push(...smallTables());

// ─── CATALOG.md full dump ───
const full: string[] = [
  '# 三國志大師 · 完整內容目錄(機器生成)',
  '',
  '> 由 `scripts/gen-catalog.ts` 自動生成,請勿手改;重生成:`npm run docs:catalog`。',
  '> 可讀摘要見 [GUIDE.md](GUIDE.md) 附錄。',
];
full.push('', `## 名品 Items(${ITEMS.length})`, '', '| 名 | 類 | 出處城 | 加成 |', '|---|---|---|---|');
for (const it of ITEMS) full.push(`| ${it.name.zh} ${it.name.en} | ${it.kind} | ${it.originCityId ?? '—'} | ${effStr(it.effects as Record<string, number>)} |`);
full.push('', `## 政策 Policies(${policyN})`);
full.push(...policyEffectTables());
full.push(...policyRestTable());
full.push('', `## 戰法 Tactics(${tacticN})`);
full.push(...tacticRefTables());
full.push(...tacticFullTable());
full.push(...smallTables());

writeFileSync(CATALOG, full.join('\n') + '\n');

const md = readFileSync(GUIDE, 'utf8');
writeFileSync(GUIDE, md.replace(
  /<!-- CATALOG:START -->[\s\S]*<!-- CATALOG:END -->/,
  `<!-- CATALOG:START -->\n${summary.join('\n')}\n<!-- CATALOG:END -->`,
));
console.log(`CATALOG.md: ${full.length} lines · GUIDE summary: ${summary.length} lines`);
