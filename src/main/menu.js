import { Menu } from "electron";

import { COMMANDS } from "../domain/commands/index.js";
import { runCommand } from "./commands.js";

const labelOf = (id) => COMMANDS.find((command) => command.id === id).label;

export function buildMenu(
  mainWindow,
  { performOpenProject, platform = process.platform },
) {
  const openRecentHint = platform === "darwin" ? "⌘K R" : "Ctrl+K R";
  const run = (id) =>
    runCommand(id, {
      webContents: mainWindow.webContents,
      performOpenProject,
    });
  const template = [
    {
      label: "Arquivo",
      submenu: [
        {
          label: labelOf("openProject"),
          accelerator: "CmdOrCtrl+O",
          click: () => run("openProject"),
        },
        {
          label: `${labelOf("openRecent")}  ${openRecentHint}`,
          click: () => run("openRecent"),
        },
        {
          label: "Sair",
          role: "quit",
        },
      ],
    },
    {
      label: "Edição",
      submenu: [
        {
          label: labelOf("selectUnit"),
          click: () => run("selectUnit"),
        },
        {
          // Habilitado só com uma Unit Tab ativa (`ipc/tabs.js`).
          id: "selectMethod",
          label: labelOf("selectMethod"),
          enabled: false,
          click: () => run("selectMethod"),
        },
      ],
    },
    {
      label: "Ferramentas",
      submenu: [
        {
          label: "Paleta de Comandos",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            mainWindow.webContents.send("app:show-command-palette");
          },
        },
      ],
    },
    { role: "viewMenu" },
    {
      label: "Ajuda",
      submenu: [
        {
          label: labelOf("showWelcome"),
          click: () => run("showWelcome"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}
