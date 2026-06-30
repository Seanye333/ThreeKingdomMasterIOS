import type { City, EntityId, Force, Officer } from '../types';
import { buildingBonuses } from './buildings';
import { getLordRapport, isConfidant } from './rapport';
import { peerageEffects } from '../data/peerage';

/**
 * 權謀 — officer ambition, betrayal and usurpation.
 *
 * The realm's loyalty/trait/grievance data already exists but sits inert; this
 * turns it into emergent drama. Once per season, a discontented, ambitious,
 * *landed* officer may turn on his lord:
 *   • 簒奪 (usurp)   — a general who eclipses a weak AI lord seizes the whole
 *                      force; the old ruler is cast out as a free agent.
 *   • 割據 (breakaway) — else he raises his own banner at the city he holds,
 *                      seceding into a new force (drags along close sympathisers).
 * The player's force can only be *broken away from*, never usurped out from
 * under the player — losing a province to a slighted general is a fair penalty
 * for letting loyalty rot; losing the throne outright is not.
 *
 * Uses its OWN date-seeded RNG so it never perturbs the main resolution stream
 * (and thus the existing deterministic tests). The `loyal` trait is immune.
 */

export interface AmbitionContext {
  /** Mutated in place (immutable per-entry, like the surrounding resolution code). */
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null | undefined;
  /** Deterministic seed (derive from the campaign date) — keeps it off the main rng. */
  seed: number;
  /**
   * Optional per-officer betrayal-chance bonus (0..~0.06), derived from court
   * factions: a strongman whose own faction dominates the court has a clique
   * at his back and is far likelier to move. Keyed by officer id.
   */
  factionBoost?: Record<EntityId, number>;
  /** City buildings — a 牢城 (prison) at the officer's seat blunts betrayal. */
  buildings?: import('../types').Building[];
  /** 君臣好感 — an officer's regard for their lord. A 心腹 (≥80) never moves;
   *  resentment (negative) emboldens, warmth (positive) restrains. */
  lordRapport?: Record<EntityId, number>;
  /** Diplomatic state — for 內應獻城 (a traitor may hand his city to a rival the
   *  realm is at odds with, §7.5 ②). */
  diplomacy?: import('../types/diplomacy').DiplomaticState;
}

export interface AmbitionEvent {
  cityId: EntityId;
  kind: 'rebellion' | 'note';
  text: string;
  textZh: string;
  /** true = usurpation (force changed hands), false = breakaway (new force). */
  usurp: boolean;
  /** 謀反前兆 — a warning that an officer is disaffected and may yet move (§7.5 ①),
   *  not a rebellion that fired. The player can pre-empt it (disciplineOfficer). */
  warning?: boolean;
}

const BREAKAWAY_PALETTE = ['#8a5a2a', '#6a3a5a', '#3a6a5a', '#7a5a8a', '#5a6a3a', '#9a4a3a', '#3a5a7a', '#6a6a3a'];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hasTrait(o: Officer, t: string): boolean {
  return !!o.traits?.includes(t as never);
}

/** Rough martial+civil weight — used to compare a general against his lord. */
function capability(o: Officer): number {
  return o.stats.war + o.stats.leadership + o.stats.intelligence * 0.6 + o.stats.politics * 0.4;
}

/**
 * 權勢 (§7.5 ③) — how over-mighty a minister is: raw capability plus the weight
 * of a great fief. A high-權勢 general (a 司馬懿) can usurp even a lord he does
 * not outright eclipse, at a less ruinous loyalty, and drags a larger faction
 * when he breaks away. Roughly 0.6 (a minor officer) … ~1.6 (a peerless 權臣).
 */
function powerWeight(o: Officer): number {
  return capability(o) / 300 + peerageEffects(o).ambitionPressure * 0.1;
}

/** The strongest rival force bordering `cityId` (by city count), or null. */
function strongestBorderingRival(
  cityId: EntityId, ownForceId: EntityId,
  cities: Record<EntityId, City>,
): EntityId | null {
  const home = cities[cityId];
  if (!home) return null;
  const counts: Record<string, number> = {};
  for (const adjId of home.adjacentCityIds ?? []) {
    const owner = cities[adjId]?.ownerForceId;
    if (owner && owner !== ownForceId) counts[owner] = (counts[owner] ?? 0) + 1;
  }
  let best: EntityId | null = null, bestN = 0;
  for (const [fid, n] of Object.entries(counts)) {
    const total = Object.values(cities).filter((c) => c.ownerForceId === fid).length;
    if (total + n > bestN) { bestN = total + n; best = fid; }
  }
  return best;
}

