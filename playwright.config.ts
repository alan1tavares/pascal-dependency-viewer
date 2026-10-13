import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
  },

  // O renderer roda isolado no Vite, com `window.pascalDependencyViewer`
  // stubado pelo teste: `npm start` sobe o Electron, que não serve HTTP.
  webServer: {
    command: 'npx vite --config vite.renderer.config.mjs --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
