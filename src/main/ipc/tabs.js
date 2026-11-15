// O renderer informa o tipo da Tab ativa a cada troca (`tabs:active-kind`,
// fire-and-forget); o main só usa isso para habilitar `Edição > Selecionar
// Método`, que vale apenas com uma Unit Tab ativa.

export function updateSelectMethodItem(menu, kind) {
  const item = menu && menu.getMenuItemById("selectMethod");
  if (item) item.enabled = kind === "unit";
}

export function registerActiveTabKindHandler(ipcMain, { getMenu }) {
  ipcMain.on("tabs:active-kind", (_event, kind) => {
    updateSelectMethodItem(getMenu(), kind);
  });
}
