import { describe, it, expect } from 'vitest';
import {
  embassyTargets,
  getEmbassyTarget,
  embassyLegSeasons,
  embassyPeril,
  resolveEmbassy,
  realmTradeIncome,
} from './foreignRealm';
import { mkOfficer } from '../../test/factories';

const ablEnvoy = mkOfficer({ id: 'env', stats: { leadership: 60, war: 50, intelligence: 85, politics: 85, charisma: 90 } });
const greenEnvoy = mkOfficer({ id: 'green', stats: { leadership: 30, war: 30, intelligence: 25, politics: 25, charisma: 25 } });

describe('遠使異域 — targets & travel', () => {
  it('lists realms (gated by year) plus all border tribes', () => {
    const early = embassyTargets(200);
    const late = embassyTargets(240);
    // 倭/邪馬台 gates on minYear 230 → present only in the later list.
    expect(early.some((t) => t.id === 'wa')).toBe(false);
    expect(late.some((t) => t.id === 'wa')).toBe(true);
    // Tribes always present.
    expect(late.some((t) => t.id === 'nanban' && t.isTribe)).toBe(true);
    // Far realms present.
    expect(late.some((t) => t.id === 'daqin')).toBe(true);
  });

  it('resolves both a realm and a tribe by id', () => {
    expect(getEmbassyTarget('gaochang')?.isTribe).toBe(false);
    expect(getEmbassyTarget('xianbei')?.isTribe).toBe(true);
    expect(getEmbassyTarget('nope')).toBeNull();
  });

  it('the far west is a far longer journey than the Silk Road gate', () => {
    const rome = getEmbassyTarget('daqin')!;
    const turfan = getEmbassyTarget('gaochang')!;
    expect(embassyLegSeasons(rome, ablEnvoy)).toBeGreaterThan(embassyLegSeasons(turfan, ablEnvoy));
  });

  it('a capable envoy faces less peril than a green one', () => {
    const rome = getEmbassyTarget('daqin')!;
    expect(embassyPeril(rome, ablEnvoy)).toBeLessThan(embassyPeril(rome, greenEnvoy));
  });
});

describe('遠使異域 — resolution', () => {
  it('a successful realm embassy yields a haul (gold) and prestige', () => {
    const wa = getEmbassyTarget('wa')!; // prestige 10 (親魏倭王)
    const out = resolveEmbassy({ target: wa, officer: ablEnvoy, freeChieftain: false, rng: () => 0.9 });
    expect(out.perished).toBe(false);
    expect(out.prestige).toBeGreaterThan(0);
    expect(out.haul.gold).toBeGreaterThan(0);
  });

  it('a successful tribe embassy placates it (negative aggression delta) + auxiliaries', () => {
    const nanban = getEmbassyTarget('nanban')!;
    const out = resolveEmbassy({ target: nanban, officer: ablEnvoy, freeChieftain: false, rng: () => 0.9 });
    expect(out.aggressionDelta?.tribeId).toBe('nanban');
    expect(out.aggressionDelta!.delta).toBeLessThan(0);
    expect(out.haul.auxTroops).toBeGreaterThan(0);
  });

  it('a free chieftain can be won over (lucky roll)', () => {
    const nanban = getEmbassyTarget('nanban')!; // chieftain meng-huo
    const rolls = [0.99, 0.5, 0.5, 0.5, 0.01, 0.01]; // dodge peril, then succeed the recruit roll
    let i = 0;
    const rng = () => rolls[Math.min(i++, rolls.length - 1)];
    const out = resolveEmbassy({ target: nanban, officer: ablEnvoy, freeChieftain: true, rng });
    expect(out.haul.recruitOfficerId).toBe('meng-huo');
  });

  it('a warm prior relationship makes the road safer (lower effective peril)', () => {
    const rome = getEmbassyTarget('daqin')!;
    // At rng 0.08 a cold call lands in the death band; a warm relationship
    // shrinks that band enough that the same roll is only a (survivable) mishap.
    const cold = resolveEmbassy({ target: rome, officer: greenEnvoy, freeChieftain: false, relation: 0, rng: () => 0.08 });
    const warm = resolveEmbassy({ target: rome, officer: greenEnvoy, freeChieftain: false, relation: 100, rng: () => 0.08 });
    expect(cold.perished).toBe(true);
    expect(warm.perished).toBe(false);
  });

  it('the farthest realms can claim a weak envoy on the road', () => {
    const rome = getEmbassyTarget('daqin')!; // danger 0.6
    const out = resolveEmbassy({ target: rome, officer: greenEnvoy, freeChieftain: false, rng: () => 0.001 });
    expect(out.perished).toBe(true);
  });

  it('a high-relation realm lends a fighting contingent (借兵成軍)', () => {
    const turfan = getEmbassyTarget('gaochang')!; // no auxTroops in its base reward
    const cold = resolveEmbassy({ target: turfan, officer: ablEnvoy, freeChieftain: false, relation: 0, rng: () => 0.9 });
    const warm = resolveEmbassy({ target: turfan, officer: ablEnvoy, freeChieftain: false, relation: 90, rng: () => 0.9 });
    expect(cold.haul.auxTroops ?? 0).toBe(0);
    expect(warm.haul.auxTroops ?? 0).toBeGreaterThan(0);
  });

  it('farther realms run richer caravans; tribes run none', () => {
    expect(realmTradeIncome('daqin')).toBeGreaterThan(realmTradeIncome('gaochang'));
    expect(realmTradeIncome('nanban')).toBe(0); // tribe — no caravan
  });

  it('a mishap returns the envoy wounded and empty', () => {
    const rome = getEmbassyTarget('daqin')!;
    // 0.1 dodges the death band (peril*0.22) but is under peril → mishap.
    const out = resolveEmbassy({ target: rome, officer: ablEnvoy, freeChieftain: false, rng: () => 0.12 });
    expect(out.perished).toBe(false);
    expect(out.wounded).toBe(true);
  });
});
