import { writable } from 'svelte/store';

/** Store com estado do projeto atual.
 *
 * Padrão:
 * 1. IPC Bridge (src/renderer/services/ipc.js) chama main process
 * 2. Main responde com dados de projeto
 * 3. Bridge chama projectStore.set(data) com a resposta
 * 4. Componentes Svelte observam a store e re-renderizam
 *
 * Valor inicial: null (sem projeto aberto ainda)
 * Estrutura quando carregado: { projectUnits: [], projectDir: string }
 */
export const projectStore = writable(null);
