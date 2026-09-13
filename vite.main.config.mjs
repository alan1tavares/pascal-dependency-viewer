import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    lib: {
      // O plugin do Electron Forge só preenche `entry`/`formats`
      // automaticamente quando `build.lib` está totalmente ausente aqui;
      // como precisamos customizar `fileName`, temos que fornecer o `lib`
      // inteiro (entry precisa bater com o `entry` deste target em
      // forge.config.js). src/main/index.js e src/preload/index.js
      // compartilham o mesmo basename (index); sem fixar o `fileName`, os
      // dois compilariam para o mesmo .vite/build/index.js, um
      // sobrescrevendo o outro.
      entry: 'src/main/index.js',
      fileName: () => 'main.js',
      formats: ['cjs'],
    },
  },
});
