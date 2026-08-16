/**
 * 肖像取址 —— 本地 → 遠端 → 剪影,三段各自的責任寫在這裡。
 *
 * ## 為什麼需要它
 *
 * 肖像庫是 **206 MiB / 4402 檔**,而它其實是兩批人:
 *
 * | 名冊 | 人數 | 檔案 | 體積 |
 * |---|---|---|---|
 * | 三國(`OFFICER_IDS` + `TALENT_POOL_IDS`) | 802 | 1594 | **73.8 MiB** |
 * | 歷代(`HISTORICAL_OFFICER_IDS`,春秋到清) | 1409 | 2808 | **132.8 MiB** |
 *
 * 三國那批是遊戲的本體,一定得在包裡。歷代那批不同 —— 那些人物要玩家在
 * 設定裡**開啟朝代**才會進場(`buildHistoricalOfficers(enabledDynasties)`),
 * 預設一個都不出現。為了預設不會出現的人物,讓 iOS 包多背 132.8 MiB,
 * 直接把安裝包推過 App Store 的**蜂窩網路 200 MB 下載上限**。
 *
 * 所以 iOS 那份 build 用 `VITE_SLIM_PORTRAITS=1` 把歷代肖像留在外面
 * (見 vite.config.ts 的 `slimPortraits` 外掛),改成需要時才向遠端取。
 * 網頁版(Vercel)不設這個旗標,整套照舊 —— 它同時也就是遠端的來源。
 *
 * ## 三段回退
 *
 * 1. **本地** `BASE_URL + portraits/<id>.webp` —— 一律先試,包裡有就結束。
 * 2. **遠端** `VITE_PORTRAIT_CDN + portraits/<id>.webp` —— 只在設了那個變數
 *    且本地 404 時才試。離線就直接失敗,那是預期內的。
 * 3. **剪影** —— 程序生成的 SVG,本來就在(`ArchetypeSilhouette` / `Portrait`)。
 *    這一段**在這個改動之前就存在**,所以「歷代肖像不在包裡」最壞的結果
 *    是離線玩家看到剪影,而不是破圖或崩潰。
 *
 * ⚠ **不要把遠端當成必然可達的**。iOS 上玩家可能整局離線,而剪影是合格的
 * 終點 —— 這也是為什麼這裡不做重試、不做佇列:失敗一次就交給剪影。
 */

/** 遠端肖像來源(不設就沒有第二段,直接落到剪影)。結尾不帶斜線。 */
const CDN = (import.meta.env.VITE_PORTRAIT_CDN ?? '').replace(/\/$/, '');

export type PortraitVariant = 'head' | 'full';

function fileFor(id: string, variant: PortraitVariant): string {
  return variant === 'full' ? `portraits/${id}-full.webp` : `portraits/${id}.webp`;
}

/** 包內位址 —— 永遠先試這個。 */
export function portraitUrl(id: string, variant: PortraitVariant = 'head'): string {
  return `${import.meta.env.BASE_URL}${fileFor(id, variant)}`;
}

/** 遠端位址;沒設 `VITE_PORTRAIT_CDN` 時回 null(呼叫端據此跳過第二段)。 */
export function remotePortraitUrl(id: string, variant: PortraitVariant = 'head'): string | null {
  return CDN ? `${CDN}/${fileFor(id, variant)}` : null;
}

/** 這份 build 有沒有配遠端來源 —— 給要不要顯示「載入中」的地方用。 */
export const hasRemotePortraits = CDN !== '';
