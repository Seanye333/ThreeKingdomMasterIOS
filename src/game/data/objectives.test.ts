import { describe, expect, it } from 'vitest';
import { SCENARIO_OBJECTIVES } from './objectives';
import { SCENARIOS_BY_ID } from './scenarios';
import { PROVINCES } from './provinces';
import type { ObjectiveGoal, ScenarioGoal } from '../types';

/**
 * Objectives fail SILENTLY when mis-wired: `findObjectiveFor` looks the player's
 * force up by (scenarioId, forceId), so a typo in either just makes the panel
 * empty — no crash, no warning. Same for a goal naming a city or officer that
 * isn't on that scenario's board: it can never complete, and nothing says so.
 *
 * These tests are the guard rail. Every id in the table must resolve against the
 * scenario it is filed under.
 */

const PROVINCE_IDS = new Set(PROVINCES.map((p) => p.id));

function goalsOf(o: { primary: ScenarioGoal; secondary?: ScenarioGoal[] }): ScenarioGoal[] {
  return [o.primary, ...(o.secondary ?? [])];
}

describe('SCENARIO_OBJECTIVES wiring', () => {
  it('every key is a real scenario id', () => {
    for (const scenarioId of Object.keys(SCENARIO_OBJECTIVES)) {
      expect(SCENARIOS_BY_ID[scenarioId], `unknown scenario ${scenarioId}`).toBeDefined();
    }
  });

  it('every objective id is globally unique', () => {
    const seen = new Map<string, string>();
    for (const [scenarioId, list] of Object.entries(SCENARIO_OBJECTIVES)) {
      for (const o of list) {
        expect(seen.has(o.id), `duplicate objective id ${o.id} (${seen.get(o.id)} / ${scenarioId})`).toBe(false);
        seen.set(o.id, scenarioId);
      }
    }
  });

  it('every forceId exists in its own scenario, at most once', () => {
    for (const [scenarioId, list] of Object.entries(SCENARIO_OBJECTIVES)) {
      const scenario = SCENARIOS_BY_ID[scenarioId];
      const forceIds = new Set(scenario.forces.map((f) => f.id));
      const used = new Set<string>();
      for (const o of list) {
        expect(forceIds.has(o.forceId), `${scenarioId}: no force ${o.forceId}`).toBe(true);
        expect(used.has(o.forceId), `${scenarioId}: two objectives for ${o.forceId}`).toBe(false);
        used.add(o.forceId);
      }
    }
  });

  it('every goal target resolves on its own scenario board', () => {
    for (const [scenarioId, list] of Object.entries(SCENARIO_OBJECTIVES)) {
      const scenario = SCENARIOS_BY_ID[scenarioId];
      const cityIds = new Set(scenario.cities.map((c) => c.id));
      const forceIds = new Set(scenario.forces.map((f) => f.id));
      const officerIds = new Set(scenario.officers.map((o) => o.id));

      for (const o of list) {
        for (const g of goalsOf(o)) {
          const goal: ObjectiveGoal = g.goal;
          switch (goal.kind) {
            case 'hold-cities':
              expect(goal.cityIds.length, `${o.id}: empty city list`).toBeGreaterThan(0);
              for (const cid of goal.cityIds) {
                expect(cityIds.has(cid), `${o.id}: no city ${cid} in ${scenarioId}`).toBe(true);
              }
              break;
            case 'defeat-force':
              expect(forceIds.has(goal.forceId), `${o.id}: no force ${goal.forceId} in ${scenarioId}`).toBe(true);
              expect(goal.forceId, `${o.id}: cannot be told to defeat itself`).not.toBe(o.forceId);
              break;
            case 'recruit-officer':
              expect(officerIds.has(goal.officerId), `${o.id}: no officer ${goal.officerId} in ${scenarioId}`).toBe(true);
              break;
            case 'control-province': {
              expect(PROVINCE_IDS.has(goal.provinceId), `${o.id}: unknown province ${goal.provinceId}`).toBe(true);
              break;
            }
            case 'survive-until':
              expect(goal.year, `${o.id}: survive-until before the scenario starts`).toBeGreaterThan(
                scenario.startDate.year,
              );
              break;
            case 'declare-emperor':
            case 'unify-realm':
              break;
          }
        }
      }
    }
  });

  it('every deadline falls after the scenario start', () => {
    for (const [scenarioId, list] of Object.entries(SCENARIO_OBJECTIVES)) {
      const start = SCENARIOS_BY_ID[scenarioId].startDate.year;
      for (const o of list) {
        for (const g of goalsOf(o)) {
          const by = 'byYear' in g.goal ? g.goal.byYear : undefined;
          if (by !== undefined) {
            expect(by, `${o.id}: deadline ${by} <= start ${start}`).toBeGreaterThan(start);
          }
        }
      }
    }
  });

  it('every goal carries both a Chinese and an English description', () => {
    for (const list of Object.values(SCENARIO_OBJECTIVES)) {
      for (const o of list) {
        for (const g of goalsOf(o)) {
          expect(g.title.zh.length, `${o.id}: empty zh title`).toBeGreaterThan(0);
          expect(g.title.en.length, `${o.id}: empty en title`).toBeGreaterThan(0);
          expect(g.description.length, `${o.id}: empty description`).toBeGreaterThan(0);
          expect(g.descriptionZh, `${o.id}: missing descriptionZh`).toBeTruthy();
        }
      }
    }
  });
});
