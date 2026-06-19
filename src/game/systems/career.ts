import type { HeroicDeeds } from '../types/deeds';

/**
 * Officer-career standing (一代記) — the RTK13 "rise from nobody" ladder. The
 * career officer accumulates 功績 (merit) from their deeds, which advances them
 * up a 9→1 rank and through statuses: 武官 → 大臣 → 太守 → 都督 → 一方諸侯.
 * Derived purely from the deeds the game already tracks, so it needs no extra
 * persisted state.
 */
export interface CareerStanding {
  merit: number;
  rank: number; // 9 (lowest) … 1 (highest)
  status: { zh: string; en: string };
  /** Merit needed for the next rank up (null at rank 1). */
  nextRankMerit: number | null;
}

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

// Merit at which each rank (9→1) is reached. Index 0 = rank 9's floor.
const RANK_FLOORS = [0, 10, 30, 70, 130, 210, 320, 460, 600];

export function rankForMerit(merit: number): number {
  // Walk from the top rank (1) down; the highest floor we clear is our rank.
  for (let i = RANK_FLOORS.length - 1; i >= 0; i--) {
    if (merit >= RANK_FLOORS[i]) return 9 - i;
  }
  return 9;
}

function statusForRank(rank: number): { zh: string; en: string } {
  if (rank === 1) return { zh: '一方諸侯', en: 'Grand Marshal' };
  if (rank <= 3) return { zh: '都督', en: 'Viceroy' };
  if (rank <= 5) return { zh: '太守', en: 'Governor' };
  if (rank <= 7) return { zh: '大臣', en: 'Minister' };
  return { zh: '武官', en: 'Officer' };
}

export function careerStanding(deeds: HeroicDeeds | undefined): CareerStanding {
  const merit = meritFromDeeds(deeds);
  const rank = rankForMerit(merit);
  const nextFloorIdx = 9 - rank + 1; // floor index for the next rank up
  const nextRankMerit = rank > 1 && nextFloorIdx < RANK_FLOORS.length ? RANK_FLOORS[nextFloorIdx] : null;
  return { merit, rank, status: statusForRank(rank), nextRankMerit };
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
    { zh: '統兵征戰', en: 'Lead troops in the field', unlocked: true },
    { zh: '私兵 +1000(大臣)', en: 'Private guard +1,000 (Minister)', unlocked: r <= 7 },
    { zh: '私兵 +3000(太守)', en: 'Private guard +3,000 (Governor)', unlocked: r <= 5 },
    { zh: '私兵 +6000、可繼承勢力(都督)', en: 'Private guard +6,000, may inherit a force (Viceroy)', unlocked: r <= 3 },
    { zh: '一方諸侯,獨斷專行', en: 'A lord in your own right (Grand Marshal)', unlocked: r === 1 },
  ];
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
