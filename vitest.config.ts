import { defineConfig } from 'vitest/config';

// Unit tests target the pure game-logic systems (no DOM needed), so we run
// them in the lightweight `node` environment. Test files live alongside the
// code as `*.test.ts` but are excluded from the app TS build (see
// tsconfig.app.json) so `npm run build` stays clean.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /*
     * 20 秒,不是預設的 5 秒。
     *
     * `src/game/state/*.integration.test.ts` 這一族跑的是**真的季結算** ——
     * 一條 seasons(6) 就是 54 次 endSeason,每次解算整盤(城、AI、事件、經濟)。
     * 健康的機器上 54 次約 0.5 秒,離 5 秒很遠;但整套 314 個檔案並行時 CPU
     * 被瓜分,踩線就開始零星發生。
     *
     * ⚠ **後來查出真兇,記在這裡免得重蹈**:那一天同一支計時腳本量到 8691ms
     * (健康時 521ms,十七倍),原因不是測試變重,是 **Playwright 漏了四十三個
     * chrome-headless-shell 進程**,其中四個 GPU 進程各吃 200% CPU ——
     * e2e 逾時被 force-kill 之後,worker 的 GPU 子進程活了下來。殺光之後
     * load average 從 41 掉回來,季結算立刻回到 521ms。
     *
     * 所以看到這一族變紅,順序是:
     *   ① `ps aux | grep chrome-headless-shell | wc -l` —— 有殘留就
     *      `pkill -f chrome-headless-shell`,再量一次
     *   ② 單獨跑那一檔(`npx vitest run <檔>`);過了就是並行抖動
     *   ③ 都不是,才去看剛改的東西
     * 我第一次遇到時跳過 ①②,直接懷疑自己剛改的資料 —— 而那一檔用的劇本跟
     * 我改的那張盤毫無關係。
     *
     * 放寬逾時本身仍然保留:它不弱化任何斷言(斷言一個沒動),只是不再讓
     * CPU 排程決定測試紅不紅。
     */
    testTimeout: 20_000,
  },
});
