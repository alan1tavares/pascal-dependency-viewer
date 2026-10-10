/** IPC Bridge — Encapsula chamadas inter-processo para o main.
 *
 * Padrão: Componentes Svelte chamam estas funções puras,
 * que invocam ipcRenderer.invoke internamente.
 * Respostas atualizam Stores (src/renderer/stores/).
 */

/** Abre um projeto (.dpr) no main process.
 * @param {string} path - Caminho do arquivo .dpr
 * @returns {Promise<{projectUnits: [], projectDir: string}>}
 */
export async function openProject(path) {
  return window.pascalDependencyViewer.openProject(path);
}

/** Lista projetos recentes do main process.
 * @returns {Promise<string[]>} Array de caminhos .dpr
 */
export async function listRecentProjects() {
  return window.pascalDependencyViewer.listRecentProjects();
}

/** Abre um projeto recente pelo caminho.
 * @param {string} path - Caminho do projeto recente
 * @returns {Promise<{projectUnits: [], projectDir: string}>}
 */
export async function openRecentProject(path) {
  return window.pascalDependencyViewer.openRecentProject(path);
}

/** Expande o grafo de dependências a partir de uma Root Unit.
 * @param {{rootUnit: string, projectDir: string}} args
 * @returns {Promise<{nodes: [], edges: []}>}
 */
export async function expandFromRootUnit(args) {
  return window.pascalDependencyViewer.expandFromRootUnit(args);
}

/** Executa um Command (ex: openProject, selectUnit, openRecent).
 * @param {string} id - Command ID
 * @returns {Promise<void>}
 */
export async function runCommand(id) {
  return window.pascalDependencyViewer.runCommand(id);
}
