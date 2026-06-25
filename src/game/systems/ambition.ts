import type { City, EntityId, Force, Officer } from '../types';
import { buildingBonuses } from './buildings';
import { getLordRapport, isConfidant } from './rapport';

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
}

export interface AmbitionEvent {
  cityId: EntityId;
  kind: 'rebellion';
  text: string;
  textZh: string;
  /** true = usurpation (force changed hands), false = breakaway (new force). */
  usurp: boolean;
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

export function resolveAmbitions(ctx: AmbitionContext): AmbitionEvent[] {
  const { officers, cities, forces, playerForceId } = ctx;
  const rng = mulberry32(ctx.seed);
  const events: AmbitionEvent[] = [];

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
    // 牢城 — a prison/court at his seat keeps the discontented in line.
    chance *= 1 - buildingBonuses(homeId, ctx.buildings ?? []).defectionResist;
    if (chance <= 0) continue;
    if (rng() >= chance) continue;

    const ruler = officers[force.rulerOfficerId];
    const dominates = ruler ? capability(o) > capability(ruler) * 1.35 : true;
    const isPlayerForce = o.forceId === playerForceId;
    const homeIsCapital = force.capitalCityId === homeId;

    // ── 簒奪 — only against an AI lord the general clearly eclipses. ──
    if (!isPlayerForce && dominates && grievance >= 2 && o.loyalty < 25 && rng() < 0.5) {
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
      events.push({
        cityId: force.capitalCityId,
        kind: 'rebellion',
        usurp: true,
        text: `${o.name.en} (${o.name.zh}) eclipses ${ruler?.name.en ?? 'his lord'} and seizes the reins of ${force.name.en}.`,
        textZh: `${o.name.zh}威權既盛,廢${ruler?.name.zh ?? '其主'}而代之,${force.name.zh}易主!`,
      });
      continue;
    }

    // ── 割據 — secede with a (non-capital) held city into a new force. ──
    if (homeIsCapital) continue;
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

    // Drag along up to 2 same-city sympathisers (officers of the old force here
    // whose own loyalty is shaky) — a breakaway should feel like a faction.
    let pulled = 0;
    for (const other of Object.values(officers)) {
      if (pulled >= 2) break;
      if (other.id === o.id) continue;
      if (other.forceId !== force.id) continue;
      if (other.locationCityId !== homeId) continue;
      if (other.status !== 'idle' && other.status !== 'active') continue;
      if (hasTrait(other, 'loyal')) continue;
      if (other.loyalty >= 45) continue;
      officers[other.id] = { ...other, forceId: newForceId, loyalty: Math.max(60, other.loyalty), task: null };
      pulled++;
    }

    events.push({
      cityId: homeId,
      kind: 'rebellion',
      usurp: false,
      text: `${o.name.en} (${o.name.zh}) raises his own banner at ${home.name.en}, breaking from ${force.name.en}.`,
      textZh: `${o.name.zh}據${home.name.zh}自立旗號,叛${force.name.zh}而去!`,
    });
  }

  return events;
}
