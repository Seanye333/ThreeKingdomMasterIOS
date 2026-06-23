/**
 * 市易 — the grain market. Every city quotes its own price for food,
 * moved by season (autumn glut, winter dearth), local scarcity (a
 * garrison eating through its stores pays through the nose) and how
 * developed the commerce pillar is (merchants compete; rates improve).
 * Buy low after harvest, sell into a siege economy — or just convert
 * between the two resources when one runs short.
 *
 * Rates are food-per-gold; the merchant takes a spread both ways. A big
 * order walks the price (thin markets have no bottomless supply), and a
 * city's 常平倉/平準署 (price-stabilising granaries) flatten the swings,
 * tighten the spread and blunt that slippage — see {@link MarketContext}.
 */
import type { City, Season } from '../types';

/** Food received for 1 gold at neutral conditions. */
export const BASE_FOOD_RATE = 10;
/** The merchant's base cut on every trade (before commerce/stability tighten it). */
export const TRADE_SPREAD = 0.1;
/** Hardest a single order can walk the spot price, before stabilisation. */
export const MAX_SLIP = 0.5;

const SEASON_MOD: Record<Season, number> = {
  spring: 0.95, // planting — stores thinning
  summer: 1.05,
  autumn: 1.3,  // harvest glut — grain is cheap
  winter: 0.7,  // dearth — grain is dear
};

/** 市易行情 — extra market conditions a developed city brings to the counter. */
export interface MarketContext {
  /**
   * 平糴平糶 — 0..0.6, the price-stabilising weight of a city's 常平倉/平準署.
   * Pulls the seasonal/scarcity price swings back toward neutral, narrows the
   * merchant's spread, and softens the slippage a large order suffers (a
   * stocked ever-normal granary meets demand it would otherwise let run away).
   * Default 0 (no stabilising works).
   */
  stability?: number;
}

const clampStab = (s: number | undefined): number => Math.max(0, Math.min(0.6, s ?? 0));

/** Food per gold at this city, this season — the spot mid-price (size-independent). */
export function foodRate(city: City, season: Season, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  // Seasonal swing, pulled toward neutral (1) in proportion to stabilisation.
  const seasonMod = 1 + (SEASON_MOD[season] - 1) * (1 - stab);
  let rate = BASE_FOOD_RATE * seasonMod;
  // Scarcity: stores vs mouths. A garrison outpacing its granary drives
  // the price up (rate down); a glut drives it down — both damped by stab.
  const need = Math.max(1, city.troops * 2);
  if (city.food < need) rate *= 1 - 0.4 * (1 - stab);          // dear; was ×0.6
  else if (city.food > city.troops * 8) rate *= 1 + 0.25 * (1 - stab); // cheap; was ×1.25
  // Developed commerce = competing merchants = better quotes.
  rate *= 1 + city.commerce / 400;
  return Math.max(4, Math.min(22, rate));
}

/**
 * The merchant's effective cut: the base spread, tightened by busy commerce
 * (competing merchants undercut each other) and by price-stabilising granaries.
 * Floored at 3% so the house always takes something.
 */
function effectiveSpread(city: City, stab: number): number {
  const commerceTighten = Math.min(0.6, city.commerce / 500); // up to −60% from commerce
  const s = TRADE_SPREAD * (1 - commerceTighten) * (1 - 0.5 * stab);
  return Math.max(0.03, s);
}

/**
 * How far an order walks the spot price: 0..MAX_SLIP. `depth` is the market's
 * absorbing capacity in the order's own units — orders small against depth barely
 * move it, orders that rival it slip hard. Stabilisation thins the slippage.
 */
function slippage(orderSize: number, depth: number, stab: number): number {
  const raw = orderSize / (orderSize + Math.max(1, depth));
  return raw * MAX_SLIP * (1 - stab);
}

/** Food received for spending `gold` (after slippage and the spread). */
export function buyQuote(city: City, season: Season, gold: number, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  // Buying drains supply: a big gold order fetches progressively less food/gold.
  const slip = slippage(gold, 2500 + city.commerce * 40, stab);
  const rate = foodRate(city, season, ctx) * (1 - slip);
  return Math.floor(gold * rate * (1 - effectiveSpread(city, stab)));
}

/** Gold received for selling `food` (after slippage and the spread). */
export function sellQuote(city: City, season: Season, food: number, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  // Dumping floods the market: a big food order depresses the price it clears at
  // (a higher food-per-gold rate means fewer gold per unit sold).
  const slip = slippage(food, 6000 + city.commerce * 80, stab);
  const rate = foodRate(city, season, ctx) * (1 + slip);
  return Math.floor((food / rate) * (1 - effectiveSpread(city, stab)));
}

/* ─── 馬市 — the warhorse market ─────────────────────────────────────────── */

/** Warhorses received for 1 gold at neutral conditions (≈ 3.3 gold/horse). */
export const BASE_HORSE_RATE = 0.3;
/** Most warhorses a single city ever stables (breeding cap, applied at season end). */
export const WARHORSE_CITY_CAP = 6000;

