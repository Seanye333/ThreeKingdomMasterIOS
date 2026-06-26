import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import {
  canAppraise, appraisalGrade, appraisalVerdict, appraisalRenownGain, APPRAISER_MIN_INT,
} from './appraisal';

describe('月旦評 — appraisal', () => {
  it('only a discerning 名士 (高智) may appraise', () => {
    expect(canAppraise(mkOfficer({ stats: { intelligence: APPRAISER_MIN_INT } as never }))).toBe(true);
    expect(canAppraise(mkOfficer({ stats: { intelligence: 60 } as never }))).toBe(false);
    expect(canAppraise(mkOfficer({ status: 'dead', stats: { intelligence: 95 } as never }))).toBe(false);
  });

  it('grades by peak/breadth (上品/中品/下品)', () => {
    expect(appraisalGrade(mkOfficer({ stats: { war: 95, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } as never }))).toBe('upper');
    expect(appraisalGrade(mkOfficer({ stats: { war: 75, leadership: 60, intelligence: 60, politics: 60, charisma: 60 } as never }))).toBe('middle');
    expect(appraisalGrade(mkOfficer({ stats: { war: 40, leadership: 40, intelligence: 40, politics: 40, charisma: 40 } as never }))).toBe('lower');
  });

  it('reserves the 奸雄 verdict for the ambitious schemer of ability', () => {
    const caocao = mkOfficer({ traits: ['ambitious', 'cunning'] as never, stats: { war: 75, leadership: 85, intelligence: 90, politics: 88, charisma: 90 } as never });
    expect(appraisalVerdict(caocao).zh).toContain('奸雄');
    // A mere warrior, however mighty, gets a different read.
    const lubu = mkOfficer({ traits: ['arrogant'] as never, stats: { war: 100, leadership: 80, intelligence: 40, politics: 30, charisma: 60 } as never });
    expect(appraisalVerdict(lubu).zh).not.toContain('奸雄');
    expect(appraisalVerdict(lubu).zh).toContain('萬人');
  });

  it('names a 王佐 for the statesman-strategist', () => {
    const xun = mkOfficer({ stats: { war: 40, leadership: 60, intelligence: 95, politics: 92, charisma: 80 } as never });
    expect(appraisalVerdict(xun).zh).toContain('王佐');
  });

  it('a famed appraiser confers more renown; a glowing verdict more still', () => {
    const famed = mkOfficer({ stats: { intelligence: 98 } as never });
    const plain = mkOfficer({ stats: { intelligence: 80 } as never });
    const gem = mkOfficer({ stats: { war: 95, leadership: 90, intelligence: 90, politics: 85, charisma: 85 } as never });
    const dud = mkOfficer({ stats: { war: 40, leadership: 40, intelligence: 40, politics: 40, charisma: 40 } as never });
    expect(appraisalRenownGain(famed, gem).target).toBeGreaterThan(appraisalRenownGain(plain, gem).target);
    expect(appraisalRenownGain(famed, gem).target).toBeGreaterThan(appraisalRenownGain(famed, dud).target);
    // The appraiser earns a lesser 識人之名 of their own.
    const g = appraisalRenownGain(famed, gem);
    expect(g.appraiser).toBeGreaterThan(0);
    expect(g.appraiser).toBeLessThan(g.target);
  });
});
