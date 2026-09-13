import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    commonjsOptions: {
      // src/model/** (portado do projeto pré-migração) usa module.exports;
      // por padrão o Vite só aplica interop CJS a node_modules, então esses
      // arquivos locais precisam ser incluídos explicitamente para virarem
      // parte do bundle do processo main.
      include: [/src\/model\//, /node_modules/],
    },
  },
});
