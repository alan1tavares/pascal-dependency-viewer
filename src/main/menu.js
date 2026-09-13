import { Menu } from "electron";

export function buildMenu(mainWindow, { performOpenFile, performOpenProject }) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open",
          click: async () => {
            const graph = await performOpenFile();
            if (graph) mainWindow.webContents.send("app:graph-loaded", graph);
          },
        },
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
