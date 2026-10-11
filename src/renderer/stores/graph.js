import { writable } from 'svelte/store';

/** Store com o estado "já foi renderizado algum Dependency Graph nesta
 * sessão do app".
 *
 * Valor inicial: false.
 * `markGraphRendered()` é uma via só: uma vez true, nunca volta a false
 * (nem ao abrir um novo Projeto).
 */
export const graphRenderedStore = writable(false);

export function markGraphRendered() {
  graphRenderedStore.set(true);
}
