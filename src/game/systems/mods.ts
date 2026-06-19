/**
 * Mod 數據包 — user-authored content as plain JSON, no code.
 *
 * A bundle can ship extra officers (joining as unsearched free agents at
 * a chosen city, or straight into a force) and custom events (the same
 * shape the in-game Event Editor produces — they ride the existing
 * customEvents pipeline). Bundles install into localStorage and apply
 * on every NEW game until removed; ids are namespaced (mod-…) so a
 * crafted file can't overwrite 關羽.
 *
 * 別人也能做「水滸傳包」— that's the whole point.
 */
import type { EntityId, HistoricalEvent, Officer } from '../types';

const MODS_KEY = 'tkm-mods-v1';

export interface ModBundle {
  kind: 'tkm-mod';
  version: number;
  name: string;
  officers?: ModOfficer[];
  events?: HistoricalEvent[];
  scenarios?: ModScenario[];
}

/** A mod scenario re-skins an existing base scenario's map: same cities
 *  and officer roster, but your own forces and who-owns-what. */
export interface ModScenario {
  id: string;
  name: { zh: string; en: string };
  /** Base scenario id whose cities/officers are reused. */
  baseScenarioId: string;
  forces: Array<{ id: string; name: { zh: string; en: string }; rulerOfficerId: string; capitalCityId: string; color: string }>;
  /** cityId → owning forceId (cities omitted stay masterless). */
  cityOwnership: Record<string, string>;
}

export interface ModOfficer {
  id: string;
  name: { zh: string; en: string };
  birthYear?: number;
  stats: { leadership: number; war: number; intelligence: number; politics: number; charisma: number };
  /** Where they wait to be found (default: wanderer pool). */
  locationCityId?: string | null;
  /** Join this force at game start instead of waiting in the wild. */
  forceId?: string | null;
}

const clampStat = (v: unknown): number => Math.max(1, Math.min(100, Math.round(Number(v) || 1)));

/** Validate + normalize a raw bundle. Ids get the mod- namespace. */
export function parseModBundle(raw: string): { ok: true; bundle: ModBundle } | { ok: false; reason: string } {
  let p: unknown;
  try {
    p = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  const b = p as Partial<ModBundle>;
  if (b?.kind !== 'tkm-mod' || typeof b.name !== 'string' || !b.name.trim()) {
    return { ok: false, reason: 'not-a-mod-bundle' };
  }
  const officers: ModOfficer[] = [];
  for (const o of b.officers ?? []) {
    if (!o || typeof o.id !== 'string' || !o.name?.zh) continue;
    officers.push({
      id: o.id.startsWith('mod-') ? o.id : `mod-${o.id}`,
      name: { zh: String(o.name.zh), en: String(o.name.en ?? o.name.zh) },
      birthYear: typeof o.birthYear === 'number' ? o.birthYear : undefined,
      stats: {
        leadership: clampStat(o.stats?.leadership),
        war: clampStat(o.stats?.war),
        intelligence: clampStat(o.stats?.intelligence),
        politics: clampStat(o.stats?.politics),
        charisma: clampStat(o.stats?.charisma),
      },
      locationCityId: o.locationCityId ?? null,
      forceId: o.forceId ?? null,
    });
  }
  const events: HistoricalEvent[] = [];
  for (const e of b.events ?? []) {
    if (!e || typeof e.id !== 'string' || !e.name?.zh || typeof e.yearMin !== 'number') continue;
    events.push({ ...e, id: e.id.startsWith('mod-') ? e.id : `mod-${e.id}` });
  }
  const scenarios: ModScenario[] = [];
  for (const sc of b.scenarios ?? []) {
    if (!sc || typeof sc.id !== 'string' || !sc.name?.zh || typeof sc.baseScenarioId !== 'string') continue;
    if (!Array.isArray(sc.forces) || sc.forces.length === 0 || typeof sc.cityOwnership !== 'object') continue;
    scenarios.push({
      id: sc.id.startsWith('mod-') ? sc.id : `mod-${sc.id}`,
      name: { zh: String(sc.name.zh), en: String(sc.name.en ?? sc.name.zh) },
      baseScenarioId: sc.baseScenarioId,
      forces: sc.forces,
      cityOwnership: sc.cityOwnership,
    });
  }
  if (officers.length === 0 && events.length === 0 && scenarios.length === 0) return { ok: false, reason: 'empty' };
  return { ok: true, bundle: { kind: 'tkm-mod', version: 1, name: b.name.trim(), officers, events, scenarios } };
}

export function loadMods(): ModBundle[] {
  try {
    const raw = localStorage.getItem(MODS_KEY);
    const arr = raw ? (JSON.parse(raw) as ModBundle[]) : [];
    return Array.isArray(arr) ? arr.filter((m) => m?.kind === 'tkm-mod') : [];
  } catch {
    return [];
  }
}

export function installMod(bundle: ModBundle): void {
  const mods = loadMods().filter((m) => m.name !== bundle.name); // same name replaces
  mods.push(bundle);
  try { localStorage.setItem(MODS_KEY, JSON.stringify(mods)); } catch { /* quota */ }
}

export function removeMod(name: string): void {
  try { localStorage.setItem(MODS_KEY, JSON.stringify(loadMods().filter((m) => m.name !== name))); } catch { /* quota */ }
}

/** Officers all installed mods contribute to a new game. */
export function modOfficersForStart(mods: ModBundle[], startYear: number, validForceIds: ReadonlySet<string>): Officer[] {
  const out: Officer[] = [];
  const seen = new Set<EntityId>();
  for (const m of mods) {
    for (const o of m.officers ?? []) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      const forceOk = o.forceId && validForceIds.has(o.forceId);
      out.push({
        id: o.id,
        name: o.name,
        birthYear: o.birthYear ?? startYear - 25,
        stats: o.stats,
        loyalty: forceOk ? 90 : 0,
        locationCityId: o.locationCityId ?? null,
        forceId: forceOk ? o.forceId! : null,
        status: forceOk ? 'idle' : 'unsearched',
        task: null,
        equipment: [],
        skills: [],
        rank: 'soldier',
      } as Officer);
    }
  }
  return out;
}

