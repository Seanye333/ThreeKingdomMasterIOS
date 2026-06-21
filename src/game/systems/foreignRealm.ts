import type { ExpeditionHaul, ForeignRealm, Officer, RealmRegion } from '../types';
import { FOREIGN_REALMS, FOREIGN_REALMS_BY_ID } from '../data/foreignRealms';
import { TRIBES, TRIBES_BY_ID } from '../data/tribes';

/* ─── 遠使異域 — long-range embassies to distant lands ──────────────────────
   A unified view over two kinds of destination: the historical foreign realms
   (西域/東夷/南海/極遠, data/foreignRealms.ts) and the border tribes (匈奴/鮮卑/
   南蠻…, data/tribes.ts). Both are reached with the expedition machinery; this
   module decides travel time, peril and reward. ──────────────────────────── */

export type TargetRegion = RealmRegion | 'tribe';

export interface EmbassyTarget {
  id: string;
  name: { zh: string; en: string };
  region: TargetRegion;
  blurbZh: string;
  blurb: string;
  homeland: { lon: number; lat: number };
  baseSeasons: number;
  danger: number;
  /** True for a border tribe (reward placates raids; can win the chieftain). */
  isTribe: boolean;
  /** For a tribe target, the chieftain officer id (recruitable if free). */
  chieftainId?: string;
}

const TRIBE_REWARD_BASE_SEASONS = 3; // tribes sit on the border — a short ride

function realmToTarget(r: ForeignRealm): EmbassyTarget {
  return {
    id: r.id, name: r.name, region: r.region, blurbZh: r.blurbZh, blurb: r.blurb,
    homeland: r.homeland, baseSeasons: r.baseSeasons, danger: r.danger, isTribe: false,
  };
}

/** Every embassy destination available in a given year (realms gate on minYear;
 *  tribes are always reachable). */
export function embassyTargets(year: number): EmbassyTarget[] {
  const realms = FOREIGN_REALMS.filter((r) => r.minYear == null || year >= r.minYear).map(realmToTarget);
  const tribes: EmbassyTarget[] = TRIBES.map((t) => ({
    id: t.id, name: t.name, region: 'tribe' as const, blurbZh: t.descriptionZh ?? t.description, blurb: t.description,
    homeland: t.homeland, baseSeasons: TRIBE_REWARD_BASE_SEASONS, danger: 0.3, isTribe: true, chieftainId: t.chieftainId,
  }));
  return [...realms, ...tribes];
}

/** Resolve a target by id (realm or tribe). */
export function getEmbassyTarget(id: string): EmbassyTarget | null {
  const r = FOREIGN_REALMS_BY_ID[id];
  if (r) return realmToTarget(r);
  const t = TRIBES_BY_ID[id];
  if (t) return {
    id: t.id, name: t.name, region: 'tribe', blurbZh: t.descriptionZh ?? t.description, blurb: t.description,
    homeland: t.homeland, baseSeasons: TRIBE_REWARD_BASE_SEASONS, danger: 0.3, isTribe: true, chieftainId: t.chieftainId,
  };
  return null;
}

