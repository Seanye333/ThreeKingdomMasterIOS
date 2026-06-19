import type {
  City,
  EntityId,
  EspionageOp,
  EspionageResult,
  Officer,
  ReportEntry,
} from '../types';
import { ESPIONAGE_DEFS_BY_KIND } from '../data/espionage';
import { espionageBonus, counterEspionageResist } from './traitEffects';

export interface EspionageContext {
  ops: EspionageOp[];
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  playerForceId: EntityId | null;
  rng: () => number;
}

export interface EspionageOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  results: EspionageResult[];
  entries: ReportEntry[];
}

/**
 * Resolves all pending espionage ops at season-end. Each op's success
 * chance is its baseSuccess scaled by:
 *   agent INT / 100
 *   (1 + (agent INT − target avg INT) × 0.5%)
 *   defection only: (100 − target loyalty) / 50  (heavy)
 */
export function resolveEspionage(ctx: EspionageContext): EspionageOutput {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const results: EspionageResult[] = [];
  const entries: ReportEntry[] = [];

  for (const op of ctx.ops) {
    const def = ESPIONAGE_DEFS_BY_KIND[op.kind];
    const agent = officers[op.agentOfficerId];
    if (!def || !agent) continue;

    // Compute success.
    const targetForceOfficers = Object.values(officers).filter(
      (o) => o.forceId === op.targetForceId && o.status !== 'dead',
    );
    const targetAvgInt =
      targetForceOfficers.length > 0
        ? targetForceOfficers.reduce((s, o) => s + o.stats.intelligence, 0) /
          targetForceOfficers.length
        : 60;

    let chance = def.baseSuccess * (agent.stats.intelligence / 100);
    chance += (agent.stats.intelligence - targetAvgInt) * 0.005;
    // T7 — agent traits: cunning/stealthy/strategist boost; target-side
    // counter-intel traits reduce success (averaged across target officers).
    chance += espionageBonus(agent);
    const counterResist =
      targetForceOfficers.length > 0
        ? targetForceOfficers.reduce((s, o) => s + counterEspionageResist(o), 0) /
          targetForceOfficers.length
        : 0;
    chance -= counterResist;

    if (op.kind === 'defect' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (t) {
        chance += ((100 - t.loyalty) / 50) - 0.2;
        // T7 — loyal/honor-bound officers resist defection HARD
        chance -= counterEspionageResist(t) * 3;
      }
    }

    chance = Math.max(0.02, Math.min(0.95, chance));
    const roll = ctx.rng();
    const success = roll < chance;

    let message = '';
    let messageZh = '';

    if (op.kind === 'gather-intel') {
      if (success) {
        const targetCities = Object.values(cities)
          .filter((c) => c.ownerForceId === op.targetForceId)
          .slice(0, 4);
        const cityList = targetCities
          .map((c) => `${c.name.en} (T:${c.troops.toLocaleString()}, G:${c.gold}, F:${c.food})`)
          .join('; ');
        const cityListZh = targetCities
          .map((c) => `${c.name.zh}（兵${c.troops.toLocaleString()}、金${c.gold}、糧${c.food}）`)
          .join('、');
        message = `${agent.name.en}'s spies report: ${cityList || '(no cities)'}.`;
        messageZh = `${agent.name.zh}細作來報：${cityListZh || '（無城）'}。`;
      } else {
        message = `${agent.name.en}'s spy ring was uncovered. The agent escaped with nothing.`;
        messageZh = `${agent.name.zh}細作為敵所察，無功而還。`;
      }
    } else if (op.kind === 'instigate' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) {
        message = `Target city no longer exists.`;
        messageZh = `目標城池已不復存在。`;
      } else if (success) {
        const drop = 15 + Math.floor(ctx.rng() * 16);
        cities[op.targetCityId] = {
          ...c,
          loyalty: Math.max(0, c.loyalty - drop),
        };
        message = `Agitators in ${c.name.en} caused loyalty to drop by ${drop}.`;
        messageZh = `細作於${c.name.zh}煽動民心，民忠減 ${drop}。`;
      } else {
        message = `Plot in ${c.name.en} was exposed. The agitators were executed.`;
        messageZh = `${c.name.zh}之謀洩露，細作伏誅。`;
      }
    } else if (op.kind === 'sabotage' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) {
        message = `Target city no longer exists.`;
        messageZh = `目標城池已不復存在。`;
      } else if (success) {
        const lost = Math.floor(c.food * (0.3 + ctx.rng() * 0.2));
        cities[op.targetCityId] = { ...c, food: Math.max(0, c.food - lost) };
        message = `Granaries at ${c.name.en} put to the torch: ${lost.toLocaleString()} food destroyed.`;
        messageZh = `${c.name.zh}糧倉遭焚，毀糧 ${lost.toLocaleString()} 石。`;
      } else {
        message = `Saboteurs at ${c.name.en} were caught and hanged.`;
        messageZh = `${c.name.zh}縱火細作為人所擒，盡皆處斬。`;
      }
    } else if (op.kind === 'assassinate' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success) {
        officers[op.targetOfficerId] = {
          ...t,
          status: 'dead',
          forceId: null,
          task: null,
        };
        message = `${t.name.en} was struck down by an unknown assassin.`;
        messageZh = `${t.name.zh}為不知名刺客所殺。`;
      } else {
        message = `The assassin failed. ${t.name.en} survives the attempt.`;
        messageZh = `刺客失手，${t.name.zh}得以倖免。`;
        // Modest blowback: drop diplomatic relation handled elsewhere; for now
        // the player simply loses the gold (already deducted).
      }
    } else if (op.kind === 'defect' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success && ctx.playerForceId) {
        officers[op.targetOfficerId] = {
          ...t,
          forceId: ctx.playerForceId,
          loyalty: 60,
          status: 'idle',
          task: null,
        };
        message = `${t.name.en} secretly defected and is now in your service!`;
        messageZh = `${t.name.zh}暗中歸順，今為主公效命！`;
      } else {
        // Blowback: officer's loyalty to their lord shoots up.
        if (t) {
          officers[op.targetOfficerId] = {
            ...t,
            loyalty: Math.min(100, t.loyalty + 10),
          };
        }
        message = `${t?.name.en ?? 'Target'} reported the bribe. Their loyalty has increased.`;
        messageZh = `${t?.name.zh ?? '目標'}將賄事告於其主，忠誠反升。`;
      }
    } else if (op.kind === 'frame' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success) {
        const drop = 15 + Math.floor(ctx.rng() * 11);
        officers[op.targetOfficerId] = {
          ...t,
          loyalty: Math.max(0, t.loyalty - drop),
        };
        message = `Slander against ${t.name.en} took root: loyalty −${drop}.`;
        messageZh = `離間之計奏效，${t.name.zh}忠誠 −${drop}。`;
      } else {
        message = `The slander against ${t.name.en} was disbelieved.`;
        messageZh = `離間${t.name.zh}之謀未為其主所信。`;
      }
    }

    results.push({ op, success, message });
    entries.push({
      cityId: op.targetCityId ?? agent.locationCityId ?? null,
      kind: 'espionage',
      text: `[${def.name.en}] ${message}`,
      textZh: `【${def.name.zh}】${messageZh}`,
    });
  }

  return { cities, officers, results, entries };
}
