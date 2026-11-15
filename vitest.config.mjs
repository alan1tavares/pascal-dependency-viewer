import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    globals: true,
    setupFiles: [],
    exclude: ['node_modules', 'node_modules_mac', 'node_modules_linux'],
    testTimeout: 5000,
    // Domínio e main rodam em Node; componentes Svelte do renderer, em jsdom
    // e com a condição `browser` (para importar o runtime de cliente do Svelte).
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/domain/test/**/*.test.js', 'src/main/test/**/*.test.js'],
        },
      },
      {
        extends: true,
        resolve: { conditions: ['browser'] },
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.js'],
          setupFiles: ['src/renderer/test/setup.js'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['/node_modules/', 'src/domain/test/'],
    },
  },
});
