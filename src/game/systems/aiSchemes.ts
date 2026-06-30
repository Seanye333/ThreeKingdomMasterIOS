/**
 * AI 大局計略 — gives the AI the same scheming agency the player already has.
 *
 * The player can run 驅虎吞狼 / 二虎競食 / 遠交近攻 from the 計略 panel
 * (see store.executeScheme). Until now the AI never reciprocated, so the
 * whole soft-power layer was one-directional and inert. Each season every
 * AI force with a capable strategist and spare silver may now plot:
 *
 *   • goad its strongest neighbour into war with a THIRD party (so the
 *     threat is spent on someone else — often the player's other border);
 *   • set two of its rival neighbours at each other's throats;
 *   • court a distant power for a cheap friendship.
 *
 * Effects mirror the player's schemes exactly (relation swings + 討伐
 * casus-belli marks) so the strategic AI reacts to them through the same
 * channels. Runs on the caller's seasonal rng; one attempt per force.
 */
import type { City, EntityId, Force, Officer, ReportEntry } from '../types';
import type { RulerPersonality } from '../types/personality';
import type { DiplomaticState } from '../types/diplomacy';
import { getRelation, pairKey } from '../types/diplomacy';
import { SCHEME_DEFS, schemeOdds, schemeExposureChance, forcesAdjacent, type SchemeId } from './schemes';
import { pickAdvisor } from './advisor';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface CasusBelliMark {
  byForceId: EntityId;
  targetForceId: EntityId;
  expiresYear: number;
  expiresSeason: Season;
}

export interface AISchemeContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  diplomacy: DiplomaticState;
  playerForceId: EntityId | null | undefined;
  date: { year: number; season: Season };
  rng: () => number;
}

export interface AISchemeOutput {
  diplomacy: DiplomaticState;
  cities: Record<EntityId, City>;
  marks: CasusBelliMark[];
  entries: ReportEntry[];
}

/** How keen each ruler type is to plot rather than march. */
const SCHEMER_APPETITE: Record<RulerPersonality, number> = {
  opportunist: 1.4,
  tyrant: 1.2,
  aggressive: 1.05,
  expansionist: 1.0,
  hesitant: 0.85,
  defensive: 0.7,
  scholar: 0.6,
  cautious: 0.5,
};

function costOf(id: SchemeId): number {
  return SCHEME_DEFS.find((d) => d.id === id)?.goldCost ?? 9999;
}

/** Total troops a force fields in cities bordering `near`. Rough threat proxy. */
function borderPressure(cities: Record<EntityId, City>, of: EntityId, near: EntityId): number {
  let t = 0;
  for (const c of Object.values(cities)) {
    if (c.ownerForceId !== of) continue;
    for (const adj of c.adjacentCityIds ?? []) {
      if (cities[adj]?.ownerForceId === near) { t += c.troops; break; }
    }
  }
  return t;
}

function liveForceIds(cities: Record<EntityId, City>): Set<EntityId> {
  const s = new Set<EntityId>();
  for (const c of Object.values(cities)) if (c.ownerForceId) s.add(c.ownerForceId);
  return s;
}

