import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    include: ['src/domain/test/**/*.test.js'],
    exclude: ['node_modules', 'node_modules_mac', 'node_modules_linux'],
    testTimeout: 5000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['/node_modules/', 'src/domain/test/'],
    },
  },
});
