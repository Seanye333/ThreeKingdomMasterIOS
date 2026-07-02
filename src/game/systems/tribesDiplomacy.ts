import type {
  City,
  EntityId,
  Force,
  Officer,
  ReportEntry,
  Tribe,
  TribeId,
} from '../types';
import { TRIBES, TRIBES_BY_ID } from '../data/tribes';

/**
 * §8.3-deep — 異族內交. Four systems layered on top of the raid/征討/招撫 core:
 *
 *  和親 — marry a clanswoman to the chieftain: the tribe stops raiding YOUR
 *    cities for a generation and its aggression drifts DOWN instead of up.
 *    If war fever still boils over (aggression > 0.6) the tribe 背盟 and the
 *    marriage shatters.
 *  互市 — open a border horse-market: seasonal coin for your frontier city,
 *    occasional auxiliary horsemen, slow cooling of aggression. Closes itself
 *    if the frontier catches fire (aggression > 0.5).
 *  質子 — a pacified tribe (aggression ≤ 0.12) sends a hostage-prince to your
 *    court. He serves as a real officer; while he serves, the tribe's
 *    aggression is CAPPED low. A restive tribe may call him home (亡歸).
 *  以夷制夷 — pay a tribe to raid a RIVAL's border cities for two seasons, or
 *    set two tribes with overlapping ranges at each other (二虜相攻). The AI
 *    plays the same game against you.
 *
 * Plus 入主建國 (a breakthrough raid at high aggression founds a tribal STATE
 * that holds the city as a real force) and the 七擒孟獲 capture-and-release
 * chain against the Nanman. Pure planning/math here; the store applies.
 */

// ── 和親 ──
export const HEQIN_COST = 2000;
/** A marriage buys one generation of peace. */
export const HEQIN_YEARS = 12;
export const HEQIN_AGGRESSION_DROP = 0.10;
/** Above this the tribe 背盟 — the marriage shatters mid-raid-check. */
export const HEQIN_BETRAYAL_AGGRESSION = 0.6;

// ── 互市 ──
export const TRIBE_MARKET_COST = 500;
export const TRIBE_MARKET_CLOSE_AGGRESSION = 0.5;
export const TRIBE_MARKET_AGGRESSION_DRIFT = -0.01;

// ── 質子 ──
export const HOSTAGE_MAX_AGGRESSION = 0.12;
/** While the prince serves you the tribe's aggression is capped here. */
export const HOSTAGE_AGGRESSION_CAP = 0.12;
/** Restive kin (aggression > 0.3) may call the prince home. */
export const HOSTAGE_FLEE_AGGRESSION = 0.3;
export const HOSTAGE_FLEE_CHANCE = 0.10;

// ── 以夷制夷 ──
export const INCITE_COST = 600;
export const INCITE_SEASONS = 2;
export const INCITE_AGGRESSION_SURGE = 0.15;
export const TRIBE_CLASH_COST = 800;

// ── 入主建國 ──
export const FOUNDING_MIN_AGGRESSION = 0.45;
/** Defenders this badly outnumbered invite occupation, not mere pillage. */
export const FOUNDING_DEFENSE_RATIO = 0.35;
export const FOUNDING_CHANCE = 0.5;

// ── 七擒孟獲 ──
export const MENG_HUO_SUBMIT_CAPTURES = 7;
export const NANMAN_OFFICER_IDS = ['meng-huo', 'zhu-rong', 'wutugu', 'mu-lu'];

export interface TribePact {
  /** 和親 — year the marriage was sealed (peace holds HEQIN_YEARS). */
  marriageYear?: number;
  /** 互市 — the border market is open. */
  marketOpen?: boolean;
  /** 質子 — the hostage-prince officer serving at the player's court. */
  hostageOfficerId?: EntityId;
  hostageSinceYear?: number;
}

export interface TribeIncitement {
  byForceId: EntityId;
  targetForceId: EntityId;
  seasonsLeft: number;
}

/** The pact/incitement extension riding on TribeState (all optional so old
 *  saves load clean). */
export interface TribeDiplomacyState {
  pacts: Partial<Record<TribeId, TribePact>>;
  incitements: Partial<Record<TribeId, TribeIncitement>>;
  /** tribeId → forceId of the state it founded (a tribe founds at most one). */
  foundedStates: Partial<Record<TribeId, EntityId>>;
  /** tribeId → forceId it has submitted to (七擒之服 — never raids again,
   *  doubled auxiliaries). */
  submitted: Partial<Record<TribeId, EntityId>>;
  /** 七擒 — how many times Meng Huo has been captured-and-released. */
  mengHuoCaptures: number;
}

