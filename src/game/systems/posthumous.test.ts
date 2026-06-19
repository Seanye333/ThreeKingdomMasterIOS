/** 諡號 — locks the 諡法. */
import { describe, expect, it } from 'vitest';
import { mkOfficer } from '../../test/factories';
import { grantPosthumousName } from './posthumous';

describe('grantPosthumousName', () => {
  it('the famous get their historical name', () => {
    expect(grantPosthumousName(mkOfficer({ id: 'guan-yu', forceId: 'shu' }))).toBe('壯繆侯');
    expect(grantPosthumousName(mkOfficer({ id: 'zhuge-liang', forceId: 'shu' }))).toBe('忠武侯');
  });
  it('the rest are named by how they lived', () => {
    expect(grantPosthumousName(mkOfficer({ forceId: 'wei', stats: { war: 95, intelligence: 40, politics: 40, leadership: 40, charisma: 40 } }))).toBe('壯侯');
    expect(grantPosthumousName(mkOfficer({ forceId: 'wei', stats: { war: 40, intelligence: 88, politics: 40, leadership: 40, charisma: 40 } }))).toBe('文侯');
    expect(grantPosthumousName(mkOfficer({ forceId: 'wei', stats: { war: 50, intelligence: 50, politics: 50, leadership: 50, charisma: 50 } }))).toBe('節侯');
  });
  it('wanderers die untitled', () => {
    expect(grantPosthumousName(mkOfficer({ forceId: null }))).toBeNull();
  });
});
