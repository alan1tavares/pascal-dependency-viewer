import { Menu, dialog } from "electron";

export function buildMenu(
  mainWindow,
  { performOpenProject, platform = process.platform },
) {
  const openRecentHint = platform === "darwin" ? "⌘K R" : "Ctrl+K R";
  const template = [
    {
      label: "Arquivo",
      submenu: [
        {
          label: "Abrir projeto (.dpr)",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const project = await performOpenProject();
            if (project)
              mainWindow.webContents.send("app:project-loaded", project);
          },
        },
        {
          label: `Abrir recente  ${openRecentHint}`,
          click: () => {
            mainWindow.webContents.send("app:show-open-recent");
          },
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
          label: "Selecionar Unit",
          click: () => {
            mainWindow.webContents.send("app:show-root-unit-selection");
          },
        },
        {
          label: "Selecionar Método",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              message: "Selecionar Método ainda será implementado",
            });
          },
        },
      ],
    },
    { role: "viewMenu" },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
