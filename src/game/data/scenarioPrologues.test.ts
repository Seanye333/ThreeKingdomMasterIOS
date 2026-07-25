import { describe, expect, it } from 'vitest';
import { SCENARIO_PROLOGUES, scenarioPrologue } from './scenarioPrologues';
import { SCENARIOS_BY_ID } from './scenarios';

/**
 * Same failure mode as the objectives table: a prologue filed under a force id
 * that doesn't exist in that scenario is never shown and never complains.
 */
describe('SCENARIO_PROLOGUES wiring', () => {
  it('every key is a real scenario id', () => {
    for (const scenarioId of Object.keys(SCENARIO_PROLOGUES)) {
      expect(SCENARIOS_BY_ID[scenarioId], `unknown scenario ${scenarioId}`).toBeDefined();
    }
  });

  it('every per-force prologue names a force in that scenario', () => {
    for (const [scenarioId, p] of Object.entries(SCENARIO_PROLOGUES)) {
      const forceIds = new Set(SCENARIOS_BY_ID[scenarioId].forces.map((f) => f.id));
      for (const fid of Object.keys(p.forces ?? {})) {
        expect(forceIds.has(fid), `${scenarioId}: no force ${fid}`).toBe(true);
      }
    }
  });

  it('every text is present in both languages', () => {
    for (const [scenarioId, p] of Object.entries(SCENARIO_PROLOGUES)) {
      const texts = [p.intro, ...Object.values(p.forces ?? {})];
      for (const t of texts) {
        expect(t.zh.trim().length, `${scenarioId}: empty zh`).toBeGreaterThan(0);
        expect(t.en.trim().length, `${scenarioId}: empty en`).toBeGreaterThan(0);
      }
    }
  });

  it('scenarioPrologue() resolves intro and force text, and degrades safely', () => {
    const known = Object.keys(SCENARIO_PROLOGUES)[0];
    const withForce = Object.entries(SCENARIO_PROLOGUES).find(([, p]) => p.forces);
    expect(scenarioPrologue(null, null)).toBeNull();
    expect(scenarioPrologue('scn-does-not-exist', 'cao')).toBeNull();
    expect(scenarioPrologue(known, null)?.intro).toBeTruthy();
    expect(scenarioPrologue(known, 'no-such-force')?.force).toBeNull();
    if (withForce) {
      const [sid, p] = withForce;
      const fid = Object.keys(p.forces!)[0];
      expect(scenarioPrologue(sid, fid)?.force).toBeTruthy();
    }
  });
});
