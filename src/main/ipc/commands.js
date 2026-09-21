import { runCommand } from "../commands.js";

export function registerCommandsHandler(ipcMain, { performOpenProject }) {
  ipcMain.handle("commands:run", (event, id) =>
    runCommand(id, { webContents: event.sender, performOpenProject }),
  );
}
