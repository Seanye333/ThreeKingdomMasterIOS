import { describe, it, expect } from 'vitest';
import { SCENARIO_234_WUZHANG, SCENARIO_208_CHIBI, SCENARIO_190_ANTI_DONG_ZHUO } from './scenarios';

/** 剧本体检 — the passes/forts added to the map after the scenario tables
 *  were written must inherit historically sensible owners (proximity fill
 *  in buildInitialCities + targeted table fixes). */
describe('scenario ownership sanity (新城就近归属)', () => {
  const owner = (scn: { cities: Array<{ id: string; ownerForceId: string | null }> }, id: string) =>
    scn.cities.find((c) => c.id === id)?.ownerForceId;

  it('190 反董卓 — the capital passes belong to 董卓, the coalition holds its line', () => {
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'hulao')).toBe('dong');
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'tongguan')).toBe('dong');
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'wuguan')).toBe('dong');
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'guandu')).toBe('cao');
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'liyang')).toBe('yuan-shao');
  });

  it('208 赤壁 — 曹操已下新野, 荆州未降, 江東守濡須', () => {
    expect(owner(SCENARIO_208_CHIBI, 'xinye')).toBe('cao');
    expect(owner(SCENARIO_208_CHIBI, 'fancheng')).toBe('liu-biao');
    expect(owner(SCENARIO_208_CHIBI, 'ruxu')).toBe('sun');
  });

  it('234 五丈原 — 街亭/陳倉歸魏, 劍閣/白水關/武都歸蜀', () => {
    expect(owner(SCENARIO_234_WUZHANG, 'jieting')).toBe('cao');
    expect(owner(SCENARIO_234_WUZHANG, 'chencang')).toBe('cao');
    expect(owner(SCENARIO_234_WUZHANG, 'jianmen')).toBe('liu-bei');
    expect(owner(SCENARIO_234_WUZHANG, 'baishuiguan')).toBe('liu-bei');
    expect(owner(SCENARIO_234_WUZHANG, 'wudu')).toBe('liu-bei');
  });

  it('deliberately unclaimed regions stay neutral (没有泛滥)', () => {
    // 交州 in 190 belongs to nobody — the fill must not flood it.
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'jiaozhi')).toBeNull();
    expect(owner(SCENARIO_190_ANTI_DONG_ZHUO, 'rinan')).toBeNull();
  });
});
