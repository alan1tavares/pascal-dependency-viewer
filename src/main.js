import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import path from "node:path";
import fs from "node:fs";
import started from "electron-squirrel-startup";

import {
  getUnitName,
  selectUsesFromSource,
} from "./model/parsePascalSource/index.js";
import mountDependenceGraphStructure from "./model/mountDependenceGraphStructure/index.js";
import parseDprSource from "./model/parseDprSource/index.js";
import expandDependencyGraph from "./model/expandDependencyGraph/index.js";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

async function performOpenFile() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Custom File Type", extensions: ["pas"] }],
  });
  const filePath = filePaths[0];
  if (!filePath) return null;

  const source = fs.readFileSync(filePath, "utf-8");
  const unitName = getUnitName(source);
  const listUses = selectUsesFromSource(source);
  return mountDependenceGraphStructure(unitName, listUses);
}

async function performOpenProject() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Delphi Project", extensions: ["dpr"] }],
  });
  const filePath = filePaths[0];
  if (!filePath) return null;

  const source = fs.readFileSync(filePath, "utf-8");
  const projectUnits = parseDprSource(source);
  const projectDir = path.dirname(filePath);
  return { projectUnits, projectDir };
}

function performExpandFromRootUnit({
  projectDir,
  projectUnit,
  projectUnits,
  scope,
}) {
  const filePath = path.resolve(projectDir, projectUnit.path);
  const source = fs.readFileSync(filePath, "utf-8");
  const unitName = getUnitName(source);
  const readFile = (relativePath) =>
    fs.readFileSync(path.resolve(projectDir, relativePath), "utf-8");
  return expandDependencyGraph(unitName, projectUnits, readFile, scope);
}

ipcMain.handle("openFile", () => performOpenFile());
ipcMain.handle("openProject", () => performOpenProject());
ipcMain.handle("expandFromRootUnit", (_event, args) =>
  performExpandFromRootUnit(args),
);

function buildMenu() {
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

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  buildMenu();
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