function clamp(lo: number, hi: number, v: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** 絲路商利 — gold a standing caravan to an opened realm pays its frontier city
 *  each season. The farther the realm, the richer the trade (大秦琉璃 worth a
 *  city). Tribes don't run caravans (they pay in auxiliaries, not commerce). */
export function realmTradeIncome(realmId: string): number {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return 0;
  return Math.round(r.baseSeasons * 40); // 高昌5→200 … 大秦12→480 per season
}

/** An envoy's all-round measure for a far journey: persuasion carries the most
 *  weight, wit keeps him alive on the road. */
export function envoyCompetence(officer: Officer): number {
  const s = officer.stats;
  return ((s.charisma + s.politics) / 2) * 0.6 + s.intelligence * 0.4;
}

/** Seasons one leg of the embassy takes — long, scaled gently by the envoy. */
export function embassyLegSeasons(target: EmbassyTarget, officer: Officer): number {
  const paceMul = clamp(0.8, 1.2, 1 - (officer.stats.intelligence - 50) * 0.002);
  return Math.max(1, Math.round(target.baseSeasons * paceMul));
}

/** Effective peril after the envoy's wit/competence is taken into account. */
export function embassyPeril(target: EmbassyTarget, officer: Officer): number {
  return clamp(0.03, 0.8, target.danger - envoyCompetence(officer) / 300);
}

export interface EmbassyOutcome {
  /** Died on the road (only the farthest, most dangerous realms can kill). */
  perished: boolean;
  /** Made it, but battered — apply a wound on his return. */
  wounded: boolean;
  /** What he carries home (gold/food/item/aux/prestige + a recruited chieftain). */
  haul: ExpeditionHaul;
  /** 安邊 — tribe aggression change to apply at arrival (negative = placated). */
  aggressionDelta?: { tribeId: string; delta: number };
  /** 受封/邦交 — prestige (天命) conferred on the dispatching force at arrival. */
  prestige?: number;
  /** Short report line for the arrival at the foreign court. */
  arrivalZh: string;
  arrivalEn: string;
}

function pick(range: [number, number], t: number, rng: () => number): number {
  const [lo, hi] = range;
  // Bias toward the high end for a capable envoy; add a little noise.
  const base = lo + (hi - lo) * clamp(0, 1, 0.35 + t * 0.45);
  return Math.round(clamp(lo, hi, base + (rng() - 0.5) * (hi - lo) * 0.4));
}

/**
 * Resolve a 遠使 at the foreign court the season the envoy arrives. Distant
 * realms pay in coin, exotica, auxiliaries and prestige; tribes are placated
 * (raids subside) and may yield their chieftain. The road can cost the envoy
 * his haul, his health, or — at the world's far ends — his life.
 */
export function resolveEmbassy(args: {
  target: EmbassyTarget;
  officer: Officer;
  freeChieftain: boolean; // tribe chieftain alive & unaffiliated → recruitable
  /** 遠邦關係 (0–100) — prior standing with this realm: safer road, richer haul. */
  relation?: number;
  rng: () => number;
}): EmbassyOutcome {
  const { target, officer, rng } = args;
  const relation = clamp(0, 100, args.relation ?? 0);
  const comp = envoyCompetence(officer); // 0..~100
  // 故交易行 — a warm prior relationship lifts the reward tier and eases the road.
  const t = clamp(0, 1, comp / 100 + relation / 250);
  const peril = clamp(0.02, 0.8, embassyPeril(target, officer) - relation / 400);
  const roll = rng();

  // Catastrophe — only realms perilous enough (≥0.45) can claim the envoy's life.
  if (target.danger >= 0.45 && roll < peril * 0.22) {
    return {
      perished: true, wounded: false, haul: {},
      arrivalZh: `${officer.name.zh}遠使${target.name.zh},歿於道途,杳無音訊。`,
      arrivalEn: `${officer.name.en} perished on the long road to ${target.name.en}.`,
    };
  }
  // Mishap — robbed/storm-tossed; limps home empty and hurt.
  if (roll < peril) {
    return {
      perished: false, wounded: true, haul: { note: `Returned from ${target.name.en} empty-handed and worse for wear.`, noteZh: `自${target.name.zh}空手而還,且受了風霜之苦。` },
      arrivalZh: `${officer.name.zh}赴${target.name.zh}途中遇劫(風暴/盜匪),所獲盡失。`,
      arrivalEn: `${officer.name.en}'s embassy to ${target.name.en} was waylaid — nothing gained.`,
    };
  }

  // ── Success. ──
  const haul: ExpeditionHaul = {};
  const notesZh: string[] = [];
  const notesEn: string[] = [];
  let aggressionDelta: EmbassyOutcome['aggressionDelta'];
  let prestige = 0;

  if (target.isTribe) {
    // 安邊 — placate the frontier: their aggression collapses for a while.
    const drop = -(0.1 + t * 0.12);
    aggressionDelta = { tribeId: target.id, delta: drop };
    const gold = pick([200, 700], t, rng);
    const aux = pick([300, 1200], t, rng);
    haul.gold = gold;
    haul.auxTroops = aux;
    notesZh.push(`安撫${target.name.zh},邊患稍息;得貢金${gold}、外族義從${aux}`);
    notesEn.push(`placated the ${target.name.en}; ${gold} gold tribute, ${aux} auxiliaries`);
    prestige = 2;
    // 招撫酋長 — a still-free chieftain may be won over.
    if (args.freeChieftain && target.chieftainId && rng() < 0.3 + t * 0.35) {
      haul.recruitOfficerId = target.chieftainId;
      notesZh.push(`其酋來附`);
      notesEn.push(`won over their chieftain`);
    }
  } else {
    const r = (FOREIGN_REALMS_BY_ID[target.id]?.reward) ?? {};
    if (r.gold) { haul.gold = pick(r.gold, t, rng); notesZh.push(`通商得金${haul.gold}`); notesEn.push(`${haul.gold} gold in trade`); }
    if (r.food) { haul.food = pick(r.food, t, rng); }
    if (r.auxTroops && rng() < 0.5 + t * 0.3) { haul.auxTroops = pick(r.auxTroops, t, rng); notesZh.push(`攜異域兵${haul.auxTroops}`); notesEn.push(`${haul.auxTroops} exotic auxiliaries`); }
    if (r.itemIds && r.itemIds.length > 0 && rng() < 0.4 + t * 0.4) {
      haul.itemId = r.itemIds[Math.floor(rng() * r.itemIds.length)];
      notesZh.push(`獲奇珍`); notesEn.push(`a rare treasure`);
    }
    if (r.prestige) { prestige = r.prestige; notesZh.push(`邦交既通,聲威遠播(天命 +${prestige})`); notesEn.push(`prestige +${prestige}`); }
    // 借兵成軍 — a trusted friend (relation ≥ 50) lends a fighting contingent on
    // top of any reward, scaled by how warm the standing is. These arrive at the
    // frontier and can be marched like any garrison.
    if (relation >= 50) {
      const loan = Math.round((relation - 40) * 70 * (0.7 + t * 0.6)); // rel 50→~700, rel 100→~5000
      haul.auxTroops = (haul.auxTroops ?? 0) + loan;
      notesZh.push(`友邦借兵 ${loan} 至邊`);
      notesEn.push(`borrowed ${loan} troops from a friendly realm`);
    }
  }

  haul.note = `Embassy to ${target.name.en}: ${notesEn.join(', ') || 'goodwill'}.`;
  haul.noteZh = `遠使${target.name.zh}:${notesZh.join('、') || '修好而歸'}。`;
  haul.prestige = prestige || undefined;

  return {
    perished: false,
    wounded: false,
    haul,
    aggressionDelta,
    prestige: prestige || undefined,
    arrivalZh: `${officer.name.zh}抵${target.name.zh},宣國威、通邦交。`,
    arrivalEn: `${officer.name.en} reached ${target.name.en} and opened relations.`,
  };
}
