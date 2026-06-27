/**
 * 俘虜處置(AI) — until now only the player decided a prisoner's fate; an AI
 * captor merely held men until the ransom market bought them back. Now a captor
 * lord, each season, passes verdict on the prisoners in his cells:
 *   • 招降 — turns the disgruntled to his own banner (fills his ranks),
 *   • 義釋 — a benevolent lord frees the worthy back to their house (報恩 seeds),
 *   • 處決 — a cruel lord puts the dangerous to the sword,
 * bearing the SAME costs the player would (殺降折威望、宿怨 marks his house, the
 * victim's old court sours toward him). Whoever is left falls to 贖俘 (aiRansom),
 * which runs after this. Background, caller's rng. Symmetric with the player UI.
 */
import type { City, EntityId, FamilyRelation, Force, Officer, ReportEntry } from '../types';
import type { OathBond } from '../data/bonds';
import { aiCaptiveVerdict, aiRecruitChance, executionRenownCost, markSlainVendetta } from './captiveFate';

export interface AICaptiveContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  family: FamilyRelation[];
  runtimeBonds: OathBond[];
  playerForceId: EntityId | null | undefined;
  rng: () => number;
}

export interface AICaptiveOutput {
  officers: Record<EntityId, Officer>;
  entries: ReportEntry[];
  /** 積怨 — relation score nudges the host should fold into diplomacy. */
  relationDeltas: Array<{ a: EntityId; b: EntityId; delta: number }>;
}

export function resolveAICaptives(ctx: AICaptiveContext): AICaptiveOutput {
  let officers = { ...ctx.officers };
  const entries: ReportEntry[] = [];
  const relationDeltas: AICaptiveOutput['relationDeltas'] = [];
  const liveForce = (id: EntityId | null | undefined) => !!id && Object.values(ctx.cities).some((c) => c.ownerForceId === id);

  for (const cap of Object.values(ctx.officers)) {
    if (cap.status !== 'imprisoned') continue;
    const where = cap.locationCityId ? ctx.cities[cap.locationCityId] : null;
    const captorId = where?.ownerForceId;
    if (!captorId || captorId === ctx.playerForceId) continue; // the player decides his own captives
    if (captorId === cap.capturedFromForceId) continue;        // not actually enemy-held
    const captorForce = ctx.forces[captorId];
    const ruler = captorForce ? officers[captorForce.rulerOfficerId] : null;
    if (!ruler || ruler.status === 'dead') continue;

    const o = officers[cap.id]; // may already be a fresh object from a prior loop
    if (!o || o.status !== 'imprisoned') continue;
    const chance = aiRecruitChance(ruler, o, captorId);
    const verdict = aiCaptiveVerdict({ ruler, victim: o, recruitChance: chance, rng: ctx.rng });
    const fromPlayer = o.capturedFromForceId === ctx.playerForceId; // a captured officer of yours

    if (verdict === 'recruit') {
      officers[o.id] = { ...o, status: 'idle', forceId: captorId, locationCityId: where!.id, loyalty: Math.max(40, Math.round(ruler.stats.charisma * 0.6)), capturedFromForceId: undefined, task: null };
      if (fromPlayer) entries.push({ cityId: where!.id, kind: 'talent', text: `${o.name.en} is talked into ${captorForce!.name.en}'s service — your captured officer turns coat.`, textZh: `${o.name.zh}為${captorForce!.name.zh}所招,棄你而去。` });
    } else if (verdict === 'release') {
      const home = cap.capturedFromForceId;
      const goHome = home && liveForce(home);
      const homeForce = goHome ? ctx.forces[home!] : null;
      officers[o.id] = { ...o, status: 'idle', forceId: goHome ? home! : null, locationCityId: goHome ? (homeForce?.capitalCityId ?? where!.id) : where!.id, loyalty: Math.max(o.loyalty, 60), freedByForceId: captorId, capturedFromForceId: undefined, task: null };
      if (fromPlayer) entries.push({ cityId: where!.id, kind: 'talent', text: `${captorForce!.name.en} releases ${o.name.en} with honour — he is freed.`, textZh: `${captorForce!.name.zh}義釋${o.name.zh},放歸。` });
    } else if (verdict === 'execute') {
      // 宿怨 + 殺降折威望 — the same weight the player bears.
      officers = markSlainVendetta(officers, o.id, captorId, ctx.family, ctx.runtimeBonds);
      officers[o.id] = { ...officers[o.id], status: 'dead', forceId: null, task: null };
      officers[ruler.id] = { ...officers[ruler.id], renown: Math.max(0, (officers[ruler.id].renown ?? 0) - executionRenownCost(o)) };
      const former = cap.capturedFromForceId;
      if (former && former !== captorId && ctx.forces[former]) relationDeltas.push({ a: captorId, b: former, delta: -12 });
      if (fromPlayer) entries.push({ cityId: where!.id, kind: 'battle', text: `${captorForce!.name.en} puts your captured ${o.name.en} to the sword.`, textZh: `${captorForce!.name.zh}斬你被俘之${o.name.zh}於市。` });
    }
    // 'hold' — left for the ransom market.
  }

  return { officers, entries, relationDeltas };
}
