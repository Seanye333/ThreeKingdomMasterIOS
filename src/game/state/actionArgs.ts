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
import { HONORIFICS } from '../data/honorifics';

export type ArgWorld = Pick<
  GameState,
  'cities' | 'officers' | 'forces' | 'armies' | 'playerForceId'
> & Partial<Pick<GameState, 'ports' | 'forts' | 'sites' | 'legions' | 'buildings' | 'lostItems' | 'destroyedItems'
  | 'popupQueue' | 'annals' | 'battleHistory' | 'tacticalBattle'>>;

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
  honorifics: string[];
  /* 這幾個是**本局才會長出來**的東西(送了輜重才有輜重隊、開了游歷才有游歷)。
     開局為空,所以掃描跑兩趟:第一趟造出它們,第二趟才掃得到 recall/cancel 那一批。 */
  convoys: string[];
  expeditions: string[];
  musters: string[];
  templates: string[];
  customEvents: string[];
  wishes: string[];
  espionage: string[];
  /*
   * 物件型參數不用手捏 fixture ——**遊戲自己產出來的那一份最真**。
   * `pushPopup(event)` 收的 PopupEvent 就在 `popupQueue` 裡、
   * `recordAnnal(entry)` 收的 AnnalsEntry 就在 `annals` 裡。
   *
   * ⚠ 索引鍵是**型別名**,不是參數名。第一版用參數名,於是
   * `addCustomEvent(event: HistoricalEvent)` 拿到了 `pushPopup` 的 PopupEvent
   * ——兩個參數都叫 `event`,型別卻不同,當場拋
   * `Cannot read properties of undefined (reading 'en')`。
   * 同名不同型是常態,鍵一定要是型別。
   * 手捏的 fixture 會跟著型別漂,而且捏出來的多半是遊戲不會產生的形狀
   *(那正是青龍偃月刀與 dispatchExpedition 兩次踩到的東西)。
   */
  objects: Record<string, unknown[]>;
}

/** 這幾個集合在 store 裡有的是陣列有的是 map —— 一律取得出 id 列表。 */
function idsOf(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (x as { id?: string })?.id).filter((x): x is string => !!x);
  if (v && typeof v === 'object') return Object.keys(v as Record<string, unknown>);
  return [];
}

