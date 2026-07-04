import type {
  City,
  EntityId,
  EventEffect,
  Force,
  GameDate,
  HistoricalEvent,
  Officer,
} from '../types';
import { HISTORICAL_EVENTS } from '../data/events';

/**
 * Resolve an event's force reference to a force id that actually exists in the
 * running scenario. Events were authored with `force-{rulerName}` ids (e.g.
 * 'force-cao-cao'), but scenarios key forces by short ids ('cao', 'liu-bei'),
 * so a direct lookup always missed — silently breaking ~15 events. This maps
 * the reference back to the live force by its ruler (the authoring convention),
 * with dynasty aliases for the Shu/Wu/Wei references. Returns null if no such
 * force is on the map.
 */
const DYNASTY_RULERS: Record<string, readonly string[]> = {
  shu: ['liu-shan', 'liu-bei'],
  wu: ['sun-hao', 'sun-quan', 'sun-ce', 'sun-jian'],
  wei: ['cao-huan', 'cao-fang', 'cao-rui', 'cao-pi', 'cao-cao'],
  han: ['xian-di', 'lu-zhi'],
};
export function resolveForceId(
  forceId: EntityId,
  forces: Record<EntityId, Force>,
): EntityId | null {
  if (forces[forceId]) return forceId;
  if (!forceId.startsWith('force-')) return null;
  const key = forceId.slice('force-'.length);
  // 1. Live force whose ruler is this officer (force-cao-cao → ruler cao-cao).
  const byRuler = Object.values(forces).find((f) => f.rulerOfficerId === key);
  if (byRuler) return byRuler.id;
  // 2. A force whose own short id matches (force-shu → id 'shu').
  if (forces[key]) return key;
  // 3. Dynasty references → whichever of its rulers currently leads a force.
  for (const ruler of DYNASTY_RULERS[key] ?? []) {
    const f = Object.values(forces).find((x) => x.rulerOfficerId === ruler);
    if (f) return f.id;
  }
  return null;
}

export interface HistoricalEventContext {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  eventFlags: Record<string, boolean>;
  firedEventIds: EntityId[];
  /** Romance mode: always fire eligible events. Default behavior fires
   *  with a smaller per-season probability so non-Romance runs feel
   *  "alternate-history". */
  romanceMode?: boolean;
  rng?: () => number;
}

/**
 * Picks the first historical event whose conditions match the current state.
 * Returns null when none fire. Each event fires at most once per game.
 */
export function findFiringEvent(
  ctx: HistoricalEventContext,
): HistoricalEvent | null {
  return findFiringEventIn(HISTORICAL_EVENTS, ctx);
}

/**
 * Like {@link findFiringEvent} but over an explicit event list — used for
 * player-authored custom events (Event Editor). `alwaysFire` skips the 60%
 * per-season roll so authored events fire deterministically once eligible.
 */
export function findFiringEventIn(
  events: HistoricalEvent[],
  ctx: HistoricalEventContext,
  opts?: { alwaysFire?: boolean },
): HistoricalEvent | null {
  const fired = new Set(ctx.firedEventIds);
  const rng = ctx.rng ?? Math.random;
  for (const evt of events) {
    if (fired.has(evt.id)) continue;
    if (ctx.date.year < evt.yearMin || ctx.date.year > evt.yearMax) continue;
    if (evt.season && ctx.date.season !== evt.season) continue;
    if (!conditionsMet(evt, ctx)) continue;
    // Romance mode: fire every eligible event. Default: 60% per season
    // (so the next eligible season has another chance, but the campaign
    // doesn't get a monolithic event-list overlay).
    if (!opts?.alwaysFire && !ctx.romanceMode && rng() > 0.6) continue;
    return evt;
  }
  return null;
}