export function resolveAmbitions(ctx: AmbitionContext): AmbitionEvent[] {
  const { officers, cities, forces, playerForceId } = ctx;
  const rng = mulberry32(ctx.seed);
  const events: AmbitionEvent[] = [];
  // 謀反前兆 — the player's disaffected candidates that DIDN'T move this season,
  // so a single heads-up can be raised (the player may pre-empt them).
  const playerAtRisk: Array<{ o: Officer; chance: number; home: City }> = [];
  const rebelled = new Set<EntityId>();

  // City ids per force (need ≥2 to risk a betrayal — never decapitate a 1-city force).
  const cityIdsByForce: Record<string, EntityId[]> = {};
  for (const c of Object.values(cities)) {
    if (c.ownerForceId) (cityIdsByForce[c.ownerForceId] ??= []).push(c.id);
  }

  for (const o of Object.values(officers)) {
    // ── Cheap deterministic gates: NO rng is consumed until a real candidate. ──
    if (!o.forceId) continue;
    if (o.status !== 'idle' && o.status !== 'active') continue; // skip dead/imprisoned/etc
    const force = forces[o.forceId];
    if (!force) continue;
    if (force.rulerOfficerId === o.id) continue;          // a lord doesn't betray himself
    if (hasTrait(o, 'loyal')) continue;                   // the faithful never turn
    if (isConfidant(ctx.lordRapport ?? {}, o.id)) continue; // a 心腹 never turns on their lord
    if (o.loyalty >= 30) continue;                        // must be discontented
    const grievance = o.grievanceCount ?? 0;
    const ambitious = hasTrait(o, 'ambitious');
    const arrogant = hasTrait(o, 'arrogant');
    if (!ambitious && !arrogant && grievance < 3) continue; // need a motive
    const homeId = o.locationCityId;
    if (!homeId) continue;
    const home = cities[homeId];
    if (!home || home.ownerForceId !== o.forceId) continue; // must hold a force city
    const forceCities = cityIdsByForce[o.forceId] ?? [];
    if (forceCities.length < 2) continue;

    // ── Genuine candidate → roll the betrayal chance (isolated rng). ──
    const disloyalty = (30 - o.loyalty) / 30; // 0..1
    let chance = 0.03 + 0.05 * disloyalty;
    chance += Math.min(0.1, grievance * 0.025);
    if (ambitious) chance += 0.05;
    if (arrogant) chance += 0.02;
    chance += ctx.factionBoost?.[o.id] ?? 0; // a faction at his back emboldens him
    // 君臣好感 — resentment toward the lord stokes the move; lingering warmth
    // (short of 心腹) stays his hand.
    const lr = getLordRapport(ctx.lordRapport ?? {}, o.id);
    if (lr < 0) chance += Math.min(0.2, -lr * 0.002);
    else if (lr > 0) chance -= lr * 0.002;
    // 封爵養虎 — a great fief swells a discontented, non-confidant noble's
    // designs (列侯自立 / 養成權臣). The two great fiefs (公/王) push hardest.
    const fiefPressure = peerageEffects(o).ambitionPressure;
    if (fiefPressure > 0) chance += fiefPressure * 0.012;
    // 牢城 — a prison/court at his seat keeps the discontented in line.
    chance *= 1 - buildingBonuses(homeId, ctx.buildings ?? []).defectionResist;
    if (chance <= 0) continue;
    if (o.forceId === playerForceId) playerAtRisk.push({ o, chance, home });
    if (rng() >= chance) continue;

    const ruler = officers[force.rulerOfficerId];
    // 權勢 (§7.5 ③) — an over-mighty minister needs less of an edge to usurp,
    // and may move at a higher loyalty than a mere malcontent (司馬懿之漸).
    const power = powerWeight(o);
    const usurpEdge = 1.35 - Math.min(0.35, Math.max(0, power - 1) * 0.6);
    const dominates = ruler ? capability(o) > capability(ruler) * usurpEdge : true;
    const usurpLoyaltyCap = power >= 1.2 ? 30 : 25;
    const isPlayerForce = o.forceId === playerForceId;
    const homeIsCapital = force.capitalCityId === homeId;

    // ── 簒奪 — against an AI lord the (over-mighty) general eclipses. A great
    // fief / 權臣 emboldens the noble to seize the throne outright. ──
    const usurpThreshold = 0.5 + Math.min(0.3, fiefPressure * 0.05) + Math.min(0.2, Math.max(0, power - 1) * 0.3);
    if (!isPlayerForce && dominates && grievance >= 2 && o.loyalty < usurpLoyaltyCap && rng() < usurpThreshold) {
      if (ruler) {
        officers[ruler.id] = {
          ...ruler,
          forceId: null,
          loyalty: 50,
          task: null,
          status: 'idle',
          locationCityId: force.capitalCityId,
        };
      }
      forces[force.id] = { ...force, rulerOfficerId: o.id };
      officers[o.id] = { ...o, loyalty: 100, grievanceCount: 0, task: null };
      rebelled.add(o.id);
      events.push({
        cityId: force.capitalCityId,
        kind: 'rebellion',
        usurp: true,
        text: `${o.name.en} (${o.name.zh}) eclipses ${ruler?.name.en ?? 'his lord'} and seizes the reins of ${force.name.en}.`,
        textZh: `${o.name.zh}威權既盛,廢${ruler?.name.zh ?? '其主'}而代之,${force.name.zh}易主!`,
      });
      continue;
    }

    // ── never hand over (or secede) the capital ──
    if (homeIsCapital) continue;

    // ── 內應獻城 (§7.5 ②) — rather than raise a lone banner, a traitor may throw
    // his city open to a strong bordering rival (worse: it feeds a real power, not
    // a one-city rump). Likelier for the bitterly disloyal. Applies to the player
    // force too — a slighted general can hand your border city to an enemy. ──
    const rivalId = strongestBorderingRival(homeId, o.forceId, cities);
    if (rivalId && forces[rivalId]) {
      const betrayChance = 0.4 + (25 - o.loyalty) * 0.01; // ~0.4..0.65
      if (rng() < betrayChance) {
        const rival = forces[rivalId];
        cities[homeId] = {
          ...home,
          ownerForceId: rivalId,
          loyalty: Math.max(25, Math.min(60, home.loyalty)),
        };
        officers[o.id] = { ...o, forceId: rivalId, loyalty: 60, grievanceCount: 0, task: null };
        rebelled.add(o.id);
        events.push({
          cityId: homeId,
          kind: 'rebellion',
          usurp: false,
          text: `${o.name.en} (${o.name.zh}) throws open the gates of ${home.name.en} to ${rival.name.en} — a traitor within!`,
          textZh: `${o.name.zh}開${home.name.zh}城門以納${rival.name.zh},內應獻城,城遂易主!`,
        });
        continue;
      }
    }

    // ── 割據 — secede with a (non-capital) held city into a new force. ──
    const newForceId = `breakaway-${o.id}`;
    if (forces[newForceId]) continue; // already broke away once
    const splitTroops = Math.floor(home.troops / 2);
    const color = BREAKAWAY_PALETTE[hashId(o.id) % BREAKAWAY_PALETTE.length];
    forces[newForceId] = {
      id: newForceId,
      name: { zh: `${o.name.zh}軍`, en: `${o.name.en}'s Host` },
      rulerOfficerId: o.id,
      capitalCityId: homeId,
      color,
      isPlayer: false,
      imperialRank: 'commoner',
      personality: 'opportunist',
    };
    cities[homeId] = {
      ...home,
      ownerForceId: newForceId,
      troops: Math.max(500, home.troops - splitTroops),
      loyalty: Math.max(25, Math.min(70, home.loyalty)),
    };
    officers[o.id] = { ...o, forceId: newForceId, loyalty: 100, grievanceCount: 0, task: null };

    // Drag along same-city sympathisers (officers of the old force here whose own
    // loyalty is shaky) — a breakaway should feel like a faction; an over-mighty
    // 權臣 (high 權勢) pulls a larger clique (§7.5 ③).
    const pullCap = power >= 1.2 ? 3 : 2;
    let pulled = 0;
    for (const other of Object.values(officers)) {
      if (pulled >= pullCap) break;
      if (other.id === o.id) continue;
      if (other.forceId !== force.id) continue;
      if (other.locationCityId !== homeId) continue;
      if (other.status !== 'idle' && other.status !== 'active') continue;
      if (hasTrait(other, 'loyal')) continue;
      if (other.loyalty >= 45) continue;
      officers[other.id] = { ...other, forceId: newForceId, loyalty: Math.max(60, other.loyalty), task: null };
      pulled++;
    }

    rebelled.add(o.id);
    events.push({
      cityId: homeId,
      kind: 'rebellion',
      usurp: false,
      text: `${o.name.en} (${o.name.zh}) raises his own banner at ${home.name.en}, breaking from ${force.name.en}.`,
      textZh: `${o.name.zh}據${home.name.zh}自立旗號,叛${force.name.zh}而去!`,
    });
  }

  // 謀反前兆 (§7.5 ①) — one heads-up for the player's most dangerous malcontent
  // who has NOT yet moved, so they may placate / reassign / jail / purge in time.
  const lurking = playerAtRisk
    .filter((r) => !rebelled.has(r.o.id))
    .sort((a, b) => b.chance - a.chance)[0];
  if (lurking) {
    events.push({
      cityId: lurking.home.id,
      kind: 'note',
      usurp: false,
      warning: true,
      text: `${lurking.o.name.en} (${lurking.o.name.zh}) at ${lurking.home.name.en} harbours treasonous designs — placate, reassign, or remove them before they move.`,
      textZh: `${lurking.o.name.zh}居${lurking.home.name.zh},心懷異志,慎防之 —— 宜安撫、調離,或先發制人。`,
    });
  }

  return events;
}

