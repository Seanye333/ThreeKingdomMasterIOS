/**
 * 紀年 — turning the engine's internal year into the year the player should see.
 *
 * ## 為什麼需要這層
 *
 * 引擎跑的是**一條共用的正數時間軸**,而且那是刻意的:所有歷代名將的
 * `birthYear` 統一設在 ~150(見 `historicalLifespans.ts` 檔頭),好讓每個人在
 * 184 年的三國盤上都是 25–45 歲;跨代盤(戰國/楚漢/隋唐)因此一律開在 178 年,
 * 同一套年齡、壽命、事件年限、季節推進才會一起成立。
 *
 * 代價是**顯示是錯的**:玩「戰國·長平之戰」,頂欄與標題畫面都寫「178 AD」。
 * 長平之戰是公元前 260 年。
 *
 * 所以這裡加一層純顯示的偏移:`eraOffset` 加到內部年份上就是史實年份,而且
 * 因為是加法,**時間往前推時顯示年份也跟著推**(打十年,長平盤就從前 260 走到
 * 前 250)。引擎那邊一個數字都不用動 —— 負年份會踩到的地雷(`abs % 4` 在 JS
 * 對負數回傳負值、`year - birthYear` 變成負歲數)全部避開。
 *
 * ## 年份 0 不存在
 *
 * 下面的偏移是照**史實慣例**寫的:換算出 −260 就是「前 260 年」,不是天文
 * 紀年的 −260(那等於前 261 年)。兩套慣例差一年,而我第一版把兩者混用,
 * 長平之戰因此顯示成「前 261 年」—— 測試當場咬到。
 *
 * 史實紀年沒有 0 年(前 1 年的下一年是公元 1 年),所以正確寫成的偏移**不會**
 * 產生 0。真的算出 0 時當作前 1 年處理,只是為了讓函式是全函數。跨過那一刀的
 * 盤目前也沒有 —— 楚漢最晚到前 202,離 0 還有兩百年。
 */

/** 每個劇本的紀年偏移:史實年份 = 內部年份 + eraOffset。缺省 0(三國盤)。 */
export const SCENARIO_ERA_OFFSET: Record<string, number> = {
  /* ─── 戰國 ── 內部一律 178 ─────────────────────────────────── */
  'scn-ws-seven':      -300 - 178,   // 七雄並立(諸王在位不完全重疊的群像盤)
  'scn-ws-changping':  -260 - 178,   // 長平之戰 前260
  'scn-ws-yueyi':      -284 - 178,   // 樂毅伐齊 前284
  'scn-ws-guiling':    -353 - 178,   // 桂陵之戰(圍魏救趙)前353
  'scn-ws-handan':     -259 - 178,   // 邯鄲之戰 前259–257
  'scn-ws-qin-unify':  -230 - 178,   // 秦滅六國 前230–221
  'scn-ws-shangyang':  -356 - 178,   // 商鞅變法 前356
  'scn-ws-yanying':    -279 - 178,   // 鄢郢之戰 前279–278
  'scn-ws-hangu':      -318 - 178,   // 五國攻秦(函谷關)前318
  'scn-ws-yique':      -293 - 178,   // 伊闕之戰 前293
  'scn-ws-yuyu':       -269 - 178,   // 閼與之戰 前269
  'scn-ws-tiandan':    -279 - 178,   // 田單復國 前279
  'scn-ws-weiwen':     -445 - 178,   // 魏文侯首霸 前445
  'scn-ws-qimin':      -288 - 178,   // 齊湣王稱帝 前288

  /* ─── 楚漢 ─────────────────────────────────────────────────── */
  'scn-ch-chuhan':     -206 - 178,   // 楚漢爭霸 前206
  'scn-ch-sanqin':     -206 - 178,   // 還定三秦 前206
  'scn-ch-pengcheng':  -205 - 178,   // 彭城之戰 前205
  'scn-ch-gaixia':     -202 - 178,   // 垓下之戰 前202
  'scn-ch-jingxing':   -205 - 178,   // 井陘之戰 前205
  'scn-ch-julu':       -207 - 178,   // 鉅鹿之戰 前207
  'scn-ch-daze':       -209 - 178,   // 大澤鄉起義 前209
  'scn-ch-weishui':    -204 - 178,   // 濰水之戰 前204

  /* ─── 隋唐 ─────────────────────────────────────────────────── */
  'scn-st-suiend':      617 - 178,   // 隋末群雄逐鹿 617
  'scn-st-qianshui':    618 - 178,   // 淺水原之戰 618
  'scn-st-bobi':        619 - 178,   // 柏壁之戰 619–620
  'scn-st-hulao':       621 - 178,   // 虎牢之戰 621
  'scn-st-anshi':       755 - 178,   // 安史之亂 755
};

export function eraOffsetFor(scenarioId: string | null | undefined): number {
  return (scenarioId && SCENARIO_ERA_OFFSET[scenarioId]) || 0;
}

/**
 * 內部年份 → 給玩家看的字串。
 *
 * `zh` 給「184 年 / 前 260 年」,`en` 給「184 AD / 260 BC」。
 */
export function formatEraYear(internalYear: number, offset: number, lang: 'zh' | 'en'): string {
  const y = internalYear + offset;
  if (y <= 0) {
    // 史實慣例:−260 即前 260 年。0 不該出現(見檔頭),真出現就當前 1 年。
    const bc = y === 0 ? 1 : -y;
    return lang === 'en' ? `${bc} BC` : `前 ${bc} 年`;
  }
  return lang === 'en' ? `${y} AD` : `${y} 年`;
}

/** 同上,但直接吃劇本 id。 */
export function formatScenarioYear(
  internalYear: number,
  scenarioId: string | null | undefined,
  lang: 'zh' | 'en',
): string {
  return formatEraYear(internalYear, eraOffsetFor(scenarioId), lang);
}
