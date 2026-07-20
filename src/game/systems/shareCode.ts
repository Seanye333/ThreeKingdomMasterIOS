/**
 * 開局挑戰碼 (§9.x) — a short string that reproduces an opening exactly.
 *
 * "I took 劉備 out of 平原 on hard, ironman, no talent to be found, disasters
 * every other year, and held on for eleven years" is a story you cannot
 * currently tell anyone, because there is no way to hand them the same start.
 * A share code is that handle: scenario, force, and all 20 rule settings packed
 * into ~40 characters you can put in a message.
 *
 * Format:  TKM1.<scenarioId>.<forceId>.<rules>.<check>
 *
 *   Fields are dot-separated because ids themselves contain hyphens
 *   (`three-kingdoms-decline-263`, `liu-bei`) — splitting on '-' cannot tell
 *   where the scenario ends and the force begins.
 *
 *   rules  one base-36 digit per rule field, in a FIXED order (see RULE_FIELDS).
 *          A code from an older build is short; missing trailing digits read as
 *          that field's default, so adding a rule never invalidates old codes.
 *   check  two base-36 digits of a checksum over the whole payload, so a code
 *          mangled by a chat client is rejected rather than silently mis-loaded.
 *
 * Deliberately not compressed or obfuscated: a player who wants to hand-edit a
 * code to try "the same start but on hard" should be able to.
 */

export interface StartRules {
  difficulty: 'normal' | 'easy' | 'hard';
  aiStrength: number;
  startHandicap: 'even' | 'weak' | 'strong';
  victoryGoal: 'free' | 'unify' | 'hegemon' | 'tripartite';
  startTaxRate: 'normal' | 'light' | 'heavy';
  startInflation: number;
  aiStartTroops: 'even' | 'fewer' | 'more';
  battleDifficulty: 'easy' | 'normal' | 'hard' | null;
  lifespanMode: 'historical' | 'fictionalImmortal' | 'immortal';
  lifespanLength: 'historical' | 'short' | 'long';
  agingStatLock: boolean;
  noBattleDeath: boolean;
  reviveDeadOfficers: boolean;
  talentDiscovery: 'scarce' | 'normal' | 'plentiful';
  duelFrequency: 'rare' | 'normal' | 'frequent';
  disasterFrequency: 'low' | 'normal' | 'high';
  ironman: boolean;
  newOfficers: 'off' | 'rare' | 'normal' | 'common';
  fictionalPool: 'off' | 'some' | 'many';
  initialDiplomacy: 'neutral' | 'warring' | 'coalitions';
}

export interface StartCode {
  scenarioId: string;
  forceId: string;
  rules: StartRules;
}

/**
 * Fixed field order. **Append only** — inserting a field in the middle would
 * re-interpret every code ever shared. The FIRST value of each list is the
 * default, so a truncated (older) code decodes to today's defaults.
 */
