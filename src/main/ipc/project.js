import { dialog } from "electron";
import path from "node:path";

import parseDprSource from "../../domain/parseDprSource/index.js";
import { readFile } from "../services/fileSystem.js";

export async function performOpenProject() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Delphi Project", extensions: ["dpr"] }],
  });
  const filePath = filePaths[0];
  if (!filePath) return null;

  const source = readFile(filePath);
  const projectUnits = parseDprSource(source);
  const projectDir = path.dirname(filePath);
  return { projectUnits, projectDir };
}

export function registerProjectHandler(ipcMain) {
  ipcMain.handle("openProject", () => performOpenProject());
}
