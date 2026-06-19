import { defineConfig } from 'vitest/config';

// Unit tests target the pure game-logic systems (no DOM needed), so we run
// them in the lightweight `node` environment. Test files live alongside the
// code as `*.test.ts` but are excluded from the app TS build (see
// tsconfig.app.json) so `npm run build` stays clean.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
