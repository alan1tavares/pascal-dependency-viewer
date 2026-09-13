import { Menu } from "electron";

export function buildMenu(mainWindow, { performOpenProject }) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open Project",
          click: async () => {
            const project = await performOpenProject();
            if (project)
              mainWindow.webContents.send("app:project-loaded", project);
          },
        },
      ],
    },
    { role: "viewMenu" },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
