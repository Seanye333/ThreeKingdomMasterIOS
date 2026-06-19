import type { HistoricalEvent, EventEffect } from '../types/event';

/**
 * Player-authored events (事件編輯器 / Event Editor). A custom event is just a
 * {@link HistoricalEvent} with a `custom-` id prefix so it shares the existing
 * firing + effect-application engine (findFiringEventIn + applyEventEffects).
 * This module only handles the editor-side concerns: minting stable ids,
 * validating a draft, and assembling the event object.
 */
export const CUSTOM_EVENT_PREFIX = 'custom-';
export const MAX_CUSTOM_EVENTS = 30;

export interface CustomEventDraft {
  nameZh: string;
  nameEn: string;
  yearMin: number;
  yearMax: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  descriptionZh: string;
  descriptionEn: string;
  effects: EventEffect[];
}

export function isCustomEventId(id: string): boolean {
  return id.startsWith(CUSTOM_EVENT_PREFIX);
}

/** Deterministic id from an index + the existing set (avoids Date.now/random,
 *  which break replay/persistence determinism). */
export function mintCustomEventId(existing: HistoricalEvent[]): string {
  const used = new Set(existing.map((e) => e.id));
  let n = existing.length + 1;
  let id = `${CUSTOM_EVENT_PREFIX}${n}`;
  while (used.has(id)) {
    n += 1;
    id = `${CUSTOM_EVENT_PREFIX}${n}`;
  }
  return id;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateDraft(draft: CustomEventDraft): ValidationResult {
  if (!draft.nameZh.trim() && !draft.nameEn.trim()) {
    return { ok: false, error: '請輸入事件名稱。 / Name required.' };
  }
  if (!Number.isFinite(draft.yearMin) || !Number.isFinite(draft.yearMax)) {
    return { ok: false, error: '年份無效。 / Invalid years.' };
  }
  if (draft.yearMin > draft.yearMax) {
    return { ok: false, error: '起始年份不可大於結束年份。 / yearMin must be ≤ yearMax.' };
  }
  if (draft.effects.length === 0) {
    return { ok: false, error: '至少需要一項效果。 / Add at least one effect.' };
  }
  return { ok: true };
}

/** Assemble a validated draft into a firing-ready HistoricalEvent. */
export function buildCustomEvent(
  draft: CustomEventDraft,
  existing: HistoricalEvent[],
): HistoricalEvent {
  return {
    id: mintCustomEventId(existing),
    name: { zh: draft.nameZh || draft.nameEn, en: draft.nameEn || draft.nameZh },
    yearMin: draft.yearMin,
    yearMax: draft.yearMax,
    season: draft.season,
    description: draft.descriptionEn || draft.descriptionZh,
    descriptionZh: draft.descriptionZh || draft.descriptionEn,
    effects: draft.effects,
  };
}
