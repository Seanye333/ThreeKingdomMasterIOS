/**
 * 夜襲劫營 (§5.17) — the answer a garrison has when it cannot win a battle.
 *
 * 突圍 already exists, and it needs a garrison that outnumbers the besiegers by
 * a third — which is to say, it almost never happens. The thing besieged
 * commanders actually did, over and over, was send a few hundred men out in the
 * dark to fire the camp: 甘寧百騎劫魏營, 張遼八百破十萬, 曹操夜襲烏巢. Nobody was
 * trying to win a battle. They were trying to burn what the siege was made of.
 *
 * What decides it is not troop counts but **whether the camp is awake**:
 *
 *   — a camp that has stood in one place for seasons is careless (§5.15's
 *     頓兵之日 is the same number);
 *   — a weary camp (師老兵疲) keeps a bad watch;
 *   — a sick camp keeps a worse one;
 *   — and on the other side, a raid is only as good as the man leading it —
 *     武 gets over the palisade, 智 chooses the night.
 *
 * What it wins is never the siege itself: it is the siege's *equipment*. A
 * successful raid burns the engine park (§5.16), fires the grain, kills a slice
 * of the camp and leaves it exhausted. The besieger is still there in the
 * morning — with nothing to besiege with.
 *
 * Pure. resolution.ts rolls it once per season for an invested city.
 */

export interface NightRaidInput {
  /** Men the garrison is willing to risk in the dark. */
  raiders: number;
  /** Best 武 in the sortie — getting over the palisade. */
  raiderWar: number;
  /** Best 智 in the sortie — picking the night and the gate. */
  raiderIntellect: number;
  /** The camp outside. */
  campTroops: number;
  /** 師老兵疲 0–100. */
  campFatigue?: number;
  /** 頓兵之日 — seasons the camp has stood there. */
  campSeasons?: number;
  /** Best 智 among the besieging officers — a wary camp doubles its watch. */
  campIntellect?: number;
  /** Rain and snow cover the approach; a clear night does not. */
  covered?: boolean;
}

/** Fewest men worth sending over the wall at night. */
export const MIN_RAIDERS = 300;

/**
 * Whether the garrison will even try. A raid is a decision made by a bold and
 * capable officer, not a dice roll the game makes for you.
 */
export function willRaid(input: { raiderWar: number; raiderIntellect: number; raiders: number }): boolean {
  if (input.raiders < MIN_RAIDERS) return false;
  return input.raiderWar >= 75 || input.raiderIntellect >= 78;
}

/** Chance the raid gets into the camp at all, 0–0.85. */
export function raidSurpriseChance(input: NightRaidInput): number {
  // 頓兵久則懈 — the same standing-camp number that breeds sickness breeds
  // carelessness, and it is the dominant term.
  let p = 0.2 + Math.min(0.3, Math.max(0, (input.campSeasons ?? 0) - 1) * 0.07);
  p += Math.min(0.18, (input.campFatigue ?? 0) / 400);
  p += Math.max(0, input.raiderIntellect - 60) / 260;
  p += Math.max(0, input.raiderWar - 70) / 400;
  if (input.covered) p += 0.1;
  // 謹守營壘 — a clever besieger keeps a watch that a bold raid still may beat.
  p -= Math.max(0, (input.campIntellect ?? 0) - 65) / 250;
  return Math.max(0.02, Math.min(0.85, Math.round(p * 1000) / 1000));
}

export interface NightRaidResult {
  success: boolean;
  /** Men the camp loses. */
  campLosses: number;
  /** Raiders who do not come back. */
  raiderLosses: number;
  /** Siege engines burned (§5.16). */
  enginesBurned: number;
  /** Share of the camp's rations fired. */
  foodBurnedFrac: number;
  /** Campaign fatigue added to the camp. */
  fatigue: number;
  /** Morale swing for the camp (negative). */
  morale: number;
}

const FAILED: NightRaidResult = {
  success: false, campLosses: 0, raiderLosses: 0,
  enginesBurned: 0, foodBurnedFrac: 0, fatigue: 0, morale: 0,
};

/**
 * Roll the raid. A beaten raid costs the garrison most of the party; a
 * successful one costs the camp a slice of its men and, far more importantly,
 * the things it was going to take the city with.
 */
export function resolveNightRaid(
  input: NightRaidInput,
  standingEngines: number,
  rng: () => number,
): NightRaidResult {
  if (!willRaid(input)) return FAILED;
  if (rng() >= raidSurpriseChance(input)) {
    // 有備而待 — the watch was up. The party is cut down at the ditch.
    return { ...FAILED, raiderLosses: Math.round(input.raiders * 0.6) };
  }
  // 火起於營中 — losses scale with the party's quality, not merely its size.
  const bite = 0.05 + Math.max(0, input.raiderWar - 60) / 500;
  return {
    success: true,
    campLosses: Math.min(input.campTroops, Math.round(input.campTroops * bite)),
    raiderLosses: Math.round(input.raiders * 0.2),
    // 焚其攻具 — this is what the raid was for.
    enginesBurned: Math.min(standingEngines, Math.ceil(standingEngines * 0.6)),
    foodBurnedFrac: 0.35,
    fatigue: 12,
    morale: -14,
  };
}