export function emptyTribeDiplomacy(): TribeDiplomacyState {
  return { pacts: {}, incitements: {}, foundedStates: {}, submitted: {}, mengHuoCaptures: 0 };
}

const marriageActive = (pact: TribePact | undefined, year: number): boolean =>
  !!pact?.marriageYear && year - pact.marriageYear < HEQIN_YEARS;

/** Can the player propose 和親 to this tribe right now? */
export function canHeqin(
  pact: TribePact | undefined,
  year: number,
): { ok: boolean; reasonZh?: string } {
  if (marriageActive(pact, year)) return { ok: false, reasonZh: '和親之盟尚在(一代人之約)' };
  return { ok: true };
}

/** Can the player request a 質子 from this tribe? */
export function canRequestHostage(
  pact: TribePact | undefined,
  aggression: number,
  officers: Record<EntityId, Officer>,
): { ok: boolean; reasonZh?: string } {
  if (pact?.hostageOfficerId && officers[pact.hostageOfficerId]?.status !== 'dead') {
    return { ok: false, reasonZh: '其質子已在朝中' };
  }
  if (aggression > HOSTAGE_MAX_AGGRESSION) {
    return { ok: false, reasonZh: `須先服其心(侵略度 ≤ ${HOSTAGE_MAX_AGGRESSION},今 ${aggression.toFixed(2)})` };
  }
  return { ok: true };
}

const HOSTAGE_TITLES: Record<TribeId, { zh: string; en: string }> = {
  nanban:   { zh: '南蠻王子', en: 'Nanman Prince' },
  wuhuan:   { zh: '烏桓侍子', en: 'Wuhuan Hostage-Prince' },
  xianbei:  { zh: '鮮卑侍子', en: 'Xianbei Hostage-Prince' },
  qiang:    { zh: '羌王子',   en: 'Qiang Prince' },
  shanyue:  { zh: '山越宗帥子', en: 'Shanyue Chief\'s Son' },
  di:       { zh: '氐王子',   en: 'Di Prince' },
  xiongnu:  { zh: '匈奴侍子', en: 'Xiongnu Hostage-Prince' },
  goguryeo: { zh: '高句麗王子', en: 'Goguryeo Prince' },
  buyeo:    { zh: '扶餘王子', en: 'Buyeo Prince' },
  linyi:    { zh: '林邑王子', en: 'Linyi Prince' },
};

/** Synthesize the hostage-prince officer a tribe sends to court. Frontier
 *  princes are fighters first — decent WAR/LEAD, thin book-learning. */
export function makeHostagePrince(
  tribe: Tribe,
  cityId: EntityId,
  forceId: EntityId,
  year: number,
  rng: () => number,
): Officer {
  const title = HOSTAGE_TITLES[tribe.id];
  const r = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
  return {
    id: `tribe-hostage-${tribe.id}-${year}`,
    name: { zh: title.zh, en: title.en },
    birthYear: year - r(18, 24),
    stats: {
      leadership: r(55, 72),
      war: r(62, 80),
      intelligence: r(35, 55),
      politics: r(25, 45),
      charisma: r(45, 65),
    },
    loyalty: 55,
    locationCityId: cityId,
    forceId,
    status: 'idle',
    task: null,
    equipment: [],
    skills: [],
    rank: 'general',
  };
}

/** Which pairs of tribes can be set at each other — they must contest at
 *  least one stretch of the same frontier (overlapping raidable cities). */
export function tribesShareFrontier(a: Tribe, b: Tribe): boolean {
  const set = new Set(a.raidableCityIds);
  return b.raidableCityIds.some((id) => set.has(id));
}

/** Validate 以夷制夷 (incite a tribe onto a rival force). */
export function canIncite(
  tribe: Tribe,
  targetForceId: EntityId,
  cities: Record<EntityId, City>,
  playerForceId: EntityId,
): { ok: boolean; reasonZh?: string } {
  if (targetForceId === playerForceId) return { ok: false, reasonZh: '不可嫁禍己國' };
  const holds = tribe.raidableCityIds.some((id) => cities[id]?.ownerForceId === targetForceId);
  if (!holds) return { ok: false, reasonZh: '其國不臨此虜之邊,鞭長莫及' };
  return { ok: true };
}

/** Resolve 挑動互鬥 — both tribes bleed each other on the steppe; the border
 *  goes quiet. Pure math; the store applies. */
