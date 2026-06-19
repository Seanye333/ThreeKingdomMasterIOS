import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4317',
    viewport: { width: 1440, height: 900 },
    // three.js needs a GL context — SwiftShader covers headless runs.
    launchOptions: { args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npx vite preview --port 4317 --strictPort',
    port: 4317,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
