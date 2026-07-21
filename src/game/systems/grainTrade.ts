/**
 * 米市流通 (§1.16) — grain moves by itself, if you let it.
 *
 * Until now every city's granary was an island: 市易 (§1.5) let *you* buy and
 * sell at the local counter, 輜重 (§1.10) let *you* haul sacks from A to B, and
 * a frontier fortress with a garrison of twenty thousand could sit next door to
 * a harvest province and still starve because nobody had issued an order.
 *
 * That is not how grain behaved. Where the price ran away, merchants came —
 * with mules, with barges, with a cut. The state's part was to decide how much
 * of that it wanted:
 *
 *   通糴 (open)   — open the roads, in and out of the realm. Caravans run, the
 *                   customs post takes its 商稅, and grain finds the highest
 *                   price it can reach... which is sometimes across a border,
 *                   in a city you may have to besiege next year.
 *   平糴 (guided) — the default. Merchants move grain freely *within* the realm
 *                   and not one sack beyond it. Your own dear cities get fed.
 *   閉糴 (closed) — 閉糴之令: nothing moves. In a famine year that keeps your
 *                   harvest at home; it also means the frontier is on its own,
 *                   the merchant houses take their money elsewhere (commerce
 *                   bleeds), and what they cannot ship they hoard (§1.14).
 *
 * The price itself is *not* a second model — it is {@link foodRate} from §1.5
 * inverted, so the counter you trade at and the price the caravans chase are
 * always the same number. Everything here is pure; resolution.ts applies the
 * deltas at the season boundary.
 *
 * Distinct from 常運糧道 (standingRoutes): those are your own carts on a route
 * you picked, free but manual and player-only. Merchants are automatic,
 * price-driven, work for every force on the map, and always take their margin.
 */
import type { City, EntityId, Season } from '../types';
import { foodRate } from './market';

export type GrainPolicy = 'open' | 'guided' | 'closed';

export const GRAIN_POLICIES: GrainPolicy[] = ['open', 'guided', 'closed'];

export const GRAIN_POLICY_NAMES: Record<GrainPolicy, { zh: string; en: string; motto: string }> = {
  open:   { zh: '通糴', en: 'Open Grain Trade', motto: '通商惠工' },
  guided: { zh: '平糴', en: 'Guided Trade',     motto: '平糴齊民' },
  closed: { zh: '閉糴', en: 'Grain Embargo',    motto: '閉糴之令' },
};

/** Price gap (buyer/seller) a caravan needs before it is worth the road. */
export const PRICE_GAP_TRIGGER = 1.22;
/** 商賈取其中 — the merchant's total cut, split either side of the midpoint. */
export const MERCHANT_MARGIN = 0.12;
/** 商稅 — the customs share the realm takes of trade it has opened (通糴 only). */
export const TRADE_TAX = 0.05;
/** Grain a single caravan pair moves before commerce/roads scale it. */
export const BASE_CARAVAN = 400;
/** Most caravans planned in one season (keeps the season report readable). */
export const MAX_FLOWS_PER_SEASON = 14;
/** Most of its treasury a city will hand the grain merchants in one season. */
export const BUYER_PURSE_SHARE = 0.6;

/** Gold per 100 石 at this city, this season — §1.5's rate, inverted. */
export function grainPrice(
  city: City,
  season: Season,
  ctx: { stability?: number; hoardMul?: number } = {},
): number {
  // A hoard takes the good stuff off the market: fewer 石 per gold → dearer.
  const rate = foodRate(city, season, { stability: ctx.stability })
    * Math.max(0.3, ctx.hoardMul ?? 1);
  return Math.round((100 / Math.max(0.5, rate)) * 100) / 100;
}

export interface GrainPolicyEffects {
  /** May grain leave this city at all? */
  allowExport: boolean;
  /** May it cross into another force's territory? */
  allowCrossBorder: boolean;
  /** Share of trade value the realm collects as 商稅. */
  tradeTax: number;
  /** Per-season commerce drift in every city of the realm. */
  commerceDelta: number;
  /** Added hoarding pressure (§1.14) — what cannot ship gets warehoused. */
  hoardPressure: number;
  badgeZh: string;
  badgeEn: string;
}

const POLICY_EFFECTS: Record<GrainPolicy, GrainPolicyEffects> = {
  open: {
    allowExport: true, allowCrossBorder: true, tradeTax: TRADE_TAX,
    commerceDelta: 0.4, hoardPressure: -0.05,
    badgeZh: '商旅出入國境 · 商稅 5% · 商業 +0.4/季 · 糧亦流向外邦',
    badgeEn: 'Caravans cross borders · 5% duty · commerce +0.4/season · grain leaves too',
  },
  guided: {
    allowExport: true, allowCrossBorder: false, tradeTax: 0,
    commerceDelta: 0, hoardPressure: 0,
    badgeZh: '境內通流 · 不出國境',
    badgeEn: 'Flows within the realm only',
  },
  closed: {
    allowExport: false, allowCrossBorder: false, tradeTax: 0,
    commerceDelta: -0.6, hoardPressure: 0.1,
    badgeZh: '寸粟不出城 · 商業 −0.6/季 · 囤積漸生',
    badgeEn: 'Not a grain leaves the city · commerce −0.6/season · hoarding creeps up',
  },
};

