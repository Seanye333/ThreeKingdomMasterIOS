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
 *  city). Tribes don't run caravans (they pay in auxiliaries, not commerce).
 *
 *  §7.7 ③ 都護府 — a standing 西域都護府 brings the Silk Road oases under one hand:
 *  every 西域 caravan pays half again as much while the protectorate stands. */
export function realmTradeIncome(realmId: string, opts?: { protectorate?: boolean }): number {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return 0;
  const base = Math.round(r.baseSeasons * 40); // 高昌5→200 … 大秦12→480 per season
  const xiyu = r.region === 'xiyu';
  return opts?.protectorate && xiyu ? Math.round(base * 1.5) : base;
}

/** §7.7 ① — the exclusive 封號 a realm bestows on its 邦交 patron, if any. */
export function realmTitle(realmId: string): { zh: string; en: string } | null {
  return FOREIGN_REALMS_BY_ID[realmId]?.title ?? null;
}

/** §7.7 ① — standing 天命 the patron of an opened realm draws each season from
 *  holding its 封號 (scaled by the realm's prestige; titled realms count most). */
export function realmPatronPrestige(realmId: string): number {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return 0;
  const base = Math.round((r.reward.prestige ?? 0) / 6); // 大秦12→2, 倭10→2, 高昌4→1
  return r.title ? Math.max(1, base) : 0; // only titled realms confer standing honour
}

/** §7.7 ③ 絲路風險 — the per-season odds that an opened caravan is cut by raiders
 *  on the long road. Distant routes are riskier; a 西域都護府 (for the Silk Road
 *  oases) or a 常駐使節 watching the route keeps it far safer. Returns 0 for an
 *  unknown realm. */
export function routeDisruptionChance(realmId: string, opts?: { protectorate?: boolean; resident?: boolean }): number {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return 0;
  let p = 0.035 + r.danger * 0.06; // 高昌0.25→0.05 … 大秦0.6→0.071
  if (opts?.protectorate && r.region === 'xiyu') p *= 0.3; // 都護府鎮西域
  if (opts?.resident) p *= 0.45; // a resident envoy smooths the caravan's passage
  return clamp(0, 0.5, p);
}

/** §7.7-deep ①(A)異域援軍 — the fighting contingent a realm's patron may call
 *  in (a 義従遠征軍). Each region marches in its signature host: the Silk Road
 *  oases and Ferghana send heavy horse (and warhorses to stable); the southern
 *  seas send war-elephants; the eastern seas spearmen; the far west mercenaries.
 *  Returns null for an unknown / tribe realm (tribes are reached another way). */
export function realmAidProfile(realmId: string): {
  troops: number; warhorses: number; isCavalry: boolean; unitZh: string; unitEn: string;
} | null {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return null;
  // Scale the host by how far/prestigious the realm is.
  const scale = 1 + (r.reward.prestige ?? 0) / 10; // 高昌4→1.4 … 大秦12→2.2
  switch (r.region) {
    case 'xiyu':
      return { troops: Math.round(2200 * scale), warhorses: Math.round(900 * scale), isCavalry: true, unitZh: '西域突騎', unitEn: 'Western cataphracts' };
    case 'nanhai':
      return { troops: Math.round(2600 * scale), warhorses: 0, isCavalry: false, unitZh: '南海象兵', unitEn: 'war-elephant corps' };
    case 'dongyi':
      return { troops: Math.round(2400 * scale), warhorses: 0, isCavalry: false, unitZh: '東夷義從', unitEn: 'eastern levies' };
    case 'jiyuan':
    default:
      // 大宛 sits in 西域; the far west sends mixed mercenary horse.
      return r.id === 'dayuan'
        ? { troops: Math.round(2000 * scale), warhorses: Math.round(1400 * scale), isCavalry: true, unitZh: '大宛汗血騎', unitEn: 'Ferghana heavy horse' }
        : { troops: Math.round(2200 * scale), warhorses: Math.round(300 * scale), isCavalry: false, unitZh: '異域傭兵', unitEn: 'far-western mercenaries' };
  }
}

/** §7.7-deep ③(C)絹馬互市 — realms that can supply warhorses through the Silk
 *  Road horse-trade: the 西域 oases and Ferghana's heavenly horses. */
export function isHorseRealm(realmId: string): boolean {
  const r = FOREIGN_REALMS_BY_ID[realmId];
  return !!r && (r.region === 'xiyu' || r.id === 'dayuan');
}

/** §7.7-deep ③(C)絹馬互市 — warhorses a 買馬 caravan stables at its frontier
 *  city each season (in place of trade gold). Scales with distance; a 都護府
 *  secures the herds west. Returns 0 for a realm that breeds no horses. */
