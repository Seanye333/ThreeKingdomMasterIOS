import { test, type Page } from '@playwright/test';
import { startCampaign, openMenu } from './helpers';

/**
 * App Store 送審截圖 —— 把「截圖」這一項從人工清單搬進工具鏈。
 *
 * ## 為什麼值得一支 spec
 *
 * App Store Connect 對每個尺寸級距各要 3–10 張,而遊戲改一次畫面就全部作廢。
 * 手動截等於每次改版都重來一輪;跑得起來的話,`npx playwright test appStoreShots`
 * 就重出全套。
 *
 * ## 尺寸是 Apple 規定的,不能自己挑
 *
 * 送審接受的是**點數對應的像素**,這裡用 dpr=1 直接出目標像素:
 *
 * | 級距 | 直向 | 用途 |
 * |---|---|---|
 * | 6.7"(iPhone 15 Pro Max) | 1290 × 2796 | 必填 |
 * | 6.5"(iPhone 11 Pro Max) | 1242 × 2688 | 必填 |
 * | 12.9" iPad Pro | 2048 × 2732 | 有 iPad 版才必填 |
 *
 * 橫向就是把兩個數對調 —— 這個遊戲兩個方向都能玩(manifest `orientation: any`),
 * 而大地圖橫著才好看,所以手機兩個級距各出**橫向**一套。
 *
 * ⚠ **出圖之後一定要人眼看過再送審。** 無頭 GL 與真機的算繪不完全一致
 * (城內畫面在無頭下曾經整片只剩天空,見專案筆記),這支只負責把圖產出來,
 * 不負責保證它好看。圖落在 `e2e/__appstore__/`。
 *
 * 預設不在 `npm run test:e2e` 的常規回歸裡跑很久 —— 它本來就是產物腳本
 * 而不是斷言腳本,所以只有一個 expect(頁面沒崩)。
 */

const SIZES = [
  { id: '6.7-landscape', w: 2796, h: 1290 },
  { id: '6.5-landscape', w: 2688, h: 1242 },
  { id: 'ipad-portrait', w: 2048, h: 2732 },
] as const;

/** 每張圖之前先讓畫面靜下來 —— 3D 場景要幾幀才進到穩定姿態。 */
async function settle(page: Page, ms = 2_500): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * 清場 —— 教學卡與彈窗讓開。
 *
 * 第一版沒做這件事,十五張圖右下角全壓著「教學 1/9 歡迎來到千古群英傳」,
 * 送審圖不能長這樣。走 store 而不是點按鈕:一次點擊只關掉一張,
 * 而一旬能疊好幾張(見 mapDragSmear.spec.ts 的同一段)。
 */
async function clearOverlays(page: Page): Promise<void> {
  await page.evaluate(() => {
    const s = (window as unknown as { __tkm?: { getState: () => Record<string, unknown> } }).__tkm;
    const st = s?.getState() as {
      dismissPopup?: () => void;
      setTutorialStep?: (n: null) => void;
      dismissReport?: () => void;
      dismissEvent?: () => void;
    } | undefined;
    for (let i = 0; i < 8; i++) { st?.dismissPopup?.(); st?.dismissReport?.(); st?.dismissEvent?.(); }
    st?.setTutorialStep?.(null);
  });
}

for (const size of SIZES) {
  test(`App Store 截圖 — ${size.id}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: size.w, height: size.h });
    /*
     * 教學任務卡是**另一個東西** —— `setTutorialStep(null)` 關的是那張大的
     * 導覽彈窗,而右上角那張「立足 1/3」是 TutorialTasks,它只認
     * localStorage 的 `tkm-tutorial-tasks-v1`。第一版清完彈窗之後那張還在,
     * 十五張圖的角落全寫著「教學」。
     *
     * 要在頁面載入前寫進去,所以用 addInitScript 而不是 evaluate。
     */
    await page.addInitScript(() => {
      try { localStorage.setItem('tkm-tutorial-tasks-v1', '1'); } catch { /* 無痕模式 */ }
    });
    await startCampaign(page);
    await clearOverlays(page);
    await settle(page, 4_000);

    const shot = async (name: string) =>
      page.screenshot({ path: `e2e/__appstore__/${size.id}/${name}.png` });

    // ① 大地圖 —— 這是遊戲的門面,放第一張。
    await shot('01-realm-map');

    /*
     * ② 武將 —— 立繪與數值,商店頁最能說明「這是什麼遊戲」的一張。
     *
     * 「武將」是**頂欄直接按鈕**,不是「人才」選單底下的項目 —— 那個選單裡
     * 是 結義/威名/武功/書信/名將榜/列傳。第一版寫成 openMenu('人才','武將'),
     * 於是十五張圖的第二張全是「選單展開著、什麼也沒點開」的大地圖。
     */
    await page.mouse.move(720, 300);
    await page.mouse.move(720, 30);
    await settle(page, 500);
    await page.getByRole('button', { name: '武將', exact: true }).first().click({ timeout: 20_000 }).catch(() => {});
    await settle(page);
    await shot('02-officers');
    await page.keyboard.press('Escape').catch(() => {});
    await settle(page, 800);

    // ③ 內政 · 國政 —— 城池經營那一面(選單項名以現行 spec 為準)。
    await openMenu(page, '內政', '國政').catch(() => {});
    await settle(page);
    await shot('03-governance');
    await page.keyboard.press('Escape').catch(() => {});
    await settle(page, 800);

    // ④ 外交 · 邦交 —— 群雄割據的那一面。
    await openMenu(page, '外交', '邦交').catch(() => {});
    await settle(page);
    await shot('04-diplomacy');
    await page.keyboard.press('Escape').catch(() => {});
    await settle(page, 800);

    // ⑤ 回到大地圖再走一旬,拿一張有兵鋒在動的圖。
    const endBtn = page.locator('button', { hasText: /[上下]旬|End/ }).last();
    await endBtn.click({ timeout: 20_000 }).catch(() => {});
    await settle(page, 3_000);
    await clearOverlays(page);
    await settle(page, 1_500);
    await shot('05-season-turn');
  });
}
