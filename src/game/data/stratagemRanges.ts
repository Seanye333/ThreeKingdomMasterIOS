/**
 * 計謀射程/波及表 — mirrors the per-id checks inside applyStratagem so the
 * UI can PREVIEW a cast before the AP is spent: which cells are in range
 * ('cast' tint) and which cells a landed cast will splash ('aoe' ring).
 * Keep in sync with tactical.ts when a stratagem's reach changes.
 */
export interface StratagemRange {
  min: number;
  max: number;
  /** Splash radius around the target hex (0 = single hex). */
  aoe: number;
  /** Self/anywhere casts — no targeting preview. */
  self?: boolean;
  /** 夜戰 shortens the volley (rain-of-arrows). */
  nightMax?: number;
}

export const STRATAGEM_RANGE: Record<string, StratagemRange> = {
  'fire-attack':   { min: 1, max: 3, aoe: 1 },            // 延燒隨風,鄰格易殃
  confusion:       { min: 1, max: 4, aoe: 0 },
  defend:          { min: 0, max: 0, aoe: 0, self: true },
  rally:           { min: 1, max: 2, aoe: 0 },
  charge:          { min: 1, max: 1, aoe: 0 },
  'rain-of-arrows':{ min: 2, max: 4, aoe: 1, nightMax: 2 }, // 拋射覆蓋:鄰格半傷
  'chain-ships':   { min: 1, max: 3, aoe: 1 },
  'false-retreat': { min: 0, max: 0, aoe: 0, self: true },
  precognition:    { min: 0, max: 0, aoe: 0, self: true },
  lightning:       { min: 1, max: 4, aoe: 0 },
  'supply-strike': { min: 0, max: 0, aoe: 0, self: true }, // 全場敵軍沮喪
  gallop:          { min: 1, max: 3, aoe: 0 },              // 直線衝刺
  'dragon-veil':   { min: 0, max: 0, aoe: 0, self: true },
  ram:             { min: 1, max: 1, aoe: 0 },
  board:           { min: 1, max: 1, aoe: 0 },
  'fire-ship':     { min: 1, max: 3, aoe: 1 },
  rockslide:       { min: 1, max: 2, aoe: 1 },
  'raid-supply':   { min: 0, max: 0, aoe: 0, self: true },  // 位置門檻在敵後
};
