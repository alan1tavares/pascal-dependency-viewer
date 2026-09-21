import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

import { buildMenu } from "./menu.js";
import { createKeySequence } from "./keySequence.js";
import { performOpenProject, registerProjectHandler } from "./ipc/project.js";
import { registerGraphHandler } from "./ipc/graph.js";
import { registerCommandsHandler } from "./ipc/commands.js";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

registerProjectHandler(ipcMain);
registerGraphHandler(ipcMain);
registerCommandsHandler(ipcMain, { performOpenProject });

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

  const handleKeySequence = createKeySequence({
    isMac: process.platform === "darwin",
    onComplete: () => mainWindow.webContents.send("app:show-open-recent"),
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (handleKeySequence(input)) event.preventDefault();
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
  createWindow();
  buildMenu(mainWindow, { performOpenProject });

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
