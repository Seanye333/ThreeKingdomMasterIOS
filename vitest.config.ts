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
     * 單獨跑量到 1.7–2.1 秒,離 5 秒還有餘裕;但整套 314 個檔案並行時 CPU 被
     * 瓜分,同一條就會踩線。實測:同一份程式碼連跑五次,institutions 紅三次;
     * 隔一輪再跑,換成 seasonCadence 在 5112ms 爆掉。
     *
     * 這不是效能退步,是**逾時值訂得比機器的抖動還小**。放寬不弱化任何斷言
     * (斷言一個沒動),只是不再讓 CPU 排程決定測試紅不紅。
     *
     * ⚠ 看到這一族變紅時,先單獨跑一次(`npx vitest run <檔>`)。過了就是並行
     * 抖動,別急著歸因到剛改的東西 —— 我誤判過一次,而那一檔用的劇本跟我改的
     * 那張盤毫無關係。
     */
    testTimeout: 20_000,
  },
});