function conditionsMet(evt: HistoricalEvent, ctx: HistoricalEventContext): boolean {
  for (const req of evt.requires ?? []) {
    switch (req.kind) {
      case 'force-alive': {
        const fid = resolveForceId(req.forceId, ctx.forces);
        if (!fid) return false;
        // A force is "alive" if it still owns any city.
        const hasCity = Object.values(ctx.cities).some(
          (c) => c.ownerForceId === fid,
        );
        if (!hasCity) return false;
        break;
      }
      case 'officer-alive': {
        const o = ctx.officers[req.officerId];
        if (!o || o.status === 'dead') return false;
        break;
      }
      case 'officer-active': {
        const o = ctx.officers[req.officerId];
        if (!o) return false;
        if (o.status !== 'idle' && o.status !== 'active') return false;
        break;
      }
      case 'flag-set':
        if (!ctx.eventFlags[req.key]) return false;
        break;
      case 'flag-unset':
        if (ctx.eventFlags[req.key]) return false;
        break;
      case 'officer-unaffiliated': {
        const o = ctx.officers[req.officerId];
        if (!o || o.status === 'dead' || o.forceId) return false;
        break;
      }
      case 'officer-in-city': {
        const o = ctx.officers[req.officerId];
        if (!o || o.status === 'dead' || o.locationCityId !== req.cityId) return false;
        break;
      }
      case 'city-owner-ruler': {
        const f = Object.values(ctx.forces).find(
          (force) => force.rulerOfficerId === req.rulerOfficerId,
        );
        if (!f || ctx.cities[req.cityId]?.ownerForceId !== f.id) return false;
        break;
      }
      case 'officer-rules-cities-min': {
        // Find the force this officer rules, then count its cities.
        const f = Object.values(ctx.forces).find(
          (force) => force.rulerOfficerId === req.officerId,
        );
        if (!f) return false;
        const owned = Object.values(ctx.cities).filter(
          (c) => c.ownerForceId === f.id,
        ).length;
        if (owned < req.count) return false;
        break;
      }
    }
  }
  return true;
}

export interface EventApplyOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  eventFlags: Record<string, boolean>;
  /** Civic-title grants emitted by 'grant-title' effects this event. */
  appointmentGrants?: Array<{
    officerId: EntityId;
    titleId: import('../types').CivicTitleId;
    cityId?: EntityId;
  }>;
  /** Wish injections emitted by 'force-wish' effects this event. */
  forcedWishes?: Array<{
    officerId: EntityId;
    wishKind: import('../types').WishKind;
    text: { en: string; zh: string };
    rejectPenalty?: number;
    grantBonus?: number;
  }>;
  /** §8.5 — 天命 deltas emitted by 'mandate-ruler' effects (forceId resolved). */
  mandateDeltas?: Array<{ forceId: EntityId; delta: number }>;
  /** 斷糧 — forces whose hex-paint (supply ribbons) must be swept by the caller. */
  stripPaintForceIds?: EntityId[];
}

/**
 * Applies the effects of a historical event to game state, returning the
 * mutated cities/officers/forces/flags. Pure function.
 */
export function applyEventEffects(
  evt: HistoricalEvent,
  ctx: HistoricalEventContext,
): EventApplyOutput {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const forces = { ...ctx.forces };
  const eventFlags = { ...ctx.eventFlags };
  const appointmentGrants: NonNullable<EventApplyOutput['appointmentGrants']> = [];
  const forcedWishes: NonNullable<EventApplyOutput['forcedWishes']> = [];
  const mandateDeltas: NonNullable<EventApplyOutput['mandateDeltas']> = [];
  const stripPaintForceIds: NonNullable<EventApplyOutput['stripPaintForceIds']> = [];

  for (const e of evt.effects) {
    applySingleEffect(e, { cities, officers, forces, eventFlags, appointmentGrants, forcedWishes, mandateDeltas, stripPaintForceIds });
  }
  return { cities, officers, forces, eventFlags, appointmentGrants, forcedWishes, mandateDeltas, stripPaintForceIds };
}

