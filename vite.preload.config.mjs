import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // src/main/index.js e src/preload/index.js compartilham o mesmo
        // basename (index); sem isso os dois compilariam para o mesmo
        // .vite/build/index.js, um sobrescrevendo o outro.
        entryFileNames: 'preload.js',
      },
    },
  },
});
