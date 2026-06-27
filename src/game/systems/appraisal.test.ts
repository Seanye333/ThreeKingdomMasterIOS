import { describe, it, expect } from 'vitest';
import { mkOfficer } from '../../test/factories';
import {
  canAppraise, appraisalGrade, appraisalVerdict, appraisalRenownGain, APPRAISER_MIN_INT,
  discernment, isLegendaryCritic, legendaryVerdict, appraisalMisread, pickMonthlyAppraisal,
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

  it('a legendary critic’s word makes a bigger name than an equally-smart unknown', () => {
    const xushao = mkOfficer({ id: 'xu-shao', stats: { intelligence: 85 } as never });
    const unknown = mkOfficer({ id: 'nobody', stats: { intelligence: 85 } as never });
    const gem = mkOfficer({ stats: { war: 95, leadership: 90, intelligence: 90, politics: 85, charisma: 85 } as never });
    expect(appraisalRenownGain(xushao, gem).target).toBeGreaterThan(appraisalRenownGain(unknown, gem).target);
  });
});

describe('月旦評 — 識人造詣 / 走眼', () => {
  it('the legendary critics are flagged and never err', () => {
    expect(isLegendaryCritic(mkOfficer({ id: 'sima-hui' }))).toBe(true);
    expect(isLegendaryCritic(mkOfficer({ id: 'xu-shao' }))).toBe(true);
    expect(discernment(mkOfficer({ id: 'sima-hui', stats: { intelligence: 50 } as never }))).toBeCloseTo(0.98);
  });

  it('discernment climbs with 智力, with a real misread risk for a middling eye', () => {
    expect(discernment(mkOfficer({ stats: { intelligence: 78 } as never }))).toBeLessThan(discernment(mkOfficer({ stats: { intelligence: 100 } as never })));
    expect(discernment(mkOfficer({ stats: { intelligence: 78 } as never }))).toBeLessThan(0.5); // 走眼 plausible
  });

  it('a 走眼 verdict is flagged misread', () => {
    expect(appraisalMisread(() => 0).misread).toBe(true);
  });

  it('司馬徽 names 臥龍鳳雛 with the immortal line', () => {
    expect(legendaryVerdict(mkOfficer({ id: 'zhuge-liang' }))?.zh).toContain('臥龍鳳雛');
    expect(legendaryVerdict(mkOfficer({ id: 'pang-tong' }))?.grade).toBe('upper');
    expect(legendaryVerdict(mkOfficer({ id: 'someone-else' }))).toBeNull();
  });

  it('the 有才無德 verdict flags an able but treacherous officer', () => {
    const able = mkOfficer({ traits: ['cruel'] as never, stats: { war: 88, leadership: 80, intelligence: 70, politics: 60, charisma: 50 } as never });
    expect(appraisalVerdict(able).zh).toContain('德薄');
  });
});

describe('月旦評 — 公開評議 pick', () => {
  it('picks a keen court critic and the strongest unread 在野 talent', () => {
    const officers = {
      critic: mkOfficer({ id: 'critic', forceId: 'me', status: 'active', stats: { intelligence: 90 } as never }),
      gem: mkOfficer({ id: 'gem', forceId: null, status: 'idle', stats: { war: 95, leadership: 90, intelligence: 88, politics: 80, charisma: 80 } as never }),
      dud: mkOfficer({ id: 'dud', forceId: null, status: 'idle', stats: { war: 40, leadership: 40, intelligence: 40, politics: 40, charisma: 40 } as never }),
      already: mkOfficer({ id: 'already', forceId: null, status: 'idle', appraisal: { zh: 'x', en: 'x', grade: 'upper' } as never, stats: { war: 99 } as never }),
    };
    const pick = pickMonthlyAppraisal(officers, 'me');
    expect(pick?.critic.id).toBe('critic');
    expect(pick?.target.id).toBe('gem'); // strongest unread idle in-野 talent
  });

  it('no pick without a real 名士 in court', () => {
    const officers = {
      dull: mkOfficer({ id: 'dull', forceId: 'me', status: 'active', stats: { intelligence: 70 } as never }),
      gem: mkOfficer({ id: 'gem', forceId: null, status: 'idle', stats: { war: 95 } as never }),
    };
    expect(pickMonthlyAppraisal(officers, 'me')).toBeNull();
  });
});