/**
 * 兵變嘩變 (§7.5 ④) — independent of officer ambition: a starving, mutinous
 * garrison (very low loyalty + food too thin to feed the troops) breaks ranks —
 * soldiers desert in droves and morale collapses further. Pure & rng-seeded.
 */
export function rollGarrisonMutiny(input: {
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  seed: number;
}): { cities: Record<EntityId, City>; events: AmbitionEvent[] } {
  const cities = { ...input.cities };
  const events: AmbitionEvent[] = [];
  const rng = mulberry32(input.seed ^ 0x9e3779b9);
  for (const c of Object.values(input.cities)) {
    if (!c.ownerForceId || c.troops < 500) continue;
    // Mutiny brews where the garrison is both disaffected (loyalty < 18) and
    // starving (stores below half a season's keep for the troops on hand).
    if (c.loyalty >= 18) continue;
    if (c.food >= c.troops * 0.5) continue;
    if (rng() >= 0.3) continue;
    const deserted = Math.floor(c.troops * (0.2 + rng() * 0.15)); // 20–35% bolt
    cities[c.id] = {
      ...c,
      troops: Math.max(0, c.troops - deserted),
      loyalty: Math.max(0, c.loyalty - 10),
    };
    const force = input.forces[c.ownerForceId];
    events.push({
      cityId: c.id, kind: 'rebellion', usurp: false,
      text: `兵變 — the starving garrison of ${c.name.en} mutinies; ${deserted.toLocaleString()} troops desert${force?.isPlayer ? '' : ` (${force?.name.en ?? ''})`}.`,
      textZh: `${c.name.zh}守軍缺餉乏糧,嘩變潰散,逃卒 ${deserted.toLocaleString()}!`,
    });
  }
  return { cities, events };
}

