import { describe, it, expect } from 'vitest';
import { describeBlow, type BlowFacts } from './tacticalNarration';

/**
 * The narrator's job is to make the blow's *dominant cause* legible. These
 * tests pin the priority order, because the whole point is that a player can
 * tell why a blow landed the way it did — a line that always says "they fought"
 * would pass a smoke test and fail the design.
 */

const base: BlowFacts = {
  attackerName: '張飛', attackerNameEn: 'Zhang Fei',
  targetName: '夏侯惇', targetNameEn: 'Xiahou Dun',
  attackerType: 'infantry', targetType: 'infantry',
  damage: 800, targetTroopsBefore: 5000, targetMaxTroops: 5000,
  isRanged: false, counterMult: 1,
  attackerTerrain: 'plain', targetTerrain: 'plain',
  fromRear: false, flankMul: 1, pincers: 0,
  ambush: false, grounded: false, isNight: false, weather: 'clear',
  attackerFatigue: 0, counterDamage: 0, ammoEmptied: false,
};
const fixed = 0; // always the first verb, so assertions are stable

describe('戰報敘事 — describeBlow', () => {
  it('names both sides, the arm, and the toll', () => {
    const line = describeBlow(base, fixed)!;
    expect(line.zh).toContain('張飛');
    expect(line.zh).toContain('夏侯惇');
    expect(line.zh).toContain('步卒');
    expect(line.zh).toContain('800');
    expect(line.en).toContain('Zhang Fei');
    expect(line.en).toContain('800');
  });

  it('a blow that felled nobody and drew no riposte is not worth a line', () => {
    expect(describeBlow({ ...base, damage: 0 }, fixed)).toBeNull();
    // ...but a scratch that cost the attacker blood still is.
    expect(describeBlow({ ...base, damage: 0, counterDamage: 300 }, fixed)).not.toBeNull();
  });

  it('a sprung ambush outranks everything — the engine used to say nothing at all', () => {
    const line = describeBlow({ ...base, ambush: true, grounded: true, fromRear: true, pincers: 3 }, fixed)!;
    expect(line.zh).toContain('伏兵驟起');
  });

  it('a grounded hull outranks every other explanation', () => {
    const line = describeBlow({
      ...base, grounded: true, fromRear: true, pincers: 3, counterMult: 1.3,
    }, fixed)!;
    expect(line.zh).toContain('觸淺');
  });

  it('the rear arc beats the flank, and the flank beats the matchup', () => {
    expect(describeBlow({ ...base, fromRear: true, flankMul: 1.25, counterMult: 1.3 }, fixed)!.zh)
      .toContain('繞出其背');
    expect(describeBlow({ ...base, flankMul: 1.12, counterMult: 1.3 }, fixed)!.zh)
      .toContain('橫擊其側');
    expect(describeBlow({ ...base, attackerType: 'spearmen', targetType: 'cavalry', counterMult: 1.3 }, fixed)!.zh)
      .toContain('槍陣正克鐵騎');
  });

  it('says so when the arm is the WRONG tool, not just when it is the right one', () => {
    const line = describeBlow({
      ...base, attackerType: 'cavalry', targetType: 'spearmen', counterMult: 0.8,
    }, fixed)!;
    expect(line.zh).toContain('最忌');
  });

  it('distinguishes being pressed on three sides from a plain pair', () => {
    expect(describeBlow({ ...base, pincers: 2 }, fixed)!.zh).toContain('三面');
    expect(describeBlow({ ...base, pincers: 1 }, fixed)!.zh).toContain('夾攻');
  });

  it('reads the ground the attacker stands on before the ground the target hides in', () => {
    expect(describeBlow({ ...base, attackerTerrain: 'hill', targetTerrain: 'forest' }, fixed)!.zh)
      .toContain('據高而下');
    expect(describeBlow({ ...base, targetTerrain: 'forest' }, fixed)!.zh)
      .toContain('林深難進');
  });

  it('falls back through elite → fatigue → night → weather, and can still say nothing special', () => {
    expect(describeBlow({ ...base, eliteZh: '虎豹騎' }, fixed)!.zh).toContain('虎豹騎');
    expect(describeBlow({ ...base, attackerFatigue: 80 }, fixed)!.zh).toContain('師老兵疲');
    expect(describeBlow({ ...base, isNight: true }, fixed)!.zh).toContain('夜色');
    expect(describeBlow({ ...base, weather: 'rain' }, fixed)!.zh).toContain('雨中');
    // A plain blow on open ground in fair daylight: still narrated, just plainly.
    expect(describeBlow(base, fixed)!.zh).toMatch(/斬 800/);
  });

  it('scales the verdict with how much of the establishment fell', () => {
    expect(describeBlow({ ...base, damage: 2000 }, fixed)!.zh).toContain('陣列摧折'); // 40%
    expect(describeBlow({ ...base, damage: 1000 }, fixed)!.zh).toContain('大挫其鋒'); // 20%
    expect(describeBlow({ ...base, damage: 500 }, fixed)!.zh).toContain('陣腳一鬆'); // 10%
    expect(describeBlow({ ...base, damage: 100 }, fixed)!.zh).toContain('略挫');     // 2%
  });

  it('reports the riposte and an emptied quiver', () => {
    const line = describeBlow({ ...base, isRanged: true, counterDamage: 240, ammoEmptied: true }, fixed)!;
    expect(line.zh).toContain('還擊折 240');
    expect(line.zh).toContain('箭矢已空');
    expect(line.en).toContain('quivers are empty');
  });

  it('picks a ranged verb for a volley and a melee verb for a press', () => {
    expect(describeBlow({ ...base, isRanged: true }, fixed)!.zh).toContain('攢射');
    expect(describeBlow(base, fixed)!.zh).toContain('撲擊');
  });

  it('rotates the verb by a plain integer and never touches the combat rng', () => {
    // Flavour must be free: drawing a synonym from the shared rng would advance
    // the combat stream once per blow and silently re-roll the whole battle.
    expect(describeBlow.length).toBeLessThanOrEqual(2);
    const seen = new Set<string>();
    for (let v = 0; v < 5; v++) seen.add(describeBlow(base, v)!.zh);
    expect(seen.size).toBeGreaterThan(1);          // it does vary
    expect(describeBlow(base, 3)!.zh).toBe(describeBlow(base, 3)!.zh); // same variant, same line
    expect(describeBlow(base, -1)!.zh).toBeTruthy(); // negative variants wrap, not crash
  });
});
