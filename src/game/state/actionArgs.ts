/**
 * 給 store action 餵**真的**參數 —— 不是猜的。
 *
 * ## 為什麼需要它
 *
 * `actionSweep.integration.test.ts` 只掃得動 57 個無參 action,其餘 315 個
 * 從來沒有被任何測試呼叫過(store 的函式覆蓋率因此長年停在兩成)。
 * 那支的檔頭說明了為什麼不掃有參的:**猜參數的測試會騙自己** ——
 * 傳錯型別讓 action 拋 TypeError,測試於是「抓到一個錯」,而那是測試造的。
 *
 * 這支解掉的正是那個前提:參數不用猜,**從活著的戰役裡取**。
 * `assignOfficer(officerId, cityId)` 拿的是這一局真的存在的武將與城,
 * 於是「拋例外」重新變成一個有意義的判準。
 *
 * ## 怎麼知道哪個 EntityId 是什麼
 *
 * 全庫 300 個參數都宣告成 `EntityId`,型別分辨不出城與武將 ——
 * **只有參數名說得出**(`cityId` / `officerId` / `armyId` / `targetForceId`)。
 * 所以這裡是一張**名字 → 取值器**的表,而簽名由
 * `scripts/store-action-signatures.ts` 從 `storeTypes.ts` 解出來。
 *
 * ## 解不出來就跳過,不要硬湊
 *
 * 物件型參數(`Scenario`、`TacticalBattle`、`Omit<Legion,'id'>`)、
 * 回呼、以及名字看不出種類的(`aId` / `id` / `targetId`)一律回 `undefined`,
 * 由呼叫端跳過並計入「未覆蓋」。**寧可少掃,也不要讓紅字是自己造的。**
 */
import type { GameState } from './gameState';
import { ITEMS_BY_ID } from '../data/items';
import { TRIBES } from '../data/tribes';
import { PROVINCES } from '../data/provinces';
import { FOREIGN_REALMS } from '../data/foreignRealms';
import { BUILDING_DEFS } from '../data/buildings';

export type ArgWorld = Pick<
  GameState,
  'cities' | 'officers' | 'forces' | 'armies' | 'playerForceId'
> & Partial<Pick<GameState, 'ports' | 'forts' | 'sites' | 'legions' | 'buildings' | 'lostItems' | 'destroyedItems'>>;

/** 這一局真的存在的東西,依「先自己人、再別人」排好,方便給出不同的兩個值。 */
export interface Pools {
  cities: string[];
  ownCities: string[];
  foreignCities: string[];
  officers: string[];
  ownOfficers: string[];
  foreignOfficers: string[];
  armies: string[];
  forces: string[];
  otherForces: string[];
  /* 下面這幾池有的來自資料表(道具/部族/州/異域/建築),有的來自這一局的
     state(港/塢/據點/軍團)—— 兩者都是「真的存在」,差別只在誰持有。 */
  items: string[];
  tribes: string[];
  provinces: string[];
  realms: string[];
  buildingDefs: string[];
  ports: string[];
  forts: string[];
  sites: string[];
  legions: string[];
}

export function buildPools(s: ArgWorld): Pools {
  const me = s.playerForceId;
  const cities = Object.keys(s.cities);
  const ownCities = cities.filter((c) => s.cities[c]?.ownerForceId === me);
  const officers = Object.values(s.officers)
    .filter((o) => o.status !== 'dead')
    .map((o) => o.id);
  const ownOfficers = Object.values(s.officers)
    .filter((o) => o.status !== 'dead' && o.forceId === me)
    .map((o) => o.id);
  const forces = Object.keys(s.forces);
  return {
    cities,
    ownCities,
    foreignCities: cities.filter((c) => s.cities[c]?.ownerForceId && s.cities[c]?.ownerForceId !== me),
    officers,
    ownOfficers,
    foreignOfficers: officers.filter((o) => !ownOfficers.includes(o)),
    armies: Object.keys(s.armies ?? {}),
    forces,
    otherForces: forces.filter((f) => f !== me),
    /*
     * ⚠ 道具池要扣掉**未尋獲**(`lostItems`)與**已回爐**(`destroyedItems`)。
     *
     * 第一版直接用資料表,於是把一件還躺在藏寶池裡的青龍偃月刀配給了武將 ——
     * 世界立刻不自洽(同一件孤品既無主又在人身上),而**那不是遊戲的錯**:
     * 兵器譜介面本來就不列未尋獲的道具,玩家按不到那一鍵。
     *
     * 這是「測試自己騙自己」的新形狀,值得單記一筆:
     * **每個參數各自合法,組合起來卻是遊戲產生不出來的狀態。**
     * 對策不是放寬不變量,是讓取值池真的等於「這一局現在拿得到的東西」。
     */
    items: Object.keys(ITEMS_BY_ID).filter(
      (id) => !(s.lostItems ?? []).some((li) => li.itemId === id)
        && !(s.destroyedItems ?? []).includes(id),
    ),
    tribes: TRIBES.map((t) => t.id),
    provinces: PROVINCES.map((p) => p.id),
    realms: FOREIGN_REALMS.map((r) => r.id),
    buildingDefs: BUILDING_DEFS.map((b) => b.id),
    ports: Object.keys(s.ports ?? {}),
    forts: Object.keys(s.forts ?? {}),
    sites: Object.keys(s.sites ?? {}),
    legions: Object.keys(s.legions ?? {}),
  };
}