export function buildPools(s: ArgWorld): Pools {
  const me = s.playerForceId;
  const s2 = s as unknown as Record<string, unknown>;
  const cities = Object.keys(s.cities);
  const ownCitiesRaw = cities.filter((c) => s.cities[c]?.ownerForceId === me);
  /*
   * 城池池要**把相鄰的一對排到最前面**。
   *
   * 一堆 action 收的是 `(fromCityId, toCityId)` —— 運糧、游歷、調兵、開商路。
   * 隨便給兩座城,它們一律回 `{ ok:false, reason:'bad route' }`,
   * 於是「送出去」那條路徑一次也沒被走過,連帶「召回」那一批永遠沒有東西可召。
   * 給一對真的相鄰的城,`ok:false` 才會變成真的執行 —— 而執行才是要測的。
   */
  const ownSet = new Set(ownCitiesRaw);
  /*
   * ⚠ 光是「兩座城相鄰」還不夠 —— 參數之間要**互相對得上**。
   *
   * `dispatchExpedition(officerId, fromCityId, toCityId, mode)` 先是被
   * 「bad route」擋下(兩座城不相鄰),排好相鄰之後換成
   * 「officer not in this city」擋下 —— 因為武將池挑的人不在 from 那座城裡。
   * (而武將的位置欄位叫 `locationCityId` 不是 `cityId`;第一版寫錯,
   *  於是錨點永遠找不到人、靜靜地退回「只求相鄰」那條後路。)
   *
   * 這是青龍偃月刀那一課的第二次現身:**每個參數各自合法,組合起來仍然是
   * 遊戲不會產生的狀態**。所以錨點要一次挑定:
   * 一座我的城,它有一個我的武將在裡面,而且隔壁也是我的城。
   */
  const officersAt = new Map<string, string[]>();
  for (const o of Object.values(s.officers)) {
    if (o.status === 'dead' || o.forceId !== me) continue;
    const at = (o as { locationCityId?: string }).locationCityId;
    if (!at) continue;
    officersAt.set(at, [...(officersAt.get(at) ?? []), o.id]);
  }
  let pair: [string, string] | null = null;
  let anchorOfficer: string | null = null;
  for (const c of ownCitiesRaw) {
    if (!officersAt.get(c)?.length) continue;
    const n = (s.cities[c]?.adjacentCityIds ?? []).find((x) => ownSet.has(x) && x !== c);
    if (n) { pair = [c, n]; anchorOfficer = officersAt.get(c)![0]; break; }
  }
  // 退而求其次:找不到「有人駐守且隔壁也是我的」就只求相鄰。
  if (!pair) {
    for (const c of ownCitiesRaw) {
      const n = (s.cities[c]?.adjacentCityIds ?? []).find((x) => ownSet.has(x) && x !== c);
      if (n) { pair = [c, n]; break; }
    }
  }
  const ownCities = pair
    ? [pair[0], pair[1], ...ownCitiesRaw.filter((c) => c !== pair![0] && c !== pair![1])]
    : ownCitiesRaw;
  const officers = Object.values(s.officers)
    .filter((o) => o.status !== 'dead')
    .map((o) => o.id);
  const ownOfficersRaw = Object.values(s.officers)
    .filter((o) => o.status !== 'dead' && o.forceId === me)
    .map((o) => o.id);
  // 駐在錨點城裡的那個人排第一 —— 見上面的說明。
  const ownOfficers = anchorOfficer
    ? [anchorOfficer, ...ownOfficersRaw.filter((o) => o !== anchorOfficer)]
    : ownOfficersRaw;
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
    honorifics: HONORIFICS.map((h) => h.id),
    convoys: idsOf(s2.convoys),
    expeditions: idsOf(s2.expeditions),
    musters: idsOf(s2.musters),
    templates: idsOf(s2.commandTemplates),
    customEvents: idsOf(s2.customEvents),
    wishes: idsOf(s2.officerWishes),
    espionage: idsOf(s2.pendingEspionage),
    objects: {
      PopupEvent: (s.popupQueue ?? []) as unknown[],
      AnnalsEntry: (s.annals ?? []) as unknown[],
      BattleDetail: (s.battleHistory ?? []) as unknown[],
      TacticalBattle: s.tacticalBattle ? [s.tacticalBattle] : [],
    },
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
const OFFICER_NAMES = /^(aId|bId|cId|targetId|parentOfficerId|officerId|officerIds|targetOfficerId2?|agentOfficerId|attackerOfficerId|challengerId|championId|childOfficerId|companionId|defenderId|detachOfficerId|envoyId|envoyOfficerId|foeChampionId|foeVoiceId|heirId|loserId|masterId|mentorId|mentorOfficerId|myChampionId|myVoiceId|pupilId|slayerId|spyId|studentId|toOfficerId|tutorId|victimId|winnerId|finalistIds|captured|dead)$/;
const CITY_NAMES = /^(newTargetId|cityId|fromCityId|toCityId|targetCityId|myCityId|theirCityId|nearCityId|destinationCityId)$/;
const ARMY_NAMES = /^(playerArmyId|armyId|targetArmyId|enemyArmyId|sourceArmyId|destArmyId|toArmyId)$/;
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
  slotId: 'sweep-slot',
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
  aliases?: Map<string, string[]>,
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
    [/^honorificId$/, 'honorifics'],
    [/^targetConvoyId$/, 'convoys'],
    [/^opId$/, 'espionage'],
    [/^wishId$/, 'wishes'],
  ];
  for (const [re, key] of byPool) {
    if (!re.test(name)) continue;
    const v = pick(pools[key] as string[]);
    if (!v) return { ok: false };
    return { ok: true, value: isArray ? [v] : v };
  }

  // 物件型:拿遊戲自己產出來的那一份,**按型別名查**(見 Pools.objects 的說明)。
  const typeName = /(?:import\([^)]*\)\.)?([A-Za-z0-9_]+)\s*(?:\[\])?$/.exec(
    type.replace(/\s*\|\s*(null|undefined)\s*$/, '').trim(),
  )?.[1];
  const objPool = typeName ? pools.objects[typeName] : undefined;
  if (objPool) {
    const v = objPool[nth % Math.max(1, objPool.length)];
    if (v === undefined) return { ok: false };
    return { ok: true, value: v };
  }
  // `Partial<...>` 收得下空物件,而空 patch 本身就是合法的一次呼叫。
  if (/^Partial</.test(type.trim())) return { ok: true, value: {} };

  const lit = firstLiteral(type);
  if (lit !== undefined) return { ok: true, value: lit };

  /*
   * 型別別名回原始碼查:`import('../systems/law').LawSeverity` 與光禿禿的
   * `TaxRate` 都是別處宣告的字面量聯集。抄一份到這裡會跟著實作漂,
   * 所以查索引(`literalAliases()`)—— 型別改了取值自動跟著改,
   * 不再是字面量聯集就查不到、於是跳過。
   */
  const aliasName = /(?:import\([^)]*\)\.)?([A-Za-z0-9_]+)/.exec(
    type.replace(/\s*\|\s*(null|undefined)\s*$/, '').trim(),
  )?.[1];
  if (aliasName) {
    const vals = aliases?.get(aliasName);
    if (vals?.length) return { ok: true, value: vals[nth % vals.length] };
  }

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
