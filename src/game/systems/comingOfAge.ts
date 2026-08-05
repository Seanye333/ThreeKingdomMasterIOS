import type { Officer } from '../types';

/**
 * 元服 —— 一個人要到多大,才可能被延攬入仕。
 *
 * ## 這條線本來就有,只是**只裝在一條路上**
 *
 * `handleSearch`(玩家親自「搜訪」)早就有 `MIN_RECRUIT_AGE = 15` 的判斷。
 * 可是人才池不只那一個入口 —— 薦舉、訪賢、遊俠現身、招降蠻王、求賢祭抽卡,
 * 沒有一條看年齡。於是自走體檢跑出這些畫面:
 *
 *  - 「朱儁軍於隆中臥龍崗延攬諸葛亮入幕」 —— 諸葛亮三歲(生於 181)
 *  - 「月旦評 — 盧植品姜維為上品令器」 —— 姜維要十八年後才出生
 *  - 「黃巾於潁川書塾延攬徐庶入幕」 —— 徐庶十四歲
 *  - 而張角一死,黃巾的繼位者是**三歲的諸葛亮**(十輪體檢裡出現一次)
 *
 * 184 年的盤上,八百名武將裡有 292 人尚未出生、另有 206 人未滿十五 ——
 * 六成二的人不該在池子裡,而只有一個入口擋著。所以把常數搬到這裡,由各條
 * 路徑共用同一條判斷。
 *
 * ## 為什麼是十五
 *
 * 沿用 `handleSearch` 原有的取值,不另立新標準。漢制男子二十而冠,但十五
 * 「成童」即可傅籍任事,史書裡少年出仕的例子也多在十五、十六上下。
 *
 * ## 純函式,不存狀態
 *
 * 兩條路都想過:給 Officer 加一個 `'unborn'` 狀態,或者開局就把未成年的人
 * 從 `state.officers` 裡拿掉。前者要動全庫八十餘處 `status !== 'dead'`,
 * 後者會讓家族、姻親、師承那些照 id 查人的系統查到空。
 *
 * 還試過第三條:開局不填未成年者的 `locationCityId`。**那條是錯的** ——
 * `handleSearch` 把「沒有本貫的人」當成四海皆可遇的後備池(rootless pool),
 * 抽掉本貫反而讓他們更容易被撿走。
 *
 * 現在這條由 `birthYear` 與當前年份現算,不存任何狀態,存檔不必遷移,
 * 時間一到人自己就進池子了。
 */
export const SERVICE_AGE = 15;

/** 這一年,此人夠不夠年紀出仕。生年不明者一律當作已成年(自訂武將、平民)。 */
export function hasComeOfAge(
  officer: Pick<Officer, 'birthYear'> | null | undefined,
  year: number,
): boolean {
  if (!officer) return false;
  if (!Number.isFinite(officer.birthYear)) return true;
  return year - officer.birthYear >= SERVICE_AGE;
}

/** 尚未出生 —— 用在文案上(「未生」與「尚幼」該說不同的話)。 */
export function isUnborn(
  officer: Pick<Officer, 'birthYear'> | null | undefined,
  year: number,
): boolean {
  if (!officer || !Number.isFinite(officer.birthYear)) return false;
  return officer.birthYear > year;
}