export function resolveAISchemes(ctx: AISchemeContext): AISchemeOutput {
  const { forces, officers, cities, playerForceId, date, rng } = ctx;
  const relations = { ...ctx.diplomacy.relations };
  const outCities = { ...cities };
  const marks: CasusBelliMark[] = [];
  const entries: ReportEntry[] = [];

  const live = liveForceIds(cities);
  const allIds = [...live];

  const setRel = (x: EntityId, y: EntityId, delta: number) => {
    const key = pairKey(x, y);
    const cur = relations[key] ?? {
      forceA: x < y ? x : y, forceB: x < y ? y : x, score: 0, status: 'neutral' as const,
    };
    relations[key] = { ...cur, score: Math.max(-100, Math.min(100, cur.score + delta)) };
  };
  const markCB = (by: EntityId, target: EntityId) => {
    marks.push({ byForceId: by, targetForceId: target, expiresYear: date.year + 2, expiresSeason: date.season });
  };

  for (const force of Object.values(forces)) {
    if (!live.has(force.id)) continue;            // dead / no cities
    if (force.id === playerForceId) continue;     // the player plots for themselves
    const ruler = officers[force.rulerOfficerId];
    if (!ruler || ruler.status === 'dead') continue;

    const appetite = SCHEMER_APPETITE[force.personality ?? 'opportunist'] ?? 1.0;
    const strategist = pickAdvisor(officers, force.id);
    if (!strategist) continue;                    // no mind sharp enough to plot

    // Per-season attempt gate. A clever court plots more; a dull one rarely.
    const attemptChance = Math.min(0.3, 0.1 * appetite * (0.55 + strategist.stats.intelligence / 220));
    if (rng() >= attemptChance) continue;

    const capital = outCities[force.capitalCityId];
    if (!capital) continue;

    // Rank rival forces by the pressure they put on *us* — our biggest
    // headache is the one we most want pointed elsewhere.
    const others = allIds.filter((id) => id !== force.id);
    const adjacentRivals = others
      .filter((id) => forcesAdjacent(outCities, force.id, id))
      .map((id) => ({ id, pressure: borderPressure(outCities, id, force.id) }))
      .sort((a, b) => b.pressure - a.pressure);

    type Plan = { scheme: SchemeId; a: EntityId; b?: EntityId; relText: string };
    let plan: Plan | null = null;

    // ── 1) 驅虎吞狼 — goad our top neighbour (E) into war with a third party. ──
    if (adjacentRivals.length > 0) {
      const E = adjacentRivals[0].id;
      // A victim E can plausibly be turned on: adjacent to E, not us, not E,
      // and the pair E already gets along with worst.
      const victims = others
        .filter((id) => id !== E && forcesAdjacent(outCities, E, id))
        .map((id) => ({ id, rel: getRelation(ctx.diplomacy, E, id).score }))
        .sort((a, b) => a.rel - b.rel);
      if (victims.length > 0) {
        plan = { scheme: 'tiger-wolf', a: E, b: victims[0].id, relText: '' };
      }
    }

    // ── 2) 二虎競食 — if two rival neighbours flank us, pit them together. ──
    if (!plan && adjacentRivals.length >= 2) {
      const a = adjacentRivals[0].id;
      const b = adjacentRivals[1].id;
      if (a !== b && forcesAdjacent(outCities, a, b)) {
        plan = { scheme: 'two-tigers', a, b, relText: '' };
      }
    }

    // ── 2.5) 離間盟好 — shatter the protective pact of our worst neighbour, ──
    //         isolating it (and, by preference, prying apart the player's friends).
    if (!plan && adjacentRivals.length > 0) {
      const E = adjacentRivals[0].id;
      const partners = others
        .filter((id) => id !== E)
        .map((id) => ({ id, rel: getRelation(ctx.diplomacy, E, id) }))
        .filter((p) => p.rel.status === 'allied' || p.rel.status === 'non-aggression')
        // Prefer breaking a pact that involves the player, then the shallowest bond.
        .sort((a, b) => (a.id === playerForceId ? -1 : b.id === playerForceId ? 1 : a.rel.score - b.rel.score));
      if (partners.length > 0) {
        plan = { scheme: 'sow-discord', a: E, b: partners[0].id, relText: '' };
      }
    }

    // ── 2.7) 流言亂政 — sow realm-wide unrest in our single biggest threat. ──
    if (!plan && adjacentRivals.length > 0 && rng() < 0.5) {
      plan = { scheme: 'sow-chaos', a: adjacentRivals[0].id, relText: '' };
    }

    // ── 3) 遠交近攻 — else court a strong, non-bordering power. ──
    if (!plan) {
      const distant = others
        .filter((id) => !forcesAdjacent(outCities, force.id, id))
        .map((id) => ({ id, strength: borderPressure(outCities, id, id) + Object.values(outCities).filter((c) => c.ownerForceId === id).length * 1000 }))
        .sort((a, b) => b.strength - a.strength);
      if (distant.length > 0) {
        plan = { scheme: 'far-friend', a: distant[0].id, relText: '' };
      }
    }

    if (!plan) continue;
    const cost = costOf(plan.scheme);
    if (capital.gold < cost) continue;

    // Pay the silver up front — schemes spend coin before they spend luck.
    outCities[capital.id] = { ...capital, gold: capital.gold - cost };
    const odds = schemeOdds(plan.scheme, ctx.diplomacy, strategist, plan.a, plan.b);
    if (rng() >= odds) continue; // plot failed — silver wasted, no news

    const fname = (id: EntityId) => forces[id]?.name.zh ?? id;
    const fnameEn = (id: EntityId) => forces[id]?.name.en ?? id;
    const involvesPlayer = playerForceId != null && (plan.a === playerForceId || plan.b === playerForceId);

    if (plan.scheme === 'sow-discord') {
      // Break A & B's pact: status → neutral, relation sours.
      const key = pairKey(plan.a, plan.b!);
      const cur = relations[key] ?? { forceA: plan.a < plan.b! ? plan.a : plan.b!, forceB: plan.a < plan.b! ? plan.b! : plan.a, score: 0, status: 'neutral' as const };
      relations[key] = { ...cur, status: 'neutral', score: Math.max(-100, Math.min(100, cur.score - 30)) };
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)} sows discord, shattering the pact between ${fnameEn(plan.a)} and ${fnameEn(plan.b!)}${involvesPlayer ? ' — your alliance is undone' : ''}.`,
        textZh: `${fname(force.id)}行離間之計，破${fname(plan.a)}與${fname(plan.b!)}之盟${involvesPlayer ? '（汝之盟好頓裂！）' : ''}。`,
      });
    } else if (plan.scheme === 'sow-chaos') {
      // Realm-wide unrest: every city of the target loses heart.
      for (const c of Object.values(outCities)) {
        if (c.ownerForceId === plan.a) outCities[c.id] = { ...c, loyalty: Math.max(0, c.loyalty - 7) };
      }
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)} spreads rumours through ${fnameEn(plan.a)}'s realm — its cities lose heart${involvesPlayer ? ' (your people waver)' : ''}.`,
        textZh: `${fname(force.id)}散布流言於${fname(plan.a)}全境，民心動搖${involvesPlayer ? '（汝境亦惑！）' : ''}。`,
      });
    } else if (plan.scheme === 'far-friend') {
      setRel(force.id, plan.a, +25);
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)} courts the distant ${fnameEn(plan.a)} (relations +25).`,
        textZh: `${fname(force.id)}遣使遠交${fname(plan.a)}，結好於遠（關係 +25）。`,
      });
    } else if (plan.scheme === 'tiger-wolf') {
      setRel(plan.a, plan.b!, -50);
      markCB(plan.a, plan.b!);
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)} drives ${fnameEn(plan.a)} against ${fnameEn(plan.b!)}${involvesPlayer ? ' — and you are in the path' : ''}.`,
        textZh: `${fname(force.id)}行驅虎吞狼之計，激${fname(plan.a)}攻${fname(plan.b!)}${involvesPlayer ? '（兵鋒及汝！）' : ''}。`,
      });
    } else {
      setRel(plan.a, plan.b!, -30);
      markCB(plan.a, plan.b!);
      markCB(plan.b!, plan.a);
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)} sets ${fnameEn(plan.a)} and ${fnameEn(plan.b!)} at each other${involvesPlayer ? ' — you are drawn in' : ''}.`,
        textZh: `${fname(force.id)}行二虎競食之計，使${fname(plan.a)}與${fname(plan.b!)}相攻${involvesPlayer ? '（汝亦在局中）' : ''}。`,
      });
    }

    // 反間敗露 — even a landed plot may be traced back; the dupes sour toward the schemer
    // (so a scheme aimed at YOU can be seen through, souring you on its author).
    if (plan.scheme !== 'far-friend' && rng() < schemeExposureChance(plan.scheme, true, strategist.stats.intelligence)) {
      const dupes = plan.b ? [plan.a, plan.b] : [plan.a];
      for (const d of dupes) setRel(d, force.id, -12);
      const sawThrough = playerForceId != null && dupes.includes(playerForceId);
      entries.push({
        cityId: null, kind: 'note',
        text: `${fnameEn(force.id)}'s plot is exposed — ${dupes.map(fnameEn).join(' & ')} turn cold toward it${sawThrough ? ' (you see through the scheme)' : ''}.`,
        textZh: `${fname(force.id)}之計敗露，${dupes.map(fname).join('、')}識破而疏之${sawThrough ? '（汝已識破其謀）' : ''}。`,
      });
    }
  }

  return { diplomacy: { ...ctx.diplomacy, relations }, cities: outCities, marks, entries };
}
