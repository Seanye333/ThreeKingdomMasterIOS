import type {
  City,
  EntityId,
  GameDate,
  Officer,
  OfficerWish,
  ReportEntry,
  WishKind,
} from '../types';
import { POLICY_DEFS, POLICY_PREREQ, type PolicyId } from '../data/officerAttributes';

/**
 * Officer wishes: a small chance each season that an active officer in the
 * player's force will make a request. Granting it boosts loyalty; rejecting
 * it drops loyalty by the configured penalty.
 */

const WISH_CHANCE_PER_OFFICER = 0.04;
const MAX_OPEN_WISHES = 4;

export interface WishContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null;
  existing: OfficerWish[];
  date: GameDate;
  rng: () => number;
}

export function rollWishes(ctx: WishContext): OfficerWish[] {
  if (!ctx.playerForceId) return ctx.existing;
  if (ctx.existing.length >= MAX_OPEN_WISHES) return ctx.existing;
  const playerOfficers = Object.values(ctx.officers).filter(
    (o) => {
      if (o.forceId !== ctx.playerForceId) return false;
      if (o.status !== 'idle' && o.status !== 'wounded') return false;
      if (o.loyalty >= 95) return false;
      if (ctx.existing.some((w) => w.officerId === o.id)) return false;
      // 'loyal' trait officers never make demands (含蓄不索取).
      if ((o.traits ?? []).includes('loyal')) return false;
      return true;
    },
  );
  if (playerOfficers.length === 0) return ctx.existing;
  const newWishes: OfficerWish[] = [];
  for (const o of playerOfficers) {
    // Personality scales base chance: arrogant 2×, humble 0.3×, others 1×.
    const traits = o.traits ?? [];
    let chance = WISH_CHANCE_PER_OFFICER;
    if (traits.includes('arrogant') || traits.includes('ambitious')) chance *= 2;
    if (traits.includes('humble')) chance *= 0.3;
    if (ctx.rng() > chance) continue;
    if (newWishes.length + ctx.existing.length >= MAX_OPEN_WISHES) break;
    const w = generateWish(o, ctx);
    if (w) newWishes.push(w);
  }
  return [...ctx.existing, ...newWishes];
}

/**
 * Prune wishes whose officer has died/defected, OR which have aged past
 * their expiry. Expiry has a small loyalty cost — ignoring a letter is
 * itself disrespectful.
 */
export function expireWishes(
  wishes: OfficerWish[],
  officers: Record<EntityId, Officer>,
  currentYear: number,
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter',
): { wishes: OfficerWish[]; officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
  const nextOfficers = { ...officers };
  const surviving: OfficerWish[] = [];
  const entries: ReportEntry[] = [];
  const nowAbs = currentYear * 4 + seasonIdx[currentSeason];
  for (const w of wishes) {
    const o = nextOfficers[w.officerId];
    // Officer gone or dead — silently drop.
    if (!o || o.status === 'dead' || o.status === 'imprisoned') continue;
    const issuedAbs = w.issuedYear * 4 + seasonIdx[w.issuedSeason];
    const maxAge = w.expiresAfterSeasons ?? 6;
    if (nowAbs - issuedAbs < maxAge) {
      surviving.push(w);
      continue;
    }
    // Expired: small loyalty penalty (smaller than reject — silent neglect).
    if (w.kind !== 'info') {
      const penalty = 3;
      nextOfficers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - penalty) };
      entries.push({
        cityId: o.locationCityId,
        kind: 'note',
        text: `${o.name.en}'s letter went unanswered (loyalty −${penalty}).`,
        textZh: `${o.name.zh}之書信無人問津（忠誠 −${penalty}）。`,
      });
    }
  }
  return { wishes: surviving, officers: nextOfficers, entries };
}

/**
 * Wounded-officer wish: a wounded officer with 'cautious' or `sickly`
 * trait may petition to retire. Called from the wounded-recovery tick.
 */
