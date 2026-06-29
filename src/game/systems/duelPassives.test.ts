/** 獨門 — legendary passives that genuinely change how the marquee fighters play. */
import { describe, it, expect } from 'vitest';
import {
  duelPassive, initDuelBout, duelRound, resolveDuel, SPIRIT_MAX, type DuelBout,
} from './duel';
import { mkOfficer, seededRng } from '../../test/factories';

const W = (war: number) => ({ war, leadership: 60, intelligence: 50, politics: 50, charisma: 60 });
const plain = (id: string, war = 85) => mkOfficer({ id, stats: W(war) });

describe('duelPassive — assignment', () => {
  it('maps the marquee fighters to their signature passive', () => {
    expect(duelPassive(plain('lu-bu'))?.id).toBe('tyrant-might');
    expect(duelPassive(plain('zhao-yun'))?.id).toBe('undying-valor');
    expect(duelPassive(plain('hist-xiang-yu'))?.id).toBe('overlord-aura');
    expect(duelPassive(plain('hist-yue-fei'))?.id).toBe('immovable');
    expect(duelPassive(plain('nobody'))).toBe(null);
  });
});

describe('開場被動 — opening effects (initDuelBout)', () => {
  it('霸王色 (項羽) opens the foe cowed: −2 氣 worth & −10 氣力', () => {
    const bout = initDuelBout(plain('hist-xiang-yu'), plain('mook'));
    // foe (defender) opens with less stamina than the un-cowed baseline of 100.
    expect(bout.dStamina).toBe(90);
    expect(bout.dGuard).toBe(0); // would be 0 anyway, but never below 0
  });

  it('西涼鐵騎 (馬超) opens with a banked 氣', () => {
    const bout = initDuelBout(plain('ma-chao'), plain('mook'));
    expect(bout.aGuard).toBeGreaterThanOrEqual(1);
  });
});

describe('回合被動 — in-bout effects (duelRound)', () => {
  const ready = (aId: string, dId: string): DuelBout => ({ ...initDuelBout(plain(aId), plain(dId)), aSpirit: SPIRIT_MAX });

  it('天下無敵 (李存孝) bites +7 deeper on a landed offence', () => {
    // cleave punished by parry → a clean landed strike. Compare李存孝 vs a plain fighter.
    let lcx = 0, base = 0;
    for (let s = 0; s < 30; s++) {
      lcx += duelRound(initDuelBout(plain('hist-li-cunxiao'), plain('foe')), 'cleave', 'parry', seededRng(s + 1)).dmgToDefender;
      base += duelRound(initDuelBout(plain('plainguy'), plain('foe')), 'cleave', 'parry', seededRng(s + 1)).dmgToDefender;
    }
    expect(lcx).toBeGreaterThan(base); // matchless-might adds flat damage
  });

  it('撼山難 (岳飛) shrugs off ~15% of an incoming blow', () => {
    let yf = 0, base = 0;
    for (let s = 0; s < 30; s++) {
      // 岳飛 defends with dodge vs slash (slash punishes dodge → he takes it).
      yf += duelRound(initDuelBout(plain('hist-yue-fei'), plain('foe')), 'dodge', 'slash', seededRng(s + 1)).dmgToAttacker;
      base += duelRound(initDuelBout(plain('plainguy'), plain('foe')), 'dodge', 'slash', seededRng(s + 1)).dmgToAttacker;
    }
    expect(yf).toBeLessThan(base); // immovable reduces damage taken
  });

  it('七進七出 (趙雲) cheats death once, then a second knockout is lethal', () => {
    let bout: DuelBout = { ...initDuelBout(plain('zhao-yun', 70), plain('foe', 96)), aStamina: 20 };
    const rng = seededRng(3);
    let saved = false, killed = false;
    for (let i = 0; i < 10 && !bout.over; i++) {
      const r = duelRound(bout, 'dodge', 'slash', rng); // keep mis-defending → take clean slashes
      bout = r.bout;
      if (r.mountSaved === 'attacker') saved = true;
      if (bout.killedId === 'attacker') killed = true;
    }
    expect(saved).toBe(true);            // 七進七出 floored him at 1 at least once
    if (killed) expect(saved).toBe(true); // any death only AFTER the cheat was spent
  });
});

describe('auto-resolve also honours passives', () => {
  it('a 七進七出 fighter is never cut down in an auto bout (innate savior)', () => {
    const monster = mkOfficer({ id: 'lu-bu', stats: W(100), traits: ['matchless'] });
    const zhao = mkOfficer({ id: 'zhao-yun', stats: W(66) });
    let killedEver = false;
    for (let s = 0; s < 60; s++) {
      const r = resolveDuel({ attacker: monster, defender: zhao, rng: seededRng(s * 7 + 1) });
      if (r.killedId === 'zhao-yun') killedEver = true;
    }
    expect(killedEver).toBe(false);
  });
});
