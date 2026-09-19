import { Menu, dialog } from "electron";

export function buildMenu(mainWindow, { performOpenProject }) {
  const template = [
    {
      label: "Arquivo",
      submenu: [
        {
          label: "Abrir Projeto",
          click: async () => {
            const project = await performOpenProject();
            if (project)
              mainWindow.webContents.send("app:project-loaded", project);
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