export function resolveTribeClash(
  a: Tribe,
  b: Tribe,
  rng: () => number,
): { dropA: number; dropB: number; textZh: string } {
  const dropA = 0.12 + rng() * 0.1;
  const dropB = 0.12 + rng() * 0.1;
  return {
    dropA,
    dropB,
    textZh: `反間之計成 — ${a.name.zh}與${b.name.zh}相攻於塞外,兩敗俱傷,邊郡晏然。`,
  };
}

const TRIBAL_KING_NAMES: Record<TribeId, { zh: string; en: string; state: { zh: string; en: string } }> = {
  nanban:   { zh: '南蠻大王', en: 'Nanman King',      state: { zh: '南中王國', en: 'Nanzhong Kingdom' } },
  wuhuan:   { zh: '烏桓大單于', en: 'Wuhuan Chanyu',  state: { zh: '烏桓王庭', en: 'Wuhuan Horde' } },
  xianbei:  { zh: '鮮卑大人', en: 'Xianbei Khan',     state: { zh: '鮮卑王庭', en: 'Xianbei Horde' } },
  qiang:    { zh: '羌王',     en: 'Qiang King',       state: { zh: '西羌王國', en: 'Qiang Kingdom' } },
  shanyue:  { zh: '山越宗帥', en: 'Shanyue Chief',    state: { zh: '山越宗部', en: 'Shanyue Confederacy' } },
  di:       { zh: '氐王',     en: 'Di King',          state: { zh: '白馬氐國', en: 'White-Horse Di' } },
  xiongnu:  { zh: '南匈奴單于', en: 'Xiongnu Chanyu', state: { zh: '南匈奴庭', en: 'Southern Xiongnu' } },
  goguryeo: { zh: '高句麗王', en: 'Goguryeo King',    state: { zh: '高句麗',   en: 'Goguryeo' } },
  buyeo:    { zh: '扶餘王',   en: 'Buyeo King',       state: { zh: '扶餘國',   en: 'Buyeo' } },
  linyi:    { zh: '林邑王',   en: 'Linyi King',       state: { zh: '林邑國',   en: 'Linyi (Champa)' } },
};

export interface TribalFounding {
  force: Force;
  /** The ruler — either the historical chieftain (re-purposed) or a synthesized king. */
  ruler: Officer;
  /** True when the ruler is a pre-existing officer that changed allegiance. */
  rulerIsExisting: boolean;
  cityId: EntityId;
  entry: ReportEntry;
}

/** 入主建國 — a breakthrough raid at high aggression plants the tribe's banner
 *  on the city: it becomes a real force (diplomacy and all). */
export function buildTribalFounding(args: {
  tribe: Tribe;
  city: City;
  troops: number;
  officers: Record<EntityId, Officer>;
  year: number;
}): TribalFounding {
  const { tribe, city, officers, year } = args;
  const names = TRIBAL_KING_NAMES[tribe.id];
  const forceId = `tribe-state-${tribe.id}`;
  const chief = tribe.chieftainId ? officers[tribe.chieftainId] : undefined;
  const chiefFree =
    !!chief && chief.status !== 'dead' && chief.status !== 'imprisoned' &&
    (chief.forceId === null || chief.forceId === undefined);
  const ruler: Officer = chiefFree
    ? { ...chief, forceId, locationCityId: city.id, status: 'idle', loyalty: 100 }
    : {
        id: `tribe-king-${tribe.id}-${year}`,
        name: names,
        birthYear: year - 38,
        stats: { leadership: 78, war: 82, intelligence: 45, politics: 40, charisma: 70 },
        loyalty: 100,
        locationCityId: city.id,
        forceId,
        status: 'idle',
        task: null,
        equipment: [],
        skills: [],
        rank: 'general',
      };
  const force: Force = {
    id: forceId,
    name: names.state,
    color: tribe.color,
    capitalCityId: city.id,
    rulerOfficerId: ruler.id,
    isPlayer: false,
  };
  return {
    force,
    ruler,
    rulerIsExisting: chiefFree,
    cityId: city.id,
    entry: {
      cityId: city.id,
      kind: 'rebellion',
      text: `${tribe.name.en} horde storms ${city.name.en} and STAYS — ${names.state.en} is founded on Han soil!`,
      textZh: `${tribe.name.zh}破${city.name.zh}而不去,竟據城自立 — ${names.state.zh}立於漢土!`,
    },
  };
}

