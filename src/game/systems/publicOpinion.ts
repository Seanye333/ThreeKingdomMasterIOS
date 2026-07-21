/**
 * 鄉論・清議 (§3.7) — what the district says about you, and what that is worth.
 *
 * 月旦評 (§3.5) already grades individual men and 文名 (§6.15) measures a
 * scholar's renown. Neither says anything about the *place*. In a period where
 * office ran through 察舉 — local worthies recommending local men — the standing
 * of a district was the mechanism by which talent either came forward or stayed
 * home. 潁川 produced a generation of statesmen not because its water was
 * special but because its 鄉論 was a functioning institution.
 *
 * This is that number, and deliberately it is **derived, not stored**: a city's
 * standing is exactly the sum of how it is currently governed —
 *
 *   民心 · 文教 · 律令(峻法壓不出清議,寬刑放縱之)· 貪腐 · 積案 ·
 *   有無名士坐鎮(一個高智高魅的人在城裡,鄉論自然向他集中)
 *
 * so it needs no save field, cannot desync, and improves the moment you govern
 * better. What it buys: 訪賢 finds people, the men you find will actually come,
 * and 察舉/九品 recommendations out of that district are worth having.
 */
import type { City, Officer } from '../types';

export interface EsteemInput {
  city: City;
  /** Officers of the owning force stationed in the city. */
  residents?: ReadonlyArray<Officer>;
  /** 律令 (§1.11). */
  lawSeverity?: string;
}

/**
 * 鄉論 0–100. 50 is an ordinary district nobody has an opinion about.
 */
export function localEsteem(input: EsteemInput): number {
  const c = input.city;
  let v = 34;
  v += (c.loyalty - 50) * 0.28;               // 民心所向
  v += Math.min(18, (c.culture ?? 0) * 0.22); // 文教之盛
  v -= Math.min(16, (c.corruption ?? 0) * 0.16);
  v -= Math.min(10, (c.caseload ?? 0) * 0.1); // 訟獄不清,鄉論不出
  // 峻法之下無清議; 寬刑則清議浮濫而不實.
  if (input.lawSeverity === 'strict') v -= 6;
  else if (input.lawSeverity === 'lenient') v += 2;
  // 名士坐鎮 — a man of parts in residence gathers the district's talk to himself.
  const best = (input.residents ?? []).reduce(
    (m, o) => Math.max(m, (o.stats.intelligence + o.stats.charisma) / 2), 0);
  v += Math.min(14, Math.max(0, best - 60) * 0.35);
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

export function esteemTier(esteem: number): { zh: string; en: string } {
  if (esteem >= 78) return { zh: '衣冠淵藪', en: 'A Nursery of Talent' };
  if (esteem >= 60) return { zh: '鄉論稱美', en: 'Well Spoken Of' };
  if (esteem >= 40) return { zh: '鄉里尋常', en: 'Unremarkable' };
  if (esteem >= 22) return { zh: '士人不至', en: 'Shunned by the Gentry' };
  return { zh: '為鄉里所鄙', en: 'Despised in the District' };
}

export interface EsteemEffects {
  /** Multiplier on 搜索人才 success. */
  searchMul: number;
  /** Added chance a found/approached man actually takes service (0–1 scale). */
  recruitBonus: number;
  /** Bonus on the grade a 察舉/九品 recommendation out of this district earns. */
  recommendBonus: number;
  badgeZh: string;
  badgeEn: string;
}

export function esteemEffects(esteem: number): EsteemEffects {
  const t = (Math.max(0, Math.min(100, esteem)) - 50) / 50; // −1 … +1
  const searchMul = Math.round((1 + t * 0.35) * 1000) / 1000;
  const recruitBonus = Math.round(t * 0.1 * 1000) / 1000;
  const recommendBonus = Math.round(t * 6 * 10) / 10;
  return {
    searchMul,
    recruitBonus,
    recommendBonus,
    badgeZh: t >= 0.4 ? '訪賢易得,士人樂仕' : t <= -0.4 ? '賢者裹足,訪之無獲' : '鄉論平平',
    badgeEn: t >= 0.4 ? 'Talent comes forward and takes service gladly'
      : t <= -0.4 ? 'The worthy keep their doors shut' : 'An ordinary district',
  };
}
