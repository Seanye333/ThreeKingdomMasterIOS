import { describe, it, expect } from 'vitest';
import { pickAiFormation, applyStratagem, smokeOnLine, forecastAttack } from './tactical';
import { weatherAttackMul } from './ai';
import {
  fireAttackMultiplier, marchSpeedMultiplier, rollWeatherDisaster, seasonWeatherOutlook,
  type Weather,
} from './weather';
import { mkOfficer, mkUnit, mkBattle, mkTiles, officerMap } from '../../test/factories';
import type { Officer } from '../types';

// ───────────────────────── Batch 1 — 天時為將用 (AI 知天候) ──────────────────

describe('§5.4 知天候 — weather steers the AI', () => {
  it('a dry gale loosens the line: pickAiFormation reaches for 疏陣', () => {
    // Same army & wits, only the weather differs.
    const calm = pickAiFormation(['infantry', 'infantry'], 70);
    const fiery = pickAiFormation(['infantry', 'infantry'], 70, { fireWeather: true });
    expect(fiery).toBe('spread-out');     // fight loose so fire can't chain
    expect(calm).not.toBe('spread-out');  // no such worry when the air is still
  });

  it('but a counter-formation order still trumps the fire-weather instinct', () => {
    const f = pickAiFormation(['infantry', 'infantry'], 90, { fireWeather: true, counter: 'arrow-tip' });
    expect(f).not.toBe('spread-out'); // 陣克陣 takes priority over loosening up
  });

  it('weatherAttackMul: strike in a fire-serving gale, bide through the snow', () => {
    const gale: Weather = { kind: 'wind', wind: 'east', windPower: 3 };
    expect(weatherAttackMul(gale, true)).toBeGreaterThan(1.1);   // 智謀在手,趁風縱火
    expect(weatherAttackMul(gale, false)).toBeLessThan(weatherAttackMul(gale, true)); // no firebrand → tepid
    expect(weatherAttackMul({ kind: 'snow', wind: 'north', windPower: 2 }, true)).toBeLessThan(1); // 雪沒脛
    expect(weatherAttackMul({ kind: 'rain', wind: 'south', windPower: 1 }, false)).toBeLessThan(1);
    expect(weatherAttackMul(undefined, true)).toBe(1); // unknown sky → no nudge
  });
});

// ───────────────────────── Batch 2 — 火攻戰術深化 (hex) ───────────────────────

describe('§5.4 煙障 — smoke fouls the archers', () => {
  const archerBattle = (fires: Array<{ col: number; row: number }>) =>
    mkBattle({
      units: [
        mkUnit({ id: 'A', officerId: 'oA', side: 'attacker', unitType: 'archers', coord: { col: 1, row: 2 }, ammo: 20, maxAmmo: 20 }),
        mkUnit({ id: 'D', officerId: 'oD', side: 'defender', coord: { col: 4, row: 2 } }),
      ],
      tiles: mkTiles(8, 6),
      groundFires: fires.map((c) => ({ coord: c, turnsLeft: 3 })),
    });

  it('smokeOnLine counts burning hexes strictly between two points', () => {
    const b = archerBattle([{ col: 2, row: 2 }]);
    expect(smokeOnLine(b, { col: 1, row: 2 }, { col: 4, row: 2 })).toBe(1);
    expect(smokeOnLine(b, { col: 1, row: 2 }, { col: 1, row: 5 })).toBe(0); // off the line
  });

  it('a volley fired through smoke lands softer than a clear shot', () => {
    const clear = archerBattle([]);
    const smoky = archerBattle([{ col: 2, row: 2 }]);
    const off = officerMap(clear.units);
    const fClear = forecastAttack(clear, clear.units[0], clear.units[1], off);
    const fSmoke = forecastAttack(smoky, smoky.units[0], smoky.units[1], officerMap(smoky.units));
    expect(fSmoke.dmgMax).toBeLessThan(fClear.dmgMax); // 煙障迷目,矢不中的
  });
});

// ───────────────────────── Batch 3 — 借東風做活 ──────────────────────────────

