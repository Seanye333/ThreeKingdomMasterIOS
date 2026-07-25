import { describe, it, expect } from 'vitest';
import { rollDialogue } from './dialogueRoll';
import type { DialogueEvent, Officer } from '../types';

// Minimal officer fixture — only the fields the roller inspects matter.
function officer(id: string, forceId: string | null, status: Officer['status'] = 'active'): Officer {
  return { id, forceId, status, name: { zh: id, en: id }, loyalty: 80 } as Officer;
}

const evt = (id: string, conditions?: DialogueEvent['conditions']): DialogueEvent => ({
  id,
  speaker: { zh: id, en: id },
  text: { zh: id, en: id },
  choices: [{ label: { zh: 'ok', en: 'ok' }, effects: [{ kind: 'none' }] }],
  conditions,
});

// rng that always passes the season chance gate and picks index 0.
const pass = () => 0;

describe('rollDialogue — requiresOfficerInService gate', () => {
  const ev = evt('dlg-x', { requiresOfficerInService: 'guan-yu' });

  it('fires when the officer serves the player', () => {
    const r = rollDialogue(
      { year: 200, officers: { 'guan-yu': officer('guan-yu', 'shu') }, eventFlags: {}, playerForceId: 'shu', rng: pass },
      [ev],
    );
    expect(r?.id).toBe('dlg-x');
  });

  it('does NOT fire when the officer serves a rival', () => {
    const r = rollDialogue(
      { year: 200, officers: { 'guan-yu': officer('guan-yu', 'wei') }, eventFlags: {}, playerForceId: 'shu', rng: pass },
      [ev],
    );
    expect(r).toBeNull();
  });

  it('does NOT fire when the officer is dead / gaoled / not present', () => {
    for (const o of [officer('guan-yu', 'shu', 'dead'), officer('guan-yu', 'shu', 'imprisoned')]) {
      expect(rollDialogue({ year: 200, officers: { 'guan-yu': o }, eventFlags: {}, playerForceId: 'shu', rng: pass }, [ev])).toBeNull();
    }
    expect(rollDialogue({ year: 200, officers: {}, eventFlags: {}, playerForceId: 'shu', rng: pass }, [ev])).toBeNull();
  });

  it('does NOT fire when there is no player force', () => {
    const r = rollDialogue(
      { year: 200, officers: { 'guan-yu': officer('guan-yu', 'shu') }, eventFlags: {}, playerForceId: null, rng: pass },
      [ev],
    );
    expect(r).toBeNull();
  });
});
