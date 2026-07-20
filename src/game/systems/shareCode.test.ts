import { describe, it, expect } from 'vitest';
import { encodeStartCode, decodeStartCode, defaultRules, describeRules, CODE_PREFIX } from './shareCode';

const vanilla = { scenarioId: 'yellow-turban', forceId: 'liu-bei', rules: defaultRules() };

describe('開局挑戰碼', () => {
  it('round-trips a vanilla start', () => {
    const code = encodeStartCode(vanilla);
    const r = decodeStartCode(code);
    expect(r.ok).toBe(true);
    expect(r.code).toEqual(vanilla);
  });

  it('round-trips a heavily-customised start', () => {
    const custom = {
      scenarioId: 'guandu-200',
      forceId: 'cao-cao',
      rules: {
        ...defaultRules(),
        difficulty: 'hard' as const,
        aiStrength: 5,
        ironman: true,
        disasterFrequency: 'high' as const,
        talentDiscovery: 'scarce' as const,
        initialDiplomacy: 'warring' as const,
        startInflation: 40,
        battleDifficulty: 'hard' as const,
      },
    };
    const r = decodeStartCode(encodeStartCode(custom));
    expect(r.ok).toBe(true);
    expect(r.code).toEqual(custom);
  });

  it('keeps a vanilla code short and prefixed', () => {
    const code = encodeStartCode(vanilla);
    expect(code.startsWith(`${CODE_PREFIX}.`)).toBe(true);
    expect(code.length).toBeLessThan(40);
  });

  it('survives lowercase and stray whitespace from a chat paste', () => {
    const code = encodeStartCode(vanilla);
    expect(decodeStartCode(`  ${code.toLowerCase()} \n`).code).toEqual(vanilla);
  });

  it('handles scenario ids that contain hyphens', () => {
    const c = { ...vanilla, scenarioId: 'three-kingdoms-decline-263' };
    expect(decodeStartCode(encodeStartCode(c)).code?.scenarioId).toBe('three-kingdoms-decline-263');
  });

  it('rejects a mangled code rather than silently mis-loading it', () => {
    const code = encodeStartCode({ ...vanilla, rules: { ...defaultRules(), ironman: true } });
    const mangled = code.slice(0, -2) + 'ZZ';
    const r = decodeStartCode(mangled);
    expect(r.ok).toBe(false);
    expect(r.errorZh).toContain('校驗');
  });

  it('rejects something that is not a code at all', () => {
    expect(decodeStartCode('hello world').ok).toBe(false);
    expect(decodeStartCode('').ok).toBe(false);
  });

  it('a code from an older build (short rule string) decodes to current defaults', () => {
    // Hand-build a code with only the first two rule digits present.
    const body = 'YELLOW-TURBAN.LIU-BEI.21';   // difficulty=hard, aiStrength=1
    let h = 7;
    for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) % 1296;
    const r = decodeStartCode(`TKM1.${body}.${h.toString(36).padStart(2, '0')}`);
    expect(r.ok).toBe(true);
    expect(r.code?.rules.difficulty).toBe('hard');
    expect(r.code?.rules.aiStrength).toBe(1);
    expect(r.code?.rules.ironman).toBe(false);               // absent → today's default
    expect(r.code?.rules.initialDiplomacy).toBe('neutral');
  });

  it('snaps an off-grid numeric to the nearest legal value', () => {
    const r = decodeStartCode(encodeStartCode({
      ...vanilla, rules: { ...defaultRules(), startInflation: 37 },
    }));
    expect(r.code?.rules.startInflation).toBe(40);
  });

  it('describes only what differs from the defaults', () => {
    expect(describeRules(defaultRules()).zh).toBe('全用預設規則');
    const d = describeRules({ ...defaultRules(), ironman: true, difficulty: 'hard' });
    expect(d.zh).toContain('鐵人模式');
    expect(d.zh).toContain('難度');
    expect(d.zh).not.toContain('單挑頻率');
  });
});