export function grainPolicyEffects(policy: GrainPolicy | undefined): GrainPolicyEffects {
  return POLICY_EFFECTS[policy ?? 'guided'];
}

/** An AI lord's standing grain policy, by temperament. */
export function aiGrainPolicy(personality: string | undefined): GrainPolicy {
  switch (personality) {
    case 'merchant': case 'diplomat': case 'balanced': return 'open';
    case 'tyrant': case 'defensive': return 'closed';
    default: return 'guided';
  }
}

/** One city as the caravan planner sees it. */
export interface GrainNode {
  cityId: EntityId;
  ownerForceId: EntityId | null;
  /** Gold per 100 石 — from {@link grainPrice}. */
  price: number;
  food: number;
  troops: number;
  commerce: number;
  loyalty: number;
  /** Treasury — a buyer can only take delivery of what it can pay for. */
  gold?: number;
  /** 驛傳 — a supply depot on the road: bigger, safer caravans. */
  depot?: boolean;
}

export interface GrainFlow {
  fromCityId: EntityId;
  toCityId: EntityId;
  fromForceId: EntityId | null;
  toForceId: EntityId | null;
  /** 石 moved. */
  food: number;
  /** Gold the exporting city receives. */
  sellerGold: number;
  /** Gold the importing city pays. */
  buyerGold: number;
  crossBorder: boolean;
}

/** How much this city can spare: stores beyond a comfortable garrison reserve. */
function surplusOf(n: GrainNode): number {
  const reserve = Math.max(600, n.troops * 4);
  return Math.max(0, n.food - reserve);
}

/** How much it wants: the shortfall against that same reserve. */
function needOf(n: GrainNode): number {
  const reserve = Math.max(600, n.troops * 4);
  return Math.max(0, reserve - n.food);
}

/** Caravan capacity on this road — merchants, roads and public order. */
function capacityOf(from: GrainNode, to: GrainNode): number {
  let cap = BASE_CARAVAN + (from.commerce + to.commerce) * 9;
  if (from.depot || to.depot) cap *= 1.5;          // 驛傳護商
  const worstLoyalty = Math.min(from.loyalty, to.loyalty);
  if (worstLoyalty < 40) cap *= 0.55;              // 盜匪橫行,商旅裹足
  else if (worstLoyalty >= 75) cap *= 1.1;
  return cap;
}

export interface GrainFlowPlan {
  flows: GrainFlow[];
  /** forceId → 商稅 gold collected this season. */
  duties: Record<EntityId, number>;
}

/**
 * Plan this season's caravans. Deterministic: pairs are considered in order of
 * price gap, and each city's surplus/need is drawn down as it commits, so a
 * single granary province cannot be sold three times over.
 */
