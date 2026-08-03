import type { HeroicDeeds } from '../types/deeds';

/**
 * Officer-career standing (一代記) — the "rise from nobody" ladder.
 *
 * The ladder starts BELOW the nine ranks of office, because a career that
 * begins as a serving officer skips the part that makes the climb mean
 * anything. Two rungs sit under 九品:
 *
 *   11 白身 — a commoner. No office, no troops, no authority. You can travel,
 *             train, duel and take work, and that is all.
 *   10 部曲 — a great house's retainer. A dozen men answer to you.
 *
 * From 九品 up it is the historical ladder: 武官 → 大臣 → 太守 → 都督 →
 * 一方諸侯. Merit is derived purely from the deeds the game already tracks,
 * so none of this needs extra persisted state.
 */
export interface CareerStanding {
  merit: number;
  /** 11 白身 · 10 部曲 · 9 (lowest office) … 1 (highest). */
  rank: number;
  status: { zh: string; en: string };
  /** Merit needed for the next rank up (null at rank 1). */
  nextRankMerit: number | null;
  /** True below 九品 — no office at all, so most orders are closed off. */
  commoner: boolean;
}

/** Lowest rung. A new career starts here unless the scenario says otherwise. */
export const RANK_COMMONER = 11;
/** A great house's retainer — the first rung that commands anyone. */
export const RANK_RETAINER = 10;
/** 九品 — the lowest rung that is actually an office. */
export const RANK_LOWEST_OFFICE = 9;

export function meritFromDeeds(d: HeroicDeeds | undefined): number {
  if (!d) return 0;
  return (
    Math.floor((d.killsTroops ?? 0) / 100) +
    (d.battlesWon ?? 0) * 5 +
    (d.citiesTaken ?? 0) * 30 +
    (d.captured ?? 0) * 8 +
    (d.duelsWon ?? 0) * 4 +
    (d.espionageSuccess ?? 0) * 5 +
    (d.civicWorks ?? 0) * 3
  );
}

/**
 * Merit floor for each rank, listed from the bottom rung up:
 * index 0 = 白身(11), 1 = 部曲(10), 2 = 九品(9), … 10 = 一品(1).
 *
 * The first rungs are cheap on purpose — a commoner should feel movement
 * within their first campaign, or the opening is just chores. The top half
 * stretches out, because 都督 upward is meant to take a career.
 */
const RANK_FLOORS = [0, 6, 18, 40, 75, 130, 210, 320, 460, 620, 820];

export function rankForMerit(merit: number): number {
  // Walk from the top rank (1) down; the highest floor we clear is our rank.
  for (let i = RANK_FLOORS.length - 1; i >= 0; i--) {
    if (merit >= RANK_FLOORS[i]) return RANK_COMMONER - i;
  }
  return RANK_COMMONER;
}

function statusForRank(rank: number): { zh: string; en: string } {
  if (rank >= RANK_COMMONER) return { zh: '白身', en: 'Commoner' };
  if (rank >= RANK_RETAINER) return { zh: '部曲', en: 'Retainer' };
  if (rank === 1) return { zh: '一方諸侯', en: 'Grand Marshal' };
  if (rank <= 3) return { zh: '都督', en: 'Viceroy' };
  if (rank <= 5) return { zh: '太守', en: 'Governor' };
  if (rank <= 7) return { zh: '大臣', en: 'Minister' };
  return { zh: '武官', en: 'Officer' };
}

export function careerStanding(deeds: HeroicDeeds | undefined): CareerStanding {
  const merit = meritFromDeeds(deeds);
  const rank = rankForMerit(merit);
  const nextFloorIdx = RANK_COMMONER - rank + 1; // floor index for the next rank up
  const nextRankMerit =
    rank > 1 && nextFloorIdx < RANK_FLOORS.length ? RANK_FLOORS[nextFloorIdx] : null;
  return {
    merit,
    rank,
    status: statusForRank(rank),
    nextRankMerit,
    commoner: rank > RANK_LOWEST_OFFICE,
  };
}

/** Career status is senior enough to inherit/command a force (都督 and above). */
export function canInheritForce(standing: CareerStanding): boolean {
  return standing.rank <= 3;
}

/**
 * 品階特權 — concrete perks unlocked as the chronicle hero climbs the ladder.
 * Each entry is shown in the Chronicle screen; the mechanical ones are wired
 * where noted.
 */
export interface CareerPrivilege {
  zh: string;
  en: string;
  /** True once the officer's rank has unlocked it. */
  unlocked: boolean;
}

export function careerPrivileges(standing: CareerStanding): CareerPrivilege[] {
  const r = standing.rank;
  return [
    { zh: '游歷、習武、比試', en: 'Travel, train, duel', unlocked: true },
    { zh: '部曲二十人(部曲)', en: 'A retinue of twenty (Retainer)', unlocked: r <= RANK_RETAINER },
    { zh: '受命出陣、私兵百人(九品)', en: 'Take the field, 100 guards (Ninth Rank)', unlocked: r <= RANK_LOWEST_OFFICE },
    { zh: '私兵 +1000、可薦人(大臣)', en: 'Guard +1,000, may recommend (Minister)', unlocked: r <= 7 },
    { zh: '領一城內政、私兵 +3000(太守)', en: 'Govern a city, guard +3,000 (Governor)', unlocked: r <= 5 },
    { zh: '自主出征、私兵 +6000、可繼承勢力(都督)', en: 'Campaign at will, guard +6,000, may inherit (Viceroy)', unlocked: r <= 3 },
    { zh: '外交自專、可自立(一方諸侯)', en: 'Own diplomacy, may found a house (Grand Marshal)', unlocked: r === 1 },
  ];
}

/**
 * 私兵上限 — the hard ceiling the career hero's standing allows.
 *
 * Below 九品 this REPLACES the usual leadership×100 cap rather than adding to
 * it: a commoner with 90 leadership still cannot walk around with 9,000 men.
 * Rank is the ceiling; leadership decides whether you can reach it.
 */
export function careerGuardCap(standing: CareerStanding, leadership: number): number {
  const byLeadership = leadership * 100;
  const r = standing.rank;
  if (r >= RANK_COMMONER) return 0;              // 白身不得聚眾
  if (r >= RANK_RETAINER) return 20;
  const ceiling =
    r <= 3 ? byLeadership + 6000
      : r <= 5 ? byLeadership + 3000
        : r <= 7 ? byLeadership + 1000
          : 100;                                  // 九品/八品:百人隊
  return Math.min(byLeadership + 6000, ceiling);
}

/**
 * Extra 私兵 capacity the chronicle hero earns from their standing — a
 * renowned commander raises a larger household guard. Added on top of the
 * usual leadership×100 cap, for the career officer only.
 */
export function careerGuardCapBonus(standing: CareerStanding): number {
  const r = standing.rank;
  if (r <= 3) return 6000;
  if (r <= 5) return 3000;
  if (r <= 7) return 1000;
  return 0;
}