export function maybeWoundedRetireWish(
  officer: Officer,
  date: GameDate,
  rng: () => number,
): OfficerWish | null {
  const traits = officer.traits ?? [];
  const ageHigh = (date.year - officer.birthYear) >= 55;
  const wantsOut = traits.includes('cautious') || traits.includes('sickly') || ageHigh;
  if (!wantsOut) return null;
  if (rng() > 0.35) return null;
  return {
    id: `wish-retire-${officer.id}-${date.year}-${date.season}`,
    officerId: officer.id,
    kind: 'retire',
    text: {
      zh: `${officer.name.zh}經此一傷，求歸故里安養。`,
      en: `${officer.name.en} pleads to retire to their home after this wound.`,
    },
    issuedYear: date.year,
    issuedSeason: date.season,
    rejectPenalty: 12,
    grantBonus: 8,
    expiresAfterSeasons: 4,
  };
}

function generateWish(o: Officer, ctx: WishContext): OfficerWish | null {
  const traits = o.traits ?? [];
  // 致仕 — a very old officer may petition to retire honourably, wound or no
  // wound. (The selfless 'loyal' are already filtered out upstream.)
  const age = ctx.date.year - o.birthYear;
  if (age >= 68 && ctx.rng() < 0.5) {
    return {
      id: `wish-retire-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'retire',
      text: {
        zh: `${o.name.zh}年事已高,上書乞骸骨,願歸故里。`,
        en: `${o.name.en}, grown old, petitions to retire honourably.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 10,
      grantBonus: 8,
      expiresAfterSeasons: 4,
    };
  }
  // Officers with int >= 70 and < 8 policies sometimes wish to learn one.
  const have = new Set(o.policies ?? []);
  const learnable: PolicyId[] = [];
  if (o.stats.intelligence >= 70 && have.size < 8) {
    for (const id of Object.keys(POLICY_DEFS) as PolicyId[]) {
      if (have.has(id)) continue;
      const prereqs = POLICY_PREREQ[id] ?? [];
      if (prereqs.every((p) => have.has(p))) learnable.push(id);
    }
  }
  // Find a rival (envious/jealous/proud) for dismiss-rival wish.
  const rivals = (traits.includes('envious') || traits.includes('jealous') || traits.includes('arrogant'))
    ? Object.values(ctx.officers).filter(
        (other) =>
          other.id !== o.id &&
          other.forceId === o.forceId &&
          other.status !== 'dead' &&
          other.stats[o.stats.war >= o.stats.intelligence ? 'war' : 'intelligence'] >
            o.stats[o.stats.war >= o.stats.intelligence ? 'war' : 'intelligence'],
      )
    : [];
  // Build weighted kind pool by personality.
  const weights: Array<[WishKind, number]> = [
    ['transfer',     traits.includes('refined') ? 2 : 1],
    ['reinforce',    o.stats.war >= 70 ? 2 : 1],
    ['promote',      traits.includes('arrogant') || traits.includes('ambitious') ? 4 : 1],
    ['item',         o.stats.war >= 75 || traits.includes('martial-valor') ? 2 : 1],
  ];
  if (learnable.length > 0) {
    weights.push(['learn-policy', traits.includes('humble') ? 5 : (o.stats.intelligence >= 80 ? 3 : 1)]);
  }
  if (rivals.length > 0) {
    weights.push(['dismiss-rival', 3]);
  }
  // 上書: 5% chance of an info letter from a high-INT prefect-eligible officer.
  if (o.stats.intelligence >= 75 && ctx.rng() < 0.15) {
    weights.push(['info', 5]);
  }
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let pick = ctx.rng() * total;
  let kind: WishKind = 'transfer';
  for (const [k, w] of weights) {
    pick -= w;
    if (pick <= 0) { kind = k; break; }
  }
  if (kind === 'learn-policy') {
    const wantId = learnable[Math.floor(ctx.rng() * learnable.length)];
    const want = POLICY_DEFS[wantId];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'learn-policy',
      text: {
        zh: `${o.name.zh}求學「${want?.zh ?? wantId}」之政。`,
        en: `${o.name.en} wishes to study the policy ${want?.en ?? wantId}.`,
      },
      targetId: wantId,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 4,
      grantBonus: 14,
    };
  }
  if (kind === 'transfer') {
    const otherCities = Object.values(ctx.cities).filter(
      (c) => c.ownerForceId === ctx.playerForceId && c.id !== o.locationCityId,
    );
    const target = otherCities[Math.floor(ctx.rng() * otherCities.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'transfer',
      text: {
        zh: `${o.name.zh}请求转任至${target?.name.zh ?? '其他城'}。`,
        en: `${o.name.en} requests transfer to ${target?.name.en ?? 'another city'}.`,
      },
      targetId: target?.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 8,
      grantBonus: 10,
    };
  }
  if (kind === 'reinforce') {
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'reinforce',
      text: {
        zh: `${o.name.zh}请求增兵${o.locationCityId ? ctx.cities[o.locationCityId]?.name.zh : ''}。`,
        en: `${o.name.en} requests reinforcements for ${o.locationCityId ? ctx.cities[o.locationCityId]?.name.en : 'their city'}.`,
      },
      targetId: o.locationCityId ?? undefined,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 8,
    };
  }
  if (kind === 'item') {
    const stat = o.stats.war >= o.stats.intelligence ? '寶刀' : '兵法書';
    const statEn = o.stats.war >= o.stats.intelligence ? 'a fine weapon' : 'a strategy treatise';
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'item',
      text: {
        zh: `${o.name.zh}求${stat}一柄。`,
        en: `${o.name.en} requests ${statEn}.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 4,
      grantBonus: 10,
    };
  }
  if (kind === 'dismiss-rival' && rivals.length > 0) {
    const rival = rivals[Math.floor(ctx.rng() * rivals.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'dismiss-rival',
      text: {
        zh: `${o.name.zh}進言：求黜${rival.name.zh}之職。`,
        en: `${o.name.en} petitions to remove ${rival.name.en}.`,
      },
      targetId: rival.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 8,
    };
  }
  if (kind === 'info') {
    // 上書: a flavor letter — reports on local conditions.
    const city = o.locationCityId ? ctx.cities[o.locationCityId] : undefined;
    const reports: Array<{ zh: string; en: string }> = [];
    if (city) {
      if (city.food < city.troops * 0.8) {
        reports.push({
          zh: `${o.name.zh}上書：${city.name.zh}存糧不足，恐生變。`,
          en: `${o.name.en} reports low grain reserves in ${city.name.en}.`,
        });
      }
      if (city.loyalty < 50) {
        reports.push({
          zh: `${o.name.zh}上書：${city.name.zh}民心浮動，宜安撫。`,
          en: `${o.name.en} reports stirring discontent in ${city.name.en}.`,
        });
      }
      if (city.troops > 10000) {
        reports.push({
          zh: `${o.name.zh}上書：${city.name.zh}兵備整肅，可堪一戰。`,
          en: `${o.name.en} reports ${city.name.en} stands battle-ready.`,
        });
      }
    }
    if (reports.length === 0) {
      reports.push({
        zh: `${o.name.zh}上書問安。`,
        en: `${o.name.en} sends a courtly letter of greeting.`,
      });
    }
    const r = reports[Math.floor(ctx.rng() * reports.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'info',
      text: r,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 0,
      grantBonus: 2, // small acknowledgement loyalty
      expiresAfterSeasons: 3,
    };
  }
  return {
    id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
    officerId: o.id,
    kind: 'promote',
    text: {
      zh: `${o.name.zh}请求升迁。`,
      en: `${o.name.en} requests promotion.`,
    },
    issuedYear: ctx.date.year,
    issuedSeason: ctx.date.season,
    rejectPenalty: 10,
    grantBonus: 12,
  };
}

/**
 * Apply the answer to a wish: grants give the loyalty bonus and resolve the
 * referenced action; rejections cost loyalty.
 */
import { MILITARY_RANKS, MILITARY_RANKS_BY_ID } from '../data/titles';

export interface ApplyWishContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  /** Multiplier on the granted loyalty bonus — driven by 諫議大夫. */
  advisorMultiplier?: number;
  /** Pool of items not currently equipped; used for `item` wish grant. */
  unequippedItemIds?: EntityId[];
  /** Lost items pool; cheaper fallback if no unequipped exist. */
  lostItems?: Array<{ itemId: EntityId; cityId: EntityId }>;
}

export interface ApplyWishOutput {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  entry: ReportEntry;
  /** When the wish was 'item' and an item was granted, the consumed pool
   *  is reported here so the store can mutate state.lostItems / items. */
  consumedItemId?: EntityId;
  consumedFromLost?: EntityId; // cityId entry if drawn from lostItems
}

export function applyWishGrant(
  wish: OfficerWish,
  ctx: ApplyWishContext,
): ApplyWishOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const o = officers[wish.officerId];
  if (!o) {
    return {
      officers, cities,
      entry: { cityId: null, kind: 'note', text: 'Wish target gone.', textZh: '心願對象已不在。' },
    };
  }
  const bonus = Math.ceil(wish.grantBonus * (ctx.advisorMultiplier ?? 1));
  let extraEn = '';
  let extraZh = '';

  if (wish.kind === 'transfer' && wish.targetId) {
    officers[o.id] = {
      ...o,
      locationCityId: wish.targetId,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
    const dest = cities[wish.targetId];
    if (dest) {
      extraEn = ` Moved to ${dest.name.en}.`;
      extraZh = `已轉任${dest.name.zh}。`;
    }
  } else if (wish.kind === 'reinforce' && wish.targetId) {
    // BUG FIX: actually add troops to the requested city + deduct gold
    // from capital. Up to 1500 troops, capped by city.troopCap.
    const city = cities[wish.targetId];
    if (city) {
      const cap = (city as City & { troopCap?: number }).troopCap ?? 30000;
      const add = Math.min(1500, Math.max(0, cap - city.troops));
      const goldCost = Math.min(city.gold, 400);
      cities[city.id] = {
        ...city,
        troops: city.troops + add,
        gold: Math.max(0, city.gold - goldCost),
      };
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` ${add} troops drafted at ${city.name.en} (cost ${goldCost}g).`;
      extraZh = `${city.name.zh}增兵 ${add} 卒（耗金 ${goldCost}）。`;
    } else {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    }
  } else if (wish.kind === 'promote') {
    // BUG FIX: actually promote to the highest eligible military rank.
    const currentTier = MILITARY_RANKS_BY_ID[o.rank]?.tier ?? 0;
    const best = Math.max(o.stats.war, o.stats.leadership);
    const nextRank = [...MILITARY_RANKS]
      .sort((a, b) => b.tier - a.tier)
      .find((r) => r.tier > currentTier && best >= r.minStat);
    if (nextRank) {
      officers[o.id] = {
        ...o,
        rank: nextRank.id,
        loyalty: Math.min(100, o.loyalty + bonus + nextRank.loyaltyBonus),
      };
      extraEn = ` Promoted to ${nextRank.name.en}.`;
      extraZh = `晉升為${nextRank.name.zh}。`;
    } else {
      // Already at max eligible — grant loyalty only.
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` (No higher rank earned — loyalty only.)`;
      extraZh = `（已達其能升之最高軍銜，僅 +忠誠。）`;
    }
  } else if (wish.kind === 'item') {
    // BUG FIX: actually grant an item from the unequipped pool or lost pool.
    let granted: EntityId | null = null;
    let fromLost: EntityId | undefined;
    if (ctx.unequippedItemIds && ctx.unequippedItemIds.length > 0) {
      granted = ctx.unequippedItemIds[0];
    } else if (ctx.lostItems && ctx.lostItems.length > 0) {
      granted = ctx.lostItems[0].itemId;
      fromLost = ctx.lostItems[0].cityId;
    }
    if (granted) {
      const have = o.equipment ?? [];
      officers[o.id] = {
        ...o,
        equipment: [...have, granted],
        loyalty: Math.min(100, o.loyalty + bonus),
      };
      extraEn = ` Item #${granted} bestowed from the armoury.`;
      extraZh = `自府庫賜「${granted}」。`;
      return {
        officers, cities,
        entry: {
          cityId: o.locationCityId,
          kind: 'note',
          text: `Granted ${o.name.en}'s wish (+${bonus} loyalty).${extraEn}`,
          textZh: `達成${o.name.zh}之心願（忠誠 +${bonus}）。${extraZh}`,
        },
        consumedItemId: granted,
        consumedFromLost: fromLost,
      };
    }
    // No items available — loyalty only, mark in text.
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    extraEn = ' (Armoury empty — token granted in name only.)';
    extraZh = '（府庫無實物，徒以言謝。）';
  } else if (wish.kind === 'dismiss-rival' && wish.targetId) {
    // Drop the rival's loyalty by 5 (they feel slighted), satisfy petitioner.
    const rival = officers[wish.targetId];
    if (rival) {
      officers[rival.id] = { ...rival, loyalty: Math.max(0, rival.loyalty - 5) };
      extraEn = ` ${rival.name.en} is publicly chastised.`;
      extraZh = `${rival.name.zh}受朝堂責問。`;
    }
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
  } else if (wish.kind === 'retire') {
    // Officer leaves service permanently — status:'retired' keeps them
    // visible in 列傳 with a "歸隱" tag.
    const formerForce = o.forceId;
    officers[o.id] = {
      ...o,
      forceId: null,
      status: 'retired',
      locationCityId: o.hometownCityId ?? o.locationCityId,
      task: null,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
    // 禮遇耆老 — honourably retiring an elder heartens the whole court: every
    // serving colleague is steadied by the gesture (+2 loyalty).
    let cascade = 0;
    if (formerForce) {
      for (const other of Object.values(officers)) {
        if (other.id === o.id || other.forceId !== formerForce) continue;
        if (other.status === 'dead' || other.status === 'unsearched') continue;
        officers[other.id] = { ...other, loyalty: Math.min(100, other.loyalty + 2) };
        cascade++;
      }
    }
    extraEn = ` Retired with full honors${cascade ? ` — the court is heartened (${cascade}× +2 loyalty)` : ''}.`;
    extraZh = `准其辭官歸里${cascade ? `,禮遇耆老,百僚感懷(${cascade} 人忠誠 +2)` : ''}。`;
  } else if (wish.kind === 'info') {
    // Acknowledging an info letter gives a small loyalty bump, no other effect.
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
  } else if (wish.kind === 'learn-policy' && wish.targetId) {
    // BUG FIX: actually add the policy to the officer's list.
    const have = o.policies ?? [];
    if (have.includes(wish.targetId as import('../data/officerAttributes').PolicyId)) {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    } else {
      officers[o.id] = {
        ...o,
        policies: [...have, wish.targetId as import('../data/officerAttributes').PolicyId],
        loyalty: Math.min(100, o.loyalty + bonus),
      };
      const polDef = POLICY_DEFS[wish.targetId as import('../data/officerAttributes').PolicyId];
      extraEn = ` Learned ${polDef?.en ?? wish.targetId}.`;
      extraZh = `習得「${polDef?.zh ?? wish.targetId}」。`;
    }
  } else {
    officers[o.id] = {
      ...o,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
  }
  return {
    officers, cities,
    entry: {
      cityId: o.locationCityId,
      kind: 'note',
      text: `Granted ${o.name.en}'s wish (+${bonus} loyalty).${extraEn}`,
      textZh: `達成${o.name.zh}之心願（忠誠 +${bonus}）。${extraZh}`,
    },
  };
}

export function applyWishReject(
  wish: OfficerWish,
  ctx: ApplyWishContext,
): ApplyWishOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const o = officers[wish.officerId];
  if (!o) {
    return {
      officers, cities,
      entry: { cityId: null, kind: 'note', text: 'Wish target gone.', textZh: '心願對象已不在。' },
    };
  }
  // Grievance escalates the rejection penalty. Each prior rejection adds
  // a multiplier so the 4th rejection costs roughly 2.4× the first.
  const grievance = o.grievanceCount ?? 0;
  const escalation = 1 + grievance * 0.45;
  const penalty = Math.ceil(wish.rejectPenalty * escalation);
  officers[o.id] = {
    ...o,
    loyalty: Math.max(0, o.loyalty - penalty),
    grievanceCount: grievance + 1,
  };
  const grievanceNote = grievance >= 2
    ? ` ${o.name.en} is visibly frustrated (grievance ${grievance + 1}).`
    : '';
  const grievanceNoteZh = grievance >= 2
    ? `${o.name.zh}已多次被拒，怨望日深（怨次 ${grievance + 1}）。`
    : '';
  return {
    officers, cities,
    entry: {
      cityId: o.locationCityId,
      kind: 'note',
      text: `Rejected ${o.name.en}'s wish (−${penalty} loyalty).${grievanceNote}`,
      textZh: `回絕${o.name.zh}之心願（忠誠 −${penalty}）。${grievanceNoteZh}`,
    },
  };
}