describe('§5.4 借東風 — the rite is no longer a sure thing', () => {
  const cast = (casterInt: number, foe?: Officer) => {
    const caster = mkOfficer({ id: 'cast', stats: { leadership: 70, war: 70, intelligence: casterInt, politics: 50, charisma: 50 } });
    const enemy = foe ?? mkOfficer({ id: 'foe' });
    const b = mkBattle({
      units: [
        mkUnit({ id: 'C', officerId: 'cast', side: 'attacker', coord: { col: 1, row: 2 } }),
        mkUnit({ id: 'E', officerId: 'foe', side: 'defender', coord: { col: 5, row: 2 } }),
      ],
      tiles: mkTiles(8, 6),
      weather: 'clear',
    });
    const officers: Record<string, Officer> = { cast: caster, foe: enemy };
    let flips = 0;
    for (let i = 0; i < 300; i++) {
      const r = applyStratagem(b, 'C', 'fire-attack', { col: 5, row: 2 }, officers, 'borrow-wind');
      if (r.battle.weather === 'wind') flips++;
    }
    return flips / 300;
  };

  it('a master prays the wind round far more reliably than a journeyman', () => {
    const master = cast(95);
    const journeyman = cast(60);
    expect(master).toBeGreaterThan(0.8);
    expect(master).toBeGreaterThan(journeyman + 0.15); // wits matter
  });

  it('a wiser enemy sage 逆風 — praying it back blunts the rite', () => {
    const aloneRate = cast(80);
    const sage = mkOfficer({ id: 'foe', stats: { leadership: 70, war: 70, intelligence: 99, politics: 50, charisma: 50 }, skills: ['celestial-tactician'] as never });
    const contestedRate = cast(80, sage);
    expect(contestedRate).toBeLessThan(aloneRate - 0.15); // the sky is contested
  });
});

describe('§5.4 風助火勢 — fireAttackMultiplier is wired again', () => {
  it('scales the blaze by wind, drowns in the rain, no-ops without a firebrand', () => {
    expect(fireAttackMultiplier({ kind: 'wind', wind: 'east', windPower: 3 }, true)).toBeGreaterThan(
      fireAttackMultiplier({ kind: 'wind', wind: 'east', windPower: 2 }, true)); // 風起倍之
    expect(fireAttackMultiplier({ kind: 'rain', wind: 'south', windPower: 1 }, true)).toBeLessThan(1); // 雨中減半
    expect(fireAttackMultiplier({ kind: 'wind', wind: 'east', windPower: 3 }, false)).toBe(1); // no fire tactic → nothing
  });
});

// ───────────────────────── Batch 4 — 天候成災 + 前瞻 ─────────────────────────

describe('§5.4 天候災異 — extreme weather tips a city into ruin', () => {
  const dry = { agriculture: 60, floodWorks: 0, irrigationLevel: 0 };

  it('a summer drought brings 蝗災 or 流民; a clear sky brings nothing', () => {
    const locust = rollWeatherDisaster({ kind: 'drought', wind: 'calm', windPower: 0 }, 'summer', dry, () => 0);
    expect(locust?.kind).toBe('locust');       // rng 0,0 → fields stripped
    const refugees = rollWeatherDisaster({ kind: 'drought', wind: 'calm', windPower: 0 }, 'summer', dry, seqRng([0, 0.9]));
    expect(refugees?.kind).toBe('refugees');   // enter, then ≥0.5 → flee
    expect(rollWeatherDisaster({ kind: 'clear', wind: 'east', windPower: 1 }, 'summer', dry, () => 0)).toBeNull();
  });

  it('prolonged rain bursts the dikes (水患)', () => {
    const flood = rollWeatherDisaster({ kind: 'rain', wind: 'south', windPower: 1 }, 'summer', dry, () => 0);
    expect(flood?.kind).toBe('flood');
    expect(flood?.defenseDelta).toBeLessThan(0); // washes out the ramparts too
  });

  it('irrigation blunts the drought — the same roll that ruins bare fields spares watered ones', () => {
    const w: Weather = { kind: 'drought', wind: 'calm', windPower: 0 };
    expect(rollWeatherDisaster(w, 'summer', dry, () => 0.1)).not.toBeNull();                       // bare → struck
    expect(rollWeatherDisaster(w, 'summer', { ...dry, irrigationLevel: 4 }, () => 0.1)).toBeNull(); // 水利 → spared
  });
});

describe('§5.4 前瞻 + 行軍受阻 — orphaned levers resurrected', () => {
  it('seasonWeatherOutlook flags autumn as fire-attack weather (赤壁)', () => {
    expect(seasonWeatherOutlook('autumn').zh).toContain('火攻');
    expect(seasonWeatherOutlook('winter').zh).toContain('雪');
  });

  it('marchSpeedMultiplier drags a column through snow & rain, speeds a tailwind', () => {
    expect(marchSpeedMultiplier({ kind: 'snow', wind: 'north', windPower: 2 })).toBeLessThan(1);
    expect(marchSpeedMultiplier({ kind: 'rain', wind: 'south', windPower: 1 })).toBeLessThan(1);
    expect(marchSpeedMultiplier({ kind: 'wind', wind: 'east', windPower: 3 })).toBeGreaterThan(1);
    expect(marchSpeedMultiplier(undefined)).toBe(1);
  });
});

/** A deterministic rng that yields a fixed sequence, then 0 forever. */
function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => (i < seq.length ? seq[i++] : 0);
}
