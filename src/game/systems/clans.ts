import type { City, ClanStanding, EntityId, Force, Officer, ReportEntry } from '../types';
import { CLANS, CLANS_BY_ID, clanOf, isCommoner } from '../data/clans';
import { gradeScore } from './officerGrade';
import { peerageTier } from '../data/peerage';

/**
 * 門閥世族 loop — each season the realm's 門第政策 (recruitmentStance) tugs the
 * loyalty of its great-clan scions against its 寒門 nobodies, and a clan that
 * grows over-mighty under an aristocratic line lends its strongmen a push
 * toward usurpation (司馬代魏). Pure; mutates nothing of its inputs.
 */
export interface ClanTickContext {
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  /** Player realm — its stance is opt-in (undefined → 並用); AI realms derive a
   *  default from how clan-heavy they are, so 司馬代魏 can emerge unprompted. */
  playerForceId?: EntityId | null;
  /** §7.8-deep E 門第聯姻 — clans bound by marriage (clanId → forceId). A clan
   *  bound to its serving lord holds a loyalty floor and its strongmen are far
   *  less apt to grow over-mighty. */
  clanBonds?: Record<string, EntityId>;
  /** Deterministic seed (derive from the campaign date). */
  seed: number;
}

/** §7.8-deep E — loyalty a bound clan's scions will not drift below while they
 *  serve the lord they married into. */
const BOND_LOYALTY_FLOOR = 60;

/**
 * Effective 門第政策 for a realm. The player's is exactly what they set (absent
 * → 並用, no effect). An AI realm with no explicit stance leans aristocratic
 * when ≥2 great-clan scions serve it (so a clan-stacked Wei drifts that way and
 * eventually breeds its over-mighty subject), otherwise stays neutral.
 */
export function effectiveStance(
  force: Force,
  officers: Record<EntityId, Officer>,
  isPlayer: boolean,
): Force['recruitmentStance'] {
  if (force.recruitmentStance) return force.recruitmentStance;
  if (isPlayer) return 'balanced';
  let scions = 0;
  for (const clan of CLANS) {
    for (const id of clan.members) {
      const o = officers[id];
      if (o && o.forceId === force.id && o.status !== 'dead' && o.status !== 'imprisoned') scions++;
    }
  }
  return scions >= 2 ? 'aristocratic' : 'balanced';
}