function applySingleEffect(
  e: EventEffect,
  mut: EventApplyOutput,
): void {
  switch (e.kind) {
    case 'force-troops-multiplier': {
      // Multiply troops in every city owned by this force.
      const fid = resolveForceId(e.forceId, mut.forces);
      if (!fid) break;
      for (const c of Object.values(mut.cities)) {
        if (c.ownerForceId === fid) {
          mut.cities[c.id] = {
            ...c,
            troops: Math.max(100, Math.floor(c.troops * e.multiplier)),
          };
        }
      }
      break;
    }
    case 'strip-force-paint': {
      const fid = resolveForceId(e.forceId, mut.forces);
      if (fid) mut.stripPaintForceIds?.push(fid);
      break;
    }
    case 'force-gold': {
      // Gold is held per-city. Deposit into the force's capital.
      const fid = resolveForceId(e.forceId, mut.forces);
      const f = fid ? mut.forces[fid] : undefined;
      if (f) {
        const capital = mut.cities[f.capitalCityId];
        if (capital) {
          mut.cities[f.capitalCityId] = {
            ...capital,
            gold: Math.max(0, capital.gold + e.delta),
          };
        }
      }
      break;
    }
    case 'city-loyalty': {
      const c = mut.cities[e.cityId];
      if (c) {
        mut.cities[e.cityId] = {
          ...c,
          loyalty: Math.max(0, Math.min(100, c.loyalty + e.delta)),
        };
      }
      break;
    }
    case 'city-defense': {
      const c = mut.cities[e.cityId];
      if (c) mut.cities[e.cityId] = { ...c, defense: Math.max(0, c.defense + e.delta) };
      break;
    }
    case 'city-food': {
      const c = mut.cities[e.cityId];
      if (c) mut.cities[e.cityId] = { ...c, food: Math.max(0, c.food + e.delta) };
      break;
    }
    case 'city-troops-multiplier': {
      const c = mut.cities[e.cityId];
      if (c) mut.cities[e.cityId] = { ...c, troops: Math.max(0, Math.floor(c.troops * e.multiplier)) };
      break;
    }
    case 'officer-loyalty': {
      const o = mut.officers[e.officerId];
      if (o) {
        mut.officers[e.officerId] = {
          ...o,
          loyalty: Math.max(0, Math.min(100, o.loyalty + e.delta)),
        };
      }
      break;
    }
    case 'officer-status': {
      const o = mut.officers[e.officerId];
      if (o) {
        mut.officers[e.officerId] = {
          ...o,
          status: e.status,
          forceId: e.status === 'dead' ? null : o.forceId,
          task: null,
        };
      }
      break;
    }
    case 'officer-join': {
      const o = mut.officers[e.officerId];
      const fid = resolveForceId(e.forceId, mut.forces);
      const f = fid ? mut.forces[fid] : undefined;
      if (o && f) {
        mut.officers[e.officerId] = {
          ...o,
          status: 'idle',
          forceId: f.id,
          locationCityId: f.capitalCityId,
          loyalty: Math.max(o.loyalty, 90),
          task: null,
        };
      }
      break;
    }
    case 'officer-join-ruler': {
      // Join the force whose ruler is rulerOfficerId — resolved at runtime so
      // it works whatever id that force carries in the running scenario.
      const o = mut.officers[e.officerId];
      const f = Object.values(mut.forces).find(
        (force) => force.rulerOfficerId === e.rulerOfficerId,
      );
      if (o && f) {
        mut.officers[e.officerId] = {
          ...o,
          status: 'idle',
          forceId: f.id,
          locationCityId: f.capitalCityId,
          loyalty: Math.max(o.loyalty, 90),
          task: null,
        };
      }
      break;
    }
    case 'spawn-rebel-force': {
      // Flip a city to neutral (rebel) and reduce troops.
      const c = mut.cities[e.cityId];
      if (c) {
        mut.cities[e.cityId] = {
          ...c,
          ownerForceId: null,
          troops: e.troops,
          loyalty: 30,
        };
      }
      break;
    }
    case 'flag':
      mut.eventFlags[e.key] = true;
      break;
    case 'grant-title':
      mut.appointmentGrants?.push({
        officerId: e.officerId,
        titleId: e.titleId,
        cityId: e.cityId,
      });
      break;
    case 'force-wish':
      mut.forcedWishes?.push({
        officerId: e.officerId,
        wishKind: e.wishKind,
        text: e.text,
        rejectPenalty: e.rejectPenalty,
        grantBonus: e.grantBonus,
      });
      break;
    case 'mandate-ruler': {
      // §8.5 — resolve the force by its ruler; the store applies the delta.
      const f = Object.values(mut.forces).find(
        (force) => force.rulerOfficerId === e.rulerOfficerId,
      );
      if (f) mut.mandateDeltas?.push({ forceId: f.id, delta: e.delta });
      break;
    }
    case 'force-troops-multiplier-ruler': {
      const f = Object.values(mut.forces).find(
        (force) => force.rulerOfficerId === e.rulerOfficerId,
      );
      if (!f) break;
      for (const c of Object.values(mut.cities)) {
        if (c.ownerForceId === f.id) {
          mut.cities[c.id] = {
            ...c,
            troops: Math.max(100, Math.floor(c.troops * e.multiplier)),
          };
        }
      }
      break;
    }
    case 'force-gold-ruler': {
      const f = Object.values(mut.forces).find(
        (force) => force.rulerOfficerId === e.rulerOfficerId,
      );
      if (!f) break;
      const capital = mut.cities[f.capitalCityId];
      if (capital) {
        mut.cities[f.capitalCityId] = {
          ...capital,
          gold: Math.max(0, capital.gold + e.delta),
        };
      }
      break;
    }
  }
}
