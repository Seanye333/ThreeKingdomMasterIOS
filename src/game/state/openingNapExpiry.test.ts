import { describe, it, expect } from 'vitest';
import { useGameStore } from './store';
import { SCENARIOS } from '../data/scenarios';
import { getRelation, pairKey } from '../types';
import { SCENARIO_NAP_SEASONS, tickDiplomacy, addSeasons } from '../systems/diplomacy';

/**
 * 劇本開局的互不侵犯**會期滿** —— 此前是永久的,而那不是有意為之。
 *
 * 局中簽的互不侵犯是八季(`NAP_DURATION_SEASONS`),劇本開局那些卻沒有期限:
 * `rel()` 單純沒帶 `expiresAt` 這個欄位。後果不是「劇本比較守信」,是
 * **史書上撕得最快的幾紙盟約在盤上撕不掉** —— 195/197 兩張盤的曹操與袁紹是
 * 同盟(那是史實),而官渡在 200 年:期限若是永久,那一仗在自己的年代裡
 * 永遠打不起來,兩家的主目標也就永遠是 0。
 *
 * 同盟(`allied`)不在此列:那是另一種東西,由聯姻/會盟/背盟各自管。
 */
describe('劇本開局的互不侵犯', () => {
  const sc = SCENARIOS.find((s) => s.id === 'scn-190-anti-dong-zhuo')!;
  const load = () => {
    useGameStore.getState().loadScenario(sc, 'cao', 'normal');
    return useGameStore.getState();
  };

  it('互不侵犯帶期限,同盟不帶', () => {
    const st = load();
    // 190 盤:曹操與陶謙是互不侵犯,與袁紹是同盟(討董聯軍是同一邊)。
    const nap = getRelation(st.diplomacy, 'cao', 'tao');
    const ally = getRelation(st.diplomacy, 'cao', 'yuan-shao');
    expect(nap.status).toBe('non-aggression');
    expect(nap.expiresAt, '開局的互不侵犯要會期滿').toBeDefined();
    expect(ally.status).toBe('allied');
    expect(ally.expiresAt, '同盟不由期限管').toBeUndefined();
  });

  it('期限是開局起算的五年,到期那一季轉回 neutral —— 轉回去才打得起來', () => {
    const st = load();
    const due = addSeasons(sc.startDate!, SCENARIO_NAP_SEASONS);
    // 到期前一年:還在。
    const before = tickDiplomacy({
      diplomacy: st.diplomacy,
      date: { year: due.year - 1, season: due.season },
      forces: st.forces, cities: st.cities,
      playerForceId: 'cao', isYearTransition: false,
    } as never);
    expect(before.diplomacy.relations[pairKey('cao', 'tao')].status).toBe('non-aggression');
    // 到期那一季:轉 neutral(= isHostilePermitted 放行)。
    const after = tickDiplomacy({
      diplomacy: st.diplomacy, date: due,
      forces: st.forces, cities: st.cities,
      playerForceId: 'cao', isYearTransition: false,
    } as never);
    expect(after.diplomacy.relations[pairKey('cao', 'tao')].status).toBe('neutral');
  });
});