/** 純字面量聯集(`'buy' | 'sell'`)—— 取第一個。含非字面量的就不算。 */
export function firstLiteral(type: string): string | undefined {
  const parts = type.split('|').map((p) => p.trim());
  if (!parts.length) return undefined;
  const lits = parts.filter((p) => /^'[^']*'$/.test(p));
  const rest = parts.filter((p) => !/^'[^']*'$/.test(p) && p !== 'null' && p !== 'undefined');
  if (!lits.length || rest.length) return undefined;
  return lits[0].slice(1, -1);
}

/**
 * 名字 → 取哪一池。第二個同類參數要拿**不同**的值 ——
 * `mergeArmyInto(a, a)`、`arrangeMarriage(x, x)` 這種自我配對會炸,
 * 而那是測試餵錯,不是遊戲的錯。
 */
const OFFICER_NAMES = /^(officerId|officerIds|targetOfficerId2?|agentOfficerId|attackerOfficerId|challengerId|championId|childOfficerId|companionId|defenderId|detachOfficerId|envoyId|envoyOfficerId|foeChampionId|foeVoiceId|heirId|loserId|masterId|mentorId|mentorOfficerId|myChampionId|myVoiceId|pupilId|slayerId|spyId|studentId|toOfficerId|tutorId|victimId|winnerId|finalistIds|captured|dead)$/;
const CITY_NAMES = /^(cityId|fromCityId|toCityId|targetCityId|myCityId|theirCityId|nearCityId|destinationCityId)$/;
const ARMY_NAMES = /^(armyId|targetArmyId|enemyArmyId|sourceArmyId|destArmyId|toArmyId)$/;
const FORCE_NAMES = /^(forceId|targetForceId|allyForceId|foeForceId|fromForceId|brokerForceId|cultForceId|grantorForceId|loserForceId|vassalForceId|winnerForceId|forceA|forceB|inviteeForceIds)$/;

const NUMBERS: Record<string, number> = {
  amount: 10, gold: 10, food: 10, iron: 5, medicine: 5, warhorses: 5, troops: 100,
  lootGold: 10, delta: 1, speed: 1, bearing: 0, seed: 1, index: 0, choiceIdx: 0,
  step: 1, forceCount: 2, level: 1, attackerLosses: 10, defenderLosses: 10,
  x: 0, y: 0, year: 200, slot: 0,
};

const STRINGS: Record<string, string> = {
  zh: '測試', en: 'test', text: 'test', label: 'test', name: 'test',
  motto: 'test', eraName: '建安', dynastyTitle: '魏', key: 'test-hint',
  dateStr: '2026-01-01', track: null as unknown as string,
};

/**
 * 給一個參數取值;取不到回 `undefined`(呼叫端就跳過整個 action)。
 * `nth` 是「這是本次呼叫裡第幾個同類參數」—— 用來避開自我配對。
 */
export function resolveArg(
  name: string,
  type: string,
  pools: Pools,
  nth: number,
): { ok: true; value: unknown } | { ok: false } {
  const isArray = /\[\]$/.test(type) || /^EntityId\[\]/.test(type);
  const pick = (arr: string[]): string | undefined => arr[nth % Math.max(1, arr.length)];

  if (OFFICER_NAMES.test(name)) {
    const pool = pools.ownOfficers.length >= 2 ? pools.ownOfficers : pools.officers;
    const v = pick(pool);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }
  if (CITY_NAMES.test(name)) {
    const pool = pools.ownCities.length >= 2 ? pools.ownCities : pools.cities;
    const v = pick(pool);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }
  if (ARMY_NAMES.test(name)) {
    const v = pick(pools.armies);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }
  if (FORCE_NAMES.test(name)) {
    // 敵對型的參數要給**別人**,不然「向自己宣戰」這種呼叫本身就不合法。
    const hostile = /^(targetForceId|foeForceId|loserForceId|vassalForceId|forceB)$/.test(name);
    const pool = hostile ? pools.otherForces : pools.forces;
    const v = pick(pool);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }

  // 資料表/本局 state 撐得起來的那幾類 id。
  const byPool: Array<[RegExp, keyof Pools]> = [
    [/^(itemId|gemId|recipeId)$/, 'items'],
    [/^(tribeId|tribeIdA|tribeIdB)$/, 'tribes'],
    [/^provinceId$/, 'provinces'],
    [/^realmId$/, 'realms'],
    [/^buildingId$/, 'buildingDefs'],
    [/^portId$/, 'ports'],
    [/^fortId$/, 'forts'],
    [/^siteId$/, 'sites'],
    [/^legionId$/, 'legions'],
  ];
  for (const [re, key] of byPool) {
    if (!re.test(name)) continue;
    const v = pick(pools[key] as string[]);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }

  const lit = firstLiteral(type);
  if (lit !== undefined) return { ok: true, value: lit };

  const base = type.replace(/\s*\|\s*(null|undefined)\s*$/, '').trim();
  if (base === 'boolean') return { ok: true, value: true };
  if (base === 'number') {
    const v = NUMBERS[name];
    return v === undefined ? { ok: false } : { ok: true, value: v };
  }
  if (base === 'string') {
    if (!(name in STRINGS)) return { ok: false };
    return { ok: true, value: STRINGS[name] };
  }
  return { ok: false };
}