const RULE_FIELDS: Array<{ key: keyof StartRules; values: unknown[] }> = [
  { key: 'difficulty',        values: ['normal', 'easy', 'hard'] },
  { key: 'aiStrength',        values: [3, 1, 2, 4, 5] },
  { key: 'startHandicap',     values: ['even', 'weak', 'strong'] },
  { key: 'victoryGoal',       values: ['free', 'unify', 'hegemon', 'tripartite'] },
  { key: 'startTaxRate',      values: ['normal', 'light', 'heavy'] },
  { key: 'startInflation',    values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
  { key: 'aiStartTroops',     values: ['even', 'fewer', 'more'] },
  { key: 'battleDifficulty',  values: [null, 'easy', 'normal', 'hard'] },
  { key: 'lifespanMode',      values: ['historical', 'fictionalImmortal', 'immortal'] },
  { key: 'lifespanLength',    values: ['historical', 'short', 'long'] },
  { key: 'agingStatLock',     values: [false, true] },
  { key: 'noBattleDeath',     values: [false, true] },
  { key: 'reviveDeadOfficers', values: [false, true] },
  { key: 'talentDiscovery',   values: ['normal', 'scarce', 'plentiful'] },
  { key: 'duelFrequency',     values: ['normal', 'rare', 'frequent'] },
  { key: 'disasterFrequency', values: ['normal', 'low', 'high'] },
  { key: 'ironman',           values: [false, true] },
  { key: 'newOfficers',       values: ['off', 'rare', 'normal', 'common'] },
  { key: 'fictionalPool',     values: ['off', 'some', 'many'] },
  { key: 'initialDiplomacy',  values: ['neutral', 'warring', 'coalitions'] },
];

export const CODE_PREFIX = 'TKM1';

/** Every rule at its default — what a bare scenario+force code means. */
export function defaultRules(): StartRules {
  const out = {} as Record<string, unknown>;
  for (const f of RULE_FIELDS) out[f.key] = f.values[0];
  return out as unknown as StartRules;
}

/** Nearest legal value for a field (an inflation of 37 stores as 40). */
function indexOf(field: { key: keyof StartRules; values: unknown[] }, value: unknown): number {
  const exact = field.values.findIndex((v) => v === value);
  if (exact >= 0) return exact;
  if (typeof value === 'number') {
    let best = 0, bestGap = Infinity;
    field.values.forEach((v, i) => {
      if (typeof v !== 'number') return;
      const gap = Math.abs(v - value);
      if (gap < bestGap) { bestGap = gap; best = i; }
    });
    return best;
  }
  return 0;   // unknown value → the default
}

function checksum(payload: string): string {
  let h = 7;
  for (let i = 0; i < payload.length; i++) h = (h * 31 + payload.charCodeAt(i)) % 1296;
  return h.toString(36).padStart(2, '0');
}

export function encodeStartCode(code: StartCode): string {
  const digits = RULE_FIELDS
    .map((f) => indexOf(f, (code.rules as unknown as Record<string, unknown>)[f.key]).toString(36))
    .join('');
  // Trailing defaults carry no information — drop them so a vanilla start is a
  // genuinely short code (people will paste these into chat).
  const trimmed = digits.replace(/0+$/, '');
  // The checksum is taken over the FINAL (upper-cased) text, so a code that has
  // been shouted, lower-cased or auto-capitalised still verifies.
  const body = `${code.scenarioId}.${code.forceId}.${trimmed || '0'}`.toUpperCase();
  return `${CODE_PREFIX}.${body}.${checksum(body)}`.toUpperCase();
}

export interface DecodeResult {
  ok: boolean;
  code?: StartCode;
  errorZh?: string;
  errorEn?: string;
}

export function decodeStartCode(raw: string): DecodeResult {
  const text = (raw ?? '').trim().toUpperCase();
  const parts = text.split('.');
  if (parts.length !== 5 || parts[0] !== CODE_PREFIX) {
    return { ok: false, errorZh: '非本作之開局碼(應以 TKM1. 起首)。', errorEn: 'Not a valid start code (must begin TKM1.).' };
  }
  const [, scenarioId, forceId, digits, check] = parts;
  if (!scenarioId || !forceId || !digits) {
    return { ok: false, errorZh: '開局碼殘缺。', errorEn: 'Truncated start code.' };
  }
  const body = `${scenarioId}.${forceId}.${digits}`;
  if (checksum(body) !== check.toLowerCase()) {
    return { ok: false, errorZh: '開局碼校驗不符 — 或於轉貼時被截斷。', errorEn: 'Checksum mismatch — the code was likely mangled in transit.' };
  }
  const rules = defaultRules() as unknown as Record<string, unknown>;
  RULE_FIELDS.forEach((f, i) => {
    const ch = digits[i];
    if (ch === undefined) return;                 // older code → keep the default
    const idx = parseInt(ch, 36);
    if (Number.isNaN(idx) || idx >= f.values.length) return;
    rules[f.key] = f.values[idx];
  });
  return {
    ok: true,
    code: { scenarioId: scenarioId.toLowerCase(), forceId: forceId.toLowerCase(), rules: rules as unknown as StartRules },
  };
}

/** A human-readable summary of what a code will actually start (for the paste
 *  confirmation, so nobody loads an ironman run by accident). */
export function describeRules(rules: StartRules): { zh: string; en: string } {
  const d = defaultRules() as unknown as Record<string, unknown>;
  const zhNames: Partial<Record<keyof StartRules, string>> = {
    difficulty: '難度', aiStrength: 'AI強度', startHandicap: '起始國力', victoryGoal: '勝利條件',
    startTaxRate: '起始稅率', startInflation: '起始通脹', aiStartTroops: 'AI兵力', battleDifficulty: '戰鬥難度',
    lifespanMode: '壽命', lifespanLength: '壽長', agingStatLock: '衰老鎖屬性', noBattleDeath: '不會戰死',
    reviveDeadOfficers: '起死回生', talentDiscovery: '在野登場', duelFrequency: '單挑頻率',
    disasterFrequency: '天災頻率', ironman: '鐵人模式', newOfficers: '新武將', fictionalPool: '虛構人才庫',
    initialDiplomacy: '初始外交',
  };
  const changed = RULE_FIELDS
    .filter((f) => (rules as unknown as Record<string, unknown>)[f.key] !== d[f.key])
    .map((f) => `${zhNames[f.key] ?? f.key}=${String((rules as unknown as Record<string, unknown>)[f.key])}`);
  if (changed.length === 0) return { zh: '全用預設規則', en: 'All rules at defaults' };
  return { zh: changed.join(' · '), en: changed.join(' · ') };
}
