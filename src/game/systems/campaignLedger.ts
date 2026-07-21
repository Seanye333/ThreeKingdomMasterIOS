/**
 * 糧秣簿 (§4.9) — the arithmetic every commander in the period did before he
 * moved, and that this game has so far done silently behind the player's back.
 *
 * 隨軍糧 already worked: a column draws rations from its source city when it
 * sets out, eats a season's worth each season, and starts shedding men the
 * season it runs dry (see convoy.ts). What was missing is that the player could
 * not *see* any of it. You picked a number of troops, pressed 出陣, and found
 * out four seasons later on the far side of a mountain range.
 *
 * This is the ledger, computed before you commit: what the journey needs, what
 * the city can actually spare, how many seasons that covers, and — the number
 * nobody remembers to check — how long the city itself can feed its remaining
 * garrison once you have taken the grain out of it.
 *
 * Pure and read-only. It changes no state; it only tells the truth in advance.
 */
import { FOOD_PER_TROOP_PER_SEASON } from './economy';
import { provisionNeeded } from './convoy';

export type LedgerVerdict = 'ample' | 'tight' | 'short';

export interface MarchLedger {
  /** Grain the planned journey wants. */
  need: number;
  /** Grain the source city can actually hand over. */
  drawn: number;
  /** Seasons the column can march on what it carries. */
  seasonsCovered: number;
  /** Seasons the journey is planned to take. */
  seasonsPlanned: number;
  /** Grain the column will be short by (0 if provisioned in full). */
  shortfall: number;
  /** Grain left in the city after provisioning. */
  cityFoodLeft: number;
  /** Seasons the city's remaining garrison can eat on what's left. */
  citySeasonsLeft: number;
  verdict: LedgerVerdict;
  noteZh: string;
  noteEn: string;
}

const seasonsOf = (food: number, troops: number): number =>
  troops <= 0 ? Infinity : Math.floor(food / (troops * FOOD_PER_TROOP_PER_SEASON));

/**
 * Work the ledger for a column about to march.
 *
 * `carried` is grain the column already holds (a re-dispatch of a standing
 * army); leave it undefined for a fresh muster out of the city.
 */
export function marchLedger(args: {
  troops: number;
  seasonsPlanned: number;
  cityFood: number;
  cityTroops: number;
  carried?: number;
}): MarchLedger {
  const seasonsPlanned = Math.max(1, Math.round(args.seasonsPlanned));
  const need = provisionNeeded(args.troops, seasonsPlanned);
  const carried = Math.max(0, args.carried ?? 0);
  const wanted = Math.max(0, need - carried);
  const drawn = Math.min(Math.max(0, args.cityFood), wanted);
  const total = carried + drawn;
  const seasonsCovered = seasonsOf(total, args.troops);
  const shortfall = Math.max(0, need - total);
  const cityFoodLeft = Math.max(0, args.cityFood - drawn);
  const garrisonLeft = Math.max(0, args.cityTroops - args.troops);
  const citySeasonsLeft = seasonsOf(cityFoodLeft, garrisonLeft);

  // 出師之前先問糧 — the two ways this goes wrong are the column starving on the
  // road and the city starving behind it. Both are verdict-worthy.
  let verdict: LedgerVerdict = 'ample';
  if (shortfall > 0 || seasonsCovered < seasonsPlanned) verdict = 'short';
  else if (citySeasonsLeft <= 1 || seasonsCovered <= 1) verdict = 'tight';

  const zh = verdict === 'short'
    ? `糧不足行 — 隨軍糧僅支 ${seasonsCovered} 季,途中將乏食(缺 ${shortfall.toLocaleString()} 石)`
    : verdict === 'tight'
      ? `僅堪一行 — 隨軍糧支 ${seasonsCovered} 季,本城餘糧支 ${citySeasonsLeft === Infinity ? '∞' : citySeasonsLeft} 季`
      : `糧秣充足 — 隨軍糧支 ${seasonsCovered} 季(行程 ${seasonsPlanned} 季),本城尚餘 ${cityFoodLeft.toLocaleString()} 石`;
  const en = verdict === 'short'
    ? `Under-provisioned — rations for ${seasonsCovered} seasons, short by ${shortfall.toLocaleString()}`
    : verdict === 'tight'
      ? `Just enough — rations for ${seasonsCovered} seasons; the city holds ${citySeasonsLeft === Infinity ? '∞' : citySeasonsLeft}`
      : `Well provisioned — rations for ${seasonsCovered} seasons (journey ${seasonsPlanned}); city keeps ${cityFoodLeft.toLocaleString()}`;

  return {
    need, drawn, seasonsCovered, seasonsPlanned, shortfall,
    cityFoodLeft, citySeasonsLeft, verdict, noteZh: zh, noteEn: en,
  };
}

/** Seasons a column already in the field can keep eating. */
export function armyEndurance(food: number | undefined, troops: number): number {
  return seasonsOf(Math.max(0, food ?? 0), troops);
}

/** Short bilingual tag for an army's remaining rations. */
export function enduranceTag(food: number | undefined, troops: number): { zh: string; en: string; urgent: boolean } {
  const s = armyEndurance(food, troops);
  if (s === Infinity) return { zh: '無兵可食', en: 'No troops', urgent: false };
  if (s <= 0) return { zh: '糧盡 — 本季即潰逃', en: 'Out of rations — deserting now', urgent: true };
  if (s === 1) return { zh: '餘糧一季', en: '1 season of rations', urgent: true };
  return { zh: `餘糧 ${s} 季`, en: `${s} seasons of rations`, urgent: s <= 2 };
}