/**
 * Horses per gold at this city. Unlike grain there's no season swing — instead
 * the price is regional: horse-country (`producer`) breeds them cheap (more
 * horses per gold), the grain south pays dear. A fat local herd softens the
 * price further; a busy market tightens it. The arbitrage is geographic — buy in
 * 涼州, sell in 江南.
 */
export function horseRate(city: City, producer: boolean, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  let rate = BASE_HORSE_RATE;
  if (producer) rate *= 1 + 0.8 * (1 - stab); // bred here → cheap (more horses/gold)
  // Local glut/scarcity by the standing herd, damped by stabilisation.
  const h = city.warhorses ?? 0;
  if (h > 2000) rate *= 1 + 0.2 * (1 - stab);
  else if (h < 300) rate *= 1 - 0.3 * (1 - stab);
  rate *= 1 + city.commerce / 500;
  return Math.max(0.08, Math.min(0.7, rate));
}

/** Warhorses received for spending `gold` (after slippage and spread). */
export function buyHorses(city: City, producer: boolean, gold: number, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  const slip = slippage(gold, 1500 + city.commerce * 30, stab);
  const rate = horseRate(city, producer, ctx) * (1 - slip);
  return Math.floor(gold * rate * (1 - effectiveSpread(city, stab)));
}

/** Gold received for selling `horses` (after slippage and spread). */
export function sellHorses(city: City, producer: boolean, horses: number, ctx: MarketContext = {}): number {
  const stab = clampStab(ctx.stability);
  const slip = slippage(horses, 1200 + city.commerce * 24, stab);
  const rate = horseRate(city, producer, ctx) * (1 + slip);
  return Math.floor((horses / rate) * (1 - effectiveSpread(city, stab)));
}

/**
 * 榷場 — the extra cut a cross-border trade pays on top of the local spread
 * (border tariffs, foreign middlemen, the counterparty's own margin). A
 * developed 市舶司 (tradeMul > 1, foreign-trade infrastructure) whittles it down
 * toward a 4% floor. Default tradeMul 1 → 12%.
 */
export function borderTariff(tradeMul: number): number {
  return Math.max(0.04, 0.12 - (tradeMul - 1));
}

/* ─── 行情 — market outlook (trend + shocks) ─────────────────────────────── */

const NEXT_SEASON: Record<Season, Season> = {
  spring: 'summer', summer: 'autumn', autumn: 'winter', winter: 'spring',
};

/** Whether grain is presently cheap (high food/gold), about fair, or dear. */
export type PriceLevel = 'cheap' | 'fair' | 'dear';

/** Forward-looking shocks the price model can't see from the city snapshot alone. */
export interface MarketShock {
  /** A hostile army is bearing down — siege demand will spike the price. */
  underSiege?: boolean;
  /** Famine/flood struck this city this season — stores are down, grain dearer. */
  harvestHit?: boolean;
  /** Drought weather — the coming harvest looks thin. */
  drought?: boolean;
}

export interface MarketWarning { zh: string; en: string; }

export interface MarketOutlook {
  /** Current spot rate (food per gold). */
  spot: number;
  /** Cheap / fair / dear vs the city's commerce-adjusted neutral price. */
  level: PriceLevel;
  /** The season after this one. */
  nextSeason: Season;
  /** Which way next season pushes the price. */
  nextDir: 'cheaper' | 'dearer' | 'steady';
  /** Shock callouts to surface to the player. */
  warnings: MarketWarning[];
}

/**
 * Reads the grain market's mood at a glance: is grain cheap or dear right now,
 * which way next season tilts it, and any shock (siege/famine/drought) the spot
 * price doesn't yet reflect. Pure — the UI feeds it the shock flags it reads
 * from army/report/weather state.
 */
export function marketOutlook(
  city: City,
  season: Season,
  ctx: MarketContext = {},
  shock: MarketShock = {},
): MarketOutlook {
  const spot = foodRate(city, season, ctx);
  // Fair baseline strips season + scarcity, keeping only the commerce premium.
  const fair = Math.max(4, Math.min(22, BASE_FOOD_RATE * (1 + city.commerce / 400)));
  const level: PriceLevel = spot > fair * 1.08 ? 'cheap' : spot < fair * 0.92 ? 'dear' : 'fair';
  const nextSeason = NEXT_SEASON[season];
  const nextRate = foodRate(city, nextSeason, ctx);
  const nextDir = nextRate > spot * 1.03 ? 'cheaper' : nextRate < spot * 0.97 ? 'dearer' : 'steady';
  const warnings: MarketWarning[] = [];
  if (shock.underSiege) warnings.push({ zh: '兵臨城下 — 糧價將飆,囤糧勿賣', en: 'Siege at hand — grain spiking, hold your stores' });
  if (shock.harvestHit) warnings.push({ zh: '新遭災歉 — 存糧見絀,糧價走高', en: 'Disaster struck — stores thinning, grain dearer' });
  if (shock.drought) warnings.push({ zh: '旱情未解 — 來季收成堪憂', en: 'Drought lingers — next harvest looks thin' });
  return { spot, level, nextSeason, nextDir, warnings };
}
