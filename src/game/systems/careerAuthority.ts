import { RANK_COMMONER, RANK_LOWEST_OFFICE, RANK_RETAINER } from './career';

/**
 * 一代記的權限閘門 — 品階決定你能碰什麼。
 *
 * 這是「扮演一個人」和「扮演君主」的分界。在此之前 careerMode 只是換了個
 * 視角:玩家依然在批全國的公文,於是白身也能決定伐誰、任誰為州牧。
 *
 * 規則只有一條:<b>一道命令要多大的官才發得出,就要多大的官才看得見</b>。
 * 個人的事(習武、比試、游歷、翻書)永遠開放 —— 那是白身也做得了的;
 * 朝堂與國政則要一路爬上去。
 *
 * 閘門刻意設在 UI 的命令構造處,而不是散在三百個 store action 裡:
 * 命令面與頂欄選單都是同一份宣告渲染出來的,擋在那裡一次就夠。
 * store 只在少數幾個關鍵 action 上補斷言兜底。
 */

/** 沒有品階限制的一律標成這個 — 白身也能做。 */
export const RANK_ANY = RANK_COMMONER;

/**
 * 命令 id → 最低品階(數字越小官越大)。
 * 未列出的 id 視為 RANK_ANY,所以新增純個人功能不必動這張表。
 */
export const COMMAND_RANK: Record<string, number> = {
  // ── 白身可為 ── 個人的事
  deeds: RANK_ANY,
  'hall-of-fame': RANK_ANY,
  wiki: RANK_ANY,
  advisor: RANK_ANY,
  training: RANK_ANY,
  'debate-ground': RANK_ANY,
  'duel-hall': RANK_ANY,
  tournament: RANK_ANY,
  salon: RANK_ANY,
  armoury: RANK_ANY,
  battles: RANK_ANY,
  replays: RANK_ANY,
  settings: RANK_ANY,
  career: RANK_ANY,
  errands: RANK_ANY,      // 差事 — 白身唯一掙得到功績的路,絕不能擋

  // ── 部曲 ── 開始有人聽你的
  guard: RANK_RETAINER,
  formations: RANK_RETAINER,
  forge: RANK_RETAINER,

  // ── 九品 ── 有了官身才談得上受命出陣
  legions: RANK_LOWEST_OFFICE,

  // ── 大臣 ── 進得了朝堂
  titles: 7,
  kaoke: 7,
  letters: 7,

  // ── 太守 ── 手上有城才治得了民
  governors: 5,
  relief: 5,
  budget: 5,
  statecraft: 5,
  cities: 5,
  provinces: 5,
  convoys: 5,

  // ── 都督 ── 能自己拿主意
  schemes: 3,
  espionage: 3,
  persuasion: 3,

  // ── 一方諸侯 ── 代表一方說話
  relations: 1,
  courtm: 1,
  diplomacy: 1,
};

/** 這道命令,這個品階發得出來嗎? */
export function canCommand(id: string, rank: number): boolean {
  const need = COMMAND_RANK[id];
  return need === undefined ? true : rank <= need;
}

/**
 * 擋下來時給的說明 — 直接說「要什麼官才辦得了」,
 * 而不是灰掉一個按鈕讓人猜。
 */
export function commandGateHint(id: string): { zh: string; en: string } | null {
  const need = COMMAND_RANK[id];
  if (need === undefined || need >= RANK_COMMONER) return null;
  if (need >= RANK_RETAINER) return { zh: '需部曲以上', en: 'Requires Retainer' };
  if (need >= RANK_LOWEST_OFFICE) return { zh: '需九品官身', en: 'Requires office (9th rank)' };
  if (need >= 7) return { zh: '需大臣之位', en: 'Requires Minister' };
  if (need >= 5) return { zh: '需太守之位', en: 'Requires Governor' };
  if (need >= 3) return { zh: '需都督之位', en: 'Requires Viceroy' };
  return { zh: '需一方諸侯', en: 'Requires Grand Marshal' };
}

/** 這一階新開了哪些事 — 升品時報喜用,也給一代記面板列清單。 */
export function unlockedAtRank(rank: number): string[] {
  return Object.entries(COMMAND_RANK)
    .filter(([, need]) => need === rank)
    .map(([id]) => id);
}

/**
 * 城池指令的權限 — 內政與軍務分開問。
 *
 * 太守才管得了一城的內政;而軍務(徵兵、出陣)九品受命就辦得了,
 * 但只限自己駐紮的那座城 —— 不能隔著半個天下調別人的兵。
 */
export function cityAuthority(
  rank: number,
  isPlayerCity: boolean,
  isStationedHere: boolean,
): { domestic: boolean; military: boolean } {
  if (!isPlayerCity) return { domestic: false, military: false };
  return {
    domestic: rank <= 5,
    military: rank <= RANK_LOWEST_OFFICE && isStationedHere,
  };
}