export interface ClanTickResult {
  /** Officers with loyalty nudged by the stance. */
  officers: Record<EntityId, Officer>;
  /** Season-report lines (clan disaffection / over-mighty warnings). */
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
  /** Per-officer betrayal-chance bonus to feed ambition.factionBoost. */
  factionBoost: Record<EntityId, number>;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 世族勢力 — a clan's influence within one realm: how many of its scions serve,
 * weighted by their ability, amplified when the realm leans aristocratic.
 * Returns 0..~100. Pure helper, also used by the UI.
 */
export function clanInfluence(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
  clanId: string,
  stance: Force['recruitmentStance'],
): number {
  const clan = CLANS_BY_ID[clanId];
  if (!clan) return 0;
  let inf = 0;
  for (const id of clan.members) {
    const o = officers[id];
    if (!o || o.forceId !== forceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    const ability = Math.max(o.stats.intelligence, o.stats.politics, o.stats.war);
    inf += 8 + ability * 0.25;
  }
  if (stance === 'aristocratic') inf *= 1.5;
  else if (stance === 'meritocratic') inf *= 0.6;
  return Math.round(Math.min(100, inf));
}

export function tickClans(ctx: ClanTickContext): ClanTickResult {
  const officers = { ...ctx.officers };
  const entries: ClanTickResult['entries'] = [];
  const factionBoost: Record<EntityId, number> = {};
  const rng = mulberry32(ctx.seed);

  const adjust = (id: EntityId, delta: number) => {
    const o = officers[id];
    if (!o) return;
    const loyalty = Math.max(0, Math.min(100, o.loyalty + delta));
    if (loyalty !== o.loyalty) officers[id] = { ...o, loyalty };
  };

  for (const force of Object.values(ctx.forces)) {
    const stance = effectiveStance(force, officers, force.id === ctx.playerForceId);
    if (stance === 'balanced') continue;
    const capital = force.capitalCityId;

    // Loyalty tug: scions vs commoners.
    for (const o of Object.values(officers)) {
      if (o.forceId !== force.id) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      const aristocrat = clanOf(o) !== null;
      if (stance === 'aristocratic') {
        if (aristocrat) adjust(o.id, 1);
        else if (isCommoner(o)) adjust(o.id, -2);
      } else {
        // meritocratic
        if (isCommoner(o)) adjust(o.id, 2);
        else if (aristocrat) adjust(o.id, -1);
      }
    }

    // Per-clan disaffection / over-mighty checks.
    for (const clan of CLANS) {
      const scions = clan.members
        .map((id) => officers[id])
        .filter((o): o is Officer => !!o && o.forceId === force.id && o.status !== 'dead' && o.status !== 'imprisoned');
      if (scions.length === 0) continue;
      const inf = clanInfluence(officers, force.id, clan.id, stance);
      // §7.8-deep E 聯姻 — a clan married into this lord's house keeps faith:
      // its scions hold a loyalty floor.
      const bound = ctx.clanBonds?.[clan.id] === force.id;
      if (bound) for (const o of scions) {
        if (o.loyalty < BOND_LOYALTY_FLOOR) adjust(o.id, Math.min(2, BOND_LOYALTY_FLOOR - o.loyalty));
      }
      const avgLoyalty = scions.reduce((s, o) => s + o.loyalty, 0) / scions.length;

      if (stance === 'meritocratic' && scions.length >= 2 && avgLoyalty < 40) {
        entries.push({
          cityId: capital,
          text: `The ${clan.name.en} (${clan.seat.en}) chafe under ${force.name.en}'s 唯才是舉 — old families feel passed over.`,
          textZh: `${force.name.zh}行唯才是舉,${clan.seat.zh}${clan.name.zh}心懷怨望,自覺見輕。`,
        });
      }

      if (stance === 'aristocratic' && inf >= 70 && !bound) {
        // Over-mighty clan: its ablest low-loyalty scion gets a usurpation push.
        // A clan bound by 聯姻 is exempt — kin of the ruling house don't usurp it.
        let strongman: Officer | null = null;
        for (const o of scions) {
          if (o.loyalty >= 45) continue;
          if (!strongman || ability(o) > ability(strongman)) strongman = o;
        }
        if (strongman) {
          factionBoost[strongman.id] = Math.min(0.06, (inf - 60) * 0.0015 + 0.01);
          if (rng() < 0.25) {
            entries.push({
              cityId: capital,
              text: `${clan.name.en} grows over-mighty in ${force.name.en}; ${strongman.name.en} eclipses the throne's shadow.`,
              textZh: `${clan.name.zh}坐大於${force.name.zh},${strongman.name.zh}權傾朝野,主疑其志。`,
            });
          }
        }
      }
    }
  }

  return { officers, entries, factionBoost };
}

function ability(o: Officer): number {
  return o.stats.war + o.stats.leadership + o.stats.intelligence * 0.6 + o.stats.politics * 0.4;
}

/** Recruit-success modifier the realm's stance + content clans lend. Used by
 *  访贤/劝降. Aristocratic realms open the gentry's doors; meritocratic realms
 *  trade that for breadth (handled by the commoner-arrival path). */
export function stanceRecruitModifier(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
  stance: Force['recruitmentStance'],
): number {
  if (stance !== 'aristocratic') return 0;
  let bonus = 0;
  for (const clan of CLANS) {
    const serving = clan.members.some((id) => {
      const o = officers[id];
      return o && o.forceId === forceId && o.status !== 'dead' && o.status !== 'imprisoned' && o.loyalty >= 50;
    });
    if (serving) bonus += clan.perk.recruitBonus;
  }
  return Math.min(0.3, bonus);
}

/** §7.8-deep — the serving scions of a clan under one lord (alive, not jailed). */
export function clanScions(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
  clanId: string,
): Officer[] {
  const clan = CLANS_BY_ID[clanId];
  if (!clan) return [];
  return clan.members
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o && o.forceId === forceId && o.status !== 'dead' && o.status !== 'imprisoned');
}

/** Average loyalty across a clan's serving scions (0 if none serve). */
export function clanCohesion(scions: Officer[]): number {
  if (scions.length === 0) return 0;
  return scions.reduce((s, o) => s + o.loyalty, 0) / scions.length;
}

/** §7.8-deep G 部曲莊園 — the private retainer troops a *content* clan fields at
 *  its anchor city, from the martial weight of its serving scions. A clan whose
 *  faith has cooled (avg loyalty < 50) withholds them (target 0). */
export function clanLevyTarget(scions: Officer[]): number {
  const avg = clanCohesion(scions);
  if (scions.length === 0 || avg < 50) return 0;
  // Each scion's retinue scales with his command; warmer faith fields more.
  const base = scions.reduce((s, o) => s + 120 + o.stats.leadership * 14, 0);
  return Math.round(base * Math.min(1.2, (avg - 40) / 50)); // avg 50→~0.2× … 90→1×
}

/** §7.8-deep H 舉族叛附 — per-season odds a disaffected serving clan defects en
 *  masse. A clan bound by 聯姻 never does; otherwise deep, shared disaffection
 *  (≥2 scions, low average loyalty) breeds wholesale betrayal. */
export function clanDefectionChance(scions: Officer[], bound: boolean): number {
  if (bound || scions.length < 2) return 0;
  const avg = clanCohesion(scions);
  if (avg >= 28) return 0;
  return Math.min(0.35, (28 - avg) / 90); // avg 27→~0.01 … avg 0→0.31
}

/** §7.8-deep H 策反世族 — the player's chance to turn a rival's whole clan: their
 *  cooler faith and your house's prestige open the door; the rival lord's hold
 *  (his realm's pull) shuts it. Returns 0..~0.9. */
export function clanSubvertChance(args: {
  scions: Officer[];
  myStandingTier: ClanStanding['tier'] | undefined;
  spend: number; // gold offered (per 1000 ≈ +0.06, capped)
}): number {
  const { scions, myStandingTier, spend } = args;
  if (scions.length === 0) return 0;
  const avg = clanCohesion(scions);
  const disaffection = Math.max(0, (60 - avg) / 100); // loyal clans (>60) won't turn
  const prestige = myStandingTier === 'great' ? 0.18 : myStandingTier === 'gentry' ? 0.09 : 0;
  const coin = Math.min(0.24, spend / 1000 * 0.06);
  return Math.max(0, Math.min(0.9, disaffection + prestige + coin));
}

// ─── 家門聲望 — cross-generation prestige layered on the curated identity ──────
// A separate axis from the realm's 門第政策 above: each house accrues 聲望 from
// its members' standing (品階/爵位/戰功) and famous ancestors, rising 寒門 → 士族
// → 世家 over a campaign. Emergent player bloodlines key on `house-<founderId>`
// (set on heir 出仕 / 收養). Pure; recomputed yearly (winter). See §2.5.

// Balance constants.
const PRESTIGE_MAX = 1000;
/** Prestige bands cutting 寒門 / 士族 / 世家. */
const TIER_GENTRY = 115;
const TIER_GREAT = 250;
/** Each year, prestige eases this fraction toward the freshly-computed target. */
const PRESTIGE_EASE = 0.34;
/** A fallen house keeps standing at this fraction of its peak (名門 lingers). */
const PEAK_FLOOR = 0.6;
/** Per-member weights: brightest member full, the rest discounted, dead ancestors a faint echo. */
const REST_WEIGHT = 0.45;
const ANCESTOR_WEIGHT = 0.3;
/** 爵位 prestige multiplier (peerageTier × this). */
const PEERAGE_WEIGHT = 6;
/** 戰功威望 (renown) cap into prestige. */
const RENOWN_CAP = 20;

/** Recognized two-character surnames so an emergent 司馬/諸葛 house labels right. */
const COMPOUND_SURNAMES = [
  '司馬', '諸葛', '夏侯', '歐陽', '公孫', '太史', '皇甫', '上官', '東方',
  '令狐', '鍾離', '尉遲', '長孫', '宇文', '慕容', '司徒', '司空', '濮陽',
];

function surnameOf(zhName: string): string {
  for (const s of COMPOUND_SURNAMES) if (zhName.startsWith(s)) return s;
  return zhName.charAt(0);
}

function memberContribution(o: Officer): number {
  const base = gradeScore(o); // ~40–110
  const peer = peerageTier(o.peerageId) * PEERAGE_WEIGHT;
  const ren = Math.min(RENOWN_CAP, Math.sqrt(Math.max(0, o.renown ?? 0)) * 2);
  return base + peer + ren;
}

interface ClanTarget { prestige: number; nameZh: string; nameEn?: string; founderId?: EntityId; }

/** Group officers by clan id (curated id or runtime clanId) and compute targets. */
function computeClanTargets(officers: Record<EntityId, Officer>): Record<string, ClanTarget> {
  const groups: Record<string, Officer[]> = {};
  for (const o of Object.values(officers)) {
    if (o.status === 'unsearched') continue; // 在野 wanderers aren't a house yet
    const key = clanOf(o); // honors o.clanId, else curated membership; null otherwise
    if (!key) continue;
    (groups[key] ??= []).push(o);
  }

  const out: Record<string, ClanTarget> = {};
  for (const [key, members] of Object.entries(groups)) {
    if (members.length < 2) continue; // a house needs ≥2 known members
    const living = members.filter((m) => m.status !== 'dead');
    const dead = members.filter((m) => m.status === 'dead');
    const livingC = living.map(memberContribution).sort((a, b) => b - a);
    const top = livingC[0] ?? 0;
    const rest = livingC.slice(1).reduce((s, c) => s + c, 0) * REST_WEIGHT;
    const ancestors = dead.map(memberContribution).reduce((s, c) => s + c, 0) * ANCESTOR_WEIGHT;
    const prestige = Math.min(PRESTIGE_MAX, Math.round(top + rest + ancestors));

    const founder = [...members].sort((a, b) => a.birthYear - b.birthYear)[0];
    const curated = CLANS_BY_ID[key];
    out[key] = {
      prestige,
      nameZh: curated ? curated.name.zh : `${surnameOf(founder?.name.zh ?? '')}氏`,
      nameEn: curated ? curated.name.en : founder?.name.en.split(' ')[0],
      founderId: founder?.id,
    };
  }
  return out;
}

function clanStandingValue(prestige: number, peak: number | undefined): number {
  return Math.max(prestige, (peak ?? prestige) * PEAK_FLOOR);
}

function tierFromStanding(standing: number): ClanStanding['tier'] {
  if (standing >= TIER_GREAT) return 'great';
  if (standing >= TIER_GENTRY) return 'gentry';
  return 'humble';
}

/** Build the initial standings map (scenario start / old-save backfill). */
export function deriveInitialClanStandings(
  officers: Record<EntityId, Officer>,
): Record<string, ClanStanding> {
  const targets = computeClanTargets(officers);
  const out: Record<string, ClanStanding> = {};
  for (const [id, t] of Object.entries(targets)) {
    out[id] = {
      id,
      nameZh: t.nameZh,
      nameEn: t.nameEn,
      prestige: t.prestige,
      peakPrestige: t.prestige,
      tier: tierFromStanding(clanStandingValue(t.prestige, t.prestige)),
      founderId: t.founderId,
    };
  }
  return out;
}

/**
 * Yearly prestige recompute (winter). Rebuilds targets from current members,
 * eases each house toward its target, refreshes the peak, and reports a house
 * crossing up into 士族/世家.
 */
export function tickClanStandings(
  officers: Record<EntityId, Officer>,
  prev: Record<string, ClanStanding>,
): { clanStandings: Record<string, ClanStanding>; entries: ReportEntry[] } {
  const targets = computeClanTargets(officers);
  const out: Record<string, ClanStanding> = {};
  const entries: ReportEntry[] = [];

  for (const [id, t] of Object.entries(targets)) {
    const p = prev[id];
    const prevPrestige = p?.prestige ?? t.prestige;
    const eased = Math.round(prevPrestige + (t.prestige - prevPrestige) * PRESTIGE_EASE);
    const peak = Math.max(p?.peakPrestige ?? 0, eased);
    const tier = tierFromStanding(clanStandingValue(eased, peak));
    out[id] = { id, nameZh: t.nameZh, nameEn: t.nameEn ?? p?.nameEn, prestige: eased, peakPrestige: peak, tier, founderId: p?.founderId ?? t.founderId };

    if (p && p.tier !== tier && (tier === 'great' || (tier === 'gentry' && p.tier === 'humble'))) {
      const label = tier === 'great' ? { zh: '世家', en: 'a great house' } : { zh: '士族', en: 'a gentry house' };
      entries.push({
        cityId: null, kind: 'talent',
        text: `The ${t.nameEn ?? t.nameZh} has risen to ${label.en}.`,
        textZh: `${t.nameZh}聲望日隆,躋身${label.zh}。`,
      });
    }
  }
  return { clanStandings: out, entries };
}

// ── Pure readers (consumed by other systems; never import them back here) ──────

export function clanTierOf(o: Officer, standings: Record<string, ClanStanding>): ClanStanding['tier'] {
  const id = clanOf(o);
  if (!id) return 'humble';
  return standings[id]?.tier ?? 'humble';
}

/** 世家蔭澤 — recruit + loyalty bonuses from a house's standing (寒門 gets none). */
export function clanPrestigeBonus(
  o: Officer,
  standings: Record<string, ClanStanding>,
): { recruit: number; loyalty: number } {
  const tier = clanTierOf(o, standings);
  if (tier === 'great') return { recruit: 0.08, loyalty: 1 };
  if (tier === 'gentry') return { recruit: 0.03, loyalty: 0 };
  return { recruit: 0, loyalty: 0 };
}

/**
 * 門閥權重 — per-officer gentry lean from clan standing, fed to
 * deriveCourtFactions: a 世家 member tilts toward 門閥, 士族 a little. 0 = none.
 */
export function clanGentryWeight(
  officers: Record<EntityId, Officer>,
  standings: Record<string, ClanStanding>,
): Record<EntityId, number> {
  const out: Record<EntityId, number> = {};
  for (const o of Object.values(officers)) {
    const tier = clanTierOf(o, standings);
    out[o.id] = tier === 'great' ? 1 : tier === 'gentry' ? 0.5 : 0;
  }
  return out;
}
