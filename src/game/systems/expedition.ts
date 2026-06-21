import type {
  City,
  DiplomaticState,
  EntityId,
  Expedition,
  ExpeditionHaul,
  ExpeditionMode,
  Force,
  Officer,
  ReportEntry,
} from '../types';
import { getRelation, pairKey } from '../types';
import { getEmbassyTarget, resolveEmbassy } from './foreignRealm';
import { grantXp } from './growth';
import type { OfficerStats } from '../types';

/* ─── 游历 — a lone officer roaming abroad ──────────────────────────────────
   A general (not an army) rides out to a distant city to探索/出使/策反/刺探,
   then comes home with whatever he found. He moves like a 押運 column
   (systems/convoy.ts): off the rosters while away, his measure deciding the
   pace and the odds. Effects on the TARGET land the moment he arrives;
   findings he carries are delivered when he gets home. ───────────────────── */

const EXPLORE_BASE = 18; // 情报開眼 ticks a plain探索 lights on the target city
const INFILTRATE_BASE = 30; // 刺探 lights deeper, longer-lasting intel

function clamp(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Travel-time multiplier (lower = faster). A sharp, bold envoy covers ground
 *  briskly; a dull or timid one dawdles. Clamped 0.7–1.4×. */
export function expeditionSpeedMul(officer: Officer): number {
  let mul = 1 - (officer.stats.intelligence - 50) * 0.003;
  const traits = officer.traits ?? [];
  if (traits.includes('diligent' as never)) mul -= 0.1;
  if (traits.includes('lazy' as never)) mul += 0.16;
  if (traits.includes('cautious' as never)) mul += 0.08;
  if (traits.includes('reckless' as never)) mul -= 0.06;
  return clamp(0.7, 1.4, mul);
}

/** Seasons one leg of the journey takes, from the route's base march time
 *  scaled by the officer's pace. Shared by dispatch and the UI ETA preview. */
export function expeditionLegSeasons(baseSeasons: number, officer: Officer): number {
  return Math.max(1, Math.round(Math.max(1, baseSeasons) * expeditionSpeedMul(officer)));
}

/** Which stat pairing drives a given errand — exposed so the UI can show the
 *  player which officer to send. */
export function expeditionAptitude(officer: Officer, mode: ExpeditionMode): number {
  const s = officer.stats;
  switch (mode) {
    case 'explore':
      return (s.intelligence + s.charisma) / 2;
    case 'envoy':
      return (s.charisma + s.politics) / 2;
    case 'subvert':
      return (s.charisma + s.intelligence) / 2;
    case 'infiltrate':
      return s.intelligence;
    case 'embassy':
      return (s.charisma + s.politics) / 2; // long-range diplomacy (see foreignRealm.ts)
  }
}

/** 0–1 estimate of a clean success (used for the modal's odds hint and the
 *  resolution roll alike). For subvert it folds in the toughest loyalty among
 *  the target's officers; pass `targetLoyalty` for that. */
export function expeditionSuccessChance(
  officer: Officer,
  mode: ExpeditionMode,
  targetLoyalty = 60,
): number {
  const apt = expeditionAptitude(officer, mode);
  switch (mode) {
    case 'explore':
      return clamp(0.25, 0.92, 0.35 + apt / 160);
    case 'envoy':
      return clamp(0.3, 0.95, 0.4 + apt / 170);
    case 'subvert':
      return clamp(0.05, 0.8, 0.1 + (apt - targetLoyalty) / 130);
    case 'infiltrate':
      return clamp(0.2, 0.9, 0.3 + apt / 150);
    case 'embassy':
      return clamp(0.3, 0.95, 0.4 + apt / 170); // see embassy peril/reward in foreignRealm.ts
  }
}

/** Risk (0–1) the roaming officer is taken or hurt on a foreign errand. Only
 *  the cloak-and-dagger modes (策反/刺探) run real danger; 出使 enjoys envoy
 *  courtesy, and探索 abroad is merely watched. Lower aptitude = more danger. */
export function expeditionPeril(officer: Officer, mode: ExpeditionMode): number {
  const apt = expeditionAptitude(officer, mode);
  switch (mode) {
    case 'envoy':
      return clamp(0.02, 0.15, 0.12 - apt / 1200);
    case 'explore':
      return clamp(0.03, 0.2, 0.16 - apt / 900);
    case 'subvert':
      return clamp(0.1, 0.55, 0.5 - apt / 320);
    case 'infiltrate':
      return clamp(0.08, 0.45, 0.42 - apt / 340);
    case 'embassy':
      return 0.1; // embassy peril is realm-specific — see embassyPeril() in foreignRealm.ts
  }
}

/** 歷練 — experience earned for an errand, paid when the officer gets home. A
 *  longer road teaches more; a 遠使 to the far west is a campaign's worth of
 *  seasoning. Scaled by the one-leg distance. */
export function expeditionXp(mode: ExpeditionMode, legSeasons: number): number {
  const leg = Math.max(1, legSeasons);
  return mode === 'embassy' ? Math.round(20 + leg * 6) : Math.round(10 + leg * 4);
}

/** Which stats the journey seasons — steers level-up growth (folds with the
 *  officer's own 練兵 focus inside grantXp). */
export function expeditionFavoredStats(mode: ExpeditionMode): Array<keyof OfficerStats> {
  switch (mode) {
    case 'explore':
      return ['intelligence', 'charisma'];
    case 'envoy':
      return ['charisma', 'politics'];
    case 'subvert':
      return ['charisma', 'intelligence'];
    case 'infiltrate':
      return ['intelligence'];
    case 'embassy':
      return ['charisma', 'politics', 'intelligence'];
  }
}

type EncounterKind = 'caravan' | 'caravan-far' | 'bandit' | 'bandit-far' | 'detour' | 'detour-far';

/** A road-event report line for an in-transit traveller. */
function encounterEntry(exp: Expedition, kind: EncounterKind, amount: number): ReportEntry {
  const cityId = exp.phase === 'returning' ? exp.fromCityId : (exp.toCityId || exp.fromCityId);
  const lines: Record<EncounterKind, { en: string; zh: string }> = {
    caravan: { en: `A grateful merchant train gifts ${amount} gold to a traveller on the road.`, zh: `途遇商旅,感其護持,贈金 ${amount}。` },
    'caravan-far': { en: `A Silk-Road caravan trades the envoy ${amount} gold in exotic goods.`, zh: `絲路商隊與使者互市,得金 ${amount}。` },
    bandit: { en: `Bandits waylay a traveller on a mountain road — ${amount} gold lost.`, zh: `山道遇盜,失金 ${amount}。` },
    'bandit-far': { en: `Desert raiders fall on the caravan — ${amount} gold plundered.`, zh: `大漠馬賊劫掠,失金 ${amount}。` },
    detour: { en: `A washed-out bridge forces a traveller to detour (+1 season).`, zh: `橋斷水漲,繞道而行(+1 旬)。` },
    'detour-far': { en: `A sandstorm closes the pass — the envoy is delayed (+1 season).`, zh: `風沙蔽道,使者受阻(+1 旬)。` },
  };
  return { cityId, kind: 'expedition', text: lines[kind].en, textZh: lines[kind].zh };
}

export interface ExpeditionStepInput {
  expeditions: Record<EntityId, Expedition>;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  espionageReveals: Record<EntityId, number>;
  rng: () => number;
  /** When set, only errands that touch this force surface a report entry —
   *  rival-vs-rival roaming resolves silently. Omit to report everything. */
  playerForceId?: EntityId | null;
  /** 遠邦關係 — the player's current standing with each realm (0–100); a warm
   *  relationship makes an embassy safer and richer. */
  realmRelations?: Record<string, number>;
}

export interface ExpeditionStepResult {
  expeditions: Record<EntityId, Expedition>;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  diplomacy: DiplomaticState;
  espionageReveals: Record<EntityId, number>;
  entries: ReportEntry[];
  /** 安邊 — tribe-aggression deltas from embassies (tribeId → delta, negative
   *  = placated). The store folds these into the live tribe aggression map. */
  aggressionDeltas: Record<string, number>;
  /** 邦交 — prestige/天命 deltas from embassies (forceId → delta). */
  mandateDeltas: Record<string, number>;
  /** 通商 — distant realms a PLAYER embassy opened this step (realmId →
   *  frontier cityId the caravan runs from). The store records them so a
   *  standing caravan can pay seasonal trade income. */
  realmsOpened: Record<string, EntityId>;
  /** 遠邦關係 — relation gained with realms a PLAYER embassy reached this step
   *  (realmId → delta). The store adds these (capped 100). */
  realmRelationDeltas: Record<string, number>;
}

/**
 * Advance every expedition by one season. An officer who completes his OUTBOUND
 * leg resolves his errand at the destination (intel/relations/sabotage land
 * now; loot & turned officers are banked to the haul) and turns for home —
 * unless a foreign errand goes wrong and he is taken (imprisoned at the target,
 * the journey over). An officer who completes his RETURN leg comes back onto
 * the rosters and delivers his haul into the home city.
 */
export function stepExpeditions(input: ExpeditionStepInput): ExpeditionStepResult {
  const { rng } = input;
  let cities = input.cities;
  const officers = { ...input.officers };
  let diplomacy = input.diplomacy;
  const espionageReveals = { ...input.espionageReveals };
  const nextExpeditions: Record<EntityId, Expedition> = {};
  const entries: ReportEntry[] = [];
  const aggressionDeltas: Record<string, number> = {};
  const mandateDeltas: Record<string, number> = {};
  const realmsOpened: Record<string, EntityId> = {};
  const realmRelationDeltas: Record<string, number> = {};
  const pf = input.playerForceId;
  // Surface an errand to the player only when it's his, or it touches a city he
  // holds (a rival scouting/turning/raiding HIS land). Undefined pf ⇒ report all.
  const report = (exp: Expedition, entry: ReportEntry) => {
    if (pf === undefined) { entries.push(entry); return; }
    const touches =
      exp.forceId === pf ||
      cities[exp.toCityId]?.ownerForceId === pf ||
      cities[exp.fromCityId]?.ownerForceId === pf;
    if (touches) entries.push(entry);
  };

  for (const exp of Object.values(input.expeditions)) {
    const officer = officers[exp.officerId];
    // Officer died/vanished while abroad — drop the expedition silently.
    if (!officer || officer.status === 'dead') continue;

    const remaining = exp.seasonsRemaining - 1;
    if (remaining > 0) {
      // 途中際遇 — one small fortune of the road may befall a traveller each
      // season (~14%): a hazard that delays him outbound, a boon or spoilage to
      // what he carries homeward. Mirrors the convoy's road events.
      let next: Expedition = { ...exp, seasonsRemaining: remaining };
      if (rng() < 0.14) {
        const far = exp.mode === 'embassy';
        if (next.phase === 'returning' && next.haul && (next.haul.gold || next.haul.food || next.haul.auxTroops)) {
          if (rng() < 0.55) {
            const gift = 120 + Math.floor(rng() * 320);
            next = { ...next, haul: { ...next.haul, gold: (next.haul.gold ?? 0) + gift } };
            report(exp, encounterEntry(exp, far ? 'caravan-far' : 'caravan', gift));
          } else {
            const loss = Math.min(next.haul.gold ?? 0, 80 + Math.floor(rng() * 260));
            if (loss > 0) {
              next = { ...next, haul: { ...next.haul, gold: (next.haul.gold ?? 0) - loss } };
              report(exp, encounterEntry(exp, far ? 'bandit-far' : 'bandit', loss));
            }
          }
        } else {
          // Outbound (or empty-handed): a washed-out road / sandstorm delays him.
          next = { ...next, seasonsRemaining: next.seasonsRemaining + 1, legSeasons: next.legSeasons };
          report(exp, encounterEntry(exp, far ? 'detour-far' : 'detour', 0));
        }
      }
      nextExpeditions[exp.id] = next;
      continue;
    }

    if (exp.phase === 'outbound') {
      // ── 遠使異域 — arrival at a distant realm / border tribe. ──
      if (exp.mode === 'embassy') {
        const target = exp.toRealmId ? getEmbassyTarget(exp.toRealmId) : null;
        if (!target) {
          nextExpeditions[exp.id] = { ...exp, phase: 'returning', seasonsRemaining: exp.legSeasons, haul: {} };
          continue;
        }
        const chief = target.chieftainId ? officers[target.chieftainId] : undefined;
        const freeChieftain = !!(chief && chief.status !== 'dead' && chief.forceId == null);
        const relation = input.realmRelations?.[exp.toRealmId ?? ''] ?? 0;
        const out = resolveEmbassy({ target, officer, freeChieftain, relation, rng });
        // 邦誼漸篤 — a player embassy that reaches a realm warms the standing
        // (more for a clean call, a little even for a battered one).
        if (!target.isTribe && exp.forceId === pf) {
          realmRelationDeltas[target.id] = (realmRelationDeltas[target.id] ?? 0) + (out.wounded ? 6 : 18);
        }
        report(exp, { cityId: exp.fromCityId, kind: 'expedition', text: out.arrivalEn, textZh: out.arrivalZh });
        if (out.aggressionDelta) aggressionDeltas[out.aggressionDelta.tribeId] = (aggressionDeltas[out.aggressionDelta.tribeId] ?? 0) + out.aggressionDelta.delta;
        if (out.prestige) mandateDeltas[exp.forceId] = (mandateDeltas[exp.forceId] ?? 0) + out.prestige;
        if (out.perished) {
          officers[exp.officerId] = { ...officer, status: 'dead', locationCityId: null, task: null };
          continue;
        }
        // 通商 — a clean embassy (not a mishap) to a distant realm opens a
        // standing caravan from the home city. Player force only.
        if (!target.isTribe && !out.wounded && exp.forceId === pf) {
          realmsOpened[target.id] = exp.fromCityId;
        }
        // Prestige/aggression already conferred at the foreign court; only the
        // physical haul (coin/exotica/auxiliaries/chieftain) rides home.
        nextExpeditions[exp.id] = {
          ...exp, phase: 'returning', seasonsRemaining: exp.legSeasons,
          haul: { ...out.haul, prestige: undefined },
        };
        continue;
      }
      const res = resolveErrand(exp, { cities, officers, forces: input.forces, diplomacy, espionageReveals, rng });
      cities = res.cities;
      diplomacy = res.diplomacy;
      if (res.intelTarget) espionageReveals[exp.toCityId] = Math.max(espionageReveals[exp.toCityId] ?? 0, res.intelTarget);
      report(exp, res.entry);
      if (res.captured) {
        // Taken on enemy soil — held at the target city; the赎回 system can
        // later ransom him back. The expedition ends here.
        officers[exp.officerId] = {
          ...officer,
          status: 'imprisoned',
          locationCityId: exp.toCityId,
          forceId: officer.forceId, // still belongs to his force until released
          capturedFromForceId: exp.forceId,
          task: null,
        };
        continue;
      }
      // Turn for home, carrying whatever was found.
      nextExpeditions[exp.id] = {
        ...exp,
        phase: 'returning',
        seasonsRemaining: exp.legSeasons,
        haul: res.haul,
      };
      continue;
    }

    // ── Homecoming — deliver the haul and step the officer back on duty. ──
    const home = cities[exp.fromCityId];
    if (!home || home.ownerForceId !== exp.forceId) {
      // Home fell while he was away — he wanders back to whatever city he set
      // out for (now lost too) idle; the haul is forfeit.
      officers[exp.officerId] = { ...officer, status: 'idle', locationCityId: exp.toCityId, task: null };
      report(exp, {
        cityId: exp.toCityId,
        kind: 'expedition',
        text: `${officer.name.en} returned from his errand to find his home lost.`,
        textZh: `${officer.name.zh}游历归来,故城已失。`,
      });
      continue;
    }
    const haul = exp.haul ?? {};
    let nextHome = home;
    if (haul.gold || haul.food || haul.homeLoyaltyDelta || haul.auxTroops) {
      nextHome = {
        ...home,
        gold: home.gold + (haul.gold ?? 0),
        food: home.food + (haul.food ?? 0),
        troops: home.troops + (haul.auxTroops ?? 0),
        // 異域義從 — aux count as raw troops AND lift the city's defence (capped).
        ...(haul.auxTroops ? { foreignAux: (home.foreignAux ?? 0) + haul.auxTroops } : {}),
        loyalty: clamp(0, 100, home.loyalty + (haul.homeLoyaltyDelta ?? 0)),
      };
      cities = { ...cities, [exp.fromCityId]: nextHome };
    }
    // Talent found / officer turned — they join the dispatcher's force at home.
    if (haul.recruitOfficerId && officers[haul.recruitOfficerId] && officers[haul.recruitOfficerId].status !== 'dead') {
      const rec = officers[haul.recruitOfficerId];
      officers[haul.recruitOfficerId] = {
        ...rec,
        forceId: exp.forceId,
        locationCityId: exp.fromCityId,
        status: 'idle',
        task: null,
        loyalty: clamp(0, 100, exp.mode === 'subvert' ? 55 : 65),
        capturedFromForceId: undefined,
      };
    }
    const item = haul.itemId;
    // 歷練 — the journey seasons the officer; pay XP on his return (level-ups
    // steer toward the stats the errand exercised + his own 練兵 focus).
    const xpRes = grantXp(officer, expeditionXp(exp.mode, exp.legSeasons), rng, expeditionFavoredStats(exp.mode));
    officers[exp.officerId] = {
      ...xpRes.officer,
      // 風霜 — a battered envoy comes home to recover; otherwise straight to idle.
      ...(haul.wounded
        ? { status: 'wounded' as const, woundedSeasons: 2, woundSeverity: 'minor' as const }
        : { status: 'idle' as const }),
      locationCityId: exp.fromCityId,
      task: null,
      ...(item ? { equipment: [...xpRes.officer.equipment, item] } : {}),
    };
    report(exp, {
      cityId: exp.fromCityId,
      kind: 'expedition',
      text: `${officer.name.en} returned to ${home.name.en}.${haul.note ? ' ' + haul.note : ''}`,
      textZh: `${officer.name.zh}游历归来 · ${home.name.zh}。${haul.noteZh ?? ''}`,
    });
    for (const e of xpRes.entries) report(exp, e); // 升級 notices
  }

  return { expeditions: nextExpeditions, cities, officers, diplomacy, espionageReveals, entries, aggressionDeltas, mandateDeltas, realmsOpened, realmRelationDeltas };
}

interface ErrandCtx {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  diplomacy: DiplomaticState;
  espionageReveals: Record<EntityId, number>;
  rng: () => number;
}

interface ErrandResult {
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  /** Intel ticks to light on the target city (caller maxes with existing). */
  intelTarget?: number;
  haul?: ExpeditionHaul;
  captured?: boolean;
  entry: ReportEntry;
}

/** Resolve the errand at the destination the season the officer arrives. */
function resolveErrand(exp: Expedition, ctx: ErrandCtx): ErrandResult {
  const officer = ctx.officers[exp.officerId];
  const target = ctx.cities[exp.toCityId];
  const targetName = target?.name ?? { zh: '?', en: '?' };
  const peril = expeditionPeril(officer, exp.mode);
  // 出使 enjoys diplomatic immunity; the other foreign errands run the gauntlet.
  const captured = exp.mode !== 'envoy' && exp.mode !== 'explore' && ctx.rng() < peril;

  if (captured) {
    return {
      cities: ctx.cities,
      diplomacy: ctx.diplomacy,
      captured: true,
      entry: {
        cityId: exp.toCityId,
        kind: 'expedition',
        text: `${officer.name.en} was seized in ${targetName.en} and thrown in irons.`,
        textZh: `${officer.name.zh}于${targetName.zh}事败被擒,身陷囹圄。`,
      },
    };
  }

  switch (exp.mode) {
    case 'explore':
      return resolveExplore(exp, ctx, officer, targetName);
    case 'envoy':
      return resolveEnvoy(exp, ctx, officer, target, targetName);
    case 'subvert':
      return resolveSubvert(exp, ctx, officer, targetName);
    case 'infiltrate':
      return resolveInfiltrate(exp, ctx, officer, target, targetName);
    case 'embassy':
      // 遠使 is resolved by foreignRealm.ts before reaching here; unreachable.
      throw new Error('embassy resolved via foreignRealm, not resolveErrand');
  }
}

function resolveExplore(
  exp: Expedition,
  ctx: ErrandCtx,
  officer: Officer,
  targetName: { zh: string; en: string },
): ErrandResult {
  const chance = expeditionSuccessChance(officer, 'explore');
  const haul: ExpeditionHaul = {};
  const notesZh: string[] = [];
  const notesEn: string[] = [];

  // A探索 always brings back a read on the place.
  const intelTarget = EXPLORE_BASE;

  // 發掘人才 — a hidden talent biding his time in that city joins on return.
  const wild = Object.values(ctx.officers).find(
    (o) => o.locationCityId === exp.toCityId && o.forceId == null && o.status !== 'dead' && o.id !== officer.id,
  );
  if (wild && ctx.rng() < chance * 0.5) {
    haul.recruitOfficerId = wild.id;
    notesZh.push(`訪得在野賢才 ${wild.name.zh}`);
    notesEn.push(`found the talent ${wild.name.en}`);
  } else if (ctx.rng() < chance * 0.6) {
    // 奇遇 — a windfall of coin/grain from the road.
    const gold = 200 + Math.floor(ctx.rng() * 600);
    const food = 300 + Math.floor(ctx.rng() * 800);
    haul.gold = gold;
    haul.food = food;
    notesZh.push(`奇遇得金${gold}、糧${food}`);
    notesEn.push(`a windfall of ${gold} gold, ${food} grain`);
  } else {
    // 民心 — goodwill brought home.
    haul.homeLoyaltyDelta = 3 + Math.floor(ctx.rng() * 4);
    notesZh.push(`攜民心歸,故城民望 +${haul.homeLoyaltyDelta}`);
    notesEn.push(`brought home goodwill (+${haul.homeLoyaltyDelta} loyalty)`);
  }
  haul.note = `Scouted ${targetName.en}; ${notesEn.join(', ')}.`;
  haul.noteZh = `探得${targetName.zh}虛實;${notesZh.join('、')}。`;

  return {
    cities: ctx.cities,
    diplomacy: ctx.diplomacy,
    intelTarget,
    haul,
    entry: {
      cityId: exp.toCityId,
      kind: 'expedition',
      text: `${officer.name.en} scouted ${targetName.en}.`,
      textZh: `${officer.name.zh}抵${targetName.zh},探查方畢。`,
    },
  };
}

function resolveEnvoy(
  exp: Expedition,
  ctx: ErrandCtx,
  officer: Officer,
  target: City | undefined,
  targetName: { zh: string; en: string },
): ErrandResult {
  const targetForceId = target?.ownerForceId ?? null;
  let diplomacy = ctx.diplomacy;
  let gain = 0;
  if (targetForceId && targetForceId !== exp.forceId) {
    const apt = expeditionAptitude(officer, 'envoy');
    gain = Math.round(6 + apt / 8 + ctx.rng() * 8); // ~12–25
    const cur = getRelation(diplomacy, exp.forceId, targetForceId);
    const key = pairKey(exp.forceId, targetForceId);
    diplomacy = {
      relations: { ...diplomacy.relations, [key]: { ...cur, score: clamp(-100, 100, cur.score + gain) } },
    };
  }
  return {
    cities: ctx.cities,
    diplomacy,
    haul: {
      homeLoyaltyDelta: 0,
      note: `Envoy to ${targetName.en} warmed relations (+${gain}).`,
      noteZh: `出使${targetName.zh},睦鄰修好(關係 +${gain})。`,
    },
    entry: {
      cityId: exp.toCityId,
      kind: 'expedition',
      text: `${officer.name.en}'s embassy to ${targetName.en} improved relations by ${gain}.`,
      textZh: `${officer.name.zh}出使${targetName.zh},邦交回暖(+${gain})。`,
    },
  };
}

function resolveSubvert(
  exp: Expedition,
  ctx: ErrandCtx,
  officer: Officer,
  targetName: { zh: string; en: string },
): ErrandResult {
  const targetForceId = ctx.cities[exp.toCityId]?.ownerForceId ?? null;
  // 守將 — the turnable officers stationed there (not the city's ruler).
  const ruler = targetForceId ? ctx.forces[targetForceId]?.rulerOfficerId : undefined;
  const candidates = Object.values(ctx.officers).filter(
    (o) =>
      o.locationCityId === exp.toCityId &&
      o.forceId === targetForceId &&
      o.id !== ruler &&
      (o.status === 'idle' || o.status === 'active'),
  );
  // Pick the most disgruntled (lowest loyalty) — the likeliest to turn.
  const mark = candidates.sort((a, b) => a.loyalty - b.loyalty)[0];
  const targetLoyalty = mark?.loyalty ?? 80;
  const chance = expeditionSuccessChance(officer, 'subvert', targetLoyalty);
  const ok = mark != null && ctx.rng() < chance;
  if (ok) {
    return {
      cities: ctx.cities,
      diplomacy: ctx.diplomacy,
      haul: {
        recruitOfficerId: mark.id,
        note: `Turned ${mark.name.en} from ${targetName.en}.`,
        noteZh: `自${targetName.zh}策反${mark.name.zh}來歸。`,
      },
      entry: {
        cityId: exp.toCityId,
        kind: 'expedition',
        text: `${officer.name.en} secretly turned ${mark.name.en} in ${targetName.en}.`,
        textZh: `${officer.name.zh}潛入${targetName.zh},暗結${mark.name.zh},許以來投。`,
      },
    };
  }
  return {
    cities: ctx.cities,
    diplomacy: ctx.diplomacy,
    haul: { note: `Found no one willing to turn in ${targetName.en}.`, noteZh: `${targetName.zh}人心未動,策反無功。` },
    entry: {
      cityId: exp.toCityId,
      kind: 'expedition',
      text: `${officer.name.en}'s overtures in ${targetName.en} came to nothing.`,
      textZh: `${officer.name.zh}游說${targetName.zh}守將未果。`,
    },
  };
}

function resolveInfiltrate(
  exp: Expedition,
  ctx: ErrandCtx,
  officer: Officer,
  target: City | undefined,
  targetName: { zh: string; en: string },
): ErrandResult {
  let cities = ctx.cities;
  const notesZh: string[] = ['細探虛實'];
  const notesEn: string[] = ['cased the city'];
  // 破壞 — a chance to quietly bleed the target's stores/defenses.
  const chance = expeditionSuccessChance(officer, 'infiltrate');
  if (target && ctx.rng() < chance * 0.5) {
    const goldHit = Math.min(target.gold, 150 + Math.floor(ctx.rng() * 400));
    const defHit = Math.min(target.defense, 4 + Math.floor(ctx.rng() * 8));
    cities = {
      ...cities,
      [exp.toCityId]: { ...target, gold: target.gold - goldHit, defense: target.defense - defHit },
    };
    notesZh.push(`焚倉竊金 ${goldHit}、毀城防 ${defHit}`);
    notesEn.push(`sabotaged ${goldHit} gold and ${defHit} defense`);
  }
  return {
    cities,
    diplomacy: ctx.diplomacy,
    intelTarget: INFILTRATE_BASE,
    haul: { note: `Infiltrated ${targetName.en}; ${notesEn.join(', ')}.`, noteZh: `潛入${targetName.zh};${notesZh.join('、')}。` },
    entry: {
      cityId: exp.toCityId,
      kind: 'expedition',
      text: `${officer.name.en} infiltrated ${targetName.en}.`,
      textZh: `${officer.name.zh}潛入${targetName.zh},細作其虛實。`,
    },
  };
}
