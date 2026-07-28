/**
 * 戰役隨機源 — the seam that makes a campaign replayable.
 *
 * The season resolver rolled bare `Math.random()` in 67 places: whether a
 * scheme lands, who catches plague, who dies of age, who starts plotting
 * rebellion, which rival gets picked for a court intrigue. All of it drifted
 * between runs, which meant:
 *
 *   - The all-AI observer (scripts/ai-watch.ts) could not run the same world
 *     twice, so "did my change alter behaviour, or is this just noise?" had no
 *     answer. That is how the 長圍 bug hid for as long as it did.
 *   - A "seeded" balance lock is not seeded at all if the season it locks
 *     rolls bare randomness — the previously-noted three-runs-two-failures.
 *
 * ## What this seeds, and what it deliberately does not
 *
 * SIMULATION rolls — the season resolver and the seasonal bouts — draw from
 * here. Those are the world moving on its own, and they must replay.
 *
 * PLAYER-TRIGGERED rolls (執行計略, 鑑定, 精煉, 攻打關隘…) keep using
 * Math.random. Two reasons: the player's own click is the draw, exactly as in
 * tacticalSchemes' human path; and seeding them off state would freeze a
 * failed attempt into a permanently failing one, since a no-op failure leaves
 * the state — and therefore the seed — unchanged.
 *
 * ## Why the seed includes the date
 *
 * `campaignRng(state)` is a pure function of (seed, date). Calling it twice on
 * the same state gives the same stream — that is the replayability — while the
 * date advancing gives each season a fresh stream. Without the date every
 * season of a campaign would roll identically.
 */
import type { GameState } from './gameState';

/** mulberry32 — small, fast, good enough for game rolls. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over a string — turns a composite key into a 32-bit seed. */
export function hashSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * A fresh campaign seed. Called once when a scenario is loaded; from then on
 * the value rides in the save so a reloaded campaign keeps its stream.
 */
export function newCampaignSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
}

/**
 * The rng for the season this state is sitting on.
 *
 * Pure in (rngSeed, date): the same state always yields the same stream, and
 * advancing the date yields a new one. A save written before seeds existed
 * falls back to a constant so it still behaves deterministically rather than
 * crashing — such a campaign simply shares one seed lineage.
 */
export function campaignRng(state: Pick<GameState, 'rngSeed' | 'date'>): () => number {
  const { year, season, month, phase } = state.date;
  const seed = state.rngSeed ?? 1;
  return mulberry32(hashSeed(`${seed}|${year}|${season}|${month}|${phase}`));
}

/**
 * A rng for a named sub-system within the same season, so two systems drawing
 * during one season tick do not consume each other's stream (and so reordering
 * them does not silently change every downstream roll).
 */
export function subRng(state: Pick<GameState, 'rngSeed' | 'date'>, channel: string): () => number {
  const { year, season, month, phase } = state.date;
  const seed = state.rngSeed ?? 1;
  return mulberry32(hashSeed(`${seed}|${year}|${season}|${month}|${phase}|${channel}`));
}