export function planGrainFlows(args: {
  nodes: GrainNode[];
  /** Land/water neighbours a caravan can reach in one season. */
  neighborsOf: (cityId: EntityId) => EntityId[];
  policyOf: (forceId: EntityId | null) => GrainPolicy;
  /** May these two forces trade at all (peace + a treaty, or the same lord)? */
  canTrade: (a: EntityId | null, b: EntityId | null) => boolean;
  maxFlows?: number;
}): GrainFlowPlan {
  const byId = new Map<EntityId, GrainNode>();
  for (const n of args.nodes) byId.set(n.cityId, n);
  const surplus = new Map<EntityId, number>();
  const need = new Map<EntityId, number>();
  /** Gold already committed by each buyer this season. */
  const spent = new Map<EntityId, number>();
  for (const n of args.nodes) {
    surplus.set(n.cityId, surplusOf(n));
    need.set(n.cityId, needOf(n));
  }

  // Every legal (seller → buyer) pair with a gap worth walking.
  const candidates: Array<{ from: GrainNode; to: GrainNode; gap: number }> = [];
  for (const from of args.nodes) {
    if (from.ownerForceId === null) continue;
    const fromPolicy = grainPolicyEffects(args.policyOf(from.ownerForceId));
    if (!fromPolicy.allowExport) continue;
    if ((surplus.get(from.cityId) ?? 0) <= 0) continue;
    for (const toId of args.neighborsOf(from.cityId)) {
      const to = byId.get(toId);
      if (!to || to.ownerForceId === null) continue;
      if ((need.get(to.cityId) ?? 0) <= 0) continue;
      const crossBorder = to.ownerForceId !== from.ownerForceId;
      if (crossBorder) {
        if (!fromPolicy.allowCrossBorder) continue;
        if (!grainPolicyEffects(args.policyOf(to.ownerForceId)).allowExport) continue; // 閉糴 shuts the gate both ways
        if (!args.canTrade(from.ownerForceId, to.ownerForceId)) continue;
      }
      const gap = to.price / Math.max(0.5, from.price);
      if (gap < PRICE_GAP_TRIGGER) continue;
      candidates.push({ from, to, gap });
    }
  }
  // Steepest gap first, then a stable tiebreak so plans are reproducible.
  candidates.sort((a, b) => b.gap - a.gap
    || (a.from.cityId < b.from.cityId ? -1 : a.from.cityId > b.from.cityId ? 1 : 0)
    || (a.to.cityId < b.to.cityId ? -1 : 1));

  const flows: GrainFlow[] = [];
  const duties: Record<EntityId, number> = {};
  const limit = args.maxFlows ?? MAX_FLOWS_PER_SEASON;
  for (const c of candidates) {
    if (flows.length >= limit) break;
    const have = surplus.get(c.from.cityId) ?? 0;
    const want = need.get(c.to.cityId) ?? 0;
    if (have <= 0 || want <= 0) continue;
    // A steeper gap pulls more of the road's capacity onto it.
    const pull = Math.min(1.6, (c.gap - PRICE_GAP_TRIGGER) * 1.8 + 0.5);
    const mid = (c.from.price + c.to.price) / 2;
    // 錢到貨到 — the buyer takes delivery of what it can pay for, and no city
    // spends its last coin on grain: a broke fortress starves next to a barge.
    const purse = spent.get(c.to.cityId) ?? 0;
    const budget = Math.max(0, (c.to.gold ?? Infinity) * BUYER_PURSE_SHARE - purse);
    const affordable = budget === Infinity ? Infinity
      : Math.floor((budget / (mid * (1 + MERCHANT_MARGIN / 2))) * 100);
    const volume = Math.floor(Math.min(have, want, affordable, capacityOf(c.from, c.to) * pull));
    if (volume < 80) continue;                       // not worth harnessing a mule
    const sellerGold = Math.round((volume / 100) * mid * (1 - MERCHANT_MARGIN / 2));
    const buyerGold = Math.round((volume / 100) * mid * (1 + MERCHANT_MARGIN / 2));
    const crossBorder = c.to.ownerForceId !== c.from.ownerForceId;
    flows.push({
      fromCityId: c.from.cityId, toCityId: c.to.cityId,
      fromForceId: c.from.ownerForceId, toForceId: c.to.ownerForceId,
      food: volume, sellerGold, buyerGold, crossBorder,
    });
    surplus.set(c.from.cityId, have - volume);
    need.set(c.to.cityId, want - volume);
    spent.set(c.to.cityId, (spent.get(c.to.cityId) ?? 0) + buyerGold);
    // 商稅 — each realm taxes the trade it has opened, on its own side of it.
    for (const side of [c.from.ownerForceId, c.to.ownerForceId]) {
      if (!side) continue;
      const rate = grainPolicyEffects(args.policyOf(side)).tradeTax;
      if (rate <= 0) continue;
      duties[side] = (duties[side] ?? 0) + Math.round(((sellerGold + buyerGold) / 2) * rate);
    }
  }
  return { flows, duties };
}

/** Season-report line for a caravan the player can see. */
export function grainFlowNote(
  flow: GrainFlow,
  fromName: { zh: string; en: string },
  toName: { zh: string; en: string },
): { zh: string; en: string } {
  const kind = flow.crossBorder ? { zh: '商旅出境', en: 'Caravan abroad' } : { zh: '商旅轉輸', en: 'Caravan' };
  return {
    zh: `${kind.zh} — ${fromName.zh} 運糧 ${flow.food} 石 至 ${toName.zh}(得金 ${flow.sellerGold} / 付金 ${flow.buyerGold})`,
    en: `${kind.en} — ${flow.food} grain from ${fromName.en} to ${toName.en} (+${flow.sellerGold}g / −${flow.buyerGold}g)`,
  };
}

/** 米價 tier for the UI, against a neutral 10 gold/100 石. */
export function priceTier(price: number): { zh: string; en: string; level: 'cheap' | 'fair' | 'dear' } {
  if (price >= 14) return { zh: '米珠薪桂', en: 'Grain Dear', level: 'dear' };
  if (price <= 7.5) return { zh: '穀賤傷農', en: 'Grain Cheap', level: 'cheap' };
  return { zh: '市價平和', en: 'Grain Fair', level: 'fair' };
}
