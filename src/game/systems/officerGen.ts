import type { EntityId, Officer, OfficerStats } from '../types';
import { TRAIT_DEFS } from '../data/personality';
import type { PersonalityTrait } from '../types/personality';

/**
 * 新武將登場 — runtime generation of brand-new FICTIONAL officers, to refresh
 * the talent pool over a long campaign (opt-in via the `newOfficers` setting).
 * They arrive as 在野 (unsearched) free agents in the rootless pool, found by
 * 搜索人才 anywhere. Having no `deathYear`, they age out only at 60+ (and obey
 * the 武將壽命 / 虛構不老 settings just like other fictional officers).
 *
 * No reusable name pool exists in the data, so we hardcode a bilingual one.
 */

const SURNAMES: Array<[string, string]> = [
  ['王', 'Wang'], ['李', 'Li'], ['張', 'Zhang'], ['趙', 'Zhao'], ['陳', 'Chen'],
  ['楊', 'Yang'], ['周', 'Zhou'], ['吳', 'Wu'], ['徐', 'Xu'], ['孫', 'Sun'],
  ['馬', 'Ma'], ['朱', 'Zhu'], ['胡', 'Hu'], ['林', 'Lin'], ['何', 'He'],
  ['高', 'Gao'], ['羅', 'Luo'], ['鄭', 'Zheng'], ['梁', 'Liang'], ['謝', 'Xie'],
  ['韓', 'Han'], ['唐', 'Tang'], ['馮', 'Feng'], ['董', 'Dong'], ['程', 'Cheng'],
  ['袁', 'Yuan'], ['鄧', 'Deng'], ['傅', 'Fu'], ['沈', 'Shen'], ['彭', 'Peng'],
  ['蘇', 'Su'], ['盧', 'Lu'], ['蔣', 'Jiang'], ['蔡', 'Cai'], ['崔', 'Cui'],
];

const GIVEN_M: Array<[string, string]> = [
  ['文', 'Wen'], ['武', 'Wu'], ['德', 'De'], ['仁', 'Ren'], ['義', 'Yi'],
  ['忠', 'Zhong'], ['信', 'Xin'], ['勇', 'Yong'], ['剛', 'Gang'], ['毅', 'Yi'],
  ['軒', 'Xuan'], ['昊', 'Hao'], ['傑', 'Jie'], ['凱', 'Kai'], ['峰', 'Feng'],
  ['浩', 'Hao'], ['宇', 'Yu'], ['哲', 'Zhe'], ['龍', 'Long'], ['虎', 'Hu'],
  ['豪', 'Hao'], ['烈', 'Lie'], ['雄', 'Xiong'], ['威', 'Wei'], ['霆', 'Ting'],
  ['翰', 'Han'], ['啟', 'Qi'], ['明', 'Ming'], ['亮', 'Liang'], ['振', 'Zhen'],
  ['鵬', 'Peng'], ['飛', 'Fei'], ['鴻', 'Hong'], ['博', 'Bo'], ['睿', 'Rui'],
  ['謀', 'Mou'], ['策', 'Ce'], ['儒', 'Ru'], ['謙', 'Qian'], ['毅', 'Yi'],
];

const GIVEN_F: Array<[string, string]> = [
  ['婉', 'Wan'], ['玲', 'Ling'], ['嫣', 'Yan'], ['雪', 'Xue'], ['月', 'Yue'],
  ['蓉', 'Rong'], ['琳', 'Lin'], ['燕', 'Yan'], ['凝', 'Ning'], ['霜', 'Shuang'],
  ['瑤', 'Yao'], ['嬋', 'Chan'], ['姬', 'Ji'], ['媛', 'Yuan'], ['雲', 'Yun'],
];

type Archetype = 'warrior' | 'strategist' | 'administrator' | 'balanced';

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** A stat around `mid` ± spread, clamped to a believable band. */
function stat(mid: number, spread: number, rng: () => number): number {
  const v = Math.round(mid + (rng() * 2 - 1) * spread);
  return Math.max(22, Math.min(95, v));
}

function rollStats(archetype: Archetype, rng: () => number): OfficerStats {
  switch (archetype) {
    case 'warrior':
      return { leadership: stat(72, 14, rng), war: stat(80, 12, rng), intelligence: stat(45, 16, rng), politics: stat(40, 16, rng), charisma: stat(58, 16, rng) };
    case 'strategist':
      return { leadership: stat(64, 14, rng), war: stat(42, 16, rng), intelligence: stat(82, 12, rng), politics: stat(70, 14, rng), charisma: stat(62, 16, rng) };
    case 'administrator':
      return { leadership: stat(52, 16, rng), war: stat(35, 14, rng), intelligence: stat(72, 14, rng), politics: stat(82, 12, rng), charisma: stat(66, 16, rng) };
    default:
      return { leadership: stat(60, 18, rng), war: stat(60, 18, rng), intelligence: stat(60, 18, rng), politics: stat(60, 18, rng), charisma: stat(60, 18, rng) };
  }
}

/**
 * Build one fictional officer as a rootless 在野 free agent. `existingIds`
 * guards uniqueness (the caller passes the current officer-id set).
 */
export function generateFictionalOfficer(
  year: number,
  rng: () => number,
  existingIds: Set<string>,
): Officer {
  const female = rng() < 0.08;
  const [surnameZh, surnameEn] = pick(SURNAMES, rng);
  const givenPool = female ? GIVEN_F : GIVEN_M;
  // 1–2 given characters.
  const givenCount = rng() < 0.5 ? 1 : 2;
  const givens: Array<[string, string]> = [];
  for (let i = 0; i < givenCount; i++) givens.push(pick(givenPool, rng));
  const givenZh = givens.map((g) => g[0]).join('');
  const givenEn = givens.map((g, i) => (i === 0 ? g[1] : g[1].toLowerCase())).join('');
  const name = { zh: `${surnameZh}${givenZh}`, en: `${surnameEn} ${givenEn}` };

  const archetype = pick<Archetype>(['warrior', 'strategist', 'administrator', 'balanced'], rng);
  const stats = rollStats(archetype, rng);

  // 0–2 personality traits.
  const traits: PersonalityTrait[] = [];
  const traitRoll = rng();
  const traitCount = traitRoll < 0.4 ? 1 : traitRoll < 0.5 ? 2 : 0;
  for (let i = 0; i < traitCount; i++) {
    const id = pick(TRAIT_DEFS, rng).id as PersonalityTrait;
    if (!traits.includes(id)) traits.push(id);
  }

  // Unique id: gen-<year>-<base36 random>, retried on the rare collision.
  let id: EntityId = '';
  do {
    id = `gen-${year}-${Math.floor(rng() * 1_000_000).toString(36)}`;
  } while (existingIds.has(id));

  return {
    id,
    name,
    birthYear: year - (18 + Math.floor(rng() * 12)), // age 18–29 on arrival
    stats,
    loyalty: 0,
    locationCityId: null, // rootless 在野 pool — discoverable by search anywhere
    forceId: null,
    status: 'unsearched',
    task: null,
    equipment: [],
    skills: [],
    rank: 'captain',
    ...(traits.length > 0 ? { traits } : {}),
    ...(female ? { female: true } : {}),
  };
}
