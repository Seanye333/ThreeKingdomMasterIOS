import type { City, EntityId, Officer } from '../types';
import { totalLevel } from './growth';

/**
 * 星級覺醒軌 — the card game's ascension track. Every officer can climb
 * 0→6★ by deliberate investment (gold, gated by growth level); each star
 * gently amplifies the officer's 品階威儀 (see gradeCombat.ts, which folds
 * starCombatDelta into gradeCombatBonus), and the sixth star is 覺醒 — a
 * one-time +2 to the officer's strongest stat. Numbers stay modest: a full
 * 6★ is +3% power / +6 duel prowess-adjacent, a polish on an elite rather
 * than a second grade system.
 */

export const MAX_STARS = 6;

/** Gold to buy star n+1 (index by current stars). A late star costs real money. */
export const STAR_GOLD_COST = [400, 700, 1100, 1600, 2200, 3000];

/** 成長等級 (§2.1 growth level, 1–9 from XP) required to hold star n+1 —
 *  the track rewards officers who have actually been fielded and drilled. */
export const STAR_LEVEL_REQ = [2, 3, 4, 6, 8, 9];

/** 名將殘卷 to 煉星 star n+1 (index by current stars) — the gold-free path:
 *  scrolls drop from 求賢祭 reveals, so a patient collector can ascend an
 *  officer without spending a coin (the growth-level gate still holds). Costs
 *  escalate with STAR_GOLD_COST so a late star is a real hoard of fragments. */
export const STAR_SCROLL_COST = [3, 5, 7, 10, 14, 20];

export function scrollStarCost(stars: number): number {
  const s = Math.max(0, Math.min(MAX_STARS - 1, stars));
  return STAR_SCROLL_COST[s];
}

export function officerStars(o: Officer): number {
  return Math.max(0, Math.min(MAX_STARS, o.stars ?? 0));
}

/** The per-star amplification folded into 品階威儀 (gradeCombat.ts). */
export function starCombatDelta(stars: number): {
  powerMul: number; morale: number; duelBonus: number;
  debatePoise: number; duelStamina: number; damageResist: number;
} {
  const s = Math.max(0, Math.min(MAX_STARS, stars));
  return {
    powerMul: s * 0.005,             // 6★ = +3% power
    morale: Math.floor(s / 2),       // +1 per 2 stars
    duelBonus: s,                    // +1 prowess per star
    debatePoise: Math.floor(s / 2),
    duelStamina: s * 2,
    damageResist: s * 0.005,         // 6★ = +3% mitigation
  };
}

/** Can this officer buy their next star? Reports the price and the blocker. */
export function nextStarRequirement(o: Officer): {
  next: number; cost: number; levelReq: number; ok: boolean;
  reasonZh: string | null; reasonEn: string | null;
} {
  const s = officerStars(o);
  if (s >= MAX_STARS) {
    return { next: s, cost: 0, levelReq: 0, ok: false, reasonZh: '已臻六星,將星圓滿', reasonEn: 'Already at six stars' };
  }
  const cost = STAR_GOLD_COST[s];
  const levelReq = STAR_LEVEL_REQ[s];
  if (totalLevel(o.xp ?? 0) < levelReq) {
    return { next: s + 1, cost, levelReq, ok: false, reasonZh: `歷練不足 — 需成長 ${levelReq} 級`, reasonEn: `Needs growth level ${levelReq}` };
  }
  return { next: s + 1, cost, levelReq, ok: true, reasonZh: null, reasonEn: null };
}

/**
 * 升星 — one star up, applied immutably. Reaching the sixth star is 覺醒:
 * the officer's strongest stat rises +2 (capped at 150), once, forever.
 */
export function applyStarUp(o: Officer): { officer: Officer; awakened: boolean } {
  const s = officerStars(o);
  if (s >= MAX_STARS) return { officer: o, awakened: false };
  const next: Officer = { ...o, stars: s + 1 };
  if (next.stars === MAX_STARS) {
    const keys = ['war', 'leadership', 'intelligence', 'politics', 'charisma'] as const;
    let bestKey: typeof keys[number] = 'war';
    for (const k of keys) if (next.stats[k] > next.stats[bestKey]) bestKey = k;
    next.stats = { ...next.stats, [bestKey]: Math.min(150, next.stats[bestKey] + 2) };
    return { officer: next, awakened: true };
  }
  return { officer: next, awakened: false };
}

/**
 * 將星漸昇 — the AI walks the same track (one officer per force per season,
 * 30% of seasons, paid from its richest city like every other AI project),
 * so enemy elites shine too and the passive stays symmetric.
 */
export function planAiStarInvestments(params: {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null;
  rng: () => number;
}): Array<{ officerId: EntityId; cityId: EntityId; cost: number }> {
  const { officers, cities, playerForceId, rng } = params;
  const richestByForce = new Map<EntityId, City>();
  for (const c of Object.values(cities)) {
    if (!c.ownerForceId || c.ownerForceId === playerForceId) continue;
    const cur = richestByForce.get(c.ownerForceId);
    if (!cur || c.gold > cur.gold) richestByForce.set(c.ownerForceId, c);
  }
  const acts: Array<{ officerId: EntityId; cityId: EntityId; cost: number }> = [];
  for (const [fid, city] of richestByForce) {
    if (rng() >= 0.3) continue;
    // The force's finest still-climbable officer — the star goes to the ace.
    let best: Officer | null = null;
    for (const o of Object.values(officers)) {
      if (o.forceId !== fid || o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
      if (!nextStarRequirement(o).ok) continue;
      if (!best || o.stats.war + o.stats.leadership > best.stats.war + best.stats.leadership) best = o;
    }
    if (!best) continue;
    const { cost } = nextStarRequirement(best);
    // Same affordability bar the AI uses for 特訓: keep a healthy reserve.
    if (city.gold < cost * 2) continue;
    acts.push({ officerId: best.id, cityId: city.id, cost });
  }
  return acts;
}