/** Events all installed mods contribute (ride the customEvents pipeline). */
export function modEventsForStart(mods: ModBundle[]): HistoricalEvent[] {
  const out: HistoricalEvent[] = [];
  const seen = new Set<string>();
  for (const m of mods) {
    for (const e of m.events ?? []) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
    }
  }
  return out;
}


/** Build playable Scenario objects from installed mod scenarios, cloning
 *  each base scenario's cities + officers and reassigning ownership.
 *  Officers whose force no longer exists become free agents at their
 *  city, so the result is always valid. */
export function modScenariosForStart(
  mods: ModBundle[],
  baseById: Record<string, import('../types').Scenario>,
): import('../types').Scenario[] {
  const out: import('../types').Scenario[] = [];
  const seen = new Set<string>();
  for (const m of mods) {
    for (const ms of m.scenarios ?? []) {
      if (seen.has(ms.id)) continue;
      const base = baseById[ms.baseScenarioId];
      if (!base) continue;
      seen.add(ms.id);
      const forceIds = new Set(ms.forces.map((f) => f.id));
      const cities = base.cities.map((c) => ({
        ...c,
        ownerForceId: ms.cityOwnership[c.id] && forceIds.has(ms.cityOwnership[c.id]) ? ms.cityOwnership[c.id] : null,
      }));
      const ownedByForce = new Map<string, string>(); // forceId → first city (capital fallback)
      for (const c of cities) if (c.ownerForceId && !ownedByForce.has(c.ownerForceId)) ownedByForce.set(c.ownerForceId, c.id);
      const officers = base.officers.map((o) => {
        if (o.forceId && forceIds.has(o.forceId)) return o;
        if (o.forceId) return { ...o, forceId: null, status: 'unsearched' as const, task: null }; // orphaned → free agent
        return o;
      });
      out.push({
        id: ms.id,
        name: ms.name,
        description: `Mod scenario (${m.name})`,
        kind: 'whatif',
        startDate: base.startDate,
        cities,
        forces: ms.forces.map((f) => ({
          ...f,
          capitalCityId: cities.some((c) => c.id === f.capitalCityId && c.ownerForceId === f.id)
            ? f.capitalCityId
            : ownedByForce.get(f.id) ?? f.capitalCityId,
          isPlayer: false,
        })) as import('../types').Force[],
        officers,
      });
    }
  }
  return out;
}