export function realmTradeHorses(realmId: string, opts?: { protectorate?: boolean }): number {
  if (!isHorseRealm(realmId)) return 0;
  const r = FOREIGN_REALMS_BY_ID[realmId];
  if (!r) return 0;
  const base = Math.round(r.baseSeasons * 14); // 高昌5→70 … 大宛8→112 /season
  return opts?.protectorate ? Math.round(base * 1.5) : base;
}

/** §7.7-deep ④(D)異域歸化 — a foreign-flavoured name for a notable a deep-tied
 *  realm sends to serve. Surnames lean on the historically attested foreign
 *  families of each region (西域 昭武九姓, 扶南 范, 倭 …). */
export function naturalizedName(region: TargetRegion, rng: () => number): { zh: string; en: string } {
  const POOLS: Record<TargetRegion, { sur: Array<[string, string]>; given: Array<[string, string]> }> = {
    xiyu: { sur: [['康', 'Kang'], ['安', 'An'], ['曹', 'Cao'], ['米', 'Mi'], ['何', 'He'], ['史', 'Shi']], given: [['槃陀', 'Panto'], ['那', 'Na'], ['烏那', 'Wuna'], ['延', 'Yan'], ['毗沙', 'Pisha'], ['遮', 'Zhe']] },
    dongyi: { sur: [['難升', 'Nansheng'], ['卑', 'Bi'], ['伊', 'Yi'], ['都', 'Du'], ['辰', 'Chen']], given: [['米', 'mi'], ['彌呼', 'miko'], ['沴', 'li'], ['狗', 'gou'], ['支', 'zhi']] },
    nanhai: { sur: [['范', 'Fan'], ['竺', 'Zhu'], ['闍', 'She'], ['僑', 'Qiao']], given: [['旃', 'Zhan'], ['尋', 'Xun'], ['曼', 'Man'], ['栴檀', 'Chandan'], ['金生', 'Jinsheng']] },
    jiyuan: { sur: [['秦', 'Qin'], ['竺', 'Zhu'], ['安', 'An'], ['支', 'Zhi'], ['白', 'Bai']], given: [['論', 'Lun'], ['世高', 'Shigao'], ['讖', 'Chen'], ['難提', 'Nandi'], ['婁迦', 'Louga']] },
    tribe: { sur: [['呼', 'Hu'], ['禿', 'Tu'], ['宇文', 'Yuwen'], ['慕容', 'Murong']], given: [['廚泉', 'Chuquan'], ['比能', 'Bineng'], ['歸', 'Gui'], ['延', 'Yan']] },
  };
  const pool = POOLS[region] ?? POOLS.xiyu;
  const [sz, se] = pool.sur[Math.floor(rng() * pool.sur.length)];
  const [gz, ge] = pool.given[Math.floor(rng() * pool.given.length)];
  return { zh: `${sz}${gz}`, en: `${se} ${ge}` };
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
  /** §7.7 ② 副使 — a deputy envoy riding along: steadies the mission (eases the
   *  road, lifts the reward tier a notch). */
  deputy?: Officer;
  /** §7.7 ② 厚禮 — gold carried abroad as a gift: warms the court (richer haul,
   *  a safer road, a bigger jump in standing). */
  giftGold?: number;
  /** §7.7 ① — whether the dispatching force currently holds this realm's 封號.
   *  Only a patron may call in a 借兵 troop loan from the realm. */
  isPatron?: boolean;
  rng: () => number;
}): EmbassyOutcome {
  const { target, officer, rng } = args;
  const relation = clamp(0, 100, args.relation ?? 0);
  const comp = envoyCompetence(officer); // 0..~100
  // §7.7 ② 遠使團 — a capable 副使 adds a slice of his own competence to the mission.
  const deputyComp = args.deputy ? envoyCompetence(args.deputy) : 0;
  // §7.7 ② 厚禮 — a lavish gift (per 1000 gold ≈ +0.12 tier, capped) opens doors.
  const giftT = clamp(0, 0.3, (args.giftGold ?? 0) / 8000);
  // 故交易行 — a warm prior relationship lifts the reward tier and eases the road.
  const t = clamp(0, 1, comp / 100 + relation / 250 + deputyComp / 320 + giftT);
  // The road is safer with a deputy at your side and gifts to buy safe passage.
  const peril = clamp(0.02, 0.8, embassyPeril(target, officer) - relation / 400 - deputyComp / 360 - giftT * 0.4);
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
    // frontier and can be marched like any garrison. §7.7 ① — the loan is the
    // patron's privilege: a realm only marches for the lord who holds its 封號.
    if (relation >= 50 && args.isPatron !== false) {
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
