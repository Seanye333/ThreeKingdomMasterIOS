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

/**
 * 目標的三態:達成 / 失敗 / 進行中。
 *
 * 「取得型」目標(開局不據有那座城)原本只有兩態 —— 拿到就成功,沒拿到永遠
 * 進行中。於是黃巾的「於186年前攻取洛陽」打到 200 年仍顯示進行中,期限寫了
 * 等於沒寫;而 defeat-force 與 recruit-officer 這兩種早就會過期,只有它不會。
 *
 * 這裡釘住四件事:取得型會過期、期限當年仍在期限內、守成型的判法不變、
 * 沒給 byYear 的目標永不過期。
 */
describe('目標的期限', () => {
  const ctxAt = (year: number, own: Record<string, string | null>) => ({
    scenarioId: null,
    playerForceId: 'me',
    cities: Object.fromEntries(
      Object.entries(own).map(([id, o]) => [id, { id, ownerForceId: o } as never]),
    ),
    officers: {},
    year,
    liveForceIds: new Set(['me', 'foe']),
    isEmperor: false,
  });
  const takeLuoyang: ObjectiveGoal = { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 186 };

  it('取得型目標會過期', async () => {
    const { evaluateGoal } = await import('../systems/objectives');
    const notMine = { luoyang: 'foe' };
    expect(evaluateGoal(takeLuoyang, ctxAt(185, notMine)).status).toBe('pending');
    expect(evaluateGoal(takeLuoyang, ctxAt(186, notMine)).status).toBe('pending'); // 期限當年仍在期限內
    expect(evaluateGoal(takeLuoyang, ctxAt(187, notMine)).status).toBe('failure');
  });

  it('拿到就算數,即使已過期限也不倒扣', async () => {
    const { evaluateGoal } = await import('../systems/objectives');
    expect(evaluateGoal(takeLuoyang, ctxAt(200, { luoyang: 'me' })).status).toBe('success');
  });

  it('沒寫期限的目標永不過期', async () => {
    const { evaluateGoal } = await import('../systems/objectives');
    const noDeadline: ObjectiveGoal = { kind: 'hold-cities', cityIds: ['luoyang'] };
    expect(evaluateGoal(noDeadline, ctxAt(9999, { luoyang: 'foe' })).status).toBe('pending');
  });

  /*
   * 擊破 —— 「亂平了沒」與「他死了沒」是兩個問題。184 年的朝廷問的是前者:
   * 餘部入太行號黑山,活過了這個王朝,而八州之亂確實在當年冬天就破了。
   * 這條也順帶不在乎是誰打的 —— 皇甫嵩軍打下的城不記在漢室名下。
   */
  const breakFoe: ObjectiveGoal = { kind: 'break-force', forceId: 'foe', maxCities: 2, byYear: 186 };
  it('擊破:壓到門檻以內即算數,不必殲滅', async () => {
    const { evaluateGoal } = await import('../systems/objectives');
    expect(evaluateGoal(breakFoe, ctxAt(185, { a: 'foe', b: 'foe', c: 'foe' })).status).toBe('pending');
    expect(evaluateGoal(breakFoe, ctxAt(185, { a: 'foe', b: 'foe', c: 'me' })).status).toBe('success');
    // 城歸誰無關緊要 —— 盟軍打下的也算
    expect(evaluateGoal(breakFoe, ctxAt(185, { a: 'foe', b: 'ally', c: 'ally' })).status).toBe('success');
  });

  it('擊破:期限一過仍未壓下去就是失敗', async () => {
    const { evaluateGoal } = await import('../systems/objectives');
    const still = { a: 'foe', b: 'foe', c: 'foe' };
    expect(evaluateGoal(breakFoe, ctxAt(186, still)).status).toBe('pending');
    expect(evaluateGoal(breakFoe, ctxAt(187, still)).status).toBe('failure');
  });
});
