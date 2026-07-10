import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS } from './achievements';
import { EVENTS_BY_ID, HISTORICAL_EVENTS } from './events';

describe('achievement catalog integrity', () => {
  it('achievement ids are unique', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every fire-event targetId that names a historical event ('evt-…') exists", () => {
    // Synthetic fire-event ids the store reports directly (building
    // milestones, embassy feats) — not part of the historical-event catalog.
    const SYNTHETIC = new Set([
      'evt-build-first', 'evt-economy-hub', 'evt-military-fortress',
      'evt-all-rounder', 'evt-grand-city',
    ]);
    for (const a of ACHIEVEMENTS) {
      if (a.trigger.kind !== 'fire-event') continue;
      const tgt = a.trigger.targetId ?? '';
      // Non-evt ids (embassy-…) are synthetic triggers reported directly by
      // the store — only 'evt-…' ids must resolve against the event catalog.
      if (!tgt.startsWith('evt-') || SYNTHETIC.has(tgt)) continue;
      expect(EVENTS_BY_ID[tgt], `${a.id} → ${tgt}`).toBeDefined();
    }
  });

  it('every event-choice targetId has a CHOICE that sets that flag', () => {
    // The guan-yu-with-cao lesson: a consumer with no producer is a dead
    // reference. Choice-achievements must point at a flag some player-pickable
    // choice actually sets (top-level effects don't count — those apply
    // without the player choosing).
    const choiceFlags = new Set(
      HISTORICAL_EVENTS.flatMap((e) => (e.choices ?? []).flatMap((c) => c.effects))
        .filter((f) => f.kind === 'flag')
        .map((f) => (f as { key: string }).key),
    );
    for (const a of ACHIEVEMENTS) {
      if (a.trigger.kind !== 'event-choice') continue;
      expect(choiceFlags.has(a.trigger.targetId ?? ''), `${a.id} → ${a.trigger.targetId}`).toBe(true);
    }
  });
});