/** 七擒 — outcome flavor per capture count (1-based). */
export function nanmanCaptureText(captures: number): { zh: string; en: string } {
  const lines: Array<{ zh: string; en: string }> = [
    { zh: '一擒 — 孟獲曰:「山僻路狹,誤遭汝手,如何肯服!」', en: 'First capture — Meng Huo: "The path was narrow — I fell by mischance. Why would I submit?"' },
    { zh: '二擒 — 孟獲曰:「此乃天敗,非戰之罪。」',           en: 'Second capture — "Heaven tripped me, not your arms."' },
    { zh: '三擒 — 孟獲曰:「吾弟誤事,誓不肯服。」',           en: 'Third capture — "My brother blundered. I will not yield."' },
    { zh: '四擒 — 孟獲面赤,然猶不服。',                       en: 'Fourth capture — his face burns, yet he will not bow.' },
    { zh: '五擒 — 孟獲默然,長嘆而已。',                       en: 'Fifth capture — he says nothing, only sighs.' },
    { zh: '六擒 — 孟獲曰:「若再擒吾,吾方傾心歸服。」',        en: 'Sixth capture — "Take me once more, and my heart is yours."' },
    { zh: '七擒 — 孟獲垂淚:「公,天威也!南人不復反矣!」',     en: 'Seventh capture — in tears: "Yours is the majesty of Heaven. The south will never rise again!"' },
  ];
  return lines[Math.max(0, Math.min(lines.length - 1, captures - 1))];
}

/** AI 以夷制夷 — each season one rival court may bribe a tribe onto an enemy's
 *  frontier (often yours). Pure roll; the store merges the incitement. */
export function rollAITribeIncitement(args: {
  diplomacyState: TribeDiplomacyState;
  aggression: Record<string, number>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null;
  /** forceId → forceId → relation score (negative = hostile). Optional. */
  relationOf?: (a: EntityId, b: EntityId) => number;
  rng: () => number;
}): { incitement: { tribeId: TribeId; byForceId: EntityId; targetForceId: EntityId } | null; entry: ReportEntry | null } {
  const { diplomacyState, cities, forces, playerForceId, rng } = args;
  if (rng() > 0.06) return { incitement: null, entry: null };

  // A tribe not already incited, whose frontier includes cities of ≥2 forces.
  const candidates: Array<{ tribe: Tribe; by: EntityId; target: EntityId }> = [];
  for (const tribe of TRIBES) {
    if (diplomacyState.incitements[tribe.id]) continue;
    if (diplomacyState.submitted[tribe.id] || diplomacyState.foundedStates[tribe.id]) continue;
    const ownersOnFrontier = new Set(
      tribe.raidableCityIds.map((id) => cities[id]?.ownerForceId).filter((f): f is EntityId => !!f),
    );
    if (ownersOnFrontier.size === 0) continue;
    for (const by of Object.values(forces)) {
      if (by.isPlayer) continue;
      if (by.id.startsWith('cult-') || by.id.startsWith('tribe-state-')) continue;
      for (const target of ownersOnFrontier) {
        if (target === by.id) continue;
        const rel = args.relationOf ? args.relationOf(by.id, target) : -30;
        if (rel > -20) continue; // only against genuine rivals
        candidates.push({ tribe, by: by.id, target });
      }
    }
  }
  if (candidates.length === 0) return { incitement: null, entry: null };
  const pick = candidates[Math.floor(rng() * candidates.length)];
  const entry: ReportEntry | null =
    pick.target === playerForceId
      ? {
          cityId: null,
          kind: 'tribe-raid',
          text: `Word from the frontier: ${forces[pick.by]?.name.en ?? '?'} has bribed the ${pick.tribe.name.en} to raid YOUR borders!`,
          textZh: `邊吏急奏:${forces[pick.by]?.name.zh ?? '?'}陰以金帛啖${pick.tribe.name.zh},使寇我邊!`,
        }
      : null;
  return { incitement: { tribeId: pick.tribe.id, byForceId: pick.by, targetForceId: pick.target }, entry };
}

/** 互市 seasonal tick — coin flows into the strongest player-owned frontier
 *  city; horsemen sometimes ride in with the caravans; the market cools the
 *  tribe or closes itself when the frontier burns. Pure; the store applies. */