/**
 * 心懷異志 (§7.5 ①) — the player's disaffected, landed, ambitious officers who
 * are at risk of rebelling, for the UI to flag. Mirrors the candidate gates in
 * resolveAmbitions (without consuming rng). Returns officer ids → rough risk 0..1.
 */
export function brewingRebels(
  officers: Record<EntityId, Officer>,
  forces: Record<EntityId, Force>,
  cities: Record<EntityId, City>,
  playerForceId: EntityId | null | undefined,
  lordRapport?: Record<EntityId, number>,
): Record<EntityId, number> {
  const out: Record<EntityId, number> = {};
  if (!playerForceId) return out;
  const cityCountByForce: Record<string, number> = {};
  for (const c of Object.values(cities)) if (c.ownerForceId) cityCountByForce[c.ownerForceId] = (cityCountByForce[c.ownerForceId] ?? 0) + 1;
  for (const o of Object.values(officers)) {
    if (o.forceId !== playerForceId || (o.status !== 'idle' && o.status !== 'active')) continue;
    const force = forces[o.forceId];
    if (!force || force.rulerOfficerId === o.id) continue;
    if (hasTrait(o, 'loyal') || isConfidant(lordRapport ?? {}, o.id)) continue;
    if (o.loyalty >= 30) continue;
    const grievance = o.grievanceCount ?? 0;
    if (!hasTrait(o, 'ambitious') && !hasTrait(o, 'arrogant') && grievance < 3) continue;
    const home = o.locationCityId ? cities[o.locationCityId] : null;
    if (!home || home.ownerForceId !== o.forceId) continue;
    if ((cityCountByForce[o.forceId] ?? 0) < 2) continue;
    // Rough risk for display (not the exact roll).
    let risk = (30 - o.loyalty) / 30 * 0.5 + Math.min(0.3, grievance * 0.08);
    if (hasTrait(o, 'ambitious')) risk += 0.15;
    out[o.id] = Math.min(1, risk);
  }
  return out;
}