export function tickTribeMarkets(args: {
  diplomacyState: TribeDiplomacyState;
  aggression: Record<string, number>;
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null;
  rng: () => number;
}): {
  cities: Record<EntityId, City>;
  aggression: Record<string, number>;
  closedTribeIds: TribeId[];
  entries: ReportEntry[];
} {
  const cities = { ...args.cities };
  const aggression = { ...args.aggression };
  const closedTribeIds: TribeId[] = [];
  const entries: ReportEntry[] = [];
  if (!args.playerForceId) return { cities, aggression, closedTribeIds, entries };

  for (const [tid, pact] of Object.entries(args.diplomacyState.pacts)) {
    if (!pact?.marketOpen) continue;
    const tribe = TRIBES_BY_ID[tid];
    if (!tribe) continue;
    const ag = aggression[tid] ?? tribe.baseAggression;
    if (ag > TRIBE_MARKET_CLOSE_AGGRESSION) {
      closedTribeIds.push(tid as TribeId);
      entries.push({
        cityId: null,
        kind: 'tribe-raid',
        text: `The ${tribe.name.en} border market shuts — the frontier is too hot for caravans.`,
        textZh: `邊釁既起,${tribe.name.zh}互市斷絕,商旅裹足。`,
      });
      continue;
    }
    const owned = tribe.raidableCityIds
      .map((id) => cities[id])
      .filter((c): c is City => !!c && c.ownerForceId === args.playerForceId)
      .sort((a, b) => b.troops - a.troops);
    if (owned.length === 0) continue;
    const host = owned[0];
    const gold = 60 + Math.floor(args.rng() * 61);
    const horsemen = args.rng() < 0.25 ? 40 + Math.floor(args.rng() * 41) : 0;
    cities[host.id] = {
      ...host,
      gold: host.gold + gold,
      troops: host.troops + horsemen,
    };
    aggression[tid] = Math.max(0.02, ag + TRIBE_MARKET_AGGRESSION_DRIFT);
    entries.push({
      cityId: host.id,
      kind: 'income',
      text: `${tribe.name.en} horse-market at ${host.name.en}: +${gold} gold${horsemen ? `, ${horsemen} tribal horsemen enlisted` : ''}.`,
      textZh: `${tribe.name.zh}馬市互通於${host.name.zh}:+${gold} 金${horsemen ? `,並附胡騎 ${horsemen}` : ''}。`,
    });
  }
  return { cities, aggression, closedTribeIds, entries };
}

/** 質子 seasonal tick — a restive tribe may call its prince home; while he
 *  serves, the tribe's aggression stays capped. Pure; the store applies. */
export function tickTribeHostages(args: {
  diplomacyState: TribeDiplomacyState;
  aggression: Record<string, number>;
  officers: Record<EntityId, Officer>;
  playerForceId: EntityId | null;
  rng: () => number;
}): {
  aggression: Record<string, number>;
  /** officer ids whose princes fled home (store frees them from the force). */
  fledOfficerIds: EntityId[];
  /** tribe ids whose hostage pact ended (death or flight). */
  endedTribeIds: TribeId[];
  entries: ReportEntry[];
} {
  const aggression = { ...args.aggression };
  const fledOfficerIds: EntityId[] = [];
  const endedTribeIds: TribeId[] = [];
  const entries: ReportEntry[] = [];

  for (const [tid, pact] of Object.entries(args.diplomacyState.pacts)) {
    if (!pact?.hostageOfficerId) continue;
    const tribe = TRIBES_BY_ID[tid];
    if (!tribe) continue;
    const prince = args.officers[pact.hostageOfficerId];
    const stillServes =
      !!prince && prince.status !== 'dead' && prince.forceId === args.playerForceId;
    if (!stillServes) {
      endedTribeIds.push(tid as TribeId);
      continue;
    }
    const ag = aggression[tid] ?? tribe.baseAggression;
    if (ag > HOSTAGE_FLEE_AGGRESSION && args.rng() < HOSTAGE_FLEE_CHANCE) {
      fledOfficerIds.push(prince.id);
      endedTribeIds.push(tid as TribeId);
      entries.push({
        cityId: prince.locationCityId ?? null,
        kind: 'tribe-raid',
        text: `${prince.name.en} slips away in the night — the ${tribe.name.en} hostage has fled home.`,
        textZh: `${tribe.name.zh}質子${prince.name.zh}亡歸部落,邊約遂廢。`,
      });
      continue;
    }
    // The prince at court stays the raiders' hands.
    if (ag > HOSTAGE_AGGRESSION_CAP) aggression[tid] = HOSTAGE_AGGRESSION_CAP;
  }
  return { aggression, fledOfficerIds, endedTribeIds, entries };
}
